// Wiz-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Wiz-strt.lua.  Do NOT edit by hand.
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
      "............................................................................\n.....................C....CC.C........................C.....................\n..........CCC.....................CCC.......................................\n........CC........-----------.......C.C...C...C....C........................\n.......C.....---------------------...C..C..C..C.............................\n......C..C...------....\\....------....C.....C...............................\n........C...||....|.........|....||.........................................\n.......C....||....|.........+....||.........................................\n.......C...||---+--.........|....|||........................................\n......C....||...............|--S--||........................................\n...........||--+--|++----|---|..|.SS..........C......C......................\n........C..||.....|..|...|...|--|.||..CC..C.....C..........C................\n.......C...||.....|..|.--|.|.|....||.................C..C...................\n.....C......||....|..|.....|.|.--||..C..C..........C...........}}}..........\n......C.C...||....|..-----.|.....||...C.C.C..............C....}}}}}}........\n.........C...------........|------....C..C.....C..CC.C......}}}}}}}}}}}.....\n.........CC..---------------------...C.C..C.....CCCCC.C.......}}}}}}}}......\n.........C........-----------..........C.C.......CCC.........}}}}}}}}}......\n..........C.C.........................C............C...........}}}}}........\n......................CCC.C.................................................\n"
    ]
  },
  {
    "ns": "des",
    "method": "replace_terrain",
    "args": [
      {
        "region": [
          0,
          0,
          75,
          19
        ],
        "fromterrain": ".",
        "toterrain": "C",
        "chance": 10
      }
    ]
  },
  {
    "ns": "des",
    "method": "replace_terrain",
    "args": [
      {
        "region": [
          13,
          5,
          33,
          15
        ],
        "fromterrain": "C",
        "toterrain": ".",
        "chance": 100
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
    "method": "region",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          35,
          0,
          49,
          3
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
        "__call": "selection.area",
        "args": [
          43,
          12,
          49,
          16
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
          19,
          11,
          33,
          15
        ],
        "lit": 0,
        "type": "ordinary",
        "irregular": 1
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
          30,
          10,
          31,
          10
        ]
      },
      "unlit"
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      30,
      10
    ]
  },
  {
    "ns": "des",
    "method": "terrain",
    "args": [
      [
        63,
        6
      ],
      "."
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          63,
          6,
          63,
          6
        ],
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      31,
      9
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      16,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      28,
      7
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      34,
      10
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
      "closed",
      15,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      19,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      20,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "Neferet the Green",
        "coord": [
          23,
          5
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
      24,
      5
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      30,
      7
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      24,
      6
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      15,
      6
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      15,
      12
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      26,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      27,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      19,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "apprentice",
      20,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel",
      62,
      14
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel",
      69,
      15
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "giant eel",
      67,
      17
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
      {
        "class": "B",
        "x": 60,
        "y": 9,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "W",
        "x": 60,
        "y": 10,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 60,
        "y": 11,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 60,
        "y": 12,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "i",
        "x": 60,
        "y": 13,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 61,
        "y": 10,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 61,
        "y": 11,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 61,
        "y": 12,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 35,
        "y": 3,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "i",
        "x": 35,
        "y": 17,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 36,
        "y": 17,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 34,
        "y": 16,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "i",
        "x": 34,
        "y": 17,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "W",
        "x": 67,
        "y": 2,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
        "x": 10,
        "y": 19,
        "peaceful": 0
      }
    ]
  }
];
