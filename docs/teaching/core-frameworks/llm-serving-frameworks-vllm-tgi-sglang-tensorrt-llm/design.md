# LLM Serving Frameworks — design and evidence

Full mode,28 September2026; author frameworks_training_data. Exact preflight ID retained, planned/unstarted; no destination note. No new topic/title needed. Manuscript `src/learn/data/topics/llm-serving-frameworks-vllm-tgi-sglang-tensorrt-llm.jsx`; three complete programs in matching public/learn-code directory. Parent owns central phases/integration.

## Contract and coverage

Begin with simultaneous document-assistant requests, not engine names. Reuse Self-Attention's q/k/v weighted read and Fine-Tuning Platforms' random tiny Llama/shifted-token model; inspect both local sources. New mechanisms are inference cache lifetime, fixed-size page accounting and logical sharing, bounded scheduling/admission, engine configuration and transport. Full distributed kernels, architecture-specific compressed caches and queueing derivations are explicit later boundaries, not claimed implementations. No dataset-fit outcome: constructed requests expose causality without pretending to be a production workload or throughput benchmark.

| Hurdle | Teaching / representation | Implementation and assessment |
| --- | --- | --- |
| Prefill versus decode | Prompt→first output→incremental read figure; three-token trace | Seven-position cache versus full attention/model logits |
| Cache memory/lifetime | Derived bytes/token; populated prefix and mask trap | Preallocated scratch cache and standard SDPA/Transformers route |
| Paging and sharing | A5/B3 four-slot blocks and map, changed prefix | page_plan,9/6 shared5 exercise |
| Admission/iteration | Three-request P/D trace and first-token boundary | Complete scheduler; editable long prompt/arrival/budget |
| Platform choices | Contracts table, dated maintenance/backend treatment | Actual local HTTP client; hardware deployment explicitly unexecuted |
| Measurement | Latency units, overload, cancellation and quality | Independent workload-design practice |

## Visual specifications

Phases figure: semantic wrapping HTML, request→template/tokens→prefill/cache→decode→finish/release. Show final prefill yields first output; no invented speed axis.

CachePagesLab: A/B lengths1..12, block2/4/8, assumed common prefix0..12 clamped to shorter actual sequence. Full shared blocks=floor(min(prefix,A,B)/block). Show two logical rows with physical page IDs and filled slots, unique physical page count, allocated slots, useful positions and slack. Initial5,3,4,0 =>3pages/12capacity/8useful/4slack. Larger prefix cannot share partial blocks. Text identifies shared page IDs without relying on color; pages wrap at320px. Reset all; immediate current result.

ServingScheduleLab: A arrival0/prompt1..10/output3; B arrival0..4/prompt2/output2; C arrival2/prompt1/output2. Budget1..8; resident limit2; fixed versus continuous admission. Exact Python policy: admit at beginning, existing decodes first, remaining budget chunked prefills; final prompt logits produce first output. Each visible iteration lists Pn/D1 per request, current row inspection with number/range control, first/finish/TTFT table. Initial continuous finishes A4/B3/C5, BTTFT1; fixed A4/B6/C6 BTTFT4. Iterations are work units not elapsed milliseconds; all outputs immediate, inspector selects existing computed state, resetall. Grid locally scrolls when needed; labels and explanation stay HTML.

## Research and decisions

Primary documentation/paper bodies reviewed28September2026: PagedAttention paper (canonical memory/dynamic batching/sharing baseline); vLLM latest optimization, APC and serving pages; SGLang request guide; TGI landing maintenance notice; TensorRT-LLM quickstart; Transformers cache explanation. Deep kernels/quantization/speculation are named and routed, not advertised locally. No historical paper performance multiplier is reproduced as current evidence. TGI maintenance status is explicit; TensorRT-LLM uses current LLM/server framing rather than assuming old engine-build requirements. Further learning links are paper and worked tutorial; no unreviewed video endorsement.

Content checkpoint: complete manuscript, explained complete programs and actionable visual contracts ready; runtime labs/native author campaign next. Source is the manuscript; no duplicate draft. Next action at checkpoint is implementation, not new research scope.

## Author review and current handoff

Native cache parity, one-output final-prefill boundary, invalid scheduling parameters, complete-prefix page sharing and real local HTTP protocol fixture all passed. The HTTP reply is explicitly a protocol fixture, not engine output. Pure model domain checks passed 25,650 assertions. Native environment: Python3.12.14, torch2.14.0+cpu, Transformers5.17.0. No GPU or native serving engine executed. See native-evidence.json for exact executed outputs and hashes. Complete runtime laboratories now implement the above specifications.

Author heuristic learning-experience review: first-pass route and prerequisite bridge are grouped at the opening; all teaching and code are visible; exercises retain independent hints/solutions. The inline visual pass follows each mechanism through its actual intermediate representation: cache page identity and P/D boundaries; query-term score contributions and admitted evidence; proposal/approval route and separate effect/checkpoint states. Units and evidence categories are explicit. No learner study or independent review is claimed by this author record. Root owns rendered checks; independent reviewer receipt is separate.

Scoped author corrections: readable lab/model source formatting with existing Babel tooling, exact catalogue prerequisite titles, explicit sidebar-independent neutral stylesheet import. Numerical checks repeated after runtime formatting and passed; unchanged native public programs reuse their recorded execution. Source identity is in author-source.json. Root reported completed browser control/theme/narrow checks, including semantic changed cases (prefix sharing, fixed admission, empty query, over-reservation, rejected action and duplicate-effect recovery). Root final integration and independent source-review receipt govern final ledger promotion. No native rerun is required for these unchanged programs.

## Rendered evidence observed

Root performed browser interactions and semantic assertions. The author separately inspected representative actual captures: serving cache pages at320px; retrieval contribution cards on desktop; workflow replay changed state on desktop and default at320px. Labels, controls, source links and state summaries are legible in those captures; wide trace tables remain locally scrollable. No additional source correction was needed. Root evidence directories are scratch/core-frameworks/retrieval-browser and scratch/core-frameworks/execution-browser pending selected-evidence retention. These observations do not claim an independent learner study.
