import { useEffect, useId, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { SCALING_TOY as TOY, SCALING_COLORS as C, RELEASED_LAW, lossParts, optimalAllocation, powerCurve, lossContour, effectiveAmount, repeatedLoss, lifetimeAllocation, hardwareBudget, metricValues, sensitivityRows, logGrid } from '../../data/scaling-laws-models.js';
import './scaling-laws-flow.css';

const number = (x, digits = 4) => x === null ? 'infeasible' : flowNumber(x, digits);
const count = x => x >= 1e12 ? `${number(x / 1e12, 3)}T` : x >= 1e9 ? `${number(x / 1e9, 3)}B` : x >= 1e6 ? `${number(x / 1e6, 3)}M` : number(x, 2);
function Figure({ name, label, children, caption }) { return <figure className="scaling-figure" data-scaling-figure={name} aria-label={label}>{children}<figcaption>{caption}</figcaption></figure>; }
function Scroll({ label, children, scrollRef }) { return <div ref={scrollRef} className="scaling-scroll" role="region" tabIndex={0} aria-label={label}>{children}</div>; }
function Legend({ entries }) { return <div className="scaling-legend">{entries.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>; }
function Plot({ series = [], points = [], xDomain, yDomain, xTicks, yTicks, xLabel, yLabel, logX = false, logY = false, label, children }) {
  const clip = `scaling-${useId().replace(/:/g, '')}`;
  const frame = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(640);
  useEffect(() => {
    const update = () => {
      const factor = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      setCanvasWidth(Math.max(350, Math.min(640, frame.current.clientWidth / factor)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(frame.current); update();
    return () => observer.disconnect();
  }, []);
  const scale = (value, domain, log, start, end) => start + (end - start) * ((log ? Math.log(value) : value) - (log ? Math.log(domain[0]) : domain[0])) / ((log ? Math.log(domain[1]) : domain[1]) - (log ? Math.log(domain[0]) : domain[0]));
  const right = canvasWidth - 22;
  const sx = x => scale(x, xDomain, logX, 64, right), sy = y => scale(y, yDomain, logY, 286, 30);
  return <Scroll label={label} scrollRef={frame}><svg className="scaling-plot scaling-responsive-plot" viewBox={`0 0 ${canvasWidth} 365`} role="img" aria-label={label}>
    <defs><clipPath id={clip}><rect x="58" y="24" width={right - 52} height="269" /></clipPath></defs>
    <g className="scaling-grid">{xTicks.map(x => <line key={x} x1={sx(x)} x2={sx(x)} y1="30" y2="286" />)}{yTicks.map(y => <line key={y} x1="64" x2={right} y1={sy(y)} y2={sy(y)} />)}</g>
    <path d={`M64 30V286H${right}`} fill="none" stroke="#aaa" />
    <g fill="#ccc">{xTicks.map(x => <text key={x} x={sx(x)} y="308" textAnchor="middle">{number(x, 3)}</text>)}{yTicks.map(y => <text key={y} x="54" y={sy(y) + 5} textAnchor="end">{number(y, 3)}</text>)}<text x={(64 + right) / 2} y="340" textAnchor="middle">{xLabel}</text>{logX && <text x={(64 + right) / 2} y="359" textAnchor="middle">log axis</text>}<text x="64" y="17">{yLabel}{logY ? ' · log axis' : ''}</text></g>
    <g clipPath={`url(#${clip})`}>{series.map(({ data, color, dashed, width = 2.5, name }, index) => <path key={index} d={data.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && (!logY || y > 0)).map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)},${sy(y)}`).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? '7 5' : undefined}><title>{name}</title></path>)}{points.map((point, index) => <g key={index}><title>{point.label}</title>{point.diamond ? <path d={`M${sx(point.x)} ${sy(point.y) - 6}l6 6-6 6-6-6z`} fill="#111" stroke={point.color} strokeWidth="2" /> : <circle cx={sx(point.x)} cy={sy(point.y)} r={point.selected ? 6 : 4} fill={point.color || '#fff'} stroke={point.selected ? '#fff' : '#111'} strokeWidth="2" />}</g>)}{children?.({ sx, sy })}</g>
  </svg></Scroll>;
}
function Parts({ n, d, law = TOY, weighted = false }) {
  const p = lossParts(n, d, law);
  const values = weighted ? [[C.parameter, 'α × parameter term', law.alpha * p.parameter], [C.data, 'β × data term', law.beta * p.data]] : [[C.floor, 'floor E', p.floor], [C.parameter, 'parameter term', p.parameter], [C.data, 'data term', p.data]];
  const maximum = Math.max(...values.map(v => v[2]), 1);
  return <div className="scaling-bars">{values.map(([color, label, value]) => <div className="scaling-bar-row" key={label}><span style={{ color }}>{label}</span><div className="scaling-bar-track"><i style={{ width: `${value / maximum * 100}%`, background: color }} /></div><output>{number(value, 6)}</output></div>)}<p>{weighted ? 'Common scale: weighted loss change per proportional resource change.' : `Sum = ${number(p.total, 6)} nats (constructed prediction).`}</p></div>;
}

export function BudgetLab() {
  const [n, setN] = useState(100);
  const d = 1000 / n;
  return <FlowLab label="Keep training arithmetic fixed while choosing model size">
    <Figure name="budget" label="Equal-area parameter by token rectangles" caption="Constructed budget C=6×10¹⁸ FLOPs. Both outlined rectangles use the same linear axes. Their common area is ND=10¹⁸ parameter-token products; six times the area is training FLOPs.">
      <Plot label="Common parameter and token axes" xDomain={[0, 1000]} yDomain={[0, 10]} xTicks={[0, 500, 1000]} yTicks={[0, 5, 10]} xLabel="N · million parameters" yLabel="D · billion presentations">{({ sx, sy }) => <><rect x={sx(0)} y={sy(1)} width={sx(1000) - sx(0)} height={sy(0) - sy(1)} fill={C.compute} fillOpacity=".13" stroke={C.compute} strokeWidth="2" /><rect x={sx(0)} y={sy(d)} width={sx(n) - sx(0)} height={sy(0) - sy(d)} fill={C.data} fillOpacity=".16" stroke="#fff" strokeWidth="2" /></>}</Plot><Legend entries={[[C.data, `selected: ${n}M × ${number(d, 3)}B`], [C.compute, 'reference: 1000M × 1B']]} />
    </Figure>
    <FlowControls><FlowSlider name="Model size N (million)" min={100} max={1000} step={50} value={n} onChange={setN} /><button type="button" onClick={() => setN(100)}>Reset budget split</button></FlowControls>
    <FlowReadout>{n}M parameters × {number(d, 4)}B presentations × 6 = 6×10¹⁸ FLOPs. The selected rectangle {n === 1000 ? 'coincides with the reference; the designs are now identical.' : 'changes shape while its area stays fixed.'}</FlowReadout>
  </FlowLab>;
}

export function PowerLawLab() {
  const [alpha, setAlpha] = useState(.5), [floor, setFloor] = useState(.5);
  const xs = logGrid(1, 8);
  const series = [{ name: 'excess loss', color: C.parameter, data: xs.map(x => [x, powerCurve(x, alpha, floor).excess]) }, { name: 'full loss with floor', color: C.floor, data: xs.map(x => [x, powerCurve(x, alpha, floor).total]) }];
  return <FlowLab label="Inspect a power law on linear and logarithmic axes">
    <Figure name="power-law" label="One excess-loss curve on two axis choices" caption="Constructed A=1. Amber is excess loss; grey includes the fitted floor. White-outlined points trace x=2 and x=4, a doubling. The two views contain the same quantities.">
      <div className="scaling-plots-pair">{[false, true].map(log => <div key={String(log)}><p>{log ? 'Log-log view' : 'Linear view'}</p><Plot label={log ? 'Log-log excess and full loss' : 'Linear excess and full loss'} series={series} points={[2, 4].map(x => ({ x, y: x ** -alpha, color: C.parameter, selected: true }))} xDomain={[1, 8]} yDomain={log ? [.1, 2] : [0, 2]} xTicks={[1, 2, 4, 8]} yTicks={log ? [.125, .25, .5, 1, 2] : [0, .5, 1, 1.5, 2]} xLabel="resource x" yLabel="loss contribution" logX={log} logY={log} /></div>)}</div>
    </Figure><FlowControls><FlowSlider name="Power exponent α" value={alpha} onChange={setAlpha} min={0} max={1} step={.1} /><FlowSlider name="Fitted floor E" value={floor} onChange={setFloor} min={0} max={1} step={.1} /><button type="button" onClick={() => { setAlpha(.5); setFloor(.5); }}>Reset power law</button></FlowControls>
    <FlowReadout>Doubling x multiplies excess loss by 2⁻ᵅ = {number(2 ** -alpha, 6)}. {alpha === 0 ? 'The flat curve is the no-improvement null.' : `At x=2: ${number(2 ** -alpha, 6)}; at x=4: ${number(4 ** -alpha, 6)}.`} {floor === 0 ? 'Full loss equals excess loss.' : 'Full loss bends toward E on log axes.'}</FlowReadout>
  </FlowLab>;
}

export function LossDecompositionLab() {
  const [n, setN] = useState(500), [d, setD] = useState(2);
  return <FlowLab label="Separate parameter and data contributions">
    <Figure name="decomposition" label="Three additive loss contributions" caption="Constructed law E=1, A=10,000, B=20,000, α=β=0.5 with literal counts. Bars share a scale and show the actual additive terms."><Parts n={n * 1e6} d={d * 1e9} /></Figure>
    <FlowControls><FlowSlider name="Parameters (million)" value={n} onChange={setN} min={100} max={2000} step={100} /><FlowSlider name="Presentations (billion)" value={d} onChange={setD} min={.5} max={10} step={.5} /><button type="button" onClick={() => { setN(500); setD(2); }}>Reset loss terms</button></FlowControls>
    <FlowReadout>Changing N changes the amber term; changing D changes the blue term. The grey floor stays at 1. This view varies resources independently, without a fixed compute budget.</FlowReadout>
  </FlowLab>;
}

export function LossSurfaceLab() {
  const [n, setN] = useState(500);
  const d = 1000 / n;
  const ns = logGrid(100, 2000, 161);
  const series = [1.6, 1.9, 2.2, 2.8].map(target => ({ name: `loss ${target}`, color: '#999', dashed: true, data: ns.map(x => [x, lossContour(x * 1e6, target) / 1e9]).filter(([, y]) => y > 0) }));
  series.push({ name: 'compute budget', color: C.compute, data: ns.map(x => [x, 1000 / x]) });
  return <FlowLab label="Follow a compute constraint across loss contours">
    <Figure name="surface" label="Loss contours and a fixed-compute curve" caption="Grey curves are equal-loss contours (1.6, 1.9, 2.2, 2.8); farther upper-right means lower loss. Violet is the fixed 6×10¹⁸ FLOP budget. The white point is the chosen allocation.">
      <Plot label="Parameter-token loss surface in log coordinates" series={series} points={[{ x: n, y: d, color: C.compute, selected: true }]} xDomain={[100, 2000]} yDomain={[.2, 20]} xTicks={[100, 500, 1000, 2000]} yTicks={[.2, 1, 2, 10, 20]} xLabel="N · million" yLabel="D · billion" logX logY>{({ sx, sy }) => [1.6, 1.9, 2.2, 2.8].map(target => { const x = target === 2.8 ? 250 : 1400; return <text key={target} x={sx(x)} y={sy(lossContour(x * 1e6, target) / 1e9) - 7} textAnchor="middle" stroke="#111" strokeWidth="3" paintOrder="stroke">L={target}</text>; })}</Plot>
      <div className="scaling-cross-section"><p>Numeric slice along the same budget:</p>{[100, 500, 1000].map(x => <span key={x}>{x}M / {1000 / x}B → L={number(lossParts(x * 1e6, 1e12 / x).total, 4)}</span>)}</div>
    </Figure><FlowControls><FlowSlider name="Allocation N (million)" min={100} max={2000} step={100} value={n} onChange={setN} /><button type="button" onClick={() => setN(500)}>Reset surface point</button></FlowControls>
    <FlowReadout>N={n}M, D={number(d, 4)}B; predicted loss {number(lossParts(n * 1e6, d * 1e9).total, 6)}. The point moves along the budget, not along one equal-loss contour.</FlowReadout>
  </FlowLab>;
}

export function AllocationLab() {
  const [budget, setBudget] = useState(1), [n, setN] = useState(500);
  const compute = 6e18 * budget, optimal = optimalAllocation(compute);
  const ns = logGrid(100, 2000), term = x => lossParts(x * 1e6, compute / (6 * x * 1e6));
  return <FlowLab label="Locate the loss minimum along one budget">
    <Figure name="allocation" label="Opposing resource contributions form a minimum" caption="Constructed coefficients. Full loss includes the grey floor 1; the amber and blue curves show their individual contributions. White outline marks the analytic minimum, rose the candidate.">
      <Plot label="Loss terms versus parameter allocation" series={[[C.parameter, 'parameter'], [C.data, 'data'], ['#ddd', 'total']].map(([color, key]) => ({ color, name: key, data: ns.map(x => [x, term(x)[key]]) }))} points={[{ x: optimal.n / 1e6, y: optimal.total, color: '#aaa', selected: true }, { x: n, y: term(n).total, color: C.heldout }]} xDomain={[100, 2000]} yDomain={[0, 3]} xTicks={[100, 500, 1000, 2000]} yTicks={[0, 1, 2, 3]} xLabel="N · million parameters" yLabel="nats" logX /><Legend entries={[[C.parameter, 'parameter term decreases'], [C.data, 'data term increases'], ['#ddd', 'total + floor']]} />
    </Figure><FlowControls><FlowSlider name="Compute multiple" min={.5} max={4} step={.5} value={budget} onChange={setBudget} /><FlowSlider name="Candidate N (million)" min={100} max={2000} step={100} value={n} onChange={setN} /><button type="button" onClick={() => { setBudget(1); setN(500); }}>Reset allocation</button></FlowControls>
    <FlowReadout>Minimum: N={count(optimal.n)}, D={count(optimal.d)}, loss {number(optimal.total, 6)}. Candidate loss {number(term(n).total, 6)}; D={count(compute / (6 * n * 1e6))}.</FlowReadout>
  </FlowLab>;
}

export function BalanceFigure() {
  return <Figure name="balance" label="Weighted marginal terms balance at the analytic optimum" caption="At N=500M,D=2B both weights are 0.5. Equal weighted bars mean a small proportional transfer of compute has zero first-order loss change."><Parts n={5e8} d={2e9} weighted /><p className="scaling-balance-equation"><span style={{ color: C.parameter }}>−0.223607</span> + <span style={{ color: C.data }}>0.223607</span> = 0</p></Figure>;
}

export function ExperimentMethodsFigure() {
  const horizon = [1, 2, 4];
  const curves = horizon.map((h, index) => ({ name: `planned horizon ${h}`, color: [C.parameter, C.data, C.compute][index], data: logGrid(.2, h).map(x => [x, 1.5 + (.5 + index * .12) / Math.sqrt(x) + .08 * (1 - x / h)]) }));
  const ns = logGrid(.25, 4);
  return <Figure name="methods" label="Three different experimental designs for compute allocation" caption="Schematic constructions, not measured paper points. Each panel shows the experiment's geometry: trajectories ending at planned horizons, minima within fixed-compute sweeps, or a two-resource grid supporting a surface fit.">
    <p>1 · Training trajectories: compare the lower envelope at each compute</p><Plot label="Training trajectories with separate planned horizons" series={curves} points={curves.map(curve => ({ x: curve.data.at(-1)[0], y: curve.data.at(-1)[1], color: curve.color, selected: true }))} xDomain={[.2, 4]} yDomain={[1.5, 3.4]} xTicks={[.2, 1, 2, 4]} yTicks={[1.5, 2, 2.5, 3]} xLabel="training compute · schematic units" yLabel="loss" />
    <div className="scaling-schedules">{horizon.map((h, index) => <div key={h}><span style={{ color: [C.parameter, C.data, C.compute][index] }}>horizon {h}</span><svg viewBox="0 0 200 55" role="img" aria-label={`Cosine learning rate declines to zero at horizon ${h}`}><path d={`M${Array.from({ length: 41 }, (_, i) => `${10 + 180 * i / 40},${45 - 35 * (1 + Math.cos(Math.PI * i / 40)) / 2}`).join(' L')}`} stroke={[C.parameter, C.data, C.compute][index]} fill="none" strokeWidth="2" /><path d="M10 10V45H190" stroke="#777" fill="none" /></svg><span>learning rate → zero at endpoint</span></div>)}</div>
    <p>2 · IsoFLOP sweeps: compare model sizes at each fixed compute</p><Plot label="U-shaped fixed-compute sweeps and their minima" series={[.5, 1, 2].map((c, i) => ({ name: `budget ${c}`, color: [C.parameter, C.data, C.compute][i], data: ns.map(x => [x, 1 + .4 / Math.sqrt(x) + .4 * Math.sqrt(x / c)]) }))} points={[.5, 1, 2].map(c => ({ x: Math.sqrt(c), y: 1 + .8 / c ** .25, color: '#aaa', selected: true }))} xDomain={[.25, 4]} yDomain={[1.4, 2.7]} xTicks={[.25, 1, 2, 4]} yTicks={[1.5, 2, 2.5]} xLabel="model size · schematic units" yLabel="loss" logX />
    <p>3 · Surface experiment: vary both model size and token budget</p><Plot label="Factorial resource grid for a joint fit" points={[1, 2, 4, 8].flatMap(n => [1, 2, 4, 8].map(d => ({ x: n, y: d, color: C.data })))} xDomain={[.8, 10]} yDomain={[.8, 10]} xTicks={[1, 2, 4, 8]} yTicks={[1, 2, 4, 8]} xLabel="N · schematic units" yLabel="D · schematic units" logX logY />
  </Figure>;
}

export function EmpiricalFitFigure() {
  const [result, setResult] = useState(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0), [selected, setSelected] = useState(5);
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setResult(null);
    fetch('/learn-code/scaling-laws/fit-results.json', { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('fit fetch'); return response.json(); }).then(data => {
      if (!Array.isArray(data.real_curve?.observations) || data.real_curve.observations.length !== 7) throw new Error('fit data');
      setResult(data.real_curve);
    }).catch(reason => { if (reason.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div className="scaling-data-state" role="status"><p>The released measurements and fitted predictions could not be loaded.</p><button type="button" onClick={() => setAttempt(attempt + 1)}>Retry fit data</button></div>;
  if (!result) return <p role="status">Loading the seven released observations and local fit…</p>;
  const [floor, amplitude, exponent] = result.parameters_E_A_beta;
  const rows = result.observations, row = rows[selected];
  const points = rows.map((item, index) => ({ x: +item.tokens / 1e9, y: +item.validation_nats, color: item.role === 'fit' ? C.data : C.heldout, diamond: item.role !== 'fit', selected: selected === index, label: `${item.run}: observed ${item.validation_nats}, ${item.role}` }));
  return <FlowLab label="Inspect real observed losses and held-out fit residuals">
    <Figure name="empirical" label="Seven real measurements with a fitted curve and held-out extrapolation" caption="Actual authors' released runs: N=2.81B, U=4B. Filled blue circles fit the curve; open rose diamonds are withheld. The grey curve is our local three-parameter prediction. A vertical line connects the selected prediction to its observed value.">
      <Plot label="Measured and fitted validation loss versus total presentations" series={[{ name: 'our descriptive fit', color: '#ddd', data: logGrid(4, 40).map(d => [d, floor + amplitude * (d / 4) ** -exponent]) }]} points={points} xDomain={[3, 42]} yDomain={[2.5, 3.4]} xTicks={[4, 8, 16, 24, 32, 40]} yTicks={[2.5, 2.7, 2.9, 3.1, 3.3]} xLabel="D · billion presentations" yLabel="observed / predicted nats">{({ sx, sy }) => <><line x1={sx(+row.tokens / 1e9)} x2={sx(+row.tokens / 1e9)} y1={sy(+row.validation_nats)} y2={sy(row.predicted)} stroke="#fff" strokeWidth="3" /><circle cx={sx(+row.tokens / 1e9)} cy={sy(row.predicted)} r="6" fill="none" stroke="#fff" strokeWidth="2" /></>}</Plot>
      <Legend entries={[[C.data, '● fit observations'], [C.heldout, '◇ withheld observations'], ['#ddd', 'predicted curve']]} />
      <div className="scaling-residual"><span>signed residual = predicted − observed</span><div className="scaling-residual-axis"><i style={{ left: `${50 + Math.min(0, row.residual) / .025 * 50}%`, width: `${Math.abs(row.residual) / .025 * 50}%`, background: row.role === 'fit' ? C.data : C.heldout }} /></div><span>−0.025 ← 0 → +0.025 nats</span></div>
    </Figure><FlowControls><FlowSlider name="Observation index" value={selected} onChange={setSelected} min={0} max={6} step={1} /><button type="button" onClick={() => setSelected(5)}>Select first held-out run</button></FlowControls>
    <FlowReadout>{row.run} ({row.role}): D={count(+row.tokens)}, observed {row.validation_nats}, predicted {number(row.predicted, 6)}, residual {number(row.residual, 6)} nats. Held-out MAE {number(result.heldout_mae, 6)}. These values are loaded from the source-bound native fit.</FlowReadout>
  </FlowLab>;
}

export function IdentifiabilityLab() {
  const [fixed, setFixed] = useState(false), [floor, setFloor] = useState(1);
  const rows = sensitivityRows(fixed, floor), selected = fixed ? rows : [0, 7, 14, 21, 28, 35].map(i => rows[i]);
  return <FlowLab label="Inspect what a resource experiment can identify">
    <Figure name="identifiability" label="Experimental design and parameter-sensitivity columns" caption="Synthetic units and known law. Each dot is an experiment; the table samples its sensitivity vectors. Bars share a signed scale: positive extends right of centre, negative left. With N fixed at 1, E and A columns are constant and the α column is zero.">
      <Plot label="Full factorial design versus fixed model size" points={rows.map(row => ({ x: row.n, y: row.d, color: fixed ? C.parameter : C.data }))} xDomain={[.7, 45]} yDomain={[.7, 45]} xTicks={[1, 2, 4, 8, 16, 32]} yTicks={[1, 2, 4, 8, 16, 32]} xLabel="N · synthetic units" yLabel="D · synthetic units" logX logY />
      <Scroll label="Rows of the analytic Jacobian with columns for log parameters"><table className="scaling-table scaling-sensitivities"><caption>Sensitivity to log parameters; {fixed ? 'all six experiments' : 'six representative rows of 36'}</caption><thead><tr><th>N,D</th>{['E', 'A', 'B', 'α', 'β'].map(x => <th key={x}>ln {x}</th>)}<th>loss</th></tr></thead><tbody>{selected.map(row => <tr key={`${row.n}-${row.d}`}><th>{row.n},{row.d}</th>{row.jacobian.map((value, i) => <td key={i}><span>{number(value, 3)}</span><div className="scaling-sensitivity"><i style={{ left: `${50 + Math.min(0, value) / 3 * 50}%`, width: `${Math.abs(value) / 3 * 50}%`, background: [C.floor, C.parameter, C.data, C.parameter, C.data][i] }} /></div></td>)}<td>{number(row.loss, 3)}</td></tr>)}</tbody></table></Scroll>
    </Figure><FlowControls><FlowChoice label="Experimental design" value={fixed} onChange={setFixed} options={[[false, 'Vary N and D'], [true, 'Hold N = 1']]} /><FlowSlider name="Alternative floor E" value={floor} onChange={setFloor} min={.5} max={2.5} step={.5} /><button type="button" onClick={() => { setFixed(false); setFloor(1); }}>Reset design</button></FlowControls>
    <FlowReadout>E={floor}, A=3−E={3 - floor}, B=3, α=0.5, β=0.25. {fixed ? 'Changing E and A together leaves every prediction exactly unchanged. Rank is 3, so five coefficients cannot be separately identified.' : 'Changing E and A together preserves the N=1 row but changes larger-N predictions. The full design has rank 5 at these positive coefficients.'}</FlowReadout>
  </FlowLab>;
}

export function RepeatedTokensFigure() {
  const tokens = [['Alice', C.parameter], ['saw', C.data], ['the', C.compute], ['Rabbit', C.heldout]];
  return <Figure name="repeated-tokens" label="The same four token positions recur in successive passes" caption="Literal identity sketch: four unique positions, four passes, sixteen presentations. Each position keeps its colour across passes. The band below each pass shows its incremental effective contribution under the released smooth formula, in units where U=4.">
    <div className="scaling-token-passes">{[1, 2, 3, 4].map(pass => {
      const effective = effectiveAmount(4, pass * 4, RELEASED_LAW.dataReuse);
      const previous = pass === 1 ? 0 : effectiveAmount(4, (pass - 1) * 4, RELEASED_LAW.dataReuse);
      return <div key={pass}><span>pass {pass}</span><div className="scaling-token-row">{tokens.map(([word, color], i) => <span className="scaling-token" style={{ color }} key={word}><small>position {i}</small>{word}</span>)}</div><div className="scaling-pass-weight"><i style={{ width: `${(effective - previous) / 4 * 100}%` }} /></div><span>+{number(effective - previous, 3)} effective; cumulative {number(effective, 3)}</span></div>;
    })}</div>
  </Figure>;
}

export function EffectiveDataLab() {
  const [passes, setPasses] = useState(4), [scale, setScale] = useState(RELEASED_LAW.dataReuse), [n, setN] = useState(6.34);
  const d = 4 * passes, effective = effectiveAmount(4, d, scale);
  const repeated = repeatedLoss(n * 1e9, 242e9, 25e9);
  return <FlowLab label="Inspect smooth saturation of effective data and excess parameters">
    <Figure name="effective-resources" label="Repeated presentations and parameter excess saturate smoothly" caption="Upper plot: U=4B, with an editable data-reuse scale. The dotted diagonal counts every presentation as new; the blue curve discounts repeats. Lower plot: the authors' published parameter model at U=25B, separate from the editable upper example.">
      <Plot label="Presented versus effective tokens" series={[{ color: '#888', dashed: true, name: 'every presentation distinct', data: [[4, 4], [80, 80]] }, { color: C.data, name: 'effective data', data: Array.from({ length: 77 }, (_, i) => [4 + i, effectiveAmount(4, 4 + i, scale)]) }]} points={[{ x: d, y: effective, color: C.data, selected: true }]} xDomain={[0, 80]} yDomain={[0, 80]} xTicks={[0, 4, 20, 40, 60, 80]} yTicks={[0, 20, 40, 60, 80]} xLabel="D · billion presentations" yLabel="effective tokens · billion" />
      <p>U=4B · D={d}B · extra passes R={passes - 1} · D_eff={number(effective, 6)}B · asymptote {number(4 * (1 + scale), 6)}B</p>
      <Plot label="Actual versus effective model parameters in released formula" series={[{ color: '#888', dashed: true, name: 'actual parameters', data: [[.1, .1], [20, 20]] }, { color: C.parameter, name: 'effective parameters', data: logGrid(.1, 20).map(x => [x, repeatedLoss(x * 1e9, 242e9, 25e9).effectiveN / 1e9]) }]} points={[{ x: n, y: repeated.effectiveN / 1e9, color: C.parameter, selected: true }]} xDomain={[0, 20]} yDomain={[0, 20]} xTicks={[0, 5, 10, 15, 20]} yTicks={[0, 5, 10, 15, 20]} xLabel="actual N · billion parameters" yLabel="effective N · billion" />
    </Figure><FlowControls><FlowSlider name="Corpus passes" value={passes} onChange={setPasses} min={1} max={20} step={1} /><FlowChoice label="Data reuse scale R*" value={scale} onChange={setScale} options={[[RELEASED_LAW.dataReuse, 'Released 15.387756'], [2, 'Faster saturation: 2'], [30, 'Slower saturation: 30']]} /><FlowSlider name="Actual N (billion)" value={n} onChange={setN} min={.5} max={20} step={.01} /><button type="button" onClick={() => { setPasses(4); setScale(RELEASED_LAW.dataReuse); setN(6.34); }}>Reset effective resources</button></FlowControls>
    <FlowReadout>{passes === 1 ? 'One pass: D_eff=U exactly, with no repetition discount.' : `Extra presentations still help: current marginal effective fraction exp(−R/R*)=${number(Math.exp(-(passes - 1) / scale), 6)}.`} In the separate U=25B,D=242B published example, N={number(n, 2)}B gives N_eff={number(repeated.effectiveN / 1e9, 6)}B and fitted loss {number(repeated.total, 9)}.</FlowReadout>
  </FlowLab>;
}

export function LifetimeLab() {
  const [demand, setDemand] = useState(1e10), [target, setTarget] = useState(2), [candidate, setCandidate] = useState(100);
  const training = lifetimeAllocation(target, 0), serving = lifetimeAllocation(target, demand);
  const required = lossContour(candidate * 1e6, target);
  const low = training.minimum / 1e6 * 1.005, high = Math.max(training.n * 3 / 1e6, 1000);
  const ns = logGrid(low, high, 161), ymax = Math.max(10, serving.d / 1e9 * 1.3, required === null ? 0 : required / 1e9 * 1.1);
  const maxCost = Math.max(training.training + 2 * training.n * demand, serving.total);
  return <FlowLab label="Minimize lifetime compute at the same target loss">
    <Figure name="lifetime" label="A fixed-loss curve and training versus serving costs" caption="Constructed law. Both marked allocations attain the same target loss. White outline marks the minimum with current demand; amber marks the training-only choice. The vertical feasibility boundary has no finite token solution.">
      <Plot label="Required tokens versus feasible model size at fixed loss" series={[{ color: C.compute, name: 'fixed-loss curve', data: ns.map(n => [n, lossContour(n * 1e6, target) / 1e9]) }]} points={[{ x: training.n / 1e6, y: training.d / 1e9, color: C.parameter }, { x: serving.n / 1e6, y: serving.d / 1e9, color: C.compute, selected: true }, ...(required ? [{ x: candidate, y: required / 1e9, color: C.heldout }] : [])]} xDomain={[0, high]} yDomain={[0, ymax]} xTicks={[0, 250, 500, 750, 1000].filter(x => x <= high)} yTicks={[0, ymax / 2, ymax]} xLabel="N · million parameters" yLabel="required D · billion">{({ sx }) => <line x1={sx(training.minimum / 1e6)} x2={sx(training.minimum / 1e6)} y1="30" y2="286" stroke={C.heldout} strokeDasharray="5 4" />}</Plot>
      <div className="scaling-costs">{[['Training-only choice', training], ['Current-demand optimum', serving]].map(([label, item]) => <div key={label}><span>{label} · {count(item.n)} / {count(item.d)}</span><div className="scaling-cost-track"><i style={{ background: C.parameter, width: `${item.training / maxCost * 100}%` }} /><i style={{ background: C.data, width: `${2 * item.n * demand / maxCost * 100}%` }} /></div><span>train {(item.training / 1e18).toFixed(3)} + serve {(2 * item.n * demand / 1e18).toFixed(3)} = {((item.training + 2 * item.n * demand) / 1e18).toFixed(3)} ×10¹⁸ FLOPs</span></div>)}</div><Legend entries={[[C.parameter, 'training arithmetic'], [C.data, 'serving arithmetic']]} />
    </Figure><FlowControls><FlowChoice label="Lifetime demand I" value={demand} onChange={setDemand} options={[[0, 'No serving'], [1e10, '10B tokens'], [1e12, '1T tokens']]} /><FlowSlider name="Target fitted loss" value={target} onChange={setTarget} min={1.6} max={2.4} step={.1} /><FlowSlider name="Candidate model (million)" value={candidate} onChange={setCandidate} min={100} max={1000} step={100} /><button type="button" onClick={() => { setDemand(1e10); setTarget(2); setCandidate(100); }}>Reset serving</button></FlowControls>
    <FlowReadout>Candidate N={candidate}M: {required ? `requires D=${count(required)} at loss ${target}.` : `infeasible; N must exceed ${count(training.minimum)} for a positive loss gap.`} {demand === 0 ? 'At zero demand the two optima coincide.' : `Lifetime optimum: N=${count(serving.n)}, D=${count(serving.d)}.`}</FlowReadout>
  </FlowLab>;
}

export function HardwareBudgetLab() {
  const [devices, setDevices] = useState(8), [utilization, setUtilization] = useState(.4), [hourly, setHourly] = useState(2);
  const value = hardwareBudget(6e18, devices, 1e14, utilization, hourly);
  return <FlowLab label="Carry arithmetic units through a planning estimate">
    <Figure name="hardware" label="FLOPs divided by effective rate gives seconds and hours" caption="Declared planning assumptions: C=6×10¹⁸ FLOPs, peak=10¹⁴ FLOP/s per device. Inputs are illustrative, not measured hardware specifications or live rental prices.">
      <div className="scaling-unit-equations"><p><span style={{ color: C.compute }}>6×10¹⁸ FLOPs</span><span>÷</span><span style={{ color: C.data }}>({devices} devices × 10¹⁴ FLOP/s/device × {utilization})</span></p><p>↓ effective rate {number(value.rate / 1e14, 3)}×10¹⁴ FLOP/s</p><p><strong>{number(value.seconds, 3)} seconds</strong><span>÷ 3600 seconds/hour →</span><strong>{number(value.hours, 4)} hours</strong></p><p>{devices} devices × {hourly} currency/device/hour × {number(value.hours, 4)} hours</p><p>↓ <strong>{number(value.cost, 4)} currency units</strong> for device rental alone</p></div>
      <div className="scaling-utilization"><span>Peak capacity</span><div><i style={{ width: `${utilization * 100}%`, background: C.data }} /></div><span>{number(utilization * 100, 0)}% utilized · same C</span></div>
    </Figure><FlowControls><FlowSlider name="Device count" value={devices} onChange={setDevices} min={1} max={32} step={1} /><FlowSlider name="Utilization fraction" value={utilization} onChange={setUtilization} min={.1} max={1} step={.1} /><FlowSlider name="Assumed cost per device-hour" value={hourly} onChange={setHourly} min={0} max={10} step={.5} /><button type="button" onClick={() => { setDevices(8); setUtilization(.4); setHourly(2); }}>Reset hardware assumptions</button></FlowControls>
    <FlowReadout>{number(value.hours, 4)} hours at these assumptions. Doubling devices halves time only if utilization is maintained; ideal device-hours and rental cost then stay constant. Utilization affects elapsed time without changing the 6×10¹⁸ theoretical FLOPs.</FlowReadout>
  </FlowLab>;
}

export function MetricLab() {
  const [p, setP] = useState(.8), [length, setLength] = useState(5), [threshold, setThreshold] = useState(.5);
  const values = metricValues(p, length, threshold), boundary = threshold ** (1 / length);
  const ps = Array.from({ length: 101 }, (_, i) => i / 100);
  return <FlowLab label="Compare a continuous probability with exact-match and threshold scores">
    <Figure name="metric" label="Same underlying quality with different scoring rules" caption="Constructed independent equal-probability tokens. Blue is p, amber pᵏ (continuous), and violet the threshold indicator (discontinuous). The distribution below describes a finite test of 100 independent items; its bars are probabilities of a score, not observed outcomes.">
      <Plot label="Metric transforms of the same per-token correctness probability" series={[{ color: C.data, name: 'token probability p', data: [[0, 0], [1, 1]] }, { color: C.parameter, name: 'exact-match p^k', data: ps.map(x => [x, x ** length]) }, { color: C.compute, name: 'thresholded population score', data: [[0, 0], [boundary, 0], [boundary, 1], [1, 1]], dashed: true }]} points={[{ x: p, y: p, color: C.data, selected: true }, { x: p, y: values.exact, color: C.parameter, selected: true }, { x: p, y: values.thresholded, color: C.compute, selected: true }]} xDomain={[0, 1]} yDomain={[0, 1]} xTicks={[0, .2, .4, .6, .8, 1]} yTicks={[0, .25, .5, .75, 1]} xLabel="p · correctness per token" yLabel="population score" />
      <Plot label="Binomial probabilities of zero to one hundred exact matches" xDomain={[0, 100]} yDomain={[0, Math.max(...values.masses)]} xTicks={[0, 25, 50, 75, 100]} yTicks={[0, Math.max(...values.masses) / 2, Math.max(...values.masses)]} xLabel="exact matches / 100 items" yLabel="probability mass · total = 1">{({ sx, sy }) => values.masses.map((mass, i) => <rect key={i} x={sx(i) - (sx(1) - sx(0)) * .4} y={sy(mass)} width={(sx(1) - sx(0)) * .8} height={sy(0) - sy(mass)} fill={i === 0 ? C.heldout : C.parameter}><title>{`${i} matches: probability ${mass}`}</title></rect>)}</Plot>
    </Figure><FlowControls><FlowSlider name="Per-token correctness p" value={p} onChange={setP} min={0} max={1} step={.01} /><FlowSlider name="Answer length k" value={length} onChange={setLength} min={1} max={10} step={1} /><FlowSlider name="Threshold τ" value={threshold} onChange={setThreshold} min={.1} max={.9} step={.1} /><button type="button" onClick={() => { setP(.8); setLength(5); setThreshold(.5); }}>Reset metrics</button></FlowControls>
    <FlowReadout>pᵏ={number(values.exact, 6)}, threshold score {values.thresholded}, crossing at p={number(boundary, 6)}. Chance of zero exact matches in 100 items: {values.zero < 1e-5 && values.zero > 0 ? values.zero.toExponential(3) : number(values.zero, 6)}. {length === 1 ? 'With k=1, token and exact-match curves coincide.' : 'The power curve is continuous; the indicator adds the jump.'}</FlowReadout>
  </FlowLab>;
}
