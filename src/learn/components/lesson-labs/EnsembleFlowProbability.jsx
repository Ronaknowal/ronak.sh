import { useState } from 'react';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { calibrationGroups, savedMapCell, savedMapLabels, thresholdActionState, probabilityColour } from '../../data/ensemble-probability-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity } from './EnsembleFlowControls.jsx';
import './ensemble-flow-probability.css';

const memberA = '#7fc9ba', memberB = '#b2b7e1', amber = '#e8bb60';
const number = value => ensembleNumber(value, 8);
const ruleNames = { forecastA: 'Member A', forecastB: 'Member B', average: 'Equal mean' };
const colours = { forecastA: memberA, forecastB: memberB, average: amber };

function TableRegion({ label, children }) {
  return <div className="ensemble-probability-table" tabIndex={0} role="region" aria-label={`${label}; pan if needed`}>{children}</div>;
}

export function ExactCalibrationLawFigure() {
  const state = calibrationGroups();
  return <EnsembleFlowFigure job="D36" title="The mean changes which equally likely states share a forecast">
    <EnsembleFlowCanvas title="Four signal states have equal one-quarter masses, with member forecasts defined by row and column brackets" width={700} height={490}>
      <text x={16} y={25}>Exact probability law: each state S1–S4 has mass 1/4; event chances are not observed labels</text>
      <text x={209} y={61} fill={memberB}>B forecast .25</text><text x={441} y={61} fill={memberB}>B forecast .75</text>
      <path d="M202,69 H402 M436,69 H636" fill="none" stroke={memberB} />
      {state.cases.map((row, index) => {
        const x = 202 + (index % 2) * 234, y = 84 + Math.floor(index / 2) * 171;
        return <g key={row.id}>
          <rect x={x} y={y} width={200} height={143} fill="#17171b" stroke="#92929b" />
          <text x={x + 12} y={y + 26}>{row.id} · mass 1/4</text>
          <text x={x + 12} y={y + 57}>true chance {number(row.trueChance)}</text>
          <text x={x + 12} y={y + 88} fill={amber}>mean forecast {number(row.average)}</text>
          <rect x={x + 12} y={y + 108} width={176} height={18} fill="#25252b" />
          <rect x={x + 12} y={y + 108} width={176 * row.trueChance} height={18} fill={amber} />
        </g>;
      })}
      <path d="M184,84 V227 M184,255 V398" fill="none" stroke={memberA} />
      <text x={16} y={154} fill={memberA}>A forecast .25</text><text x={16} y={324} fill={memberA}>A forecast .75</text>
      <text x={16} y={443}>Chance bar reference: empty 0, half .5, full 1. Signal labels A/B are member identities.</text>
      <text x={16} y={476}>A groups rows; B groups columns; the mean groups equal diagonal-sum forecasts.</text>
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas title="Each forecast group joins the actual state masses and averages their true event chances" width={1120} height={434}>
      <text x={16} y={25}>Join equal forecasts → sum event mass → divide by group mass</text>
      {state.groups.map((group, index) => {
        const y = 66 + index * 48;
        return <g key={`${group.rule}-${group.forecast}`}>
          <text x={16} y={y} fill={colours[group.rule]}>{ruleNames[group.rule]} p={group.forecast}</text>
          {group.members.map((row, position) => <g key={row.id}>
            <rect x={251 + position * 82} y={y - 21} width={77} height={30} fill="#17171b" stroke={colours[group.rule]} />
            <text x={289 + position * 82} y={y} textAnchor="middle">{row.id}:1/4</text>
          </g>)}
          <path d={`M${251 + group.members.length * 82},${y - 6} H492`} stroke={colours[group.rule]} />
          <path d={`M485,${y - 10} L492,${y - 6} L485,${y - 2}`} stroke={colours[group.rule]} fill="none" />
          <text x={511} y={y}>[{group.members.map(row => `(1/4×${row.trueChance})`).join('+')}] ÷ {group.mass} = {group.chance}</text>
          <text x={962} y={y} fill={colours[group.rule]}>{group.calibrated ? 'matches p' : 'differs from p'}</text>
        </g>;
      })}
      <text x={16} y={427}>Mean .25→true 0; .5→true .5; .75→true 1. Its lower expected Brier risk does not make it calibrated.</text>
    </EnsembleFlowCanvas>
    <TableRegion label="Exact law calibration masses and risks"><table><caption>Same exact distribution; different grouping and expected Brier risk</caption><thead><tr><th>Rule</th><th>Forecast</th><th>States</th><th>Group mass</th><th>True event chance</th><th>Calibrated group?</th></tr></thead>
      <tbody>{state.groups.map(group => <tr key={`${group.rule}-${group.forecast}`}><th scope="row" style={{ color: colours[group.rule] }}>{ruleNames[group.rule]}</th><td>{group.forecast}</td><td>{group.members.map(row => row.id).join(', ')}</td><td>{group.mass}</td><td>{group.chance}</td><td>{group.calibrated ? 'yes' : 'no'}</td></tr>)}</tbody>
    </table></TableRegion>
    <p>A risk={state.risk.forecastA}=3/16, B risk={state.risk.forecastB}=3/16, mean risk={state.risk.average}=5/32.
      Each term is mass×[chance×(1−forecast)²+(1−chance)×forecast²], summing both possible outcomes of its state.</p>
  </EnsembleFlowFigure>;
}

export function SavedProbabilityFieldFigure() {
  const [model, setModel] = useState('stack');
  const [horizontal, setHorizontal] = useState(16);
  const [vertical, setVertical] = useState(12);
  const [revision, setRevision] = useState(0);
  const state = savedMapCell(model, horizontal, vertical);
  const px = value => 104 + (value + 1.5) * 200;
  const py = value => 683 - (value + 1.5) * 200;
  return <EnsembleFlowFigure job="D37" title="Read an observed cell from five saved probability fields, without retraining">
    <EnsembleFlowCanvas title={`${savedMapLabels[model]} saved 25 by 25 field, all 625 cells, 72 test marks and selected grid query`} width={850} height={828}>
      <text x={16} y={25}>{savedMapLabels[model]} · selected x₁={state.x}, x₂={state.y}; saved P(1)={number(state.probability)}</text>
      <text x={104} y={60}>vertical feature x₂; equal physical scale on both axes</text>
      {state.selected.probabilities.map((probability, index) => {
        const column = index % 25, row = Math.floor(index / 25), x = px(state.map.coordinates[column]), y = py(state.map.coordinates[row]);
        return <rect key={index} x={Math.max(104, x - 12.5)} y={Math.max(83, y - 12.5)} width={column === 0 || column === 24 ? 12.5 : 25}
          height={row === 0 || row === 24 ? 12.5 : 25} fill={probabilityColour(probability)} data-probability={probability} data-grid-index={index} />;
      })}
      {state.map.testPoints.map((point, index) => <circle key={index} cx={px(point.x)} cy={py(point.y)} r={5}
        fill={point.label ? amber : '#17171b'} stroke={point.label ? '#17171b' : 'white'} strokeWidth={1.5} data-test-row={index} data-class={point.label} />)}
      <path d={`M${px(state.x) - 9},${py(state.y)} H${px(state.x) + 9} M${px(state.x)},${py(state.y) - 9} V${py(state.y) + 9}`} stroke="white" strokeWidth={2.5} />
      <path d="M104,83 V683 H704" stroke="white" fill="none" />
      {[-1.5, -.75, 0, .75, 1.5].map(value => <g key={value}>
        <text x={px(value)} y={713} textAnchor="middle">{value}</text><text x={86} y={py(value) + 6} textAnchor="end">{value}</text>
      </g>)}
      <text x={404} y={744} textAnchor="middle">horizontal feature x₁</text>
      {[0, .25, .5, .75, 1].map((probability, index) => <g key={probability}><rect x={104 + index * 105} y={763} width={88} height={20} fill={probabilityColour(probability)} />
        <text x={148 + index * 105} y={807} textAnchor="middle">P(1)={probability}</text></g>)}
    </EnsembleFlowCanvas>
    <p>All cells are local approximations from their saved grid centers. Test class 0 is hollow, class 1 filled amber; the white cross marks the observed query.
      The blue→amber magnitude scale stays 0–1 for every model. Neither its color nor a selected cell estimates a new query between grid points.</p>
    <div className="ensemble-flow-controls"><label>Saved probability field<select aria-label="Saved probability field" value={model} onChange={event => setModel(event.target.value)}>{Object.entries(savedMapLabels).map(([name, label]) => <option key={name} value={name}>{label}</option>)}</select></label>
      <EnsembleQuantity label="Observed horizontal index" value={horizontal} onChange={setHorizontal} min={0} max={24} integer revision={revision} />
      <EnsembleQuantity label="Observed vertical index" value={vertical} onChange={setVertical} min={0} max={24} integer revision={revision} />
      <button type="button" onClick={() => { setModel('stack'); setHorizontal(16); setVertical(12); setRevision(value => value + 1); }}>Reset observed probability field</button></div>
    <p aria-live="polite">Observed grid[{horizontal},{vertical}] → ({state.x},{state.y}); {savedMapLabels[model]} P(class 1)={number(state.probability)}.
      Equal-cost argmax {state.probability > .5 ? 'class 1' : 'class 0'}, with a tie choosing class 0. This is a saved 216/72/72 circles experiment, separate from the arbitrary WDBC forward below.</p>
    <TableRegion label="All five unchanged saved model reports"><table><caption>Same saved cell, all five models and retained validation/test outcomes</caption><thead><tr><th>Rule</th><th>Observed query P(1)</th><th>Validation log loss</th><th>Test log loss</th><th>Test Brier</th></tr></thead>
      <tbody>{state.comparisons.map(row => <tr key={row.model}><th scope="row">{savedMapLabels[row.model]}</th><td>{number(row.probability)}</td><td>{number(row.report.validationLogLoss)}</td><td>{number(row.report.testLogLoss)}</td><td>{number(row.report.testBrier)}</td></tr>)}</tbody>
    </table></TableRegion>
    <p>The original validation winner remains {savedMapLabels[state.map.selected]}. Its retained reports, all 3125 cells and all 72 test marks remain unchanged.</p>
  </EnsembleFlowFigure>;
}

export function ThresholdCostFigure() {
  const [threshold, setThreshold] = useState(.3);
  const [missedCost, setMissedCost] = useState(4);
  const [revision, setRevision] = useState(0);
  const state = thresholdActionState(threshold, missedCost);
  const px = probability => 108 + probability * 810;
  return <EnsembleFlowFigure job="D38" title="The same probability ties cause actual actions and different error costs">
    <EnsembleFlowCanvas title="Four declared validation probabilities, inclusive threshold, observed binary targets and per-row cost contributions" width={1230} height={360}>
      <text x={16} y={25}>Illustrative choice data p=[.1,.3,.3,.9], y=[0,1,0,1] · positive exactly when p≥t</text>
      <path d="M108,65 H918" stroke="#92929b" />
      {[0, .1, .3, .5, .9, 1].map(value => <g key={value}><path d={`M${px(value)},60 V70`} stroke="#92929b" /><text x={px(value)} y={96} textAnchor="middle">{value}</text></g>)}
      <path d={`M${px(threshold)},50 V292`} stroke="white" strokeDasharray="5 4" />
      {state.rows.map((row, index) => <g key={row.id}>
        <text x={16} y={139 + index * 41}>{row.id} y={row.target}</text>
        <circle cx={px(row.probability)} cy={133 + index * 41} r={7} fill={row.target ? amber : '#17171b'} stroke={row.target ? amber : 'white'} />
        <path d={`M${px(row.probability) + 10},${133 + index * 41} H957`} stroke={row.positive ? memberA : memberB} />
        <text x={975} y={139 + index * 41}>{row.positive ? 'positive' : 'negative'} · {row.outcome.toUpperCase()} · cost {number(row.cost)}</text>
      </g>)}
      <text x={16} y={320}>t={String(threshold)}; FP {state.counts.fp}×1 + FN {state.counts.fn}×{number(missedCost)} = total {number(state.cost)}</text>
      <text x={16} y={351}>Choice cost changes the action criterion; it does not fit or calibrate the probability scores.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Positive-action threshold" value={threshold} onChange={setThreshold} min={0} max={1} step={.05} revision={revision} />
      <EnsembleQuantity label="Missed-event cost" value={missedCost} onChange={setMissedCost} min={0} max={10} step={.5} revision={revision} />
      <button type="button" onClick={() => { setThreshold(.3); setMissedCost(4); setRevision(value => value + 1); }}>Reset illustrative action cost</button>
    </div>
    <p aria-live="polite">TN {state.counts.tn}, FP {state.counts.fp}, FN {state.counts.fn}, TP {state.counts.tp}; cost={number(state.cost)}.
      At t=.3 both equal .3 scores receive positive actions. This tiny choice fixture is separate from all retained experiment thresholds and costs.</p>
    <TableRegion label="Actual confusion matrix for current illustrative threshold"><table><caption>True rows × predicted columns; current threshold and declared inclusive tie</caption><thead><tr><th>Truth</th><th>Predicted 0</th><th>Predicted 1</th></tr></thead>
      <tbody><tr><th scope="row">True 0</th><td>{state.counts.tn}</td><td>{state.counts.fp}</td></tr><tr><th scope="row">True 1</th><td>{state.counts.fn}</td><td>{state.counts.tp}</td></tr></tbody>
    </table></TableRegion>
    <EnsembleFlowCanvas title="Calibration fits parameters on separate N4 calibration identities before either probability assessment or threshold choice" width={1320} height={239}>
      <text x={16} y={25}>Separate N4 calibration boundary: IDs 5,13,21,29,37,45,53,61,69,77,85,93 teach the link</text>
      <g fill="none" stroke={memberB}><rect x={16} y={56} width={378} height={114} /><path d="M394,106 H439" /><path d="M432,102 L439,106 L432,110" /></g>
      <text x={28} y={83}>Frozen whole-rule scores s_C and y_C</text><text x={28} y={113}>D_C=[1,s_C]; hard binary targets</text><text x={28} y={143}>Saved base and meta arrays stay fixed</text>
      <g fill="none" stroke={amber}><rect x={439} y={56} width={425} height={114} /><path d="M864,106 H909" /><path d="M902,102 L909,106 L902,110" /></g>
      <text x={451} y={83}>Fit θ: mean log loss + .01||θ||²/2</text><text x={451} y={113}>both intercept and slope penalized</text><text x={451} y={143}>gradient Dᵀ(p−y)/12+.01θ → saved θ</text>
      <rect x={909} y={56} width={390} height={114} fill="none" stroke={memberA} />
      <text x={921} y={83}>Read saved scores on 24 held IDs</text><text x={921} y={113}>σ(θ₀+θ₁s) → assess probability quality</text><text x={921} y={143}>Held targets never enter θ fitting</text>
      <text x={16} y={220}>Threshold choice needs its own legal outcome boundary. The tiny t/cost controls above perform neither calibration nor a new N4 fit.</text>
    </EnsembleFlowCanvas>
  </EnsembleFlowFigure>;
}
