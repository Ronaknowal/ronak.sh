# RL for Reasoning: complete examples

Use Python 3.12 in a virtual environment. The recorded scientific runs used
Python 3.12.14, Torch 2.14.0 CPU, Transformers 5.19.0 and TRL 1.14.2.
Keep all files in this directory and its data/observations subdirectories.

```bash
python -m venv .venv
# Activate .venv with the command for your shell.
python -m pip install -r requirements.txt
python sequence_policy.py
python reasoning_checks.py
python reasoning_sampling.py
python reasoning_evaluate.py
```

The checker, sampler and metrics use the Python standard library. The finite
policy's verification additionally uses Torch. No model is downloaded by these
four commands and none performs a neural fit. `sequence_policy.py` draws finite
categorical samples and compares its manually derived gradient with autograd
and central differences.

For the complete finite-language neural experiment:

```bash
python reasoning_study.py --output my-reasoning-study
```

The output directory must not exist. Before fitting, the runner saves exact
program hashes, splits, seeds, settings and evaluation rules. It performs three
500-update supervised warm starts and six 80-update continuations; it then
evaluates all 27 declared model checkpoints. The recorded run did not improve
held-out arithmetic success. Existing observations are supplied for inspection
without repeating training. Do not tune a new experiment on these test results
and then describe the same test as untouched.

For the ordinary pretrained-model workflow:

```bash
python acquire_model.py --output model
python reasoning_trl.py --model model --output native-preflight --preflight-only
python reasoning_trl.py --model model --output native-run
```

The acquirer downloads only the six pinned public Pythia-14m files listed in
`model-source-report.json`, checks each byte digest and conserves valid existing
files. The preflight runs three constructed nonzero loss/gradient comparisons;
it performs no generation or optimizer update. The actual native run executes
two declared optimizer steps and a fixed eight-question evaluation. Its
recorded sampled rewards were all zero and its tensor weights did not change.
Source records, prompts, every generated completion, masks, parity arrays and
reload evidence are available in `observations/native/`. Native task results
and constructed numerical checks are distinct evidence.

## Files and reuse

- `sequence_policy.py`: exact finite prefix tree, gradients and sampling.
- `reasoning_checks.py`: finite grammar and strict terminal numeric checker.
- `reasoning_sampling.py`: stable temperature/nucleus sampling and group events.
- `reasoning_evaluate.py`: pass@k, majority, paired bootstrap and hard budgets.
- `reasoning_train.py`: task vocabulary, split, response SFT and on-policy updates.
- `reasoning_study.py`: prospective freeze, complete experiments and evaluation.
- `reasoning_trl.py`: pinned pretrained policy, ordinary GRPO API and parity.
- `tiny_causal_lm.py`: exact unchanged prerequisite implementation from Causal
  Language Modeling, SHA256 `9b0fe7cd93bf672f9904fc9240fc2857838c9a51015a53942d799d916518e103`.
  This lesson imports its model classes. Its original standalone character-LM
  command remains runnable with the supplied unchanged Alice train/heldout files
  and provenance. That optional old experiment was not rerun for this lesson.
- `acquire_model.py`: exact unchanged SFT model acquirer, SHA256
  `e192f6fcb1814113c4c110346efa7ecc141e73b88961e826082118a60052da79`.
- `data/gsm8k-slice.json`, `data/source.json`, `data/GSM8K-LICENSE.txt`: 16/8
  original MIT-licensed GSM8K records, revision/selection and attribution.
- `observations.json`: derived navigation summary linked to exact raw outputs.
- `observations/scratch/`: all protocols, histories and 27 full evaluations.
- `observations/native/`: original native protocol, parity and full report.

The library callback deliberately differs from the original GSM8K evaluator:
one terminal decimal after exactly one `####`, exact decimal-value equality,
and actual EOS. It rejects fractions written with a slash and trailing text.
Both choice and limitation are part of the experiment, not a benchmark claim.

Recorded CPU timing applies only to its measured boundaries and environment.
Random draws and floating-point results may differ across versions or devices.
The archive contains no pretrained weights, caches or installed environment.
