import { C, Figure, Panels, Plot, Facts, Equation, Table, Weighted, number } from './NumericalDrawingPrimitives.jsx';
export function CentralStencil() {
  const nodes = [{
    x: .9,
    value: Math.sin(.9),
    weight: -.5,
    role: 'a',
    label: 'left x−h'
  }, {
    x: 1.1,
    value: Math.sin(1.1),
    weight: .5,
    role: 'c',
    label: 'right x+h'
  }];
  return <Figure id="NM18" caption="Cyan left and purple right samples keep their identities through signed multiplication and addition. A negative weight reverses a contribution, even when its sample is positive."><Plot domain={[.8, 1.2]} range={[.65, .95]} xLabel="input x" yLabel="sin x">{p => <>{p.curve(Math.sin)}{nodes.map(n => <g key={n.x}>{p.mark([n.x, n.value], n.role, n.x.toString())}{p.line([n.x, .65], [n.x, n.value], C[n.role], {
            strokeDasharray: '4 4'
          })}</g>)}</>}</Plot><Weighted nodes={nodes} divisor={.1} /></Figure>;
}
export function TaylorCancellation() {
  const columns = [['constant', 'f', 'f', '0'], ['first order', '+hf′', '−hf′', '2hf′'], ['second order', '+h²f″/2', '+h²f″/2', '0'], ['third order', '+h³f‴/6', '−h³f‴/6', 'h³f‴/3']];
  return <Figure id="NM19" caption="Subtract the whole x−h row, including its signs. Columns align equal Taylor orders; crossed terms cancel algebraically before division. The remainder is carried separately."><div className="nm-algebra">{columns.map(([title, plus, minus, result], i) => <div key={title}><strong>{title}</strong><p style={{
          color: C.c
        }}>x+h: {plus}</p><p style={{
          color: C.a
        }}>−(x−h row): −({minus})</p><hr /><p>{i % 2 === 0 ? <><s>{plus} − ({minus})</s> = 0</> : <>retained: {result}</>}</p></div>)}</div><Equation>Difference = 2hf′ + h³f‴/3 + remainder. Divide every retained term by 2h: f′ + h²f‴/6 + divided remainder.</Equation></Figure>;
}
export function SecondDifference() {
  const nodes = [{
    x: .5,
    value: .25,
    weight: 1,
    role: 'a',
    label: 'left'
  }, {
    x: 1,
    value: 1,
    weight: -2,
    role: 'b',
    label: 'middle'
  }, {
    x: 1.5,
    value: 2.25,
    weight: 1,
    role: 'c',
    label: 'right'
  }];
  return <Figure id="NM20" caption="Neighboring secants change from slope 1.5 to 2.5. The same three samples form the signed (+1,−2,+1) stencil."><Plot domain={[.25, 1.75]} range={[0, 3]} xLabel="x" yLabel="x²">{p => <>{p.curve(x => x * x)}{p.line([.5, .25], [1, 1], C.a)}{p.line([1, 1], [1.5, 2.25], C.c)}{nodes.map(n => <g key={n.x}>{p.mark([n.x, n.value], n.role)}</g>)}</>}</Plot><Equation>(right slope − left slope)/h = (2.5−1.5)/0.5 = 2.</Equation><Weighted nodes={nodes} divisor={.25} label="Same second derivative through sample weights" /></Figure>;
}
export function BoundaryStencil() {
  const nodes = [{
    x: 0,
    value: 0,
    weight: -1.5,
    role: 'a',
    label: 'boundary x'
  }, {
    x: .5,
    value: .25,
    weight: 2,
    role: 'b',
    label: 'x+h'
  }, {
    x: 1,
    value: 1,
    weight: -.5,
    role: 'c',
    label: 'x+2h'
  }];
  return <Figure id="NM21" caption="Hatching marks the forbidden input domain x<0. Negative coefficients are signed arithmetic; they do not mean forbidden sample locations."><Plot domain={[-.5, 1.2]} range={[0, 1.5]} xLabel="x; only x≥0 available" yLabel="x²">{p => <>{p.polygon([[-.5, 0], [0, 0], [0, 1.5], [-.5, 1.5]], C.invalid, {
          fill: p.hatch,
          fillOpacity: 1
        })}{p.curve(x => x * x, C.reference, 0, 1.2)}{nodes.map(n => <g key={n.x}>{p.mark([n.x, n.value], n.role)}</g>)}</>}</Plot><Weighted nodes={nodes} divisor={.5} /><Equation>The boundary derivative is 0 for this quadratic; no unavailable negative input was evaluated.</Equation></Figure>;
}
export function StencilMoments() {
  const matrix = [[1, 1, 1], [0, 1, 2], [0, 1, 4]],
    weights = [-1.5, 2, -.5],
    roles = ['a', 'b', 'c'];
  return <Figure id="NM22" caption="Each coloured column belongs to one available node k=0,1,2, and keeps its colour in the weight vector and all row products. These are exact rational moment constraints."><p className="nm-scroll-cue">On a narrow screen, scroll the matrix horizontally to see its row sums; focus it and use the arrow keys.</p><div className="nm-table-scroll" role="region" aria-label="Stencil moment matrix" tabIndex={0}><table><caption>Matrix × weights = required moments</caption><thead><tr><th>moment</th>{roles.map((r, i) => <th key={r} style={{
              color: C[r]
            }}>k={i}</th>)}<th>weighted row sum</th></tr></thead><tbody>{matrix.map((row, i) => <tr key={i}><th>{['constant', 'linear', 'quadratic'][i]}</th>{row.map((v, j) => <td key={j} style={{
              color: C[roles[j]]
            }}>{v} × {['−3/2', '2', '−1/2'][j]}</td>)}<td>{row.map((v, j) => v * weights[j]).join(' + ')} = {[0, 1, 0][i]}</td></tr>)}</tbody></table></div><Equation>Next moment: <span style={{
        color: C.a
      }}>0³(−3/2)</span> + <span style={{
        color: C.b
      }}>1³(2)</span> + <span style={{
        color: C.c
      }}>2³(−1/2)</span> = 0+2−4 = −2.</Equation><Equation>For f(x)=x³ the derivative error is −2h², so x=1,h=1/2 gives 2.5 instead of 3.</Equation></Figure>;
}
export function ErrorBalance() {
  const funcs = [{
    f: h => h * h,
    role: 'a',
    name: 'truncation h²'
  }, {
    f: h => 1e-6 / h,
    role: 'c',
    name: 'sample uncertainty 10⁻⁶/h'
  }, {
    f: h => h * h + 1e-6 / h,
    role: 'b',
    name: 'sum envelope'
  }];
  return <Figure id="NM23" caption="This constructed conditional envelope uses M₃=6 and η=10⁻⁶ with dimensionless h. Lines show a model bound, not measured sine errors."><Plot domain={[-4, 0]} range={[-5, 1]} xLabel="log₁₀ h" yLabel="log₁₀ error envelope">{p => <>{funcs.map(o => <g key={o.role}>{p.curve(t => Math.log10(o.f(10 ** t)), C[o.role])}</g>)}</>}</Plot><Facts rows={funcs.map(o => [o.name, 'line identity retained on the log scale', o.role])} /><Table caption="Actual envelope arithmetic" headers={['h', 'h²', 'η/h', 'sum']} rows={[.1, .01, .001].map(h => [h, ...funcs.map(o => number(o.f(h)))])} /></Figure>;
}
export function StoredValues() {
  return <Figure id="NM24" caption="The local conceptual line has its 10¹² offset removed. The stored-value comparison shows the signal disappearing before division, despite distinct input coordinates."><Plot domain={[.99997, 1.00003]} range={[.99997, 1.00003]} xLabel="input x, local scale" yLabel="exact conceptual f−10¹²">{p => <>{p.curve(x => x)}{p.mark([.99999, .99999], 'a')}{p.mark([1.00001, 1.00001], 'c')}</>}</Plot><Table caption="Exact conceptual difference versus stored arithmetic" headers={['sample', 'input', 'stored function value']} rows={[["cyan left", '.99999', '1000000000001'], ['purple right', '1.00001', '1000000000001']]} /><Equation>Conceptual difference: 0.00002. Stored subtraction: 1000000000001 − 1000000000001 = 0. Then 0/(2×10⁻⁵) = 0.</Equation></Figure>;
}
export function CoordinateCollapse() {
  return <Figure id="NM25" caption="A local binary64 neighborhood of 1 is asymmetric. The tiny intended h is shown in a separate magnified inset; it rounds back to stored input 1 before the function is asked for a value."><Plot domain={[-.6, 1.1]} range={[-.5, 1.5]} xLabel="offset from 1, units 2⁻⁵²" yLabel="nearby stored coordinates">{p => <>{p.line([-.25, .5], [.5, .5], C.neutral, {
          strokeWidth: 7
        })}{p.mark([-.5, .5], 'neutral', 'previous')}{p.mark([0, .5], 'a', '1')}{p.mark([1, .5], 'c', 'next')}{p.line([-.25, 0], [-.25, 1], C.neutral, {
          strokeDasharray: '4 4'
        })}{p.line([.5, 0], [.5, 1], C.neutral, {
          strokeDasharray: '4 4'
        })}</>}</Plot><Plot domain={[0, 1.5]} range={[0, 1]} xLabel="intended offset / 10⁻²⁰" yLabel="magnified intended input">{p => <>{p.mark([1, .6], 'reference', 'intended')}{p.arrow([1, .3], [0, .3], C.a)}{p.mark([0, .3], 'a', 'stored')}</>}</Plot><Facts rows={[["left spacing", '2⁻⁵³'], ['right spacing', '2⁻⁵²'], ['intended h', '10⁻²⁰', 'reference'], ['stored 1+h', '1', 'a']]} /></Figure>;
}
export function DirectionalDifference() {
  const fn = (x, y) => x * x + 3 * x * y + 2 * y * y;
  return <Figure id="NM27" caption="The two displaced points follow direction v=(2,−1), whose length is √5. The path parameter h is not Euclidean step length. A separate gradient inset uses its own scale."><Panels><Plot domain={[.5, 1.5]} range={[1.5, 2.5]} equal xLabel="x" yLabel="y">{p => <>{p.line([.8, 2.1], [1.2, 1.9], C.neutral)}{p.mark([.8, 2.1], 'a', '−h')}{p.mark([1, 2], 'b')}{p.mark([1.2, 1.9], 'c', '+h')}{p.arrow([1, 2], [1.2, 1.9], C.c)}</>}</Plot><Plot domain={[0, 12]} range={[0, 12]} equal xLabel="gradient x component" yLabel="gradient y component">{p => <>{p.arrow([0, 0], [8, 11], C.reference)}{p.mark([8, 11], 'reference', '∇F')}</>}</Plot></Panels><Facts rows={[["F(0.8,2.1)", number(fn(.8, 2.1)), 'a'], ['F(1.2,1.9)', number(fn(1.2, 1.9)), 'c'], ['central quotient', number((fn(1.2, 1.9) - fn(.8, 2.1)) / .2)], ['gradient dot v', '(8,11)·(2,−1) = 16−11 = 5', 'reference']]} /></Figure>;
}
