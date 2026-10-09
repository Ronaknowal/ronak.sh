import { useState } from 'react';
import { eigenDirectionPresets, eigenDirectionState, repeatedMapPresets, repeatedMapStarts, repeatedMapTrace, pcaDirectionDatasets, pcaDirectionState } from '../../data/eigenvalue-models.js';
import { powerIterationTrace } from '../../data/eigenvalue-power-iteration.mjs';
import { EigenFigure, EigenHistory, EigenMatrix, EigenPlane, EigenTable, eigenFormat as fmt, eigenPair as pair } from './EigenvalueDrawings.jsx';
import { EigenbasisDrawing, MixingModesDrawing } from './EigenvalueFigures.jsx';
import './eigenvalue-labs.css';

export const EigenbasisFlow = EigenbasisDrawing;
export const MixingModesFigure = MixingModesDrawing;

function AngleControl({ value, onChange, label, maximum = 360 }) {
  return <label>{label}: <output>{value}°</output><input aria-label={label} type="range" min="0" max={maximum} step="5" value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}

export function EigenDirectionLab() {
  const [preset, setPreset] = useState('diagonalStretch'), [angle, setAngle] = useState(45);
  const state = eigenDirectionState(preset, angle);
  const reset = () => { setPreset('diagonalStretch'); setAngle(45); };
  return <section className="ev-lab" id="eigen-direction" aria-label="Preserved direction investigation">
    <EigenFigure caption="The dashed input defines a line. The ring marks the along-line projection of Av; the dotted connector from that ring to the output marks the perpendicular remainder. The unit input and actual output share equal scales.">
      <div className="ev-two"><EigenPlane label="Unit input, actual product and perpendicular remainder" range={4} line={state.input} vectors={[{ value: state.input, label: 'v', kind: 'comparison' }, { value: state.output, label: 'Av' }]} points={[{ value: state.along, ring: true }]} segments={[[state.along, state.output]]} /><EigenMatrix values={state.matrix} label="A: current transformation" /></div>
      <EigenTable caption="Every number is computed from the displayed matrix" headers={['Quantity', 'Value']} rows={[['unit input v', pair(state.input)], ['actual product Av', pair(state.output)], ['signed projection coefficient vᵀAv/(vᵀv)', fmt(state.alongFactor)], ['along-line part', pair(state.along)], ['perpendicular remainder', pair(state.perpendicular)], ['remainder length', fmt(state.residualNorm)]]} />
    </EigenFigure>
    <p aria-live="polite">{state.isEigenDirection ? state.isZeroOutput ? 'The nonzero input maps to zero: eigenvalue 0. The output has no direction, so its mark is an origin ring.' : `This line is preserved, with eigenvalue ${fmt(state.alongFactor)}. A negative value reverses the arrow along the same line.` : 'This line is not preserved. Its signed along-line coefficient is a projection coefficient, not an eigenvalue for this input.'}</p>
    <p>{state.interpretation}</p><p>For these bounded fixtures, a perpendicular remainder below 10⁻¹⁰ is classified as zero. This is a declared floating-point tolerance, rather than an exact general-purpose eigenpair test. Values are displayed to six decimals, with scientific notation for tiny nonzero values.</p>
    <div className="flow-controls"><label>Transformation<select aria-label="Transformation" value={preset} onChange={event => setPreset(event.target.value)}>{Object.entries(eigenDirectionPresets).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}</select></label><AngleControl label="Input direction" value={angle} onChange={setAngle} /><button onClick={reset}>Reset direction</button></div>
  </section>;
}

export function RepeatedMapLab() {
  const [preset, setPreset] = useState('decay'), [start, setStart] = useState('mixed'), [step, setStep] = useState(1);
  const trace = repeatedMapTrace(preset, start, 12), current = trace.states[step], previous = trace.states[Math.max(0, step - 1)];
  const range = Math.max(2, Math.ceil(1.15 * Math.max(...trace.states.flatMap(row => row.vector.map(Math.abs)))));
  const reset = () => { setPreset('decay'); setStart('mixed'); setStep(1); };
  return <section className="ev-lab" id="eigen-repeated-map" aria-label="Repeated raw map investigation">
    <EigenFigure caption="All 13 raw states are calculated immediately. The full trace fixes the coordinate range for this map/start, so selecting an update cannot create apparent growth by changing scale. Connectors guide the eye between discrete states.">
      <div className="ev-two"><EigenPlane label={`Raw states through update12; selected update${step}`} range={range} trail={trace.states.map(row => row.vector)} vectors={[{ value: previous.vector, label: `x${Math.max(0, step - 1)}`, kind: 'comparison' }, { value: current.vector, label: `x${step}` }]} points={trace.states.map(row => ({ value: row.vector, radius: row.step === step ? 4 : 2 }))} /><EigenHistory label="Raw vector length, without normalization" values={trace.states.map(row => row.norm)} selected={step} unit="‖xₖ‖" /></div>
      <EigenMatrix values={trace.matrix} label="A: same matrix at every update" /><EigenTable caption="Complete raw trace; selected arrow refers to this same row" headers={['Update', 'First coordinate', 'Second coordinate', 'Raw length']} rows={trace.states.map(row => [row.step, fmt(row.vector[0]), fmt(row.vector[1]), fmt(row.norm)])} />
    </EigenFigure>
    <p aria-live="polite">Selected update {step}: xₖ={pair(current.vector)}, length {fmt(current.norm)}. Eigenvalues: {trace.eigenvalues}. {trace.conclusion}</p>
    <div className="flow-controls"><label>Repeated transformation<select aria-label="Repeated transformation" value={preset} onChange={event => { setPreset(event.target.value); setStep(1); }}>{Object.entries(repeatedMapPresets).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}</select></label><label>Starting vector<select aria-label="Starting vector" value={start} onChange={event => { setStart(event.target.value); setStep(1); }}>{Object.entries(repeatedMapStarts).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}</select></label><label>Selected update: <output>{step}</output><input aria-label="Selected update" type="range" min="0" max="12" step="1" value={step} onChange={event => setStep(Number(event.target.value))} /></label><button disabled={step === 0} onClick={() => setStep(value => value - 1)}>Previous update</button><button disabled={step === 12} onClick={() => setStep(value => value + 1)}>Next update</button><button onClick={reset}>Reset repeated map</button></div>
  </section>;
}

export function PcaDirectionLab() {
  const [dataset, setDataset] = useState('diagonalCloud'), [angle, setAngle] = useState(45);
  const state = pcaDirectionState(dataset, angle), reset = () => { setDataset('diagonalCloud'); setAngle(45); };
  return <section className="ev-lab" id="eigen-pca-direction" aria-label="PCA direction investigation">
    <EigenFigure caption="Each observed point keeps its A–D identity in the table. Open rings are its orthogonal projection onto the chosen line; coincident projections remain coincident, with individual scores preserved in the numerical table. Dotted segments show actual discarded perpendicular distances.">
      <div className="ev-two"><EigenPlane label="Four observations and their projected points" range={3} line={state.direction} vectors={[{ value: state.direction, label: 'unit q', kind: 'comparison' }]} points={[...state.points.map((value, index) => ({ value, label: String.fromCharCode(65 + index), dx: value[0] < 0 ? -23 : 8 })), ...state.projections.map(value => ({ value, ring: true }))]} segments={state.points.map((point, index) => [point, state.projections[index]])} /><EigenMatrix values={state.covariance} label="Sample covariance C · squared feature units" /></div>
      <EigenTable caption="The projection, score and discarded loss of every observation" headers={['Observation', 'Original coordinates', 'Score', 'Projected coordinates', 'Residual²']} rows={state.points.map((point, index) => [String.fromCharCode(65 + index), pair(point), fmt(state.scores[index]), pair(state.projections[index]), fmt(point.reduce((sum, value, axis) => sum + (value - state.projections[index][axis]) ** 2, 0))])} />
      <EigenTable caption="Variance fraction and total squared error have different units" headers={['Quantity', 'Value']} rows={[['unit direction q', pair(state.direction)], ['sample variance qᵀCq', fmt(state.variance)], ['total sample variance trace(C)', fmt(state.totalVariance)], ['retained fraction', `${fmt(100 * state.retainedFraction)}%`], ['total discarded SSE', fmt(state.squaredReconstructionError)], ['(n−1)×discarded variance', fmt(3 * (state.totalVariance - state.variance))]]} />
    </EigenFigure>
    <p aria-live="polite">{state.conclusion} The current line is {angle}°: retained fraction {fmt(100 * state.retainedFraction)}%, discarded SSE {fmt(state.squaredReconstructionError)}.</p>
    <div className="flow-controls"><label>Observation cloud<select aria-label="Observation cloud" value={dataset} onChange={event => setDataset(event.target.value)}>{Object.entries(pcaDirectionDatasets).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}</select></label><AngleControl label="Projection direction" maximum={180} value={angle} onChange={setAngle} /><button onClick={reset}>Reset PCA direction</button></div>
  </section>;
}

export function PowerIterationLab() {
  const [minor, setMinor] = useState(1), [angle, setAngle] = useState(0);
  const trace = powerIterationTrace(minor, angle), first = trace.rows[0], final = trace.rows.at(-1);
  const reset = () => { setMinor(1); setAngle(0); };
  const outcome = trace.stoppedOnZero ? 'The product is exactly zero. Normalization stops; the existing nonzero direction remains visible. Its eigenvalue is0.' : Math.abs(final.dominantCoefficient) < 1e-12 ? `The exact minor line remains: estimate ${fmt(final.estimate)} with residual ${fmt(final.residual)}. This is a valid pair but the known dominant value is 3.` : `After 12 normalized updates, estimate ${fmt(final.estimate)}, residual ${fmt(final.residual)}. Compare against the known dominant value 3; a small gap can leave substantial error after this fixed budget.`;
  return <section className="ev-lab" id="eigen-power-iteration" aria-label="Normalized power iteration investigation">
    <EigenFigure caption="The first input and raw product share range±3; the final normalized direction has length1. A zero product is an origin ring and is never divided by its length. Every available update and estimate appears immediately in the full trace.">
      <div className="ev-three"><EigenPlane label="First unit input q₀" range={3} vectors={[{ value: first.q, label: 'q₀', kind: 'comparison' }]} /><EigenPlane label="First raw product Aq₀ before normalization" range={3} vectors={[{ value: first.product, label: 'Aq₀' }]} /><EigenPlane label="Final existing unit direction" range={3} vectors={[{ value: final.q, label: `q${final.step}` }]} /></div><EigenMatrix values={trace.matrix} label={`A; known eigenvalues3 and μ=${fmt(minor)}`} />
      <div className="ev-two"><EigenHistory label="Rayleigh estimate at each available update" values={trace.rows.map(row => row.estimate)} unit="λ̂" max={3} /><EigenHistory label="Residual length at each available update" values={trace.rows.map(row => row.residual)} unit="‖Aq−λ̂q‖" /></div>
      <EigenTable caption="Complete twelve-update trace, or all states before an exact zero product stops normalization" headers={['Update', 'Unit q', 'Raw Aq', 'Product length', 'Estimate', 'Residual', 'Dominant amount', 'Minor amount']} rows={trace.rows.map(row => [row.step, pair(row.q), pair(row.product), fmt(row.length), fmt(row.estimate), fmt(row.residual), fmt(row.dominantCoefficient), fmt(row.minorCoefficient)])} />
    </EigenFigure>
    <p aria-live="polite">{outcome}</p><p>The named 45° and135° fixtures use one shared 1/√2 constant;135° is exactly[−r,r]. Other angles use sine and cosine. The minor-to-dominant magnitude ratio is μ/3={fmt(minor / 3)}.</p>
    <div className="flow-controls"><label>Minor eigenvalue μ: <output>{fmt(minor)}</output><input aria-label="Minor eigenvalue" type="range" min="0" max="2.95" step=".05" value={minor} onChange={event => setMinor(Number(event.target.value))} /></label><AngleControl label="Power starting direction" maximum={180} value={angle} onChange={setAngle} /><button onClick={reset}>Reset power iteration</button></div>
  </section>;
}
