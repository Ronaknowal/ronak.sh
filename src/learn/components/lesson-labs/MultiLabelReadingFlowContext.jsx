import { useState } from 'react';
import { labelIdentities as labels } from '../../data/multilabel-reading-flow-foundation-models.js';
import { binaryPairs, entropySplit, entropyRows, pairLogLinear, pooledContext } from '../../data/multilabel-reading-flow-context-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';

function JointGrid({ x, y = 0, title, masses }) {
  return <g transform={`translate(${x},${y})`}>
    <text x={0} y={31}>{title}</text>
    <text x={84} y={75} style={{ fill: labels[1].color }}>B=0</text><text x={218} y={75} style={{ fill: labels[1].color }}>B=1</text>
    {binaryPairs.map(([a, b], index) => <g key={index}>
      <rect x={69 + b * 134} y={98 + a * 111} width={112} height={82} fill="#e4dbe9" fillOpacity={.05 + .35 * masses[index]} stroke="#b9afc5" />
      <text x={125 + b * 134} y={129 + a * 111} textAnchor="middle">{a}{b}</text>
      <text x={125 + b * 134} y={158 + a * 111} textAnchor="middle">{number(masses[index])}</text>
    </g>)}
    <text x={0} y={145} style={{ fill: labels[0].color }}>A=0</text><text x={0} y={256} style={{ fill: labels[0].color }}>A=1</text>
  </g>;
}

export function ContextMixtureFigure() {
  const [low, setLow] = useState(.1);
  const [high, setHigh] = useState(.9);
  const [share, setShare] = useState(.5);
  const [revision, setRevision] = useState(0);
  const law = pooledContext(low, high, share);
  return <MultiLabelFigure job="D25" description="Actual independent low and high context joint grids mix into an associated pooled law">
    <MultiLabelCanvas width={736} height={765} title="Low and high observed contexts enter the input side; their complete masses mix without a causal arrow between labels">
      <JointGrid x={16} title={`Low context · weight ${number(1 - share)}`} masses={law.lowMass} />
      <JointGrid x={384} title={`High context · weight ${number(share)}`} masses={law.highMass} />
      <JointGrid x={200} y={390} title="Pooled complete law" masses={law.masses} />
      <path d="M166,312 V347 H351 M534,312 V347 H351 M351,365 V390" fill="none" stroke="#e6dde9" />
      <circle cx={351} cy={347} r={18} fill="#111114" stroke="#e6dde9" /><text x={351} y={353} textAnchor="middle">Σ</text>
      <text x={16} y={733}>Pooled cell = (1−share) × low cell + share × high cell.</text>
      <text x={16} y={762}>Independent within context; the mixture need not factorize.</text>
    </MultiLabelCanvas>
    <MultiLabelTable caption="Context-conditional and pooled probabilities refer to different populations"><thead><tr><th>Population</th><th>P(A=1)=P(B=1)</th><th>P(A=1,B=1)</th><th>P(B=1 | A=1)</th></tr></thead><tbody>
      <tr><th>Low observed context</th><td>{number(low)}</td><td>{number(law.lowMass[3])}</td><td>{low === 0 ? 'undefined: A=1 has zero mass' : number(low)}</td></tr>
      <tr><th>High observed context</th><td>{number(high)}</td><td>{number(law.highMass[3])}</td><td>{high === 0 ? 'undefined: A=1 has zero mass' : number(high)}</td></tr>
      <tr><th>Pooled</th><td>{number(law.marginal)}</td><td>{number(law.masses[3])}</td><td>{law.conditional === null ? 'undefined: A=1 has zero mass' : `${number(law.masses[3])} / ${number(law.marginal)} = ${number(law.conditional)}`}</td></tr>
    </tbody></MultiLabelTable>
    <FlowControls><MultiLabelQuantity label="High-context share" value={share} min={0} max={1} step={.05} revision={revision} onChange={setShare} /><MultiLabelQuantity label="Low-context positive rate" value={low} min={0} max={1} revision={revision} onChange={setLow} /><MultiLabelQuantity label="High-context positive rate" value={high} min={0} max={1} revision={revision} onChange={setHigh} /><button type="button" onClick={() => { setLow(.1); setHigh(.9); setShare(.5); setRevision(value => value + 1); }}>Reset context mixture</button></FlowControls>
    <FlowReadout>At share {number(share)}, pooled joint 11 mass is {number(law.masses[3])} and each positive marginal is {number(law.marginal)}. The covariance is {number(law.covariance)}. {law.conditional === null ? 'P(B=1 | A=1) is undefined because its conditioning event has zero mass.' : `P(B=1 | A=1) is ${number(law.conditional)}.`} Association is statistical; these grids do not establish a causal effect.</FlowReadout>
  </MultiLabelFigure>;
}

function EntropyBucket({ rows, x, y, title }) {
  return <g transform={`translate(${x},${y})`}><text x={0} y={0}>{title}</text>{rows.map((row, index) => <g key={row.id} transform={`translate(0,${24 + index * 42})`}>
    <text x={0} y={24}>row {row.id} · x={row.x}</text>{row.vector.map((bit, output) => <g key={output}><circle cx={186 + output * 73} cy={18} r={15} fill={bit ? labels[output].color : '#111114'} stroke={labels[output].color} /><text x={186 + output * 73} y={24} textAnchor="middle" style={{ fill: bit ? '#141117' : labels[output].color }}>{bit}</text></g>)}
  </g>)}</g>;
}

export function MarginalJointEntropyFigure() {
  const [cut, setCut] = useState(1.5);
  const state = entropySplit(cut);
  return <MultiLabelFigure job="D26" description="The same four two-output rows form actual split buckets; marginal entropy and joint entropy reduce different distributions">
    <MultiLabelCanvas width={720} height={510} title={`Four output vectors split at x≤${cut}; keep A and B identities in both children`}>
      <EntropyBucket rows={entropyRows} x={16} y={35} title="Parent rows · A amber, B blue" />
      <path d="M305,138 H343 V90 H365 M343,138 V288 H365" fill="none" stroke="#e4dce8" />
      <text x={307} y={224}>x ≤ {cut}?</text>
      <EntropyBucket rows={state.children[0].rows} x={382} y={35} title={`Left · fraction ${number(state.children[0].fraction)}`} />
      <EntropyBucket rows={state.children[1].rows} x={382} y={278} title={`Right · fraction ${number(state.children[1].fraction)}`} />
      <text x={16} y={330}>A positives: 2/4 → H(.5)=1 bit</text><text x={16} y={369}>B positives: 2/4 → H(.5)=1 bit</text>
      <text x={16} y={413}>Marginal sum: 1+1=2 bits</text><text x={16} y={452}>Joint classes: 00/11, half each → 1 bit</text>
      <text x={16} y={498}>Same rows and cut; only the impurity reduction changes.</text>
    </MultiLabelCanvas>
    <MultiLabelTable caption="Actual child masses and weighted gains for two entropy criteria"><thead><tr><th>Bucket</th><th>A/B positive fractions</th><th>Joint masses 00/01/10/11</th><th>Marginal sum, bits</th><th>Joint, bits</th></tr></thead><tbody>
      {state.children.map((child, index) => <tr key={index}><th>{index ? 'Right' : 'Left'} · weight {number(child.fraction)}</th><td>{child.fractions.map(value => number(value)).join(' / ')}</td><td>{child.masses.map(value => number(value)).join(', ')}</td><td>{number(child.sum)}</td><td>{number(child.joint)}</td></tr>)}
      <tr><th>Weighted children</th><td>Each child weighted by its row fraction</td><td>Distinct reductions</td><td>{number(state.weightedSum)}</td><td>{number(state.weightedJoint)}</td></tr>
      <tr><th>Parent − weighted children</th><td>Gain at cut {cut}</td><td>Same partition</td><td>{number(state.gainSum)}</td><td>{number(state.gainJoint)}</td></tr>
    </tbody></MultiLabelTable>
    <FlowControls><label>Row threshold<select aria-label="Entropy split threshold" value={cut} onChange={event => setCut(Number(event.target.value))}>{[.5, 1.5, 2.5].map(value => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={() => setCut(1.5)}>Reset entropy split</button></FlowControls>
    <FlowReadout>Cut {cut} gives marginal-sum gain {number(state.gainSum)} and joint gain {number(state.gainJoint)}. The parent quantities are 2 and 1 bits. With fixed two-output width, the library’s mean marginal impurity rescales the sum by two. Computing that surrogate does not assert independent labels.</FlowReadout>
  </MultiLabelFigure>;
}

export function PairInteractionFigure() {
  const [interaction, setInteraction] = useState(Math.log(4));
  const [observed, setObserved] = useState(3);
  const [revision, setRevision] = useState(0);
  const state = pairLogLinear(interaction, observed);
  return <MultiLabelFigure job="D27" description="Four complete binary states produce feature scores and exponential masses; one common sum normalizes their probabilities">
    <MultiLabelCanvas width={736} height={460} title="A, B and their product score every complete state before global normalization">
      <text x={16} y={30}>Complete state / [A,B,AB]</text><text x={255} y={30}>λ_AB × AB</text><text x={405} y={30}>exp(score)</text><text x={642} y={30}>mass / Z</text>
      {binaryPairs.map((vector, index) => { const y = 80 + index * 83; return <g key={index}>
        {vector.map((bit, output) => <g key={output}><circle cx={36 + output * 54} cy={y} r={16} fill={bit ? labels[output].color : '#111114'} stroke={observed === index ? '#fff' : labels[output].color} /><text x={36 + output * 54} y={y + 6} textAnchor="middle" style={{ fill: bit ? '#141117' : labels[output].color }}>{bit}</text></g>)}
        <text x={123} y={y + 6}>[{state.features[index].join(', ')}]</text>
        <path d={`M209,${y} H239 M349,${y} H390 M479,${y} H520 V205 H520 M479,${y} H592 M560,205 H575 V${y + 22} H608 V${y + 14}`} fill="none" stroke={observed === index ? '#fff' : '#aaa0b4'} />
        <text x={255} y={y + 6}>{number(state.scores[index])}</text><text x={405} y={y + 6}>{number(state.masses[index])}</text>
        <text x={642} y={y + 6}>{number(state.probabilities[index])}</text>
        <circle cx={608} cy={y} r={14} fill="#111114" stroke="#d5c8e0" /><text x={608} y={y + 6} textAnchor="middle">÷</text>
      </g>; })}
      <circle cx={540} cy={205} r={21} fill="#111114" stroke="#e6ddea" /><text x={540} y={211} textAnchor="middle">Σ</text>
      <text x={500} y={389}>Z={number(state.normalizer)}</text><text x={16} y={445}>White state: observed {binaryPairs[observed].join('')}. λ_A=λ_B=0; one global normalizer.</text>
    </MultiLabelCanvas>
    <FlowControls><MultiLabelQuantity label="Pair interaction λ_AB" value={interaction} min={-3} max={3} revision={revision} onChange={setInteraction} /><label>Observed complete vector<select aria-label="Log-linear observed vector" value={observed} onChange={event => setObserved(Number(event.target.value))}>{binaryPairs.map((vector, index) => <option key={index} value={index}>{vector.join('')}</option>)}</select></label><button type="button" onClick={() => { setInteraction(Math.log(4)); setObserved(3); setRevision(value => value + 1); }}>Reset pair law</button></FlowControls>
    <FlowReadout>At λ_AB={number(interaction)}, Z={number(state.normalizer)}, E[AB]={number(state.expectation[2])}, observed AB={state.features[observed][2]}, and the interaction gradient is {number(state.gradient[2])}. The observation loss is {number(state.loss)}. At zero interaction the four probabilities are .25 and the bare law factorizes.</FlowReadout>

    <MultiLabelTable caption="Feature expectation minus observed feature gives the unpenalized negative-log-likelihood gradient"><thead><tr><th>Feature</th><th>Model expectation</th><th>Observed value</th><th>Gradient</th></tr></thead><tbody>{['A', 'B', 'AB'].map((name, index) => <tr key={name}><th>{name}</th><td>{number(state.expectation[index])}</td><td>{state.features[observed][index]}</td><td>{number(state.gradient[index])}</td></tr>)}</tbody></MultiLabelTable>

  </MultiLabelFigure>;
}

// The manuscript places this fixed-reference Hessian after its formal walkthrough.
export function PairCovarianceTable() {
  const state = pairLogLinear();
  return <MultiLabelTable caption="Reference λ_AB=log 4 law: fixed-feature covariance is the unpenalized Hessian"><thead><tr><th>Covariance</th>{['A', 'B', 'AB'].map(name => <th key={name}>{name}</th>)}</tr></thead><tbody>{state.covariance.map((row, index) => <tr key={index}><th>{['A', 'B', 'AB'][index]}</th>{row.map((value, column) => <td key={column}>{number(value)}</td>)}</tr>)}</tbody></MultiLabelTable>;
}
