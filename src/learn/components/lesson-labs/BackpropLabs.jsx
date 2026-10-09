import { useId, useState } from 'react';
import { finiteDifference, fitDefaults, lineFit, sharedSquare } from '../../data/backprop-models.js';
import { numberText as f } from './BackpropShared.jsx';
import { FlowChoice, FlowControls, FlowLab, FlowReadout, FlowSlider } from './LessonFlow.jsx';

// Investigation A: the gradient is fixed by the current line; only the step length changes.
export function BackpropFitLab() {
  const [rate, setRate] = useState(fitDefaults.rate);
  const inputs = { ...fitDefaults, rate };
  const model = lineFit(inputs);
  const domainValues = [0, ...model.rows.flatMap(row => [row.target, row.prediction, row.nextPrediction])];
  const low = Math.min(...domainValues) - 1;
  const high = Math.max(...domainValues) + 1;
  const px = x => 60 + (x - 0.75) * 170;
  const py = y => 228 - (y - low) / (high - low) * 200;
  // "after one step" stays at the end of its own dashed line. Each residual label sits right of
  // its segment, at whichever of the segment's top, middle or bottom is furthest from that label.
  const afterLabelY = py(model.rows[1].nextPrediction) + 4;
  const residualLabelY = row => {
    const top = Math.min(py(row.target), py(row.prediction)), bottom = Math.max(py(row.target), py(row.prediction));
    return [top + 10, (top + bottom) / 2 + 4, bottom - 2].reduce((best, y) => Math.abs(y - afterLabelY) > Math.abs(best - afterLabelY) ? y : best);
  };
  const verdict = rate === 0
    ? 'a zero step leaves the line where it is'
    : model.change === 'increased' ? 'this step overshoots: the loss rises even though the direction came from a correct derivative'
      : model.change === 'decreased' ? 'this step lowers the loss' : 'the loss is unchanged';
  return <FlowLab id="investigation-a" label="Investigation A: one gradient-descent step on a two-point line fit">
    <svg className="backprop-svg backprop-fit-svg" viewBox="0 0 400 278" role="img" aria-label={`Targets at x = 1 and 2, the current line and the line after one step with learning rate ${rate}`} data-fit-result data-rate={rate} data-old-loss={model.loss} data-new-loss={model.nextLoss}>
      <line x1="60" x2="320" y1="228" y2="228" className="bp-axis" />
      <line x1="60" x2="60" y1="28" y2="228" className="bp-axis" />
      {[low, (low + high) / 2, high].map(value => <g key={value}><line x1="60" x2="320" y1={py(value)} y2={py(value)} className="bp-grid" /><text x="54" y={py(value) + 4} textAnchor="end">{f(Number(value.toPrecision(3)))}</text></g>)}
      <text x="60" y="16">target or prediction q</text>
      <line x1={px(1)} y1={py(model.rows[0].prediction)} x2={px(2)} y2={py(model.rows[1].prediction)} className="bp-current" />
      <text x={px(1) + 12} y={py(model.rows[0].prediction) + 20} className="bp-label-current">current line</text>
      <line x1={px(1)} y1={py(model.rows[0].nextPrediction)} x2={px(2)} y2={py(model.rows[1].nextPrediction)} className="bp-proposed" />
      <text x={px(2) + 10} y={afterLabelY}>after one step</text>
      {model.rows.map(row => <g key={row.x}><line x1={px(row.x)} x2={px(row.x)} y1={py(row.target)} y2={py(row.prediction)} className="bp-residual" /><circle cx={px(row.x)} cy={py(row.target)} r="5" className="bp-target" /><text x={px(row.x)} y="250" textAnchor="middle">x = {row.x}</text>{row.residual !== 0 && <text x={px(row.x) + 8} y={residualLabelY(row)} className="bp-label-residual">r = {f(row.residual)}</text>}</g>)}
      <text x={px(2) - 10} y={py(model.rows[1].target) + 4} textAnchor="end" className="bp-label-target">target</text>
    </svg>
    <FlowControls><FlowSlider name="Learning rate η" value={rate} min={0} max={1} step={0.05} onChange={setRate} format={value => f(Number(value.toFixed(2)))} /></FlowControls>
    <FlowReadout>Gradients at the current line: g<sub>w</sub> = {model.rows.map(row => `(${f(row.residual)})(${row.x})`).join(' + ')} = <strong>{f(model.weightGradient)}</strong> and g<sub>b</sub> = <strong>{f(model.biasGradient)}</strong>. The step moves w to {f(model.nextWeight)} and b to {f(model.nextBias)}, and the mean squared error goes from <strong>{f(model.loss)}</strong> to <strong>{f(model.nextLoss)}</strong>: {verdict}.</FlowReadout>
  </FlowLab>;
}

// Shared reuse in u = x × x, L = u + c·u, read left to right. Values are circles (cyan x
// supplied, violet computed u and L); operations are white rounded rectangles. Orange
// numbers are backward contributions and travel against the grey arrows.
function SharedGraphDiagram({ x, c }) {
  const uid = `backprop-shared-${useId().replace(/:/g, '')}`;
  const model = sharedSquare(x, c);
  const op = (cx, cy, text, w = 46) => <g className="bpc-operation"><rect x={cx - w / 2} y={cy - 21} width={w} height="42" rx="10" /><text x={cx} y={cy + 6} className="bps-op-text">{text}</text></g>;
  const value = (cx, cy, text, role) => <g className={`bpc-node bpc-${role}`}><circle cx={cx} cy={cy} r="24" /><text x={cx} y={cy + 6} className="bps-value-text">{text}</text></g>;
  return <svg className="backprop-svg bpc-diagram bps-diagram" viewBox="0 0 480 244" role="img" aria-labelledby={`${uid}-d`}>
    <desc id={`${uid}-d`}>{`x = ${f(x)} feeds both slots of a multiplication that gives u = ${f(model.square)}. u feeds the addition directly and through a multiply-by-c operation with c = ${f(c)}; the addition gives L = ${f(model.loss)}. Backward: L receives 1; u receives 1 from the direct route and ${f(c)} from the scaled route, total ${f(model.uGradient)}; each multiplication slot passes ${f(model.slotContribution)} to x, total ${f(model.gradient)}.`}</desc>
    <defs><marker id={`${uid}-f`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10z" className="bpc-forward-head" /></marker><marker id={`${uid}-b`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10z" className="bpc-back-head" /></marker></defs>
    <g className="bpc-wire" markerEnd={`url(#${uid}-f)`}>
      <path d="M70 114 L106 114" /><path d="M70 136 L106 136" /><path d="M154 125 L182 125" />
      <path d="M230 114 L314 76" /><path d="M230 138 L280 172" /><path d="M318 160 L336 94" /><path d="M364 68 L406 68" />
    </g>
    <g className="bpc-reverse" markerEnd={`url(#${uid}-b)`}>
      <path d="M406 80 L368 80" /><path d="M317 82 L235 119" /><path d="M343 96 L326 158" /><path d="M284 166 L238 134" />
      <path d="M181 135 L158 135" /><path d="M105 106 L75 106" /><path d="M105 144 L75 144" />
    </g>
    {value(48, 125, f(x), 'supplied')}
    {op(130, 125, '×')}
    {value(206, 125, f(model.square), 'computed')}
    {op(340, 68, '+')}
    {op(302, 190, `× ${f(c)}`, 56)}
    {value(432, 68, f(model.loss), 'computed')}
    <text x="48" y="92" className="bps-name">x</text>
    <text x="206" y="168" className="bps-name">u = x × x</text>
    <text x="476" y="112" className="bps-name bps-end">L = u + c·u</text>
    <text x="88" y="96" className="bps-slot"><tspan className="bps-name">slot 1 </tspan><tspan className="bps-sens">{f(model.slotContribution)}</tspan></text>
    <text x="88" y="162" className="bps-slot"><tspan className="bps-name">slot 2 </tspan><tspan className="bps-sens">{f(model.slotContribution)}</tspan></text>
    <text x="262" y="82" className="bps-sens">1</text>
    <text x="262" y="146" className="bps-sens">{f(c)}</text>
    <text x="358" y="134" className="bps-sens">1</text>
    <text x="432" y="30" className="bps-sens">∂L/∂L = 1</text>
    <text x="190" y="194" className="bps-sens">∂L/∂u = 1 + {f(c)} = {f(model.uGradient)}</text>
    <text x="6" y="230" className="bps-sens bps-start">∂L/∂x = {f(model.slotContribution)} + {f(model.slotContribution)} = {f(model.gradient)}</text>
  </svg>;
}

// Investigation B: change the shared input and the reused branch's coefficient.
export function BackpropSharedLab() {
  const [point, setPoint] = useState(3);
  const [coefficient, setCoefficient] = useState(2);
  const model = sharedSquare(point, coefficient);
  const note = coefficient === -1
    ? 'The two routes cancel for every x: L = 0 and its derivative is 0.'
    : point === 0 ? 'At x = 0 each multiplication slot contributes 0 whatever c is, so the derivative is 0 although u still has two consumers.'
      : coefficient < -1 ? 'With c below −1 the scaled route outweighs the direct one, so the derivative takes the opposite sign to 2x.'
        : 'Multiply along each route, then add across routes and across the two multiplication slots: 2x(1 + c).';
  return <FlowLab id="investigation-b" label="Investigation B: shared input and reused branch">
    <SharedGraphDiagram x={point} c={coefficient} />
    <FlowControls>
      <FlowSlider name="Shared input x" value={point} min={-3} max={3} step={0.25} onChange={setPoint} format={f} />
      <FlowSlider name="Branch coefficient c" value={coefficient} min={-3} max={3} step={0.25} onChange={setCoefficient} format={f} />
    </FlowControls>
    <FlowReadout><span data-shared-result data-x={point} data-coefficient={coefficient} data-loss={model.loss} data-gradient={model.gradient}>L = <strong>{f(model.loss)}</strong> and dL/dx = <strong>{f(model.gradient)}</strong>: the direct route contributes 2x = {f(model.firstPath)} and the scaled route 2cx = {f(model.secondPath)}. {note}</span></FlowReadout>
  </FlowLab>;
}

function LocalFunction({ result }) {
  const { point, step, kind, offset } = result;
  const fn = kind === 'linear' ? x => offset + x : kind === 'square' ? x => x * x : Math.sin;
  const samples = Array.from({ length: 41 }, (_, i) => {
    const x = point + (i / 40 * 2 - 1) * step;
    return { x, y: fn(x) };
  });
  const minX = samples[0].x;
  const maxX = samples.at(-1).x;
  const minY = Math.min(...samples.map(p => p.y));
  const maxY = Math.max(...samples.map(p => p.y));
  const px = x => maxX === minX ? 160 : 28 + 264 * ((x - minX) / (maxX - minX));
  const py = y => maxY === minY ? 77 : 127 - 100 * ((y - minY) / (maxY - minY));
  return <svg className="backprop-svg" viewBox="0 0 320 168" role="img" aria-label="The computed function magnified over the interval from x minus h to x plus h, with the secant line between the two evaluated points">
    <polyline points={samples.map(p => `${px(p.x)},${py(p.y)}`).join(' ')} className="bp-current" />
    <line x1={px(result.left)} x2={px(result.right)} y1={py(result.lower)} y2={py(result.upper)} className="bp-proposed" />
    <circle cx={px(result.left)} cy={py(result.lower)} r="5" className="bp-target" /><circle cx={px(result.right)} cy={py(result.upper)} r="5" className="bp-target" />
    <text x="28" y="158" className="bp-label-target">f(x − h)</text><text x="292" y="158" textAnchor="end" className="bp-label-target">f(x + h)</text>
    <text x="160" y="16" textAnchor="middle"><tspan className="bp-label-current">function</tspan> · secant (dashed)</text>
  </svg>;
}

const superscript = n => String(n).replace(/-/g, '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const checkCases = {
  sine: { kind: 'sine', point: 1, offset: 0, label: 'sin x at x = 1' },
  linear: { kind: 'linear', point: 1, offset: 1e12, label: '10¹² + x at x = 1' },
  square: { kind: 'square', point: 0, offset: 0, label: 'x² at x = 0' },
};

// Investigation C: one central-difference check; choose the function and the step size.
export function BackpropDifferenceLab() {
  const [kind, setKind] = useState('sine');
  const [exponent, setExponent] = useState(-1);
  const setup = checkCases[kind];
  const result = finiteDifference({ ...setup, exponent });
  const reading = result.evaluationsCoalesce
    ? (result.analytic === 0
      ? 'Both evaluations are equal and the exact derivative is 0, so the estimate is right; with a zero derivative only absolute error is meaningful.'
      : 'The two evaluations are identical numbers, so their difference is exactly 0 and the nonzero derivative is lost to rounding. The derivative rule is not wrong; this check cannot see it.')
    : kind === 'sine' ? (exponent === -1
      ? 'The curve visibly bends between the two points, so the dashed secant tilts less than the curve does at x: truncation error dominates.'
      : exponent >= -4 ? 'At this magnification the curve already looks straight, yet truncation still dominates: each 10× smaller h makes the error about 100× smaller.'
        : exponent === -5 ? 'This is near the best step: truncation and rounding errors are about the same size.'
          : 'Here the two evaluations agree in most of their digits, so rounding error dominates and grows as h shrinks.')
      : kind === 'linear' ? 'The constant 10¹² already uses 13 of the roughly 16 significant digits, so the subtraction keeps only the last few: even a straight line with slope 1 gets a visibly wrong estimate.'
        : 'The estimate matches the exact derivative here.';
  return <FlowLab id="investigation-c" label="Investigation C: one central-difference check">
    <LocalFunction result={result} />
    <FlowControls>
      <FlowChoice label="Function" options={Object.entries(checkCases).map(([key, value]) => [key, value.label])} value={kind} onChange={setKind} />
      <FlowSlider name="Step h" value={exponent} min={-15} max={-1} step={1} onChange={setExponent} format={e => `10${superscript(e)}`} />
    </FlowControls>
    <dl className="backprop-exact" data-difference-case="A" data-error={result.absoluteError} data-estimate={result.estimate}>{[
      ['f(x − h)', String(result.lower)], ['f(x + h)', String(result.upper)], ['Central difference', String(result.estimate)], ['Exact derivative', String(result.analytic)], ['Absolute error', String(result.absoluteError)],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <FlowReadout>For {setup.label} with h = 10{superscript(exponent)}, the absolute error is <strong>{f(result.absoluteError)}</strong>. {reading}</FlowReadout>
  </FlowLab>;
}
