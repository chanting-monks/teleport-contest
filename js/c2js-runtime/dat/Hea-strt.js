// Hea-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Hea-strt.lua.  Do NOT edit by hand.
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
      "noteleport",
      "hardfloor"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\nPPPP........PPPP.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.P..PPPPP......PPPPPPPP\nPPP..........PPPP...PPPPP.........................PPPP..PPPPP........PPPPPPP\nPP............PPPPPPPP..............................PPP...PPPP......PPPPPPPP\nP.....PPPPPPPPPPPPPPP................................PPPPPPPPPPPPPPPPPPPPPPP\nPPPP....PPPPPPPPPPPP...................................PPPPP.PPPPPPPPPPPPPPP\nPPPP........PPPPP.........-----------------------........PP...PPPPPPP.....PP\nPPP............PPPPP....--|.|......S..........S.|--.....PPPP.PPPPPPP.......P\nPPPP..........PPPPP.....|.S.|......-----------|S|.|......PPPPPP.PPP.......PP\nPPPPPP......PPPPPP......|.|.|......|...|......|.|.|.....PPPPPP...PP.......PP\nPPPPPPPPPPPPPPPPPPP.....+.|.|......S.\\.S......|.|.+......PPPPPP.PPPP.......P\nPPP...PPPPP...PPPP......|.|.|......|...|......|.|.|.......PPPPPPPPPPP.....PP\nPP.....PPP.....PPP......|.|S|-----------......|.S.|......PPPPPPPPPPPPPPPPPPP\nPPP..PPPPP...PPPP.......--|.S..........S......|.|--.....PPPPPPPPP....PPPPPPP\nPPPPPPPPPPPPPPPP..........-----------------------..........PPPPP..........PP\nPPPPPPPPPPPPPPPPP........................................PPPPPP............P\nPPP.............PPPP...................................PPP..PPPP..........PP\nPP...............PPPPP................................PPPP...PPPP........PPP\nPPP.............PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP....PPPPPP\nPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n"
    ]
  },
  {
    "ns": "des",
    "method": "replace_terrain",
    "args": [
      {
        "region": [
          1,
          1,
          74,
          18
        ],
        "fromterrain": "P",
        "toterrain": ".",
        "chance": 10
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
          0,
          0,
          75,
          19
        ]
      },
      "lit"
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      37,
      9
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          4,
          12,
          4,
          12
        ],
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "altar",
    "args": [
      {
        "x": 32,
        "y": 9,
        "align": "neutral",
        "type": "altar"
      }
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      24,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      26,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      27,
      12
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      28,
      13
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      35,
      7
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      35,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      39,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      39,
      13
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      46,
      7
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      47,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      48,
      12
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      50,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "Hippocrates",
        "coord": [
          37,
          10
        ],
        "inventory": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "chest",
      37,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      29,
      8
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      29,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      29,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      29,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      40,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      40,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      40,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "attendant",
      40,
      13
    ]
  },
  {
    "ns": "des",
    "method": "non_diggable",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          0,
          0,
          75,
          19
        ]
      }
    ]
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
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "rabid rat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "shark"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      ";"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "D",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "D",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "D",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "D",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "D",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "S",
        "peaceful": 0
      }
    ]
  }
];
