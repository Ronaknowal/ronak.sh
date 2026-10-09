import { createContext, useContext, useEffect, useState } from 'react';
import { historyStructure, historyScore, historyStep, historyTrace } from '../../data/recommender-flow-implicit-models.js';
import { resizeFactorRows } from '../../data/recommender-flow-factor-models.js';
import { dot } from '../../data/recommender-flow-evidence-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecSelect, RecExactObject, parseRecVector,
  useRecEvidence, formatRec as n , itemHue } from './RecommenderFlowControls.jsx';
import { useRecFactors } from './RecommenderFlowFactors.jsx';
import { RecWire as Wire, RecPort as Port, RecCurve } from './RecommenderFlowDrawing.jsx';

const HistoryContext=createContext(null);
const options=(count,prefix)=>Array.from({length:count},(_,index)=>[index,`${prefix}${index}`]);
function defaults(users,items,dimension){
  const P=resizeFactorRows([],users,dimension),Q=resizeFactorRows([[1,0],[0,1]],items,dimension),Y=resizeFactorRows([[1,0],[0,1]],items,dimension);
  return{P,Q,Y,bu:Array(users).fill(0),bi:Array(items).fill(0),mu:3,user:0,item:0,historyItem:0,eta:.1,lambda:0,epochs:1,eventId:null};
}

export function RecommenderHistoryProvider({children}){
  const evidence=useRecEvidence(),factors=useRecFactors(),users=evidence.matrix.length,items=evidence.matrix[0].length,dimension=factors.dimension;
  const [state,setState]=useState(()=>defaults(users,items,dimension)),[revision,setRevision]=useState(0);
  const fit = previous => ({...previous,P:resizeFactorRows(previous.P,users,dimension),Q:resizeFactorRows(previous.Q,items,dimension),Y:resizeFactorRows(previous.Y,items,dimension),
    bu:Array.from({length:users},(_,index)=>previous.bu[index]??0),bi:Array.from({length:items},(_,index)=>previous.bi[index]??0),
    user:Math.min(previous.user,users-1),item:Math.min(previous.item,items-1),historyItem:Math.min(previous.historyItem,items-1)});
  useEffect(()=>setState(fit),[users,items,dimension]);
  const events=evidence.events.filter(event=>event.tick<=evidence.request&&event.user<users&&event.item<items);
  const structure=historyStructure(events,users,items);
  const patch=values=>setState(previous=>({...previous,...values}));
  const reset=()=>{evidence.reset();setState(defaults(5,7,dimension));setRevision(value=>value+1);};
  // Use the supported current shape during the render preceding effect storage.
  // Otherwise a selected dropped user can index a newly shorter history list.
  return <HistoryContext.Provider value={{...fit(state),dimension,evidence,events,structure,patch,reset,revision}}>{children}</HistoryContext.Provider>;
}
function useHistory(){const state=useContext(HistoryContext);if(!state)throw new Error('History views require RecommenderHistoryProvider.');return state;}

export function HistoryRepresentationFigure(){
  const state=useHistory(),users=state.P.length,items=state.Q.length;
  const result=historyScore(state,state.user,state.item);
  const occurrences=state.events.filter(event=>event.user===state.user).map(event=>event.item);
  const ordinary=historyScore(state,state.user,state.item,occurrences);
  const worked=1/Math.sqrt(2);
  return <RecFigure id="D31" label="Separate history and output embedding arrays, unique prefix history and occurrence-library contrast" reset={state.reset}
    controls={<><fieldset className="rec-flow-quantity"><legend>Selected SVD++ score parameter object</legend>
      <RecSelect label="History user" value={state.user} options={options(users,'U')} onChange={user=>state.patch({user:Number(user)})} />
      <RecSelect label="History output item" value={state.item} options={options(items,'I')} onChange={item=>state.patch({item:Number(item)})} />
      <RecExactObject label="Selected SVD++ score parameters" value={{mu:state.mu,bu:state.bu[state.user],bi:state.bi[state.item],p:state.P[state.user],q:state.Q[state.item]}} revision={state.revision}
        description={`μ −10…10; selected biases/factors ±10000; ${state.dimension} coordinates. Output q and history y are separate arrays.`}
        parse={text=>{const value=JSON.parse(text);if(!Number.isFinite(value.mu)||Math.abs(value.mu)>10||!Number.isFinite(value.bu)||Math.abs(value.bu)>1e4||!Number.isFinite(value.bi)||Math.abs(value.bi)>1e4)throw new Error('Use supported finite mean/bias values.');
          return{...value,p:parseRecVector(JSON.stringify(value.p),state.dimension,-1e4,1e4),q:parseRecVector(JSON.stringify(value.q),state.dimension,-1e4,1e4)};}}
        onChange={({mu,bu,bi,p,q})=>{const P=state.P.map(row=>[...row]),Q=state.Q.map(row=>[...row]),userBias=[...state.bu],itemBias=[...state.bi];P[state.user]=p;Q[state.item]=q;userBias[state.user]=bu;itemBias[state.item]=bi;state.patch({mu,P,Q,bu:userBias,bi:itemBias});}} /></fieldset>
      <fieldset className="rec-flow-quantity"><legend>Selected history y row</legend><RecSelect label="History embedding item" value={state.historyItem} options={options(items,'I')} onChange={historyItem=>state.patch({historyItem:Number(historyItem)})} />
        <RecExactObject label="Selected history y coordinates" value={state.Y[state.historyItem]} revision={state.revision}
          description={`${state.dimension} finite coordinates, each ±10000. Dimension follows the declared F array width.`}
          parse={text=>parseRecVector(text,state.dimension,-1e4,1e4)} onChange={vector=>{const Y=state.Y.map(row=>[...row]);Y[state.historyItem]=vector;state.patch({Y});}} /></fieldset>
      <RecExactObject label="Permitted event prefix object" value={{requestTick:state.evidence.request,events:state.evidence.events}} revision={state.evidence.revision}
        description="Shared E clock/events. Unique occurrence IDs remain separate. JSON {requestTick,events}; ticks 0–100, U0–19, I0–29, rating −10…10. Only rows within current parameter arrays and at/before cutoff enter this SVD++ prefix."
        parse={text=>{const value=JSON.parse(text);if(!Number.isFinite(value.requestTick)||value.requestTick<0||value.requestTick>100||!Array.isArray(value.events))throw new Error('Use a supported cutoff and event array.');
          if(value.events.some(event=>!event||typeof event.id!=='string'||!event.id||!Number.isInteger(event.user)||event.user<0||event.user>19||!Number.isInteger(event.item)||event.item<0||event.item>29||!Number.isFinite(event.rating)||Math.abs(event.rating)>10||!Number.isFinite(event.tick)||event.tick<0||event.tick>100)||new Set(value.events.map(event=>event.id)).size!==value.events.length)throw new Error('Use separately identified supported event objects.');return value;}}
        onChange={({requestTick,events})=>state.evidence.patch({request:requestTick,events})} /></>}
    result={`Current E prefix U${state.user}/I${state.item}: ${result.history.length} unique history items, ${occurrences.length} occurrences. Canonical score ${n(result.score)}; separately declared Surprise occurrence-list forward ${n(ordinary.score)}. Empty history contributes 0. Reset restores shared E prefix plus independent SVD++ buffers.`}>
    <RecOperands
      columnHues={[itemHue(0), itemHue(1)]} rowHues={[itemHue(0), itemHue(1)]} label="Separate two-item worked history: p=0, q=(1,0), μ=3, biases=0" headers={['History item','y0','y1']}
      rows={[["I0",1,0],['I1',0,1]]} />
    <div className="rec-flow-values"><span>Σ y = (1,1)</span><Wire /><span>÷ √2</span><Wire /><span>h=({n(worked)},{n(worked)})</span><Wire /><span>qᵀh {n(worked)}</span><span className="rec-flow-operator">+</span><span>μ 3</span><Wire /><strong>{n(3+worked)}</strong></div>
    <div className="rec-flow-values">{state.events.filter(event=>event.user===state.user).map(event=><Port key={event.id} hue={event.item}>{event.id}: U{event.user}/I{event.item}, r {n(event.rating)}, t {n(event.tick)}</Port>)}
      {!occurrences.length&&<span>Empty permitted occurrence list</span>}<Wire /><span>Canonical unique IDs: {result.history.map(item=>`I${item}`).join(', ')||'none'}</span></div>
    <RecMatrix
      rowHues={result.history.map(itemHue)} label="Current unique-history Y rows; output Q is a separate lookup" rows={result.history.map(item=>state.Y[item])} columns={Array.from({length:state.dimension},(_,k)=>`y k${k}`)} rowNames={result.history.map(item=>`I${item}`)} />
    <RecOperands
      rowHues={result.h.map((_, k) => itemHue(k))} label="Each actual coordinate: sum history, normalize, add p, multiply q" headers={['Coordinate','Σ history y','Divisor √|N|','History part','p','h','Output q','Product']}
      rows={result.h.map((h,k)=>[`k${k}`,result.totals[k],result.history.length?Math.sqrt(result.history.length):'empty→part0',result.contribution[k],state.P[state.user][k],h,state.Q[state.item][k],h*state.Q[state.item][k]])} />
    <div className="rec-flow-values"><span>Σ matching products {n(dot(result.h,state.Q[state.item]))}</span><span className="rec-flow-operator">+</span>
      <Port hue={2}>μ {n(state.mu)} + bᵤ {n(state.bu[state.user])} + bᵢ {n(state.bi[state.item])}</Port><Wire /><strong>{n(result.score)}</strong></div>
    <RecOperands label="Same occurrence objects, distinct set versus occurrence-list normalization" headers={['Rule','Item ID sequence','Divisor','History contribution','Score']}
      rows={[["Canonical unique set",result.history.map(item=>`I${item}`).join(', ')||'none',result.history.length?Math.sqrt(result.history.length):'empty',result.contribution.map(n).join(', '),result.score],
        ['Surprise occurrence list',occurrences.map(item=>`I${item}`).join(', ')||'none',occurrences.length?Math.sqrt(occurrences.length):'empty',ordinary.contribution.map(n).join(', '),ordinary.score]]} />
  </RecFigure>;
}

export function HistoryGradientFigure(){
  const state=useHistory(),event=state.events.find(event=>event.id===state.eventId)??state.events[0];
  const update=event?historyStep(state,event,state.eta,state.lambda):null;
  const trace=historyTrace(state,state.events,state.eta,state.lambda,state.epochs);
  return <RecFigure id="D32" label="Selected event reads old h/p/q/y buffers and incidence-distributed entity penalties" reset={state.reset}
    controls={<><RecQuantity label="History learning rate η" value={state.eta} min={0} max={1} revision={state.revision} onChange={eta=>state.patch({eta})} />
      <RecQuantity label="History once-entity λ" value={state.lambda} min={0} max={10} revision={state.revision} onChange={lambda=>state.patch({lambda})} />
      <RecQuantity label="History complete epochs" integer value={state.epochs} min={0} max={15} revision={state.revision} onChange={epochs=>state.patch({epochs})} /></>}
    result={`Selected ${event?`${event.id}: U${event.user}/I${event.item}, target ${n(event.rating)}`:'no permitted event'}. ${update?.available?`Old score ${n(update.old.score)}, error ${n(update.error)}; every displayed derivative uses old buffers.`:update?.reason??'No event update is available.'} Last complete epoch ${trace.states.at(-1).epoch}, fixed-state objective ${n(trace.states.at(-1).loss)}. ${trace.unavailable?`Stopped epoch ${trace.unavailable.epoch} at ${trace.unavailable.event}; last valid partial buffers retained separately.`:'Declared occurrence order, not a shuffled library fit.'}`}>
    <div className="rec-history-occurrences"><RecOperands label="Actual permitted event objects: select an event without deduplicating its loss" headers={['Occurrence','User','Item','Target','Select']}
      rows={state.events.map(entry=>[entry.id,`U${entry.user}`,`I${entry.item}`,entry.rating,<button key={entry.id} type="button" aria-pressed={entry.id===event?.id} onClick={()=>state.patch({eventId:entry.id})}>Select {entry.id}</button>])} /></div>
    {event&&update?.old&&<><div className="rec-flow-values"><Port>Old h ({update.old.h.map(n).join(', ')})</Port><Port hue={1}>Old q ({state.Q[event.item].map(n).join(', ')})</Port><Wire /><span>Old score {n(update.old.score)}</span></div>
      <div className="rec-flow-values"><Port hue={2}>Target {n(event.rating)}</Port><span className="rec-flow-operator">−</span><Port>Old score {n(update.old.score)}</Port><Wire /><strong>Error {n(update.error)}</strong></div>
      <RecOperands label="Distinct global-penalty incidence denominators" headers={['Entity','Incidence count','Distributed coefficient']}
        rows={[[`p U${event.user}`,state.structure.nu[event.user],state.lambda/state.structure.nu[event.user]],
          [`q I${event.item}`,state.structure.ni[event.item],state.lambda/state.structure.ni[event.item]],
          ...update.old.history.map(item=>[`y I${item}`,state.structure.tj[item],state.lambda/state.structure.tj[item]])]} />
      <RecOperands label="Actual old-buffer factor/history derivatives and proposed simultaneous buffers" headers={['Parameter','Old value','Loss derivative','Distributed prior derivative','Total derivative','New value']}
        rows={[...state.P[event.user].map((value,k)=>[`p k${k}`,value,-update.error*state.Q[event.item][k],state.lambda/state.structure.nu[event.user]*value,update.gp[k],update.next?.P[event.user][k]??null]),
          ...state.Q[event.item].map((value,k)=>[`q k${k}`,value,-update.error*update.old.h[k],state.lambda/state.structure.ni[event.item]*value,update.gq[k],update.next?.Q[event.item][k]??null]),
          ...update.old.history.flatMap((item,position)=>state.Y[item].map((value,k)=>[`y I${item} k${k}`,value,-update.error*state.Q[event.item][k]/Math.sqrt(update.old.history.length),state.lambda/state.structure.tj[item]*value,update.gy[position][k],update.next?.Y[item][k]??null]))]} />
      <RecOperands label="Old-buffer bias derivatives use user/item incidence respectively" headers={['Bias','Old','Derivative','New']}
        rows={[[`bᵤ U${event.user}`,state.bu[event.user],update.gbu,update.next?.bu[event.user]??null],[`bᵢ I${event.item}`,state.bi[event.item],update.gbi,update.next?.bi[event.item]??null]]} />
      {!update.available&&<strong>{update.reason}</strong>}
    </>}
    <RecCurve label="Full objective at complete saved toy epochs" points={trace.states.map(row=>[row.epoch,row.loss])} xLabel="Complete epoch" yLabel="Global objective" selected={[trace.states.at(-1).epoch,trace.states.at(-1).loss]} />
    <RecOperands label="One saved full parameter state per complete epoch; no rolling-loss substitution" headers={['Epoch','All-record residual half-sum','Once-entity prior','Full objective']}
      rows={trace.states.map(row=>[row.epoch,row.residual,row.penalty,row.loss])} />
    <p>Positive λ sends zero-incidence p/q/y and bias parameters to their minimizing zero state at the epoch boundary. At λ=0 those unused parameters remain unconstrained. The initial edited state is still shown at epoch 0.</p>
    {trace.unavailable&&<p>First unavailable stage: epoch {trace.unavailable.epoch}, occurrence {trace.unavailable.event}. Last valid partial-state objective {n(trace.unavailable.lastValidObjective.loss)}; it is not a complete epoch point.</p>}
  </RecFigure>;
}
