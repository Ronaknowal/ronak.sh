import { useId } from 'react';
import { arcState, bearingState, circleComponents, dissectionState, formatGeometry as f, frameState, originDisplacementState, similarityState, ssaState, twoLinkState } from '../../data/geometry-trigonometry-models.js';
import './lesson-flow.css';
import './geometry-trigonometry-labs.css';

export const pointText = p => `(${p.map(v => f(v)).join(', ')})`;
export function GeoFigure({children, caption, controls, live=false}) {
  return <figure className={`geometry-flow ${live?'geometry-live':''}`}>{children}{controls}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
export function Scene({label, children, width=340, height=340}) {
  const id=useId().replaceAll(':','');
  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="geo-scene"><title>{label}</title><defs><marker id={`geo-arrow-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>{typeof children==='function'?children(`url(#geo-arrow-${id})`):children}</svg>;
}
export function Label({x,y,children,anchor='middle',tone=''}) { return <text x={x} y={y} textAnchor={anchor} className={`geo-label ${tone}`}>{children}</text>; }
export function Plane({label,extent=[-1,7,-1,7],children,unit='m',ticks=true}) {
  const [xmin,xmax,ymin,ymax]=extent, scale=Math.min(242/(xmax-xmin),242/(ymax-ymin));
  const cx=170,cy=162,X=x=>cx+(x-(xmin+xmax)/2)*scale,Y=y=>cy-(y-(ymin+ymax)/2)*scale;
  const map={X,Y,scale}, labelledTick=Math.max(1,Math.ceil(30/scale));
  return <Scene label={label}>{arrow=><>
    {Array.from({length:Math.floor(xmax)-Math.ceil(xmin)+1},(_,i)=>Math.ceil(xmin)+i).map(x=><line key={`x${x}`} x1={X(x)} x2={X(x)} y1={Y(ymin)} y2={Y(ymax)} className="geo-grid"/>)}
    {Array.from({length:Math.floor(ymax)-Math.ceil(ymin)+1},(_,i)=>Math.ceil(ymin)+i).map(y=><line key={`y${y}`} x1={X(xmin)} x2={X(xmax)} y1={Y(y)} y2={Y(y)} className="geo-grid"/>)}
    <line x1={X(xmin)} x2={X(xmax)} y1={Y(0)} y2={Y(0)} className="geo-axis" markerEnd={arrow}/><line x1={X(0)} x2={X(0)} y1={Y(ymin)} y2={Y(ymax)} className="geo-axis" markerEnd={arrow}/>
    <Label x={306} y={Y(0)-12}>x</Label><Label x={X(0)-13} y={30}>y</Label>
    {ticks && <><Label x={X(0)-15} y={Y(0)+22}>0</Label><Label x={X(labelledTick)} y={Y(0)+22}>{labelledTick}</Label><Label x={X(0)-22} y={Y(labelledTick)+6}>{labelledTick}</Label></>}
    {children({...map,arrow})}<Label x={170} y={328}>One grid step = 1 {unit}</Label>
  </>}</Scene>;
}
export function Dot({map,p,name,tone='gold',dx=14,dy=-14,leader=false}) {const x=map.X(p[0]),y=map.Y(p[1]);return <>{leader&&name&&<line x1={x} y1={y} x2={x+dx} y2={y+dy-8} className="geo-axis"/>}<circle cx={x} cy={y} r="5" className={`geo-dot ${tone}`}/>{name && <Label x={x+dx} y={y+dy}>{name}</Label>}</>;}
export function Segment({map,a,b,tone='gold',arrow=false,dash=false}) {const x1=map.X(a[0]),y1=map.Y(a[1]),x2=map.X(b[0]),y2=map.Y(b[1]),dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy),trim=arrow&&length>0?Math.min(10,length/3):0;return <line x1={x1} y1={y1} x2={length>0?x2-trim*dx/length:x2} y2={length>0?y2-trim*dy/length:y2} className={`geo-line ${tone} ${dash?'geo-dash':''}`} markerEnd={arrow&&length>0?map.arrow:undefined}/>;}
export function Polygon({map,points,tone='gold'}) {return <polygon points={points.map(p=>`${map.X(p[0])},${map.Y(p[1])}`).join(' ')} className={`geo-area ${tone}`}/>;}
export function Angle({map,origin,start,end,radius=.7,tone='gold',directed=false,dash=false}) {
  const count=Math.max(8,Math.ceil(Math.abs(end-start)/.08));
  const pts=Array.from({length:count+1},(_,i)=>{const t=start+(end-start)*i/count;return[origin[0]+radius*Math.cos(t),origin[1]+radius*Math.sin(t)]});
  return <polyline points={pts.map(p=>`${map.X(p[0])},${map.Y(p[1])}`).join(' ')} className={`geo-line ${tone} ${dash?'geo-dash':''}`} markerEnd={directed?map.arrow:undefined}/>;
}
export function RightAngle({map,p,dx=.3,dy=.3}) {return <polyline points={[[p[0]+dx,p[1]],[p[0]+dx,p[1]+dy],[p[0],p[1]+dy]].map(q=>`${map.X(q[0])},${map.Y(q[1])}`).join(' ')} className="geo-axis"/>;}
export function CoordinatesDrawing({midpoint=false,slope=false,reverse=false}) {
  return <Plane label="Points P and Q, signed coordinate projections and their connecting segment">{m=><>
    <Segment map={m} a={[1,2]} b={[4,2]} dash tone="neutral"/><Segment map={m} a={[4,2]} b={[4,6]} dash tone="neutral"/>
    <Segment map={m} a={reverse?[4,6]:[1,2]} b={reverse?[1,2]:[4,6]} arrow/>
    <Dot map={m} p={[1,2]} name="P"/><Dot map={m} p={[4,6]} name="Q" tone="blue" dx={midpoint?32:14} dy={midpoint?14:-14} leader={midpoint}/>
    {midpoint && <><Dot map={m} p={[2.5,4]} name="M" tone="rose"/><Segment map={m} a={[-.125,.5]} b={[1,2]} dash tone="neutral"/><Segment map={m} a={[4,6]} b={[4.75,7]} dash tone="neutral"/></>}
    {slope && <><Segment map={m} a={[6,-.5]} b={[6,7]} tone="blue"/><Label x={m.X(5.7)} y={m.Y(5)}>vertical</Label></>}
  </>}</Plane>;
}
export function SectorDrawing({radius=2,degrees=60,chord=true}) {
  const state=arcState(radius,degrees),r=state.radius,t=state.radians,p=[r*Math.cos(t),r*Math.sin(t)];
  return <Plane label="Circle with actual radius, directed sweep, curved arc and straight chord" extent={[-3.5,3.5,-3.5,3.5]}>{m=><>
    <circle cx={m.X(0)} cy={m.Y(0)} r={r*m.scale} className="geo-axis"/>
    <Polygon map={m} points={[[0,0],...[...Array(61)].map((_,i)=>[r*Math.cos(t*i/60),r*Math.sin(t*i/60)])]}/>
    <Segment map={m} a={[0,0]} b={[r,0]}/><Segment map={m} a={[0,0]} b={p}/><Angle map={m} origin={[0,0]} start={0} end={t} radius={r} directed/>
    {chord && <Segment map={m} a={[r,0]} b={p} tone="blue" dash/>}<Dot map={m} p={p} name="B" tone="blue"/><Dot map={m} p={[r,0]} name="A" dy={-22}/>
  </>}</Plane>;
}
export function SimilarityDrawing({shape='3-4-5',scale=2}) {
  const s=similarityState(shape,scale),pixels=Math.min(180/(3*s.adjacent),200/(3*s.opposite)),baseY=76+3*s.opposite*pixels;
  const X=x=>54+x*pixels,Y=y=>baseY-y*pixels;
  return <div className="geo-comparison">{[1,scale].map((k,i)=><div key={i}><Scene label={`${i?'Scaled':'Original'} right triangle; corresponding side roles use one fixed common unit scale`} height={baseY+95}>{arrow=>{const m={X,Y,scale:pixels,arrow},a=k*s.adjacent,b=k*s.opposite,h=k*s.hypotenuse;return <>
    {Array.from({length:3*s.adjacent+1},(_,j)=>j).map(x=><line key={`x${x}`} x1={X(x)} x2={X(x)} y1={Y(0)} y2={Y(3*s.opposite)} className="geo-grid"/>)}
    {Array.from({length:3*s.opposite+1},(_,j)=>j).map(y=><line key={`y${y}`} x1={X(0)} x2={X(3*s.adjacent)} y1={Y(y)} y2={Y(y)} className="geo-grid"/>)}
    <Polygon map={m} points={[[0,0],[a,0],[a,b]]} tone={i?'blue':'gold'}/><RightAngle map={m} p={[a,0]} dx={-.25*k} dy={.25*k}/><Angle map={m} origin={[0,0]} start={0} end={s.angle} radius={.7*k}/><Label x={X(1.3*k)} y={Y(.45*k)}>θ</Label>
    <line x1={X(a/2)} y1={Y(b/2)} x2="100" y2="46" className="geo-axis"/><Label x="100" y="22">hypotenuse</Label><Label x="100" y="42">{f(h)} units</Label>
    <line x1={X(a/2)} y1={Y(0)} x2={X(a/2)} y2={baseY+12} className="geo-axis"/><Label x={X(a/2)} y={baseY+31}>adjacent {f(a)}</Label>
    <line x1={X(a)} y1={Y(b/2)} x2={X(a)+10} y2={Y(b/2)} className="geo-axis"/><Label x={X(a)+14} y={Y(b/2)-8} anchor="start">opposite</Label><Label x={X(a)+14} y={Y(b/2)+12} anchor="start">{f(b)}</Label>
    <Label x="170" y={baseY+59}>Shaded area {f(k*k*s.originalArea)} units²</Label><Label x="170" y={baseY+85}>One grid step = 1 unit</Label>
  </>;}}</Scene><p>{i?'Scaled':'Original'} triangle. Corresponding lengths use the same fixed scale for all k=0.5…3; its shaded area belongs to this triangle.</p></div>)}</div>;
}
export function CircleDrawing({degrees=45}) {
  const s=circleComponents(degrees),p=[s.cosine,s.sine];
  return <><Plane label="Signed unit-circle endpoint and its two perpendicular components" extent={[-1.4,1.4,-1.4,1.4]} unit="dimensionless unit">{m=><><circle cx={m.X(0)} cy={m.Y(0)} r={m.scale} className="geo-axis"/><Segment map={m} a={[0,0]} b={p} arrow/><Segment map={m} a={[0,0]} b={[p[0],0]} tone="blue"/><Segment map={m} a={[p[0],0]} b={p} tone="rose" dash/><Dot map={m} p={p} name="P" dx={p[0]>0?12:-12} dy={p[1]>0?-18:25}/></>}</Plane><TrigTrace degrees={degrees}/></>;
}
export function TrigTrace({degrees=45,inverse=false,solutions=false}) {
  const xmin=inverse?-180:-360,xmax=inverse?180:360,X=t=>40+(t-xmin)/(xmax-xmin)*264,Y=v=>120-v*70;
  return <Scene label={solutions?'Sine trace and both half-height crossings in each displayed period':inverse?'Principal inverse branch restrictions on actual sine and cosine traces':'Cosine and sine traces with the same angle marker'} height={260}>{arrow=><>
    <Label x="170" y="28">Value (dimensionless)</Label><line x1="40" x2="40" y1="40" y2="200" className="geo-axis"/>{[-1,0,1].map(v=><g key={v}><line x1="36" x2="44" y1={Y(v)} y2={Y(v)} className="geo-axis"/><Label x="22" y={Y(v)+5}>{v}</Label></g>)}
    <line x1="40" x2="310" y1="120" y2="120" className="geo-axis" markerEnd={arrow}/><line x1={X(0)} x2={X(0)} y1="40" y2="200" className="geo-axis"/>
    {(solutions?['sin']:['cos','sin']).map((name,j)=><polyline key={name} points={Array.from({length:181},(_,i)=>{const d=xmin+(xmax-xmin)*i/180;return`${X(d)},${Y(Math[name](d*Math.PI/180))}`}).join(' ')} className={`geo-line ${j?'rose':'blue'}`}/>)}
    {!inverse&&!solutions && <><line x1={X(degrees)} x2={X(degrees)} y1="35" y2="205" className="geo-axis geo-dash"/><circle cx={X(degrees)} cy={Y(Math.cos(degrees*Math.PI/180))} r="5" className="geo-dot blue"/><circle cx={X(degrees)} cy={Y(Math.sin(degrees*Math.PI/180))} r="5" className="geo-dot rose"/></>}
    {solutions&&<><line x1="40" x2="304" y1={Y(.5)} y2={Y(.5)} className="geo-axis geo-dash"/>{[-330,-210,30,150].map(d=><circle key={d} cx={X(d)} cy={Y(.5)} r="5" className="geo-dot gold"/>)}<Label x="40" y={Y(.5)-7} anchor="start">1/2</Label></>}
    <Label x={40} y="224">{xmin}°</Label><Label x={X(0)} y="224">0°</Label><Label x="304" y="224">{xmax}°</Label><Label x="170" y="252">Angle θ, degrees</Label>
  </>}</Scene>;
}
export function BearingDrawing({x=-3,y=4}) {
  const s=bearingState(x,y);return <Plane label="Signed point bearing, with correct quadrant and naive quotient comparison" extent={[-7,7,-7,7]}>{m=><>
    <Segment map={m} a={[0,0]} b={[x,y]} arrow/><Segment map={m} a={[0,0]} b={[x,0]} tone="blue" dash/><Segment map={m} a={[x,0]} b={[x,y]} tone="blue" dash/>
    {s.naive!==null&&s.radius>0 && <Segment map={m} a={[0,0]} b={[s.radius*Math.cos(s.naive),s.radius*Math.sin(s.naive)]} tone="rose" arrow dash/>}
    <Dot map={m} p={[x,y]} name={s.radius?'P':'P = O'} dx={x>4?-22:18}/>
  </>}</Plane>;
}
export function SsaDrawing({a=7}) {
  const s=ssaState(a);return <Plane label="Fixed thirty-degree side, opposite-side circle and positive-x ray intersections" extent={[-5,25,-10,20]} unit="unit">{m=><>
    <circle cx={m.X(s.C[0])} cy={m.Y(s.C[1])} r={a*m.scale} className="geo-line blue"/><Segment map={m} a={[0,0]} b={[21,0]} tone="neutral" arrow/>
    <Segment map={m} a={[0,0]} b={s.C}/><Angle map={m} origin={[0,0]} start={0} end={Math.PI/6} radius={4}/><Dot map={m} p={[0,0]} name="A" dx={-28} dy={48} leader/><Dot map={m} p={s.C} name="C"/>
    {s.candidates.map((p,i)=><g key={i}><Polygon map={m} points={[[0,0],[p.c,0],s.C]} tone={i?'rose':'gold'}/><Dot map={m} p={[p.c,0]} name={`B${i+1}`} tone={i?'rose':'gold'} dx={0} dy={76} leader/></g>)}
    {s.collapsed.length>0 && <circle cx={m.X(0)} cy={m.Y(0)} r="9" className="geo-axis"/>}
  </>}</Plane>;
}
export function FrameDrawing({state=frameState(4,2,1,-1,30,'passive')}) {
  const s=state,O=s.origin,c=s.cosine,sin=s.sine;
  return <Plane label={s.mode==='passive'?'Fixed world point and rotated local coordinate axes':'Active point rotation around its fixed pivot'} extent={[-9,9,-9,9]}>{m=><>
    {s.mode==='passive'&&<><Segment map={m} a={O} b={[O[0]+5*c,O[1]+5*sin]} tone="blue" arrow/><Segment map={m} a={O} b={[O[0]-5*sin,O[1]+5*c]} tone="blue" arrow/>
    <Label x={m.X(O[0]+5*c)+12} y={m.Y(O[1]+5*sin)+15}>x′</Label><Label x={m.X(O[0]-5*sin)-12} y={m.Y(O[1]+5*c)-12}>y′</Label></>}
    <Dot map={m} p={O} name="O" tone="rose"/><Segment map={m} a={O} b={s.point} arrow/><Dot map={m} p={s.point} name="P"/>
    {s.mode==='active'?<><Segment map={m} a={O} b={s.rotated} tone="blue" arrow/><Dot map={m} p={s.rotated} name="P′" tone="blue" dx={-17} dy={-17}/><Angle map={m} origin={O} start={Math.atan2(s.displacement[1],s.displacement[0])} end={Math.atan2(s.displacement[1],s.displacement[0])+s.degrees*Math.PI/180} radius={s.radius} tone="blue"/></>:<><Segment map={m} a={O} b={[O[0]+c*s.local[0],O[1]+sin*s.local[0]]} tone="blue" dash/><Segment map={m} a={[O[0]+c*s.local[0],O[1]+sin*s.local[0]]} b={s.point} tone="blue" dash/></>}
  </>}</Plane>;
}
export function OriginDrawing({ox=1,oy=-1}) {
  const s=originDisplacementState(ox,oy),c=Math.sqrt(3)/2,sin=.5;
  return <><p className="geo-compact-note">Local axes: 30° from world axes.</p><Plane label="Two world points, translated local origin, and the same free displacement drawn at two positions" extent={[-3,8,-3,8]}>{m=><>
    <Segment map={m} a={s.origin} b={[ox+4*c,oy+4*sin]} tone="neutral" arrow/><Segment map={m} a={s.origin} b={[ox-4*sin,oy+4*c]} tone="neutral" arrow/><Label x={m.X(ox+4*c)+14} y={m.Y(oy+4*sin)}>x′</Label><Label x={m.X(ox-4*sin)} y={m.Y(oy+4*c)-16}>y′</Label>
    <Segment map={m} a={s.origin} b={[1,2]} tone="gold" arrow/><Segment map={m} a={s.origin} b={[4,6]} tone="blue" arrow/>
    <Segment map={m} a={[1,2]} b={[4,6]} tone="rose" arrow/><Segment map={m} a={[-2,0]} b={[1,4]} tone="rose" arrow dash/>
    <Dot map={m} p={s.origin} name="O" tone="neutral" dx={-16} dy={22}/><Dot map={m} p={[1,2]} name="P"/><Dot map={m} p={[4,6]} name="Q" tone="blue"/>
  </>}</Plane></>;
}
export function LinkDrawing({theta=30,phi=60,reach=true}) {
  const s=twoLinkState(theta,phi);return <Plane label="Two joined rigid links with shoulder and relative elbow angles" extent={[-3.5,3.5,-3.5,3.5]}>{m=><>
    {reach&&<><circle cx={m.X(0)} cy={m.Y(0)} r={3*m.scale} className="geo-axis geo-dash"/><circle cx={m.X(0)} cy={m.Y(0)} r={m.scale} className="geo-axis geo-dash"/></>}
    <Segment map={m} a={[0,0]} b={s.elbow} arrow/><Segment map={m} a={s.elbow} b={s.endpoint} tone="blue" arrow/>
    <Segment map={m} a={s.elbow} b={[s.elbow[0]+Math.cos(theta*Math.PI/180),s.elbow[1]+Math.sin(theta*Math.PI/180)]} tone="neutral" dash/>
    <Angle map={m} origin={[0,0]} start={0} end={theta*Math.PI/180} radius={.65} directed/><Angle map={m} origin={s.elbow} start={theta*Math.PI/180} end={(theta+phi)*Math.PI/180} radius={.4} tone="blue" directed/>
    <Dot map={m} p={[0,0]} name="O" dx={-14} dy={-15}/><Dot map={m} p={s.elbow} name="E" dx={15} dy={-15}/><Dot map={m} p={s.endpoint} name="P" tone="blue" dx={15} dy={-15}/>
  </>}</Plane>;
}
