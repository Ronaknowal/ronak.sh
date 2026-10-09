import { useId, useState } from 'react';
import { FlowControls } from '../LessonFlow.jsx';
import './survival-reading-flow.css';

export const formatNumber = (value, digits = 6) => value == null || !Number.isFinite(value)
  ? 'unavailable' : Number(value.toFixed(digits)).toString().replaceAll('-', '−');
export const colors = { observed: '#7eb3df', computed: '#b998e0', event: '#e2b55a', censor: '#bababa', danger: '#e78d8d', survivor: '#7eb3df', motor: '#e2b55a', seal: '#b998e0' };

export function Drawing({ id, label, children, caption }) {
  return <figure className="survival-drawing" data-survival-drawing={id} aria-label={label}>
    {children}{caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

// A slider and precise numeric editor control ONE quantity. Invalid drafts never enter the model.
export function QuantityControl({ label, value, onChange, min, max, step = .25, reset, unit = '', integer = false }) {
  const id = useId(), [draft, setDraft] = useState(null);
  const text = draft ?? String(value);
  const number = text.trim() === '' ? NaN : Number(text);
  const valid = Number.isFinite(number) && number >= min && number <= max && (!integer || Number.isInteger(number));
  const finish = next => { setDraft(null); onChange(next); };
  return <FlowControls><div className="survival-quantity">
    <label htmlFor={`${id}-range`}>{label} <output htmlFor={`${id}-range ${id}-number`}>{formatNumber(value)} {unit}</output></label>
    <input id={`${id}-range`} type="range" min={min} max={max} step={integer ? step : 'any'} value={value} onChange={event => finish(Number(event.target.value))}
      onKeyDown={event=>{if(integer)return;const direction={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[event.key];if(direction){event.preventDefault();finish(Math.max(min,Math.min(max,value+direction*step)));}else if(event.key==='Home'||event.key==='End'){event.preventDefault();finish(event.key==='Home'?min:max);}}} />
    <label className="survival-number-label" htmlFor={`${id}-number`}>Exact {label.toLowerCase()}</label>
    <input id={`${id}-number`} type="number" min={min} max={max} step="any" value={text} aria-invalid={!valid}
      aria-describedby={!valid ? `${id}-error` : undefined} onChange={event => {
        setDraft(event.target.value);
        const candidate = event.target.value.trim() === '' ? NaN : Number(event.target.value);
        if (Number.isFinite(candidate) && candidate >= min && candidate <= max && (!integer || Number.isInteger(candidate))) onChange(candidate);
      }} />
    {!valid && <span id={`${id}-error`} className="survival-error" role="status">Use {integer ? 'an integer from ' : ''}{min} through {max}; the drawing keeps the last valid value.</span>}
  </div><button type="button" onClick={() => { setDraft(null); reset(); }}>Reset</button></FlowControls>;
}

export function Pump({ id, failed = false, failurePart = 'seal', logger = true, label }) {
  return <div className="survival-pump"><svg viewBox="0 0 160 94" aria-hidden="true">
    <path d="M7 45H35 M121 45H152 M50 69V81H112V69" fill="none" stroke="currentColor" strokeWidth="4" />
    <rect x="32" y="25" width="35" height="42" rx="5" fill="none" stroke={failed && failurePart==='motor' ? colors.danger : colors.observed} strokeWidth="3" />
    <circle cx="91" cy="46" r="28" fill="none" stroke={failed && failurePart==='seal' ? colors.danger : colors.observed} strokeWidth="3" />
    <path d="M69 46H113 M91 25V67" stroke={colors.observed} strokeWidth="2" />
    {failed && <path d={failurePart==='motor'?'M37 30L62 61 M62 30L37 61':'M74 28L106 61 M106 28L74 61'} stroke={colors.danger} strokeWidth="4" />}
    <rect x="112" y="4" width="31" height="18" rx="2" fill="none" stroke={colors.censor} strokeWidth="2" strokeDasharray={logger ? undefined : '4 3'} />
    <path d="M127 22V34H118" fill="none" stroke={colors.censor} strokeWidth="2" />
  </svg><p><strong>{id}</strong> {label}</p><span>Motor → seal · {logger ? 'logger attached' : 'logger removed'}</span></div>;
}

export function TimeAxis({ min = 0, max = 9, ticks = [0, 3, 6, 9], unit = 'days since commissioning' }) {
  return <div className="survival-axis"><div className="survival-axis-ticks">{ticks.map((tick, index) => <span key={tick} style={{ left: `${(tick-min) / (max-min) * 100}%`, transform: index === 0 ? 'none' : index === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{formatNumber(tick)}</span>)}</div><p>{unit}</p></div>;
}

export function Lifelines({ rows, max = 9, cursor, entry = false, unit, ticks, label = 'Observation lanes', eventLabel = 'Recorded failure', endpointLabel = 'Logging endpoint' }) {
  return <div className="survival-lifelines" aria-label={label}>
    {rows.map(row => <div className="survival-lane" key={row.id}>
      <div className="survival-lane-label"><strong>{row.id}</strong><span>{row.note || `${row.event ? 'Failure' : 'Logging ends'} at ${formatNumber(row.time)}`}</span></div>
      <div className="survival-lane-track">
        <span className="survival-lane-known" style={{ left: `${(row.entry ?? 0) / max * 100}%`, width: `${(row.time - (row.entry ?? 0)) / max * 100}%`, background: row.color || colors.observed }} />
        {!row.event && row.unknown !== false && <span className="survival-lane-unknown" style={{ left: `${row.time / max * 100}%`, width: `${(max - row.time) / max * 100}%` }} />}
        {entry && <span className="survival-endpoint" style={{ left: `${(row.entry ?? 0) / max * 100}%` }} />}
        <span className={`survival-endpoint ${row.event ? 'survival-endpoint--event' : ''}`} style={{ left: `${row.time / max * 100}%` }} />
        {cursor != null && <span className="survival-cursor" style={{ left: `${cursor / max * 100}%` }} />}
      </div>
    </div>)}
    <TimeAxis max={max} ticks={ticks || [0, max / 3, 2 * max / 3, max]} unit={unit} />
    <p className="survival-key"><span><i className="survival-key-event" /> {eventLabel}</span><span><i /> {endpointLabel}</span>{rows.some(row=>!row.event&&row.unknown!==false)&&<span>┄ Unobserved future</span>}{cursor != null && <span className="survival-amber">│ Inspected day {formatNumber(cursor)}</span>}</p>
  </div>;
}

export function RiskMembers({ rows, time, caption = 'Immediately before this endpoint', eventIds = [] }) {
  return <div className="survival-risk-members"><p>{caption}</p><div className="survival-roster">{rows.map(row => <div key={row.id} style={row.color?{color:row.color}:undefined} className={`survival-subject ${eventIds.includes(row.id) || (row.event && row.time === time) ? 'survival-subject--event' : ''}`}><svg viewBox="0 0 36 42" aria-hidden="true"><circle cx="18" cy="11" r="8" /><path d="M4 41V31Q4 21 18 21Q32 21 32 31V41" /></svg><strong>{row.id}</strong></div>)}</div>{!rows.length && <p>No observed subject remains in this set.</p>}</div>;
}

export function MassStrip({ segments, label, max = 1 }) {
  return <div className="survival-mass"><p>{label}</p><div className="survival-mass-track" role="img" aria-label={segments.map(s => `${s.label} ${formatNumber(s.value)}`).join('; ')}>{segments.map((segment, index) => <span key={index} style={{ width: `${100 * segment.value / max}%`, background: segment.color || [colors.observed, colors.computed, colors.event][index % 3] }} />)}</div><div className="survival-mass-key">{segments.map((s, index) => <span key={index}><i style={{ background: s.color || [colors.observed, colors.computed, colors.event][index % 3] }} />{s.label}: <strong>{formatNumber(s.value)}</strong></span>)}</div></div>;
}

// SVG contains only geometry. Axis labels are ordinary, reflowable HTML at the reader's text size.
export function CurvePlot({ lines, xMin = 0, xMax = 9, yMin = 0, yMax = 1, xLabel = 'days', yLabel = 'survival probability', xTicks = [xMin, (xMin+xMax) / 2, xMax], yTicks = [yMin, (yMin+yMax) / 2, yMax], cursor, points = [], censorMarks = [], rectangles = [], areas = [], label }) {
  const x = value => 100 * (value-xMin) / (xMax-xMin), y = value => 100 * (1 - (value-yMin) / (yMax-yMin));
  return <div className="survival-plot" role="group" aria-label={label || `${yLabel} against ${xLabel}`}>
    <div className="survival-plot-title">{yLabel}</div>
    <div className="survival-plot-layout"><div className="survival-y-ticks">{yTicks.map(tick => <span key={tick} style={{ top: `${y(tick)}%` }}>{formatNumber(tick, 3)}</span>)}</div>
      <div className="survival-plot-field"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {yTicks.map(tick => <line key={tick} x1="0" x2="100" y1={y(tick)} y2={y(tick)} className="survival-gridline" />)}
        {rectangles.map((r, index) => <rect key={index} x={x(r.start)} y={y(r.height)} width={x(r.end) - x(r.start)} height={100 - y(r.height)} fill={colors.event} opacity=".2" />)}
        {areas.map((area,index)=><polygon key={index} points={area.points.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')} fill={area.color || colors.event} opacity=".2"/>)}
        {lines.map((line, index) => <polyline key={index} points={line.points.map(([a,b]) => `${x(a)},${y(b)}`).join(' ')} fill="none" stroke={line.color || colors.observed} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeDasharray={line.dashed ? '5 4' : undefined} />)}
        {cursor != null && <line x1={x(cursor)} x2={x(cursor)} y1="0" y2="100" stroke={colors.event} strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
      </svg>{points.map((point,index) => <span key={index} className="survival-plot-point" style={{ left: `${x(point[0])}%`, top: `${y(point[1])}%`, background: point[3] === 'open' ? '#090909' : point[2] || colors.event, border: point[3] === 'open' ? `2px solid ${point[2] || colors.event}` : undefined }} />)}
      {censorMarks.map(mark=><span key={mark.id} className={`survival-curve-censor${mark.time===xMax?' survival-curve-censor--end':''}`} style={{left:`${x(mark.time)}%`,top:`${y(mark.survival)}%`}}><i/><span>{mark.id} · {formatNumber(mark.time)}</span></span>)}</div>
    </div><div className="survival-plot-x"><TimeAxis min={xMin} max={xMax} ticks={xTicks} unit={xLabel} /></div>
    <div className="survival-mass-key">{lines.filter(line => line.label).map((line,index) => <span key={index}><i style={{ background: line.color || colors.observed }} />{line.label}</span>)}</div>
  </div>;
}

export function Operation({ children, label }) { return <div className="survival-operation" aria-label={label}>{children}</div>; }
export function Arrow({ label }) { return <span className="survival-operation-arrow"><span aria-hidden="true">→</span>{label && <small>{label}</small>}</span>; }
export function Value({ label, children, color }) { return <span className="survival-value" style={color ? { color } : undefined}><span>{label}</span><strong>{children}</strong></span>; }
export function NumberBars({ rows, max = 1, unit }) { return <div className="survival-number-bars">{rows.map((row,index) => <div key={index}><p>{row.label} <strong>{formatNumber(row.value)} {unit}</strong></p><div className="survival-bar-track"><span style={{ width: `${Math.abs(row.value) / max * 100}%`, background: row.color || colors.observed }} /></div></div>)}</div>; }

export function BinaryStorageTree({levels,label}) {
  const node=(level,index)=><li key={index}><div>{levels[level][index]}</div>{level<levels.length-1&&<ul>{node(level+1,2*index)}{node(level+1,2*index+1)}</ul>}</li>;
  return <div className="survival-binary-container" role="group" aria-label={label}><p>{label}. Each branch combines its two child pools; empty leaves carry zero weight.</p>
    <div className="survival-binary-wide survival-binary-tree">{levels.map((nodes,level)=><div key={level}><div className="survival-binary-level" style={{gridTemplateColumns:`repeat(${nodes.length},minmax(0,1fr))`}}>{nodes.map((node,index)=><div key={index}>{node}</div>)}</div>{level<levels.length-1&&<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">{nodes.map((_,index)=><path key={index} d={`M${100*(index+.5)/nodes.length},0 L${100*(2*index+.5)/(2*nodes.length)},10 M${100*(index+.5)/nodes.length},0 L${100*(2*index+1.5)/(2*nodes.length)},10`} fill="none" stroke={colors.computed} strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>)}</svg>}</div>)}</div>
    <ul className="survival-binary-compact">{node(0,0)}</ul>
  </div>;
}
