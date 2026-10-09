import { C, Figure, Panels, Plot, Facts, Equation, number } from './NumericalDrawingPrimitives.jsx';
import { pumpRate, pumpVolume, pumpCalibration } from '../../data/numerical-methods-models.js';
export function PumpPanels({
  candidate = 3,
  panels = 8
}) {
  const points = Array.from({
    length: panels + 1
  }, (_, i) => {
    const x = candidate * i / panels;
    return [x, pumpRate(x)];
  });
  return <Plot domain={[0, candidate]} range={[0, .4]} xLabel="time (min)" yLabel="rate (L/min)">{p => <>{points.slice(1).map((b, i) => <g key={i}>{p.polygon([[points[i][0], 0], points[i], b, [b[0], 0]], C.a)}{p.line(points[i], b, C.a)}</g>)}{p.curve(pumpRate)}{points.map((a, i) => <g key={i}>{p.mark(a, i === 0 ? 'a' : i === panels ? 'c' : 'neutral')}</g>)}</>}</Plot>;
}
export function PumpBound() {
  return <Figure id="NM45" caption="The pump's actual trapezoid samples support this discretization calculation. The second-derivative envelope is a mathematical assumption, not a physical confidence band."><PumpPanels /><Equation>r″(t)=(t−2)e⁻ᵗ; |r″(t)|≤2 on [0,T]. Hence E≤(T/12)(T/n)²×2=T³/(6n²).</Equation><Facts rows={[["T=3,n=8 estimate", number(pumpCalibration(.8, 8, 3).estimate) + ' L', 'a'], ['discretization bound', '27/(6×64) = .0703125 L'], ['other uncertainty', 'model, data and floating-point rounding not enclosed by this bound']]} /></Figure>;
}
export function IntervalDecisions() {
  return <Figure id="NM46" caption="These three illustrative bounded intervals teach the decision rule. The full interval, rather than its center, determines whether an outer half may be discarded."><Plot domain={[.74, .86]} range={[-.5, 2.5]} xLabel="bounded volume (L)" yLabel="decision examples">{p => <>{p.line([.8, -.5], [.8, 2.5], C.reference, {
          strokeDasharray: '5 4'
        })}{[[.76, .78, 'a'], [.79, .81, 'b'], [.82, .84, 'c']].map(([a, b, role], i) => <g key={i}>{p.line([a, 2 - i], [b, 2 - i], C[role], {
            strokeWidth: 5
          })}{p.mark([a, 2 - i], role)}{p.mark([b, 2 - i], role)}</g>)}</>}</Plot><Facts rows={[["[.76,.78] below .8", 'increase candidate time', 'a'], ['[.79,.81] contains .8', 'refine inner integral; retain outer bracket', 'b'], ['[.82,.84] above .8', 'decrease candidate time', 'c']]} /></Figure>;
}
export function InverseSensitivity() {
  const r = pumpCalibration(.8, 8, 3),
    amount = Math.abs(r.residual) + r.integralBound;
  return <Figure id="NM47" caption="Volume error is converted into a conservative time error using the lower slope on [2,4]. This is a bound calculation, not the exact curved inverse image."><Plot domain={[2, 4]} range={[.55, .95]} xLabel="time (min)" yLabel="volume (L)">{p => <>{p.curve(pumpVolume)}{p.line([2, .8], [4, .8], C.reference, {
          strokeDasharray: '4 4'
        })}{p.line([3, r.estimate - r.integralBound], [3, r.estimate + r.integralBound], C.a, {
          strokeWidth: 5
        })}{p.mark([3, r.estimate], 'a')}{p.mark([2.994308347, .8], 'reference')}</>}</Plot><Equation>(|V̂−target|+E)/m = ({number(Math.abs(r.residual))}+{number(r.integralBound)})/{number(r.slopeLowerBound)} = {number(r.timeBound)} min.</Equation><Plot domain={[1.5, 4.5]} range={[0, 1]} xLabel="time (min), conservative span" yLabel="candidate ± bound">{p => <>{p.line([3 - r.timeBound, .5], [3 + r.timeBound, .5], C.a, {
          strokeWidth: 5
        })}{p.mark([3, .5], 'b', '3')}{p.mark([3 - r.timeBound, .5], 'a')}{p.mark([3 + r.timeBound, .5], 'c')}</>}</Plot><Facts rows={[["m=4e⁻⁴", number(r.slopeLowerBound) + ' L/min'], ['vertical allowance', number(amount) + ' L'], ['time units', 'L ÷ (L/min) = min']]} /></Figure>;
}
export function WeakDirection() {
  return <Figure id="NM50" caption="A unit error in the weak solution direction becomes only 10⁻⁶ in output space. The output inset explicitly magnifies that direction; the main output axis does not enlarge it."><Panels><Plot domain={[0, 1.5]} range={[0, 1.5]} equal xLabel="solution x₁" yLabel="solution x₂">{p => <>{p.mark([1, 0], 'b', 'approx')}{p.mark([1, 1], 'reference', 'true')}{p.arrow([1, 0], [1, 1], C.c)}</>}</Plot><Plot domain={[0, 1.5]} range={[0, 1.5]} equal xLabel="output coordinate 1" yLabel="output coordinate 2">{p => <>{p.mark([1, 0], 'b')}{p.mark([1, 1e-6], 'reference')}</>}</Plot></Panels><Plot domain={[-.2, .2]} range={[-1.2, 1.2]} xLabel="residual coordinate 1" yLabel="residual coordinate 2 / 10⁻⁶">{p => <>{p.arrow([0, 0], [0, -1], C.c)}{p.mark([0, -1], 'c', '−1')}</>}</Plot><Equation>A=diag(1,10⁻⁶), true x=(1,1), approximation=(1,0). Solution error has norm1; residual A x̂−b=(0,−10⁻⁶) has norm10⁻⁶.</Equation></Figure>;
}
export function EulerDefect() {
  const y1 = Math.exp(-.5),
    y2 = Math.exp(-1),
    fromApprox = .5 * Math.exp(-.5);
  return <Figure id="NM51" caption="The first tangent step starts at an exact state. The second starts at the computed .5, so its inherited error and its new one-step defect are separate."><Plot domain={[0, .5]} range={[0, 1.1]} xLabel="time" yLabel="cooling state y">{p => <>{p.curve(t => Math.exp(-2 * t))}{p.path([[0, 1], [.25, .5], [.5, .25]], C.b)}{p.mark([0, 1], 'a')}{p.mark([.25, .5], 'b')}{p.mark([.25, y1], 'reference')}{p.line([.25, .5], [.25, y1], C.c, {
          strokeWidth: 4
        })}{p.curve(t => .5 * Math.exp(-2 * (t - .25)), C.a, .25, .5, {
          strokeDasharray: '4 4'
        })}{p.mark([.5, .25], 'b')}{p.mark([.5, fromApprox], 'a')}{p.mark([.5, y2], 'reference')}</>}</Plot><Facts rows={[["first Euler update", '1 + .25(−2) = .5', 'b'], ['exact first endpoint', number(y1), 'reference'], ['first local defect', number(y1 - .5), 'c'], ['inherited error at time .5', number(y2 - fromApprox)], ['new local defect from .5', number(fromApprox - .25), 'a']]} /></Figure>;
}
export function EulerHorizon() {
  const methods = [{
    h: 1,
    role: 'a'
  }, {
    h: .5,
    role: 'b'
  }, {
    h: .25,
    role: 'c'
  }, {
    h: .125,
    role: 'neutral'
  }];
  return <Figure id="NM52" caption="All four Euler paths reach the same physical time T=3. Cyan h=1 alternates sign; amber h=.5 lands at numerical zero. The reference exponential remains positive."><Plot domain={[0, 3]} range={[-1.1, 1.1]} xLabel="time, common horizon" yLabel="computed cooling state">{p => <>{p.curve(t => Math.exp(-2 * t))}{methods.map(o => <g key={o.h}>{p.path(Array.from({
            length: Math.round(3 / o.h) + 1
          }, (_, i) => [i * o.h, (1 - 2 * o.h) ** i]), C[o.role], {
            strokeDasharray: o.role === 'neutral' ? '4 4' : undefined
          })}</g>)}</>}</Plot><Facts rows={methods.map(o => [`h=${o.h}, n=${3 / o.h}`, number((1 - 2 * o.h) ** (3 / o.h)), o.role])} /><Plot domain={[0, .003]} range={[-.5, 3.5]} xLabel="positive endpoint inset" yLabel="endpoint at T=3">{p => <>{methods.slice(1).map((o, i) => <g key={o.h}>{p.mark([(1 - 2 * o.h) ** (3 / o.h), i], o.role)}</g>)}{p.mark([Math.exp(-6), 3], 'reference', 'exact')}</>}</Plot><Equation>Exact e⁻⁶={number(Math.exp(-6))}. The inset excludes the −1 endpoint only because the full signed path is shown above.</Equation></Figure>;
}
export function DerivativeGraph() {
  return <Figure id="NM53" caption="The graph follows the implemented scalar operations. Local chain-rule contributions build the gradient; finite differences instead reevaluate the whole function twice."><Plot domain={[0, 4]} range={[-.3, 3.3]} xLabel="operation order" yLabel="scalar computation graph">{p => <>{p.mark([0, 2.5], 'a', 'x=1')}{p.mark([0, .5], 'c', 'y=2')}{p.arrow([.2, 2.5], [1.7, 2.5], C.a)}{p.arrow([.2, 2.5], [1.7, 1.5], C.a)}{p.arrow([.2, .5], [1.7, 1.5], C.c)}{p.arrow([.2, .5], [1.7, .5], C.c)}{p.mark([2, 2.5], 'a', 'x²')}{p.mark([2, 1.5], 'b', '3xy')}{p.mark([2, .5], 'c', '2y²')}{[.5, 1.5, 2.5].map(y => <g key={y}>{p.arrow([2.25, y], [3.5, 1.5], C.neutral)}</g>)}{p.mark([3.8, 1.5], 'reference', '15')}</>}</Plot><Facts rows={[["∂F/∂x", '2x + 3y = 2 + 6 = 8', 'a'], ['∂F/∂y', '3x + 4y = 3 + 8 = 11', 'c'], ['direction (2,−1)', '2×8 − 11 = 5', 'reference']]} /><Equation>Finite-h route: whole F(1+2h,2−h) and whole F(1−2h,2+h) → subtraction → divide by2h. The operation-based route has no finite-difference h; this graph is not a full AD engine.</Equation></Figure>;
}
