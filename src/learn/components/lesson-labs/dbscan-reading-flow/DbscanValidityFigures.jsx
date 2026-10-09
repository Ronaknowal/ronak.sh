import React, { useState } from 'react';
import { fixedValidity, translatedCloud, rightScoreZero, squareAlternatives, groupShape, validityReport } from '../../../data/dbscan-reading-flow/dbscan-validity-models.mjs';
import { Figure, Canvas, Plane, Point, Arrow, Table, CellStrip, NumericControl, number, hues, focus, line, neutral } from './DbscanDrawingPrimitives.jsx';
const ids = [...'ABCDEFGH', 'J'];
export function ValidityCloud({
  state = fixedValidity,
  kind = 'plain'
}) {
  const report = state.report,
    internal = report.clusters.flatMap(group => group.internal),
    pair = report.clusters[0]?.pair ?? [];
  const rows = state.observations.map((row, i) => ({
    ...row,
    label: i === 8 ? -1 : i < 4 ? 0 : 1,
    role: i === 8 ? 'noise' : kind === 'plain' ? 'context' : internal.includes(i) ? 'core' : 'context',
    dx: i === 0 ? -14 : 9,
    dy: i % 2 ? -18 : 24
  }));
  let segments = [];
  if (kind === 'cores') segments = [1, 2, 3].map(row => ({
    a: rows[0].coordinates,
    b: rows[row].coordinates,
    color: hues[0],
    width: 2
  }));
  if (kind === 'trees') segments = report.clusters.flatMap((group, i) => group.edges.map(edge => ({
    a: rows[edge.left].coordinates,
    b: rows[edge.right].coordinates,
    color: group.internal.includes(edge.left) && group.internal.includes(edge.right) ? hues[i] : line,
    width: group.internal.includes(edge.left) && group.internal.includes(edge.right) ? 4 : 1.5
  })));
  if (kind === 'cross') segments = report.clusters[0].pairs.map(edge => ({
    a: rows[edge.left].coordinates,
    b: rows[edge.right].coordinates,
    color: edge.left === pair[0] && edge.right === pair[1] ? focus : line,
    width: edge.left === pair[0] && edge.right === pair[1] ? 3 : 1,
    dashed: edge.left !== pair[0] || edge.right !== pair[1]
  }));
  return <><Plane rows={rows} segments={segments} domain={[-2, 24, -2, 11]} height={460} label={`Actual fixed-label cloud, noise J retained; ${kind === 'cores' ? 'A to all three own-group members' : kind === 'trees' ? 'degree-based internal edges emphasized' : kind === 'cross' ? 'all four eligible cross-internal pairs and winning C–F edge' : 'original two-dimensional coordinates'}`} />{kind !== 'plain' && kind !== 'cores' && <p>For these group trees, filled circles mean degree greater than 1; hollow circles mean leaves. This is MST anatomy, rather than the earlier DBSCAN core predicate. Blue/rose retain the fixed left/right labels; × is noise J.</p>}</>;
}
function D47() {
  const group = fixedValidity.report.clusters[0];
  return <Figure id="D47" sentence={`A’s squared own-group distances to B/C/D are 1/10/37. Mean reciprocal squared distance is 139/370; all-points core √(370/139) = ${number(group.cores[0], 6)}. Ambient dimension is 2, and all three other group members supply the denominator. This is a group-wide core, distinct from the earlier mth-neighbour radius. Noise J stays visible without a group core.`}>
    <ValidityCloud kind="cores" />
    <Canvas height={420} label="Actual reciprocal-power contribution lengths feed the mean139/370 and inverse square-root all-points core">
      {({
        width,
        rem
      }) => {
        const X = value => 5 * rem + value * (width - 6 * rem),
          terms = [1, 1 / 10, 1 / 37];
        return <g>{terms.map((value, i) => <g key={i}><text x={0} y={(3 + i * 4) * rem}>{'BCD'[i]}</text><text x={5 * rem} y={(2.5 + i * 4) * rem}>{i === 0 ? '1' : i === 1 ? '1/10' : '1/37'}</text><rect x={X(0)} y={(3 + i * 4) * rem} width={X(value) - X(0)} height={rem} fill={hues[0]} /><Arrow x1={X(value)} y1={(4 + i * 4) * rem} x2={width / 2} y2={14 * rem} color={hues[0]} /></g>)}<circle cx={width / 2} cy={17 * rem} r={3 * rem} fill="none" stroke={hues[0]} /><text x={width / 2} y={16.5 * rem} textAnchor="middle">mean</text><text x={width / 2} y={18 * rem} textAnchor="middle">139/370</text><Arrow x1={width / 2} y1={20 * rem} x2={width / 2} y2={23 * rem} color={hues[0]} /><text x={width / 2} y={25 * rem} textAnchor="middle">√(370/139): {number(group.cores[0], 6)}</text></g>;
      }}
    </Canvas>
    <Table caption="Same A edges, rescaled by smallest positive δ=1 before reciprocal-power summation" headers={['Edge', 'Raw distance r', 'δ/r', '(δ/r)²']} rows={[1, 10, 37].map((squared, i) => [`A–${'BCD'[i]}`, `√${squared}`, number(1 / Math.sqrt(squared), 6), number(1 / squared, 6)])} />
    <Table caption="Every retained group row’s actual all-points core, with dimension2" headers={['ID', 'Fixed group', 'All-points core']} rows={fixedValidity.observations.map((row, i) => [row.id, i === 8 ? 'noise' : i < 4 ? 'left' : 'right', i === 8 ? 'not defined for noise' : number(fixedValidity.report.clusters[i < 4 ? 0 : 1].cores[i % 4], 6)])} />
  </Figure>;
}
function D48() {
  const report = fixedValidity.report;
  return <Figure id="D48" sentence={`The actual left/right MST degrees are [1,2,2,1]. Internal vertices B/C and F/G give internal edges B–C and F–G. DSC values ${number(report.clusters[0].sparseness, 6)} and ${number(report.clusters[1].sparseness, 6)} use those edges. Longer leaf edges C–D and G–H remain drawn; they do not define strict internal sparseness.`}>
    <ValidityCloud kind="trees" />
    <Table caption="Actual weighted tree edges and their two endpoint degrees" headers={['Edge', 'Mutual weight', 'Endpoint degrees', 'Internal edge?']} rows={report.clusters.flatMap(group => group.edges.map(edge => [`${ids[edge.left]}–${ids[edge.right]}`, number(edge.weight, 6), `${group.degrees[group.rows.indexOf(edge.left)]}, ${group.degrees[group.rows.indexOf(edge.right)]}`, String(group.internal.includes(edge.left) && group.internal.includes(edge.right))]))} />
    <Table caption="Each weight is the maximum of two own-group cores and raw Euclidean length" headers={['Edge', 'Left core', 'Right core', 'Raw', 'Maximum']} rows={report.clusters.flatMap(group => group.edges.map(edge => {
      const raw = Math.hypot(...fixedValidity.observations[edge.left].coordinates.map((x, j) => x - fixedValidity.observations[edge.right].coordinates[j]));
      return [`${ids[edge.left]}–${ids[edge.right]}`, number(group.cores[group.rows.indexOf(edge.left)], 6), number(group.cores[group.rows.indexOf(edge.right)], 6), number(raw, 6), number(edge.weight, 6)];
    }))} />
  </Figure>;
}
function D49() {
  const group = fixedValidity.report.clusters[0];
  return <Figure id="D49" sentence={`All four eligible internal pairs are checked. C–F wins at √130 = ${number(group.separation, 6)}, above both endpoint cores, so raw length controls its maximum. D and E remain visible leaf vertices and are ineligible for this separation rule.`}>
    <ValidityCloud kind="cross" />
    <Table caption="The complete four-pair minimum, using each endpoint’s own fixed-group core" headers={['Pair', 'Raw squared', 'Left core', 'Right core', 'Mutual weight', 'Winner']} rows={group.pairs.map(pair => [`${ids[pair.left]}–${ids[pair.right]}`, Math.round(pair.raw ** 2), number(pair.coreA, 6), number(pair.coreB, 6), number(pair.weight, 6), pair.left === group.pair[0] && pair.right === group.pair[1] ? 'minimum' : 'not minimum'])} />
    <CellStrip label="Eligibility comes from the actual selected group trees" values={['left: B, C', 'right: F, G', 'D/E: visible leaves; excluded from this minimum']} />
  </Figure>;
}
export function Population({
  conditional = false
}) {
  const shown = conditional ? ids.slice(0, 8) : ids;
  return <Canvas height={180} label={conditional ? 'Explicit assigned-only universe has8 IDs; J is excluded from this conditional report only' : 'Original nine-row universe includes noise J in the global denominator'}>
    {({
      width,
      rem
    }) => {
      const unit = width / shown.length;
      return <g><text x={0} y={rem}>{conditional ? 'Conditional universe: n = 8' : 'Original universe: n = 9'}</text>{shown.map((id, i) => <g key={id}><rect x={i * unit + .1 * rem} y={3 * rem} width={unit - .2 * rem} height={2 * rem} fill={i === 8 ? 'none' : hues[i < 4 ? 0 : 1]} fillOpacity=".16" stroke={i === 8 ? neutral : hues[i < 4 ? 0 : 1]} /><text x={(i + .5) * unit} y={4.4 * rem} textAnchor="middle">{id}</text></g>)}<path d={`M${.2 * rem},${7 * rem}v${-rem}H${4 * unit - .2 * rem}v${rem}`} fill="none" stroke={hues[0]} /><path d={`M${4 * unit + .2 * rem},${7 * rem}v${-rem}H${8 * unit - .2 * rem}v${rem}`} fill="none" stroke={hues[1]} /><text x={2 * unit} y={9 * rem} textAnchor="middle">4/{shown.length} left</text><text x={6 * unit} y={9 * rem} textAnchor="middle">4/{shown.length} right</text>{!conditional && <text x={width} y={11 * rem} textAnchor="end">J: noise; no cluster term</text>}</g>;
    }}
  </Canvas>;
}
export function SignedValues({
  report
}) {
  const rows = [...report.clusters.map((group, i) => ({
    label: `${group.label} V`,
    value: group.score,
    color: hues[i]
  })), ...report.clusters.map((group, i) => ({
    label: `${group.label} contribution 4/9`,
    value: group.contribution,
    color: hues[i]
  })), {
    label: 'Global; original n=9',
    value: report.score,
    color: focus
  }, {
    label: 'Conditional; assigned n=8',
    value: report.conditional,
    color: neutral
  }];
  return <Canvas height={(_, rem) => (rows.length * 4 + 6) * rem} label="All scores and contributions share a signed minus-one to plus-one ruler; negative values remain visible">
    {({
      width,
      height,
      rem
    }) => {
      const X = value => width / 2 + value * (width / 2 - rem),
        zero = X(0);
      return <g>{[-1, 0, 1].map(value => <text key={value} x={X(value)} y={2 * rem} textAnchor={value < 0 ? 'start' : value > 0 ? 'end' : 'middle'}>{value > 0 ? '+1' : value}</text>)}<line x1={zero} x2={zero} y1={3 * rem} y2={height - rem} stroke={line} />{rows.map((row, i) => {
          const y = (5 + i * 4) * rem;
          return <g key={row.label}><text x={0} y={y - rem}>{row.label}</text><text x={width} y={y - rem} textAnchor="end">{number(row.value, 6)}</text><line x1={X(-1)} x2={X(1)} y1={y} y2={y} stroke={line} /><rect x={Math.min(zero, X(row.value))} y={y - .4 * rem} width={Math.abs(X(row.value) - zero)} height={.8 * rem} fill={row.color} /></g>;
        })}</g>;
    }}
  </Canvas>;
}
function D50() {
  const report = fixedValidity.report;
  return <Figure id="D50" sentence={`Each fixed group receives original-n weight 4/9. Contributions ${number(report.clusters[0].contribution, 6)} + ${number(report.clusters[1].contribution, 6)} give global ${number(report.score, 6)}. Noise J still supplies 1/9 of the original population; coverage is 8/9. Conditional ${number(report.conditional, 6)} uses the explicitly smaller assigned universe, rather than silently deleting noise.`}>
    <Population /><SignedValues report={report} /><Population conditional />
    <Table caption="Both denominators and their distinct report roles" headers={['Report', 'Universe', 'Group weights', 'Value']} rows={[["Global", 'all9 IDs, including J', '4/9 each', number(report.score, 9)], ["Conditional", '8 assigned IDs; J excluded here', '4/8 each', number(report.conditional, 9)], ["Coverage", '8 assigned of9 input', '8/9', number(report.coverage, 9)]]} />
  </Figure>;
}
function D51() {
  const square = squareAlternatives();
  return <Figure id="D51" sentence="The two supplied square paths A–B–C–D and B–C–D–A each total 3√(6/5). Their internal sets are B/C and C/D. Threshold connectivity agrees; eligible DBCV cross candidates can differ. A diagonal has weight √2, so a diagonal star is not an MST. No second group or full DBCV score is invented here.">
    <div className="db-pair">{square.paths.map((path, i) => <div key={i}><p>{i === 0 ? 'Path A–B–C–D' : 'Path B–C–D–A'}</p><Plane rows={square.observations.map((row, j) => ({
          ...row,
          label: 0,
          role: path.internal.includes(j) ? 'core' : 'context',
          dx: row.coordinates[0] ? 9 : -22,
          dy: row.coordinates[1] ? -15 : 25
        }))} links={path.edges.map(edge => ({
          a: edge.left,
          b: edge.right,
          color: path.internal.includes(edge.left) && path.internal.includes(edge.right) ? focus : hues[0]
        }))} domain={[-.5, 1.5, -.5, 1.5]} height={380} label={`Unit square; ${i === 0 ? 'B/C' : 'C/D'} are internal in this supplied minimum path`} /><CellStrip label="Internal vertices; filled circles encode degree>1" values={path.internal.map(row => square.observations[row].id)} /></div>)}</div>
    <Table caption="Same minimum total, different internal-edge anatomy" headers={['Tree', 'Total', 'Internal edge', 'Side weight', 'Diagonal weight']} rows={square.paths.map((path, i) => [i === 0 ? 'ABCD' : 'BCDA', number(path.total, 6), i === 0 ? 'BC' : 'CD', number(Math.sqrt(6 / 5), 6), number(Math.SQRT2, 6)])} />
  </Figure>;
}
function Shape({
  points
}) {
  const shape = groupShape(points),
    duplicate = shape.status === 'DUPLICATE_POINTS';
  return <div><Canvas height={210} label={`Constructed group anatomy: ${shape.status}; ${shape.detail}`}>
    {({
        width,
        rem
      }) => {
        const X = i => points.length === 1 ? width / 2 : 2 * rem + i / (points.length - 1) * (width - 4 * rem),
          y = 4 * rem;
        if (duplicate) return <g><circle cx={width / 2} cy={y} r="5" fill={neutral} /><circle cx={width / 2} cy={y} r="10" fill="none" stroke={neutral} /><line x1={width / 2} x2={width * .25} y1={y} y2={7 * rem} stroke={line} /><line x1={width / 2} x2={width * .75} y1={y} y2={7 * rem} stroke={line} /><text x={width * .25} y={9 * rem} textAnchor="middle">A (0,0)</text><text x={width * .75} y={9 * rem} textAnchor="middle">B (0,0)</text><text x={0} y={12 * rem}>Distinct IDs; distance 0</text></g>;
        return <g>{shape.edges.map((edge, i) => <line key={i} x1={X(edge.left)} x2={X(edge.right)} y1={y} y2={y} stroke={line} strokeWidth="2" />)}{points.map((point, i) => <g key={i}><Point x={X(i)} y={y} id={String.fromCharCode(65 + i)} role={shape.internal.includes(i) ? 'core' : 'context'} group={0} labelX={X(i)} labelY={y + 2 * rem} anchor="middle" /><text x={X(i)} y={9 * rem} textAnchor="middle">deg {shape.degrees[i]}</text></g>)}<text x={0} y={12 * rem}>({points.map(point => point.join(',')).join('); (')})</text></g>;
      }}
  </Canvas><p>{shape.status}: {shape.detail}. These are individual group-shape diagnostics, rather than complete two-group scores.</p></div>;
}
function D52() {
  const observations = [0, 1, 4, 5].map((x, i) => ({
      id: 'abcd'[i],
      coordinates: [x, 0]
    })),
    tiny = validityReport(observations, [0, 0, 1, 1]),
    matlab = validityReport(observations, [1, 1, 2, 2], 'matlab'),
    contrib = validityReport(observations, [0, 0, 1, 1], 'contrib');
  return <Figure id="D52" sentence="A singleton lacks denominator size−1; two rows lack an internal vertex; the three-row path lacks an internal edge. Coincident distinct IDs have zero distance outside the strict domain. A whole one-group partition lacks another-group separation; all noise has no assigned group. Missing quantities remain named diagnostics, rather than substituted zero scores. Diagnostic precedence follows the declared source.">
    <Shape points={[[0, 0]]} /><Shape points={[[0, 0], [1, 0]]} /><Shape points={[[0, 0], [1, 0], [2, 0]]} /><Shape points={[[0, 0], [0, 0]]} />
    {[false, true].map(noise => <div key={String(noise)}><Canvas height={150} label={noise ? 'Complete four-row all-noise partition; no assigned group' : 'Complete four-row one-group partition; no second separation group'}>{({
          width,
          rem
        }) => <g>{observations.map((row, i) => <Point key={i} x={(i + .5) * width / 4} y={3 * rem} id={row.id} role={noise ? 'noise' : 'context'} group={noise ? -1 : 0} />)}<text x={0} y={7 * rem}>{noise ? 'ALL_NOISE: no assigned separation' : 'ONE_GROUP: no other group'}</text></g>}</Canvas></div>)}
    <Table caption="Selected software conventions are different calculations" headers={['Quantity', 'Strict finite route', 'MATLAB policy adapter', 'Contrib policy adapter']} rows={[["Distance", 'Euclidean', 'squared Euclidean', 'Euclidean'], ["Noise", '−1', '0; singletons dropped', '−1'], ["Zero distance", 'unsupported', 'selected compatibility policy', 'omit zero contributions'], ["No internal vertex", 'unsupported', 'all group vertices', 'first group vertex'], ["No internal edge", 'unsupported', 'all MST edges', 'all MST edges'], ["One group", 'undefined separation', 'early zero', 'undefined; adapter returns diagnostic'], ["Two-row fixture status/value", tiny.status, number(matlab.score, 6), number(contrib.score, 6)]]} />
    <p>The two adapters above use their own deterministic browser tree on the stated four-row fixture. They illustrate selected policies; they are not bitwise upstream parity. The actual optional hdbscan.validity route remains unexecuted in the retained instructional environment.</p>
  </Figure>;
}
function D53() {
  const [offset, setOffset] = useState(12),
    state = translatedCloud(offset),
    report = state.report;
  return <Figure id="D53" sentence={`Right translation s = ${number(offset, 6)}: internal pair C–F, separator ${number(report.clusters[0].separation, 6)}. Left contribution ${number(report.clusters[0].contribution, 6)}, right ${number(report.clusters[1].contribution, 6)}; original-n global ${number(report.score, 6)}, conditional assigned-n value ${number(report.conditional, 6)}. Coverage stays 8/9. Fixed labels and within-group cores/DSC remain unchanged; signed negative output remains visible.`}>
    <ValidityCloud state={state} kind="cross" /><SignedValues report={report} />
    <NumericControl label="Translate the whole right group: s" value={offset} onChange={setOffset} min={2} max={12} step={.01} resetValue={12} onReset={() => setOffset(12)} />
    <Table caption="Current separation compares fixed internal sparseness with the moving cross edge" headers={['Fixed group', 'DSC', 'Current DSPC', 'Signed V', 'Original-n weight']} rows={report.clusters.map(group => [group.label, number(group.sparseness, 6), number(group.separation, 6), number(group.score, 9), '4/9'])} />
    <CellStrip label="Analytical equality for the right score on the supported s interval" values={['s = 1 + √(18096/1049 − 9)', number(rightScoreZero, 12), 'At equality: separation = right DSC', 'Left/right geometry is not refitted']} />
  </Figure>;
}
export const validityDrawings = {
  D47,
  D48,
  D49,
  D50,
  D51,
  D52,
  D53
};
