import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber } from './LessonFlow.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import useLessonViewport from './useLessonViewport.js';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { MoeRouterDrawing, MoeMixtureDrawing, MoeCells, MoeScene, MoeMatrix, MoeWire, MoeOperation, MoeText, MoeScroll } from './MoeFlowFigures.jsx';
import { MoeCapacityDrawing, MoeBalanceDrawing, MoeGradientDrawing, MoeChoiceDrawing, MoeBiasDrawing, MoeStoredActiveDrawing } from './MoeFlowSystemsFigures.jsx';
import { MoeBalanceInputs, MoePartitionDrawing, MoeNoiseDrawing, MoeAffineDrawing } from './MoeMechanismFigures.jsx';
import { MoeNormalizationDrawing, MoeAffineNormCoordinate, MoePixelPatchDrawing, MoeModelCircuit, MoeMeanDrawing, MoeExpertPathDrawing, MoeAttentionReturnDrawing } from './MoeFlowModelFigures.jsx';
import { routingDefaults, capacityDefaults, balanceDefaults, budgetDefaults, routingPair, allocationPair, objectiveScopes, changedAt, modelTrace } from '../../data/moe-reading-traces.js';
import { costs } from '../../data/moe-models.js';
import { MoeScopeDrawing, MoeWidthDrawing, MoeParallelDrawing } from './MoeFlowObjectiveFigures.jsx';
import examples from '../../data/moe-examples.json';

const TOPIC='mixture-of-experts-transformers-moe', n=flowNumber;
const CaseContext=createContext(null);
const options=count=>Array.from({length:count},(_,i)=>[i,String(i)]);
const vec=values=>`[${values.map(x=>n(x)).join(', ')}]`;
let successfulWeights=null;
export function MoeFlowProvider({children}) {
  const [routing,setRouting]=useState(routingDefaults),[capacity,setCapacity]=useState(capacityDefaults);
  const [objective,setObjective]=useState(balanceDefaults),[budget,setBudget]=useState(budgetDefaults);
  const zero=examples.examples.find(x=>x.label===0);
  const [image,setImage]=useState(()=>({label:0,pixels:zero.pixels.slice(),pixel:35,patch:0,coordinate:0,head:0,temperature:1,disabled:null}));
  const [weights,setWeights]=useState(()=>successfulWeights),[error,setError]=useState(false),[attempt,setAttempt]=useState(0),[load,setLoad]=useState(false),[epoch,setEpoch]=useState(0);
  useEffect(()=>{
    if(!load||successfulWeights)return undefined;
    const controller=new AbortController();setError(false);
    fetch(`/learn-assets/${TOPIC}/moe-001-17.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('resource');return r.json();})
      .then(data=>{if(!controller.signal.aborted){successfulWeights=data;setWeights(data);}}).catch(e=>{if(e.name!=='AbortError')setError(true);});
    return()=>controller.abort();
  },[load,attempt]);
  const current=useMemo(()=>weights?modelTrace(weights,image.pixels,image):null,[weights,image]);
  const source=examples.examples.find(x=>x.label===image.label);
  const baseline=useMemo(()=>weights?modelTrace(weights,source.pixels):null,[weights,source]);
  const reset=family=>{
    if(family==='routing')setRouting(routingDefaults());
    if(family==='capacity')setCapacity(capacityDefaults());
    if(family==='objective')setObjective(balanceDefaults());
    if(family==='budget')setBudget(budgetDefaults());
    if(family==='image')setImage({label:image.label,pixels:source.pixels.slice(),pixel:35,patch:0,coordinate:0,head:0,temperature:1,disabled:null});
    setEpoch(x=>x+1);
  };
  return <CaseContext.Provider value={{routing,setRouting,capacity,setCapacity,objective,setObjective,budget,setBudget,image,setImage,
    weights,current,baseline,error,load,setLoad,retry:()=>setAttempt(x=>x+1),reset,epoch}}>{children}</CaseContext.Provider>;
}

export function MoeFlowNumber({name,value,onChange,min,max,integer=false}) {
  const {epoch}=useContext(CaseContext),id=useId(),[draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value,epoch]);
  const numeric=Number(draft),valid=draft.trim()!==''&&Number.isFinite(numeric)&&numeric>=min&&numeric<=max&&(!integer||Number.isInteger(numeric));
  return <label className="moe-flow-field"><span>{name}</span><input aria-label={name} aria-invalid={!valid} aria-describedby={!valid?`${id}-error`:undefined}
    type="number" min={min} max={max} step={integer?1:'any'} value={draft} onChange={e=>{const text=e.target.value,v=Number(text);setDraft(text);
      if(text.trim()!==''&&Number.isFinite(v)&&v>=min&&v<=max&&(!integer||Number.isInteger(v)))onChange(v);}}/>
    {!valid&&<span className="moe-flow-error" id={`${id}-error`}>Enter {integer?'an integer':'a finite number'} from {min} to {max}; the last valid case remains active.</span>}</label>;
}
export function MoeFlowSelect({name,value,onChange,options:choices}) {
  return <label className="moe-flow-field"><span>{name}</span><select aria-label={name} value={value} onChange={e=>onChange(e.target.value)}>
    {choices.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>;
}
const Reset=({family})=>{const {reset}=useContext(CaseContext);return <FlowControls><button type="button" onClick={()=>reset(family)}>Reset {family} case and invalid drafts</button></FlowControls>;};

function PairResult({pair}) {
  return <FlowReadout>Selected IDs {vec(pair.selected.selected)}. Selected-normalized output {vec(pair.selected.output)}; retained-full-probability output {vec(pair.full.output)}.
    {' '}Selected full mass {n(pair.full.weights.reduce((a,b)=>a+b,0))}; margin {pair.selected.margin===null?'all experts selected':n(pair.selected.margin)}.</FlowReadout>;
}
export function MoeRoutingQuestion({kind='score'}) {
  const {routing:s,setRouting:set,reset}=useContext(CaseContext),pair=routingPair(s),update=(key,value)=>set({...s,[key]:value});
  const expert=<MoeFlowSelect name="Expert to edit" value={s.expert} onChange={v=>update('expert',+v)} options={options(s.scores.length)}/>;
  const resize=value=>{
    if(value<s.k)return; // Visible invalid number rule rejects an illegal shrink rather than silently changing k.
    set({...s,scores:Array.from({length:value},(_,i)=>s.scores[i]??0),outputs:Array.from({length:value},(_,i)=>s.outputs[i]??[i-2,2-i]),expert:Math.min(s.expert,value-1)});
  };
  return <FlowLab id={`moe-flow-routing-${kind}`} label={`Routing question: ${kind}`}>
    {kind==='gradient'?<MoeGradientDrawing scores={pair.scores} outputs={s.outputs} k={s.k} direction={pair.direction}/>:
      kind==='values'?<><MoeMixtureDrawing scores={pair.scores} outputs={s.outputs} k={s.k} returnedRole="input"/><MoeMixtureDrawing scores={pair.scores} outputs={s.outputs} k={s.k} full returnedRole="input"/></>:
      <MoeRouterDrawing scores={pair.scores} k={s.k}/>}
    <FlowControls>
      {kind==='score'&&<>{expert}<MoeFlowNumber name={`Expert ${s.expert} logit`} value={s.scores[s.expert]} min={-6} max={6} onChange={v=>update('scores',changedAt(s.scores,s.expert,v))}/></>}
      {kind==='values'&&<>{expert}{[0,1].map(j=><MoeFlowNumber key={j} name={`Expert ${s.expert} returned coordinate ${j}`} value={s.outputs[s.expert][j]} min={-8} max={8} onChange={v=>update('outputs',changedAt(s.outputs,s.expert,changedAt(s.outputs[s.expert],j,v)))}/>)}</>}
      {kind==='units'&&<>{expert}<MoeFlowSelect name="Score representation" value={s.units} onChange={v=>update('units',v)} options={[['logit','Logit h'],['mass','Positive exp(h) mass']]}/>
        <MoeFlowNumber name={`Expert ${s.expert} ${s.units}`} value={s.units==='logit'?s.scores[s.expert]:Math.exp(s.scores[s.expert])} min={s.units==='logit'?-6:Math.exp(-6)} max={s.units==='logit'?6:Math.exp(6)} onChange={v=>update('scores',changedAt(s.scores,s.expert,s.units==='logit'?v:Math.log(v)))}/></>}
      {kind==='offset'&&<FlowSlider name="Common logit offset" value={s.offset} min={-6} max={6} step={.1} onChange={v=>update('offset',v)}/>}
      {kind==='structure'&&<><MoeFlowNumber name="Stored experts E (at least k)" value={s.scores.length} min={Math.max(2,s.k)} max={6} integer onChange={resize}/><MoeFlowNumber name="Selected branches k" value={s.k} min={1} max={s.scores.length} integer onChange={v=>update('k',v)}/></>}
      {kind==='gradient'&&<MoeFlowSelect name="Loss direction r" value={s.direction} onChange={v=>update('direction',+v)} options={[[0,'Output coordinate 0'],[1,'Output coordinate 1'],[2,'Sum of both coordinates']]}/>}
    </FlowControls>
    <PairResult pair={pair}/>
    {kind==='gradient'&&<><MoeGradientDrawing scores={pair.scores} outputs={s.outputs} k={s.k} direction={pair.direction} full/>
      <NeuralTable caption="Same state, every local score derivative" headers={['Expert','Selected-normalized ∂J/∂h','Retained-full ∂J/∂h']} rows={s.scores.map((_,i)=>[i,n(pair.selected.gradient[i]),n(pair.full.gradient[i])])}/></>}
    {kind==='structure'&&<FlowReadout>Expansion preserves old rows and introduces the named new IDs with logit zero and supplied vector [i−2,2−i]. Set k first before shrinking below its current value.</FlowReadout>}
    {kind==='score'&&<><FlowControls><button onClick={()=>update('pinned',JSON.parse(JSON.stringify({scores:s.scores,outputs:s.outputs,k:s.k,output:pair.selected.output})))}>Pin this complete routing case</button>
      <button onClick={()=>reset('routing')}>Reset routing case and invalid drafts</button></FlowControls>
      {s.pinned&&<FlowReadout>Pinned selected output {vec(s.pinned.output)}; current minus pinned {vec(pair.selected.output.map((v,j)=>v-s.pinned.output[j]))}. The pin retains all scores, returned vectors and k.</FlowReadout>}</>}
  </FlowLab>;
}

export function MoeCapacityQuestion({kind='routes'}) {
  const {capacity:s,setCapacity:set}=useContext(CaseContext),both=allocationPair(s),result=both.capped,update=(key,value)=>set({...s,[key]:value});
  const token=<MoeFlowSelect name="Token to inspect" value={s.token} onChange={v=>update('token',+v)} options={options(5)}/>;
  const orderIndex=s.order.indexOf(s.token),move=delta=>{const a=s.order.slice(),j=orderIndex+delta;[a[orderIndex],a[j]]=[a[j],a[orderIndex]];update('order',a);};
  return <FlowLab id={`moe-flow-capacity-${kind}`} label={`Allocation question: ${kind}`}>
    <MoeCapacityDrawing caseState={s} result={result}/><FlowControls>
      {kind==='routes'&&<>{token}{[0,1].map(slot=><MoeFlowSelect key={slot} name={`Selected expert in slot ${slot}`} value={s.routes[s.token][slot]} options={options(4).filter(([e])=>e!==s.routes[s.token][1-slot])}
        onChange={v=>update('routes',changedAt(s.routes,s.token,changedAt(s.routes[s.token],slot,+v)))}/>)}</>}
      {kind==='gates'&&<>{token}<FlowSlider name="Slot 0 gate (slot 1 is 1 − gate)" value={s.gates[s.token][0]} min={0} max={1} step={.05} onChange={v=>update('gates',changedAt(s.gates,s.token,[v,1-v]))}/></>}
      {kind==='values'&&<><MoeFlowSelect name="Expert returned scalar to edit" value={s.expert} onChange={v=>update('expert',+v)} options={options(4)}/><MoeFlowNumber name="Supplied expert scalar" value={s.values[s.expert]} min={-8} max={8} onChange={v=>update('values',changedAt(s.values,s.expert,v))}/></>}
      {kind==='capacity'&&<MoeFlowNumber name="Capacity per expert" value={s.capacity} min={1} max={6} integer onChange={v=>update('capacity',v)}/>}
      {kind==='priority'&&<>{token}<button disabled={orderIndex===0} onClick={()=>move(-1)}>Move inspected token earlier</button><button disabled={orderIndex===4} onClick={()=>move(1)}>Move inspected token later</button></>}
      {kind==='policy'&&<MoeFlowSelect name="Surviving-gate policy" value={s.renormalize?'renormalize':'retain'} onChange={v=>update('renormalize',v==='renormalize')} options={[['retain','Keep original slot gates'],['renormalize','Divide by positive surviving mass']]}/>}
    </FlowControls>
    <FlowReadout>{result.retained.length} of 10 assignments retained; {result.dropped.length} dropped. Fully dropped token IDs {result.fullyDropped.join(', ')||'none'}.
      {' '}Capped outputs {vec(result.output)}; the same-state dropless outputs {vec(both.dropless.output)}. Requested IDs do not change when capacity changes.</FlowReadout>
    {kind==='policy'&&<NeuralTable caption="Every original return address and the dropless comparison" headers={['Token','Selected experts','Surviving mass','Capped sum','Dropless sum']} rows={s.routes.map((ids,t)=>[t,vec(ids),n(result.mass[t]),n(result.output[t]),n(both.dropless.output[t])])}/>}
    {kind==='routes'&&<Reset family="capacity"/>}
  </FlowLab>;
}

export function MoeObjectiveQuestion({kind='rows'}) {
  const {objective:s,setObjective:set}=useContext(CaseContext),scope=objectiveScopes(s),b=scope.global,update=(key,value)=>set({...s,[key]:value});
  return <FlowLab id={`moe-flow-objective-${kind}`} label={`Objective question: ${kind}`}>
    {kind==='scale'?<MoePartitionDrawing row={s.scores[s.row]} offset={s.offset}/>:kind==='rows'?<MoeBalanceInputs scores={s.scores.map(row=>row.map(x=>x+s.offset))} k={s.k}/>:kind==='scope'?<MoeScopeDrawing caseState={s}/>:<MoeBalanceDrawing result={b}/>}
    <FlowControls>{kind==='rows'&&<><MoeFlowSelect name="Probability row" value={s.row} options={options(4)} onChange={v=>update('row',+v)}/><MoeFlowSelect name="Expert logit column" value={s.expert} options={options(3)} onChange={v=>update('expert',+v)}/>
      <MoeFlowNumber name={`Row ${s.row}, expert ${s.expert} base logit`} value={s.scores[s.row][s.expert]} min={-8} max={8} onChange={v=>update('scores',changedAt(s.scores,s.row,changedAt(s.scores[s.row],s.expert,v)))}/></>}
      {kind==='selection'&&<MoeFlowNumber name="Selected count k for objective" value={s.k} min={1} max={2} integer onChange={v=>update('k',v)}/>}
      {kind==='scale'&&<FlowSlider name="Shared absolute logit offset" value={s.offset} min={-6} max={6} step={.1} onChange={v=>update('offset',v)}/>}
    </FlowControls>
    <FlowReadout>Current global balance {n(b.value)}; mean z-loss {n(b.zLoss)}. The probabilities and selected IDs survive a common offset.</FlowReadout>
    {kind==='scope'&&<NeuralTable caption="Identical edited rows, three explicitly enclosed reduction scopes" headers={['Rows reduced together','Balance values','Group-size-weighted mean']} rows={[
      ['[0,1,2,3]',n(b.value),n(b.value)],['[0,1] and [2,3]',vec(scope.pairs.map(x=>x.value)),n(scope.pairMean)],['[0], [1], [2], [3]',vec(scope.singles.map(x=>x.value)),n(scope.rowMean)]]}/>}
    {kind==='rows'&&<Reset family="objective"/>}
  </FlowLab>;
}
export function MoeNoiseQuestion() {
  const [clean,setClean]=useState(0),[sigma,setSigma]=useState(.5);
  return <FlowLab id="moe-flow-noise" label="Conditional selection probability"><MoeNoiseDrawing clean={clean} sigma={sigma}/><FlowControls>
    <FlowSlider name="Clean score h" value={clean} min={-2} max={2} step={.05} onChange={setClean}/><FlowSlider name="Positive noise scale σ" value={sigma} min={.1} max={2} step={.05} onChange={setSigma}/>
  </FlowControls><FlowReadout>The threshold of the other fixed scores stays .5. This probability holds their scores fixed; a new stochastic sample is a different object.</FlowReadout></FlowLab>;
}

export function MoeBudgetQuestion({kind='widths'}) {
  const {budget:s,setBudget:set}=useContext(CaseContext),c=costs(s),fine=costs({...s,n:s.n*2,m:s.m/2,k:s.k*2});
  const change=(key,v)=>set({...s,[key]:v});
  return <FlowLab id={`moe-flow-budget-${kind}`} label={`Resource question: ${kind}`}>{kind==='widths'?<MoeWidthDrawing budget={s}/>:<MoeStoredActiveDrawing budget={s}/>}<FlowControls>
    {(kind==='widths'?[['d','Feature width d',8,4096],['m','Expert hidden width m',8,4096]]:kind==='branches'?[['n','Stored routed experts E',Math.max(2,s.k),256],['k','Selected experts k',1,s.n]]:kind==='shared'?[['shared','Always-active shared experts',0,4]]:[['tokens','Flattened token assignments source T',1,4096]]).map(([key,name,min,max])=><MoeFlowNumber key={key} name={name} value={s[key]} min={min} max={max} integer onChange={v=>change(key,v)}/>)}
    {kind==='traffic'&&<><MoeFlowSelect name="Bytes per component" value={s.bytes} options={[1,2,4,8].map(x=>[x,`${x} bytes`])} onChange={v=>change('bytes',+v)}/><FlowSlider name="Remote assignment fraction" value={s.remote} min={0} max={1} step={.05} onChange={v=>change('remote',v)}/></>}
  </FlowControls><FlowReadout>Stored expert matrices {c.stored.toLocaleString()} parameters; active expert matrices {c.active.toLocaleString()} MACs/token; router {c.router.toLocaleString()} parameters/MACs/token.
    {' '}Weight bytes {c.weightBytes.toLocaleString()}; assignments {c.assignments}; forward remote input+return payload {c.payload.toLocaleString()} bytes.</FlowReadout>
    {kind==='traffic'&&<NeuralTable caption="One live accounting table; fine alternative doubles E/k and halves m" headers={['Scope / quantity','Current','Fine alternative']} rows={Object.entries(c).map(([key,value])=>[key,value,fine[key]])}/>}
    {kind==='widths'&&<Reset family="budget"/>}</FlowLab>;
}

export function MoeChoiceQuestion() {
  const [k,setK]=useState(1),[capacity,setCapacity]=useState(1);
  return <FlowLab id="moe-flow-choice" label="Row versus column choice"><MoeChoiceDrawing k={k} capacity={capacity}/><FlowControls>
    <MoeFlowNumber name="Expert choices per token row" value={k} min={1} max={3} integer onChange={setK}/><MoeFlowNumber name="Token choices per expert column" value={capacity} min={1} max={4} integer onChange={setCapacity}/>
  </FlowControls><FlowReadout>These are two allocations of the same fixed four-by-three matrix, not two settings of one normalization.</FlowReadout></FlowLab>;
}
export function MoeBiasQuestion() {
  const [target,setTarget]=useState(2),[amount,setAmount]=useState(.3);
  return <FlowLab id="moe-flow-bias" label="Selection bias versus gate weights"><MoeBiasDrawing target={target} amount={amount}/><FlowControls>
    <MoeFlowSelect name="Expert selection bias to edit" value={target} options={options(4)} onChange={v=>setTarget(+v)}/><FlowSlider name="Selection bias amount" value={amount} min={-.5} max={.5} step={.05} onChange={setAmount}/>
  </FlowControls><FlowReadout>Affinity [.8,.7,.6,.1] is unchanged; the bias chooses IDs before the selected original-affinity division.</FlowReadout></FlowLab>;
}

function MoeImageReturn({s,r}) {
  return <MoeScene width={740} height={490} title="Actual selected expert outputs multiply their own gates and meet at the same return address" description={`Patch ${s.patch}, coordinate ${s.coordinate}: selected IDs remain visible; disabled outputs contribute zero with their original gates. The complete weighted sum is the expert update.`}>
    {r.selected[s.patch].map((expert,slot)=>{const y=70+slot*160,v=expert===s.disabled?0:r.expertOutputs[s.patch][expert][s.coordinate],g=r.weights[s.patch][slot];return <g key={expert}>
      <MoeCells x={18} y={y} values={[v]} width={110} label={`E${expert}${expert===s.disabled?' disabled':' executed output'}`}/><MoeCells x={220} y={y} values={[g]} width={110} label="actual gate"/>
      <MoeWire path={`M125 ${y+18}H145V${y+80}H370V${y+18}`}/><MoeWire path={`M330 ${y+18}H350V${y+50}H390V${y+38}`}/><MoeOperation x={390} y={y+18} symbol="×"/>
      <MoeWire path={`M410 ${y+18}H470`}/><MoeCells x={470} y={y} values={[v*g]} width={110} label="coordinate product"/><MoeWire path={`M580 ${y+18}H650V398H410`}/>
    </g>;})}<MoeOperation x={390} y={398} symbol="Σ"/><MoeWire path="M370 398H248"/><MoeCells x={138} y={380} values={[r.combined[s.patch][s.coordinate]]} width={110} label="complete MoE update"/>
    <MoeText x={18} y={462}>The original residual row is added after this expert update.</MoeText>
  </MoeScene>;
}
export function MoeImageQuestion({kind='image'}) {
  const context=useContext(CaseContext),{image:s,setImage:set,current:t,baseline:b,error,retry,weights,setLoad}=context;
  const [viewport,ready]=useLessonViewport();
  useEffect(()=>{if(ready&&kind==='image')setLoad(true);},[ready,kind,setLoad]);
  const update=(key,v)=>set({...s,[key]:v});
  const choose=label=>{const source=examples.examples.find(x=>x.label===label);set({...s,label,pixels:source.pixels.slice()});};
  const r=t?.reference;
  const normalization=r?kind==='attention-norm'?t.attentionNorm[s.patch]:kind==='final-norm'?t.finalNorm[s.patch]:t.expertNorm[s.patch]:null;
  return <FlowLab id={`moe-flow-image-${kind}`} label={`Actual retained model: ${kind}`}><div ref={viewport} data-lesson-teaching="">
    {kind==='image'&&<><p className="moe-flow-scroll-hint">Focus the image region and pan sideways when needed; every pixel is a button with its raw count.</p><div className="moe-flow-pixel-scroll" tabIndex={0} role="region" aria-label="Editable eight-by-eight image"><div className="moe-flow-pixels" role="group" aria-label="All 64 raw integer image counts">
      {s.pixels.map((value,i)=><button key={i} type="button" aria-label={`Pixel ${Math.floor(i/8)},${i%8}: ${Math.round(value*16)}`} aria-pressed={s.pixel===i}
        style={{backgroundColor:`rgb(${Math.round(value*255)} ${Math.round(value*255)} ${Math.round(value*255)})`}}
        onClick={()=>set({...s,pixel:i,patch:Math.floor(Math.floor(i/8)/2)*4+Math.floor(i%8/2)})}>{Math.round(value*16)}</button>)}</div></div>
      <FlowControls><MoeFlowSelect name="Observed UCI validation record" value={s.label} options={examples.examples.map(x=>[x.label,`Digit ${x.label}, original row ${x.source_id}`])} onChange={v=>choose(+v)}/>
      <MoeFlowNumber name={`Pixel ${Math.floor(s.pixel/8)},${s.pixel%8} raw count`} value={Math.round(s.pixels[s.pixel]*16)} min={0} max={16} integer onChange={v=>update('pixels',changedAt(s.pixels,s.pixel,v/16))}/></FlowControls>
      <FlowControls><button onClick={()=>context.reset('image')}>Restore this source and all inspection controls</button></FlowControls>
      {!weights&&(error?<><p role="alert">The retained model could not be loaded. Your current image edits remain available.</p><FlowControls><button onClick={retry}>Retry retained model</button></FlowControls></>:<p role="status">The fixed model loads when this image question enters the reading viewport.</p>)}</>}
    {r&&kind!=='image'&&<>
      {kind==='manipulation'&&<><MoePixelPatchDrawing pixels={s.pixels} patch={0}/><FlowControls><button onClick={()=>update('pixels',s.pixels.map((v,i)=>i>=32?0:v))}>Zero lower four rows</button><button onClick={()=>update('pixels',s.pixels.map((v,i)=>[0,1,8,9].includes(i)?0:v))}>Zero upper-left patch</button><button onClick={()=>context.reset('image')}>Restore this source and all inspection controls</button></FlowControls></>}
      {kind==='patches'&&<MoePixelPatchDrawing pixels={s.pixels} patch={s.patch}/>}
      {kind==='model'&&<MoeModelCircuit trace={t} patch={s.patch} label={s.label}/>}
      {['norm','attention-norm','final-norm'].includes(kind)&&<><MoeNormalizationDrawing trace={normalization}/><MoeAffineNormCoordinate trace={normalization} coordinate={s.coordinate}/>
        <NeuralTable caption="Every actual coordinate of the normalization affine step" headers={['Coordinate','Input','Standardized','Learned gain','Learned offset','Output']} rows={normalization.input.map((v,i)=>[i,n(v),n(normalization.standardized[i]),n(normalization.gain[i]),n(normalization.offset[i]),n(normalization.output[i])])}/></>}
      {kind==='expert'&&<>{r.selected[s.patch].map(expert=>s.disabled===expert?<p key={expert}>E{expert} is disabled: no expert network output is fabricated.</p>:<MoeExpertPathDrawing key={expert} trace={t.expertPaths[s.patch][expert]} coordinate={s.coordinate}/>)}</>}
      {kind==='pool'&&<MoeMeanDrawing trace={t}/>}
      {['patches','model','norm','attention-norm','final-norm','expert'].includes(kind)&&<FlowControls><MoeFlowNumber name="Actual patch whose representation to inspect" value={s.patch} min={0} max={15} integer onChange={v=>update('patch',v)}/>
        {['norm','attention-norm','final-norm','expert'].includes(kind)&&<MoeFlowNumber name="Actual vector coordinate to inspect" value={s.coordinate} min={0} max={15} integer onChange={v=>update('coordinate',v)}/>}</FlowControls>}
      {kind==='temperature'&&<><MoeRouterDrawing scores={r.scores[s.patch]} k={2}/><MoeImageReturn s={s} r={r}/><FlowControls><FlowSlider name="Router temperature" value={s.temperature} min={.5} max={3} step={.1} onChange={v=>update('temperature',v)}/><MoeFlowNumber name="Temperature mixture patch" value={s.patch} min={0} max={15} integer onChange={v=>update('patch',v)}/></FlowControls></>}
      {kind==='disabled'&&<><MoeImageReturn s={s} r={r}/><FlowControls><MoeFlowSelect name="Expert contribution to disable" value={s.disabled??'none'} options={[['none','None'],...options(4)]} onChange={v=>update('disabled',v==='none'?null:+v)}/><MoeFlowNumber name="Disabled mixture patch" value={s.patch} min={0} max={15} integer onChange={v=>update('patch',v)}/></FlowControls></>}
      {kind==='attention'&&<><MoeScene width={780} height={520} title="One actual attention receiver reads all sixteen donor values" description="All sixteen attention weights and all eight coordinates of the selected head's current context are retained in the table. The full weighted sum is computed before the output projection.">
        <MoeCells x={18} y={45} values={t.queries[s.head][s.patch]} width={92} label={`actual query patch ${s.patch}, head ${s.head}`}/>
        <MoeCells x={18} y={145} values={t.attentionScores[s.head][s.patch]} columns={8} width={92} label="all sixteen scaled dot scores"/>
        <MoeWire path="M380 221V260"/><MoeOperation x={380} y={290} radius={30} symbol="p"/><MoeText x={430} y={296}>full exp / shared sum</MoeText>
        <MoeWire path="M380 320V360"/><MoeCells x={18} y={360} values={r.attention[s.head][s.patch]} columns={8} width={92} label="computed donor probabilities"/>
        <MoeText x={18} y={485}>Values remain a separate input to the sixteen weighted writes below.</MoeText>
      </MoeScene><FlowControls><MoeFlowNumber name="Receiving patch" value={s.patch} min={0} max={15} integer onChange={v=>update('patch',v)}/><MoeFlowSelect name="Attention head" value={s.head} options={options(2)} onChange={v=>update('head',+v)}/></FlowControls>
      <NeuralTable caption="All actual attention donor vectors and their weighted writes" headers={['Donor','Weight','Unweighted 8-value vector','Weighted 8-value write']} rows={t.values[s.head].map((value,donor)=>[donor,n(r.attention[s.head][s.patch][donor]),vec(value),vec(value.map(x=>x*r.attention[s.head][s.patch][donor]))])}/>
      <FlowReadout>Complete head context {vec(t.contexts[s.patch].slice(s.head*8,s.head*8+8))}; it includes every donor.</FlowReadout>
      <MoeAttentionReturnDrawing trace={t} patch={s.patch} head={s.head}/></>}
      {kind==='trace'&&<><MoeImageReturn s={s} r={r}/><FlowControls><MoeFlowNumber name="Patch path to inspect" value={s.patch} min={0} max={15} integer onChange={v=>update('patch',v)}/><MoeFlowNumber name="Expert vector coordinate" value={s.coordinate} min={0} max={15} integer onChange={v=>update('coordinate',v)}/></FlowControls>
      <NeuralTable caption="All sixteen coordinates at the selected return address" headers={['Coordinate','Expert input','First weighted return','Second weighted return','Full sum']} rows={r.expertInputs[s.patch].map((v,i)=>[i,n(v),...r.selected[s.patch].map((e,slot)=>e===s.disabled?'disabled: zero':n(r.expertOutputs[s.patch][e][i]*r.weights[s.patch][slot])),n(r.combined[s.patch][i])])}/></>}
      {kind==='projection'&&<><MoeAffineDrawing trace={t.projection[s.patch]} row={s.coordinate} title="The actual biased patch projection"/>
        <MoeScene width={860} height={380} title="The patch projection and its separate learned position add coordinate by coordinate"
          description="The projected image features and the learned position row are distinct operands. All sixteen pairs add to the positioned row that reaches attention normalization. Selecting a patch changes both its source pixels and its position identity.">
          <MoeCells x={18} y={55} values={t.projection[s.patch].output} columns={8} width={100} label="complete projected row"/>
          <MoeCells x={18} y={165} values={weights.position[s.patch]} columns={8} width={100} role="parameter" label="separate learned position row"/>
          <MoeWire path="M415 131H840V259H480"/><MoeWire path="M415 241V259H440"/><MoeOperation x={460} y={259} symbol="+"/>
          <MoeWire path="M460 279V301"/><MoeCells x={18} y={301} values={t.positioned[s.patch]} columns={8} width={100} label="positioned contextual input"/>
        </MoeScene></>}
      {kind==='router'&&<><MoeAffineDrawing trace={t.router[s.patch]} row={s.coordinate%4} title="The actual learned router uses the normalized contextual row"/>
        <MoeRouterDrawing scores={r.scores[s.patch]} k={2}/><FlowReadout>Patch {s.patch}: all actual scores {vec(r.scores[s.patch])}; selected IDs {vec(r.selected[s.patch])}; actual selected-normalized gates {vec(r.weights[s.patch])}. The full-probability route above is an explicit different-operator comparison.</FlowReadout></>}
      {kind==='classifier'&&<MoeAffineDrawing trace={t.classifier} row={s.coordinate%10} title="The actual classifier reads the mean of all sixteen final rows"/>}
      {['projection','router','classifier'].includes(kind)&&<FlowControls><MoeFlowNumber name={`Inspect output row (${kind==='router'?'modulo 4':kind==='classifier'?'modulo 10':'0–15'})`} value={s.coordinate} min={0} max={15} integer onChange={v=>update('coordinate',v)}/></FlowControls>}
    </>}
    {r&&['image','manipulation','temperature','disabled'].includes(kind)&&<FlowReadout>Current predicted digit {r.predicted}; observed label {s.label}. Probability of observed label {n(r.classProbabilities[s.label],9)};
      {' '}original same-source probability {n(b.reference.classProbabilities[s.label],9)}; delta {n(r.classProbabilities[s.label]-b.reference.classProbabilities[s.label],9)}.
      {' '}Selected assignments {vec(r.counts)} total 32. Executed counts {vec(r.counts.map((v,e)=>e===s.disabled?0:v))}; disabling leaves IDs/gates unchanged.</FlowReadout>}
    {r&&kind==='classifier'&&<NeuralTable caption="All ten class logits/probabilities and original-source differences" headers={['Class','Current logit','Current probability','Current minus original probability']} rows={r.classProbabilities.map((p,i)=>[i,n(r.logits[i]),n(p,9),n(p-b.reference.classProbabilities[i],9)])}/>}
    {!r&&kind!=='image'&&<p>The edited case is retained; this observation becomes available after the image question loads its fixed weights.</p>}
  </div></FlowLab>;
}
export function MoeFlowProgram({file,title}) {return <RemoteCodeBlock source={`/learn-code/${TOPIC}/${file}`} language="python" filename={file} title={title}/>;}
