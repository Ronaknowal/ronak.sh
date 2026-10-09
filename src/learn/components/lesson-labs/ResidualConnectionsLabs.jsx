import { useEffect, useRef, useState } from 'react';
import { correctionFixture, correctionModel, scalarStack, operatorPlacement, projectionModel, gateModel, nonlinearPaths } from '../../data/residual-connections-model.js';
import MechanismProgram from './MechanismProgram.jsx';
import { FlowLab, FlowControls, FlowChoice, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import './residual-connections.css';

export const residualAssets = '/learn-assets/residual-connections';
const fmt = value => {
  const text = Math.abs(value) > 0 && (Math.abs(value) < 0.00001 || Math.abs(value) >= 1e6)
    ? value.toExponential(5)
    : Number(value.toFixed(7)).toLocaleString('en-US', { maximumFractionDigits: 7 });
  return text.replace(/-/g, '−');
};
const paren = value => value < 0 ? '(' + fmt(value) + ')' : fmt(value);
const vec = values => `[${values.map(fmt).join(', ')}]`;
const matrix = rows => `[${rows.map(vec).join(', ')}]`;

function Table({ caption, headers, rows }) { return <div className="res-table" role="region" tabIndex={0} aria-label={caption}><table><caption>{caption}</caption><thead><tr>{headers.map((header, i) => <th key={i} scope="col">{header}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((entry, j) => j === 0 ? <th key={j} scope="row">{entry}</th> : <td key={j}>{entry}</td>)}</tr>)}</tbody></table></div>; }
export { Table as ResidualTable };

// One gradient-descent step on the block's weights, repeated on request.
export function ResidualCorrectionLab() {
  const [weight, setWeight] = useState(correctionFixture), [rate, setRate] = useState(0.1), [steps, setSteps] = useState(0);
  const state = correctionModel(weight, rate);
  const canStep = steps < 10 && rate > 0;
  return <FlowLab id="res-correction" label="Train the correction with gradient steps">
    <div className="res-flow">
      <div className="res-input">input <span className="ink-input">x = [2, −1]</span> · target t = [1, 0]</div>
      <div className="res-learned">branch weights <span className="ink-learned">W = {matrix(weight)}</span></div>
      <div className="res-computed">correction <span className="ink-computed">F(x) = {vec(state.correction)}</span> · output <span className="ink-computed">y = x + F(x) = {vec(state.output)}</span></div>
      <div className="res-op">loss ½‖y − t‖² = <strong>{fmt(state.loss)}</strong> · gradient <span className="ink-backward">∇W = g xᵀ = {matrix(state.weightGradient)}</span></div>
    </div>
    <FlowControls>
      <FlowSlider name="Learning rate η" value={rate} onChange={setRate} min={0} max={0.2} step={0.01} format={fmt} />
      <button type="button" disabled={!canStep} onClick={() => { setWeight(state.newWeight); setSteps(value => value + 1); }}>Take one step: W ← W − η∇W</button>
      <button type="button" onClick={() => { setWeight(correctionFixture()); setSteps(0); }}>Start over</button>
    </FlowControls>
    <FlowReadout>After {steps} {steps === 1 ? 'step' : 'steps'} the loss is <strong>{fmt(state.loss)}</strong>; the next step would give W = {matrix(state.newWeight)}, output {vec(state.newOutput)} and loss <strong>{fmt(state.newLoss)}</strong>. The skip has no weight to update; only W changes.</FlowReadout>
  </FlowLab>;
}

// A skip in every block, yet the end-to-end gain can still vanish or explode.
export function ResidualDepthLab() {
  const [slope, setSlope] = useState(0), [depth, setDepth] = useState(10);
  const state = scalarStack(slope, depth), magnitude = Math.abs(state.gain);
  const verdict = magnitude === 0 ? 'exact cancellation' : magnitude < 1 ? 'contraction' : magnitude === 1 ? 'unit magnitude' : 'growth';
  return <FlowLab id="res-depth" label="A skip in every block can still cancel the signal">
    <ol className="res-chips res-chips--derivative" aria-label="Derivative after each block">{state.trace.map(row => <li key={row.step} className={row.value === 0 ? 'is-zero' : ''}><span>after {row.step}</span>{fmt(row.value)}</li>)}</ol>
    <FlowControls>
      <FlowSlider name="Branch slope a" value={slope} onChange={setSlope} min={-2} max={1} step={0.05} format={fmt} />
      <FlowSlider name="Number of blocks" value={depth} onChange={setDepth} min={1} max={20} step={1} format={value => String(value)} />
    </FlowControls>
    <FlowReadout>Each block multiplies by 1 + a = <strong>{fmt(state.multiplier)}</strong>; after {depth} blocks the derivative is <strong>{fmt(state.gain)}</strong> ({verdict}).</FlowReadout>
  </FlowLab>;
}

// With a zero correction, what reaches the output depends only on what sits after the join.
export function ResidualOrderLab() {
  const [mode, setMode] = useState('post-relu'), [shift, setShift] = useState(0);
  const state = operatorPlacement(mode, shift);
  const opName = mode === 'post-relu' ? 'ReLU after the join' : mode === 'post-ln' ? 'LayerNorm after the join' : 'nothing after the join';
  return <FlowLab id="res-order" label="Move an operation; inspect what survives">
    <div className="res-flow">
      <div className="res-input">skip delivers <span className="ink-input">x = {vec(state.input)}</span> · correction <span className="ink-computed">F(x) = [0, 0]</span></div>
      <div className="res-arrow" aria-hidden="true">↓ ⊕</div>
      <div className="res-op">{opName}</div>
      <div className="res-arrow" aria-hidden="true">↓</div>
      <div className="res-computed">output <span className="ink-computed">{vec(state.output)}</span></div>
    </div>
    <FlowControls>
      <FlowChoice label="After the join" value={mode} onChange={setMode} options={[['inside', 'Nothing (operations inside the branch)'], ['post-relu', 'ReLU'], ['post-ln', 'LayerNorm']]} />
      <FlowSlider name="Common shift added to both inputs" value={shift} onChange={setShift} min={-3} max={3} step={0.25} format={fmt} />
    </FlowControls>
    <FlowReadout>Output − input = {vec(state.difference)}; local Jacobian {matrix(state.jacobian)}; response to a common shift, Jacobian × [1, 1] = <strong>{vec(state.shiftDirection)}</strong>. {mode === 'post-ln' ? 'A common shift moves the input but leaves this normalized output unchanged.' : mode === 'post-relu' ? 'Positive coordinates pass through; negative ones become 0. At exactly zero this follows PyTorch’s zero ReLU derivative.' : 'The raw values and the whole identity derivative reach the output.'}</FlowReadout>
  </FlowLab>;
}

// When the correction has three features, what must the skip's third coordinate mean?
export function ResidualProjectionLab() {
  const [skip, setSkip] = useState('projection'), [row, setRow] = useState('sum'), [correction, setCorrection] = useState('three');
  const rows = { sum: [1, 1], zero: [0, 0], difference: [1, -1] };
  const state = projectionModel(rows[row], false, skip === 'projection', correction === 'broadcast');
  return <FlowLab id="res-projection" label="Match the sockets and their meanings">
    <div className="res-columns">
      <div><h5>Skip</h5><p>input <span className="ink-input">{vec(state.input)}</span></p><p>{skip === 'projection' ? <>P = <span className="ink-learned">{matrix(state.projection)}</span><br />third coordinate {paren(rows[row][0])} × {paren(state.input[0])} + {paren(rows[row][1])} × {paren(state.input[1])} = {fmt(state.skip[2])}</> : 'identity: keeps 2 coordinates'}</p><p>skip output <span className="ink-input">{vec(state.skip)}</span></p></div>
      <div><h5>Branch</h5><p>correction <span className="ink-computed">{vec(state.correction)}</span></p><p>{correction === 'broadcast' ? 'one value [0.5] repeated in all three features' : 'three independently computed corrections'}</p></div>
    </div>
    <FlowControls>
      <FlowChoice label="Skip" value={skip} onChange={setSkip} options={[['identity', 'Identity'], ['projection', '3 × 2 projection P']]} />
      {skip === 'projection' && <FlowChoice label="Third row of P" value={row} onChange={setRow} options={[['sum', '[1, 1]: x₁ + x₂'], ['difference', '[1, −1]: x₁ − x₂'], ['zero', '[0, 0]']]} />}
      <FlowChoice label="Correction" value={correction} onChange={setCorrection} options={[['three', 'Three values'], ['broadcast', 'One value, broadcast']]} />
    </FlowControls>
    <FlowReadout>{state.compatible ? <>Output <strong>{vec(state.output)}</strong>; an upstream gradient [1, 2, 3] returns through the skip as Pᵀg = <strong>{vec(state.gradient)}</strong>.</> : 'Shape mismatch: 2 skip values cannot be added to 3 correction values, so no output or backward result exists.'}</FlowReadout>
  </FlowLab>;
}

// A learned gate α starting at 0: what can move on the first step?
export function ResidualOpeningLab() {
  const [scale, setScale] = useState(0), [kind, setKind] = useState('scalar'), [firstCorrection, setFirstCorrection] = useState(0);
  const state = gateModel(scale, kind, firstCorrection);
  const show = value => Array.isArray(value) ? vec(value) : fmt(value);
  return <FlowLab id="res-opening" label="A zero gate still lets the gate itself learn">
    <div className="res-flow">
      <div className="res-input">input <span className="ink-input">x = [1, 2]</span> · branch output <span className="ink-computed">F(x) = {vec(state.branch)}</span></div>
      <div className="res-learned">gate <span className="ink-learned">α = {fmt(scale)}</span> ({kind === 'channel' ? 'one per feature' : 'one shared scalar'})</div>
      <div className="res-computed">output <span className="ink-computed">x + αF(x) = {vec(state.output)}</span> · loss ½‖y‖² = {fmt(state.loss)}</div>
    </div>
    <FlowControls>
      <FlowSlider name="Initial gate α" value={scale} onChange={setScale} min={-1} max={1} step={0.05} format={fmt} />
      <FlowChoice label="Gate shape" value={kind} onChange={setKind} options={[['scalar', 'One scalar'], ['channel', 'One per feature']]} />
      <FlowSlider name="First branch correction" value={firstCorrection} onChange={setFirstCorrection} min={-1} max={1} step={0.05} format={fmt} />
    </FlowControls>
    <FlowReadout>Gate gradient <span className="ink-backward">{show(state.scaleGradient)}</span>; gradient for the weights inside F (a 2 × 2 matrix acting on x) <span className="ink-backward">{matrix(state.branchGradient)}</span>. One gate-only step at rate 0.1 moves α to <strong>{show(state.nextScale)}</strong> and the loss from {fmt(state.loss)} to <strong>{fmt(state.nextLoss)}</strong>. {scale === 0 ? 'At α = 0 the branch weights get no gradient yet, but α does, so the next step can reach them.' : 'A nonzero gate passes a gradient to the branch weights immediately.'}</FlowReadout>
  </FlowLab>;
}

function usePlotWidth() {
  const ref = useRef(null); const [width, setWidth] = useState(500);
  useEffect(() => { const observer = new ResizeObserver(entries => { const w = entries[0]?.contentRect.width; if (w > 0) setWidth(w); }); if (ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return [ref, width];
}
// Lines are labelled at their right-hand end, so no separate legend is needed.
// yRange fixes the vertical axis so switching records never silently rescales it; log draws a log10 axis.
function TracePlot({ points, label, axis, yTitle, series = [['training', 'training']], signed = false, yRange, log = false, reference }) {
  const [ref, width] = usePlotWidth(); const height = 240, left = 56, right = 92, top = 18, bottom = 40;
  const values = points.flatMap(row => series.map(([key]) => row[key]).filter(Number.isFinite));
  const t = value => log ? Math.log10(value) : value;
  const low = yRange ? t(yRange[0]) : signed ? Math.min(0, ...values) : 0;
  const high = yRange ? t(yRange[1]) : Math.max(1e-8, ...values); const span = high - low || 1;
  const last = Math.max(1, ...points.map(row => row.step));
  const x = value => left + value / last * (width - left - right);
  const y = value => top + (high - Math.min(high, Math.max(low, t(value)))) / span * (height - top - bottom);
  const ticks = log ? Array.from({ length: Math.round(high - low) + 1 }, (_, i) => 10 ** (low + i)).filter((_, i) => i % 2 === 0 || Math.round(high - low) <= 4)
    : signed ? [yRange ? yRange[0] : low, 0, yRange ? yRange[1] : high] : [low, (low + high) / 2, high];
  const tickText = value => log ? (value >= 1 ? String(value) : `10${String(Math.round(Math.log10(value))).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`) : Math.abs(value) >= 100 ? value.toPrecision(2) : String(Number(value.toFixed(2))).replace('-', '−');
  // End labels: place each beside its last point, then push apart any that would overlap.
  const ends = series.map(([key, name], i) => { const rows = points.filter(row => Number.isFinite(row[key])); const end = rows.at(-1); return end ? { i, name, y: y(end[key]) + 4 } : null; }).filter(Boolean);
  if (reference) ends.push({ i: 'ref', name: reference.name, y: y(reference.value) + 4 });
  ends.sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14;
  for (const end of ends) end.y = Math.min(height - bottom + 4, Math.max(top + 4, end.y));
  const labelY = i => ends.find(end => end.i === i)?.y;
  return <div ref={ref}><svg className="res-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
    <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} /><line x1={left} y1={top} x2={left} y2={height - bottom} />
    {signed && <line className="res-zero" x1={left} y1={y(0)} x2={width - right} y2={y(0)} />}
    {ticks.map((value, i) => <text key={i} x={left - 6} y={y(value) + 4} textAnchor="end">{tickText(value)}</text>)}
    {yTitle && <text className="res-axis-title" x={12} y={(top + height - bottom) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(top + height - bottom) / 2})`}>{yTitle}</text>}
    {reference && <g><line className="res-reference" x1={left} y1={y(reference.value)} x2={width - right} y2={y(reference.value)} /><text className="res-series-label res-reference-label" x={width - right + 8} y={labelY('ref')}>{reference.name}</text></g>}
    {series.map(([key, name], i) => { const rows = points.filter(row => Number.isFinite(row[key])); return <g key={key}><polyline className={`res-path ${i ? 'res-validation' : 'res-train'}`} strokeDasharray={i ? '5 4' : undefined} points={rows.map(row => `${x(row.step)},${y(row[key])}`).join(' ')} />{rows.map(row => <circle key={row.step} className={i ? 'res-validation' : 'res-train'} cx={x(row.step)} cy={y(row[key])} r={i ? 4 : 2.5} />)}{rows.length > 0 && <text className={`res-series-label ${i ? 'res-validation' : 'res-train'}`} x={width - right + 8} y={labelY(i)}>{name}</text>}</g>; })}
    <text x={left} y={height - bottom + 19}>0</text><text x={width - right} y={height - bottom + 19} textAnchor="end">{last}</text><text x={(width - right + left) / 2} y={height - 4} textAnchor="middle">{axis}</text>
  </svg></div>;
}
let measurementsPromise;
function fetchMeasurements() { if (!measurementsPromise) measurementsPromise = fetch(`${residualAssets}/browser-measurements.json`).then(response => { if (!response.ok) throw new Error('Saved measurements unavailable'); return response.json(); }).catch(error => { measurementsPromise = null; throw error; }); return measurementsPromise; }
function useMeasurements() {
  const [data, setData] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => { let active = true; setFailed(false); fetchMeasurements().then(value => { if (active) setData(value); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, [attempt]);
  return { data, failed, retry: () => setAttempt(value => value + 1) };
}
const modeLabel = { stem_only: 'Stem only', plain: 'Plain', residual: 'Additive residual', scaled: 'Fixed 1/√L scale', rezero: 'Learned zero gate' };
function Pending({ id, label, failed, retry }) {
  return <FlowLab id={id} label={label}>{failed ? <p role="alert">Saved measurements could not load. <button type="button" onClick={retry}>Retry measurements</button></p> : <p role="status">Loading the recorded experiment…</p>}</FlowLab>;
}

// The training specimens: real UCI digits, drawn from their recorded 8 × 8 pixels.
export function ResidualDigitSpecimens() {
  const { data, failed, retry } = useMeasurements();
  if (!data) return <Pending id="res-digits" label="Recorded training specimens" failed={failed} retry={retry} />;
  // Inner specimens are plain elements: a nested size-container figure would collapse inside the flex row.
  return <figure data-figure="residual-digit-specimens"><div className="res-digits">{data.specimens.map(row => <div className="res-digit" key={row.source_id}><svg className="res-pixels" viewBox="0 0 80 80" role="img" aria-label={`UCI digit ${row.digit}, source ${row.source_id}, recorded 8 by 8 pixels`}>{row.pixels.map((value, i) => <rect key={i} x={10 * (i % 8)} y={10 * Math.floor(i / 8)} width={10} height={10} fill={`rgb(${20 + Math.round(value * 14)},${20 + Math.round(value * 11)},${20 + Math.round(value * 5)})`} />)}</svg><p className="res-digit-label">Digit {row.digit}<br />source {row.source_id}</p></div>)}</div></figure>;
}

// Shared fixed range for every recorded fit: cross-entropy spans about 1.8e−4 to 4.8.
export const evidenceRange = [1e-4, 10];

// Recorded fits: choose a seed, a depth and a connection; read the learning curves on one fixed log axis.
export function ResidualEvidenceLab() {
  const { data, failed, retry } = useMeasurements();
  const [seed, setSeed] = useState(1), [depth, setDepth] = useState(12), [mode, setMode] = useState('residual');
  if (!data) return <Pending id="res-evidence" label="Inspect the recorded fits" failed={failed} retry={retry} />;
  const fit = data.fits.find(row => row.seed === seed && row.depth === depth && row.mode === mode), baseline = data.fits.find(row => row.seed === seed && row.depth === 0);
  const final = fit.trace.at(-1), baselineFinal = baseline.trace.at(-1);
  return <FlowLab id="res-evidence" label="Inspect the recorded fits" note="Recorded CPU experiment: these are saved measurements, not training in your browser.">
    <TracePlot log yRange={evidenceRange} yTitle="cross-entropy (nats)" label={`Mean cross-entropy, log scale, over Adam updates for seed ${seed}, ${depth} blocks, ${modeLabel[mode]}: training and validation, with the stem-only validation value as a reference`} axis="Adam updates" series={[['training', 'training'], ['validation', 'validation']]} reference={{ value: baselineFinal.validation.ce, name: 'stem only' }} points={fit.trace.map(row => ({ step: row.step, training: row.training.ce, validation: row.validation.ce }))} />
    <FlowControls>
      <FlowChoice label="Connection" value={mode} onChange={setMode} options={['plain', 'residual', 'scaled', 'rezero'].map(value => [value, modeLabel[value]])} />
      <FlowChoice label="Blocks" value={depth} onChange={setDepth} options={[2, 6, 12].map(value => [value, String(value)])} />
      <FlowChoice label="Seed" value={seed} onChange={setSeed} options={[1, 2, 3].map(value => [value, `seed ${value}`])} />
    </FlowControls>
    <FlowReadout>{modeLabel[mode]}, {depth} blocks, seed {seed}: <strong>{final.validation.correct}/120</strong> validation digits correct, validation CE {fmt(final.validation.ce)}, training CE {fmt(final.training.ce)}, {fit.trainable_count.toLocaleString()} parameters. The same seed's stem-only model, drawn as the faint line: {baselineFinal.validation.correct}/120, CE {fmt(baselineFinal.validation.ce)}. The vertical axis is logarithmic and the same for every record; points are the recorded updates 0, 1, 25, 100 and 250, and lines only connect them.</FlowReadout>
  </FlowLab>;
}

// Three recorded diagnostics for seed 1: gradient reaching the layers at update 0, final gates, branch movement.
export function ResidualDiagnosticsFigure() {
  const { data, failed, retry } = useMeasurements();
  if (!data) return <Pending id="res-diagnostics" label="Recorded diagnostics" failed={failed} retry={retry} />;
  const fit = mode => data.fits.find(row => row.seed === 1 && row.depth === 12 && row.mode === mode);
  const gradients = ['plain', 'residual'].map(mode => [mode, fit(mode).trace.find(row => row.step === 0).diagnostics.layers]);
  const gated = fit('rezero');
  const moves = Object.entries(gated.parameter_displacements).filter(([name]) => /^blocks\.\d+\.(lower|upper)\.weight$/.test(name)).map(([, value]) => value);
  return <figure data-figure="residual-diagnostics">
    <div className="res-columns">
      <div><h5>Gradient reaching each layer at update 0 (RMS, 12 blocks)</h5>{gradients.map(([mode, layers]) => <p key={mode} className="res-value">{modeLabel[mode]}: stem <span className="ink-backward">{fmt(layers[0].activation_gradient_rms)}</span> … last block <span className="ink-backward">{fmt(layers.at(-1).activation_gradient_rms)}</span></p>)}</div>
      <div><h5>Learned-gate model after training</h5><p>final gates α, one per block:</p><ol className="res-chips" aria-label="Final learned gates">{gated.scales.map((value, i) => <li key={i} className="res-chip-learned"><span>block {i + 1}</span>{fmt(Number(value.toFixed(3)))}</li>)}</ol><p>branch weight matrices moved <strong>{Math.min(...moves).toFixed(2)}–{Math.max(...moves).toFixed(2)}</strong> from their initialization (Frobenius norm)</p></div>
    </div>
  </figure>;
}

// Delete one block from a trained six-block model and re-score it, without retraining. The chips are the control.
export function ResidualAblationLab() {
  const { data, failed, retry } = useMeasurements();
  const [seed, setSeed] = useState(1), [mode, setMode] = useState('residual'), [omit, setOmit] = useState(-1);
  if (!data) return <Pending id="res-ablation" label="Remove one trained block" failed={failed} retry={retry} />;
  const fit = data.fits.find(row => row.seed === seed && row.depth === 6 && row.mode === mode);
  const final = fit.trace.at(-1);
  const rows = fit.validation_block_ablations;
  const ablation = rows.find(row => row.omitted_block === omit);
  return <FlowLab id="res-ablation" label="Remove one trained block" note="Recorded deletions of one block at a time, measured after training; nothing is retrained.">
    <div className="res-chips res-chips--buttons" role="group" aria-label="Choose a block to omit">
      <button type="button" aria-pressed={omit === -1} onClick={() => setOmit(-1)}><span>full model</span>{final.validation.correct}/120</button>
      {rows.map(row => <button type="button" key={row.omitted_block} aria-pressed={omit === row.omitted_block} aria-label={`Omit block ${row.omitted_block + 1}: ${row.correct} of 120 correct`} onClick={() => setOmit(row.omitted_block)}><span>omit {row.omitted_block + 1}</span>{row.correct}/120</button>)}
    </div>
    <FlowControls>
      <FlowChoice label="Connection" value={mode} onChange={value => { setMode(value); setOmit(-1); }} options={['residual', 'scaled', 'rezero'].map(value => [value, modeLabel[value]])} />
      <FlowChoice label="Seed" value={seed} onChange={value => { setSeed(value); setOmit(-1); }} options={[1, 2, 3].map(value => [value, `seed ${value}`])} />
    </FlowControls>
    <FlowReadout>{ablation ? <>Without block {omit + 1}: <strong>{ablation.correct}/120</strong> correct, CE {fmt(ablation.ce)}. Full six-block model: {final.validation.correct}/120, CE {fmt(final.validation.ce)}.</> : <>Full six-block {modeLabel[mode].toLowerCase()} model, seed {seed}: <strong>{final.validation.correct}/120</strong> correct, CE {fmt(final.validation.ce)}. Select a block above to delete it.</>}</FlowReadout>
    <p className="flow-note"><a href={`${residualAssets}/calculated-inputs.json`} download>Download every measured value</a>, including split IDs, per-layer diagnostics and parameter displacements.</p>
  </FlowLab>;
}

// Two linear blocks expand into four summed paths; a nonlinear branch does not distribute.
export function ResidualPathsFigure() {
  const state = nonlinearPaths(1);
  return <figure data-figure="residual-paths"><div className="res-columns">
    <div><h5>Two linear blocks: four paths, summed</h5><p className="res-value">(I + W₁)(I + W₀)x<br />= <span className="ink-input">x</span> + <span className="ink-computed">W₀x</span> + <span className="ink-computed">W₁x</span> + <span className="ink-computed">W₁W₀x</span></p><p>The four products share W₀ and W₁.</p></div>
    <div><h5>Nonlinear F(x) = x², starting at x₀ = 1</h5><p className="res-value">x₁ = 1 + 1 = {state.first}<br />x₂ = {state.first} + {state.first}² = <strong>{state.actual}</strong></p><p>The distributed expression x + F(x) + F(x) + F(F(x)) gives {state.invalid}.</p></div>
  </div></figure>;
}

// Forward Euler for dx/dt = −x: x_{k+1} = (1 − Δt) x_k.
export function ResidualEulerLab() {
  const [stepSize, setStepSize] = useState(0.1);
  const visibleSteps = 10;
  const state = scalarStack(-stepSize, visibleSteps);
  const verdict = stepSize === 0 ? 'Identity: time has not advanced.' : stepSize === 2 ? 'The sign alternates with unchanged magnitude.' : stepSize > 2 ? 'The magnitude grows despite a direct path in every update.' : stepSize === 1 ? 'The first update reaches zero exactly.' : stepSize < 1 ? 'The magnitude contracts without changing sign.' : 'The magnitude contracts while alternating sign.';
  return <FlowLab id="res-euler" label="A stable equation can have an unstable discrete update" note="Constructed calculation of a differential equation; not measured neural training.">
    <TracePlot signed label={`Euler state over ${visibleSteps} steps with step size ${stepSize}`} axis="Euler step k" series={[['training', 'xₖ']]} points={state.trace.map(row => ({ step: row.step, training: row.value }))} />
    <FlowControls>
      <FlowSlider name="Step size Δt" value={stepSize} onChange={setStepSize} min={0} max={3} step={0.05} format={fmt} />
    </FlowControls>
    <FlowReadout>Each step multiplies by 1 − Δt = <strong>{fmt(state.multiplier)}</strong>; after {visibleSteps} steps x = <strong>{fmt(state.gain)}</strong>. {verdict}</FlowReadout>
  </FlowLab>;
}

// Illustrative residual denoising arithmetic.
export function ResidualDenoisingFigure() {
  return <figure data-figure="residual-denoising"><div className="res-flow">
    <div className="res-input">observed <span className="ink-input">z = [0.2, 0.9, 0.4]</span></div>
    <div className="res-computed">estimated noise <span className="ink-computed">n̂(z) = [0.1, −0.1, 0.2]</span> (hypothetical)</div>
    <div className="res-arrow" aria-hidden="true">↓ z − n̂(z)</div>
    <div className="res-computed">denoised <span className="ink-computed">[0.1, 1.0, 0.2]</span></div>
  </div></figure>;
}

// What a residual join needs in memory: the two values at the moment of addition.
export function ResidualMemoryFigure() {
  return <figure data-figure="residual-memory"><div className="res-flow">
    <div className="res-input">x stays available until the join</div>
    <div className="res-computed">branch F: its intermediate values may be saved for backward, or recomputed</div>
    <div className="res-op">⊕ join consumes x and F(x)</div>
    <div className="res-arrow ink-backward" aria-hidden="true">↑ backward</div>
    <div className="res-op">the addition routes <span className="ink-backward">g</span> to both inputs; its own derivative needs no saved values</div>
  </div></figure>;
}

export function ResidualProgram() { return <><MechanismProgram source={`${residualAssets}/residual-experiments.py`} title="Read the complete scratch-routing and ordinary PyTorch experiment" output={'Executed on CPU: 39 fitted models, seeds 1/2/3, depths 0/2/6/12.\nSelected seed-1 final rows (training CE, validation CE, correct/120):\n0 stem_only  0.027306  0.107264  117\n6 plain      0.000702  0.254232  116\n6 residual   0.000664  0.221809  116\n12 plain     0.002000  0.599136  110\n12 residual  0.000389  0.303736  111\n12 scaled    0.000405  0.144360  113\n12 rezero    0.000184  0.161761  116\nComplete JSON includes every fit and diagnostic; this is an excerpt.'} /><p><a href={`${residualAssets}/digits-400.csv`} download>Download required digits-400.csv</a> · <a href={`${residualAssets}/data-provenance.md`}>Data attribution and complete experiment protocol</a></p></>; }
