// Exact saved scientific observations. No fit runs in the reader.
export const savedChainObservations = {
  "provenance": {
    "path": "docs/teaching/classical-ml-reading-flow/multi-label-multi-output-learning/content-evidence/chain-fit-and-decode.stdout.txt",
    "sha256": "17e6086a6d27f77313dd628b32a115bb99b409ce2ec1998f70da784e45d711ef",
    "kind": "Literal projection of the saved 16-row constructed fit, not a new fit"
  },
  "queries": [
    [
      0.35,
      -0.2
    ],
    [
      -0.7,
      0.4
    ]
  ],
  "members": [
    {
      "indices": [
        9,
        6,
        5,
        14,
        6,
        4,
        14,
        0,
        7,
        4,
        0,
        11,
        15,
        12,
        5,
        8
      ],
      "source_ids": [
        "constructed-9",
        "constructed-6",
        "constructed-5",
        "constructed-14",
        "constructed-6",
        "constructed-4",
        "constructed-14",
        "constructed-0",
        "constructed-7",
        "constructed-4",
        "constructed-0",
        "constructed-11",
        "constructed-15",
        "constructed-12",
        "constructed-5",
        "constructed-8"
      ],
      "draw_ids": [
        "member0/draw0",
        "member0/draw1",
        "member0/draw2",
        "member0/draw3",
        "member0/draw4",
        "member0/draw5",
        "member0/draw6",
        "member0/draw7",
        "member0/draw8",
        "member0/draw9",
        "member0/draw10",
        "member0/draw11",
        "member0/draw12",
        "member0/draw13",
        "member0/draw14",
        "member0/draw15"
      ],
      "state": {
        "order": [
          0,
          1,
          2
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.11926262267245705,
          0.4814352500651297
        ],
        "scaler_scale": [
          0.6257025184356808,
          1.1665921412818685
        ],
        "scaler_training_ids": [
          "member0/draw0",
          "member0/draw1",
          "member0/draw2",
          "member0/draw3",
          "member0/draw4",
          "member0/draw5",
          "member0/draw6",
          "member0/draw7",
          "member0/draw8",
          "member0/draw9",
          "member0/draw10",
          "member0/draw11",
          "member0/draw12",
          "member0/draw13",
          "member0/draw14",
          "member0/draw15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 0,
            "feature_width": 2,
            "training_ids": [
              "member0/draw0",
              "member0/draw1",
              "member0/draw2",
              "member0/draw3",
              "member0/draw4",
              "member0/draw5",
              "member0/draw6",
              "member0/draw7",
              "member0/draw8",
              "member0/draw9",
              "member0/draw10",
              "member0/draw11",
              "member0/draw12",
              "member0/draw13",
              "member0/draw14",
              "member0/draw15"
            ],
            "weights": [
              0.8039933644035876,
              -0.051966331257334256,
              0.29115126011826903
            ],
            "steps": 4
          },
          {
            "kind": "logistic",
            "column": 1,
            "feature_width": 3,
            "training_ids": [
              "member0/draw0",
              "member0/draw1",
              "member0/draw2",
              "member0/draw3",
              "member0/draw4",
              "member0/draw5",
              "member0/draw6",
              "member0/draw7",
              "member0/draw8",
              "member0/draw9",
              "member0/draw10",
              "member0/draw11",
              "member0/draw12",
              "member0/draw13",
              "member0/draw14",
              "member0/draw15"
            ],
            "weights": [
              -0.4393745509163061,
              -0.5437782809483863,
              0.4893892030955174,
              0.24059731821447325
            ],
            "steps": 4
          },
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 4,
            "training_ids": [
              "member0/draw0",
              "member0/draw1",
              "member0/draw2",
              "member0/draw3",
              "member0/draw4",
              "member0/draw5",
              "member0/draw6",
              "member0/draw7",
              "member0/draw8",
              "member0/draw9",
              "member0/draw10",
              "member0/draw11",
              "member0/draw12",
              "member0/draw13",
              "member0/draw14",
              "member0/draw15"
            ],
            "weights": [
              -0.6595725473191442,
              -0.16207846638671117,
              -0.7195738514626527,
              0.01769111361622163,
              0.15980746790444866
            ],
            "steps": 4
          }
        ]
      }
    },
    {
      "indices": [
        13,
        4,
        6,
        14,
        3,
        14,
        10,
        6,
        12,
        6,
        5,
        9,
        14,
        11,
        10,
        9
      ],
      "source_ids": [
        "constructed-13",
        "constructed-4",
        "constructed-6",
        "constructed-14",
        "constructed-3",
        "constructed-14",
        "constructed-10",
        "constructed-6",
        "constructed-12",
        "constructed-6",
        "constructed-5",
        "constructed-9",
        "constructed-14",
        "constructed-11",
        "constructed-10",
        "constructed-9"
      ],
      "draw_ids": [
        "member1/draw0",
        "member1/draw1",
        "member1/draw2",
        "member1/draw3",
        "member1/draw4",
        "member1/draw5",
        "member1/draw6",
        "member1/draw7",
        "member1/draw8",
        "member1/draw9",
        "member1/draw10",
        "member1/draw11",
        "member1/draw12",
        "member1/draw13",
        "member1/draw14",
        "member1/draw15"
      ],
      "state": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.0544158146649731,
          0.8158155760184078
        ],
        "scaler_scale": [
          0.6180511736085338,
          1.1806949229244719
        ],
        "scaler_training_ids": [
          "member1/draw0",
          "member1/draw1",
          "member1/draw2",
          "member1/draw3",
          "member1/draw4",
          "member1/draw5",
          "member1/draw6",
          "member1/draw7",
          "member1/draw8",
          "member1/draw9",
          "member1/draw10",
          "member1/draw11",
          "member1/draw12",
          "member1/draw13",
          "member1/draw14",
          "member1/draw15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "member1/draw0",
              "member1/draw1",
              "member1/draw2",
              "member1/draw3",
              "member1/draw4",
              "member1/draw5",
              "member1/draw6",
              "member1/draw7",
              "member1/draw8",
              "member1/draw9",
              "member1/draw10",
              "member1/draw11",
              "member1/draw12",
              "member1/draw13",
              "member1/draw14",
              "member1/draw15"
            ],
            "weights": [
              -0.570368246691558,
              0.345572719992575,
              -0.627766413489808
            ],
            "steps": 4
          },
          {
            "kind": "logistic",
            "column": 0,
            "feature_width": 3,
            "training_ids": [
              "member1/draw0",
              "member1/draw1",
              "member1/draw2",
              "member1/draw3",
              "member1/draw4",
              "member1/draw5",
              "member1/draw6",
              "member1/draw7",
              "member1/draw8",
              "member1/draw9",
              "member1/draw10",
              "member1/draw11",
              "member1/draw12",
              "member1/draw13",
              "member1/draw14",
              "member1/draw15"
            ],
            "weights": [
              0.6952358369285734,
              0.19036067607935697,
              0.5276676619236458,
              -0.341813408724896
            ],
            "steps": 4
          },
          {
            "kind": "logistic",
            "column": 1,
            "feature_width": 4,
            "training_ids": [
              "member1/draw0",
              "member1/draw1",
              "member1/draw2",
              "member1/draw3",
              "member1/draw4",
              "member1/draw5",
              "member1/draw6",
              "member1/draw7",
              "member1/draw8",
              "member1/draw9",
              "member1/draw10",
              "member1/draw11",
              "member1/draw12",
              "member1/draw13",
              "member1/draw14",
              "member1/draw15"
            ],
            "weights": [
              0.7990730757685223,
              -0.12409740292540967,
              0.5955267635713505,
              -0.29788846620487147,
              -0.19574324812081656
            ],
            "steps": 4
          }
        ]
      }
    },
    {
      "indices": [
        13,
        6,
        11,
        7,
        9,
        10,
        5,
        14,
        3,
        0,
        11,
        1,
        8,
        12,
        2,
        7
      ],
      "source_ids": [
        "constructed-13",
        "constructed-6",
        "constructed-11",
        "constructed-7",
        "constructed-9",
        "constructed-10",
        "constructed-5",
        "constructed-14",
        "constructed-3",
        "constructed-0",
        "constructed-11",
        "constructed-1",
        "constructed-8",
        "constructed-12",
        "constructed-2",
        "constructed-7"
      ],
      "draw_ids": [
        "member2/draw0",
        "member2/draw1",
        "member2/draw2",
        "member2/draw3",
        "member2/draw4",
        "member2/draw5",
        "member2/draw6",
        "member2/draw7",
        "member2/draw8",
        "member2/draw9",
        "member2/draw10",
        "member2/draw11",
        "member2/draw12",
        "member2/draw13",
        "member2/draw14",
        "member2/draw15"
      ],
      "state": {
        "order": [
          1,
          2,
          0
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.1234007087495767,
          -0.08991141454078806
        ],
        "scaler_scale": [
          0.6582421071356405,
          1.1686289725028143
        ],
        "scaler_training_ids": [
          "member2/draw0",
          "member2/draw1",
          "member2/draw2",
          "member2/draw3",
          "member2/draw4",
          "member2/draw5",
          "member2/draw6",
          "member2/draw7",
          "member2/draw8",
          "member2/draw9",
          "member2/draw10",
          "member2/draw11",
          "member2/draw12",
          "member2/draw13",
          "member2/draw14",
          "member2/draw15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 1,
            "feature_width": 2,
            "training_ids": [
              "member2/draw0",
              "member2/draw1",
              "member2/draw2",
              "member2/draw3",
              "member2/draw4",
              "member2/draw5",
              "member2/draw6",
              "member2/draw7",
              "member2/draw8",
              "member2/draw9",
              "member2/draw10",
              "member2/draw11",
              "member2/draw12",
              "member2/draw13",
              "member2/draw14",
              "member2/draw15"
            ],
            "weights": [
              0.2604308562711242,
              -0.10072626409778006,
              0.35974077255389797
            ],
            "steps": 4
          },
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 3,
            "training_ids": [
              "member2/draw0",
              "member2/draw1",
              "member2/draw2",
              "member2/draw3",
              "member2/draw4",
              "member2/draw5",
              "member2/draw6",
              "member2/draw7",
              "member2/draw8",
              "member2/draw9",
              "member2/draw10",
              "member2/draw11",
              "member2/draw12",
              "member2/draw13",
              "member2/draw14",
              "member2/draw15"
            ],
            "weights": [
              0.23997463465768112,
              0.1701443591514692,
              -0.2619311715506331,
              0.032897729314567976
            ],
            "steps": 3
          },
          {
            "kind": "logistic",
            "column": 0,
            "feature_width": 4,
            "training_ids": [
              "member2/draw0",
              "member2/draw1",
              "member2/draw2",
              "member2/draw3",
              "member2/draw4",
              "member2/draw5",
              "member2/draw6",
              "member2/draw7",
              "member2/draw8",
              "member2/draw9",
              "member2/draw10",
              "member2/draw11",
              "member2/draw12",
              "member2/draw13",
              "member2/draw14",
              "member2/draw15"
            ],
            "weights": [
              -0.27046394521105077,
              -0.0620718407176446,
              0.4033631762260367,
              -0.048357303225365585,
              0.06562057134296843
            ],
            "steps": 4
          }
        ]
      }
    }
  ],
  "strictPrefixes": [
    {
      "final_position": 1,
      "fold": 0,
      "held_ids": [
        "constructed-0",
        "constructed-3",
        "constructed-6",
        "constructed-9",
        "constructed-12",
        "constructed-15"
      ],
      "prefix": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          0.054929420278386897,
          -0.31127199509653464
        ],
        "scaler_scale": [
          0.6313822162643592,
          1.3740157084212987
        ],
        "scaler_training_ids": [
          "constructed-1",
          "constructed-2",
          "constructed-4",
          "constructed-5",
          "constructed-7",
          "constructed-8",
          "constructed-10",
          "constructed-11",
          "constructed-13",
          "constructed-14"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "constructed-1",
              "constructed-2",
              "constructed-4",
              "constructed-5",
              "constructed-7",
              "constructed-8",
              "constructed-10",
              "constructed-11",
              "constructed-13",
              "constructed-14"
            ],
            "weights": [
              -0.0025627112372717167,
              0.012169647036288356,
              -0.36318815703664975
            ],
            "steps": 3
          }
        ]
      }
    },
    {
      "final_position": 1,
      "fold": 1,
      "held_ids": [
        "constructed-1",
        "constructed-4",
        "constructed-7",
        "constructed-10",
        "constructed-13"
      ],
      "prefix": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.194908321005585,
          0.06795422022510832
        ],
        "scaler_scale": [
          0.6660168254973897,
          1.2917290640378278
        ],
        "scaler_training_ids": [
          "constructed-0",
          "constructed-2",
          "constructed-3",
          "constructed-5",
          "constructed-6",
          "constructed-8",
          "constructed-9",
          "constructed-11",
          "constructed-12",
          "constructed-14",
          "constructed-15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "constructed-0",
              "constructed-2",
              "constructed-3",
              "constructed-5",
              "constructed-6",
              "constructed-8",
              "constructed-9",
              "constructed-11",
              "constructed-12",
              "constructed-14",
              "constructed-15"
            ],
            "weights": [
              -0.18539627388235472,
              0.0948685923514522,
              -0.25027655535814397
            ],
            "steps": 3
          }
        ]
      }
    },
    {
      "final_position": 1,
      "fold": 2,
      "held_ids": [
        "constructed-2",
        "constructed-5",
        "constructed-8",
        "constructed-11",
        "constructed-14"
      ],
      "prefix": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.025570164853442302,
          -0.1656135839926031
        ],
        "scaler_scale": [
          0.7943652792575884,
          1.0406433659661554
        ],
        "scaler_training_ids": [
          "constructed-0",
          "constructed-1",
          "constructed-3",
          "constructed-4",
          "constructed-6",
          "constructed-7",
          "constructed-9",
          "constructed-10",
          "constructed-12",
          "constructed-13",
          "constructed-15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "constructed-0",
              "constructed-1",
              "constructed-3",
              "constructed-4",
              "constructed-6",
              "constructed-7",
              "constructed-9",
              "constructed-10",
              "constructed-12",
              "constructed-13",
              "constructed-15"
            ],
            "weights": [
              0.20959260222295983,
              0.17876747952343897,
              -0.6525878859482355
            ],
            "steps": 4
          }
        ]
      }
    },
    {
      "final_position": 2,
      "fold": 0,
      "held_ids": [
        "constructed-0",
        "constructed-3",
        "constructed-6",
        "constructed-9",
        "constructed-12",
        "constructed-15"
      ],
      "prefix": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          0.054929420278386897,
          -0.31127199509653464
        ],
        "scaler_scale": [
          0.6313822162643592,
          1.3740157084212987
        ],
        "scaler_training_ids": [
          "constructed-1",
          "constructed-2",
          "constructed-4",
          "constructed-5",
          "constructed-7",
          "constructed-8",
          "constructed-10",
          "constructed-11",
          "constructed-13",
          "constructed-14"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "constructed-1",
              "constructed-2",
              "constructed-4",
              "constructed-5",
              "constructed-7",
              "constructed-8",
              "constructed-10",
              "constructed-11",
              "constructed-13",
              "constructed-14"
            ],
            "weights": [
              -0.0025627112372717167,
              0.012169647036288356,
              -0.36318815703664975
            ],
            "steps": 3
          },
          {
            "kind": "logistic",
            "column": 0,
            "feature_width": 3,
            "training_ids": [
              "constructed-1",
              "constructed-2",
              "constructed-4",
              "constructed-5",
              "constructed-7",
              "constructed-8",
              "constructed-10",
              "constructed-11",
              "constructed-13",
              "constructed-14"
            ],
            "weights": [
              -0.11768808909112081,
              0.5901100319095108,
              0.6751921930353455,
              0.2795697212304246
            ],
            "steps": 4
          }
        ]
      }
    },
    {
      "final_position": 2,
      "fold": 1,
      "held_ids": [
        "constructed-1",
        "constructed-4",
        "constructed-7",
        "constructed-10",
        "constructed-13"
      ],
      "prefix": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.194908321005585,
          0.06795422022510832
        ],
        "scaler_scale": [
          0.6660168254973897,
          1.2917290640378278
        ],
        "scaler_training_ids": [
          "constructed-0",
          "constructed-2",
          "constructed-3",
          "constructed-5",
          "constructed-6",
          "constructed-8",
          "constructed-9",
          "constructed-11",
          "constructed-12",
          "constructed-14",
          "constructed-15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "constructed-0",
              "constructed-2",
              "constructed-3",
              "constructed-5",
              "constructed-6",
              "constructed-8",
              "constructed-9",
              "constructed-11",
              "constructed-12",
              "constructed-14",
              "constructed-15"
            ],
            "weights": [
              -0.18539627388235472,
              0.0948685923514522,
              -0.25027655535814397
            ],
            "steps": 3
          },
          {
            "kind": "logistic",
            "column": 0,
            "feature_width": 3,
            "training_ids": [
              "constructed-0",
              "constructed-2",
              "constructed-3",
              "constructed-5",
              "constructed-6",
              "constructed-8",
              "constructed-9",
              "constructed-11",
              "constructed-12",
              "constructed-14",
              "constructed-15"
            ],
            "weights": [
              -0.1792153674577611,
              -0.459990290179155,
              0.3269700876969131,
              -0.043898859747003784
            ],
            "steps": 4
          }
        ]
      }
    },
    {
      "final_position": 2,
      "fold": 2,
      "held_ids": [
        "constructed-2",
        "constructed-5",
        "constructed-8",
        "constructed-11",
        "constructed-14"
      ],
      "prefix": {
        "order": [
          2,
          0,
          1
        ],
        "recipe": "teacher-forced",
        "scaler_mean": [
          -0.025570164853442302,
          -0.1656135839926031
        ],
        "scaler_scale": [
          0.7943652792575884,
          1.0406433659661554
        ],
        "scaler_training_ids": [
          "constructed-0",
          "constructed-1",
          "constructed-3",
          "constructed-4",
          "constructed-6",
          "constructed-7",
          "constructed-9",
          "constructed-10",
          "constructed-12",
          "constructed-13",
          "constructed-15"
        ],
        "stages": [
          {
            "kind": "logistic",
            "column": 2,
            "feature_width": 2,
            "training_ids": [
              "constructed-0",
              "constructed-1",
              "constructed-3",
              "constructed-4",
              "constructed-6",
              "constructed-7",
              "constructed-9",
              "constructed-10",
              "constructed-12",
              "constructed-13",
              "constructed-15"
            ],
            "weights": [
              0.20959260222295983,
              0.17876747952343897,
              -0.6525878859482355
            ],
            "steps": 4
          },
          {
            "kind": "logistic",
            "column": 0,
            "feature_width": 3,
            "training_ids": [
              "constructed-0",
              "constructed-1",
              "constructed-3",
              "constructed-4",
              "constructed-6",
              "constructed-7",
              "constructed-9",
              "constructed-10",
              "constructed-12",
              "constructed-13",
              "constructed-15"
            ],
            "weights": [
              0.207903238667489,
              -0.2563774468601356,
              0.17039941284214513,
              -0.04056596258103959
            ],
            "steps": 3
          }
        ]
      }
    }
  ],
  "memberBits": [
    [
      [
        1,
        0,
        0
      ],
      [
        1,
        1,
        0
      ]
    ],
    [
      [
        1,
        0,
        1
      ],
      [
        1,
        1,
        0
      ]
    ],
    [
      [
        0,
        1,
        1
      ],
      [
        0,
        1,
        1
      ]
    ]
  ],
  "hardVotes": [
    [
      0.6666666666666666,
      0.3333333333333333,
      0.6666666666666666
    ],
    [
      0.6666666666666666,
      1.0,
      0.3333333333333333
    ]
  ],
  "hardPrediction": [
    [
      1,
      0,
      1
    ],
    [
      1,
      1,
      0
    ]
  ],
  "meanChosenPathProbability": [
    0.20521700963584436,
    0.20908989353233187
  ],
  "jointMean": [
    [
      0.11700736567383783,
      0.13644333197738337,
      0.09246469550718987,
      0.11925189620203884,
      0.15900640578789418,
      0.15543322962570502,
      0.10722331635735889,
      0.11316975886859203
    ],
    [
      0.09397157825577444,
      0.07225544979731048,
      0.1469842801706821,
      0.10853347270175011,
      0.14013177679691355,
      0.09478391804505786,
      0.205132977788309,
      0.1382065464442025
    ]
  ],
  "jointMAP": [
    [
      1,
      0,
      0
    ],
    [
      1,
      1,
      0
    ]
  ],
  "jointMarginals": [
    [
      0.5348327106395501,
      0.43210966693517966,
      0.5242982166737192
    ],
    [
      0.5782552190744829,
      0.5988572771049437,
      0.41377938698832095
    ]
  ]
};
