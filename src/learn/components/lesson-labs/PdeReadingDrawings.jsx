import { useEffect, useId, useRef, useState } from 'react';
import './pde-reading-flow.css';

export const tones = { gold: '#e8b34b', blue: '#83c8dc', rose: '#dc9aae', violet: '#bca8dc', ink: '#dfdfdc', muted: '#92969c' };
export const f = (v, digits = 5) => !Number.isFinite(v) ? String(v) : v !== 0 && (Math.abs(v) < Math.max(1e-3,10**(-digits)) || Math.abs(v) > 1e5) ? v.toExponential(3).replace('-', '−') : Number(v.toFixed(digits)).toString().replace('-', '−');
export const samples = (fn, a = 0, b = 1, n = 120) => Array.from({ length: n + 1 }, (_, i) => [a + (b-a)*i/n, fn(a+(b-a)*i/n)]);
export function Inline({ id, label, children, caption }) {
  return <figure className="pde-reading-figure" data-pde-reading={id} aria-label={label}>{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
export function Panels({ children }) { return <div className="pde-reading-panels">{children}</div>; }
export function Svg({ label, height = 15, children, square = false }) {
  const ref = useRef(null), [size, setSize] = useState({ width: 320, root: 16 });
  useEffect(() => {
    const update = () => {
      const width = ref.current?.getBoundingClientRect().width;
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (width > 0) setSize(old => old.width === width && old.root === root ? old : { width, root });
    };
    update();
    const observer = new ResizeObserver(update);
    if (ref.current) observer.observe(ref.current);
    const typography = new MutationObserver(update);
    typography.observe(document.documentElement, { attributes: true, attributeFilter: ['style','class'] });
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); typography.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  const { width, root } = size, h = square ? width + root*3 : height*root;
  return <div ref={ref} className="pde-reading-canvas"><svg role="img" aria-label={label} viewBox={`0 0 ${width} ${h}`} style={{ height: h }}>
    {children({ width, height: h, r: root })}
  </svg></div>;
}
export function Text({ x, y, anchor = 'middle', tone = 'ink', children }) {
  return <text x={x} y={y} textAnchor={anchor} fill={tones[tone]}>{children}</text>;
}
export function Arrow({ x1, y1, x2, y2, tone = 'gold', dashed = false }) {
  const angle = Math.atan2(y2-y1, x2-x1), length = Math.hypot(x2-x1,y2-y1), a = Math.min(8,length/3);
  if (length < .01) return <circle cx={x1} cy={y1} r="3" fill={tones[tone]} />;
  return <g><line x1={x1} x2={x2} y1={y1} y2={y2} stroke={tones[tone]} strokeWidth="2" strokeDasharray={dashed ? '5 4' : undefined}/><path d={`M${x2-a*Math.cos(angle-.5)},${y2-a*Math.sin(angle-.5)}L${x2},${y2}L${x2-a*Math.cos(angle+.5)},${y2-a*Math.sin(angle+.5)}`} fill="none" stroke={tones[tone]} strokeWidth="2"/></g>;
}
export function Key({ items }) {
  return <ul className="pde-reading-key">{items.map((item,i) => <li key={item.label}><span aria-hidden="true" style={{ borderColor: tones[item.tone ?? ['gold','blue','rose','violet'][i%4]], borderTopStyle: item.dashed ? 'dashed' : 'solid' }}/>{item.label}</li>)}</ul>;
}
export function Plot({ label, lines, domain = [0,1], range, xLabel = 'Position x', yLabel = 'Field value u', point, background, extra, dots = [] }) {
  const values=lines.flatMap(l=>l.points.map(p=>p[1]));
  const low=range?.[0]??Math.min(0,...values), high=range?.[1]??Math.max(0,...values);
  const span=Math.max(1e-6,high-low), min=range?low:low-.1*span, max=range?high:high+.1*span;
  return <div className="pde-reading-plot"><p className="pde-reading-axis">{yLabel}</p><Svg label={label} height={14}>{({width,height,r})=>{
    const tickWidth=Math.max(...[min,(min+max)/2,max,0].map(v=>f(v,3).length))*.65*r;
    const left=Math.min(Math.max(4.5*r,tickWidth+.7*r),width*.45),right=width-.55*r,top=.8*r,bottom=height-2.5*r;
    const x=v=>left+(v-domain[0])/(domain[1]-domain[0])*(right-left),y=v=>bottom-(v-min)/(max-min)*(bottom-top);
    const interiorYZero=min<0&&max>0,interiorXZero=domain[0]<0&&domain[1]>0;
    const yMiddle=(min+max)/2,xMiddle=(domain[0]+domain[1])/2;
    const yTicks=[min,...(!interiorYZero||Math.abs(y(yMiddle)-y(0))>1.2*r?[yMiddle]:[]),...(interiorYZero?[0]:[]),max].filter((v,i,a)=>a.indexOf(v)===i);
    const xTicks=[domain[0],...(!interiorXZero||Math.abs(x(xMiddle)-x(0))>1.7*r?[xMiddle]:[]),...(interiorXZero?[0]:[]),domain[1]].filter((v,i,a)=>a.indexOf(v)===i);
    const zeroLabelY=Math.max(top+1.2*r,Math.min(bottom-1.2*r,y(0)));
    return <>{background?.({x,y,left,right,top,bottom,r})}
      {yTicks.map(v=>{const at=y(v),labelY=v===0&&interiorYZero?zeroLabelY:at;return <g key={v}><line className="pde-reading-grid" x1={left} x2={right} y1={at} y2={at}/>{labelY!==at&&<line x1={left-.15*r} x2={left-.35*r} y1={at} y2={labelY} stroke={tones.muted}/>}<Text x={left-.4*r} y={labelY+.3*r} anchor="end">{f(v,3)}</Text></g>;})}
      <line className="pde-reading-axis-line" x1={left} x2={right} y1={y(Math.max(min,Math.min(max,0)))} y2={y(Math.max(min,Math.min(max,0)))}/>
      {xTicks.map(v=><Text key={v} x={x(v)} y={bottom+(v===0&&interiorXZero?.5:1.5)*r} anchor={v===domain[0]?'start':v===domain[1]?'end':'middle'}>{f(v,3)}</Text>)}
      {lines.map((l,i)=><path key={l.label??i} d={l.points.map(([a,b],j)=>`${j?'L':'M'}${x(a)},${y(b)}`).join(' ')} fill="none" stroke={tones[l.tone??['gold','blue','rose','violet'][i%4]]} strokeWidth="2.2" strokeDasharray={l.dashed?'5 4':undefined}/>)}
      {point&&<><line x1={x(point[0])} x2={x(point[0])} y1={top} y2={bottom} stroke={tones.muted} strokeDasharray="4 4"/><circle cx={x(point[0])} cy={y(point[1])} r="4" fill={tones.rose}/></>}
      {dots.map(([a,b],i)=><circle key={i} cx={x(a)} cy={y(b)} r="4" fill={tones.blue}/>)}
      {extra?.({x,y,left,right,top,bottom,r})}
    </>;
  }}</Svg><p className="pde-reading-axis">{xLabel}. Scale {f(domain[0])} to {f(domain[1])}; vertical {f(min)} to {f(max)}.</p>{lines.some(l=>l.label)&&<Key items={lines.filter(l=>l.label).map((l,i)=>({...l,tone:l.tone??['gold','blue','rose','violet'][i%4]}))}/>}</div>;
}
export function Table({ label, headers, rows }) {
  const id=useId();
  return <div className="pde-reading-table"><p id={id}>{label}</p><div className="pde-reading-scroll" role="region" aria-labelledby={id} tabIndex={0}><table><thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div><p className="pde-reading-scroll-note">If the table continues, focus this region and use Left/Right for columns or Up/Down for rows.</p></div>;
}
export function SpaceTime({ label, domain=[0,1], maxTime=1, trajectories=[], point, foot, cone, edges=[], children }) {
  return <div><p className="pde-reading-axis">Time t</p><Svg label={label} height={15}>{({width,height,r})=>{
    const left=Math.min(3*r,width*.3),right=width-r,top=r,bottom=height-3*r;
    const x=v=>left+(v-domain[0])/(domain[1]-domain[0])*(right-left),y=v=>bottom-v/maxTime*(bottom-top);
    return <><line className="pde-reading-axis-line" x1={left} x2={right} y1={bottom} y2={bottom}/><line className="pde-reading-axis-line" x1={left} x2={left} y1={top} y2={bottom}/>
      <Text x={left-.35*r} y={top+.3*r} anchor="end">{f(maxTime)}</Text><Text x={left-.35*r} y={bottom+.3*r} anchor="end">0</Text>
      {cone&&point&&<path d={`M${x(cone[0])} ${y(0)}L${x(point[0])} ${y(point[1])}L${x(cone[1])} ${y(0)}Z`} fill={tones.blue} opacity=".12"/>}
      {edges.map((e,i)=><path key={i} d={e.points.map(([a,b],j)=>`${j?'L':'M'}${x(a)} ${y(b)}`).join(' ')} fill="none" stroke={tones[e.tone??'blue']} strokeWidth="3" strokeDasharray={e.dashed?'5 4':undefined}/>)}
      {trajectories.map((line,i)=><path key={i} d={line.map(([a,b],j)=>`${j?'L':'M'}${x(a)},${y(b)}`).join(' ')} fill="none" stroke={tones.blue} opacity=".75" strokeWidth="1.4"/>)}
      {foot&&point&&<><Arrow x1={x(point[0])} y1={y(point[1])} x2={x(foot[0])} y2={y(foot[1])}/><circle cx={x(foot[0])} cy={y(foot[1])} r="4" fill={tones.gold}/></>}
      {point&&<circle cx={x(point[0])} cy={y(point[1])} r="4" fill={tones.rose}/>}
      {[domain[0],(domain[0]+domain[1])/2,domain[1]].map((v,i)=><Text key={i} x={x(v)} y={bottom+1.5*r} anchor={i===0?'start':i===2?'end':'middle'}>{f(v)}</Text>)}
      {children?.({x,y,left,right,top,bottom,r})}
    </>;
  }}</Svg><p className="pde-reading-axis">Position x; {f(domain[0])} to {f(domain[1])}. Time 0 to {f(maxTime)}.</p></div>;
}
export function Rod({ label, points=[0,.25,.5,.75,1], domain=[0,1], values=[], leftFlux, rightFlux, source, sourceAmount=1, selected=.5, caption }) {
  return <div><Svg label={label} height={11}>{({width,r})=>{
    const left=r,right=width-r,a=v=>left+v*(right-left),x=v=>a((v-domain[0])/(domain[1]-domain[0])),y=4*r;
    return <><line x1={left} x2={right} y1={y} y2={y} stroke={tones.muted} strokeWidth="12"/>
      {points.map((p,i)=><g key={p}><circle cx={x(p)} cy={y} r={p===selected?6:4} fill={p===selected?tones.gold:tones.blue}/><Text x={x(p)} y={y+1.7*r} anchor={i===0?'start':i===points.length-1?'end':'middle'}>{f(p)}</Text></g>)}
      {leftFlux!==undefined&&<Arrow x1={a(.2)} y1={1.5*r} x2={a(leftFlux===0?.2:leftFlux>0?0:.4)} y2={1.5*r} tone="blue"/>}
      {rightFlux!==undefined&&<Arrow x1={a(.8)} y1={1.5*r} x2={a(rightFlux===0?.8:rightFlux>0?1:.6)} y2={1.5*r} tone="rose"/>}
      {source!==undefined&&<><Arrow x1={a(.5)} y1={(sourceAmount<0?6:8.5)*r} x2={a(.5)} y2={(sourceAmount>0?6:8.5)*r} tone={sourceAmount<0?'rose':'gold'}/><Text x={a(.5)} y={10*r}>{source}</Text></>}
    </>;
  }}</Svg>{values.length>0&&<Table label="Positions and assigned values" headers={['Position','Value']} rows={points.map((p,i)=>[f(p),f(values[i])])}/>}<p>{caption}</p></div>;
}
export function SignedBars({ label, rows, maximum }) {
  const max=maximum??Math.max(...rows.map(x=>Math.abs(x.value)),1e-8);
  return <div className="pde-reading-bars"><p>{label}; common absolute scale {f(max)}.</p>{rows.map(row=><div className="pde-reading-bar" key={row.label}><span>{row.label}</span><div className="pde-reading-bar-track"><i style={{ width:`${50*Math.abs(row.value)/max}%`,left:row.value<0?`${50-50*Math.abs(row.value)/max}%`:'50%',background:tones[row.tone??(row.value<0?'rose':'blue')] }}/></div><strong>{f(row.value)}</strong></div>)}</div>;
}
export function SquareField({ label, evaluate, position=.5, depth=.5, cells=24, max=1 }) {
  return <div><p className="pde-reading-axis">Vertical position y; equal horizontal and vertical units.</p><Svg label={label} square>{({width,r})=>{
    const left=Math.min(2.2*r,width*.22),side=width-left-.8*r,top=r,x=a=>left+a*side,y=a=>top+(1-a)*side;
    return <>{Array.from({length:cells*cells},(_,i)=>{
      const row=Math.floor(i/cells),col=i%cells,v=evaluate((col+.5)/cells,(row+.5)/cells),tone=v>=0?tones.gold:tones.blue;
      return <rect key={i} x={x(col/cells)} y={y((row+1)/cells)} width={side/cells+.2} height={side/cells+.2} fill={tone} opacity={.04+.88*Math.min(1,Math.abs(v)/max)}/>;
    })}<rect x={left} y={top} width={side} height={side} className="pde-reading-outline"/>
      <line x1={x(position)} x2={x(position)} y1={top} y2={top+side} stroke={tones.rose} strokeDasharray="4 4"/><line x1={left} x2={left+side} y1={y(depth)} y2={y(depth)} stroke={tones.rose} strokeDasharray="4 4"/><circle cx={x(position)} cy={y(depth)} r="4" fill={tones.ink}/>
      <Text x={left-.4*r} y={y(1)+.3*r} anchor="end">1</Text><Text x={left-.4*r} y={y(0)+.3*r} anchor="end">0</Text><Text x={left} y={top+side+1.5*r} anchor="start">0</Text><Text x={left+side} y={top+side+1.5*r} anchor="end">1</Text>
    </>;
  }}</Svg><p className="pde-reading-axis">Horizontal position x. Blue negative, charcoal zero, amber positive; opacity = 0.04 + 0.88 min(1, |u|/{f(max)}). Sampled cell centres; continuous slices use the formula.</p></div>;
}
