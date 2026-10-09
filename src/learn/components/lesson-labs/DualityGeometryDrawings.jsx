import { C, Figure, Facts, Panels, Plot, HalfPlane, CostAxis, number, pointText } from './DualityDrawingPrimitives.jsx';
export function ResidualCostPlot({
  allowance = false,
  price,
  contact = true,
  compare = false
}) {
  const q = price === undefined ? null : 2 * price - price * price / 2,
    u = price === undefined ? null : 2 - price,
    v = price === undefined ? null : price * price / 2;
  return <Plot domain={[-3, 5]} range={[-2, 13]} xLabel={allowance ? 'allowance u' : 'residual u'} yLabel="cost v">{p => {
      const frontier = x => (allowance ? Math.max(0, 2 - x) : 2 - x) ** 2 / 2,
        curve = Array.from({
          length: 65
        }, (_, i) => {
          const x = -3 + 8 * i / 64;
          return [x, frontier(x)];
        });
      return <>{p.polygon([[-3,-2],[0,-2],[0,13],[-3,13]],"rgba(222,213,191,.075)")}{p.polygon([...curve, [5, 13], [-3, 13]])}{p.curve(frontier, C.objective)}{compare&&<>{p.line([3,-2],[3,frontier(3)],C.neutral,{strokeDasharray:"3 5"})}{p.mark([3,frontier(3)],"optimum","u=3")}{allowance&&p.vector([2,0],[3,0],C.objective)}</>}{p.line([0, -2], [0, 13], C.neutral, {
          strokeDasharray: '5 4'
        })}{price === undefined ? <>{p.mark([2, 0], 'objective')}{p.mark([-1, 5], 'candidate')}{p.mark([0, 2], 'optimum')}</> : <>{p.curve(x => q - price * x, C.price)}{p.mark([0, q], 'price')}{contact && p.mark([u, v], 'optimum')}{allowance && price === 0 && p.vector([2, 0], [4.8, 0], C.optimum)}</>}</>;
    }}</Plot>;
}
export function AchievablePairs() {
  return <Figure id="D26" description="The exact residual u=x+y−5 fixes the sum of coordinate errors. Its least possible cost is (u−2)²/2; every larger cost is achievable. Original feasibility is the side u≤0."><ResidualCostPlot /><Facts rows={[["Target t → residual/cost", '(2, 0)', 'objective'], ['Candidate z=(2,2) → pair', '(−1, 5)', 'candidate'], ['Optimum z* → pair', '(0, 2)', 'optimum'], ['Frontier', 'v=(u−2)²/2; region above is G']]} /></Figure>;
}
export function AllowanceEpigraph() {
  return <Figure id="D27" description="Allowing residual at most u fills achievable pairs rightward. At u=3, the exact-residual frontier is .5, but the relaxed value is zero. Both panels share scales."><Panels><div><ResidualCostPlot compare /><Facts rows={[["Exact residual G", 'u=3 requires sum 8; least cost .5', 'objective']]} /></div><div><ResidualCostPlot allowance compare /><Facts rows={[["Allowance epigraph A", 'u=3 permits the target; least cost 0', 'objective']]} /></div></Panels><Facts rows={[["Horizontal filling", 'A includes (u+δ,v) for δ≥0 whenever (u,v) is achievable'], ['Value frontier', 'p(u)=max(0,2−u)²/2']]} /></Figure>;
}
export function DegenerateNonattainment() {
  return <Figure id="D29" description="The only feasible point is x=0, with cost zero. Finite prices 1,4,16 produce slopes −1,−4,−16 and bounds −1/4,−1/16,−1/64. The dual value approaches zero but never reaches it."><Panels><Plot domain={[-1, 1]} range={[-.25, 1.25]} xLabel="x" yLabel="constraint x²">{p => <>{p.curve(x => x * x)}{p.line([-1, 0], [1, 0], C.neutral)}{p.mark([0, 0], 'optimum')}</>}</Plot><Plot domain={[-.1, 1]} range={[-1.2, .5]} xLabel="residual u=x²" yLabel="cost v=x">{p => <>{p.curve(u => -Math.sqrt(Math.max(0, u)), C.objective, {}, 0, 1)}{[1, 4, 16].map(l => <g key={l}>{p.curve(u => -1 / (4 * l) - l * u, C.price)}{p.mark([1 / (4 * l * l), -1 / (2 * l)], 'price')}</g>)}{p.mark([0, 0], 'optimum')}</>}</Plot></Panels><Panels>{[4, 16].map(l => <div key={l}><Plot domain={[0, 2 / (4 * l * l)]} range={[-1 / l, .1 / l]} xLabel="magnified u" yLabel={`λ=${l}`}>{p => <>{p.curve(u => -Math.sqrt(u), C.objective)}{p.curve(u => -1 / (4 * l) - l * u, C.price)}{p.mark([1 / (4 * l * l), -1 / (2 * l)], 'price')}</>}</Plot><Facts rows={[[`λ=${l} contact`, l===4?'(1/64, −1/8)':'(1/1024, −1/32)', 'price'], ['Intercept', number(-1 / (4 * l))]]} /></div>)}</Panels><Plot domain={[0, 20]} range={[-.3, .04]} xLabel="finite price λ" yLabel="q(λ)">{p => <>{p.curve(l => -1 / (4 * l), C.price, {}, .8, 20)}{[1, 4, 16].map(l => <g key={l}>{p.mark([l, -1 / (4 * l)], 'price')}</g>)}{p.line([0, 0], [20, 0], C.optimum, {
          strokeDasharray: '4 5'
        })}</>}</Plot><Facts rows={[["λ=0", 'q(0)=−∞'], ['Limiting bound', '0; approached, not attained'], ['Stationarity at feasible x=0', '1 + 2λ×0 = 1; never zero'], ['Primal and dual optimal values', 'both 0; no positive value gap']]} /></Figure>;
}
export function RepresentationMatters() {
  return <Figure id="D30" description="The equivalent affine equality x=0 has nonzero constraint derivative. Signed price ν=−1 balances objective derivative 1 and makes L=x−x=0 everywhere."><Plot domain={[-2, 2]} range={[-2, 2]} xLabel="x" yLabel="value">{p => <>{p.curve(x => x, C.objective)}{p.curve(x => -x, C.price, {
          strokeDasharray: '5 4'
        })}{p.line([-2, 0], [2, 0], C.optimum, {
          strokeWidth: 3
        })}{p.mark([0, 0], 'optimum')}</>}</Plot><Facts rows={[["Objective", 'x; derivative 1', 'objective'], ['Affine equality contribution', '−x; derivative −1', 'price'], ['Total L', '0 for every real x', 'optimum'], ['Squared inequality contrast', 'constraint derivative 2x=0 at x=0; no balancing force']]} /></Figure>;
}
export function PositiveDualityGap() {
  return <Figure id="D31" description="The equality x²=1 offers −1 and +1; the inequality −x≤0 removes −1. The only feasible cost is 1. Price λ=1 and equality multiplier ν=0 attain dual bound 0, leaving gap 1."><Panels><Plot domain={[-2, 2]} range={[-.5, 2]} xLabel="x" yLabel="constraint x²">{p => <>{p.curve(x => x * x)}{p.line([-2, 1], [2, 1], C.neutral, {
            strokeDasharray: '5 5'
          })}{p.mark([-1, 1], 'invalid')}{p.mark([1, 1], 'optimum')}{p.mark([0, 0], 'price')}</>}</Plot><CostAxis items={[{
        label: 'Attained dual d*',
        value: 0,
        role: 'price'
      }, {
        label: 'Only feasible objective p*',
        value: 1,
        role: 'optimum'
      }]} /></Panels><Facts rows={[["Inner point x=0", 'allowed in minimization of L; primal-infeasible', 'price'], ['ν≥0', 'q≤L(0)=−ν≤0'], ['ν<0', 'downward quadratic ⇒ q=−∞'], ['Exhibited optimum', 'λ=1, ν=0 ⇒ L≡0']]} /></Figure>;
}
export function SaddleSlices() {
  return <Figure id="D32" description="At fixed optimal point, changing a nonnegative price leaves L=2. At fixed optimal price 2, any decision displacement adds a nonnegative square. The two slices meet at the attained saddle value."><Panels><Plot domain={[0, 5]} range={[0, 7]} xLabel="price λ≥0" yLabel="L(z*, λ)">{p => <>{p.line([0, 2], [5, 2], C.price, {
            strokeWidth: 3
          })}{p.mark([2, 2], 'optimum')}</>}</Plot><Plot domain={[-2, 2]} range={[0, 7]} xLabel="decision displacement r" yLabel="L(z, 2)">{p => <>{p.curve(r => 2 + r * r, C.objective)}{p.mark([0, 2], 'optimum')}</>}</Plot></Panels><Facts rows={[["Fixed z*=(2,3)", 'L(z*,λ)=2 for λ≥0', 'price'], ['Fixed λ*=2', 'L(z,2)=2+‖z−z*‖²', 'objective'], ['Saddle ordering', 'L(z*,λ) ≤ L(z*,λ*) ≤ L(z,λ*)']]} /></Figure>;
}
export function MovedBudget() {
  return <Figure id="D33" description="Relaxing the budget from 5 to 5.1 moves the boundary outward. The foot moves from (2,3) to (2.05,3.05); the inset expands this small movement without changing coordinates."><HalfPlane foot={[2, 3]} extra={p => <>{p.line([-1, 6.1], [6, -.9], C.neutral, {
        strokeDasharray: '5 4'
      })}{p.mark([2.05, 3.05], 'changed')}</>} /><Plot domain={[1.96, 2.09]} range={[2.96, 3.09]} equal xLabel="magnified x" yLabel="magnified y">{p => <>{p.curve(x => 5 - x, C.neutral)}{p.curve(x => 5.1 - x, C.neutral, {
          strokeDasharray: '5 4'
        })}{p.mark([2, 3], 'optimum')}{p.mark([2.05, 3.05], 'changed')}{p.vector([2, 3], [2.05, 3.05], C.objective)}</>}</Plot><Facts rows={[["Original b=5", '(2,3), cost 2', 'optimum'], ['Relaxed b=5.1', '(2.05,3.05), cost 1.805', 'changed'], ['Coordinate changes', '+.05, +.05']]} /></Figure>;
}
export function SensitivityPicture({
  base = 5,
  change = .1,
  kink = false,
  price: chosen = .5
}) {
  const value = b => kink ? Math.max(0, -b) : Math.max(0, 7 - b) ** 2 / 2,
    price = kink ? chosen : Math.max(0, 7 - base),
    target = base + change,
    current = value(base),
    actual = value(target),
    support = current - price * change,
    domain = kink ? [-2, 2] : [-2, 12],
    lo = Math.min(-1, support - .5),
    hi = kink ? 3 : 42;
  return <><Plot domain={domain} range={[lo, hi]} xLabel={kink ? 'allowance u' : 'budget b'} yLabel="value">{p => <>{p.curve(value, C.objective)}{p.curve(b => current - price * (b - base), C.price, {
          strokeDasharray: '6 4'
        })}{p.mark([base, current], 'optimum')}{p.mark([target, actual], 'candidate')}{p.mark([target, support], 'price')}</>}</Plot><Plot domain={[-.25, .25]} range={[-.55, .55]} xLabel="small change δ" yLabel="value change">{p => <>{p.curve(d => value(base + d) - current, C.objective)}{p.curve(d => -price * d, C.price, {
          strokeDasharray: '5 4'
        })}{[-.1, .1].map(d => <g key={d}>{p.mark([d, value(base + d) - current], 'candidate')}</g>)}</>}</Plot><Facts rows={[["Base / changed value", `${number(current)} / ${number(actual)}`, 'objective'], ['Price / support', `${number(price)} / ${number(support)}`, 'price'], ['Exact minus support', number(actual - support)]]} /></>;
}
export function TangentRemainder() {
  return <Figure id="D34" description="The exact value lies above its tangent at budget 5. A magnified remainder plot shows .005 at both changes ±.1, even though the first-order changes have opposite signs."><SensitivityPicture /><Plot domain={[-.15, .15]} range={[-.001, .012]} xLabel="change δ" yLabel="remainder">{p => <>{p.curve(d => d * d / 2, C.objective)}{p.mark([-.1, .005], 'candidate')}{p.mark([.1, .005], 'candidate')}</>}</Plot><Facts rows={[["δ=+.1", 'exact −.195; linear −.2; remainder .005'], ['δ=−.1', 'exact +.205; linear +.2; remainder .005']]} /></Figure>;
}
export function HingeSupportingSlopes() {
  return <Figure id="D36" description="At allowance zero the value function has a corner. Prices 0, .5 and 1 all provide valid supporting lines; the left derivative is −1 and the right derivative is 0."><Plot domain={[-2, 2]} range={[-2, 3]} xLabel="allowance u" yLabel="p(u)">{p => <>{[0, .5, 1].map(l => <g key={l}>{p.curve(u => -l * u, C.price, {
            strokeDasharray: l === .5 ? '6 4' : l === 0 ? '2 5' : undefined
          })}</g>)}{p.curve(u => Math.max(0, -u), C.objective, {
          strokeWidth: 4
        })}{p.mark([0, 0], 'optimum')}</>}</Plot><Facts rows={[["Primal requirements", 't≥0 and t≥−u'], ['Optimal prices at u=0', 'λ₁+λ₂=1; 0≤λ₂≤1', 'price'], ['Supporting slopes', '−1, −.5, 0'], ['One-sided derivatives', 'left −1; right 0; no unique derivative']]} /></Figure>;
}
export function RescaledUnits() {
  return <Figure id="D38" description="The same physical relaxation .5 becomes allowance 5 when the constraint is multiplied by ten. The multiplier divides by ten, preserving the estimated change and balancing force."><Panels><Plot domain={[0, 1]} range={[-.5, 1.5]} xLabel="original δ" yLabel="">{p => <>{p.line([0, 0], [1, 0], C.neutral)}{p.vector([0, 0], [.5, 0], C.candidate)}{p.mark([.5, 0], 'candidate')}</>}</Plot><Plot domain={[0, 10]} range={[-.5, 1.5]} xLabel="scaled u=10δ" yLabel="">{p => <>{p.line([0, 0], [10, 0], C.neutral)}{p.vector([0, 0], [5, 0], C.candidate)}{p.mark([5, 0], 'candidate')}</>}</Plot></Panels><Facts rows={[["Original", '−2×.5 = −1', 'price'], ['Scaled', '−.2×5 = −1', 'price'], ['Force', '2∇g = .2∇(10g)'], ['Interpretation', 'price is per unit of the stated constraint expression']]} /></Figure>;
}
