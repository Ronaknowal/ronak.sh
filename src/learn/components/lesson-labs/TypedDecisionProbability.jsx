import { useId, useState } from 'react';
import { candidateColors as colors, clippedReward, dot, ordinalTrace, reportSamples, scores,
  simplexPoint, stickProbability, sum } from '../../data/typed-decision-models.js';
import { Arrow, Bars, Check, Controls, EvidenceState, Figure, fmt, Matrix, Pair, Plot, Range,
  Scroll, Select, Table, useObservations, vector } from './TypedDecisionShared.jsx';
import { ProbabilityTriangle } from './TypedDecisionFoundations.jsx';

export function DecisionProperScore() {
  const [a, setA] = useState(.2);
  const [share, setShare] = useState(.375);
  const id = useId().replaceAll(':', '');
  const truth = [.6, .3, .1];
  const q = stickProbability(a, share);
  const result = scores(truth, q);
  const center = simplexPoint(truth);
  const regretText = value => Math.abs(value) < 1e-12 ? "numerically zero (roundoff below 10⁻¹²)" : fmt(value);
  return <Figure id="D13" caption="True population p stays fixed. White filled point = p; hollow point = report q. Circles are equal Brier regret contours, clipped to the feasible simplex; dashed displacement joins p to q.">
    <Pair><ProbabilityTriangle p={q} truth={truth} extra={<><defs><clipPath id={id}><path d="M35 294.8076L335 294.8076L185 35Z" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{[.02, .08, .18, .32, .5].map(regret => <circle key={regret} cx={center[0]} cy={center[1]} r={300 * Math.sqrt(regret / 2)} fill="none" stroke="#56525e" />)}</g></>} />
      <div><Bars title="Report q" values={q} /><p>Population p = {vector(truth)}</p><p>Brier regret ‖p−q‖² = {regretText(result.brierRegret)}.</p>
        <p>Log-score regret KL(p∥q) = {regretText(result.kl)} nats.</p></div></Pair>
    <Controls reset={() => { setA(.2); setShare(.375); }}><Range label="Report mass on A" value={a} onChange={setA} /><Range label="B share of remaining report" value={share} step={.025} onChange={setShare} />
      <button type="button" onClick={() => { setA(.6); setShare(.75); }}>Report the true p</button></Controls>
  </Figure>;
}

export function DecisionRewardCurves() {
  const [truth, setTruth] = useState(.7);
  const [q, setQ] = useState(.4);
  const points = Array.from({ length: 101 }, (_, i) => .001 + i * .998 / 100);
  const result = scores([1 - truth, truth], [1 - q, q]);
  return <Figure id="D14" caption="Three rewards share the report coordinate, but each panel has its own vertical scale. Each expected reward is uniquely maximized at the true probability; heights across different scores are not comparable.">
    {['log', 'brier', 'spherical'].map((key, i) => {
      const values = points.map(x => [x, scores([1 - truth, truth], [1 - x, x])[key]]);
      const ys = values.map(x => x[1]);
      return <Plot key={key} series={[{ name: `${key} reward`, values, color: colors[i] }, { name: 'inspected report', values: [[q, result[key]]], color: '#fff', markers: true }]} xLabel="reported probability of true" yLabel={`Expected ${key} reward`} xDomain={[0, 1]} yDomain={[Math.min(...ys) - .05, Math.max(...ys) + .05]} vertical={truth} />;
    })}
    <p>At report q = {fmt(q)}: log {fmt(result.log)}, negative Brier {fmt(result.brier)}, spherical {fmt(result.spherical)}. Dashed line: true p = {fmt(truth)}.</p>
    <Controls reset={() => { setTruth(.7); setQ(.4); }}><Range label="True probability" value={truth} min={.1} max={.9} onChange={setTruth} /><Range label="Inspect reported probability" value={q} min={.01} max={.99} step={.01} onChange={setQ} /></Controls>
  </Figure>;
}

export function DecisionRankedScore() {
  const [actual, setActual] = useState(1);
  const [swap, setSwap] = useState(false);
  const base = [.1, .2, .3, .4];
  const order = swap ? [0, 2, 1, 3] : [0, 1, 2, 3];
  const p = order.map(i => base[i]);
  const index = order.indexOf(actual);
  const result = ordinalTrace(p, index);
  return <Figure id="D15" caption="Each ordered boundary creates a binary event. Squares below have side length |forecast−observed| on a common unit scale, so their areas are the three RPS terms. Reordering middle meanings changes the distance being scored.">
    <Bars title="Mass in current category order" values={p} names={order.map(i => `level ${i}`)} colors={order.map(i => colors[i])} />
    <Matrix label="Cumulative binary events at the three boundaries" values={[result.cumulative, result.observed, result.terms]} rowNames={['forecast F', 'observed 1[y≤k]', 'squared error']} colNames={['k0', 'k1', 'k2']} />
    <Scroll label="Squared cumulative errors, common unit side of 100px"><svg viewBox="0 0 420 155" style={{ width: '26rem' }} role="img" aria-label={`Squared errors ${vector(result.terms)}`}>
      {result.terms.map((area, i) => <g key={i}><rect x={15 + i * 140} y="10" width="100" height="100" fill="none" stroke="#555" />
        <rect x={15 + i * 140} y={110 - 100 * Math.sqrt(area)} width={100 * Math.sqrt(area)} height={100 * Math.sqrt(area)} fill={colors[i]} opacity=".7" />
        <text x={65 + i * 140} y="137" textAnchor="middle">{fmt(area)}</text></g>)}
    </svg></Scroll>
    <p>RPS = ({result.terms.map(x => fmt(x)).join(' + ')}) / 3 = {fmt(result.rps)}.</p>
    <Controls reset={() => { setActual(1); setSwap(false); }}><Select label="Observed original level" value={actual} options={[0, 1, 2, 3].map(i => [i, `level ${i}`])} onChange={x => setActual(Number(x))} /><Check label="Swap middle category meanings" checked={swap} onChange={setSwap} /></Controls>
  </Figure>;
}

export function DecisionReportPolicy() {
  const [sigma, setSigma] = useState(.3);
  const [selected, setSelected] = useState(0);
  const samples = reportSamples(sigma);
  const item = samples[selected];
  const project = x => [x[0] / Math.sqrt(2) - x[1] / Math.sqrt(2), (x[0] + x[1] - 2 * x[2]) / Math.sqrt(6)];
  const center = project([.4, -.1, -.3]);
  const px = x => 190 + x * 55;
  const py = y => 150 - y * 55;
  return <Figure id="D16" caption="Five fixed constructed centered-noise witnesses trace the operation; they are not an empirical Gaussian sample cloud. The plane uses an orthonormal basis for sum(logits)=0. Circles show radii σ and 2σ around θ, not probability bounds.">
    <Pair><Scroll label="Centered logit plane"><svg viewBox="0 0 380 300" style={{ width: '24rem' }} role="img" aria-label="Noise perturbs centered logits before softmax">
      <path d="M20 150H365M190 10V275" stroke="#777" />
      {[1, 2].map(k => <circle key={k} cx={px(center[0])} cy={py(center[1])} r={sigma * k * 55} stroke="#666" fill="none" />)}
      {samples.map((s, i) => { const xy = project(s.logits); return <g key={i}><path d={`M${px(center[0])} ${py(center[1])}L${px(xy[0])} ${py(xy[1])}`} stroke={colors[i]} />
        <circle cx={px(xy[0])} cy={py(xy[1])} r={i === selected ? 6 : 3} fill={colors[i]} stroke={i === selected ? '#fff' : 'none'} /></g>; })}
      <circle cx={px(center[0])} cy={py(center[1])} r="4" fill="#fff" /><text x="25" y="290">coordinates along orthonormal e₁, e₂</text>
    </svg></Scroll><ProbabilityTriangle p={item.p} /></Pair>
    <Matrix label="Selected witness from logits to report-policy score" values={[item.noise, item.logits, item.p, item.score]} rowNames={['centered ε', 'θ + σε', 'softmax report', 'ε / σ']} colNames={['A', 'B', 'C']} signed />
    <p>Expected unclipped log + 0.5 spherical reward = {fmt(item.reward)}. A whole probability vector was produced; no class was sampled.</p>
    <Controls reset={() => { setSigma(.3); setSelected(0); }}><Range label="Noise scale σ" value={sigma} min={.05} max={1} step={.05} onChange={setSigma} /><Select label="Noise witness" value={selected} options={samples.map((_, i) => [i, `vector ${i + 1}`])} onChange={x => setSelected(Number(x))} /></Controls>
  </Figure>;
}

export function DecisionEstimatorEvidence() {
  const state = useObservations();
  const [g, setG] = useState(2);
  const [method, setMethod] = useState('leave_one_out');
  const [coordinate, setCoordinate] = useState(0);
  const [constant, setConstant] = useState(false);
  if (!state.data) return <Figure id="D17" caption="Recorded finite report-policy experiment"><EvidenceState state={state} /></Figure>;
  const data = state.data.policy;
  const group = data.groups.find(x => x.group_size === g);
  const names = Object.keys(group.estimators);
  const actualMethod = names.includes(method) ? method : names[0];
  const item = group.estimators[actualMethod];
  const values = group.first_twelve_group_estimates[actualMethod].map((row, i) => [i + 1, row[coordinate]]);
  const reference = data.reference_smoothed_gradient.mean[coordinate];
  return <Figure id="D17" caption="Actual finite study: 4,096 computed group estimates, aggregate summaries and first twelve stored; 131,072 independent pathwise-reference vectors. The constant-reward switch is a separate constructed LOO null, not another recorded run.">
    {constant ? <><Plot series={[{ name: 'constant reward: LOO = 0', values: values.map(([x]) => [x, 0]), color: colors[4] }]} points xLabel="constructed group index" yLabel="LOO gradient coordinate" xDomain={[1, 12]} yDomain={[-1, 1]} />
      <p>Every reward equals its leave-one-out baseline, so every score multiplier is exactly zero. Recorded-run controls are inactive for this constructed null.</p></>
      : <><Plot series={[{ name: `${actualMethod}, first12`, values }]} points xLabel="stored group estimate index" yLabel={`gradient coordinate ${coordinate}`} xDomain={[1, 12]}
        yDomain={[Math.min(...values.map(x => x[1]), reference) - .1, Math.max(...values.map(x => x[1]), reference) + .1]}
        reference={[[1, reference], [12, reference]]} />
      <p>Dashed smoothed reference = {fmt(reference, 6)}; deterministic unsmoothed gradient = {fmt(data.deterministic_gradient[coordinate], 6)}.</p>
      <Table caption="All computed estimates: aggregate uncertainty" headers={['Estimator', 'mean', 'SD', 'SE', 'replicates']} rows={names.map(name => {
        const row = group.estimators[name]; return [name, row.mean[coordinate], row.standard_deviation[coordinate], row.standard_error[coordinate], row.replicates];
      })} /><p className="typed-hash">Noise identity: {group.noise_sha256}</p></>}
    <Controls reset={() => { setG(2); setMethod('leave_one_out'); setCoordinate(0); setConstant(false); }}><Select label="Recorded group size" disabled={constant} value={g} options={[2, 4, 8, 16].map(x => [x, `G = ${x}`])} onChange={x => setG(Number(x))} />
      <Select label="Estimator" disabled={constant} value={actualMethod} options={names.map(x => [x, x])} onChange={setMethod} /><Select label="Gradient coordinate" disabled={constant} value={coordinate} options={[0, 1, 2].map(x => [x, String(x)])} onChange={x => setCoordinate(Number(x))} />
      <Check label="Constructed constant-reward LOO null" checked={constant} onChange={setConstant} /></Controls>
  </Figure>;
}

export function DecisionRecipeGraph() {
  return <Figure id="D18" caption="Pinned training-notebook graph: the policy samples a probability report; the reward path is detached for the likelihood-ratio term. The purple live-θ branch differentiates the report density log πθ(u) at the detached sample. Direct soft-CE retains its own gradient. This is the source recipe, with no PPO ratio or PPO clipping operation.">
    <Scroll label="Native recipe gradient branches"><svg viewBox="0 0 720 475" style={{ width: '45rem' }} role="img" aria-label="Logits branch into direct cross entropy and a detached Gaussian report policy; both return gradients">
      <defs><marker id="typed-recipe-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#ddd" /></marker></defs>
      <g fill="none" stroke="#aaa" markerEnd="url(#typed-recipe-arrow)">
        <path d="M340 60L170 110V205" /><path d="M50 185V225H110" />
        <path d="M340 60L510 110V120" /><path d="M510 145V160" /><path d="M510 185V208" />
        <path d="M510 230V240" /><path d="M510 267V285" /><path d="M510 312V336" />
        <path d="M405 40H680V350H625" stroke={colors[2]} />
        <path d="M170 245V395H300" /><path d="M510 360V395H375" /><path d="M340 419V455" />
      </g>
      <rect x="275" y="20" width="130" height="40" fill="#25212c" stroke={colors[2]} /><text x="340" y="46" textAnchor="middle">trainable logits θ</text>
      <text x="50" y="158" textAnchor="middle">target</text><text x="50" y="176" textAnchor="middle">t</text>
      <text x="170" y="229" textAnchor="middle">direct soft CE</text><text x="80" y="279" textAnchor="middle">coefficient 1</text>
      <text x="650" y="95" textAnchor="middle">live θ</text>
      <text x="510" y="140" textAnchor="middle">detach θ for sampling</text><text x="510" y="178" textAnchor="middle">u = θ.detach + σε</text>
      <text x="510" y="226" textAnchor="middle">q = softmax(u)</text><text x="510" y="258" textAnchor="middle">detached reward R(q,t)</text>
      <text x="510" y="303" textAnchor="middle">group self-baseline / random SD</text><text x="510" y="354" textAnchor="middle">− A.detach × log πθ(u)</text>
      <circle cx="340" cy="395" r="24" fill="#17181c" stroke="#ddd" /><text x="340" y="402" textAnchor="middle">+</text>
      <text x="340" y="474" textAnchor="middle">backpropagate both branches</text>
    </svg></Scroll>
    <p>Choice reward: clipped log floor −9.21 + 0.75 spherical in the notebook. Function default: 0.5. Ordered CDF discrepancy coefficient: 1.</p>
  </Figure>;
}

export function DecisionRareEvent() {
  const [weight, setWeight] = useState(.75);
  const [rare, setRare] = useState(.5);
  const truth = [1 - 1e-6, 1e-6];
  const base = clippedReward(truth, truth, weight);
  const values = Array.from({ length: 101 }, (_, i) => .01 + 1.99 * i / 100);
  const clipped = values.map(x => [x, (clippedReward(truth, [1 - x * 1e-6, x * 1e-6], weight) - base) * 1e6]);
  const unclipped = values.map(x => [x, -scores(truth, [1 - x * 1e-6, x * 1e-6]).kl * 1e6]);
  const ys = [...clipped, ...unclipped].map(x => x[1]);
  const report = [1 - rare * 1e-6, rare * 1e-6];
  return <Figure id="D19" caption="Double-precision constructed rare-event witness. Horizontal units are millionths of probability; vertical units are millionths of expected reward. The clipped recipe can prefer underreporting to truth, while ordinary log reward cannot.">
    <Plot series={[{ name: `clipped log + ${weight} spherical`, values: clipped }, { name: 'ordinary log reward', values: unclipped }]} xLabel="reported rare mass × 10⁶" yLabel="reward(q) − reward(truth), ×10⁶" xDomain={[0, 2]} yDomain={[Math.min(...ys) - .1, Math.max(...ys) + .1]} vertical={1} />
    <p>True rare mass = 0.000001; report = {fmt(report[1], 8)}. Clipped reward change = {(clippedReward(truth, report, weight) - base).toExponential(6)}; ordinary log change = {(-scores(truth, report).kl).toExponential(6)}.</p>
    <Controls reset={() => { setWeight(.75); setRare(.5); }}><Range label="Reported rare mass, millionths" value={rare} min={.01} max={2} step={.01} onChange={setRare} /><Select label="Spherical coefficient" value={weight} options={[[.5, '0.5 function default'], [.75, '0.75 notebook']]} onChange={x => setWeight(Number(x))} /></Controls>
  </Figure>;
}
