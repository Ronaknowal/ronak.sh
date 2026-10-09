import { useState } from 'react';
import { candidateBoundary, labelObjectSizes, retrievalHandScores, retrievalLabels } from '../../data/multilabel-reading-flow-scale-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const colors = ['#f0b45b', '#75adff', '#bc9aff', '#ef8ca4', '#83c8ce', '#d4a780'];
function Dimensions({
  rows,
  columns,
  x,
  y,
  label,
  rowName,
  columnName
}) {
  const shownRows = Math.min(rows, 6),
    shownColumns = Math.min(columns, 7);
  return <g>
    <text x={x} y={y - 37}>{label}: {rows}×{columns}</text>
    {Array.from({
      length: shownColumns
    }, (_, column) => <text key={column} x={x + column * 30 + 15} y={y - 12} textAnchor="middle">
      {column}
    </text>)}
    {Array.from({
      length: shownRows
    }, (_, row) => Array.from({
      length: shownColumns
    }, (__, column) => <rect
      key={row + '-' + column}
      x={x + column * 30}
      y={y + row * 25}
      width={30}
      height={25}
      fill="#111114"
      stroke={colors[column % colors.length]}
    />))}
    <text x={x + shownColumns * 30 + 11} y={y + 27}>
      {columns > shownColumns ? '…' : ''}
    </text>
    <text x={x} y={y + shownRows * 25 + 28}>
      {rows > shownRows ? '… ' : ''}
      {rowName}
    </text>
  </g>;
}
export function LabelScaleObjectsFigure() {
  const [labels, setLabels] = useState(6);
  const [rows, setRows] = useState(100);
  const [revision, setRevision] = useState(0);
  const state = labelObjectSizes(labels, rows);
  return <MultiLabelFigure
    job="D55"
    description="Actual row-label and feature-label grids, a growing chain prefix, relevant-irrelevant pair edges and subset memberships show separate arithmetic sizes"
  >
    <MultiLabelCanvas
      width={1044}
      height={1070}
      title="Storage and operation dimensions for a fixed four-feature model; exact arithmetic counts, not measured runtimes"
    >
      <text x={16} y={30}>n={rows} observations; L={labels} labels; d=4 features. Cropped grids use explicit ellipses.</text>
      <text x={16} y={55}>Grid column hues repeat every six; numeric column IDs preserve identity.</text>
      <Dimensions
        rows={rows}
        columns={labels}
        x={16}
        y={126}
        label="Targets"
        rowName="observations ↓"
        columnName="label columns"
      />
      <Dimensions
        rows={4}
        columns={labels}
        x={370}
        y={126}
        label="Head slopes"
        rowName="input features ↓"
        columnName="label columns"
      />
      <text x={724} y={89}>One query score array: L={labels}</text>
      {Array.from({
        length: Math.min(labels, 7)
      }, (_, j) => <g key={j}>
        <rect
          x={724 + j * 36}
          y={126}
          width={36}
          height={38}
          fill="#111114"
          stroke={colors[j % colors.length]}
        />
        <text x={742 + j * 36} y={151} textAnchor="middle">
          {j}
        </text>
      </g>)}
      <text x={724} y={204}>{labels > 7 ? '… ' : ''}Dense scores: {labels} values</text>
      <text x={16} y={345}>Sequential stage j receives d+j prefix coordinates</text>
      {state.prefixWidths.slice(0, 7).map((width, j) => <g key={j}>
        <text x={16} y={386 + j * 34}>stage {j}</text>
        <rect
          x={113}
          y={368 + j * 34}
          width={width * 21}
          height={25}
          fill="#25202c"
          stroke={colors[j % colors.length]}
        />
        <text x={133 + width * 21} y={387 + j * 34}>
          {width}
        </text>
      </g>)}
      <text x={16} y={639}>{labels > 7 ? '… through stage ' + (labels - 1) + '; ' : ''}sum widths = {state.prefixCoordinates}</text>
      <text x={487} y={345}>One row: R=2 relevant, L−R={labels - 2} irrelevant</text>
      {[0, 1].map(index => <g key={index}>
        <circle cx={525} cy={405 + index * 96} r={22} fill="#111114" stroke={colors[index]} />
        <text x={525} y={412 + index * 96} textAnchor="middle">+{index}</text>
      </g>)}
      {Array.from({
        length: Math.min(labels - 2, 5)
      }, (_, index) => <g key={index}>
        <circle
          cx={904}
          cy={381 + index * 48}
          r={18}
          fill="#111114"
          stroke={colors[(index + 2) % colors.length]}
        />
        <text x={904} y={388 + index * 48} textAnchor="middle">−{index}</text>
        {[0, 1].map(positive => <path
          key={positive}
          d={`M547,${405 + positive * 96} L886,${381 + index * 48}`}
          stroke={colors[positive]}
          opacity={.45}
          fill="none"
        />)}
      </g>)}
      <text x={487} y={656}>Each + pairs with each −: {state.pairConstraints} constraints</text>
      <text x={16} y={706}>Powerset upper bound 2ᴸ={state.powersetUpper}; occupied categories ≤min(n,2ᴸ)={state.occupiedUpper}.</text>
      <Dimensions
        rows={3}
        columns={state.groupSize}
        x={16}
        y={802}
        label="Projected group memberships"
        rowName="m=3 members ↓; slots may repeat labels"
        columnName="projected output slots"
      />
      <text x={487} y={765}>Possible categories · selected examples</text>
      {[0, 1, 2, 3].map(category => {
        const bits = category.toString(2).padStart(labels, '0');
        return <g key={category}>
          <rect x={487} y={785 + category * 43} width={340} height={43} fill="#111114" stroke="#b7a3c1" />
          <text x={502} y={813 + category * 43}>ID {category}: {labels > 16 ? bits.slice(0, 3) + '…' + bits.slice(-8) : bits}</text>
        </g>;
      })}
      <text x={16} y={989}>m×k = {state.projectedMemberships}; powerset examples illustrate IDs, not measured occupied categories.</text>
      <text x={16} y={1045}>Sparse targets do not imply sparse scores. These shapes/counts are not hardware timing measurements.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="Number of labels L"
        value={labels}
        min={2}
        max={50}
        integer
        revision={revision}
        onChange={setLabels}
      />
      <MultiLabelQuantity
        label="Number of observations n"
        value={rows}
        min={10}
        max={1000}
        integer
        revision={revision}
        onChange={setRows}
      />
      <button
        type="button"
        onClick={() => {
          setLabels(6);
          setRows(100);
          setRevision(value => value + 1);
        }}
      >Reset label scale</button>
    </FlowControls>
    <FlowReadout>L={labels} and n={rows} require {state.targetCells} dense target cells, {state.headSlopes} head slopes and {state.queryScores} scores per query. Chain prefixes total {state.prefixCoordinates} coordinates per row across stages; a two-positive row gives {state.pairConstraints} pair constraints. The occupied powerset bound is {state.occupiedUpper}, while three size-{state.groupSize} groups expose {state.projectedMemberships} memberships.</FlowReadout>
    <MultiLabelTable
      caption="Exact object sizes; d=4, R=2, m=3, k=min(3,L); counts are arithmetic, not fitted timings"
    >
      <thead>
        <tr>
          <th>Object</th>
          <th>Expression</th>
          <th>Current count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Dense known targets</td>
          <td>nL</td>
          <td>
            {state.targetCells}
          </td>
        </tr>
        <tr>
          <td>Head slopes</td>
          <td>dL</td>
          <td>
            {state.headSlopes}
          </td>
        </tr>
        <tr>
          <td>Sequential prefix coordinates</td>
          <td>Ld+L(L−1)/2</td>
          <td>
            {state.prefixCoordinates}
          </td>
        </tr>
        <tr>
          <td>One-row pair constraints</td>
          <td>R(L−R)</td>
          <td>
            {state.pairConstraints}
          </td>
        </tr>
        <tr>
          <td>Possible powerset states</td>
          <td>2ᴸ</td>
          <td>
            {String(state.powersetUpper)}
          </td>
        </tr>
        <tr>
          <td>Occupied category bound</td>
          <td>min(n,2ᴸ)</td>
          <td>
            {state.occupiedUpper}
          </td>
        </tr>
        <tr>
          <td>Projected memberships</td>
          <td>mk</td>
          <td>
            {state.projectedMemberships}
          </td>
        </tr>
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function CandidateRetrievalFigure() {
  const [included, setIncluded] = useState(['A', 'B', 'C']);
  const [trueLabel, setTrueLabel] = useState('F');
  const state = candidateBoundary(included, trueLabel);
  return <MultiLabelFigure
    job="D56"
    description="A label search tree proposes candidate leaves; only included leaves reach scores, and an omitted true output remains explicitly unscored"
  >
    <MultiLabelCanvas
      width={1060}
      height={659}
      title="Search hierarchy with literal leaf IDs and a candidate-only scorer; candidate recall caps final recall at this explicit output boundary"
    >
      <text x={16} y={30}>A–F have stable individual hues. White rings identify the selected known true label {trueLabel}.</text>
      <circle cx={516} cy={88} r={24} stroke="#d5c3df" fill="#111114" />
      <text x={516} y={94} textAnchor="middle">root</text>
      {[0, 1].map(group => <g key={group}>
        <path d={`M516,112 L${267 + group * 498},170`} stroke="#b7a3c1" fill="none" />
        <circle cx={267 + group * 498} cy={194} r={24} stroke="#b7a3c1" fill="#111114" />
        <text x={267 + group * 498} y={201} textAnchor="middle">
          {group === 0 ? 'ABC' : 'DEF'}
        </text>
      </g>)}
      {state.slots.map((slot, j) => {
        const x = 92 + j * 166;
        return <g key={slot.label}>
          <path
            d={`M${j < 3 ? 267 : 765},218 L${x},279`}
            stroke={colors[j]}
            fill="none"
            opacity={slot.score === null ? .3 : 1}
          />
          <circle
            cx={x}
            cy={302}
            r={23}
            stroke={colors[j]}
            fill={slot.score === null ? '#111114' : '#27232b'}
          />
          <text
            x={x}
            y={309}
            textAnchor="middle"
            style={{
              fill: colors[j]
            }}
          >
            {slot.label}
          </text>
          {slot.truth && <circle cx={x} cy={302} r={29} stroke="#eee8f0" fill="none" strokeWidth={2} />}
          {slot.score !== null ? <g>
            <path d={`M${x},325 V377`} stroke={colors[j]} fill="none" />
            <rect x={x - 57} y={377} width={114} height={43} stroke={colors[j]} fill="#111114" />
            <text x={x} y={405} textAnchor="middle">score {number(slot.score)}</text>
            <path d={`M${x},420 V467`} stroke={colors[j]} fill="none" />
            <text
              x={x}
              y={493}
              textAnchor="middle"
              style={{
                fill: colors[j]
              }}
            >
              {slot.decision ? 'emit' : 'below .5'}
            </text>
          </g> : <g>
            <path d={`M${x - 12},352 L${x + 12},376 M${x + 12},352 L${x - 12},376`} stroke="#b7a3c1" />
            <text x={x} y={409} textAnchor="middle">unscored</text>
            <text x={x} y={493} textAnchor="middle">not emitted</text>
          </g>}
        </g>;
      })}
      <text x={16} y={559}>Candidate true count {state.retrievedTrue} / known true count 1 → candidate recall {state.candidateRecall}.</text>
      <text x={16} y={604}>Emitted true count {state.predictedTrue} / known true count 1 → final recall {state.finalRecall}.</text>
      <text x={16} y={643}>Search branches locate candidates; they do not encode an implication between label truth values.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <fieldset>
        <legend>Included candidate labels</legend>
        {retrievalLabels.map(label => <label key={label}>
          <input
            type="checkbox"
            checked={included.includes(label)}
            onChange={event => setIncluded(current => event.target.checked ? [...current, label] : current.filter(value => value !== label))}
          />
          {label}
        </label>)}
      </fieldset>
      <label>One known true label <select
        aria-label="One known true label"
        value={trueLabel}
        onChange={event => setTrueLabel(event.target.value)}
      >
        {retrievalLabels.map(label => <option key={label}>
          {label}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setIncluded(['A', 'B', 'C']);
          setTrueLabel('F');
        }}
      >Reset candidate omission</button>
    </FlowControls>
    <FlowReadout>Candidate set [{state.candidates.join(', ') || 'empty'}] emits [{state.decisions.join(', ') || 'empty'}] at .5. The one known true label {trueLabel} is {state.retrievedTrue ? 'retrieved' : 'unscored'}. Candidate recall {state.retrievedTrue}/1 caps final recall {state.predictedTrue}/1 under this candidate-only scorer. Supplied scores are illustrative, not fitted probabilities or a retrieval benchmark.</FlowReadout>
    <MultiLabelTable caption="Named candidate slots and the supplied hand score boundary">
      <thead>
        <tr>
          <th>Label</th>
          <th>Known true?</th>
          <th>Candidate score</th>
          <th>Emitted?</th>
        </tr>
      </thead>
      <tbody>
        {state.slots.map((slot, j) => <tr key={slot.label}>
          <th
            style={{
              color: colors[j]
            }}
          >
            {slot.label}
          </th>
          <td>
            {slot.truth ? 'yes' : 'no'}
          </td>
          <td>
            {slot.score === null ? 'unscored' : number(retrievalHandScores[j])}
          </td>
          <td>
            {slot.decision ? 'yes' : 'no'}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
