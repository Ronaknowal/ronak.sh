import { useMemo, useState } from 'react';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import { MemoryPlane, MemoryPlot, Bars, MemoryFigure, Values, f, vec, memoryColors as c } from './HopfieldPrimitives.jsx';
import { SignedMemoryFigure, Pattern, ReadCircuit } from './HopfieldFlowFigures.jsx';
import { binaryRecall, continuousTrace, energyContours, distance, associate } from '../../data/hopfield-memory-models.js';
const binaryDefault = () => ({ patterns: [[1,1,-1,-1]], cue: [1,-1,-1,-1], order: [0,1,2,3] });
export function BinaryMemoryLab() {
 const [view,setView]=useState(binaryDefault),[step,setStep]=useState(2),[cueCell,setCueCell]=useState(1),[patternIndex,setPatternIndex]=useState(0),[patternCell,setPatternCell]=useState(1),[visitSlot,setVisitSlot]=useState(0),[pinned,setPinned]=useState(null);
 const result=useMemo(()=>binaryRecall(view.patterns,view.cue,view.order),[view]),index=Math.min(step,result.trace.length-1),current=result.trace[index],previous=result.trace[Math.max(0,index-1)],selectedPattern=Math.min(patternIndex,view.patterns.length-1);
 const edit=patch=>{setView(v=>({...v,...patch}));setStep(2);},flip=(values,i)=>values.map((v,j)=>i===j?-v:v),swap=value=>{const order=[...view.order],other=order.indexOf(value);[order[visitSlot],order[other]]=[order[other],order[visitSlot]];edit({order});};
 return <FlowLab id="hopfield-binary" label="Edit signed cues, stored relationships and coordinate visits">
 <p>What happens when the cue contains a different damaged feature? Select one cell, then flip its sign; the bank remains fixed.</p>
 <MemoryFigure title="Current cue and resulting final state" height={190} description="Cell coordinates run 1,2 / 3,4. Amber is +1, blue is −1; white outline marks the cue cell selected for editing. The final pattern is the actual bounded sequential result."><Pattern state={view.cue} label="editable cue" x={20} y={38} selected={cueCell}/><Pattern state={result.final} label="final state" x={202} y={38}/></MemoryFigure>
 <FlowControls><FlowSlider name="Cue coordinate" value={cueCell+1} min={1} max={4} step={1} onChange={n=>setCueCell(n-1)}/><button onClick={()=>edit({cue:flip(view.cue,cueCell)})}>Flip cue coordinate {cueCell+1}</button></FlowControls>
 <FlowReadout>The final state is {vec(result.final)}, {result.category}; energy moves from {f(result.trace[0].energy)} to {f(result.trace.at(-1).energy)}. {result.converged?'One complete sweep made no change.':'The eight-sweep limit was reached.'}</FlowReadout>
 <p>Changing a stored sign changes the relationships themselves. The selected stored pattern and all current patterns remain visible.</p>
 <MemoryFigure title="Current stored patterns" height={view.patterns.length*145+20} description="Each two-by-two grid is an actual stored row; the selected row and coordinate have a white outline.">{view.patterns.map((row,i)=><Pattern key={i} state={row} label={`pattern ${i+1}`} x={20} y={35+i*145} selected={i===selectedPattern?patternCell:-1}/>)}</MemoryFigure>
 <FlowControls><FlowSlider name="Stored pattern" value={selectedPattern+1} min={1} max={view.patterns.length} step={1} onChange={n=>setPatternIndex(n-1)}/><FlowSlider name="Stored coordinate" value={patternCell+1} min={1} max={4} step={1} onChange={n=>setPatternCell(n-1)}/><button onClick={()=>edit({patterns:view.patterns.map((row,i)=>i===selectedPattern?flip(row,patternCell):row)})}>Flip stored coordinate</button></FlowControls>
 <FlowReadout>There are {view.patterns.length} stored patterns; adding their outer products produces the complete weight matrix below.</FlowReadout>
 <p>An additional pattern adds votes even if it duplicates an existing row. Add or remove a row, then inspect the resulting weights.</p>
 <SignedMemoryFigure state={view.cue} weights={result.w} active={patternCell}/>
 <FlowControls><button disabled={view.patterns.length===3} onClick={()=>edit({patterns:[...view.patterns,[1,-1,1,-1]]})}>Add stored pattern</button><button disabled={view.patterns.length===1} onClick={()=>edit({patterns:view.patterns.slice(0,-1)})}>Remove last stored pattern</button></FlowControls>
 <FlowReadout>The weight row for coordinate {patternCell+1} is {vec(result.w[patternCell])}; it is recomputed from all {view.patterns.length} stored patterns.</FlowReadout>
 <p>Does the visit order select a different final state? The timeline below names each visit slot. Changing a slot swaps its coordinate with the existing slot, so every coordinate is still visited once.</p>
 <MemoryFigure title="The actual coordinate visit order" height={115} description="Grey arrows read left to right. Each circle is the coordinate updated at that visit slot, not a new neuron or a new stored pattern.">{view.order.map((coordinate,i)=><g key={i}><text x={40+i*76} y="25" textAnchor="middle">slot {i+1}</text><circle cx={40+i*76} cy="62" r="20" stroke={i===visitSlot?'white':'#888'} fill="#090909"/><text x={40+i*76} y="67" textAnchor="middle">{coordinate+1}</text>{i<3&&<path d={`M${62+i*76} 62h31l-6 -4m6 4l-6 4`} stroke="#888" fill="none"/>}</g>)}</MemoryFigure>
 <FlowControls><FlowSlider name="Visit slot" value={visitSlot+1} min={1} max={4} step={1} onChange={n=>setVisitSlot(n-1)}/><FlowSlider name="Coordinate in selected visit slot" value={view.order[visitSlot]+1} min={1} max={4} step={1} onChange={n=>swap(n-1)}/></FlowControls>
 <FlowReadout>The current order is {vec(view.order.map(n=>n+1))}; its final state is {vec(result.final)}.</FlowReadout>
 <p>Inspect a specific update. The vote diagram uses the state immediately before that coordinate changes; the trace includes every unchanged visit.</p>
 <SignedMemoryFigure state={previous.state} weights={result.w} active={current.coordinate??view.order[0]}/>
 <FlowControls><FlowSlider name="Inspect coordinate update (0 is initial)" value={index} min={0} max={result.trace.length-1} step={1} onChange={setStep}/></FlowControls>
 <FlowReadout>{index===0?`Initial state ${vec(current.state)}.`:`Visit ${index}, coordinate ${current.coordinate+1}: ${current.before} → ${current.state[current.coordinate]}, field ${f(current.field)}, energy change ${f(current.energy-previous.energy)}.`} A zero field keeps its existing sign.</FlowReadout>
 <MemoryPlot title="Energy of every current coordinate visit" xLabel="coordinate visit" yLabel="energy" series={[{label:'actual E(s)',color:c.computed,points:result.trace.map((t,i)=>[i,t.energy])}]}/>
 <NeuralTable caption="Complete bounded trace" headers={['Update','Coordinate','State','Field','Energy']} rows={result.trace.map((t,i)=>[i,t.coordinate===null?'initial':t.coordinate+1,vec(t.state),t.field===null?'—':f(t.field),f(t.energy)])}/>
 <p>Save this bank, cue and order for a comparison; resetting restores the same worked cue shown in the lesson.</p>
 <MemoryFigure title="Current and retained final states" height={190} description="Both grids use the same signed convention. A saved result remains fixed after the live bank or cue is edited."><Pattern state={result.final} label="current final" x={20} y={38}/>{pinned&&<Pattern state={pinned.result.final} label="saved final" x={202} y={38}/>}</MemoryFigure>
 <FlowControls><button onClick={()=>setPinned({view:structuredClone(view),result})}>Pin binary comparison</button><button onClick={()=>{setView(binaryDefault());setStep(2);setCueCell(1);setPatternIndex(0);setPatternCell(1);setVisitSlot(0);setPinned(null);}}>Reset binary investigation</button></FlowControls>
 {pinned&&<FlowReadout>Saved cue {vec(pinned.view.cue)}, order {vec(pinned.view.order.map(n=>n+1))}, bank {pinned.view.patterns.map(vec).join('; ')}. Saved final energy {f(pinned.result.trace.at(-1).energy)}; current minus saved is {f(result.trace.at(-1).energy-pinned.result.trace.at(-1).energy)}.</FlowReadout>}
 </FlowLab>;
}
const continuousDefault=()=>({memories:[{id:1,value:[1,0]},{id:2,value:[-1,0]}],cue:[.2,.4],beta:2,nextId:3});
export function ContinuousMemoryLab() {
 const [view,setView]=useState(continuousDefault),[step,setStep]=useState(0),[selectedMemory,setSelectedMemory]=useState(0),[pinned,setPinned]=useState(null),memories=useMemo(()=>view.memories.map(r=>r.value),[view.memories]),trace=useMemo(()=>continuousTrace(memories,view.cue,view.beta),[memories,view.cue,view.beta]),contours=useMemo(()=>energyContours(memories,view.beta),[memories,view.beta]),current=trace[step],last=trace[12],selection=Math.min(selectedMemory,memories.length-1),distances=memories.map(m=>distance(m,last.q)),nearest=distances.indexOf(Math.min(...distances));
 const edit=patch=>{setView(v=>({...v,...patch}));setStep(0);},editMemory=(j,n)=>edit({memories:view.memories.map((row,i)=>i===selection?{...row,value:row.value.map((v,k)=>j===k?n:v)}:row)});
 return <FlowLab id="hopfield-continuous" label="Continuous memory geometry and repeated reads">
 <p>Start with exactly the worked cue [0.2,0.4] and the two opposite memories. Where does the first read move when the cue changes?</p>
 <MemoryPlane title="Cue and its first weighted read" memories={memories} q={view.cue} read={trace[0].read}/>
 <FlowControls><FlowSlider name="Continuous cue x" value={view.cue[0]} min={-2} max={2} step={.05} onChange={n=>edit({cue:[n,view.cue[1]]})}/><FlowSlider name="Continuous cue y" value={view.cue[1]} min={-2} max={2} step={.05} onChange={n=>edit({cue:[view.cue[0],n]})}/></FlowControls>
 <FlowReadout>The cue is {vec(view.cue)}; the first read is {vec(trace[0].read)}. These coordinates are an average of the stored rows.</FlowReadout>
 <p>Move a stored row instead. The white selection is an editing choice; stable memory IDs survive changes in coordinates.</p>
 <MemoryPlane title="Editable continuous bank" selectedMemory={selection} memories={memories} q={view.cue} read={trace[0].read}/>
 <FlowControls><FlowSlider name="Selected memory row" value={selection+1} min={1} max={memories.length} step={1} onChange={n=>setSelectedMemory(n-1)}/><FlowSlider name="Selected memory x" value={memories[selection][0]} min={-2} max={2} step={.05} onChange={n=>editMemory(0,n)}/><FlowSlider name="Selected memory y" value={memories[selection][1]} min={-2} max={2} step={.05} onChange={n=>editMemory(1,n)}/></FlowControls>
 <FlowReadout>Selected row {selection+1} is memory ID {view.memories[selection].id}, now {vec(memories[selection])}; all stored rows participate in the read.</FlowReadout>
 <p>Increasing the number of rows changes the softmax denominator, including when two rows coincide. New rows start at [0,1] and can then be moved to any coordinates in this display range.</p>
 <Bars title="Weight assigned to each stored row" labels={view.memories.map(r=>`memory ID ${r.id}`)} values={trace[0].weights} fixedMaximum={1}/>
 <FlowControls><button disabled={memories.length===6} onClick={()=>edit({memories:[...view.memories,{id:view.nextId,value:[0,1]}],nextId:view.nextId+1})}>Add continuous memory</button><button disabled={memories.length===1} onClick={()=>edit({memories:view.memories.slice(0,-1)})}>Remove last continuous memory</button></FlowControls>
 <FlowReadout>There are {memories.length} rows, with total weight {f(trace[0].weights.reduce((a,b)=>a+b,0))}; one remaining row always returns its own coordinates.</FlowReadout>
 <p>The same dot scores produce different mixtures when the inverse temperature changes. Each violet bar below is a weight, not a correctness probability.</p>
 <ReadCircuit memories={memories} q={view.cue} beta={view.beta}/>
 <FlowControls><FlowSlider name="Continuous inverse temperature β" value={view.beta} min={.1} max={8} step={.1} onChange={n=>edit({beta:n})}/></FlowControls>
 <FlowReadout>At β={f(view.beta)}, the first read is {vec(trace[0].read)}; after twelve reads the state is {vec(last.q)}.</FlowReadout>
 <p>Now inspect repeated reads of this same bank. The grey route shows all twelve; changing the inspection step reuses the same computed landscape.</p>
 <MemoryPlane title="Actual energy contours and repeated reads" memories={memories} q={view.cue} read={current.read} path={trace.map(t=>t.q)} selected={step} contours={contours}/>
 <FlowControls><FlowSlider name="Selected continuous update" value={step} min={0} max={12} step={1} onChange={setStep}/></FlowControls>
 <FlowReadout>At update {step}, state {vec(current.q)} reads {vec(current.read)}. Energy {f(current.energy,8)} → {f(current.nextEnergy,8)}; actual change {f(current.nextEnergy-current.energy,8)} is at most {f(-.5*current.step**2,8)}.</FlowReadout>
 <p>Plane labels M1…Mn follow current row order: {view.memories.map((r,i)=>`M${i+1}=ID ${r.id}`).join('; ')}. Eight contours are computed on a 61×41 grid over [−2,2]²; the traces use the same mathematical energy, not interpolated contour pixels.</p>
 <NeuralTable caption={`Every operation at selected update ${step}`} headers={['ID','Coordinates','Dot','β×dot','Weight']} rows={view.memories.map((r,i)=>[r.id,vec(r.value),f(current.scores[i]),f(current.logits[i]),f(current.weights[i],8)])}/>
 <Values caption="Actual local response" rows={[["Jacobian rows",current.jacobian.map(vec).join('; ')],["Local Jacobian norm",f(current.sensitivity,8)],["Nearest memory at update 12",`ID ${view.memories[nearest].id}, distance ${f(distances[nearest],8)}`],["Final step size",f(distance(trace[11].q,last.q),8)]]}/>
 <MemoryPlot title="Objective along the complete twelve-read route" xLabel="read count" yLabel="energy" series={[{label:'actual E(q)',color:c.computed,points:trace.map((t,i)=>[i,t.energy])}]}/>
 <NeuralTable caption="Every continuous state and energy" headers={['Update','State','Energy','Next read']} rows={trace.map((t,i)=>[i,vec(t.q),f(t.energy,8),vec(t.read)])}/>
 <p>A distance below 0.05 is only a display threshold for near-memory retrieval. A small final step over twelve reads is not a convergence proof. Save a landscape to compare a later edit with this endpoint.</p>
 <Bars title="Current twelve-read endpoint coordinates" labels={['horizontal x','vertical y']} values={last.q} signed reference={pinned?.trace[12].q} referenceLabel="saved endpoint"/>
 <FlowControls><button onClick={()=>setPinned({view:structuredClone(view),trace})}>Pin continuous comparison</button><button onClick={()=>{setView(continuousDefault());setStep(0);setSelectedMemory(0);setPinned(null);}}>Reset continuous investigation</button></FlowControls>
 {pinned&&<FlowReadout>Saved β={f(pinned.view.beta)}, cue {vec(pinned.view.cue)}, bank {pinned.view.memories.map(r=>`ID ${r.id}: ${vec(r.value)}`).join('; ')}. Its endpoint is {vec(pinned.trace[12].q)}; displacement from the current endpoint is {f(distance(last.q,pinned.trace[12].q),8)}.</FlowReadout>}
 </FlowLab>;
}
const associationDefault=()=>({q:[-.3,.4],beta:2,records:[{id:1,key:[1,0],value:[1,0]},{id:2,key:[0,1],value:[0,1]},{id:3,key:[-1,0],value:[0,1]}],nextId:4});
export function AssociationLab() {
 const [view,setView]=useState(associationDefault),[selection,setSelection]=useState(0),[pinned,setPinned]=useState(null),r=useMemo(()=>associate(view.records,view.q,view.beta),[view]),index=Math.min(selection,view.records.length-1),keyRead=r.weights.reduce((sum,p,i)=>sum.map((v,j)=>v+p*view.records[i].key[j]),[0,0]),oneHot=view.records.every(row=>row.value.every(v=>v===0||v===1)&&row.value.reduce((a,b)=>a+b,0)===1);
 const edit=patch=>setView(v=>({...v,...patch})),editRecord=(field,j,n)=>edit({records:view.records.map((row,i)=>i===index?{...row,[field]:row[field].map((v,k)=>j===k?n:v)}:row)});
 const table=<NeuralTable caption="Aligned key–weight–value calculation" headers={['ID','Key','Score','Weight','Value','Contribution']} rows={view.records.map((row,i)=>[row.id,vec(row.key),f(r.scores[i],6),f(r.weights[i],8),vec(row.value),vec(r.contributions[i])])}/>;
 return <FlowLab id="hopfield-association" label="Independent key addressing and returned payloads">
 <p>For this new example, three records carry two-coordinate one-hot labels: record 1 is class A and records 2 and 3 are class B. The query starts at [−0.3,0.4] with β=2. The diamond averages keys; the label sums are a separate output.</p>
 <MemoryPlane title="Current keys, query and weighted key-space average" memories={view.records.map(row=>row.key)} q={view.q} read={keyRead}/>
 <FlowControls><FlowSlider name="Association query x" value={view.q[0]} min={-2} max={2} step={.05} onChange={n=>edit({q:[n,view.q[1]]})}/><FlowSlider name="Association query y" value={view.q[1]} min={-2} max={2} step={.05} onChange={n=>edit({q:[view.q[0],n]})}/></FlowControls>
 <FlowReadout>The key-space average is {vec(keyRead)}; the returned {oneHot?'class masses':'payload'} are {vec(r.output)}. They are different objects.</FlowReadout>
 <p>Change the sharpness of addressing while holding keys and values fixed.</p>
 <Bars title="Computed addressing weights" labels={view.records.map(row=>`record ID ${row.id}`)} values={r.weights} fixedMaximum={1}/>
 <FlowControls><FlowSlider name="Association β" value={view.beta} min={.1} max={8} step={.1} onChange={n=>edit({beta:n})}/></FlowControls>
 <FlowReadout>At β={f(view.beta)}, each record receives the displayed fraction; all fractions sum to {f(r.weights.reduce((a,b)=>a+b,0))}.</FlowReadout>
 <p>Move one key. The stored value stays attached to the same record ID, even when its position changes.</p>
 <MemoryPlane title="Editable association keys" selectedMemory={index} memories={view.records.map(row=>row.key)} q={view.q} read={keyRead}/>
 <FlowControls><FlowSlider name="Key record row" value={index+1} min={1} max={view.records.length} step={1} onChange={n=>setSelection(n-1)}/><FlowSlider name="Selected key x" value={view.records[index].key[0]} min={-2} max={2} step={.05} onChange={n=>editRecord('key',0,n)}/><FlowSlider name="Selected key y" value={view.records[index].key[1]} min={-2} max={2} step={.05} onChange={n=>editRecord('key',1,n)}/></FlowControls>
 <FlowReadout>Selected record ID {view.records[index].id} has key {vec(view.records[index].key)}, score {f(r.scores[index])} and weight {f(r.weights[index])}.</FlowReadout>
 <p>Edit what a record returns instead of where the query finds it. Each signed bar is a contribution to one output coordinate, with its exact value printed.</p>
 <Bars title="Every weighted payload coordinate" labels={view.records.flatMap(row=>[`ID ${row.id}: output x`,`ID ${row.id}: output y`])} values={r.contributions.flat()} signed/>
 <FlowControls><FlowSlider name="Payload record row" value={index+1} min={1} max={view.records.length} step={1} onChange={n=>setSelection(n-1)}/><FlowSlider name="Selected payload x" value={view.records[index].value[0]} min={-5} max={5} step={.05} onChange={n=>editRecord('value',0,n)}/><FlowSlider name="Selected payload y" value={view.records[index].value[1]} min={-5} max={5} step={.05} onChange={n=>editRecord('value',1,n)}/></FlowControls>
 <FlowReadout>The output is {vec(r.output)}. {oneHot?'These genuine one-hot values produce class masses summing to one.':'These values are ordinary signed payloads; no class-probability or energy-descent interpretation is implied.'} A value edit leaves key scores and weights unchanged.</FlowReadout>
 {table}
 <p>Add a paired record or remove the last one. A new record starts at key [0.4,0.4] with class-B value [0,1]; both can be edited above. To test the equal-payload null case, set every value to [4,−2].</p>
 <Bars title="Current returned coordinates" labels={['returned x','returned y']} values={r.output} signed/>
 <FlowControls><button disabled={view.records.length===6} onClick={()=>edit({records:[...view.records,{id:view.nextId,key:[.4,.4],value:[0,1]}],nextId:view.nextId+1})}>Add association record</button><button disabled={view.records.length===1} onClick={()=>edit({records:view.records.slice(0,-1)})}>Remove last association record</button></FlowControls>
 <FlowReadout>All {view.records.length} records contribute; an empty bank is intentionally disallowed because this read has no empty-set policy.</FlowReadout>
 <p>Does reordering complete records change the answer? Scores and values move together; the memory labels in the plane follow row order: {view.records.map((row,i)=>`M${i+1}=ID ${row.id}`).join('; ')}.</p>
 <Bars title="Current versus saved returned payload" labels={['returned x','returned y']} values={r.output} signed reference={pinned?.result.output} referenceLabel="saved output"/>
 <FlowControls><button onClick={()=>edit({records:[...view.records].reverse()})}>Reverse complete records</button><button onClick={()=>setPinned({view:structuredClone(view),result:r})}>Pin association comparison</button><button onClick={()=>{setView(associationDefault());setSelection(0);setPinned(null);}}>Reset association investigation</button></FlowControls>
 {pinned&&<><FlowReadout>Saved query {vec(pinned.view.q)}, β={f(pinned.view.beta)}, output {vec(pinned.result.output)}; current output difference is {vec(r.output.map((v,i)=>v-pinned.result.output[i]))}.</FlowReadout><NeuralTable caption="Complete saved record identities" headers={['ID','Key','Value','Weight']} rows={pinned.view.records.map((row,i)=>[row.id,vec(row.key),vec(row.value),f(pinned.result.weights[i],8)])}/></>}
 </FlowLab>;
}
