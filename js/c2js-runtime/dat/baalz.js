// baalz.js — AUTO-GENERATED from
// nethack-c/upstream/dat/baalz.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: templatic.
export default [
  {
    "ns": "des",
    "method": "level_init",
    "args": [
      {
        "style": "solidfill",
        "fg": " ",
        "lit": 0
      }
    ]
  },
  {
    "ns": "des",
    "method": "level_flags",
    "args": [
      "mazelevel",
      "corrmaze"
    ]
  },
  {
    "ns": "des",
    "method": "map",
    "args": [
      {
        "halign": "right",
        "valign": "center",
        "map": "-------------------------------------------------\n|                   ----               ----      \n|          ----     |     -----------  |         \n| ------      |  ---------|.........|--P         \n| F....|  -------|...........--------------      \n---....|--|..................S............|----  \n+...--....S..----------------|............S...|  \n---....|--|..................|............|----  \n| F....|  -------|...........-----S--------      \n| ------      |  ---------|.........|--P         \n|          ----     |     -----------  |         \n|                   ----               ----      \n-------------------------------------------------\n"
      }
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          1,
          0,
          15,
          20
        ],
        "region_islev": 1,
        "exclude": [
          15,
          1,
          70,
          16
        ],
        "exclude_islev": 1,
        "type": "stair-up"
      }
    ]
  },
  {
    "ns": "des",
    "method": "levregion",
    "args": [
      {
        "region": [
          1,
          0,
          15,
          20
        ],
        "region_islev": 1,
        "exclude": [
          15,
          1,
          70,
          16
        ],
        "exclude_islev": 1,
        "type": "branch"
      }
    ]
  },
  {
    "ns": "des",
    "method": "teleport_region",
    "args": [
      {
        "region": [
          1,
          0,
          15,
          20
        ],
        "region_islev": 1,
        "exclude": [
          15,
          1,
          70,
          16
        ],
        "exclude_islev": 1
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
          0,
          0,
          47,
          12
        ]
      }
    ]
  },
  {
    "ns": "des",
    "method": "mazewalk",
    "args": [
      0,
      6,
      "west"
    ]
  },
  {
    "ns": "des",
    "method": "stair",
    "args": [
      "down",
      44,
      6
    ]
  },
  {
    "ns": "des",
    "method": "door",
    "args": [
      "locked",
      0,
      6
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "Baalzebub",
      35,
      6
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "["
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "["
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      ")"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      ")"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "*"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "!"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "!"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "?"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "?"
    ]
  },
  {
    "ns": "des",
    "method": "object",
    "args": [
      "?"
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
      "fire"
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
      "anti magic"
    ]
  },
  {
    "ns": "des",
    "method": "trap",
    "args": [
      "fire"
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
      "magic"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "ghost",
      37,
      7
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "horned devil",
      32,
      5
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "barbed devil",
      38,
      7
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "L"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "V"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "V"
    ]
  },
  {
    "ns": "des",
    "method": "monster",
    "args": [
      "V"
    ]
  }
];
