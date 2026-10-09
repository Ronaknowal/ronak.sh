import { P, Q, divergenceState, generator, weight, validWeights } from '../../data/divergence-reading-models.js';
import { Figure, LawKey, LawColumns, Svg, Dot, Arrow, Plot, Bars, Table, Ops, Controls, Edit, Choice, useStudy, COLORS, fmt } from './DivergenceReadingElements.jsx';

const kinds = [['kl', 'Forward KL'], ['reverse', 'Reverse KL'], ['js', 'Jensen–Shannon'], ['hellinger', 'Squared Hellinger'], ['chi', 'Pearson χ²'], ['tv', 'Total variation']];
const grid = (start, end, f, count = 121) => Array.from({ length: count }, (_, i) => { const t = start + i * (end - start) / (count - 1); return [t, f(t)]; });

export function LawAnatomy() {
  return <Figure id="D01"><LawColumns p={P} q={Q} /></Figure>;
}

export function OneExpectation() {
  return <Figure id="D02"><LawKey /><p>The rule keeps A and assigns zero to B, C and D.</p><Svg label="The event gate keeps the A mass from each law and zeroes the other three masses" height={275}>{['P', 'Q'].map((role, row) => <g key={role}>{[0, 1, 2, 3].map(i => <g key={i}><Dot x={65 + i * 90} y={35 + row * 130} role={role} /><text x={65 + i * 90} y={68 + row * 130} textAnchor="middle">{'ABCD'[i]}</text><Arrow x1={65 + i * 90} y1={78 + row * 130} x2={65 + i * 90} y2={110 + row * 130} color={i === 0 ? COLORS[role] : '#666'} /><text x={65 + i * 90} y={138 + row * 130} textAnchor="middle">{i === 0 ? 1 : 0}</text></g>)}</g>)}</Svg><Bars maximum={1} unit="probability" rows={[{ label: 'P: .7×1 + .2×0 + .1×0 + 0×0', value: .7, role: 'P' }, { label: 'Q: .4×1 + .5×0 + .1×0 + 0×0', value: .4, role: 'Q' }]} /><p>Expectation gap: .7−.4=.3.</p></Figure>;
}

export function WeightedPenalty() {
  const t = 1.75, height = generator(t, 'kl');
  return <Figure id="D03"><Plot label="Centered KL generator with A's ratio at1.75" xDomain={[0, 3]} yDomain={[0, 1.4]} xLabel="ratio t" yLabel="generator height" series={[{ points: grid(0, 3, x => generator(x, 'kl')), color: COLORS.difference }]}>{({ xy }) => <><line x1={xy(t, 0)[0]} x2={xy(t, 0)[0]} y1={xy(t, 0)[1]} y2={xy(t, height)[1]} stroke={COLORS.Q} strokeWidth="3" /><Dot x={xy(t, height)[0]} y={xy(t, height)[1]} role="P" /></>}</Plot><Plot label="Q's probability width multiplies the generator height to give the row area" xDomain={[0, 1]} yDomain={[0, .4]} xLabel="Q probability width" yLabel="f(1.75)" >{({ xy }) => <rect x={xy(0, height)[0]} y={xy(0, height)[1]} width={xy(.4, 0)[0] - xy(0, 0)[0]} height={xy(0, 0)[1] - xy(0, height)[1]} fill={COLORS.Q} fillOpacity=".45" stroke={COLORS.Q} />}</Plot><Ops steps={[{ label: 'A ratio', value: '.7/.4 = 1.75' }, { label: 'Generator height', value: fmt(height, 8) }, { label: 'Probability width × height', value: `.4 × ${fmt(height, 8)} = ${fmt(.4 * height, 8)} nats` }]} /></Figure>;
}

export function ConvexAverage() {
  const ratios = [1.75, .4, 1], weights = [.4, .5, .1];
  const average = ratios.reduce((s, t, i) => s + weights[i] * generator(t, 'kl'), 0);
  const intermediate = average / .9;
  return <Figure id="D04"><Plot label="Weighted curve heights lie above the convex generator at the weighted mean ratio1" xDomain={[0, 2]} yDomain={[0, .5]} xLabel="ratio t" yLabel="generator height" series={[{ points: grid(.04, 2, t => generator(t, 'kl')) }, { points: [[.4, generator(.4, 'kl')], [1.75, generator(1.75, 'kl')]], color: COLORS.Q }, { points: [[1, 0], [1, intermediate]], color: COLORS.difference }]}>{({ xy }) => <>{ratios.map((t, i) => <Dot key={i} x={xy(t, generator(t, 'kl'))[0]} y={xy(t, generator(t, 'kl'))[1]} role="P" />)}<Dot x={xy(1, average)[0]} y={xy(1, average)[1]} role="Q" /><text x={xy(1, 0)[0]} y={xy(1, 0)[1] + 36} textAnchor="middle">1</text></>}</Plot><Table caption="Actual Q weights determine both averages" headers={['Outcome', 'Ratio', 'Weight', 'Weight × generator']} rows={ratios.map((t, i) => ['ABC'[i], t, weights[i], fmt(weights[i] * generator(t, 'kl'))])} /><Ops steps={[{ label: 'First chord: A/B conditional weights4/9 and5/9', value: `mean ratio1; mean height${fmt(intermediate)}` }, { label: 'Combine that point with C using .9 and .1', value: `E_Q t = 1; E_Q f(t) = ${fmt(average)}` }, { label: 'Compare with the curve at the mean', value: 'f(1)=0 ≤ E_Q f(t)' }]} /></Figure>;
}

export function AffineCancellation() {
  const raw = P.slice(0, 3).map((p, i) => p * Math.log(p / Q[i]));
  const correction = P.slice(0, 3).map((p, i) => Q[i] - p);
  return <Figure id="D05">{[['Raw p ln(p/q)', raw], ['Affine correction −p+q', correction], ['Centered row', raw.map((v, i) => v + correction[i])]].map(([title, values]) => <Bars key={title} label={title} minimum={-.4} maximum={.5} unit="nats" rows={values.map((value, i) => ({ label: 'ABC'[i], value, color: COLORS.difference }))} />)}<p>Correction sum={fmt(correction.reduce((a, b) => a + b, 0))}; both totals={fmt(raw.reduce((a, b) => a + b, 0), 9)} nats. Each outcome stays in the same row.</p></Figure>;
}

export function SixGenerators() {
  return <Figure id="D06"><div className="fd-grid">{kinds.map(([kind, name]) => {
    const ymax = { kl: 3, reverse: 3, js: .7, hellinger: .6, chi: 9, tv: 1.5 }[kind];
    return <section key={kind}><p>{name}: its own labelled vertical scale.</p><Plot label={`${name} generator, zero at ratio1`} xDomain={[0, 4]} yDomain={[0, ymax]} xLabel="ratio t" yLabel="f(t)" series={[{ points: grid(kind === 'reverse' ? .025 : 0, 4, t => generator(t, kind)), color: COLORS.difference }]}>{({ xy }) => <><Dot x={xy(1, 0)[0]} y={xy(1, 0)[1]} role="P" />{kind === 'reverse' && <Arrow x1={54} y1={65} x2={54} y2={25} color={COLORS.difference} />}</>}</Plot>{kind === 'reverse' && <p>At t=0 the value tends to∞; the arrow continues above the displayed axis.</p>}</section>;
  })}</div></Figure>;
}

export function RatioInvestigation() {
  const [state, update, reset] = useStudy('ratio');
  const s = divergenceState(state.p, state.q, state.kind);
  const cases = [[.25, .25, 'Equal positive masses'], [0, .25, 'P zero, Q positive'], [.25, 0, 'Q zero, P positive'], [0, 0, 'Both zero']];
  return <Figure id="D07"><p>First inspect the four support cases. Each paired height uses the same 0–¼ mass scale.</p><Svg label="Equal, one-sided missing, and common-zero probability slots" height={260}>{cases.map(([p, q], i) => <g key={i}>{[[p, 'P', -11], [q, 'Q', 11]].map(([v, role, shift]) => <g key={role}><line x1={60 + 120 * i + shift} x2={60 + 120 * i + shift} y1="175" y2={175 - v * 500} stroke={COLORS[role]} strokeWidth="7" /><Dot x={60 + 120 * i + shift} y={175 - v * 500} role={role} /></g>)}<text x={60 + 120 * i} y="225" textAnchor="middle">{i + 1}</text></g>)}</Svg><Table caption="Support cases: one row's contribution for each generator" headers={['Case (p,q)', ...kinds.map(v => v[1])]} rows={cases.map(([p, q, name], i) => [`${i + 1}. ${name} (${p},${q})`, ...kinds.map(([kind]) => fmt(divergenceState([p, 1 - p], [q, 1 - q], kind).rows[0].penalty))])} /><LawColumns p={s.p} q={s.q} /><Table caption="The current normalized laws and weighted penalties" headers={['Outcome', 'Raw P weight', 'Raw Q weight', 'Ratio p/q', 'Weighted penalty']} rows={s.rows.map((r, i) => [r.label, state.p[i], state.q[i], fmt(r.ratio), fmt(r.penalty)])} /><Bars maximum={Math.max(1, ...s.rows.map(r => Number.isFinite(r.penalty) ? r.penalty : 0))} label="Selected generator contributions" rows={s.rows.map(r => ({ label: r.label, value: r.penalty, color: COLORS.difference }))} /><p aria-live="polite">{kinds.find(k => k[0] === state.kind)[1]} total={fmt(s.total, 10)}.</p><Controls reset={state.reset} onReset={reset}><div className="fd-grid">{['p', 'q'].map(role => <div key={role}><p>{role.toUpperCase()} weights</p>{state[role].map((value, i) => <Edit key={i} label={`${role.toUpperCase()} weight ${'ABCD'[i]}`} value={value} parse={weight} onValid={v => { const values = state[role].map((old, j) => i === j ? v : old); validWeights(values); update({ [role]: values }); }} />)}</div>)}</div><Choice label="Generator" value={state.kind} options={kinds} onChange={kind => update({ kind })} /><div className="fd-actions"><button onClick={() => update({ p: state.q, q: state.p })}>Swap P and Q</button><button disabled={state.q.slice(1).every(v => v === 0)} onClick={() => update({ q: [0, ...state.q.slice(1)] })}>Remove Q support at A</button><button onClick={() => update({ q: [...state.p] })}>Match Q to P</button></div>{state.q.slice(1).every(v => v === 0) && <p>Add positive Q weight outside A before removing its only supported outcome.</p>}</Controls></Figure>;
}

export function CommonMeasure() {
  const rows = P.slice(0, 3).map((p, i) => ({ p, q: Q[i], mu: p + Q[i] }));
  return <Figure id="D08"><LawKey /><p>The μ=P+Q mass columns use a common0–1.2 scale; they need not form a probability law.</p><Svg label="Three common-measure columns split into P and Q portions" height={280}>{rows.map((r, i) => <g key={i}><rect x={70 + i * 140} y={215 - r.mu / 1.2 * 180} width="60" height={r.p / 1.2 * 180} fill={COLORS.P} /><rect x={70 + i * 140} y={215 - r.q / 1.2 * 180} width="60" height={r.q / 1.2 * 180} fill={COLORS.Q} /><line x1={55 + i * 140} x2={145 + i * 140} y1="215" y2="215" stroke="#aaa" /><text x={100 + i * 140} y="253" textAnchor="middle">{'ABC'[i]}</text></g>)}</Svg><Table caption="Densities are fractions of μ at each atom" headers={['Atom', 'μ mass', 'dP/dμ', 'dQ/dμ', 'Weighted integral term']} rows={rows.map((r, i) => ['ABC'[i], fmt(r.mu), fmt(r.p / r.mu), fmt(r.q / r.mu), `${fmt(r.mu)} × ${fmt(r.q / r.mu)} × f(${fmt(r.p / r.q)})`])} /><Ops steps={[{ label: 'The A integration weight cancels its density denominator', value: '1.1 × (.4/1.1) × f((.7/1.1)/(.4/1.1))' }, { label: 'The same probability-mass contribution', value: '.4 f(.7/.4)' }]} /><p>A P-only atom has zero Q-density: its extra term is P-mass×f∞, with the stated finite/infinite convention.</p></Figure>;
}

export function ConditionalRatios() {
  const a = generator(.4, 'kl'), b = generator(1.75, 'kl');
  return <Figure id="D09"><Plot label="A common merge forms the conditional-Q weighted chord at ratio1" xDomain={[0, 2]} yDomain={[0, .5]} xLabel="source or processed ratio" yLabel="centered KL penalty" series={[{ points: grid(.03, 2, t => generator(t, 'kl')) }, { points: [[.4, a], [1.75, b]], color: COLORS.Q }]}>{({ xy }) => <><Dot x={xy(.4, a)[0]} y={xy(.4, a)[1]} role="P" /><Dot x={xy(1.75, b)[0]} y={xy(1.75, b)[1]} role="P" /><line x1={xy(1, 0)[0]} x2={xy(1, 0)[0]} y1={xy(1, 0)[1]} y2={xy(1, (5 * a + 4 * b) / 9)[1]} stroke={COLORS.difference} strokeWidth="3" /><Dot x={xy(1, 0)[0]} y={xy(1, 0)[1]} role="Q" /></>}</Plot><Ops steps={[{ label: 'Q mass in the merged group', value: '.4+.5=.9' }, { label: 'Conditional weights inside A/B', value: 'A:4/9; B:5/9' }, { label: 'Weighted source ratios', value: '(4/9)×1.75+(5/9)×.4 = 1' }, { label: 'Processed probability ratio and penalty', value: '.9/.9=1; f(1)=0' }]} /></Figure>;
}

export function SharedChannel() {
  return <Figure id="D10"><p>Every arrow means deterministic membership, not a probability-proportional width. Both laws use the same K.</p><div className="fd-grid">{[['P', P], ['Q', Q]].map(([role, law]) => <div key={role}><p>{role}: A/B→left; C/D→right.</p><Svg label={`${role} follows the common four-to-two channel`} height={300}>{law.map((v, i) => <g key={i}><Dot x={65} y={40 + i * 65} role={role} /><text x="35" y={47 + i * 65} textAnchor="end">{'ABCD'[i]}</text><Arrow x1={78} y1={40 + i * 65} x2={365} y2={i < 2 ? 100 : 210} color={COLORS[role]} /></g>)}<Dot x={380} y={100} role={role} size={8} /><Dot x={380} y={210} role={role} size={8} /><text x="405" y="107">.9</text><text x="405" y="217">.1</text></Svg></div>)}</div><Table caption="One row-stochastic channel K for both inputs" headers={['Input', 'Left', 'Right']} rows={['A', 'B', 'C', 'D'].map((x, i) => [x, i < 2 ? 1 : 0, i < 2 ? 0 : 1])} /><p>Output totals are1 in both panels; even the zero-mass D source remains a named input.</p></Figure>;
}

export function ProcessingComparisons() {
  const before = divergenceState(P, Q).values;
  const keepA = divergenceState([.7, .3], [.4, .6]).values;
  return <Figure id="D11">{[['TV', 'tv', .35], ['KL', 'kl', .23]].map(([name, kind, maximum]) => <Bars key={kind} maximum={maximum} label={`${name}: one scale within this comparison`} rows={[{ label: 'Before', value: before[kind], role: 'P' }, { label: 'Merge A/B: discrepancy erased', value: 0, role: 'Q' }, { label: 'Keep A, merge B/C/D', value: keepA[kind], role: 'Q' }, { label: 'Invertible relabelling', value: before[kind], color: COLORS.difference }]} />)}<p>A shared channel need not reduce every comparison strictly; preserving the best event can preserve TV.</p></Figure>;
}

export function JointMixture() {
  return <Figure id="D12"><p>The same index J, with weights½ and½, selects each pair.</p><div className="fd-grid">{[['P', ['A', 'B']], ['Q', ['B', 'A']]].map(([role, atoms]) => <section key={role}><p>{role}: retain the index, then forget it.</p><Svg label={`${role} mixture branches with index0 and1, each probabilityone half`} height={245}><Dot x={240} y={25} role={role} />{atoms.map((atom, i) => <g key={i}><Arrow x1={240} y1={34} x2={110 + i * 260} y2={100} color={COLORS[role]} /><Dot x={110 + i * 260} y={112} role={role} /><text x={110 + i * 260} y="151" textAnchor="middle">{atom}</text><text x={110 + i * 260} y="202" textAnchor="middle">J={i}</text></g>)}</Svg><p>Both branches have probability½; forgetting J leaves equal mass on A and B.</p></section>)}</div><Bars maximum={Math.LN2} unit="nats" label="Jensen–Shannon" rows={[{ label: 'Pair0: δA versus δB', value: Math.LN2, role: 'P' }, { label: 'Pair1: δB versus δA', value: Math.LN2, role: 'Q' }, { label: 'After forgetting J: matching mixtures', value: 0, color: COLORS.difference }]} /></Figure>;
}
