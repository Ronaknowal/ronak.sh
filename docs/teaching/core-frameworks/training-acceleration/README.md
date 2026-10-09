# Training Acceleration — authoring and review

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Mode: full. Revision 1, 28 September 2026. Author: frameworks_training_data.

## Content checkpoint

The complete manuscript is `src/learn/data/topics/training-acceleration.jsx`; explained programs are `public/learn-code/training-acceleration/accumulation_bridge.py` and `checkpoint_bridge.py`. Original topic was planned with no published body or brief. Title retained: acceleration means preserving a defined training experiment while changing execution, not a product ranking. No pending destination note existed; resolved unassigned bitwise note is irrelevant.

Prerequisite source inspected: Mini-Batches sections 3–8 and its train_iris.py contract; Training Diagnostics source sections 1–4; Transfer Learning sections 4–6. Reuse autodiff and optimizer engines rather than silently claiming to reimplement them. Exact reuse links are in the manuscript.

| Hurdle | Teaching location / mechanism | Evidence opportunity |
| --- | --- | --- |
| Bottleneck is not a package name | §1 lifetimes and execution flow | Choose an intervention from resource ownership |
| Unequal group means change weights | §2 hand trace, summation loop and weighted-chunk lab | Analytic derivative and three execution routes |
| Physical and effective batch differ | §3 batch-dependent operations and distributed denominator | Counterexamples and changed grouping exercise |
| Activation versus persistent state | §4 recomputation and partitioned state | Memory budget, equal-share bounds and gradient parity |
| Dtype and compilation change execution | §5 numerical range and cold/steady state distinction | Reuse exact numerical owner; no unsupported benchmarks |
| Tool control and resumability | §6 settings/evidence mapping | Real Wine extension retaining original split |

## Visual specifications (written before runtime)

- **Execution/lifetime figure (§1):** reflowing HTML lanes show data → forward → backward → update. Weights and moments span steps; activations end after backward. Arrows show dependency, not elapsed time. Always visible; stack lanes on phones, no tiny SVG text.
- **Weighting investigation (§2):** initial x=[1,2,3,4], y=[2,0,1,3], w=.5; edit w and chunk size, exact derivative contributions shown per row with grouping, correct per-item weights versus mean-of-means. Immediate gradient and next-weight comparison; reset both controls. Microbatch size 4 is null; 3 exposes unequal weighting; 1/2 preserve mean. Step .1, w range −1..2. Text and cells reflow; no prediction UI.
- **Memory investigation (§4):** control parameter count, estimated activations, world size and ZeRO stage. Show separately sized weight/gradient/moment/activation bars, actual GB and unsharded baseline. Constants explicitly 4/4/8 bytes per parameter; partition stage only its defined state, activations local. Activation checkpoint toggle halves assumed activations as an illustrative estimate, not universal factor. Counts rounded only for display. Inputs 0.1–8 billion, 0–32 GB activations, 1–8 workers; reset. All-zero activation and world-size1 are null comparisons. Bar scale shared between baseline/proposed; annotate peak overhead exclusions.

## Research and scope decisions

Official current Accelerate accumulation tutorial, PyTorch AMP/tuning/checkpoint docs, DeepSpeed ZeRO tutorial, Lightning Trainer docs consulted 28 September 2026. Teaching inspiration: Accelerate's native→managed loop correspondence and PyTorch's bottleneck-first tuning. Full excerpts are not copied. All scalar/memory cases are original analytic fixtures. Real-data acquisition/learning is not this lesson's outcome; reuse the published diagnostics Wine program/data and fixed split for a practical extension. LoRA implementation belongs to next lesson; deep collective algorithms belong to distributed/GPU owners, not a hidden promised implementation here. No measured acceleration or hardware-memory claim.

## Checks and continuation

The content checkpoint was followed by runtime implementation, native checks and independent source review. Parent owns final browser/build integration and ledger closure. Detailed evidence follows; unchanged native experiments do not need to be rerun for presentation fixes.

### Author verification — 28 September 2026

- `node scripts/verify-training-acceleration.mjs`: 68 analytic assertions passed, including unequal/equal groups, boundary weights, state-partition stages and no-activation/one-worker nulls.
- Python 3.12.14, torch 2.14.0+cpu, Accelerate 1.15.0: `accumulation_bridge.py` produced gradient −0.5 and weights 0.55 for full/3+1/managed2+2; assertions compare an independent scalar derivative. `checkpoint_bridge.py` maximum forward and parameter-gradient differences were both zero.
- Source JSX parsed with esbuild. Internal mixed-precision link corrected against actual catalogue ID (`...fp16-bf16-tf32`). Source-bound results in `author-evidence.json`.
- Author learning review: all main transitions carry a question and worked consequence; the opening supplies a first route and exact reuse; unequal loss weights are visible before controls; memory hypotheses have explicit bounds rather than invented timings; all code is visible via shared controls; changed-input practice includes reasoned solutions. No learner testing was conducted. Memory/inference scope cautions have single homes and are not printed from programs. Every live control changes bounded analytic inputs, and reset restores all state. Runtime visual/browser and independent review remain integration responsibilities.
- Cleanup: no public caches or scratch screenshots were created. The isolated `scratch/training-frameworks-runtime` is a reusable dependency environment, not a disposable lesson artifact.

Independent source review is complete in `independent-review.md`. Next action: parent final browser/build binding and ledger closure.

### Rendered reading pass

Author inspected both labs' desktop, 320px and changed-state screenshots supplied by the parent. Displayed weights, row contributions, update values and memory terms agree with selected inputs. Neutral/amber styling is present. The 320px weighting cards were unnecessarily narrow, and the budget bars lacked a visible segment legend. Scoped fixes increase the group-card flex basis so prose stacks on a phone and label all four memory segments in order; neither changes numerical behavior. Author then inspected all six recaptures in `scratch/core-frameworks/final-corrections/`: weighting prose now stacks legibly at320px, the segment legend wraps clearly, and the changed gradients/memory totals remain correct. These visual findings are closed. The parent's executed interaction/reset/keyboard/code-control checks are separate evidence; no native experiment was repeated for this presentation change.
