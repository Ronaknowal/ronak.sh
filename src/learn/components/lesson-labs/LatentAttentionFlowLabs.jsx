import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { latentManualCase, latentCaseRead, latentBasisStatus, latentMovementPoints, latentBlockMerge } from '../../data/latent-attention-reading-fixtures.js';
import { latentForecastTrace } from '../../data/latent-attention-reading-traces.js';
import { latentBudget, latentForecast, difference, rotationOrder, rankOne } from '../../data/latent-attention-models.js';
import { MlaDrawing, MlaCells, MlaText, MlaArrow, MlaContentReadDrawing, MlaKeyAbsorptionDrawing, MlaValueRoutesDrawing, MlaOutputWriteDrawing, MlaRotaryReadDrawing, MlaRotationOrderDrawing, MlaBasisDrawing, MlaNonlinearDrawing, MlaBudgetDrawing, MlaRankDrawing, MlaNetworkPathsDrawing, MlaLearnedHeadDrawing, MlaAffineStageDrawing, MlaResidualDrawing, MlaBlockMergeDrawing, mlaVector, mlaColors } from './LatentAttentionFlowFigures.jsx';
import './latent-attention-flow.css';
import { MlaJunction } from './LatentAttentionFlowFigures.jsx';

const Cases=createContext(null);
const budgetDefault=()=>({batch:1,layers:60,length:32768,heads:128,content:128,value:128,latent:512,rotary:64,bytes:2,queries:1,groups:8});
const movementDefault=()=>({length:32,frame:23,edits:{},representation:'original',wrongScale:false,shift:0,head:0,record:23});
export function LatentCaseProvider({ children }) {
  const [manual,setManual]=useState(latentManualCase), [rotation,setRotation]=useState({matrix:[[2,0],[0,1]],vector:[1,0],angle:Math.PI/2}),
    [basis,setBasis]=useState({matrix:[[2,0],[0,.5]],enabled:false}),[rank,setRank]=useState({matrix:[[3,1],[0,2]],input:[2,-3],retained:1}),
    [budget,setBudget]=useState(budgetDefault),[movement,setMovement]=useState(movementDefault),[resetToken,setResetToken]=useState(0);
  const value=useMemo(()=>({manual,setManual,rotation,setRotation,basis,setBasis,rank,setRank,budget,setBudget,movement,setMovement,resetToken,reset:name=>{
    if(name==='manual')setManual(latentManualCase());
    if(name==='rotation')setRotation({matrix:[[2,0],[0,1]],vector:[1,0],angle:Math.PI/2});
    if(name==='basis')setBasis({matrix:[[2,0],[0,.5]],enabled:false});
    if(name==='rank')setRank({matrix:[[3,1],[0,2]],input:[2,-3],retained:1});
    if(name==='budget')setBudget(budgetDefault());
    if(name==='movement')setMovement(movementDefault());
    setResetToken(token=>token+1);
  }}),[manual,rotation,basis,rank,budget,movement,resetToken]);
  return <Cases.Provider value={value}>{children}</Cases.Provider>;
}
function useCases(){const value=useContext(Cases);if(!value)throw new Error('MLA investigations require their shared case provider.');return value;}
export function MlaSelection({ name,value,onChange,options }) {
  const id=useId();return <label className="mla-flow-select" htmlFor={id}><span>{name}</span><select id={id} aria-label={name} value={value} onChange={event=>onChange(event.target.value)}>{options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>;
}
function MlaToggle({name,value,onChange}){const id=useId();return <label className="mla-flow-toggle" htmlFor={id}><input id={id} type="checkbox" checked={value} onChange={event=>onChange(event.target.checked)}/>{name}</label>;}
function MlaNumber({name,value,onChange,min,max,integer=false,even=false}) {
  const {resetToken}=useCases(),id=useId(),[draft,setDraft]=useState(String(value)),[error,setError]=useState('');
  useEffect(()=>{setDraft(String(value));setError('');},[value,resetToken]);
  const edit=text=>{setDraft(text);const parsed=Number(text);
    if(text.trim()===''||!Number.isFinite(parsed)||parsed<min||parsed>max||(integer&&!Number.isInteger(parsed))||(even&&parsed%2!==0)){
      setError(`Use ${even?'an even integer':integer?'an integer':'a finite number'} from ${min} to ${max}. The current calculation still uses ${value}.`);return;
    }
    const rejection=onChange(parsed);setError(typeof rejection==='string'?`${rejection} The current calculation still uses ${value}.`:'');
  };
  return <label className="mla-flow-select" htmlFor={id}><span>{name}</span><input id={id} type="number" aria-label={name} min={min} max={max} step={integer?even?2:1:'any'} value={draft} aria-invalid={Boolean(error)} aria-describedby={error?`${id}-error`:undefined} onChange={event=>edit(event.target.value)}/>{error&&<span id={`${id}-error`} role="status">{error}</span>}</label>;
}
const indices=(count,label='Record')=>Array.from({length:count},(_,i)=>[i,`${label} ${i}`]);
const mapEntries=(heads=1,columns=2)=>Array.from({length:heads*2*columns},(_,index)=>{
  const head=Math.floor(index/(2*columns)),row=Math.floor(index/columns)%2,column=index%columns;
  return [`${head}:${row}:${column}`,`${heads>1?`Head ${head}, `:''}output row ${row}, input column ${column}`];
});
const editMatrix=(matrix,row,column,value)=>matrix.map((line,i)=>i===row?line.map((entry,j)=>j===column?value:entry):line);

export function MlaManualLab({investigation='latent',positioned=false}) {
  const {manual,setManual,basis}=useCases(),[selection,setSelection]=useState('0'),[entry,setEntry]=useState('0:0:0');
  const index=Math.min(Number(selection),manual.latent.length-1),head=investigation==='query'?Math.min(Number(selection),1):0,
    read=latentCaseRead(manual,{positioned,basis:basis.enabled?basis.matrix:null}),updateRow=(key,row,coordinate,value)=>setManual(old=>({...old,[key]:old[key].map((values,i)=>i===row?values.map((v,j)=>j===coordinate?value:v):values)}));
  const [mapHead,mapRow,mapColumn]=entry.split(':').map(Number),mapKey=investigation==='key'?'keyUp':'valueUp',
    mapUpdate=value=>setManual(old=>({...old,[mapKey]:old[mapKey].map((map,i)=>i===mapHead?editMatrix(map,mapRow,mapColumn,value):map)}));
  const displayedHead=['key','value'].includes(investigation)?mapHead:head;
  return <FlowLab id={`mla-${positioned?'positioned':'content'}-${investigation}`} label={`MLA ${investigation} investigation, same shared case`}>
    {investigation==='output'?<MlaOutputWriteDrawing state={manual} read={read}/>:investigation==='value'?<MlaValueRoutesDrawing read={read} head={displayedHead}/>:investigation==='key'?<MlaKeyAbsorptionDrawing state={manual} read={read} head={displayedHead}/>:<MlaContentReadDrawing state={manual} read={read} head={displayedHead} positioned={positioned}/>}
    <FlowControls>
      {investigation==='latent'&&<><MlaSelection name="Shared record to edit" value={index} onChange={setSelection} options={indices(manual.latent.length)}/>{[0,1].map(coordinate=><FlowSlider key={coordinate} name={`Stored c coordinate ${coordinate}`} value={manual.latent[index][coordinate]} min={-4} max={4} step={.05} onChange={value=>updateRow('latent',index,coordinate,value)}/>)}</>}
      {investigation==='query'&&<><MlaSelection name="Query head" value={head} onChange={setSelection} options={indices(2,'Head')}/>{[0,1].map(coordinate=><FlowSlider key={coordinate} name={`Query coordinate ${coordinate}`} value={manual.queries[head][coordinate]} min={-4} max={4} step={.05} onChange={value=>updateRow('queries',head,coordinate,value)}/>)}</>}
      {['key','value'].includes(investigation)&&<><MlaSelection name={`${investigation==='key'?'Key':'Value'} map entry`} value={entry} onChange={setEntry} options={mapEntries(2)}/><FlowSlider name="Learned coefficient" value={manual[mapKey][mapHead][mapRow][mapColumn]} min={-4} max={4} step={.05} onChange={mapUpdate}/></>}
      {investigation==='output'&&<><MlaSelection name="Output-map entry" value={entry} onChange={setEntry} options={mapEntries(1,4)}/><FlowSlider name="Learned coefficient" value={manual.outputMap[mapRow][mapColumn]} min={-4} max={4} step={.05} onChange={value=>setManual(old=>({...old,outputMap:editMatrix(old.outputMap,mapRow,mapColumn,value)}))}/></>}
    </FlowControls>
    <FlowReadout>{read.defined?<>Head {displayedHead} currently reads weights {mlaVector(read.heads[displayedHead].weights,6)} and writes {mlaVector(read.heads[displayedHead].absorbedOutput,6)}; the complete block write is {mlaVector(read.absorbedOutput,6)}. {investigation==='value'?'Only the value map is changed here: the query/key scores and weights do not depend on that map.':investigation==='output'?'The output map changes only the final write, after the two head outputs.':'These edits are local interventions on computed vectors or learned maps; an edited latent need not still equal the fixed opening down-map calculation.'}</>:read.reason}</FlowReadout>
  </FlowLab>;
}

export function MlaRotaryLab({investigation='raw'}) {
  const {manual,setManual}=useCases(),[selection,setSelection]=useState('q:0'),[record,setRecord]=useState(0),[head,setHead]=useState(0),[kind,indexText]=selection.split(':'),index=Math.min(Number(indexText),manual.latent.length-1),
    key=kind==='q'?'queryRotary':'keyRotary',read=latentCaseRead(manual),selected=Math.min(record,manual.latent.length-1),shownHead=investigation==='raw'&&kind==='q'?index:head;
  const edit=(coordinate,value)=>setManual(old=>({...old,[key]:old[key].map((row,i)=>i===index?row.map((v,j)=>j===coordinate?value:v):row)}));
  return <FlowLab id={`mla-rotary-${investigation}`} label={`MLA separate positional branch: ${investigation}`}>
    <MlaRotaryReadDrawing state={manual} read={read} head={shownHead}/>
    <FlowControls>
      {investigation==='raw'&&<><MlaSelection name="Raw positional vector" value={`${kind}:${index}`} onChange={setSelection} options={[...indices(2,'Query head').map(([i,label])=>[`q:${i}`,label]),...indices(manual.latent.length,'Key record').map(([i,label])=>[`k:${i}`,label])]}/>{[0,1].map(coordinate=><FlowSlider key={coordinate} name={`Raw pair coordinate ${coordinate}`} value={manual[key][index][coordinate]} min={-4} max={4} step={.05} onChange={value=>edit(coordinate,value)}/>)}</>}
      {investigation==='permission'&&<><MlaSelection name="Key record" value={selected} onChange={v=>setRecord(Number(v))} options={indices(manual.latent.length)}/><FlowSlider name="Key logical ID" value={manual.positions[selected]} min={0} max={16} step={1} onChange={value=>setManual(old=>({...old,positions:old.positions.map((id,i)=>i===selected?value:id)}))}/><FlowSlider name="Query logical ID" value={manual.queryPosition} min={0} max={16} step={1} onChange={value=>setManual(old=>({...old,queryPosition:value}))}/></>}
      {investigation==='frequency'&&<FlowSlider name="Pair frequency, radians per ID" value={manual.frequency} min={0} max={Math.PI} step={.01} onChange={value=>setManual(old=>({...old,frequency:value}))}/>}
      {investigation==='head'&&<MlaSelection name="Head to trace" value={head} onChange={v=>setHead(Number(v))} options={indices(2,'Head')}/>}
    </FlowControls>
    <FlowReadout>{read.defined?<>The current legal set contains {read.legal.filter(Boolean).length} records. Head {shownHead} adds content and rotary terms before the original scale {number(read.scale,6)} and writes {mlaVector(read.heads[shownHead].absorbedOutput,6)}.</>:<>No legal key remains. The normalized distribution is undefined; change a key or query ID to recover. Earlier edits remain stored.</>}</FlowReadout>
  </FlowLab>;
}

export function MlaHistoryLab() {
  const {manual,setManual,reset}=useCases(),[selection,setSelection]=useState(0),selected=Math.min(selection,manual.latent.length-1),read=latentCaseRead(manual);
  const append=()=>setManual(old=>({...old,latent:[...old.latent,[0,0]],keyRotary:[...old.keyRotary,[1,0]],positions:[...old.positions,Math.min(16,Math.max(...old.positions)+1)]})),remove=()=>setManual(old=>({...old,latent:old.latent.filter((_,i)=>i!==selected),keyRotary:old.keyRotary.filter((_,i)=>i!==selected),positions:old.positions.filter((_,i)=>i!==selected)}));
  return <FlowLab id="mla-history" label="Add or remove complete shared records without discarding other edits">
    <MlaCellsTable state={manual}/>
    <FlowControls><MlaSelection name="Record to remove" value={selected} onChange={value=>setSelection(Number(value))} options={indices(manual.latent.length)}/><button type="button" disabled={manual.latent.length===8} onClick={append}>Append [0,0], raw pair [1,0]</button><button type="button" disabled={manual.latent.length===2} onClick={remove}>Remove selected record</button></FlowControls>
    <FlowReadout>There are {manual.latent.length} records; the allowed range is 2–8. A new ID is one above the current largest ID, bounded at 16; the current query may therefore forbid the new record. {read.defined?`Current output ${mlaVector(read.absorbedOutput,6)}.`:read.reason}</FlowReadout>
    <FlowControls><button type="button" onClick={()=>reset('manual')}>Restore the original three-record case</button></FlowControls>
  </FlowLab>;
}
function MlaCellsTable({state}){return <MlaDrawing label="Complete current shared record fields: computed latent, raw positional pair and attached logical ID" width={620} height={120+state.latent.length*38}><MlaCells x={20} y={62} values={state.latent} label="Stored c"/><MlaCells x={235} y={62} values={state.keyRotary} label="Raw positional pair" role="input"/><MlaCells x={450} y={62} values={state.positions.map(value=>[value])} label="Logical ID" width={150} role="input"/></MlaDrawing>;}

export function MlaRotationLab({investigation='input'}) {
  const {rotation,setRotation,reset}=useCases(),[entry,setEntry]=useState('0:0:0'),[,row,column]=entry.split(':').map(Number),result=rotationOrder(rotation.matrix,rotation.vector,rotation.angle);
  return <FlowLab id={`mla-order-${investigation}`} label={`Projection and rotation order: ${investigation}`}><MlaRotationOrderDrawing {...rotation}/>
    <FlowControls>{investigation==='input'?<><FlowSlider name="Angle, radians" value={rotation.angle} min={0} max={Math.PI*2} step={.01} onChange={angle=>setRotation(old=>({...old,angle}))}/>{[0,1].map(i=><FlowSlider key={i} name={`Input coordinate ${i}`} value={rotation.vector[i]} min={-4} max={4} step={.05} onChange={value=>setRotation(old=>({...old,vector:old.vector.map((v,j)=>j===i?value:v)}))}/>)}</>:<><MlaSelection name="Map entry" value={entry} onChange={setEntry} options={mapEntries()}/><FlowSlider name="Coefficient" value={rotation.matrix[row][column]} min={-4} max={4} step={.05} onChange={value=>setRotation(old=>({...old,matrix:editMatrix(old.matrix,row,column,value)}))}/></>}</FlowControls>
    <FlowReadout>Map then turn produces {mlaVector(result.projectThenRotate,6)}; turn then map produces {mlaVector(result.rotateThenProject,6)}. Their current vector discrepancy is {number(Math.hypot(...result.projectThenRotate.map((v,i)=>v-result.rotateThenProject[i])),6)}. A zero discrepancy on one input does not prove the two matrices commute.</FlowReadout>
    {investigation==='matrix'&&<FlowControls><button type="button" onClick={()=>reset('rotation')}>Restore the quarter-turn stretch example</button></FlowControls>}
  </FlowLab>;
}

export function MlaBasisLab({investigation='apply'}) {
  const {manual,basis,setBasis,reset}=useCases(),[entry,setEntry]=useState('0:0:0'),[,row,column]=entry.split(':').map(Number),status=latentBasisStatus(basis.matrix),original=latentCaseRead(manual),changed=latentCaseRead(manual,{basis:basis.enabled?basis.matrix:null});
  return <FlowLab id={`mla-basis-${investigation}`} label={`General compensated post-normalization basis: ${investigation}`}><MlaBasisDrawing state={manual} basis={basis.matrix}/>
    <FlowControls>{investigation==='apply'?<MlaToggle name="Use Sc and compensate both maps" value={basis.enabled} onChange={enabled=>setBasis(old=>({...old,enabled}))}/>:<><MlaSelection name="Basis-map entry" value={entry} onChange={setEntry} options={mapEntries()}/><FlowSlider name="Coefficient" value={basis.matrix[row][column]} min={-4} max={4} step={.05} onChange={value=>setBasis(old=>({...old,matrix:editMatrix(old.matrix,row,column,value)}))}/></>}</FlowControls>
    <FlowReadout>The proposed basis is {status.status}; its infinity-norm condition estimate is {Number.isFinite(status.condition)?number(status.condition,6):'undefined without an inverse'}. {basis.enabled&&changed.defined&&original.defined?`Current compensated/original write difference is ${difference(changed.absorbedOutput,original.absorbedOutput).toExponential(3)}.`:basis.enabled?changed.reason:'The live manual read still uses its original coordinates; the drawing shows the proposed compensated coordinates.'}</FlowReadout>
    {investigation==='entries'&&<FlowControls><button type="button" onClick={()=>reset('basis')}>Restore the [2, 0.5] diagonal basis</button></FlowControls>}
  </FlowLab>;
}

export function MlaNonlinearLab() {
  const {manual}=useCases(),[head,setHead]=useState(0),read=latentCaseRead(manual,{nonlinear:true});
  return <FlowLab id="mla-nonlinear" label="Keep the current case and compare two nonlinear value-map placements"><MlaNonlinearDrawing state={manual} read={read} head={head}/><FlowControls><MlaSelection name="Head to compare" value={head} onChange={value=>setHead(Number(value))} options={indices(2,'Head')}/></FlowControls><FlowReadout>{read.defined?`Head ${head}: mix per-record ReLU values ${mlaVector(read.heads[head].expandedOutput,6)}; apply ReLU after linear mixing ${mlaVector(read.heads[head].absorbedOutput,6)}. A coincident result for this input is a possible null, not a general linearity identity.`:read.reason}</FlowReadout></FlowLab>;
}

const budgetFields={record:[['latent','Latent width d_c',1,2048],['rotary','Rotary width d_r',2,256],['bytes','Bytes per coordinate',1,4]],history:[['batch','Requests B',1,64],['layers','Layers L_layers',1,256],['length','Stored records L',1,262144]],heads:[['heads','Query heads H',1,256],['content','Content width d_k',1,2048],['value','Value width d_v',1,2048]],queries:[['queries','New queries T',1,262144]]};
export function MlaBudgetLab({investigation='record'}) {
  const {budget,setBudget,reset}=useCases(),result=latentBudget(budget),divisors=Array.from({length:budget.heads},(_,i)=>i+1).filter(value=>budget.heads%value===0);
  const change=(key,value)=>{if(key==='length'&&value<budget.queries)return 'Stored history L must be at least the current query count T; change T first.';if(key==='queries'&&value>budget.length)return 'T cannot exceed the current stored history L; increase L first.';if(key==='heads'&&value%budget.groups!==0)return `Current GQA count ${budget.groups} must divide the requested H; change G first.`;if(key==='bytes'&&![1,2,4].includes(value))return 'Use 1, 2 or 4 bytes.';setBudget(old=>({...old,[key]:value}));return null;};
  return <FlowLab id={`mla-cost-${investigation}`} label={`One shared exact cache and arithmetic case: ${investigation}`}><MlaBudgetDrawing settings={budget}/>
    <FlowControls>{investigation==='groups'?<MlaSelection name="GQA cached heads G, a divisor of H" value={budget.groups} onChange={value=>change('groups',Number(value))} options={divisors.map(value=>[value,`${value} cached heads`])}/>:budgetFields[investigation].map(([key,name,min,max])=><MlaNumber key={key} name={name} value={budget[key]} min={min} max={max} integer even={key==='rotary'} onChange={value=>change(key,value)}/>)}</FlowControls>
    <FlowReadout>Compact MLA stores {result.exact.record.toLocaleString('en-US')} coordinates per record and {result.exact.compact.toLocaleString('en-US')} payload bytes. The current GQA-{budget.groups} payload is {(result.exact.mqa*BigInt(budget.groups)).toLocaleString('en-US')} bytes. Absorbed/expanded core work is {number(result.absorbedOps/result.expandedOps,6)} times; counts do not measure wall-clock speed.</FlowReadout>
    {investigation==='queries'&&<FlowControls><button type="button" onClick={()=>reset('budget')}>Restore the stated V2-style dimensions</button></FlowControls>}
  </FlowLab>;
}
export function MlaBudgetResults(){const {budget}=useCases(),r=latentBudget(budget);return <>
  <NeuralTable caption="One current payload comparison; metadata and allocation padding excluded" headers={['Representation','Exact bytes','GiB']} rows={[
    ['Compact MLA',r.exact.compact],['Literal expanded same MLA',r.exact.expanded],['Expanded content, one shared positional key',r.exact.sharedRotary],['Plain MHA, different parameterization',r.exact.mha],[`GQA-${budget.groups}, different parameterization`,r.exact.mqa*BigInt(budget.groups)],['MQA, different parameterization',r.exact.mqa]
  ].map(([label,value])=>[label,value.toLocaleString('en-US'),number(Number(value)/2**30,9)])}/>
  <NeuralTable caption="One layer's current arithmetic, multiply-add counted as two operations" headers={['Operation','Exact count']} rows={[
    ['Expanded core',r.exact.expandedOps],['Absorbed core',r.exact.absorbedOps],['Historical key/value reconstruction',r.exact.reconstruction]
  ].map(([label,value])=>[label,value.toLocaleString('en-US')])}/>
  </>;}

export function MlaRankLab({investigation='input'}) {
  const {rank,setRank,reset}=useCases(),[entry,setEntry]=useState('0:0:0'),[,row,column]=entry.split(':').map(Number),result=rankOne(rank.matrix,rank.input);
  return <FlowLab id={`mla-rank-${investigation}`} label={`One shared matrix and input: ${investigation}`}><MlaRankDrawing {...rank}/>
    <FlowControls>{investigation==='input'?<>{[0,1].map(i=><FlowSlider key={i} name={`Input coordinate ${i}`} value={rank.input[i]} min={-10} max={10} step={.05} onChange={value=>setRank(old=>({...old,input:old.input.map((v,j)=>j===i?value:v)}))}/>) }<MlaSelection name="Retained directions" value={rank.retained} onChange={value=>setRank(old=>({...old,retained:Number(value)}))} options={[[1,'Leading one'],[2,'Both, exact control']]}/></>:<><MlaSelection name="Original matrix entry" value={entry} onChange={setEntry} options={mapEntries()}/><FlowSlider name="Coefficient" value={rank.matrix[row][column]} min={-10} max={10} step={.05} onChange={value=>setRank(old=>({...old,matrix:editMatrix(old.matrix,row,column,value)}))}/></>}</FlowControls>
    <FlowReadout>{result.tied?'The singular values tie: the shown direction is a deterministic representative, not a uniquely optimal axis.':'The retained direction minimizes unweighted matrix reconstruction error; this input can weight discarded directions differently.'} A two-direction map is exact for the current matrix.</FlowReadout>
    {investigation==='matrix'&&<FlowControls><button type="button" onClick={()=>reset('rank')}>Restore M = [[3,1],[0,2]], x = [2,−3]</button></FlowControls>}
  </FlowLab>;
}

const ModelContext=createContext(null);
const runtimeUrl='/learn-assets/multi-head-latent-attention-mla/runtime.json';
export function MlaModelProvider({children}) {
  const {movement}=useCases(),host=useRef(null),[near,setNear]=useState(false),[payload,setPayload]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{if(!('IntersectionObserver'in window)){setNear(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'240px'});observer.observe(host.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(!near)return;const controller=new AbortController();setError('');fetch(runtimeUrl,{signal:controller.signal}).then(response=>{if(!response.ok||/text\/html/i.test(response.headers.get('content-type')||''))throw new Error('Unavailable model');return response.json();}).then(data=>{if(!controller.signal.aborted)setPayload(data);}).catch(error=>{if(error.name!=='AbortError')setError('The saved model could not load. Your edited observations and settings are preserved.');});return()=>controller.abort();},[near,attempt]);
  const points=useMemo(()=>latentMovementPoints.slice(0,movement.length).map((row,i)=>movement.edits[i]??row),[movement.length,movement.edits]);
  const result=useMemo(()=>{
    if(!payload)return null;
    const basis=movement.representation==='original'?null:payload.completeBasis.map(row=>row.slice(0,Number(movement.representation))), options={basis,shift:movement.shift,wrongScale:movement.wrongScale};
    const trace=latentForecastTrace(payload.weights,points,options),expanded=latentForecast(payload.weights,points,{...options,expanded:true}), original=latentForecast(payload.weights,points,{shift:movement.shift}),correct=movement.wrongScale?latentForecast(payload.weights,points,{basis,shift:movement.shift}):trace,
      fullSamePolicy=movement.wrongScale?latentForecast(payload.weights,points,{shift:movement.shift,wrongScale:true}):original,
      unshifted=movement.shift?latentForecast(payload.weights,points,{basis,wrongScale:movement.wrongScale}):trace,baseline=latentForecast(payload.weights,latentMovementPoints.slice(0,movement.length),options);
    return {trace,expanded,original,fullSamePolicy,correct,unshifted,baseline,basis};
  },[payload,points,movement.representation,movement.shift,movement.wrongScale]);
  return <div ref={host}><ModelContext.Provider value={{payload,points,result,error,retry:()=>setAttempt(i=>i+1)}}>{children}</ModelContext.Provider></div>;
}
export function useMlaModel(){const value=useContext(ModelContext);if(!value)throw new Error('Fitted MLA investigations require their shared model provider.');return value;}
export function MlaModelStatus(){const {result,error,retry}=useMlaModel();return result?null:error?<><p role="alert">{error}</p><FlowControls><button type="button" onClick={retry}>Retry saved model</button></FlowControls></>:<p role="status">The compact saved model loads as this investigation enters view. You can already edit the drawn observations.</p>;}

export function MlaTrajectoryDrawing({points,selected=23,current=null,original=null,truth}) {
  const extra=[current,original,truth].filter(Boolean),extent=Math.max(1,...extra.flat().map(Math.abs)),min=Math.min(0,...extra.flat()),span=extent-min,unit=240/span,xy=row=>[62+(row[0]-min)*unit,286-(row[1]-min)*unit];
  return <MlaDrawing label="Observed two-coordinate movement on an equal-unit square; the withheld next point is reference only and never supplied as input" width={340} height={520}>
    <path d="M62 46 V286 H302" stroke={mlaColors.edge} fill="none"/>
    {[min,min+span/2,extent].map(v=><g key={v}><MlaText x={62+(v-min)*unit} y={313}>{number(v,3)}</MlaText><MlaText x={45} y={291-(v-min)*unit} anchor="end">{number(v,3)}</MlaText></g>)}
    <MlaText x={182} y={341}>Observed x coordinate</MlaText><MlaText x={185} y={25}>Observed y; equal units on both axes</MlaText>
    <polyline points={points.map(row=>xy(row).join(',')).join(' ')} stroke={mlaColors.input} fill="none" strokeWidth={2}/>
    {points.map((row,index)=>{const [x,y]=xy(row);return <circle key={index} cx={x} cy={y} r={index===selected?5:2.5} fill={index===selected?'#fff':mlaColors.input}/>;})}
    {[['Current forecast',current,mlaColors.computed,370],['Original model, same edits',original,mlaColors.operation,420],['Withheld next point',truth,mlaColors.operation,470]].map(([label,row,color,y])=>row&&<g key={label}>{(()=>{const [x,py]=xy(row);return <><path d={`M${x} ${py} L20 ${y-5}`} stroke={color} fill="none" strokeDasharray="3 3"/>{label==='Withheld next point'?<path d={`M${x-5} ${py-5} L${x+5} ${py+5} M${x-5} ${py+5} L${x+5} ${py-5}`} stroke={color}/>:<circle cx={x} cy={py} r={label==='Current forecast'?6:8} fill="none" stroke={color} strokeDasharray={label==='Current forecast'?undefined:'3 3'}/>}</>;})()}<MlaText x={30} y={y} anchor="start" size={14}>{label}</MlaText><MlaText x={30} y={y+23} anchor="start" size={14}>{mlaVector(row,5)}</MlaText></g>)}
  </MlaDrawing>;
}

export function MlaMovementLab({investigation='length'}) {
  const {movement,setMovement,reset}=useCases(),{points,result}=useMlaModel(),selected=Math.min(movement.frame,movement.length-1),point=points[selected],trace=result?.trace;
  const edit=(coordinate,value)=>setMovement(old=>({...old,edits:{...old.edits,[selected]:point.map((v,j)=>j===coordinate?value:v)}}));
  return <FlowLab id={`mla-movement-${investigation}`} label={`One shared fitted MLA case: ${investigation}`}>
    <MlaTrajectoryDrawing points={points} selected={selected} current={trace?.predictions.at(-1)} original={result?.original.predictions.at(-1)} truth={latentMovementPoints[movement.length]}/>
    <FlowControls>
      {investigation==='length'&&<FlowSlider name="Observed prefix length" value={movement.length} min={2} max={40} step={1} onChange={length=>setMovement(old=>({...old,length}))}/>}
      {investigation==='point'&&<><MlaSelection name="Observed frame to edit" value={selected} onChange={value=>setMovement(old=>({...old,frame:Number(value)}))} options={indices(movement.length,'Frame')}/>{[0,1].map(i=><FlowSlider key={i} name={`Observed ${i?'y':'x'} at frame ${selected}`} value={point[i]} min={0} max={1} step={.001} onChange={value=>edit(i,value)}/>)}</>}
      {investigation==='rank'&&<MlaSelection name="Stored content representation" value={movement.representation} onChange={representation=>setMovement(old=>({...old,representation}))} options={[['original','Original eight coordinates'],...indices(8).map(([i])=>[String(i+1),i===7?'Full eight-direction basis, no loss':`${i+1} retained directions`])]}/>}
      {investigation==='scale'&&<MlaToggle name="Use latent-width default instead of original 1/√6" value={movement.wrongScale} onChange={wrongScale=>setMovement(old=>({...old,wrongScale}))}/>}
      {investigation==='shift'&&<FlowSlider name="Common logical ID shift" value={movement.shift} min={0} max={128} step={1} onChange={shift=>setMovement(old=>({...old,shift}))}/>}
      {investigation==='reset'&&<button type="button" onClick={()=>reset('movement')}>Restore the original 32-point source prefix</button>}
    </FlowControls>
    {investigation==='length'&&<MlaModelStatus/>}
    <FlowReadout>{result?<>Current next forecast is {mlaVector(trace.predictions.at(-1),6)}. {investigation==='scale'?`Holding the current points, basis and IDs fixed, its correct-scale difference is ${difference(trace.predictions,result.correct.predictions).toExponential(3)}.`:investigation==='shift'?`Holding the current points, basis and scale fixed, comparison with zero common shift gives ${difference(trace.predictions,result.unshifted.predictions).toExponential(3)}.`:investigation==='rank'?`Compared with the full representation on these same edited points, IDs and scale-policy choice, difference is ${difference(trace.predictions,result.fullSamePolicy.predictions).toExponential(3)}. ${movement.wrongScale?'The accidental policy uses the selected latent width, so changing rank also changes its divisor; switch it off for a pure representation comparison.':'Only the representation changes; this is not a refit.'}`:`Expanded/absorbed execution difference is ${difference(trace.predictions,result.expanded.predictions).toExponential(3)}.`}</>:<>The {movement.length} observations are already editable. Numerical model outputs will appear when the saved weights are available.</>}</FlowReadout>
  </FlowLab>;
}

export function MlaMovementResults(){const {movement}=useCases(),{result}=useMlaModel();if(!result)return null;const {trace,expanded,original,correct}=result;return <>
  <NeuralTable caption="The same current observations, selected representation and positional settings" headers={['Computation','Next predicted [x,y]']} rows={[
    ['Expanded current function',mlaVector(expanded.predictions.at(-1),8)],['Absorbed current function',mlaVector(trace.predictions.at(-1),8)],['Original full model, current points/IDs, correct scale',mlaVector(original.predictions.at(-1),8)],['Current representation and points/IDs, correct scale',mlaVector(correct.predictions.at(-1),8)],['Withheld true point, never an input',mlaVector(latentMovementPoints[movement.length],8)]
  ]}/>
  <p>The current float32 payload is {movement.length*((movement.representation==='original'?8:Number(movement.representation))+2)*4} bytes: one stored content vector and one positional pair per observation. This excludes IDs, validity, allocator overhead and reserved capacity.</p>
  </>;}

export function MlaHeadInspection(){const {movement,setMovement}=useCases(),{result}=useMlaModel(),selected=Math.min(movement.record,movement.length-1),head=movement.head,trace=result?.trace,row=trace?.traces.at(-1)[head];
  return <FlowLab id="mla-fitted-head" label="Inspect the actual head and cache record in the current edited case">
    {trace&&<MlaLearnedHeadDrawing trace={trace} record={selected} head={head}/>}
    {trace&&<MlaDrawing label={`Actual selected cache record ${selected} and final-query head ${head}, from the current edited model inputs`} width={820} height={780}>
      <MlaCells x={30} y={62} values={trace.fullLatents[selected]} width={90} label="All eight normalized content coordinates, before rank projection" digits={5}/>
      <MlaArrow x1={390} y1={100} x2={390} y2={174}/><MlaCells x={30} y={174} values={trace.cache.latents[selected]} width={90} label={`Actually stored content: ${trace.cache.latents[selected].length} coordinates`} digits={5}/>
      <MlaCells x={30} y={286} values={trace.cache.rotaryKeys[selected]} width={135} label={`Stored positional pair, logical ID ${trace.cache.positions[selected]}`} digits={6}/>
      <MlaCells x={30} y={390} values={row.effective} width={90} label={`Head ${head}: effective content query`} digits={5}/>
      <MlaText x={410} y={475}>This record: content dot {number(row.contentScores[selected],6)};</MlaText><MlaText x={410} y={506}>positional dot {number(row.rotaryScores[selected],6)}; weight {number(row.weights[selected],8)}.</MlaText>
      <MlaCells x={30} y={570} values={row.mixture} width={90} label="Current full latent mixture" digits={5}/>
      <MlaCells x={30} y={684} values={row.output} width={90} label={`Actual head ${head} write, four coordinates`} digits={5}/>
    </MlaDrawing>}
    <FlowControls><MlaSelection name="Stored record" value={selected} onChange={value=>setMovement(old=>({...old,record:Number(value)}))} options={indices(movement.length)}/><MlaSelection name="Head" value={head} onChange={value=>setMovement(old=>({...old,head:Number(value)}))} options={indices(4,'Head')}/></FlowControls>
    <FlowReadout>{row?`This inspection uses the same ${movement.length} edited points, ${movement.representation==='original'?'original eight coordinates':`${movement.representation}-direction basis`}, common ID shift ${movement.shift} and ${movement.wrongScale?'latent-width':'original'} scale as the preceding questions.`:'The chosen record and head are retained while weights load.'}</FlowReadout>
    {row&&<NeuralTable caption={`All actual final-query scores and weights for the selected head ${head}`} headers={['Frame / logical ID','Content dot','Positional dot','Scaled score','Weight']} rows={row.weights.map((value,i)=>[`${i} / ${trace.cache.positions[i]}`,number(row.contentScores[i],7),number(row.rotaryScores[i],7),number(row.logits[i],7),number(value,9)])}/>}
  </FlowLab>;
}

export function MlaNetworkPaths(){const {movement}=useCases(),{result}=useMlaModel();return result?<MlaNetworkPathsDrawing trace={result.trace} record={Math.min(movement.frame,movement.length-1)}/>:null;}
const stages=[['stem','Input stem'],['query','Query down-map'],['content','Content down-map'],['queryContent','Content query up-map'],['queryRotary','Raw positional query up-map'],['rotaryKey','Shared raw positional key'],['output','Concatenated heads → block write'],['expand','FFN expansion'],['contract','FFN contraction'],['task','Final task map']];
export function MlaModelMap({stage='stem'}){
  const {movement}=useCases(),{result}=useMlaModel();if(!result)return null;
  const trace=result.trace,t=Math.min(movement.frame,movement.length-1),w=trace.weights;
  const values={
    stem:[trace.scaledInput[t],w['stem.weight'],w['stem.bias'],trace.stem[t]],query:[trace.attentionInput[t],w['query_down.weight'],null,trace.queryNorm.raw[t]],content:[trace.attentionInput[t],w['kv_down.weight'],null,trace.latentNorm.raw[t]],
    queryContent:[trace.queryNorm.output[t],w['query_content.weight'],null,trace.queryContent[t]],queryRotary:[trace.queryNorm.output[t],w['query_rotary.weight'],null,trace.rawQueryRotary[t]],rotaryKey:[trace.attentionInput[t],w['rotary_key.weight'],null,trace.rawKeyRotary[t]],
    output:[trace.joinedHeads[t],w['output.weight'],null,trace.writtenAttention[t]],expand:[trace.feedforwardInput[t],w['feedforward.0.weight'],w['feedforward.0.bias'],trace.feedforwardExpanded[t]],contract:[trace.feedforwardActivated[t],w['feedforward.2.weight'],w['feedforward.2.bias'],trace.feedforwardWritten[t]],task:[trace.finalNormalized[t],w['forecast.weight'],w['forecast.bias'],trace.taskScaled[t]],
  };
  const [input,map,bias,output]=values[stage];return <MlaAffineStageDrawing input={input} map={map} bias={bias} output={output} name={stages.find(([key])=>key===stage)[1]}/>;
}
export function MlaModelRowInspector(){const {movement}=useCases(),{result}=useMlaModel(),[stage,setStage]=useState('stem'),[row,setRow]=useState(0);if(!result)return null;
  const t=Math.min(movement.frame,movement.length-1),w=result.trace.weights,names={stem:'stem',query:'query_down',content:'kv_down',queryContent:'query_content',queryRotary:'query_rotary',rotaryKey:'rotary_key',output:'output',expand:'feedforward.0',contract:'feedforward.2',task:'forecast'},map=w[`${names[stage]}.weight`],selected=Math.min(row,map.length-1);
  return <FlowLab id="mla-current-map-row" label="Inspect every coefficient of any actual learned input/output row, without replacing the edited case">
    <NeuralTable caption={`${stages.find(([key])=>key===stage)[1]}: complete output row ${selected}`} headers={['Input column','Actual learned coefficient']} rows={map[selected].map((v,i)=>[i,number(v,9)])}/>
    <FlowControls><MlaSelection name="Actual learned map" value={stage} onChange={setStage} options={stages}/><MlaSelection name="Output row" value={selected} onChange={value=>setRow(Number(value))} options={indices(map.length,'Row')}/></FlowControls>
    <FlowReadout>This view exposes every coefficient omitted from the preceding map cutaways. It does not edit fitted weights; your current observed frame is {t}.</FlowReadout>
  </FlowLab>;
}
export function MlaModelResidual({second=false}){const {movement}=useCases(),{result}=useMlaModel();if(!result)return null;const t=Math.min(movement.frame,movement.length-1),trace=result.trace;return <MlaResidualDrawing name={second?'Second residual':'Attention residual'} saved={second?trace.attentionResidual[t]:trace.stem[t]} branch={second?trace.feedforwardWritten[t]:trace.writtenAttention[t]} output={second?trace.feedforwardResidual[t]:trace.attentionResidual[t]}/>;}
export function MlaModelNonlinear(){const {movement}=useCases(),{result}=useMlaModel();if(!result)return null;const trace=result.trace,t=Math.min(movement.frame,movement.length-1);return <MlaDrawing label="Actual pointwise GELU applies separately to every FFN coordinate; final LayerNorm and task map remain later operations" width={800} height={225}>
  <MlaCells x={20} y={62} values={trace.feedforwardExpanded[t].slice(0,6)} width={120} label="FFN expansion: first 6 of 48 actual pre-activation coordinates" digits={6}/><MlaArrow x1={380} y1={100} x2={380} y2={169}/><MlaCells x={20} y={169} values={trace.feedforwardActivated[t].slice(0,6)} width={120} label="GELU applied to the same six coordinates" digits={6}/>
  </MlaDrawing>;}
export function MlaTaskBacktransform(){const {movement}=useCases(),{result}=useMlaModel();if(!result)return null;const trace=result.trace,t=Math.min(movement.frame,movement.length-1);return <MlaDrawing label="Actual final task-map output is converted from scaled coordinates to the original coordinate units using (u+1)/2; no clipping is applied" width={400} height={255}>
  <MlaCells x={80} y={62} values={trace.taskScaled[t]} width={120} label="Task map's two scaled outputs" digits={6}/><MlaArrow x1={200} y1={100} x2={200} y2={188}/><MlaText x={200} y={153}>For each coordinate: (u+1)/2</MlaText><MlaCells x={80} y={188} values={trace.taskOutput[t]} width={120} label="Forecast in original coordinate units" digits={6}/>
  </MlaDrawing>;}
export function MlaProgram({file,newCache=false}){return <RemoteCodeBlock source={`/${newCache?'learn-code':'learn-assets'}/multi-head-latent-attention-mla/${file}`} filename={file} language="python" title={`Complete ${file}`}/>;}

export function MlaMergeLab(){
  const {manual}=useCases(),[head,setHead]=useState(0),[split,setSplit]=useState(1),read=latentCaseRead(manual),actualSplit=Math.min(split,manual.latent.length-1),
    merged=read.defined?latentBlockMerge(read.heads[head].logits,read.latent,read.legal,actualSplit):null;
  return <FlowLab id="mla-block-merge" label="Two history blocks merge the same current positioned hand case">
    <MlaBlockMergeDrawing state={manual} read={read} head={head} split={actualSplit}/>
    <FlowControls><MlaSelection name="Read head" value={head} onChange={value=>setHead(Number(value))} options={indices(2,'Head')}/><FlowSlider name="Records in the first block" value={actualSplit} min={1} max={manual.latent.length-1} step={1} onChange={setSplit}/></FlowControls>
    <FlowReadout>{merged?`The merged latent ${mlaVector(merged.output,6)} differs from the single full-history read by ${difference(merged.output,read.heads[head].mixture).toExponential(3)}. It uses your edited records, IDs, queries and maps; an empty legal block contributes zero mass.`:read.reason}</FlowReadout>
  </FlowLab>;
}

export function MlaModelNormalization({stage='attention'}){
  const {movement}=useCases(),{result}=useMlaModel();if(!result)return null;
  const trace=result.trace,t=Math.min(movement.frame,movement.length-1),rms=stage==='content'||stage==='query',
    name=rms?stage==='content'?'KV latent RMSNorm':'Query latent RMSNorm':stage==='attention'?'Before attention LayerNorm':stage==='feedforward'?'Before FFN LayerNorm':'Final LayerNorm',
    prefix=stage==='attention'?'norm_attention':stage==='feedforward'?'norm_feedforward':'norm_final',
    raw=rms?(stage==='content'?trace.latentNorm:trace.queryNorm).raw[t]:stage==='attention'?trace.stem[t]:stage==='feedforward'?trace.attentionResidual[t]:trace.feedforwardResidual[t],
    gains=rms?(stage==='content'?trace.latentNorm:trace.queryNorm).gains:trace.weights[`${prefix}.weight`],offset=rms?null:trace.weights[`${prefix}.bias`],
    mean=rms?0:raw.reduce((sum,v)=>sum+v,0)/raw.length,centered=raw.map(v=>v-mean),squares=centered.map(v=>v*v),statistic=squares.reduce((sum,v)=>sum+v,0)/raw.length,epsilon=rms?1e-6:1e-5,divisor=Math.sqrt(statistic+epsilon),unit=centered.map(v=>v/divisor),output=unit.map((v,i)=>v*gains[i]+(offset?.[i]??0)),cut=row=>row.slice(0,4);
  return <MlaDrawing label={`${name} for the actual selected frame ${t}: four displayed coordinates use statistics over all ${raw.length} coordinates, with the real learned gains and ${rms?'no offsets':'offsets'}`} width={560} height={980}>
    <MlaCells x={20} y={62} values={cut(raw)} width={120} label={`${name}: first four of ${raw.length} raw coordinates`} digits={6}/>
    <MlaArrow x1={260} y1={100} x2={260} y2={195}/><MlaText x={260} y={152}>{rms?'No mean subtraction':`Subtract full-row mean ${number(mean,6)}`}</MlaText>
    <MlaCells x={20} y={195} values={cut(centered)} width={120} label={rms?'Raw coordinates retained':'Centered coordinates'} digits={6}/>
    <MlaArrow x1={260} y1={233} x2={260} y2={329}/><MlaText x={260} y={287}>Square every coordinate, then average all {raw.length}.</MlaText>
    <MlaCells x={20} y={329} values={cut(squares)} width={120} label="First four squared contributions" digits={6}/>
    <MlaText x={280} y={412}>Full-row mean square {number(statistic,6)} + ε {epsilon}.</MlaText>
    <MlaArrow path="M260 367 V390 H95 V442"/><MlaCells x={20} y={442} values={[divisor]} width={150} digits={6}/><MlaText x={195} y={466} anchor="start">Divisor = √(mean square + ε)</MlaText>
    <MlaArrow path="M500 214 H550 V496 H278"/><MlaArrow path="M95 480 V496 H242"/><MlaJunction x={260} y={496} symbol="÷"/>
    <MlaArrow x1={260} y1={514} x2={260} y2={553}/><MlaCells x={20} y={553} values={cut(unit)} width={120} label="Divide each original/centered coordinate by that divisor" digits={6}/>
    <MlaCells x={20} y={650} values={cut(gains)} width={120} role="parameter" label="Learned gains for these four coordinates" digits={6}/>
    {offset&&<MlaCells x={20} y={740} values={cut(offset)} width={120} role="parameter" label="Learned offsets for these four coordinates" digits={6}/>}
    <MlaArrow path="M500 572 H535 V800 H278"/><MlaArrow path="M20 669 H5 V800 H242"/><MlaJunction x={260} y={800} symbol="×"/>
    {offset?<><MlaArrow x1={260} y1={818} x2={260} y2={852}/><MlaArrow path="M500 759 H520 V870 H278"/><MlaJunction x={260} y={870} symbol="+"/><MlaArrow x1={260} y1={888} x2={260} y2={923}/></>:<MlaArrow x1={260} y1={818} x2={260} y2={923}/>}
    <MlaCells x={20} y={923} values={cut(output)} width={120} label={rms?'Unit-scaled coordinate × learned gain':'Unit-scaled coordinate × learned gain + offset'} digits={6}/>
  </MlaDrawing>;
}
