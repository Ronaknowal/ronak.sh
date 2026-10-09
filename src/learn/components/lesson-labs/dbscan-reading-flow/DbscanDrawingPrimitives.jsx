import React, { useEffect, useId, useRef, useState } from 'react';
export const hues = ['#83abe0', '#d398b5', '#b0a0df', '#d4a76a'];
export const neutral = '#b0b4b8',
  focus = '#e0b16c',
  line = '#626970';
export const number = (x, digits = 3) => Number.isFinite(x) ? Number(x.toFixed(digits)).toString() : x === Infinity ? '∞' : 'unavailable';
export function Figure({
  id,
  children,
  sentence
}) {
  return <figure className="db-figure" data-drawing={id} aria-label={`${id} mechanism`}><div className="db-paint">{children}</div><figcaption aria-live="polite">{sentence}</figcaption></figure>;
}
export function useGeometry() {
  const ref = useRef(null),
    [size, setSize] = useState({
      width: 600,
      rem: 16
    });
  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const width = Math.max(160, ref.current.clientWidth);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setSize(previous => previous.width === width && previous.rem === rem ? previous : {width, rem});
    };
    const observer = new ResizeObserver(update);
    if (ref.current) observer.observe(ref.current);
    observer.observe(document.documentElement);
    const textScaleObserver = new MutationObserver(update);
    textScaleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    window.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      textScaleObserver.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  return {
    ref,
    ...size
  };
}
export function Canvas({
  height = 280,
  label,
  children
}) {
  const {
      ref,
      width,
      rem
    } = useGeometry(),
    h = typeof height === 'function' ? height(width, rem) : height * rem / 16;
  return <div ref={ref} className="db-canvas"><svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label={label}>{children({
        width,
        height: h,
        rem
      })}</svg></div>;
}
export function Point({
  x,
  y,
  id,
  role = 'context',
  group = -1,
  selected = false,
  labelX,
  labelY,
  anchor = 'start'
}) {
  const hue = group >= 0 ? hues[group % hues.length] : neutral;
  let mark;
  if (role === 'noise') {
    mark = <path d={`M${x-5},${y-5}l10,10 M${x-5},${y+5}l10,-10`} stroke={hue} strokeWidth="2"/>;
  } else if (role === 'query') {
    mark = <path d={`M${x},${y-7}l7,7l-7,7l-7,-7Z`} stroke={hue} fill="none" strokeWidth="2"/>;
  } else if (role === 'centre') {
    mark = <g><rect x={x-7} y={y-7} width="14" height="14" fill="#111" stroke={hue} strokeWidth="2"/><path d={`M${x-5},${y}h10 M${x},${y-5}v10`} stroke={hue} strokeWidth="2"/></g>;
  } else {
    mark = <circle cx={x} cy={y} r={5} fill={role === 'core' ? hue : '#111'} stroke={hue} strokeWidth="2"/>;
  }
  return <g>
    {selected&&<circle cx={x} cy={y} r={12} fill="none" stroke={focus} strokeWidth="2"/>}
    {mark}
    <text x={labelX??x+9} y={labelY??y-9} textAnchor={anchor}>{id}</text>
  </g>;
}
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = neutral,
  label
}) {
  const id = useId().replaceAll(':', '');
  return <g><defs><marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8Z" fill={color} /></marker></defs><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" markerEnd={`url(#${id})`} />{label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle">{label}</text>}</g>;
}
export function NumericControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  onReset,
  resetValue,
  log = false
}) {
  const id = useId(),
    [draft, setDraft] = useState(String(value)),
    [error, setError] = useState('');
  useEffect(() => {
    setDraft(String(value));
    setError('');
  }, [value]);
  const apply = raw => {
    setDraft(raw);
    const n = raw.trim() === '' ? NaN : Number(raw),
      valid = Number.isFinite(n) && n >= min && n <= max && (step !== 1 || Number.isInteger(n));
    if (valid) {
      onChange(n);
      setError('');
    } else setError(`Enter ${step === 1 ? 'an integer' : 'a finite value'} from ${min} to ${max}; the last valid drawing stays visible.`);
  };
  return <div className="db-controls"><label className="db-field" htmlFor={id}>{label}<input id={id} type="number" value={draft} min={min} max={max} step={step} aria-invalid={Boolean(error)} onChange={e => apply(e.target.value)} /><input aria-label={`${label} slider`} type="range" value={log ? Math.log10(value) : value} min={log ? Math.log10(min) : min} max={log ? Math.log10(max) : max} step={log ? .005 : step} onChange={e => apply(String(log ? 10 ** Number(e.target.value) : Number(e.target.value)))} />{error && <span role="alert">{error}</span>}</label><button type="button" onClick={() => {
      onReset();
      setError('');
      setDraft(String(resetValue));
    }}>Reset</button></div>;
}
export function Steps({
  step,
  setStep,
  last,
  initial = 0
}) {
  return <div className="db-controls"><button type="button" disabled={step >= last} onClick={() => setStep(s => s + 1)}>Step</button><button type="button" disabled={step <= 0} onClick={() => setStep(s => s - 1)}>Back</button><button type="button" onClick={() => setStep(initial)}>Reset</button><output>State {step + 1} / {last + 1}</output></div>;
}
export function Table({
  caption,
  headers,
  rows
}) {
  return <div className="db-scroll" role="region" tabIndex={0} aria-label={caption}><table className="db-table"><caption>{caption}</caption><thead><tr>{headers.map((x, i) => <th key={i} scope="col">{x}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>;
}
export function CellStrip({
  label,
  values,
  selected = -1
}) {
  return <div className="db-array"><p>{label}</p><ol>{values.map((x, i) => <li key={i} className={i === selected ? 'is-selected' : ''}>{x}</li>)}</ol></div>;
}
export function RoleKey() {
  return <p className="db-key"><span>● Core expands</span><span>○ Border attaches</span><span>× Noise lacks core support</span><span>Amber outline selects; hue names a group</span></p>;
}
export function Trail({
  rows,
  eps = 1,
  selected = null,
  interval = true,
  counts = false,
  edges = [],
  unit = 'length units'
}) {
  return <Canvas height={(w, r) => w / r < 36 ? Math.max(720 * r / 16, rows.length * 2.2 * r + 150) : 280 * r / 16} label={`Actual coordinate ruler in ${unit}; ${selected === null ? 'all rows' : `selected ${rows[selected]?.id}`}`}>{({
      width,
      height,
      rem
    }) => {
      const narrow = width / rem < 36,
        f = rem / 16,
        positions = rows.map(row => row.coordinates[0]),
        lo = Math.min(-2, ...positions.map(x => x - eps)),
        hi = Math.max(...positions.map(x => x + eps)),
        scale = (height - 150 * f) / (hi - lo),
        xScale = (width - 100 * f) / (hi - lo),
        axisX = 45 * f,
        px = x => narrow ? axisX : (x - lo) * xScale + 50 * f,
        py = x => narrow ? height - 80 * f - (x - lo) * scale : 150 * f,
        center = selected === null ? null : positions[selected];
      const duplicates = i => positions.slice(0, i).filter(x => x === positions[i]).length;
      return <g><line x1={narrow ? axisX : 30 * f} x2={narrow ? axisX : width - 25 * f} y1={narrow ? 55 * f : 150 * f} y2={narrow ? height - 65 * f : 150 * f} stroke={line} />
      {Array.from({
          length: 6
        }, (_, i) => lo + i * (hi - lo) / 5).map((v, i) => <g key={i}><line x1={px(v) - 5} x2={px(v) + 5} y1={py(v) - 5} y2={py(v) + 5} stroke={line} /><text x={narrow ? 4 : px(v)} y={narrow ? py(v) + 5 : height - 32 * f} textAnchor={narrow ? 'start' : 'middle'} className="db-axis-label">{number(v, 2)}</text></g>)}
      {center !== null && interval && <g><line x1={px(center - eps)} y1={py(center - eps) - (!narrow ? 30 * f : 0)} x2={px(center + eps)} y2={py(center + eps) - (!narrow ? 30 * f : 0)} stroke={focus} strokeWidth="3" /><text x={narrow ? 70 * f : width / 2} y={25 * f} textAnchor={narrow ? 'start' : 'middle'}>Closed [{number(center - eps)}, {number(center + eps)}]</text></g>}
      {edges.map(([a, b, color], i) => <line key={i} x1={px(positions[a])} y1={py(positions[a])} x2={px(positions[b])} y2={py(positions[b])} stroke={color ?? focus} strokeWidth="3" />)}
      {rows.map((row, i) => {
          const duplicate = duplicates(i),
            x = px(positions[i]) + (narrow ? duplicate * 35 * f : 0),
            y = py(positions[i]) + (!narrow ? duplicate * 35 * f : 0),
            labelY = narrow ? y + 5 : 50 * f + (i < 4 ? i : i < 8 ? i - 4 : 0) * 22 * f,
            labelX = narrow ? (positions.filter(value => value === positions[i]).length > 1 ? 110 : 78) * f + duplicate * 80 * f : x;
          return <g key={row.id}>{!narrow && <line x1={x} y1={labelY + 7} x2={x} y2={y - 8} stroke={line} strokeDasharray="2 3" />}{duplicate > 0 && <g><line x1={px(positions[i])} y1={py(positions[i])} x2={x} y2={y} stroke={focus} /><text x={narrow ? x + 8 : x + 9} y={narrow ? y + 30 * f : y}>0</text></g>}<Point x={x} y={y} id={`${row.id}${counts ? ` · ${row.count}` : ''}`} labelX={labelX} labelY={labelY} role={row.role} group={row.label ?? -1} selected={i === selected} />{narrow && !duplicate && <text x={width - 10} y={y + 5} textAnchor="end" className="db-axis-label">{number(positions[i])}</text>}</g>;
        })}<text x={narrow ? 70 * f : width / 2} y={height - 5} textAnchor={narrow ? 'start' : 'middle'}>{unit}</text></g>;
    }}</Canvas>;
}
export function Plane({
  rows,
  domain = [-2, 2, -2, 2],
  disk,
  ellipse,
  links = [],
  label = 'Equal-scale feature coordinates',
  height = 330,
  segments = []
}) {
  return <Canvas height={height} label={label}>{({
      width,
      height,
      rem
    }) => {
      const [xmin, xmax, ymin, ymax] = domain,
        pad = 45 * rem / 16,
        s = Math.max(1, Math.min((width - 2 * pad) / (xmax - xmin), (height - 2 * pad) / (ymax - ymin))),
        ox = (width - (xmax - xmin) * s) / 2,
        oy = (height - (ymax - ymin) * s) / 2,
        X = x => ox + (x - xmin) * s,
        Y = y => height - oy - (y - ymin) * s;
      return <g><line x1={X(xmin)} x2={X(xmax)} y1={Y(0)} y2={Y(0)} stroke={line} /><line x1={X(0)} x2={X(0)} y1={Y(ymin)} y2={Y(ymax)} stroke={line} /><text x={width - 10} y={Y(0) + 25} textAnchor="end">x</text><text x={X(0) + 9} y={25 * rem / 16}>y</text>{disk && <><circle cx={X(disk.x)} cy={Y(disk.y)} r={disk.radius * s} fill={focus} fillOpacity=".08" stroke={focus} /><line x1={X(disk.x)} y1={Y(disk.y)} x2={X(disk.x + disk.radius)} y2={Y(disk.y)} stroke={focus} /><text x={X(disk.x + disk.radius / 2)} y={Y(disk.y) + 25} textAnchor="middle">{number(disk.radius)}</text></>}{ellipse && <ellipse cx={X(0)} cy={Y(0)} rx={ellipse[0] * s} ry={ellipse[1] * s} fill={focus} fillOpacity=".08" stroke={focus} />} {links.map((l, i) => {
          const a = rows[l.a],
            b = rows[l.b];
          return <line key={i} x1={X(a.coordinates[0])} y1={Y(a.coordinates[1])} x2={X(b.coordinates[0])} y2={Y(b.coordinates[1])} stroke={l.color ?? line} strokeWidth="1.5" />;
        })}{segments.map((segment,i)=><g key={i}><line x1={X(segment.a[0])} y1={Y(segment.a[1])} x2={X(segment.b[0])} y2={Y(segment.b[1])} stroke={segment.color??focus} strokeWidth={segment.width??2} strokeDasharray={segment.dashed?'5 4':undefined}/>{segment.label&&<text x={X((segment.a[0]+segment.b[0])/2)} y={Y((segment.a[1]+segment.b[1])/2)+(segment.dy??-10)} textAnchor="middle">{segment.label}</text>}</g>)}{rows.map(row => <g key={row.id}>{row.labelCoordinates && <line x1={X(row.coordinates[0])} y1={Y(row.coordinates[1])} x2={X(row.labelCoordinates[0])} y2={Y(row.labelCoordinates[1])} stroke={line} strokeDasharray="2 3" />}<Point x={X(row.coordinates[0])} y={Y(row.coordinates[1])} id={row.id} group={row.label ?? -1} role={row.role} selected={row.selected} anchor={row.anchor ?? 'start'} labelX={row.labelCoordinates ? X(row.labelCoordinates[0]) : X(row.coordinates[0]) + (row.dx ?? 9)} labelY={row.labelCoordinates ? Y(row.labelCoordinates[1]) : Y(row.coordinates[1]) + (row.dy ?? -9)} /></g>)}<text x={X(xmin)} y={height - 5}>{number(xmin)}</text><text x={X(xmax)} y={height - 5} textAnchor="end">{number(xmax)}</text></g>;
    }}</Canvas>;
}
