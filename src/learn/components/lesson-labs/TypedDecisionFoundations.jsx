import { useState } from 'react';
import { argmax, candidateColors as colors, ceStep, encodeMini, entropy, letters, miniRequest,
  ordinalTrace, simplexPoint, softmaxTrace, stickProbability } from '../../data/typed-decision-models.js';
import { Arrow, Bars, Check, Controls, EvidenceState, Figure, fmt, Matrix, Pair, Range, Scroll,
  Select, Table, Tensor, useObservations, vector } from './TypedDecisionShared.jsx';

export function DecisionMeaning() {
  return <Figure id="D01" caption="Constructed report. Event identity follows A/B/C; membership in this set says nothing about calibration or the best action.">
    <p>“My new card has <strong>not arrived</strong>.”</p>
    <svg viewBox="0 0 500 90" role="img" aria-label="Missing arrival evidence branches to arrival, delivery estimate and lost card" style={{ width: '100%' }}>
      <path d="M250 10V32M75 75L250 32L425 75M250 32V75" fill="none" stroke="#aaa" />
      {['A arrival', 'B estimate', 'C lost'].map((text, i) => <g key={text}><circle cx={75 + 175 * i} cy="75" r="8" fill={colors[i]} />
        </g>)}
    </svg>
    <div className="typed-event-labels">{['A arrival', 'B estimate', 'C lost'].map((text, i) => <span key={text} style={{ color: colors[i] }}>{text}</span>)}</div>
    <Bars title="Probability of each meaning" values={[.6, .3, .1]} names={['A · arrival', 'B · delivery estimate', 'C · lost card']} />
    <Arrow>Largest mass → select A arrival</Arrow><p>Next decision: handle automatically, defer, or ask for clarification.</p>
  </Figure>;
}

export function DecisionArchitectures() {
  const [count, setCount] = useState(3);
  return <Figure id="D02" caption="Three different ways to add an event. These shapes show interface changes; no new-event accuracy is implied.">
    <div className="typed-groups">
      <div><Tensor rows={1} columns={32} label="One contextual row" color={colors[0]} /><Arrow>×</Arrow>
        <Tensor rows={32} columns={count} label="Fixed classifier weights" color={colors[2]} /><Arrow>=</Arrow>
        <Tensor rows={1} columns={count} label="Class logits" color={colors[1]} /></div>
      <div><Tensor rows={count} columns={32} label="Contextual option-marker rows" rowColors={colors} /><Arrow>× shared</Arrow>
        <Tensor rows={32} columns={1} label="Scalar scorer weights" /><Arrow>=</Arrow>
        <Tensor rows={count} columns={1} label="Option logits" rowColors={colors} /></div>
      <div><p>Autoregressive permitted paths</p><Scroll label="Allowed generated label paths">
        <svg viewBox="0 0 270 250" style={{ width: '17rem' }} role="img" aria-label="Prompt branches to allowed label tokens, then EOS">
          <circle cx="25" cy="120" r="6" fill="#bbb" />
          {letters.slice(0, count).map((label, i) => <g key={label}><path d={`M30 120L135 ${35 + 52 * i}H235`} stroke={colors[i]} fill="none" />
            <circle cx="135" cy={35 + 52 * i} r="10" fill="#202127" stroke={colors[i]} />
            <text x="135" y={39 + 52 * i} textAnchor="middle" className="typed-backed">{label}</text>
            <text x="235" y={28 + 52 * i} textAnchor="end">EOS</text></g>)}
          <text x="8" y="235">time →</text>
        </svg></Scroll></div>
    </div>
    <Controls reset={() => setCount(3)}><Check label="Add fourth candidate D" checked={count === 4} onChange={yes => setCount(yes ? 4 : 3)} /></Controls>
  </Figure>;
}

export function DecisionMarkers() {
  const [selected, setSelected] = useState(0);
  const data = encodeMini(miniRequest);
  return <Figure id="D03" caption="Exact lowercase-word serialization of the displayed miniature request. External IDs identify rows but are not encoded in this scratch model.">
    <p>Question: “Which event?” State: “My card has not arrived.”</p>
    <div className="typed-token-sequence">{data.tokens.map((token, i) => <span key={i}
      className={i === data.markers[selected] ? 'typed-selected' : ''}
      style={{ '--token-color': typeof data.roles[i] === 'number' ? colors[data.roles[i]] : data.roles[i] === 'state' ? colors[4] : '#aaa' }}>
      <b>position {i}</b>{token}</span>)}</div>
    <Arrow>Gather row at position {data.markers[selected]} ↓</Arrow>
    <Tensor rows={1} columns={32} label={`${letters[selected]} ${miniRequest.options[selected].id}: contextual marker vector`} color={colors[selected]} />
    <Controls reset={() => setSelected(0)}><Select label="Inspect candidate marker" value={selected} options={miniRequest.options.map((x, i) => [i, `${letters[i]} ${x.id}`])} onChange={x => setSelected(Number(x))} /></Controls>
  </Figure>;
}

export function DecisionMasks() {
  const [broken, setBroken] = useState(false);
  const [empty, setEmpty] = useState(false);
  const full = encodeMini(miniRequest);
  const short = encodeMini({ ...miniRequest, options: miniRequest.options.slice(0, 2) });
  const probabilities = empty ? null : softmaxTrace([0, 0, 4], broken ? [true, true, true] : [true, true, false]).probabilities;
  return <Figure id="D04" caption="Token validity protects attention keys; candidate validity protects the normalization denominator. The padded gather slot is stored as position zero.">
    <Matrix label={`Token mask B × L = 2 × ${full.tokens.length}; 1 real, 0 padding`} values={[full.tokens.map(() => 1), full.tokens.map((_, i) => Number(i < short.tokens.length))]} rowNames={['3 options', '2 options']} />
    <Pair><Matrix label="Candidate mask B × K = 2 × 3" values={[[1, 1, 1], empty ? [0, 0, 0] : broken ? [1, 1, 1] : [1, 1, 0]]} rowNames={['3 options', '2 options']} colNames={letters} />
      <Matrix label="Gather positions: padded last slot = 0" values={[full.markers, [...short.markers, 0]]} rowNames={['3 options', '2 options']} colNames={letters} /></Pair>
    {probabilities ? <Bars title="Two-option row, constructed logits [0, 0, 4]" values={probabilities} names={['A valid', 'B valid', 'unused slot']} /> : <p role="status">No valid candidate. A probability distribution over this row is undefined.</p>}
    <Controls reset={() => { setBroken(false); setEmpty(false); }}><Check label="Omit candidate padding mask" disabled={empty} checked={broken} onChange={setBroken} /><Check label="All candidates invalid" checked={empty} onChange={setEmpty} /></Controls>
  </Figure>;
}

export function DecisionEncoder() {
  return <Figure id="D05" caption="Actual scratch architecture: two pre-normalized bidirectional blocks, width 32, four width-8 heads, feed-forward width 128. The diagram abbreviates L to six visible rows; scalar scoring shares one weight column.">
    <p>Illustrated request length L = 24; actual requests have variable L ≤ 128.</p>
    <Pair><Tensor rows={24} columns={32} label="Token embedding E" color={colors[0]} /><Tensor rows={24} columns={32} label="Position embedding P" color={colors[3]} /></Pair>
    <Arrow>E + P → hidden X, L × 32</Arrow>
    <div className="typed-residual"><div className="typed-residual-rail" aria-label="Residual X bypass" /><div className="typed-block">
      <p>Block 1 · LayerNorm → one 32 × 96 QKV projection</p>
      <div className="typed-groups">{['Q', 'K', 'V'].map((name, i) => <Tensor key={name} rows={24} columns={32} label={name} color={colors[i]} />)}</div>
      <Arrow>Each splits into 4 heads of L × 8</Arrow>
      <Pair><Matrix label="Bidirectional attention topology, miniature L = 4" values={Array.from({ length: 4 }, () => [1, 1, 1, 1])} rowNames={['q0', 'q1', 'q2', 'q3']} colNames={['k0', 'k1', 'k2', 'k3']} />
        <div><p>Per head: QKᵀ / √8 → mask padding keys → softmax → weighted V sum</p><Tensor rows={24} columns={8} label="One head output" color={colors[4]} /></div></Pair>
      <Arrow>Join four heads → L × 32 → 32 × 32 projection → + X</Arrow>
    </div></div>
    <div className="typed-residual"><div className="typed-residual-rail" aria-label="Residual hidden bypass" /><div className="typed-block">
      <p>LayerNorm → 32 → 128 → GELU → 32 → residual addition</p>
      <Scroll label="Feed-forward expansion 32 to 128 to 32, widths to scale"><svg viewBox="0 0 380 170" style={{ width: '24rem' }} role="img" aria-label="Coordinate width expands fourfold then contracts">
        <path d="M190 35V65M190 95V125" stroke="#aaa" />
        {[32, 128, 32].map((width, i) => <g key={i}><rect x={190 - width * 1.25} y={10 + i * 60} width={width * 2.5} height="25" fill={colors[2]} opacity=".7" />
          <text x="190" y={28 + i * 60} textAnchor="middle" className="typed-backed">{width}</text></g>)}
      </svg></Scroll>
    </div></div>
    <Arrow>Block 2 repeats the same structure with its own learned parameters</Arrow>
    <Tensor rows={3} columns={32} label="Gather K marker rows" rowColors={colors} />
    <Arrow>LayerNorm → shared 32 × 1 map → K logits</Arrow>
    <Tensor rows={3} columns={1} label="One score per option" rowColors={colors} />
  </Figure>;
}

export function DecisionAttention() {
  const state = useObservations();
  const [key, setKey] = useState(0);
  if (!state.data) return <Figure id="D06" caption="Saved random seed-211 operation"><EvidenceState state={state} /></Figure>;
  const a = state.data.finite.random_attention;
  return <Figure id="D06" caption="Recorded seed-211 random initialization, block 1, head 0, query position 8. Inspect one key contribution; the bottom sum includes every key. Padding keys have zero weight. This is not trained causal attribution.">
    <p>Fixed marker query q₈ attends to the entire request. Select a key below to trace αⱼvⱼ.</p>
    <div className="typed-token-sequence">{a.weights.map((value, i) => <span key={i} className={i === key ? 'typed-selected' : a.input_ids[i] === 0 ? 'typed-padding' : ''} style={{ '--token-color': colors[0] }}>
      <b>key {i} · ID {a.input_ids[i]}</b>{fmt(value, 5)}</span>)}</div>
    <Matrix label={`Key ${key}: value vector, weight ${fmt(a.weights[key], 6)} times value, and all-key sum`} values={[a.value_vectors[key], a.weighted_values[key], a.sum_vector]} rowNames={['vⱼ', 'αⱼvⱼ', 'Σ αv']} signed />
    <Controls reset={() => setKey(0)}><Range label="Inspect key position" value={key} min={0} max={a.weights.length - 1} step={1} onChange={setKey} /></Controls>
  </Figure>;
}

export function DecisionSoftmax() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [shift, setShift] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const [empty, setEmpty] = useState(false);
  const z = [a + shift, b + shift, shift];
  const trace = empty ? null : softmaxTrace(z, [true, true, !invalid]);
  return <Figure id="D07" caption="Live exact arithmetic. The shared shift changes the displayed logits but cancels after subtracting the valid maximum. Invalid entries contribute zero to the denominator.">
    <Table caption="Normalize across valid events" headers={['Event', 'z', 'z − max', 'exp', 'probability']} rows={z.map((x, i) => [letters[i], fmt(x), trace?.shifted[i] == null ? 'masked' : fmt(trace.shifted[i]), trace ? fmt(trace.exponents[i]) : 'undefined', trace ? fmt(trace.probabilities[i]) : 'undefined'])} />
    {trace ? <><p>Valid maximum = {fmt(trace.maximum)}; denominator = {fmt(trace.denominator)}.</p><Bars title="p = exp / denominator" values={trace.probabilities} /></> : <p role="status">No valid candidates: normalization is undefined.</p>}
    <Controls reset={() => { setA(2); setB(1); setShift(0); setInvalid(false); setEmpty(false); }}>
      <Range label="A logit before shift" value={a} min={-8} max={8} step={.25} onChange={setA} />
      <Range label="B logit before shift" value={b} min={-8} max={8} step={.25} onChange={setB} />
      <Range label="Common shift" value={shift} min={-1000} max={1000} step={100} onChange={setShift} />
      <Check label="C is invalid" disabled={empty} checked={invalid} onChange={setInvalid} /><Check label="All invalid" checked={empty} onChange={setEmpty} />
    </Controls>
  </Figure>;
}

export function ProbabilityTriangle({ p, truth, regions, extra }) {
  const vertices = [[35, 294.8076], [335, 294.8076], [185, 35]];
  const point = simplexPoint(p);
  const origin = truth ? simplexPoint(truth) : null;
  return <Scroll label="Probability simplex with labelled A B C vertices"><svg viewBox="0 0 370 340" className="typed-simplex" role="img" aria-label={`Probability simplex, current ${vector(p)}`}>
    <path d="M35 294.8076L335 294.8076L185 35Z" fill="#24262c" stroke="#999" />
    {regions}{extra}
    {origin && <><path d={`M${origin[0]} ${origin[1]}L${point[0]} ${point[1]}`} stroke="#ddd" strokeDasharray="4 4" /><circle cx={origin[0]} cy={origin[1]} r="6" fill="#fff" /></>}
    {vertices.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5" fill={colors[i]} /><text x={x} y={i === 2 ? 20 : 320} textAnchor="middle" style={{ fill: colors[i] }}>{letters[i]} = 1</text></g>)}
    <circle cx={point[0]} cy={point[1]} r="7" fill="#17181c" stroke="#fff" strokeWidth="2" />
  </svg></Scroll>;
}

export function DecisionSimplex() {
  const [a, setA] = useState(.6);
  const [share, setShare] = useState(.75);
  const p = stickProbability(a, share);
  return <Figure id="D08" caption="Every point represents three nonnegative masses summing to one. Circle = current report; vertices put all mass on one event. pmax and entropy measure different aspects of this same report.">
    <Pair><ProbabilityTriangle p={p} /><Bars title="Full report" values={p} names={['A arrival', 'B estimate', 'C lost']} /></Pair>
    <p>pmax = {fmt(Math.max(...p))}; entropy = {fmt(entropy(p))} nats; selected event {letters[argmax(p)]}.</p>
    <Controls reset={() => { setA(.6); setShare(.75); }}><Range label="Mass on A" value={a} onChange={setA} /><Range label="B share of remaining mass" value={share} onChange={setShare} /></Controls>
  </Figure>;
}

export function DecisionOrdinal() {
  const [spread, setSpread] = useState(1);
  const [rubric, setRubric] = useState(false);
  const p = [.5 * spread, 1 - spread, .5 * spread];
  const trace = ordinalTrace(p, 1, rubric ? [0, 1, 10] : [0, 1, 2]);
  return <Figure id="D09" caption="Ordered levels have cumulative thresholds. Numerical spacing is an additional choice: changing the rubric changes an expectation while leaving the same category probabilities intact.">
    <Pair><Bars title="Category mass" values={p} names={['0 no deadline', '1 soon', '2 immediate']} /><Bars title="Cumulative mass" values={trace.cumulative} names={['P(level ≤ 0)', 'P(level ≤ 1)']} /></Pair>
    <p>Ordinal index mean = 1 at every spread setting. Rubric {rubric ? '[0, 1, 10]' : '[0, 1, 2]'} expectation = {fmt(trace.expectation)}.</p>
    <Controls reset={() => { setSpread(1); setRubric(false); }}><Range label="Move middle mass equally to endpoints" value={spread} onChange={setSpread} /><Check label="Use rubric 0, 1, 10" checked={rubric} onChange={setRubric} /></Controls>
  </Figure>;
}

export function DecisionTruth() {
  const [p, setP] = useState(.7);
  const [negated, setNegated] = useState(false);
  const truth = negated ? 1 - p : p;
  return <Figure id="D10" caption="Constructed truth report. Negating the predicate exchanges its true and false events; it does not decide an action.">
    <p>Predicate: the customer {negated ? 'does not explicitly request' : 'explicitly requests'} a refund.</p>
    <Bars title="Two exhaustive events" values={[1 - truth, truth]} names={['false', 'true']} />
    <Controls reset={() => { setP(.7); setNegated(false); }}><Range label="Original predicate probability" value={p} onChange={setP} /><Check label="Negate predicate" checked={negated} onChange={setNegated} /></Controls>
  </Figure>;
}

export function DecisionCrossEntropy() {
  const [soft, setSoft] = useState(false);
  const [rate, setRate] = useState(.2);
  const target = soft ? [.2, .5, .3] : [0, 1, 0];
  const trace = ceStep([2, 1, 0], target, rate);
  return <Figure id="D11" caption="Constructed logit-space SGD step. Signed gradient p−t flows through all three coordinates. This finite illustration does not update the recorded neural model.">
    <Matrix label="Cross-entropy contributions and derivative" values={[trace.p, target, trace.terms, trace.gradient]} rowNames={['p', 'target t', '−t log p', 'p − t']} colNames={letters} signed />
    <Arrow>z′ = z − rate × (p − t)</Arrow>
    <Pair><Bars title="Before step" values={trace.p} /><Bars title="After step" values={trace.afterP} /></Pair>
    <p>Loss before = {fmt(trace.loss)}; new logits = {vector(trace.after)}.</p>
    <Controls reset={() => { setSoft(false); setRate(.2); }}><Check label="Use supplied soft target" checked={soft} onChange={setSoft} /><Range label="Step size" value={rate} onChange={setRate} /></Controls>
  </Figure>;
}

export function DecisionParameterStep() {
  const state = useObservations();
  const [which, setWhich] = useState(0);
  const [coordinate, setCoordinate] = useState(0);
  if (!state.data) return <Figure id="D12" caption="Saved complete one-step parity"><EvidenceState state={state} /></Figure>;
  const item = state.data.finite.updates[which];
  const rows = ['scorer_before', 'scorer_gradient', 'scorer_after'].map(key => item[key][0]);
  return <Figure id="D12" caption="Recorded seed-211 fixture, two examples, SGD rate 0.05. Every model parameter was compared with ordinary cross_entropy; these are actual saved scalar-scorer coordinates.">
    <Matrix label="Entire shared 32-coordinate weight vector, in four consecutive chunks" values={Array.from({ length: 4 }, (_, i) => rows[0].slice(i * 8, i * 8 + 8))} rowNames={['w0–7', 'w8–15', 'w16–23', 'w24–31']} colNames={Array.from({ length: 8 }, (_, i) => `+${i}`)} signed />
    <p>w[{coordinate}]: {fmt(rows[0][coordinate], 7)} − 0.05 × ({fmt(rows[1][coordinate], 7)}) = {fmt(rows[2][coordinate], 7)}</p>
    <Matrix label="Observed logits before and after whole-model update" values={[...item.logits_before, ...item.logits_after]} rowNames={['before row0', 'before row1', 'after row0', 'after row1']} colNames={letters} signed />
    <p>Loss = {fmt(item.loss, 7)}. Maximum coordinate discrepancy across all parameter gradients = {Math.max(...Object.values(item.all_parameter_gradient_errors)).toExponential(3)}.</p>
    <Controls reset={() => { setWhich(0); setCoordinate(0); }}><Select label="Recorded target case" value={which} options={[[0, 'Observed hard target'], [1, 'Supplied soft target']]} onChange={x => setWhich(Number(x))} />
      <Range label="Weight coordinate" value={coordinate} min={0} max={31} step={1} onChange={setCoordinate} /></Controls>
  </Figure>;
}
