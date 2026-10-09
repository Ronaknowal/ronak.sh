import { useState } from 'react';
import { textObservations as saved } from '../../data/multilabel-reading-flow-text-observations.js';
import { recordedTextCounts } from '../../data/multilabel-reading-flow-energy-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const names = ['Code', 'Hardware', 'Energy'],
  colors = ['#f0b45b', '#75adff', '#bc9aff'];
const test = saved.groups.filter(group => group.split === 'test').flatMap(group => group.messages.map((text, i) => ({
  id: group.rowIds[i],
  group: group.id,
  text,
  truth: group.truth
})));
export function RecordedTextCostFigure() {
  const [report, setReport] = useState('changed'),
    [selected, setSelected] = useState(4);
  const evidence = report === 'changed' ? saved.selectedChanged : saved.selectedOriginal;
  const counts = recordedTextCounts(test.map(row => row.truth), evidence.predictions);
  const row = test[selected],
    prediction = evidence.predictions[selected];
  const rowCounts = recordedTextCounts([row.truth], [prediction]);
  return <MultiLabelFigure
    job="D66"
    description="Actual recorded selected test cells reveal FP and FN cost contributions; changing the report selects a different recorded objective and its fixed outcome, never an interpolated fit"
  >
    <MultiLabelCanvas
      width={1090}
      height={759}
      title="Original micro-F1 report and separately recorded FP+3FN report: actual selected test bits, per-cell errors, weighted sums and distinct validation locks"
    >
      <text x={16} y={30}>
        {report === 'changed' ? 'Recorded changed objective FP+3FN: independent / .5' : 'Recorded original objective micro F1: chain 012 / .6'}
      </text>
      <text x={16} y={84}>Source text row {row.id} · constructed case group {row.group}</text>
      <text x={16} y={132}>“{row.text}”</text>
      <text x={16} y={212}>Known truth</text>
      <text x={16} y={292}>Recorded prediction</text>
      {names.map((name, j) => <g key={name}>
        <text
          x={273 + j * 251}
          y={178}
          textAnchor="middle"
          style={{
            fill: colors[j]
          }}
        >
          {name}
        </text>
        {[row.truth[j], prediction[j]].map((value, k) => <g key={k}>
          <rect
            x={220 + j * 251}
            y={186 + k * 80}
            width={106}
            height={53}
            stroke={colors[j]}
            fill={value ? colors[j] : '#111114'}
          />
          <text
            x={273 + j * 251}
            y={220 + k * 80}
            textAnchor="middle"
            style={{
              fill: value ? '#111114' : colors[j]
            }}
          >
            {value}
          </text>
        </g>)}
        <path d={`M${273 + j * 251},319 V366`} stroke={colors[j]} fill="none" />
        <text
          x={273 + j * 251}
          y={405}
          textAnchor="middle"
          style={{
            fill: row.truth[j] !== prediction[j] ? '#ef8ca4' : colors[j]
          }}
        >
          {row.truth[j] === prediction[j] ? 'correct · cost 0' : row.truth[j] ? 'FN · cost 3' : 'FP · cost 1'}
        </text>
      </g>)}
      <text x={16} y={477}>Selected row: FP {rowCounts.fp} × 1 + FN {rowCounts.fn} × 3 = {rowCounts.cost}</text>
      <path d="M384,497 V526 H511" stroke="#ef8ca4" fill="none" />
      <circle cx={541} cy={526} r={26} fill="#111114" stroke="#ef8ca4" />
      <text x={541} y={533} textAnchor="middle">Σ</text>
      <text x={609} y={533}>All 8 test rows · 24 label decisions</text>
      <text x={16} y={591}>Whole report FP {counts.fp} + 3FN {counts.fn} = {counts.cost}; micro F1 {number(counts.micro)}</text>
      <text x={16} y={642}>
        {report === 'changed' ? 'Recorded validation cost 3 selects independent/.5 before test cost 0.' : 'Recorded validation micro10/11 selects chain012/.6 before test micro10/11.'}
      </text>
      <text x={16} y={694}>The original objective did not optimize this diagnostic cost; its test FN cost is shown descriptively.</text>
      <text x={16} y={738}>Only these two recorded reports are compared. No cost slider invents new selected fitted outcomes.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Recorded source report <select
        aria-label="Recorded source report"
        value={report}
        onChange={event => setReport(event.target.value)}
      >
        <option value="changed">FP+3FN selected report</option>
        <option value="original">Original micro-F1 selected report</option>
      </select></label>
      <label>Inspect recorded test error row <select
        aria-label="Inspect recorded test error row"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {test.map((row, i) => <option key={row.id} value={i}>Row {row.id} · group {row.group}</option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setReport('changed');
          setSelected(4);
        }}
      >Reset recorded cost report</button>
    </FlowControls>
    <FlowReadout>{evidence.family} at cutoff {evidence.threshold} supplies the actual selected predictions. On row {row.id}, [{prediction.join(', ')}] against [{row.truth.join(', ')}] gives FP {rowCounts.fp}, FN {rowCounts.fn}, cost {rowCounts.cost}. Whole test TP {counts.tp}, FP {counts.fp}, FN {counts.fn}, micro F1 {number(counts.micro)}, exact rows {counts.exact}/8 and wrong cells {counts.fp + counts.fn}/24. This small constructed text task is separate from the Energy load experiment.</FlowReadout>
    <MultiLabelTable caption="Every selected report test row, actual truth/prediction and cost">
      <thead>
        <tr>
          <th>Source row/group</th>
          <th>Message</th>
          <th>Truth Code/Hardware/Energy</th>
          <th>Recorded prediction</th>
          <th>FP</th>
          <th>FN</th>
          <th>FP+3FN</th>
        </tr>
      </thead>
      <tbody>
        {test.map((row, i) => {
          const counts = recordedTextCounts([row.truth], [evidence.predictions[i]]);
          return <tr key={row.id} aria-current={i === selected ? 'true' : undefined}>
            <th>{row.id} / {row.group}</th>
            <td>
              {row.text}
            </td>
            <td>[{row.truth.join(', ')}]</td>
            <td>[{evidence.predictions[i].join(', ')}]</td>
            <td>
              {counts.fp}
            </td>
            <td>
              {counts.fn}
            </td>
            <td>
              {counts.cost}
            </td>
          </tr>;
        })}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function CensoredOutputContractFigure() {
  return <MultiLabelFigure
    job="D67"
    description="Observed event at time4 differs from follow-up ending at4 without an event; the second timeline extends into an unknown future"
  >
    <MultiLabelCanvas
      width={1030}
      height={444}
      title="Two person timelines with identical observed time4 and different event indicators; censoring is a lower bound on unobserved event time"
    >
      <text x={16} y={30}>Observed record = (time, event indicator), not two ordinary independent answer targets.</text>
      <text x={16} y={97}>Person E</text>
      <path d="M179,133 H784" fill="none" stroke="#d5c3df" />
      <circle cx={179} cy={133} r={6} fill="#d5c3df" />
      <circle cx={659} cy={133} r={13} fill="#f0b45b" />
      <text x={179} y={177}>0</text>
      <text x={659} y={177} textAnchor="middle">4</text>
      <text
        x={529}
        y={98}
        style={{
          fill: '#f0b45b'
        }}
      >event observed</text>
      <text x={817} y={141}>(4, 1)</text>
      <text x={16} y={262}>Person C</text>
      <path d="M179,298 H659" fill="none" stroke="#d5c3df" />
      <circle cx={179} cy={298} r={6} fill="#d5c3df" />
      <path
        d="M659,279 V317 M659,298 H783 M775,291 L783,298 L775,305"
        fill="none"
        stroke="#75adff"
        strokeWidth={2}
        strokeDasharray="5 4"
      />
      <text x={179} y={344}>0</text>
      <text x={659} y={344} textAnchor="middle">4</text>
      <text
        x={446}
        y={252}
        style={{
          fill: '#75adff'
        }}
      >follow-up ends; future unknown</text>
      <text x={817} y={306}>(4, 0)</text>
      <text x={16} y={408}>Person C's event time exceeds the observed follow-up; 0 does not mean the event never happens.</text>
    </MultiLabelCanvas>
    <figcaption>Different observed meanings require a censor-aware loss and assumptions. <a href="/learn/topic/survival-analysis-cox-regression-kaplan-meier-hazard-models">Survival Analysis</a> develops that next output contract.</figcaption>
  </MultiLabelFigure>;
}
