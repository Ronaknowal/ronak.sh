import { colors, Ledger, Legend, number, Plot, Scene } from './NumericalPdeReadingPrimitives.jsx';

export function CellBalance({ loads, left = 1, right = 1, values, fluxes, coreOnly = false, ledgerOnly = false }) {
  const solved = Array.isArray(values) && Array.isArray(fluxes);
  const incompatible = values === null;
  const ledger = solved
    ? <Ledger label="Complete cell balances" headers={['Cell', 'Source minus boundary load', 'Mean-zero value', 'Left face, right-oriented', 'Right face, right-oriented']} rows={loads.map((value, j) => [j, value, values[j], fluxes[j], fluxes[j + 1]])} />
    : <><Ledger label="Addressed conservation before solving" headers={['Cell j', 'Source minus boundary load', 'Internal influx', 'Internal outflux']} rows={loads.map((value, j) => [j, value, j === 0 ? 'boundary already included' : `+q${j}`, j === loads.length - 1 ? 'boundary already included' : `−q${j + 1}`])} />{incompatible && <p>No compatible steady solution: mean-zero values and solved face fluxes are unavailable.</p>}</>;
  if (ledgerOnly) return ledger;
  return <div className="npde-reading-object"><Scene label="Adjacent cells share one internal face; prescribed outward fluxes at the two ends" height={115}>{width => {
    const start = 12;
    const span = width - 24;
    return <>
      {loads.map((_, j) => <rect key={j} x={start + j * span / loads.length} y="42" width={span / loads.length} height="34" fill={j % 2 ? '#20242c' : '#13171d'} stroke={colors.field} />)}
      {Array.from({ length: loads.length - 1 }, (_, j) => <g key={j} stroke={colors.computed}><line x1={start + (j + .75) * span / loads.length} x2={start + (j + 1.25) * span / loads.length} y1="30" y2="30" /><path d={`M${start + (j + 1.25) * span / loads.length - 4},26 l4,4 l-4,4`} fill="none" /></g>)}
      <path d={`M${start + 10},90 h-10 l5,-4 m-5,4 l5,4 M${width - 22},90 h10 l-5,-4 m5,4 l-5,4`} stroke={colors.defect} fill="none" />
    </>;
  }}</Scene><p>Cyan cell boundaries. Amber shared internal fluxes enter one balance and leave its neighbor. Pink arrows are outward boundary fluxes: left {number(left)}, right {number(right)}.</p>
    {!coreOnly && ledger}
  </div>;
}

export function CellBars({ values, exact, label = 'Every signed cell average', identities, quantity = 'factor', identityStyles, coreOnly = false, ledgerOnly = false }) {
  const ledger = <Ledger label={identities ? `Every named ${quantity}` : 'Every stored average'} headers={[identities ? 'Identity' : 'Cell j', ...(!identities ? ['Center'] : []), 'Computed', ...(exact ? ['Exact'] : [])]} rows={values.map((value, j) => [identities?.[j] ?? j, ...(!identities ? [(j + .5) / values.length] : []), value, ...(exact ? [exact[j]] : [])])} />;
  if (ledgerOnly) return ledger;
  const low = Math.min(0, ...values, ...(exact ?? []));
  const high = Math.max(0, ...values, ...(exact ?? []));
  const span = high - low || 1;
  return <div className="npde-reading-object"><p>{label}</p><Scene label={label} height={175}>{width => {
    const y = value => 151 - (value - low) / span * 130;
    const step = (width - 24) / values.length;
    return <><line x1="12" x2={width - 12} y1={y(0)} y2={y(0)} stroke={colors.muted} />
      {values.map((value, j) => <rect key={j} x={12 + j * step} y={Math.min(y(0), y(value))} width={Math.max(.2, step - 1)} height={Math.abs(y(value) - y(0))} fill={identityStyles?.[j]?.color ?? (value < 0 ? colors.defect : colors.computed)} />)}
      {exact && <polyline fill="none" stroke={colors.field} strokeWidth="2" points={exact.map((value, j) => `${12 + (j + .5) * step},${y(value)}`).join(' ')} />}
    </>;
  }}</Scene><p>{identities ? `Bars identify the ${quantity === 'factor' ? 'discrete methods' : 'entries'} named below, left to right.` : 'Cells cover [0,1) from left to right with equal widths.'} Common signed {identities ? quantity : 'average'} scale: {number(low)} to {number(high)}. {identityStyles ? 'Method colours match the diffusion curves; position above or below zero carries sign.' : 'Amber: positive value; pink: negative value.'}{exact && ' Cyan: exact translated averages.'}</p>
    {identityStyles && <Legend series={identityStyles} />}{!coreOnly && ledger}
  </div>;
}

export function MaterialRod({ position, conductivity, flux, temperature, resistances, coreOnly = false, ledgerOnly = false }) {
  const ledger = <Ledger label="Resistance and continuity at the actual interface" headers={['Quantity', 'Value']} rows={[["R₁ = length / k₁", resistances[0]], ['R₂ = length / k₂', resistances[1]], ['Interface position', position], ['Continuous interface temperature', temperature]]} />;
  if (ledgerOnly) return ledger;
  return <div className="npde-reading-object"><Scene label="Actual two material lengths in the unit rod, carrying one common flux" height={90}>{width => {
    const span = width - 24;
    return <><rect x="12" y="25" width={position * span} height="32" fill="#193541" stroke={colors.field} /><rect x={12 + position * span} y="25" width={(1 - position) * span} height="32" fill="#3a3019" stroke={colors.computed} /><line x1="20" x2={width - 20} y1="70" y2="70" stroke={colors.reference} /><path d={`M${width - 24},66 l4,4 l-4,4`} stroke={colors.reference} fill="none" /></>;
  }}</Scene><p>Cyan left material: length {number(position)}, k₁=1. Amber right material: length {number(1 - position)}, k₂={number(conductivity)}. The arrow carries the same rightward flux q={number(flux)} through both.</p>
    {!coreOnly && ledger}
  </div>;
}

export function Riemann({ left, right, result, ledgerOnly = false }) {
  if (ledgerOnly) return null;
  const low = Math.min(-1, left, right, result.speed ?? 0) - .5;
  const high = Math.max(1, left, right, result.speed ?? 0) + .5;
  let points;
  if (result.kind === 'rarefaction') points = [[low, left], [left, left], [right, right], [high, right]];
  else if (result.kind === 'shock') points = [[low, left], [result.speed, left], [result.speed, right], [high, right]];
  else points = [[low, left], [high, right]];
  return <><Plot label="Entire self-similar entropy solution; fixed face at x/t = 0" xLabel="Similarity coordinate x/t" yLabel="State u" series={[{ label: `${result.kind}; left ${number(left)}, right ${number(right)}`, color: colors.field, points }]} xDomain={[low, high]} />
    <p>The vertical axis at similarity coordinate zero selects {result.faceState === null ? 'two stationary shock traces, with equal flux' : `face state ${number(result.faceState)}`}. Face flux is {number(result.flux)}. {result.speed !== undefined && `Shock speed is ${number(result.speed)}.`}</p></>;
}

export function RectangleMesh({ result, coreOnly = false, ledgerOnly = false }) {
  const ledger = <Ledger label="Addressed selected stencil" headers={['Position (i,j)', 'Physical (x,y)', 'Coefficient', 'Interior address or boundary']} rows={result.neighbors.map(p => [`(${p.i},${p.j})`, [p.i * result.hx, p.j * result.hy], p.coefficient, p.boundary ? 'known boundary → RHS' : p.index])} />;
  if (ledgerOnly) return ledger;
  const { xIntervals: nx, yIntervals: ny, xLength: length, yLength: height, selectedX, selectedY } = result;
  return <div className="npde-reading-object"><Scene label="Physical rectangle and true four-neighbor stencil; horizontal and vertical scales equal" height={210}>{width => {
    const scale = Math.min((width - 28) / length, 170 / height);
    const x = i => 14 + i * result.hx * scale;
    const y = j => 188 - j * result.hy * scale;
    return <>
      {Array.from({ length: nx + 1 }, (_, i) => <line key={`x${i}`} x1={x(i)} x2={x(i)} y1={y(0)} y2={y(ny)} stroke="#343a44" />)}
      {Array.from({ length: ny + 1 }, (_, j) => <line key={`y${j}`} x1={x(0)} x2={x(nx)} y1={y(j)} y2={y(j)} stroke="#343a44" />)}
      {result.neighbors.filter(p => p.i !== selectedX || p.j !== selectedY).map(p => <line key={`${p.i},${p.j}`} x1={x(selectedX)} y1={y(selectedY)} x2={x(p.i)} y2={y(p.j)} stroke={colors.computed} strokeWidth="2" />)}
      {Array.from({ length: ny + 1 }, (_, j) => Array.from({ length: nx + 1 }, (_, i) => <circle key={`${i},${j}`} cx={x(i)} cy={y(j)} r={i === selectedX && j === selectedY ? 5 : 2.5} fill={i === selectedX && j === selectedY ? colors.computed : i === 0 || j === 0 || i === nx || j === ny ? colors.reference : colors.field} />))}
    </>;
  }}</Scene><p>Physical extent {number(length)} × {number(height)}; hₓ={number(result.hx)}, hᵧ={number(result.hy)}. Amber selects ({selectedX},{selectedY}), vector address {result.selectedIndex}; violet nodes are known boundary data. Four lines follow physical neighbors, never a flattened row wrap.</p>
    {!coreOnly && ledger}
  </div>;
}

export function Squares({ values, label, weights }) {
  const amplitudes = values.map((value, j) => Math.sqrt(weights?.[j] ?? 1) * Math.abs(value));
  const max = Math.max(...amplitudes, 1e-10);
  return <div className="npde-reading-object"><p>{label}</p><div className="npde-square-grid">{values.map((value, j) => <div key={j}><svg viewBox="0 0 80 80" role="img" aria-label={`Term ${j}: side ${number(amplitudes[j])}, area ${number(amplitudes[j] ** 2)}`}><rect x="5" y={75 - 70 * amplitudes[j] / max} width={70 * amplitudes[j] / max} height={70 * amplitudes[j] / max} fill={value < 0 ? colors.defect : colors.computed} fillOpacity=".18" stroke={value < 0 ? colors.defect : colors.computed} /></svg><p>Term {j}: signed value {number(value)}; weighted area {number(amplitudes[j] ** 2)}</p></div>)}</div><p>All square sides share display scale: maximum side {number(max)} occupies 70 logical units. The sum of areas is {number(amplitudes.reduce((s, v) => s + v * v, 0))}.</p></div>;
}

for (const component of [CellBalance, CellBars, MaterialRod, Riemann, RectangleMesh]) component.npdeRole = 'core';

export function WorkTimeline({ reports }) {
  return <div className="npde-work-timeline">{reports.map(({ budget, used, success }) => <div key={budget}>
    <p><strong>{success ? 'Sufficient successful check' : 'Finite budget exhausted'}</strong>: {used} updates used of {budget} allowed.</p>
    <Scene label={`Work allowance ${budget}; actual stop at ${used}; ${success ? 'certified' : 'not certified'}`} height={64}>{width => {
      const start = 14, end = width - 14, stop = start + (end - start) * used / budget;
      return <><line x1={start} x2={end} y1="30" y2="30" stroke={colors.muted} strokeWidth="2" />
        <line x1={start} x2={stop} y1="30" y2="30" stroke={success ? colors.computed : colors.defect} strokeWidth="5" />
        <line x1={end} x2={end} y1="17" y2="43" stroke={colors.muted} strokeWidth="2" />
        {success ? <circle cx={stop} cy="30" r="6" fill={colors.computed} stroke="#090b0d" strokeWidth="2" /> : <path d={`M${stop-5},25 l10,10 m0,-10 l-10,10`} stroke={colors.defect} strokeWidth="3" />}
      </>;
    }}</Scene><div className="npde-axis-keys"><p>Start: 0 updates</p><p>Allowance: {budget} updates</p></div>
    <p>Linear scale for this row: 0 to {budget} updates. {success ? 'Amber circle: tested sufficient checkpoint; grey end cap: unused allowance remains.' : 'Pink cross: the finite allowance ended without certification.'}</p>
  </div>)}<p>Each row has its own stated work scale so the short failed run remains readable. Compare the labelled update counts, not lengths across rows.</p></div>;
}
