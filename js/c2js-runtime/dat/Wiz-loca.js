// Wiz-loca.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Wiz-loca.lua.  Do NOT edit by hand.
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
      "hardfloor"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      ".............        .......................................................\n..............       .............}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}.......\n..............      ..............}.................................}.......\n..............      ..............}.-------------------------------.}.......\n...............     .........C....}.|.............................|.}.......\n...............    ..........C....}.|.---------------------------.|.}.......\n...............    .........CCC...}.|.|.........................|.|.}.......\n................   ....C....CCC...}.|.|.-----------------------.|.|.}.......\n.......C..C.....  .....C....CCC...}.|.|.|......+.......+......|.|.|.}.......\n.............C..CC.....C....CCC...}.|.|.|......|-------|......|.|.|.}.......\n................   ....C....CCC...}.|.|.|......|.......|......|.|.|.}.......\n......C..C.....    ....C....CCC...}.|.|.|......|-------|......|.|.|.}.......\n............C..     ...C....CCC...}.|.|.|......+.......+......|.|.|.}.......\n........C......    ....C....CCC...}.|.|.-----------------------.|.|.}.......\n....C......C...     ........CCC...}.|.|.........................|.|.}.......\n......C..C....      .........C....}.|.---------------------------.|.}.......\n..............      .........C....}.|.............................|.}.......\n.............       ..............}.-------------------------------.}.......\n.............        .............}.................................}.......\n.............        .............}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}.......\n.............        .......................................................\n"
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
          30,
          20
        ],
        "fromterrain": ".",
        "toterrain": "C",
        "chance": 15
      }
    ]
  },
  {
    "ns": "des",
    "method": "replace_terrain",
    "args": [
      {
        "region": [
          68,
          0,
          75,
          20
        ],
        "fromterrain": ".",
        "toterrain": "}",
        "chance": 25
      }
    ]
  },
  {
    "ns": "des",
    "method": "replace_terrain",
    "args": [
      {
        "region": [
          34,
          1,
          68,
          19
        ],
        "fromterrain": "}",
        "toterrain": ".",
        "chance": 2
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
          20
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
        "region": [
          37,
          4,
          65,
          16
        ],
        "lit": 0,
        "type": "ordinary",
        "irregular": 1,
        "contents": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          39,
          6,
          63,
          14
        ],
        "lit": 0,
        "type": "ordinary",
        "irregular": 1,
        "contents": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          41,
          8,
          46,
          12
        ],
        "lit": 1,
        "type": "ordinary",
        "irregular": 1,
        "contents": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          56,
          8,
          61,
          12
        ],
        "lit": 1,
        "type": "ordinary",
        "irregular": 1,
        "contents": null
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
          48,
          8,
          54,
          8
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
          48,
          12,
          54,
          12
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
          48,
          10,
          54,
          10
        ],
        "lit": 0,
        "type": "ordinary",
        "irregular": 1,
        "contents": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      55,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      55,
      12
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      47,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      47,
      12
    ]
  },
  {
    "ns": "des",
    "method": "terrain",
    "args": [
      [
        3,
        17
      ],
      "."
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "up",
      3,
      17
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      48,
      10
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
          20
        ]
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
    "args": [
      "spiked pit",
      24,
      2
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "spiked pit",
      7,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "spiked pit",
      23,
      5
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "spiked pit",
      26,
      19
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "spiked pit",
      72,
      2
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "spiked pit",
      72,
      12
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "falling rock",
      45,
      16
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "falling rock",
      65,
      13
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "falling rock",
      55,
      6
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "falling rock",
      39,
      11
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "falling rock",
      57,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "magic"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "statue"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "statue"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "polymorph"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "anti magic",
      53,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "sleep gas"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "sleep gas"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "dart"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "dart"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "dart"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "B",
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
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "vampire bat"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "class": "i",
        "peaceful": 0
      }
    ]
  }
];
