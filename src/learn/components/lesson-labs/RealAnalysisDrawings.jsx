import { useEffect, useId, useRef, useState } from 'react';

export const fmt = (value, digits = 5) => value === 0 ? '0' : Math.abs(value) < 1e-5 || Math.abs(value) >= 1e5 || Number(value.toFixed(digits))===0 ? value.toExponential(3) : Number(value.toFixed(digits)).toString();
export const samples = (fn, a, b, count = 160) => Array.from({ length: count + 1 }, (_, i) => ({ x: a + (b - a) * i / count, y: fn(a + (b - a) * i / count) }));

/** Core geometry fits the host in root-relative units; only full sweeps scroll vertically. */
export function Canvas({ label, width = 520, height = 320, bounded = false, children }) {
  const ref = useRef(null);
  const [available, setAvailable] = useState(width);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const host = ref.current;
    const measure = () => {
      const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setAvailable(Math.min(width, host.clientWidth * 16 / rootSize));
      setOverflows(host.scrollHeight > host.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    for (const child of host.children) observer.observe(child);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [width, height]);
  const logicalWidth = Math.max(160, available);
  const adaptive = typeof children === 'function';
  return <div className="ra-canvas">
    <div className={`ra-scroll ${bounded ? 'ra-reading-bounded' : ''}`} ref={ref}
      tabIndex={bounded ? 0 : undefined} role={bounded ? 'region' : undefined}
      aria-label={bounded ? `${label}; vertically scrollable complete diagram` : undefined}>
      <svg className="ra-svg" role="img" aria-label={label}
        viewBox={`0 0 ${adaptive ? logicalWidth : width} ${height}`}
        style={{ width: '100%', height: adaptive ? `${height / 16}rem` : 'auto' }}>
        {adaptive ? children({ width: logicalWidth, height }) : children}
      </svg>
    </div>
    {bounded && overflows && <p className="ra-scroll-hint">The full sweep continues below. Focus this region and use Up or Down to inspect every row.</p>}
  </div>;
}

export function Label({ x, y, children, anchor = 'middle', tone = '', ...props }) {
  return <text x={x} y={y} textAnchor={anchor} className={`ra-label ${tone}`} {...props}>{children}</text>;
}
export function Dot({ x, y, tone = 'gold', open = false, r = 4 }) {
  return <circle cx={x} cy={y} r={r} className={`ra-dot ${tone} ${open ? 'open' : ''}`} />;
}
export function Arrow({ x1, y1, x2, y2, tone = 'gold', dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1), size = 7;
  const head = [-0.48, 0.48].map(offset => [x2 - size * Math.cos(angle + offset), y2 - size * Math.sin(angle + offset)]);
  return <g className={`ra-stroke ${tone} ${dashed ? 'dashed' : ''}`}><line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M${head[0]}L${x2},${y2}L${head[1]}`} fill="none" /></g>;
}

export function ticks(a, b) {
  const result = [a, (a + b) / 2, b];
  if (a < 0 && b > 0 && !result.includes(0)) {
    if (Math.abs(result[1]) / (b - a) < 0.1) result.splice(1, 1);
    result.push(0);
  }
  return [...new Set(result)].sort((x, y) => x - y);
}

/** Paths are clipped; axes, object markers and annotation lanes stay independent. */
export function Plot({ label, domain = [0, 1], range = [0, 1], xLabel = 'Input x', yLabel = 'Value', lines = [], background, children }) {
  const id = useId().replaceAll(':', '');
  return <><p className="ra-axis-title">{yLabel}</p><Canvas label={label} height={340}>
    {({width}) => {
      const left = Math.min(90, width * .4), right = width - 12, top = 20, bottom = 225;
      const x = v => left + (v - domain[0]) / (domain[1] - domain[0]) * (right - left);
      const y = v => bottom - (v - range[0]) / (range[1] - range[0]) * (bottom - top);
      const g = { x, y, left, right, top, bottom };
      const xt = ticks(...domain), yt = ticks(...range);
      const positions = xt.map(t => { const size=fmt(t,4).length*8.5, pos=x(t); return [t===domain[0]?pos:t===domain[1]?pos-size:pos-size/2, t===domain[0]?pos+size:t===domain[1]?pos:pos+size/2]; });
      const stagger = positions.some((p,i)=>i>0&&positions[i-1][1]+5>p[0]);
      return <>
        <defs><clipPath id={id}><rect x={left} y={top} width={right-left} height={bottom-top} /></clipPath></defs>
        {yt.map(t => {const zeroLane=t===0&&yt.some(other=>other!==0&&Math.abs(y(other)-y(0))<24);return <g key={t}><line className="ra-grid" x1={left} x2={right} y1={y(t)} y2={y(t)} /><Label x={zeroLane?left+8:left-8} y={y(t)+5} anchor={zeroLane?'start':'end'}>{fmt(t,4)}</Label></g>;})}
        <g clipPath={`url(#${id})`}>
          {background?.(g)}
          {lines.map((line,i)=><polyline key={i} className={`ra-stroke ${line.tone||'gold'} ${line.dashed?'dashed':''}`} fill="none" points={line.points.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')}><title>{line.label||label}</title></polyline>)}
        </g>
        <path className="ra-axis" d={`M${left},${top}V${bottom}H${right}`} />
        {domain[0]<0&&domain[1]>0&&<line className="ra-axis dashed" x1={x(0)} x2={x(0)} y1={top} y2={bottom} />}
        {range[0]<0&&range[1]>0&&<line className="ra-axis dashed" x1={left} x2={right} y1={y(0)} y2={y(0)} />}
        {xt.map((t,i)=><Label key={t} x={x(t)} y={bottom+24+(stagger?i*22:0)} anchor={t===domain[0]?'start':t===domain[1]?'end':'middle'}>{fmt(t,4)}</Label>)}
        {children?.(g)}
      </>;
    }}
  </Canvas><p className="ra-axis-title">{xLabel}: {fmt(domain[0],8)} to {fmt(domain[1],8)}. Vertical scale: {fmt(range[0],8)} to {fmt(range[1],8)}.</p>
    {lines.length>1&&<ul className="ra-line-key" aria-label={`${label}; curve identities`}>{lines.map((line,i)=><li key={i}><svg aria-hidden="true" viewBox="0 0 40 10" className="ra-key-swatch"><line x1="0" x2="40" y1="5" y2="5" className={`ra-stroke ${line.tone||'gold'} ${line.dashed?'dashed':''}`} /></svg><span>{line.label}</span></li>)}</ul>}
  </>;
}

export function Panel({ title, children }) { return <section className="ra-panel"><p className="ra-panel-title">{title}</p>{children}</section>; }
export function Compare({ children }) { return <div className="ra-compare">{children}</div>; }
export function Figure({ job, title, caption, children }) { return <figure className="ra-figure" data-real-mechanism={job} aria-label={title}><p className="ra-figure-title">{title}</p>{children}<figcaption>{caption}</figcaption></figure>; }

export function Line({ label, domain = [0,1], rows, points = [], caption, ticks: markedTicks, cut, cutLabel }) {
  const actualRows=rows||[{a:domain[0],b:domain[1]}];
  return <div className="ra-number-lines"><p>{caption||'Number line: actual numerical positions'}. Common scale {fmt(domain[0],8)} to {fmt(domain[1],8)}.</p>
    {actualRows.map((row,i)=>{
      const selected=points.map((p,k)=>({...p,key:k})).filter(p=>(p.row||0)===i);
      const height=132+selected.length*25;
      return <div key={i}><p>{row.label}</p><Canvas label={`${label}; row ${i+1}`} height={height}>
        {({width})=>{const left=16,right=width-16,x=v=>left+(right-left)*(v-domain[0])/(domain[1]-domain[0]),yy=45+selected.length*25;
          return <><line x1={left} x2={right} y1={yy} y2={yy} className="ra-axis" />
            <line x1={x(row.a)} x2={x(row.b)} y1={yy} y2={yy} className={`ra-stroke ${row.tone||'gold'}`} />
            <Dot x={x(row.a)} y={yy} open={row.openLeft} tone={row.tone||'gold'} /><Dot x={x(row.b)} y={yy} open={row.openRight} tone={row.tone||'gold'} />
            {cut!=null&&<line className="ra-stroke rose dashed" x1={x(cut)} x2={x(cut)} y1={15} y2={yy+20} />}
            {selected.map((p,k)=><g key={p.key}><Dot x={x(p.value)} y={yy} tone={p.tone||'blue'} open={p.open} /><line className={`ra-stroke ${p.tone||'blue'}`} x1={x(p.value)} x2={x(p.value)} y1={yy-5} y2={25+k*25} /><Label x={x(p.value)} y={20+k*25} anchor={p.value===domain[0]?'start':p.value===domain[1]?'end':'middle'} tone={p.tone||'blue'}>{`p${p.key+1}`}</Label></g>)}
            {(markedTicks||ticks(...domain)).map((t,k)=><g key={t}><line className="ra-axis" x1={x(t)} x2={x(t)} y1={yy} y2={yy+6} /><Label x={x(t)} y={yy+30+(k%2?22:0)} anchor={t===domain[0]?'start':t===domain[1]?'end':'middle'}>{fmt(t,5)}</Label></g>)}
          </>;
        }}
      </Canvas>{selected.length>0&&<ul className="ra-point-key">{selected.map(p=><li key={p.key}><span className={`ra-key-role ${p.tone||'blue'}`}>{`p${p.key+1}`}</span>: {p.label||'selected point'}; position {fmt(p.value,8)}{p.open?'; excluded':''}.</li>)}</ul>}</div>;
    })}
    {cut!=null&&<p><span className="ra-key-role rose">Dashed cut</span>: {cutLabel||fmt(cut,8)}.</p>}
  </div>;
}

export function Table({ title, headers, rows }) {
  const ref=useRef(null), [overflows,setOverflows]=useState(false);
  useEffect(()=>{const host=ref.current,measure=()=>setOverflows(host.scrollWidth>host.clientWidth+1 || host.scrollHeight>host.clientHeight+1);measure();const observer=new ResizeObserver(measure);observer.observe(host);observer.observe(host.firstElementChild);document.fonts?.ready.then(measure);return()=>observer.disconnect();},[rows.length]);
  return <div className="ra-table-block"><p>{title}</p><div className={`ra-table-scroll ${rows.length > 8 ? 'ra-reading-bounded' : ''}`} ref={ref} tabIndex={0} role="region" aria-label={`${title}; scrollable complete table`}><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v == null ? 'undefined' : typeof v === 'number' ? fmt(v, 8) : v}</td>)}</tr>)}</tbody></table></div>{overflows&&<p className="ra-scroll-hint">Table continues within this region. Focus it and use Left/Right for columns and Up/Down for all rows.</p>}</div>;
}

export function Bars({ label, values, labels, maximum, yLabel = 'Magnitude', baseline = 0, tone = 'gold' }) {
  const min=Math.min(0,baseline,...values),max=maximum??Math.max(1e-9,baseline,...values);
  return <><p className="ra-axis-title">{yLabel}; fixed scale {fmt(min,8)} to {fmt(max,8)}.</p><Canvas label={label} height={300}>
    {({width})=>{const top=20,bottom=225,left=Math.min(90,width*.4),right=width-12,y=v=>bottom-(v-min)/(max-min)*(bottom-top),step=(right-left)/values.length;
      return <>{ticks(min,max).map(t=><g key={t}><line className="ra-grid" x1={left} x2={right} y1={y(t)} y2={y(t)} /><Label x={left-8} y={y(t)+5} anchor="end">{fmt(t,4)}</Label></g>)}
        {values.map((v,i)=><g key={i}><rect x={left+step*i+step*.12} y={Math.min(y(v),y(0))} width={step*.76} height={Math.abs(y(v)-y(0))} className={`ra-area ${tone}`} /><title>{`${labels?.[i]??i}: ${fmt(v,8)}`}</title></g>)}
        <line className="ra-axis" x1={left} x2={right} y1={y(0)} y2={y(0)} />
        {baseline!==0&&<line className="ra-stroke rose dashed" x1={left} x2={right} y1={y(baseline)} y2={y(baseline)} />}
        <Label x={left} y={bottom+24} anchor="start">{labels?.[0]??0}</Label><Label x={right} y={bottom+48} anchor="end">{labels?.at(-1)??values.length-1}</Label>
      </>;
    }}
  </Canvas>{values.length<=12&&<ol className="ra-bar-key">{values.map((v,i)=><li key={i}>Bar {labels?.[i]??i}: {fmt(v,8)}</li>)}</ol>}</>;
}

/** Addressed input/value/product channels with full decimal/fraction table below. */
export function WeightedJoin({ label, nodes, weights, values, result, weightText, valueText }) {
  const count=nodes.length,height=100+count*74;
  return <><p>Blue nodes feed their weighted products into the common rose accumulator. Each row keeps its original address k.</p><Canvas label={label} width={640} height={height}>
    {({width})=>{const input=25,product=width*.52,bus=width-25;return <>
      {nodes.map((node,i)=>{const y=45+i*74;return <g key={i}><Dot x={input} y={y} tone="blue" /><Label x={input} y={y+27}>{`k${i}`}</Label><Arrow x1={input+8} y1={y} x2={product-8} y2={y} tone="blue" /><Dot x={product} y={y} /><Label x={product} y={y+27}>{`t${i}`}</Label><Arrow x1={product+8} y1={y} x2={bus} y2={y} tone="rose" /></g>;})}
      <line className="ra-stroke rose" x1={bus} x2={bus} y1={45} y2={height-48} /><Dot x={bus} y={height-40} r={5} tone="rose" /><Label x={bus} y={height-12} anchor="end">sum</Label>
    </>;}}
  </Canvas><p>Accumulator value: {fmt(result,8)}.</p><ol className="ra-product-key">{nodes.map((node,i)=><li key={i}>k{i}: node {fmt(node)}, t{i} = {weightText?.[i]||fmt(weights[i])} × {valueText?.[i]||fmt(values[i])} = {fmt(weights[i]*values[i],8)}.</li>)}</ol>
    <Table title="Every addressed product contributes to the sum" headers={['k','k/n','Weight','Value','Product']} rows={nodes.map((node,i)=>[i,node,weightText?.[i]||weights[i],valueText?.[i]||values[i],weights[i]*values[i]])} />
  </>;
}

export function DistanceChain({ label, points, names, budgets }) {
  const min=Math.min(...points)-.06,max=Math.max(...points)+.06;
  return <><p>One actual value scale, {fmt(min,8)} to {fmt(max,8)}; connected distances add.</p><Canvas label={label} height={260}>
    {({width})=>{const x=v=>16+(width-32)*(v-min)/(max-min);return <>
      <line className="ra-axis" x1={16} x2={width-16} y1={80} y2={80} />
      {points.map((p,i)=><g key={i}><Dot x={x(p)} y={80} tone={i%2?'gold':'blue'} /><line className="ra-axis" x1={x(p)} x2={x(p)} y1={75} y2={26+i*20} /><Label x={x(p)} y={22+i*20}>{String.fromCharCode(65+i)}</Label></g>)}
      {points.slice(1).map((p,i)=><path key={i} className={`ra-stroke ${i===1?'rose':'blue'}`} d={`M${x(points[i])},${135+i*45}V${125+i*45}H${x(p)}V${135+i*45}`} fill="none" />)}
    </>;}}
  </Canvas><ul className="ra-point-key">{points.map((p,i)=><li key={i}>{String.fromCharCode(65+i)}: {names[i]} = {fmt(p,8)}.</li>)}{budgets.map((b,i)=><li key={`b${i}`}><span className={`ra-key-role ${i===1?'rose':'blue'}`}>{String.fromCharCode(65+i)} → {String.fromCharCode(66+i)}</span>: {b}.</li>)}</ul></>;
}
