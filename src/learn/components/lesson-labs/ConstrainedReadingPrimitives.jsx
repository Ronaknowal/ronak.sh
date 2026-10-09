import {useId, useLayoutEffect, useRef, useState} from 'react';

export const ink = {
  cyan: '#97BFCA', amber: '#EDC267', violet: '#B8A6DA', rose: '#E6A1B0',
  slate: '#A8B0BD', blue: '#89AEE1', neutral: '#DEDED9', surface: '#101010',
};
export const identity = {
  S: ['cyan', 'circle'], C: ['amber', 'triangle'], M: ['violet', 'square'],
  L: ['rose', 'diamond'], G: ['slate', 'cross'],
};
export const cylinderIdentity = {3: ['amber', 'triangle'], 4: ['cyan', 'circle'], 5: ['violet', 'square'], 6: ['rose', 'diamond'], 8: ['blue', 'cross']};
export function number(value, precision = 6) {
  if (value === null || !Number.isFinite(value)) return 'not available';
  if (value === 0) return '0';
  return Math.abs(value) < 1e-4 || Math.abs(value) > 1e5 ? value.toExponential(3) : String(Number(value.toPrecision(precision)));
}
export const pair = value => `(${value.map(x => number(x)).join(', ')})`;
export function Figure({id, caption, children}) {
  return <figure className="co-mechanism" data-mechanism={id}>{children}<figcaption>{caption}</figcaption></figure>;
}
export const Panels = ({children}) => <div className="co-panels">{children}</div>;
export const Operation = ({children}) => <p className="co-operation">{children}</p>;
export function Facts({rows}) {
  return <dl className="co-facts">{rows.map(([label, value], i) => <div key={i}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
export function Table({headers, rows, caption}) {
  const ref = useRef(null);
  const [wide, setWide] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    const measure = () => setWide(node.scrollWidth > node.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [rows]);
  return <div className="co-table"><p>{caption}</p>{wide && <p className="co-scroll-cue">Scroll horizontally for every column. Focus the table and use arrow keys.</p>}<div ref={ref} role="region" aria-label={caption} tabIndex={0}><table><thead><tr>{headers.map((text, i) => <th key={i}>{text}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></div>;
}
export function Glyph({name, color = 'cyan', shape = 'circle', hollow = false}) {
  const c = ink[color] || color;
  return <span className="co-identity" style={{color: c}}><svg width="1em" height="1em" viewBox="-8 -8 16 16" aria-hidden="true"><Shape x={0} y={0} radius={5} color={c} shape={shape} hollow={hollow}/></svg>{name}</span>;
}
export function Shape({x, y, radius: r, color, shape = 'circle', hollow = false}) {
  const common = {fill: hollow ? ink.surface : color, stroke: color, strokeWidth: 1.8};
  if (shape === 'square') return <rect x={x-r} y={y-r} width={2*r} height={2*r} {...common}/>;
  if (shape === 'diamond') return <path d={`M${x} ${y-r*1.4}L${x+r*1.4} ${y}L${x} ${y+r*1.4}L${x-r*1.4} ${y}Z`} {...common}/>;
  if (shape === 'triangle') return <path d={`M${x} ${y-r*1.4}L${x+r*1.3} ${y+r}L${x-r*1.3} ${y+r}Z`} {...common}/>;
  if (shape === 'cross') return <path d={`M${x-r} ${y-r}L${x+r} ${y+r}M${x+r} ${y-r}L${x-r} ${y+r}`} fill="none" stroke={color} strokeWidth="2.3"/>;
  return <circle cx={x} cy={y} r={r} {...common}/>;
}

// Actual container pixels and a rem probe determine every mounted drawing.
// Coordinate geometry and label sizes therefore respond to root-text changes.
export function Plot({domain = [-1, 3], range = [-1, 3], equal = false, xLabel = 'x₁', yLabel = 'x₂', description, htmlAxes=false, children}) {
  const ref = useRef(null), probe = useRef(null);
  const [size, setSize] = useState({width: 520, font: 16});
  const uid = useId().replace(/:/g, '');
  useLayoutEffect(() => {
    const measure = () => {
      const width = ref.current.getBoundingClientRect().width;
      const font = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setSize(previous => Math.abs(previous.width-width)<.1 && Math.abs(previous.font-font)<.01 ? previous : {width, font});
    };
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    observer.observe(probe.current);
    measure();
    return () => observer.disconnect();
  }, []);
  const f = size.font, width = Math.max(160, size.width);
  const left = 3.1*f, right = 1.2*f;
  const wrap = text => {
    const capacity=Math.max(12,Math.floor((width-left-right)/(.5*f))), lines=[''];
    for(const word of text.split(' ')){const i=lines.length-1;if(lines[i] && lines[i].length+1+word.length>capacity)lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}
    return lines;
  };
  const yLines=wrap(yLabel),xLines=wrap(xLabel),top=(1.3+yLines.length)*f,bottom=(2.3+xLines.length)*f;
  const pw = Math.max(50, width-left-right);
  const ph = equal ? pw*(range[1]-range[0])/(domain[1]-domain[0]) : Math.max(7*f, Math.min(12*f,pw*.65));
  const height = top+ph+bottom;
  const x = value => left+(value-domain[0])/(domain[1]-domain[0])*pw;
  const y = value => top+(range[1]-value)/(range[1]-range[0])*ph;
  const color = value => ink[value] || value;
  const line = (a,b,c='neutral',props={}) => <line x1={x(a[0])} y1={y(a[1])} x2={x(b[0])} y2={y(b[1])} stroke={color(c)} strokeWidth="2" {...props}/>;
  const arrow = (a,b,c='neutral',props={}) => {
    const length=Math.hypot(x(b[0])-x(a[0]),y(b[1])-y(a[1]));
    if(length<.05) return null;
    return line(a,b,c,{...(length>.6*f?{markerEnd:`url(#co-arrow-${uid})`}:{}),...props});
  };
  const path = (points,c='cyan',props={}) => <path d={points.map((p,i)=>`${i?'L':'M'}${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke={color(c)} strokeWidth="2.4" {...props}/>;
  const curve = (fn,c='cyan',lo=domain[0],hi=domain[1],props={}) => path(Array.from({length:161},(_,i)=>{const xx=lo+(hi-lo)*i/160;return [xx,fn(xx)];}),c,props);
  const polygon = (points,c='cyan',props={}) => <polygon points={points.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')} fill={color(c)} fillOpacity=".12" {...props}/>;
  const mark = (p,{color:c='cyan',shape='circle',hollow=false,selected=false,label='',dx=0,dy=-.65,anchor='middle'}={}) => <g><Shape x={x(p[0])} y={y(p[1])} radius={.23*f} color={color(c)} shape={shape} hollow={hollow}/>{selected && <circle cx={x(p[0])} cy={y(p[1])} r={.48*f} fill="none" stroke={ink.neutral} strokeWidth="1.6"/>}{label && <text x={x(p[0])+dx*f} y={y(p[1])+dy*f} textAnchor={anchor} fill={color(c)}>{label}</text>}</g>;
  const ticks = values => {
    const axisLength=values===domain?pw:ph, span=values[1]-values[0];
    const zeroFits=values[0]<0 && values[1]>0 && Math.min(-values[0],values[1])/span*axisLength>2.4*f;
    return [...new Set([values[0],...(zeroFits?[0]:[]),values[1]])];
  };
  return <div ref={ref} className="co-plot"><span ref={probe} className="co-rem-probe"/><svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description || `${yLabel} against ${xLabel}`} style={{fontSize:.875*f}}><defs><marker id={`co-arrow-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker><clipPath id={`co-clip-${uid}`}><rect x={left-.6*f} y={top-.7*f} width={pw+1.2*f} height={ph+1.4*f}/></clipPath></defs><path d={`M${left} ${top}V${top+ph}H${left+pw}`} fill="none" stroke="#666"/>{domain[0]<0 && domain[1]>0 && line([0,range[0]],[0,range[1]],'#494949')}{range[0]<0 && range[1]>0 && line([domain[0],0],[domain[1],0],'#494949')}{ticks(domain).map(v=><text key={v} x={x(v)} y={top+ph+1.3*f} textAnchor={v===domain[0]?'start':v===domain[1]?'end':'middle'}>{number(v,3)}</text>)}{ticks(range).map(v=><text key={v} x={left-.35*f} y={y(v)+.3*f} textAnchor="end">{number(v,3)}</text>)}{!htmlAxes && <><text x={left} y={1.15*f}>{yLines.map((label,i)=><tspan key={i} x={left} dy={i?f:0}>{label}</tspan>)}</text><text x={left+pw/2} y={top+ph+2.8*f} textAnchor="middle">{xLines.map((label,i)=><tspan key={i} x={left+pw/2} dy={i?f:0}>{label}</tspan>)}</text></>}<g clipPath={`url(#co-clip-${uid})`}>{children({x,y,f,line,arrow,path,curve,polygon,mark,color})}</g></svg>{htmlAxes && <><div className="co-html-axis" style={{left,top:.1*f,width:pw}}>{yLines.map((label,i)=><div key={i}>{label}</div>)}</div><div className="co-html-axis" style={{left,top:top+ph+2.05*f,width:pw,textAlign:"center"}}>{xLines.map((label,i)=><div key={i}>{label}</div>)}</div></>}</div>;
}

export function Bars({rows, low = 0, high, label}) {
  const max = high ?? Math.max(...rows.map(row => row.value), 1);
  const zero = 100*(0-low)/(max-low);
  return <div className="co-bars" role="img" aria-label={label}>{rows.map((row,i)=><div className="co-bar-row" key={i}><span>{row.label}</span><div className="co-bar-track"><i className="co-bar-zero" style={{left:`${zero}%`}}/><i className="co-bar" style={{left:`${100*(Math.min(0,row.value)-low)/(max-low)}%`,width:`${100*Math.abs(row.value)/(max-low)}%`,background:ink[row.color] || ink.cyan}}/>{row.marker !== undefined && <i className="co-bar-marker" style={{left:`${100*(row.marker-low)/(max-low)}%`}}/>}</div><span>{number(row.value)}</span></div>)}<p className="co-scale">{number(low)} to {number(max)} · {label}</p></div>;
}

export function NumberInput({label, value, min, max, step = .1, onChange}) {
  const [draft,setDraft] = useState(String(value));
  const [error,setError] = useState('');
  useLayoutEffect(()=>{setDraft(String(value));setError('');},[value]);
  const change = event => {
    const next = event.target.value;
    setDraft(next);
    const n = Number(next);
    if (next.trim()==='' || !Number.isFinite(n) || n<min || n>max || (step===1 && !Number.isInteger(n))) {
      setError(`Use ${step===1?'an integer':'a number'} from ${min} to ${max}. Last valid picture remains.`);
    } else {setError('');onChange(n);}
  };
  return <label className="co-input">{label}<input type="number" value={draft} min={min} max={max} step={step} onChange={change} aria-invalid={!!error}/>{error && <span role="status">{error}</span>}</label>;
}
