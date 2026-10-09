import {createContext,useContext,useEffect,useId,useMemo,useState} from 'react';
import {FlowControls,FlowLab,FlowReadout,FlowSlider,flowNumber as f} from './LessonFlow.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import {RingCells,RingDecodeCollectivesFigure,RingFlowFigure,RingGradientReturnFigure,RingMapGradientFigure,RingOwnedRowsFigure,RingProjectionFigure,RingReadFigure,RingRecordFigure,RingRecordPayloadFigure,RingScalarGradientFigure,RingSignedBars,RingStableMergeFigure,RingTransportFigure,RingWire,ringNumbers,ringPaint} from './RingAttentionFlowFigures.jsx';
import * as model from '../../data/ring-attention-models.js';
import examples from '../../data/ring-attention-examples.json';

const Context=createContext(null);
const copy=value=>structuredClone(value);
const initialScalar=()=>({scores:[0,Math.log(2),Math.log(4),0],values:[2,8,1,-2],allowed:[true,true,true,true],split:2,reverse:false,offset:0,record:0,step:1,pinned:null});
const initialRecords=()=>({arrays:copy(examples.tiny),records:Array.from({length:7},(_,i)=>({position:i,document:i<3?0:1,valid:true})),owners:model.ownership(7,3),head:0,query:4,key:4,channel:0,field:'value',round:2,direction:1,empty:false,pinned:null});

export function RingFlowProvider({children}) {
  const [scalar,setScalar]=useState(initialScalar),[records,setRecords]=useState(initialRecords),[warmup,setWarmup]=useState({rows:[[1,0],[0,1]],row:0,channel:0,upstream:[[1,-.5],[.2,.3]]}),[schedule,setSchedule]=useState({ranks:4,round:0,direction:1});
  const [resetKey,setResetKey]=useState(0);
  const resetScalar=()=>{setScalar(initialScalar());setResetKey(x=>x+1);};
  const resetRecords=()=>{setRecords(initialRecords());setResetKey(x=>x+1);};
  const value=useMemo(()=>({scalar,setScalar,records,setRecords,warmup,setWarmup,schedule,setSchedule,resetScalar,resetRecords,resetKey}),[scalar,records,warmup,schedule,resetKey]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
function useFlow(){const state=useContext(Context);if(!state)throw Error('Ring flow view requires its topic provider');return state;}
export function RingFlowSelect({label,value,onChange,options}) {
  return <label className="ring-flow-input"><span>{label}</span><select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>{options.map(([key,text])=><option key={key} value={key}>{text}</option>)}</select></label>;
}
export function RingFlowNumber({label,value,onChange,min=-10,max=10,step=.1,integer=false,resetToken=0}) {
  const parentReset=useContext(Context)?.resetKey,errorId=useId();
  const [draft,setDraft]=useState(null),[error,setError]=useState(null);
  useEffect(()=>{setDraft(null);setError(null);},[label,value,parentReset,resetToken]);
  const shown=draft?.source===value?draft.text:String(value);
  function edit(text){setDraft({source:value,text});const number=Number(text),valid=text.trim()!==''&&Number.isFinite(number)&&number>=min&&number<=max&&(!integer||Number.isInteger(number));setError(valid?null:`Use ${integer?'an integer':'a finite number'} from${min} to${max}. The last valid result stays visible.`);if(valid){onChange(number);setDraft({source:number,text});}}
  return <label className="ring-flow-input"><span>{label}</span><input type="number" aria-label={label} aria-describedby={error?errorId:undefined} value={shown} min={min} max={max} step={integer?1:step} aria-invalid={!!error} onChange={event=>edit(event.target.value)} onBlur={()=>{setDraft(null);setError(null);}}/>{error&&<small id={errorId} role="alert">{error}</small>}</label>;
}
export function RingWarmupLab({view='projection'}) {
  const {warmup:s,setWarmup}=useFlow(),map=(name,row)=>name==='Q'?row:name==='K'?[row[0],row[0]+row[1]]:[2*row[0],-row[0]+3*row[1]],query=map('Q',s.rows[s.row]),keys=s.rows.map(row=>map('K',row)),values=s.rows.map(row=>map('V',row));
  return <FlowLab label={view==='projection'?'Change a source row and rebuild its three projections':'Read two projected values with the same current query'}>
    {view==='projection'?<RingProjectionFigure rows={s.rows} selected={s.row}/>:<RingReadFigure query={query} keys={keys} values={values}/>}
    <FlowControls><FlowSlider name="Source row" value={s.row} min={0} max={1} step={1} onChange={row=>setWarmup(x=>({...x,row}))}/><FlowSlider name={`Source coordinate${s.channel}`} value={s.rows[s.row][s.channel]} min={-2} max={2} step={.1} onChange={value=>setWarmup(x=>({...x,rows:x.rows.map((row,i)=>i===x.row?row.map((v,c)=>c===x.channel?value:v):row)}))}/><FlowSlider name="Coordinate to change" value={s.channel} min={0} max={1} step={1} onChange={channel=>setWarmup(x=>({...x,channel}))}/></FlowControls>
    <FlowReadout>Source row {s.row} is [{ringNumbers(s.rows[s.row])}]; the same learned maps now make q=[{ringNumbers(query)}], k=[{ringNumbers(keys[s.row])}], v=[{ringNumbers(values[s.row])}]. Both pictures share these source rows.</FlowReadout>
  </FlowLab>;
}
export function RingOwnershipFlowLab({view='visits'}) {
  const {schedule:s,setSchedule}=useFlow(),owners=model.ownership(8,s.ranks),round=Math.min(s.round,s.ranks-1);
  return <FlowLab label="Inspect permanent query rows and visiting key/value rows"><RingTransportFigure owners={owners} round={round} direction={s.direction}/><RingOwnedRowsFigure owners={owners} round={round} direction={s.direction}/><FlowControls><FlowSlider name="Position owners" value={s.ranks} min={1} max={4} step={1} onChange={ranks=>setSchedule(x=>({...x,ranks,round:Math.min(x.round,ranks-1)}))}/><FlowSlider name="Received round" value={round} min={0} max={s.ranks-1} step={1} onChange={round=>setSchedule(x=>({...x,round}))}/>{view==='direction'&&<RingFlowSelect label="Transport direction" value={s.direction} onChange={value=>setSchedule(x=>({...x,direction:Number(value)}))} options={[[1,'Forward: next rank receives'],[-1,'Reverse: previous rank receives']]}/>}</FlowControls><FlowReadout>{s.ranks} owners need {s.ranks} block visits and {s.ranks-1} transfers. Round {round} keeps every query on its owner and changes only the visiting KV packet. {s.ranks===1?'One owner needs no actual transfer.':'Transport order never renumbers global positions.'}</FlowReadout></FlowLab>;
}
function scalarResult(s){const blocks=[Array.from({length:s.split},(_,i)=>i),Array.from({length:4-s.split},(_,i)=>i+s.split)];if(s.reverse)blocks.reverse();return model.scalarMerge(s.scores,s.values,blocks,s.allowed,s.offset);}
function ScalarReadout({state:s,result:r}) {return <FlowReadout>All-current-record output is <strong>{r.valid?f(r.output,9):'undefined probabilities; zero-output convention'}</strong>; online/reference difference {Math.abs(r.trace.at(-1).output-r.output).toExponential(3)}. {s.pinned&&<>Pinned output {s.pinned.valid?f(s.pinned.output,9):'undefined'} used scores [{ringNumbers(s.pinned.scores)}], values [{ringNumbers(s.pinned.values)}], offset {s.pinned.offset}, blocks {s.pinned.blocks.map(ids=>`[${ids}]`).join('→')}.</>}</FlowReadout>;}
export function RingScalarFlowLab({view='records'}) {
  const {scalar:s,setScalar}=useFlow(),r=scalarResult(s),update=(name,value)=>setScalar(x=>({...x,[name]:value})),t=r.trace[s.step],selected=s.record;
  let figure,controls;
  if(view==='records') {
    figure=<RingSignedBars values={s.values.map((v,i)=>v*(r.weights?.[i]??0))} labels={s.values.map((_,i)=>`record${i}`)} unit="Signed global-weight × value"/>;
    controls=<><FlowSlider name="Record" value={selected} min={0} max={3} step={1} onChange={record=>update('record',record)}/><RingFlowNumber label={`Record${selected} score`} min={-20} max={20} value={s.scores[selected]} onChange={value=>update('scores',s.scores.map((v,i)=>i===selected?value:v))}/><RingFlowNumber label={`Record${selected} value`} value={s.values[selected]} onChange={value=>update('values',s.values.map((v,i)=>i===selected?value:v))}/></>;
  } else if(view==='scale') {
    const first=r.parallel.terms[0],second=r.parallel.terms[1];
    figure=Number.isFinite(r.parallel.maximum)?<RingStableMergeFigure first={first} second={second}/>:<RingFlowFigure label="No valid record has a normalizer" height={100}><text x="18" y="35">All entries forbidden · distribution undefined</text><text x="18" y="72">We choose output0; no normalized weights.</text></RingFlowFigure>;
    controls=<><FlowSlider name="Common score offset" value={s.offset} min={-1000} max={1000} step={1} onChange={offset=>update('offset',offset)}/><RingFlowSelect label="Arrival order" value={String(s.reverse)} onChange={value=>update('reverse',value==='true')} options={[[false,'First block, then second'],[true,'Second block, then first']]}/><FlowSlider name="First-block record count" value={s.split} min={1} max={3} step={1} onChange={split=>update('split',split)}/></>;
  } else if(view==='empty') {
    figure=<RingFlowFigure label="Forbidden records contribute no mass or numerator; other summary remains" height={245}>{({arrow})=><><RingCells values={s.allowed.map((a,i)=>a?`ID${i}`:'×')} x={18} y={43} label="Current permitted records" cell={70}/><RingWire path="M157 74 V118" arrow={arrow}/><RingCells values={[t.total,t.numerator]} x={70} y={151} label="Visited mass ℓ · signed numerator u" cell={110}/><text x="18" y="218">Empty incoming tiles keep earlier valid mass.</text></>}</RingFlowFigure>;
    controls=<><FlowSlider name="Record permission to edit" value={selected} min={0} max={3} step={1} onChange={record=>update('record',record)}/><RingFlowSelect label={`Record${selected} permission`} value={String(s.allowed[selected])} onChange={value=>update('allowed',s.allowed.map((v,i)=>i===selected?value==='true':v))} options={[[true,'Allowed'],[false,'Forbidden']]}/><FlowSlider name="Arrival to inspect" value={s.step} min={0} max={1} step={1} onChange={step=>update('step',step)}/></>;
  } else {
    figure=<RingDecodeCollectivesFigure states={r.parallel.terms}/>;
    controls=<><FlowSlider name="Record to edit" value={selected} min={0} max={3} step={1} onChange={record=>update('record',record)}/><RingFlowNumber label={`Decode value${selected}`} value={s.values[selected]} onChange={value=>update('values',s.values.map((v,i)=>i===selected?value:v))}/></>;
  }
  return <FlowLab label={`Shared four-record normalization: ${view}`}>{figure}<FlowControls>{controls}</FlowControls><ScalarReadout state={s} result={r}/>{view==='records'&&<p>Equal averages of separately normalized block answers give{f(r.naive,8)}; omitting the changing-reference rescale gives{f(r.unscaled,8)}. These are deliberately incorrect rules, though special inputs can agree.</p>}</FlowLab>;
}
export function RingScalarActions() {
  const {scalar:s,setScalar,resetScalar}=useFlow(),r=scalarResult(s),blocks=r.trace.map(t=>[...t.ids]);
  return <div className="ring-flow-controls-footer"><FlowControls><button type="button" onClick={()=>setScalar(x=>({...x,pinned:{...copy(x),blocks,output:r.output,valid:r.valid}}))}>Pin complete scalar case</button><button type="button" onClick={resetScalar}>Reset scalar case</button></FlowControls></div>;
}

export function RingRecordsFlowLab({view='identity'}) {
  const {records:s,setRecords}=useFlow(),up=(name,value)=>setRecords(x=>({...x,[name]:value})),mask=model.recordMask(s.records,{owners:s.owners,packed:true,causal:true,empty:s.empty?s.query:-1}),dense=useMemo(()=>model.denseAttention(s.arrays.query,s.arrays.key,s.arrays.value,mask),[s.arrays,s.records,s.empty,s.query]),ring=useMemo(()=>model.ringAttention(s.arrays.query,s.arrays.key,s.arrays.value,s.owners,mask,s.direction,{head:s.head,query:s.query}),[s]),record=s.records[s.key];
  let figure,controls;
  if(view==='identity') {
    figure=<div className="ring-flow-scenes"><RingRecordFigure records={s.records} query={s.query} keyId={s.key} allowed={mask}/><RingRecordFigure records={s.records} query={s.query} keyId={s.key} allowed={mask} order={s.owners.flat()}/></div>;
    controls=<><FlowSlider name="Query ID" min={0} max={6} step={1} value={s.query} onChange={query=>up('query',query)}/><FlowSlider name="Key ID" min={0} max={6} step={1} value={s.key} onChange={key=>up('key',key)}/><FlowSlider name="Head" min={0} max={1} step={1} value={s.head} onChange={head=>up('head',head)}/></>;
  } else if(view==='metadata') {
    figure=<RingRecordPayloadFigure id={s.key} record={record} query={s.arrays.query[s.head][s.key]} keyVector={s.arrays.key[s.head][s.key]} value={s.arrays.value[s.head][s.key]}/>;
    const edit=(name,value)=>up('records',s.records.map((r,i)=>i===s.key?{...r,[name]:value}:r));
    controls=<><RingFlowNumber label={`Record${s.key} logical position`} min={0} max={12} integer value={record.position} onChange={value=>edit('position',value)}/><RingFlowNumber label={`Record${s.key} document ID`} min={0} max={2} integer value={record.document} onChange={value=>edit('document',value)}/><RingFlowSelect label={`Record${s.key} validity`} value={String(record.valid)} onChange={value=>edit('valid',value==='true')} options={[[true,'Valid record'],[false,'Padding · no contribution']]}/></>;
  } else if(view==='tensors') {
    figure=<RingSignedBars values={ring.output[s.head][s.query]} labels={['output channel0','output channel1','output channel2']} unit="Current complete query read"/>;
    const id=s.field==='query'?s.query:s.key;
    controls=<><RingFlowSelect label="Projected tensor to edit" value={s.field} onChange={value=>up('field',value)} options={['query','key','value'].map(name=>[name,name])}/><FlowSlider name="Tensor channel" value={s.channel} min={0} max={2} step={1} onChange={channel=>up('channel',channel)}/><RingFlowNumber label={`${s.field} head${s.head} ID${id} channel${s.channel}`} min={-5} max={5} value={s.arrays[s.field][s.head][id][s.channel]} onChange={value=>{const arrays=copy(s.arrays);arrays[s.field][s.head][id][s.channel]=value;up('arrays',arrays);}}/></>;
  } else {
    const arrival=ring.trace[s.round];
    const right=25+arrival.ids.length*Math.min(80,270/arrival.ids.length)-5,cell=Math.min(80,270/arrival.ids.length);
    figure=<RingFlowFigure label="Current visiting keys compare with Q; their matching values join the stable summary" height={440}>{({arrow})=><>
      <RingCells values={[`q${s.query}`]} x={25} y={42} label={`Permanent query · owner${arrival.rank}`} cell={80}/>
      <RingCells values={arrival.ids.map(id=>`k${id}`)} x={25} y={109} label={`Visiting K · owner${arrival.owner}`} cell={cell}/>
      <RingCells values={arrival.ids.map(id=>`v${id}`)} x={25} y={169} label="Matching V · same IDs" cell={cell}/>
      <circle cx="175" cy="245" r="26" fill="none" stroke={ringPaint.line}/><text x="175" y="249" textAnchor="middle">merge</text>
      <RingWire path="M100 57 H330 V245 H203" arrow={arrow}/><RingWire path={`M${right} 124 H317 V205 H175 V216`} arrow={arrow}/><RingWire path={`M${right} 184 H304 V286 H175 V273`} arrow={arrow}/>
      <text x="18" y="305">Current scores, masses and weighted V</text>
      <RingWire path="M147 245 H7 V362 H14" arrow={arrow}/>
      <RingCells values={[arrival.total,...arrival.numerator]} x={18} y={347} label={`m=${Number.isFinite(arrival.maximum)?f(arrival.maximum,5):'−∞'}; ℓ and three u channels`} cell={80}/>
      <text x="18" y="422">Visited output[{ringNumbers(arrival.output)}]</text>
    </>}</RingFlowFigure>;
    controls=<><FlowSlider name="Arrival round" value={s.round} min={0} max={s.owners.length-1} step={1} onChange={round=>up('round',round)}/><RingFlowSelect label="KV direction" value={s.direction} onChange={value=>up('direction',Number(value))} options={[[1,'Forward'],[-1,'Reverse']]}/><RingFlowSelect label="Selected query permission" value={String(s.empty)} onChange={value=>up('empty',value==='true')} options={[[false,'Ordinary packed-causal row'],[true,'Forbid every key · empty row']]}/></>;
  }
  return <FlowLab label={`Shared seven-position case: ${view}`}>{figure}<FlowControls>{controls}</FlowControls><FlowReadout>Current head {s.head}, query ID {s.query} reads [{ringNumbers(ring.output[s.head][s.query])}]. Same-mask dense/ring error {model.maxError(dense.output,ring.output).toExponential(3)}. The selected pair is {mask[s.query][s.key]?'allowed':'forbidden'} by document, position and validity. This is one shared case across record views.</FlowReadout>{view==='identity'&&<p>Changing only storage keeps these permissions attached to the same IDs; the second grid lists the same pairs in owner order.</p>}</FlowLab>;
}

export function RingGradientFlowLab({view='partials'}) {
  const {records:s,setRecords}=useFlow(),mask=model.recordMask(s.records,{owners:s.owners,packed:true,causal:true,empty:s.empty?s.query:-1}),r=useMemo(()=>model.attentionBackward(s.arrays.query,s.arrays.key,s.arrays.value,s.owners,mask,s.arrays.upstream,{head:s.head,key:s.key}),[s]),target=s.target??'dK',owner=model.ownerOf(s.owners,s.key),actual=r[target][s.head][s.key][s.channel];
  const update=(name,value)=>setRecords(x=>({...x,[name]:value}));
  const figure=<RingGradientReturnFigure partials={r.partials} owner={owner} channel={s.channel} target={target}/>;
  const controls=view==='upstream'?<><FlowSlider name="Upstream query ID" value={s.query} min={0} max={6} step={1} onChange={query=>update('query',query)}/><FlowSlider name="Upstream channel" value={s.channel} min={0} max={2} step={1} onChange={channel=>update('channel',channel)}/><RingFlowNumber label={`G=dO head${s.head} ID${s.query} channel${s.channel}`} min={-5} max={5} value={s.arrays.upstream[s.head][s.query][s.channel]} onChange={value=>{const arrays=copy(s.arrays);arrays.upstream[s.head][s.query][s.channel]=value;update('arrays',arrays);}}/></>:<><FlowSlider name="Receiving key/value ID" value={s.key} min={0} max={6} step={1} onChange={key=>update('key',key)}/><FlowSlider name="Derivative channel" value={s.channel} min={0} max={2} step={1} onChange={channel=>update('channel',channel)}/><RingFlowSelect label="Returned derivative" value={target} onChange={value=>update('target',value)} options={[['dK','dK · key gradient'],['dV','dV · value gradient']]}/></>;
  return <FlowLab label="Sum all remote derivative contributions and return them to the original key owner">{figure}<FlowControls>{controls}</FlowControls><FlowReadout>Complete {target}[{s.head},{s.key},{s.channel}]={f(actual,10)}; dropping remote query contributions gives {f(r[target==='dK'?'localK':'localV'][s.head][s.key][s.channel],10)}. Every current forward normalizer is rebuilt before backward; these signed contributions are derivatives, not attention probabilities.</FlowReadout></FlowLab>;
}

export function RingScalarGradientFlowLab() {
  const {scalar:s}=useFlow(),r=scalarResult(s),ds=r.weights?.map((p,i)=>p*(s.values[i]-r.output))??[0,0,0,0];
  return <FlowLab label="Signed backward credit in the same current scalar read"><RingScalarGradientFigure probabilities={r.weights} values={s.values} output={r.output}/><FlowReadout>For upstream 1, current score derivatives [{ringNumbers(ds)}] sum to {f(model.sum(ds),10)}. A common score offset has zero directional derivative. {r.valid?'Current values share one global normalization.':'All-forbidden zero output has the explicitly chosen zero derivative; no probabilities exist.'}</FlowReadout></FlowLab>;
}

export function RingProjectionGradientFlowLab({view='maps'}) {
  const {warmup:s,setWarmup}=useFlow(),maps=[[[1,0],[0,1]],[[1,1],[0,1]],[[2,-1],[0,3]]],arrays=maps.map(w=>[s.rows.map(row=>w[0].map((_,c)=>row.reduce((total,v,i)=>total+v*w[i][c],0)))]),r=model.attentionBackward(...arrays,[[0],[1]],[[true,true],[true,true]],[s.upstream]),grads=[r.dQ[0],r.dK[0],r.dV[0]],dW=grads.map(g=>[0,1].map(c=>[0,1].map(j=>model.sum(s.rows.map((row,i)=>row[c]*g[i][j]))))),parts=grads.map((g,k)=>g.map(row=>maps[k].map(w=>model.dot(row,w)))),dX=s.rows.map((_,i)=>[0,1].map(c=>model.sum(parts.map(p=>p[i][c]))));
  return <FlowLab label="Actual shared learned-map gradients and joined source gradient in the original two-row case">
    {view==='maps'?<div className="ring-flow-scenes">{['Q','K','V'].map((name,i)=><RingMapGradientFigure key={name} name={name} source={s.rows} projectedGradient={grads[i]} mapGradient={dW[i]}/>)}</div>:<><div className="ring-flow-scenes">{['Q','K','V'].map((name,i)=><RingFlowFigure key={name} label={`Current d${name} times its map transpose contributes to both source coordinates`} height={240}><text x="18" y="22">d{name} W{name}ᵀ · same source shape2×2</text>{parts[i].map((row,r)=><RingCells key={r} values={row} x={18} y={65+r*70} label={`source row${r}`} paint={ringPaint.gradient} cell={130}/>)}</RingFlowFigure>)}</div><NeuralTable caption="Add all three source-gradient routes" headers={['Source row','Q route','K route','V route','Complete dX']} rows={dX.map((row,i)=>[i,...parts.map(p=>ringNumbers(p[i])),ringNumbers(row)])}/></>}
    <FlowControls><FlowSlider name="Upstream output row" value={s.row} min={0} max={1} step={1} onChange={row=>setWarmup(x=>({...x,row}))}/><FlowSlider name="Upstream output channel" value={s.channel} min={0} max={1} step={1} onChange={channel=>setWarmup(x=>({...x,channel}))}/><RingFlowNumber label={`G = dO row${s.row},channel${s.channel}`} min={-5} max={5} value={s.upstream[s.row][s.channel]} onChange={value=>setWarmup(x=>({...x,upstream:x.upstream.map((row,i)=>i===x.row?row.map((v,c)=>c===x.channel?value:v):row)}))}/></FlowControls>
    <FlowReadout>The current objective is J = sum G·O. G=[{s.upstream.map(row=>`[${ringNumbers(row)}]`).join(',')}]; all positions contribute to each shared map. Averaging two owner partials would halve the required map gradient. The source gradient adds Q,K,V routes.</FlowReadout>
  </FlowLab>;
}

export function RingDerivativeCheckFlowLab() {
  const {records:s,setRecords}=useFlow(),[epsilon,setEpsilon]=useState(1e-6),field=s.field,id=field==='query'?s.query:s.key,mask=model.recordMask(s.records,{owners:s.owners,packed:true,causal:true,empty:s.empty?s.query:-1}),r=model.attentionBackward(s.arrays.query,s.arrays.key,s.arrays.value,s.owners,mask,s.arrays.upstream),name={query:'dQ',key:'dK',value:'dV'}[field],analytic=r[name][s.head][id][s.channel],objective=arrays=>{const o=model.ringAttention(arrays.query,arrays.key,arrays.value,s.owners,mask,s.direction).output;return model.sum(o.flatMap((head,h)=>head.flatMap((row,i)=>row.map((v,c)=>v*s.arrays.upstream[h][i][c]))));},plus=copy(s.arrays),minus=copy(s.arrays);
  plus[field][s.head][id][s.channel]+=epsilon;minus[field][s.head][id][s.channel]-=epsilon;
  const numerical=(objective(plus)-objective(minus))/(2*epsilon);
  return <FlowLab label="Check a current projected derivative against a fresh central finite difference"><RingSignedBars values={[analytic,numerical]} labels={['analytic VJP','central difference']} unit="Derivative of the same J=sum G·O"/><FlowControls><RingFlowSelect label="Projected tensor to check" value={field} onChange={value=>setRecords(x=>({...x,field:value}))} options={['query','key','value'].map(name=>[name,name])}/><FlowSlider name="Coordinate within current head/record" value={s.channel} min={0} max={2} step={1} onChange={channel=>setRecords(x=>({...x,channel}))}/><RingFlowNumber label="Finite difference step ε" min={1e-9} max={.01} step={1e-6} value={epsilon} onChange={setEpsilon}/></FlowControls><FlowReadout>Current {name}[{s.head},{id},{s.channel}]: analytic {f(analytic,10)}, central {f(numerical,10)}, absolute error {Math.abs(analytic-numerical).toExponential(5)}. Both perturbed evaluations use the same current mask, ownership and upstream. Very small ε can amplify rounding.</FlowReadout></FlowLab>;
}

export function RingRecordsOwnershipFlowLab() {
  const {records:s,setRecords,resetKey}=useFlow(),[draft,setDraft]=useState(null),[error,setError]=useState(null),errorId=useId(),current=s.owners.map(ids=>ids.join(',')).join(';');
  useEffect(()=>{setDraft(null);setError(null);},[resetKey]);
  function edit(text) {
    setDraft(text);const rows=text.split(';').map(row=>row.trim().split(',').map(value=>value.trim()!==''?Number(value):NaN));
    if(!model.validateOwnership(rows,7)){setError('Use an exact partition of IDs0–6: nonempty ranks separated by ; and IDs separated by commas. Last valid result stays visible.');return;}
    setError(null);setRecords(x=>({...x,owners:rows,round:Math.min(x.round,rows.length-1)}));
  }
  return <FlowLab label="Move arbitrary actual record IDs between their storage owners"><RingOwnedRowsFigure owners={s.owners} round={Math.min(s.round,s.owners.length-1)} direction={s.direction}/><FlowControls><label className="ring-flow-input"><span>Owner ID lists, for example0,1,2;3,4;5,6</span><input aria-label="Owner ID lists, for example0,1,2;3,4;5,6" aria-describedby={error?errorId:undefined} value={draft??current} aria-invalid={!!error} onChange={event=>edit(event.target.value)}/>{error&&<small id={errorId} role="alert">{error}</small>}</label></FlowControls><FlowReadout>Current validated owners [{current}]. The document, global position,Q,K,V and output IDs remain attached to the same records. Arrival and gradient views use this exact partition.</FlowReadout></FlowLab>;
}

export function RingRecordsActions() {
  const {records:s,setRecords,resetRecords}=useFlow(),mask=model.recordMask(s.records,{owners:s.owners,packed:true,causal:true,empty:s.empty?s.query:-1}),current=model.attentionBackward(s.arrays.query,s.arrays.key,s.arrays.value,s.owners,mask,s.arrays.upstream);
  return <><FlowControls><button type="button" onClick={()=>setRecords(x=>({...x,pinned:{...copy(x),pinned:null,output:copy(current.forward.output),dQ:copy(current.dQ),dK:copy(current.dK),dV:copy(current.dV)}}))}>Pin complete record and gradient case</button><button type="button" onClick={resetRecords}>Reset record case</button></FlowControls>{s.pinned&&<p>Pinned head{s.pinned.head},query{s.pinned.query},key{s.pinned.key}; all projected arrays, upstream, metadata, owners, output and derivatives are retained. Largest current output change{model.maxError(current.forward.output,s.pinned.output).toExponential(5)}; largest dK change{model.maxError(current.dK,s.pinned.dK).toExponential(5)}.</p>}</>;
}
