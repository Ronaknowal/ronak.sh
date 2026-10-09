import { C, Figure, Panels, Plot, Facts, Equation, Table, number } from './NumericalDrawingPrimitives.jsx';
import { pumpRate, pumpVolume } from '../../data/numerical-methods-models.js';
export function PumpSlope() {
  const a = 3,
    b = 3.2,
    fa = pumpRate(a),
    fb = pumpRate(b);
  return <Figure id="NM01" caption="The cyan circle is time t=3; the amber square is t+h=3.2 in both views. The second view magnifies the local difference with its own rate scale."><Panels><Plot domain={[0, 4]} range={[0, .4]} xLabel="time (min)" yLabel="rate (L/min)">{p => <>{p.curve(pumpRate)}{p.mark([a, fa], 'a')}{p.mark([b, fb], 'b')}</>}</Plot><Plot domain={[2.9, 3.3]} range={[.12, .17]} xLabel="time (min), local view" yLabel="rate (L/min)">{p => <>{p.curve(pumpRate)}{p.line([a, fa], [b, fa], C.neutral)}{p.line([b, fa], [b, fb], C.b)}{p.line([a, fa], [b, fb], C.a)}{p.mark([a, fa], 'a')}{p.mark([b, fb], 'b')}</>}</Plot></Panels><Facts rows={[["r(3)", number(fa), 'a'], ['r(3.2)', number(fb), 'b'], ['rise / run', `${number(fb - fa)} / 0.2 = ${number((fb - fa) / .2)} L/min²`]]} /></Figure>;
}
export function PumpArea() {
  return <Figure id="NM02" caption="The cyan shaded area under the rate curve becomes the volume at the same time. Cream dashed line: target 0.8 L. White guide: candidate 3 min."><Panels><Plot domain={[0, 4]} range={[0, .4]} xLabel="time (min)" yLabel="rate (L/min)">{p => <>{p.area(pumpRate, 0, 3)}{p.curve(pumpRate)}{p.line([3, 0], [3, .4], C.selection, {
            strokeDasharray: '4 4'
          })}</>}</Plot><Plot domain={[0, 4]} range={[0, 1]} xLabel="time (min)" yLabel="volume (L)">{p => <>{p.curve(pumpVolume)}{p.line([0, .8], [4, .8], C.reference, {
            strokeDasharray: '6 4'
          })}{p.line([3, 0], [3, 1], C.selection, {
            strokeDasharray: '4 4'
          })}{p.mark([3, pumpVolume(3)], 'a')}{p.mark([2.994308347, .8], 'reference')}</>}</Plot></Panels><Facts rows={[["V(3)", `${number(pumpVolume(3))} L`, 'a'], ['target crossing', '2.994308347 min', 'reference']]} /></Figure>;
}
export function AccuracyObjects() {
  const ref = Math.sqrt(2),
    a = 1.4150390625,
    r = 1 / 1024;
  return <Figure id="NM03" caption="A local number-line scale separates actual error, requested tolerance and the conditional enclosing radius. Vertical lanes organize these different objects; they are not probabilities."><Plot domain={[1.4135, 1.4162]} range={[-.5, 3.5]} xLabel="answer, local scale" yLabel="accuracy objects">{p => <>{p.line([a - r, 0], [a + r, 0], C.c, {
          strokeWidth: 5
        })}{p.mark([a - r, 0], 'c')}{p.mark([a + r, 0], 'c')}{p.line([ref, 1], [a, 1], C.b, {
          strokeWidth: 5
        })}{p.mark([ref, 1], 'reference')}{p.mark([a, 1], 'b')}{p.line([ref, 2], [ref + .001, 2], C.neutral, {
          strokeDasharray: '4 4'
        })}{p.mark([ref, 3], 'reference', 'q')}{p.mark([a, 3], 'b', 'q̂')}</>}</Plot><Facts rows={[["reference q", number(ref), 'reference'], ['approximation q̂', number(a), 'b'], ['actual absolute error', number(a - ref), 'b'], ['requested tolerance', '.001'], ['conditional radius', number(r), 'c'], ['conditional interval', `[${number(a - r)}, ${number(a + r)}]`]]} /></Figure>;
}
export function ErrorOperations() {
  return <Figure id="NM04" caption="One sample travels through the arithmetic. Each uncertainty belongs to a concrete operation; the labels do not assert independent or additive bounds."><Plot domain={[0, 6]} range={[-1, 3]} xLabel="arithmetic order" yLabel="one contribution">{p => <>{p.mark([.5, 1], 'reference', 'r(t)')}{p.arrow([1, 1], [2, 1], C.a)}{p.mark([2.5, 1], 'a', 'rᵢ')}{p.arrow([3, 1], [4, 1], C.a)}{p.mark([4.5, 1], 'a', 'h wᵢ rᵢ')}{p.arrow([4.8, 1], [5.6, 1], C.neutral)}<text x={p.x(5.8)} y={p.y(1)} textAnchor="middle">Σ</text>{p.line([.5, 2.3], [.5, 1.4], C.reference)}{p.line([2.5, -.5], [2.5, .6], C.a)}{p.line([4.5, 2.3], [4.5, 1.4], C.b)}</>}</Plot><Facts rows={[["intended r(t)", 'model uncertainty', 'reference'], ['supplied rᵢ', 'data / function-evaluation error', 'a'], ['h wᵢ rᵢ', 'interpolation replaces a shape by a weighted sample', 'a'], ['Σ contributions', 'rounded products and summation']]} /><Equation>At t=1: r(1)≈0.367879; supplying rᵢ=0.368 and h=0.5,wᵢ=1 produces a 0.184 L contribution.</Equation></Figure>;
}
export function ResidualScaling() {
  return <Figure id="NM05" caption="The two vertical axes use different units. A million-fold smaller residual does not change the one-unit horizontal error."><Panels>{[1, 1e-6].map((scale, i) => <div key={scale}><Plot domain={[0, 1.5]} range={[-1.2, 1]} xLabel="input x" yLabel={i ? 'f₂ / 10⁻⁶' : 'f₁'}>{p => <>{p.curve(x => x - 1)}{p.line([0, 0], [0, -1], C.b, {
              strokeWidth: 4
            })}{p.line([0, 0], [1, 0], C.a, {
              strokeWidth: 4
            })}{p.mark([0, -1], 'b')}{p.mark([1, 0], 'reference', 'root')}</>}</Plot><Facts rows={[["candidate residual", number(-scale), 'b'], ['input error', '1', 'a'], ['actual slope', number(scale)]]} /></div>)}</Panels></Figure>;
}
export function BracketPremise() {
  return <Figure id="NM06" caption="Endpoint evaluations lie on the curve; bracket endpoints lie on the x axis. First check for an endpoint zero, then require continuity and opposite signs."><Plot domain={[0, 2]} range={[-2.5, 2.5]} xLabel="x" yLabel="x² − 2">{p => <>{p.curve(x => x * x - 2)}{p.line([0, 0], [2, 0], C.neutral, {
          strokeWidth: 5
        })}{p.line([0, 0], [0, -2], C.a, {
          strokeDasharray: '4 4'
        })}{p.line([2, 0], [2, 2], C.c, {
          strokeDasharray: '4 4'
        })}{p.mark([0, -2], 'a', 'a₀')}{p.mark([2, 2], 'c', 'b₀')}</>}</Plot><Equation>f(0)=−2; f(2)=2. Neither equals zero. Their signs differ, and the polynomial is continuous.</Equation></Figure>;
}
export function BracketReplacements() {
  const rows = [[0, 2, 1, -1], [1, 2, 1.5, .25], [1, 1.5, 1.25, -.4375], [1.25, 1.5, 1.375, -.109375]],
    role = x => x === 1 ? 'a' : x === 1.5 ? 'b' : x === 1.25 ? 'c' : 'neutral';
  return <Figure id="NM07" caption="All four retained intervals use the same x scale. Follow sample 1 (cyan circle), 1.5 (amber square) and 1.25 (purple diamond) from midpoint evaluation into the next endpoint."><Plot domain={[0, 2]} range={[-.5, 3.5]} xLabel="x" yLabel="retained bracket rows">{p => <>{rows.map(([a, b, m], i) => <g key={i}>{p.line([a, 3 - i], [b, 3 - i], C.neutral, {
            strokeWidth: 4
          })}{p.mark([a, 3 - i], role(a))}{p.mark([b, 3 - i], role(b))}{i < 3 && p.mark([m, 3 - i], role(m), '', true)}{i < 3 && p.arrow([m, 3 - i - .15], [m, 2 - i + .15], C[role(m)])}</g>)}</>}</Plot><Table caption="One endpoint replacement per evaluated midpoint" headers={['row', 'midpoint', 'value', 'sign comparison → next bracket']} rows={rows.slice(0, 3).map(([a, b, m, v], i) => [i, number(m), number(v), v < 0 ? `same sign as left: replace left → [${m}, ${b}]` : `opposite to left: replace right → [${a}, ${m}]`])} /></Figure>;
}
export function BracketWidths() {
  return <Figure id="NM08" caption="k counts completed replacements. The common coordinate scale shows shrinkage; the last interval also gets a separately labelled local inset."><Plot domain={[0, 2]} range={[-.5, 3.5]} xLabel="x, common scale" yLabel="completed halves">{p => <>{[[0, 0, 2], [1, 1, 2], [3, 1.25, 1.5], [10, 1.4140625, 1.416015625]].map(([k, a, b], i) => <g key={k}>{p.line([a, 3 - i], [b, 3 - i], C.c, {
            strokeWidth: 4
          })}{p.mark([(a + b) / 2, 3 - i], 'b')}</g>)}</>}</Plot><Plot domain={[1.4140625, 1.416015625]} range={[0, 1]} xLabel="k=10 inset: x" yLabel="midpoint and radius">{p => <>{p.line([1.4140625, .5], [1.416015625, .5], C.c, {
          strokeWidth: 4
        })}{p.mark([1.4150390625, .5], 'b', 'midpoint')}</>}</Plot><Table caption="Width and half-width" headers={['completed k', 'width 2/2ᵏ', 'radius']} rows={[0, 1, 3, 10].map(k => [k, number(2 / 2 ** k), number(1 / 2 ** k)])} /></Figure>;
}
export function BracketFailures() {
  return <Figure id="NM09" caption="Left: opposite signs across a pole do not establish a root. Right: equal endpoint signs do not exclude a touching root."><Panels><Plot domain={[-1, 1]} range={[-5, 5]} xLabel="x" yLabel="1/x (undefined at 0)">{p => <>{p.curve(x => 1 / x, C.reference, -1, -.02)}{p.curve(x => 1 / x, C.reference, .02, 1)}{p.line([0, -5], [0, 5], C.invalid, {
            strokeDasharray: '4 4'
          })}{p.mark([0, 0], 'invalid')}</>}</Plot><Plot domain={[0, 2]} range={[-.2, 1.2]} xLabel="x" yLabel="(x−1)²">{p => <>{p.curve(x => (x - 1) ** 2)}{p.mark([0, 1], 'a')}{p.mark([2, 1], 'c')}{p.mark([1, 0], 'reference', 'root')}</>}</Plot></Panels></Figure>;
}
export function Tangent({
  x = 1.5,
  fn = v => v * v - 2,
  derivative = v => 2 * v,
  domain = [1.2, 1.7],
  range = [-.3, .9],
  role = 'a',
  nextRole = 'b'
}) {
  const value = fn(x),
    slope = derivative(x),
    next = x - value / slope;
  return <><Plot domain={domain} range={range} xLabel="input x" yLabel="function and tangent">{p => <>{p.curve(fn)}{p.curve(v => value + slope * (v - x), C[role])}{p.mark([x, value], role)}{p.mark([next, 0], nextRole)}{p.line([x, 0], [x, value], C[role], {
          strokeDasharray: '4 4'
        })}{p.arrow([x, 0], [next, 0], C[nextRole])}</>}</Plot><Facts rows={[["sample x", number(x), role], ['original f(x)', number(value), role], ['tangent slope', number(slope)], ['axis intercept x−f/f′', number(next), nextRole]]} /></>;
}
export function FirstNewton() {
  return <Figure id="NM11" caption="Follow the cyan sample down by f=0.25 and horizontally by f/f′=1/12 to the amber axis intercept. The tangent approximates the curve locally."><Tangent /><Equation>1.5 − 0.25/3 = 17/12 = {number(17 / 12)}.</Equation></Figure>;
}
export function ReevaluateNewton() {
  const x = 17 / 12;
  return <Figure id="NM12" caption="The amber 17/12 intercept is first reevaluated on the original curve, then its new tangent proposes the purple 577/408 input. The local axes are enlarged and labelled."><Plot domain={[1.412, 1.42]} range={[-.008, .018]} xLabel="x, local scale" yLabel="x²−2, local scale">{p => <>{p.curve(v => v * v - 2)}{p.arrow([x, 0], [x, 1 / 144], C.b)}{p.mark([x, 0], 'b')}{p.mark([x, 1 / 144], 'b')}{p.curve(v => 1 / 144 + 17 / 6 * (v - x), C.b)}{p.mark([577 / 408, 0], 'c')}</>}</Plot><Equation>f(17/12)=1/144 → slope 17/6 → 17/12 − (1/144)/(17/6) = 577/408.</Equation></Figure>;
}
export function NewtonCycle() {
  return <Figure id="NM13" caption="Two tangent operations return to the same cyan input 0. Arrows encode iteration, while the cream curve is the cubic."><Panels><Tangent x={0} fn={x => x ** 3 - 2 * x + 2} derivative={x => 3 * x * x - 2} domain={[-.5, 1.5]} range={[-1, 3]} /><Tangent x={1} fn={x => x ** 3 - 2 * x + 2} derivative={x => 3 * x * x - 2} domain={[-.5, 1.5]} range={[-1, 3]} role="b" nextRole="a" /></Panels><Equation>0 − 2/(−2) = 1; then 1 − 1/1 = 0.</Equation></Figure>;
}
export function RepeatedRoot() {
  return <Figure id="NM14" caption="At a repeated root the derivative also vanishes. The two actual tangent steps halve location error instead of squaring it."><Panels><Tangent x={3} fn={x => (x - 1) ** 2} derivative={x => 2 * (x - 1)} domain={[.5, 3.5]} range={[-1, 6]} /><Tangent x={2} fn={x => (x - 1) ** 2} derivative={x => 2 * (x - 1)} domain={[.5, 3.5]} range={[-1, 6]} role="b" nextRole="c" /></Panels><Equation>e=2 → 1 → 0.5, since x−(x−1)²/[2(x−1)] = 1+(x−1)/2.</Equation><Equation>For a simple root in a suitable neighborhood with |f′|≥m&gt;0 and |f″|≤M: |e_new| ≤ M|e|²/(2m). That hypothesis fails at this repeated root.</Equation></Figure>;
}
export function Safeguard() {
  return <Figure id="NM15" caption="The acceptance span constrains a proposal; it is separate from the root bracket. Proposal 1 is rejected, and midpoint −1 is actually evaluated before a sign update."><Plot domain={[-2.2, 1.2]} range={[-.5, 3.5]} xLabel="input x" yLabel="proposal and retained interval">{p => <>{p.line([-2, 3], [0, 3], C.c, {
          strokeWidth: 5
        })}{p.line([-1.8, 2], [-.2, 2], C.reference, {
          strokeWidth: 5,
          strokeDasharray: '4 3'
        })}{p.mark([1, 2], 'invalid', '1')}{p.arrow([0, 2], [1, 2], C.invalid)}{p.mark([-1, 1], 'b', '−1')}{p.line([-2, 0], [-1, 0], C.c, {
          strokeWidth: 5
        })}{p.arrow([-1, .8], [-1, .2], C.b)}</>}</Plot><Facts rows={[["old bracket", '[-2,0]'], ['acceptable proposal', '[−1.8,−0.2]', 'reference'], ['full proposal', '1: outside central 80%', 'invalid'], ['fallback f(−1)', '3', 'b'], ['retained after sign comparison', '[−2,−1]']]} /></Figure>;
}
export function Secant() {
  return <Figure id="NM16" caption="The cyan and purple sampled values define a chord, not a tangent. The amber axis intercept must be reevaluated on the original curve."><Plot domain={[.8, 2.1]} range={[-1.5, 2.5]} xLabel="input x" yLabel="x²−2 and secant">{p => <>{p.curve(x => x * x - 2)}{p.curve(x => 3 * x - 4, C.a)}{p.mark([1, -1], 'a', 'x₀')}{p.mark([2, 2], 'c', 'x₁')}{p.mark([4 / 3, 0], 'b')}{p.arrow([4 / 3, 0], [4 / 3, -2 / 9], C.b)}{p.mark([4 / 3, -2 / 9], 'b')}</>}</Plot><Equation>Chord slope = (2−(−1))/(2−1) = 3; intercept = 2−2/3 = 4/3; f(4/3)=−2/9. No unrestricted-secant bracket guarantee follows.</Equation></Figure>;
}
