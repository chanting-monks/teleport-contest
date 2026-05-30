// soko3-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/soko3-1.lua.  Do NOT edit by hand.
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
      "-----------       -----------\n|....|....|--     |.........|\n|....|......|     |.........|\n|.........|--     |.........|\n|....|....|       |.........|\n|-.---------      |.........|\n|....|.....|      |.........|\n|....|.....|      |.........|\n|..........|      |.........|\n|....|.....|---------------+|\n|....|......................|\n-----------------------------\n"
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      11,
      2
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "up",
      23,
      4
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      27,
      9
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
          28,
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
          28,
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
          28,
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
      3,
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      4,
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
      2
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      3,
      6
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
      3,
      7
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      3,
      8
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      2,
      9
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
      4,
      9
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      6,
      7
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      6,
      9
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
      8,
      10
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
      10,
      7
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
          11,
          10,
          27,
          10
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "rolling boulder",
      11,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      12,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      13,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      14,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      15,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      16,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      17,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      18,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      19,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      20,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      21,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      22,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      23,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      24,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      25,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "hole",
      26,
      10
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
