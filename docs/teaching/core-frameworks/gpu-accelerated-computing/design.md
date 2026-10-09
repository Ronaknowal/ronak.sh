# GPU-Accelerated Computing

28 September 2026 · full mode · stable ID `gpu-accelerated-computing`.

## Scope, continuity and content boundary

Preflight: planned/unpublished; no prepared packet or active destination note. Own framework-entry GPU reasoning, explicit finite float32 elementwise kernel, residency and timing. Reuse NumPy indexing/arrays and PyTorch's existing tensor/device program; do not rebuild autograd, matrix multiplication or a GPU architecture course. Later GPU Engineering owns CUDA cooperation, tiling, reductions, profiling/roofline and Triton in depth. Title is appropriate. Visualization supplies evidence/measurement discipline; Vector Databases follows in module order; Tensor Shapes later separates shape/storage/gradient/device contracts.

Complete manuscript saved in `src/learn/data/topics/gpu-accelerated-computing.jsx`; complete canonical programs saved in `public/learn-code/gpu-accelerated-computing/`. This is the content checkpoint before labs/runtime verification. No native GPU result is claimed. Parent owns phase/registration and final browser integration.

## Research and teaching decisions

Official CUDA Best Practices, NVIDIA Mark Harris grid-stride article, CuPy RawKernel/user-defined kernels/performance/install, PyTorch pin-memory/nonblocking tutorial, Compute Sanitizer and Nsight Compute docs consulted. Current stable CuPy docs identify 14.2; CPU environment has no CUDA GPU. Dates of teaching source and current API are kept separate. Use the article's parallel-loop explanation, then add a single-writer proof and the explicit pointer/dtype contract. Avoid unsupported speed advice or fabricated benchmark curves. Code expresses a complete kernel as well as ordinary NumPy/CuPy use; a cost model alone would not satisfy scratch ownership.

## Concept-by-concept representation contract

- Host/device journey: named host input → copy → resident operations → copy → host output. Compare stage-by-stage copying with resident chaining; arrows show dependencies, not a timing scale.
- Indexing: size 19, two blocks, four threads gives thread 2 indices 2/10/18. Controls size 1–32, blocks 1–4, threads 2/4/8; selected global thread. Group cells by block/thread, show visit indices, highlight its actual output positions. At N=1 most threads are inactive. Changing geometry recomputes ownership; reset restores the canonical case. This maps logical identity, not execution order.
- Cost: explicitly hypothetical additive model; elements 1,000–1,000,000, stages 1–20, host GB/s 1–64, device GB/s 50–2000, launch μs 0–40, residency/fusion switches. Baseline copying/unfused compared with current choice. Each stage has three kernels or one; each kernel accounts for one full read and write. Host transfers are two per stage or two total. Exact bytes/kernel count plus common-scale term bars; no artificial minimum nonzero widths. Exclude compute/cache/overlap/allocator/startup/contention. At one stage residency changes nothing; at zero launch cost that term vanishes. Defaults 650 μs versus baseline 2950 μs, not measurements.
- Code: grid-stride CPU traversal vs NumPy, then CUDA pointer kernel vs CuPy expression. Native branch checks tail/reuse sizes before timing. CPU checks do not certify compilation/scheduling/device access. Tolerance permits multiply-add contraction; no implicit fallback swallows CUDA failures.

## Practice, evidence and limits

Four independent exercises: writer inversion, changed traffic accounting, benchmark repair, new clamp kernel. Teaching/code stays visible; hints and solutions remain disclosures. Annotated alternatives contain substantive primary tutorials rather than an unevaluated video dump.

Planned checks: indexing over many configurations, CPU parity including tails/zero; invalid input rejection; closed-form traffic/null cases; source links/syntax. CUDA compilation/parity/timing remain hardware-unavailable. Parent performs rendered controls, mobile/desktop, copy/download and production integration; independent reviewer supplies complementary source review. Record actual results and hashes after runtime implementation.

## Author implementation checkpoint

Runtime imports resolved: GpuComputingLabs.jsx and gpu-computing-models.js, scoped neutral stylesheet. CPU programs passed 36 built-in configurations plus 96 changed scalar/array NumPy comparisons; invalid dtype/layout/nonfinite cases reject. JavaScript checks passed 972 launch configurations plus default accounting and null cases. Commands: `node scripts/verify-gpu-computing-models.mjs`; `scratch/framework-lesson-runtime/Scripts/python.exe -B scripts/verify-gpu-computing-native.py`. Source-bound receipt in native-evidence.json. Author read-through checks mechanism continuity, pointer contract, declared costs and changed practice cases. CUDA execution remains unavailable. Independent review and parent rendered/integration checks remain.
