import { useEffect, useId, useState } from 'react';
import './cross-attention-flow.css';
export const crossNumber = (value, digits = 6) => value === null || value === undefined || !Number.isFinite(value)
  ? 'undefined' : (value !== 0 && (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e7)
    ? value.toExponential(3) : String(Number(value.toFixed(digits)))).replaceAll('-', '−');
const f = crossNumber;

export function CrossFigure({ job, label, children, caption }) {
  return <figure className="cross-flow-figure" data-cross-drawing={job} aria-label={label}>
    {children}<figcaption>{caption}</figcaption>
  </figure>;
}
export function CrossMatrix({ values, label, rows, columns, role = 'computed', selected, onSelect, binary = false, trueText = 'allowed', falseText = 'blocked', unitScale = false }) {
  return <div className="cross-flow-scroll" role="region" aria-label={label} tabIndex={0}>
    <table className={`cross-flow-matrix cross-role-${role}`}><caption>{label}</caption>
      <thead><tr><th scope="col">row / coordinate</th>{values[0].map((_, j) => <th key={j} scope="col">{columns?.[j] ?? j}</th>)}</tr></thead>
      <tbody>{values.map((row, i) => <tr key={i}><th scope="row">{rows?.[i] ?? i}</th>{row.map((v, j) => {
        const active = selected?.[0] === i && selected?.[1] === j, text = binary ? (v ? trueText : falseText) : (v === null || typeof v === 'number' ? f(v, 6) : String(v));
        const style = unitScale && typeof v === 'number' ? { background: `rgb(${30 + 100 * v} ${25 + 70 * v} ${35 + 120 * v})`, color: '#fff' } : undefined;
        return <td key={j} style={style} data-sign={typeof v === 'number' ? Math.sign(v) : ''} data-selected={active || undefined}>
          {onSelect ? <button type="button" aria-pressed={active} aria-label={`${label}, ${rows?.[i] ?? `row ${i}`}, ${columns?.[j] ?? `coordinate ${j}`}: ${text}`}
            onClick={() => onSelect(i, j)}>{text}</button> : text}
        </td>;
      })}</tr>)}</tbody>
    </table>
  </div>;
}
export function CrossVector({ values, label, role = 'computed' }) {
  return <CrossMatrix values={[values]} label={label} rows={['vector']} role={role} />;
}
export function CrossArrow({ children = 'next operation', branch = false }) {
  return <div className={`cross-flow-arrow${branch ? ' cross-flow-branch-arrow' : ''}`}>
    <svg width="44" height="58" viewBox="0 0 44 58" aria-hidden="true"><path d="M22 0V48m-9-12 9 12 9-12" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
    <span>{children}</span>
  </div>;
}
export function CrossBranches({ children }) { return <div className="cross-flow-branches">{children}</div>; }
export function CrossNumber({ label, value, min, max, integer = false, onChange, syncKey }) {
  const [draft, setDraft] = useState(String(value)), [error, setError] = useState('');
  useEffect(() => { setDraft(String(value)); setError(''); }, [value, label, syncKey]);
  function change(text) {
    setDraft(text);
    const n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
      setError(`Enter ${integer ? 'an integer' : 'a finite number'} from ${min} to ${max}. The last valid state stays visible.`); return;
    }
    setError(''); onChange(n);
  }
  return <label className="cross-flow-number"><span>{label}: <output>{f(value)}</output></span>
    <input aria-label={label} type="number" min={min} max={max} step={integer ? 1 : 'any'} value={draft} onChange={e => change(e.target.value)} />
    {error && <span role="alert">{error}</span>}
  </label>;
}
export function CrossSelect({ label, value, options, onChange }) {
  return <label className="cross-flow-select"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}>
    {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
  </select></label>;
}
export function CrossPixels({ pixels, label, patch = null, selected = null, onSelect }) {
  const raw = pixels.flat();
  const cellWidth = Math.max(2.75, ...raw.map(v => f(v, 3).length * .65 + .3));
  return <div className="cross-flow-scroll" role="region" aria-label={label} tabIndex={0}>
    <div className={`cross-flow-pixels ${onSelect ? 'cross-editable-pixels' : ''}`} style={onSelect ? { '--cross-pixel-width': `${cellWidth}rem` } : undefined} role="group" aria-label={label}>
      {raw.map((v, i) => {
        const p = Math.floor(i / 16) * 4 + Math.floor((i % 8) / 2), active = i === selected, inside = p === patch;
        const style = { background: `rgb(${Math.round(v / 16 * 220 + 20)} ${Math.round(v / 16 * 220 + 20)} ${Math.round(v / 16 * 220 + 20)})`, color: v > 7 ? '#000' : '#fff' };
        const props = { key: i, style, 'data-patch-selected': inside || undefined, 'data-selected': active || undefined,
          'aria-label': `row ${Math.floor(i / 8)}, column ${i % 8}, count ${f(v)}, patch ${p}` };
        return onSelect ? <button {...props} type="button" aria-pressed={active} onClick={() => onSelect(i)}>{f(v, 3)}</button> : <span {...props}>{f(v, 3)}</span>;
      })}
    </div><p>{label}. Rows and columns0–7; raw counts0–16. {patch !== null && `Outlined patch${patch}: rows${2 * Math.floor(patch / 4)}–${2 * Math.floor(patch / 4) + 1}, columns${2 * (patch % 4)}–${2 * (patch % 4) + 1}.`}</p>
  </div>;
}
export function CrossBars({ values, label, labels, maximum = 1 }) {
  return <div className="cross-flow-bars" aria-label={label}><p>{label}; scale0–{f(maximum)}.</p>{values.map((v, i) => <div className="cross-flow-bar-row" key={i}>
    <span>{labels?.[i] ?? i}</span><span className="cross-flow-bar-track"><i style={{ width: `${Math.max(0, Math.min(100, v / maximum * 100))}%` }} /></span><output>{f(v, 6)}</output>
  </div>)}</div>;
}
export function CrossShape({ rows, width, label, role = 'computed' }) {
  return <div className={`cross-flow-shape cross-role-${role}`}>
    <p>{label}: {rows} rows × {width} coordinates</p>
    <svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <path d="M10 10H150V90H10Z" fill="none" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: Math.min(rows, 8) - 1 }, (_, i) => <path key={`r${i}`} d={`M10 ${10 + (i + 1) * 80 / Math.min(rows, 8)}H150`} stroke="currentColor" />)}
      {Array.from({ length: Math.min(width, 12) - 1 }, (_, i) => <path key={`c${i}`} d={`M${10 + (i + 1) * 140 / Math.min(width, 12)} 10V90`} stroke="currentColor" />)}
    </svg><small>Grid silhouette shows at most8 rows and12 coordinates; dimensions above are exact.</small>
  </div>;
}
export function CrossReadWiring({ trace, reader }) {
  const [scale,setScale]=useState(1),marker=useId().replaceAll(':','');
  useEffect(()=>{const update=()=>setScale(parseFloat(getComputedStyle(document.documentElement).fontSize)/16);update();
    const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});window.addEventListener('resize',update);
    return()=>{observer.disconnect();window.removeEventListener('resize',update);};},[]);
  const height=Math.max(trace.query.length,trace.key.length)*140+90,y=i=>90+i*140,selectedY=y(reader)+16;
  const cells=(x,top,values,color,label)=><g><text x={x} y={top-12} fill={color}>{label}</text>{values.map((v,i)=><g key={i}><rect x={x+i*80} y={top} width="76" height="32" fill="#101010" stroke={color}/><text x={x+i*80+6} y={top+22} fill={color}>{f(v,4)}</text></g>)}</g>;
  return <div className="cross-flow-scroll" role="region" tabIndex={0} aria-label={`Reader${reader} wired request,key matching,value products and output`}>
    <svg className="cross-flow-wiring" width={950*scale} height={height*scale} viewBox={`0 0 950 ${height}`} role="img" aria-label={`Selected reader${reader} fans to every key;weighted donor values merge back to its answer`}>
      <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#eee"/></marker></defs>
      <text x="10" y="24">Requests Q</text><text x="275" y="24">Donor keys K</text><text x="495" y="24">Carried V → products</text><text x="775" y="24">Answer rows O</text>
      {trace.key.map((_,i)=><g key={`wire${i}`}><path d={`M166 ${selectedY}H215V${y(i)+16}H270`} stroke="#eee" fill="none" markerEnd={`url(#${marker})`}/>
        {trace.weights[reader]&&<path d={`M660 ${y(i)+74}H710V${selectedY}H745`} stroke="#eee" fill="none" markerEnd={`url(#${marker})`}/>}</g>)}
      {trace.query.map((row,i)=><g key={`q${i}`}>{cells(10,y(i),row,'#82cbd0',`reader${i}${i===reader?' selected':''}`)}{i===reader&&<rect x="7" y={y(i)-3} width="162" height="38" stroke="#fff" strokeWidth="3" fill="none"/>}</g>)}
      {trace.key.map((row,i)=><g key={`donor${i}`}>{cells(275,y(i),row,'#82cbd0',`donor${i} key`)}<text x="275" y={y(i)+65} fill="#c0a0e0">score {f(trace.scores[reader][i],4)}</text>
        {cells(495,y(i),trace.value[i],'#82cbd0',`donor${i} value`)}
        {trace.weights[reader]&&cells(495,y(i)+58,trace.products[reader][i],'#c0a0e0',`× share ${f(trace.weights[reader][i],4)}`)}</g>)}
      <circle cx="755" cy={selectedY} r="12" fill="#080808" stroke="#fff"/><text x="749" y={selectedY+6} fill="#fff">+</text>
      <path d={`M767 ${selectedY}H773`} stroke="#eee" markerEnd={`url(#${marker})`}/>
      {trace.output.map((row,i)=>cells(775,y(i),row??[null,null],'#c0a0e0',`reader${i} answer`))}
    </svg>
  </div>;
}
