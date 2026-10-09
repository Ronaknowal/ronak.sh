import { useId, useState } from 'react';
import { NeuralTable, formatNeural } from './NeuralLessonElements.jsx';
import { FlowControls, FlowSlider } from './LessonFlow.jsx';
export const f = (value,digits=5) => formatNeural(value,digits).replaceAll('-', '−');
export const vector = x => '[' + x.map(v => f(v, 5)).join(', ') + ']';
export const spectralColors = { input:'#92c9e6', parameter:'#e6b854', computed:'#ba9fd1', neutral:'#ddd', gradient:'#e69456' };
export function SpectralFigure({ title, width=320, height, description, children }) {
 return <figure className="spectral-figure"><div className="spectral-scroll" role="region" aria-label={title} tabIndex={0}><svg viewBox={'0 0 '+width+' '+height} style={{width:'100%',maxWidth:width}} role="img" aria-label={description||title}>{children}</svg></div>{description&&<figcaption>{description}</figcaption>}</figure>;
}
export function SpectralPlot({title,xLabel,yLabel,xDomain,yDomain,series=[],points=[]}) {
 const id=useId().replace(/:/g,''), [x0,x1]=xDomain,[y0,y1]=yDomain;
 const shortLabel=s=>s.shortLabel||({'80 assessment gradient norms':'Assessment gradients','Maximum on the 41×41 sampled grid':'Sampled grid maximum','Final dense-matrix product bound':'Matrix-product bound','White upper envelope':'Upper envelope','White lower envelope':'Lower envelope','Violet kinked function':'Kinked critic','Violet: f(x)=x+ReLU(x−1)':'Kinked function','Bound 0.1 exp(|a|t)':'Separation bound','Actual 0.1 exp(at)':'Actual separation'}[s.label]||s.label);
 const x=v=>54+(v-x0)/(x1-x0||1)*272,y=v=>220-(v-y0)/(y1-y0||1)*172;
 return <><SpectralFigure title={title} width={360} height={320+26*series.length} description={title+'. Horizontal axis: '+xLabel+'; vertical axis: '+yLabel+'. '+series.map(s=>s.label).join('; ')+'.'}>
  <defs><clipPath id={id}><rect x="54" y="48" width="272" height="172"/></clipPath></defs>
  <path d="M54 48V220H326" fill="none" stroke="#777"/>
  {[0,.5,1].map(t=><g key={t}><text x={54+272*t} y="240" textAnchor="middle">{f(x0+(x1-x0)*t,3)}</text><text x="47" y={225-172*t} textAnchor="end">{f(y0+(y1-y0)*t,3)}</text></g>)}
  <text x="54" y="20">vertical axis ↑</text><text x="190" y="265" textAnchor="middle">horizontal axis →</text>
  <g clipPath={'url(#'+id+')'}>{series.map((s,i)=><polyline key={i} points={s.values.map(v=>x(v[0])+','+y(v[1])).join(' ')} fill="none" stroke={s.color||spectralColors.computed} strokeWidth="2" strokeDasharray={s.dashed?'5 4':undefined}/>)}{points.map((p,i)=><circle key={p.id??i} cx={x(p.x)} cy={y(p.y)} r="4" fill={p.color||spectralColors.input} stroke={p.selected?'#fff':'none'}><title>{p.label+': '+f(p.x)+', '+f(p.y)}</title></circle>)}</g>
 {series.map((s,i)=>{const endpoint=s.values.at(-1);if(!endpoint)return null;const endX=Math.max(54,Math.min(326,x(endpoint[0]))),endY=Math.max(48,Math.min(220,y(endpoint[1]))),labelY=290+26*i;return <g key={'direct-'+i}><path d={'M'+endX+' '+endY+'H'+(334+8*(i%3))+'V'+(labelY-5)+'H332'} fill="none" stroke={s.color||spectralColors.computed} strokeDasharray={s.dashed?'5 4':undefined}/><text x="326" textAnchor="end" y={labelY} fill={s.color||spectralColors.computed}>{shortLabel(s)}</text></g>;})}
 </SpectralFigure><ul className="spectral-curve-key">{series.map((s,i)=><li key={i}><svg viewBox="0 0 34 12" width="34" height="12" aria-hidden="true"><path d="M1 6H33" stroke={s.color||spectralColors.computed} strokeWidth="2" strokeDasharray={s.dashed?'5 4':undefined}/></svg><span>{s.label}</span></li>)}</ul></>;
}
export function SpectralVector({label,values,onChange,min=-3,max=3}) {
 return <FlowControls>{values.map((value,i)=><FlowSlider key={i} name={label+' '+(i+1)} value={value} min={min} max={max} step={.05} onChange={v=>onChange(values.map((x,j)=>i===j?v:x))}/>)}</FlowControls>;
}
export function SpectralMatrix({title,values,selected=-1}) {
 return <NeuralTable caption={title} headers={['output / input',...values[0].map((_,i)=>i)]} rows={values.map((row,i)=>[i,...row.map((v,j)=><span key={j} className="spectral-cell" style={{outline:j===selected?'1px solid #fff':undefined}}>{f(v,5)}</span>)])}/>;
}
// Every coefficient remains editable using two controls rather than a wall of inputs.
export function MatrixEditor({label,values,onChange,min=-5,max=5}) {
 const [entry,setEntry]=useState(0),columns=values[0].length,row=Math.floor(entry/columns),column=entry%columns;
 return <FlowControls><label className="spectral-select">{label} coefficient<select value={entry} onChange={e=>setEntry(Number(e.target.value))}>{values.flatMap((r,i)=>r.map((_,j)=><option key={i+'-'+j} value={i*columns+j}>output {i}, input {j}</option>))}</select></label><FlowSlider name={label+'['+row+','+column+']'} value={values[row][column]} min={min} max={max} step={.05} onChange={v=>onChange(values.map((r,i)=>r.map((x,j)=>i===row&&j===column?v:x)))}/></FlowControls>;
}
export function MatrixDrawing({values,label,color=spectralColors.parameter}) {
 const columns=values[0].length,cell=54,width=Math.max(240,columns*cell+44),height=values.length*48+68;
 return <SpectralFigure title={label} width={width} height={height} description={label+': rows are outputs, columns inputs. Cell fill encodes sign: amber for nonnegative, blue for negative. Exact values are written in each cell.'}>
  <text x="20" y="20">input columns →</text>{values.map((r,i)=>r.map((v,j)=><g key={i+'-'+j}><rect x={20+j*cell} y={35+i*48} width={cell-5} height="40" fill={v<0?'#152934':'#302718'} stroke={color}/><text x={20+j*cell+(cell-5)/2} y={60+i*48} textAnchor="middle">{f(v,3)}</text></g>))}
 </SpectralFigure>;
}
export function CurvePlane({title,curves=[],points=[],extent=4,center=[0,0]}) {
 const id=useId().replace(/:/g,''),x=v=>160+(v-center[0])/extent*116,y=v=>152-(v-center[1])/extent*116;
 return <><SpectralFigure title={title} height={322} description={title+'. Both axes have the same scale and units. '+points.map(p=>p.label+' = '+vector(p.value)).join('; ')+'.'}>
  <defs><clipPath id={id}><rect x="44" y="36" width="232" height="232"/></clipPath></defs>
  <path d={'M44 '+y(0)+'H276 M'+x(0)+' 36V268'} stroke="#777"/>
  <g clipPath={'url(#'+id+')'}>{curves.map((c,i)=><polyline key={i} points={c.values.map(v=>x(v[0])+','+y(v[1])).join(' ')} fill="none" stroke={c.color||spectralColors.computed} strokeWidth="2" strokeDasharray={c.dashed?'5 4':undefined}/>)}{points.map((p,i)=><g key={i}>{p.from&&<><line x1={x(p.from[0])} y1={y(p.from[1])} x2={x(p.value[0])} y2={y(p.value[1])} stroke={p.color||spectralColors.input} strokeWidth="2"/>{Math.hypot(p.value[0]-p.from[0],p.value[1]-p.from[1])>1e-12&&(()=>{const a=Math.atan2(y(p.value[1])-y(p.from[1]),x(p.value[0])-x(p.from[0]));return <path d={'M'+(x(p.value[0])-7*Math.cos(a-.4))+','+(y(p.value[1])-7*Math.sin(a-.4))+'L'+x(p.value[0])+','+y(p.value[1])+'L'+(x(p.value[0])-7*Math.cos(a+.4))+','+(y(p.value[1])-7*Math.sin(a+.4))} fill="none" stroke={p.color||spectralColors.input} strokeWidth="2"/>;})()}</>}<circle cx={x(p.value[0])} cy={y(p.value[1])} r="4" fill={p.color||spectralColors.input} stroke="#fff"><title>{p.label+': '+vector(p.value)}</title></circle></g>)}</g>
  {[-1,0,1].map(t=><g key={t}><text x={160+116*t} y="287" textAnchor="middle">{f(center[0]+extent*t,2)}</text><text x="43" y={157-116*t} textAnchor="end">{f(center[1]+extent*t,2)}</text></g>)}<text x="160" y="313" textAnchor="middle">horizontal coordinate →</text><text x="44" y="20">vertical coordinate ↑</text>
 </SpectralFigure>{(points.length>0||curves.length>0)&&<ul className="spectral-curve-key">{curves.map((c,i)=><li key={'curve-'+i}><svg viewBox="0 0 34 12" width="34" height="12" aria-hidden="true"><path d="M1 6H33" stroke={c.color||spectralColors.computed} strokeWidth="2" strokeDasharray={c.dashed?'5 4':undefined}/></svg><span>{c.label}</span></li>)}{points.map((p,i)=><li key={'point-'+i}><svg viewBox="0 0 34 12" width="34" height="12" aria-hidden="true">{p.from?<path d="M1 6H30 l-5 -3m5 3l-5 3" fill="none" stroke={p.color||spectralColors.input} strokeWidth="2"/>:<circle cx="17" cy="6" r="4" fill={p.color||spectralColors.input} stroke="#fff"/>}</svg><span>{p.label}: {vector(p.value)}</span></li>)}</ul>}</>;
}

