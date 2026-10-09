import { useId, useState } from 'react';
import { labelIdentities as labels } from '../../data/multilabel-reading-flow-foundation-models.js';
import { virtualDefaultDirections, virtualPairs, virtualTournament } from '../../data/multilabel-reading-flow-neighbour-rank-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable } from './MultiLabelReadingFlowControls.jsx';
const names = ['A', 'B', 'C', 'V'];
const colors = [labels[0].color, labels[1].color, labels[2].color, '#d1cbd5'];
const positions = [[150, 130], [540, 130], [150, 395], [540, 395]];
function Arrow({
  winner,
  loser,
  selected,
  marker
}) {
  const [x1, y1] = positions[winner],
    [x2, y2] = positions[loser];
  const length = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / length,
    uy = (y2 - y1) / length;
  return <path
    d={`M${x1 + ux * 29},${y1 + uy * 29} L${x2 - ux * 36},${y2 - uy * 36}`}
    fill="none"
    stroke={selected ? '#fff' : colors[winner]}
    strokeWidth={selected ? 3 : 1.5}
    markerEnd={`url(#${marker})`}
  />;
}
export function VirtualRelevanceFigure() {
  const [selected, setSelected] = useState(0);
  const [directions, setDirections] = useState([...virtualDefaultDirections]);
  const state = virtualTournament(directions);
  const marker = useId().replaceAll(':', '');
  return <MultiLabelFigure
    job="D38"
    description="Actual pair outcomes each add one vote; only real labels strictly above virtual V's vote count pass the learned relevance cutoff"
  >
    <MultiLabelCanvas
      width={736}
      height={570}
      title="Illustrative four-way query tournament: winner arrows carry one vote; V defines relevance rather than a probability"
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10" fill="context-stroke" />
        </marker>
      </defs>
      <text x={16} y={30}>Query comparisons · arrow points from winner to loser</text>
      {state.edges.map((edge, index) => <Arrow key={index} {...edge} selected={selected === index} marker={marker} />)}
      {names.map((name, index) => <g key={name}>
        <circle
          cx={positions[index][0]}
          cy={positions[index][1]}
          r={27}
          fill="#111114"
          stroke={colors[index]}
        />
        <text
          x={positions[index][0]}
          y={positions[index][1] + 6}
          textAnchor="middle"
          style={{
            fill: colors[index]
          }}
        >
          {name}
        </text>
        <text x={positions[index][0]} y={positions[index][1] + (index < 2 ? -55 : 66)} textAnchor="middle">{state.votes[index]} votes</text>
      </g>)}
      <text x={16} y={510}>Strictly above V={state.votes[3]}: {names.slice(0, 3).filter((name, index) => state.decisions[index]).join(', ') || 'none'}</text>
      <text x={16} y={554}>Stable displayed vote order: {state.order.map(index => names[index]).join(', ')}</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Selected comparison<select
        aria-label="Virtual ranking comparison"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {virtualPairs.map((pair, index) => <option key={index} value={index}>{names[pair[0]]} / {names[pair[1]]}</option>)}
      </select></label>
      <label>Preferred label<select
        aria-label="Virtual ranking preferred label"
        value={directions[selected]}
        onChange={event => setDirections(values => values.map((value, index) => index === selected ? Number(event.target.value) : value))}
      >
        {virtualPairs[selected].map((column, local) => <option key={column} value={local}>
          {names[column]}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setSelected(0);
          setDirections([...virtualDefaultDirections]);
        }}
      >Reset virtual cutoff</button>
    </FlowControls>
    <FlowReadout>Votes A/B/C/V are {state.votes.join(', ')}; named A/B/C decisions are {state.decisions.join('')}. A label tied with V is excluded. {state.cycles.length ? `Directed cycles: ${state.cycles.map(cycle => [...cycle, cycle[0]].map(index => names[index]).join(' > ')).join('; ')}.` : 'This tournament has no directed triangle cycle.'} Ordering a vote tie by identity does not remove cycles.</FlowReadout>
    <MultiLabelTable caption="Each current comparison contributes exactly one winner vote">
      <thead>
        <tr>
          <th>Comparison</th>
          <th>Preferred label</th>
          <th>Added vote</th>
        </tr>
      </thead>
      <tbody>
        {state.edges.map((edge, index) => <tr key={index}>
          <th>{names[edge.pair[0]]} / {names[edge.pair[1]]}</th>
          <td>{names[edge.winner]} &gt; {names[edge.loser]}</td>
          <td>+1 to {names[edge.winner]}</td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelTable
      caption="Training truth A/C creates five relevance incidences; this is distinct from the query tournament"
    >
      <thead>
        <tr>
          <th>Relevant–irrelevant pair</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {[['A', 'B'], ['C', 'B'], ['A', 'V'], ['C', 'V'], ['V', 'B']].map(([a, b]) => <tr key={a + b}>
          <th>{a} &gt; {b}</th>
          <td>
            {a === 'V' || b === 'V' ? 'Relevance boundary' : 'Real label ranking'}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <figcaption>The illustrated outcomes are a hand tournament. The complete program below fits and records its own supported pair comparisons. A virtual relevance cutoff does not assert calibrated probabilities.</figcaption>
  </MultiLabelFigure>;
}
