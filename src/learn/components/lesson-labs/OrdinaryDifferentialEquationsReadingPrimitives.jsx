import { useEffect, useId, useRef, useState } from 'react';
import './ordinary-differential-equations-reading-flow.css';
import { MathBlock as SharedMathBlock } from '../content/Math.jsx';

export const odeColours = {
  state: '#e7b54a',
  input: '#70bdcc',
  comparison: '#d89ca9',
  second: '#b2a0d7',
  axis: '#888',
};

export function odeFormat(value, digits = 6) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'undefined';
  if (!Number.isFinite(value)) return value < 0 ? '−∞' : '∞';
  if (value === 0) return '0';
  const formatted = Math.abs(value) < 1e-5 || Math.abs(value) >= 1e6
    ? value.toExponential(digits - 1)
    : String(Number(value.toFixed(digits)));
  return formatted.replaceAll('-', '−');
}

function ReadingRegion({ label, children, table = false, tall = false, kind = table ? 'table' : 'drawing' }) {
  const ref = useRef(null);
  const hintId = useId();
  const [overflow, setOverflow] = useState({ horizontal: true, vertical: tall });
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow({
      horizontal: element.scrollWidth > element.clientWidth + 2,
      vertical: element.scrollHeight > element.clientHeight + 2,
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [children]);
  const needsScroll = overflow.horizontal || overflow.vertical;
  const directions = overflow.horizontal && overflow.vertical
    ? 'sideways and down'
    : overflow.horizontal ? 'sideways' : 'down';
  return <div className="ode-reading-region">
    {needsScroll && <p id={hintId} className="ode-scroll-hint">
      Scroll {directions} to read the complete {kind}. Focus it and use the arrow keys.
    </p>}
    <div ref={ref} className={`ode-scroll-region${tall ? ' ode-scroll-region--tall' : ''}`}
      role="region" aria-label={label} aria-describedby={needsScroll ? hintId : undefined}
      tabIndex={needsScroll ? 0 : undefined}>
      {children}
    </div>
  </div>;
}

export function OdeMathBlock({ children, caption }) {
  return <ReadingRegion label="Complete displayed equation" kind="equation">
    <div className="ode-equation-content"><SharedMathBlock caption={caption}>{children}</SharedMathBlock></div>
  </ReadingRegion>;
}

export function OdeFigure({ id, children, caption }) {
  return <figure className="ode-reading-figure" data-mechanism={id} aria-label={id}>
    {children}{caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

export function OdeScene({ label, width = 640, height = 320, children }) {
  const titleId = useId();
  return <ReadingRegion label={label}>
    <svg className="ode-reading-scene" viewBox={`0 0 ${width} ${height}`}
      style={{ '--ode-min-width': `${width / 16}rem` }} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{label}</title>{children}
    </svg>
  </ReadingRegion>;
}

export function OdeLabel({ x, y, anchor = 'start', colour = '#ddd', children }) {
  return <text x={x} y={y} textAnchor={anchor} fill={colour} className="ode-reading-label">{children}</text>;
}

export function OdeArrow({ x1, y1, x2, y2, colour = '#ddd', dashed = false, width = 2 }) {
  if (x1 === x2 && y1 === y2) return null;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = Math.min(8, .35 * Math.hypot(x2 - x1, y2 - y1));
  const points = [
    [x2, y2],
    [x2 - head * Math.cos(angle - .45), y2 - head * Math.sin(angle - .45)],
    [x2 - head * Math.cos(angle + .45), y2 - head * Math.sin(angle + .45)],
  ];
  return <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colour} strokeWidth={width}
      strokeDasharray={dashed ? '5 4' : undefined} />
    <polygon points={points.map(point => point.join(',')).join(' ')} fill={colour} />
  </g>;
}

export function OdeTable({ label, columns, rows, tall = false }) {
  return <div className="ode-reading-table">
    <p className="ode-table-label">{label}</p>
    <ReadingRegion label={label} table tall={tall}>
      <table><thead><tr>{columns.map((column, index) => <th key={index} scope="col">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0
          ? <th key={column} scope="row">{value}</th>
          : <td key={column}>{value}</td>)}</tr>)}</tbody>
      </table>
    </ReadingRegion>
  </div>;
}

export function odeSamples(start, end, fn, intervals = 80) {
  return Array.from({ length: intervals + 1 }, (_, index) => {
    const time = start + (end - start) * index / intervals;
    return [time, fn(time)];
  });
}

export function OdePlot({ label, xDomain, yDomain, xLabel, yLabel,
  series = [], references = [], width = 640, height = 350, children }) {
  const clipId = useId();
  const left = 80, right = width - 35, top = 45, bottom = height - 70;
  const x = value => left + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * (right - left);
  const y = value => bottom - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * (bottom - top);
  const ticks = domain => [...new Set([domain[0], ...(domain[0] < 0 && domain[1] > 0 ? [0] : []), domain[1]])];
  const xZeroNeedsLane = xDomain[0] < 0 && xDomain[1] > 0 && [xDomain[0], xDomain[1]].some(endpoint =>
    Math.abs(x(endpoint) - x(0)) < 9 * (odeFormat(endpoint, 3).length + 1) / 2 + 10);
  const yZeroNeedsLane = yDomain[0] < 0 && yDomain[1] > 0 &&
    Math.min(Math.abs(y(0) - y(yDomain[0])), Math.abs(y(0) - y(yDomain[1]))) < 26;
  const yZeroLabel = y(0) + (Math.abs(y(0) - bottom) < Math.abs(y(0) - top) ? -26 : 26);
  return <OdeScene label={label} width={width} height={height}>
    <defs><clipPath id={clipId}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
    <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={odeColours.axis} />
    <line x1={left} y1={top} x2={left} y2={bottom} stroke={odeColours.axis} />
    {ticks(xDomain).map(value => <g key={value}>
      <line x1={x(value)} x2={x(value)} y1={bottom} y2={bottom + 6} stroke={odeColours.axis} />
      {value === 0 && xZeroNeedsLane && <line x1={x(value)} x2={x(value)} y1={bottom + 6} y2={bottom + 32} stroke={odeColours.axis} />}
      <OdeLabel x={x(value)} y={bottom + (value === 0 && xZeroNeedsLane ? 49 : 27)} anchor="middle">{odeFormat(value, 3)}</OdeLabel>
    </g>)}
    {ticks(yDomain).map(value => <g key={value}>
      <line x1={left - 6} x2={left} y1={y(value)} y2={y(value)} stroke={odeColours.axis} />
      {value === 0 && yZeroNeedsLane && <line x1={left - 6} x2={left - 10} y1={y(value)} y2={yZeroLabel} stroke={odeColours.axis} />}
      <OdeLabel x={left - 12} y={(value === 0 && yZeroNeedsLane ? yZeroLabel : y(value)) + 5} anchor="end">{odeFormat(value, 3)}</OdeLabel>
    </g>)}
    <OdeLabel x={(left + right) / 2} y={height - 15} anchor="middle">{xLabel}</OdeLabel>
    <OdeLabel x={left} y={24}>{yLabel}</OdeLabel>
    <g clipPath={`url(#${clipId})`}>
      {references.map((reference, index) => reference.axis === 'x'
        ? <line key={index} x1={x(reference.value)} x2={x(reference.value)} y1={top} y2={bottom}
          stroke={reference.colour ?? odeColours.axis} strokeDasharray="5 4" />
        : <line key={index} x1={left} x2={right} y1={y(reference.value)} y2={y(reference.value)}
          stroke={reference.colour ?? odeColours.axis} strokeDasharray="5 4" />)}
      {series.map((line, index) => <g key={index}>
        {line.connect !== false && <polyline
          points={line.points.map(point => `${x(point[0])},${y(point[1])}`).join(' ')}
          fill="none" stroke={line.colour ?? odeColours.state} strokeWidth={2}
          strokeDasharray={line.dashed ? '6 4' : undefined} />}
        {line.dots && line.points.map((point, dot) => <circle key={dot} cx={x(point[0])} cy={y(point[1])}
          r={4} fill={line.colour ?? odeColours.state} />)}
      </g>)}
    </g>
    {typeof children === 'function' ? children({ x, y, left, right, top, bottom }) : children}
  </OdeScene>;
}
