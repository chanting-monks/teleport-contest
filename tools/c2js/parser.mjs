// parser.mjs — wrapper around `clang -Xclang -ast-dump=json`.
//
// Returns:
//   { tu, decls, comments, source }
//
// `tu`       — the full TranslationUnitDecl JSON
// `decls`    — top-level declarations from the input file (system header
//              decls filtered out)
// `comments` — array of {start, end, line, text, kind: 'block'|'line'}
//              extracted from the source text directly (clang's AST
//              drops comments)
// `source`   — the full source text, kept so callers can take substrings
//              by offset (for trailing-line comments etc.)

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

export function parseCFile(cPath, { extraFlags = [] } = {}) {
    const source = readFileSync(cPath, 'utf8');
    const result = spawnSync(
        'clang',
        ['-Xclang', '-ast-dump=json', '-fsyntax-only', ...extraFlags, cPath],
        { encoding: 'utf8', stdio: 'pipe', maxBuffer: 200 * 1024 * 1024 },
    );
    if (result.status !== 0) {
        const err = (result.stderr || '').trim() || `clang exited ${result.status}`;
        const e = new Error(`parse failed for ${cPath}: ${err}`);
        e.stderr = result.stderr;
        throw e;
    }
    const tu = JSON.parse(result.stdout);

    // Filter top-level decls to those declared in the input file.
    // clang's "loc" carries file inheritance: child nodes inherit parent
    // file unless they specify their own.  At the TU level, we walk and
    // track the most recent file we saw.
    const fname = basename(cPath);
    const decls = [];
    let lastFile = null;
    for (const node of tu.inner || []) {
        const file = node.loc?.file ?? lastFile;
        if (file) lastFile = file;
        if (file && (file.endsWith('/' + fname) || file === fname || file.endsWith(cPath))) {
            decls.push(node);
        }
    }

    const comments = extractComments(source);
    return { tu, decls, comments, source, path: cPath };
}

// Lex out /* */ block comments and // line comments from C source.
// Skips comment markers inside string and char literals.
export function extractComments(src) {
    const out = [];
    const n = src.length;
    let i = 0;
    let line = 1;
    while (i < n) {
        const ch = src[i];
        if (ch === '\n') { line++; i++; continue; }
        if (ch === '"' || ch === "'") {
            // Skip the literal.
            const quote = ch;
            i++;
            while (i < n && src[i] !== quote) {
                if (src[i] === '\\' && i + 1 < n) {
                    if (src[i + 1] === '\n') line++;
                    i += 2;
                    continue;
                }
                if (src[i] === '\n') line++;
                i++;
            }
            if (i < n) i++; // closing quote
            continue;
        }
        if (ch === '/' && src[i + 1] === '/') {
            const start = i;
            const startLine = line;
            const stop = src.indexOf('\n', i);
            const end = stop === -1 ? n : stop;
            out.push({
                start, end,
                line: startLine,
                text: src.slice(start, end),
                kind: 'line',
            });
            i = end;
            continue;
        }
        if (ch === '/' && src[i + 1] === '*') {
            const start = i;
            const startLine = line;
            const stop = src.indexOf('*/', i + 2);
            const end = stop === -1 ? n : stop + 2;
            const text = src.slice(start, end);
            // count newlines inside the comment for line tracking
            for (let k = start; k < end; k++) if (src[k] === '\n') line++;
            out.push({
                start, end,
                line: startLine,
                text,
                kind: 'block',
            });
            i = end;
            continue;
        }
        i++;
    }
    return out;
}

// Returns the comment(s) immediately above the given line (within `gap`
// blank lines between the comment and the line).  Used to attach
// docstrings to functions / decls.
export function commentsBefore(comments, line, { gap = 1 } = {}) {
    const out = [];
    for (let i = comments.length - 1; i >= 0; i--) {
        const c = comments[i];
        const cEndLine = c.line + (c.text.match(/\n/g) || []).length;
        if (cEndLine + gap >= line && cEndLine < line) {
            out.unshift(c);
            line = c.line;
        } else if (cEndLine < line) {
            break;
        }
    }
    return out;
}
