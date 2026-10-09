import { useState } from 'react';
import { labelIdentities as labels, labelOrders } from '../../data/multilabel-reading-flow-foundation-models.js';
import { coverageWitness, labelsetVotes, powersetRows, powersetVocabulary, publishedLabelsetVotes } from '../../data/multilabel-reading-flow-labelset-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, MultiLabelVector, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
function Bit({
  x,
  y,
  column,
  bit,
  selected = false
}) {
  const color = labels[column].color;
  return <g>
    <circle
      cx={x}
      cy={y}
      r={16}
      fill={bit ? color : '#111114'}
      stroke={selected ? '#fff' : color}
      strokeWidth={selected ? 3 : 1}
    />
    <text
      x={x}
      y={y + 6}
      textAnchor="middle"
      style={{
        fill: bit ? '#141117' : color
      }}
    >
      {bit}
    </text>
  </g>;
}
export function PowersetVocabularyFigure() {
  const [order, setOrder] = useState('ABC');
  const [selected, setSelected] = useState('000');
  const state = powersetVocabulary(order, selected);
  return <MultiLabelFigure
    job="D30"
    description="Four observed training vectors form a lexicographically sorted categorical vocabulary; a fifth candidate has no category"
  >
    <MultiLabelCanvas
      width={736}
      height={545}
      title="Original A/B/C output identities survive storage permutation, categorical encoding and inverse decoding"
    >
      <text x={16} y={30}>Known training rows</text>
      <text x={267} y={30}>Stored {order}</text>
      <text x={458} y={30}>Category</text>
      <text x={590} y={30}>Decode ABC</text>
      {state.rows.map((row, index) => {
        const y = 87 + index * 84;
        return <g key={row.original}>
          <text x={16} y={y + 6}>r{row.row}</text>
          {[...row.original].map((bit, column) => <Bit
            key={column}
            x={79 + column * 50}
            y={y}
            column={column}
            bit={Number(bit)}
            selected={selected === row.original}
          />)}
          <path d={`M201,${y} H244 M405,${y} H449 M524,${y} H568`} stroke="#bdb3c8" fill="none" />
          {[...row.stored].map((bit, local) => <Bit
            key={local}
            x={276 + local * 50}
            y={y}
            column={'ABC'.indexOf(order[local])}
            bit={Number(bit)}
          />)}
          <rect x={456} y={y - 23} width={64} height={46} rx={5} fill="#111114" stroke="#c2b8ca" />
          <text x={488} y={y + 6} textAnchor="middle">
            {row.id}
          </text>
          {[...state.decoded[row.id]].map((bit, column) => <Bit key={column} x={590 + column * 50} y={y} column={column} bit={Number(bit)} />)}
        </g>;
      })}
      <text x={16} y={423}>Selected {selected} → stored {state.stored}</text>
      <path d="M270,417 H351" stroke={state.id < 0 ? '#ef8ca4' : '#ddd2e4'} />
      <text x={369} y={423}>
        {state.id < 0 ? 'No observed category' : `Vocabulary category ${state.id}`}
      </text>
      <text x={16} y={479}>A amber · B blue · C violet. Category ID is a name, not a size.</text>
      <text x={16} y={518}>000 is a known empty labelset. It remains a legitimate category.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Selected original vector<select
        aria-label="Powerset selected vector"
        value={selected}
        onChange={event => setSelected(event.target.value)}
      >
        {[...powersetRows, '101'].map(vector => <option key={vector}>
          {vector}
        </option>)}
      </select></label>
      <label>Storage order<select
        aria-label="Powerset output order"
        value={order}
        onChange={event => setOrder(event.target.value)}
      >
        {labelOrders.map(value => <option key={value}>
          {value}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setOrder('ABC');
          setSelected('000');
        }}
      >Reset powerset vocabulary</button>
    </FlowControls>
    <FlowReadout>The train-only vocabulary in {order} order is {state.vocabulary.join(', ')}. {state.id < 0 ? `Candidate ${selected} is unsupported by this vocabulary; a classifier selecting one of these categories cannot emit it.` : `Selected ${selected} has categorical ID ${state.id} and decodes back to ${state.decoded[state.id]}.`} Reordering storage preserves the four original output vectors.</FlowReadout>
  </MultiLabelFigure>;
}
function VoteMatrix({
  groups,
  state,
  selected,
  title
}) {
  return <MultiLabelCanvas width={824} height={groups.length * 58 + 260} title={title}>
    <text x={16} y={30}>Decoded local votes</text>
    {labels.map((label, column) => <text
      key={label.id}
      x={251 + column * 100}
      y={30}
      textAnchor="middle"
      style={{
        fill: label.color
      }}
    >
      {label.id}
    </text>)}
    {groups.map((group, row) => {
      const y = 78 + row * 58;
      return <g key={group.name} opacity={group.included === false ? .35 : 1}>
        <text x={16} y={y + 6}>h{row + 1} · {group.name}</text>
        {labels.map((label, column) => {
          const local = group.columns.indexOf(column);
          const x = 251 + column * 100;
          return local < 0 ? <text key={column} x={x} y={y + 6} textAnchor="middle">—</text> : <g key={column}>
            <path
              d={`M${x + 16},${y} H${x + 28} V${groups.length * 58 + 52} H${x} V${groups.length * 58 + 62}`}
              stroke={label.color}
              fill="none"
            />
            <Bit x={x} y={y} column={column} bit={group.bits[local]} selected={row === selected} />
          </g>;
        })}
      </g>;
    })}
    {labels.map((label, column) => {
      const x = 251 + column * 100;
      const base = groups.length * 58 + 82;
      return <g key={label.id}>
        <path d={`M${x},${base - 40} V${base - 20}`} stroke={label.color} fill="none" />
        <circle cx={x} cy={base} r={20} fill="#111114" stroke={label.color} />
        <text x={x} y={base + 6} textAnchor="middle">Σ</text>
        <text x={x} y={base + 48} textAnchor="middle">{state.positive[column]} / {state.coverage[column]}</text>
        <text x={x} y={base + 85} textAnchor="middle">
          {state.means[column] === null ? 'n/a' : number(state.means[column])}
        </text>
        <circle
          cx={x}
          cy={base + 128}
          r={18}
          fill="#111114"
          stroke={label.color}
          strokeDasharray={state.decisions[column] === null ? '3 3' : undefined}
        />
        <text x={x} y={base + 134} textAnchor="middle">
          {state.decisions[column] === null ? '?' : state.decisions[column]}
        </text>
      </g>;
    })}
    <text x={16} y={groups.length * 58 + 136}>Positive / coverage</text>
    <text x={16} y={groups.length * 58 + 172}>Vote mean</text>
    <text x={16} y={groups.length * 58 + 220}>Strict-threshold bit</text>
  </MultiLabelCanvas>;
}
export function PublishedLabelsetVotesFigure() {
  const [selected, setSelected] = useState(0);
  const [vectors, setVectors] = useState(publishedLabelsetVotes.map(group => [...group.bits]));
  const [revision, setRevision] = useState(0);
  const groups = publishedLabelsetVotes.map((group, index) => ({
    ...group,
    bits: vectors[index]
  }));
  // The generic vote reduction is shared with the coverage witness; no optimizer runs.
  // Preserve edits to all groups when selection changes; reduce their current bits.
  const total = labelsetVotes(groups);
  return <MultiLabelFigure
    job="D32"
    description="Seven published illustrative group memberships route decoded bits to each label's own sum and coverage denominator"
  >
    <VoteMatrix
      groups={groups}
      state={total}
      selected={selected}
      title="RAkEL Table 1 illustrative votes; a dash means this group does not vote on that label"
    />
    <FlowControls>
      <label>Selected hand-table group<select
        aria-label="Published vote group"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {groups.map((group, index) => <option key={group.name} value={index}>h{index + 1} · {group.name}</option>)}
      </select></label>
      <MultiLabelVector
        label={`Decoded ${groups[selected].name} local bits`}
        values={vectors[selected]}
        min={0}
        max={1}
        integer
        revision={`${revision}:${selected}`}
        onChange={bits => setVectors(values => values.map((value, index) => index === selected ? bits : value))}
      />
      <button
        type="button"
        onClick={() => {
          setSelected(0);
          setVectors(publishedLabelsetVotes.map(group => [...group.bits]));
          setRevision(value => value + 1);
        }}
      >Reset published hand table</button>
    </FlowControls>
    <FlowReadout>Coverage stays {total.coverage.join(', ')}; positives are {total.positive.join(', ')}. Divide label by label to get {total.means.map(value => number(value)).join(', ')}, then use strict &gt;.5 to obtain {total.decisions.join('')}. A missing group membership contributes neither a vote nor a denominator count.</FlowReadout>
    <figcaption>Adapted from <a
      href="https://www.researchgate.net/publication/220073602_Random_k-Labelsets_for_Multilabel_Classification"
    >Tsoumakas et al., RAkEL Table 1</a>, with λ₁…λ₆ named A…F. These are an illustrative voting table, distinct from the recorded 16-row fitted systems.</figcaption>
  </MultiLabelFigure>;
}
export function CoverageBoundaryFigure() {
  const [selected, setSelected] = useState(0);
  const [included, setIncluded] = useState(true);
  const [threshold, setThreshold] = useState(.5);
  const [revision, setRevision] = useState(0);
  const state = coverageWitness(selected, included, threshold);
  return <MultiLabelFigure
    job="D33"
    description="Named subset hyperedges show coverage loss; a changed F local vote exposes the strict half-vote boundary"
  >
    <MultiLabelCanvas
      width={736}
      height={385}
      title="Unfitted identity witness: subset memberships connect to named A/B/C/D/E/F output sockets"
    >
      {labels.map((label, column) => <g key={label.id}>
        <circle
          cx={96 + column * 108}
          cy={45}
          r={20}
          fill="#111114"
          stroke={label.color}
          strokeDasharray={state.coverage[column] ? undefined : '3 3'}
        />
        <text
          x={96 + column * 108}
          y={51}
          textAnchor="middle"
          style={{
            fill: label.color
          }}
        >
          {label.id}
        </text>
      </g>)}
      {state.groups.map((group, row) => {
        const y = 137 + row * 86;
        return <g key={group.name} opacity={group.included ? 1 : .3}>
          <text x={16} y={y + 6}>
            {group.name}
          </text>
          {group.columns.map((column, local) => <g key={column}>
            <path
              d={`M${96 + column * 108},65 V${y - 20}`}
              stroke={labels[column].color}
              fill="none"
              strokeDasharray={row === selected ? undefined : '3 4'}
            />
            <Bit
              x={96 + column * 108}
              y={y}
              column={column}
              bit={group.bits[local]}
              selected={row === selected}
            />
          </g>)}
        </g>;
      })}
      <text x={16} y={379}>CEF’s F vote is changed to 0: F has (1+0)/2=.5 before removal.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Selected witness subset<select
        aria-label="Coverage subset"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {state.groups.map((group, index) => <option key={group.name} value={index}>
          {group.name}
        </option>)}
      </select></label>
      <label><input
        type="checkbox"
        aria-label="Include selected witness subset"
        checked={included}
        onChange={event => setIncluded(event.target.checked)}
      /> Include selected subset</label>
      <MultiLabelQuantity
        label="Strict vote threshold"
        value={threshold}
        min={0}
        max={1}
        step={.05}
        revision={revision}
        onChange={setThreshold}
      />
      <button
        type="button"
        onClick={() => {
          setSelected(0);
          setIncluded(true);
          setThreshold(.5);
          setRevision(value => value + 1);
        }}
      >Reset coverage boundary</button>
    </FlowControls>
    <MultiLabelTable caption="Zero coverage is unsupported; the threshold is applied only to defined means">
      <thead>
        <tr>
          <th>Named output</th>
          <th>Contributing decoded bits</th>
          <th>Positive / coverage</th>
          <th>Mean</th>
          <th>Mean &gt; threshold</th>
        </tr>
      </thead>
      <tbody>
        {labels.map((label, column) => <tr key={label.id}>
          <th
            style={{
              color: label.color
            }}
          >
            {label.id}
          </th>
          <td>
            {state.contributions[column].map(row => `${row.name}:${row.bit}`).join(' + ') || 'No covering group'}
          </td>
          <td>{state.positive[column]} / {state.coverage[column]}</td>
          <td>
            {state.means[column] === null ? 'Unsupported' : number(state.means[column])}
          </td>
          <td>
            {state.decisions[column] === null ? 'Unsupported; no decision' : state.decisions[column]}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <FlowReadout>At strict threshold {number(threshold)}, named decisions are {state.decisions.map(value => value === null ? '?' : value).join('')}. {state.coverage.some(value => value === 0) ? 'A question mark means no covering group, not a negative prediction.' : 'Every label is covered.'} With all groups included, F’s .5 mean is negative at the default strict &gt;.5 rule. This changed-vote witness does not assert fitted coefficients.</FlowReadout>
    <MultiLabelCanvas
      width={736}
      height={495}
      title="Actual recorded constructors: disjoint ACDF/BE and overlapping ADF/BCE/BDE/AEF memberships"
    >
      {['Disjoint · a last shorter group', 'Overlapping · four distinct groups'].map((title, side) => <g key={title} transform={`translate(${16 + side * 372},0)`}>
        <text x={0} y={32}>
          {title}
        </text>
        {labels.map((label, column) => <g key={label.id}>
          <circle cx={24 + column * 55} cy={90} r={17} fill="#111114" stroke={label.color} />
          <text
            x={24 + column * 55}
            y={96}
            textAnchor="middle"
            style={{
              fill: label.color
            }}
          >
            {label.id}
          </text>
        </g>)}
        {(side ? [[0, 3, 5], [1, 2, 4], [1, 3, 4], [0, 4, 5]] : [[0, 2, 3, 5], [1, 4]]).map((columns, row) => <g key={row}>
          <text x={0} y={164 + row * 72}>
            {columns.map(column => labels[column].id).join('')}
          </text>
          {columns.map(column => <g key={column}>
            <path
              d={`M${24 + column * 55},109 V${181 + row * 72}`}
              stroke={labels[column].color}
              fill="none"
            />
            <circle cx={24 + column * 55} cy={181 + row * 72} r={5} fill={labels[column].color} />
          </g>)}
        </g>)}
      </g>)}
      <text x={16} y={450}>Left: one group per label. Right: coverage 2,2,1,2,3,2.</text>
      <text x={16} y={486}>These memberships differ from the changed-vote witness above.</text>
    </MultiLabelCanvas>
    <figcaption>Removing a witness vote changes its aggregation only. It does not refit a categorical model, replace a training vocabulary or turn unsupported labels into negative classes. The fitted systems’ complete class mappings remain in the preceding system view.</figcaption>
  </MultiLabelFigure>;
}
