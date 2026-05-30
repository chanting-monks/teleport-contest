// Ran-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Ran-strt.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: templatic.
export default [
  {
    "ns": "des",
    "method": "level_init",
    "args": [
      {
        "style": "solidfill",
        "fg": "."
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
      "arboreal"
    ]
  },
  {
    "ns": "des",
    "method": "level_init",
    "args": [
      {
        "style": "mines",
        "fg": ".",
        "bg": ".",
        "smoothed": true,
        "joined": true,
        "lit": 1,
        "walled": false
      }
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
          76,
          19
        ],
        "fromterrain": ".",
        "toterrain": "T",
        "chance": 5
      }
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      {
        "halign": "left",
        "valign": "center",
        "map": "                                       xx\n   ...................................  x\n  ..                                 ..  \n ..  ...............F...............  .. \n .  ..             .F.             ..  . \n . ..  .............F.............  .. . \n . .  ..                         ..  . . \n . . ..  .......................  .. ... \n . . .  ..                     ..  .     \n ... . ..  .|..................... ......\n FFF . .  ..S..................          \n ... . ..  .|.................  .... ... \n . . .  ..                     ..  . . . \n . . ..  .......................  .. . . \n . .  ..                         ..  . . \n . ..  .............F.............  .. . \n .  ..             .F.             ..  . \n ..  ...............F...............  .. \n  ..                                 ..  \n   ...................................  x\n                                       xx\n"
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
          40,
          20
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
      10,
      10
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          51,
          2,
          77,
          18
        ],
        "region_islev": 1,
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "Orion",
        "coord": [
          20,
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
      20,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      19,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      20,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      21,
      9
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      19,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      21,
      10
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      19,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      20,
      11
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "hunter",
      21,
      11
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
          40,
          20
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "arrow",
      30,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "arrow",
      30,
      10
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "pit",
      40,
      9
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "spiked pit"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "bear"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "bear"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "minotaur",
        "x": 33,
        "y": 9,
        "peaceful": 0,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "forest centaur",
        "x": 19,
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
        "id": "forest centaur",
        "x": 19,
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
        "id": "forest centaur",
        "x": 19,
        "y": 5,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "forest centaur",
        "x": 21,
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
        "id": "forest centaur",
        "x": 21,
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
        "id": "forest centaur",
        "x": 21,
        "y": 5,
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "forest centaur",
        "x": 1,
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
        "id": "forest centaur",
        "x": 2,
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
        "id": "forest centaur",
        "x": 3,
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
        "id": "forest centaur",
        "x": 1,
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
        "id": "forest centaur",
        "x": 2,
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
        "id": "forest centaur",
        "x": 3,
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
        "id": "forest centaur",
        "x": 19,
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
        "id": "forest centaur",
        "x": 19,
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
        "id": "forest centaur",
        "x": 19,
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
        "id": "forest centaur",
        "x": 21,
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
        "id": "forest centaur",
        "x": 21,
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
        "id": "forest centaur",
        "x": 21,
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
        "id": "plains centaur",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "plains centaur",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "plains centaur",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "plains centaur",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "plains centaur",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "plains centaur",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "scorpion",
        "peaceful": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "scorpion",
        "peaceful": 0
      }
    ]
  }
];
