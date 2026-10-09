import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { HybridFlowSelect } from './HybridMemoryFlowLabs.jsx';
import { HybridFlowDrawing, HybridFlowLabel, HybridFlowWire, HybridFlowMatrix, HybridFlowArray, HybridFlowOperation, hybridFlowRoles } from './HybridMemoryFlowFigures.jsx';
import { hybridStudy } from '../../data/hybrid-jamba-study.js';
import { hybridFlowStroke, hybridFlowContinuation, validateHybridFlowSnapshot } from '../../data/hybrid-memory-flow-models.js';

const base = '/learn-assets/hybrid-ssm-transformer-architectures-jamba/';
const StudyCase = createContext(null);
const modelCache = new Map();
const sourceById = id => hybridStudy.sources.find(source => source.id === id);
const initialCase = () => ({ model: 'MAM-37', source: 2970, coordinates: structuredClone(sourceById(2970).coordinates), point: 3, feature: 0, layer: 0, channel: 0, stateCoordinate: 0, classCoordinate: 1, boundary: 3,
  faults: { recurrent: false, history: false, kv: true, position: false, donor: false } });

function useSelectedModel(key, near) {
  const [resource, setResource] = useState(null), [error, setError] = useState(null), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!near) return;
    const controller = new AbortController();
    setResource(null); setError(null);
    if (modelCache.has(key)) { setResource({ key, data: modelCache.get(key) }); return () => controller.abort(); }
    fetch(`${base}model-${key}.json`, { signal: controller.signal }).then(response => {
      if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('The saved model response was unavailable.');
      return response.json();
    }).then(candidate => {
      if (controller.signal.aborted) return;
      const data = validateHybridFlowSnapshot(candidate, key);
      modelCache.set(key, data); setResource({ key, data });
    }).catch(problem => { if (!controller.signal.aborted) setError({ key, message: problem.message }); });
    return () => controller.abort();
  }, [key, near, attempt]);
  return { data: resource?.key === key ? resource.data : null, error: error?.key === key ? error.message : null, retry: () => setAttempt(value => value + 1) };
}

export function HybridMemoryStudyProvider({ children }) {
  const [study, setStudy] = useState(initialCase), [pin, setPin] = useState(null), [near, setNear] = useState(false);
  const resource = useSelectedModel(study.model, near);
  const run = useMemo(() => resource.data ? hybridFlowStroke(resource.data, study.coordinates) : null, [resource.data, study.coordinates]);
  return <StudyCase.Provider value={{ study, setStudy, pin, setPin, setNear, resource, run }}>{children}</StudyCase.Provider>;
}

function ModelStatus({ children }) {
  const { resource } = useContext(StudyCase);
  if (resource.error) return <p role="alert" className="hybrid-flow-error">The selected saved model could not load: {resource.error} Your current stroke and investigation settings are preserved. <button type="button" onClick={resource.retry}>Retry model loading</button></p>;
  if (!resource.data) return <p role="status">The selected small model loads as you reach this investigation. No other fitted model is requested.</p>;
  return children;
}

export function HybridStrokeDrawing({ coordinates, original = null, boundary = 8, selected = null }) {
  const x = value => 68 + value * 2.65, y = value => 346 - value * 2.65;
  return <HybridFlowDrawing id="pen-stroke" label="Actual eight spatially resampled pen positions with labelled x/y axes and direction arrows" width={420} height={original ? 500 : selected !== null ? 455 : 435}>
    {[0,50,100].map(value => <g key={value}>
      <line x1={x(value)} x2={x(value)} y1={81} y2={346} stroke="#444"/>
      <line x1={68} x2={333} y1={y(value)} y2={y(value)} stroke="#444"/>
      <HybridFlowLabel x={x(value)} y={379} anchor="middle">{value}</HybridFlowLabel>
      <HybridFlowLabel x={50} y={y(value)+5} anchor="end">{value}</HybridFlowLabel>
    </g>)}
    <HybridFlowLabel x={70} y={27}>Point 1 → point 8; x right, y up.</HybridFlowLabel>
    <HybridFlowLabel x={12} y={410}>{boundary < coordinates.length ? 'Cyan points; dashed continuation.' : 'Cyan: supplied coordinates.'}</HybridFlowLabel>
    <HybridFlowLabel x={350} y={377}>x →</HybridFlowLabel>
    <HybridFlowLabel x={10} y={58}>y ↑</HybridFlowLabel>
    {original && <polyline points={original.map(point=>`${x(point[0])},${y(point[1])}`).join(' ')} fill="none" stroke="#a5a5a5" strokeDasharray="5 4"/>}
    {coordinates.slice(1).map((point,index)=><g key={index}>
      <HybridFlowWire role="input" points={[[x(coordinates[index][0]),y(coordinates[index][1])],[x(point[0]),y(point[1])]]}/>
      {index>=boundary-1&&<line x1={x(coordinates[index][0])} y1={y(coordinates[index][1])} x2={x(point[0])} y2={y(point[1])} stroke="#080808" strokeWidth={2} strokeDasharray="3 5"/>}
    </g>)}
    {coordinates.map((point,index)=><g key={index}>
      <circle cx={x(point[0])} cy={y(point[1])} r={6} fill={hybridFlowRoles.input}/>
      {selected===index&&<circle cx={x(point[0])} cy={y(point[1])} r={12} fill="none" stroke="#eee"/>}
      <HybridFlowLabel x={Math.min(366,x(point[0])+14)} y={Math.max(71,y(point[1])-14)}>{index+1}</HybridFlowLabel>
    </g>)}
    {selected !== null && <HybridFlowLabel x={12} y={436}>A white ring identifies the edited point.</HybridFlowLabel>}
    {original && <HybridFlowLabel x={12} y={462}>Grey dashed path: original coordinates.</HybridFlowLabel>}
    {original && <HybridFlowLabel x={12} y={488}>No time or pen-lift measurements.</HybridFlowLabel>}
  </HybridFlowDrawing>;
}

export function HybridStudySelectionFlow() {
  const { study, setStudy, setNear, run } = useContext(StudyCase);
  const sentinel = useRef(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(entries => { if(entries.some(entry=>entry.isIntersecting)) { setNear(true); observer.disconnect(); } }, { rootMargin: '200px' });
    observer.observe(sentinel.current); return () => observer.disconnect();
  }, [setNear]);
  return <div ref={sentinel}><FlowLab id="hybrid-study-selection" label="Choose a saved model and a real validation source for every linked study view">
    <HybridStrokeDrawing coordinates={study.coordinates}/>
    <FlowControls>
      <HybridFlowSelect name="Saved small model" value={study.model} onChange={model=>setStudy(current=>({...current,model}))} options={hybridStudy.fits.filter(fit=>fit.pattern!=='linear').map(fit=>[fit.key,`${fit.key}: ${fit.parameters} parameters`])}/>
      <HybridFlowSelect name="Original validation source" value={study.source} onChange={value=>setStudy(current=>({...current,source:Number(value),coordinates:structuredClone(sourceById(Number(value)).coordinates)}))} options={hybridStudy.sources.map(source=>[source.id,`Source ${source.id}, original digit ${source.label}`])}/>
    </FlowControls>
    <ModelStatus><FlowReadout>The same saved {study.model} parameters process these eight points in every later view. Current uninterrupted class is <strong>{run?.probabilities.indexOf(Math.max(...run.probabilities))}</strong>. Changing the model keeps your edited coordinates; changing the original source supplies a different stated example.</FlowReadout></ModelStatus>
  </FlowLab></div>;
}

export function HybridStrokeEditFlow() {
  const { study, setStudy, run } = useContext(StudyCase);
  const original=sourceById(study.source),edited=study.coordinates.some((point,index)=>point.some((value,coordinate)=>value!==original.coordinates[index][coordinate]));
  const edit=(coordinate,value)=>setStudy(current=>({...current,coordinates:current.coordinates.map((point,index)=>point.map((old,column)=>index===current.point&&column===coordinate?value:old))}));
  return <FlowLab id="hybrid-study-edit" label="Edit one real point and observe the complete frozen model">
    <HybridStrokeDrawing coordinates={study.coordinates} original={original.coordinates} selected={study.point}/>
    <FlowControls>
      <FlowSlider name="Point to edit" value={study.point+1} min={1} max={8} step={1} onChange={value=>setStudy(current=>({...current,point:value-1}))}/>
      <FlowSlider name="Point x" value={study.coordinates[study.point][0]} min={0} max={100} step={1} onChange={value=>edit(0,value)}/>
      <FlowSlider name="Point y" value={study.coordinates[study.point][1]} min={0} max={100} step={1} onChange={value=>edit(1,value)}/>
    </FlowControls>
    <ModelStatus><FlowReadout>Current point {study.point+1} is ({study.coordinates[study.point].join(', ')}). The frozen model now returns class <strong>{run?.probabilities.indexOf(Math.max(...run.probabilities))}</strong>. {edited?'This edited shape has no newly assigned ground-truth label.':`The untouched validation record's original label is ${original.label}.`}</FlowReadout></ModelStatus>
  </FlowLab>;
}

export function HybridEmbeddingFlow() {
  const { study, setStudy, run, resource }=useContext(StudyCase);
  const frame=run?.frames[study.point];
  const names=['scaled x','scaled y','global position t/7','squared position'];
  return <FlowLab id="hybrid-study-embedding" label="Trace an actual input feature through one complete learned embedding row">
    <ModelStatus>{frame&&<>
      <HybridFlowArray values={frame.input} names={names} label="Four supplied features after fixed scaling" role="input"/>
      <HybridFlowMatrix matrix={[resource.data.state['embed.weight'][study.channel]]} rowNames={[`embedding output ${study.channel}`]} columnNames={names} label="Complete selected learned embedding row: four coefficients, output-by-input storage" role="parameter"/>
      <HybridFlowArray values={resource.data.state['embed.weight'][study.channel].map((value,index)=>value*frame.input[index])} names={names.map(name=>`coefficient × ${name}`)} label="Four contributions to the same affine output"/>
      <HybridFlowArray values={[resource.data.state['embed.bias'][study.channel],frame.layers[0].before[study.channel]]} names={['learned additive bias','sum of four terms + bias']} roles={['parameter','computed']} label="Selected embedding bias and exact output coordinate"/>
    </>}</ModelStatus>
    <FlowControls>
      <FlowSlider name="Input point to trace" value={study.point+1} min={1} max={8} step={1} onChange={value=>setStudy(current=>({...current,point:value-1}))}/>
      <FlowSlider name="Embedding output coordinate" value={study.channel} min={0} max={15} step={1} onChange={channel=>setStudy(current=>({...current,channel}))}/>
      <HybridFlowSelect name="Input feature to follow" value={study.feature} onChange={value=>setStudy(current=>({...current,feature:Number(value)}))} options={names.map((name,index)=>[index,name])}/>
    </FlowControls>
    <ModelStatus><FlowReadout>At point {study.point+1}, {names[study.feature]} contributes <strong>{frame&&number(frame.input[study.feature]*resource.data.state['embed.weight'][study.channel][study.feature])}</strong> to embedding coordinate {study.channel}. The other three terms and bias remain part of its actual sum. The position tag uses the original global index {study.point}, including after a resumed chunk.</FlowReadout></ModelStatus>
  </FlowLab>;
}

export function HybridStudyArchitectureDrawing() {
  const { study }=useContext(StudyCase);
  const pattern=study.model.split('-')[0];
  return <HybridFlowDrawing id="trained-stack" label="The actual saved small model contains three causal mixers with two residual additions per layer and a final last-position readout" width={620} height={1425}>
    <HybridFlowLabel x={330} y={30} role="input" anchor="middle">4 input features → 16 embedding coordinates</HybridFlowLabel>
    <HybridFlowWire points={[[330,43],[330,77]]}/>
    {[0,1,2].map(layer=><g key={layer}>
      <HybridFlowLabel x={15} y={110+layer*430}>depth layer {layer}</HybridFlowLabel>
      <HybridFlowOperation x={330} y={100+layer*430} name="RMSNorm" width={122}/>
      <HybridFlowWire points={[[330,123+layer*430],[330,147+layer*430]]}/>
      <HybridFlowOperation x={330} y={170+layer*430} name={pattern[layer]==='M'?'selective':'attention'} width={128}/>
      <HybridFlowWire points={[[330,193+layer*430],[330,211+layer*430]]}/>
      <circle cx={330} cy={228+layer*430} r={17} fill="#080808" stroke={hybridFlowRoles.operation}/>
      <HybridFlowLabel x={330} y={234+layer*430} anchor="middle">+</HybridFlowLabel>
      <HybridFlowWire points={[[330,65+layer*430],[200,65+layer*430],[200,228+layer*430],[313,228+layer*430]]}/>
      <HybridFlowLabel x={207} y={201+layer*430}>carry x</HybridFlowLabel>
      <HybridFlowWire points={[[330,246+layer*430],[330,257+layer*430]]}/>
      <HybridFlowOperation x={330} y={280+layer*430} name="RMSNorm" width={122}/>
      <HybridFlowWire points={[[330,303+layer*430],[330,321+layer*430]]}/>
      <HybridFlowOperation x={330} y={344+layer*430} name="SwiGLU" width={122}/>
      <HybridFlowWire points={[[330,368+layer*430],[330,383+layer*430]]}/>
      <circle cx={330} cy={400+layer*430} r={17} fill="#080808" stroke={hybridFlowRoles.operation}/>
      <HybridFlowLabel x={330} y={406+layer*430} anchor="middle">+</HybridFlowLabel>
      <HybridFlowWire points={[[330,250+layer*430],[535,250+layer*430],[535,400+layer*430],[348,400+layer*430]]}/>
      <HybridFlowLabel x={546} y={334+layer*430}>carry u</HybridFlowLabel>
      {layer<2&&<HybridFlowWire points={[[330,418+layer*430],[330,507+layer*430]]}/>}
      {pattern[layer]==='M'?<>
        <rect x={15} y={142+layer*430} width={140} height={100} fill="none" stroke={hybridFlowRoles.computed}/>
        <HybridFlowLabel x={85} y={172+layer*430} anchor="middle">H:16×4</HybridFlowLabel>
        <HybridFlowLabel x={85} y={212+layer*430} anchor="middle">history:16×2</HybridFlowLabel>
        <HybridFlowWire points={[[155,177+layer*430],[265,177+layer*430]]}/>
      </>:<>
        <rect x={425} y={142+layer*430} width={170} height={83} fill="none" stroke={hybridFlowRoles.computed}/>
        <HybridFlowLabel x={510} y={172+layer*430} anchor="middle">K,V each</HybridFlowLabel>
        <HybridFlowLabel x={510} y={207+layer*430} anchor="middle">positions×16</HybridFlowLabel>
        <HybridFlowWire points={[[425,177+layer*430],[396,177+layer*430]]}/>
      </>}
    </g>)}
    <HybridFlowWire points={[[330,1278],[330,1305]]}/>
    <HybridFlowLabel x={330} y={1335} anchor="middle">Last-position RMSNorm → 10 learned readout rows</HybridFlowLabel>
    <HybridFlowLabel x={330} y={1386} role="computed" anchor="middle">10 logits → softmax → 10 probabilities</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridLayerTraceFlow() {
  const { study, setStudy, run }=useContext(StudyCase);
  const layer=run?.frames[study.point].layers[study.layer];
  const rows=layer?['input','first normalized input','mixer output','first residual u','FFN normalized input','FFN output','second residual output'].map((_,index)=>[layer.before,layer.normalized,layer.mixed,layer.intermediate,layer.normalizedFfn,layer.ffn,layer.output][index][study.channel]):[];
  return <FlowLab id="hybrid-study-layer" label="Trace one coordinate through both actual residual updates">
    <ModelStatus>{layer&&<HybridFlowArray values={rows} names={['input x','RMSNorm(x)','mixer','u=x+mixer','RMSNorm(u)','SwiGLU FFN','output=u+FFN']} label="Exact selected coordinate through the saved layer"/>}</ModelStatus>
    <FlowControls>
      <FlowSlider name="Point to trace" value={study.point+1} min={1} max={8} step={1} onChange={value=>setStudy(current=>({...current,point:value-1}))}/>
      <FlowSlider name="Depth layer" value={study.layer} min={0} max={2} step={1} onChange={layer=>setStudy(current=>({...current,layer}))}/>
      <FlowSlider name="Vector coordinate" value={study.channel} min={0} max={15} step={1} onChange={channel=>setStudy(current=>({...current,channel}))}/>
    </FlowControls>
    <ModelStatus><FlowReadout>Layer {study.layer} uses {layer?.kind==='M'?'a selective state update':'causal attention'}. Coordinate {study.channel} retains its input at the first addition and retains u at the second addition; its actual final value is <strong>{layer&&number(layer.output[study.channel])}</strong>. The FFN acts on the normalized complete vector, not on this displayed coordinate alone.</FlowReadout></ModelStatus>
  </FlowLab>;
}

export function HybridStateCellFlow() {
  const { study, setStudy, run }=useContext(StudyCase);
  const layer=run?.frames[study.point].layers[study.layer];
  const frame=run?.frames[study.point];
  const previous=study.point?run?.frames[study.point-1].layers[study.layer]:null;
  const active=layer?.kind==='M';
  const p=study.channel,n=study.stateCoordinate;
  return <FlowLab id="hybrid-study-state" label="Inspect one actual selective cell, its old history and full state row">
    <ModelStatus>{active?<>
      <HybridFlowMatrix matrix={[layer.window[p]]} rowNames={[`channel ${p} projected window`]} columnNames={['stored t−2','stored t−1','current projected']} label="Actual causal convolution operands"/>
      <HybridFlowArray values={[layer.u[p],layer.delta[p],layer.write[n],layer.read[n]]} names={['transformed u','positive Δ','shared write B','shared read C']} label="Computed selective coefficients"/>
      <HybridFlowMatrix matrix={[[previous?.state[p][n]??0,layer.decay[p][n],layer.retained[p][n],layer.written[p][n],layer.state[p][n]]]} rowNames={[`H[channel ${p}, state ${n}]`]} columnNames={['old state','decay','retained','written','new state']} label="Complete actual scalar transition: old×decay + current write"/>
      <HybridFlowMatrix matrix={[layer.state[p],layer.read,layer.state[p].map((value,index)=>value*layer.read[index])]} rowNames={['new H row','read C','cell×read coefficient']} columnNames={[0,1,2,3].map(index=>`state ${index}`)} label="All four cells participating in the channel's read contraction"/>
      <HybridFlowArray values={[layer.value[p],layer.gate[p],layer.gated[p]]} names={['read contraction + D×u','output-gate precursor','post-SiLU gate product']} label="Actual channel read and gate before the learned output projection"/>
    </>:layer&&<p>This selected layer stores attention keys and values, not a selective H cell. Its state-coordinate controls do not apply. Follow its actual attention row in the next view or select an M layer above.</p>}</ModelStatus>
    {active&&<FlowControls>
      <FlowSlider name="Selective channel" value={p} min={0} max={15} step={1} onChange={channel=>setStudy(current=>({...current,channel}))}/>
      <FlowSlider name="State coordinate" value={n} min={0} max={3} step={1} onChange={stateCoordinate=>setStudy(current=>({...current,stateCoordinate}))}/>
      <FlowSlider name="Current point" value={study.point+1} min={1} max={8} step={1} onChange={value=>setStudy(current=>({...current,point:value-1}))}/>
    </FlowControls>}
    {active&&<FlowReadout>At global index {frame.position}, H[{p},{n}] becomes <strong>{number(layer.state[p][n])}</strong>. Every displayed value comes from the current edited stroke and selected saved model. Output projection later mixes the sixteen gated channel values; one cell alone is not a classifier decision.</FlowReadout>}
  </FlowLab>;
}

export function HybridAttentionCellFlow() {
  const { study, setStudy, run }=useContext(StudyCase);
  const layer=run?.frames[study.point].layers[study.layer],active=layer?.kind==='A';
  const [position,setPosition]=useState(0),selected=Math.min(position,study.point);
  return <FlowLab id="hybrid-study-attention" label="Trace all current query-key scores and one selected value coordinate">
    <ModelStatus>{active?<>
      <HybridFlowMatrix matrix={layer.keys.map((key,index)=>[key[study.channel],layer.query[study.channel],layer.scores[index],layer.weights[index],layer.values[index][study.channel],layer.weights[index]*layer.values[index][study.channel]])} rowNames={layer.keys.map((_,index)=>`stored position ${index}`)} columnNames={['key coordinate','query coordinate','full dot/4','row weight','value coordinate','weighted value']} selectedRow={selected} label="One causal attention row; full scores sum all sixteen query/key products, including the current position"/>
      <HybridFlowArray values={[layer.query[study.channel],layer.read[study.channel]]} names={['current query coordinate','sum of weighted stored values']} label="Selected query and exact read coordinate"/>
    </>:layer&&<p>This selected layer carries a selective state and short convolution history. It has no separately retained attention K/V bank. Choose an A layer in the layer view to inspect an addressable row.</p>}</ModelStatus>
    {active&&<FlowControls>
      <FlowSlider name="Query point" value={study.point+1} min={1} max={8} step={1} onChange={value=>setStudy(current=>({...current,point:value-1}))}/>
      <FlowSlider name="Stored position to highlight" value={selected} min={0} max={study.point} step={1} onChange={setPosition}/>
      <FlowSlider name="Vector coordinate" value={study.channel} min={0} max={15} step={1} onChange={channel=>setStudy(current=>({...current,channel}))}/>
    </FlowControls>}
    {active&&<FlowReadout>The current query can read positions 0 through {study.point}, including itself. The displayed contributions sum to <strong>{number(layer.read[study.channel])}</strong>; the learned output projection then mixes all sixteen read coordinates.</FlowReadout>}
  </FlowLab>;
}

export function HybridClassifierFlow() {
  const { study, setStudy, run, resource }=useContext(StudyCase);
  const frame=run?.frames[study.point],digit=study.classCoordinate,coordinate=study.channel;
  const weights=resource.data?.state['classifier.weight'][digit],bias=resource.data?.state['classifier.bias'][digit];
  return <FlowLab id="hybrid-study-classifier" label="Inspect one complete classifier row before comparing all ten probabilities">
    <ModelStatus>{frame&&<>
      <HybridFlowMatrix matrix={[frame.hidden,frame.normalized,weights,weights.map((value,index)=>value*frame.normalized[index])]} rowNames={['last layer output','final RMSNorm output',`learned digit ${digit} row`,'coefficient×normalized coordinate']} columnNames={Array.from({length:16},(_,index)=>`coordinate ${index}`)} label="Complete selected classifier calculation: all sixteen terms remain inspectable"/>
      <HybridFlowArray values={[bias,frame.logits[digit]]} names={['learned readout bias','sum of all terms + bias']} roles={['parameter','computed']} label="Selected class logit"/>
      <HybridProbabilityDrawing probabilities={softmaxForDisplay(frame.logits)} label="Current complete class probability vector"/>
    </>}</ModelStatus>
    <FlowControls>
      <FlowSlider name="Readout point" value={study.point+1} min={1} max={8} step={1} onChange={value=>setStudy(current=>({...current,point:value-1}))}/>
      <FlowSlider name="Classifier row: digit" value={digit} min={0} max={9} step={1} onChange={classCoordinate=>setStudy(current=>({...current,classCoordinate}))}/>
      <FlowSlider name="Contribution coordinate" value={coordinate} min={0} max={15} step={1} onChange={channel=>setStudy(current=>({...current,channel}))}/>
    </FlowControls>
    <ModelStatus><FlowReadout>Coordinate {coordinate} contributes {frame&&number(weights[coordinate]*frame.normalized[coordinate])} to digit {digit}'s logit <strong>{frame&&number(frame.logits[digit])}</strong>. All ten logits share one softmax denominator. Earlier readout points are diagnostics: training supervised only point 8.</FlowReadout></ModelStatus>
  </FlowLab>;
}

function softmaxForDisplay(values) {
  const maximum=Math.max(...values),masses=values.map(value=>Math.exp(value-maximum)),total=masses.reduce((sum,value)=>sum+value,0);
  return masses.map(value=>value/total);
}

export function HybridProbabilityDrawing({ probabilities, comparison=null, label }) {
  return <HybridFlowDrawing id="class-probabilities" label={label} width={580} height={530}>
    <HybridFlowLabel x={12} y={28}>{comparison ? 'Digit; violet uninterrupted; white outline: branch.' : 'Digit; violet: current probability.'}</HybridFlowLabel>
    {probabilities.map((value,index)=><g key={index}>
      <HybridFlowLabel x={12} y={73+index*42}>{index}</HybridFlowLabel>
      <rect x={50} y={52+index*42} width={330*value} height={14} fill={hybridFlowRoles.computed}/>
      {comparison&&<rect x={50} y={68+index*42} width={330*comparison[index]} height={10} fill="none" stroke="#eee"/>}
      <HybridFlowLabel x={395} y={73+index*42} role="computed">{number(value,6)}{comparison?` / ${number(comparison[index],6)}`:''}</HybridFlowLabel>
    </g>)}
    <HybridFlowLabel x={12} y={518}>A full bar of 330 units represents probability 1.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridTrainingHistoriesDrawing() {
  const [logarithmic,setLogarithmic]=useState(false);
  const values=hybridStudy.fits.flatMap(fit=>fit.history.map(row=>logarithmic?Math.log10(row.validation):row.validation));
  const low=logarithmic?Math.floor(Math.min(...values)):0,high=Math.ceil(Math.max(...values));
  const x=epoch=>80+(epoch-1)*500/79,y=value=>340-260*(value-low)/(high-low);
  const styles=[{color:'#ddd',dash:null},{color:'#c5a5e8',dash:'9 4'},
    {color:'#79c8e8',dash:'2 4'},{color:'#e6bb60',dash:'12 4 2 4'},
    {color:'#eea782',dash:'5 3'},{color:'#9ba9d2',dash:'14 5'}];
  return <FlowLab id="hybrid-study-histories" label="Inspect every saved validation history without smoothing or rerunning the fits">
    <HybridFlowDrawing id="fit-histories" label="All six measured validation-cross-entropy histories and their selected epochs" width={930} height={430} caption="Each named curve is connected to its actual final point. Colours and distinct dash patterns identify the six fits; outlined dots mark the chosen validation epochs.">
      <HybridFlowLabel x={12} y={28}>{logarithmic?'log10(validation CE)':'Validation CE (nats / record)'} ↑</HybridFlowLabel>
      {[0,1,2,3,4].map(index=>{const value=low+(high-low)*index/4;return <g key={index}><line x1={80} x2={580} y1={y(value)} y2={y(value)} stroke="#333"/><HybridFlowLabel x={65} y={y(value)+5} anchor="end">{number(value,3)}</HybridFlowLabel></g>;})}
      {[1,20,40,60,80].map(epoch=><HybridFlowLabel key={epoch} x={x(epoch)} y={375} anchor="middle">{epoch}</HybridFlowLabel>)}
      <HybridFlowLabel x={580} y={410} anchor="end">training epoch →</HybridFlowLabel>
      {hybridStudy.fits.map((fit,index)=>{
        const row=fit.history[fit.selected_epoch-1],value=logarithmic?Math.log10(row.validation):row.validation;
        const last = fit.history.at(-1), lastValue = logarithmic ? Math.log10(last.validation) : last.validation;
        return <g key={fit.key}>
          <polyline points={fit.history.map(row=>`${x(row.epoch)},${y(logarithmic?Math.log10(row.validation):row.validation)}`).join(' ')} fill="none" stroke={styles[index].color} strokeDasharray={styles[index].dash} strokeWidth={1.8}/>
          <circle cx={x(row.epoch)} cy={y(value)} r={5} fill="#080808" stroke={styles[index].color}/>
          <polyline points={`580,${y(lastValue)} 605,${96+index*43} 625,${96+index*43}`} fill="none" stroke={styles[index].color} strokeDasharray={styles[index].dash}/>
          <text x={635} y={102+index*43} fill={styles[index].color}>{fit.key}; selected epoch {fit.selected_epoch}</text>
        </g>;
      })}
    </HybridFlowDrawing>
    <FlowControls><HybridFlowSelect name="Validation axis" value={logarithmic?'log':'linear'} onChange={value=>setLogarithmic(value==='log')} options={[["linear","Cross-entropy in nats"],["log","log10 of cross-entropy"]]}/></FlowControls>
    <FlowReadout>All six 80-epoch histories are retained: 480 actual rows. Each outlined point marks that fit's earliest minimum validation cross-entropy; assessment results were not used to choose its epoch.</FlowReadout>
    <HybridFlowMatrix matrix={hybridStudy.fits.map(fit=>[fit.parameters,fit.selected_epoch,fit.metrics.fit.errors,fit.metrics.validation.errors,fit.metrics.assessment.errors])} rowNames={hybridStudy.fits.map(fit=>fit.key)} columnNames={['parameters','selected epoch','fit errors /1000','validation errors /300','assessment errors /3498']} label="All retained measured outcomes; both MAM seeds and the linear baseline remain distinct"/>
  </FlowLab>;
}

function useContinuation() {
  const {study,resource}=useContext(StudyCase);
  const donor=hybridStudy.sources.find(source=>source.id!==study.source);
  return useMemo(()=>resource.data?hybridFlowContinuation(resource.data,study.coordinates,study.boundary,study.faults,donor.coordinates):null,[resource.data,study.coordinates,study.boundary,study.faults,donor]);
}

export function HybridContinuationDrawing({ result }) {
  const { study }=useContext(StudyCase);
  if(!result)return null;
  return <>
    <HybridProbabilityDrawing probabilities={result.full.probabilities} comparison={result.probabilities} label="The uninterrupted and current fault-branch complete probability vectors"/>
    <HybridFlowMatrix matrix={result.positionDifferences.map((value,position)=>[position+1,value])} rowNames={result.positionDifferences.map((_,position)=>`global position ${position}`)} columnNames={['point number','maximum absolute logit change']} label="Each produced prefix is compared coordinate by coordinate; unchanged class alone is insufficient"/>
    <p>Current boundary after {study.boundary} points; uninterrupted class {result.fullPrediction}, branch class {result.prediction}. Maximum logit difference across every position and class: {result.difference.toExponential(8)}.</p>
  </>;
}

function FaultCheckbox({ name, field }) {
  const {study,setStudy}=useContext(StudyCase);
  return <label className="hybrid-flow-checkbox"><input type="checkbox" checked={study.faults[field]} onChange={event=>setStudy(current=>({...current,faults:{...current.faults,[field]:event.target.checked}}))}/><span>{name}</span></label>;
}

export function HybridContinuationFlow({ view='boundary' }) {
  const {study,setStudy}=useContext(StudyCase),result=useContinuation();
  return <FlowLab id={`hybrid-study-continuation-${view}`} label={`Apply the separately taught ${view} intervention to a cloned prefix`}>
    <ModelStatus><HybridContinuationDrawing result={result}/></ModelStatus>
    <FlowControls>
      {view==='boundary'&&<><FlowSlider name="Boundary after this many points" value={study.boundary} min={0} max={8} step={1} onChange={boundary=>setStudy(current=>({...current,boundary}))}/><FaultCheckbox name="Clear H and its short history" field="recurrent"/></>}
      {view==='separate'&&<><FaultCheckbox name="Clear only convolution history" field="history"/><FaultCheckbox name="Clear only attention K/V" field="kv"/></>}
      {view==='position'&&<FaultCheckbox name="Restart supplied logical position at zero" field="position"/>}
      {view==='identity'&&<FaultCheckbox name="Borrow a different request's prefix cache" field="donor"/>}
    </FlowControls>
    <ModelStatus><FlowReadout>{result&&<>The cloned branch differs by <strong>{result.difference.toExponential(8)}</strong> logit units. {study.boundary===0||study.boundary===8?'No carried-prefix intervention can affect an already empty prefix or an empty remaining suffix here.':'All selected fault flags apply independently to the same prefix; later controls keep earlier flags rather than silently changing the experiment.'}</>}</FlowReadout></ModelStatus>
    {view==='identity'&&<p>Donor source {hybridStudy.sources.find(source=>source.id!==study.source).id} supplies its own prefix at the same boundary. The current request keeps its edited suffix. This is an intentional identity violation for diagnosis, not a normal reuse optimization.</p>}
  </FlowLab>;
}

export function HybridPrefixCacheFlow() {
  const {study,setStudy,resource}=useContext(StudyCase),result=useContinuation();
  const cache=result?.prefixCache[study.layer],kind=resource.data?.pattern[study.layer];
  const first=cache?(kind==='M'?[cache.state[study.channel]]:cache.keys):[];
  const second=cache?(kind==='M'?[cache.history[study.channel]]:cache.values):[];
  return <FlowLab id="hybrid-study-cache" label="Inspect the actual carried prefix before any damage">
    <ModelStatus>{cache?<>
      <HybridFlowMatrix matrix={first} rowNames={kind==='M'?[`channel ${study.channel}`]:first.map((_,index)=>`prefix position ${index}`)} columnNames={kind==='M'?[0,1,2,3].map(index=>`state ${index}`):Array.from({length:16},(_,index)=>`key coordinate ${index}`)} label={kind==='M'?'Original H row before the fault':'Original complete retained K bank before the fault'}/>
      <HybridFlowMatrix matrix={second} rowNames={kind==='M'?[`channel ${study.channel}`]:second.map((_,index)=>`prefix position ${index}`)} columnNames={kind==='M'?['projected t−2','projected t−1']:Array.from({length:16},(_,index)=>`value coordinate ${index}`)} label={kind==='M'?'Original two projected history slots':'Original complete retained V bank'}/>
    </>:<p>This boundary has an empty prefix. No cache value has yet been written.</p>}</ModelStatus>
    <FlowControls>
      <FlowSlider name="Cache depth layer" value={study.layer} min={0} max={2} step={1} onChange={layer=>setStudy(current=>({...current,layer}))}/>
      {kind==='M'&&<FlowSlider name="Recurrent channel to inspect" value={study.channel} min={0} max={15} step={1} onChange={channel=>setStudy(current=>({...current,channel}))}/>}
      <FlowSlider name="Prefix boundary" value={study.boundary} min={0} max={8} step={1} onChange={boundary=>setStudy(current=>({...current,boundary}))}/>
    </FlowControls>
    <FlowReadout>Layer {study.layer}'s cache belongs to the prefix ending after {study.boundary} points. {kind==='M'?'Its complete allocation has 16×4 state values and 16×2 projected history values.':`Its two banks each contain ${study.boundary}×16 values.`} These are input-specific representations, not shared model weights.</FlowReadout>
  </FlowLab>;
}

export function HybridStudyCaseFlow() {
  const {study,setStudy,pin,setPin,run}=useContext(StudyCase);
  return <FlowLab id="hybrid-study-case" label="Pin an immutable complete model/input/fault case or reset every study view">
    <HybridStrokeDrawing coordinates={study.coordinates} boundary={study.boundary}/>
    <FlowControls>
      <button type="button" onClick={()=>setPin(structuredClone(study))}>Pin complete study case</button>
      <button type="button" onClick={()=>{setStudy(initialCase());setPin(null);}}>Reset every linked study view</button>
      <button type="button" onClick={()=>setStudy(current=>({...current,coordinates:structuredClone(sourceById(current.source).coordinates)}))}>Restore source coordinates</button>
    </FlowControls>
    <FlowReadout>{pin?<>The pin preserves model {pin.model}, source {pin.source}, all eight point pairs, every selection, boundary {pin.boundary} and all five independent fault flags. Further edits cannot mutate it.</>:<>Reset returns all views to source 2970, MAM-37 and the stated K/V-clearing intervention. Restore changes only coordinates; it keeps the model, boundary and fault choices.</>}</FlowReadout>
    {pin&&<p>Pinned points: {pin.coordinates.map(point=>`(${point.join(', ')})`).join(' → ')}. Active faults: {Object.entries(pin.faults).filter(([,value])=>value).map(([name])=>name).join(', ')||'none'}.</p>}
    {run&&<p>Current uninterrupted probability vector: [{run.probabilities.map(value=>number(value,7)).join(', ')}].</p>}
  </FlowLab>;
}

export function HybridFlowProgram({ file }) {
  return <RemoteCodeBlock source={base+file} filename={file} language="python" title={`Complete ${file}`}/>;
}

export function HybridFlowDownloads() {
  const files=['hybrid_mechanisms.py','stroke_models.py','inspect_stroke.py','hybrid_cache_tools.py','deployment_example.py','pendigits.tra','pendigits.tes','pendigits.names','stroke-fits.npz','stroke-results.json','data-provenance.md'];
  return <ul className="hybrid-flow-downloads">{files.map(file=><li key={file}><a href={base+file} download>{file}</a></li>)}</ul>;
}
