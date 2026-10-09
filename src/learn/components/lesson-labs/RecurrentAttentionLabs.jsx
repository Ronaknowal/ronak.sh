import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { NeuralTable, NeuralPlot, formatNeural as format } from './NeuralLessonElements.jsx';
import { attentionTokens } from '../../data/recurrent-attention-models.js';
import measurements from '../../data/recurrent-attention-measurements.json';
import './recurrent-attention-labs.css';

const assetBase = '/learn-code/attention-mechanism-bahdanau-luong/';
const palette = ['#e2b55a', '#eeeeee', '#999999'];

export function AttentionLearningCurves() {
  return <figure data-figure="learning-curves"><div className="attention-curve-grid">{['fixed', 'additive', 'general'].map(kind => <NeuralPlot key={kind} title={`${kind === 'fixed' ? 'Fixed context' : kind === 'additive' ? 'Additive attention' : 'General attention'} · measured development exact match`} xLabel="optimizer updates" yLabel="exact forms / 447" xDomain={[0, 1200]} yDomain={[0, 1]} series={[...measurements.runs.filter(run => run.kind === kind).map((run, index) => ({ label: `seed ${run.seed}`, color: palette[index], dashed: index === 2, values: run.checkpoints.map(row => [row.update, row.exact / 447]) })), { label: 'suffix rules: 407/447', color: '#888888', dashed: true, values: [[0, 407 / 447], [1200, 407 / 447]] }]} points={measurements.runs.filter(run => run.kind === kind).flatMap((run, index) => run.checkpoints.map(row => ({ x: row.update, y: row.exact / 447, color: palette[index], label: `seed ${run.seed}, update ${row.update}: ${row.exact}/447` })))} />)}</div><figcaption>Actual saved checkpoints; connecting lines guide the eye between measurements. All panels use the same 0–1 scale and retain late dips. The gray rule baseline is unchanged; it is not a fitted curve.</figcaption><NeuralTable caption="Measured development exact counts, denominator 447" headers={['Architecture', 'Seed', '0', '100', '400', '800', '1200']} rows={measurements.runs.map(run => [run.kind, run.seed, ...run.checkpoints.map(row => row.exact)])} /></figure>;
}

export function AttentionProgram({ file, title }) {
  return <RemoteCodeBlock source={assetBase + file} language="python" filename={file} title={title} />;
}

export function AttentionWorkedAlignment() {
  const sourceIds = [3, ...[...'lactate'].map(character => attentionTokens.indexOf(character)), 2];
  return <figure data-figure="worked-alignment">
    <div className="attention-matrix-scroll" tabIndex={0} role="region" aria-label="Recorded source shares; scroll for all nine positions">
      <table className="attention-matrix"><caption>Recorded additive seed 1: lactate + past. Violet brightness is source share 0–1.</caption>
        <thead><tr><th scope="col">Emitted output</th>{sourceIds.map((id, index) => <th scope="col" key={index}>{index}: {attentionTokens[id]}</th>)}</tr></thead>
        <tbody>{measurements.worked.map((row, index) => <tr key={index}>
          <th scope="row">{index + 1}: {attentionTokens[row.emitted]}</th>
          {row.attention.map((value, position) => <td key={position} style={{ background: `rgba(188,156,231,${value})` }}>{format(value, 4)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <figcaption>All nine recorded output steps and all nine real source positions remain visible. Repeated letters have separate positions. These rows come from the preserved fitted model, not handwritten alignment targets.</figcaption>
  </figure>;
}
