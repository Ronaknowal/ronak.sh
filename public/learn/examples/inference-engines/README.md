# Inference engine examples

Python3.12 or later is required. The finite programs use the standard library and NumPy2.3.5 for an independent packed-array construction. They implement request ownership and calculate supplied examples. They do not implement Transformer kernels or benchmark native throughput.

```sh
python -m venv .venv
# PowerShell: .venv/Scripts/Activate.ps1
# POSIX shell: source .venv/bin/activate
python -m pip install numpy==2.3.5
python finite_study.py --output results/finite
```

Every result directory is exclusive: a repeated command cannot silently replace an earlier observation. The driver invokes the complete program functions and retains inputs/results before its expected-value comparisons. It does not run the optional provider/engine recipes or call an inference service. `--source-root` optionally names a directory containing the seven retained `research-sources/` primary documents; without it, the evidence filter explicitly validates pin metadata only. URLs and hashes are in `engine-evidence.json`.

## Native CPU route

The controlled route is Windows x64 CPU using one pinned llama.cpp release and the existing pinned Pythia14m checkpoint. It performs one F16 conversion and four sequential authored completion requests, unless an earlier failure stops the sequence. It does not download a model. `model-source-report.json` identifies all six required checkpoint files. Supply their existing directory as `--checkpoint`; never replace them with another revision while retaining the report.

First read `engine-recipes.md` for the distinction between an inference object, server and request client. The other five engines' recipes are source-inspected options for separately prepared compatible environments; their documentation pins are not local execution claims.

Acquisition is explicit and separate from running code:

```sh
python acquire_engine.py --output engine-artifacts
```

Read `engine-artifacts/acquisition.json`. It records the downloaded binary/source identities and exact source root. Inspect that root's converter requirements and prepare its dependencies in an isolated environment before conversion. The executable is not run by acquisition. Conversion needs that same commit's `conversion` and `gguf-py` packages beside its entrypoint, together with its documented Python dependencies; a copied thin launcher is insufficient. The authoring protocol records the exact environment actually used separately from these reproduction instructions.

The observed successful converter environment used Python 3.12.14, Torch 2.14.0+cpu, NumPy 2.3.5, Transformers 4.57.6, tokenizers 0.22.2, huggingface-hub 0.36.2, sentencepiece 0.2.1, protobuf 4.25.8, requests 2.32.5, urllib3 2.5.0, PyYAML 6.0.3 and tqdm 4.70.1. The converter loads its local GGUF package. These are observed versions, not a claim to reproduce every upstream recommended pin. A first attempt with Transformers 5.19.0 failed because its normalized GPTNeoX config relocated `rotary_pct`; that failure is retained under `evidence/`. The checkpoint and converter were unchanged in the successful continuation.

Prepare a separate environment for the native route, rather than overwriting another project. These commands describe the recorded dependency selection:

```sh
python -m venv .native-venv
# PowerShell: .native-venv/Scripts/Activate.ps1
# POSIX shell: source .native-venv/bin/activate
python -m pip install torch==2.14.0+cpu --index-url https://download.pytorch.org/whl/cpu
python -m pip install numpy==2.3.5 transformers==4.57.6 tokenizers==0.22.2 huggingface-hub==0.36.2 sentencepiece==0.2.1 protobuf==4.25.8 requests==2.32.5 urllib3==2.5.0 PyYAML==6.0.3 tqdm==4.70.1
```

Wheel availability depends on Python/platform. The native binary in this example is Windows x64; the shell examples do not establish a Linux binary route. Do not silently swap dependency or artifact versions while retaining the original result label. If setup fails, save the error and resolve that compatibility boundary before conversion.

```sh
python convert_checkpoint.py --acquisition engine-artifacts/acquisition.json --checkpoint PATH_TO_VERIFIED_PYTHIA_14M --identity model-source-report.json --output converted-model
python native_cpu_route.py --acquisition engine-artifacts/acquisition.json --conversion converted-model/conversion.json --output results/native
```

The supervisor binds loopback on a free port, passes explicit CPU/context/thread settings, probes health, records tokenization and launches four bounded stream clients. It terminates only its own server. Failure stops generation without a retry. If conversion or loading fails, inspect the retained command/stdout/stderr before changing an environment; do not delete the failed result to imply success.

The stream client journals bytes before parsing, including pieces of a multibyte character. Event boundaries, token IDs and content receive timestamps are separate observations. The terminal array is retained separately from nonterminal token arrays; do not count a cumulative terminal array twice. A requested16-token cap can have the documented native UTF-8 completion exception. Content receive gaps are not automatically token TPOT.

## Recorded outcome

The finite campaign passed all 146 declared cases once. Acquisition passed. The first conversion failed at the `rotary_pct` config field; the reviewed environment correction then produced a 29,929,408-byte GGUF (SHA256 `8977255964083cdf425026d13e1af3595c97e94e93ae123baa4412853bf682bf`). Four native attempts then passed, with prompt lengths 5/10/10/4 and 16 output IDs each. Each stream contained sixteen nonterminal one-ID events and one terminal event with empty content and an empty token array. All stopped at `limit`, and server records reported `cache_n: 0`. No terminal IDs are counted twice.

The outputs are poor continuations: factual error/repetition and an incorrect function continuation are retained verbatim. No quality metric or throughput ranking was inferred. `evidence/observations.json` holds complete finite outcomes, native events, exact strings, settings and client-clock values. `native-*-raw.bin` are the original short raw byte streams. First-content, terminal-event and connection-end timestamps remain separate. The one-byte client instrumentation affects those observations; they are not server token-production timings.

The supervisor terminated and waited for only its owned Windows server. Its final process exit code was 1 after termination. This establishes process exit, not application-level graceful shutdown. The archive excludes native binaries, full converter source and model weights; the acquisition helper and model manifest describe those separate artifacts.

`evidence/gguf-inventory.json` is a read-only inventory of the actual exported file: 26 F16 tensors and 50 F32 tensors, totaling 28,155,904 tensor bytes. `general.file_type` is absent. The native endpoint reports `(guessed) all F32` because this pinned loader guesses from the majority tensor type by count, not by storage bytes. Preserve that literal endpoint string and the actual mixed tensor inventory together; do not rewrite the observed metadata or infer storage solely from the requested F16 flag.

## Files and contracts

| File | Teaches |
|---|---|
| `request_contract.py` | Positive-cap pretokenized request and immutable identity. |
| `engine_lifecycle.py` | Admission, iteration, commit, cancel/deadline/error and exactly-once local cleanup. |
| `packed_requests.py` | Complete-prefill offsets, positions, mask and last-logit scatter; NumPy reference. |
| `capacity_accounting.py` | Maximum materialized cached rows and per-device byte budgets. |
| `sse_records.py` | Incremental UTF-8 and data-event framing, explicit parser subset. |
| `stream_client.py` | Standard HTTP transport with raw byte/event journals and bounded errors. |
| `request_metrics.py` | Coherent clocks, separate token/event metrics and offered-cohort outcomes. |
| `engine_requirements.py` | Eligible/unknown/excluded candidates from scoped source evidence. |
| `compare_traces.py` | Exact controls and complete offered receipts before paired comparison. |
| `acquire_engine.py`, `convert_checkpoint.py`, `native_cpu_route.py` | Complete explicit acquisition/conversion/native process route. |
| `finite_study.py` | Bounded deterministic case driver with retained operands/results. |
| `engine-evidence.json`, `engine-recipes.md` | Six pinned source inventories and complete optional usage routes. |

The native probes make no model-quality, concurrency, cancellation-latency, cache-hit, GPU or p99 claim. The finite engine does not reserve bytes on a GPU. A correct local cleanup contract also does not provide distributed exactly-once delivery after replica failure; that belongs to the following system-architecture lesson.
