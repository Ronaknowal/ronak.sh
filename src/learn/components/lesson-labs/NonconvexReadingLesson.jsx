// Static projection of manuscript-r3 with bounded runtime-content-amendment-r1 ending; no browser Markdown parser.
import { Prose, H2, H3, CodeBlock } from '../content';
import { Math as InlineMath, MathBlock } from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import Drawing from './NonconvexReadingDrawings.jsx';
function Payload({
  file,
  output = false
}) {
  return <section className="nc-programme" data-payload={file}><RemoteCodeBlock source={'/learn-assets/nonconvex-landscape/' + file} filename={file} language={output ? 'output' : 'python'} /></section>;
}
export default function NonconvexReadingLesson() {
  return <div className="lesson-pilot lesson-flow nonconvex-reading"><Prose opening="summary">{"An optimizer stops moving. Has it found the best answer, a worse local answer, a saddle, or a flat region that gives its update no useful signal? Follow a parameter point, its objective height and its actual update through small examples where those possibilities can be calculated. Then separate changes in parameters from changes in predictions."}</Prose>

<Prose opening="prerequisites">{"Prerequisites: "}<a href={"/learn/topic/multivariate-calculus-gradients#6-use-curvature-without-overclaiming"}>{"Multivariate Calculus"}</a>{" introduces gradients and Taylor approximation; "}<a href={"/learn/topic/eigenvalues-eigenvectors"}>{"Eigenvalues & Eigenvectors"}</a>{" explains symmetric eigenvalue signs; "}<a href={"/learn/topic/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars"}>{"Gradient Descent Variants"}</a>{" supplies the update θ ← θ − η∇F. We refresh the directional reasoning and introduce the ReLU units, sampling and measured-data regression locally. Python is optional for the geometric argument."}</Prose>

<Prose opening="route">{"On a first pass, follow the concrete examples and investigations in sections 1–8, then attempt the first seven tasks. Return to the visible deeper branches on uniform Taylor bounds, exact noise moments and coordinate changes after their motivating examples. The computational route uses complete programmes beside those mechanisms. The live investigations run here; downloaded Python runs in your own environment. Toy parameters and losses are dimensionless unless a measured unit is explicitly supplied. Numerical readouts are rounded; equations identify the exact relationships."}</Prose>

<H2>{"1. Find the better well"}</H2>

<Prose>{"We can adjust a setting x and evaluate the cost of that setting. Before asking an optimizer to improve it, locate the setting and the value it produces."}</Prose>

<Drawing id="N01" />

<Prose>{"The point on the horizontal line is a "}<strong>{"candidate parameter"}</strong>{". Moving vertically to the curve evaluates its "}<strong>{"objective"}</strong>{", W(x). Moving horizontally changes the candidate. A second drawing distinguishes this operation from using a fitted model: a model takes an input and returns a prediction, while an objective evaluates a parameter choice on the specified task or data. In a neural-network landscape, the horizontal coordinates represent weights and biases, rather than the input features of one example."}</Prose>

<Prose>{"A landscape makes comparisons visible. A "}<strong>{"global minimum"}</strong>{" has cost no greater than every allowed candidate. A "}<strong>{"local minimum"}</strong>{" only needs that property in some neighborhood of itself. It is "}<strong>{"strict"}</strong>{" when every other sufficiently nearby point costs more. Global minima can tie, and a strict local minimum can lose a comparison with a distant point."}</Prose>

<Prose>{"Start with two equal wells."}</Prose>

<Drawing id="N02" />

<Prose>{"At x=−1 and x=1 the objective is zero. Every other point has positive cost. Each well is a strict local minimum; both are global. The middle point x=0 has height 1/4, above the chord joining the two zero-height endpoints. This violates the midpoint inequality for a convex function. "}<strong>{"Nonconvexity"}</strong>{" means the convexity condition fails; it does not by itself say how many minima exist or what a particular run will do."}</Prose>

<Prose>{"The curve comes from a nonnegative square. Add a small tilt δx to make one well better:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"W_\\delta(x)=\\frac{(x^2-1)^2}{4}+\\delta x."}</MathBlock></div>

<Prose>{"The "}<strong>{"derivative"}</strong>{" is the slope at a candidate. A differentiable interior extremum must have zero slope, since otherwise a sufficiently short move in one direction improves the value. The "}<a href={"/learn/topic/convex-optimization#4-certify-a-constrained-solution"}>{"supporting-plane guarantee from Convex Optimization"}</a>{" supplies a stronger conclusion under its assumptions: for a differentiable convex objective F on all of ℝⁿ, an exactly zero gradient at θ* gives F(θ) ≥ F(θ*) + ∇F(θ*)·(θ−θ*) = F(θ*) for every θ, so θ* is a global minimum. A small numerical gradient is not the same as exact zero and needs an additional quantitative bound to certify a small value error. Our tilted well is nonconvex, so its zero slopes require a fresh local and global comparison. Differentiate once for slope and again for how that slope changes:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"W_\\delta'(x)=x^3-x+\\delta,\\qquad W_\\delta''(x)=3x^2-1."}</MathBlock></div>

<Drawing id="N03" />

<Prose>{"For δ=.15, the derivative crosses zero at approximately −1.067923, .153626 and .914297. On the left outer crossing the slope changes from negative to positive, so the curve descends then ascends: a minimum. The middle crossing changes positive to negative: a maximum. The right outer crossing is another minimum. Their values are −.155256, .261383 and .143874. The left minimum is better. A negative value is allowed for this constructed cost; minimization does not require zero to be the smallest conceivable number."}</Prose>

<Prose>{"Why can we be sure this list contains every stationary point in the example?"}</Prose>

<Drawing id="N04" />

<Prose>{"The derivative's own turning points are x=±1/√3. Its monotone pieces are separated by those two coordinates. For every tilt in [−.2,.2], the derivative has opposite signs at the endpoints of each of the three intervals [−1.5,−1/√3], [−1/√3,1/√3] and [1/√3,1.5]. Continuity supplies a zero in each, monotonicity makes each unique, and a cubic has at most three roots. This is an exhaustive argument for the declared tilt range, not a generic way to enumerate neural-network stationary points."}</Prose>

<Prose>{"An optimizer can instead follow the slope from one starting point. Put a single update on the curve before following a long run."}</Prose>

<Drawing id="N05" />

<Prose>{"At x=.8 and δ=.15, the slope is .8³−.8+.15=−.138. With learning rate η=.12, gradient descent proposes displacement −ηW′=.01656, giving x_new=.81656. The displacement points toward increasing x because the local slope is negative. Its length is the chosen rate times the actual slope magnitude. Evaluating the new curve point measures what that proposal achieved."}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x_{k+1}=x_k-\\eta W_\\delta'(x_k)."}</MathBlock></div>

<Drawing id="N06" />

<Prose>{"The live comparison starts at .8 and keeps −.8 as a separate reference. After 60 updates at η=.12 and δ=.15, the .8 run is near .914296, with cost .143874; the −.8 run is near −1.067923, with cost −.155256. Both have nearly zero slope, but the endpoints answer different value comparisons. Change the tilt or starting point, or inspect an earlier update. Reset restores δ=.15, start .8 and horizon 60. A "}<strong>{"basin of attraction"}</strong>{" describes initial points that converge to a particular limiting answer under specified update rules and settings. A finite trajectory is evidence about that run; proving its limiting basin needs further analysis."}</Prose>

<Prose>{"To call the lower well globally best, we also need to know that a minimum exists and cannot hide beyond the plotted window."}</Prose>

<Drawing id="N07" />

<Prose>{"The leading x⁴/4 term dominates the quadratic and linear terms as |x| grows, so Wδ(x) tends to +∞. This property is called "}<strong>{"coercivity"}</strong>{". A continuous coercive function on the real line attains a minimum: outside some bounded interval its value exceeds that of a known candidate, and continuity attains the smallest value on the remaining closed interval. The minimum is an interior stationary point of the unconstrained problem. Our exhaustive three-root comparison therefore identifies the global well."}</Prose>

<Prose>{"Contrast E(x)=exp(−x). Its value is positive at every finite x and approaches zero as x tends to +∞. Its infimum, the greatest lower bound, is zero, but no finite candidate attains it. Its derivative −exp(−x) can also be arbitrarily small. Existence of an attained minimum is a separate question from small derivative or numerical termination."}</Prose>

<H3>{"Compute the complete comparison"}</H3>

<Prose>{"The explicit descent implementation below applies the displayed scalar update. NumPy's "}<code>{"roots"}</code>{" supplies the ordinary polynomial-root calculation; coefficient order "}<code>{"[1,0,−1,δ]"}</code>{" means x³+0x²−x+δ. Keep real roots whose computed imaginary part has magnitude below 10⁻¹⁰, sort them, and evaluate the original objective and curvature. The bounded three-root proof explains why these retained numerical candidates are the relevant ones."}</Prose>

<Prose>{"The recorded environment is Python 3.12.14 and NumPy 2.3.5. In the environment where you will run the examples, install the recorded NumPy version once:"}</Prose>

<CodeBlock language={"shell"}>{"python -m pip install \"numpy==2.3.5\""}</CodeBlock>

<Prose>{"Save as "}<code>{"wells.py"}</code>{", then run "}<code>{"python wells.py"}</code>{". Later NumPy-only programmes reuse this installation. Each scalar objective/update costs O(1); the fixed 60-step loops use O(K) work and O(1) extra state. General polynomial-root algorithms are delegated to NumPy; the code teaches the objective, candidate comparison and update rather than reimplementing a general root solver."}</Prose>

<Payload file="wells.py" /><Prose>Saved stdout:</Prose><Payload file="wells.py.stdout.txt" output />

<Prose>{"The first three rows compare all stationary candidates. The last two report finite descent endpoints, including the small difference between a 60-step result and the computed root. Reverse the tilt: W₋δ(x)=Wδ(−x), so both geometry and candidate comparisons reflect horizontally."}</Prose>

<Prose>{""}<strong>{"Checkpoint. Add y²/2 to the untilted quartic, as in Second-Order Methods. Is (0,0) still a local maximum?"}</strong>{""}</Prose>

<Prose>{"No. Along x it decreases away from the origin; along y it increases. Its Hessian is diag(−1,1), so it is a saddle. A maximum in a one-dimensional slice can become a saddle when another direction is available."}</Prose>

<H3>{"Ask an ordinary solver what success means"}</H3>

<Prose>{"We have established the objective, slopes, curvature and exhaustive candidate comparison. Now compare those quantities with a local solver's reported result."}</Prose>

<Drawing id="N08" />

<Prose>{"The first two BFGS starts, −1.4 and 1.4, reach the two different minima. A third start is the computed middle stationary root. Its gradient magnitude is approximately 5.551×10⁻¹⁷, so the local solver reports success while remaining at a point of negative curvature, approximately −.929197435. The success flag records its stopping condition. The slope-sign and value comparison supply the geometric classification."}</Prose>

<Prose>{""}<code>{"brentq"}</code>{" takes a continuous scalar derivative and a sign-changing bracket. For this fixed δ=.15 programme, the brackets are [−1.5,−.6], [−.5,.5] and [.6,1.5]. Its returned convergence record and derivative residual are checked. These particular brackets are fixed fixtures; if you change the objective or tilt, first establish valid brackets again. "}<code>{"minimize"}</code>{" takes a one-element parameter array, a scalar objective and an analytic gradient array of the same length. We select "}<code>{"method=\"BFGS\""}</code>{", gradient tolerance 10⁻⁹ and at most 100 iterations. The ordinary tool handles its local search; we retain responsibility for the candidate's meaning."}</Prose>

<Prose>{"Install the recorded SciPy version, alongside the NumPy environment above:"}</Prose>

<CodeBlock language={"shell"}>{"python -m pip install \"scipy==1.18.1\""}</CodeBlock>

<Prose>{"Save as "}<code>{"landscape_scipy.py"}</code>{" and run "}<code>{"python landscape_scipy.py"}</code>{". Each evaluation is O(1), and each solve has a stated iteration budget. The output below is the retained execution with SciPy 1.18.1; last numerical digits and stopping details may depend on the installed version."}</Prose>

<Payload file="landscape_scipy.py" /><Prose>Saved stdout:</Prose><Payload file="landscape_scipy.py.stdout.txt" output />

<Prose>{"Comparing the two minimum values closes the global question for this quartic. Starting a local method exactly at the maximum closes a different question: a sufficiently small gradient can satisfy a local stopping test without identifying a minimum."}</Prose>

<H2>{"2. Read stationary geometry"}</H2>

<Prose>{"The checkpoint changed a maximum into a saddle by adding a direction. In two parameters, we need to see the whole parameter plane and the heights above it."}</Prose>

<Drawing id="N09" />

<Prose>{"A "}<strong>{"height surface"}</strong>{" places (x,y,F(x,y)) in three-dimensional space. Its matching "}<strong>{"contour map"}</strong>{" stays in the parameter plane: each curve joins points of equal objective value. A "}<strong>{"directional restriction"}</strong>{" selects a line through that plane and plots the objective along the line. The bowl x²+y² rises along both coordinate directions; the cap −x²−y² falls along both; the saddle x²−y² rises along x and falls along y. These three views describe the same function, with different information made easier to read."}</Prose>

<Prose>{"For a differentiable objective, a point θ* is "}<strong>{"stationary"}</strong>{" when its gradient is zero. A "}<strong>{"saddle"}</strong>{" is a stationary point with both larger and smaller objective values arbitrarily close to it. Stationarity matters: the linear function F(x,y)=x has larger and smaller nearby values at every point, but its gradient (1,0) never vanishes. We will distinguish this saddle definition from a classification based only on second derivatives."}</Prose>

<Prose>{"To assemble the derivative objects, consider the coupled quadratic F(x,y)=x²+xy+2y² at (.2,−.1)."}</Prose>

<Drawing id="N10" />

<Prose>{"Its two slopes are ∂F/∂x=2x+y=.3 and ∂F/∂y=x+4y=−.2. They form the gradient vector (.3,−.2). Move by (.1,0): the gradient changes by (.2,.1). Move by (0,.1): it changes by (.1,.4). Dividing those gradient changes by .1 gives the two columns of the "}<strong>{"Hessian"}</strong>{", the matrix of second derivatives:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\nabla F=\\begin{pmatrix}2x+y\\\\x+4y\\end{pmatrix},\\qquad\nH=\\begin{pmatrix}2&1\\\\1&4\\end{pmatrix}."}</MathBlock></div>

<Prose>{"For this quadratic the gradient-change relation is exact, Δ∇F=Hh. For a general smooth objective it is the first-order approximation for a small displacement h. Twice continuously differentiable, or C², objectives have a symmetric Hessian in an open neighborhood."}</Prose>

<Prose>{"Now assemble the change in objective height."}</Prose>

<Drawing id="N11" />

<Prose>{"At θ=(.2,−.1), F=.04. Move by h=(.1,.05), giving (.3,−.05) with F=.08. The gradient contribution is (.3,−.2)·(.1,.05)=.02. The quadratic contribution is hᵀHh/2=.02. Together they give the actual change .04; the remainder is zero because this particular function is quadratic. This separates a height change from the Hessian's effect on a gradient."}</Prose>

<Prose>{"For a general C² function, the corresponding local statement is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"F(\\theta_*+h)-F(\\theta_*)=\n\\nabla F(\\theta_*)^\\top h+\\frac12h^\\top Hh+r(h),\n\\qquad \\frac{r(h)}{\\|h\\|^2}\\longrightarrow0\\quad(h\\to0)."}</MathBlock></div>

<Prose>{"At a stationary point the linear term vanishes. The quadratic term may then lead the height change, but the remainder still exists. On the saddle x²−y² at the origin, h=(.2,.1) gives change .03 exactly from the quadratic term. Later quartic examples will have a zero quadratic prediction and a nonzero actual change."}</Prose>

<Drawing id="N12" />

<Prose>{"A unit eigenvector v satisfies Hv=λv. Substituting h=tv gives quadratic change λt²/2. Positive λ bends upward along that direction; negative λ bends downward. For the saddle, x has λ=2 and y has λ=−2. Keep direction identity separate from the sign of bending: x remains the same axis in its vector, contour line and restriction. "}<a href={"/learn/topic/eigenvalues-eigenvectors"}>{"Eigenvalues & Eigenvectors"}</a>{" derives the orthonormal spectral basis; its "}<a href={"/learn-code/eigenvalues-eigenvectors/symmetric_eigen_scratch.py"}>{"complete Jacobi scratch programme"}</a>{" computes such a basis and checks eigenpairs in the original coordinates. Here we use that established operation to interpret a Hessian."}</Prose>

<H3>{"Deeper: why every direction is covered"}</H3>

<Prose>{"Checking two favorable slices is not a proof about every possible displacement. A positive-definite Hessian gives a uniform lower bound that covers them together."}</Prose>

<Drawing id="N13" />

<Prose>{"Let m>0 be its smallest eigenvalue. Then hᵀHh≥m‖h‖². For sufficiently small nonzero h, the remainder satisfies |r(h)|<m‖h‖²/4. At a stationary point,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"F(\\theta_*+h)-F(\\theta_*)\\ge\n\\frac m2\\|h\\|^2-\\frac m4\\|h\\|^2\n=\\frac m4\\|h\\|^2>0."}</MathBlock></div>

<Prose>{"The same neighborhood controls the remainder for all directions; that is the key step that sampled slices alone do not supply. Negative definiteness proves a strict local maximum by reversing signs. When there are both positive and negative eigenvalues, their restrictions produce opposite signs of height change for sufficiently small nonzero t, establishing a saddle."}</Prose>

<Prose>{"At a local minimum, every smooth one-dimensional restriction through it has a nonnegative second derivative. Thus the Hessian must be "}<strong>{"positive semidefinite"}</strong>{": hᵀHh≥0 for every h. This is necessary and weaker than positive definiteness; zero-curvature directions still need their actual higher-order behavior."}</Prose>

<Drawing id="N14" />

<Prose>{"At the origin, x⁴+y⁴ and x⁴−y⁴ both have zero gradient and zero Hessian. The first is strictly positive away from the origin, so the origin is its strict global minimum. The second increases along x and decreases along y, so the origin is a saddle. For x², all points with x=0 attain zero, forming a flat line of non-strict global minima. A "}<strong>{"degenerate"}</strong>{" stationary point has a singular Hessian, and a zero eigenvalue does not decide which of these behaviors occurs."}</Prose>

<NeuralTable caption={"Deeper: why every direction is covered"} headers={[<>{"Hessian evidence at a C² unconstrained stationary point"}</>, <>{"Conclusion"}</>, <>{"Remaining question"}</>]} rows={[[<>{"All eigenvalues positive"}</>, <>{"Strict local minimum"}</>, <>{"Is there a better distant candidate?"}</>], [<>{"All eigenvalues negative"}</>, <>{"Strict local maximum"}</>, <>{"Is it globally largest?"}</>], [<>{"Both positive and negative eigenvalues"}</>, <>{"Saddle"}</>, <>{"How does the chosen algorithm move?"}</>], [<>{"Nonnegative eigenvalues with a zero"}</>, <>{"Necessary second-order minimum condition"}</>, <>{"Can higher-order terms decrease?"}</>], [<>{"Nonpositive eigenvalues with a zero"}</>, <>{"Necessary second-order maximum condition"}</>, <>{"Can higher-order terms increase?"}</>]]} />

<Drawing id="N15" />

<Prose>{"Choose a family, a direction x/y/diagonal and a displacement distance. The output compares the actual objective change with hᵀHh/2. The default saddle, x direction and distance .2 gives actual and quadratic changes .04. Switching to quartic saddle and y gives actual −.0016 while its quadratic prediction stays zero. Reset restores the family, direction and distance. The direction is unit length, so the chosen distance really is ‖h‖."}</Prose>

<Prose>{"Save as "}<code>{"stationary.py"}</code>{", then run "}<code>{"python stationary.py"}</code>{" in the same NumPy environment. The six functions and their Hessian diagonals are explicit. "}<code>{"eigvalsh"}</code>{" returns the symmetric matrices' sorted eigenvalues. The programme evaluates each function at (.2,0) and (0,.2) rather than pretending those values came from its quadratic approximation. Each listed two-variable diagnostic uses constant work and storage; a general dense d×d eigendecomposition instead requires O(d³) work and O(d²) storage."}</Prose>

<Payload file="stationary.py" /><Prose>Saved stdout:</Prose><Payload file="stationary.py.stdout.txt" output />

<Prose>{"The quartic-saddle row is a complete counterexample to classifying a singular Hessian by eigenvalue signs alone. The proof of the quartic minimum comes from positivity at every nonzero point, not merely its two printed samples. Some optimization papers use “strict saddle” for a stationary non-minimum with a negative Hessian eigenvalue, including maxima under that convention; our ordinary mixed-sign saddle is unambiguous, while the quartic saddle has no negative eigenvalue at the origin."}</Prose>

<Prose>{"One final domain condition matters before applying these tests."}</Prose>

<Drawing id="N16" />

<Prose>{"For minimizing F(x)=x subject to x≥0, the optimum is x=0 and its gradient is 1. The negative direction that would lower F is forbidden. Our zero-gradient and Hessian conclusions concerned unconstrained interior points. At boundaries, "}<a href={"/learn/topic/constrained-multi-objective-optimization"}>{"constrained optimization"}</a>{" uses feasible directions and constraint conditions instead."}</Prose>

<H2>{"3. Follow a saddle direction"}</H2>

<Prose>{"The Hessian classifies local geometry. To learn what a particular optimizer does there, draw its actual update on that geometry."}</Prose>

<Drawing id="N17" />

<Prose>{"For F(x,y)=x²−y², a point at (.6,.001) has gradient (1.2,−.002). At η=.1, subtracting η times this vector gives displacement (−.12,.0002), reaching (.48,.0012). The x component moves toward the origin while the nonzero y component moves away. At the exact origin, both gradient components vanish and the deterministic update stays there."}</Prose>

<Prose>{"Coordinate by coordinate, the rule is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\nabla F=(2x,-2y),\\qquad\nx_{k+1}=(1-2\\eta)x_k,\\qquad\ny_{k+1}=(1+2\\eta)y_k."}</MathBlock></div>

<Drawing id="N18" />

<Prose>{"For 0<η<1, |1−2η|<1, so x contracts. The y multiplier exceeds 1. The exact line y=0 is a "}<strong>{"stable subspace"}</strong>{" of this recurrence: a point on it stays there and approaches the saddle. Any nonzero y grows in magnitude, preserving its sign. At η=.1 and x₀=.6,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x_k=.6(.8)^k,\\qquad y_k=y_0(1.2)^k."}</MathBlock></div>

<Prose>{"After 20 updates x≈.006918. An initial y₀=0 remains exactly zero, while y₀=.001 reaches approximately .038338. Keep the tiny initial displacement visible rather than rounding it into the stable line."}</Prose>

<Drawing id="N19" />

<Prose>{"The investigation compares y₀=0, .001 and −.001 with fixed η=.1 and x₀=.6. Move the horizon from 0 to 30 and trace both coordinates alongside the parameter path. The exact stable-line reference remains visible. Reset returns to y₀=.001 and horizon 20. The direction of escape is carried by the small component the original point already contains."}</Prose>

<Prose>{"Save as "}<code>{"saddle.py"}</code>{" and run "}<code>{"python saddle.py"}</code>{". "}<code>{"point"}</code>{" is a length-two NumPy vector; the explicit loop constructs the gradient at the old point, applies one update, and stores a copy so later mutation cannot change past states. Its array has shape (K+1,2), including the initial point. The closed form checks the computed endpoint independently. This costs O(K) time and O(K) history storage; retaining only the final point would need O(1) extra state."}</Prose>

<Payload file="saddle.py" /><Prose>Saved stdout:</Prose><Payload file="saddle.py.stdout.txt" output />

<Prose>{"Near a general smooth stationary point, the linearized update multiplies an eigenvector component approximately by 1−ηλ. Negative λ causes growth; a positive λ contracts only when |1−ηλ|<1. Nonlinear terms change the picture farther away. Our exact quadratic is unbounded below along y, so it explains local escape but has no global minimum to attain. "}<a href={"/learn/topic/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient#2-minimize-a-local-model-then-check-the-step"}>{"Second-Order Methods, section 2"}</a>{" instead constructs curvature-based proposals and checks their actual accepted steps. That method question is different from classifying the surface itself."}</Prose>

<H2>{"4. Ask where the noise points"}</H2>

<Prose>{"A run started on the stable line may have no unstable component to amplify. A sampled gradient can add one, depending on its direction. Build that sampled gradient explicitly."}</Prose>

<Drawing id="N20" />

<Prose>{"Take two equally weighted example losses. Their gradients have opposite extra arrows, so their midpoint is the full-data gradient. With unit direction v, amplitude a≥0 and sign s∈{−1,+1}, define"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\ell_s(x,y)=x^2-y^2+s\\,a\\,v^\\top(x,y),\\qquad\nF=\\tfrac12(\\ell_{-1}+\\ell_{+1})=x^2-y^2."}</MathBlock></div>

<Prose>{"Selecting either example uniformly gives sample gradient ∇F+sav. Its mean is ∇F: the signs cancel in expectation. At (.6,0), amplitude .2 and y-only direction v=(0,1), the two sample gradients are (1.2,.2) and (1.2,−.2). At rate .1 they propose (.48,−.02) and (.48,.02). Their average update stays on y=0, while either realized sampled update leaves it."}</Prose>

<Prose>{"If v=(1,0), the same sample noise only changes x. From exact initial y=0, every realized y update stays zero. "}<strong>{"Unbiased"}</strong>{" describes the mean of the sample gradient under the stated sampling rule; it says neither that each realization equals the mean nor that every parameter direction receives noise."}</Prose>

<Drawing id="N21" />

<Prose>{"The live path uses fixed rate η=.1 and initial point (.6,0). Choose x-only or y-only noise, amplitude 0–.3 and a displayed horizon 0–24. Default y-only noise, amplitude .2 and horizon 8 match the programme's eight-update parameters. The same disclosed sign sequence is retained across changes and Reset, so a changed path has a known cause. The full-gradient reference uses the same initial point and rate. Reset restores direction, amplitude and horizon without drawing a new random sequence."}</Prose>

<Prose>{"The sequence is (+,−,−,+,+,+,−,+,−,−,+,−,+,+,−,−,−,+,+,−,+,−,−,+). It is one possible realization, not an estimate of an escape probability. Changing direction isolates where the noise enters; changing amplitude isolates its magnitude."}</Prose>

<H3>{"Deeper: why mean zero can accompany growing spread"}</H3>

<Prose>{"To discuss the whole distribution, now consider independent uniform signs rather than just the one displayed sequence. For y-only noise and y₀=0, set r=1+2η. The recurrence yₖ₊₁=ryₖ−ηasₖ repeatedly amplifies older perturbations."}</Prose>

<Drawing id="N22" />

<Prose>{"After k updates, the earliest sign has weight rᵏ⁻¹ and the newest has weight 1. Iterating the recurrence gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"y_k=-\\eta a\\sum_{i=0}^{k-1}r^{k-1-i}s_i."}</MathBlock></div>

<Prose>{"Each sign has mean zero and square one. For i≠j, independence gives E[sᵢsⱼ]=E[sᵢ]E[sⱼ]=0, so the paired cross terms in the square cancel in expectation. The remaining diagonal terms are the squares of the individual weights:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\mathbb E[y_k]=0,\\qquad\n\\mathbb E[y_k^2]=\\eta^2a^2\\sum_{j=0}^{k-1}r^{2j}."}</MathBlock></div>

<Prose>{"The mean signed position remains zero while its second moment grows. This conclusion belongs to the distribution over signs; it is not a path the individual realizations are expected to follow."}</Prose>

<Drawing id="N23" />

<Prose>{"At the reference k=8, there are 2⁸=256 sign sequences, each with probability 1/256. Their complete enumeration gives E[y₈²]≈.015899 for η=.1 and a=.2 under y-only noise, while x-only noise keeps y exactly zero. The distribution and its weighted-square contributions in this panel are explicitly the "}<strong>{"eight-step reference"}</strong>{", fixed at η=.1 and a=.2. If the live path is moved to k=24 or its amplitude is changed, its current-moment readout uses the selected k and amplitude in the formula; the fixed 256-outcome panel retains its stated eight-step reference parameters. One selected path, a current-horizon expectation and an eight-step reference answer different questions."}</Prose>

<Prose>{"Save as "}<code>{"noise.py"}</code>{", then run "}<code>{"python noise.py"}</code>{". The explicit sampled update accepts a declared sign sequence, and "}<code>{"itertools.product"}</code>{" supplies every sequence of eight signs. "}<code>{"endpoints"}</code>{" has shape (256,2); its y column supplies the mean squared coordinate. The independent geometric-weight sum checks that finite distribution exactly up to floating-point arithmetic. This O(k2ᵏ) reference calculation is appropriate for eight steps; the analytic moment is the efficient route for a larger horizon. The programme stores O(k) history for one run and O(2ᵏ) endpoints, rather than a Monte Carlo sample with uncertainty bars."}</Prose>

<Payload file="noise.py" /><Prose>Saved stdout:</Prose><Payload file="noise.py.stdout.txt" output />

<Prose>{"The weighting sentence in the output states the enumerated distribution's probability contract. Correlated signs or a different direction would change the calculation. Batch size and data order affect sampling structure; they are not interchangeable with an arbitrary isotropic perturbation."}</Prose>

<H3>{"A different escape protocol with stated assumptions"}</H3>

<Drawing id="N24" />

<Prose>{"The small ball represents possible perturbations of an iterate. Its exact stable line and its "}<strong>{"finite-horizon slow/stuck band"}</strong>{" are distinct: nearby points inside the band can escape later, even though they have not crossed the displayed boundary by the chosen finite time. The paths are schematic explanations of that mechanism. No measured success probability is encoded by the drawing's areas or number of paths."}</Prose>

<Prose>{""}<a href={"https://proceedings.mlr.press/v70/jin17a.html"}>{"Jin and colleagues' perturbed-gradient method"}</a>{" inserts specified iterate perturbations under prescribed conditions. Its theorem assumes a Lipschitz gradient, a Lipschitz Hessian and a finite initial objective gap, with parameters and probability chosen as the theorem requires. It reaches an approximate second-order stationary point with high probability: a small gradient together with no substantially negative Hessian eigenvalue at the prescribed accuracy. Stronger structural assumptions relate such points to nearby local minima. Our per-example sample-gradient experiment is a different protocol, and its unbounded quadratic lacks the finite-gap premise. The useful connection is the negative-curvature direction and amplification mechanism, with each guarantee attached to its own assumptions."}</Prose>

<H2>{"5. Separate parameters from predictions"}</H2>

<Prose>{"So far, a point's coordinates directly named the setting being optimized. A model introduces another operation between a parameter and its objective: the parameters first produce predictions. Different parameter points can produce exactly the same function."}</Prose>

<Drawing id="N25" />

<Prose>{"Let a model send an input u through two scalar multiplications: first a, then b. Its prediction is b(au)=abu. Here u is the model's input; a and b are adjustable parameters. On the two training examples (u,target)=(−1,−1) and (1,1), the average half-squared prediction error is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"F(a,b)=\\frac12(ab-1)^2."}</MathBlock></div>

<Prose>{"Trace (a,b)=(2,1/2), u=3: the intermediate value is 6, the prediction is 3 and the product ab is 1. The same input through (1,1) also produces 3. Cyan names a, violet names b and amber names the represented prediction in this family of drawings; colour follows those quantities through the wiring and parameter plane."}</Prose>

<Drawing id="N26" />

<Prose>{"Every point with ab=1 has zero loss and predicts u for "}<strong>{"every input"}</strong>{", not just the two training inputs. On the positive branch write a=s, b=1/s with s>0. The points (1,1), (2,1/2) and (4,1/4) are distinct representations of the same predictor. The negative branch also has product one. A continuous curve of tied minima gives a direction in which the represented function can stay constant, even though the parameter coordinates change."}</Prose>

<Prose>{"To see that direction mathematically, differentiate the product before the squared error. With r=ab−1,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\nabla F=r\\begin{bmatrix}b\\\\a\\end{bmatrix},\\qquad\nH=\\begin{bmatrix}b^2&2ab-1\\\\2ab-1&a^2\\end{bmatrix}."}</MathBlock></div>

<Prose>{"For example, differentiating rb with respect to b gives a b+r=2ab−1. At the origin the gradient is zero and H has off-diagonal entries −1, giving eigenvalues −1 and 1: a saddle. At a zero-loss point ab=1, the residual terms disappear."}</Prose>

<Drawing id="N27" />

<Prose>{"There the Hessian is the outer product (b,a)(b,a)ᵀ. Define R=√(a²+b²). The unit normal n=(b,a)/R points across the product-one curve; the unit tangent v=(a,−b)/R points along it to first order. They are perpendicular. Multiplication by H gives Hn=R²n and Hv=0, so the eigenvalues are 0 and R². At s=1 the positive eigenvalue is 2; at s=4 it is 16+1/16=16.0625. This difference measures curvature in the specified Euclidean parameter coordinates. The prediction is unchanged."}</Prose>

<Drawing id="N28" />

<Prose>{"A finite straight tangent step does not usually stay on a curved level set. For ab=1, a displacement of Euclidean length ε in the unit tangent direction gives product 1−ε²/R², and therefore loss ε⁴/(2R⁴). The Hessian's tangent prediction is zero because the leading change is fourth order. A normal displacement gives product 1+εR+ε²/R² and a second-order leading loss R²ε²/2. At ε=.1, scale 1 has normal loss approximately .01071961 and tangent loss .00001250. At scale 4 the corresponding losses are .08056221 and .00000019. Compare actual displacement lengths before interpreting those numbers as sharpness."}</Prose>

<Drawing id="N29" />

<Prose>{"Change the scale and choose a normal step, a straight tangent step or a path that follows the symmetry exactly. For either straight step the control ε is "}<strong>{"Euclidean distance"}</strong>{", because its direction vector has length one. For the curved choice the path is (s exp(t),exp(−t)/s), and the control is explicitly labelled "}<strong>{"path parameter t"}</strong>{". Its actual Euclidean distance from (s,1/s) is displayed separately. Equal numerical values of t and ε do not mean equal displacement lengths. The curve preserves ab=1 and zero loss for every shown t. Reset restores scale 1, the normal direction and ε=.1; the scale-1 reference stays visible during comparisons."}</Prose>

<Prose>{"Save the following as "}<code>{"factors.py"}</code>{" and run "}<code>{"python factors.py"}</code>{" using the NumPy environment from section 1. Each factor pair is a length-two vector; the symmetric Hessian is 2×2. "}<code>{"numpy.linalg.eigvalsh"}</code>{" returns real eigenvalues for that symmetric matrix; the later autograd comparison uses "}<code>{"eigh"}</code>{" when eigenvectors are also needed. The explicit gradient and Hessian above supply the from-scratch route; the "}<a href={"/learn/topic/eigenvalues-eigenvectors"}>{"Jacobi rotation implementation in Eigenvalues & Eigenvectors"}</a>{" explains how a general symmetric eigensolver can be built. This fixed two-parameter calculation has constant storage and arithmetic apart from the library call; a dense d-parameter Hessian instead needs O(d²) storage."}</Prose>

<Payload file="factors.py" /><Prose>Saved stdout:</Prose><Payload file="factors.py.stdout.txt" output />

<Prose>{"The first comparison holds the function fixed while changing parameter scale. The finite-step comparison holds Euclidean distance fixed while changing direction and scale. Neither comparison measures prediction quality on new data. At a singular stationary point the exact function, or higher-order terms, still decides what the zero-curvature directions do."}</Prose>

<H3>{"The same issue inside a small neural network"}</H3>

<Prose>{"A two-layer linear factorization is deliberately small. Rectified linear units introduce another pair of exact symmetries, as well as a place where careless transformations fail. Define ReLU(z)=max(0,z): negative inputs give zero and positive inputs pass through."}</Prose>

<Drawing id="N30" />

<Prose>{"Our network has two hidden units, h₁(u)=ReLU(u−1) and h₂(u)=ReLU(−u+2), followed by the output 2h₁−h₂. At u=1.5, both preactivations are .5. Their outgoing contributions are 1 and −.5, summing to .5. The unit is the whole incoming-weight, bias, activation and outgoing-weight bundle. Cyan circles identify unit 1 and violet squares identify unit 2 in this network; filled versus open activation marks show whether a unit is active."}</Prose>

<Drawing id="N31" />

<Prose>{"Swap the two complete bundles. The intermediate order changes, but the sum remains the same: the old unit 2 still has its own incoming weight, bias and outgoing weight. A permutation of positions is a symmetry because addition is independent of that order. Swapping only one array generally changes which contribution is computed."}</Prose>

<Drawing id="N32" />

<Prose>{"Positive scaling uses the identity ReLU(cz)=c ReLU(z) for c>0. Multiply a unit's incoming weight "}<strong>{"and bias"}</strong>{" by c, then divide its outgoing weight by c. Its complete contribution stays the same. For unit 1 with c=2, the transformed contribution is ReLU(2u−2), exactly equal to 2ReLU(u−1). Forgetting the bias would give ReLU(2u−1), which is already .5 at u=.75 while the original is zero. A negative scale is not covered: ReLU(−1)=0 differs from −ReLU(1)=−1."}</Prose>

<Drawing id="N33" />

<Prose>{"Move the input and compare the original, permuted, positively scaled and missing-bias networks. The scale c applies to unit 1 and 1/c to unit 2; both are strictly positive. The reference always retains the original network and output. Under a permutation, identity colour travels with the entire unit instead of staying in the old screen position. The scale control is disabled, with an explanation, when the selected transformation does not use it. Reset restores input 1.5, original transformation and c=2."}</Prose>

<Prose>{"Save as "}<code>{"relu.py"}</code>{", then run "}<code>{"python relu.py"}</code>{" in the same NumPy environment. The input vector has six entries. Broadcasting "}<code>{"inputs[:,None]"}</code>{" against the two incoming weights constructs the 6×2 preactivation matrix. Adding the two biases and applying "}<code>{"maximum"}</code>{" gives six rows of hidden activations; multiplying by the two outgoing weights gives six predictions. The code's fixed scales (3,.5) deliberately provide another valid positive transformation. For n inputs and m units, this direct route takes O(nm) operations and stores its n×m intermediate matrix."}</Prose>

<Payload file="relu.py" /><Prose>Saved stdout:</Prose><Payload file="relu.py.stdout.txt" output />

<Prose>{"The approximately 5.55×10⁻¹⁷ positive-scaling difference is floating-point roundoff; the identity proves equality in exact arithmetic for every input. The missing-bias route changes the represented function, here producing a maximum discrepancy of 2 across the six inputs. Checking six inputs detects this failure; only the identity establishes the successful transformation for all inputs. Other activation functions require their own symmetry analysis."}</Prose>

<H3>{"What changes when the objective includes a parameter penalty?"}</H3>

<Drawing id="N34" />

<Prose>{"Equal predictions imply equal "}<strong>{"prediction-based data loss"}</strong>{" on fixed inputs and targets. A penalty on the parameters can distinguish them. On ab=1, adding λ(a²+b²) costs 2λ at (1,1) and 4.25λ at (2,.5). Since (|a|−|b|)²≥0, a²+b²≥2|ab|=2 on this curve, so equal-magnitude factors minimize the penalty among the zero-data-loss representations."}</Prose>

<Prose>{"That restricted comparison does not solve the full penalized problem: the best total objective may accept some prediction error to reduce the penalty. "}<a href={"/learn/topic/regularization-l1-l2-elastic-net-dropout"}>{"Regularization's factor example"}</a>{" derives that full tradeoff by optimizing the product. Always state which objective and which allowed candidates your comparison holds fixed."}</Prose>

<H3>{"Deeper: changing coordinates changes curvature magnitudes"}</H3>

<Drawing id="N35" />

<Prose>{"Let θ=ψ(φ) be a smooth locally invertible reparameterization, with Jacobian J. At a stationary point, the chain rule gives Hφ=JᵀHθJ; the extra term involving the gradient of F vanishes. This is a "}<strong>{"congruence"}</strong>{", not generally a similarity transformation. It preserves the counts of positive, negative and zero curvature directions for invertible J, but can change the eigenvalues' magnitudes."}</Prose>

<Prose>{"For a concrete factor example use θ=(a,b)=(4φ₁,φ₂/4). At φ=(1,1), θ=(4,1/4), and J=diag(4,1/4). The θ-Hessian is [[1/16,1],[1,16]], with eigenvalues 0 and 16.0625. Multiplying JᵀHθJ produces [[1,1],[1,1]], with eigenvalues 0 and 2. The zero direction remains; the unit step in φ describes a different physical displacement Jδφ in θ. An unqualified comparison of raw Hessian magnitudes misses that coordinate choice."}</Prose>

<Prose>{"Away from a stationary point, the full chain rule also includes Σᵢ(∂F/∂θᵢ)∂²ψᵢ/∂φ². For example F(θ)=θ²/2 and θ=exp(φ) give F(exp(φ))=exp(2φ)/2. At φ=0 the true second derivative is 2; JᵀHθJ alone is 1 and the omitted gradient term supplies the other 1. The stationary premise matters. "}<a href={"https://proceedings.mlr.press/v70/dinh17b.html"}>{"Dinh and colleagues"}</a>{" use neural-network reparameterizations to examine which sharpness claims survive such transformations; this worked calculation establishes the local coordinate mechanism without equating every proposed flatness measure."}</Prose>

<H3>{"The same factor ambiguity on measured data"}</H3>

<Prose>{"The previous examples used deliberately constructed targets. A real observed dataset lets us separate a symmetry of representation from the residual error that the model cannot fit away."}</Prose>

<Drawing id="N36" />

<Prose>{"Use the corrected 150-row Iris measurements to describe petal length from sepal length, both in centimetres. Each plotted point is one observed flower. Species markers preserve row correspondence—cyan circles, violet squares and amber triangles—but species is neither the regressor nor the target. A single common line is fitted to the pooled observations. This is a descriptive calculation on the identified sample, with no held-out evaluation or claim that the rows form a randomized sample."}</Prose>

<Drawing id="N37" />

<Prose>{"The sample means are x̄=5.843333333 cm and ȳ=3.758 cm. Subtract them to get Xᵢ=xᵢ−x̄ and Yᵢ=yᵢ−ȳ. A slope p predicts ȳ+pXᵢ on the original scale. The mean squared centred input is M=(1/n)ΣXᵢ²=.681122222… cm². The least-squares normal equation ΣXᵢ(Yᵢ−βXᵢ)=0 gives β=ΣXᵢYᵢ/ΣXᵢ²=569619/306505≈1.858432978 petal-cm/sepal-cm. The first row, for instance, has sepal length 5.1 and petal length 1.4; its centred coordinates are −.743333333 and −2.358 cm. The same row keeps its marker through centering and the fitted-residual view."}</Prose>

<Prose>{"Write the fitted residual rᵢ=Yᵢ−βXᵢ. For another product p=ab, the error is pXᵢ−Yᵢ=(p−β)Xᵢ−rᵢ. Squaring and averaging cancels the cross term because ΣXᵢrᵢ=0:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"F(a,b)=\\frac1{2n}\\sum_i(abX_i-Y_i)^2\n=F_*+\\frac M2(ab-\\beta)^2,\n\\qquad F_*=\\frac1{2n}\\sum_i r_i^2."}</MathBlock></div>

<Drawing id="N38" />

<Prose>{"Here F*≈.371530517 cm² is a positive residual floor. Every factorization with ab=β has that same minimum data loss and exactly the same fitted predictions. Set a=s√β and b=√β/s. Scale 1 gives a=b≈1.363243551; scale 4 gives a≈5.452974202 and b≈.340810888. The positive Hessian eigenvalue changes from 2.53164 to 20.33223375, while the other eigenvalue stays zero. At the origin the eigenvalues are −1.26582 and 1.26582. Unlike the two-point construction, the fitted line does not reproduce every observed target; changing the factor scale cannot repair that residual."}</Prose>

<Prose>{"Download "}<a href={"/learn-code/eigenvalues-eigenvectors/iris-corrected.csv"}>{"the corrected CSV"}</a>{" into the same directory as "}<code>{"iris_factored_regression.py"}</code>{". The accompanying "}<a href={"/learn-code/eigenvalues-eigenvectors/iris-provenance.json"}>{"data provenance"}</a>{" records the source and corrections; the "}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI Iris dataset"}</a>{" supplies the attribution and CC BY 4.0 licence. Run "}<code>{"python iris_factored_regression.py iris-corrected.csv"}</code>{"; the CSV path is a required argument. The parser checks the five-column header, 150-row count, known species and measurement bounds. Those checks reject several malformed inputs but do not identify arbitrary replacement data as the published dataset: use the linked file for this recorded result. Use the NumPy environment from section 1."}</Prose>

<Prose>{"The input columns and centred vectors each have length 150. "}<code>{"Fraction"}</code>{" keeps decimal measurements and the centering sums exact; the ordinary NumPy least-squares route uses a 150×1 design and checks the same slope numerically. The code obtains the residual floor, checks the factor identity, compares all 150 predictions and diagonalizes the 2×2 Hessians. With one regressor this takes O(n) arithmetic and storage; arbitrary-precision rational operation cost additionally depends on the integers' bit lengths."}</Prose>

<Payload file="iris_factored_regression.py" /><Prose>Saved stdout:</Prose><Payload file="iris_factored_regression.py.stdout.txt" output />

<Prose>{"The two prediction-error zeros certify equality of the compared fitted prediction arrays in this calculation. They do not make the residual loss zero and do not estimate future prediction error. A different dataset, feature construction or penalty would require a new objective and its own comparison. The factor ambiguity follows from the product representation and survives this particular positive residual floor."}</Prose>

<H2>{"6. Read paths and slices carefully"}</H2>

<Prose>{"The factor model gives many equal-loss points. A picture that joins two of them by a straight line answers a question about that line. To decide whether the apparent barrier separates the solutions, we must ask what other paths are allowed."}</Prose>

<Drawing id="N39" />

<Prose>{"Join (1,1) to (2,1/2). The straight interpolation is a(t)=1+t, b(t)=1−t/2 for t between zero and one. Its product is 1+t(1−t)/2, so its loss is t²(1−t)²/8. The maximum occurs at t=1/2, where t(1−t)=1/4, giving loss 1/128=.0078125. The endpoint predictions agree, but intermediate straight-line points change the product."}</Prose>

<Prose>{"A curved route a(t)=1+t, b(t)=1/(1+t) keeps product one throughout. It joins the same endpoints with zero loss. Pink dashed lines identify the straight route and cyan solid lines the curved route in both the parameter plane and loss-versus-t plot. A selected t has a white outline on both views. Here t is a path parameter; it is not distance along either route. The straight barrier is avoidable in the full plane."}</Prose>

<Drawing id="N40" />

<Prose>{"Now join (1,1) to (−1,−1). Any continuous parameter path must take its a coordinate from positive to negative, and therefore pass through a=0. At that crossing, ab=0 and F=1/2, irrespective of the finite value of b. No continuous connection can remain below that barrier. The straight path a=b=1−2t reaches loss 1/2 at t=1/2 and never exceeds it, so it attains the smallest possible maximum loss. Attempting b=1/a across the sign change fails because it becomes unbounded at zero and does not define a continuous path through the parameter plane."}</Prose>

<Drawing id="N41" />

<Prose>{"Choose the positive-branch or opposite-branch endpoint, then move t. For positive endpoints, switch the selected route while retaining both complete reference paths. For opposite endpoints, the straight path remains available and the curved option explains why the previous construction cannot cross zero. Changing to that endpoint family deterministically selects the valid straight route. Reset restores positive endpoints, straight route and t=.5. Each route's selected point and objective value stay linked."}</Prose>

<Prose>{"Save as "}<code>{"paths.py"}</code>{" and run "}<code>{"python paths.py"}</code>{" in the NumPy environment from section 1. The retained file imports NumPy, although this particular path loop uses scalar Python arithmetic. It evaluates all three explicitly specified parameter paths at five t values, computing the product and loss at each point rather than assigning a barrier from an illustration. Evaluating m supplied path points costs O(m) operations and constant extra storage when printed in sequence; the continuous argument above is what establishes an unavoidable barrier over all continuous paths."}</Prose>

<Payload file="paths.py" /><Prose>Saved stdout:</Prose><Payload file="paths.py.stdout.txt" output />

<Prose>{"The midpoint values distinguish an avoidable 1/128 barrier from an unavoidable 1/2 crossing. Neither result establishes that arbitrary neural-network minima are connected or disconnected. Symmetries, endpoint choices and the permitted paths all matter. "}<a href={"https://arxiv.org/abs/1802.10026"}>{"Garipov and colleagues' mode-connectivity study"}</a>{" investigates learned connecting curves in particular networks; its experiments motivate asking this question, while our factor construction makes two exact answers visible."}</Prose>

<H3>{"A slice omits directions"}</H3>

<Prose>{"A path is one-dimensional. A surface plot often allows two parameter directions, which can still leave important directions unseen."}</Prose>

<Drawing id="N42" />

<Prose>{"Draw the three-dimensional "}<strong>{"parameter domain"}</strong>{" with x, y and z axes. The highlighted x–y plane is the selection z=0; its perpendicular z arrow identifies what the selection omits. This drawing is not an objective-height surface. The objective has three inputs and a fourth quantity, its scalar value, so one ordinary 3D surface cannot simultaneously show the full domain and height."}</Prose>

<Drawing id="N43" />

<Prose>{"Take F(x,y,z)=x²+y²−.1z². Restricted to z=0, its height surface is the bowl x²+y². A move of .2 along either visible axis increases F by .04. Along the omitted z axis, however, the same coordinate displacement gives F(0,0,.2)=−.004. Plot that one-dimensional restriction separately with its own objective-height axis. The full origin is a saddle despite the bowl-shaped slice. Cyan squares identify x, amber triangles y and pink diamonds z; signed height is written and drawn relative to zero, rather than replacing those axis identities."}</Prose>

<Drawing id="N44" />

<Prose>{"The embedding matrix P has columns (1,0,0)ᵀ and (0,1,0)ᵀ. It takes two slice coordinates ξ=(ξ₁,ξ₂) to the full parameter point Pξ=(ξ₁,ξ₂,0). The slice Hessian is PᵀHP=diag(2,2), whereas the full Hessian H=diag(2,2,−.2) includes the omitted negative eigenpair. This is why positive curvature in chosen directions is weaker than positive curvature in every direction. A displayed slice is useful evidence about its selected subspace, provided its construction and excluded directions are named."}</Prose>

<Prose>{"Save as "}<code>{"slice.py"}</code>{" and run "}<code>{"python slice.py"}</code>{" in the NumPy environment. P is 3×2; multiplying a 3×3 H by P gives a 3×2 matrix, then Pᵀ produces a 2×2 projected Hessian. The code compares its eigenvalues with those of the full H and evaluates the three actual displacement vectors. General dense projection for d parameters and r slice directions costs O(d²r+dr²) arithmetic and stores the required dense arrays; our d=3, r=2 calculation is deliberately transparent."}</Prose>

<Payload file="slice.py" /><Prose>Saved stdout:</Prose><Payload file="slice.py.stdout.txt" output />

<Prose>{"The missing eigenvalue is not an error in the slice computation. It is the consequence of what the slice asks. In higher dimensions, report the chosen directions, coordinate scaling and reference point; combine the picture with derivatives, additional directions or domain-specific structure before making a claim about the whole landscape."}</Prose>

<H2>{"7. Separate training fit from generalization"}</H2>

<Prose>{"Parameter symmetries preserve a function at every input. Matching a finite training set is a weaker condition. A small interpolation family separates these two claims without relying on a network benchmark."}</Prose>

<Drawing id="N45" />

<Prose>{"Define hₐ(x)=x+a(x²−1), where x is now a model input and a is its one adjustable coefficient. The training set contains only (−1,−1) and (1,1). At both inputs x²−1=0, so every a gives the same correct training prediction. Between the training points, the added term generally survives. The plot uses input horizontally and prediction vertically; it is a function plot, not a parameter-loss surface."}</Prose>

<Drawing id="N46" />

<Prose>{"The training objective is identically zero for every a, so both its first and second derivatives with respect to a are zero. At a separately declared point (x,target)=(0,0), the prediction is −a and the half-squared error is a²/2. Coefficients a=−1,0,1,2 therefore give errors .5,0,.5,2 despite identical training loss and curvature. A flat training objective alone cannot distinguish them."}</Prose>

<Drawing id="N47" />

<Prose>{"Move a and choose which complete target rule is assumed: y=x or y=x+(x²−1). Both target rules pass through the same two training dots, but at x=0 their targets are respectively 0 and −1. For the second rule the error is (1−a)²/2 and a=1 matches it; for the first it is a²/2 and a=0 matches it. Both labelled target curves remain visible as references. The target choice changes the stated evaluation question rather than revealing an unknown population law from two observations. Reset restores a=1 and target y=x."}</Prose>

<Prose>{"Save as "}<code>{"generalization.py"}</code>{" and run "}<code>{"python generalization.py"}</code>{" in the NumPy environment from section 1. For each of four coefficients, array arithmetic produces a length-two vector of training predictions, and "}<code>{"mean"}</code>{" averages its two half-squared errors. A separate length-one array gives the declared-point error under target y=x. For m coefficients and n supplied training observations, direct evaluation takes O(mn) arithmetic and O(n) array storage; this fixed example has n=2."}</Prose>

<Payload file="generalization.py" /><Prose>Saved stdout:</Prose><Payload file="generalization.py.stdout.txt" output />

<Prose>{"Changing the assumed target rule can change the preferred predictor. The “held-out” value here is exact loss on one declared point, not a universal population-error estimate or an empirical neural-network benchmark. In an application, choose the data split and metric to match the intended use and retain an appropriate final evaluation for the model-selection decisions you make. Validation uncertainty, distribution shift and the influence of the training procedure require their own evidence."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" Two parameterizations produce exactly the same prediction for every input. Can one have a different error on the same test set purely because its raw Hessian is sharper?"}</Prose>

<Prose>{""}<strong>{"Answer."}</strong>{" No, if the evaluated loss depends on those same predictions and targets. The data losses are equal point by point. A parameter regularizer could differ, but that is a different objective term. Conversely, two models that match only the training inputs may disagree elsewhere, as hₐ demonstrates."}</Prose>

<H2>{"8. Diagnose a stalled run"}</H2>

<Prose>{"The preceding examples give several reasons why one loss number is insufficient. To diagnose a run that stops moving, trace an actual prediction, its gradient and the update that reaches the stored parameters."}</Prose>

<Drawing id="N48" />

<Prose>{"Train one ReLU predictor ŷ=ReLU(wx+b) on x=1 with target 1 and half-squared loss. At w=0,b=−1, its preactivation is −1, its output is zero and its residual is −1. The derivative of ReLU is zero at that negative input. Multiplying the residual by this derivative blocks the signal to both w and b, leaving zero gradients despite positive loss 1/2. Increasing the learning rate still multiplies the same zero gradient."}</Prose>

<Drawing id="N49" />

<Prose>{"In the whole open half-plane w+b<0, the loss is constant at 1/2. Every point there is a non-strict local minimum "}<strong>{"and"}</strong>{" local maximum under the neighborhood definitions: a small enough neighborhood stays within the same constant region. Better points exist elsewhere, so it is a suboptimal plateau. It is not the mixed-curvature saddle examined earlier. At w+b=0 the objective has a kink. Moving b slightly negative leaves the loss constant; moving it positive gives (b−1)²/2 at w=0. The left derivative at zero is 0 and the right derivative is −1, so no classical derivative exists there."}</Prose>

<Drawing id="N50" />

<Prose>{"Compare the inactive initialization (w,b)=(0,−1) with the active initialization (0,.5). In the latter, the prediction is .5, the residual −.5 and the gradient (−.5,−.5). One gradient step with η=.1 adds .05 to each parameter, giving (.05,.55), preactivation .6 and loss .08 instead of .125. The output, preactivation, gradient and applied displacement stay linked as the step control moves. Change the rate within its displayed range to see why it affects an active signal but cannot move the exact-zero inactive update. The other initialization stays visible as a reference. Reset restores inactive start, step 10 and η=.1."}</Prose>

<Prose>{"Save as "}<code>{"dead.py"}</code>{" and run "}<code>{"python dead.py"}</code>{" in the NumPy environment. Each parameter and gradient vector has two entries. The active indicator gates the residual before it is multiplied by the input and bias derivatives; "}<code>{"point -= rate*gradient"}</code>{" applies the resulting update inside "}<code>{"train_unit"}</code>{". The printed states are k=0 through k=3, so the initial state is included rather than counted as an update. Computing k steps costs O(k) arithmetic and O(k) stored trace rows for this one-example, two-parameter model."}</Prose>

<Payload file="dead.py" /><Prose>Saved stdout:</Prose><Payload file="dead.py.stdout.txt" output />

<Prose>{"The active gradient norms decrease as its prediction approaches the target; the inactive run keeps loss .5, zero gradient and inactive indicator. This controlled initialization change diagnoses the toy mechanism. It does not establish an initialization policy for every architecture or guarantee global optimization."}</Prose>

<H3>{"Check analytic derivatives with ordinary autograd"}</H3>

<Drawing id="N51" />

<Prose>{"For the smooth factor model, automatic differentiation should agree with the displayed analytic gradient and Hessian. At (0,0), it returns zero gradient and eigenvalues −1,1; at (1,1), zero gradient and eigenvalues 0,2. At (4,.25), the positive eigenvalue is 16.0625. At (1,.5), the Hessian has positive eigenvalues .25 and 1, but the gradient is (−.25,−.5): the point is not stationary and is not thereby a local minimum. Check stationarity before using a stationary-point classification."}</Prose>

<Prose>{"At the ReLU kink, a library must choose a backward rule. The supplied PyTorch route chooses derivative zero there. The adjacent left/right slope calculation still gives 0 and approximately −1, respectively. A software-selected zero does not make the mathematical function differentiable or turn its value into a classical stationary-point certificate."}</Prose>

<Prose>{"The recorded environment uses Python 3.12.14, NumPy 2.3.5 and CPU PyTorch 2.14.0+cpu. In the same environment as section 1, install the CPU package with "}<code>{"python -m pip install \"torch==2.14.0+cpu\" --index-url https://download.pytorch.org/whl/cpu"}</code>{". Save as "}<code>{"landscape_autograd.py"}</code>{", then run "}<code>{"python landscape_autograd.py"}</code>{". No model is trained and no dataset is downloaded by this example."}</Prose>

<Prose>{""}<code>{"theta"}</code>{" is a float64 tensor of length two. "}<code>{"jacobian"}</code>{" differentiates the scalar loss into a length-two gradient; "}<code>{"hessian"}</code>{" returns a 2×2 matrix. "}<code>{"analytic"}</code>{" independently calculates the same arrays, and "}<code>{"eigh"}</code>{" supplies eigenvectors whose original-coordinate residual ‖HV−VΛ‖ is checked. This explicitly formed Hessian is appropriate for this tiny example. Dense general Hessian storage is O(d²), and constructing it requires derivative work that depends on the function and differentiation strategy; this is not a large-network Hessian recipe. "}<a href={"/learn/topic/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient"}>{"Second-Order Methods"}</a>{" develops matrix-free products and practical curvature approximations."}</Prose>

<Payload file="landscape_autograd.py" /><Prose>Saved stdout:</Prose><Payload file="landscape_autograd.py.stdout.txt" output />

<Prose>{"Use analytic identities or meaningful directional checks to interpret a derivative result. A library's successful return reports its calculation under its defined rules; it does not by itself establish smoothness, global optimality or the appropriateness of a curvature approximation."}</Prose>

<H3>{"Follow the update all the way to the parameter"}</H3>

<Drawing id="N52" />

<Prose>{"Suppose the recorded parameter is θ=1, its gradient .5 and its learning rate .1. Plain gradient descent proposes −.05. If the update is skipped, the actual stored parameter remains 1 and the applied displacement is zero. That is different evidence from the inactive unit's zero gradient. This is an explicit constructed event record, not a floating-point benchmark. Logging the rate, proposed displacement, update counter and measured parameter difference distinguishes a missing application from a mathematical stationary point."}</Prose>

<NeuralTable caption={"Follow the update all the way to the parameter"} headers={[<>{"Observed evidence"}</>, <>{"Possible mechanism"}</>, <>{"A discriminating next check"}</>]} rows={[[<>{"Flat loss, tiny full gradient, active computation"}</>, <>{"Local minimum, saddle, higher-order flatness, or convergence"}</>, <>{"Inspect directional changes/curvature and independent starts; compare attainable objectives when possible"}</>], [<>{"Flat loss, inactive units, zero gradients"}</>, <>{"No gradient signal through those units"}</>, <>{"Inspect preactivations on representative examples and a controlled initialization change"}</>], [<>{"Flat loss, meaningful gradient, tiny actual parameter displacement"}</>, <>{"Small rate, rounding, update scaling, or update not applied"}</>, <>{"Log proposed versus applied displacement, update counters and parameter change"}</>], [<>{"Sudden loss or gradient spikes"}</>, <>{"Large step, changed data, nonfinite arithmetic, or another pipeline issue"}</>, <>{"Reproduce the same batch and inspect finite values before changing several settings"}</>], [<>{"Training loss improves; validation deteriorates"}</>, <>{"Objective fit differs from the evaluation goal"}</>, <>{"Check split/metric, regularization, stopping and selection protocol"}</>]]} />

<Prose>{"Record the objective definition, parameter scaling, initialization, data order, optimizer state, learning-rate clock, loss, gradient norm, actual displacement, activation statistics, parameter norms and held-out metrics as needed. Compare one controlled change at a time. Momentum, step schedules and data order change trajectories; none converts a local observation into an unconditional global or generalization certificate. "}<a href={"/learn/topic/learning-rate-schedules-cosine-warmup-onecyclelr"}>{"Learning Rate Schedules"}</a>{" traces consumed rates and update clocks when the proposed and applied steps need that additional context."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"9. Practise and connect"}</H2>

<Prose>{"Attempt each task before opening its hint. Use an equation, an explicit point or a reproducible calculation as evidence; a label such as “nonconvex” is not a complete explanation. The hints and worked solutions are available independently of the live investigations."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Compare values after the tilt reverses"}</H3>

<Prose>{"Set δ=−0.15 and start at −0.8. Predict both minimum locations and costs from the original example without solving a new cubic. Identify what a gradient-based stopping rule can and cannot certify."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Replace x by −x and δ by −δ in W. Reflect the stationary roots and keep the corresponding costs."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"W₋₀.₁₅(x)=W₀.₁₅(−x). The minima are now at approximately −0.914297 with value 0.143874, and 1.067923 with value −0.155256. The right minimum is global by the same exhaustive-root and coercivity argument. A run started at −0.8 with η=0.12 approaches the worse left minimum. Accept a numerically verified endpoint together with this comparison; a small gradient alone is insufficient."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Classify a singular Hessian by the actual function"}</H3>

<Prose>{"Classify the origin for A=x²+y⁴, B=x²−y⁴ and C=x². State which are strict and explain why their identical Hessians cannot decide the answer."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Inspect the line x=0, then use the sign of every term when it permits a global bound."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"For A=x²+y⁴, every term is nonnegative and their sum vanishes only at the origin: strict global minimum. For B=x²−y⁴, the x-axis increases and the y-axis decreases arbitrarily close to zero: saddle. For C=x², every y with x=0 ties: non-strict global minimum. All three have Hessian diag(2,0) at the origin. This is an explicit counterexample to sufficiency of a singular positive-semidefinite Hessian."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Change the noise direction and predict two updates"}</H3>

<Prose>{"Start at the origin, use η=0.1, a=0.2 and signs (+1,−1). Calculate two updates for y-only noise and then x-only noise. Explain why “the sample gradient is unbiased” does not mean it vanishes on each step."}</Prose>

<details><summary>Hint</summary>

<Prose>{"For y noise, use yₖ₊₁=1.2yₖ−0.02sₖ. For x-only noise, write the y recurrence separately."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"With initial (0,0), η=0.1, a=0.2 and v=(0,1), signs (+1,−1) give y₁=−0.02 and y₂=1.2(−0.02)+0.02=−0.004; x stays zero. If v=(1,0), y stays exactly zero, while x₁=−0.02 and x₂=0.8(−0.02)+0.02=0.004. Neither finite trace proves global convergence. A zero mean over sign sequences does not imply a zero coordinate on each sequence."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Repair a proposed symmetry"}</H3>

<Prose>{"A unit contributes 5ReLU(2x−3). Someone multiplies its incoming weight by 4 and divides its outgoing weight by 4. Supply the missing change, then produce an input that exposes the incomplete transformation. Explain why c=−1 is not an allowed general replacement."}</Prose>

<details><summary>Hint</summary>

<Prose>{"A unit is an affine expression before activation, so scale the whole expression. Use a negative preactivation to test a negative scale."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The correct positive rescaling is incoming weight 8, bias −12, outgoing weight 5/4: (5/4)ReLU(8x−12)=5ReLU(2x−3). At x=1 the original contributes zero, but scaling only the weight to 8 while leaving bias −3 yields (5/4)ReLU(5)=6.25. For c=−1, ReLU(−z) generally differs from −ReLU(z); take z=1. A valid claim must include c>0 and the bias transformation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. A new path with an avoidable barrier"}</H3>

<Prose>{"Join (1,1) and (3,1/3) in the factor model. Derive the largest loss on their straight interpolation and exhibit a continuous zero-loss alternative. Explain which part fails for a negative-branch endpoint."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use endpoints (1,1) and (3,1/3). Along the line a=1+2t and b=1−2t/3; compare their product with 1."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The straight product is 1+(4/3)t(1−t), so loss is (8/9)t²(1−t)². Since t(1−t)≤¼ on [0,1], the maximum is 1/18 at t=½. The curved path (1+2t,1/(1+2t)) keeps zero loss. Thus the visible straight-line barrier is avoidable. If the endpoint instead lies on the negative branch, continuity forces an a=0 crossing and loss at least ½; the same curved construction would become singular and is not a connecting path."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Separate a curvature claim from a prediction claim"}</H3>

<Prose>{"Compare factor scales s=1 and s=2, then compare h₂ and h₀ on the two-point training set. Give exact curvature or loss values that distinguish “same function” from “same fit on the observed data.”"}</Prose>

<details><summary>Hint</summary>

<Prose>{"At s=2 the curvature is 4+1/4. For the interpolation family, plug x=0 into hₐ."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The factor pairs (1,1) and (2,1/2) have nonzero Hessian eigenvalues 2 and 4.25 but identical predictions abx=x for every input. Their prediction-based test losses cannot differ on the same test data. In contrast, h₂ and h₀ both have identically zero training loss and curvature on the two training points, while at the declared target (0,0) their half-squared errors are 2 and 0. State which equality is only on training inputs and which holds everywhere; neither raw curvature comparison establishes a universal generalization guarantee."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Diagnose without guessing the cause"}</H3>

<Prose>{"One run has positive loss, zero gradients and no active units. Another has nonzero gradients but no measured parameter change. Propose a discriminating check for each, and explain why their equally flat loss plots do not justify the same diagnosis."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The full gradient and the actual applied update answer different questions. Test whether changing only the learning rate can move a zero gradient."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"For the inactive single-unit example, positive loss, zero gradient and zero active indicator identify a flat inactive region on this dataset. A learning-rate change alone cannot move the deterministic update. A controlled change yielding positive preactivation supplies a gradient in this toy. For a run with nonzero gradient but zero applied displacement, inspect the rate, precision, optimizer state and whether an update was executed before concluding it is a stationary point. A complete answer records the fixed data/objective and a measurement that distinguishes the alternatives; it does not call either case a global optimum."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Distinguish an infimum from an attained minimum"}</H3>

<Prose>{"For F(x)=exp(−x) on the whole real line, prove that the infimum is zero but no global minimizer exists. Given any tolerance ε>0, find a finite threshold beyond which F(x)<ε and |F′(x)|<ε. Explain what a small-gradient stopping report would establish."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Every exponential value is positive. Solve exp(−x)<ε by taking logarithms, and compare the value at x with the value at x+1."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"For every finite x, F(x)>0, so zero is a lower bound that is never attained. If x>log(1/ε), then exp(−x)<ε and |F′(x)|=exp(−x)<ε. Thus arbitrarily small positive values exist, proving inf F=0. Any finite proposed minimizer can be improved: F(x+1)=F(x)/e<F(x). A stopping report may establish that a numerical gradient tolerance was met at its finite iterate, provided the calculation is reliable. It does not turn that iterate into an attained global minimum. A complete answer needs both the lower-bound argument and the arbitrarily-small-value construction, not just the limiting notation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Separate the residual floor from factor coordinates"}</H3>

<Prose>{"For the centred Iris regression, let M=(1/n)ΣXᵢ²=.681122222… and β=569619/306505. The fitted residuals are rᵢ=Yᵢ−βXᵢ and satisfy ΣXᵢrᵢ=0. Derive the identity F(a,b)=F*+M(ab−β)²/2. Explain what remains unchanged between a=b=√β and a=4√β,b=√β/4, and why a positive fitted residual cannot be removed by that scale change."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the new prediction error as (ab−β)Xᵢ−rᵢ. Keep the cross term when squaring before using the normal equation."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The average half-square expands into (ab−β)²ΣXᵢ²/(2n) − (ab−β)ΣXᵢrᵢ/n + Σrᵢ²/(2n). The middle term is zero by the given orthogonality; the first is M(ab−β)²/2 and the last is F*. Both factor pairs have product β, so all 150 predictions, every residual and F*≈.371530517 cm² remain unchanged. The parameter Hessian at those points is M(b,a)(b,a)ᵀ. Its positive eigenvalue changes from 2.53164 to 20.33223375, while the prediction remains the same common fitted line. The residual floor concerns how well a line describes the observed targets; selecting another representation of that line cannot reduce it. A complete solution identifies the cancelled cross term and distinguishes the coordinate-dependent curvature from the fixed prediction error. It makes no claim about future observations."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Explain a zero backward derivative at a kink"}</H3>

<Prose>{"Fix w=0 in the one-unit loss L(b)=(ReLU(b)−1)²/2. Compute the left and right derivatives at b=0. Compare a library's returned zero gradient there with the zero gradient at b=−1. State why those two zero outputs have different mathematical interpretations."}</Prose>

<details><summary>Hint</summary>

<Prose>{"For b<0, the loss is the constant 1/2; for b>0 it is (b−1)²/2. Use the two one-sided difference quotients at zero."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"For h>0, [L(0)−L(−h)]/h=0. The right quotient is [L(h)−L(0)]/h=−1+h/2, which tends to −1. The unequal limits mean the classical derivative does not exist at zero. The supplied PyTorch backward rule returns zero at the kink as an elementary-operation convention; that result does not settle differentiability. At b=−1, a whole neighborhood remains inactive and the loss is classically constant there, so its classical gradient is zero. In the full (w,b) plane the inactive open region is a non-strict local minimum and maximum with a better objective elsewhere. The kink is not such an open constant neighborhood: moving b positive immediately reduces loss. A complete answer gives both exact limits and identifies which premise fails at the kink."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Implementation bridge: verify a derivative without misclassifying the point"}</H3>

<Prose>{"Implement the smooth two-factor gradient and Hessian directly from its multiplication graph. Use precisely the four finite pairs (0,0), (1,1), (4,.25) and (1,.5), in float64. Compare both arrays with the full autograd route in "}<a href={"#8-diagnose-a-stalled-run"}>{"section 8"}</a>{", and check ‖HV−VΛ‖ in the original coordinates. Then use the complete stationary-point programme in "}<a href={"#2-read-stationary-geometry"}>{"section 2"}</a>{" to explain why a singular positive-semidefinite Hessian does not finish a classification."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Differentiate the residual ab−1 first. The mixed second derivative includes both the differentiated product and the residual. Test stationarity separately from eigenvalue signs."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The gradient is ((ab−1)b,(ab−1)a) and the Hessian is [[b²,2ab−1],[2ab−1,a²]]. The already complete "}<code>{"analytic"}</code>{" function in "}<code>{"landscape_autograd.py"}</code>{" implements these formulas and compares them against both library derivative arrays with absolute and relative tolerances 10⁻¹⁴. Its original-coordinate eigenpair residual must be below 10⁻¹². The saved four rows show: an indefinite stationary origin; two singular stationary minima representing the same function; and a nonstationary point with positive Hessian. For the last point, gradient (−.25,−.5) rules out an unconstrained smooth local minimum. The existing "}<code>{"stationary.py"}</code>{" route compares x⁴+y⁴ and x⁴−y⁴, both with zero Hessian at the origin but respectively a strict minimum and a saddle. Its x² example has Hessian diag(2,0) and a non-strict minimum along a line. Practice 2 separately changes the first two functions to x²±y⁴, making their Hessians diag(2,0) too. Inspect the actual higher-order behavior instead of assigning a conclusion to a zero eigenvalue. This solution deliberately reuses those two complete programmes and their saved outputs; it adds no hidden helper or separate fourteenth programme. The fixed two-coordinate analytic route costs O(1); forming a general dense Hessian would require O(d²) storage."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"What you can now check"}</H3>

<NeuralTable caption={"What you can now check"} headers={[<>{"Question"}</>, <>{"Evidence to retain"}</>]} rows={[[<>{"Is the best observed candidate globally best?"}</>, <>{"Domain, existence or coercivity argument, complete candidate comparison when available; a small gradient alone is insufficient"}</>], [<>{"What kind of stationary point is this?"}</>, <>{"Stationarity, allowed neighborhood, curvature signs and higher-order terms for undecided directions"}</>], [<>{"Why did this run move or stop?"}</>, <>{"Actual gradient, noise direction, learning rate, optimizer state and applied displacement"}</>], [<>{"Do different parameters mean different predictors?"}</>, <>{"The complete parameter-to-prediction map, its symmetry conditions and any parameter-dependent penalty"}</>], [<>{"What does a plotted barrier or bowl establish?"}</>, <>{"Chosen path/slice, omitted directions, coordinate scaling and whether the claim is local or global"}</>], [<>{"Does the fit answer the evaluation question?"}</>, <>{"Declared training data, target rule, split and metric; distinguish identical functions from agreement only on observed inputs"}</>]]} />

<Prose>{"You are ready to move on when you can connect a surface, its derivatives and an actual update; state when local evidence is insufficient; and challenge a visualization or sharpness claim with a concrete counterexample. Next, "}<a href={"/learn/topic/constrained-multi-objective-optimization"}>{"Constrained & Multi-Objective Optimization"}</a>{" changes which moves are allowed and what it means to prefer one answer when several costs compete. Keep the distinction between geometry, feasible directions, algorithm behavior and the evaluation goal."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://algorithmsbook.com/optimization/"}>{"Kochenderfer and Wheeler, Algorithms for Optimization"}</a>{", published first edition: start with sections 1.3–1.7 for extrema and visual geometry, then 4.4–4.5 and 8.1 for curvature-aware and noisy local steps. The worked drawings help connect a point, a contour and a direction. Its global-search chapters offer a next route when a local method is insufficient; this lesson does not implement those broader algorithms."}</li><li>{""}<a href={"https://www.deeplearningbook.org/contents/optimization.html"}>{"Goodfellow, Bengio and Courville, Deep Learning, chapter 8"}</a>{": sections 8.1.3 and 8.2 discuss optimization versus the training goal, ill-conditioning, saddles, flat regions, cliffs and gradient approximations. Read the historical empirical observations with their settings; our degenerate examples explain why an indefinite Hessian is sufficient for a saddle, but not required for every saddle."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/resources/lecture-10-second-derivative-test/"}>{"MIT OCW, Denis Auroux, Lecture 10: Second Derivative Test"}</a>{" supplies an undergraduate video and "}<a href={"https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/9c2738f5bbc2c2914fd90471f7792116_3_goGnJm5sA.pdf"}>{"written transcript"}</a>{". Use the quadratic derivation and discussion of degenerate cases alongside the quartic counterexamples. This is a calculus refresher, not a survey of neural-network generalization."}</li><li>{""}<a href={"https://proceedings.mlr.press/v70/jin17a.html"}>{"Jin et al., How to Escape Saddle Points Efficiently"}</a>{", an advanced original paper: read the prescribed perturbation algorithm, assumption A1 and theorem 3 together. Its approximate-stationarity guarantee needs its stated smoothness, finite-gap and probability conditions; it is not a theorem about arbitrary sample-gradient noise."}</li><li>{""}<a href={"https://proceedings.mlr.press/v70/dinh17b.html"}>{"Dinh et al., Sharp Minima Can Generalize For Deep Nets"}</a>{", an advanced original paper: sections 2–4 connect definitions, positive scaling and Hessian-based sharpness. Follow the coordinate convention and stationarity premise. The lesson's factor example makes a specific ambiguity exact without claiming every invariant measure is uninformative."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references and reproducibility"}</H3>

<ul><li>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html"}>{"SciPy brentq"}</a>{" and "}<a href={"https://docs.scipy.org/doc/scipy/reference/optimize.minimize-bfgs.html"}>{"BFGS"}</a>{" document the different root-bracketing and local-termination contracts used here. "}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigh.html"}>{"NumPy eigh"}</a>{" explains symmetric eigenpair correspondence; "}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html"}>{"lstsq"}</a>{" explains the rank and residual outputs in the measured-data example."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.autograd.functional.hessian.html"}>{"PyTorch Hessian API"}</a>{" and "}<a href={"https://docs.pytorch.org/docs/2.14/notes/autograd.html#gradients-for-non-differentiable-functions"}>{"nondifferentiability conventions"}</a>{" explain the ordinary derivative route and what an elementary backward rule does at a kink. Compare those contracts with the analytic and one-sided calculations before interpreting a returned number."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI Iris"}</a>{" identifies the observed measurements and attribution. Use the linked corrected file and provenance above to reproduce this descriptive regression, keeping its original classification context distinct from the new pooled regression question."}</li></ul>

<Prose>{"Each complete programme and its corresponding saved stdout appears at its teaching point: "}<code>{"wells.py"}</code>{", "}<code>{"landscape_scipy.py"}</code>{", "}<code>{"stationary.py"}</code>{", "}<code>{"saddle.py"}</code>{", "}<code>{"noise.py"}</code>{", "}<code>{"factors.py"}</code>{", "}<code>{"relu.py"}</code>{", "}<code>{"iris_factored_regression.py"}</code>{", "}<code>{"paths.py"}</code>{", "}<code>{"slice.py"}</code>{", "}<code>{"generalization.py"}</code>{", "}<code>{"dead.py"}</code>{" and "}<code>{"landscape_autograd.py"}</code>{". Copy or download a source and save it under its displayed filename before running the command. The Iris route also needs the separately linked CSV. The setup commands precede the first NumPy, SciPy and PyTorch uses; later examples explicitly reuse those packages. Last-digit library output and signed zero can vary with numerical libraries, so interpret tolerances and the actual calculation rather than the typography of a rounded value."}</Prose>

<Prose>{"The well, saddle, sampling, factor, network, path, slice, interpolation and stalled-update examples are declared constructions. The Iris example computes a descriptive fit on identified observed measurements. No diagram or saved result is an empirical neural-network benchmark, a population guarantee or a proof of a global optimum without the argument stated beside it."}</Prose></section></div>;
}
