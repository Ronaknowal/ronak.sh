import { GaussianTableRegion } from "./GaussianTableRegion.jsx";
import { GaussianDrawing } from "./GaussianScalarFigures.jsx";
import { IRIS_ROLES, irisObservation } from "./gaussian-observation-data.mjs";

const INK = '#deded8', AMBER = '#e9b94c', MUTED = '#85858b';
const LENGTH = '#eebd88', WIDTH = '#85baf1';
const rawPlane = width => {
  const scale = Math.min(80, (width - 120) / 6);
  return { scale, X: length => 60 + (length - 3) * scale, Y: sepalWidth => 55 + (5 - sepalWidth) * scale, height: 4 * scale + 185 };
};

export function GaussianObservedPlant() {
  const observation = irisObservation(34), provenance = irisObservation(35);
  return <div>
    <div className="gmm-measured-row" aria-label="Recorded measurement row for observation ID 34">
      <strong>ID {observation.id}</strong>
      <span className="gmm-feature-pair">
        <span style={{ color: LENGTH }}>Sepal length<br /><strong>{observation.lengthCm} cm</strong></span>
        <span style={{ color: WIDTH }}>Sepal width<br /><strong>{observation.widthCm} cm</strong></span>
      </span>
    </div>
    <GaussianDrawing id="D01" title="One observed plant becomes one point with two measured coordinates" width={680} height={width => rawPlane(width).height} adaptive
      description="Observation ID34 is the filled point at sepal length5.5cm and width4.2cm. Peach guides its length to the horizontal ruler; blue guides its width to the vertical ruler. Both axes use equal centimetre scale. ID is outside the feature pair and is not a fitting coordinate.">
      {width => {
        const p = rawPlane(width), bottom = p.Y(1), right = p.X(9);
        return <>
          <line x1={p.X(3)} y1={bottom} x2={right} y2={bottom} stroke={LENGTH} />
          <line x1={p.X(3)} y1={p.Y(5)} x2={p.X(3)} y2={bottom} stroke={WIDTH} />
          {[3, 4, 5, 6, 7, 8, 9].map(value => <g key={value}>
            <line x1={p.X(value)} x2={p.X(value)} y1={bottom - 3} y2={bottom + 3} stroke={LENGTH} />
            <text x={p.X(value)} y={bottom + 26} textAnchor="middle" fill={LENGTH}>{value}</text>
          </g>)}
          {[1, 2, 3, 4, 5].map(value => <g key={value}>
            <line x1={p.X(3) - 3} x2={p.X(3) + 3} y1={p.Y(value)} y2={p.Y(value)} stroke={WIDTH} />
            <text x={p.X(3) - 12} y={p.Y(value) + 5} textAnchor="end" fill={WIDTH}>{value}</text>
          </g>)}
          <text x="20" y="27" fill={WIDTH}>Sepal width (cm)</text>
          <text x={(p.X(3) + right) / 2} y={bottom + 63} textAnchor="middle" fill={LENGTH}>Sepal length (cm)</text>
          <line x1={p.X(observation.lengthCm)} x2={p.X(observation.lengthCm)} y1={bottom} y2={p.Y(observation.widthCm)} stroke={LENGTH} strokeDasharray="4 3" />
          <line x1={p.X(3)} x2={p.X(observation.lengthCm)} y1={p.Y(observation.widthCm)} y2={p.Y(observation.widthCm)} stroke={WIDTH} strokeDasharray="4 3" />
          <circle cx={p.X(observation.lengthCm)} cy={p.Y(observation.widthCm)} r="5" fill={INK} />
          <text x={p.X(observation.lengthCm) + 11} y={p.Y(observation.widthCm) - 10}>ID 34</text>
          <text x="20" y={bottom + 96} fill={MUTED}>Filled point: recorded plant</text>
        </>;
      }}
    </GaussianDrawing>
    <p>By ID, the separate plant <strong>{provenance.id}</strong> measures <strong>{provenance.lengthCm} cm</strong> by <strong>{provenance.widthCm} cm</strong>. It is not the point shown above. <a href="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/iris.csv" download>Download all 150 recorded rows</a>.</p>
  </div>;
}

const roles = [
  { name: 'training', label: 'Training · fit', ids: IRIS_ROLES.training, symbol: 'filled point' },
  { name: 'validation', label: 'Validation · choose', ids: IRIS_ROLES.validation, symbol: 'diamond' },
  { name: 'test', label: 'Test · reserved', ids: IRIS_ROLES.test, symbol: 'hollow point' },
];
const roleLayout = width => {
  const columns = Math.max(5, Math.floor((width - 40) / 40));
  let top = 40;
  const groups = roles.map(role => {
    const rowCount = Math.ceil(role.ids.length / columns);
    const group = { ...role, top, columns, flowY: top + 60 + rowCount * 43 };
    top = group.flowY + 90;
    return group;
  });
  return { groups, height: top + 20 };
};

export function GaussianObservationRoles() {
  return <div>
    <GaussianDrawing id="D02" title="Every retained observation ID has exactly one of three roles" width={760} height={width => roleLayout(width).height} adaptive
      description="The label-blind retained seed16 split has90 training IDs,30 validation IDs and30 reserved test IDs. Every mark is one source-order ID in its saved role order. Labelled arrows route filled training points to fitting and validation diamonds to choosing. A dashed fence separates hollow reserved test points; no test arrow enters fitting or choosing. No species, fitted result or test outcome is shown.">
      {width => roleLayout(width).groups.map(role => <g key={role.name} data-role-group={role.name}>
        <text x="20" y={role.top} fill={role.name === 'validation' ? AMBER : INK}>{role.label} · {role.ids.length} IDs</text>
        <text x="20" y={role.top + 26} fill={MUTED}>One {role.symbol}: one ID</text>
        {role.ids.map((id, index) => {
          const x = 35 + index % role.columns * 40, y = role.top + 52 + Math.floor(index / role.columns) * 43;
          return <g key={id} data-observation-id={id} data-observation-role={role.name}>
            <title>ID {id}, {role.name}</title>
            {role.name === 'validation'
              ? <path d={`M${x},${y - 5} l5,5 l-5,5 l-5,-5 Z`} fill="none" stroke={AMBER} />
              : <circle cx={x} cy={y} r="4" fill={role.name === 'training' ? INK : 'none'} stroke={INK} />}
            <text x={x} y={y + 22} textAnchor="middle">{id}</text>
          </g>;
        })}
        {role.name === 'test' ? <>
          <path data-reserved-fence="test" d={`M15,${role.top + 41} H10 V${role.flowY - 14} H15`} fill="none" stroke={MUTED} strokeDasharray="4 3" />
          <text x="20" y={role.flowY + 8} fill={MUTED}>No fitting or choosing</text>
          <text x="20" y={role.flowY + 38}>Compare after choosing</text>
        </> : <>
          <path data-flow-arrow={role.name} d={`M35,${role.flowY - 14} V${role.flowY + 8} H75 M67,${role.flowY} L75,${role.flowY + 8} L67,${role.flowY + 16}`} fill="none" stroke={role.name === 'validation' ? AMBER : INK} />
          <text x="88" y={role.flowY + 13} fill={role.name === 'validation' ? AMBER : INK}>{role.name === 'training' ? 'Fit description' : 'Choose description'}</text>
        </>}
      </g>)}
    </GaussianDrawing>
    <p>The retained label-blind permutation uses seed 16. ID 34 is the first test ID; ID 35 is a training ID. These are observation counts, not probabilities.</p>
    <GaussianTableRegion><table className="gmm-role-table">
      <caption>Exact observation IDs in their retained role order</caption>
      <thead><tr><th scope="col">Role</th><th scope="col">IDs</th></tr></thead>
      <tbody>{roles.map(role => <tr key={role.name}><th scope="row">{role.name}</th><td>{role.ids.join(', ')}</td></tr>)}</tbody>
    </table></GaussianTableRegion>
  </div>;
}
