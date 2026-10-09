import { transitionEstimate } from "../../data/stochastic-processes-models.js";
import { coalAuditState } from "../../data/stochastic-processes-flow-models.js";
import { Figure, Canvas, Label, Arrow, Dot, Compare, Plot, Table, Matrix, fmt } from "./StochasticProcessesDrawings.jsx";
import { EventStream, RateClock } from "./StochasticProcessesClockFigures.jsx";
function TrajectoryCountFigure(props) {
  const paths = [[0, 1, 1], [2, 2, 0]];
  const result = transitionEstimate(paths);
  return <Figure {...props} title="Separate trajectories generate only their own departures" caption="The two sequences contain four departures. No artificial 1→2 transition is inserted across the break. A row with no observed departures is unidentified, rather than a row of zero probabilities.">
    <Canvas title="Two distinct trajectory strips wired to the count matrix" height={250}>
      {paths.map((path, i) => <g key={i}><Label x="30" y={38 + i * 119}>Path {i + 1}</Label>{path.map((state, j) => <g key={j}><Dot at={[65 + j * 113, 85 + i * 119]} label={state} />{j < 2 && <Arrow from={[82 + j * 113, 85 + i * 119]} to={[160 + j * 113, 85 + i * 119]} />}</g>)}</g>)}
    </Canvas>
    <Compare><Matrix title="Actual counts from four departures" values={result.counts} rowNames={["0", "1", "2"]} columnNames={["0", "1", "2"]} /><Matrix title="Conditional row estimates" values={result.estimate} rowNames={["0", "1", "2"]} columnNames={["0", "1", "2"]} /></Compare>
    <Table title="An additional example with no departures from state 2" headers={["Current state", "Estimate"]} rows={transitionEstimate([[0, 1, 1]]).estimate.map((row, i) => [i, row === null ? "unidentified" : row.map((value) => fmt(value)).join(", ")])} />
  </Figure>;
}
function FrozenForecastFigure(props) {
  return <Figure {...props} title="Full training exposure fixes the rate before test windows" caption="Six training events over three minutes give λ̂=2/minute, including the final empty exposure. Both held-out patterns contain six events over three one-minute windows, but their allocation differs. Keep the training fit frozen; three bins alone do not establish a rejection.">
    <EventStream />
    <Compare>{[[2, 2, 2], [3, 0, 3]].map((counts, i) => <Plot key={i} title={`Held-out allocation ${counts.join(",")}`} xDomain={[0, 3]} yDomain={[0, 4]} xLabel="One-minute test window" yLabel="Events">{({ x, y }) => <>{counts.map((count, k) => <rect key={k} x={x(k + 0.15)} y={y(count)} width={x(k + 0.85) - x(k + 0.15)} height={y(0) - y(count)} className="sp-area" />)}<line x1={x(0)} x2={x(3)} y1={y(2)} y2={y(2)} className="sp-line sp-secondary" /></>}</Plot>)}</Compare>
    <Table title="Unchanged training predictions per one-minute test window" headers={["Quantity", "Value"]} rows={[["Mean count", 2], ["Zero-count probability", Math.exp(-2)]]} />
  </Figure>;
}
function CoalCalendar({ state = coalAuditState(), records = false }) {
  const top = Math.max(...state.counts, Math.ceil(state.rate)) + 1;
  return <div>{records && <Canvas title="All 191 recorded coal events on their selected year axis" height={180}>
    <line x1="52" x2="332" y1="94" y2="94" className="sp-grid" />
    {state.records.map(({ date, rowId }) => <line key={rowId} x1={52 + (date - 1851) / 112 * 280} x2={52 + (date - 1851) / 112 * 280} y1={rowId % 2 ? 66 : 91} y2={rowId % 2 ? 90 : 115} className="sp-line" />)}
    <Label x="52" y="146">1851</Label><Label x="192" y="146">1907</Label><Label x="332" y="146">1963</Label><Label x="192" y="28">Recorded events; duplicate dates retained</Label>
  </Canvas>}
  <Plot title={`All 112 annual counts; frozen training split ${state.split}`} xDomain={[1851, 1963]} yDomain={[0, top]} xLabel="Calendar year; bins [year,year+1)" yLabel="Recorded explosions / year">{({ x, y }) => <>
    {state.years.map((year, i) => <rect key={year} x={x(year)} y={y(state.counts[i])} width={x(year + 1) - x(year)} height={y(0) - y(state.counts[i])} className="sp-area" />)}
    <line x1={x(state.split)} x2={x(state.split)} y1={y(0)} y2={y(top)} className="sp-line sp-secondary" />
    <line x1={x(1851)} x2={x(1963)} y1={y(state.rate)} y2={y(state.rate)} className="sp-line" />
  </>}</Plot><p>Amber count marks show recorded annual observations. The horizontal line is the training rate {fmt(state.rate)} events/year; the dashed vertical line fixes the train/test boundary at {state.split}.</p></div>;
}
function CoalCalendarFigure(props) {
  return <Figure {...props} title="Recorded events become calendar exposure bins" caption="All 191 records are shown on the explicitly chosen [1851,1963) analysis window, then counted into 112 complete annual bins. Records 80 and 81 share the date 1875.930869267625 and both count. The first and last recorded dates are not asserted surveillance boundaries.">
    <CoalCalendar records />
    <Table title="The duplicate records keep their separate identities" headers={["Row ID", "Recorded year-coordinate"]} rows={coalAuditState().records.filter((row) => [80, 81].includes(row.rowId)).map((row) => [row.rowId, String(row.date)])} />
  </Figure>;
}
function CoalDispersionFigure(props) {
  const state = coalAuditState();
  return <Figure {...props} title="Annual residuals and their squares reconstruct descriptive dispersion" caption="Across all 112 annual bins, mean 1.70535714 and sample variance 2.69618726 give dispersion 1.58101033. This descriptive mismatch neither proves temporal dependence nor identifies a cause; changing intensity and recording limitations remain alternatives.">
    <Compare><Plot title="All annual deviations from the full-period mean" xDomain={[1851, 1963]} yDomain={[-2, 5]} xLabel="Calendar year" yLabel="Count − full mean">{({ x, y }) => state.years.map((year, i) => <line key={year} x1={x(year + 0.5)} x2={x(year + 0.5)} y1={y(0)} y2={y(state.counts[i] - state.mean)} className="sp-line" />)}</Plot><Plot title="All squared deviations, same observed bins" xDomain={[1851, 1963]} yDomain={[0, 20]} xLabel="Calendar year" yLabel="Squared deviation">{({ x, y }) => state.years.map((year, i) => <rect key={year} x={x(year)} y={y((state.counts[i] - state.mean) ** 2)} width={x(year + 1) - x(year)} height={y(0) - y((state.counts[i] - state.mean) ** 2)} className="sp-area" />)}</Plot></Compare>
    <Table title="Reconstructed full-period descriptive quantities" headers={["Quantity", "Value"]} rows={[["Annual bins", 112], ["Events", 191], ["Full-period mean", state.mean], ["Sum of squared deviations", state.variance * 111], ["Sample variance (divide by 111)", state.variance], ["Variance / mean", state.dispersion]]} />
  </Figure>;
}
function NextMechanismFigure(props) {
  return <Figure {...props} title="A diagnostic question points to a different temporal mechanism" caption="A scheduled clock changes intensity with time. History-triggered intensity changes after an event. A latent position with measurement noise distinguishes the evolving state from observed values. These are mechanisms to investigate, not fitted claims about the coal record.">
    <RateClock rates={[1, 4]} />
    <Plot title="A conceptual event-triggered intensity response" xDomain={[0, 3]} yDomain={[0, 4]} xLabel="Time" yLabel="Intensity / time" series={[{ points: [[0, 1], [1, 1], [1, 3], ...Array.from({ length: 41 }, (_, i) => [1 + i / 20, 1 + 2 * Math.exp(-i / 20)])] }]} />
    <Canvas title="Latent state and separate observed points" height={220}><polyline points="45,122 110,80 180,118 250,65 320,95" className="sp-line" />{[[45, 142], [110, 67], [180, 144], [250, 85], [320, 71]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="4" className="sp-bit" /><line x1={x} x2={x} y1={y} y2={[122, 80, 118, 65, 95][i]} className="sp-line sp-secondary" /></g>)}<Label x="180" y="186">Line: latent path; dots: noisy observations</Label></Canvas>
  </Figure>;
}
export {
  CoalCalendar,
  CoalCalendarFigure,
  CoalDispersionFigure,
  FrozenForecastFigure,
  NextMechanismFigure,
  TrajectoryCountFigure
};
