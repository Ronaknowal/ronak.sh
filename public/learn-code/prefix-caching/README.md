# Prefix caching programs

The scratch programs implement finite cache identity, lifetime, storage and work
accounting. The TinyLM and Pythia programs compare real suffix logits; the pinned
Transformers allocator demonstrates physical sharing with supplied K/V. They do
not fit a model, generate continuations, measure service speed or call an API.

## Local setup and complete commands

Use Python 3.12. Create a fresh environment, then install the pinned local-study
requirements. Downloading checkpoint files is a separate explicit operation.

```sh
python -m venv .venv
# Windows PowerShell: .venv/Scripts/Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python acquire_model.py --output model-cache
python prefix_study.py --stage finite --output results
python prefix_study.py --stage tiny --output results
python prefix_study.py --stage native --output results --model model-cache
python prefix_study.py --stage allocator --output results
```

Already valid model files are reused. A mismatching file is reported, never
overwritten. Each study stage creates an exclusive directory; rerunning into it
fails. A failed stage stops the sequence. Its traceback, completed-operation
journal and raw tensor files remain available. Do not remove a failed directory
to make a failed result appear successful. The local authoring campaign uses one
reviewed sequence; these commands let a reader reproduce it independently.

`source-manifest.json` binds every program and input. `study-protocol.json` fixes
the seed, inputs, ten Pythia forwards and tolerances. A cache prefix snapshot is
copied for each independent suffix; it is not a shared physical allocation.
Binary `.pt` observations are locally produced tensor records. Read only your
trusted generated files, for example with `torch.load(path, weights_only=True)`.

## File index

| File | Purpose |
|---|---|
|[prefix_identity.py](prefix_identity.py)|Canonical namespace, parent chain, collision-safe exact comparison and final-query boundary.|
|[prefix_work.py](prefix_work.py)|Query rows and exact causal attention-pair counts.|
|[prefix_store.py](prefix_store.py)|Bounded full-request pages, atomic admission, ownership, completion, inactive LRU and partial-page copies.|
|[prefix_workload.py](prefix_workload.py)|Constructed cold/warm/pressure traces and an ended-session frequency counterexample.|
|[radix_prefix.py](radix_prefix.py)|Compressed-edge insertion, split, pinning, leaf eviction and a fixed-tree DFS work comparison.|
|[prefix_routing.py](prefix_routing.py)|Compare supplied wait-plus-service estimates.|
|[prefix_cost.py](prefix_cost.py)|Decimal charges, equality, strict saving and nonpositive-benefit cases.|
|[prefix_decoder.py](prefix_decoder.py)|Occupied-row snapshots and independent real TinyLM suffix branches.|
|[native_prefix.py](native_prefix.py)|Ordinary DynamicCache reuse on verified local Pythia weights.|
|[native_prefix_allocator.py](native_prefix_allocator.py)|Actual pinned physical block sharing and acquire/release/evict lifecycle.|
|[provider_cache_examples.py](provider_cache_examples.py)|Optional, separately invoked remote client examples.|
|[practice.py](practice.py)|Sixteen worked-answer computations, including the explicitly prefix-only capstone pool.|
|[prefix_study.py](prefix_study.py)|Ordered once-only stage runner and source checks.|
|[observations.py](observations.py)|Persist completed operands/results before assertions.|
|[cached_decoder.py](cached_decoder.py), [tiny_causal_lm.py](tiny_causal_lm.py)|Exact prerequisite implementation; only classes are used here. No original training or verification main is run.|
|[native_cache.py](native_cache.py), [acquire_model.py](acquire_model.py)|Exact prerequisite loader/forward/accounting and explicit file acquisition.|

The supplied Alice text and provenance are exact copies from KV-Cache & Memory
Management. `study-protocol.json` reuses its saved token IDs instead of silently
retokenizing another version. Tail chunks are two fixed nonoverlapping slices;
these splice examples test state compatibility, not natural-language quality.

## Optional provider calls

These are separate remote operations, not study stages. Install only the SDK
you choose (`google-genai`, `anthropic` or `openai`) in an appropriate environment.
Set its environment variable (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY` or
`OPENAI_API_KEY`), choose a currently supported model, and supply your own
document. The code sends that document and may incur charges. It prints actual
response usage; no cache hit is assumed and no remote example was run here.

```sh
python provider_cache_examples.py --provider google --model YOUR_SUPPORTED_MODEL --document your-document.txt --question "Summarize the main claim." --question "What evidence supports it?"
```

Replace `google` with `claude` or `openai` for the other branch. Google's named
resource uses the legacy generateContent v1beta API: create, use, get, extend TTL
and delete in `finally`. Claude marks one stable document block. The OpenAI
branch uses the documented GPT-5.6-and-later explicit-breakpoint fields; an older
model requires its own retention contract. Model minima, support and prices
must be read from the current provider documentation. Resource identity or a
cache key is not a guarantee of identical generated answers.

Source-checked 9 October 2026: [Google caching guide](https://ai.google.dev/gemini-api/docs/generate-content/caching),
[Google SDK cache methods](https://github.com/googleapis/python-genai/blob/main/google/genai/caches.py),
[Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching),
[OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).
The Google SDK's `delete` takes keyword `name`; this program follows its actual
method signature rather than the guide's positional shorthand.

## Interpretation boundaries

The finite store is single-threaded and represents K/V identity with token IDs.
It does not synchronize GPU work. Exact-prefix tuples make collisions safe but
use quadratic aggregate prefix storage; production interning can reduce it.
The radix reference scans leaves; it is not a serving engine. Its DFS statement
assumes a known fixed tree and enough capacity for a longest root-to-leaf path.
All waits, charges and arrival fixtures are constructed, with labelled units.

The native allocator's internal names differ: one page is one layer's four-token
K/V payload, one block covers both layers, one sector here holds one block.
Four allocatable sectors plus two required trash sectors consume 3072 bytes.
Its native BLAKE2b-64 index does not implement this lesson's exact collision
fallback or trust namespace. Sharing addresses concern its physical backing;
`update` may return a gathered copy. These observations cannot establish an
online manager hit rate, GPU speedup or cross-tenant security guarantee.
