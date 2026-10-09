# DPO: complete offline programs

This folder contains a causal language model study on a constructed task and an
ordinary TRL DPOTrainer run on a small, licensed human-comparison dataset. It does
not contain a useful pretrained assistant. All data and model initialization are
local; the programs require no API key or checkpoint download.

Use Python 3.11 or later in a virtual environment and install `requirements.txt`.
The recorded environment used CPU Torch 2.14.0, Transformers 5.19.0 and TRL 1.14.2.
Package installation itself requires an available package index. After setup,
these commands work from the extracted folder:

```sh
python -B pair_records.py
python -B dpo_algebra.py --output my-algebra.json
python -B response_scores.py --output my-response-scores.json
python -B reference_cache.py --output my-reference-cache.json
python -B trl_dpo.py --preflight-only --selection selection.json --workdir my-preflight --output my-preflight.json
```

The first command audits the supplied records without network access. The next
three execute calculations without fitting. The last constructs the actual native
trainer and compares collation, loss and all policy gradients without an optimizer
update. It is appropriate before committing compute to the full study.

To run a new experiment, freeze the source/data/package identities of your own
environment in a new file, then use that same file for the intended stages:

```sh
python -B dpo_study.py --freeze --freeze-file my-study-freeze.json
python -B dpo_study.py --freeze-file my-study-freeze.json --output-dir my-observations
```

The full runner performs three no-fit mechanism stages, one constructed study
(120 SFT updates, then separate 40-update DPO and chosen-only continuations), and
one native study (40 SFT updates and 40 DPO updates). `--stage scratch` or
`--stage native` selects one stage. It refuses to reuse a failed receipt or an
output whose inputs or bytes have changed. Use an explicit new directory and
freeze when intentionally changing a scientific experiment; preserve the old one.
It does not promise identical numeric results across different packages/hardware.

`study-protocol-freeze.json` and `study-protocol-native-freeze.json` are the two
recorded historical source freezes, not files to overwrite with your environment.
The initial native attempt failed on an obsolete configuration argument after
its SFT warm-start and before any DPO update. The corrected native API uses
`precompute_ref_log_probs=False`, validates configuration earlier and provides the
no-fit preflight. It repeated the unpersisted warm-start under the unchanged
scientific protocol. `provenance/` preserves the two initial program sources and
the exact continuation statement. The constructed fit was not repeated.

The seven entry points are `pair_records.py`, `dpo_algebra.py`,
`response_scores.py`, `scratch_dpo.py`, `trl_dpo.py`, `reference_cache.py` and
`dpo_study.py`. `causal_backbone.py` is the complete causal-decoder dependency;
its origin and exact identity are in `backbone-provenance.json`.

The 492 supplied records retain the RLHF lesson's family split. The native run
selects 128 training and 64 held-out pairs, fits its tokenizer on training text,
checks prompt boundaries, appends EOS once, and rejects a whole pair if either
member exceeds the context budget. All selected pairs fit this particular run.
The raw text and supplied labels are preserved; text can include factual errors.
`HH-LICENSE.txt` and records provenance identify the released data.

`results/` contains the actual saved algebra, mask, cache, constructed and native
observations, including every declared generation. On the four constructed
training prompts, final DPO exact-task success was 30/32 and chosen-only was
31/32; their compute/token budgets differ. Native held-out implicit preference
agreement was 36/64, while BCE and Brier worsened from the equal-reference
baseline. The generated text remains incoherent. These results demonstrate
mechanisms and measurement distinctions, not general assistant quality.

`execution-provenance.json` binds the executed sources and results;
`download-manifest.json` lists archive member hashes. Editing formatting does not
silently make an old execution a run of new scientific code.
