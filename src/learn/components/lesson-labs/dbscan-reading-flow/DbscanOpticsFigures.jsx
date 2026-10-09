import React, { useState } from 'react';
import { trailObservations } from '../../../data/dbscan-reading-flow/dbscan-neighbourhood-models.mjs';
import { trailGraph, mainXiGraph, mainXiPositions, rightXiGraph, outsideXiGraph, earlierBorderGraph, radiusExtraction, xiExtract, transitionFlags, extendRegion, heapFrames, proposalImproves } from '../../../data/dbscan-reading-flow/dbscan-optics-models.mjs';
import { Figure, Canvas, Trail, Plane, Point, Arrow, Table, CellStrip, NumericControl, Steps, number, hues, focus, line, neutral } from './DbscanDrawingPrimitives.jsx';
const letter = row => String.fromCharCode(65 + row);
const identity = row => String(row);

// Finite distances share one ruler. On narrow/text-enlarged views the ordered
// positions become rows and distance runs horizontally; no text is scaled down.
export function OrderingPlot({
  graph,
  name = identity,
  selected = -1,
  prefix = Infinity,
  cut = null,
  cores = false,
  span = null,
  spans = [],
  labels = null,
  sentinel = false,
  steep = null,
  markedPositions = []
}) {
  const n = graph.order.length,
    finite = graph.reach.filter(Number.isFinite),
    maximum = Math.max(1, ...finite, ...(cores ? graph.core.filter(Number.isFinite) : []), cut ?? 0) * 1.1;
  return <>{steep && <p className="db-ordering-key">Each edge #i → #(i+1) follows processing order: left to right in columns, top to bottom in rows. ↓ means a steep reachability decrease; ↑ a steep increase; · neither. These arrows describe height changes, not screen direction.{sentinel && <> The closing ∞ has no observation ID.</>}</p>}<Canvas height={(width, rem) => width / rem < 40 ? (4.4 + graph.order.reduce((sum, _, i) => sum + 3.5 + (steep && i < steep.down.length ? 1.5 : 0) + spans.reduce((count, [start, end]) => count + (i === start ? 1 : 0) + (i === end ? 1 : 0), 0) * 1.4, 0) + (sentinel ? 2 : 0) + (cut !== null ? 2 : 0)) * rem : (22 + spans.length * 2.3) * rem} label={`Processing positions and reachability distance; ${sentinel ? 'closing infinity has no observation ID; ' : ''}${cores ? 'short ticks mark core radii; ' : ''}infinity means restart, outside the finite ruler`}>
    {({
      width,
      height,
      rem
    }) => {
      const vertical = width / rem < 40;
      if (vertical) {
        // Reachability stays on a common horizontal ruler. Additional lines are
        // allocated to the actual ordered edge and each interval endpoint.
        const endpoints = i => spans.flatMap(([start, end], j) => [
          ...(i === start ? [{index:j, start, end, role:'start'}] : []),
          ...(i === end ? [{index:j, start, end, role:'end'}] : [])
        ]),
          hasEdge = i => steep && i < steep.down.length,
          rowUnits = graph.order.map((_, i) => 3.5 + (hasEdge(i) ? 1.5 : 0) + endpoints(i).length * 1.4),
          x0 = 5 * rem,
          x1 = width - Math.max(2, spans.length * .7 + 1) * rem,
          Y = i => (3.4 + rowUnits.slice(0, i).reduce((sum, value) => sum + value, 0)) * rem,
          X = value => x0 + value / maximum * (x1 - x0);
        return <g data-ordering-layout="rows"><text x={x0} y={rem}>distance →</text><text x={x0} y={2.3 * rem}>0</text><text x={x1} y={2.3 * rem} textAnchor="end">{number(maximum)}</text><line x1={x0} x2={x1} y1={2.6 * rem} y2={2.6 * rem} stroke={line} />{cut !== null && <line x1={X(cut)} x2={X(cut)} y1={2.6 * rem} y2={Y(n) - rem} stroke={focus} strokeDasharray="5 4" />}{graph.order.map((row, i) => {
            const reach = graph.reach[row],
              y = Y(i),
              color = hues[row % hues.length],
              inside = span && i >= span[0] && i <= span[1];
            return <g key={row} opacity={i < prefix ? 1 : .65}>{inside && <rect x={0} y={y - rem} width={width} height={2.8 * rem} fill={focus} fillOpacity=".08" stroke={focus} />}<text x={0} y={y}>#{i}</text><text x={0} y={y + 1.3 * rem}>ID {name(row)}</text>{Number.isFinite(reach) ? <><rect x={x0} y={y - .6 * rem} width={X(reach) - x0} height={.7 * rem} fill={color} /><text x={x0} y={y + 1.2 * rem}>{number(reach)}</text></> : <text x={x0} y={y}>∞ restart</text>}{cores && Number.isFinite(graph.core[row]) && <line x1={X(graph.core[row])} x2={X(graph.core[row])} y1={y - .9 * rem} y2={y + .5 * rem} stroke={neutral} strokeWidth="3" />}{selected === i && <rect x={0} y={y - rem} width={width} height={2.8 * rem} fill="none" stroke={focus} strokeWidth="2" />}{markedPositions.includes(i) && Number.isFinite(reach) && <circle cx={X(reach)} cy={y - .25 * rem} r={.65 * rem} fill="none" stroke={focus} strokeWidth="2" />}{labels && <text x={x1} y={y + 1.2 * rem} textAnchor="end">g {labels[row]}</text>}{hasEdge(i) && <text x={0} y={y + 2.7 * rem} data-transition-edge={i}>edge #{i} → {i + 1 < n ? '#'+(i+1) : 'closing ∞'}: {steep.down[i] ? '↓' : steep.up[i] ? '↑' : '·'}</text>}{endpoints(i).map((endpoint, k) => <text key={endpoint.index+'-'+endpoint.role} x={0} y={y + ((hasEdge(i) ? 4.2 : 2.7) + k * 1.4) * rem} data-interval-endpoint={endpoint.index+'-'+endpoint.role}>I{endpoint.index + 1} [{endpoint.start}, {endpoint.end}] {endpoint.role} #{i}</text>)}</g>;
          })}{spans.map(([start, end], j) => {
            const x = width - (j * .7 + .35) * rem;
            return <path key={j} data-interval-rail={j} d={`M${x-.25*rem},${Y(start)-rem}h${.25*rem}V${Y(end)+1.7*rem}h${-.25*rem}`} fill="none" stroke={hues[j % hues.length]} strokeWidth="2" />;
          })}{sentinel && <text x={0} y={Y(n)}>∞ closing boundary; no ID</text>}{cut !== null && <text x={0} y={height - rem}>Amber cut: ε = {number(cut)}</text>}</g>;
      }
      const left = 3.5 * rem,
        right = width - 1.5 * rem,
        top = 4 * rem,
        bottom = 17 * rem,
        slot = (right - left) / n,
        X = i => left + (i + .5) * slot,
        Y = value => bottom - value / maximum * (bottom - top);
      return <g><line x1={left} x2={right} y1={bottom} y2={bottom} stroke={line} /><line x1={left} x2={left} y1={top} y2={bottom} stroke={line} /><text x={0} y={top - rem}>distance</text>{[0, maximum / 2, maximum].map(value => <text key={value} x={left - .4 * rem} y={Y(value) + .3 * rem} textAnchor="end">{number(value, 1)}</text>)}{cut !== null && <g><line x1={left} x2={right} y1={Y(cut)} y2={Y(cut)} stroke={focus} strokeDasharray="5 4" /><text x={right} y={Y(cut) - .4 * rem} textAnchor="end">ε {number(cut)}</text></g>}{graph.order.map((row, i) => {
          const reach = graph.reach[row],
            x = X(i),
            inside = span && i >= span[0] && i <= span[1];
          return <g key={row} opacity={i < prefix ? 1 : .65}>{inside && <rect x={x - slot * .45} y={top - rem} width={slot * .9} height={bottom - top + 3.8 * rem} fill={focus} fillOpacity=".08" />}{Number.isFinite(reach) ? <><rect x={x - slot * .18} y={Y(reach)} width={slot * .36} height={bottom - Y(reach)} fill={hues[row % hues.length]} /><text x={x} y={Y(reach) - .5 * rem} textAnchor="middle">{number(reach)}</text></> : <text x={x} y={top - 1.5 * rem} textAnchor="middle">∞</text>}{markedPositions.includes(i) && Number.isFinite(reach) && <circle cx={x} cy={Y(reach)} r={.65 * rem} fill="none" stroke={focus} strokeWidth="2" />}{cores && Number.isFinite(graph.core[row]) && <line x1={x - slot * .3} x2={x + slot * .3} y1={Y(graph.core[row])} y2={Y(graph.core[row])} stroke={neutral} strokeWidth="3" />}<text x={x} y={bottom + 1.4 * rem} textAnchor="middle">{name(row)}</text><text x={x} y={bottom + 2.8 * rem} textAnchor="middle">#{i}</text>{selected === i && <rect x={x - slot * .45} y={top - 2 * rem} width={slot * .9} height={bottom - top + 5.3 * rem} fill="none" stroke={focus} strokeWidth="2" />}{steep && i < steep.down.length && <text x={x} y={bottom + 4.2 * rem} textAnchor="middle" data-transition-edge={i} aria-label={`edge #${i} → ${i+1<n ? "#"+(i+1) : "closing ∞"}`}>{steep.down[i] ? '↓' : steep.up[i] ? '↑' : '·'}</text>}</g>;
        })}{sentinel && <text x={right} y={top - 3 * rem} textAnchor="end">Closing ∞: no ID</text>}{spans.map(([start, end], i) => <g key={i}><path d={`M${X(start) - slot * .35},${(22 + i * 2.3) * rem}v${-.6 * rem}H${X(end) + slot * .35}v${.6 * rem}`} fill="none" stroke={hues[i % hues.length]} strokeWidth="2" /><text x={(X(start) + X(end)) / 2} y={(23 + i * 2.3) * rem} textAnchor="middle">[{start}, {end}]</text></g>)}</g>;
    }}
  </Canvas></>;
}
function MaxProposal({
  source,
  core,
  raw,
  result,
  group
}) {
  return <Canvas height={240} label={`Source ${source}: maximum of its core radius ${core} and raw edge ${raw}, giving directed proposal ${result}`}>
    {({
      width,
      rem
    }) => <g><text x={0} y={2 * rem}>{source} core {core}</text><text x={0} y={5 * rem}>raw edge {raw}</text><Arrow x1={rem} y1={3 * rem} x2={width / 2 - 2 * rem} y2={7 * rem} color={hues[group]} /><Arrow x1={rem} y1={6 * rem} x2={width / 2 - 2 * rem} y2={7 * rem} color={neutral} /><circle cx={width / 2} cy={8 * rem} r={2 * rem} fill="none" stroke={hues[group]} /><text x={width / 2} y={8.3 * rem} textAnchor="middle">max</text><Arrow x1={width / 2 + 2 * rem} y1={8 * rem} x2={width - rem} y2={11 * rem} color={hues[group]} /><text x={width - rem} y={13 * rem} textAnchor="end">{source} → {source === 'D' ? 'I' : 'D'}: {result}</text></g>}
  </Canvas>;
}
function D22() {
  const rows = [{
    id: 'D',
    coordinates: [-1, 0],
    label: 0,
    dy: -12
  }, {
    id: 'I',
    coordinates: [0, 0],
    label: 1,
    dy: -12
  }];
  return <Figure id="D22" sentence="D → I proposes max(.75, 1) = 1; I → D proposes max(1.25, 1) = 1.25. The raw edge is the same length 1. Direction selects the source core radius, so this proposal is asymmetric.">
    <div className="db-pair"><div><p>D supplies its own .75 radius</p><Plane rows={rows} domain={[-2.5, 1.5, -1.5, 1.5]} disk={{
          x: -1,
          y: 0,
          radius: .75
        }} links={[{
          a: 0,
          b: 1,
          color: hues[0]
        }]} /><MaxProposal source="D" core={.75} raw={1} result={1} group={0} /></div><div><p>I supplies its own 1.25 radius</p><Plane rows={rows} domain={[-2.5, 1.5, -1.5, 1.5]} disk={{
          x: 0,
          y: 0,
          radius: 1.25
        }} links={[{
          a: 0,
          b: 1,
          color: hues[1]
        }]} /><MaxProposal source="I" core={1.25} raw={1} result={1.25} group={1} /></div></div>
  </Figure>;
}
function HeapTree({
  frame
}) {
  return <Canvas height={340} label={`${frame.operation}; parent-child edges are determined by current indexed slots`}>
    {({
      width,
      rem
    }) => {
      const x = i => i === 0 ? width / 2 : i === 1 ? width * .25 : i === 2 ? width * .75 : width * .12,
        y = i => (i === 0 ? 3 : i < 3 ? 10 : 17) * rem;
      return <g>{frame.slots.map((id, i) => i > 0 && <line key={id} x1={x(Math.floor((i - 1) / 2))} y1={y(Math.floor((i - 1) / 2))} x2={x(i)} y2={y(i)} stroke={line} />)}{frame.slots.map((id, i) => <g key={id}><circle cx={x(i)} cy={y(i)} r={1.8 * rem} fill="#111" stroke={hues[['R', 'S', 'Q', 'T'].indexOf(id)]} strokeWidth="2" /><text x={x(i)} y={y(i) - .2 * rem} textAnchor="middle">{id}</text><text x={x(i)} y={y(i) + 1.1 * rem} textAnchor="middle">{number(frame.keys[id])}</text><text x={x(i)} y={y(i) + 3 * rem} textAnchor="middle">slot {i}</text></g>)}</g>;
    }}
  </Canvas>;
}
function D23() {
  const [step, setStep] = useState(0),
    frame = heapFrames[step];
  return <Figure id="D23" sentence={`${frame.operation}. ${frame.committed ? 'Committed heap: every parent key is no larger than either child.' : 'Transient operation: priority repair is still pending.'} Q predecessor is ${frame.predecessor.Q}; Q inverse position is ${frame.inverse.Q ?? 'absent'}.`}>
    <HeapTree frame={frame} /><Steps step={step} setStep={setStep} last={heapFrames.length - 1} />
    <CellStrip label="Pending slot → row" values={frame.slots.map((id, i) => `${i} → ${id}: ${frame.keys[id]}`)} />
    <Table caption="The same primitive state supplies the inverse and predecessor tables" headers={['Row', 'Inverse slot', 'Key', 'Predecessor']} rows={['R', 'S', 'Q', 'T'].map(id => [id, frame.inverse[id] ?? 'absent', frame.keys[id], frame.predecessor[id] ?? 'none'])} />
    <p>P core .5 and distance P–Q .25 propose max(.5, .25) = .5. Relative to the initial Q key 2, proposals 2.5 and 2 both leave its key, predecessor A and slot 2 unchanged: strict improvement is {String(proposalImproves(2, 2.5))} and {String(proposalImproves(2, 2))}.</p>
    <CellStrip label="Different optional lazy queue: two Q entries require a stale-entry rule" values={['(.5, Q): authoritative best', '(2, Q): stale; discard on extraction']} />
  </Figure>;
}
function D24() {
  const [step, setStep] = useState(0),
    row = trailGraph.order[step];
  return <Figure id="D24" sentence={`Processed prefix ends at position ${step}, ID ${letter(row)}; reachability ${number(trailGraph.reach[row])}. These are retained ordering and height values. The old output did not retain a full predecessor vector; no predecessor is inferred from adjacent bars.`}>
    <Trail rows={trailObservations.map((row, i) => ({
      ...row,
      label: i % 4
    }))} selected={row} interval={false} />
    <OrderingPlot graph={trailGraph} name={letter} selected={step} prefix={step + 1} /><Steps step={step} setStep={setStep} last={9} />
    <CellStrip label="Ordered position → stable ID; this is not a spatial axis" values={trailGraph.order.map((row, i) => `${i} → ${letter(row)}`)} selected={step} />
  </Figure>;
}
function D25() {
  const [bounded, setBounded] = useState(false),
    graph = {
      order: [0, 1, 2, 3],
      reach: [Infinity, 1, bounded ? Infinity : 3, 1],
      core: [1, 1, 1, 1]
    },
    rows = [0, 1, 4, 5].map((x, i) => ({
      id: `v${i}`,
      coordinates: [x],
      label: i
    }));
  return <Figure id="D25" sentence={`Construction cap ${bounded ? '1 omits the length-3 edge and makes v2 restart' : '∞ retains the length-3 edge between v1 and v2'}. All four core radii remain 1. This changes graph information, not the ruler on a plot.`}>
    <Trail rows={rows} interval={false} edges={[[0, 1], [1, 2, bounded ? line : focus], [2, 3]]} /><CellStrip label="Raw connecting lengths" values={['v0–v1: 1', 'v1–v2: 3', 'v2–v3: 1']} />
    <OrderingPlot graph={graph} name={row => `v${row}`} cores />
    <div className="db-controls"><label className="db-field">Construction cap<select value={bounded ? '1' : 'infinity'} onChange={e => setBounded(e.target.value === '1')}><option value="infinity">∞: all distances</option><option value="1">1: closed cap</option></select></label><button onClick={() => setBounded(false)}>Reset</button></div>
  </Figure>;
}
function D26() {
  const [eps, setEps] = useState(1),
    result = radiusExtraction(trailGraph, eps),
    groups = new Set(result.labels.filter(x => x >= 0)).size,
    assigned = result.labels.filter(x => x >= 0).length;
  return <Figure id="D26" sentence={`Cut ε = ${number(eps)} within construction cap 2 yields ${groups} groups and ${assigned}/10 assigned rows. A low core radius can start a group above the reachability cut. The forward scan retains its stated earlier-border limitation.`}>
    <OrderingPlot graph={trailGraph} name={letter} cut={eps} cores labels={result.labels} />
    <NumericControl label="Extraction radius ε; graph cap 2" value={eps} onChange={setEps} min={.01} max={2} step={.01} resetValue={1} onReset={() => setEps(1)} />
    <Table caption="Each scan branch is written at the original input ID" headers={['ID', 'Reachability', 'Core radius', 'Operation', 'Label']} rows={result.events.map(event => [letter(event.row), number(trailGraph.reach[event.row]), number(trailGraph.core[event.row]), event.operation, result.labels[event.row]])} />
  </Figure>;
}
function D27() {
  const [step, setStep] = useState(0),
    result = radiusExtraction(earlierBorderGraph, 2),
    event = result.events[step],
    rows = [0, 2, 3, 4].map((x, i) => ({
      id: 'abcd'[i],
      coordinates: [x],
      label: 0,
      role: i ? 'core' : 'border'
    }));
  return <Figure id="D27" sentence={`Scan ${'abcd'[event.row]}: ${event.operation}. Extracted final labels are [−1, 0, 0, 0]; direct DBSCAN labels are [0, 0, 0, 0]. b can attach a as border in direct expansion; the forward extraction never rewrites its earlier noise assignment.`}>
    <Trail rows={rows} eps={2} selected={1} /><p>b’s closed interval [0, 4] includes all four rows; a’s [−2, 2] includes a and b only.</p>
    <OrderingPlot graph={earlierBorderGraph} name={row => 'abcd'[row]} cut={2} cores selected={step} prefix={step + 1} /><Steps step={step} setStep={setStep} last={3} />
    <CellStrip label="Current extraction writes, in input order" values={event.labels.map((label, i) => `${'abcd'[i]}: ${i > step ? 'unvisited' : label}`)} />
    <Canvas height={180} label="Direct DBSCAN has a genuine b to a border attachment; the extraction chronology has no backward arrow">
      {({
        width,
        rem
      }) => <g><Point x={width - 2 * rem} y={3 * rem} id="b" role="core" group={0} /><Point x={2 * rem} y={3 * rem} id="a" role="border" group={0} /><Arrow x1={width - 3 * rem} y1={3 * rem} x2={3 * rem} y2={3 * rem} color={hues[0]} /><text x={0} y={6 * rem}>Direct expansion: b attaches a</text><text x={0} y={9 * rem}>Extraction: a → b → c → d</text></g>}
    </Canvas>
  </Figure>;
}
function D28() {
  return <Figure id="D28" sentence="At ξ = .2, .8 → .6 declines by .2/.8 = .25 and passes; .8 → .75 declines by .05/.8 = .0625 and fails. Equality at .64 = .8 × .8 passes. Infinity/infinity and zero/zero are undefined transitions, without a substituted small number.">
    <Canvas height={340} label="Two pairs of bars share a zero-to-one reachability ruler and the same .64 retained-height reference">
      {({
        width,
        rem
      }) => {
        const y = value => (17 - 12 * value) * rem,
          w = width / 6;
        return <g><line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke={line} /><line x1={0} x2={width} y1={y(.64)} y2={y(.64)} stroke={focus} strokeDasharray="5 4" /><text x={0} y={2 * rem}>Reachability distance</text><text x={0} y={4 * rem}>.64 threshold</text>{[.8, .6, .8, .75].map((value, i) => <g key={i}><rect x={(i + (i > 1 ? 1 : 0)) * .9 * w + w * .3} y={y(value)} width={w * .35} height={y(0) - y(value)} fill={hues[i < 2 ? 0 : 1]} /><text x={(i + (i > 1 ? 1 : 0)) * .9 * w + w * .48} y={y(value) - .6 * rem} textAnchor="middle">{value}</text></g>)}<text x={width * .2} y={20 * rem} textAnchor="middle">25%: pass</text><text x={width * .75} y={20 * rem} textAnchor="middle">6.25%: fail</text></g>;
      }}
    </Canvas>
    <CellStrip label="Boundary arithmetic is explicit" values={['∞/∞: undefined', '0/0: undefined', 'ξ: dimensionless', 'heights: distance units']} />
  </Figure>;
}
export function CoordinateRuler({
  positions,
  names = positions.map((_, i) => String(i)),
  label = 'Physical coordinates, with leaders separating nearby labels'
}) {
  return <Canvas height={(width, rem) => (positions.length * 3.5 + 5) * rem} label={label}>
    {({
      width,
      height,
      rem
    }) => {
      const min = Math.min(...positions),
        max = Math.max(...positions),
        Y = value => height - 3 * rem - (value - min) / (max - min || 1) * (height - 6 * rem),
        labelY = i => (3 + i * 3.5) * rem,
        ordered = positions.map((x, i) => ({
          x,
          i
        })).sort((a, b) => b.x - a.x);
      return <g><line x1={2 * rem} x2={2 * rem} y1={3 * rem} y2={height - 3 * rem} stroke={line} /><text x={0} y={1.5 * rem}>physical x</text>{ordered.map((row, j) => <g key={row.i}><circle cx={2 * rem} cy={Y(row.x)} r="5" fill={hues[row.i % 4]} /><line x1={2.5 * rem} y1={Y(row.x)} x2={width / 2} y2={labelY(j)} stroke={hues[row.i % 4]} /><text x={width / 2 + .5 * rem} y={labelY(j) + .3 * rem}>ID {names[row.i]}: {row.x}</text></g>)}</g>;
    }}
  </Canvas>;
}
function PhysicalXiRows() {
  return <CoordinateRuler positions={mainXiPositions} />;
}
function EventAreas({
  event,
  graph
}) {
  return <Table caption="Active down regions read maxima from these same reachability bars" headers={['Start', 'Last steep edge', 'Maximum', 'Ceiling at ξ=.2']} rows={event.areas.length ? event.areas.map(area => [area.start, area.end, number(area.maximum), number(graph.reach[graph.order[area.start]] * .8)]) : [['none', '—', '—', '—']]} />;
}
function StripExtension({
  values
}) {
  const [step, setStep] = useState(0),
    flags = transitionFlags(values, .2),
    extension = extendRegion(flags.down, flags.upward, 0, 2),
    event = extension.trace[step];
  const graph = {
    order: values.map((_, i) => i),
    reach: values,
    core: []
  };
  return <div><OrderingPlot graph={graph} selected={event.cursor} steep={flags} /><Steps step={step} setStep={setStep} last={extension.trace.length - 1} /><p aria-live="polite">Cursor edge {event.cursor}; last steep endpoint {event.last}; consecutive non-steep count {event.consecutive}. {event.reason}. Returned endpoint: {extension.last}.</p></div>;
}
function D29() {
  const [step, setStep] = useState(0),
    result = xiExtract(mainXiGraph, .2, 3),
    event = result.events[step],
    selected = Math.min(mainXiGraph.order.length - 1, event.start ?? event.cursor);
  return <Figure id="D29" sentence={`Event ${step + 1}: ${event.operation}. Cursor ${event.cursor}; ${event.areas.length} active down regions. The bars, extension state and active maxima come from this complete extraction of the fixed graph; the final infinity closes it without adding a row.`}>
    <PhysicalXiRows /><CellStrip label="Processing permutation connects the physical IDs to the bars" values={mainXiGraph.order.map((row, i) => `#${i}: ID ${row}, x=${mainXiPositions[row]}`)} />
    <OrderingPlot graph={mainXiGraph} selected={selected} sentinel steep={result.flags} spans={event.areas.map(area => [area.start, area.end])} markedPositions={mainXiGraph.order.map((row, i) => event.areas.some(area => area.maximum === mainXiGraph.reach[row]) ? i : -1).filter(i => i >= 0)} /><Steps step={step} setStep={setStep} last={result.events.length - 1} /><EventAreas event={event} graph={mainXiGraph} />
    {event.extension && <Table caption="Extension cursor and last steep endpoint are separate state variables" headers={['Cursor edge', 'Last steep', 'Non-steep run', 'Action']} rows={event.extension.map(row => [row.cursor, row.last, row.consecutive, row.reason])} />}
    <p>The three strips below isolate the extension subroutine with non-steep budget 2. They are supplied height sequences, rather than fitted spatial graphs.</p>
    {[[20, 10, 9, 8, 3], [20, 10, 9, 8, 7, 3], [20, 10, 9, 11, 3]].map((values, i) => <StripExtension key={i} values={values} />)}
  </Figure>;
}
function D30() {
  const [step, setStep] = useState(0),
    [size, setSize] = useState(3),
    result = xiExtract(mainXiGraph, .2, size),
    right = xiExtract(rightXiGraph, .2, 3),
    leftEvent = xiExtract(mainXiGraph, .2, 3).events.find(e => e.operation === 'height-adjust endpoints' && e.before[0] === 0 && e.before[1] === 3),
    rightEvent = right.events.find(e => e.operation === 'height-adjust endpoints' && e.before[0] === 4 && e.before[1] === 10);
  const frames = [{
      graph: mainXiGraph,
      span: leftEvent.before,
      sentence: 'Left candidate [0, 3]. Next height 10 exceeds closing height 8.'
    }, {
      graph: mainXiGraph,
      span: leftEvent.after,
      sentence: 'Move start 0 → 1. The next height 1 stops movement: inclusive length 3.'
    }, ...rightEvent.movements.map((movement, i) => ({
      graph: rightXiGraph,
      span: [4, movement.to],
      sentence: `Right candidate: preceding height ${movement.operand} > original down-start 8; end ${movement.from} → ${movement.to}.`
    })), {
      graph: rightXiGraph,
      span: [4, 7],
      sentence: 'Preceding height 1 ≤ 8 stops the loop. Endpoint 7 has height 9 and predecessor 6 inside [4, 7].'
    }],
    frame = frames[step];
  return <Figure id="D30" sentence={`${frame.sentence} Main extraction size ${size} yields ${result.intervals.map(pair => `[${pair.join(', ')}]`).join(', ')}; graph distances and construction minimum 2 stay fixed.`}>
    <OrderingPlot graph={frame.graph} span={frame.span} sentinel /><Steps step={step} setStep={setStep} last={frames.length - 1} />
    <Table caption="Actual height-adjustment operands from the extractor" headers={['Side', 'Before', 'After', 'Compared height', 'Boundary']} rows={[...leftEvent.movements, ...rightEvent.movements].map(move => [move.side, move.from, move.to, move.operand, move.boundary])} />
    <OrderingPlot graph={mainXiGraph} spans={result.intervals} sentinel />
    <NumericControl label="Main fixed graph: extraction minimum size" value={size} onChange={setSize} min={3} max={4} step={1} resetValue={3} onReset={() => setSize(3)} />
    <CellStrip label="Right-trim physical positions in identity order" values={[0, 10, 11, 12, 20, 21, 22, 31, 43, 61, 91].map((x, i) => `ID ${i}: ${x}`)} />
    <CellStrip label="Right-trim accepted intervals" values={right.intervals.map(pair => `[${pair.join(', ')}]`)} />
  </Figure>;
}
function D31() {
  const [step, setStep] = useState(0),
    result = xiExtract(outsideXiGraph, .2, 3),
    tests = result.events.filter(e => e.operation === 'test endpoint predecessor' && e.start === 2),
    event = tests[step],
    coordinates = [[-1, 0], [0, 0], [9, 0], [9, 1], [10, 0], [10, 1], [11, 0], [11, 1], [0, 9.5]],
    rows = coordinates.map((coordinates, i) => ({
      id: letter(i),
      coordinates,
      label: i % 4,
      dx: i < 2 ? -25 : 9,
      dy: i % 2 ? -12 : 24
    }));
  return <Figure id="D31" sentence={`Candidate [${event.start}, ${event.end}]: endpoint ${letter(event.end)} has predecessor ${event.predecessor < 0 ? 'none' : letter(event.predecessor)}, processing position ${event.parentPosition}. Height shortcut ${event.shortcut}; predecessor inside ${event.inside}. ${event.shortcut || event.inside ? 'Keep this corrected interval.' : 'Trim the endpoint and test again.'} Corrected flat labels leave A, B and I noise.`}>
    <Plane rows={rows} domain={[-3, 14, -3, 12]} height={460} segments={[{
      a: [0, 0],
      b: [0, 9.5],
      color: focus,
      label: 'B → I: 9.5',
      dy: 0
    }]} />
    <OrderingPlot graph={outsideXiGraph} name={letter} selected={event.end} span={[event.start, event.end]} sentinel />
    <Steps step={step} setStep={setStep} last={tests.length - 1} />
    <Table caption="Literal spatial rows and remembered predecessor input IDs" headers={['ID', 'Coordinates', 'Predecessor', 'Flat label']} rows={coordinates.map((point, i) => [letter(i), `(${point.join(', ')})`, outsideXiGraph.predecessor[i] < 0 ? 'none' : letter(outsideXiGraph.predecessor[i]), result.labels[i]])} />
    <CellStrip label="Main graph counterexample: a high endpoint can still have an inside predecessor" values={['candidate [7, 10]', 'ID 4 height 16', 'parent ID 7 → plot position 9', 'inside: keep endpoint 10']} />
  </Figure>;
}
function D32() {
  const [xi, setXi] = useState(.2),
    result = xiExtract(mainXiGraph, xi, 3),
    base = xiExtract(mainXiGraph, .2, 3),
    flatChanged = JSON.stringify(result.labels) !== JSON.stringify(base.labels),
    hierarchyChanged = JSON.stringify(result.intervals) !== JSON.stringify(base.intervals);
  return <Figure id="D32" sentence={`ξ = ${number(xi)}: ${result.intervals.length} inclusive hierarchy intervals; ${new Set(result.labels.filter(x => x >= 0)).size} flat groups. Relative to ξ = .2, hierarchy ${hierarchyChanged ? 'changes' : 'is unchanged'} and flat labels ${flatChanged ? 'change' : 'are unchanged'}. Child-before-parent selection and input-ID mapping are computed from the complete extractor. The closing sentinel has no label.`}>
    <OrderingPlot graph={mainXiGraph} spans={result.intervals} sentinel steep={result.flags} />
    <NumericControl label="Relative change ξ on this fixed graph" value={xi} onChange={setXi} min={.001} max={.999} step={.001} resetValue={.2} onReset={() => setXi(.2)} />
    <Table caption="Inclusive intervals, then nonoverlapping child-before-parent selection" headers={['Interval', 'Included processing positions', 'Selection', 'Flat group']} rows={result.selection.map(row => [`[${row.start}, ${row.end}]`, Array.from({
      length: row.end - row.start + 1
    }, (_, i) => row.start + i).join(', '), row.accepted ? 'accept: all unassigned' : 'skip: overlap', row.group ?? '—'])} />
    <Canvas height={result.selection.length * 70 + 50} label="Nested inclusive spans remain separate memberships; independent outlines mark flat-selected spans">
      {({
        width,
        rem
      }) => {
        const x = i => rem + (i + .5) * (width - 2 * rem) / 11;
        return <g>{result.selection.map((row, i) => {
            const y = (2 + i * 4.4) * rem;
            return <g key={i}><line x1={x(row.start)} x2={x(row.end)} y1={y} y2={y} stroke={hues[i % 4]} strokeWidth="5" />{Array.from({
                length: row.end - row.start + 1
              }, (_, j) => row.start + j).map(position => <circle key={position} cx={x(position)} cy={y} r="4" fill={hues[i % 4]} />)}{row.accepted && <rect x={x(row.start) - .4 * rem} y={y - .6 * rem} width={x(row.end) - x(row.start) + .8 * rem} height={1.2 * rem} fill="none" stroke={focus} strokeWidth="2" />}<text x={rem} y={y + 2 * rem}>[{row.start}, {row.end}] {row.accepted ? 'selected' : 'overlap: skipped'}</text></g>;
          })}</g>;
      }}
    </Canvas>
    <Table caption="Actual permutation maps ordered labels back to input IDs" headers={['Plot position', 'Input ID', 'Ordered label']} rows={mainXiGraph.order.map((row, i) => [i, row, result.orderedLabels[i]])} />
    <CellStrip label="Final labels, in input-ID order" values={result.labels.map((value, i) => `${i} → ${value}`)} />
  </Figure>;
}
export const opticsDrawings = {
  D22,
  D23,
  D24,
  D25,
  D26,
  D27,
  D28,
  D29,
  D30,
  D31,
  D32
};
