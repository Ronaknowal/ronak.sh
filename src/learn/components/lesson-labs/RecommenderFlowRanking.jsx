import { createContext, useContext, useState } from 'react';
import { bprDefaults, pairObjective, pairUpdate, stablePairSignal, bprDatasetDefaults, validatePairDataset,
  browserPairTraining, packagePairDraws, slateDefaults, slateCalculation, validateItemIDs, pairedRequests,
  resampledPairs } from '../../data/recommender-flow-ranking-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecExactObject, RecSelect, parseRecVector, formatRec as n , itemHue } from './RecommenderFlowControls.jsx';
import { RecWire as Wire, RecPort as Port, RecBars, RecCurve } from './RecommenderFlowDrawing.jsx';
import './recommender-flow-ranking.css';

const PairContext = createContext(null), SlateContext = createContext(null);
const options = (count, prefix) => Array.from({ length: count }, (_, k) => [k, `${prefix}${k}`]);
const resize = (vector, dimension) => Array.from({ length: dimension }, (_, k) => vector[k] ?? 0);
const defaults = () => ({ ...bprDefaults(), dataset: bprDatasetDefaults(), seed: 29, convention: 'uniform-triple', steps: 20, route: 0 });

export function RecommenderRankingProvider({ children }) {
  const [pair, setPair] = useState(defaults), [pairRevision, setPairRevision] = useState(0);
  const [slate, setSlate] = useState(slateDefaults), [slateRevision, setSlateRevision] = useState(0);
  const pairPatch = values => setPair(previous => ({ ...previous, ...values }));
  const pairReset = () => { setPair(defaults()); setPairRevision(value => value + 1); };
  const slatePatch = values => setSlate(previous => ({ ...previous, ...values }));
  const slateReset = () => { setSlate(slateDefaults()); setSlateRevision(value => value + 1); };
  const setDimension = dimension => setPair(previous => ({ ...previous, dimension,
    p: resize(previous.p, dimension), positive: resize(previous.positive, dimension), negative: resize(previous.negative, dimension) }));
  const setGrades = grades => setSlate(previous => {
    const old = previous.grades.length, added = Array.from({ length: Math.max(0, grades.length - old) }, (_, k) => old + k);
    return { ...previous, grades, order: [...previous.order.filter(id => id < grades.length), ...added],
      eligible: [...previous.eligible.filter(id => id < grades.length), ...added], candidates: [...previous.candidates.filter(id => id < grades.length), ...added] };
  });
  return <PairContext.Provider value={{ ...pair, patch: pairPatch, setDimension, reset: pairReset, revision: pairRevision }}>
    <SlateContext.Provider value={{ ...slate, patch: slatePatch, setGrades, reset: slateReset, revision: slateRevision }}>{children}</SlateContext.Provider>
  </PairContext.Provider>;
}

function usePair() { const state = useContext(PairContext); if (!state) throw new Error('Pair views require RecommenderRankingProvider.'); return state; }
function useSlate() { const state = useContext(SlateContext); if (!state) throw new Error('Slate views require RecommenderRankingProvider.'); return state; }

function PairVector({ state, side, label, width = false }) {
  return <fieldset className="rec-flow-quantity"><legend>{label}</legend>
    {width && <RecQuantity label="Pair factor width" integer value={state.dimension} min={1} max={5} revision={state.revision} onChange={state.setDimension} />}
    <RecExactObject label={`${label} coordinates`} value={state[side]} revision={state.revision}
      description={`${state.dimension} exact coordinates, each ±10000. Width edits drop removed coordinates and grow zeros.`}
      parse={text => parseRecVector(text, state.dimension, -1e4, 1e4)} onChange={vector => state.patch({ [side]: vector })} />
  </fieldset>;
}

export function PairGapFigure() {
  const state = usePair(), result = pairObjective(state.p, state.positive, state.negative, state.lambda);
  const minimumGap = Math.min(-4, result.gap), maximumGap = Math.max(4, result.gap);
  const plottedGaps = [...new Set([...Array.from({ length: 81 }, (_, k) => minimumGap + k / 80 * (maximumGap - minimumGap)), -2, 0, 2, result.gap])].sort((left, right) => left - right);
  return <RecFigure id="D34" label="Three actual factor arrays feed two scores, gap and stable pair loss" reset={state.reset}
    controls={<><PairVector state={state} side="negative" label="Compared negative item" width />
      <RecQuantity label="Pair learning rate η" value={state.eta} min={0} max={1} revision={state.revision} onChange={eta => state.patch({ eta })} />
      <RecQuantity label="Pair local penalty λ" value={state.lambda} min={0} max={10} revision={state.revision} onChange={lambda => state.patch({ lambda })} /></>}
    result={`Positive dot ${n(result.positiveDot)} minus negative dot ${n(result.negativeDot)} gives gap ${n(result.gap)}. Stable likelihood loss ${n(result.likelihood)}, three-vector penalty ${n(result.penalty)}, total ${n(result.loss)}. Pair signal σ(−gap) ${n(result.signal)} is not purchase probability.`}>
    <RecMatrix
      columnHues={options(state.dimension, 'k').map(([id]) => itemHue(id))} label="Named old user and compared item coordinate arrays" rows={[state.p, state.positive, state.negative]}
      rowNames={['User p', 'Positive qᵢ', 'Compared qⱼ']} columns={options(state.dimension, 'k').map(([, label]) => label)} />
    <RecOperands
      rowHues={state.p.map((_, k) => itemHue(k))} label="Both matching-coordinate products read the same old user" headers={['Coordinate', 'p', 'qᵢ', 'Positive product', 'qⱼ', 'Compared product']}
      rows={state.p.map((p, k) => [`k${k}`, p, state.positive[k], p * state.positive[k], state.negative[k], p * state.negative[k]])} />
    <div className="rec-flow-values"><Port>Σ p×qᵢ {n(result.positiveDot)}</Port><span className="rec-flow-operator">−</span>
      <Port hue={1}>Σ p×qⱼ {n(result.negativeDot)}</Port><Wire /><strong>Δ {n(result.gap)}</strong><Wire /><span>max(0,−Δ) + log(1+exp(−|Δ|))</span><Wire /><strong>{n(result.likelihood)}</strong></div>
    <RecOperands label="Separate matching-addend cancellation: same μ=3 and user bias=.2 in both scores" headers={['Route', 'Positive score', 'Compared score', 'Difference']}
      rows={[["Dots only", result.positiveDot, result.negativeDot, result.gap], ['Add μ and same user bias', 3.2 + result.positiveDot, 3.2 + result.negativeDot, result.gap]]} />
    <RecCurve label="Stable signal at declared gap anchors" points={plottedGaps.map(gap => [gap, stablePairSignal(gap)])}
      xLabel="Gap Δ" yLabel="σ(−Δ)" selected={[result.gap, result.signal]} />
    <RecOperands label="Separate gap anchors; actual selected gap sets the plot range" headers={['Gap', 'Signal σ(−Δ)', 'Stable likelihood loss']}
      rows={[-2, 0, 2].map(gap => [gap, stablePairSignal(gap), Math.max(0, -gap) + Math.log1p(Math.exp(-Math.abs(gap)))])} />
    <p>Any shared mean/user addend cancels. An item-bias difference would remain; the separate package route below includes it.</p>
  </RecFigure>;
}

export function PairGradientFigure() {
  const state = usePair(), result = pairUpdate(state), sequential = pairUpdate(state, true), old = result.old;
  return <RecFigure id="D35" label="Old-buffer branches produce simultaneous p/positive/negative gradients" reset={state.reset}
    controls={<><PairVector state={state} side="p" label="Pair user" /><PairVector state={state} side="positive" label="Positive item" /></>}
    result={result.available ? `Old gap ${n(old.gap)}, signal ${n(old.signal)}. Simultaneous new gap ${n(result.after.gap)}, local loss ${n(result.after.loss)} versus old ${n(old.loss)}. Rate ${n(state.eta)}, penalty ${n(state.lambda)}; every correct item branch reads old p.` : result.reason}>
    <div className="rec-flow-values"><Port>Old p ({state.p.map(n).join(', ')})</Port><Port hue={1}>Old qᵢ−qⱼ ({state.positive.map((value, k) => n(value - state.negative[k])).join(', ')})</Port>
      <Wire /><span>Old Δ {n(old.gap)}</span><Wire /><strong>g=σ(−Δ) {n(old.signal)}</strong></div>
    <RecOperands label="Actual three-branch data and prior operands, before any buffer writes" headers={['Parameter', 'Old', 'Data derivative', 'λ×old', 'Total derivative', 'Simultaneous new', 'Reads updated p: different algorithm']}
      rows={['p', 'positive', 'negative'].flatMap(side => state[side].map((value, k) => {
        const gradient = side === 'p' ? result.gp[k] : side === 'positive' ? result.gi[k] : result.gj[k];
        const data = side === 'p' ? -old.signal * (state.positive[k] - state.negative[k]) : (side === 'positive' ? -1 : 1) * old.signal * state.p[k];
        return [`${side} k${k}`, value, data, state.lambda * value, gradient, result.next?.[side][k] ?? null, sequential.next?.[side][k] ?? null];
      }))} />
    {result.available && <><RecMatrix
      columnHues={options(state.dimension, 'k').map(([id]) => itemHue(id))} label="Proposed simultaneous new buffers" rows={[result.next.p, result.next.positive, result.next.negative]}
      rowNames={['New user p', 'New positive qᵢ', 'New compared qⱼ']} columns={options(state.dimension, 'k').map(([, label]) => label)} />
      <div className="rec-flow-values"><span>New dot with qᵢ {n(result.after.positiveDot)}</span><span className="rec-flow-operator">−</span><span>New dot with qⱼ {n(result.after.negativeDot)}</span>
        <Wire /><strong>New gap {n(result.after.gap)}</strong><Wire /><strong>Current loss {n(result.after.loss)}</strong></div></>}
    <p>With all three arrays zero, the pure dot data gradients stay zero. A large step may increase the local loss; the display keeps that actual outcome.</p>
  </RecFigure>;
}

export function PairPopulationFigure() {
  const state = usePair(), training = browserPairTraining(state.dataset, state.dimension, state.seed, state.convention, state.eta, state.lambda, state.steps);
  const population = training.population, routeIndex = Math.min(state.route, Math.max(0, population.routes.length - 1)), route = population.routes[routeIndex];
  const occurrence = population.occurrences.find(record => record.id === route?.occurrence) ?? population.occurrences[0];
  const draws = packagePairDraws(population, occurrence);
  const lastSample = training.samples.at(-1);
  return <RecFigure id="D36" label="Complete occurrence comparison population, conditioning weights and actual browser update trace" reset={state.reset}
    controls={<><RecExactObject label="Complete pair dataset and eligibility object" value={state.dataset} revision={state.revision}
      description="JSON R: binary 1–20 users×1–30 items; positive_occurrences: null for unique pairs or separately identified {id,user,item} records; eligible_items: binary item vector or full mask. Hiding a positive never creates a negative."
      parse={text => validatePairDataset(JSON.parse(text))} onChange={dataset => state.patch({ dataset, route: 0 })} />
      <fieldset className="rec-flow-quantity"><legend>Sampler, seed and selected route</legend>
        <RecSelect label="Comparison sampling rule" value={state.convention} options={[["uniform-triple", 'Uniform occurrence–negative routes'], ['uniform-user', 'Uniform eligible users, then routes']]}
          onChange={convention => state.patch({ convention })} />
        <RecQuantity label="Browser pair seed" integer value={state.seed} min={0} max={4294967295} revision={state.revision} onChange={seed => state.patch({ seed })} />
        <RecQuantity label="Selected occurrence route" integer value={routeIndex} min={0} max={Math.max(0, population.routes.length - 1)} revision={state.revision} onChange={route => state.patch({ route })} />
      </fieldset><RecQuantity label="Browser pair updates" integer value={state.steps} min={0} max={200} revision={state.revision} onChange={steps => state.patch({ steps })} /></>}
    result={training.available ? `${population.routes.length} occurrence–negative routes, ${population.users.length} eligible users. Current browser completed ${training.samples.length}/${state.steps} requested updates, objective ${n(training.states.at(-1).loss)}. ${training.unavailable?.reason ?? 'Old buffers retained throughout each simultaneous step.'} Current browser generator differs from the separately recorded NumPy fit.` : training.reason}>
    <RecMatrix
      columnHues={options(population.R[0].length, 'I').map(([id]) => itemHue(id))} label="Complete binary positive history R: zero is eligible for comparison only after hard eligibility" rows={population.R}
      rowNames={options(population.R.length, 'U').map(([, label]) => label)} columns={options(population.R[0].length, 'I').map(([, label]) => label)} />
    <div className="rec-ranked-occurrences"><RecOperands label="Every positive occurrence remains a distinct source object" headers={['Occurrence ID', 'User', 'Positive item', 'Eligible', 'Available negative IDs']}
      rows={population.occurrences.map(record => [record.id, `U${record.user}`, `I${record.item}`, population.eligible[record.user][record.item] ? 'yes' : 'no', population.R[record.user].flatMap((value, item) => !value && population.eligible[record.user][item] ? [`I${item}`] : []).join(', ') || 'none'])} /></div>
    <RecOperands label="User population weights differ under the two named rules" headers={['User', 'Occurrence–negative routes', 'Uniform-route user mass', 'Uniform-user mass', 'Current mass']}
      rows={population.R.map((_, user) => [`U${user}`, population.counts[user], population.routes.length ? population.counts[user] / population.routes.length : null,
        population.counts[user] ? 1 / population.users.length : 0, training.distribution.userMass[user]])} />
    {route ? <div className="rec-flow-values"><Port hue={route.positive}>{route.occurrence}: U{route.user}/I{route.positive}</Port><Wire /><Port hue={route.negative}>Unobserved eligible I{route.negative}</Port>
      <Wire /><strong>Route probability {n(training.distribution.weights[routeIndex])}</strong></div> : <strong>No admissible comparison; no impossible-negative loop runs.</strong>}
    {population.skipped.length > 0 && <RecOperands label="Actual excluded occurrences and reasons" headers={['Occurrence', 'Reason']}
      rows={population.skipped.map(record => [record.id, record.reason])} />}
    {training.available && <><div className="rec-flow-parallel"><RecMatrix
      columnHues={options(state.dimension, 'k').map(([id]) => itemHue(id))} label="Actual seeded browser initial P" rows={training.initialP} rowNames={options(population.R.length, 'U').map(([, label]) => label)} columns={options(state.dimension, 'k').map(([, label]) => label)} />
      <RecMatrix
      columnHues={options(state.dimension, 'k').map(([id]) => itemHue(id))} rowHues={options(population.R[0].length, 'I').map(([item]) => itemHue(item))} label="Actual seeded browser initial Q" rows={training.initialQ} rowNames={options(population.R[0].length, 'I').map(([, label]) => label)} columns={options(state.dimension, 'k').map(([, label]) => label)} /></div>
      <RecCurve label="Actual browser fixed-state population objective after each completed update" points={training.states.map(row => [row.step, row.loss])}
        xLabel="Completed update" yLabel="Weighted local-loss mean" selected={[training.states.at(-1).step, training.states.at(-1).loss]} />
      <div className="rec-ranked-occurrences"><RecOperands label="Actual sampled occurrence IDs, weights and old/new gaps" headers={['Update', 'Occurrence', 'User', 'Positive', 'Compared', 'Route probability', 'Old gap', 'New gap']}
        rows={training.samples.map(sample => [sample.step, sample.occurrence, `U${sample.user}`, `I${sample.positive}`, `I${sample.negative}`, sample.probability, sample.oldGap, sample.newGap])} /></div>
      {lastSample && <><div className="rec-flow-values"><Port hue={lastSample.positive}>Last completed draw {lastSample.step}: {lastSample.occurrence}</Port><Wire />
        <span>U{lastSample.user}, I{lastSample.positive} over I{lastSample.negative}</span><Wire /><strong>Old gap {n(lastSample.oldGap)} → new gap {n(lastSample.newGap)}</strong></div>
        <RecOperands label="Actual last sampled update reads old arrays before simultaneous writes" headers={['Parameter / entity', 'Old coordinate', 'Derivative', 'η', 'New coordinate']}
          rows={['p', 'positive', 'negative'].flatMap(side => lastSample.before[side].map((value, k) => [
            `${side} ${side === 'p' ? `U${lastSample.user}` : `I${side === 'positive' ? lastSample.positive : lastSample.negative}`} k${k}`,
            value, lastSample.gradients[side][k], state.eta, lastSample.after[side][k]]))} />
      </>}
      <div className="rec-flow-parallel"><RecMatrix
      columnHues={options(state.dimension, 'k').map(([id]) => itemHue(id))} label="Last valid browser P" rows={training.P} rowNames={options(population.R.length, 'U').map(([, label]) => label)} columns={options(state.dimension, 'k').map(([, label]) => label)} />
        <RecMatrix
      columnHues={options(state.dimension, 'k').map(([id]) => itemHue(id))} rowHues={options(population.R[0].length, 'I').map(([item]) => itemHue(item))} label="Last valid browser Q" rows={training.Q} rowNames={options(population.R[0].length, 'I').map(([, label]) => label)} columns={options(state.dimension, 'k').map(([, label]) => label)} /></div>
      <p>{training.generator} The diagnostic evaluates all {population.routes.length} route losses after a step; its cost is O(routes×d), separately from an O(d) selected update.</p></>}
    <p>The full population starts from its displayed seeded arrays. D34/D35's manual three-vector example is separate; width, learning rate and local penalty are shared.</p>
    <div className="rec-flow-values"><Port hue={1}>Separate implicit 0.7.3 negative draw</Port><Wire /><span>Choose a stored positive index globally</span><Wire /><span>Read its item ID</span><Wire /><strong>Seen by selected U{occurrence?.user ?? '—'}? Skip attempt.</strong></div>
    <RecOperands
      rowHues={draws.map(row => itemHue(row.item))} label="Actual binary-history global-frequency draw support, separate from scratch full-support sampling" headers={['Negative item', 'Positive-index frequency', 'Draw probability', 'Selected user already saw item', 'Scratch eligibility', 'Package attempt action']}
      rows={draws.map(row => [`I${row.item}`, row.frequency, row.probability, row.seen ? 'yes' : 'no', population.eligible[occurrence.user][row.item] ? 'yes' : 'no', !row.supported ? 'zero support' : row.seen ? 'skip' : 'accept comparison'])} />
    <RecOperands label="Separate unchanged recorded ordinary run on the original 3×4 fixture" headers={['Recorded attempts', 'Accepted', 'Skipped', 'Negative frequencies', 'Additional score coordinate']}
      rows={[[200, 77, 123, '[2,2,1,0]/5', 'User fixed 1 × learned item bias']]} />
    <p>The recorded 200/77/123 counts belong to the original ordinary execution, not this edited browser population. The frequency sketch reads full binary R and the seen-negative test; it does not apply the scratch eligibility mask. The package ignores stored nonzero magnitudes and its item-bias difference survives in the pair gap.</p>
  </RecFigure>;
}

export function SlateConstructionFigure() {
  const state = useSlate(), result = slateCalculation(state);
  return <RecFigure id="D37" label="Actual ranked identity sequence passes candidate/eligibility gates before requested slots" reset={state.reset}
    controls={<><RecExactObject label="Ranked order and hard eligibility" value={{ order: state.order, eligible: state.eligible }} revision={state.revision}
      description={`Unique numeric item IDs 0…${state.grades.length - 1}; empty order/eligibility are allowed. ID order is the actual ranker's output, not a new numeric score fit.`}
      parse={text => { const value = JSON.parse(text); return { order: validateItemIDs(value.order, state.grades.length, 'Order'), eligible: validateItemIDs(value.eligible, state.grades.length, 'Eligibility') }; }} onChange={state.patch} />
      <RecQuantity label="Requested ranking slots K" integer value={state.cutoff} min={1} max={50} revision={state.revision} onChange={cutoff => state.patch({ cutoff })} /></>}
    result={`Issued IDs ${result.selected.map(item => `I${item}`).join(', ') || 'none'}, ${result.selected.length}/${state.cutoff} slots filled. Eligibility and current candidate basket act before top K; repeated IDs are invalid, not extra hits.`}>
    <div className="rec-flow-values">{state.order.map((item, index) => <Port key={item} hue={item}>#{index + 1} I{item}, grade {n(state.grades[item])}</Port>)}</div>
    <RecOperands
      rowHues={state.order.map(itemHue)} label="Every ranked ID has two explicit pre-cutoff gates" headers={['Item', 'Hard eligible', 'In candidate basket', 'Forward to cutoff']}
      rows={state.order.map(item => [`I${item}`, state.eligible.includes(item) ? 'yes' : 'no', state.candidates.includes(item) ? 'yes' : 'no', result.filtered.includes(item) ? 'yes' : 'removed'])} />
    <Wire down /><div className="rec-flow-values">{Array.from({ length: state.cutoff }, (_, index) => <Port key={index} hue={result.selected[index] ?? 5}>Slot {index + 1}: {result.selected[index] === undefined ? 'unfilled' : `I${result.selected[index]}`}</Port>)}</div>
  </RecFigure>;
}

export function RankingMetricsFigure() {
  const state = useSlate(), result = slateCalculation(state);
  return <RecFigure id="D38" label="Actual hit, AP and graded-gain operands retain full eligible ideal denominator" reset={state.reset}
    controls={<><RecExactObject label="Complete truth grades by item ID" value={state.grades} revision={state.revision}
      description="1–50 grade coordinates, each finite 0–3; a grade above 0 declares relevant truth. Changing length drops removed IDs and adds new zero-grade IDs."
      parse={text => { const values = JSON.parse(text); if (!Array.isArray(values) || values.length < 1 || values.length > 50 || values.some(value => !Number.isFinite(value) || value < 0 || value > 3)) throw new Error('Use 1–50 finite grades from 0 to 3.'); return values; }} onChange={state.setGrades} />
      <RecQuantity label="Requested metric slots K" integer value={state.cutoff} min={1} max={50} revision={state.revision} onChange={cutoff => state.patch({ cutoff })} /></>}
    result={`Hits ${result.hits}; precision ${n(result.precision)}, recall ${n(result.recall)}, RR ${n(result.reciprocal)}, AP ${n(result.averagePrecision)}, NDCG ${n(result.ndcg)}, fill ${n(result.fill)}. Eligible relevant truth ${result.relevant.length}; candidate loss never removes truth from the ideal.`}>
    <RecOperands
      rowHues={result.operands.map(row => itemHue(row.item))} label="Each actual issued position contributes a hit precision and graded discounted gain" headers={['Rank / item', 'Grade', 'Hit', 'Hits through rank', 'Precision at hit', 'Gain 2^grade−1', 'log₂(rank+1)', 'Discounted gain']}
      rows={result.operands.map(row => [`${row.rank}: I${row.item}`, row.grade, row.hit ? 1 : 0, row.cumulativeHits, row.precisionAtHit, row.gain, row.divisor, row.discounted])} />
    <RecOperands
      rowHues={result.idealOperands.map(row => itemHue(row.item))} label="Full eligible ideal, independently sorted before cutoff" headers={['Ideal rank / item', 'Grade', 'Gain', 'Divisor', 'Discounted gain']}
      rows={result.idealOperands.map(row => [`${row.rank}: I${row.item}`, row.grade, row.gain, row.divisor, row.value])} />
    <RecOperands label="Named numerators and denominators remain visible" headers={['Metric', 'Numerator', 'Denominator / condition', 'Result']}
      rows={[["Precision", result.hits, state.cutoff, result.precision], ['Recall', result.hits, result.relevant.length || 'no qualifying truth', result.recall],
        ['Reciprocal rank', result.first ? 1 : 0, result.first ?? (result.relevant.length ? 'no hit → 0' : 'no truth → undefined'), result.reciprocal],
        ['Average precision', result.apSum, result.relevant.length ? Math.min(state.cutoff, result.relevant.length) : 'no truth', result.averagePrecision],
        ['NDCG', result.dcg, result.ideal || 'no positive ideal', result.ndcg], ['Fill', result.selected.length, state.cutoff, result.fill]]} />
  </RecFigure>;
}

export function CandidateCeilingFigure() {
  const state = useSlate(), result = slateCalculation(state), missing = result.relevant.filter(item => !state.candidates.includes(item));
  return <RecFigure id="D39" label="Actual relevant item identities stay outside an incomplete candidate basket" reset={state.reset}
    controls={<RecExactObject label="Retrieved candidate item IDs" value={state.candidates} revision={state.revision}
      description={`Unique IDs from 0 to ${state.grades.length - 1}. Candidate filtering never changes the separately declared truth.`}
      parse={text => validateItemIDs(JSON.parse(text), state.grades.length, 'Candidates')} onChange={candidates => state.patch({ candidates })} />}
    result={`Candidate relevant ${result.retrievedRelevant.length} of full eligible relevant ${result.relevant.length}; perfect-ranker recall ceiling ${n(result.ceiling)}. Current achieved recall ${n(result.recall)} is a separate calculation.`}>
    <div className="rec-candidate-basket"><span>Actual retrieved basket</span><div className="rec-flow-values">{state.candidates.map(item => <Port key={item} hue={item}>I{item}: grade {n(state.grades[item])}{state.eligible.includes(item) ? '' : ', hard ineligible'}</Port>)}{!state.candidates.length && <span>Empty basket</span>}</div></div>
    <div className="rec-flow-values"><span>Eligible relevant truth outside basket:</span>{missing.map(item => <Port key={item} hue={item}>I{item}: unretrieved grade {n(state.grades[item])}</Port>)}{!missing.length && <span>none</span>}</div>
    <div className="rec-flow-values"><span>min(K {state.cutoff}, candidate relevant {result.retrievedRelevant.length})</span><span className="rec-flow-operator">÷</span>
      <span>Full eligible relevant {result.relevant.length}</span><Wire /><strong>{n(result.ceiling)}</strong></div>
    <p>A perfect remaining ranker cannot create an unretrieved item. Selecting only known positives plus a few other candidates defines a different assessment population.</p>
  </RecFigure>;
}

export function PairedRequestFigure() {
  const [sample, setSample] = useState([0, 0, 2, 3]), [revision, setRevision] = useState(0);
  const current = resampledPairs(sample), original = resampledPairs([0, 1, 2, 3]);
  return <RecFigure id="D40" label="Paired whole user-request rows retain method, baseline and null support through resampling" reset={() => { setSample([0, 0, 2, 3]); setRevision(value => value + 1); }}
    controls={<RecExactObject label="Resampled user-request ID vector" value={sample} revision={revision}
      description="Numeric row IDs 0–4; repeated rows are intended, empty is allowed. U4 is a separately declared no-truth row and stays outside the valid denominator."
      parse={text => { const ids = JSON.parse(text); if (!Array.isArray(ids) || ids.length > 10000 || ids.some(id => !Number.isInteger(id) || id < 0 || id > 4)) throw new Error('Use at most 10000 row IDs from 0 to 4; repeats are allowed.'); return ids; }} onChange={setSample} />}
    result={`Original four valid paired rows mean ${n(original.mean)}. Current sample valid ${current.valid.length}/${current.rows.length}, excluded null rows ${current.omitted}, paired mean ${n(current.mean)}. One resample is not a confidence interval.`}>
    <RecOperands label="Original paired request rows; U4 is a separate missing-truth example" headers={['Request', 'Baseline metric', 'Method metric', 'Paired difference']}
      rows={pairedRequests.map(row => [row.id, row.baseline, row.method, row.method === null ? null : row.method - row.baseline])} />
    <div className="rec-flow-values">{current.rows.map((row, index) => <Port key={index} hue={row.index}>Draw {index + 1}: {row.id}, both method/baseline retained</Port>)}{!sample.length && <span>No resampled requests</span>}</div>
    <div className="rec-ranked-occurrences"><RecOperands label="Actual repeated paired-row differences and denominator membership" headers={['Draw / request', 'Baseline', 'Method', 'Difference', 'Included']}
      rows={current.rows.map((row, index) => [`${index + 1}: ${row.id}`, row.baseline, row.method, row.difference, row.difference === null ? 'no truth → excluded' : 'yes'])} /></div>
    <div className="rec-flow-values"><span>Σ valid paired differences {n(current.valid.reduce((total, row) => total + row.difference, 0))}</span>
      <span className="rec-flow-operator">÷</span><span>Valid paired rows {current.valid.length}</span><Wire /><strong>{n(current.mean)}</strong></div>
  </RecFigure>;
}
