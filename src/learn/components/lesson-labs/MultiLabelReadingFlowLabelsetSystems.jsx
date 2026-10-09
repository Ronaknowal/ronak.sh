import { useState } from 'react';
import { labelIdentities as labels } from '../../data/multilabel-reading-flow-foundation-models.js';
import { savedLabelsetForward } from '../../data/multilabel-reading-flow-labelset-models.js';
import { savedLabelsetObservations as saved } from '../../data/multilabel-reading-flow-labelset-observations.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const projectionGroups = [[0, 1, 5], [1, 2, 3], [2, 4, 5]];
const projectionRow = [1, 0, 1, 0, 0, 1];
function NamedSocket({
  x,
  y,
  column,
  bit,
  selected = false
}) {
  return <g>
    <circle
      cx={x}
      cy={y}
      r={20}
      fill={bit ? labels[column].color : '#111114'}
      stroke={selected ? '#fff' : labels[column].color}
      strokeWidth={selected ? 3 : 1}
    />
    <text
      x={x}
      y={y + 6}
      textAnchor="middle"
      style={{
        fill: bit ? '#111114' : labels[column].color
      }}
    >
      {bit}
    </text>
    <text
      x={x}
      y={y + 45}
      textAnchor="middle"
      style={{
        fill: labels[column].color
      }}
    >
      {labels[column].id}
    </text>
  </g>;
}
function ProjectionWitness() {
  const [selected, setSelected] = useState(0);
  return <>
    <MultiLabelCanvas
      width={736}
      height={425}
      title="Projection witness only: copy original named bits into ABF, BCD or CEF; no fitted classifier"
    >
      <text x={16} y={30}>Projection witness · no fitted classifier</text>
      {labels.map((label, column) => <NamedSocket
        key={label.id}
        x={82 + column * 110}
        y={93}
        column={column}
        bit={projectionRow[column]}
        selected={projectionGroups[selected].includes(column)}
      />)}
      {projectionGroups[selected].map((column, local) => {
        const targetX = 180 + local * 187;
        return <g key={column}>
          <path
            d={`M${82 + column * 110},145 V${184 + local * 27} H${targetX} V289`}
            fill="none"
            stroke={labels[column].color}
            strokeWidth={2}
          />
          <NamedSocket x={targetX} y={310} column={column} bit={projectionRow[column]} selected />
          <text x={targetX} y={397} textAnchor="middle">local slot {local + 1}</text>
        </g>;
      })}
      <text x={16} y={422}>Identity follows the wire: E cyan and F cream never exchange names.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Projection witness group<select
        aria-label="Projection witness group"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {projectionGroups.map((group, index) => <option key={index} value={index}>
          {group.map(column => labels[column].id).join('')}
        </option>)}
      </select></label>
      <button type="button" onClick={() => setSelected(0)}>Reset projection witness</button>
    </FlowControls>
    <FlowReadout>Original 101001 projects to {projectionGroups[selected].map(column => labels[column].id).join('')} bits {projectionGroups[selected].map(column => projectionRow[column]).join('')}. This operation copies known bits; it does not fit or predict them.</FlowReadout>
  </>;
}
function SavedClassCircuit({
  member,
  query,
  queryIndex
}) {
  const state = savedLabelsetForward(member, query);
  const base = 128 + state.classes.length * 110;
  return <MultiLabelCanvas
    width={1040}
    height={base + 185}
    title={`Query ${queryIndex + 1}: actual ${member.name} saved class scores, argmax ID and vocabulary lookup`}
  >
    <text x={16} y={30}>Query {queryIndex + 1} · x₁={number(query[0])}, x₂={number(query[1])} · {member.name}</text>
    <text x={16} y={70}>x₁</text>
    <text x={76} y={70}>x₂</text>
    <path d={`M30,82 H133 V${base - 40} M89,82 H150 V${base - 40}`} stroke="#afa2bc" fill="none" />
    {state.classes.map(row => {
      const y = 128 + row.id * 110;
      return <g key={row.id}>
        <text x={16} y={y + 6}>ID{row.id}</text>
        <path
          d={`M133,${y} H217 M150,${y + 58} H395 V${y} H412 M259,${y} H320 V${y + 58} H600 V${y + 21} M454,${y} H579 M621,${y} H899 V${base}`}
          stroke={row.id === state.winner.id ? '#fff' : '#ab9cb8'}
          fill="none"
        />
        {[{
          x: 238,
          product: row.products[0],
          weight: row.weights[0]
        }, {
          x: 433,
          product: row.products[1],
          weight: row.weights[1]
        }].map((term, index) => <g key={index}>
          <text x={term.x} y={y - 28} textAnchor="middle">w{index + 1}={number(term.weight)}</text>
          <circle cx={term.x} cy={y} r={21} fill="#111114" stroke="#cbb4d5" />
          <text x={term.x} y={y + 6} textAnchor="middle">×</text>
          <text x={term.x} y={y + 37} textAnchor="middle">
            {number(term.product)}
          </text>
        </g>)}
        <text x={600} y={y - 31} textAnchor="middle">b={number(row.bias)}</text>
        <path d={`M600,${y - 22} V${y - 17}`} stroke="#cbb4d5" />
        <circle cx={600} cy={y} r={21} fill="#111114" stroke="#cbb4d5" />
        <text x={600} y={y + 6} textAnchor="middle">Σ</text>
        <text x={680} y={y - 14}>score {number(row.score)}</text>
        <text x={680} y={y + 26}>class bits {row.vector.join('')}</text>
      </g>;
    })}
    <path d={`M899,${base} H785 M724,${base} H552 M446,${base} H335`} stroke="#fff" fill="none" />
    <circle cx={754} cy={base} r={30} fill="#111114" stroke="#fff" />
    <text x={754} y={base + 6} textAnchor="middle">max</text>
    <text x={754} y={base + 52} textAnchor="middle">argmax ID {state.winner.id}</text>
    <rect x={446} y={base - 30} width={106} height={60} fill="#111114" stroke="#fff" />
    <text x={499} y={base - 7} textAnchor="middle">lookup</text>
    <text x={499} y={base + 19} textAnchor="middle">ID {state.winner.id}</text>
    {state.named.map((socket, local) => <g key={socket.column}>
      <path
        d={`M335,${base} H${92 + local * 95} V${base + 56}`}
        stroke={labels[socket.column].color}
        fill="none"
      />
      <NamedSocket x={92 + local * 95} y={base + 78} column={socket.column} bit={socket.bit} />
    </g>)}
    <text x={16} y={base + 176}>Largest class score → categorical ID → complete local vector → named output sockets.</text>
  </MultiLabelCanvas>;
}
export function LabelsetSystemsFigure() {
  const [selected, setSelected] = useState(0);
  const member = saved.members[selected];
  return <MultiLabelFigure
    job="D31"
    description="An unfitted three-group identity projection is followed by the separately saved actual four-group fitted systems"
  >
    <ProjectionWitness />
    <p>Recorded fitted systems use different groups: ADF, BCE, BDE and AEF. Inspect one actual system below; both fixed queries use the same saved coefficients and train-only class mapping.</p>
    {saved.queries.map((query, index) => <SavedClassCircuit key={index} member={member} query={query} queryIndex={index} />)}
    <FlowControls>
      <label>Recorded fitted labelset group<select
        aria-label="Recorded fitted labelset group"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {saved.members.map((row, index) => <option key={row.name} value={index}>
          {row.name}
        </option>)}
      </select></label>
      <button type="button" onClick={() => setSelected(0)}>Reset recorded fitted group</button>
    </FlowControls>
    <FlowReadout>{member.name} has {member.vocabulary.length} train-only categories and uses the multiclass-logistic branch. Fixed queries decode {member.queryForward.map(row => row.decodedBits.join('')).join(' and ')}. Each class score is recalculated from the displayed saved coefficients; no fitting happens in this figure.</FlowReadout>
    <MultiLabelTable
      caption={`${member.name}: all sixteen original training rows and their local categorical encoding`}
    >
      <thead>
        <tr>
          <th>Original row</th>
          <th>Original A–F bits</th>
          <th>Local {member.name} bits</th>
          <th>Train-only category ID</th>
        </tr>
      </thead>
      <tbody>
        {member.projectedTrainingRows.map((bits, row) => <tr key={row}>
          <th>r{row}</th>
          <td>
            {saved.targets[row].join('')}
          </td>
          <td>
            {bits.join('')}
          </td>
          <td>
            {member.trainingCodes[row]}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable
      caption={`${member.name}: complete saved class vocabulary, full-precision parameters and both calculated scores`}
    >
      <thead>
        <tr>
          <th>Class ID</th>
          <th>Local bits</th>
          <th>x₁ weight</th>
          <th>x₂ weight</th>
          <th>Intercept</th>
          <th>Query1 score</th>
          <th>Query2 score</th>
        </tr>
      </thead>
      <tbody>
        {member.vocabulary.map((bits, id) => <tr key={id}>
          <th>
            {id}
          </th>
          <td>
            {bits.join('')}
          </td>
          <td>
            {String(member.coefficients[id][0])}
          </td>
          <td>
            {String(member.coefficients[id][1])}
          </td>
          <td>
            {String(member.intercept[id])}
          </td>
          {saved.queries.map((query, index) => <td key={index}>
            {number(savedLabelsetForward(member, query).classes[id].score, 9)}
          </td>)}
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelCanvas
      width={736}
      height={210}
      title="Separate known-empty one-category model: constant categorical zero decodes to 00 without logistic coefficients"
    >
      <text x={16} y={30}>Separate saved one-category branch · known empty vector</text>
      <text x={16} y={97}>any finite X</text>
      <path d="M137,91 H234 M321,91 H418 M553,91 H622" stroke="#c9b5d3" />
      <circle cx={277} cy={91} r={40} fill="#111114" stroke="#c9b5d3" />
      <text x={277} y={84} textAnchor="middle">constant</text>
      <text x={277} y={110} textAnchor="middle">ID 0</text>
      <rect x={420} y={58} width={130} height={66} fill="#111114" stroke="#c9b5d3" />
      <text x={485} y={84} textAnchor="middle">vocab[0]</text>
      <text x={485} y={110} textAnchor="middle">00</text>
      <text x={637} y={97}>00</text>
      <text x={16} y={155}>
        <tspan x={16}>{'Supported constant; no invented weights. '}</tspan>
        <tspan x={16} dy={28}>None of the four groups above is constant.</tspan>
      </text>
    </MultiLabelCanvas>
  </MultiLabelFigure>;
}
