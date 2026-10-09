import { useEffect, useId, useRef, useState } from 'react';
import './monte-carlo-reading-flow.css';

export const mcNumber = (value, precision = 6) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'undefined';
  if (!Number.isFinite(value)) return value < 0 ? '−∞' : '∞';
  if (value === 0) return '0';
  const text = Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6 ? value.toExponential(precision - 1) : String(Number(value.toFixed(precision)));
  return text.replace(/-/g, '−');
};
export const mcColours = ['#e7b54a', '#70bdcc', '#d89ca9', '#b2a0d7'];
export function McFigure({ id, children, caption }) {
  return <figure className="mc-figure" data-mechanism={id} aria-label={id}>{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
function McReadingRegion({ label, kind, className, children }) {
  const regionRef = useRef(null);
  const hintId = useId();
  const [overflow, setOverflow] = useState({ horizontal: false, vertical: false });
  useEffect(() => {
    const node = regionRef.current;
    const measure = () => {
      const horizontal = node.scrollWidth > node.clientWidth + 2;
      const vertical = node.scrollHeight > node.clientHeight + 2;
      setOverflow(previous => previous.horizontal === horizontal && previous.vertical === vertical ? previous : { horizontal, vertical });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  const directions = overflow.horizontal && overflow.vertical ? 'Left/Right and Up/Down' : overflow.horizontal ? 'Left/Right' : 'Up/Down';
  const scrolls = overflow.horizontal || overflow.vertical;
  return <div className="mc-reading-region">
    {scrolls && <p id={hintId} className="mc-scroll-hint">Scroll to see the complete {kind}. Focus this region and use {directions} arrow keys.</p>}
    <div ref={regionRef} className={className} role="region" aria-label={label} aria-describedby={scrolls ? hintId : undefined} tabIndex={0}>{children}</div>
  </div>;
}
export function McScene({ label, width = 640, height = 300, children }) {
  const titleId = useId();
  return <McReadingRegion className="mc-scene-region" label={`${label}; horizontally scrollable drawing`} kind="drawing">
    <svg className="mc-scene" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: `${width / 16}rem` }} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{label}</title>{children}
    </svg>
  </McReadingRegion>;
}
export function McTable({ label, columns, rows, tall = false }) {
  return <div className="mc-table"><p className="mc-table-label">{label}</p><McReadingRegion className={`mc-table-region ${tall ? 'mc-table-region--tall' : ''}`} label={`${label}; scrollable complete table`} kind="table">
    <table><thead><tr>{columns.map((column, index) => <th scope="col" key={index}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0 ? <th scope="row" key={column}>{value}</th> : <td key={column}>{value}</td>)}</tr>)}</tbody>
    </table>
  </McReadingRegion></div>;
}
export function McLabel({ x, y, anchor = 'start', colour = '#ddd', children }) {
  return <text x={x} y={y} textAnchor={anchor} fill={colour} className="mc-label">{children}</text>;
}
export function McArrow({ x1, y1, x2, y2, colour = '#ddd', dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 7;
  const points = [[x2, y2], [x2 - size * Math.cos(angle - .5), y2 - size * Math.sin(angle - .5)], [x2 - size * Math.cos(angle + .5), y2 - size * Math.sin(angle + .5)]];
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colour} strokeWidth={2} strokeDasharray={dashed ? '5 4' : undefined} /><polygon points={points.map(point => point.join(',')).join(' ')} fill={colour} /></g>;
}
export function McPlot({ label, xDomain, yDomain, xLabel, yLabel, series = [], references = [], width = 640, height = 320, children }) {
  const clip = useId();
  const left = 75, right = width - 30, top = 40, bottom = height - 66;
  const x = value => left + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * (right - left);
  const y = value => bottom - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * (bottom - top);
  const xTicks = [...new Set([xDomain[0], ...(xDomain[0] < 0 && xDomain[1] > 0 ? [0] : []), xDomain[1]])];
  const yTicks = [...new Set([yDomain[0], ...(yDomain[0] < 0 && yDomain[1] > 0 ? [0] : []), yDomain[1]])];
  return <McScene label={label} width={width} height={height}>
    <defs><clipPath id={clip}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
    <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#999" /><line x1={left} y1={top} x2={left} y2={bottom} stroke="#999" />
    {xTicks.map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1={bottom} y2={bottom + 6} stroke="#999" /><McLabel x={x(value)} y={bottom + 25} anchor="middle">{mcNumber(value, 3)}</McLabel></g>)}
    {yTicks.map(value => <g key={value}><line x1={left - 6} x2={left} y1={y(value)} y2={y(value)} stroke="#999" /><McLabel x={left - 12} y={y(value) + 5} anchor="end">{mcNumber(value, 3)}</McLabel></g>)}
    <McLabel x={(left + right) / 2} y={height - 12} anchor="middle">{xLabel}</McLabel><McLabel x={left} y={22}>{yLabel}</McLabel>
    <g clipPath={`url(#${clip})`}>
      {references.map((reference, index) => reference.axis === 'x' ? <line key={index} x1={x(reference.value)} x2={x(reference.value)} y1={top} y2={bottom} stroke={reference.colour || '#aaa'} strokeDasharray="5 4" /> : <line key={index} x1={left} x2={right} y1={y(reference.value)} y2={y(reference.value)} stroke={reference.colour || '#aaa'} strokeDasharray="5 4" />)}
      {series.map((line, index) => <g key={index}>{line.connect !== false && <polyline points={line.points.filter(point => point.every(Number.isFinite)).map(point => `${x(point[0])},${y(point[1])}`).join(' ')} fill="none" stroke={line.colour || mcColours[index % 4]} strokeWidth={2} />}{line.dots && line.points.filter(point => point.every(Number.isFinite)).map((point, item) => <circle key={item} cx={x(point[0])} cy={y(point[1])} r={3} fill={line.colour || mcColours[index % 4]} />)}</g>)}
      {typeof children === 'function' ? children({ x, y, left, right, top, bottom }) : children}
    </g>
  </McScene>;
}
