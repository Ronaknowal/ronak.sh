import { useMemo, useState } from 'react';
import { TRANSPORT_COSTS, twoLocationTransport, cumulativeTransport, sinkhornScaling, stabilityComparison, sinkhornComparison } from '../../data/optimal-transport-models.js';
import { quantileBarycentre, intrinsicCoupling, permutations, intrinsicSource, intrinsicTarget } from '../../data/transport-extension-models.js';
import { Figure, Geometry, Dot, Law, LawPair, Plan, Matrix, Ledger, Values, Range, Buttons, Reset, Plot, sourceColours, targetColours, fmt, sum } from './TransportDrawingPrimitives.jsx';
export function FeasiblePlanLab() {
  const [a, setA] = useState(.5),
    [b, setB] = useState(.5),
    [fraction, setFraction] = useState(1),
    [kind, setKind] = useState('distance'),
    [cell, setCell] = useState(0);
  const s = twoLocationTransport({
    sourceFirst: a,
    targetFirst: b,
    fraction,
    costKind: kind
  });
  const reset = () => {
    setA(.5);
    setB(.5);
    setFraction(1);
    setKind('distance');
    setCell(0);
  };
  return <Figure id="OT09" label="Edit a feasible transport plan"><LawPair a={s.source} b={s.target} /><Plan plan={s.plan} a={s.source} b={s.target} selected={cell} max={1} /><Values items={[[`t in [${fmt(s.lower)}, ${fmt(s.upper)}]`, s.entry], ['Linear cost', s.cost], ['Cheapest feasible cost', s.optimumCost], ['Largest marginal error', s.residual], [`Selected P${Math.floor(cell / 2)}${cell % 2} × C${Math.floor(cell / 2)}${cell % 2}`, `${fmt(s.plan[Math.floor(cell / 2)][cell % 2])} × ${s.costs[Math.floor(cell / 2)][cell % 2]} = ${fmt(s.plan[Math.floor(cell / 2)][cell % 2] * s.costs[Math.floor(cell / 2)][cell % 2])}`]]} /><div className="ot-controls"><Range label="First source weight a0" value={a} min={0} max={1} step={.05} onChange={setA} /><Range label="First target weight b0" value={b} min={0} max={1} step={.05} onChange={setB} /><Range label="Feasible fraction" value={fraction} min={0} max={1} step={.05} onChange={setFraction} /><Buttons label="Ground cost" options={['distance', 'squared', 'indifferent', 'changed'].map(x => [x, x])} value={kind} onChange={setKind} /><Buttons label="Trace cell" options={[0, 1, 2, 3].map(n => [n, `P${Math.floor(n / 2)}${n % 2}`])} value={cell} onChange={setCell} /><button onClick={() => setFraction(s.slope <= 0 ? 1 : 0)}>Use minimum cost</button><Reset onClick={reset} /></div><Matrix values={s.costs} label="Current unit cost C" kind="cost" /></Figure>;
}
export function DualPriceLab() {
  const [f, setF] = useState(1),
    s = twoLocationTransport({
      dualPosition: f
    });
  return <Figure id="OT11" label="Feasible dual prices and every route slack"><div className="ot-pair"><Matrix values={s.plan} label="Candidate plan" max={.5} /><Matrix values={s.dual.slack} label="Slack Cij − fi − gj" kind="slack" /></div><Values items={[[`Source prices (f0,f1)`, `(0, ${fmt(f)})`], ['Target prices (g0,g1)', s.dual.targetPotential.map(v => fmt(v)).join(', ')], ['Lower bound a·f + b·g', s.dual.value], ['Plan cost', s.cost], ['Gap = mass-weighted slack', s.dualGap]]} /><div className="ot-controls"><Range label="Source price f1" value={f} min={-1} max={3} step={.1} onChange={setF} /><button onClick={() => setF(1)}>Use tight certificate</button><Reset onClick={() => setF(1)} /></div><p className="ot-note">Every offered price pair is feasible: gⱼ is the smallest available Cᵢⱼ − fᵢ. Zero gap certifies this plan.</p></Figure>;
}
export function CdfDrawing({
  x,
  a,
  y = x,
  b,
  selected = -1,
  afterPlot
}) {
  const knots = [...new Set([...x, ...y])].sort((p, q) => p - q),
    low = knots[0],
    high = knots.at(-1),
    cdf = (z, loc, w) => sum(w.filter((_, i) => loc[i] <= z));
  const curve = (loc, w) => knots.flatMap((z, i) => [[z, i ? cdf(knots[i - 1], loc, w) : 0], [z, cdf(z, loc, w)]]);
  const gaps = knots.slice(0, -1).map((z, i) => ({
    x0: z,
    x1: knots[i + 1],
    y0: cdf(z, x, a),
    y1: cdf(z, y, b)
  }));
  return <><Plot curves={[{
      label: 'source CDF',
      points: curve(x, a),
      colour: sourceColours[0]
    }, {
      label: 'target CDF',
      points: curve(y, b),
      colour: targetColours[0],
      dashed: true
    }]} domain={[low, high]} xTicks={knots} range={[0, 1]} xLabel="location" yLabel="Cumulative probability" areas={gaps.map((g, i) => ({
      ...g,
      selected: i === selected
    }))} />{afterPlot}<Ledger label="Signed gaps and absolute work" headers={['interval', 'Fα', 'Fβ', 'gap', 'width', 'work']} rows={gaps.map(g => [`${fmt(g.x0)} to ${fmt(g.x1)}`, g.y0, g.y1, g.y0 - g.y1, g.x1 - g.x0, Math.abs(g.y0 - g.y1) * (g.x1 - g.x0)])} /></>;
}
export function CumulativeGapLab() {
  const [scenario, setScenario] = useState('nearby'),
    [spacing, setSpacing] = useState(1),
    [gap, setGap] = useState(0),
    s = cumulativeTransport(scenario, spacing);
  return <Figure id="OT18" label="Cumulative probability gaps measure work"><CdfDrawing x={s.locations} a={s.source} b={s.target} selected={gap} afterPlot={<><Values items={[[`W1 = total absolute gap area`, s.cost], ['Selected interval', `${fmt(s.locations[gap])} to ${fmt(s.locations[gap + 1])}`]]} /><div className="ot-controls"><Buttons label="Target law" options={['nearby', 'far', 'identical'].map(x => [x, x])} value={scenario} onChange={setScenario} /><Range label="Location spacing" value={spacing} min={.5} max={3} step={.5} onChange={setSpacing} /><Buttons label="Selected gap" options={[0, 1, 2].map(i => [i, `Interval ${i + 1}`])} value={gap} onChange={setGap} /><Reset onClick={() => {
        setScenario('nearby');
        setSpacing(1);
        setGap(0);
      }} /></div></>} /></Figure>;
}
export function ScalingLab() {
  const [epsilon, setE] = useState(.5),
    [step, setStep] = useState(0),
    s = useMemo(() => sinkhornScaling({
      source: [.6, .4],
      target: [.3, .7],
      epsilon,
      traceSteps: 40
    }), [epsilon]),
    p = s.trace[step],
    K = TRANSPORT_COSTS.distance.map(r => r.map(c => Math.exp(-c / epsilon))),
    u = p.plan.map((r, i) => r[0] / K[i][0]),
    v = p.plan[0].map((x, j) => x / (u[0] * K[0][j]));
  return <Figure id="OT39" label="Actual alternating row and column scaling"><Plan plan={p.plan} a={s.source} b={s.target} max={Math.max(1, ...s.trace.flatMap(x => x.plan.flat()))} kind="kernel" label={step === 0 ? "Initial kernel K" : "Scaled iterate diag(u) K diag(v)"} routeLabel={step === 0 ? "Initial kernel weights on labelled edges" : "Current scaled weights on labelled edges"} quantity={step === 0 ? "kernel weight" : "scaled weight"} scaleLabel={step === 0 ? "Kernel weight" : "Scaled weight"} /><Values items={[[`Half-step ${step} of 40`, p.phase], ['Current row error', Math.max(...p.rowErrors.map(Math.abs))], ['Current column error', Math.max(...p.columnErrors.map(Math.abs))], ['Separate final reference', s.converged ? `converged after ${s.iterations} sweeps` : 'iteration cap reached'], ['Final reference residual', s.residual], ['Selected u (gauge v0 = 1)', u.map(x => fmt(x, 7)).join(', ')], ['Selected v (same gauge)', v.map(x => fmt(x, 7)).join(', ')]]} /><div className="ot-controls"><Range label="Entropy scale ε" value={epsilon} min={.1} max={2} step={.1} onChange={v => {
        setE(v);
        setStep(0);
      }} /><button disabled={step === 0} onClick={() => setStep(v => v - 1)}>Previous half-step</button><button disabled={step === 40} onClick={() => setStep(v => v + 1)}>Next half-step</button><button disabled={step === 40} onClick={() => setStep(40)}>Show 40 half-steps</button><Reset onClick={() => {
        setE(.5);
        setStep(0);
      }} /></div><Ledger label="Exact selected matrix entries and errors" headers={['row', step === 0 ? 'K i0' : 'iterate i0', step === 0 ? 'K i1' : 'iterate i1', 'sum', 'required', 'signed error']} rows={p.plan.map((r, i) => [`A${i}`, ...r, p.rowSums[i], s.source[i], p.rowErrors[i]])} /><p className="ot-note">Kernel weights express preferences; scaled weights become a coupling only when both marginal errors meet the stated tolerance. The trace contains actual half-steps. Its last state is distinct from the separately stopped reference (maximum 1,000 sweeps; tolerance 10⁻¹¹).</p></Figure>;
}
export function StabilityLab() {
  const [offset, setOffset] = useState(1000),
    s = useMemo(() => stabilityComparison(.5, offset), [offset]);
  return <Figure id="OT44" label="Ordinary underflow and a stable log-domain plan"><div className="ot-pair"><Matrix values={s.kernel} label="Ordinary K = exp(−(C + offset)/0.5)" kind="kernel" max={1} /><Matrix values={s.stable.plan} label="Stable log-domain plan" max={.5} /></div><Values items={[[`Ordinary exact-zero cells`, s.kernel.flat().filter(x => x === 0).length], ['Largest change from unshifted plan', Math.max(...s.stable.plan.flat().map((x, i) => Math.abs(x - s.reference.plan.flat()[i])))], ['Stable linear cost', s.stable.cost], ['Unshifted cost + offset', s.reference.cost + offset], ['Stable marginal residual', s.stable.residual]]} /><div className="ot-controls"><Range label="Uniform cost offset" value={offset} min={0} max={1000} step={100} onChange={setOffset} /><Reset onClick={() => setOffset(1000)} /></div><p className="ot-note">ε stays 0.5. Underflow is a floating-point representation loss; mathematical kernel entries are positive.</p></Figure>;
}
export function BiasLab() {
  const [epsilon, setE] = useState(1),
    [comparison, setComparison] = useState('contracted'),
    s = useMemo(() => sinkhornComparison(epsilon, comparison === 'shifted' ? 1 : 0, comparison === 'contracted' ? .5 : 1), [epsilon, comparison]);
  return <Figure id="OT49" label="Three complete entropic solves and self-bias correction"><div className="ot-step-grid">{[['Cross α,β', s.cross], ['Self α,α', s.sourceSelf], ['Self β,β', s.targetSelf]].map(([name, p], i) => <Matrix key={name} values={p.plan} label={name} max={.5} rowLabels={i === 2 ? ['◇ B0','◇ B1'] : ['● A0','● A1']} colLabels={i === 1 ? ['● A0','● A1'] : ['◇ B0','◇ B1']} rowColours={i === 2 ? targetColours : sourceColours} colColours={i === 1 ? sourceColours : targetColours} />)}</div><Values items={[[`Full cross objective`, s.cross.objective], ['½ full source-self objective', .5 * s.sourceSelf.objective], ['½ full target-self objective', .5 * s.targetSelf.objective], ['Difference Sε', s.divergence], ['Analytic 2×2 reference Sε', s.analyticDivergence], ['Unregularized W2²', s.exactSquaredDistance], ['Iterative status', s.converged ? 'all three residuals pass' : 'at least one solve reached cap']]} /><div className="ot-controls"><Range label="Entropy scale ε" value={epsilon} min={.1} max={4} step={.1} onChange={setE} /><Buttons label="Comparison" options={['contracted', 'shifted', 'same'].map(x => [x, x])} value={comparison} onChange={setComparison} /><Reset onClick={() => {
        setE(1);
        setComparison('contracted');
      }} /></div><Ledger label="All three full objective terms and stopping states" headers={['solve', 'linear', 'ε × negative entropy', 'full objective', 'residual', 'sweeps']} rows={[[`α,β`, s.cross], [`α,α`, s.sourceSelf], [`β,β`, s.targetSelf]].map(([n, p]) => [n, p.cost, epsilon * p.negativeEntropy, p.objective, p.residual, p.iterations])} /></Figure>;
}
export function QuantileDrawing({
  intervals,
  lambda = .5
}) {
  const curve = key => intervals.flatMap(r => [[r.lo, r[key]], [r.hi, r[key]]]);
  const max = Math.max(...intervals.flatMap(r => [r.x, r.y]));
  return <Plot curves={[{
    label: 'Qα',
    points: curve('x'),
    colour: sourceColours[0]
  }, {
    label: 'Qβ',
    points: curve('y'),
    colour: targetColours[0],
    dashed: true
  }, {
    label: `Qλ = (1 − ${fmt(lambda)}) Qα + ${fmt(lambda)} Qβ`,
    points: curve('position'),
    colour: sourceColours[1]
  }]} domain={[0, 1]} xTicks={[intervals[0].lo, ...intervals.map(r => r.hi)]} range={[0, max]} xLabel="probability u" yLabel="Quantile location" />;
}
export function BarycentreLab() {
  const [lambda, setLambda] = useState(.5),
    [unequal, setUnequal] = useState(false),
    s = quantileBarycentre(lambda, unequal);
  return <Figure id="OT56" label="Weighted quantile barycentre"><LawPair x={s.x} y={s.y} a={s.a} b={s.b} domain={[0, 5]} /><QuantileDrawing intervals={s.intervals} lambda={lambda} /><Law locations={s.locations} weights={s.weights} domain={[0, 5]} label="Barycentre law γλ (violet identifies this law)" names={s.locations.map((_, i) => `G${i}`)} colours={[sourceColours[1], sourceColours[1], sourceColours[1]]} /><Values items={[[`W2²(α, γλ)`, s.costA], ['W2²(γλ, β)', s.costB], ['Weighted objective', s.objective]]} /><div className="ot-controls"><Range label="Target barycentre weight λ" value={lambda} min={0} max={1} step={.05} onChange={setLambda} /><Buttons label="Input laws" options={[[false, 'Equal weights'], [true, 'Unequal weights']]} value={unequal} onChange={setUnequal} /><Reset onClick={() => {
        setLambda(.5);
        setUnequal(false);
      }} /></div><Ledger label="Every probability interval and its interpolated position" headers={['u interval', 'mass', 'Qα', 'Qβ', 'Qλ']} rows={s.intervals.map(r => [`${fmt(r.lo)} to ${fmt(r.hi)}`, r.mass, r.x, r.y, r.position])} /><p className="ot-note">Endpoints combine exactly coincident output locations; every positive interval mass remains.</p></Figure>;
}
export function IntrinsicTriangles({
  perm = [1, 2, 0]
}) {
  return <div className="ot-pair">{[[intrinsicSource, 'Source coordinates', false], [intrinsicTarget, 'Target coordinates', true]].map(([points, label, target]) => {
      const minX = Math.min(...points.map(p => p[0])),
        minY = Math.min(...points.map(p => p[1])),
        X = v => 55 + (v - minX) * 70,
        Y = v => 190 - (v - minY) * 70;
      return <div key={label}><p className="ot-object-label">{label}</p><Geometry label={label + '; equal physical coordinate units'} height={230}><path d={points.map((p, i) => `${i ? 'L' : 'M'}${X(p[0])} ${Y(p[1])}`).join(' ') + 'Z'} fill="none" stroke="#888" />{points.map((p, i) => <g key={i}><Dot x={X(p[0])} y={Y(p[1])} mass={1 / 3} colour={sourceColours[target ? perm.indexOf(i) : i]} target={target} /><text x={X(p[0]) + 14} y={Y(p[1]) - 12}>{target ? 'B' : 'A'}{i}</text><text x={X(p[0])} y={Y(p[1]) + 28} textAnchor="middle">({p.join(',')})</text></g>)}</Geometry></div>;
    })}</div>;
}
export function IntrinsicLab() {
  const [permutation, setP] = useState(3),
    [mix, setMix] = useState(0),
    s = intrinsicCoupling(permutation, mix);
  return <Figure id="OT63" label="Intrinsic correspondence and full quadratic distortion"><IntrinsicTriangles perm={s.perm} /><div className="ot-pair"><Matrix values={s.D} kind="distance" label="Within-source distances D" rowLabels={[0, 1, 2].map(i => `● A${i}`)} colLabels={[0, 1, 2].map(i => `● A${i}`)} rowColours={sourceColours} colColours={sourceColours} /><Matrix values={s.E} kind="distance" label="Within-target distances E" rowLabels={[0, 1, 2].map(i => `◇ B${i}`)} colLabels={[0, 1, 2].map(i => `◇ B${i}`)} rowColours={[0, 1, 2].map(i => sourceColours[s.perm.indexOf(i)])} colColours={[0, 1, 2].map(i => sourceColours[s.perm.indexOf(i)])} /></div><Plan plan={s.plan} targetIdentityColours={[0, 1, 2].map(i => sourceColours[s.perm.indexOf(i)])} a={[1 / 3, 1 / 3, 1 / 3]} b={[1 / 3, 1 / 3, 1 / 3]} max={1 / 3} /><Values items={[[`G(T) = Σ(Dik − Ejl)² Tij Tkl`, s.loss], ['Proposed correspondence', s.perm.map((j, i) => `A${i} ↔ B${j}`).join('; ')], ['Product mixture weight', mix]]} /><div className="ot-controls"><Buttons label="Permutation" options={permutations.map((p, i) => [i, p.join(' → ')])} value={permutation} onChange={setP} /><Range label="Uniform-product mixture λ" value={mix} min={0} max={1} step={.05} onChange={setMix} /><Reset onClick={() => {
        setP(3);
        setMix(0);
      }} /></div><Ledger label="Complete current coupling (all nine cells)" headers={['source', 'B0', 'B1', 'B2', 'row sum']} rows={s.plan.map((r, i) => [`A${i}`, ...r, sum(r)])} /><p className="ot-note">Transferred hue represents a proposed match. At λ = 1 the product plan loses permutation dependence. A zero distortion certifies this isometric fixture; this control is not a global optimization algorithm.</p></Figure>;
}
