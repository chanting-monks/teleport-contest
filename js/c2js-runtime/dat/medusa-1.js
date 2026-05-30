// medusa-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/medusa-1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: templatic.
export default [
  {
    "ns": "des",
    "method": "level_init",
    "args": [
      {
        "style": "solidfill",
        "fg": " "
      }
    ]
  },
  {
    "ns": "des",
    "method": "level_flags",
    "args": [
      "mazelevel",
      "noteleport"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      "}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}.}}}}}..}}}}}......}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}....}}}...}}}}}\n}...}}.....}}}}}....}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}...............}\n}....}}}}}}}}}}....}}}..}}}}}}}}}}}.......}}}}}}}}}}}}}}}}..}}.....}}}...}}\n}....}}}}}}}}.....}}}}..}}}}}}.................}}}}}}}}}}}.}}}}.....}}...}}\n}....}}}}}}}}}}}}.}}}}.}}}}}}.-----------------.}}}}}}}}}}}}}}}}}.........}\n}....}}}}}}}}}}}}}}}}}}.}}}...|...............S...}}}}}}}}}}}}}}}}}}}....}}\n}.....}.}}....}}}}}}}}}.}}....--------+--------....}}}}}}..}}}}}}}}}}}...}}\n}......}}}}..}}}}}}}}}}}}}........|.......|........}}}}}....}}}}}}}}}}}}}}}\n}.....}}}}}}}}}}}}}}}}}}}}........|.......|........}}}}}...}}}}}}}}}.}}}}}}\n}.....}}}}}}}}}}}}}}}}}}}}....--------+--------....}}}}}}.}.}}}}}}}}}}}}}}}\n}......}}}}}}}}}}}}}}}}}}}}...S...............|...}}}}}}}}}}}}}}}}}.}}}}}}}\n}.......}}}}}}}..}}}}}}}}}}}}.-----------------.}}}}}}}}}}}}}}}}}....}}}}}}\n}........}}.}}....}}}}}}}}}}}}.................}}}}}..}}}}}}}}}.......}}}}}\n}.......}}}}}}}......}}}}}}}}}}}}}}.......}}}}}}}}}.....}}}}}}...}}..}}}}}}\n}.....}}}}}}}}}}}.....}}}}}}}}}}}}}}}}}}}}}}.}}}}}}}..}}}}}}}}}}....}}}}}}}\n}}..}}}}}}}}}}}}}....}}}}}}}}}}}}}}}}}}}}}}...}}..}}}}}}}.}}.}}}}..}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n"
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          0,
          0,
          74,
          19
        ]
      },
      "lit"
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          31,
          7,
          45,
          7
        ]
      },
      "unlit"
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          35,
          9,
          41,
          10
        ],
        "lit": 0,
        "type": "ordinary",
        "arrival_room": true
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          31,
          12,
          45,
          12
        ]
      },
      "unlit"
    ]
  },
  {
    "ns": "des",
    "method": "teleport_region",
    "args": [
      {
        "region": [
          1,
          1,
          5,
          17
        ],
        "dir": "down"
      }
    ]
  },
  {
    "ns": "des",
    "method": "teleport_region",
    "args": [
      {
        "region": [
          26,
          4,
          50,
          15
        ],
        "dir": "up"
      }
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "up",
      5,
      14
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      36,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      46,
      7
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      38,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      38,
      11
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      30,
      12
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          1,
          0,
          79,
          20
        ],
        "exclude": [
          30,
          6,
          46,
          13
        ],
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "non_diggable",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          30,
          6,
          46,
          13
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 36,
        "y": 10,
        "buc": "uncursed",
        "montype": "knight",
        "historic": 1,
        "male": 1,
        "name": "Perseus",
        "contents": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "object",
    "args": []
  },
  {
    "ns": "des",
    "method": "trap",
    "args": []
  },
  {
    "ns": "des",
    "method": "trap",
    "args": []
  },
  {
    "ns": "des",
    "method": "trap",
    "args": []
  },
  {
    "ns": "des",
    "method": "trap",
    "args": []
  },
  {
    "ns": "des",
    "method": "trap",
    "args": []
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "board",
      38,
      7
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "board",
      38,
      12
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "Medusa",
        "x": 36,
        "y": 10,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel",
      11,
      6
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel",
      23,
      13
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel",
      29,
      2
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "jellyfish",
      2,
      2
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "jellyfish",
      0,
      8
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "jellyfish",
      4,
      18
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "water troll",
      51,
      3
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "water troll",
      64,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "x": 38,
        "y": 7
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "x": 38,
        "y": 12
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  }
];
