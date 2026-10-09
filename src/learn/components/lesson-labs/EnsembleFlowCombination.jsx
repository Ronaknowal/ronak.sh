import { useId, useState } from 'react';
import { combinedForecast, combinedClassVotes } from '../../data/ensemble-combination-flow-models.js';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { EnsembleQuantity, EnsembleVectorEntry, useEnsembleVotes } from './EnsembleFlowControls.jsx';
import './ensemble-flow-combination.css';

const colors = { A: '#7fc9ba', B: '#b2b7e1', C: '#db96af', mix: '#e8bb60' };
const number = value => ensembleNumber(value, 7);

export function EnsembleFlowFigure({ title, job, children }) {
  return <figure className="ensemble-flow-figure" data-ensemble-job={job}>
    <figcaption>{title}</figcaption>
    {children}
  </figure>;
}

export function EnsembleFlowCanvas({ title, width = 640, height, children }) {
  const id = useId();
  return <div className="ensemble-flow-pan" tabIndex={0} role="region" aria-label={`${title}; scroll horizontally if needed`}>
    <svg role="img" fill="#ededf0" aria-labelledby={`${id}-title`} viewBox={`0 0 ${width} ${height}`}
      style={{ width: `${width / 16}rem`, height: `${height / 16}rem` }}>
      <title id={`${id}-title`}>{title}</title>
      {children}
    </svg>
  </div>;
}

function Operand({ x, y, width = 112, label, value, color = '#dadade' }) {
  return <g>
    <rect x={x} y={y} width={width} height={64} rx={3} fill="#18191d" stroke={color} />
    <text x={x + 10} y={y + 23} fill={color}>{label}</text>
    <text x={x + 10} y={y + 48}>{value}</text>
  </g>;
}

function Wire({ x1, y1, x2, y2, color = '#dadade' }) {
  const direction = Math.sign(x2 - x1);
  return <g stroke={color} fill="none">
    <path d={`M${x1},${y1} H${(x1 + x2) / 2} V${y2} H${x2}`} />
    <path d={`M${x2 - direction * 7},${y2 - 4} L${x2},${y2} L${x2 - direction * 7},${y2 + 4}`} />
  </g>;
}

export function SavedPredictorFigure() {
  return <EnsembleFlowFigure job="D01" title="The same query reads two saved rules">
    <EnsembleFlowCanvas title="Saved line: query 2 times slope 2 plus intercept 3 gives 7 hours" height={150}>
      <text x={16} y={24} fill={colors.A}>Member A · saved line · hours</text>
      <Operand x={16} y={58} label="query x" value="2" />
      <Wire x1={128} y1={90} x2={162} y2={90} color={colors.A} />
      <Operand x={162} y={58} label="× slope" value="2 × 2 = 4" color={colors.A} />
      <Wire x1={274} y1={90} x2={310} y2={90} color={colors.A} />
      <Operand x={310} y={58} label="+ intercept" value="4 + 3 = 7" color={colors.A} width={138} />
      <Wire x1={448} y1={90} x2={488} y2={90} color={colors.A} />
      <Operand x={488} y={58} label="forecast A" value="7 hours" color={colors.A} />
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas title="Saved stump: 2 is not below 1.5, so the right leaf returns 9 hours" height={250}>
      <text x={16} y={24} fill={colors.B}>Member B · saved stump · hours</text>
      <Operand x={16} y={72} label="query x" value="2" />
      <Wire x1={128} y1={104} x2={164} y2={104} color={colors.B} />
      <Operand x={164} y={72} width={140} label="x < 1.5?" value="2 < 1.5: no" color={colors.B} />
      <Wire x1={304} y1={104} x2={390} y2={68} color="#909098" />
      <text x={326} y={49}>yes</text>
      <Operand x={390} y={36} label="left leaf" value="6 hours" color="#909098" />
      <Wire x1={304} y1={104} x2={390} y2={176} color={colors.B} />
      <text x={326} y={236} fill={colors.B}>no · taken</text>
      <Operand x={390} y={144} label="right leaf" value="9 hours" color={colors.B} />
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas title="Equal contributions 3.5 and 4.5 add to 8; later target 8.5 stays outside prediction" height={196}>
      <Operand x={16} y={22} label="A × .5" value="7 × .5 = 3.5" color={colors.A} width={148} />
      <Operand x={16} y={108} label="B × .5" value="9 × .5 = 4.5" color={colors.B} width={148} />
      <Wire x1={164} y1={54} x2={238} y2={90} color={colors.A} />
      <Wire x1={164} y1={140} x2={238} y2={90} color={colors.B} />
      <Operand x={238} y={58} label="sum → mix" value="8 hours" color={colors.mix} width={132} />
      <path d="M416,12 V180" stroke="#909098" strokeDasharray="5 5" />
      <text x={440} y={63}>later outcome</text>
      <text x={440} y={94}>y = 8.5 hours</text>
      <text x={440} y={136}>outside inference</text>
    </EnsembleFlowCanvas>
  </EnsembleFlowFigure>;
}

export function ReservedRowsFigure() {
  return <EnsembleFlowFigure job="D02" title="Six schematic rows have distinct label permissions">
    <div className="ensemble-flow-roles ensemble-copied-error-tables">
      {[['Fit', ['A', 'B', 'C'], 'Their labels may fit parameters.'], ['Choice', ['D', 'E'], 'Their labels may choose a stated candidate.'], ['Final assessment', ['F'], 'Its later label assesses the selected rule.']].map(([role, ids, meaning]) =>
        <div key={role}>
          <strong>{role}</strong>
          <div className="ensemble-flow-row-tokens">{ids.map(id => <span key={id}>{id}</span>)}</div>
          <p>{meaning}</p>
        </div>
      )}
    </div>
    <p>The later A–F bootstrap and OOF illustrations explicitly restart with six training rows.</p>
  </EnsembleFlowFigure>;
}

export function WeightedForecastFigure() {
  const [forecasts, setForecasts] = useState([7, 9]);
  const [weight, setWeight] = useState(.25);
  const [revision, setRevision] = useState(0);
  const state = combinedForecast(forecasts, weight);
  return <EnsembleFlowFigure job="D03" title="Multiply comparable forecasts, then add their contributions">
    <EnsembleFlowCanvas title="Two weighted forecast products join the same sum" height={212}>
      {['A', 'B'].map((member, index) => <g key={member}>
        <Operand x={16} y={18 + index * 96} label={`forecast ${member}`} value={`${number(forecasts[index])} h`} color={colors[member]} width={150} />
        <Wire x1={166} y1={50 + index * 96} x2={204} y2={50 + index * 96} color={colors[member]} />
        <Operand x={204} y={18 + index * 96} label={`× ${number(state.weights[index])}`} value={`${number(state.contributions[index])} h`} color={colors[member]} width={170} />
        <Wire x1={374} y1={50 + index * 96} x2={458} y2={98} color={colors[member]} />
      </g>)}
      <Operand x={458} y={66} label="sum → mix" value={`${number(state.forecast)} h`} width={164} color={colors.mix} />
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleVectorEntry label="Forecasts A, B in hours" values={forecasts} onChange={setForecasts} revision={revision} />
      <EnsembleQuantity label="Weight on A" value={weight} onChange={setWeight} min={0} max={1} revision={revision} />
      <button type="button" onClick={() => {
        setForecasts([7, 9]);
        setWeight(.25);
        setRevision(previous => previous + 1);
      }}>Reset forecast</button>
    </div>
    <p aria-live="polite">A contributes {number(state.contributions[0])} hours and B {number(state.contributions[1])} hours. Their sum is {number(state.forecast)} hours, between {number(Math.min(...forecasts))} and {number(Math.max(...forecasts))}.</p>
  </EnsembleFlowFigure>;
}

function ProbabilityRows({ state, weighted = false }) {
  return <div className="ensemble-flow-probabilities" tabIndex={0} role="region" aria-label="Member probability matrix; scroll horizontally if needed">
    <div className="ensemble-flow-probability-heading"><span>Member</span><span>Class 0 · on time</span><span>Class 1 · delayed</span><span>Ballot</span></div>
    {state.members.map(member => <div className="ensemble-flow-probability-row" key={member.id} style={{ '--member-hue': colors[member.id] }}>
      <strong>{member.id}{weighted && <small> quantity {number(member.quantity)}<br />weight {member.weight === null ? 'unavailable' : number(member.weight)}</small>}</strong>
      {member.probabilities.map((probability, classId) => <div key={classId}>
        <span>{weighted ? `${number(member.weight ?? 0)} × ${number(probability)}` : number(probability)}</span>
        <div className="ensemble-flow-probability-track" aria-hidden="true"><i style={{ width: `${probability * 100}%` }} /></div>
        {weighted && <span>{member.weight === null ? 'unavailable' : `= ${number(member.weight * probability)}`}</span>}
      </div>)}
      <span>class {member.ballot}</span>
    </div>)}
    <div className="ensemble-flow-probability-summary">
      <strong>Soft · sum of mass</strong><span>{state.soft === null ? 'unavailable' : number(state.soft[0])}</span><span>{state.soft === null ? 'unavailable' : number(state.soft[1])}</span><span>{state.softClass === null ? 'no result' : `class ${state.softClass}`}</span>
    </div>
    <div className="ensemble-flow-probability-summary">
      <strong>Hard · sum of ballots</strong><span>{state.ballotMass === null ? 'unavailable' : number(state.ballotMass[0])}</span><span>{state.ballotMass === null ? 'unavailable' : number(state.ballotMass[1])}</span><span>{state.hardClass === null ? 'no result' : `class ${state.hardClass}`}</span>
    </div>
    <p className="ensemble-flow-scale">Each member bar has the same probability scale: empty 0 → full 1. Class 0 wins an exact tie.</p>
  </div>;
}

export function ProbabilityVoteFigure() {
  const context = useEnsembleVotes();
  const state = combinedClassVotes(context.probabilities, context.quantities);
  return <EnsembleFlowFigure job="D04" title="Ballots and probability mass can disagree">
    <ProbabilityRows state={state} />
    <div className="ensemble-flow-controls">
      {context.probabilities.map((probability, index) => <EnsembleQuantity key={index} label={`Member ${['A', 'B', 'C'][index]}: P(delayed)`}
        value={probability} min={0} max={1} step={.01} revision={context.revision}
        onChange={next => context.setProbabilities(old => old.map((value, i) => i === index ? next : value))} />)}
      <button type="button" onClick={context.reset}>Reset votes and weights</button>
    </div>
    <p aria-live="polite">With the shared member weights, {state.hardClass === null ? 'both rules are unavailable because all quantities are zero.' : `hard vote chooses class ${state.hardClass}; soft vote chooses class ${state.softClass} with delayed mass ${number(state.soft[1])}.`}</p>
  </EnsembleFlowFigure>;
}

export function MemberWeightFigure() {
  const context = useEnsembleVotes();
  const state = combinedClassVotes(context.probabilities, context.quantities);
  return <EnsembleFlowFigure job="D05" title="The same probability rows receive normalized member weights">
    <ProbabilityRows state={state} weighted />
    <div className="ensemble-flow-controls">
      {context.quantities.map((quantity, index) => <EnsembleQuantity key={index} label={`Member ${['A', 'B', 'C'][index]} quantity`}
        value={quantity} min={0} max={10} step={.25} revision={context.revision}
        onChange={next => context.setQuantities(old => old.map((value, i) => i === index ? next : value))} />)}
      <button type="button" onClick={context.reset}>Reset votes and weights</button>
    </div>
    <p aria-live="polite">{state.weights === null ? 'All three quantities are zero: normalization and both votes are unavailable.' : `Normalized weights A/B/C are ${state.weights.map(number).join(', ')}. The unchanged shared probabilities give soft class ${state.softClass} and hard class ${state.hardClass}.`}</p>
  </EnsembleFlowFigure>;
}

export function ClassAlignmentFigure() {
  const named = [
    { id: 'silver', value: '.1', color: '#c5c5ce', from: 16, to: 424, route: 138 },
    { id: 'amber', value: '.6', color: '#e8bb60', from: 220, to: 16, route: 152 },
    { id: 'blue', value: '.3', color: '#95b5e5', from: 424, to: 220, route: 166 }
  ];
  return <EnsembleFlowFigure job="D06-alignment" title="Move probability mass with its class name">
    <EnsembleFlowCanvas title="Input silver,amber,blue maps to output amber,blue,silver without changing class mass" height={286}>
      <text x={16} y={24}>Returned column order</text>
      {named.map(entry => <g key={entry.id}>
        <Operand x={entry.from} y={42} width={170} label={entry.id} value={entry.value} color={entry.color} />
        <path d={`M${entry.from + 85},106 V${entry.route} H${entry.to + 85} V208`} fill="none" stroke={entry.color} />
        <path d={`M${entry.to + 81},201 L${entry.to + 85},208 L${entry.to + 89},201`} fill="none" stroke={entry.color} />
        <Operand x={entry.to} y={208} width={170} label={entry.id} value={entry.value} color={entry.color} />
      </g>)}
      <text x={16} y={192}>Aligned output column order</text>
    </EnsembleFlowCanvas>
    <p>[silver, amber, blue]: [.1, .6, .3] → [amber, blue, silver]: [.6, .3, .1].</p>
  </EnsembleFlowFigure>;
}

export function CopiedErrorFigure() {
  const patterns = Array.from({ length: 8 }, (_, index) => {
    const bits = [2, 1, 0].map(bit => (index >> bit) & 1);
    const errors = bits.reduce((sum, value) => sum + value, 0);
    return { bits, majorityWrong: errors >= 2, mass: .3 ** errors * .7 ** (3 - errors) };
  });
  return <EnsembleFlowFigure job="D06-copied-evidence" title="Independent error patterns differ from three copies of one error">
    <div className="ensemble-flow-roles ensemble-copied-error-tables">
      <div>
        <strong>Three independent .3 errors</strong>
        <table><thead><tr><th>A/B/C wrong?</th><th>Joint mass</th><th>Majority</th></tr></thead>
          <tbody>{patterns.map(pattern => <tr key={pattern.bits.join('')}>
            <td>{pattern.bits.join('/')}</td><td>{number(pattern.mass)}</td><td>{pattern.majorityWrong ? 'wrong' : 'correct'}</td>
          </tr>)}</tbody>
        </table>
        <p>Three two-error cases plus the all-error case: 3 × .063 + .027 = .216.</p>
      </div>
      <div>
        <strong>Three copies of one .3 error</strong>
        <div className="ensemble-flow-row-tokens"><span>A</span><span>A copy</span><span>A copy</span></div>
        <table><thead><tr><th>Same error</th><th>Joint mass</th><th>Majority</th></tr></thead>
          <tbody><tr><td>0/0/0</td><td>.7</td><td>correct</td></tr><tr><td>1/1/1</td><td>.3</td><td>wrong</td></tr></tbody>
        </table>
        <p>Copying the indicator keeps majority error .3.</p>
      </div>
    </div>
  </EnsembleFlowFigure>;
}
