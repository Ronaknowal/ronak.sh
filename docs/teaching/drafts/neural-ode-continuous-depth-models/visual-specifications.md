# Neural ODE: current reading-flow drawing and live-computation contract

Revision 4, 5 October 2026. This replaces the September content-first specification; its exact prior bytes remain in `deep-learning-beginner/original/ode-before-reading-flow`. The current manuscript, accepted reading-flow design, sources and ledger jointly define scope. This specification is an implemented candidate contract, not a completion claim or browser receipt.

## Reading order and representation

Follow the thirteen manuscript sections without moving a figure below its walk-through. Every structural transition establishes the new entities, draws their parts, works the operation, then formalizes it and connects code. Use the shared Deep Learning visual vocabulary: cyan supplied state/data, amber fitted parameters, violet computed values; gray forward wires, orange dashed backward sensitivity wires. Labels and line style carry meaning independently of colour. No figure cards, prediction gates or hidden instructional code. Topic-specific plane trajectories, numerical stages, coordinate plots, matrix rows, latent paths and probability patches are different because their mechanisms differ.

The scalar opening shows z=1, rate=-2, interval=.1, change=-.2, Euler=.8, exact=.818730753. The complete tiny neural field draws each supplied coordinate and actual hidden/output weight, bias, sum, tanh, derivative and state addition. Field, solver and readout are different operations. Rotation uses A=[[0,-1],[1,0]], initial [1,0], actual four RK4 probes and weighted accepted move, with exact reference. A derivative is not the next state. State and depth units are explicit.

## Full inline slot map

Every key occurs exactly once in the manuscript and resolves through the pure guarded renderer to the named semantic component. A code slot is full visible code with shared Copy feedback and Download, not a placeholder specification.

| Manuscript key | Runtime view |
| --- | --- |
| `decay-step` | `<OdeDecayStepDrawing />` |
| `tiny-field` | `<OdeTinyFieldDrawing />` |
| `field-solver-readout` | `<OdeFieldSolverReadoutDrawing />` |
| `rotation-field` | `<OdeRotationFieldDrawing />` |
| `rotation-euler` | `<OdeRotationEulerDrawing />` |
| `rk-stages` | `<OdeRkStagesDrawing />` |
| `fixed-matrix` | `<OdeFixedMatrixLab />` |
| `fixed-initial` | `<OdeFixedInitialLab />` |
| `fixed-resolution` | `<OdeFixedResolutionLab />` |
| `fixed-work` | `<OdeFixedWorkLab />` |
| `fixed-stage` | `<OdeFixedStageLab />` |
| `adaptive-estimate` | `<OdeAdaptiveEstimateDrawing />` |
| `adaptive-scale` | `<OdeAdaptiveScaleDrawing />` |
| `adaptive-attempts` | `<OdeAdaptiveAttemptsDrawing />` |
| `adaptive-rates` | `<OdeAdaptiveRatesLab />` |
| `adaptive-initial` | `<OdeAdaptiveInitialLab />` |
| `adaptive-tolerances` | `<OdeAdaptiveTolerancesLab />` |
| `adaptive-inspect` | `<OdeAdaptiveInspectLab />` |
| `stiffness` | `<OdeStiffnessDrawing />` |
| `discrete-reverse` | `<OdeDiscreteReverseDrawing />` |
| `continuous-reverse` | `<OdeContinuousReverseDrawing />` |
| `observation-adjoint` | `<OdeObservationAdjointDrawing />` |
| `gradient-comparison` | `<OdeGradientComparisonDrawing />` |
| `gradient-field` | `<OdeGradientFieldLab />` |
| `gradient-loss` | `<OdeGradientLossLab />` |
| `gradient-resolution` | `<OdeGradientResolutionLab />` |
| `reverse-conditioning` | `<OdeReverseConditioningDrawing />` |
| `nonautonomous-sensitivity` | `<OdeClockSensitivityDrawing />` |
| `program-sensitivities` | `<OdeVisibleProgram file="ode_sensitivities.py" />` |
| `solver-api-clocks` | `<OdeSolverClocksDrawing />` |
| `ordering` | `<OdeOrderingDrawing />` |
| `lift` | `<OdeLiftDrawing />` |
| `lift-points` | `<OdeLiftPointsLab />` |
| `lift-readout` | `<OdeLiftReadoutLab />` |
| `order-numerical` | `<OdeOrderNumericalDrawing />` |
| `parameterizations` | `<OdeParameterizationsDrawing />` |
| `study-histories` | `<OdeHistoryDrawing />` |
| `worked-study` | `<OdeWorkedStudyDrawing />` |
| `study-model` | `<OdeStudyModelLab />` |
| `study-feature` | `<OdeStudyFeatureLab />` |
| `study-solver` | `<OdeStudySolverLab />` |
| `study-trace` | `<OdeStudyTraceLab />` |
| `study-projection` | `<OdeStudyProjectionLab />` |
| `study-field` | `<OdeStudyFieldLab />` |
| `study-stage` | `<OdeStudyStageLab />` |
| `study-readout` | `<OdeStudyReadoutLab />` |
| `observations` | `<OdeObservationDrawing />` |
| `observation-events` | `<OdeObservationEventsLab />` |
| `observation-propagation` | `<OdeObservationPropagationLab />` |
| `observation-assimilation` | `<OdeObservationAssimilationLab />` |
| `latent-inference` | `<OdeLatentDrawing />` |
| `event-rate` | `<OdeEventRateDrawing />` |
| `density-patch` | `<OdeDensityPatchDrawing />` |
| `density-accumulator` | `<OdeDensityAccumulatorDrawing />` |
| `trace-probe` | `<OdeTraceProbeDrawing />` |
| `regularizer-accumulators` | `<OdeRegularizerDrawing />` |
| `conditional-paths` | `<OdeConditionalPathsDrawing />` |
| `conditional-mean` | `<OdeConditionalPathsDrawing mean />` |
| `known-correction` | `<OdeKnownCorrectionDrawing />` |
| `hamiltonian` | `<OdeHamiltonianDrawing />` |
| `solution-residual` | `<OdeSolutionResidualDrawing />` |
| `event-reset` | `<OdeEventResetDrawing />` |
| `controlled-stochastic` | `<OdeControlledStochasticDrawing />` |
| `reversible-step` | `<OdeReversibleStepDrawing />` |
| `program-calculations` | `<OdeVisibleProgram file="ode_calculations.py" />` |

## Shared live cases and controls

Five bounded mathematical cases are shared across their dependent views: fixed 2D field, adaptive two-rate solve, scalar gradient comparison, lifted representation and irregular observation updates. Each figure has one to three directly related, previously taught controls below it. Pin stores the entire case, Reset restores all values, Restore reinstates the entire pinned case; all increment a reset epoch so invalid drafts clear even when defaults were already active. A valid edit immediately recomputes every dependent current view. Invalid text or impossible event order leaves the last valid computation clearly identified; it must not silently clamp or pair new input with old output. Coordinate/row inspection changes what is viewed, not the underlying computed model.

Fixed field starts [[0,-1],[1,0]], state [.6,.8], depth1.2, 8 classical RK4 intervals. Matrix, initial state, depth, interval count, method and selected step/probe are whole-case values. Plane arrows show the local derivative, exact path and accepted path use distinguishable styles, and all tentative stage states affect the extent. Complete coordinate traces and a selected stage expose values omitted from a projection.

Adaptive starts rates[-2,-50], state[1,.3], depth.4, relative .01, absolute .0001. Euler/Heun comparison, per-coordinate scale, standardized residual, RMS ratio and actual acceptance/rejection are visible. The controller is .9*r^(-1/2), bounded [.1,5], zero ratio multiplies by5. Rejection preserves state and time. All attempts remain available to the selected-attempt control; only an eleven-row window around the selection is mounted, so a difficult case does not create ten thousand DOM rows. At most10000 attempts, with underflow/overflow explained and last valid output retained. The historical rates[-1,-100] case still has58 accepted/4 rejected/124 field evaluations at the preserved tolerances. Local estimated error is not a promised global-error bound.

Gradient starts rate .3, state .8, target1, depth .7, 3 intervals. Distinguish derivative of the finite executed method, centered finite difference, exact continuous objective and a numerically reversed continuous-adjoint estimate starting from the finite endpoint. Identity/direct state sensitivity, actual negative clock direction, terminal residual and reconstruction are drawn, not collapsed into a final number. The nonautonomous supplementary programme uses actual positive/decreasing/equal clocks and full state/parameter sensitivity; its standalone/manual reverse implementation is independently checked separately from whole-lesson acceptance.

Lift starts points[-2,0,1], depth .4, readout threshold .5. Literal x'=0,a'=x^2 produces [-2,1.6],[0,0],[1,.4]. Depth .7 changes heights to2.8,0,.7. Draw original line, trajectories, lifted coordinates and readout separately. Exact uniqueness has its conditions; a coarse numerical step may violate order.

Observations start times[.1,.7,1.4], values[1,-1,.5], query1.6, decay .5, mixing .3. Up to eight arbitrary strictly ordered finite events can be added, edited, omitted or removed, including the empty case. Propagation and assimilation share the event list and display exact decayed segments, before/after jumps, availability and query value. Future and omitted measurements cannot leak into the result. A target-directed observation adjoint is a distinct teaching example, not an inference-control mode.

## Saved-model study and performance

The first near-viewport study view triggers one abortable load of the existing 74,268-byte twelve-model asset. Validate all twelve distinct kind/seed identities, finite readout/field values and output-by-input dimensions before computing. No browser fitting or new measurements. A failed/malformed response leaves raw input and all selections intact and offers a themed44px retry; stale requests cannot replace current state.

Default editable case is original source70, shared field seed37, four classical RK4 intervals and depth1. Model/seed changes retain raw edits; selecting a source deliberately adopts its original four centimetre measurements. Pin/restore includes model, seed, source, raw data and solve/inspection selections. Full original-versus-edited probabilities, complete hidden coordinates, all16 hidden rows, all output rows, all RK stages and all3 readout rows remain inspectable. Projection selectors never claim to show the entire hidden state. Linear and four-block residual routes have their defined fixed discrete architecture and do not expose an inactive solver control.

The fixed named source64 example is separate from source70 and says so. Show fit-only mean/scale, standardized state, complete final state, logits and probabilities. Original twelve fits and all thirteen stored curve checkpoints remain exact historical evidence; preserve all outcomes including the strong linear result and weaker augmented seed37. Parameter counts15/671/179/251 and unequal capacities are explicit. No benchmark inference, new training, invented accuracy or rewritten scientific receipt.

## Deeper drawings and numeric contracts

Ordering is a genuine trajectory picture with stated exact-flow assumptions. Parameterization draws clock concatenation, piecewise fields, basis-weighted fields and generated weights separately. Latent inference draws measurements/masks to posterior, Gaussian sample, ODE, decoder, likelihood and KL as distinct routes. Point-process teaching distinguishes intensity integral from event log-intensity. Density transports actual unit-square corners and computes area, trace and log-density, with the Jacobian taken with respect to state. Hutchinson traces show actual A*epsilon and dot products for all sign probes. Kinetic/Jacobian accumulators do not feed back into the state field. Conditional flow-matching shows crossing pair paths and the conditional-mean target, with smooth marginal-flow conditions explained. Physics-informed residual, Hamiltonian tangent, event root/reset, controlled path versus stochastic increment and reversible auxiliary state are literal distinct drawings with actual arithmetic, not boxes of sentences. Deeper concepts stay visible and carefully introduced.

## Code, practice, sources and verification

Four complete visible programmes: protected `neural_ode_study.py`, protected `solver_library_bridge.py`, protected `ode_calculations.py`, and new `ode_sensitivities.py`. The training/API programme bytes remain exact; the manuscript explains their implementation and ordinary solver use. Classical RK4 and torchdiffeq's3/8 tableau are not conflated. Existing execution evidence identifies actual versions and hardware; documentation research does not imply execution of Diffrax or new fitting. Common reader file index owns downloads; no second ad hoc catalogue.

Preserve nine original practice problems/solutions, add clock-correct sensitivity transfer practice10, and keep only practice hints/solutions in disclosures. The final sections separate Next, annotated References/alternate learning routes and Build/reproduce. Original papers, at least two standard treatments and official implementation docs are cited with scoped annotations; talks are not claimed watched.

Required current checks cover mathematical helper validity/edges, saved-model shape validation and parity, literal drawing/prose numbers, source conservation and generator determinism, full manuscript beginner/specialist review, independent whole-source review, current-source production/loading integration and browser interaction/painting. Check390/320 and768@200% with actual CSS; every SVG glyph stays within its own view, inner matrices can scroll by keyboard without page overflow, all controls have44px targets, and invalid/reset/model-load/retry/Copy feedback paths are exercised. Opening-only or isolated prototype checks are limited evidence, not phase completion. Frozen receipts retain source identities and are never overwritten just to refresh dates.
