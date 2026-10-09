// Generated from the immutable accepted OT content projection. See scratch/generate-ot-private-r1.mjs.
import {Prose as BaseProse,H2,H3,CodeBlock} from '../content';
import {Children,Fragment} from 'react';
import {Math as InlineMath,MathBlock} from '../content/Math.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import Drawing from './TransportReadingDrawings.jsx';
import './optimal-transport-reading.css';
function Prose({children,...props}){return <BaseProse {...props}>{Children.map(children,child=>typeof child==='string'?child.split(/(,)/).map((part,i)=><Fragment key={i}>{part}{part===','&&<wbr/>}</Fragment>):child)}</BaseProse>;}
const base='/learn-assets/optimal-transport/';
function Programme({file}){return <section className="ot-programme" data-programme={file}><RemoteCodeBlock source={base+file} filename={file} language="python"/><RemoteCodeBlock source={base+file+'.stdout.txt'} filename={file+'.stdout.txt'} language="output"/></section>;}
function DataFiles(){return <ul className="ot-data-files">{["sleep-pairs.csv","sleep.R","sleep.Rd","R-datasets-DESCRIPTION.in","sleep-provenance.json","R-COPYING"].map(file=><li key={file}><a href={base+file} download>{file}</a></li>)}</ul>;}
export default function TransportReadingLesson(){return <div className="lesson-pilot lesson-flow optimal-transport-lesson ot-reading"><Prose opening="summary">{"Two services finish jobs at different times. One shifts most jobs a little later; another leaves almost everything unchanged but has a few very late jobs. A difference between histogram heights misses how far probability moved. We will build a complete movement ledger, prove when it is cheapest, then examine a fast approximation and the assumptions it changes."}</Prose>

<Prose opening="route">{"For a first pass, read stages 1–4, then 6–8 and 12. Run the feasible-plan, dual-price, cumulative-gap and scaling investigations as you encounter them; their current results are visible immediately. Return to stages 5 and 9–11 for maps, soft mass, barycentres and intrinsic geometry. Deeper proofs stay in the reading flow. The section index lists all twelve stages; practice, further learning and technical references follow them."}</Prose>

<Prose opening="prerequisites">{"You need weighted averages, matrices, probability mass and basic derivatives. "}<a href={"/learn/topic/measure-theory-probability-spaces"}>{"Measure Theory & Probability Spaces"}</a>{" develops joint laws, pushforwards and conditional expectation; we reconstruct each on finite points here. "}<a href={"/learn/topic/convex-duality-lagrangian-methods-kkt-conditions"}>{"Convex Duality, Lagrangian Methods & KKT Conditions"}</a>{" explains lower bounds from prices. "}<a href={"/learn/topic/conditioning-stability-numerical-analysis"}>{"Conditioning, Stability & Numerical Analysis"}</a>{" supplies floating-point range. Entropy and log-sum-exp are defined before use here."}</Prose>

<Prose>{"The small geometric fixtures are constructed for exact reasoning. Stage 12 also compares the two empirical sleep-change distributions in the openly licensed R "}<code>{"sleep"}</code>{" data, retaining all ten participant IDs and both observations. Its observed pairing helps us distinguish a minimum-cost mathematical coupling from the pairing actually recorded."}</Prose>

<Prose opening="exploration">{"Save each complete Python listing under its displayed filename. The standard-library programmes need Python 3; the array and library routes use the tested NumPy 2.3.5, SciPy 1.18.1 and POT 0.9.7 environment. The file index includes full source, numeric output and the real-data files with provenance and licence. Browser investigations compute their own small models; running these Python files is a separate way to inspect and modify the algorithms."}</Prose>

<DataFiles/>

<H2>{"1. A distribution has locations as well as weights"}</H2>

<Prose>{"A probability law can be a set of locations with an amount attached to each. Put half the probability at time 0 and half at time 2. The two masses add to one; they describe proportions, rather than a count of two jobs. Read the disk areas and the labelled axis together."}</Prose>

<Drawing id="OT01"/>

<Prose>{"Write this law as α=½δ₀+½δ₂. The symbol δₓ means all probability at location x. A disk with twice the mass has twice the area, not twice the radius. If the second weight becomes zero, its location stays labelled and its disk becomes empty. Both "}<code>{"[.5,.5]"}</code>{" and the locations are necessary to specify the law."}</Prose>

<Prose>{"Now compare that source with β=½δ₀+½δ₁. The target at 1 lies halfway between the source positions 0 and 2. Locate the four labelled atoms on equal-unit axes before following any connecting lines."}</Prose>

<Drawing id="OT02"/>

<Prose>{"The labels A 0/A 1 and B 0/B 1 identify source and target atoms. Their shapes distinguish the two laws; a source identity retains its hue in its outgoing routes and matrix row. A selected route gains an outline. This lets colour explain correspondence while numbers and shape still carry the distinction. Splitting the mass at one location into two identically located records changes its representation, not the underlying law."}</Prose>

<Prose>{"Imagine retaining the half already at 0 and moving the other half from 2 to 1. Follow that one packet, and separate its mass from the length it travels."}</Prose>

<Drawing id="OT03"/>

<Prose>{"The work is mass times cost per unit: ½×|2−1|=½. Sending the same packet from 2 to 0 instead costs½×2=1. In general, a supplied route cost may represent money or another declared penalty. Here it is ordinary distance on the time axis. The drawing’s actual axis positions encode that distance; the spacing between two schematic lists later will only organize labels."}</Prose>

<Prose>{"A deterministic reassignment must send a given input location to one output location. What if all source mass starts at 0, but half must end at−1 and half at 1?"}</Prose>

<Drawing id="OT04"/>

<Prose>{"No function T can give T(0) two values. A "}<strong>{"Monge map"}</strong>{" requires one destination per source location; a "}<strong>{"coupling"}</strong>{" can split mass. The split costs 1 under squared distance: ½(−1)²+½(1)²=1. This is why the more flexible table formulation is useful even before discussing algorithms."}</Prose>

<Prose>{"The table records a joint law. Its horizontal and vertical projections recover the two distributions. Look at the complete rectangle and its marginal bands."}</Prose>

<Drawing id="OT05"/>

<Prose>{"Let Pᵢⱼ be the mass travelling from xᵢ to yⱼ. Every entry is nonnegative, each row spends exactly its source supply, and each column receives exactly its target requirement:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"P_{ij}\\ge0,\\qquad \\sum_jP_{ij}=a_i,\\qquad \\sum_iP_{ij}=b_j."}</MathBlock></div>

<Prose>{"The feasible set Π(a,b) is all such tables. It is nonempty for probability weights: the product Pᵢⱼ=aᵢbⱼ has the required sums. Compare this independent coupling with the diagonal ledger."}</Prose>

<Drawing id="OT06"/>

<Prose>{"The product has four entries¼ and cost¼(0+1+2+1)=1. The diagonal entries½,½ cost½. Both reproduce the same marginals, but they encode different dependence. Observing two marginal distributions does not reveal which pairing occurred in reality. Optimal transport chooses a pairing for the stated cost question."}</Prose>

<Prose>{"For comparison, moving δ₀ to δ₀.₂ or to δ₂ gives distance costs .2 and 2. Total variation detects disjoint supports in both cases; KL from the reference atom is infinite when the other law assigns that atom zero mass. These quantities answer different questions. Numeric category IDs do not supply a meaningful geometry merely because they can be subtracted."}</Prose>

<H2>{"2. Spend every source unit and certify the result"}</H2>

<Prose>{"We now need the complete ledger, including routes carrying no mass. Match each route with its matrix cell and both required totals."}</Prose>

<Drawing id="OT07"/>

<Prose>{"For source locations(0,2), target locations(0,1) and half weights, the cost matrix and diagonal plan are"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"C=\\begin{bmatrix}0&1\\\\2&1\\end{bmatrix},\\qquad P=\\begin{bmatrix}1/2&0\\\\0&1/2\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The cost is the entrywise weighted sum ⟨C,P⟩=ΣᵢⱼCᵢⱼPᵢⱼ. Zero cells have no positive-width ribbon. A faint labelled route may establish an available connection, but it must not pretend to carry mass."}</Prose>

<Prose>{"Rather than guessing four entries independently, choose the upper-left entry t and let the marginal equations determine the rest."}</Prose>

<Drawing id="OT08"/>

<Prose>{"Let a₀ be the first source weight and b₀ the first target weight. Then"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"P(t)=\\begin{bmatrix}t&a_0-t\\\\b_0-t&1-a_0-b_0+t\\end{bmatrix},\\quad \\max(0,a_0+b_0-1)\\le t\\le\\min(a_0,b_0)."}</MathBlock></div>

<Prose>{"Each bound is the nonnegativity condition of a cell. At a₀=b₀=.5, the interval is[0,.5]. At a₀=.6,b₀=.3 it is[0,.3]. If the two ends coincide, there is only one feasible table; a motionless result then expresses a constraint rather than a broken control."}</Prose>

<Prose>{"Change the first source and target weights, then move the feasible fraction. The current interval converts that fraction into an actual t; select a cell to trace its mass and cost."}</Prose>

<Drawing id="OT09"/>

<Prose>{"Start at the original diagonal plan. The minimum-cost action chooses the appropriate interval endpoint for the selected cost table. Reset restores both weights, the cost rule, the fraction and the selected cell. Try a zero first source weight: its complete row becomes zero, while the remaining row still supplies both targets."}</Prose>

<Prose>{"Why do the endpoints matter? Plot the cost as a function of the one remaining degree of freedom."}</Prose>

<Drawing id="OT10"/>

<Prose>{"For the main example, cost(t)=1.5−2t, so the cheapest point is t=.5. With C=((0,1),(1,2)), every feasible half-weight plan costs 1: the slope is zero. With C=((2,0),(0,2)), increasing t raises cost and t=0 is cheapest. In a general finite table the objective is linear in all entries, with linear marginal equations and nonnegativity constraints. This is a linear programme, whether or not the costs form a metric."}</Prose>

<Prose>{"Checking possible plans gives upper bounds. To prove that none is cheaper, assign source prices fᵢ and target prices gⱼ whose sum never exceeds that route’s cost. Inspect the prices, the slack in every cell and the lower bound together."}</Prose>

<Drawing id="OT11"/>

<Prose>{"The default f=(0,1),g=(0,0) gives weighted price½ and slacks((0,1),(1,0)). Both occupied diagonal cells have zero slack. The control changes f₁ while f₀ stays 0; setting gⱼ=minᵢ(Cᵢⱼ−fᵢ) keeps every offered price pair feasible. Loose prices give a lower bound below the current cost. “Use tight certificate” returns f₁ to 1."}</Prose>

<Prose>{"The reason is one sum that uses every marginal equation. Follow the mass-weighted slack rather than trusting a solver label."}</Prose>

<Drawing id="OT12"/>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\langle C,P\\rangle-\\bigl(a^\\top f+b^\\top g\\bigr)=\\sum_{ij}P_{ij}(C_{ij}-f_i-g_j)\\ge0."}</MathBlock></div>

<Prose>{"Thus feasible prices give a lower bound and any feasible plan gives an upper bound. Equality proves optimality. This is "}<strong>{"complementary slackness"}</strong>{": a positive shipment can use only a tight route when the bounds meet. The finite feasible set is nonempty and bounded; finite linear-programming duality guarantees attained equal optimal values."}</Prose>

<Prose>{"Deeper: the dual inequalities come from minimizing the Lagrangian. Add multipliers for the row and column equations:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"L(P,f,g)=a^\\top f+b^\\top g+\\sum_{ij}P_{ij}(C_{ij}-f_i-g_j)."}</MathBlock></div>

<Prose>{"For fixed prices, minimize over nonnegative entries without enforcing the marginal equations. A negative coefficient lets one entry grow without bound and sends L to−∞. When every coefficient is nonnegative, the final sum has infimum zero. Maximizing the remaining finite value gives the price dual. Prices may be negative; they are multipliers, not literal shipping charges."}</Prose>

<Prose>{"The next complete programme changes supplies to(.6,.4) and demands to(.3,.7). It checks the interval endpoints and the two breakpoints of the piecewise-linear dual exactly with rational arithmetic."}</Prose>

<Programme file="two_location_certificate.py"/>

<Prose>{"Its optimum 7/10 and price value 7/10 agree. The first source can now satisfy all .3 required at the first target; the remaining .3 goes to the second, together with .4 from source 2. "}<code>{"Fraction"}</code>{" keeps the endpoint and weighted slack calculations exact."}</Prose>

<Prose>{"The larger route uses NumPy to construct one constraint row for each source and target, and SciPy’s HiGHS interface to solve the linear programme. Flattening the plan identifies each matrix cell with one unknown; the returned equality multipliers supply the prices."}</Prose>

<Programme file="transport_linear_program.py"/>

<Prose>{"The cost and lower bound are both 1.7. One equality is redundant because totals agree. Multiple optimal plans or prices may exist, so the code checks marginal feasibility, price feasibility and equality of values rather than promising a particular optimizer across solver versions."}</Prose>

<Prose>{"As a visible check, give source weights(.2,.8) and target weights(.7,.3). A diagonal-only plan cannot work: source 0 has only .2, while target 0 needs .7. The plan((.2,0),(.5,.3)) supplies the missing .5 from source 2. This illustrates why the marginal bands belong in the picture."}</Prose>

<H2>{"3. Recognize a distance and use the order of a line"}</H2>

<Prose>{"A minimum cost becomes a Wasserstein distance only with an appropriate ground geometry and power. Compare one displacement under ordinary and squared cost before introducing the general formula."}</Prose>

<Drawing id="OT13"/>

<Prose>{"For δ₀→δ₂, ordinary cost is 2 and squared cost is 4. The rooted squared cost is 2 again. If d is a metric and p≥1,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"W_p(\\alpha,\\beta)=\\left(\\min_{P\\in\\Pi(a,b)}\\sum_{ij}P_{ij}d(x_i,y_j)^p\\right)^{1/p}."}</MathBlock></div>

<Prose>{"W₁ and W₂ both have the coordinate’s units; W₂² has squared units. The original half-mass example happens to have W₁=W₂²=.5 because its only nonzero travelled distance is 1. Its W₂ is√.5. General measures replace the sum by an integral; finite pth moments ensure finite values on the usual Wasserstein space."}</Prose>

<Prose>{"There is another certificate for W₁: a function whose slope never exceeds one can change by at most the movement distance. Read its signed expected value against the two laws."}</Prose>

<Drawing id="OT14"/>

<Prose>{"For every 1-Lipschitz φ, |Eαφ−Eβφ|≤W₁, because |φ(x)−φ(y)|≤d(x,y) on every route. In the main fixture φ(z)=z gives|1−.5|=.5, matching the transport cost. Kantorovich–Rubinstein duality states that the supremum over these functions equals W₁ under its metric/finite-first-moment setting. An over-steep graph breaks the route inequality and loses certificate status."}</Prose>

<Prose>{"To understand the triangle inequality, join a plan from α to β with one from β to γ. The middle probability is shared, not independently counted twice."}</Prose>

<Drawing id="OT15"/>

<Prose>{"For middle weight bⱼ>0, define Rᵢⱼₖ=PᵢⱼQⱼₖ/bⱼ. Summing over k recovers P; summing over i recovers Q. Then Sᵢₖ=ΣⱼRᵢⱼₖ is a valid α-to-γ coupling. A zero bⱼ has an empty fibre. For atoms 0→1→3, direct distance 3 equals 1+2. In general d(x,z)≤d(x,y)+d(y,z), and Minkowski’s inequality for a pth-power average followed by its root bounds the cost of S by Wp(α,β)+Wp(β,γ). Without the root, even 0→1→2 fails:4>1+1."}</Prose>

<Prose>{"On a line, geometry supplies a much simpler optimum. Compare crossed shipments with the uncrossed routes."}</Prose>

<Drawing id="OT16"/>

<Prose>{"If x≤x′ and y≤y′, convexity gives |x−y|ᵖ+|x′−y′|ᵖ≤|x−y′|ᵖ+|x′−y|ᵖ. One way to see it is to consider h(t)=|t−y|ᵖ−|t−y′|ᵖ: its derivative is nonnegative for y≤y′, including one-sided derivatives at p=1. Hence h(x)≤h(x′), which is the inequality. Moving an equal little mass from both crossed cells into the uncrossed cells keeps all marginals and cannot increase cost. Equality can occur, so order alone does not establish uniqueness."}</Prose>

<Prose>{"For W₁, each gap on the axis gives an unavoidable amount of work. Use source weights(2/5,3/5) at 0,3 and target weights(1/5,1/2,3/10) at 1,2,5. The change from the earlier fixture lets us follow unequal packet sizes."}</Prose>

<Drawing id="OT17"/>

<Prose>{"At a cut x, Fα(x)−Fβ(x) is the excess source mass to its left. That much net mass must cross the cut. A monotone plan avoids sending unnecessary mass both ways, so"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"W_1(\\alpha,\\beta)=\\int_{\\mathbb R}|F_\\alpha(x)-F_\\beta(x)|\\,dx."}</MathBlock></div>

<Prose>{"The four gap contributions are 2/5,1/5,3/10 and 3/5, summing to 3/2. The CDFs are right-continuous step functions. Their values at the finite endpoints do not affect the area; the sign of each gap determines direction, and its absolute value determines work."}</Prose>

<Prose>{"Now explore a four-bin timing example. The source weights are(.4,.1,.2,.3) at 0,1,2,3; change the target and spacing while observing all signed gaps."}</Prose>

<Drawing id="OT18"/>

<Prose>{"The nearby target(.1,.4,.3,.2) gives gaps(.3,0,−.1), hence W₁=.4. The far target(0,.1,.2,.7) gives three gaps .4 and W₁=1.2. The identical target gives zero everywhere. Multiplying the spacing multiplies every gap width and the final W₁, while the probability heights stay fixed. The controls precede the full gap ledger so this consequence is visible immediately."}</Prose>

<H2>{"4. Follow probability packets through an exact computation"}</H2>

<Prose>{"CDF area explains W₁. To compute other powers on a line, pair equal probability ranks. The horizontal variable u runs from 0 to 1; each quantile staircase names the location occupied by that slice of probability."}</Prose>

<Drawing id="OT19"/>

<Prose>{"Define F⁻¹(u) as the smallest location whose CDF reaches u. Drawing one uniform u and setting X=Fα⁻¹(u),Y=Fβ⁻¹(u) couples the laws monotonically. The breakpoints 0,.2,.4,.7,1 in our unequal fixture split probability into complete packets. Each packet contributes its width times its location difference to the chosen power:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"W_p^p=\\int_0^1|F_\\alpha^{-1}(u)-F_\\beta^{-1}(u)|^p\\,du."}</MathBlock></div>

<Prose>{"The algorithm only needs two pointers and the mass left at each pointer. Trace its first two emitted cells."}</Prose>

<Drawing id="OT20"/>

<Prose>{"First send min(.4,.2)=.2 from 0 to 1. Target 1 is exhausted, so advance only the target pointer. The remaining .2 at source 0 goes to target 2, which still needs .3 afterward. Then advance the source. At every step at least one atom is exhausted; after sorting, the sweep takes O(n+m) operations and stores at most n+m−1 nonzero packets."}</Prose>

<Programme file="weighted_line.py"/>

<Prose>{"The complete 2×3 plan is((1/5,1/5,0),(0,3/10,3/10)). The independent CDF-area sum agrees with its ordinary cost 3/2. Squared displacement gives 5/2 and W₂≈1.581139. Sorting costs O(n log n+m log m). Pairing equal-count sorted samples by rank is a special case; arbitrary unequal weights need the mass bookkeeping shown here. The linear sweep bound describes emitting sparse packets after sorting. This teaching listing stores the whole n×m plan to make every cell inspectable and separately recomputes CDF sums at every knot; the entire listing is not a linear-time or linear-space implementation."}</Prose>

<Prose>{""}<strong>{"Checkpoint prompt."}</strong>{" One forecast puts .9 at 0 seconds and .1 at 10 seconds; another puts everything at 1 second. Both means are 1. Is their W₁ zero?"}</Prose>

<Prose>{""}<strong>{"Checkpoint explanation."}</strong>{" No. The only destination is 1, so .9 must move one second and .1 must move nine seconds. W₁=.9×1+.1×9=1.8 seconds. Equal means do not determine equal distributions; the plan makes the difference explicit."}</Prose>

<Prose>{"Representation should not change the law. Split an atom into two entries at the same location, or add a genuinely tiny positive mass far away."}</Prose>

<Drawing id="OT21"/>

<Prose>{"Duplicate locations can be merged by adding their weights. Zero weights can be removed without moving positive probability. A positive 5×10⁻¹⁶ tail is different: deleting it changes the law and may matter when its distance is large. Exact rational arithmetic retains it in the teaching sweep. Floating-point implementations need a stated error model rather than an unexplained “small mass” deletion threshold."}</Prose>

<Prose>{"Compare the very same shipments under the three displayed units."}</Prose>

<Drawing id="OT22"/>

<Prose>{"Scaling all coordinates by 3 multiplies W₁ and W₂ by 3, but W₂² by 9. The weights do not change. A library that returns a squared transport objective has not taken the root for you. This distinction will return when we inspect projection and library outputs."}</Prose>

<Prose>{"The shared-rank idea also solves a continuous Gaussian example. Draw the common standard-normal coordinate Z before the translated and scaled outputs."}</Prose>

<Drawing id="OT23"/>

<Prose>{"Write X=μa+σaZ and Y=μb+σbZ. Then E[(X−Y)²]=(μa−μb)²+(σa−σb)². Every other coupling has covariance at mostσaσb by Cauchy–Schwarz; the shared-Z construction attains that value and minimizes the squared difference. For N(0,1) and N(4,9), where the second parameter is variance, W₂²=16+4=20 and T(x)=4+3x. As another complete case, N(0,1)→N(3,4) gives 9+1=10 and T(x)=3+2x. The scale factor changes spread as well as the mean."}</Prose>

<Prose>{"In two dimensions, draw covariance ellipses using standard-deviation radii and equal physical axis units."}</Prose>

<Drawing id="OT24"/>

<Prose>{"For means(0,0)/(2,1) and common-axis SDs(1,2)/(2,1), the squared distance is 2²+1²+(1−2)²+(2−1)²=7. Common axes let us add independent 1D contributions. In general the covariance contribution is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\operatorname{tr}\\left(\\Sigma_a+\\Sigma_b-2(\\Sigma_a^{1/2}\\Sigma_b\\Sigma_a^{1/2})^{1/2}\\right)."}</MathBlock></div>

<Prose>{"Here a PSD square root preserves covariance geometry. To see its origin, the displacement cost equals the two variance traces minus twice the trace of a possible cross-covariance. Maximizing that trace subject to a valid joint covariance gives the sum of singular values of Σb½Σa½, equal to the trace of the displayed PSD root. The full W₂² also includes the squared mean difference. When the covariance matrices commute, use their shared principal axes and take scalar roots of the eigenvalues to obtain the common-axis shortcut. Taking entrywise square roots of a covariance matrix in arbitrary coordinates is not a matrix square root. The ellipse example uses the declared common-axis case."}</Prose>

<H2>{"5. A mean destination can discard part of a law"}</H2>

<Prose>{"This is a deeper branch connecting finite plans to maps and continuous movement. The Gaussian map T(x)=4+3x is increasing. It is also the derivative of a convex potential; inspect the potential’s slope at a moving point."}</Prose>

<Drawing id="OT25"/>

<Prose>{"The potential φ(x)=4x+1.5x² has derivative 4+3x and second derivative 3>0. For squared Euclidean cost, finite second moments and a source absolutely continuous with respect to Lebesgue measure, Brenier’s theorem gives an optimal map that is the gradient of a convex potential, unique up to source-null sets. The atom-splitting example falls outside that source assumption. Monotonicity on a line is the simplest visible instance of this structure."}</Prose>

<Prose>{"A coupling may still be useful when it splits each source. Before replacing a row by a single destination, divide it by its source mass and read the resulting conditional distribution."}</Prose>

<Drawing id="OT26"/>

<Prose>{"Take source positions 0,2 and target positions−1,1,3, with rows(.25,.25,0) and(0,.25,.25). Each source has mass .5, so each conditional row has two halves. A zero source row has no conditional mean defined by this quotient: label it absent instead of dividing by zero. For a positive row, its mean destination is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\overline T(x_i)=\\frac{\\sum_jP_{ij}y_j}{a_i}."}</MathBlock></div>

<Prose>{"These means are 0 and 2. Compare the distribution of those means with the actual target law."}</Prose>

<Drawing id="OT27"/>

<Prose>{"The actual target weights are(¼,½,¼); the deterministic means have weights(½,½). Both laws have mean 1. The target variance is 2, while the mean-map variance is 1. The remaining 1 is the average conditional variance discarded by replacing each row with its mean. This is the conditional-variance decomposition from probability:"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\operatorname{Var}(Y)=\\operatorname{Var}(E[Y\\mid X])+E[\\operatorname{Var}(Y\\mid X)]."}</MathBlock></div>

<Prose>{"The full rational programme computes all three quantities from the same table."}</Prose>

<Programme file="barycentric_projection.py"/>

<Prose>{"The conditional average can be useful in colour or feature alignment, but it can blur distinct destinations. Inspect the conditional rows when preserving modes or labels matters. Neither the table nor its mean identifies causal correspondence."}</Prose>

<Prose>{"Instead of collapsing each row immediately, move every coupled packet partway from its source to its destination. Compare this with mixing the endpoint laws."}</Prose>

<Drawing id="OT28"/>

<Prose>{"Push each pair(x,y) through zₜ=(1−t)x+ty. At t=0 the law is α; at t=1 it is β. The mixture(1−t)α+tβ keeps its mass at original endpoint locations instead. For δ₀ and δ₂ at halfway, displacement interpolation gives δ₁, whereas the mixture gives½δ₀+½δ₂. These laws share a mean but have different spread."}</Prose>

<Prose>{"Follow the moving packet at five equally spaced times."}</Prose>

<Drawing id="OT29"/>

<Prose>{"The positions 0,.5,1,1.5,2 all carry mass 1. The distance between times s and t is 2|s−t|, so this path has constant speed 2. An optimal squared-Euclidean coupling similarly gives a constant-speed W₂ geodesic through its displacement interpolation. The path’s identities and mass remain attached to packets rather than being redrawn as unrelated distributions."}</Prose>

<Prose>{"The same movement has a velocity and an energy. Draw the packet’s trajectory beside the density-and-flux picture used for a smooth law."}</Prose>

<Drawing id="OT30"/>

<Prose>{"For speed 2 on a unit time interval, the integrated squared speed is∫₀¹4dt=4=W₂². For a smooth positive density ρₜ and velocityvₜ, conservation is ∂ₜρ+∇·(ρv)=0. The Benamou–Brenier formulation minimizes∫₀¹∫ρ|v|²dxdt with fixed endpoint laws. Cauchy–Schwarz bounds the squared displacement of each path by its integrated squared speed; averaging yields the lower bound. Optimal constant-speed trajectories attain it under the formulation’s conditions. The Dirac packet is a weak-measure illustration of this action, not a classical smooth density solution. The PDE lesson develops the conservation equation’s local flux meaning."}</Prose>

<H2>{"6. Change the objective to obtain a computable structure"}</H2>

<Prose>{"A dense plan has one entry for every source-target pair. Entropic regularization changes the objective so its optimum factors into a kernel and row/column scales. Start with the same four feasible cells and watch mass spread away from the cheapest corner."}</Prose>

<Drawing id="OT31"/>

<Prose>{"Define counting-measure negative entropy H₋(P)=ΣPᵢⱼ(log Pᵢⱼ−1), with 0log 0=0. We minimize Jε(P)=⟨C,P⟩+εH₋(P), ε>0. More spread can reduce H₋ enough to justify a larger linear cost. Shannon entropy S(P)=−ΣPᵢⱼlogPᵢⱼ is a different signed quantity; for a probability table H₋=−S−1. Keeping these names separate will make the bias bound’s signs unambiguous."}</Prose>

<Prose>{"For equal half weights, write diagonal entries t and off-diagonal entries .5−t. The cost and entropy become one-variable functions. Read their slopes together."}</Prose>

<Drawing id="OT32"/>

<Prose>{"Let Δ=C₀₀−C₀₁−C₁₀+C₁₁. Differentiating gives Δ+2εlog(t/(.5−t)). Its zero yields"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"t=\\frac{.5}{1+\\exp(\\Delta/(2\\varepsilon))}."}</MathBlock></div>

<Prose>{"The second derivative 2ε(1/t+1/(.5−t)) is positive in the interval interior. In the main cost table Δ=−2 and ε=.5, so t≈.440399 and every off-diagonal entry≈.059601. This is an independent analytic reference for this particular equal-weight 2×2 problem."}</Prose>

<Prose>{"The same derivative in a general positive cell reveals a product structure. Draw the Gibbs kernel before it satisfies either marginal."}</Prose>

<Drawing id="OT33"/>

<Prose>{"Adding row and column multipliers gives Cᵢⱼ+εlogPᵢⱼ−fᵢ−gⱼ=0. Hence Pᵢⱼ=uᵢKᵢⱼvⱼ, where uᵢ=exp(fᵢ/ε), Kᵢⱼ=exp(−Cᵢⱼ/ε), and vⱼ=exp(gⱼ/ε). At ε=.5 the main kernel is((1,e⁻²),(e⁻⁴,e⁻²)). These are route preferences, not normalized probabilities. Smaller ε suppresses expensive routes more strongly; ε=0 belongs to an unregularized solver, not a division-by-zero update."}</Prose>

<Prose>{"A different entropy reference can select the same balanced plan while reporting another objective value. Expand the product-reference expression cell by cell."}</Prose>

<Drawing id="OT34"/>

<Prose>{"For fixed probability marginals,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"\\operatorname{KL}(P\\mid a\\otimes b)=\\sum P\\log P-\\sum a\\log a-\\sum b\\log b."}</MathBlock></div>

<Prose>{"The marginal terms are constant over the feasible set, so this penalty and counting negative entropy have the same optimizer. Their reported values differ by those constants and the−ΣP convention. Splitting one atom into duplicated records changes raw table entropy; preserving the underlying distribution requires consistent reference treatment. When marginal masses themselves vary later, those formerly constant terms can change the optimizer."}</Prose>

<Prose>{"One plan therefore needs three clearly labelled readouts: linear work, full regularized objective and feasibility residual."}</Prose>

<Drawing id="OT35"/>

<Prose>{"The full objective can be negative because H₋ is negative on many probability tables. A negative full value is not a negative Wasserstein metric. The residual measures how far row and column sums are from their required values. An early matrix with incorrect sums is not yet a feasible transport plan, regardless of how attractive its objective looks."}</Prose>

<Prose>{"Why is there a unique regularized answer? Examine the objective’s curvature along feasible changes, and compare a zero row with a zero cell in an active row."}</Prose>

<Drawing id="OT36"/>

<Prose>{"The finite feasible set is compact and the objective continuous, including its 0log 0 limits, so a minimum exists. The negative-entropy sum is strictly convex; its positive coefficient makes the optimum unique. With finite costs and positive active marginals the optimum is positive: mixing with the positive product plan opens any zero cell and yields an initially dominant entropy decrease. A zero-weight row must remain entirely zero and can be removed before solving. Forbidden infinite-cost routes require a separate support analysis."}</Prose>

<Prose>{"Deeper: preserve a useful bound on the deliberate linear-cost bias. Let P* minimize the unregularized cost and Pε minimize Jε. Optimality gives"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"0\\le\\langle C,P_\\varepsilon\\rangle-\\langle C,P^*\\rangle\\le\\varepsilon[S(P_\\varepsilon)-S(P^*)]\\le\\varepsilon\\min\\{S(a),S(b)\\}."}</MathBlock></div>

<Prose>{"For a finite joint law, its Shannon entropy is at least either marginal entropy, because conditional entropy is nonnegative. It is at most the sum of the two marginal entropies, because KL relative to the product is nonnegative. These two bounds give the final inequality. It applies to exact optimizers, not arbitrary stopped iterates. As ε→0, the linear cost approaches the original optimum; among tied optimal plans the limiting selection maximizes Shannon entropy. As ε grows, minimizing the entropy term approaches the independent product coupling. The regularizer controls a specific tradeoff rather than a universal improvement."}</Prose>

<H2>{"7. Correct one marginal, then the other"}</H2>

<Prose>{"The factorization P=diag(u)Kdiag(v) is useful because one marginal can be repaired with a single vector update. Start with v=1 and inspect each row total before and after correction."}</Prose>

<Drawing id="OT37"/>

<Prose>{"Row i currently sums to uᵢ(Kv)ᵢ. Setting uᵢ=aᵢ/(Kv)ᵢ makes that row sum exactly aᵢ. The denominator gathers all destinations from the same source; the numerator is its available mass. Divisions are entrywise. The complete before/after matrix shows what every row multiplier changes."}</Prose>

<Prose>{"Next correct columns, and keep the already corrected row totals visible."}</Prose>

<Drawing id="OT38"/>

<Prose>{"Set vⱼ=bⱼ/(Kᵀu)ⱼ using the new u. Every column now has its required mass, but its multiplier usually changes the row totals again. Alternating these two operations is "}<strong>{"Sinkhorn scaling"}</strong>{". For a positive finite kernel and positive active marginals, it converges in exact arithmetic to the unique regularized coupling."}</Prose>

<Prose>{"The live example changes the marginals to(.6,.4) and(.3,.7) so the two corrections are visibly asymmetric. Step through the actual half-steps and watch both errors."}</Prose>

<Drawing id="OT39"/>

<Prose>{"At half-step 0 the unscaled kernel is still a preference matrix. Previous and Next select already computed row/column corrections; Show 40 advances to the last available trace state. Changing ε restarts the trace at 0. The separate final reference has its own cap of 1000 sweeps and tolerance 10⁻¹¹; the 40-half-step picture is a trace, not that reference’s convergence certificate."}</Prose>

<Prose>{"The first complete programme instead uses the original equal-half example for 100 full sweeps. A list comprehension is exactly the row or column sum just derived."}</Prose>

<Programme file="original_scaling.py"/>

<Prose>{"The rounded plan is((.44,.06),(.06,.44)) and the linear cost .619. Its off-diagonal mass agrees with the analytic reference. The fixed-count loop deliberately has no convergence report; the later reusable implementation adds one. That distinction explains why a number of iterations alone is not an accuracy criterion."}</Prose>

<Prose>{"There is also a geometric interpretation of the correction: it is the nearest matrix with the required marginal in generalized KL geometry. Trace a single affine constraint set and its projection."}</Prose>

<Drawing id="OT40"/>

<Prose>{"For positive K, define D(Q|K)=Σ[Qlog(Q/K)−Q+K]. Minimize this under a specified row sum aᵢ. The row Lagrange derivative log(Qᵢⱼ/Kᵢⱼ)−λᵢ=0 gives Qᵢⱼ=exp(λᵢ)Kᵢⱼ; enforcing the sum determines the same row multiplier. If R already has those row sums, direct expansion gives D(R|K)=D(R|Q)+D(Q|K), because the leftover log-ratio is constant across each row and its weighted marginal difference vanishes. Alternating row/column projections uses these affine constraints. Arbitrary convex sets require different correction terms, such as Dykstra’s method."}</Prose>

<Prose>{"Plot the actual maximum marginal error against completed updates, with the stop threshold and cap visible."}</Prose>

<Drawing id="OT41"/>

<Prose>{"Use max(maxᵢ|ΣⱼPᵢⱼ−aᵢ|, maxⱼ|ΣᵢPᵢⱼ−bⱼ|). It has units of probability mass. A small value answers a feasibility question; a general objective-gap bound needs more structure, and population accuracy needs data assumptions. Keep three error sources separate: a stopped optimization, deliberately changed regularization and finite-sample uncertainty."}</Prose>

<Prose>{"Zeros in the kernel can make scaling a support question. Draw the available edges and ask which lie on complete matchings."}</Prose>

<Drawing id="OT42"/>

<Prose>{"The matrix A=((1,1),(0,1)) has a perfect matching on its diagonal. Its extra upper-right positive edge lies on no perfect matching, so A lacks "}<strong>{"total support"}</strong>{". Repeated scaling approaches the identity, but no finite strictly positive diagonal scales D₁,D₂ can turn that positive off-diagonal entry exactly into zero. A positive square matrix has total support. Identity itself has separate support components and therefore more than one componentwise scale gauge. These square doubly-stochastic results are different from weighted rectangular support feasibility, where prescribed masses must also be transportable along the allowed edges."}</Prose>

<H2>{"8. Stable arithmetic and honest computational limits"}</H2>

<Prose>{"The mathematical kernel is positive for finite costs. A computer may round exp(−C/ε) to zero. Before fixing the algorithm, inspect one shifted exponential sum."}</Prose>

<Drawing id="OT43"/>

<Prose>{"For a finite list z, let M=max z. Then LSE(z)=M+log Σexp(z−M). At least one shifted exponential equals 1 and all are at most 1, so this avoids overflowing the sum. With ℓᵢⱼ=−Cᵢⱼ/ε, Aᵢ=loguᵢ and Bⱼ=logvⱼ, updates become"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"A_i\\leftarrow\\log a_i-\\operatorname{LSE}_j(\\ell_{ij}+B_j),\\qquad B_j\\leftarrow\\log b_j-\\operatorname{LSE}_i(\\ell_{ij}+A_i)."}</MathBlock></div>

<Prose>{"Each update computes exactly the earlier denominator in a different representation. Extremely tiny reconstructed plan entries can still round to zero; check the resulting marginals. The declared finite transformed range must remain representable."}</Prose>

<Prose>{"Change one common cost offset while holding ε=.5. Compare the ordinary kernel with the log-domain plan."}</Prose>

<Drawing id="OT44"/>

<Prose>{"At offset 1000, all four ordinary exponentials vanish. The mathematical optimum has not changed: every feasible plan transports total mass 1, so adding 1000 to every cost adds 1000 to every objective. The log calculation retains the plan. This is an invariance test that separates numerical failure from a new modelling choice."}</Prose>

<Prose>{"A common log-scale shift and a separable cost shift provide two more useful invariances. Read their cellwise cancellations."}</Prose>

<Drawing id="OT45"/>

<Prose>{"Adding c to every logu and subtracting c from every logv leaves logP unchanged. Recentring can keep these dual scales moderate. Adding rᵢ+sⱼ to C shifts a balanced objective by a·r+b·s, the same value for every feasible plan, so the optimum is unchanged. With soft marginals, those row/column totals vary and the argument no longer applies. Likewise, multiplying C and ε by the same positive factor preserves the regularized plan; changing C alone changes the tradeoff."}</Prose>

<Prose>{"The complete standard-library solver checks both marginal errors and reports whether the cap succeeded. Its weights must be strictly positive probabilities."}</Prose>

<Programme file="log_stability_and_bias.py"/>

<Prose>{"The offset case succeeds and adds 1000 to the linear cost. The final sharp shifted case returns "}<code>{"False"}</code>{" with residual about .00005 after 5000 sweeps. Stable arithmetic has preserved the iteration, but has not made a poorly conditioned problem converge instantly. Epsilon continuation can use a less concentrated solution as a warm start in suitable solvers. The unchanged positive-only function rejects zero weights: remove zero rows/columns explicitly in a surrounding adapter and reinsert them afterward if extending this route. The browser’s separately handled zero-support cases do not change this Python contract."}</Prose>

<Prose>{"Stable arithmetic also does not remove dense storage. Draw the n×m dependencies that each update reads."}</Prose>

<Drawing id="OT46"/>

<Prose>{"A dense kernel or returned plan occupies O(nm) storage. One sweep performs O(nm) arithmetic and K sweeps O(Knm). Structured convolution, low-rank approximations or implicit/blockwise costs can change particular workloads; they have their own assumptions. GPU batching accelerates appropriate kernels without making the mathematical number of pairs disappear. No runtime curve here is a hardware benchmark."}</Prose>

<Prose>{"If a cost is learned, one may want a derivative. First perturb one cost entry in the fully optimized regularized objective and inspect the associated plan cell."}</Prose>

<Drawing id="OT47"/>

<Prose>{"Let Fε(C)=minP∈ΠJε(P;C). With a unique smooth optimum, the envelope theorem gives ∂Fε/∂Cᵢⱼ=Pε,ᵢⱼ. The direct partial derivative of J with respect to C is P; the optimum’s implicit movement contributes no first-order feasible-direction term because stationarity has already balanced it. Fε is concave in C as an infimum of affine functions. Differentiating only the linear component⟨C,Pε(C)⟩ adds terms from the changing plan and is a different operation."}</Prose>

<Prose>{"Alternatively, differentiate a fixed number of solver steps. Follow that actual dependency graph from costs through every retained state."}</Prose>

<Drawing id="OT48"/>

<Prose>{"Reverse-mode differentiation through K iterations gives the derivative of that finite algorithm. Retaining intermediates costs memory growing with K; recomputation trades arithmetic for memory. Implicit differentiation targets a converged system and needs the relevant regularity and gauge treatment. A nonconvex model producing C still has its own optimization problem. Distinguishing these three objects—full optimum, linear readout and truncated algorithm—prevents a correct derivative from answering the wrong question."}</Prose>

<H2>{"9. Correct self-comparison or deliberately relax mass"}</H2>

<Prose>{"This deeper branch changes two separate modelling choices. First, even a law compared with itself has a nonzero regularized linear cost and a generally negative full objective. Display the cross problem and both self problems before subtracting them."}</Prose>

<Drawing id="OT49"/>

<Prose>{"Use the same cost rule,ε and full-objective convention in all three solves. The "}<strong>{"Sinkhorn divergence"}</strong>{" is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"S_\\varepsilon(\\alpha,\\beta)=F_\\varepsilon(\\alpha,\\beta)-\\tfrac12F_\\varepsilon(\\alpha,\\alpha)-\\tfrac12F_\\varepsilon(\\beta,\\beta)."}</MathBlock></div>

<Prose>{"The default contracted target at 0,1 gives cross linear cost≈.738406, cross full objective≈−1.320075 and divergence≈.538778 at ε=1. The unregularized W₂² is .5. With identical laws, consistent exact self terms cancel to zero; the finite solver also reports its residuals. For the equal-shape shift from 0,2 to 1,3, the cross cost expands into the original pairwise squared cost plus a linear displacement term and 1. Symmetry and the equal means of the unshifted law cancel that linear term, so Sε=1 for every offered ε. This is a property of this translation fixture."}</Prose>

<Prose>{"Now separate algebraic cancellation from the theorem giving positive separation under appropriate costs."}</Prose>

<Drawing id="OT50"/>

<Prose>{"For the compact metric-domain, Lipschitz-cost and positive universal-kernel setting developed by Feydy and colleagues, the consistently defined divergence is nonnegative and vanishes only for equal laws. Bounded-support Euclidean squared cost supplies a useful supported setting through its Gaussian kernel. General asymmetric route tables do not inherit that theorem or a triangle inequality. Product-reference KL and counting entropy differ by marginal terms in balanced problems; those terms cancel consistently in this three-solve difference. Subtracting three linear readouts instead is another quantity. Large-regularization links to energy distances or MMD likewise depend on the cost’s negative-type/kernel conventions."}</Prose>

<Prose>{"The second change concerns total mass. Suppose the source has 2 units and the target 8. A balanced plan cannot have both totals. Draw the source, transported amount and target, retaining the discrepancy visibly."}</Prose>

<Drawing id="OT51"/>

<Prose>{"Normalizing both totals to 1 discards their size difference and asks about composition. An alternative permits changed margins at a declared penalty. For nonnegative s and positive t, generalized KL is φ(s,t)=slog(s/t)−s+t, withφ(0,t)=t. A no-transport-entropy objective is"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"U_\\tau(P)=\\langle C,P\\rangle+\\tau\\operatorname{KL}_+(P\\mathbf1\\mid a)+\\tau\\operatorname{KL}_+(P^\\top\\mathbf1\\mid b)."}</MathBlock></div>

<Prose>{"The parameter τ prices deviations from both original amounts. In the one-route case with a=2,b=8,c=1,τ=2, minimizing over transported mass m gives m*=√(ab)exp(−c/(2τ))≈3.115203. This exceeds 2 and falls below 8 because the model permits both changes."}</Prose>

<Programme file="relaxed_mass.py"/>

<Prose>{"Its objective is≈7.539187. Increasing τ cannot enforce two incompatible total constraints simultaneously. Use this model only when the changed mass has a meaningful interpretation; physical conservation is a different requirement."}</Prose>

<Prose>{"Derive the scalar derivative before adding entropy to the transport itself."}</Prose>

<Drawing id="OT52"/>

<Prose>{"Without transport entropy, U′(m)=c+τlog(m/a)+τlog(m/b) and U″(m)=2τ/m>0. Adding εm(logm−1) changes the derivative to c+(ε+2τ)logm−τloga−τlogb. For a=1,b=4,c=2,τ=2,ε=1,"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"m^*=\\exp\\left(\\frac{2\\log4-2}{5}\\right)\\approx1.167094987."}</MathBlock></div>

<Prose>{"For these same inputs at ε=0, the answer is 2exp(−.5)≈1.213061319. These are different objectives, while the earlier 3.115203 used different amounts and cost as well. Stating every input avoids attributing this difference to numerical error."}</Prose>

<Prose>{"For a positive matrix, the scaling updates now correct only part of each discrepancy. Follow the exponent that weakens the balanced correction."}</Prose>

<Drawing id="OT53"/>

<Prose>{"Let r=P 1 and s=Pᵀ1. Stationarity of J=⟨C,P⟩+εH₋(P)+τKL₊(r|a)+τKL₊(s|b) gives Cᵢⱼ+εlogPᵢⱼ+τlog(rᵢ/aᵢ)+τlog(sⱼ/bⱼ)=0. Writing P=diag(u)Kdiag(v) yields"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"u=\\left(a/(Kv)\\right)^\\theta,\\qquad v=\\left(b/(K^\\top u)\\right)^\\theta,\\qquad \\theta=\\tau/(\\tau+\\varepsilon)."}</MathBlock></div>

<Prose>{"For example, logu=−(τ/ε)log(r/a), but r=u(Kv). Collecting the logu terms gives(1+τ/ε)logu=(τ/ε)(loga−logKv), henceθ. The log-domain version uses LSE for those denominators. With a=(.2,.8),b=(.7,.3),C=((0,1),(2,0)),ε=.5,τ=2, the resulting plan is approximately((.350501447,.002431605),(.165039602,.461910897)). Its total≈.979883551 and margins intentionally differ from a,b."}</Prose>

<Prose>{"Read every objective term and the full stationarity residual from that same plan."}</Prose>

<Drawing id="OT54"/>

<Prose>{"The terms are linear .332510808, transport entropy−1.008042429, row penalty .135506309 and column penalty .130549333, summing to−.409475979. These terms expose what the model paid for. For positive inputs, the entropy Hessian contributes ε/Pᵢⱼ on each cell, while the marginal penalties contribute positive semidefinite blocks. The full objective is strictly convex, so a stationary positive solution is unique. The positive finite scaling map has a contraction interpretation in log variables; a small stationarity residual is a numerical diagnostic, not a universal objective-gap constant."}</Prose>

<Programme file="unbalanced_log_scaling.py"/>

<Prose>{""}<code>{"solve"}</code>{" applies the two fractional-power updates in log space and computes the full derivative without subtracting underflowed row sums. It stops on the maximum absolute stationarity component and reports both the cap and result. "}<code>{"objective_terms"}</code>{" uses "}<code>{"xlogy"}</code>{" for transport entropy. For each positive marginal it evaluates log(row)−log(reference) before multiplying by the row mass; forming row/reference first can underflow even when the logarithms and objective are representable. The individual objective terms must still fit the floating-point range. The matrix case took 61 updates and residual≈6.724×10⁻¹³; the scalar case took 37. The supported inputs are strictly positive finite weights, finite costs and positive ε,τ. Extending to zero reference masses changes the support rules and is outside this helper. Dense arithmetic/storage still follow the plan’s number of cells."}</Prose>

<H2>{"10. Average distributions by matching probability ranks"}</H2>

<Prose>{"This deeper branch asks for a representative distribution. Averaging histogram heights makes a mixture; minimizing average squared Wasserstein distance gives a different answer. Compare two equally weighted laws at(0,2) and(2,4)."}</Prose>

<Drawing id="OT55"/>

<Prose>{"The midpoint law at(1,3), with half mass each, is distance-squared 1 from either input. The mixture has masses(.25,.5,.25) at 0,2,4 and distance-squared 2 from each. The midpoint moves corresponding ranks halfway; the mixture keeps all original locations. A picture of the complete laws makes this distinction visible before optimization notation."}</Prose>

<Prose>{"Change the target weight λ. It gives the target law’s importance, with 1−λ on the source. Also try unequal atom weights, so correspondence requires intervals rather than pairing lists by position."}</Prose>

<Drawing id="OT56"/>

<Prose>{"For source 0,2 with weights(.25,.75) and target 1,5 with weights(.5,.5), the common cumulative intervals have widths .25,.25,.5. At λ=.5 their locations become .5,1.5,3.5. The squared cost to either input is 5/4. At λ=0 or 1 the corresponding complete input law is recovered; duplicate output atoms are merged by adding mass. Reset restores the equal-weight midpoint case."}</Prose>

<Prose>{"Why does averaging quantiles solve this problem? Complete the square at one probability rank before integrating."}</Prose>

<Drawing id="OT57"/>

<Prose>{"For quantile locations x(u),y(u), the contribution at candidate z is(1−λ)(z−x)²+λ(z−y)². This equals[z−((1−λ)x+λy)]²+λ(1−λ)(x−y)². Thus z(u)=(1−λ)x(u)+λy(u) minimizes each rank separately. A convex combination of nondecreasing quantiles remains nondecreasing, so it defines a law and the pointwise minimizers fit together. For a W₁ objective, weighted medians replace squared-error means and may be nonunique."}</Prose>

<Prose>{"Gaussian 1D quantiles are μ+σΦ⁻¹(u), so a W₂ barycentre averages means and standard deviations. Equal weights on N(0,1) and N(4,9) give mean 2,SD 2,variance 4. Their mixture instead has variance(1+9)/2+4=9. The law’s geometric average preserves rank correspondence rather than the mixture’s component label."}</Prose>

<Prose>{"The complete exact programme merges repeated locations, emits common probability packets and computes both the barycentre and mixture objectives."}</Prose>

<Programme file="quantile_barycentre.py"/>

<Prose>{""}<code>{"packets"}</code>{" exposes the common breakpoints with a two-pointer sweep. "}<code>{"barycentre"}</code>{" moves each packet to its weighted location and merges coincidences; no positive tiny mass is discarded. "}<code>{"squared_cost"}</code>{" reuses the exact interval coupling. The output includes λ=0,¼,½,1 for both fixtures. For the unequal case at¼, the locations are¼,7/4,11/4, with objective 15/16; the complete practice calculation below explains each term. Sorting/merging costs O(n log n+m log m); after sorting the packet sweep is linear in the atom counts."}</Prose>

<Prose>{"Sometimes the output must lie on a prescribed grid. Draw one shared unknown marginal with a separate coupling to each input histogram."}</Prose>

<Drawing id="OT58"/>

<Prose>{"On grid 0,1,2,3,4, the exact equal midpoint atoms 1,3 fit. A general fixed-grid barycentre minimizes Σₖλₖ⟨Cₖ,Pₖ⟩ with Pₖ1=q and Pₖᵀ1=bₖ, where q is the common unknown law. A free-support barycentre may choose locations outside a prescribed grid. The choice of grid is therefore part of the approximation, not an implementation detail to hide."}</Prose>

<Prose>{"Adding entropy gives an alternating update involving a weighted geometric mean. Trace the incoming marginal proposed by each coupling before their common correction."}</Prose>

<Drawing id="OT59"/>

<Prose>{"Write Pₖ=diag(uₖ)Kₖdiag(vₖ) and sₖ=Kₖvₖ. The common-row condition gives uₖ=q/sₖ. At the optimum, stationarity with respect to the common q requires the weighted source potentials Σλₖloguₖ to be constant across locations; a normalization/gauge choice removes that common constant. Thus logq=Σλₖlogsₖ up to normalization, or q proportional to∏sₖ^λₖ. Alternating this shared-marginal step with each target-column correction gives the entropic barycentre algorithm. The library route later shows the full returned law and both coupling checks."}</Prose>

<Prose>{"For ε=.5 on the five-point grid, the executed library returned approximately(.053239439,.393521127,.106478867,.393521127,.053239439), summing to 1. This differs from the unregularized two-atom midpoint because entropy spreads the couplings. The pinned log-barycentre routine adds 10⁻¹⁶ to zero input bins internally; that explicit tiny perturbation also belongs to the computation’s contract."}</Prose>

<Prose>{"Existence and uniqueness are separate from the convenience of a particular update. Return to the geometry and inspect a discrete ambiguity."}</Prose>

<Drawing id="OT60"/>

<Prose>{"In finite-dimensional Euclidean W₂ space, finitely many input laws with finite second moments have a barycentre. Tightness and lower semicontinuity give the existence argument after bounding second moments of a minimizing sequence. A positive weight on an absolutely continuous input supplies strictness sufficient for uniqueness under the standard Euclidean theorem. For a concrete nonunique case, put equal mass at (−1,0),(1,0) in A and at (0,−1),(0,1) in B. All four squared cross distances are 2. Matching opposite pairs in either order gives a different midpoint law: half mass at (−½,−½),(½,½), or half at (−½,½),(½,−½). Each midpoint law has squared distance ½ to each input, hence equal-weight objective ½. The triangle inequality gives a lower bound of W₂²(A,B)/4=½, so both are optimal. Averaging a subset first and then averaging that result generally loses information, so barycentres are not associative. The complete 1D quantile formula is a special case; a general covariance fixed-point algorithm needs its own derivation and numerical contract."}</Prose>

<H2>{"11. Compare relations when coordinate systems differ"}</H2>

<Prose>{"This deeper branch changes the geometry itself. A translated or rotated shape can have very different absolute coordinates while keeping every internal distance. Draw both complete triangles and their within-space matrices before proposing a correspondence."}</Prose>

<Drawing id="OT61"/>

<Prose>{"The synthetic source points are((0,0),(1,0),(0,2)); target points are((5,10),(7,10),(7,11)). Both carry mass⅓ on each point. Their three edge lengths are 1,2,√5. Source indices 0,1,2 match target indices 1,2,0 under a rigid transformation. The source colour travels through a proposed correspondence, while target labels and diamond shapes retain the target’s original identity."}</Prose>

<Prose>{"An ordinary cost compares one source point with one target point. An intrinsic cost compares two source points with two target points, weighted by the two proposed matches."}</Prose>

<Drawing id="OT62"/>

<Prose>{"Let Dᵢₖ and Eⱼₗ be the within-space distances. We use the unhalved squared-loss objective"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"G(P)=\\sum_{i,k,j,l}(D_{ik}-E_{jl})^2P_{ij}P_{kl}."}</MathBlock></div>

<Prose>{"Read it as drawing two independent matched pairs from P and penalizing their distance disagreement. The factors Pᵢⱼ and Pₖₗ are both needed. For the correctly scaled permutation each is⅓ on its match, so every term has zero distance discrepancy. Some definitions insert constants or take a square root to define a metric; G here is the displayed four-index objective exactly as written."}</Prose>

<Prose>{"Select each permutation, then mix its coupling with the uniform product. Both endpoint matrices have the same marginals, so their convex mixture remains feasible."}</Prose>

<Drawing id="OT63"/>

<Prose>{"The default correct permutation at λ=0 gives zero. A wrong permutation at λ=0 keeps its nonzero error; the control does not silently switch it to the correct one. At λ=1 every selection produces the same product coupling. The raw identity permutation gives 32/9−4√5/3≈.574131586. The exact nonnegative zero witness proves optimality for this congruent fixture, while six permutations do not enumerate all feasible couplings in a general problem."}</Prose>

<Programme file="intrinsic_three_points.py"/>

<Prose>{""}<code>{"distances"}</code>{" computes the three-by-three Euclidean matrices. "}<code>{"coupling"}</code>{" gives⅓ on each selected match, then mixes with 1/9 in every cell. "}<code>{"gw"}</code>{" explicitly sums all 81 four-index combinations, which is appropriate for this inspectable three-point example. The six losses are printed alongside four feasible mixtures. General dense GW needs more efficient contractions and a nonconvex solver. In the same absolute coordinate frame, the best ordinary squared transport cost is 391/3≈130.333333333, which answers a different question about position."}</Prose>

<Prose>{"A larger intrinsic problem can linearize the current quadratic objective and solve an entropic transport subproblem. Follow that dependency graph without inventing a trajectory."}</Prose>

<Drawing id="OT64"/>

<Prose>{"For a fixed current P, contracting one copy of P in the four-index loss produces a cost-like gradient matrix. Projected-gradient variants alternate a local update with a Sinkhorn-based projection. The objective is generally nonconvex, so initialization can matter and convergence to a local stationary point is not a global certificate. The library example uses the same full distances, square loss and ε=.05 with two initializations: the product and .9correct+.1product. Both executed runs reached a matrix whose displayed loss rounds to 0 for this fixture; the separate exact witness already supplies its global optimum. That favourable example does not prove arbitrary GW solves are globally correct."}</Prose>

<H2>{"12. Distinguish projections, observations and software outputs"}</H2>

<Prose>{"Projecting a cloud onto a line permits the exact 1D solver. First inspect the full clouds and the projection directions, so the dimensions being discarded remain visible."}</Prose>

<Drawing id="OT65"/>

<Prose>{"Source points(−1,−1),(1,1) and target points(−1,1),(1,−1) have identical x and y marginal distributions. The two coordinate projections therefore give zero squared cost. A unit diagonal direction separates them and gives projected squared cost 2. In full 2D, every source-target squared distance is 4, hence W₂²=4 and W₂=2. Matching marginals alone missed the dependence difference."}</Prose>

<Programme file="sliced_directions.py"/>

<Prose>{"The three chosen projected squared costs are 0,0,2. Their average is 2/3 and its root≈.816497. This finite chosen-direction approximation is different from an integral over all unit directions with normalized spherical measure. More directions can reveal distinctions that an unlucky finite set misses; the coordinate cloud drawing explains which information each projection removed."}</Prose>

<Prose>{"Sampling introduces another approximation before a solver ever runs. Compare the known Bernoulli law with every possible empirical count from four observations."}</Prose>

<Drawing id="OT66"/>

<Prose>{"For a fair law at 0 and 1, k successes give empirical mass k/4 at 1 and W₁=|k/4−.5|. The probabilities of k=0,…,4 are(1,4,6,4,1)/16. Multiplying and adding gives expected empirical error 3/16. An exact transport solver still sees this nonzero sample discrepancy. Higher-dimensional rates depend on support geometry, tails and the distance/order being estimated. Compact/intrinsic-dimension results and fixed ε statistical results have distinct assumptions; neither a universal n⁻¹/d rule nor a dimension-free constant follows from this five-case example."}</Prose>

<Prose>{"Now connect arrays and return values to ordinary software. The complete vectorized bridge below supplies the same positive probability weights, costs and ε to a scratch log-domain solver and POT."}</Prose>

<Drawing id="OT67"/>

<Prose>{""}<code>{"logsumexp"}</code>{" performs the row/column denominator calculation on arrays. The code shifts a common cost baseline, fixes a scale gauge and checks both marginal errors. POT’s "}<code>{"sinkhorn_log"}</code>{" returns a plan; the programme recomputes linear cost, counting-negative-entropy objective and the version without the−ΣP constant. For total mass 1, the last two differ by ε. The complete bridge and its original output remain useful numerical evidence under the stated pinned environment."}</Prose>

<Programme file="sinkhorn-library-bridge.py"/>

<Prose>{"The first case agrees with the equal-weight analytic solution. The three-by-two case tests rectangular costs and unequal masses. The sharp five-step case reports failed convergence. Preserve the strict positive-marginal contract; a separate caller must remove/reinsert zero rows. Multiplying both costs and ε by 3 preserves the plan and scales the objective values by 3, whereas multiplying costs alone sharpens the tradeoff."}</Prose>

<Prose>{"The extended route composes the new barycentre, soft-mass and intrinsic mechanisms with their maintained library APIs, then uses real observed data. Its four named demonstrations can be run individually when investigating one result."}</Prose>

<Programme file="transport_extensions_library.py"/>

<Prose>{"For the barycentre, histogram columns are the input distributions and the returned vector is the shared grid law. The actual last internal error was≈8.729×10⁻¹³. Reconstructing its two couplings gave maximum marginal errors around 2.445×10⁻¹³ against the explicitly floored and renormalized target inputs. Rounded zeros in a printed plan are not proof of exact zero support."}</Prose>

<Prose>{"For soft mass, "}<code>{"reg_type=\"entropy\""}</code>{" explicitly selects the counting reference; "}<code>{"reg_m=2"}</code>{" is the marginal penalty, while the stabilized routine’s separate absorption threshold has another role. The scratch and POT plans differed by≈1.388×10⁻¹⁶ and the recomputed stationarity was≈6.729×10⁻¹³. Inspecting the pinned 0.9.7 backend matters: its logged "}<code>{"total_cost"}</code>{" calls "}<code>{"kl_div"}</code>{" with "}<code>{"mass=False"}</code>{", so it omits generalized-KL mass terms. If L is that log, M is the transported total and ε,τ are our parameters, reconcile by"}</Prose>

<div className="neural-equation" role="region" aria-label="Mathematical expression; scroll horizontally when needed" tabIndex={0}><MathBlock>{"J=L-(\\varepsilon+2\\tau)M+\\tau\\left(\\sum_i a_i+\\sum_j b_j\\right)."}</MathBlock></div>

<Prose>{"The corrected log and direct objective both give−.409475979. Subtracting ε times the number of cells would instead correspond to another backend convention and gives the wrong result here. This is why the complete programme evaluates the defining objective directly. The library warns that choosing entropy replaces its reference matrix by ones; that is the explicitly requested model."}</Prose>

<Prose>{"For GW, "}<code>{"gw_dist"}</code>{" is the unregularized G(P), not the full entropy objective. Outer "}<code>{"err"}</code>{" is sampled only every ten iterations; "}<code>{"numItermax"}</code>{" and "}<code>{"stopThr"}</code>{" govern the inner Sinkhorn calculation. The recorded whole run includes an inner Sinkhorn non-convergence warning. The returned fixture plans had zero displayed marginal residual and final update, and their recomputed G agreed with the logged value at printed precision. Retain the warning and those separate diagnostics; neither replaces the exact fixture witness or guarantees every inner solve reached tolerance."}</Prose>

<Prose>{"Finally, the R "}<code>{"sleep"}</code>{" data record increases in sleep hours under two drugs relative to control for the same ten people. R’s documentation cites Cushny and Peebles 1905 and Student 1908 and warns that its group label can mislead: these are paired observations, not two independent groups. The supplied CSV preserves every value and ID. It is reshaped from R’s source retrieved 6 October 2026 and distributed with the original source, documentation, package description, provenance and GPLv 2 copying terms. Treat this as a demonstration of empirical distribution comparison, not treatment advice or a causal conclusion."}</Prose>

<Prose>{"The complete programme prints all ten pairs, then the two sorted empirical laws. Its rank-matched W₁ is 1.58 hours and agrees with "}<code>{"scipy.stats.wasserstein_distance"}</code>{". Its squared rank cost is 2.758 hours² and agrees with POT’s "}<code>{"emd"}</code>{" on the full squared-cost matrix. The actual same-ID paired squared displacement is 3.858 hours². The optimizer may reorder people to reduce geometric work; the recorded experiment did not. This directly exposes why an optimal coupling cannot be interpreted as an observed pairing. W₁ happens to equal the mean difference here because the sorted second observations are no smaller at each rank; equality of these two summaries is conditional on that order, not a general identity."}</Prose>

<Prose>{"Choose a model by the quantity you need to preserve. Compare the actual laws, amounts, shapes and projections rather than selecting an algorithm by its name."}</Prose>

<Drawing id="OT68"/>

<Prose>{"For normalized timing distributions with meaningful seconds, balanced 1D transport describes average geometric displacement. A rare mass η moving distanceD has W₁=ηD in the simple shared-location fixture, so rarity and severity can trade off at the same scalar value; inspect the deadline event separately. Meaningful unequal counts call for an explicitly justified soft-mass or partial model. Unrelated coordinate frames may call for internal-distance comparison, which intentionally discards absolute translation or rotation. A small number of projections gives a chosen approximation whose blind spots need inspection."}</Prose>

<Prose>{"Colour/feature alignment may use conditional destinations but must inspect the spread lost by a mean map. Generated-versus-observed distribution losses involve sampling, critic and optimization assumptions. "}<a href={"/learn/topic/rectified-flow-flow-matching"}>{"Rectified Flow & Flow Matching"}</a>{", "}<a href={"/learn/topic/gan-variants-dcgan-wgan-stylegan-cyclegan-pix2pix"}>{"GAN Variants"}</a>{" and "}<a href={"/learn/topic/distributional-rl-c51-qr-dqn-iqn"}>{"Distributional RL"}</a>{" develop their own algorithms; transport geometry is one ingredient. The next foundations topic, "}<a href={"/learn/topic/causal-inference-do-calculus"}>{"Causal Inference & Do-Calculus"}</a>{", asks what interventions imply. A low-cost joint law alone cannot answer that question."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"Independent practice"}</H2>

<Prose>{"Each prompt is visible; hints and complete solutions can be opened separately. State locations, weights, cost and the question before calculating. Exact agreement with a solver cannot rescue the wrong geometry or objective."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Construct a changed plan and certificate"}</H3>

<Prose>{"Source 0,2 has weights(.2,.8); target 0,1 has weights(.7,.3). Use ordinary distance. Find the feasible interval, cheapest plan and tight prices."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Let t=P₀₀ and try f=(0,2),g=(0,−1)."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"P=((t,.2−t),(.7−t,.1+t)) with 0≤t≤.2. Cost 1.7−2t is minimized at .2, giving((.2,0),(.5,.3)) and cost 1.3. The proposed prices satisfy every route inequality, have value .8×2−.3=1.3 and zero slack on all occupied cells. Negative multipliers are legitimate."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Keep powers and units straight"}</H3>

<Prose>{"A source has .75 at 0 seconds and .25 at 4 seconds; the target is δ₁. Find W₁,W₂²,W₂ and their changes when coordinates double."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Only one destination exists, so the plan is forced."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"W₁=.75×1+.25×3=1.5 seconds. W₂²=.75×1+.25×9=3seconds² and W₂=√3≈1.732051 seconds. Doubling locations doubles W₁,W₂ and multiplies W₂² by 4. A squared-cost API needs a root to report W₂."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Explain every gap contribution"}</H3>

<Prose>{"At locations 0,1,3, compare source(.5,0,.5) with target(0,.75,.25). Compute W₁ from CDF gaps and construct a matching plan."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The two gap signs differ."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"On[0,1), gap .5 and width 1 contribute .5. On[1,3), gap−.25 and width 2 contribute .5. W₁=1. Move .5 from 0 to 1,.25 from 3 to 1 and retain .25 at 3. Signed gaps would cancel incorrectly; work uses absolute area."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Repair an invalid certificate"}</H3>

<Prose>{"For the original half-weight fixture, f=(0,3),g=(0,0) gives value 1.5, above the diagonal cost .5. Identify the failed premise. Does a feasible bound below .5 disprove the plan?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Check every route inequality."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Source 2’s price 3 exceeds cost 2 to target 0 and cost 1 to target 1. The prices are infeasible and supply no lower bound. Feasible but loose prices below .5 merely fail to prove optimality. The tight f=(0,1),g=(0,0) proves it."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Diagnose one scaling sweep"}</H3>

<Prose>{"Multiply costs by 100, retain ε, and perform one row then one column correction. Columns look perfect. Give three reasons this does not establish the old optimum accurately."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Separate objective, feasibility and arithmetic."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The cost/entropy ratio changed; scale ε too to preserve it. Correcting columns can disturb rows, so inspect both residuals. Larger C/ε can underflow the kernel or slow convergence, requiring log arithmetic and a reported tolerance/cap. Sampling error and deliberate regularization remain separate from those numerical repairs."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Derive a regularized reference"}</H3>

<Prose>{"Use C=((0,1),(1,0)), half weights and ε=1. Find diagonal mass, linear cost, full objective and self divergence."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Δ=−2 and t=.5/(1+e⁻¹)."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"t≈.3655292893 and off-diagonal mass≈.1344707107. Linear cost 2(.5−t)≈.2689414214. Adding 2t(logt−1)+2(.5−t)(log(.5−t)−1) gives−2.0064088681. The consistent exact self divergence is F−½F−½F=0, though its linear and full readouts are individually nonzero."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Identify discarded conditional spread"}</H3>

<Prose>{"One source at 0 sends .25 to−2 and .75 to 2. Find its mean destination and target variance. What does the deterministic mean map produce?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A single source has only one mean output."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The mean is 1; variance .25(−2−1)²+.75(2−1)²=3. The mean map gives δ₁ with zero variance, discarding all 3 units of conditional variance while preserving the mean. The coupling is valid; summarizing it causes the loss."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Choose a modelling assumption"}</H3>

<Prose>{"Choose and defend a model for two normalized arrival-time laws, two meaningful cell-count histograms of unequal totals, and two shapes in unrelated frames. State something each model may hide."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Ask whether total mass and absolute position are meaningful."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Balanced 1D transport retains timing units but mean movement can hide deadline risk. A justified soft-mass model retains a penalty for count discrepancies but permits changes that need interpretation. GW can compare internal shape while hiding translation/orientation. Normalizing counts or registering frames first can be valid if that is the intended question; it changes the claim."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Build an end-to-end comparison"}</H3>

<Prose>{"Choose unequal-count weighted 1D laws. Use the complete "}<code>{"weighted_line.py"}</code>{" sweep and a cost-matched version of "}<code>{"transport_linear_program.py"}</code>{". Check W₁ against CDF area and W₂² against the LP, then duplicate atoms with split weights and rescale coordinates by 3."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Keep labels, representation and probability law distinct."}</Prose>

</details>

<details>

<summary>Solution and acceptance criteria</summary>

<Prose>{"A complete reference choice is the supplied 0,3 law with weights 2/5,3/5 and 1,2,5 law with weights 1/5,1/2,3/10. Its complete sweep prints plan((1/5,1/5,0),(0,3/10,3/10)), W₁=3/2,W₂²=5/2 and W₂≈1.581139. Build the LP cost from these locations rather than retaining the arbitrary 3×3 table. Require nonnegative entries, both exact/within-tolerance marginals, CDF agreement and cost agreement; an optimizer need not be unique. Duplicating each atom and halving its weights preserves the law and aggregated optimum. Scaling locations multiplies W₁,W₂ by 3 and W₂² by 9. Raw table entropy can change with duplicated representation, so compare regularized values only with an explicitly consistent reference. The new "}<code>{"quantile_barycentre.py"}</code>{" supplies reusable "}<code>{"law"}</code>{", "}<code>{"packets"}</code>{" and "}<code>{"squared_cost"}</code>{" functions for these changed inputs. A separate real-data comparison in the complete library route demonstrates rank cost versus an actual paired ledger."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Solve an unequal-weight barycentre"}</H3>

<Prose>{"Use A at 0,2 with weights(.25,.75), B at 1,5 with weights(.5,.5), and target importance λ=.25. Derive all output locations/masses, both squared distances, the weighted objective and the mixture’s objective."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The shared intervals end at .25,.5,1."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The input pairs are(0,1),(2,1),(2,5), with widths¼,¼,½. Weighted locations are¼,7/4,11/4. Their cost to A is¼(¼)²+¼(−¼)²+½(¾)²=5/16. Cost to B is¼(−¾)²+¼(¾)²+½(−9/4)²=45/16. Thus(¾)(5/16)+(¼)(45/16)=15/16. The mixture has masses 3/16 at 0,1/8 at 1,9/16 at 2,1/8 at 5. Matching its quantiles to A gives squared cost 5/4; to B gives 15/4, so the weighted mixture objective is 15/8, larger than 15/16. Averaging equally positioned array entries would lose the middle interval and give the wrong law."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Change the scalar soft objective"}</H3>

<Prose>{"For a=1,b=4,c=2,τ=2, derive the mass with ε=1 and compare with ε=0. Explain why balanced normalization answers another question."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Differentiate every mass-dependent term."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"J′(m)=2+5logm−2log 4 and J″(m)=5/m>0. Hence m=exp((2log 4−2)/5)≈1.167094987. At ε=0, m=2exp(−.5)≈1.213061319. Normalizing both inputs to 1 forces balanced transported mass 1 and removes the original total discrepancy; it is not an approximation to these objectives. Cost,ε and τ must share compatible units with the chosen mass/reference convention."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Find an intrinsic witness"}</H3>

<Prose>{"For the declared triangles, find a zero-loss permutation and compute one wrong permutation’s G. Compare with ordinary coordinate cost and explain why matching does not establish an intervention effect."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Trace the edges of lengths 1,2,√5."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The correct mapping is(1,2,0); its three matched masses⅓ preserve every pair distance, so G=0. For identity(0,1,2), unordered edge discrepancies are(1−2)²,(2−√5)²,(√5−1)². Each appears twice and each paired weight is 1/9, giving(2/9)[1+(2−√5)²+(√5−1)²]=32/9−4√5/3≈.574131586. Ordinary optimal squared coordinate cost is 391/3 because absolute position matters there. The witness certifies this nonnegative intrinsic fixture, not a generic local solver. Neither criterion supplies assumptions about treatment assignment or potential outcomes."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"Readiness and next study"}</H2>

<Prose>{"You can move on when you can reconstruct the cells of a coupling, certify a small optimum, distinguish rooted units and entropy conventions, trace a row/column correction, diagnose a stopped solve, and explain what a projection, mean map or intrinsic comparison discards. Use a changed fixture to demonstrate these skills. "}<a href={"/learn/topic/causal-inference-do-calculus"}>{"Causal Inference & Do-Calculus"}</a>{" follows because observed similarity and a compatible joint law are different from an identified intervention effect."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{"Gabriel Peyré and Marco Cuturi, "}<a href={"https://arxiv.org/abs/1803.00567"}>{"Computational Optimal Transport"}</a>{", an accessible book-length treatment. After stages 1–4, use its coupling, duality and 1D chapters to compare graphical explanations; later use the entropic, barycentre and statistical chapters for deeper study."}</li><li>{"Filippo Santambrogio, "}<a href={"https://www.math.univ-paris13.fr/~santambrogio/OTAM.pdf"}>{"Optimal Transport for Applied Mathematicians"}</a>{", a mathematical route from plans and duality to maps and applications. The finite examples here prepare the notation; continuous proofs require measure-theory background."}</li><li>{"Gabriel Peyré, "}<a href={"https://www.gpeyre.com/ot4ml/"}>{"Optimal Transport for Machine Learners"}</a>{", the author’s book, slides and notebook index. The finite dual material is a useful second explanation before differentiable and machine-learning applications."}</li><li>{"Gabriel Peyré, "}<a href={"https://moore.pims.math.ca/lecture/video/optimal-transport-machine-learning-lecture-1"}>{"PIMS Optimal Transport for Machine Learning, lecture 1"}</a>{", a graduate-level spoken route. Its institutional listing was checked; full audiovisual playback was not reviewed. Revisit after the coupling/scaling sections."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://papers.nips.cc/paper_files/paper/2013/file/af21d0c97db2e27e13572cbf59eb343d-Paper.pdf"}>{"Cuturi 2013, Sinkhorn Distances"}</a>{": original machine-learning entropic-scaling formulation; compare its reciprocal regularization convention before matching parameters."}</li><li>{""}<a href={"https://proceedings.mlr.press/v89/feydy19a.html"}>{"Feydy et al .2019, Interpolating between Optimal Transport and MMD"}</a>{": the self-bias correction, reference conventions and exact positivity/kernel assumptions, especially equations 1–3 and Theorem 1."}</li><li>{""}<a href={"https://proceedings.mlr.press/v48/peyre16.html"}>{"Peyré, Cuturi and Solomon 2016, Gromov–Wasserstein Averaging"}</a>{": within-space distance objectives and barycentre optimization. This lesson’s G uses the explicitly stated unhalved square-loss convention."}</li><li>{""}<a href={"https://pythonot.github.io/all.html"}>{"POT documentation"}</a>{": ordinary plan-returning solvers. The executable examples pin 0.9.7 and inspect its actual barycentre, unbalanced and GW implementations; names such as "}<code>{"total_cost"}</code>{" and "}<code>{"err"}</code>{" need their source-defined meanings."}</li><li>{""}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/sleep.html"}>{"R sleep documentation"}</a>{": variables, paired IDs and original citations. The offline provenance fixes the actual retrieved source bytes and includes their licence, rather than relying on future changes to this live documentation."}</li></ul>

<Prose>{"Continuous maps, unbalanced support extensions, general covariance barycentres and statistical rates should be checked against their stated assumptions when extending these finite programmes."}</Prose></section></div>;}
