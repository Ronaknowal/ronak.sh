# Neural ODEs: learn a rule for change, then follow it

**Explore as you read.** Change a local rule, watch the resulting motion, and separate the effect of learned weights from the effect of a numerical solver. Later, edit real measurements and observation times with all fitted weights held fixed.

Suppose you know where a point starts and how it should move at its current location. You can make a small move, ask for its new direction, and repeat. A **Neural ODE** replaces a fixed list of neural-network layers with a learned rule for these local changes. A numerical algorithm follows the rule; another small network reads the final state to make a decision.

This lesson builds that computation one operation at a time. The network learns **change per unit depth**. The solver adds up that change. Increasing the number of solver steps repeats the same learned rule more carefully; it does not automatically add more learned layers or weights.

**First pass.** Read sections 1–7, use their local investigations, and do the core practice. The visible deeper branches explain density, flow matching and structured scientific dynamics after the field/solver/training distinction has been established. Follow their worked operations before returning to the formal statements.

The [Perceptrons lesson](/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals) supplies weighted sums and activations. [Backpropagation](/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals) supplies the chain rule, Jacobians and vector products. [Residual Connections](/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals) supplies the keep-and-add path. We refresh the operations needed here. [ODEs & Linear Systems](/learn/path/full-curriculum/ordinary-differential-equations-linear-systems?module=math-foundations) develops the underlying solution theory; no numerical-solver terminology is assumed in this lesson.

## 1. A derivative tells you how to move

**What changes when a rule says “decrease at twice the current value”?** Start with one number, 1. The following drawing keeps the current value, its rate of change, and the finite move separate.

[Flow ODE — decay-step]

The cyan 1 is the **state**: the information we carry. Multiplying it by the fixed coefficient −2 produces the violet rate −2. This is a change **per unit time**, not a replacement state. For a small interval of length 0.1, multiply that rate by 0.1 to get a proposed change of −0.2. The identity wire preserves the original 1, and the add operation gives 1−0.2=0.8.

At the new state, the rate would be −2(0.8)=−1.6. The decrease slows. Our first move treated the initial rate as constant throughout the interval, so it decreased too far: the exact endpoint at the same time is approximately 0.81873. The vertical segment in the drawing is **numerical error**, not another force moving the state.

Now attach names to those operations. Write \(z(t)\) for the state at time \(t\), and \(z'(t)\), or \(dz/dt\), for its instantaneous rate. Our rule and initial value are

\[
z'(t)=-2z(t),\qquad z(0)=1,\qquad z(t)=e^{-2t}.
\]

An **initial-value problem** asks for the evolving state given its starting value and rule. The exact exponential solves this particular problem. Most learned rules have no convenient closed-form trajectory, so we construct finite moves instead. The move just drawn is **forward Euler**:

\[
z_{k+1}=z_k+h f(t_k,z_k),\qquad h=0.1.
\]

Here \(f\) names the rule, \(h\) the interval length, and \(k\) the accepted-step index. The clock \(t_k\) and the index \(k\) are different: step sizes need not be equal. Euler uses one field evaluation for one accepted move. It can run backward with negative \(h\), but accuracy and stability still require checking.

**How can a neural network supply the rule?** Replace the fixed multiplication by an ordinary small network that receives the current state and clock. The drawing below uses two state coordinates and two hidden units so every operation can be read.

[Flow ODE — tiny-field]

The incoming state is \((1,0)\), and the clock is 0. These three supplied numbers enter two weighted sums, with a bias for each. The first uses weights \((1,-1,0.5)\) and bias 0.1, giving 1.1; the second uses \((0.5,0.25,-0.5)\) and bias −0.2, giving 0.3. Applying tanh gives approximately \((0.800499,0.291313)\). The next weighted sums use rows \((0.5,-0.25)\), \((-0.2,0.4)\) and biases \((0.05,-0.1)\), producing approximately \((0.377421,-0.143575)\).

Those last two numbers are a **derivative vector**, one rate for each state coordinate. The network does not return the next state. The solver still multiplies by \(h\) and adds the unchanged state through the gray identity route. With \(h=0.1\), the next Euler state is approximately \((1.037742,-0.0143575)\). This is a constructed circuit, not weights fitted to the flower dataset later in the lesson.

For a column-state convention, the operation is

\[
u=\begin{bmatrix}z\\t\end{bmatrix},\quad
r=W_1u+b_1,\quad q=\tanh(r),\quad
f_\theta(t,z)=W_2q+b_2.
\]

The symbol \(\theta\) collects the learned matrices and biases. The input matrix has **output units as rows**, so its shape here is 2×3; the output matrix is 2×2. This agrees with the weight storage in PyTorch's `nn.Linear`. The network's output shape matches the state shape. Adding a clock input makes the rule time-dependent, or **nonautonomous**, even though the same weights are reused at every call.

**Where does the decision enter?** A field, a solver and a readout have different jobs. Trace their wires before combining them into an equation.

[Flow ODE — field-solver-readout]

The state enters the learned field repeatedly. Each call returns a rate; solver operations accumulate it into a final state. A final weighted sum converts that state to class scores, or **logits**, and softmax converts scores to probabilities. The supplied correct class travels directly to the loss for comparison. It is not an input to the field or solver. During inference the learned weights stay fixed; during training a gradient changes them.

\[
z_T=\operatorname{Solve}(f_\theta,z_0,0,T),\qquad
\text{logits}=Wz_T+b.
\]

For measurements taken over hours, \(t\) may be physical time. For a classifier transforming one flower measurement, \(t\) is **representation depth**: a coordinate along a computation. The flower does not grow while the solver runs. A value of \(T=1\) is a chosen depth interval, not a botanical time measurement.

### The connection to the keep-and-add path

The Euler add just drawn has the same structure as the identity route in [Residual Connections](/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals): preserve the state and add a correction. A sequence of Euler moves with a shared field is a residual computation with tied weights and an explicit step size.

An arbitrary ResNet can use a different function at each layer. It is not automatically one smooth flow with one parameter set. A continuous-depth model specifies its field first; the solver chooses when and how often to evaluate it. More evaluations can reduce numerical error without increasing the learned parameter count.

**Deeper: why a small step helps, and what it does not prove.** For a twice-differentiable scalar trajectory, Taylor expansion gives \(z(t+h)=z(t)+hz'(t)+\frac12h^2z''(t)+O(h^3)\). Euler discards the curvature term. Its one-step defect is therefore \(O(h^2)\); under suitable smoothness and stable finite-horizon error propagation, approximately \(1/h\) such defects yield first-order global error \(O(h)\). This is an asymptotic statement, not a guarantee that any step size is stable or that smaller floating-point steps always improve the final answer. We will inspect that distinction next.

The actual finite-weight affine/tanh/affine field is globally Lipschitz in its state: tanh has slope bounded by 1, and finite matrices multiply distances by finite factors. With continuous clock dependence this supports a unique solution over finite intervals. A generic locally Lipschitz field supplies local uniqueness; a solution can still blow up before the requested endpoint unless a growth or boundedness condition prevents it.

## 2. The solver is part of the computation

The scalar example showed why the rate changes during a step. **What if the direction turns too?** We now switch to a point moving around a circle, because its known trajectory exposes both angle error and radius error.

[Flow ODE — rotation-field]

At the point \((x,y)\), the rule returns \((-y,x)\): rotate the position a quarter-turn to get its velocity. The arrow at \((1,0)\) points upward. The arrow at \((0,1)\) points left. Arrowheads show direction, and the drawing states the rate-to-length scale. These are local rates, while the separate connected path shows accumulated motion.

\[
\begin{bmatrix}x'\\y'\end{bmatrix}
=\begin{bmatrix}0&-1\\1&0\end{bmatrix}
\begin{bmatrix}x\\y\end{bmatrix}.
\]

Starting at \((1,0)\), the exact state is \((\cos t,\sin t)\). The radius stays one because \((x^2+y^2)'=2x(-y)+2yx=0\). We have not trained this field; its exact solution is a numerical reference for the solver.

### Euler follows the first arrow throughout the interval

**What does one finite move miss?** The tangent move and the true turn leave the same starting point but end at different positions.

[Flow ODE — rotation-euler]

Euler uses the rate at the start. For this field, \(x_{k+1}=x_k-hy_k\) and \(y_{k+1}=y_k+hx_k\). Squaring and adding cancels the two cross terms:

\[
x_{k+1}^2+y_{k+1}^2=(1+h^2)(x_k^2+y_k^2).
\]

Thus Euler expands the squared radius at every nonzero step, although the exact circle does not. To time 1, four steps give approximately \((0.628906,0.937500)\), endpoint error 0.130661 and radius 1.128906. Sixteen steps reduce the endpoint error to approximately 0.031708. This is a property of these finite updates, not evidence that the field has learned an outward force.

### Classical RK4 probes the turn before accepting one move

**Can the solver sample directions inside the interval?** Follow the four hollow tentative points and the final filled accepted point. The four probes are calculations used to make **one** step.

[Flow ODE — rk-stages]

At the start \(z_k\), evaluate \(k_1\). Use half of the step along that rate to propose a second point, then evaluate \(k_2\) there. A third point also starts from \(z_k\), but uses the second rate. A fourth uses a full step along the third rate. Only after all four evaluations does the weighted sum update the accepted state. Reusing the same field at each probe reuses every learned weight.

\[
k_1=f(t_k,z_k),\qquad
k_2=f(t_k+h/2,z_k+hk_1/2),
\]
\[
k_3=f(t_k+h/2,z_k+hk_2/2),\qquad
k_4=f(t_k+h,z_k+hk_3),
\]
\[
z_{k+1}=z_k+\frac h6(k_1+2k_2+2k_3+k_4).
\]

For the first rotation step with \(h=0.25\), the rates are \((0,1)\), \((-0.125,1)\), \((-0.125,0.984375)\), and \((-0.246094,0.968750)\). The accepted endpoint is approximately \((0.968913,0.247396)\). The third probe is not reached by moving forward from the second; both are formed from the step's original state. This is why joining the probe locations as if they were the accepted trajectory would be misleading.

Four classical RK4 steps to time 1 give endpoint error about \(3.25\times10^{-5}\), with sixteen field evaluations. Four Euler steps use four evaluations. Compare both resolution and evaluation work, not only the count called “steps.” A field evaluation can itself be a costly network forward pass.

**Deeper: a tableau records the same arithmetic.** A lower-triangular coefficient array specifies which earlier rates form each probe. For classical RK4 the probe clocks are \((0,1/2,1/2,1)h\), the nonzero internal coefficients are \(a_{21}=1/2,a_{32}=1/2,a_{43}=1\), and the final weights are \((1,2,2,1)/6\). This storage description will let us reverse the actual stage graph in section 4. Fourth-order convergence needs the relevant smoothness; equal order does not make different tableaus the same computation.

**Change the case.** The following linked investigations start from \((0.6,0.8)\) and solve to 1.2, rather than copying the worked \((1,0),T=1\) result. The radius is still initially one, but the starting direction and endpoint change. Every local question below edits the same complete fixture.

**Which part of the rule changes the local arrows?** Inspect one matrix coefficient while the whole trajectory recomputes.

[Flow ODE — fixed-matrix]

Choose a matrix entry and move its value. The changed local arrows, exact matrix-exponential path and finite path update together. A general matrix may stretch or contract; radius conservation belongs to the rotation rule above, not every field.

**What changes if the same rule starts elsewhere?** Keep the field fixed and move one supplied coordinate.

[Flow ODE — fixed-initial]

Choose a starting coordinate and change its value. The cyan point is a supplied state; the learned or constructed field coefficients have not changed.

**How much of the discrepancy comes from finite resolution?** Change the endpoint or interval count against the exact reference.

[Flow ODE — fixed-resolution]

Change depth or the number of intervals. Compare the exact endpoint with the accepted numerical endpoint, and read the reported endpoint difference when the two paths look almost identical.

**What does each method spend to obtain its endpoint?** Compare the two already taught methods and their field-evaluation counts.

[Flow ODE — fixed-work]

After both methods have been taught, select the method and accepted-interval budget. The live sentence reports its rate-evaluation cost: Euler spends one call per interval, classical RK4 spends four. This is an evaluation-count comparison, not a measured wall-clock ranking.

**Which point is a probe, and which is an accepted state?** Select the actual interval and rate evaluation separately.

[Flow ODE — fixed-stage]

Inspect one accepted step and one of its tentative probes. The probe's clock, complete state and derivative are shown separately from the accepted endpoint; later controls never reinterpret a probe as a new accepted state.

### Implement the move before importing a solver

The complete [neural_ode_study.py](neural_ode_study.py) implements this arithmetic in `integrate`, using tensor operations so PyTorch can retain a differentiation graph. Its `trace` includes the initial state followed by accepted states. Its four RK variables are rates, and each tentative input carries the correct clock. The full program appears with the fitted study in section 6.

The new [ode_sensitivities.py](ode_sensitivities.py) makes the same stage graph explicit as a reusable `fixed_solve(field, initial, parameters, start, stop, intervals, method)` for small float64 investigations. It retains actual stage clocks, validates shape/finite inputs before returning a completed result, accepts decreasing intervals, and treats a zero-length interval as an unchanged state. It is a bounded fixed-step reference, not an adaptive production replacement. Section 4 explains every derivative route it adds.

## 3. Adapt the steps to estimated error

The fixed-step comparison asked how careful each move should be. **Can a solver notice that one proposed move is too large before accepting it?** It can compare two estimates made from the same starting state.

[Flow ODE — adaptive-estimate]

Start with a state and one proposed interval. Euler uses the initial rate to propose a new state. Heun evaluates another rate at that Euler proposal, averages the two rates, and makes its own proposal from the original starting state. Their difference is a computable indicator of how much the local rate turned. Neither candidate has been accepted yet.

\[
e=z_n+h f(t_n,z_n),\qquad
w=z_n+\frac h2\{f(t_n,z_n)+f(t_n+h,e)\}.
\]

Here \(e\) names the Euler candidate and \(w\) the Heun candidate. The estimator uses \(w-e\); it is not the unavailable difference between \(w\) and the exact solution. For smooth fields, Heun's local defect is of higher order than Euler's, so this embedded difference captures the lower-order candidate's leading error. Its size scales like \(h^2\) in the small-step regime. It is still an estimate, with possible cancellation or unrepresentative behavior outside that regime.

**How large is large when coordinates have different sizes?** Divide each candidate difference by a scale expressed in the same units as that state coordinate, then combine the dimensionless errors.

[Flow ODE — adaptive-scale]

The absolute allowance, `atol`, supplies a floor near zero. The relative allowance, `rtol`, grows with the maximum magnitude of the old state and the Heun proposal. For coordinate \(i\),

\[
s_i=\mathrm{atol}+\mathrm{rtol}\max(|z_{n,i}|,|w_i|),\qquad
r=\sqrt{\frac1d\sum_{i=1}^d\left(\frac{w_i-e_i}{s_i}\right)^2}.
\]

The dimension \(d\) is the number of state coordinates. A ratio \(r\le1\) accepts the Heun candidate; a larger ratio rejects the move. Averaging squared ratios is an **RMS norm**. One large coordinate error can be diluted among many easy coordinates. A maximum norm makes a different decision. This is an error-control design choice, not proof that every final coordinate error lies below its scale.

**What remains after a rejected move?** Follow the return arrow: the clock and accepted state remain unchanged, while the proposed next interval becomes smaller.

[Flow ODE — adaptive-attempts]

Each attempt spends two field evaluations here. Acceptance advances the clock and keeps the Heun state. Rejection preserves both original state and clock. This simple controller proposes a next step using

\[
h_{\mathrm{next}}=h\,\operatorname{clip}(0.9r^{-1/2},0.1,5).
\]

The factor 0.9 leaves a safety margin. The exponent \(-1/2\) responds to the estimator's \(h^2\) scaling. The bounds prevent a hundred-fold size jump from one estimate; at \(r=0\) the implementation chooses the upper factor 5 without dividing by zero. The final attempted interval is shortened to stop at the endpoint. Underflow or an exhausted attempt budget returns an explicit unfinished-computation error, not a fabricated successful endpoint.

For the constructed two-rate field \((z_1',z_2')=(-z_1,-100z_2)\), initial \((1,1)\), endpoint 0.4 and proposed first interval 0.1, the retained calculation uses `atol=0.01×rtol`. At `rtol=0.01` it records 58 accepted and 4 rejected attempts, 124 field evaluations. Tightening to 0.001 records 144 accepted and 5 rejected, 298 evaluations. Those are the measured results of this particular controller and field; a more accurate endpoint is not necessarily a more accurate fitted classifier.

**Change the case.** The shared live case below starts instead from \((1,0.3)\) with rates \((-2,-50)\). This prevents the earlier attempt counts from being mistaken for a universal answer. Independent absolute and relative controls expose the scale formula just taught.

**Which rate makes this case difficult to integrate?** Change one coordinate’s decay while both coordinates remain in the error test.

[Flow ODE — adaptive-rates]

Edit one rate coefficient. Every later view uses this same field and starting vector.

**Does the starting magnitude change the controller’s work?** Change one supplied coordinate while keeping its decay rule.

[Flow ODE — adaptive-initial]

Edit one supplied starting coordinate. A zero coordinate with a homogeneous diagonal rule stays zero; the controller still checks the other coordinate.

**What changes when the absolute and relative allowances change independently?** The two controls act on the scale formula just drawn.

[Flow ODE — adaptive-tolerances]

Move relative and absolute allowance separately. The attempt count, scale, selected normalized error and endpoint error respond live. A locally accepted estimate is not a global accuracy guarantee.

**Why was a particular attempted move accepted or rejected?** Select its complete candidate arithmetic and nearby history.

[Flow ODE — adaptive-inspect]

Select an attempt and endpoint. Every rejected attempt is retained and inspectable: the visible ledger shows a window around the selected attempt, and the selector reaches the whole history. The plotted path contains only accepted states; the separate candidate values show the proposed Euler and Heun states, their scales and normalized errors. Requested output times, accepted endpoint times and internal probe times are different things. An adaptive library can return values interpolated at requested times without stepping exactly at each one.

### Stiffness can hide beside a smooth trajectory

Rejections can arise from scaling or rapid variation. **Why might a smooth-looking target still force very short explicit steps?** Inspect a tiny perturbation that the rule damps much faster than the visible motion.

[Flow ODE — stiffness]

For \(z'=-\kappa z\), a perturbation shrinks by \(e^{-\kappa h}\) exactly. Euler instead multiplies it by \(1-\kappa h\). This finite move amplifies perturbations when \(|1-\kappa h|>1\). For positive \(\kappa\), its real-negative stability interval is \(0\le\kappa h\le2\); the boundary may fail to damp and is not a prudent universal setting. When \(\kappa=0\), this decay restriction disappears. Non-normal matrices can also transiently amplify errors despite apparently reassuring eigenvalues.

Backward Euler uses the rate at the **new** state: \(z_{n+1}=z_n-h\kappa z_{n+1}\). Solving that equation gives \(z_{n+1}=z_n/(1+\kappa h)\), a decaying multiplier for every positive step in this scalar problem. General implicit methods must solve algebraic systems; their stability benefit has an additional computational cost.

The retained smoother example is \(z'=-\kappa(z-\cos t)-\sin t\), initially1. Its exact solution is \(\cos t\) for any \(\kappa\). A perturbation around that smooth curve decays at rate \(\kappa\), potentially constraining an explicit solver much more than the visible curve's variation. With the saved SciPy settings, the recorded calls are:

| κ | RK45 field calls | Radau field calls | Radau linear factorizations |
| --- | --- | --- | --- |
| 5 | 92 | 99 | 8 |
| 1000 | 2162 | 84 | 16 |

Both completed the declared problem. A field call is not a unit of equal total cost across methods: implicit Radau also forms/solves algebraic systems. These counts are not wall-clock speed ratios. The [official SciPy solver contract](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html) lists its explicit RK23/RK45/DOP853 and implicit Radau/BDF choices; its method names do not include the fixed classical RK4 implemented here.

High work warrants diagnosis, not a label attached automatically. Tight tolerances, poorly scaled coordinates, nonsmooth fields and fast transients can increase calls. Smooth activations, coordinate scaling, a suitable implicit solver or a different model are alternatives depending on which cause actually appears.

## 4. Learn through a trajectory

The solver has now produced a state. **How does a final loss tell the learned rule what to change?** Backpropagation can reverse the finite operations we executed, or we can derive sensitivities of the continuous equation first. We will name the target before comparing their answers.

### Differentiate the numerical program

[Flow ODE — discrete-reverse]

First inspect one Euler step of the earlier scalar rule, now treating its coefficient as a trainable parameter \(\theta=-0.7\). With starting state 1.2 and interval 0.325, it reaches 0.927. For a loss after this one move, target 0.4 gives a terminal state gradient 0.527. The identity wire sends 0.527 backward directly. The field wire multiplies it by \(h\theta=-0.2275\), contributing −0.1198925. Adding the two routes gives the starting-state gradient 0.4071075. The parameter route multiplies by \(hz_0=0.39\), giving 0.20553. These are gradients for the **one-step** loss, before the four-step loss below.

For fixed Euler steps, write \(F_k=z_k+h f_\theta(t_k,z_k)\). Ordinary backpropagation applies the chain rule through each \(F_k\). With a final-state loss \(L(z_N)\), let \(a_k\) be the column vector \(\partial L/\partial z_k\). Then

\[
a_k=(I+hJ_zf_k)^\top a_{k+1},
\qquad
\nabla_\theta L=\sum_k h(J_\theta f_k)^\top a_{k+1}.
\]

Here \(J_z f\) is the matrix of field derivatives with respect to the state, and \(J_\theta f\) collects derivatives with respect to weights. Their transposes carry a loss sensitivity backward from outputs to inputs. If the readout or initial state depends on parameters, add those paths too.

RK4 has more intermediate operations, but automatic differentiation handles the same principle. It computes a gradient of the **implemented finite computation**, subject to floating-point effects and any nondifferentiable branches. This is often called **discretize then optimize**. Keeping every stage's graph consumes memory; checkpointing stores selected states and recomputes parts of the forward calculation during backward propagation.

### Derive a continuous adjoint

[Flow ODE — continuous-reverse]

The next drawing has three coupled quantities on an actual backward clock: state, state-loss sensitivity and accumulated parameter gradient. The loss supplies the terminal sensitivity; the parameter accumulator starts at zero. Orange dashed derivative wires show transpose products, not additional forward learned layers.

Alternatively, derive sensitivity equations for the continuous model first. For a terminal loss with no direct parameter dependence and parameter-independent \(z_0\),

\[
\frac{da}{dt}=-J_z f_\theta(t,z(t))^\top a(t),
\qquad a(T)=\nabla_{z(T)}L,
\]

\[
\nabla_\theta L=\int_0^T
J_\theta f_\theta(t,z(t))^\top a(t)\,dt.
\]

The adjoint says how much the final loss cares about a small change in the state at each time. A backward solve can accumulate this integral without retaining the entire forward computation graph.

**Keep the integration direction explicit.** A parameter accumulator \(g\) initialized at \(g(T)=0\) and integrated from \(T\) down to zero uses \(g'=-J_\theta f^\top a\). The negative right side combined with backward limits yields the positive forward-time integral above.

[Flow ODE — observation-adjoint]

For losses at several observation times, the adjoint receives a jump from each observation's loss gradient. A running integral cost also contributes a term between observations. These extensions matter in time-series training; the terminal-only formula is not the full recipe for every objective.

### Deeper: why the adjoint equation cancels state sensitivity

Let \(S(t)=\partial z(t)/\partial\theta\). Differentiating the state equation gives \(S'=J_zf\,S+J_\theta f\), with \(S(0)=0\) under our assumptions. The product rule gives

\[
\frac{d}{dt}(a^\top S)=a'^\top S+a^\top S'
=-a^\top J_zf S+a^\top(J_zf S+J_\theta f)
=a^\top J_\theta f.
\]

Integrate from zero to \(T\). The left endpoint vanishes; the final term is \(\nabla_{z(T)}L^\top S(T)\), precisely the chain rule for the parameter gradient. This also explains the adjoint's negative sign. Forward sensitivities store a state-by-parameter matrix; the adjoint is attractive when there are many parameters and a scalar objective.

### The two gradients need not be equal at finite resolution

[Flow ODE — gradient-comparison]

We now extend the calculation to a loss after four steps, rather than the one-step loss above. Use \(z'=\theta z\), \(z(0)=1.2\), \(T=1.3\), target 0.4, and loss \(\frac12(z(T)-0.4)^2\), evaluated at \(\theta=-0.7\).

The exact state is \(1.2e^{1.3\theta}\). Differentiating it gives

\[
\frac{dL}{d\theta}=(z(T)-0.4)\,1.3z(T)=0.05213709.
\]

Four Euler steps instead produce \(z_4=1.2(1+0.325\theta)^4=0.42734163\). Their autograd gradient is 0.01966276. Central differences of that same four-step loss agree with autograd. They do not agree with the continuous answer because they differentiate a different forward function.

Four classical RK4 steps give 0.05213852, much closer here. A backward RK4 solve of the continuous adjoint initialized at the numerical forward endpoint gives 0.05214299. It introduces its own approximation; it is not exactly the RK4 program's reverse-mode derivative.

This is why “the gradient passed a check” needs a named reference. [Onken and Ruthotto](https://arxiv.org/html/2005.13420v2) study the distinction and solver changes in continuous models. Our scalar example is independently calculated rather than reproduced from their experiments.

**Change the case.** The shared gradient investigation starts from \(\theta=0.3,z_0=0.8\), target1 and endpoint0.7, with three steps. This is a fresh finite computation, so the earlier gradient values do not apply.

**How does a changed field weight affect the loss gradient?** Follow the finite state and all labelled derivative references together.

[Flow ODE — gradient-field]

Change the rate and initial state. The finite loss, finite derivative and exact continuous comparison all use that same edited case.

**Can the gradient change even when the forward rule does not?** Change the target or the amount of depth before the loss.

[Flow ODE — gradient-loss]

Change the target or endpoint. A change in target affects the loss derivative, even when the field and forward trajectory are unchanged.

**Which derivative belongs to the method we actually execute?** Compare the finite program and continuous references at a chosen resolution.

[Flow ODE — gradient-resolution]

Select the taught finite method and interval count. Its finite derivative and finite-difference check refer to the same computation. The separately labelled continuous backsolve starts from that finite endpoint and residual, so it includes forward approximation as well as its backward integration error. The exact continuous gradient is a separate reference.

### Why saving no forward trajectory can be fragile

[Flow ODE — reverse-conditioning]

The decay \(z'=-20z\), \(z(0)=1\), reaches \(e^{-20}\approx2.0612\times10^{-9}\) at time one. Reverse the exact equation from an endpoint perturbed by \(10^{-8}\). The recovered initial value is approximately 5.85165 instead of one: reverse evolution multiplies the perturbation by \(e^{20}\).

The forward process is stable but its inverse reconstruction is ill-conditioned. A more accurate solver helps numerical error; it cannot remove this mathematical amplification of an already present endpoint error. Checkpoints can reduce the length over which state must be reconstructed.

“Constant memory” for a backsolve usually concerns dependence on the number of internal forward steps. Parameters, parameter gradients, requested output states, batches and local network activations still occupy memory. Current [Diffrax adjoint documentation](https://docs.kidger.site/diffrax/api/adjoints/) describes checkpointed differentiation of the numerical solution and distinguishes it from approximate continuous backsolves. The correct choice depends on the objective, solver, accuracy needs and available memory.

### Deeper: reverse a rule that depends on the actual clock

The decay examples were autonomous: their rate had no direct clock input. **What breaks if we restart the backward clock at zero for a time-dependent field?** The following example evaluates \(f(t,z)=\theta z+t\) at its actual stage times, including when solving backward.

[Flow ODE — nonautonomous-sensitivity]

The initial clock is 0.2 and the final clock 1.3. With \(z_0=1.2,\theta=-0.7\), the exact state is approximately 1.184577394. The term \(+t\) changes the field at every probe; using a zero-based negative clock on the reverse solve would describe a different function. With \(\theta=0\), the exact move from clock a to clock b is \(z_b=z_a+(b^2-a^2)/2\), valid in either direction.

The complete program below stores the actual Euler/classical RK4 graph. `tangent` seeds an identity matrix for initial-state sensitivity and zero columns for field-parameter sensitivity. Each probe transports those columns with the state Jacobian and adds its parameter Jacobian. `discrete_reverse` starts from the terminal loss gradient, follows the same graph backward, keeps the identity route, and accumulates every use of a shared parameter. For RK4, each stage's sensitivity also returns through the earlier slopes that formed its tentative state; multiplying only accepted endpoints would miss those paths.

`continuous_reverse` instead solves the continuous state/adjoint/parameter equations from the actual final clock down to the actual initial clock. The demonstrated comparison initializes it with the exact endpoint and exact terminal-loss gradient, isolating its own integration error. Initializing it from a numerical forward endpoint would add that endpoint error too, as in the earlier scalar comparison.

[Flow ODE — program-sensitivities]

`fixed_solve` validates finite one-dimensional states/parameters, positive whole interval count, supported method, field shapes and a representable step. It returns an unchanged state for equal clocks. The small-rate analytic reference uses a convergent exponential-moment series, including \(\theta=0\), to avoid dividing cancellation errors by \(\theta^2\) or \(\theta^3\). The default two-coordinate example has one rate per coordinate; the generic tangent/reverse also accepts coupled state Jacobians and any finite parameter-vector width. It does not compute derivatives of start/stop clocks or adaptive branch decisions.

With sixteen classical RK4 intervals, the first coordinate's finite parameter gradient is approximately 0.657501713, versus exact 0.657501836 for target 0.4. Its continuous reverse with 128 intervals gives approximately 0.657501835. The close answers belong to this checked fixture; the objective labels remain necessary even when the numbers look equal. Run the file directly to print those values without changing weights, examples or evidence files. Compare a modified coupled field against finite differences of its own loss before trusting a changed Jacobian.

### Control an actual solver API with the same field

The scratch implementation is `integrate` in [neural_ode_study.py](neural_ode_study.py): it builds Euler and classical RK4 updates from tensor operations, keeping the computation graph for direct differentiation. `VectorField` and `DepthClassifier` later turn that mechanism into a learned classifier. Here we isolate the solver/library bridge on z′=a z, where both the trajectory and its derivatives are known. This avoids mistaking a similar classification score for a correct solver interface.

Keep [solver_library_bridge.py](solver_library_bridge.py) beside that program. With the earlier PyTorch environment, install `torchdiffeq==0.2.5`, then run `python solver_library_bridge.py`. The downloadable bridge was executed with torchdiffeq 0.2.5 and PyTorch 2.14.0 on CPU float64. The fixed-step Euler endpoint and both initial-state and rate gradients match the scratch program; adaptive direct and continuous-adjoint results pass the stated analytic tolerances. The saved classifier outcomes retain their declared fit, validation and assessment roles.

[Flow ODE — solver-api-clocks]

`odeint(field, initial, times)` returns a tensor with requested time as its first axis. Those times request output values; an adaptive solver may take many internal steps between them. `method='euler', options={'step_size': 1/8}` gives the same eight Euler steps as our scratch route. We compare both final states and both kinds of derivative: with respect to the initial state and the field parameter. In contrast, the package's `rk4` uses the 3/8 tableau, while our scratch program uses classical RK4. Their order alone does not justify step-by-step equality. The solver choices and adjoint interface are documented in [the author's repository](https://github.com/rtqichen/torchdiffeq).

For endpoint time one and loss L=½Σz(1)², exact calculus gives z(1)=exp(a)z₀, ∂L/∂z₀=exp(2a)z₀, and ∂L/∂a=exp(2a)Σz₀². The Euler solution instead uses factor (1+a/8)⁸. The adaptive direct and adjoint solves target the continuous answer within stated tolerances; we do **not** require them to equal the eight-step Euler answer. `odeint_adjoint` receives an `nn.Module` so its trainable field parameter can be found, and we set forward and backward tolerances explicitly.

```python
"""A matched Euler program, adaptive solve, and continuous-adjoint comparison.

Authoring targets: torch 2.14.0, torchdiffeq 0.2.5. CPU float64.
Run beside neural_ode_study.py; no fitting or dataset download occurs.
"""
import torch
from torch import nn
from torchdiffeq import odeint, odeint_adjoint
from neural_ode_study import integrate


class Decay(nn.Module):
    def __init__(self, rate=-.7):
        super().__init__()
        self.rate = nn.Parameter(torch.tensor(rate, dtype=torch.float64))

    def forward(self, time, state):
        return self.rate * state


def value_and_derivatives(route):
    field = Decay()
    initial = torch.tensor([[1.5], [-.5]], dtype=torch.float64, requires_grad=True)
    times = torch.tensor([0., 1.], dtype=torch.float64)
    if route == "scratch_euler":
        result = integrate(field, initial, steps=8, method="euler")[-1]
    elif route == "library_euler":
        result = odeint(field, initial, times, method="euler",
                        options={"step_size": 1/8})[-1]
    elif route == "adaptive":
        result = odeint(field, initial, times, method="dopri5", rtol=1e-9, atol=1e-11)[-1]
    elif route == "adjoint":
        result = odeint_adjoint(field, initial, times, method="dopri5",
                                rtol=1e-9, atol=1e-11, adjoint_method="dopri5",
                                adjoint_rtol=1e-9, adjoint_atol=1e-11)[-1]
    else:
        raise ValueError(route)
    loss = result.square().sum()/2
    initial_gradient, rate_gradient = torch.autograd.grad(loss, (initial, field.rate))
    return result.detach(), initial_gradient.detach(), rate_gradient.detach()


def main():
    scratch, library = [value_and_derivatives(route)
                        for route in ("scratch_euler", "library_euler")]
    for left, right in zip(scratch, library):
        torch.testing.assert_close(left, right, rtol=1e-12, atol=1e-12)
    initial = torch.tensor([[1.5], [-.5]], dtype=torch.float64)
    factor = torch.exp(torch.tensor(-.7, dtype=torch.float64))
    exact = (initial*factor, initial*factor.square(), initial.square().sum()*factor.square())
    for route in ("adaptive", "adjoint"):
        actual = value_and_derivatives(route)
        for value, reference in zip(actual, exact):
            torch.testing.assert_close(value, reference, rtol=2e-7, atol=2e-9)
        print(route, "endpoint/initial-gradient/rate-gradient:", *actual)
    print("Euler endpoint, initial gradient, rate gradient:", *library)


if __name__ == "__main__":
    main()
```

The continuous adjoint changes how derivatives are computed; it does not erase reconstruction error, intermediate saved output states, parameter gradients or library overhead. Direct differentiation through K accepted numerical steps generally retains work proportional to K, while a continuous backsolve trades recomputation and its own numerical sensitivity for less retained internal-step history. Smoothness, solver stability and state dimension still matter. The current example has no events, stochastic layers or discontinuous observation jumps; inserting those changes the problem.

**Take control.** Change a to −4 and compare Euler at 1, 4, 8 and 32 steps with the same adaptive solve. Keep the parameter fixed: do not retrain it to compensate for a changed solver. Then tighten only the adjoint tolerances and inspect which derivative discrepancy changes.

<details><summary>Hint and reasoned solution</summary>

One Euler step multiplies the state by −3, which reverses sign and magnifies it even though the continuous system decays. Four steps multiply by zero at every step, incorrectly erasing the state. Eight give factor (½)⁸; as steps increase, (1−4/K)^K approaches exp(−4). For a finite K, direct differentiation correctly differentiates that discrete factor, not exp(a). Tightening backward tolerance can improve the continuous-adjoint approximation but cannot repair an intentionally inaccurate forward Euler trajectory. Report endpoint, initial-state gradient and parameter gradient separately; a small final loss alone misses this distinction.

</details>

## 5. What can a continuous flow rearrange?

The solver can now move a representation and differentiate the loss. Can that representation implement every decision boundary we might ask for? First keep the state one-dimensional, so we can see exactly what prevents a rearrangement.

[Flow ODE — ordering]

The three cyan points start at −1, 0 and 1. They all follow the **same field**, over the **same clock interval**. Each track records position against time. A vertical slice through the drawing is one shared time: the middle point stays between the two outer points. The amber readout threshold labels points on one side class one and points on the other side class zero. It cannot label both outer points one and the middle point zero.

Why can the tracks not meet and then exchange places? Suppose the field is continuous in time, locally Lipschitz in state, and its solutions exist uniquely throughout this interval. Locally Lipschitz means that, in a neighborhood, changing state a little changes the field by at most a fixed multiple of that change. These assumptions give a unique local trajectory from a specified state and clock. If two tracks met at the same state and same time, solving backward from that meeting would give a single past, contradicting their distinct starts. Changing their order would require such a meeting.

For a one-dimensional state, this gives

\[
z_A(0)<z_B(0)\quad\Longrightarrow\quad z_A(T)<z_B(T),
\]

provided both solutions exist uniquely throughout the common interval. The resulting state map is invertible on its image. A readout need not be invertible: it may discard coordinates or assign many states the same label. The impossibility here therefore concerns **a one-dimensional unique flow followed by one linear threshold**. A nonlinear readout changes that question. Lines may cross in a projection of a higher-dimensional state, or revisit a position at different clocks, without two full states meeting at the same time.

### Give the representation a second direction

What if we preserve each input position and add a place to record its distance from the center?

[Flow ODE — lift]

The drawing appends a zero coordinate to each input: (−1, 0), (0, 0), (1, 0). The horizontal derivative is zero, so each horizontal position remains unchanged. The vertical derivative is the square of that horizontal position. The outer points rise at rate one; the middle point has rate zero and stays still. At depth one, the outer points are at height one, above the amber threshold 0.5; the middle stays at height zero. The second coordinate has made a linear readout sufficient.

Writing the vertical coordinate as a, the entire constructed field and solution are

\[
x'=0,\qquad a'=x^2,\qquad (x(0),a(0))=(x_0,0),
\qquad (x(T),a(T))=(x_0,Tx_0^2).
\]

This is **state augmentation**: add coordinates before integrating, and allow the field to use them. No full trajectories meet in this example. We have constructed a solution, rather than trained one. The [Augmented Neural ODEs paper](https://arxiv.org/html/1904.01681v1) studies broader representational and computational consequences; its continuous-region topology arguments require the stated domain and continuity assumptions. They do not say every finite sampled dataset is impossible for an unaugmented flow. Gaps between sampled points can leave routes that would not exist for an entire connected region.

Now explicitly change the starting inputs to −2, 0 and 1. Their squared values are 4, 0 and 1. At T = 0.4 the heights are 1.6, 0 and 0.4: only the left point exceeds 0.5. At T = 0.7 the heights are 2.8, 0 and 0.7: both outer points exceed it. The flow can be sound while a particular depth/readout is insufficient.

**Where does a different starting point go in the lifted space?** Move one point and follow the same constructed rule.

[Flow ODE — lift-points]

**Is changing the decision boundary the same as changing motion?** Inspect depth and readout threshold as separate operations.

[Flow ODE — lift-readout]

The first controls edit a chosen starting point. The next controls change depth and the readout threshold. They share the same three points; the live labels are computed from the displayed final heights. The threshold changes decisions without changing a trajectory.

### A numerical map can violate an exact-flow property

Does every solver preserve that order? Return to our scalar decay field with coefficient −2, and deliberately take a very coarse interval h = 1.

[Flow ODE — order-numerical]

Euler sends each starting value to z + (−2z) = −z: the points exchange order. The exact solution sends it to exp(−2)z, multiplying by a positive number and preserving order. Neither calculation changes the field. Euler has created a different finite map; a network trained through that map can exploit behavior absent from the exact continuous flow. Refinement checks from **The solver is part of the computation** distinguish those two interpretations.

### Deeper: where can the learned parameters live?

The tiny field in **A derivative tells you how to move** concatenated the clock to its state. That is one parameterization, not the definition of a Neural ODE.

[Flow ODE — parameterizations]

Read the four small routes separately. A clock input lets the same weight matrix produce different rates at the same state at different times. A piecewise route selects one field before a declared boundary and another afterward; both state segments must be joined, and the solver should respect the discontinuity. A basis route uses clock-dependent coefficients to combine a fixed set of fields. A hypernetwork route uses the clock to generate another network's weights. For example, f(t,z) = (1−t)f₀(z) + t f₁(z) blends two rates; it is not the same as integrating f₀ and f₁ separately and blending their endpoints.

A second-order system supplies a different kind of augmentation. Position q alone does not tell us how an object is moving; adding velocity v makes q' = v and v' = gθ(t,q,v) a first-order equation on the joint state (q,v). Its two channels represent position and velocity, rather than arbitrary added memory. Units and initial velocity must be specified. Extra coordinates, time dependence and richer readouts solve different restrictions; choose the one that matches the missing information.

These designs are discussed in [Kidger's treatment of neural differential equations](https://arxiv.org/html/2202.02435), especially the parameterization and augmentation sections. They still require a well-defined field, a suitable numerical method and evaluation on the actual task. More representational room does not guarantee easier optimization or better generalization.

## 6. Train a small continuous-depth classifier on real measurements

The lift example constructed a field that solved a chosen labeling problem. Does a learned shared field contribute anything on measured data? We now switch explicitly to flowers: their four measured lengths and widths form the supplied input; their recorded species is the target.

Our data are the 150 Iris measurements distributed by UCI: sepal length, sepal width, petal length and petal width, all in centimeters, with three species labels. The [dataset](https://archive.ics.uci.edu/dataset/53/iris) is credited to R. A. Fisher and licensed CC BY 4.0. The retained [CSV](iris.csv) uses the corrected values documented in its [provenance](data-provenance.md).

This is a feature-transformation experiment. Each flower supplies an initial four-dimensional state after standardization. Solver time describes representation depth, not elapsed botanical time.

### Keep the comparison interpretable

Identical four-feature rows are grouped before assigning data roles; source rows 102 and 143 are duplicates. We keep all original rows in the download but score each unique vector once. A fixed stratified split assigns 90 unique examples to fitting, 30 to validation and 29 to assessment. The fitting examples alone determine the feature means and population standard deviations. Fitting changes the parameters; validation chooses a saved checkpoint without fitting on those records; assessment measures the selected model afterward. Dividing each measurement's difference from its fitting mean by its fitting standard deviation puts these inputs on comparable scales. The [Batch/Layer/Group/RMS Normalization lesson](/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals) explains that operation; no validation or assessment measurement contributes to these statistics.

We compare four models:

| Model | Computation before a linear three-class head | Trainable parameters |
| --- | --- | ---: |
| Linear | No learned feature transformation | 15 |
| Residual | Four distinct 16-unit tanh fields, each used for one step | 671 |
| Neural ODE | One shared 16-unit tanh field; four classical RK4 steps | 179 |
| Augmented ODE | Append two zeros; one six-dimensional field; four RK4 steps | 251 |

The two ODE models perform 16 field evaluations per example. Their parameter counts stay fixed if we change solver resolution. The residual model has separate weights at its four blocks. These models have different capacities; this is not a parameter-matched benchmark.

The complete [study program](neural_ode_study.py) runs three declared seeds—13, 37 and 61—for each model. Every run uses 300 full-batch AdamW updates, learning rate 0.01 and weight decay 0.001, in float64 on CPU. Validation loss is measured after update one and every 25 updates. We select the lowest-validation-loss checkpoint within each run, then evaluate that checkpoint on assessment data. All 12 runs and their curves remain in [the result file](study-results.json); [selected weights](fitted-models.json) are retained.

### What actually happened

[Flow ODE — study-histories]

| Model | Assessment cross-entropy, seeds 13 / 37 / 61 | Correct out of 29, same order |
| --- | --- | --- |
| Linear | 0.22045 / 0.20028 / 0.21245 | 28 / 28 / 28 |
| Residual | 0.16763 / 0.10539 / 0.05133 | 28 / 28 / 29 |
| Neural ODE | 0.15239 / 0.10335 / 0.06212 | 28 / 28 / 29 |
| Augmented ODE | 0.04204 / 0.10549 / 0.03648 | 29 / 28 / 29 |

The uniform three-class predictor has cross-entropy \(\log3\approx1.09861\). A fixed class-zero choice scores 10/29. The linear model is already strong: a small reduction in classification errors cannot explain every difference in cross-entropy. Probability assigned to the true class matters even when the winning label stays unchanged.

All nonlinear runs selected update 50, while the linear runs selected update 300. Later training loss improvement therefore did not automatically mean better validation performance. There was no post-assessment search for a more impressive configuration.



### Follow one actual flower through the learned field

How does one measurement vector become three class probabilities? Follow this fixed source through its saved seed-37 field before editing a different flower.

[Flow ODE — worked-study]

The cyan centimeter values first meet the fixed fitting means and scales. Their standardized vector enters the field; four classical RK4 intervals update every hidden coordinate. The final state reaches the three-row affine readout, which produces logits. Softmax subtracts the shared maximum, exponentiates and divides by the shared sum. The recorded species would enter the loss separately, after this forward route.

For validation source row 64, the seed-37 Neural ODE assigns probabilities approximately \((0.01744,0.93374,0.04882)\) in the order setosa, versicolor, virginica. Increasing its petal length by 0.6 cm while holding the other measurements fixed changes them to \((0.00730,0.67440,0.31830)\). The winning label stays versicolor, but the evidence shifts substantially toward virginica.

These are full forward passes through the saved learned model, not a hand-drawn boundary. The input edit is a hypothetical measurement intervention; it does not establish a biological causal effect.



Now switch explicitly to fresh validation row 70 for the shared live case. The first question chooses the saved architecture, declared seed and source. Changing architecture or seed keeps all raw edits; changing the source deliberately adopts that source's measurements. The saved models cover the four architectures and all three seeds from the table above.

[Flow ODE — study-model]

What changes when a single measurement changes, with the learned rule held fixed?

[Flow ODE — study-feature]

Edit any of the four raw centimeter values. The standardization and complete forward pass update; the probability table compares the edited input with that source's original measurements under the same weights and solver. A petal-length edit need not act monotonically or affect every seed the same way. These comparisons reveal sensitivity, not a newly verified flower label or biological causal effect.

Can a different numerical realization change the same saved model's probabilities?

[Flow ODE — study-solver]

Change method, interval count or final depth. The two ODE models reuse their saved field weights. The linear and fixed residual baselines retain their own discrete architectures; the interface states that these ODE controls do not change them. Holding weights and raw input fixed makes a refinement comparison interpretable.

Where does each hidden coordinate go during this execution?

[Flow ODE — study-trace]

Every one of the four or six coordinates has its own actual clock/state trace. Inspecting an accepted index reveals the complete vector, rather than a selected projection that could hide a crossing or an added coordinate.

What does the same path look like when we choose two coordinates?

[Flow ODE — study-projection]

Select horizontal and vertical coordinates independently. The labelled numerical axes show this projection's extents; the full coordinate traces above remain available. A crossing in this view does not establish that two full states coincide, as the uniqueness argument in **What can a continuous flow rearrange?** explained.

What is inside one of those field evaluations?

[Flow ODE — study-field]

The supplied stage vector includes the actual stage clock. The stored input weight matrix has 16 output rows and five inputs for the 4D model, or seven inputs for the 6D model. Select a hidden row: multiply all its inputs by the row's weights, add its bias, then apply tanh. The drawing retains all 16 hidden outputs. Each derivative row reads all 16 of them and adds its own bias. Its matrix has four or six output rows. These are ordinary stored output-by-input matrices; the mapping widths 5→16→4 do not mean the first stored matrix is 5×16.

Which tentative input generated those rates?

[Flow ODE — study-stage]

Choose an accepted interval and a rate-evaluation number. The full tentative state, clock and derivative change together; the field drawing above inspects this same evaluation. Classical RK4 uses four probes for one accepted endpoint. Euler uses one. The residual comparator instead selects its block-specific field at each of its four fixed steps.

Finally, which coordinates reach a particular class score?

[Flow ODE — study-readout]

All final coordinates enter every saved class row. The three biases are added before softmax. Selecting a class changes inspection only, while the shared state and all three probabilities remain visible. This completes the raw-input→field→numerical-update→readout path using actual learned coefficients.

For unchanged row 64, using 4, 16 and 64 RK4 steps gives versicolor probabilities 0.9337389, 0.9335432 and 0.9335421. Four Euler steps give 0.9442828. The weights are identical; the numerical realization changed. Agreement under refinement is useful evidence that the model is behaving like its continuous formulation locally. It does not prove accuracy everywhere or improve the training data automatically.

Independent NumPy inference reproduces the saved PyTorch models' logits and traces within \(8.9\times10^{-16}\) over the checked input/method/step cases. Input derivatives also agree with central differences. The downloadable calculations provide independent NumPy and finite-difference checks of those saved computations.

### Run the complete study

Keep [iris.csv](iris.csv) beside the [study program](neural_ode_study.py). With Python, NumPy and PyTorch installed, run the program from that directory:

~~~text
python neural_ode_study.py
~~~

It writes the complete results and selected weights. Install SciPy as well to run the separate [calculation program](ode_calculations.py), which imports the study's model definitions and reuses the saved weights. That second command does not train again. The [provenance](data-provenance.md) records the versions used here.

~~~python
"""Declared real Iris study: learned depth is not botanical time."""
from copy import deepcopy
from pathlib import Path
import csv
import hashlib
import json
import numpy as np
import torch
from torch import nn

DIRECTORY = Path(__file__).resolve().parent
torch.set_num_threads(1)
torch.set_default_dtype(torch.float64)


def load_data():
    with (DIRECTORY / "iris.csv").open(newline="") as handle:
        records = list(csv.DictReader(handle))
    columns = ["sepal_length_cm", "sepal_width_cm", "petal_length_cm", "petal_width_cm"]
    names = ["setosa", "versicolor", "virginica"]
    features = np.array([[float(row[key]) for key in columns] for row in records])
    labels = np.array([names.index(row["species"]) for row in records])
    groups = {}
    for index, row in enumerate(features):
        groups.setdefault(tuple(row), []).append(index)
    for members in groups.values():
        assert len(set(labels[members])) == 1
    kept = np.array(sorted(members[0] for members in groups.values()))
    roles = {key: [] for key in ("fit", "validation", "assessment")}
    generator = np.random.default_rng(926)
    for label in range(3):
        indices = generator.permutation(kept[labels[kept] == label])
        for key, subset in zip(roles, (indices[:30], indices[30:40], indices[40:])):
            roles[key].extend(subset.tolist())
    mean, scale = features[roles["fit"]].mean(0), features[roles["fit"]].std(0)
    metadata = dict(columns=columns, classes=names, mean=mean.tolist(), scale=scale.tolist(),
        roles={key: [index+1 for index in indices] for key, indices in roles.items()},
        duplicate_groups=[[i+1 for i in group] for group in groups.values() if len(group)>1],
        unique_count=len(kept))
    return torch.tensor((features-mean)/scale), torch.tensor(labels), roles, metadata


class VectorField(nn.Module):
    def __init__(self, dimension):
        super().__init__()
        self.input = nn.Linear(dimension+1, 16)
        self.output = nn.Linear(16, dimension)

    def forward(self, time, state):
        clock = torch.full_like(state[:, :1], float(time))
        return self.output(torch.tanh(self.input(torch.cat((state, clock), -1))))


def integrate(field, initial, steps=4, method="rk4", endpoint=1.):
    state = initial
    trace = [state]
    step_size = endpoint/steps
    for step in range(steps):
        time = step*step_size
        first = field(time, state)
        if method == "euler":
            state = state + step_size*first
        elif method == "rk4":
            second = field(time+step_size/2, state+step_size*first/2)
            third = field(time+step_size/2, state+step_size*second/2)
            fourth = field(time+step_size, state+step_size*third)
            state = state + step_size*(first+2*second+2*third+fourth)/6
        else:
            raise ValueError(method)
        trace.append(state)
    return torch.stack(trace)


class DepthClassifier(nn.Module):
    def __init__(self, kind):
        super().__init__()
        self.kind = kind
        self.dimension = 6 if kind == "augmented_ode" else 4
        if kind in ("neural_ode", "augmented_ode"):
            self.field = VectorField(self.dimension)
        if kind == "residual":
            self.blocks = nn.ModuleList([VectorField(4) for _ in range(4)])
        self.readout = nn.Linear(self.dimension, 3)

    def forward(self, inputs, steps=4, method="rk4", endpoint=1., return_trace=False):
        state = torch.cat((inputs, inputs.new_zeros((len(inputs), self.dimension-4))), -1)
        if self.kind in ("neural_ode", "augmented_ode"):
            trace = integrate(self.field, state, steps, method, endpoint)
            state = trace[-1]
        else:
            states = [state]
            if self.kind == "residual":
                for index, block in enumerate(self.blocks):
                    state = state + .25*block(index/4, state)
                    states.append(state)
            trace = torch.stack(states)
        logits = self.readout(state)
        return (logits, trace) if return_trace else logits


def evaluate(model, features, labels):
    with torch.no_grad():
        logits = model(features)
    return dict(cross_entropy=float(nn.functional.cross_entropy(logits, labels)),
                correct=int((logits.argmax(-1)==labels).sum()), count=len(labels))


def main():
    features, labels, roles, metadata = load_data()
    reports, snapshots = [], []
    for kind in ["linear", "residual", "neural_ode", "augmented_ode"]:
        for seed in [13, 37, 61]:
            torch.manual_seed(seed)
            model = DepthClassifier(kind)
            optimizer = torch.optim.AdamW(model.parameters(), lr=.01, weight_decay=.001)
            best_loss, selected, curves = float("inf"), None, []
            for step in range(1, 301):
                optimizer.zero_grad(set_to_none=True)
                loss = nn.functional.cross_entropy(model(features[roles["fit"]]), labels[roles["fit"]])
                loss.backward()
                optimizer.step()
                if step==1 or step%25==0:
                    fit = evaluate(model, features[roles["fit"]], labels[roles["fit"]])
                    validation = evaluate(model, features[roles["validation"]], labels[roles["validation"]])
                    curves.append(dict(step=step, fit=fit, validation=validation))
                    if validation["cross_entropy"] < best_loss:
                        best_loss = validation["cross_entropy"]
                        selected = deepcopy(model.state_dict())
                        selected_step = step
            model.load_state_dict(selected)
            report = dict(kind=kind, seed=seed, parameters=sum(p.numel() for p in model.parameters()),
                selected_step=selected_step, curves=curves,
                fit=evaluate(model,features[roles["fit"]],labels[roles["fit"]]),
                validation=evaluate(model,features[roles["validation"]],labels[roles["validation"]]),
                assessment=evaluate(model,features[roles["assessment"]],labels[roles["assessment"]]))
            reports.append(report)
            snapshots.append(dict(kind=kind,seed=seed,selected_step=selected_step,
                state={key:value.tolist() for key,value in selected.items()}))
            print(kind,seed,selected_step,report["assessment"],flush=True)
    result=dict(data=metadata, updates=300, learning_rate=.01,weight_decay=.001,
        seeds=[13,37,61], dtype="float64", torch=torch.__version__, numpy=np.__version__,
        dataset_sha256=hashlib.sha256((DIRECTORY/"iris.csv").read_bytes()).hexdigest(),runs=reports)
    (DIRECTORY/"study-results.json").write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    (DIRECTORY/"fitted-models.json").write_text(json.dumps(snapshots,allow_nan=False)+"\n")


if __name__ == "__main__":
    main()
~~~

Read the model definition and integrator first, then follow one fitting update. The remaining loop repeats that update under the declared selection protocol. The saved weights let you change inputs or solver resolution without rerunning the fits.


## 7. What happens between irregular observations?

The classifier evolved a state from one fixed flower measurement. A sensor stream presents a different problem: information arrives at unequal times. How do we move the state between measurements without pretending that an unobserved value was measured as zero?

[Flow ODE — observations]

The horizontal axis is clock time. A cyan marker means a measurement actually arrived. Between markers, the violet hidden state follows a decay curve. At a marker, a gray input wire feeds a weighted update and the hidden state jumps. The amber query line asks for the state at that time; it supplies no measurement and creates no jump. Measurements to its right have not become available to a causal query.

Use one scalar hidden state h, initially zero. Between measurements let h' = −0.5h. At a measurement xᵢ, retain 70% of the old hidden state and add 30% of the new value:

\[
h_i^- = h_{i-1}^+e^{-0.5(t_i-t_{i-1})},\qquad
h_i^+=0.7h_i^-+0.3x_i.
\]

The minus superscript means **just before** assimilation; plus means **just after**, not negative versus positive state. The time difference determines how much decay occurs. This is a constructed **ODE-RNN-shaped update**, with a simple weighted blend standing in for a learned recurrent update.

For times (0.2, 0.9, 1.3) and measurements (1, −0.5, 0.8), work through the displayed jumps:

1. At time 0.2, the zero state remains zero during propagation, then receives 0.3×1 = 0.3.
2. The gap to 0.9 is 0.7. Propagation gives 0.3 exp(−0.35) = 0.211406; assimilation gives 0.7×0.211406 + 0.3×(−0.5) = −0.002016.
3. The gap to 1.3 is 0.4. State decays to −0.001650, then the measurement raises it to 0.238845.
4. A query at 1.6 adds no observation. Further decay gives 0.238845 exp(−0.15) = 0.205576.

Omitting the middle observation produces 0.310853 at 1.6. Observing zero there produces 0.279568. A zero observation still performs the 0.7 retention; omission removes the assimilation operation entirely. Adding more output-query times only samples the same propagation curve.

Now explicitly switch to times (0.1, 0.7, 1.4) and values (1, −1, 0.5). Edit the event times and values, or add/remove an event. Change the propagation rate and query clock separately from the assimilation weight. Moving the query to one excludes the last event. An empty history leaves the zero initial state unchanged. Duplicate or out-of-order times need a declared ordering/aggregation policy, so this investigation retains the last valid ordered history and explains the rejected edit.

**What information arrived, and when?** Edit the ordered measurement history before changing its propagation rule.

[Flow ODE — observation-events]

**How much state survives until a query?** Change decay and query time while the measurement history stays fixed.

[Flow ODE — observation-propagation]

**How much should a newly available measurement change the state?** Compare mixing with omission of an update.

[Flow ODE — observation-assimilation]

### Infer an initial state instead of updating at every observation

Can observations tell us a distribution over the unknown state that began the process? This changes the modeling task again.

[Flow ODE — latent-inference]

Read the upper path first: the available time/value/mask triples enter an encoder, which returns a mean μ and a positive scale σ for a latent initial state. A supplied noise sample ε goes through μ + σε to produce z₀. The ODE evolves that sample, and a decoder maps its later states to distributions for the measurements. The lower paths train this system: observation likelihood rewards explaining the measured values, while a prior penalty discourages the inferred initial distribution from departing too freely from a declared prior. Missing-value masks decide which likelihood terms exist; an observed zero is still a term.

A **Latent ODE** is this generative construction, rather than another name for the scalar jump rule above. For one Gaussian latent coordinate, use μ = 0.4, σ = 0.6 and ε = −0.5. The sampled initial state is 0.4 + 0.6(−0.5) = 0.1. A fixed ε isolates the effect of changing μ or σ; repeatedly resampling it answers a different question about uncertainty.

\[
z_0=\mu+\sigma\epsilon,\quad \epsilon\sim\mathcal N(0,1),\qquad
\mathrm{KL}\!\left(\mathcal N(\mu,\sigma^2)\,\|\,\mathcal N(0,1)\right)
=\tfrac12(\mu^2+\sigma^2-1-\log\sigma^2).
\]

Our example's KL is 0.270826. The square penalizes a displaced mean; the variance and log-variance terms keep a posterior from freely collapsing or expanding. A decoder with mean 0.7 and observation standard deviation 0.2 assigns a measured value 0.8 log-likelihood

\[
\log p(0.8\mid z)=-\tfrac12\log(2\pi\,0.2^2)
-\frac{(0.8-0.7)^2}{2(0.2)^2}=0.565499.
\]

A density can exceed one, so a positive log-density is valid. These are **separate constructed decoder operands**, not a claim that our sample 0.1 trained a decoder to output 0.7. For multiple observations, sum the available log-likelihood terms and average over latent samples. The training quantity is the evidence lower bound:

\[
\mathrm{ELBO}
=\mathbb E_{q(z_0\mid\mathcal O)}\!\left[\sum_{i\in\text{observed}}\log p(x_i\mid z(t_i))\right]
-\mathrm{KL}(q(z_0\mid\mathcal O)\|p(z_0)).
\]

Here \(\mathcal O\) is the information allowed into the encoder. The [VAE and ELBO lesson](/learn/path/full-curriculum/vae-elbo?module=generative-models) develops this inference objective and its implementation; the [Latent ODE paper](https://proceedings.neurips.cc/paper_files/paper/2019/file/42a6845a557bef704ad8ac9cb4461d43-Paper.pdf) connects it to continuous trajectories and an ODE-RNN recognition network. Its encoder may integrate backward through the observed set to infer z₀. That recognition computation is not the continuous loss adjoint from **Learn through a trajectory**.

For interpolation, the allowed observation set can contain measurements on both sides of a query. For forecasting, restrict it to information available at the forecast origin, including preprocessing and masks. A latent distribution is not automatically calibrated uncertainty; posterior approximation, noise assumptions and held-out coverage all matter. A time-aware ordinary RNN is a legitimate comparison and can receive elapsed time directly.

### The observation times can carry information too

What if events arrive more often when the hidden condition changes? Ignoring timing may discard evidence.

[Flow ODE — event-rate]

The upper strip shows a positive event rate λ(t). The cyan ticks mark actual arrivals. Each tick contributes log λ(tᵢ); the shaded rate integral charges for the expected number of arrivals across the whole observed window. For a point process with the specified conditional intensity,

\[
\log p(\{t_i\})=\sum_i\log\lambda(t_i)-\int_0^T\lambda(t)\,dt.
\]

Take rate two on [0, 0.5), rate one on [0.5, 1], and arrivals at 0.2 and 0.8. The event terms sum to log2 + log1; the integral is 2×0.5 + 1×0.5 = 1.5. The timing log-likelihood is −0.806853. A neural model can produce a positive rate from its state, for example with softplus, and integrate that rate as another accumulator. The Latent ODE paper uses a Poisson-process timing model. Value likelihood and timing likelihood are different paths in the loss; neither turns a sensor policy or observational association into a causal claim.

## 8. Deeper: how does a flow move probability density?

We have followed individual states and distributions over initial states. Suppose instead that we transform an entire population of samples. If a fixed amount of probability spreads over more space, how must its density change?

[Flow ODE — density-patch]

The cyan square has four labelled starting corners and probability mass m. The violet parallelogram contains their transported positions at the same final clock. Its area has changed, while its mass has not. The density along a moving point is mass per local area, so an area increase means an inverse density change. The second view rotates a patch without changing its area: movement itself is not evidence of expansion.

Return to a two-dimensional linear field, now explicitly choosing

\[
f(z)=Az,\qquad A=\begin{bmatrix}0.2&2\\0.4&-0.1\end{bmatrix},\qquad T=2.
\]

The exact map is exp(TA). Its determinant is exp(T trA), with trace trA = 0.2−0.1 = 0.1. Area multiplies by exp(0.2) = 1.221403; density along the trajectory multiplies by exp(−0.2) = 0.818731. The off-diagonal entries reshape and move the patch even though they do not appear directly in the trace.

### Why the trace appears

What connects this picture to a general learned field?

[Flow ODE — density-accumulator]

The upper channels hold the state and return its rate f. The lower channel holds log-density and returns minus the sum of the field's same-coordinate derivatives. The solver updates both channels at the same stage clocks. The log-density channel receives the state; in the usual construction, it does not feed back into the state derivative.

Let B(t) be the Jacobian of the evolving state with respect to its initial state. Differentiating the state equation gives B' = J_z f B, where J_z f is the field's state Jacobian. For a differentiable, invertible flow with the needed regularity and nonzero determinant, the determinant derivative yields

\[
\frac{d}{dt}\log|\det B|
=\operatorname{tr}(B^{-1}B')
=\operatorname{tr}(B^{-1}J_zfB)
=\operatorname{tr}(J_zf).
\]

Probability conservation says p_t(z(t)) |detB(t)| = p₀(z₀). Taking logs and differentiating therefore gives the **instantaneous change-of-variables rule**:

\[
\frac{d}{dt}\log p_t(z(t))=-\operatorname{tr}J_zf(t,z(t))=-\nabla\cdot f(t,z(t)).
\]

The divergence is the diagonal sum of that Jacobian, measuring instantaneous local volume expansion. It is a state derivative, not a derivative with respect to clock time. Sampling evolves a base sample forward. Likelihood evaluation must relate the observed point back to its base density and accumulate the log-volume change in the correct direction. This distinction determines the sign and which initial density is known.

A **continuous normalizing flow**, or CNF, integrates these joint channels. The [normalizing-flows lesson](/learn/path/full-curriculum/normalizing-flows-realnvp-glow-neural-ode?module=generative-models) teaches full density-model training, base distributions and likelihood evaluation. Here the exact linear map is our checkable implementation case.

### Obtain a trace without materializing every Jacobian entry

For a large state, explicitly storing all d² Jacobian entries can be expensive. Can a vector product reveal their diagonal sum?

[Flow ODE — trace-probe]

Follow one drawn sign vector ε through the actual matrix A: multiply Aε, then dot that output with ε. For ε = (1, 1), Aε = (2.2, 0.3), giving 2.5. For ε = (1, −1), Aε = (−1.8, 0.5), giving −2.3. Both are estimates of the same trace 0.1; the off-diagonal contributions cancel only when averaged over the probe distribution.

If ε has zero mean and covariance I, expand the quadratic form:

\[
\mathbb E[\epsilon^\top J\epsilon]
=\sum_{i,j}J_{ij}\mathbb E[\epsilon_i\epsilon_j]
=\sum_i J_{ii}=\operatorname{tr}J.
\]

Independent equally likely signs satisfy those second-moment conditions. The four sign vectors in this two-dimensional example give 2.5, −2.3, −2.3, 2.5, whose mean is 0.1. A single estimate can have the wrong sign. Jacobian-vector or vector-Jacobian products compute the quadratic form without allocating the complete matrix; the earlier manual sensitivities established what these products mean. [FFJORD](https://arxiv.org/html/1810.01367v2) applies this estimator to continuous density models.

Fix the random probe throughout one solve so the right-hand side remains a consistent function for the numerical solver. Trace sampling error and integration error are different. Unbiased trace estimation does not make an exponentiated density estimate unbiased, nor guarantee that a finite adaptive solve is an unbiased log-density estimator. Reverse-time integration, floating-point conditioning and the base density still need checks.

### Penalize motion and Jacobian size separately

Could we encourage a learned field to take an easier route without changing its architecture?

[Flow ODE — regularizer-accumulators]

Two additional scalar channels start at zero. One accumulates squared velocity; the other accumulates squared Jacobian size. Their outputs join the task loss with declared nonnegative weights. They receive the state path, but do not become extra hidden coordinates that change its derivative.

\[
r_v'=\|f(t,z(t))\|^2,\qquad
r_J'=\|J_z f(t,z(t))\|_F^2,\qquad
L_{\rm total}=L_{\rm task}+\lambda_v r_v(T)+\lambda_J r_J(T).
\]

The Frobenius norm squares **every** Jacobian entry, then sums. For our A it is 0.2²+2²+0.4²+(−0.1)² = 4.21. Over T = 2 its constant-Jacobian accumulator is 8.42. The trace remains 0.1: small divergence does not imply a small Jacobian, low curvature or easy integration. Squared velocity depends on the trajectory and its units. [Finlay and colleagues](https://proceedings.mlr.press/v119/finlay20a.html) study kinetic and Jacobian regularization in CNFs; this calculation explains the operands without claiming a newly trained model or a universal speedup.

The one-way dependency also matters to the controller. In a continuous adjoint, parameter-gradient quadrature receives the reconstructed state and adjoint but does not change those two derivatives. An **adjoint seminorm** can exclude that quadrature from the adaptive error norm, reducing work in suitable cases. It still numerically integrates the parameter gradient; exclusion is not a guarantee about its error. The [seminorm-adjoint paper](https://arxiv.org/abs/2009.09457) and official torchdiffeq options specify the trade-off. Distinguish controller norm, model regularization and task loss: each changes a different part of the computation.

## 9. Deeper: why train a velocity without solving each training pair?

CNF likelihood training follows samples while accounting for volume change. Another route supplies training velocities directly. Where could those targets come from before the learned field is accurate?

[Flow ODE — conditional-paths]

The cyan start x₀ is paired with an amber endpoint x₁. A clock t selects a location on the straight segment between them. Its target arrow is the endpoint difference, which is constant along that particular segment. For x₀ = 0 and x₁ = 2, the halfway location is one and the velocity is two.

\[
x_t=(1-t)x_0+tx_1,\qquad u_t=x_1-x_0,\qquad
L=\mathbb E\|v_\theta(t,x_t)-u_t\|^2.
\]

For this endpoint-interpolation form of **conditional flow matching**, sample a pair and a time, calculate x_t and u_t, and train a velocity regressor. Ordinary regression training does not integrate the learned ODE for each target. Generating a new sample still solves x' = vθ(t,x) from a base sample, unless a separately taught distillation or approximation changes that process. Other conditional paths retain endpoint noise or use different couplings, and therefore change these operands.

### Two pair paths can supply different targets at the same input

Does the learned field reproduce every paired straight segment?

[Flow ODE — conditional-mean]

The second pair goes from two to zero. At t = 0.5, it also presents x = 1, but its target velocity is −2. A model receiving only (t, x) cannot distinguish the two pair identities. The arrows ±2 in the drawing belong to **two conditional training paths**. The single violet output at their common input is their conditional mean, zero.

For an output v at that input, equally likely targets give

\[
\tfrac12(v-2)^2+\tfrac12(v+2)^2=v^2+4.
\]

Zero minimizes this quantity, giving mean squared loss four. Always predicting +2 gives mean loss eight. More generally, condition on the regressor input and expand a square around the conditional mean:

\[
\mathbb E[\|v-U\|^2\mid t,x]
=\|v-\mathbb E[U\mid t,x]\|^2
+\mathbb E[\|U-\mathbb E[U\mid t,x]\|^2\mid t,x].
\]

The second term does not depend on v. The first explains why least-squares regression learns the conditional mean velocity. This local two-pair calculation is not a complete smooth-density model. Under the appropriate regularity assumptions, the population conditional-mean field transports the marginal probability path, as developed in [Flow Matching for Generative Modeling](https://arxiv.org/html/2210.02747v2).

The drawing keeps a learned marginal field separate from the paired paths for this reason. Straight conditional paths do not guarantee straight generated trajectories or a globally optimal transport map. A coupling specifies which endpoints are paired; a field specifies the velocity available from the model's actual input.

CNF likelihood, latent-ODE reconstruction and flow-matching regression share an ODE solver but optimize different objectives. For full scratch/library implementations, couplings, schedules, generative fits and evaluation, continue to [Rectified Flow and Flow Matching](/learn/path/full-curriculum/rectified-flow-flow-matching?module=generative-models). That lesson develops the generative task beyond this mechanism comparison.

## 10. Deeper: how can scientific structure enter the field?

The preceding objectives chose what to fit. We can also decide what the dynamics are allowed to do. Each construction below changes a specific missing assumption; keep its states and operations explicit before choosing a neural architecture.

### Preserve known dynamics and learn the missing correction

What if an existing physical rule explains most of the motion?

[Flow ODE — known-correction]

The same supplied state feeds two derivative routes. One computes a known rate; the other computes a learned correction. The gray add combines the **rates**, then the solver multiplies that sum by its interval and adds it to state. For a constructed scalar case z = 1, a known decay −2z contributes −2 and a missing learned forcing contributes 0.3. The total rate is −1.7; one Euler step of size 0.1 reaches 0.83.

\[
z'=f_{\rm known}(t,z)+f_\theta(t,z).
\]

This arrangement avoids making the learned component rediscover a known law. It does not identify the true missing physics automatically: different fields can fit the same short observed path, and hidden variables may change the apparent rule. Test new initial conditions, interventions where justified, conservation and held-out regimes. A good trajectory fit alone is insufficient evidence of mechanism identification.

### Learn an energy and differentiate it to obtain motion

Can we build conservation into the continuous field rather than reward it after the fact?

[Flow ODE — hamiltonian]

The two state coordinates are position q and momentum p. The energy contour through (1, 0) is the circle H = 0.5 for H(q,p) = (q²+p²)/2. Its gradient (q,p) points outward. The fixed skew operation rotates that gradient to the tangent velocity (p,−q). At (1,0), the velocity is (0,−1), moving along the contour rather than across it.

For a differentiable autonomous learned energy Hθ, **Hamiltonian dynamics** use

\[
q'=\nabla_p H_\theta,\qquad p'=-\nabla_q H_\theta,
\qquad
\frac{dH_\theta}{dt}
=\nabla_qH_\theta^\top\nabla_pH_\theta
-\nabla_pH_\theta^\top\nabla_qH_\theta=0.
\]

The cancellation concerns the exact autonomous field. Explicit Euler from (1,0) with h = 0.1 gives (1,−0.1), energy 0.505: the solver has not inherited exact conservation. A symplectic Euler ordering first sets p_new = p_old−h q_old, then q_new = q_old+h p_new, giving (0.99,−0.1), energy 0.49505. Symplectic integration preserves a geometric structure and can give better long-time behavior for suitable systems; it is not exact energy conservation at every step. A damped system also needs dissipation rather than the preceding pure conservation assumption. The [Hamiltonian Neural Networks paper](https://arxiv.org/abs/1906.01563) makes the learned-energy route explicit.

### Learn a solution or learn its derivative?

A Neural ODE learned a rate and integrated it. What changes if a network directly outputs the proposed solution?

[Flow ODE — solution-residual]

The upper route takes a clock and predicts uθ(t). Automatic differentiation produces its clock derivative; a residual subtracts the required derivative rule. The lower ODE route instead takes the current state and clock, predicts a rate, and lets a solver produce future states. For the equation u' = −u, a candidate uθ(t) = c exp(−t) has residual u' + u = 0 for **every** c. An initial-condition term is needed to select c = 1 when u(0) = 1. Satisfying a differential residual alone does not identify the desired solution.

A physics-informed neural network may penalize equation residuals and initial/boundary conditions at sampled coordinates. The [PINN lesson](/learn/path/full-curriculum/physics-informed-neural-networks-pinns?module=frontier-research) develops those loss and sampling choices. The two routes can be combined, but require different information, optimization and verification.

### Detect an event and apply an explicit jump

How should the solver handle a state reaching a boundary?

[Flow ODE — event-reset]

The state falls from one at rate −1. The event function g(z) = z reaches zero at clock one. A root finder locates that crossing within the numerical interval; a separate reset rule sets the state to 0.8 before the next segment. The reset is a specified operation, not a motion invented by the smooth field.

For z' = −α, α > 0 and z(0) = 1, the event time is τ = 1/α and its rate derivative is −1/α². More generally, differentiating g(τ,z(τ,θ),θ) = 0 gives an event-time derivative with denominator g_t + g_z f. Near a tangent contact this denominator can vanish; changes in which event occurs first can also change the derivative contract. A solver that checks only endpoint signs may miss multiple crossings inside an interval. State reset derivatives and event-time sensitivity must be included when differentiating the entire hybrid program. The ordinary smooth adjoint in **Learn through a trajectory** did not cover those jumps automatically.

### Supply a continuous input path or a noise process

An irregular sensor may drive the dynamics through a continuous interpolated input. Is that the same as repeatedly adding observations or random dropout?

[Flow ODE — controlled-stochastic]

In the left route, a specified input path X supplies increments ΔX. The field multiplies them to update the state, as in dz = fθ(z) dX. For the scalar smooth path construction dz = z dX, starting at one, a positive increment ΔX = 0.2 gives an Euler increment 0.2 and state 1.2; the exact solution across that input change is exp(0.2) = 1.221403. Its dependence is on the input path, rather than elapsed time alone. A **controlled differential equation** also needs the interpolation and information-availability policy for X.

In the right route, a Brownian increment ΔW has variance Δt. In an Itô SDE dz = a(t,z)dt + b(t,z)dW, the drift and noise contributions are separate. For Δt = 0.1, drift zero, b = 0.5 and a constructed standard-normal draw ξ = 1, the noise increment is 0.5√0.1 = 0.158114. That one draw illustrates the scaling; it is not an expected deterministic path. The calculus convention affects derivatives and numerical methods. Follow [Itô Calculus and Stochastic Differential Equations](/learn/path/full-curriculum/it-calculus-stochastic-differential-equations?module=math-foundations) for that foundation, and [Kidger's neural differential-equations treatment](https://arxiv.org/html/2202.02435) for neural controlled/stochastic constructions.

New dropout masks on each evaluation do not automatically define either model: a solver expects a declared mathematical input/noise contract. An observation jump, a controlled increment and Brownian forcing represent different processes even when each changes state.

### Deeper implementation choices: reversible steps and learned corrections

The continuous backsolve could amplify reconstruction error. Can we instead reverse the **executed numerical step**?

[Flow ODE — reversible-step]

The deterministic worked drawing starts with main state 1, auxiliary state 1 and rate −1. With h = 0.1, its auxiliary update gives 0.9, then averaging the old and new rates gives main state 0.905. Reversing the drawn algebra first recovers auxiliary state 1, then main state 1. The auxiliary value is a numerical variable, not another learned hidden coordinate.

A reversible integrator retains enough algebraic information to undo its own updates, unlike reconstructing an exact continuous path from a rounded final state. Reversible Heun methods exploit such coupled update equations. Algebraic reversibility does not remove floating-point error, saved requested outputs or parameter-gradient storage; it is not a universal constant-memory promise. [Efficient and Accurate Gradients for Neural SDEs](https://proceedings.neurips.cc/paper/2021/file/9ba196c7a6e89eafd0954de80fc1b224-Paper.pdf) develops reversible Heun with a declared stochastic convention and reconstructible noise. Its particular performance measurements do not transfer automatically to a deterministic classifier.

A **hypersolver** takes another route. It predicts a correction to a known numerical step:

\[
z_{n+1}=\Psi_h(t_n,z_n)+h^{p+1}g_\phi(t_n,z_n,h),
\]

where Ψ_h is a specified order-p method and the scaling represents its local error order under the appropriate smoothness assumptions. The correction can be trained against a higher-accuracy reference. It must be tested on new states, intervals and field parameters; a learned correction for one dynamics family is not automatically a general-purpose solver. [Hypersolvers: Toward Fast Continuous-Depth Models](https://proceedings.neurips.cc/paper/2020/hash/f1686b4badcf28d33ed632036c7ab0b8-Abstract.html) investigates that learned numerical approximation. Neither design substitutes for defining the forward equation, gradient objective and refinement test.

## 11. Diagnose the right layer of a problem

We have changed field, solver, loss, information boundary and state structure separately. When a result is surprising, which of those layers should we inspect first?

A useful implementation begins with a small, deterministic field and a checkable solver. Add complexity after establishing which part of the system needs it.

| Observation | A question to investigate | Useful controlled check |
| --- | --- | --- |
| Endpoint changes under finer resolution | Was training exploiting a coarse numerical map? | Keep weights/input fixed; compare methods and step sizes |
| Gradient differs from a reference | Are both differentiating the same objective and discretization? | Compare autograd with finite differences of the exact executed loss |
| Backward reconstruction fails | Does reversing dynamics amplify endpoint error? | Test an analytic system; compare stored/checkpointed states |
| Adaptive solver takes many steps | Is the cause scaling, tolerances, transients, smoothness or stiffness? | Normalize coordinates; inspect rejection/error traces; compare an appropriate implicit method |
| More input examples change a batch member's result | Are states coupled by BatchNorm or a shared adaptive error controller? | Evaluate examples individually and inspect the batch error norm |
| Trajectory seems to cross itself | Is it a projection or a visit at another time? | Inspect full state with time labels |
| Forecast looks too accurate | Did the encoder see observations beyond the forecast origin? | Rebuild the information-availability mask before fitting |
| Density behaves implausibly | Is the divergence sign/direction right, and is trace noise large? | Use an exact linear flow with known determinant first |

Batching deserves particular care. A shared adaptive controller can use a norm over a whole batch. Many easy coordinates may dilute one difficult coordinate under an RMS norm; a maximum-based norm behaves differently. Even when the mathematical fields are independent, step decisions can depend on which examples are batched together.

For neural fields, smooth activations often make high-order integration easier to use. ReLU is Lipschitz, so it does not by itself destroy uniqueness, but its kinks can affect differentiability and numerical-order behavior. Repeated random dropout masks or mutable normalization statistics can change the field between evaluations; decide what fixed function the solver is supposed to integrate.

Performance depends on field cost, forward and backward evaluations, state size, saved outputs, solver/controller overhead and device utilization. Record those factors before making a timing claim. More accurate integration need not improve statistical prediction if model or data error dominates.

## 12. Practice: transfer the mechanism

Use these independently changed cases to work through the mechanism. Hints and reasoned solutions follow each question. Numerical answers refer to the stated finite computation or exact equation, as named.

### 1. A different decay

Start at \(z_0=2\), with \(z'=-3z\). Take two Euler steps of length 0.1. Compare the result with the exact state at time 0.2. Explain the sign of the error.

<details>
<summary>Hint</summary>

Each Euler step multiplies the state by \(1-3(0.1)\). Compare that factor with the exact exponential factor.

</details>

<details>
<summary>Solution and reasoning</summary>

Euler gives \(2(0.7)^2=0.98\). The exact state is \(2e^{-0.6}=1.097623272\), so the error, numerical minus exact, is −0.117623272. The start-of-step tangent keeps decreasing at its initial slope while the exact positive state's decay slows. For this step size, Euler therefore decreases too far.

</details>

### 2. Resolution without new weights

A four-dimensional field takes the state plus time through a 16-unit tanh hidden layer and a four-output affine layer. A three-class affine head reads the final state. Count the parameters. Does increasing classical RK4 steps from four to twelve triple them?

<details>
<summary>Hint</summary>

An affine map from \(a\) inputs to \(b\) outputs has \(ab+b\) parameters. Count field and readout separately from evaluations.

</details>

<details>
<summary>Solution and reasoning</summary>

The field has \(5(16)+16+16(4)+4=164\) parameters. The readout has \(4(3)+3=15\), totaling 179. Four versus twelve RK4 steps require 16 versus 48 field evaluations, but both use the same 179 parameters. The forward computation grows; the parameter set does not.

</details>

### 3. A local estimate is not a final guarantee

An embedded step has current state 0.5, Heun state 0.49 and Euler state 0.48. Let relative tolerance be 0.02 and absolute tolerance 0.001. Is it accepted by the lesson's scalar controller? Does acceptance prove endpoint error below 0.001?

<details>
<summary>Hint</summary>

Use the maximum magnitude of current and Heun states in the denominator.

</details>

<details>
<summary>Solution and reasoning</summary>

The scale is \(0.001+0.02(0.5)=0.011\). The normalized difference is \(0.01/0.011=0.90909\), so this step is accepted. That is a comparison of two local approximations. Accumulation, estimator accuracy and conditioning separate it from a guarantee about final global error.

</details>

### 4. Differentiate one Euler step

Use \(z'=\theta z\), \(z_0=1.5\), one step of length 0.2, target 1, and half squared error. At \(\theta=-1\), calculate the prediction and parameter gradient of this one-step program.

<details>
<summary>Hint</summary>

Differentiate \(z_1=z_0(1+h\theta)\), then apply the loss derivative.

</details>

<details>
<summary>Solution and reasoning</summary>

The prediction is 1.2; \(dz_1/d\theta=0.3\). Therefore \(dL/d\theta=(1.2-1)(0.3)=0.06\). A small gradient-descent step decreases \(\theta\), reducing the numerical prediction toward the target. The exact continuous prediction \(1.5e^{-0.2}\) defines a different loss; substituting it halfway through this calculation would mix objectives.

</details>

### 5. Separate invertibility from a readout

Can a unique one-dimensional continuous flow followed by one linear threshold label inputs −2 and 3 as class one and input 0 as class zero? Construct an augmented solution and name a numerical failure that could confuse this test.

<details>
<summary>Hint</summary>

Preserve ordering in one dimension, then use a second coordinate proportional to the square of the first.

</details>

<details>
<summary>Solution and reasoning</summary>

The one-dimensional flow keeps 0 between the other points, so a single threshold cannot select both outer points alone. Starting at \((x,0)\), the field \(x'=0,y'=x^2\) reaches \((-2,4),(0,0),(3,9)\) at time one; \(y>1\) works. A coarse explicit solver can reverse or collapse order even where the exact flow does not. A nonlinear readout also changes the representational question and must not be silently substituted.

</details>

### 6. Observation deletion

Start at zero. Let \(h'=-0.5h\), and update by \(h^+=0.7h^-+0.3x\) at times 0.4 and 1.0 with observations 2 and 0. Query at 1.2. Compare with omitting the second observation.

<details>
<summary>Hint</summary>

The second observed value is zero, but its update still scales existing state by 0.7.

</details>

<details>
<summary>Solution and reasoning</summary>

After the first observation, state is 0.6. With the zero observation, the final state is \(0.6e^{-0.3}(0.7)e^{-0.1}=0.42e^{-0.4}=0.281534419\). Omitting it gives \(0.6e^{-0.4}=0.402192028\). Zero is evidence processed through an update; deletion removes that operation.

</details>

### 7. Expansion and density

A two-dimensional linear field has matrix \(\begin{bmatrix}0.4&3\\0&-0.1\end{bmatrix}\). Over 1.5 units of time, what are the log-density change and volume multiplier? Does a large off-diagonal entry invalidate the trace calculation?

<details>
<summary>Hint</summary>

The trace is the diagonal sum. Density and volume change inversely along the flow.

</details>

<details>
<summary>Solution and reasoning</summary>

The trace is 0.3. Log-density changes by −0.45, and volume multiplies by \(e^{0.45}=1.568312185\). Density multiplies by \(e^{-0.45}=0.637628152\). The off-diagonal entry alters shape and motion; the determinant identity still uses the trace for this constant linear field.

</details>

### 8. What can a velocity regressor know?

Two equally likely training pairs are \(−1\to3\) and \(3\to−1\). At time 0.5, what location and target velocities do they present? What prediction minimizes mean squared loss at that location? Why should you not draw both pair paths as solutions of a single unique field?

<details>
<summary>Hint</summary>

A model receiving only position and time cannot distinguish the pair identity.

</details>

<details>
<summary>Solution and reasoning</summary>

Both present location one, with velocities +4 and −4. Their conditional mean is zero; the mean squared loss there is 16. Always choosing +4 would give mean loss 32. Under uniqueness, one field cannot choose two velocities at the identical state and time. Pair-conditioned training paths and trajectories of the learned marginal field are different objects.

</details>

### 9. Design an honest comparison

A report trains a neural flow and a residual classifier, tries new tolerances after reading test accuracy, and publishes only the best seed. It calls a two-coordinate projection proof that trajectories never cross. Propose a corrected protocol.

<details>
<summary>Hint</summary>

Separate data roles, statistical variation, numerical sensitivity and the full-state mathematical claim.

</details>

<details>
<summary>Solution and reasoning</summary>

Declare splits, preprocessing, architectures, budgets, seeds and model-selection rules before assessment. Fit transformations only on training data and select with validation; retain all declared seeds and report actual parameter/evaluation costs. Perform solver-sensitivity checks on a specified diagnostic or validation set with fixed weights, then assess under a fixed protocol. A projection is a visualization of selected coordinates, not a proof about full-state uniqueness. State theorem assumptions and use analytic counterexamples or full-state checks for the claim actually being made.

</details>

### 10. Implement a clock-correct sensitivity

Use the new `ode_sensitivities.py` on z′ = θz + t. Start at clock 0.2 with state 0.8, stop at 0.7, use two Euler intervals, θ = 0 and target 0.9. Calculate the finite endpoint, its initial-state and parameter loss derivatives, and the separately exact continuous answers. Then call `example(initial=(.8,), rates=(0,), target=(.9,), start=.2, stop=.7, intervals=2, method='euler')` to check your calculations. Inspect which actual stage clocks the solver stores. Why would using a zero-based reverse clock change this problem?

<details><summary>Hint</summary>

The two Euler rates are the supplied clocks 0.2 and 0.45. The parameter derivative of the rate is the current state even at θ = 0. For the exact answer, integrate the clock term and the sensitivity equation separately.

</details>

<details><summary>Solution and reasoning</summary>

Each interval is 0.25. Euler reaches 0.8 + 0.25×0.2 = 0.85, then 0.85 + 0.25×0.45 = 0.9625. The residual is 0.0625. The initial-state derivative of this endpoint is one. The parameter sensitivity starts at zero, becomes 0.25×0.8 = 0.2, then 0.2 + 0.25×0.85 = 0.4125. Thus the finite loss derivatives are 0.0625 with respect to the initial state and 0.0625×0.4125 = 0.02578125 with respect to θ.

The exact endpoint is 0.8 + (0.7²−0.2²)/2 = 1.025, with residual 0.125. At θ = 0, its parameter sensitivity is Δz₀ + aΔ²/2 + Δ³/6 = 0.445833333, where a = 0.2 and Δ = 0.5. The exact loss derivatives are 0.125 and 0.0557291667. These differ from the finite Euler derivatives because their endpoints and sensitivities come from a different forward function. A clock restarted at zero would supply a different t term in every backward rate. Refining RK4 can check convergence; it does not make the two-interval Euler loss retrospectively continuous.

</details>

You are ready to continue when you can distinguish a field from a solved trajectory, compute and compare numerical updates, name the objective behind a gradient, explain augmentation with its readout assumption, and keep observation availability separate from evaluation time. You should also be able to read an experiment's counts and numerical limits without needing every method to win.

## 13. Continue and learn another way

### What to learn next

The next topic in this module is [Hybrid SSM–Transformer Architectures (Jamba)](/learn/path/full-curriculum/hybrid-ssm-transformer-architectures-jamba?module=deep-learning-fundamentals). It returns to discrete token sequences and combines different memory operations. Our current lesson adds another distinction to that comparison: a continuous dynamical model still needs a concrete numerical execution method.

### References and other ways to learn

Start with one numerical treatment and one neural-model treatment, then return to the primary papers for the branches you want to build.

- [Harvard AM205, Unit 3: Initial-Value Problems](https://pkarnakov.com/am205/slides/unit3/). A conventional numerical route through Euler, Runge–Kutta, local/global error, adaptive estimates and stability. Start at the initial-value-problem and time-stepping slides; this is the numerical counterpart to sections 1–4.
- [On Neural Differential Equations](https://arxiv.org/html/2202.02435), Patrick Kidger. A broad specialist treatment. Begin with the Neural ODE model and parameterization sections; use its backpropagation, numerical solver and regularization chapters after the worked gradient comparison. Its controlled/stochastic chapters extend section 10 with the needed mathematical assumptions.

- [Neural Ordinary Differential Equations](https://arxiv.org/html/1806.07366v5), Chen and colleagues. Primary introduction to learned dynamics, adjoints and applications. Read the mathematical model first; revisit memory claims with the numerical qualifications in this lesson.
- [Discretize-Optimize vs. Optimize-Discretize](https://arxiv.org/html/2005.13420v2), Onken and Ruthotto. An intermediate numerical perspective on gradients, rediscretization and extrapolation. Its experiments are specific evidence, not universal timing ratios.
- [Augmented Neural ODEs](https://arxiv.org/html/1904.01681v1), Dupont and colleagues. Read the one-dimensional construction and appendix uniqueness argument after section 5; the linear readout and exact-flow assumptions are essential.
- [torchdiffeq](https://github.com/rtqichen/torchdiffeq) and its [FAQ](https://github.com/rtqichen/torchdiffeq/blob/master/FAQ.md). Practical PyTorch API and solver/adjoint guidance. Repository documentation was reviewed and the downloadable local solver bridge was executed with torchdiffeq 0.2.5; the repository’s separate official example suite was not executed. The downloadable local study is self-contained with PyTorch.
- [Diffrax adjoints](https://docs.kidger.site/diffrax/api/adjoints/). A JAX-oriented explanation of checkpointed differentiation and continuous backsolves. Read after the scalar gradient experiment rather than starting with every API class.
- [Latent ODEs for Irregularly-Sampled Time Series](https://proceedings.neurips.cc/paper_files/paper/2019/file/42a6845a557bef704ad8ac9cb4461d43-Paper.pdf). Primary methods for encoding observations and separating interpolation from extrapolation. Useful after the observation-jump investigation.
- [FFJORD](https://arxiv.org/html/1810.01367v2) and [Flow Matching](https://arxiv.org/html/2210.02747v2). Two different training routes for continuous generative models. Their objectives deserve separate study, even though both generate with learned dynamics.
- [ANODE](https://arxiv.org/abs/1902.10298), [regularizing CNFs](https://proceedings.mlr.press/v119/finlay20a.html), and [adjoint seminorms](https://arxiv.org/abs/2009.09457). Different responses to reconstruction, difficult fields and unnecessary controller work. Read them after sections 4 and 8; they change different layers and do not supply interchangeable guarantees.
- [Hamiltonian Neural Networks](https://arxiv.org/html/1906.01563v2), [Efficient and Accurate Gradients for Neural SDEs](https://proceedings.neurips.cc/paper/2021/file/9ba196c7a6e89eafd0954de80fc1b224-Paper.pdf), and [Hypersolvers](https://proceedings.neurips.cc/paper/2020/hash/f1686b4badcf28d33ed632036c7ab0b8-Abstract.html). Primary routes into learned energy, reversible numerical updates and learned local corrections. Begin with their model/update definitions after section 10; their reported workloads and stochastic conventions need their own evaluation.
- [Ricky T. Q. Chen's CVPR 2020 workshop talk](https://anucvml.github.io/ddn-cvprw2020/talk2.html). An alternate video route into constraints, physical dynamics and probabilistic models. The organizer's title, speaker and abstract were verified; the embedded recording was not watched, and no timestamp is claimed. Use the paper and checked calculations for technical details.

### Build and reproduce

The visible complete programs above cover fixed solver/training (`neural_ode_study.py`), manual sensitivities (`ode_sensitivities.py`), the matched library route (`solver_library_bridge.py`) and local calculations (`ode_calculations.py`). Keep the library bridge beside the study because it imports the already implemented `integrate`; that is deliberate scratch-code reuse. The new sensitivity program is standalone and writes no result files.

[Calculated inputs and outcomes](calculated-inputs.json), [saved weights](fitted-models.json), [all declared fitting histories](study-results.json), [Iris measurements](iris.csv) and [data provenance](data-provenance.md) support offline reproduction. The reader's shared file index gathers the program and supporting-file links once. No external large-model checkpoint is required.

[Flow ODE — program-calculations]
