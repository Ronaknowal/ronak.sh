import { McFigure, McScene, McTable, McPlot, McLabel, McArrow, mcNumber as f, mcColours as colours } from './MonteCarloReadingPrimitives.jsx';
import { NutsDrawing } from './MonteCarloReadingLabs.jsx';
import { leapfrog, harmonicEnergy } from '../../data/monte-carlo-mcmc-models.js';
import { nutsConstruction } from '../../data/monte-carlo-reading-flow-models.js';

export function FirstTurnIllustration() {
  const points = [{ position: 1, momentum: .7 }];
  for (let index = 0; index < 24; index += 1) points.push(leapfrog(points.at(-1).position, points.at(-1).momentum, .25));
  const from = start => { let end = start + 1; while (end < 24 && (points[end].position - points[start].position) * points[end].momentum >= 0) end += 1; return end; };
  const ends = [from(0), from(3)];
  return <McFigure id="M40" caption="Same exact leapfrog orbit, starting at leaves 0 and 3: a naive one-sided first-turn rule produces different endpoints. The common declared leaves 0–7 below illustrate a shared candidate set; they are not an invariance proof or an implemented sampler."><McPlot label="Two starting leaves and different naive first-turn endpoints" xDomain={[-1.5, 1.5]} yDomain={[-1.5, 1.5]} xLabel="q" yLabel="r" series={[{ points: points.map(point => [point.position, point.momentum]), colour: '#777' }, ...[0, 3].map((start, index) => ({ points: points.slice(start, ends[index] + 1).map(point => [point.position, point.momentum]), colour: colours[index], dots: true }))]} />
    <McScene label="Naive ranges and an explicitly shared candidate interval" width={Math.max(760, 210 + (Math.max(...ends) + 1) * 50)} height={220}>{[0, 3].map((start, index) => <g key={start}><McLabel x={25} y={50 + index * 70}>start {start}</McLabel>{points.slice(0, Math.max(...ends) + 1).map((point, leaf) => <g key={leaf}><circle cx={170 + leaf * 50} cy={45 + index * 70} r={7} fill={leaf >= start && leaf <= ends[index] ? colours[index] : '#555'} /><McLabel x={170 + leaf * 50} y={75 + index * 70} anchor="middle">{leaf}</McLabel></g>)}</g>)}<line x1={170} x2={520} y1={185} y2={185} stroke={colours[3]} strokeWidth={5} /><McLabel x={30} y={215}>shared declared interval 0–7; compare construction history next</McLabel></McScene><McTable label="Actual naive stopping endpoints" columns={['Starting leaf', 'First-turn leaf', 'Endpoint q', 'Endpoint r']} rows={[0, 3].map((start, index) => [start, ends[index], f(points[ends[index]].position), f(points[ends[index]].momentum)])} /></McFigure>;
}
export function SliceEligibility() {
  const construction = nutsConstruction();
  const snapshot = construction.snapshots.at(-1);
  const states = [construction.initial, ...snapshot.explored];
  const threshold = -construction.logSlice;
  return <McFigure id="M41" caption="The actual seed-7 slice is log u=−H₀+log U. A phase leaf is eligible only when its energy lies below −log u and the energy guard is valid; the original state stays available."><McPlot label="Actual phase-state energies and slice threshold" xDomain={[0, states.length - 1]} yDomain={[0, Math.max(2, threshold * 1.1)]} xLabel="attempted leaf order (s0 first)" yLabel="energy H" references={[{ value: threshold, colour: colours[1] }]} series={[{ points: states.map((state, index) => [index, harmonicEnergy(state.position, state.momentum)]), dots: true, connect: false }]} /><McTable tall label="Full slice and final pool eligibility" columns={['Leaf', 'H', 'log u', 'On slice?', 'Final pool?']} rows={states.map(state => [state.id, f(harmonicEnergy(state.position, state.momentum)), f(construction.logSlice), state.id === 's0' || state.onSlice ? 'yes' : 'no', snapshot.candidates.some(candidate => candidate.id === state.id) ? 'yes' : 'no'])} /></McFigure>;
}
export function DoublingTree() {
  const construction = nutsConstruction();
  return <McFigure id="M42" caption="Actual one/two/four-step expansions with the real signed directions. Parent edges are recursive calls, not a balanced tree inferred from a state list."><NutsDrawing construction={construction} round={Math.min(3, construction.snapshots.length - 1)} /></McFigure>;
}
export function EndpointProjections() {
  const construction = nutsConstruction({ seed: 1 });
  const snapshot = construction.snapshots.at(-1);
  const delta = snapshot.right.position - snapshot.left.position;
  const rows = [['left time endpoint', snapshot.left], ['right time endpoint', snapshot.right]];
  return <McFigure id="M44" caption="Left/right refer to signed integration-time endpoints, regardless of their coordinate order. Both endpoint momenta must have nonnegative projection on qplus−qminus to keep growing."><McScene label="Endpoint displacement and both momentum projections" height={290}>
    <McArrow x1={100} y1={55} x2={100 + delta * 150} y2={55} colour={colours[3]} /><McLabel x={30} y={100}>Δq={f(delta)} (signed displacement)</McLabel>
    {rows.map(([label, state], index) => <g key={label}><McLabel x={30} y={155 + 90 * index}>{label}: {state.id}</McLabel><McArrow x1={370} y1={140 + 90 * index} x2={370 + state.momentum * 130} y2={140 + 90 * index} colour={colours[index]} /><McLabel x={370} y={175 + 90 * index}>r={f(state.momentum)}</McLabel></g>)}
  </McScene><McTable label="Exact signed dot products from the completed construction" columns={['Endpoint', 'Leaf', 'q', 'r', '(qplus−qminus)r']} rows={rows.map(([label, state]) => [label, state.id, f(state.position), f(state.momentum), f(delta * state.momentum)])} /></McFigure>;
}
export function SubtreeExclusion() {
  const internal = nutsConstruction({ seed: 2, step: .25 });
  const whole = nutsConstruction({ seed: 1, step: .25 });
  return <McFigure id="M45" caption="Same target/start/step; declared seeds 2 and 1 expose actual different stop histories. A rejected internally turning new subtree contributes no pool states; a valid attachment that triggers a whole-tree turn keeps its candidates."><div className="mc-compare"><NutsDrawing construction={internal} round={internal.snapshots.length - 1} /><NutsDrawing construction={whole} round={whole.snapshots.length - 1} /></div><McTable label="Observed construction histories, not a tuning benchmark" columns={['Seed', 'Final status', 'Attempted leaves', 'Final pool']} rows={[internal, whole].map((tree, index) => [index ? 1 : 2, tree.snapshots.at(-1).stopReason, tree.snapshots.at(-1).explored.length, tree.snapshots.at(-1).candidates.length])} /></McFigure>;
}
export function CandidateSelection() {
  const construction = nutsConstruction();
  const pool = construction.snapshots.at(-1).candidates;
  const groups = construction.snapshots.map((snapshot, index) => index ? snapshot.candidates.length - construction.snapshots[index - 1].candidates.length : 1);
  let cumulative = 0;
  return <McFigure id="M46" caption="Executed Algorithm 2 stores the full slice pool and selects uniformly. Count-weighted subtree selection is the separate original Algorithm 3 bridge; modern multinomial energy weighting is another named variant."><McScene label="Uniform stored leaves and count-weighted pool groups" width={Math.max(640, pool.length * 62 + 60)} height={280}>
    {pool.map((state, index) => <g key={state.id}><rect x={30 + index * 62} y={40} width={48} height={55} fill={colours[0]} fillOpacity={.3} stroke={state.id === construction.selected.id ? '#fff' : colours[0]} strokeWidth={state.id === construction.selected.id ? 3 : 1} /><McLabel x={54 + index * 62} y={73} anchor="middle">{state.id}</McLabel><McLabel x={54 + index * 62} y={125} anchor="middle">1/{pool.length}</McLabel></g>)}
    {groups.map((count, index) => {
      const left = 30 + cumulative * 62;
      cumulative += count;
      const centre = left + count * 31 - 5;
      const labelX = Math.max(90, Math.min(Math.max(640, pool.length * 62 + 60) - 90, centre));
      const above = index % 2 === 1;
      const labelY = above ? 155 : 238;
      return count ? <g key={index}><rect x={left} y={170} width={count * 62 - 10} height={40} fill={colours[index % 4]} fillOpacity={.4} /><line x1={centre} y1={above ? 170 : 210} x2={labelX} y2={above ? 161 : 222} stroke={colours[index % 4]} /><McLabel x={labelX} y={labelY} anchor="middle">round {index}: {count}/{pool.length}</McLabel></g> : null;
    })}
  </McScene><McTable label="Actual stored pool and chosen state" columns={['Leaf', 'Signed time', 'Selection probability', 'Selected?']} rows={pool.map(state => [state.id, state.time, `1/${pool.length}`, construction.selected.id === state.id ? 'yes' : 'no'])} /></McFigure>;
}
