# PyTorch: design and verification record

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Mode: full. Revision: 1. Author: root agent. Complete content, runtime labs,
native/model checks and independent source review; final browser integration complete.

## Scope, prior coverage and progression

Keep title/ID `PyTorch` / `pytorch`: the name accurately covers the framework
workflow without making each API a separate topic. No existing published body
or blueprint exists. Preflight on 28 September 2026 reports the planned future
topic Tensor Shapes, Autograd Graphs & Device Boundaries as prerequisite; it is
not yet taught, so this lesson supplies the needed shape/storage/graph/device
bridge locally. Backpropagation already teaches a full NumPy autodiff engine;
reuse its chain-rule explanation rather than write another general AD engine.
Here the new scratch work is an efficient vectorized two-layer classifier,
explicit gradients and SGD, with a matched PyTorch module/optimizer route.

Anchor: carry chemical-measurement rows through a small classifier and identify
who owns storage, gradients, parameters, mode and saved state. Use constructed
two-row arithmetic to make each operation inspectable; reuse the exact offline
UCI Wine CSV from Neural Training Diagnostics for a complete real-data workflow.
First pass: sections 1–7 and the runnable Wine program; sections 8–9 provide
researcher extension/diagnosis; finish independent practice and readiness.

| Hurdle | Support in lesson | Learner demonstration |
| --- | --- | --- |
| Shape is an indexing contract, not meaning | Label rows/features/classes, matrix-product shape and target broadcast counterexample | Fix `[B,1]` versus `[B]` loss broadcasting |
| Shape differs from storage | Six-slot base storage and transposed view/copy with explicit address mapping | Explain which base entry a view edit changes |
| Forward, backward and update are separate | Same two-row fit, per-row residuals/contributions and immediate weight/loss consequences | Derive the exact first step and diagnose accumulation |
| Module owns registered state | Tree of parameters, buffer and ordinary attributes; model/loss/optimizer responsibilities | Register a parameter and retain preprocessing |
| Loss conventions must match | Stable softmax-CE, all matrix shapes, mean derivative and paired one-step check | Modify width/reduction and preserve gradient agreement |
| Training mode differs from gradient recording | Fixed-randomness dropout route and independent grad-mode control | Explain eval+grad and train+no-grad separately |
| Device/dtype and checkpoint state are contracts | Explicit transfer boundary, CPU execution, reusable full program and exact predictions after reload | Restore state/standardizer and explain restart limits |
| Custom differentiation versus optimization | Tested custom cubic, gradcheck, functional gradient/HVP extension | Test a deliberately wrong derivative away from nondifferentiable points |

## Visual/lab specifications

1. Storage lab, section 2: base `[[1,2,3],[4,5,6]]`, transposed shape `[3,2]`.
   View strides `[1,3]`, contiguous-copy strides `[2,1]`. Edit `[1,0]` using
   numeric/range control; base address 1 changes only for the view. Show six
   physical slots and three two-cell logical rows, highlights plus address text,
   original versus result. Switching mode recomputes this one operation from the
   fixed base, rather than pretending a clone remains linked. Default value 9
   proves aliasing; the restore-value control sets the null case 2. Reset restores mode/value. Stack panels
   on phones; CSS cells carry text, no scaled-down labels.
2. Gradient lab, section 3: `x=[1,2]`, `y=[2,4]`, `w=1`, mean half-square loss,
   learning rate .1. Display both residual arrows, gradient contributions,
   objective and actual proposed parameter update. Weight, LR, sum/mean and
   repeated backwards on fresh forward graphs at unchanged weight are editable.
   Default g=-2.5, updated w=1.25. w=2 is zero-gradient case; LR1 makes the mean
   loss worse. Detaching this entire one-parameter output means backward raises
   (there is no differentiable loss), not a zero gradient or successful step.
3. Mode lab, section 6: four activations `[1,2,3,4]`, fixed uniforms
   `[.1,.4,.7,.9]`, keep when u>=p. Separate train/eval and grad enabled/disabled.
   p slider .0–.9 changes active gates and retained scale `1/(1-p)`; p0 is
   identity. Diagram shows inputs, keep/drop gates, outputs and independent
   recording boundary. This deterministic inverse-CDF mask is illustrative of
   dropout, not the exact mask generated by torch's RNG for a particular seed.
4. Inline ownership/flow diagrams expose the model's state tree and the
   forward→loss→backward→step→clear cycle, with arrows and shapes. No generic
   prose-card substitutes or hidden teaching disclosures. Quantitative browser
   models are pure bounded calculations, not browser PyTorch execution.

## Research and coverage decisions

Primary sources inspected 28 September 2026:

- PyTorch Learn the Basics: https://docs.pytorch.org/tutorials/beginner/basics/intro.html
  — canonical coverage map: tensors, data, transforms, modules, differentiation,
  optimization, save/load. Include these; deeper distributed/accelerator work
  belongs to Training Acceleration and GPU modules.
- https://docs.pytorch.org/docs/2.14/notes/autograd.html — DAG and mode contracts;
  detach, leaf gradients, fresh graphs and backward accumulation.
- https://docs.pytorch.org/docs/2.14/tensor_view.html — strides, aliasing,
  contiguous copy and reshape's non-guaranteed ownership.
- https://docs.pytorch.org/tutorials/beginner/nn_tutorial.html — incremental
  replacement of hand calculations with Module, Linear, optimizer and loader.
  Adopt the inspect-then-abstract teaching decision, using original Wine code.
- https://docs.pytorch.org/tutorials/beginner/introyt/autogradyt_tutorial.html
  — companion text to the official video series, inspected as text rather than
  claiming video viewing. Offer the graph walkthrough as an alternative route.

No timing points or performance rankings will be invented. CPU library checks
use the available Python3.12.14 / NumPy2.3.5 / PyTorch2.14.0+cpu environment.
Compilation, CUDA timing and distributed training are boundaries linked onward;
no GPU execution is claimed. A real dataset is already retained and licensed at
`public/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv`;
the preceding topic owns its provenance. Both scratch and library routes must
use matching arrays, float64, initial state and loss before interpreting errors.

## Verification plan and current handoff

Author: analytic two-row checks, tensor alias/copy native comparisons, numerical
gradient finite differences plus exact same-state autograd parity, deterministic
train/validation/test splits and checkpoint round trip. Then independent review
separately examines concept transitions and technical correctness. Browser:
desktop/390/320, keyboard/range/numeric controls, changed and null cases, reset,
all inline diagrams/code, actual section links and downloads. Parent integrates
publication/blueprint/ledger and checks production lazy loading and sequence.

Native verification is retained in `native-evidence.json`: exact loss parity,
maximum gradient error 1.11e-16, maximum update error 6.94e-18, finite-difference
checks of changed weights/biases, finite extreme-logit loss, native gradient
fixtures and checkpoint reload difference zero. `scripts/verify-pytorch-models.mjs`
passes comparison with the native fixtures, ownership/null/mode boundaries.
`independent-review.md` separately records conceptual/correctness review by
frameworks_annotation_modalities and closure of the hidden-practice-prompt finding.

The browser pass found and fixed narrow formula overflow by splitting equations
into aligned lines and containing any remaining math overflow within the topic.
Sources replaced a deprecated checkpoint recipe with the current saving/loading
tutorial; alternatives use semantic lists. These presentation/reference changes
do not alter native computation.
