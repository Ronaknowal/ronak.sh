import { createContext, useContext, useMemo, useState } from 'react';
import { recommenderStudyState as saved, syntheticComparisons, studySummary, retailQuery, reloadBundle } from '../../data/recommender-flow-study-models.js';
import { originalEvents } from '../../data/recommender-flow-evidence-models.js';
import { RecFigure, RecMatrix, RecOperands, RecSelect, RecQuantity, RecExactObject, parseRecVector, formatRec as f, itemHue } from './RecommenderFlowControls.jsx';
import { RecBars, RecPort, RecWire } from './RecommenderFlowDrawing.jsx';
import './recommender-flow-study.css';

const StudyContext = createContext(null);
const defaults = () => ({ user: 0, item: 0, period: 'train', countRows: {}, candidateMask: Array(100).fill(1), fault: 'valid' });
const maximumCount = Math.max(20, ...saved.prefix.counts.flat());
export function RecommenderStudyProvider({ children }) {
  const [state, setState] = useState(defaults), [revision, setRevision] = useState(0);
  const patch = values => setState(previous => ({ ...previous, ...values }));
  const editCounts = row => setState(previous => ({ ...previous, countRows: { ...previous.countRows, [previous.user]: row } }));
  const reset = () => { setState(defaults()); setRevision(value => value + 1); };
  return <StudyContext.Provider value={{ ...state, patch, editCounts, reset, revision }}>{children}</StudyContext.Provider>;
}
function useStudy() {
  const state = useContext(StudyContext);
  if (!state) throw new Error('Saved-study figures require the separately named study provider.');
  return state;
}
const coordinateNames = width => Array.from({ length: width }, (_, k) => `coordinate ${k}`);

export function RecordedSyntheticComparisonFigure() {
  const comparisons = useMemo(syntheticComparisons, []), [choice, setChoice] = useState('0');
  const frame = comparisons[Number(choice)];
  const role = tick => tick <= frame.cutoff ? 'training' : tick < 26 ? 'validation' : 'test';
  return <RecFigure id="D51" label="Retained complete synthetic comparisons and their event permissions"
    controls={<RecSelect label="Recorded synthetic cutoff" value={choice} onChange={setChoice}
      options={[['0', 'cutoff 20: 20 / 5 / 6'], ['1', 'cutoff 18: 18 / 7 / 6']]} />}
    reset={() => setChoice('0')} result={`Recorded cutoff ${frame.cutoff}: ${frame.split.join('/')} events; rank ${frame.rank}, λ ${frame.penalty}, validation RMSE ${frame.validationRMSE}. All-test baseline ${frame.rows[0].baseline}, MF ${frame.rows[0].factor}: MF has higher error. This selector reads retained outcomes; it does not fit or choose a new cutoff using test results.`}>
    <div className="rec-flow-pan" role="region" tabIndex={0} aria-label="All thirty-one synthetic event times: local scroll">
      <svg className="rec-study-timeline" viewBox="0 0 1100 230" role="img" aria-label={`Thirty-one events on actual integer ticks; cutoff ${frame.cutoff}, held test begins 26.`}>
        <text x="24" y="24">Invented event tick; every item release is 0</text>
        <line x1="90" y1="100" x2="1050" y2="100" stroke="#aaa" />
        {[0, frame.cutoff, 25, 31].map(tick => <g key={tick}><line x1={90 + tick * 30} y1="75" x2={90 + tick * 30} y2="125" stroke="#aaa" /><text x={90 + tick * 30} y="155" textAnchor="middle">{tick}</text></g>)}
        {originalEvents.map(event => <g key={event.id}><circle cx={90 + event.tick * 30} cy="100" r="6" fill={itemHue(role(event.tick) === 'training' ? 0 : role(event.tick) === 'validation' ? 2 : 1)} />
          <text x={90 + event.tick * 30} y="64" textAnchor="middle" transform={`rotate(-90 ${90 + event.tick * 30} 64)`}>{event.id}</text></g>)}
        <text x="120" y="205">Training 1…{frame.cutoff}</text><text x="520" y="205">Validation {frame.cutoff + 1}…25</text><text x="825" y="205">Untouched test 26…31</text>
      </svg>
    </div>
    <RecMatrix label="All original event identities and roles for the selected recorded cutoff" columns={['Tick', 'User', 'Item', 'Rating', 'Role']}
      rowNames={originalEvents.map(event => event.id)} rows={originalEvents.map(event => [event.tick, `U${event.user}`, `I${event.item}`, event.rating, role(event.tick)])} />
    <RecBars label="Recorded test RMSE; lower is lower rating error" rows={frame.rows.flatMap((row, index) => [
      { id: `${row.name}: baseline`, value: row.baseline, hue: 0 }, { id: `${row.name}: MF`, value: row.factor, hue: 1 }
    ])} />
    <RecMatrix label="Recorded cohort denominators and errors" columns={['Test events', 'Item baseline RMSE', 'MF RMSE']}
      rowNames={frame.rows.map(row => row.name)} rows={frame.rows.map(row => [row.count, row.baseline, row.factor])} />
    <p>The cold-user cohort has one event. For U0 the retained popularity order is I4, I6 while the MF order is I6, I4; the rating-error outcomes do not supply relevance labels for that unobserved list.</p>
  </RecFigure>;
}

export function RetailDataAuditFigure() {
  const state = useStudy(), period = saved.periods[state.period], manifest = saved.manifest;
  const events = period.events.filter(event => event.user === saved.ids.users[state.user]);
  const filters = manifest.filters;
  const rows = [['Original workbook before exclusions', 0, filters.allRows],
    ['Missing customer', filters.excludedMissingCustomer], ['Cancellation invoice', filters.excludedCancellation],
    ['Nonpositive quantity after earlier gates', filters.excludedNonpositiveQuantity],
    ['Nonpositive price after earlier gates', filters.excludedNonpositivePrice], ['Nonproduct code after earlier gates', filters.excludedNonproductCode]];
  let remaining = filters.allRows;
  rows.slice(1).forEach(row => { remaining -= row[1]; row.push(remaining); });
  const counts = manifest.roles[state.period].counts;
  return <RecFigure id="D52" label="Actual Retail disjoint filters, monthly occurrences and complete selected matrix" reset={state.reset}
    controls={<>
      <RecQuantity label="Saved customer row" value={state.user} min={0} max={199} integer revision={state.revision} onChange={user => state.patch({ user })} />
      <RecQuantity label="Saved item column" value={state.item} min={0} max={99} integer revision={state.revision} onChange={item => state.patch({ item })} />
      <RecSelect label="Recorded calendar period" value={state.period} onChange={period => state.patch({ period })}
        options={[['train', 'December training'], ['validation', 'January validation'], ['test', 'February test']]} />
    </>}
    result={`${state.period}: ${counts.occurrences} catalogue occurrences, ${counts.pairs} distinct pairs. ${saved.ids.users[state.user]} / ${saved.ids.items[state.item]} has count ${period.counts[state.user][state.item]}; selected customer has ${events.filter(event => event.inside).length} inside and ${events.filter(event => !event.inside).length} outside-catalogue occurrences. Future outcomes are recorded assessment data, not the request history used to fit or score an earlier month.`}>
    <RecMatrix label="Sequential disjoint row filters: subtract each exclusion exactly once" columns={['Rows excluded at this first failing gate', 'Rows remaining']}
      rowNames={rows.map(row => row[0])} rows={rows.map(row => row.slice(1))} />
    <div className="rec-study-months">{['train', 'validation', 'test'].map(role => <div key={role}>
      <strong>{role}</strong><span>{manifest.roles[role].calendar.join(' → ')}</span>
      <span>{manifest.roles[role].counts.occurrences} occurrences / {manifest.roles[role].counts.pairs} pairs</span>
      <span>{role === 'train' ? 'Training coverage' : `${manifest.roles[role].counts.truthUsers} qualified discovery requests / 200`}</span>
    </div>)}</div>
    <p>December chooses 100 products by occurrence count and original stock-code lexical ties, then 200 of the 615 eligible customers by canonical customer-ID hash. January and February do not reselect either axis. These local IDs are not an anonymity guarantee.</p>
    <RecMatrix
      columnHues={saved.ids.items.map((_, item) => itemHue(item))} label={`Complete 200×100 ${state.period} occurrence-count matrix`} columns={saved.ids.items} rowNames={saved.ids.users}
      rows={period.counts} selected={[state.user, state.item]} />
    <RecMatrix label="Every selected-customer invoice-time occurrence, including outside catalogue" columns={['Item local ID', 'Source-naive time', 'Inside selected catalogue']}
      rowNames={events.map(event => event.id)} rows={events.map(event => [event.item, event.time, event.inside ? 'inside' : 'outside'])} />
    {events.length === 0 && <p>No selected-customer occurrences in this month; this is not proof of dislikes.</p>}
    <p>541909 original rows → 396046 retained product rows across all dates → 65248 distinct three-month occurrences before the fixed cohort. Repeated later invoice/time occurrences remain counts; exact duplicate four-field keys were removed. Purchases supply neither exposure probabilities nor stock availability.</p>
  </RecFigure>;
}

export function LockedStudyComparisonFigure() {
  const [metric, setMetric] = useState('ndcg'), [cohort, setCohort] = useState('all');
  const validation = studySummary('validation', metric, cohort), test = studySummary('test', metric, cohort);
  const interval = saved.report.pairedUserBootstrap[saved.report.overallWinner].ndcg;
  const reset = () => { setMetric('ndcg'); setCohort('all'); };
  return <RecFigure id="D53" label="Complete recorded selection, both prospective locks and test comparisons" reset={reset}
    controls={<>
      <RecSelect label="Recorded metric" value={metric} onChange={setMetric} options={['ndcg', 'recall', 'ap', 'rr', 'precision', 'fill'].map(name => [name, `${name}@10`])} />
      <RecSelect label="Saved request cohort" value={cohort} onChange={setCohort}
        options={[['all', 'All 200 (exclude undefined values per metric)'], ['qualified', 'Nonempty discovery truth only'], ['null', 'Empty discovery truth only']]} />
    </>}
    result={`Locked validation winner and best ALS: ${saved.report.overallWinner}; only that ALS was prefix-refitted. ${metric}@10 / ${cohort} uses displayed denominators. NDCG winner-minus-popularity interval [${interval.interval.map(f).join(', ')}] includes zero; this does not establish causal or universal superiority.`}>
    <RecMatrix label="Every declared validation alternative, including the weaker settings" columns={['Rule', `Selected ${metric}@10`, 'Defined denominator', 'Selected cohort requests', 'Recorded all-population macro']}
      rowNames={validation.map((row, index) => `V${index}`)} rows={validation.map(row => [row.name, row.value, row.denominator, row.requests, row.recordedMacro])} />
    {validation.some(row => row.value !== null) && <RecBars label={`January ${metric}@10; every defined alternative`} rows={validation.filter(row => row.value !== null).map((row, index) => ({ id: `V${index}: ${row.name}`, value: row.value }))} />}
    {!validation.some(row => row.value !== null) && <p>This cohort has no defined {metric} values; no zero bars are invented.</p>}
    <div className="rec-study-locks"><RecPort>January choice: {saved.selection.overallWinner}</RecPort><RecWire />
      <RecPort>Selection lock; February not parsed</RecPort><RecWire /><RecPort>One prefix ALS refit: {saved.report.prefixCounts.occurrences} occurrences / {saved.report.prefixCounts.nonzeroPairs} pairs</RecPort><RecWire />
      <RecPort>Prediction lock; February not parsed</RecPort><RecWire /><RecPort>February truth: 48 qualified / 200</RecPort></div>
    <RecMatrix label="Only the three already locked prefix rules have test results" columns={['Rule', `Selected ${metric}@10`, 'Defined denominator', 'Selected cohort requests', 'Recorded all-population macro']}
      rowNames={test.map((row, index) => `T${index}`)} rows={test.map(row => [row.name, row.value, row.denominator, row.requests, row.recordedMacro])} />
    {test.some(row => row.value !== null) ? <RecBars label={`February ${metric}@10; locked prefix rules`} rows={test.filter(row => row.value !== null).map((row, index) => ({ id: `T${index}: ${row.name}`, value: row.value }))} /> : <p>This test cohort has no defined {metric} values; no result curve is invented.</p>}
    <p>The four factor settings are rank 4/8 crossed with λ .1/1, each with ten original sweeps. Baselines use the same allowed histories. All settings use their own final-Q fixed-history request vectors for validation. Stored training P remains a different array; neither browser controls nor test outcomes train another model.</p>
    <RecMatrix label="Recorded conditional paired intervals and ordinary correspondence" columns={['Recorded value / lower', 'Upper / limit']}
      rowNames={['NDCG winner−popularity interval', 'Recall winner−popularity interval', 'Ordinary direct-score maximum difference', 'Ordinary absolute / relative tolerance']}
      rows={[interval.interval, saved.report.pairedUserBootstrap[saved.report.overallWinner].recall.interval,
        [saved.report.ordinaryDifferences.queryScores, 'read-only original comparison'], [1e-8, 1e-7]]} />
    <p>Qualified-only or empty-truth controls recompute a named subgroup summary from saved per-customer rows. They do not change the recorded selection. Precision and fill in the original report keep all 200 requests; recall, RR, AP and NDCG retain their undefined masks. The sampled-candidate diagnostic is a different distribution, never a selection criterion.</p>
  </RecFigure>;
}

export function SavedRetailQueryFigure() {
  const state = useStudy(), counts = state.countRows[state.user] ?? saved.prefix.counts[state.user];
  const [filterRevision, setFilterRevision] = useState(0);
  const bundle = useMemo(() => reloadBundle(state.fault, state.user), [state.fault, state.user]);
  const frame = useMemo(() => retailQuery(state.user, counts, state.item, state.candidateMask), [state.user, counts, state.item, state.candidateMask]);
  const available = bundle.available && frame.available;
  return <><RecFigure id="D54" label="Actual fixed final-Q Retail request, solve, products and eligible ranking" reset={state.reset}
    controls={<>
      <RecQuantity label="Saved query customer row" value={state.user} min={0} max={199} integer revision={state.revision} onChange={user => state.patch({ user })} />
      <RecExactObject label="Copied prefix count row: hypothetical edits" value={counts} revision={state.revision}
        description={`All 100 item columns in their printed order; finite decimals 0…${maximumCount}. The copied row changes this request, not saved training/data/Q.`}
        parse={text => parseRecVector(text, 100, 0, maximumCount)} onChange={state.editCounts} />
      <RecQuantity label="Saved query selected item" value={state.item} min={0} max={99} integer revision={state.revision} onChange={item => state.patch({ item })} />
    </>}
    result={available ? `${saved.ids.users[state.user]} / ${saved.ids.items[state.item]}: ${frame.measured ? 'unchanged measured prefix request' : 'hypothetical edited-count request'}, score ${f(frame.selected.score)}; selected-rule ${frame.winner} issues ${frame.winnerOrder.slice(0, 10).map(row => row.id).join(', ') || 'none'}. ${frame.measured ? `Maximum all-item difference from saved query scores ${f(frame.maxReferenceDifference)}.` : 'No measured outcome is attached to the edited request.'}`
      : `Saved bundle or solve unavailable: ${bundle.guards.filter(row => !row.pass).map(row => row.name).join('; ') || frame.reason}. Earlier valid scores are not displayed as current forecasts.`}>
    <p>Scorer {saved.scorerId}; fixed final Q has 100×4 coordinates, confidence 1+2count, λ {saved.prediction.chosenConfig.lambda}. Stored training P and fresh request P_query have separate roles.</p>
    {!available ? <p role="status">Fix the schema fault in the reload view below or Reset this saved context. The recorded study tables remain historical results.</p> : <>
      <RecMatrix
      rowHues={saved.ids.items.map((_, item) => itemHue(item))} label="All 100 actual final-Q item rows" columns={coordinateNames(4)} rowNames={saved.ids.items} rows={saved.prefix.Q} selected={[state.item, 0]} />
      <RecOperands
      rowHues={frame.assembly.terms.map(term => itemHue(term.item))} label="Every request count, target and confidence before the solve"
        headers={['Item', 'Count', 'Target 1[count > 0]', 'Confidence 1 + 2 × count', 'Correction c−1']}
        rows={frame.assembly.terms.map(term => [saved.ids.items[term.item], term.count, term.target, term.confidence, term.confidence - 1])} />
      <RecMatrix label="Shared all-item Gram QᵀQ, including absent pairs" columns={coordinateNames(4)} rowNames={coordinateNames(4)} rows={frame.assembly.gram} />
      <RecOperands label="Selected item outer-product correction and right-vector operands"
        headers={['Coordinates', 'q row', 'q column / target', 'c−1 / c', 'Product']}
        rows={[...frame.selected.q.flatMap((left, r) => frame.selected.q.map((right, c) => [`${r},${c}`, left, right, frame.selected.confidence - 1, (frame.selected.confidence - 1) * left * right])),
          ...frame.selected.q.map((value, k) => [`b${k}`, value, Number(frame.selected.count > 0), frame.selected.confidence, value * Number(frame.selected.count > 0) * frame.selected.confidence])]} />
      <RecMatrix label="Current A = Gram + history corrections + λI" columns={coordinateNames(4)} rowNames={coordinateNames(4)} rows={frame.assembly.A} />
      <RecOperands
      rowHues={frame.assembly.p.map((_, k) => itemHue(k))} label="Current b → strict solve → request p; stored training p stays separate"
        headers={['Coordinate', 'b', 'Solved P_query', 'Stored training P', 'Ap−b residual']}
        rows={frame.assembly.p.map((value, k) => [k, frame.assembly.b[k], value, frame.storedTraining[k], frame.assembly.residual[k]])} />
      <RecOperands
      rowHues={frame.products.map((_, k) => itemHue(k))} label="Selected actual item coordinates multiply request coordinates before summing"
        rows={frame.products.map((product, k) => [k, frame.assembly.p[k], frame.selected.q[k], product])} />
      <div className="rec-study-locks"><RecPort>Σ coordinate products = {f(frame.selected.score)}</RecPort><RecWire /><RecPort>Compute all 100 scores</RecPort><RecWire /><RecPort>Apply discovery eligibility</RecPort><RecWire /><RecPort>Descending score, original stock-code lexical tie rank</RecPort></div>
      <RecMatrix
      rowHues={saved.ids.items.map((_, item) => itemHue(item))} label="All item scores, actual baseline forwards and eligibility; same full-catalogue solve" columns={['Count', 'ALS score', 'Popularity score', 'Binary item-cosine score', 'Selected-rule score', 'Discovery eligible', 'Original lexical tie rank']}
        rowNames={saved.ids.items} rows={frame.rows.map(row => [row.count, row.score, row.popularity, row.cosine, row.winnerScore, row.eligible ? 'yes' : row.count > 0 ? 'known purchase' : 'additional mask', row.lexicalRank])} />
      <RecMatrix label="Actual selected-rule top ten; ALS remains a separately named measured comparison" columns={['Item', 'Selected-rule score', 'ALS score']}
        rowNames={frame.winnerOrder.slice(0, 10).map((_, index) => `slot${index + 1}`)} rows={frame.winnerOrder.slice(0, 10).map(row => [row.id, row.winnerScore, row.score])} />
      <p>An empty history has b=0 and p_query=0; factor scores tie and the original lexical ranks settle order. Popularity uses fixed prefix catalogue totals; binary item cosine uses the current request's unique history against fixed prefix similarity. Neither baseline silently borrows an ALS score.</p>
    </>}
  </RecFigure>
    <div data-rec-view="D54-filter"><RecFigure label="Filter the already computed saved-query scores"
      controls={<RecExactObject label="Additional candidate mask in the same 100 item order" value={state.candidateMask}
        revision={`${state.revision}/${filterRevision}`} description="Use 1 to permit and 0 to remove a candidate. Known purchases remain excluded by the discovery rule. This filter does not enter A,b or p_query."
        parse={text => { const mask = parseRecVector(text, 100, 0, 1); if (mask.some(value => value !== 0 && value !== 1)) throw new Error('Mask values must be 0 or 1.'); return mask; }}
        onChange={candidateMask => state.patch({ candidateMask })} />}
      reset={() => { state.patch({ candidateMask: Array(100).fill(1) }); setFilterRevision(value => value + 1); }}
      result={available ? `${frame.rows.filter(row => row.eligible).length} discovery candidates; ${Math.min(10, frame.winnerOrder.length)} of ten slots issued. Candidate-mask changes leave all 100 score values and the current solve unchanged. This hypothetical restriction does not carry a new measured outcome.` : 'Current bundle unavailable; no filtered forecast is displayed.'}>
      {available ? <RecMatrix label="Already computed scores pass the additional mask after the solve" columns={['Item ID', 'Additional mask', 'Known purchase', 'Final eligible', 'Unchanged selected-rule score']}
        rowNames={frame.rows.map(row => `index${row.item}`)} rows={frame.rows.map(row => [row.id, state.candidateMask[row.item], row.count > 0 ? 'yes' : 'no', row.eligible ? 'yes' : 'no', row.winnerScore])} />
        : <p>The rejected bundle has no current candidate-score table.</p>}
    </RecFigure></div></>;
}

export function SavedBundleReloadFigure() {
  const state = useStudy(), frame = useMemo(() => reloadBundle(state.fault, state.user), [state.fault, state.user]);
  return <RecFigure id="D55" label="Actual array-index lineage and fail-closed saved-bundle schema" reset={state.reset}
    controls={<RecSelect label="Saved bundle fault" value={state.fault} onChange={fault => state.patch({ fault })}
      options={[['valid', 'Valid complete locked bundle'], ['reordered', 'Swap item labels only'], ['width', 'Drop a Q coordinate'], ['prefix', 'Change locked prefix count'], ['scorer', 'Use stored-training-user scorer']]} />}
    result={frame.available ? `Current bundle schema passes for ${saved.ids.users[state.user]}; final-Q request scores are available. A checksum records bytes, while these separate reference checks enforce their intended row meanings.`
      : `Current bundle rejected: ${frame.guards.filter(row => !row.pass).map(row => row.name).join('; ')}. Current saved-query output is unavailable; shape or a fresh checksum cannot certify the mismatched meaning.`}>
    <RecMatrix label="Literal shared index ports: item identity, count column, Q row and numerical score" columns={['Expected item ID', 'Loaded item ID', 'Count at index', 'Q row coordinates', 'Numerical score attached to this index']}
      rowNames={frame.indexWitness.map(row => `array index ${row.index}`)} rows={frame.indexWitness.map(row => [row.expectedID, row.loadedID, row.count, row.q.map(f).join(', '), row.numericalScore])} />
    <RecMatrix label="Complete schema gates before exposing a current forecast" columns={['Result']}
      rowNames={frame.guards.map(row => row.name)} rows={frame.guards.map(row => [row.pass ? 'pass' : 'REJECT'])} />
    <RecMatrix label="Actual configuration, array roles and both prospective locks" columns={['Current loaded value']}
      rowNames={['Ordered user/item axes', 'Final item factors Q', 'Training P / request P_query', 'Rank / λ / confidence α', 'Scorer', 'Count conversion', 'Selection lock', 'Prediction lock']}
      rows={[['200 users / 100 items'], [`${frame.bundle.Q.length} item rows; every row must have rank 4`], ['Separate stored versus recalculated user arrays'],
        [`${frame.bundle.rank} / ${frame.bundle.lambda} / ${frame.bundle.alpha}`], [frame.bundle.scorerId], [frame.bundle.conversion], [frame.bundle.selectionLock], [frame.bundle.predictionLock]]} />
    <p>Swapping only I000/I001 leaves plausible numbers attached to wrong names. An intentional permutation must carry item IDs, every count column, Q rows, scores, eligibility and lexical ranks together. A changed prefix or scorer is a new declared bundle; it cannot borrow the earlier bundle's measured outcome.</p>
  </RecFigure>;
}
