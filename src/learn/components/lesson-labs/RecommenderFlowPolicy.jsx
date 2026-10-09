import { createContext, useContext, useState } from 'react';
import { policyPaths, retainedPolicyEvents, extendPolicyEvents, finitePolicyLog, entryRisk } from '../../data/recommender-flow-policy-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecExactObject, parseRecVector, formatRec } from './RecommenderFlowControls.jsx';
import './recommender-flow-policy.css';

const PolicyContext = createContext(null);
const f = value => typeof value === 'number' && !Number.isFinite(value) ? 'unavailable (numeric range)' : formatRec(value);
const squared = value => value !== null && Number.isFinite(value ** 2) ? value ** 2 : null;
const defaults = () => ({ loggingA: .8, targetA: .5, rewards: [.4, .8], seed: 19,
  events: retainedPolicyEvents.map(event => ({ ...event })), mode: 'retained constructed twenty-event log' });
export function RecommenderPolicyProvider({ children }) {
  const [state, setState] = useState(defaults), [revision, setRevision] = useState(0);
  const patch = values => setState(previous => ({ ...previous, ...values }));
  const reset = () => { setState(defaults()); setRevision(value => value + 1); };
  return <PolicyContext.Provider value={{ ...state, patch, reset, revision }}>{children}</PolicyContext.Provider>;
}
function usePolicy() {
  const state = useContext(PolicyContext);
  if (!state) throw new Error('Policy figures need their separately named policy provider.');
  return { ...state, policy: policyPaths(state.loggingA, state.targetA, state.rewards) };
}
function parseEvents(text) {
  const rows = JSON.parse(text);
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 10000 || rows.some(row => !row || ![0, 1].includes(row.action) || ![0, 1].includes(row.reward))) {
    throw new Error('Use 1–10000 objects with action 0 (A) or 1 (B), and reward 0 or 1.');
  }
  return rows.map(({ action, reward }) => ({ action, reward }));
}

export function PolicyProbabilityTreeFigure() {
  const state = usePolicy(), { policy } = state;
  return <RecFigure id="D48" label="Two-action probability tree with actual conditional rewards" reset={state.reset}
    controls={<>
      <RecQuantity label="Logging probability of A" value={state.loggingA} min={0} max={1} revision={state.revision} onChange={loggingA => state.patch({ loggingA })} />
      <RecQuantity label="Target probability of A" value={state.targetA} min={0} max={1} revision={state.revision} onChange={targetA => state.patch({ targetA })} />
      <RecExactObject label="Conditional reward probabilities [A, B]" value={state.rewards} revision={state.revision}
        parse={text => parseRecVector(text, 2, 0, 1)} onChange={rewards => state.patch({ rewards })} />
    </>}
    result={`Logging value ${f(policy.loggerValue)}; known constructed target value ${f(policy.targetValue)}. ${policy.identified ? `Every positive target action has logging support; weighted path expectation is ${f(policy.targetValue)}.${policy.representable ? '' : ' A ratio exceeds the representable numeric range; that numerical route is unavailable.'}` : 'Positive target mass has zero logging support: its value is not identified from the log, even though this constructed reward model supplies a known value.'}`}>
    <div className="rec-flow-pan" role="region" tabIndex={0} aria-label="Policy probability tree: scroll locally">
      <svg className="rec-policy-tree" viewBox="0 0 1000 490" role="img" aria-label={`Request branches to actions A and B, then reward one and zero. Logging probabilities ${f(policy.logging[0])}, ${f(policy.logging[1])}; target probabilities ${f(policy.target[0])}, ${f(policy.target[1])}.`}>
        <circle cx="90" cy="245" r="12" /><text x="25" y="280">Request</text>
        {[0, 1].map(action => {
          const y = action ? 360 : 130;
          return <g key={action} style={{ color: action ? '#c59bdd' : '#84b8ef' }}>
            <path d={`M102 245 L330 ${y}`} /><circle cx="330" cy={y} r="10" />
            <text x="160" y={action ? 330 : 150}>log {f(policy.logging[action])}</text>
            <text x="160" y={action ? 354 : 174}>target {f(policy.target[action])}</text>
            <text x="320" y={y - 22}>{action ? 'B' : 'A'}</text>
            {[1, 0].map(reward => {
              const leafY = y + (reward ? -55 : 55), path = policy.paths.find(row => row.action === action && row.reward === reward);
              return <g key={reward}>
                <path d={`M340 ${y} L650 ${leafY}`} /><circle cx="650" cy={leafY} r="7" />
                <text x="445" y={leafY + (reward ? -20 : 32)}>P(r={reward} | {action ? 'B' : 'A'}) = {f(path.conditional)}</text>
                <text x="678" y={leafY - 10}>reward {reward}</text>
                <text x="678" y={leafY + 14}>joint mass {f(path.mass)}</text>
                <text x="678" y={leafY + 38}>ratio {f(path.ratio)} × {reward} = {f(path.weightedReward)}</text>
              </g>;
            })}
          </g>;
        })}
      </svg>
    </div>
    <RecOperands label="Every probability path and its expectation term"
      headers={['Action / reward', 'Logging × conditional', 'Joint mass', 'Target / logging', 'Weighted reward', 'Mass × weighted reward']}
      rows={policy.paths.map(path => [`${path.action ? 'B' : 'A'} / r${path.reward}`, `${f(policy.logging[path.action])} × ${f(path.conditional)}`, path.mass, path.ratio, path.weightedReward, path.weightedReward === null ? null : path.mass * path.weightedReward])} />
    <p>Zero target with zero logging mass contributes zero to the known path expectation. A positive target action with zero logging mass is unsupported. These supplied reward probabilities describe a constructed model; real Retail propensities are not available.</p>
  </RecFigure>;
}

export function FinitePolicyLogFigure() {
  const state = usePolicy(), frame = finitePolicyLog(state.events, state.policy);
  return <RecFigure id="D49" label="Finite logged actions, weighting, second moment and variance" reset={state.reset}
    controls={<>
      <RecQuantity label="Number of finite log events" value={state.events.length} min={1} max={10000} integer revision={state.revision}
        onChange={count => state.patch({ events: extendPolicyEvents(state.events, count, state.seed, state.loggingA, state.rewards), mode: 'retained prefix with seeded tail when grown' })} />
      <RecQuantity label="Seed for a new constructed log" value={state.seed} min={0} max={4294967295} integer revision={state.revision}
        onChange={seed => state.patch({ seed, events: extendPolicyEvents([], state.events.length, seed, state.loggingA, state.rewards), mode: 'new seeded constructed log' })} />
      <RecExactObject label="Complete action/reward event sequence" value={state.events} revision={state.revision} parse={parseEvents}
        description="Action 0 is A; action 1 is B. Repeated occurrences retain separate L-index identities. Editing this supplied sequence does not claim it was randomly sampled."
        onChange={events => state.patch({ events, mode: 'edited supplied constructed log' })} />
    </>}
    result={`${state.events.length} events (${state.mode}): raw ${frame.rewards}/${state.events.length} = ${f(frame.raw)}; IPS ${f(frame.weightedSum)}/${state.events.length} = ${f(frame.ips)}; SNIPS ${f(frame.weightedSum)}/${f(frame.weightSum)} = ${f(frame.snips)}. ${frame.valid ? 'IPS can exceed one in a finite log; SNIPS uses a random denominator and is a distinct estimator.' : 'Unsupported target action, an impossible declared event, or a ratio/sum outside the numeric range makes weighted estimation unavailable.'}`}>
    <RecMatrix label="Every event occurrence: action → policy ratio → weighted reward"
      columns={['Action', 'Reward', 'Logging probability', 'Target probability', 'Ratio', 'Ratio × reward']}
      rowNames={frame.rows.map(row => row.id)} rows={frame.rows.map(row => [row.action ? 'B' : 'A', row.reward, row.probability, row.target, row.ratio, row.weightedReward])} />
    <div className="rec-policy-reduction"><span>Σ reward = {frame.rewards}</span><span>Σ weighted reward = {f(frame.weightedSum)}</span><span>Σ weights = {f(frame.weightSum)}</span><span>N = {state.events.length}</span></div>
    <RecOperands label="Theoretical independent-event moments under the declared logger"
      headers={['Action / reward', 'Path mass', 'Weighted reward squared', 'Second-moment term']}
      rows={state.policy.paths.map(path => [`${path.action ? 'B' : 'A'} / ${path.reward}`, path.mass, squared(path.weightedReward), squared(path.weightedReward) === null ? null : path.mass * squared(path.weightedReward)])} />
    <p>E[Z²] = {f(state.policy.secondMoment)}; E[Z]² = {f(state.policy.targetValue ** 2)}; Var(Z) = {f(state.policy.variance)}. For independent logged draws, Var(mean) = Var(Z)/N = {f(frame.varianceOfMean)}. This formula is not an empirical uncertainty guarantee for a manually supplied or dependent log.</p>
  </RecFigure>;
}

export function ObservationRiskFigure() {
  const [mask, setMask] = useState([1, 1, 1, 1]), [propensities, setPropensities] = useState([1, .5, .25, 1]);
  const [losses, setLosses] = useState([1, 4, 2, 3]), [revision, setRevision] = useState(0);
  const frame = entryRisk(mask, propensities, losses);
  const reset = () => { setMask([1, 1, 1, 1]); setPropensities([1, .5, .25, 1]); setLosses([1, 4, 2, 3]); setRevision(value => value + 1); };
  return <RecFigure id="D50" label="Observation-weighted risk on all four matrix entries" reset={reset}
    controls={<>
      <RecExactObject label="Observation mask [U0I0, U0I1, U1I0, U1I1]" value={mask} revision={revision}
        parse={text => { const next = parseRecVector(text, 4, 0, 1); if (next.some(value => value !== 0 && value !== 1)) throw new Error('Mask entries must be 0 or 1.'); return next; }} onChange={setMask} />
      <RecExactObject label="Four entry observation propensities" value={propensities} revision={revision} parse={text => parseRecVector(text, 4, 0, 1)} onChange={setPropensities} />
      <RecExactObject label="Four fixed entry losses" value={losses} revision={revision} parse={text => parseRecVector(text, 4, 0, 100)} onChange={setLosses} />
    </>}
    result={`Full target risk ${f(frame.fullRisk)} averages all four entries. Current mask observes ${frame.count}: IPS ${f(frame.total)}/4 = ${f(frame.ips)}, naive ${f(frame.naive)}, SNIPS ${f(frame.snips)}. ${frame.identified ? `Across independent masks: E[IPS] ${f(frame.expectedIPS)}, E[naive] ${f(frame.expectedNaive)}, E[SNIPS] ${f(frame.expectedSNIPS)}.${frame.available ? '' : ' A weighted term exceeds the numeric range; the numerical estimate is unavailable.'}` : 'A zero propensity leaves a positive-weight target entry unsupported; its weighted risk is unavailable.'}`}>
    <div className="rec-policy-entry-grid">{frame.rows.map(row => <div key={row.id} className={row.observed ? 'is-observed' : 'is-missing'}>
      <strong>{row.id}</strong><span>loss {f(row.loss)}</span><span>δ = {row.observed}, π = {f(row.propensity)}</span><span>δ × loss / π = {f(row.term)}</span>
    </div>)}</div>
    <RecOperands label="Four entry terms keep the full-population denominator"
      headers={['Entry', 'Observed δ', 'Loss', 'Propensity π', 'δ / π', 'δ × loss / π']}
      rows={frame.rows.map(row => [row.id, row.observed, row.loss, row.propensity, row.weight, row.term])} />
    <div className="rec-policy-reduction"><span>Weighted loss sum {f(frame.total)}</span><span>Full population 2 × 2 = 4</span><span>Observed count {frame.count}</span><span>Weight sum {f(frame.weights)}</span></div>
    <RecMatrix label="All sixteen independent observation-mask outcomes, including zero-mass masks"
      columns={['Mask δ00,δ01,δ10,δ11', 'Probability mass', 'Observed count', 'Naive risk', 'IPS risk', 'SNIPS risk']}
      rowNames={frame.outcomes.map(row => `M${row.bits}`)} rows={frame.outcomes.map(row => [row.values.join(','), row.mass, row.count, row.naive, row.ips, row.snips])} />
    <p>Each mask mass multiplies π for observed entries and (1−π) for absent entries. The full risk denominator is always four. An empty mask has weighted loss zero when support exists, but its observed-count and weight-normalized estimates are undefined. If an undefined estimate has positive mask probability, its unconditional expectation is also undefined.</p>
  </RecFigure>;
}
