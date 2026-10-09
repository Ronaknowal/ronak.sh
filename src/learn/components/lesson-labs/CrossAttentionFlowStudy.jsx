import { createContext, useContext, useEffect, useRef, useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import examples from '../../data/cross-attention-examples.json';
import { savedCrossForward, validateSavedState } from '../../data/cross-attention-saved-forward.js';
import { sum } from '../../data/cross-attention-flow-models.js';
import { CrossFigure, CrossMatrix, CrossVector, CrossPixels, CrossBars, CrossArrow, CrossBranches, CrossNumber, CrossSelect, CrossShape, crossNumber as f } from './CrossAttentionFlowFigures.jsx';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
const ID='interleaved-cross-attention-architectures', Study=createContext(null);
const classes=Array.from({length:12},(_,i)=>i<10?`digit ${i}`:i===10?'even (10)':'odd (11)');
export function CrossStudyProvider({children}) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const [source,setSource]=useState(79),[pixels,setPixels]=useState(null),[question,setQuestion]=useState(0),[pixel,setPixel]=useState(0);
  useEffect(()=>{const controller=new AbortController();setError('');
    fetch(`/learn-assets/${ID}/observed-reads.json`,{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error('Retained image records are unavailable.');return response.json();})
      .then(value=>{if(!Array.isArray(value.images)||value.images.length!==13||value.additional.length!==6)throw new Error('The retained record structure is incomplete.');if(!controller.signal.aborted)setData(value);})
      .catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();
  },[attempt]);
  useEffect(()=>{if(data)setPixels([...data.images.find(image=>image.source_id===source).pixels]);},[data,source]);
  return <Study.Provider value={{data,error,retry:()=>setAttempt(a=>a+1),source,setSource,pixels,setPixels,question,setQuestion,pixel,setPixel}}>{children}</Study.Provider>;
}
function useStudy(){const s=useContext(Study);if(!s)throw new Error('Study views require the topic study provider.');return s;}
function Pending({s}){return s.error?<p role="alert">{s.error} <button type="button" onClick={s.retry}>Retry retained records</button></p>:<p role="status">Loading retained real images and recorded outputs…</p>;}
export function CrossTwoQuestions(){const s=useStudy();if(!s.data)return <Pending s={s}/>;const image=s.data.images[0];
  return <CrossFigure job="D01" label="Two requests about the same real source image" caption={`UCI Optical Digits source${image.source_id}; this is the source annotation, not a model prediction. The two question templates share the same pixels.`}>
    <CrossPixels pixels={image.pixels} label={`Real source ${image.source_id}`} /><CrossArrow>The same visible image supports two different requests.</CrossArrow>
    <CrossBranches><div><p>Request: Which digit?</p><CrossVector values={[image.digit]} label="Annotated digit answer" role="input" /></div>
      <div><p>Request: Even or odd?</p><CrossVector values={[image.digit%2===0?'even':'odd']} label="Answer defined from the source digit annotation" role="input" /></div></CrossBranches>
  </CrossFigure>;
}
export function CrossGroupSplit(){const s=useStudy();if(!s.data)return <Pending s={s}/>;const image=s.data.images[0],p=image.pixels;
  const patches=Array.from({length:16},(_,i)=>{const row=2*Math.floor(i/4),col=2*(i%4);return [p[row*8+col],p[row*8+col+1],p[(row+1)*8+col],p[(row+1)*8+col+1]].map(v=>v/16);});
  return <CrossFigure job="D25" label="Source images split before sibling questions are created" caption="The study uses400 real8×8 Optical Digits source images. Fit/development/assessment groups have240/80/80 images, each producing two questions. Pixel counts divide by the known bound16; this is not a fitted normalization.">
    <CrossPixels pixels={p} label={`Source ${image.source_id} with actual2×2 patch outline`} patch={0}/>
    <CrossArrow>Group by source image, then make paired questions within its group.</CrossArrow>
    <CrossMatrix values={[[240,480],[80,160],[80,160]]} label="Disjoint source groups branch to digit/parity questions" rows={['fit','development','assessment']} columns={['source images','question rows']} role="input" />
    <CrossArrow>Slice each image in row-block then column-block order.</CrossArrow>
    <CrossMatrix values={patches} label={`Actual16×4 normalized patches from source${image.source_id}`} rows={patches.map((_,i)=>`patch ${i}`)} columns={['top left','top right','bottom left','bottom right']} role="input"/>
  </CrossFigure>;
}
export function CrossClassifierDrawing(){return <CrossFigure job="D26" label="Complete small cross-classifier operation and loss path" caption="Every shape matches the supplied study: one question query,16 image patches,three heads of width8,24-coordinate residual state,LayerNorm and24→48→GELU→24 feed branch,then12 output classes. The gated variant multiplies the cross update by tanh(α) before its first residual join.">
  <CrossBranches><div><CrossShape rows={16} width={4} label="Normalized patch array" role="input"/><CrossArrow>Patch linear4→24 plus learned16×24 positions.</CrossArrow><CrossShape rows={16} width={24} label="Image memory"/></div>
    <div><CrossShape rows={1} width={24} label="Learned question embedding" role="parameter"/><CrossArrow>Question supplies Q; memory supplies K and V.</CrossArrow></div></CrossBranches>
  <CrossBranches>{[0,1,2].map(h=><div key={h}><CrossShape rows={1} width={16} label={`Head${h} donor share grid`}/><CrossArrow>Read16 values of width8.</CrossArrow><CrossShape rows={1} width={8} label={`Head${h} carried result`}/></div>)}</CrossBranches>
  <CrossArrow>Join the three eight-coordinate groups.</CrossArrow><CrossShape rows={1} width={24} label="Joined read"/><CrossArrow>Output map24→24 → add query bypass.</CrossArrow>
  <CrossBranches><div><CrossShape rows={1} width={24} label="Unchanged hidden bypass"/><CrossArrow>Bypass to second ⊕</CrossArrow></div>
    <div><CrossShape rows={1} width={24} label="LayerNorm output"/><CrossArrow>Learned dense24→48</CrossArrow><CrossShape rows={1} width={48} label="GELU activations"/><CrossArrow>Learned dense48→24</CrossArrow><CrossShape rows={1} width={24} label="Dense update"/><CrossArrow>Add dense update to hidden bypass.</CrossArrow></div></CrossBranches>
  <CrossShape rows={1} width={12} label="Head linear24→12 gives logits"/><CrossArrow>Stable softmax → target probability → negative log loss.</CrossArrow>
  <CrossVector values={['cross-entropy','backward','AdamW step']} label="Fitting operations from the complete program" role="credit"/>
</CrossFigure>;}
export function CrossAllFits(){const [run,setRun]=useState(3),r=examples.summary[run],max=Math.max(...r.history.flatMap(p=>[p.fit_ce,p.development_ce]));
  const [scale,setScale]=useState(1);
  useEffect(()=>{const update=()=>setScale(parseFloat(getComputedStyle(document.documentElement).fontSize)/16);update();const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});window.addEventListener('resize',update);return()=>{observer.disconnect();window.removeEventListener('resize',update);};},[]);
  return <FlowLab id="cross-all-fits" label="Read every retained fixed fit and its discrete loss observations">
    <CrossFigure job="D27" label="All nine final outcomes and five observed loss checkpoints" caption="Denominator160 is the same for every run. These are the original fixed fits; no best seed/checkpoint is selected. Loss marks are only the five recorded epochs. Bars count correct answers, not architectural superiority.">
      <CrossBars values={[48,...examples.summary.map(x=>x.assessment.correct)]} label="Assessment correct counts" labels={['question-only',...examples.summary.map(x=>`${x.mode}/${x.seed}`)]} maximum={160}/>
      <div className="cross-flow-scroll" role="region" aria-label="Discrete epoch loss plot" tabIndex={0}><svg className="cross-flow-loss-plot" width={640*scale} height={370*scale} viewBox="0 0 640 370" role="img" aria-label={`${r.mode}/${r.seed}: five fit/development loss points`}>
        <path d="M70 20V270H620" fill="none" stroke="#ccc"/><text x="75" y="18">Mean cross-entropy</text><text x="490" y="355">Epoch</text>
        {r.history.map((p,i)=>{const x=90+i*120;return <g key={p.epoch}><path d={`M${x} 267V273`} stroke="#ccc"/><text x={x-15} y="295">{p.epoch}</text>
          <circle cx={x} cy={260-p.fit_ce/max*210} r="5" fill="#e4b752"/><circle cx={x} cy={260-p.development_ce/max*210} r="5" fill="#c0a0e0"/></g>;})}
        <text x="5" y="262">0</text><text x="5" y="55">{f(max,3)}</text>
      </svg></div>
      <p>Amber dots: fit; violet dots: development. The epoch marks are equally spaced for readable observations; their labels give the actual epochs.</p>
      <CrossMatrix values={r.history.map(p=>[p.epoch,p.fit_ce,p.development_ce])} label={`${r.mode}/${r.seed}: exact retained checkpoints`} columns={['epoch','fit CE','development CE']}/>
    </CrossFigure><FlowControls><CrossSelect label="Loss history run" value={run} options={examples.summary.map((x,i)=>[i,`${x.mode}, seed${x.seed}`])} onChange={v=>setRun(Number(v))}/></FlowControls>
    <FlowReadout>All flat counts:156,156,155;cross:140,140,142;gated:135,140,137. These are outcomes for this classroom setup.</FlowReadout>
  </FlowLab>;
}
export function CrossPairingControls(){const [control,setControl]=useState('matched'),matches=control==='matched'?[80,80]:control==='cyclic'?[70,70]:[9,40],count=r=>control==='matched'?r.assessment.correct:control==='cyclic'?r.cyclic_image_correct:r.mismatched_image_correct;
  return <FlowLab id="cross-pairing-controls" label="Compare the weak cyclic pairing with a stronger whole-image shuffle">
    <CrossFigure job="D28" label="Source-to-question pairing affects the strength of an input-use control" caption="The cyclic and seeded shuffle are recorded whole-image controls. Both digit/parity question rows receive the same changed source image. Preserved labels can explain a weak score change; a changed pairing is not causal attribution.">
      <CrossMatrix values={control==='matched'?[[0,0],[1,1],[2,2]]:control==='cyclic'?[[0,79],[1,0],[2,1]]:[[0,294],[1,47],[2,79]]} label={control==='shuffle'?'First three actual shuffled source IDs by assessment image index':'Actual first three pairings by assessment image index'} columns={['question image index','supplied image index / source ID']} role="input"/>
      <CrossArrow>Run the recorded classifier on the changed image/question pair.</CrossArrow>
      <CrossBars values={[48,...examples.summary.map(count)]} label={`Recorded correct counts under ${control}`} labels={['question-only',...examples.summary.map(r=>`${r.mode}/${r.seed}`)]} maximum={160}/>
      <CrossVector values={matches} label="Image change preserves this many digit/parity targets out of80"/>
    </CrossFigure><FlowControls><FlowChoice label="Pairing" value={control} options={[[ 'matched','Original'],['cyclic','One-image cyclic shift'],['shuffle','Seeded whole-image shuffle']]} onChange={setControl}/></FlowControls>
    <FlowReadout>{matches[0]}/80 digit targets and {matches[1]}/80 parity targets agree with the newly supplied images. The cyclic control preserves70/80 in both tasks, so it is a weak image-use test.</FlowReadout>
  </FlowLab>;
}
function SpatialWeights({weights,head,patch,onPatch}){
  return <CrossMatrix values={Array.from({length:4},(_,i)=>weights.slice(i*4,i*4+4))} label={`Head${head}: shares at4×4 actual patch addresses (fixed0–1 scale)`} selected={[Math.floor(patch/4),patch%4]} unitScale onSelect={(i,j)=>onPatch(i*4+j)}/>;
}
export function CrossRecordedReads(){const s=useStudy(),[run,setRun]=useState(0),[source,setSource]=useState(79),[question,setQuestion]=useState(0),[head,setHead]=useState(0),[patch,setPatch]=useState(0);
  if(!s.data)return <Pending s={s}/>;const records=s.data.additional,model=records[run],record=model.examples.find(r=>r.source_id===source&&r.question===question),image=s.data.images.find(r=>r.source_id===source);
  if(!record)return <p role="alert">No complete observation exists for this selection.</p>;
  return <FlowLab id="cross-recorded-reads" label="Inspect the120 retained complete probability observations">
    <CrossFigure job="D29" label="Recorded observation: pixels, spatial shares and all12 class probabilities" caption={`Recorded ${model.mode}/seed${model.seed},source${source},question${question}. There are six×ten×two complete observations. This selector performs no edited-image inference and does not create observations for the three extra original-map-only sources.`}>
      <CrossPixels pixels={image.pixels} label={`Recorded source${source},digit annotation${image.digit}`} patch={patch}/>
      <SpatialWeights weights={record.head_weights[head]} head={head} patch={patch} onPatch={setPatch}/>
      <CrossBars values={record.probabilities} label="All12 recorded class probabilities" labels={classes}/>
    </CrossFigure><FlowControls><CrossSelect label="Recorded model and seed" value={run} options={records.map((r,i)=>[i,`${r.mode}/seed${r.seed}`])} onChange={v=>setRun(Number(v))}/>
      <CrossSelect label="Complete-observation source" value={source} options={model.examples.filter(r=>r.question===0).map(r=>[r.source_id,`source${r.source_id}`])} onChange={v=>setSource(Number(v))}/>
      <FlowChoice label="Recorded question" value={question} options={[[0,'Which digit?'],[1,'Even or odd?']]} onChange={setQuestion}/></FlowControls>
    <p>Inspect a head below; selecting a spatial cell above links the actual2×2 pixel patch.</p><FlowControls><FlowChoice label="Recorded attention head" value={head} options={[[0,'head0'],[1,'head1'],[2,'head2']]} onChange={setHead}/></FlowControls>
    <FlowReadout>Recorded prediction {record.prediction},target {record.target};{record.prediction===record.target?'correct':'incorrect'}. Head{head} shares sum to {f(sum(record.head_weights[head]),8)}. Attention shares describe this mixture, not a causal explanation.</FlowReadout>
  </FlowLab>;
}
export function CrossOriginalMaps(){const s=useStudy(),[run,setRun]=useState(0),[index,setIndex]=useState(0),[head,setHead]=useState(0),[patch,setPatch]=useState(0);if(!s.data)return <Pending s={s}/>;
  const runs=s.data.original.filter(r=>Array.isArray(r.examples)),model=runs[run],record=model.examples[index],image=s.data.images.find(x=>x.source_id===record.source_id);
  return <FlowLab id="cross-original-maps" label="Inspect the original four-source map fields separately">
    <CrossFigure job="D29-original" label="Original recorded maps without a complete probability vector" caption={`Original recorded ${model.mode}/seed${model.seed},source${record.source_id},question${record.question}. These records retain target,prediction and per-head shares; no12-class vector is fabricated.`}>
      <CrossPixels pixels={image.pixels} label={`Original-map source${record.source_id}`} patch={patch}/><SpatialWeights weights={record.head_weights[head]} head={head} patch={patch} onPatch={setPatch}/>
    </CrossFigure><FlowControls><CrossSelect label="Original map model" value={run} options={runs.map((r,i)=>[i,`${r.mode}/seed${r.seed}`])} onChange={v=>{setRun(Number(v));setIndex(0);}}/>
      <CrossSelect label="Original source/question map" value={index} options={model.examples.map((r,i)=>[i,`source${r.source_id},${r.question===0?'digit':'parity'}`])} onChange={v=>setIndex(Number(v))}/></FlowControls>
    <p>Head inspection changes only the spatial map.</p><FlowControls><FlowChoice label="Original map head" value={head} options={[[0,'head0'],[1,'head1'],[2,'head2']]} onChange={setHead}/></FlowControls>
    <FlowReadout>Original prediction {record.prediction},target {record.target};head{head} shares sum to {f(sum(record.head_weights[head]),8)}. This map-only record has no complete probability vector.</FlowReadout>
  </FlowLab>;
}
export function CrossSavedInitial(){const s=useStudy();if(!s.data)return <Pending s={s}/>;return <FlowLab id="cross-saved-initial" label="Choose the source of a copied image for one saved model">
  <FlowControls><CrossSelect label="Copied source for cross/seed11" value={s.source} options={s.data.images.map(r=>[r.source_id,`source${r.source_id},original digit${r.digit}`])} onChange={v=>s.setSource(Number(v))}/></FlowControls>
  <div className="cross-flow-actions"><button type="button" onClick={()=>s.setPixels([...s.data.images.find(r=>r.source_id===s.source).pixels])}>Restore this source's original pixels</button></div>
  <FlowReadout>All13 retained source images are available as initial inputs for this one computed model. Editing creates a copied case with the original source ID as provenance.</FlowReadout>
</FlowLab>;}
export function CrossSavedImage(){const s=useStudy(),container=useRef(null),[near,setNear]=useState(false),[state,setState]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{if(!('IntersectionObserver'in window)){setNear(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'500px'});observer.observe(container.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(!near)return;const controller=new AbortController();setError('');
    fetch(`/learn-assets/${ID}/cross-11-state.json`,{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error('Saved state unavailable.');return response.json();}).then(value=>{validateSavedState(value);if(!controller.signal.aborted)setState(value);})
      .catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[near,attempt]);
  let result=null,failure='';if(state&&s.pixels){try{result=savedCrossForward(s.pixels,s.question,state);}catch(e){failure=e.message;}}
  const image=s.data?.images.find(r=>r.source_id===s.source),patch=Math.floor(s.pixel/16)*4+Math.floor((s.pixel%8)/2),edited=s.pixels?.some((v,i)=>v!==image?.pixels[i]);
  return <div ref={container}><FlowLab id="cross-saved-image" label="Compute a genuine edited-image forward through cross/seed11">
    {!s.data?<Pending s={s}/>:error?<p role="alert">{error}<button type="button" onClick={()=>setAttempt(v=>v+1)}>Retry saved cross state</button></p>:!state?<p role="status">{near?'Loading the complete saved cross/seed11 state…':'The saved model loads when this drawing approaches the viewport.'}</p>:failure?<p role="alert">{failure}</p>:result&&<>
      <CrossFigure job="D30" label="Computed single-model edited-image forward" caption={`Computed from complete cross/seed11 state,5,676 parameters; source${s.source} is provenance. ${edited?'Pixels are edited; the source label is not new ground truth.':'Pixels currently equal the retained original input.'} Float64 browser calculation is compared with native float32 using tolerance1e−5; this is not a new accuracy study.`}>
        <CrossPixels pixels={s.pixels} label={`Copied source${s.source}: select any pixel`} selected={s.pixel} patch={patch} onSelect={s.setPixel}/>
        <CrossArrow>Raw counts÷16 → patch coordinates → learned patch map + position.</CrossArrow><CrossVector values={result.patches[patch]} label={`Actual normalized patch${patch}`}/>
        <CrossVector values={result.memory[patch]} label={`Actual projected memory row${patch},width24`}/><CrossVector values={result.query} label={`Question${s.question} learned embedding`} role="parameter"/>
        <CrossArrow>Three projected heads each compare one request with all16 donor keys.</CrossArrow>
        <CrossMatrix values={result.shares} label="Computed3×16 head shares" rows={['head0','head1','head2']}/>
        <CrossMatrix values={result.read} label="Computed per-head carried answers,width8" rows={['head0','head1','head2']}/>
        <CrossArrow>Join24 → output map → first residual.</CrossArrow><CrossVector values={result.hidden} label="Computed hidden residual,width24"/>
        <CrossArrow>LayerNorm → linear48 → exact-form GELU → linear24 → second residual.</CrossArrow>
        <CrossVector values={[result.mean,result.variance]} label="LayerNorm population mean and variance"/>
        <CrossVector values={result.final} label="Computed final state,width24"/><CrossArrow>Output head24→12 → stable softmax.</CrossArrow>
        <CrossVector values={result.logits} label="All12 computed logits"/><CrossBars values={result.probabilities} label="All12 computed class probabilities" labels={classes}/>
      </CrossFigure><FlowControls><CrossNumber syncKey={s.pixels} label={`Raw count at row${Math.floor(s.pixel/8)},column${s.pixel%8}`} value={s.pixels[s.pixel]} min={0} max={16} onChange={v=>s.setPixels(s.pixels.map((x,i)=>i===s.pixel?v:x))}/>
        <FlowChoice label="Computed question" value={s.question} options={[[0,'Which digit?'],[1,'Even or odd?']]} onChange={s.setQuestion}/></FlowControls>
      <FlowReadout>Computed prediction {classes[result.prediction]}, probability {f(result.probabilities[result.prediction],8)}. {edited?'Edited case; original annotation remains provenance only.':`Original source annotation:digit${image.digit}.`} Selected pixel{s.pixel} belongs to patch{patch}; every edit recomputes all three heads and the complete output path.</FlowReadout>
    </>}
  </FlowLab></div>;
}
export function CrossFlowProgram({file,title}){return <RemoteCodeBlock source={`/learn-code/${ID}/${file}`} filename={file} title={title}/>;}
export function CrossFlowFiles(){const files=['cross_attention_mechanisms.py','saved_cross_image.py','cross-attention-study.py','cross_attention_cache.py','digits-400.csv','data-provenance.md','calculated-inputs.json'];return <ul>{files.map(file=><li key={file}><a href={`/learn-code/${ID}/${file}`} download>{file}</a></li>)}
  <li><a href={`/learn-assets/${ID}/cross-11-state.json`} download>cross-11-state.json — complete saved model</a></li><li><a href={`/learn-assets/${ID}/observed-reads.json`} download>observed-reads.json — source pixels and recorded observations</a></li></ul>;}
