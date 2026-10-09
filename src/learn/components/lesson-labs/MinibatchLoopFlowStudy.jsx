import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { MinibatchNumber, MinibatchSelect } from './MinibatchLoopFlowLabs.jsx';
import { MinibatchDrawing, MbOperand, MbOperation, MbWire, MbArray, MinibatchTable, mbColors } from './MinibatchLoopFlowFigures.jsx';
import { minibatchNumber as f } from '../../data/minibatch-loop-flow-models.js';
import { irisGroupAccumulation } from '../../data/minibatch-loop-models.js';
import { minibatchStudy as data } from '../../data/minibatch-loop-study.js';
const base='/learn-assets/mini-batches-training-loops-gradient-accumulation/';
const IrisContext=createContext(null), names=['Sepal length','Sepal width','Petal length','Petal width'];

export function MinibatchIrisProvider({children}) {
  const [kind,setKind]=useState('initial'),[count,setCount]=useState(32),[physical,setPhysical]=useState(12),[edited,setEdited]=useState(()=>structuredClone(data.records)),[selected,setSelected]=useState(0),[feature,setFeature]=useState(0),[classIndex,setClass]=useState(0),[hiddenIndex,setHidden]=useState(0),[revision,setRevision]=useState(0),[resource,setResource]=useState(null),[failed,setFailed]=useState(null),[attempt,setAttempt]=useState(0),[visible,setVisible]=useState(false);
  const anchor=useRef(null);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'220px'});if(anchor.current)observer.observe(anchor.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(!visible)return;const controller=new AbortController();setResource(null);setFailed(null);fetch(`${base}iris-${kind}.json`,{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('Saved model unavailable');return response.json();}).then(value=>{if(!controller.signal.aborted)setResource({kind,value});}).catch(()=>{if(!controller.signal.aborted)setFailed(kind);});return()=>controller.abort();},[kind,attempt,visible]);
  const rows=useMemo(()=>edited.slice(0,count),[edited,count]),index=Math.min(selected,count-1),snapshot=resource?.kind===kind?resource.value:null;
  const result=useMemo(()=>snapshot?irisGroupAccumulation(snapshot,rows,physical):null,[snapshot,rows,physical]);
  function change(key,value){setEdited(old=>old.map((row,i)=>i===index?{...row,[key]:value}:row));}
  function reset(){setKind('initial');setCount(32);setPhysical(12);setEdited(structuredClone(data.records));setSelected(0);setFeature(0);setClass(0);setHidden(0);setRevision(old=>old+1);}
  const c={kind,setKind,count,setCount,physical,setPhysical,rows,index,selected,setSelected,feature,setFeature,classIndex,setClass,hiddenIndex,setHidden,revision,setRevision,snapshot,result,failed:failed===kind,retry:()=>setAttempt(old=>old+1),anchor,change,reset,setEdited};
  return <IrisContext.Provider value={c}>{children}</IrisContext.Provider>;
}
export function MinibatchIrisStatus(){const c=useContext(IrisContext);return <div ref={c.anchor}>{c.failed?<p role="alert">The selected saved classifier could not be loaded. Your current measurements remain intact. <button type="button" onClick={c.retry}>Retry saved classifier</button></p>:!c.snapshot?<p role="status">Loading matching saved parameters and momentum… Current measurements remain intact.</p>:<p role="status">Loaded {c.kind==='initial'?'initial':'epoch-20'} parameters and momentum. The following calculation is one hypothetical update from that saved state.</p>}</div>;}
function SelectedFlower({c}){return <MinibatchSelect name="Flower source record" value={c.index} onChange={v=>c.setSelected(Number(v))} options={c.rows.map((row,i)=>[i,`Position ${i}; source row ${row.id}`])}/>;}
export function MinibatchIrisInvestigation({question}) {
  const c=useContext(IrisContext),row=c.rows[c.index];let controls;
  if(question==='group')controls=<><MinibatchSelect name="Saved classifier state" value={c.kind} onChange={c.setKind} options={[["initial","Before training"],["trained20","After 20 epochs"]]}/><MinibatchSelect name="Effective group prefix" value={c.count} onChange={v=>c.setCount(Number(v))} options={[8,24,32].map(n=>[n,`${n} records`])}/><MinibatchSelect name="Physical flower capacity" value={c.physical} onChange={v=>c.setPhysical(Number(v))} options={[4,7,12,32].map(n=>[n,`${n} records`])}/></>;
  else if(question==='measurement')controls=<><SelectedFlower c={c}/><MinibatchSelect name="Flower measurement coordinate" value={c.feature} onChange={v=>c.setFeature(Number(v))} options={names.map((name,i)=>[i,name])}/><MinibatchNumber name="Selected flower measurement (cm)" value={row.features[c.feature]} min={0} max={10} resetToken={`${c.revision}:${c.index}:${c.feature}`} onChange={value=>c.change('features',row.features.map((v,i)=>i===c.feature?value:v))}/></>;
  else if(question==='target')controls=<><SelectedFlower c={c}/><MinibatchSelect name="Hypothetical flower target" value={row.target} onChange={v=>c.change('target',Number(v))} options={[[0,"0 setosa"],[1,"1 versicolor"],[2,"2 virginica"]]}/></>;
  else if(question==='coordinate')controls=<><MinibatchSelect name="Output class coordinate" value={c.classIndex} onChange={v=>c.setClass(Number(v))} options={[0,1,2].map(i=>[i,`Class ${i}`])}/><MinibatchSelect name="Hidden coordinate" value={c.hiddenIndex} onChange={v=>c.setHidden(Number(v))} options={Array.from({length:8},(_,i)=>[i,`Hidden ${i}`])}/></>;
  else if(question==='restore')controls=<><button type="button" onClick={()=>{c.change('features',row.features.map((v,i)=>i===2?Math.min(10,data.records[c.index].features[2]+.5):v));c.setRevision(v=>v+1);}}>Original petal length +0.5 cm</button><button type="button" onClick={()=>{c.setEdited(old=>old.map((r,i)=>i===c.index?structuredClone(data.records[i]):r));c.setRevision(v=>v+1);}}>Restore selected flower</button><button type="button" onClick={c.reset}>Reset flower case</button></>;
  else throw Error(`Unknown Iris question ${question}`);
  return <FlowLab label={`Hypothetical flower update: ${question}`}>{c.result?(question==='measurement'||question==='target'?<MinibatchFlowerForward c={c}/>:question==='coordinate'?<MinibatchFlowerReverse c={c}/>:<MinibatchFlowerGroup c={c}/>):<p>The drawings wait for the matching classifier state above.</p>}<FlowControls>{controls}</FlowControls><FlowReadout>Source row {row.id}: [{row.features.map(v=>String(v)).join(', ')}] cm; class {row.target}. All views use these same current edits. Prefix 24 is a subset of the first shuffled 32, rather than the epoch's final group.</FlowReadout></FlowLab>;
}

export function MinibatchFlowerAnatomy(){return <><MinibatchDrawing label="Four measured flower coordinates and a stratified train validation split" width={750} height={350}>{marker=><>
  <g stroke={mbColors.input} fill="none"><ellipse cx="67" cy="94" rx="24" ry="60"/><ellipse cx="67" cy="94" rx="60" ry="24"/><circle cx="67" cy="94" r="16"/><path d="M67 154 V270 M67 220 Q115 165 115 220 Q115 250 67 250"/></g>
  <text x="8" y="317" className="mb-small">Flower row 21; class 0</text><MbArray x={160} y={45} label="Supplied measurements, cm" values={[5.4,3.4,1.7,.2]} columns={2} role="input" cellWidth={140}/>{names.map((name,i)=><text x="160" y={186+i*30} key={name} className="mb-small">{i}: {name}</text>)}
  <MbOperand x={475} y={45} label="150 observations" value="3 species × 50" role="input" width={255}/><MbWire marker={marker} d="M602 85 V135 H602"/><MbOperand x={475} y={135} label="Training-only fit" value="120 rows; 40/species" role="neutral" width={255}/><MbOperand x={475} y={235} label="Held validation" value="30 rows; 10/species" role="neutral" width={255}/>
  </>}</MinibatchDrawing><MinibatchNetworkDrawing/></>;}
export function MinibatchNetworkDrawing(){return <MinibatchDrawing label="Every input hidden neuron and output neuron in the four eight three network" width={930} height={660}>{()=><>
  <text x="8" y="30">Scaled inputs x: 4</text><text x="335" y="30">Tanh hidden h: 8</text><text x="665" y="30">Raw logits z: 3</text>
  {Array.from({length:4},(_,i)=>Array.from({length:8},(_,j)=><line key={`${i}-${j}`} x1="108" y1={150+i*115} x2="368" y2={82+j*70} stroke={mbColors.parameter} strokeOpacity=".2"/>))}
  {Array.from({length:8},(_,i)=>Array.from({length:3},(_,j)=><line key={`${i}-${j}`} x1="432" y1={82+i*70} x2="715" y2={175+j*150} stroke={mbColors.parameter} strokeOpacity=".2"/>))}
  {[[4,75,150,115,'x',mbColors.input],[8,400,82,70,'h',mbColors.value],[3,747,175,150,'z',mbColors.value]].map(([n,x,start,gap,prefix,color])=>Array.from({length:n},(_,i)=><g key={`${prefix}${i}`}><circle cx={x} cy={start+i*gap} r="32" fill="#090909" stroke={color}/><text x={x} y={start+i*gap+6} textAnchor="middle">{prefix}{i}</text></g>))}
  <text x="135" y="605" style={{fill:mbColors.parameter}}>W₁: 8×4; b₁: 8</text><text x="510" y="605" style={{fill:mbColors.parameter}}>W₂: 3×8; b₂: 3</text><text x="8" y="646" className="mb-small">Each h receives 4 weighted inputs plus bias; each z receives 8 h values plus bias.</text>
  </>}</MinibatchDrawing>;}

export function MinibatchFlowerForward({c}) {
  const r=c.result.rows[c.index],p=c.snapshot.parameters,j=c.hiddenIndex,k=c.classIndex;
  const products=r.x.map((x,i)=>x*p['0.weight'][j][i]),pre=products.reduce((a,b)=>a+b,0)+p['0.bias'][j],out=r.hidden.map((h,i)=>h*p['2.weight'][k][i]);
  const feature=c.feature,target=c.rows[c.index].target,maximum=Math.max(...r.logits),shifted=r.logits.map(z=>z-maximum),exponentials=shifted.map(z=>Math.exp(z)),normalizer=exponentials.reduce((a,b)=>a+b,0);
  return <><MinibatchDrawing label="One actual flower is transformed by saved training-only statistics" width={790} height={450}>{marker=><>
    <MbArray x={8} y={35} label={`Current row ${c.rows[c.index].id}: centimeters`} values={c.rows[c.index].features} role="input" cellWidth={184}/><MbArray x={8} y={135} label="Saved training mean" values={c.snapshot.center} cellWidth={184}/><MbArray x={8} y={235} label="Saved training population standard deviation" values={c.snapshot.scale} cellWidth={184}/><MbArray x={8} y={355} label="Computed x = (cm − mean) / standard deviation" values={r.x} cellWidth={184}/>
    {r.x.map((_,i)=><MbWire marker={marker} key={i} d={`M${98+i*184} 75 V133 M${98+i*184} 175 V233 M${98+i*184} 275 V353`}/>)}
  </>}</MinibatchDrawing><MinibatchDrawing label="An actual saved weight multiplies the current selected scaled measurement" width={650} height={390}>{marker=><>
    <MbOperand x={8} y={35} label={`Learned W₁[${j},${feature}]`} value={p['0.weight'][j][feature]} role="parameter" width={260}/><MbOperand x={350} y={35} label={`Computed input x[${feature}]`} value={r.x[feature]} width={260}/>
    <MbWire marker={marker} d="M138 75 V160 H274"/><MbWire marker={marker} d="M480 75 V160 H346"/><MbOperation x={310} y={140} label="×"/>
    <MbWire marker={marker} d="M310 180 V205 H0 V265 H190"/><MbOperand x={190} y={245} label="Selected weight/input product" value={products[feature]} width={240}/><text x="8" y="367" className="mb-small">This exact product enters the four-value reduction below.</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="Actual hidden and output neuron products precede tanh and softmax" width={950} height={710}>{marker=><>
    <MbArray x={8} y={35} label={`Hidden neuron ${j}: four W₁[j,i] × x[i] products`} values={products} cellWidth={180}/><MbWire marker={marker} d="M358 75 V140"/><MbOperation x={358} y={140} label="Σ + b₁" width={140}/><MbOperand x={580} y={140} label={`Bias b₁[${j}]`} value={p['0.bias'][j]} role="parameter" width={200}/><MbWire marker={marker} d="M580 160 H430"/><MbWire marker={marker} d="M358 180 V197 H245 V240 H258"/><MbOperand x={258} y={220} label="Preactivation" value={pre} width={200}/><MbWire marker={marker} d="M358 260 V299"/><MbOperation x={358} y={299} label="tanh" width={110}/><MbOperand x={580} y={299} label={`Computed h[${j}]`} value={r.hidden[j]} width={200}/><MbWire marker={marker} d="M415 319 H580"/>
    <MbArray x={8} y={415} label={`Output neuron ${k}: eight W₂[k,j] × h[j] products`} values={out} columns={4} cellWidth={180}/><MbWire marker={marker} d="M358 503 V543"/><MbOperation x={358} y={543} label="Σ + b₂" width={140}/><MbOperand x={580} y={543} label={`Bias b₂[${k}]`} value={p['2.bias'][k]} role="parameter" width={200}/><MbWire marker={marker} d="M580 563 H430"/>
    <MbWire marker={marker} d="M358 583 V640 H580"/><MbOperand x={580} y={620} label={`Computed logit z[${k}]`} value={r.logits[k]} width={200}/><text x="8" y="699" className="mb-small">The same reduction in all three output neurons supplies the next array.</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="The actual three logits pass through stable softmax operations" width={780} height={1050}>{marker=><>
    <MbArray x={8} y={35} label="Computed logits z: classes 0, 1, 2" values={r.logits} cellWidth={240}/><MbWire marker={marker} d="M368 75 V125"/><MbOperation x={368} y={125} label="max" width={110}/>
    <MbWire marker={marker} d="M368 165 V185 H0 V250 H278"/><MbOperand x={278} y={230} label="Largest logit m" value={maximum} width={180}/>
    <MbWire marker={marker} d="M724 55 H766 V350 H438"/><MbWire marker={marker} d="M368 270 V330"/><MbOperation x={368} y={330} label="z − m" width={140}/>
    <MbWire marker={marker} d="M368 370 V392 H0 V450 H8"/><MbArray x={8} y={430} label="Shifted logits: z − m" values={shifted} cellWidth={240}/>
    <MbWire marker={marker} d="M368 470 V525"/><MbOperation x={368} y={525} label="exp each" width={180}/>
    <MbWire marker={marker} d="M368 565 V586 H0 V645 H8"/><MbArray x={8} y={625} label="Positive exponentials of the shifted logits" values={exponentials} cellWidth={240}/>
    <MbWire marker={marker} d="M368 665 V720"/><MbOperation x={368} y={720} label="Σ" width={110}/><MbWire marker={marker} d="M423 740 H530"/><MbOperand x={530} y={720} label="Positive sum" value={normalizer} width={220}/>
    <MbWire marker={marker} d="M724 645 H766 V875 H468"/><MbWire marker={marker} d="M640 760 V825 H368 V855"/><MbOperation x={368} y={855} label="exp ÷ sum" width={200}/>
    <MbWire marker={marker} d="M368 895 V916 H0 V975 H8"/><MbArray x={8} y={955} label="Computed p: probabilities sum to one" values={r.probabilities} cellWidth={240}/>
    <text x="8" y="1035" className="mb-small">Subtracting one common maximum keeps every probability unchanged.</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="The supplied species selects its probability before negative log gives row loss" width={780} height={690}>{marker=><>
    <MbArray x={8} y={35} label="The same computed p from stable softmax above" values={r.probabilities} cellWidth={240}/><MbOperand x={8} y={150} label="Supplied species target y" value={target} role="input" width={240}/>
    <MbWire marker={marker} d="M128 190 V280 H278"/><MbWire marker={marker} d="M724 55 H766 V280 H458"/><MbOperation x={368} y={260} label="select p[y]" width={180}/>
    <MbWire marker={marker} d="M368 300 V320 H0 V385 H278"/><MbOperand x={278} y={365} label={`Selected p[${target}]`} value={r.probabilities[target]} width={180}/>
    <MbWire marker={marker} d="M368 405 V475"/><MbOperation x={368} y={475} label="−log" width={180}/>
    <MbWire marker={marker} d="M368 515 V535 H0 V595 H278"/><MbOperand x={278} y={575} label="Current row class loss" value={r.loss} width={180}/><text x="8" y="670" className="mb-small">The target is supplied; this scalar judges the saved model's probability.</text>
  </>}</MinibatchDrawing></>;
}

export function MinibatchFlowerReverse({c}) {
  const r=c.result.rows[c.index],p=c.snapshot.parameters,delta=r.gradient['2.bias'],d1=r.gradient['0.bias'],k=c.classIndex,j=c.hiddenIndex;
  const projected=r.hidden.map((_,hidden)=>delta.reduce((sum,value,output)=>sum+value*p['2.weight'][output][hidden],0)),tanhFactors=r.hidden.map(h=>1-h*h);
  return <><MinibatchDrawing label="Saved output weights transpose class credit before tanh factors multiply it" width={1180} height={650}>{marker=><>
    <MbArray x={8} y={35} label="Learned W₂: 3 output rows × 8 hidden columns" values={p['2.weight'].flat()} columns={8} cellWidth={140} role="parameter"/>
    <MbArray x={8} y={235} label="Class credit δ₂: 3" values={delta} cellWidth={170} role="credit"/>
    <MbWire marker={marker} d="M568 167 V200 H570 V350 H565"/><MbWire marker={marker} reverse d="M263 275 V310 H0 V380 H8"/>
    <MbArray x={8} y={360} label="Column sums W₂ᵀδ₂: 8" values={projected} columns={4} cellWidth={140} role="credit"/>
    <MbArray x={610} y={235} label="Tanh local factors (1−h²): 8" values={tanhFactors} columns={4} cellWidth={140}/>
    <MbWire marker={marker} reverse d="M568 425 H814"/><MbWire marker={marker} d="M880 323 V395"/><MbOperation x={850} y={405} label="×"/>
    <MbWire marker={marker} reverse d="M850 445 V470 H0 V530 H8"/><MbArray x={8} y={510} label="Hidden credit δ₁: 8; coordinatewise product" values={d1} columns={4} cellWidth={140} role="credit"/>
    <text x="8" y="635" className="mb-small">For each hidden j: sum W₂[k,j]δ₂[k] over k, then multiply by 1−h[j]².</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="Reverse outer products land on all sixty-seven parameter coordinates" width={1180} height={1220}>{marker=><>
    <MbArray x={8} y={35} label="Class credit δ₂ = p − onehot(y)" values={delta} role="credit" cellWidth={170}/><MbArray x={650} y={35} label="Hidden activations h: 8" values={r.hidden} columns={4} cellWidth={125}/>
    <MbArray x={8} y={200} label="W₂ credit = δ₂ ⊗ h: 3 rows × 8 columns (24)" values={r.gradient['2.weight'].flat()} columns={8} cellWidth={140} role="credit"/><MbWire marker={marker} reverse d="M263 75 V155 H0 V220 H8"/><MbWire marker={marker} reverse d="M900 123 V172 H1160 V220 H1124"/>
    <MbArray x={8} y={430} label="b₂ credit = δ₂: 3 coordinates" values={delta} role="credit" cellWidth={170}/><MbWire marker={marker} reverse d="M530 55 H590 V135 H0 V450 H8"/>
    <MbArray x={8} y={565} label="δ₁ = (W₂ᵀ δ₂) × (1−h²): 8 coordinates" values={d1} columns={4} cellWidth={190} role="credit"/><MbWire marker={marker} reverse d="M530 55 H595 V160 H1170 V525 H0 V585 H8"/><MbWire marker={marker} d="M900 123 H1140 V520 H788 V590"/>
    <MbArray x={840} y={565} label="Scaled x: 4" values={r.x} columns={2} cellWidth={145}/><MbArray x={8} y={745} label="W₁ credit = δ₁ ⊗ x: 8 rows × 4 columns (32)" values={r.gradient['0.weight'].flat()} columns={4} cellWidth={190} role="credit"/><MbWire marker={marker} reverse d="M388 653 V705 H0 V765 H8"/><MbWire marker={marker} d="M985 653 V705 H788 V765"/>
    <MbArray x={840} y={830} label="b₁ credit = δ₁: 8" values={d1} columns={2} cellWidth={145} role="credit"/><MbWire marker={marker} reverse d="M788 590 H820 V850 H840"/>
    <text x="8" y="1170">Selected W₂[{k},{j}]: ({f(r.probabilities[k])}−{Number(k===c.rows[c.index].target)}) × {f(r.hidden[j])} = {f(r.gradient['2.weight'][k][j],10)}.</text><text x="8" y="1206" className="mb-small">32 + 8 + 24 + 3 = 67 gradient coordinates; one group divides every row contribution by D={c.count}.</text>
  </>}</MinibatchDrawing><MinibatchTable caption="Exact selected row values for the reverse route" headers={['Class','p','Onehot target','δ₂','Selected h','W₂ row derivative']} rows={r.probabilities.map((v,i)=>[i,v,Number(i===c.rows[c.index].target),delta[i],r.hidden[j],r.gradient['2.weight'][i][j]])}/></>;
}
export function MinibatchFlowerGroup({c}) {
  const r=c.result,k=c.classIndex,j=c.hiddenIndex,gradient=r.accumulated['2.weight'][k][j],old=c.snapshot.parameters['2.weight'][k][j],v=c.snapshot.momentum?.['2.weight'][k][j]??0;
  return <><MinibatchDrawing label="Actual flower chunks share one sixty-seven-coordinate buffer" width={780} height={180+r.chunks.length*90}>{marker=><>
    {r.chunks.map((chunk,i)=><g key={i}><MbArray x={8} y={35+i*90} label={`Chunk ${i+1}: ${chunk.size} rows / actual D=${c.count}`} values={[chunk.gradient['2.weight'][k][j]]} role="credit" cellWidth={290}/><MbWire marker={marker} reverse d={`M294 ${55+i*90} H430 V${55+r.chunks.length*90} H465`}/></g>)}<MbOperand x={465} y={35+r.chunks.length*90} label={`One persistent G; W₂[${k},${j}]`} value={gradient} role="credit" width={300}/><text x="8" y={130+r.chunks.length*90}>All 67 derivatives: maximum full/split gap {r.gap.toExponential(3)}.</text>
  </>}</MinibatchDrawing><MinibatchTable caption="Current hypothetical update from the matching saved parameter and optimizer state" headers={['Quantity','Current value']} rows={[
    ['Mean class loss',r.loss],['All-67 full/split derivative maximum gap',r.gap.toExponential(8)],['Selected old weight',old],['Selected old momentum',v],['Selected accumulated credit',gradient],['New momentum .9v+g',r.buffer['2.weight'][k][j]],['New weight w−.05v_new',r.parameters['2.weight'][k][j]],['Backward calls / optimizer updates',`${r.chunks.length} / 1`]
  ]}/></>;
}

function HistoryPlot({accuracy=false}) {
  const history=data.iris.history,W=800,H=470,X=e=>65+e*24,Y=v=>340-v*(accuracy?270:245),series=accuracy?[["Train /120",history.map(r=>r[3]/120),mbColors.input],["Validation /30",history.map(r=>r[5]/30),mbColors.value],["Constant species 10/30",history.map(()=>1/3),'#bbb']]:[["Train loss",history.map(r=>r[2]),mbColors.input],["Validation loss",history.map(r=>r[4]),mbColors.value],["Uniform: log 3",history.map(()=>Math.log(3)),'#bbb']];
  return <MinibatchDrawing label={accuracy?'All twenty-one measured train and validation accuracies':'All twenty-one measured train and validation losses'} width={W} height={H}>{()=><>
    <path d="M65 35 V340 H545" fill="none" stroke="#aaa"/><text x="8" y="24">{accuracy?'Correct fraction':'Mean cross-entropy'}</text>
    {[0,1,5,10,20].map(e=><g key={e}><path d={`M${X(e)} 340 v7`} stroke="#aaa"/><text x={X(e)} y="373" textAnchor="middle">{e}</text></g>)}<text x="480" y="404">Epoch</text>
    {[0,.5,1].map(v=><text key={v} x="8" y={Y(v)+5}>{v}</text>)}
    {series.map(([label,values,color],s)=><g key={label}><path d={values.map((v,e)=>`${e?'L':'M'}${X(e)} ${Y(v)}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={s?'7 4':undefined}/>{values.map((v,e)=>s===1?<rect key={e} x={X(e)-5} y={Y(v)-5} width="10" height="10" fill="none" stroke={color}/>:<circle key={e} cx={X(e)} cy={Y(v)} r={s===0?3:1.5} fill={color}/>)}<path d={`M565 ${42+s*32} H595`} stroke={color} strokeDasharray={s?'7 4':undefined}/><text x="600" y={48+s*32} className="mb-small">{label}</text></g>)}
    <text x="8" y="444" className="mb-small">{accuracy?'Validation reverses: 28/30 at epoch 3 → 27/30 at epoch 5.':'Lines join saved epoch points; there is no interpolation measurement.'}</text>
  </>}</MinibatchDrawing>;
}
export function MinibatchMeasuredHistory(){return <><HistoryPlot/><HistoryPlot accuracy/><MinibatchTable caption="Complete fixed twenty-epoch study, including initialization and reversals" headers={['Epoch','Updates','Train loss','Train correct /120','Validation loss','Validation correct /30']} rows={data.iris.history}/><MinibatchTable caption="Paired-state equivalence is separate from prediction quality" headers={['Physical capacity','Backward calls','Updates','Max parameter gap','Max momentum gap']} rows={[[32,80,80,'reference','reference'],[12,220,80,data.iris.parameter_gap.toExponential(8),data.iris.momentum_gap.toExponential(8)],[7,380,80,data.size7.parameter_gap.toExponential(8),data.size7.momentum_gap.toExponential(8)]]}/></>;}
export function MinibatchFlowProgram({file}){return <RemoteCodeBlock source={base+file} language="python" filename={file}/>;}
export function MinibatchFlowFiles(){return <nav className="mb-files" aria-label="Complete programs and observations">{['manual-gradient-accumulation.py','trace_update.py','train_iris.py','iris.csv','data-provenance.md','author-results.json'].map(file=><a key={file} href={base+file}>{file}</a>)}</nav>;}
