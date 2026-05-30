// medusa-2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/medusa-2.lua.  Do NOT edit by hand.
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
      "noteleport"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      "}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}------}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}-------}}}}}}}}--------------}\n}|....|}}}}}}}}}..}.}}..}}}}}}}}}}}}}..}}}}}}-.....--}}}}}}}|............|}\n}|....|.}}}}}}}}}}}.}...}}..}}}}}}}}}}}}}}}}}---......}}}}}.|............|}\n}S....|.}}}}}}---}}}}}}}}}}}}}}}}}}}}}}}}}}---...|..-}}}}}}.S..----------|}\n}|....|.}}}}}}-...}}}}}}}}}.}}...}.}}}}.}}}......----}}}}}}.|............|}\n}|....|.}}}}}}-....--}}}}}}}}}}}}}}}}}}}}}}----...--}}}}}}}.|..--------+-|}\n}|....|.}}}}}}}......}}}}...}}}}}}.}}}}}}}}}}}---..---}}}}}.|..|..S...|..|}\n}|....|.}}}}}}-....-}}}}}}}------}}}}}}}}}}}}}}-...|.-}}}}}.|..|..|...|..|}\n}|....|.}}}}}}}}}---}}}}}}}........}}}}}}}}}}---.|....}}}}}.|..|..|...|..|}\n}|....|.}}}}}}}}}}}}}}}}}}-....|...-}}}}}}}}--...----.}}}}}.|..|..|...|..|}\n}|....|.}}}}}}..}}}}}}}}}}---..--------}}}}}-..---}}}}}}}}}.|..|..-------|}\n}|...}|...}}}.}}}}}}...}}}}}--..........}}}}..--}}}}}}}}}}}.|..|.........|}\n}|...}S...}}.}}}}}}}}}}}}}}}-..--------}}}}}}}}}}}}}}...}}}.|..--------..S}\n}|...}|...}}}}}}}..}}}}}}----..|....-}}}}}}}}}}}}}}}}}..}}}.|............|}\n}|....|}}}}}....}}}}..}}.-.......----}}......}}}}}}.......}}|............|}\n}------}}}}}}}}}}}}}}}}}}---------}}}}}}}}}}}}}}}}}}}}}}}}}}--------------}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n"
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
          74,
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
          2,
          3,
          5,
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
          61,
          3,
          72,
          16
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
          71,
          8,
          72,
          11
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
          67,
          8,
          69,
          11
        ],
        "lit": 1,
        "type": "ordinary",
        "arrival_room": true
      }
    ]
  },
  {
    "ns": "des",
    "method": "teleport_region",
    "args": [
      {
        "region": [
          2,
          3,
          5,
          16
        ],
        "dir": "down"
      }
    ]
  },
  {
    "ns": "des",
    "method": "teleport_region",
    "args": [
      {
        "region": [
          61,
          3,
          72,
          16
        ],
        "dir": "up"
      }
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "up",
      4,
      9
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      68,
      10
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      71,
      7
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "type": "branch",
        "region": [
          1,
          0,
          79,
          20
        ],
        "exclude": [
          59,
          1,
          73,
          17
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "non_diggable",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          1,
          2,
          6,
          17
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "non_diggable",
    "args": [
      {
        "__call": "selection.area",
        "args": [
          60,
          2,
          73,
          17
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 68,
        "y": 10,
        "buc": "uncursed",
        "montype": "knight",
        "historic": 1,
        "male": 1,
        "name": "Perseus",
        "contents": null
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 64,
        "y": 8,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 65,
        "y": 8,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 64,
        "y": 9,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 65,
        "y": 9,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 64,
        "y": 10,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 65,
        "y": 10,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 64,
        "y": 11,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      {
        "id": "statue",
        "x": 65,
        "y": 11,
        "contents": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      4,
      4
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "/",
      52,
      9
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "boulder",
      52,
      9
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
    "method": "trap",
    "args": [
      "magic",
      3,
      12
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
        "id": "Medusa",
        "x": 68,
        "y": 10,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "gremlin",
      2,
      14
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "titan",
      2,
      5
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "electric eel",
      10,
      13
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "electric eel",
      11,
      13
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "electric eel",
      10,
      14
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "electric eel",
      11,
      14
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "electric eel",
      10,
      15
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "electric eel",
      11,
      15
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "jellyfish",
      1,
      1
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "jellyfish",
      0,
      8
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "jellyfish",
      4,
      19
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "stone golem",
        "x": 64,
        "y": 8,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "stone golem",
        "x": 65,
        "y": 8,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "stone golem",
        "x": 64,
        "y": 9,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "stone golem",
        "x": 65,
        "y": 9,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "cobra",
        "x": 64,
        "y": 10,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "cobra",
        "x": 65,
        "y": 10,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "A",
      72,
      8
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "id": "yellow light",
        "x": 72,
        "y": 11,
        "asleep": 1
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 17,
        "y": 7
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 28,
        "y": 11
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 32,
        "y": 13
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 49,
        "y": 9
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 48,
        "y": 7
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 65,
        "y": 3
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 70,
        "y": 4
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 70,
        "y": 15
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      {
        "x": 65,
        "y": 16
      }
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  },
  {
    "ns": "des",
    "method": "monster",
    "args": []
  }
];
