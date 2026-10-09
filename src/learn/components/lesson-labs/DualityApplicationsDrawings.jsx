import { C, Figure, Facts, Panels, Plot, HalfPlane, CostAxis, number, pointText } from './DualityDrawingPrimitives.jsx';
import { resourceDualAscentState, resourceAllocationAtPrice } from '../../data/duality-kkt-models.js';
export function AllocationBars({
  allocation = [3, 4],
  budget = 5,
  repaired,
  children
}) {
  return <div><Plot domain={[0, Math.max(8, budget + 1)]} range={[-.5, 3]} xLabel="resource units" yLabel="">{p => <>{p.line([0, 2], [budget, 2], C.neutral, {
          strokeWidth: 10
        })}{p.line([0, 1], [allocation[0], 1], C.objective, {
          strokeWidth: 8
        })}{p.mark([allocation[0], 1], 'objective')}{p.line([0, 0], [allocation[1], 0], C.candidate, {
          strokeWidth: 8
        })}{p.mark([allocation[1], 0], 'candidate')}{repaired && <>{p.mark([repaired[0], 1], 'witness-circle')}{p.mark([repaired[1], 0], 'witness-square')}{p.vector([allocation[1], 0], [repaired[1], 0], C.optimum)}</>}</>}</Plot>{children}<Facts rows={[["Capacity", number(budget)], ['Task 1 request', number(allocation[0]), 'objective'], ['Task 2 request', number(allocation[1]), 'candidate'], ...(repaired ? [["Repaired requests", pointText(repaired), 'witness']] : [])]} /></div>;
}
export function SharedResource() {
  return <Figure id="D39" description="Two nonnegative requests 3 and 4 total 7, exceeding shared capacity 5. Task 1 has squared-loss weight 1; task 2 has weight 2."><AllocationBars /><Facts rows={[["Task 1", '(a₁−3)²; a₁≥0', 'objective'], ['Task 2', '2(a₂−4)²; a₂≥0', 'candidate'], ['Shared limit', 'a₁+a₂≤5']]} /></Figure>;
}
export function LocalResponses() {
  const price = 8 / 3;
  return <Figure id="D40" description="Each local decision minimizes its own priced bowl over nonnegative allocations. At price 8/3 the clipped minimizers are 5/3 and 10/3. Their response curves reach zero at prices 6 and 16."><Panels>{[0, 1].map(i => <div key={i}><Plot domain={[-1, 5]} range={[-1, 25]} xLabel={`allocation a${i + 1}`} yLabel="priced local cost">{p => <>{p.polygon([[0, -1], [5, -1], [5, 25], [0, 25]])}{p.curve(a => (i + 1) * (a - (i ? 4 : 3)) ** 2 + price * a, i ? C.candidate : C.objective)}{p.mark([i ? 10 / 3 : 5 / 3, (i + 1) * ((i ? 10 / 3 : 5 / 3) - (i ? 4 : 3)) ** 2 + price * (i ? 10 / 3 : 5 / 3)], 'optimum')}</>}</Plot><Facts rows={[[`Task ${i + 1} minimum`, i ? '10/3' : '5/3', i ? 'candidate' : 'objective']]} /></div>)}</Panels><Plot domain={[0, 18]} range={[-.5, 5]} xLabel="price λ" yLabel="request">{p => <>{p.curve(l => Math.max(0, 3 - l / 2), C.objective)}{p.curve(l => Math.max(0, 4 - l / 4), C.candidate, {
          strokeDasharray: '6 4'
        })}{p.mark([6, 0], 'objective')}{p.mark([16, 0], 'candidate')}{p.mark([8 / 3, 5 / 3], 'objective')}{p.mark([8 / 3, 10 / 3], 'candidate')}</>}</Plot><Facts rows={[["At λ=0", 'requests (3,4), total 7'], ['At λ=8/3', 'requests (5/3,10/3), total 5'], ['At λ=8', 'requests (0,2), total 2']]} /></Figure>;
}
export function OneCoordinationStep() {
  return <Figure id="D41" description="The two actual requests sum to 7. Subtract capacity 5 to get excess demand +2. At rate 1, projection onto nonnegative prices sends price 0 to 2; the new requests are 2 and 3.5."><Panels><AllocationBars /><AllocationBars allocation={[2, 3.5]} /></Panels><Plot domain={[0, 3]} range={[-1, 2]} xLabel="price λ" yLabel="">{p => <>{p.mark([0, 0], 'price')}{p.vector([0, 0], [2, 0], C.price)}{p.mark([2, 0], 'price')}</>}</Plot><Facts rows={[["Messages", '3 + 4 = 7'], ['Excess', '7 − 5 = +2'], ['Update', 'max(0, 0 + 1×2) = 2', 'price'], ['Next messages', '2 + 3.5 = 5.5; excess .5']]} /></Figure>;
}
export function RateTraces() {
  return <Figure id="D42" description="The piecewise derivative has slopes −.75, −.25 and 0. On the same iteration scale, rate 1 approaches 8/3 while rates 3 and 4 cycle between 0 and 6 or 8."><Plot domain={[0, 18]} range={[-6, 3]} xLabel="price λ" yLabel="q′=demand−5">{p => <>{p.curve(l => Math.max(0, 3 - l / 2) + Math.max(0, 4 - l / 4) - 5, C.price)}{[6, 16].map(l => <g key={l}>{p.line([l, -6], [l, 3], C.neutral, {
            strokeDasharray: '4 5'
          })}</g>)}</>}</Plot><Panels>{[1, 3, 4].map(rate => {
        const frames = resourceDualAscentState(5, rate, 0, 12).frames;
        return <div key={rate}><Plot domain={[0, 12]} range={[-.5, 9]} xLabel="performed updates" yLabel={`price; rate ${rate}`}>{p => <>{p.line([0, 8 / 3], [12, 8 / 3], C.optimum, {
                strokeDasharray: '5 5'
              })}{frames.map((s, i) => <g key={i}>{i > 0 && p.line([i - 1, frames[i - 1].price], [i, s.price], C.price)}{p.mark([i, s.price], 'price')}</g>)}</>}</Plot><Facts rows={[[`Rate ${rate}`, rate === 1 ? 'approaches 8/3' : `cycles 0, ${rate === 3 ? 6 : 8}, 0`, 'price']]} /></div>;
      })}</Panels><Facts rows={[["Sufficient range for this model", '0 < rate < 8/3'], ['Zero budget', 'all prices λ≥16 are optimal; not a unique-price limit']]} /></Figure>;
}
export function PriorityRepair() {
  return <Figure id="D44" description="At price zero, priority repair retains task 1's 3 units and reduces task 2 from 4 to 2. This supplies a feasible cost-8 witness above dual bound zero, not an optimal projection."><AllocationBars repaired={[3, 2]} /><CostAxis items={[{
      label: 'Lower q(0)',
      value: 0,
      role: 'price'
    }, {
      label: 'Repaired upper',
      value: 8,
      role: 'witness'
    }]} /><Facts rows={[["Removed from task 2", '2 resource units', 'candidate'], ['Cost', '(3−3)²+2(2−4)²=8'], ['At price 8/3', 'requests already feasible (5/3,10/3); cost and bound 8/3'], ['Stable gap', 'weighted squared displacement + boundary-gradient term + price × repaired slack']]} /></Figure>;
}
export function SolverFields() {
  return <Figure id="D45" description="The solver's point and explicit constraint multiplier refer to the same coordinate geometry and balancing forces. Numerical residuals check an approximate pair; exact reconstruction (2,3), λ=2 supplies the analytic certificate."><HalfPlane foot={[2, 3]} extra={p => <>{p.vector([2, 3], [0, 1], C.objective)}{p.vector([0, 1], [2, 3], C.price, true)}</>} /><Facts rows={[["z.value", 'numerical decision point → z'], ['limit.dual_value', 'numerical multiplier → λ', 'price'], ['Primal residual', 'max(0,x+y−5)'], ['Balance norm', '‖2(z−t)+λ(1,1)‖'], ['Slack product', '|λ(x+y−5)|'], ['Separate sign check', 'λ≥0'], ['Exact reconstruction', 'z=(2,3), λ=2; q=2', 'optimum'], ['Stable numerical bound', 'q=2−(λ−2)²/2; floating evaluation may round']]} /></Figure>;
}
export function LpPlane({
  demand = 4
}) {
  const z = [(3 * demand - 6) / 2, (6 - demand) / 2];
  return <Plot domain={[-.5, 8]} equal xLabel="x≥0" yLabel="y≥0">{p => <>{p.polygon([[0, Math.max(demand, 2)], [z[0], z[1]], [Math.max(demand, 6), 0], [8, 0], [8, 8], [0, 8]])}{p.line([0, demand], [demand, 0], C.objective)}{p.line([0, 2], [6, 0], C.candidate, {
        strokeDasharray: '6 4'
      })}{p.curve(x => (2 * demand + 6 - 3 * x) / 5, C.price, {
        strokeDasharray: '3 5'
      })}{p.mark([0,Math.max(demand,2)],'candidate')}{p.mark([Math.max(demand,6),0],'candidate')}{p.mark(z, 'optimum','P')}{p.vector([7, 4], [7.7, 4], C.neutral)}{p.vector([4, 7], [4, 7.7], C.neutral)}</>}</Plot>;
}
export function LpPrimal() {
  return <Figure id="D46" description="The demand constraints leave an unbounded northeast region. Its finite corners cost 20,14,18; the cost-14 line touches at (3,1). Continuation arrows show that the region does not close into a triangle."><LpPlane /><Facts rows={[["Cyan demand", 'x+y≥4', 'objective'], ['Amber demand', 'x+3y≥6', 'candidate'], ['Corners / costs', '(0,4):20; (3,1):14; (6,0):18'], ['Best point / cost', '(3,1) / 14', 'optimum']]} /></Figure>;
}
export function LpDual() {
  return <Figure id="D47" description="Keeping nonnegative x,y inside the inner minimization requires both linear coefficients to be nonnegative. Their inequalities make the multiplier polygon; (2,1) reaches bound 14."><Plot domain={[-.25, 3.5]} range={[-.25, 2.25]} xLabel="λ₁≥0" yLabel="λ₂≥0">{p => <>{p.polygon([[0, 0], [3, 0], [2, 1], [0, 5 / 3]])}{p.line([0, 3], [3, 0], C.objective)}{p.line([0, 5 / 3], [3.5, .5], C.candidate, {
          strokeDasharray: '6 4'
        })}{p.curve(l => (14 - 4 * l) / 6, C.price, {
          strokeDasharray: '3 5'
        })}{p.mark([2, 1], 'price')}</>}</Plot><Facts rows={[["Coefficient of x", '3−λ₁−λ₂≥0', 'objective'], ['Coefficient of y', '5−λ₁−3λ₂≥0', 'candidate'], ['Polygon corners', '(0,0), (3,0), (2,1), (0,5/3)'], ['Dual objective', '4λ₁+6λ₂; at (2,1), 14', 'price'], ['Negative coefficient', 'unbounded negative inner value; not a finite bound']]} /></Figure>;
}
export function SignConvention() {
  return <Figure id="D48" description="Each demand row changes sign on both sides when converted to SciPy's upper-bound form. Returned RHS marginals −2 and −1 become original-demand prices 2 and 1."><LpPlane /><div className="duality-panels">{[{
        a: [1, 1],
        b: 4,
        m: -2,
        role: 'objective'
      }, {
        a: [1, 3],
        b: 6,
        m: -1,
        role: 'candidate'
      }].map((r, i) => <div key={i}><table className="duality-matrix"><caption style={{
            color: C[r.role]
          }}>Demand row {i + 1}; same boundary before and after</caption><thead><tr><th>x</th><th>y</th><th>Relation</th><th>RHS</th></tr></thead><tbody><tr><td>{r.a[0]}</td><td>{r.a[1]}</td><td>≥</td><td>{r.b}</td></tr><tr><td>{-r.a[0]}</td><td>{-r.a[1]}</td><td>≤</td><td>{-r.b}</td></tr></tbody></table><Facts rows={[["Transformed RHS derivative", number(r.m)], ['Original demand derivative', number(-r.m), r.role]]} /></div>)}</div><Facts rows={[["Matrix transformation", 'A_ub=−A; b_ub=−b'], ['Variable domain', 'explicit bounds x≥0,y≥0'], ['Recovery rule', 'λ=−marginals for this convention; not an absolute-value rule']]} /></Figure>;
}
export function FeaturePlane({
  moved = false
}) {
  return <Plot domain={[-3, 3]} equal xLabel="feature 1" yLabel="feature 2">{p => <>{[-1, 0, 1].map(x => <g key={x}>{p.line([x, -3], [x, 3], x === 0 ? C.neutral : C.price, {
          strokeDasharray: x === 0 ? undefined : '5 5'
        })}</g>)}{[[-2, 0], [-1, 1], [1, 1], [2, 0]].map((z, i) => <g key={i}>{p.mark(z, i < 2 ? 'objective' : 'candidate')}{(i === 1 || i === 2) && p.mark(z, 'optimum')}</g>)}{moved && <>{p.vector([-2, 0], [-.5, 0], C.objective)}{p.mark([-.5, 0], 'objective')}{p.mark([-.5, 0], 'invalid')}</>}</>}</Plot>;
}
export function MarginGeometry() {
  return <Figure id="D50" description="Synthetic negative examples are cyan circles and positive examples amber squares. The inner two points sit on margins x=−1 and x=1 and carry support rings; the separator is x=0."><FeaturePlane /><Facts rows={[["Negative class −1", '(−2,0), (−1,1)', 'objective'], ['Positive class +1', '(1,1), (2,0)', 'candidate'], ['Model', 'w=(1,0), β=0; margin distance 1/‖w‖=1'], ['Constraint slacks', '1, 0, 0, 1'], ['Coefficients α', '0, .5, .5, 0']]} /></Figure>;
}
export function SupportVectorSum() {
  return <Figure id="D51" description="Only two feature contributions are nonzero. The cyan vector (.5,−.5), followed by amber (.5,.5), sums to weight (1,0). Their signed scalar coefficients cancel because the intercept is free."><Plot domain={[-.25, 1.5]} range={[-.75, 1]} equal xLabel="weight component 1" yLabel="component 2">{p => <>{p.vector([0, 0], [.5, -.5], C.objective)}{p.vector([.5, -.5], [1, 0], C.candidate)}{p.vector([0, 0], [1, 0], C.optimum)}{p.mark([1, 0], 'optimum')}</>}</Plot><Facts rows={[["Negative support contribution", '.5×(−1)×(−1,1) = (.5,−.5)', 'objective'], ['Positive support contribution', '.5×(+1)×(1,1) = (.5,.5)', 'candidate'], ['Recovered weight', '(1,0)', 'optimum'], ['Intercept balance', 'Σαᵢyᵢ=−.5+.5=0']]} /></Figure>;
}
export function GramConstruction() {
  const K = [[4, 2, -2, -4], [2, 2, 0, -2], [-2, 0, 2, 2], [-4, -2, 2, 4]],
    ys = [-1, -1, 1, 1];
  return <Figure id="D52" description="Each Gram entry is a feature-vector dot product. The selected K₂₃=0 comes from (−1,1)·(1,1)=−1+1. Magnitude shading is distinct from the class colours on row and column labels; a white outline selects the entry."><FeaturePlane /><Panels>{['K', 'YKY'].map((name, m) => <div key={name}><table className="duality-matrix"><caption>{name}; cyan positive, rose negative, neutral zero</caption><thead><tr><th aria-label="row / column" />{ys.map((y, i) => <th key={i} style={{
                color: i < 2 ? C.objective : C.candidate
              }}>{i + 1}{i < 2 ? ' ○' : ' □'}</th>)}</tr></thead><tbody>{K.map((row, i) => <tr key={i}><th style={{
                color: i < 2 ? C.objective : C.candidate
              }}>{i + 1}{i < 2 ? ' ○' : ' □'}</th>{row.map((v, j) => {
                const value = m ? v * ys[i] * ys[j] : v;
                return <td key={j} data-selected={i === 1 && j === 2} style={{
                  background: value === 0 ? 'transparent' : `${value > 0 ? 'rgba(151,191,202,' : 'rgba(230,161,176,'}${.09 + .065 * Math.abs(value)})`
                }}>{value}</td>;
              })}</tr>)}</tbody></table></div>)}</Panels><Plot domain={[-2, 2]} equal xLabel="feature 1" yLabel="feature 2">{p => <>{p.vector([0, 0], [-1, 1], C.objective)}{p.vector([0, 0], [1, 1], C.candidate)}</>}</Plot><Facts rows={[["Selected K₂₃", '(−1)×1+1×1=0'], ['Any coefficients c', 'cᵀKc=‖Σcᵢaᵢ‖²≥0'], ['Class-sign matrix', 'YKY multiplies entry i,j by yᵢyⱼ'], ['PSD justification', 'squared vector norm; arbitrary similarity tables need separate proof']]} /></Figure>;
}
export function EditedConstraint() {
  return <Figure id="D53" description="Hold the old separator fixed and move the zero-coefficient negative point from (−2,0) to (−.5,0). Its required margin drops from 2 to .5, so the old certificate fails; no new fitted classifier is shown."><FeaturePlane moved /><Facts rows={[["Original negative point", '(−2,0); margin 2; α=0', 'objective'], ['Moved negative point', '(−.5,0); margin .5 < 1', 'invalid'], ['Held fixed', 'w=(1,0), β=0'], ['What fails', 'the changed primal constraint; α=0 did not make that constraint disposable']]} /></Figure>;
}
