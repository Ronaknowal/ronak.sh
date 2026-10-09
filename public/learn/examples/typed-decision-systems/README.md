# Typed Decision Systems: inspect or reproduce the complete study

The lesson explains these ten complete programs in their concept order. The
recorded study is already complete. Reading `results/` does not train a model,
call a service or require downloading the large checkpoint. Constructed arithmetic,
small-model training and pretrained measurements are explicitly separate.

## Environment

Tested with Python 3.12.14, CPU Torch2.14.0, NumPy2.3.5, Transformers5.19.0 and
Laya0.4.0 on Windows11. `environment.json` records the remaining actual versions.
Create an isolated environment, activate it, then install the pins:

```sh
python -m venv .venv
# Windows PowerShell: .venv/Scripts/Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
```

The recorded run used task-local installed packages rather than executing this
fresh-environment installation. A CPU-specific Torch wheel can be selected from
the official PyTorch wheel index if your package resolver selects another build.
The core and finite examples use NumPy/Torch; the native route additionally needs
the Laya/Transformers/tokenizer dependencies. No GPU is required by these programs.
The wrapped shell commands below use POSIX continuation notation; on PowerShell,
enter a wrapped command on one line. Paths are relative to this extracted folder.

## Files and evidence

- `decision_math.py`: stable masked probabilities, proper scores, costs and the
  clipped-log counterexample. `report_policy.py`: finite Gaussian report-policy
  estimators, their baselines and a separate pathwise reference.
- `typed_decision.py`: the exact reused project core, including its constructed
  project examples. This lesson's actual BANKING study is run through
  `train_decision.py`, not the core's older demonstration command.
- `prepare_banking.py`: source-identity checked cohort adapter.
  `shift_decisions.py`: creates the24 predeclared changed-input requests.
- `train_decision.py`: preparation, three400-update scratch fits, development
  selection seal and saved raw logits. `run_laya.py`: real pinned pretrained
  inference, typed examples, collector parity, shifts and bounded local timing.
- `calibrate_decisions.py`: five calibration-only scalar fits and test metrics.
  `evaluate_routing.py`: paired cached decisions under the frozen cost rule.
- `replay_artifact.py`: finite full-parameter parity, loader checks, packaging,
  and selected-model replay with dependency validation before inference.

All540 selected original requests and their source IDs are in `data/`. All three
scratch seeds, checkpoint selections, plans, weak test results, five calibrations,
24 native changes and rejected scratch inputs are retained in `results/`. The
native model's weights are not included. Checkpoint files total approximately
846MB and the weight file alone is842,609,210bytes. Local working memory also
needs space for the model and its forward activations.

## Exact external acquisitions

The six native files and their individual pinned download URLs and SHA256 values
are in `model-source.json`. Fetch them into one folder, preserving names such as
`encoder/config.json` and `tokenizer/tokenizer.json`. They come from
[convaiinnovations/laya at revision7b928d8](https://huggingface.co/convaiinnovations/laya/tree/7b928d828b7b0e022f929d9bd2e44165aa270148).
`run_laya.py` checks all six digests before loading weights. `README.md` in that
model folder is the original model card, distinct from this study README.

The optional raw-data reconstruction uses the exact official
[BANKING77 files](https://github.com/PolyAI-LDN/task-specific-datasets/tree/57ec275d8078af65b7731c2a98be812d844a6d6b/banking_data),
`train.csv` and `test.csv`, revision57ec275d8078af65b7731c2a98be812d844a6d6b.
Their source metadata and license are included in `data-source.json` and
`BANKING77-LICENSE`. Prepared data is supplied so reconstruction is optional.
The source corpus is by PolyAI, attributed under CC BY4.0; the study selects six
intents, deduplicates normalized text and assigns its own documented cohorts.
The Laya implementation is Apache2.0; its original license is `LAYA-LICENSE`.

## Inspect the saved study first

`results/calibration.json` contains every raw/scaled probability vector and metric.
`results/routing.json` preserves aligned per-request decisions and costs.
`results/laya/*observations.json` contains actual native typed responses, usage
flags and raw hooked logits. `results/replay.json` records the completed replay.
Historical artifacts contain relative paths from the original Windows checkout,
including its external checkpoint/manifest locations. They are provenance records,
not portable paths that magically resolve in a new extraction.

To create path bindings for your own acquired checkpoint, use a **new** artifact
directory. Packaging reads and validates files but performs no fit or inference:

```sh
python replay_artifact.py package --scratch results/scratch --native results/laya --calibration results/calibration.json --routing results/routing.json --checkpoint /local/laya --checkpoint-manifest model-source.json --artifact-dir results/local-artifacts
python replay_artifact.py saved --scratch results/scratch --native results/laya --calibration results/calibration.json --routing results/routing.json --artifact-dir results/local-artifacts --shifts data/shifts.json --output results/local-replay.json
```

The second command performs the declared scratch replay/shift forwards, but no
training or new pretrained inference. It requires the complete original checkpoint
files because those are dependencies of the native postprocessor artifact.
New packaging creates platform-native relative paths; retain that local directory
tree if moving it. Hashes detect drift; they are not cryptographic signatures.

## Deliberately reproduce the experiments

Keep bundled `results/` intact. Use `my-results/` for a new execution. These are
real model runs, not a prerequisite for using the interactive lesson. The original
budget is three400-update scratch fits, one bounded native campaign, five scalar
calibration fits and cached routing evaluation. No best-looking rerun was selected.

```sh
python decision_math.py --output my-results/math-results.json
python report_policy.py --output my-results/report-policy.json
python replay_artifact.py finite --output my-results/finite.json
python train_decision.py prepare --data data/banking.json --output my-results/scratch
python train_decision.py fit --output my-results/scratch
python run_laya.py --checkpoint /local/laya --checkpoint-manifest model-source.json --data data/banking.json --shifts data/shifts.json --output my-results/laya
python calibrate_decisions.py --scratch my-results/scratch/logits.json --native my-results/laya/logits.json --output my-results/calibration.json
python evaluate_routing.py --calibration my-results/calibration.json --output my-results/routing.json
python replay_artifact.py package --scratch my-results/scratch --native my-results/laya --calibration my-results/calibration.json --routing my-results/routing.json --checkpoint /local/laya --checkpoint-manifest model-source.json --artifact-dir my-results/artifacts
python replay_artifact.py saved --scratch my-results/scratch --native my-results/laya --calibration my-results/calibration.json --routing my-results/routing.json --artifact-dir my-results/artifacts --shifts data/shifts.json --output my-results/replay.json
```

The native CPU run used `LAYA_CPU_AMP=off` and `HF_HUB_OFFLINE=1` after acquisition.
Torch threads are fixed at four by the programs. `prepare_banking.py --source-dir
raw --output new-data` and `shift_decisions.py --data new-data/banking.json --output
new-data/shifts.json` reconstruct inputs into fresh destinations if wanted.

Execution stops on a changed dependency, malformed data, incomplete existing
seed directory or numerical parity failure. Preserve that output to diagnose it;
do not delete it and present the replacement as the originally planned run.
Library and hardware changes may alter floating-point results or timing.

## What the measurements support

The pretrained model reached87/120 test accuracy; the three small models reached
27/120,20/120,33/120 and lexical overlap43/120. External calibration changed NLL
and Brier, not argmax. Native shipped temperatures, externally fitted temperatures
and rounded API fields are different conventions. The primary calibrated routing
policy covered only5/120 cheaply. Costs are stipulated abstract units, not measured
cloud bills. Timings describe a shared local CPU run, not a controlled performance
benchmark. No multilingual sibling or vendor-hosted product was tested.
