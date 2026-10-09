import React, { useState } from 'react';
import { trailObservations } from '../../../data/dbscan-reading-flow/dbscan-neighbourhood-models.mjs';
import { anisotropic, uniformGeometry, equatorialArc, numericScaler, roleRows, trailProvider } from '../../../data/dbscan-reading-flow/dbscan-geometry-models.mjs';
import { Figure, Canvas, Plane, Trail, Point, Arrow, Table, CellStrip, NumericControl, number, hues, focus, line, neutral } from './DbscanDrawingPrimitives.jsx';
function D13() {
  const [scale, setScale] = useState(1),
    state = anisotropic(scale),
    original = [{
      id: 'p',
      coordinates: [0, 0],
      role: 'core',
      label: 0
    }, {
      id: 'q',
      coordinates: [1, 1],
      label: 1
    }];
  return <Figure id="D13" sentence={`Only the second feature changes: q=(1,1) becomes (1,${number(scale)}). Original distance √2=${number(state.original)}; changed distance √(1+s²)=${number(state.distance)}. q is ${state.included ? 'inside' : 'outside'} the radius-2 disk under the changed ruler. At s=1 the ruler is unchanged.`}><div className="db-pair"><section><h4>Original physical coordinates</h4><Plane rows={original} domain={[-2.4, 2.4, -2.4, 2.4]} disk={{
          x: 0,
          y: 0,
          radius: 2
        }} label="Original p and q within radius 2" /><CellStrip label="Copied q coordinate cells" values={['x: 1 → 1', `y: 1 → ${number(scale)} (=s×1)`]} /></section><section><h4>Transformed equal-scale ruler</h4><Plane rows={[original[0], {
          ...original[1],
          coordinates: state.q
        }]} domain={[-2.4, 2.4, -2.4, Math.max(2.4, scale + 1)]} disk={{
          x: 0,
          y: 0,
          radius: 2
        }} label="Copied coordinates with second feature multiplied by s" /></section><section><h4>Pull that disk into the original space</h4><Plane rows={original} domain={[-2.4, 2.4, -2.4, 2.4]} ellipse={state.ellipseRadii} label="Pulled-back ellipse x squared plus s squared y squared at most 4" /><p>x² + s²y² ≤ 4; radii 2 and {number(2 / scale)} in the original feature units.</p></section></div><NumericControl label="Second-feature scale s" value={scale} onChange={setScale} min={1} max={10} step={.01} onReset={() => setScale(1)} resetValue={1} /></Figure>;
}
function D14() {
  const [scale, setScale] = useState(1),
    state = uniformGeometry(scale),
    base = roleRows(trailProvider, 1, 4),
    copy = base.map((r, i) => ({
      ...r,
      coordinates: state.provider.observations[i].coordinates
    }));
  return <Figure id="D14" sentence={`Every coordinate and ε is multiplied by a=${number(scale, 6)}. D's interval is [${number(-2 * scale, 6)}, 0] in copied units; I stays on the closed boundary. All ten rosters ${state.agrees ? 'agree' : 'FAIL correspondence'} with the base-unit rosters. Source rows are unchanged; self distance remains 0.`}><section><h4>Base units — ε = 1</h4><Trail rows={base} selected={3} /></section><section><h4>Copied units — ε = {number(scale, 6)}</h4><Trail rows={copy} selected={3} eps={scale} unit="copied length units" /></section><NumericControl label="Positive unit factor a" value={scale} onChange={setScale} min={1} max={1000} step={.001} log onReset={() => setScale(1)} resetValue={1} /><Table caption="Exact identity correspondence under unit conversion" headers={['ID', 'Base roster', 'Copied roster']} rows={base.map((r, i) => [r.id, state.rosters[i].join(', '), state.rosters[i].join(', ')])} /></Figure>;
}
function Globe({
  west
}) {
  const state = equatorialArc(west);
  return <Canvas height={370} label={`Spherical equator; east 179 degrees and west ${west} degrees joined by the shorter angular arc`}>{({
      width,
      height,
      rem
    }) => {
      const radius = Math.min(width / 2 - 35, height / 2 - 50),
        cx = width / 2,
        cy = height / 2,
        angle = d => (d + 90) * Math.PI / 180,
        X = d => cx + radius * Math.cos(angle(d)),
        Y = d => cy - radius * Math.sin(angle(d));
      let delta = (west - 179 + 540) % 360 - 180;
      const pts = Array.from({
        length: 41
      }, (_, i) => [X(179 + delta * i / 40), Y(179 + delta * i / 40)]);
      return <g><circle cx={cx} cy={cy} r={radius} fill="none" stroke={line} /><ellipse cx={cx} cy={cy} rx={radius * .3} ry={radius} fill="none" stroke={line} strokeDasharray="4 3" /><line x1={cx - radius} x2={cx + radius} y1={cy} y2={cy} stroke={line} /><polyline points={pts.map(p => p.join(',')).join(' ')} stroke={focus} strokeWidth="5" fill="none" /><line x1={cx} y1={cy} x2={X(179)} y2={Y(179)} stroke={hues[0]} /><line x1={cx} y1={cy} x2={X(west)} y2={Y(west)} stroke={hues[1]} /><circle cx={X(179)} cy={Y(179)} r={5} fill={hues[0]} /><circle cx={X(west)} cy={Y(west)} r={5} fill={hues[1]} /><text x={15} y={28}>E: 179°</text><text x={15} y={height - 12}>W: {number(west)}°</text><text x={width - 15} y={height - 48} textAnchor="end">θ = {number(state.theta, 6)} rad</text></g>;
    }}</Canvas>;
}
function D15() {
  const [west, setWest] = useState(-179),
    state = equatorialArc(west);
  return <Figure id="D15" sentence={`East stays 179°. West ${number(west)}° becomes ${number(state.radians, 9)} rad. The wrap-aware shorter arc θ=${number(state.theta, 9)} rad gives ${number(state.km, 6)} km using a spherical radius of 6371.0088 km. At west=179°, θ and length are 0. This is spherical great-circle geometry.`}><Globe west={west} /><Table caption="Actual unit conversion, with quantities kept separate" headers={['Object', 'Degrees', 'Radians / length']} rows={[["E longitude", 179, number(state.eastRadians, 12)], ["W longitude", west, number(state.radians, 12)], ["Short arc", number(state.theta * 180 / Math.PI, 9), `${number(state.theta, 12)} rad`], ["Radius × angular arc", "6371.0088 km", `${number(state.km, 9)} km`]]} /><NumericControl label="West longitude in degrees" value={west} onChange={setWest} min={-180} max={180} step={.1} onReset={() => setWest(-179)} resetValue={-179} /><section><h4>Different longitude labels at one physical pole</h4><Canvas height={210} label="Two meridians meet at the same north pole; pole longitude labels do not separate the physical point">{({
          width,
          height,rem
        }) => <g><path d={`M30,${height - 1.5*rem}Q${width / 2},${7.5*rem-height} ${width - 30},${height - 1.5*rem}`} fill="none" stroke={line} /><path d={`M${width * .35},${height - 1.5*rem}Q${width / 2},${7.5*rem-height} ${width * .65},${height - 1.5*rem}`} fill="none" stroke={line} /><circle cx={width / 2} cy={3*rem} r="6" fill={focus} /><text x={width / 2} y={1.5*rem} textAnchor="middle">North pole</text><text x={20} y={height - .5*rem}>λ₁</text><text x={width - 20} y={height - .5*rem} textAnchor="end">λ₂</text></g>}</Canvas><p>Latitude +90°, longitude λ₁ or λ₂: one physical point, angular separation 0.</p></section></Figure>;
}
function ArithmeticLane({
  title,
  values,
  result,
  operation,
  color
}) {
  return <section className="db-arithmetic-lane"><h4 style={{
      color
    }}>{title}</h4><CellStrip label="Training cells / intermediate values" values={values} /><Canvas height={130} label={`${title}: numeric values feed ${operation}, giving ${result}`}>{({
        width,
        height
      }) => <g><Arrow x1={25} y1={35} x2={width / 2 - 20} y2={35} color={color} /><text x={width / 2} y={60} textAnchor="middle">{operation}</text><Arrow x1={width / 2 + 20} y1={80} x2={width - 25} y2={80} color={color} /><text x={width - 20} y={height - 10} textAnchor="end">{result}</text></g>}</Canvas></section>;
}
function D61() {
  const s = numericScaler();
  return <Figure id="D61" sentence={`Training rows alone supply mean [3,30] and population variances [2.5,250] (divide by 4). Stored scales are [${number(s.scale[0], 6)}, ${number(s.scale[1], 6)}]. Held-out Q=(3,90) transforms to (0,${number(s.queryTransformed[1], 6)}); Q has no arrow back into the training moments.`}><Table caption="Four numerical training observations" headers={['ID', 'Feature x', 'Feature y', 'Centered x', 'Centered y']} rows={s.rows.map((r, i) => [`T${i}`, ...r, ...s.deviations[i]])} /><div className="db-pair"><ArithmeticLane title="x feature" color={hues[0]} values={['1', '2', '4', '5']} operation="sum → ÷4" result="12 → mean 3" /><ArithmeticLane title="y feature" color={hues[1]} values={['10', '20', '40', '50']} operation="sum → ÷4" result="120 → mean 30" /></div><Table caption="Centered deviations feed squares; population variance divides by 4" headers={['Operation', 'x feature', 'y feature']} rows={[["Deviations", '-2, -1, 1, 2', '-20, -10, 10, 20'], ["Squared deviations", '4, 1, 1, 4', '400, 100, 100, 400'], ["Squared sums", 10, 1000], ["Variance: sum ÷ 4", 2.5, 250], ["Scale: √variance", number(s.scale[0], 9), number(s.scale[1], 9)]]} /><CellStrip label="Stored mean array — two entries" values={s.mean} /><CellStrip label="Stored scale array — two entries" values={s.scale.map(x => number(x, 9))} /><Table caption="A separate held-out row consumes the frozen arrays" headers={['Cell', 'Value', 'Subtract stored mean', 'Divide stored scale']} rows={[["Q x", 3, 0, 0], ["Q y", 90, 60, number(s.queryTransformed[1], 9)]]} /><Plane rows={[...s.transformed.map((coordinates, i) => ({
      id: `T${i}`,
      coordinates,
      role: 'core',
      label: 0
    })), {
      id: 'Q',
      coordinates: s.queryTransformed,
      label: -1,
      role: 'query',
      selected: true
    }]} domain={[-2, 2, -2, 4.5]} label="Standardized training points T0 T1 T2 T3 and held-out Q share the same ruler" height={460} /><p>Q is separate from the four training observations. Sample variance would divide by 3; that is a different estimator.</p></Figure>;
}
export const geometryDrawings = {
  D13,
  D14,
  D15,
  D61
};
