import { useId } from 'react';
import './convex-optimization-flow.css';

export const ink = ['#e5bb69', '#87c7e0', '#b7abd9', '#dc97ac'];
export const fmt = value => value === null || value === undefined ? 'undefined' : typeof value === 'string' ? value : !Number.isFinite(value) ? String(value) : Math.abs(value)<1e-12 ? '0' : Math.abs(value)>1e5 || Math.abs(value)<1e-4 ? value.toExponential(3) : String(Number(value.toFixed(6))).replace(/-/g,'−');
export const sample = (fn,lo,hi,n=100) => Array.from({length:n+1},(_,i)=>{const x=lo+(hi-lo)*i/n;return [x,fn(x)];});
export function Figure({id,title,caption,children}){return <figure className="cvx-figure" data-cvx-mechanism={id} aria-label={title}><div className="cvx-title">{title}</div>{children}<figcaption>{caption}</figcaption></figure>;}
export function Scene({title,width=520,height=400,description,children}){const id=useId();return <div className="cvx-scroll" role="region" tabIndex={0} aria-label={`${title}: full drawing; arrow keys scroll`}><svg role="img" aria-labelledby={id} viewBox={`0 0 ${width} ${height}`} style={{'--cvx-width':`${width/16}rem`}}><title id={id}>{title}</title><desc>{description}</desc>{children}</svg></div>;}
export function Table({title,headers,rows,className=''}){return <div className={`cvx-scroll ${className}`.trim()} role="region" tabIndex={0} aria-label={`${title}: full table; arrow keys scroll`}><table className="cvx-table"><caption>{title}</caption><thead><tr>{headers.map((x,i)=><th key={i} scope="col">{x}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((x,j)=><td key={j}>{Array.isArray(x)?x.map(fmt).join(', '):fmt(x)}</td>)}</tr>)}</tbody></table></div>;}
export function Legend({items}){return <div className="cvx-legend">{items.map(([text,color],i)=><span key={i} style={{'--cvx-ink':color||ink[i%4]}}>{text}</span>)}</div>;}
export function Arrow({from,to,color=ink[0],dashed=false}){const a=Math.atan2(to[1]-from[1],to[0]-from[0]),length=Math.hypot(to[0]-from[0],to[1]-from[1]);return <g><line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth="2" strokeDasharray={dashed?'5 4':undefined}/>{length>1&&!dashed&&<polygon points={[to,[to[0]-9*Math.cos(a-.35),to[1]-9*Math.sin(a-.35)],[to[0]-9*Math.cos(a+.35),to[1]-9*Math.sin(a+.35)]].map(p=>p.join(',')).join(' ')} fill={color}/>}</g>;}
export const pathData = (points,xy) => points.map((p,i)=>`${i?'L':'M'}${xy(p).join(' ')}`).join(' ');
const ticks=(lo,hi)=>[...new Set([lo,(lo+hi)/2,hi,...(lo<=0&&hi>=0?[0]:[])])].sort((a,b)=>a-b);

// Equal units in both directions whenever Euclidean geometry is being compared.
export function Plane({title,domain=[-1,5],curves=[],points=[],vectors=[],polygons=[],children,xLabel='first coordinate',yLabel='second coordinate'}){
 const [lo,hi]=domain,scale=280/(hi-lo),xy=([x,y])=>[90+(x-lo)*scale,340-(y-lo)*scale],o=xy([0,0]);
 return <div className="cvx-object"><Scene title={title} height={420} description={`Equal coordinate scales: both axes ${lo} to ${hi}. All points, segments and allowed polygons have the declared coordinates.`}>
 {polygons.map((p,i)=><polygon key={i} points={p.points.map(q=>xy(q).join(',')).join(' ')} fill={p.fill||p.color||ink[1]} fillOpacity={p.opacity??.12} stroke={p.color||ink[1]} strokeDasharray={p.dashed?'4 4':undefined}/>)}
 <path className="cvx-axis" d={`M90 ${o[1]}H370 M${o[0]} 60V340`}/>
 {ticks(lo,hi).map(t=><g key={t}><text x={xy([t,0])[0]} y={t===lo?385:367} textAnchor="middle">{fmt(t)}</text><text x="78" y={xy([0,t])[1]+(t===lo?23:t===hi?-15:5)} textAnchor="end">{fmt(t)}</text></g>)}
 <text x="230" y="407" textAnchor="middle">{xLabel}</text><text x="90" y="32">{yLabel}</text>
 {curves.map((c,i)=><path key={i} d={pathData(c.points,xy)} fill="none" stroke={c.color||ink[i%4]} strokeWidth="2.2" strokeDasharray={c.dashed?'5 4':undefined}/>)}
 {vectors.map((v,i)=><Arrow key={i} from={xy(v.from||[0,0])} to={xy(v.to)} color={v.color||ink[i%4]} dashed={v.dashed}/>)}
 {points.map((p,i)=>{const q=xy(p.point||p),color=p.color||'#edf0f6';return <g key={i}>{p.cross?<path d={`M${q[0]-5} ${q[1]-5}l10 10m-10 0l10-10`} stroke={color} strokeWidth="2.4"/>:<circle cx={q[0]} cy={q[1]} r="5" fill={p.filled?color:'#080808'} stroke={color} strokeWidth="2"/>}{p.label&&<><path d={`M${q}L${p.slot?.[0]||430} ${p.slot?.[1]||90+i*38}`} stroke={color} strokeDasharray="3 3" fill="none"/><text x={p.slot?.[0]||430} y={(p.slot?.[1]||90+i*38)-7} textAnchor="end">{p.label}</text></>}</g>;})}
 {children?.(xy)}
 </Scene>{vectors.some(v=>v.label)&&<Table title={`${title}: actual displacement vectors`} headers={['Role','From','To']} rows={vectors.map(v=>[v.label,v.from||[0,0],v.to])}/>}</div>;
}
export function Curve({title,series,xDomain=[-2,2],yDomain=null,xLabel='input x',yLabel='cost',points=[],segments=[],polygons=[],children,segmentLabelMode='leader'}){
 const values=series.flatMap(s=>s.points.map(p=>p[1])).concat(points.map(p=>(p.point||p)[1]),segments.flatMap(s=>[s.from[1],s.to[1]]));
 const rawlo=Math.min(...values),rawhi=Math.max(...values),pad=Math.max(.2,(rawhi-rawlo)*.1),[lo,hi]=yDomain||[rawlo-pad,rawhi+pad],xy=([x,y])=>[90+(x-xDomain[0])/(xDomain[1]-xDomain[0])*300,320-(y-lo)/(hi-lo)*250];
 return <Scene title={title} height={segmentLabelMode==='footer'?450:410} description={`Horizontal ${xLabel} ${xDomain.join(' to ')}; vertical ${yLabel} ${fmt(lo)} to ${fmt(hi)}. Shared scales for every displayed curve and connector.`}>
 {polygons.map((p,i)=><polygon key={i} points={p.points.map(q=>xy(q).join(',')).join(' ')} fill={p.color||ink[1]} fillOpacity=".1"/>)}
 <path className="cvx-axis" d="M90 70V320H390"/>
 {ticks(...xDomain).map(t=><text key={t} x={xy([t,lo])[0]} y={t===xDomain[0]?365:347} textAnchor="middle">{fmt(t)}</text>)}
 {ticks(lo,hi).map(t=><g key={t}><path className="cvx-grid" d={`M90 ${xy([0,t])[1]}H390`}/><text x="77" y={xy([0,t])[1]+(t===lo?23:t===hi?-15:5)} textAnchor="end">{fmt(t)}</text></g>)}
 <text x="90" y="34">{yLabel}</text><text x="240" y="394" textAnchor="middle">{xLabel}</text>
 {series.map((s,i)=><path key={i} d={pathData(s.points,xy)} fill="none" stroke={s.color||ink[i%4]} strokeWidth="2.2" strokeDasharray={s.dashed?'5 4':undefined}/>)}
 {segments.map((s,i)=>{const a=xy(s.from),b=xy(s.to),middle=[(a[0]+b[0])/2,(a[1]+b[1])/2];return <g key={i}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={s.color||ink[3]} strokeWidth="3"/>{s.label&&segmentLabelMode!=='footer'&&<><path d={`M${middle}H455`} fill="none" stroke={s.color||ink[3]} strokeDasharray="3 3"/><text x="465" y={middle[1]-9} textAnchor="end">{s.label}</text></>}</g>;})}
 {points.map((p,i)=>{const q=xy(p.point||p);return <g key={i} data-original-id={p.id}>{p.id&&<title>{`Original recorded ID ${p.id}`}</title>}<circle cx={q[0]} cy={q[1]} r="5" fill={p.open?'#080808':p.color||'#edf0f6'} stroke={p.color||'#edf0f6'} strokeWidth="2"/>{p.label&&<><path d={`M${q}H${p.slot?.[0]||450}V${p.slot?.[1]||95+i*38}`} fill="none" stroke={p.color||'#aeb8c5'} strokeDasharray="3 3"/><text x={p.slot?.[0]||450} y={(p.slot?.[1]||95+i*38)-8} textAnchor="end">{p.label}</text></>}</g>;})}
 {segmentLabelMode==='footer'&&segments.filter(s=>s.label).map((s,i)=><g key={`segment-label-${i}`}><line x1="90" y1={421+i*24} x2="122" y2={421+i*24} stroke={s.color||ink[3]} strokeWidth="3"/><text x="135" y={426+i*24}>{s.label}</text></g>)}
 {children?.(xy)}
 </Scene>;
}
export function Matrix({title,rows,columns,rowNames=[]}){
 const entries=rows.flat(),longest=Math.max(3,...entries.map(v=>fmt(v).length),...columns.map(c=>String(c).length)),cell=Math.max(75,longest*9+24),left=85,top=75,width=left+columns.length*cell+55,height=top+rows.length*48+40;
 return <Scene title={title} width={width} height={height} description={`${rows.length} rows by ${columns.length} columns; every numeric cell is retained.`}>
 {columns.map((c,j)=><text key={j} x={left+(j+.5)*cell} y="39" textAnchor="middle">{c}</text>)}
 {rows.map((r,i)=><g key={i}><text x="68" y={top+i*48+29} textAnchor="end">{rowNames[i]||i+1}</text>{r.map((v,j)=><g key={j}><rect x={left+j*cell} y={top+i*48} width={cell} height="48" fill={i%2?'#ffffff05':'transparent'} stroke="#536071"/><text x={left+(j+.5)*cell} y={top+i*48+29} textAnchor="middle">{fmt(v)}</text></g>)}</g>)}
 </Scene>;
}
// Sampled oblique graph; its true vertices and the selected minimum line stay visible.
export function Surface({title,fn,domain=[-2,2],heightScale=10,line=[]}){
 const [lo,hi]=domain,grid=Array.from({length:9},(_,i)=>lo+(hi-lo)*i/8),raw=([x,y,z])=>[240+38*x-31*y,-18*x-14*y-125*z/heightScale];
 const mesh=grid.flatMap(k=>[sample(x=>fn(x,k),lo,hi).map(([x,z])=>[x,k,z]),sample(y=>fn(k,y),lo,hi).map(([y,z])=>[k,y,z])]);
 const axes=[[[lo,0,0],[hi,0,0],'x'],[[0,lo,0],[0,hi,0],'y'],[[0,0,0],[0,0,heightScale],'height']];
 const bounds=[...mesh.flat(),...axes.flatMap(a=>a.slice(0,2)),...line].map(raw),top=Math.min(...bounds.map(p=>p[1])),bottom=Math.max(...bounds.map(p=>p[1])),height=Math.max(400,bottom-top+125),xy=p=>[raw(p)[0],raw(p)[1]-top+55];
 return <Scene title={title} width={570} height={height} description={`Oblique graph sampled over both inputs ${lo} to ${hi}; height unit scale ${heightScale}. Full actual signed heights determine canvas extent.`}>
 {mesh.map((m,i)=><path key={i} d={pathData(m,xy)} fill="none" stroke={ink[2]} opacity=".55"/>)}
 {axes.map(([a,b,label],i)=><g key={i}><Arrow from={xy(a)} to={xy(b)} color={ink[i]}/><text x={xy(b)[0]+8} y={xy(b)[1]-8}>{label}</text></g>)}
 {line.length>0&&<path d={pathData(line,xy)} fill="none" stroke={ink[3]} strokeWidth="3"/>}
 <text x="40" y={height-25}>Oblique graph; coordinates and cost remain distinct.</text>
 </Scene>;
}
