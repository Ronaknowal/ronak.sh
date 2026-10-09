// Exact projection of saved author executions and once-measured locked study. No fit.
export default {
  "nb_discrete_library": {
    "versions": {
      "numpy": "2.3.5",
      "scipy": "1.18.1",
      "sklearn": "1.9.1"
    },
    "sparse_arrays": {
      "data": [
        2,
        1,
        1,
        1,
        2,
        1,
        1,
        1,
        2
      ],
      "indices": [
        0,
        2,
        1,
        0,
        1,
        2,
        0,
        1,
        2
      ],
      "indptr": [
        0,
        2,
        3,
        4,
        6,
        8,
        9
      ]
    },
    "chunks": [
      2,
      3,
      1
    ],
    "raw_counts": [
      [
        4,
        1,
        1
      ],
      [
        0,
        3,
        3
      ]
    ],
    "theta": [
      [
        0.6,
        0.2,
        0.2
      ],
      [
        0.06666666666666667,
        0.4666666666666667,
        0.4666666666666667
      ]
    ],
    "query_probabilities": [
      [
        0.7941176470588235,
        0.20588235294117646
      ],
      [
        0.5,
        0.5
      ],
      [
        0.15517241379310345,
        0.8448275862068966
      ]
    ],
    "batch_online_equal": true,
    "comparisons": [
      {
        "family": "multinomial_unweighted",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.7941176470588235,
            0.20588235294117646
          ],
          [
            0.5,
            0.5
          ],
          [
            0.15517241379310345,
            0.8448275862068966
          ]
        ],
        "max_library_log_difference": 4.440892098500626e-16,
        "state_reload_equal": true,
        "class_mass": [
          3,
          3
        ]
      },
      {
        "family": "bernoulli_unweighted",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.875,
            0.12499999999999997
          ],
          [
            0.28409090909090906,
            0.7159090909090909
          ],
          [
            0.12499999999999997,
            0.875
          ]
        ],
        "max_library_log_difference": 4.440892098500626e-16,
        "state_reload_equal": true,
        "class_mass": [
          3,
          3
        ]
      },
      {
        "family": "complement_unweighted_norm_False",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.7941176470588235,
            0.20588235294117646
          ],
          [
            0.5,
            0.5
          ],
          [
            0.15517241379310348,
            0.8448275862068966
          ]
        ],
        "max_library_log_difference": 8.326672684688674e-17,
        "state_reload_equal": true,
        "class_mass": [
          3,
          3
        ]
      },
      {
        "family": "complement_unweighted_norm_True",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.5625317596785206,
            0.4374682403214793
          ],
          [
            0.5,
            0.5
          ],
          [
            0.37686246059728284,
            0.6231375394027172
          ]
        ],
        "max_library_log_difference": 1.1102230246251565e-16,
        "state_reload_equal": true,
        "class_mass": [
          3,
          3
        ]
      },
      {
        "family": "multinomial_weighted",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.6741837248629954,
            0.3258162751370046
          ],
          [
            0.3928571428571429,
            0.6071428571428572
          ],
          [
            0.18329633307395674,
            0.8167036669260432
          ]
        ],
        "max_library_log_difference": 2.220446049250313e-16,
        "state_reload_equal": true,
        "class_mass": [
          2.75,
          4.25
        ]
      },
      {
        "family": "bernoulli_weighted",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.8075704065924115,
            0.1924295934075886
          ],
          [
            0.17052897139429196,
            0.829471028605708
          ],
          [
            0.09966770684099872,
            0.9003322931590013
          ]
        ],
        "max_library_log_difference": 4.440892098500626e-16,
        "state_reload_equal": true,
        "class_mass": [
          2.75,
          4.25
        ]
      },
      {
        "family": "complement_weighted_norm_False",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.7617843372994487,
            0.23821566270055133
          ],
          [
            0.5,
            0.5
          ],
          [
            0.2575284986764258,
            0.7424715013235742
          ]
        ],
        "max_library_log_difference": 2.220446049250313e-16,
        "state_reload_equal": true,
        "class_mass": [
          2.75,
          4.25
        ]
      },
      {
        "family": "complement_weighted_norm_True",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.5429370299781497,
            0.45706297002185037
          ],
          [
            0.5,
            0.5
          ],
          [
            0.41475457003591765,
            0.5852454299640822
          ]
        ],
        "max_library_log_difference": 2.220446049250313e-16,
        "state_reload_equal": true,
        "class_mass": [
          2.75,
          4.25
        ]
      },
      {
        "family": "categorical_unweighted",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.6428571428571429,
            0.35714285714285704
          ],
          [
            0.8928571428571429,
            0.1071428571428571
          ]
        ],
        "max_library_log_difference": 6.661338147750939e-16,
        "state_reload_equal": true,
        "class_mass": [
          3,
          3
        ]
      },
      {
        "family": "categorical_weighted",
        "classes": [
          0,
          1
        ],
        "probabilities": [
          [
            0.6166536784334533,
            0.38334632156654674
          ],
          [
            0.8982121976303519,
            0.10178780236964816
          ]
        ],
        "max_library_log_difference": 1.1102230246251565e-16,
        "state_reload_equal": true,
        "class_mass": [
          2.75,
          4.25
        ]
      }
    ],
    "alpha_zero_empty": [
      [
        0.5,
        0.5
      ]
    ],
    "alpha_zero_supported": [
      [
        0,
        "-inf"
      ]
    ],
    "alpha_zero_unsupported": "undefined",
    "alpha_zero_library": {
      "finite": [
        [
          false,
          false
        ],
        [
          false,
          false
        ]
      ],
      "warnings": [
        "divide by zero encountered in log",
        "invalid value encountered in matmul",
        "divide by zero encountered in log"
      ]
    },
    "one_word_norm_policy": {
      "weights": [
        [
          0
        ],
        [
          0
        ]
      ],
      "probabilities": [
        [
          0.5,
          0.5
        ]
      ]
    },
    "changed_alpha_2": [
      [
        0.6428571428571429,
        0.3571428571428571
      ],
      [
        0.5,
        0.5
      ],
      [
        0.2647058823529412,
        0.7352941176470589
      ]
    ]
  },
  "nb_gaussian_online": {
    "merged_n_mean_M2": [
      3,
      [
        2
      ],
      [
        2
      ]
    ],
    "weighted_state": {
      "format": "nb-gaussian-M2-v1",
      "classes": [
        0,
        1
      ],
      "schema": [
        "reading",
        "offset"
      ],
      "units": [
        "mV",
        "mV"
      ],
      "variance_floor": [
        1e-9,
        1e-9
      ],
      "class_count": [
        3,
        3.5
      ],
      "mean": [
        [
          2.1666666666666665,
          -0.8333333333333334
        ],
        [
          0.8571428571428571,
          2.857142857142857
        ]
      ],
      "M2": [
        [
          1.4166666666666665,
          1.4166666666666665
        ],
        [
          1.4285714285714284,
          1.4285714285714286
        ]
      ],
      "priors": null
    },
    "chunks": [
      2,
      3,
      1
    ],
    "probabilities": [
      [
        0.9906188333548761,
        0.00938116664512395
      ],
      [
        0.9925656685809573,
        0.007434331419042602
      ]
    ],
    "roundtrip_equal": true,
    "library_epsilon_batch": 4.666666666666667e-9,
    "library_epsilon_chunks": [
      2.5e-10,
      1.5555555555555557e-9,
      0
    ],
    "library_variance_batch": [
      [
        0.4722222268888888,
        0.4722222268888888
      ],
      [
        0.40816326997278907,
        0.4081632699727891
      ]
    ],
    "library_variance_chunks": [
      [
        0.4722222229074074,
        0.4722222229074074
      ],
      [
        0.40816326663945585,
        0.40816326663945585
      ]
    ],
    "library_probability_batch": [
      [
        0.9906188329255129,
        0.00938116707448748
      ],
      [
        0.99256566819433,
        0.00743433180567009
      ]
    ],
    "library_probability_chunks": [
      [
        0.9906188332985862,
        0.009381166701414189
      ],
      [
        0.9925656684981474,
        0.007434331501852305
      ]
    ]
  },
  "nb-likelihood-gradients": {
    "counts": [
      2,
      1,
      1
    ],
    "token_start": [
      0.2,
      -0.1
    ],
    "token_gradient": [
      -0.43722466692073714,
      0.15773244157705868
    ],
    "token_finite_difference": [
      -0.43722466687157174,
      0.15773244155248278
    ],
    "common_shift_objective_difference": 3.552713678800501e-15,
    "token_fit": {
      "success": false,
      "status": 2,
      "iterations": 9,
      "parameters": [
        0.6931471824056854,
        5.248795953129256e-10
      ],
      "objective": 4.1588830833596715,
      "gradient_norm": 1.669402402588808e-9,
      "message": "Desired error not necessarily achieved due to precision loss."
    },
    "token_theta": [
      0.5000000003958252,
      0.24999999986769741,
      0.24999999973647752
    ],
    "closed_form_theta": [
      0.5,
      0.25,
      0.25
    ],
    "smoothed_mean_alpha_1": [
      0.42857142857142855,
      0.2857142857142857,
      0.2857142857142857
    ],
    "gaussian_gradient": [
      -1.2280961296169728,
      0.37424521451777504
    ],
    "gaussian_finite_difference": [
      -1.2280961296351478,
      0.3742452144628316
    ],
    "gaussian_fit": {
      "success": true,
      "status": 0,
      "iterations": 9,
      "parameters": [
        2.000000000003881,
        -0.40546510808162955
      ],
      "objective": 3.648617937451771,
      "gradient_norm": 4.346518253398844e-11,
      "message": "CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL"
    },
    "closed_form_mean_variance": [
      2,
      0.6666666666666666
    ],
    "capped_token_fit": {
      "success": false,
      "status": 1,
      "iterations": 1,
      "parameters": [
        0.6372246669207371,
        -0.25773244157705866
      ],
      "objective": 4.177534135440316,
      "gradient_norm": 0.1691725309831286,
      "message": "Maximum number of iterations has been exceeded."
    }
  },
  "nb-integrated-predictive": {
    "cases": [
      {
        "counts": [
          2,
          0
        ],
        "shapes": [
          4,
          1
        ],
        "log_mass": -0.4054651081081646,
        "library_log_mass": -0.4054651081081646,
        "probability": 0.6666666666666665,
        "exact_mass": "2/3"
      },
      {
        "counts": [
          1,
          1
        ],
        "shapes": [
          4,
          1
        ],
        "log_mass": -1.3217558399823193,
        "library_log_mass": -1.3217558399823193,
        "probability": 0.2666666666666667,
        "exact_mass": "4/15"
      },
      {
        "counts": [
          3,
          2
        ],
        "shapes": [
          0.5,
          1.25
        ],
        "log_mass": -2.235049492505072,
        "library_log_mass": -2.2350494925050723,
        "probability": 0.10698683467562194,
        "exact_mass": "3600/33649"
      },
      {
        "counts": [
          100,
          80,
          20
        ],
        "shapes": [
          0.5,
          1.25,
          2.75
        ],
        "log_mass": -12.926619105835016,
        "library_log_mass": -12.926619105835094,
        "probability": 0.0000024324316891863183,
        "exact_mass": "13201541548135606298057344212329493589302475186689141942456799577534355815581732400025/5427302072581462425222917110461132092044507690213516114133834981354039371441196681513664512"
      },
      {
        "counts": [
          1000,
          2000,
          3000
        ],
        "shapes": [
          0.1,
          0.2,
          0.3
        ],
        "log_mass": -18.89679373659601,
        "library_log_mass": -18.896793736590553,
        "probability": 6.211932880099938e-9
      }
    ],
    "class_posterior_AA": [
      0.9090909090909092,
      0.09090909090909094
    ],
    "plugin_class0_posterior": 0.9411764705882353,
    "one_token_mean": 0.8,
    "one_token_integrated": 0.8000000000000004,
    "state": {
      "format": "nb-integrated-v1",
      "classes": [
        0,
        1
      ],
      "schema": [
        "A",
        "B"
      ],
      "shapes": [
        [
          4,
          1
        ],
        [
          1,
          4
        ]
      ],
      "priors": [
        0.5,
        0.5
      ]
    },
    "roundtrip_equal": true
  },
  "nb-mixed-record": {
    "fixture": [
      [
        0,
        1,
        -1
      ],
      [
        0,
        1,
        0
      ],
      [
        1,
        0,
        1
      ],
      [
        0,
        1,
        2
      ],
      [
        1,
        0,
        0
      ],
      [
        1,
        0,
        1
      ],
      [
        0,
        1,
        2
      ],
      [
        1,
        0,
        3
      ]
    ],
    "classes": [
      0,
      1
    ],
    "query": [
      [
        0,
        1,
        0.5
      ],
      [
        1,
        0,
        2
      ],
      [
        0,
        0,
        -1
      ]
    ],
    "likelihood_terms": [
      [
        [
          -0.40546510810816444,
          -1.0986122886681098
        ],
        [
          -1.0986122886681098,
          -0.40546510810816444
        ],
        [
          -0.40546510810816444,
          -1.0986122886681098
        ]
      ],
      [
        [
          -0.40546510810816444,
          -1.0986122886681098
        ],
        [
          -1.0986122886681096,
          -0.40546510810816433
        ],
        [
          -1.0986122886681096,
          -0.40546510810816433
        ]
      ],
      [
        [
          -1.0305103092617776,
          -1.4305103089417774
        ],
        [
          -1.9305103085417774,
          -1.1305103091817776
        ],
        [
          -1.9305103085417774,
          -3.5305103072617774
        ]
      ]
    ],
    "mask_results": [
      {
        "mask": [
          true,
          true,
          true
        ],
        "probabilities": [
          [
            0.856472353155251,
            0.1435276468447489
          ],
          [
            0.10098802943083822,
            0.8990119705691618
          ],
          [
            0.8320183849550268,
            0.16798161504497325
          ]
        ],
        "max_library_difference": 5.551115123125783e-17
      },
      {
        "mask": [
          true,
          false,
          true
        ],
        "probabilities": [
          [
            0.7489738927768399,
            0.25102610722316016
          ],
          [
            0.18344982276155095,
            0.8165501772384491
          ],
          [
            0.9083078988592701,
            0.09169210114072997
          ]
        ],
        "max_library_difference": 2.220446049250313e-16
      },
      {
        "mask": [
          false,
          false,
          false
        ],
        "probabilities": [
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ],
          [
            0.5,
            0.5
          ]
        ],
        "max_library_difference": 0
      }
    ],
    "roundtrip_equal": true,
    "state": {
      "format": "nb-mixed-v1",
      "feature_order": [
        "status",
        "alarm",
        "reading"
      ],
      "mask_meaning": "observed Boolean; missing process assumed ignorable",
      "category": {
        "format": "nb-discrete-v1",
        "family": "categorical",
        "alpha": 1,
        "schema": [
          "status"
        ],
        "classes": [
          0,
          1
        ],
        "class_count": [
          4,
          4
        ],
        "priors": null,
        "categories": [
          [
            "idle",
            "busy"
          ]
        ],
        "category_count": [
          [
            [
              3,
              1
            ],
            [
              1,
              3
            ]
          ]
        ]
      },
      "binary": {
        "format": "nb-discrete-v1",
        "family": "bernoulli",
        "alpha": 1,
        "schema": [
          "alarm"
        ],
        "classes": [
          0,
          1
        ],
        "class_count": [
          4,
          4
        ],
        "priors": null,
        "feature_count": [
          [
            3
          ],
          [
            1
          ]
        ]
      },
      "gaussian": {
        "format": "nb-gaussian-M2-v1",
        "classes": [
          0,
          1
        ],
        "schema": [
          "reading"
        ],
        "units": [
          "mV"
        ],
        "variance_floor": [
          1e-9
        ],
        "class_count": [
          4,
          4
        ],
        "mean": [
          [
            0.5
          ],
          [
            1.5
          ]
        ],
        "M2": [
          [
            5
          ],
          [
            5
          ]
        ],
        "priors": null
      }
    },
    "library_matched_var_smoothing": 6.666666666666667e-10,
    "library_epsilon": 1e-9,
    "changed_prior_probabilities": [
      [
        0.6654510939464541,
        0.3345489060535458
      ],
      [
        0.03609262520811495,
        0.9639073747918852
      ],
      [
        0.62278539275292,
        0.37721460724708
      ]
    ],
    "duplicated_prior_bug": [
      [
        0.39868909366454675,
        0.6013109063354531
      ],
      [
        0.012327496202840712,
        0.9876725037971594
      ],
      [
        0.3549789228358708,
        0.6450210771641292
      ]
    ]
  },
  "nb-feature-selection": {
    "training_rows": 8,
    "feature_names": [
      "alarm",
      "inspection",
      "meeting",
      "repair",
      "review",
      "routine",
      "urgent"
    ],
    "presence_definition": {
      "tables_class_by_absent_present": [
        [
          [
            4,
            0
          ],
          [
            2,
            2
          ]
        ],
        [
          [
            3,
            1
          ],
          [
            3,
            1
          ]
        ],
        [
          [
            2,
            2
          ],
          [
            4,
            0
          ]
        ],
        [
          [
            4,
            0
          ],
          [
            2,
            2
          ]
        ],
        [
          [
            2,
            2
          ],
          [
            4,
            0
          ]
        ],
        [
          [
            1,
            3
          ],
          [
            4,
            0
          ]
        ],
        [
          [
            4,
            0
          ],
          [
            1,
            3
          ]
        ]
      ],
      "MI_nats": [
        0.21576155433883565,
        0,
        0.21576155433883565,
        0.21576155433883565,
        0.21576155433883565,
        0.38039566584857787,
        0.3803956658485779
      ],
      "Pearson_chi2": [
        2.6666666666666665,
        0,
        2.6666666666666665,
        2.6666666666666665,
        2.6666666666666665,
        4.8,
        4.8
      ]
    },
    "sklearn_count_chi2": [
      3,
      0,
      2,
      2,
      2,
      4,
      4
    ],
    "sklearn_count_chi2_pvalues": [
      0.08326451666355042,
      1,
      0.15729920705028105,
      0.15729920705028105,
      0.15729920705028105,
      0.04550026389635857,
      0.04550026389635857
    ],
    "MI_selected_names": [
      "alarm",
      "routine",
      "urgent"
    ],
    "count_chi2_selected_names": [
      "alarm",
      "routine",
      "urgent"
    ],
    "query": [
      "urgent alarm",
      "newword meeting",
      ""
    ],
    "MI_selected_probabilities": [
      [
        0.09259259259259267,
        0.9074074074074076
      ],
      [
        0.5,
        0.5
      ],
      [
        0.5,
        0.5
      ]
    ],
    "pipeline_probabilities": [
      [
        0.09259259259259267,
        0.9074074074074076
      ],
      [
        0.5,
        0.5
      ],
      [
        0.5,
        0.5
      ]
    ],
    "stored_transform": {
      "vocabulary": [
        "alarm",
        "inspection",
        "meeting",
        "repair",
        "review",
        "routine",
        "urgent"
      ],
      "MI_selected_indices": [
        0,
        5,
        6
      ],
      "count_chi2_selected_indices": [
        0,
        5,
        6
      ]
    },
    "query_shape": [
      3,
      3
    ]
  },
  "study": {
    "protocol": {
      "candidate_order": [
        {
          "id": "candidate_01",
          "family": "Gaussian",
          "representation": "raw57",
          "var_smoothing": 1e-11
        },
        {
          "id": "candidate_02",
          "family": "Gaussian",
          "representation": "raw57",
          "var_smoothing": 1e-9
        },
        {
          "id": "candidate_03",
          "family": "Gaussian",
          "representation": "raw57",
          "var_smoothing": 1e-7
        },
        {
          "id": "candidate_04",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-11
        },
        {
          "id": "candidate_05",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-9
        },
        {
          "id": "candidate_06",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-7
        },
        {
          "id": "candidate_07",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 0.1
        },
        {
          "id": "candidate_08",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 1
        },
        {
          "id": "candidate_09",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 10
        },
        {
          "id": "candidate_10",
          "family": "logistic",
          "representation": "raw57",
          "C": 0.1
        },
        {
          "id": "candidate_11",
          "family": "logistic",
          "representation": "raw57",
          "C": 1
        },
        {
          "id": "candidate_12",
          "family": "logistic",
          "representation": "raw57",
          "C": 10
        }
      ],
      "selection": "validation mean negative log probability; tie tolerance 1e-12, first",
      "refit": false,
      "class_order": [
        0,
        1
      ],
      "loss": "unclipped finite native log probabilities",
      "versions": {
        "numpy": "2.3.5",
        "scipy": "1.18.1",
        "sklearn": "1.9.1"
      },
      "data_hashes": {
        "spambase.data": "b1ef93de71f97714d3d7d4f58fc9f718da7bbc8ac8a150eff2778616a8097b12",
        "spambase.names": "df418fab7923f929237b81efa0987ddfaf2d68cf61291243625aadc684d5ab6a",
        "spambase.DOCUMENTATION": "462e4ffba1241a5962d528364708d188dc75931d56a25a8e9b6c8bb25e094cfd"
      },
      "sources": {
        "nb-spambase-study.py": "da2908bb4624ce1d2c255321975c19b603552c8219d5d602b08569dfc904eeea",
        "nb_discrete_core.py": "057d978c41fbd7b87bad1a117ea1749156ede0d44d83c4a6b595e710c824ad5f",
        "nb_gaussian_online.py": "229e4dc321da93e8728d99c60da11b5f275f276e72bd47b21de2145aed73142a"
      },
      "grouping": {
        "unique_feature_groups": 4207,
        "conflicting_label_groups": 3,
        "roles": {
          "train": {
            "rows": 2811,
            "class_counts": [
              1682,
              1129
            ],
            "indices_sha256": "38f7b8e9e582114f5432c48df04a7f70731172b692f008fd4c0f069c69808d05"
          },
          "validation": {
            "rows": 890,
            "class_counts": [
              547,
              343
            ],
            "indices_sha256": "9a3f6e12d3f71e9edb46f7785a6d51b28c86f163806b63938ddb2abc64862c3d"
          },
          "test": {
            "rows": 900,
            "class_counts": [
              559,
              341
            ],
            "indices_sha256": "e057b4cdd8d3f97990c4031925635179b22142f44789f14fb4205d100cfe242a"
          }
        }
      }
    },
    "all_validation_outcomes": [
      {
        "configuration": {
          "id": "candidate_01",
          "family": "Gaussian",
          "representation": "raw57",
          "var_smoothing": 1e-11
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 13.903475750371634,
          "accuracy": 0.8235955056179776,
          "balanced_accuracy": 0.8434423651936617,
          "Brier": 0.1749022939307167,
          "confusion_ham_spam": [
            [
              414,
              133
            ],
            [
              24,
              319
            ]
          ],
          "precision": [
            0.9452054794520548,
            0.7057522123893806
          ],
          "recall": [
            0.7568555758683729,
            0.9300291545189504
          ],
          "f1": [
            0.8406091370558376,
            0.8025157232704403
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 451,
          "cost_4_to_1_at_08": 0.6202247191011236
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_02",
          "family": "Gaussian",
          "representation": "raw57",
          "var_smoothing": 1e-9
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 13.903417262231805,
          "accuracy": 0.8235955056179776,
          "balanced_accuracy": 0.8434423651936617,
          "Brier": 0.1749021130801951,
          "confusion_ham_spam": [
            [
              414,
              133
            ],
            [
              24,
              319
            ]
          ],
          "precision": [
            0.9452054794520548,
            0.7057522123893806
          ],
          "recall": [
            0.7568555758683729,
            0.9300291545189504
          ],
          "f1": [
            0.8406091370558376,
            0.8025157232704403
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 451,
          "cost_4_to_1_at_08": 0.6202247191011236
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_03",
          "family": "Gaussian",
          "representation": "raw57",
          "var_smoothing": 1e-7
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 13.897576384637478,
          "accuracy": 0.8235955056179776,
          "balanced_accuracy": 0.8434423651936617,
          "Brier": 0.1748837294978431,
          "confusion_ham_spam": [
            [
              414,
              133
            ],
            [
              24,
              319
            ]
          ],
          "precision": [
            0.9452054794520548,
            0.7057522123893806
          ],
          "recall": [
            0.7568555758683729,
            0.9300291545189504
          ],
          "f1": [
            0.8406091370558376,
            0.8025157232704403
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 451,
          "cost_4_to_1_at_08": 0.6202247191011236
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_04",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-11
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 10.041647954190767,
          "accuracy": 0.8314606741573034,
          "balanced_accuracy": 0.8487536043406655,
          "Brier": 0.16709769313876374,
          "confusion_ham_spam": [
            [
              423,
              124
            ],
            [
              26,
              317
            ]
          ],
          "precision": [
            0.9420935412026726,
            0.7188208616780045
          ],
          "recall": [
            0.773308957952468,
            0.924198250728863
          ],
          "f1": [
            0.8493975903614458,
            0.8086734693877551
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 440,
          "cost_4_to_1_at_08": 0.5820224719101124
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_05",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-9
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 10.041641521860113,
          "accuracy": 0.8314606741573034,
          "balanced_accuracy": 0.8487536043406655,
          "Brier": 0.1670976905004269,
          "confusion_ham_spam": [
            [
              423,
              124
            ],
            [
              26,
              317
            ]
          ],
          "precision": [
            0.9420935412026726,
            0.7188208616780045
          ],
          "recall": [
            0.773308957952468,
            0.924198250728863
          ],
          "f1": [
            0.8493975903614458,
            0.8086734693877551
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 440,
          "cost_4_to_1_at_08": 0.5820224719101124
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_06",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-7
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 10.040998402758792,
          "accuracy": 0.8314606741573034,
          "balanced_accuracy": 0.8487536043406655,
          "Brier": 0.16709742669089414,
          "confusion_ham_spam": [
            [
              423,
              124
            ],
            [
              26,
              317
            ]
          ],
          "precision": [
            0.9420935412026726,
            0.7188208616780045
          ],
          "recall": [
            0.773308957952468,
            0.924198250728863
          ],
          "f1": [
            0.8493975903614458,
            0.8086734693877551
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 440,
          "cost_4_to_1_at_08": 0.5820224719101124
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_07",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 0.1
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 0.6360730474193523,
          "accuracy": 0.8853932584269663,
          "balanced_accuracy": 0.8708833232953668,
          "Brier": 0.10257857485987074,
          "confusion_ham_spam": [
            [
              511,
              36
            ],
            [
              66,
              277
            ]
          ],
          "precision": [
            0.8856152512998267,
            0.8849840255591054
          ],
          "recall": [
            0.9341864716636198,
            0.8075801749271136
          ],
          "f1": [
            0.9092526690391459,
            0.8445121951219512
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 294,
          "cost_4_to_1_at_08": 0.21797752808988763
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_08",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 1
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 0.6383263068837718,
          "accuracy": 0.8820224719101124,
          "balanced_accuracy": 0.8675974437829455,
          "Brier": 0.10332902369976638,
          "confusion_ham_spam": [
            [
              509,
              38
            ],
            [
              67,
              276
            ]
          ],
          "precision": [
            0.8836805555555556,
            0.8789808917197452
          ],
          "recall": [
            0.9305301645338209,
            0.8046647230320699
          ],
          "f1": [
            0.9065004452359751,
            0.8401826484018264
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 296,
          "cost_4_to_1_at_08": 0.22134831460674156
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_09",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 10
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 0.6497543634282107,
          "accuracy": 0.8752808988764045,
          "balanced_accuracy": 0.8610256847581028,
          "Brier": 0.10773799076631817,
          "confusion_ham_spam": [
            [
              505,
              42
            ],
            [
              69,
              274
            ]
          ],
          "precision": [
            0.8797909407665505,
            0.8670886075949367
          ],
          "recall": [
            0.923217550274223,
            0.7988338192419825
          ],
          "f1": [
            0.9009812667261374,
            0.8315629742033384
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 296,
          "cost_4_to_1_at_08": 0.23258426966292134
        },
        "iterations": null
      },
      {
        "configuration": {
          "id": "candidate_10",
          "family": "logistic",
          "representation": "raw57",
          "C": 0.1
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 0.2359308883486588,
          "accuracy": 0.9157303370786517,
          "balanced_accuracy": 0.9031744847325193,
          "Brier": 0.06564768410447097,
          "confusion_ham_spam": [
            [
              524,
              23
            ],
            [
              52,
              291
            ]
          ],
          "precision": [
            0.9097222222222222,
            0.9267515923566879
          ],
          "recall": [
            0.9579524680073126,
            0.8483965014577259
          ],
          "f1": [
            0.9332146037399822,
            0.8858447488584474
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 247,
          "cost_4_to_1_at_08": 0.16404494382022472
        },
        "iterations": [
          32
        ]
      },
      {
        "configuration": {
          "id": "candidate_11",
          "family": "logistic",
          "representation": "raw57",
          "C": 1
        },
        "warnings": [],
        "eligible": true,
        "validation": {
          "log_loss": 0.2344121299605018,
          "accuracy": 0.9168539325842696,
          "balanced_accuracy": 0.9073504565054018,
          "Brier": 0.06175780013342721,
          "confusion_ham_spam": [
            [
              519,
              28
            ],
            [
              46,
              297
            ]
          ],
          "precision": [
            0.9185840707964602,
            0.9138461538461539
          ],
          "recall": [
            0.9488117001828154,
            0.8658892128279884
          ],
          "f1": [
            0.9334532374100719,
            0.8892215568862275
          ],
          "support": [
            547,
            343
          ],
          "positive_actions_at_08": 258,
          "cost_4_to_1_at_08": 0.15730337078651685
        },
        "iterations": [
          71
        ]
      },
      {
        "configuration": {
          "id": "candidate_12",
          "family": "logistic",
          "representation": "raw57",
          "C": 10
        },
        "warnings": [
          {
            "type": "RuntimeWarning",
            "message": "divide by zero encountered in log"
          }
        ],
        "eligible": false,
        "failure": {
          "type": "ValueError",
          "message": "Use finite normalized log probabilities in [ham, spam] order"
        }
      }
    ],
    "overall_winner": "candidate_11",
    "family_winners": {
      "Gaussian": "candidate_06",
      "Bernoulli": "candidate_07",
      "logistic": "candidate_11"
    },
    "validation_lock_sha256": "c56196e4330827b22beaa4ea20af2550386040df37fd04d43296d99b251c2fc4",
    "test_reports": {
      "prior": {
        "log_loss": 0.6646012695366184,
        "accuracy": 0.6211111111111111,
        "balanced_accuracy": 0.5,
        "Brier": 0.23584954931548038,
        "confusion_ham_spam": [
          [
            559,
            0
          ],
          [
            341,
            0
          ]
        ],
        "precision": [
          0.6211111111111111,
          0
        ],
        "recall": [
          1,
          0
        ],
        "f1": [
          0.7662782727895819,
          0
        ],
        "support": [
          559,
          341
        ],
        "positive_actions_at_08": 0,
        "cost_4_to_1_at_08": 0.3788888888888889
      },
      "Gaussian": {
        "candidate": "candidate_06",
        "log_loss": 10.677199312028879,
        "accuracy": 0.8377777777777777,
        "balanced_accuracy": 0.8591168771213783,
        "Brier": 0.15920021736295575,
        "confusion_ham_spam": [
          [
            431,
            128
          ],
          [
            18,
            323
          ]
        ],
        "precision": [
          0.9599109131403119,
          0.7161862527716186
        ],
        "recall": [
          0.7710196779964222,
          0.9472140762463344
        ],
        "f1": [
          0.8551587301587301,
          0.8156565656565656
        ],
        "support": [
          559,
          341
        ],
        "positive_actions_at_08": 446,
        "cost_4_to_1_at_08": 0.5666666666666667
      },
      "Bernoulli": {
        "candidate": "candidate_07",
        "log_loss": 0.49429887447815796,
        "accuracy": 0.8911111111111111,
        "balanced_accuracy": 0.8780341938631511,
        "Brier": 0.09421040277750808,
        "confusion_ham_spam": [
          [
            521,
            38
          ],
          [
            60,
            281
          ]
        ],
        "precision": [
          0.8967297762478486,
          0.8808777429467085
        ],
        "recall": [
          0.9320214669051878,
          0.8240469208211144
        ],
        "f1": [
          0.9140350877192982,
          0.8515151515151516
        ],
        "support": [
          559,
          341
        ],
        "positive_actions_at_08": 299,
        "cost_4_to_1_at_08": 0.21888888888888888
      },
      "logistic": {
        "candidate": "candidate_11",
        "log_loss": 0.22066538208005895,
        "accuracy": 0.9277777777777778,
        "balanced_accuracy": 0.9218467204213641,
        "Brier": 0.05909118643146604,
        "confusion_ham_spam": [
          [
            529,
            30
          ],
          [
            35,
            306
          ]
        ],
        "precision": [
          0.9379432624113475,
          0.9107142857142857
        ],
        "recall": [
          0.9463327370304114,
          0.8973607038123167
        ],
        "f1": [
          0.9421193232413179,
          0.9039881831610044
        ],
        "support": [
          559,
          341
        ],
        "positive_actions_at_08": 267,
        "cost_4_to_1_at_08": 0.17666666666666667
      }
    },
    "reload_parity": {
      "Gaussian": {
        "max_test_log_difference": 8.731149137020111e-11,
        "edited_raw_case": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          4,
          8
        ],
        "edited_probabilities": [
          [
            1.0927845306514725e-9,
            0.9999999989072155
          ]
        ]
      },
      "Bernoulli": {
        "max_test_log_difference": 2.842170943040401e-14,
        "edited_raw_case": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          4,
          8
        ],
        "edited_probabilities": [
          [
            0.9999233867762818,
            0.00007661322371817038
          ]
        ]
      },
      "logistic": {
        "max_test_log_difference": 0,
        "edited_raw_case": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          4,
          8
        ],
        "edited_probabilities": [
          [
            0.7943067968579873,
            0.2056932031420126
          ]
        ]
      }
    },
    "state_sha256": "d19b95cbe8f2a45104db59e64c72792e5b3f9b9c18e387b8318a85a0909e51e4",
    "train_only_models_retained": true,
    "report_continuation": {
      "fits_executed": 0,
      "candidate_retries": 0,
      "original_failed_execution_sha256": "f5ef5fb6d12c8f8b3f6430ff5cadec4bba81d55bfcfcf7cb47c9d4656910d188",
      "raw_library_failure": {
        "logistic": {
          "nonfinite_log_cells": 2,
          "positions": [
            [
              73,
              0
            ],
            [
              332,
              0
            ]
          ],
          "warnings": [
            "divide by zero encountered in log"
          ],
          "stable_true_label_logs": [
            -0.012190065944295775,
            -0.000007756159197701467,
            -0.2838713800425747,
            -0.5829875996276496,
            -0.550402551223973,
            -0.004605506134819204,
            -0.3086277968454604,
            -0.0002462798021380925,
            -1.308465951002145,
            -0.09921711034485489,
            -0.2457258069738428,
            -0.01064297336767008,
            -0.03922399194779051,
            -0.04908714532686781,
            -0.3403471494259312,
            -0.016912912230833375,
            -0.0097563733744683,
            -2.14066121574341e-8,
            -0.007347465694626641,
            -0.029293949601817058,
            -0.004647883765133938,
            -0.1038011850502035,
            -0.007994867088225905,
            -0.1465332235405215,
            -0.9039430757838882,
            -0.007829252968069309,
            -0.00036507253219398526,
            -0.24417064964261206,
            -0.0011760404773807469,
            -0.0002496112315736415,
            -0.4702314002632293,
            -0.0002496112315736415,
            -0.0013170595062168661,
            -0.0002496112315736415,
            -0.5828636482817093,
            -0.10606321915767059,
            -0.1333883149604968,
            -0.00003766555214103381,
            -0.0015968831402484486,
            -0.01077194397180403,
            -0.1333883149604968,
            -0.0002643221322736444,
            -0.07581044231092399,
            -0.12417473657452308,
            -0.035062840124692046,
            -0.000017249201132983685,
            -0.0484406509873806,
            -0.7525423325200863,
            -0.008248683520646886,
            -0.010995573972013045,
            -0.05202070034920998,
            -0.03429426906021306,
            -0.3029756064946953,
            -0.4093015490199515,
            -0.21526780869571174,
            -0.006218998615630354,
            -0.10834576623008696,
            -0.000026138437323573374,
            -0.0025345033288674493,
            -0.0849657462779631,
            -0.04438258151910412,
            -0.0016091230000757745,
            -0.12443327748521595,
            -0.003930410215563383,
            -0.3788901069453427,
            -0.2334680030306301,
            -0.3788901069453427,
            -0.43297864767638927,
            -0.3788901069453427,
            -0.011764269772115657,
            -0.0017681813448782214,
            -0.7418236840470286,
            -0.5289326282450678,
            -1.1677160366154078e-25,
            -0.002692842575594727,
            -1.3371610334591113,
            -0.001012587828096496,
            -0.12443327748521595,
            -0.04351111295313197,
            -0.0001288754815959243,
            -0.05317405666581684,
            -0.000096500174457045,
            -0.3032719295384885,
            -0.0036333817909687334,
            -0.0036333817909687334,
            -0.3427263216441234,
            -0.0000029054736877335923,
            -0.5909703447237376,
            -0.190580061157398,
            -0.190580061157398,
            -0.008780092370438763,
            -0.26545643208929,
            -0.2741928389208424,
            -0.9985007859896285,
            -0.5257246071249901,
            -1.930350753083267,
            -8.887959264709478e-7,
            -0.005377655107322784,
            -0.009438915807592688,
            -5.700013231839439e-7,
            -0.021414896007773285,
            -0.00837118193779889,
            -0.24297257077897377,
            -0.24297257077897377,
            -0.0007991992559536851,
            -0.00003276066003690934,
            -0.020097469514537926,
            -0.3207346805429684,
            -0.0018187584441191431,
            -0.11738159131480425,
            -0.022956495013667057,
            -0.016212947057778777,
            -0.0055536747104105106,
            -0.06362586527983763,
            -0.002373383457885741,
            -0.6683143911008803,
            -0.003304623065254951,
            -0.06362586527983763,
            -0.17307523283826112,
            -1.4707839969181131,
            -1.1058723992741377,
            -0.0015103376523799162,
            -1.016904212726688,
            -0.1729834963442247,
            -0.0024072253007670287,
            -0.000014914949572224426,
            -0.0024072253007670287,
            -0.0079018003379674,
            -0.008477748713746161,
            -0.00010657102461165231,
            -0.4245813849646817,
            -0.0019290031861216824,
            -0.0008016440245969484,
            -0.028493656675101786,
            -0.04937625387199134,
            -0.024018369817800374,
            -0.3605713589207935,
            -0.0050281171739138845,
            -0.055312685245454275,
            -0.16208057667699752,
            -0.6226274080877741,
            -0.000014477162711911873,
            -0.000014477162711911873,
            -0.00592009354053185,
            -0.015302429396787214,
            -0.00802295393542192,
            -0.007859439077673077,
            -0.07621917550640861,
            -0.007818804450236496,
            -0.03356851384155846,
            -0.000014477162711911873,
            -0.1573756156925988,
            -0.008250881035907803,
            -0.0021621644214486016,
            -0.10363554431677995,
            -0.21737180275704648,
            -0.029570198821913675,
            -0.026299382241702914,
            -0.0017876247513343,
            -2.0397497538922544,
            -2.685390653227387e-7,
            -0.171042974935151,
            -0.07161092579463715,
            -0.171042974935151,
            -0.0013912605833133645,
            -0.000002459724856210114,
            -0.0008262108121757525,
            -0.3312619824185098,
            -0.000021374697274507206,
            -0.24272268303456077,
            -0.6626476240192853,
            -1.5060786045598091,
            -0.0018052288290415191,
            -0.2916941950177974,
            -0.4899252205709543,
            -0.0002250738091661317,
            -0.002370434173329604,
            -0.04541437728236453,
            -0.058334801772216296,
            -0.019038755493921828,
            -0.0006298758313109935,
            -0.09317442873314373,
            -0.09317442873314373,
            -0.0011529768828612752,
            -7.307702904304526e-14,
            -0.10407384937876304,
            -0.14044526981350183,
            -0.10600555863753328,
            -0.12339911292012984,
            -0.0006298758313109935,
            -0.0026223953138682773,
            -0.0025106177614375278,
            -0.056334440859206754,
            -0.18477203634066797,
            -0.000014477162711911873,
            -0.1032685940679448,
            -0.1032685940679448,
            -0.24819438019548518,
            -0.2960170639132219,
            -0.09426361680994659,
            -0.000012016171409001012,
            -0.19941925313339962,
            -0.13324027851251877,
            -0.08006324909690436,
            -0.03903875365047326,
            -0.0007659139107043047,
            -0.09109385438068206,
            -0.4994749481471829,
            -0.08542142261872658,
            -0.00926475893028114,
            -0.01590795566442602,
            -0.040648681441578544,
            -9.963639825515625e-10,
            -0.2916941950177974,
            -1.8835224243185922e-14,
            -0.3728858696416006,
            -1.8835224243185922e-14,
            -0.0021214234062160984,
            -0.019298172954303684,
            -0.2536668797433197,
            -0.6956823296228911,
            -0.16543489567309852,
            -0.000020953016562519142,
            -0.16543489567309852,
            -0.07432869018953651,
            -0.0398442268543408,
            -0.3847484602935464,
            -0.08431939897793804,
            -0.000014477162711911873,
            -0.7351182299729949,
            -0.5555630629115672,
            -0.025511313570142642,
            -0.022738998583481156,
            -1.3014292189571108,
            -0.00016994902937606343,
            -0.5487911052644787,
            -0.004343064443343817,
            -0.005907320981413526,
            -0.027269905675557544,
            -0.0003834465983723959,
            -0.001755465207499793,
            -0.00023070762263932202,
            -0.8472128690132004,
            -0.000014477162711911873,
            -0.000014477162711911873,
            -0.016655486799128295,
            -0.019556795659756147,
            -0.000025002096625811453,
            -0.000020177355710322695,
            -2.4799786632605674,
            -0.000018423135642906043,
            -1.0150909825378807,
            -0.0000691703148232473,
            -0.00019230205691481153,
            -0.006044977006296551,
            -0.5231691387244238,
            -0.0034230707253566045,
            -0.031415277119102754,
            -0.4420113614122818,
            -0.0011438000910552906,
            -0.0010409977259446162,
            -0.7117188501865888,
            -0.00001590647674118124,
            -0.5346263788255067,
            -0.04461223532851583,
            -0.0049333603908711275,
            -0.10633200915880087,
            -0.7065589790993354,
            -6.322655890740722,
            -0.6939169163634857,
            -0.0008325216966147838,
            -0.34496244205110727,
            -0.01704437760159236,
            -0.0010409977259446162,
            -0.0020077001019247116,
            -0.37811930463081317,
            -0.04433602039540719,
            -0.00097832945173513,
            -0.40186755942660324,
            -0.1699064747745592,
            -0.00196816802204702,
            -0.06333177744711385,
            -0.1436142200311444,
            -0.022654687061610196,
            -0.06216897389990166,
            -0.007145483141449534,
            -0.00888685087454717,
            -0.027941092065988653,
            -0.0004637003659330094,
            -0.0003343699399242774,
            -0.25997698357545895,
            -0.2996535594288126,
            -0.2996535594288126,
            -0.25034705147164377,
            -0.02171841569299924,
            -0.7519979501004465,
            -0.19629319626488873,
            -0.0008418561276861619,
            -0.022880394114481707,
            -5.450075622835907e-7,
            -0.4540543862015086,
            -0.0002694177117799417,
            -0.03883834723351737,
            -1.0037667460798896,
            -0.007272234054159344,
            -2.0949724031169397,
            -0.025181698597782937,
            -5.105064937522235,
            -0.003003932738150156,
            -1.06181334076193,
            -0.0018393274536572517,
            -0.022654687061610196,
            -0.021258921287977805,
            -0.06808869236199211,
            -0.0010125457517485663,
            -0.05765440249574117,
            -0.014053756364147704,
            -0.7274192786748839,
            -0.7210697974175176,
            -2.223985893290733,
            -1.589633949725869,
            -0.012710620040268093,
            -0.060859518402426614,
            -1.4131203794053464,
            -0.0052453016076254464,
            -0.0331055268036809,
            -0.0005665250822018886,
            -0.036978487076119254,
            -0.0016631348001281963,
            -0.09376093399248353,
            -1.2063157136957732,
            -2.100538141612327,
            -9.083362269109727e-38,
            -1.4181271950174366e-7,
            -0.00802295393542192,
            -0.8489742499065926,
            -0.000028068511400001698,
            -0.006433303596623775,
            -0.04482302572725418,
            -0.000017025420648743814,
            -0.27470574918167506,
            -1.0552776312239425,
            -6.018422177321933e-15,
            -9.645854181931937e-7,
            -1.8798941497422294e-11,
            -0.0006300415926546219,
            -0.00010675623202794328,
            -0.12417839394532847,
            -0.0004191141354716824,
            -1.954379721768747e-11,
            -0.0009932477012482809,
            -0.026467367142214242,
            -0.7379064743609308,
            -0.002476138771719526,
            -0.022948488523653172,
            -0.4547288004053443,
            -5.189657256360194e-9,
            -0.2315481111838774,
            -0.18359848371186763,
            -0.42357833623785235,
            -0.00011221972081849572,
            -1.0276619088801402,
            -0.0001291340785462821,
            -0.000009896954041921795,
            -0.23221985572943651,
            -0.05428409880890846,
            -0.00009221853792332688,
            -9.374808346450032e-7,
            -1.9819135535227934,
            -0.4989108588059826,
            -0.00559797159612746,
            -0.006651431216961259,
            -0.4809515533010026,
            -0.008625331937694632,
            -0.0015317990221849407,
            -0.00003387053538316838,
            -3.738915606540956e-7,
            -6.291154982047364e-26,
            -1.5338018378041746e-11,
            -0.009801905005458416,
            -0.15873776671371348,
            -0.00013145587559649025,
            -0.0021191790868821943,
            -3.446057825699294e-20,
            -1.4539331295424476e-12,
            -0.00003166236789826566,
            -0.03899770218758927,
            -0.021442676243839782,
            -0.00027971959934017606,
            -17.122245516308748,
            -0.0028778359092852105,
            -0.0001659159229994715,
            -0.16894760349641363,
            -0.000035475794000452736,
            -0.12166760709937553,
            -0.02253603543009307,
            -0.00045016919118379096,
            -0.3088039448177577,
            -2.0559544372456798e-10,
            -0.00003343378996157502,
            -8.284337630686992e-10,
            -0.03676498268763816,
            -0.00007647037415891188,
            -1.9280666741345674e-10,
            -0.000005312872430594139,
            -0.2583529936927493,
            -0.9704274563811623,
            -0.00692898685566267,
            -0.000059703500746416514,
            -1.7267192269736792e-9,
            -0.01731926382661914,
            -3.471318677444065e-7,
            -0.3049352213148884,
            -7.380172449397704e-7,
            -2.892984922653753e-7,
            -1.5338018378041746e-11,
            -8.972378800629405e-10,
            -7.870183198718005e-11,
            -0.034388982934432114,
            -0.05078078787653016,
            -2.820653634192838e-7,
            -0.0007271362944267332,
            -0.0024800374855627498,
            -4.3344254930719196e-8,
            -0.018772955639472642,
            -0.00002538157021546759,
            -0.01685119985269926,
            -6.018422177321933e-15,
            -0.0009816138439160168,
            -0.0024264092125487334,
            -0.01721069390979756,
            -1.5338018378041746e-11,
            -1.3275197158718358e-14,
            -6.697791317672187e-8,
            -0.000050967484445420806,
            -0.0000019620032063663765,
            -0.1526832438909914,
            -0.007994602805899222,
            -4.1317069108153565e-8,
            -0.28881796359295675,
            -0.000004842811828575982,
            -0.13500472231918714,
            -7.023089256845556e-9,
            -2.795555781647533,
            -0.04291186807232707,
            -0.0031511891602930627,
            -0.00021958849473100136,
            -0.031677857025102896,
            -0.00433451217393882,
            -0.2567389417191785,
            -0.00020649695753695163,
            -0.07238710668113889,
            -0.038639874942376855,
            -0.008803607079283241,
            -0.05359206307802798,
            -0.13203323585699844,
            -0.00005730582924488028,
            -0.01710096047141659,
            -0.03220214093990208,
            -0.00000329023663424302,
            -0.0014413547980660654,
            -3.085150181740299e-8,
            -0.011625357849684772,
            -1.2657297498534222e-7,
            -0.000006091384701497858,
            -7.669965355727488e-9,
            -8.463156301005218e-10,
            -0.5563643547328111,
            -0.3515635788239993,
            -0.19193980730987817,
            -1.0325224806093014e-7,
            -0.06194978479556228,
            -0.00010032158621268011,
            -0.0361142863379888,
            -0.009713555358006876,
            -0.003317411533827068,
            -0.05433105653735149,
            -0.02211930470302646,
            -0.0012601684783812464,
            -2.705451152712788e-7,
            -2.795555781647533,
            -7.023089256845556e-9,
            -2.795555781647533,
            -8.284337630686992e-10,
            -0.013329498083610723,
            -0.023013591994046137,
            -0.051559581128908315,
            -0.0000012310135055305458,
            -0.06965602392189028,
            -0.060993120705878145,
            -0.0206991193528794,
            -0.00020894205991519904,
            -0.07368573984388706,
            -0.2543724297344959,
            -0.14084947365006295,
            -3.875021038378261e-21,
            -0.024677594847566597,
            -0.2033768153650569,
            -0.4973802275900373,
            -0.000005281448028625115,
            -2.795555781647533,
            -6.14741442237005e-9,
            -3.945886694446034e-8,
            -0.000004848535626393129,
            -0.0006356680165015053,
            -0.033831041024220375,
            -0.0013385381754594042,
            -3.6512043310801145e-13,
            -3.6512043310801145e-13,
            -0.25539439343420156,
            -8.029514608053301e-7,
            -0.007960760702176264,
            -0.23310595592539296,
            -4.927802929996896e-9,
            -2.0791717088054385e-7,
            -0.06184423775021654,
            -0.001793282147924535,
            -0.17429516952325377,
            -0.00006147614844592929,
            -0.00040529271951863046,
            -8.651123146536865e-19,
            -3.444447136458431e-11,
            -0.14898796111574092,
            -0.039309598443524614,
            -0.3179575839341739,
            -0.5066118578521034,
            -0.00045490156721754834,
            -1.4760114179878054,
            -0.05730119761188148,
            -6.216355218682728e-8,
            -0.763594763358595,
            -0.05440798910751252,
            -0.0062050561788600175,
            -0.06736918936783694,
            -6.018422177321933e-15,
            -0.05203560306815176,
            -0.0000012116491882570289,
            -0.00011189291654078046,
            -0.028671319842722268,
            -0.000008550443571935204,
            -0.23578441384631071,
            -0.07131165774502385,
            -0.001182775814235762,
            -0.2260359439365062,
            -0.19364865302350925,
            -0.06457083732724347,
            -2.795555781647533,
            -0.14064394333899433,
            -0.0030494067595036485,
            -0.0030763566703963085,
            -0.004706115149257703,
            -0.2896859120524082,
            -0.048362778334952394,
            -0.04933616670432739,
            -0.000037623407692184966,
            -0.001196162357554077,
            -0.02088735385759028,
            -0.017143897369441746,
            -0.021786703494623486,
            -0.0000022387962259625816,
            -0.0043064485932111886,
            -0.000044250767859815104,
            -1.7140983654690356e-10,
            -0.3096751571392225,
            -0.3225529848688379,
            -8.912417851165755e-13,
            -7.341788602686687e-7,
            -0.0009930963670798797,
            -0.00023835813890546787,
            -0.0011328934221857,
            -0.002066115719923773,
            -0.003588399378719145,
            -1.3612600992204422,
            -0.004877568290525508,
            -0.008149333720238875,
            -0.0019253859727502347,
            -0.05850801359787556,
            -9.484994991681531e-12,
            -1.1445433733977737,
            -0.01631834468190673,
            -0.0012327207948269244,
            -0.17682937714010127,
            -0.018451797334347018,
            -0.04922681364567497,
            -2.795555781647533,
            -0.00015432285122643328,
            -9.184543364090327e-15,
            -2.217261967375782e-8,
            -0.1397192738529252,
            -0.011712683244701781,
            -0.009240600797980388,
            -0.0006314167731432537,
            -4.272030515070455e-10,
            -1.9777026966380292e-11,
            -0.018724072895060364,
            -0.004475152664593232,
            -0.005261833869837786,
            -1.2208346179430967e-7,
            -0.0031517137923632917,
            -0.0103463124944966,
            -0.03577610347001368,
            -1.2431408721546444,
            -0.15651857618839352,
            -0.004970868430958106,
            -1.5338018378041746e-11,
            -4.0756697655459806e-10,
            -0.10075311538365334,
            -1.2391110522938718e-18,
            -2.494164986851565e-7,
            -7.813332392226009e-19,
            -2.494164986851565e-7,
            -0.017217228192541643,
            -1.7945586198015787e-8,
            -1.3408491300038217e-18,
            -0.15642275148901483,
            -0.9521622363015481,
            -0.000002074406461037808,
            -3.0228975426082557e-9,
            -3.3028313326978928e-9,
            -0.47839807009085,
            -0.03566434065752984,
            -0.03566434065752984,
            -0.0661524453426555,
            -0.4307881376670976,
            -0.1567676132845297,
            -0.005740307694060923,
            -0.00022679216769284544,
            -2.795555781647533,
            -0.009867815274926597,
            -0.25669294699904055,
            -0.6391138851349958,
            -0.0009480193469923536,
            -0.033319507551750296,
            -0.3561089524903164,
            -1.7782786828197064e-22,
            -0.40580601178762604,
            -2.7320018280525915e-10,
            -0.00011542333394208967,
            -0.19912879981868128,
            -0.00000467448874304326,
            -0.000129776217496764,
            -0.08393349652670418,
            -0.3863836316938155,
            -0.0033745504161107782,
            -0.0441905216531606,
            -0.0004951998137784184,
            -0.40991881633406135,
            -2.0297700212152563,
            -0.03512041392044198,
            -0.000009498238543305522,
            -0.00020034081369595724,
            -0.24662232620560423,
            -0.0016758083744450288,
            -0.0004575771758659629,
            -0.00497221608566232,
            -1.0763820614441792e-7,
            -0.0007145016390100635,
            -0.0007145016390100635,
            -0.06524218230031896,
            -0.00009530995673065683,
            -0.050673871129350706,
            -1.0266975474608832e-8,
            -0.07997647831087769,
            -0.014101903826087827,
            -0.14629262912456156,
            -0.18140035325906592,
            -7.740639595252995e-9,
            -0.5306806540829447,
            -0.20779884868919343,
            -0.2584794232078662,
            -0.1954483043033443,
            -0.011067685742220095,
            -0.23970559923437157,
            -0.0000010714768584869922,
            -0.1424703319449624,
            -0.020595141428568654,
            -0.08724758647212827,
            -0.017583544503269242,
            -0.000009732611001138706,
            -0.000005377424044388634,
            -2.680599811200404,
            -2.795555781647533,
            -0.003201878557700814,
            -0.17769831369634723,
            -3.8589494888599156e-7,
            -0.015175887554530502,
            -0.3724836457481483,
            -0.11805627379250684,
            -0.000022959858800110153,
            -0.00017310741069212783,
            -0.10430859774763805,
            -0.268767002457834,
            -0.0036514264296212792,
            -0.006746944064786373,
            -0.0654708503337623,
            -0.07354373566469413,
            -0.03803146971264478,
            -0.19912879981868128,
            -0.13370238777581006,
            -0.35714555114857166,
            -1.5338018378041746e-11,
            -0.00016184223333965425,
            -0.11692678699630515,
            -0.04645814166934405,
            -0.3178397365627788,
            -2.795555781647533,
            -0.02727974767838182,
            -0.03030995542113742,
            -3.945886694446034e-8,
            -0.23066232326227337,
            -0.02112992550991196,
            -0.23963250208327333,
            -0.08014344922739831,
            -0.09506935059920424,
            -0.13230439132004887,
            -0.2014537501629096,
            -0.16031199094396978,
            -0.0019040368412112428,
            -0.0013168755781545766,
            -0.00955138718224859,
            -0.021187703266553455,
            -0.3300969590491945,
            -0.18413763596268568,
            -0.013306146500596869,
            -0.052567093455102014,
            -0.062368457245979135,
            -0.0000036708937100933326,
            -1.4322868680125818e-8,
            -0.000005674735961425919,
            -0.0049738315817376795,
            -2.795555781647533,
            -7.860008882505145e-8,
            -0.00018933042079304207,
            -0.0006982201775016586,
            -0.000001030043179694996,
            -5.4890381687718144e-9,
            -0.4435259846358888,
            -0.33983201227325927,
            -0.21936483777205104,
            -0.01675180715668151,
            -0.06668018630123577,
            -0.014595291971157614,
            -0.007211782769760085,
            -5.158946109570245e-7,
            -0.006650478702090556,
            -0.004186449065083281,
            -0.008167980848951265,
            -7.50929157873421e-7,
            -1.7641109644956685e-14,
            -6.156729652303027e-8,
            -2.7271865011624008e-11,
            -0.09196563236966686,
            -1.0211115125926506,
            -0.00008759818109004465,
            -3.1410474438890754e-7,
            -0.002401069522100547,
            -0.05400275954712514,
            -0.024302870888497852,
            -0.5566966640661248,
            -0.10877901806141119,
            -2.795555781647533,
            -0.033319507551750296,
            -6.018422177321933e-15,
            -0.0012678973185977203,
            -0.054194422000674904,
            -0.04313638693352468,
            -0.09916851016788135,
            -0.0004383902988814833,
            -0.18306707854304083,
            -0.000005847273622679889,
            -0.0028752581691307362,
            -0.012324435110509487,
            -0.000013029895450726497,
            -0.0009761449208284922,
            -0.000007494174560699194,
            -0.000005455418387570104,
            -0.04035524572280233,
            -0.00010062940233385594,
            -0.11777999680014481,
            -0.03963459989426504,
            -0.0037774261345791503,
            -1.9851258801582912e-10,
            -6.61195849271723e-13,
            -2.7271865011624008e-11,
            -0.105784154889098,
            -0.00025763502239459663,
            -8.869976674116164e-8,
            -0.0022921987665172933,
            -0.002541695385319664,
            -0.0000011446264372398195,
            -1.1715580943193606e-7,
            -7.050855495020535e-10,
            -0.00002922350273425136,
            -7.694278450072294e-25,
            -0.27739043704219296,
            -0.0130470441136052,
            -0.10202631077997763,
            -3.7407476308351626,
            -0.00009514830495019426,
            -0.000020692431736388272,
            -0.00007604070598657994,
            -0.005190843858475284,
            -0.00003720583619562571,
            -0.005029140507103371,
            -0.07834912156693301,
            -0.0022200254581949807,
            -0.1473765407043139,
            -0.2551123567743618,
            -0.0015086708822681055,
            -0.8272472019014968,
            -0.000010740108333160653,
            -0.0027400414824594816,
            -0.000030867481369475585,
            -0.009795633226203802,
            -0.13586025693110296,
            -0.0010649817086085698,
            -0.8010834613863137,
            -0.1775677089517526,
            -0.20812594311789787,
            -0.043363961001200955,
            -0.1777307981824736,
            -0.25204101698284775,
            -0.14557812470222634,
            -0.018300644833952717,
            -0.3399262064451354,
            -0.3870032005529962,
            -0.3565351622497698,
            -0.31774214596581263,
            -0.44551915809476206,
            -0.3901444357160885,
            -0.2798076546784278,
            -0.3957775116061432,
            -0.44862926279103155,
            -0.0003932515172581572,
            -0.2844261907026163,
            -0.4823539040996287,
            -0.014512922327076792,
            -0.0008532623049413248,
            -0.30682442848749336,
            -0.4607734227568273,
            -0.31173880803217924,
            -0.536427323720116,
            -0.2531974187826915,
            -0.043827372392256175,
            -0.06860246624722462,
            -0.4632658650211189,
            -0.26423795930896904,
            -0.02670473787896847,
            -0.10152673066735778,
            -0.5310982036898598,
            -0.00011030242818056353,
            -0.009240600797980388,
            -0.4908060746530802,
            -0.3270456464887249,
            -3.72330571140974e-7,
            -0.45845599815428983,
            -0.2631921034672624,
            -0.26910630866022045,
            -0.018072427418044712,
            -0.05035973120695922,
            -0.3852871450640415,
            -5.696546570693896e-20,
            -2.3583005306670026,
            -0.314458716876068,
            -0.2567825630415028,
            -0.022634723449911538,
            -0.6170345346625179,
            -0.00022298474508930698,
            -0.00013790383200191543,
            -5.553099783907196e-7,
            -0.025288174944121247,
            -0.0000500002865985673,
            -0.03934360587908983,
            -0.0005145525618731558,
            -0.0011698847702299269,
            -0.015245770207848812,
            -0.00016796363678961404,
            -0.025959540047359057,
            -0.1943268635412501,
            -9.213646219960966e-16,
            -1.8973555628734944e-14,
            -0.00154127215674028,
            -0.196223929438541,
            -0.07062912481507345,
            -0.24512076528480922,
            -0.0004016585463085229,
            -0.23100215804614788,
            -0.24379902072226184,
            -5.09464819979643e-7,
            -0.0010885883700646219,
            -0.4297561212993587,
            -0.06809534623872218,
            -0.07462115437984854,
            -0.024704567206197812,
            -0.05457434901353489,
            -0.09137458322416392,
            -0.00009450494167323002,
            -0.02165372978407777,
            -0.004228431842796231,
            -0.07210605794943262
          ]
        }
      },
      "test_logistic_route": "Saved L2 decision score -> stable logaddexp log probabilities; no clipping or parameter change",
      "validation_policy": "Original outcomes, including candidate12 failure, retained exactly",
      "corrected_program_sha256": "d9995776cf413e8402653131a57d6db78610366828122b5c41acc177c44a3659"
    }
  },
  "state": {
    "validation_lock_sha256": "c56196e4330827b22beaa4ea20af2550386040df37fd04d43296d99b251c2fc4",
    "models": {
      "candidate_06": {
        "format": "spambase-frozen-v1",
        "configuration": {
          "id": "candidate_06",
          "family": "Gaussian",
          "representation": "log1p57",
          "var_smoothing": 1e-7
        },
        "raw_schema": [
          "word_freq_make",
          "word_freq_address",
          "word_freq_all",
          "word_freq_3d",
          "word_freq_our",
          "word_freq_over",
          "word_freq_remove",
          "word_freq_internet",
          "word_freq_order",
          "word_freq_mail",
          "word_freq_receive",
          "word_freq_will",
          "word_freq_people",
          "word_freq_report",
          "word_freq_addresses",
          "word_freq_free",
          "word_freq_business",
          "word_freq_email",
          "word_freq_you",
          "word_freq_credit",
          "word_freq_your",
          "word_freq_font",
          "word_freq_000",
          "word_freq_money",
          "word_freq_hp",
          "word_freq_hpl",
          "word_freq_george",
          "word_freq_650",
          "word_freq_lab",
          "word_freq_labs",
          "word_freq_telnet",
          "word_freq_857",
          "word_freq_data",
          "word_freq_415",
          "word_freq_85",
          "word_freq_technology",
          "word_freq_1999",
          "word_freq_parts",
          "word_freq_pm",
          "word_freq_direct",
          "word_freq_cs",
          "word_freq_meeting",
          "word_freq_original",
          "word_freq_project",
          "word_freq_re",
          "word_freq_edu",
          "word_freq_table",
          "word_freq_conference",
          "char_freq_;",
          "char_freq_(",
          "char_freq_[",
          "char_freq_!",
          "char_freq_$",
          "char_freq_#",
          "capital_run_length_average",
          "capital_run_length_longest",
          "capital_run_length_total"
        ],
        "classes": [
          0,
          1
        ],
        "representation": "log1p57",
        "scaler": {
          "mean": [
            0.07618988851483702,
            0.10452137052221236,
            0.19044780663856736,
            0.00812216029723561,
            0.1961050027296952,
            0.07128043758307154,
            0.07371765525358977,
            0.07186079263968731,
            0.06321526034163746,
            0.15879850761706685,
            0.043920123109274296,
            0.32675230365301,
            0.069171787571601,
            0.03273806345381183,
            0.032885431664467196,
            0.1459133644190479,
            0.0958557634780534,
            0.11242491224750609,
            0.7711425156887889,
            0.04618816367595068,
            0.4306099220976742,
            0.036283566822237046,
            0.0714794913561789,
            0.06586530341487966,
            0.21086139237054968,
            0.12692678587433273,
            0.21316242003346678,
            0.06331924228448879,
            0.05057024876870869,
            0.05425068996718506,
            0.03351723050583802,
            0.02285808417403169,
            0.05066258581835554,
            0.023637210829704148,
            0.05549949713174423,
            0.05853904208844321,
            0.09236125637209915,
            0.005980382686442002,
            0.043136416375006134,
            0.03600089681169408,
            0.023049485734426185,
            0.05475748112890731,
            0.029027214028978603,
            0.03506480226513906,
            0.15150168075415826,
            0.0824358744200003,
            0.004359227765889255,
            0.019991378058069106,
            0.0250986974035478,
            0.11183558361252696,
            0.012270982563188986,
            0.180471169261681,
            0.060734793676523034,
            0.027901588840559315,
            1.3238189413651753,
            2.871465132160582,
            4.532611482570873
          ],
          "scale": [
            0.1843038249011721,
            0.3530779100565601,
            0.2927629391462944,
            0.12900130208385996,
            0.3291896367946124,
            0.17764810562055622,
            0.21160009978956568,
            0.2082329282575211,
            0.17595421852231866,
            0.32193638233003846,
            0.12920452210610409,
            0.414158184937021,
            0.1862415178356107,
            0.15423329156030524,
            0.15506984232398052,
            0.32143341616987237,
            0.2357312009308624,
            0.2680983794672176,
            0.6478026667584322,
            0.19717050213839696,
            0.5145233489702021,
            0.2620389170667477,
            0.20743686469103148,
            0.2037992326202302,
            0.47663439082528797,
            0.34677124826624595,
            0.629536859762338,
            0.23945614027752626,
            0.2311960867439158,
            0.20866011851545074,
            0.16592658039718497,
            0.1381820312615638,
            0.21578796548206067,
            0.13974644431168387,
            0.21617830897897153,
            0.1946341854788666,
            0.24554289761647202,
            0.07351865140286057,
            0.18744323550897143,
            0.158917791147197,
            0.15906896564020212,
            0.264020824971916,
            0.1343827684675406,
            0.18418564255938394,
            0.34720640205226566,
            0.3019973276438737,
            0.0503507285179234,
            0.13472497653770127,
            0.10911083856574623,
            0.15243953490109236,
            0.050485733864659016,
            0.30452937043482325,
            0.1498577296570853,
            0.13498897447475877,
            0.6122106307074786,
            1.3379232850471194,
            1.5521605029186283
          ],
          "variance": [
            0.0339678998732019,
            0.12466401056990832,
            0.08571013853757688,
            0.016641335939331293,
            0.10836581697296882,
            0.0315588494305723,
            0.04477460223095415,
            0.043360952410701925,
            0.030959887015799867,
            0.10364303426775269,
            0.016693808532666738,
            0.1715270021503277,
            0.0346859029657121,
            0.023787908225526126,
            0.02404665599838418,
            0.10331944103063435,
            0.05556919909230661,
            0.0718767410729482,
            0.41964829505933643,
            0.0388762069135076,
            0.2647342766355124,
            0.06866439405751387,
            0.0430300528328453,
            0.041534127216594705,
            0.22718034251739333,
            0.12025029862413036,
            0.39631665779942565,
            0.05733924311661033,
            0.05345163052570025,
            0.043539045058881946,
            0.02753163008230349,
            0.019094273763571794,
            0.046564446046887004,
            0.019529068697758563,
            0.04673306127300768,
            0.037882466157021844,
            0.06029131456989326,
            0.005404992104095333,
            0.03513496653807173,
            0.025254864343104127,
            0.0253029358298438,
            0.0697069960188511,
            0.018058728461000623,
            0.03392435092501315,
            0.12055228562607954,
            0.0912023859040412,
            0.002535195862285625,
            0.01815081930308416,
            0.011905175092520334,
            0.023237811800861357,
            0.002548809323853178,
            0.09273813745742979,
            0.02245733913797606,
            0.018222023229747076,
            0.3748018563512487,
            1.790038716671276,
            2.409202226820609
          ],
          "training_rows": 2811
        },
        "scratch": {
          "format": "nb-gaussian-M2-v1",
          "classes": [
            0,
            1
          ],
          "schema": [
            "word_freq_make",
            "word_freq_address",
            "word_freq_all",
            "word_freq_3d",
            "word_freq_our",
            "word_freq_over",
            "word_freq_remove",
            "word_freq_internet",
            "word_freq_order",
            "word_freq_mail",
            "word_freq_receive",
            "word_freq_will",
            "word_freq_people",
            "word_freq_report",
            "word_freq_addresses",
            "word_freq_free",
            "word_freq_business",
            "word_freq_email",
            "word_freq_you",
            "word_freq_credit",
            "word_freq_your",
            "word_freq_font",
            "word_freq_000",
            "word_freq_money",
            "word_freq_hp",
            "word_freq_hpl",
            "word_freq_george",
            "word_freq_650",
            "word_freq_lab",
            "word_freq_labs",
            "word_freq_telnet",
            "word_freq_857",
            "word_freq_data",
            "word_freq_415",
            "word_freq_85",
            "word_freq_technology",
            "word_freq_1999",
            "word_freq_parts",
            "word_freq_pm",
            "word_freq_direct",
            "word_freq_cs",
            "word_freq_meeting",
            "word_freq_original",
            "word_freq_project",
            "word_freq_re",
            "word_freq_edu",
            "word_freq_table",
            "word_freq_conference",
            "char_freq_;",
            "char_freq_(",
            "char_freq_[",
            "char_freq_!",
            "char_freq_$",
            "char_freq_#",
            "capital_run_length_average",
            "capital_run_length_longest",
            "capital_run_length_total"
          ],
          "units": [
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57",
            "standardized log1p57"
          ],
          "variance_floor": [
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7,
            1.0000000000000661e-7
          ],
          "class_count": [
            1682,
            1129
          ],
          "mean": [
            [
              -0.17127891592433026,
              -0.034840332486408984,
              -0.2291402700882124,
              -0.05854662706373381,
              -0.27931041302081877,
              -0.22883883657033466,
              -0.31075326096775946,
              -0.2128296449213327,
              -0.22134626888243258,
              -0.18094915276723467,
              -0.2545315081904878,
              -0.07374418107279974,
              -0.13718659541284614,
              -0.08283449547597464,
              -0.17355772610241496,
              -0.32942094070444083,
              -0.26295364098218077,
              -0.2153511237663045,
              -0.2877773301847614,
              -0.20802967392813307,
              -0.39812880660342576,
              -0.09330744605566452,
              -0.31810334238086896,
              -0.27937702150151184,
              0.28246813840654794,
              0.23228931761345784,
              0.22536445874793423,
              0.15100224273694804,
              0.14575668654467935,
              0.16515746129161765,
              0.13094067155663425,
              0.10937645884546812,
              0.12507239666918873,
              0.10673021608569198,
              0.15618271603566458,
              0.1297447334251851,
              0.16396413176772395,
              0.03649500006715909,
              0.12010929845162262,
              0.04095527132899969,
              0.09690589262100678,
              0.13449319303430643,
              0.11212538208532602,
              0.10707715218300169,
              0.12898791967538126,
              0.16555088694806164,
              0.0414176837785268,
              0.08905055582381285,
              0.03628222533586889,
              0.07722394240525765,
              0.06800003115222585,
              -0.3783013031282089,
              -0.3401974204046934,
              -0.10977448108054141,
              -0.37066237779832856,
              -0.43267768528633893,
              -0.37303174883126694
            ],
            [
              0.2551737259386398,
              0.05190561491774787,
              0.3413763811234364,
              0.08722358434118559,
              0.416120562179837,
              0.34092730125006077,
              0.4629645570839304,
              0.31707658348775397,
              0.32976476905246543,
              0.2695805801191305,
              0.37920460299059255,
              0.10986511298888246,
              0.20438250972931482,
              0.12340799060282392,
              0.2585687292331727,
              0.490775927603934,
              0.3917520142887651,
              0.3208331179582984,
              0.42873469386251456,
              0.3099255195279984,
              0.593137867765265,
              0.13901073894209034,
              0.47391481123529094,
              0.4162197964265159,
              -0.4208249856508284,
              -0.3460678761964662,
              -0.33575112454740663,
              -0.22496525445839524,
              -0.2171503514332633,
              -0.24605389715899056,
              -0.19507724495859935,
              -0.1629505790771397,
              -0.18633460690663325,
              -0.15900816958027064,
              -0.23268319607792678,
              -0.19329551959359229,
              -0.24427605813403278,
              -0.0543707618361027,
              -0.17894051372510877,
              -0.061015736382086024,
              -0.14437175499427177,
              -0.2003698411724405,
              -0.16704596339017191,
              -0.15952503983330749,
              -0.19216800787775778,
              -0.24664002820782616,
              -0.061704644920713037,
              -0.13266876430084756,
              -0.054053767063714606,
              -0.1150493101201438,
              -0.10130739804963843,
              0.5635985756081736,
              0.5068308778748536,
              0.163543558173142,
              0.5522179977473219,
              0.6446092707276967,
              0.5557479198708257
            ]
          ],
          "M2": [
            [
              1183.3357139379223,
              2374.6624675467074,
              1412.6947962746494,
              10.289744139244052,
              1141.4105213252492,
              794.6121866689306,
              192.83829462459624,
              755.0532375285649,
              737.1023681135123,
              1289.4096105895885,
              434.37819283996396,
              1939.8407053759333,
              1271.4643214199407,
              1285.7499943667165,
              271.20595596248995,
              489.4515244175705,
              550.6315545994114,
              873.6649310752891,
              1662.7352554549107,
              138.7974135682097,
              1061.235995056796,
              577.6846247945573,
              73.92371443502847,
              322.5997051711518,
              2449.4899899758875,
              2543.7456954497875,
              2595.9138912815743,
              2485.800695413766,
              2721.4202433816513,
              2642.18965675149,
              2705.494862846609,
              2753.1331684520305,
              2628.518372963856,
              2718.041177041932,
              2669.048792606197,
              2446.4904175219167,
              2215.5910305667694,
              2714.419967052798,
              2620.6897299118477,
              2375.546361845718,
              2771.3140852508923,
              2727.1989559657372,
              2670.652910794595,
              2687.2855262366006,
              2379.4855384490083,
              2642.6198875594023,
              2665.894782392713,
              2738.7925158886583,
              2306.8363655596877,
              2051.0906144747914,
              2143.1596574715577,
              793.8617300755863,
              195.30726800121948,
              548.2178004473451,
              535.9338782238909,
              1026.6999975547483,
              1500.4515750292885
            ],
            [
              1504.8070597680517,
              431.2540950871293,
              1178.4201366047473,
              2786.3554720896987,
              1342.8759267589567,
              1797.0808823296427,
              2213.749471857276,
              1866.251215513528,
              1868.71655420443,
              1384.4687480468806,
              2105.305437811684,
              848.3848177831196,
              1460.719340752117,
              1496.5147306182366,
              2413.645919506475,
              1867.088855347515,
              1970.799974742699,
              1743.1180964445207,
              801.4432116033456,
              2490.9670023252675,
              1085.9596469121516,
              2196.854633427965,
              2313.307113543058,
              2161.530898467841,
              27.36742305385724,
              41.28399970440564,
              2.387941362064184,
              229.70890945752296,
              0.6084703662777914,
              54.57794565375388,
              33.70223086446093,
              7.766498559968698,
              116.97038413061702,
              45.25340858247146,
              39.79639345487622,
              294.01230079231266,
              482.8213588094599,
              91.00227539760128,
              129.8950786823015,
              428.4291851688314,
              0.3586929338952638,
              8.049148621334993,
              87.696799269346,
              75.69841389857284,
              361.8372163037516,
              53.60283501610743,
              137.9212475905059,
              38.9976914480239,
              498.6507266606364,
              734.934883715175,
              648.4756271346507,
              1417.8047474301666,
              2131.0129236126595,
              2212.3165717001116,
              1699.6925498763617,
              1000.2894818431312,
              727.7954654831673
            ]
          ],
          "priors": [
            0.5983635716826752,
            0.4016364283173248
          ]
        },
        "library": {
          "theta": [
            [
              -0.17127891592433026,
              -0.034840332486408984,
              -0.2291402700882124,
              -0.05854662706373381,
              -0.27931041302081877,
              -0.22883883657033466,
              -0.31075326096775946,
              -0.2128296449213327,
              -0.22134626888243258,
              -0.18094915276723467,
              -0.2545315081904878,
              -0.07374418107279974,
              -0.13718659541284614,
              -0.08283449547597464,
              -0.17355772610241496,
              -0.32942094070444083,
              -0.26295364098218077,
              -0.2153511237663045,
              -0.2877773301847614,
              -0.20802967392813307,
              -0.39812880660342576,
              -0.09330744605566452,
              -0.31810334238086896,
              -0.27937702150151184,
              0.28246813840654794,
              0.23228931761345784,
              0.22536445874793423,
              0.15100224273694804,
              0.14575668654467935,
              0.16515746129161765,
              0.13094067155663425,
              0.10937645884546812,
              0.12507239666918873,
              0.10673021608569198,
              0.15618271603566458,
              0.1297447334251851,
              0.16396413176772395,
              0.03649500006715909,
              0.12010929845162262,
              0.04095527132899969,
              0.09690589262100678,
              0.13449319303430643,
              0.11212538208532602,
              0.10707715218300169,
              0.12898791967538126,
              0.16555088694806164,
              0.0414176837785268,
              0.08905055582381285,
              0.03628222533586889,
              0.07722394240525765,
              0.06800003115222585,
              -0.3783013031282089,
              -0.3401974204046934,
              -0.10977448108054141,
              -0.37066237779832856,
              -0.43267768528633893,
              -0.37303174883126694
            ],
            [
              0.2551737259386398,
              0.05190561491774787,
              0.3413763811234364,
              0.08722358434118559,
              0.416120562179837,
              0.34092730125006077,
              0.4629645570839304,
              0.31707658348775397,
              0.32976476905246543,
              0.2695805801191305,
              0.37920460299059255,
              0.10986511298888246,
              0.20438250972931482,
              0.12340799060282392,
              0.2585687292331727,
              0.490775927603934,
              0.3917520142887651,
              0.3208331179582984,
              0.42873469386251456,
              0.3099255195279984,
              0.593137867765265,
              0.13901073894209034,
              0.47391481123529094,
              0.4162197964265159,
              -0.4208249856508284,
              -0.3460678761964662,
              -0.33575112454740663,
              -0.22496525445839524,
              -0.2171503514332633,
              -0.24605389715899056,
              -0.19507724495859935,
              -0.1629505790771397,
              -0.18633460690663325,
              -0.15900816958027064,
              -0.23268319607792678,
              -0.19329551959359229,
              -0.24427605813403278,
              -0.0543707618361027,
              -0.17894051372510877,
              -0.061015736382086024,
              -0.14437175499427177,
              -0.2003698411724405,
              -0.16704596339017191,
              -0.15952503983330749,
              -0.19216800787775778,
              -0.24664002820782616,
              -0.061704644920713037,
              -0.13266876430084756,
              -0.054053767063714606,
              -0.1150493101201438,
              -0.10130739804963843,
              0.5635985756081736,
              0.5068308778748536,
              0.163543558173142,
              0.5522179977473219,
              0.6446092707276967,
              0.5557479198708257
            ]
          ],
          "variance": [
            [
              0.7035290619131523,
              1.4118089392073172,
              0.8398899907697083,
              0.006117664886589805,
              0.6786032636892088,
              0.47242113844764005,
              0.11464831321319634,
              0.4489021437149613,
              0.43822980755856855,
              0.7665932097441073,
              0.25825110644468724,
              1.153294217345977,
              0.7559241912128065,
              0.7644174569362167,
              0.16124026406806774,
              0.29099387194861503,
              0.32736725493425173,
              0.5194203919591492,
              0.9885466252407316,
              0.08251937084911397,
              0.6309370768470843,
              0.3434511254426619,
              0.043949989675997905,
              0.1917954062848703,
              1.4562961701402424,
              1.5123340449760925,
              1.5433496191923748,
              1.4778839855016443,
              1.6179669509997927,
              1.5708619648938704,
              1.6084988293975084,
              1.6368212465232048,
              1.5627339721544924,
              1.6159579936040023,
              1.5868305355565975,
              1.4545128333661812,
              1.3172361467103266,
              1.6138050744665862,
              1.5580796064874245,
              1.412334441168679,
              1.6476303528245495,
              1.621402570847644,
              1.5877842324581422,
              1.5976728266567186,
              1.4146764010992916,
              1.5711177501542226,
              1.5849553808517913,
              1.6282952937506887,
              1.3714842650176502,
              1.219435661518901,
              1.2741734992102007,
              0.4719749692482677,
              0.1161161927474551,
              0.3259322049032967,
              0.31862904068007786,
              0.6104043791645352,
              0.8920640566166994
            ],
            [
              1.3328672920000457,
              0.38197892647221376,
              1.043773471660538,
              2.4679854605754636,
              1.1894384762258252,
              1.591745788511641,
              1.9608056552323083,
              1.6530126912431604,
              1.6551963393307618,
              1.2262788848068031,
              1.864752480701226,
              0.7514481228371298,
              1.2938170537219815,
              1.325522447757517,
              2.137861853327258,
              1.6537546220084278,
              1.7456156666454377,
              1.543948812528362,
              0.7098700837053548,
              2.2063481977194574,
              0.9618775551923398,
              1.9458412279255668,
              2.048987800215286,
              1.9145535973142966,
              0.024240510145134845,
              0.03656697307741864,
              0.002115194209091394,
              0.2034623758702595,
              0.0005390462943115957,
              0.04834194734610618,
              0.029851500234243517,
              0.006879195270122851,
              0.10360540038141455,
              0.04008283567977986,
              0.03524934132407105,
              0.2604184355113487,
              0.42765409363105394,
              0.08060441833268493,
              0.11505331406758325,
              0.37947679191216244,
              0.0003178085331224657,
              0.0071295496203144315,
              0.07767662725362799,
              0.06704918228394406,
              0.3204936485418526,
              0.0474782532472165,
              0.12216240964615227,
              0.034541899333945,
              0.44167479146203403,
              0.6509610244598538,
              0.5743806377631981,
              1.255805899318128,
              1.8875226187003185,
              1.9595364788309226,
              1.5054850866043947,
              0.8859960980895758,
              0.6446373590639214
            ]
          ],
          "epsilon": 1.0000000000000661e-7,
          "class_prior": [
            0.5983635716826752,
            0.4016364283173248
          ]
        }
      },
      "candidate_07": {
        "format": "spambase-frozen-v1",
        "configuration": {
          "id": "candidate_07",
          "family": "Bernoulli",
          "representation": "presence54",
          "alpha": 0.1
        },
        "raw_schema": [
          "word_freq_make",
          "word_freq_address",
          "word_freq_all",
          "word_freq_3d",
          "word_freq_our",
          "word_freq_over",
          "word_freq_remove",
          "word_freq_internet",
          "word_freq_order",
          "word_freq_mail",
          "word_freq_receive",
          "word_freq_will",
          "word_freq_people",
          "word_freq_report",
          "word_freq_addresses",
          "word_freq_free",
          "word_freq_business",
          "word_freq_email",
          "word_freq_you",
          "word_freq_credit",
          "word_freq_your",
          "word_freq_font",
          "word_freq_000",
          "word_freq_money",
          "word_freq_hp",
          "word_freq_hpl",
          "word_freq_george",
          "word_freq_650",
          "word_freq_lab",
          "word_freq_labs",
          "word_freq_telnet",
          "word_freq_857",
          "word_freq_data",
          "word_freq_415",
          "word_freq_85",
          "word_freq_technology",
          "word_freq_1999",
          "word_freq_parts",
          "word_freq_pm",
          "word_freq_direct",
          "word_freq_cs",
          "word_freq_meeting",
          "word_freq_original",
          "word_freq_project",
          "word_freq_re",
          "word_freq_edu",
          "word_freq_table",
          "word_freq_conference",
          "char_freq_;",
          "char_freq_(",
          "char_freq_[",
          "char_freq_!",
          "char_freq_$",
          "char_freq_#",
          "capital_run_length_average",
          "capital_run_length_longest",
          "capital_run_length_total"
        ],
        "classes": [
          0,
          1
        ],
        "representation": "presence54",
        "scratch": {
          "format": "nb-discrete-v1",
          "family": "bernoulli",
          "alpha": 0.1,
          "schema": [
            "word_freq_make",
            "word_freq_address",
            "word_freq_all",
            "word_freq_3d",
            "word_freq_our",
            "word_freq_over",
            "word_freq_remove",
            "word_freq_internet",
            "word_freq_order",
            "word_freq_mail",
            "word_freq_receive",
            "word_freq_will",
            "word_freq_people",
            "word_freq_report",
            "word_freq_addresses",
            "word_freq_free",
            "word_freq_business",
            "word_freq_email",
            "word_freq_you",
            "word_freq_credit",
            "word_freq_your",
            "word_freq_font",
            "word_freq_000",
            "word_freq_money",
            "word_freq_hp",
            "word_freq_hpl",
            "word_freq_george",
            "word_freq_650",
            "word_freq_lab",
            "word_freq_labs",
            "word_freq_telnet",
            "word_freq_857",
            "word_freq_data",
            "word_freq_415",
            "word_freq_85",
            "word_freq_technology",
            "word_freq_1999",
            "word_freq_parts",
            "word_freq_pm",
            "word_freq_direct",
            "word_freq_cs",
            "word_freq_meeting",
            "word_freq_original",
            "word_freq_project",
            "word_freq_re",
            "word_freq_edu",
            "word_freq_table",
            "word_freq_conference",
            "char_freq_;",
            "char_freq_(",
            "char_freq_[",
            "char_freq_!",
            "char_freq_$",
            "char_freq_#"
          ],
          "classes": [
            0,
            1
          ],
          "class_count": [
            1682,
            1129
          ],
          "priors": null,
          "feature_count": [
            [
              236,
              173,
              444,
              6,
              357,
              180,
              31,
              124,
              118,
              284,
              71,
              700,
              194,
              68,
              28,
              145,
              155,
              200,
              952,
              29,
              549,
              13,
              48,
              33,
              597,
              446,
              473,
              243,
              209,
              251,
              160,
              109,
              198,
              111,
              243,
              291,
              427,
              32,
              179,
              139,
              87,
              172,
              154,
              158,
              455,
              269,
              32,
              107,
              292,
              905,
              234,
              426,
              175,
              137
            ],
            [
              414,
              394,
              693,
              20,
              711,
              422,
              464,
              384,
              349,
              530,
              357,
              716,
              332,
              137,
              184,
              604,
              450,
              432,
              994,
              234,
              902,
              64,
              384,
              423,
              33,
              20,
              7,
              19,
              7,
              8,
              2,
              1,
              39,
              6,
              27,
              69,
              69,
              14,
              40,
              125,
              1,
              12,
              50,
              36,
              288,
              39,
              13,
              11,
              178,
              739,
              82,
              952,
              680,
              323
            ]
          ]
        },
        "library": {
          "feature_log_prob": [
            [
              -1.9636022954368695,
              -2.273988277346173,
              -1.3318079772302802,
              -5.619568968349071,
              -1.5498418849279343,
              -2.2343454873464266,
              -3.9906499203431482,
              -2.6067700473177755,
              -2.6563260163250204,
              -1.7785314506681944,
              -3.163770402719142,
              -0.8766345575451844,
              -2.1594842493533726,
              -3.2068805263728697,
              -4.092088163188636,
              -2.4504345796381948,
              -2.3837876693458435,
              -2.1290404979386492,
              -0.5691876682366912,
              -4.05711956535089,
              -1.11957716524351,
              -4.855245509321231,
              -3.554575562416621,
              -3.9283244571453193,
              -1.03577313597539,
              -1.3273145973941176,
              -1.268550956891234,
              -1.9343848582062595,
              -2.0850451330937485,
              -1.9020064733647972,
              -2.352059119525668,
              -2.735592846689312,
              -2.1390857858238315,
              -2.7174270428827523,
              -1.9343848582062595,
              -1.7541908887767592,
              -1.3708395616809161,
              -3.9590017093923664,
              -2.2399134304616704,
              -2.4926646405989397,
              -2.9608008556698797,
              -2.279782036310843,
              -2.3902559972022663,
              -2.36462999531291,
              -1.3073405645057408,
              -1.8327746817954766,
              -3.9590017093923664,
              -2.754094762074634,
              -1.7507615301346418,
              -0.6198123046952118,
              -1.9721093650314714,
              -1.3731836790224703,
              -2.2625005002365306,
              -2.5071471529600684
            ],
            [
              -1.0031572058278124,
              -1.052660012178376,
              -0.48809040745539534,
              -4.028544881314303,
              -0.46245162948986174,
              -0.9840224435908809,
              -0.8891646501322041,
              -1.078361761027475,
              -1.1739062822683435,
              -0.7561990283855735,
              -1.1512488417789317,
              -0.45544487436643966,
              -1.223828567996633,
              -2.108554109811066,
              -1.8137856081403019,
              -0.6255249492346389,
              -0.9197949160804475,
              -0.9606076534414463,
              -0.1274268911612344,
              -1.5735163218824688,
              -0.22453931771674096,
              -2.86882033245271,
              -1.078361761027475,
              -0.981656138653312,
              -3.5297314139963167,
              -4.028544881314303,
              -5.069169912332065,
              -4.079576361326749,
              -5.069169912332065,
              -4.937400634700941,
              -6.287327351649957,
              -6.933954516575009,
              -3.363142229388014,
              -5.220975925200069,
              -3.729730968493679,
              -2.79370996560571,
              -2.79370996560571,
              -4.383089898995212,
              -3.3378883620668107,
              -2.2001512789064686,
              -6.933954516575009,
              -4.536059243776639,
              -3.115243688288515,
              -3.442971831040499,
              -1.3659570542888515,
              -3.363142229388014,
              -4.456652466172228,
              -4.622319588061046,
              -1.8469195060837178,
              -0.423831466588493,
              -2.6213266799209514,
              -0.17059462508768863,
              -0.507024850197741,
              -1.2513028235488814
            ]
          ],
          "class_log_prior": [
            -0.5135567303736384,
            -0.9122080067568703
          ]
        }
      },
      "candidate_11": {
        "format": "spambase-frozen-v1",
        "configuration": {
          "id": "candidate_11",
          "family": "logistic",
          "representation": "raw57",
          "C": 1
        },
        "raw_schema": [
          "word_freq_make",
          "word_freq_address",
          "word_freq_all",
          "word_freq_3d",
          "word_freq_our",
          "word_freq_over",
          "word_freq_remove",
          "word_freq_internet",
          "word_freq_order",
          "word_freq_mail",
          "word_freq_receive",
          "word_freq_will",
          "word_freq_people",
          "word_freq_report",
          "word_freq_addresses",
          "word_freq_free",
          "word_freq_business",
          "word_freq_email",
          "word_freq_you",
          "word_freq_credit",
          "word_freq_your",
          "word_freq_font",
          "word_freq_000",
          "word_freq_money",
          "word_freq_hp",
          "word_freq_hpl",
          "word_freq_george",
          "word_freq_650",
          "word_freq_lab",
          "word_freq_labs",
          "word_freq_telnet",
          "word_freq_857",
          "word_freq_data",
          "word_freq_415",
          "word_freq_85",
          "word_freq_technology",
          "word_freq_1999",
          "word_freq_parts",
          "word_freq_pm",
          "word_freq_direct",
          "word_freq_cs",
          "word_freq_meeting",
          "word_freq_original",
          "word_freq_project",
          "word_freq_re",
          "word_freq_edu",
          "word_freq_table",
          "word_freq_conference",
          "char_freq_;",
          "char_freq_(",
          "char_freq_[",
          "char_freq_!",
          "char_freq_$",
          "char_freq_#",
          "capital_run_length_average",
          "capital_run_length_longest",
          "capital_run_length_total"
        ],
        "classes": [
          0,
          1
        ],
        "representation": "raw57",
        "scaler": {
          "mean": [
            0.10238705087157597,
            0.27918534329420114,
            0.27289932408395623,
            0.042483102098897184,
            0.303048737104233,
            0.09477054429028818,
            0.10989327641408758,
            0.10693703308431174,
            0.08594450373532553,
            0.2567022411953046,
            0.05531127712557819,
            0.5346958377801487,
            0.09575595873354678,
            0.05059409462824616,
            0.050732835289932436,
            0.24532194948416983,
            0.1413945215225899,
            0.17376378512984705,
            1.6651511917467121,
            0.0783600142298114,
            0.7903059409462843,
            0.1227001067235859,
            0.10487726787620064,
            0.10301672002845978,
            0.47420846673781564,
            0.24538242618285308,
            0.8998754891497688,
            0.11246175738171477,
            0.10258271077908217,
            0.08920668801138387,
            0.055464247598719346,
            0.03796157950907153,
            0.09117751689790109,
            0.039046602632515144,
            0.09689790110281041,
            0.08797936677339033,
            0.14131270010672378,
            0.010736392742796157,
            0.07222696549270724,
            0.0560441124155105,
            0.045560298826040554,
            0.12642120241906793,
            0.042006403415154735,
            0.06842404838135897,
            0.2766310921380293,
            0.17249021700462458,
            0.006051227321237993,
            0.036040554962646736,
            0.03471718249733192,
            0.13327499110636795,
            0.013842049092849513,
            0.283964069726076,
            0.07878121664887934,
            0.04756029882604058,
            5.233996798292401,
            50.80149413020278,
            282.9018143009605
          ],
          "scale": [
            0.29776415910303355,
            1.6145852512076682,
            0.4958017523433407,
            1.166614482943474,
            0.6513863857365723,
            0.2677661833063842,
            0.39863925786262866,
            0.3883056297977802,
            0.27307788039195596,
            0.6971786742277027,
            0.1785803164733025,
            0.8515608568386459,
            0.3107139782870833,
            0.2764558873541633,
            0.26862701515120085,
            0.7481450043780864,
            0.41788065062025326,
            0.5087178025348642,
            1.7925857233350349,
            0.4050136431138548,
            1.1705735271170632,
            1.0470358979216867,
            0.35754848947471113,
            0.5003578293448903,
            1.5028555191478257,
            0.8944065212303803,
            3.69610855463919,
            0.5175846143646483,
            0.6528390913782044,
            0.40103855344566913,
            0.32839533595383547,
            0.27520596074412657,
            0.48824830915286327,
            0.2769386212911918,
            0.5551637067258676,
            0.3488007215682286,
            0.4377836453640201,
            0.18328689525414632,
            0.4058272003460771,
            0.31046344818834676,
            0.38815593204368976,
            0.7934614953089946,
            0.22412697451681762,
            0.5745132716488963,
            0.9816446672480851,
            0.8136559409297265,
            0.07808625388851512,
            0.3390420259075027,
            0.2237470828478427,
            0.21865247091028991,
            0.06502122322647684,
            0.9403982692414257,
            0.27467551856866873,
            0.5029887566008878,
            30.484630277650638,
            131.3517024559373,
            614.3239315583934
          ],
          "variance": [
            0.08866349444633669,
            2.606885533417329,
            0.24581937762672731,
            1.360989351813469,
            0.42430422352295455,
            0.07169872892246815,
            0.15891325790926736,
            0.15078126213265072,
            0.07457152875936342,
            0.4860581037978973,
            0.03189092943170488,
            0.7251558928997688,
            0.09654317630298608,
            0.07642785765277785,
            0.0721604732690435,
            0.559720947575887,
            0.17462423816280617,
            0.25879380261590107,
            3.2133635755045904,
            0.16403605110835695,
            1.3702423823872818,
            1.096284171536673,
            0.12784092232564762,
            0.25035795738673033,
            2.2585747114330803,
            0.7999630252194307,
            13.661218447677001,
            0.26789383302700165,
            0.42619887923151956,
            0.16083192134979482,
            0.10784349667623246,
            0.07573832082909772,
            0.23838641139062997,
            0.07669499996266614,
            0.3082067412656051,
            0.12166194336651694,
            0.1916545201482101,
            0.03359408597190441,
            0.164695716540735,
            0.09638755266099829,
            0.15066502758070552,
            0.6295811445379855,
            0.05023290070606221,
            0.3300654993007185,
            0.9636262527366036,
            0.6620359902102385,
            0.006097463046341642,
            0.11494949533146373,
            0.050062757082919386,
            0.04780890303517518,
            0.004227759469867331,
            0.8843489047922689,
            0.07544664050096707,
            0.2529976892669072,
            929.3126831650541,
            17253.269738073082,
            377393.8928853616
          ],
          "training_rows": 2811
        },
        "coefficients": [
          [
            -0.013771817793279796,
            -0.31958279008509466,
            0.06866772657764343,
            0.8886909378142275,
            0.2908284869021214,
            0.22977665229863448,
            0.749834705986325,
            0.13055706997414837,
            0.1341530322012494,
            0.07368982629147404,
            0.18448327643475695,
            -0.1250737572696752,
            0.012377737967088024,
            -0.012349305322266751,
            0.26116642326715017,
            0.6287568026867061,
            0.3720807629424937,
            0.12890797415750624,
            0.04057797854664823,
            0.3587677565619573,
            0.2894017086728117,
            0.19774159737982488,
            0.9477632232170042,
            0.3289161226771375,
            -3.043960981991719,
            -0.794080182791105,
            -3.479782326906968,
            0.18521926971361954,
            -1.2353977586576006,
            -0.30496990563569004,
            -0.004651114519476088,
            -0.4196351445691681,
            -0.6118711515628014,
            -0.10083075716445353,
            -1.135952177738997,
            0.2522550282952572,
            0.04894982346846292,
            -0.1316784079069864,
            -0.3814649963013435,
            -0.3267794206874092,
            -1.1216889295092096,
            -1.4659185300827058,
            -0.15660336578972503,
            -0.8973791415064086,
            -0.742875249325725,
            -1.6231897075359578,
            -0.11588887918717206,
            -1.0129574058483075,
            -0.21902503087348246,
            -0.04966993120712113,
            -0.13901305694522664,
            0.23893708411450262,
            1.2089400307461025,
            0.9528223228353794,
            1.1460727510292097,
            0.7988492928962085,
            0.49383587220630537
          ]
        ],
        "intercept": [
          -2.5061266118719367
        ],
        "iterations": [
          71
        ]
      }
    }
  }
};
