import { useState } from 'react';
import { FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { FORMATS, decode, encode, quantize, scaleTrace, grouped, historyTrace, transpose, mm, matrixTrace, masterTrace, cost } from '../../data/fp8-training-models.js';
import study from '../../data/fp8-training-study.json';
import './fp8-training-flow.css';

const C = { x: '#67d5e5', w: '#e5b760', g: '#ef91b3', y: '#c7a2f4', s: '#83aaff', ref: '#d0d0d0' };
const n = (x, digits = 4) => !Number.isFinite(x) ? String(x) : x !== 0 && Math.abs(x) < .0001
  ? x.toExponential(2) : Number(x.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits });
const css = role => ({ '--fp8-role': C[role] || role });
function Figure({ name, label, children, caption }) {
  return <figure className="fp8-figure" data-fp8-figure={name} aria-label={label}>{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
function Scroll({ children, label }) { return <div className="fp8-scroll" role="region" tabIndex={0} aria-label={label}>{children}</div>; }
function Matrix({ values, name, role = 'x', groups, selected = [], onSelect, subtitle }) {
  return <div className="fp8-matrix-object" style={css(role)}>
    <div className="fp8-matrix-name"><strong>{name}</strong><span>{values.length} × {values[0].length}</span></div>
    <Scroll label={name + ' values'}><table className="fp8-matrix"><tbody>{values.map((row, r) => <tr key={r}>{row.map((value, c) => {
      const chosen = selected.some(([i, j]) => r === i && c === j), group = groups?.[r]?.[c];
      const border = { borderTopWidth: groups && (r === 0 || groups[r - 1][c] !== group) ? 3 : 1,
        borderLeftWidth: groups && (c === 0 || groups[r][c - 1] !== group) ? 3 : 1 };
      return <td key={c} data-selected={chosen || undefined} data-group={group} style={border}>
        {onSelect ? <button type="button" aria-pressed={chosen} aria-label={name + ' row ' + (r + 1) + ', column ' + (c + 1) + ': ' + n(value)} onClick={() => onSelect(r, c)}>{n(value)}</button>
          : <span aria-label={'row ' + (r + 1) + ', column ' + (c + 1) + ': ' + n(value)}>{n(value)}</span>}</td>;
    })}</tr>)}</tbody></table></Scroll>
    {subtitle && <p className="fp8-small">{subtitle}</p>}
  </div>;
}
function Arrow({ text = '→', backward = false }) { return <div data-directional={text === '→' || undefined} className={'fp8-arrow' + (backward ? ' fp8-backward' : '')}>{text === 'round →' ? <>round <span className="fp8-round-arrow">→</span></> : text}</div>; }
function Legend({ items }) { return <div className="fp8-legend">{items.map(([label, role, dashed]) => <span key={label} style={css(role)}><i data-dashed={dashed || undefined} />{label}</span>)}</div>; }
function Plot({ series, min, max, xMax, selected, label, xLabel, yLabel }) {
  const x = value => 16 + 568 * value / xMax, y = value => 188 - 164 * (value - min) / (max - min);
  return <div className="fp8-plot" role="group" aria-label={label}>
    <div className="fp8-axis"><span>{yLabel} · {n(max, 3)}</span><span>top</span></div>
    <svg viewBox="0 0 600 212" role="img" aria-label={label}>
      {[0, .25, .5, .75, 1].map(t => <line key={t} x1="16" x2="584" y1={24 + 164 * t} y2={24 + 164 * t} className="fp8-gridline" />)}
      {selected !== undefined && <line x1={x(selected)} x2={x(selected)} y1="18" y2="193" className="fp8-selection" />}
      {series.map(line => <g key={line.label} style={{ color: C[line.role] || line.role }}>
        <polyline points={line.points.map(([a, b]) => x(a) + ',' + y(b)).join(' ')} fill="none" stroke="currentColor" strokeWidth="2.7" strokeDasharray={line.dashed ? '7 5' : undefined} />
        {line.points.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r={a === selected ? 5 : 3} fill="currentColor"><title>{line.label + ', ' + xLabel + ' ' + a + ': ' + n(b, 6)}</title></circle>)}
      </g>)}
    </svg>
    <div className="fp8-axis"><span>{n(min, 3)} · bottom</span><span>{xLabel}: 0 → {xMax}</span></div>
    <Legend items={series.map(s => [s.label, s.role, s.dashed])} />
  </div>;
}

export function PayloadFigure() {
  const original = [[1.2, .5, -2], [1, 3, .25]], rounded = original.map(row => row.map(v => quantize(v)));
  return <Figure name="payload" label="Six activation values keep their shape while payload shrinks" caption="Cyan identifies the same six cells. Strips count value payload only; scales and training state are separate.">
    <div className="fp8-stage-row"><div><Matrix name="X · FP32" values={original} selected={[[0, 0]]} />
      <div className="fp8-byte-rows">{original.flat().map((v, i) => <div key={i}><span>x{i}</span>{[0, 1, 2, 3].map(j => <i key={j} />)}</div>)}</div><p>6 × 4 = <strong>24 bytes</strong></p></div>
      <Arrow text="round →" /><div><Matrix name="X · FP8 view" values={rounded} selected={[[0, 0]]} />
        <div className="fp8-byte-rows">{rounded.flat().map((v, i) => <div key={i}><span>x{i}</span><i /></div>)}</div><p>6 × 1 = <strong>6 bytes</strong></p></div></div>
    <div className="fp8-wire"><span style={css('x')}>X values</span><b>×</b><span style={css('w')}>learned Wᵀ</span><b>→</b><span style={css('y')}>Y scores</span></div>
    <p>Selected cell: 1.2 → 1.25, error +0.05. Shape: 2 × 3 in both views.</p>
  </Figure>;
}
export function BitLab() {
  const [byte, setByte] = useState(58);
  const sign = byte >> 7, exponent = (byte & 127) >> 3, fraction = byte & 7, value = decode(byte);
  return <Figure name="bits" label="Editable eight-bit E4M3FN encoding">
    <div className="fp8-bits">{Array.from({ length: 8 }, (_, i) => <button key={i} type="button" className={i === 0 ? 'fp8-bit-sign' : i < 5 ? 'fp8-bit-exp' : 'fp8-bit-frac'}
      aria-label={'Toggle ' + (i === 0 ? 'sign' : i < 5 ? 'exponent' : 'fraction') + ' bit ' + (7 - i)}
      aria-pressed={Boolean(byte & (1 << (7 - i)))} onClick={() => setByte(byte ^ (1 << (7 - i)))}>{(byte >> (7 - i)) & 1}</button>)}</div>
    <div className="fp8-bit-groups"><span>sign · 1 bit</span><span>exponent · 4 bits</span><span>fraction · 3 bits</span></div>
    <div className="fp8-decode"><span>sign → {sign ? '−1' : '+1'}</span><span>field e = {exponent} → exponent {exponent ? exponent - 7 : -6}</span>
      <span>field m = {fraction} → {exponent ? '1 + ' : ''}{fraction}/8</span></div>
    <FlowControls><FlowChoice label="Encoding examples" value={byte} onChange={setByte} options={[[58, '1.25'], [1, 'smallest subnormal'], [126, 'largest finite'], [127, 'NaN'], [128, 'negative zero']]} /></FlowControls>
    <FlowReadout>Byte {byte}: <strong>{Object.is(value, -0) ? '−0' : n(value, 8)}</strong>. {Number.isNaN(value) ? 'Exponent 15 and fraction 7 encode NaN, not the normal arithmetic rule.' : exponent === 0 ? 'Exponent zero uses no implicit leading 1.' : 'Finite normal: sign × power of two × (1 + fraction).'}</FlowReadout>
  </Figure>;
}
export function RoundingLab() {
  const [value, setValue] = useState(1.1875), [format, setFormat] = useState('e4m3');
  const grid = Array.from({ length: FORMATS[format].maxCode + 1 }, (_, i) => decode(i, format)).filter(x => x >= .75 && x <= 1.5);
  const result = quantize(value, format), px = x => 24 + (x - .75) / .75 * 552;
  return <Figure name="rounding" label="Rounding on the nonuniform FP8 number line">
    <div className="fp8-axis"><span>input (rose) and rounded value (cyan)</span><span>0.75 → 1.5</span></div>
    <svg viewBox="0 0 600 120" role="img" aria-label={'Input ' + value + ' rounds to ' + result}>
      <line x1="24" x2="576" y1="70" y2="70" className="fp8-selection" />
      {grid.map((v, i) => <g key={v}><line x1={px(v)} x2={px(v)} y1="60" y2="82" stroke={C.x} strokeWidth="3" /><title>{'Representable ' + v}</title>
        {i < grid.length - 1 && <line x1={px((v + grid[i + 1]) / 2)} x2={px((v + grid[i + 1]) / 2)} y1="42" y2="94" stroke="#777" strokeDasharray="3 4" />}</g>)}
      <line x1={px(value)} x2={px(result)} y1="28" y2="62" stroke={C.g} strokeWidth="2" />
      <circle cx={px(value)} cy="28" r="6" fill={C.g} /><circle cx={px(result)} cy="70" r="6" fill={C.x} />
    </svg>
    <p className="fp8-small">Representable ticks, in left-to-right order:</p>
    <div className="fp8-grid-values">{grid.map(v => <span key={v} data-selected={v === result || undefined}>{n(v)}</span>)}</div>
    <FlowControls><FlowSlider name="Input x" value={value} onChange={setValue} min={.875} max={1.375} step={.015625} />
      <FlowChoice label="Format" value={format} onChange={setFormat} options={[['e4m3', 'E4M3FN'], ['e5m2', 'E5M2']]} />
      <FlowChoice label="Tie / exact presets" value={value} onChange={setValue} options={[[1.0625, '1.0625'], [1.1875, '1.1875'], [1.25, '1.25']]} /></FlowControls>
    <FlowReadout>{n(value, 6)} → <strong>{n(result)}</strong>; error {n(result - value, 6)}; byte {encode(value, format)}. Dashed boundaries are midpoints. {value === result ? 'Already representable: no change.' : 'At an exact midpoint, choose the even low encoding bit.'}</FlowReadout>
  </Figure>;
}
export function ScaleLab() {
  const [magnitude, setMagnitude] = useState(1), [outlier, setOutlier] = useState(1);
  const values = [0, .001, .002, .004 * outlier].map(v => v * magnitude), t = scaleTrace(values);
  const rows = [['x', values], ['x ÷ s', t.scaled], ['decoded q', t.q], ['s × q', t.recovered]];
  return <Figure name="scale" label="Scale, quantize and reconstruct four corresponding values">
    <div className="fp8-scale-chain">{rows.map(([name, vals], i) => <div key={name}>
      <Matrix name={name} values={[vals]} selected={[[0, 3]]} />
      {i < rows.length - 1 && <div className="fp8-chain-action">{['divide by reconstruction scale', 'nearest-even FP8 conversion', 'multiply by stored scale'][i]} ↓</div>}</div>)}</div>
    <div className="fp8-sidecar" style={css('s')}>stored beside q: s = {n(t.scale, 8)} · c = 1/s = {n(1 / t.scale, 3)}</div>
    <FlowControls><FlowSlider name="Magnitude multiplier" min={0} max={4} step={.25} value={magnitude} onChange={setMagnitude} />
      <FlowChoice label="Last-entry outlier" value={outlier} onChange={setOutlier} options={[[1, 'none'], [1000, '×1,000'], [100000, '×100,000']]} /></FlowControls>
    <FlowReadout>Maximum {n(t.maximum)}; scale {n(t.scale, 8)}; max error <strong>{n(t.maxError, 8)}</strong>; newly rounded zeros {t.newZeros}. {magnitude === 0 ? 'All zero: s = 1 and zero bytes.' : 'One scale serves all four values.'}</FlowReadout>
  </Figure>;
}

export function GroupLab() {
  const [outlier, setOutlier] = useState(100000), [zero, setZero] = useState(false);
  const input = Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => zero ? 0 : r === 0 && c === 0 ? outlier : 1));
  return <Figure name="groups" label="The same outlier under tensor, row and block groups">
    <Matrix values={input} name="Original X" selected={[[0, 0]]} />
    <div className="fp8-group-comparison">{['tensor', 'row', 'block'].map(mode => { const t = grouped(input, mode); return <div key={mode}>
      <Matrix values={t.result} name={mode === 'tensor' ? 'One tensor scale' : mode === 'row' ? 'Four row scales' : 'Four 2 × 2 scales'} groups={t.groupIds} selected={[[0, 0]]} />
      <div className="fp8-scale-list" style={css('s')}>{t.scales.map((s, i) => <span key={i}>s{i} = {n(s, 6)}</span>)}</div>
      <p>error on entries originally 1: <strong>{n(t.smallError, 6)}</strong><br />16 payload + {4 * t.scales.length} scale = {t.bytes} bytes</p>
    </div>; })}</div>
    <FlowControls><FlowChoice label="Outlier" value={outlier} onChange={value => { setOutlier(value); setZero(false); }} options={[[1, 'all equal'], [100, '100'], [100000, '100,000']]} />
      <FlowChoice label="Tensor values" value={zero} onChange={setZero} options={[[false, 'use values'], [true, 'all zero']]} /></FlowControls>
    <FlowReadout>Heavy borders mark scale groups; white outlines follow the selected cell. {zero || outlier === 1 ? 'Reconstruction agrees; metadata counts differ.' : 'The outlier only compromises small values inside its group.'}</FlowReadout>
  </Figure>;
}
export function HistoryLab() {
  const [sequence, setSequence] = useState('spike'), [window, setWindow] = useState(3), [step, setStep] = useState(3);
  const values = sequence === 'spike' ? [1, 1, 1, 8, 1, 1, 1, 1] : Array(8).fill(sequence === 'zero' ? 0 : 1);
  const rows = historyTrace(values, window), row = rows[step];
  const cap = sequence === 'zero' ? 448 : 9;
  const envelope = rows.flatMap((r, i) => i < 7 ? [[i, r.capacity], [i + .999, r.capacity]] : [[i, r.capacity]]);
  return <Figure name="history" label="Observed maxima and capacity from preceding history">
    <Plot label="Current maximum and delayed representable capacity" min={0} max={cap} xMax={7} selected={step} xLabel="sample index" yLabel="magnitude"
      series={[{ label: 'current amax', role: 'x', points: rows.map((r, i) => [i, r.amax]) }, { label: 'delayed capacity s × 448', role: 's', points: envelope, dashed: true }]} />
    <div className="fp8-history-cells">{values.map((v, i) => <button type="button" key={i} onClick={() => setStep(i)} aria-pressed={i === step}
      data-history={i < step && i >= step - window || undefined} data-clipped={rows[i].clipped > 0 || undefined}><span>t{i + 1}</span><strong>{v}</strong></button>)}</div>
    <p className="fp8-small">Blue brackets mark preceding history; rose borders mark observed clipping. Step 1 bootstraps from its current value.</p>
    <FlowControls><FlowSlider name="History length" value={window} onChange={setWindow} min={1} max={6} step={1} />
      <FlowChoice label="Sequence" value={sequence} onChange={setSequence} options={[['spike', 'spike'], ['constant', 'constant'], ['zero', 'zero']]} /></FlowControls>
    <FlowReadout>Step {step + 1}: history [{row.history.join(', ')}], s = <strong>{n(row.scale, 6)}</strong>, maximum {row.amax}, reconstructed maximum {n(row.recovered[0], 6)}. Clipped entries {row.clipped}. {sequence === 'zero' ? 'Zero history uses s = 1; capacity is 448 although no value needs it.' : ''}</FlowReadout>
  </Figure>;
}
export function GemmLab() {
  const [fixture, setFixture] = useState('ordinary'), [delta, setDelta] = useState(0), [selected, setSelected] = useState([0, 0]);
  const x = fixture === 'zero' ? [[0, 0, 0], [0, 0, 0]] : [[1 + delta, 2, 3], [.5, -1, 2]];
  const w = fixture === 'cancellation' ? [[2, -1, .001], [0, 1, 1]] : [[2, -1, .5], [0, 1, 1]];
  const t = matrixTrace(x, w), [r, c] = selected, products = t.xq[r].map((v, k) => v * t.wq[c][k]);
  return <Figure name="gemm" label="A selected output traces a quantized row-by-column product">
    <div className="fp8-stage-row"><Matrix name="qX" values={t.xq} selected={x[0].map((_, k) => [r, k])} /><Arrow text="×" />
      <Matrix name="qWᵀ" values={transpose(t.wq)} role="w" selected={w[0].map((_, k) => [k, c])} /><Arrow />
      <Matrix name="reconstructed Y" values={t.result} role="y" selected={[selected]} onSelect={(i, j) => setSelected([i, j])} /></div>
    <div className="fp8-sidecar" style={css('s')}>sX = {n(t.xt.scale, 6)} · sW = {n(t.wt.scale, 6)} · multiply each raw sum by sX × sW</div>
    <div className="fp8-dot-terms">{products.map((p, k) => <div key={k}><span style={css('x')}>{n(t.xq[r][k])}</span><b>×</b><span style={css('w')}>{n(t.wq[c][k])}</span><b>=</b><strong>{n(p)}</strong></div>)}</div>
    <p>Raw sum {n(t.raw[r][c])} × {n(t.xt.scale * t.wt.scale, 8)} = <strong>{n(t.result[r][c], 6)}</strong>. Original dot: {n(t.exact[r][c], 6)}.</p>
    <FlowControls><FlowChoice label="Matrix fixture" value={fixture} onChange={setFixture} options={[['ordinary', 'ordinary'], ['cancellation', 'cancellation'], ['zero', 'zero X']]} />
      <FlowSlider name="X[0,0] perturbation" value={delta} onChange={setDelta} min={0} max={.5} step={.025} /></FlowControls>
    <FlowReadout>Click an output to trace its row and column. Frobenius error {n(t.error, 6)}; relative error {t.relative === null ? 'undefined (zero reference norm)' : n(t.relative, 6)}. Scalar arithmetic illustrates quantized operands; the CPU program specifies FP32 accumulation.</FlowReadout>
  </Figure>;
}
export function TrainingFigure() {
  const x = [[1, 2, 3]], w = [[2, -1, .5], [0, 1, 1]], g = [[.1, -.2]];
  return <Figure name="training" label="Three products use different operand layouts" caption="Exact unquantized values expose the shape rules. The selected recipe reconstructs E4M3 X/W and E5M2 G before these products. Rose dashed paths denote backward.">
    <div className="fp8-product-lane"><p>Forward · XWᵀ</p><div className="fp8-stage-row"><Matrix name="X" values={x} /><Arrow text="×" />
      <Matrix name="Wᵀ" role="w" values={transpose(w)} /><Arrow /><Matrix name="Y" role="y" values={mm(x, transpose(w))} /></div></div>
    <div className="fp8-product-lane fp8-gradient-lane"><p>Input gradient · GW</p><div className="fp8-stage-row"><Matrix name="G" role="g" values={g} /><Arrow text="×" backward />
      <Matrix name="W" role="w" values={w} /><Arrow backward /><Matrix name="dX" role="g" values={mm(g, w)} /></div></div>
    <div className="fp8-product-lane fp8-gradient-lane"><p>Weight gradient · GᵀX</p><div className="fp8-stage-row"><Matrix name="Gᵀ" role="g" values={transpose(g)} /><Arrow text="×" backward />
      <Matrix name="X" values={x} /><Arrow backward /><Matrix name="dW" role="g" values={mm(transpose(g), x)} /></div></div>
    <div className="fp8-update-wire"><span style={css('w')}>FP32 master W</span><span>− learning rate ×</span><span style={css('g')}>dW</span><span>⇢ next FP32 W ⇢ new quantized view</span></div>
  </Figure>;
}
export function UpdateLab() {
  const [update, setUpdate] = useState(.01), [step, setStep] = useState(4), points = masterTrace(update), current = points[step];
  const low = Math.min(.9, points.at(-1).master, points.at(-1).low) - .03;
  return <Figure name="updates" label="Same updates accumulate in a master while FP8-only storage may discard them">
    <Plot label="Master, rounded copy and rounded stored-weight trajectories" min={low} max={1.025} xMax={12} selected={step} xLabel="update step" yLabel="weight"
      series={[{ label: 'FP32 master', role: 'w', points: points.map(p => [p.step, p.master]) },
        { label: 'rounded master copy', role: 'x', points: points.map(p => [p.step, p.copy]), dashed: true },
        { label: 'FP8-only stored weight', role: 'g', points: points.map(p => [p.step, p.low]) }]} />
    <div className="fp8-lattice"><span>E4M3 neighbors near 1:</span>{[.875, .9375, 1, 1.125].map(v => <span key={v} data-selected={v === current.copy || undefined}>{v}</span>)}</div>
    <FlowControls><FlowSlider name="Same incoming update" min={0} max={.05} step={.005} value={update} onChange={setUpdate} />
      <FlowSlider name="Step" min={0} max={12} step={1} value={step} onChange={setStep} /></FlowControls>
    <FlowReadout>Step {step}: master <strong>{n(current.master, 6)}</strong>, FP8 copy {n(current.copy)}, FP8-only storage {n(current.low)}. {update === 0 ? 'Zero update: every trajectory is stationary.' : 'Identical incoming updates isolate storage from model feedback.'}</FlowReadout>
  </Figure>;
}
export function PrecisionStudy() {
  const [seed, setSeed] = useState(17), [evaluation, setEvaluation] = useState('native'), [step, setStep] = useState(240);
  const rows = study.records.filter(r => r.seed === seed), key = evaluation === 'native' ? 'heldout_nll' : 'heldout_fp32_nll';
  const records = rows.map(r => ({ ...r, point: r.curve.find(p => p.step === step) }));
  return <Figure name="real-study" label="Recorded training and held-out curves from the matched CPU study">
    <p className="fp8-small">Recorded CPU run · 4-character MLP · matched initialization and batches within each seed.</p>
    <Plot label="Measured train and held-out log loss" min={2.1} max={4.4} xMax={240} selected={step} xLabel="training step" yLabel="NLL, nats/target"
      series={records.flatMap(r => [{ label: r.mode + ' held-out', role: r.mode === 'fp32' ? 'ref' : r.mode === 'custom' ? 'x' : 'y', points: r.curve.map(p => [p.step, p[key]]), dashed: r.mode === 'torchao' },
        ...(r.mode === 'torchao' ? [] : [{ label: r.mode + ' train', role: r.mode === 'fp32' ? 'ref' : 'x', points: r.curve.map(p => [p.step, p.train_nll]), dashed: true }])])} />
    <Scroll label="Recorded selected-step results"><table className="fp8-result-table"><thead><tr><th>condition</th><th>train</th><th>held-out</th><th>first-gradient relative L2</th></tr></thead>
      <tbody>{records.map(r => <tr key={r.mode}><th>{r.mode}</th><td>{n(r.point.train_nll, 6)}</td><td>{n(r.point[key], 6)}</td><td>{n(r.initial_gradient_relative_l2, 6)}</td></tr>)}</tbody></table></Scroll>
    <FlowControls><FlowChoice label="Recorded seed" value={seed} onChange={setSeed} options={[[17, '17'], [29, '29']]} />
      <FlowChoice label="Held-out forward arithmetic" value={evaluation} onChange={setEvaluation} options={[['native', 'native condition'], ['fp32', 'fixed FP32']]} />
      <FlowSlider name="Recorded step" value={step} onChange={setStep} min={0} max={240} step={20} /></FlowControls>
    <FlowReadout>Seed {seed}, step {step}: custom and torchao curves coincide. {evaluation === 'fp32' ? 'Held-out scoring uses FP32 products on each model’s learned weights.' : 'Each model uses its own forward arithmetic for scoring.'} Train traces retain native arithmetic. No browser retraining or hardware speed measurement.</FlowReadout>
  </Figure>;
}

export function BlockProductFigure() {
  const [equal, setEqual] = useState(false), scales = equal ? [.5, .5] : [.5, 2];
  return <Figure name="block-product" label="K groups carry separate scale products into the sum">
    <div className="fp8-block-partials">{scales.map((s, i) => <div key={i} className="fp8-partial">
      <p>K group {i + 1}</p><div className="fp8-stage-row"><Matrix name={'qX group ' + (i + 1)} values={[[1, 2]]} />
        <Arrow text="·" /><Matrix name={'qW group ' + (i + 1)} role="w" values={[[2, 1]]} /></div>
      <p>1 × 2 + 2 × 1 = <strong>4</strong></p><div className="fp8-sidecar" style={css('s')}>sX,g × sW,g = {s}</div><Arrow text="↓ reconstruct partial" />
      <strong className="fp8-partial-value" style={css('y')}>4 × {s} = {4 * s}</strong>
    </div>)}</div>
    <div className="fp8-sum-bracket">└ partial 1 <b>+</b> partial 2 ┘ <strong>= {4 * (scales[0] + scales[1])}</strong></div>
    <FlowControls><FlowChoice label="Scale products" value={equal} onChange={setEqual} options={[[false, 'different: 0.5 and 2'], [true, 'equal: 0.5 and 0.5']]} /></FlowControls>
    <FlowReadout>{equal ? 'Equal scales: 0.5 × (4 + 4) = 4, so one factor may move outside.' : 'Unequal scales: 0.5 × 4 + 2 × 4 = 10. Attaching just 0.5 to raw sum 8 would give the wrong result 4.'}</FlowReadout>
  </Figure>;
}
export function TransposeLab() {
  const [outlier, setOutlier] = useState(100000);
  const x = Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => r === 0 && c === 0 ? outlier : 1));
  const original = grouped(x, 'row'), transposed = transpose(original.result), newGrouping = grouped(transpose(x), 'row');
  const errors = matrix => Math.max(...matrix.flat().map((v, i) => Math.abs(v - transpose(x).flat()[i])));
  return <Figure name="transpose" label="Transposing old row groups differs from quantizing new row groups">
    <Matrix name="Original X · wider precision" values={x} selected={[[0, 0]]} />
    <div className="fp8-transpose-branches"><div><p className="fp8-branch-label">Path A: quantize rows, then transpose ↓</p><Matrix name="Old approximation transposed" values={transposed} groups={transpose(original.groupIds)} />
      <p>Old row groups become columns. Max error {n(errors(transposed), 5)}.</p></div>
      <div><p className="fp8-branch-label">Path B: transpose originals, then quantize rows ↓</p><Matrix name="Fresh row groups of Xᵀ" values={newGrouping.result} groups={newGrouping.groupIds} />
        <p>New row groups use original values. Max error {n(errors(newGrouping.result), 5)}.</p></div></div>
    <FlowControls><FlowChoice label="Original outlier" value={outlier} onChange={setOutlier} options={[[1, 'all equal'], [100000, '100,000']]} /></FlowControls>
    <FlowReadout>Heavy borders show scale groups. {outlier === 1 ? 'Both paths agree numerically on equal values.' : 'Overall max error can match while different cells suffer that error. Compare first row and first column.'} Form a newly required orientation from wider originals.</FlowReadout>
  </Figure>;
}
export function PrecisionMap() {
  return <Figure name="precision-map" label="Quantized product inputs sit inside a wider training computation" caption="The CPU recipe uses E4M3 X/W and E5M2 G. DeepSeek-V3 reports all-E4M3 with fine-grained scales. Each recipe also defines its wider state and accumulation.">
    <div className="fp8-precision-path"><div className="fp8-mini-tensor" style={css('x')}><strong>X</strong><span>activation grid</span><i /><i /><i /><i /></div>
      <Arrow /><div className="fp8-compute"><span style={css('x')}>Q(X)</span><b>×</b><span style={css('w')}>Q(W)ᵀ</span><small>quantized operands · recipe accumulator</small></div>
      <Arrow /><div className="fp8-mini-tensor" style={css('y')}><strong>Y</strong><span>wider scores</span><i /><i /><i /><i /></div></div>
    <div className="fp8-wider-route"><span>normalization / nonlinear operations</span><Arrow /><span>stable loss reduction</span><Arrow text="G ⇠ backward" backward /></div>
    <div className="fp8-gradient-lane"><div className="fp8-wire"><span style={css('g')}>Q(G)</span><b>×</b><span style={css('w')}>Q(W)</span><b>⇢</b><span style={css('g')}>dX</span></div>
      <div className="fp8-wire"><span style={css('g')}>Q(G)ᵀ</span><b>×</b><span style={css('x')}>Q(X)</span><b>⇢</b><span style={css('g')}>dW</span></div></div>
    <div className="fp8-state-bank"><div style={css('w')}><strong>master W</strong><div className="fp8-byte-strip">{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</div><span>FP32 update destination</span></div>
      <div style={css('g')}><strong>gradient / optimizer state</strong><span>wider state · exact dtype belongs to recipe</span></div></div>
    <p>Rounded GEMM operands do not imply an eight-bit loss, normalization, master weight or optimizer state.</p>
  </Figure>;
}
export function CostLab() {
  const [fraction, setFraction] = useState(.8), [ratio, setRatio] = useState(2), [overhead, setOverhead] = useState(.05), result = cost(fraction, ratio, overhead);
  const maximum = Math.max(1, result.time), rows = [
    ['Original', [[fraction, 'matrix products', 'x'], [1 - fraction, 'other work', 'ref']]],
    ['After change', [[fraction / ratio, 'matrix products', 'x'], [1 - fraction, 'other work', 'ref'], [overhead, 'new overhead', 'g']]],
  ];
  return <Figure name="cost" label="Step speedup depends on unaffected work and new overhead">
    <div className="fp8-time-bars">{rows.map(([label, segments]) => <div key={label}><strong>{label}</strong><div className="fp8-time-track">{segments.map(([length, name, role]) => <div key={name} style={{ width: (100 * length / maximum) + '%', background: C[role] }} title={name + ': ' + n(length) + ' of original step'} />)}</div><span>{n(segments.reduce((a, s) => a + s[0], 0), 3)} original-step units</span></div>)}</div>
    <Legend items={[[('matrix products: ' + n(fraction / ratio) + ' after'), 'x'], ['unchanged: ' + n(1 - fraction), 'ref'], ['added: ' + n(overhead), 'g']]} />
    <FlowControls><FlowSlider name="Original matmul fraction f" value={fraction} onChange={setFraction} min={0} max={1} step={.05} />
      <FlowSlider name="Kernel speedup r" value={ratio} onChange={setRatio} min={1} max={4} step={.25} />
      <FlowSlider name="Added cost h" value={overhead} onChange={setOverhead} min={0} max={.5} step={.025} /></FlowControls>
    <FlowReadout>Time ratio = {n(1 - fraction)} + {n(fraction)}/{n(ratio)} + {n(overhead)} = <strong>{n(result.time, 4)}</strong>. Step speedup {n(result.speedup, 4)}×. {result.speedup < 1 ? 'Added work makes the whole step slower.' : result.speedup === 1 ? 'No net speed change.' : 'Only the selected portion accelerates.'} Assumed arithmetic, not measured hardware.</FlowReadout>
    <div className="fp8-memory-inventory"><span style={css('x')}>FP8 values</span><b>+</b><span style={css('s')}>scales</span><b>+</b><span style={css('w')}>master weights</span><b>+</b><span style={css('g')}>gradients &amp; moments</span><b>+</b><span>activations &amp; copies</span></div>
  </Figure>;
}
