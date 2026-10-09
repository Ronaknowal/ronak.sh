import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { useEffect, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { windowGeometry, poolVector, cnnAxisLayers, receptiveTrace, observedAncestors, dilationOffsets, averagingProfile, transpose1d, shiftComparison } from '../../data/convolution-models.js';
import useLessonViewport from './useLessonViewport.js';
import './convolution-labs.css';

// Colour vocabulary: cyan supplied inputs, amber learned parameters, violet computed values,
// orange gradients, thick white outline = currently traced. Value grids: amber +, blue −.
const assetRoot = '/learn-code/convolution-pooling-receptive-fields/';
const n = (value, digits = 4) => flowNumber(value, digits);

// A row of indexed values, optionally coloured by sign or marked as traced.
function Rail({ label, values, traced = [], winners = [], signed = false, kind = '', start = 0 }) {
  return <div className={`cl-rail ${kind}`}>
    <p className="cl-label">{label}</p>
    <ol>{values.map((value, index) => <li key={index} className={`${traced.includes(index) ? 'is-traced' : ''}${winners.includes(index) ? ' is-max' : ''}${signed && value < 0 ? ' is-negative' : signed && value > 0 ? ' is-positive' : ''}`}>
      <span>{index + start}{winners.includes(index) ? ' · max' : ''}</span><strong>{n(value)}</strong>
    </li>)}</ol>
  </div>;
}

// Ink intensity for raw pixel values (0–16), the same drawing as §1's handwritten 7.
// Saved inputs are ink ÷ 16 (what the network reads); cells print the original 0–16 count.
function InkGrid({ label, values }) {
  return <div className="cl-grid-block"><p className="cl-label">{label}</p>
    <div className="cl-grid-scroll" role="region" tabIndex={0} aria-label={`${label}; scroll to inspect all columns`}>
      <div className="cl-grid cl-ink-grid" style={{ '--columns': values[0].length }}>{values.flatMap((row, r) => row.map((value, c) => <span key={`${r}-${c}`} title={`Row ${r}, column ${c}: ink ${n(value * 16, 0)}`} style={{ '--ink': value }}>{value ? n(value * 16, 0) : ''}</span>))}</div>
    </div>
  </div>;
}

function SignedGrid({ label, values }) {
  const scale = Math.max(...values.flat().map(Math.abs), 1e-12);
  return <div className="cl-grid-block"><p className="cl-label">{label}</p>
    <div className="cl-grid-scroll" role="region" tabIndex={0} aria-label={`${label}; scroll to inspect all columns`}>
      <div className="cl-grid" style={{ '--columns': values[0].length }}>{values.flatMap((row, r) => row.map((value, c) => <span key={`${r}-${c}`} title={`Row ${r}, column ${c}: ${value}`} style={{ backgroundColor: value === 0 ? '#1d1d1d' : value < 0 ? `rgba(131,180,232,${0.1 + Math.abs(value) / scale * 0.6})` : `rgba(228,183,82,${0.08 + Math.abs(value) / scale * 0.6})` }}>{value !== 0 && Math.abs(value) < 0.01 ? value.toExponential(1).replace('-', '−') : n(value, 2)}</span>))}</div>
    </div>
  </div>;
}

/* §4 One axis: dilation, asymmetric padding and window centres ---------------------------- */
const kernelOptions = [['k3', '3 taps'], ['k3d2', '3 taps, dilation 2'], ['k4', '4 taps']];
const kernelSettings = { k3: { k: 3, d: 1 }, k3d2: { k: 3, d: 2 }, k4: { k: 4, d: 1 } };
const paddingOptions = [['0,0', '0, 0'], ['1,1', '1, 1'], ['1,2', '1, 2'], ['2,1', '2, 1'], ['2,2', '2, 2']];
export function DilationRulerLab() {
  const [kernel, setKernel] = useState('k4'), [padding, setPadding] = useState('1,2'), [selection, setSelection] = useState(0);
  const [left, right] = padding.split(',').map(Number);
  const settings = { n: 8, s: 1, left, right, ...kernelSettings[kernel] };
  const geometry = windowGeometry(settings);
  const current = Math.min(selection, Math.max(0, geometry.count - 1));
  const sampled = geometry.windows[current] || [];
  const cells = Array.from({ length: settings.n + left + right }, (_, i) => i - left);
  return <FlowLab id="convolution-geometry" label="One axis: count the window starts, then check where they sit">
    <div className="cl-ruler-scroll" role="region" tabIndex={0} aria-label="Input positions with padding; scroll to see all">
      <div className="cl-ruler">{cells.map(index => {
        const pad = index < 0 || index >= settings.n;
        const tap = sampled.indexOf(index);
        return <span key={index} className={`${pad ? 'is-padding' : 'is-input'}${tap >= 0 ? ' is-traced' : ''}`}><small>{index}</small>{pad ? 'P' : '·'}{tap >= 0 && <em>tap {tap}</em>}</span>;
      })}</div>
    </div>
    {geometry.count > 0 && <FlowControls>
      <FlowChoice label="Kernel" options={kernelOptions} value={kernel} onChange={setKernel} />
      <FlowChoice label="Padding left, right" options={paddingOptions} value={padding} onChange={setPadding} />
      <FlowSlider name="Traced window" value={current} onChange={setSelection} min={0} max={geometry.count - 1} step={1} format={value => String(value)} />
    </FlowControls>}
    <FlowReadout>Width 8, stride 1: the kernel spans <strong>{geometry.span}</strong> positions, so <strong>{geometry.count}</strong> windows fit; the first window's centre is at {n(geometry.center)} (pixel centres are 0.5, 1.5, …). Traced window {current} samples positions [{sampled.map(position => n(position)).join(', ')}].</FlowReadout>
  </FlowLab>;
}

/* §5 Pooling routes in one dimension ---------------------------------------------------- */
export function PoolingRoutesLab() {
  const [values, setValues] = useState([1, 4, 3]);
  const max = poolVector(values), mean = poolVector(values, 2, 1, 'mean');
  const set = i => value => setValues(previous => previous.map((x, j) => (j === i ? value : x)));
  const winners = max.windows.map(indices => indices[indices.map(i => values[i]).indexOf(Math.max(...indices.map(i => values[i])))]);
  return <FlowLab id="convolution-pooling" label="Watch winners and shared gradients">
    <div className="flow-columns-2">
      <div className="cl-mode">
        <p className="cl-label">Max pool, size 2, stride 1</p>
        <Rail label="Inputs (“max”: a window's winner)" values={values} winners={winners} kind="cl-computed" />
        <Rail label="Outputs: windows [0, 1] and [1, 2]" values={max.outputs} kind="cl-computed" />
        <Rail label="Gradient of their sum back to the inputs" values={max.gradient} kind="cl-grad" />
      </div>
      <div className="cl-mode">
        <p className="cl-label">Average pool, size 2, stride 1</p>
        <Rail label="Inputs" values={values} kind="cl-computed" />
        <Rail label="Outputs" values={mean.outputs} kind="cl-computed" />
        <Rail label="Gradient of their sum back to the inputs" values={mean.gradient} kind="cl-grad" />
      </div>
    </div>
    <FlowControls>{values.map((value, i) => <FlowSlider key={i} name={`Input ${i}`} value={value} onChange={set(i)} min={-4} max={5} step={0.5} format={v => n(v)} />)}</FlowControls>
    <FlowReadout>Max sends each window's gradient only to its winner, giving <strong>[{max.gradient.map(g => n(g)).join(', ')}]</strong>{max.gradient.includes(2) ? ': one input wins both windows and collects both routes' : ''}; average splits each window's gradient equally, giving <strong>[{mean.gradient.map(g => n(g)).join(', ')}]</strong>.{values[0] === values[1] || values[1] === values[2] ? ' A tie: this model gives the first maximizing position the gradient.' : ''}</FlowReadout>
  </FlowLab>;
}

/* §6 Observed pixels through the fixed 32-wide architecture ------------------------------ */
const traceRows = receptiveTrace(cnnAxisLayers);
export function ReceptiveTraceLab() {
  const [stage, setStage] = useState(3), [index, setIndex] = useState(0);
  const row = traceRows[stage], position = Math.min(index, row.n - 1);
  const ancestors = observedAncestors(cnnAxisLayers.slice(0, stage + 1), position);
  const center = row.a + position * row.j;
  const [low, high] = [center - (row.r - 1) / 2, center + (row.r - 1) / 2];
  return <FlowLab id="convolution-receptive" label="A bounding interval is not the set of observed pixels">
    <div className="cl-ruler-scroll" role="region" tabIndex={0} aria-label="The 32 input pixels; outlined pixels reach the traced output">
      <div className="cl-ruler cl-ruler-tight">{Array.from({ length: 32 }, (_, i) => <span key={i} className={`is-input${ancestors.includes(i) ? ' is-traced' : ''}`}><small>{i}</small></span>)}</div>
    </div>
    <FlowControls>
      <FlowChoice label="After layer" options={traceRows.map((r, i) => [i, `${i + 1}. ${r.name}`])} value={stage} onChange={value => { setStage(value); setIndex(0); }} />
      {row.n > 1 && <FlowSlider name="Traced output position" value={position} onChange={setIndex} min={0} max={row.n - 1} step={1} format={value => String(value)} />}
    </FlowControls>
    <FlowReadout>Output {position} of {row.n} after layer {stage + 1}: centre {n(center)}, bounding interval [{n(low)}, {n(high)}] ({row.r} wide), and <strong>{ancestors.length}</strong> actual pixels reach it{ancestors.length < row.r ? `; the other ${row.r - ancestors.length} ${row.r - ancestors.length === 1 ? 'position' : 'positions'} of the interval ${row.r - ancestors.length === 1 ? 'is' : 'are'} padding, which adds no image information` : ', so here every position in the interval is a real pixel'}.</FlowReadout>
  </FlowLab>;
}

/* §6 Dilation can leave holes inside the bounding width ----------------------------------- */
export function DilationHolesLab() {
  const [first, setFirst] = useState(2), [second, setSecond] = useState(2);
  const offsets = dilationOffsets(first, second), bound = 2 * (first + second) + 1;
  return <FlowLab id="convolution-dilation-holes" label="Dilated layers can reach a wide region with holes in it">
    <div className="cl-ruler-scroll" role="region" tabIndex={0} aria-label="Offsets around one output; filled circles are reachable"><div className="cl-ruler">{Array.from({ length: bound }, (_, i) => i - (bound - 1) / 2).map(i => <span key={i} className={offsets.includes(i) ? 'is-input is-traced' : 'is-hole'}><small>{n(i)}</small>{offsets.includes(i) ? '●' : '○'}</span>)}</div></div>
    <FlowControls>
      <FlowChoice label="First layer dilation" options={[[1, '1'], [2, '2']]} value={first} onChange={setFirst} />
      <FlowChoice label="Second layer dilation" options={[[1, '1'], [2, '2']]} value={second} onChange={setSecond} />
    </FlowControls>
    <FlowReadout>Two three-tap layers reach offsets {'{'}{offsets.map(o => n(o)).join(', ')}{'}'}: <strong>{offsets.length}</strong> connected positions inside a bounding width of {bound}.{offsets.length < bound ? ' The hollow circles are holes.' : ' Every position inside the bound is connected.'}</FlowReadout>
  </FlowLab>;
}

/* §8 Many paths reach the centre --------------------------------------------------------- */
export function ConvolutionInfluenceLab() {
  const [depth, setDepth] = useState(20), [threshold, setThreshold] = useState(1);
  const result = averagingProfile(depth, threshold / 100);
  return <FlowLab id="convolution-influence" label="Many paths reach the center; fewer reach the edges">
    <div className="cl-profile" role="img" aria-label={`Input coefficients for offsets −${depth} to ${depth}; peak ${n(result.peak)}; ${result.width} offsets meet ${threshold}% of the peak.`}>
      {result.coefficients.map((value, i) => <span key={i} title={`Offset ${i - depth}: ${value}`}><i className={result.retained.includes(i - depth) ? 'is-kept' : ''} style={{ height: `${value / result.peak * 100}%` }} /></span>)}
    </div>
    <p className="cl-axis"><span>offset −{depth}</span><span>0</span><span>+{depth}</span></p>
    <FlowControls>
      <FlowSlider name="Averaging layers" value={depth} onChange={setDepth} min={1} max={20} step={1} format={v => String(v)} />
      <FlowSlider name="Display threshold (% of peak)" value={threshold} onChange={setThreshold} min={0.1} max={20} step={0.1} format={v => `${n(v, 1)}%`} />
    </FlowControls>
    <FlowReadout>Possible reach <strong>{2 * depth + 1}</strong> positions; positions at or above {n(threshold, 1)}% of the peak (violet bars) span <strong>{result.width}</strong>. The coefficients sum to {n(result.coefficients.reduce((a, b) => a + b, 0))}.</FlowReadout>
  </FlowLab>;
}

/* §8 Boundary rules decide whether filtering commutes with shifting ------------------------ */
export function ShiftBoundaryLab() {
  const [boundary, setBoundary] = useState('circular');
  const values = shiftComparison(boundary);
  return <FlowLab id="convolution-shift" label="A boundary rule changes whether shift and filter commute">
    <Rail label="Original impulse" values={values.source} kind="cl-input" />
    <Rail label="Shift right, then filter with [1, 0, −1]" values={values.first} signed />
    <Rail label="Filter first, then shift the output" values={values.second} signed />
    <FlowControls><FlowChoice label="Outside the signal" options={[['circular', 'wraps around'], ['zero', 'is zero']]} value={boundary} onChange={setBoundary} /></FlowControls>
    <FlowReadout>Largest difference between the two orders: <strong>{values.difference}</strong>. {values.difference === 0 ? 'With a circular boundary the two orders agree.' : 'With zeros outside, the value that wrapped around is lost, so the orders disagree.'}</FlowReadout>
  </FlowLab>;
}

/* §8 Sampling every second value depends on the phase -------------------------------------- */
export function SamplingPhaseLab() {
  const [alpha, setAlpha] = useState(1);
  const phase0 = 2 * alpha - 1, phase1 = -phase0;
  return <FlowLab id="convolution-sampling-phase" label="Sampling every second value depends on where you start">
    <Rail label="Alternating signal" values={[1, -1, 1, -1, 1, -1]} signed />
    <div className="flow-columns-2">
      <Rail label="Filter [α, 1 − α], sample from position 0" values={[phase0, phase0, phase0]} signed />
      <Rail label="Same, after shifting the signal by one" values={[phase1, phase1, phase1]} signed />
    </div>
    <FlowControls><FlowSlider name="First filter weight α" value={alpha} onChange={setAlpha} min={0} max={1} step={0.05} format={v => n(v, 2)} /></FlowControls>
    <FlowReadout>{alpha === 1 ? 'α = 1 is plain sampling: the two phases give opposite answers, 1 and −1.' : alpha === 0.5 ? 'α = 0.5 averages each pair first: both phases give 0, so the shift no longer matters for this signal.' : `Phases give ${n(phase0, 2)} and ${n(phase1, 2)}; they agree only at α = 0.5.`}</FlowReadout>
  </FlowLab>;
}

/* §9 The transpose scatters each value back along its connections -------------------------- */
export function ScatterLab() {
  const [dual, setDual] = useState([2, -3]);
  const scatter = transpose1d(dual, [1, -1]);
  const left = -2 * dual[0] + dual[1], right = scatter.output.reduce((sum, value, i) => sum + value * [1, 3, 2][i], 0);
  const set = i => value => setDual(previous => previous.map((x, j) => (j === i ? value : x)));
  return <FlowLab id="convolution-transpose" label="Scatter each footprint and add the overlaps">
    {scatter.contributions.map((values, i) => <Rail key={i} label={`Footprint of g${i} = ${n(dual[i])}: g${i} × [1, −1] placed from position ${i}`} values={values} signed />)}
    <Rail label="Sum: Cᵀg (overlaps add)" values={scatter.output} signed kind="cl-sum" />
    <FlowControls>
      <FlowSlider name="g₀" value={dual[0]} onChange={set(0)} min={-4} max={4} step={0.5} format={v => n(v)} />
      <FlowSlider name="g₁" value={dual[1]} onChange={set(1)} min={-4} max={4} step={0.5} format={v => n(v)} />
    </FlowControls>
    <FlowReadout>For x = [1, 3, 2]: ⟨Cx, g⟩ = <strong>{n(left)}</strong> and ⟨x, Cᵀg⟩ = <strong>{n(right)}</strong>. The transpose keeps this dot product, not the original input.</FlowReadout>
  </FlowLab>;
}

/* §9 Overlap counts behind checkerboard artifacts ----------------------------------------- */
export function CoverageLab() {
  const [size, setSize] = useState(3);
  const coverage = transpose1d([1, 1, 1], Array(size).fill(1), 2).output;
  const grid = coverage.map(a => coverage.map(b => a * b));
  return <FlowLab id="convolution-coverage" label="Stride-2 footprints overlap unevenly">
    <Rail label="One dimension: how many footprints cover each output position" values={coverage} kind="cl-computed" />
    <SignedGrid label="Two dimensions: row count × column count" values={grid} />
    <FlowControls><FlowChoice label="Footprint size (stride 2)" options={[[2, '2'], [3, '3'], [4, '4']]} value={size} onChange={setSize} /></FlowControls>
    <FlowReadout>{size === 3 ? 'Size 3 with stride 2: interior counts alternate 1, 2, 1, 2 — the 2-D grid shows the checkerboard.' : size === 4 ? 'Size 4 is divisible by the stride: interior counts are equal; only the borders differ.' : 'Size 2 equals the stride: footprints tile without overlap.'}</FlowReadout>
  </FlowLab>;
}

/* §10 Patches as columns ----------------------------------------------------------------- */
export function ConvolutionPatchMatrixFigure() {
  return <figure className="cl-figure" data-figure="patch-matrix" id="patch-matrix">
    <div className="flow-columns-2">
      <SignedGrid label="Unfolded: each column is one window, read row by row" values={[[1, 2, 0, 1], [2, 0, 1, 3], [0, 1, 2, 1], [1, 3, 1, 0]]} />
      <SignedGrid label="Fold overlap counts on the 3×3 image" values={[[1, 2, 1], [2, 4, 2], [1, 2, 1]]} />
    </div>
  </figure>;
}

/* Programs and recorded measurements ------------------------------------------------------ */
function RemoteContent({ file, json = false, children }) {
  const [data, setData] = useState(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(assetRoot + file, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('Load failed'); return json ? response.json() : response.text(); }).then(setData).catch(error => { if (error.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [file, json, attempt]);
  if (error) return <p role="alert">This file could not load. <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry</button> or use the download link.</p>;
  return data ? children(data) : <p role="status">Loading the recorded measurements…</p>;
}

// Loads the recorded data only when the lab is near the viewport.
function RecordedData({ children }) {
  const [container, ready] = useLessonViewport();
  return <div ref={container}>{ready ? <RemoteContent file="calculated-inputs.json" json>{children}</RemoteContent> : <p role="status">The recorded measurements load when this part of the page is on screen.</p>}</div>;
}

export function ConvolutionProgram({ file, title }) {
  return <>
    <RemoteCodeBlock source={assetRoot + file} language="python" filename={file} title={title} />
    <p><a href={assetRoot + file} download>Download {file}</a></p>
  </>;
}

const modelOptions = [['mlp', 'Dense'], ['cnn_max', 'CNN, max pool'], ['cnn_average', 'CNN, average pool'], ['cnn_global_average', 'CNN, global-average head']];
const modelName = Object.fromEntries(modelOptions);
// Short end-of-line labels that fit beside the plot at every width.
const endLabel = { mlp: 'dense', cnn_max: 'CNN max pool', cnn_average: 'CNN avg pool', cnn_global_average: 'CNN global avg' };

// Fixed logarithmic loss axis shared by both splits and every run, so late differences
// (0.05 versus 0.18) stay visible and switching runs never rescales the picture.
const lossTicks = [0.001, 0.01, 0.1, 1];
const [lossLow, lossHigh] = [0.0008, 3];
const lossY = value => 196 - (Math.log10(Math.max(value, lossLow)) - Math.log10(lossLow)) / (Math.log10(lossHigh) - Math.log10(lossLow)) * 168;
const splitOptions = [['validation', 'Development (120)'], ['train', 'Training (280)']];

function RecordedRuns({ data }) {
  const [name, setName] = useState('cnn_max'), [seed, setSeed] = useState(1), [split, setSplit] = useState('validation');
  const runs = data.experiment.fits;
  const run = runs.find(r => r.name === name && r.seed === seed), baseline = runs.find(r => r.name === 'mlp' && r.seed === seed);
  const last = run.trace.at(-1)[split], count = split === 'train' ? 280 : 120;
  const splitWord = split === 'train' ? 'training' : 'development';
  const x = step => 52 + step / 400 * 268;
  const series = [[baseline, 'cl-series-base', 'dense (dashed)'], [run, 'cl-series-run', endLabel[name]]].filter(([, , ], i) => !(i === 0 && name === 'mlp'));
  const endY = series.map(([record]) => lossY(record.trace.at(-1)[split].cross_entropy));
  // Keep the two end labels apart when the final values are close.
  if (endY.length === 2 && Math.abs(endY[0] - endY[1]) < 13) { const mid = (endY[0] + endY[1]) / 2; const up = endY[0] <= endY[1] ? -1 : 1; endY[0] = mid + up * 7; endY[1] = mid - up * 7; }
  return <>
    <svg className="cl-trace" viewBox="0 0 430 232" role="img" aria-label={`Recorded ${splitWord} cross-entropy on a logarithmic axis for ${modelName[name]} seed ${seed} at updates ${run.trace.map(r => `${r.step}: ${n(r[split].cross_entropy)}`).join(', ')}; dense baseline ${baseline.trace.map(r => `${r.step}: ${n(r[split].cross_entropy)}`).join(', ')}.`}>
      <path d="M52 28 V196 H320" fill="none" stroke="#999" />
      {lossTicks.map(t => <g key={t}><line x1="48" x2="320" y1={lossY(t)} y2={lossY(t)} className="cl-gridline" /><text x="46" y={lossY(t) + 4} textAnchor="end">{t}</text></g>)}
      {[0, 200, 400].map(t => <text key={t} x={x(t)} y="214" textAnchor="middle">{t}</text>)}
      {series.map(([record, cls, label], i) => <g key={cls} className={cls}>
        <polyline fill="none" points={record.trace.map(row => `${x(row.step)},${lossY(row[split].cross_entropy)}`).join(' ')} />
        {record.trace.map(row => <circle key={row.step} cx={x(row.step)} cy={lossY(row[split].cross_entropy)} r="3" />)}
        <text x="326" y={endY[i] + 4}>{label}</text>
      </g>)}
      <text x="186" y="230" textAnchor="middle" className="cl-axis-label">parameter updates</text>
      <text x="52" y="16" className="cl-axis-label">{splitWord} cross-entropy (log scale)</text>
    </svg>
    <FlowControls>
      <FlowChoice label="Model" options={modelOptions} value={name} onChange={setName} />
      <FlowChoice label="Seed" options={[[1, '1'], [2, '2'], [3, '3']]} value={seed} onChange={setSeed} />
      <FlowChoice label="Data" options={splitOptions} value={split} onChange={setSplit} />
    </FlowControls>
    <FlowReadout>{modelName[name]}, seed {seed}, after 400 updates: {splitWord} cross-entropy <strong>{n(last.cross_entropy)}</strong>, <strong>{last.correct}</strong>/{count} correct.{split === 'validation' ? ` Shifted one pixel right: ${run.shifted_right.correct}/120; down: ${run.shifted_down.correct}/120.` : ' The training images are the ones the weights were fitted to.'} The vertical axis is logarithmic: each gridline is ten times the one below. Lines join the six recorded checkpoints (0, 1, 25, 100, 200, 400); nothing between them was recorded.</FlowReadout>
  </>;
}

export function RecordedRunsLab() {
  return <FlowLab id="convolution-measured" label="Recorded training runs from the downloadable program">
    <RecordedData>{data => <RecordedRuns data={data} />}</RecordedData>
  </FlowLab>;
}

const layerOptions = [['first_maps', 'First conv, 8×8'], ['second_maps', 'Second conv, 4×4'], ['final_maps', 'Final pooled, 2×2']];
function SavedMaps({ data }) {
  const maps = data.experiment.fits.find(run => run.name === 'cnn_max' && run.seed === 1);
  // Channel 3 opens the viewer: its kernel is a horizontal-edge detector (top rows +, bottom row −),
  // and ReLU has zeroed part of its map, so both points the prose makes are visible at once.
  const [specimen, setSpecimen] = useState(0), [layer, setLayer] = useState('first_maps'), [channel, setChannel] = useState(3);
  const row = maps.visual_rows[specimen], count = row[layer].length, ch = Math.min(channel, count - 1);
  const firstLayer = layer === 'first_maps';
  return <>
    <div className="flow-columns-2">
      <InkGrid label={`Input · true digit ${row.actual} (source ${row.source_id}), ink 0–16 (the network reads ink ÷ 16)`} values={row.input} />
      <SignedGrid label={`${layerOptions.find(([key]) => key === layer)[1]} map, channel ${ch} (after ReLU)`} values={row[layer][ch]} />
    </div>
    <div className="flow-columns-2">
      {firstLayer
        ? <SignedGrid label={`First-layer kernel ${ch}: the learned 3×3 weights that made this map`} values={maps.first_layer_kernels[ch]} />
        : <p className="cl-note">Deeper maps mix all eight first-layer channels through further learned kernels, so no single 3×3 kernel produced this map; choose the first layer to see the kernel behind each map.</p>}
      <SignedGrid label={`How logit ${row.predicted} changes per input pixel (local gradient)`} values={row.logit_input_gradient} />
    </div>
    <FlowControls>
      <FlowChoice label="Digit" options={maps.visual_rows.map((r, i) => [i, `${r.actual} (source ${r.source_id})`])} value={specimen} onChange={setSpecimen} />
      <FlowChoice label="Layer" options={layerOptions} value={layer} onChange={value => { setLayer(value); setChannel(value === 'first_maps' ? 3 : 0); }} />
      <FlowSlider name="Channel" value={ch} onChange={setChannel} min={0} max={count - 1} step={1} format={v => String(v)} />
    </FlowControls>
    <FlowReadout>Predicted digit <strong>{row.predicted}</strong> with probability {n(Math.max(...row.probabilities), 3)}. These are the max-pool CNN's saved values for seed 1 at update 400; maps are after ReLU, so negative responses show as 0. Each grid scales its shading to its own largest value, so compare the printed numbers, not the shading, between grids.</FlowReadout>
    {row.logit_input_gradient.flat().every(value => value === 0) && <FlowReadout>All input derivatives are zero at this input: every route to the logit is closed by ReLU here, which is not the same as the pixels being irrelevant.</FlowReadout>}
  </>;
}

export function SavedMapsLab() {
  return <FlowLab id="convolution-saved-maps" label="Look inside the saved max-pool CNN">
    <RecordedData>{data => <SavedMaps data={data} />}</RecordedData>
  </FlowLab>;
}

