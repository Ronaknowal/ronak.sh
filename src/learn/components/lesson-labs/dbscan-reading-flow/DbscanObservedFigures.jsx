import React, { useState } from 'react';
import { irisData, ringData, savedIrisRecord, savedRoleRows, spacingExample } from '../../../data/dbscan-reading-flow/dbscan-observed-models.mjs';
import { Figure, Canvas, Plane, Point, Arrow, Table, CellStrip, RoleKey, NumericControl, number, hues, neutral, focus, line } from './DbscanDrawingPrimitives.jsx';
function IdGrid({
  rows,
  label
}) {
  return <Canvas height={(width, rem) => Math.ceil(rows.length / Math.max(1, Math.floor(width / (4.5 * rem)))) * 2.7 * rem + 3 * rem} label={label}>
    {({
      width,
      rem
    }) => {
      const columns = Math.max(1, Math.floor(width / (4.5 * rem))),
        cellWidth = width / columns;
      return <g>{rows.map((row, i) => <Point key={row.id} x={i % columns * cellWidth + .7 * rem} y={Math.floor(i / columns) * 2.7 * rem + 2 * rem} id={row.id} role={row.role} group={row.label ?? -1} labelX={i % columns * cellWidth + 1.4 * rem} labelY={Math.floor(i / columns) * 2.7 * rem + 2.3 * rem} />)}</g>;
    }}
  </Canvas>;
}
function D16() {
  const row = irisData.observations[0];
  return <Figure id="D16" sentence="Retained Iris row0 supplies four measured features to the fitted geometry. Species0 goes to external comparison. The 150 training IDs supplied mean[4] and scale[4]; their numerical arrays were not retained, so the state here is dimensioned symbolism.">
    <CellStrip label="Observed row0 — four centimetre-valued feature cells" values={row.coordinates.map((x, j) => `${irisData.featureNames[j]}: ${x}`)} />
    <CellStrip label="The training-ID roster supplies the four-entry fitted state" values={['IDs 0–149', 'mean: μ₀ | μ₁ | μ₂ | μ₃', 'scale: σ₀ | σ₁ | σ₂ | σ₃']} />
    <Canvas height={470} label="Four feature arrows pass the observed cells through their corresponding stored mean and scale, producing four transformed cells">
      {({
        width,
        rem
      }) => {
        const first = .8 * rem,
          last = width - .8 * rem;
        return <g>{row.coordinates.map((x, j) => {
            const y = (3 + j * 6) * rem;
            return <g key={j}><text x={first} y={y}>x{j} = {x}</text><Arrow x1={first} y1={y + rem} x2={width / 2 - 2 * rem} y2={y + rem} color={hues[j % 3]} /><text x={width / 2} y={y + 2.5 * rem} textAnchor="middle">−μ{j} → ÷σ{j}</text><Arrow x1={width / 2 + 2 * rem} y1={y + 3.5 * rem} x2={last} y2={y + 3.5 * rem} color={hues[j % 3]} /><text x={last} y={y + 5 * rem} textAnchor="end">z{j}</text></g>;
          })}</g>;
      }}
    </Canvas>
    <CellStrip label="Distance consumes all four transformed entries" values={['z₀', 'z₁', 'z₂', 'z₃']} />
    <Canvas height={160} label="Separate species0 annotation routes to external comparison, without an edge to scaler or distance">
      {({
        width,
        rem
      }) => <g><text x={10} y={2 * rem}>Species: 0</text><Arrow x1={20} y1={3 * rem} x2={width - 30} y2={3 * rem} color={neutral} /><text x={width - 10} y={5 * rem} textAnchor="end">External comparison</text></g>}
    </Canvas>
    <p>The displayed petal plane uses two observed coordinates. The saved fit used all four standardized features; fitted numerical μ/σ values are unavailable.</p>
  </Figure>;
}
function D17() {
  const [eps, setEps] = useState(.5),
    record = savedIrisRecord(eps),
    rows = savedRoleRows(record);
  return <Figure id="D17" sentence={`Saved ε=${eps}, self-inclusive minimum5: ${150 - record.noise_ids.length}/150 assigned; ${record.clusters} groups; ${record.core_ids.length} core, ${record.border_ids.length} border, ${record.noise_ids.length} noise. This control inspects four recorded states. It does not calculate a fit between them.`}>
    <IdGrid rows={rows} label={`All150 stable Iris IDs with exact saved roles and group hues at epsilon${eps}`} />
    <div className="db-controls"><label className="db-field">Saved radius ε; four standardized features<select value={eps} onChange={event => setEps(Number(event.target.value))}>{[.3, .5, .8, 1].map(value => <option value={value} key={value}>{value}</option>)}</select></label><button type="button" onClick={() => setEps(.5)}>Reset</button></div>
    <RoleKey />
    <CellStrip label="All saved noise IDs remain in the population" values={record.noise_ids} />
    <Table caption="Saved record population and score roles" headers={['Quantity', 'Saved value', 'Population']} rows={[["Coverage", `${150 - record.noise_ids.length}/150`, 'all150 IDs'], ["Assigned silhouette", number(record.silhouette_assigned, 6), 'assigned IDs only'], ["External ARI", number(record.ari_all_rows_noise_is_one_label, 6), 'all150; noise is one nominal label']]} />
  </Figure>;
}
function D18() {
  const record = savedIrisRecord(.5, 10),
    rows = savedRoleRows(record),
    assigned = rows.filter(row => row.label !== -1);
  return <Figure id="D18" sentence="The saved minimum10 record assigns61 of150 IDs. Its assigned-only external ARI is1; all-ID ARI is0.279191. Those values describe different populations. A joint comparison first intersects stable IDs, then excludes an ID if either partition marks it noise.">
    <IdGrid rows={rows} label="All150 IDs before an explicit assigned-only population filter" />
    <Canvas height={210} label="The same150-ID universe branches into all-ID comparison and the assigned-only predicate">
      {({
        width,
        rem
      }) => <g><text x={width / 2} y={2 * rem} textAnchor="middle">150 stable IDs</text><Arrow x1={width / 2} y1={3 * rem} x2={width * .25} y2={6 * rem} color={hues[0]} /><Arrow x1={width / 2} y1={3 * rem} x2={width * .75} y2={6 * rem} color={hues[1]} /><text x={width * .25} y={8 * rem} textAnchor="middle">all150</text><text x={width * .75} y={8 * rem} textAnchor="middle">label ≠ −1</text><text x={width * .25} y={11 * rem} textAnchor="middle">150 retained</text><text x={width * .75} y={11 * rem} textAnchor="middle">61 retained</text></g>}
    </Canvas>
    <Table caption="Both report denominators are visible" headers={['Report', 'Retained IDs', 'Coverage', 'External ARI']} rows={[["All-ID", 150, '150/150', number(record.ari_all_rows_noise_is_one_label, 6)], ["Assigned-only", 61, '61/150', record.ari_assigned]]} />
    <IdGrid rows={assigned} label="The exact61 retained IDs after the noise predicate" />
    <CellStrip label="The89 removed IDs — excluded from the second report only" values={record.noise_ids} />
    <p>The cleaner conditional value describes these61 retained cases. The excluded89 observations remain part of the declared150-row universe.</p>
  </Figure>;
}
function IrisProjection({
  rows,
  axes
}) {
  const values = rows.map(row => axes.map(j => row.coordinates[j])),
    xmin = Math.min(...values.map(v => v[0])) - .3,
    xmax = Math.max(...values.map(v => v[0])) + .3,
    ymin = Math.min(...values.map(v => v[1])) - .3,
    ymax = Math.max(...values.map(v => v[1])) + .3;
  return <Canvas height={440} label={`All150 saved role marks; display axes ${irisData.featureNames[axes[0]]} and ${irisData.featureNames[axes[1]]}; row0 is outlined`}>
    {({
      width,
      height,
      rem
    }) => {
      const pad = 2 * rem,
        s = Math.min((width - 2 * pad) / (xmax - xmin), (height - 2 * pad) / (ymax - ymin)),
        X = x => width / 2 + (x - (xmin + xmax) / 2) * s,
        Y = y => height / 2 - (y - (ymin + ymax) / 2) * s;
      return <g><line x1={X(xmin)} x2={X(xmax)} y1={Y(ymin)} y2={Y(ymin)} stroke={line} /><line x1={X(xmin)} x2={X(xmin)} y1={Y(ymin)} y2={Y(ymax)} stroke={line} />{rows.map((row, i) => {
          const x = X(values[i][0]),
            y = Y(values[i][1]),
            hue = row.label < 0 ? neutral : hues[row.label % 3];
          return <g key={row.id}><title>{`ID${row.id}, ${values[i].join(', ')}cm, saved ${row.role}, label${row.label}`}</title>{row.role === 'noise' ? <path d={`M${x - 4},${y - 4}l8,8 M${x - 4},${y + 4}l8,-8`} stroke={hue} /> : <circle cx={x} cy={y} r="4" fill={row.role === 'core' ? hue : '#111'} stroke={hue} />}</g>;
        })}<Point x={X(values[0][0])} y={Y(values[0][1])} id="0" role={rows[0].role} group={rows[0].label} selected /><text x={pad} y={height - 5}>{number(xmin)} → {number(xmax)} cm</text><text x={pad} y={1.4 * rem}>{number(ymin)} → {number(ymax)} cm</text></g>;
    }}
  </Canvas>;
}
function D19() {
  const [pair, setPair] = useState('2,3'),
    axes = pair.split(',').map(Number),
    record = savedIrisRecord(.5),
    rows = savedRoleRows(record);
  return <Figure id="D19" sentence={`Only the display axes change to ${irisData.featureNames[axes[0]]} and ${irisData.featureNames[axes[1]]}. All150 IDs and their saved roles remain fixed at standardized ε=.5/minimum5. The highlighted row0 still contributes all four features to the saved fit.`}>
    <CellStrip label="Fixed four-feature observation0" values={irisData.observations[0].coordinates.map((x, j) => `feature${j}: ${x}cm`)} />
    <CellStrip label="Separate routes" values={['all four → saved standardized distance', `${axes[0]},${axes[1]} → displayed coordinate pair`]} />
    <IrisProjection rows={rows} axes={axes} />
    <div className="db-controls"><label className="db-field">Display axes only<select value={pair} onChange={event => setPair(event.target.value)}><option value="2,3">Petal length / width</option><option value="0,1">Sepal length / width</option><option value="0,2">Sepal / petal length</option></select></label><button type="button" onClick={() => setPair('2,3')}>Reset</button></div>
    <RoleKey />
    <IdGrid rows={rows} label="Unchanged complete150-ID role roster, independent of display axes" />
  </Figure>;
}
function CoordinateLeaders({
  rows,
  label
}) {
  return <Canvas height={(width, rem) => rows.length * 2.7 * rem + 7 * rem} label={label}>
    {({
      width,
      height,
      rem
    }) => {
      const sorted = [...rows].sort((a, b) => b.coordinates[0] - a.coordinates[0]),
        lo = Math.min(...rows.map(r => r.coordinates[0])),
        hi = Math.max(...rows.map(r => r.coordinates[0])),
        X = 2 * rem,
        Y = value => 3 * rem + (hi - value) / (hi - lo || 1) * (height - 6 * rem);
      return <g><line x1={X} x2={X} y1={3 * rem} y2={height - 3 * rem} stroke={line} />{sorted.map((row, i) => {
          const yLabel = (3 + i * 2.7) * rem,
            y = Y(row.coordinates[0]);
          return <g key={row.id}><line x1={X + 7} y1={y} x2={5 * rem} y2={yLabel} stroke={line} /><Point x={X} y={y} id={`${row.id}: ${number(row.coordinates[0])}`} labelX={5.3 * rem} labelY={yLabel + .3 * rem} group={row.label ?? -1} role={row.role} /></g>;
        })}<text x={X} y={1.5 * rem}>Position ruler</text></g>;
    }}
  </Canvas>;
}
function D20() {
  const [spacing, setSpacing] = useState(.75),
    state = spacingExample(spacing),
    rows = state.observations.map((row, i) => ({
      ...row,
      label: state.partition.labels[i],
      role: state.partition.core[i] ? 'core' : state.partition.labels[i] < 0 ? 'noise' : 'border'
    }));
  return <Figure id="D20" sentence={`Diffuse spacing δ=${number(spacing)} requires ε≥${number(state.required)}. Avoiding the closed dense bridge requires ε<.375. ${state.feasible ? `The interval [${number(state.required)}, .375) is nonempty.` : 'These requirements have no common radius.'} Counts and roles shown use the required radius and minimum3.`}>
    <CoordinateLeaders rows={rows} label="All12 actual positions with stable row identities; diffuse spacing changes only the last four" />
    <Canvas height={230} label="Required and forbidden intervals share one radius axis; closed lower endpoint and open .375 upper endpoint">
      {({
        width,
        rem
      }) => {
        const X = x => 2 * rem + x * (width - 4 * rem),
          y = 5 * rem;
        return <g><line x1={X(0)} x2={X(1)} y1={y} y2={y} stroke={line} /><line x1={X(state.required)} x2={X(1)} y1={y - 2 * rem} y2={y - 2 * rem} stroke={hues[0]} strokeWidth="4" /><circle cx={X(state.required)} cy={y - 2 * rem} r="5" fill={hues[0]} /><line x1={X(0)} x2={X(.375)} y1={y + 2 * rem} y2={y + 2 * rem} stroke={hues[1]} strokeWidth="4" /><circle cx={X(.375)} cy={y + 2 * rem} r="5" fill="#111" stroke={hues[1]} /><text x={X(state.required)} y={y - 3 * rem} textAnchor="middle">{number(state.required)}</text><text x={X(.375)} y={y + 4 * rem} textAnchor="middle">.375 open</text><text x={X(0)} y={y + rem}>0</text><text x={X(1)} y={y + rem} textAnchor="end">1</text></g>;
      }}
    </Canvas>
    <NumericControl label="Diffuse spacing δ; dense rows stay fixed" value={spacing} onChange={setSpacing} min={.125} max={.9} step={.001} onReset={() => setSpacing(.75)} resetValue={.75} />
    <Table caption="Required-radius actual counts and roles" headers={['ID', 'Position', 'Count', 'Role']} rows={rows.map((row, i) => [row.id, number(row.coordinates[0]), state.provider.neighbours(i, state.required).length, row.role])} />
  </Figure>;
}
function RecordedRing({
  centres = false
}) {
  const rows = ringData.coordinates.map((coordinates, i) => {
    const radius = i < 12 ? 1 : 3,
      labelRadius = i < 12 ? 1.8 : 4.2;
    return {
      id: i,
      coordinates,
      role: 'core',
      label: centres ? ringData.kmeans_labels[i] : ringData.dbscan_labels[i],
      labelCoordinates: coordinates.map(x => x / radius * labelRadius),
      anchor: coordinates[0] > .2 ? 'start' : coordinates[0] < -.2 ? 'end' : 'middle'
    };
  });
  const centerRows = centres ? ringData.kmeans_centers.map((coordinates, i) => ({
    id: `C${i}`,
    coordinates,
    label: i,
    role: 'centre',
    labelCoordinates: [i ? 2.6 : -2.6, i ? 4.6 : -4.6],
    anchor: 'middle'
  })) : [];
  const links = centres ? [] : rows.map((r, i) => ({
    a: i,
    b: i < 12 ? (i + 1) % 12 : 12 + (i - 12 + 1) % 36,
    color: hues[r.label]
  }));
  const normal = ringData.kmeans_centers[1].map((x, j) => x - ringData.kmeans_centers[0][j]),
    midpoint = ringData.kmeans_centers[1].map((x, j) => (x + ringData.kmeans_centers[0][j]) / 2),
    boundaryY = x => midpoint[1] - (x - midpoint[0]) * normal[0] / normal[1];
  const segments = centres ? [{
    a: [-3.8, boundaryY(-3.8)],
    b: [3.8, boundaryY(3.8)],
    color: neutral,
    dashed: true
  }] : [{
    a: ringData.coordinates[0],
    b: ringData.coordinates[1],
    width: 3
  }, {
    a: ringData.coordinates[12],
    b: ringData.coordinates[13],
    width: 3
  }, {
    a: ringData.coordinates[0],
    b: ringData.coordinates[12],
    dashed: true
  }];
  return <><Plane rows={[...rows, ...centerRows]} links={links} segments={segments} domain={[-4.8, 4.8, -4.8, 4.8]} height={460} label={centres ? 'All 48 exact retained rows, retained KMeans memberships, centres and their perpendicular-bisector boundary' : 'All 48 exact retained rows; highlighted 0–1 and 12–13 adjacent chords; dashed 0–12 cross-ring separation'} />{centres ? <><CellStrip label="Two exact retained KMeans centres; dashed line is their equal-distance boundary" values={ringData.kmeans_centers.map((c, i) => `C${i}: (${number(c[0], 6)}, ${number(c[1], 6)})`)} /><p>Boxed crosses mark centres. Observation circles retain the saved density core status; their hue here follows the retained KMeans assignment.</p></> : <p>Amber edges 0–1 and 12–13 mark the two adjacent chord lengths. The dashed 0–12 segment marks the cross-ring minimum 2.</p>}</>;
}
function D21() {
  return <Figure id="D21" sentence="The exact retained48-row fixture has12 radius1 points and36 radius3 points. Both adjacent chords lie below ε=.6, while the cross-ring minimum is2. Saved density ARI1 and rounded KMeans ARI−.016 describe this original controlled comparison; no fit ran for this display.">
    <div className="db-pair"><section><h4>Retained density membership</h4><RecordedRing /></section><section><h4>Retained centre assignment</h4><RecordedRing centres /></section></div>
    <Table caption="Actual geometric support and recorded comparison" headers={['Quantity', 'Value', 'Role']} rows={[["Inner adjacent chord", number(2 * Math.sin(Math.PI / 12), 6), '2 sin(π/12) < .6'], ["Outer adjacent chord", number(6 * Math.sin(Math.PI / 36), 6), '6 sin(π/36) < .6'], ["Cross-ring minimum", 2, 'greater than .6'], ["Density core count", ringData.dbscan_core_count, 'self plus two adjacent neighbours'], ["Density ARI", ringData.dbscan_ari, 'retained ring identity comparison'], ["KMeans ARI", number(ringData.kmeans_ari, 3), 'retained two-centre comparison']]} />
    <Table caption="All48 source-bound coordinates and both memberships" headers={['ID', 'x', 'y', 'Density', 'KMeans']} rows={ringData.coordinates.map((r, i) => [i, number(r[0], 6), number(r[1], 6), ringData.dbscan_labels[i], ringData.kmeans_labels[i]])} />
  </Figure>;
}
export const observedDrawings = {
  D16,
  D17,
  D18,
  D19,
  D20,
  D21
};
