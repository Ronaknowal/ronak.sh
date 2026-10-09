import {createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {FlowControls,FlowLab,FlowReadout,FlowSlider,flowNumber as f} from './LessonFlow.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import {RingCells,RingFlowFigure,RingMatrix,RingSignedBars,RingWire,ringNumbers,ringPaint} from './RingAttentionFlowFigures.jsx';
import {RingFlowNumber,RingFlowSelect} from './RingAttentionFlowLabs.jsx';
import * as m from '../../data/ring-attention-models.js';
import examples from '../../data/ring-attention-examples.json';

const base='/learn-assets/ring-attention-sequence-parallelism/';
const Context=createContext(null),copy=x=>structuredClone(x),packets=new Map();
const fresh=()=>({source:0,points:copy(examples.real[0].points),point:22,head:0,query:22,key:0,channel:0,round:3,ranks:4,layout:'contiguous',direction:1,rename:false,pinned:null});
function loadPacket() {
  const url=base+'movement-attention-model.json';
  if(!packets.has(url))packets.set(url,fetch(url).then(response=>{if(!response.ok)throw Error(`Model unavailable (${response.status})`);return response.json();}).catch(error=>{packets.delete(url);throw error;}));
  return packets.get(url);
}
export function RingStudyProvider({children}) {
  const [state,setState]=useState(fresh),[packet,setPacket]=useState(null),[needed,setNeeded]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[resetToken,setResetToken]=useState(0);
  useEffect(()=>{if(!needed)return;let active=true;setFailed(false);loadPacket().then(value=>{if(active)setPacket(value);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[needed,attempt]);
  const owners=useMemo(()=>{const original=m.ownership(45,state.ranks,state.layout);return state.rename?[original.at(-1),...original.slice(0,-1)]:original;},[state.ranks,state.layout,state.rename]);
  const result=useMemo(()=>packet?m.movementInference(state.points,packet,owners,state.direction,{head:state.head,query:state.query}):null,[packet,state.points,owners,state.direction,state.head,state.query]);
  const original=useMemo(()=>packet?m.movementInference(examples.real[state.source].points,packet):null,[packet,state.source]);
  const value={state,setState,packet,result,original,owners,failed,setNeeded,resetToken,retry:()=>setAttempt(x=>x+1),reset:()=>{setState(fresh());setResetToken(x=>x+1);}};
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
function useStudy(){const s=useContext(Context);if(!s)throw Error('Ring model view requires its provider');return s;}
function useNeeded(ref) {const {setNeeded}=useStudy();useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNeeded(true);observer.disconnect();}},{rootMargin:'400px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[ref,setNeeded]);}
function Status(){const {failed,retry}=useStudy();return failed?<><p role="alert">The frozen model could not load. Your points and settings remain.</p><FlowControls><button type="button" onClick={retry}>Retry frozen Ring model</button></FlowControls></>:<p role="status">Loading the fixed model for this current input…</p>;}
const linear=(row,weight,bias)=>weight.map((w,i)=>m.dot(row,w)+(bias?.[i]??0));
function classifierTrace(features,heads,weights) {
  const joined=features.map((_,i)=>heads.flatMap(h=>h[i])),projected=joined.map(row=>linear(row,weights['mixer.output.weight'])),mixed=projected.map((row,i)=>row.map((v,c)=>v+features[i][c])),pooled=Array.from({length:24},(_,c)=>m.sum(mixed.map(row=>row[c]))/45),logits=linear(pooled,weights['classifier.weight'],weights['classifier.bias']);
  return {joined,projected,mixed,pooled,logits,probabilities:m.softmax(logits)};
}

function TensorImage({values,x,y,width,height,label,selected=-1,role=ringPaint.computed}) {
  const rows=values.length,cols=values[0].length,cw=width/cols,ch=height/rows,bound=Math.max(1e-12,...values.flat().map(Math.abs));
  return <g><text x={x} y={y-15}>{label}</text>{values.map((row,r)=>row.map((v,c)=><rect key={`${r}-${c}`} x={x+c*cw} y={y+r*ch} width={Math.max(0,cw-1)} height={Math.max(0,ch-1)} fill={role} fillOpacity={Math.abs(v)/bound*.75} stroke={v<0?ringPaint.input:'none'} strokeWidth={v<0?.5:0}/>))}{selected>=0&&<rect x={x-1} y={y+selected*ch-1} width={width+2} height={ch+2} fill="none" stroke="#fff"/>}<text x={x} y={y+height+19}>{rows}×{cols}</text></g>;
}
function PointPath({points,original,selected,query,donor,weights}) {
  const x=v=>40+v*260,y=v=>295-v*260;
  return <RingFlowFigure label="Raw trajectory on fixed equal x/y axes; disk area encodes actual current attention probability" height={390}>
    <line x1="40" x2="300" y1="295" y2="295" stroke={ringPaint.line}/><line x1="40" x2="40" y1="35" y2="295" stroke={ringPaint.line}/>
    {[0,.5,1].map(v=><g key={v}><text x={x(v)} y="319" textAnchor="middle">{v}</text><text x="29" y={y(v)+4} textAnchor="end">{v}</text></g>)}
    <polyline points={original.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke={ringPaint.line} strokeDasharray="4 4"/>
    <polyline points={points.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke={ringPaint.input}/>
    {points.map((p,i)=><g key={i}><circle cx={x(p[0])} cy={y(p[1])} r="1" fill={ringPaint.input}/>{weights&&<circle cx={x(p[0])} cy={y(p[1])} r={28*Math.sqrt(weights[i])} fill={ringPaint.computed} fillOpacity=".3"/>}{i===selected&&<circle cx={x(p[0])} cy={y(p[1])} r="5" fill="none" stroke="#fff"/>}{i===query&&<circle cx={x(p[0])} cy={y(p[1])} r="9" fill="none" stroke={ringPaint.computed}/>} {i===donor&&<path d={`M${x(p[0])-12} ${y(p[1])} H${x(p[0])+12} M${x(p[0])} ${y(p[1])-12} V${y(p[1])+12}`} stroke={ringPaint.parameter}/>}</g>)}
    <text x="18" y="350">x,y in[0,1] · dashed original, cyan current</text><text x="18" y="379">White edited · violet query · amber donor</text>
  </RingFlowFigure>;
}
function FoldedRow({row,label,paint=ringPaint.computed}) {
  const columns=4,values=Array.from({length:Math.ceil(row.length/columns)},(_,r)=>row.slice(r*columns,(r+1)*columns));
  return <RingFlowFigure label={label} height={85+values.length*38}><RingMatrix values={values} x={18} y={46} cell={77} rowCell={38} label={label} paint={paint}/><text x="18" y={77+values.length*38}>One row; folded only to fit this page.</text></RingFlowFigure>;
}

function InputAnatomy({state:s,packet,result}) {
  const centred=s.points.map(row=>row.map(v=>2*v-1)),selected=s.point,w=packet.state_dict,z=linear(centred[selected],w['stem.weight'],w['stem.bias']);
  return <div className="ring-flow-scenes"><RingFlowFigure label="All45 raw point rows become45 centred point rows; the selected row is outlined" height={430}>{({arrow})=><>
    <TensorImage values={s.points} x={18} y={56} width={80} height={270} label="Raw points" selected={selected} role={ringPaint.input}/><TensorImage values={centred} x={228} y={56} width={80} height={270} label="Centred" selected={selected} role={ringPaint.input}/>
    <RingWire path={`M99 ${56+selected*6+3} H224`} arrow={arrow}/><text x="110" y="31">2×point−1</text>
    <text x="18" y="383">row{selected}: [{ringNumbers(centred[selected])}]</text><text x="18" y="412">Same point ID; same fixed x/y units.</text>
  </>}</RingFlowFigure><RingFlowFigure label="Full learned24by2 stem map multiplies the selected centred two-coordinate row into24 products" height={455}>{({arrow})=><>
    <TensorImage values={w['stem.weight']} x={18} y={56} width={72} height={192} label="Stem W:24×2" role={ringPaint.parameter}/>
    <RingCells values={centred[selected]} x={164} y={56} cell={75} label="Centred row" paint={ringPaint.input}/>
    <circle cx="175" cy="310" r="17" fill="none" stroke={ringPaint.line}/><text x="175" y="315" textAnchor="middle">×</text>
    <RingWire path="M54 249 V310 H155" arrow={arrow}/><RingWire path="M238 86 V310 H195" arrow={arrow}/>
    <RingWire path="M175 329 V375" arrow={arrow}/><TensorImage values={[linear(centred[selected],w['stem.weight'])]} x={18} y={381} width={264} height={20} label="24 products · before bias"/>
    <text x="18" y="449">Same map at every point; no row averaging.</text>
  </>}</RingFlowFigure><RingFlowFigure label="Add the24 learned biases, then apply tanh channelwise to make the selected feature row" height={675}>{({arrow})=><>
    <TensorImage values={[linear(centred[selected],w['stem.weight'])]} x={18} y={48} width={264} height={20} label="Product row:1×24"/>
    <TensorImage values={[w['stem.bias']]} x={18} y={138} width={264} height={20} label="24 stem biases" role={ringPaint.parameter}/>
    <circle cx="175" cy="230" r="17" fill="none" stroke={ringPaint.line}/><text x="175" y="235" textAnchor="middle">+</text>
    <RingWire path="M283 58 H326 V230 H195" arrow={arrow}/><RingWire path="M150 159 V230 H155" arrow={arrow}/>
    <RingWire path="M175 249 V305" arrow={arrow}/><TensorImage values={[z]} x={18} y={311} width={264} height={20} label="Pre-activation z:1×24"/>
    <RingWire path="M150 332 V374" arrow={arrow}/><rect x="114" y="379" width="72" height="34" fill="none" stroke={ringPaint.line}/><text x="150" y="401" textAnchor="middle">tanh</text>
    <TensorImage values={result.features} x={18} y={480} width={264} height={135} label="Features:45×24" selected={selected}/>
    <RingWire path={`M150 414 V440 H7 V${480+selected*3+1.5} H14`} arrow={arrow}/>
    <text x="18" y="665">White: selected row. Cyan edge: negative.</text>
  </>}</RingFlowFigure><FoldedRow row={z} label={`Pre-tanh row${selected}`}/><FoldedRow row={result.features[selected]} label={`After tanh row${selected}`}/></div>;
}
function ProjectionAnatomy({state:s,packet,result}) {
  return <div className="ring-flow-scenes">{['query','key','value'].map(name=><RingFlowFigure key={name} label={`Full learned${name} map24by24 and current45by24 feature input; outputs split into two12-channel heads`} height={520}>{({arrow})=><>
    <TensorImage values={packet.state_dict[`mixer.${name}.weight`]} x={18} y={52} width={192} height={192} label={`W${name}:24×24`} role={ringPaint.parameter}/>
    <TensorImage values={result.features} x={243} y={52} width={72} height={192} label="Features" selected={s.query}/>
    <circle cx="175" cy="285" r="17" fill="none" stroke={ringPaint.line}/><text x="175" y="290" textAnchor="middle">×</text>
    <RingWire path="M114 245 V285 H154" arrow={arrow}/><RingWire path="M279 245 V285 H195" arrow={arrow}/>
    <text x="18" y="333">Features × Wᵀ · no projection bias</text>
    <TensorImage values={result[name][0]} x={18} y={372} width={132} height={90} label="head0:45×12" selected={s.query}/>
    <TensorImage values={result[name][1]} x={193} y={372} width={132} height={90} label="head1:45×12" selected={s.query}/>
    <RingWire path={`M175 303 V320 H7 V${372+s.query*2+1} H14`} arrow={arrow}/><RingWire path={`M175 320 H337 V${372+s.query*2+1} H329`} arrow={arrow}/>
    <text x="18" y="515">Split computed24 channels as12+12.</text>
  </>}</RingFlowFigure>)}</div>;
}
function JoinAnatomy({result,packet,state:s}) {
  const trace=classifierTrace(result.features,result.ring.output,packet.state_dict),row=s.query;
  return <div className="ring-flow-scenes"><RingFlowFigure label="Both full head outputs concatenate channelwise; no position is averaged at concat" height={470}>{({arrow})=><>
    <TensorImage values={result.ring.output[0]} x={18} y={55} width={108} height={135} label="O head0" selected={row}/>
    <TensorImage values={result.ring.output[1]} x={204} y={55} width={108} height={135} label="O head1" selected={row}/>
    <TensorImage values={trace.joined} x={60} y={285} width={216} height={135} label="Concatenated:45×24" selected={row}/>
    <RingWire path={`M72 191 V233 H45 V${285+row*3+1.5} H56`} arrow={arrow}/><RingWire path={`M258 191 V233 H290 V${285+row*3+1.5} H280`} arrow={arrow}/>
    <text x="18" y="464">Same row; head0 channels then head1.</text>
  </>}</RingFlowFigure><RingFlowFigure wide width={650} label="Current joined rows multiply the full learned output24by24 map to give projected rows" height={390}>{({arrow})=><>
    <TensorImage values={trace.joined} x={18} y={55} width={144} height={225} label="Joined:45×24" selected={row}/>
    <TensorImage values={packet.state_dict['mixer.output.weight']} x={237} y={55} width={144} height={144} label="Wout:24×24" role={ringPaint.parameter}/>
    <TensorImage values={trace.projected} x={475} y={55} width={144} height={225} label="Projected:45×24" selected={row}/>
    <circle cx="225" cy="326" r="17" fill="none" stroke={ringPaint.line}/><text x="225" y="331" textAnchor="middle">×</text>
    <RingWire path={`M162 ${55+row*5+2.5} H187 V326 H205`} arrow={arrow}/><RingWire path="M309 200 V253 H225 V306" arrow={arrow}/>
    <RingWire path={`M245 326 H448 V${55+row*5+2.5} H471`} arrow={arrow}/>
    <text x="18" y="376">Joined × Woutᵀ. No output bias. White line: the same row ID.</text>
  </>}</RingFlowFigure><RingFlowFigure label="Learned output projection and saved stem feature add at the same row and channel" height={470}>{({arrow})=><>
    <TensorImage values={trace.projected} x={18} y={55} width={132} height={135} label="Output map" selected={row}/>
    <TensorImage values={result.features} x={191} y={55} width={132} height={135} label="Saved stem" selected={row}/>
    <circle cx="175" cy="248" r="18" fill="none" stroke={ringPaint.line}/><text x="175" y="253" textAnchor="middle">+</text>
    <RingWire path="M84 191 V248 H155" arrow={arrow}/><RingWire path="M257 191 V248 H195" arrow={arrow}/>
    <TensorImage values={trace.mixed} x={66} y={313} width={216} height={90} label="Residual mixed:45×24" selected={row}/><RingWire path={`M175 267 V282 H50 V${313+row*2+1} H62`} arrow={arrow}/>
    <text x="18" y="456">Saved stem rows bypass the output map.</text>
  </>}</RingFlowFigure><FoldedRow row={trace.joined[row]} label={`Joined row${row}`}/><FoldedRow row={trace.mixed[row]} label={`Residual row${row}`}/></div>;
}
function TaskAnatomy({result,packet}) {
  const trace=classifierTrace(result.features,result.ring.output,packet.state_dict);
  return <div className="ring-flow-scenes"><RingFlowFigure label="All45 residual rows feed the same channelwise mean; row averaging leaves24 channels" height={345}>{({arrow})=><>
    <TensorImage values={trace.mixed} x={18} y={48} width={264} height={135} label="Mixed features:45×24"/>
    <RingWire path="M150 184 V218" arrow={arrow}/><circle cx="150" cy="238" r="18" fill="none" stroke={ringPaint.line}/><text x="150" y="243" textAnchor="middle">÷45</text>
    <text x="18" y="214">Sum45 rows separately in each channel</text><RingWire path="M150 257 V290" arrow={arrow}/><TensorImage values={[trace.pooled]} x={18} y={298} width={264} height={20} label="Mean row:1×24"/>
  </>}</RingFlowFigure><FoldedRow row={trace.pooled} label="Mean of45 rows:24 channels"/><RingFlowFigure label="Full pooled24-vector, classifier15by24 learned matrix and15 biases map to15 class logits" height={570}>{({arrow})=><>
    <TensorImage values={[trace.pooled]} x={18} y={50} width={264} height={20} label="Pooled:1×24"/>
    <TensorImage values={packet.state_dict['classifier.weight']} x={18} y={138} width={264} height={150} label="Classifier W:15×24" role={ringPaint.parameter}/>
    <circle cx="175" cy="346" r="17" fill="none" stroke={ringPaint.line}/><text x="175" y="351" textAnchor="middle">×</text>
    <RingWire path="M283 60 H324 V346 H195" arrow={arrow}/><RingWire path="M150 289 V318 H175 V326" arrow={arrow}/>
    <TensorImage values={[packet.state_dict['classifier.bias']]} x={18} y={411} width={132} height={20} label="15 learned biases" role={ringPaint.parameter}/>
    <circle cx="228" cy="421" r="17" fill="none" stroke={ringPaint.line}/><text x="228" y="426" textAnchor="middle">+</text>
    <RingWire path="M175 364 V387 H228 V401" arrow={arrow}/><RingWire path="M151 421 H208" arrow={arrow}/>
    <RingWire path="M228 439 V491" arrow={arrow}/><TensorImage values={[trace.logits]} x={18} y={497} width={264} height={20} label="15 current logits"/><text x="18" y="563">The target class does not enter this read.</text>
  </>}</RingFlowFigure><RingFlowFigure label="All fifteen actual logits exponentiate with one shared maximum and normalize by one shared sum" height={460}>{({arrow})=><>
    <TensorImage values={[trace.logits]} x={18} y={48} width={264} height={20} label="15 signed logits"/>
    <RingWire path="M150 69 V100" arrow={arrow}/><text x="18" y="125">exp(logit − maximum logit)</text>
    <TensorImage values={[trace.logits.map(v=>Math.exp(v-Math.max(...trace.logits)))]} x={18} y={160} width={264} height={20} label="15 positive masses"/>
    <text x="18" y="231">Sum = {f(m.sum(trace.logits.map(v=>Math.exp(v-Math.max(...trace.logits)))),8)}</text>
    <circle cx="175" cy="286" r="17" fill="none" stroke={ringPaint.line}/><text x="175" y="291" textAnchor="middle">÷</text>
    <RingWire path="M150 181 V207 H7 V286 H155" arrow={arrow}/><RingWire path="M250 239 V286 H195" arrow={arrow}/>
    <RingWire path="M175 304 V358" arrow={arrow}/><TensorImage values={[trace.probabilities]} x={18} y={364} width={264} height={20} label="15 normalized probabilities"/>
    <text x="18" y="448">One common divisor; probabilities sum to1.</text>
  </>}</RingFlowFigure><RingSignedBars values={trace.logits} labels={trace.logits.map((_,i)=>`class${i+1}`)} unit="All15 current class logits · signed"/></div>;
}

export function RingMovementFlowLab({view='input'}) {
  const ref=useRef(null);useNeeded(ref);
  const {state:s,setState,packet,result,original,owners,resetToken}=useStudy(),up=(name,value)=>setState(x=>({...x,[name]:value})),example=examples.real[s.source];
  const selectedWeights=result?.dense.weights[s.head][s.query],unchanged=s.points.every((p,i)=>p.every((v,c)=>v===example.points[i][c]));
  const source=index=>setState(x=>({...x,source:index,points:copy(examples.real[index].points),point:index===0?22:9,query:index===0?22:9,round:x.ranks-1}));
  const edit=(c,value)=>setState(x=>({...x,points:x.points.map((p,i)=>i===x.point?p.map((v,j)=>j===c?value:v):p)}));
  let drawing,controls;
  if(view==='source'||view==='edit'||view==='query') {
    drawing=<PointPath points={s.points} original={example.points} selected={s.point} query={s.query} donor={s.key} weights={view==='query'?selectedWeights:null}/>;
    controls=view==='source'?<RingFlowSelect label="Recorded source trajectory" value={s.source} onChange={value=>source(Number(value))} options={examples.real.map((e,i)=>[i,`source${e.source}, recorded class${e.label}`])}/>:view==='edit'?<><FlowSlider name="Point ID to edit" value={s.point} min={0} max={44} step={1} onChange={value=>up('point',value)}/>{[0,1].map(c=><RingFlowNumber key={c} resetToken={resetToken} label={`Point${s.point} ${c===0?'x':'y'}`} min={0} max={1} step={.01} value={s.points[s.point][c]} onChange={value=>edit(c,value)}/>)}</>:<><FlowSlider name="Query point ID" value={s.query} min={0} max={44} step={1} onChange={value=>up('query',value)}/><FlowSlider name="Actual learned head" value={s.head} min={0} max={1} step={1} onChange={value=>up('head',value)}/><FlowSlider name="Donor point ID" value={s.key} min={0} max={44} step={1} onChange={value=>up('key',value)}/></>;
  } else if(packet&&result) {
    if(view==='input')drawing=<InputAnatomy state={s} packet={packet} result={result}/>;
    else if(view==='projections')drawing=<ProjectionAnatomy state={s} packet={packet} result={result}/>;
    else if(view==='join')drawing=<JoinAnatomy state={s} packet={packet} result={result}/>;
    else if(view==='task')drawing=<TaskAnatomy result={result} packet={packet}/>;
    else if(view==='donor') {
      const q=result.query[s.head][s.query],k=result.key[s.head][s.key],v=result.value[s.head][s.key],probability=selectedWeights[s.key],products=q.map((v,c)=>v*k[c]);
      drawing=<><div className="ring-flow-scenes"><FoldedRow row={q} label={`Q:head${s.head},row${s.query}`}/><FoldedRow row={k} label={`K:head${s.head},row${s.key}`}/><FoldedRow row={products} label="Each Q×K channel product"/><FoldedRow row={v} label={`V:head${s.head},row${s.key}`}/><FoldedRow row={v.map(x=>probability*x)} label="This donor’s weighted V"/><FoldedRow row={result.ring.output[s.head][s.query]} label="Complete sum:all45 donors"/></div><p>Channel product sum{f(m.sum(products),8)} divided by√12 gives score{f(result.dense.scores[s.head][s.query][s.key],8)}. Normalization includes all45 keys; this donor probability is{f(probability,10)}.</p></>;
      controls=<FlowSlider name="Donor point ID" value={s.key} min={0} max={44} step={1} onChange={value=>up('key',value)}/>;
    } else if(view==='arrivals'||view==='ownership') {
      const round=Math.min(s.round,s.ranks-1),t=result.ring.trace[round];
      drawing=<><RingFlowFigure label="Current real-query accumulation; divide the numerator by mass, not by the maximum" height={375}>{({arrow})=><>
        <RingCells values={[t.maximum,t.total]} x={18} y={50} label="Current reference m · total mass ℓ" cell={150}/>
        <RingCells values={[t.numerator[s.channel]]} x={18} y={150} label={`Accumulated numerator u[${s.channel}]`} cell={150}/>
        <circle cx="200" cy="230" r="17" fill="none" stroke={ringPaint.line}/><text x="200" y="235" textAnchor="middle">÷</text>
        <RingWire path="M313 64 H337 V230 H220" arrow={arrow}/><RingWire path="M163 164 V230 H180" arrow={arrow}/>
        <RingWire path="M200 249 V293" arrow={arrow}/><RingCells values={[t.output[s.channel]]} x={122} y={298} cell={160}/>
        <text x="18" y="365">Visited read u/ℓ; m sets the reference.</text>
      </>}</RingFlowFigure><NeuralTable caption="Each actual KV arrival for this query" headers={['round/owner','point IDs','m','ℓ',`u[${s.channel}]`,`visited O[${s.channel}]`]} rows={result.ring.trace.map(t=>[`${t.step}/${t.owner}`,t.ids.join(','),f(t.maximum,6),f(t.total,6),f(t.numerator[s.channel],8),f(t.output[s.channel],8)])}/></>;
      controls=view==='arrivals'?<><FlowSlider name="Arrival round" value={round} min={0} max={s.ranks-1} step={1} onChange={value=>up('round',value)}/><FlowSlider name="Value channel" value={s.channel} min={0} max={11} step={1} onChange={value=>up('channel',value)}/></>:<><FlowSlider name="Position owners P" value={s.ranks} min={1} max={8} step={1} onChange={value=>setState(x=>({...x,ranks:value,round:value-1}))}/><RingFlowSelect label="Point storage assignment" value={s.layout} onChange={value=>up('layout',value)} options={['contiguous','striped'].map(name=>[name,name])}/><RingFlowSelect label="KV circulation" value={s.direction} onChange={value=>up('direction',Number(value))} options={[[1,'Forward'],[-1,'Reverse']]}/></>;
    } else if(view==='probabilities')drawing=<><RingSignedBars values={result.original.probabilities.map((v,i)=>v-original.original.probabilities[i])} labels={Array.from({length:15},(_,i)=>`class${i+1}`)} unit="Input-induced probability change · same fixed weights"/><NeuralTable caption="All15 classes: two distinct comparisons" headers={['class','original probability','current dense','current ring','current dense−original']} rows={result.original.probabilities.map((p,i)=>[i+1,original.original.probabilities[i].toPrecision(10),p.toPrecision(10),result.partitioned.probabilities[i].toPrecision(10),(p-original.original.probabilities[i]).toExponential(4)])}/></>;
    if(['input','projections','join','task'].includes(view))controls=<FlowSlider name="Row ID to inspect" value={s.point} min={0} max={44} step={1} onChange={value=>{up('point',value);up('query',value);}}/>;
  }
  const predicted=result?result.original.probabilities.indexOf(Math.max(...result.original.probabilities))+1:null;
  let readout;
  if(result) {
    if(view==='source'||view==='edit')readout=<>Source {example.source}, point {s.point} = [{ringNumbers(s.points[s.point])}]; original = [{ringNumbers(example.points[s.point])}]. {unchanged?`Unchanged recorded path, class ${example.label}.`:'Changed path; the original recorded class is not certified for this edit.'}</>;
    else if(view==='input')readout=<>Point {s.point} centres to [{ringNumbers(s.points[s.point].map(v=>2*v-1))}]. The stem creates the displayed 24-channel row after adding its 24 biases and applying tanh.</>;
    else if(view==='projections')readout=<>Row {s.query}'s current features create two heads, each with 12 query, key, value channels. Same 24×24 learned maps apply independently at all 45 positions.</>;
    else if(view==='join')readout=<>Row {s.query} concatenates both 12-channel reads into 24, maps those 24 channels, then adds the saved 24-channel stem row. Position IDs never change at this join.</>;
    else if(view==='task')readout=<>The current fixed model chooses class <strong>{predicted}</strong> from all 15 probabilities. Its 2,751 parameters are fixed. {unchanged?`Source ${example.source}'s recorded class is ${example.label}; the observed mistake is preserved.`:'This edited path has no certified class label.'}</>;
    else if(view==='query'||view==='donor')readout=<>Head {s.head}, query {s.query}, donor {s.key}: score {f(result.dense.scores[s.head][s.query][s.key],8)}, probability {f(selectedWeights[s.key],10)}. All 45 donor rows sum to the displayed 12-channel read; a donor selection only changes inspection.</>;
    else if(view==='ownership'||view==='arrivals')readout=<>{s.ranks} owners, head {s.head}, query {s.query}: all-current-input dense/ring attention difference <strong>{result.error.toExponential(3)}</strong>, classifier difference {m.maxError(result.original.probabilities,result.partitioned.probabilities).toExponential(3)}. Storage and circulation preserve these same edited points.</>;
    else readout=<>Source {example.source}, current class {predicted}; largest input-induced probability change <strong>{m.maxError(result.original.probabilities,original.original.probabilities).toExponential(6)}</strong>. Same-current-input dense/ring classifier difference {m.maxError(result.original.probabilities,result.partitioned.probabilities).toExponential(3)}. These are different questions.</>;
  }
  return <div ref={ref}><FlowLab label={`Same fixed learned model: ${view}`}>
    {drawing??<Status/>}{controls&&<FlowControls>{controls}</FlowControls>}
    {result?<FlowReadout>{readout}</FlowReadout>:drawing&&<Status/>}
  </FlowLab></div>;
}

export function RingStudyActions() {
  const {state:s,setState,result,reset}=useStudy();
  return <><FlowControls><button type="button" disabled={!result} onClick={()=>setState(x=>({...x,pinned:{...copy(x),pinned:null,probabilities:[...result.original.probabilities],attentionError:result.error}}))}>Pin complete model input and execution</button><button type="button" onClick={reset}>Reset model case</button></FlowControls>{s.pinned&&<p>Pinned source{examples.real[s.pinned.source].source},head{s.pinned.head},query{s.pinned.query},{s.pinned.ranks}owners,{s.pinned.layout},direction{s.pinned.direction}. All45 points and15 probabilities are retained; current probability difference{result?m.maxError(result.original.probabilities,s.pinned.probabilities).toExponential(6):'pending'}.</p>}</>;
}
export function RingFlowProgram({file,title}) {return <RemoteCodeBlock source={base+file} language="python" filename={file} title={title}/>;}
