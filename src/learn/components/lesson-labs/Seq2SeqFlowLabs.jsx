import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as n } from './LessonFlow.jsx';
import useLessonViewport from './useLessonViewport.js';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { sequenceTokens, shiftedTracks, scalarBridge, probabilityTree, lengthScore, encodeSequence, generatedTrace, sequenceBeam } from '../../data/seq2seq-models.js';
import { SeqShiftFigure, SeqMaskFigure, SeqScalarFigure, SeqProbabilityTreeFigure, SeqLengthFigure, SeqFittedStateFigure, SeqContextFigure, SeqBeamOwnershipFigure, SeqCreditFigure, SeqPrefixFigure } from './Seq2SeqDrawings.jsx';
import './seq2seq-flow.css';

const asset='/learn-code/sequence-to-sequence-encoder-decoder/';
const token=id=>sequenceTokens[id].replace(/[<>]/g,'').replace('eos','EOS').replace('bos','BOS');
const pathLabel=path=>path.replace('!', ', EOS');
export function SeqText({ name, value, onChange, min=1, max=12 }) {
  const [draft,setDraft]=useState(null);
  useEffect(()=>setDraft(null),[value]);
  return <label className="seq-flow-text">{name}<input aria-label={name} aria-invalid={draft!==null} value={draft??value} onChange={event=>{const text=event.target.value;if(new RegExp(`^[a-z]{${min},${max}}$`).test(text)){setDraft(null);onChange(text);}else setDraft(text);}} onBlur={()=>setDraft(null)}/>{draft!==null&&<small role="status">Use {min}–{max} lowercase letters a–z. The calculation retains “{value}”.</small>}</label>;
}
function SeqSelect({ name, value, onChange, options }) {
  return <label className="seq-flow-text">{name}<select aria-label={name} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>;
}
function Reset({ children, onClick }) {return <div className="seq-flow-actions"><button type="button" onClick={onClick}>{children}</button></div>;}
function Tokens({ tokens, selected=-1, computed=false }) {return <div className="seq-flow-token-row">{tokens.map((item,i)=><span key={i} className={`seq-flow-token ${computed?'computed':''} ${i===selected?'selected':''} ${item==='<pad>'?'masked':''}`}>{typeof item==='number'?token(item):item.replace(/[<>]/g,'').toUpperCase().replace(/^[A-Z]$/,s=>s.toLowerCase())}</span>)}</div>;}

export function SeqShiftLab() {
  const [target,setTarget]=useState('cared'),[position,setPosition]=useState(3);
  const track=shiftedTracks(target),selected=Math.min(position,track.targets.length-1);
  return <FlowLab id="seq2seq-alignment" label="Previous-token input and target-only loss">
    <SeqShiftFigure target={target} position={selected}/>
    <p>Decoder inputs:</p><Tokens tokens={track.inputs} selected={selected}/><p>Reference targets:</p><Tokens tokens={track.targets} selected={selected}/>
    <FlowControls><SeqText name="Reference target" value={target} onChange={setTarget} max={10}/><FlowSlider name="Inspect target position" value={selected+1} min={1} max={track.targets.length} step={1} onChange={value=>setPosition(value-1)}/></FlowControls>
    <FlowReadout>Position {selected+1} receives <strong>{track.inputs[selected]}</strong> and scores <strong>{track.targets[selected]}</strong>; source <strong>care + past</strong> is unchanged. Editing the target at this position changes its loss, while its distribution stays fixed if the preceding input prefix stays fixed. These edited forms are constructed targets, not verified inflections.</FlowReadout>
    <Reset onClick={()=>{setTarget('cared');setPosition(3);}}>Reset target shift</Reset>
  </FlowLab>;
}
export function SeqMaskLab() {
  const [padding,setPadding]=useState(0),[probability,setProbability]=useState(.8),cost=-Math.log(probability);
  return <FlowLab id="seq2seq-mask" label="Valid target mask and denominator"><SeqMaskFigure padding={padding} probability={probability}/><FlowControls><FlowSlider name="Extra PAD cells per answer" value={padding} min={0} max={3} step={1} onChange={setPadding}/><FlowSlider name="Constructed correct-token probability" value={probability} min={.05} max={.99} step={.01} onChange={setProbability}/></FlowControls><FlowReadout>There are <strong>12 valid targets</strong>, including both EOS tokens: sum <strong>{n(12*cost)}</strong>, valid-token mean <strong>{n(cost)}</strong> nats. Incorrectly dividing by every storage slot gives <strong>{n(12*cost/(12+2*padding))}</strong>; padding does not change the valid-token mean.</FlowReadout><Reset onClick={()=>{setPadding(0);setProbability(.8);}}>Reset loss mask</Reset></FlowLab>;
}

const ScalarContext=createContext(null);
export function SeqScalarProvider({children}) {
  const [inputs,setInputs]=useState([.2,.8]),[weight,setWeight]=useState(.7);
  const value=useMemo(()=>({inputs,weight,setInputs,setWeight,result:scalarBridge(inputs,weight)}),[inputs,weight]);
  return <ScalarContext.Provider value={value}>{children}</ScalarContext.Provider>;
}
export function SeqForwardLab() {
  const {inputs,weight,setInputs,setWeight,result}=useContext(ScalarContext);
  return <FlowLab id="seq2seq-forward" label="Constructed encoder-decoder forward calculation"><SeqScalarFigure result={result} inputs={inputs} weight={weight}/><FlowControls>{inputs.map((value,i)=><FlowSlider key={i} name={`Source scalar ${i+1}`} value={value} min={-1} max={1} step={.01} onChange={next=>setInputs(old=>old.map((v,j)=>i===j?next:v))}/>)}<FlowSlider name="Shared encoder input weight" value={weight} min={-1.5} max={1.5} step={.01} onChange={setWeight}/></FlowControls><FlowReadout>Final encoder context is <strong>{n(result.context)}</strong>; decoder states are <strong>{n(result.decoder[0])}</strong> and <strong>{n(result.decoder[1])}</strong>. The second distribution assigns EOS <strong>{n(1-result.probabilityA[1])}</strong>. All decoder parameters and previous inputs remain fixed.</FlowReadout><Reset onClick={()=>{setInputs([.2,.8]);setWeight(.7);}}>Reset scalar forward calculation</Reset></FlowLab>;
}
export function SeqCreditLab() {
  const {inputs,weight}=useContext(ScalarContext),[rate,setRate]=useState(.1),[detached,setDetached]=useState(false),result=scalarBridge(inputs,weight,rate,detached);
  return <FlowLab id="seq2seq-bridge" label="Joint loss credit through the context"><SeqCreditFigure result={result}/><FlowControls><FlowSlider name="Encoder update rate" value={rate} min={0} max={.2} step={.01} onChange={setRate}/><label className="seq-flow-checkbox"><input type="checkbox" checked={detached} onChange={e=>setDetached(e.target.checked)}/>Detach context gradient</label></FlowControls><FlowReadout>Current mean NLL is <strong>{n(result.loss,8)}</strong>; encoder derivative is <strong>{n(result.gradient,8)}</strong>. One proposed update gives weight <strong>{n(result.nextWeight,8)}</strong> and loss <strong>{n(result.nextLoss,8)}</strong>. {detached?'Detachment keeps forward values but removes decoder credit to the encoder.':`Context derivative ${n(result.contextGradient,8)} multiplies encoder sensitivity ${n(result.sensitivity,8)}.`} {rate===0?'Zero rate leaves the weight unchanged.':''}</FlowReadout><Reset onClick={()=>{setRate(.1);setDetached(false);}}>Reset gradient intervention</Reset></FlowLab>;
}
const TreeContext=createContext(null);
export function SeqTreeProvider({children}) {const [a,setA]=useState(.6),[afterA,setAfterA]=useState(.51),[afterB,setAfterB]=useState(.9);return <TreeContext.Provider value={{a,afterA,afterB,setA,setAfterA,setAfterB}}>{children}</TreeContext.Provider>;}
export function SeqTreeLab() {
  const {a,afterA,afterB,setA,setAfterA,setAfterB}=useContext(TreeContext),greedy=probabilityTree(a,afterA,afterB,1),beam=probabilityTree(a,afterA,afterB,2);
  return <FlowLab id="seq2seq-tree" label="Conditional probabilities and complete answer probabilities"><SeqProbabilityTreeFigure a={a} afterA={afterA} afterB={afterB}/><FlowControls><FlowSlider name="P(A) at root" value={a} min={.01} max={.99} step={.01} onChange={setA}/><FlowSlider name="P(EOS | A)" value={afterA} min={.01} max={.99} step={.01} onChange={setAfterA}/><FlowSlider name="P(EOS | B)" value={afterB} min={.01} max={.99} step={.01} onChange={setAfterB}/></FlowControls><FlowReadout>Greedy selects <strong>{pathLabel(greedy.winner.path)}</strong> with probability <strong>{n(greedy.winner.probability)}</strong>; the best complete route is <strong>{pathLabel(beam.winner.path)}</strong> with probability <strong>{n(beam.winner.probability)}</strong>. Each edited edge changes its complement so its conditional row still sums to one.</FlowReadout><Reset onClick={()=>{setA(.6);setAfterA(.51);setAfterB(.9);}}>Reset conditional tree</Reset></FlowLab>;
}
export function SeqFrontierLab() {
  const {a,afterA,afterB}=useContext(TreeContext),[width,setWidth]=useState(2),[step,setStep]=useState(1),tree=probabilityTree(a,afterA,afterB,width),frontier=tree.history[step-1];
  return <FlowLab id="seq2seq-frontier" label="Candidate ownership and pruning by search step"><SeqProbabilityTreeFigure a={a} afterA={afterA} afterB={afterB} tree={tree} step={step}/><FlowControls><FlowSlider name="Tiny-tree beam width" value={width} min={1} max={2} step={1} onChange={setWidth}/><FlowSlider name="Inspect frontier step" value={step} min={1} max={3} step={1} onChange={setStep}/></FlowControls><FlowReadout>After step <strong>{step}</strong>, retained prefixes are <strong>{frontier.candidates.map(c=>`${pathLabel(c.path)} (${n(c.probability)})`).join('; ')}</strong>. {frontier.pruned.length?`Pruned: ${frontier.pruned.map(c=>pathLabel(c.path)).join('; ')}.`:'Nothing is pruned at this step.'} Final winner is <strong>{pathLabel(tree.winner.path)}</strong>; an ended prefix never consumes another EOS.</FlowReadout><NeuralTable caption={`Exact retained and pruned frontier at step ${step}`} headers={['Prefix / symbolic state identity','Probability','Status']} rows={[...frontier.candidates.map(c=>[pathLabel(c.path),n(c.probability),c.path.endsWith('!')?'Retained; ended':'Retained; live']),...frontier.pruned.map(c=>[pathLabel(c.path),n(c.probability),'Pruned'])]}/><Reset onClick={()=>{setWidth(2);setStep(1);}}>Reset frontier inspection</Reset></FlowLab>;
}
export function SeqLengthLab() {
  const [alpha,setAlpha]=useState(0),scores=[lengthScore(-1.5,3,alpha),lengthScore(-1.8,6,alpha)];
  return <FlowLab id="seq2seq-length" label="Length policy changes ranking"><SeqLengthFigure alpha={alpha}/><FlowControls><FlowSlider name="Length exponent α" value={alpha} min={0} max={2} step={.05} onChange={setAlpha}/></FlowControls><FlowReadout>The length-three score is <strong>{n(scores[0])}</strong> and length-six score is <strong>{n(scores[1])}</strong>; the <strong>{scores[0]>=scores[1]?'shorter':'longer'}</strong> answer ranks first. Raw probabilities stay fixed. The exponent is applied once.</FlowReadout><Reset onClick={()=>setAlpha(0)}>Reset length policy</Reset></FlowLab>;
}

let resourcePromise=null;
function loadWeights() {
  if(!resourcePromise) resourcePromise=fetch(asset+'seed-one-inference.json').then(response=>{if(!response.ok)throw new Error('Saved model could not be loaded.');return response.json();}).then(data=>data.weights).catch(error=>{resourcePromise=null;throw error;});
  return resourcePromise;
}
const FittedContext=createContext(null);
export function SeqFittedProvider({children}) {
  const [weights,setWeights]=useState(null),[error,setError]=useState(null),[attempt,setAttempt]=useState(0),[requested,setRequested]=useState(false);
  const [lemma,setLemma]=useState('emmove'),[feature,setFeature]=useState('past'),[cap,setCap]=useState(16),[prefix,setPrefix]=useState(''),[coordinate,setCoordinate]=useState(0),[step,setStep]=useState(0),[gain,setGain]=useState(1),[mix,setMix]=useState(0);
  useEffect(()=>{if(!requested)return;let active=true;setError(null);loadWeights().then(data=>{if(active)setWeights(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[requested,attempt]);
  const base=useMemo(()=>weights?generatedTrace(weights,lemma,feature,{cap}):null,[weights,lemma,feature,cap]);
  const prefixTrace=useMemo(()=>weights?(prefix?generatedTrace(weights,lemma,feature,{cap,prefix}):base):null,[weights,lemma,feature,cap,prefix,base]);
  const other=useMemo(()=>weights?encodeSequence(weights,'lactate','past').context:null,[weights]);
  const context=useMemo(()=>base?base.context.map((v,i)=>gain*((1-mix)*v+mix*other[i])):null,[base,other,gain,mix]);
  const intervention=useMemo(()=>weights?(gain===1&&mix===0?prefixTrace:generatedTrace(weights,lemma,feature,{cap,prefix,context})):null,[weights,lemma,feature,cap,prefix,context,gain,mix,prefixTrace]);
  const reset=()=>{setLemma('emmove');setFeature('past');setCap(16);setPrefix('');setCoordinate(0);setStep(0);setGain(1);setMix(0);};
  return <FittedContext.Provider value={{weights,error,retry:()=>setAttempt(a=>a+1),request:()=>setRequested(true),lemma,setLemma,feature,setFeature,cap,setCap,prefix,setPrefix,coordinate,setCoordinate,step,setStep,gain,setGain,mix,setMix,base,prefixTrace,intervention,context,other,reset}}>{children}</FittedContext.Provider>;
}
function FittedGate({id,children}) {
  const [ref,near]=useLessonViewport(),state=useContext(FittedContext);
  useEffect(()=>{if(near)state.request();},[near]);
  return <div ref={ref} data-seq-load={id}>{state.weights?children:state.error?<p role="alert">{state.error}<span className="seq-flow-actions"><button onClick={state.retry}>Retry saved model</button></span></p>:<p role="status">Loading the fixed inflection model…</p>}</div>;
}
export function SeqFittedQueryLab() {
  const s=useContext(FittedContext);
  return <FittedGate id="seq2seq-fitted"><FlowLab id="seq2seq-fitted" label="Fresh source-only generation">{s.base&&<><p>Encoder inputs:</p><Tokens tokens={s.base.ids}/><p>Generated outputs, including EOS when chosen:</p><Tokens tokens={s.base.tokens} computed/><FlowControls><SeqText name="Source lemma" value={s.lemma} onChange={s.setLemma}/><SeqSelect name="Grammatical request" value={s.feature} onChange={s.setFeature} options={['past','participle','third_person'].map(v=>[v,v])}/><FlowSlider name="Generated-token cap, including EOS" value={s.cap} min={1} max={16} step={1} onChange={s.setCap}/></FlowControls><FlowReadout>Fresh current-source context generates <strong>{s.base.word||'(empty string)'}</strong>; <strong>{s.base.ended?'EOS ended it':'CAPPED without EOS'}</strong>; raw log P <strong>{n(s.base.logProbability)}</strong>. {s.lemma==='emmove'&&s.feature==='past'?'This development source has reference emmoved.':s.lemma==='lactate'&&s.feature==='past'?'This training source has reference lactated.':'Edited query: no reference or correctness claim.'} Prefix and context interventions below do not change this own-context baseline.</FlowReadout><Reset onClick={s.reset}>Reset fitted investigation</Reset></>}</FlowLab></FittedGate>;
}
export function SeqFittedStateLab() {
  const s=useContext(FittedContext),selected=s.base?Math.min(s.step,s.base.steps.length-1):0;
  return <FittedGate id="seq2seq-state"><FlowLab id="seq2seq-state" label="Actual state and next-token distribution">{s.base&&<><SeqFittedStateFigure trace={s.base} step={selected} coordinate={s.coordinate}/><FlowControls><FlowSlider name="Decoder step" value={selected+1} min={1} max={s.base.steps.length} step={1} onChange={v=>s.setStep(v-1)}/><FlowSlider name="Hidden coordinate" value={s.coordinate} min={0} max={63} step={1} onChange={s.setCoordinate}/></FlowControls><FlowReadout>Step <strong>{selected+1}</strong> receives <strong>{token(s.base.steps[selected].previous)}</strong>, then selects <strong>{token(s.base.steps[selected].selected)}</strong>. State coordinate {s.coordinate} is <strong>{n(s.base.steps[selected].state[s.coordinate],8)}</strong>; P(chosen) is <strong>{n(s.base.steps[selected].probabilities[s.base.steps[selected].selected],8)}</strong>. The coordinate has no assigned linguistic meaning.</FlowReadout><NeuralTable caption="All 32 scores’ probabilities at the inspected step" headers={['Token','Probability']} rows={s.base.steps[selected].probabilities.map((p,i)=>[token(i),n(p,8)])}/></>}</FlowLab></FittedGate>;
}
export function SeqPrefixLab() {
  const s=useContext(FittedContext);
  return <FittedGate id="seq2seq-prefix"><FlowLab id="seq2seq-prefix" label="Forced previous tokens change only subsequent distributions">{s.prefixTrace&&<><SeqPrefixFigure baseline={s.base} edited={s.prefixTrace}/><p>Current source, own context, edited chosen prefix:</p><Tokens tokens={s.prefixTrace.tokens} computed/><FlowControls><SeqText name="Forced prefix; empty means greedy" value={s.prefix} onChange={s.setPrefix} min={0} max={6}/></FlowControls><FlowReadout>Forced prefix <strong>{s.prefix||'(none)'}</strong> produces <strong>{s.prefixTrace.word}</strong>; own-context baseline is the current query’s <strong>{s.base.word}</strong>. Their first distributions remain identical: P(e) <strong>{n(s.prefixTrace.steps[0].probabilities[10],8)}</strong>. A forced token enters the GRU only at the following step. {s.prefixTrace.ended?'EOS ended this route.':'This route is capped.'}</FlowReadout><Reset onClick={()=>s.setPrefix('')}>Clear forced prefix</Reset></>}</FlowLab></FittedGate>;
}
export function SeqContextLab() {
  const s=useContext(FittedContext);
  return <FittedGate id="seq2seq-context"><FlowLab id="seq2seq-context" label="Intervene on the full decoder initialization">{s.intervention&&<><SeqContextFigure source={s.base.context} other={s.other} used={s.context} coordinate={s.coordinate}/><FlowControls><FlowSlider name="Context gain" value={s.gain} min={0} max={1.5} step={.05} onChange={s.setGain}/><FlowSlider name="Mix toward lactate + past context" value={s.mix} min={0} max={1} step={.05} onChange={s.setMix}/></FlowControls><FlowReadout>Using gain <strong>{n(s.gain)}</strong> and mix <strong>{n(s.mix)}</strong> generates <strong>{s.intervention.word}</strong>; baseline with the current source, prefix and cap is <strong>{s.prefixTrace.word}</strong>. {s.gain===1&&s.mix===0?'The unchanged-context intervention is an exact null.':s.gain===0?'All 64 initial coordinates are zero.':''} {s.intervention.ended?'EOS ended the edited route.':'The edited route is capped.'} This intervention preserves the chosen source, forced prefix and fixed model weights.</FlowReadout><Reset onClick={()=>{s.setGain(1);s.setMix(0);}}>Restore current source context</Reset><NeuralTable caption="All context coordinates; every edited value enters the decoder" headers={['Coordinate','Current source','Lactate + past','Edited context']} rows={s.context.map((value,i)=>[i,n(s.base.context[i],8),n(s.other[i],8),n(value,8)])}/></>}</FlowLab></FittedGate>;
}
export function SeqFittedBeamLab() {
  const s=useContext(FittedContext),[width,setWidth]=useState(1),[cap,setCap]=useState(16),beam=useMemo(()=>s.weights?sequenceBeam(s.weights,s.lemma,s.feature,width,cap):null,[s.weights,s.lemma,s.feature,width,cap]);
  return <FittedGate id="seq2seq-fitted-beam"><FlowLab id="seq2seq-fitted-beam" label="Actual candidate-owned beam search">{beam&&<><SeqBeamOwnershipFigure candidates={beam.candidates} coordinate={s.coordinate}/><FlowControls><FlowSlider name="Fitted-model beam width" value={width} min={1} max={3} step={1} onChange={setWidth}/><FlowSlider name="Beam token cap, including EOS" value={cap} min={1} max={16} step={1} onChange={setCap}/></FlowControls><FlowReadout>Fresh own-context beam search on <strong>{s.lemma} + {s.feature}</strong> ranks <strong>{beam.candidates[0].tokens.map(token).join(' ')}</strong> first, log P <strong>{n(beam.candidates[0].logProbability)}</strong>. This separate search uses no forced prefix or edited context. States belong to candidates after consuming their previous token; a newly emitted last token is consumed only if another step follows.</FlowReadout><Reset onClick={()=>{setWidth(1);setCap(16);}}>Reset fitted beam</Reset></>}</FlowLab></FittedGate>;
}
