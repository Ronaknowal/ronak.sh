import { useEffect, useId, useRef, useState } from 'react';
import { scheduleNumber as n, scheduleIdentity } from '../../data/learning-rate-reading-models.js';
import './learning-rate-reading.css';

export { n, scheduleIdentity };
export const ink = { amber: '#e9b44c', cyan: '#67d4e7', rose: '#ed9cab', violet: '#ba9ee8', grey: '#cbd5e1', white: '#fff' };

export function Figure({ id, caption, children }) {
  return <figure className="lr-figure" data-learning-rate-figure={id} aria-labelledby={`${id}-caption`}>
    {children}<figcaption id={`${id}-caption`}>{caption}</figcaption>
  </figure>;
}

export function Measure({ children }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 560, font: 14 });
  useEffect(() => {
    const update = () => { const next = { width: Math.max(180, ref.current.getBoundingClientRect().width), font: 14 * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 }; setSize(previous => previous.width === next.width && previous.font === next.font ? previous : next); };
    update(); const observer = new ResizeObserver(update); observer.observe(ref.current); observer.observe(document.documentElement);
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return <div className="lr-measure" ref={ref}>{children(size)}</div>;
}

export function Mark({ x, y, colour = ink.amber, shape = 'circle', hollow = false, size = 4 }) {
  const attrs = { fill: hollow ? 'none' : colour, stroke: colour, strokeWidth: 1.8 };
  if (shape === 'square') return <rect x={x - size} y={y - size} width={2 * size} height={2 * size} {...attrs} />;
  if (shape === 'triangle') return <path d={`M${x},${y-size-1}l${size+1},${2*size+1}h${-2*size-2}Z`} {...attrs} />;
  if (shape === 'diamond') return <path d={`M${x},${y-size-1}l${size+1},${size+1}l${-size-1},${size+1}l${-size-1},${-size-1}Z`} {...attrs} />;
  if (shape === 'stair') return <path d={`M${x-size},${y+size}v${-size}h${size}v${-size}h${size}`} fill="none" stroke={colour} strokeWidth="2.6" />;
  return <circle cx={x} cy={y} r={size} {...attrs} />;
}

export function Legend({ entries }) {
  return <ul className="lr-legend">{entries.map(({ label, colour, shape = 'circle', hollow, line, dashed }) => <li key={label}><svg viewBox="0 0 18 18" aria-hidden="true"><>{line?<line x1="1" x2="17" y1="9" y2="9" stroke={colour} strokeWidth="1.8" strokeDasharray={dashed?'4 3':undefined}/>:<Mark x={9} y={9} size={4} colour={colour} shape={shape} hollow={hollow}/>}</></svg><span>{label}</span></li>)}</ul>;
}

export function Plot({ title, series, xLabel = 'Used update u', yLabel = 'Rate η', xDomain, yDomain, selected, boundaries = [], note, xTicks, xTickFormat, yTicks, integerX=true, brackets=[] }) {
  const clipId=useId().replaceAll(':','');
  const all = series.flatMap(s => s.points).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const xd = xDomain || [Math.min(...all.map(p => p.x)), Math.max(...all.map(p => p.x))];
  let yd = yDomain || [Math.min(0,...all.map(p => p.y)), Math.max(0,...all.map(p => p.y))];
  if (yd[0] === yd[1]) yd = yd[0]===0 ? [0,1] : [Math.min(0,yd[0]),yd[1]+1];
  return <div className="lr-plot"><p className="lr-plot-title">{title}</p><p className="lr-axis-name">{yLabel}</p><Measure>{({ width, font }) => {
    const ticksY=yTicks||(yd[0]<0&&yd[1]>0?[yd[0],0,yd[1]]:[yd[0],(yd[0]+yd[1])/2,yd[1]]);
    const left = font * Math.max(5, Math.max(...ticksY.map(v=>n(v,3).length))*.62+1.2), right = font, top = font, bottom = font * 2.2, height = Math.max(190, font * 10.5);
    const x = v => left + (v-xd[0]) / (xd[1]-xd[0] || 1) * (width-left-right);
    const y = v => height-bottom - (v-yd[0])/(yd[1]-yd[0]) * (height-top-bottom);
    const capacity=Math.max(2,Math.floor((width-left-right)/(font*3.2)));
    const lo=integerX?Math.ceil(xd[0]):xd[0],hi=integerX?Math.floor(xd[1]):xd[1];
    const count=integerX?Math.min(capacity,hi-lo+1):Math.min(3,capacity);
    const ticksX=xTicks||Array.from({length:Math.max(1,count)},(_,i)=>integerX?Math.round(lo+(hi-lo)*i/Math.max(1,count-1)):lo+(hi-lo)*i/Math.max(1,count-1));
    return <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${note || ''}`} style={{ fontSize: font }}>
      <defs><clipPath id={clipId}><rect x={left-font*.65} y={top-font*.65} width={width-left-right+font*1.3} height={height-top-bottom+font*1.3}/></clipPath></defs>
      {ticksY.map(v => <g key={v}><line x1={left} x2={width-right} y1={y(v)} y2={y(v)} className={v===0?'lr-axis':'lr-grid'}/><text x={left-font*.95} y={y(v)+font*.35} textAnchor="end">{n(v,3)}</text></g>)}
      {ticksX.map(v => <text key={v} x={x(v)} y={height-font*.35} textAnchor="middle">{xTickFormat?xTickFormat(v):n(v,2)}</text>)}
      {boundaries.filter(b => b.x >= xd[0] && b.x <= xd[1]).map(b => <line key={b.x} x1={x(b.x)} x2={x(b.x)} y1={top} y2={height-bottom} stroke={b.colour || ink.grey} strokeDasharray="4 4" opacity=".6" />)}
      <g clipPath={`url(#${clipId})`}>{series.map((s, i) => <g key={s.label || i}>
        {s.connect !== false && <path d={s.points.map((p,j) => `${j ? (s.step ? `H${x(p.x)}V` : 'L') : 'M'}${j && s.step ? y(p.y) : `${x(p.x)},${y(p.y)}`}`).join(' ')} fill="none" stroke={s.colour || ink.amber} strokeWidth="1.5" opacity=".75" strokeDasharray={s.dashed ? '5 4' : undefined}/>}
        {s.markers!==false&&s.points.map((p,j) => <Mark key={j} x={x(p.x)} y={y(p.y)} size={font*.24} colour={s.colour || ink.amber} shape={s.shape} hollow={p.hollow}/>)}
      </g>)}
      {selected && <circle cx={x(selected.x)} cy={y(selected.y)} r={font*.55} fill="none" stroke="white" strokeWidth="2"/>}</g>
    </svg>;
  }}</Measure><p className="lr-x-name">{xLabel}</p>{brackets.length>0&&<IntervalBands domain={xd} bands={brackets}/>}<Legend entries={series.filter(s=>s.legend!==false).map(s => ({ label: s.label, colour: s.colour || ink.amber, shape: s.shape,hollow:s.points.every(p=>p.hollow),line:s.markers===false,dashed:s.dashed }))}/></div>;
}

export function IntervalBands({domain,bands}) {
  return <div className="lr-intervals">{bands.map((b,i)=><div key={i}><Measure>{({width,font})=>{const left=font*5,right=font,x=v=>left+(v-domain[0])/(domain[1]-domain[0]||1)*(width-left-right);return <svg width="100%" height={font*1.4} aria-hidden="true"><path d={`M${x(b.start)},2v${font*.6}H${x(b.end)}V2`} fill="none" stroke={b.colour||ink.grey}/></svg>;}}</Measure><p>{b.label}</p></div>)}</div>;
}

export function PointRuler({title,domain,ticks,rows,interval}) {
  return <div className="lr-point-ruler"><p className="lr-plot-title">{title}</p><Measure>{({width,font})=>{const pad=font*2,x=v=>pad+(v-domain[0])/(domain[1]-domain[0])*(width-2*pad),h=font*3;return <svg width="100%" height={h} style={{fontSize:font}} role="img" aria-label={title}><line x1={pad} x2={width-pad} y1={font} y2={font} className="lr-axis"/>{interval&&<line x1={x(interval[0])} x2={x(interval[1])} y1={font} y2={font} stroke={ink.cyan} strokeWidth="3"/>}{ticks.map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1={font-5} y2={font+5} className="lr-axis"/><text x={x(v)} y={font*2.5} textAnchor="middle">{n(v,6)}</text></g>)}</svg>;}}</Measure>{rows.map((r,i)=><div key={i} className="lr-point-row"><p>{r.label}</p><Measure>{({width,font})=>{const pad=font*2,x=v=>pad+(v-domain[0])/(domain[1]-domain[0])*(width-2*pad),h=font*2.2;return <svg width="100%" height={h} role="img" aria-label={r.label}><line x1={pad} x2={width-pad} y1={h/2} y2={h/2} className="lr-grid"/>{r.from!==undefined&&<><Mark x={x(r.from)} y={h/2} size={font*.22} colour={ink.grey} shape="square"/><line x1={x(r.from)} x2={x(r.value)} y1={h/2} y2={h/2} stroke={r.colour||ink.amber}/>{r.value!==r.from&&<path d={`M${x(r.value)+(r.value>r.from?-6:6)},${h/2-4}L${x(r.value)},${h/2}l${r.value>r.from?-6:6},4`} fill="none" stroke={r.colour||ink.amber}/>}</>}<Mark x={x(r.value)} y={h/2} size={font*.34} colour={r.colour||ink.amber} shape={r.shape} hollow={r.hollow}/></svg>;}}</Measure></div>)}</div>;
}

export function Flow({title,nodes}) {
  return <div className="lr-flow"><p className="lr-plot-title">{title}</p><ol>{nodes.map((node,i)=><li key={i} style={{'--flow-colour':node.colour||ink.grey}}><span className="lr-flow-pin" aria-hidden="true">{node.decision?'◇':'□'}</span><strong>{node.label}</strong>{node.detail&&<p>{node.detail}</p>}</li>)}</ol></div>;
}

export function Fork({source,branches}) {
  return <div className="lr-fork"><p className="lr-fork-source">{source}</p><div className="lr-fork-branches">{branches.map((branch,i)=><div key={i}><p><strong>{branch.label}</strong></p><p>{branch.detail}</p></div>)}</div></div>;
}

export function Dependencies({title,rows,target}) {
  return <div className="lr-dependencies"><p className="lr-plot-title">{title}</p><Measure>{({width,font})=>{const stacked=width<26*font;return <div>{rows.map((r,i)=><div className="lr-dependency-row" style={stacked?{gridTemplateColumns:'1fr'}:undefined} key={i}><div><strong>{r[0]}</strong><p>{r[1]}</p></div><span aria-hidden="true">{stacked?'↓':'→'}</span><div>{r[2]}</div></div>)}</div>;}}</Measure><p className="lr-dependency-target">↓ {target}</p></div>;
}

export function SumBar({title,terms,maximum,unit}) {
  const total=terms.reduce((s,r)=>s+r.value,0);
  return <div className="lr-sum"><p className="lr-plot-title">{title}</p><p>{terms.map(r=>`${r.label} ${n(r.value,9)}`).join(' + ')} = {n(total,9)} {unit}</p><div className="lr-sum-scale"><div className="lr-sum-total" style={{width:`${100*total/maximum}%`}}>{terms.map((r,i)=><span key={i} style={{width:`${100*r.value/total}%`,background:r.colour}}/>)}</div></div><div className="lr-scale-labels"><span>0</span><span>{n(maximum)} {unit}</span></div><Legend entries={terms.map(r=>({label:`${r.label}: ${n(r.value,9)}`,colour:r.colour}))}/></div>;
}

export function Ruler({ before, after, domain, label = 'Signed error', colour = ink.amber, beforeLabel='Before', afterLabel='After' }) {
  const d = domain || [Math.min(-1,before,after), Math.max(1,before,after)];
  return <div><p className="lr-axis-name">{label}</p><Measure>{({width,font}) => {
    const pad = font*2, x = v => pad+(v-d[0])/(d[1]-d[0])*(width-pad*2), h=font*7;
    return <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label={`${label}: ${beforeLabel} ${n(before)}; ${afterLabel} ${n(after)}.`} style={{fontSize:font}}>
      <line x1={pad} x2={width-pad} y1={h/2} y2={h/2} className="lr-axis"/>
      {[d[0],0,d[1]].filter((v,i,a)=>a.indexOf(v)===i).map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1={h/2-5} y2={h/2+5} className="lr-axis"/><text x={x(v)} y={h/2+font*1.8} textAnchor="middle">{n(v,2)}</text></g>)}
      <line x1={x(before)} x2={x(after)} y1={font*1.7} y2={font*1.7} stroke={colour} strokeWidth="2"/>
      {after!==before && <path d={`M${x(after)+(after>before?-6:6)},${font*1.7-5}L${x(after)},${font*1.7}l${after>before?-6:6},5`} stroke={colour} fill="none" strokeWidth="2"/>}
      <line x1={x(before)} x2={x(before)} y1={font*1.7} y2={h/2} stroke={ink.grey} strokeDasharray="3 3"/>
      <line x1={x(after)} x2={x(after)} y1={font*1.7} y2={h/2} stroke={colour} strokeDasharray="3 3"/>
      <Mark x={x(before)} y={h/2} colour={ink.grey} shape="square" size={font*.25}/><Mark x={x(after)} y={h/2} colour={colour} hollow size={font*.38}/>
    </svg>;
  }}</Measure><Legend entries={[{label:`${beforeLabel} ${n(before)}`,colour:ink.grey,shape:'square'},{label:`${afterLabel} ${n(after)}`,colour,hollow:true}]}/></div>;
}

export function ClockMark({kind}) {
  const colour=kind==='committed'?ink.amber:kind==='rejected'?ink.rose:kind==='validation'?ink.cyan:ink.grey;
  return <svg className="lr-clock-mark" viewBox="0 0 18 18" aria-hidden="true" focusable="false" data-clock-mark={kind}>
    {kind==='microbatch'?<path d="M9 3v12" stroke={colour} strokeWidth="2"/>:kind==='validation'?<circle cx="9" cy="9" r="6" fill="none" stroke={colour} strokeWidth="2"/>:kind==='exhausted'?<g stroke={colour} strokeWidth="1.8" fill="none"><rect x="3" y="3" width="12" height="12"/><path d="M5 9h8"/></g>:<g stroke={colour} strokeWidth="1.8"><path d="M9 2l7 7-7 7-7-7Z" fill={kind==='committed'?colour:'none'}/>{kind==='rejected'&&<path d="M5 5l8 8M13 5l-8 8"/>}</g>}
  </svg>;
}

export function Ledger({ caption, headers, rows }) {
  const ref=useRef(null),[overflow,setOverflow]=useState(false),id=useId();
  useEffect(()=>{const el=ref.current;const update=()=>setOverflow(el.scrollWidth>el.clientWidth+1);update();const observer=new ResizeObserver(update);observer.observe(el);observer.observe(el.querySelector('table'));return()=>observer.disconnect();},[rows,headers]);
  return <div className="lr-ledger-container">{overflow&&<p className="lr-scroll-hint" id={id}>More columns → Swipe horizontally, or focus the table and use ← / →.</p>}<div ref={ref} className="lr-ledger" role="region" aria-label={caption} aria-describedby={overflow?id:undefined} tabIndex={0}><table><caption>{caption}</caption><thead><tr>{headers.map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=>j===0?<th scope="row" key={j}>{v}</th>:<td key={j}>{v}</td>)}</tr>)}</tbody></table></div></div>;
}

export function NumberControl({ label, value, onChange, min, max, integer=false, step='any' }) {
  const id=useId(), [draft,setDraft]=useState(String(value)), [error,setError]=useState('');
  useEffect(()=>{setDraft(String(value));setError('');},[value]);
  return <label className="lr-input" htmlFor={id}><span id={`${id}-label`}>{label}</span><input id={id} aria-labelledby={`${id}-label`} type="number" min={min} max={max} step={integer?1:step} inputMode={integer?'numeric':'decimal'} value={draft} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} onKeyDown={event=>{if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;event.preventDefault();const delta=integer?1:step==='any'?.01:Number(step);const next=Math.max(min,Math.min(max,value+(event.key==='ArrowUp'?delta:-delta)));setDraft(String(next));setError('');onChange(next);}} onChange={event=>{
    const text=event.target.value;setDraft(text);
    if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim())){setError('Enter a complete finite number. The diagram keeps the last valid value.');return;}
    const parsed=Number(text);if(!Number.isFinite(parsed)||parsed<min||parsed>max||(integer&&!Number.isInteger(parsed))){setError(`Use ${integer?'an integer':'a number'} from ${min} to ${max}. The last valid result is retained.`);return;}
    setError('');onChange(parsed);
  }}/><small id={`${id}-help`}>{error||`${min} to ${max}${integer?'; whole numbers':''}`}</small></label>;
}

export function SelectControl({ label, value, options, onChange }) {const id=useId();return <label className="lr-input" htmlFor={id}><span id={`${id}-label`}>{label}</span><select id={id} aria-labelledby={`${id}-label`} value={String(value)} onChange={e=>onChange(e.target.value)}>{options.map(([v,name])=><option key={v} value={v}>{name}</option>)}</select></label>;}
export function Controls({ children, reset }) {return <div className="lr-controls">{children}<button type="button" onClick={reset}>Reset</button></div>;}
export function Readout({ children }) {return <p className="lr-readout" aria-live="polite" aria-atomic="true">{children}</p>;}
export function Steps({ items }) {return <ol className="lr-steps">{items.map((v,i)=><li key={i}>{v}</li>)}</ol>;}
