import { useId } from 'react';
import { flowNumber } from './LessonFlow.jsx';
import './concentration-reading-flow.css';
export const fmt = (x, digits = 6) => Number.isFinite(x) ? flowNumber(x, digits) : x === -Infinity ? '−∞' : 'undefined';
export function Figure({ job, children, caption }) {
  return <figure className="ci-figure" data-concentration-job={job}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Compare({ children }) { return <div className="ci-compare">{children}</div>; }
export function Scene({ label, height = 280, children, width = 440 }) {
  const title = useId();
  return <div className="ci-scene-region" tabIndex={0} role="region" aria-label={`${label}; use arrow keys if the drawing extends beyond this window`}><svg className="ci-scene" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width > 440 ? `${width}px` : '380px' }} role="img" aria-labelledby={title}><title id={title}>{label}</title>{children}</svg></div>;
}
export function Label({ x, y, children, anchor = 'middle', tone = '', ...props }) { return <text x={x} y={y} textAnchor={anchor} className={`ci-label ci-${tone}`} {...props}>{children}</text>; }
export function Arrow({ x1, y1, x2, y2, tone = 'gold' }) {
  const angle = Math.atan2(y2 - y1, x2 - x1), arm = 8;
  return <g className={`ci-stroke ci-${tone}`}><line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M${x2-arm*Math.cos(angle-.45)} ${y2-arm*Math.sin(angle-.45)}L${x2} ${y2}L${x2-arm*Math.cos(angle+.45)} ${y2-arm*Math.sin(angle+.45)}`} fill="none" /></g>;
}
export function Dot({ x, y, label, tone = 'cyan', r = 9 }) { return <g><circle cx={x} cy={y} r={r} className={`ci-fill ci-${tone}`} />{label !== undefined && <Label x={x} y={y + 27}>{label}</Label>}</g>; }
export function Coin({ x, y, value, label }) { return <g><circle cx={x} cy={y} r={17} className={`ci-outline ci-${value ? 'gold' : 'cyan'}`} /><Label x={x} y={y+5}>{value}</Label>{label && <Label x={x} y={y+35}>{label}</Label>}</g>; }
export function Table({ title, headers, rows, tall = false }) {
  return <div className="ci-table"><p className="ci-table-title">{title}</p><div className={`ci-table-region ${tall ? 'ci-table-region--tall' : ''}`} tabIndex={0} role="region" aria-label={`${title}; use arrow keys to inspect all cells`}><table><caption className="ci-hidden-caption">{title}</caption><thead><tr>{headers.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th key={j} scope="row">{v}</th>:<td key={j}>{v}</td>)}</tr>)}</tbody></table></div></div>;
}
export function plotTicks([lo, hi], pixelSpan) {
  const midpoint = (lo + hi) / 2;
  const hasInteriorZero = lo < 0 && hi > 0;
  const midpointClearsZero = Math.abs(midpoint) / (hi - lo) * pixelSpan >= 32;
  return [lo, ...(hasInteriorZero ? [0] : []),
    ...(!hasInteriorZero || midpointClearsZero ? [midpoint] : []), hi]
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((a, b) => a - b);
}
export function Plot({ label, xRange, yRange, lines, xLabel, yLabel, points = [], references = [], height = 300, width = 440 }) {
  const l=60,r=width-28,t=45,b=height-66;
  const X=x=>l+(x-xRange[0])/(xRange[1]-xRange[0])*(r-l),Y=y=>b-(y-yRange[0])/(yRange[1]-yRange[0])*(b-t);
  const xt=plotTicks(xRange,r-l),yt=plotTicks(yRange,b-t);
  return <Scene label={label} height={height} width={width}><Label x={20} y={24} anchor="start">{yLabel}</Label>{yt.map(v=><g key={v}><line x1={l} y1={Y(v)} x2={r} y2={Y(v)} className="ci-grid"/><Label x={l-10} y={Y(v)+5} anchor="end">{fmt(v,3)}</Label></g>)}<path d={`M${l} ${t}V${b}H${r}`} className="ci-axis" fill="none"/>{xt.map(v=><g key={v}><line x1={X(v)} y1={b} x2={X(v)} y2={b+6} className="ci-axis"/><Label x={X(v)} y={b+28}>{fmt(v,3)}</Label></g>)}{references.map((v,i)=><path key={i} d={v.x!==undefined?`M${X(v.x)} ${t}V${b}`:`M${l} ${Y(v.y)}H${r}`} className="ci-reference"/>)}{lines.map((s,i)=><path key={i} d={s.data.map(([x,y],j)=>`${j?'L':'M'}${X(x)} ${Y(y)}`).join(' ')} className={`ci-stroke ci-${s.tone||'gold'}`} fill="none"/>)}{points.map((p,i)=><g key={i}><circle cx={X(p.x)} cy={Y(p.y)} r={5} className={`ci-fill ci-${p.tone||'gold'}`}/>{p.label&&<Label x={X(p.x)} y={Y(p.y)+(p.dy||-15)}>{p.label}</Label>}</g>)}<Label x={(l+r)/2} y={height-10}>{xLabel}</Label></Scene>;
}
export function Law({ label, logMass, event = () => false, selected = null, maxMass = null, windowRange = null, massLabel = 'Probability mass', boundaries = [] }) {
  const masses=logMass.map(Math.exp),n=logMass.length-1,cap=maxMass||Math.max(...masses,1e-12),width=440;
  const [lo,hi]=windowRange||[0,n];
  const X=k=>62+(k-lo)*(width-92)/Math.max(1,hi-lo),Y=m=>215-m/cap*145,bw=Math.min(32,(width-92)/(hi-lo+1)*.7);
  return <Scene label={label} height={290} width={width}><Label x={15} y={24} anchor="start">{massLabel}</Label><path d={`M62 55V215H${width-30}`} className="ci-axis" fill="none"/><Label x={48} y={70} anchor="end">{fmt(cap,3)}</Label><Label x={48} y={220} anchor="end">0</Label>{masses.map((m,k)=>k<lo||k>hi?null:<g key={k}><rect x={X(k)-bw/2} y={Y(m)} width={bw} height={215-Y(m)} className={`ci-fill ci-${event(k)?'gold':'cyan'}`}/>{selected===k&&<circle cx={X(k)} cy={Y(m)-10} r={6} className="ci-selected"/>}</g>)}{boundaries.filter(k=>k>=lo&&k<=hi).map(k=><g key={k}><line x1={X(k)} x2={X(k)} y1={45} y2={215} className="ci-reference"/><Label x={X(k)} y={42}>{k}</Label></g>)}{[lo,Math.round((lo+hi)/2),hi].filter((v,i,a)=>a.indexOf(v)===i).map(k=><Label key={k} x={X(k)} y={245}>{k}</Label>)}<Label x={width/2} y={277}>Success count; amber = event</Label></Scene>;
}
export function Ranges({ label, rows, domain = [-3, 4], units = 'Value', height = null }) {
  const h = height || rows.length * 70 + 90;
  const X = v => 120 + (v - domain[0]) / (domain[1] - domain[0]) * 270;
  return <Scene label={label} height={h}>
    <Label x={20} y={25} anchor="start">{label}</Label>
    {rows.map((r, i) => {
      const endpoints = [r.a, r.b].filter((value, index, values) => values.indexOf(value) === index);
      const textClearance = Math.max(...endpoints.map(v => fmt(v, 4).length)) * 7 + 16;
      const closeEndpoints = endpoints.length === 2 && Math.abs(X(r.b) - X(r.a)) < textClearance;
      return <g key={i}>
        <Label x={15} y={64 + i * 70} anchor="start">{r.label}</Label>
        <line x1={X(r.a)} y1={60 + i * 70} x2={X(r.b)} y2={60 + i * 70} className={`ci-stroke ci-${r.tone || 'gold'}`} />
        {endpoints.map((v, j) => <g key={j}>
          <line x1={X(v)} y1={54 + i * 70} x2={X(v)} y2={66 + i * 70} className="ci-axis" />
          <Label x={X(v)} y={89 + i * 70 + (closeEndpoints && j === 1 ? 19 : 0)}>{fmt(v, 4)}</Label>
        </g>)}
        {r.mean !== undefined && <circle cx={X(r.mean)} cy={60 + i * 70} r={5} className="ci-fill ci-cyan" />}
      </g>;
    })}
    <Label x={220} y={h - 10}>{units}; common axis [{domain.join(', ')}]</Label>
  </Scene>;
}
export function Bars({ label, rows, range = [0, 1], units = 'Value' }) {
  const h=rows.length*66+100,X=v=>155+(v-range[0])/(range[1]-range[0])*230;
  return <Scene label={label} height={h}><Label x={20} y={24} anchor="start">{label}</Label>{rows.map((r,i)=><g key={i}><Label x={20} y={65+i*66} anchor="start">{r.label}</Label><line x1={X(0)} y1={61+i*66} x2={X(r.value)} y2={61+i*66} className={`ci-stroke ci-${r.tone||'gold'}`}/><circle cx={X(r.value)} cy={61+i*66} r={5} className={`ci-fill ci-${r.tone||'gold'}`}/><Label x={X(r.value)} y={86+i*66}>{fmt(r.value,5)}</Label></g>)}<path d={`M155 ${h-48}H385`} className="ci-axis"/>{[range[0],range[1]].map(v=><Label key={v} x={X(v)} y={h-26}>{fmt(v)}</Label>)}<Label x={270} y={h-5}>{units}</Label></Scene>;
}
