import { GaussianTableRegion } from "./GaussianTableRegion.jsx";
import { useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing, GaussianQuantity } from "./GaussianScalarFigures.jsx";
import { MixtureArrow, gaussianMixtureColours } from "./GaussianMixtureFigures.jsx";
import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import { overlappingAllocationRows } from "./gaussian-mixture-models.mjs";
import { defaultEmObservations, defaultEmParameters, emExpectation, fractionalScalarUpdate, weightedPointScatter,
  createEmSnapshot, advanceEmHalfStep, scalarEmTrace, weightedGaussianCrossings, logWeightedHeightDifference } from "./gaussian-em-models.mjs";
import "./gaussian-em.css";

const { left: LEFT, right: RIGHT, sum: SUM, ink: INK, reference: REFERENCE } = gaussianMixtureColours;
const colours = [LEFT, RIGHT];
export const emNumber = value => value === null ? 'unidentified' : value !== 0 && (Math.abs(value) < 1e-6 || Math.abs(value) >= 1e6)
  ? value.toExponential(8).replace(/-/g, '−') : flowNumber(value, 9);
const compact = value => Math.abs(value) >= 1e5 ? value.toExponential(2).replace(/-/g, '−') : flowNumber(value, 5);
const suppliedRows = () => overlappingAllocationRows().map(row => ({ ...row, x: row.query }));
const suppliedUpdate = () => fractionalScalarUpdate(defaultEmObservations(), suppliedRows());
const defaultParameters = defaultEmParameters();

function Figure({ job, children }) {
  return <section data-em-job={job} className="gmm-em-object" aria-label={`${job} mechanism`}>{children}</section>;
}

function ExactTable({ caption, headings, rows }) {
  return <div className="em-table-region" role="region" aria-label={caption} tabIndex={0}>
    <table className="em-exact-table"><caption>{caption}</caption><thead><tr>{headings.map(heading => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function Ruler({ width, y, lower = -3.4, upper = 3.4, ticks = [-3, -2, -1, 0, 1, 2, 3], left = 45, right = 25 }) {
  const x = value => left + (value - lower) / (upper - lower) * (width - left - right);
  return <g><line x1={left} x2={width - right} y1={y} y2={y} stroke={REFERENCE} />
    {ticks.map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1={y} y2={y + 5} stroke={REFERENCE} /><text x={x(value)} y={y + 27} textAnchor="middle">{value}</text></g>)}
  </g>;
}

function ObservationMarks({ observations, mapX, y }) {
  const grouped = new Map();
  observations.forEach(row => grouped.set(row.x, [...(grouped.get(row.x) ?? []), row.id]));
  return [...grouped].map(([value, ids]) => <g key={value} data-fixed-observation={ids.join(',')} data-coordinate={value}>
    <circle cx={mapX(value)} cy={y} r="4" fill={INK} />
    <text x={mapX(value)} y={y - 16} textAnchor="middle">{ids.join('/')}</text>
  </g>);
}

function WeightedBells({ id, parameters, lower = -6, upper = 6, roots = [], query = null, yMaximum = 0.8 }) {
  const mapX = (value, width) => 50 + (value - lower) / (upper - lower) * (width - 80);
  return <GaussianDrawing id={id} title="Weighted source heights on one coordinate ruler" width={800} height={400} adaptive
    description={`Means ${parameters.means.join(',')}, variances ${parameters.variances.join(',')}, weights ${parameters.weights.join(',')}. Left solid teal and Right dashed blue weighted Gaussian density heights share the coordinate domain ${lower} to ${upper} and density domain zero to ${yMaximum} per coordinate unit. Finite crossing roots inside this window are labelled on the ruler; other roots use a separate extent.`}>
    {width => {
      const x = value => mapX(value, width), y = value => 260 - value / yMaximum * 200;
      return <>
        <text x="20" y="25">Weighted density / coordinate unit</text>
        <line x1="50" x2="50" y1="60" y2="260" stroke={REFERENCE} />
        {[0, yMaximum / 2, yMaximum].map(value => <text key={value} x="42" y={y(value) + 5} textAnchor="end">{compact(value)}</text>)}
        {parameters.ids.map((component, index) => {
          const path = Array.from({ length: 321 }, (_, point) => {
            const value = lower + point / 320 * (upper - lower);
            const density = parameters.weights[index] * gaussianDetails(value, parameters.means[index], Math.sqrt(parameters.variances[index])).density;
            return `${point ? 'L' : 'M'}${x(value)},${y(density)}`;
          }).join(' ');
          return <path key={component} data-weighted-bell={component} d={path} fill="none" stroke={colours[index]} strokeWidth="2" strokeDasharray={index ? '7 4' : undefined} />;
        })}
        <Ruler width={width} left={50} right={30} y={260} lower={lower} upper={upper} ticks={[lower, (lower + upper) / 2, upper]} />
        {roots.map((root, index) => root >= lower && root <= upper && <g key={index} data-local-crossing={root}>
          <line x1={x(root)} x2={x(root)} y1="70" y2="260" stroke={REFERENCE} strokeDasharray="3 4" />
          <circle cx={x(root)} cy="260" r="5" fill="none" stroke={INK} />
          <text x={x(root)} y={315 + index * 24} textAnchor="middle">R{index + 1}</text>
        </g>)}
        {query !== null && <path data-boundary-query={query} d={`M${x(query)},254 l6,6 l-6,6 l-6,-6 Z`} fill={SUM} />}
        <text x="20" y="388">Constructed coordinate units</text>
      </>;
    }}
  </GaussianDrawing>;
}

function Parameters({ parameters, label }) {
  return <ExactTable caption={label} headings={['Component', 'Weight', 'Mean / unit', 'Variance / unit²']}
    rows={parameters.ids.map((id, index) => [<span style={{ color: colours[index] }}>{id}</span>, emNumber(parameters.weights[index]), emNumber(parameters.means[index]), emNumber(parameters.variances[index])])} />;
}

function RootExtent({ result }) {
  if (!result.roots.length) return <p data-root-status={result.status}>Root status: <strong>{result.status}</strong>. {result.status === 'equal everywhere' ? 'Both weighted curves coincide throughout the ruler; there is no isolated root.' : 'No finite equality coordinate belongs on the ruler.'}</p>;
  const lower = Math.min(-6, ...result.roots), upper = Math.max(6, ...result.roots), span = upper - lower;
  return <>
    <GaussianDrawing id="D22-root-extent" title="Every finite root on a separately labelled coordinate extent" width={800} height={215} adaptive
      description={`The supplementary ruler extends from ${lower} to ${upper} coordinate units. The local minus six to six window occupies ${12 / span} of this extent. Root rows preserve actual coordinates without separating close quantitative positions.`}>
      {width => {
        const x = value => 45 + (value - lower) / span * (width - 70);
        return <>
          <text x="20" y="25">Supplementary extent · same units</text>
          <line x1="45" x2={width - 25} y1="70" y2="70" stroke={REFERENCE} />
          <line x1={x(-6)} x2={x(6)} y1="70" y2="70" stroke={SUM} strokeWidth="4" data-local-window-fraction={12 / span} />
          <text x="45" y="101">{compact(lower)}</text><text x={width - 25} y="101" textAnchor="end">{compact(upper)}</text>
          {result.roots.map((root, index) => <g key={index} data-global-crossing={root}>
            <line x1={x(root)} x2={x(root)} y1="62" y2={128 + index * 36} stroke={INK} strokeDasharray="3 4" />
            <circle cx={x(root)} cy={128 + index * 36} r="4" fill="none" stroke={INK} />
            <text x="20" y={136 + index * 36}>R{index + 1}</text>
          </g>)}
        </>;
      }}
    </GaussianDrawing>
    <p>The amber interval is the local [−6,6] window at its true fraction of this extent. Its 12-unit width is <strong>{emNumber(12 / span)}</strong> of the {emNumber(span)}-unit supplementary ruler. The local picture magnifies coordinates by {emNumber(span / 12)} relative to this supplementary extent. The interval may be smaller than a screen pixel; the coordinates below still expose every root.</p>
    <ExactTable caption="All finite crossing coordinates" headings={['Root', 'Coordinate / unit', 'In local window?']} rows={result.roots.map((root, index) => [`R${index + 1}`, emNumber(root), root >= -6 && root <= 6 ? 'yes' : 'no'])} />
  </>;
}

export function GaussianBoundaryLab() {
  const [input, setInput] = useState({ variance: 0.25, weight: 0.5, query: 0 }), [reset, setReset] = useState(0);
  const anatomy = [
    { label: 'Equal variances: one crossing', means: [-2, 2], variances: [1, 1], weights: [0.5, 0.5] },
    { label: 'Narrower Left: two crossings', means: [-2, 2], variances: [0.25, 1], weights: [0.5, 0.5] },
    { label: 'Identical densities, unequal priors: none', means: [0, 0], variances: [1, 1], weights: [0.2, 0.8] },
    { label: 'Identical densities and equal priors: everywhere', means: [0, 0], variances: [1, 1], weights: [0.5, 0.5] },
  ];
  const parameters = { ids: ['Left', 'Right'], means: [-2, 2], variances: [input.variance, 1], weights: [input.weight, 1 - input.weight] };
  const result = weightedGaussianCrossings(parameters.means, parameters.variances, parameters.weights);
  const difference = logWeightedHeightDifference(input.query, parameters.means, parameters.variances, parameters.weights);
  const nearEqual = weightedGaussianCrossings([-2, 2], [1.000000001, 1], [0.5, 0.5]);
  const tangent = { ids: ['Left', 'Right'], means: [0, 0], variances: [1, 4], weights: [1 / 3, 2 / 3] };
  const floatingTangent = weightedGaussianCrossings(tangent.means, tangent.variances, tangent.weights);
  return <Figure job="D22">
    <div className="em-grid">{anatomy.map((entry, index) => <div key={entry.label}>
      <p>{entry.label}</p><WeightedBells id={`D22-anatomy-${index}`} lower={-7} upper={7} parameters={{ ...entry, ids: ['Left', 'Right'] }} roots={weightedGaussianCrossings(entry.means, entry.variances, entry.weights).roots} />
      <p>{entry.means.join(' / ')} means; {entry.variances.join(' / ')} variances; {entry.weights.join(' / ')} weights.</p>
    </div>)}</div>
    <FlowLab id="gmm-d22" label="Move a query while changing Left variance and weight">
      <Parameters parameters={parameters} label="Current weighted-curve parameters" />
      <WeightedBells id="D22" parameters={parameters} roots={result.roots} query={input.query} />
      <RootExtent result={result} />
      <FlowControls key={reset}>
        <GaussianQuantity name="Left variance" value={input.variance} min={0.25} max={4} step={0.25} onChange={variance => setInput(previous => ({ ...previous, variance }))} />
        <GaussianQuantity name="Left weight" value={input.weight} min={0.05} max={0.95} step={0.05} onChange={weight => setInput(previous => ({ ...previous, weight }))} />
        <GaussianQuantity name="Query x" value={input.query} min={-6} max={6} step={0.25} onChange={query => setInput(previous => ({ ...previous, query }))} />
        <button type="button" onClick={() => { setInput({ variance: 0.25, weight: 0.5, query: 0 }); setReset(value => value + 1); }}>Reset</button>
      </FlowControls>
      <FlowReadout data-live-boundary-status={result.status}>At x={emNumber(input.query)}, log Left weighted height minus log Right weighted height is <strong>{emNumber(difference)}</strong>: {difference === 0 ? 'literal equality' : difference > 0 ? 'Left is higher' : 'Right is higher'}. The full finite-root status is <strong>{result.status}</strong>. Exact branches use literal coefficients; near-discriminant diagnosis is {result.nearDiscriminant ? 'present' : 'absent'} and near-linear diagnosis is {result.nearLinear ? 'present' : 'absent'}.</FlowReadout>
      <ExactTable caption="Log-height equality coefficients a·x²+b·x+c" headings={['Coefficient', 'Value']} rows={result.coefficients.map((value, index) => [['a', 'b', 'c'][index], emNumber(value)])} />
    </FlowLab>
    <p>A separate near-equal-variance witness keeps means −2/+2 and equal weights, but uses Left variance 1.000000001. Its distant root must remain visible without stretching the local query picture.</p>
    <RootExtent result={nearEqual} />
    <div className="em-grid">
      <div><p>Analytical tangent: means 0/0, variances 1/4, priors ⅓/⅔.</p><WeightedBells id="D22-tangent" parameters={tangent} roots={[0]} />
        <p>In exact arithmetic the log-height difference is −3x²/8, so x=0 is a tangent. Floating coefficients give <strong>{floatingTangent.status}</strong>; the near-discriminant diagnostic is {String(floatingTangent.nearDiscriminant)}. These are distinct statements.</p></div>
      <div><p>Separate practice witness: means 0/2, variances 1/1, priors ¼/¾.</p>
        <WeightedBells id="D22-practice" parameters={{ ids: ['Left', 'Right'], means: [0, 2], variances: [1, 1], weights: [0.25, 0.75] }} roots={[1 - Math.log(3) / 2]} />
        <p>The equality coordinate is 1−log(3)/2 = <strong>{emNumber(1 - Math.log(3) / 2)}</strong> units.</p></div>
    </div>
  </Figure>;
}

export function GaussianStationaryAllocations() {
  const rows = suppliedRows();
  return <Figure job="D23"><GaussianDrawing id="D23" title="Fixed observations send fractional mass into component lanes" width={820} height={650} adaptive
    description="A through D stay at minus two, minus one, one and two on every lane. Each raw observation appears once as a neutral filled dot. Its unit-height split bar sends Left/Right fractions to component lanes at the same x, without changing the coordinate or duplicating the observation.">
    {width => {
      const x = value => 45 + (value + 3.4) / 6.8 * (width - 70);
      return <>
        <text x="20" y="25">One observation · total mass 1</text>
        {[0, 0.5, 1].map(value => <text x="20" key={value} y={180 - value * 100 + 5}>{value}</text>)}
        {rows.map(row => {
          const left = row.components[0].share, right = row.components[1].share;
          return <g key={row.id} data-stationary-allocation={row.id} data-coordinate={row.x}>
            <rect x={x(row.x) - 7} y={180 - left * 100} width="14" height={left * 100} fill={LEFT} />
            <rect x={x(row.x) - 7} y="80" width="14" height={right * 100} fill={RIGHT} />
            <circle cx={x(row.x)} cy="215" r="4" fill={INK} /><text x={x(row.x)} y="241" textAnchor="middle">{row.id}</text>
            <line x1={x(row.x)} x2={x(row.x)} y1={375 - left * 100} y2="375" stroke={LEFT} strokeWidth="14" />
            <line x1={x(row.x)} x2={x(row.x)} y1={535 - right * 100} y2="535" stroke={RIGHT} strokeWidth="14" />
          </g>;
        })}
        <text x="20" y="267" fill={LEFT}>Left fractions · mass scale 0…1</text><Ruler width={width} y={375} />
        <text x="20" y="427" fill={RIGHT}>Right fractions · same 0…1 scale</text><Ruler width={width} y={535} />
        <text x="20" y="623">Same constructed coordinate units</text>
      </>;
    }}
  </GaussianDrawing><ExactTable caption="Coordinate and allocation identity" headings={['Observed ID', 'x / unit', 'Left fraction', 'Right fraction', 'Row sum']} rows={rows.map(row => [row.id, row.x, emNumber(row.components[0].share), emNumber(row.components[1].share), emNumber(row.components.reduce((total, component) => total + component.share, 0))])} /></Figure>;
}

function MassColumn({ component }) {
  return <GaussianDrawing id={`D24-${component.id}`} title={`${component.id} fractions add to an effective count`} width={390} height={540} adaptive
    description={`Each ${component.id} share uses the same zero-to-one bar, then contributes to count ${component.count}. Dividing by four observed rows gives mixing weight ${component.weight}.`}>
    {width => <>
      <text x="20" y="25" fill={colours[component.id === 'Right' ? 1 : 0]}>{component.id} fractional mass</text>
      {component.rows.map((row, index) => {
        const y = 65 + index * 65, start = 70, span = width - 100;
        return <g key={row.id}>
          <text x="20" y={y + 5}>{row.id}</text><line x1={start} x2={width - 30} y1={y} y2={y} stroke={REFERENCE} />
          <line x1={start} x2={start + row.share * span} y1={y} y2={y} stroke={colours[component.id === 'Right' ? 1 : 0]} strokeWidth="10" />
          <text x={start} y={y + 26}>{compact(row.share)}</text>
          <MixtureArrow points={[[width - 30, y], [width - 15, y], [width - 15, 340], [width / 2 + 22, 340]]} color={REFERENCE} />
        </g>;
      })}
      <text x="70" y="310">Bars: 0 to 1 · same scale</text>
      <circle cx={width / 2} cy="340" r="22" stroke={SUM} fill="none" /><text x={width / 2} y="346" textAnchor="middle">Σ</text>
      <text x={width / 2} y="390" textAnchor="middle">N = {emNumber(component.count)}</text>
      <MixtureArrow points={[[width / 2, 400], [width / 2, 424]]} />
      <circle cx={width / 2} cy="445" r="21" fill="none" stroke={INK} /><text x={width / 2} y="451" textAnchor="middle">÷</text><text x={width / 2 + 34} y="451">n = 4</text>
      <MixtureArrow points={[[width / 2, 466], [width / 2, 485]]} />
      <text x={width / 2} y="520" textAnchor="middle" fill={colours[component.id === 'Right' ? 1 : 0]}>New weight = {emNumber(component.weight)}</text>
    </>}
  </GaussianDrawing>;
}

function ReductionLane({ id, operands, operator = 'Σ', total, divisor, result, operandUnit, resultUnit, label }) {
  return <GaussianDrawing id={id} title={label} width={430} height={590} adaptive
    description={`${operands.map(row => `${row.id}: ${row.value}`).join('; ')} enter ${operator}, producing ${total}${divisor === undefined ? '' : `, then division by ${divisor} produces ${result}`}. Units are labelled at their actual ports.`}>
    {width => <>
      <text x="20" y="25">{operandUnit}</text>
      {operands.map((row, index) => {
        const y = 75 + index * 62;
        return <g key={row.id}><text x="20" y={y + 5}>{row.id}</text><text x="65" y={y + 5}>{compact(row.value)}</text>
          <MixtureArrow color={REFERENCE} points={[[width - 100, y], [width - 25, y], [width - 25, 330], [width / 2 + 22, 330]]} /></g>;
      })}
      <circle cx={width / 2} cy="330" r="22" fill="none" stroke={SUM} /><text x={width / 2} y="336" textAnchor="middle">{operator}</text>
      <MixtureArrow points={[[width / 2, 352], [width / 2, 378]]} />
      <text x={width / 2} y="405" textAnchor="middle">{compact(total)}</text>
      {divisor !== undefined && <><MixtureArrow points={[[width / 2, 417], [width / 2, 447]]} />
        <circle cx={width / 2} cy="470" r="22" fill="none" stroke={INK} /><text x={width / 2} y="476" textAnchor="middle">÷</text>
        <text x={width / 2 + 35} y="476">{compact(divisor)}</text>
        <MixtureArrow points={[[width / 2, 492], [width / 2, 518]]} /><text x={width / 2} y="546" textAnchor="middle">{compact(result)}</text></>}
      <text x="20" y="582">{resultUnit}</text>
    </>}
  </GaussianDrawing>;
}

export function GaussianEffectiveCounts() {
  const update = suppliedUpdate();
  return <Figure job="D24"><div className="em-grid">{update.components.map(component => <MassColumn key={component.id} component={component} />)}</div>
    <div className="em-mass-bracket" aria-label="All fractional mass totals four observations"><span style={{ color: LEFT }}>Left: 2</span><span>+</span><span style={{ color: RIGHT }}>Right: 2</span></div>
    <p className="em-total-mass">Total allocated mass 4 = four observed rows. This is a sum of fractions, not a count of hard labels.</p>
    <ExactTable caption="Separate three-observation practice allocation" headings={['Observed row', 'Left fraction']} rows={[[1, 0.8], [2, 0.4], [3, 0.1], ['Effective count', '1.3'], ['Mixing weight', '1.3 / 3 = 13/30']]} />
    <p data-empty-component="Left">Empty-column comparison: shares [0,0,0] give Left count 0 and weight 0; its mean is <strong>unidentified</strong> (∅), not a number obtained by dividing by zero.</p>
  </Figure>;
}

function CentreRuler({ component, oldMean = component.id === 'Left' ? -1 : 1, prefix = 'D25' }) {
  const index = component.id === 'Right' ? 1 : 0;
  return <GaussianDrawing id={`${prefix}-${component.id}`} title={`${component.id} old and new centre on one unchanged ruler`} width={430} height={240} adaptive
    description={`Fixed observed coordinates minus two, minus one, one, two stay on the top ruler. ${component.id} old centre ${oldMean} is an open circle and new centre ${component.mean} is filled on the same minus3.4-to3.4 unit scale.`}>
    {width => {
      const x = value => 45 + (value + 3.4) / 6.8 * (width - 70);
      return <>
        <text x="20" y="25">Observed IDs · positions unchanged</text><ObservationMarks observations={defaultEmObservations()} mapX={x} y={75} /><Ruler width={width} y={75} />
        <text x="20" y="132" fill={colours[index]}>{component.id} · ○ old / ● new</text>
        <Ruler width={width} y={170} /><circle cx={x(oldMean)} cy="170" r="7" fill="none" stroke={colours[index]} />
        <circle cx={x(component.mean)} cy="170" r="5" fill={colours[index]} />
        <MixtureArrow color={colours[index]} points={[[x(oldMean), 150], [x(component.mean), 150]]} />
        <text x="20" y="234">Constructed coordinate units</text>
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianWeightedCentres() {
  const update = suppliedUpdate();
  return <Figure job="D25"><div className="em-grid">{update.components.map(component => <div key={component.id}>
    <CentreRuler component={component} />
    <ExactTable caption={`${component.id}: signed row products at the fixed measurement coordinates`} headings={['ID', 'x / unit', 'Used share', 'r × x / unit']} rows={component.rows.map(row => [row.id, row.x, emNumber(row.share), emNumber(row.signedProduct)])} />
    <ReductionLane id={`D25-reduce-${component.id}`} operands={component.rows.map(row => ({ id: row.id, value: row.signedProduct }))} total={component.numerator} divisor={component.count} result={component.mean} operandUnit={`${component.id}: r × x / unit`} resultUnit="New mean / coordinate unit" label="Signed row products reduce to a weighted centre" />
    <p data-mean-update={component.id} style={{ color: colours[component.id === 'Right' ? 1 : 0] }}>Σ(r × x) = <strong>{emNumber(component.numerator)}</strong> units → divide by N={emNumber(component.count)} → new mean <strong>{emNumber(component.mean)}</strong> units.</p>
  </div>)}</div></Figure>;
}

export function GaussianNewCentreScatter() {
  const component = suppliedUpdate().components[0], oldMean = -1;
  const wrong = component.rows.reduce((total, row) => total + row.share * (row.x - oldMean) ** 2, 0) / component.count;
  return <Figure job="D26"><GaussianDrawing id="D26" title="Residuals start at the new centre before they enter scatter" width={900} height={610} adaptive
    description={`Every observed ID has a residual from new Left mean ${component.mean}. The same used shares multiply squared residuals. Raw variance ${component.variance} corresponds to standard deviation ${component.standardDeviation}. Before SD one and after SD ${component.standardDeviation} use the same constructed coordinate ruler; variance is a squared unit, not a line length.`}>
    {width => {
      const x = value => 45 + (value + 3.4) / 6.8 * (width - 70);
      return <>
        {component.rows.map((row, index) => {
          const y = 55 + index * 95;
          return <g key={row.id} data-scatter-residual={row.id}>
            <text x="20" y={y - 26}>ID {row.id} · Δ = {compact(row.residual)}</text>
            <Ruler width={width} y={y} /><circle cx={x(row.x)} cy={y} r="4" fill={INK} />
            <path d={`M${x(component.mean) - 5},${y - 5} l10,10 m-10,0 l10,-10`} stroke={LEFT} />
            <MixtureArrow color={LEFT} points={[[x(component.mean), y - 10], [x(row.x), y - 10]]} />
          </g>;
        })}
        {[{ sd: 1, center: oldMean, label: 'Before: SD 1', y: 470 }, { sd: component.standardDeviation, center: component.mean, label: `After: SD ${compact(component.standardDeviation)}`, y: 560 }].map(entry => <g key={entry.label}>
          <text x="20" y={entry.y - 28}>{entry.label}</text><Ruler width={width} y={entry.y} />
          <line x1={x(entry.center - entry.sd)} x2={x(entry.center + entry.sd)} y1={entry.y - 12} y2={entry.y - 12} stroke={LEFT} />
          {[-1, 1].map(sign => <line key={sign} x1={x(entry.center + sign * entry.sd)} x2={x(entry.center + sign * entry.sd)} y1={entry.y - 18} y2={entry.y - 6} stroke={LEFT} />)}
        </g>)}
      </>;
    }}
  </GaussianDrawing>
    <ExactTable caption="Left: new-centre residual → square → used-share multiplication" headings={['ID', 'Residual / unit', 'Square / unit²', 'Share', 'Weighted square / unit²']} rows={component.rows.map(row => [row.id, emNumber(row.residual), emNumber(row.square), emNumber(row.share), emNumber(row.weightedSquare)])} />
    <ReductionLane id="D26-scatter-reduction" operands={component.rows.map(row => ({ id: row.id, value: row.weightedSquare }))} total={component.scatter} divisor={component.count} result={component.variance} operandUnit="r × new-centre Δ² / unit²" resultUnit="Raw variance / square unit" label="Weighted squared new-centre residuals reduce to variance" />
    <p>Σ(r·Δ²)={emNumber(component.scatter)} square units; divide by N={emNumber(component.count)} to get variance <strong>{emNumber(component.variance)}</strong> square units. Its square root is the drawn SD.</p>
    <p>Separate wrong-old-centre scatter: <strong>{emNumber(wrong)}</strong> square units, exceeding the correct result by (new−old mean)²=<strong>{emNumber((component.mean - oldMean) ** 2)}</strong>. Constant observations would give raw scatter zero; no floor has been introduced.</p>
  </Figure>;
}

function Matrix({ values, label }) {
  return <div className="em-matrix" role="group" aria-label={label}><span aria-hidden="true">[</span><GaussianTableRegion><table><caption>{label}</caption><tbody>{values.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{compact(value)}</td>)}</tr>)}</tbody></table></GaussianTableRegion><span aria-hidden="true">]</span></div>;
}

function ResidualPlane({ contribution, mean }) {
  return <GaussianDrawing id={`D27-${contribution.id}`} title={`${contribution.id} residual in two paired coordinates`} width={330} height={350} adaptive
    description={`Observed point ${contribution.point}, new centre ${mean}, residual ${contribution.residual}; horizontal and vertical unit scales are equal. The neutral point keeps observation ID ${contribution.id}; the teal cross is the new component centre.`}>
    {width => {
      const span = width - 85, x = value => 50 + (value + 1) / 3.5 * span, y = value => 275 - (value + 1) / 3.5 * span;
      return <>
        <text x="20" y="25">ID {contribution.id} · share {contribution.share}</text>
        <line x1={x(-1)} x2={x(2.5)} y1={y(0)} y2={y(0)} stroke={REFERENCE} /><line x1={x(0)} x2={x(0)} y1={y(-1)} y2={y(2.5)} stroke={REFERENCE} />
        {[0, 1, 2].map(value => <g key={value}><text x={x(value)} y={y(-1) + 28} textAnchor="middle">{value}</text><text x="40" y={y(value) + 5} textAnchor="end">{value}</text></g>)}
        <MixtureArrow color={LEFT} points={[[x(mean[0]), y(mean[1])], [x(contribution.point[0]), y(contribution.point[1])]]} />
        <path d={`M${x(mean[0]) - 5},${y(mean[1]) - 5} l10,10 m-10,0 l10,-10`} stroke={LEFT} />
        <circle cx={x(contribution.point[0])} cy={y(contribution.point[1])} r="4" fill={INK} />
        <text x={x(contribution.point[0]) + 9} y={y(contribution.point[1]) - 10}>{contribution.id}</text>
        <text x="20" y="345">Equal arbitrary-unit axes</text>
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianWeightedOuterScatter() {
  const state = weightedPointScatter([[0, 0], [2, 0], [0, 2]], [0.8, 0.4, 0.1]);
  return <Figure job="D27"><p>New Left centre: (8/13,2/13) = ({emNumber(state.mean[0])},{emNumber(state.mean[1])}) units; effective count 1.3.</p>
    <div className="em-grid em-three-contributions">{state.contributions.map(contribution => <div key={contribution.id} data-outer-contribution={contribution.id}>
      <ResidualPlane contribution={contribution} mean={state.mean} />
      <p>Residual column Δ = [{contribution.residual.map(emNumber).join(', ')}] units. Pair each coordinate with both row coordinates.</p>
      <Matrix values={contribution.outer} label={`${contribution.id}: Δ × Δᵀ / unit²`} /><p>↓ multiply every cell by share {contribution.share}</p>
      <Matrix values={contribution.weighted} label={`${contribution.id}: r·ΔΔᵀ / unit²`} />
    </div>)}</div>
    <p>↓ add corresponding cells across the three observed IDs</p><Matrix values={state.scatter} label="Full centered scatter sum / unit²" />
    <p>↓ divide every cell by effective count 1.3</p><Matrix values={state.covariance} label="Covariance / unit²" />
    <p data-exact-covariance="D27">Exact result: [[144/169, −16/169], [−16/169, 48/169]]. Both negative cross cells remain. This is one supplied-allocation update, not a fitted experiment.</p>
  </Figure>;
}

export function GaussianAllocationTimestamps() {
  const old = emExpectation(defaultEmObservations(), defaultParameters), update = suppliedUpdate(), fresh = emExpectation(defaultEmObservations(), update.parameters);
  return <Figure job="D28"><div className="em-grid">
    <div><WeightedBells id="D28-old" parameters={defaultParameters} lower={-4} upper={4} yMaximum={0.5} /><Parameters parameters={defaultParameters} label="Old parameters θ₀" /></div>
    <div><WeightedBells id="D28-new" parameters={update.parameters} lower={-4} upper={4} yMaximum={0.5} /><Parameters parameters={update.parameters} label="New parameters θ₁" /></div>
  </div><ExactTable caption="Chronology: used allocations remain old; fresh allocations are next E" headings={['Observed ID', 'Used Left under θ₀', 'Fresh Left under θ₁']} rows={old.rows.map((row, index) => [row.id, emNumber(row.components[0].share), emNumber(fresh.rows[index].components[0].share)])} />
    <p>θ₀ → used r₀ → M update θ₁ → next-E r₁. A's used share <strong>{emNumber(old.rows[0].components[0].share)}</strong> is not replaced by its fresh <strong>{emNumber(fresh.rows[0].components[0].share)}</strong> when naming the update.</p>
  </Figure>;
}

function RowDensityCircuit({ row, iteration }) {
  return <GaussianDrawing id={`D29-row-${row.id}`} title={`${row.id} adds two alternative weighted heights before taking a log`} width={425} height={400} adaptive
    description={`Observed ${row.id} at ${row.x} stays fixed. Under parameter time ${iteration}, Left weighted height ${row.components[0].weightedDensity}, Right ${row.components[1].weightedDensity}, their density sum ${row.density}, natural log ${row.logDensity}. These are source alternatives for one row.`}>
    {width => <>
      <text x="20" y="25">ID {row.id} · x={compact(row.x)} · θ{iteration}</text>
      {row.components.map((component, index) => {
        const x = width * (index ? 0.75 : 0.25);
        return <g key={component.id}>
          <text x={x} y="65" textAnchor="middle" fill={colours[index]}>{component.id} height</text>
          <text x={x} y="95" textAnchor="middle" fill={colours[index]}>{compact(component.weightedDensity)}</text>
          <MixtureArrow color={colours[index]} points={[[x, 108], [x, 160], [width / 2 + (index ? 20 : -20), 160]]} />
        </g>;
      })}
      <circle cx={width / 2} cy="160" r="20" fill="none" stroke={SUM} /><text x={width / 2} y="166" textAnchor="middle">+</text>
      <MixtureArrow color={SUM} points={[[width / 2, 180], [width / 2, 208]]} />
      <text x={width / 2} y="237" textAnchor="middle" fill={SUM}>{compact(row.density)} / unit</text>
      <MixtureArrow points={[[width / 2, 248], [width / 2, 273]]} /><circle cx={width / 2} cy="295" r="22" fill="none" stroke={INK} />
      <text x={width / 2} y="301" textAnchor="middle">ln</text><MixtureArrow points={[[width / 2, 317], [width / 2, 343]]} />
      <text x={width / 2} y="372" textAnchor="middle">{compact(row.logDensity)} nats</text>
    </>}
  </GaussianDrawing>;
}

function ObjectiveReduction({ objective, iteration }) {
  return <><div className="em-grid">
    <div><ReductionLane id="D29-product" operands={objective.rows.map(row => ({ id: row.id, value: row.density }))} operator="Π" total={objective.likelihood} operandUnit="Densities / coordinate unit" resultUnit="Likelihood / unit⁴" label="Across different IDs the likelihood multiplies densities" /><p>Across DIFFERENT observed IDs, conditional independent sampling multiplies densities:</p>
      <div className="em-reduction-values">{objective.rows.map(row => <span key={row.id}>{row.id}: {emNumber(row.density)} / unit</span>)}</div>
      <p className="em-reduction-port">Π → L(θ{iteration};X) = <strong>{emNumber(objective.likelihood)}</strong> / unit⁴</p>
    </div>
    <div><ReductionLane id="D29-log-sum" operands={objective.rows.map(row => ({ id: row.id, value: row.logDensity }))} total={objective.totalLogLikelihood} divisor={objective.rows.length} result={objective.meanLogLikelihood} operandUnit="Row natural logs / nats" resultUnit="Mean log density / nats per row" label="Row logs add before division produces a mean" /><p>Taking natural logs changes the outer product into a sum:</p>
      <div className="em-reduction-values">{objective.rows.map(row => <span key={row.id}>{row.id}: {emNumber(row.logDensity)} nats</span>)}</div>
      <p className="em-reduction-port">Σ → ℓ(θ{iteration};X) = <strong>{emNumber(objective.totalLogLikelihood)}</strong> nats</p>
    </div>
  </div><p>ln L = ℓ. Then ℓ ÷ n={objective.rows.length} → mean <strong>{emNumber(objective.meanLogLikelihood)}</strong> nats per row. Values use the same θ{iteration}; no responsibilities enter the product.</p></>;
}

function HalfStepCircuit({ snapshot, id }) {
  return <GaussianDrawing id={id} title="A half-step holds one complete object fixed" width={600} height={500} adaptive
    description={`Current parameter time ${snapshot.iteration}, next action ${snapshot.phase}. E holds parameters fixed and evaluates allocations. M holds used allocations from time ${snapshot.allocationIteration} fixed and updates parameters. Objective attaches to the current parameters, never to a hybrid.`}>
    {width => {
      const center = width / 2;
      return <>
        <text x="20" y="25">Parameter time θ{snapshot.iteration}</text>
        <circle cx={center} cy="75" r="24" fill="none" stroke={INK} /><text x={center} y="81" textAnchor="middle">θ</text>
        <MixtureArrow points={[[center, 99], [center, 138]]} /><circle cx={center} cy="162" r="24" fill="none" stroke={snapshot.phase === 'E' ? SUM : INK} />
        <text x={center} y="168" textAnchor="middle">E</text><text x="20" y="210">θ held fixed → evaluate shares</text>
        <MixtureArrow points={[[center, 215], [center, 246]]} /><circle cx={center} cy="270" r="24" fill="none" stroke={LEFT} /><text x={center} y="276" textAnchor="middle">r</text>
        <text x="20" y="318">Used r from θ{snapshot.allocationIteration}</text>
        <MixtureArrow points={[[center, 323], [center, 352]]} /><circle cx={center} cy="376" r="24" fill="none" stroke={snapshot.phase === 'M' ? SUM : INK} />
        <text x={center} y="382" textAnchor="middle">M</text><text x="20" y="429">Used r held fixed → update θ</text>
        <MixtureArrow points={[[center, 440], [center, 461]]} /><text x={center} y="492" textAnchor="middle">next θ · then next E</text>
      </>;
    }}
  </GaussianDrawing>;
}

function StepActions({ snapshot, history, setHistory, reset }) {
  const cap = snapshot.iteration >= 50;
  return <FlowControls>
    <button type="button" disabled={snapshot.phase !== 'E' || snapshot.status === 'refused' || cap} onClick={() => setHistory([...history, advanceEmHalfStep(snapshot)])}>E: evaluate allocations</button>
    <button type="button" disabled={snapshot.phase !== 'M' || snapshot.status === 'refused' || cap} onClick={() => setHistory([...history, advanceEmHalfStep(snapshot)])}>M: update parameters</button>
    <button type="button" disabled={history.length <= 1} onClick={() => setHistory(history.slice(0, -1))}>Back one half-step</button>
    <button type="button" onClick={reset}>Reset</button>
  </FlowControls>;
}

function CurrentAllocations({ snapshot, caption }) {
  return <ExactTable caption={caption ?? `Used shares: ${snapshot.allocationLabel}`} headings={['Observed ID', 'x / unit', 'Used Left', 'Used Right']} rows={snapshot.usedAllocations.map(row => [row.id, row.x, emNumber(row.components[0].share), emNumber(row.components[1].share)])} />;
}

export function GaussianEmHalfSteps() {
  const [history, setHistory] = useState(() => [createEmSnapshot()]), snapshot = history.at(-1);
  return <Figure job="D29"><FlowLab id="gmm-d29" label="Alternate E and M while retaining complete parameter and allocation times">
    <Parameters parameters={snapshot.parameters} label={`Current parameters θ${snapshot.iteration}`} />
    <div className="em-grid">{snapshot.objective.rows.map(row => <RowDensityCircuit key={row.id} row={row} iteration={snapshot.iteration} />)}</div>
    <ExactTable caption={`Per-row objective operands under θ${snapshot.iteration}`} headings={['ID', 'x', 'Left weighted density', 'Right weighted density', 'Density sum', 'Natural log']} rows={snapshot.objective.rows.map(row => [row.id, row.x, emNumber(row.components[0].weightedDensity), emNumber(row.components[1].weightedDensity), emNumber(row.density), emNumber(row.logDensity)])} />
    <ObjectiveReduction objective={snapshot.objective} iteration={snapshot.iteration} />
    <HalfStepCircuit snapshot={snapshot} id="D29" /><CurrentAllocations snapshot={snapshot} />
    <StepActions snapshot={snapshot} history={history} setHistory={setHistory} reset={() => setHistory([createEmSnapshot()])} />
    <FlowReadout data-em-time={snapshot.iteration} data-em-phase={snapshot.phase} data-total-log-likelihood={snapshot.objective.totalLogLikelihood}>Current total log likelihood <strong>{emNumber(snapshot.objective.totalLogLikelihood)}</strong>, mean <strong>{emNumber(snapshot.objective.meanLogLikelihood)}</strong> nats per row. {snapshot.phase === 'M' ? 'E evaluated these shares while θ stayed fixed; M is next.' : snapshot.iteration ? `M changed θ; the used shares still belong to θ${snapshot.allocationIteration}. Next E evaluates the new θ.` : 'The default shares and objective are already visible; E records this allocation time.'} {snapshot.status === 'refused' && snapshot.reason}</FlowReadout>
  </FlowLab></Figure>;
}

export function GaussianEmTraceDrawing({ trace, selectedIteration = 0, id = 'D30-trace' }) {
  const values = trace.states.map(snapshot => snapshot.objective.totalLogLikelihood);
  const minimum = Math.min(...values), maximum = Math.max(...values), flat = minimum === maximum;
  const margin = flat ? 0.25 : Math.max(0.1, (maximum - minimum) * 0.08), lower = minimum - margin, upper = maximum + margin;
  return <><GaussianDrawing id={id} title="Every computed parameter-state log likelihood on a linear axis" width={820} height={360} adaptive
    description={`${trace.states.length} parameter states are stored. Total log likelihood in nats uses a linear range ${lower} to ${upper}${flat ? ', deliberately expanded around a true constant' : ''}. The horizontal axis is iteration zero to fifty, no data states are discarded when ticks are decimated.`}>
    {width => {
      const x = iteration => 70 + iteration / 50 * (width - 100), y = value => 250 - (value - lower) / (upper - lower) * 180;
      return <>
        <text x="20" y="25">Total log likelihood ℓ · nats</text>
        <line x1="70" x2="70" y1="70" y2="250" stroke={REFERENCE} />
        {[lower, (lower + upper) / 2, upper].map(value => <text key={value} x="60" y={y(value) + 5} textAnchor="end">{flowNumber(value, 2)}</text>)}
        <path data-trace-point-count={values.length} d={values.map((value, index) => `${index ? 'L' : 'M'}${x(index)},${y(value)}`).join(' ')} fill="none" stroke={SUM} strokeWidth="2" />
        {values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r={index === selectedIteration ? 5 : 2} fill={index === selectedIteration ? INK : SUM} />)}
        <line x1="70" x2={width - 30} y1="250" y2="250" stroke={REFERENCE} />
        {[0, 10, 20, 30, 40, 50].map(iteration => <text key={iteration} x={x(iteration)} y="280" textAnchor="middle">{iteration}</text>)}
        <text x="20" y="316">Iteration · 50-cycle cap</text>
        <text x="20" y="346">{flat ? 'Expanded range · true constant line' : 'Linear vertical scale · all states kept'}</text>
      </>;
    }}
  </GaussianDrawing>{trace.status === 'refused' && <p role="status">The trace stops after {trace.states.length - 1} accepted cycles: {trace.reason} Earlier states remain readable.</p>}</>;
}

function EntityEditor({ mode }) {
  const initial = () => ({ observations: defaultEmObservations(), parameters: defaultEmParameters() });
  const [start, setStart] = useState(initial), [selection, setSelection] = useState(mode === 'observation' ? 'A' : 'Left');
  const [drafts, setDrafts] = useState({}), [revision, setRevision] = useState(0), [history, setHistory] = useState(() => [createEmSnapshot()]);
  const snapshot = history.at(-1), index = mode === 'observation' ? start.observations.findIndex(row => row.id === selection) : start.parameters.ids.indexOf(selection);
  const value = mode === 'observation' ? start.observations[index].x : start.parameters.means[index];
  const draft = drafts[selection] ?? String(value), minimum = mode === 'observation' ? -4 : -3, maximum = mode === 'observation' ? 4 : 3;
  const parsed = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(draft.trim()) ? Number(draft) : NaN;
  const invalid = !Number.isFinite(parsed) || parsed < minimum || parsed > maximum;
  const edit = text => {
    setDrafts(previous => ({ ...previous, [selection]: text }));
    const next = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim()) ? Number(text) : NaN;
    if (!Number.isFinite(next) || next < minimum || next > maximum) return;
    const candidate = structuredClone(start);
    if (mode === 'observation') candidate.observations[index].x = next;
    else candidate.parameters.means[index] = next;
    setStart(candidate); setHistory([createEmSnapshot(candidate.observations, candidate.parameters)]);
  };
  const reset = () => {
    const fresh = initial(); setStart(fresh); setSelection(mode === 'observation' ? 'A' : 'Left'); setDrafts({}); setRevision(previous => previous + 1); setHistory([createEmSnapshot()]);
  };
  const trace = useMemo(() => scalarEmTrace(start.observations, start.parameters), [start]);
  const names = mode === 'observation' ? start.observations.map(row => row.id) : start.parameters.ids;
  const quantity = mode === 'observation' ? 'Observation x' : 'Initial mean';
  return <FlowLab id={`gmm-d30-${mode}`} label={`Change one ${mode} and restart a coherent scalar EM history`}>
    <p>{mode === 'observation' ? 'Edit one observed coordinate; all component starting parameters stay fixed.' : 'Edit one component starting centre; all observed coordinates stay fixed.'}</p>
    <GaussianDrawing id={`D30-${mode}-positions`} title="Observed coordinates and current component centres share one ruler" width={820} height={310} adaptive
      description="Observed IDs keep their own actual x coordinates. Coincident IDs share one neutral mark. Left and Right centre lanes have identical minus-four-to-four coordinate scales; coincident centres stay at the same horizontal coordinate.">
      {width => {
        const x = value => 45 + (value + 4) / 8 * (width - 70);
        return <><text x="20" y="25">Observed IDs · unchanged by allocation</text><ObservationMarks observations={snapshot.observations} mapX={x} y={80} /><Ruler width={width} y={80} lower={-4} upper={4} ticks={[-4, -2, 0, 2, 4]} />
          {snapshot.parameters.ids.map((component, index) => <g key={component}><text x="20" y={145 + index * 85} fill={colours[index]}>{component} centre · θ{snapshot.iteration}</text>
            <Ruler width={width} y={170 + index * 85} lower={-4} upper={4} ticks={[-4, -2, 0, 2, 4]} /><circle cx={x(snapshot.parameters.means[index])} cy={170 + index * 85} r="5" fill={colours[index]} /></g>)}</>;
      }}
    </GaussianDrawing>
    <Parameters parameters={snapshot.parameters} label={`Current θ${snapshot.iteration}; starting ${mode} editor is separate`} />
    <CurrentAllocations snapshot={snapshot} />
    <FlowControls key={revision}>
      <label className="em-entity-selector">{mode === 'observation' ? 'Observed ID' : 'Component ID'}<select value={selection} onChange={event => setSelection(event.target.value)}>{names.map(name => <option value={name} key={name}>{name}</option>)}</select></label>
      <div className="gmm-quantity"><FlowSlider name={quantity} value={value} min={minimum} max={maximum} step={0.25} onChange={next => edit(String(next))} />
        <label htmlFor={`gmm-${mode}-decimal`}>Exact {quantity}<input id={`gmm-${mode}-decimal`} type="text" inputMode="decimal" value={draft} onChange={event => edit(event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? `gmm-${mode}-error` : undefined} /></label>
        {invalid && <p id={`gmm-${mode}-error`} role="status" className="gmm-input-error">Enter a finite value from {minimum} to {maximum}; {selection} keeps its last valid {emNumber(value)} units.</p>}
      </div>
    </FlowControls>
    <StepActions snapshot={snapshot} history={history} setHistory={setHistory} reset={reset} />
    <FlowReadout data-editor={mode} data-em-time={snapshot.iteration} data-em-phase={snapshot.phase} data-current-entity={selection}>Selected {selection} has starting {quantity.toLowerCase()} {emNumber(value)} units. Current θ{snapshot.iteration} gives total log likelihood <strong>{emNumber(snapshot.objective.totalLogLikelihood)}</strong> and mean <strong>{emNumber(snapshot.objective.meanLogLikelihood)}</strong> nats per row. Used allocations belong to θ{snapshot.allocationIteration}. {snapshot.gain !== null && `Last M gain: ${emNumber(snapshot.gain)} nats.`} {snapshot.status === 'refused' && snapshot.reason}</FlowReadout>
    {snapshot.update && <ExactTable caption="Last M sufficient statistics under the held used allocations" headings={['Component', 'Effective count', 'New mean / unit', 'Raw variance / unit²']} rows={snapshot.update.components.map(component => [component.id, emNumber(component.count), emNumber(component.mean), emNumber(component.variance)])} />}
    <GaussianEmTraceDrawing trace={trace} selectedIteration={snapshot.iteration} id={`D30-${mode}`} />
  </FlowLab>;
}

export function GaussianSingleEntityEm() {
  return <Figure job="D30"><EntityEditor mode="observation" /><EntityEditor mode="component" /></Figure>;
}

export function GaussianStationaryEm() {
  const [separation, setSeparation] = useState(1), [reset, setReset] = useState(0);
  const parameters = { ids: ['Left', 'Right'], weights: [0.5, 0.5], means: [-separation, separation], variances: [2.5, 2.5] };
  const trace = useMemo(() => scalarEmTrace(defaultEmObservations(), parameters), [separation]);
  const initial = trace.states[0], next = trace.states[1], exactNull = separation === 0 && trace.states.every(state => state.objective.totalLogLikelihood === initial.objective.totalLogLikelihood);
  return <Figure job="D31"><FlowLab id="gmm-d31" label="Compare a symmetric stationary null with an explicitly different reference">
    <div className="em-grid"><div><WeightedBells id="D31" parameters={parameters} lower={-4} upper={4} yMaximum={0.5} /><Parameters parameters={parameters} label="Current separation-only start: variance fixed at2.5" /></div>
      <div><WeightedBells id="D31-separated-reference" parameters={defaultParameters} lower={-4} upper={4} yMaximum={0.5} /><Parameters parameters={defaultParameters} label="Separate ordinary reference: means±1, variance1" /></div></div>
    <CurrentAllocations snapshot={initial} caption="Immediate initial conditional allocations" />
    <Parameters parameters={next.parameters} label="After one complete cycle under the current start" />
    <GaussianEmTraceDrawing trace={trace} id="D31-trace" />
    <FlowControls key={reset}><GaussianQuantity name="Initial separation" value={separation} min={0} max={2} step={0.25} onChange={setSeparation} />
      <button type="button" onClick={() => { setSeparation(1); setReset(value => value + 1); }}>Reset</button></FlowControls>
    <FlowReadout data-stationary-null={exactNull}>Current initial total log likelihood <strong>{emNumber(initial.objective.totalLogLikelihood)}</strong>; after one cycle <strong>{emNumber(next.objective.totalLogLikelihood)}</strong>. {exactNull ? 'At literal zero separation, all shares are exactly.5; means0 and variances2.5 return unchanged through all50 cycles. This is an exact symmetric stationary null.' : 'The source centres can change after allocation; a small gain is a numerical comparison, not literal equality.'} The variance1 reference is a different model, not a separation-only edit. A plateau does not certify a strict local or global maximum.</FlowReadout>
  </FlowLab></Figure>;
}
