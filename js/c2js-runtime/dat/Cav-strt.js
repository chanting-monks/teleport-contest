// Cav-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Cav-strt.lua.  Do NOT edit by hand.
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
      "                                                                            \n  ......     ..........................       ...        ....  ......       \n ......       ..........................     ........       ....    .....   \n  ..BB      .............................    .........            ....  ..  \n     ..    ......................              .......      ..     ....  .. \n     ..     ....................                     ..  .......    ..  ... \n   ..              S   BB                .....     .......   ....      .... \n    ..        ...  .   ..               ........  ..     ..   ..       ...  \n     ..      ......     ..             ............       ..          ...   \n       .      ....       ..             ........           ..  ...........  \n  ...   ..     ..        .............                  ................... \n .....   .....            ...............................      ...........  \n  .....B................            ...                               ...   \n  .....     .  ..........        .... .      ...  ..........           ...  \n   ...     ..          .............  ..    ...................        .... \n          BB       ..   .........      BB    ...  ..........  ..   ...  ... \n       ......    .....  B          ........         ..         .. ....  ... \n     ..........  ..........         ..... ...      .....        ........    \n       ..  ...    .  .....         ....    ..       ...            ..       \n                                                                            \n"
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
      "unlit"
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          13,
          1,
          40,
          5
        ],
        "lit": 1,
        "type": "temple",
        "filled": 1,
        "irregular": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          2,
          1,
          8,
          3
        ],
        "lit": 1,
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
        "region": [
          1,
          11,
          6,
          14
        ],
        "lit": 1,
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
        "region": [
          13,
          8,
          18,
          10
        ],
        "lit": 1,
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
        "region": [
          5,
          17,
          14,
          18
        ],
        "lit": 1,
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
        "region": [
          17,
          16,
          23,
          18
        ],
        "lit": 1,
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
        "region": [
          35,
          16,
          44,
          18
        ],
        "lit": 1,
        "type": "ordinary",
        "irregular": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      2,
      3
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          71,
          9,
          71,
          9
        ],
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      19,
      6
    ]
  },
  {
    "ns": "des",
    "method": "altar",
    "args": [
      {
        "x": 36,
        "y": 2,
        "align": "coaligned",
        "type": "shrine"
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "Shaman Karnov",
        "coord": [
          35,
          2
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
      34,
      2
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      20,
      3
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      20,
      2
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      20,
      1
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      21,
      3
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      21,
      2
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      21,
      1
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      22,
      1
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "neanderthal",
      26,
      9
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
    "args": [
      "pit",
      47,
      11
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      57,
      10
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
    "method": "monster",
    "args": [
      {
        "id": "bugbear",
        "x": 47,
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
        "id": "bugbear",
        "x": 48,
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
        "id": "bugbear",
        "x": 49,
        "y": 4,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "bugbear",
        "x": 67,
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
        "id": "bugbear",
        "x": 69,
        "y": 4,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "bugbear",
        "x": 51,
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
        "id": "bugbear",
        "x": 53,
        "y": 14,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "bugbear",
        "x": 55,
        "y": 15,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "bugbear",
        "x": 63,
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
        "id": "bugbear",
        "x": 65,
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
        "id": "bugbear",
        "x": 67,
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
        "id": "bugbear",
        "x": 69,
        "y": 11,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "wallify",
    "args": []
  }
];
