import { useState } from 'react';
import { argmax, candidateColors as colors, confusion, costRegions, expectedCosts, intentNames,
  letters, reliability, roleColors, routeRows, simplexPoint, softmaxTrace } from '../../data/typed-decision-models.js';
import { Arrow, Bars, Check, Controls, EvidenceState, Figure, fmt, Matrix, Pair, Plot, Range,
  Select, Table, useObservations } from './TypedDecisionShared.jsx';
import { ProbabilityTriangle } from './TypedDecisionFoundations.jsx';

const methods = ['seed-17', 'seed-29', 'seed-43', 'lexical', 'laya'];
const costs = [[0, 3, 8], [2, 0, 5], [12, 4, 0]];
export function DecisionDataRoles() {
  return <Figure id="D20" caption="Actual selected cohort, N=540. Widths below encode counts on a common 540-record scale. Only the permitted labels feed each fitted decision; final test labels flow to evaluation.">
    <div className="typed-budget">{[240, 60, 120, 120].map((n, i) => <i key={i} style={{ width: `${100 * n / 540}%`, background: roleColors[i] }} />)}</div>
    <div className="typed-step-track">{[
      ['Train', 240, 'vocabulary + weights'], ['Development', 60, 'choose checkpoint'], ['Calibration', 120, 'fit one external T'], ['Test', 120, 'final metrics only'],
    ].map(([name, count, job], i) => <div key={name}><p style={{ color: roleColors[i] }}>{name}: {count}</p>
      <div className="typed-micro-grid">{Array.from({ length: count / 10 }, (_, j) => <span key={j} style={{ background: roleColors[i] }} />)}</div>
      <Arrow>labels ↓</Arrow><p>{job}</p></div>)}</div>
    <p>Each little square = 10 selected records. Frozen weights → selected checkpoint → external temperature → final report. No test-label arrow returns to selection.</p>
  </Figure>;
}

export function DecisionCohort() {
  const state = useObservations();
  if (!state.data) return <Figure id="D21" caption="Actual preparation receipt"><EvidenceState state={state} /></Figure>;
  const report = state.data.preparation;
  return <Figure id="D21" caption="Six prespecified intents from BANKING77. Train/development/calibration use the official training CSV; final test uses the official test CSV. These counts describe the screened subset, not all 77 intents.">
    <Matrix label="Actual records: intent × role" values={intentNames.map(() => [40, 10, 20, 20])} rowNames={intentNames} colNames={['train', 'dev', 'calibration', 'test']} />
    <Table caption="Two excluded source records" headers={['ID', 'Reason', 'Encoded length', 'Duplicate of']} rows={report.removed.map(row => [row.id, row.reason, row.tokens, row.prior_id || '—'])} />
    <p>Largest selected request: 122 / 128 positions.</p>
    <div className="typed-budget"><i style={{ width: `${100 * 122 / 128}%`, background: colors[0] }} /><i style={{ width: `${100 * 6 / 128}%`, background: '#454852' }} /></div>
    <p>{report.deduplication}. {report.limits}</p>
  </Figure>;
}

export function DecisionTrainingHistory() {
  const state = useObservations();
  const [seed, setSeed] = useState('17');
  if (!state.data) return <Figure id="D22" caption="Observed training and development values"><EvidenceState state={state} /></Figure>;
  const run = state.data.history[seed];
  const development = run.history.map(row => [row.step, row.development_nll]);
  const training = run.history.filter(row => row.next_40th_batch_nll != null).map(row => [row.step + 40, row.next_40th_batch_nll]);
  const values = [...development, ...training].map(point => point[1]);
  return <Figure id="D22" caption="Recorded evaluations every 40 updates. Dots are observations; connecting lines only guide the eye. Sampled training-batch loss belongs at the next 40th step, not at the earlier development checkpoint row.">
    <Plot series={[{ name: 'development NLL', values: development, color: roleColors[1], markers: true }, { name: 'sampled training-batch NLL', values: training, color: roleColors[0], markers: true }]}
      xLabel="optimizer update" yLabel="NLL (nats)" xDomain={[0, 400]} yDomain={[Math.min(...values) - .03, Math.max(...values) + .03]} vertical={run.selected_step} />
    <p>Seed {seed}: selected update {run.selected_step}, earliest minimum development NLL {fmt(run.selected_development_nll, 6)}. {run.steps} updates; {run.examples} examples; {run.parameters} parameters.</p>
    <Controls reset={() => setSeed('17')}><Select label="Recorded seed" value={seed} options={['17', '29', '43'].map(x => [x, x])} onChange={setSeed} /></Controls>
  </Figure>;
}

export function DecisionConfusion() {
  const state = useObservations();
  const [method, setMethod] = useState('seed-17');
  const [index, setIndex] = useState(0);
  if (!state.data) return <Figure id="D23" caption="Actual selected checkpoint test predictions"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const probabilities = data.calibration.methods[method].test_raw.probabilities;
  const targets = data.test.map(row => row.target);
  const matrix = confusion(probabilities, targets);
  const row = data.test[index];
  const selected = argmax(probabilities[index]);
  return <Figure id="D23" caption="Saved test observations, N=120. Matrix rows are true intents and columns are predicted intents; errors remain visible and selectable. Record selection only inspects existing outputs.">
    <Matrix label="Confusion counts: true row → predicted column" values={matrix} rowNames={letters} colNames={letters} />
    <div className="typed-key">{intentNames.map((name, i) => <span key={name} style={{ color: colors[i] }}>{letters[i]} {name}</span>)}</div>
    <p><strong>{row.id}</strong>: {row.state}</p><p>True {letters[row.target]}; predicted {letters[selected]} · {selected === row.target ? 'correct' : 'wrong'}.</p>
    <Bars title="Full raw probability vector" values={probabilities[index]} names={intentNames.map((name, i) => `${letters[i]} ${name}`)} />
    <Controls reset={() => { setMethod('seed-17'); setIndex(0); }}><Select label="Saved predictor" value={method} options={methods.map(x => [x, x])} onChange={setMethod} />
      <Range label="Test record index" value={index} min={0} max={119} step={1} onChange={setIndex} />
      <button type="button" onClick={() => setIndex(probabilities.findIndex((p, i) => argmax(p) !== targets[i]))}>Inspect first error</button></Controls>
  </Figure>;
}

export function DecisionTemperature() {
  const state = useObservations();
  const [temperature, setTemperature] = useState(1);
  const [equal, setEqual] = useState(false);
  if (!state.data) return <Figure id="D24" caption="Cached logits; live positive-temperature arithmetic"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const logits = equal ? [1, 1, 1, 1, 1, 1] : data.scratchLogits['seed-17'].logits[0];
  const before = softmaxTrace(logits).probabilities;
  const after = softmaxTrace(logits, undefined, temperature).probabilities;
  const target = data.test[0].target;
  return <Figure id="D24" caption="One actual cached seed-17 test row, with a separate constructed all-equal-logit null. Weights and logits remain fixed. The slider explores a new postprocessor value; it does not refit the saved temperature.">
    <Matrix label="Locked raw logits and divided logits" values={[logits, logits.map(x => x / temperature)]} rowNames={['z locked', 'z / T']} colNames={letters} signed />
    <Pair><Bars title="T = 1" values={before} /><Bars title={`T = ${fmt(temperature)}`} values={after} /></Pair>
    <p>Argmax {letters[argmax(before)]} → {letters[argmax(after)]}; {equal ? 'all candidates tie; first index chosen' : 'ranking unchanged'}. True-label NLL {fmt(-Math.log(before[target]))} → {fmt(-Math.log(after[target]))}.</p>
    <Controls reset={() => { setTemperature(1); setEqual(false); }}><Range label="Positive external temperature" value={temperature} min={.05} max={20} step={.05} onChange={setTemperature} /><Check label="Constructed equal-logit null" checked={equal} onChange={setEqual} /></Controls>
  </Figure>;
}

export function DecisionCalibrationEvidence() {
  const state = useObservations();
  const [method, setMethod] = useState('seed-17');
  const [bins, setBins] = useState(5);
  if (!state.data) return <Figure id="D25" caption="Recorded calibration objective and test reliability"><EvidenceState state={state} /></Figure>;
  const item = state.data.calibration.methods[method];
  const targets = state.data.test.map(row => row.target);
  const raw = reliability(item.test_raw.probabilities, targets, bins);
  const scaled = reliability(item.test_calibrated.probabilities, targets, bins);
  const curve = item.calibration_curve.map(row => [row.beta, row.nll]);
  return <Figure id="D25" caption="The calibration objective uses calibration labels; reliability uses test labels only after the saved fit. Changing display bins never refits T. Empty bins have no confidence or accuracy point.">
    <Plot series={[{ name: 'calibration NLL', values: curve, markers: true }]} xLabel="inverse temperature β = 1/T" yLabel="calibration NLL (nats)" vertical={item.beta} />
    <p>Recorded optimum β={fmt(item.beta, 6)}, T={fmt(item.temperature, 6)}; {item.boundary}; derivative {fmt(item.derivative, 7)}.</p>
    <Plot series={[{ name: 'raw test bins', values: raw.filter(x => x.count).map(x => [x.confidence, x.accuracy]) }, { name: 'scaled test bins', values: scaled.filter(x => x.count).map(x => [x.confidence, x.accuracy]) }]}
      points xLabel="mean maximum probability" yLabel="observed accuracy" xDomain={[0, 1]} yDomain={[0, 1]} reference={[[0, 0], [1, 1]]} />
    <Table caption="Scaled test bin counts and undefined empty bins" headers={['Bin', 'N', 'Mean confidence', 'Accuracy']} rows={scaled.map(row => [`${fmt(row.lower)}–${fmt(row.upper)}`, row.count, fmt(row.confidence), fmt(row.accuracy)])} />
    <Controls reset={() => { setMethod('seed-17'); setBins(5); }}><Select label="Recorded predictor" value={method} options={methods.map(x => [x, x])} onChange={setMethod} /><Select label="Display bins" value={bins} options={[[5, '5 primary bins'], [10, '10 diagnostic bins']]} onChange={x => setBins(Number(x))} /></Controls>
  </Figure>;
}

export function DecisionCostMatrix() {
  const [miss, setMiss] = useState(12);
  const p = [.6, .3, .1];
  const matrix = costs.map(row => row.slice());
  matrix[2][0] = miss;
  const result = expectedCosts(p, matrix);
  return <Figure id="D26" caption="Constructed costs. Rows are true outcomes A/B/C; columns are actions A/B/C. Each cost is multiplied by its row's outcome probability; action risk sums down a column. Ties choose the first action.">
    <Pair><Matrix label="Cost C(true outcome, action)" values={matrix} rowNames={['A p=.6', 'B p=.3', 'C p=.1']} colNames={['action A', 'action B', 'action C']} />
      <Matrix label="Weighted cells p(y) × C(y,a)" values={result.contributions} rowNames={['true A', 'true B', 'true C']} colNames={['action A', 'action B', 'action C']} /></Pair>
    <Arrow>Sum each column ↓</Arrow><Bars title="Expected action cost" values={result.risk} max={10} names={['action A', 'action B', 'action C']} />
    <p>Minimum-cost action {letters[result.selected]}; tied actions: {result.ties.map(i => letters[i]).join(', ')}.</p>
    <Controls reset={() => setMiss(12)}><Range label="Cost of action A when truth is C" value={miss} min={0} max={20} step={1} onChange={setMiss} /></Controls>
  </Figure>;
}

export function DecisionCostRegions() {
  const [review, setReview] = useState(1);
  const p = [.6, .3, .1];
  const polygons = costRegions(costs, review);
  const risks = expectedCosts(p, costs, review);
  return <Figure id="D27" caption="Exact half-plane intersections for the same constructed cost matrix. Region colour identifies the cheapest action. A perfect-review action has fixed cost; this illustration is separate from the fallible measured fallback. Boundary ties choose the first listed action.">
    <Pair><ProbabilityTriangle p={p} regions={<g>{polygons.map((polygon, i) => <polygon key={i} points={polygon.map(point => simplexPoint(point).join(',')).join(' ')} fill={colors[i]} fillOpacity=".45" stroke="#aaa" strokeWidth=".5" />)}</g>} />
      <Bars title="Risk at fixed p = [.6, .3, .1]" values={risks.risk} names={['action A', 'action B', 'action C', 'perfect review']} max={10} /></Pair>
    <div className="typed-key">{['action A', 'action B', 'action C', 'perfect review'].map((name, i) => <span key={name} style={{ color: colors[i] }}>{name}</span>)}</div>
    <p>Current chosen action: {['A', 'B', 'C', 'perfect review'][risks.selected]}.</p>
    <Controls reset={() => setReview(1)}><Range label="Perfect review cost" value={review} min={0} max={10} step={.1} onChange={setReview} /></Controls>
  </Figure>;
}

export function DecisionRouting() {
  const state = useObservations();
  const [diagnostic, setDiagnostic] = useState(false);
  const [threshold, setThreshold] = useState(.6);
  const [index, setIndex] = useState(0);
  if (!state.data) return <Figure id="D28" caption="Actual paired test routing"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const primary = 1 - data.routing.expected_fallback_cost / 10;
  const cutoff = diagnostic ? threshold : primary;
  const result = routeRows(data.calibration.methods['seed-17'].test_calibrated.probabilities,
    data.calibration.methods.laya.test_raw.probabilities, data.test.map(row => row.target), cutoff);
  const row = result.rows[index];
  return <Figure id="D28" caption="Every item pays for the cheap call (cost baseline 0 here). Fallback calls add 0.5; any final error adds 10. This uses actual paired errors, not an oracle fallback. The exact primary cutoff comes from calibration; other thresholds are diagnostics.">
    <p>120 saved test IDs → act cheaply iff pmax &gt; {fmt(cutoff, 7)}. Equality goes to fallback.</p>
    <div className="typed-micro-grid">{result.rows.map((r, i) => <span key={data.test[i].id} title={`${data.test[i].id}: ${r.act ? 'cheap' : 'fallback'}, ${r.correct ? 'correct' : 'wrong'}`}
      style={{ background: r.act ? colors[0] : colors[2], outline: i === index ? '2px solid white' : 'none' }}>{r.correct ? '·' : '×'}</span>)}</div>
    <div className="typed-key"><span style={{ color: colors[0] }}>blue = cheap</span><span style={{ color: colors[2] }}>purple = fallback</span><span>× = final error</span></div>
    <Pair><div><Arrow>{result.cheapCount} cheap</Arrow><p>{result.cheapWrong} wrong cheap decisions</p></div><div><Arrow>{120 - result.cheapCount} fallback</Arrow><p>{result.fallbackWrong} wrong fallback decisions</p></div></Pair>
    <p>Final errors {result.wrong}/120; mean cost {fmt(result.meanCost, 6)}; cheap selective risk {fmt(result.selectiveRisk)}.</p>
    <p>{data.test[index].id}: true {letters[data.test[index].target]}, cheap {letters[row.cheap]}, fallback {letters[row.fallback]}, selected {letters[row.predicted]}, cost {row.cost}.</p>
    <Controls reset={() => { setDiagnostic(false); setThreshold(.6); setIndex(0); }}><Check label="Explore diagnostic threshold" checked={diagnostic} onChange={setDiagnostic} />
      {diagnostic && <Range label="Diagnostic pmax threshold" value={threshold} step={.01} onChange={setThreshold} />}
      <Range label="Inspect paired test row" value={index} min={0} max={119} step={1} onChange={setIndex} /></Controls>
  </Figure>;
}

export function DecisionRoutingEvidence() {
  const state = useObservations();
  const [method, setMethod] = useState('seed-17');
  if (!state.data) return <Figure id="D29" caption="Recorded policy costs and uncertainty"><EvidenceState state={state} /></Figure>;
  const data = state.data.routing.methods[method];
  return <Figure id="D29" caption="All plotted threshold points are saved diagnostic evaluations on this same test cohort. Joining dots is a visual guide; no winner is selected from the curve. The interval describes mean cost of the predeclared policy, not a paired policy-difference interval.">
    <Plot series={['raw', 'calibrated'].map((key, i) => ({ name: key, values: data[key].diagnostic_thresholds.map(row => [row.coverage, row.mean_cost]), color: colors[i], markers: true }))}
      xLabel="fraction handled cheaply" yLabel="actual mean decision cost" xDomain={[0, 1]} yDomain={[0, 10.5]} />
    <Table caption="Predeclared rule and endpoint policies" headers={['Probabilities', 'Policy', 'Cheap N', 'Final wrong', 'Mean cost', '95% mean-cost interval']} rows={['raw', 'calibrated'].flatMap(key => ['primary_rule', 'all_cheap', 'all_fallback'].map(name => {
      const row = data[key][name]; return [key, name.replaceAll('_', ' '), row.cheap_count, row.wrong_final, row.mean_cost, row.mean_cost_percentile_95?.map(x => fmt(x)).join(' to ') || 'not recorded'];
    }))} />
    <Controls reset={() => setMethod('seed-17')}><Select label="Recorded cheap predictor" value={method} options={methods.slice(0, 4).map(x => [x, x])} onChange={setMethod} /></Controls>
  </Figure>;
}
