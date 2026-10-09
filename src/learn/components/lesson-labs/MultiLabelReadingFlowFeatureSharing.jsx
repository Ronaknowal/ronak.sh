import { useState } from 'react';
import { sharedFeatureShrinkage } from '../../data/multioutput-models.js';
import { generalRowProximalTrace, proximalHandInputs } from '../../data/multilabel-reading-flow-sharing-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';

const colors = ['#f0b45b', '#75adff'];
const featureColors = ['#ef8ca4', '#bc9aff'];
function SmallMatrix({ matrix, x, y, color = '#c7b1d3', rowColors = null, columnColors = null }) {
  return <g>{matrix.map((row, i) => row.map((value, j) => <g key={i + '-' + j}><rect x={x + j * 111} y={y + i * 46} width={111} height={46} fill="#111114" stroke={rowColors?.[i] || color} /><text x={x + j * 111 + 55} y={y + i * 46 + 29} textAnchor="middle" style={{ fill: columnColors?.[j] || '#eee8f0' }}>{number(value)}</text></g>))}</g>;
}

export function WholeFeatureRowFigure() {
  const [first, setFirst] = useState(3);
  const [second, setSecond] = useState(4);
  const [penalty, setPenalty] = useState(2);
  const [revision, setRevision] = useState(0);
  const state = sharedFeatureShrinkage({ first, second, penalty });
  const point = values => ({ x: 180 + values[0] * 24, y: 292 - values[1] * 24 });
  const original = point(state.initial), grouped = point(state.grouped), separate = point(state.separate);
  return <MultiLabelFigure job="D48" description="A whole coefficient row shrinks along one direction while independent coordinate thresholds can change that direction">
    <MultiLabelCanvas width={736} height={633} title="Supplied proximal row z, joint norm gate and two coefficient destinations; no correlated-design fitting claim">
      <text x={16} y={30}>A row means one feature across two output columns: U0 amber, U1 blue.</text>
      <text x={397} y={79}>Supplied feature-by-output Z</text><text x={452} y={112} style={{ fill: colors[0] }}>U0</text><text x={566} y={112} style={{ fill: colors[1] }}>U1</text>
      <SmallMatrix matrix={[state.initial, [0, 0]]} x={397} y={124} columnColors={colors} /><text x={397} y={250}>First whole feature row selected</text>
      <path d="M36,292 H324 M180,148 V436" stroke="#b7a3c1" fill="none" />
      {[-6, -3, 3, 6].map(value => <g key={value}><path d={'M' + (180 + value * 24) + ',287 V297 M175,' + (292 - value * 24) + ' H185'} stroke="#b7a3c1" fill="none" /><text x={180 + value * 24} y={321} textAnchor="middle">{value}</text><text x={168} y={298 - value * 24} textAnchor="end">{value}</text></g>)}
      <text x={180} y={473} textAnchor="middle">U0 coefficient −6…6</text><text x={16} y={125}>U1 coefficient −6…6</text>
      <path d={'M180,292 L' + original.x + ',' + original.y} stroke="#d5c3df" fill="none" strokeWidth={2} />
      <path d={'M180,292 L' + grouped.x + ',' + grouped.y} stroke="#f0b45b" fill="none" strokeWidth={4} />
      <circle cx={original.x} cy={original.y} r={8} fill="#111114" stroke="#d5c3df" /><text x={original.x + 13} y={original.y - 13}>Z</text>
      <circle cx={grouped.x} cy={grouped.y} r={7} fill="#f0b45b" /><text x={grouped.x + 13} y={grouped.y + 27} style={{ fill: '#f0b45b' }}>G</text>
      <rect x={separate.x - 6} y={separate.y - 6} width={12} height={12} fill="#75adff" /><text x={separate.x - 16} y={separate.y + 27} style={{ fill: '#75adff' }}>S</text>
      <text x={397} y={295}>||z||₂ = {number(state.norm)}</text><path d="M452,312 V346" stroke="#c7b1d3" />
      <circle cx={452} cy={374} r={28} fill="#111114" stroke="#c7b1d3" /><text x={452} y={381} textAnchor="middle">gate</text>
      <text x={500} y={363}>λ={number(penalty)}</text><text x={500} y={395}>factor {number(state.multiplier)}</text><path d="M452,402 V440" stroke="#f0b45b" />
      <text x={397} y={476} style={{ fill: '#f0b45b' }}>G = [{state.grouped.map(value => number(value)).join(', ')}]</text>
      <text x={397} y={520} style={{ fill: '#75adff' }}>S = [{state.separate.map(value => number(value)).join(', ')}]</text>
      <text x={16} y={573}>
        <tspan x={16}>{'G: whole-row norm threshold. '}</tspan>
        <tspan x={16} dy={26}>S: coordinate-wise soft threshold. Zero norm avoids 0/0.</tspan>
      </text>
    </MultiLabelCanvas>
    <FlowControls><MultiLabelQuantity label="Proximal row U0" value={first} min={-6} max={6} step={.5} revision={revision} onChange={setFirst} /><MultiLabelQuantity label="Proximal row U1" value={second} min={-6} max={6} step={.5} revision={revision} onChange={setSecond} /><MultiLabelQuantity label="Whole-row threshold λ" value={penalty} min={0} max={8} step={.25} revision={revision} onChange={setPenalty} /><button type="button" onClick={() => { setFirst(3); setSecond(4); setPenalty(2); setRevision(value => value + 1); }}>Reset feature row</button></FlowControls>
    <FlowReadout>z=[{first}, {second}] has norm {number(state.norm)}. The joint multiplier is {number(state.multiplier)}, giving G=[{state.grouped.map(value => number(value)).join(', ')}]; separate coordinate thresholds give S=[{state.separate.map(value => number(value)).join(', ')}]. At zero norm or λ at least the norm, the entire group is zero. This is the exact proximal/orthonormal-design operation, not a one-step solution for correlated X.</FlowReadout>
  </MultiLabelFigure>;
}

export function GeneralDesignProximalFigure() {
  const [iterations, setIterations] = useState(0);
  const [alpha, setAlpha] = useState(.2);
  const [revision, setRevision] = useState(0);
  const state = generalRowProximalTrace(iterations, alpha);
  return <MultiLabelFigure job="D49" description="The actual three-row design maps current weights through XW−Y, X-transpose residual gradient, gradient step and whole-row threshold before the next iterate">
    <MultiLabelCanvas width={1080} height={739} title="Fixed hand design X=Y, bounded genuine proximal updates; every displayed matrix is computed from the selected iterate">
      <text x={16} y={30}>η=.5; λ_max(XᵀX/3)=1. Current W at iteration {iterations}; α={number(alpha)}.</text>
      <text x={16} y={54}>Output columns U0 amber/U1 blue; feature-row outlines/gates r0 rose/r1 violet.</text>
      <text x={16} y={80}>X = Y · 3×2</text><SmallMatrix matrix={proximalHandInputs} x={16} y={99} />
      <text x={332} y={80}>Current W · feature×output</text><SmallMatrix matrix={state.weights} x={332} y={99} rowColors={featureColors} columnColors={colors} />
      <path d="M238,153 H310" stroke="#c7b1d3" fill="none" /><text x={257} y={137}>×</text>
      <path d="M554,145 H613" stroke="#c7b1d3" fill="none" /><text x={575} y={129}>−Y</text>
      <text x={642} y={80}>Actual residual XW−Y</text><SmallMatrix matrix={state.residual} x={642} y={99} columnColors={colors} />
      <path d="M753,237 V255 H7 V362 H16" stroke="#c7b1d3" fill="none" /><text x={410} y={247}>Xᵀ · residual /3</text>
      <text x={16} y={297}>Gradient Xᵀ(XW−Y)/3</text><SmallMatrix matrix={state.gradient} x={16} y={316} rowColors={featureColors} columnColors={colors} />
      <path d="M238,362 H262 M298,362 H332 M554,181 H600 V270 H280 V344" stroke="#c7b1d3" fill="none" /><text x={245} y={338}>−η</text><circle cx={280} cy={362} r={18} fill="#111114" stroke="#c7b1d3" /><text x={280} y={368} textAnchor="middle">+</text>
      <text x={332} y={297}>Z = W−η gradient</text><SmallMatrix matrix={state.z} x={332} y={316} rowColors={featureColors} columnColors={colors} />
      <path d="M554,339 H638 V337 M554,385 H604 V412 H638" stroke="#c7b1d3" fill="none" /><text x={581} y={316}>norm</text>
      {state.norms.map((norm, row) => <g key={row}><circle cx={661} cy={337 + row * 75} r={23} fill="#111114" stroke={featureColors[row]} /><text x={661} y={344 + row * 75} textAnchor="middle">gate</text><text x={703} y={337 + row * 75} style={{ fill: featureColors[row] }}>||Z_row{row}||={number(norm)}</text><text x={703} y={365 + row * 75}>factor {number(state.factors[row])}</text></g>)}
      <text x={16} y={461}>Threshold ηα = {number(state.threshold)}; both columns in a feature row use one factor.</text>
      <path d="M661,314 V289 H1050 V526 H554" stroke={featureColors[0]} fill="none" /><path d="M661,435 V450 H997 V572 H554" stroke={featureColors[1]} fill="none" /><text x={16} y={510}>Actual next W</text><SmallMatrix matrix={state.successor} x={332} y={503} rowColors={featureColors} columnColors={colors} />
      <text x={16} y={625}>Current objective {number(state.objective)} → next objective {number(state.nextObjective)}</text>
      <text x={16} y={666}>Proximal residual max|W_next−W|/η = {number(state.stationarity)}</text>
      <text x={16} y={712}>{state.status}. This local hand update is separate from the recorded 24-row fit below.</text>
    </MultiLabelCanvas>
    <FlowControls><MultiLabelQuantity label="Hand proximal iteration" value={iterations} min={0} max={200} integer revision={revision} onChange={setIterations} /><MultiLabelQuantity label="Hand group penalty α" value={alpha} min={0} max={1} step={.05} revision={revision} onChange={setAlpha} /><button type="button" onClick={() => { setIterations(0); setAlpha(.2); setRevision(value => value + 1); }}>Reset general-design update</button></FlowControls>
    <FlowReadout>Iteration {iterations} is {state.status}. Its smooth gradient and shrink gates are recomputed from the actual current W. The safe step .5 is at most1/L=1. A smooth-gradient norm alone would ignore the row penalty; the proximal residual is {number(state.stationarity)}. α={number(alpha)} sets the row-support coupling, while the two output columns retain their identities.</FlowReadout>
    <MultiLabelTable caption="Actual current hand trace: every bounded iterate is available, with its full objective and proximal residual"><thead><tr><th>Iterate</th><th>Objective</th><th>Proximal residual</th></tr></thead><tbody>{state.history.map(row => <tr key={row.iteration}><th>{row.iteration}</th><td>{number(row.objective)}</td><td>{number(row.stationarity)}</td></tr>)}</tbody></MultiLabelTable>
    <MultiLabelTable caption="Distinct preserved correlated24-row group fit; ordinary coordinate descent comparison from shared-regression.stdout.txt"><thead><tr><th>Recorded quantity</th><th>Actual value</th></tr></thead><tbody><tr><th>Iterations</th><td>240</td></tr><tr><th>Final objective</th><td>0.2733643595586832</td></tr><tr><th>Proximal residual</th><td>5.975937914993276e−9</td></tr><tr><th>Ordinary coefficient maximum difference</th><td>6.593777746033425e−9</td></tr><tr><th>Ordinary dual gap</th><td>1.4617936490897893e−14</td></tr></tbody></MultiLabelTable>
  </MultiLabelFigure>;
}
