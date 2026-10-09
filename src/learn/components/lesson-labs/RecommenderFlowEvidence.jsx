import { evidenceLoss, pairEvidence, neighborhoodFlow, shrunkItem, clusterEvidence,
  sum, mean } from '../../data/recommender-flow-evidence-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecSelect, RecExactObject,
  useRecEvidence, formatRec as n, itemHue } from './RecommenderFlowControls.jsx';
import './recommender-flow-evidence.css';
import { RecBars } from './RecommenderFlowDrawing.jsx';

const ids = (length, prefix) => Array.from({ length }, (_, index) => [index, `${prefix}${index}`]);
const rules = [['raw', 'Raw cosine'], ['adjusted', 'Full-user-mean adjusted'], ['pair', 'Pair-overlap Pearson']];
const Token = ({ item, children }) => <span className="rec-flow-token" style={{ '--rec-hue': itemHue(item) }}>{children}</span>;
const Wire = () => <span className="rec-flow-wire" aria-hidden="true">→</span>;

function TargetControl({ state }) {
  return <fieldset className="rec-flow-quantity"><legend>Selected target</legend>
    <RecSelect label="User ID" value={state.user} options={ids(state.matrix.length, 'U')}
      onChange={value => state.patch({ user: Number(value) })} />
    <RecSelect label="Item ID" value={state.item} options={ids(state.matrix[0].length, 'I')}
      onChange={value => state.patch({ item: Number(value) })} />
  </fieldset>;
}

function PairControl({ state }) {
  return <fieldset className="rec-flow-quantity"><legend>Compared item columns</legend>
    {['First item', 'Second item'].map((label, index) => <RecSelect key={label} label={label}
      value={state.pair[index]} options={ids(state.matrix[0].length, 'I')} onChange={value => {
        const pair = [...state.pair];
        pair[index] = Number(value);
        if (pair[0] === pair[1] && state.matrix[0].length > 1) pair[1 - index] = (Number(value) + 1) % state.matrix[0].length;
        state.patch({ pair });
      }} />)}
  </fieldset>;
}

function CurrentPair({ state, centering = state.rule, minimum = state.minimum, shrinkage = state.shrinkage }) {
  const result = pairEvidence(state.matrix, state.pair[0], state.pair[1], { rule: centering, minimum, shrinkage });
  return <>
    <RecOperands
      columnHues={[itemHue(state.pair[0]), itemHue(state.pair[1]), itemHue(state.pair[0]), itemHue(state.pair[1]), itemHue(state.pair[0]), itemHue(state.pair[1]), undefined, itemHue(state.pair[0]), itemHue(state.pair[1])]} label={`I${state.pair[0]} / I${state.pair[1]}: aligned co-rater operands (${centering})`}
      headers={['Co-rater', 'r left', 'r right', 'center left', 'center right', 'a left', 'a right', 'a × b', 'a²', 'b²']}
      rows={result.pairs.map(pair => [`U${pair.position}`, pair.left, pair.right, pair.leftCenter, pair.rightCenter,
        pair.a, pair.b, pair.product, pair.leftSquare, pair.rightSquare])} />
    <div className="rec-flow-values"><span>Σ products {n(result.numerator)}</span><Wire /><span className="rec-flow-operator">÷</span>
      <span>√Σa² × √Σb² = {n(result.leftNorm)} × {n(result.rightNorm)}</span><Wire /><strong>cosine {n(result.raw)}</strong></div>
    <p>Common row IDs: {result.pairs.length ? result.pairs.map(pair => `U${pair.position}`).join(', ') : 'none'}.
      {state.pair[0] === state.pair[1] && ' This is a self comparison; a target cannot serve as its own neighbor.'}</p>
  </>;
}

export function RequestEvidenceFigure() {
  const state = useRecEvidence();
  const events = state.events.filter(event => event.user === state.requestUser);
  const known = events.filter(event => event.tick <= state.request);
  const future = events.filter(event => event.tick > state.request);
  return <RecFigure id="D01" label="Request, known interaction objects, candidate and later outcome"
    reset={state.reset} controls={<><RecSelect label="Request user" value={state.requestUser} options={ids(20, 'U')}
      onChange={value => state.patch({ requestUser: Number(value) })} /><RecQuantity label="Request tick" value={state.request}
      min={0} max={100} onChange={value => state.patch({ request: value })} revision={state.revision} /></>}
    result={`U${state.requestUser} at tick ${n(state.request)} can read ${known.length} event occurrences; ${future.length} later occurrences cannot enter this request. ${state.requestUser >= state.matrix.length ? 'This identity has no row in the current explicit-rating matrix.' : ''}`}>
    <div className="rec-flow-request-route">
      <div><span>Known interaction occurrences</span><div className="rec-flow-values">{known.map(event =>
        <Token key={event.id} item={event.item}>{event.id}: U{event.user}/I{event.item}, r={event.rating}, t={event.tick}</Token>)}
        {!known.length && <span>Empty history</span>}</div></div>
      <div className="rec-flow-values"><span className="rec-flow-wire" aria-hidden="true">↓</span><span>Known-history input to this request</span></div>
      <div className="rec-flow-port-wire"><Token item={state.item}>Candidate I{state.item}; matrix cell {state.matrix[state.requestUser]?.[state.item] == null ? 'missing' : n(state.matrix[state.requestUser][state.item])}</Token>
        <Wire /><strong>Request target (U{state.requestUser}, I{state.item}, t={n(state.request)})</strong></div>
      <div className="rec-flow-boundary"><span>Availability boundary t={n(state.request)}</span>
        <div className="rec-flow-values">{future.map(event => <Token key={event.id} item={event.item}>{event.id}: later r={event.rating}, I{event.item}, t={event.tick}</Token>)}
          {!future.length && <span>No later event for this user in the supplied sequence</span>}</div></div>
    </div>
  </RecFigure>;
}

export function ObservedMatrixFigure() {
  const state = useRecEvidence();
  const result = evidenceLoss(state.matrix, state.prediction);
  const selected = state.matrix[state.user][state.item];
  const edit = value => {
    const matrix = state.matrix.map(row => [...row]);
    matrix[state.user][state.item] = value;
    state.patch({ matrix });
  };
  return <RecFigure id="D02" label="Explicit rating matrix and independent observation mask" reset={state.reset}
    controls={<fieldset className="rec-flow-quantity"><legend>Selected matrix cell U{state.user}/I{state.item}</legend>
      <label><input type="checkbox" checked={selected !== null} onChange={event => edit(event.target.checked ? 0 : null)} /> Recorded observation</label>
      {selected !== null && <RecQuantity label="Recorded rating" value={selected} onChange={edit} min={-10} max={10} revision={state.revision} />}
      <p>Select any actual matrix cell above. A recorded zero remains observed.</p></fieldset>}
    result={`${result.observed.length} observed / ${result.missing} missing. Observed sum ${n(sum(result.observed.map(entry => entry.rating)))}, mean ${n(result.globalMean)}. U${state.user}/I${state.item}: mask ${selected !== null}, value ${selected === null ? 'missing' : n(selected)}.`}>
    <RecMatrix
      columnHues={ids(state.matrix[0].length, 'I').map(([item]) => itemHue(item))} label="R: explicit recorded ratings; hatch/dash = no observation" rows={state.matrix}
      columns={ids(state.matrix[0].length, 'I').map(([, label]) => label)} rowNames={ids(state.matrix.length, 'U').map(([, label]) => label)}
      selected={[state.user, state.item]} onSelect={(user, item) => state.patch({ user, item })} />
    <div className="rec-flow-values"><Token item={state.item}>U{state.user}/I{state.item}: {selected === null ? '—' : n(selected)}</Token><Wire />
      <span>mask = {selected === null ? 'false, no residual' : 'true, including value zero'}</span></div>
  </RecFigure>;
}

export function MaskLossFigure() {
  const state = useRecEvidence();
  const result = evidenceLoss(state.matrix, state.prediction);
  const value = state.matrix[state.user][state.item];
  return <RecFigure id="D03" label="Observed mask chooses residual terms; shape resizing" reset={state.reset}
    controls={<><fieldset className="rec-flow-quantity"><legend>Rating matrix dimensions</legend>
      <RecQuantity label="Users" integer value={state.matrix.length} min={1} max={20} revision={state.revision}
        onChange={users => state.resize(users, state.matrix[0].length)} />
      <RecQuantity label="Items" integer value={state.matrix[0].length} min={1} max={30} revision={state.revision}
        onChange={items => state.resize(state.matrix.length, items)} /></fieldset>
      <RecQuantity label="Constant proposed score" value={state.prediction} min={-10} max={10} revision={state.revision}
        onChange={prediction => state.patch({ prediction })} /></>}
    result={`Current ${state.matrix.length} × ${state.matrix[0].length} matrix: SSE ${n(result.sse)}; RMSE ${n(result.rmse)} over ${result.observed.length} observed terms. Growth adds missing cells; shrinking drops removed cells permanently.`}>
    <div className="rec-flow-values"><Token item={state.item}>U{state.user}/I{state.item}: r={value === null ? 'missing' : n(value)}</Token>
      <Wire /><span>mask {value !== null ? 'true' : 'false'}</span><Wire />
      {value === null ? <strong>Excluded: no invented residual</strong> : <><span className="rec-flow-operator">−</span><span>score {n(state.prediction)}</span>
        <Wire /><span>residual {n(value - state.prediction)}</span><Wire /><span className="rec-flow-operator">²</span><strong>{n((value - state.prediction) ** 2)}</strong></>}
    </div>
    <RecOperands
      rowHues={result.terms.map(entry => itemHue(entry.item))} label="Actual observed-only loss terms" headers={['Pair', 'Rating', 'Score', 'Residual', 'Squared term']}
      rows={result.terms.map(entry => [`U${entry.user}/I${entry.item}`, entry.rating, state.prediction, entry.residual, entry.squared])} />
    <div className="rec-flow-values"><span>Σ included squares {n(result.sse)}</span><Wire /><span>÷ observed count {result.observed.length}</span>
      <Wire /><span>square root</span><Wire /><strong>RMSE {n(result.rmse)}</strong></div>
  </RecFigure>;
}

function EventAxis({ state }) {
  const extent = Math.max(31, state.request, ...state.events.map(event => event.tick), ...state.releases);
  const x = tick => 65 + 700 * tick / extent;
  return <div className="rec-flow-pan" role="region" tabIndex={0} aria-label="Numeric event-time axis: local scroll">
    <svg className="rec-flow-timeline" viewBox="0 0 850 220" role="img" aria-label={`All event positions; request ${state.request}; numeric axis 0 to ${extent}`}>
      <line x1="65" y1="145" x2="765" y2="145" stroke="#aaa" />
      {Array.from({ length: 5 }, (_, index) => extent * index / 4).map(tick => <g key={tick}>
        <line x1={x(tick)} y1="140" x2={x(tick)} y2="150" stroke="#aaa" /><text x={x(tick)} y="178" textAnchor="middle">{n(tick)}</text></g>)}
      {state.events.map((event, index) => <circle key={event.id} cx={x(event.tick)} cy={index < 20 ? 40 : index < 25 ? 80 : 115}
        r="5" fill={itemHue(event.item)} stroke={event.tick <= state.request ? '#eee' : '#777'} strokeWidth="2"
        strokeDasharray={event.tick <= state.request ? undefined : '2 2'}><title>{event.id}: U{event.user}/I{event.item}, tick {event.tick}, {event.tick <= state.request ? 'available' : 'future'}</title></circle>)}
      <line x1={x(state.request)} y1="15" x2={x(state.request)} y2="145" stroke="#e8b44a" strokeWidth="2" />
      <text x="65" y="208">Invented event tick; rows: original train / choice / assessment</text>
    </svg>
  </div>;
}

export function EventTimelineFigure() {
  const state = useRecEvidence();
  const release = state.releases[state.item];
  return <RecFigure id="D04" label="31 event occurrences, request and item-release boundary" reset={state.reset}
    controls={<><RecQuantity label="Request tick" value={state.request} min={0} max={100} revision={state.revision}
      onChange={request => state.patch({ request })} />
      <RecQuantity label={`Release tick of I${state.item}`} value={release} min={0} max={100} revision={state.revision}
        onChange={value => { const releases = [...state.releases]; releases[state.item] = value; state.patch({ releases }); }} />
      <RecExactObject label="Event occurrence objects" value={state.events} revision={state.revision}
        description="JSON array of unique occurrence IDs with user, item, rating and tick. Different occurrences may repeat a pair. Integer IDs: user 0–19, item 0–29; tick 0–100; rating −10–10."
        parse={text => {
          const events = JSON.parse(text);
          if (!Array.isArray(events) || events.some(event => !event || typeof event.id !== 'string' || !event.id ||
            !Number.isInteger(event.user) || event.user < 0 || event.user > 19 || !Number.isInteger(event.item) || event.item < 0 || event.item > 29 ||
            !Number.isFinite(event.rating) || event.rating < -10 || event.rating > 10 || !Number.isFinite(event.tick) || event.tick < 0 || event.tick > 100) ||
            new Set(events.map(event => event.id)).size !== events.length) throw new Error('Use valid, separately identified event objects.');
          return events;
        }} onChange={events => state.patch({ events })} /></>}
    result={`${state.events.filter(event => event.tick <= state.request).length}/${state.events.length} events available by exact ≤ cutoff. I${state.item} release ${n(release)} ${release <= state.request ? 'passes' : 'fails'} request ${n(state.request)}.`}>
    <EventAxis state={state} />
    <div className="rec-flow-values">{state.events.map(event => <Token key={event.id} item={event.item}>{event.id}: t{event.tick}, U{event.user}/I{event.item} {event.tick <= state.request ? 'known' : 'future'}</Token>)}</div>
    <div className="rec-flow-values"><Token item={state.item}>I{state.item} release {n(release)}</Token><Wire /><span className="rec-flow-operator">≤</span>
      <span>request {n(state.request)}</span><Wire /><strong>{release <= state.request ? 'eligible by release' : 'unavailable at request'}</strong></div>
  </RecFigure>;
}

export function BaselineShrinkFigure() {
  const state = useRecEvidence();
  const result = shrunkItem(state.matrix, state.item, state.baselineShrinkage, state.prior);
  return <RecFigure id="D05" label="Separate two-rating illustration and selected-column shrinkage" reset={state.reset}
    controls={<><RecSelect label="Selected item" value={state.item} options={ids(state.matrix[0].length, 'I')}
      onChange={item => state.patch({ item: Number(item) })} />
      <RecQuantity label="Prior pseudo-count" value={state.baselineShrinkage} min={0} max={30} revision={state.revision}
        onChange={baselineShrinkage => state.patch({ baselineShrinkage })} />
      <RecQuantity label="Declared prior mean" value={state.prior} min={-10} max={10} revision={state.revision}
        onChange={prior => state.patch({ prior })} /></>}
    result={`I${state.item}: ${result.values.length} observations, sum ${n(result.dataSum)}, prior contribution ${n(result.priorPart)}; quotient ${n(result.quotient)}. ${result.denominator ? 'Uses the declared external prior.' : `No quotient; separate observed-global fallback ${n(result.global)}.`}`}>
    <div className="rec-flow-values"><span>Separate worked ratings 5 + 1 = 6</span><span className="rec-flow-operator">+</span>
      <span>3 prior tokens × 3.1 = 9.3</span><Wire /><span>15.3 ÷ (2 + 3)</span><Wire /><strong>3.06</strong></div>
    <div className="rec-flow-values">{result.values.map((value, index) => <Token key={index} item={state.item}>I{state.item} r{index}: {n(value)}</Token>)}
      {!result.values.length && <span>No observed ratings for this column</span>}</div>
    <div className="rec-flow-values"><span>Σ data {n(result.dataSum)}</span><span className="rec-flow-operator">+</span>
      <span>{n(state.baselineShrinkage)} × {n(state.prior)} = {n(result.priorPart)}</span><Wire />
      <span>{n(result.numerator)} ÷ ({result.values.length} + {n(state.baselineShrinkage)})</span><Wire /><strong>{n(result.quotient)}</strong></div>
  </RecFigure>;
}

export function ArtifactPermissionFigure() {
  const state = useRecEvidence();
  const choiceRows = state.events.slice(20, 25);
  const choice = choiceRows.length ? Math.max(...choiceRows.map(event => event.tick)) : null;
  const available = choice !== null && state.request >= choice && state.request >= state.artifact && state.artifact >= choice;
  return <RecFigure id="D06" label="Data, selected configuration and fitted-artifact time gates" reset={state.reset}
    controls={<RecQuantity label="Artifact available tick" value={state.artifact} min={0} max={100} revision={state.revision}
      onChange={artifact => state.patch({ artifact })} />}
    result={`Request ${n(state.request)}; configuration choice ${n(choice)}; artifact ${n(state.artifact)}. ${available ? 'Both availability gates pass.' : 'Unavailable: absent choice evidence, a later choice/artifact, or an artifact predating its selected configuration cannot supply this rule.'}`}>
    <div className="rec-flow-permission-lanes">{[
      ['Parameter rows', state.events.slice(0, 20)], ['Choice rows', state.events.slice(20, 25)], ['Assessment rows', state.events.slice(25)]
    ].map(([label, events]) => <div key={label}><strong>{label}</strong><div className="rec-flow-values">{events.map(event => <Token key={event.id} item={event.item}>{event.id}, t{event.tick}</Token>)}</div></div>)}</div>
    <div className="rec-flow-values"><span>Choice ready t{n(choice)}</span><Wire /><span className="rec-flow-operator">≤</span><span>request {n(state.request)}: {choice !== null && choice <= state.request ? 'pass' : 'fail'}</span></div>
    <div className="rec-flow-values"><span>Selected choice t{n(choice)}</span><Wire /><span className="rec-flow-operator">≤</span><span>artifact t{n(state.artifact)}: {choice !== null && choice <= state.artifact ? 'pass' : 'fail'}</span></div>
    <div className="rec-flow-values"><span>Artifact ready t{n(state.artifact)}</span><Wire /><span className="rec-flow-operator">≤</span><span>request {n(state.request)}: {state.artifact <= state.request ? 'pass' : 'fail'}</span></div>
    <strong>{available ? 'Saved rule available' : 'No earlier issued forecast from this saved rule'}</strong>
  </RecFigure>;
}

export function CoRaterFigure() {
  const state = useRecEvidence();
  const cols = state.pair.map(item => state.matrix.map(row => row[item]));
  return <RecFigure id="D07" label="Observed item columns and common-row intersection" reset={state.reset}
    controls={<PairControl state={state} />}
    result={`Only rows observed in both I${state.pair[0]} and I${state.pair[1]} enter products and both norms. Private observations remain excluded.`}>
    <RecMatrix
      columnHues={state.pair.map(itemHue)} label="Original columns before intersection" columns={state.pair.map(item => `I${item}`)}
      rowNames={ids(state.matrix.length, 'U').map(([, label]) => label)} rows={state.matrix.map((_, user) => cols.map(col => col[user]))} />
    <CurrentPair state={state} centering="raw" minimum={1} shrinkage={0} />
  </RecFigure>;
}

export function CenteringOperandsFigure() {
  const state = useRecEvidence();
  return <RecFigure id="D08" label="Raw and centered coordinate operations with named centering population" reset={state.reset}
    controls={<RecSelect label="Similarity rule" value={state.rule} options={rules} onChange={rule => state.patch({ rule })} />}
    result={`Edited item pair uses ${state.rule === 'adjusted' ? 'each co-rater’s complete observed training-row mean' : state.rule === 'pair' ? 'each column’s mean over this pair overlap' : 'uncentered ratings'}. A zero norm remains unavailable.`}>
    <RecOperands label="Separate two-row worked contrast: full-user means 4 and 2" headers={['User', 'Left', 'Right', 'Mean', 'a', 'b', 'a×b']}
      rows={[["U0", 5, 3, 4, 1, -1, -1], ["U1", 3, 1, 2, 1, -1, -1]]} />
    <div className="rec-flow-values"><span>Raw: (15 + 3) ÷ √(34 × 10) = {n(18 / Math.sqrt(340))}</span>
      <span>Adjusted: (−1 − 1) ÷ (√2 × √2) = −1</span></div>
    <CurrentPair state={state} minimum={1} shrinkage={0} />
  </RecFigure>;
}

export function NeighborSupportFigure() {
  const state = useRecEvidence();
  const result = neighborhoodFlow(state.matrix, state);
  return <RecFigure id="D09" label="Support gate, shrinkage and actual accepted-neighbor ordering" reset={state.reset}
    controls={<><RecQuantity label="Minimum co-raters" integer value={state.minimum} min={1} max={20} revision={state.revision}
      onChange={minimum => state.patch({ minimum })} /><RecQuantity label="Similarity shrinkage" value={state.shrinkage} min={0} max={30}
      revision={state.revision} onChange={shrinkage => state.patch({ shrinkage })} />
      <RecQuantity label="Maximum neighbors k" integer value={state.k} min={1} max={30} revision={state.revision} onChange={k => state.patch({ k })} /></>}
    result={`${state.mode}-based U${state.user}/I${state.item}: ${result.selected.length} selected after support, sign and |weight|/ID order. ${result.fallback ? `No usable neighbor: fallback ${n(result.score)}.` : `Current score ${n(result.score)}.`}`}>
    <RecOperands
      rowHues={state.mode === 'item' ? result.candidates.map(entry => itemHue(entry.id)) : undefined} label="Actual candidate gates and shrink operands" headers={['Neighbor', 'Overlap n', 'Raw cosine', 'n/(n+s)', 'Weight', 'Support', 'Used']}
      rows={result.candidates.map(entry => [`${state.mode === 'item' ? 'I' : 'U'}${entry.id}`, entry.pair.pairs.length, entry.pair.raw,
        entry.pair.supportFactor, entry.pair.weight, entry.pair.supported ? 'pass' : 'fail', result.selected.includes(entry) ? 'selected' : 'omitted'])} />
    <div className="rec-flow-values"><span>One positive co-rater: cosine 1</span><Wire /><span>minimum 2: fail; minimum 1: pass</span>
      <Wire /><span>shrink s2: 1 × 1/(1+2) = 1/3</span></div>
  </RecFigure>;
}

function PredictionCircuit({ result, state, label }) {
  return <>
    <RecOperands
      rowHues={state.mode === 'item' ? result.selected.map(entry => itemHue(entry.id)) : undefined} label={label} headers={['Neighbor', 'Rating', 'Center', 'Residual', 'Weight', 'Product', '|weight|']}
      rows={result.selected.map(entry => [`${state.mode === 'item' ? 'I' : 'U'}${entry.id}`, entry.rating, entry.center, entry.signal,
        entry.pair.weight, entry.product, Math.abs(entry.pair.weight)])} />
    <div className="rec-flow-values"><span>Σ products {n(result.numerator)}</span><Wire /><span className="rec-flow-operator">÷</span>
      <span>Σ |weights| {n(result.denominator)}</span><Wire /><span>correction {n(result.correction)}</span>
      <span className="rec-flow-operator">+</span><span>baseline {state.rule === 'raw' && !result.fallback ? '0 (raw rule)' : n(result.baseline)}</span>
      <Wire /><strong>score {n(result.score)} {result.fallback && '(fallback)'}</strong></div>
  </>;
}

export function NeighborPredictionFigure() {
  const state = useRecEvidence();
  const result = neighborhoodFlow(state.matrix, state);
  return <RecFigure id="D10" label="Signed products and absolute denominator feed a rating score" reset={state.reset}
    controls={<RecSelect label="Neighbor sign policy" value={state.signed ? 'signed' : 'positive'}
      options={[["positive", 'Positive only'], ["signed", 'Retain both signs']]}
      onChange={value => state.patch({ signed: value === 'signed' })} />}
    result={`Current ${state.rule}/${state.mode} score ${n(result.score)}. The actual denominator sums magnitudes, not signed weights. No clipping is applied.`}>
    <RecOperands label="Separate signed worked circuit, baseline 3" headers={['Neighbor', 'Rating', 'Residual', 'Weight', 'Product', '|weight|']}
      rows={[["A", 1, -2, -.5, 1, .5], ["B", 5, 2, .25, .5, .25]]} />
    <div className="rec-flow-values"><span>1 + .5 = 1.5</span><Wire /><span>÷ (.5 + .25) = 2</span><Wire /><span>+ baseline 3</span><Wire /><strong>5</strong></div>
    <PredictionCircuit result={result} state={state} label="Edited matrix: actual selected neighbors" />
    <RecBars label="Signed neighbor weights" rows={result.selected.map(entry=>({id:`${state.mode==='item'?'I':'U'}${entry.id}`,value:entry.pair.weight,hue:entry.id}))} />
  </RecFigure>;
}

export function UserItemDualFigure() {
  const state = useRecEvidence();
  const item = neighborhoodFlow(state.matrix, { ...state, mode: 'item' });
  const user = neighborhoodFlow(state.matrix, { ...state, mode: 'user' });
  return <RecFigure id="D11" label="Distinct user and item collaborative filtering routes" reset={state.reset}
    controls={<><RecSelect label="Active orientation" value={state.mode} options={[["item", 'Item-based'], ["user", 'User-based']]}
      onChange={mode => state.patch({ mode })} /><TargetControl state={state} /></>}
    result={`Same edited matrix and target: item route ${n(item.score)}, user route ${n(user.score)}. Their intersections, residual source and centering means differ.`}>
    <div className="rec-flow-parallel"><div><strong>Item CF: common users; target user’s rated items</strong>
      <PredictionCircuit result={item} state={{ ...state, mode: 'item' }} label="Item route: subtract target-user mean" /></div>
      <div><strong>User CF: common items; other users’ target ratings</strong>
        <PredictionCircuit result={user} state={{ ...state, mode: 'user' }} label="User route: subtract each neighbor-user mean" /></div></div>
    <RecOperands label="Separate three-user worked case, U0/I2" headers={['Neighbor', 'Full mean', 'Similarity', 'Target residual', 'Signed product']}
      rows={[["U1", 3, 1, 0, 0], ["U2", 11/3, -3/Math.sqrt(10), 4/3, -4/Math.sqrt(10)]]} />
    <div className="rec-flow-values"><span>Signed: 3 − 4/(√10+3) = {n(3 - 4/(Math.sqrt(10) + 3))}</span><span>Positive only: U1 retained → 3</span></div>
  </RecFigure>;
}

export function NeighborhoodConventionFigure() {
  const state = useRecEvidence();
  const ordinary = neighborhoodFlow(state.matrix, { ...state, rule: 'pair', signed: false, shrinkage: 0, ordinary: true });
  const scratch = neighborhoodFlow(state.matrix, state);
  const members = Array.from({ length: Math.min(2, state.matrix.length) }, (_, index) => index);
  const cluster = clusterEvidence(state.matrix, members);
  return <RecFigure id="D12" label="Pair-Pearson positive-only library convention and actual cluster aggregate" reset={state.reset}
    controls={<><RecSelect label="Compared orientation" value={state.mode} options={[["item", 'Item rows in ordinary rule'], ["user", 'User rows in ordinary rule']]}
      onChange={mode => state.patch({ mode })} /><PairControl state={state} /></>}
    result={`Declared scratch ${state.rule}/${state.signed ? 'signed' : 'positive'}: ${n(scratch.score)}. Surprise-style WithMeans pair-Pearson/positive route: ${n(ordinary.score)}. This is direct formula evaluation, not a new library fit.`}>
    <div className="rec-flow-parallel"><div><strong>Separate item-pair centering contrast</strong><CurrentPair state={state} />
      <p>The compared item columns above retain their own IDs; the score below uses the selected target orientation.</p>
      <PredictionCircuit result={scratch} state={state} label="Scratch score operands" /></div>
      <div><strong>Surprise 1.1.5 convention: pair-overlap Pearson; positive neighbors; full entity means</strong>
        <PredictionCircuit result={ordinary} state={{ ...state, rule: 'pair' }} label="Ordinary convention score operands" /></div></div>
    <RecOperands
      rowHues={cluster.map((_, item) => itemHue(item))} label={`Separate cluster object: members ${members.map(user => `U${user}`).join(', ')}`}
      headers={['Item', 'Observed sum', 'Observed count', 'Aggregate mean']}
      rows={cluster.map((entry, item) => [`I${item}`, entry.sum, entry.count, entry.mean])} />
  </RecFigure>;
}
