# Speculative decoding programs

Extract the complete bundle into one directory and keep the Python, text and JSON files together. Use Python 3.11 or later. The pinned local environment is NumPy 2.3.5, PyTorch 2.14.0 CPU, Transformers 5.19.0, tokenizers 0.23.2, huggingface-hub 1.33.0 and safetensors 0.8.0. A version pin makes the ordinary API reproducible; it does not claim future versions behave identically.

```bash
python -m venv .venv
```

Activate with `.venv\Scripts\Activate.ps1` in PowerShell, `.venv\Scripts\activate.bat` in cmd, or `source .venv/bin/activate` in a POSIX shell. Then install:

```bash
python -m pip install numpy==2.3.5 torch==2.14.0 transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 safetensors==0.8.0
python speculative_math.py
python speculative_decode.py
python sequence_law.py
python practice_answers.py
```

These four commands use finite probability models. They do not establish the speed or quality of a trained language model. `sequence_law.py` computes exact rational terminal-path masses, including a deliberately incorrect rejected-suffix branch. The numerical sampler only chooses positive-support IDs; it treats uniform intervals as half-open and rejects a zero-target-probability proposal even at uniform zero.

```bash
python speculative_cache.py
python tree_verification.py
python proposal_heads.py
```

The cache and tree programs instantiate small fixed random TinyLM networks in CPU float64. They compare real logits and preserve actual per-layer K/V arrays; they do not train a text model. The head diagnostic performs exactly one constructed SGD update in frozen mode and one in joint mode from identical initial tensors. It establishes gradient ownership and shifted targets, not production Medusa quality. The full inherited `tiny_causal_lm.py` and `cached_decoder.py` are exact prerequisite helpers; their standalone training/timing verification entry points are not called by this workflow.

## Ordinary pretrained route

Acquire the six hash-checked Pythia files at the revision in `model-source-report.json`. This is the network/disk step; weights are separate from the program bundle. Existing mismatching or partial downloads are retained for inspection.

```bash
python acquire_model.py --output model-cache
python native_speculation.py --model model-cache --output my-diagnostic.json
```

The diagnostic loads the actual six-block Pythia-14M target, copies it and keeps the first three decoder blocks as an untrained draft. It keeps the same tokenizer, embeddings and output head, and fixes the remaining attention cache layer indices. Both are ordinary independent model objects. They are not a trained early-exit checkpoint. Loading is local-only after byte verification. The two diagnostic continuations are greedy and sampled, each capped at eight new IDs. Their complete round/work records are separate from timed study records. An exclusive marker and partial journal prevent silently replacing failed or completed work.

Optional `prompt_lookup`, `early_exit` and `checkpoint_mtp` functions show supported ordinary API calls with explicit model conditions. They never run in the diagnostic or fixed study. They do not download larger checkpoints. Confirm checkpoint-specific trained early-exit or MTP support before separately invoking those routes. MTP modules are sequential state/token-conditioned checkpoint layers, distinct from independent residual heads.

## A new declared campaign

The source-bound runner separates preparation from execution:

```bash
python speculation_study.py prepare --model model-cache --record my-protocol.json
python speculation_study.py run --model model-cache --record my-protocol.json --output my-run --stage finite
python speculation_study.py run --model model-cache --record my-protocol.json --output my-run --stage cache
python speculation_study.py run --model model-cache --record my-protocol.json --output my-run --stage tree
python speculation_study.py run --model model-cache --record my-protocol.json --output my-run --stage heads
python speculation_study.py run --model model-cache --record my-protocol.json --output my-run --stage native
python speculation_study.py run --model model-cache --record my-protocol.json --output my-run --stage study
```

Preparation verifies bytes and tokenizes text without constructing a neural model. Inspect every source and the prepared protocol before running. The four fixed prose prefixes contain 19, 32, 32 and 32 IDs. The study performs 32 warmups and 96 measured generations, capped at 24 new IDs each; the 3,072-token bound includes warmups. It compares target-only, K1, K3 and K5 in greedy and temperature-0.8 sampled modes using the same seeds across arms. Equal seeds do not imply equal sampled strings. Output clocks include generation and the common counter hooks; tokenization and text decoding lie outside the timer. All warmups, outliers, slowdowns and mismatches are retained. No quality benchmark or GPU speed forecast follows from these small CPU observations.

Each stage requires successful earlier stages with the same protocol identity, creates an exclusive marker, and preserves failures. Do not delete a marker to repeat a failed or unfavorable run. Diagnose the exact source and retain the earlier observations before preparing an explicitly reviewed continuation. A newly intended independent experiment needs fresh paths and a new protocol.

## Read the included observations

The `evidence/` directory keeps actual results separately from commands for a new experiment. The original deliberately wrong finite witness failed because the chosen stale draft row happened to equal the correct target row. Its failed source, protocol and diagnosis are included. Earlier mass/finite-loop verifier calls returned before that failure, but their combined raw return was not saved; `finite.json` records this limitation. The corrected sequence and practice stage then completed, followed by the cache, tree and head stages.

The original greedy native attempt completed one round and then failed because explicit dynamic-cache initialization conflicted with an existing assistant cache. `original-native-failure.json` and `original-native-trace.jsonl` preserve that failure. The current configuration uses `cache_implementation=None`, which creates/reuses DynamicCache in the pinned path. Only the remaining sampled diagnostic continued; it emitted eight IDs. No failed greedy retry occurred.

The fixed study completed all 32 warmups and 96 measured calls, with 3072 total output IDs and unchanged weights. All 36 measured greedy speculative/baseline pairs had equal output IDs. All 72 speculative timing pairs were slower than baseline. `summary.json` contains medians and full range summaries; `study.json` retains every row. These are results from a small two-thread CPU workload with an untrained pruned draft, not a quality benchmark or accelerator forecast. The native helper's constructed zero-uniform boundary result is separately preserved in `native.json`.

After the study, practice 14 gained a different three-token example and practice 16 became an ablation diagnosis. `practice-content-successor.json` records the new exact finite answer; `executed-practice-source.txt` preserves the version used by the earlier stage. The scientific protocol and `finite.json` still identify that earlier source and its original answers. This presentation correction changed no scientific workload or observation, and the completed stage was not replayed.

## Complete file map

| File | Purpose |
| --- | --- |
| speculative_math.py | Validated probability rows, categorical support, strict acceptance, residual and mass/cost identities |
| speculative_decode.py | Prefix-dependent finite loop, discarded suffix, repair/bonus, EOS and cap |
| sequence_law.py | Exact rational conditional sequence enumeration and a wrong suffix witness |
| speculative_cache.py | Real TinyLM pair, cached candidate scoring, logical truncation and poisoned unused storage |
| tree_verification.py | Actual ancestor-masked tree forward, greedy traversal and ordered two-proposal law |
| proposal_heads.py | Real shifted CE and gradient/update ownership in two tiny constructed modes |
| native_speculation.py | Pinned ordinary generation, fixed configuration, native rounds and optional variant routes |
| speculation_study.py | Prepare-before-run stages, fixed workload, timing records and failure retention |
| practice_answers.py | All eighteen complete changed-input numerical/diagnostic solutions |
| tiny_causal_lm.py / cached_decoder.py / acquire_model.py | Exact prerequisite architecture, cache and acquisition helpers |
| alice-train.txt / alice-heldout.txt / alice-provenance.json | Complete helper inputs and public-domain provenance; only the declared heldout prose lines feed this study |
| selected-prompts.json / model-source-report.json | Exact reviewed prompt IDs and pinned checkpoint identity |
