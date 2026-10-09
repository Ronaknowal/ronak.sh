import { useState } from 'react';
import { sharedOutputStump } from '../../data/multioutput-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const colors = ['#f0b45b', '#75adff'];
const names = ['Temperature', 'Energy'];
const reference = [[0, 0, 2, 2], [0, 100, 100, 100]];
function PlotAndLeaves({
  values,
  candidate,
  output,
  x,
  y,
  scaled = false,
  divisor = 1,
  drawTree = true
}) {
  const result = candidate.outputs[output];
  const presented = values.map(value => value / (scaled && output ? divisor : 1));
  const predictions = result.predictions.map(value => value / (scaled && output ? divisor : 1));
  const lower = Math.min(...presented) - 1,
    upper = Math.max(...presented) + 1;
  const scale = value => y + 200 - (value - lower) / (upper - lower) * 155;
  const cut = x + 50 + candidate.threshold * 62;
  return <g>
    <text
      x={x}
      y={y + 20}
      style={{
        fill: colors[output]
      }}
    >{names[output]} · {output && scaled ? 'Wh ÷' + number(divisor) : output ? 'Wh' : '°C'}</text>
    <path
      d={'M' + (x + 30) + ',' + (y + 40) + ' V' + (y + 205) + ' H' + (x + 285)}
      stroke="#b6a4c1"
      fill="none"
    />
    <text x={x + 23} y={y + 54} textAnchor="end">
      {number(upper)}
    </text>
    <text x={x + 23} y={y + 205} textAnchor="end">
      {number(lower)}
    </text>
    {[.5, 1.5, 2.5].map(threshold => <g key={threshold}>
      <path
        d={'M' + (x + 50 + threshold * 62) + ',' + (y + 36) + ' V' + (y + 218)}
        stroke={threshold === candidate.threshold ? '#fff' : '#6b596f'}
        strokeDasharray="5 4"
      />
      <text x={x + 50 + threshold * 62} y={y + 230} textAnchor="middle">
        {threshold}
      </text>
    </g>)}
    {presented.map((value, row) => {
      const px = x + 50 + row * 62,
        actualY = scale(value),
        predictY = scale(predictions[row]);
      return <g key={row}>
        <path d={'M' + px + ',' + actualY + ' V' + predictY} stroke={colors[output]} />
        <circle cx={px} cy={actualY} r={7} fill="#111114" stroke={colors[output]} />
        <rect x={px - 5} y={predictY - 5} width={10} height={10} fill={colors[output]} />
        <text x={px} y={y + 246} textAnchor="middle">
          {row}
        </text>
      </g>;
    })}
    {drawTree && <g>
      <path
        d={'M' + (x + 155) + ',' + (y + 295) + ' L' + (x + 79) + ',' + (y + 331) + ' M' + (x + 155) + ',' + (y + 295) + ' L' + (x + 245) + ',' + (y + 331)}
        stroke={colors[output]}
        fill="none"
      />
      <text x={x + 155} y={y + 282} textAnchor="middle">x ≤ {candidate.threshold}</text>
      <rect x={x + 10} y={y + 337} width={139} height={64} fill="#111114" stroke={colors[output]} />
      <rect x={x + 175} y={y + 337} width={139} height={64} fill="#111114" stroke={colors[output]} />
      <text x={x + 79} y={y + 362} textAnchor="middle">rows 0…{candidate.cut - 1}</text>
      <text x={x + 79} y={y + 392} textAnchor="middle">μ={number(result.leftMean / (scaled && output ? divisor : 1))}</text>
      <text x={x + 245} y={y + 362} textAnchor="middle">rows {candidate.cut}…3</text>
      <text x={x + 245} y={y + 392} textAnchor="middle">μ={number(result.rightMean / (scaled && output ? divisor : 1))}</text>
    </g>}
  </g>;
}
function SharedVectorLeaves({
  candidate,
  divisor = 1
}) {
  return <g>
    <text x={368} y={341} textAnchor="middle">One shared split: x ≤ {candidate.threshold}</text>
    <path d="M368,355 L195,393 M368,355 L544,393" stroke="#d1bddb" fill="none" />
    {[0, 1].map(side => {
      const x = side ? 434 : 85;
      return <g key={side}>
        <text x={x + 111} y={418} textAnchor="middle">{side ? 'Rows ' + candidate.cut + '…3' : 'Rows 0…' + (candidate.cut - 1)} · vector mean</text>
        {candidate.outputs.map((output, column) => <g key={column}>
          <text
            x={x + column * 111 + 55}
            y={447}
            textAnchor="middle"
            style={{
              fill: colors[column]
            }}
          >
            {column ? 'Energy' : 'Temperature'}
          </text>
          <rect x={x + column * 111} y={459} width={111} height={44} fill="#111114" stroke={colors[column]} />
          <text
            x={x + column * 111 + 55}
            y={487}
            textAnchor="middle"
            style={{
              fill: colors[column]
            }}
          >
            {number((side ? output.rightMean : output.leftMean) / (column ? divisor : 1))}
          </text>
        </g>)}
      </g>;
    })}
  </g>;
}
function CandidateTable({
  state,
  selected
}) {
  return <MultiLabelTable caption="All three exact midpoint cuts, both vector means and raw/scaled squared errors">
    <thead>
      <tr>
        <th>Cut</th>
        <th>Left mean °C,Wh</th>
        <th>Right mean °C,Wh</th>
        <th>Raw SSE °C²,Wh²</th>
        <th>Scaled total</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      {state.candidates.map(candidate => <tr key={candidate.threshold}>
        <th>
          {candidate.threshold}
        </th>
        <td>
          {candidate.outputs.map(row => number(row.leftMean)).join(', ')}
        </td>
        <td>
          {candidate.outputs.map(row => number(row.rightMean)).join(', ')}
        </td>
        <td>
          {candidate.outputs.map(row => number(row.sse)).join(', ')}
        </td>
        <td>
          {number(candidate.scaledSse)}
        </td>
        <td>
          {candidate === state.shared ? 'Best shared' : ''}
          {candidate.threshold === selected ? ' · inspected' : ''}
        </td>
      </tr>)}
    </tbody>
  </MultiLabelTable>;
}
export function SharedScaleSplitFigure() {
  const [divisor, setDivisor] = useState(1);
  const [threshold, setThreshold] = useState(.5);
  const [revision, setRevision] = useState(0);
  const state = sharedOutputStump({
    energyScale: divisor
  });
  const candidate = state.candidates.find(row => row.threshold === threshold);
  return <MultiLabelFigure
    job="D46"
    description="Actual midpoint cuts and vector leaf means show the selected inspection partition beside the minimum of the two-output scaled SSE objective"
  >
    <MultiLabelCanvas
      width={736}
      height={562}
      title="Same four observations, one inspected boundary and actual two-coordinate leaves; circle observed, square predicted"
    >
      <text x={16} y={30}>White cut: inspected {threshold}; objective's best common cut: {state.shared.threshold}.</text>
      {[0, 1].map(output => <PlotAndLeaves
        key={output}
        values={reference[output]}
        candidate={candidate}
        output={output}
        x={16 + output * 365}
        y={48}
        scaled
        divisor={divisor}
        drawTree={false}
      />)}
      <SharedVectorLeaves candidate={candidate} divisor={divisor} />
      <text x={16} y={545}>Raw SSE: [{candidate.outputs.map(row => number(row.sse)).join(', ')}]; scaled total {number(candidate.scaledSse)}.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="Energy divisor"
        value={divisor}
        min={.1}
        max={1000}
        revision={revision}
        onChange={setDivisor}
      />
      <label>Inspected common cut<select
        aria-label="Inspected common cut"
        value={threshold}
        onChange={event => setThreshold(Number(event.target.value))}
      >
        {state.candidates.map(row => <option key={row.threshold} value={row.threshold}>
          {row.threshold}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setDivisor(1);
          setThreshold(.5);
          setRevision(value => value + 1);
        }}
      >Reset common partition</button>
    </FlowControls>
    <FlowReadout>Dividing energy by {number(divisor)} divides its squared contribution by {number(divisor ** 2)}. Best common cut {state.shared.threshold} has scaled SSE {number(state.shared.scaledSse)}; the inspected cut is {threshold}. Separate raw-unit SSE remains visible. Scale changes the compromise, without changing raw targets or establishing generalization.</FlowReadout>
    <CandidateTable state={state} selected={threshold} />
  </MultiLabelFigure>;
}
export function EditedSharedSeparateFigure() {
  const [output, setOutput] = useState(0);
  const [drafts, setDrafts] = useState(reference.map(row => row.map(String)));
  const [mode, setMode] = useState('shared');
  const targets = drafts.map(row => row.map(value => value.trim() === '' ? NaN : Number(value)));
  const valid = targets.every((row, column) => row.every(value => Number.isFinite(value) && Math.abs(value) <= (column ? 10000 : 100)));
  const state = valid ? sharedOutputStump({
    temperature: targets[0],
    energy: targets[1]
  }) : null;
  const update = (row, value) => setDrafts(previous => previous.map((values, column) => column === output ? values.map((entry, index) => index === row ? value : entry) : values));
  return <MultiLabelFigure
    job="D47"
    description="One four-row target edit surface changes actual shared/separate stump boundaries and leaf means, retaining original model domains and unsupported drafts"
  >
    {state ? <MultiLabelCanvas
      width={736}
      height={606}
      title="Same valid edited observations feed one common vector-leaf tree or two independently chosen scalar trees"
    >
      <text x={16} y={30}>
        {mode === 'shared' ? 'Shared vector-leaf partition: both cuts are ' + state.shared.threshold : 'Separate scalar partitions: cuts ' + state.separate.map(row => row.threshold).join(' / ')}
      </text>
      {[0, 1].map(column => <PlotAndLeaves
        key={column}
        values={targets[column]}
        candidate={mode === 'shared' ? state.shared : state.separate[column]}
        output={column}
        x={16 + column * 365}
        y={48}
        drawTree={mode === 'separate'}
      />)}
      {mode === 'shared' && <SharedVectorLeaves candidate={state.shared} />}
      <text x={16} y={552}>
        <tspan x={16}>{'Each leaf pair restores the same original row order. '}</tspan>
        <tspan x={16} dy={26}>All ties choose the first midpoint cut.</tspan>
      </text>
    </MultiLabelCanvas> : <p role="status">Unsupported target draft. Enter four finite values within the labelled bounds before calculating a partition.</p>}
    <FlowControls>
      <label>Edited output<select
        aria-label="Edited stump output"
        value={output}
        onChange={event => setOutput(Number(event.target.value))}
      >
        <option value={0}>Temperature −100…100°C</option>
        <option value={1}>Energy −10000…10000Wh</option>
      </select></label>
      <label>Partition structure<select
        aria-label="Stump partition structure"
        value={mode}
        onChange={event => setMode(event.target.value)}
      >
        <option value="shared">One shared vector tree</option>
        <option value="separate">Two separate scalar trees</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setOutput(0);
          setDrafts(reference.map(row => row.map(String)));
          setMode('shared');
        }}
      >Reset edited trees</button>
    </FlowControls>
    <MultiLabelTable
      caption={'One actual four-row edit surface: ' + names[output] + '; allowed ' + (output ? '−10000…10000Wh' : '−100…100°C')}
    >
      <thead>
        <tr>
          <th>Input x / row</th>
          <th>Selected target</th>
          <th>Other output, unchanged here</th>
        </tr>
      </thead>
      <tbody>
        {drafts[output].map((value, row) => <tr key={row}>
          <th>
            {row}
          </th>
          <td>
            <input
              type="text"
              inputMode="decimal"
              aria-label={names[output] + ' target row ' + row}
              aria-invalid={!Number.isFinite(targets[output][row]) || Math.abs(targets[output][row]) > (output ? 10000 : 100)}
              value={value}
              onChange={event => update(row, event.target.value)}
            />
          </td>
          <td>
            {drafts[1 - output][row]}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <FlowReadout>
      {state ? 'Best shared cut ' + state.shared.threshold + ' has total raw SSE ' + number(state.shared.scaledSse) + '. Separate cuts ' + state.separate.map(row => row.threshold).join(' / ') + ' have individual SSE ' + state.separate.map((row, column) => number(row.outputs[column].sse)).join(' / ') + '. These are training arithmetic outcomes on the four edited rows.' : 'No means, splits or SSE are calculated from an invalid draft. Reset clears every target draft, output selection and mode.'}
    </FlowReadout>
    {state && <CandidateTable state={state} selected={state.shared.threshold} />}
  </MultiLabelFigure>;
}
