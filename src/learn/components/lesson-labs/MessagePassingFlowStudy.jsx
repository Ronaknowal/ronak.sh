import { useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { Drawing } from './MessagePassingFlowElements.jsx';
import { SavedGraphArrays } from './MessagePassingFlowSavedArrays.jsx';
import { useSavedStudyResource, SavedStudyStatus } from './MessagePassingStudyResource.jsx';
import examples from '../../data/message-passing-examples.json';
import { savedStudyTrace, validateSavedGraphModel } from '../../data/message-study-flow-models.js';
import './message-study-flow.css';

const asset = '/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/';
const families = ['mlp', 'gcn', 'sage', 'gat'];
const familyNames = { mlp: 'Structural MLP', gcn: 'GCN', sage: 'Mean-SAGE', gat: 'GAT' };
const familyHues = { mlp: '#e4b752', gcn: '#82d3ed', sage: '#c1a4f5', gat: '#e7a6da' };
const validateGcn = value => validateSavedGraphModel(value, 'gcn');
const validateRecorded = value => {
  if (!Array.isArray(value) || value.length !== 12 || value.some((record, index) =>
    record.model !== examples.summary[index].model || record.seed !== examples.summary[index].seed ||
    !Array.isArray(record.probabilities) || record.probabilities.length !== 34 ||
    record.probabilities.some(row => !Array.isArray(row) || row.length !== 2 ||
      row.some(v => !Number.isFinite(v) || v < 0 || v > 1) || Math.abs(row[0] + row[1] - 1) > 2e-6))) {
    throw new Error('Invalid saved probability records.');
  }
  return value;
};
export function MessagePassingSavedPipelineFigure() {
  const resource = useSavedStudyResource(asset + 'gcn-11.json', validateGcn);
  const trace = useMemo(() => resource.data ? savedStudyTrace(examples.graph, examples.roles, resource.data) : null, [resource.data]);
  return <FlowLab id="message-saved-pipeline" label="Actual saved seed 11 GCN input-to-logit computation and declared fitting program" data-job="D26">
    <div ref={resource.anchor}>{trace ? <>
      <SavedGraphArrays trace={trace} model={resource.data} />
      <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="Actual incoming projected channel 1 contributions for member 2">
        <table className="mp-study-table"><caption>Member 2 first-layer channel 1, before the shared bias</caption><thead><tr><th>Sender ID</th><th>Coefficient</th><th>Projected channel 1</th><th>Product</th></tr></thead><tbody>{trace.incoming.map(row => <tr key={row.source}><th>{row.source}</th><td>{number(row.coefficient, 8)}</td><td>{number(row.projected, 8)}</td><td>{number(row.product, 8)}</td></tr>)}</tbody></table>
      </div>
      <p>These products sum to {number(trace.incoming.reduce((sum, row) => sum + row.product, 0), 8)}. Add saved bias {number(trace.bias, 8)} to obtain {number(trace.preactivation, 8)}, then ReLU yields {number(trace.activation, 8)}.</p>
      <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="Every one of member 2's 16 hidden channels">
        <table className="mp-study-table"><caption>All 16 actual hidden channels at member 2</caption><thead><tr><th>Channel</th><th>Pre-ReLU</th><th>After ReLU</th></tr></thead><tbody>{trace.result.hidden[2].map((value, index) => <tr key={index}><th>{index + 1}</th><td>{number(trace.result.first.output[2][index], 8)}</td><td>{number(value, 8)}</td></tr>)}</tbody></table>
      </div>
      <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="Exact fitting IDs and their loss terms">
        <table className="mp-study-table"><caption>Only these ten labels contribute to the recomputed fitting loss</caption><thead><tr><th>Fitting ID</th><th>Known class</th><th>Logit0</th><th>Logit1</th><th>CE term</th></tr></thead><tbody>{trace.fitRows.map(row => <tr key={row.id}><th>{row.id}</th><td>{row.target}</td><td>{number(row.logits[0], 8)}</td><td>{number(row.logits[1], 8)}</td><td>{number(row.loss, 8)}</td></tr>)}</tbody></table>
      </div>
      <FlowReadout>The saved GCN maps member 2 to probabilities <strong>[{trace.result.probabilities[2].map(v => number(v, 6)).join(', ')}]</strong>. The loss here is recomputed at the saved final weights and matches the recorded epoch 300 loss within floating-point precision. Both use parameters after 300 updates.</FlowReadout>
    </> : <SavedStudyStatus resource={resource} />}</div>
  </FlowLab>;
}

function SeedMark({ seed, x, y, hue, selected }) {
  const style = { fill: hue, stroke: selected ? '#fff' : '#101010', strokeWidth: selected ? 2 : 1 };
  return seed === 11 ? <circle cx={x} cy={y} r={7} {...style} />
    : seed === 29 ? <rect x={x - 7} y={y - 7} width={14} height={14} {...style} />
      : <path d={`M${x},${y - 8}L${x + 8},${y + 8}L${x - 8},${y + 8}Z`} {...style} />;
}

function OutcomePlot({ family }) {
  const at = value => 181 + value / 18 * 496;
  return <Drawing width={704} height={620} label="All 12 measured assessment counts on a 0–18 axis; majority 9, label propagation 16; selected family has white outlines, no results hidden">
    <text x={20} y={27}>Assessment correct out of 18; all 12 measured fits remain visible</text>
    <text x={20} y={63}>Seed 11 circle · seed 29 square · seed 47 triangle</text>
    {[9, 16].map((count, index) => <g key={count}><line x1={at(count)} y1={113} x2={at(count)} y2={462} stroke={index ? '#c1a4f5' : '#aaa'} strokeDasharray="5 5" /><text x={at(count)} y={98} textAnchor="middle">{count}</text></g>)}
    {families.map((kind, index) => <g key={kind}>
      <text x={20} y={155 + index * 88} fill={familyHues[kind]}>{familyNames[kind]}</text>
      <line x1={181} y1={150 + index * 88} x2={677} y2={150 + index * 88} stroke="#666" />
      {examples.summary.filter(run => run.model === kind).map((run, seedIndex) => <SeedMark key={run.seed} seed={run.seed} x={at(run.correct.assessment)} y={150 + index * 88 + (seedIndex - 1) * 19} hue={familyHues[kind]} selected={kind === family} />)}
    </g>)}
    {[0, 6, 9, 12, 16, 18].map(value => <g key={value}><line x1={at(value)} y1={461} x2={at(value)} y2={470} stroke="#aaa" /><text x={at(value)} y={493} textAnchor="middle">{value}</text></g>)}
    <text x={20} y={534}>Dashed 9: majority baseline · dashed 16: label propagation</text>
    <text x={20} y={573}>White outline: {familyNames[family]} · selecting does not retrain</text>
    <text x={20} y={608}>Family hues label the methods; marker shapes identify seeds.</text>
  </Drawing>;
}

function EpochPlot({ family }) {
  const runs = examples.summary.filter(run => run.model === family);
  const maximum = Math.max(...runs.flatMap(run => run.history.map(point => point.fit_loss))) * 1.1;
  const x = epoch => 88 + (epoch - 1) / 299 * 570;
  const y = loss => 330 - loss / maximum * 235;
  return <Drawing width={704} height={465} label={`${familyNames[family]} recorded fitting losses at epochs 1,10,50,100,300; segments connect observations only`}>
    <text x={20} y={27}>{familyNames[family]}: measured fitting cross entropy</text>
    <text x={20} y={65}>Dots are observed checkpoints; segments do not add measurements.</text>
    <line x1={88} y1={95} x2={88} y2={330} stroke="#aaa" /><line x1={88} y1={330} x2={658} y2={330} stroke="#aaa" />
    {[0, maximum / 2, maximum].map(value => <g key={value}><text x={73} y={y(value) + 5} textAnchor="end">{number(value, 3)}</text><line x1={88} y1={y(value)} x2={658} y2={y(value)} stroke="#333" /></g>)}
    {runs.map((run, index) => <g key={run.seed}><polyline points={run.history.map(point => `${x(point.epoch)},${y(point.fit_loss)}`).join(' ')} stroke={['#82d3ed', '#e4b752', '#c1a4f5'][index]} fill="none" />{run.history.map(point => <SeedMark key={point.epoch} seed={run.seed} x={x(point.epoch)} y={y(point.fit_loss)} hue={['#82d3ed', '#e4b752', '#c1a4f5'][index]} />)}</g>)}
    {[1, 50, 100, 300].map(epoch => <text key={epoch} x={x(epoch)} y={361} textAnchor="middle">{epoch}</text>)}
    <text x={88} y={402}>Horizontal: epoch · vertical: mean loss over 10 fitting IDs</text>
    <text x={20} y={442}>Cyan circle: 11 · amber square: 29 · violet triangle: 47</text>
  </Drawing>;
}

export function MessagePassingRecordedStudyLab() {
  const [family, setFamily] = useState('gcn');
  const probabilities = useSavedStudyResource(asset + 'recorded-probabilities.json', validateRecorded);
  const current = examples.summary.filter(run => run.model === family);
  return <FlowLab id="message-recorded-study" label="All recorded neural fits and two baselines, with measured losses and exact probabilities" data-job="D27">
    <OutcomePlot family={family} />
    <FlowControls><label className="mp-study-family">Recorded model family <select aria-label="Recorded model family" value={family} onChange={event => setFamily(event.target.value)}>{families.map(kind => <option key={kind} value={kind}>{familyNames[kind]}</option>)}</select></label><button type="button" onClick={() => setFamily('gcn')}>Reset</button></FlowControls>
    <FlowReadout>{familyNames[family]} seeds 11/29/47 achieved <strong>{current.map(run => run.correct.assessment).join('/')}</strong> correct out of 18, compared with 9 for majority and 16 for label propagation. These are saved measurements, not new fits.</FlowReadout>
    <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="All 12 exact recorded fit outcomes and parameter counts">
      <table className="mp-study-table"><caption>All 12 measured outcomes, without result filtering</caption><thead><tr><th>Family</th><th>Seed</th><th>Parameters</th><th>Fit/10</th><th>Development/6</th><th>Assessment/18</th><th>Recorded epoch 300 fit loss</th></tr></thead><tbody>{examples.summary.map(run => <tr key={`${run.model}-${run.seed}`}><th>{familyNames[run.model]}</th><td>{run.seed}</td><td>{run.parameters}</td><td>{run.correct.fit}</td><td>{run.correct.development}</td><td>{run.correct.assessment}</td><td>{number(run.history.at(-1).fit_loss, 8)}</td></tr>)}</tbody></table>
    </div>
    <EpochPlot family={family} />
    <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="All 60 measured epoch observations">
      <table className="mp-study-table"><caption>All saved epoch observations, including the closely spaced epoch 10</caption><thead><tr><th>Family</th><th>Seed</th><th>Epoch</th><th>Fit loss</th><th>Development correct/6</th></tr></thead><tbody>{examples.summary.flatMap(run => run.history.map(point => <tr key={`${run.model}-${run.seed}-${point.epoch}`}><th>{familyNames[run.model]}</th><td>{run.seed}</td><td>{point.epoch}</td><td>{number(point.fit_loss, 8)}</td><td>{point.development_correct}</td></tr>))}</tbody></table>
    </div>
    <div ref={probabilities.anchor}>{probabilities.data ? probabilities.data.map(run => <div key={`${run.model}-${run.seed}`} className="mp-study-scroll" tabIndex={0} role="region" aria-label={`${run.model} seed ${run.seed} all 34 recorded probability rows`}><table className="mp-study-table"><caption>{familyNames[run.model]} / seed {run.seed}: all actual probability rows</caption><thead><tr><th>Semantic member</th><th>Class 0 / Mr.Hi</th><th>Class 1 / Officer</th></tr></thead><tbody>{run.probabilities.map((row, id) => <tr key={id}><th>{id}</th><td>{number(row[0], 8)}</td><td>{number(row[1], 8)}</td></tr>)}</tbody></table></div>) : <SavedStudyStatus resource={probabilities} />}</div>
  </FlowLab>;
}
