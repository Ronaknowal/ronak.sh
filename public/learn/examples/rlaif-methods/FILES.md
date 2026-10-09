# RLAIF, IPO and ORPO file index

Download the [complete directory](rlaif-methods-programs.zip), then read the [setup README](README.md). All nine main programs are complete. Their shared dependencies and original data must stay alongside them.

| File | Purpose |
| --- | --- |
| [records_and_masks.py](records_and_masks.py) | Full released records, lexical vocabulary and aligned target masks |
| [judge_labels.py](judge_labels.py) | Actual pinned Flan complete-option inference and mapped order/rating scores |
| [feedback_learning.py](feedback_learning.py) | Soft-label reward-head fit and gradient audit |
| [rlaif_loop.py](rlaif_loop.py) | Two finite-action REINFORCE traces using detached rewards and fixed reference |
| [preference_losses.py](preference_losses.py) | IPO/ORPO loss, derivative, stability and shared-weight calculations |
| [finite_preferences.py](finite_preferences.py) | Published matrix, noisy-label optimum and missing-support calculation |
| [compare_training.py](compare_training.py) | All fifteen declared small language-model fits and paired evaluation |
| [trl_methods.py](trl_methods.py) | Actual native IPO/ORPO batch, loss, all-gradient and one-update contracts |
| [run_all.py](run_all.py) | Prospective preparation and transitive source/result-bound execution or reuse |
| [causal_backbone.py](causal_backbone.py) | Verbatim inspected causal-model dependency, attribution in provenance |
| [response_scores.py](response_scores.py) | Verbatim inspected response-score dependency |
| [records.json](records.json) | Complete original selected source rows, not substituted examples |
| [selection.json](selection.json) | Deterministic selection and exclusion audit |
| [provenance.json](provenance.json) | Source/data/dependency identities and reuse limits |
| [UltraFeedback-LICENSE.txt](UltraFeedback-LICENSE.txt) | Exact upstream MIT attribution and license |
| [requirements.txt](requirements.txt) | Pinned execution dependencies |
| [study-protocol.md](study-protocol.md) | Prospectively declared budgets, masks, schedules and interpretation limits |
| [README.md](README.md) | Local setup and complete reproduction commands |

## Retained actual observations

These files preserve the executed results exactly. The browser reads these observations; it does not fit a model. All three training seeds and terminal outcomes remain present. Weight files, environments, inference caches and generated trainer directories are excluded from this public bundle.

| Observation | Evidence |
| --- | --- |
| [records-results.json](observations/records-results.json) | Actual records stage output |
| [losses-results.json](observations/losses-results.json) | Actual losses stage output |
| [finite-results.json](observations/finite-results.json) | Actual finite stage output |
| [feedback-results.json](observations/feedback-results.json) | Actual feedback stage output |
| [loop-results.json](observations/loop-results.json) | Actual loop stage output |
| [judge-results.json](observations/judge-results.json) | Actual judge stage output |
| [training-results.json](observations/training-results.json) | Actual training stage output |
| [native-results.json](observations/native-results.json) | Actual native stage output |
| [execution-binding.json](observations/execution-binding.json) | Prospective freeze and source receipt/result hashes |

[download-manifest.json](download-manifest.json) gives payload hashes and byte lengths. If the archive download fails, use the links above to download the individual programs, dependencies and data files.
