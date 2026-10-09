import { useState } from 'react';
import { categoricalIllustration, constrainedCube } from '../../data/multilabel-reading-flow-categorical-numeric-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const colors = ['#f0b45b', '#75adff', '#bc9aff'];
const coordinate = bits => ({
  x: 110 + bits[0] * 280 + bits[1] * 150,
  y: 365 - bits[1] * 80 - bits[2] * 205
});
function AnswerCube({
  state,
  selected,
  masses = false,
  condition = false
}) {
  return <>
    {state.states.flatMap(row => row.bits.flatMap((bit, column) => {
      if (bit) return [];
      const otherBits = [...row.bits];
      otherBits[column] = 1;
      const other = state.states[otherBits[0] * 4 + otherBits[1] * 2 + otherBits[2]];
      const a = coordinate(row.bits),
        b = coordinate(other.bits);
      return <path
        key={row.key + '-' + column}
        d={'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y}
        stroke={row.legal && other.legal ? colors[column] : '#635561'}
        strokeDasharray={row.legal && other.legal ? undefined : '5 6'}
      />;
    }))}
    {state.states.map(row => {
      const {
        x,
        y
      } = coordinate(row.bits);
      return <g key={row.key}>
        <circle
          cx={x}
          cy={y}
          r={25}
          fill="#111114"
          stroke={selected === row.index ? '#fff' : row.legal ? '#d5c7db' : '#ef8ca4'}
          strokeWidth={selected === row.index ? 3 : 1}
        />
        {row.bits.map((bit, column) => <text
          key={column}
          x={x - 16 + column * 16}
          y={y + 6}
          textAnchor="middle"
          style={{
            fill: colors[column]
          }}
        >
          {bit}
        </text>)}
        {!row.legal && <path d={'M' + (x - 28) + ',' + (y - 28) + ' L' + (x + 28) + ',' + (y + 28)} stroke="#ef8ca4" />}
        <text
          x={x}
          y={y + 50}
          textAnchor="middle"
          style={{
            paintOrder: 'stroke',
            stroke: '#050505',
            strokeWidth: 7,
            strokeLinejoin: 'round'
          }}
        >
          {masses ? condition ? row.legal ? number(state.conditional[row.index]) : 'excluded' : number(row.mass) : row.legal ? 'legal' : 'illegal'}
        </text>
      </g>;
    })}
    <text x={16} y={469}>A amber: horizontal · B blue: depth · C violet: vertical. Crossed vertices fail the rule.</text>
  </>;
}
export function CategoricalArraysFigure() {
  return <MultiLabelFigure
    job="D39"
    description="One input row feeds two distinct normalized class arrays with their own vocabularies and independent argmax destinations"
  >
    <MultiLabelCanvas
      width={736}
      height={535}
      title="Supplied categorical probability illustration: Fruit has three alternatives; Condition has two"
    >
      <text x={16} y={28}>Interface illustration, not recorded fitted probabilities. Shape: list of (1,3) and (1,2).</text>
      <circle cx={56} cy={267} r={26} fill="#111114" stroke="#e6d8ec" />
      <text x={56} y={273} textAnchor="middle">X</text>
      {categoricalIllustration.outputs.map((output, index) => {
        const y = 86 + index * 245;
        const winner = output.probabilities.indexOf(Math.max(...output.probabilities));
        return <g key={output.name}>
          <path d={'M82,267 H105 V' + (y + 38) + ' H128'} stroke="#d3c0dc" fill="none" />
          <text x={140} y={y - 12}>{output.name} vocabulary · width {output.classes.length}</text>
          {output.classes.map((name, column) => <g key={name}>
            <rect
              x={140 + column * 160}
              y={y}
              width={144}
              height={105}
              fill="#111114"
              stroke={output.colors[column]}
            />
            <rect
              x={141 + column * 160}
              y={y + 103 - output.probabilities[column] * 60}
              width={142}
              height={output.probabilities[column] * 60}
              fill={output.colors[column]}
              fillOpacity={.3}
            />
            <text
              x={212 + column * 160}
              y={y + 24}
              textAnchor="middle"
              style={{
                fill: output.colors[column]
              }}
            >
              {name}
            </text>
            <text x={212 + column * 160} y={y + 83} textAnchor="middle">
              {output.probabilities[column]}
            </text>
          </g>)}
          <path
            d={'M' + (212 + winner * 160) + ',' + (y + 105) + ' V' + (y + 135) + ' H626'}
            stroke={output.colors[winner]}
            fill="none"
          />
          <text x={140} y={y + 166}>Σ = 1 within {output.name}; argmax → {output.classes[winner]}</text>
        </g>;
      })}
    </MultiLabelCanvas>
    <FlowReadout>The two decoded illustration answers are apple and fresh. A fruit name competes only with another fruit name; a condition competes only within Condition. No five-class normalization combines them.</FlowReadout>
    <MultiLabelTable
      caption="Actual preserved categorical.py output: different names and fitted class-axis order"
    >
      <thead>
        <tr>
          <th>Output</th>
          <th>Recorded classes_</th>
          <th>Two-query probability shape</th>
          <th>Recorded query answers</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>First</th>
          <td>high, low, middle</td>
          <td>2 × 3</td>
          <td>low; middle</td>
        </tr>
        <tr>
          <th>Second</th>
          <td>cool, warm</td>
          <td>2 × 2</td>
          <td>warm; cool</td>
        </tr>
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
export function FeasibleCubeFigure() {
  const [rule, setRule] = useState('implication');
  const [selected, setSelected] = useState(3);
  const state = constrainedCube(rule, selected);
  const bits = state.candidate.bits;
  return <MultiLabelFigure
    job="D40"
    description="A literal three-bit action cube retains vertex identity while declared logical rules remove actual vertices"
  >
    <MultiLabelCanvas
      width={736}
      height={485}
      title="The feasible answer set is an explicit subset of the eight named ABC vertices"
    >
      <text x={16} y={30}>
        {rule === 'implication' ? 'C ⇒ A' : rule === 'exclusive' ? 'Not (A and B)' : rule === 'both' ? 'C ⇒ A and not (A and B)' : 'Conflicting A=1 and A=0 requirements'}
      </text>
      <AnswerCube state={state} selected={selected} />
    </MultiLabelCanvas>
    <FlowControls>
      <label>Declared logical rule<select aria-label="Declared logical rule" value={rule} onChange={event => setRule(event.target.value)}>
        <option value="implication">C requires A</option>
        <option value="exclusive">A/B mutually exclusive</option>
        <option value="both">Both rules</option>
        <option value="conflict">Conflicting A requirements</option>
      </select></label>
      <label>Selected candidate vector<select
        aria-label="Feasible cube candidate"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {state.states.map(row => <option key={row.key} value={row.index}>
          {row.key}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          setRule('implication');
          setSelected(3);
        }}
      >Reset feasible answers</button>
    </FlowControls>
    <FlowReadout>Selected {state.candidate.key}: C={bits[2]} and A={bits[0]}, so C⇒A is {!bits[2] || Boolean(bits[0]) ? 'true' : 'false'}; A and B are both one: {bits[0] && bits[1] ? 'yes' : 'no'}. {state.feasible.length ? state.feasible.length + ' vertices satisfy the selected rule; this candidate is ' + (state.candidate.legal ? 'legal.' : 'illegal.') : 'The feasible set is empty. A valid answer is unsupported; no probability or optimizer can resolve contradictory requirements.'}</FlowReadout>
  </MultiLabelFigure>;
}
export function ConstrainedRepairFigure() {
  const [selected, setSelected] = useState(3);
  const [condition, setCondition] = useState(false);
  const state = constrainedCube('implication', selected);
  return <MultiLabelFigure
    job="D41"
    description="Fixed complete-law masses distinguish selecting the best legal vertex, conditioning a law, and flipping the candidate's parent bit"
  >
    <MultiLabelCanvas
      width={736}
      height={485}
      title="Original complete joint law under C⇒A; optional displayed conditioning excludes illegal mass"
    >
      <text x={16} y={30}>
        {condition ? 'Displayed legal masses divide by feasible mass .55.' : 'Original masses in 000…111 order; Σ = 1.'}
      </text>
      <AnswerCube state={state} selected={selected} masses condition={condition} />
    </MultiLabelCanvas>
    <FlowControls>
      <label>Illegal candidate<select
        aria-label="Illegal repair candidate"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        <option value={1}>001</option>
        <option value={3}>011</option>
      </select></label>
      <label><input type="checkbox" checked={condition} onChange={event => setCondition(event.target.checked)} /> Show law conditioned on feasibility</label>
      <button
        type="button"
        onClick={() => {
          setSelected(3);
          setCondition(false);
        }}
      >Reset constrained decoding</button>
    </FlowControls>
    <FlowReadout>Original candidate {state.candidate.key} has mass {number(state.candidate.mass)} and is illegal. Restricting MAP selects {state.best.key} with original mass {number(state.best.mass)}. Adding A repairs {state.candidate.key} to {state.repair.key}, with original mass {number(state.repair.mass)}. Conditioning changes the legal probability scale, not this repair operation.</FlowReadout>
    <MultiLabelCanvas
      width={736}
      height={333}
      title="Two concrete operations on the same illegal candidate have different answer destinations"
    >
      <text x={16} y={30}>Candidate bits A/B/C = {state.candidate.key}; original mass {number(state.candidate.mass)}</text>
      <path d="M112,83 H188 V150 H270 V158 M188,83 H680 V199 H610" stroke="#d7c4e1" fill="none" />
      <circle cx={87} cy={83} r={25} fill="#111114" stroke="#ef8ca4" />
      <text
        x={87}
        y={89}
        textAnchor="middle"
        style={{
          fill: '#ef8ca4'
        }}
      >
        {state.candidate.key}
      </text>
      <text x={203} y={127}>Choose highest legal mass</text>
      <text x={458} y={127}>Set A ← 1 because C=1</text>
      <rect x={205} y={158} width={130} height={82} fill="#111114" stroke="#f0b45b" />
      <text
        x={270}
        y={191}
        textAnchor="middle"
        style={{
          fill: '#f0b45b'
        }}
      >MAP {state.best.key}</text>
      <text x={270} y={224} textAnchor="middle">original .2</text>
      <rect x={480} y={158} width={130} height={82} fill="#111114" stroke="#75adff" />
      <text
        x={545}
        y={191}
        textAnchor="middle"
        style={{
          fill: '#75adff'
        }}
      >repair {state.repair.key}</text>
      <text x={545} y={224} textAnchor="middle">original {number(state.repair.mass)}</text>
      <text x={16} y={286}>Legal mass = .55; conditioned MAP probability = .2/.55 = {number(.2 / .55)}.</text>
      <text x={16} y={324}>Repair chooses a bit edit. It is neither MAP nor assignment of a new joint law.</text>
    </MultiLabelCanvas>
    <MultiLabelTable
      caption="Every original and conditioned mass; unavailable entries are excluded, not zero estimates"
    >
      <thead>
        <tr>
          <th>ABC</th>
          <th>Original mass</th>
          <th>C⇒A</th>
          <th>Conditioned legal mass</th>
        </tr>
      </thead>
      <tbody>
        {state.states.map(row => <tr key={row.key}>
          <th>
            {row.key}
          </th>
          <td>
            {row.mass}
          </td>
          <td>
            {row.legal ? 'Legal' : 'Illegal'}
          </td>
          <td>
            {row.legal ? number(state.conditional[row.index]) : 'Excluded'}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
  </MultiLabelFigure>;
}
