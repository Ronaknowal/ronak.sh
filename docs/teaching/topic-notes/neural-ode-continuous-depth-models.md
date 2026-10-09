# Authoring notes: Neural ODE & Continuous-Depth Models

Canonical topic ID: neural-ode-continuous-depth-models

## 2026-09-22 — Add an ordinary solver API with a precise numerical contract

- Status: resolved for the solver-API content and executed implementation request; the separate revision-4 reading-flow revision remains in progress.
- Origin: [prepared Deep Learning implementation-depth triage](../implementation-depth/PREPARED-DEEP-LEARNING.md).
- Original triage finding (before this content revision): `neural_ode_study.py:54–99` implements differentiable Euler/classical RK4 and the models. Manuscript line823 explicitly says torchdiffeq documentation was reviewed but its package/examples were not executed; no odeint API program is supplied.
- Original triage request: Add a small complete torchdiffeq odeint example using the same field/state/time units, and explain time-grid, output shape, solver choice, tolerances or fixed step size, and direct-autograd versus adjoint route. Preserve the existing classical-RK4 code. Its tableau is not automatically identical to the package method named rk4; the manuscript already flags that difference.
- Verification and customization contract: Compare an analytically solvable field and a changed step/tolerance against exact values; inspect a parameter gradient and distinguish discretize-then-differentiate from continuous-adjoint approximation. Report numerical error/function evaluations where measured, not guessed speed. A default adaptive solver is not automatically suitable for stiff or discontinuous dynamics.
- Evidence and uncertainty: [torchdiffeq](https://github.com/rtqichen/torchdiffeq) and [FAQ](https://github.com/rtqichen/torchdiffeq/blob/master/FAQ.md), already cited by the packet. API/source research and explicit version targets are complete. The new program still needs actual package execution before reporting measured library agreement.
- Content disposition: prepared on 22 September 2026. The [new solver-control section](../drafts/neural-ode-continuous-depth-models/lesson.md#control-an-actual-solver-api-with-the-same-field) and [solver_library_bridge.py](../drafts/neural-ode-continuous-depth-models/solver_library_bridge.py) contain the complete torchdiffeq 0.2.5 route. Same-step Euler values/initial-state/parameter derivatives compare with the existing scratch integrator; adaptive direct/adjoint routes compare with an analytic exponential oracle. The written bridge distinguishes requested times, tolerances, the RK4 tableaus, derivative contracts, costs and a changed-rate exercise with reasoned solution.
- Historical resolution on 22 September: the missing **content** was written; package execution and implementation verification were then pending. This dated statement is retained as history, not a current task queue.
- Original implementation/verification links: [design and ownership map](../drafts/neural-ode-continuous-depth-models/design.md), [specialist content revision](../implementation-depth/PREPARED-SPECIALISTS-WRITING.md).

## Disposition checked 5 October 2026

The previously completed implementation executed the installed torchdiffeq 0.2.5 bridge and retained exact source-bound results. Its [independent review](../deep-learning-completion/neural-ode-continuous-depth-models/independent-review.md) explicitly records matched Euler, adaptive/adjoint and analytic-reference checks; [independent evidence](../deep-learning-completion/neural-ode-continuous-depth-models/independent-checks.json) binds the actual programme bytes and executed scope. No library run or scientific evidence was repeated merely to update this note's date. The September missing-API request is consumed.

The current [reading-flow revision](../deep-learning-beginner/neural-ode-continuous-depth-models/reading-flow-revision.md) preserves this complete bridge, explains requested clocks and output shapes, and distinguishes classical RK4 from the package's 3/8 tableau. That revision's new teaching and browser checks are separately pending in its record and ledger; resolution of this old request does not promote either current phase.
