import React, { useEffect, useId, useRef, useState } from 'react';
import { FlowControls, FlowLab, FlowReadout } from '../LessonFlow.jsx';

export const palette = ['#8ab6ee', '#efa0b4', '#c0a2ec', '#80c9d3', '#e9b391','#bacd8d','#b7b7c1','#cfb68f'];
export const number = (value, digits = 6) => value === null || value === undefined ? 'unavailable'
  : !Number.isFinite(value) ? value === Infinity ? '∞' : 'undefined' : String(Number(value.toFixed(digits))).replace(/-/g, '−');
export const vector = values => values === null ? 'unavailable' : `[${values.map(value => number(value)).join(', ')}]`;

export function Scalar({ label, value, unit }) {
  return <div className="km-scalar"><span>{label}</span><strong>{typeof value === 'number'||value==null ? number(value) : value}</strong>{unit && <span>{unit}</span>}</div>;
}
export function ArrayRow({ label, values, selected, colors }) {
  return <div className="km-array"><strong>{label}</strong><div className="km-array-cells">{values.map((value, i) => <span key={i} data-selected={i === selected || undefined}
    style={{ borderColor: colors?.[i] }}>{Array.isArray(value) ? vector(value) : typeof value === 'number' ? number(value) : value}</span>)}</div></div>;
}
export function Arrow({ label }) {
  return <div className="km-arrow"><span>{label}</span><svg viewBox="0 0 100 24" aria-hidden="true"><path d="M4 12H94M84 3L94 12L84 21" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>;
}
export function Table({ caption, headers, rows, highlight,highlightCells=[] }) {
  return <div className="km-scroll" tabIndex={0} role="region" aria-label={caption}>
    <table className="km-table"><caption>{caption}</caption><thead><tr>{headers.map((header,i) => <th key={i} scope="col">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i} data-selected={highlight === i || Array.isArray(highlight)&&highlight.includes(i) || undefined}>{row.map((value,j) => j === 0 ? <th key={j} scope="row">{value}</th>
        : <td key={j} data-selected={highlightCells.some(cell=>cell[0]===i&&cell[1]===j)||undefined}>{typeof value === 'number'||value==null ? number(value) : Array.isArray(value) ? vector(value) : value}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
export function Numeric({ label, value, onChange, min, max, step = 1 }) {
  const id = useId(), [draft, setDraft] = useState(String(value)), [error, setError] = useState('');
  useEffect(() => { setDraft(String(value)); setError(''); }, [value]);
  function edit(raw) {
    setDraft(raw);
    const next = Number(raw);
    if (!raw.trim() || !Number.isFinite(next) || next < min || next > max || (step === 1 && !Number.isInteger(next))) {
      setError(`Use ${step === 1 ? 'an integer' : 'a finite value'} from ${min} to ${max}. The drawing keeps its last valid input.`); return;
    }
    setError(''); onChange(next);
  }
  return <div className="km-numeric"><label htmlFor={id}>{label}</label><input id={id} type="number" min={min} max={max} step={step} value={draft}
    onChange={event => edit(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}/>
    {error && <span id={`${id}-error`} className="km-error" role="alert">{error}</span>}</div>;
}
export function Select({ label, value, onChange, options }) {
  const id = useId();
  return <label className="km-select" htmlFor={id}>{label}<select id={id} value={value} onChange={event => onChange(event.target.value)}>
    {options.map(option => { const [key, title] = Array.isArray(option) ? option : [option, option]; return <option key={key} value={key}>{title}</option>; })}
  </select></label>;
}
export function Local({ id, question, children, controls, readout, reset, caption }) {
  return <FlowLab id={`mechanism-${id.toLowerCase()}`} label={question}>
    <figure className="km-picture" data-mechanism={id}>
      {children}{caption && <figcaption>{caption}</figcaption>}
    </figure>
    {controls && <FlowControls>{controls}<button type="button" onClick={reset}>Reset</button></FlowControls>}
    {readout && <FlowReadout data-current-result="">{readout}</FlowReadout>}
  </FlowLab>;
}
export function Members({ groups, prefix = 'P', selected }) {
  return <div className="km-members">{groups.map((group,i) => <div className="km-member-group" key={i} style={{ '--group-color': palette[i % palette.length] }}>
    <strong>Group {i}</strong><div>{group.map(id => <span key={id} data-selected={selected === id || undefined}>{prefix}{id}</span>)}</div>
  </div>)}</div>;
}
export function useDrawingBox() {
  const ref = useRef(null), [width, setWidth] = useState(420), [font, setFont] = useState(16);
  useEffect(() => {
    const refresh = () => { setWidth(Math.max(260, ref.current.clientWidth)); setFont(parseFloat(getComputedStyle(document.documentElement).fontSize)); };
    refresh(); const observer = new ResizeObserver(refresh); observer.observe(ref.current);
    const rootObserver = new MutationObserver(refresh); rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-enlarged'] });
    return () => { observer.disconnect(); rootObserver.disconnect(); };
  }, []);
  return { ref, width, font };
}
/** One physical unit has the same length on both axes. Data marks never move
 * merely to make room for prose; identities and exact coordinates live below. */
export function Plot({ points, centers = [], labels, selected, query, edges = [], box, boundary, title = 'Coordinate geometry', ids, showRows = true, units = ['x','y'], polygons = [], polygonLabels=[], circles = [], independentAxes = false, projectionLines=false,bisector=false,groupNames,pointOutlines,arcs=[],pointColors }) {
  const { ref, width, font } = useDrawingBox();
  const all = [...points, ...centers, ...(query ? [query] : []), ...polygons.flat()];
  const xs = all.map(row => row[0]), ys = all.map(row => row[1] || 0);
  const bounds = [...(box || [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)])];
  const span = Math.max(bounds[1]-bounds[0], bounds[3]-bounds[2], 1), margin = Math.max(32,font*1.7);
  if(!independentAxes){const middleX=(bounds[0]+bounds[1])/2,middleY=(bounds[2]+bounds[3])/2;bounds.splice(0,4,middleX-span/2,middleX+span/2,middleY-span/2,middleY+span/2);}
  const unit = (width-2*margin)/span;
  const xUnit=independentAxes?(width-2*margin)/Math.max(bounds[1]-bounds[0],1):unit;
  const yUnit=independentAxes?(width-2*margin)/Math.max(bounds[3]-bounds[2],1):unit;
  const x = value => width/2+(value-(bounds[0]+bounds[1])/2)*xUnit;
  const y = value => width/2-(value-(bounds[2]+bounds[3])/2)*yUnit;
  const glyph = Math.max(5,font*.24);
  const arrowID=useId().replaceAll(':','');
  const divide=[];
  if(bisector&&centers.length===2){const dx=centers[1][0]-centers[0][0],dy=(centers[1][1]||0)-(centers[0][1]||0),c=(centers[1][0]**2+(centers[1][1]||0)**2-centers[0][0]**2-(centers[0][1]||0)**2)/2;
   if(dy!==0)for(const a of bounds.slice(0,2)){const b=(c-dx*a)/dy;if(b>=bounds[2]&&b<=bounds[3])divide.push([a,b]);}
   if(dx!==0)for(const b of bounds.slice(2)){const a=(c-dy*b)/dx;if(a>=bounds[0]&&a<=bounds[1])divide.push([a,b]);}
  }
  const boundaryPoints=[...new Map(divide.map(row=>[row.join('/'),row])).values()];
  return <div className="km-plot" ref={ref}>
    <p>{title} · axes: {units[0]} / {units[1]}. {independentAxes?'Independent axis magnification makes the rows readable; screen lengths are not the clustering ruler. ':'One physical unit has the same screen length on both axes. '}{labels ? groupNames?'Named operand A: blue circle; B: rose square; unselected rows: neutral circles. ':'C0 blue circle; C1 rose square; C2 violet triangle; higher IDs use the labelled colours below. ' : pointColors ? 'Row identity hues follow literal P-IDs in the adjacent coordinate and interval keys. ' : 'Input rows are blue. '}Center: cross/ring; query: amber diamond; selection: white outline.</p>
    {(labels||centers.length>0)&&<div className="km-group-legend">{[...new Set([...(labels||[]).filter(id=>id!==null),...centers.map((_,i)=>i)])].sort((a,b)=>a-b).map(id=><span key={id} style={{color:palette[id%palette.length]}}>{groupNames?.[id]??`C${id}`}</span>)}</div>}
    <svg viewBox={`0 0 ${width} ${width}`} width={width} height={width} role="img" aria-label={`${title}; exact row and center coordinates follow`}>
      <defs><marker id={arrowID} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker></defs>
      <path d={`M${margin} ${width-margin}H${width-margin}M${margin} ${margin}V${width-margin}`} stroke="#777" fill="none"/>
      {projectionLines&&selected!==undefined&&<g fill="#ddd" fontSize={font}>
        <path d={`M${margin} ${y(points[selected][1])}H${x(points[selected][0])}V${width-margin}`} fill="none" stroke="#ddd" strokeDasharray="5 4"/>
        <text x={margin-font*.3} y={y(points[selected][1])+font*.35} textAnchor="end">{number(points[selected][1])}</text>
        <text x={x(points[selected][0])} y={width-margin+font*1.3} textAnchor="middle">{number(points[selected][0])}</text>
      </g>}
      {circles.map((radius,i)=><ellipse key={i} cx={x(0)} cy={y(0)} rx={radius*xUnit} ry={radius*yUnit} fill="none" stroke="#777" strokeDasharray="4 4"/>)}
      {arcs.map((arc,i)=>{const a=arc.from*Math.PI/180,b=arc.to*Math.PI/180,r=arc.radius??1;return <path key={i} d={`M${x(r*Math.cos(a))} ${y(r*Math.sin(a))}A${r*xUnit} ${r*yUnit} 0 ${Math.abs(arc.to-arc.from)>180?1:0} ${arc.to>arc.from?0:1} ${x(r*Math.cos(b))} ${y(r*Math.sin(b))}`} fill="none" stroke={arc.color||'#e2b55a'} strokeWidth="3"/>;})}
      {polygons.map((polygon,i) => <polygon key={i} points={polygon.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')} fill="none" stroke="#ddd" strokeDasharray="5 4"/>)}
      {polygonLabels.filter(label=>label.area>0).map((label,i)=><text key={i} data-square-area={label.area} x={x(label.at[0])} y={y(label.at[1])} textAnchor="middle" dominantBaseline="middle" fontSize={font} fill={label.color} stroke="#080809" strokeWidth="3" paintOrder="stroke">{number(label.area)}</text>)}
      {boundary !== undefined && <line x1={x(boundary)} x2={x(boundary)} y1={margin} y2={width-margin} stroke="#999" strokeDasharray="4 4"/>}
      {boundaryPoints.length>=2&&<line x1={x(boundaryPoints[0][0])} y1={y(boundaryPoints[0][1])} x2={x(boundaryPoints.at(-1)[0])} y2={y(boundaryPoints.at(-1)[1])} stroke="#ddd" strokeDasharray="4 4"><title>Equal squared-distance boundary</title></line>}
      {edges.map((edge,i) => <line key={i} x1={x(edge.a[0])} y1={y(edge.a[1]||0)} x2={x(edge.b[0])} y2={y(edge.b[1]||0)} stroke={edge.color||'#a9a9b3'} strokeWidth={edge.strong?3:1} strokeDasharray={edge.residual?'5 4':undefined} markerEnd={edge.directed?`url(#${arrowID})`:undefined}/>)}
      {points.map((row,i) => {
        const color = pointColors?.[i] ?? (labels ? labels[i]===null?'#777':palette[labels[i]%palette.length] : palette[0]), cx=x(row[0]), cy=y(row[1]||0), group=labels?.[i];
        return <g key={i} data-point-index={i} data-group={group??undefined}>{group===1 ? <rect x={cx-glyph} y={cy-glyph} width={2*glyph} height={2*glyph} fill={color} stroke={pointOutlines?.[i]} strokeWidth="2"/>
          : group===2 ? <path d={`M${cx} ${cy-glyph*1.3}L${cx-glyph*1.3} ${cy+glyph}H${cx+glyph*1.3}Z`} fill={color} stroke={pointOutlines?.[i]} strokeWidth="2"/>
          : <circle cx={cx} cy={cy} r={glyph} fill={color} stroke={pointOutlines?.[i]} strokeWidth="2"/>} {(selected===i||Array.isArray(selected)&&selected.includes(i)) && <circle cx={cx} cy={cy} r={glyph+5} fill="none" stroke="white" strokeWidth="2"/>}</g>;
      })}
      {centers.map((row,i) => <g key={i} stroke={palette[i%palette.length]} fill="none" strokeWidth="2"><title>C{i} center: {vector(row)}</title><circle cx={x(row[0])} cy={y(row[1]||0)} r={glyph+3}/><path d={`M${x(row[0])-glyph-7} ${y(row[1]||0)}H${x(row[0])+glyph+7}M${x(row[0])} ${y(row[1]||0)-glyph-7}V${y(row[1]||0)+glyph+7}`}/></g>)}
      {query && <path d={`M${x(query[0])} ${y(query[1]||0)-glyph-4}L${x(query[0])+glyph+4} ${y(query[1]||0)}L${x(query[0])} ${y(query[1]||0)+glyph+4}L${x(query[0])-glyph-4} ${y(query[1]||0)}Z`} stroke="#e2b55a" fill="#171719" strokeWidth="2"/>}
    </svg>
    <div className="km-axis-range"><span>{units[0]}: {number(bounds[0])} … {number(bounds[1])}</span><span>{units[1]}: {number(bounds[2])} … {number(bounds[3])}</span></div>
    {showRows && <Table caption="Coordinates and literal identities" headers={['Object', ...units, ...(labels?['Group']:[])]}
      rows={[...points.map((row,i)=>[ids?.[i]??`P${i}`,row[0],row[1]||0,...(labels?[labels[i]===null?'unselected operand':groupNames?.[labels[i]]??`C${labels[i]}`]:[])]),...centers.map((row,i)=>[`${groupNames?.[i]??`C${i}`} center`,row[0],row[1]||0]),...(query?[['query',query[0],query[1]||0]]:[])]} highlight={selected}/>} 
  </div>;
}
export function Axis({ values, centers = [], query, edges = [], domain, title, ids }) {
  const{ref,width,font}=useDrawingBox(),all=[...values,...centers,...(query===undefined?[]:[query])],low=domain?.[0]??Math.min(...all,0),rawHigh=domain?.[1]??Math.max(...all,0),high=rawHigh===low?low+1:rawHigh,span=high-low,margin=font*1.8,height=font*7,baseline=font*3.6;
  const position=value=>margin+(value-low)*(width-2*margin)/span,arrowID=useId().replaceAll(':','');
  const groupedCenters=[...new Map(centers.map(value=>[value,centers.flatMap((other,i)=>other===value?[i]:[])])).entries()];
  return <div ref={ref} className="km-plot"><p>{title} · one coordinate ruler in constructed units. Rows: blue circles; representative IDs: coloured cross/ring; query: amber diamond. Vertical separation of labels is layout.</p>
   <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Literal one-dimensional row and representative coordinates">
    <defs><marker id={arrowID} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker></defs>
    <line x1={margin} x2={width-margin} y1={baseline} y2={baseline} stroke="#888"/>
    {edges.map((edge,i)=><g key={i}><line x1={position(edge.a[0])} x2={position(edge.b[0])} y1={font*(2.3-.15*i)} y2={font*(2.3-.15*i)} stroke={edge.color||'#ddd'} strokeWidth={edge.strong?3:1.5} strokeDasharray={edge.residual?'5 4':undefined} markerEnd={edge.directed?`url(#${arrowID})`:undefined}/><path d={`M${position(edge.a[0])} ${baseline}V${font*(2.3-.15*i)}M${position(edge.b[0])} ${baseline}V${font*(2.3-.15*i)}`} stroke="#666" fill="none"/></g>)}
    {values.map((value,i)=><circle key={i} cx={position(value)} cy={baseline} r={font*.25} fill={palette[0]}><title>{ids?.[i]??`row ${i}`}: {number(value)}</title></circle>)}
    {groupedCenters.map(([value,indices])=><g key={value} stroke={palette[indices[0]%palette.length]} fill="none" strokeWidth="2"><circle cx={position(value)} cy={baseline} r={font*.45}/><path d={`M${position(value)-font*.65} ${baseline}H${position(value)+font*.65}M${position(value)} ${baseline-font*.65}V${baseline+font*.65}`}/><text x={position(value)} y={font} fontSize={font} stroke="none" fill={palette[indices[0]%palette.length]} textAnchor={position(value)<margin+font*2?'start':position(value)>width-margin-font*2?'end':'middle'}>{indices.map(i=>`C${i}`).join('/')}</text></g>)}
    {query!==undefined&&<path d={`M${position(query)} ${baseline-font*.55}L${position(query)+font*.55} ${baseline}L${position(query)} ${baseline+font*.55}L${position(query)-font*.55} ${baseline}Z`} stroke="#e2b55a" fill="#171719" strokeWidth="2"/>}
    {[low,high].map((value,i)=><text key={i} x={i?width-margin:margin} y={height-font} textAnchor={i?'end':'start'} fill="#ddd" fontSize={font}>{number(value)}</text>)}
   </svg><Table caption="Literal coordinate values and identities" headers={['Object','coordinate']} rows={[...values.map((value,i)=>[ids?.[i]??`row ${i}`,value]),...centers.map((value,i)=>[`C${i} representative`,value]),...(query===undefined?[]:[['query',query]])]}/>
  </div>;
}
export function ThreeCoordinates({rows}) {
 const{ref,width,font}=useDrawingBox(),scale=(width-3*font)/6.5,project=([a,b,c])=>[width/2+(a-2-(c-2)*.45)*scale,width/2-(b-2+(c-2)*.35)*scale],vertices=Array.from({length:8},(_,i)=>[(i&1)?4:0,(i&2)?4:0,(i&4)?4:0]);
 return <div ref={ref} className="km-plot"><p>The three square-array rows become literal three-coordinate observations. Axes c0/c1/c2 mean coordinate0/1/2. This oblique display preserves their identities; the length calculation uses all three coordinate differences.</p><svg width={width} height={width} role="img" aria-label="Three row vectors inside an oblique 0-to-4 coordinate cube">
 {vertices.flatMap((row,i)=>[1,2,4].filter(bit=>!(i&bit)).map(bit=>{const a=project(row),b=project(vertices[i|bit]);return <line key={`${i}/${bit}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#777"/>;}))}
 {rows.map((row,i)=>{const[x,y]=project(row);return <g key={i}><circle cx={x} cy={y} r={font*.3} fill={palette[0]}/><text x={x} y={y-font*.55} fontSize={font} fill="#ddd" textAnchor="middle">row {i}</text></g>;})}
 {['c0','c1','c2'].map((name,i)=>{const row=[0,0,0];row[i]=4;const[x,y]=project(row);return <text key={i} x={x} y={y+font} textAnchor="middle" fill="#ddd" fontSize={font}>{name}</text>;})}
 </svg><ArrayRow label="Row 0 minus row 1, in all three coordinates" values={rows[0].map((v,j)=>v-rows[1][j])}/></div>;
}
export function Bars({ rows, maximum = 1, signed = false, title }) {
  return <div className="km-bars"><p>{title} · {signed?'scale −1 to 1':'common zero baseline; scale 0 to '+number(maximum)}</p>
    {rows.map((row,i)=><div key={i} className="km-bar-row"><span>{row.label}: <strong>{number(row.value)}</strong></span><div className="km-bar-track" data-signed={signed||undefined}>
      <i style={{left:signed?`${Math.min(.5,.5+row.value/2)*100}%`:'0',width:`${signed?Math.abs(row.value)*50:row.value/maximum*100}%`,background:row.color||palette[i%palette.length]}}/>
    </div></div>)}
  </div>;
}
export function Tree({ tree, prefix = tree.merges.length, selected, rotation = false, threshold, leafNames }) {
  const count=tree.points.length, { ref,width,font }=useDrawingBox();
  const drawingWidth=Math.max(width,count*font*3.4), height=Math.max(260,font*15), top=font*2, bottom=font*3;
  const maxHeight=Math.max(...tree.merges.map(row=>row.height),1), positions=new Map(), order=[];
  function locate(id) {
    const node=tree.nodes[id];
    if (node.left===undefined) { order.push(id); return; }
    locate(rotation?node.right:node.left); locate(rotation?node.left:node.right);
  }
  locate(tree.root.id);
  order.forEach((id,i)=>positions.set(id,{x:font*2+i*(drawingWidth-font*4)/Math.max(count-1,1),y:height-bottom}));
  tree.merges.forEach(node=>positions.set(node.id,{x:(positions.get(node.left).x+positions.get(node.right).x)/2,y:height-bottom-(height-top-bottom)*node.height/maxHeight}));
  return <div ref={ref}>
    <p>Vertical height is a measurement; horizontal branch placement is layout. Use the focused local scroll region to read every leaf.</p>
    <div className="km-scroll km-tree-scroll" tabIndex={0} role="region" aria-label="Branch heights and leaf IDs; scroll horizontally when needed">
      <svg viewBox={`0 0 ${drawingWidth} ${height}`} width={drawingWidth} height={height} role="img" aria-label="Actual child branches, heights and persistent node IDs">
        {tree.merges.slice(0,prefix).map(node=>{const a=positions.get(node.left),b=positions.get(node.right),c=positions.get(node.id),active=selected!==undefined&&node.members.includes(selected);
          return <g key={node.id}><path d={`M${a.x} ${a.y}V${c.y}H${b.x}V${b.y}`} fill="none" stroke={active?'#e2b55a':'#b2b2bc'} strokeWidth={active?3:1.5}/><circle cx={c.x} cy={c.y} r="4" fill="#ddd"/></g>;})}
        {order.map(id=><text key={id} x={positions.get(id).x} y={height-font*.7} fill={selected===id?'#fff':palette[0]} textAnchor="middle" fontSize={font}>{leafNames?.[id]??`P${id}`}</text>)}
        {threshold!==undefined&&<line x1={font} x2={drawingWidth-font} y1={height-bottom-(height-top-bottom)*threshold/maxHeight} y2={height-bottom-(height-top-bottom)*threshold/maxHeight} stroke="#e2b55a" strokeDasharray="5 4"/>}
      </svg>
    </div>
    <Table caption="Persistent branch fields" headers={['Node','left','right','height','leaf count','members']}
      rows={tree.merges.slice(0,prefix).map(row=>[row.id,row.left,row.right,row.height,row.members.length,row.members.map(i=>leafNames?.[i]??`P${i}`).join(', ')])}/>
  </div>;
}
