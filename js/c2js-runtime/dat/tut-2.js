// tut-2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/tut-2.lua.  Do NOT edit by hand.
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
      "noflip",
      "nomongen",
      "nodeathdrops",
      "noautosearch"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      "--------------\n|............|\n|............|\n|............|\n|............|\n|............|\n|............|\n--------------\n"
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          1,
          1,
          73,
          16
        ]
      },
      "lit"
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      {
        "dir": "up",
        "coord": [
          2,
          2
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "engraving",
    "args": [
      {
        "coord": [
          1,
          1
        ],
        "type": "burn",
        "text": null,
        "degrade": false
      }
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      {
        "type": "magic portal",
        "coord": [
          11,
          5
        ],
        "seen": true
      }
    ]
  },
  {
    "ns": "des",
    "method": "non_diggable",
    "args": []
  }
];
