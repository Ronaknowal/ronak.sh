import { useEffect, useId, useRef, useState } from 'react';
import './variational-reading-flow.css';

export const vf = (value, digits = 6) => value === null || value === undefined || Number.isNaN(value) ? 'undefined' : !Number.isFinite(value) ? value < 0 ? '−∞' : '∞' : (value === 0 ? '0' : Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6 ? value.toExponential(digits - 1) : String(Number(value.toFixed(digits)))).replace(/-/g, '−');
export const vc = ['#e7b54a', '#70bdcc', '#d89ca9', '#b2a0d7'];
export function VFigure({ id, children, caption }) {
  return <figure className="vi-figure" data-mechanism={id} aria-label={id}>{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
export function VRegion({ label, kind = 'drawing', className = '', children }) {
  const ref = useRef(null), hint = useId();
  const [axes, setAxes] = useState([false, false]);
  useEffect(() => {
    const node = ref.current;
    const measure = () => {
      const next = [node.scrollWidth > node.clientWidth + 2, node.scrollHeight > node.clientHeight + 2];
      setAxes(old => old[0] === next[0] && old[1] === next[1] ? old : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  const scrolling = axes.some(Boolean);
  return <div className="vi-reading-region">
    {scrolling && <p className="vi-scroll-hint" id={hint}>Scroll to see the complete {kind}. Focus this region and use {axes[0] && axes[1] ? 'Left/Right and Up/Down' : axes[0] ? 'Left/Right' : 'Up/Down'} arrow keys.</p>}
    <div ref={ref} className={className} role="region" tabIndex={0} aria-label={label} aria-describedby={scrolling ? hint : undefined}>{children}</div>
  </div>;
}
export function VScene({ label, width = 680, height = 320, children }) {
  const title = useId();
  return <VRegion label={label} className="vi-scene-region"><svg className="vi-scene" viewBox={`0 0 ${width} ${height}`} style={{ width: `${width / 16}rem`, maxWidth: '100%' }} role="img" aria-labelledby={title}><title id={title}>{label}</title>{children}</svg></VRegion>;
}
export function VResponsive({ maximum = 680, children }) {
  const ref = useRef(null), probe = useRef(null);
  const [width, setWidth] = useState(240);
  useEffect(() => {
    const node = ref.current, remNode = probe.current;
    const measure = () => {
      if (ref.current !== node) return;
      const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      const next = Math.max(180, Math.min(maximum, Math.floor(node.clientWidth / unit)));
      setWidth(old => old === next ? old : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node); observer.observe(remNode); measure();
    return () => observer.disconnect();
  }, [maximum]);
  return <div className="vi-responsive" ref={ref}><span ref={probe} className="vi-rem-probe" aria-hidden="true" />{children(width)}</div>;
}
export function VLabel({ x, y, colour = '#ddd', anchor = 'start', children, halo = false }) {
  return <text x={x} y={y} fill={colour} textAnchor={anchor} className="vi-label" stroke={halo ? '#171717' : undefined} strokeWidth={halo ? 5 : undefined} paintOrder="stroke fill">{children}</text>;
}
export function VArrow({ x1, y1, x2, y2, colour = '#aaa', dashed = false }) {
  if (Math.hypot(x2-x1,y2-y1) < .01) return null;
  const angle = Math.atan2(y2 - y1, x2 - x1), r = 7;
  const points = [[x2,y2],[x2-r*Math.cos(angle-.5),y2-r*Math.sin(angle-.5)],[x2-r*Math.cos(angle+.5),y2-r*Math.sin(angle+.5)]];
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colour} strokeWidth={2} strokeDasharray={dashed ? '5 4' : undefined} /><polygon points={points.map(p => p.join(',')).join(' ')} fill={colour} /></g>;
}
export function VTable({ label, columns, rows, tall = false }) {
  return <div className="vi-table"><p className="vi-table-label">{label}</p><VRegion label={label} kind="table" className={`vi-table-region${tall ? ' vi-table-region--tall' : ''}`}><table><thead><tr>{columns.map((c,i) => <th scope="col" key={i}>{c}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={i}>{row.map((cell,j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></VRegion></div>;
}
export function VPlot({ label, xDomain, yDomain, xLabel, yLabel, series = [], references = [], width = 680, height = 330, equal = false, background, children }) {
  const clip = useId();
  const named=[...series.map((s,i)=>s.name ? {name:s.name,colour:s.colour || vc[i%4]} : null),...references.map(r=>r.name ? {name:r.name+' (dashed)',colour:r.colour || '#888'} : null)].filter(Boolean);
  return <VResponsive maximum={width}>{canvas => {
    const left=Math.max(78,...[yDomain[0],yDomain[1]].map(v=>vf(v,3).length*9+20)), right=canvas-22, top=16;
    const drawable=right-left;
    const plotHeight=equal ? drawable*(yDomain[1]-yDomain[0])/(xDomain[1]-xDomain[0]) : Math.min(260,Math.max(180,height-117));
    const bottom=top+plotHeight, sceneHeight=bottom+48;
    const sx=drawable/(xDomain[1]-xDomain[0]),sy=plotHeight/(yDomain[1]-yDomain[0]);
    const scale=equal ? Math.min(sx,sy) : null;
    const x=v=>left+(drawable-(scale ? scale*(xDomain[1]-xDomain[0]) : drawable))/2+(v-xDomain[0])*(scale || sx);
    const y=v=>bottom-(plotHeight-(scale ? scale*(yDomain[1]-yDomain[0]) : plotHeight))/2-(v-yDomain[0])*(scale || sy);
    // Keep true endpoint anchors. Include an interior zero only when its label clears both ends.
    const showXZero=xDomain[0]<0 && xDomain[1]>0 && xDomain.every(v=>Math.abs(x(v)-x(0)) >= (vf(v,3).length+1)*4.5+12);
    const showYZero=yDomain[0]<0 && yDomain[1]>0 && yDomain.every(v=>Math.abs(y(v)-y(0)) >= 24);
    const xt=[...new Set([xDomain[0],...(showXZero ? [0] : []),xDomain[1]])];
    const yt=[...new Set([yDomain[0],...(showYZero ? [0] : []),yDomain[1]])];
    return <>{named.length>0 && <p className="vi-series-key">{named.map((s,i)=><span key={i} style={{color:s.colour}}>{s.name}</span>)}</p>}
      <p className="vi-axis-label">Vertical axis: {yLabel}</p>
      <VScene label={label} width={canvas} height={sceneHeight}>
        <defs><clipPath id={clip}><rect x={x(xDomain[0])} y={y(yDomain[1])} width={x(xDomain[1])-x(xDomain[0])} height={y(yDomain[0])-y(yDomain[1])} /></clipPath></defs>
        <line x1={x(xDomain[0])} x2={x(xDomain[1])} y1={y(yDomain[0])} y2={y(yDomain[0])} stroke="#888" />
        <line x1={x(xDomain[0])} x2={x(xDomain[0])} y1={y(yDomain[0])} y2={y(yDomain[1])} stroke="#888" />
        <g clipPath={`url(#${clip})`}>
          {typeof background==='function' ? background({x,y,left,right,top,bottom}) : background}
          {references.map((r,i)=>r.axis==='x' ? <line key={i} x1={x(r.value)} x2={x(r.value)} y1={y(yDomain[0])} y2={y(yDomain[1])} stroke={r.colour || '#888'} strokeDasharray="5 4" /> : <line key={i} x1={x(xDomain[0])} x2={x(xDomain[1])} y1={y(r.value)} y2={y(r.value)} stroke={r.colour || '#888'} strokeDasharray="5 4" />)}
          {series.map((s,i)=><g key={i}>{s.area && <polygon points={[`${x(s.points[0][0])},${y(0)}`,...s.points.map(p=>`${x(p[0])},${y(p[1])}`),`${x(s.points.at(-1)[0])},${y(0)}`].join(' ')} fill={s.colour || vc[i%4]} opacity={.22} />}{s.connect!==false && <polyline points={s.points.filter(p=>p.every(Number.isFinite)).map(p=>`${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke={s.colour || vc[i%4]} strokeWidth={2} />}{s.dots && s.points.filter(p=>p.every(Number.isFinite)).map((p,j)=><circle key={j} cx={x(p[0])} cy={y(p[1])} r={4} fill={s.colour || vc[i%4]} />)}</g>)}
          {typeof children==='function' ? children({x,y,left,right,top,bottom}) : children}
        </g>
        {xt.map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1={bottom} y2={bottom+6} stroke="#888" /><VLabel x={x(v)} y={bottom+27} anchor="middle" halo>{vf(v,3)}</VLabel></g>)}
        {yt.map(v=><g key={v}><line x1={left-6} x2={left} y1={y(v)} y2={y(v)} stroke="#888" /><VLabel x={left-12} y={y(v)+5} anchor="end" halo>{vf(v,3)}</VLabel></g>)}
      </VScene><p className="vi-axis-label">Horizontal axis: {xLabel}</p>
    </>;
  }}</VResponsive>;
}
export function VBars({ label, columns, rows, signed = false, max = null, controls = null }) {
  const values=rows.flatMap(r=>r.slice(1).filter(v=>typeof v==='number' && Number.isFinite(v)));
  const extent=max || Math.max(.001,...values.map(Math.abs));
  return <VResponsive>{width => {
    const left=12,right=width-12,zero=signed ? width/2 : left,unit=(right-left)/(signed ? 2 : 1)/extent;
    return <><p className="vi-series-key">{columns.slice(1).map((column,i)=><span key={i} style={{color:vc[i%4]}}>{column}</span>)}</p>
      <p className="vi-axis-label">Common quantitative axis: {signed ? vf(-extent)+' through 0 to '+vf(extent) : '0 to '+vf(extent)}. The vertical line marks zero.</p>
      {rows.map((row,i)=><div className="vi-bar-row" key={i}><p className="vi-bar-name">{row[0]}</p>
        <VScene label={label+'; '+row[0]} width={width} height={26+row.slice(1).length*30}>
          <line x1={zero} x2={zero} y1={2} y2={22+row.slice(1).length*30} stroke="#888" />
          {row.slice(1).map((value,j)=>Number.isFinite(value) ? <rect key={j} x={zero+Math.min(0,value*unit)} y={12+j*30} width={Math.abs(value)*unit} height={12} fill={vc[j%4]} /> : null)}
        </VScene><p className="vi-bar-values">{row.slice(1).map((value,j)=><span key={j} style={{color:vc[j%4]}}>{columns[j+1]}: {vf(value)}</span>)}</p>
      </div>)}
      {controls}<VTable label={label+'; complete numerical values'} columns={columns} rows={rows.map(row=>row.map(v=>typeof v==='number' ? vf(v) : v))} /></>;
  }}</VResponsive>;
}
