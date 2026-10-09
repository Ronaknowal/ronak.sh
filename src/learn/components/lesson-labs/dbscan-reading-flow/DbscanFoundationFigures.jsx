import React, { useState } from 'react';
import { EuclideanNeighbourhoods, diskObservations, trailObservations, coincidentObservations, densityPartition, coreComponentRows } from '../../../data/dbscan-reading-flow/dbscan-neighbourhood-models.mjs';
import { trailProvider, roleRows, rankedSupport, rosterText, suppliedRings } from '../../../data/dbscan-reading-flow/dbscan-geometry-models.mjs';
import { Figure, Canvas, Plane, Trail, Point, Arrow, Table, CellStrip, RoleKey, NumericControl, Steps, number, hues, focus, line, neutral } from './DbscanDrawingPrimitives.jsx';
const disk = new EuclideanNeighbourhoods(diskObservations),
  coincident = new EuclideanNeighbourhoods(coincidentObservations);
const defaultRoles = roleRows(trailProvider, 1, 4);
function Select({
  label,
  value,
  onChange,
  options,
  onReset
}) {
  return <div className="db-controls"><label className="db-field">{label}<select value={value} onChange={e => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><button type="button" onClick={onReset}>Reset</button></div>;
}
function ObservationDisk() {
  return <><CellStrip label="Selected observation P — two numeric feature cells" values={['x = 0', 'y = 0']} /><Canvas height={140} label="Coordinate cells route to the horizontal and vertical feature axes">{({
        width,
        height
      }) => <g><rect x={15} y={12} width={95} height={35} fill="none" stroke={hues[0]} /><text x={28} y={36}>x = 0</text><rect x={width - 110} y={12} width={95} height={35} fill="none" stroke={hues[1]} /><text x={width - 97} y={36}>y = 0</text><Arrow x1={62} y1={50} x2={62} y2={100} label="x axis" color={hues[0]} /><Arrow x1={width - 62} y1={50} x2={width - 62} y2={100} label="y axis" color={hues[1]} /><text x={width / 2} y={height - 5} textAnchor="middle">P is the disk centre</text></g>}</Canvas><Plane rows={diskObservations.map(row => ({
      ...row,
      role: 'context',
      selected: row.id === 'P',
      dy: row.id === 'Q' ? -20 : row.id === 'P' ? 28 : -9
    }))} domain={[-1.6, 1.8, -1.3, 1.5]} disk={{
      x: 0,
      y: 0,
      radius: 1
    }} label="Closed unit disk around P includes P Q R S; R is on its boundary; T is outside" /><Table caption="Closed distance test from P; each observation appears once" headers={['ID', 'Distance', '≤ 1?']} rows={diskObservations.map((row, i) => [row.id, number(disk.distance(0, i), 6), disk.distance(0, i) <= 1 ? 'included' : 'outside'])} /></>;
}
function D01() {
  const [selected, setSelected] = useState(3),
    roster = trailProvider.neighbours(selected, 1),
    x = trailObservations[selected].coordinates[0];
  return <Figure id="D01" sentence={`${trailObservations[selected].id} at ${x}: the closed interval [${x - 1}, ${x + 1}] contains ${rosterText(roster)}. Count ${roster.length}; self distance is 0.`}><ObservationDisk /><Trail rows={trailObservations} selected={selected} /><Select label="Selected trail row; radius stays 1" value={selected} onChange={v => setSelected(Number(v))} options={trailObservations.map((r, i) => [i, `${r.id} (${r.coordinates[0]})`])} onReset={() => setSelected(3)} /><CellStrip label="Current complete roster" values={roster.map(r => `${r.id} · ${number(r.distance)}`)} /></Figure>;
}
function RingPicture({
  nearest = false
}) {
  const rows = suppliedRings().map(row => {
      const radius = row.ring ? 3 : 1,
        labelRadius = row.ring ? 3.65 : 1.95,
        c = row.coordinates[0] / radius,
        s = row.coordinates[1] / radius;
      return {
        ...row,
        label: nearest ? row.representative : row.ring,
        role: 'context',
        labelCoordinates: [c * labelRadius, s * labelRadius],
        anchor: c > 0.2 ? 'start' : c < -.2 ? 'end' : 'middle'
      };
    }),
    centers = [{
      id: 'Cleft',role:'centre',
      coordinates: [-1, 0],
      label: 0,
      labelCoordinates: [-2.5, 4.3],
      anchor: 'middle'
    }, {
      id: 'Cright',role:'centre',
      coordinates: [1, 0],
      label: 1,
      labelCoordinates: [2.5, 4.3],
      anchor: 'middle'
    }],
    all = nearest ? [...rows, ...centers] : rows,
    links = nearest ? rows.map((r, i) => ({
      a: i,
      b: 24 + r.representative,
      color: hues[r.representative]
    })) : rows.map((r, i) => ({
      a: i,
      b: i % 12 === 11 ? i - 11 : i + 1,
      color: hues[r.ring]
    }));
  return <><Plane rows={all} domain={[-4.8, 4.8, -4.8, 4.8]} links={links} height={520} label={nearest ? 'Same 24 supplied points with residual segments to nearest supplied representative' : '24 supplied points with neighbouring links along the two rings'} /><p>{nearest ? 'Cleft = (−1,0); Cright = (1,0). Equal distances go to Cleft. These are supplied centres, not an executed KMeans fit.' : 'Supplied ring membership and neighbour links; this picture does not assert an executed density predicate.'}</p><Table caption={nearest ? 'Nearest-representative identity and residual length' : 'Supplied ring row coordinates'} headers={['ID', 'x', 'y', nearest ? 'Centre / residual' : 'Ring']} rows={rows.map(r => [r.id, number(r.coordinates[0]), number(r.coordinates[1]), nearest ? `${r.representative ? 'Cright' : 'Cleft'} / ${number(Math.hypot(r.coordinates[0] - (r.representative ? 1 : -1), r.coordinates[1]))}` : r.ring ? 'outer' : 'inner'])} /></>;
}
function D02() {
  return <Figure id="D02" sentence="The same supplied observations support two different questions: follow neighbouring points around a curve, or assign each point to its nearest supplied representative."><div className="db-pair"><section><h4>Follow the supported rings</h4><RingPicture /></section><section><h4>Assign to a representative</h4><RingPicture nearest /></section></div></Figure>;
}
function D03() {
  return <Figure id="D03" sentence="At radius 1 and minimum 4, A–H are core. I has only D, I and E: it can attach but cannot expand. J has only itself and has no core support."><Trail rows={defaultRoles.map(r => ({
      ...r,
      label: -1
    }))} counts edges={[[3, 8], [4, 8]]} /><RoleKey /><Table caption="All ten actual closed neighbourhoods" headers={['ID', 'Roster', 'Count', 'Role']} rows={defaultRoles.map((r, i) => [r.id, rosterText(trailProvider.neighbours(i, 1)), r.count, r.role])} /></Figure>;
}
function CountBars({
  rows,
  minimum
}) {
  return <Canvas height={350} label={`Ten unchanged count bars and minimum line ${minimum}`}>{({
      width,
      height,
      rem
    }) => {
      const narrow = width < 520,
        spacing = width / 10,
        baseline = height - 65,
        y = n => baseline - n * (height - 110) / 11;
      return <g><line x1={8} x2={width - 8} y1={y(minimum)} y2={y(minimum)} stroke={focus} strokeDasharray="5 3" /><text x={width - 8} y={y(minimum) - 8} textAnchor="end">m = {minimum}</text>{rows.map((r, i) => {
          const x = (i + .5) * spacing;
          return <g key={r.id}><rect x={x - spacing * .28} y={y(r.count)} width={spacing * .56} height={baseline - y(r.count)} fill={r.core ? hues[r.label % 4] : neutral} fillOpacity={r.core ? .8 : .25} /><text x={x} y={y(r.count) - 8} textAnchor="middle">{r.count}</text><text x={x} y={baseline + 28} textAnchor="middle">{r.id}</text></g>;
        })}</g>;
    }}</Canvas>;
}
function D04() {
  const [minimum, setMinimum] = useState(4),
    rows = roleRows(trailProvider, 1, minimum),
    partition = densityPartition(trailProvider, 1, minimum),
    components = coreComponentRows(trailProvider, partition).map(ids => ids.map(i => trailObservations[i].id).join(''));
  return <Figure id="D04" sentence={`Counts stay 4,4,4,5,5,4,4,4,3,1. At m=${minimum}, core IDs are ${rows.filter(r => r.core).map(r => r.id).join(', ') || 'none'}; core components ${components.join(' / ') || 'none'}. ${rows.filter(r => r.role === 'border').map(r => r.id).join(', ') || 'No row'} attaches as border.`}><CountBars rows={rows} minimum={minimum} /><Trail rows={rows} /><NumericControl label="Self-inclusive minimum m; radius stays 1" value={minimum} onChange={setMinimum} min={1} max={11} onReset={() => setMinimum(4)} resetValue={4} /><RoleKey /><Table caption="Changed roles, unchanged neighbourhood counts" headers={['ID', 'Count', 'Role', 'Assigned label']} rows={rows.map(r => [r.id, r.count, r.role, r.label])} /></Figure>;
}
function Trace({
  id,
  provider,
  eps,
  minimum,
  initial = 0
}) {
  const result = densityPartition(provider, eps, minimum, {
      trace: true
    }),
    [step, setStep] = useState(initial),
    state = result.states[step],
    rows = provider.observations.map((r, i) => ({
      ...r,
      label: state.labels[i],
      role: state.core[i] === true ? 'core' : state.labels[i] === -1 ? 'noise' : state.labels[i] >= 0 ? 'border' : 'context'
    })),
    current = state.current,
    ids = provider.observations.map(r => r.id),
    operation = state.operation === 'dequeue' && state.visited[current] ? 'dequeue — already visited; no repeated query' : state.operation;
  return <Figure id={id} sentence={`${operation}${current === null ? '' : ` ${ids[current]}`}. Pending: ${state.pending.map(i => ids[i]).join(', ') || 'empty'}. A label of −2 is unvisited/unassigned; −1 is noise; 0 and 1 name groups. Each shown state is one actual trace snapshot.`}><Trail rows={rows} eps={eps} selected={current} counts={false} />{id === 'D09' && <p>C and D remain separate observations at x=1; their mutual length is 0.</p>}<CellStrip label="One queue: pending position slots" values={state.pending.map((i, k) => `${k}: ${ids[i]}`)} /><CellStrip label="Current query roster; empty when no roster is retained" values={state.roster.map(r => `${r.id} · ${number(r.distance)}`)} /><Table caption="Authoritative arrays and query counters at this state" headers={['ID', 'Visited', 'Enqueued', 'Label', 'Core known?', 'Queries']} rows={ids.map((id, i) => [id, String(state.visited[i]), String(state.enqueued[i]), state.labels[i], state.core[i] === null ? 'not queried' : String(state.core[i]), state.queryCounts[i]])} /><Steps step={step} setStep={setStep} last={result.states.length - 1} initial={initial} /><RoleKey /></Figure>;
}
function D05() {
  return <Trace id="D05" provider={trailProvider} eps={1} minimum={4} />;
}
function D06() {
  return <Figure id="D06" sentence="D and E can offer attachment to I. I has count 3 below minimum 4, so its arrow toward E stops at the source. The raw D–E distance is 2; I does not connect the core components."><Canvas height={430} label="Actual D I E coordinates with two permitted attachments and a stopped noncore-source expansion">{({
        width,
        height,
        rem
      }) => {
        const f = rem / 16,
          X = x => 30 * f + (x + 1) * (width - 60 * f) / 2,
          y = 70 * f;
        return <g><line x1={X(-1)} x2={X(1)} y1={y} y2={y} stroke={line} /><Point x={X(-1)} y={y} id="D" role="core" labelX={X(-1)} anchor="middle" /><Point x={X(0)} y={y} id="I" labelX={X(0)} anchor="middle" /><Point x={X(1)} y={y} id="E" role="core" labelX={X(1)} anchor="middle" /><Arrow x1={X(-1) + 12} y1={y + 60 * f} x2={X(0) - 12} y2={y + 60 * f} label="1" color={hues[0]} /><Arrow x1={X(1) - 12} y1={y + 120 * f} x2={X(0) + 12} y2={y + 120 * f} label="1" color={hues[1]} /><line x1={X(0)} x2={X(0) + 20} y1={y + 190 * f} y2={y + 190 * f} stroke={neutral} /><path d={`M${X(0) + 20},${y + 190 * f - 10}v20`} stroke={focus} strokeWidth="3" /><text x={width / 2} y={y + 230 * f} textAnchor="middle">I stops</text><line x1={X(-1)} x2={X(1)} y1={y + 280 * f} y2={y + 280 * f} stroke={focus} /><text x={width / 2} y={y + 310 * f} textAnchor="middle">D–E = 2</text></g>;
      }}</Canvas><CellStrip label="I's whole closed roster" values={['D · 1', 'I · 0', 'E · 1']} /><Table caption="The source's support determines expansion" headers={['Source', 'Count', 'Condition']} rows={[["D", 5, 'core → I allowed'], ["I", 3, 'noncore → E stops'], ["E", 5, 'core → I allowed']]} /></Figure>;
}
function D07() {
  const [reverse, setReverse] = useState(false),
    order = reverse ? [4, 5, 6, 7, 8, 0, 1, 2, 3, 9] : undefined,
    rows = roleRows(trailProvider, 1, 4, order);
  const canonical = rows.map((r, i) => ({
    ...r,
    label: r.label < 0 ? -1 : r.core ? i < 4 ? 0 : 1 : reverse ? 1 : 0
  }));
  return <Figure id="D07" sentence={`${reverse ? 'Right' : 'Left'} component is visited first; I attaches to ${reverse ? 'right E–H' : 'left A–D'}. Core components remain A/B/C/D and E/F/G/H. I does not expand; J remains noise.`}><Trail rows={canonical} selected={8} edges={[[3, 8, hues[0]], [4, 8, hues[1]]]} /><Select label="First seed component" value={reverse ? 'right' : 'left'} onChange={v => setReverse(v === 'right')} options={[["left", "Left A–D first"], ["right", "Right E–H first"]]} onReset={() => setReverse(false)} /><RoleKey /><CellStrip label="Unchanged core-component row sets" values={['left: A/B/C/D', 'right: E/F/G/H']} /></Figure>;
}
function D08() {
  const partition = densityPartition(coincident, .5, 3, {
      trace: true
    }),
    state = partition.states.find(s => s.operation === 'core-seed');
  return <Figure id="D08" sentence="Both alternatives compute the same closed rosters and intended partition. The pair cache retains 25 distances; the query-on-demand route copies coordinates, retains O(n) metadata and one temporary roster. This is storage anatomy, not a measured benchmark."><Canvas height={(_,rem)=>32*rem} label="The complete25 pair lengths are physically stored cells; one highlighted B row is the current distance response">{({width,rem})=>{const cell=width/6;return <g><text x={0} y={rem}>Stored pair cache</text>{partition.ids.map((id,j)=><text key={j} x={(j+1.5)*cell} y={3*rem} textAnchor="middle">{id}</text>)}{partition.ids.map((id,i)=><g key={i}><text x={cell*.5} y={(5+i*4)*rem} textAnchor="middle">{id}</text>{partition.ids.map((_,j)=><g key={j}><rect x={(j+1)*cell+2} y={(3.5+i*4)*rem} width={cell-4} height={2.5*rem} fill={i===1?focus:'none'} fillOpacity={i===1?.15:1} stroke={i===1?focus:line}/><text x={(j+1.5)*cell} y={(5+i*4)*rem} textAnchor="middle">{number(coincident.distance(i,j))}</text></g>)}</g>)}<Arrow x1={width/2} y1={25*rem} x2={width/2} y2={28*rem}/><text x={width/2} y={30*rem} textAnchor="middle">B → one active buffer</text></g>;}}</Canvas><Canvas height={220} label="Only one current B response and retained queue slots, rather than all25 cached distances">{({width,rem})=>{const ids=state.roster.map(row=>row.id),cell=width/ids.length;return <g><text x={0} y={rem}>Current B roster</text>{ids.map((id,i)=><g key={i}><rect x={i*cell+2} y={3*rem} width={cell-4} height={2*rem} fill="none" stroke={focus}/><text x={(i+.5)*cell} y={4.5*rem} textAnchor="middle">{id}</text></g>)}<Arrow x1={width/4} y1={7*rem} x2={3*width/4} y2={7*rem}/><text x={width/2} y={9*rem} textAnchor="middle">process → release → reuse</text><text x={0} y={12*rem}>Input + O(n) metadata stay</text></g>;}}</Canvas><div className="db-pair"><section><h4>Retain all pair lengths and rosters</h4><Table caption="Complete symmetric five-by-five pair cache" headers={['row / column', ...partition.ids]} rows={partition.ids.map((id, i) => [id, ...partition.ids.map((_, j) => number(coincident.distance(i, j)))])} /><CellStrip label="Complete cached rosters at ε=.5" values={partition.ids.map((id, i) => `${id}: ${rosterText(coincident.neighbours(i, .5))}`)} /><p>25 cached entries → O(n²) pair geometry.</p></section><section><h4>Retain inputs and one active response</h4><Table caption="Copied coordinate rows; input state" headers={['ID', 'x', 'y']} rows={coincident.observations.map(r => [r.id, ...r.coordinates])} /><CellStrip label="Temporary B distance vector" values={partition.ids.map((id, i) => `${id}: ${number(coincident.distance(1, i))}`)} /><CellStrip label="Temporary B roster" values={state.roster.map(r => r.id)} /><CellStrip label="One pending queue" values={state.pending.map(i => partition.ids[i])} /><CellStrip label="Visited / enqueued / labels (retained metadata)" values={partition.ids.map((id, i) => `${id}: ${state.visited[i] ? 'visited' : 'unvisited'} / ${state.enqueued[i] ? 'queued' : 'not queued'} / ${state.labels[i]}`)} /><p>Coordinate rows + O(n) metadata; complete labels/core flags are output.</p></section></div></Figure>;
}
function D09() {
  return <Trace id="D09" provider={coincident} eps={.5} minimum={3} />;
}
function RankStrip({
  position,
  minimum
}) {
  const values = trailProvider.rankedDistances(position);
  return <div className="db-rank"><h4>{trailObservations[position].id}: sort by (distance, input position)</h4><ol>{values.map((r, i) => <li key={r.id} className={i === minimum - 1 ? 'is-selected' : ''}><span>Rank {i + 1} · {r.id}</span><strong>{number(r.distance)}</strong><span>{r.distance <= 1 ? 'within ε=1' : 'outside ε=1'}</span></li>)}</ol></div>;
}
function D10() {
  const [minimum, setMinimum] = useState(4),
    a = rankedSupport(trailProvider, minimum);
  return <Figure id="D10" sentence={`Find the rank value: at self-inclusive rank ${minimum}, D needs ${a[3].value} and I needs ${a[8].value}. At fixed radius 1, D is ${a[3].value <= 1 ? 'core' : 'noncore'} and I is ${a[8].value <= 1 ? 'core' : 'noncore'}. Every tie and self at zero remains in the strips.`}><div className="db-pair"><RankStrip position={3} minimum={minimum} /><RankStrip position={8} minimum={minimum} /></div><NumericControl label="Self-inclusive rank m; radius stays 1" value={minimum} onChange={setMinimum} min={1} max={10} onReset={() => setMinimum(4)} resetValue={4} /></Figure>;
}
function SupportRadii({
  eps
}) {
  const values = rankedSupport(trailProvider, 4).sort((a, b) => a.value - b.value || a.position - b.position);
  return <><Canvas height={320} label={`Sorted actual fourth-neighbour radii and radius cut ${eps}; no smoothing`}>{({
        width,
        height,
        rem
      }) => {
        const X = i => 25 + i * (width - 50) / 9,
          Y = v => height - 70 - v * (height - 110) / 2.75;
        return <g><line x1={20} x2={width - 15} y1={Y(eps)} y2={Y(eps)} stroke={focus} strokeDasharray="5 4" /><text x={width - 10} y={Y(eps) - 9} textAnchor="end">ε = {number(eps)}</text><polyline points={values.map((r, i) => `${X(i)},${Y(r.value)}`).join(' ')} fill="none" stroke={neutral} />{values.map((r, i) => <g key={r.id}><circle cx={X(i)} cy={Y(r.value)} r="4" fill={r.value <= eps ? hues[0] : neutral} /><text x={X(i)} y={height - 38} textAnchor="middle">{r.id}</text></g>)}<text x={20} y={height - 5}>Sorted IDs; fixed length ruler 0–2.75</text></g>;
      }}</Canvas><Table caption="Every actual support radius; equality is included" headers={['ID', 'Fourth distance', 'Core at current ε?']} rows={values.map(r => [r.id, r.value, r.value <= eps ? 'yes' : 'no'])} /></>;
}
function D11() {
  const [eps, setEps] = useState(1),
    cores = rankedSupport(trailProvider, 4).filter(r => r.value <= eps);
  return <Figure id="D11" sentence={`At ε=${number(eps)}, fourth-neighbour support qualifies ${cores.map(r => r.id).join(', ') || 'no rows'}. This finite curve diagnoses support; it does not select a universally best elbow.`}><SupportRadii eps={eps} /><NumericControl label="Radius cut ε; rank stays 4" value={eps} onChange={setEps} min={.125} max={2.5} step={.001} onReset={() => setEps(1)} resetValue={1} /></Figure>;
}
function D12() {
  const [eps, setEps] = useState(1),
    rows = roleRows(trailProvider, eps, 4),
    roster = trailProvider.neighbours(8, eps),
    assigned = rows.filter(r => r.label >= 0).length;
  return <Figure id="D12" sentence={`At ε=${number(eps)}, ${assigned}/10 rows are assigned across ${new Set(rows.filter(r => r.label >= 0).map(r => r.label)).size} groups. I's roster is ${rosterText(roster)} (count ${roster.length}); its fourth distance is 1.25, so it is ${rows[8].role}. Closed equality counts.`}><Trail rows={rows} eps={eps} selected={8} /><CellStrip label="Causal roster for I" values={roster.map(r => `${r.id}: ${r.distance}`)} /><NumericControl label="Radius ε; minimum stays 4" value={eps} onChange={setEps} min={.125} max={2.5} step={.001} onReset={() => setEps(1)} resetValue={1} /><RoleKey /><Table caption="Current roles and coverage" headers={['ID', 'Count', 'Role', 'Group / noise']} rows={rows.map(r => [r.id, r.count, r.role, r.label])} /></Figure>;
}
export const foundationDrawings = {
  D01,
  D02,
  D03,
  D04,
  D05,
  D06,
  D07,
  D08,
  D09,
  D10,
  D11,
  D12
};
