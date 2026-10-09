import React, { useState } from 'react';
import { mutualExample, fourProvider, fourCores, fourPrim, fourCompleteEdges, thresholdComponents, buildHierarchy, DisjointSet } from '../../../data/dbscan-reading-flow/dbscan-hierarchy-models.mjs';
import { Figure, Canvas, Trail, Point, Arrow, CellStrip, Table, NumericControl, Steps, number, hues, focus, line, neutral } from './DbscanDrawingPrimitives.jsx';
function MutualOperands({
  state
}) {
  return <Canvas height={600} label="Both ranked-neighbour disks on the same physical trail line; two endpoint core radii and raw distance enter one symmetric maximum">
    {({
      width,
      rem
    }) => {
      const scale=Math.min((width-4*rem)/4.25,14*rem/3),X=value=>width/2+(value+.375)*scale,y=9*rem,xI=state.observations[8].coordinates[0];
      return <g><text x={0} y={rem}>Same physical ruler</text><line x1={X(-2.5)} x2={X(1.75)} y1={y} y2={y} stroke={line}/>{[3,8].map((row,i)=><g key={row}><circle cx={X(state.observations[row].coordinates[0])} cy={y} r={state.cores[row]*scale} fill={hues[i]} fillOpacity=".06" stroke={hues[i]} strokeWidth="2"/><line x1={X(state.observations[row].coordinates[0])} x2={X(state.observations[row].coordinates[0]+state.cores[row])} y1={y} y2={y} stroke={hues[i]} strokeWidth="2"/></g>)}<line x1={X(-1)} x2={X(xI)} y1={y} y2={y} stroke={neutral} strokeWidth="3" strokeDasharray="4 3"/><Point x={X(-1)} y={y} id="D" group={0} labelX={X(-1)-rem} labelY={y-rem}/><Point x={X(xI)} y={y} id="I" group={1} labelX={X(xI)+rem} labelY={y-rem}/><text x={0} y={18*rem}>D at −1; I at {number(xI)}</text>{[`D core ${number(state.cores[3])}`,`I core ${number(state.cores[8])}`,`raw D–I ${number(state.raw)}`].map((label,i)=><g key={i}><text x={0} y={(21+i*3)*rem}>{label}</text><Arrow x1={width*.8} y1={(21.5+i*3)*rem} x2={width*.5} y2={31*rem} color={i===2?neutral:hues[i]}/></g>)}<ellipse cx={width*.5} cy={32*rem} rx={3*rem} ry={1.5*rem} fill="#111" stroke={focus}/><text x={width*.5} y={32.3*rem} textAnchor="middle">max {number(state.weight)}</text><text x={0} y={36*rem}>Undirected: D ↔ I</text></g>;
    }}
  </Canvas>;
}
function D33() {
  const [position, setPosition] = useState(0),
    state = mutualExample(position);
  return <Figure id="D33" sentence={`I at ${number(position)}: D core ${number(state.cores[3])}, I core ${number(state.cores[8])}, raw D–I ${number(state.raw)}. Mutual weight ${number(state.weight)}, controlled by ${state.controlling.join(' and ')}. Reversing endpoints gives the same maximum. All core radii count self, minimum 4.`}>
    <MutualOperands state={state} /><NumericControl label="I’s physical position; other trail rows stay fixed" value={position} onChange={setPosition} min={-.5} max={.5} step={.01} resetValue={0} onReset={() => setPosition(0)} />
    <Table caption="Current ranked support and complete closed support rosters" headers={['Endpoint', 'Fourth-neighbour radius', 'IDs at that radius']} rows={[3, 8].map(row => [state.observations[row].id, number(state.cores[row]), state.provider.neighbours(row, state.cores[row]).map(x => x.id).join(', ')])} />
    <CellStrip label="Unchanged second edge: A–B has both endpoint operands" values={['A core .75', 'B core .5', 'raw .25', 'max .75 in either direction']} />
    <p>For the separately named contrib convention, self-inclusive m corresponds to m−1 other neighbours. The same integer is not the same contract.</p>
  </Figure>;
}
function Bridge({
  mutual = false,
  cut = 1
}) {
  return <Canvas height={270} label={`${mutual ? 'Mutual' : 'Raw'} D–I–E bridge at cut ${cut}; I stays visible even when excluded from core-only components`}>
    {({
      width,
      rem
    }) => {
      const xs = [2 * rem, width / 2, width - 2 * rem],
        y = 6 * rem,
        weight = mutual ? 1.25 : 1;
      return <g>{[0, 1].map(i => <g key={i}><line x1={xs[i]} x2={xs[i + 1]} y1={y} y2={y} stroke={weight <= cut ? hues[0] : line} strokeDasharray={weight <= cut ? undefined : '5 4'} strokeWidth="3" /><text x={(xs[i] + xs[i + 1]) / 2} y={y - 2 * rem} textAnchor="middle">{weight}</text></g>)}{['D', 'I', 'E'].map((id, i) => <Point key={id} x={xs[i]} y={y} id={id} labelX={xs[i]} labelY={y + 2 * rem} anchor="middle" role={i === 1 && cut < 1.25 ? 'border' : 'core'} group={i === 1 ? -1 : i === 0 ? 0 : 1} />)}<text x={0} y={2 * rem}>{mutual ? 'Symmetric mutual edges' : 'Raw edges'}</text><text x={0} y={11 * rem}>cut {cut}; core(I) = 1.25</text><text x={0} y={14 * rem}>{mutual && cut === 1 ? 'I excluded from core-only sets' : 'Both links pass at equality'}</text></g>;
    }}
  </Canvas>;
}
function D34() {
  return <Figure id="D34" sentence="At cut 1 the raw D–I–E chain connects, while mutual edges each require 1.25. I is still an observation, excluded from the core-only partition at 1; ordinary DBSCAN can attach it as border. At the closed cut 1.25, both mutual edges qualify.">
    <Bridge /><Bridge mutual /><Bridge mutual cut={1.25} />
    <CellStrip label="At cut 1: core-only sets and separate excluded row" values={['left core component: A–D', 'right core component: E–H', 'I: noncore; not a singleton density group', 'J: outside core structure']} />
  </Figure>;
}
export function FourGraph({
  edges = fourCompleteEdges,
  cut = Infinity,
  admitted = null,
  candidates = null,
  highlight = [],
  omitted = null,
  label = 'Four physical positions with weighted graph edges'
}) {
  const groups = thresholdComponents(4, edges, cut),
    rows = fourProvider.observations;
  return <Canvas height={400} label={label}>
    {({
      width,
      rem
    }) => {
      const X = value => 2 * rem + value / 5 * (width - 4 * rem),
        base = 19 * rem,
        display = omitted ? [...edges, omitted] : edges;
      return <g>{display.map((edge, i) => {
          const a = X(rows[edge.left].coordinates[0]),
            b = X(rows[edge.right].coordinates[0]),
            middle = (a + b) / 2,
            ly = (3 + i * 2) * rem,
            kept = edge.weight <= cut,
            marked = highlight.some(([left, right]) => left === edge.left && right === edge.right),
            isOmitted = omitted === edge;
          return <g key={`${edge.left}-${edge.right}`}><path d={`M${a},${base}Q${middle},${2 * ly - base} ${b},${base}`} fill="none" stroke={marked ? focus : kept ? hues[0] : line} strokeWidth={marked ? 3 : 1.5} strokeDasharray={isOmitted || !kept ? '5 4' : undefined} /><text x={middle} y={ly - .5 * rem} textAnchor="middle">{number(edge.weight)}</text></g>;
        })}<line x1={X(0)} x2={X(5)} y1={base} y2={base} stroke={line} />{rows.map((row, i) => {
          const group = groups.findIndex(set => set.includes(i));
          return <g key={row.id}><Point x={X(row.coordinates[0])} y={base} id={row.id} role="context" group={group} selected={admitted?.[i]} labelX={X(row.coordinates[0])} labelY={base + 2 * rem} anchor="middle" /><text x={X(row.coordinates[0])} y={base + 4 * rem} textAnchor="middle">{row.coordinates[0]}</text></g>;
        })}<text x={0} y={24.5 * rem}>Physical position →</text>{candidates && candidates.map((parent, row) => parent >= 0 && !admitted[row] && <Arrow key={row} x1={X(rows[parent].coordinates[0])} y1={base + rem} x2={X(rows[row].coordinates[0])} y2={base + rem} color={hues[row % 4]} />)}</g>;
    }}
  </Canvas>;
}
function D35() {
  const [cut, setCut] = useState(1),
    full = thresholdComponents(4, fourCompleteEdges, cut),
    tree = thresholdComponents(4, fourPrim.edges, cut),
    names = groups => groups.map(group => `{${group.map(i => `v${i}`).join(', ')}}`).join(' ');
  return <Figure id="D35" sentence={`Closed cut ${number(cut)}: complete graph ${names(full)}; tree ${names(tree)}. Their components agree, though their edge sets differ. The tree has n−1 = 3 edges, total 1+3+1 = 5. Condensation later requires strictly positive finite merge lengths.`}>
    <p>Complete mutual graph; all four self-inclusive cores are 1.</p><FourGraph cut={cut} /><p>Maintained minimum spanning tree on the same physical ruler.</p><FourGraph edges={fourPrim.edges} cut={cut} />
    <NumericControl label="Closed edge cut" value={cut} onChange={setCut} min={.1} max={5} step={.01} resetValue={1} onReset={() => setCut(1)} />
    <CellStrip label="Same stable row sets in both representations" values={full.map(group => group.map(i => `v${i}`).join(', '))} />
  </Figure>;
}
function D36() {
  return <Figure id="D36" sentence="The omitted v0–v2 edge weighs 4. Its tree path v0 → v1 → v2 has weights 1 and 3, so its bottleneck is 3 ≤ 4. Replacing a hypothetical heavier bottleneck with a lighter omitted edge would contradict minimum total. Tied equality preserves connectivity without making the tree unique.">
    <FourGraph edges={fourPrim.edges} highlight={[[0, 1], [1, 2]]} omitted={{
      left: 0,
      right: 2,
      weight: 4
    }} label="Omitted length4 edge and highlighted real length1/3 tree path" />
    <Canvas height={170} label="Actual path bracket and its maximum weight">
      {({
        width,
        rem
      }) => <g><path d={`M${rem},${2 * rem}v${rem}H${width - rem}v${-rem}`} fill="none" stroke={focus} /><text x={width / 2} y={5 * rem} textAnchor="middle">max(1, 3) = 3 ≤ 4</text><text x={0} y={8 * rem}>v0 → v1 → v2</text></g>}
    </Canvas>
    <p>The strict “larger bottleneck” contradiction is hypothetical. This actual path already satisfies the inequality; the argument does not establish invariant DBCV anatomy for tied trees.</p>
  </Figure>;
}
function D37() {
  const [step, setStep] = useState(3),
    frame = fourPrim.trace[step],
    row = frame.row;
  return <Figure id="D37" sentence={`${frame.operation === 'admit' ? `Admit v${row} through its minimum current key ${number(frame.best[row])}` : `Update v${row}: key ${number(frame.previous.key)} → ${number(frame.best[row])}, parent ${frame.previous.parent < 0 ? 'none' : `v${frame.previous.parent}`} → v${frame.parent[row]}`}. Amber outlines show admitted vertices. Ties use input position; complete trace copies are teaching output beyond the maintained production arrays.`}>
    <FourGraph edges={frame.edges} admitted={frame.included} candidates={frame.parent} label="Admitted set, admitted tree edges and current candidate-parent arrows" />
    <Steps step={step} setStep={setStep} initial={3} last={fourPrim.trace.length - 1} />
    <Table caption="One current best key and parent per unadmitted input row" headers={['Stable ID', 'Input position', 'Admitted?', 'Best key', 'Parent']} rows={frame.included.map((value, i) => [`v${i}`, i, String(value), number(frame.best[i]), frame.parent[i] < 0 ? 'none' : `v${frame.parent[i]}`])} />
    <p>Only the newly admitted row proposes candidate improvements. The drawing retains unchanged keys and does not rescan all earlier crossing pairs.</p>
  </Figure>;
}
function D38() {
  const [step, setStep] = useState(0),
    tree = buildHierarchy(4, fourPrim.edges),
    event = step ? tree.events[step - 1] : null,
    cut = event?.distance ?? .5,
    groups = thresholdComponents(4, fourPrim.edges, cut),
    dsu = new DisjointSet(4);
  dsu.union(0, 1);
  const before = dsu.count,
    repeated = dsu.union(0, 1);
  return <Figure id="D38" sentence={`${event ? `Whole distance-${event.distance} batch admits ${event.batch.length} edge${event.batch.length === 1 ? '' : 's'}` : 'Before the first distance-1 event, all four vertices are separate'}. ${groups.length} threshold components. DSU representatives address integer storage; structural node IDs address merged objects. Repeated union(v0,v1) returns ${String(repeated)} and leaves count ${before} unchanged.`}>
    <FourGraph edges={fourPrim.edges} cut={cut} /><Steps step={step} setStep={setStep} last={tree.events.length} />
    <CellStrip label="Equal-weight event; both distance-1 edges enter together" values={event ? event.batch.map(edge => `v${edge.left}–v${edge.right}: ${edge.weight}`) : ['no admitted edge']} />
    <Table caption="Stable IDs map through integer positions to current DSU representatives" headers={['Stable ID', 'Position', 'Representative']} rows={Array.from({
      length: 4
    }, (_, i) => [`v${i}`, i, event?.representatives[i] ?? i])} />
    <Table caption="Representative → structural component node; counts are cached" headers={['Representative', 'Structural node', 'Child nodes', 'Count']} rows={event ? event.nodeForRoot.map(([root, node]) => [root, node, tree.nodes[node].children.join(', '), tree.nodes[node].count]) : Array.from({
      length: 4
    }, (_, i) => [i, i, 'leaf', 1])} />
    <p>There is no positive-lived branch between the two weight-1 unions. These records describe the complete equal-weight event.</p>
  </Figure>;
}
export const treeDrawings = {
  D33,
  D34,
  D35,
  D36,
  D37,
  D38
};
