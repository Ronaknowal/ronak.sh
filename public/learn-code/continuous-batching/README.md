# Continuous batching and paged attention programs

Extract this bundle into one directory. Keep the Python files, Alice text and JSON source reports together. Python 3.11 or later is required; the recorded execution used Python 3.12, NumPy 2.3.5 and CPU PyTorch 2.14.0. These are a tested snapshot, not a claim that newer versions behave identically.

## Local environment

Create a disposable environment:

```bash
python -m venv .venv
```

Activate it with `.venv\Scripts\Activate.ps1` in PowerShell, `.venv\Scripts\activate.bat` in cmd, or `source .venv/bin/activate` in a POSIX shell. Then install the finite-program dependencies:

```bash
python -m pip install numpy==2.3.5 torch==2.14.0
```

The scheduler uses only the standard library. The allocator and modeled simulator use NumPy. The attention, packed-decoder and capstone comparisons also use Torch, with CPU float64 and small fixed random models; none trains a model.

```bash
python iteration_scheduler.py
python shared_pool.py
python paged_attention.py
python packed_decoder.py
python serving_simulation.py
python serving_capstone.py
```

Each prints JSON containing its worked example and finite checks; assertion failures terminate the process. Redirect to a fresh filename if you want to keep a new result. `serving_simulation.py` reports arbitrary modeled time units from the explicitly supplied cost function. Its numeric K/V cells are storage fixtures. `packed_decoder.py` and `serving_capstone.py` separately compute actual neural logits and compare them with independent full-prefix calls.

## Pinned pretrained route

The recorded maintained API route uses Transformers 5.19.0, tokenizers 0.23.2, huggingface-hub 1.33.0 and safetensors 0.8.0. Install them in the same environment:

```bash
python -m pip install transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 safetensors==0.8.0
python acquire_model.py --output model-cache
python native_batching.py --model model-cache --budget 16
```

Acquisition is the network step. It downloads the six exact EleutherAI/pythia-14m files listed in `model-source-report.json`, at revision `cf967c0a9a04383db6f7b1108d86b2962634b4ac`. It checks every byte hash and refuses conflicting existing or incomplete files. Inspect such files before choosing a fresh output directory; do not combine revisions. Model weights are not in this bundle. The subsequent inference commands verify the local files and use `local_files_only=True`.

`native_batching.py` submits three Alice prefixes with explicit request IDs and a six-output cap. It does not warm up, compile or use CUDA graphs. Outputs are keyed by request ID, not completion order. A deadline and `finally` cleanup bound the finite request lifetime. A canceled pending request in this version does not produce the same terminal output as a completed request; the campaign intentionally does not include cancellation.

## A new controlled campaign

The supplied `recorded/study-results.json` contains the already completed six-request, three-budget comparison. It reports all18 terminal results and108 native IDs, plus36 full-prefix reference IDs. The model is not needed to inspect it. To run a new campaign, use fresh paths and freeze its own source identities first:

```bash
python native_study.py prepare --model model-cache --record my-protocol.json
python native_study.py run --model model-cache --record my-protocol.json --output my-results.json
```

Read `my-protocol.json` before running. Preparation loads the tokenizer and verifies model bytes without model inference. Running uses one CPU Torch thread, a fixed model/data revision and no training. It refuses an existing output or journal, records each completed reference/arm immediately, and retains a failure rather than retrying it automatically.

The historical recorded protocol refers to the exact program bytes used then. The current native programs have only multiline formatting changes, with equal Python AST recorded in `recorded/formatting-correspondence.json`. Its exact two native predecessor files are included under `recorded/programs-before-format/`. Use `prepare` to bind the current files for a new run; do not expect the historical protocol's byte hashes to match reformatted files. This distinction does not alter the recorded outputs.

## File map

| File | Role |
| --- | --- |
| iteration_scheduler.py | Finite FIFO/static/continuous event scheduling and arrival/cancellation checks |
| shared_pool.py | Actual K/V pages, tables, valid tails, reference counts and atomic COW |
| paged_attention.py | Global stable normalization over addressed pages; dense and SDPA comparison |
| packed_decoder.py | Shared row-wise TinyLM operations with request-specific attention and real storage |
| serving_simulation.py | Finite allocation/admission/chunking policies and declared modeled clocks |
| native_batching.py | Offline pinned framework request-manager route and full-prefix greedy reference |
| native_study.py | Prepare-before-run fixed campaign with an append-only partial-result journal |
| serving_capstone.py | Complete changed-input practice solution using the pool, decoder and simulator |
| acquire_model.py | Exact reused model-byte acquisition helper |
| tiny_causal_lm.py | Exact causal-lesson architecture helper imported by the packed decoder |
| alice-train.txt / alice-heldout.txt / alice-provenance.json | Exact public-domain text splits and provenance; this campaign uses only the declared train prefixes |
| model-source-report.json | Model revision, filenames, lengths and hashes |
| recorded/ | Complete selected finite/native observations and the historical protocol |

`tiny_causal_lm.py` includes its original training entry point for completeness. These commands import its architecture; they do not run that training entry point. The retained native timings are single inclusive CPU observations, not a speed ranking, latency SLO or confidence interval. Greedy ID agreement is not a logit-tolerance claim.
