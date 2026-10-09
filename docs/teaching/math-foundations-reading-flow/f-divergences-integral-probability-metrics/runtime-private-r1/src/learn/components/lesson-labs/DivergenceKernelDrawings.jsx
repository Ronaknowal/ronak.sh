import { kernelReading, kernel, movingAtomState, numeric, samples } from '../../data/divergence-reading-models.js';
import { Figure, LawKey, Svg, Dot, Arrow, Plot, Bars, Table, Ops, Controls, Edit, Range, Choice, useStudy, COLORS, fmt } from './DivergenceReadingElements.jsx';
import { AtomLanes } from './DivergenceObserverDrawings.jsx';

const curve = (a, b, f, n = 121) => Array.from({ length: n }, (_, i) => { const x = a + (b - a) * i / (n - 1); return [x, f(x)]; });
export const kernelOptions = [['rbf', 'Gaussian RBF'], ['linear', 'Linear xy'], ['quadratic', 'Two features: xy+x²y²']];

export function SamplePositions({ s }) {
  const occurrence = new Map();
  const rows = s.observations.map(point => {
    const key = `${point.role}:${point.value}`;
    const level = occurrence.get(key) ?? 0;
    occurrence.set(key, level + 1);
    return { ...point, level };
  });
  return <><LawKey /><p>Each indexed observation keeps its true horizontal position. Repeated values stack vertically within its sample lane.</p><Svg label="Indexed X and Y observations on the same minus3 to3 position ruler" height={265}>{[['P', 105], ['Q', 210]].map(([role, y]) => <g key={role}><line x1="50" x2="430" y1={y} y2={y} stroke="#888" />{rows.filter(r => r.role === role).map(row => <Dot key={row.id} x={50 + (row.value + 3) / 6 * 380} y={y - 12 - row.level * 12} role={role} selected={s.selected.some(v => v.id === row.id)} />)}</g>)}<text x="50" y="253">−3</text><text x="430" y="253" textAnchor="end">3</text></Svg><p>Selected pair: {s.selected.map(row => `${row.id}=${fmt(row.value)}`).join(' and ')}; distance={fmt(s.distance)}; similarity={fmt(s.pairValue, 9)}.</p></>;
}

export function PairSelectors({ s, update }) {
  const options = s.observations.map(row => [row.id, `${row.id}: ${fmt(row.value)}`]);
  return <>{[0, 1].map(i => <Choice key={i} label={`Selected pair ${i === 0 ? 'row' : 'column'}`} value={s.selected[i].id} options={options} onChange={id => update({ pair: s.selected.map((row, j) => i === j ? id : row.id) })} />)}</>;
}

export function SampleEditors({ state, update }) {
  return <>{['x', 'y'].map(role => <Edit key={role} label={`${role.toUpperCase()} sample positions`} value={state[role].join(', ')} parse={samples} onValid={values => update({ [role]: values })} />)}</>;
}

export function Bandwidth({ state, update, label = 'Gaussian bandwidth σ' }) {
  return <><Range label={label} min={.2} max={3} step={.1} value={state.sigma} disabled={state.kind !== 'rbf'} onChange={sigma => update({ sigma })} /><Edit label={`Exact ${label}`} disabled={state.kind !== 'rbf'} value={state.sigma} parse={text => numeric(text, .2, 3, 'Bandwidth')} onValid={sigma => update({ sigma })} />{state.kind !== 'rbf' && <p>The current non-Gaussian kernel does not useσ; its stored bandwidth has no effect.</p>}</>;
}

export function GramPicture({ s, onCell, exclude = false, table = true }) {
  const n = s.x.length, count = s.observations.length, cell = 380 / count;
  const lo = s.kind === 'rbf' ? 0 : Math.min(0, ...s.gram.flat());
  const hi = s.kind === 'rbf' ? 1 : Math.max(1, ...s.gram.flat());
  return <><p>Rows and columns retain the ordered IDs: {s.observations.map(r => r.id).join(', ')}. Similarity intensity uses its declared {fmt(lo)}–{fmt(hi)} scale. The +/− accumulation signs are separate.</p><Svg label="Actual indexed Gram cells split into XX, XY, YX and YY blocks" height={480}>{s.gram.flatMap((row, i) => row.map((value, j) => {
    const isWithin = (i < n) === (j < n);
    const omitted = exclude && isWithin && i === j;
    const selected = s.pair[0] === i && s.pair[1] === j;
    return <g key={`${i}:${j}`}><rect x={50 + j * cell} y={45 + i * cell} width={cell} height={cell} fill={`rgba(230,220,204,${.08 + .8 * (value - lo) / (hi - lo)})`} stroke={selected ? '#fff' : '#151515'} strokeWidth={selected ? 3 : 1} />{omitted && <path d={`M${50 + j * cell + 2} ${45 + i * cell + 2}l${cell - 4} ${cell - 4}m0 ${-cell + 4}l${-cell + 4} ${cell - 4}`} stroke={COLORS.difference} strokeWidth="2" />}</g>;
  }))}<path d={`M${50 + n * cell} 45V425M50 ${45 + n * cell}H430`} stroke={COLORS.P} strokeWidth="2" /><text x={50 + n * cell / 2} y="32" textAnchor="middle">X</text><text x={50 + (n + count) * cell / 2} y="32" textAnchor="middle">Y</text><text x="28" y={45 + n * cell / 2} textAnchor="middle">X</text><text x="28" y={45 + (n + count) * cell / 2} textAnchor="middle">Y</text></Svg><p>Block signs: XX + YY − XY − YX.</p><p>Current cell {s.selected[0].id} / {s.selected[1].id} = {fmt(s.pairValue, 9)}. {exclude ? 'Only within-group index diagonals are crossed; equal-valued off-diagonal pairs remain.' : 'Every diagonal and repeated-coordinate pair is included.'}</p>{table && <Table caption="Every indexed cell, with keyboard-selectable pair correspondence" headers={['Row / column', ...s.observations.map(r => r.id)]} rows={s.observations.map((row, i) => [row.id, ...s.gram[i].map((value, j) => onCell ? <button key={j} className="fd-cell" aria-label={`Select ${row.id} and ${s.observations[j].id}: ${fmt(value)}`} aria-pressed={s.pair[0] === i && s.pair[1] === j} onClick={() => onCell([row.id, s.observations[j].id])}>{fmt(value, 4)}</button> : fmt(value, 4))])} />}</>;
}

export function GaussianPair() {
  const [state, update, reset] = useStudy('kernel');
  const s = kernelReading(state);
  const selected = s.selected[0].value;
  const points = curve(-3, 3, x => kernel(selected, x, state.kind, state.sigma));
  const lo = state.kind === 'rbf' ? 0 : Math.min(0, ...points.map(p => p[1]));
  const hi = state.kind === 'rbf' ? 1.1 : Math.max(1, ...points.map(p => p[1])) * 1.1;
  return <Figure id="D28"><p>This pair, sample and bandwidth state is shared with the following matrix, norm and witness views.</p><SamplePositions s={s} /><Plot label="The selected first point's kernel profile evaluated at the selected second point" xDomain={[-3, 3]} yDomain={[lo, hi]} xLabel="second-point coordinate" yLabel="similarity" series={[{ points, color: COLORS.difference }]}>{({ xy }) => <Dot x={xy(s.selected[1].value, s.pairValue)[0]} y={xy(s.selected[1].value, s.pairValue)[1]} role={s.selected[1].role} selected />}</Plot><Ops steps={state.kind === 'rbf' ? [{ label: 'Actual separation', value: fmt(s.distance) }, { label: 'Squared distance divided byσ²', value: fmt((s.distance / state.sigma) ** 2) }, { label: 'Exponential of minus half that value', value: fmt(s.pairValue, 9) }] : [{ label: kernelOptions.find(v => v[0] === state.kind)[1], value: `${s.selected[0].id} / ${s.selected[1].id} → ${fmt(s.pairValue)}` }]} /><Controls reset={state.reset} onReset={reset}><PairSelectors s={s} update={update} /><Choice label="Kernel formula" value={state.kind} options={kernelOptions} onChange={kind => update({ kind })} /><Bandwidth state={state} update={update} /></Controls></Figure>;
}

export function GramAnatomy() {
  const [state, update, reset] = useStudy('kernel');
  const s = kernelReading(state);
  return <Figure id="D29"><SamplePositions s={s} /><GramPicture s={s} onCell={pair => update({ pair })} /><Controls reset={state.reset} onReset={reset}><SampleEditors state={state} update={update} /><PairSelectors s={s} update={update} /></Controls></Figure>;
}

export function ReproducingOperation() {
  return <Figure id="D30"><p>In the finite feature example, coefficient vectors are actual two-dimensional objects.</p><Plot label="Coefficient v=(0,1) and point featureφ(−1)=(−1,1) have dot product1" xDomain={[-1.5, 1.5]} yDomain={[-.3, 1.5]} xLabel="first coefficient" yLabel="second coefficient" equalUnits>{({ xy }) => <><Arrow x1={xy(0, 0)[0]} y1={xy(0, 0)[1]} x2={xy(0, 1)[0]} y2={xy(0, 1)[1]} color={COLORS.P} /><Arrow x1={xy(0, 0)[0]} y1={xy(0, 0)[1]} x2={xy(-1, 1)[0]} y2={xy(-1, 1)[1]} color={COLORS.Q} /><line x1={xy(-1, 1)[0]} x2={xy(0, 1)[0]} y1={xy(-1, 1)[1]} y2={xy(0, 1)[1]} stroke="#bbb" strokeDasharray="4 4" /></>}</Plot><Table caption="Coefficient correspondence makes evaluation an inner product" headers={['Function', 'Coefficient vector']} rows={[[ 'gᵥ', 'v=(0,1)'], ['k(−1,·)', 'φ(−1)=(−1,1)']]} /><Ops steps={[{ label: 'Finite coefficient inner product', value: '(0,1)·(−1,1)=1=gᵥ(−1)' }, { label: 'The corresponding RKHS operation', value: '〈g, k(x,·)〉H = g(x)' }]} /><p>The symbolic Hilbert-space operation does not claim that Gaussian feature functions live in this plane.</p></Figure>;
}

export function NormExpansion() {
  const [state] = useStudy('kernel');
  const s = kernelReading(state);
  const max = Math.max(1, s.withinX, s.withinY, Math.abs(2 * s.cross));
  return <Figure id="D31"><GramPicture s={s} table={false} /><Table caption="Norm expansion uses every pair with its own group denominator" headers={['Block', 'Ordered pair count', 'Mean', 'Signed norm term']} rows={[['XX', s.x.length ** 2, fmt(s.withinX), fmt(s.withinX)], ['YY', s.y.length ** 2, fmt(s.withinY), fmt(s.withinY)], ['XY', s.x.length * s.y.length, fmt(s.cross), fmt(-2 * s.cross)]]} /><Bars minimum={-max} maximum={max} label="Signed expansion terms" rows={[{ label: 'XX/n²', value: s.withinX, role: 'P' }, { label: 'YY/m²', value: s.withinY, role: 'Q' }, { label: '−2XY/(nm)', value: -2 * s.cross, color: COLORS.difference }]} /><p aria-live="polite">B={fmt(s.biasedSquared, 9)}; norm√B={fmt(s.mmd, 9)}. This is the exact squared norm between the two current equal-weight empirical laws.</p></Figure>;
}

export function WitnessQuery() {
  const [state, update, reset] = useStudy('kernel');
  const s = kernelReading(state);
  const values = s.witness.map(r => r.value);
  const bound = Math.max(.2, ...values.map(Math.abs)) * 1.15;
  return <Figure id="D32"><Plot label="Signed kernel witness over the declared query interval, with the current selected query" xDomain={[-3, 3]} yDomain={[-bound, bound]} xLabel="query t" yLabel="w(t)" series={[{ points: s.witness.map(r => [r.position, r.value]), color: COLORS.difference }]}>{({ xy }) => <><line x1={xy(state.query, 0)[0]} x2={xy(state.query, 0)[0]} y1={xy(state.query, 0)[1]} y2={xy(state.query, s.queryValue)[1]} stroke="#ddd" /><Dot x={xy(state.query, s.queryValue)[0]} y={xy(state.query, s.queryValue)[1]} role="Q" selected /></>}</Plot><SamplePositions s={s} /><Table caption="Every current query contribution" headers={['Observation', 'Coordinate', 'k(observation,t)', 'Divisor', 'Signed contribution']} rows={[...s.queryX.map((v, i) => [`X${i}`, s.x[i], fmt(v), s.x.length, fmt(v / s.x.length)]), ...s.queryY.map((v, i) => [`Y${i}`, s.y[i], fmt(v), s.y.length, fmt(-v / s.y.length)])]} /><Bars minimum={-Math.max(1, Math.abs(s.queryMeanX), Math.abs(s.queryMeanY))} maximum={Math.max(1, Math.abs(s.queryMeanX), Math.abs(s.queryMeanY))} label="Current query averages and difference" rows={[{ label: 'X average', value: s.queryMeanX, role: 'P' }, { label: 'Y average', value: s.queryMeanY, role: 'Q' }, { label: 'w(t)=X average−Y average', value: s.queryValue, color: COLORS.difference }]} /><p aria-live="polite">At t={fmt(state.query)}, w={fmt(s.queryValue, 9)}. The empirical witness expectation gap is{fmt(s.witnessGap, 9)}, equal to B={fmt(s.biasedSquared, 9)}.</p>{s.biasedSquared === 0 ? <p>The witness is zero; normalization by√B is unavailable at equality.</p> : <p>Dividing the witness by√B={fmt(s.mmd)} gives the unit-norm maximizing critic.</p>}<Controls reset={state.reset} onReset={reset}><Range label="Witness query t" min={-3} max={3} step={.05} value={state.query} onChange={query => update({ query })} /><Edit label="Exact witness query" value={state.query} parse={t => numeric(t, -3, 3, 'Query')} onValid={query => update({ query })} /><button onClick={() => update({ y: [...state.x] })}>Use the same list for X and Y</button></Controls></Figure>;
}

export function MomentCollision() {
  const base = { x: [-1, -1, 1, 1], y: [-Math.SQRT2, 0, 0, Math.SQRT2], sigma: 1, query: 0, pair: ['X0', 'Y0'] };
  const finite = kernelReading({ ...base, kind: 'quadratic' });
  const gaussian = kernelReading({ ...base, kind: 'rbf' });
  return <Figure id="D33"><Plot label="Both laws map to the exact feature-mean coordinate(0,1) under first and second moments" xDomain={[-1, 1]} yDomain={[0, 2]} xLabel="mean x" yLabel="mean x²" equalUnits>{({ xy }) => <><Dot x={xy(0, 1)[0]} y={xy(0, 1)[1]} role="P" size={9} /><Dot x={xy(0, 1)[0]} y={xy(0, 1)[1]} role="Q" size={4} /></>}</Plot><p>The nested marks are coincident, not separated for appearance. √2 coordinates are computed at machine precision.</p><Plot label="The Gaussian witness distinguishes the same moment-matched laws" xDomain={[-3, 3]} yDomain={[-.2, .2]} xLabel="query t" yLabel="Gaussian witness" series={[{ points: gaussian.witness.map(r => [r.position, r.value]), color: COLORS.difference }]} /><Table caption="Two observer classes answer different questions" headers={['Kernel', 'Empirical squared norm']} rows={[[ 'xy+x²y²', fmt(finite.biasedSquared, 9)], ['Gaussianσ=1', fmt(gaussian.biasedSquared, 9)]]} /><p>The finite-feature zero is moment blindness; characteristic population separation does not promise small-sample test power.</p></Figure>;
}

export function KernelLocality() {
  const [state, update, reset] = useStudy('kernel');
  const defaults = [.5, 1, 3].map(sigma => ({ sigma, s: kernelReading({ x: [-2, -2, 2, 2], y: [-1, -1, 1, 1], sigma, kind: 'rbf', query: 0, pair: ['X0', 'Y0'] }) }));
  const s = kernelReading(state);
  return <Figure id="D34"><Plot label="Three Gaussian bandwidths change profile width while self-similarity stays1" xDomain={[-3, 3]} yDomain={[0, 1.1]} xLabel="distance from the centre" yLabel="similarity" series={defaults.map((r, i) => ({ points: curve(-3, 3, x => kernel(0, x, 'rbf', r.sigma)), color: [COLORS.P, COLORS.Q, COLORS.difference][i], dashed: i === 2 }))} /><Table caption="Fixed default laws, different bandwidths" headers={['σ', 'Similarity at distance1', 'B for outer versus inner lists']} rows={defaults.map(({ sigma, s }) => [sigma, fmt(kernel(0, 1, 'rbf', sigma)), fmt(s.biasedSquared, 9)])} /><p>Amberσ=.5; blueσ=1; dashed violetσ=3. Current shared state: {kernelOptions.find(k => k[0] === state.kind)[1]}, B={fmt(s.biasedSquared, 9)}.</p><Controls reset={state.reset} onReset={reset}><Bandwidth state={state} update={update} label="Shared locality bandwidth σ" /><button onClick={() => update({ kind: 'rbf' })}>Use Gaussian similarity</button></Controls></Figure>;
}

export function KernelAtoms() {
  const [state, update, reset] = useStudy('atomLate');
  const s = movingAtomState(state.h, state.sigma);
  const similarity = kernel(0, state.h, 'rbf', state.sigma);
  return <Figure id="D35"><p>This later atom experiment has independent state and reset from the earlier support experiment.</p><AtomLanes h={state.h} /><Svg label="Two self pairs contribute1 each; the two cross pairs contribute the same Gaussian similarity" height={270}>{[['P', 100], ['Q', 380]].map(([role, x]) => <g key={role}><Dot x={x} y={65} role={role} size={8} /><path d={`M${x - 8} 55q-45 -55 -45 0q0 40 42 20`} stroke={COLORS[role]} fill="none" strokeWidth="2" /><text x={x} y="112" textAnchor="middle">1</text></g>)}<Arrow x1={115} y1={150} x2={365} y2={150} color={COLORS.difference} /><Arrow x1={365} y1={205} x2={115} y2={205} color={COLORS.difference} /><text x="240" y="255" textAnchor="middle">two cross terms</text></Svg><Ops steps={[{ label: 'Each cross similarity', value: fmt(similarity, 10) }, { label: 'Stable squared norm', value: `−2 expm1(−h²/(2σ²)) = ${fmt(s.mmdSquared, 10)}` }, { label: 'Norm', value: fmt(s.mmd, 10) }]} /><Controls reset={state.reset} onReset={reset}><Range label="Late atom displacement h" min={0} max={3} value={state.h} onChange={h => update({ h })} /><Edit label="Exact late h" value={state.h} parse={text => numeric(text, 0, 3, 'Displacement')} onValid={h => update({ h })} /><Range label="Late atom bandwidth σ" min={.2} max={3} step={.1} value={state.sigma} onChange={sigma => update({ sigma })} /><Edit label="Exact late bandwidth" value={state.sigma} parse={text => numeric(text, .2, 3, 'Bandwidth')} onValid={sigma => update({ sigma })} /><button onClick={() => update({ h: 0 })}>Set later h exactly zero</button></Controls></Figure>;
}
