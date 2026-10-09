import { createContext, useContext, useEffect, useState } from 'react';
import { factorDefaults, resizeFactorRows, factorScore, factorObjective, factorStep, factorTrace,
  rotateFactors, rescaleFactors, fixedBowl, coordinateMinimum, observedBlock } from '../../data/recommender-flow-factor-models.js';
import { sum, dot } from '../../data/recommender-flow-evidence-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecSelect, RecExactObject, parseRecVector,
  useRecEvidence, formatRec as n, itemHue } from './RecommenderFlowControls.jsx';
import { RecWire as Wire, RecPort as Port, RecPlane, RecCurve } from './RecommenderFlowDrawing.jsx';

const FactorContext = createContext(null);
const options = (count, prefix) => Array.from({ length: count }, (_, index) => [index, `${prefix}${index}`]);
const names = count => Array.from({ length: count }, (_, index) => `Coordinate ${index}`);

export function RecommenderFactorProvider({ children }) {
  const evidence = useRecEvidence();
  const [state, setState] = useState(factorDefaults);
  const [revision, setRevision] = useState(0);
  const users = evidence.matrix.length;
  const items = evidence.matrix[0].length;
  useEffect(() => {
    setState(previous => ({ ...previous, P: resizeFactorRows(previous.P, users, previous.dimension),
      Q: resizeFactorRows(previous.Q, items, previous.dimension), userBias: Array.from({ length: users }, (_, index) => previous.userBias[index] ?? 0),
      itemBias: Array.from({ length: items }, (_, index) => previous.itemBias[index] ?? 0) }));
  }, [users, items]);
  const patch = values => setState(previous => ({ ...previous, ...values }));
  const dimension = value => setState(previous => ({ ...previous, dimension: value,
    P: resizeFactorRows(previous.P, users, value), Q: resizeFactorRows(previous.Q, items, value),
    blockP: resizeFactorRows([previous.blockP], 1, value)[0], blockQ: resizeFactorRows(previous.blockQ, previous.blockQ.length, value),
    coordinate: Math.min(previous.coordinate, value - 1) }));
  const reset = () => { const next = factorDefaults(); setState({ ...next,
    P: resizeFactorRows(next.P, users, next.dimension), Q: resizeFactorRows(next.Q, items, next.dimension),
    userBias: Array.from({ length: users }, (_, index) => next.userBias[index] ?? 0),
    itemBias: Array.from({ length: items }, (_, index) => next.itemBias[index] ?? 0) }); setRevision(value => value + 1); };
  return <FactorContext.Provider value={{ ...state, evidence, patch, setDimension: dimension, reset, revision }}>{children}</FactorContext.Provider>;
}

export function useRecFactors() {
  const state = useContext(FactorContext);
  if (!state) throw new Error('Factor views require RecommenderFactorProvider.');
  return state;
}

function selected(state) {
  const { user, item } = state.evidence;
  return { mu: state.mu, target: state.target, bu: state.userBias[user] ?? 0, bi: state.itemBias[item] ?? 0,
    p: state.P[user] ?? Array(state.dimension).fill(0), q: state.Q[item] ?? Array(state.dimension).fill(0) };
}

function Lookup({ state }) {
  return <fieldset className="rec-flow-quantity"><legend>Selected parameter rows</legend>
    <RecSelect label="Factor user" value={state.evidence.user} options={options(state.evidence.matrix.length, 'U')}
      onChange={user => state.evidence.patch({ user: Number(user) })} />
    <RecSelect label="Factor item" value={state.evidence.item} options={options(state.evidence.matrix[0].length, 'I')}
      onChange={item => state.evidence.patch({ item: Number(item) })} />
  </fieldset>;
}

function VectorEditor({ state, side }) {
  const index = side === 'P' ? state.evidence.user : state.evidence.item;
  const values = state[side][index] ?? Array(state.dimension).fill(0);
  return <RecExactObject label={`${side === 'P' ? 'User p' : 'Item q'} coordinates`} value={values} revision={state.revision}
    description={`${side === 'P' ? 'U' : 'I'}${index}; ${state.dimension} coordinates, each −10000 to 10000. Dimension changes at the matrix view.`}
    parse={text => parseRecVector(text, state.dimension, -1e4, 1e4)} onChange={vector => {
      const rows = state[side].map(row => [...row]); rows[index] = vector; state.patch({ [side]: rows });
    }} />;
}

function Products({ state, pair = selected(state), label = 'Matching coordinates, not numerical ID distance' }) {
  const result = factorScore(pair);
  return <><div className="rec-flow-array-operation" aria-label={label}>{pair.p.map((value, coordinate)=><div className="rec-flow-values" key={coordinate}>
    <span>k{coordinate}</span><Port hue={coordinate}>p{coordinate} {n(value)}</Port><Wire /><span className="rec-flow-operator">×</span>
    <Port hue={coordinate}>q{coordinate} {n(pair.q[coordinate])}</Port><Wire /><Port hue={coordinate}>Product {n(result.products[coordinate])}</Port>
  </div>)}</div><RecOperands
      rowHues={pair.p.map((_, coordinate) => itemHue(coordinate))} label={label} headers={['Coordinate', 'User p', 'Item q', 'p × q']}
    rows={pair.p.map((value, coordinate) => [`k${coordinate}`, value, pair.q[coordinate], result.products[coordinate]])} />
    <div className="rec-flow-values"><Port>Σ matching products = {n(result.factor)}</Port><Wire />
      <span className="rec-flow-operator">+</span><Port hue={2}>μ {n(pair.mu)} + bᵤ {n(pair.bu)} + bᵢ {n(pair.bi)}</Port>
      <Wire /><strong>Rating score {n(result.score)}</strong></div></>;
}

export function FactorScoreFigure() {
  const state = useRecFactors();
  const pair = selected(state);
  return <RecFigure id="D13" label="Selected user/item lookup, paired products and additive score ports" reset={state.reset}
    controls={<><VectorEditor state={state} side="P" /><VectorEditor state={state} side="Q" />
      <RecExactObject label="Score offsets and observed target" value={[state.mu, pair.bu, pair.bi, state.target]} revision={state.revision}
        description="[global mean, selected user bias, selected item bias, target]. Mean/target −10–10; biases −10000–10000."
        parse={text => { const values = parseRecVector(text, 4, -1e4, 1e4); if (Math.abs(values[0]) > 10 || Math.abs(values[3]) > 10) throw new Error('Mean and target must be −10 to 10.'); return values; }}
        onChange={([mu, bu, bi, target]) => { const userBias = [...state.userBias]; const itemBias = [...state.itemBias];
          userBias[state.evidence.user] = bu; itemBias[state.evidence.item] = bi; state.patch({ mu, userBias, itemBias, target }); }} /></>}
    result={`Current U${state.evidence.user}/I${state.evidence.item}: factor ${n(dot(pair.p, pair.q))}; rating score ${n(factorScore(pair).score)}. These are declared parameters, not a new fit or probability.`}>
    <div className="rec-flow-values"><Port>Lookup U{state.evidence.user} → P row</Port><Port hue={state.evidence.item}>Lookup I{state.evidence.item} → Q row</Port><Wire /><span>Match coordinate k</span></div>
    <Products state={state} />
  </RecFigure>;
}

export function FactorMatrixFigure() {
  const state = useRecFactors();
  const users = state.evidence.matrix.length;
  const items = state.evidence.matrix[0].length;
  const P = resizeFactorRows(state.P, users, state.dimension);
  const Q = resizeFactorRows(state.Q, items, state.dimension);
  const product = P.map(p => Q.map(q => dot(p, q)));
  const scores = product.map((row, user) => row.map((value, item) => state.mu + (state.userBias[user] ?? 0) + (state.itemBias[item] ?? 0) + value));
  return <RecFigure id="D14" label="Genuine factor arrays, transpose, all pairwise products and bias broadcasts" reset={state.reset}
    controls={<><RecQuantity label="Factor dimension" integer value={state.dimension} min={1} max={5} revision={state.revision}
      onChange={state.setDimension} /><Lookup state={state} /></>}
    result={`P ${users}×${state.dimension} × Qᵀ ${state.dimension}×${items} → ${users}×${items}. Factor-product rank ≤${state.dimension}; the separate bias broadcasts can raise the full-score rank. Growth adds zero coordinates; shrink drops them.`}>
    <div className="rec-flow-parallel"><RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label={`P: ${users} user rows × ${state.dimension} coordinates`} rows={P} columns={names(state.dimension)}
      rowNames={options(users, 'U').map(([, label]) => label)} selected={[state.evidence.user, null]} />
      <RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={options(items, 'I').map(([item]) => itemHue(item))} label={`Q: ${items} item rows × ${state.dimension} coordinates`} rows={Q} columns={names(state.dimension)} rowNames={options(items, 'I').map(([, label]) => label)} selected={[state.evidence.item, null]} /></div>
    <Wire down /><RecMatrix
      columnHues={options(items, 'I').map(([id]) => itemHue(id))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label={`Qᵀ: transpose preserves each I ID in its column`} rows={Array.from({ length: state.dimension }, (_, coordinate) => Q.map(q => q[coordinate]))}
      columns={options(items, 'I').map(([, label]) => label)} rowNames={names(state.dimension)} />
    <Products state={state} label={`Selected cell U${state.evidence.user}/I${state.evidence.item} aligns P and Qᵀ`} />
    <RecMatrix
      columnHues={options(items, 'I').map(([id]) => itemHue(id))} label="P Qᵀ: factor contribution only" rows={product} columns={options(items, 'I').map(([, label]) => label)} rowNames={options(users, 'U').map(([, label]) => label)} selected={[state.evidence.user, state.evidence.item]} />
    <div className="rec-flow-values"><span>Every cell: μ {n(state.mu)}</span><span className="rec-flow-operator">+</span><span>its user-row bias</span><span className="rec-flow-operator">+</span><span>its item-column bias</span><Wire /></div>
    <RecMatrix
      columnHues={options(items, 'I').map(([id]) => itemHue(id))} label="Full rating scores after separate bias broadcasts" rows={scores} columns={options(items, 'I').map(([, label]) => label)} rowNames={options(users, 'U').map(([, label]) => label)} selected={[state.evidence.user, state.evidence.item]} />
  </RecFigure>;
}

export function AmbiguousCompletionFigure() {
  const state = useRecFactors();
  const available = state.completion !== 0 && Number.isFinite(1 / state.completion);
  return <RecFigure id="D15" label="Same observed diagonal permits different rank-one completions" reset={state.reset}
    controls={<RecQuantity label="Missing upper-right value a" value={state.completion} min={-4} max={4} revision={state.revision} onChange={completion => state.patch({ completion })} />}
    result={available ? `a ${n(state.completion)} and 1/a ${n(1 / state.completion)} fit both observed 1s; determinant 1−a×(1/a)=0. Row1 is row0 ÷ a. Missing entries remain unverified.` : 'At a=0 the reciprocal construction is unavailable; no off-diagonal value is silently invented.'}>
    <RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} label="Observed data: diagonal only" rows={[[1, null], [null, 1]]} columns={['I0', 'I1']} rowNames={['U0', 'U1']} />
    <div className="rec-flow-parallel">{[.5, 2].map(a => <RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} key={a} label={`Rank-one alternative a=${a}, row1=row0/${a}`} rows={[[1, a], [1/a, 1]]} columns={['I0', 'I1']} rowNames={['U0', 'U1']} />)}</div>
    {available ? <RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} label="Current reciprocal completion" rows={[[1, state.completion], [1/state.completion, 1]]} columns={['I0', 'I1']} rowNames={['U0', 'U1']} /> : <strong>Singular reciprocal at zero</strong>}
  </RecFigure>;
}

export function FactorRotationFigure() {
  const state = useRecFactors();
  const pair = selected(state);
  const result = rotateFactors(pair.p, pair.q, state.angle);
  return <RecFigure id="D16" label="Actual anonymous coordinate plane and orthogonal change of coordinates" reset={state.reset}
    controls={<RecQuantity label="Rotation angle in degrees" value={state.angle} min={-180} max={180} revision={state.revision} onChange={angle => state.patch({ angle })} />}
    result={result.available ? `Dot ${n(result.originalDot)} → ${n(result.newDot)}; squared-norm sum ${n(result.originalNorm)} → ${n(result.newNorm)}. Other coordinates remain fixed. Zero vectors have no directional head.` : result.reason}>
    {result.available ? <><RecPlane label={`U${state.evidence.user}/I${state.evidence.item}: rotate first two coordinates by ${n(state.angle)}°`}
      vectors={[{ id: 'p', xy: pair.p.slice(0,2), hue: 0 }, { id: 'q', xy: pair.q.slice(0,2), hue: 1 }, { id: 'Rp', xy: result.p.slice(0,2), hue: 0, dashed: true }, { id: 'Rq', xy: result.q.slice(0,2), hue: 1, dashed: true }]} />
      <RecOperands
      columnHues={[itemHue(0), itemHue(1), itemHue(0), itemHue(1), undefined]} label="Actual rotated coordinate products" headers={['Coordinate', 'Old p', 'Old q', 'Rp', 'Rq', 'New product']}
        rows={pair.p.map((value, coordinate) => [`k${coordinate}`, value, pair.q[coordinate], result.p[coordinate], result.q[coordinate], result.p[coordinate] * result.q[coordinate]])} /></> : <strong>{result.reason}</strong>}
  </RecFigure>;
}

export function FactorRescaleFigure() {
  const state = useRecFactors();
  const pair = selected(state);
  const result = rescaleFactors(pair.p, pair.q, state.scale);
  return <RecFigure id="D17" label="Inverse-transpose transformation preserves score but changes L2 penalty" reset={state.reset}
    controls={<RecQuantity label="Coordinate-zero scale a" value={state.scale} min={-4} max={4} revision={state.revision} onChange={scale => state.patch({ scale })} />}
    result={result.available ? `Current dot ${n(result.originalDot)} → ${n(result.newDot)}; squared-norm sum ${n(result.originalNorm)} → ${n(result.newNorm)}. Orthogonal rotations preserve this norm; this general scaling need not.` : result.reason}>
    <RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label="A: scale coordinate 0; keep every other coordinate" rows={Array.from({ length: state.dimension }, (_, row) => Array.from({ length: state.dimension }, (_, column) => row === column ? (row === 0 ? state.scale : 1) : 0))} columns={names(state.dimension)} rowNames={names(state.dimension)} />
    <div className="rec-flow-values"><Port>p′ = A p</Port><Port hue={1}>q′ = A⁻ᵀ q</Port><Wire /><span>Coordinate products</span></div>
    {result.available ? <><RecOperands
      columnHues={[itemHue(0), itemHue(1), itemHue(0), itemHue(1), undefined]} label="Transformed pair reads inverse action on q" headers={['Coordinate', 'p', 'q', 'A p', 'A⁻ᵀ q', 'New product']}
      rows={pair.p.map((value, coordinate) => [`k${coordinate}`, value, pair.q[coordinate], result.p[coordinate], result.q[coordinate], result.p[coordinate] * result.q[coordinate]])} />
      <RecPlane label="First two actual transformed coordinates" vectors={[{ id:'p′', xy:result.p.slice(0,2), hue:0 }, { id:'q′', xy:result.q.slice(0,2), hue:1 }]} /></> : <strong>{result.reason}</strong>}
    <RecOperands label="Separate retained counterexample p=q=(1,0), a=2" headers={['Term', 'Old', 'New']}
      rows={[["Dot",1,1], ["‖p‖² + ‖q‖²",2,17/4]]} />
  </RecFigure>;
}

export function FactorUpdateFigure() {
  const state = useRecFactors();
  const pair = selected(state);
  const update = factorStep(pair, state.eta, state.lambda);
  const wrong = factorStep(pair, state.eta, state.lambda, true);
  return <RecFigure id="D18" label="Old-buffer gradient operands and simultaneous parameter update" reset={state.reset}
    controls={<><RecQuantity label="Learning rate η" value={state.eta} min={0} max={1} revision={state.revision} onChange={eta => state.patch({ eta })} />
      <RecQuantity label="Local penalty λ" value={state.lambda} min={0} max={10} revision={state.revision} onChange={lambda => state.patch({ lambda })} /></>}
    result={update.next ? `Old score ${n(update.objective.score)}, r ${n(pair.target)}, error ${n(update.objective.error)}. Every new parameter uses the same snapshot; new loss ${n(factorObjective(update.next, state.lambda).loss)}.` : update.unavailable}>
    <Products state={state} /><div className="rec-flow-values"><Port hue={2}>Observed target {n(pair.target)}</Port><span className="rec-flow-operator">−</span><Port>Old score {n(update.objective.score)}</Port><Wire /><strong>e {n(update.objective.error)}</strong></div>
    <div className="rec-flow-array-operation"><div className="rec-flow-values"><Port hue={1}>Old q ({pair.q.map(n).join(', ')})</Port><Wire /><span>× −e {n(-update.objective.error)}</span>
      <span className="rec-flow-operator">+</span><Port>λ × old p ({pair.p.map(n).join(', ')})</Port><Wire /><strong>∂ℓ/∂p ({update.gradient.p.map(n).join(', ')})</strong></div>
      <div className="rec-flow-values"><Port>Old p ({pair.p.map(n).join(', ')})</Port><Wire /><span>× −e {n(-update.objective.error)}</span>
        <span className="rec-flow-operator">+</span><Port hue={1}>λ × old q ({pair.q.map(n).join(', ')})</Port><Wire /><strong>∂ℓ/∂q ({update.gradient.q.map(n).join(', ')})</strong></div></div>
    <RecOperands
      rowHues={[...pair.p.map(() => itemHue(0)), ...pair.q.map(() => itemHue(1)), undefined, undefined]} label="Each derivative reads an explicitly named old buffer" headers={['Parameter', 'Old own value', 'Old cross value', '−e × cross', 'λ × own', 'Derivative', 'New simultaneous', 'In-place counterexample']}
      rows={[...pair.p.map((value, coordinate) => [`p${coordinate}`, value, pair.q[coordinate], -update.objective.error * pair.q[coordinate], state.lambda * value, update.gradient.p[coordinate], update.next?.p[coordinate] ?? null, wrong.next?.p[coordinate] ?? null]),
        ...pair.q.map((value, coordinate) => [`q${coordinate}`, value, pair.p[coordinate], -update.objective.error * pair.p[coordinate], state.lambda * value, update.gradient.q[coordinate], update.next?.q[coordinate] ?? null, wrong.next?.q[coordinate] ?? null]),
        ['bᵤ',pair.bu,1,-update.objective.error,state.lambda*pair.bu,update.gradient.bu,update.next?.bu??null,wrong.next?.bu??null],
        ['bᵢ',pair.bi,1,-update.objective.error,state.lambda*pair.bi,update.gradient.bi,update.next?.bi??null,wrong.next?.bi??null]]} />
    <div className="rec-flow-values"><span>Old parameter</span><span className="rec-flow-operator">−</span><span>η {n(state.eta)} × its old-buffer derivative</span><Wire /><strong>New simultaneous parameter</strong></div>
  </RecFigure>;
}

export function FactorTrajectoryFigure() {
  const state = useRecFactors();
  const trace = factorTrace(selected(state), state.eta, state.lambda, state.steps);
  return <RecFigure id="D19" label="Same fixed-state objective at each actual repeated local step" reset={state.reset}
    controls={<><RecQuantity label="Local steps" integer value={state.steps} min={0} max={15} revision={state.revision} onChange={steps => state.patch({ steps })} />
      <RecQuantity label="Learning rate η" value={state.eta} min={0} max={1} revision={state.revision} onChange={eta => state.patch({ eta })} /></>}
    result={`Initial loss ${n(trace.states[0].loss)}; last valid step ${trace.states.at(-1).step}, loss ${n(trace.states.at(-1).loss)}. ${trace.unavailable ? `Requested step ${trace.unavailable.step} unavailable: ${trace.unavailable.message}` : 'This is a local parameter trace, not a held-out performance result.'}`}>
    <RecCurve label="Actual residual-plus-penalty objective; changing range follows this run" points={trace.states.map(row => [row.step, row.loss])}
      xLabel="Local step" yLabel="Objective" selected={[trace.states.at(-1).step,trace.states.at(-1).loss]} />
    <RecOperands
      columnHues={[undefined, undefined, undefined, undefined, itemHue(0), itemHue(1)]} label="Saved current states, not rolling residual estimates" headers={['Step', 'Score', 'Residual term', 'Penalty term', 'Objective', 'p0', 'q0']}
      rows={trace.states.map(row => [row.step,row.score,row.residual,row.penalty,row.loss,row.state.p[0],row.state.q[0]])} />
  </RecFigure>;
}

export function PenaltyIncidenceFigure() {
  const state = useRecFactors();
  const user = state.evidence.user;
  const items = state.evidence.matrix[user].flatMap((rating,item) => rating === null ? [] : [item]);
  const norm = dot(selected(state).p,selected(state).p);
  const count = items.length;
  const coefficient = state.convention === 'record' ? state.lambda * count : state.lambda;
  return <RecFigure id="D20" label="Occurrence incidence changes the global penalty coefficient" reset={state.reset}
    controls={<><RecSelect label="Penalty user" value={user} options={options(state.evidence.matrix.length,'U')} onChange={value => state.evidence.patch({user:Number(value)})} />
      <RecSelect label="Penalty counting convention" value={state.convention} options={[['record','Once per observed record'],['entity','Once per entity']]}
        onChange={convention => state.patch({convention})} /></>}
    result={`U${user} has ${count} observed records; ‖pᵤ‖² ${n(norm)}. Current ${state.convention} coefficient ${n(coefficient)}, penalty ${n(coefficient * norm / 2)}. ${count === 0 ? (state.convention === 'entity' && state.lambda > 0 ? 'Its unused vector minimizes the positive entity penalty at zero.' : 'No local observation supplies a unique unused vector.') : ''}`}>
    <div className="rec-flow-values"><Port>U{user} factor norm {n(norm)}</Port><Wire />{items.map((item, index) => <Port key={item} hue={item}>Record {index + 1}: U{user}/I{item}; λ charge {n(state.lambda)}</Port>)}{!count && <span>No observed record</span>}</div>
    <RecOperands label="Same observed records; different objective accounting" headers={['Convention', 'Per-local charge', 'Total coefficient', 'Factor penalty']}
      rows={[["Per record",state.lambda,state.lambda*count,state.lambda*count*norm/2],['Once per entity',count?state.lambda/count:null,state.lambda,state.lambda*norm/2]]} />
    <div className="rec-flow-values"><span>Separate three-occurrence fixture</span><Wire /><span>λ/3 + λ/3 + λ/3 = λ</span><span>Per-record alternative: λ + λ + λ = 3λ</span></div>
  </RecFigure>;
}

export function GaussianPriorFigure() {
  const state = useRecFactors();
  const residuals = state.evidence.matrix.flatMap((row,user) => row.flatMap((rating,item) => rating === null ? [] : [{user,item,rating,
    score:dot(state.P[user]??Array(state.dimension).fill(0),state.Q[item]??Array(state.dimension).fill(0))}]));
  const sse = sum(residuals.map(row => (row.rating-row.score)**2));
  const norm = sum([...state.P,...state.Q].map(row=>dot(row,row)));
  const available = state.noise > 0 && state.prior > 0;
  return <RecFigure id="D21" label="Masked Gaussian likelihood and once-entity Gaussian factor prior" reset={state.reset}
    controls={<><RecQuantity label="Noise variance σ²" value={state.noise} min={0} max={10} revision={state.revision} onChange={noise=>state.patch({noise})} />
      <RecQuantity label="Prior variance τ²" value={state.prior} min={0} max={10} revision={state.revision} onChange={prior=>state.patch({prior})} /></>}
    result={available?`Biasless likelihood over ${residuals.length} observed pairs: ${n(sse/(2*state.noise))}; once-entity prior ${n(norm/(2*state.prior))}. Multiplying by σ² gives λ ${n(state.noise/state.prior)}. This model differs from the biased local SGD objective.`:'A zero variance is a degenerate boundary; the displayed finite-density division/MAP ratio is unavailable.'}>
    <RecOperands
      rowHues={residuals.map(row => itemHue(row.item))} label="Gaussian outcomes use only observed targets; biasless dot means" headers={['Pair','Rating','Mean pᵀq','Residual','Residual²']}
      rows={residuals.map(row=>[`U${row.user}/I${row.item}`,row.rating,row.score,row.rating-row.score,(row.rating-row.score)**2])} />
    <div className="rec-flow-parallel"><div className="rec-flow-values"><Port>Σ observed residual² {n(sse)}</Port><Wire /><span>÷ 2σ² = {n(2*state.noise)}</span><Wire /><strong>Likelihood cost {available?n(sse/(2*state.noise)):'unavailable'}</strong></div>
      <div className="rec-flow-values"><Port hue={1}>Σ entity norm² {n(norm)}</Port><Wire /><span>÷ 2τ² = {n(2*state.prior)}</span><Wire /><strong>Prior cost {available?n(norm/(2*state.prior)):'unavailable'}</strong></div></div>
    <div className="rec-flow-values"><span>Multiply both costs by σ²</span><Wire /><strong>Once-entity λ = σ²/τ² {available?n(state.noise/state.prior):'unavailable'}</strong></div>
  </RecFigure>;
}

export function FixedFactorBowlFigure() {
  const state = useRecFactors();
  const result=fixedBowl(state.bowlP);
  return <RecFigure id="D22" label="Actual fixed-factor scalar bowl and its component terms" reset={state.reset}
    controls={<RecQuantity label="Fixed-bowl user coordinate p" value={state.bowlP} min={-4} max={4} revision={state.revision} onChange={bowlP=>state.patch({bowlP})} />}
    result={`Separate q=(1,2), r=(4,2), λ1 fixture: objective ${n(result.loss)}, derivative ${n(result.derivative)}. Exact minimum p4/3, loss28/3; this is not the joint biased SGD trace.`}>
    <RecOperands
      rowHues={[itemHue(0), itemHue(1), undefined]} label="Each squared residual and the once-entity penalty contributes" headers={['Term','Input','Residual or p','Square']}
      rows={[["I0",4,4-state.bowlP,result.terms[0]],['I1',2,2-2*state.bowlP,result.terms[1]],['λ1 penalty',1,state.bowlP,result.terms[2]]]} />
    <div className="rec-flow-values"><span>Σ three squares</span><Wire /><strong>{n(result.loss)}</strong><span>Derivative 12p−16 = {n(result.derivative)}</span></div>
    <RecCurve label="20 − 16p + 6p²; fixed items" points={Array.from({length:81},(_,index)=>{const p=-4+index*.1;return[p,fixedBowl(p).loss]})}
      xLabel="User coordinate p" yLabel="Objective" selected={[state.bowlP,result.loss]} extra={[[4/3,28/3]]} />
  </RecFigure>;
}

export function CoordinateMinimizerFigure() {
  const state=useRecFactors();
  const result=coordinateMinimum(state.blockP,state.blockQ,state.blockRatings,state.coordinate,state.blockLambda);
  return <RecFigure id="D23" label="Residual excluding one coordinate feeds its exact quadratic minimizer" reset={state.reset}
    controls={<><RecSelect label="Selected coordinate k" value={state.coordinate} options={options(state.dimension,'k')} onChange={value=>state.patch({coordinate:Number(value)})} />
      <RecQuantity label="Block penalty λ" value={state.blockLambda} min={0} max={10} revision={state.revision} onChange={blockLambda=>state.patch({blockLambda})} />
      <RecExactObject label="Independent fixed-side block arrays" value={{p:state.blockP,Q:state.blockQ,ratings:state.blockRatings}} revision={state.revision}
        description={`JSON {p,Q,ratings}: dimension ${state.dimension}, 1–30 item rows; factor coordinates ±10000; ratings −10–10. This fixture is separate from the edited rating matrix.`}
        parse={text=>{const value=JSON.parse(text);const p=parseRecVector(JSON.stringify(value.p),state.dimension,-1e4,1e4);
          if(!Array.isArray(value.Q)||value.Q.length<1||value.Q.length>30)throw new Error('Use 1–30 fixed item rows.');
          const Q=value.Q.map(row=>parseRecVector(JSON.stringify(row),state.dimension,-1e4,1e4));
          const ratings=parseRecVector(JSON.stringify(value.ratings),Q.length,-10,10);return{p,Q,ratings};}}
        onChange={({p,Q,ratings})=>state.patch({blockP:p,blockQ:Q,blockRatings:ratings})} /></>}
    result={`Coordinate k${state.coordinate}: numerator ${n(result.numerator)}, denominator ${n(result.denominator)}, new value ${n(result.value)}. ${result.value===null?'Zero curvature makes this coordinate nonunique; no regularizer was inserted.':'Other coordinates remain fixed.'}`}>
    <RecOperands
      rowHues={result.terms.map(term => itemHue(term.item))} label="Observed fixed-side terms before summing" headers={['Item','qᵢk','Other-coordinate score','Residual without k','qᵢk × residual','qᵢk²']}
      rows={result.terms.map(term=>[`I${term.item}`,term.q,term.other,term.residual,term.product,term.square])} />
    <div className="rec-flow-values"><Port>Σ products {n(result.numerator)}</Port><Wire /><span className="rec-flow-operator">÷</span>
      <Port hue={1}>Σ qᵢk² + λ = {n(result.denominator)}</Port><Wire /><strong>p_k {n(result.value)}</strong></div>
  </RecFigure>;
}

export function ObservedBlockFigure() {
  const state=useRecFactors();
  const ratings=state.evidence.matrix[state.evidence.user];
  const Q=resizeFactorRows(state.Q,ratings.length,state.dimension);
  const result=observedBlock(Q,ratings,state.blockLambda,state.convention);
  const fixed=observedBlock([[1,0],[1,1]],[4,2],1);
  return <RecFigure id="D24" label="Observed item outer products, ridge diagonal and actual Cholesky solve" reset={state.reset}
    controls={<><RecSelect label="Block user" value={state.evidence.user} options={options(state.evidence.matrix.length,'U')} onChange={value=>state.evidence.patch({user:Number(value)})} />
      <RecQuantity label="Block penalty λ" value={state.blockLambda} min={0} max={10} revision={state.revision} onChange={blockLambda=>state.patch({blockLambda})} />
      <RecSelect label="Block penalty convention" value={state.convention} options={[['entity','Once per entity'],['record','Once per record']]}
        onChange={convention=>state.patch({convention})} /></>}
    result={`Biasless edited E user U${state.evidence.user} and current Q: ${result.contributions.length} observed rows, diagonal penalty ${n(result.penalty)}. ${result.available?`p=(${result.p.map(n).join(', ')}); residual Ap−b=(${result.residual.map(n).join(', ')}).`:result.reason} Solve threshold ${n(result.tolerance)} follows actual matrix scale.`}>
    <div className="rec-flow-array-operation">{result.contributions.map(entry=><div key={entry.item} className="rec-flow-parallel">
      <RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label={`I${entry.item}: qᵢ qᵢᵀ outer product`} rows={entry.outer} columns={names(state.dimension)} rowNames={names(state.dimension)} />
      <RecOperands
      rowHues={entry.q.map((_, coordinate) => itemHue(coordinate))} label={`I${entry.item}: rating ${n(entry.rating)} × qᵢ`} rows={entry.q.map((value,coordinate)=>[`k${coordinate}`,entry.rating,value,entry.vector[coordinate]])} />
    </div>)}<Wire down /><div className="rec-flow-values"><span>Sum observed outer products</span><span className="rec-flow-operator">+</span><span>λ-effective {n(result.penalty)} × identity</span><Wire /><strong>A</strong></div>
      <div className="rec-flow-parallel"><RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label="A: simultaneous coordinate coefficients" rows={result.A} columns={names(state.dimension)} rowNames={names(state.dimension)} />
        <RecMatrix
      rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label="b: summed observed rating×factor vectors" rows={result.b.map(value=>[value])} columns={['b']} rowNames={names(state.dimension)} /></div>
      {result.available?<><Wire down /><RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label="Cholesky L: A=L Lᵀ" rows={result.L} columns={names(state.dimension)} rowNames={names(state.dimension)} />
        <div className="rec-flow-values"><span>L y = b: y=({result.y.map(n).join(', ')})</span><Wire /><span>Lᵀ p = y</span><Wire /><strong>p=({result.p.map(n).join(', ')})</strong></div>
        <RecOperands
      rowHues={result.A.map((_, coordinate) => itemHue(coordinate))} label="Substitution in every actual simultaneous equation" headers={['Equation','A row','Solved p','A p','b','Residual']}
          rows={result.A.map((row,coordinate)=>[`k${coordinate}`,row.map(n).join(', '),result.p.map(n).join(', '),dot(row,result.p),result.b[coordinate],result.residual[coordinate]])} /></>:<strong>{result.reason}</strong>}
    </div>
    <RecOperands label="Separate two-coordinate worked block, q0=(1,0),q1=(1,1),r=(4,2),λ1" headers={['Equation','Left side at p=(2,0)','b','Residual']}
      rows={[["3p0+p1",6,fixed.b[0],6-fixed.b[0]],['p0+2p1',2,fixed.b[1],2-fixed.b[1]]]} />
  </RecFigure>;
}
