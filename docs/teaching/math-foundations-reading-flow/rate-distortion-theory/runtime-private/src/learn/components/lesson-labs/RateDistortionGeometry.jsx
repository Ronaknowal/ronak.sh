import {useId,useLayoutEffect,useRef,useState} from 'react';
export const ink={amber:'#E6AD55',blue:'#79B8E8',lavender:'#BCA4E8',coral:'#E6A1B0',neutral:'#DEDED9',surface:'#101010',cyan:'#79B8E8',violet:'#BCA4E8'};
export const number=(v,p=7)=>v===null?'unavailable':v===Infinity?'∞':!Number.isFinite(v)?'unavailable':v===0?'0':Math.abs(v)<1e-5? v.toExponential(3):String(Number(v.toPrecision(p)));
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
export function Plot({domain = [-1, 3], range = [-1, 3], equal = false, xLabel = 'x₁', yLabel = 'x₂', description, htmlAxes=false, xTickFormat=number, yTickFormat=number, children}) {
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
  const yTickCharacters=Math.max(...range.map(v=>String(yTickFormat(v,3)).length));
  const left = Math.max(3.1,.5*yTickCharacters+.65)*f, right = 1.2*f;
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
    return line(a,b,c,{...(length>.6*f?{markerEnd:`url(#rd-arrow-${uid})`}:{}),...props});
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
  return <div ref={ref} className="rd-plot"><span ref={probe} className="rd-rem-probe"/><svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description || `${yLabel} against ${xLabel}`} style={{fontSize:.875*f}}><defs><marker id={`rd-arrow-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker><clipPath id={`rd-clip-${uid}`}><rect x={left-.6*f} y={top-.7*f} width={pw+1.2*f} height={ph+1.4*f}/></clipPath></defs><path d={`M${left} ${top}V${top+ph}H${left+pw}`} fill="none" stroke="#666"/>{domain[0]<0 && domain[1]>0 && line([0,range[0]],[0,range[1]],'#494949')}{range[0]<0 && range[1]>0 && line([domain[0],0],[domain[1],0],'#494949')}{ticks(domain).map(v=><text key={v} x={x(v)} y={top+ph+1.3*f} textAnchor={v===domain[0]?'start':v===domain[1]?'end':'middle'}>{xTickFormat(v,3)}</text>)}{ticks(range).map(v=><text key={v} x={left-.35*f} y={y(v)+.3*f} textAnchor="end">{yTickFormat(v,3)}</text>)}{!htmlAxes && <><text x={left} y={1.15*f}>{yLines.map((label,i)=><tspan key={i} x={left} dy={i?f:0}>{label}</tspan>)}</text><text x={left+pw/2} y={top+ph+2.8*f} textAnchor="middle">{xLines.map((label,i)=><tspan key={i} x={left+pw/2} dy={i?f:0}>{label}</tspan>)}</text></>}<g clipPath={`url(#rd-clip-${uid})`}>{children({x,y,f,line,arrow,path,curve,polygon,mark,color})}</g></svg>{htmlAxes && <><div className="rd-html-axis" style={{left,top:.1*f,width:pw}}>{yLines.map((label,i)=><div key={i}>{label}</div>)}</div><div className="rd-html-axis" style={{left,top:top+ph+2.05*f,width:pw,textAlign:"center"}}>{xLines.map((label,i)=><div key={i}>{label}</div>)}</div></>}</div>;
}

