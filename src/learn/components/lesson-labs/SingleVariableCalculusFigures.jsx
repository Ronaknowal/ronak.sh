import { motionPosition, motionVelocity } from "../../data/single-variable-calculus-models.js";
import { singleVariableCalculusExamples } from "../../data/single-variable-calculus-examples.js";
import { CalculusFigure as Figure, CubeShell, Compare, Scene, Label, Arrow, Plane, Point, Area, fmt, JourneyTracks, MotionDrawing, LimitDrawing, SquareChangeDrawing, ProductDrawing, ChainDrawing, RadianGeometry, CircleDrawing, RectangleFamily, CircleAnnulus, CandidatesDrawing, TaggedDrawing, PartitionRuler, SignedDrawing, AccumulationDrawing, RodDrawing, EulerDrawing } from "./SingleVariableCalculusDrawings.jsx";
function JourneyObservationsFigure() {
  return <Figure caption="Each row is a separate time observation on the same metre scale. Positions 0, 4, 0, 4 m do not determine how much travel occurred between observations."><JourneyTracks /></Figure>;
}
function FiniteSecantFigure() {
  return <Figure caption="The secant joins (1 s, 4 m) and (3 s, 0 m). The rightward 2 s leg and downward 4 m leg give −2 m/s, a signed interval average."><MotionDrawing finiteOnly /></Figure>;
}
function JourneyLegsFigure() {
  return <Figure caption="The directed legs are +4, −4, +4 m: net change 4 m, total travel 12 m. The later derivative-sign argument will establish these turning times."><JourneyTracks legs /></Figure>;
}
function LimitVersusValueFigure() {
  return <Figure caption="The nearby square approaches 4 from either side. The open point records the omitted value 4; the blue assigned point is 6. The two pieces of information can disagree."><LimitDrawing kind="hole" /></Figure>;
}
function ToleranceBandFigure() {
  return <Figure caption="Gold marks the input strip 2±0.1, excluding its central line x=2 from the test. Blue is the requested output band 4±0.5. The chosen nearby points illustrate the test; the boundary supremum 0.41 and written factorization establish it for every allowed input."><LimitDrawing kind="smooth" bands /></Figure>;
}
function JumpLimitsFigure() {
  return <Figure caption="At x=2 the chosen value is 4. The left branch approaches 4 and the right approaches 6; the open right endpoint is not an assigned second value."><LimitDrawing kind="jump" /></Figure>;
}
function UnboundedBranchesFigure() {
  return <Figure caption="The curves end at the displayed ordinate bounds ±8, with continuation arrows at actual curve tips. Input 0 is excluded: no line bridges the pole and no finite two-sided limit is implied."><Plane label="Actual1/x branches approaching zero with opposite unbounded signs" xRange={[-1, 1]} yRange={[-8, 8]} xLabel="input x" yLabel="value 1/x" curves={[{ fn: (x) => 1 / x, domain: [-1, -0.125], tone: "rose" }, { fn: (x) => 1 / x, domain: [0.125, 1] }]}>{({ X, Y }) => <><Arrow x1={X(-0.2)} y1={Y(-5)} x2={X(-0.125)} y2={Y(-8)} tone="rose" /><Arrow x1={X(0.2)} y1={Y(5)} x2={X(0.125)} y2={Y(8)} /></>}</Plane></Figure>;
}
function ContinuityHypothesesFigure() {
  return <Figure caption="The square on closed [−1,2] attains minimum 0 and maximum 4. On open (0,1), 1/x has unattained infimum 1 and is unbounded above. The domain hypotheses change the conclusion."><Compare><Plane label="Square on closed[-1,2]; attained0and4" xRange={[-1, 2]} yRange={[0, 5]} xLabel="x in [−1,2]" yLabel="x²" curves={[{ fn: (x) => x * x }]}>{({ X, Y }) => <><Point x={-1} y={1} X={X} Y={Y} /><Point x={0} y={0} X={X} Y={Y} tone="blue" /><Point x={2} y={4} X={X} Y={Y} tone="rose" /></>}</Plane><Plane label="1/x on open(0,1); endpoint1,1 excluded and height unbounded" xRange={[0, 1]} yRange={[0, 5]} xLabel="x in (0,1)" yLabel="1/x" curves={[{ fn: (x) => 1 / x, domain: [0.2, 1] }]}>{({ X, Y }) => <><Point x={1} y={1} X={X} Y={Y} open /><Arrow x1={X(0.25)} y1={Y(4)} x2={X(0.2)} y2={Y(5)} /></>}</Plane></Compare></Figure>;
}
function SquareLocalChangeFigure() {
  return <Figure caption="The finite quotient is 4.1, whereas the derivative at 2 is 4. The actual finite change 0.41 is linear 0.4 plus remainder 0.01; the residual inset has its own labelled scale."><SquareChangeDrawing /></Figure>;
}
function MotionCurvatureFigure() {
  return <Figure caption="The cubic crosses its tangent at t=2. Velocity there is −3 m/s; acceleration is 0 m/s². These quantities use separate ordinates and units."><Compare><Plane label="Motion crossing tangent at2" xRange={[0, 4]} yRange={[-0.5, 4.5]} xLabel="time (s)" yLabel="position (m)" curves={[{ fn: motionPosition }, { fn: (t) => 2 - 3 * (t - 2), domain: [1.3, 2.7], tone: "blue" }]} /><div><Plane label="Actual velocity3(t-1)(t-3)" xRange={[0, 4]} yRange={[-4, 10]} xLabel="time (s)" yLabel="velocity (m/s)" curves={[{ fn: motionVelocity }]} /><Plane label="Actual acceleration6t-12" xRange={[0, 4]} yRange={[-12, 12]} xLabel="time (s)" yLabel="acceleration (m/s²)" curves={[{ fn: (t) => 6 * t - 12, tone: "blue" }]} /></div></Compare></Figure>;
}
function DerivativeFailureFigure() {
  return <Figure caption="The corner is continuous with quotient −1 on the left and +1 on the right. The real cube-root quotient |h|^(−2/3) is positive but unbounded. Neither supplies a finite derivative at 0."><Compare><Plane label="Absolute-value corner; unequal one-sided slopes" xRange={[-1, 1]} yRange={[0, 1.2]} xLabel="input h" yLabel="|h|" curves={[{ fn: Math.abs }]}>{({ X, Y }) => <Point x={0} y={0} X={X} Y={Y} />}</Plane><Plane label="Real cube-root vertical tangent; no finite derivative at0" xRange={[-1, 1]} yRange={[-1.2, 1.2]} xLabel="input h" yLabel="real cube root" curves={[{ fn: Math.cbrt, tone: "blue" }]}>{({ X, Y }) => <Point x={0} y={0} X={X} Y={Y} />}</Plane></Compare><div className="sc-values"><span>h=±1/8: cube-root quotient4</span><span>h=±1/64: quotient16</span></div></Figure>;
}
function ProductStripsFigure() {
  return <Figure caption="The strips and corner use one common area scale. The product-rule limit keeps the two first-order edge terms and removes the cross term after division by the input step."><ProductDrawing /></Figure>;
}
function ChainChangesFigure() {
  return <Figure caption="The three rulers show actual input, intermediate and output coordinates. The outer slope 8 is evaluated at u=4; inner slope 3 gives total derivative 24. Finite change 2.49 differs from prediction 2.4."><ChainDrawing /></Figure>;
}
function ZeroInnerChangeFigure() {
  return <Figure caption="For (x²)² at 0, both starting slopes vanish but the finite output change is 0.0001. The complete proof below handles zero intermediate increments without dividing by them."><ChainDrawing zeroInner /></Figure>;
}
function RadianSqueezeFigure() {
  return <Figure caption="All three regions share one angle and one unit circle. Inscribed triangle ≤ sector ≤ tangent triangle gives sin(h)≤h≤tan(h) for positive radian h. This π/6 case illustrates the geometric enclosure; the prose gives the near-zero conclusion."><RadianGeometry /></Figure>;
}
function InverseSlopeFigure() {
  return <Figure caption="The positive branch swaps coordinates. The finite pair (2,4)→(2.1,4.41) has slope 4.1; its inverse pair has slope 1/4.1. Limits give reciprocal derivatives 4 and 1/4 when the forward derivative is nonzero."><Compare><Plane label="Positive square branch, forward slope" xRange={[1.5, 2.5]} yRange={[2, 7]} xLabel="positive x" yLabel="y=x²" curves={[{ fn: (x) => x * x }, { points: [[2, 4], [2.1, 4.41]], tone: "blue" }]}>{({ X, Y }) => <><Point x={2} y={4} X={X} Y={Y} /><Point x={2.1} y={4.41} X={X} Y={Y} tone="blue" /></>}</Plane><Plane label="Inverse positive square-root branch, exchanged coordinates" xRange={[2, 7]} yRange={[1.5, 2.7]} xLabel="positive y" yLabel="x=√y" curves={[{ fn: Math.sqrt }, { points: [[4, 2], [4.41, 2.1]], tone: "blue" }]}>{({ X, Y }) => <><Point x={4} y={2} X={X} Y={Y} /><Point x={4.41} y={2.1} X={X} Y={Y} tone="blue" /></>}</Plane></Compare></Figure>;
}
function CircleBranchesFigure() {
  return <Figure caption="The equation gives upper and lower function branches. The gold tangent is at (3,4); the lower point (3,−4) has the opposite slope. At y=0, neither branch permits division by y to obtain a finite slope."><CircleDrawing /></Figure>;
}
function MeanValueFigure() {
  return <Figure caption="For x² on [0,2], the secant slope 2 equals the tangent slope at c=1. Subtracting the secant gives equal endpoint values 0 and an interior minimum −1. Continuity and differentiability, rather than the picture alone, establish the general existence result."><Compare><Plane label="Square secant2x and parallel tangent2x-1 at1" xRange={[0, 2]} yRange={[-1, 4.5]} xLabel="input x" yLabel="function / lines" curves={[{ fn: (x) => x * x }, { fn: (x) => 2 * x, tone: "blue" }, { fn: (x) => 2 * x - 1, tone: "rose" }]}>{({ X, Y }) => <Point x={1} y={1} X={X} Y={Y} tone="rose" />}</Plane><Plane label="Rolle object x-square minus2x; endpoints0,0 minimum-1" xRange={[0, 2]} yRange={[-1.2, 0.2]} xLabel="input x" yLabel="f − secant" curves={[{ fn: (x) => x * x - 2 * x }]}>{({ X, Y }) => <><Point x={0} y={0} X={X} Y={Y} /><Point x={2} y={0} X={X} Y={Y} /><Point x={1} y={-1} X={X} Y={Y} tone="blue" /></>}</Plane></Compare></Figure>;
}
function CandidateClassesFigure() {
  return <Figure caption="These are three different functions, with each candidate evaluated on its own ordinate. A stationary inflection is not a winner; the cusp is. The cubic has tied endpoint/interior winners, which the next paragraph interprets."><Compare><CandidatesDrawing kind="inflection" /><CandidatesDrawing kind="cusp" /></Compare><CandidatesDrawing /></Figure>;
}
function PerimeterOptimumFigure() {
  return <Figure caption="The side pairs 1×5, 2×4, 3×3, 5×1 have perimeter 12 and areas 5, 8, 9, 5. The common physical scale makes the area comparison meaningful; the derivative proves the maximum over all feasible sides."><RectangleFamily /></Figure>;
}
function RelatedCircleRateFigure() {
  return <Figure caption="The finite annulus includes the quadratic corner π(Δr)². At dr/dt=0.2 m/s the instantaneous area rate is 1.2π m²/s; it differs from the exact finite one-second area change 1.24π m²."><CircleAnnulus /></Figure>;
}
function TaggedPartitionFigure() {
  return <Figure caption="The widths are 0.5, 1, 0.5 and tags 0.25, 1, 1.75. Every tag lies within its own subinterval. The mesh is 1; unequal widths must not be replaced by one shared width."><TaggedDrawing /></Figure>;
}
function MeshComparisonFigure() {
  return <Figure caption="Keeping [0,1] as one piece leaves mesh 1 even as more right-side pieces are added. Uniform 4- and 8-panel partitions have meshes 0.5 and 0.25. Piece count and maximum width are different controls."><PartitionRuler partition={[0, 1, 1.25, 1.5, 1.75, 2]} label="Left interval retained" /><PartitionRuler partition={[0, 1, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875, 2]} label="More pieces, still mesh1" /><PartitionRuler partition={[0, 0.5, 1, 1.5, 2]} label="Four uniform pieces" /><PartitionRuler partition={Array.from({ length: 9 }, (_, i) => i / 4)} label="Eight uniform pieces" /></Figure>;
}
function SquareSumFigure() {
  return <Figure caption="The rectangles on [0,2] sum to 15/4. Below, each addressed layer belongs to an actual unit-index cube: its added face, edge and corner cells form shells of 1, 7, 19, 37 cubes. Their sum is 64. The cancellation of consecutive inner/outer cubes establishes the telescoping identity; the rectangle and cube coordinates have separate units."><TaggedDrawing uniform /><Compare>{[1,2,3,4].map(j=><CubeShell key={j} size={j}/>)}</Compare><p>Three face groups, three edge groups and one corner give 3a²+3a+1 = 3j²−3j+1, with a=j−1.</p><p>Each inner cube is the preceding row’s outer cube. Matching crossed-out counts cancel; only the last outer cube remains.</p><div className="sc-table-scroll" role="region" aria-label="All four outer-minus-inner cube counts and shell contributions" tabIndex={0}><table><thead><tr><th>j</th><th>outer j³</th><th>subtract inner (j−1)³</th><th>added shell</th></tr></thead><tbody>{[1,2,3,4].map(j=><tr key={j}><th scope="row">{j}</th><td>{j<4?<del>{j**3}</del>:j**3}</td><td>{j>1?<del>{(j-1)**3}</del>:0}</td><td>{j**3-(j-1)**3}</td></tr>)}</tbody></table></div><p>1 + 7 + 19 + 37 = 64 = 4³. The four rectangle widths are1/2, with right heights1/4,1,9/4,4.</p></Figure>;
}
function SignedMagnitudeFigure() {
  return <Figure caption="Gold positive and rose negative regions have signed leg totals +4, −4, +4 m. The speed plot makes the middle height positive on the same axes, giving distance 12 m rather than displacement 4 m."><Compare><SignedDrawing /><SignedDrawing absolute /></Compare></Figure>;
}
function AccumulationStripFigure() {
  return <Figure caption="The rate strip has exact signed area 31/24; its average height 31/12 is an accumulation secant. The local rate height 2 is the accumulation tangent slope. These finite and local quantities remain distinct."><AccumulationDrawing /></Figure>;
}
function ConstantPrimitiveFigure() {
  return <Figure caption="Vertical constants −1, 0, 1 change primitive values but leave every 0→2 difference equal to 8/3. One constant cancels on a connected interval; disconnected domain components need their own constants."><Plane label="Three true primitives x-cube/3+C on common axes" xRange={[0, 2]} yRange={[-1.2, 4]} xLabel="input x" yLabel="primitive value" curves={[-1, 0, 1].map((c, i) => ({ fn: (x) => x ** 3 / 3 + c, tone: ["blue", "gold", "rose"][i] }))} /><div className="sc-values">{[-1, 0, 1].map((c) => <span key={c}>C={c}: {fmt(8 / 3 + c)} − ({c}) = 8/3</span>)}</div></Figure>;
}
function StepAccumulationFigure() {
  return <Figure caption="The rate is 0 left of 0 and 1 at/right of 0. Its integral max(0,x) is continuous with unequal slopes 0 and 1 at 0. Integrability alone does not imply the FTC’s pointwise derivative conclusion there."><Compare><Plane label="Step rate0left/1right; chosenvalue1 at0" xRange={[-1, 1]} yRange={[-0.2, 1.2]} xLabel="input t" yLabel="step rate" curves={[{ fn: () => 0, domain: [-1, -1e-6] }, { fn: () => 1, domain: [0, 1], tone: "blue" }]}>{({ X, Y }) => <><Point x={0} y={0} X={X} Y={Y} open /><Point x={0} y={1} X={X} Y={Y} tone="blue" /></>}</Plane><Plane label="Continuous accumulated step max(0,x), corner at0" xRange={[-1, 1]} yRange={[-0.2, 1.2]} xLabel="upper endpoint x" yLabel="accumulated total" curves={[{ fn: (x) => Math.max(0, x) }]}>{({ X, Y }) => <Point x={0} y={0} X={X} Y={Y} />}</Plane></Compare></Figure>;
}
function MovingBoundsFigure() {
  return <Figure caption="At x=2 the rate height at the lower endpoint 2 is 5, with input speed 1. At upper endpoint 4 it is 17, with speed 4. The entering 68 minus leaving 5 gives rate 63; the accumulated total is 62/3."><Plane label="Actual1+t-square on variable interval[2,4]; lowerheight5 upper17" xRange={[0, 4.5]} yRange={[0, 22]} xLabel="rate input t" yLabel="rate 1+t²" curves={[{ fn: (t) => 1 + t * t }]}>{({ X, Y }) => <><Area fn={(t) => 1 + t * t} a={2} b={4} X={X} Y={Y} /><Point x={2} y={5} X={X} Y={Y} tone="blue" /><Point x={4} y={17} X={X} Y={Y} /><Arrow x1={X(2)} x2={X(2.1)} y1={Y(1)} y2={Y(1)} tone="blue" /><Arrow x1={X(4)} x2={X(4.4)} y1={Y(1)} y2={Y(1)} /></>}</Plane><div className="sc-values"><span>lower speed1</span><span>upper speed4</span><span>arrows show linear endpoint predictions for the same input increment0.1; they are not exact finite endpoint changes</span></div></Figure>;
}
function TransformedBoundsFigure() {
  return <Figure caption="The interval x: 0→2 maps to u: 1→5. Heights and axes differ: the original integrand 2x(1+x²)³ and transformed u³ both have signed integral 156. Pixel areas from different coordinate scales are not equated."><Compare><Plane label="Original2x(1+x-square)^3 on[0,2]" xRange={[0, 2]} yRange={[0, 550]} xLabel="original input x" yLabel="original integrand" curves={[{ fn: (x) => 2 * x * (1 + x * x) ** 3 }]}>{({ X, Y }) => <Area fn={(x) => 2 * x * (1 + x * x) ** 3} a={0} b={2} X={X} Y={Y} />}</Plane><Plane label="Transformed u-cube on[1,5]" xRange={[1, 5]} yRange={[0, 130]} xLabel="u=1+x²" yLabel="transformed u³" curves={[{ fn: (u) => u ** 3 }]}>{({ X, Y }) => <Area fn={(u) => u ** 3} a={1} b={5} X={X} Y={Y} />}</Plane></Compare></Figure>;
}
function NonmonotoneSubstitutionFigure() {
  return <Figure caption="The source passes −1→0→1 while u=x² traverses 1→0→1. The signed primitive changes −sin(1) and +sin(1) cancel; this uses the chain-rule substitution form rather than an assumed invertible map."><Plane label="Actual nonmonotone map x-square on[-1,1]" xRange={[-1, 1]} yRange={[0, 1.2]} xLabel="original input x" yLabel="u=x²" curves={[{ fn: (x) => x * x }]}>{({ X, Y }) => <><Arrow x1={X(-1)} y1={Y(1)} x2={X(-0.5)} y2={Y(0.25)} tone="rose" /><Arrow x1={X(0.5)} y1={Y(0.25)} x2={X(1)} y2={Y(1)} /></>}</Plane><div className="sc-values"><span>first u1→0: −sin1</span><span>then u0→1: +sin1</span><span>total0</span></div></Figure>;
}
function PartsBoundaryFigure() {
  return <Figure caption="The product x sin(x) rises from 0 to sin(1). Its rate is sin(x)+x cos(x), so its two accumulated contributions sum to that boundary change. Moving ∫sin(x)=1−cos(1) leaves ∫x cos(x)=sin(1)+cos(1)−1 on [0,1]."><Compare><Plane label="Product xsinx on[0,1], boundarysin1" xRange={[0, 1]} yRange={[0, 1]} xLabel="input x" yLabel="product x sin x" curves={[{ fn: (x) => x * Math.sin(x) }]}>{({ X, Y }) => <><Point x={0} y={0} X={X} Y={Y} /><Point x={1} y={Math.sin(1)} X={X} Y={Y} /></>}</Plane><Plane label="Actual product rate split into sinx and xcosx" xRange={[0, 1]} yRange={[0, 1.5]} xLabel="input x" yLabel="rate contributions" curves={[{ fn: Math.sin }, { fn: (x) => x * Math.cos(x), tone: "blue" }, { fn: (x) => Math.sin(x) + x * Math.cos(x), tone: "rose" }]} /></Compare></Figure>;
}
function IntegrationDomainsFigure() {
  return <Figure caption="Partial fractions retain poles −1 and 0, outside selected [1,2]. The unit quarter circle uses equal coordinate scales and x=sin(θ) with 0≤θ≤π/2, where cos(θ)≥0; its area is π/4."><Compare><Plane label="Rational1/[x(x+1)] with excluded poles-1,0" xRange={[-2, 2.5]} yRange={[-8, 8]} xLabel="input x" yLabel="rational height" curves={[{ fn: (x) => 1 / (x * (x + 1)), domain: [-2, -1.1] }, { fn: (x) => 1 / (x * (x + 1)), domain: [-0.9, -0.1], tone: "rose" }, { fn: (x) => 1 / (x * (x + 1)), domain: [0.1, 2.5] }]}>{({ X, Y, top, bottom }) => <>{[-1, 0].map((v) => <line key={v} x1={X(v)} x2={X(v)} y1={top} y2={bottom} className="sc-reference" />)}<Area fn={(x) => 1 / (x * (x + 1))} a={1} b={2} X={X} Y={Y} tone="blue" /></>}</Plane><Scene label="True unit quarter circle on equal x/y length scales" height={315}><path d="M60,250L60,40A210,210 0 0 1 270,250Z" className="sc-area gold" /><path d="M60,30V250H290" className="sc-axis" /><Label x="60" y="280">0</Label><Label x="270" y="280">1</Label><Label x="48" y="47" anchor="end">1</Label><Label x="60" y="21" anchor="start">√(1−x²)</Label><Label x="170" y="307">x = sinθ</Label></Scene></Compare></Figure>;
}
function LogAreaFigure() {
  return <Figure caption="Oriented integrals define L(2), another L(2) from 2 to 4, and −L(2) backward from 1 to 0.5. Area scaling under t=2u proves equality of the first two; the separate constant-difference proof establishes the full product law."><Plane label="Positive reciprocal curve; actual intervals.5..1,1..2,2..4" xRange={[0.5, 4]} yRange={[0, 2.2]} xLabel="positive t" yLabel="height 1/t" curves={[{ fn: (t) => 1 / t }]}>{({ X, Y }) => <><Area fn={(t) => 1 / t} a={0.5} b={1} X={X} Y={Y} tone="rose" /><Area fn={(t) => 1 / t} a={1} b={2} X={X} Y={Y} /><Area fn={(t) => 1 / t} a={2} b={4} X={X} Y={Y} tone="blue" /><Arrow x1={X(1)} x2={X(0.5)} y1={Y(0.15)} y2={Y(0.15)} tone="rose" /></>}</Plane><div className="sc-values"><span>1→2: ln2</span><span>2→4: ln2</span><span>1→0.5: −ln2</span></div></Figure>;
}
function InverseExponentialFigure() {
  return <Figure caption="The inverse exchanges points (e,1) and (1,e). The separate finite strip at n=4 proves 0.8≤4 ln(1.25)≤1; it is not itself the n→∞ conclusion."><Compare><Plane label="Logarithm with pointe,1" xRange={[0.5, 4]} yRange={[-1, 1.5]} xLabel="positive input x" yLabel="ln x" curves={[{ fn: Math.log }]}>{({ X, Y }) => <Point x={Math.E} y={1} X={X} Y={Y} />}</Plane><Plane label="Inverse exponential with point1,e" xRange={[-1, 1.5]} yRange={[0, 5]} xLabel="log output y" yLabel="exp y" curves={[{ fn: Math.exp }]}>{({ X, Y }) => <Point x={1} y={Math.E} X={X} Y={Y} />}</Plane></Compare><Plane label="Reciprocal strip1to1.25, heightsbounded.8and1" xRange={[1, 1.25]} yRange={[0, 1.1]} xLabel="strip input t" yLabel="height 1/t" curves={[{ fn: (t) => 1 / t }, { fn: () => 0.8, tone: "blue" }, { fn: () => 1, tone: "rose" }]}>{({ X, Y }) => <Area fn={(t) => 1 / t} a={1} b={1.25} X={X} Y={Y} />}</Plane><div className="sc-values"><span>strip width1/4</span><span>four times lower area0.8</span><span>four times upper area1</span></div></Figure>;
}
function TaylorBoundFigure() {
  const actual = Math.sqrt(4.4), error = 2.1 - actual;
  return <Figure caption="The actual error ≈0.002382304 lies below 0.0025, using the whole-interval second-derivative bound 1/32. The separate error graph uses its own labelled scale."><Compare><Plane label="Square root and tangent at4" xRange={[3.8, 4.6]} yRange={[1.9, 2.2]} xLabel="input x" yLabel="√x / tangent" curves={[{ fn: Math.sqrt }, { fn: (x) => 2 + (x - 4) / 4, tone: "blue" }]}>{({ X, Y }) => <><Point x={4.4} y={actual} X={X} Y={Y} /><Point x={4.4} y={2.1} X={X} Y={Y} tone="blue" /></>}</Plane><Plane label="Magnified tangent minus root error and bound h-square/64" xRange={[0, 0.4]} yRange={[0, 27e-4]} xLabel="increment h" yLabel="error / bound" curves={[{ fn: (h) => 2 + h / 4 - Math.sqrt(4 + h) }, { fn: (h) => h * h / 64, tone: "blue" }]}>{({ X, Y }) => <Point x={0.4} y={error} X={X} Y={Y} />}</Plane></Compare></Figure>;
}
function logPolynomial(x, n) {
  let sum = 0;
  for (let j = 1; j <= n; j++) sum += (-1) ** (j + 1) * x ** j / j;
  return sum;
}
function SeriesOutsideRadiusFigure() {
  const x = 1.5, value = Math.log1p(x);
  return <Figure caption="At x=1.5 the logarithm exists, but the individual series terms do not tend to 0. The even-degree finite values below worsen in these cases; finite derivative matching does not certify an infinite-series identity."><Plane label="ln(1+x) and actual degree2,4,6 polynomials" xRange={[0, 1.5]} yRange={[-1, 1.5]} xLabel="input x" yLabel="function / polynomial" curves={[{ fn: Math.log1p }, { fn: (x2) => logPolynomial(x2, 2), tone: "blue" }, { fn: (x2) => logPolynomial(x2, 4), tone: "rose" }, { fn: (x2) => logPolynomial(x2, 6), tone: "blue", dashed: true }]} /><div className="sc-table-scroll" role="region" aria-label="Actual outside-radius finite errors" tabIndex="0"><table><thead><tr><th>degree</th><th>polynomial at1.5</th><th>absolute error</th></tr></thead><tbody>{[2, 4, 6].map((n) => <tr key={n}><td>{n}</td><td>{fmt(logPolynomial(x, n), 8)}</td><td>{fmt(Math.abs(logPolynomial(x, n) - value), 8)}</td></tr>)}</tbody></table></div><p>True ln2.5 ≈ {fmt(value, 8)}. The next-term magnitudes 1.5ⁿ/n eventually grow rather than tending to0.</p></Figure>;
}
function FloatingCancellationFigure() {
  const output = singleVariableCalculusExamples.find((x) => x.id === "finite-difference-rounding").expected, rows = output.split("\n").slice(0, 4).map((line) => {
    const m = line.match(/^h=([^:]+): subtract=([^,]+), expm1=(.+)$/);
    if (!m) throw new Error("Recorded float output does not match its complete source contract.");
    return m.slice(1);
  });
  return <Figure caption="These are the complete program’s captured Python float results. Exact last digits may depend on numerical implementation. Truncation of a mathematical limit and cancellation in finite arithmetic are different errors."><div className="sc-table-scroll" role="region" aria-label="Recorded subtraction versus expm1 results" tabIndex="0"><table><thead><tr><th>step h</th><th>raw subtraction quotient</th><th>expm1 quotient</th></tr></thead><tbody>{rows.map(([h, a, b]) => <tr key={h}><th scope="row">{h}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div><p>Analytic derivative at0:1. At1e−16 direct subtraction reports0, while expm1 retains the difference.</p></Figure>;
}
function ImproperBoundariesFigure() {
  return <Figure caption="The origin cut at δ=0.04 for x^(−1/2) retains 1.6, missing 0.4 from finite limit 2. At the tail, x^(−1) has logarithmically divergent total; x^(−3/2) cut at B=16 retains 1.5, missing 0.5 from finite limit 2. Each singularity or infinity is a limit, not an endpoint value."><Compare><Plane label="Origin power.5 truncated.04to1, exact1.6" xRange={[0, 1]} yRange={[0, 5]} xLabel="positive x" yLabel="x^(−1/2)" curves={[{ fn: (x) => 1 / Math.sqrt(x), domain: [0.04, 1] }]}>{({ X, Y }) => <><Area fn={(x) => 1 / Math.sqrt(x)} a={0.04} b={1} X={X} Y={Y} /><Arrow x1={X(0.0625)} y1={Y(4)} x2={X(0.04)} y2={Y(5)} /></>}</Plane><div><Plane label="Tail power1 truncated1to10, exactln10" xRange={[1, 10]} yRange={[0, 1.1]} xLabel="tail x" yLabel="1/x" curves={[{ fn: (x) => 1 / x }]}>{({ X, Y }) => <Area fn={(x) => 1 / x} a={1} b={10} X={X} Y={Y} />}</Plane><Plane label="Tail power1.5 truncated1to16, exact1.5" xRange={[1, 16]} yRange={[0, 1.1]} xLabel="tail x" yLabel="x^(−3/2)" curves={[{ fn: (x) => x ** -1.5 }]}>{({ X, Y }) => <Area fn={(x) => x ** -1.5} a={1} b={16} X={X} Y={Y} />}</Plane></div></Compare></Figure>;
}
function PrincipalValueFigure() {
  const d = 0.125;
  return <Figure caption="Separate ordinary sides have totals ln(δ)→−∞ and −ln(δ)→+∞. At equal finite cutoffs δ=1/8 they cancel, defining a symmetric prescription. Both independent ordinary convergence requirements still fail."><Plane label="Actual1/x on[-1,-1/8] and[1/8,1]; separate signed pieces" xRange={[-1, 1]} yRange={[-8, 8]} xLabel="input x" yLabel="signed reciprocal" curves={[{ fn: (x) => 1 / x, domain: [-1, -d], tone: "rose" }, { fn: (x) => 1 / x, domain: [d, 1] }]}>{({ X, Y }) => <><Area fn={(x) => 1 / x} a={-1} b={-d} X={X} Y={Y} tone="rose" /><Area fn={(x) => 1 / x} a={d} b={1} X={X} Y={Y} /></>}</Plane><div className="sc-values"><span>left ln(1/8) ≈ {fmt(Math.log(d))}</span><span>right −ln(1/8) ≈ {fmt(-Math.log(d))}</span><span>symmetric finite sum0</span></div></Figure>;
}
function WorkContributionFigure() {
  return <Figure caption="Force component 3+2x newtons acts along the position interval 0 to 2 m. A strip contributes F(x)Δx in joules. Exact accumulated work 10 J uses position, not time, as input."><Plane label="Actual force3+2x versus position, work10" xRange={[0, 2]} yRange={[0, 8]} xLabel="position (m)" yLabel="force (N)" curves={[{ fn: (x) => 3 + 2 * x }]}>{({ X, Y }) => <Area fn={(x) => 3 + 2 * x} a={0} b={2} X={X} Y={Y} />}</Plane><div className="sc-values"><span>∫₀²(3+2x)dx = 10 N·m = 10 J</span></div></Figure>;
}
function RodBalanceFigure() {
  return <Figure caption="Density height and piece length supply local mass; weighting that mass by position supplies a first moment. Exact moment 20/3 divided by exact mass 6 gives balance 10/9 m, not the geometric midpoint."><RodDrawing /></Figure>;
}
function DiskVolumeFigure() {
  const unit = 70, X = (x) => 45 + x * unit, Y = (y) => 160 - y * unit, curve = Array.from({ length: 121 }, (_, i) => {
    const x = 3 * i / 120;
    return `${X(x)},${Y(Math.sqrt(x))}`;
  }).join(" ");
  return <Figure caption="The meridian uses equal coordinate length units. Separate circular end views share their own radius scale. Radius √x gives area πx; multiplying area by slice thickness yields volume 9π/2."><Scene label="True equal-length meridian y=±sqrtx on0..3" height={320}><line x1="45" x2="290" y1="160" y2="160" className="sc-axis" /><polyline points={curve} className="sc-curve gold" /><polyline points={Array.from({ length: 121 }, (_, i) => {
    const x = 3 * i / 120;
    return `${X(x)},${Y(-Math.sqrt(x))}`;
  }).join(" ")} className="sc-curve gold" />{[1, 2, 3].map((x) => <line key={x} x1={X(x)} x2={X(x)} y1={Y(Math.sqrt(x))} y2={Y(-Math.sqrt(x))} className="sc-reference blue" />)}{[0, 1, 2, 3].map((x) => <Label key={x} x={X(x)} y="312">{x}</Label>)}<Label x="45" y="20" anchor="start">meridian radius √x</Label></Scene><Scene label="Actual disk end views atx1,2,3 with common radius unit31pixels" height={205}>{[1, 2, 3].map((x, i) => <g key={x}><circle cx={55 + 115 * i} cy="80" r={31 * Math.sqrt(x)} className="sc-area blue" /><Label x={55 + 115 * i} y="163">x = {x}</Label><Label x={55 + 115 * i} y="193">area {x}π</Label></g>)}</Scene><div className="sc-values"><span>x1: radius1, areaπ</span><span>x2: radius√2, area2π</span><span>x3: radius√3, area3π</span></div></Figure>;
}
function ArcLengthFigure() {
  const unit = 61, X = (x) => 45 + x * unit, Y = (y) => 264 - y * unit, fn = (x) => 2 / 3 * x ** 1.5, points = Array.from({ length: 121 }, (_, i) => {
    const x = i / 40;
    return `${X(x)},${Y(fn(x))}`;
  }).join(" ");
  return <Figure caption="Both coordinate directions share one length scale. Four chord segments illustrate √(Δx²+Δy²); the derivative and mean-value argument justify the refinement limit ∫₀³√(1+x)dx=14/3."><Scene label="True common-length y=(2/3)x^1.5 curve and four chords on0..3" height={320}><path d="M45,38V264H245" className="sc-axis" /><polyline points={points} className="sc-curve gold" /><polyline points={[0, 0.75, 1.5, 2.25, 3].map((x) => `${X(x)},${Y(fn(x))}`).join(" ")} className="sc-curve blue" />{[0, 1, 2, 3].map((v) => <g key={v}><Label x={X(v)} y="291">{v}</Label><Label x="33" y={Y(v) + 6} anchor="end">{v}</Label></g>)}<Label x="143" y="310">length input x</Label></Scene></Figure>;
}
function DecayEulerFigure() {
  return <Figure caption="For initial value 3, coefficient −2 and final time 1, exact decay remains positive. One h=1 tangent step crosses below zero; two h=0.5 steps reach 0. A finite update and an exact solution are different mathematical objects."><EulerDrawing /></Figure>;
}
export {
  AccumulationStripFigure,
  ArcLengthFigure,
  CandidateClassesFigure,
  ChainChangesFigure,
  CircleBranchesFigure,
  ConstantPrimitiveFigure,
  ContinuityHypothesesFigure,
  DecayEulerFigure,
  DerivativeFailureFigure,
  DiskVolumeFigure,
  FiniteSecantFigure,
  FloatingCancellationFigure,
  ImproperBoundariesFigure,
  IntegrationDomainsFigure,
  InverseExponentialFigure,
  InverseSlopeFigure,
  JourneyLegsFigure,
  JourneyObservationsFigure,
  JumpLimitsFigure,
  LimitVersusValueFigure,
  LogAreaFigure,
  MeanValueFigure,
  MeshComparisonFigure,
  MotionCurvatureFigure,
  MovingBoundsFigure,
  NonmonotoneSubstitutionFigure,
  PartsBoundaryFigure,
  PerimeterOptimumFigure,
  PrincipalValueFigure,
  ProductStripsFigure,
  RadianSqueezeFigure,
  RelatedCircleRateFigure,
  RodBalanceFigure,
  SeriesOutsideRadiusFigure,
  SignedMagnitudeFigure,
  SquareLocalChangeFigure,
  SquareSumFigure,
  StepAccumulationFigure,
  TaggedPartitionFigure,
  TaylorBoundFigure,
  ToleranceBandFigure,
  TransformedBoundsFigure,
  UnboundedBranchesFigure,
  WorkContributionFigure,
  ZeroInnerChangeFigure
};
