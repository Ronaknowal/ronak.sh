# JAX — authoring and review record

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Mode: full. Stable ID/title retained. New planned topic, no old lesson body to conserve. Preflight read 28 September 2026: no destination note; resolved bit-manipulation inbox is unrelated. Scope: transform and control a complete numerical training program, not rebuild a compiler or survey every JAX ecosystem project.

## Content checkpoint

The complete learner manuscript is `src/learn/data/topics/jax.jsx`; programs are `public/learn-code/jax/jax_functional_training.py` and `jax_transform_diagnostics.py`. The source contains the actual explanations, code, exercises/feedback and annotated resources. Visual contracts below complete the content handoff. Implementation and browser/independent review remain separate until evidence is recorded. The increment owner records source hashes in the central ledger.

## Continuity, coverage and teaching decisions

Inspected NumPy source (`numpy-arrays-broadcasting-vectorization.jsx`) for arrays/shape ownership, and `backprop.jsx` for scalar/reverse graph accumulation, broadcasting and the linked `teaching-autodiff.py` engine. JAX reuses the derivative mechanism, locally owns the affine loss/manual gradient and tree momentum/update implementation, and teaches the real library transforms and Optax bridge. It does not claim to implement XLA. The constructed four-point calibration case isolates framework semantics; no empirical generalization claim or additional real dataset is needed for this framework workflow.

Canonical coverage: JAX Quickstart/101 plus transformation, pytrees, random, JIT, benchmarking guides read. Include array value semantics, shapes/dtypes, grad/value_and_grad, shared/mapped axes, pytrees/state, tracing/static configuration, fixed-shape masks, scan, explicit PRNG keys, JVP/VJP and synchronization. Device sharding/custom kernels are explicit deeper destinations rather than unimplemented promises. Dedicated existing JAX tracing and PRNG topics retain deeper ownership. No title expansion is necessary.

| Hurdle | Concrete bridge / owner | Visual and interpretation | Practice |
| --- | --- | --- | --- |
| Function vs transformation | §1 same calibration function, four questions | Three-row function/result mapping | B |
| State vs hidden mutation | §2 input/carry/output and pytree leaves | State lanes show parameters, velocity, key returning | D |
| Gradient vs update | §3 four residual and weighted-contribution rows | Live contribution bars and next-state loss | A |
| vmap axes | §4 shared parameters vs mapped data; mean correspondence | Same rows as gradient lab, explicit in_axes | B |
| Tracing vs executing | §5 recipe needs static layout but actual numbers vary | Signature-card cache lab with value/shape/static controls | C |
| Fixed shape/control flow | §5 failed selection, mask/count and scan repair | Trace signatures and visible example arithmetic | C |
| Stateful optimizer | §6 simultaneous tree momentum vs Optax; pre/post loss | Carry figure and full executable | D |
| Randomness | §7 key split/reuse and batched-vs-split distinction | Visible three-line branch flow in code | D extension |
| Derivative products | §8 scalar cubic directional example, forward vs backward | Exact worked values 8 and 6 | Native independent probe |
| Performance/debugging | §9 tracing instrumentation, warm synchronized boundary | Explicit diagnostic program and bottleneck decisions | Program modification |

## Visual / lab contracts

1. **JaxStateFigure**, §2: read-only semantic HTML flow. Inputs p/v/key → a pure step → p′/v′/key′. Vertical stack on narrow screens; arrows denote dependency, no geometric quantity. Captions distinguish the output assignment from mutation. Same state names as code.
2. **JaxGradientLab**, §3: editable w in [−2,4], b in [−2,4], η in [0,1]. Fixed four calibration rows. Current predictions/residuals/g_w/g_b/half-MSE and one-step preview always visible. Per-item r*x contributions on fixed signed axis; HTML table provides exact values. Controls alter current p; update preview recomputes from one pre-update state. Initial L=5.5, g=(−5,−1), next=(.5,.1), nextL=3.2175. Zero gradient fixture (2,1), zero-rate fixture; large-rate case can increase loss. Reset all controls. Slider and numeric keyboard twins via NeuralNumber. No learner answer entry.
3. **JaxTraceLab**, §5: executable cache-signature model for one function identity and fixed device. Editable numeric input values update a squared-sum output immediately. Shape length 2–8, dtype float32/float64 and a marked-static reduction choice determine a signature. A call records hit/miss and updates a bounded history; no artificial time or actual-browser JAX claim. Editing numbers reuses a recorded signature; new shape/dtype/static setting misses; returning to a prior signature hits. Reset clears history and restores initial result/signature. Cards reflow; precise cache key and call history remain accessible in HTML.

All lab quantitative values are exact JS calculations for stated equations (floating-point rounding displayed), not measured performance. Native programs independently compare manual gradients, transformed gradients, per-example mean, scratch momentum, Optax, JVP/VJP, actual trace reuse and masks. No green series. Long explanatory labels stay in HTML; compact contribution geometry has a fixed scale and exact-value companion.

## Research / claims

Primary pages and notebook bodies reviewed 28 September 2026, not videos: [Quickstart](https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html), [vectorization](https://docs.jax.dev/en/latest/automatic-vectorization.html), [JIT](https://docs.jax.dev/en/latest/jit-compilation.html), [pytrees](https://docs.jax.dev/en/latest/pytrees.html), [random](https://docs.jax.dev/en/latest/random-numbers.html), [benchmarking](https://docs.jax.dev/en/latest/benchmarking.html). Useful teaching decision: use one function under several transformations, then expose state explicitly, instead of unrelated API snippets. Original calibration fixture/derivation and code are authored here. Autodidax is an advanced alternate route, not a claimed watched video. No unsupported popularity ranking or benchmark.

## Author verification and current continuation

Runtime implemented. `node scripts/verify-jax-models.mjs` passed exact initial/fit/zero-rate gradients, signature/value behavior and the reachable η=1 overshoot (loss11.25 versus5.5). `scratch/framework-lesson-runtime/Scripts/python.exe -B scripts/verify-functional-frameworks.py --topic jax` passed both complete programs on Python3.12.14/JAX0.11.2/Optax0.2.8 CPU. Manual gradients, per-item reduction, transformed gradients and scratch/Optax momentum agree; the40-step loss is0.00024637798. Actual tracing reuses shape4 when values change and retraces shape5; JVP/VJP and fixed-shape masking pass. Source hashes and full output are in `native-evidence.json`. Raw synchronized timings are diagnostic observations, not a framework performance ranking.

Author teaching review found every promised local mechanism connected to its worked state, executable route and changed practice. Explicit controls cover parameter edits, fit/zero/overshoot cases and static signature changes. Reviewer requested making the overshoot fixture reachable; the rate control now extends to1 and the model checker covers it. Parent browser inspection found mobile formula overflow and missing neutral CSS loading; scoped aligned formulas, contained KaTeX and explicit neutral stylesheet imports are applied for the parent to recheck. This paragraph is author evidence, not independent acceptance or a learner study.

Independent source review is complete: `independent-review.md/json` records the complementary checks and closure of the reachable-overshoot finding. The parent reports the rebuilt interaction/mobile sweep passed. I inspected both labs' final desktop,320px and changed-state screenshots in `scratch/core-frameworks/browser/`: controls and text remain legible, signed bars retain the same scale, narrow layouts stack controls and keep wide tables in their scroll region, and new signatures/current values are distinct from recorded history. Neutral/amber surfaces are present without green decoration. These are screenshot observations; the actual interaction run belongs to the parent's browser receipt.

Content, runtime, author/native checks, independent source review and author screenshot inspection are complete. Remaining integration bookkeeping belongs to the parent: bind final browser/build/load-boundary evidence and update the ledger. No accelerator, distributed or browser-JAX execution is claimed. Reuse native evidence while canonical program hashes remain unchanged.
