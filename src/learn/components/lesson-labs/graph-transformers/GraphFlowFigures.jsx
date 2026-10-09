import React,{useId,useState,useEffect} from 'react';

export function useDrawingSpace(){
  const [space,setSpace]=useState(420);
  useEffect(()=>{const element=document.querySelector('.graph-reading-flow');if(!element)return;
    const read=()=>setSpace(Math.max(175,Math.min(760,element.clientWidth*16/parseFloat(getComputedStyle(document.documentElement).fontSize))));
    const resize=new ResizeObserver(read),mutation=new MutationObserver(read);resize.observe(element);mutation.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});read();
    return()=>{resize.disconnect();mutation.disconnect();};
  },[]);return space;
}

export const tones={input:'#78c8eb',parameter:'#e4b752',computed:'#b69bdd',neutral:'#b8b9bf',gradient:'#f2b18b'};
// A deliberately chosen three-item trace; labels remain authoritative beyond it.
export const traceHues=['#78c8eb','#f2b18b','#e4b752'];
export const headHues=['#78c8eb','#f2b18b'];
export const classHues=['#78c8eb','#e4b752'];
export function number(value){
  if(value===null)return 'undefined';
  if(!Number.isFinite(value))return 'unreachable';
  if(value===0)return '0';
  if(Math.abs(value)<.0001||Math.abs(value)>=1e6)return value.toExponential(5);
  return Number(value.toPrecision(7)).toString();
}
export function diskNumber(value){
  if(value===0)return '0';
  if(!Number.isFinite(value))return number(value);
  const plain=Number(value.toPrecision(2)).toString();
  return plain.length<=5?plain:value.toExponential(0).replace('e+','e');
}
export function Scene({id,title,children,width=400,height=300,description}){
  const marker=useId().replaceAll(':','');
  return <figure className="gtf-figure" id={`drawing-${id}`} data-drawing={id}>
    <figcaption>{title}</figcaption>
    <div className="gtf-scroller" tabIndex={0} role="region" aria-label={`${title}; drawing can scroll sideways`}>
      <svg className="gtf-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{width:`${width/16}rem`,height:`${height/16}rem`}} role="img" aria-labelledby={`${marker}-title ${marker}-description`}>
        <title id={`${marker}-title`}>{title}</title><desc id={`${marker}-description`}>{description||title}</desc>
        <defs>{['neutral','gradient'].map(tone=><marker key={tone} id={marker+(tone==='gradient'?'-gradient':'')} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill={tones[tone]}/></marker>)}</defs>
        {typeof children==='function'?children(marker):children}
      </svg>
    </div>
    <p className="gtf-pan-cue">Labels round for reading; calculations retain the input precision. Scroll a full matrix or wider drawing sideways when needed.</p>
  </figure>;
}
export function Value({x,y,value,label,tone='computed',radius=23,hue}){
  return <g><title>{label||'scalar'}: {typeof value==='number'?String(value):value}</title><circle cx={x} cy={y} r={radius} fill="#151515" stroke={hue??tones[tone]} strokeWidth={2}/><text x={x} y={y+6} textAnchor="middle" fill={hue??tones[tone]}>{typeof value==='number'?diskNumber(value):value}</text>{label&&<text x={x} y={y+radius+24} textAnchor="middle">{label}</text>}</g>;
}
export function Operation({x,y,width=92,height=46,label,hue}){
  const lines=Array.isArray(label)?label:[label];
  return <g><rect x={x} y={y} width={width} height={height} rx={10} fill="#1d1d1f" stroke={hue??tones.neutral}/><text x={x+width/2} y={y+height/2+6-11*(lines.length-1)} textAnchor="middle">{lines.map((line,i)=><tspan key={i} x={x+width/2} dy={i?22:0}>{line}</tspan>)}</text></g>;
}
export function Wire({from,to,marker,label,dashed=false,tone='neutral'}){
  return <g><path d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} stroke={tones[tone]} fill="none" strokeWidth={2} strokeDasharray={dashed?'6 5':undefined} markerEnd={`url(#${marker+(tone==='gradient'?'-gradient':'')})`}/>{label&&<text x={(from[0]+to[0])/2} y={(from[1]+to[1])/2-10} textAnchor="middle">{label}</text>}</g>;
}
export function Matrix({title,values,rows,columns,axisLabel='row / column',signed=false,rowHues,columnHues}){
  const cols=columns||values[0]?.map((_,i)=>i)||[];
  return <div className="gtf-matrix" tabIndex={0} role="region" aria-label={title}><table><caption>{title}</caption><thead><tr><th scope="col">{axisLabel}</th>{cols.map(v=><th scope="col" key={v} style={columnHues?{color:columnHues[cols.indexOf(v)],borderTop:'3px solid '+columnHues[cols.indexOf(v)]}:undefined}>{v}</th>)}</tr></thead><tbody>{values.map((row,i)=><tr key={i}><th scope="row" style={rowHues?{color:rowHues[i],borderLeft:'3px solid '+rowHues[i]}:undefined}>{rows?.[i]??i}</th>{row.map((v,j)=><td key={j} style={signed&&typeof v==='number'?{background:v>0?'#332b18':v<0?'#18303b':'#151515',color:v>0?tones.parameter:v<0?tones.input:tones.neutral}:undefined}>{typeof v==='number'?number(v):v}</td>)}</tr>)}</tbody></table></div>;
}
export function Numeric({label,value,onChange,min,max,integer=false,revision=0}){
  const [draft,setDraft]=useState(String(value)),[error,setError]=useState('');
  useEffect(()=>{setDraft(String(value));setError('');},[value,label,revision]);
  function edit(text){
    setDraft(text);
    const parsed=Number(text);
    const good=text.trim()!==''&&Number.isFinite(parsed)&&parsed>=min&&parsed<=max&&(!integer||Number.isInteger(parsed));
    if(good){setError('');onChange(parsed);}else setError(`Enter ${integer?'an integer':'a finite number'} from ${min} to ${max}. Last valid result stays visible.`);
  }
  return <label className="gtf-number">{label}<input type="number" aria-label={label} min={min} max={max} step={integer?1:'any'} value={draft} aria-invalid={!!error} onChange={e=>edit(e.target.value)}/>{error&&<span role="alert">{error}</span>}</label>;
}
export function Select({label,value,onChange,options}){
  return <label>{label}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,text])=><option value={v} key={v}>{text}</option>)}</select></label>;
}
export function Toggle({label,checked,onChange}){
  return <label className="gtf-toggle"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{label}</label>;
}
export function Controls({children}){return <div className="gtf-controls">{children}</div>;}
export function Graph({id,title,a,values,selected=0,positions,weights,valueTone='computed',identityHues=a.map((_,i)=>traceHues[i]??tones.neutral)}){
  const size=a.length,width=Math.min(400,Math.max(size>=7?260:175,useDrawingSpace())),points=positions?positions.map(([x,y])=>[x*width/400,y]):a.map((_,i)=>[width/2+(width/2-70)*Math.cos(2*Math.PI*i/size-Math.PI/2),160+85*Math.sin(2*Math.PI*i/size-Math.PI/2)]);
  return <>{identityHues&&<p>Node identity stays cyan for 0, salmon for 1 and amber for 2 across connected node views and matching table headers. Further node IDs have neutral rims and retain their literal labels. White outer rings mark selection; this local identity encoding differs from the input/parameter/output role palette.</p>}<Scene id={id} title={title} width={width} height={310} description="Disks name semantic nodes; solid lines are graph edges, not attention permissions. Attached values round to two significant figures; the accompanying row gives fuller precision.">
    {marker=><>{a.flatMap((row,i)=>row.flatMap((v,j)=>v&&j>i?[<line key={`e${i}-${j}`} x1={points[i][0]} y1={points[i][1]} x2={points[j][0]} y2={points[j][1]} stroke={tones.neutral} strokeWidth={2}/>]:[]))}
      {weights?.map((w,j)=>w>0&&j!==selected?<Wire key={`r${j}`} from={points[j]} to={points[selected]} marker={marker} dashed={!a[selected][j]}/>:null)}
      {points.map(([x,y],i)=>{const angle=2*Math.PI*i/size-Math.PI/2;return <g key={i}>{i===selected&&<circle cx={x} cy={y} r={28} fill="none" stroke="#fff" strokeWidth={2}/>}<circle cx={x} cy={y} r={24} fill="#111" stroke={identityHues?.[i]??tones.input} strokeWidth={2}/><text x={x} y={y+6} textAnchor="middle">{i}</text>{values&&<text x={x+40*Math.cos(angle)} y={y+40*Math.sin(angle)+6} textAnchor="middle" fill={identityHues?.[i]??tones[valueTone]}>{diskNumber(values[i])}</text>}</g>;})}</>}
  </Scene>{values&&<Matrix title="Current attached values by semantic node" values={[values]} columns={values.map((_,i)=>`node ${i}`)} columnHues={identityHues}/>}</>;
}
