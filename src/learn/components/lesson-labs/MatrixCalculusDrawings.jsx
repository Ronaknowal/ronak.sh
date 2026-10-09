import { useId } from 'react';
import { calculusNumber as number } from '../../data/matrix-calculus-models.js';

export const pair = values => '(' + values.map(number).join(', ') + ')';
export const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
export const mul = (A,v) => A.map(row=>dot(row,v));
export const transpose = A => A[0].map((_,j)=>A.map(row=>row[j]));
export const mm = (A,B) => A.map(row=>transpose(B).map(col=>dot(row,col)));
export const add = (a,b) => a.map((x,i)=>x+b[i]);
export const f = number;

export function Figure({name,caption,children}) {
  return <figure className="mc-figure" data-mc-figure={name}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Panels({children}) { return <div className="mc-panels">{children}</div>; }
export function Panel({title,children}) { return <div className="mc-panel"><p className="mc-panel-title">{title}</p>{children}</div>; }
export function Scene({label,description,children,width=400,height=300,className=''}) {
  const id=useId();
  return <svg className={'mc-scene '+className} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{description&&<desc>{description}</desc>}{children}</svg>;
}
export function Arrow({x1,y1,x2,y2,kind='actual',label,offset=-9}) {
  const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy),ux=length?dx/length:0,uy=length?dy/length:0;
  return <g className={'mc-arrow '+kind}><line x1={x1} y1={y1} x2={x2} y2={y2}/>{length>1&&<path d={`M${x2-9*ux+4*uy},${y2-9*uy-4*ux} L${x2},${y2} L${x2-9*ux-4*uy},${y2-9*uy+4*ux}`}/>} {label&&<text className="mc-edge-label" x={(x1+x2)/2} y={(y1+y2)/2+offset} textAnchor="middle">{label}</text>}</g>;
}
export function NumericTable({label,headers,rows}) {
  return <div className="mc-table-owner"><p>{label}</p><div className="mc-table-scroll" role="region" aria-label={label} tabIndex={0}><table><thead><tr>{headers.map((x,i)=><th key={i} scope="col">{x}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((x,j)=><td key={j}>{typeof x==='number'?number(x):x}</td>)}</tr>)}</tbody></table></div></div>;
}
export function MatrixDrawing({values,label,selectedRow,selectedColumn,selectedCell,kind='actual'}) {
  const rows=values.length,cols=values[0].length,w=Math.max(220,cols*74+52),h=rows*52+40;
  return <Panel title={label}><Scene label={label+'; '+rows+' rows and '+cols+' columns'} width={w} height={h}><path className="mc-reference-line" d={`M25,14 H15 V${h-14} H25 M${w-25},14 H${w-15} V${h-14} H${w-25}`}/>{values.map((row,i)=>row.map((value,j)=><g key={i+','+j} className={selectedRow===i||selectedColumn===j||(selectedCell?.[0]===i&&selectedCell?.[1]===j)?'mc-cell '+kind:'mc-cell reference'}><rect x={31+j*(w-62)/cols} y={18+i*52} width={(w-62)/cols-3} height={45}/><text x={31+(j+.5)*(w-62)/cols} y={47+i*52} textAnchor="middle">{number(value)}</text></g>))}</Scene></Panel>;
}
export function VectorDiagram({label,vectors,domain=[-4,4],points=[],xLabel='coordinate 1',yLabel='coordinate 2',origin=[0,0]}) {
  const scale=270/(domain[1]-domain[0]),X=x=>60+(x-domain[0])*scale,Y=y=>280-(y-domain[0])*scale;
  return <Scene label={label} height={370}><text x={60} y={18}>vertical: {yLabel}</text><g transform="translate(0 24)"><g className="mc-grid">{[domain[0],0,domain[1]].filter((x,i,a)=>a.indexOf(x)===i).map(v=><g key={v}><line x1={X(v)} x2={X(v)} y1={10} y2={280}/><line x1={60} x2={330} y1={Y(v)} y2={Y(v)}/><text x={X(v)} y={300} textAnchor="middle">{number(v)}</text><text x={56} y={Y(v)+5} textAnchor="end">{number(v)}</text></g>)}</g><line className="mc-axis" x1={60} x2={330} y1={Y(0)} y2={Y(0)}/><line className="mc-axis" x1={X(0)} x2={X(0)} y1={10} y2={280}/>{vectors.map((v,i)=><g key={i}><Arrow x1={X((v.from||origin)[0])} y1={Y((v.from||origin)[1])} x2={X(v.value[0])} y2={Y(v.value[1])} kind={v.kind||'actual'}/>{v.label&&<text className={'mc-value-label '+(v.kind||'actual')} x={v.slot?.[0]??(X(v.value[0])+8)} y={v.slot?.[1]??(Y(v.value[1])-10-i*12)}>{v.label}</text>}</g>)}{points.map((p,i)=><g key={i} className={p.kind||'actual'}><circle className="mc-dot" cx={X(p.value[0])} cy={Y(p.value[1])} r={4}/>{p.label&&<text className="mc-value-label" x={p.slot?.[0]??X(p.value[0])+8} y={p.slot?.[1]??Y(p.value[1])-10}>{p.label}</text>}</g>)}<text x={195} y={329} textAnchor="middle">horizontal: {xLabel}</text></g></Scene>;
}
export function CurveDiagram({label,xDomain,yDomain,curves,markers=[],connectors=[],xLabel,yLabel}) {
  const X=x=>86+(x-xDomain[0])/(xDomain[1]-xDomain[0])*244,Y=y=>260-(y-yDomain[0])/(yDomain[1]-yDomain[0])*235;
  const path=points=>points.filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)).map(([x,y],i)=>(i?'L':'M')+X(x)+','+Y(y)).join(' ');
  return <Scene label={label} height={330}><g className="mc-grid">{[0,.5,1].map(t=>{const x=xDomain[0]+t*(xDomain[1]-xDomain[0]),y=yDomain[0]+t*(yDomain[1]-yDomain[0]);return <g key={t}><line x1={X(x)} x2={X(x)} y1={25} y2={260}/><line x1={86} x2={330} y1={Y(y)} y2={Y(y)}/><text x={X(x)} y={282} textAnchor="middle">{number(x)}</text><text x={74} y={Y(y)+5} textAnchor="end">{number(y)}</text></g>;})}</g><path className="mc-axis" d="M 86,25 V 260 H 330"/>{curves.map((c,i)=><path key={i} className={'mc-curve '+(c.kind||'actual')} d={path(c.points)}/>)}{connectors.map((c,i)=><g key={i} className="mc-residual" data-residual={c.to[1]-c.from[1]}><title>{c.label}</title><line x1={X(c.from[0])} y1={Y(c.from[1])} x2={X(c.to[0])} y2={Y(c.to[1])}/><line x1={X(c.from[0])-5} x2={X(c.from[0])+5} y1={Y(c.from[1])} y2={Y(c.from[1])}/><line x1={X(c.to[0])-5} x2={X(c.to[0])+5} y1={Y(c.to[1])} y2={Y(c.to[1])}/></g>)}{markers.map((m,i)=><g key={i} className={m.kind||'actual'}><circle className="mc-dot" cx={X(m.x)} cy={Y(m.y)} r={5}/>{m.label&&<text className="mc-value-label" x={m.slot?.[0]??X(m.x)+7} y={m.slot?.[1]??Y(m.y)-12}>{m.label}</text>}</g>)}<text x={195} y={318} textAnchor="middle">{xLabel}</text><text x={86} y={14}>{yLabel}</text></Scene>;
}
export const sample = (fn,a,b,count=80) => Array.from({length:count+1},(_,i)=>{const x=a+(b-a)*i/count;return [x,fn(x)];});
export function SignedContributions({label,terms,total,unit='',names}) {
  const max=Math.max(1,...terms.map(Math.abs),Math.abs(total)),scale=120/max;
  const height=(terms.length+1)*62+20;
  const row=(value,i,name,kind)=><g key={i}><text x={20} y={24+i*62}>{name}</text><text x={375} y={24+i*62} textAnchor="end">{number(value)}{unit}</text><line className={'mc-bar '+kind} x1={200} x2={200+value*scale} y1={44+i*62} y2={44+i*62}/></g>;
  return <Scene label={label} height={height}><line className="mc-axis" x1={200} x2={200} y1={34} y2={height-22}/>{terms.map((value,i)=>row(value,i,names?.[i]||'term '+(i+1),'actual'))}{row(total,terms.length,'sum','comparison')}</Scene>;
}
export function CoefficientProduct({A,B,label,row=0,column=0}) {
  const C=mm(A,B),terms=A[row].map((x,j)=>x*B[j][column]);
  const cy=j=>65+j*100,mid=65+(terms.length-1)*50;
  return <div><Panels><MatrixDrawing values={A} label="Left coefficients" selectedRow={row}/><MatrixDrawing values={B} label="Right coefficients" selectedColumn={column}/><MatrixDrawing values={C} label="Product" selectedCell={[row,column]}/></Panels><Panel title={label+'; the selected row meets the selected column'}><Scene label={label+' index contraction'} height={terms.length*100+35}>
    {terms.map((value,j)=><g key={j}><text x={20} y={20+j*100}>j={j}: {number(A[row][j])}×{number(B[j][column])}</text><circle className="mc-operation" cx={100} cy={cy(j)} r={34}/><text x={100} y={cy(j)+5} textAnchor="middle">{number(value)}</text><Arrow x1={137} y1={cy(j)} x2={279} y2={mid}/></g>)}
    <circle className="mc-operation" cx={320} cy={mid} r={38}/><text className="mc-value-label actual" x={320} y={mid+5} textAnchor="middle">{number(C[row][column])}</text><text x={320} y={mid+66} textAnchor="middle">Σ products</text>
  </Scene></Panel></div>;
}
export function ChainPaths({state,route='value',focus}) {
  const reverse=route==='reverse';
  const values=reverse?[state.inputGradient,state.intermediateGradient,state.outputWeights]:route==='rate'?[state.direction,state.intermediateTangent,state.squaredTangent]:[state.input,state.intermediate,state.squared];
  const labels=reverse?['∂L/∂x','∂L/∂y','q=∂L/∂z']:route==='rate'?['input rate','affine rate','square rate']:['input x','affine y','square z'];
  const arrow=(a,b,label,offset)=>reverse?<Arrow x1={b[0]} y1={b[1]} x2={a[0]} y2={a[1]} label={label} offset={offset} kind="comparison"/>:<Arrow x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} label={label} offset={offset}/>;
  return <Panel title={reverse?'Returning scalar sensitivities':route==='rate'?'Forward directional rates':'Ordinary coordinate values'}><Scene label={labels.join(' to ')+'; all affine coefficient paths and evaluated square slopes'} height={280}>
    {[[1,2],[-1,1]].map((row,i)=>row.map((coefficient,j)=><g key={i+','+j} data-edge="affine" className={focus==='input'||focus==='affine'?'mc-path-focused':''}>{arrow([69,75+j*125],[171,75+i*125],number(coefficient),i===j?-10:i===0?-16:18)}</g>))}
    {[0,1].map(i=><g key={i} data-edge="square" className={focus==='square'?'mc-path-focused':''}>{arrow([219,75+i*125],[321,75+i*125],route==='value'?'square':'×'+number(2*state.intermediate[i]),-10)}</g>)}
    {values.map((column,j)=><g key={j}><text x={45+j*150} y={25} textAnchor="middle">{labels[j]}</text>{column.map((value,i)=><g key={i}><circle className={'mc-node '+(reverse?'comparison':'actual')} cx={45+j*150} cy={75+i*125} r={24}/><text x={45+j*150} y={80+i*125} textAnchor="middle">{number(value)}</text><text x={45+j*150} y={118+i*125} textAnchor="middle">coordinate {i+1}</text></g>)}</g>)}
    <text x={200} y={274} textAnchor="middle">{reverse?'Multiply along each path; add paths at x.':route==='rate'?'Square slopes are evaluated at y, not x.':'Apply A first; then square each y coordinate.'}</text>
  </Scene><Scene label={reverse?'Scalar seed1 distributes through the two q coefficients':'Two q-weighted contributions join at the scalar objective'} height={220}>
    {[0,1].map(i=><g key={i} data-edge="scalar" className={focus==='scalar'?'mc-path-focused':''}>{arrow([108,55+i*110],[265,110], 'q'+(i+1)+'='+number(state.outputWeights[i]),i===0?-12:18)}<circle className={'mc-node '+(reverse?'comparison':'actual')} cx={80} cy={55+i*110} r={26}/><text x={80} y={61+i*110} textAnchor="middle">{number(reverse?state.outputWeights[i]:values[2][i])}</text></g>)}
    <circle className={'mc-node '+(reverse?'comparison':'actual')} cx={300} cy={110} r={32}/><text x={300} y={116} textAnchor="middle">{number(reverse?1:route==='rate'?state.lossTangent:state.value)}</text>
    <text x={300} y={166} textAnchor="middle">{reverse?'scalar seed':'sum of two products'}</text><text x={200} y={215} textAnchor="middle">{reverse?'Each returning q coefficient multiplies seed1.':'Multiply each coordinate by q, then add.'}</text>
  </Scene></Panel>;
}
export function ChainDiagram({state,mode='forward',focus='input'}) {
  const stages=[['x',state.input,state.direction,state.inputGradient],['y',state.intermediate,state.intermediateTangent,state.intermediateGradient],['z',state.squared,state.squaredTangent,state.outputWeights]];
  return <div><Panels>{stages.map(([name,values,tangents,cotangents],stage)=><Panel key={name} title={name+' values / directional rates / scalar sensitivities'}><Scene label={name+' complete numeric coordinates and derivatives'} height={230}>{values.map((value,i)=><g key={i}><circle className={'mc-node '+(focus===['input','affine','square'][stage]?'actual':'reference')} cx={95+i*175} cy={55} r={29}/><text x={95+i*175} y={61} textAnchor="middle">{number(value)}</text><text x={95+i*175} y={111} textAnchor="middle">{name}{i+1}</text><Arrow x1={95+i*175} y1={126} x2={95+i*175} y2={160} kind={mode==='forward'?'actual':'reference'}/><text className={'mc-value-label '+(mode==='forward'?'actual':'reference')} x={95+i*175} y={181} textAnchor="middle">rate {number(tangents[i])}</text><text className={'mc-value-label '+(mode==='reverse'?'comparison':'reference')} x={95+i*175} y={217} textAnchor="middle">∂L/∂{name}{i+1} {number(cotangents[i])}</text></g>)}</Scene></Panel>)}<Panel title="Scalar L=q·z; both routes remain visible"><Scene label="Scalar objective value and directional rate" height={230}><circle className={'mc-node '+(focus==='scalar'?'actual':'reference')} cx={200} cy={55} r={34}/><text x={200} y={61} textAnchor="middle">{number(state.value)}</text><text x={200} y={111} textAnchor="middle">L</text><Arrow x1={200} y1={126} x2={200} y2={160} kind={mode==='forward'?'actual':'reference'}/><text className="mc-value-label actual" x={200} y={181} textAnchor="middle">directional rate {number(state.lossTangent)}</text><text className="mc-value-label comparison" x={200} y={217} textAnchor="middle">scalar reverse seed 1</text></Scene></Panel></Panels><Panels><ChainPaths state={state} focus={focus}/><ChainPaths state={state} route="rate" focus={focus}/><ChainPaths state={state} route="reverse" focus={focus}/></Panels><NumericTable label="Complete scalar objective and both derivative routes" headers={['L=q·z','q·(Jv)','(Jᵀq)·v']} rows={[[state.value,state.lossTangent,dot(state.inputGradient,state.direction)]]}/></div>;
}
export function ContributionNetwork({label,inputs,incoming,products,total,inputNames,coefficientNames,productNames,sumLabel="sum returns"}) {
  const n=products.length,h=90+n*90;
  return <Scene label={label} height={h}>{products.map((value,i)=><g key={i}><circle className="mc-node reference" cx={70} cy={45+i*90} r={23}/><text x={70} y={50+i*90} textAnchor="middle">{number(inputs[i])}</text><Arrow x1={95} y1={45+i*90} x2={215} y2={45+i*90} label={coefficientNames?'× '+coefficientNames[i]+'='+number(incoming[i]):'G '+number(incoming[i])}/><circle className="mc-node actual" cx={240} cy={45+i*90} r={26}/><text x={240} y={50+i*90} textAnchor="middle">{number(value)}</text><line className="mc-reference-line" x1={267} y1={45+i*90} x2={335} y2={h-45}/><text x={70} y={84+i*90} textAnchor="middle">{inputNames?.[i]||("use "+i)}</text>{productNames&&<text x={240} y={84+i*90} textAnchor="middle">{productNames[i]}</text>}</g>)}<circle className="mc-operation" cx={335} cy={h-35} r={26}/><text x={335} y={h-30} textAnchor="middle">{number(total)}</text><text x={235} y={h-13}>{sumLabel}</text></Scene>;
}
