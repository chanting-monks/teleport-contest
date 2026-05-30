// soko4-2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/soko4-2.lua.  Do NOT edit by hand.
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
      "-------- ------\n|.|....|-|....|\n|.|-..........|\n|.||....|.....|\n|.||....|.....|\n|.|-----|.-----\n|.|    |......|\n|.-----|......|\n|.............|\n|..|---|......|\n----   --------\n"
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          3,
          1,
          3,
          1
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
      1,
      1
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
          14,
          10
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
          14,
          10
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
          14,
          10
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      5,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      6,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      6,
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      7,
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      9,
      5
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      10,
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      11,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      12,
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      7,
      8
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      8,
      8
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
      10,
      8
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
          1,
          1,
          9
        ]
      }
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
          8,
          7,
          9
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      1,
      2
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      1,
      3
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      1,
      4
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      1,
      5
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      1,
      6
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "rolling boulder",
      1,
      7
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      1,
      8
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
      "pit",
      3,
      8
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      4,
      8
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      5,
      8
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "rolling boulder",
      6,
      8
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "scroll of earth",
      1,
      9
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "scroll of earth",
      2,
      9
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
