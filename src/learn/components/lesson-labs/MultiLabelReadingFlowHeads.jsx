import { useState } from 'react';
import { labelIdentities } from '../../data/multilabel-reading-flow-foundation-models.js';
import { atomicBinaryLoss, constructedHeads, initialHeadBiases, initialObservedHeadMask, observedHeadTargets, zeroWeightObservedHead } from '../../data/multilabel-reading-flow-head-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';
const labels = labelIdentities.slice(0, 3);
export function IndependentHeadsFigure() {
  const [selected, setSelected] = useState(0);
  const [biases, setBiases] = useState(initialHeadBiases);
  const [revision, setRevision] = useState(0);
  const heads = constructedHeads(biases);
  return <MultiLabelFigure
    job="D11"
    description="Two input coordinates feed three independent weight columns, sums and sigmoid sockets"
  >
    <MultiLabelCanvas
      width={1040}
      height={570}
      title="Three labelled binary heads reuse the same two input coordinates; each sum has its own bias and sigmoid"
    >
      <text x={16} y={30}>One row x=[1, −1] · constructed parameters</text>
      <circle cx={150} cy={206} r={20} fill="#111114" stroke="#eee8f1" />
      <text x={16} y={212}>x₁=1</text>
      <circle cx={150} cy={364} r={20} fill="#111114" stroke="#eee8f1" />
      <text x={16} y={370}>x₂=−1</text>
      {heads.map((head, output) => {
        const y = 95 + output * 180;
        const label = labels[output];
        return <g
          key={label.id}
          style={{
            color: label.color
          }}
        >
          <path
            d={`M170,206 H${230 + output * 36} V${y - 32} H493 M170,364 H${340 + output * 36} V${y + 32} H493`}
            stroke={label.color}
            fill="none"
          />
          <text x={400} y={y - 45}>×{number(head.weights[0])}</text>
          <text x={400} y={y + 60}>×{number(head.weights[1])}</text>
          <path d={`M493,${y - 32} L530,${y} M493,${y + 32} L530,${y}`} stroke={label.color} fill="none" />
          <circle cx={547} cy={y} r={20} fill="#111114" stroke={label.color} />
          <text x={547} y={y + 6} textAnchor="middle">Σ</text>
          {selected === output && <circle cx={547} cy={y} r={26} fill="none" stroke="#fff" />}
          <path d={`M547,${y + 100} V${y + 25}`} stroke="#bcb4c6" fill="none" />
          <text x={580} y={y + 92}>bias {number(head.bias)}</text>
          <path d={`M567,${y} H770`} stroke={label.color} fill="none" />
          <text x={590} y={y - 16}>z={number(head.logit)}</text>
          <circle cx={790} cy={y} r={20} fill="#111114" stroke={label.color} />
          <text x={790} y={y + 6} textAnchor="middle">σ</text>
          <path d={`M810,${y} H845`} stroke={label.color} fill="none" />
          <circle
            cx={860}
            cy={y}
            r={14}
            fill={head.decision ? label.color : '#111114'}
            stroke={label.color}
          />
          <text x={883} y={y - 7}>
            {label.name}
          </text>
          <text x={883} y={y + 24}>p={number(head.probability)}</text>
        </g>;
      })}
    </MultiLabelCanvas>
    <MultiLabelTable caption="Every dot-product operand, bias and binary probability">
      <thead>
        <tr>
          <th>Named output</th>
          <th>x₁w₁</th>
          <th>x₂w₂</th>
          <th>Bias</th>
          <th>Logit</th>
          <th>Sigmoid</th>
          <th>Bit at ≥.5</th>
        </tr>
      </thead>
      <tbody>
        {heads.map((head, index) => <tr key={index}>
          <th
            scope="row"
            style={{
              color: labels[index].color
            }}
          >
            {labels[index].name}
          </th>
          {[...head.products, head.bias, head.logit, head.probability, head.decision].map((value, column) => <td key={column}>
            {number(value)}
          </td>)}
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <FlowControls>
      <label>Edited output<select
        aria-label="Independent head output"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {labels.map((label, index) => <option key={label.id} value={index}>
          {label.name}
        </option>)}
      </select></label>
      <MultiLabelQuantity
        label="Selected head bias"
        value={biases[selected]}
        min={-5}
        max={5}
        step={.1}
        revision={`${revision}:${selected}`}
        onChange={value => setBiases(previous => previous.map((bias, index) => index === selected ? value : bias))}
      />
      <button
        type="button"
        onClick={() => {
          setBiases(initialHeadBiases());
          setSelected(0);
          setRevision(value => value + 1);
        }}
      >Reset all head biases</button>
    </FlowControls>
    <FlowReadout>{labels[selected].name} has z={number(heads[selected].logit)}, probability {number(heads[selected].probability)} and bit {heads[selected].decision}. Its bias changes only this head. The other two probabilities do not renormalize; their sum need not equal 1.</FlowReadout>
  </MultiLabelFigure>;
}
export function BinaryPullbackFigure() {
  const [logit, setLogit] = useState(0);
  const [target, setTarget] = useState(1);
  const [revision, setRevision] = useState(0);
  const state = atomicBinaryLoss(logit, target);
  return <MultiLabelFigure
    job="D12"
    description="A scalar logit enters a stable loss and sends its residual back to two input weights and one bias"
  >
    <MultiLabelCanvas
      width={910}
      height={405}
      title="Stable binary loss and the residual p−y share one logit, with weight pullbacks along x=[1,−1]"
    >
      <text x={16} y={30}>Constructed scalar logit and binary target</text>
      <circle cx={140} cy={123} r={26} fill="#111114" stroke="#eee8f1" />
      <text x={140} y={129} textAnchor="middle">z</text>
      <text x={20} y={78}>z={number(logit)}</text>
      <path d="M166,123 H295 M236,123 V232 H295" stroke="#bcb4c6" fill="none" />
      <circle cx={320} cy={123} r={24} fill="#111114" stroke={labels[0].color} />
      <text x={320} y={129} textAnchor="middle">σ</text>
      <text x={365} y={129}>p={number(state.probability)}</text>
      <path d="M320,148 V175 H610 V225" stroke={labels[0].color} fill="none" />
      <text x={685} y={172}>target y={target}</text>
      <path d="M690,183 V232 H635" stroke="#eee8f1" fill="none" />
      <circle cx={610} cy={232} r={24} fill="#111114" stroke={labels[0].color} />
      <text x={610} y={238} textAnchor="middle">−</text>
      <text x={655} y={245}>p−y={number(state.residual)}</text>
      <circle cx={320} cy={232} r={24} fill="#111114" stroke="#eee8f1" />
      <text x={320} y={238} textAnchor="middle">ℓ</text>
      <path d="M690,183 H540 V205 H337" fill="none" stroke="#bcb4c6" />
      <text x={363} y={264}>loss {number(state.loss)}</text>
      <text x={18} y={226}>stable logit loss</text>
      <text x={18} y={257}>max(z,0)−yz</text>
      <text x={18} y={287}>+log1p(exp(−|z|))</text>
      <text x={18} y={319}>ℓ={number(state.loss)}</text>
      <path d="M610,258 V333 H402 M610,333 H792" stroke={labels[0].color} fill="none" />
      <circle cx={402} cy={333} r={20} fill="#111114" stroke="#eee8f1" />
      <text x={402} y={339} textAnchor="middle">×</text>
      <circle cx={792} cy={333} r={20} fill="#111114" stroke="#eee8f1" />
      <text x={792} y={339} textAnchor="middle">×</text>
      <text x={348} y={372}>x₁=1 → {number(state.slopeGradients[0])}</text>
      <text x={690} y={372}>x₂=−1 → {number(state.slopeGradients[1])}</text>
      <text x={350} y={401}>bias input 1 → {number(state.biasGradient)}</text>
    </MultiLabelCanvas>
    <FlowControls>
      <MultiLabelQuantity
        label="Binary logit"
        value={logit}
        min={-100}
        max={100}
        step={1}
        revision={revision}
        onChange={setLogit}
      />
      <label>Binary target<select
        aria-label="Binary loss target"
        value={target}
        onChange={event => setTarget(Number(event.target.value))}
      >
        <option value={0}>0 · known absent</option>
        <option value={1}>1 · known present</option>
      </select></label>
      <button
        type="button"
        onClick={() => {
          setLogit(0);
          setTarget(1);
          setRevision(value => value + 1);
        }}
      >Reset scalar pullback</button>
    </FlowControls>
    <FlowReadout>At z={number(logit)} and y={target}, stable loss is {number(state.loss)}, probability is {number(state.probability)}, and residual is {number(state.residual)}. Slope gradients are [{state.slopeGradients.map(value => number(value)).join(', ')}]. The loss is computed from the logit even when a floating probability rounds to 0 or 1.</FlowReadout>
  </MultiLabelFigure>;
}
export function ObservedGradientFigure() {
  const [selected, setSelected] = useState(0);
  const [mask, setMask] = useState(initialObservedHeadMask);
  const state = zeroWeightObservedHead(mask, selected);
  return <MultiLabelFigure
    job="D13"
    description="Only observed design rows enter an output's mean gradient and matched library penalty"
  >
    <MultiLabelTable
      caption="Leading-intercept design and separately observed binary targets at zero coefficients"
    >
      <thead>
        <tr>
          <th>Row</th>
          <th>[intercept, x]</th>
          {labels.slice(0, 2).map(label => <th
            key={label.id}
            style={{
              color: label.color
            }}
          >{label.name} truth</th>)}
          <th>Selected-output residual</th>
          <th>Selected design × residual</th>
        </tr>
      </thead>
      <tbody>
        {state.rows.map(row => <tr key={row.id}>
          <th scope="row">R{row.id}</th>
          <td>[{row.design.join(', ')}]</td>
          {observedHeadTargets[row.id].map((value, output) => <td key={output}>
            {mask[row.id][output] ? value : '? · unknown'}
          </td>)}
          <td>
            {row.observed ? number(row.residual) : 'excluded'}
          </td>
          <td>
            {row.observed ? `[${row.products.map(value => number(value)).join(', ')}]` : 'no contribution'}
          </td>
        </tr>)}
      </tbody>
    </MultiLabelTable>
    <MultiLabelCanvas
      width={860}
      height={270}
      title="Surviving observed rows feed the intercept and slope sums, each divided by the same current observed count"
    >
      {state.rows.map((row, index) => <g key={row.id}>
        <circle
          cx={45 + index * 135}
          cy={50}
          r={18}
          fill="#111114"
          stroke={row.observed ? labels[selected].color : '#77707f'}
        />
        <text x={45 + index * 135} y={56} textAnchor="middle">
          {row.observed ? row.id : '×'}
        </text>
        {row.observed && <path
          d={`M${45 + index * 135},68 V98 H${selected ? 285 : 185} V131`}
          stroke={labels[selected].color}
          fill="none"
        />}
      </g>)}
      <circle cx={selected ? 285 : 185} cy={131} r={18} fill="#111114" stroke={labels[selected].color} />
      <text x={selected ? 285 : 185} y={137} textAnchor="middle">Σ</text>
      <text x={15} y={169}>Xᵀ residual sums [{state.gradientSums.map(value => number(value)).join(', ')}]</text>
      <path d="M370,164 H490" stroke="#ece8ef" fill="none" />
      <text x={402} y={142}>÷ n={state.count}</text>
      <text x={510} y={169}>gradient [{state.gradient.map(value => number(value)).join(', ')}]</text>
      <text x={15} y={217}>intercept: no penalty</text>
      <text x={370} y={217}>slope: λw= .1×0 = 0</text>
      <text x={15} y={259}>mean-loss matching C=1/(nλ) = {number(state.C)}</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Inspected output<select
        aria-label="Observed gradient output"
        value={selected}
        onChange={event => setSelected(Number(event.target.value))}
      >
        {labels.slice(0, 2).map((label, index) => <option key={label.id} value={index}>
          {label.name}
        </option>)}
      </select></label>
      <fieldset className="mlf-bit-editor">
        <legend>Observation mask · toggle whether each target was observed</legend>
        <div className="mlf-row-object">
          {state.rows.map(row => <span className="mlf-row-object" key={row.id}>R{row.id}{labels.slice(0, 2).map((label, output) => <button
            type="button"
            key={label.id}
            className="mlf-bit"
            style={{
              '--label-color': label.color
            }}
            data-positive={mask[row.id][output]}
            aria-pressed={mask[row.id][output]}
            aria-label={`R${row.id}, ${label.name} observation mask ${Number(mask[row.id][output])}; toggle`}
            onClick={() => setMask(previous => previous.map((values, index) => values.map((value, column) => index === row.id && column === output ? !value : value)))}
          >
            {Number(mask[row.id][output])}
          </button>)}</span>)}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={() => {
          setSelected(0);
          setMask(initialObservedHeadMask());
        }}
      >Reset observed-row gradient</button>
    </FlowControls>
    <FlowReadout>{labels[selected].name} has {state.count} observed targets: {state.counts[0]} zeros and {state.counts[1]} ones. {state.fittingStatus === 'empty' ? 'Its supervised mean gradient and matching C are unsupported; no observed column can be fitted.' : state.fittingStatus === 'one-class' ? 'The shown finite zero-weight gradient is arithmetic, not a finite logistic maximum-likelihood optimum. The program names its separate constant baseline for a one-class column.' : `At zero coefficients its mean gradient is [${state.gradient.map(value => number(value)).join(', ')}], with C=${number(state.C)} for λ=.1.`}</FlowReadout>
  </MultiLabelFigure>;
}
