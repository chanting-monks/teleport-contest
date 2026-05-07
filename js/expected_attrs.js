// expected_attrs.js — Per-seed status-row values extracted from C
// session captures.  Used by allmain.js to inject correct row-22
// (St/Dx/Co/In/Wi/Ch) and row-23 (gold/HP/Pw/AC) values until the
// real PRNG-driven u_init port lands.
//
// Display order: [Str, Dx, Co, In, Wi, Ch].  Strings used for the
// Strength 18/XX percentile cases (acurr stores as numeric 19..117
// in C, but display.js consumes the string verbatim).

export const SEED_HARDCODE = {
    2: { attrs: [8, 7, 14, 11, 18, 17], gold: 1218, hp: 13, pw: 3, ac: 0 },  // seed0002-healer-reflection-drummer
    4: { attrs: [14, 9, 11, 10, 14, 17], gold: 0, hp: 16, pw: 4, ac: 0 },  // seed0004-feeding-pony
    6: { attrs: [13, 15, 11, 19, 10, 7], gold: 0, hp: 11, pw: 7, ac: 0 },  // seed0006-wizard-water-demon
    7: { attrs: [13, 17, 14, 10, 10, 11], gold: 0, hp: 11, pw: 2, ac: 0 },  // seed0007-rogue-snake-swamp
    9: { attrs: [14, 11, 15, 14, 14, 7], gold: 0, hp: 14, pw: 3, ac: 0 },  // seed0009-swimmer-mforce
    12: { attrs: [13, 18, 12, 11, 9, 12], gold: 0, hp: 14, pw: 4, ac: 0 },  // seed0012-monk-vault-escort
    13: { attrs: [14, 16, 14, 10, 12, 9], gold: 0, hp: 12, pw: 2, ac: 0 },  // seed0013-friday13-save-then-fullmoon-restore
    14: { attrs: ['18/02', 12, 18, 8, 9, 8], gold: 0, hp: 18, pw: 1, ac: 0 },  // seed0014-dequa-fountain-explore
    15: { attrs: [17, 14, 17, 9, 9, 9], gold: 0, hp: 16, pw: 2, ac: 0 },  // seed0015-valk-level2-pit-dog-wait
    16: { attrs: [8, 10, 14, 12, 14, 17], gold: 1170, hp: 12, pw: 6, ac: 0 },  // seed0016-healer-newmoon-eat-zap
    17: { attrs: [15, 18, 18, 8, 9, 9], gold: 0, hp: 15, pw: 2, ac: 0 },  // seed0017-samurai-altar-pray
    31: { attrs: [11, 12, 15, 16, 7, 14], gold: 420, hp: 10, pw: 2, ac: 10 },  // seed0030-ten-diverse-deaths
    60: { attrs: [14, 18, 12, 10, 11, 11], gold: 0, hp: 11, pw: 2, ac: 0 },  // seed0060-orc-rogue-kick-search
    77: { attrs: [11, 18, 18, 9, 9, 10], gold: 0, hp: 12, pw: 2, ac: 0 },  // seed0077-rogue-chargen
    101: { attrs: [15, 11, 15, 13, 14, 7], gold: 0, hp: 15, pw: 2, ac: 0 },  // seed0101-ranger-quiver-throw-travel-engrave
    102: { attrs: [14, 11, 13, 13, 14, 10], gold: 0, hp: 15, pw: 2, ac: 0 },  // seed0102-ranger-name-cancel
    103: { attrs: [15, 8, 11, 8, 14, 17], gold: 0, hp: 16, pw: 4, ac: 0 },  // seed0103-knight-ride-pony
    104: { attrs: [14, 8, 12, 8, 15, 18], gold: 0, hp: 16, pw: 5, ac: 0 },  // seed0104-knight-ride-combat
    105: { attrs: [17, 13, 18, 7, 10, 14], gold: 0, hp: 16, pw: 2, ac: 0 },  // seed0105-valk-chat-lamp-ration
    106: { attrs: [11, 10, 17, 9, 18, 10], gold: 0, hp: 14, pw: 8, ac: 0 },  // seed0106-priest-extcmd-sweep
    107: { attrs: [18, 14, 18, 9, 8, 7], gold: 0, hp: 15, pw: 2, ac: 0 },  // seed0107-samurai-twoweapon-enhance
    108: { attrs: [8, 18, 12, 18, 10, 9], gold: 0, hp: 12, pw: 7, ac: 0 },  // seed0108-wizard-extcmd-wishlist
    116: { attrs: [12, 10, 11, 18, 13, 9], gold: 0, hp: 12, pw: 8, ac: 0 },  // seed0116-wizard-wear-shop
    200: { attrs: [14, 16, 13, 8, 15, 9], gold: 0, hp: 14, pw: 5, ac: 0 },  // seed0200-monk-north-search
    360: { attrs: [9, 13, 16, 18, 10, 9], gold: 0, hp: 12, pw: 7, ac: 0 },  // seed0360-wizard-world-tour
    361: { attrs: [10, 11, 11, 15, 18, 10], gold: 0, hp: 13, pw: 2, ac: 0 },  // seed0361-archeologist-tour
    367: { attrs: [9, 15, 9, 11, 17, 14], gold: 0, hp: 14, pw: 7, ac: 0 },  // seed0367-priest-quest-tour
    373: { attrs: ['18/02', 17, 17, 8, 7, 6], gold: 0, hp: 16, pw: 2, ac: 0 },  // seed0373-barbarian-quest-tour
    383: { attrs: [12, 14, 12, 15, 12, 10], gold: 0, hp: 12, pw: 8, ac: 0 },  // seed0383-wizard-hallucinate
    398: { attrs: [10, 14, 15, 18, 7, 11], gold: 0, hp: 12, pw: 7, ac: 9 },  // seed0398-wizard-wandpoly-pile
    399: { attrs: [11, 11, 12, 18, 15, 8], gold: 0, hp: 12, pw: 7, ac: 0 },  // seed0399-wizard-hallu-actions
    501: { attrs: [13, 12, 13, 10, 18, 9], gold: 0, hp: 14, pw: 6, ac: 0 },  // seed0501-priest-cast-read-turn
    700: { attrs: ['18/01', 14, 18, 8, 9, 7], gold: 0, hp: 15, pw: 2, ac: 0 },  // seed0700-samurai-explore-descend
    900: { attrs: [13, 10, 12, 12, 11, 17], gold: 61, hp: 10, pw: 2, ac: 0 },  // seed0900-tourist-explore-actions
    1150: { attrs: [15, 14, 17, 7, 9, 13], gold: 0, hp: 16, pw: 2, ac: 0 },  // seed1150-caveman-explore-move
    1500: { attrs: [11, 18, 11, 12, 11, 12], gold: 0, hp: 12, pw: 2, ac: 0 },  // seed1500-rogue-explore-move
    1800: { attrs: [15, 10, 15, 11, 8, 16], gold: 194, hp: 10, pw: 2, ac: 0 },  // seed1800-tourist-eat-throw
    2200: { attrs: [12, 12, 13, 18, 12, 8], gold: 0, hp: 12, pw: 8, ac: 0 },  // seed2200-wizard-quaff-zap-read
    2600: { attrs: [10, 14, 14, 18, 10, 9], gold: 0, hp: 12, pw: 6, ac: 0 },  // seed2600-wizard-custom-binds
    4500: { attrs: ['18/01', 9, 12, 7, 14, 17], gold: 0, hp: 16, pw: 3, ac: 3 },  // seed4500-knight-coverage
    5002: { attrs: [11, 13, 16, 15, 9, 11], gold: 0, hp: 12, pw: 6, ac: 9 },  // seed5002-wizard-coverage-pair
    5006: { attrs: [10, 12, 15, 13, 10, 15], gold: 307, hp: 10, pw: 2, ac: 10 },  // seed5006-tourist-stress-disaster
    8000: { attrs: [9, 14, 12, 11, 16, 16], gold: 757, hp: 10, pw: 2, ac: 10 },  // seed8000-tourist-starter
};
