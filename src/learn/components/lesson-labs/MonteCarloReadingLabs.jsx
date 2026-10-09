import { useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { McFigure, McScene, McTable, McPlot, McLabel, McArrow, mcNumber as f, mcColours } from './MonteCarloReadingPrimitives.jsx';
import { independentEstimate, finiteMetropolis, metropolisTrace, leapfrog, harmonicEnergy, exactHarmonic, stationaryMeanVariance, twoStateTrace } from '../../data/monte-carlo-mcmc-models.js';
import { completeHarmonicPath, nutsConstruction } from '../../data/monte-carlo-reading-flow-models.js';

export function ContributionDrawing({ result, paired = false }) {
  return <><McPlot label={paired ? 'Independent paired groups and cumulative mean' : 'Squared contributions and cumulative mean'} xDomain={[1, result.rows.length]} yDomain={[0, 1]} xLabel={paired ? 'independent pair index' : 'contribution index'} yLabel="squared contribution / cumulative mean" references={[{ value: 1 / 3 }]} series={[
    { points: result.rows.flatMap(row => row.contributions.map(value => [row.index + 1, value])), dots: true, connect: false, colour: mcColours[1] },
    { points: result.rows.map(row => [row.index + 1, row.mean]), colour: mcColours[0] },
  ]} />
    <McTable tall label={paired ? 'Every pair; pair means are the independent units' : 'Every selected input, square and running mean'} columns={paired ? ['Pair', 'U', '1−U', 'U²', '(1−U)²', 'Pair mean', 'Evaluations', 'Running mean'] : ['Draw', 'U', 'U²', 'Count', 'Running mean']} rows={result.rows.map(row => paired ? [row.index + 1, ...row.inputs.map(value => f(value)), ...row.contributions.map(value => f(value)), f((row.contributions[0] + row.contributions[1]) / 2), row.evaluations, f(row.mean)] : [row.index + 1, f(row.inputs[0]), f(row.contributions[0]), row.evaluations, f(row.mean)])} />
  </>;
}
export function IndependentReadingLab() {
  const [count, setCount] = useState(40);
  const result = useMemo(() => independentEstimate({ evaluations: count }), [count]);
  return <FlowLab id="mc-M05" label="Fixed-prefix independent estimation"><McFigure id="M05"><ContributionDrawing result={result} /></McFigure><FlowControls><FlowSlider name="Contributions" value={count} min={2} max={400} step={1} onChange={setCount} /><button type="button" onClick={() => setCount(40)}>Reset</button></FlowControls><FlowReadout>The current mean is <strong>{f(result.estimate)}</strong>; sample MCSE is <strong>{f(result.mcse)}</strong>. The dashed reference is the exact expectation <strong>1/3</strong>.</FlowReadout></FlowLab>;
}
export function PairedReadingLab() {
  const [budget, setBudget] = useState(100);
  const iid = useMemo(() => independentEstimate({ evaluations: budget }), [budget]);
  const paired = useMemo(() => independentEstimate({ evaluations: budget, antithetic: true }), [budget]);
  return <FlowLab id="mc-M08" label="Equal-work antithetic comparison"><McFigure id="M08"><div className="mc-compare"><ContributionDrawing result={iid} /><ContributionDrawing result={paired} paired /></div></McFigure><FlowControls><FlowSlider name="Function evaluations" value={budget} min={20} max={400} step={2} onChange={setBudget} /><button type="button" onClick={() => setBudget(100)}>Reset</button></FlowControls><FlowReadout>At the same <strong>{budget}</strong> evaluations, iid mean/MCSE are <strong>{f(iid.estimate)} / {f(iid.mcse)}</strong>; paired mean/MCSE are <strong>{f(paired.estimate)} / {f(paired.mcse)}</strong>. There are <strong>{paired.independentGroups}</strong> independent pairs. The exact estimator-variance ratio is <strong>8</strong>.</FlowReadout></FlowLab>;
}
export function FlowDrawing({ result }) {
  return <><McScene label="Directed stationary flow; row is source, column is destination" height={300}>
    {['A', 'B', 'C'].map((state, index) => <g key={state}><McLabel x={195 + 150 * index} y={30} anchor="middle">to {state}</McLabel><McLabel x={30} y={85 + 75 * index}>from {state}</McLabel></g>)}
    {result.flow.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}><rect x={125 + 150 * j} y={60 + 75 * i} width={130 * value / .5} height={18} fill={mcColours[i]} /><McLabel x={125 + 150 * j} y={101 + 75 * i}>{f(value, 4)}</McLabel></g>))}
  </McScene><McTable label="Full transition matrix, including rejection returns" columns={['From', 'to A', 'to B', 'to C', 'Row sum']} rows={result.transition.map((row, index) => [['A', 'B', 'C'][index], ...row.map(value => f(value)), f(row.reduce((sum, value) => sum + value, 0))])} /><McTable label="Stationary-balance residual" columns={['State', 'π', '(πP)', '(πP)−π']} rows={result.target.map((value, index) => [['A', 'B', 'C'][index], f(value), f(result.afterOne[index]), f(result.afterOne[index] - value)])} /></>;
}
export function FlowReadingLab() {
  const [correct, setCorrect] = useState(true);
  const result = useMemo(() => finiteMetropolis([2, 5, 3], undefined, correct), [correct]);
  return <FlowLab id="mc-M17" label="Asymmetric proposal and Hastings correction"><McFigure id="M17"><FlowDrawing result={result} /></McFigure><FlowControls><FlowChoice label="Acceptance rule" value={correct} options={[[true, 'Hastings correction'], [false, 'Wrong symmetric rule']]} onChange={setCorrect} /><button type="button" onClick={() => setCorrect(true)}>Reset</button></FlowControls><FlowReadout>{correct ? 'The corrected directed flows balance at the stated target.' : 'This deliberately wrong rule leaves nonzero stationary-balance residuals; its invariant law is not the stated target.'}</FlowReadout></FlowLab>;
}
export function TraceDrawing({ result }) {
  const lower = Math.min(0, ...result.rows.map(row => row.proposal));
  const upper = Math.max(1, ...result.rows.map(row => row.proposal));
  return <><McPlot label="All proposals and retained states; repeats remain" xDomain={[0, Math.max(1, result.rows.length)]} yDomain={[lower, upper]} xLabel="transition" yLabel="θ / proposed θ" references={[{ value: 0 }, { value: 1 }]} series={[{ points: [[0, result.rows[0].before], ...result.rows.map(row => [row.index + 1, row.state])], colour: mcColours[0], dots: true }, { points: result.rows.map(row => [row.index + 1, row.proposal]), colour: mcColours[2], dots: true, connect: false }]}>{({ x, y }) => result.rows.map(row => <McArrow key={row.index} x1={x(row.index + 1)} y1={y(row.before)} x2={x(row.index + 1)} y2={y(row.proposal)} colour={row.accept ? mcColours[1] : mcColours[2]} dashed={!row.accept} />)}</McPlot><McTable tall label="Every transition, including support violations and rejected repeats" columns={['Step', 'Old θ', 'Proposed θ', 'log ratio', 'Uniform', 'Accepted?', 'Retained θ']} rows={result.rows.map(row => [row.index + 1, f(row.before), f(row.proposal), f(row.logRatio), f(row.uniform), row.accept ? 'yes' : 'no', f(row.state)])} /></>;
}
export function TraceReadingLab() {
  const [scale, setScale] = useState(.12);
  const [count, setCount] = useState(80);
  const result = useMemo(() => metropolisTrace({ scale, iterations: count }), [scale, count]);
  return <FlowLab id="mc-M21" label="Fixed-target complete Metropolis trace"><McFigure id="M21"><TraceDrawing result={result} /></McFigure><FlowControls><FlowChoice label="Proposal scale" value={scale} options={[[.01, '.01'], [.12, '.12'], [.5, '.50']]} onChange={setScale} /><FlowSlider name="Transition prefix" value={count} min={1} max={200} step={1} onChange={setCount} /><button type="button" onClick={() => { setScale(.12); setCount(80); }}>Reset</button></FlowControls><FlowReadout><strong>{result.accepted}</strong> of <strong>{count}</strong> proposals were accepted (<strong>{f(result.acceptanceRate)}</strong>). Gold is the retained trace; cyan arrows accept and rose arrows reject. High acceptance alone does not establish useful exploration.</FlowReadout></FlowLab>;
}
export function OneStepDrawing({ step = .2 }) {
  const next = leapfrog(1, .7, step);
  const points = [[1, .7], [1, next.halfMomentum], [next.position, next.halfMomentum], [next.position, next.momentum]];
  return <><McPlot label="Half-kick, drift, half-kick in phase space" xDomain={[.8, 1.5]} yDomain={[-.1, .9]} xLabel="position q" yLabel="momentum r" series={[{ points, dots: true }]}>{({ x, y }) => points.slice(1).map((point, index) => <McArrow key={index} x1={x(points[index][0])} y1={y(points[index][1])} x2={x(point[0])} y2={y(point[1])} colour={mcColours[index]} />)}</McPlot><McTable label="All substeps and energy" columns={['State', 'q', 'r', 'H']} rows={points.map((point, index) => [['start', 'half-kick', 'drift', 'half-kick'][index], f(point[0]), f(point[1]), f(harmonicEnergy(...point))])} /></>;
}
export function OneStepReadingLab() {
  const [step, setStep] = useState(.2);
  const next = leapfrog(1, .7, step);
  return <FlowLab id="mc-M28" label="One exposed leapfrog step"><McFigure id="M28"><OneStepDrawing step={step} /></McFigure><FlowControls><FlowSlider name="Step ε" value={step} min={0} max={.5} step={.05} onChange={setStep} /><button type="button" onClick={() => setStep(.2)}>Reset</button></FlowControls><FlowReadout>The step reaches <strong>q={f(next.position)}, r={f(next.momentum)}</strong>; ΔH is <strong>{f(harmonicEnergy(next.position, next.momentum) - .745)}</strong>. At ε=0 every substep is the initial state.</FlowReadout></FlowLab>;
}
export function PhaseDrawing({ path }) {
  const outside = path.rows.filter(row => Math.abs(row.position) > 2 || Math.abs(row.momentum) > 2);
  const orbit = Array.from({ length: 129 }, (_, index) => { const point = exactHarmonic(1, .7, index * 2 * Math.PI / 128); return [point.position, point.momentum]; });
  return <><McPlot label="Fixed-scale phase path and exact energy contour" xDomain={[-2, 2]} yDomain={[-2, 2]} xLabel="q (fixed scale)" yLabel="r (fixed scale)" series={[{ points: orbit, colour: '#999' }, { points: path.rows.map(row => [row.position, row.momentum]), dots: true, colour: mcColours[0] }]} />
    {outside.length > 0 && <><McScene label="Out-of-range step directions; numbers remain in the full table" height={90 + outside.length * 28}>{outside.map((row, index) => <g key={row.index}><McArrow x1={70} y1={40 + index * 28} x2={row.position > 2 ? 110 : row.position < -2 ? 30 : 70} y2={40 + index * 28 + (row.momentum > 2 ? -15 : row.momentum < -2 ? 15 : 0)} colour={mcColours[2]} /><McLabel x={140} y={45 + index * 28}>step {row.index}: q={f(row.position, 4)}, r={f(row.momentum, 4)}</McLabel></g>)}</McScene></>}
    <McPlot label="Energy error at every requested step" xDomain={[0, path.rows.length - 1]} yDomain={[-.1, .1]} xLabel="requested step 0–L" yLabel="ΔH (values outside scale in table)" references={[{ value: 0 }]} series={[{ points: path.rows.map(row => [row.index, row.energyError]), dots: true }]} />
    <McTable tall label="Entire requested trajectory; no unstable rows removed" columns={['Step', 'q', 'r', 'H', 'ΔH']} rows={path.rows.map(row => [row.index, f(row.position), f(row.momentum), f(row.energy), f(row.energyError)])} /></>;
}
export function PhaseReadingLab() {
  const [step, setStep] = useState(.2);
  const [count, setCount] = useState(16);
  const path = useMemo(() => completeHarmonicPath(step, count), [step, count]);
  return <FlowLab id="mc-M32" label="Fixed-axis complete Hamiltonian trajectory"><McFigure id="M32"><PhaseDrawing path={path} /></McFigure><FlowControls><FlowSlider name="Step ε" value={step} min={.05} max={2.5} step={.05} onChange={setStep} /><FlowSlider name="Steps L" value={count} min={1} max={32} step={1} onChange={setCount} /><button type="button" onClick={() => { setStep(.2); setCount(16); }}>Reset</button></FlowControls><FlowReadout>The <strong>{count}</strong>-step proposal has ΔH=<strong>{f(path.rows.at(-1).energyError)}</strong> and acceptance probability <strong>{f(path.acceptance)}</strong>. The q/r axes and vertical energy-error scale stay fixed; the horizontal step axis spans the requested L. Every off-scale state remains in the direction drawing and complete table.</FlowReadout></FlowLab>;
}
export function NutsDrawing({ construction, round }) {
  const snapshot = construction.snapshots[round];
  const nodes = construction.nodes.filter(node => node.round <= round);
  const leaves = nodes.filter(node => node.depth === 0);
  const width = Math.max(640, leaves.length * 72 + 140);
  const positions = new Map();
  leaves.forEach((node, index) => positions.set(node.id, { x: 70 + index * 72, y: 255 }));
  const positionNode = node => {
    if (positions.has(node.id)) return positions.get(node.id);
    const children = node.children.map(id => positionNode(nodes.find(item => item.id === id)));
    const position = { x: children.reduce((sum, child) => sum + child.x, 0) / children.length, y: 255 - node.depth * 48 };
    positions.set(node.id, position);
    return position;
  };
  nodes.forEach(positionNode);
  const pool = new Set(snapshot.candidates.map(state => state.id));
  const ordered = [construction.initial, ...snapshot.explored].sort((a, b) => a.time - b.time);
  return <><McScene label="Actual recursive call forest; leaf IDs continue into the phase path" width={width} height={330}>
    {round === 0 && <><circle cx={90} cy={100} r={10} fill={mcColours[0]} /><McLabel x={90} y={140} anchor="middle">s0</McLabel></>}
    {nodes.map(node => { const position = positions.get(node.id); return <g key={node.id}>{node.children.map(id => { const child = positions.get(id); return <line key={id} x1={position.x} y1={position.y} x2={child.x} y2={child.y} stroke={node.keepBuilding ? '#aaa' : mcColours[2]} strokeDasharray={node.keepBuilding ? undefined : '5 4'} />; })}<circle cx={position.x} cy={position.y} r={7} fill={node.depth === 0 ? pool.has(node.state) ? mcColours[0] : mcColours[2] : mcColours[1]} /><McLabel x={position.x} y={position.y - 13} anchor="middle">{node.id}</McLabel>{node.state && <McLabel x={position.x} y={position.y + 27} anchor="middle">{node.state}</McLabel>}</g>; })}
    <McLabel x={30} y={315}>gold: final pool; rose: outside pool; cyan: recursive call</McLabel>
  </McScene><McPlot label="Ordered signed-time phase leaves from the actual construction" xDomain={[-2, 2]} yDomain={[-2, 2]} xLabel="position q" yLabel="momentum r" series={[{ points: ordered.map(state => [state.position, state.momentum]), dots: true }]}>{({ x, y, left, right, top, bottom }) => {
      const points = ordered.map(state => ({ state, x: x(state.position), y: y(state.momentum) }));
      const placed = [];
      return points.map(point => {
        const labelWidth = point.state.id.length * 9 + 10;
        const candidates = [-18, 26, -44, 52].map(offset => ({ x: point.x, y: point.y + offset }));
        for (let laneY = top + 20; laneY <= bottom - 8; laneY += 26) {
          for (let laneX = left + 28; laneX <= right - 28; laneX += 44) candidates.push({ x: laneX, y: laneY });
        }
        candidates.sort((a, b) => (a.x - point.x) ** 2 + (a.y - 5 - point.y) ** 2 - ((b.x - point.x) ** 2 + (b.y - 5 - point.y) ** 2));
        const boxFor = candidate => ({ left: candidate.x - labelWidth / 2, right: candidate.x + labelWidth / 2, top: candidate.y - 16, bottom: candidate.y + 6 });
        const candidate = candidates.find(item => {
          const box = boxFor(item);
          return box.left >= left + 2 && box.right <= right - 2 && box.top >= top + 2 && box.bottom <= bottom - 2
            && !placed.some(other => box.left < other.right + 3 && box.right > other.left - 3 && box.top < other.bottom + 3 && box.bottom > other.top - 3)
            && !points.some(other => other.x > box.left - 4 && other.x < box.right + 4 && other.y > box.top - 4 && other.y < box.bottom + 4);
        });
        if (!candidate) throw new Error('NUTS phase labels need another free callout lane.');
        placed.push(boxFor(candidate));
        const dx = candidate.x - point.x, dy = candidate.y - 5 - point.y;
        const inset = Math.min((labelWidth / 2) / Math.max(Math.abs(dx), 1e-9), 11 / Math.max(Math.abs(dy), 1e-9));
        const colour = pool.has(point.state.id) ? mcColours[0] : mcColours[2];
        return <g key={point.state.id}><line x1={point.x} y1={point.y} x2={candidate.x - inset * dx} y2={candidate.y - 5 - inset * dy} stroke={colour} strokeWidth={.8} /><McLabel x={candidate.x} y={candidate.y} anchor="middle" colour={colour}>{point.state.id}</McLabel></g>;
      });
    }}</McPlot><McTable tall label="Every initial or attempted leaf and current pool membership" columns={['Leaf', 'Signed time', 'q', 'r', 'On slice?', 'Energy valid?', 'In pool?']} rows={[construction.initial, ...snapshot.explored].map(state => [state.id, state.time, f(state.position), f(state.momentum), state.id === 's0' || state.onSlice ? 'yes' : 'no', state.id === 's0' || state.validEnergy ? 'yes' : 'no', pool.has(state.id) ? 'yes' : 'no'])} /><McTable label="Every completed construction round" columns={['Round', 'Direction', 'Attempted new leaves', 'Pool count', 'Stop reason']} rows={construction.snapshots.slice(0, round + 1).map(state => [state.depth, state.depth ? state.direction : '—', state.newStates, state.candidates.length, state.stopReason])} /></>;
}
export function NutsReadingLab() {
  const construction = useMemo(() => nutsConstruction(), []);
  const [round, setRound] = useState(0);
  const current = construction.snapshots[round];
  return <FlowLab id="mc-M43" label="Inspect the actual completed NUTS construction"><McFigure id="M43"><NutsDrawing construction={construction} round={round} /></McFigure><FlowControls><FlowSlider name="Completed round" value={round} min={0} max={construction.snapshots.length - 1} step={1} onChange={setRound} /><button type="button" onClick={() => setRound(0)}>Reset</button></FlowControls><FlowReadout>Round <strong>{round}</strong> has attempted <strong>{current.explored.length}</strong> leaves and retains <strong>{current.candidates.length}</strong> eligible pool states. Status: <strong>{current.stopReason}</strong>. An internal subtree turn excludes that subtree's candidates; a whole-tree turn after a valid attachment keeps them.</FlowReadout></FlowLab>;
}
export function CorrelationDrawing({ correlation = .8 }) {
  const states = twoStateTrace({ correlation });
  const precision = stationaryMeanVariance(100, correlation);
  return <><McPlot label="One stationary-start two-state realization" xDomain={[1, 100]} yDomain={[0, 1]} xLabel="transition (100 fixed)" yLabel="h(state)" series={[{ points: states.map((state, index) => [index + 1, state]), dots: true }]} /><McPlot label="Exact function autocorrelation" xDomain={[0, 20]} yDomain={[-1, 1]} xLabel="lag k" yLabel="ρ^k" references={[{ value: 0 }]} series={[{ points: Array.from({ length: 21 }, (_, lag) => [lag, correlation ** lag]), dots: true, colour: mcColours[1] }]} /><McTable tall label="All 100 retained state values" columns={['Transition', 'h(state)']} rows={states.map((state, index) => [index + 1, state])} /><McTable label="Exact finite precision, conditional on stationary initialization" columns={['N', 'ρ', 'Var(mean)', 'MCSE', 'Equivalent iid count']} rows={[[100, f(correlation), f(precision.variance), f(precision.mcse), f(precision.equivalentIID)]]} /></>;
}
export function CorrelationReadingLab() {
  const [correlation, setCorrelation] = useState(.8);
  const precision = stationaryMeanVariance(100, correlation);
  return <FlowLab id="mc-M48" label="Finite stationary precision and negative correlation"><McFigure id="M48"><CorrelationDrawing correlation={correlation} /></McFigure><FlowControls><FlowSlider name="Lag-one correlation ρ" value={correlation} min={-.9} max={.9} step={.1} onChange={setCorrelation} /><button type="button" onClick={() => setCorrelation(.8)}>Reset</button></FlowControls><FlowReadout>Exact finite MCSE is <strong>{f(precision.mcse)}</strong>, equivalent to <strong>{f(precision.equivalentIID)}</strong> iid contributions for this function. These are analytic quantities, not estimates from the displayed realization.</FlowReadout></FlowLab>;
}
