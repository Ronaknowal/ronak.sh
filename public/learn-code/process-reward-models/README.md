# Reasoning-step reward models: runnable examples

Seven complete Python mains teach separate contracts. The supplied study is a
transparent lexical classifier, not a pretrained reasoning model. Constructed
search/rollout/policy examples do not reproduce a paper's benchmark.

Create a virtual environment, install `requirements.txt`, and run from this
directory. The NumPy/standard-library record and classifier route needs no
Transformers download. The small random Transformers model runs offline after
dependencies are installed. Versions below are the actual tested versions;
the examples do not require a GPU.

```shell
python prm_records.py --train sources/phase2_train.jsonl.prefix --test sources/phase2_test.jsonl.prefix --out extracted-data
python prm_contracts.py --output contracts.json
python prm_torch.py --data data --model study/model.json --output torch.json
python prm_transformers.py --work random-model --output transformers.json
python prm_search.py --output search.json
python prm_rollouts_rewards.py --output rewards.json
```

`data/` contains the exact selected train/validation/test examples. To perform
the fixed declared fit yourself, use a new output directory:

```shell
python prm_classifier.py --data data --out my-study
```

This is a new execution; inspect the retained outcome directly in its files. The
classifier refuses to overwrite an existing `results.json`. `study/` preserves
the actual single 160-update fit, full weights, all predictions and checkpoints.
`prm_torch.py` normally checks matched loss/gradient/update and saved probabilities
without a second scientific fit. `--fit-out NEW_DIRECTORY` offers a complete
ordinary-tool training route when desired.

The study uses 96/32/48 disjoint problem groups and 918/290/524 labelled examples.
Update 160 test accuracy is .618321 versus training-prior .614504; CE is worse
(.942385 versus .921723), as is Brier (.559909 versus .544005). It recognizes no
neutral test cases and only 15/130 invalid cases. Read the complete confusion
matrix and actual failure; a small accuracy increase does not establish good
process judgment. Signed lexical hashing loses order and permits collisions.

`sources/` supplies complete newline-terminated records retained from two
bounded PRM800K HTTP ranges, not the full upstream corpus. Commit:
`7ecc794703b2877f63226f2477a49b34f9b25163`. Their SHA256 hashes and sizes are in
`sources/provenance.json`; actual upstream MIT notice is `PRM800K-LICENSE.txt`.
Keep that notice with redistributed data. Source siblings share a chosen prefix;
unchosen alternatives must not be concatenated. Neutral labels are not missing.

`study-protocol.md` gives the prospective selection, feature and optimization
rules. It was saved before the fit; no positive-outcome acceptance gate or
test-based checkpoint selection was used. The restricted prefixes and early-step
cap make this a teaching study, not a full PRM800K/ProcessBench result.

Optional Qwen inference is a separate unexecuted route requiring `--pretrained`
and an immutable 40-character `--revision`. It downloads substantial pretrained
weights and executes that pinned model's custom code. The official model has
its own Qwen license and memory requirements. The executed small random model
uses local byte IDs; do not confuse them with Qwen's vocabulary or its published
example outputs.

The archive contains all seven sources, selected data, retained results and raw
prefixes. The lesson also shows every complete source directly with shared
Copy/Download controls. Error/retry controls fetch code and fixed weights; they
do not invoke training or model generation in the browser.
