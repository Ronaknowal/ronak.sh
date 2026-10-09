// Static full projection of the accepted manuscript-r3.
import {Prose,H2,H3,CodeBlock} from '../content';
import {Math as InlineMath,MathBlock} from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import Drawing from './ConstrainedReadingDrawings.jsx';
function Payload({file,output=false}){return <section data-payload={file}><RemoteCodeBlock source={'/learn-assets/constrained-optimization/'+file} filename={file} language={output?'output':'python'}/></section>;}
export default function ConstrainedReadingLesson(){return <div className="lesson-pilot lesson-flow constrained-reading"><H2>{"Start with an allowed decision"}</H2>

<Prose opening="summary">{"The model with the smallest error takes 70 milliseconds per request. Your service permits 25. That model's low error has not solved the decision: it is outside the allowed set. Among the models that fit, one may be faster while another is more accurate. We will first learn to keep a decision feasible, then make its trade-off explicit."}</Prose>

<Prose opening="prerequisites">{"You need vectors, dot products and gradients from "}<a href={"/learn/topic/multivariate-calculus-gradients#4-choose-a-direction-and-measure-its-rate"}>{"Multivariate Calculus"}</a>{", convex sets and supporting inequalities from "}<a href={"/learn/topic/convex-optimization#4-certify-a-constrained-solution"}>{"Convex Optimization"}</a>{", and the distinction between a local condition and a global answer from "}<a href={"/learn/topic/non-convex-optimization-landscape#2-read-stationary-geometry"}>{"Non-Convex Optimization"}</a>{". We recap projection, introduce the two copies used in splitting, and define vector comparisons here. The shared-price method in "}<a href={"/learn/topic/convex-duality-lagrangian-methods-kkt-conditions#7-coordinate-local-decisions-with-a-shared-price"}>{"Duality"}</a>{" is useful context; the agreement updates below are a different algorithm."}</Prose>

<Prose opening="route">{"For a first pass, follow the two-coordinate allocation through projection, a feasible gradient update, and one splitting iteration. Then follow the deployment catalogue through filtering, nondominance and a stated preference. The observed Auto MPG example applies that same decision structure to recorded data. Visible deeper passages derive projection guarantees, generalize the simplex, explain convergence assumptions and construct a common local direction. The optional smooth-max passage comes after those foundations. Complete programmes sit beside the calculations they implement; independent tasks conclude the lesson."}</Prose>

<span id="1-decide-what-is-allowed-and-what-is-better"/>
<H2>{"1. Name the decision and its requirements"}</H2>

<Prose>{"Consider three hypothetical deployment choices. Small has error fraction .12 and latency 8 ms; Medium has .08 and 18 ms; Large has .07 and 70 ms. An error fraction .12 means 12% of evaluated predictions were wrong. These are constructed teaching measurements, not a hardware benchmark."}</Prose>

<Drawing id="C01"/>

<Prose>{"A "}<strong>{"decision"}</strong>{" is the thing we can choose. Here it is exactly one model identity, not an arbitrary point halfway between two models. A "}<strong>{"constraint"}</strong>{" tells us which choices are allowed. An "}<strong>{"objective"}</strong>{" tells us what to improve among those choices. The same measurement can serve both roles: “latency at most 25 ms” is a constraint, while “prefer lower latency” is an objective or tie rule."}</Prose>

<Drawing id="C02"/>

<Prose>{"At 25 ms, Small and Medium remain; choosing minimum error selects Medium. At 5 ms no model remains. Returning an empty result communicates a requirement the catalogue cannot meet. Choosing the least-violating model would require a different, explicitly relaxed policy."}</Prose>

<Prose>{"The programme filters first, then minimizes the tuple "}<code>{"(error, latency_ms)"}</code>{". Tuples compare their first entries, using the second only to break an exact tie. "}<code>{"None"}</code>{" handles the empty set before "}<code>{"min"}</code>{" is called. Save the full listing as "}<code>{"selection.py"}</code>{" and run "}<code>{"python selection.py"}</code>{" with Python 3; on Windows the equivalent launcher may be "}<code>{"py"}</code>{". The first programme uses only the standard library. Programmes below that import NumPy used Python 3.12 and NumPy 2.3.5; install with "}<code>{"python -m pip install numpy==2.3.5"}</code>{" in the same interpreter. The separate SciPy route states its additional dependency where used."}</Prose>

<Payload file="selection.py"/><Prose>Recorded output:</Prose><Payload file="selection.stdout.txt" output/>

<Prose>{"The first printed record is Medium; the second result is "}<code>{"None"}</code>{". The returned object retains the measured values that justify the choice. Change a limit in the complete programme and inspect both the surviving choices and the result, rather than treating a returned name as an explanation."}</Prose>

<Prose>{"To compare more than one goal, we will expand the catalogue explicitly. Add Compact and Legacy, and give every candidate a memory measurement:"}</Prose>

<NeuralTable caption={"1. Name the decision and its requirements"} headers={[<>{"ID and model"}</>,<>{"Error fraction"}</>,<>{"Error percentage"}</>,<>{"Latency (ms)"}</>,<>{"Memory (MB)"}</>]} rows={[[<>{"S Small"}</>,<>{".12"}</>,<>{"12%"}</>,<>{"8"}</>,<>{"32"}</>],[<>{"C Compact"}</>,<>{".11"}</>,<>{"11%"}</>,<>{"15"}</>,<>{"48"}</>],[<>{"M Medium"}</>,<>{".08"}</>,<>{"8%"}</>,<>{"18"}</>,<>{"96"}</>],[<>{"L Large"}</>,<>{".07"}</>,<>{"7%"}</>,<>{"70"}</>,<>{"384"}</>],[<>{"G Legacy"}</>,<>{".13"}</>,<>{"13%"}</>,<>{"22"}</>,<>{"128"}</>]]} />

<Drawing id="C01" expanded/>

<Prose>{"The original programme still uses its three declared models. The five-row catalogue supports the later comparisons. S remains a cyan circle, C an amber triangle, M a violet square, L a rose diamond and G a slate cross in the connected drawings. A selected row gains an outline; its identity does not change colour."}</Prose>

<Drawing id="C03"/>

<Prose>{"Medium improves both measured error and latency over Legacy. Two distinct implementations could instead share exactly Medium's error and latency. Equal objective values would make them equivalent for that two-objective comparison, not the same implementation. A memory requirement or a third objective could distinguish them."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" If two models have equal error and latency but different memory use, are they equivalent? They are equivalent for a problem whose only objectives are error and latency, provided both satisfy its memory limit. If lower memory matters even below that limit, introduce it as another objective or tie rule. A decision problem only expresses the quantities you include."}</Prose>

<Prose>{"Write the allowed decisions as a "}<strong>{"feasible set"}</strong>{":"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\mathcal F=\\{x:g_i(x)\\le0\\text{ for all }i,\\ h_j(x)=0\\text{ for all }j\\},\n\\qquad \\min_{x\\in\\mathcal F}f(x)."}</MathBlock></div>

<Prose>{"For the latency rule, set "}<InlineMath>{"g(x)=\\ell(x)-25"}</InlineMath>{", with latency measured in milliseconds. For an allocation whose two entries must total B, set "}<InlineMath>{"h(x)=x_1+x_2-B"}</InlineMath>{". All requirements apply at once. An inequality can have slack; an equality must match its specified total. A numerical tolerance approximates a mathematical test, so its units and acceptable size must be stated."}</Prose>

<Drawing id="C04"/>

<Prose>{"The requirements "}<InlineMath>{"x\\ge2"}</InlineMath>{" and "}<InlineMath>{"x\\le1"}</InlineMath>{" have no joint feasible point. There is another way a problem can fail to return a minimizer: minimize x over "}<InlineMath>{"x>0"}</InlineMath>{". The feasible values 1, 1/2, 1/4 approach zero, and every positive candidate can be improved, but zero itself is excluded. Zero is the "}<strong>{"infimum"}</strong>{", the greatest lower bound on objective values; it is not an attained minimum here."}</Prose>

<Drawing id="C05"/>

<Prose>{"A continuous objective on a nonempty compact feasible set attains a minimum. In finite-dimensional Euclidean space, compact means closed and bounded. This existence statement needs all those conditions; convexity addresses a different kind of structure. Before choosing a solver, ask whether the requirements are consistent and whether the requested best value is actually attained."}</Prose>

<span id="2-project-onto-the-whole-feasible-set"/>
<H2>{"2. Project onto the whole allowed set"}</H2>

<Prose>{"A proposed update can leave the feasible set. To repair it, choose the allowed point nearest to the proposal. For now the coordinates share units and importance, so ordinary Euclidean distance is meaningful. With different physical units, choose a justified scaling or metric first; the word “nearest” depends on it."}</Prose>

<Prose>{"Allocate a compulsory total B between two nonnegative amounts. Call the nonnegative quadrant C and the compulsory-sum line D. Which points satisfy both?"}</Prose>

<Drawing id="C06"/>

<Prose>{"C is the quadrant "}<InlineMath>{"x_1,x_2\\ge0"}</InlineMath>{"; D is the line "}<InlineMath>{"x_1+x_2=B"}</InlineMath>{". Their intersection is the segment connecting "}<InlineMath>{"(0,B)"}</InlineMath>{" and "}<InlineMath>{"(B,0)"}</InlineMath>{". The target v can lie anywhere, including outside both constraints."}</Prose>

<Prose>{"Projection onto C is simple: replace each negative coordinate by zero. Projection onto D subtracts the same correction "}<InlineMath>{"(v_1+v_2-B)/2"}</InlineMath>{" from both coordinates. That moves along the line's normal direction "}<InlineMath>{"(1,1)"}</InlineMath>{", reaching the nearest point on the entire line. The two easy operations do not necessarily solve their intersection."}</Prose>

<Drawing id="C07"/>

<Prose>{"Clamping "}<InlineMath>{"(2,-.6)"}</InlineMath>{" produces "}<InlineMath>{"(2,0)"}</InlineMath>{". Its sum exceeds 1 by 1, so subtract .5 from each coordinate to get "}<InlineMath>{"(1.5,-.5)"}</InlineMath>{". The sum is now correct, but the second amount is negative. Fixing the last requirement broke the first."}</Prose>

<Drawing id="C08"/>

<Prose>{"Projecting the original target onto the line instead subtracts .2 from both entries, giving "}<InlineMath>{"(1.8,-.8)"}</InlineMath>{". Clamping then gives "}<InlineMath>{"(1.8,0)"}</InlineMath>{", which violates the total. Reversing the order changed the invalid answer; it did not produce the joint projection."}</Prose>

<Drawing id="C09"/>

<Prose>{"The nearest feasible point is "}<InlineMath>{"(1,0)"}</InlineMath>{". Its squared distance to v is "}<InlineMath>{"1^2+.6^2=1.36"}</InlineMath>{". The first one-pass answer "}<InlineMath>{"(1.5,-.5)"}</InlineMath>{" has a smaller squared distance, "}<InlineMath>{".5^2+.1^2=.26"}</InlineMath>{", but it is forbidden. A smaller objective outside the allowed set cannot beat a feasible optimum."}</Prose>

<Drawing id="C10"/>

<Prose>{"Parametrize the segment by "}<InlineMath>{"x=(t,B-t)"}</InlineMath>{", where "}<InlineMath>{"0\\le t\\le B"}</InlineMath>{". Squared distance is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"q(t)=(t-v_1)^2+(B-t-v_2)^2,\n\\quad q'(t)=4t-2(v_1-v_2+B),\\quad q''(t)=4."}</MathBlock></div>

<Prose>{"The unrestricted minimizer is "}<InlineMath>{"(v_1-v_2+B)/2"}</InlineMath>{". Because q is a convex quadratic, restricting t to the interval means clipping that value to its nearest endpoint when it lies outside. Therefore"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"t^*=\\operatorname{clip}\\!\\left(\\frac{v_1-v_2+B}{2},0,B\\right),\n\\qquad P_{C\\cap D}(v)=(t^*,B-t^*)."}</MathBlock></div>

<Prose>{"Our unrestricted t is 1.8, so clipping gives 1 and the second amount 0. The calculation enforces both constraints simultaneously. Independent clipping followed by arbitrary renormalization is a different operation and generally gives a different distance."}</Prose>

<Drawing id="C11"/>

<Prose>{"In general a "}<strong>{"Euclidean projection"}</strong>{" is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"P_{\\mathcal F}(v)=\\arg\\min_{x\\in\\mathcal F}\\tfrac12\\|x-v\\|^2."}</MathBlock></div>

<Prose>{"For a nonempty closed convex set in finite dimensions, the projection exists and is unique. To see existence even for an unbounded set, choose one feasible reference point. Every potentially better candidate lies in a closed ball centred at v with that reference distance. Intersecting the closed feasible set with the ball gives a nonempty compact search region. Continuity gives a minimum there. Strict convexity of squared distance gives uniqueness on a convex set. Without convexity, the set "}<InlineMath>{"\\{-1,1\\}"}</InlineMath>{" has two equally close points to 0. Without closure, projecting 0 onto the positive open ray has no attained answer."}</Prose>

<Drawing id="C12"/>

<Prose>{"Change the target coordinates, compulsory budget or projection order. The stage control selects the original target, first correction or second correction; the true joint projection remains visible for comparison. Coordinates stay on one fixed scale for a chosen input, so moving between stages cannot create apparent motion by rescaling the axes. An already feasible target such as (.2, .8) at B=1 stays fixed under every projection. Reset restores target (2, −.6), B=1, clamp-then-line and the final stage."}</Prose>

<Prose>{"The complete NumPy programme validates a finite two-coordinate target and positive budget, implements each operation, and reports the sum and smallest coordinate. Those two diagnostics expose the two different failures. "}<code>{"np.clip"}</code>{" implements the derived interval projection, not an iterative solver."}</Prose>

<Payload file="projection.py"/><Prose>Recorded output:</Prose><Payload file="projection.stdout.txt" output/>

<Prose>{"The output shows sum 1 with minimum−.5 for the first order, sum 1.8 with minimum 0 for the reverse order, and sum 1/minimum 0 for the intersection. Each claim refers to a concrete condition. Next we can use the joint projection to make an optimization update, rather than merely repair one arbitrary target."}</Prose>

<span id="3-make-a-feasible-descent-step"/>
<H2>{"3. Turn a gradient into a feasible update"}</H2>

<Prose>{"Keep the same nonnegative sum-one segment, and minimize"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"f(x)=\\tfrac12\\{(x_1-2)^2+4(x_2-.5)^2\\},\n\\qquad \\nabla f(x)=(x_1-2,\\ 4(x_2-.5))."}</MathBlock></div>

<Prose>{"The second coordinate's discrepancy has four times the squared-cost weight. Start from "}<InlineMath>{"x^0=(.5,.5)"}</InlineMath>{", which is feasible. Ordinary gradient descent proposes "}<InlineMath>{"v=x^0-\\eta\\nabla f(x^0)"}</InlineMath>{". A "}<strong>{"projected-gradient step"}</strong>{" applies the joint projection after that proposal:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x^{k+1}=P_{\\mathcal F}(x^k-\\eta\\nabla f(x^k))."}</MathBlock></div>

<Drawing id="C13"/>

<Prose>{"At the starting point the gradient is(−1.5, 0). With "}<InlineMath>{"\\eta=.2"}</InlineMath>{", the proposed point is (.8, .5), with sum 1.3. The line correction subtracts .15 from each entry, producing (.65, .35), already nonnegative. The trial point and applied point are different objects; the latter is the iterate that must be used in the next gradient."}</Prose>

<Drawing id="C14"/>

<Prose>{"Substitute "}<InlineMath>{"x=(t,1-t)"}</InlineMath>{" into the objective. Its derivative along this line is "}<InlineMath>{"(t-2)+4(t-.5)=5t-4"}</InlineMath>{", so the constrained optimum is "}<InlineMath>{"t=.8"}</InlineMath>{", or "}<InlineMath>{"x^*=(.8,.2)"}</InlineMath>{". Yet its ordinary gradient is(−1.2, −1.2), not zero. Both feasible tangent directions have opposite coordinate changes, so their dot product with that gradient is zero. The forbidden negative-gradient move increases the total allocation; its nonzero size is not evidence of a missing feasible improvement."}</Prose>

<Drawing id="C15"/>

<Prose>{"Measure the actual proposed-and-projected update with the "}<strong>{"projected-gradient mapping"}</strong>{":"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"G_\\eta(x)=\\frac{x-P_{\\mathcal F}(x-\\eta\\nabla f(x))}{\\eta}."}</MathBlock></div>

<Prose>{"The mapping is zero exactly when the projected step fixes x. At the constrained optimum the trial (.8+.24, .2+.24) projects back to(.8, .2). A solver that waited for the ordinary gradient to vanish would miss this valid stopping condition. The mapping measures an optimization residual in coordinate-per-step units; feasibility residuals still need their own checks."}</Prose>

<H3>{"Deeper: why the projection gives a useful direction"}</H3>

<Drawing id="C16"/>

<Prose>{"For a closed convex feasible set and "}<InlineMath>{"p=P_{\\mathcal F}(v)"}</InlineMath>{", every segment "}<InlineMath>{"p+t(y-p)"}</InlineMath>{", "}<InlineMath>{"0\\le t\\le1"}</InlineMath>{", remains feasible. Since squared distance to v is minimized at t=0, its right derivative there is nonnegative. Thus"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"(v-p)^\\top(y-p)\\le0 \\qquad (y\\in\\mathcal F)."}</MathBlock></div>

<Prose>{"This says the vector from p toward v does not point into a feasible improving distance direction. Set "}<InlineMath>{"v=x-\\eta\\nabla f(x)"}</InlineMath>{", let "}<InlineMath>{"p=x^+"}</InlineMath>{", and choose y=x. With "}<InlineMath>{"d=x^+-x"}</InlineMath>{", rearrangement gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\nabla f(x)^\\top d\\le-\\frac{\\|d\\|^2}{\\eta}."}</MathBlock></div>

<Prose>{"If the gradient is L-Lipschitz on the relevant region, the smooth upper bound gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"f(x^+)\\le f(x)+\\nabla f(x)^\\top d+\\tfrac L2\\|d\\|^2\n\\le f(x)-\\left(\\frac1\\eta-\\frac L2\\right)\\|d\\|^2."}</MathBlock></div>

<Prose>{"Our diagonal Hessian has largest eigenvalue L=4. The familiar conservative choice "}<InlineMath>{"\\eta\\le1/L=.25"}</InlineMath>{" supplies decrease. It is sufficient, not a necessary threshold beyond which every step diverges. For a differentiable convex objective, a zero mapping also yields "}<InlineMath>{"\\nabla f(x)^\\top(y-x)\\ge0"}</InlineMath>{" for all feasible y; the convex supporting inequality then proves global optimality. In a nonconvex problem this is a first-order condition, with the limitations discussed in the earlier landscape lesson."}</Prose>

<Drawing id="C17"/>

<Prose>{"For this two-coordinate example, the next first coordinate simplifies to"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"t_{k+1}=\\operatorname{clip}((1-2.5\\eta)t_k+2\\eta,0,1)."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"\\eta=.2"}</InlineMath>{", it is "}<InlineMath>{".5t_k+.4"}</InlineMath>{", so the distance from .8 halves on each step. At .4, the old t coefficient is zero and one update reaches .8. At .8, starting from .5 gives 1, then .6, then 1 again: a cycle. Compare those step sizes and watch the actual trial/projection, not only the final loss. A smaller .05 step makes slower finite progress. The selected frame k shows current "}<InlineMath>{"x_k"}</InlineMath>{" and its proposed "}<InlineMath>{"x_{k+1}"}</InlineMath>{"; Reset returns to .2 and frame 1."}</Prose>

<Prose>{"The original complete programme applies 30 projected updates, computes the ordinary gradient and projected mapping at the result, and checks feasibility. It uses fixed 30 as a transparent demonstration; the more general solver below implements a residual stopping rule and an iteration budget."}</Prose>

<Payload file="projectedGradient.py"/><Prose>Recorded output:</Prose><Payload file="projectedGradient.stdout.txt" output/>

<Prose>{"The result (.8, .2) has ordinary gradient (−1.2, −1.2) while its mapping norm is below 10⁻⁸. The two quantities answer different questions. A small mapping at an infeasible arbitrary input would not replace the requirement that the reported constrained answer is feasible."}</Prose>

<H3>{"Extend the projection without changing the constraint"}</H3>

<Drawing id="C18"/>

<Prose>{""}<a href={"/learn/topic/convex-optimization#7-optimize-through-a-kink"}>{"Convex Optimization's proximal section"}</a>{" used nonnegative coordinates with "}<strong>{"sum at most B"}</strong>{". Here the sum must equal B. At target (.1, .1), B=1, the inequality projection is the target itself, but the equality projection is (.5, .5). The latter adds .4 to each coordinate, equivalent to subtracting a negative common threshold. Returning early because the positive coordinates total less than B is valid for the inequality set and wrong for the equality set."}</Prose>

<Prose>{"For d coordinates and B>0, minimize "}<InlineMath>{"\\tfrac12\\|x-v\\|^2"}</InlineMath>{" subject to "}<InlineMath>{"x_i\\ge0"}</InlineMath>{" and "}<InlineMath>{"\\sum_i x_i=B"}</InlineMath>{". A common equality multiplier "}<InlineMath>{"\\tau"}</InlineMath>{" shifts every free coordinate. The KKT conditions give"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x_i=\\max(v_i-\\tau,0),\\qquad \\sum_i\\max(v_i-\\tau,0)=B."}</MathBlock></div>

<Prose>{"For positive coordinates, stationarity gives "}<InlineMath>{"x_i-v_i+\\tau=0"}</InlineMath>{"; a clipped coordinate instead has "}<InlineMath>{"v_i\\le\\tau"}</InlineMath>{". Sort v into descending u. If the first j entries are active, their sum equation gives "}<InlineMath>{"\\tau_j=(\\sum_{i=1}^j u_i-B)/j"}</InlineMath>{". Choose the last j whose last entry exceeds its candidate threshold, then apply that threshold in the original coordinate order."}</Prose>

<Drawing id="C19"/>

<Prose>{"For v=(2, −.2, 1, .5), B=1.5, sorted entries are (2, 1, .5, −.2). The candidate thresholds are (.5, .75, 2/3, .45). The last positive test is j=2:1>.75, while the later last entries do not clear their thresholds. Subtract .75 and clip in original order to get (1.25, 0, .25, 0), summing 1.5. This is the projection of v, not yet the minimizer of an arbitrary weighted objective."}</Prose>

<Prose>{"The complete bridge now minimizes "}<InlineMath>{"\\tfrac12\\sum_i h_i(x_i-c_i)^2"}</InlineMath>{", with all "}<InlineMath>{"h_i>0"}</InlineMath>{", on the equality simplex. The coefficients h specify different costs for errors in different coordinates. Use c=(2, −.2, 1, .5), h=(1, 3, 2, 4) and B=1.5 for the four-coordinate comparison."}</Prose>

<span id="constrained-code-route"/><Drawing id="C20"/>

<Prose>{"The optimum is (6/7, 0, 3/7, 3/14), which differs from the unweighted projection just calculated. The iterative route uses step size "}<InlineMath>{"1/\\max_i h_i"}</InlineMath>{". Its separate two-coordinate fixture uses c=(2, 1.4), h=(1, 1), unlike the earlier c=(2, .5), h=(1, 4). Both happen to have optimum (.8, .2); equal answers do not make their objectives identical."}</Prose>

<Prose>{""}<code>{"project_simplex"}</code>{" performs sorting and shared-threshold clipping. The iterative solver checks the infinity norm of the mapping and reports whether its step budget sufficed. The ordinary library route uses "}<code>{"scipy.optimize.minimize(method='SLSQP')"}</code>{" with the same objective, analytic gradient, nonnegative "}<code>{"Bounds"}</code>{" and equality "}<code>{"LinearConstraint"}</code>{". Its returned success flag is followed by feasibility, mapping and agreement checks. Install "}<code>{"numpy==2.3.5 scipy==1.18.1"}</code>{", then run "}<code>{"python simplex-solver-bridge.py"}</code>{"."}</Prose>

<Payload file="simplex-solver-bridge.py"/><Prose>Recorded output:</Prose><Payload file="simplex-solver-bridge.stdout.txt" output/>

<Drawing id="C20" diagnostics/>

<Prose>{"The printed solutions, checked feasibility and small mapping residuals support agreement on the two fixtures. Giving the scratch solver one step produces "}<code>{"converged False"}</code>{", an informative exhausted-budget result. Sorting costs O(d log d) per projection; K steps cost O(Kd log d), with O(d) working storage. SLSQP is a more general constrained method with different scaling and stopping behavior. Its "}<code>{"ftol"}</code>{" controls several numerical termination tests; it is not the same quantity as our mapping threshold. These finite moderate-scale examples do not promise numerical protection for every imaginable floating-point input."}</Prose>

<span id="4-distinguish-penalties-and-barriers"/>
<H2>{"4. Compare a hard limit with a changed objective"}</H2>

<Prose>{"Projection keeps each applied iterate inside a feasible set. Another approach modifies the objective to discourage violation. To see what that does, minimize "}<InlineMath>{"f(x)=\\tfrac12(x-3)^2"}</InlineMath>{" under the hard constraint x≤1."}</Prose>

<Drawing id="C21"/>

<Prose>{"The unconstrained minimum is 3. Among allowed points, the closest point to 3 is 1, with original cost 2. The hard problem excludes 1.001 just as it excludes 3, unless we explicitly replace its mathematical rule by a numerical tolerance policy."}</Prose>

<Drawing id="C22"/>

<Prose>{"A quadratic penalty instead minimizes"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"f_\\mu(x)=\\tfrac12(x-3)^2+\\tfrac\\mu2\\max(x-1,0)^2,\\quad\\mu\\ge0."}</MathBlock></div>

<Prose>{"On the violating branch, its derivative is "}<InlineMath>{"(x-3)+\\mu(x-1)"}</InlineMath>{". Setting that to zero gives "}<InlineMath>{"x_\\mu=1+2/(1+\\mu)"}</InlineMath>{". At "}<InlineMath>{"\\mu=2"}</InlineMath>{", x=5/3 still violates the rule by 2/3. Every finite nonnegative penalty leaves a positive violation; increasing it approaches the boundary without attaining the hard optimum at finite strength."}</Prose>

<Drawing id="C23"/>

<Prose>{"A hinge penalty uses "}<InlineMath>{"f_\\rho(x)=\\tfrac12(x-3)^2+\\rho\\max(x-1,0)"}</InlineMath>{". At x=1 its left slope is −2 and its right slope is −2+ρ. Once ρ≥2, zero lies between those slopes, so the convex function is minimized at the kink. For smaller ρ, the violating-branch optimum is 3−ρ. Together, "}<InlineMath>{"x_\\rho=\\max(1,3-\\rho)"}</InlineMath>{". This penalty can be "}<strong>{"exact"}</strong>{" at finite strength because its nonsmooth corner supplies the needed slope balance."}</Prose>

<Drawing id="C24"/>

<Prose>{"A barrier approaches the constraint from the inside instead. Minimize"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"f_\\tau(x)=\\tfrac12(x-3)^2-\\tau\\log(1-x),\\quad x<1,\\quad\\tau>0."}</MathBlock></div>

<Prose>{"The logarithm requires positive slack 1−x. As that slack approaches zero from above, log(1−x) tends to negative infinity, so the barrier −τ log(1−x) tends to positive infinity for every τ>0. Differentiate: "}<InlineMath>{"x-3+\\tau/(1-x)=0"}</InlineMath>{". With d=1−x>0, this becomes "}<InlineMath>{"d^2+2d=\\tau"}</InlineMath>{". The stable expression for its positive root gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x_\\tau=1-\\frac{\\tau}{\\sqrt{1+\\tau}+1}=2-\\sqrt{1+\\tau}."}</MathBlock></div>

<Prose>{"For τ=1, x≈.585786. Every positive τ stays strictly inside; sending τ to zero approaches 1. Setting τ to zero while retaining the open domain x<1 does not make the boundary attainable."}</Prose>

<Drawing id="C25"/>

<Prose>{"At the same numerical strength 2, quadratic gives 5/3, hinge gives 1, and barrier gives 2−√3. Their parameters have different meanings. The comparison concerns different optimization problems, not which solver ran fastest. Report the original objective and violation alongside a modified objective so the changed contract stays visible."}</Prose>

<Drawing id="C26"/>

<Prose>{"For a quadratic penalty, violation below .1 requires "}<InlineMath>{"2/(1+\\mu)<.1"}</InlineMath>{", hence μ>19. Equality at 19 gives exactly .1. Meanwhile the violating-branch curvature is 1+μ. In multidimensional problems, large penalty curvature alongside smaller other curvatures can make the problem poorly conditioned. Driving violation down can therefore burden the numerical solve; it is not a free substitute for enforcing a hard set."}</Prose>

<Drawing id="C27"/>

<Prose>{"Switch between the three objectives and inspect both the curve and its minimizing point. Quadratic and hinge permit zero strength; the positive barrier range preserves its domain. Switching modes uses its stated initial strength rather than carrying an invalid zero into the barrier. Reset restores quadratic strength 2. The displayed point is computed by these closed forms, so the investigation compares objective choices rather than hidden iteration counts."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" A finite quadratic penalty gives x=1.001. Is it feasible for hard x≤1? No. It has violation .001; accept it only under an explicitly stated tolerance or relaxed requirement, not because the penalty is large."}</Prose>

<Prose>{"The complete programme generalizes the centre and bound while keeping centre>bound and positive strength. With gap=center−bound, it returns quadratic, hinge and barrier optima in that order. It computes the barrier slack with a rationalized positive root to avoid subtracting nearly equal quantities. The original programme's strictly positive strength contract differs deliberately from the zero-strength option for quadratic/hinge in the focused browser investigation."}</Prose>

<Payload file="penalties.py"/><Prose>Recorded output:</Prose><Payload file="penalties.stdout.txt" output/>

<Prose>{"At strength 1, the hinge is still outside at 2; at 2 it reaches 1. The quadratic values decrease toward 1, while the barrier's increasing strength pushes its minimizer farther inside. These changes follow from the visible objective functions. Next we will keep the original constrained objective and split its pieces, coordinating agreement instead of paying a finite violation cost."}</Prose>

<span id="5-split-a-problem-without-losing-agreement"/>
<H2>{"5. Solve separate pieces while coordinating agreement"}</H2>

<Prose>{"The joint projection was easy in two coordinates because we could parametrize a segment. Larger problems can combine an objective and constraints whose separate operations are easier than one joint solve. Splitting introduces copies, gives each copy a manageable piece, and then enforces agreement between them."}</Prose>

<Prose>{"Let x be a nonnegative allocation copy and z a copy whose coordinates total B. Both represent the same intended allocation, so we must ultimately require x=z."}</Prose>

<Drawing id="C28"/>

<Prose>{"For our target c and compulsory sum B, write"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\min_{x,z}\\ f(x)+g(z)\\quad\\text{subject to }x=z,\n\\qquad f(x)=\\tfrac12\\|x-c\\|^2+I_C(x),\\quad g(z)=I_D(z)."}</MathBlock></div>

<Prose>{"The "}<strong>{"indicator function"}</strong>{" "}<InlineMath>{"I_C"}</InlineMath>{" is zero inside C and positive infinity outside, so minimizing f requires nonnegative x. Similarly, g requires the sum of z to be B. Agreement x=z restores both original requirements. This indicator is a mathematical constraint encoding, not the 0/1 indicator used in probability. "}<a href={"/learn/topic/convex-optimization#7-optimize-through-a-kink"}>{"Convex Optimization's proximal section"}</a>{" introduces this extended-valued representation."}</Prose>

<Prose>{"Use a multiplier y for x−z and a fixed positive penalty parameter ρ. The augmented Lagrangian adds "}<InlineMath>{"y^\\top(x-z)+\\tfrac\\rho2\\|x-z\\|^2"}</InlineMath>{". Define the "}<strong>{"scaled dual variable"}</strong>{" u=y/ρ. Completing the square gives the agreement term "}<InlineMath>{"\\tfrac\\rho2\\|x-z+u\\|^2"}</InlineMath>{", up to a constant in the minimization variable."}</Prose>

<Prose>{"The "}<strong>{"alternating direction method of multipliers"}</strong>{", ADMM, updates x, then z using the new x, then u. It is different from the earlier projected shared-price ascent: here there are two copies of one decision and a quadratic agreement term."}</Prose>

<Drawing id="C29"/>

<Prose>{"Holding old z and u fixed, minimize"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\tfrac12\\|x-c\\|^2+\\tfrac\\rho2\\|x-z^k+u^k\\|^2 \\quad (x\\ge0)."}</MathBlock></div>

<Prose>{"The unrestricted coordinate minimizer is the weighted mean "}<InlineMath>{"(c_i+\\rho(z_i^k-u_i^k))/(1+\\rho)"}</InlineMath>{". Nonnegativity clips it at zero:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"x^{k+1}=\\max\\left(0,\\frac{c+\\rho(z^k-u^k)}{1+\\rho}\\right)."}</MathBlock></div>

<Drawing id="C30"/>

<Prose>{"Next minimize the agreement square over z∈D. Its centre is "}<InlineMath>{"x^{k+1}+u^k"}</InlineMath>{", giving "}<InlineMath>{"z^{k+1}=P_D(x^{k+1}+u^k)"}</InlineMath>{". The index on x matters: using the old x would define a different algorithm. Projection onto D still subtracts the shared sum correction from both coordinates."}</Prose>

<Drawing id="C31"/>

<Prose>{"Finally accumulate the remaining disagreement:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"u^{k+1}=u^k+x^{k+1}-z^{k+1}."}</MathBlock></div>

<Prose>{"u is a vector that influences later subproblems; it is not a third feasible allocation. The full ordered iteration is therefore local minimization, equality projection, then dual update. In the diagrams x remains a cyan circle and z a violet square; u is an amber vector in its own labelled plane."}</Prose>

<Drawing id="C32"/>

<Prose>{"Take c=(2, −.6), B=1, ρ=1 and "}<InlineMath>{"x^0=z^0=(.5,.5),u^0=0"}</InlineMath>{". The weighted mean for x is(1.25, −.05); nonnegativity gives "}<InlineMath>{"x^1=(1.25,0)"}</InlineMath>{". Its sum is 1.25, so the z projection subtracts .125 from both entries: "}<InlineMath>{"z^1=(1.125,-.125)"}</InlineMath>{". Their difference is (.125, .125), hence "}<InlineMath>{"u^1=(.125,.125)"}</InlineMath>{". x satisfies its nonnegative constraint while missing the sum; z satisfies the sum while containing a negative entry. Local feasibility is not yet joint feasibility."}</Prose>

<Drawing id="C33"/>

<Prose>{"The "}<strong>{"primal residual"}</strong>{" "}<InlineMath>{"r^{k+1}=x^{k+1}-z^{k+1}"}</InlineMath>{" measures disagreement. The "}<strong>{"dual residual"}</strong>{" for this consensus form is "}<InlineMath>{"s^{k+1}=-\\rho(z^{k+1}-z^k)"}</InlineMath>{", measuring the stationarity disturbance from the latest z change. At the first update r=(.125, .125) and s=(−.625, .625), with norms≈.176777 and .883883. Their norms conceal direction, so first follow their components in the drawing."}</Prose>

<Prose>{"For a general equality Ax+Bz=c, the corresponding dual residual is "}<InlineMath>{"\\rho A^\\top B(z^{k+1}-z^k)"}</InlineMath>{". Here A=I and B=−I, explaining the sign. Primal and dual residuals need not belong to the same space in a general problem."}</Prose>

<Drawing id="C34"/>

<Prose>{"Both tests must pass. With two-dimensional vectors, the displayed thresholds are"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\begin{aligned}\n\\epsilon_{\\rm pri}&=\\sqrt2\\,\\epsilon_{\\rm abs}+\\epsilon_{\\rm rel}\\max(\\|x\\|,\\|z\\|),\\\\\n\\epsilon_{\\rm dual}&=\\sqrt2\\,\\epsilon_{\\rm abs}+\\epsilon_{\\rm rel}\\|\\rho u\\|.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The investigation uses absolute 10⁻⁴ and relative 10⁻³ tolerances. The square-root factor accounts for vector dimension in the absolute part, while the relative part scales with the relevant quantities. At frame 0, x=z gives r0=0, but there is no previous z update for s0. Displaying an unavailable dual residual prevents a false “already converged” result."}</Prose>

<Drawing id="C35"/>

<Prose>{"Select frames 0, 1, 40 or 80; change c, B or ρ and follow the recomputed fixed 80-step trace. The penalty stays fixed within each trace. Compare ρ=.1 and 10 at the same frame; no universal faster value follows from these examples. Reset restores c=(2, −.6), B=1, ρ=1 and frame 40. A separately labelled joint projection of z supplies a feasible diagnostic repair; it is not secretly used as the next ADMM iterate."}</Prose>

<Prose>{"The programme implements the same three updates and retains the old z before replacing it, so the dual residual uses the correct difference. It checks both thresholds, retains the first update for explanation, and reports the original sum residual even when stopping passes. Save as "}<code>{"admm.py"}</code>{"; NumPy supplies vector arithmetic while the algorithm itself is visible."}</Prose>

<Payload file="admm.py"/><Prose>Recorded output:</Prose><Payload file="admm.stdout.txt" output/>

<Prose>{"The stopped x prints approximately (1.001, 0), and its original sum residual is .001221. Passing relative/absolute numerical thresholds means the specified tests passed, not exact equality in real arithmetic. If the application requires a stricter allocation tolerance, state it and solve or repair accordingly, then report the repaired objective too."}</Prose>

<Drawing id="C36"/>

<Prose>{"For the classical convex two-block result, f and g are proper closed convex functions, the unaugmented problem has a saddle point, the subproblems attain their minima and are solved as required, and ρ is fixed positive. Under these assumptions the primal residual tends to zero, objective values approach the optimum, and the dual sequence has the standard convergence guarantee. General convergence of both primal variable sequences is not supplied without further assumptions. Our quadratic/indicator fixture has explicit attained minimizers, which is why each update is well-defined."}</Prose>

<Prose>{"Changing ρ between iterations would require maintaining the same unscaled y by rescaling u; the focused investigation avoids that extra algorithm. Arbitrary nonconvex objectives, extra blocks, approximate solves or asynchronous communication need their own arguments. The benefit here is a transparent decomposition: solve easier local operations while measuring whether their answers agree."}</Prose>

<span id="6-read-the-pareto-frontier"/>
<H2>{"6. Keep every nondominated alternative"}</H2>

<Prose>{"The preceding problems minimized one scalar objective under constraints. Now return to the five-model catalogue and improve both error and latency. One model can win one measure and lose the other, so a scalar minimum is no longer the first object to compute."}</Prose>

<Drawing id="C37"/>

<Prose>{"The decision side contains S, C, M, L, G. The objective side places each at (latency ms, error%). Lower and left are better. The mapping can send different decisions to the same point; it need not preserve identity one-to-one. No connecting line between the discrete candidates promises that an intermediate implementation exists."}</Prose>

<Drawing id="C38"/>

<Prose>{"Decision a "}<strong>{"dominates"}</strong>{" b when it is no worse in every objective and strictly better in at least one. With minimization objectives "}<InlineMath>{"f_1,\\ldots,f_m"}</InlineMath>{", this means "}<InlineMath>{"f_i(a)\\le f_i(b)"}</InlineMath>{" for all i and a strict inequality for some i. M dominates G because 18<22 ms and 8<13% error. S and M are incomparable: S is faster, M more accurate. An M-copy with identical values does not strictly dominate M; both identities survive the test."}</Prose>

<Drawing id="C39"/>

<Prose>{"A "}<strong>{"Pareto-optimal"}</strong>{" or nondominated decision has no dominating feasible alternative. The "}<strong>{"Pareto frontier"}</strong>{" is the set of their objective vectors. When all five candidates are feasible, S, C, M, L are nondominated; G is dominated. This partial order can retain several valid compromises. It does not choose which one the user prefers."}</Prose>

<Drawing id="C40"/>

<Prose>{"Keep the two hard limits visible while inspecting the frontier. The initial limits are 25 ms and 400 MB. At 5 ms, no candidate fits. At 48 MB, M, L and G fail memory; S and C remain when the latency limit permits them. Returning the limits restores the same identities and coordinates. Reset restores 25 ms/400 MB and a neutral selection. A selected row is only highlighted; it is not an automatically preferred winner."}</Prose>

<Prose>{"Filtering must precede the dominance comparison. Under this catalogue's two upper-budget constraints, G can never outlive its dominator M: whenever G's 22 ms/128 MB fits, M's 18 ms/96 MB fits too. A different requirement could exclude a dominator while retaining its target, but this particular live example does not demonstrate such a case."}</Prose>

<Drawing id="C41"/>

<Prose>{"The scratch algorithm compares every candidate with every other candidate. Its first logical condition is "}<code>{"all"}</code>{": every coordinate must be no worse. Its second is "}<code>{"any"}</code>{": at least one must be strictly better. Using only the first would delete equal-valued alternatives. The matrix makes the direction explicit: a row is the possible dominator and a column is its target."}</Prose>

<Payload file="pareto.py"/><Prose>Recorded output:</Prose><Payload file="pareto.stdout.txt" output/>

<Prose>{"The complete implementation validates finite nonempty objective vectors with matching dimension. Empty input returns an empty frontier. It keeps original indices, so duplicate vectors still refer to different decisions. With n candidates and m objectives, pairwise comparison costs O(n²m). Later the observed-data programme performs the same dominance relation through ordinary NumPy broadcasting as well as scratch loops. A more specialized search method is unnecessary for these small catalogues; for a sampled or heuristic candidate set, nondominance only describes the supplied choices."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" Can a Pareto-optimal model have higher error than another model? Yes. It can compensate with lower latency. If another feasible model has no higher error and no higher latency, with at least one strict improvement, the first is dominated instead."}</Prose>

<span id="7-express-a-preference-without-hiding-it"/>
<H2>{"7. Make the preference explicit"}</H2>

<Prose>{"A frontier preserves choices. Selecting one requires an additional statement about what trade-off is acceptable. We will compare three different languages for that statement: an exchange rate, a hard bound, and an exact priority."}</Prose>

<Drawing id="C42"/>

<Prose>{"Let E be error in "}<strong>{"percentage points"}</strong>{", and L latency in milliseconds. Minimize "}<InlineMath>{"E+pL"}</InlineMath>{", where p has units error percentage points per millisecond. At p=.2, scores are S: 13.6, C: 14, M: 11.6, L: 21, G: 17.4. M wins. A line "}<InlineMath>{"E+pL=q"}</InlineMath>{" contains equal-score points; moving it toward lower q until it first touches an attainable point explains the choice geometrically."}</Prose>

<Drawing id="C43"/>

<Prose>{"Compact is Pareto but cannot minimize any score of this form for p≥0. To beat S it needs "}<InlineMath>{"11+15p\\le12+8p"}</InlineMath>{", hence "}<InlineMath>{"p\\le1/7"}</InlineMath>{". To beat M it needs "}<InlineMath>{"11+15p\\le8+18p"}</InlineMath>{", hence "}<InlineMath>{"p\\ge1"}</InlineMath>{". No price satisfies both. This is an "}<strong>{"unsupported"}</strong>{" Pareto point: a supporting weighted line misses it even though no individual candidate dominates it."}</Prose>

<Prose>{"The exact "}<code>{"Fraction"}</code>{" programme records these incompatible bounds and also selects Compact by minimizing error under a 15 ms latency requirement. It illustrates the difference between a preference the weighted family can express and one it cannot."}</Prose>

<Payload file="unsupported.py"/><Prose>Recorded output:</Prose><Payload file="unsupported.stdout.txt" output/>

<Drawing id="C44"/>

<Prose>{"Units are part of the preference. For the original S/M/L trio, converting latency to seconds while retaining the numerical coefficient .2 changes the score to something else. Large then wins because the latency term became a thousand times smaller. To preserve the original score, multiply the coefficient by 1000: .2 percentage points/ms becomes 200 percentage points/second."}</Prose>

<Payload file="units.py"/><Prose>Recorded output:</Prose><Payload file="units.stdout.txt" output/>

<Prose>{"The first and third printed score lists are identical, and both choose M. The middle list chooses L. A positive common scaling of every whole score preserves rankings; changing only one term's numerical scale generally does not. If error is also converted from percentage points to a fraction, divide the entire old score by 100, yielding "}<InlineMath>{"E_{\\rm fraction}+2L_{\\rm seconds}"}</InlineMath>{"."}</Prose>

<Drawing id="C45"/>

<Prose>{"An "}<strong>{"epsilon-constraint formulation"}</strong>{" minimizes one objective subject to explicit bounds on the others. Minimize error under latency≤15 ms: S and C remain, and C wins. A bound can be infeasible or can leave ties in the primary objective. To recover a chosen Pareto objective vector, bounds at its other objective coordinates with the primary objective minimized suffice: a strictly better primary value would dominate that point. Arbitrary bounds with unresolved primary ties can also permit a dominated result, so report tie handling."}</Prose>

<Prose>{""}<strong>{"Lexicographic optimization"}</strong>{" specifies exact priorities. First minimize one objective; among its minimizers, minimize the next; continue through all objectives. Sorting a finite table by the full objective tuple implements this. If every objective is compared, a selected result is Pareto: a dominating candidate would win at the first coordinate where it differs. Allowing an “almost best” first objective can be useful, but that tolerance defines a different preference."}</Prose>

<Drawing id="C46"/>

<Prose>{"Suppose a global weighted-sum minimizer uses strictly positive weights. If another feasible point dominated it, at least one weighted term would strictly decrease and none would increase, contradicting minimality. Therefore it is Pareto. With nonnegative weights and at least one positive, the same argument rules out simultaneous strict improvement in every objective, giving "}<strong>{"weak Pareto optimality"}</strong>{". A zero-weight objective may improve while the score stays unchanged, so a selected tied minimizer can fail the stronger nondominance requirement."}</Prose>

<H3>{"Solve a continuous trade-off completely"}</H3>

<Drawing id="C47"/>

<Prose>{"Let "}<InlineMath>{"x\\in[0,2]"}</InlineMath>{", "}<InlineMath>{"f_1(x)=x^2"}</InlineMath>{", "}<InlineMath>{"f_2(x)=(x-2)^2"}</InlineMath>{". The objectives measure squared distances to opposite targets. Moving right increases the first and decreases the second. Thus every x in the interval is Pareto; no distinct feasible point improves one without worsening the other. This argument covers the entire interval, not only plotted samples."}</Prose>

<Prose>{"For weights α and 1−α, differentiate "}<InlineMath>{"\\alpha x^2+(1-\\alpha)(x-2)^2"}</InlineMath>{". The derivative is 2x−4(1−α) and second derivative 2, so the unique minimizer is "}<InlineMath>{"x^*=2(1-\\alpha)"}</InlineMath>{". An alternative bound "}<InlineMath>{"f_2\\le\\epsilon"}</InlineMath>{" requires "}<InlineMath>{"x\\ge2-\\sqrt\\epsilon"}</InlineMath>{" within the interval; minimizing x² therefore chooses "}<InlineMath>{"\\max(0,2-\\sqrt\\epsilon)"}</InlineMath>{", for 0≤ε≤4."}</Prose>

<Drawing id="C48"/>

<Prose>{"At α=.5 and ε=1, the two formulations both select x=1. Change α to .25 or ε to .25: both now select 1.5 with objectives(2.25, .25). The numerical agreement is specific to these settings. One statement prices a trade-off; the other imposes a requirement. Endpoints α=0 or α=1 and ε=0 or ε=4 remain valid. Switching methods restores its stated default; Reset returns to weighted α=.5."}</Prose>

<Payload file="continuous.py"/><Prose>Recorded output:</Prose><Payload file="continuous.stdout.txt" output/>

<Prose>{"The complete programme validates the parameter interval and prints the actual optimizer and objective pair. Its closed-form result is exact for these functions. Replacing the objective formulas in a different problem requires a new derivation or a solver, not reuse of this expression."}</Prose>

<Drawing id="C49"/>

<Prose>{"The raw objective image is a curve, even though the feasible interval and both objectives are convex. The useful convex object is the "}<strong>{"upper image"}</strong>{": every attainable objective vector plus every coordinatewise nonnegative increment. To prove its convexity, mix the underlying feasible decisions; convexity of each objective puts the new vector no higher than the same mixture of their old vectors. Adding nonnegative slack then reaches any point on the mixed upper-image segment."}</Prose>

<Prose>{"Supporting-hyperplane separation in this convex setting associates a Pareto point with a nonzero nonnegative weight vector. Endpoints can require zero weights, so the earlier tie qualification remains. This explains why convex scalarization behaves differently from the discrete Compact counterexample; it does not turn the unattainable chord of the raw curve into feasible objective values."}</Prose>

<Drawing id="C50"/>

<Prose>{"Use hard bounds for inviolable requirements, exchange rates for meaningful substitutions, and priorities when one goal must be optimized before another. Presenting the frontier itself is appropriate when the preference belongs to a later decision-maker. None of those formulations derives the preference from the word “optimal.” Next we ask a local question that does not require choosing a fixed preference: can one small move improve every objective at once?"}</Prose>

<span id="8-check-local-evidence-and-measurement"/>
<H2>{"8. Find a direction that improves every objective"}</H2>

<Prose>{"For differentiable objectives, a direction d has first-order rates "}<InlineMath>{"g_i^\\top d"}</InlineMath>{", where "}<InlineMath>{"g_i=\\nabla f_i(x)"}</InlineMath>{". If all rates are strictly negative, differentiability ensures improvement for a sufficiently small positive step that remains in the domain. Here begin in an unconstrained open neighborhood; boundaries require a feasible-direction test too."}</Prose>

<Drawing id="C51"/>

<Prose>{"Extend the squared-distance formulas to the whole real line for this local illustration. At x=3 their derivatives are 6 and 2, so a negative direction decreases both. The point x=3 was outside the earlier constrained interval; it is allowed only in this newly stated unconstrained comparison. At x=1 the slopes are 2 and −2. A nonzero scalar direction cannot make both products negative."}</Prose>

<Drawing id="C52"/>

<Prose>{"In more dimensions, form the "}<strong>{"convex hull of the gradients"}</strong>{": all weighted mixtures with nonnegative weights summing to one. Let v be its point of smallest Euclidean norm. With g1=(2, 0), g2=(0, 2), the hull is their segment and its nearest point to zero is(1, 1). The direction d=−v=(−1, −1) gives rate−2 for both objectives."}</Prose>

<Prose>{"For two gradients, parametrize the segment by "}<InlineMath>{"v=g_2+\\alpha(g_1-g_2)"}</InlineMath>{", 0≤α≤1. Differentiating its squared norm gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\alpha=\\operatorname{clip}\\!\\left(\n-\\frac{g_2^\\top(g_1-g_2)}{\\|g_1-g_2\\|^2},0,1\\right)."}</MathBlock></div>

<Prose>{"This α is computed to minimize gradient-hull distance. It is not the externally selected preference weight from the preceding section, although both are convex-mixture coefficients."}</Prose>

<Drawing id="C53"/>

<Prose>{"Projecting zero onto the hull gives "}<InlineMath>{"(g_i-v)^\\top v\\ge0"}</InlineMath>{" for each endpoint. Rearrange:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"g_i^\\top(-v)\\le-\\|v\\|^2."}</MathBlock></div>

<Prose>{"If v≠0, all rates are strictly negative. If v=0, a direction strictly negative for every gradient would make "}<InlineMath>{"v^\\top d=\\sum_i\\alpha_i g_i^\\top d<0"}</InlineMath>{", impossible. Zero hull distance is therefore a first-order obstruction to simultaneous strict improvement."}</Prose>

<Drawing id="C54"/>

<Prose>{"Edit both gradient vectors. Opposite gradients(2, 0)/(−2, 0) put zero on the segment. Identical gradients(1, 1)/(1, 1) collapse it to one point; the denominator in the coefficient formula is zero, but the point and direction remain well-defined. One zero gradient is another instructive case. Reset returns to(2, 0)/(0, 2). The investigation supplies local rates, not a hidden line search or optimized trajectory."}</Prose>

<Prose>{"The complete programme validates equally shaped finite vectors, computes the segment coefficient and prints both directional products. Its identical-gradient branch chooses α=0. The investigation chooses α=.5 for the same case: when g1=g2, every coefficient gives the same v, so these are equivalent representations rather than algorithm disagreement. For distinct gradients, the displayed formula fixes the minimizing coefficient."}</Prose>

<Payload file="commonDescent.py"/><Prose>Recorded output:</Prose><Payload file="commonDescent.stdout.txt" output/>

<Prose>{"The three outputs show a common negative direction for orthogonal positive gradients, a zero direction for opposite scalar gradients, and the nearer endpoint for scalar slopes 6/2. A finite step still needs its actual objective values checked. For more than two objectives, finding the closest hull point becomes a simplex-constrained quadratic problem; this programme implements the fully explained two-gradient case."}</Prose>

<Drawing id="C55"/>

<Prose>{"A first-order obstruction is weaker than an optimum in a nonconvex problem. With "}<InlineMath>{"f_1=f_2=-x^2"}</InlineMath>{" at x=0, both gradients vanish, but x=.1 improves both values from 0 to−.01. Even for convex objectives, "}<InlineMath>{"f_1=0,f_2=x"}</InlineMath>{" admits a zero mixture by placing all weight on the first gradient; decreasing x improves the second while leaving the first unchanged. No point is strongly Pareto optimal, although strict improvement in both is impossible. At a constrained boundary, incorporate feasible directions or normal-cone conditions instead of applying this unconstrained test unchanged."}</Prose>

<H3>{"Optional depth: smooth a maximum without hiding the change"}</H3>

<Prose>{"Another preference asks to control the largest weighted deviation from chosen reference objective values. Write "}<InlineMath>{"a_i(x)=\\lambda_i(f_i(x)-z_i)"}</InlineMath>{", with nonnegative weights and a stated reference vector z. A weighted maximum "}<InlineMath>{"\\max_i a_i(x)"}</InlineMath>{" emphasizes its worst current component but can have a kink where the active component changes. The reference values and weights are part of the preference."}</Prose>

<Prose>{"For a concrete two-component picture, use the already weighted deviations a₁=−x and a₂=x."}</Prose>

<Drawing id="C56"/>

<Prose>{"Their maximum is abs(x), with a corner at zero. Smooth it using positive μ:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"g_\\mu(x)=\\mu\\log\\bigl(e^{-x/\\mu}+e^{x/\\mu}\\bigr)."}</MathBlock></div>

<Drawing id="C57"/>

<Prose>{"Let "}<InlineMath>{"M=\\max_i a_i"}</InlineMath>{". Factoring out "}<InlineMath>{"e^{M/\\mu}"}</InlineMath>{" leaves a sum between 1 and m, where m is the number of components. Taking logs gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"M\\le\\mu\\log\\sum_i e^{a_i/\\mu}\\le M+\\mu\\log m."}</MathBlock></div>

<Prose>{"This is also the stable numerical expression: compute "}<InlineMath>{"M+\\mu\\log\\sum_i e^{(a_i-M)/\\mu}"}</InlineMath>{", rather than overflowing large positive exponentials. For two components, the gap at zero is exactly μ log 2. Compare μ=1 and .2: reducing μ narrows the guaranteed value gap and sharpens the transition."}</Prose>

<Drawing id="C58"/>

<Prose>{"Differentiating gives weights "}<InlineMath>{"w_i=e^{a_i/\\mu}/\\sum_j e^{a_j/\\mu}"}</InlineMath>{" and gradient "}<InlineMath>{"\\sum_i w_i\\lambda_i\\nabla f_i"}</InlineMath>{". In this two-line illustration the slope is "}<InlineMath>{"\\tanh(x/\\mu)"}</InlineMath>{", moving continuously between−1 and 1. The weights respond to current deviations rather than representing a fixed gradient-hull projection."}</Prose>

<Prose>{"For a global minimum of this finite-μ smooth scalarization with strictly positive objective weights, a dominating feasible point would decrease at least one exponential term without increasing any other, contradicting optimality. With zero weights, use the weaker Pareto/tie qualification. Recovering every Pareto point for a fixed smoothing parameter requires stronger assumptions; the local bound and gradient calculation do not establish it. The "}<a href={"https://proceedings.mlr.press/v235/lin24y.html"}>{"ICML 2024 Smooth Tchebycheff paper"}</a>{" develops those richer conditions. Here the extension gives a transparent value/slope comparison, without adding an unexamined optimizer or performance claim."}</Prose>

<Prose>{"We have worked with constructed functions and catalogue entries so every comparison could be traced. Next the same dominance-and-preference operations will act on actual recorded rows, with their cohort definition and missing values visible first."}</Prose>

<H2>{"9. Audit a frontier from recorded data"}</H2>

<Prose>{"The previous catalogue was invented to expose a decision mechanism. Now use recorded rows from the "}<a href={"https://archive.ics.uci.edu/dataset/9/auto+mpg"}>{"UCI Auto MPG dataset"}</a>{", attributed to R. Quinlan (1993), DOI 10.24432/C5859H, under CC BY 4.0. It records historical city-cycle fuel economy and vehicle attributes. We will compare a declared subset of those measurements, without fitting an estimator or predicting future vehicles."}</Prose>

<Drawing id="C59"/>

<Prose>{"The raw file has 398 rows. The 31 rows whose model-year code is 82 have one-based source IDs 368–398. Row 375 has missing horsepower, written "}<code>{"?"}</code>{", so the two-objective comparison retains 30 rows. Missing horsepower is not zero and does not mean a poor measured engine. Excluding that row changes the catalogue we can compare; it does not supply the absent observation."}</Prose>

<Prose>{"Our decision is to select one retained recorded row. Larger miles per gallon and larger horsepower are the two declared objectives. This is a deliberately limited comparison: it omits price, safety, emissions, condition and many other possible requirements. The result describes these historical records under the stated criteria, not a purchasing recommendation or a causal claim about cylinder count."}</Prose>

<Drawing id="C60"/>

<Prose>{"In the physical measurement plane, better is northeast. The previous dominance code minimizes, so supply "}<InlineMath>{"(-\\mathrm{mpg},-\\mathrm{horsepower})"}</InlineMath>{". Negating both coordinates reverses each inequality while preserving the row identity and dominance relation. It changes the representation, not the data or the selected row. Cylinder groups have persistent shape/colour pairs; every plotted entry also keeps its source row ID."}</Prose>

<Prose>{"Impose two hard requirements: cylinder count at most 4 and mpg at least 30. Among the feasible rows, define the selection preference explicitly: greatest horsepower, then greatest mpg, then the smallest source ID as a reproducible tie-break. The frontier and this preferred member are separate outputs."}</Prose>

<Drawing id="C61"/>

<Prose>{"At the initial requirements, 18 rows are feasible and six row IDs are nondominated:377, 381, 384, 386, 391, 395. Their actual values are:"}</Prose>

<NeuralTable caption={"9. Audit a frontier from recorded data"} headers={[<>{"Row ID"}</>,<>{"Recorded name"}</>,<>{"mpg"}</>,<>{"horsepower"}</>]} rows={[[<>{"377"}</>,<>{"mazda glc custom l"}</>,<>{"37"}</>,<>{"68"}</>],[<>{"381"}</>,<>{"nissan stanza xe"}</>,<>{"36"}</>,<>{"88"}</>],[<>{"384"}</>,<>{"honda civic"}</>,<>{"38"}</>,<>{"67"}</>],[<>{"386"}</>,<>{"datsun 310 gx"}</>,<>{"38"}</>,<>{"67"}</>],[<>{"391"}</>,<>{"toyota celica gt"}</>,<>{"32"}</>,<>{"96"}</>],[<>{"395"}</>,<>{"vw pickup"}</>,<>{"44"}</>,<>{"52"}</>]]} />

<Prose>{"The preference selects 391 because its 96 horsepower is largest among the feasible records. Rows 384 and 386 share the same objective vector but remain distinct. The drawing keeps them at their true shared coordinate, with separate labels; moving one for visual convenience would invent a measurement difference."}</Prose>

<Prose>{"Change the cylinder limit to 8 while retaining the mpg floor 30. There are now 19 feasible rows. The newly permitted row 388, oldsmobile cutlass ciera (diesel), has six cylinders, 38 mpg and 85 horsepower. It dominates 377 because both 38>37 and 85>68; it dominates 384/386 because mpg is equal while 85>67 horsepower. The frontier becomes 381, 388, 391, 395, and the preferred row remains 391. Here relaxing a requirement introduces a dominator and removes old frontier members while retaining their recorded values."}</Prose>

<Prose>{"Return to cylinder limit 4 and raise the mpg floor to 40: only 395 remains, with 44 mpg and 52 horsepower. At floor 50 the result is empty. An empty feasible catalogue is a valid outcome. The original/negated coordinate switch preserves all memberships and preferences. Reset restores 4 cylinders, 30 mpg and the original coordinate view."}</Prose>

<Drawing id="C62"/>

<Prose>{"The scratch route applies the same pairwise "}<code>{"all"}</code>{" and "}<code>{"any"}</code>{" test used earlier. The NumPy route creates an array with shape "}<InlineMath>{"[n,n,2]"}</InlineMath>{": its first index is a potential dominator, second index the target, and last index the objective. "}<code>{"all(axis=2)"}</code>{" tests no-worse across objectives; "}<code>{"any(axis=2)"}</code>{" tests at least one strict improvement. Their conjunction gives the dominance matrix. Reducing "}<code>{"any(axis=0)"}</code>{" asks whether any row dominates each target column. The negation selects frontier indices."}</Prose>

<Prose>{"That axis direction matters. Reducing over the target index instead would report whether a candidate dominates somebody, a different question. For duplicate 384/386, both no-worse comparisons are true but neither strict comparison is, so neither deletes the other."}</Prose>

<Prose>{"Save the complete programme as "}<code>{"auto_mpg_pareto.py"}</code>{" and the supplied unchanged UCI raw file as "}<code>{"auto-mpg.data"}</code>{" beside it. Use "}<code>{"numpy==2.3.5"}</code>{", then run "}<code>{"python auto_mpg_pareto.py"}</code>{". It reads the local file, retaining the quoted vehicle name with "}<code>{"shlex.split"}</code>{" and its original one-based row number. The programme needs no network, random sample or model fit."}</Prose>

<Payload file="auto_mpg_pareto.py"/><Prose>Recorded output:</Prose><Payload file="auto_mpg_pareto.stdout.txt" output/>

<Prose>{"The four reported cases match the memberships and selected values above. The final line records agreement between scratch and NumPy for 255 states: five supported cylinder limits times 51 integer mpg floors from 0 to 50. Six deliberately invalid objective-vector cases are rejected. This is a finite domain check, not a claim about unseen vehicle measurements or every possible input. The programme writes its complete data-bound state results to "}<code>{"auto_mpg_pareto.results.json"}</code>{"; the live investigation displays the retained finite states."}</Prose>

<Prose>{"Both comparison routes require O(n²m) work for m objectives. Scratch pair comparisons use the input storage plus a small result; broadcasting materializes O(n²m) temporary comparisons. For 30 rows and two objectives this makes the ordinary library operation easy to inspect. At a much larger catalogue, memory as well as arithmetic can influence the chosen method."}</Prose>

<Prose>{"The catalogue's provenance, missing row and finite target remain part of the answer. A preference can be perfectly implemented while using a measurement that does not express the intended requirement. We finish by examining that separate risk."}</Prose>

<H2>{"10. Check what the measurement rewards"}</H2>

<Prose>{"“Latency below 25 ms” is incomplete without saying which latency summary, workload, hardware and concurrency conditions are meant. A mean, a median, a percentile and a maximum ask different questions. Optimization will honor the quantity we actually encode."}</Prose>

<Prose>{"Suppose 90 observed requests take 10 ms each and 10 take 100 ms each. Under the "}<strong>{"nearest-rank percentile"}</strong>{" convention, sort n observations and select one-based rank "}<InlineMath>{"\\lceil pn\\rceil"}</InlineMath>{". For p=.95 and n=100, that is the 95th observation in increasing order. Compare that rank with the mean, which averages all 100 times."}</Prose>

<Drawing id="C63"/>

<Prose>{"Their mean is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\frac{90(10)+10(100)}{100}=19\\text{ ms}."}</MathBlock></div>

<Prose>{"This passes a 25 ms mean requirement. Rank 95 falls in the 100 ms group, so p95 is 100 ms and fails a 25 ms p95 requirement. Both calculations are correct; the requirements differ."}</Prose>

<Prose>{"Change the sample to 98 requests at 10 ms and two at 200 ms. The mean is 13.8 ms, rank 95 is 10 ms, and rank 99 is 200 ms. A p95 limit can permit substantial slower tail observations. Other percentile interpolation conventions can differ on small samples, so state the convention and sample scope. These empirical values do not establish future latency guarantees."}</Prose>

<Drawing id="C64"/>

<Prose>{"For two equally sized groups, system A has accuracies (.95, .55), while B has (.80, .68). A's mean is .75 and worst-group accuracy .55. B's mean is .74 and worst-group accuracy .68. A wins the mean comparison; B wins the minimum comparison. The objective decides which compromise is preferred. Neither single summary constitutes a complete fairness definition; populations, errors, measurement uncertainty and the policy goal still need to be stated."}</Prose>

<Prose>{"The programme computes these quantities directly. "}<code>{"statistics.mean"}</code>{" supplies the arithmetic mean, while the explicit nearest-rank function makes the percentile convention inspectable. It uses no fitted distribution."}</Prose>

<Payload file="measurement.py"/><Prose>Recorded output:</Prose><Payload file="measurement.stdout.txt" output/>

<Prose>{"The outputs match the 19 ms mean, 100 ms p95 and the two group comparisons. When adapting the programme, change the requirement and its interpretation together. A sampled frontier from a heuristic search likewise describes the explored candidates; it cannot establish that every globally better decision was considered."}</Prose>

<Prose>{"The same discipline applies to a robot balancing energy and tracking error under actuator bounds, an image reconstruction balancing data fit and roughness under nonnegativity, or a compiler comparing program size and execution time. In each case identify the actual decision set, objective units, constraints, preference and validation measurements. The mathematics makes that contract precise; it does not choose the contract for us."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><span id="9-practise-and-connect"/>
<H2>{"11. Practise changing the decision"}</H2>

<Prose>{"State the feasible set, objective or objective vector, units and tolerance before calculating. Work independently before opening the hint and solution. A changed case should explain why the result follows, not merely reproduce an expected number."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Repair a changed coupled projection"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Project v=(0.5, 3) onto x≥0, x₁+x₂=2. Compare both separate orders and compute the exact minimum squared distance."}</Prose>

<Prose>{""}<strong>{"Implementation extension."}</strong>{" Reconstruct the two-coordinate joint projection from its contract, without calling "}<code>{"projection.py"}</code>{". For finite v and B>0, implement the clipped segment coordinate. Check the task's target and the new target v=(−1,0), B=2. Explain why clamp-then-project is an incorrect replacement."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use t=(v₁−v₂+B)/2 before clipping. Then calculate both individual projection orders."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"With v=(0.5, 3), B=2, the unconstrained t is −0.25, so the joint projection is (0, 2), with squared distance 0.25+1=1.25. Clamping first changes nothing; line projection then yields (−0.25, 2.25), violating nonnegativity. Line projection then clamping yields (0, 2.25), violating the sum. Acceptance: the joint result has nonnegative coordinates, exact sum 2, and no other t∈[0, 2] lowers the convex one-variable distance."}</Prose>

<Prose>{""}<strong>{"Worked implementation."}</strong>{""}</Prose>

<CodeBlock language={"python"}>{"def joint_projection_2d(v, budget):\n    # Contract: two finite coordinates and a positive finite budget.\n    t = min(budget, max(0.0, (v[0] - v[1] + budget) / 2))\n    return t, budget - t"}</CodeBlock>

<Prose>{"The changed target (−1,0) gives t=.5 and output (.5,1.5), with sum 2 and squared distance 4.5. The original task gives (0,2). The function minimizes the one-variable strictly convex distance on [0,B], so both requirements hold simultaneously. A sequential repair can break the requirement that the preceding operation satisfied."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Change the penalty problem, not just the slider"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Move the center to 4, keeping the bound 1. Find a squared penalty giving violation at most 0.1, the exact hinge threshold, and the barrier optimum at τ=4."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Replace the unconstrained center 3 by 4. The derivative of the original cost at the bound is now −3."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"For ½(x−4)² with x≤1, the hard optimum is x=1 with cost 4.5. The squared-penalty optimum is 1+3/(1+μ); violation≤0.1 requires μ≥29. The hinge becomes exact for ρ≥3. With barrier τ=4, write d=1−x; d²+3d=4 gives d=1 and x=0. That is strictly feasible with original cost 8, not the hard optimum. Check all values against the modified objective derivative or hinge subgradient."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Trace a different consensus update"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Use c=(1.5, −0.5), B=1 and ρ=1. Calculate the first x, z, u and both residuals. Explain why a correct primal answer and a failed numerical stopping test can coexist at this frame."}</Prose>

<Prose>{""}<strong>{"Debugging extension."}</strong>{" A refactor computes the z update from "}<code>{"x_old + u_old"}</code>{" after calculating "}<code>{"x_new"}</code>{". Repair that data dependency, then reconstruct one complete step for the task's changed c. Keep old z for the dual residual."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Start with x⁰=z⁰=(0.5, 0.5), u⁰=0. Remember that z¹ uses the new x¹."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"For c=(1.5, −0.5), ρ=1, B=1, x¹=(1, 0). Its sum is already 1, so z¹=(1, 0) and u¹=(0, 0). Primal norm is zero, but the dual vector is −(z¹−z⁰)=(−0.5, 0.5), with norm √0.5≈0.707107. One small residual is insufficient. The exact projection is (1, 0); this special run has reached the primal optimum at its first update while its standard dual stopping test has not yet passed. At the next update x becomes (1.25, 0) and z becomes (1.125, −0.125): the copies move away from that first primal answer while the multiplier adjusts. Agreement and primal location alone did not establish the full optimality conditions."}</Prose>

<Prose>{""}<strong>{"Worked repair."}</strong>{""}</Prose>

<CodeBlock language={"python"}>{"def consensus_step(c, budget, rho, z_old, u_old):\n    x_new = tuple(max(0.0, (ci + rho * (zi - ui)) / (1 + rho))\n                  for ci, zi, ui in zip(c, z_old, u_old))\n    incoming = tuple(xi + ui for xi, ui in zip(x_new, u_old))\n    correction = (sum(incoming) - budget) / 2\n    z_new = tuple(value - correction for value in incoming)\n    primal = tuple(xi - zi for xi, zi in zip(x_new, z_new))\n    u_new = tuple(ui + ri for ui, ri in zip(u_old, primal))\n    dual = tuple(-rho * (zi - old) for zi, old in zip(z_new, z_old))\n    return x_new, z_new, u_new, primal, dual"}</CodeBlock>

<Prose>{"Its contract is the lesson's finite two-coordinate fixture with B>0 and rho>0. For c=(1.5,−.5), B=1, rho=1, z_old=(.5,.5), u_old=(0,0), it returns x_new=z_new=(1,0), u_new=primal=(0,0), dual=(−.5,.5). The erroneous old-x input instead leaves z at (.5,.5), manufacturing disagreement (.5,−.5). The repair follows the ordered subproblem minimizations; copying the right index is part of the algorithm. A stopping implementation must require both residual-norm comparisons, and must mark the dual residual unavailable before any update."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Separate duplicate, dominated and unsupported choices"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Add an M-copy with identical metrics. Identify the frontier, then choose minimum error subject to latency≤15 ms and memory≤40 MB. What changes if memory rises to 48 MB?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the strict part of dominance. Recover Compact by a latency bound, then apply the memory bound independently."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"With all five original candidates feasible, S, C, M, L are nondominated and G is dominated. A second implementation with the same metrics as M is also nondominated; it does not strictly dominate M. Under latency≤15 ms and memory≤40 MB, Compact fails memory and Small is selected. Raising memory to 48 MB makes Compact feasible and it wins on error. Compact’s weight inequalities p≤1/7 and p≥1 remain incompatible without those filters; feasibility changes the comparison set."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Keep an exchange rate consistent across two unit changes"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Rewrite the price 0.2 error percentage points per millisecond using error fractions and latency in seconds. Verify Medium’s score and ranking."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Changing error from percentage points to a fraction divides the whole score by 100; changing latency to seconds multiplies its numerical coefficient by 1000."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"The original score is E_points+0.2L_ms. Dividing by 100 gives E_fraction+0.002L_ms. Since L_ms=1000L_s, the equivalent fractional-error score is E_fraction+2L_s. Medium has 0.08+2·0.018=0.116, the original 11.6 divided by 100. Acceptance: all models’ scores transform by the same positive factor and their ranking is unchanged."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Recover one point using two preference languages"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Choose x=0.5 in the continuous example using a weight and an epsilon bound. Explain why every point on that curve is Pareto."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The weighted optimum is 2(1−α); the epsilon optimum is 2−√ε on the stated range."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"For x=0.5, α=0.75 and ε=(0.5−2)²=2.25. Both select objectives (0.25, 2.25). The weight expresses an exchange between objectives; the bound expresses a requirement on the second. Every x∈[0, 2] is Pareto because a strict decrease in x improves x² and worsens (x−2)², and a strict increase reverses that. A finite sampling plot alone would not prove the statement between samples."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Challenge a first-order certificate and a metric claim"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Disprove “a zero gradient mixture proves Pareto optimality.” Then compute mean, nearest-rank p95 and p99 for 98 requests at 10 ms and two at 200 ms."}</Prose>

<details><summary>Hint</summary>

<Prose>{"A zero gradient can hide a maximum. A percentile is a rank of observations, not their arithmetic average."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"For both objectives −x² at 0, both gradients vanish. Moving to x=0.1 gives both values −0.01 instead of 0, so the point is dominated. For 98 latencies of 10 ms and two of 200 ms, the mean is (980+400)/100=13.8 ms and nearest-rank p95 is 10 ms; nearest-rank p99 is 200 ms. A p95≤25 statement permits this p99 failure and does not guarantee that every request is below 25 ms. Report the exact metric and sample scope."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Change the feasible budget"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Set c=(2, −1), h=(1, 1), and s=.5. Compare projection, projected descent and SLSQP. Then give SLSQP an equality that contradicts its bounds."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Solve the equal-curvature projection on the new segment before calling the general solver. Inspect every stated feasibility residual."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"The feasible optimum is (.5, 0). The mapping is zero although the ordinary gradient is not. A contradictory equality must produce a failure or infeasible residual; never report only the returned coordinates as a successful solution. Check sum, nonnegativity and the original objective after every changed constraint."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Distinguish a maximum budget from a compulsory total"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Project v=(.1, .1) with B=1, first onto nonnegative allocations summing to at most B, then onto nonnegative allocations summing to exactly B. Derive the shared threshold for the equality problem. Why is an early return appropriate for one and wrong for the other?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The target already satisfies the inequality. For the equality, subtract a common threshold from both positive entries and require their sum to be one."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"The inequality projection is (.1, .1), distance zero. For the equality, "}<InlineMath>{".1-\\tau+.1-\\tau=1"}</InlineMath>{" gives τ=−.4, hence (.5, .5). Both coordinates remain positive, so this active-set assumption is valid. Squared distance is 2(.4²)=.32. Strict convexity on the segment makes this the unique closest feasible point. The inequality's inactive-budget branch returns the target because it is already allowed; the same return would leave a deficit of .8 under the equality. A negative equality threshold can be necessary, not a validation failure."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Compute a common direction instead of guessing an average"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" With g1=(3, 0), g2=(0, 1), derive the closest segment point, its coefficient α on g1, and a direction strictly downhill for both. Then explain what changes for opposite gradients and at a constrained boundary."}</Prose>

<Prose>{""}<strong>{"Implementation extension."}</strong>{" Implement the two-gradient coefficient from the segment distance, without calling "}<code>{"commonDescent.py"}</code>{". Handle coincident endpoints and clipping. Check the task's pair, the endpoint case g₁=(2,0), g₂=(4,0), and identical endpoints (1,1)."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use v=(3α, 1−α) and minimize its squared norm. Check both dot products using the resulting d=−v."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"The squared norm is 9α²+(1−α)², derivative 20α−2. Thus α=.1, inside the allowed interval, and v=(.3, .9). Its negative d=(−.3, −.9) gives g1·d=−.9 and g2·d=−.9. The squared norm of v is .09+.81=.9, matching the projection bound exactly for these endpoints. The unweighted average (1.5, .5) is not the closest point."}</Prose>

<Prose>{"For opposite gradients, the segment contains zero, so no direction has both first-order rates strictly negative. At a constrained boundary, even a common negative rate may point outside the feasible set; inspect feasible directions and the relevant normal condition. A small feasible step must still be checked against the actual objective functions."}</Prose>

<Prose>{""}<strong>{"Worked implementation."}</strong>{""}</Prose>

<CodeBlock language={"python"}>{"def common_direction(g1, g2):\n    # Contract: two finite two-coordinate gradients.\n    edge = tuple(a - b for a, b in zip(g1, g2))\n    denominator = sum(value * value for value in edge)\n    alpha = 0.5 if denominator == 0 else min(1.0, max(0.0,\n        -sum(b * delta for b, delta in zip(g2, edge)) / denominator))\n    closest = tuple(b + alpha * delta for b, delta in zip(g2, edge))\n    direction = tuple(-value for value in closest)\n    rates = tuple(sum(a * b for a, b in zip(g, direction)) for g in (g1, g2))\n    return alpha, direction, rates"}</CodeBlock>

<Prose>{"For the task's pair, alpha=.1 and d=(−.3,−.9), giving both rates −.9. For (2,0)/(4,0), the unconstrained coefficient is 2, so clipping gives alpha=1, d=(−2,0), rates (−4,−8). For identical (1,1) endpoints, alpha=.5 represents v=(1,1), giving d=(−1,−1) and rates (−2,−2). Any coefficient describes the same point in that last case. Opposite gradients instead yield v=0 and zero rates; coincident endpoints alone do not imply a zero direction."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Explain a recorded frontier change"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" In the Auto MPG catalogue, compare cylinder limits 4 and 8 at minimum 30 mpg. Report the cohort and missing-row exclusion, explain exactly which old frontier members are lost, and state whether the preferred row changes. What happens at the 4-cylinder, 50 mpg requirement?"}</Prose>

<Prose>{""}<strong>{"Debug a changed catalogue."}</strong>{" Minimize both coordinates of A=(2,5), B=(4,3), C=(2,5), D=(5,6). A NumPy attempt builds "}<code>{"no_worse = (values[:, None, :] <= values[None, :, :]).all(axis=2)"}</code>{" and returns "}<code>{"~no_worse.any(axis=1)"}</code>{". Identify both defects, repair the reduction, and compare against an independently written pairwise loop. Then change the observed 4-cylinder/30-mpg preference to greatest mpg, followed by greatest horsepower and smallest row ID."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare the actual mpg/horsepower pair of newly feasible 388 against 377, 384 and 386. Keep equal-valued 384 and 386 as separate row IDs."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"The source contains 398 rows, 31 from year 82, and one of those, 375, lacks horsepower, leaving 30 comparison rows. The 4/30 state has 18 feasible rows and frontier 377, 381, 384, 386, 391, 395. Increasing the cylinder limit allows 388=(38 mpg, 85 hp), making 19 feasible rows. It dominates 377=(37, 68) by improving both values and dominates both 384 and 386=(38, 67) by equal mpg and larger horsepower. The new frontier is 381, 388, 391, 395."}</Prose>

<Prose>{"The declared greatest-horsepower preference still selects 391=(32, 96). Under 4/50 no recorded row is feasible, so no row is selected. A duplicate metric vector does not erase a row, and a missing horsepower value is not a zero to be ranked. These comparisons describe the declared historical catalogue rather than a future population or causal engine-design effect."}</Prose>

<Prose>{""}<strong>{"Worked repair."}</strong>{" The first array axis is the possible dominator; the second is its target. Strict dominance also requires an improvement in at least one coordinate. Without that requirement, self-comparisons and duplicates falsely dominate; reducing across targets instead of dominators asks the wrong question."}</Prose>

<CodeBlock language={"python"}>{"import numpy as np\n\ndef frontier_mask(values):\n    # Contract: a finite nonempty n-by-m numeric array with m >= 1.\n    values = np.asarray(values, dtype=float)\n    no_worse = (values[:, None, :] <= values[None, :, :]).all(axis=2)\n    strict = (values[:, None, :] < values[None, :, :]).any(axis=2)\n    dominates = no_worse & strict\n    return ~dominates.any(axis=0)"}</CodeBlock>

<Prose>{"The mask is [True, True, True, False]. A and C are separate retained decisions with equal objective vectors; B is incomparable with both. D is dominated by A, B and C. A scratch comparison must test each target against every *other* candidate using all-no-worse and any-strict; it reaches the same mask. In the observed catalogue, the new preference chooses row 395=(44 mpg,52 hp), while the previously declared horsepower-first preference chose 391. Feasibility and the frontier remain unchanged: this variation changes the choice rule, not the measurements or dominance relation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Prove the smooth-max gap"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" For a1=−x, a2=x and μ=.2, prove that the smooth function differs from abs(x) by at most .2 log 2, identify an equality case, and derive its slope. Does this prove that every Pareto point can be recovered with a fixed smoothing parameter?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Factor out the exponential of the larger component. For the derivative, compare the positive and negative exponentials."}</Prose>

</details>

<details><summary>Solution and checks</summary>

<Prose>{"Let M=abs(x). The factored sum "}<InlineMath>{"e^{(-x-M)/.2}+e^{(x-M)/.2}"}</InlineMath>{" lies between 1 and 2. Multiplying its logarithm by .2 proves "}<InlineMath>{"0\\le g_{.2}(x)-M\\le.2\\log2"}</InlineMath>{". At x=0 both exponentials equal 1, so the upper gap is attained. Differentiation gives "}<InlineMath>{"(e^{5x}-e^{-5x})/(e^{5x}+e^{-5x})=\\tanh(5x)"}</InlineMath>{", zero at the origin and approaching±1 far away."}</Prose>

<Prose>{"The calculation establishes the approximation and slope for these stated functions. It does not establish unrestricted frontier recovery in arbitrary optimization problems. Such a claim would need the relevant theorem's objective/front regularity, weight and parameter assumptions."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Reflect on a different requirement"}</H3>

<Prose>{"Choose a decision you care about. Write one quantity as a hard constraint, then as a penalty or preference, and explain how the allowed answer changes. Name a measurement or uncertainty that the formulation leaves out. A useful result can be “no supplied candidate meets the requirement, ” provided the requirement and evidence are explicit."}</Prose></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Keep these distinctions when reporting an answer"}</H3>

<ul><li>{"Feasibility concerns every requirement simultaneously; a low cost outside the set does not compete with an allowed solution."}</li><li>{"A projected mapping measures the applied feasible step. A nonzero ordinary gradient can be correct at a constrained optimum."}</li><li>{"A penalty, barrier and hard constraint solve different problems. Numerical stopping tolerances have units and consequences."}</li><li>{"Splitting keeps local operations easy while agreement and stationarity are monitored separately."}</li><li>{"A Pareto frontier retains compromises. Weights, bounds and priorities state the additional preference used to choose one."}</li><li>{"Recorded rows, model assumptions and measurement definitions determine the scope of an optimization result."}</li></ul></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Complete files and setup"}</H3>

<Prose>{"Every source below is complete, including its imports and executable statements. Use Python 3.12; programmes importing NumPy used 2.3.5, and the SLSQP bridge used SciPy 1.18.1. Run "}<code>{"python filename.py"}</code>{" in the selected environment. Put "}<code>{"auto-mpg.data"}</code>{" beside its programme. The saved outputs are observations of the stated calculations; last digits can depend on package versions and floating-point arithmetic."}</Prose>

<NeuralTable caption={"Complete files and setup"} headers={[<>{"Complete file"}</>,<>{"Teaching use"}</>]} rows={[[<>{"selection.py"}</>,<>{"Filter the original three-model catalogue"}</>],[<>{"projection.py"}</>,<>{"Joint projection and failed one-pass orders"}</>],[<>{"projectedGradient.py"}</>,<>{"Projected-gradient mapping"}</>],[<>{"penalties.py"}</>,<>{"Penalty and barrier optima"}</>],[<>{"admm.py"}</>,<>{"Exact two-block ADMM"}</>],[<>{"pareto.py"}</>,<>{"Scratch nondominance with duplicates"}</>],[<>{"unsupported.py"}</>,<>{"Unsupported Compact and epsilon selection"}</>],[<>{"units.py"}</>,<>{"Unit-consistent weights"}</>],[<>{"continuous.py"}</>,<>{"Continuous preference formulas"}</>],[<>{"commonDescent.py"}</>,<>{"Two-gradient common direction"}</>],[<>{"measurement.py"}</>,<>{"Mean, percentile and group measurement"}</>],[<>{"simplex-solver-bridge.py"}</>,<>{"General equality-simplex projection, PGD and SciPy SLSQP"}</>],[<>{"auto_mpg_pareto.py"}</>,<>{"Observed catalogue through scratch and NumPy"}</>],[<>{"auto-mpg.data"}</>,<>{"Unchanged UCI raw observations; place beside auto_mpg_pareto.py"}</>],[<>{"auto_mpg_pareto.results.json"}</>,<>{"Saved exact 255-state catalogue results"}</>],[<>{"auto-mpg-source.json"}</>,<>{"UCI source, license, acquisition and raw-data hash"}</>]]} />

<Prose>{"The Auto MPG download includes its data provenance and attribution. Its result file contains the finite state grid behind the recorded-data investigation. The programme writes that file from the same raw input when run locally; no claim of fresh browser fitting is involved."}</Prose>

<Prose><a href="/learn-assets/constrained-optimization/auto-mpg.data" download>Download raw Auto MPG data</a>{' · '}<a href="/learn-assets/constrained-optimization/auto-mpg-source.json" download>Download source and attribution</a>{' · '}<a href="/learn-assets/constrained-optimization/auto_mpg_pareto.results.json" download>Download recorded catalogue results</a></Prose></div></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://see.stanford.edu/Course/EE364A/89"}>{"Stephen Boyd, EE364A Lecture 7"}</a>{" provides a university-level alternative explanation: bookmarks 27:23 for vector objectives, 33:10 for Pareto comparisons and 54:48 for scalarization. The relevant "}<a href={"https://see.stanford.edu/materials/lsocoee364a/transcripts/ConvexOptimizationI-Lecture07.html"}>{"transcript"}</a>{" passages and bookmarks were read; full video playback was not performed. Compare its supporting-line picture with Compact's two incompatible inequalities."}</li><li>{""}<a href={"https://web.stanford.edu/~boyd/papers/pdf/springer_15_lect2.pdf"}>{"Boyd's distributed-optimization slides"}</a>{" extend the local-copy picture to consensus and exchange. Read them after tracing the three concrete updates; historical application timings are not current performance guidance."}</li><li>{""}<a href={"https://proceedings.mlr.press/v235/lin24y.html"}>{"Smooth Tchebycheff Scalarization, Lin et al., ICML 2024"}</a>{" develops the optional smooth-max direction. Begin with its value/gradient construction, then inspect the stronger theorem assumptions before generalizing a frontier-recovery statement."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references and ordinary tools"}</H3>

<ul><li>{""}<a href={"https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf"}>{"Boyd and Vandenberghe, Convex Optimization"}</a>{", §4.7 and§11.2: vector order, weighted support and logarithmic barriers. These sections explain the positive-versus-nonnegative weight distinction and strict interior domain used here."}</li><li>{""}<a href={"https://web.stanford.edu/~boyd/papers/pdf/admm_distr_stats.pdf"}>{"Boyd et al., Distributed Optimization and Statistical Learning via ADMM"}</a>{", §§3.1–3.3: scaled updates, convex assumptions, residuals and stopping thresholds. Match its general Ax+Bz=c notation to A=I, B=−I before transferring a formula."}</li><li>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html"}>{"SciPy SLSQP reference"}</a>{": objective/jacobian arguments, equality constraints and termination controls. Compare its reported status with feasibility and mapping residuals on the identical fixture."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/9/auto+mpg"}>{"UCI Auto MPG"}</a>{": schema, historical provenance and CC BY 4.0 attribution. Use the source row identifiers and declared missing-value handling to reproduce the finite catalogue."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Where to go next"}</H3>

<Prose>{"You are ready to continue when you can explain an infeasible low-cost proposal, trace one projection or agreement update, derive one changed preference result and report what the measurements mean. The next mathematics topic, "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations"}>{"Probability Distributions & Bayes' Theorem"}</a>{", supplies the next layer: representing uncertain quantities and updating them with evidence before turning them into optimization inputs."}</Prose></section></div>;}
