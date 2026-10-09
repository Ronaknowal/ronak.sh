# Files and their roles

| File | Use |
|---|---|
| [verifier_contracts.py](/learn/examples/rlvr/verifier_contracts.py) | Numeric spans, restricted arithmetic AST and small formal proof checker. |
| [math_verify_bridge.py](/learn/examples/rlvr/math_verify_bridge.py) | Actual Math-Verify and TRL accuracy-reward contracts. |
| [group_gradients.py](/learn/examples/rlvr/group_gradients.py) | Finite objective, enumerated group gradients, signed clipping, KL routes and finite task scheduler. |
| [reward_noise.py](/learn/examples/rlvr/reward_noise.py) | Class-conditional error channel, oracle correction and literal correlated-test masks. |
| [tiny_causal_rlvr.py](/learn/examples/rlvr/tiny_causal_rlvr.py) | Complete custom causal warm-up, sampling, scoring, updates and evaluations. |
| [hf_eval_math.py](/learn/examples/rlvr/hf_eval_math.py) | Greedy cached Flan-T5-small predictions on the 12 untouched tasks. |
| [trl_bridge.py](/learn/examples/rlvr/trl_bridge.py) | One actual native GRPO step, explicit loss/gradient comparisons, reported update-equality outcome, own-step arithmetic audit and declared mixed fixture. |
| [adamw_step_audit.py](/learn/examples/rlvr/adamw_step_audit.py) | Read-only first-step AdamW arithmetic from retained moments, with explicitly qualified gradient inference and exact token/mask row matching. |
| [evaluate_rollouts.py](/learn/examples/rlvr/evaluate_rollouts.py) | Retained run histories, metrics, work counts and pass@K boundaries. |
| [run_all.py](/learn/examples/rlvr/run_all.py) | Guarded staged workflow and source-matched result reuse. |
| [rlvr_data.py](/learn/examples/rlvr/rlvr_data.py) | Fixed bytes, offline inputs, causal mask packing, hashing and usual fast-tokenizer bridge. |
| [causal_backbone.py](/learn/examples/rlvr/causal_backbone.py) | Exact earlier TinyLM attention/block/model classes. |
| [scientific_journal.py](/learn/examples/rlvr/scientific_journal.py) | Durable event log, fresh-destination guard and coherent private state checkpoints. |
| [backbone-provenance.json](/learn/examples/rlvr/backbone-provenance.json) | Original source hash and complete class-AST equality. |
| [records.json](/learn/examples/rlvr/records.json) | All 24 train/12 test original questions and solutions, with derived numeric labels. |
| [provenance.json](/learn/examples/rlvr/provenance.json) | Official dataset revision, selection and original bytes. |
| [GSM8K-LICENSE.txt](/learn/examples/rlvr/GSM8K-LICENSE.txt) | Complete dataset MIT notice. |
| [protocol.json](/learn/examples/rlvr/protocol.json) | Prospective architecture, seeds, fixed budgets and exact native settings. |
| [study-protocol.md](/learn/examples/rlvr/study-protocol.md) | Protocol interpretation, denominators and failure handling. |
| [requirements.txt](/learn/examples/rlvr/requirements.txt) | Pinned package versions. |
| [README.md](/learn/examples/rlvr/README.md) | Setup and actual commands. |

The `observations` directory, when produced, holds complete JSON results and
their individual source/status/stdout/stderr records. Private weight checkpoints
belong in the separately selected work directory.

[Download all programs and offline inputs](/learn/examples/rlvr/rlvr-programs.zip).

[Download the complete recorded outputs](/learn/examples/rlvr/rlvr-observations.zip).
The latter includes every unsuccessful sampled response and the original failed
native status. Its separate native-continuation result does not replace that
failed stage. Its `report.json` covers the separately invoked metrics stage only.
Private weight checkpoints are not part of either download.
