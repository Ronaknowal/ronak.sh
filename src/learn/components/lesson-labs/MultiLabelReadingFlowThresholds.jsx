import { useMemo, useState } from 'react';
import { labelIdentities } from '../../data/multilabel-reading-flow-foundation-models.js';
import { pooledThresholdScores, pooledThresholdTrace, pooledThresholdTruth, referenceThresholdScores, thresholdStaircase, thresholdTrace, weightedProbabilityTrace } from '../../data/multilabel-reading-flow-threshold-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';

export function ThresholdTiesFigure() {
  const [scores, setScores] = useState(referenceThresholdScores);
  const [threshold, setThreshold] = useState(.5);
  const [selected, setSelected] = useState(1);
  const [revision, setRevision] = useState(0);
  const state = thresholdTrace(scores, threshold);
  const staircase = useMemo(() => thresholdStaircase(scores), [scores]);
  const x = value => 75 + value / 1.01 * 525;
  const y = value => 288 - 220 * value;
  return <MultiLabelFigure job="D17" description="Six real observation scores cross a >= cutoff together when scores tie; exact staircase endpoints preserve equality">
    <MultiLabelCanvas width={680} height={400} title="One vertical probability rail per observation; the cutoff includes a score at equality">
      {[0, .5, 1].map(value => <g key={value}><path d={`M59,${y(value)} H635`} stroke="#49444f" /><text x={16} y={y(value) + 6}>{value}</text></g>)}
      {state.rows.map(row => <g key={row.id}>
        <path d={`M${93 + row.id * 101},${y(0)} V${y(1)}`} stroke="#77707f" />
        <circle cx={93 + row.id * 101} cy={y(row.score)} r={11} fill={row.truth ? '#f0b45b' : '#111114'} stroke="#f0b45b" strokeWidth={selected === row.id ? 3 : 1} />
        {row.selected && <circle cx={93 + row.id * 101} cy={y(row.score)} r={17} fill="none" stroke="#fff" />}
        <text x={93 + row.id * 101} y={328} textAnchor="middle">R{row.id}</text>
        <text x={93 + row.id * 101} y={360} textAnchor="middle">y={row.truth}</text>
        <text x={93 + row.id * 101} y={389} textAnchor="middle">s={number(row.score)}</text>
      </g>)}
      <path d={`M59,${y(threshold)} H635`} stroke="#fff" strokeWidth={2} />
      <text x={270} y={37}>cutoff {number(threshold)} · selected: white rings</text>
    </MultiLabelCanvas>
    <MultiLabelCanvas width={680} height={375} title="F1 staircase uses closed exact-score points and open right-hand values; cutoff range extends to 1.01">
      <text x={15} y={35}>F1</text>
      <path d="M75,68 V288 H625" stroke="#aaa3b1" fill="none" />
      {[0, .5, 1].map(value => <text key={value} x={18} y={y(value) + 6}>{value}</text>)}
      {staircase.edges.map(edge => <g key={edge.left}>
        <path d={`M${x(edge.left)},${y(edge.f1)} H${x(edge.right)}`} stroke="#f0b45b" strokeWidth={2} />
        <circle cx={x(edge.left)} cy={y(edge.f1)} r={5} fill="#111114" stroke="#f0b45b" />
      </g>)}
      {staircase.points.map(point => <circle key={point.threshold} cx={x(point.threshold)} cy={y(point.f1)} r={4} fill="#f0b45b" />)}
      <path d={`M${x(threshold)},58 V302`} stroke="#fff" strokeDasharray="4 4" />
      {[0, .2, .4, .55, .8, .9, 1.01].map(value => <text key={value} x={x(value)} y={330} textAnchor="middle">{value}</text>)}
      <text x={195} y={367}>cutoff → · points at equality are filled</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity label="Decision cutoff" value={threshold} onChange={setThreshold} min={0} max={1.01} step={.01} revision={revision} />
      <fieldset className="mlf-quantity"><legend>Observation score editor</legend>
        <label>Inspected observation<select aria-label="Threshold score observation" value={selected} onChange={event => setSelected(Number(event.target.value))}>{state.rows.map(row => <option key={row.id} value={row.id}>R{row.id} · y={row.truth}</option>)}</select></label>
        <MultiLabelQuantity label="Inspected observation score" value={scores[selected]} min={0} max={1} step={.01} revision={`${revision}:${selected}`} onChange={value => setScores(previous => previous.map((score, id) => id === selected ? value : score))} />
      </fieldset>
      <button type="button" onClick={() => { setScores(referenceThresholdScores()); setThreshold(.5); setSelected(1); setRevision(value => value + 1); }}>Reset scores and cutoff</button>
    </FlowControls>
    <FlowReadout>At cutoff {number(threshold)}, selected observations are {state.rows.filter(row => row.selected).map(row => `R${row.id}`).join(', ') || 'none'}. TP {state.tp}, FP {state.fp}, FN {state.fn}; F1 {number(state.f1)}. Equality is included, so tied observations enter or leave together.</FlowReadout>
  </MultiLabelFigure>;
}

export function PooledCutoffsFigure() {
  const [thresholds, setThresholds] = useState([.5, .5]);
  const [evaluation, setEvaluation] = useState('micro');
  const [revision, setRevision] = useState(0);
  const state = pooledThresholdTrace(thresholds, evaluation);
  return <MultiLabelFigure job="D18" description="Two output-specific score rails feed either a common count ratio or two per-label ratios">
    <div className="mlf-columns">{labelIdentities.slice(0, 2).map((label, output) => <div key={label.id}>
      <MultiLabelCanvas width={360} height={360} title={`${label.id}: four scores and truths on a common 0–1 scale`}>
        <text x={15} y={28} style={{ color: label.color }}>{label.id} · {label.name}</text>
        {[0, .5, 1].map(value => <g key={value}><text x={15} y={280 - 210 * value + 6}>{value}</text><path d={`M53,${280 - 210 * value} H347`} stroke="#49444f" /></g>)}
        {pooledThresholdScores.map((row, observation) => <g key={observation}>
          <path d={`M${65 + 84 * observation},70 V280`} stroke="#77707f" />
          <circle cx={65 + 84 * observation} cy={280 - 210 * row[output]} r={12} stroke={label.color} fill={pooledThresholdTruth[observation][output] ? label.color : '#111114'} />
          {state.predictions[observation][output] === 1 && <circle cx={65 + 84 * observation} cy={280 - 210 * row[output]} r={18} stroke="#fff" fill="none" />}
          <text x={65 + 84 * observation} y={316} textAnchor="middle">R{observation}</text><text x={65 + 84 * observation} y={348} textAnchor="middle">{row[output]}</text>
        </g>)}
        <path d={`M53,${280 - 210 * thresholds[output]} H347`} stroke="#fff" strokeWidth={2} />
      </MultiLabelCanvas>
    </div>)}</div>
    <MultiLabelCanvas width={820} height={255} title="Count TP/FP/FN before division for micro; divide separately before averaging for macro">
      {state.columns.map((column, output) => <g key={output} style={{ color: labelIdentities[output].color }}>
        <text x={16} y={53 + 105 * output}>{labelIdentities[output].id}: TP {column.tp}, FP {column.fp}, FN {column.fn}</text>
        <path d={`M270,${47 + 105 * output} H358 ${evaluation === 'micro' ? `V98 H419` : 'H419'}`} stroke={labelIdentities[output].color} fill="none" />
        {evaluation === 'macro' && <><text x={435} y={53 + 105 * output}>F1 {number(column.f1)}</text><path d={`M584,${47 + 105 * output} H653 V98`} stroke={labelIdentities[output].color} fill="none" /></>}
      </g>)}
      <circle cx={evaluation === 'micro' ? 439 : 653} cy={98} r={20} stroke="#eee8f1" fill="#111114" />
      <text x={evaluation === 'micro' ? 439 : 653} y={104} textAnchor="middle">{evaluation === 'micro' ? 'Σ' : '÷2'}</text>
      <text x={16} y={232}>{evaluation === 'micro' ? `pooled TP ${state.total.tp}, FP ${state.total.fp}, FN ${state.total.fn} → 2TP/(2TP+FP+FN)` : 'two per-output F1 values receive equal weight'} = {number(state.f1)}</text>
    </MultiLabelCanvas>
    <FlowControls>
      {thresholds.map((value, output) => <MultiLabelQuantity key={output} label={`${labelIdentities[output].id} cutoff`} value={value} min={0} max={1} step={.01} revision={revision} onChange={next => setThresholds(previous => previous.map((cutoff, column) => column === output ? next : cutoff))} />)}
      <label>Evaluation<select aria-label="Cutoff evaluation" value={evaluation} onChange={event => setEvaluation(event.target.value)}><option value="micro">micro · pool first</option><option value="macro">macro · divide first</option></select></label>
      <button type="button" onClick={() => { setThresholds([.5, .5]); setEvaluation('micro'); setRevision(value => value + 1); }}>Reset both cutoffs</button>
    </FlowControls>
    <FlowReadout>Cutoffs A={number(thresholds[0])}, B={number(thresholds[1])} give TP {state.total.tp}, FP {state.total.fp}, FN {state.total.fn}. Micro F1 is {number(state.micro.f1)} and macro F1 is {number(state.macro.f1)}; the selected objective is {evaluation}. The four-row illustration is distinct from thresholds.py’s six-row recorded fixture.</FlowReadout>
  </MultiLabelFigure>;
}

export function WeightedOddsFigure() {
  const [p, setP] = useState(.2);
  const [weight, setWeight] = useState(4);
  const [revision, setRevision] = useState(0);
  const state = weightedProbabilityTrace(p, weight);
  return <MultiLabelFigure job="D19" description="Positive BCE weighting rescales ideal conditional odds, and its exact algebraic inverse restores the original probability">
    <MultiLabelCanvas width={930} height={345} title="Probability-to-odds and weighted-odds-to-probability operations expose each numerical operand">
      <circle cx={74} cy={94} r={24} stroke="#f0b45b" fill="#111114" /><text x={74} y={100} textAnchor="middle">p</text>
      <text x={15} y={147}>{number(p)}</text>
      <path d="M99,94 H192 M146,94 V239 H192" stroke="#eee8f1" fill="none" />
      <text x={211} y={70}>odds p/(1−p)</text><text x={211} y={108}>{number(state.odds)}</text>
      <text x={211} y={217}>× positive weight {number(weight)}</text><text x={211} y={253}>weighted odds {number(state.weightedOdds)}</text>
      <path d="M484,239 H554 V94 H625" stroke="#75adff" fill="none" />
      <circle cx={650} cy={94} r={24} stroke="#75adff" fill="#111114" /><text x={650} y={100} textAnchor="middle">q</text>
      <text x={690} y={102}>{number(state.q)}</text>
      <text x={574} y={172}>q = cp/(1−p+cp)</text>
      <path d="M650,119 V270 H545" stroke="#75adff" fill="none" />
      <text x={574} y={302}>inverse → p={number(state.recovered)}</text>
      <text x={15} y={334}>ideal weighted-risk optimum; a cost decision threshold is a later operation</text>
    </MultiLabelCanvas>
    <MultiLabelTable caption="Exact probability endpoints use limits without evaluating infinite odds"><thead><tr><th>Original p</th><th>Weighted q</th><th>Inverse</th></tr></thead><tbody><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></tbody></MultiLabelTable>
    <FlowControls>
      <MultiLabelQuantity label="Original event probability p" value={p} min={.001} max={.999} step={.001} revision={revision} onChange={setP} />
      <MultiLabelQuantity label="Positive BCE weight c" value={weight} min={.1} max={10} step={.1} revision={revision} onChange={setWeight} />
      <button type="button" onClick={() => { setP(.2); setWeight(4); setRevision(value => value + 1); }}>Reset ideal odds example</button>
    </FlowControls>
    <FlowReadout>Original p={number(p)} has odds {number(state.odds)}. Weight c={number(weight)} gives odds {number(state.weightedOdds)}, hence q={number(state.q)}. The inverse recovers p={number(state.recovered)} under this exact representable weighted conditional-risk model; it does not establish empirical calibration of an arbitrary fitted score.</FlowReadout>
  </MultiLabelFigure>;
}
