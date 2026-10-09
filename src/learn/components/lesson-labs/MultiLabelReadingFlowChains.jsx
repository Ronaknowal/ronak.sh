import { useState } from 'react';
import { labelIdentities, labelOrders } from '../../data/multilabel-reading-flow-foundation-models.js';
import { chainAnatomy, savedLibraryChain } from '../../data/multilabel-reading-flow-chain-models.js';
import { factorBinaryLaw, greedyBinaryLaw, jointVectors } from '../../data/multilabel-reading-flow-joint-models.js';
import { ConnectedLawReadout, useMultiLabelJointLaw } from './MultiLabelReadingFlowJoint.jsx';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const labels = labelIdentities.slice(0, 3);
const identity = id => labels.find(label => label.id === id);
function ChainAnatomyPanel({
  state,
  training
}) {
  return <MultiLabelCanvas
    width={1020}
    height={650}
    title={`${training ? 'Training' : 'Serving'}: original features and ${training ? 'true' : 'predicted'} prefixes enter weighted classifier heads`}
  >
    <text x={16} y={28}>
      {training ? 'training rows: copied true prefix' : 'serving query: earlier predictions only'}
    </text>
    <path d="M62,56 V570" stroke="#aaa3b1" />
    <text x={15} y={620}>X: d original features</text>
    {!training && state.stages.flatMap(stage => stage.prefix.map((id, prior) => {
      const sourceY = 111 + state.order.indexOf(id) * 185;
      const targetY = 111 + stage.stage * 185;
      const portX = 191 + prior * 128;
      const lane = 960 + prior * 24;
      return <path
        key={`${stage.id}-${id}`}
        data-prediction-copy={`${id}-to-${stage.id}`}
        d={`M798,${sourceY + 15} V${sourceY + 30} H${lane} V${targetY + 95 + prior * 6} H${portX} V${targetY + 60}`}
        stroke={identity(id).color}
        fill="none"
      />;
    }))}
    {state.stages.map(stage => {
      const y = 111 + stage.stage * 185;
      const label = identity(stage.id);
      return <g key={stage.id}>
        <path d={`M62,${y} H145 V${y - 27} H393`} fill="none" stroke="#aaa3b1" />
        <text x={163} y={y - 43}>X · weights w_{stage.id},x</text>
        {stage.prefix.map((id, prior) => <g
          key={id}
          style={{
            color: identity(id).color
          }}
        >
          <circle cx={191 + prior * 128} cy={y + 47} r={13} fill="#111114" stroke={identity(id).color} />
          <text x={191 + prior * 128} y={y + 82} textAnchor="middle">
            {training ? `true ${id}` : `hat ${id}`}
          </text>
          <path
            d={`M${191 + prior * 128},${y + 34} V${y + 15 + prior * 7} H393`}
            stroke={identity(id).color}
            strokeDasharray={training ? '5 4' : undefined}
            fill="none"
          />
          <text x={181 + prior * 128} y={y + 124}>× c_{stage.id},{id}</text>
        </g>)}
        <circle cx={417} cy={y} r={25} fill="#111114" stroke={label.color} />
        <text x={417} y={y + 6} textAnchor="middle">Σ</text>
        <path d={`M417,${y - 25} V${y - 54}`} stroke="#aaa3b1" />
        <text x={444} y={y - 49}>bias b_{stage.id}</text>
        <path d={`M442,${y} H627`} stroke={label.color} />
        <text
          x={494}
          y={y - 17}
          style={{
            color: label.color
          }}
        >logit z_{stage.id}</text>
        <circle cx={650} cy={y} r={23} fill="#111114" stroke={label.color} />
        <text x={650} y={y + 6} textAnchor="middle">σ</text>
        <path d={`M673,${y} H783`} stroke={label.color} />
        <text x={690} y={y - 17}>p≥.5</text>
        <circle cx={798} cy={y} r={15} fill="#111114" stroke={label.color} />
        <text
          x={835}
          y={y + 6}
          style={{
            color: label.color
          }}
        >{training ? 'fitted' : 'hat'} {stage.id} · {label.name}</text>
        <text x={494} y={y + 46}>input width d{stage.stage ? `+${stage.stage}` : ''}</text>
      </g>;
    })}
  </MultiLabelCanvas>;
}
export function ChainAnatomyFigure() {
  const [order, setOrder] = useState('ABC');
  const state = chainAnatomy(order);
  return <MultiLabelFigure
    job="D20"
    description="A chain's real X, prefix, weight, bias, probability and output ports differ between training and serving"
  >
    <ChainAnatomyPanel state={state} training />
    <ChainAnatomyPanel state={state} training={false} />
    <MultiLabelTable caption="Restore stage-order answers to the original named output schema">
      <thead>
        <tr>
          <th>Original output column</th>
          <th>Read from stage</th>
          <th>Stage prefix</th>
        </tr>
      </thead>
      <tbody>
        {state.restore.map(row => <tr key={row.id}>
          <th
            style={{
              color: identity(row.id).color
            }}
          >{row.id} · {identity(row.id).name}</th>
          <td>
            {row.stage + 1}
          </td>
          <td>
            {state.stages[row.stage].prefix.join(', ') || 'none'}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <FlowControls>
      <label>Chain order<select aria-label="Chain anatomy order" value={order} onChange={event => setOrder(event.target.value)}>
        {labelOrders.map(value => <option key={value}>
          {value}
        </option>)}
      </select></label>
      <button type="button" onClick={() => setOrder('ABC')}>Reset chain order</button>
    </FlowControls>
    <FlowReadout>Order {order} uses widths d, d+1 and d+2. Training copies true predecessor columns along dashed wires; serving uses predicted predecessor ports along solid wires. The restore map returns A/B/C to their original identities. Symbols name learned parameters; this anatomy does not supply a new fit.</FlowReadout>
  </MultiLabelFigure>;
}
function ProbabilityTree({
  law,
  order,
  level = 2,
  greedy = null,
  selected = null,
  map = null,
  title
}) {
  const factor = factorBinaryLaw(law, order);
  const firstId = order[0],
    secondId = order[1];
  if (law.empty) return <p>No probability tree: the connected counts have total zero.</p>;
  return <MultiLabelCanvas width={1080} height={590} title={title}>
    <circle cx={48} cy={252} r={18} stroke="#eee8f1" fill="#111114" />
    <text x={48} y={258} textAnchor="middle">1</text>
    <text x={16} y={31}>order {order} · numeric edges are factors</text>
    {level >= 1 && factor.first.map(branch => {
      const y = 143 + 228 * branch.bit;
      const firstChosen = greedy?.first?.bit === branch.bit;
      return <g key={branch.bit}>
        <path
          d={`M66,252 L348,${y}`}
          stroke={firstChosen ? '#fff' : identity(firstId).color}
          strokeWidth={firstChosen ? 3 : 1}
        />
        <text x={114} y={branch.bit ? 345 : 133}>P({firstId}{branch.bit})={number(branch.mass)}</text>
        <circle cx={365} cy={y} r={16} stroke={identity(firstId).color} fill="#111114" />
        <text
          x={365}
          y={y + 41}
          textAnchor="middle"
          style={{
            color: identity(firstId).color
          }}
        >{firstId}={branch.bit}</text>
        {level >= 2 && branch.next.map(leaf => {
          const leafY = 65 + (branch.bit * 2 + leaf.bit) * 145;
          const chosen = greedy?.leaf?.index === leaf.index;
          return <g key={leaf.index}>
            <path
              d={`M381,${y} L760,${leafY}`}
              stroke={chosen ? '#fff' : identity(secondId).color}
              strokeWidth={chosen ? 3 : 1}
            />
            <text x={420} y={leaf.bit ? Math.max(y, leafY) + 35 : Math.min(y, leafY) - 35}>{secondId}{leaf.bit} | {firstId}{branch.bit}: {leaf.conditional === null ? 'undefined · unused' : number(leaf.conditional)}</text>
            <circle
              cx={776}
              cy={leafY}
              r={16}
              stroke={selected === leaf.index ? '#fff' : identity(secondId).color}
              strokeWidth={selected === leaf.index ? 3 : 1}
              fill="#111114"
            />
            <text x={810} y={leafY + 6}>leaf {leaf.vector.join('')} · mass {number(leaf.mass)}{map?.index === leaf.index ? ' ★ MAP' : ''}</text>
            <text x={810} y={leafY + 36}>
              {leaf.conditional === null ? 'zero × unused = zero' : `${number(branch.mass)} × ${number(leaf.conditional)}`}
            </text>
          </g>;
        })}
      </g>;
    })}
    <text x={16} y={585}>
      {level === 0 ? 'Root mass is one. Expand to expose both outcomes at each stage.' : level === 1 ? 'Both first-bit outcomes remain; expand again for conditional branches.' : 'Every original-order leaf appears once; leaf masses sum to one.'}
    </text>
  </MultiLabelCanvas>;
}
export function ChainFactorizationFigure() {
  const {
    law,
    resetLaw
  } = useMultiLabelJointLaw();
  const [order, setOrder] = useState('AB');
  const [level, setLevel] = useState(2);
  const [revision, setRevision] = useState(0);
  const factor = factorBinaryLaw(law, order);
  return <MultiLabelFigure
    job="D21"
    description="Two complementary branch probabilities at each prefix multiply to the same complete joint law in either order"
  >
    <ConnectedLawReadout />
    <ProbabilityTree
      law={law}
      order={order}
      level={level}
      title={`Full conditional probability factorization ${order}`}
    />
    {!law.empty && level === 2 && <MultiLabelTable
      caption="Every leaf has a first mass and a conditional factor; unused zero branches do not divide by zero"
    >
      <thead>
        <tr>
          <th>Prefix</th>
          <th>First mass</th>
          <th>Second factor</th>
          <th>Original-order leaf</th>
          <th>Product</th>
        </tr>
      </thead>
      <tbody>
        {factor.first.flatMap(branch => branch.next.map(leaf => <tr key={leaf.index}>
          <th>{order[0]}={branch.bit}</th>
          <td>
            {number(branch.mass)}
          </td>
          <td>
            {leaf.conditional === null ? 'undefined · unused' : number(leaf.conditional)}
          </td>
          <td>
            {leaf.vector.join('')}
          </td>
          <td>
            {number(leaf.mass)}
          </td>
        </tr>))}
      </tbody>
    </MultiLabelTable>}
    <FlowControls>
      <MultiLabelQuantity
        label="Expanded tree level"
        value={level}
        min={0}
        max={2}
        integer
        revision={revision}
        onChange={setLevel}
      />
      <label>Factor order<select
        aria-label="Probability factor order"
        value={order}
        onChange={event => setOrder(event.target.value)}
      >
        <option>AB</option>
        <option>BA</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          resetLaw();
          setOrder('AB');
          setLevel(2);
          setRevision(value => value + 1);
        }}
      >Reset law and factorization</button>
    </FlowControls>
    <FlowReadout>
      {law.empty ? 'No factorization exists for total-zero counts.' : `Order ${order} refactors the same four original-order masses [${law.masses.map(value => number(value)).join(', ')}]. A conditional below a zero-mass prefix is undefined and unused; its descendant mass remains zero.`}
    </FlowReadout>
  </MultiLabelFigure>;
}
export function GreedyMapFigure() {
  const {
    law,
    resetLaw
  } = useMultiLabelJointLaw();
  const [order, setOrder] = useState('AB');
  const [selected, setSelected] = useState(3);
  const state = greedyBinaryLaw(law, order);
  return <MultiLabelFigure
    job="D22"
    description="Locally strongest conditional edges and globally strongest complete leaf are separately identified on two actual trees"
  >
    <ConnectedLawReadout />
    <p>Greedy path · white edges choose one branch at a time.</p>
    <ProbabilityTree
      law={law}
      order={order}
      greedy={state}
      selected={selected}
      title={`Greedy ${order} path with its actual branch masses`}
    />
    <p>Exact MAP comparison · the star marks the largest complete leaf mass.</p>
    <ProbabilityTree
      law={law}
      order={order}
      map={state.map}
      selected={selected}
      title={`All ${order} leaves compared by complete mass, without local pruning`}
    />
    <FlowControls>
      <label>Greedy order<select aria-label="Greedy chain order" value={order} onChange={event => setOrder(event.target.value)}>
        <option>AB</option>
        <option>BA</option>
      </select></label>
      <label>Inspect complete candidate<select
        aria-label="Greedy candidate leaf"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {jointVectors.map((vector, index) => <option key={index} value={index}>
          {vector.join('')}
        </option>)}
      </select></label>
      <button
        type="button"
        onClick={() => {
          resetLaw();
          setOrder('AB');
          setSelected(3);
        }}
      >Reset law and greedy comparison</button>
    </FlowControls>
    <FlowReadout>
      {law.empty ? 'The connected total-zero law has no greedy path or MAP leaf.' : `Greedy ${order} returns ${state.leaf.vector.join('')} at mass ${number(state.leaf.mass)}; exact MAP returns ${state.map.vector.join('')} at mass ${number(state.map.mass)}. The inspected ${jointVectors[selected].join('')} has mass ${number(law.masses[selected])}. A positive bit wins an exact local tie; global MAP uses the first lexicographic leaf.`}
    </FlowReadout>
  </MultiLabelFigure>;
}
export function MarginalPathsFigure() {
  const {
    law,
    resetLaw
  } = useMultiLabelJointLaw();
  const [output, setOutput] = useState(1);
  const [bit, setBit] = useState(1);
  const selected = jointVectors.map((vector, index) => ({
    vector,
    index
  })).filter(row => row.vector[output] === bit);
  const mass = law.empty ? null : selected.reduce((sum, row) => sum + law.masses[row.index], 0);
  const order = output === 1 ? 'AB' : 'BA';
  const factor = factorBinaryLaw(law, order);
  return <MultiLabelFigure
    job="D23"
    description="A marginal sums all matching complete leaves rather than choosing one predecessor-conditioned probability"
  >
    <ConnectedLawReadout />
    {!law.empty && <>
      <MultiLabelCanvas
        width={840}
        height={390}
        title={`Sum all leaves with ${labels[output].id}=${bit}; preserve both predecessor paths`}
      >
        {jointVectors.map((vector, index) => <g key={index}>
          <circle
            cx={40}
            cy={55 + index * 83}
            r={15}
            fill="#111114"
            stroke={vector[output] === bit ? labels[output].color : '#77707f'}
          />
          <text x={76} y={61 + index * 83}>leaf {vector.join('')} · {number(law.masses[index])}</text>
          {vector[output] === bit && <path d={`M280,${55 + index * 83} H462 V183 H536`} stroke={labels[output].color} fill="none" />}
        </g>)}
        <circle cx={560} cy={183} r={23} fill="#111114" stroke={labels[output].color} />
        <text x={560} y={189} textAnchor="middle">Σ</text>
        <text
          x={600}
          y={189}
          style={{
            color: labels[output].color
          }}
        >P({labels[output].id}{bit})={number(mass)}</text>
        <text x={16} y={380}>All matching leaves contribute; the unused bit values are not overwritten.</text>
      </MultiLabelCanvas>
      <MultiLabelTable
        caption="Marginal probability and two predecessor-conditioned probabilities are different quantities"
      >
        <thead>
          <tr>
            <th>Quantity</th>
            <th>Numerator / denominator</th>
            <th>Probability</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Integrated P({labels[output].id}={bit})</th>
            <td>
              {selected.map(row => number(law.masses[row.index])).join(' + ')}
            </td>
            <td>
              {number(mass)}
            </td>
          </tr>
          {factor.first.map(branch => {
            const leaf = branch.next[bit];
            return <tr key={branch.bit}>
              <th>P({labels[output].id}={bit} | {order[0]}={branch.bit})</th>
              <td>{number(leaf.mass)} / {number(branch.mass)}</td>
              <td>
                {leaf.conditional === null ? 'undefined · unused' : number(leaf.conditional)}
              </td>
            </tr>;
          })}
        </tbody>
      </MultiLabelTable>
    </>}
    <FlowControls>
      <label>Requested output<select
        aria-label="Marginal output"
        value={output}
        onChange={event => setOutput(Number(event.target.value))}
      >
        <option value={0}>A · Billing</option>
        <option value={1}>B · Access</option>
      </select></label>
      <label>Requested bit<select aria-label="Marginal bit" value={bit} onChange={event => setBit(Number(event.target.value))}>
        <option value={0}>0</option>
        <option value={1}>1</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          resetLaw();
          setOutput(1);
          setBit(1);
        }}
      >Reset law and marginal</button>
    </FlowControls>
    <FlowReadout>
      {law.empty ? 'No marginal or conditional is supported by total-zero counts.' : `P(${labels[output].id}=${bit}) = ${selected.map(row => number(law.masses[row.index])).join(' + ')} = ${number(mass)}. The two separately labelled conditional probabilities refer to different predecessor events.`}
    </FlowReadout>
  </MultiLabelFigure>;
}
export function RecordedChainPathFigure() {
  const saved = savedLibraryChain;
  const prefixMass = [saved.masses[0] + saved.masses[1], saved.masses[2] + saved.masses[3]];
  return <MultiLabelFigure
    job="D24"
    description="The conserved 240-row library output exposes a hard-prefix probability and a separately integrated marginal"
  >
    <MultiLabelCanvas
      width={1010}
      height={430}
      title="Saved rounded library law: both A branches remain visible, while the API passes hard predecessor A=1"
    >
      <circle cx={43} cy={197} r={16} fill="#111114" stroke="#eee8f1" />
      {[0, 1].map(bit => <g key={bit}>
        <path
          d={`M59,197 L336,${92 + bit * 209}`}
          stroke={bit ? '#fff' : labels[0].color}
          strokeWidth={bit ? 3 : 1}
        />
        <text x={90} y={bit ? 317 : 89}>A{bit} mass≈{number(prefixMass[bit])}</text>
        <circle cx={352} cy={92 + bit * 209} r={16} fill="#111114" stroke={labels[0].color} />
        {[0, 1].map(second => {
          const index = 2 * bit + second;
          const y = 46 + index * 103;
          return <g key={second}>
            <path d={`M368,${92 + bit * 209} L712,${y}`} stroke={bit === 1 ? '#fff' : labels[1].color} />
            <text x={392} y={y + 24}>B{second} | A{bit}≈{number(saved.masses[index] / prefixMass[bit])}</text>
            <circle cx={728} cy={y} r={12} stroke={labels[1].color} fill="#111114" />
            <text x={755} y={y + 6}>{bit}{second}: {number(saved.masses[index])}</text>
          </g>;
        })}
      </g>)}
      <text x={16} y={404}>Edges derived from rounded leaf masses; their sum is {number(saved.masses.reduce((a, b) => a + b, 0))}, not reconstructed exact parameters.</text>
    </MultiLabelCanvas>
    <MultiLabelTable caption="Saved API entries and integrated law retain their original displayed precision">
      <thead>
        <tr>
          <th>Reported quantity</th>
          <th>Value</th>
          <th>Input meaning</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>API first probability A</th>
          <td>.512477</td>
          <td>original input</td>
        </tr>
        <tr>
          <th>API second probability B</th>
          <td>.771639</td>
          <td>original input + hard A=1</td>
        </tr>
        <tr>
          <th>Integrated B marginal</th>
          <td>.569133</td>
          <td>both complete A branches</td>
        </tr>
      </tbody>
    </MultiLabelTable>
    <figcaption>Recorded chainApi.py, 240 rows, six-decimal output. The path’s reported .771639 remains distinct from the approximately derived ratio of rounded leaves. cv=None copies true previous labels at training; chain_method='predict' passes hard predictions at serving. order_ and its inverse restore original A/B column identities. <a href="/learn-code/multi-label-multi-output-learning/chainApi.stdout.txt" download>Read the complete saved output</a>.</figcaption>
  </MultiLabelFigure>;
}
