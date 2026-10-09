import { useState } from 'react';
import { C, Figure, Panels, Plot, Facts, Equation, Table, Weighted, number } from './NumericalDrawingPrimitives.jsx';
import { integralProblems, sampledTrapezoid } from '../../data/numerical-methods-models.js';
import { discharge, dischargeTimes, panelDetail } from '../../data/numerical-reading-models.js';
export function TrapezoidGeometry() {
  return <Figure id="NM28" caption="The two filled trapezoids use true endpoint heights and widths. Hatching between each chord and the curve is the excess area, not a separate invented error bar."><Plot domain={[0, 1]} range={[0, 1.1]} xLabel="x" yLabel="x²">{p => <>{[[0, .5, 'a'], [.5, 1, 'c']].map(([a, b, role]) => <g key={a}>{p.polygon([[a, 0], [a, a * a], [b, b * b], [b, 0]], C[role])}{p.line([a, a * a], [b, b * b], C[role])}{p.polygon([[a, a * a], [b, b * b], ...Array.from({
            length: 41
          }, (_, i) => {
            const x = b - (b - a) * i / 40;
            return [x, x * x];
          })], C.invalid, {
            fill: p.hatch,
            fillOpacity: 1
          })}</g>)}{p.curve(x => x * x)}{p.mark([0, 0], 'a')}{p.mark([.5, .25], 'b')}{p.mark([1, 1], 'c')}</>}</Plot><Equation>First area = .5(0+.25)/2 = 1/16. Second = .5(.25+1)/2 = 5/16. Sum 3/8; exact 1/3; excess 1/24.</Equation></Figure>;
}
export function SharedTrapezoidWeight() {
  return <Figure id="NM29" caption="The amber middle sample is one entity used by two neighboring trapezoids. Its two half contributions merge into one full weight."><Plot domain={[0, 1]} range={[-.5, 2.5]} xLabel="sample x" yLabel="weight contributions">{p => <>{p.line([0, 2], [.5, 2], C.neutral)}{p.line([.5, 1], [1, 1], C.neutral)}{p.mark([0, 2], 'a', '½')}{p.mark([.5, 2], 'b', '½')}{p.mark([.5, 1], 'b', '½')}{p.mark([1, 1], 'c', '½')}{p.arrow([.5, 1.8], [.5, .2], C.b)}{p.mark([.5, 0], 'b', '1')}</>}</Plot><Weighted nodes={[{
      value: 0,
      weight: .5,
      role: 'a',
      label: 'x=0'
    }, {
      value: .25,
      weight: 1,
      role: 'b',
      label: 'x=.5: ½+½'
    }, {
      value: 1,
      weight: .5,
      role: 'c',
      label: 'x=1'
    }]} divisor={2} label="Multiply the weighted sum by h=.5" /></Figure>;
}
export function SimpsonBasis() {
  const bases = [{
    f: u => u * (u - 1) / 2,
    role: 'a',
    node: -1,
    area: 1 / 3
  }, {
    f: u => 1 - u * u,
    role: 'b',
    node: 0,
    area: 4 / 3
  }, {
    f: u => u * (u + 1) / 2,
    role: 'c',
    node: 1,
    area: 1 / 3
  }];
  return <Figure id="NM30" caption="Three Lagrange basis curves use the same signed height scale. Each curve is 1 at its own coloured node and 0 at the other nodes. Negative lobes remain visible."><Panels>{bases.map(o => <div key={o.role}><Plot domain={[-1, 1]} range={[-.25, 1.1]} xLabel="u" yLabel={'basis for u=' + o.node}>{p => <>{p.area(o.f, -1, 1, C[o.role])}{p.curve(o.f, C[o.role])}{[-1, 0, 1].map(u => <g key={u}>{p.mark([u, o.f(u)], u === o.node ? o.role : 'neutral')}</g>)}</>}</Plot><Equation><span style={{
            color: C[o.role]
          }}>Integral {number(o.area)} × f({o.node})</span></Equation></div>)}</Panels><Equation>Interpolant = f(−1)ℓ₋ + f(0)ℓ₀ + f(1)ℓ₊ → integral = [f(−1)+4f(0)+f(1)]/3.</Equation></Figure>;
}
export function CompositeSimpsonWeights() {
  return <Figure id="NM31" caption="Two paired panels share the same middle sample x=.5. Each contributes weight 1 there, yielding the composite weight 2. n counts subintervals."><Plot domain={[0, 1]} range={[-.5, 2.5]} xLabel="sample x" yLabel="paired panels">{p => <>{p.line([0, 2], [.5, 2], C.a, {
          strokeWidth: 4
        })}{p.line([.5, 1], [1, 1], C.c, {
          strokeWidth: 4
        })}{[0, .25, .5].map(x => <g key={'l' + x}>{p.mark([x, 2], x === .5 ? 'b' : 'a', x === .25 ? '4' : '1')}</g>)}{[.5, .75, 1].map(x => <g key={'r' + x}>{p.mark([x, 1], x === .5 ? 'b' : 'c', x === .75 ? '4' : '1')}</g>)}{p.arrow([.5, 1.8], [.5, .2], C.b)}{p.mark([.5, 0], 'b', '2')}</>}</Plot><Table caption="Add panel weights before multiplying by h/3" headers={['panel', 'x=0', '.25', '.5', '.75', '1']} rows={[["left", 1, 4, 1, 0, 0], ['right', 0, 0, 1, 4, 1], ['sum', 1, 4, 2, 4, 1]]} /><Plot domain={[0, 3]} range={[0, 1]} xLabel="odd-n example: three intervals" yLabel="pair coverage">{p => <>{p.line([0, .5], [2, .5], C.a, {
          strokeWidth: 5
        })}{p.polygon([[2, .2], [3, .2], [3, .8], [2, .8]], C.invalid, {
          fill: p.hatch,
          fillOpacity: 1
        })}</>}</Plot><Equation>With n=3, the last interval is unpaired: the classic composite Simpson formula is unavailable.</Equation></Figure>;
}
export function UnequalSamples() {
  return <Figure id="NM33" caption="Time coordinates, not sample indices, determine widths. The second interval is three times wider than the first."><Plot domain={[0, 2]} range={[0, 2.5]} xLabel="time" yLabel="rate">{p => <>{p.polygon([[0, 0], [.5, 2], [.5, 0]], C.a)}{p.polygon([[.5, 0], [.5, 2], [2, 2], [2, 0]], C.c)}{p.path([[0, 0], [.5, 2], [2, 2]])}{p.mark([0, 0], 'a')}{p.mark([.5, 2], 'b')}{p.mark([2, 2], 'c')}</>}</Plot><Equation>Widths: .5 and 1.5. Areas: .5(0+2)/2=.5 and 1.5(2+2)/2=3. Total=3.5 time×rate units.</Equation></Figure>;
}
export function DischargeSamples() {
  const [selected, setSelected] = useState(2);
  const result = sampledTrapezoid(dischargeTimes, discharge),
    role = i => i === 2 ? 'a' : i === 3 ? 'c' : 'neutral';
  return <Figure id="NM34" caption="Nine frozen USGS observations are connected by chosen linear segments. Full volume uses baseline 0. The separate excess inset subtracts 9640 ft³/s and never claims to show the whole volume."><Panels><Plot domain={[0, 7200]} range={[0, 10000]} xLabel="elapsed seconds from 00:00 UTC" yLabel="discharge (ft³/s)">{p => <>{p.polygon([[0, 0], ...discharge.map((v, i) => [i * 900, v]), [7200, 0]], C.a)}{p.path(discharge.map((v, i) => [i * 900, v]))}{discharge.map((v, i) => <g key={i}>{p.mark([i * 900, v], role(i), '', i === selected || i === selected + 1)}</g>)}</>}</Plot><Plot domain={[0, 7200]} range={[0, 100]} xLabel="elapsed seconds" yLabel="excess above 9640 (ft³/s)">{p => <>{p.polygon([[0, 0], ...discharge.map((v, i) => [i * 900, v - 9640]), [7200, 0]], C.c)}{p.path(discharge.map((v, i) => [i * 900, v - 9640]))}{discharge.map((v, i) => <g key={i}>{p.mark([i * 900, v - 9640], role(i), '', i === selected || i === selected + 1)}</g>)}</>}</Plot></Panels><Facts rows={[["base rectangle", '9640 × 7200 = 69408000 ft³'], ['excess area', '162000 ft³', 'c'], ['sum', `${number(result.integral)} ft³`, 'a']]} /><div className="nm-controls"><button type="button" disabled={selected === 0} onClick={() => setSelected(i => i - 1)}>Previous observed interval</button><button type="button" disabled={selected === 7} onClick={() => setSelected(i => i + 1)}>Next observed interval</button></div><Equation>Selected interval {selected + 1}: {selected * 900}→{(selected + 1) * 900} elapsed seconds; area {result.contributions[selected]} ft³. White outlines mark its endpoints while 00:30 cyan and 00:45 purple keep their identities.</Equation><Table caption="Recorded UTC samples and chosen interval contributions" headers={['UTC', 'elapsed s', 'ft³/s', 'preceding trapezoid ft³']} rows={discharge.map((v, i) => [`${String(Math.floor(i / 4)).padStart(2, '0')}:${String(i % 4 * 15).padStart(2, '0')}`, i * 900, v, i ? result.contributions[i - 1] : 'no preceding interval'])} /></Figure>;
}
export function SampleAccess() {
  return <Figure id="NM35" caption="Both branches begin with the same two observations. Only a callable can supply a new function evaluation; the fixed-record midpoint remains unknown."><Panels>{[true, false].map(callable => <div key={String(callable)}><Plot domain={[0, .5]} range={[0, .3]} xLabel="x" yLabel={callable ? 'callable x²' : 'fixed records'}>{p => <>{p.line([0, 0], [.5, .25], C.neutral, {
              strokeDasharray: '5 4'
            })}{callable && p.curve(x => x * x)}{p.mark([0, 0], 'a')}{p.mark([.5, .25], 'c')}{p.mark([.25, callable ? .0625 : .125], callable ? 'b' : 'reference', callable ? 'new' : '?')}</>}</Plot><Equation>{callable ? 'Evaluate f(.25)=.0625: new information.' : 'Midpoint unobserved. The .125 chord height is an interpolation assumption, not a measurement.'}</Equation></div>)}</Panels></Figure>;
}
export function RichardsonCancellation() {
  return <Figure id="NM36" caption="The same cream integral and amber leading error term recur in both approximations. Multiplication aligns error terms so subtraction cancels them; higher remainders remain."><div className="nm-algebra"><div>A(h) = <span style={{
          color: C.reference
        }}>I</span> + <span style={{
          color: C.b
        }}>chᵖ</span> + R(h)</div><div>A(h/2) = <span style={{
          color: C.reference
        }}>I</span> + <span style={{
          color: C.b
        }}>chᵖ/2ᵖ</span> + R(h/2)</div><div>2ᵖA(h/2) − A(h) = (2ᵖ−1)<span style={{
          color: C.reference
        }}>I</span> + <span style={{
          color: C.b
        }}><s>chᵖ−chᵖ</s></span> + remainder</div></div><Equation>I ≈ A_fine + (A_fine−A_coarse)/(2ᵖ−1). For Simpson p=4, the divisor is 15. This is an asymptotic model, not an arbitrary-function enclosure.</Equation></Figure>;
}
export function SimpsonRefinement() {
  const f = integralProblems.peak.f,
    d = panelDetail(f, 0, 1),
    roles = ['a', 'neutral', 'b', 'neutral', 'c'];
  return <Figure id="NM37" caption="Coarse and refined sums reuse endpoints and midpoint without changing identity. Only the quarter points .25 and .75 are new evaluations."><Plot domain={[0, 1]} range={[0, 1.1]} xLabel="x" yLabel="resolved peak">{p => <>{p.curve(f)}{d.xs.map((x, i) => <g key={x}>{p.line([x, 0], [x, d.values[i]], C[roles[i]], {
            strokeDasharray: i % 2 ? '3 4' : undefined
          })}{p.mark([x, d.values[i]], roles[i], String(x), i % 2 === 1)}</g>)}</>}</Plot><Table caption="The same sample values enter two weighted sums" headers={['x', 'f(x)', 'coarse weight ×1/6', 'refined weight ×1/12', 'access']} rows={d.xs.map((x, i) => [x, number(d.values[i]), [1, 0, 4, 0, 1][i], [1, 4, 2, 4, 1][i], i % 2 ? 'new' : 'reused'])} /><Facts rows={[["coarse", number(d.coarse)], ['refined', number(d.refined)], ['difference / 15', number(d.difference / 15)], ['corrected', number(d.corrected)], ['estimated error', number(d.error)]]} /></Figure>;
}
export function AdaptiveSplit() {
  const f = integralProblems.peak.f,
    d = panelDetail(f, 0, .5);
  return <Figure id="NM38" caption="Interval containment and equal tolerance budgets travel together. Children reuse actual cached coordinates and request their new quarter points."><Plot domain={[0, 1]} range={[-.5, 2.5]} xLabel="x" yLabel="interval containment">{p => <>{p.line([0, 2], [1, 2], C.reference, {
          strokeWidth: 4
        })}{p.line([0, 0], [.5, 0], C.a, {
          strokeWidth: 4
        })}{p.line([.5, 0], [1, 0], C.c, {
          strokeWidth: 4
        })}{p.arrow([.25, 1.8], [.25, .2], C.a)}{p.arrow([.75, 1.8], [.75, .2], C.c)}{[0, .25, .5, .75, 1].map(x => <g key={x}>{p.mark([x, 2], x === .5 ? 'b' : 'neutral')}{p.mark([x, 0], x === .5 ? 'b' : 'neutral')}</g>)}{[.125, .375, .625, .875].map(x => <g key={x}>{p.mark([x, 0], 'reference', '', true)}</g>)}</>}</Plot><Facts rows={[["parent [0,1]", 'ε=10⁻⁶'], ['left [0,.5]', 'ε/2=5×10⁻⁷', 'a'], ['right [.5,1]', 'ε/2=5×10⁻⁷', 'c'], ['new left samples', '.125 and .375'], ['new right samples', '.625 and .875']]} /><Equation>Selected left child: coarse={number(d.coarse)}, fine={number(d.refined)}. |fine−coarse|/15={number(d.error)} {d.error <= 5e-7 ? '≤' : '>'} 5×10⁻⁷ → {d.error <= 5e-7 ? 'estimated acceptance' : 'refine or report exhausted depth'}.</Equation></Figure>;
}
export function BlindPolynomial() {
  const f = integralProblems.blind.f;
  return <Figure id="NM40" caption="The curve uses separate drawing samples, not hidden algorithm evaluations. The algorithm observes only the five zero marks; both Simpson estimates and their difference are zero."><Plot domain={[0, 1]} range={[0, 1.5]} xLabel="x" yLabel="10⁵ × g(x), display scale">{p => <>{p.area(x => 1e5 * f(x), 0, 1, C.reference)}{p.curve(x => 1e5 * f(x))}{[0, .25, .5, .75, 1].map(x => <g key={x}>{p.mark([x, 0], 'a')}</g>)}</>}</Plot><Equation>Observed values: 0,0,0,0,0 → coarse=0 → refined=0 → estimate=0. Yet the exact integral in original units is 5/1419264={number(5 / 1419264)}.</Equation></Figure>;
}
export function EndpointSubstitution() {
  return <Figure id="NM41" caption="The original curve continues upward without a finite endpoint. Shading shows the omitted region for the visible example δ=0.1; its upper part continues beyond the plotted height. Transforming x=u² changes both height and width; their product becomes constant. The endpoint is defined by continuity."><Panels><Plot domain={[0, 1]} range={[0, 6]} xLabel="x" yLabel="x⁻¹/² (unbounded at 0)">{p => <>{p.curve(x => 1 / Math.sqrt(x), C.reference, .001, 1)}{p.polygon([[0,0],[0,1e4],...Array.from({length:100},(_,i)=>{const x=10**(-8+7*i/99);return [x,1/Math.sqrt(x)];}),[.1,0]],C.a)}{p.line([0, 0], [0, 6], C.invalid, {
            strokeDasharray: '3 4'
          })}</>}</Plot><Plot domain={[0, 1]} range={[0, 3]} xLabel="u" yLabel="transformed integrand">{p => <>{p.area(() => 2, 0, 1, C.a)}{p.curve(() => 2)}{p.mark([0, 2], 'reference')}</>}</Plot></Panels><Equation>The visible cutoff δ=0.1 omits exact area 2√0.1≈0.632456. At u&gt;0: height x⁻¹/²=1/u; width dx=2u du → area (1/u)(2u du)=2du.</Equation><Plot domain={[0, 1]} range={[-.5, 1.5]} xLabel="coordinates" yLabel="mapped width">{p => <>{p.line([.4, 1], [.5, 1], C.a, {
          strokeWidth: 6
        })}{p.line([.16, 0], [.25, 0], C.a, {
          strokeWidth: 6
        })}{p.arrow([.4, .8], [.16, .2], C.a)}{p.arrow([.5, .8], [.25, .2], C.a)}</>}</Plot><Equation>Example finite strip: u=.4→.5 maps to x=.16→.25. For cutoff δ, omitted area is 2√δ; δ=10⁻⁶ loses .002.</Equation></Figure>;
}
export function GaussianMoments() {
  const c = 1 / Math.sqrt(3);
  return <Figure id="NM42" caption="Symmetric interior nodes share weight w. The same cyan and purple nodes first match constant area, then quadratic area; odd contributions cancel."><Panels>{[false, true].map(square => <Plot key={String(square)} domain={[-1, 1]} range={[-.2, 1.2]} xLabel="u" yLabel={square ? 'u²' : 'constant 1'}>{p => <>{p.area(square ? u => u * u : () => 1, -1, 1, C.reference)}{p.curve(square ? u => u * u : () => 1)}{p.mark([-c, square ? 1 / 3 : 1], 'a')}{p.mark([c, square ? 1 / 3 : 1], 'c')}</>}</Plot>)}</Panels><Equation>Constant: 2w=2 ⇒ w=1. Quadratic: 2wc²=2/3 ⇒ c=1/√3. Odd sum w(−c)+w(c)=0.</Equation><Facts rows={[["left node", number(-c), 'a'], ['right node', number(c), 'c'], ['each weight', '1']]} /></Figure>;
}
export function GaussianMapping() {
  const c = 1 / Math.sqrt(3);
  return <Figure id="NM43" caption="The affine map moves the same two nodes and scales widths by d. The second interval makes the non-unit Jacobian visible."><Panels>{[[2, 4], [1, 4]].map(([a, b]) => {
        const m = (a + b) / 2,
          d = (b - a) / 2;
        return <div key={a}><Plot domain={[-1, 4]} range={[-.5, 1.5]} xLabel="source u / target x" yLabel={`map to [${a},${b}]`}>{p => <>{p.line([-1, 1], [1, 1], C.neutral, {
                strokeWidth: 5
              })}{p.line([a, 0], [b, 0], C.reference, {
                strokeWidth: 5
              })}{p.mark([-c, 1], 'a')}{p.mark([c, 1], 'c')}{p.arrow([-c, .85], [m - d * c, .15], C.a)}{p.arrow([c, .85], [m + d * c, .15], C.c)}{p.mark([m - d * c, 0], 'a')}{p.mark([m + d * c, 0], 'c')}</>}</Plot><Equation>m={m}, d={d}; x=m+du. Nodes {number(m - d * c)}, {number(m + d * c)}; multiply the sum by d={d}.</Equation></div>;
      })}</Panels></Figure>;
}
export function GaussianBoundary() {
  const c = 1 / Math.sqrt(3);
  return <Figure id="NM44" caption="Two-node exactness stops at degree three. Sample heights 1/9 produce a weighted estimate, while true fourth-power area is 2/5."><Plot domain={[-1, 1]} range={[0, 1.1]} xLabel="u" yLabel="u⁴">{p => <>{p.area(x => x ** 4, -1, 1, C.reference)}{p.curve(x => x ** 4)}{p.mark([-c, 1 / 9], 'a')}{p.mark([c, 1 / 9], 'c')}</>}</Plot><Plot domain={[0, .45]} range={[-.5, 1.5]} xLabel="integral amount" yLabel="same amount scale">{p => <>{p.line([0, 1], [2 / 9, 1], C.a, {
          strokeWidth: 5
        })}{p.mark([2 / 9, 1], 'a', 'estimate')}{p.line([0, 0], [2 / 5, 0], C.reference, {
          strokeWidth: 5
        })}{p.mark([2 / 5, 0], 'reference', 'exact')}</>}</Plot><Equation>Estimate−exact = 2/9−2/5 = −8/45 = {number(-8 / 45)}.</Equation></Figure>;
}
