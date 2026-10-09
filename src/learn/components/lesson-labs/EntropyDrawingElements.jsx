import { useId, useState, useEffect, useRef, createContext, useContext, Children, isValidElement } from 'react';
export const COLORS = ['#e6ad55', '#79b8e8', '#baa4e8', '#e79584'];
export const LETTERS = ['A', 'B', 'C', 'D'];
export function number(x, d = 5) {
  if (x === Infinity) return '∞';
  if (x === -Infinity) return '−∞';
  if (!Number.isFinite(x)) return 'unavailable';
  if (x === 0) return '0';
  if (Math.abs(x) < 10 ** -d) return x.toExponential(2);
  return Number(x.toFixed(d)).toString();
}
export function Figure({
  id,
  title,
  children,
  caption
}) {
  return <figure className="en-figure" data-entropy-drawing={id}><figcaption><span className="en-figure-id">{id}</span> {title}</figcaption>{children}{caption && <p className="en-caption">{caption}</p>}</figure>;
}
export function Key({
  labels = LETTERS
}) {
  return <ul className="en-key">{labels.map((s, i) => <li key={s}><span style={{
        color: COLORS[i % 4]
      }} aria-hidden="true">{['●', '■', '▲', '◆'][i % 4]}</span> {s}</li>)}</ul>;
}
export function Mark({
  x,
  y,
  index = 0,
  size = 5,
  ...rest
}) {
  const p = {
    fill: COLORS[index % 4],
    stroke: '#121212',
    strokeWidth: 1.5,
    ...rest
  };
  return index % 4 === 0 ? <circle cx={x} cy={y} r={size} {...p} /> : index % 4 === 1 ? <rect x={x - size} y={y - size} width={size * 2} height={size * 2} {...p} /> : index % 4 === 2 ? <path d={`M${x},${y - size * 1.25}l${size * 1.2},${size * 2.2}h${-size * 2.4}Z`} {...p} /> : <path d={`M${x},${y - size * 1.3}l${size * 1.3},${size * 1.3}l${-size * 1.3},${size * 1.3}l${-size * 1.3},${-size * 1.3}Z`} {...p} />;
}
export function Drawing({
  label,
  width = 480,
  height = 240,
  children,
  minWidth = 310
}) {
  const el = useRef(null),
    [scale, setScale] = useState(1),
    [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const resize = new ResizeObserver(() => {
      setScale(el.current.getBoundingClientRect().width / width);
      setScrollable(el.current.parentElement.scrollWidth > el.current.parentElement.clientWidth + 1);
    });
    resize.observe(el.current);
    resize.observe(el.current.parentElement);
    return () => resize.disconnect();
  }, [width]);
  const direct = Children.toArray(children).filter(isValidElement),
    axis = direct.find(child => child.type === Axis),
    curve = direct.find(child => child.type === Curve);
  const horizontal = axis?.props.xDomain ?? curve?.props.xDomain,
    vertical = axis?.props.yDomain ?? curve?.props.yDomain;
  return <>{axis && <p className="en-axis-labels"><span>Vertical: {axis.props.yLabel}{vertical ? ` [${vertical.map(v => number(v)).join(' to ')}]` : ''}.</span> <span>Horizontal: {axis.props.xLabel}{horizontal ? ` [${horizontal.map(v => number(v)).join(' to ')}]` : ''}.</span></p>}<div className="en-canvas-scroll" tabIndex={0} role="region" aria-label={label + '; scroll horizontally if needed'}><svg ref={el} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{
        minWidth: `${minWidth / 16}rem`,
        fontSize: `calc(1rem / ${scale || 1})`
      }}>{children}</svg></div>{scrollable && <p className="en-scroll-hint">Scroll this drawing horizontally; its labels keep the selected text size.</p>}</>;
}
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = '#aaa',
  dash = false
}) {
  const id = useId().replaceAll(':', '');
  return <><defs><marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={color} /></marker></defs><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" strokeDasharray={dash ? '5 4' : undefined} markerEnd={`url(#${id})`} /></>;
}
export function Axis({
  x = 45,
  y = 190,
  width = 390,
  height = 155,
  xLabel,
  yLabel,
  xDomain,
  yDomain
}) {
  return <><path d={`M${x},${y - height}V${y}H${x + width}`} fill="none" stroke="#999" /></>;
}
export function Curve({
  points,
  xDomain = [0, 1],
  yDomain = [0, 1],
  color = COLORS[0],
  dash = false,
  x = 45,
  y = 190,
  width = 390,
  height = 155
}) {
  const id = useId().replaceAll(':', '');
  const path = points.filter(p => p.every(Number.isFinite)).map(([a, b], i) => `${i ? 'L' : 'M'}${x + (a - xDomain[0]) / (xDomain[1] - xDomain[0]) * width},${y - (b - yDomain[0]) / (yDomain[1] - yDomain[0]) * height}`).join(' ');
  return <><defs><clipPath id={id}><rect x={x} y={y - height} width={width} height={height} /></clipPath></defs><path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={dash ? '6 4' : undefined} clipPath={`url(#${id})`} /></>;
}
export function Table({
  caption,
  headers,
  rows
}) {
  return <div className="en-table-scroll" role="region" aria-label={caption} tabIndex={0}><table><caption>{caption}</caption><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>;
}
export function Strip({
  values,
  labels = LETTERS,
  title,
  capacity = 1,
  identities = null,
  dashed = false
}) {
  return <div className="en-strip-group"><p>{title}</p><div className="en-strip" style={{
      borderStyle: dashed ? 'dashed' : 'solid'
    }} aria-label={values.map((v, i) => `${labels[i]} ${number(v)}`).join('; ')}>{values.map((v, i) => <span key={i} style={{
        width: `${100 * v / capacity}%`,
        background: COLORS[identities?.[i] ?? i % 4]
      }} title={`${labels[i]}: ${number(v)}`}>{v / capacity > .12 && String(labels[i]).length <= 3 ? labels[i] : ''}</span>)}{values.reduce((a, b) => a + b, 0) < capacity && <span className="en-unused" style={{
        flex: 1
      }} />}</div><ul className="en-values">{values.map((v, i) => <li key={i}><b style={{
          color: COLORS[identities?.[i] ?? i % 4]
        }}>{labels[i]}</b> {number(v)}</li>)}</ul></div>;
}
export function Bars({
  rows,
  maximum = 4,
  signed = false,
  title = 'Contributions',
  unit = 'bits'
}) {
  const neg = signed ? maximum : 0,
    total = maximum + neg;
  return <div className="en-bars"><p>{title}; common scale {signed ? '−' : ''}{signed ? maximum + ' to ' : ''}{maximum} {unit}</p>{rows.map((row, i) => {
      const value = typeof row === 'number' ? row : row.value,
        label = typeof row === 'number' ? LETTERS[i] : row.label,
        color = typeof row === 'number' ? COLORS[i % 4] : row.color ?? COLORS[i % 4];
      const visible = Number.isFinite(value) ? Math.max(-neg, Math.min(maximum, value)) : maximum;
      return <div className="en-bar-row" key={i}><span>{label}</span><div className="en-bar-track"><i className="en-zero" style={{
            left: `${neg / total * 100}%`
          }} /><span style={{
            background: color,
            left: `${(neg + Math.min(0, visible)) / total * 100}%`,
            width: `${Math.abs(visible) / total * 100}%`
          }} />{(!Number.isFinite(value) || Math.abs(value) > maximum) && <b className="en-overflow">→</b>}</div><output>{number(value)}{Math.abs(value) > maximum ? ' (beyond axis)' : ''}</output></div>;
    })}</div>;
}
export function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = .01,
  disabled = false
}) {
  const id = useId();
  return <label className="en-control" htmlFor={id}><span>{label}: <output>{number(value)}</output></span><input id={id} aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} disabled={disabled} /></label>;
}
export function Choice({
  label,
  value,
  onChange,
  options
}) {
  const id = useId();
  return <label className="en-control" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option value={o[0]} key={o[0]}>{o[1]}</option>)}</select></label>;
}
export function Draft({
  label,
  value,
  onApply,
  parse
}) {
  const resetIdentity = useContext(DraftResetContext);
  const [draft, setDraft] = useState(String(value)),
    [error, setError] = useState('');
  useEffect(() => {
    setDraft(String(value));
    setError('');
  }, [value, resetIdentity]);
  return <form className="en-draft" onSubmit={e => {
    e.preventDefault();
    try {
      onApply(parse(draft));
      setError('');
    } catch (error) {
      setError(error.message);
    }
  }}><label>{label}<input value={draft} onChange={e => setDraft(e.target.value)} aria-invalid={!!error} /></label><button type="submit">Apply {label}</button>{error && <p role="alert">{error} The drawing retains the last valid value.</p>}</form>;
}
export function Controls({
  children,
  onReset,
  resetIdentity = 0
}) {
  const [localReset, setLocalReset] = useState(0);
  return <DraftResetContext.Provider value={`${resetIdentity}:${localReset}`}><div className="en-controls">{children}{onReset && <button type="button" onClick={() => {
        onReset();
        setLocalReset(n => n + 1);
      }}>Reset investigation</button>}</div></DraftResetContext.Provider>;
}
const DraftResetContext = createContext('0:0');
const StudyContext = createContext();
export function EntropyStudy({
  children
}) {
  const [maximum, setMaximum] = useState({
    mean: 10 / 7,
    fraction: 0
  });
  const [maximumReset, setMaximumReset] = useState(0);
  const resetMaximum = () => {
    setMaximum({
      mean: 10 / 7,
      fraction: 0
    });
    setMaximumReset(n => n + 1);
  };
  return <StudyContext.Provider value={{
    maximum,
    setMaximum,
    maximumReset,
    resetMaximum
  }}>{children}</StudyContext.Provider>;
}
export function useMaximum() {
  return useContext(StudyContext);
}
export function FlowPath({
  title,
  steps,
  identity = 0
}) {
  return <div className="en-flow-path" role="group" aria-label={title} style={{
    '--en-flow-color': COLORS[identity % 4]
  }}>
    <p className="en-flow-title"><span aria-hidden="true">{['●', '■', '▲', '◆'][identity % 4]}</span> {title}</p>
    <ol>{steps.map((step, i) => <li key={i}><span className="en-flow-operation">{step.label}</span><output>{step.value}</output></li>)}</ol>
  </div>;
}
export function CostGap({
  entropy,
  total,
  totalLabel = 'CE',
  parts,
  unit = 'bits',
  title
}) {
  const finite = Number.isFinite(total),
    maximum = Math.max(entropy, finite ? total : entropy, 1) * 1.1;
  let offset = entropy;
  return <div className="en-cost-gap" role="group" aria-label={title}>
    <p>{title}. Aligned length scale: 0–{number(maximum)} {unit}.</p>
    {[{
      label: 'H',
      value: entropy,
      color: COLORS[0]
    }, {
      label: totalLabel,
      value: total,
      color: '#dedad2'
    }].map(row => <div className="en-cost-row" key={row.label}>
      <p>{row.label} = {number(row.value, 8)} {unit}</p>
      <div className="en-cost-ruler"><span style={{
          width: `${100 * (Number.isFinite(row.value) ? row.value : 0) / maximum}%`,
          background: row.color
        }} />{!Number.isFinite(row.value) && <strong className="en-infinite-cost">∞ — extends without a finite endpoint</strong>}</div>
    </div>)}
    <p>Excess starts at H={number(entropy, 8)}: {parts.map(p => `${p.label} ${number(p.value, 8)}`).join(' + ')} {unit}.</p>
    <div className="en-gap-ruler" aria-label="The coloured gap segments begin at entropy on the same aligned scale">
      <i style={{
        left: `${100 * entropy / maximum}%`
      }} />
      {parts.map((part, i) => {
        const left = offset;
        offset += part.value;
        return Number.isFinite(part.value) ? <span key={part.label} style={{
          left: `${100 * left / maximum}%`,
          width: `${100 * part.value / maximum}%`,
          background: COLORS[(i + 1) % 4]
        }} /> : null;
      })}
      {!finite && <strong className="en-infinite-cost">∞ excess: missing model support</strong>}
    </div>
    <div className="en-density-label"><span>0</span><span>{number(maximum)} {unit}</span></div>
    <ul className="en-key">{parts.map((p, i) => <li key={p.label}><span style={{
          color: COLORS[(i + 1) % 4]
        }}>━</span> {p.label}: {number(p.value, 8)} {unit}</li>)}</ul>
    {finite && parts.every(p => Math.abs(p.value) < 1e-12) && <p>Zero excess: both endpoints coincide at H. The vertical marker shows the zero-length gap.</p>}
  </div>;
}
