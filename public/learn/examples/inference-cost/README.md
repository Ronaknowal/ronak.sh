# Inference cost accounting programs

The [complete file index](FILES.md) links every supplied file. Extract the
[program archive](inference-cost-programs.zip) before following these commands.

Keep the Python, JSON and text files together. Python 3.11 or later is required.
The accounting programs use the standard library. The matrix comparison and
integer allocation route also use NumPy and SciPy. The checkpoint observation
uses PyTorch and Transformers on CPU. No API key or GPU purchase is needed.

```bash
python -m venv .venv
```

Activate `.venv\Scripts\Activate.ps1` in PowerShell,
`.venv\Scripts\activate.bat` in cmd, or `source .venv/bin/activate` in a POSIX shell.
Install the package snapshot used for this lesson, then run the finite examples:

```bash
python -m pip install numpy==2.3.5 scipy==1.18.1 torch==2.14.0 transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 safetensors==0.8.0
python request_ledger.py
python work_and_memory.py
python capacity_cost.py
python cache_accounting.py
python allocation_solver.py
python practice_answers.py
```

The price file is a first-party quote snapshot retrieved on 8 October 2026,
not a paid request or invoice. `usage.jsonl` contains explicitly constructed
attempts; `documented-usage.json` transcribes a first-party illustrative usage
record. Its `cache_creation_input_tokens` is a parent subtotal, not an extra
charged category. If a nonzero creation total lacks the five-minute/one-hour
split, the parser refuses to invent a price. Integer token counts and decimal
USD rates produce exact subtotals; cents rounding is not applied to every row.

`capacity_cost.py` separates a reserved charge from a genuinely separate
variable expense. The capacity/quality/rate scenarios are constructed inputs,
not measured throughput or real model rankings. In `allocation_solver.py`, the
finite lattice and SciPy `milp` solve identical objective/constraint arrays.
A successful integer solution is checked for integrality and feasibility;
infeasible status does not supply a zero-dollar optimum. The relaxed result
allows fractional replicas intentionally.

Overlapping cache misses each pay their own creation charge. In the declared
lifetime scenario, every pending write keeps its availability time; a later
miss cannot cancel an earlier write that becomes reusable. A hit refreshes
the unexpired available entry with the latest expiry, while other pending
writes retain their own clocks. Expiry is exclusive and availability inclusive.
The cache program separately prints the continuous read-hit threshold and
its ceiling as a whole-number minimum. Break-even permits equality; strictly
cheaper operation requires the corresponding strict inequality instead.

## Inspect the actual checkpoint

`acquire_model.py` is the exact KV Cache prerequisite utility. It retrieves six
files from the pinned Pythia-14M revision in `model-source-report.json` and
checks their hashes. This optional network/disk operation is separate from
inference. Existing valid bytes are reused; mismatching files are preserved.
Weights are not included in the program archive.

```bash
python acquire_model.py --output model-cache
python native_model_accounting.py --model model-cache --output my-observations
python practice_answers.py --native-report my-observations/report.json
```

The fixed native route uses four real public-domain Alice excerpts and their
first sixteen token IDs, recorded in `native-prompts.json`. The original text
and its provenance are supplied. Model loading is local-only, CPU float32,
evaluation mode, eager attention, no gradients, and two CPU threads. Each
request has exactly three forwards: prefill selects output one; cached forward
one processes that ID and selects output two; cached forward two processes
output two solely to inspect its stored K/V. No third token is emitted. These
fixed two-token continuations count work; they are not a language-quality
study, and EOS is not a stopping rule for this explicit call sequence.

Every completed forward is saved before its shape/byte interpretation is
asserted. An existing output directory is refused; failures retain their
active stage and all previously saved records. Do not delete failed evidence
to replay an unfavorable run. A separate intended experiment needs a new
declared protocol and fresh directory.

The report distinguishes logical tensor bytes from unique backing storage,
deduplicating aliases. Parameters, buffers, K/V and logits have named shape and
dtype records. The Linear hooks count only explicitly enumerated dense
matrix multiplies, with two nominal FLOPs per multiply-add; attention matrix
products, embeddings, normalization, activations, bias additions and other
operations are excluded. This partial count is not total model FLOPs. Neither
tensor storage nor these operation counts measure process RSS, allocator peak,
HBM traffic, latency, GPU throughput or a provider's expense.

## Complete file map

| File | Use |
| --- | --- |
| request_ledger.py | Streaming attempt ledger, exact category subtotals, conditional retry and routing arithmetic |
| work_and_memory.py | Logical weight/KV capacity, explicit scratch dot products, NumPy correspondence and roofline bounds |
| capacity_cost.py | Reserved/metered horizons, delivery denominator, capacity stairs, feasible crossovers and failure headroom |
| cache_accounting.py | Disjoint usage normalization and a declared lifetime/prefix identity scenario |
| allocation_solver.py | Complete finite enumeration and the same ordinary SciPy MILP |
| native_model_accounting.py | Pinned ordinary CPU forwards, exact named tensor/storage and partial Linear counts |
| practice_answers.py | Sixteen changed-input tasks; task 16 reads the actual saved native record |
| acquire_model.py | Exact earlier hash-checked checkpoint acquisition utility |
| alice-heldout.txt / alice-provenance.json | Public-domain source/provenance, preserved from the prerequisite |
| native-prompts.json / model-source-report.json | Exact selected token IDs and pinned model file identity |
| usage.jsonl / documented-usage.json | Constructed request attempts and source-labelled documentation schema |
| price-snapshot.json | Dated first-party quote categories, units and limitations |
| native-observations.json | Exact retained CPU report: twelve forwards, eight selected outputs, all tensor/count rows |
| finite-observations.json | Original local accounting, NumPy, SciPy and changed-practice output rows with receipt hashes |

Read the retained observations without generating another native run:

```bash
python practice_answers.py --native-report native-observations.json
```

The saved native report records 56,270,848 parameter bytes and 32 buffer bytes.
Cache logical/backing bytes progress from 98,304 to 104,448 to 110,592 for each
selected request. These are the actual CPU float32 observations. They are not
GPU capacity, latency, process-memory or answer-quality measurements.
