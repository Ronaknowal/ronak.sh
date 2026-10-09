import React, {useId} from 'react';
import {Plot, Line, Table, hues, number} from './ManifoldDrawing.jsx';
import {DimensionedArray} from './ManifoldObjects.jsx';

function Head({id}) {return <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>;}

export function SupportLanes({values}) {
  const id=useId().replaceAll(':',''), x=v=>35+290*v/11.3;
  return <div className="manifold-scene"><svg viewBox="0 0 360 330" role="img" aria-label="Source0 support IDs1,2,3 on unchanged measured x ruler; vertical lanes separate edge annotations">
    <Head id={id}/><line x1="35" x2="325" y1="245" y2="245" className="manifold-axis"/>
    {[1,2,3].map((target,i)=>{const lane=55+60*i,mid=(x(0)+x(values[target]))/2;return <g key={target}>
      <path d={`M${x(0)} 245V${lane}H${x(values[target])}V245`} fill="none" stroke={hues[target]} strokeWidth="2"/>
      <line x1={x(0)} x2={x(values[target])} y1={lane} y2={lane} stroke={hues[target]} strokeWidth="2" markerEnd={`url(#${id})`}/>
      <path d={`M${mid} ${lane}L165 ${lane-15}`} stroke={hues[target]} fill="none"/>
      <text x="180" y={lane-22} textAnchor="middle" fill={hues[target]}>0→{target} · distance {number(values[target])}</text>
    </g>;})}
    {values.map((value,i)=><g key={i}><circle cx={x(value)} cy="245" r="4" fill={hues[i]}/><text x={x(value)} y={i%2?292:270} textAnchor="middle">ID{i}</text></g>)}
    {[0,5.65,11.3].map(v=><text key={v} x={x(v)} y="323" textAnchor="middle">{v}</text>)}
  </svg><p>The x ruler is measured distance. Vertical support lanes and stems are graph annotations, not another measured coordinate or a path length.</p></div>;
}

export function ForceLanes({contributions,net}) {
  const id=useId().replaceAll(':',''), multiplier=20, x=v=>40+280*(v+.5)/2.5;
  const rows=contributions.map((v,i)=>({value:v,label:['AB','AC','AD'][i],color:hues[i+1]})).concat([{value:net,label:'A net',color:hues[0]}]);
  return <div className="manifold-scene"><svg viewBox="0 0 360 390" role="img" aria-label="Four signed negative-gradient annotation lanes on one common zero and multiplier20">
    <Head id={id}/>
    {rows.map((row,i)=><g key={row.label}><text x="20" y={30+80*i} fill={row.color}>{row.label} {row.value>=0?'+':''}{number(row.value,9)}</text><line x1={x(0)} x2={x(0)} y1={48+80*i} y2={72+80*i} stroke="#858b95" strokeDasharray="3 3"/><line x1={x(0)} x2={x(multiplier*row.value)} y1={60+80*i} y2={60+80*i} stroke={row.color} strokeWidth="2.5" markerEnd={`url(#${id})`}/><circle cx={x(0)} cy={60+80*i} r="3" fill="none" stroke={row.color}/></g>)}
    <line x1="40" x2="320" y1="345" y2="345" className="manifold-axis"/>
    {[-.5,0,.5,1,1.5,2].map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1="340" y2="350" className="manifold-axis"/><text x={x(v)} y="375" textAnchor="middle">{v}</text></g>)}
  </svg><p>Horizontal distance is20 × signed force. All arrows share zero and one multiplier. Vertical lanes separate annotations and are not map coordinates.</p></div>;
}

export function EventDisplacement({old,current,operation}) {
  const multiplier=100,deltas=current.map((row,i)=>row.map((v,j)=>v-old[i][j])),fixed=deltas.flatMap((d,i)=>d.every(v=>v===0)?[i]:[]);
  return <div><Plot points={deltas.map(([dx,dy],i)=>({x:multiplier*dx,y:multiplier*dy,id:i,label:dx!==0||dy!==0,color:hues[i]}))} arrows={deltas.flatMap(([dx,dy],i)=>dx!==0||dy!==0?[[0,0,multiplier*dx,multiplier*dy,hues[i]]]:[])} domain={[-1,1,-1,1]} ticks={[-1,0,1]} arrowHeadSize={3} arrowHeadContext caption={`${operation}: separate displacement inset, both axes100 × actual coordinate change`}/><p>Every vector starts at the common displacement origin. Fixed IDs [{fixed.join(', ')}] coincide at their genuine zero markers. This100× inset is a magnified change ruler, not a new map, rate or optimizer step.</p><Table caption={`${operation}: actual delta, before amplification`} headers={['ID','Δx','Δy','status']} rows={deltas.map((d,i)=>[i,number(d[0],9),number(d[1],9),fixed.includes(i)?'fixed, Δ=(0,0)':'moved'])}/></div>;
}

export function ReturnVectors({grid}) {
  const multiplier=160, rows=grid.fields.map((field,i)=>({label:`T${i} × ${number(grid.interpolation[i],2)}`,vector:field.map(v=>v*grid.interpolation[i]),color:hues[i+5]})).concat([{label:'Returned sum',vector:grid.returned,color:hues[0]}]);
  return <div className="manifold-fit-flow"><p>Each panel below identifies one actual return vector. The same zero, equal-axis domain±1.5 and multiplier160 apply to all five panels. Translation to the displacement origin does not change a vector; these are field-component rulers, not changed query positions.</p><div className="manifold-fit-row">{rows.map(row=><Plot key={row.label} points={[{x:0,y:0,id:'0',color:'#a0a6af',dx:14,dy:-28},{x:multiplier*row.vector[0],y:multiplier*row.vector[1],id:row.label,color:row.color,dx:-18,dy:-15}]} arrows={[[0,0,multiplier*row.vector[0],multiplier*row.vector[1],row.color]]} domain={[-1.5,1.5,-1.5,1.5]} ticks={[-1.5,0,1.5]} yTickLabelX={35} arrowHeadSize={3} arrowHeadContext caption={`${row.label}: (${row.vector.map(v=>number(v,9)).join(', ')}) before amplification`}/>)}</div></div>;
}

export function NullSignals() {
  return <>{[[1,1,0,0],[0,0,1,1]].map((signal,n)=><Plot key={n} points={signal.map((value,i)=>({x:[0,1,3,4][i],y:0,id:`${['A','B','D','E'][i]}: ${value}`,color:value?hues[n]:'#9a9fa8'}))} edges={[[0,1],[2,3]]} domain={[-.8,4.8,-2.8,2.8]} caption={`f${n+1}=(${signal.join(',')}) in A/B/D/E order; each present edge difference0, so Lf${n+1}=0`}/>)}<p>These two signals are linearly independent component constants. Any combination stays constant within each component; relative component levels remain free. Graph y positions are schematic, not signal heights or fitted embedding coordinates.</p></>;
}

export function HeightStencil() {
  const points=[[-1,.1],[0,0],[1,.1]],x=v=>55+(v+1)*125,y=v=>200-v*1000;
  return <div className="manifold-scene"><svg viewBox="0 0 360 355" role="img" aria-label="Constructed height graph h=.1x squared at x minus1,0,1; secant slopes minus.1 and plus.1">
    <path d="M45 35V200H325" className="manifold-axis" fill="none"/>
    <text x="30" y="38">h</text><text x="335" y="207">x</text>
    <text x="38" y="105" textAnchor="end">.1</text><text x="38" y="205" textAnchor="end">0</text>
    <path d={Array.from({length:81},(_,i)=>{const v=-1+i/40;return `${i?'L':'M'}${x(v)} ${y(.1*v*v)}`;}).join(' ')} fill="none" stroke="#a0a6af"/>
    <path d={`M${x(-1)} ${y(.1)}L${x(0)} ${y(0)}L${x(1)} ${y(.1)}`} fill="none" stroke={hues[1]} strokeWidth="2"/>
    {points.map(([a,b],i)=><g key={a}><circle cx={x(a)} cy={y(b)} r="5" fill={hues[i]}/>{i===0&&<path d={`M${x(a)} ${y(b)-7}L80 84`} fill="none" stroke={hues[i]}/>}<text x={i===0?80:x(a)} y={i===1?235:77} textAnchor="middle">({a},{b})</text><text x={x(a)} y="264" textAnchor="middle">{a}</text></g>)}
    <text x="117" y="175" textAnchor="middle" fill={hues[1]}>slope −.1</text><text x="243" y="175" textAnchor="middle" fill={hues[1]}>slope +.1</text>
    {[[-1,0],[0,1]].map(([a,b])=><g key={a}><path d={`M${x(a)} 285V294H${x(b)}V285`} fill="none" stroke={hues[2]}/><text x={(x(a)+x(b))/2} y="322" textAnchor="middle">Δx=1</text></g>)}
  </svg><p>Horizontal x and vertical height h use their labelled rulers. Secants are slopes, not unit tangent vectors. Slope change (+.1−(−.1))/1=.2 equals (.1−2·0+.1)/1². This constructed one-dimensional stencil is separate from the five-point uv patch.</p></div>;
}

function Dependency({label,branches=false}) {
  const id=useId().replaceAll(':','');return <div className="manifold-dependency"><svg viewBox="0 0 360 70" role="img" aria-label={label}><Head id={id}/>{branches?<path d="M180 5V25H85V65M180 25H275V65" fill="none" stroke={hues[0]} strokeWidth="2" markerEnd={`url(#${id})`}/>:<path d="M180 5V65" fill="none" stroke={hues[0]} strokeWidth="2" markerEnd={`url(#${id})`}/>}</svg><p>{label}</p></div>;
}

export function TrainingStateFlow() {
  const classifierId='fixed-classifier-'+useId().replaceAll(':','');
  const array=(name,rows,columns,entries,caption)=><DimensionedArray name={name} rows={rows} columns={columns} entries={entries} caption={caption} schematicNote={false}/>;
  return <div className="manifold-fit-flow">
    <p>All matrix extents below are schematic; dimensions and dependency roles are exact. Fitted parameter values, split-ID arrays and individual predictions were not retained, so indexed entries stay symbolic.</p>
    {array('All input X',300,64,[['x₁₁','x₁₂','…'],['x₂₁','x₂₂','…']],'The supplied300 measured rows; IDs/labels remain joined outside fitting columns.')}
    <Dependency branches label="Split once before fitting:225 training /75 validation. Validation cannot fit the reducer."/>
    <div className="manifold-fit-row">{array('X_train',225,64,[['x₁₁','x₁₂','…']],'Training features → fit reducer.')}{array('X_valid',75,64,[['xᵥ₁₁','xᵥ₁₂','…']],'Validation features → fixed transform only.')}</div>
    <Dependency label="Only X_train fits one PCA state: mean plus projection operator. Reuse that same state for both splits."/>
    <div className="manifold-fit-row">{array('μ_train',1,64,[['μ₁','μ₂','…']],'One training-fitted mean.')}{array('V_train',64,10,[['v₁₁','v₁₂','…'],['v₂₁','v₂₂','…']],'One training-fitted operator.')}</div>
    <Dependency branches label="Same μ_train/V_train: Z_train=(X_train−μ_train)V_train; Z_valid=(X_valid−μ_train)V_train."/>
    <div className="manifold-fit-row">{array('Z_train',225,10,[['z₁₁','z₁₂','…']],'Training coordinate system.')}{array('Z_valid',75,10,[['zᵥ₁₁','zᵥ₁₂','…']],'Same coordinate system; no validation reducer.')}</div>
    <Dependency label="Training Z_train plus training labels fit one5-NN classifier. Validation labels enter evaluation only."/>
    {array('Training labels',225,1,[['y₁'],['y₂']],'Joined training labels are supervised classifier inputs, never unsupervised reducer inputs.')}
    <Dependency label="Fit with Z_train and these joined training labels; keep that classifier state for validation."/>
    <div className="manifold-scene" id={classifierId}><svg viewBox="0 0 360 160" role="img" aria-label="Fitted five-neighbor classifier reads five symbolic training neighbors and their training labels"><text x="180" y="22" textAnchor="middle">One fitted5-NN classifier</text>{[0,1,2,3,4].map(i=><g key={i}><circle cx={45+67*i} cy="70" r="7" fill={hues[i+1]}/><text x={45+67*i} y="103" textAnchor="middle">T{i+1}</text><text x={45+67*i} y="135" textAnchor="middle">y_T{i+1}</text></g>)}</svg><p>Training support/labels are symbolic. Their majority defines a prediction; no unsaved label value or query result is invented.</p></div>
    <Dependency label="Feed the already transformed Z_valid to that same fitted classifier →75 held-out predictions → compare with held-out labels."/>
    {array('Validation predictions',75,1,[['ŷᵥ₁'],['ŷᵥ₂']],'Raw pixels, PCA10 and UMAP10 each have their own train-fitted classifier; measured totals remain73/75,73/75,71/75.')}
    <Dependency label="Trace one symbolic held-out row through this same fixed PCA state and classifier; fit neither again."/>
    {array('One x_valid,r',1,64,[['xᵣ₁','xᵣ₂','…']],'Input row in the stored feature order.')}
    <Dependency label="Subtract μ_train and multiply by V_train. The result has ten coordinates."/>
    {array('One z_valid,r',1,10,[['zᵣ₁','zᵣ₂','…']],'The1×10 row is sent to the same fitted5-NN above; its prediction was not saved.')}
    <p><a href={`#${classifierId}`}>Send this1×10 row to the same fitted5-NN object above.</a> Reuse its training support and labels; do not fit on the validation row.</p>
    <p>Separate UMAP branch: its fixed225×64 training input records and225×10 training reference define future placement; it does not use the PCA mean/operator formula.</p>
    <div className="manifold-fit-row">{array('UMAP training inputs',225,64,[['x₁₁','x₁₂','…']],'Fixed training search records.')}{array('UMAP training reference',225,10,[['y₁₁','y₁₂','…']],'Fixed reference coordinates.')}</div>
    <Dependency label="The UMAP fixed reference places held-out inputs into75×10, then its train-fitted5-NN predicts them. Raw64-pixel→5-NN is a separate baseline."/>
    {array('UMAP validation',75,10,[['yᵥ₁₁','yᵥ₁₂','…']],'Held-out placement in the fixed training reference; evaluate its own train-fitted5-NN, with71/75 retained correct predictions.')}
    <p>Two-coordinate inspection is separate from ten-coordinate prediction. These are validation results, separate from an untouched final test.</p>
  </div>;
}
