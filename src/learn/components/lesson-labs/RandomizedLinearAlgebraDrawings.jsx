import { useId } from 'react';
import './randomized-linear-algebra-flow.css';

export const ink = ['#e5bb69', '#87c7e0', '#dc97ac', '#b7abd9'];
export const fmt = value => value === null || value === undefined ? 'undefined' : typeof value==='string' ? value : value===0 ? '0' : Math.abs(value)<1e-5 || Math.abs(value)>1e6 ? value.toExponential(3) : Number(value.toPrecision(6)).toString();
export const tr = matrix => matrix.length ? matrix[0].map((_, j) => matrix.map(row => row[j])) : [];
export const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
export const mul = (a,b) => a.map(row => tr(b).map(column => dot(row,column)));
export const sub = (a,b) => a.map((row,i) => row.map((x,j) => x-b[i][j]));
export const diag = values => values.map((x,i) => values.map((_,j) => i===j ? x : 0));
export const sq = matrix => matrix.flat().reduce((s,x) => s+x*x,0);

export function Figure({ title, caption, children, id }) {
  return <figure className="rla-flow-figure" data-rla-mechanism={id}><div className="rla-flow-title">{title}</div>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Scene({ title, description, width=440, height=290, children }) {
  const id=useId();
  return <div className="rla-scene-scroll" role="region" tabIndex={0} aria-label={`${title}; drawing scroll region`}><svg viewBox={`0 0 ${width} ${height}`} style={{width:`${width/16}rem`,minWidth:`${width/16}rem`}} role="img" aria-labelledby={`${id}-title ${id}-desc`}><title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{description}</desc>{children}</svg></div>;
}
export function Matrix({ matrix, label, columnColors=true, selectedRow=null, selectedColumn=null }) {
  if (!matrix.length || !matrix[0]?.length) return <p>{label}: empty coordinate array.</p>;
  const cells=matrix.flat().map(fmt), cell=Math.max(65,Math.max(...cells.map(s=>s.length))*9+20), height=matrix.length*38+58, width=matrix[0].length*cell+58;
  return <div className="rla-array"><span className="rla-array-name">{label} · {matrix.length}×{matrix[0].length}</span><Scene title={label} description="Complete numeric array. Row and column addresses start at zero; color preserves column identity." width={width} height={height}><path d={`M38 37H28V${height-16}H38 M${width-20} 37H${width-10}V${height-16}H${width-20}`} fill="none" stroke="#9fa9b8"/>{matrix[0].map((_,j)=><text key={j} x={48+cell*(j+.5)} y="22" textAnchor="middle" fill={columnColors?ink[j%4]:'#b6bdc8'}>j{j}</text>)}{matrix.map((row,i)=><g key={i}><text x="16" y={62+i*38} textAnchor="middle" fill="#b6bdc8">i{i}</text>{row.map((x,j)=><g key={j}>{(i===selectedRow||j===selectedColumn)&&<rect x={48+j*cell} y={40+i*38} width={cell} height="35" fill={ink[j%4]} opacity=".12"/>}<text x={48+cell*(j+.5)} y={62+i*38} textAnchor="middle" fill={columnColors?ink[j%4]:'#e0e2e7'}>{fmt(x)}</text></g>)}</g>)}</Scene></div>;
}
export function Matrices({ items }) { return <div className="rla-array-sequence">{items.map(([label,matrix],i)=><Matrix key={i} label={label} matrix={matrix}/>)}</div>; }
export function Table({ label, headers, rows, tall=false }) {
  return <><div className="rla-array-name">{label}</div><p className="rla-window-hint">{tall?'All rows retained. ':''}Focus the table and use arrow keys to read its full extent.</p><div className={`rla-table-scroll${tall?' rla-table-scroll--tall':''}`} role="region" tabIndex={0} aria-label={label}><table><caption>{label}</caption><thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{typeof v==='number'||v===null||v===undefined?fmt(v):v}</td>)}</tr>)}</tbody></table></div></>;
}
export function Plane({ title, vectors=[], segments=[], points=[], domain=[-4,4], unitCircle=false, mapCircle=null, rightAngle=null, xLabel='coordinate 1', yLabel='coordinate 2' }) {
  const [lo,hi]=domain, scale=270/(hi-lo), xy=p=>[65+(p[0]-lo)*scale,335-(p[1]-lo)*scale], origin=xy([0,0]);
  const ticks=[...new Set([lo,(lo+hi)/2,hi,...(lo<=0&&hi>=0?[0]:[])])].sort((a,b)=>a-b);
  const circle=map=>Array.from({length:97},(_,i)=>{const t=i*2*Math.PI/96;return xy(map([Math.cos(t),Math.sin(t)])).join(',');}).join(' ');
  return <><Scene title={title} width={430} height={390} description={`Equal coordinate scales from ${lo} to ${hi}. Solid arrows are vector actions; dashed connectors show residuals. Numeric values follow.`}><path d={`M65 ${origin[1]}H335 M${origin[0]} 65V335`} stroke="#707988" fill="none"/>{ticks.map(t=><g key={t}><text x={xy([t,0])[0]} y="357" textAnchor="middle" fill="#aeb8c7">{fmt(t)}</text><text x="52" y={xy([0,t])[1]+4} textAnchor="end" fill="#aeb8c7">{fmt(t)}</text></g>)}<text x="200" y="383" textAnchor="middle" fill="#c6cad2">{xLabel}</text><text x="65" y="43" fill="#c6cad2">{yLabel}</text>{unitCircle&&<polyline points={circle(p=>p)} fill="none" stroke="#a2acb9"/>}{mapCircle&&<polyline points={circle(mapCircle)} fill="none" stroke={ink[1]} strokeWidth="2"/>}{[...vectors.map((v,i)=>({...v,from:v.from||[0,0],to:v.to,color:v.color||ink[i%4]})),...segments].map((v,i)=>{const a=xy(v.from),b=xy(v.to),t=Math.atan2(b[1]-a[1],b[0]-a[0]);return <g key={i}><title>{`${v.name}: [${v.from.map(fmt).join(', ')}] to [${v.to.map(fmt).join(', ')}]`}</title><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={v.color||ink[i%4]} strokeWidth="2" strokeDasharray={v.dashed?'4 4':undefined}/>{!v.dashed&&Math.hypot(b[0]-a[0],b[1]-a[1])>1&&<polygon points={[b,[b[0]-8*Math.cos(t-.4),b[1]-8*Math.sin(t-.4)],[b[0]-8*Math.cos(t+.4),b[1]-8*Math.sin(t+.4)]].map(p=>p.join(',')).join(' ')} fill={v.color||ink[i%4]}/>}</g>;})}{rightAngle&&<path d={`M${xy(rightAngle)[0]-11} ${xy(rightAngle)[1]}v-11h11`} fill="none" stroke="#eef0f4"/>}{points.map((p,i)=><circle key={i} cx={xy(p)[0]} cy={xy(p)[1]} r="3" fill={ink[i%4]}/>)}</Scene><Table label={`${title}: exact vector coordinates`} headers={['Trace','Start','End']} rows={[...vectors,...segments].map(v=>[v.name,(v.from||[0,0]).map(fmt).join(', '),v.to.map(fmt).join(', ')])}/></>;
}
export function Bars({ title, values, labels, maximum=null, reference=null, unit='', colors=ink }) {
  const max=maximum??Math.max(1,...values.map(Math.abs),Math.abs(reference||0)), slot=Math.max(68,...values.map((v,i)=>Math.max(String(labels?.[i]??i+1).length,fmt(v).length)*9+24)), width=Math.max(440,values.length*slot+90), base=220;
  return <Scene title={title} width={width} height={300} description={`Bar heights use a common scale with maximum ${fmt(max)} ${unit}; reference line ${reference===null?'none':fmt(reference)}.`}><path d={`M55 35V${base}H${width-20}`} stroke="#788492" fill="none"/><text x="55" y="22" fill="#b9c0ca">{unit} · maximum {fmt(max)}</text>{reference!==null&&<><line x1="55" x2={width-20} y1={base-170*reference/max} y2={base-170*reference/max} stroke="#dae0e7" strokeDasharray="5 4"/><text x={width-22} y={base-170*reference/max-7} textAnchor="end" fill="#dae0e7">reference {fmt(reference)}</text></>}{values.map((v,i)=>{const x=75+slot*i,h=170*Math.abs(v)/max,refY=reference===null?null:base-170*reference/max,ordinaryY=base-h-9,valueY=refY!==null&&refY>=ordinaryY-14&&refY<=ordinaryY+4?refY-9:ordinaryY;return <g key={i}><rect x={x} y={base-h} width="32" height={h} fill={colors[i%colors.length]}/><text x={x+16} y={valueY} textAnchor="middle" fill={colors[i%colors.length]}>{fmt(v)}</text><text x={x+16} y={base+25} textAnchor="middle" fill="#d0d4dc">{labels?.[i]??i+1}</text></g>;})}</Scene>;
}
export function Contraction({ title, left, right, leftLabel, rightLabel }) {
  const products=left.map((v,i)=>v*right[i]); let total=0;
  const sums=products.map(v=>(total+=v));
  const all=[...left,...right,...products,...sums], cell=Math.max(92,...all.map(v=>fmt(v).length*9+24));
  const a=60,b=a+cell+50,op=b+cell+40,product=op+38,plus=product+cell+42,running=plus+35,width=running+cell+30,height=100+left.length*76;
  return <Scene title={title} width={width} height={height} description={`Paired zero-based addresses select ${leftLabel} and ${rightLabel}. Each multiply feeds an addition with the previous partial sum, starting at zero. Final value ${fmt(total)}.`}>
    <text x={a} y="24" fill={ink[0]}>{leftLabel}</text><text x={b} y="24" fill={ink[1]}>{rightLabel}</text><text x={product} y="24" fill="#d0d7e2">product</text><text x={running} y="24" fill="#d0d7e2">partial sum</text>
    {left.map((v,i)=>{const y=70+i*76;return <g key={i}>
      <text x="22" y={y+5} fill={ink[i%4]}>j{i}</text>
      <rect x={a} y={y-18} width={cell} height="36" fill={ink[0]} fillOpacity=".09" stroke={ink[0]}/><text x={a+cell/2} y={y+5} textAnchor="middle" fill={ink[0]}>{fmt(v)}</text>
      <rect x={b} y={y-18} width={cell} height="36" fill={ink[1]} fillOpacity=".09" stroke={ink[1]}/><text x={b+cell/2} y={y+5} textAnchor="middle" fill={ink[1]}>{fmt(right[i])}</text>
      <path d={`M${a+cell} ${y}h15v-28H${op}v16 M${b+cell} ${y}H${op-12}`} fill="none" stroke={ink[i%4]}/><circle cx={op} cy={y} r="12" fill="#080808" stroke="#b8c2cf"/><text x={op} y={y+5} textAnchor="middle" fill="#e4e8ee">×</text>
      <path d={`M${op+12} ${y}H${product} M${product+cell} ${y}H${plus-12} M${plus+12} ${y}H${running}`} fill="none" stroke={ink[i%4]}/>
      <rect x={product} y={y-18} width={cell} height="36" fill="none" stroke={ink[i%4]}/><text x={product+cell/2} y={y+5} textAnchor="middle" fill={ink[i%4]}>{fmt(products[i])}</text>
      <circle cx={plus} cy={y} r="12" fill="#080808" stroke="#b8c2cf"/><text x={plus} y={y+5} textAnchor="middle" fill="#e4e8ee">+</text>
      {i===0?<text x={plus} y={y-21} textAnchor="middle" fill="#cbd2dd">0</text>:<path d={`M${running+cell/2} ${y-58}v15H${plus}v31`} fill="none" stroke="#cbd2dd" strokeDasharray="3 3"/>}
      <rect x={running} y={y-18} width={cell} height="36" fill={ink[i%4]} fillOpacity=".1" stroke={ink[i%4]}/><text x={running+cell/2} y={y+5} textAnchor="middle" fill={ink[i%4]}>{fmt(sums[i])}</text>
    </g>;})}
    <text x={running} y={height-9} fill="#e7edf5">sum = {fmt(total)}</text>
  </Scene>;
}

export function LossAreas({ range, truncation, floor, title='Squared reconstruction contributions', maximum=null }) {
  const max=maximum??Math.max(1,range+truncation,floor), a=330*range/max,b=330*truncation/max;
  return <><Scene title={title} width={440} height={145} description="One shared horizontal length scale maps squared residual to rectangle area, with equal fixed height. Amber is missed range; rose is discarded inside-range information."><text x="40" y="24" fill="#cbd0d8">Squared error · shared scale 0–{fmt(max)}</text><rect x="40" y="45" width={a} height="34" fill={ink[0]}/><rect x={40+a} y="45" width={b} height="34" fill={ink[2]}/><line x1={40+330*floor/max} x2={40+330*floor/max} y1="36" y2="90" stroke="#dee1e7" strokeDasharray="4 4"/><text x="40" y="122" fill="#cbd0d8">Rank floor · {fmt(floor)}</text></Scene><Table label={title} headers={['Range outside Q','Discarded within Q','Total','Rank floor']} rows={[[range,truncation,range+truncation,floor]]}/></>;
}
export function Squares({ values, labels, maximum=null, title='Entry-square contributions' }) {
  const max=maximum??Math.max(1,...values.map(Math.abs)), side=70/max,slot=Math.max(100,...values.map((v,i)=>`${labels?.[i]??i}: ${fmt(v*v)}`.length*9+24)),width=Math.max(440,values.length*slot+40);
  return <Scene title={title} width={width} height={145} description="Each square side is proportional to absolute value, so its area is proportional to the squared value.">{values.map((v,i)=><g key={i}><rect x={30+i*slot} y={90-Math.abs(v)*side} width={Math.abs(v)*side} height={Math.abs(v)*side} fill={ink[i%4]} opacity=".8"/><text x={30+i*slot} y="120" fill="#d0d4dc">{labels?.[i]??i}: {fmt(v*v)}</text></g>)}</Scene>;
}
