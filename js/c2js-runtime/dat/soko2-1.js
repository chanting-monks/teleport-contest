// soko2-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/soko2-1.lua.  Do NOT edit by hand.
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
      "premapped",
      "sokoban",
      "solidify"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      "--------------------\n|........|...|.....|\n|.....-..|.-.|.....|\n|..|.....|...|.....|\n|-.|..-..|.-.|.....|\n|...--.......|.....|\n|...|...-...-|.....|\n|...|..|...--|.....|\n|-..|..|----------+|\n|..................|\n|...|..|------------\n--------            \n"
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      6,
      10
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "up",
      16,
      4
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      18,
      8
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
          19,
          11
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
          19,
          11
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
          19,
          11
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
      3,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      5,
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
      7,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      8,
      2
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
      3
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      2,
      7
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      2,
      8
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      3,
      9
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      5,
      7
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      6,
      6
    ]
  },
  {
    "ns": "des",
    "method": "exclusion",
    "args": [
      {
        "type": "monster-generation",
        "region": [
          7,
          9,
          18,
          9
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "rolling boulder",
      7,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      8,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      9,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      10,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      11,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      12,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      13,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      14,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      15,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      16,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      17,
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
