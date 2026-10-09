import { Children, Fragment, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { flowNumber } from './LessonFlow.jsx';
import './linear-logistic-flow.css';
const colors = {
  input: '#67cbd9',
  parameter: '#efbb53',
  computed: '#bb9aec',
  target: '#eeeae3',
  operation: '#eeeae3',
  wire: '#969b9f',
  gradient: '#e99a61'
};
const number = (value, digits = 3) => flowNumber(value, digits);
export function RegressionLabel({
  x,
  y,
  children,
  role = 'operation',
  anchor = 'middle'
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={colors[role]} stroke="#050505" strokeWidth={4} paintOrder="stroke fill" style={{
    filter: 'var(--regression-label-filter, none)'
  }}>{children}</text>;
}
const Label = RegressionLabel;
export function RegressionValue({
  x,
  y,
  label,
  value,
  role = 'computed',
  width = 84
}) {
  return <g>
    <rect x={x - width / 2} y={y - 23} width={width} height={46} rx={3} fill="#090909" stroke={colors[role]} />
    <Label x={x} y={y + 6} role={role}>{value}</Label>
    <Label x={x} y={y - 34} role={role}>{label}</Label>
  </g>;
}
const Value = RegressionValue;
export function RegressionOperation({
  x,
  y,
  label,
  radius = 24
}) {
  return <g>
    <circle cx={x} cy={y} r={radius} fill="#090909" stroke={colors.operation} />
    <Label x={x} y={y + 6}>{label}</Label>
  </g>;
}
const Operation = RegressionOperation;
export function RegressionWire({
  points,
  backward = false
}) {
  const last = points.at(-1);
  const prior = points.at(-2);
  const angle = Math.atan2(last[1] - prior[1], last[0] - prior[0]);
  const side = [-1, 1].map(sign => [last[0] - 8 * Math.cos(angle) + sign * 4 * Math.sin(angle), last[1] - 8 * Math.sin(angle) - sign * 4 * Math.cos(angle)]);
  const color = backward ? colors.gradient : colors.wire;
  return <g fill="none" stroke={color} strokeWidth={1.5}>
    <polyline points={points.map(point => point.join(',')).join(' ')} strokeDasharray={backward ? '5 4' : undefined} />
    <polyline points={[side[0], last, side[1]].map(point => point.join(',')).join(' ')} />
  </g>;
}
const Wire = RegressionWire;

// Connections sit behind their operands and captions, including grouped rows.
// A small opaque text background reserves a readable lane across a connection.
function paintConnectionsFirst(children) {
  const nodes = Children.toArray(children).map(node => {
    if (isValidElement(node) && (node.type === Fragment || node.type === 'g')) {
      return cloneElement(node, undefined, paintConnectionsFirst(node.props.children));
    }
    return node;
  });
  return [...nodes.filter(node => isValidElement(node) && node.type === RegressionWire), ...nodes.filter(node => !isValidElement(node) || node.type !== RegressionWire)];
}
export function RegressionDrawing({
  name,
  description,
  width = 320,
  height,
  children,
  caption
}) {
  const titleId = useId();
  const labelFilterId = useId();
  const surface = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const update = () => setOverflows(surface.current.scrollWidth > surface.current.clientWidth + 1);
    const observer = new ResizeObserver(update);
    observer.observe(surface.current);
    update();
    return () => observer.disconnect();
  }, []);
  return <figure className="regression-flow-drawing" data-figure={name}>
    {overflows && <p className="regression-flow-pan-cue">Scroll sideways to follow the complete drawing →</p>}
    <div ref={surface} className="regression-flow-surface" tabIndex={0} role="region" aria-label={`${description}; the drawing can be panned when it exceeds the reading column`}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{
        width: `${width / 16}rem`,
        '--regression-label-filter': `url(#${labelFilterId})`
      }} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{description}</title>
        <defs>
          <filter id={labelFilterId} x="-4%" y="-15%" width="108%" height="130%" colorInterpolationFilters="sRGB">
            <feFlood floodColor="#050505" result="background" />
            <feComposite in="SourceGraphic" in2="background" operator="over" />
          </filter>
        </defs>
        {paintConnectionsFirst(children)}
      </svg>
    </div>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
const Drawing = RegressionDrawing;
export function RegressionAnatomyDrawing({
  binary = false,
  feature = 2,
  weight = 1,
  intercept = binary ? -1 : 0
}) {
  const product = weight * feature;
  const score = intercept + product;
  const probability = score >= 0 ? 1 / (1 + Math.exp(-score)) : Math.exp(score) / (1 + Math.exp(score));
  return <Drawing name={binary ? 'regression-binary-anatomy' : 'regression-line-anatomy'} height={binary ? 548 : 438} description={binary ? 'Centered distance is multiplied by a weight, added to an intercept, then converted to probability by sigmoid' : 'Distance and the learned slope are distinct inputs to multiplication; the intercept joins the product to produce estimated hours'} caption={binary ? `The score is computed before sigmoid. Centered x=${number(feature)} corresponds to ${number((feature + 2) * 100)} km in this binary fixture.` : 'Follow the solid arrows downward. Cyan is supplied distance; amber values are coefficients; violet values are calculated.'}>
    <Wire points={[[75, 83], [75, 126], [136, 126]]} />
    <Wire points={[[245, 83], [245, 126], [184, 126]]} />
    <Wire points={[[160, 150], [100, 150], [100, 221], [118, 221]]} />
    <Wire points={[[160, 244], [160, 298]]} />
    <Wire points={[[265, 264], [265, 322], [184, 322]]} />
    <Wire points={[[160, 346], [80, 346], [80, 408], [104, 408]]} />
    {binary && <>
      <Wire points={[[160, 431], [160, 457]]} />
      <Wire points={[[160, 505], [160, 521]]} />
    </>}
    <Value x={75} y={60} label="supplied x" value={number(feature)} role="input" />
    <Value x={245} y={60} label="slope w" value={number(weight)} role="parameter" />
    <Operation x={160} y={126} label="×" />
    <Value x={160} y={221} label="product wx" value={number(product)} />
    <Value x={265} y={241} label="intercept b" value={number(intercept)} role="parameter" />
    <Operation x={160} y={322} label="+" />
    <Value x={160} y={408} label={binary ? 'score z' : 'estimate ŷ'} value={binary ? number(score) : `${number(score)} hours`} width={112} />
    {binary && <>
      <Operation x={160} y={481} label="σ" />
      <Label x={160} y={541} role="computed">p(label 1) = {number(probability, 6)}</Label>
    </>}
  </Drawing>;
}
export function PredictionBoundaryDrawing() {
  return <Drawing name="regression-information-boundary" height={607} description="A shipment's known dispatch measurements feed a stored rule; its eventual arrival supplies a separate evaluation target" caption="The solid routes show information use. The later outcome reaches comparison, never the earlier estimate.">
    <Wire points={[[90, 118], [90, 157], [137, 157]]} />
    <Wire points={[[160, 181], [70, 181], [70, 255], [97, 255]]} />
    <Wire points={[[160, 278], [160, 318], [85, 318], [85, 458], [137, 458]]} />
    <Wire points={[[235, 393], [235, 458], [183, 458]]} />
    <Wire points={[[160, 482], [160, 542]]} />
    <Label x={160} y={28}>At dispatch: one shipment</Label>
    <rect x={35} y={50} width={250} height={68} fill="none" stroke={colors.input} />
    <line x1={35} x2={285} y1={84} y2={84} stroke={colors.input} />
    <Label x={160} y={74} role="input">distance: 200 km</Label>
    <Label x={160} y={108} role="input">service: express</Label>
    <Operation x={160} y={157} label="rule" />
    <Value x={160} y={255} label="estimated outcome" value="hours" width={126} />
    <line x1={30} x2={290} y1={315} y2={315} stroke={colors.wire} strokeDasharray="3 6" />
    <Label x={235} y={338}>After arrival</Label>
    <Value x={235} y={370} label="" value="actual hours" role="target" width={138} />
    <Operation x={160} y={458} label="−" />
    <Label x={160} y={563} role="computed">actual − estimated</Label>
    <Label x={160} y={586}>Compare only when observed</Label>
  </Drawing>;
}
export function RegressionPlot({
  name,
  description,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  children,
  caption,
  clipMarks = false,
  yTickDigits = 2
}) {
  const surface = useRef(null);
  const [width, setWidth] = useState(320);
  const [overflows, setOverflows] = useState(false);
  const id = useId();
  useEffect(() => {
    const element = surface.current;
    const update = () => {
      const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const physical = element.querySelector('svg').getBoundingClientRect().width;
      setWidth(Math.max(280, physical / (rootSize / 16)));
      setOverflows(element.scrollWidth > element.clientWidth + 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(element.querySelector('svg'));
    update();
    return () => observer.disconnect();
  }, []);
  const ticks = [0, .5, 1];
  const longestVerticalTick = Math.max(...ticks.map(fraction =>
    number(yDomain[0] + fraction * (yDomain[1] - yDomain[0]), yTickDigits).length));
  const left = Math.max(yTickDigits > 3 ? 91 : 58, longestVerticalTick * 9 + 18);
  const right = width - 24;
  const top = 30;
  const bottom = 250;
  const xScale = value => left + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * (right - left);
  const yScale = value => bottom - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * (bottom - top);
  return <figure className="regression-flow-drawing" data-figure={name}>
    <p className="regression-flow-axis-label">{yLabel}</p>
    {overflows && <p className="regression-flow-pan-cue">Scroll sideways to read the complete axes →</p>}
    <div ref={surface} className="regression-flow-plot-surface" tabIndex={0} role="region" aria-label={`${description}; scroll when enlarged text requires more room`}>
      <svg viewBox={`0 0 ${width} 286`} role="img" aria-labelledby={id}>
        <title id={id}>{description}</title>
        <defs><clipPath id={`${id}-bounds`}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
        {ticks.map(fraction => {
          const x = left + fraction * (right - left);
          const y = bottom - fraction * (bottom - top);
          return <g key={fraction}>
            <line x1={left} x2={right} y1={y} y2={y} className="regression-flow-grid" />
            <Label x={left - 10} y={y + 5} anchor="end">{number(yDomain[0] + fraction * (yDomain[1] - yDomain[0]), yTickDigits)}</Label>
            <Label x={x} y={bottom + 26} anchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'}>
              {number(xDomain[0] + fraction * (xDomain[1] - xDomain[0]), 2)}
            </Label>
          </g>;
        })}
        <line x1={left} x2={right} y1={bottom} y2={bottom} className="regression-flow-axis" />
        <line x1={left} x2={left} y1={top} y2={bottom} className="regression-flow-axis" />
        <g clipPath={clipMarks ? `url(#${id}-bounds)` : undefined}>{children({
            xScale,
            yScale,
            width,
            left,
            right,
            top,
            bottom
          })}</g>
      </svg>
    </div>
    <p className="regression-flow-axis-label regression-flow-axis-label--horizontal">{xLabel}</p>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
export function RegressionPath({
  points,
  xScale,
  yScale,
  color = colors.computed,
  dashed = false
}) {
  return <polyline points={points.map(([x, y]) => `${xScale(x)},${yScale(y)}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dashed ? '4 4' : undefined} />;
}
export function RegressionSeriesLabel({
  target,
  position,
  children,
  color = colors.computed,
  anchor = 'start'
}) {
  return <g>
    <line x1={target[0]} y1={target[1]} x2={position[0]} y2={position[1] - 6}
      stroke={colors.wire} strokeWidth={1} strokeDasharray="1 4" />
    <circle cx={target[0]} cy={target[1]} r={2} fill={colors.wire} />
    <text x={position[0]} y={position[1]} textAnchor={anchor} fill={color} stroke="#090909" strokeWidth={4} paintOrder="stroke fill">{children}</text>
  </g>;
}
export function ShipmentResidualDrawing({
  report
}) {
  return <>
    <RegressionPlot name="regression-residual-geometry" description="Four fixed shipment distances and observed hours; a shared fitted line gives estimates, with vertical observed-minus-estimated residuals" xDomain={[-.2, 3.2]} yDomain={[-4.5, 14.5]} xLabel="Distance x (100 km)" yLabel="Elapsed hours" caption="White circles are actual hours; violet diamonds are estimates. A–D keep their original distances. Vertical segments are signed errors, not perpendicular distances to the line. Dotted gray guides connect curve names to the curves; they are not another fitted rule.">
      {({
        xScale,
        yScale,
        right
      }) => <>
        <RegressionPath points={report.rows.map(row => [row.distance, row.predicted])} xScale={xScale} yScale={yScale} />
        {report.rows.map(row => {
          const x = xScale(row.distance);
          const y = yScale(row.hours);
          const prediction = yScale(row.predicted);
          return <g key={row.id}>
            <line x1={x} x2={x} y1={y} y2={prediction} stroke={colors.gradient} strokeWidth={3} />
            <polygon points={`${x},${prediction - 5} ${x + 5},${prediction} ${x},${prediction + 5} ${x - 5},${prediction}`} fill="#090909" stroke={colors.computed} />
            <circle cx={x} cy={y} r={5} fill={colors.target} />
            <Label x={x} y={y - 14} role="target">{row.id}</Label>
          </g>;
        })}
        <RegressionSeriesLabel target={[xScale(2.8), yScale(report.rows[0].predicted + 2.8 * (report.rows[1].predicted - report.rows[0].predicted))]} position={[right - 8, 20]} anchor="end">line: estimates</RegressionSeriesLabel>
      </>}
    </RegressionPlot>
    <div className="regression-flow-error-areas" aria-label="Squared residual areas, using the same area scale for all four shipments">
      {report.rows.map(row => {
        const side = 12 * Math.abs(row.residual);
        return <div key={row.id}>
          <span>{row.id}: residual {number(row.residual)} hours</span>
          <svg viewBox="0 0 126 126" role="img" aria-label={`${row.id} squared error ${number(row.squared)} hours squared`}>
            <rect x={9} y={117 - side} width={side} height={side} fill={colors.computed} fillOpacity={.5} />
            {side === 0 && <line x1={9} x2={22} y1={117} y2={117} stroke={colors.computed} />}
          </svg>
          <span>area {number(row.squared)} hours²</span>
        </div>;
      })}
    </div>
  </>;
}
export function DesignMatrixDrawing() {
  const xValues = [0, 1, 2, 3];
  return <Drawing name="regression-design-product" height={602} description="Four design rows contain a leading one and distance; each row dots the same intercept/slope vector to produce its corresponding estimate" caption="Every output uses the same two coefficients. The leading 1 makes the intercept part of each row's dot product.">
    <Wire points={[[80, 261], [80, 318], [136, 318]]} />
    <Wire points={[[242, 173], [242, 318], [184, 318]]} />
    <Wire points={[[160, 342], [160, 365], [50, 365], [50, 414], [130, 414]]} />
    <Label x={80} y={28} role="input">X: four rows</Label>
    <Label x={242} y={28} role="parameter">shared β</Label>
    <Label x={54} y={65} role="input">1</Label>
    <Label x={102} y={65} role="input">x</Label>
    {xValues.map((x, index) => {
      const y = 106 + index * 44;
      return <g key={x}>
        <rect x={30} y={y - 21} width={96} height={44} fill="none" stroke={colors.input} />
        <line x1={78} x2={78} y1={y - 21} y2={y + 23} stroke={colors.input} />
        <Label x={54} y={y + 6} role="input">1</Label>
        <Label x={102} y={y + 6} role="input">{x}</Label>
        <Label x={16} y={y + 6} role="input">{'ABCD'[index]}</Label>
      </g>;
    })}
    {[['b', .9], ['w', .9]].map(([label, value], index) => <g key={label}>
      <rect x={210} y={85 + index * 44} width={64} height={44} fill="none" stroke={colors.parameter} />
      <Label x={242} y={113 + index * 44} role="parameter">{value}</Label>
      <Label x={287} y={113 + index * 44} role="parameter">{label}</Label>
    </g>)}
    <Operation x={160} y={318} label="×" />
    <Label x={160} y={385}>ŷ: one entry per row</Label>
    {xValues.map((x, index) => <g key={`output-${x}`}>
      <rect x={130} y={393 + index * 44} width={60} height={44} fill="none" stroke={colors.computed} />
      <Label x={160} y={421 + index * 44} role="computed">{number(.9 + .9 * x)}</Label>
      <Label x={210} y={421 + index * 44}>{'ABCD'[index]}</Label>
    </g>)}
    <Label x={160} y={593}>B: 1 × 0.9 + 1 × 0.9 = 1.8</Label>
  </Drawing>;
}
export function BinaryLikelihoodDrawing({
  score = 1,
  label = 1
}) {
  const p = score >= 0 ? 1 / (1 + Math.exp(-score)) : Math.exp(score) / (1 + Math.exp(score));
  const chosen = label ? p : 1 - p;
  return <Drawing name="regression-bernoulli-likelihood" height={485} description="The supplied binary label selects its probability mass; negative log converts the selected mass into loss" caption="This is one label's probability mass, not a density. All current values are calculated from the displayed score and observed label.">
    <Wire points={[[75, 83], [75, 247], [136, 247]]} />
    <Wire points={[[245, 83], [245, 247], [184, 247]]} />
    <Wire points={[[160, 191], [160, 223]]} />
    <Wire points={[[160, 271], [85, 271], [85, 337], [104, 337]]} />
    <Wire points={[[160, 360], [160, 385]]} />
    <Wire points={[[160, 433], [160, 446]]} />
    <Value x={75} y={60} label="mass: label 1" value={number(p)} width={94} />
    <Value x={245} y={60} label="mass: label 0" value={number(1 - p)} width={94} />
    <Value x={160} y={168} label="observed label y" value={label} role="target" width={70} />
    <Operation x={160} y={247} label="pick" />
    <Value x={160} y={337} label="chosen mass" value={number(chosen)} width={112} />
    <Operation x={160} y={409} label="−log" />
    <Label x={160} y={466} role="computed">loss = {number(Math.log1p(Math.exp(-Math.abs(score))) + Math.max((1 - 2 * label) * score, 0), 6)}</Label>
  </Drawing>;
}
