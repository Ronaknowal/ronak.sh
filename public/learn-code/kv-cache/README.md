# KV-cache programs

These programs accompany **KV-Cache & Memory Management**. Keep the extracted
files together. No program in the lesson requires training. The copied
`tiny_causal_lm.py` includes its original training command, but the cache adapter
imports its class without invoking that command.

## Finite examples

Tested with Python 3.12.14, NumPy 2.3.5, and PyTorch 2.14.0+cpu on Windows.
Create and activate an ordinary Python virtual environment, then run:

```sh
python -m pip install numpy==2.3.5 torch==2.14.0
python cache_trace.py
python cached_decoder.py
python memory_budget.py
python paged_storage.py
python cache_precision.py
python latent_cache.py
```

Outputs are JSON. These commands use constructed vectors or fixed random model
weights; they do not download anything or claim text quality. `cached_decoder`
prints a small one-run CPU timer for its generation example, which is not the
repeated pretrained benchmark.

## Pinned pretrained model and ordinary cache API

The tested native route adds Transformers 5.19.0, tokenizers 0.23.2,
huggingface-hub 1.33.0 and safetensors 0.8.0:

```sh
python -m pip install transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 safetensors==0.8.0
python acquire_model.py --output model-cache
python native_cache.py --model model-cache
```

Acquisition downloads the six files listed in `model-source-report.json` from
EleutherAI/pythia-14m at revision
`cf967c0a9a04383db6f7b1108d86b2962634b4ac`. Existing files are checked against
their exact sizes and SHA256 hashes; mismatches are refused. Large model weights
are not included in this bundle. Once acquisition succeeds, native inference
uses only that directory and `local_files_only=True`.

`native_cache.py` runs full-prefix, DynamicCache and StaticCache comparisons,
chunked append, reset, poisoned unused slots and left-padding cases. It reports
pass/fail counts at an unchanged `atol=rtol=2e-4`. A false tolerance flag is a
failed numerical criterion, even if top-choice IDs agree. The supplied study
retains such FP32 failures. A separate same-weight FP64 diagnostic supports a
floating-point explanation for the tested short prefix; it is not a blanket
guarantee for all future cases.

## Run a separate local comparison

```sh
python cache_study.py prepare --model model-cache --record my-protocol.json
python cache_study.py run --model model-cache --record my-protocol.json --output my-results.json
```

Preparing verifies source/model identities and selects the first 104 token IDs
of the supplied Alice training-text file; it does not run model inference.
Running loads one FP32 CPU model and compares prompt lengths 8, 32 and 96.
Every arm computes one vocabulary-logit row per call. Timing teacher-forces
the same seven next IDs after prefill. Each arm/length has one warmup and five
recorded repetitions with a rotating arm order. Greedy output is a separate
eight-ID comparison with no early stop on EOS.

Keep new records separate from the supplied `study-protocol.json` and
`study-results.json`. The program refuses existing record/output paths. A run
failure is meaningful evidence: preserve the terminal message and any existing
files before deciding which affected operation to retry. Timings vary with the
machine and workload. This CPU reference does not measure GPU kernels, compiled
execution, serving throughput or model quality.

## Files and boundaries

- `cache_trace.py`: hand-computable Q/K/V projections, append and SDPA bridge.
- `grouped_attention_cache.py`: exact prerequisite projected attention/cache source.
- `cached_decoder.py`: new per-layer cached inference and greedy generation adapter.
- `tiny_causal_lm.py`: exact prerequisite complete decoder; import its class here.
- `native_cache.py`: current library calls, cache observations and comparison counts.
- `cache_study.py`: prospective selection, matching calls, timing and saved outcomes.
- `acquire_model.py`, `model-source-report.json`: exact pinned acquisition helper/contract.
- `memory_budget.py`: tensor payload, ragged/static/paged layouts and explicit head ownership.
- `paged_storage.py`: finite block allocation, address translation, release and gather.
- `cache_precision.py`: real packed 4/8-bit payload, metadata, reconstruction and attention error.
- `latent_cache.py`: content projection absorption and a noncommuting rotation.
- `alice-train.txt`, `alice-provenance.json`: supplied public-domain text and exact provenance.
- `study-protocol.json`, `study-results.json`: recorded workload and all measured observations.
- `native-diagnosis.json`, `study-first-failure.json`: retained numerical failure and bounded diagnosis.

The page allocator is an inspectable reference, not a GPU PagedAttention kernel.
The quantizer uses a simple grouping rule, not a KIVI implementation. The latent
program verifies matrix algebra, not a trained MLA model. Each program states
the abstraction it actually implements.
