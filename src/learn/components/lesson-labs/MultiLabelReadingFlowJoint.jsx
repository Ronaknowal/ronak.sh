import { createContext, useContext, useMemo, useState } from 'react';
import { labelIdentities } from '../../data/multilabel-reading-flow-foundation-models.js';
import { binaryJointLaw, cardinalityF1Choice, jointActionRisks, jointVectors, referenceJointCounts } from '../../data/multilabel-reading-flow-joint-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';

const JointContext = createContext(null);
const labels = labelIdentities.slice(0, 2);
export function MultiLabelJointLawProvider({ children }) {
  const [counts, setCounts] = useState(referenceJointCounts);
  const [revision, setRevision] = useState(0);
  const law = useMemo(() => binaryJointLaw(counts), [counts]);
  const resetLaw = () => { setCounts(referenceJointCounts()); setRevision(value => value + 1); };
  return <JointContext.Provider value={{ law, counts, setCounts, revision, resetLaw }}>{children}</JointContext.Provider>;
}
export function useMultiLabelJointLaw() {
  const state = useContext(JointContext);
  if (!state) throw new Error('Connected law views require MultiLabelJointLawProvider.');
  return state;
}
export function ConnectedLawReadout() {
  const { law } = useMultiLabelJointLaw();
  return <p>Connected A/B counts [{law.counts.join(', ')}] for 00/01/10/11 · <a href="#multilabel-joint-law-editor">edit the same joint law</a>. {law.empty && 'No probability distribution: add an observation in that editor.'}</p>;
}

export function JointTilesFigure() {
  const { law, counts, setCounts, revision, resetLaw } = useMultiLabelJointLaw();
  const [selected, setSelected] = useState(0);
  return <MultiLabelFigure job="D14" description="Four observed A/B count cells normalize to a joint law and two positive marginals">
    <div id="multilabel-joint-law-editor" />
    <MultiLabelCanvas width={820} height={480} title="A and B bits locate four equal-area tiles; separate bar lengths, not tile areas, encode probability mass">
      <text x={215} y={26} style={{ color: labels[1].color }}>Access/B=0</text><text x={433} y={26} style={{ color: labels[1].color }}>Access/B=1</text>
      {[0, 1].map(bit => <text key={bit} x={16} y={120 + bit * 180} style={{ color: labels[0].color }}>Billing/A={bit}</text>)}
      {jointVectors.map((vector, index) => {
        const x = 205 + vector[1] * 218, y = 55 + vector[0] * 180;
        return <g key={index}>
          <rect x={x} y={y} width={196} height={157} fill="#111114" stroke={selected === index ? '#fff' : '#bcb4c6'} strokeWidth={selected === index ? 3 : 1} />
          <text x={x + 14} y={y + 29}>{vector.join('')} · count {counts[index]}</text>
          <text x={x + 14} y={y + 63}>mass {number(law.masses?.[index])}</text>
          <path d={`M${x + 14},${y + 99} H${x + 178}`} stroke="#77707f" />
          {!law.empty && <rect x={x + 14} y={y + 90} width={164 * law.masses[index]} height={18} fill="#eee8f1" />}
          <text x={x + 14} y={y + 137}>0 → bar scale → 1</text>
        </g>;
      })}
      <text x={647} y={105} style={{ color: labels[0].color }}>A1: 10 + 11</text><text x={647} y={140}>{number(law.marginals[0])}</text>
      <text x={647} y={230} style={{ color: labels[1].color }}>B1: 01 + 11</text><text x={647} y={265}>{number(law.marginals[1])}</text>
      <text x={205} y={427}>total count {law.total} · {law.empty ? 'no normalized masses' : 'four masses sum to 1'}</text>
      <text x={205} y={469}>Equal tile areas identify outcomes; their bars encode mass.</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Edited vector<select aria-label="Joint count vector" value={selected} onChange={event => setSelected(Number(event.target.value))}>{jointVectors.map((vector, index) => <option key={index} value={index}>{vector.join('')}</option>)}</select></label>
      <MultiLabelQuantity label="Selected joint count" value={counts[selected]} min={0} max={50} integer revision={`${revision}:${selected}`} onChange={value => setCounts(previous => previous.map((count, index) => index === selected ? value : count))} />
      <button type="button" onClick={() => { resetLaw(); setSelected(0); }}>Reset shared joint counts</button>
    </FlowControls>
    <FlowReadout>Vector {jointVectors[selected].join('')} has count {counts[selected]} out of {law.total}. {law.empty ? 'No probability distribution exists: add an observation. All connected risks and tree probabilities are unsupported.' : `Its mass is ${number(law.masses[selected])}. Positive marginals are A=${number(law.marginals[0])} and B=${number(law.marginals[1])}. These same counts drive the later factorization, greedy and marginal views.`}</FlowReadout>
  </MultiLabelFigure>;
}

export function BayesRiskFigure() {
  const { law, resetLaw } = useMultiLabelJointLaw();
  const [loss, setLoss] = useState('hamming');
  const [selected, setSelected] = useState(1);
  const state = jointActionRisks(law, loss);
  const candidate = state.candidates[selected];
  return <MultiLabelFigure job="D15" description="Every truth leaf contributes mass times Hamming or subset loss to each candidate's expected risk">
    <ConnectedLawReadout />
    {!law.empty && <>
      <MultiLabelTable caption={`Complete ${loss} loss × mass matrix, before summing by proposed answer`}>
        <thead><tr><th>Truth / mass</th>{state.candidates.map(action => <th key={action.action}>Answer {action.vector.join('')}</th>)}</tr></thead>
        <tbody>{jointVectors.map((truth, outcome) => <tr key={outcome}><th scope="row">{truth.join('')} / {number(law.masses[outcome])}</th>{state.candidates.map(action => <td key={action.action} aria-current={selected === action.action ? 'true' : undefined}>{number(action.terms[outcome].loss)} × {number(law.masses[outcome])}<br />= {number(action.terms[outcome].product)}</td>)}</tr>)}</tbody>
        <tfoot><tr><th scope="row">Expected risk sum</th>{state.candidates.map(action => <td key={action.action}>{number(action.risk)}{state.winners.includes(action.action) ? ' · minimum' : ''}</td>)}</tr></tfoot>
      </MultiLabelTable>
      <MultiLabelCanvas width={860} height={350} title={`Selected answer ${jointVectors[selected].join('')}: expose both bit comparisons before multiplying each leaf loss by its mass`}>
        {candidate.terms.map((term, index) => <g key={index}>
          <text x={15} y={40 + index * 73}>truth {term.truth.join('')}</text>
          {labels.map((label, output) => <g key={label.id} style={{ color: label.color }}>
            <text x={165 + output * 175} y={40 + index * 73}>{label.id}: {term.truth[output]} vs {candidate.vector[output]} {term.disagreements[output] ? '×' : '✓'}</text>
          </g>)}
          <path d={`M492,${34 + index * 73} H538`} fill="none" stroke="#bcb4c6" />
          <text x={548} y={40 + index * 73}>ℓ={number(term.loss)} × p={number(term.mass)}</text>
        </g>)}
        <path d="M745,62 V312 H550" fill="none" stroke="#eee8f1" /><circle cx={530} cy={312} r={19} fill="#111114" stroke="#eee8f1" /><text x={530} y={318} textAnchor="middle">Σ</text>
        <text x={15} y={325}>R({candidate.vector.join('')})={number(candidate.risk)}</text>
      </MultiLabelCanvas>
    </>}
    <FlowControls>
      <label>Loss<select aria-label="Joint action loss" value={loss} onChange={event => setLoss(event.target.value)}><option value="hamming">Hamming · wrong-bit fraction</option><option value="subset">Subset · any wrong bit</option></select></label>
      <label>Inspected answer<select aria-label="Joint risk answer" value={selected} onChange={event => setSelected(Number(event.target.value))}>{jointVectors.map((vector, index) => <option key={index} value={index}>{vector.join('')}</option>)}</select></label>
      <button type="button" onClick={() => { resetLaw(); setLoss('hamming'); setSelected(1); }}>Reset law, loss and answer</button>
    </FlowControls>
    <FlowReadout>{law.empty ? 'Expected risks are unsupported because the connected counts define no probability distribution.' : `${loss} chooses ${jointVectors[state.action].join('')} at risk ${number(state.risk)}. The minimum-risk tie set is {${state.winners.map(index => jointVectors[index].join('')).join(', ')}}; lexicographic order chooses its first vector. The inspected ${candidate.vector.join('')} has risk ${number(candidate.risk)}.`}</FlowReadout>
  </MultiLabelFigure>;
}

export function F1SetSizeFigure() {
  const [fixture, setFixture] = useState('reference');
  const [emptyPayoff, setEmptyPayoff] = useState(1);
  const counts = fixture === 'reference' ? referenceJointCounts() : [18, 1, 0, 1];
  const state = cardinalityF1Choice(counts, emptyPayoff);
  return <MultiLabelFigure job="D16" description="Truth cardinalities determine size-specific label gains; compare the best set at each size with the empty answer">
    <p>Separate supplied F1 hand law [{counts.join(', ')}] for 00/01/10/11. This comparison is independent of the connected joint-count editor.</p>
    <MultiLabelTable caption="Cardinality-specific contributions 2P(Y=y)/(k+|y|) only when the named label is present">
      <thead><tr><th>Truth / cardinality / mass</th><th>k=1, A</th><th>k=1, B</th><th>k=2, A</th><th>k=2, B</th></tr></thead>
      <tbody>{jointVectors.map((vector, outcome) => {
        const cardinality = vector[0] + vector[1];
        return <tr key={outcome}><th scope="row">{vector.join('')} / {cardinality} / {number(state.law.masses[outcome])}</th>{[1, 2].flatMap(size => [0, 1].map(label => <td key={`${size}${label}`}>{vector[label] ? `2×${number(state.law.masses[outcome])}/(${size}+${cardinality}) = ${number(2 * state.law.masses[outcome] / (size + cardinality))}` : '0 · label absent'}</td>))}</tr>;
      })}</tbody>
      <tfoot><tr><th scope="row">Gain Δ_jk</th>{state.gains.flatMap((row, size) => row.map((value, label) => <td key={`${size}${label}`} style={{ color: labels[label].color }}>{number(value)}</td>))}</tr></tfoot>
    </MultiLabelTable>
    <MultiLabelCanvas width={880} height={340} title="Choose the largest label gains for each proposed size, then compare all three expected rewards">
      {state.candidates.map((candidate, index) => <g key={candidate.size}>
        <text x={16} y={51 + index * 95}>k={candidate.size}</text>
        {labels.map((label, output) => <g key={label.id} style={{ color: label.color }}>
          <circle cx={145 + output * 130} cy={45 + index * 95} r={18} fill={candidate.vector[output] ? label.color : '#111114'} stroke={label.color} />
          <text x={145 + output * 130} y={79 + index * 95} textAnchor="middle">{label.id}{candidate.size ? `: ${number(state.gains[candidate.size - 1][output])}` : ': empty'}</text>
        </g>)}
        <path d={`M314,${45 + index * 95} H415`} stroke="#bcb4c6" fill="none" />
        <circle cx={435} cy={45 + index * 95} r={19} fill="#111114" stroke="#eee8f1" /><text x={435} y={51 + index * 95} textAnchor="middle">Σ</text>
        <text x={480} y={51 + index * 95}>reward {number(candidate.reward)}{state.action.size === candidate.size ? ' · best size ★' : ''}</text>
      </g>)}
      <text x={16} y={334}>Empty answer: P(00) × empty/empty payoff = {number(state.candidates[0].reward)}</text>
    </MultiLabelCanvas>
    <FlowControls>
      <label>Supplied hand law<select aria-label="F1 hand law" value={fixture} onChange={event => setFixture(event.target.value)}><option value="reference">6 / 5 / 1 / 8 · reference</option><option value="empty-dominance">18 / 1 / 0 / 1 · empty-dominance contrast</option></select></label>
      <label>Empty/empty payoff<select aria-label="Expected F1 empty payoff" value={emptyPayoff} onChange={event => setEmptyPayoff(Number(event.target.value))}><option value={1}>1 · empty answer matches empty truth</option><option value={0}>0 · empty pair reward is zero</option></select></label>
      <button type="button" onClick={() => { setFixture('reference'); setEmptyPayoff(1); }}>Reset F1 hand law and payoff</button>
    </FlowControls>
    <FlowReadout>Best expected instance-F1 answer is {state.action.vector.join('')} at size {state.action.size}, with reward {number(state.reward)}. The empty answer receives {number(state.candidates[0].reward)}. {state.action.size === 0 ? 'The empty mass dominates under the current payoff.' : 'For each nonempty size, sum only its selected top-k gains before comparing sizes.'} These are supplied-law decision calculations, not a test-micro-F1 optimizer or an estimated-data fit.</FlowReadout>
  </MultiLabelFigure>;
}
