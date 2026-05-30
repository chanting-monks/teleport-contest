// minetn-6.js — AUTO-GENERATED from
// nethack-c/upstream/dat/minetn-6.lua.  Do NOT edit by hand.
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
      "inaccessibles"
    ]
  },
  {
    "ns": "des",
    "method": "level_init",
    "args": [
      {
        "style": "mines",
        "fg": ".",
        "bg": "-",
        "smoothed": true,
        "joined": true,
        "lit": 1,
        "walled": true
      }
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      {
        "halign": "center",
        "valign": "top",
        "map": "x--------xxxxxxxxxxx-------------------x\nx------xxxxxxxxxxxxxx-----------------xx\n.-----................----------------.x\n.|...|................|...|..|...|...|..\n.|...+..--+--.........|...|..|...|...|..\n.|...|..|...|..-----..|...|..|-+---+--..\n.-----..|...|--|...|..--+---+-.........x\n........|...|..|...+.............-----.x\n........-----..|...|......--+-...|...|..\nx----...|...|+------..{...|..|...+...|..\nx|..+...|...|.............|..|...|...|..\n.|..|...|...|-+-.....---+-------------.x\n.----...--+--..|..-+-|..................\n...|........|..|..|..|----....--------.x\n...|..T.....----..|..|...+....|......|..\n...|-....{........|..|...|....+......|x.\n...--..-....T.....--------....|......|x.\n.......--.....................----------\n.xxxx-----xxxxxxxxxxxxxxxxxx------------\nxxxx-------xxxxxxxxxxxxxxx--------------\n"
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
          39,
          19
        ]
      },
      "lit"
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "type": "stair-up",
        "region": [
          1,
          3,
          21,
          19
        ],
        "region_islev": 1,
        "exclude": [
          1,
          0,
          39,
          18
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "type": "stair-down",
        "region": [
          60,
          3,
          75,
          19
        ],
        "region_islev": 1,
        "exclude": [
          0,
          0,
          38,
          18
        ]
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
          13,
          7,
          14,
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
        "region": [
          9,
          9,
          11,
          11
        ],
        "lit": 1,
        "type": "candle shop",
        "filled": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          16,
          6,
          18,
          8
        ],
        "lit": 1,
        "type": "tool shop",
        "filled": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          23,
          3,
          25,
          5
        ],
        "lit": 1,
        "type": "shop",
        "filled": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          22,
          14,
          24,
          15
        ],
        "lit": 1,
        "type": null,
        "filled": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "region",
    "args": [
      {
        "region": [
          31,
          14,
          36,
          16
        ],
        "lit": 1,
        "type": "temple",
        "filled": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "altar",
    "args": [
      {
        "x": 35,
        "y": 15,
        "align": null,
        "type": "shrine"
      }
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      5,
      4
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      4,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      10,
      4
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      10,
      12
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      13,
      9
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      14,
      11
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      19,
      7
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      19,
      12
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      24,
      6
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      24,
      11
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      25,
      14
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      28,
      6
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      28,
      8
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      30,
      15
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      31,
      5
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      35,
      5
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "closed",
      33,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome",
      14,
      8
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome lord",
      14,
      7
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome",
      27,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome lord"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gnome lord"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "dwarf"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "dwarf"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "dwarf"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "dwarf",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "dwarf",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "gnome",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "gnome",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "hobbit",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "goblin",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "kobold",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "dog",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "watchman",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "watchman",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "watchman",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "watch captain",
        "peaceful": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "watch captain",
        "peaceful": 1
      }
    ]
  }
];
