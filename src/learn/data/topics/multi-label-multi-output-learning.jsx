import { H2, H3 } from "../../components/content/Headings.jsx";
import { Prose } from "../../components/content/Prose.jsx";
import { NeuralTable } from "../../components/lesson-labs/NeuralLessonElements.jsx";
import { Math as InlineMath, MathBlock } from "../../components/content/Math.jsx";
import { CodeBlock } from "../../components/content/Code.jsx";
import { MessageOutputFigure, VocabularyMatrixFigure, OutputKindsFigure, GroupBoundaryFigure, SupportAllocationFigure, ObservedMaskFigure } from "../../components/lesson-labs/MultiLabelReadingFlowFoundation.jsx";
import { WrongBitsFigure, PoolingFigure, NonlinearAverageFigure, RankingFigure } from "../../components/lesson-labs/MultiLabelReadingFlowMetrics.jsx";
import { IndependentHeadsFigure, BinaryPullbackFigure, ObservedGradientFigure } from "../../components/lesson-labs/MultiLabelReadingFlowHeads.jsx";
import { JointTilesFigure, BayesRiskFigure, F1SetSizeFigure, MultiLabelJointLawProvider } from "../../components/lesson-labs/MultiLabelReadingFlowJoint.jsx";
import { ThresholdTiesFigure, PooledCutoffsFigure, WeightedOddsFigure } from "../../components/lesson-labs/MultiLabelReadingFlowThresholds.jsx";
import { ChainAnatomyFigure, ChainFactorizationFigure, GreedyMapFigure, MarginalPathsFigure, RecordedChainPathFigure } from "../../components/lesson-labs/MultiLabelReadingFlowChains.jsx";
import { ContextMixtureFigure, MarginalJointEntropyFigure, PairInteractionFigure, PairCovarianceTable } from "../../components/lesson-labs/MultiLabelReadingFlowContext.jsx";
import { StrictPrefixFigure, RecordedChainEnsembleFigure } from "../../components/lesson-labs/MultiLabelReadingFlowChainSystems.jsx";
import { RestrictedClassBridgeFigure } from "../../components/lesson-labs/MultiLabelReadingFlowRestrictedChain.jsx";
import { PowersetVocabularyFigure, PublishedLabelsetVotesFigure, CoverageBoundaryFigure } from "../../components/lesson-labs/MultiLabelReadingFlowLabelsets.jsx";
import { LabelsetSystemsFigure } from "../../components/lesson-labs/MultiLabelReadingFlowLabelsetSystems.jsx";
import { NeighbourIdentityFigure, NeighbourHistogramFigure, NeighbourPosteriorFigure, PairMarginFigure } from "../../components/lesson-labs/MultiLabelReadingFlowNeighbours.jsx";
import { VirtualRelevanceFigure } from "../../components/lesson-labs/MultiLabelReadingFlowVirtualRanking.jsx";
import { CategoricalArraysFigure, FeasibleCubeFigure, ConstrainedRepairFigure } from "../../components/lesson-labs/MultiLabelReadingFlowCategorical.jsx";
import { UnitResidualFigure, SeparateMatrixSolveFigure, LinearChainCancellationFigure, RootReductionFigure } from "../../components/lesson-labs/MultiLabelReadingFlowNumeric.jsx";
import { SharedScaleSplitFigure, EditedSharedSeparateFigure } from "../../components/lesson-labs/MultiLabelReadingFlowPartitions.jsx";
import { WholeFeatureRowFigure, GeneralDesignProximalFigure } from "../../components/lesson-labs/MultiLabelReadingFlowFeatureSharing.jsx";
import { FittedResponseProjectionFigure, ReducedRankSolveFigure, RareLabelCompressionFigure, CompressedRecoveryFigure, SparseOutcomesDenseMeanFigure } from "../../components/lesson-labs/MultiLabelReadingFlowCompression.jsx";
import { LabelScaleObjectsFigure, CandidateRetrievalFigure } from "../../components/lesson-labs/MultiLabelReadingFlowScale.jsx";
import { SplitGradientSketchFigure, JoinedSharedPullbackFigure, OutputCovarianceFigure } from "../../components/lesson-labs/MultiLabelReadingFlowFrontier.jsx";
import { EnergyConfigurationFigure, EnergyGeometrySplitFigure, EnergyValidationLockFigure, EnergyFrozenTestFigure } from "../../components/lesson-labs/MultiLabelReadingFlowEnergy.jsx";
import { EnergySavedForwardFigure } from "../../components/lesson-labs/MultiLabelReadingFlowEnergySystems.jsx";
import { RecordedTextInventoryFigure } from "../../components/lesson-labs/MultiLabelReadingFlowTextStudy.jsx";
import { RecordedTextCostFigure, CensoredOutputContractFigure } from "../../components/lesson-labs/MultiLabelReadingFlowTextCost.jsx";
import { MultiLabelSupportingFiles } from "../../components/lesson-labs/MultiLabelReadingFlowFiles.jsx";
import { MultiLabelProgramSource } from "../../components/lesson-labs/MultiLabelReadingFlowPrograms.jsx";
const contexts = [
  {
    "key": "section-1-0",
    "filename": "schema.py",
    "title": "schema.py · checked_transform",
    "sha256": "495ce546f8f68a9d7388a47f9d731c22a9539c0ce5838a550f9c76ef6830efb0",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "checked_transform",
        "start": 12,
        "end": 16,
        "sha256": "3aae05d09d8784c6c402121fe1bcdbe38e066612fe59d8096fa6c7865f7bd0a9"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-1-1",
    "filename": "masked-binary-heads.py",
    "title": "masked-binary-heads.py · binary_schema, encode_collections",
    "sha256": "caaf75aaac95cec40dfdf0de8829a4e981b7dcd63fd977d395bb716e31b09bfe",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "binary_schema",
        "start": 19,
        "end": 25,
        "sha256": "c6e318e32f36be76eafba2c7b57653fe8ae2d395457564771464f589b18f1a77"
      },
      {
        "name": "encode_collections",
        "start": 28,
        "end": 36,
        "sha256": "c8e49fbd70c8324e450536570485f11b0c3a6c160861fb99ac5f8d78a4b173c4"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-2-2",
    "filename": "masked-binary-heads.py",
    "title": "masked-binary-heads.py · iterative_folds",
    "sha256": "caaf75aaac95cec40dfdf0de8829a4e981b7dcd63fd977d395bb716e31b09bfe",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "iterative_folds",
        "start": 151,
        "end": 215,
        "sha256": "344a3fe3dc24ee7048146ac27573267167eef300821a1b9ce2636e6425f220f2"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-3-3",
    "filename": "metrics.py",
    "title": "metrics.py · complete program",
    "sha256": "3ab198ec44c86197c8f45f3a5871c0b6b7a74ed3eb762177157b8b13f6217c91",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-3-4",
    "filename": "ranking-and-calibrated-labels.py",
    "title": "ranking-and-calibrated-labels.py · ranking_metrics, step_average_precision, ap_axes",
    "sha256": "14085d6dd33b1dd85374d7b0846a530921aac8b610e8169065dc08f702dac8cd",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "ranking_metrics",
        "start": 35,
        "end": 68,
        "sha256": "d646c0cd8982f2209539468a32a57ce1c7b8ef064ce68c25eace86a891245cdc"
      },
      {
        "name": "step_average_precision",
        "start": 71,
        "end": 107,
        "sha256": "fde1cb7340d790b97c951fc3d413389176689f83729834902c281bd3fe3cac17"
      },
      {
        "name": "ap_axes",
        "start": 110,
        "end": 123,
        "sha256": "9e9e105c41f11482f35c98cca86a372092d12245dac945a392ca53b1c9e81ad3"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-4-5",
    "filename": "numpyHeads.py",
    "title": "numpyHeads.py · sigmoid, fit",
    "sha256": "06c0126069da258d3e4e97b1b9159f4061bb1f4de8667812676fa6d242f0c63a",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "sigmoid",
        "start": 22,
        "end": 23,
        "sha256": "57b910cce480d7f9b91de3b7d3a0d4bd0fbdcd022238295a811833f7a265a97f"
      },
      {
        "name": "fit",
        "start": 26,
        "end": 31,
        "sha256": "ea1751b4a66d9bc64594dde5b7d227ca1c1f1f527bd7234d0b3b129a521eaf16"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-4-6",
    "filename": "multioutput_newton.py",
    "title": "multioutput_newton.py · sigmoid, objective, fit_newton",
    "sha256": "7bf43c6932d8aeb13aec429499b7c8a741d4e87ba2af92d1791fbe8a6ad4e660",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "sigmoid",
        "start": 10,
        "end": 17,
        "sha256": "e2dc6577325e03af3400084ec1aa3bcd74544b1f7ea40bc56e9ece8ecf250b1f"
      },
      {
        "name": "objective",
        "start": 20,
        "end": 31,
        "sha256": "b26e605637ce3ca95244b8eb289c1dcda801dcd288afeb0deeac861ba8e5cdd8"
      },
      {
        "name": "fit_newton",
        "start": 34,
        "end": 71,
        "sha256": "68c0a0cf030d50980f5959ced05aad5d95b6212f3ce801bafad6fcd5082fad83"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-4-7",
    "filename": "masked-binary-heads.py",
    "title": "masked-binary-heads.py · observed_arrays, masked_objective, fit_observed_heads, head_probabilities",
    "sha256": "caaf75aaac95cec40dfdf0de8829a4e981b7dcd63fd977d395bb716e31b09bfe",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "observed_arrays",
        "start": 39,
        "end": 55,
        "sha256": "9f8180ada99235727827963c5791548e8f986ab92708b7432e9dc2ec35680229"
      },
      {
        "name": "masked_objective",
        "start": 58,
        "end": 75,
        "sha256": "497e1ccdd87f56b472ff999bc00175f7d7ddaa7829d1f7dda20becb64a8600c1"
      },
      {
        "name": "fit_observed_heads",
        "start": 78,
        "end": 126,
        "sha256": "4ff11417f90a52e45b140c6ee0bacf24248078a5438e5aea01928ad6bcb2d660"
      },
      {
        "name": "head_probabilities",
        "start": 129,
        "end": 148,
        "sha256": "d7718a0d87658eccb98931264d7007bdad2c5b950257e58e20e08d07ac640b8c"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-5-8",
    "filename": "joint.py",
    "title": "joint.py · complete program",
    "sha256": "b6e79757d5a74a723fe2e08c86da8a610b10b2a4ca27fac498e24536e43d8ab1",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-5-9",
    "filename": "joint-f1-decisions.py",
    "title": "joint-f1-decisions.py · complete_law, all_action_risks, gfm, gfm_from_parameters",
    "sha256": "0a0b7cecd07ce3dabfc62c3714ea67d9ce548d935294b074af614678653d9a8d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "complete_law",
        "start": 34,
        "end": 53,
        "sha256": "f64896a6b19343553b17082fca4b3765eabf8969765cd13feaef4947b93c8b34"
      },
      {
        "name": "all_action_risks",
        "start": 71,
        "end": 115,
        "sha256": "c31234ada282a65349968d891e74fba96cfe65f97757f20ba0264a654bbfd5ba"
      },
      {
        "name": "gfm",
        "start": 118,
        "end": 138,
        "sha256": "6702b34b19a83efae000ad8310d001eb24f90124998ff8ac35549cfd8925506a"
      },
      {
        "name": "gfm_from_parameters",
        "start": 141,
        "end": 210,
        "sha256": "fed06146aba5db4a474bf28fb54520e886e5c4959db7f107b710909c4b406e58"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-6-10",
    "filename": "thresholds.py",
    "title": "thresholds.py · score",
    "sha256": "ce77f74e274d0acb665ca5744f0a60d1457ce463f312acd5ee9a88a98297aa44",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "score",
        "start": 12,
        "end": 13,
        "sha256": "d9fdea220c36eb5c40bb72b2717f5b42e80727f7c4db09dfbccd9c153994c897"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-7-11",
    "filename": "chain-fit-and-decode.py",
    "title": "chain-fit-and-decode.py · library_teacher_chain, compare_library_stages",
    "sha256": "b09e74d38e059756f4138dcaf5b354cee11e053a214d6124ec93bcb36e22d596",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "library_teacher_chain",
        "start": 29,
        "end": 43,
        "sha256": "399a70f0f812f850b72e78c2bbdb9889f8e59eb33b54efe966303c5b51a36ea5"
      },
      {
        "name": "compare_library_stages",
        "start": 46,
        "end": 73,
        "sha256": "438115b3fe8db256585a6bfac49f581c2ea1545b227443e6cb7ee20361ad0787"
      }
    ],
    "dependencies": [
      "chain_core.py"
    ]
  },
  {
    "key": "section-7-12",
    "filename": "chain_core.py",
    "title": "chain_core.py · fit_prefix, fit_chain, serve_greedy, path_probability, exact_joint, joint_actions",
    "sha256": "e475567d20c239df651d975b55cea9180a88607dbcc1b2f6b68d91095b482d97",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "fit_prefix",
        "start": 119,
        "end": 145,
        "sha256": "bf9dd690500790371afcf64af51353fa975a133b75a7b22c800310d1824333bc"
      },
      {
        "name": "fit_chain",
        "start": 148,
        "end": 150,
        "sha256": "29d2fe9adaa01b4db66fe856c87a256971be08eb634437232b3c045270d36555"
      },
      {
        "name": "serve_greedy",
        "start": 172,
        "end": 179,
        "sha256": "12b8a9edd66bc44ce6118c81b9eed2e8bfdb7b03f657f65313745774b459cc39"
      },
      {
        "name": "path_probability",
        "start": 182,
        "end": 200,
        "sha256": "a8ec82fe3ff6fb69a60b31ba8feffb825fb1997b343a0f4de0d7f8332fcd1d2a"
      },
      {
        "name": "exact_joint",
        "start": 203,
        "end": 256,
        "sha256": "8de15d009d82ea5eb12d4af72f149310944afe2ad4f43e0b9de072d042ac5962"
      },
      {
        "name": "joint_actions",
        "start": 259,
        "end": 289,
        "sha256": "fd04c4136ac987bae606b69c97c4fcf2ad2d0651c8e8e2a198b49daab002ee5b"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-7-13",
    "filename": "chainApi.py",
    "title": "chainApi.py · complete program",
    "sha256": "3ef85099514004d1a188fff77b2eac48584cd575aeb423d243bce8b3532b5afd",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-8-14",
    "filename": "chain_core.py",
    "title": "chain_core.py · gate_witness",
    "sha256": "e475567d20c239df651d975b55cea9180a88607dbcc1b2f6b68d91095b482d97",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "gate_witness",
        "start": 380,
        "end": 404,
        "sha256": "03c62f501c5edaa669e972d35afcd80f85fa28c956000bf19e4b2663d2598318"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-8-15",
    "filename": "association.py",
    "title": "association.py · independent",
    "sha256": "1ba9f1c26a60d754579d23d798d49794beda975cdc009ea19815785b83bb6fbf",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "independent",
        "start": 4,
        "end": 5,
        "sha256": "5c898c50e466cb6a490f43bea56ec402da4255e28d1d5ea6861c501ebeef9627"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-8-16",
    "filename": "masked-binary-heads.py",
    "title": "masked-binary-heads.py · entropy_of_bits, entropy_split",
    "sha256": "caaf75aaac95cec40dfdf0de8829a4e981b7dcd63fd977d395bb716e31b09bfe",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "entropy_of_bits",
        "start": 218,
        "end": 231,
        "sha256": "d0f4ecc0dcbce0a82b85ec78559cb882d0cc209253841a685396bc4bff2ba8d0"
      },
      {
        "name": "entropy_split",
        "start": 234,
        "end": 243,
        "sha256": "27bba45604aa123b9ff023beb89a9867c0aefe990caea1786f8414c375cc170a"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-8-17",
    "filename": "joint-f1-decisions.py",
    "title": "joint-f1-decisions.py · joint_features, log_linear_objective, fit_log_linear, predict_log_linear",
    "sha256": "0a0b7cecd07ce3dabfc62c3714ea67d9ce548d935294b074af614678653d9a8d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "joint_features",
        "start": 235,
        "end": 246,
        "sha256": "879fee722c3eabc6d9ddec953dd112d9bfa4583dfcce485a43a953a5b8c55d43"
      },
      {
        "name": "log_linear_objective",
        "start": 249,
        "end": 283,
        "sha256": "df123072264de5aee73e53c422be488ff2804bcdb16688569791ff7a25c5a322"
      },
      {
        "name": "fit_log_linear",
        "start": 286,
        "end": 326,
        "sha256": "62d3199891a3984a722dc9ceb9aabb8b3b18fcbb99af684e1752c106674a6e67"
      },
      {
        "name": "predict_log_linear",
        "start": 329,
        "end": 340,
        "sha256": "5bda78b20bf6c67e857ad7551c968510f62577de4c647ba33d4844e14164e0f0"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-8-18",
    "filename": "chain_core.py",
    "title": "chain_core.py · prefix_fold_inputs, fit_strict_prefix_chain",
    "sha256": "e475567d20c239df651d975b55cea9180a88607dbcc1b2f6b68d91095b482d97",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "prefix_fold_inputs",
        "start": 292,
        "end": 311,
        "sha256": "627de3b1893375d2bce739aa34fa3df83c43e0609e0ed92b5b6e41e38209553b"
      },
      {
        "name": "fit_strict_prefix_chain",
        "start": 314,
        "end": 377,
        "sha256": "12ad6793ef93b7fef99cee299d0eb6f10e3eea9a15e08812bfbd0b602bf023d6"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-8-19",
    "filename": "chain-fit-and-decode.py",
    "title": "chain-fit-and-decode.py · fit_order_bag_ensemble, serve_ensemble, fitted_state",
    "sha256": "b09e74d38e059756f4138dcaf5b354cee11e053a214d6124ec93bcb36e22d596",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "fit_order_bag_ensemble",
        "start": 76,
        "end": 100,
        "sha256": "0ecab137e70ea6451785dca90c34c733dcf70f9bbe78f369f4e53cf818fd2ca3"
      },
      {
        "name": "serve_ensemble",
        "start": 103,
        "end": 127,
        "sha256": "e76a1789f62d95f51d6b39ed3949a4b548afa9343e41c0a54717531f83bfd115"
      },
      {
        "name": "fitted_state",
        "start": 130,
        "end": 152,
        "sha256": "76361fcb4c94986fbdd6eeec26b75093d732923e5263e172bcf173faf369e076"
      }
    ],
    "dependencies": [
      "chain_core.py"
    ]
  },
  {
    "key": "section-9-20",
    "filename": "powerset.py",
    "title": "powerset.py · complete program",
    "sha256": "3239c9e5f7e231d2f7ae2a8ca917f613d88adc39efd97b8f78e3f8958d0533cc",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-9-21",
    "filename": "trained-labelsets.py",
    "title": "trained-labelsets.py · arrays, powerset_encoding, fit_powerset, predict_powerset, label_dimensions, disjoint_groups, overlapping_groups, validate_groups, fit_labelset_ensemble, vote_contributions, predict_ensemble",
    "sha256": "7a1960d7473ba90f28bcd19a344d3e77e34be28def3d6b8a4149f7932566d087",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "arrays",
        "start": 18,
        "end": 30,
        "sha256": "1c33d949c3d7dbf0373902cc1d09d59b4f6f16341e129f27cb808bec1173a736"
      },
      {
        "name": "powerset_encoding",
        "start": 33,
        "end": 40,
        "sha256": "d52eb3820ccecfeefde5e6ea9f98e4fa8678b10af8fe06409e0e11c0ec599f9e"
      },
      {
        "name": "fit_powerset",
        "start": 43,
        "end": 64,
        "sha256": "0a49b911503449652437e02ec8e4f28381f770fb0e820c5f3738a815003255d3"
      },
      {
        "name": "predict_powerset",
        "start": 67,
        "end": 78,
        "sha256": "c6b680520ff61c52780a5814176a6424feb4ea11b19c2913183e9d771d8495d8"
      },
      {
        "name": "label_dimensions",
        "start": 81,
        "end": 90,
        "sha256": "79dbe3bd37d7a0705525f154ef3308a1abd7e1115ea27dc06590e29413e8072c"
      },
      {
        "name": "disjoint_groups",
        "start": 93,
        "end": 100,
        "sha256": "121d4316fda1958f23e5f56d979df5516629da5dfa1dfd8e42219c5896dc6d52"
      },
      {
        "name": "overlapping_groups",
        "start": 103,
        "end": 143,
        "sha256": "b570796331aea7ed58b263597b277b82869e408576db8c93778b4124afad246a"
      },
      {
        "name": "validate_groups",
        "start": 146,
        "end": 172,
        "sha256": "fe38a693cbe452f40ecd4c06bf0b3f0a8b3e3ebce4a7f3a9a14d0c478be4b467"
      },
      {
        "name": "fit_labelset_ensemble",
        "start": 175,
        "end": 190,
        "sha256": "1d43c65223e49fd800a9ab7d1b750bbeef40b50ddddf57e7dc80af91804dff4b"
      },
      {
        "name": "vote_contributions",
        "start": 193,
        "end": 224,
        "sha256": "77d7da621f357fa2e71cc2e4469e056d878ebc45fb95a0f18887147744f823cc"
      },
      {
        "name": "predict_ensemble",
        "start": 227,
        "end": 229,
        "sha256": "b397c20b10081a129809906cca1ac9d0f9a67ce778ed0a373bec382e11bb5feb"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-10-22",
    "filename": "mlknn-count-posterior.py",
    "title": "mlknn-count-posterior.py · checked_training, nearest_rows, fit_mlknn, posterior_for_counts, predict_mlknn",
    "sha256": "32adbb0ac68800131764876e64588cd92959be6a507bfbb6747deb98aa9e6239",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "checked_training",
        "start": 13,
        "end": 42,
        "sha256": "5a349bec3f37a2bdc4212b0e0b118a14eb0ce3acad032aee1eb70629e531458d"
      },
      {
        "name": "nearest_rows",
        "start": 45,
        "end": 79,
        "sha256": "9013ca2d97c317076a52f5f295cdeb1fc8175f1973cccc8422e88ae76b752987"
      },
      {
        "name": "fit_mlknn",
        "start": 82,
        "end": 141,
        "sha256": "672bcddcec1468a11ecb7531973adb74c9c61284ee669500ea3cce9942f1fe42"
      },
      {
        "name": "posterior_for_counts",
        "start": 144,
        "end": 168,
        "sha256": "ccf866f476e8eefea64ce1f472968764c14b6585204fa4c9fad520777ef9f333"
      },
      {
        "name": "predict_mlknn",
        "start": 171,
        "end": 176,
        "sha256": "2ef89d1f6f2afd84cf9bbfea95435e788842e3b2220e4ed6642e875397b3c45a"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-10-23",
    "filename": "ranking-and-calibrated-labels.py",
    "title": "ranking-and-calibrated-labels.py · pair_design, squared_hinge_objective, fit_pair_ranker, fit_virtual_label_ranker, serve_virtual_label_ranker",
    "sha256": "14085d6dd33b1dd85374d7b0846a530921aac8b610e8169065dc08f702dac8cd",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "pair_design",
        "start": 151,
        "end": 198,
        "sha256": "9095d1c44351eba22c0472de7e4beb2eca91912fec19c805ae63260a81af309c"
      },
      {
        "name": "squared_hinge_objective",
        "start": 201,
        "end": 221,
        "sha256": "44896daeb62f72a16086ece02420c801220682a2a305596ae044114a9be279df"
      },
      {
        "name": "fit_pair_ranker",
        "start": 224,
        "end": 277,
        "sha256": "cb5a0761770cd51ede857e1f4abcbba2ef86fa1c84281ea89cb0f9c90db80307"
      },
      {
        "name": "fit_virtual_label_ranker",
        "start": 321,
        "end": 360,
        "sha256": "ac516f2638eb3e74f11161ce29ec4c5cf517de8fe1d4ab885ea672bfaad12100"
      },
      {
        "name": "serve_virtual_label_ranker",
        "start": 363,
        "end": 401,
        "sha256": "e1e78a678d9d725402c50fd3a7cf1f5fc0e94a188112df9687d866eace2fa6f1"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-11-24",
    "filename": "categorical.py",
    "title": "categorical.py · complete program",
    "sha256": "ebea6674c12808e44427f2736754e80081fd3e78d43cb99c54188df3d55b3ddb",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-11-25",
    "filename": "joint-f1-decisions.py",
    "title": "joint-f1-decisions.py · constrained_map",
    "sha256": "0a0b7cecd07ce3dabfc62c3714ea67d9ce548d935294b074af614678653d9a8d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "constrained_map",
        "start": 213,
        "end": 232,
        "sha256": "7e49572d0ffe718e6d495ddd1906931b55b1792a978a2d9bc39a4a6b086e3a6e"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-12-26",
    "filename": "regression.py",
    "title": "regression.py · complete program",
    "sha256": "a6dc624792ed2b0c4d407097179bc365fb51b68b36815d2e71e9e48867949764",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-12-27",
    "filename": "shared-regression.py",
    "title": "shared-regression.py · centered_rows, fit_ridge_matrix, predict_linear, fit_true_label_linear_chain, serve_linear_chain, effective_chain_coefficients",
    "sha256": "5bf29534ab4be66e9f4f08be3c7d1fd47042f755fca54dbc2aa915c0c6dcdc4d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "centered_rows",
        "start": 30,
        "end": 35,
        "sha256": "cb83bb9d217f7753181e3f488dfe24e6dbcfdccb32e07ebff93ae645769881df"
      },
      {
        "name": "fit_ridge_matrix",
        "start": 38,
        "end": 59,
        "sha256": "84a93184d5d74177564098f0079c13d4998eeeeeca6c5936f85eb644ead62dfe"
      },
      {
        "name": "predict_linear",
        "start": 62,
        "end": 66,
        "sha256": "b5a598abdc6c0ed7744360a967a61020cc67c0decbd22c22a8fa81651b75fa94"
      },
      {
        "name": "fit_true_label_linear_chain",
        "start": 69,
        "end": 93,
        "sha256": "14b93635d94a8bd66048cff8e26634c4c5cf9eac0ca33228b7b2e9d0d5ed2878"
      },
      {
        "name": "serve_linear_chain",
        "start": 96,
        "end": 106,
        "sha256": "f6e4c4017cdcc952ca71f89c5654d8920cbd6fcf9c0e2cc8b3ebb562e63ec995"
      },
      {
        "name": "effective_chain_coefficients",
        "start": 109,
        "end": 123,
        "sha256": "f47502fc93604726c4e3773c0f30ecb54f6e2a7ce00acd867db8f3bb89823a69"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-13-28",
    "filename": "sharedSplit.py",
    "title": "sharedSplit.py · complete program",
    "sha256": "a06f98ac70f6cc38abb0584836600ad8b93dbefee360ed5c73f6d78615f9582f",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-13-29",
    "filename": "shared-regression.py",
    "title": "shared-regression.py · stump_candidates, row_prox, group_objective, group_prox_step, fit_group_regression",
    "sha256": "5bf29534ab4be66e9f4f08be3c7d1fd47042f755fca54dbc2aa915c0c6dcdc4d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "stump_candidates",
        "start": 126,
        "end": 163,
        "sha256": "691323185e7016759e4a282f559de6655682dac10e8f1ddfb7e103fc7c5aafc0"
      },
      {
        "name": "row_prox",
        "start": 166,
        "end": 181,
        "sha256": "e0ea90db574cf156c45c26ed826ccb29f09422feabca5031dd2cf8c9d9a0520b"
      },
      {
        "name": "group_objective",
        "start": 184,
        "end": 193,
        "sha256": "037ed7a2a2b0fbb4a86c6716185d0f18dda1b97597a94e55c6e97567958d19f2"
      },
      {
        "name": "group_prox_step",
        "start": 196,
        "end": 219,
        "sha256": "ffb4cc691547564bb57f3a741b88465badbad7128639acaad0758e162929c25c"
      },
      {
        "name": "fit_group_regression",
        "start": 222,
        "end": 263,
        "sha256": "23b7503d233fca22ae7eeb760c4d3a33291517b905f3ea97bf730cca78fcd28a"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-13-30",
    "filename": "groupShrinkage.py",
    "title": "groupShrinkage.py · complete program",
    "sha256": "34a06abc9f18f2624353856bae3e20b7121c0c053bba7167c2d1053729a5ca97",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-13-31",
    "filename": "shared-regression.py",
    "title": "shared-regression.py · stump_candidates, row_prox, group_objective, group_prox_step, fit_group_regression",
    "sha256": "5bf29534ab4be66e9f4f08be3c7d1fd47042f755fca54dbc2aa915c0c6dcdc4d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "stump_candidates",
        "start": 126,
        "end": 163,
        "sha256": "691323185e7016759e4a282f559de6655682dac10e8f1ddfb7e103fc7c5aafc0"
      },
      {
        "name": "row_prox",
        "start": 166,
        "end": 181,
        "sha256": "e0ea90db574cf156c45c26ed826ccb29f09422feabca5031dd2cf8c9d9a0520b"
      },
      {
        "name": "group_objective",
        "start": 184,
        "end": 193,
        "sha256": "037ed7a2a2b0fbb4a86c6716185d0f18dda1b97597a94e55c6e97567958d19f2"
      },
      {
        "name": "group_prox_step",
        "start": 196,
        "end": 219,
        "sha256": "ffb4cc691547564bb57f3a741b88465badbad7128639acaad0758e162929c25c"
      },
      {
        "name": "fit_group_regression",
        "start": 222,
        "end": 263,
        "sha256": "23b7503d233fca22ae7eeb760c4d3a33291517b905f3ea97bf730cca78fcd28a"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-14-32",
    "filename": "reduced-rank-regression.py",
    "title": "reduced-rank-regression.py · fit_rrr, predict_rrr, pca_then_regression, predict_pca_route, original_unit_errors",
    "sha256": "b1f3e3dfa1ee8eeb7343ab70b13b62d599c4dce8c8d3e73e08ac845abd69804e",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "fit_rrr",
        "start": 28,
        "end": 96,
        "sha256": "0dd50be5bfed3b57a57de7654445dd3fae5da75adcb9871294a9d8cdc2f7421a"
      },
      {
        "name": "predict_rrr",
        "start": 99,
        "end": 106,
        "sha256": "e3c4617ce46cbf1ba9fdf14723a8a9b0c927f5b0f097f6f63e14dbae23e46763"
      },
      {
        "name": "pca_then_regression",
        "start": 109,
        "end": 119,
        "sha256": "f414ce24b3d9752ef9362344b1c6d666f85a436496ab4ab9be70e2e5fa357490"
      },
      {
        "name": "predict_pca_route",
        "start": 122,
        "end": 126,
        "sha256": "e58c5a24cc70924039920a44e5263bfb6abf9ca3d402eac3d8626a019f84c6da"
      },
      {
        "name": "original_unit_errors",
        "start": 129,
        "end": 144,
        "sha256": "5f3f4cdaadccd4c691e816c38e0ea3f7a349804716da975cf4d434875904719c"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-14-33",
    "filename": "compression.py",
    "title": "compression.py · complete program",
    "sha256": "74744abc25d3f14014d43b458afb3c67afb97ea52dc16c5faa92bdd1f2ab91f4",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-14-34",
    "filename": "compressed-label-recovery.py",
    "title": "compressed-label-recovery.py · dictionary, random_dictionary, coherence, omp, ordinary_omp, fit_compressed_regressor, predict_compressed",
    "sha256": "18998514d32b785e2e2d3d684bd09dd86496b4ba65153a72d114afd068f87a4c",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "dictionary",
        "start": 15,
        "end": 24,
        "sha256": "635727b6f3aeec67e177af04fe0e0f585ea1296d3f0a3d43363253ee61b53379"
      },
      {
        "name": "random_dictionary",
        "start": 27,
        "end": 45,
        "sha256": "0561df860dac4c96eba9425ae387541b447053e06f1cf6cfc9bc292f30e5ab02"
      },
      {
        "name": "coherence",
        "start": 48,
        "end": 52,
        "sha256": "5b48125e142532108660b3433f9ba03cbf20ed24e9ca7f76f3a833d8076db839"
      },
      {
        "name": "omp",
        "start": 55,
        "end": 125,
        "sha256": "954c5834cf0c822e92f69b265c7fe8058cdc33792cc202c3e7eaffbd192ac175"
      },
      {
        "name": "ordinary_omp",
        "start": 128,
        "end": 150,
        "sha256": "8e83e6d74cdfd4e04a97e3fd61e37c10a60806afe2a1f9ec59a328bd808ce816"
      },
      {
        "name": "fit_compressed_regressor",
        "start": 153,
        "end": 180,
        "sha256": "438b069830a206da08af1c4452a7f2bb3865bdc8bd65a3cf34aba8268db88d21"
      },
      {
        "name": "predict_compressed",
        "start": 183,
        "end": 205,
        "sha256": "addbde60016f10b35a1779e0de2be015cdc8fea4532063de3242572b1043291c"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-15-35",
    "filename": "masked-binary-heads.py",
    "title": "masked-binary-heads.py · shared_output_pullback",
    "sha256": "caaf75aaac95cec40dfdf0de8829a4e981b7dcd63fd977d395bb716e31b09bfe",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "shared_output_pullback",
        "start": 246,
        "end": 276,
        "sha256": "0bed3dfdb6465a35cabfc86504cd0af5138ec5eac28da734f831f2033c6ac61b"
      }
    ],
    "dependencies": [
      "multioutput_newton.py"
    ]
  },
  {
    "key": "section-15-36",
    "filename": "shared-regression.py",
    "title": "shared-regression.py · covariance_matrix, output_kernel, condition_one",
    "sha256": "5bf29534ab4be66e9f4f08be3c7d1fd47042f755fca54dbc2aa915c0c6dcdc4d",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "covariance_matrix",
        "start": 266,
        "end": 279,
        "sha256": "ecd4022f00719b8abd5afefa83f274c79e4504c04fbc13fcc785cf5984d90e64"
      },
      {
        "name": "output_kernel",
        "start": 282,
        "end": 288,
        "sha256": "8db6592f2fa8f4b87ce086716f4862e556f9126a73e7e6b75a4248e96f17b7f1"
      },
      {
        "name": "condition_one",
        "start": 291,
        "end": 309,
        "sha256": "bd383985426187d940e707dce63507dce5827010da8380c8b585b350d553b589"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-16-37",
    "filename": "energy-multioutput-study.py",
    "title": "energy-multioutput-study.py · parse_rows, geometry_split, candidate_table, estimator, error_report, choose, tree_state, serialize_model, predict_saved",
    "sha256": "0ab0e5520b8728c7fa92ae6a0d563a7b6322a42d8ad214d657d9b330465e9b18",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "parse_rows",
        "start": 59,
        "end": 104,
        "sha256": "bb23be78a9dd8e6059e45431e12714a3a14bc2a3eb70a3f75903bb45b4eac5c9"
      },
      {
        "name": "geometry_split",
        "start": 107,
        "end": 117,
        "sha256": "e3244c7b6b4ce049d0845d807ecd39f0ea9299d3bc518fba65eb4c5fd026f634"
      },
      {
        "name": "candidate_table",
        "start": 204,
        "end": 216,
        "sha256": "efa35f5df402bd0fd6ce3a44af55125a0b2836359b7bc25d4ef6585ba1f41196"
      },
      {
        "name": "estimator",
        "start": 219,
        "end": 232,
        "sha256": "9817baadc2892476fde0cf50a1848185d0a22d1fc4014c7ed1d26698b1d3935b"
      },
      {
        "name": "error_report",
        "start": 235,
        "end": 255,
        "sha256": "a42df608cc3de89e03f1d79a92f45832ed9e2f9ed03d4b80d991d89497ea9cec"
      },
      {
        "name": "choose",
        "start": 258,
        "end": 267,
        "sha256": "984af2651c3aec483d7522428d0f5f73811117ecd96557fe4ebb3b205098a40d"
      },
      {
        "name": "tree_state",
        "start": 270,
        "end": 274,
        "sha256": "cbc2b03d6d90db8f9666f87c78f88afcbe7bc72ef5fd86cb70aec9aab6f9d479"
      },
      {
        "name": "serialize_model",
        "start": 277,
        "end": 298,
        "sha256": "0a480a0584e1d664581d780d1fbcd71364234cee7fe88bd4678293aca737bd65"
      },
      {
        "name": "predict_saved",
        "start": 301,
        "end": 334,
        "sha256": "2f3451a6fb5872c49f65b5eb2cb8b6030778495e1f1f4f1ec92b3e752425c9a9"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-16-38",
    "filename": "energy_multioutput_core.py",
    "title": "energy_multioutput_core.py · candidate_table, estimator, error_report, choose",
    "sha256": "495c04b0a5661866702c1a19555e7e896134e20bc9d1e6f2dfe9613eb748a5d6",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "candidate_table",
        "start": 21,
        "end": 57,
        "sha256": "d02f220a67638727090707fea3f50189de7c68597ecb018b5e8f04b982c7f38d"
      },
      {
        "name": "estimator",
        "start": 60,
        "end": 93,
        "sha256": "aaf676988e28014a5b4f5e6e2794aba3c0ccbf9817b4f60de923a51c90605d1a"
      },
      {
        "name": "error_report",
        "start": 96,
        "end": 133,
        "sha256": "3230c169b667656091bdcb6d03bf28d972556468c404417f1a033f0d7b2ae1b2"
      },
      {
        "name": "choose",
        "start": 136,
        "end": 145,
        "sha256": "984af2651c3aec483d7522428d0f5f73811117ecd96557fe4ebb3b205098a40d"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-16-39",
    "filename": "energy_multioutput_core.py",
    "title": "energy_multioutput_core.py · serialize_model, predict_saved",
    "sha256": "495c04b0a5661866702c1a19555e7e896134e20bc9d1e6f2dfe9613eb748a5d6",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "serialize_model",
        "start": 160,
        "end": 205,
        "sha256": "a9b8b25853735265eaa217ace534af58b04f75bebdfbc765c2a5952f782273f0"
      },
      {
        "name": "predict_saved",
        "start": 208,
        "end": 254,
        "sha256": "8ca2154ae0be51172901f2fcda7ab215c87e971ca032419bbea468c4e694e7dc"
      }
    ],
    "dependencies": []
  },
  {
    "key": "section-16-40",
    "filename": "energy-multioutput-learning.py",
    "title": "energy-multioutput-learning.py · load_bundle, saved_report, query_saved, declared_task, fit_own, main",
    "sha256": "d3eef55a340393b924030184a801b70d394fa59227dafe46e212935712f5b962",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "load_bundle",
        "start": 62,
        "end": 98,
        "sha256": "3c1a1581b66249bacb34fcb59d20dead4bc2c75f6befcb8d055eddf4c6c128e0"
      },
      {
        "name": "saved_report",
        "start": 101,
        "end": 116,
        "sha256": "07d06adaca469e973c586d7c3d76203d79d827b2151513e00f84f18022551081"
      },
      {
        "name": "query_saved",
        "start": 119,
        "end": 138,
        "sha256": "c85d63ba8a52fbccebe184581ea54ffd8b03c2f59f5fe38ce9de23d521416473"
      },
      {
        "name": "declared_task",
        "start": 141,
        "end": 182,
        "sha256": "df8a9135d106d26754c005df4e1b900ae9d1125db4ff635a7239c7d19481423e"
      },
      {
        "name": "fit_own",
        "start": 191,
        "end": 251,
        "sha256": "48e1314f4992ccc00d3f3351ef3f6b6482693652d9db816a4489a21116dca3eb"
      },
      {
        "name": "main",
        "start": 254,
        "end": 277,
        "sha256": "39b30f53a190c368ca618497d194f4b9b2c080d156362be71e2ed1270e268352"
      }
    ],
    "dependencies": [
      "energy_multioutput_core.py"
    ]
  },
  {
    "key": "section-16-41",
    "filename": "textReport.py",
    "title": "textReport.py · complete program",
    "sha256": "5d1d9574b5cae0c7fe8653360d76623c7e0632f5412531577d6bbbee2a2361dc",
    "fullDisplay": true,
    "ranges": [],
    "dependencies": []
  },
  {
    "key": "section-16-42",
    "filename": "changedReport.py",
    "title": "changedReport.py · cost",
    "sha256": "c37838ec428ba3ea379b481fdefb1586f9bdb86041332af2118b3599933a1cd0",
    "fullDisplay": false,
    "ranges": [
      {
        "name": "cost",
        "start": 149,
        "end": 152,
        "sha256": "7ab73047f107ffdcaa3767c9115bc2959eac3b0771260438f1d8f16626642abe"
      }
    ],
    "dependencies": []
  }
];
const files = [
  {
    "filename": "association.py",
    "sha256": "1ba9f1c26a60d754579d23d798d49794beda975cdc009ea19815785b83bb6fbf",
    "title": "Complete Python source"
  },
  {
    "filename": "categorical.py",
    "sha256": "ebea6674c12808e44427f2736754e80081fd3e78d43cb99c54188df3d55b3ddb",
    "title": "Complete Python source"
  },
  {
    "filename": "chain-fit-and-decode.py",
    "sha256": "b09e74d38e059756f4138dcaf5b354cee11e053a214d6124ec93bcb36e22d596",
    "title": "Complete Python source"
  },
  {
    "filename": "chainApi.py",
    "sha256": "3ef85099514004d1a188fff77b2eac48584cd575aeb423d243bce8b3532b5afd",
    "title": "Complete Python source"
  },
  {
    "filename": "changedReport.py",
    "sha256": "c37838ec428ba3ea379b481fdefb1586f9bdb86041332af2118b3599933a1cd0",
    "title": "Complete Python source"
  },
  {
    "filename": "compressed-label-recovery.py",
    "sha256": "18998514d32b785e2e2d3d684bd09dd86496b4ba65153a72d114afd068f87a4c",
    "title": "Complete Python source"
  },
  {
    "filename": "compression.py",
    "sha256": "74744abc25d3f14014d43b458afb3c67afb97ea52dc16c5faa92bdd1f2ab91f4",
    "title": "Complete Python source"
  },
  {
    "filename": "energy-multioutput-study.py",
    "sha256": "0ab0e5520b8728c7fa92ae6a0d563a7b6322a42d8ad214d657d9b330465e9b18",
    "title": "Complete Python source"
  },
  {
    "filename": "groupShrinkage.py",
    "sha256": "34a06abc9f18f2624353856bae3e20b7121c0c053bba7167c2d1053729a5ca97",
    "title": "Complete Python source"
  },
  {
    "filename": "joint-f1-decisions.py",
    "sha256": "0a0b7cecd07ce3dabfc62c3714ea67d9ce548d935294b074af614678653d9a8d",
    "title": "Complete Python source"
  },
  {
    "filename": "joint.py",
    "sha256": "b6e79757d5a74a723fe2e08c86da8a610b10b2a4ca27fac498e24536e43d8ab1",
    "title": "Complete Python source"
  },
  {
    "filename": "masked-binary-heads.py",
    "sha256": "caaf75aaac95cec40dfdf0de8829a4e981b7dcd63fd977d395bb716e31b09bfe",
    "title": "Complete Python source"
  },
  {
    "filename": "metrics.py",
    "sha256": "3ab198ec44c86197c8f45f3a5871c0b6b7a74ed3eb762177157b8b13f6217c91",
    "title": "Complete Python source"
  },
  {
    "filename": "mlknn-count-posterior.py",
    "sha256": "32adbb0ac68800131764876e64588cd92959be6a507bfbb6747deb98aa9e6239",
    "title": "Complete Python source"
  },
  {
    "filename": "numpyHeads.py",
    "sha256": "06c0126069da258d3e4e97b1b9159f4061bb1f4de8667812676fa6d242f0c63a",
    "title": "Complete Python source"
  },
  {
    "filename": "powerset.py",
    "sha256": "3239c9e5f7e231d2f7ae2a8ca917f613d88adc39efd97b8f78e3f8958d0533cc",
    "title": "Complete Python source"
  },
  {
    "filename": "ranking-and-calibrated-labels.py",
    "sha256": "14085d6dd33b1dd85374d7b0846a530921aac8b610e8169065dc08f702dac8cd",
    "title": "Complete Python source"
  },
  {
    "filename": "reduced-rank-regression.py",
    "sha256": "b1f3e3dfa1ee8eeb7343ab70b13b62d599c4dce8c8d3e73e08ac845abd69804e",
    "title": "Complete Python source"
  },
  {
    "filename": "regression.py",
    "sha256": "a6dc624792ed2b0c4d407097179bc365fb51b68b36815d2e71e9e48867949764",
    "title": "Complete Python source"
  },
  {
    "filename": "schema.py",
    "sha256": "495ce546f8f68a9d7388a47f9d731c22a9539c0ce5838a550f9c76ef6830efb0",
    "title": "Complete Python source"
  },
  {
    "filename": "shared-regression.py",
    "sha256": "5bf29534ab4be66e9f4f08be3c7d1fd47042f755fca54dbc2aa915c0c6dcdc4d",
    "title": "Complete Python source"
  },
  {
    "filename": "sharedSplit.py",
    "sha256": "a06f98ac70f6cc38abb0584836600ad8b93dbefee360ed5c73f6d78615f9582f",
    "title": "Complete Python source"
  },
  {
    "filename": "textReport.py",
    "sha256": "5d1d9574b5cae0c7fe8653360d76623c7e0632f5412531577d6bbbee2a2361dc",
    "title": "Complete Python source"
  },
  {
    "filename": "thresholds.py",
    "sha256": "ce77f74e274d0acb665ca5744f0a60d1457ce463f312acd5ee9a88a98297aa44",
    "title": "Complete Python source"
  },
  {
    "filename": "trained-labelsets.py",
    "sha256": "7a1960d7473ba90f28bcd19a344d3e77e34be28def3d6b8a4149f7932566d087",
    "title": "Complete Python source"
  },
  {
    "filename": "chain_core.py",
    "sha256": "e475567d20c239df651d975b55cea9180a88607dbcc1b2f6b68d91095b482d97",
    "title": "Complete Python source"
  },
  {
    "filename": "multioutput_newton.py",
    "sha256": "7bf43c6932d8aeb13aec429499b7c8a741d4e87ba2af92d1791fbe8a6ad4e660",
    "title": "Complete Python source"
  },
  {
    "filename": "energy-efficiency-provenance.json",
    "sha256": "74934cda5ca224d1343f798fcb9a3fd9ba30a239df2275f540929301f026dcfd",
    "title": "Recorded Energy data / provenance / results / state"
  },
  {
    "filename": "energy-multioutput-results.json",
    "sha256": "8a1c14292a8fcf9fa2bc7db734eda73be3245445689c637f02d92d80fddb1fbd",
    "title": "Recorded Energy data / provenance / results / state"
  },
  {
    "filename": "energy-multioutput-models.json",
    "sha256": "d759915885613663f1b4145c7c70f588c8e9bb99e48b2cdb01743bd777bbeede",
    "title": "Recorded Energy data / provenance / results / state"
  },
  {
    "filename": "energy-multioutput-selection-lock.json",
    "sha256": "890835eca46eff41b80719b1899796605f4ea9db13260ca60ef24d1d3dce0fc6",
    "title": "Recorded Energy data / provenance / results / state"
  },
  {
    "filename": "energy-efficiency.csv",
    "sha256": "e3a41dd2be081b420709f448fc1947e838aeb0f3e3994d8f396cedfa788fe1c3",
    "title": "Recorded Energy data / provenance / results / state"
  },
  {
    "filename": "chain-fit-and-decode.stdout.txt",
    "sha256": "17e6086a6d27f77313dd628b32a115bb99b409ce2ec1998f70da784e45d711ef",
    "title": "Recorded program output"
  },
  {
    "filename": "compressed-label-recovery.stdout.txt",
    "sha256": "32996641963cd38887a4b30c83b1d33e58132a312a91dea77a088f26695dc1bf",
    "title": "Recorded program output"
  },
  {
    "filename": "energy-multioutput.stdout.txt",
    "sha256": "b8fb52d46e18c04f6feb591b34f452b7e96f7eebf39b617ed839e3f812153bb2",
    "title": "Recorded program output"
  },
  {
    "filename": "joint-f1-decisions.stdout.txt",
    "sha256": "80536a547fd38ba15a1319b8a78a4544f7e4ad7fec4df4de2cb5974d2823f5e7",
    "title": "Recorded program output"
  },
  {
    "filename": "masked-binary-heads.stdout.txt",
    "sha256": "a2d557f2a9e93ebb69d3745caf6a9f55602f9d810e4cc6deb1588a78082a72f1",
    "title": "Recorded program output"
  },
  {
    "filename": "mlknn-count-posterior.stdout.txt",
    "sha256": "1efee2d30bdb5dbe7efb2d6aeb40304d44787f46d4ef62f627f6b1fc87c90f05",
    "title": "Recorded program output"
  },
  {
    "filename": "ranking-and-calibrated-labels.stdout.txt",
    "sha256": "409a394b92c208495f0f563e1b00963582b3883a7e9d6b2716f99cddab05508c",
    "title": "Recorded program output"
  },
  {
    "filename": "reduced-rank-regression.stdout.txt",
    "sha256": "7bf4965ba57b7b2f157de629ecf43cb1fe409c400db82955dd6381efd7708239",
    "title": "Recorded program output"
  },
  {
    "filename": "shared-regression.stdout.txt",
    "sha256": "db6aafdbeafb64910ad74f64360339fa6b706ba145c5c0850f6cf1e616039d17",
    "title": "Recorded program output"
  },
  {
    "filename": "trained-labelsets.stdout.txt",
    "sha256": "90eeb36a09a918997f2fbb4a739b017c3012353e6b95222019c9dd588752772a",
    "title": "Recorded program output"
  },
  {
    "filename": "schema.stdout.txt",
    "sha256": "16d139a2031a5d2c16145d146ea0287b65868e980489b12b1c20239ae501c3ab",
    "title": "Recorded program output"
  },
  {
    "filename": "metrics.stdout.txt",
    "sha256": "1ff1095e127bec914271925fdb465a414fdd094e0aa454360c76af649f259829",
    "title": "Recorded program output"
  },
  {
    "filename": "numpyHeads.stdout.txt",
    "sha256": "1cc876eacb5921bd1de8f78130243e125ef42ad1f4aa367748f3ee853c3a3cf0",
    "title": "Recorded program output"
  },
  {
    "filename": "joint.stdout.txt",
    "sha256": "1fcd0f6f583cee84c4f6190433296927b649d09e9cbb33ed2e97422b467002ca",
    "title": "Recorded program output"
  },
  {
    "filename": "chainApi.stdout.txt",
    "sha256": "c2e1f8a464bd768203f94f2157fd202ef39c7b62228e3c5d0022b99100dde648",
    "title": "Recorded program output"
  },
  {
    "filename": "association.stdout.txt",
    "sha256": "030303fd231d973c77e54ac1772dd657f904710f190ca983361a759979a0f701",
    "title": "Recorded program output"
  },
  {
    "filename": "thresholds.stdout.txt",
    "sha256": "1a2461e8130861e90ef8c43f9dced6272716c4a01754626efae75b00a8f7dd90",
    "title": "Recorded program output"
  },
  {
    "filename": "powerset.stdout.txt",
    "sha256": "c5af8e87083ab0c7e7c3e3c40ece9931a8f7ab64a9702478bcfd72b5e57de2bf",
    "title": "Recorded program output"
  },
  {
    "filename": "categorical.stdout.txt",
    "sha256": "47a839e8158c0378348877bb7be5484dbc6ef61ecaf742da32fcf4c1c8d7310c",
    "title": "Recorded program output"
  },
  {
    "filename": "regression.stdout.txt",
    "sha256": "3ae723b8b79876a1c89450b588203421e554f1147f313f04d0a9913d0c9ee5cb",
    "title": "Recorded program output"
  },
  {
    "filename": "sharedSplit.stdout.txt",
    "sha256": "6644ffb8681575ab31af5384cc937affa96042f5c5ae222849a314b0528882dc",
    "title": "Recorded program output"
  },
  {
    "filename": "groupShrinkage.stdout.txt",
    "sha256": "6f7fbf40e4a1854ab8a6b0ad3aada26e102ebbf01227afeca2ed39e3e17b81a0",
    "title": "Recorded program output"
  },
  {
    "filename": "compression.stdout.txt",
    "sha256": "73fc2336abc411c673dbfbd98a4807077c839afb8de3126c8870d3e1a4aaa2a5",
    "title": "Recorded program output"
  },
  {
    "filename": "textReport.stdout.txt",
    "sha256": "97261c3864e1d6a35ba0bc160b5d74da9201fbd339bef4c7a53259cccc5c480b",
    "title": "Recorded program output"
  },
  {
    "filename": "changedReport.stdout.txt",
    "sha256": "668f3552288a5491aa04e5b09e0174cef3cc213ea8bdd1648a7a8002399c0f4c",
    "title": "Recorded program output"
  },
  {
    "filename": "energy-multioutput-learning.py",
    "sha256": "d3eef55a340393b924030184a801b70d394fa59227dafe46e212935712f5b962",
    "title": "Complete Python source"
  },
  {
    "filename": "energy_multioutput_core.py",
    "sha256": "495c04b0a5661866702c1a19555e7e896134e20bc9d1e6f2dfe9613eb748a5d6",
    "title": "Complete Python source"
  },
  {
    "filename": "energy-recorded-assets.json",
    "sha256": "cfce58b6592590729b57294873cfbd3b311d6f8085453ba9186006b001c870ec",
    "title": "Recorded Energy data / provenance / results / state"
  },
  {
    "filename": "own-multioutput-example.csv",
    "sha256": "ce14e2dd3ffd35a19a96a9d904d620357feb0190f9e667b1cc25bd68cd346cd2",
    "title": "Supporting lesson file"
  },
  {
    "filename": "own-multioutput-task.json",
    "sha256": "0c7d0fdd25034a44bb1f7a0e4e77e3e2c3c2b003fa1825e4f9024d0a5b14b1e2",
    "title": "Supporting lesson file"
  },
  {
    "filename": "MULTIOUTPUT-SETUP.md",
    "sha256": "45720b82bed07649200a9a6a37d99b67be0d4c3b448f7bd140c5978b099ae6b6",
    "title": "Complete offline setup and own-task commands"
  },
  {
    "filename": "energy-multioutput-learning.stdout.txt",
    "sha256": "ae86eea88079824863a2d9a8c2c2ee77bf627068788814b4107bc1c7dfcde372",
    "title": "Recorded program output"
  }
];
function MultiLabelFoundationContent() {
  return <MultiLabelJointLawProvider><div className="lesson-flow multilabel-reading-flow">
  <MultiLabelSupportingFiles files={files} />
  <Prose opening="summary">{"One message can need several answers. “I cannot sign in to pay my bill” concerns both account access and billing. One building configuration can also need several answers: a heating load and a cooling load. The answers share an input, but their meanings, errors and useful relationships differ. We will first make those output objects explicit, then build separate and coupled predictors, and finally follow an actual held-out experiment from source rows to saved predictions."}</Prose>

<Prose opening="route">{"You can begin with fractions, arrays and a binary classifier. The first seven sections establish the main path. The visible deeper passages explain joint decisions, ranking, cross-fitting, shared regression and compression after their concrete examples. They refresh the required probability and matrix operations locally. The Learning compass supplies the single section index and prerequisite links. The common file index collects the complete sources. The last two sections provide changed-input practice and the next question."}</Prose>

<span id="1-one-input-several-questions" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"1. One observation can need several answers"}</H2>

<Prose>{"What should a system return for our message? Choosing only “Billing” would lose the access problem; choosing only “Access” would lose the billing problem. Give each question its own named answer slot."}</Prose>

<MessageOutputFigure />

<Prose>{"Read the message once, extract the shown "}<code>{"sign_in=1"}</code>{" and "}<code>{"bill=1"}</code>{" features, then follow both paths to the output sockets. Billing is 1, Access is 1, and Urgent is 0. These are three binary questions about the same observation. "}<strong>{"Multi-label classification"}</strong>{" permits several 1s in one output row. The illustrated features and answers are constructed to expose the interface; they are not a claim about a deployed message classifier."}</Prose>

<Prose>{"An "}<strong>{"observation"}</strong>{" is one input together with the outputs we know about it. A "}<strong>{"label"}</strong>{" is the identity of an output question, not the position where we happen to store its answer. Billing/A stays amber, Access/B blue and Urgent/C violet throughout the connected examples. A filled mark and literal 1 mean present; an open mark and 0 mean known absent. A hatched question mark means unobserved. A white selection outline changes which object we inspect without changing its identity."}</Prose>

<VocabularyMatrixFigure />

<Prose>{"The three collections "}<code>{"{Billing, Access}"}</code>{", "}<code>{"{Urgent}"}</code>{" and "}<code>{"{}"}</code>{" become rows 110, 001 and 000 under the vocabulary "}<code>{"[Billing, Access, Urgent]"}</code>{". The empty collection says that every listed question was checked and none was positive. It is different from a record whose Access answer was never checked. Reorder the vocabulary below the picture: the values move with their names, so a storage permutation cannot turn an access answer into a billing answer. Reset restores the original order and selected row."}</Prose>

<Prose>{"For n observations and L labels, the complete binary target is Y∈{0,1}ⁿˣᴸ. The row sum |Y_i| is its "}<strong>{"label cardinality"}</strong>{". Average cardinality is n⁻¹Σ_i|Y_i|; "}<strong>{"label density"}</strong>{" divides that mean by L. These three rows contain 2+1+0=3 positives, so average cardinality is 1 and density is 1/3. Low density is a storage opportunity, not a guarantee that every label has sufficient training support."}</Prose>

<Prose>{""}<code>{"schema.py"}</code>{" shows the fixed-vocabulary encoding. "}<code>{"encode_collections"}</code>{" in "}<code>{"masked-binary-heads.py"}</code>{" uses ordinary "}<code>{"MultiLabelBinarizer(classes=names)"}</code>{", after checking that every name is in the declared schema. That check matters because an unfamiliar name is a schema error, not an observed negative. "}<code>{"sparse_output=True"}</code>{" stores the same positive cell identities economically; it does not change what zero means. Supply a list of collections: a bare string is a sequence of characters, not a one-label collection."}</Prose>

<MultiLabelProgramSource context={contexts[0]} />

<MultiLabelProgramSource context={contexts[1]} />

<Prose>{"The known-empty row in the complete program is retained as 00. The unfamiliar-name example is rejected. Compare these outcomes before adapting the schema to a new vocabulary. An output contract must specify whether omitted names mean checked absence or merely incomplete annotation; a binarizer cannot infer that collection policy."}</Prose>

<OutputKindsFigure />

<Prose>{"Now replace the sockets. Fruit has one member of "}<code>{"[apple, pear, orange]"}</code>{"; Condition has one member of "}<code>{"[fresh, damaged]"}</code>{". Each is a separate "}<strong>{"categorical output"}</strong>{", with its own class vocabulary. A building instead returns two real numbers, Heating and Cooling, in the supplied load units. That is "}<strong>{"multi-output regression"}</strong>{". The common array shape does not make the tasks interchangeable: binary probabilities need not sum across labels, one categorical output's class probabilities do sum to one, and a numerical output requires a unit and an error scale. We will preserve each distinction rather than choosing a model from the word “multi-output” alone."}</Prose>

<span id="2-freeze-what-the-model-can-know" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"2. Keep observations together and unknown labels unknown"}</H2>

<Prose>{"A correct target row is only the beginning. If two messages paraphrase the same source request, can one teach the model while the other claims to be an independent test?"}</Prose>

<GroupBoundaryFigure />

<Prose>{"The constructed text case has 32 deliberately constructed messages in 16 two-message groups. Training uses 8 groups/16 messages, validation 4 groups/8 messages and test 4 groups/8 messages. Follow both members of a selected group into the same partition. The comparison control shows what would go wrong if rows were split independently: familiar wording can cross the boundary. It illustrates an information path; it does not manufacture a new measured experiment. The text vocabulary is fitted on training messages and then frozen for every held message."}</Prose>

<Prose>{"Split observations before fitting learned transformations. Fit input scaling, feature selection, output transforms and labelset vocabularies using training rows only. Validation can choose a stated recipe; the untouched test can assess the chosen recipe. Time or group boundaries take priority when they define the question. Ordinary "}<code>{"GroupShuffleSplit"}</code>{" and "}<code>{"GroupKFold"}</code>{" preserve groups; balancing each label in isolation and then assembling mismatched splits destroys observation identity."}</Prose>

<MultiLabelProgramSource context={contexts[2]} />

<Prose>{"Rare labels make allocation harder. Six target rows 100,100,110,010,001,000 contain A three times, B twice and C once. Two equal-capacity folds would ideally receive [1.5,1,.5] positives each. Half an observation cannot be assigned."}</Prose>

<SupportAllocationFigure />

<Prose>{"Start with the least frequent remaining positive label, C. Choose its only row and put that whole row into an available fold with the greatest C deficit. Decrement the fold's capacity and the remaining counts of "}<strong>{"every"}</strong>{" positive label on that row. Continue with the next remaining rare label; place the all-negative row using remaining capacity. The step control exposes each row movement and deficit. A tie seed resolves only declared ties, never searches for a flattering model score."}</Prose>

<Prose>{""}<code>{"iterative_folds"}</code>{" implementation orders scarce labels, carries stable row IDs, updates the full selected row and handles empty-label rows. It is a greedy allocation procedure, not a proof that all desired supports can be met. With one C-positive and two folds, “C positive in every fold” is impossible. The program's separate three-fold fixture prints its exact memberships "}<code>{"[0,1,2,1,0,2]"}</code>{" and support table; that executed fixture is distinct from the two-fold picture. Scikit-learn supplies group splitters but no built-in iterative multilabel stratifier. Use the actual allocation function when that is the declared task, and check feasibility before interpreting a fold's missing class."}</Prose>

<Prose>{"An annotation boundary is separate from a partition boundary. If an Access answer is unobserved, its input remains usable for known Billing answers. Its missing Access bit must not enter supervised loss as zero."}</Prose>

<ObservedMaskFigure />

<Prose>{"The mask M has the target's shape. M_ij=1 permits the loss term for an observed answer; M_ij=0 gates it out. Follow the surviving cells into each output's sum and count n_j=Σ_iM_ij. A zero n_j means that output has no observed training answers. It cannot support a supervised fit. Toggle a cell and inspect the changed denominator, then Reset to restore both mask and editor state."}</Prose>

<Prose>{"Two reductions answer different weighting questions. A mean over all observed cells weights labels in proportion to their observed counts. A sum of per-output observed means weights each supported output equally: J=Σ_j[n_j⁻¹Σ_i M_ij ℓ_ij]. Our observed-head program uses the latter. Section 4 derives its gradient. A mask is bookkeeping for observed risk; it does not correct a biased observation process. If people annotate only obvious urgent cases, the observed Urgent sample differs from the population. Recovering population risk needs assumptions about that selection mechanism—for example, known nonzero observation probabilities for importance weighting—not merely multiplication by M."}</Prose>

<span id="3-read-errors-by-message-and-by-label" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"3. Decide whether the error belongs to a cell, a row or a ranking"}</H2>

<Prose>{"Once rows and masks are sound, what does “correct” mean? A response with two correct answers and one missing answer may be acceptable for one task and unusable for another."}</Prose>

<WrongBitsFigure />

<Prose>{"The four rows use literal Code/Hardware/Energy questions rather than silently renaming them Billing/Access/Urgent. Their truth is 101,011,110,001 and predictions are 101,010,100,011. Trace every positive match into TP, every extra positive into FP and every missed positive into FN: TP=5, FP=1, FN=2. Three of twelve cells are wrong, so "}<strong>{"Hamming loss"}</strong>{" is 3/12=.25. Only the first complete row matches, so "}<strong>{"exact-set accuracy"}</strong>{" is 1/4=.25. Equal numbers here do not make the definitions equal."}</Prose>

<Prose>{"Edit a binary prediction cell and watch the affected row and cell counters. Mark the designated Hardware answer unknown and it leaves observed-cell evaluation. A complete-vector score may use only fully observed rows; pretending an unknown vector is complete would invent an answer. State that row policy and denominator alongside the result."}</Prose>

<PoolingFigure />

<Prose>{""}<strong>{"Precision"}</strong>{" TP/(TP+FP) asks what fraction of predicted positives were correct. "}<strong>{"Recall"}</strong>{" TP/(TP+FN) asks what fraction of known positives were found. F1=2TP/(2TP+FP+FN) combines them when its denominator is nonzero. Micro F1 pools all cells first, yielding 10/13≈.769231. Macro F1 computes each named label's F1 and averages. A is [1,0,1,0] versus [1,0,1,0], so F1=1. B is [0,1,1,0] versus [0,1,0,1], giving F1=.5. C is [1,1,0,1] versus [1,0,0,1], so TP=2,FN=1,FP=0 and F1=4/5. The macro result is (1+.5+.8)/3=.766667. Follow the three separate column counters in the picture; the result depends on identity-aligned columns."}</Prose>

<Prose>{"Samples F1 computes one F1 per row, then averages: 1,2/3,2/3,2/3 give .75. Micro is a pooled count ratio; macro gives each label equal weight; samples gives each observation equal weight. Support-weighted F1 is another choice, not macro. Both-empty rows have a zero denominator. The complete program and default evaluation use "}<code>{"zero_division=0"}</code>{"; changing it to 1 changes that particular convention and possibly an average, not any nonempty row's arithmetic."}</Prose>

<MultiLabelProgramSource context={contexts[3]} />

<Prose>{"The ordinary calls name the reduction explicitly: "}<code>{"f1_score(Y, prediction, average='micro', zero_division=0)"}</code>{", or "}<code>{"'macro'"}</code>{" or "}<code>{"'samples'"}</code>{". "}<code>{"accuracy_score"}</code>{" on complete multilabel rows means exact-set accuracy. The full program computes the direct counters first, then the API results. Storage dimensions and an apparently plausible metric value do not establish that the intended axis was used."}</Prose>

<Prose>{"A second surprise comes from "}<strong>{"Jaccard similarity"}</strong>{", |truth∩prediction|/|truth∪prediction|. For one nonempty row, F1=2J/(1+J), an increasing transformation. Does that make averaged rankings identical?"}</Prose>

<NonlinearAverageFigure />

<Prose>{"Two rows each contain five true labels. Candidate A predicts all five on the first and none on the second: mean J=.5 and mean F1=.5. Candidate B predicts two correct labels on both: each J=2/5=.4 but each F1=4/7≈.571429. J favors A, while averaged F1 favors B. The transformation is increasing per row and nonlinear. Transforming the mean is a different operation from averaging transformed row values."}</Prose>

<Prose>{"Sometimes we want a useful order before choosing a set. Rank four labelled score objects A=.8, B=.8, C=.3, D=.1, with A/C relevant and B/D irrelevant."}</Prose>

<RankingFigure />

<Prose>{"There are 2×2=4 relevant–irrelevant pairs. A above D and C above D are correct; the A/B tie and C below B count as errors under the current API convention. "}<strong>{"Ranking loss"}</strong>{" is 2/4=.5. LRAP asks, for each relevant label, what fraction of all labels at least as high as it are relevant. A gets 1/2 at the top tie; C gets 2/3. Their mean is 7/12≈.583333. "}<strong>{"Coverage"}</strong>{" is the maximal rank needed to reach all relevant labels: 3, with the tied top group occupying ranks through 2. The score/truth controls expose ties, empty truth and all-positive truth rather than only the reference state."}</Prose>

<Prose>{"For observation i with R_i relevant labels, ranking loss divides wrong pairs by R_i(L−R_i), with zero when there is no eligible pair. LRAP is 1 for empty or all-positive truth in the inspected API; coverage is 0 for empty truth and L for all-positive truth. These are declared conventions, not fractions with an unmentioned zero denominator."}</Prose>

<MultiLabelProgramSource context={contexts[4]} />

<Prose>{""}<code>{"ranking_metrics"}</code>{" implements the pair comparisons and maximal tied ranks directly. It is compared with "}<code>{"label_ranking_loss"}</code>{", "}<code>{"label_ranking_average_precision_score"}</code>{" and "}<code>{"coverage_error"}</code>{". "}<code>{"step_average_precision"}</code>{" groups equal scores before updating precision and recall. Average precision over one label ranks "}<strong>{"observations"}</strong>{"; LRAP ranks "}<strong>{"labels within each observation"}</strong>{". AP is Σ_g(Δrecall_g)precision_g at score-group thresholds, not trapezoidal precision–recall area. The ordinary empty-positive AP warning remains an actual outcome of the program, with the declared value zero."}</Prose>

<Prose>{"Deeper: even an ideal probability ranking depends on the loss's normalization. In a four-label law, truth AC occurs with probability .55 and B alone with .45. Raw marginals rank A (.55) above B (.45). But AC rows have four eligible pairs while B-only rows have three. The relevant weights are .55/4=.1375 for A and .45/3=.15 for B. Swapping only A/B reduces expected normalized ranking loss from .3 to .275. It does not contradict the usefulness of marginal probabilities; it shows that an unnormalized pair objective and a row-normalized one assign different event weights. The program computes both complete outcomes and both expected losses instead of asserting a universal ordering theorem for raw marginals."}</Prose>

<span id="4-fit-one-probability-per-label" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"4. Build one binary head for each output"}</H2>

<Prose>{"Cell-wise errors suggest a transparent first predictor: one binary head per named question. Does each head need to compete for probability mass?"}</Prose>

<IndependentHeadsFigure />

<Prose>{"The two input coordinates x=[1,−1] fan into three weight columns. W's rows are [1,−1,.5] and [.5,1,−.5], with biases [0,.5,−1]. Multiply and add for A: 1×1+(−1)×.5+0=.5. B gives −1−1+.5=−1.5; C gives .5+.5−1=0. The sigmoid p=1/(1+exp(−z)) yields [.622459,.182426,.5]. Change one selected bias: only that head's logit and probability change. No normalization across labels occurs."}</Prose>

<Prose>{"For X∈ℝⁿˣᵈ and W∈ℝᵈˣᴸ, the matrix XW+b collects those dot products. A sigmoid probability is the head's model of one binary event. It is not one class in a mutually exclusive L-way softmax. With threshold ≥.5, the reference decisions are 101. The equality boundary is explicit; an ordinary estimator may use a different hard-label tie convention."}</Prose>

<BinaryPullbackFigure />

<Prose>{"Take one logit z=0 and target y=1. Sigmoid gives .5, binary cross-entropy gives log 2, and the derivative with respect to z is p−y=−.5. Multiplying by x=[1,−1] sends slope gradients [−.5,.5] back along the two input paths. For the bias, the input is 1. Change target to zero and the residual becomes +.5; change z toward a very wrong extreme and inspect the stable loss rather than computing log of a rounded probability."}</Prose>

<Prose>{"Write ℓ(z,y)=logaddexp(0,z)−yz. This is mathematically −y log p−(1−y)log(1−p) but evaluates the scalar logit form stably. The derivative follows because d log(1+exp z)/dz=σ(z). At z=100,y=0, the stable loss is approximately 100 even if σ(100) rounds to 1 in floating point. Stable loss does not claim that finite-precision probabilities never reach an endpoint."}</Prose>

<Prose>{"The complete "}<code>{"numpyHeads.py"}</code>{" teaches one vectorized full-observation fit, with a mean over rows and a sum over labels. Its normalization is preserved. The observed-head route changes the task to separately observed subsets and therefore names its different denominators."}</Prose>

<MultiLabelProgramSource context={contexts[5]} />

<ObservedGradientFigure />

<Prose>{"The leading-intercept design has rows [1,−1],[1,0],[1,1],[1,2]. Targets are 01,00,11,10; mask rows are 11,10,11,01. At zero weights, A observes rows 0,1,2 and B observes rows 0,2,3, each with n_j=3. For A, residuals are [.5,.5,−.5]. Intercept gradient is (.5+.5−.5)/3=1/6 and slope gradient is (−.5+0−.5)/3=−1/3. For B, residuals [−.5,−.5,.5] give −1/6 and +1/3. Toggle a mask cell and follow the changed design rows, sums and count rather than multiplying by an unchanged denominator."}</Prose>

<Prose>{"For supported column j, J_j(w_j)=n_j⁻¹Σ_observed ℓ(x̃_iᵀw_j,y_ij)+(λ/2)||w_j,slopes||². Here x̃ adds an intercept coordinate. Its gradient is x̃_jᵀ(p_j−y_j)/n_j+λw_j on slopes, and its Hessian is x̃_jᵀdiag [p_j(1−p_j)]x̃_j/n_j plus slope penalty. The intercept is unpenalized. We reuse the complete stable, damped Newton optimizer from "}<a href={"/learn/topic/linear-logistic-regression"}>{"Linear & Logistic Regression"}</a>{", supplied exactly as "}<code>{"multioutput_newton.py"}</code>{"; this program composes its import-safe functions and never runs its separate demonstration."}</Prose>

<Prose>{""}<code>{"fit_observed_heads"}</code>{" extracts only the known rows for each label and fits that supported subproblem. Ordinary "}<code>{"LogisticRegression"}</code>{" must receive the same rows and effective penalty. In the inspected library objective, C=1/(n_jλ) matches this mean-loss-plus-λ/2 convention. At n_j=3,λ=.1, C=10/3. In the fit's distinct eight-row constructed fixture, each column has seven observations, so C=10/7. The recorded probability difference between Newton and ordinary fits is about 1.11×10⁻⁹ under those matched settings."}</Prose>

<MultiLabelProgramSource context={contexts[6]} />

<MultiLabelProgramSource context={contexts[7]} />

<Prose>{"A one-class observed column uses the program's explicit constant baseline and ordinary "}<code>{"DummyClassifier"}</code>{", not a fabricated finite maximum-likelihood logistic optimum. A completely unobserved column is rejected. Preserving feature width on constant branches prevents a query with the wrong input schema from looking valid. Known labels and observation masks are separate inputs throughout."}</Prose>

<Prose>{"Deeper: minimizing expected additive binary loss requires each true marginal P(Y_j=1|X). It does not require that the entire vector factorize into independent labels. Separate estimators can be poor models of those marginals or inefficient with little data; that is different from a theorem claiming independent outputs. Nor does a shared hidden representation necessarily produce a complete joint law. We will separate these forms of sharing as we proceed."}</Prose>

<span id="5-let-the-loss-choose-the-decision" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"5. The best answer changes when the loss changes"}</H2>

<Prose>{"Suppose the probabilities are known. Is there one universally best answer vector? The answer must include the error we care about."}</Prose>

<JointTilesFigure />

<Prose>{"The A/B law counts 00 six times, 01 five, 10 once and 11 eight times, total 20. Divide to obtain masses [.3,.25,.05,.4]. A's positive marginal is (.05+.4)=.45; B's is .25+.4=.65. Edit a selected count and the normalized bars, marginal sums and connected decision views update together. Counts are nonnegative integers; all four zeros define no probability distribution, so dependent values become explicitly unavailable rather than reusing an old law."}</Prose>

<BayesRiskFigure />

<Prose>{"For action a and outcome y, normalized Hamming loss counts differing bits and divides by two. Expected Hamming risks for actions 00,01,10,11 are .55,.4,.6,.45. For example, action 01 has loss .5 on 00,0 on 01,1 on 10,.5 on 11, giving .3×.5+.25×0+.05×1+.4×.5=.4. It chooses 01. Subset loss is 0 only for an exact vector match and 1 otherwise; its risks are .7,.75,.95,.6, choosing 11. The full matrix in the picture exposes every product before summing."}</Prose>

<Prose>{"The "}<strong>{"Bayes action"}</strong>{" minimizes expected loss R(a|x)=Σ_y P(y|x)ℓ(a,y). Additive Hamming loss lets each coordinate minimize separately: choose 1 when p_j≥.5 under our positive tie rule. Subset loss instead chooses a joint mode, also called maximum a posteriori or MAP. An exact risk tie needs a declared action rule; the complete-law program returns its tie set and uses a named lexicographic or reverse-lexicographic order. A tie is a decision convention, not a new probability estimate."}</Prose>

<MultiLabelProgramSource context={contexts[8]} />

<Prose>{"The complete "}<code>{"all_action_risks"}</code>{" route validates every vector/mass and evaluates every supported action. Exponential enumeration is useful for a small law because all terms remain inspectable. It cannot be treated as a scale-free solution when L grows. Its explicit operation/state budgets fail before oversized allocation; a hardware-independent label-count slogan would hide the actual work."}</Prose>

<Prose>{"F1 asks a different question again. For one row with truth Y and predicted set A, F1=2|A∩Y|/(|A|+|Y|), except that an empty/empty pair needs its separately stated payoff. Can we choose the expected-F1 set without searching all 2ᴸ actions?"}</Prose>

<F1SetSizeFigure />

<Prose>{"For predicted size k, write the expected reward as Σ_{j∈A}Δ_jk, where Δ_jk=Σ_s [2/(k+s)]P(Y_j=1,|Y|=s). At k=1, A's gain is 19/60 and B's 31/60, so choose B with reward .516667. At k=2, gains are A=7/30 and B=11/30, totaling .6. Predicting empty has reward .3 when empty/empty payoff is 1. Comparing sizes chooses AB, with expected F1 .6. Change the law to counts 18/1/0/1: empty mass .9 can make the empty prediction best. Change the empty payoff to zero and that candidate's reward changes; it does not alter nonempty set gains."}</Prose>

<Prose>{"For each k, choose the k largest gains. Compare all k=1…L and the empty action. This is the generalized F-measure maximization construction. It needs cardinality-indexed joint moments, not marginals alone: P(Y_j=1,|Y|=s) carries how many other positives accompany j. Constructing the gains naively costs O(L³); sorting each size costs O(L² log L). Parameter estimation is additional work. The standalone moment route accepts consistent moments without materializing a full law, while the small-law route independently verifies every candidate by exhaustive expected reward."}</Prose>

<Prose>{"This derivation optimizes "}<strong>{"expected instance F1"}</strong>{". Pooled micro F1 across a collection is a ratio of combined counts, so its decisions need not decompose into independent per-observation expected-F1 optimizers. Fixed-size gains and exact complete-law arithmetic should not be advertised as a proof of optimal test micro F1. The "}<a href={"https://jmlr.org/papers/v15/waegeman14a.html"}>{"F-measure paper"}</a>{" explains the loss-dependent distinction and the additional information its optimizer needs."}</Prose>

<MultiLabelProgramSource context={contexts[9]} />

<span id="8-choose-thresholds-on-validation" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"6. Turn scores into decisions using development evidence"}</H2>

<Prose>{"The preceding risks assumed a correct probability law. In practice a fitted head may return an imperfect probability, a margin or a vote. We need to state both its meaning and how a decision cutoff was chosen."}</Prose>

<ThresholdTiesFigure />

<Prose>{"Six observation scores [.9,.8,.8,.55,.4,.2] have truth [0,1,0,1,1,0]. At threshold .5 with ≥, four observations are positive: TP=2,FP=2,FN=1, giving F1=4/7. Lowering to .4 includes the missed positive and gives TP=3,FP=2,FN=0,F1=.75. A cutoff just above .8 excludes both equal .8 scores together. No scalar threshold can separate their different truth bits. The editable domain ends at 1.01 so even a score of 1 can be excluded; a cutoff is not itself a probability."}</Prose>

<Prose>{"Candidate decisions change only when a cutoff crosses a score. For a fixed validation set, search score breakpoints plus the declared none-positive endpoint instead of pretending every hundredth step yields a distinct set. Record the tie convention for scores exactly on the cutoff and the tie rule between equally scoring cutoffs. Those are parts of a recipe, not details to choose afterward from test truth."}</Prose>

<PooledCutoffsFigure />

<Prose>{"The two-output illustration has truth 10,10,01,00 and scores [.9,.7],[.8,.6],[.4,.55],[.1,.45]. At both cutoffs .5, TP=3,FP=2,FN=0 and micro F1=.75. A and B feed either one pooled ratio or two separate per-label ratios. Moving a cutoff can therefore change the other label's influence on the pooled objective without changing its predictions. Optimizing each label's F1 individually does not generally optimize micro F1."}</Prose>

<MultiLabelProgramSource context={contexts[10]} />

<Prose>{"The complete "}<code>{"thresholds.py"}</code>{" uses a separate six-row/two-column fixture and enumerates its score breakpoints. It compares a shared cutoff, independently chosen per-label F1 cutoffs and joint micro-F1 cutoff combinations. The product of candidate lists is exhaustive for that small fixture and grows rapidly for many labels; validation procedures at scale need their own stated search budget. Its recorded output describes that fixed fixture. Keep that fixture's results distinct from the live four-row illustration."}</Prose>

<Prose>{"If scores are calibrated probabilities and false-positive cost is c_FP while false-negative cost is c_FN, choosing 1 has risk c_FP(1−p), and choosing 0 has risk c_FNp. The Bayes cutoff is p≥c_FP/(c_FP+c_FN), assuming positive total cost and our tie rule. This derivation concerns those costs and probabilities. Tuning a threshold on a margin to maximize validation F1 is a different decision rule."}</Prose>

<WeightedOddsFigure />

<Prose>{"Class weighting changes the learning objective before thresholding. With positive BCE multiplied by c, the idealized conditional optimum solves q=cp/(1−p+cp), or odds(q)=c·odds(p). For p=.2 and c=4, q=.5. The inverse is p=q/[c−(c−1)q]. Move p and c below the picture to follow both odds and probabilities. At p=0 or 1 the limiting result is the same endpoint; no infinite-odds computation is needed."}</Prose>

<Prose>{"The formula follows by setting −cp/q+(1−p)/(1−q)=0. It assumes this exact weighted conditional-risk problem and a model able to represent its optimum. It does not undo arbitrary sampling, regularization, model misspecification or a different imbalance procedure. A weighted score q=.5 can correspond to original p=.2; calling it calibrated original probability would confuse the event scale. Calibration, class weighting and cost-driven thresholding each have a distinct operation and fitting boundary. Use held development evidence to assess the actual score when the idealized assumptions do not hold."}</Prose>

<Prose>{"We now have output identities, honest rows, chosen losses and declared score-to-decision rules. The next question is whether earlier answers can help predict later ones without showing a serving model the unknown truth."}</Prose>

<span id="6-follow-the-whole-probability-tree" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"7. Let later classifiers use earlier answers"}</H2>

<Prose>{"A Billing answer can be informative for Access. Can a later classifier use it when the true Billing answer is unavailable at serving time?"}</Prose>

<ChainAnatomyFigure />

<Prose>{"A "}<strong>{"classifier chain"}</strong>{" orders the output questions. During teacher-forced training, stage A receives the original d features, stage B receives those features plus true A, and stage C receives the features plus true A/B. At serving, A is predicted first; B receives predicted A; C receives the predicted prefix. Follow the distinct true-bit and predicted-bit ports. Changing order changes stage widths and information available to each stage, while the final inverse permutation restores each output to its original named column."}</Prose>

<Prose>{"The probability chain rule writes a complete conditional law as P(y|x)=Π_j P(y_{π_j}|x,y_{π_1},…,y_{π_{j−1}}) for an order π. Every exact distribution has such a factorization. That algebra does not say one label causes another, nor that a fitted collection of restricted classifiers estimates every factor accurately. Hard sequential prediction uses one path through that law, not necessarily the best vector for the chosen loss."}</Prose>

<ChainFactorizationFigure />

<Prose>{"Return to counts 6/5/1/8. A's branch masses are P(A=0)=11/20=.55 and P(A=1)=9/20=.45. On the A=0 branch, B=1 has probability 5/11, so B=0 has 6/11. Multiply .55×6/11=.3 for 00 and .55×5/11=.25 for 01. On A=1, B=1 is 8/9, producing .4 for 11 and .05 for 10. Both zero and one factors matter. Refactor BA and the same four leaves remain: order changes the factorization, not this supplied law. If a predecessor branch has mass zero, its conditional is undefined and unused; every descendant has zero mass without evaluating 0/0."}</Prose>

<GreedyMapFigure />

<Prose>{"Greedy AB takes the larger first branch A=0, then B=0 because 6/11>5/11, ending at 00 with mass .3. Greedy BA takes B=1 because .65>.35, then A=1 because 8/13>5/13, ending at 11 with mass .4. Exact MAP compares all leaves and chooses 11. A locally best edge need not lead to the globally heaviest leaf. In this example only one order's greedy path reaches that leaf; editing the connected law can change both outcomes."}</Prose>

<MarginalPathsFigure />

<Prose>{"To obtain B's marginal, add the two B=1 leaves: P(B=1)=P(01)+P(11)=.25+.4=.65. It is neither B's 5/11 conditional on A=0 nor its 8/9 conditional on A=1. Whole-vector decoding, greedy decisions and marginalization are separate operations on the same law. If the goal is Hamming loss, use the integrated marginals; if the goal is subset loss, compare complete masses. If a different loss is declared, compute its expected risk."}</Prose>

<MultiLabelProgramSource context={contexts[11]} />

<MultiLabelProgramSource context={contexts[12]} />

<Prose>{"The complete chain implementation fits every stage rather than supplying unexplained probability functions. "}<code>{"fit_chain"}</code>{" fits the original-input scaler on training X, assembles true predecessor columns and calls the exact Newton optimizer or the named supported constant branch. "}<code>{"serve_greedy"}</code>{" serves predicted bits with our ≥.5 convention. Exact inference batches all distinct prefixes at each depth: one stage call per depth, one probability calculation per prefix, then children multiply by p or 1−p. It does not recompute the same prefix independently for every completed leaf. After enumeration, the restore map carries π-ordered leaves back to the original output schema."}</Prose>

<Prose>{"There are 2ᴸ leaves and 2ᴸ−1 internal prefixes, so exact inference still grows exponentially. The implementation estimates allocation and arithmetic work before materializing them; larger unsupported requests produce an actionable resource result. Marginalizing an enumerated law costs O(L2ᴸ) for its leaf sums. This is an inspectable bounded reference route, not an inference guarantee for arbitrary large chains."}</Prose>

<Prose>{"The constructed fit uses 16 rows, two original features and three outputs, with all eight binary patterns appearing twice and order C,A,B. Its two shown queries produce greedy 001 and 110, while integrated marginals are approximately [.483480,.467281,.519104] and [.555862,.567643,.436046]. The program prints the training rows, stages, true-prefix inputs and full query laws, so an alternate action can be computed from the same fitted evidence. Its ordinary "}<code>{"ClassifierChain"}</code>{" recipe matches penalty, scaler and teacher-forced training before comparing probabilities; the recorded coefficient difference is about 1.65×10⁻⁹. The hard-label equality rule can differ at exactly .5, so comparisons away from that boundary do not erase it."}</Prose>

<RecordedChainPathFigure />

<Prose>{"The separate recorded 240-row library example exposes a common API misunderstanding. "}<code>{"predict_proba"}</code>{" returns [.512477,.771639] in original output order. The first predicted predecessor feature is 1, so the second number comes from that chosen prefix. Integrating both predecessor branches instead yields B marginal .569133. Its saved rounded leaves are [.313837,.173685,.117030,.395447]. The picture labels their displayed precision; their rounded products are not reconstructed full-precision fitted parameters."}</Prose>

<MultiLabelProgramSource context={contexts[13]} />

<Prose>{"In the inspected current API, use "}<code>{"estimator=..."}</code>{", inspect "}<code>{"order_"}</code>{", and restore original column identities when examining stages. "}<code>{"cv=None"}</code>{" trains later stages with true prior labels. "}<code>{"chain_method='predict'"}</code>{" uses hard predecessor features at serving; probability-valued features and stage-wise cross-validated training are separate declared recipes, not automatically the same teacher-forced model. A returned probability array is meaningful only after naming the features on which each entry was conditioned."}</Prose>

<span id="7-explain-association-before-exploiting-it" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"8. Separate representation, context, cross-fitting and chain averaging"}</H2>

<Prose>{"A chain uses earlier answers as features. Before interpreting an improvement, ask what kind of information those features add to a restricted classifier and how they were obtained."}</Prose>

<Prose>{"Consider the four raw input corners (a,b)=00,01,10,11. Their desired OR answers are 0,1,1,1; AND answers 0,0,0,1; XOR answers 0,1,1,0. A raw-input linear threshold cannot implement XOR with the declared ≥0 positive rule. The two positive opposite corners have the same midpoint as the two negative opposite corners, so a line cannot separate their convex hulls."}</Prose>

<RestrictedClassBridgeFigure />

<Prose>{"The first two heads create coordinates u=OR(a,b) and v=AND(a,b), using scores a+b−.5 and a+b−1.5. The third head thresholds u−v−.5. Trace 01: OR score .5 gives u=1, AND score −.5 gives v=0, and XOR score .5 gives 1. At 11 the transformed point is (1,1), so the last score is −.5 and XOR is 0. The raw square and transformed plane keep corner IDs visible: 01 and 10 coincide at (1,0), with both source IDs attached. The new representation makes the desired boundary linear in its displayed coordinates."}</Prose>

<NeuralTable caption={"OR/AND/XOR restricted-class witness · all four unperturbed corners"} headers={[<>{"Raw (a,b)"}</>,<>{"OR/A"}</>,<>{"AND/B"}</>,<>{"XOR/C"}</>,<>{"(u,v)"}</>,<>{"Last score"}</>]} rows={[[<>{"00"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>,<>{"(0,0)"}</>,<>{"−.5"}</>],[<>{"01"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"(1,0)"}</>,<>{".5"}</>],[<>{"10"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"(1,0)"}</>,<>{".5"}</>],[<>{"11"}</>,<>{"1"}</>,<>{"1"}</>,<>{"0"}</>,<>{"(1,1)"}</>,<>{"−.5"}</>]]} />

<Prose>{"This is a fixed representation witness, not evidence that a particular fit discovered these heads. It can be written as chain A→B→C: B ignores A, while C ignores the raw inputs and uses A/B. Training with true prefixes supplies the desired transformed bits; serving must obtain them from previous heads. At raw 11, flip the served AND bit from 1 to 0 below the picture. The last score becomes +.5 and the XOR decision becomes 1 although the desired answer remains 0. The operation clarifies both useful representation and error propagation."}</Prose>

<Prose>{"The two controls select a raw corner and either no flip or one served OR/AND flip. Reset restores 01 with no flip. "}<code>{"gate_witness"}</code>{" in the complete chain dependency computes the scalar heads. The complete chain program compares them with an ordinary NumPy matrix route for every corner and changed prefix. Refresh the raw linear-boundary argument in "}<a href={"/learn/track/deep-learning-fundamentals/perceptrons-neurons-activation-functions#2-a-perceptron-learns-a-boundary-from-mistakes"}>{"Perceptrons, §2"}</a>{" and the transformed representation in "}<a href={"/learn/track/deep-learning-fundamentals/perceptrons-neurons-activation-functions#3-hidden-neurons-change-what-the-model-can-express"}>{"§3"}</a>{". The witness does not create new raw information, imply causality, or promise a gain for every learner class; it changes what the restricted downstream linear head can express."}</Prose>

<MultiLabelProgramSource context={contexts[14]} />

<Prose>{"Observed context provides a different explanation for association. Imagine low and high contexts in which both A and B have positive probabilities .1 and .9 respectively, independently within each context."}</Prose>

<ContextMixtureFigure />

<Prose>{"Within the low context the joint 11 mass is .01; within the high it is .81. Mix them equally: joint masses become [.41,.09,.09,.41], marginals are both .5, but pooled P(B=1|A=1)=.41/.5=.82. A is informative about B in the pooled sample even though each conditional context law factorizes. The observed context belongs among input features, not as a causal arrow between labels. Move the mixture share to an endpoint: only one context remains. Make the two context rates equal and the mixture-induced association disappears."}</Prose>

<MultiLabelProgramSource context={contexts[15]} />

<Prose>{"The exact-fraction program computes those masses. Practice E changes the mixture share. Statistical association alone does not tell us whether the appropriate improvement is a label interaction, a better measured context variable or a more expressive model of existing inputs."}</Prose>

<Prose>{"A shared multilabel tree also needs a declared criterion. Does adding marginal entropies assert a factorized joint distribution?"}</Prose>

<MarginalJointEntropyFigure />

<Prose>{"Four rows at x=0,1,2,3 have output vectors 00,00,11,11. Each label's positive fraction is .5 and binary entropy is 1 bit, so the summed marginal entropy is 2 bits. Only two joint vectors occur, equally, so joint entropy is 1 bit. A cut at 1.5 makes both children pure: gains are 2 and 1 respectively. Both are valid computed criteria; they measure different quantities. The sum of marginal entropies is at least joint entropy, with equality for independent coordinates. Using the sum as a split surrogate does not require actual independence. The native library's fixed-L mean marginal impurity rescales that sum by L, leaving the cut ordering unchanged in this setting."}</Prose>

<Prose>{""}<code>{"entropy_split"}</code>{" exposes parent and child probabilities before computing the weighted gain; the actual ordinary entropy-tree comparison chooses cut 1.5 and parent mean impurity 1. Different row weights, missing-output policies or label subsets would need a separately stated reduction, rather than borrowing this equivalence silently."}</Prose>

<MultiLabelProgramSource context={contexts[16]} />

<Prose>{"An explicitly joint model makes a different commitment: it assigns one normalized mass to every complete answer vector."}</Prose>

<PairInteractionFigure />

<Prose>{"Give A/B bits score λ_A A+λ_B B+λ_AB AB. With λ_A=λ_B=0 and λ_AB=log 4, unnormalized masses are 1,1,1,4. The one normalizer is Z=7, giving probabilities 1/7,1/7,1/7,4/7. For observed 11, the AB feature equals 1; its expectation is 4/7, so the negative-log-likelihood gradient for λ_AB is 4/7−1=−3/7 before any penalty. Increasing that parameter initially reduces this observation's loss. At interaction 0 the bare two-bit law factorizes."}</Prose>

<Prose>{"With fixed features φ(x,y), write log P_θ(y|x)=θᵀφ(x,y)−logΣ_u exp [θᵀφ(x,u)]. The mean negative-log-likelihood gradient is average(model-expected φ−observed φ). Its Hessian is the average covariance of φ under the model; covariance is positive semidefinite. Adding positive L2 on a minimal identifiable feature basis makes the declared objective strictly convex. Changing or learning the feature map itself need not preserve that convexity statement."}</Prose>

<PairCovarianceTable />

<MultiLabelProgramSource context={contexts[17]} />

<Prose>{"The complete small fixed-feature fit uses φ=[A,xA,B,xB,AB], not a hidden arbitrary graphical solver. "}<code>{"log_linear_objective"}</code>{" computes stable log-sum-exp probabilities, expected features and the covariance Hessian. "}<code>{"fit_log_linear"}</code>{" performs a damped Newton solve and checks sufficient objective decrease; ordinary SciPy BFGS minimizes the exact same objective independently. On its declared context/count fixture, the final objective is 1.29026706 and the fitted coefficients are approximately [−.019288,−.022033,.214744,.361184,.471701]. The scratch gradient residual is near floating-point zero and the ordinary coefficient/gradient comparison is retained. This bounded normalization enumerates four states; general graph factorization, treewidth and message passing belong to "}<a href={"/learn/topic/conditional-random-fields-crfs"}>{"Conditional Random Fields"}</a>{"."}</Prose>

<Prose>{"Training features create another boundary. A later-stage model that consumes earlier predictions needs predictions obtained without using the held row's own answer. Is one globally generated out-of-fold column sufficient for every later stage?"}</Prose>

<StrictPrefixFigure />

<Prose>{"For held fold h and a requested prefix of length j, fit "}<strong>{"every"}</strong>{" prefix stage and its original-input scaler on the complement of h, then serve that whole system into h. The held rows have no path into the fitted states used to construct their prefix. After assembling these fold-held prefixes, fit the final stage on its declared full training rows. The selected fold control exposes IDs on each fit and serve arrow; the stage-wise comparison shows a possible indirect path through globally generated upstream columns."}</Prose>

<Prose>{""}<code>{"fit_strict_prefix_chain"}</code>{" implements that stronger isolation explicitly. With K folds and L stages, generating all length-j teacher-forced prefixes for j=1…L−1 takes KΣ_j j fits, plus L final-stage fits. Preprocessing repeats on the same legal complements. This is not recursively cross-fitting every feature within each complement; it names the precise isolation property it guarantees. Ordinary "}<code>{"ClassifierChain(cv=...)"}</code>{" creates its documented stage-wise cross-validated predecessor features, which is a different recipe. The comparison does not accuse every such prediction of being numerically biased; it distinguishes information paths before a task chooses its required boundary."}</Prose>

<MultiLabelProgramSource context={contexts[18]} />

<Prose>{"One chain order can still be unstable. What exactly do several chain systems average?"}</Prose>

<RecordedChainEnsembleFigure />

<Prose>{"Three members have distinct bags, orders and restored output sockets. Bootstrap duplicates have unique draw IDs while retaining their repeated original source IDs. Fit all stages for each member, serve the same query, and restore A/B/C before pooling. A hard-vote mean averages decisions. A path-score mean averages probabilities conditioned on each member's served prefixes. A complete-joint mean averages full probability laws. Only the last directly yields an integrated ensemble joint law and its marginals."}</Prose>

<Prose>{"The complete program trains those three member systems. On its first shown query, hard-vote decisions are 101 while the mean complete-law MAP is 100; on the second both produce 110. The program records every order, bag, stage and query law rather than presenting a hand vote table as fitted evidence. Averaging does not remove the need for validation-selected order/bag/decision settings. The "}<a href={"/learn/topic/ensemble-methods-stacking"}>{"Ensemble lesson"}</a>{" develops bootstrap identity and combining errors; here the distinct output objects determine what combining means."}</Prose>

<MultiLabelProgramSource context={contexts[19]} />

<span id="9-represent-label-sets-and-constraints" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"9. Treat a labelset as a category, then reduce the subproblem"}</H2>

<Prose>{"A chain models a vector sequentially. Could we instead give each observed complete vector one categorical ID?"}</Prose>

<PowersetVocabularyFigure />

<Prose>{"Training vectors 000,100,011,110 receive a train-only vocabulary. Encode them into categorical IDs, fit a multiclass classifier and decode its selected category back to named bits. The empty vector can be a legitimate class. A query vector 101 has no entry in this particular vocabulary: the fitted label-powerset classifier cannot produce it, regardless of how useful it might be. Reordering columns changes storage and the derived vocabulary consistently, while original label identities remain attached."}</Prose>

<Prose>{"The "}<strong>{"label powerset"}</strong>{" method represents at most min(n,2ᴸ) observed categories, often with thin support for unusual vectors. This may capture interactions but makes sparse class support and unseen vectors concrete limitations. It is not an unrestricted probability distribution over all possible vectors. A one-category vocabulary uses an explicit constant model; unknown output names are schema errors before encoding."}</Prose>

<MultiLabelProgramSource context={contexts[20]} />

<MultiLabelProgramSource context={contexts[21]} />

<Prose>{""}<code>{"fit_powerset"}</code>{" constructs its vocabulary from training rows with "}<code>{"np.unique"}</code>{", stores the mapping, and fits ordinary multiclass "}<code>{"LogisticRegression"}</code>{" or the named "}<code>{"DummyClassifier"}</code>{" branch. The alternative "}<code>{"LabelEncoder"}</code>{" route operates on complete string bitcodes and is checked for decoded equivalence. We implement the multioutput transformation and mapping here; the maintained library owns the multiclass optimizer. A labelset ID's numeric magnitude has no regression meaning."}</Prose>

<Prose>{"Reducing each categorical subproblem to k labels can give it more repeated classes. Overlapping subproblems then compose answers across groups. First separate a projection witness from a trained system."}</Prose>

<LabelsetSystemsFigure />

<Prose>{"Follow the illustrative row 101001 through ABF, BCD and CEF. The projected bits are 101,010,101. E/cyan and F/cream remain distinct from A/B/C/D: F is the third socket in ABF and CEF, not a new third-position label. This first view shows projection and identity only; these three groups have no fitted classifier parameters in the shown experiment. Its selected-group control follows the original row into the chosen local sockets."}</Prose>

<Prose>{"Now inspect an actual fitted subproblem below that anatomy. The saved sixteen-row, six-output program constructs four overlapping groups ADF, BCE, BDE and AEF from the schema and seed. These are different groups, explicitly labelled with their original output names. Selecting one shows every projected training row, its categorical ID, the complete train-only vocabulary and the saved multiclass coefficients/intercepts. For query [.3,−.4], compute each class score as w₁×.3+w₂×(−.4)+b, select its largest score and look up that ID's local vector. The four recorded decoded vectors are respectively 110,000,111,100. The second fixed query [−.6,.1] decodes 100,100,100,110. Restore each local socket to its named global label before the coverage reduction in the next picture."}</Prose>

<Prose>{""}<code>{"fit_labelset_ensemble"}</code>{" fits every supplied group and stores all mappings. Separate group constructors sample from schema and a seed. Disjoint groups permit a shorter last group; overlapping groups are distinct k-subsets without replacement. The coverage-first construction enforces m≤choose(L,k), rejects insufficient mk<L or an unsupported materialization size before fitting, and never consults test labels to search for attractive groups. All four selected recorded groups here use the multiclass-logistic branch. The separate known-empty, one-category example has a literal supported-constant branch that always decodes 00; it has no invented logistic coefficients. Projection and decoding are the same operations in both branches, while the fitted prediction operation differs."}</Prose>

<PublishedLabelsetVotesFigure />

<Prose>{"Each decoded local bit votes only for its original label. Count a label's votes, then divide by its "}<strong>{"own coverage"}</strong>{", the number of groups containing it. The separate seven-group hand construction gives vote means [3/4,1/4,2/3,1/4,1/3,2/3], producing 101001 at a strict >.5 majority. The three-group projection anatomy is a separate object, not those seven groups disguised. The complete fitted 16-row/six-output example prints its actual groups, local vocabularies, coefficients and query contributions."}</Prose>

<CoverageBoundaryFigure />

<Prose>{"Remove a group below the picture and inspect the corresponding coverage changes. Zero coverage is unsupported, not a zero probability and not a default negative. A half vote is negative under the reproduced RAkEL strict >.5 rule. The transparent "}<code>{"powerset.py"}</code>{" toy uses ≥.5, so its boundary remains explicitly different. In the ABF/BCD/CEF identity check, changing F's third local vote can make its mean .5; the new rule chooses F=0 while preserving its identity and denominator 2."}</Prose>

<Prose>{"Overlapping composition can produce a global vector absent from any one whole-label vocabulary, but it does not guarantee every desired vector or a coherent joint law. Its voting rule combines decoded local predictions. Cost includes m training problems, each with up to min(n,2ᵏ) observed categories, plus projection and decoding. The complete program checks trusted own serialization against the same saved query predictions; downloading numerical source is different from loading an untrusted Python pickle."}</Prose>

<H2>{"10. Learn from nearby labelsets or pairwise label preferences"}</H2>

<Prose>{"Labelset groups share categorical structure. A different route asks what labelled neighbours imply about each answer, or which answers should outrank others."}</Prose>

<NeighbourIdentityFigure />

<Prose>{"Place six observations at positions 0,1,2,5,6,7 with A bits 111000 and B bits 010101. With k=2, collect each training row's two nearest "}<strong>{"other"}</strong>{" row IDs, then count positive A/B answers among them. A duplicate coordinate is still a distinct observation: self exclusion removes the selected row's identity, not every zero-distance point. The query at 1.2 has no training self and selects the rows at 1 and 2, producing positive counts [2,1]."}</Prose>

<Prose>{""}<code>{"nearest_rows"}</code>{" and the ordinary "}<code>{"NearestNeighbors"}</code>{" comparison both retain all candidate rows and apply declared stable-ID ties. Asking the library for only k rows before reranking could discard a tied boundary candidate; the complete small route queries enough candidates to implement its tie contract. Euclidean distance and optional scales are learned from training inputs only. The inspected "}<a href={"/learn/topic/k-nearest-neighbors-knn"}>{"KNN lesson"}</a>{" refreshes distance and nearest-set selection; here training leave-self-out identity is the new operation."}</Prose>

<NeighbourHistogramFigure />

<Prose>{"ML-kNN turns the count into an empirical likelihood. For label j, collect C_jb(r): how many training rows have own bit b and neighbour count r. In the reference, A's negative histogram over r=0,1,2 is [3,0,0], positive histogram [0,0,3]. B's negative histogram is [0,2,1], positive [1,2,0]. Both classes have three rows. With smoothing s=1, prior P(Y_j=b)=(s+n_jb)/(n+2s)=1/2 and P(R_j=r|Y_j=b)=(s+C_jb(r))/[(k+1)s+n_jb]. Each likelihood histogram sums to one."}</Prose>

<NeighbourPosteriorFigure />

<Prose>{"For query A count 2, the positive likelihood is 4/6 and negative 1/6. Multiply each by its prior .5: numerators 1/3 and 1/12; normalize to posterior .8. For B count 1, both likelihoods are 3/6 with equal priors, so posterior is .5. Our ≥.5 rule predicts 11. A two-neighbour raw vote is [1,.5]; its normalization and meaning differ from [.8,.5]. Move k, smoothing or query coordinates within the taught controls and inspect the actual count histograms and both Bayes branches together."}</Prose>

<MultiLabelProgramSource context={contexts[22]} />

<Prose>{"The full scratch code constructs the leave-self-out counts, smoothed priors, both likelihoods and normalized posterior. "}<code>{"NearestNeighbors"}</code>{" supplies only the retrieval primitive; there is no fictional sklearn ML-kNN estimator. This reference requires both known classes for each label, rejects unsupported data and keeps row IDs. ML-kNN yields separate label posteriors, not a normalized law over all vectors. Brute-force neighbour distance costs O(n²d) for training and O(nd) per query before selection; practical large retrieval changes the implementation and potentially its approximate-neighbour contract."}</Prose>

<Prose>{"Ranking learns a different relationship: relevant A should outrank irrelevant B for the same input."}</Prose>

<PairMarginFigure />

<Prose>{"With x=[1,−1] and truth {A,C}, there are two pairs A>B and C>B. For one pair, score difference s_A−s_B=.4 produces unit-margin hinge max(0,1−.4)=.6. Its active derivative sends −x into A's weight column and +x into B's. At margin 1 we choose the zero subgradient. The selected pair and margin control expose opposite updates on actual named columns, not one scalar error without its destinations."}</Prose>

<Prose>{"An original RankSVM formulation normalizes each observation's slack sum by R_i(L−R_i). Our complete numerical reference deliberately uses a different global mean-pair "}<strong>{"squared"}</strong>{" hinge plus λ||w||²/2. It makes a transformed design row z with x̃ in the relevant label's block and −x̃ in the irrelevant block, then a signed reverse copy so the ordinary binary solver sees both directions. The intercept coordinate is explicitly regularized here, unlike section 4's logistic intercept."}</Prose>

<Prose>{""}<code>{"fit_pair_ranker"}</code>{" computes max(0,1−t zᵀw)² and its gradient, uses a spectral Lipschitz step, and checks stationarity/cap. Ordinary "}<code>{"LinearSVC(loss='squared_hinge', dual=False, fit_intercept=False, C=1/(mλ))"}</code>{" receives the identical signed design with m transformed rows. The actual constructed comparison has 24 rows,9 features and C=.208333; coefficient difference is about 3.72×10⁻⁹. This is objective parity for the declared variant, not a replication of original RankSVM. The pair count Σ_iR_i(L−R_i) and transformed block width control memory; the implementation checks its budget before allocation."}</Prose>

<Prose>{"A kernel version replaces inner products with a kernel on pair-feature differences, changing the solver and its storage costs. General structured-margin inference is related to the "}<a href={"/learn/topic/support-vector-machines-svm"}>{"SVM lesson"}</a>{" and "}<a href={"/learn/topic/conditional-random-fields-crfs"}>{"CRF lesson"}</a>{", but neither link is passed off as a locally implemented full kernel RankSVM optimizer. BP-MLL instead trains a neural representation using relevant–irrelevant output differences; section 15 will trace the shared hidden pullback before naming that extension."}</Prose>

<Prose>{"Ranking alone does not say how many labels to return. A virtual relevance label V can make that cutoff part of the learned comparisons."}</Prose>

<VirtualRelevanceFigure />

<Prose>{"Truth A/C yields pair incidences A>B,C>B,A>V,C>V,V>B. At a query, every learned pair comparison contributes a vote. The shown tournament gives C3,A2,V1,B0. Real labels with votes strictly greater than V are positive, so return A/C. Flip one comparison below the picture: ties or a cycle can appear. Stable label identity orders a displayed vote tie but cannot turn it into an acyclic latent order. A real label tied with V is excluded."}</Prose>

<Prose>{""}<code>{"fit_virtual_label_ranker"}</code>{" fits every supported discordant pair with ordinary "}<code>{"LinearSVC"}</code>{"; a constant direction or no discordant evidence has an explicit branch. The query code records pair outcomes and accumulates votes, including neutral half-votes under its stated missing-pair rule. Here "}<strong>{"calibrated label ranking"}</strong>{" names a learned relevance cutoff. It does not mean calibrated probabilities. The complete file prints fitted comparison support, scores and cutoff outputs, alongside the independent ranking-metric implementation."}</Prose>

<MultiLabelProgramSource context={contexts[23]} />

<H2>{"11. Different categorical outputs and legal answer vectors"}</H2>

<Prose>{"So far each label has been binary. What changes when each output column has its own set of alternatives, or some complete answers are forbidden?"}</Prose>

<CategoricalArraysFigure />

<Prose>{"Fruit's classes "}<code>{"[apple, orange, pear]"}</code>{" form one categorical probability row. Condition's "}<code>{"[damaged, fresh]"}</code>{" form another. Normalize within each output, then decode its own argmax with its own "}<code>{"classes_"}</code>{". A single five-category softmax would incorrectly make a fruit name compete with a condition. The illustration establishes the interface; the complete program's numerical example uses explicitly different names low/middle/high and cool/warm."}</Prose>

<MultiLabelProgramSource context={contexts[24]} />

<Prose>{""}<code>{"MultiOutputClassifier(LogisticRegression(...))"}</code>{" fits one categorical estimator per target column. For two query rows, "}<code>{"predict_proba"}</code>{" returns a list of arrays shaped (2,3) and (2,2), not one universal rectangular class tensor. Its first vocabulary is sorted "}<code>{"[high,low,middle]"}</code>{"; the second "}<code>{"[cool,warm]"}</code>{". Inspect each estimator's actual classes before mapping columns to names, particularly when a training subset lacks a category. Compute per-output correctness and exact-vector correctness explicitly; generic metric support for multiclass-multioutput targets is limited, so a shape accepted by one estimator does not promise every scoring API accepts it."}</Prose>

<Prose>{"Independent categorical predictions may also violate a task rule. A medical code hierarchy is a possible output-contract example: a specific child code may require its parent code. This is a logical requirement declared by a task, not evidence that our constructed message labels obey such a hierarchy."}</Prose>

<FeasibleCubeFigure />

<Prose>{"The three-bit cube makes rule C⇒A concrete. Remove vertices 001 and 011 because C=1 while A=0; keep the other six. An exclusive A/B rule removes a different set. Evaluate the rule on the selected vertex before optimizing anything. A set of conflicting rules can leave no feasible answer: report that explicitly instead of inventing a valid output. Hard constraints restrict actions or support; they do not establish the learned probabilities."}</Prose>

<ConstrainedRepairFigure />

<Prose>{"Use masses in 000…111 order [.2,.15,.05,.3,.1,.05,.1,.05]. The unconstrained mode is 011 with probability .3, which violates C⇒A. Restrict MAP to legal vertices and choose 000 with mass .2. A deterministic repair “add A when C=1” instead turns 011 into 111, whose original mass is .05. These are different operations. The total original feasible mass is .55; conditioning the distribution on feasibility divides each legal mass by .55, whereas merely restricting the selected action does not renormalize the original law."}</Prose>

<Prose>{""}<code>{"constrained_map"}</code>{" validates the complete law and feasible set, then chooses among eligible vertices. The complete program also demonstrates the documented repair on the same illegal candidate. Repair changes a predictor and can worsen the declared loss. To decide a constrained Hamming or F1 action, minimize that constrained expected loss rather than assuming legal MAP solves every objective. General factor-graph scores and normalization extend this local cube in "}<a href={"/learn/topic/conditional-random-fields-crfs"}>{"CRF §§8–9"}</a>{"; our explicit six-vertex example is complete before that destination."}</Prose>

<MultiLabelProgramSource context={contexts[25]} />

<Prose>{"The output contract now covers bits, categorical alternatives and feasibility. Numerical outputs will keep the same row identity but require a new conversation about units and what actually couples their fits."}</Prose>

<span id="10-predict-several-numerical-outputs" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"12. Numerical outputs need units before a joint loss"}</H2>

<Prose>{"Suppose one input returns temperature in °C and energy in Wh. How should an error of 1 compare across those two coordinates?"}</Prose>

<UnitResidualFigure />

<Prose>{"Follow a single observed and predicted value on each unit-labelled axis. Their residuals are prediction minus observation. Squaring gives °C² or Wh²; averaging and taking a root returns the original unit. Per-output RMSE_j=√[n⁻¹Σ_i(ŷ_ij−y_ij)²] remains interpretable. Simply adding unlike-unit errors without declared weights makes the numerical unit choice part of the objective accidentally."}</Prose>

<Prose>{"The constructed regression example uses 120 rows,90 training and 30 held-out, with the stated synthetic temperature/energy units. Its mean baseline RMSE is [1.591947,14.119042], OLS [.180527,4.620232], Ridge [.177978,4.605764] and linear chain [.180527,4.620232]. These are results for that fixed construction, not field-meter performance. Its dimensionless squared-error report divides by each raw training target standard deviation. Energy's source metadata later use supplied load units; the illustrative physical units are not assigned to that dataset."}</Prose>

<MultiLabelProgramSource context={contexts[26]} />

<Prose>{"Can a matrix-shaped fit itself couple numerical outputs?"}</Prose>

<SeparateMatrixSolveFigure />

<Prose>{"Center X and Y on training means, solve for W and restore intercept b=ȳ−x̄W. For separable ridge objective ||Y−XW||²_F+λ||W||²_F, each output column minimizes ||y_j−Xw_j||²+λ||w_j||² independently. With λ>0, W=(XᵀX+λI)⁻¹XᵀY; implement a solve rather than explicitly forming the inverse. With λ=0, full column rank gives the unique OLS solution; deficient designs can have multiple coefficients with the same fitted projection. "}<code>{"np.linalg.lstsq"}</code>{" gives its numerical least-squares choice, not evidence that every coefficient has a uniquely identified interpretation."}</Prose>

<Prose>{""}<code>{"fit_ridge_matrix"}</code>{" implements centering, solve/lstsq and intercept reconstruction. Ordinary "}<code>{"LinearRegression"}</code>{", "}<code>{"Ridge"}</code>{" and "}<code>{"MultiOutputRegressor"}</code>{" receive the same inputs/outputs. Reusing one factorization can reduce repeated computation; the loss still separates. Target-wise positive rescaling followed by inverse mapping leaves independent OLS/Ridge predictions unchanged under their matched separable penalties, while shared structure may change. These facts refer to the precise objective, not every library's parameter with the name “alpha.”"}</Prose>

<MultiLabelProgramSource context={contexts[27]} />

<Prose>{"A linear true-label chain is particularly revealing. At training, B can consume true previous targets; at serving it consumes their linear predictions. Why did its shown OLS predictions match the independent fit?"}</Prose>

<LinearChainCancellationFigure />

<Prose>{"Write a stage's original-feature slopes as β_x and predecessor slopes as β_p. If the previous stages' effective original-feature matrix is B_prev, serving produces effective slopes B=β_x+B_prevβ_p. In centered coordinates and with the same slope penalty λ, the original-feature normal equation is Aβ_x+XᵀY_prevβ_p=Xᵀy, where A=XᵀX+λI. Matching prior effective fits satisfy A B_prev=XᵀY_prev. Substitute that identity to obtain A(β_x+B_prevβ_p)=Xᵀy, exactly the independent ridge equation. Unique A therefore gives the independent coefficient column."}</Prose>

<Prose>{"The proof requires matched preprocessing and unpenalized intercept treatment, true-label predecessor training, matching original-feature penalties and unique effective solves. For OLS use full column rank. For ridge, do "}<strong>{"not"}</strong>{" replace XᵀY_prev with XᵀX B_prev: penalized residuals are not generally orthogonal to X. The correctly substituted identity includes λ. Different penalties, OOF predecessor inputs, nonlinear stages or unmatched transforms can break this cancellation argument; a pseudoinverse extension has not been proved here."}</Prose>

<Prose>{"The complete program fits the same declared correlated 24-row design using matrix ridge, separate ordinary fits and true-label chains. At matching λ=.7, effective coefficients and served predictions agree near floating-point tolerance. Changing the final stage's penalty to 4 while retaining the previous .7 yields coefficient difference about .19143 from the separate penalty 4 fit. The changed result locates the missing proof premise; it is not a generalization comparison favoring either method."}</Prose>

<Prose>{"Reduction order introduces another subtle difference."}</Prose>

<RootReductionFigure />

<Prose>{"With per-output MSE values 1 and 9, roots first give 1 and 3, then their uniform mean is 2. Mean first gives 5, whose root is √5≈2.236068. The ordinary "}<code>{"root_mean_squared_error(..., multioutput='uniform_average')"}</code>{" follows per-output roots before averaging. "}<code>{"sqrt(mean_squared_error(...))"}</code>{" on an already uniformly averaged value follows the other operation. Use "}<code>{"multioutput='raw_values'"}</code>{" to report each coordinate before selecting a justified combined score."}</Prose>

<Prose>{"A reversible training-only target transform stores each mean and scale, transforms training Y for fitting and inverts predictions before raw-unit reporting. "}<code>{"TransformedTargetRegressor"}</code>{" expresses that ordinary recipe. A dimensionless score such as mean_j RMSE_j/s_j uses frozen training scales s_j. A constant target has s_j=0, so define a different raw-error fallback for a general task or block that normalized objective. The specific Energy protocol blocks nonpositive scales before fits; it does not silently switch to the general fallback."}</Prose>

<span id="11-decide-what-to-share" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"13. Couple numerical tasks through a partition or a feature row"}</H2>

<Prose>{"The previous matrix solve did not couple outputs. A shared partition does: its threshold must compromise among multiple output losses."}</Prose>

<SharedScaleSplitFigure />

<Prose>{"Four x values 0,1,2,3 have temperature [0,0,2,2] and energy [0,100,100,100]. A stump tries cuts .5,1.5,2.5 and stores each child's two-output mean. At cut .5, temperature SSE is 8/3 and energy SSE 0. At 1.5, temperature SSE 0 and energy SSE 5000. At 2.5, temperature SSE 8/3 and energy SSE 20000/3. Raw summed SSE selects .5. Divide energy by 100 before the objective: candidate totals become 8/3,.5,10/3, selecting 1.5. Target scale changes which partition the two outputs share."}</Prose>

<Prose>{"Inspect a cut's actual vector leaves, then change the continuous energy divisor. Tick labels 1/10/100 are convenient points, not the whole permitted domain. The original-unit errors remain available beside the scaled training objective. A changed scale is a modeling choice, not evidence that one output has become less important in the real world."}</Prose>

<EditedSharedSeparateFigure />

<Prose>{"Separate stumps can choose temperature cut 1.5 and energy cut .5, both with zero training SSE at the reference. The shared stump must choose one cut for both. Edit the selected output's four target values and recompute every candidate's mean/SSE before interpreting its split. Invalid draft rows produce a labelled unsupported calculation; Reset restores all rows, mode and drafts."}</Prose>

<Prose>{""}<code>{"stump_candidates"}</code>{" directly sorts x, enumerates supported cuts and calculates vector leaf means and within-leaf squared errors. Ordinary "}<code>{"DecisionTreeRegressor(max_depth=1)"}</code>{" with matrix Y fits a native shared-output tree; "}<code>{"MultiOutputRegressor"}</code>{" fits distinct scalar trees. Their boundaries and leaf shapes, not merely identical-looking calls, identify the sharing. The small enumerator explains the operation. A maintained tree builder handles recursive split search and storage efficiently; we do not claim to rebuild that full engine. The complete "}<code>{"sharedSplit.py"}</code>{" file contains the ordinary shared/separate tree comparison on exactly these four rows."}</Prose>

<MultiLabelProgramSource context={contexts[28]} />

<MultiLabelProgramSource context={contexts[29]} />

<Prose>{"A penalty can also couple which input features participate in different outputs. Let W's row r contain one feature's coefficients across all tasks."}</Prose>

<WholeFeatureRowFigure />

<Prose>{"The row vector z=(3,4) has norm 5. The proximal operation for λ||w_r||₂ shrinks the "}<strong>{"whole row"}</strong>{" by max(1−λ/||z||₂,0). At λ=2, result is .6×(3,4)=(1.8,2.4). Separate coordinate soft thresholds instead give (1,2). The row operation preserves direction until the row reaches zero. A zero row or λ at least its norm produces exactly zero without computing 0/0. Edit z's two coordinates and λ to inspect this operation."}</Prose>

<Prose>{"The joint objective is J(W)=||Y−XW||²_F/(2n)+αΣ_r||W_r||₂, with centered data for an unpenalized intercept. In an orthonormal design XᵀX/n=I, each row has this closed-form shrink around its least-squares sufficient statistic. A correlated design does not: the smooth gradient couples feature rows through XᵀX."}</Prose>

<MultiLabelProgramSource context={contexts[30]} />

<GeneralDesignProximalFigure />

<Prose>{"For X=Y=[[1,0],[1,1],[0,1]], W=0, α=.2 and step η=.5, the smooth gradient is −[[2/3,1/3],[1/3,2/3]]. The gradient step gives Z=[[1/3,1/6],[1/6,1/3]]. Each row has norm √5/6≈.372678 and proximal threshold ηα=.1, so its shrink factor is 1−.6/√5≈.731672. The result rows are approximately [.243891,.121945] and [.121945,.243891]. Follow gradient, Z and each norm gate in order. Iteration and α controls repeat this actual update, with objective and convergence/cap state."}</Prose>

<Prose>{"General proximal gradient uses ∇smooth=Xᵀ(XW−Y)/n, then W_next=prox_{ηα}(W−η∇smooth). A safe η is at most 1/L with L=||X||²₂/n, or a checked backtracking step. The stationarity diagnostic ||W−prox(W−η∇smooth)||/η tests the composite optimum, not only the smooth gradient. "}<code>{"fit_group_regression"}</code>{" centers training data, uses the spectral step, records the objective trace and stops by this residual or its explicit cap. It does not shrink OLS once and call that the general solution."}</Prose>

<Prose>{"Ordinary "}<code>{"MultiTaskLasso(alpha=α)"}</code>{" uses the same mean-squared-loss plus row-group norm, with "}<code>{"coef_"}</code>{" arranged outputs×features rather than our features×outputs. Transpose deliberately. The correlated fixture's fit converges in 240 iterations with proximal residual about 5.98×10⁻⁹ and coefficient difference about 6.59×10⁻⁹ from the ordinary coordinate-descent result. A shared row penalty encourages common support; it can hurt tasks that genuinely use different features. Similar coefficient arrays under a matched objective are not a test of prediction superiority."}</Prose>

<MultiLabelProgramSource context={contexts[31]} />

<span id="12-compress-labels-without-losing-the-question" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"14. Share a low-dimensional direction without hiding rare outputs"}</H2>

<Prose>{"Instead of requiring the same feature rows, could several outputs share a smaller fitted response subspace? First distinguish the response variation the inputs can fit from variation they cannot."}</Prose>

<FittedResponseProjectionFigure />

<Prose>{"Use centered X=[[-1,0],[1,0],[0,−1],[0,1]], with first target [−2,2,0,0] and second [10,10,−11,−9]. Reduced QR gives Q=X/√2 and R=√2I. Compute Z=QᵀY: its diagonal entries are 2√2 and √2. The second target contains large variation orthogonal to Q that no linear coefficient on this X can fit. Projecting before imposing rank separates that unfit component from the supervised directions."}</Prose>

<ReducedRankSolveFigure />

<Prose>{"For full-column-rank centered X=QR with orthonormal Q, ||Y−XW||²_F=||(I−QQᵀ)Y||²_F+||QᵀY−RW||²_F. The first term is fixed. Since invertible R preserves rank, a rank-r W corresponds to rank-r RW. Truncate the SVD of Z=QᵀY to Z_r, then solve R W_r=Z_r and restore the training intercept. This minimizes the rank-constrained training SSE under the stated assumptions. NumPy supplies QR/SVD and the linear solve; our implementation constructs and interprets their supervised problem."}</Prose>

<Prose>{"At rank 1, retain the first fitted direction: first target fits exactly, second prediction is zero, SSE 402. Full rank 2 adds its fitted second direction and leaves only unfit SSE 400. Raw-target PCA rank 1 followed by regression selects the high-energy second target direction instead, giving SSE 408. Both routes carry the same 400 units of unfit squared variation; their rank constraints operate on different objects. The actual projected and raw singular values make the distinction visible rather than treating every SVD as the same reduction."}</Prose>

<MultiLabelProgramSource context={contexts[32]} />

<Prose>{""}<code>{"fit_rrr"}</code>{" centers inputs/targets on training, checks full numerical column rank, optionally applies declared positive output weights or training target scales, computes Z and its truncation, solves for W, then restores original units. Rank 0 gives training means; full supported rank matches ordinary "}<code>{"LinearRegression"}</code>{". It reports numerical and requested rank separately. The ordinary "}<code>{"PCA"}</code>{"→regression contrast is complete code, but there is no built-in sklearn RRR estimator invented here. Rank selection and output weighting belong to development evidence. Orthogonal output rotations preserve an unweighted squared-error problem; unequal units or nonorthogonal scaling alter it."}</Prose>

<Prose>{"The cost follows the matrix shapes: reduced QR approximately O(nd²) for tall X, multiplying QᵀY O(ndq), SVD of d×q about O(dq min(d,q)), plus the solve. Deficient designs require another proved variant; this reference rejects that unsupported case rather than claiming a pseudoinverse rank theorem."}</Prose>

<Prose>{"Compressing binary labels introduces another criterion. Does high retained energy guarantee that rare positive answers survive?"}</Prose>

<RareLabelCompressionFigure />

<Prose>{"The 200-row construction repeats an alternating common binary column twice. Its third, rare label is positive only on rows 0 and 1, so its mean is .01. Centered common energy is 100, rare energy 1.98, with orthogonal centered variation. Rank 1 retains 100/(100+1.98)=.980584 but reconstructs the rare column constantly at .01. A .5 decision therefore has rare recall 0. Retained energy describes reconstruction variance, not per-label recall."}</Prose>

<MultiLabelProgramSource context={contexts[33]} />

<Prose>{"This exact centered example is distinct from original uncentered PLST. Both reduce outputs, but centering, inverse mapping and the decision objective must be named. A retained-energy plot cannot certify a rare-event use case without inspecting support and output-specific errors."}</Prose>

<Prose>{"Random measurements offer another compression route. Encode y with a measurement matrix A, fit a regressor for Ay, then decode its predicted measurement. What object is that regressor estimating?"}</Prose>

<CompressedRecoveryFigure />

<Prose>{"The dictionary A=[[1,0,1/√2],[0,1,1/√2]] has three unit-length columns and two measurement coordinates. For z=[1,0], initial correlations Aᵀz=[1,0,1/√2] select the first atom. Solve least squares on that active column: coefficient 1, residual 0, decoded vector [1,0,0]. OMP repeats correlation selection, active-system solve and residual update until the declared residual tolerance or atom cap. Selecting the same atom twice is forbidden; a rank-deficient active system is unsupported."}</Prose>

<MultiLabelProgramSource context={contexts[34]} />

<Prose>{""}<code>{"omp"}</code>{" keeps normalized dictionary columns, chooses the smallest original index at an exactly computed correlation tie and records every active solve. "}<code>{"ordinary_omp"}</code>{" calls "}<code>{"OrthogonalMatchingPursuit(fit_intercept=False, n_nonzero_coefs=...)"}</code>{" with A as its design: dictionary columns are candidate features, measurement coordinates are its rows. It preserves actual warnings. At changed z=[.6,.8] and cap 2, both routes have nearly zero residual but select different supports at a floating-point tie. Their reconstruction differs; a small residual alone does not establish unique recovery."}</Prose>

<Prose>{"The full compressed regression uses a known 60-row binary construction with conditional means that vary linearly across the shown input. It trains ordinary "}<code>{"StandardScaler"}</code>{" and "}<code>{"Ridge"}</code>{" on training inputs and compressed targets. At query x=.5, desired mean is [.325,.2,0,0]. Both the explicit dictionary and declared Gaussian seed 71 reconstruct approximately [.3249875,.2,0,0] in their scoped runs. The code stores the actual normalized random draw, not an expectation over an undisclosed preferred seed. These are constructed mathematical experiments; the actual Energy report uses a different target and protocol."}</Prose>

<SparseOutcomesDenseMeanFigure />

<Prose>{"Each of four equally likely outcomes has one positive label, yet E[Y|x]=[.25,.25,.25,.25]. Sparse observed rows therefore need not imply a sparse conditional mean. For the dictionary consisting of three coordinate atoms and (1,1,1)/√3, that dense mean shares its measurements with sparse vector [0,0,0,(1+√3)/4]. OMP gives the sparse vector with nearly zero measurement residual but original-mean squared error .375. With Gaussian seed 71, its sparse estimate instead has a nonzero measurement residual and mean squared error about .165. Both errors remain visible beside the successful sparse-mean example; a small measurement residual alone does not establish output recovery."}</Prose>

<Prose>{"The "}<a href={"https://arxiv.org/abs/0902.1283"}>{"compressed prediction paper"}</a>{" connects regression error in measurements to output recovery under stated sparsity and measurement assumptions. O(k log L) measurement scaling belongs to specific recovery conditions; its OMP-specific sufficient conditions are stronger. Restricted isometry, coherence and noise bounds are properties/assumptions to verify, not badges conferred on every random draw. OMP requires correlation work across L atoms per step plus active least-squares solves; fitting the compressed regressor is additional work. It predicts E[AY|X]=A E[Y|X] when that conditional mean is the target, so the sparse-object assumption must concern the quantity being recovered."}</Prose>

<H2>{"15. Price label scale and distinguish frontier mechanisms"}</H2>

<Prose>{"The small examples let us inspect every object. Which objects become expensive when label count grows, and which sharing changes the model rather than just the storage?"}</Prose>

<LabelScaleObjectsFigure />

<Prose>{"Dense binary targets have nL cells, heads have dL slopes and dense query scores have L values. Sparse target storage can use only observed positives plus row pointers, but it does not automatically make fitted scores sparse. A sequential chain has prefix widths d,d+1,…,d+L−1, totaling Ld+L(L−1)/2 feature coordinates per row across stages. One row with R positives produces R(L−R) pair constraints. Powerset has at most min(n,2ᴸ) occupied categories, while m groups of size k expose mk projected output memberships. The controls change L and n to show these arithmetic sizes, not invented runtime milliseconds."}</Prose>

<Prose>{"Choose a representation based on the task, not a single complexity adjective. Dense heads can batch a matrix multiply; sequential hard chains need dependency-ordered stages; exact chains still enumerate exponentially; subset ensembles can train independent members; sparse retrieval trades a candidate boundary for a full score array. Hardware speed needs an actual measured implementation and shapes, not a bar chart labelled with asymptotic notation as if it were a benchmark."}</Prose>

<CandidateRetrievalFigure />

<Prose>{"A hierarchy or approximate retrieval index can first propose candidate labels, then score only those candidates. If one true label is omitted, the final scorer cannot recover it under this explicit output boundary. Candidate recall therefore caps final recall. The omitted slot is "}<strong>{"unscored"}</strong>{", not a confident zero probability. Change the candidate set and inspect the numerator/denominator separately from final correctness. A hierarchy used for search is different from the hard implication rule in section 11, even when both draw a tree."}</Prose>

<Prose>{"Changing vocabularies creates versioned output schemas; adding a label means new support, parameters and evaluation denominators. Missing annotations remain a mask/selection problem, not a negative-class expansion. Drift can change base rates, feature relationships or annotation policy, so validate the boundary that moved. Approximate neighbour retrieval in the "}<a href={"/learn/topic/k-nearest-neighbors-knn"}>{"KNN lesson"}</a>{" is a useful computational connection after these candidate semantics are clear."}</Prose>

<Prose>{"Current experimental vector-tree implementations may sketch gradients to make split search cheaper while retaining full output values at leaves. That is different from compressing the final predictions."}</Prose>

<SplitGradientSketchFigure />

<Prose>{"The full four-row/three-output gradient grid is [1,0,1],[1,0,−1],[−1,0,1],[−1,0,−1]. Selecting coordinate A for split search exposes a strong cut after row 2: child sums are +2/−2. Coordinate C's sums there are 0/0; another cut can matter differently. Whichever coordinate supplies the search sketch, the leaf calculation still receives all three gradient columns. For this hand example, give every row/output Hessian value 1 and use leaf penalty λ=1. At the cut after row 2, full left/right gradient sums are [2,0,0] and [−2,0,0], Hessian sums are [2,2,2] on both sides, and the Newton leaf rule −G/(H+λ) gives [−2/3,0,0] and [2/3,0,0]. This specified diagonal-Hessian operation explains the full-output leaf ports; it is not an executed boosting model. Inspect the actual full and reduced ports before comparing this mechanism with output compression."}</Prose>

<Prose>{"The "}<a href={"https://xgboost.readthedocs.io/en/stable/tutorials/multioutput.html"}>{"official XGBoost multi-output tutorial"}</a>{" marks support experimental and documents restrictions for its stated strategies. It is a scoped frontier resource, not an executed fit in this lesson. A reduced split-gradient sketch, a shared partition and a low-dimensional final answer are three different sharing choices. No benchmark or universal quality result is inferred from the hand gradient grid."}</Prose>

<Prose>{"Neural shared features create another kind of coupling. Before naming a multi-label neural objective, trace how losses from several outputs reach the same hidden coordinate."}</Prose>

<JoinedSharedPullbackFigure />

<Prose>{"Shared hidden vector h=[1,2] feeds W rows [1,0,−1] and [0,1,1], bias 0, giving logits [1,2,1]. With truth [1,0,1] and mean over three BCE terms, δ=(σ(z)−y)/3≈[−.089647,.293599,−.089647]. The hidden pullback is δWᵀ: coordinate 1 gets δ_A−δ_C=0, coordinate 2 gets δ_B+δ_C≈.203952. Change C's truth bit to 0 and both hidden contributions change: approximately [−.333333,.537285]. Several separately named output losses reach shared parameters even though the sigmoid sockets do not form one softmax."}</Prose>

<Prose>{""}<code>{"shared_output_pullback"}</code>{" in the observed-head program implements the actual forward values and mean-cell pullback with NumPy and an ordinary functional "}<code>{"expit"}</code>{" reference. Its normalization differs from the summed-label observed means in section 4; the picture names the divisor 3. "}<a href={"/learn/topic/backpropagation-automatic-differentiation"}>{"Backpropagation & Automatic Differentiation"}</a>{" supplies full parameter training. BP-MLL's relevant–irrelevant objective connects to section 10's pair differences; a joined BCE pullback is not presented as a reproduced BP-MLL fit or full original-paper experiment."}</Prose>

<MultiLabelProgramSource context={contexts[35]} />

<Prose>{"A probabilistic numerical model can share outputs through covariance rather than support or hidden features."}</Prose>

<OutputCovarianceFigure />

<Prose>{"Input covariance K=[[1,.8],[.8,1]] and output covariance B=[[1,ρ],[ρ,1]] produce point-major K⊗B on coordinates (x0,A),(x0,B),(x1,A),(x1,B). Follow each 2×2 block: same-input cross-output covariance is ρ, cross-input cross-output covariance is .8ρ. At ρ=.5, observing noiseless value 1 at (x0,A) yields conditional mean .4 at (x1,B), and variance 1−.4²=.84. Negative ρ changes the mean's sign; B=I removes this cross-output covariance. These are actual covariance entries and conditional operations, not a correlation-shaped decoration."}</Prose>

<Prose>{"B has eigenvalues 1±ρ, so |ρ|≤1 is needed for positive semidefiniteness. Endpoint semidefinite matrices do not authorize arbitrary inversion. Our one-observation conditioning divides only by its explicitly positive observed marginal variance. "}<code>{"output_kernel"}</code>{" validates symmetric PSD operands and point-major labels; "}<code>{"condition_one"}</code>{" implements μ=cross/variance×observed_value and Σ_cond=Σ−cross·crossᵀ/variance. Full multi-observation solves or operator-valued kernel fitting need additional assumptions and code beyond this bounded mechanism."}</Prose>

<Prose>{"The inspected ordinary "}<code>{"GaussianProcessRegressor"}</code>{" multi-target API uses a shared scalar input kernel with independent output covariance slices; supplying two target columns does not inject this arbitrary B. The "}<a href={"/learn/topic/gaussian-processes-regression-classification"}>{"Gaussian Processes lesson"}</a>{" provides the output-index kernel connection. Here the local constructor and conditional result are complete before that extension, and a nonzero cross-covariance is not itself evidence of improved prediction."}</Prose>

<MultiLabelProgramSource context={contexts[36]} />

<span id="13-run-a-complete-held-out-report" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"16. Produce one honest real-data report and retain the text case"}</H2>

<Prose>{"Hand mechanisms tell us what a model computes. A held-out dataset tells us how that declared recipe behaves under a specific transfer question. Which parts of a building configuration should the model see before predicting its two loads?"}</Prose>

<EnergyConfigurationFigure />

<Prose>{""}<a href={"https://archive.ics.uci.edu/dataset/242/energy%2Befficiency"}>{"UCI Energy Efficiency"}</a>{", contributed by Tsanas and Xifara in 2012, supplies 768 Ecotect simulation configurations and two numerical targets. X1 is relative compactness, X2 surface area, X3 wall area, X4 roof area, X5 height, X6 orientation, X7 glazing area and X8 glazing distribution. Heating/Y1 stays amber and Cooling/Y2 blue. The envelope, orientation arrow and window ports explain these metadata; the drawing does not reconstruct a physical building from an invented two-dimensional geometry."}</Prose>

<Prose>{"The official metadata's unit fields are blank, so the report uses "}<strong>{"supplied heating/cooling load units"}</strong>{". The rows are simulation configurations, not independent field residents or sensor-meter samples. "}<a href={"https://doi.org/10.1016/j.enbuild.2012.03.003"}>{"Tsanas and Xifara's article"}</a>{" describes the original scientific problem; its published performance is not our reproduced result. The dataset is CC BY 4.0 with attribution. The supplied CSV preserves the exact finite worksheet values; its provenance identifies the source ZIP/XLSX, worksheet, source row IDs and removal of only entirely blank trailing rows/columns and empty sheets."}</Prose>

<EnergyGeometrySplitFigure />

<Prose>{"Geometry tuple (X1…X5) has twelve distinct values, each with 64 source rows. Sort those tuples lexicographically into G00…G11. Training uses [0,2,3,4,6,7,9,11], validation [1,8] and test [5,10]:512/128/128 rows. The other orientations/glazing settings of a held geometry do not sneak into training. The question is transfer to held geometries "}<strong>{"within this simulation regime"}</strong>{", not transfer to new weather, materials or actual metering. Select a group to inspect its actual original rows; no random re-split control changes this experiment."}</Prose>

<Prose>{"The parser requires the declared ten-column finite schema, category codes orientation 2/3/4/5 and distribution 0…5, exact geometry support and no target/input column duplication. It audits duplicate rows and target ranges without discarding inconvenient observations. Numerical inputs X1–5/X7 pass through unchanged into feature assembly; X6/X8 use fixed-vocabulary dense one-hot encoding with unknown categories rejected. Every candidate fits a new training-only encoder. Linear/group models additionally scale the assembled input features; forests use unscaled encoded inputs. Every candidate standardizes its two training targets and inverts predictions before reporting."}</Prose>

<Prose>{"Raw training target standard deviations are [10.8689724815,10.3022602180]. The combined validation objective is mean_j RMSE_j/s_j, with those frozen training scales. A nonpositive or nonfinite scale would block this particular protocol. The mean baseline predicts the two raw training means. It is distinct from every fitted candidate and remains part of the comparison."}</Prose>

<EnergyValidationLockFigure />

<Prose>{"The candidate table fixes all twelve settings before fitting. R1/R2/R3 are independent Ridge columns with α=.1/1/10 and solver "}<code>{"svd"}</code>{". S1/S2/S3 are shared-output random forests with minimum leaf 1/4/12. I1/I2/I3 use separate forests via "}<code>{"MultiOutputRegressor"}</code>{" with the same leaf settings. All forests have 300 trees, unrestricted depth, all features eligible per split, bootstrap sampling, minimum split 2, "}<code>{"random_state=19"}</code>{" and "}<code>{"n_jobs=1"}</code>{". G1/G2/G3 use "}<code>{"MultiTaskLasso"}</code>{" α=.01/.1/1, cyclic coordinate selection, tolerance 10⁻⁸ and cap 20000. These are four specific coupling contracts; a matrix Ridge call remains separable."}</Prose>

<MultiLabelProgramSource context={contexts[37]} />

<Prose>{"The portable "}<code>{"energy_multioutput_core.py"}</code>{" supplies "}<code>{"estimator"}</code>{", which composes an ordinary "}<code>{"ColumnTransformer"}</code>{", optional "}<code>{"StandardScaler"}</code>{", base estimator and "}<code>{"TransformedTargetRegressor"}</code>{". "}<code>{"error_report"}</code>{" returns both raw output RMSE/MAE, the dimensionless mean and group-wise residual summaries. Shared-row fits retain convergence warnings, iteration counts, dual gap and the declared objective check. A failed candidate remains an outcome with its cause; the program does not try another preferred fit until one wins."}</Prose>

<MultiLabelProgramSource context={contexts[38]} />

<Prose>{"Choose the global minimum validation score in each eligible selection set first, then the earliest table-order ID whose score is within absolute 10⁻¹² of that minimum. This minimum-first rule avoids a drifting chain of pairwise near-ties. Freeze the overall fitted candidate, each of four family winners, and the strongest independent candidate from all six R/I candidates. A family with no valid candidate blocks the test report. The mean baseline can beat the best fitted candidate; that would be reported explicitly. Validation selection among R/I supplies a meaningful independent comparator rather than an intentionally weak one."}</Prose>

<EnergyFrozenTestFigure />

<Prose>{"After that immutable validation lock, report all candidates' descriptive test results without changing a selected ID, parameter, transform or split. There is no training+validation refit. The metric and selected-candidate controls inspect the saved per-output errors and locked roles. The strongest independent row, mean baseline, failed rows and sample/group counts remain visible alongside coupled candidates. A low test error for another row does not make it the validation-selected winner."}</Prose>

<Prose>{"The completed fixed comparison below rounds displayed errors to six decimal places. Every candidate is valid and emitted no warning. Raw RMSE/MAE remain in supplied heating/cooling load units; only the two combined columns divide by the frozen training standard deviations. The mean baseline is a separate thirteenth report row, not a thirteenth fitted candidate."}</Prose>

<NeuralTable caption={"16. Produce one honest real-data report and retain the text case"} headers={[<>{"Recipe"}</>,<>{"Validation Heating RMSE"}</>,<>{"Validation Cooling RMSE"}</>,<>{"Validation combined"}</>,<>{"Test Heating RMSE"}</>,<>{"Test Cooling RMSE"}</>,<>{"Test combined"}</>,<>{"Locked role"}</>]} rows={[[<>{"R1"}</>,<>{"6.170138"}</>,<>{"6.540458"}</>,<>{"0.601270"}</>,<>{"1.623205"}</>,<>{"2.030487"}</>,<>{"0.173217"}</>,<>{"Unselected"}</>],[<>{"R2"}</>,<>{"6.052515"}</>,<>{"6.397514"}</>,<>{"0.588922"}</>,<>{"1.672395"}</>,<>{"2.057911"}</>,<>{"0.176811"}</>,<>{"Unselected"}</>],[<>{"R3"}</>,<>{"5.232803"}</>,<>{"5.515026"}</>,<>{"0.508383"}</>,<>{"1.712937"}</>,<>{"2.060046"}</>,<>{"0.178780"}</>,<>{"R family"}</>],[<>{"S1"}</>,<>{"4.944657"}</>,<>{"5.286681"}</>,<>{"0.484045"}</>,<>{"9.944048"}</>,<>{"9.453105"}</>,<>{"0.916239"}</>,<>{"Unselected"}</>],[<>{"S2"}</>,<>{"4.841239"}</>,<>{"5.271282"}</>,<>{"0.478540"}</>,<>{"9.772437"}</>,<>{"9.367920"}</>,<>{"0.904210"}</>,<>{"S family"}</>],[<>{"S3"}</>,<>{"4.947310"}</>,<>{"5.287823"}</>,<>{"0.484223"}</>,<>{"9.948256"}</>,<>{"9.465176"}</>,<>{"0.917019"}</>,<>{"Unselected"}</>],[<>{"I1"}</>,<>{"4.561078"}</>,<>{"6.026999"}</>,<>{"0.502330"}</>,<>{"8.512216"}</>,<>{"9.517260"}</>,<>{"0.853485"}</>,<>{"Unselected"}</>],[<>{"I2"}</>,<>{"4.488988"}</>,<>{"5.936031"}</>,<>{"0.494598"}</>,<>{"8.504204"}</>,<>{"9.525014"}</>,<>{"0.853493"}</>,<>{"I family; strongest validation-selected independent"}</>],[<>{"I3"}</>,<>{"4.797559"}</>,<>{"6.194194"}</>,<>{"0.521323"}</>,<>{"8.831856"}</>,<>{"9.588333"}</>,<>{"0.871638"}</>,<>{"Unselected"}</>],[<>{"G1"}</>,<>{"5.849496"}</>,<>{"5.901050"}</>,<>{"0.555487"}</>,<>{"1.846383"}</>,<>{"2.288049"}</>,<>{"0.195984"}</>,<>{"Unselected"}</>],[<>{"G2"}</>,<>{"4.336582"}</>,<>{"4.402579"}</>,<>{"0.413164"}</>,<>{"1.643396"}</>,<>{"1.950524"}</>,<>{"0.170265"}</>,<>{"Unselected"}</>],[<>{"G3"}</>,<>{"3.901285"}</>,<>{"2.856064"}</>,<>{"0.318082"}</>,<>{"8.358228"}</>,<>{"7.881490"}</>,<>{"0.767012"}</>,<>{"Overall; G family"}</>],[<>{"dummy"}</>,<>{"5.486086"}</>,<>{"4.491020"}</>,<>{"0.470337"}</>,<>{"10.422045"}</>,<>{"9.889214"}</>,<>{"0.959394"}</>,<>{"Mean baseline"}</>]]} />

<NeuralTable caption={"16. Produce one honest real-data report and retain the text case"} headers={[<>{"Recipe"}</>,<>{"Validation Heating MAE"}</>,<>{"Validation Cooling MAE"}</>,<>{"Test Heating MAE"}</>,<>{"Test Cooling MAE"}</>]} rows={[[<>{"R1"}</>,<>{"5.485628"}</>,<>{"6.195791"}</>,<>{"1.424748"}</>,<>{"1.411260"}</>],[<>{"R2"}</>,<>{"5.360749"}</>,<>{"6.042864"}</>,<>{"1.481165"}</>,<>{"1.497044"}</>],[<>{"R3"}</>,<>{"4.598695"}</>,<>{"5.187732"}</>,<>{"1.506374"}</>,<>{"1.668559"}</>],[<>{"S1"}</>,<>{"4.704005"}</>,<>{"5.203068"}</>,<>{"8.480469"}</>,<>{"8.105092"}</>],[<>{"S2"}</>,<>{"4.609130"}</>,<>{"5.101262"}</>,<>{"8.343950"}</>,<>{"8.017825"}</>],[<>{"S3"}</>,<>{"4.558311"}</>,<>{"5.077304"}</>,<>{"8.650426"}</>,<>{"8.159780"}</>],[<>{"I1"}</>,<>{"4.382851"}</>,<>{"5.854245"}</>,<>{"7.439253"}</>,<>{"8.180113"}</>],[<>{"I2"}</>,<>{"4.312843"}</>,<>{"5.715599"}</>,<>{"7.441375"}</>,<>{"8.139829"}</>],[<>{"I3"}</>,<>{"4.445314"}</>,<>{"5.899631"}</>,<>{"7.830177"}</>,<>{"8.264083"}</>],[<>{"G1"}</>,<>{"5.110817"}</>,<>{"5.508381"}</>,<>{"1.664840"}</>,<>{"1.911266"}</>],[<>{"G2"}</>,<>{"3.748310"}</>,<>{"4.117390"}</>,<>{"1.189122"}</>,<>{"1.411456"}</>],[<>{"G3"}</>,<>{"3.195781"}</>,<>{"2.388033"}</>,<>{"7.928273"}</>,<>{"7.444650"}</>],[<>{"dummy"}</>,<>{"4.841563"}</>,<>{"4.029303"}</>,<>{"10.000938"}</>,<>{"9.505469"}</>]]} />

<Prose>{"Validation selects G3 at .318082, with I2 at .494598 as the strongest validation-selected independent comparator; the mean baseline is .470337. G3's descriptive test combined error is .767012, I2's .853493 and the mean baseline's .959394. On that fixed comparison G3 is lower than I2 and the baseline, but it is far from a general coupling guarantee. Unselected G2 has test .170265 and R1 .173217; these much smaller errors stay descriptive. Switching to either after viewing them would replace the declared validation selection with test selection."}</Prose>

<Prose>{"The group summaries locate the problem. G3's mean prediction-minus-truth residuals on G05 are [8.652450,7.849858] and on G10 [−6.668052,−6.938686]. I2's are [11.499037,12.842280] and [−3.383714,−3.426088]. A pooled RMSE alone hides opposite-signed geometry errors. There are only twelve geometry groups, two in each held partition. This split can favor a heavily shrunk model on its validation geometries while that same model makes larger errors on different test geometries. Inspect these actual conditions before transferring a recipe to a new design task; neither a source paper's benchmark nor one locked comparison establishes broad building-performance accuracy."}</Prose>

<Prose>{"G1/G2/G3 converge in 145/20/5 iterations, with dual gaps about 9.065×10⁻⁹,1.975×10⁻¹⁰ and 1.110×10⁻¹⁶, below the declared 2×10⁻⁸ bound. Their objectives are .079702,.251251,.958315. The strongest penalty has the largest penalized objective but the smallest validation prediction error here: objectives with different α include different penalty terms and are not directly the selection metric. Full warnings/statuses and every train/validation/test prediction remain available with the report."}</Prose>

<EnergySavedForwardFigure />

<Prose>{"Inspect an original test row through the actual locked fitted encoder and target inverse mapping. A linear/group model exposes every encoded feature's coefficient contribution and intercept. A forest exposes one member's real split path and its scalar or vector leaf, then the 300-member mean. All eight original input coordinates participate even if a drawing shows only a few at once. Tree input comparisons cast encoded inputs to float32 before comparing to saved thresholds; that convention is preserved in reconstruction. The truth and residual belong after prediction, outside its feature route."}</Prose>

<Prose>{""}<code>{"serialize_model"}</code>{" saves full encoder/scaler and fitted linear matrices or tree children/features/thresholds/vector leaves. "}<code>{"predict_saved"}</code>{" reconstructs the same frozen model's predictions on every source row before the fitted estimator is discarded, with no refit. A model used for multiple locked roles is saved once and referenced by ID. The program also retains all candidate predictions, warnings, errors, lock and source identities. This makes the inspector actual saved inference, rather than a hand tree masquerading as the chosen model."}</Prose>

<Prose>{"The default inspector is original CSV row 4 (zero-based), worksheet row 6, geometry G10. Its X1…X8 values are [.9,563.5,318.5,122.5,7,2,0,0]. The encoder creates six numeric features plus four orientation and six glazing-distribution indicators, for sixteen explicit columns. G3 has only one nonzero shared coefficient row: X5, height. Its training height mean/scale are 5.25/1.75, so this row's height 7 becomes 1. The standardized Heating/Cooling coefficients are [.203408608,.204925592], with intercepts numerically zero. Inverting the two training-target scales/means gives prediction [24.960854,26.882095], against truth [20.84,28.28], hence prediction-minus-truth residual [4.120854,−1.397905]. The other fifteen encoded columns are still shown and routed; their fitted coefficients are zero rather than missing or unscored. This actual sparse shared row explains the heavy shrinkage rather than hiding it behind a model name."}</Prose>

<Prose>{"For a different saved model shape, inspect S2's actual member 0 on that same source row. The encoded path tests surface area 563.5≤686 (left), wall area 318.5≤318.5 (left), glazing area 0≤.17500000074505806 (left), then the glazing-distribution-0 indicator 1≤.5 (false, right). It reaches leaf node 11 with standardized vector [−.538383770,−.078710731], which in raw units is [16.898333,23.960000]. A single member's leaf is not the forest prediction: S2 averages all 300 members to [18.453863,23.917379] on this row. The equality at the wall-area threshold takes the documented left branch; inputs are float32 values compared to double-precision thresholds. The numerical state contains every member, so changing the inspected member reveals its real path without changing the selected model or averaging boundary."}</Prose>

<Prose>{"The complete numerical-state reconstruction already agrees with the same frozen estimators on all 768 source rows for G3, I2, R3 and S2, with maximum absolute difference 0 in this recorded environment. That checks source-state correspondence, not improved generalization. Full data, predictions, fitted numerical state and the validation lock identify the fixed report a learner can inspect."}</Prose>

<Prose>{"The ordinary learner entry is "}<code>{"energy-multioutput-learning.py"}</code>{", with "}<code>{"energy_multioutput_core.py"}</code>{" beside it. The core contains the same complete preprocessing, estimator, metric, selection and saved-array operations; it imports no campaign entry point. Download the five Energy data files and "}<code>{"energy-recorded-assets.json"}</code>{" into that same directory, as enumerated in "}<code>{"MULTIOUTPUT-SETUP.md"}</code>{". These listed files are the complete input set for report/query; those operations neither fit nor write recorded data. "}<code>{"load_bundle"}</code>{" verifies those files before "}<code>{"saved_report"}</code>{" returns every recorded outcome and the fixed selected roles. "}<code>{"query_saved"}</code>{" resolves a saved model/role, assembles one X1…X8 row and calls the complete saved encoder/base/target-inverse route without fitting or selecting anything."}</Prose>

<CodeBlock language={"sh"}>{"python energy-multioutput-learning.py --report\npython energy-multioutput-learning.py --query --model overall --row 4\npython energy-multioutput-learning.py --query --model S2 --features .9,563.5,318.5,122.5,7,2,0,0"}</CodeBlock>

<Prose>{"The first query prints G3 with Heating/Cooling approximately [24.960854,26.882095]; the S2 query prints [18.453863,23.917379]. These are saved-model operations on the same named row, not new experimental outcomes. Changing "}<code>{"--features"}</code>{" asks for a new computational query with finite numeric coordinates and supported orientation/distribution codes. It does not turn an implausible input into a measured building or change the original validation winner."}</Prose>

<Prose>{"For fitting practice, the two supplied "}<code>{"own-multioutput-example.csv"}</code>{" and "}<code>{"own-multioutput-task.json"}</code>{" files define a "}<strong>{"different constructed task"}</strong>{": twelve invented rows, six two-row groups, train 8/validation 2/test 2, and the declared R1/R2/R3 Ridge strengths. The affine toy outputs expose the workflow and have no physical-load interpretation. "}<code>{"declared_task"}</code>{" verifies the CSV identity, complete disjoint row ownership, whole geometry groups, positive training target scales and candidate order before "}<code>{"fit_own"}</code>{" can fit. Each candidate uses the ordinary pipeline just explained. Failed validation outcomes stay recorded; "}<code>{"choose"}</code>{" applies the minimum-first tie band, then an exclusive lock is written before any test error. The saved winning state retains those same training-only transforms and is not refitted on validation rows."}</Prose>

<CodeBlock language={"sh"}>{"python energy-multioutput-learning.py --fit-own own-multioutput-task.json --output own-results"}</CodeBlock>

<Prose>{"The output directory must be new. This complete independent recipe is supplied for the learner to run; no fitted outputs for the invented fixture are claimed here. A different data source, split or candidate order needs its own declaration and new output directory. "}<code>{"--fit-own"}</code>{" rejects the recorded Energy CSV, while report/query remain read-only. The complete archival "}<code>{"energy-multioutput-study.py"}</code>{" preserves the original once-only preparation and recording protocol; the ordinary entry does not call its guarded campaign main."}</Prose>

<MultiLabelProgramSource context={contexts[39]} />

<MultiLabelProgramSource context={contexts[40]} />

<Prose>{"Text decisions ask a different question, so the earlier text case remains a separate experiment rather than being merged into load errors."}</Prose>

<RecordedTextInventoryFigure />

<Prose>{"Its 32 constructed repair messages form 16 two-paraphrase groups and the fixed 16/8/8 partition. Three model families crossed with five thresholds create 15 declared choices. The recorded selected result is chain order 012 at cutoff .6, validation micro F1=10/11≈.909091. Its frozen test gives the same micro F1, exact-set accuracy 7/8 and Hamming 2/24; all three test label supports are 4. The candidate and threshold controls inspect the declared recipe inventory. The retained output supplies no per-choice score table or fitted text-vectorizer state, so other inventory cells explicitly show “score not recorded”; they cannot supply changed predictions or a new winner. A training-only token/bigram construction separately illustrates which terms can enter the vocabulary: it is derived from the literal training messages, not a recovered fitted TF–IDF state or fitted coefficient route. The two recorded selected reports and their actual test prediction rows remain available. Small, purpose-written messages expose information boundaries but do not establish quality on a collected repair corpus."}</Prose>

<MultiLabelProgramSource context={contexts[41]} />

<RecordedTextCostFigure />

<Prose>{"The separate changed cost report minimizes validation FP+3FN over the same stated candidate order/cutoffs. It selects the independent family at .5 with validation cost 3; its frozen test cost is 0 over 24 label decisions and micro F1=1. Those are recorded measured outcomes of the two constructed reports, not interpolated experiments for every cost setting. The changed objective can select a different family; the mechanism follows which counted errors are expensive, not a universal advantage of chains or independence."}</Prose>

<MultiLabelProgramSource context={contexts[42]} />

<Prose>{"To transfer the workflow, name the output schema/units, legal information boundary and loss first. Compare a simple mean or prevalence baseline, a strong separate predictor and each precisely defined coupling. Keep every fixed candidate outcome, select with development rows and make one honest frozen report. Then diagnose where errors occur—geometry group, output, support or labelset—without relabelling test diagnostics as untouched evidence for another selection."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><span id="14-practise-explain-and-transfer" className="mlf-legacy-anchor" aria-hidden="true" />
<H2>{"17. Practise on a changed observation, loss and coupling"}</H2>

<Prose>{"Each task changes a condition rather than asking you to repeat a guided slider trace. Attempt its question before opening the hint or solution. Teaching and code above remain visible; only the independent attempts use disclosures."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"A. Repair an annotation and a split"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Each repair case has two messages. A reviewer marks only code tags; unreviewed hardware/energy cells are filled with 0. Paraphrases cross a random train/test split. Name the two separate errors and propose a first baseline."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" One error changes target meaning; the other changes what the test can establish."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Unreviewed answers stay unknown, represented by a mask or per-label reviewed subsets. Filling zeros invents negative evidence. Both messages from one case belong to one split; use time boundaries as well if predicting future cases. Fit train-only code prevalence and an independent code model on the supported task. Hardware/energy evaluation is unavailable without known answers. Masking alone does not establish that reviewed cases represent the population."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"B. Recompute a changed error table"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Truth is [[1,0],[0,1],[1,1]], prediction [[1,1],[0,0],[1,1]]. Compute TP/FP/FN, Hamming loss, exact-set accuracy and micro F1. Then mark the second row's second annotation unknown."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Begin with six cells; after masking there are five known cells and two complete rows."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Initially TP=3,FP=1,FN=1,TN=1. Hamming is 2/6=1/3, exact-set accuracy 1/3 and micro F1=6/(6+1+1)=3/4. The unknown cell removes the missed positive: TP=3,FP=1,FN=0; observed Hamming 1/5 and micro F1=6/7. Complete rows 1 and 3 yield exact-set accuracy 1/2. The apparent improvement removed an error from observation; predictions did not change."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"C. Change the four probability masses"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Counts of 00,01,10,11 are [4,1,2,3] out of 10. Find marginal threshold action, joint mode and greedy answer in both orders. Select 1 at a .5 binary tie."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Marginals are .5 and .4; condition only after the first bit is fixed."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Marginal thresholding gives 10; the joint mode is 00 with mass .4. Greedy AB chooses A=1 at its tie, then B=1 because 3/(2+3)=.6, giving 11. Greedy BA chooses B=0 then A=0 because 2/(4+2)=1/3, giving 00. Both A values minimize its marginal error at the tie: 00 and 10 both have Hamming risk .45 per label. The convention selects one optimal action without implying a unique optimum."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"D. A chain path is not a marginal"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" P(A=1|x)=.4, P(B=1|A=0,x)=.2 and P(B=1|A=1,x)=.9. Find B's hard-path score, marginal and all four joint masses."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Greedy A is 0; a marginal averages both histories by their mass."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Path score is .2. Marginal is .6×.2+.4×.9=.48. Masses 00/01/10/11 are .48,.12,.04,.36, summing to 1. Feeding a continuous prior probability onward instead of a hard history creates a different feature recipe, which must be described before interpreting its score."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"E. A different mixture"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" High context now has weight .25; within low/high contexts both labels are independent with positive probabilities .1/.9. Compute pooled P(A=1), P(A=1,B=1), P(B=1|A=1). Does association establish causation?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Weight each independent table by .75 or .25 before taking a conditional ratio."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Marginal is .75×.1+.25×.9=.3. Joint-positive mass is .75×.01+.25×.81=.21. Conditional is .21/.3=.7, exceeding B's pooled marginal .3. Within either observed context the labels remain independent. Neither the association nor an arbitrary chain order establishes a causal effect."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"F. A threshold cannot break a score tie"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Scores [.8,.8,.2], truth [1,0,1]. Compute F1 at cutoffs .2,.8,.81 with ≥. Can one cutoff select only the first .8 observation?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Equal-score groups move together. Use zero_division=0 for no predicted positives."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" At .2, TP=2,FP=1,FN=0 and F1=4/5. At .8, TP=1,FP=1,FN=1 and F1=1/2. At .81 nothing is selected, so F1=0. A scalar cutoff cannot distinguish the equal scores. A feature-based or randomized tie-break changes the procedure and needs its own justification/validation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"G. Recover score meaning before applying cost"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" True p=.2; training uses positive weight 4 and negative weight 1. Find the ideal weighted score. Deployment FN costs 3 and FP costs 1. Decide using original p."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Weighted q has a different event scale; original-probability cutoff is 1/4."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" q=.8/(.8+.8)=.5. Cost cutoff is .25, so p=.2 chooses 0: expected cost 3×.2=.6 versus 1×.8=.8 for choosing 1. Treating q as original p would reverse the comparison. The ideal mapping can be inverted under its assumptions; finite fitted score meaning still requires verification."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"H. An absent class and a vote denominator"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Powerset vocabulary {000,101,010}: can it decode 111? Separately, AB votes 10, BC 11, AC 01. What does overlapping voting produce with positive ties?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Powerset chooses an available category. Coverage counts only members containing a label."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Plain powerset cannot emit 111. Votes are A=1/2,B=1/2,C=2/2, so the stated positive-tie rule gives 111. These are different hypothesis spaces. The new strict-majority RAkEL route would produce 001 instead; this task retains its explicitly positive toy tie. Voting still does not enforce a domain constraint that could forbid 111."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"I. Change the measurement units"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Divide the four-row energy target by 10 instead of 100. Which shared cut wins? Do separate optimal cuts depend on positive rescaling?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Raw energy SSE at cuts .5/1.5/2.5 is 0/5000/(20000/3). Divide by 100 after squaring."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Combined losses are 8/3,50,8/3+200/3=208/3, so .5 wins. Temperature SSE at the last cut is 8/3. Separately, positive rescaling multiplies every candidate's output loss by the same positive constant, preserving its minimizing cuts and ties. A joint split responds to "}<strong>{"relative"}</strong>{" scales."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"J. A different grouped feature"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" In an orthonormal design, one feature's unpenalized row is (−3,4), λ=1. Find grouped and separate solutions. Why does the formula not solve arbitrary correlated X?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Norm is 5; grouped shrink is radial, separate shrink subtracts 1 from each absolute coordinate."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Grouped factor .8 gives (−2.4,3.2); separate thresholds give (−2,3). The closed form used XᵀX/n=I. Correlated columns introduce cross terms between feature rows, so one shrink of arbitrary least-squares coefficients generally fails the full optimality conditions. Use the proximal iterations derived in section 13."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"K. Sparse observations versus a sparse mean"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Exactly one of ten labels is chosen uniformly independently of X. Are observed rows sparse? Is the conditional mean sparse? What does high retained reconstruction energy fail to guarantee?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Write all ten marginal probabilities before considering a recovery assumption."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Every sample has one nonzero, while the conditional mean has ten nonzeros, all .1. Sparse conditional-mean recovery does not follow from sparse samples. High retained energy also does not guarantee rare-label recall; report the decisions and support required by the task."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"L. Change a cost and submit a frozen report"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" On the grouped text corpus, minimize validation FP+3FN with fixed candidate order/cutoffs. Must its selected family stay the same? Report frozen test cost, denominator and a limitation."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Choose only on validation, using the first minimum for ties, before consulting test truth."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" The complete "}<code>{"changedReport.py"}</code>{" chooses independent/.5 with validation cost 3, while the original micro-F1 objective chose chain 012/.6. Its frozen test cost is 0 over 24 label decisions and micro F1=1. The denominator is 8 messages×3 labels. Two paraphrases per group stay together, but the 32-message constructed corpus is small and does not establish broad repair-message performance. The two reports answer different fixed objectives. Their full arrays show why changing the validation loss can change the selected recipe; choosing a story after consulting test errors would invalidate that comparison."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"M. Mask and fit support"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" X rows are 0,1,2,3. A is observed positive only on rows 0 and 2; its other cells are unknown. Every B cell is unknown. What can the supported fit do? If A's known row 2 bit instead becomes 0, compute the zero-weight mean-loss gradient with a leading intercept. Which evaluation denominators exist?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Unknowns do not become zeros; a supported constant policy differs from a both-class Newton fit."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" n_A=2,n_B=0. A can use the explicit known-positive constant baseline; without negative support the declared logistic fitting route is not used. B has no supervised fit/evaluation. Original A evaluation uses two known cells; there is no fully observed A/B row for exact-vector evaluation. With changed observed A truth [1,0] and design [[1,0],[1,2]], zero weights yield p=[.5,.5], residual [−.5,.5], gradient [0,.5]. Slope penalty contributes 0 at these weights. The changed two-class A fit is supported. Neither case establishes population prevalence without an annotation-process assumption."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"N. Rank ties after a changed score"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" One row has truth [0,1,0,1], scores [.9,.6,.6,.2]. Compute ranking loss/LRAP/coverage, then change D's score to .6. Add a second empty-truth row with scores [.8,.7,.4,.1]. Does mean row AP equal macro label AP?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" A positive–negative tie loses its pair; LRAP uses maximal tied ranks. AP over columns ranks observations."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Initially B>A is wrong, B=C tied wrong, D>A wrong, D<C wrong: 4/4 ranking loss 1. LRAP for B is 1/3, for D 2/4, mean 5/12; coverage 4. After D=.6, all four pairs are still wrong/tied, so ranking loss 1. Both relevant labels have 2/4 relevant items at least as high, LRAP .5 and coverage 4. The empty row has ranking loss 0, LRAP 1, coverage 0 under the stated API convention. For the initial two-row scores, row AP is (1/3+2/4)/2=5/12 then 0, so samples AP 5/24. Column AP is 0 for A/C, 1/2 for B because its negative observation outranks its positive, and 1 for D because its positive score .2 exceeds the negative .1. Macro AP is (0+.5+0+1)/4=3/8, different from 5/24. The axis, not just the formula's name, determines the result."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"O. Learn a changed count posterior"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Positions 0,1,2,5,6,7 have one label's bits [1,0,1,0,0,1]. Use k=2, self exclusion by row ID, s=1. Derive both count histograms, prior and the posterior for query 1.2. Compare raw voting and explain self inclusion's error."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Each three-point cluster supplies the other two points as training neighbours. The query chooses positions 1 and 2."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Own-positive rows at 0/2/7 have counts 1/1/0, so positive histogram [1,2,0]. Own-negative rows at 1/5/6 have counts 2/1/1, so negative histogram [0,2,1]. Priors are .5/.5. Query count 1 gives likelihood 3/6 in both classes, equal numerators .25, total .5, posterior .5 and positive under ≥.5. Raw neighbour mean is also .5 here but is computed differently. At changed query 5.2, the neighbours are 5 and 6, count 0: positive likelihood 2/6, negative 1/6, posterior 2/3 despite raw vote 0. Self inclusion would change the training count feature and its learned histograms, so it would fit a different, answer-contaminated count model."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"P. Choose an F1 set, not just a threshold"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" Three-label law has P(000)=.2,P(100)=.3,P(011)=.5 and all other masses 0. Empty/empty payoff is 1. Find all fixed-size gains, the best expected-instance-F1 action and compare all eight action rewards."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" A occurs only at truth size 1; B/C occur together at size 2."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" For k=1, gains are [.3,1/3,1/3], best B or C reward 1/3. For k=2, gains [.2,.25,.25], best BC reward .5. For k=3, gains [.15,.2,.2], total .55, so ABC wins. Empty reward is .2. Every action reward in 000…111 order is [.2,1/3,1/3,.5,.3,.45,.45,.55]. For ABC, the 100 outcome contributes .3×(2/4)=.15 and 011 contributes .5×(4/5)=.4. Marginal thresholding chooses BC if .5 ties are positive and gives reward .5, which is lower. This explicitly optimizes instance F1 under the supplied law, not pooled micro F1 for arbitrary batches."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Q. Distinguish a proximal step and a rank fit"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" X=Y=[[1,0],[1,1],[0,1]], W=0, α=.3,η=.25. Compute one proximal step and explain why shrinking the OLS matrix I once is not generally optimal. Then use section 14's X with changed first target [−3,3,0,0] and second [8,8,−9,−7]. Compare rank 1 fitted-response RRR, raw-target PCA→regression and full rank SSE."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Smooth gradient is still −XᵀX/3. Project the changed Y through Q before truncation."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Z=[[1/6,1/12],[1/12,1/6]], row norm √5/12. Threshold ηα=.075 and shrink factor 1−.9/√5≈.597508 give rows approximately [.099585,.049792] and [.049792,.099585]. A single proximal operation solves a local quadratic step, while correlated X's optimum must satisfy its actual composite stationarity condition. Shrinking I by .3 gives .7I. Its smooth gradient has diagonal −.2/offdiagonal −.1; the active-row penalty gradient contributes .3 on the row's diagonal direction, leaving diagonal +.1 and offdiagonal −.1. It is not stationary. For the changed rank example, Z diagonal is 3√2,√2; unfit second-output SSE is 256. Rank 1 RRR retains first direction and has SSE 258, full rank 256. Raw Y's second energy 258 exceeds first 18, so rank 1 PCA→regression captures only the second fitted direction, leaving first SSE 18 plus unfit 256=274. The same decomposition explains the gap without an additional fitted campaign."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"R. Audit a changed real-study proposal"}</H3>

<Prose>{""}<strong>{"Question."}</strong>{" A proposal rescales targets using all 768 rows, puts another orientation of a training geometry into test, and picks a coupling method by test RMSE. Repair all three boundaries and describe a frozen strongest-independent comparison."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{""}<strong>{"Hint."}</strong>{" Follow each information path: transform, membership, selection."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{""}<strong>{"Solution."}</strong>{" Fit every target transform on training Y only and retain its inverse/raw-unit errors; all-row scaling lets held labels influence the trained shared objective. Keep entire geometry tuples indivisible so an orientation of a training geometry cannot pose as held-geometry transfer. Fix all candidates/split/metric first, choose overall/family/best-R-or-I roles on validation, then retain one locked descriptive test report without refitting. Keep all failures and coupled/independent tradeoffs; do not compare against only a weak convenient separate setting. New weather/material data or a changed protocol would be a new study with separately declared inputs and evaluation, not a reason to replay this one until the conclusion changes."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"18. Carry the output contract into a time-to-event question"}</H2>

<Prose>{"Several output slots do not always mean several independent answer questions. The next topic supplies a particularly useful counterexample: follow-up time and whether an event was observed."}</Prose>

<CensoredOutputContractFigure />

<Prose>{"One person has an observed event at time 4, recorded (4,1). Another is followed until time 4 without an observed event, recorded (4,0); their timeline continues into an unknown future. That zero is a "}<strong>{"censoring indicator"}</strong>{", not an ordinary negative multilabel target saying the event never happens. The observed time is an event time in the first row and a lower bound on an unobserved event time in the second. Treating both as identical regression answers or ordinary binary negatives would change their meaning."}</Prose>

<Prose>{""}<a href={"/learn/topic/survival-analysis-cox-regression-kaplan-meier-hazard-models"}>{"Survival Analysis: Cox Regression, Kaplan–Meier & Hazard Models"}</a>{" develops the survival function, risk sets and censor-aware likelihood. Our timeline establishes why the output contract requires that new loss before the link asks for new mathematics. Keep the habit from this lesson: name what every slot means, what was observed, what the model is allowed to know and which loss turns its evidence into an action."}</Prose>

</section><section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<Prose>{"Further learning follows those concrete questions. "}<a href={"https://www.lamda.nju.edu.cn/publication/tkde13rev.pdf"}>{"Zhang and Zhou's multi-label survey"}</a>{" is a broad technical treatment of metrics, transformations and adaptation methods; start with its problem/metric definitions, then read the methods corresponding to our sections 7–10. Its normalization/convention choices differ in places from the explicit sklearn-compatible ones here, so compare definitions instead of transferring names blindly. "}<a href={"https://cig.fi.upm.es/wp-content/uploads/2022/03/Borchani-A-survey-on-multi-output-regression.pdf"}>{"Borchani et al.'s multi-output regression survey"}</a>{" organizes regression sharing and includes the reduced-rank derivation/R implementation; sections 12–14 prepare its matrix notation. Both are freely accessible author/institutional PDFs."}</Prose>

<Prose>{""}<a href={"https://jmread.github.io/talks/Tutorial-MLC-Porto.pdf"}>{"Jesse Read's Porto tutorial"}</a>{" provides an alternate visual route through label objects, chains and powerset projection. Use it to redraw a factor tree or compare a restricted representation, while checking its abbreviated metric illustrations against the definitions above. It is a slide resource, not an unseen video claim. "}<a href={"https://scikit-learn.org/stable/modules/multiclass.html"}>{"The official sklearn multiclass/multioutput guide"}</a>{" explains supported target types and estimator interfaces. Read it alongside the complete local ordinary routes; documentation alone does not substitute for the transformations and fitting code."}</Prose></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<Prose>{"Technical references connect specific mechanisms: "}<a href={"https://researchcommons.waikato.ac.nz/bitstreams/902d767f-054f-493f-83f2-21d048effe0a/download"}>{"Read et al., classifier chains"}</a>{" for ordered conditional features and hard-vote ensembles; "}<a href={"https://icml.cc/Conferences/2010/papers/589.pdf"}>{"Dembczyński, Cheng and Hüllermeier, probabilistic classifier chains"}</a>{" for complete-law rather than greedy decoding; "}<a href={"https://jmlr.org/papers/v15/waegeman14a.html"}>{"F-measure maximization"}</a>{" for loss-specific set-size gains; "}<a href={"https://arxiv.org/abs/0902.1283"}>{"compressed prediction"}</a>{" for measurement/recovery assumptions; "}<a href={"https://www.lamda.nju.edu.cn/publication/pr07.pdf"}>{"ML-kNN"}</a>{" for both neighbour-count likelihoods; and "}<a href={"https://www.mathematik.uni-marburg.de/~eyke/publications/ml08.pdf"}>{"calibrated label ranking"}</a>{" for discordant-pair training and the virtual cutoff. These primary author/institutional texts deepen the locally worked mechanisms. "}<a href={"https://www.researchgate.net/publication/220073602_Random_k-Labelsets_for_Multilabel_Classification"}>{"Random k-labelsets"}</a>{" explains overlapping local vocabularies and strict coverage-normalized voting; its author-upload access can vary. "}<a href={"https://www.csie.ntu.edu.tw/~htlin/paper/doc/wsmld10plst.pdf"}>{"PLST"}</a>{" uses an uncentered label-space convention, so compare that premise with our explicitly centered example before reusing its reconstruction. "}<a href={"https://arxiv.org/abs/1106.6251"}>{"Vector-valued kernels"}</a>{" develops the covariance block in section 15 beyond our single-observation conditional calculation. Historical paper benchmarks remain conditional on their own data and evaluation; they are not measurements of the present programs."}</Prose>

<Prose>{"The common file index supplies all complete contextual programs and three full local dependencies, the Energy CSV/provenance/results/model-state/lock, the recorded-asset manifest, setup and independent toy-task inputs, and recorded text outputs. Focused code comes from those exact complete files; Copy/Download supplies the complete named source, with dependencies listed separately. Use "}<code>{"energy-multioutput-learning.py"}</code>{" for the fully specified offline report/query and own-task commands above. Its "}<code>{"energy_multioutput_core.py"}</code>{" dependency is a complete ordinary-library/saved-array implementation. The archival "}<code>{"energy-multioutput-study.py"}</code>{" retains the separate once-only Energy recorder and is not that learner CLI. Run Python 3.12 with NumPy/SciPy/scikit-learn available; the recorded snapshots use NumPy 2.3.5 and scikit-learn 1.9.1. The archival workbook parser additionally imports openpyxl. Put "}<code>{"multioutput_newton.py"}</code>{" beside "}<code>{"masked-binary-heads.py"}</code>{" and "}<code>{"chain_core.py"}</code>{", and both existing dependencies beside "}<code>{"chain-fit-and-decode.py"}</code>{". Their imported operations are explicit and import-safe. "}<code>{"MULTIOUTPUT-SETUP.md"}</code>{" lists the complete eight-file Energy report/query directory and two additional own-task inputs. Copy feedback reports the actual source copy outcome; every source filename identifies the complete program explained at its place in the reading flow."}</Prose></section>
  </div></MultiLabelJointLawProvider>;
}
export default { title: 'Multi-Label & Multi-Output Learning', readTime: '~100 min read + 2–3 hours practice', hasIntegratedGuide: true, content: MultiLabelFoundationContent };
