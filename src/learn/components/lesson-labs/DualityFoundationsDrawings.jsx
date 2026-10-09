import { C, Figure, Facts, Panels, Plot, HalfPlane, CostAxis, number, pointText } from './DualityDrawingPrimitives.jsx';
export function CoordinateErrors() {
  return <Figure id="D01" description="The amber candidate (2,2) differs from cyan target (3,4) by −1 horizontally and −2 vertically. Their squared contributions are 1 and 4."><HalfPlane candidate={[2, 2]} extra={p => <>{p.line([3, 4], [2, 4], C.candidate)}{p.line([2, 4], [2, 2], C.candidate)}{p.mark([2, 4], 'candidate')}</>} /><Facts rows={[["Target t", '(3, 4)', 'objective'], ['Candidate z', '(2, 2)', 'candidate'], ['Horizontal error', '−1; square 1'], ['Vertical error', '−2; square 4'], ['Squared distance', '1 + 4 = 5']]} /></Figure>;
}
export function AllowedHalfPlane() {
  return <Figure id="D02" description="Hatching fills the whole allowed side x+y≤5, including negative coordinates. The boundary continues beyond the window."><HalfPlane candidate={[2, 2]} extra={p => <>{p.mark([4, 4], 'invalid', 'v')}{p.vector([-1, 6], [-.5, 5.5], C.neutral)}{p.vector([6, -1], [5.5, -.5], C.neutral)}</>} /><Facts rows={[["Allowed z=(2,2)", 'sum 4 ≤ 5', 'candidate'], ['Target t=(3,4)', 'sum 7 > 5', 'objective'], ['Rejected v=(4,4)', 'sum 8 > 5', 'invalid']]} /></Figure>;
}
export function FeasibleUpperBound() {
  return <Figure id="D03" description="The feasible candidate supplies upper bound 5. Before solving, the best feasible value is unknown between the nonnegative lower limit 0 and this upper bound; the forbidden target is not a feasible witness."><Plot domain={[-.5, 6]} range={[-1, 2]} xLabel="cost" yLabel="">{p => <>{p.line([0, 0], [5, 0], C.optimum, {
          strokeWidth: 5,
          strokeDasharray: '4 5'
        })}{p.mark([5, 0], 'candidate', '5')}{p.mark([0, 1], 'invalid', '0')}{p.vector([5, 0], [.2, 0], C.optimum)}</>}</Plot><Facts rows={[["Feasible upper bound", 'f(2,2)=5', 'candidate'], ['Unknown best value', '0 ≤ p* ≤ 5'], ['Forbidden target', 'f(3,4)=0; sum 7 > 5', 'invalid']]} /></Figure>;
}
export function ProjectionGeometry() {
  return <Figure id="D04" description="The closest contour touches the boundary at (2,3). The correction follows normal (1,1), perpendicular to tangent (1,−1), giving squared distance 2."><HalfPlane foot={[2, 3]} contours arrows extra={p => <>{p.line([2.2,3.2],[2.4,3],C.neutral)}{p.line([2.4,3],[2.2,2.8],C.neutral)}</>} /><Facts rows={[["Target t", '(3, 4)', 'objective'], ['Proved optimum z*', '(2, 3)', 'optimum'], ['Normal / tangent', '(1,1) · (1,−1) = 0'], ['Cost', '1² + 1² = 2']]} /></Figure>;
}
export function GeneralNormal() {
  return <Figure id="D05" description="Normal (1,2) changes the total five times as fast as its scalar step. Removing (2/5)(1,2) from target (2,1) lands at (8/5,1/5), with cost 4/5."><HalfPlane budget={2} normal={[1, 2]} target={[2, 1]} foot={[1.6, .2]} domain={[-1, 4]} arrows contours /><Facts rows={[["Boundary", 'x + 2y = 2'], ['Target total', '2 + 2×1 = 4', 'objective'], ['Normal correction', '(2/5, 4/5)'], ['Foot / cost', '(8/5, 1/5); 4/5', 'optimum']]} /></Figure>;
}
export function SignedCredit() {
  return <Figure id="D07" description="At a feasible point the signed price adjustment is negative: start at cost 5, add −1, arrive at L=4. A negative price would reverse this sign and invalidate the lower-bound argument."><Plot domain={[0, 6]} range={[-1, 2]} xLabel="cost" yLabel="">{p => <>{p.mark([5, 1], 'candidate', 'f')}{p.mark([4, 1], 'price', 'L')}{p.vector([5, 1], [4, 1], C.price)}{p.mark([6, 0], 'invalid')}</>}</Plot><Facts rows={[["Objective f", '5', 'candidate'], ['Price × residual', '1 × (−1) = −1', 'price'], ['Lagrangian L', '5 − 1 = 4', 'price'], ['Invalid price −1', '5 + 1 = 6 exceeds f', 'invalid']]} /></Figure>;
}
export function TranslatedBowl() {
  return <Figure id="D08" description="Fix price 1 before minimizing over all real points. The original bowl at (3,4) moves to (2.5,3.5) and its global floor becomes 1.5; the new centre is outside the primal half-plane."><Panels><HalfPlane contours /><HalfPlane centre={[2.5, 3.5]} extra={p => [.6, 1.4, 2.2].map(r => <g key={r}>{p.circle([2.5, 3.5], r, C.price)}</g>)} /></Panels><Plot domain={[-2, 2]} range={[0, 6]} xLabel="displacement r" yLabel="L">{p => <>{p.curve(r => 1.5 + r * r, C.price)}{p.mark([0, 1.5], 'price')}</>}</Plot><Facts rows={[["Original centre / floor", '(3,4) / 0', 'objective'], ['Priced centre / floor', '(2.5,3.5) / 1.5', 'price'], ['Slice through priced centre', 'L = 1.5 + r²; orthogonal displacements also add a square']]} /></Figure>;
}
export function TwoBoundChains() {
  return <Figure id="D09" description="The two aligned cost scales distinguish minimizing L from optimizing the constrained problem: q=1.5≤L(z)=4≤f(z)=5, and q=1.5≤p*=2≤f(z)=5."><Panels><CostAxis domain={[0, 6]} items={[{
        label: 'q',
        value: 1.5,
        role: 'price'
      }, {
        label: 'L(z)',
        value: 4,
        role: 'price'
      }, {
        label: 'f(z)',
        value: 5,
        role: 'candidate'
      }]} /><CostAxis domain={[0, 6]} items={[{
        label: 'q',
        value: 1.5,
        role: 'price'
      }, {
        label: 'p*',
        value: 2,
        role: 'optimum'
      }, {
        label: 'f(z)',
        value: 5,
        role: 'candidate'
      }]} /></Panels></Figure>;
}
export function DualParabola() {
  return <Figure id="D10" description="Among nonnegative prices, λ=2 raises the globally minimized floor as high as possible, to 2. Price 1 produces only 1.5."><Plot domain={[0, 4]} range={[-.5, 3]} xLabel="price λ" yLabel="q(λ)">{p => <>{p.curve(l => 2 * l - l * l / 2, C.price)}{p.mark([1, 1.5], 'price', '1')}{p.mark([2, 2], 'optimum', '2')}</>}</Plot><Facts rows={[["Price 1 / bound", '1.5', 'price'], ['Best price 2 / bound', '2', 'optimum'], ['Formula', 'q(λ)=2λ−λ²/2; λ≥0']]} /></Figure>;
}
export function TwoGapCauses() {
  return <Figure id="D11" description="The candidate differs from the priced minimizer by squared distance 2.5. One unit of spare budget contributes price times slack 1. These cost terms add to the certified gap 3.5."><HalfPlane candidate={[2, 2]} centre={[2.5, 3.5]} extra={p => p.line([2, 2], [2.5, 3.5], C.candidate)} /><CostAxis items={[{
      label: 'Minimization term',
      value: 2.5,
      role: 'candidate'
    }, {
      label: 'Price × slack',
      value: 1,
      role: 'price'
    }, {
      label: 'Total gap',
      value: 3.5,
      role: 'neutral'
    }]} /><Facts rows={[["Displacement", '(−.5, −1.5); square .25 + 2.25'], ['Certificate', '5 − 1.5 = 2.5 + 1 = 3.5']]} /></Figure>;
}
export function EqualityNormals() {
  return <Figure id="D13" description="For x+y=2 the minimum-norm point is (1,1). The signed multiplier ν=−2 balances its gradient. Reversing the equality flips ν, leaving the same force."><Plot domain={[-1, 4]} equal description="Equality line and balanced gradient arrows">{p => <>{p.line([-1, 3], [3, -1], C.neutral)}{p.mark([1, 1], 'optimum')}{p.vector([1, 1], [3, 3], C.objective)}{p.vector([3, 3], [1, 1], C.price, true)}{p.vector([1, 1], [2, 0], C.neutral)}{p.vector([1, 1], [0, 2], C.neutral)}</>}</Plot><Facts rows={[["Objective gradient", '(2,2)', 'objective'], ['h=x+y−2; ν=−2', 'ν∇h=(−2,−2)', 'price'], ['Reversed h=2−x−y; ν=2', 'ν∇h=(−2,−2)', 'price'], ['Inequality 2−x−y≤0', 'λ=2 ≥ 0; same balanced force']]} /></Figure>;
}
export function FiniteDualDomain() {
  return <Figure id="D14" description="A nonzero linear slope has no finite infimum over the whole real line. Only λ=1 makes L=(1−λ)x+λ constant at 1."><Panels>{[0, 1, 2].map(l => <div key={l}><Plot domain={[-3, 3]} range={[-3, 5]} xLabel="x" yLabel={`λ=${l}`}>{p => <>{p.curve(x => (1 - l) * x + l, C.price)}{l !== 1 && p.vector(l === 0 ? [-1, -1] : [1, 1], l === 0 ? [-2.5, -2.5] : [2.5, -.5], C.invalid)}</>}</Plot><Facts rows={[[`λ=${l}`, l === 1 ? 'slope 0; q=1' : `slope ${1 - l}; q=−∞`, l === 1 ? 'price' : 'invalid']]} /></div>)}</Panels></Figure>;
}
export function UnattainedInfima() {
  return <Figure id="D15" description="An infimum need not be achieved. The exponential tends toward zero as x decreases without bound; on the open positive ray, x tends to zero without reaching it."><Panels><Plot domain={[-6, 2]} range={[-.3, 3]} xLabel="x" yLabel="exp(x)">{p => <>{p.curve(Math.exp)}{p.vector([-3, .07], [-5, .01], C.objective)}{p.line([-6, 0], [2, 0], C.neutral, {
            strokeDasharray: '5 5'
          })}</>}</Plot><Plot domain={[-.5, 3]} range={[-.5, 3]} xLabel="x>0" yLabel="f(x)=x">{p => <>{p.line([0, 0], [3, 3], C.objective)}<circle cx={p.x(0)} cy={p.y(0)} r={.32*p.f} fill="#0d0d0d" stroke={C.neutral} strokeWidth="2"><title>Excluded endpoint: x=0 is outside the domain</title></circle>{p.vector([1, 1], [.25, .25], C.objective)}</>}</Plot></Panels><Facts rows={[["Whole real line exp(x)", 'infimum 0; no finite minimizer'], ['Open domain x>0', 'infimum 0; neutral hollow circle excludes the endpoint']]} /></Figure>;
}
export function ConcaveEnvelope() {
  return <Figure id="D16" description="Each fixed decision gives an affine line in price. The global infimum is their concave lower envelope; these three displayed lines are only illustrative members, not the complete family."><Plot domain={[0, 4]} range={[-.5, 6]} xLabel="price λ" yLabel="cost / bound">{p => <>{p.curve(l => 2 * l, C.neutral, {
          strokeDasharray: '3 5'
        })}{p.curve(l => .5 + l, C.candidate, {
          strokeDasharray: '5 5'
        })}{p.curve(() => 2, C.optimum, {
          strokeDasharray: '7 5'
        })}{p.curve(l => 2 * l - l * l / 2, C.price)}{p.mark([2, 2], 'price')}</>}</Plot><Facts rows={[["Three fixed-decision lines", '2λ; .5+λ; 2'], ['Complete envelope', 'q(λ)=2λ−λ²/2', 'price']]} /></Figure>;
}
export function RetainedDomain() {
  return <Figure id="D17" description="The graph locates the minimum of (x+1)² on x≥0 at (0,1). The separate scalar axis measures gradient contributions in cost per unit x: derivative +2 and outward normal −2 start at the same zero and sum to zero.">
    <Plot domain={[-2, 3]} range={[-1, 10]} xLabel="x" yLabel="cost (x+1)²">{p => <>{p.polygon([[0,-1],[3,-1],[3,10],[0,10]])}{p.curve(x => (x+1)**2)}{p.mark([0,1], 'optimum')}{p.vector([0,-.5],[2,-.5],C.neutral)}</>}</Plot>
    <Facts rows={[["Graph minimum", 'x=0, cost 1', 'optimum'], ['Shaded domain / right arrow', 'x≥0 / feasible displacements d≥0'], ['Graph slope at x=0', 'f′(0)=2(x+1)|₀=+2; cost per unit x', 'objective']]} />
    <Plot domain={[-3, 3]} range={[-.75, 1]} xLabel="cost per unit x" yLabel="" description="One common scalar axis: objective gradient +2 to the right; normal −2 to the left; sum zero.">{p => <>{p.vector([0,0],[2,0],C.objective)}{p.vector([0,0],[-2,0],C.price,true)}{p.mark([2,0],'objective','+2')}{p.mark([-2,0],'price','−2')}{p.mark([0,0],'optimum')}</>}</Plot>
    <Facts rows={[["Objective gradient", '+2: cyan circle, solid arrow', 'objective'], ['Chosen outward normal', '−2: lavender diamond, dashed arrow', 'price'], ['Same-axis balance', '(+2)+(−2)=0', 'optimum'], ['Normal cone at 0', '(−∞,0]; choose −2', 'price'], ['Feasible directional change', 'f′(0)d=2d≥0 for every d≥0']]} />
  </Figure>;
}
export function ConjugateSlice() {
  return <Figure id="D18" description="In the maximizing direction, linear gain √2 k competes with quadratic cost k². Its maximum 1/2 occurs at k=√2/2. Adding sᵀt=−7 gives conjugate −6.5 and the same dual floor 1.5."><Plot domain={[-1, 2.5]} range={[-3, 3]} xLabel="displacement k" yLabel="gain / cost">{p => <>{p.curve(k => Math.SQRT2 * k, C.candidate, {
          strokeDasharray: '5 5'
        })}{p.curve(k => k * k, C.objective, {
          strokeDasharray: '3 5'
        })}{p.curve(k => Math.SQRT2 * k - k * k, C.price)}{p.mark([Math.SQRT1_2, .5], 'price')}</>}</Plot><Facts rows={[["s=−λa", '(−1,−1); λ=1'], ['Direction e', 's / ‖s‖'], ['Slice maximum', '1/2; r=s/2', 'price'], ['Full conjugate', '−7 + 1/2 = −6.5'], ['Dual value', '−5 − (−6.5) = 1.5', 'price']]} /></Figure>;
}
export function FourKktObjects() {
  return <Figure id="D19" description="At the same pair z=(2,3), λ=2, the point is feasible, the price is nonnegative, the gradient arrows balance, and price times slack is zero. Each condition refers to this concrete point or force."><HalfPlane foot={[2, 3]} extra={p => <>{p.vector([2, 3], [0, 1], C.objective)}{p.vector([0, 1], [2, 3], C.price, true)}</>} /><Facts rows={[["Primal point on boundary", '2+3−5=0', 'optimum'], ['Price sign', 'λ=2≥0', 'price'], ['Stationarity', '(−2,−2)+(2,2)=(0,0)'], ['Complementarity', '2×0=0']]} /></Figure>;
}
export function BalancedNormals() {
  return <Figure id="D20" description="The cyan objective gradient (−2,−2) and dashed lavender contribution (2,2) cancel head to tail. Feasible displacements lie on the nondecreasing side of the supporting objective plane."><HalfPlane foot={[2, 3]} extra={p => <>{p.vector([2, 3], [0, 1], C.objective)}{p.vector([0, 1], [2, 3], C.price, true)}{p.vector([2, 3], [1, 2], C.neutral)}</>} /><Facts rows={[["Objective gradient", '(−2,−2)', 'objective'], ['Constraint contribution', 'λa=(2,2)', 'price'], ['Feasible displacement d=(−1,−1)', 'aᵀd=−2; ∇fᵀd=4']]} /></Figure>;
}
export function ActiveDoesNotMeanPriced() {
  return <Figure id="D21" description="On the same scalar axes, a tight boundary can have positive price or zero price; an interior optimum also has zero price. The ring remains visible when the bowl centre coincides with the boundary."><Panels>{[-1, 0, 1].map(c => <div key={c}><Plot domain={[-2, 3]} range={[-1, 6]} xLabel="x" yLabel={`c=${c}`}>{p => <>{p.polygon([[0, -1], [3, -1], [3, 6], [0, 6]])}{p.curve(x => (x - c) ** 2)}{p.mark([c, 0], 'objective')}{p.mark([Math.max(0, c), Math.min(0, c) ** 2], 'optimum')}</>}</Plot><Facts rows={[[`Centre c=${c}`, `x*=${Math.max(0, c)}; λ=${2 * Math.max(0, -c)}`], [c <= 0 ? 'Tight boundary' : 'Slack boundary', c === -1 ? 'positive price' : 'zero price']]} /></div>)}</Panels></Figure>;
}
export function NonuniquePrices() {
  return <Figure id="D22" description="Every point on the nonnegative multiplier segment λ₁+2λ₂=2 gives the same force −2 at the unique primal optimum x=0."><Plot domain={[-.25, 2.5]} range={[-.25, 1.5]} xLabel="λ₁" yLabel="λ₂">{p => <>{p.line([0, 1], [2, 0], C.price, {
          strokeWidth: 4
        })}{[[0, 1], [1, .5], [2, 0]].map((z, i) => <g key={i}>{p.mark(z, 'price')}</g>)}</>}</Plot><Facts rows={[["Duplicate normals", '−1 and −2'], ['Prices', '(2,0), (1,.5), (0,1)', 'price'], ['Same total force', '−λ₁−2λ₂ = −2'], ['Unique primal point', 'x=0', 'optimum']]} /></Figure>;
}
export function ConvexSufficiency() {
  return <Figure id="D24" description="At the balanced boundary point, all feasible displacements satisfy aᵀd≤0 and therefore ∇fᵀd≥0. Convexity places every feasible objective above this supporting value."><HalfPlane foot={[2, 3]} extra={p => <>{[[0, 3], [1, 1], [3, 1]].map((z, i) => <g key={i}>{p.vector([2, 3], z, C.neutral)}</g>)}{p.vector([2, 3], [4, 5], C.price, true)}</>} /><Facts rows={[["Normal cone", 'nonnegative multiples of (1,1)', 'price'], ['Balance', '∇f=−2(1,1)', 'objective'], ['All feasible d', '∇fᵀd=−2aᵀd≥0'], ['Conclusion', 'f(z*+d)≥f(z*) by convexity; no strict-feasibility requirement in this sufficiency argument']]} /></Figure>;
}
export function StrictFeasibility() {
  return <Figure id="D25" description="The strict point (0,0) has an allowed neighbourhood. The optimum may still be on the boundary. Under the stated finite convex setting, strict feasibility gives strong duality and dual attainment; primal attainment is separate."><HalfPlane foot={[2, 3]} extra={p => <>{p.circle([0, 0], .6, C.candidate)}{p.mark([0, 0], 'candidate', 's')}</>} /><Facts rows={[["Strict point s=(0,0)", 'g(s)=−5; small disc remains feasible', 'candidate'], ['Optimal boundary point', 'g(2,3)=0', 'optimum'], ['Neighbourhood radius .6', 'maximum x+y=.6√2 < 5']]} /></Figure>;
}
