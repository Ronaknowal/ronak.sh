import { useId, useEffect, useRef, useState } from 'react';
import { flowNumber } from './LessonFlow.jsx';
import './message-passing-flow.css';

// Identity hues follow papers through storage and message views, never row addresses.
export const paperHues = ['#82d3ed', '#8caaff', '#dc9bdd', '#f2a877', '#efb5ca', '#b8a4ed'];
export const channelHues = ['#82d3ed', '#e7a6da'];

export function Drawing({ label, height, width = 704, children }) {
  const id = useId();
  const region = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = region.current;
    const inspect = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    inspect();
    const observer = new ResizeObserver(inspect);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={region} className="mp-flow-pan" data-overflow={overflow} tabIndex={0} role="region" aria-label={`${label}. Scroll horizontally if needed.`}>
    <svg className="mp-flow-drawing" style={{ width: `${width / 16}rem` }} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}>
      <title id={id}>{label}</title>{children}
    </svg>
  </div>;
}

export function Arrow({ x1, y1, x2, y2, both = false, dashed = false, hue = '#b9b9b9' }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = (x, y, direction) => {
    const a = angle + direction;
    return `${x},${y} ${x - 9 * Math.cos(a - .45)},${y - 9 * Math.sin(a - .45)} ${x - 9 * Math.cos(a + .45)},${y - 9 * Math.sin(a + .45)}`;
  };
  return <g stroke={hue} fill="none" strokeWidth="2" strokeDasharray={dashed ? '6 5' : undefined}>
    <path d={`M${x1},${y1}L${x2},${y2}`} /><polyline points={head(x2, y2, 0)} />
    {both && <polyline points={head(x1, y1, Math.PI)} />}
  </g>;
}

export function Paper({ id, x, y, value, selected = false }) {
  return <g>
    <circle cx={x} cy={y} r="27" fill="#101010" stroke={paperHues[id]} strokeWidth="2" />
    {selected && <circle cx={x} cy={y} r="32" fill="none" stroke="#fff" strokeWidth="2" />}
    <text x={x} y={y + 6} textAnchor="middle" fill={paperHues[id]}>{id}</text>
    <text x={x} y={y - 43} textAnchor="middle">Paper {id}{selected ? ' · traced' : ''}</text>
    {value !== undefined && <text x={x} y={y + 56} textAnchor="middle" fill={paperHues[id]}>feature 1 = {flowNumber(value)}</text>}
  </g>;
}

// Labels preserve exact identities; cell fill shows sign, not numerical magnitude.
// Decimal grids request a wider cell so numeric text is never shrunk to fit.
export function Cells({ values, x, y, labels, identities, highlight, cellWidth = 64, digits = 3, labelHues, signFill = true }) {
  return <g>{values.map((row, r) => <g key={r}>
    {labels && <text x={x - 12} y={y + r * 48 + 28} textAnchor="end"
      fill={labelHues?.[r] ?? (identities ? paperHues[identities[r]] : '#eee')}>{labels[r]}</text>}
    {row.map((value, c) => <g key={c}>
      <rect x={x + c * cellWidth} y={y + r * 48} width={cellWidth - 4} height="40" rx="3"
        fill={!signFill ? '#101010' : value > 0 ? '#342b18' : value < 0 ? '#152539' : '#161616'}
        stroke={highlight?.[0] === r && highlight?.[1] === c ? '#fff' : '#646464'}
        strokeWidth={highlight?.[0] === r && highlight?.[1] === c ? 3 : 1} />
      <text x={x + c * cellWidth + (cellWidth - 4) / 2} y={y + r * 48 + 27} textAnchor="middle">{flowNumber(value, digits)}</text>
    </g>)}
  </g>)}</g>;
}
