# TensorFlow & Keras — authoring and review

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Full mode; new planned lesson, stable title/ID retained. Preflight 28 September 2026 found no destination note. Canonical full source: `src/learn/data/topics/tensorflow-keras.jsx`. Written complete programs: `public/learn-code/tensorflow-keras/{tensorflow_keras_training,tensorflow_tape_diagnostics,keras_custom_fit}.py`. The increment owner records the content checkpoint before runtime implementation.

## Contract and continuity

Teach one coherent computation at manual array, tape, model and fit levels. Reuse the actual backprop lesson/teaching engine for graph accumulation and mini-batch lesson for reduction mathematics. Local ownership: matrix affine gradient, custom tracked layer, explicit training loop, same-state fit parity, custom train_step, tape disconnect probes, metric state and deterministic save/reload continuation. A compiler/distributed runtime is not a promised local implementation. Calibration fixture is constructed for exact semantic parity, not a real-data model study; point to the already complete real-data diagnostics owner instead of another unmotivated dataset fit.

| Hurdle | Written support | Representation / check | Outcome evidence |
| --- | --- | --- | --- |
| Backend vs interface | §1 responsibility ladder, explicit TensorFlow backend | Ownership table | Explain when to customize a step |
| Tensor/Variable/tape/update | §2 numeric affine update, shapes | Owned-state flow | Manual vs tape vs fit parity |
| Same value/different derivative | §3 connected/detached squared branch | Live TapeLab; w=2 gives loss8, derivatives8/4 | Practice A; native probe |
| Layer state / model graph | §4 build/add_weight/call, object sharing | Runnable custom layer and functional graph | Practice C |
| Objective/reduction conventions | §5 mean-half-MSE; §8 full-MSE/rate change | Same first state across routes | Native first/final update checks |
| Pipeline units/order | §6 element→batch→prefetch, cache placement | Explicit finite pipeline in full program | Metric lab and B |
| Metric vs optimization state | §7 reset/weighted sum, trainable/training split | Live two-batch count-and-sum lanes | B; diagnostic output |
| Custom step and tracing | §8 complete custom-fit program; tf.function inputs | Explain variable creation and None dimension | Library parity |
| Saving vs exporting vs restart | §9 complete registered class/function | Actual archive reload and next update | D extension |

## Visual contracts

- **TensorFlowOwnershipFigure**, §2: semantic flow of Variables → recorded forward/loss → gradients → optimizer assignments. Labels identify what changes and what stays; natural wrapping without SVG paragraph positions.
- **TensorFlowTapeLab**, §3: w in [−4,4], mode connected / stop-gradient. Both forward squared branches have value w², total 2w². Reverse contribution from each is 2w unless detached. Display visible forward value and branch derivative next to an unambiguous solid versus dashed/cut path; not just an answer box. Reset w2/both connected; boundary0 correctly hides contrast, signed negative w checked. Exact table/text complements visual; label that this computes declared equations, not browser TensorFlow.
- **TensorFlowMetricLab**, §6: editable counts n1,n2 in[1,8], mean losses m1,m2 in[0,10]. Show each batch as n identical-loss example marks (constructed), sums n*m flowing to total/count. Compare correct example mean with unweighted batch mean and interpret count difference. All values update immediately. Null: equal sizes or equal means. Default 2×2 and1×8 → correct4/wrong5. Common fixed per-example loss scale0–10. Count marks are bounded; reset restores all. Keyboard numeric/range controls and reflowing two panels.

## Research

28 September 2026, official body/code reviewed: Keras getting started, built-in training, custom training loop, layer/model subclassing, saving/serialization; TensorFlow function, autodiff and tf.data performance guides. Canonical guide coverage includes layer ownership, functional models, tape, objectives/metrics/regularization, pipelines, custom fit, tracing and saved artifacts. Functional API and data-performance guides are annotated alternate explanations, not claims of watched videos. Distributed and mixed-precision reduction are deliberate linked deeper boundaries, not promised implementations here. Source-based custom-fit API checked against the installed Keras3.15.1/TensorFlow2.21.0 CPU environment.

## Stage state

Content and runtime implemented. `node scripts/verify-tensorflow-models.mjs` passed signed/zero connected and detached gradients and81 independently expanded unequal-batch metric fixtures. `scratch/framework-lesson-runtime/Scripts/python.exe -B scripts/verify-functional-frameworks.py --topic tensorflow-keras` passed all three complete programs on Python3.12.14/TensorFlow2.21.0/Keras3.15.1 CPU. Manual/tape/fit state parity,40-step loss0.000109236818, one function trace, saved archive reload and next-update parity all passed. Tape-disconnect and metric-reset results match the manuscript; custom fit matches ordinary fit. Its same-data output is explicitly named `fixture_evaluation`, closing the reviewer’s misleading validation-name finding. Full outputs and canonical hashes are in `native-evidence.json`.

Author teaching review checked the responsibility ladder, concrete state transitions, branches with equal values/different derivatives, metric weighting, trainable/training distinction and explicit serialization boundary. Programs are fully visible/downloadable through the shared reader. Parent browser inspection found mobile formula overflow and absent neutral CSS loading; formulas now use aligned lines and scoped containment, and labs explicitly load the neutral stylesheet. Exact catalogue prerequisite spelling is corrected. These are authored corrections, not claims that the rebuilt browser was already checked.

Independent source review is complete in `independent-review.md/json`, including closure of the fixture-evaluation wording. Parent reports the rebuilt browser sweep passed. I inspected both labs' desktop,320px and changed screenshots: two branch cards stack without overlapping labels, detached paths have a clear cut marker, signed derivatives agree with their changed input, batch bars retain the fixed loss scale and the equal-count/equal-mean null updates visibly. Controls use the neutral/amber theme. Wide comparison tables stay within their narrow scroll region. These are direct screenshot observations, separate from the parent's executed interaction checks.

Content, runtime, author/native checks, independent source review and screenshot inspection are complete. Remaining parent integration work is final browser/build/load-boundary evidence binding and central ledger closure. No GPU/distributed execution or observed learner acceptance is claimed. Preserve unchanged native evidence.
