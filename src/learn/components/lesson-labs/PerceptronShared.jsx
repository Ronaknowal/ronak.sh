import { useId } from 'react';
import { FlowCheck, FlowChoice, FlowLab, FlowSlider, flowNumber } from './LessonFlow.jsx';
import './perceptron-labs.css';

// The reading-flow building blocks are shared (LessonFlow.jsx); these names keep the lesson's call sites short.
export const fmt = flowNumber;
export const NumberControl = FlowSlider;
export const Choice = FlowChoice;
export { FlowCheck };

// One colour per activation function, used in every plot of the lesson (§1, §4, §5).
export const activationColors = { step: '#d8d3cc', sigmoid: '#e8c36f', tanh: '#83b4e8', relu: '#c49be2', leaky_relu: '#e99b88', gelu: '#e98fc0', silu: '#7dd5e9' };

export function PerceptronTable({ caption, headers, rows }) {
  return <div className="perceptron-table" tabIndex={0} role="region" aria-label={caption}><table><caption>{caption}</caption><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

// A lab or interactive figure; `kind` is its provenance note, shown under the controls.
export function Frame({ id, title, children, kind }) {
  return <FlowLab id={id} label={title} note={kind}>{children}</FlowLab>;
}

// Signed contributions on one shared scale; colour follows sign (amber positive, blue negative).
export function SignedBars({ labels, values, extent = Math.max(1, ...values.map(Math.abs)) }) {
  return <div className="perceptron-bars" role="img" aria-label={`Signed contributions on a shared scale from ${fmt(-extent)} to ${fmt(extent)}: ${labels.map((l, i) => `${l} ${fmt(values[i])}`).join('; ')}`}>{labels.map((label, index) => <div className="perceptron-bar-row" key={label}><span>{label}</span><div className="perceptron-bar-track"><span className="perceptron-bar-zero" /><span className={`perceptron-bar-fill ${values[index] < 0 ? 'is-negative' : 'is-positive'}`} style={{
    left: values[index] < 0 ? `${50 + values[index] / extent * 50}%` : '50%',
    width: `${Math.abs(values[index]) / extent * 50}%`
  }} /></div><strong>{fmt(values[index])}</strong></div>)}</div>;
}

// A function plot. A curve may carry its own label, drawn at its right end, so no legend is needed.
export function CurvePlot({ title, curves, xDomain = [-6, 6], yDomain, selected, points = [], hollowPoints = [], xLabel = 'Score z', yLabel = 'Value', xTicks, yTicks, log = false, pointLabels = [] }) {
  const id = useId(),
    [xmin, xmax] = xDomain,
    [ymin, ymax] = yDomain,
    labelled = curves.some(curve => curve.label),
    width = labelled ? 400 : 340,
    height = 265,
    left = 55,
    right = labelled ? 80 : 20,
    top = 24,
    bottom = 54;
  const px = x => left + (x - xmin) / (xmax - xmin) * (width - left - right),
    transform = y => log ? Math.log10(y) : y,
    py = y => height - bottom - (transform(y) - transform(ymin)) / (transform(ymax) - transform(ymin)) * (height - top - bottom);
  // Curve labels sit at each curve's right end, pushed apart so they never overlap.
  const labelPositions = curves.map((curve, i) => curve.label && { i, y: py(curve.labelAt ?? curve.data[curve.data.length - 1][1]) }).filter(Boolean).sort((p, q) => p.y - q.y);
  labelPositions.forEach((p, k) => { if (k) p.y = Math.max(p.y, labelPositions[k - 1].y + 14); });
  for (let k = labelPositions.length - 1; k >= 0; k--) labelPositions[k].y = Math.min(labelPositions[k].y, k === labelPositions.length - 1 ? height - bottom : labelPositions[k + 1].y - 14);
  const xt = xTicks ?? [xmin, 0, xmax].filter((v, i, a) => a.indexOf(v) === i),
    yt = yTicks ?? [ymin, 0, ymax].filter((v, i, a) => a.indexOf(v) === i && v >= ymin && v <= ymax);
  return <figure className="perceptron-plot">{title && <figcaption>{title}</figcaption>}<svg className="perceptron-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title`}><title id={`${id}-title`}>{title}. {xLabel} from {xmin} to {xmax}; {yLabel} from {ymin} to {ymax}.{curves.filter(c => c.label).map(c => ` ${c.label}.`).join('')}</title><defs><clipPath id={`${id}-clip`}><rect x={left} y={top} width={width - left - right} height={height - top - bottom} /></clipPath></defs>{yt.map(y => <g key={y}><line className="perceptron-grid" x1={left} x2={width - right} y1={py(y)} y2={py(y)} /><text x={left - 9} y={py(y) + 4} textAnchor="end">{fmt(y, 3)}</text></g>)}{xt.map(x => <g key={x}><line className="perceptron-grid" x1={px(x)} x2={px(x)} y1={top} y2={height - bottom} /><text x={px(x)} y={height - bottom + 21} textAnchor="middle">{fmt(x)}</text></g>)}<g clipPath={`url(#${id}-clip)`}>{selected !== undefined && <line className="perceptron-guide" x1={px(selected)} x2={px(selected)} y1={top} y2={height - bottom} />} {curves.map((curve, i) => <path key={i} className={`perceptron-line color-${i % 6}`} style={curve.color || curve.width ? { stroke: curve.color, strokeWidth: curve.width } : undefined} strokeDasharray={curve.dash} d={curve.data.map((p, j) => `${j ? 'L' : 'M'}${px(p[0])},${py(p[1])}`).join(' ')} />)}{hollowPoints.map((p, i) => <circle key={`open-${i}`} cx={px(p[0])} cy={py(p[1])} r="4" fill="#141414" stroke="#e8c36f" strokeWidth="1.5" />)}{points.map((p, i) => <circle key={i} cx={px(p[0])} cy={py(p[1])} r="4.5" className="perceptron-dot" />)}</g>{pointLabels.map(([x, y, text, dx = 8, dy = -8, anchor = "start"], i) => <text key={`pl-${i}`} className="perceptron-point-label" x={px(x) + dx} y={py(y) + dy} textAnchor={anchor}>{text}</text>)}{labelPositions.map(({ i, y }) => <text key={`label-${i}`} className="perceptron-curve-label" x={width - right + 6} y={y + 4} style={curves[i].color ? { fill: curves[i].color } : undefined}>{curves[i].label}</text>)}<text x={(left + width - right) / 2} y={height - 8} textAnchor="middle">{xLabel}</text><text x={left} y="13">{yLabel}</text></svg></figure>;
}
