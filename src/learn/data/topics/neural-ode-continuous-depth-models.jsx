// Generated from the complete Neural ODE manuscript; guarded authoring renderer owns this source.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { odeFlowRoles, OdeArray, OdeWire, OdeOperation, OdeMatrix, OdeDecayStepDrawing, OdeTinyFieldDrawing, OdeFieldSolverReadoutDrawing, OdePlane, OdeRotationFieldDrawing, OdeRotationEulerDrawing, OdeRkStagesDrawing, OdeCoordinates, OdeAdaptiveEstimateDrawing, OdeAdaptiveScaleDrawing, OdeAdaptiveAttemptsDrawing, OdeStiffnessDrawing, OdeDiscreteReverseDrawing, OdeContinuousReverseDrawing, OdeObservationAdjointDrawing, OdeReverseConditioningDrawing, OdeOrderingDrawing, OdeLiftDrawing, OdeOrderNumericalDrawing, OdeParameterizationsDrawing, OdeObservationDrawing, OdeLatentDrawing, OdeEventRateDrawing, OdeDensityPatchDrawing, OdeDensityAccumulatorDrawing, OdeTraceProbeDrawing, OdeRegularizerDrawing, OdeConditionalPathsDrawing, OdeKnownCorrectionDrawing, OdeHamiltonianDrawing, OdeSolutionResidualDrawing, OdeEventResetDrawing, OdeControlledStochasticDrawing, OdeReversibleStepDrawing, OdeGradientComparisonDrawing, OdeClockSensitivityDrawing, OdeSolverClocksDrawing } from '../../components/lesson-labs/NeuralOdeFlowFigures.jsx';
import { OdeFlowContexts, OdeSelect, OdeNumber, OdeFixtureActions, OdeFixedMatrixLab, OdeFixedInitialLab, OdeFixedResolutionLab, OdeFixedWorkLab, OdeFixedStageLab, OdeAdaptiveRatesLab, OdeAdaptiveInitialLab, OdeAdaptiveTolerancesLab, OdeAdaptiveInspectLab, OdeGradientFieldLab, OdeGradientLossLab, OdeGradientResolutionLab, OdeLiftPointsLab, OdeLiftReadoutLab, OdeObservationEventsLab, OdeObservationPropagationLab, OdeObservationAssimilationLab } from '../../components/lesson-labs/NeuralOdeFlowLabs.jsx';
import { OdeStudyContext, OdeStudyModelLab, OdeWorkedStudyDrawing, OdeStudyFeatureLab, OdeStudySolverLab, OdeStudyTraceLab, OdeStudyFieldLab, OdeStudyProjectionLab, OdeStudyStageLab, OdeStudyReadoutLab, OdeHistoryDrawing, OdeVisibleProgram } from '../../components/lesson-labs/NeuralOdeFlowStudy.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/neural-ode-flow.css';
export default { title: 'Neural ODEs and Continuous-Depth Models', readTime: '~90 min read + investigations and practice', hasIntegratedGuide: true,
  content: () => <OdeFlowContexts><OdeStudyContext><div className="neural-lesson neural-lesson-neutral lesson-flow neural-ode-flow">
    <LessonIntro prerequisites="Weighted sums, derivatives and backpropagation; their exact prerequisite lessons are linked below, and every solver operation is introduced here.">Learn a local rule, calculate its trajectory, differentiate the executed program and test the same rule on measured data.</LessonIntro>
<Prose opening="exploration">{""}<strong>{"Explore as you read."}</strong>{" Change a local rule, watch the resulting motion, and separate the effect of learned weights from the effect of a numerical solver. Later, edit real measurements and observation times with all fitted weights held fixed."}</Prose>

<Prose>{"Suppose you know where a point starts and how it should move at its current location. You can make a small move, ask for its new direction, and repeat. A "}<strong>{"Neural ODE"}</strong>{" replaces a fixed list of neural-network layers with a learned rule for these local changes. A numerical algorithm follows the rule; another small network reads the final state to make a decision."}</Prose>

<Prose>{"This lesson builds that computation one operation at a time. The network learns "}<strong>{"change per unit depth"}</strong>{". The solver adds up that change. Increasing the number of solver steps repeats the same learned rule more carefully; it does not automatically add more learned layers or weights."}</Prose>

<Prose opening="route">{""}<strong>{"First pass."}</strong>{" Read sections 1–7, use their local investigations, and do the core practice. The visible deeper branches explain density, flow matching and structured scientific dynamics after the field/solver/training distinction has been established. Follow their worked operations before returning to the formal statements."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals"}>{"Perceptrons lesson"}</a>{" supplies weighted sums and activations. "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals"}>{"Backpropagation"}</a>{" supplies the chain rule, Jacobians and vector products. "}<a href={"/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals"}>{"Residual Connections"}</a>{" supplies the keep-and-add path. We refresh the operations needed here. "}<a href={"/learn/path/full-curriculum/ordinary-differential-equations-linear-systems?module=math-foundations"}>{"ODEs & Linear Systems"}</a>{" develops the underlying solution theory; no numerical-solver terminology is assumed in this lesson."}</Prose>

<H2>{"1. A derivative tells you how to move"}</H2>

<Prose>{""}<strong>{"What changes when a rule says “decrease at twice the current value”?"}</strong>{" Start with one number, 1. The following drawing keeps the current value, its rate of change, and the finite move separate."}</Prose>

<OdeDecayStepDrawing />

<Prose>{"The cyan 1 is the "}<strong>{"state"}</strong>{": the information we carry. Multiplying it by the fixed coefficient −2 produces the violet rate −2. This is a change "}<strong>{"per unit time"}</strong>{", not a replacement state. For a small interval of length 0.1, multiply that rate by 0.1 to get a proposed change of −0.2. The identity wire preserves the original 1, and the add operation gives 1−0.2=0.8."}</Prose>

<Prose>{"At the new state, the rate would be −2(0.8)=−1.6. The decrease slows. Our first move treated the initial rate as constant throughout the interval, so it decreased too far: the exact endpoint at the same time is approximately 0.81873. The vertical segment in the drawing is "}<strong>{"numerical error"}</strong>{", not another force moving the state."}</Prose>

<Prose>{"Now attach names to those operations. Write "}<InlineMath>{"z(t)"}</InlineMath>{" for the state at time "}<InlineMath>{"t"}</InlineMath>{", and "}<InlineMath>{"z'(t)"}</InlineMath>{", or "}<InlineMath>{"dz/dt"}</InlineMath>{", for its instantaneous rate. Our rule and initial value are"}</Prose>

<div className="neural-equation"><MathBlock>{"z'(t)=-2z(t),\\qquad z(0)=1,\\qquad z(t)=e^{-2t}."}</MathBlock></div>

<Prose>{"An "}<strong>{"initial-value problem"}</strong>{" asks for the evolving state given its starting value and rule. The exact exponential solves this particular problem. Most learned rules have no convenient closed-form trajectory, so we construct finite moves instead. The move just drawn is "}<strong>{"forward Euler"}</strong>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"z_{k+1}=z_k+h f(t_k,z_k),\\qquad h=0.1."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"f"}</InlineMath>{" names the rule, "}<InlineMath>{"h"}</InlineMath>{" the interval length, and "}<InlineMath>{"k"}</InlineMath>{" the accepted-step index. The clock "}<InlineMath>{"t_k"}</InlineMath>{" and the index "}<InlineMath>{"k"}</InlineMath>{" are different: step sizes need not be equal. Euler uses one field evaluation for one accepted move. It can run backward with negative "}<InlineMath>{"h"}</InlineMath>{", but accuracy and stability still require checking."}</Prose>

<Prose>{""}<strong>{"How can a neural network supply the rule?"}</strong>{" Replace the fixed multiplication by an ordinary small network that receives the current state and clock. The drawing below uses two state coordinates and two hidden units so every operation can be read."}</Prose>

<OdeTinyFieldDrawing />

<Prose>{"The incoming state is "}<InlineMath>{"(1,0)"}</InlineMath>{", and the clock is 0. These three supplied numbers enter two weighted sums, with a bias for each. The first uses weights "}<InlineMath>{"(1,-1,0.5)"}</InlineMath>{" and bias 0.1, giving 1.1; the second uses "}<InlineMath>{"(0.5,0.25,-0.5)"}</InlineMath>{" and bias −0.2, giving 0.3. Applying tanh gives approximately "}<InlineMath>{"(0.800499,0.291313)"}</InlineMath>{". The next weighted sums use rows "}<InlineMath>{"(0.5,-0.25)"}</InlineMath>{", "}<InlineMath>{"(-0.2,0.4)"}</InlineMath>{" and biases "}<InlineMath>{"(0.05,-0.1)"}</InlineMath>{", producing approximately "}<InlineMath>{"(0.377421,-0.143575)"}</InlineMath>{"."}</Prose>

<Prose>{"Those last two numbers are a "}<strong>{"derivative vector"}</strong>{", one rate for each state coordinate. The network does not return the next state. The solver still multiplies by "}<InlineMath>{"h"}</InlineMath>{" and adds the unchanged state through the gray identity route. With "}<InlineMath>{"h=0.1"}</InlineMath>{", the next Euler state is approximately "}<InlineMath>{"(1.037742,-0.0143575)"}</InlineMath>{". This is a constructed circuit, not weights fitted to the flower dataset later in the lesson."}</Prose>

<Prose>{"For a column-state convention, the operation is"}</Prose>

<div className="neural-equation"><MathBlock>{"u=\\begin{bmatrix}z\\\\t\\end{bmatrix},\\quad\nr=W_1u+b_1,\\quad q=\\tanh(r),\\quad\nf_\\theta(t,z)=W_2q+b_2."}</MathBlock></div>

<Prose>{"The symbol "}<InlineMath>{"\\theta"}</InlineMath>{" collects the learned matrices and biases. The input matrix has "}<strong>{"output units as rows"}</strong>{", so its shape here is 2×3; the output matrix is 2×2. This agrees with the weight storage in PyTorch's "}<code>{"nn.Linear"}</code>{". The network's output shape matches the state shape. Adding a clock input makes the rule time-dependent, or "}<strong>{"nonautonomous"}</strong>{", even though the same weights are reused at every call."}</Prose>

<Prose>{""}<strong>{"Where does the decision enter?"}</strong>{" A field, a solver and a readout have different jobs. Trace their wires before combining them into an equation."}</Prose>

<OdeFieldSolverReadoutDrawing />

<Prose>{"The state enters the learned field repeatedly. Each call returns a rate; solver operations accumulate it into a final state. A final weighted sum converts that state to class scores, or "}<strong>{"logits"}</strong>{", and softmax converts scores to probabilities. The supplied correct class travels directly to the loss for comparison. It is not an input to the field or solver. During inference the learned weights stay fixed; during training a gradient changes them."}</Prose>

<div className="neural-equation"><MathBlock>{"z_T=\\operatorname{Solve}(f_\\theta,z_0,0,T),\\qquad\n\\text{logits}=Wz_T+b."}</MathBlock></div>

<Prose>{"For measurements taken over hours, "}<InlineMath>{"t"}</InlineMath>{" may be physical time. For a classifier transforming one flower measurement, "}<InlineMath>{"t"}</InlineMath>{" is "}<strong>{"representation depth"}</strong>{": a coordinate along a computation. The flower does not grow while the solver runs. A value of "}<InlineMath>{"T=1"}</InlineMath>{" is a chosen depth interval, not a botanical time measurement."}</Prose>

<H3>{"The connection to the keep-and-add path"}</H3>

<Prose>{"The Euler add just drawn has the same structure as the identity route in "}<a href={"/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals"}>{"Residual Connections"}</a>{": preserve the state and add a correction. A sequence of Euler moves with a shared field is a residual computation with tied weights and an explicit step size."}</Prose>

<Prose>{"An arbitrary ResNet can use a different function at each layer. It is not automatically one smooth flow with one parameter set. A continuous-depth model specifies its field first; the solver chooses when and how often to evaluate it. More evaluations can reduce numerical error without increasing the learned parameter count."}</Prose>

<Prose>{""}<strong>{"Deeper: why a small step helps, and what it does not prove."}</strong>{" For a twice-differentiable scalar trajectory, Taylor expansion gives "}<InlineMath>{"z(t+h)=z(t)+hz'(t)+\\frac12h^2z''(t)+O(h^3)"}</InlineMath>{". Euler discards the curvature term. Its one-step defect is therefore "}<InlineMath>{"O(h^2)"}</InlineMath>{"; under suitable smoothness and stable finite-horizon error propagation, approximately "}<InlineMath>{"1/h"}</InlineMath>{" such defects yield first-order global error "}<InlineMath>{"O(h)"}</InlineMath>{". This is an asymptotic statement, not a guarantee that any step size is stable or that smaller floating-point steps always improve the final answer. We will inspect that distinction next."}</Prose>

<Prose>{"The actual finite-weight affine/tanh/affine field is globally Lipschitz in its state: tanh has slope bounded by 1, and finite matrices multiply distances by finite factors. With continuous clock dependence this supports a unique solution over finite intervals. A generic locally Lipschitz field supplies local uniqueness; a solution can still blow up before the requested endpoint unless a growth or boundedness condition prevents it."}</Prose>

<H2>{"2. The solver is part of the computation"}</H2>

<Prose>{"The scalar example showed why the rate changes during a step. "}<strong>{"What if the direction turns too?"}</strong>{" We now switch to a point moving around a circle, because its known trajectory exposes both angle error and radius error."}</Prose>

<OdeRotationFieldDrawing />

<Prose>{"At the point "}<InlineMath>{"(x,y)"}</InlineMath>{", the rule returns "}<InlineMath>{"(-y,x)"}</InlineMath>{": rotate the position a quarter-turn to get its velocity. The arrow at "}<InlineMath>{"(1,0)"}</InlineMath>{" points upward. The arrow at "}<InlineMath>{"(0,1)"}</InlineMath>{" points left. Arrowheads show direction, and the drawing states the rate-to-length scale. These are local rates, while the separate connected path shows accumulated motion."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{bmatrix}x'\\\\y'\\end{bmatrix}\n=\\begin{bmatrix}0&-1\\\\1&0\\end{bmatrix}\n\\begin{bmatrix}x\\\\y\\end{bmatrix}."}</MathBlock></div>

<Prose>{"Starting at "}<InlineMath>{"(1,0)"}</InlineMath>{", the exact state is "}<InlineMath>{"(\\cos t,\\sin t)"}</InlineMath>{". The radius stays one because "}<InlineMath>{"(x^2+y^2)'=2x(-y)+2yx=0"}</InlineMath>{". We have not trained this field; its exact solution is a numerical reference for the solver."}</Prose>

<H3>{"Euler follows the first arrow throughout the interval"}</H3>

<Prose>{""}<strong>{"What does one finite move miss?"}</strong>{" The tangent move and the true turn leave the same starting point but end at different positions."}</Prose>

<OdeRotationEulerDrawing />

<Prose>{"Euler uses the rate at the start. For this field, "}<InlineMath>{"x_{k+1}=x_k-hy_k"}</InlineMath>{" and "}<InlineMath>{"y_{k+1}=y_k+hx_k"}</InlineMath>{". Squaring and adding cancels the two cross terms:"}</Prose>

<div className="neural-equation"><MathBlock>{"x_{k+1}^2+y_{k+1}^2=(1+h^2)(x_k^2+y_k^2)."}</MathBlock></div>

<Prose>{"Thus Euler expands the squared radius at every nonzero step, although the exact circle does not. To time 1, four steps give approximately "}<InlineMath>{"(0.628906,0.937500)"}</InlineMath>{", endpoint error 0.130661 and radius 1.128906. Sixteen steps reduce the endpoint error to approximately 0.031708. This is a property of these finite updates, not evidence that the field has learned an outward force."}</Prose>

<H3>{"Classical RK4 probes the turn before accepting one move"}</H3>

<Prose>{""}<strong>{"Can the solver sample directions inside the interval?"}</strong>{" Follow the four hollow tentative points and the final filled accepted point. The four probes are calculations used to make "}<strong>{"one"}</strong>{" step."}</Prose>

<OdeRkStagesDrawing />

<Prose>{"At the start "}<InlineMath>{"z_k"}</InlineMath>{", evaluate "}<InlineMath>{"k_1"}</InlineMath>{". Use half of the step along that rate to propose a second point, then evaluate "}<InlineMath>{"k_2"}</InlineMath>{" there. A third point also starts from "}<InlineMath>{"z_k"}</InlineMath>{", but uses the second rate. A fourth uses a full step along the third rate. Only after all four evaluations does the weighted sum update the accepted state. Reusing the same field at each probe reuses every learned weight."}</Prose>

<div className="neural-equation"><MathBlock>{"k_1=f(t_k,z_k),\\qquad\nk_2=f(t_k+h/2,z_k+hk_1/2),"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"k_3=f(t_k+h/2,z_k+hk_2/2),\\qquad\nk_4=f(t_k+h,z_k+hk_3),"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"z_{k+1}=z_k+\\frac h6(k_1+2k_2+2k_3+k_4)."}</MathBlock></div>

<Prose>{"For the first rotation step with "}<InlineMath>{"h=0.25"}</InlineMath>{", the rates are "}<InlineMath>{"(0,1)"}</InlineMath>{", "}<InlineMath>{"(-0.125,1)"}</InlineMath>{", "}<InlineMath>{"(-0.125,0.984375)"}</InlineMath>{", and "}<InlineMath>{"(-0.246094,0.968750)"}</InlineMath>{". The accepted endpoint is approximately "}<InlineMath>{"(0.968913,0.247396)"}</InlineMath>{". The third probe is not reached by moving forward from the second; both are formed from the step's original state. This is why joining the probe locations as if they were the accepted trajectory would be misleading."}</Prose>

<Prose>{"Four classical RK4 steps to time 1 give endpoint error about "}<InlineMath>{"3.25\\times10^{-5}"}</InlineMath>{", with sixteen field evaluations. Four Euler steps use four evaluations. Compare both resolution and evaluation work, not only the count called “steps.” A field evaluation can itself be a costly network forward pass."}</Prose>

<Prose>{""}<strong>{"Deeper: a tableau records the same arithmetic."}</strong>{" A lower-triangular coefficient array specifies which earlier rates form each probe. For classical RK4 the probe clocks are "}<InlineMath>{"(0,1/2,1/2,1)h"}</InlineMath>{", the nonzero internal coefficients are "}<InlineMath>{"a_{21}=1/2,a_{32}=1/2,a_{43}=1"}</InlineMath>{", and the final weights are "}<InlineMath>{"(1,2,2,1)/6"}</InlineMath>{". This storage description will let us reverse the actual stage graph in section 4. Fourth-order convergence needs the relevant smoothness; equal order does not make different tableaus the same computation."}</Prose>

<Prose>{""}<strong>{"Change the case."}</strong>{" The following linked investigations start from "}<InlineMath>{"(0.6,0.8)"}</InlineMath>{" and solve to 1.2, rather than copying the worked "}<InlineMath>{"(1,0),T=1"}</InlineMath>{" result. The radius is still initially one, but the starting direction and endpoint change. Every local question below edits the same complete fixture."}</Prose>

<Prose>{""}<strong>{"Which part of the rule changes the local arrows?"}</strong>{" Inspect one matrix coefficient while the whole trajectory recomputes."}</Prose>

<OdeFixedMatrixLab />

<Prose>{"Choose a matrix entry and move its value. The changed local arrows, exact matrix-exponential path and finite path update together. A general matrix may stretch or contract; radius conservation belongs to the rotation rule above, not every field."}</Prose>

<Prose>{""}<strong>{"What changes if the same rule starts elsewhere?"}</strong>{" Keep the field fixed and move one supplied coordinate."}</Prose>

<OdeFixedInitialLab />

<Prose>{"Choose a starting coordinate and change its value. The cyan point is a supplied state; the learned or constructed field coefficients have not changed."}</Prose>

<Prose>{""}<strong>{"How much of the discrepancy comes from finite resolution?"}</strong>{" Change the endpoint or interval count against the exact reference."}</Prose>

<OdeFixedResolutionLab />

<Prose>{"Change depth or the number of intervals. Compare the exact endpoint with the accepted numerical endpoint, and read the reported endpoint difference when the two paths look almost identical."}</Prose>

<Prose>{""}<strong>{"What does each method spend to obtain its endpoint?"}</strong>{" Compare the two already taught methods and their field-evaluation counts."}</Prose>

<OdeFixedWorkLab />

<Prose>{"After both methods have been taught, select the method and accepted-interval budget. The live sentence reports its rate-evaluation cost: Euler spends one call per interval, classical RK4 spends four. This is an evaluation-count comparison, not a measured wall-clock ranking."}</Prose>

<Prose>{""}<strong>{"Which point is a probe, and which is an accepted state?"}</strong>{" Select the actual interval and rate evaluation separately."}</Prose>

<OdeFixedStageLab />

<Prose>{"Inspect one accepted step and one of its tentative probes. The probe's clock, complete state and derivative are shown separately from the accepted endpoint; later controls never reinterpret a probe as a new accepted state."}</Prose>

<H3>{"Implement the move before importing a solver"}</H3>

<Prose>{"The complete "}<a href={"/learn-assets/neural-ode-continuous-depth-models/neural_ode_study.py"}>{"neural_ode_study.py"}</a>{" implements this arithmetic in "}<code>{"integrate"}</code>{", using tensor operations so PyTorch can retain a differentiation graph. Its "}<code>{"trace"}</code>{" includes the initial state followed by accepted states. Its four RK variables are rates, and each tentative input carries the correct clock. The full program appears with the fitted study in section 6."}</Prose>

<Prose>{"The new "}<a href={"/learn-assets/neural-ode-continuous-depth-models/ode_sensitivities.py"}>{"ode_sensitivities.py"}</a>{" makes the same stage graph explicit as a reusable "}<code>{"fixed_solve(field, initial, parameters, start, stop, intervals, method)"}</code>{" for small float64 investigations. It retains actual stage clocks, validates shape/finite inputs before returning a completed result, accepts decreasing intervals, and treats a zero-length interval as an unchanged state. It is a bounded fixed-step reference, not an adaptive production replacement. Section 4 explains every derivative route it adds."}</Prose>

<H2>{"3. Adapt the steps to estimated error"}</H2>

<Prose>{"The fixed-step comparison asked how careful each move should be. "}<strong>{"Can a solver notice that one proposed move is too large before accepting it?"}</strong>{" It can compare two estimates made from the same starting state."}</Prose>

<OdeAdaptiveEstimateDrawing />

<Prose>{"Start with a state and one proposed interval. Euler uses the initial rate to propose a new state. Heun evaluates another rate at that Euler proposal, averages the two rates, and makes its own proposal from the original starting state. Their difference is a computable indicator of how much the local rate turned. Neither candidate has been accepted yet."}</Prose>

<div className="neural-equation"><MathBlock>{"e=z_n+h f(t_n,z_n),\\qquad\nw=z_n+\\frac h2\\{f(t_n,z_n)+f(t_n+h,e)\\}."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"e"}</InlineMath>{" names the Euler candidate and "}<InlineMath>{"w"}</InlineMath>{" the Heun candidate. The estimator uses "}<InlineMath>{"w-e"}</InlineMath>{"; it is not the unavailable difference between "}<InlineMath>{"w"}</InlineMath>{" and the exact solution. For smooth fields, Heun's local defect is of higher order than Euler's, so this embedded difference captures the lower-order candidate's leading error. Its size scales like "}<InlineMath>{"h^2"}</InlineMath>{" in the small-step regime. It is still an estimate, with possible cancellation or unrepresentative behavior outside that regime."}</Prose>

<Prose>{""}<strong>{"How large is large when coordinates have different sizes?"}</strong>{" Divide each candidate difference by a scale expressed in the same units as that state coordinate, then combine the dimensionless errors."}</Prose>

<OdeAdaptiveScaleDrawing />

<Prose>{"The absolute allowance, "}<code>{"atol"}</code>{", supplies a floor near zero. The relative allowance, "}<code>{"rtol"}</code>{", grows with the maximum magnitude of the old state and the Heun proposal. For coordinate "}<InlineMath>{"i"}</InlineMath>{","}</Prose>

<div className="neural-equation"><MathBlock>{"s_i=\\mathrm{atol}+\\mathrm{rtol}\\max(|z_{n,i}|,|w_i|),\\qquad\nr=\\sqrt{\\frac1d\\sum_{i=1}^d\\left(\\frac{w_i-e_i}{s_i}\\right)^2}."}</MathBlock></div>

<Prose>{"The dimension "}<InlineMath>{"d"}</InlineMath>{" is the number of state coordinates. A ratio "}<InlineMath>{"r\\le1"}</InlineMath>{" accepts the Heun candidate; a larger ratio rejects the move. Averaging squared ratios is an "}<strong>{"RMS norm"}</strong>{". One large coordinate error can be diluted among many easy coordinates. A maximum norm makes a different decision. This is an error-control design choice, not proof that every final coordinate error lies below its scale."}</Prose>

<Prose>{""}<strong>{"What remains after a rejected move?"}</strong>{" Follow the return arrow: the clock and accepted state remain unchanged, while the proposed next interval becomes smaller."}</Prose>

<OdeAdaptiveAttemptsDrawing />

<Prose>{"Each attempt spends two field evaluations here. Acceptance advances the clock and keeps the Heun state. Rejection preserves both original state and clock. This simple controller proposes a next step using"}</Prose>

<div className="neural-equation"><MathBlock>{"h_{\\mathrm{next}}=h\\,\\operatorname{clip}(0.9r^{-1/2},0.1,5)."}</MathBlock></div>

<Prose>{"The factor 0.9 leaves a safety margin. The exponent "}<InlineMath>{"-1/2"}</InlineMath>{" responds to the estimator's "}<InlineMath>{"h^2"}</InlineMath>{" scaling. The bounds prevent a hundred-fold size jump from one estimate; at "}<InlineMath>{"r=0"}</InlineMath>{" the implementation chooses the upper factor 5 without dividing by zero. The final attempted interval is shortened to stop at the endpoint. Underflow or an exhausted attempt budget returns an explicit unfinished-computation error, not a fabricated successful endpoint."}</Prose>

<Prose>{"For the constructed two-rate field "}<InlineMath>{"(z_1',z_2')=(-z_1,-100z_2)"}</InlineMath>{", initial "}<InlineMath>{"(1,1)"}</InlineMath>{", endpoint 0.4 and proposed first interval 0.1, the retained calculation uses "}<code>{"atol=0.01×rtol"}</code>{". At "}<code>{"rtol=0.01"}</code>{" it records 58 accepted and 4 rejected attempts, 124 field evaluations. Tightening to 0.001 records 144 accepted and 5 rejected, 298 evaluations. Those are the measured results of this particular controller and field; a more accurate endpoint is not necessarily a more accurate fitted classifier."}</Prose>

<Prose>{""}<strong>{"Change the case."}</strong>{" The shared live case below starts instead from "}<InlineMath>{"(1,0.3)"}</InlineMath>{" with rates "}<InlineMath>{"(-2,-50)"}</InlineMath>{". This prevents the earlier attempt counts from being mistaken for a universal answer. Independent absolute and relative controls expose the scale formula just taught."}</Prose>

<Prose>{""}<strong>{"Which rate makes this case difficult to integrate?"}</strong>{" Change one coordinate’s decay while both coordinates remain in the error test."}</Prose>

<OdeAdaptiveRatesLab />

<Prose>{"Edit one rate coefficient. Every later view uses this same field and starting vector."}</Prose>

<Prose>{""}<strong>{"Does the starting magnitude change the controller’s work?"}</strong>{" Change one supplied coordinate while keeping its decay rule."}</Prose>

<OdeAdaptiveInitialLab />

<Prose>{"Edit one supplied starting coordinate. A zero coordinate with a homogeneous diagonal rule stays zero; the controller still checks the other coordinate."}</Prose>

<Prose>{""}<strong>{"What changes when the absolute and relative allowances change independently?"}</strong>{" The two controls act on the scale formula just drawn."}</Prose>

<OdeAdaptiveTolerancesLab />

<Prose>{"Move relative and absolute allowance separately. The attempt count, scale, selected normalized error and endpoint error respond live. A locally accepted estimate is not a global accuracy guarantee."}</Prose>

<Prose>{""}<strong>{"Why was a particular attempted move accepted or rejected?"}</strong>{" Select its complete candidate arithmetic and nearby history."}</Prose>

<OdeAdaptiveInspectLab />

<Prose>{"Select an attempt and endpoint. Every rejected attempt is retained and inspectable: the visible ledger shows a window around the selected attempt, and the selector reaches the whole history. The plotted path contains only accepted states; the separate candidate values show the proposed Euler and Heun states, their scales and normalized errors. Requested output times, accepted endpoint times and internal probe times are different things. An adaptive library can return values interpolated at requested times without stepping exactly at each one."}</Prose>

<H3>{"Stiffness can hide beside a smooth trajectory"}</H3>

<Prose>{"Rejections can arise from scaling or rapid variation. "}<strong>{"Why might a smooth-looking target still force very short explicit steps?"}</strong>{" Inspect a tiny perturbation that the rule damps much faster than the visible motion."}</Prose>

<OdeStiffnessDrawing />

<Prose>{"For "}<InlineMath>{"z'=-\\kappa z"}</InlineMath>{", a perturbation shrinks by "}<InlineMath>{"e^{-\\kappa h}"}</InlineMath>{" exactly. Euler instead multiplies it by "}<InlineMath>{"1-\\kappa h"}</InlineMath>{". This finite move amplifies perturbations when "}<InlineMath>{"|1-\\kappa h|>1"}</InlineMath>{". For positive "}<InlineMath>{"\\kappa"}</InlineMath>{", its real-negative stability interval is "}<InlineMath>{"0\\le\\kappa h\\le2"}</InlineMath>{"; the boundary may fail to damp and is not a prudent universal setting. When "}<InlineMath>{"\\kappa=0"}</InlineMath>{", this decay restriction disappears. Non-normal matrices can also transiently amplify errors despite apparently reassuring eigenvalues."}</Prose>

<Prose>{"Backward Euler uses the rate at the "}<strong>{"new"}</strong>{" state: "}<InlineMath>{"z_{n+1}=z_n-h\\kappa z_{n+1}"}</InlineMath>{". Solving that equation gives "}<InlineMath>{"z_{n+1}=z_n/(1+\\kappa h)"}</InlineMath>{", a decaying multiplier for every positive step in this scalar problem. General implicit methods must solve algebraic systems; their stability benefit has an additional computational cost."}</Prose>

<Prose>{"The retained smoother example is "}<InlineMath>{"z'=-\\kappa(z-\\cos t)-\\sin t"}</InlineMath>{", initially1. Its exact solution is "}<InlineMath>{"\\cos t"}</InlineMath>{" for any "}<InlineMath>{"\\kappa"}</InlineMath>{". A perturbation around that smooth curve decays at rate "}<InlineMath>{"\\kappa"}</InlineMath>{", potentially constraining an explicit solver much more than the visible curve's variation. With the saved SciPy settings, the recorded calls are:"}</Prose>

<NeuralTable caption={"Stiffness can hide beside a smooth trajectory"} headers={[<>{"κ"}</>,<>{"RK45 field calls"}</>,<>{"Radau field calls"}</>,<>{"Radau linear factorizations"}</>]} rows={[[<>{"5"}</>,<>{"92"}</>,<>{"99"}</>,<>{"8"}</>],[<>{"1000"}</>,<>{"2162"}</>,<>{"84"}</>,<>{"16"}</>]]} />

<Prose>{"Both completed the declared problem. A field call is not a unit of equal total cost across methods: implicit Radau also forms/solves algebraic systems. These counts are not wall-clock speed ratios. The "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html"}>{"official SciPy solver contract"}</a>{" lists its explicit RK23/RK45/DOP853 and implicit Radau/BDF choices; its method names do not include the fixed classical RK4 implemented here."}</Prose>

<Prose>{"High work warrants diagnosis, not a label attached automatically. Tight tolerances, poorly scaled coordinates, nonsmooth fields and fast transients can increase calls. Smooth activations, coordinate scaling, a suitable implicit solver or a different model are alternatives depending on which cause actually appears."}</Prose>

<H2>{"4. Learn through a trajectory"}</H2>

<Prose>{"The solver has now produced a state. "}<strong>{"How does a final loss tell the learned rule what to change?"}</strong>{" Backpropagation can reverse the finite operations we executed, or we can derive sensitivities of the continuous equation first. We will name the target before comparing their answers."}</Prose>

<H3>{"Differentiate the numerical program"}</H3>

<OdeDiscreteReverseDrawing />

<Prose>{"First inspect one Euler step of the earlier scalar rule, now treating its coefficient as a trainable parameter "}<InlineMath>{"\\theta=-0.7"}</InlineMath>{". With starting state 1.2 and interval 0.325, it reaches 0.927. For a loss after this one move, target 0.4 gives a terminal state gradient 0.527. The identity wire sends 0.527 backward directly. The field wire multiplies it by "}<InlineMath>{"h\\theta=-0.2275"}</InlineMath>{", contributing −0.1198925. Adding the two routes gives the starting-state gradient 0.4071075. The parameter route multiplies by "}<InlineMath>{"hz_0=0.39"}</InlineMath>{", giving 0.20553. These are gradients for the "}<strong>{"one-step"}</strong>{" loss, before the four-step loss below."}</Prose>

<Prose>{"For fixed Euler steps, write "}<InlineMath>{"F_k=z_k+h f_\\theta(t_k,z_k)"}</InlineMath>{". Ordinary backpropagation applies the chain rule through each "}<InlineMath>{"F_k"}</InlineMath>{". With a final-state loss "}<InlineMath>{"L(z_N)"}</InlineMath>{", let "}<InlineMath>{"a_k"}</InlineMath>{" be the column vector "}<InlineMath>{"\\partial L/\\partial z_k"}</InlineMath>{". Then"}</Prose>

<div className="neural-equation"><MathBlock>{"a_k=(I+hJ_zf_k)^\\top a_{k+1},\n\\qquad\n\\nabla_\\theta L=\\sum_k h(J_\\theta f_k)^\\top a_{k+1}."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"J_z f"}</InlineMath>{" is the matrix of field derivatives with respect to the state, and "}<InlineMath>{"J_\\theta f"}</InlineMath>{" collects derivatives with respect to weights. Their transposes carry a loss sensitivity backward from outputs to inputs. If the readout or initial state depends on parameters, add those paths too."}</Prose>

<Prose>{"RK4 has more intermediate operations, but automatic differentiation handles the same principle. It computes a gradient of the "}<strong>{"implemented finite computation"}</strong>{", subject to floating-point effects and any nondifferentiable branches. This is often called "}<strong>{"discretize then optimize"}</strong>{". Keeping every stage's graph consumes memory; checkpointing stores selected states and recomputes parts of the forward calculation during backward propagation."}</Prose>

<H3>{"Derive a continuous adjoint"}</H3>

<OdeContinuousReverseDrawing />

<Prose>{"The next drawing has three coupled quantities on an actual backward clock: state, state-loss sensitivity and accumulated parameter gradient. The loss supplies the terminal sensitivity; the parameter accumulator starts at zero. Orange dashed derivative wires show transpose products, not additional forward learned layers."}</Prose>

<Prose>{"Alternatively, derive sensitivity equations for the continuous model first. For a terminal loss with no direct parameter dependence and parameter-independent "}<InlineMath>{"z_0"}</InlineMath>{","}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{da}{dt}=-J_z f_\\theta(t,z(t))^\\top a(t),\n\\qquad a(T)=\\nabla_{z(T)}L,"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"\\nabla_\\theta L=\\int_0^T\nJ_\\theta f_\\theta(t,z(t))^\\top a(t)\\,dt."}</MathBlock></div>

<Prose>{"The adjoint says how much the final loss cares about a small change in the state at each time. A backward solve can accumulate this integral without retaining the entire forward computation graph."}</Prose>

<Prose>{""}<strong>{"Keep the integration direction explicit."}</strong>{" A parameter accumulator "}<InlineMath>{"g"}</InlineMath>{" initialized at "}<InlineMath>{"g(T)=0"}</InlineMath>{" and integrated from "}<InlineMath>{"T"}</InlineMath>{" down to zero uses "}<InlineMath>{"g'=-J_\\theta f^\\top a"}</InlineMath>{". The negative right side combined with backward limits yields the positive forward-time integral above."}</Prose>

<OdeObservationAdjointDrawing />

<Prose>{"For losses at several observation times, the adjoint receives a jump from each observation's loss gradient. A running integral cost also contributes a term between observations. These extensions matter in time-series training; the terminal-only formula is not the full recipe for every objective."}</Prose>

<H3>{"Deeper: why the adjoint equation cancels state sensitivity"}</H3>

<Prose>{"Let "}<InlineMath>{"S(t)=\\partial z(t)/\\partial\\theta"}</InlineMath>{". Differentiating the state equation gives "}<InlineMath>{"S'=J_zf\\,S+J_\\theta f"}</InlineMath>{", with "}<InlineMath>{"S(0)=0"}</InlineMath>{" under our assumptions. The product rule gives"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{d}{dt}(a^\\top S)=a'^\\top S+a^\\top S'\n=-a^\\top J_zf S+a^\\top(J_zf S+J_\\theta f)\n=a^\\top J_\\theta f."}</MathBlock></div>

<Prose>{"Integrate from zero to "}<InlineMath>{"T"}</InlineMath>{". The left endpoint vanishes; the final term is "}<InlineMath>{"\\nabla_{z(T)}L^\\top S(T)"}</InlineMath>{", precisely the chain rule for the parameter gradient. This also explains the adjoint's negative sign. Forward sensitivities store a state-by-parameter matrix; the adjoint is attractive when there are many parameters and a scalar objective."}</Prose>

<H3>{"The two gradients need not be equal at finite resolution"}</H3>

<OdeGradientComparisonDrawing />

<Prose>{"We now extend the calculation to a loss after four steps, rather than the one-step loss above. Use "}<InlineMath>{"z'=\\theta z"}</InlineMath>{", "}<InlineMath>{"z(0)=1.2"}</InlineMath>{", "}<InlineMath>{"T=1.3"}</InlineMath>{", target 0.4, and loss "}<InlineMath>{"\\frac12(z(T)-0.4)^2"}</InlineMath>{", evaluated at "}<InlineMath>{"\\theta=-0.7"}</InlineMath>{"."}</Prose>

<Prose>{"The exact state is "}<InlineMath>{"1.2e^{1.3\\theta}"}</InlineMath>{". Differentiating it gives"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{dL}{d\\theta}=(z(T)-0.4)\\,1.3z(T)=0.05213709."}</MathBlock></div>

<Prose>{"Four Euler steps instead produce "}<InlineMath>{"z_4=1.2(1+0.325\\theta)^4=0.42734163"}</InlineMath>{". Their autograd gradient is 0.01966276. Central differences of that same four-step loss agree with autograd. They do not agree with the continuous answer because they differentiate a different forward function."}</Prose>

<Prose>{"Four classical RK4 steps give 0.05213852, much closer here. A backward RK4 solve of the continuous adjoint initialized at the numerical forward endpoint gives 0.05214299. It introduces its own approximation; it is not exactly the RK4 program's reverse-mode derivative."}</Prose>

<Prose>{"This is why “the gradient passed a check” needs a named reference. "}<a href={"https://arxiv.org/html/2005.13420v2"}>{"Onken and Ruthotto"}</a>{" study the distinction and solver changes in continuous models. Our scalar example is independently calculated rather than reproduced from their experiments."}</Prose>

<Prose>{""}<strong>{"Change the case."}</strong>{" The shared gradient investigation starts from "}<InlineMath>{"\\theta=0.3,z_0=0.8"}</InlineMath>{", target1 and endpoint0.7, with three steps. This is a fresh finite computation, so the earlier gradient values do not apply."}</Prose>

<Prose>{""}<strong>{"How does a changed field weight affect the loss gradient?"}</strong>{" Follow the finite state and all labelled derivative references together."}</Prose>

<OdeGradientFieldLab />

<Prose>{"Change the rate and initial state. The finite loss, finite derivative and exact continuous comparison all use that same edited case."}</Prose>

<Prose>{""}<strong>{"Can the gradient change even when the forward rule does not?"}</strong>{" Change the target or the amount of depth before the loss."}</Prose>

<OdeGradientLossLab />

<Prose>{"Change the target or endpoint. A change in target affects the loss derivative, even when the field and forward trajectory are unchanged."}</Prose>

<Prose>{""}<strong>{"Which derivative belongs to the method we actually execute?"}</strong>{" Compare the finite program and continuous references at a chosen resolution."}</Prose>

<OdeGradientResolutionLab />

<Prose>{"Select the taught finite method and interval count. Its finite derivative and finite-difference check refer to the same computation. The separately labelled continuous backsolve starts from that finite endpoint and residual, so it includes forward approximation as well as its backward integration error. The exact continuous gradient is a separate reference."}</Prose>

<H3>{"Why saving no forward trajectory can be fragile"}</H3>

<OdeReverseConditioningDrawing />

<Prose>{"The decay "}<InlineMath>{"z'=-20z"}</InlineMath>{", "}<InlineMath>{"z(0)=1"}</InlineMath>{", reaches "}<InlineMath>{"e^{-20}\\approx2.0612\\times10^{-9}"}</InlineMath>{" at time one. Reverse the exact equation from an endpoint perturbed by "}<InlineMath>{"10^{-8}"}</InlineMath>{". The recovered initial value is approximately 5.85165 instead of one: reverse evolution multiplies the perturbation by "}<InlineMath>{"e^{20}"}</InlineMath>{"."}</Prose>

<Prose>{"The forward process is stable but its inverse reconstruction is ill-conditioned. A more accurate solver helps numerical error; it cannot remove this mathematical amplification of an already present endpoint error. Checkpoints can reduce the length over which state must be reconstructed."}</Prose>

<Prose>{"“Constant memory” for a backsolve usually concerns dependence on the number of internal forward steps. Parameters, parameter gradients, requested output states, batches and local network activations still occupy memory. Current "}<a href={"https://docs.kidger.site/diffrax/api/adjoints/"}>{"Diffrax adjoint documentation"}</a>{" describes checkpointed differentiation of the numerical solution and distinguishes it from approximate continuous backsolves. The correct choice depends on the objective, solver, accuracy needs and available memory."}</Prose>

<H3>{"Deeper: reverse a rule that depends on the actual clock"}</H3>

<Prose>{"The decay examples were autonomous: their rate had no direct clock input. "}<strong>{"What breaks if we restart the backward clock at zero for a time-dependent field?"}</strong>{" The following example evaluates "}<InlineMath>{"f(t,z)=\\theta z+t"}</InlineMath>{" at its actual stage times, including when solving backward."}</Prose>

<OdeClockSensitivityDrawing />

<Prose>{"The initial clock is 0.2 and the final clock 1.3. With "}<InlineMath>{"z_0=1.2,\\theta=-0.7"}</InlineMath>{", the exact state is approximately 1.184577394. The term "}<InlineMath>{"+t"}</InlineMath>{" changes the field at every probe; using a zero-based negative clock on the reverse solve would describe a different function. With "}<InlineMath>{"\\theta=0"}</InlineMath>{", the exact move from clock a to clock b is "}<InlineMath>{"z_b=z_a+(b^2-a^2)/2"}</InlineMath>{", valid in either direction."}</Prose>

<Prose>{"The complete program below stores the actual Euler/classical RK4 graph. "}<code>{"tangent"}</code>{" seeds an identity matrix for initial-state sensitivity and zero columns for field-parameter sensitivity. Each probe transports those columns with the state Jacobian and adds its parameter Jacobian. "}<code>{"discrete_reverse"}</code>{" starts from the terminal loss gradient, follows the same graph backward, keeps the identity route, and accumulates every use of a shared parameter. For RK4, each stage's sensitivity also returns through the earlier slopes that formed its tentative state; multiplying only accepted endpoints would miss those paths."}</Prose>

<Prose>{""}<code>{"continuous_reverse"}</code>{" instead solves the continuous state/adjoint/parameter equations from the actual final clock down to the actual initial clock. The demonstrated comparison initializes it with the exact endpoint and exact terminal-loss gradient, isolating its own integration error. Initializing it from a numerical forward endpoint would add that endpoint error too, as in the earlier scalar comparison."}</Prose>

<OdeVisibleProgram file="ode_sensitivities.py" />

<Prose>{""}<code>{"fixed_solve"}</code>{" validates finite one-dimensional states/parameters, positive whole interval count, supported method, field shapes and a representable step. It returns an unchanged state for equal clocks. The small-rate analytic reference uses a convergent exponential-moment series, including "}<InlineMath>{"\\theta=0"}</InlineMath>{", to avoid dividing cancellation errors by "}<InlineMath>{"\\theta^2"}</InlineMath>{" or "}<InlineMath>{"\\theta^3"}</InlineMath>{". The default two-coordinate example has one rate per coordinate; the generic tangent/reverse also accepts coupled state Jacobians and any finite parameter-vector width. It does not compute derivatives of start/stop clocks or adaptive branch decisions."}</Prose>

<Prose>{"With sixteen classical RK4 intervals, the first coordinate's finite parameter gradient is approximately 0.657501713, versus exact 0.657501836 for target 0.4. Its continuous reverse with 128 intervals gives approximately 0.657501835. The close answers belong to this checked fixture; the objective labels remain necessary even when the numbers look equal. Run the file directly to print those values without changing weights, examples or evidence files. Compare a modified coupled field against finite differences of its own loss before trusting a changed Jacobian."}</Prose>

<H3>{"Control an actual solver API with the same field"}</H3>

<Prose>{"The scratch implementation is "}<code>{"integrate"}</code>{" in "}<a href={"/learn-assets/neural-ode-continuous-depth-models/neural_ode_study.py"}>{"neural_ode_study.py"}</a>{": it builds Euler and classical RK4 updates from tensor operations, keeping the computation graph for direct differentiation. "}<code>{"VectorField"}</code>{" and "}<code>{"DepthClassifier"}</code>{" later turn that mechanism into a learned classifier. Here we isolate the solver/library bridge on z′=a z, where both the trajectory and its derivatives are known. This avoids mistaking a similar classification score for a correct solver interface."}</Prose>

<Prose>{"Keep "}<a href={"/learn-assets/neural-ode-continuous-depth-models/solver_library_bridge.py"}>{"solver_library_bridge.py"}</a>{" beside that program. With the earlier PyTorch environment, install "}<code>{"torchdiffeq==0.2.5"}</code>{", then run "}<code>{"python solver_library_bridge.py"}</code>{". The downloadable bridge was executed with torchdiffeq 0.2.5 and PyTorch 2.14.0 on CPU float64. The fixed-step Euler endpoint and both initial-state and rate gradients match the scratch program; adaptive direct and continuous-adjoint results pass the stated analytic tolerances. The saved classifier outcomes retain their declared fit, validation and assessment roles."}</Prose>

<OdeSolverClocksDrawing />

<Prose>{""}<code>{"odeint(field, initial, times)"}</code>{" returns a tensor with requested time as its first axis. Those times request output values; an adaptive solver may take many internal steps between them. "}<code>{"method='euler', options={'step_size': 1/8}"}</code>{" gives the same eight Euler steps as our scratch route. We compare both final states and both kinds of derivative: with respect to the initial state and the field parameter. In contrast, the package's "}<code>{"rk4"}</code>{" uses the 3/8 tableau, while our scratch program uses classical RK4. Their order alone does not justify step-by-step equality. The solver choices and adjoint interface are documented in "}<a href={"https://github.com/rtqichen/torchdiffeq"}>{"the author's repository"}</a>{"."}</Prose>

<Prose>{"For endpoint time one and loss L=½Σz(1)², exact calculus gives z(1)=exp(a)z₀, ∂L/∂z₀=exp(2a)z₀, and ∂L/∂a=exp(2a)Σz₀². The Euler solution instead uses factor (1+a/8)⁸. The adaptive direct and adjoint solves target the continuous answer within stated tolerances; we do "}<strong>{"not"}</strong>{" require them to equal the eight-step Euler answer. "}<code>{"odeint_adjoint"}</code>{" receives an "}<code>{"nn.Module"}</code>{" so its trainable field parameter can be found, and we set forward and backward tolerances explicitly."}</Prose>

<OdeVisibleProgram file="solver_library_bridge.py" />

<Prose>{"The continuous adjoint changes how derivatives are computed; it does not erase reconstruction error, intermediate saved output states, parameter gradients or library overhead. Direct differentiation through K accepted numerical steps generally retains work proportional to K, while a continuous backsolve trades recomputation and its own numerical sensitivity for less retained internal-step history. Smoothness, solver stability and state dimension still matter. The current example has no events, stochastic layers or discontinuous observation jumps; inserting those changes the problem."}</Prose>

<Prose>{""}<strong>{"Take control."}</strong>{" Change a to −4 and compare Euler at 1, 4, 8 and 32 steps with the same adaptive solve. Keep the parameter fixed: do not retrain it to compensate for a changed solver. Then tighten only the adjoint tolerances and inspect which derivative discrepancy changes."}</Prose>

<details><summary>Hint and reasoned solution</summary>

<Prose>{"One Euler step multiplies the state by −3, which reverses sign and magnifies it even though the continuous system decays. Four steps multiply by zero at every step, incorrectly erasing the state. Eight give factor (½)⁸; as steps increase, (1−4/K)^K approaches exp(−4). For a finite K, direct differentiation correctly differentiates that discrete factor, not exp(a). Tightening backward tolerance can improve the continuous-adjoint approximation but cannot repair an intentionally inaccurate forward Euler trajectory. Report endpoint, initial-state gradient and parameter gradient separately; a small final loss alone misses this distinction."}</Prose>

</details>

<H2>{"5. What can a continuous flow rearrange?"}</H2>

<Prose>{"The solver can now move a representation and differentiate the loss. Can that representation implement every decision boundary we might ask for? First keep the state one-dimensional, so we can see exactly what prevents a rearrangement."}</Prose>

<OdeOrderingDrawing />

<Prose>{"The three cyan points start at −1, 0 and 1. They all follow the "}<strong>{"same field"}</strong>{", over the "}<strong>{"same clock interval"}</strong>{". Each track records position against time. A vertical slice through the drawing is one shared time: the middle point stays between the two outer points. The amber readout threshold labels points on one side class one and points on the other side class zero. It cannot label both outer points one and the middle point zero."}</Prose>

<Prose>{"Why can the tracks not meet and then exchange places? Suppose the field is continuous in time, locally Lipschitz in state, and its solutions exist uniquely throughout this interval. Locally Lipschitz means that, in a neighborhood, changing state a little changes the field by at most a fixed multiple of that change. These assumptions give a unique local trajectory from a specified state and clock. If two tracks met at the same state and same time, solving backward from that meeting would give a single past, contradicting their distinct starts. Changing their order would require such a meeting."}</Prose>

<Prose>{"For a one-dimensional state, this gives"}</Prose>

<div className="neural-equation"><MathBlock>{"z_A(0)<z_B(0)\\quad\\Longrightarrow\\quad z_A(T)<z_B(T),"}</MathBlock></div>

<Prose>{"provided both solutions exist uniquely throughout the common interval. The resulting state map is invertible on its image. A readout need not be invertible: it may discard coordinates or assign many states the same label. The impossibility here therefore concerns "}<strong>{"a one-dimensional unique flow followed by one linear threshold"}</strong>{". A nonlinear readout changes that question. Lines may cross in a projection of a higher-dimensional state, or revisit a position at different clocks, without two full states meeting at the same time."}</Prose>

<H3>{"Give the representation a second direction"}</H3>

<Prose>{"What if we preserve each input position and add a place to record its distance from the center?"}</Prose>

<OdeLiftDrawing />

<Prose>{"The drawing appends a zero coordinate to each input: (−1, 0), (0, 0), (1, 0). The horizontal derivative is zero, so each horizontal position remains unchanged. The vertical derivative is the square of that horizontal position. The outer points rise at rate one; the middle point has rate zero and stays still. At depth one, the outer points are at height one, above the amber threshold 0.5; the middle stays at height zero. The second coordinate has made a linear readout sufficient."}</Prose>

<Prose>{"Writing the vertical coordinate as a, the entire constructed field and solution are"}</Prose>

<div className="neural-equation"><MathBlock>{"x'=0,\\qquad a'=x^2,\\qquad (x(0),a(0))=(x_0,0),\n\\qquad (x(T),a(T))=(x_0,Tx_0^2)."}</MathBlock></div>

<Prose>{"This is "}<strong>{"state augmentation"}</strong>{": add coordinates before integrating, and allow the field to use them. No full trajectories meet in this example. We have constructed a solution, rather than trained one. The "}<a href={"https://arxiv.org/html/1904.01681v1"}>{"Augmented Neural ODEs paper"}</a>{" studies broader representational and computational consequences; its continuous-region topology arguments require the stated domain and continuity assumptions. They do not say every finite sampled dataset is impossible for an unaugmented flow. Gaps between sampled points can leave routes that would not exist for an entire connected region."}</Prose>

<Prose>{"Now explicitly change the starting inputs to −2, 0 and 1. Their squared values are 4, 0 and 1. At T = 0.4 the heights are 1.6, 0 and 0.4: only the left point exceeds 0.5. At T = 0.7 the heights are 2.8, 0 and 0.7: both outer points exceed it. The flow can be sound while a particular depth/readout is insufficient."}</Prose>

<Prose>{""}<strong>{"Where does a different starting point go in the lifted space?"}</strong>{" Move one point and follow the same constructed rule."}</Prose>

<OdeLiftPointsLab />

<Prose>{""}<strong>{"Is changing the decision boundary the same as changing motion?"}</strong>{" Inspect depth and readout threshold as separate operations."}</Prose>

<OdeLiftReadoutLab />

<Prose>{"The first controls edit a chosen starting point. The next controls change depth and the readout threshold. They share the same three points; the live labels are computed from the displayed final heights. The threshold changes decisions without changing a trajectory."}</Prose>

<H3>{"A numerical map can violate an exact-flow property"}</H3>

<Prose>{"Does every solver preserve that order? Return to our scalar decay field with coefficient −2, and deliberately take a very coarse interval h = 1."}</Prose>

<OdeOrderNumericalDrawing />

<Prose>{"Euler sends each starting value to z + (−2z) = −z: the points exchange order. The exact solution sends it to exp(−2)z, multiplying by a positive number and preserving order. Neither calculation changes the field. Euler has created a different finite map; a network trained through that map can exploit behavior absent from the exact continuous flow. Refinement checks from "}<strong>{"The solver is part of the computation"}</strong>{" distinguish those two interpretations."}</Prose>

<H3>{"Deeper: where can the learned parameters live?"}</H3>

<Prose>{"The tiny field in "}<strong>{"A derivative tells you how to move"}</strong>{" concatenated the clock to its state. That is one parameterization, not the definition of a Neural ODE."}</Prose>

<OdeParameterizationsDrawing />

<Prose>{"Read the four small routes separately. A clock input lets the same weight matrix produce different rates at the same state at different times. A piecewise route selects one field before a declared boundary and another afterward; both state segments must be joined, and the solver should respect the discontinuity. A basis route uses clock-dependent coefficients to combine a fixed set of fields. A hypernetwork route uses the clock to generate another network's weights. For example, f(t,z) = (1−t)f₀(z) + t f₁(z) blends two rates; it is not the same as integrating f₀ and f₁ separately and blending their endpoints."}</Prose>

<Prose>{"A second-order system supplies a different kind of augmentation. Position q alone does not tell us how an object is moving; adding velocity v makes q' = v and v' = gθ(t,q,v) a first-order equation on the joint state (q,v). Its two channels represent position and velocity, rather than arbitrary added memory. Units and initial velocity must be specified. Extra coordinates, time dependence and richer readouts solve different restrictions; choose the one that matches the missing information."}</Prose>

<Prose>{"These designs are discussed in "}<a href={"https://arxiv.org/html/2202.02435"}>{"Kidger's treatment of neural differential equations"}</a>{", especially the parameterization and augmentation sections. They still require a well-defined field, a suitable numerical method and evaluation on the actual task. More representational room does not guarantee easier optimization or better generalization."}</Prose>

<H2>{"6. Train a small continuous-depth classifier on real measurements"}</H2>

<Prose>{"The lift example constructed a field that solved a chosen labeling problem. Does a learned shared field contribute anything on measured data? We now switch explicitly to flowers: their four measured lengths and widths form the supplied input; their recorded species is the target."}</Prose>

<Prose>{"Our data are the 150 Iris measurements distributed by UCI: sepal length, sepal width, petal length and petal width, all in centimeters, with three species labels. The "}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"dataset"}</a>{" is credited to R. A. Fisher and licensed CC BY 4.0. The retained "}<a href={"/learn-assets/neural-ode-continuous-depth-models/iris.csv"}>{"CSV"}</a>{" uses the corrected values documented in its "}<a href={"/learn-assets/neural-ode-continuous-depth-models/data-provenance.md"}>{"provenance"}</a>{"."}</Prose>

<Prose>{"This is a feature-transformation experiment. Each flower supplies an initial four-dimensional state after standardization. Solver time describes representation depth, not elapsed botanical time."}</Prose>

<H3>{"Keep the comparison interpretable"}</H3>

<Prose>{"Identical four-feature rows are grouped before assigning data roles; source rows 102 and 143 are duplicates. We keep all original rows in the download but score each unique vector once. A fixed stratified split assigns 90 unique examples to fitting, 30 to validation and 29 to assessment. The fitting examples alone determine the feature means and population standard deviations. Fitting changes the parameters; validation chooses a saved checkpoint without fitting on those records; assessment measures the selected model afterward. Dividing each measurement's difference from its fitting mean by its fitting standard deviation puts these inputs on comparable scales. The "}<a href={"/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals"}>{"Batch/Layer/Group/RMS Normalization lesson"}</a>{" explains that operation; no validation or assessment measurement contributes to these statistics."}</Prose>

<Prose>{"We compare four models:"}</Prose>

<NeuralTable caption={"Keep the comparison interpretable"} headers={[<>{"Model"}</>,<>{"Computation before a linear three-class head"}</>,<>{"Trainable parameters"}</>]} rows={[[<>{"Linear"}</>,<>{"No learned feature transformation"}</>,<>{"15"}</>],[<>{"Residual"}</>,<>{"Four distinct 16-unit tanh fields, each used for one step"}</>,<>{"671"}</>],[<>{"Neural ODE"}</>,<>{"One shared 16-unit tanh field; four classical RK4 steps"}</>,<>{"179"}</>],[<>{"Augmented ODE"}</>,<>{"Append two zeros; one six-dimensional field; four RK4 steps"}</>,<>{"251"}</>]]} />

<Prose>{"The two ODE models perform 16 field evaluations per example. Their parameter counts stay fixed if we change solver resolution. The residual model has separate weights at its four blocks. These models have different capacities; this is not a parameter-matched benchmark."}</Prose>

<Prose>{"The complete "}<a href={"/learn-assets/neural-ode-continuous-depth-models/neural_ode_study.py"}>{"study program"}</a>{" runs three declared seeds—13, 37 and 61—for each model. Every run uses 300 full-batch AdamW updates, learning rate 0.01 and weight decay 0.001, in float64 on CPU. Validation loss is measured after update one and every 25 updates. We select the lowest-validation-loss checkpoint within each run, then evaluate that checkpoint on assessment data. All 12 runs and their curves remain in "}<a href={"/learn-assets/neural-ode-continuous-depth-models/study-results.json"}>{"the result file"}</a>{"; "}<a href={"/learn-assets/neural-ode-continuous-depth-models/fitted-models.json"}>{"selected weights"}</a>{" are retained."}</Prose>

<H3>{"What actually happened"}</H3>

<OdeHistoryDrawing />

<NeuralTable caption={"What actually happened"} headers={[<>{"Model"}</>,<>{"Assessment cross-entropy, seeds 13 / 37 / 61"}</>,<>{"Correct out of 29, same order"}</>]} rows={[[<>{"Linear"}</>,<>{"0.22045 / 0.20028 / 0.21245"}</>,<>{"28 / 28 / 28"}</>],[<>{"Residual"}</>,<>{"0.16763 / 0.10539 / 0.05133"}</>,<>{"28 / 28 / 29"}</>],[<>{"Neural ODE"}</>,<>{"0.15239 / 0.10335 / 0.06212"}</>,<>{"28 / 28 / 29"}</>],[<>{"Augmented ODE"}</>,<>{"0.04204 / 0.10549 / 0.03648"}</>,<>{"29 / 28 / 29"}</>]]} />

<Prose>{"The uniform three-class predictor has cross-entropy "}<InlineMath>{"\\log3\\approx1.09861"}</InlineMath>{". A fixed class-zero choice scores 10/29. The linear model is already strong: a small reduction in classification errors cannot explain every difference in cross-entropy. Probability assigned to the true class matters even when the winning label stays unchanged."}</Prose>

<Prose>{"All nonlinear runs selected update 50, while the linear runs selected update 300. Later training loss improvement therefore did not automatically mean better validation performance. There was no post-assessment search for a more impressive configuration."}</Prose>

<H3>{"Follow one actual flower through the learned field"}</H3>

<Prose>{"How does one measurement vector become three class probabilities? Follow this fixed source through its saved seed-37 field before editing a different flower."}</Prose>

<OdeWorkedStudyDrawing />

<Prose>{"The cyan centimeter values first meet the fixed fitting means and scales. Their standardized vector enters the field; four classical RK4 intervals update every hidden coordinate. The final state reaches the three-row affine readout, which produces logits. Softmax subtracts the shared maximum, exponentiates and divides by the shared sum. The recorded species would enter the loss separately, after this forward route."}</Prose>

<Prose>{"For validation source row 64, the seed-37 Neural ODE assigns probabilities approximately "}<InlineMath>{"(0.01744,0.93374,0.04882)"}</InlineMath>{" in the order setosa, versicolor, virginica. Increasing its petal length by 0.6 cm while holding the other measurements fixed changes them to "}<InlineMath>{"(0.00730,0.67440,0.31830)"}</InlineMath>{". The winning label stays versicolor, but the evidence shifts substantially toward virginica."}</Prose>

<Prose>{"These are full forward passes through the saved learned model, not a hand-drawn boundary. The input edit is a hypothetical measurement intervention; it does not establish a biological causal effect."}</Prose>

<Prose>{"Now switch explicitly to fresh validation row 70 for the shared live case. The first question chooses the saved architecture, declared seed and source. Changing architecture or seed keeps all raw edits; changing the source deliberately adopts that source's measurements. The saved models cover the four architectures and all three seeds from the table above."}</Prose>

<OdeStudyModelLab />

<Prose>{"What changes when a single measurement changes, with the learned rule held fixed?"}</Prose>

<OdeStudyFeatureLab />

<Prose>{"Edit any of the four raw centimeter values. The standardization and complete forward pass update; the probability table compares the edited input with that source's original measurements under the same weights and solver. A petal-length edit need not act monotonically or affect every seed the same way. These comparisons reveal sensitivity, not a newly verified flower label or biological causal effect."}</Prose>

<Prose>{"Can a different numerical realization change the same saved model's probabilities?"}</Prose>

<OdeStudySolverLab />

<Prose>{"Change method, interval count or final depth. The two ODE models reuse their saved field weights. The linear and fixed residual baselines retain their own discrete architectures; the interface states that these ODE controls do not change them. Holding weights and raw input fixed makes a refinement comparison interpretable."}</Prose>

<Prose>{"Where does each hidden coordinate go during this execution?"}</Prose>

<OdeStudyTraceLab />

<Prose>{"Every one of the four or six coordinates has its own actual clock/state trace. Inspecting an accepted index reveals the complete vector, rather than a selected projection that could hide a crossing or an added coordinate."}</Prose>

<Prose>{"What does the same path look like when we choose two coordinates?"}</Prose>

<OdeStudyProjectionLab />

<Prose>{"Select horizontal and vertical coordinates independently. The labelled numerical axes show this projection's extents; the full coordinate traces above remain available. A crossing in this view does not establish that two full states coincide, as the uniqueness argument in "}<strong>{"What can a continuous flow rearrange?"}</strong>{" explained."}</Prose>

<Prose>{"What is inside one of those field evaluations?"}</Prose>

<OdeStudyFieldLab />

<Prose>{"The supplied stage vector includes the actual stage clock. The stored input weight matrix has 16 output rows and five inputs for the 4D model, or seven inputs for the 6D model. Select a hidden row: multiply all its inputs by the row's weights, add its bias, then apply tanh. The drawing retains all 16 hidden outputs. Each derivative row reads all 16 of them and adds its own bias. Its matrix has four or six output rows. These are ordinary stored output-by-input matrices; the mapping widths 5→16→4 do not mean the first stored matrix is 5×16."}</Prose>

<Prose>{"Which tentative input generated those rates?"}</Prose>

<OdeStudyStageLab />

<Prose>{"Choose an accepted interval and a rate-evaluation number. The full tentative state, clock and derivative change together; the field drawing above inspects this same evaluation. Classical RK4 uses four probes for one accepted endpoint. Euler uses one. The residual comparator instead selects its block-specific field at each of its four fixed steps."}</Prose>

<Prose>{"Finally, which coordinates reach a particular class score?"}</Prose>

<OdeStudyReadoutLab />

<Prose>{"All final coordinates enter every saved class row. The three biases are added before softmax. Selecting a class changes inspection only, while the shared state and all three probabilities remain visible. This completes the raw-input→field→numerical-update→readout path using actual learned coefficients."}</Prose>

<Prose>{"For unchanged row 64, using 4, 16 and 64 RK4 steps gives versicolor probabilities 0.9337389, 0.9335432 and 0.9335421. Four Euler steps give 0.9442828. The weights are identical; the numerical realization changed. Agreement under refinement is useful evidence that the model is behaving like its continuous formulation locally. It does not prove accuracy everywhere or improve the training data automatically."}</Prose>

<Prose>{"Independent NumPy inference reproduces the saved PyTorch models' logits and traces within "}<InlineMath>{"8.9\\times10^{-16}"}</InlineMath>{" over the checked input/method/step cases. Input derivatives also agree with central differences. The downloadable calculations provide independent NumPy and finite-difference checks of those saved computations."}</Prose>

<H3>{"Run the complete study"}</H3>

<Prose>{"Keep "}<a href={"/learn-assets/neural-ode-continuous-depth-models/iris.csv"}>{"iris.csv"}</a>{" beside the "}<a href={"/learn-assets/neural-ode-continuous-depth-models/neural_ode_study.py"}>{"study program"}</a>{". With Python, NumPy and PyTorch installed, run the program from that directory:"}</Prose>

<CodeBlock language={"text"}>{"python neural_ode_study.py"}</CodeBlock>

<Prose>{"It writes the complete results and selected weights. Install SciPy as well to run the separate "}<a href={"/learn-assets/neural-ode-continuous-depth-models/ode_calculations.py"}>{"calculation program"}</a>{", which imports the study's model definitions and reuses the saved weights. That second command does not train again. The "}<a href={"/learn-assets/neural-ode-continuous-depth-models/data-provenance.md"}>{"provenance"}</a>{" records the versions used here."}</Prose>

<OdeVisibleProgram file="neural_ode_study.py" />

<Prose>{"Read the model definition and integrator first, then follow one fitting update. The remaining loop repeats that update under the declared selection protocol. The saved weights let you change inputs or solver resolution without rerunning the fits."}</Prose>

<H2>{"7. What happens between irregular observations?"}</H2>

<Prose>{"The classifier evolved a state from one fixed flower measurement. A sensor stream presents a different problem: information arrives at unequal times. How do we move the state between measurements without pretending that an unobserved value was measured as zero?"}</Prose>

<OdeObservationDrawing />

<Prose>{"The horizontal axis is clock time. A cyan marker means a measurement actually arrived. Between markers, the violet hidden state follows a decay curve. At a marker, a gray input wire feeds a weighted update and the hidden state jumps. The amber query line asks for the state at that time; it supplies no measurement and creates no jump. Measurements to its right have not become available to a causal query."}</Prose>

<Prose>{"Use one scalar hidden state h, initially zero. Between measurements let h' = −0.5h. At a measurement xᵢ, retain 70% of the old hidden state and add 30% of the new value:"}</Prose>

<div className="neural-equation"><MathBlock>{"h_i^- = h_{i-1}^+e^{-0.5(t_i-t_{i-1})},\\qquad\nh_i^+=0.7h_i^-+0.3x_i."}</MathBlock></div>

<Prose>{"The minus superscript means "}<strong>{"just before"}</strong>{" assimilation; plus means "}<strong>{"just after"}</strong>{", not negative versus positive state. The time difference determines how much decay occurs. This is a constructed "}<strong>{"ODE-RNN-shaped update"}</strong>{", with a simple weighted blend standing in for a learned recurrent update."}</Prose>

<Prose>{"For times (0.2, 0.9, 1.3) and measurements (1, −0.5, 0.8), work through the displayed jumps:"}</Prose>

<ol start={1}><li>{"At time 0.2, the zero state remains zero during propagation, then receives 0.3×1 = 0.3."}</li><li>{"The gap to 0.9 is 0.7. Propagation gives 0.3 exp(−0.35) = 0.211406; assimilation gives 0.7×0.211406 + 0.3×(−0.5) = −0.002016."}</li><li>{"The gap to 1.3 is 0.4. State decays to −0.001650, then the measurement raises it to 0.238845."}</li><li>{"A query at 1.6 adds no observation. Further decay gives 0.238845 exp(−0.15) = 0.205576."}</li></ol>

<Prose>{"Omitting the middle observation produces 0.310853 at 1.6. Observing zero there produces 0.279568. A zero observation still performs the 0.7 retention; omission removes the assimilation operation entirely. Adding more output-query times only samples the same propagation curve."}</Prose>

<Prose>{"Now explicitly switch to times (0.1, 0.7, 1.4) and values (1, −1, 0.5). Edit the event times and values, or add/remove an event. Change the propagation rate and query clock separately from the assimilation weight. Moving the query to one excludes the last event. An empty history leaves the zero initial state unchanged. Duplicate or out-of-order times need a declared ordering/aggregation policy, so this investigation retains the last valid ordered history and explains the rejected edit."}</Prose>

<Prose>{""}<strong>{"What information arrived, and when?"}</strong>{" Edit the ordered measurement history before changing its propagation rule."}</Prose>

<OdeObservationEventsLab />

<Prose>{""}<strong>{"How much state survives until a query?"}</strong>{" Change decay and query time while the measurement history stays fixed."}</Prose>

<OdeObservationPropagationLab />

<Prose>{""}<strong>{"How much should a newly available measurement change the state?"}</strong>{" Compare mixing with omission of an update."}</Prose>

<OdeObservationAssimilationLab />

<H3>{"Infer an initial state instead of updating at every observation"}</H3>

<Prose>{"Can observations tell us a distribution over the unknown state that began the process? This changes the modeling task again."}</Prose>

<OdeLatentDrawing />

<Prose>{"Read the upper path first: the available time/value/mask triples enter an encoder, which returns a mean μ and a positive scale σ for a latent initial state. A supplied noise sample ε goes through μ + σε to produce z₀. The ODE evolves that sample, and a decoder maps its later states to distributions for the measurements. The lower paths train this system: observation likelihood rewards explaining the measured values, while a prior penalty discourages the inferred initial distribution from departing too freely from a declared prior. Missing-value masks decide which likelihood terms exist; an observed zero is still a term."}</Prose>

<Prose>{"A "}<strong>{"Latent ODE"}</strong>{" is this generative construction, rather than another name for the scalar jump rule above. For one Gaussian latent coordinate, use μ = 0.4, σ = 0.6 and ε = −0.5. The sampled initial state is 0.4 + 0.6(−0.5) = 0.1. A fixed ε isolates the effect of changing μ or σ; repeatedly resampling it answers a different question about uncertainty."}</Prose>

<div className="neural-equation"><MathBlock>{"z_0=\\mu+\\sigma\\epsilon,\\quad \\epsilon\\sim\\mathcal N(0,1),\\qquad\n\\mathrm{KL}\\!\\left(\\mathcal N(\\mu,\\sigma^2)\\,\\|\\,\\mathcal N(0,1)\\right)\n=\\tfrac12(\\mu^2+\\sigma^2-1-\\log\\sigma^2)."}</MathBlock></div>

<Prose>{"Our example's KL is 0.270826. The square penalizes a displaced mean; the variance and log-variance terms keep a posterior from freely collapsing or expanding. A decoder with mean 0.7 and observation standard deviation 0.2 assigns a measured value 0.8 log-likelihood"}</Prose>

<div className="neural-equation"><MathBlock>{"\\log p(0.8\\mid z)=-\\tfrac12\\log(2\\pi\\,0.2^2)\n-\\frac{(0.8-0.7)^2}{2(0.2)^2}=0.565499."}</MathBlock></div>

<Prose>{"A density can exceed one, so a positive log-density is valid. These are "}<strong>{"separate constructed decoder operands"}</strong>{", not a claim that our sample 0.1 trained a decoder to output 0.7. For multiple observations, sum the available log-likelihood terms and average over latent samples. The training quantity is the evidence lower bound:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathrm{ELBO}\n=\\mathbb E_{q(z_0\\mid\\mathcal O)}\\!\\left[\\sum_{i\\in\\text{observed}}\\log p(x_i\\mid z(t_i))\\right]\n-\\mathrm{KL}(q(z_0\\mid\\mathcal O)\\|p(z_0))."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"\\mathcal O"}</InlineMath>{" is the information allowed into the encoder. The "}<a href={"/learn/path/full-curriculum/vae-elbo?module=generative-models"}>{"VAE and ELBO lesson"}</a>{" develops this inference objective and its implementation; the "}<a href={"https://proceedings.neurips.cc/paper_files/paper/2019/file/42a6845a557bef704ad8ac9cb4461d43-Paper.pdf"}>{"Latent ODE paper"}</a>{" connects it to continuous trajectories and an ODE-RNN recognition network. Its encoder may integrate backward through the observed set to infer z₀. That recognition computation is not the continuous loss adjoint from "}<strong>{"Learn through a trajectory"}</strong>{"."}</Prose>

<Prose>{"For interpolation, the allowed observation set can contain measurements on both sides of a query. For forecasting, restrict it to information available at the forecast origin, including preprocessing and masks. A latent distribution is not automatically calibrated uncertainty; posterior approximation, noise assumptions and held-out coverage all matter. A time-aware ordinary RNN is a legitimate comparison and can receive elapsed time directly."}</Prose>

<H3>{"The observation times can carry information too"}</H3>

<Prose>{"What if events arrive more often when the hidden condition changes? Ignoring timing may discard evidence."}</Prose>

<OdeEventRateDrawing />

<Prose>{"The upper strip shows a positive event rate λ(t). The cyan ticks mark actual arrivals. Each tick contributes log λ(tᵢ); the shaded rate integral charges for the expected number of arrivals across the whole observed window. For a point process with the specified conditional intensity,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\log p(\\{t_i\\})=\\sum_i\\log\\lambda(t_i)-\\int_0^T\\lambda(t)\\,dt."}</MathBlock></div>

<Prose>{"Take rate two on [0, 0.5), rate one on [0.5, 1], and arrivals at 0.2 and 0.8. The event terms sum to log2 + log1; the integral is 2×0.5 + 1×0.5 = 1.5. The timing log-likelihood is −0.806853. A neural model can produce a positive rate from its state, for example with softplus, and integrate that rate as another accumulator. The Latent ODE paper uses a Poisson-process timing model. Value likelihood and timing likelihood are different paths in the loss; neither turns a sensor policy or observational association into a causal claim."}</Prose>

<H2>{"8. Deeper: how does a flow move probability density?"}</H2>

<Prose>{"We have followed individual states and distributions over initial states. Suppose instead that we transform an entire population of samples. If a fixed amount of probability spreads over more space, how must its density change?"}</Prose>

<OdeDensityPatchDrawing />

<Prose>{"The cyan square has four labelled starting corners and probability mass m. The violet parallelogram contains their transported positions at the same final clock. Its area has changed, while its mass has not. The density along a moving point is mass per local area, so an area increase means an inverse density change. The second view rotates a patch without changing its area: movement itself is not evidence of expansion."}</Prose>

<Prose>{"Return to a two-dimensional linear field, now explicitly choosing"}</Prose>

<div className="neural-equation"><MathBlock>{"f(z)=Az,\\qquad A=\\begin{bmatrix}0.2&2\\\\0.4&-0.1\\end{bmatrix},\\qquad T=2."}</MathBlock></div>

<Prose>{"The exact map is exp(TA). Its determinant is exp(T trA), with trace trA = 0.2−0.1 = 0.1. Area multiplies by exp(0.2) = 1.221403; density along the trajectory multiplies by exp(−0.2) = 0.818731. The off-diagonal entries reshape and move the patch even though they do not appear directly in the trace."}</Prose>

<H3>{"Why the trace appears"}</H3>

<Prose>{"What connects this picture to a general learned field?"}</Prose>

<OdeDensityAccumulatorDrawing />

<Prose>{"The upper channels hold the state and return its rate f. The lower channel holds log-density and returns minus the sum of the field's same-coordinate derivatives. The solver updates both channels at the same stage clocks. The log-density channel receives the state; in the usual construction, it does not feed back into the state derivative."}</Prose>

<Prose>{"Let B(t) be the Jacobian of the evolving state with respect to its initial state. Differentiating the state equation gives B' = J_z f B, where J_z f is the field's state Jacobian. For a differentiable, invertible flow with the needed regularity and nonzero determinant, the determinant derivative yields"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{d}{dt}\\log|\\det B|\n=\\operatorname{tr}(B^{-1}B')\n=\\operatorname{tr}(B^{-1}J_zfB)\n=\\operatorname{tr}(J_zf)."}</MathBlock></div>

<Prose>{"Probability conservation says p_t(z(t)) |detB(t)| = p₀(z₀). Taking logs and differentiating therefore gives the "}<strong>{"instantaneous change-of-variables rule"}</strong>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{d}{dt}\\log p_t(z(t))=-\\operatorname{tr}J_zf(t,z(t))=-\\nabla\\cdot f(t,z(t))."}</MathBlock></div>

<Prose>{"The divergence is the diagonal sum of that Jacobian, measuring instantaneous local volume expansion. It is a state derivative, not a derivative with respect to clock time. Sampling evolves a base sample forward. Likelihood evaluation must relate the observed point back to its base density and accumulate the log-volume change in the correct direction. This distinction determines the sign and which initial density is known."}</Prose>

<Prose>{"A "}<strong>{"continuous normalizing flow"}</strong>{", or CNF, integrates these joint channels. The "}<a href={"/learn/path/full-curriculum/normalizing-flows-realnvp-glow-neural-ode?module=generative-models"}>{"normalizing-flows lesson"}</a>{" teaches full density-model training, base distributions and likelihood evaluation. Here the exact linear map is our checkable implementation case."}</Prose>

<H3>{"Obtain a trace without materializing every Jacobian entry"}</H3>

<Prose>{"For a large state, explicitly storing all d² Jacobian entries can be expensive. Can a vector product reveal their diagonal sum?"}</Prose>

<OdeTraceProbeDrawing />

<Prose>{"Follow one drawn sign vector ε through the actual matrix A: multiply Aε, then dot that output with ε. For ε = (1, 1), Aε = (2.2, 0.3), giving 2.5. For ε = (1, −1), Aε = (−1.8, 0.5), giving −2.3. Both are estimates of the same trace 0.1; the off-diagonal contributions cancel only when averaged over the probe distribution."}</Prose>

<Prose>{"If ε has zero mean and covariance I, expand the quadratic form:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[\\epsilon^\\top J\\epsilon]\n=\\sum_{i,j}J_{ij}\\mathbb E[\\epsilon_i\\epsilon_j]\n=\\sum_i J_{ii}=\\operatorname{tr}J."}</MathBlock></div>

<Prose>{"Independent equally likely signs satisfy those second-moment conditions. The four sign vectors in this two-dimensional example give 2.5, −2.3, −2.3, 2.5, whose mean is 0.1. A single estimate can have the wrong sign. Jacobian-vector or vector-Jacobian products compute the quadratic form without allocating the complete matrix; the earlier manual sensitivities established what these products mean. "}<a href={"https://arxiv.org/html/1810.01367v2"}>{"FFJORD"}</a>{" applies this estimator to continuous density models."}</Prose>

<Prose>{"Fix the random probe throughout one solve so the right-hand side remains a consistent function for the numerical solver. Trace sampling error and integration error are different. Unbiased trace estimation does not make an exponentiated density estimate unbiased, nor guarantee that a finite adaptive solve is an unbiased log-density estimator. Reverse-time integration, floating-point conditioning and the base density still need checks."}</Prose>

<H3>{"Penalize motion and Jacobian size separately"}</H3>

<Prose>{"Could we encourage a learned field to take an easier route without changing its architecture?"}</Prose>

<OdeRegularizerDrawing />

<Prose>{"Two additional scalar channels start at zero. One accumulates squared velocity; the other accumulates squared Jacobian size. Their outputs join the task loss with declared nonnegative weights. They receive the state path, but do not become extra hidden coordinates that change its derivative."}</Prose>

<div className="neural-equation"><MathBlock>{"r_v'=\\|f(t,z(t))\\|^2,\\qquad\nr_J'=\\|J_z f(t,z(t))\\|_F^2,\\qquad\nL_{\\rm total}=L_{\\rm task}+\\lambda_v r_v(T)+\\lambda_J r_J(T)."}</MathBlock></div>

<Prose>{"The Frobenius norm squares "}<strong>{"every"}</strong>{" Jacobian entry, then sums. For our A it is 0.2²+2²+0.4²+(−0.1)² = 4.21. Over T = 2 its constant-Jacobian accumulator is 8.42. The trace remains 0.1: small divergence does not imply a small Jacobian, low curvature or easy integration. Squared velocity depends on the trajectory and its units. "}<a href={"https://proceedings.mlr.press/v119/finlay20a.html"}>{"Finlay and colleagues"}</a>{" study kinetic and Jacobian regularization in CNFs; this calculation explains the operands without claiming a newly trained model or a universal speedup."}</Prose>

<Prose>{"The one-way dependency also matters to the controller. In a continuous adjoint, parameter-gradient quadrature receives the reconstructed state and adjoint but does not change those two derivatives. An "}<strong>{"adjoint seminorm"}</strong>{" can exclude that quadrature from the adaptive error norm, reducing work in suitable cases. It still numerically integrates the parameter gradient; exclusion is not a guarantee about its error. The "}<a href={"https://arxiv.org/abs/2009.09457"}>{"seminorm-adjoint paper"}</a>{" and official torchdiffeq options specify the trade-off. Distinguish controller norm, model regularization and task loss: each changes a different part of the computation."}</Prose>

<H2>{"9. Deeper: why train a velocity without solving each training pair?"}</H2>

<Prose>{"CNF likelihood training follows samples while accounting for volume change. Another route supplies training velocities directly. Where could those targets come from before the learned field is accurate?"}</Prose>

<OdeConditionalPathsDrawing />

<Prose>{"The cyan start x₀ is paired with an amber endpoint x₁. A clock t selects a location on the straight segment between them. Its target arrow is the endpoint difference, which is constant along that particular segment. For x₀ = 0 and x₁ = 2, the halfway location is one and the velocity is two."}</Prose>

<div className="neural-equation"><MathBlock>{"x_t=(1-t)x_0+tx_1,\\qquad u_t=x_1-x_0,\\qquad\nL=\\mathbb E\\|v_\\theta(t,x_t)-u_t\\|^2."}</MathBlock></div>

<Prose>{"For this endpoint-interpolation form of "}<strong>{"conditional flow matching"}</strong>{", sample a pair and a time, calculate x_t and u_t, and train a velocity regressor. Ordinary regression training does not integrate the learned ODE for each target. Generating a new sample still solves x' = vθ(t,x) from a base sample, unless a separately taught distillation or approximation changes that process. Other conditional paths retain endpoint noise or use different couplings, and therefore change these operands."}</Prose>

<H3>{"Two pair paths can supply different targets at the same input"}</H3>

<Prose>{"Does the learned field reproduce every paired straight segment?"}</Prose>

<OdeConditionalPathsDrawing mean />

<Prose>{"The second pair goes from two to zero. At t = 0.5, it also presents x = 1, but its target velocity is −2. A model receiving only (t, x) cannot distinguish the two pair identities. The arrows ±2 in the drawing belong to "}<strong>{"two conditional training paths"}</strong>{". The single violet output at their common input is their conditional mean, zero."}</Prose>

<Prose>{"For an output v at that input, equally likely targets give"}</Prose>

<div className="neural-equation"><MathBlock>{"\\tfrac12(v-2)^2+\\tfrac12(v+2)^2=v^2+4."}</MathBlock></div>

<Prose>{"Zero minimizes this quantity, giving mean squared loss four. Always predicting +2 gives mean loss eight. More generally, condition on the regressor input and expand a square around the conditional mean:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[\\|v-U\\|^2\\mid t,x]\n=\\|v-\\mathbb E[U\\mid t,x]\\|^2\n+\\mathbb E[\\|U-\\mathbb E[U\\mid t,x]\\|^2\\mid t,x]."}</MathBlock></div>

<Prose>{"The second term does not depend on v. The first explains why least-squares regression learns the conditional mean velocity. This local two-pair calculation is not a complete smooth-density model. Under the appropriate regularity assumptions, the population conditional-mean field transports the marginal probability path, as developed in "}<a href={"https://arxiv.org/html/2210.02747v2"}>{"Flow Matching for Generative Modeling"}</a>{"."}</Prose>

<Prose>{"The drawing keeps a learned marginal field separate from the paired paths for this reason. Straight conditional paths do not guarantee straight generated trajectories or a globally optimal transport map. A coupling specifies which endpoints are paired; a field specifies the velocity available from the model's actual input."}</Prose>

<Prose>{"CNF likelihood, latent-ODE reconstruction and flow-matching regression share an ODE solver but optimize different objectives. For full scratch/library implementations, couplings, schedules, generative fits and evaluation, continue to "}<a href={"/learn/path/full-curriculum/rectified-flow-flow-matching?module=generative-models"}>{"Rectified Flow and Flow Matching"}</a>{". That lesson develops the generative task beyond this mechanism comparison."}</Prose>

<H2>{"10. Deeper: how can scientific structure enter the field?"}</H2>

<Prose>{"The preceding objectives chose what to fit. We can also decide what the dynamics are allowed to do. Each construction below changes a specific missing assumption; keep its states and operations explicit before choosing a neural architecture."}</Prose>

<H3>{"Preserve known dynamics and learn the missing correction"}</H3>

<Prose>{"What if an existing physical rule explains most of the motion?"}</Prose>

<OdeKnownCorrectionDrawing />

<Prose>{"The same supplied state feeds two derivative routes. One computes a known rate; the other computes a learned correction. The gray add combines the "}<strong>{"rates"}</strong>{", then the solver multiplies that sum by its interval and adds it to state. For a constructed scalar case z = 1, a known decay −2z contributes −2 and a missing learned forcing contributes 0.3. The total rate is −1.7; one Euler step of size 0.1 reaches 0.83."}</Prose>

<div className="neural-equation"><MathBlock>{"z'=f_{\\rm known}(t,z)+f_\\theta(t,z)."}</MathBlock></div>

<Prose>{"This arrangement avoids making the learned component rediscover a known law. It does not identify the true missing physics automatically: different fields can fit the same short observed path, and hidden variables may change the apparent rule. Test new initial conditions, interventions where justified, conservation and held-out regimes. A good trajectory fit alone is insufficient evidence of mechanism identification."}</Prose>

<H3>{"Learn an energy and differentiate it to obtain motion"}</H3>

<Prose>{"Can we build conservation into the continuous field rather than reward it after the fact?"}</Prose>

<OdeHamiltonianDrawing />

<Prose>{"The two state coordinates are position q and momentum p. The energy contour through (1, 0) is the circle H = 0.5 for H(q,p) = (q²+p²)/2. Its gradient (q,p) points outward. The fixed skew operation rotates that gradient to the tangent velocity (p,−q). At (1,0), the velocity is (0,−1), moving along the contour rather than across it."}</Prose>

<Prose>{"For a differentiable autonomous learned energy Hθ, "}<strong>{"Hamiltonian dynamics"}</strong>{" use"}</Prose>

<div className="neural-equation"><MathBlock>{"q'=\\nabla_p H_\\theta,\\qquad p'=-\\nabla_q H_\\theta,\n\\qquad\n\\frac{dH_\\theta}{dt}\n=\\nabla_qH_\\theta^\\top\\nabla_pH_\\theta\n-\\nabla_pH_\\theta^\\top\\nabla_qH_\\theta=0."}</MathBlock></div>

<Prose>{"The cancellation concerns the exact autonomous field. Explicit Euler from (1,0) with h = 0.1 gives (1,−0.1), energy 0.505: the solver has not inherited exact conservation. A symplectic Euler ordering first sets p_new = p_old−h q_old, then q_new = q_old+h p_new, giving (0.99,−0.1), energy 0.49505. Symplectic integration preserves a geometric structure and can give better long-time behavior for suitable systems; it is not exact energy conservation at every step. A damped system also needs dissipation rather than the preceding pure conservation assumption. The "}<a href={"https://arxiv.org/abs/1906.01563"}>{"Hamiltonian Neural Networks paper"}</a>{" makes the learned-energy route explicit."}</Prose>

<H3>{"Learn a solution or learn its derivative?"}</H3>

<Prose>{"A Neural ODE learned a rate and integrated it. What changes if a network directly outputs the proposed solution?"}</Prose>

<OdeSolutionResidualDrawing />

<Prose>{"The upper route takes a clock and predicts uθ(t). Automatic differentiation produces its clock derivative; a residual subtracts the required derivative rule. The lower ODE route instead takes the current state and clock, predicts a rate, and lets a solver produce future states. For the equation u' = −u, a candidate uθ(t) = c exp(−t) has residual u' + u = 0 for "}<strong>{"every"}</strong>{" c. An initial-condition term is needed to select c = 1 when u(0) = 1. Satisfying a differential residual alone does not identify the desired solution."}</Prose>

<Prose>{"A physics-informed neural network may penalize equation residuals and initial/boundary conditions at sampled coordinates. The "}<a href={"/learn/path/full-curriculum/physics-informed-neural-networks-pinns?module=frontier-research"}>{"PINN lesson"}</a>{" develops those loss and sampling choices. The two routes can be combined, but require different information, optimization and verification."}</Prose>

<H3>{"Detect an event and apply an explicit jump"}</H3>

<Prose>{"How should the solver handle a state reaching a boundary?"}</Prose>

<OdeEventResetDrawing />

<Prose>{"The state falls from one at rate −1. The event function g(z) = z reaches zero at clock one. A root finder locates that crossing within the numerical interval; a separate reset rule sets the state to 0.8 before the next segment. The reset is a specified operation, not a motion invented by the smooth field."}</Prose>

<Prose>{"For z' = −α, α > 0 and z(0) = 1, the event time is τ = 1/α and its rate derivative is −1/α². More generally, differentiating g(τ,z(τ,θ),θ) = 0 gives an event-time derivative with denominator g_t + g_z f. Near a tangent contact this denominator can vanish; changes in which event occurs first can also change the derivative contract. A solver that checks only endpoint signs may miss multiple crossings inside an interval. State reset derivatives and event-time sensitivity must be included when differentiating the entire hybrid program. The ordinary smooth adjoint in "}<strong>{"Learn through a trajectory"}</strong>{" did not cover those jumps automatically."}</Prose>

<H3>{"Supply a continuous input path or a noise process"}</H3>

<Prose>{"An irregular sensor may drive the dynamics through a continuous interpolated input. Is that the same as repeatedly adding observations or random dropout?"}</Prose>

<OdeControlledStochasticDrawing />

<Prose>{"In the left route, a specified input path X supplies increments ΔX. The field multiplies them to update the state, as in dz = fθ(z) dX. For the scalar smooth path construction dz = z dX, starting at one, a positive increment ΔX = 0.2 gives an Euler increment 0.2 and state 1.2; the exact solution across that input change is exp(0.2) = 1.221403. Its dependence is on the input path, rather than elapsed time alone. A "}<strong>{"controlled differential equation"}</strong>{" also needs the interpolation and information-availability policy for X."}</Prose>

<Prose>{"In the right route, a Brownian increment ΔW has variance Δt. In an Itô SDE dz = a(t,z)dt + b(t,z)dW, the drift and noise contributions are separate. For Δt = 0.1, drift zero, b = 0.5 and a constructed standard-normal draw ξ = 1, the noise increment is 0.5√0.1 = 0.158114. That one draw illustrates the scaling; it is not an expected deterministic path. The calculus convention affects derivatives and numerical methods. Follow "}<a href={"/learn/path/full-curriculum/it-calculus-stochastic-differential-equations?module=math-foundations"}>{"Itô Calculus and Stochastic Differential Equations"}</a>{" for that foundation, and "}<a href={"https://arxiv.org/html/2202.02435"}>{"Kidger's neural differential-equations treatment"}</a>{" for neural controlled/stochastic constructions."}</Prose>

<Prose>{"New dropout masks on each evaluation do not automatically define either model: a solver expects a declared mathematical input/noise contract. An observation jump, a controlled increment and Brownian forcing represent different processes even when each changes state."}</Prose>

<H3>{"Deeper implementation choices: reversible steps and learned corrections"}</H3>

<Prose>{"The continuous backsolve could amplify reconstruction error. Can we instead reverse the "}<strong>{"executed numerical step"}</strong>{"?"}</Prose>

<OdeReversibleStepDrawing />

<Prose>{"The deterministic worked drawing starts with main state 1, auxiliary state 1 and rate −1. With h = 0.1, its auxiliary update gives 0.9, then averaging the old and new rates gives main state 0.905. Reversing the drawn algebra first recovers auxiliary state 1, then main state 1. The auxiliary value is a numerical variable, not another learned hidden coordinate."}</Prose>

<Prose>{"A reversible integrator retains enough algebraic information to undo its own updates, unlike reconstructing an exact continuous path from a rounded final state. Reversible Heun methods exploit such coupled update equations. Algebraic reversibility does not remove floating-point error, saved requested outputs or parameter-gradient storage; it is not a universal constant-memory promise. "}<a href={"https://proceedings.neurips.cc/paper/2021/file/9ba196c7a6e89eafd0954de80fc1b224-Paper.pdf"}>{"Efficient and Accurate Gradients for Neural SDEs"}</a>{" develops reversible Heun with a declared stochastic convention and reconstructible noise. Its particular performance measurements do not transfer automatically to a deterministic classifier."}</Prose>

<Prose>{"A "}<strong>{"hypersolver"}</strong>{" takes another route. It predicts a correction to a known numerical step:"}</Prose>

<div className="neural-equation"><MathBlock>{"z_{n+1}=\\Psi_h(t_n,z_n)+h^{p+1}g_\\phi(t_n,z_n,h),"}</MathBlock></div>

<Prose>{"where Ψ_h is a specified order-p method and the scaling represents its local error order under the appropriate smoothness assumptions. The correction can be trained against a higher-accuracy reference. It must be tested on new states, intervals and field parameters; a learned correction for one dynamics family is not automatically a general-purpose solver. "}<a href={"https://proceedings.neurips.cc/paper/2020/hash/f1686b4badcf28d33ed632036c7ab0b8-Abstract.html"}>{"Hypersolvers: Toward Fast Continuous-Depth Models"}</a>{" investigates that learned numerical approximation. Neither design substitutes for defining the forward equation, gradient objective and refinement test."}</Prose>

<H2>{"11. Diagnose the right layer of a problem"}</H2>

<Prose>{"We have changed field, solver, loss, information boundary and state structure separately. When a result is surprising, which of those layers should we inspect first?"}</Prose>

<Prose>{"A useful implementation begins with a small, deterministic field and a checkable solver. Add complexity after establishing which part of the system needs it."}</Prose>

<NeuralTable caption={"11. Diagnose the right layer of a problem"} headers={[<>{"Observation"}</>,<>{"A question to investigate"}</>,<>{"Useful controlled check"}</>]} rows={[[<>{"Endpoint changes under finer resolution"}</>,<>{"Was training exploiting a coarse numerical map?"}</>,<>{"Keep weights/input fixed; compare methods and step sizes"}</>],[<>{"Gradient differs from a reference"}</>,<>{"Are both differentiating the same objective and discretization?"}</>,<>{"Compare autograd with finite differences of the exact executed loss"}</>],[<>{"Backward reconstruction fails"}</>,<>{"Does reversing dynamics amplify endpoint error?"}</>,<>{"Test an analytic system; compare stored/checkpointed states"}</>],[<>{"Adaptive solver takes many steps"}</>,<>{"Is the cause scaling, tolerances, transients, smoothness or stiffness?"}</>,<>{"Normalize coordinates; inspect rejection/error traces; compare an appropriate implicit method"}</>],[<>{"More input examples change a batch member's result"}</>,<>{"Are states coupled by BatchNorm or a shared adaptive error controller?"}</>,<>{"Evaluate examples individually and inspect the batch error norm"}</>],[<>{"Trajectory seems to cross itself"}</>,<>{"Is it a projection or a visit at another time?"}</>,<>{"Inspect full state with time labels"}</>],[<>{"Forecast looks too accurate"}</>,<>{"Did the encoder see observations beyond the forecast origin?"}</>,<>{"Rebuild the information-availability mask before fitting"}</>],[<>{"Density behaves implausibly"}</>,<>{"Is the divergence sign/direction right, and is trace noise large?"}</>,<>{"Use an exact linear flow with known determinant first"}</>]]} />

<Prose>{"Batching deserves particular care. A shared adaptive controller can use a norm over a whole batch. Many easy coordinates may dilute one difficult coordinate under an RMS norm; a maximum-based norm behaves differently. Even when the mathematical fields are independent, step decisions can depend on which examples are batched together."}</Prose>

<Prose>{"For neural fields, smooth activations often make high-order integration easier to use. ReLU is Lipschitz, so it does not by itself destroy uniqueness, but its kinks can affect differentiability and numerical-order behavior. Repeated random dropout masks or mutable normalization statistics can change the field between evaluations; decide what fixed function the solver is supposed to integrate."}</Prose>

<Prose>{"Performance depends on field cost, forward and backward evaluations, state size, saved outputs, solver/controller overhead and device utilization. Record those factors before making a timing claim. More accurate integration need not improve statistical prediction if model or data error dominates."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"12. Practice: transfer the mechanism"}</H2>

<Prose>{"Use these independently changed cases to work through the mechanism. Hints and reasoned solutions follow each question. Numerical answers refer to the stated finite computation or exact equation, as named."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A different decay"}</H3>

<Prose>{"Start at "}<InlineMath>{"z_0=2"}</InlineMath>{", with "}<InlineMath>{"z'=-3z"}</InlineMath>{". Take two Euler steps of length 0.1. Compare the result with the exact state at time 0.2. Explain the sign of the error."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Each Euler step multiplies the state by "}<InlineMath>{"1-3(0.1)"}</InlineMath>{". Compare that factor with the exact exponential factor."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"Euler gives "}<InlineMath>{"2(0.7)^2=0.98"}</InlineMath>{". The exact state is "}<InlineMath>{"2e^{-0.6}=1.097623272"}</InlineMath>{", so the error, numerical minus exact, is −0.117623272. The start-of-step tangent keeps decreasing at its initial slope while the exact positive state's decay slows. For this step size, Euler therefore decreases too far."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Resolution without new weights"}</H3>

<Prose>{"A four-dimensional field takes the state plus time through a 16-unit tanh hidden layer and a four-output affine layer. A three-class affine head reads the final state. Count the parameters. Does increasing classical RK4 steps from four to twelve triple them?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"An affine map from "}<InlineMath>{"a"}</InlineMath>{" inputs to "}<InlineMath>{"b"}</InlineMath>{" outputs has "}<InlineMath>{"ab+b"}</InlineMath>{" parameters. Count field and readout separately from evaluations."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"The field has "}<InlineMath>{"5(16)+16+16(4)+4=164"}</InlineMath>{" parameters. The readout has "}<InlineMath>{"4(3)+3=15"}</InlineMath>{", totaling 179. Four versus twelve RK4 steps require 16 versus 48 field evaluations, but both use the same 179 parameters. The forward computation grows; the parameter set does not."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. A local estimate is not a final guarantee"}</H3>

<Prose>{"An embedded step has current state 0.5, Heun state 0.49 and Euler state 0.48. Let relative tolerance be 0.02 and absolute tolerance 0.001. Is it accepted by the lesson's scalar controller? Does acceptance prove endpoint error below 0.001?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Use the maximum magnitude of current and Heun states in the denominator."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"The scale is "}<InlineMath>{"0.001+0.02(0.5)=0.011"}</InlineMath>{". The normalized difference is "}<InlineMath>{"0.01/0.011=0.90909"}</InlineMath>{", so this step is accepted. That is a comparison of two local approximations. Accumulation, estimator accuracy and conditioning separate it from a guarantee about final global error."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Differentiate one Euler step"}</H3>

<Prose>{"Use "}<InlineMath>{"z'=\\theta z"}</InlineMath>{", "}<InlineMath>{"z_0=1.5"}</InlineMath>{", one step of length 0.2, target 1, and half squared error. At "}<InlineMath>{"\\theta=-1"}</InlineMath>{", calculate the prediction and parameter gradient of this one-step program."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Differentiate "}<InlineMath>{"z_1=z_0(1+h\\theta)"}</InlineMath>{", then apply the loss derivative."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"The prediction is 1.2; "}<InlineMath>{"dz_1/d\\theta=0.3"}</InlineMath>{". Therefore "}<InlineMath>{"dL/d\\theta=(1.2-1)(0.3)=0.06"}</InlineMath>{". A small gradient-descent step decreases "}<InlineMath>{"\\theta"}</InlineMath>{", reducing the numerical prediction toward the target. The exact continuous prediction "}<InlineMath>{"1.5e^{-0.2}"}</InlineMath>{" defines a different loss; substituting it halfway through this calculation would mix objectives."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Separate invertibility from a readout"}</H3>

<Prose>{"Can a unique one-dimensional continuous flow followed by one linear threshold label inputs −2 and 3 as class one and input 0 as class zero? Construct an augmented solution and name a numerical failure that could confuse this test."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Preserve ordering in one dimension, then use a second coordinate proportional to the square of the first."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"The one-dimensional flow keeps 0 between the other points, so a single threshold cannot select both outer points alone. Starting at "}<InlineMath>{"(x,0)"}</InlineMath>{", the field "}<InlineMath>{"x'=0,y'=x^2"}</InlineMath>{" reaches "}<InlineMath>{"(-2,4),(0,0),(3,9)"}</InlineMath>{" at time one; "}<InlineMath>{"y>1"}</InlineMath>{" works. A coarse explicit solver can reverse or collapse order even where the exact flow does not. A nonlinear readout also changes the representational question and must not be silently substituted."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Observation deletion"}</H3>

<Prose>{"Start at zero. Let "}<InlineMath>{"h'=-0.5h"}</InlineMath>{", and update by "}<InlineMath>{"h^+=0.7h^-+0.3x"}</InlineMath>{" at times 0.4 and 1.0 with observations 2 and 0. Query at 1.2. Compare with omitting the second observation."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The second observed value is zero, but its update still scales existing state by 0.7."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"After the first observation, state is 0.6. With the zero observation, the final state is "}<InlineMath>{"0.6e^{-0.3}(0.7)e^{-0.1}=0.42e^{-0.4}=0.281534419"}</InlineMath>{". Omitting it gives "}<InlineMath>{"0.6e^{-0.4}=0.402192028"}</InlineMath>{". Zero is evidence processed through an update; deletion removes that operation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Expansion and density"}</H3>

<Prose>{"A two-dimensional linear field has matrix "}<InlineMath>{"\\begin{bmatrix}0.4&3\\\\0&-0.1\\end{bmatrix}"}</InlineMath>{". Over 1.5 units of time, what are the log-density change and volume multiplier? Does a large off-diagonal entry invalidate the trace calculation?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The trace is the diagonal sum. Density and volume change inversely along the flow."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"The trace is 0.3. Log-density changes by −0.45, and volume multiplies by "}<InlineMath>{"e^{0.45}=1.568312185"}</InlineMath>{". Density multiplies by "}<InlineMath>{"e^{-0.45}=0.637628152"}</InlineMath>{". The off-diagonal entry alters shape and motion; the determinant identity still uses the trace for this constant linear field."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. What can a velocity regressor know?"}</H3>

<Prose>{"Two equally likely training pairs are "}<InlineMath>{"−1\\to3"}</InlineMath>{" and "}<InlineMath>{"3\\to−1"}</InlineMath>{". At time 0.5, what location and target velocities do they present? What prediction minimizes mean squared loss at that location? Why should you not draw both pair paths as solutions of a single unique field?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A model receiving only position and time cannot distinguish the pair identity."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"Both present location one, with velocities +4 and −4. Their conditional mean is zero; the mean squared loss there is 16. Always choosing +4 would give mean loss 32. Under uniqueness, one field cannot choose two velocities at the identical state and time. Pair-conditioned training paths and trajectories of the learned marginal field are different objects."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Design an honest comparison"}</H3>

<Prose>{"A report trains a neural flow and a residual classifier, tries new tolerances after reading test accuracy, and publishes only the best seed. It calls a two-coordinate projection proof that trajectories never cross. Propose a corrected protocol."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Separate data roles, statistical variation, numerical sensitivity and the full-state mathematical claim."}</Prose>

</details>

<details>

<summary>Solution and reasoning</summary>

<Prose>{"Declare splits, preprocessing, architectures, budgets, seeds and model-selection rules before assessment. Fit transformations only on training data and select with validation; retain all declared seeds and report actual parameter/evaluation costs. Perform solver-sensitivity checks on a specified diagnostic or validation set with fixed weights, then assess under a fixed protocol. A projection is a visualization of selected coordinates, not a proof about full-state uniqueness. State theorem assumptions and use analytic counterexamples or full-state checks for the claim actually being made."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Implement a clock-correct sensitivity"}</H3>

<Prose>{"Use the new "}<code>{"ode_sensitivities.py"}</code>{" on z′ = θz + t. Start at clock 0.2 with state 0.8, stop at 0.7, use two Euler intervals, θ = 0 and target 0.9. Calculate the finite endpoint, its initial-state and parameter loss derivatives, and the separately exact continuous answers. Then call "}<code>{"example(initial=(.8,), rates=(0,), target=(.9,), start=.2, stop=.7, intervals=2, method='euler')"}</code>{" to check your calculations. Inspect which actual stage clocks the solver stores. Why would using a zero-based reverse clock change this problem?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The two Euler rates are the supplied clocks 0.2 and 0.45. The parameter derivative of the rate is the current state even at θ = 0. For the exact answer, integrate the clock term and the sensitivity equation separately."}</Prose>

</details>

<details><summary>Solution and reasoning</summary>

<Prose>{"Each interval is 0.25. Euler reaches 0.8 + 0.25×0.2 = 0.85, then 0.85 + 0.25×0.45 = 0.9625. The residual is 0.0625. The initial-state derivative of this endpoint is one. The parameter sensitivity starts at zero, becomes 0.25×0.8 = 0.2, then 0.2 + 0.25×0.85 = 0.4125. Thus the finite loss derivatives are 0.0625 with respect to the initial state and 0.0625×0.4125 = 0.02578125 with respect to θ."}</Prose>

<Prose>{"The exact endpoint is 0.8 + (0.7²−0.2²)/2 = 1.025, with residual 0.125. At θ = 0, its parameter sensitivity is Δz₀ + aΔ²/2 + Δ³/6 = 0.445833333, where a = 0.2 and Δ = 0.5. The exact loss derivatives are 0.125 and 0.0557291667. These differ from the finite Euler derivatives because their endpoints and sensitivities come from a different forward function. A clock restarted at zero would supply a different t term in every backward rate. Refining RK4 can check convergence; it does not make the two-interval Euler loss retrospectively continuous."}</Prose>

</details>

<Prose>{"You are ready to continue when you can distinguish a field from a solved trajectory, compute and compare numerical updates, name the objective behind a gradient, explain augmentation with its readout assumption, and keep observation availability separate from evaluation time. You should also be able to read an experiment's counts and numerical limits without needing every method to win."}</Prose></div></section>

<H2>{"13. Continue and learn another way"}</H2>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"What to learn next"}</H3>

<Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/hybrid-ssm-transformer-architectures-jamba?module=deep-learning-fundamentals"}>{"Hybrid SSM–Transformer Architectures (Jamba)"}</a>{". It returns to discrete token sequences and combines different memory operations. Our current lesson adds another distinction to that comparison: a continuous dynamical model still needs a concrete numerical execution method."}</Prose></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><H3>{"References and other ways to learn"}</H3>

<Prose>{"Start with one numerical treatment and one neural-model treatment, then return to the primary papers for the branches you want to build."}</Prose>

<ul><li>{""}<a href={"https://pkarnakov.com/am205/slides/unit3/"}>{"Harvard AM205, Unit 3: Initial-Value Problems"}</a>{". A conventional numerical route through Euler, Runge–Kutta, local/global error, adaptive estimates and stability. Start at the initial-value-problem and time-stepping slides; this is the numerical counterpart to sections 1–4."}</li><li>{""}<a href={"https://arxiv.org/html/2202.02435"}>{"On Neural Differential Equations"}</a>{", Patrick Kidger. A broad specialist treatment. Begin with the Neural ODE model and parameterization sections; use its backpropagation, numerical solver and regularization chapters after the worked gradient comparison. Its controlled/stochastic chapters extend section 10 with the needed mathematical assumptions."}</li></ul>

<ul><li>{""}<a href={"https://arxiv.org/html/1806.07366v5"}>{"Neural Ordinary Differential Equations"}</a>{", Chen and colleagues. Primary introduction to learned dynamics, adjoints and applications. Read the mathematical model first; revisit memory claims with the numerical qualifications in this lesson."}</li><li>{""}<a href={"https://arxiv.org/html/2005.13420v2"}>{"Discretize-Optimize vs. Optimize-Discretize"}</a>{", Onken and Ruthotto. An intermediate numerical perspective on gradients, rediscretization and extrapolation. Its experiments are specific evidence, not universal timing ratios."}</li><li>{""}<a href={"https://arxiv.org/html/1904.01681v1"}>{"Augmented Neural ODEs"}</a>{", Dupont and colleagues. Read the one-dimensional construction and appendix uniqueness argument after section 5; the linear readout and exact-flow assumptions are essential."}</li><li>{""}<a href={"https://github.com/rtqichen/torchdiffeq"}>{"torchdiffeq"}</a>{" and its "}<a href={"https://github.com/rtqichen/torchdiffeq/blob/master/FAQ.md"}>{"FAQ"}</a>{". Practical PyTorch API and solver/adjoint guidance. Repository documentation was reviewed and the downloadable local solver bridge was executed with torchdiffeq 0.2.5; the repository’s separate official example suite was not executed. The downloadable local study is self-contained with PyTorch."}</li><li>{""}<a href={"https://docs.kidger.site/diffrax/api/adjoints/"}>{"Diffrax adjoints"}</a>{". A JAX-oriented explanation of checkpointed differentiation and continuous backsolves. Read after the scalar gradient experiment rather than starting with every API class."}</li><li>{""}<a href={"https://proceedings.neurips.cc/paper_files/paper/2019/file/42a6845a557bef704ad8ac9cb4461d43-Paper.pdf"}>{"Latent ODEs for Irregularly-Sampled Time Series"}</a>{". Primary methods for encoding observations and separating interpolation from extrapolation. Useful after the observation-jump investigation."}</li><li>{""}<a href={"https://arxiv.org/html/1810.01367v2"}>{"FFJORD"}</a>{" and "}<a href={"https://arxiv.org/html/2210.02747v2"}>{"Flow Matching"}</a>{". Two different training routes for continuous generative models. Their objectives deserve separate study, even though both generate with learned dynamics."}</li><li>{""}<a href={"https://arxiv.org/abs/1902.10298"}>{"ANODE"}</a>{", "}<a href={"https://proceedings.mlr.press/v119/finlay20a.html"}>{"regularizing CNFs"}</a>{", and "}<a href={"https://arxiv.org/abs/2009.09457"}>{"adjoint seminorms"}</a>{". Different responses to reconstruction, difficult fields and unnecessary controller work. Read them after sections 4 and 8; they change different layers and do not supply interchangeable guarantees."}</li><li>{""}<a href={"https://arxiv.org/html/1906.01563v2"}>{"Hamiltonian Neural Networks"}</a>{", "}<a href={"https://proceedings.neurips.cc/paper/2021/file/9ba196c7a6e89eafd0954de80fc1b224-Paper.pdf"}>{"Efficient and Accurate Gradients for Neural SDEs"}</a>{", and "}<a href={"https://proceedings.neurips.cc/paper/2020/hash/f1686b4badcf28d33ed632036c7ab0b8-Abstract.html"}>{"Hypersolvers"}</a>{". Primary routes into learned energy, reversible numerical updates and learned local corrections. Begin with their model/update definitions after section 10; their reported workloads and stochastic conventions need their own evaluation."}</li><li>{""}<a href={"https://anucvml.github.io/ddn-cvprw2020/talk2.html"}>{"Ricky T. Q. Chen's CVPR 2020 workshop talk"}</a>{". An alternate video route into constraints, physical dynamics and probabilistic models. The organizer's title, speaker and abstract were verified; the embedded recording was not watched, and no timestamp is claimed. Use the paper and checked calculations for technical details."}</li></ul></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H3>{"Build and reproduce"}</H3>

<Prose>{"The visible complete programs above cover fixed solver/training ("}<code>{"neural_ode_study.py"}</code>{"), manual sensitivities ("}<code>{"ode_sensitivities.py"}</code>{"), the matched library route ("}<code>{"solver_library_bridge.py"}</code>{") and local calculations ("}<code>{"ode_calculations.py"}</code>{"). Keep the library bridge beside the study because it imports the already implemented "}<code>{"integrate"}</code>{"; that is deliberate scratch-code reuse. The new sensitivity program is standalone and writes no result files."}</Prose>

<Prose>{""}<a href={"/learn-assets/neural-ode-continuous-depth-models/calculated-inputs.json"}>{"Calculated inputs and outcomes"}</a>{", "}<a href={"/learn-assets/neural-ode-continuous-depth-models/fitted-models.json"}>{"saved weights"}</a>{", "}<a href={"/learn-assets/neural-ode-continuous-depth-models/study-results.json"}>{"all declared fitting histories"}</a>{", "}<a href={"/learn-assets/neural-ode-continuous-depth-models/iris.csv"}>{"Iris measurements"}</a>{" and "}<a href={"/learn-assets/neural-ode-continuous-depth-models/data-provenance.md"}>{"data provenance"}</a>{" support offline reproduction. The reader's shared file index gathers the program and supporting-file links once. No external large-model checkpoint is required."}</Prose>

<OdeVisibleProgram file="ode_calculations.py" /></section>
  </div></OdeStudyContext></OdeFlowContexts> };
