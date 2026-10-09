import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { useState } from 'react';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { FlowChoice, FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber } from './LessonFlow.jsx';
import { activationMoments, directionalGeometry, initializationSchemes, symmetryState, widthConfiguration } from '../../data/weight-initialization-models.js';
import records from '../../data/weight-initialization-measurements.json';
import { SymmetryNetworkDiagram, sci } from './InitializationBuildupFigures.jsx';
import './weight-initialization.css';

// Plot series colours are categorical and labelled on the curve (visual vocabulary, "plots").
const seriesColor = ['#e8c36f', '#9fc3ea'];
const seedOptions = [1, 2, 3].map(value => [value, `seed ${value}`]);
const number = (value, digits = 4) => flowNumber(value, digits);
const superscripts = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const power = exponent => '10' + String(exponent).split('').map(character => superscripts[character]).join('');
export const initializationAsset = '/learn-assets/weight-initialization-xavier-kaiming-p/';

export function InitializationProgram({ file = 'initialization-experiments.py', title = 'Read the complete CPU experiment' }) {
  return <>
    <RemoteCodeBlock source={initializationAsset + file} language="python" filename={file} title={(title)} />
    <p><a href={initializationAsset + file} download={file}>Download {file}</a></p>
  </>;
}

// A small line chart. Each series is labelled at its last point; axis titles are drawn on the chart.
function Plot({ series, logarithmic = false, xLabel, yLabel, xDomain, xTicks }) {
  const positive = series.flatMap(line => line.values.map(([, value]) => value)).filter(value => !logarithmic || value > 0);
  const hasZero = logarithmic && series.some(line => line.values.some(([, value]) => value === 0));
  const allX = series.flatMap(line => line.values.map(([value]) => value));
  const [xmin, xmax] = xDomain || [Math.min(...allX), Math.max(...allX)];
  let [ymin, ymax] = logarithmic ? [Math.floor(Math.log10(Math.min(...positive))), Math.ceil(Math.log10(Math.max(...positive)))] : [0, Math.max(...positive) * 1.1];
  if (ymax === ymin) { ymin -= 1; ymax += 1; }
  const left = 70, right = 300, top = 20, bottom = hasZero ? 180 : 196;
  const x = value => left + (value - xmin) / (xmax - xmin || 1) * (right - left);
  const y = value => value === 0 && logarithmic ? 206 : bottom - ((logarithmic ? Math.log10(value) : value) - ymin) / (ymax - ymin) * (bottom - top);
  const middle = logarithmic ? Math.round((ymin + ymax) / 2) : (ymin + ymax) / 2;
  const ticks = [...new Set([ymin, middle, ymax])];
  const labelY = series.map(line => { const last = line.values.at(-1); return y(last[1]); });
  if (labelY.length === 2 && Math.abs(labelY[0] - labelY[1]) < 14) { const shift = (14 - Math.abs(labelY[0] - labelY[1])) / 2; if (labelY[0] <= labelY[1]) { labelY[0] -= shift; labelY[1] += shift; } else { labelY[0] += shift; labelY[1] -= shift; } }
  return <svg className="init-chart" viewBox="0 0 400 250" role="img" aria-label={`${yLabel} against ${xLabel}${logarithmic ? ', logarithmic vertical scale' : ''}. ${series.map(line => `${line.name}: from ${sci(line.values[0][1])} to ${sci(line.values.at(-1)[1])}`).join('; ')}.`}>
    <line className="init-axis" x1={left} x2={left} y1={top} y2={bottom} /><line className="init-axis" x1={left} x2={right} y1={bottom} y2={bottom} />
    {ticks.map(tick => <text key={tick} className="init-axis-label" x={left - 6} y={bottom - (tick - ymin) / (ymax - ymin) * (bottom - top) + 4} textAnchor="end">{logarithmic ? power(tick) : number(tick, 2)}</text>)}
    {(xTicks || [xmin, xmax]).map(tick => <text key={tick} className="init-axis-label" x={x(tick)} y={bottom + 16} textAnchor="middle">{tick}</text>)}
    {hasZero && <><line x1={left} x2={right} y1="206" y2="206" className="init-axis init-axis--zero" /><text className="init-axis-label" x={left - 6} y="210" textAnchor="end">zero</text></>}
    <text className="init-axis-title" x={(left + right) / 2} y="240" textAnchor="middle">{xLabel}</text>
    <text className="init-axis-title" x="14" y={(top + bottom) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(top + bottom) / 2})`}>{yLabel}</text>
    {series.map((line, index) => <g key={line.name}>
      {line.values.map(([a, b], i) => { const next = line.values[i + 1]; return next && !(logarithmic && ((b === 0) !== (next[1] === 0))) ? <line key={i} x1={x(a)} y1={y(b)} x2={x(next[0])} y2={y(next[1])} stroke={seriesColor[index]} strokeWidth="2.2" strokeDasharray={index ? '5 4' : undefined} /> : null; })}
      {line.values.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r="2.8" fill={seriesColor[index]} />)}
      <text className="init-series-label" x={x(line.values.at(-1)[0]) + 6} y={labelY[index] + 4} fill={seriesColor[index]}>{line.name}</text>
    </g>)}
  </svg>;
}

const shortName = { zero: 'all zero', small: 'std 0.01', xavier: 'Xavier', kaiming: 'Kaiming', orthogonal: 'orthogonal', large: 'std 0.5' };

export function InitializationSignalLab() {
  const [scheme, setScheme] = useState('small'), [seed, setSeed] = useState(1);
  const current = records.propagation.find(row => row.seed === seed && row.scheme === scheme), baseline = records.propagation.find(row => row.seed === seed && row.scheme === 'kaiming');
  const ratio = current.layers.at(-1).q / current.layers[0].q;
  const series = key => [{ name: shortName[scheme], values: current.layers.map(row => [row.layer, row[key]]) }].concat(scheme === 'kaiming' ? [] : [{ name: 'Kaiming', values: baseline.layers.map(row => [row.layer, row[key]]) }]);
  return <FlowLab id="initialization-signal" label="Follow a signal forward and its gradient backward through twenty layers">
    <div className="flow-columns-2">
      <Plot logarithmic xLabel="layer" yLabel="forward: mean(h²)" xDomain={[0, 20]} xTicks={[0, 10, 20]} series={series('q')} />
      <Plot logarithmic xLabel="layer" yLabel="backward: gradient RMS" xDomain={[0, 20]} xTicks={[0, 10, 20]} series={series('g')} />
    </div>
    <FlowControls>
      <FlowChoice label="Initialization" value={scheme} onChange={setScheme} options={initializationSchemes.map(([key, name]) => [key, key === 'zero' ? 'All-zero weights' : name.replace(' · ', ' ')])} />
      <FlowChoice label="Seed" value={seed} onChange={setSeed} options={seedOptions} />
    </FlowControls>
    <FlowReadout>Layer 20 mean square ÷ input mean square = <strong>{sci(ratio)}</strong> (Kaiming, same seed: {sci(baseline.layers.at(-1).q / baseline.layers[0].q)}). The gradient RMS that reaches the input is <strong>{sci(current.layers[0].g)}</strong>; it started at the output as {number(records.cotangentRms, 3)}.</FlowReadout>
    <p className="flow-note">Recorded float64 runs from the lesson's program, read from saved files; nothing is trained in your browser. The dashed line is Kaiming with the same seed.</p>
  </FlowLab>;
}

const valueSets = { symmetric: [-2, -1, 1, 2], shifted: [-1, 0, 2, 3] };
export function InitializationMomentsLab() {
  const [set, setSet] = useState('symmetric'), [activation, setActivation] = useState('relu'), [origin, setOrigin] = useState('zero');
  const result = activationMoments(valueSets[set], activation);
  const rows = [['before the activation', result.before], [activation === 'relu' ? 'after ReLU' : 'after no activation', result.after]];
  const distance = (row, value) => (value - (origin === 'mean' ? row.mean : 0)) ** 2;
  const maximum = Math.max(1, ...rows.flatMap(([, row]) => row.values.map(value => distance(row, value))));
  const x = value => 30 + (value + 4) * 36;
  return <FlowLab id="initialization-moments" label="Four values: distance from zero versus distance from the mean">
    <div className="flow-columns-2">{rows.map(([label, row]) => <div key={label} className="init-moments">
      <svg viewBox="0 0 320 176" role="img" aria-label={`Values ${label}: ${row.values.map(v => number(v, 2)).join(', ')}. Mean ${number(row.mean, 3)}.`}>
        <text className="init-layer__heading" x="10" y="16">{label}</text>
        <line className="init-axis" x1="30" x2="318" y1="70" y2="70" />
        {[-4, -2, 0, 2, 4].map(t => <g key={t}><line className="init-axis" x1={x(t)} x2={x(t)} y1="66" y2="74" /><text className="init-axis-label" x={x(t)} y="88" textAnchor={t === 4 ? "end" : t === -4 ? "start" : "middle"}>{flowNumber(t, 0)}</text></g>)}
        <line className="init-moments__zero" x1={x(0)} x2={x(0)} y1="28" y2="74" />
        <line className="init-moments__mean" x1={x(row.mean)} x2={x(row.mean)} y1="28" y2="74" /><text className="init-moments__mean-label" x={x(row.mean)} y="104" textAnchor="middle">mean {number(row.mean, 2)}</text>
        {row.values.map((value, i) => <g key={i}><circle className="init-moments__point" cx={x(value)} cy={28 + i * 11} r="5" /><text className="init-moments__point-label" x={x(value) + 9} y={32 + i * 11}>{'ABCD'[i]}</text></g>)}
        {row.values.map((value, i) => { const d = distance(row, value); return <g key={`d${i}`}><rect className="init-moments__bar" x={30 + i * 72} y={170 - d / maximum * 34} width="56" height={d / maximum * 34} /><text className="init-axis-label" x={58 + i * 72} y={166 - d / maximum * 34} textAnchor="middle">{'ABCD'[i]}: {number(d, 2)}</text></g>; })}
      </svg>
      <p className="init-moments__stats">mean <strong>{number(row.mean, 4)}</strong> · mean square <strong>{number(row.secondMoment, 4)}</strong> · variance <strong>{number(row.variance, 4)}</strong></p>
    </div>)}</div>
    <FlowControls>
      <FlowChoice label="Values" value={set} onChange={setSet} options={[['symmetric', '−2, −1, 1, 2'], ['shifted', '−1, 0, 2, 3']]} />
      <FlowChoice label="Activation" value={activation} onChange={setActivation} options={[['relu', 'ReLU'], ['identity', 'none']]} />
      <FlowChoice label="Bars show squared distance from" value={origin} onChange={setOrigin} options={[['zero', 'zero'], ['mean', 'the mean']]} />
    </FlowControls>
    <FlowReadout>Mean square: {number(result.before.secondMoment, 4)} → <strong>{number(result.after.secondMoment, 4)}</strong>{result.before.secondMoment ? ` (× ${number(result.after.secondMoment / result.before.secondMoment, 4)})` : ''}. Variance: {number(result.before.variance, 4)} → <strong>{number(result.after.variance, 4)}</strong>. {activation === 'identity' ? 'With no activation nothing changes.' : set === 'symmetric' ? 'The values are symmetric about zero, so ReLU keeps exactly half the mean square; the variance does not halve because the mean moved.' : 'These values are not symmetric about zero, so ReLU removes less than half the mean square.'}</FlowReadout>
  </FlowLab>;
}

const directions = { horizontal: [1, 0], vertical: [0, 1], diagonal: [Math.SQRT1_2, Math.SQRT1_2] };
export function InitializationGeometryLab() {
  const [smallerSquared, setSmallerSquared] = useState(0.1), [depth, setDepth] = useState(1), [direction, setDirection] = useState('vertical');
  const smaller = Math.sqrt(smallerSquared), vector = directions[direction];
  const geometry = directionalGeometry(smaller, vector, depth);
  const radius = Math.max(1.2, ...geometry.gains) * 1.15, scale = 110 / radius;
  const cx = 170, cy = 135, x = value => cx + scale * value, y = value => cy - scale * value;
  const ellipse = Array.from({ length: 129 }, (_, i) => { const angle = i * Math.PI / 64; return `${x(geometry.gains[0] * Math.cos(angle))},${y(geometry.gains[1] * Math.sin(angle))}`; }).join(' ');
  return <FlowLab id="initialization-geometry" label="Repeat a matrix with one weak direction">
    <svg className="init-geometry" viewBox="0 0 340 285" role="img" aria-label={`Unit circle and the ellipse after ${depth} repetitions: horizontal gain ${number(geometry.gains[0])}, vertical gain ${number(geometry.gains[1])}. The ${direction} input of length 1 becomes length ${number(geometry.normGain)}.`}>
      <line className="init-axis" x1="20" x2="320" y1={cy} y2={cy} /><line className="init-axis" x1={cx} x2={cx} y1="15" y2="255" />
      <circle className="init-ellipse--input" cx={cx} cy={cy} r={scale} />
      <polyline className="init-ellipse--output" points={ellipse} />
      <line className="init-geometry__in" x1={cx} y1={cy} x2={x(vector[0])} y2={y(vector[1])} /><circle className="init-geometry__in-dot" cx={x(vector[0])} cy={y(vector[1])} r="4" />
      <line className="init-geometry__out" x1={cx} y1={cy} x2={x(geometry.output[0])} y2={y(geometry.output[1])} /><circle className="init-geometry__out-dot" cx={x(geometry.output[0])} cy={y(geometry.output[1])} r="4" />
      <text className="init-geometry__in-label" x={x(vector[0]) + 6} y={y(vector[1]) - 6}>input</text>
      <text className="init-geometry__out-label" x={x(geometry.output[0]) + 6} y={y(geometry.output[1]) + 14}>after M{depth > 1 ? <tspan baseline-shift="super" fontSize="9">{depth}</tspan> : null}</text>
      <text className="init-axis-label" x="170" y="280" textAnchor="middle">same scale on both axes; circle radius 1</text>
    </svg>
    <FlowControls>
      <FlowSlider name="Weaker gain squared" value={smallerSquared} onChange={setSmallerSquared} min={0.0025} max={1} step={0.0025} format={value => number(value, 4)} />
      <FlowSlider name="Repeated layers" value={depth} onChange={setDepth} min={1} max={8} step={1} format={value => String(value)} />
      <FlowChoice label="Follow input direction" value={direction} onChange={setDirection} options={[['horizontal', 'horizontal'], ['vertical', 'vertical'], ['diagonal', 'diagonal']]} />
    </FlowControls>
    <FlowReadout>One layer stretches horizontally by <strong>{number(geometry.larger)}</strong> and vertically by <strong>{number(smaller)}</strong>; the average squared gain stays <strong>{number(geometry.averageSquaredGain)}</strong>. After {depth} {depth === 1 ? 'layer' : 'layers'} the {direction} input of length 1 has length <strong>{number(geometry.normGain)}</strong>.</FlowReadout>
    <p className="flow-note">The same diagonal matrix repeated, not a random network. Dashed white: the input circle and vector; violet: their images after the map. The view rescales as gains grow; both axes keep one scale.</p>
  </FlowLab>;
}

export function InitializationSpectrumFigure() {
  const values = records.fixtures.gaussian_singular_values, bins = Array.from({ length: 10 }, () => 0);
  values.forEach(value => { bins[Math.min(9, Math.floor(value / 0.2))]++; });
  const top = Math.max(...bins);
  return <figure className="init-spectrum" id="gaussian-spectrum">
    <svg viewBox="0 -24 380 224" role="img" aria-label={`Histogram of the 64 singular values of one saved 64 by 64 Gaussian draw, ten bins from 0 to 2. Counts ${bins.join(', ')}. Minimum ${number(Math.min(...values))}, maximum ${number(Math.max(...values))}. An orthogonal matrix with gain √2 would put all 64 at 1.414.`}>
      {bins.map((count, k) => <rect key={k} className="init-many__bar" x={40 + k * 30 + 1} width="28" y={150 - count / top * 120} height={count / top * 120} />)}
      {bins.map((count, k) => <text key={`c${k}`} className="init-axis-label" x={55 + k * 30} y={146 - count / top * 120} textAnchor="middle">{count}</text>)}
      <line className="init-axis" x1="40" x2="340" y1="150" y2="150" />
      {[0, 0.5, 1, 1.5, 2].map(t => <text key={t} className="init-axis-label" x={40 + t * 150} y="166" textAnchor="middle">{t}</text>)}
      <line className="init-spectrum__orthogonal" x1={40 + Math.SQRT2 * 150} x2={40 + Math.SQRT2 * 150} y1="-14" y2="150" />
      <text className="init-spectrum__orthogonal-label" x={40 + Math.SQRT2 * 150 - 6} y="-4" textAnchor="end">orthogonal × √2: all 64 values here</text>
      <text className="init-axis-title" x="190" y="190" textAnchor="middle">singular value (one directional gain)</text>
    </svg>
  </figure>;
}

const symmetryCases = { identical: { weights: [0.2, 0.2], outgoing: [0.3, 0.3] }, distinct: { weights: [0.1, 0.3], outgoing: [0.3, 0.3] }, zeroHead: { weights: [0.1, 0.3], outgoing: [0, 0] } };
export function InitializationSymmetryLab() {
  const [start, setStart] = useState('identical'), [state, setState] = useState(symmetryCases.identical), [steps, setSteps] = useState(0);
  const result = symmetryState(state.weights, state.outgoing), rate = 0.1;
  const choose = key => { setStart(key); setState(symmetryCases[key]); setSteps(0); };
  const step = () => { setState({ weights: state.weights.map((value, i) => value - rate * result.hiddenGradient[i]), outgoing: state.outgoing.map((value, i) => value - rate * result.headGradient[i]) }); setSteps(value => value + 1); };
  return <FlowLab id="initialization-symmetry" label="Which parameter can learn on the first step?">
    <SymmetryNetworkDiagram weights={state.weights} outgoing={state.outgoing} features={result.features} output={result.output} hiddenGradient={result.hiddenGradient} headGradient={result.headGradient} />
    <FlowControls>
      <FlowChoice label="Start from" value={start} onChange={choose} options={[['identical', 'identical units'], ['distinct', 'distinct units'], ['zeroHead', 'distinct, zero head']]} />
      <button type="button" disabled={steps >= 30} onClick={step}>Apply one gradient step</button>
      <button type="button" onClick={() => choose(start)}>Start over</button>
    </FlowControls>
    <FlowReadout>After {steps} {steps === 1 ? 'step' : 'steps'} (rate {rate}): incoming-weight gradients <strong>{number(result.hiddenGradient[0], 5)}</strong> and <strong>{number(result.hiddenGradient[1], 5)}</strong>; outgoing-weight gradients <strong>{number(result.headGradient[0], 5)}</strong> and <strong>{number(result.headGradient[1], 5)}</strong>. Loss {number(result.loss, 5)}.{steps >= 30 ? ' This trace stops at 30 steps; start over to continue.' : ''}</FlowReadout>
  </FlowLab>;
}

export function InitializationTrainingLab() {
  const [scheme, setScheme] = useState('small'), [seed, setSeed] = useState(1);
  const current = records.digitFits.find(row => row.scheme === scheme && row.seed === seed);
  const last = current.trace.at(-1);
  return <FlowLab id="initialization-training" label="Training and validation cross-entropy for one recorded digit fit">
    <Plot logarithmic xLabel="full-batch updates" yLabel="cross-entropy" xDomain={[0, 300]} xTicks={[0, 100, 200, 300]} series={['train', 'validation'].map(key => ({ name: key === 'train' ? 'training' : 'validation', values: current.trace.map(row => [row.step, row[key].ce]) }))} />
    <FlowControls>
      <FlowChoice label="Hidden initialization" value={scheme} onChange={setScheme} options={initializationSchemes.map(([key, name]) => [key, name.replace(' · ', ' ')])} />
      <FlowChoice label="Seed" value={seed} onChange={setSeed} options={seedOptions} />
    </FlowControls>
    <FlowReadout>After 300 updates: training CE <strong>{number(last.train.ce, 6)}</strong>, validation CE <strong>{number(last.validation.ce, 6)}</strong>, validation correct <strong>{last.validation.correct}/120</strong>.</FlowReadout>
    <p className="flow-note">Markers are recorded checkpoints at updates {current.trace.map(row => row.step).join(', ')}; the path between them was not recorded. Validation is development evidence, not a final test.</p>
  </FlowLab>;
}

export function WidthRecipeLab() {
  const [width, setWidth] = useState(128), [mode, setMode] = useState('mu');
  const rate = 0.003, config = widthConfiguration(width, rate, mode);
  return <FlowLab id="initialization-width" label="Width changes the forward path and the update together">
    <ol className="init-recipe" aria-label="The three matrices at the chosen width">
      <li><strong>input matrix {width} × 64 → ReLU</strong><span>std {number(config.inputStd)} · Adam rate {number(config.inputRate)}</span></li>
      <li><strong>hidden matrix {width} × {width} → ReLU</strong><span>std {number(config.hiddenStd)} · Adam rate {number(config.hiddenRate, 6)}</span></li>
      <li><strong>readout: input × {number(config.readoutMultiplier)} → raw matrix 10 × {width}</strong><span>raw std {number(config.readoutStd)} · Adam rate {number(config.readoutRate)}</span></li>
    </ol>
    <FlowControls>
      <FlowSlider name="Hidden width n" value={width} onChange={setWidth} min={32} max={512} step={1} format={value => String(value)} />
      <FlowChoice label="Parametrization" value={mode} onChange={setMode} options={[['standard', 'standard'], ['mu', 'μP']]} />
    </FlowControls>
    <FlowReadout>m = {width}/32 = <strong>{number(config.multiplier)}</strong>. {width === 32 ? 'At the base width both parametrizations are the same training procedure.' : mode === 'mu' ? <>The hidden rate is η/m = <strong>{number(config.hiddenRate, 6)}</strong> and the readout divides its input by m. Leaving out that division would multiply the same raw readout's output by {number(config.multiplier)}.</> : 'Standard training uses the same rate in every group and no forward division.'}</FlowReadout>
    <p className="flow-note">Exact arithmetic for the restricted bias-free model with base Adam rate 0.003; it calculates a recipe and runs no training.</p>
  </FlowLab>;
}

const tensorNames = ['first preactivation', 'first ReLU', 'second preactivation', 'second ReLU', 'output logits'];
export function CoordinateCheckLab() {
  const [step, setStep] = useState(150), [tensor, setTensor] = useState(4);
  const series = ['standard', 'mu'].map(mode => ({ name: mode === 'mu' ? 'μP' : 'standard', values: records.widthFits.filter(row => row.mode === mode && row.seed === 1 && row.rate === 0.01).sort((a, b) => a.width - b.width).map(row => [row.width, row.trace.find(value => value.step === step).coordinate_mean_abs[tensor]]) }));
  return <FlowLab id="coordinate-check" label="Coordinate check: one tensor's typical size at three widths">
    <Plot xLabel="hidden width" yLabel={`mean |${tensorNames[tensor]}|`} xDomain={[32, 128]} xTicks={[32, 64, 128]} series={series} />
    <FlowControls>
      <FlowChoice label="After update" value={step} onChange={setStep} options={[0, 1, 2, 5, 150].map(value => [value, String(value)])} />
      <FlowChoice label="Tensor" value={tensor} onChange={setTensor} options={tensorNames.map((name, i) => [i, name])} />
    </FlowControls>
    <FlowReadout>Mean |{tensorNames[tensor]}| at widths 32, 64, 128 after {step} {step === 1 ? 'update' : 'updates'}: μP {series[1].values.map(([, v]) => number(v, 3)).join(', ')}; standard {series[0].values.map(([, v]) => number(v, 3)).join(', ')}.</FlowReadout>
    <p className="flow-note">Recorded seed-1 runs at base rate 0.01 on the same 32 training rows; only widths 32, 64 and 128 were trained.</p>
  </FlowLab>;
}

export function TruncationFigure() {
  return <figure className="init-truncation" id="truncated-normal">
    <svg viewBox="0 0 340 178" role="img" aria-label="A normal curve with the interval from minus two to plus two standard deviations shaded and labelled kept. The tails outside are dashed and labelled redrawn, not moved to the edge.">
      <rect x="100" width="140" y="18" height="100" className="init-truncation__kept" />
      <path d="M30 115 C68 115 81 107 102 93 C126 75 142 23 170 20 C198 23 214 75 238 93 C259 107 272 115 310 115" className="init-truncation__curve" />
      <line className="init-axis" x1="30" x2="310" y1="118" y2="118" />
      {[[-2, 100], [0, 170], [2, 240]].map(([value, position]) => <text key={value} className="init-axis-label" x={position} y="134" textAnchor="middle">{flowNumber(value, 0)}σ</text>)}
      <text className="init-truncation__label" x="170" y="152" textAnchor="middle">kept: draws inside ±2σ</text>
      <text className="init-axis-label" x="30" y="172">left tail: redrawn</text><text className="init-axis-label" x="310" y="172" textAnchor="end">right tail: redrawn</text>
    </svg>
  </figure>;
}

export function TruncationTable() {
  return <NeuralTable caption="Actual 100,000-value samples; requested std 0.02" headers={['Absolute bounds', 'Measured std', 'Largest absolute sample']} rows={Object.values(records.fixtures.truncation).map(row => [row.bounds.map(b => flowNumber(b, 4)).join(' to '), number(row.std, 8), number(row.max_abs, 8)])} />;
}

export function PrecisionTable() {
  const precision = records.fixtures.precision;
  return <NeuralTable caption="Actual precision conversion, back to float32 for display" headers={['Original float32', 'BF16 → float32', 'Float16 → float32']} rows={precision.float32.map((value, i) => [value.toExponential(7), precision.bfloat16_back_to_float32[i].toExponential(7), precision.float16_back_to_float32[i].toExponential(7)])} />;
}
