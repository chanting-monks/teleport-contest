// soko4-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/soko4-1.lua.  Do NOT edit by hand.
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
      "hardfloor",
      "premapped",
      "sokoban",
      "solidify"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      "------  ----- \n|....|  |...| \n|....----...| \n|...........| \n|..|-|.|-|..| \n---------|.---\n|......|.....|\n|..----|.....|\n--.|   |.....|\n |.|---|.....|\n |...........|\n |..|---------\n ----         \n"
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          6,
          4,
          6,
          4
        ],
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "up",
      6,
      6
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
          13,
          12
        ]
      },
      "lit"
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
          13,
          12
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "non_passwall",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          0,
          0,
          13,
          12
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      2,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      2,
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      10,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      9,
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      10,
      4
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      8,
      7
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      9,
      8
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      9,
      9
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      8,
      10
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      10,
      10
    ]
  },
  {
    "ns": "des",
    "method": "exclusion",
    "args": [
      {
        "type": "monster-generation",
        "region": [
          1,
          6,
          7,
          11
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      4,
      6
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      2,
      6
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      2,
      7
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      2,
      8
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "rolling boulder",
      2,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      2,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      3,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      4,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      5,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      6,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "rolling boulder",
      7,
      10
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "scroll of earth",
      2,
      11
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "scroll of earth",
      3,
      11
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "class": "%"
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "class": "%"
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "class": "%"
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "class": "%"
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "class": "="
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "class": "/"
      }
    ]
  }
];
