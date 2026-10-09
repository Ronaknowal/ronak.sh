import { createContext, useContext, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import {
  hybridFlowInitialRecords, hybridFlowMemory, hybridFlowBudget, hybridFlowRouter,
  hybridTinySelectiveStep, hybridFlowDiscretization,
} from '../../data/hybrid-memory-flow-models.js';
import { jambaOriginalBudget } from '../../data/hybrid-jamba-models.js';
import {
  HybridRecordsDrawing, HybridSummaryStepDrawing, HybridAddressDrawing,
  HybridFlowDrawing, HybridFlowLabel, HybridFlowWire, HybridFlowValue,
  HybridFlowMatrix, HybridFlowArray, HybridSelectiveObjectsDrawing,
  HybridSelectiveCoefficientsDrawing, HybridSelectiveStateDrawing, HybridSoftmaxCircuit, hybridFlowRoles,
} from './HybridMemoryFlowFigures.jsx';

const MemoryCase = createContext(null);
const BudgetCase = createContext(null);
const RouterCase = createContext(null);
const SelectiveCase = createContext(null);
const originalScores = [Math.log(4), Math.log(2), 0, 0];
const originalOutputs = [[2, -1], [0, 3], [-2, 0], [1, 1]];

export function HybridMemoryFlowProvider({ children }) {
  const [memory, setMemory] = useState(() => ({ records: structuredClone(hybridFlowInitialRecords), query: 'A', decay: .5, scoreGap: Math.log(9) }));
  const [memoryPin, setMemoryPin] = useState(null);
  const [budget, setBudget] = useState(() => ({ ...jambaOriginalBudget }));
  const [budgetPin, setBudgetPin] = useState(null);
  const [router, setRouter] = useState(() => ({ scores: [...originalScores], values: structuredClone(originalOutputs), k: 2 }));
  const [routerPin, setRouterPin] = useState(null);
  const [selectiveInput, setSelectiveInput] = useState([2, -1]);
  return <MemoryCase.Provider value={{ memory, setMemory, memoryPin, setMemoryPin }}>
    <BudgetCase.Provider value={{ budget, setBudget, budgetPin, setBudgetPin }}>
      <RouterCase.Provider value={{ router, setRouter, routerPin, setRouterPin }}>
        <SelectiveCase.Provider value={{ input: selectiveInput, setInput: setSelectiveInput }}>{children}</SelectiveCase.Provider>
      </RouterCase.Provider>
    </BudgetCase.Provider>
  </MemoryCase.Provider>;
}

export function HybridFlowSelect({ name, value, onChange, options }) {
  return <label className="hybrid-flow-select"><span>{name}</span>
    <select value={value} onChange={event => onChange(event.target.value)} aria-label={name}>
      {options.map(([key, label]) => <option key={String(key)} value={key}>{label}</option>)}
    </select>
  </label>;
}

function memoryResult(memory) {
  return hybridFlowMemory(memory.records, memory.query, memory.decay, memory.scoreGap);
}

export function HybridRecordEditFlow() {
  const { memory, setMemory } = useContext(MemoryCase);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, memory.records.length - 1);
  const record = memory.records[index];
  const edit = (field, value) => setMemory(current => ({ ...current, records: current.records.map((row, position) => position === index ? { ...row, [field]: value } : row) }));
  const result = memoryResult(memory);
  return <FlowLab id="hybrid-record-edit" label="Edit the actual record shared by both memory routes">
    <HybridRecordsDrawing records={memory.records} selected={index}/>
    <FlowControls>
      <HybridFlowSelect name="Record to edit" value={index} onChange={value => setSelected(Number(value))} options={memory.records.map((row, position) => [position, `Arrival ${position + 1}: ${row.key}`])}/>
      <HybridFlowSelect name="Stored key" value={record.key} onChange={value => edit('key', value)} options={['A', 'B', 'C', 'D'].map(key => [key, key])}/>
      <FlowSlider name="Stored value" value={record.value} min={-10} max={10} step={.1} onChange={value => edit('value', value)}/>
    </FlowControls>
    <FlowReadout>These same records now give a summary of <strong>{number(result.summary)}</strong> and a query-{memory.query} read of <strong>{number(result.attention)}</strong>. Relabelling changes only the route that reads keys.</FlowReadout>
  </FlowLab>;
}

export function HybridSummaryFlow() {
  const { memory, setMemory } = useContext(MemoryCase);
  const [position, setPosition] = useState(1);
  const selected = Math.min(position, memory.records.length - 1);
  const result = memoryResult(memory);
  return <FlowLab id="hybrid-summary-read" label="Follow one coupled numerator and normalizer update">
    <HybridSummaryStepDrawing records={memory.records} decay={memory.decay} position={selected}/>
    <FlowControls>
      <FlowSlider name="Recency multiplier λ" value={memory.decay} min={0} max={1} step={.01} onChange={decay => setMemory(current => ({ ...current, decay }))}/>
      <FlowSlider name="Arrival to trace" value={selected + 1} min={1} max={memory.records.length} step={1} onChange={value => setPosition(value - 1)}/>
    </FlowControls>
    <FlowReadout>After arrival {selected + 1}, the two registers are {number(result.states[selected][0])} and {number(result.states[selected][1])}; their ratio is <strong>{number(result.states[selected][2])}</strong>. After all {memory.records.length} arrivals the ratio is {number(result.summary)}.</FlowReadout>
  </FlowLab>;
}

export function HybridAddressFlow() {
  const { memory, setMemory } = useContext(MemoryCase);
  const result = memoryResult(memory);
  return <FlowLab id="hybrid-address-read" label="Change the query and follow every signed attention contribution">
    <HybridAddressDrawing records={memory.records} query={memory.query} scoreGap={memory.scoreGap}/>
    <FlowControls>
      <HybridFlowSelect name="Query key" value={memory.query} onChange={query => setMemory(current => ({ ...current, query }))} options={['A', 'B', 'C', 'D', 'Absent'].map(key => [key, key])}/>
      <FlowSlider name="Matched score minus other scores" value={memory.scoreGap} min={-6} max={6} step={.01} onChange={scoreGap => setMemory(current => ({ ...current, scoreGap }))}/>
    </FlowControls>
    <FlowReadout>The normalized value contributions sum to <strong>{number(result.attention)}</strong>; the key-blind summary remains {number(result.summary)}. {memory.records.some(row => row.key === memory.query) ? 'Every matching record receives the same compatibility score.' : 'No key matches: all scores are zero, so this operator returns a uniform mixture rather than an absence flag.'}</FlowReadout>
  </FlowLab>;
}

export function HybridRecordOrderFlow() {
  const { memory, setMemory } = useContext(MemoryCase);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, memory.records.length - 1);
  const move = direction => {
    setMemory(current => {
      const records = [...current.records];
      [records[index], records[index + direction]] = [records[index + direction], records[index]];
      return { ...current, records };
    });
    setSelected(index + direction);
  };
  const result = memoryResult(memory);
  return <FlowLab id="hybrid-record-order" label="Reorder existing records without changing their fields">
    <HybridRecordsDrawing records={memory.records} selected={index}/>
    <FlowControls>
      <HybridFlowSelect name="Record to move" value={index} onChange={value => setSelected(Number(value))} options={memory.records.map((row, position) => [position, `Arrival ${position + 1}: ${row.key}:${number(row.value)}`])}/>
      <button type="button" disabled={index === 0} onClick={() => move(-1)}>Move earlier</button>
      <button type="button" disabled={index === memory.records.length - 1} onClick={() => move(1)}>Move later</button>
    </FlowControls>
    <FlowReadout>The summary is now <strong>{number(result.summary)}</strong>. The query read is {number(result.attention)}: reordering these unchanged key/value records only permutes the terms of this position-free sum.</FlowReadout>
  </FlowLab>;
}

export function HybridMemoryCaseFlow() {
  const { memory, setMemory, memoryPin, setMemoryPin } = useContext(MemoryCase);
  const current = memoryResult(memory);
  const previous = memoryPin ? memoryResult(memoryPin) : null;
  return <FlowLab id="hybrid-memory-case" label="Change stream length, pin a complete memory case or restore it">
    <HybridRecordsDrawing records={memory.records}/>
    <FlowControls>
      <FlowSlider name="Number of stored records" value={memory.records.length} min={1} max={8} step={1} onChange={length => setMemory(state => ({ ...state, records: Array.from({ length }, (_, position) => state.records[position] ?? { key: 'A', value: 0 }) }))}/>
      <button type="button" onClick={() => setMemoryPin(structuredClone(memory))}>Pin this complete case</button>
      <button type="button" onClick={() => { setMemory({ records: structuredClone(hybridFlowInitialRecords), query: 'A', decay: .5, scoreGap: Math.log(9) }); setMemoryPin(null); }}>Reset memory case</button>
    </FlowControls>
    <FlowReadout>{previous ? <>Relative to the immutable pinned case, summary changed by {number(current.summary - previous.summary)} and query read by {number(current.attention - previous.attention)}. The pin preserves all keys, values, their order, query and both weighting settings.</> : <>The two-number summary stays fixed in size. The addressable record bank now holds {memory.records.length} key/value pairs. New arrivals initially contain A:0; edit them using the earlier record control.</>}</FlowReadout>
    {memoryPin && <p>Pinned records: {memoryPin.records.map(row => `${row.key}:${number(row.value)}`).join(', ')}; query {memoryPin.query}; λ={number(memoryPin.decay)}; score gap={number(memoryPin.scoreGap)}.</p>}
  </FlowLab>;
}

export function HybridTinyStateFlow({ view = 'state' }) {
  const { input, setInput } = useContext(SelectiveCase);
  const trace = hybridTinySelectiveStep({ input });
  const Drawing = view === 'objects' ? HybridSelectiveObjectsDrawing
    : view === 'coefficients' ? HybridSelectiveCoefficientsDrawing : HybridSelectiveStateDrawing;
  return <FlowLab id={`hybrid-tiny-${view}`} label="Change a taught mixer input while retaining all shown weights and old state">
    {view === 'output' ? <HybridFlowArray values={trace.output} names={['current output 0', 'current output 1']} label="Current complete selective mixer output"/> : <Drawing trace={trace}/>}
    <FlowControls>{input.map((value, channel) => <FlowSlider key={channel} name={`Mixer input coordinate ${channel}`} value={value} min={-4} max={4} step={.05} onChange={next => setInput(current => current.map((value, index) => index === channel ? next : value))}/>)}</FlowControls>
    <FlowReadout>The complete projected, convolved, selectively written and gated output is <strong>[{trace.output.map(value => number(value)).join(', ')}]</strong>. The old state, two history slots and learned matrices remain the constructed coefficients shown above; changing one input recomputes every downstream operand.</FlowReadout>
  </FlowLab>;
}

export function HybridDiscretizationFlow() {
  const [interval, setInterval] = useState(1), [rate, setRate] = useState(-1);
  const result = hybridFlowDiscretization(rate, interval, 2, 1);
  return <FlowLab id="hybrid-discretization" label="Compare exact constant-input integration with the Δ times input write">
    <HybridFlowDrawing id="discretization" label="One old state receives identical exponential retention and two different constant-input writes" width={550} height={350}>
      <HybridFlowValue x={275} y={60} value={1} name="old state" role="input"/>
      {[['exact ZOH',result.exactWrite,result.exactState,140],['Δ × input',result.approximateWrite,result.approximateState,410]].map(([name,write,state,x]) => <g key={name}>
        <HybridFlowWire points={[[275,89],[275,112],[x,112],[x,149]]}/>
        <HybridFlowLabel x={x} y={143} anchor="middle">retain ×{number(result.decay,5)}</HybridFlowLabel>
        <HybridFlowLabel x={x} y={181} role="computed" anchor="middle">write +{number(write,5)}</HybridFlowLabel>
        <HybridFlowWire points={[[x,193],[x,230]]}/>
        <HybridFlowValue x={x} y={262} value={state} radius={40}/>
        <HybridFlowLabel x={x} y={332} anchor="middle">{name}</HybridFlowLabel>
      </g>)}
    </HybridFlowDrawing>
    <FlowControls>
      <FlowSlider name="Step interval Δ" value={interval} min={0} max={2} step={.01} onChange={setInterval}/>
      <FlowSlider name="Continuous rate A" value={rate} min={-3} max={0} step={.01} onChange={setRate}/>
    </FlowControls>
    <FlowReadout>With constant input contribution 2 and starting state 1, exact integration gives <strong>{number(result.exactState)}</strong>; the common selective-model write gives {number(result.approximateState)}. Their signed difference is {number(result.approximateState - result.exactState)}. At A=0 both use the continuous limit Δ; at Δ=0 both leave the state unchanged.</FlowReadout>
  </FlowLab>;
}

export function HybridCacheStorageDrawing({ config }) {
  const result = hybridFlowBudget(config);
  const recurrentLayers = config.layers - config.attentionLayers;
  return <figure data-figure="hybrid-cache-objects" aria-label="Separate persistent recurrent state, convolution history and addressable keys and values">
    <HybridFlowMatrix matrix={[[config.batch,recurrentLayers,config.width*config.expand,config.stateSize,config.stateBytes],[config.batch,recurrentLayers,config.width*config.expand,config.convWidth,config.convBytes]]} rowNames={['H: recurrent state','short projected history']} columnNames={['requests','selective layers','channels','slots per channel','bytes per scalar']} label="Fixed request tensor shapes; model weights and temporary work are separate allocations"/>
    <HybridFlowMatrix matrix={[[config.batch,config.attentionLayers,2,config.kvHeads,result.retained,config.headWidth,config.kvBytes]]} rowNames={['K and V banks']} columnNames={['requests','attention layers','K/V pair','stored heads','retained positions','head coordinates','bytes per scalar']} label="Addressable storage: every attention layer appends its own keys and values"/>
    <div className="hybrid-flow-storage-totals">{[['K/V',result.kv],['H',result.recurrent],['short history',result.convolution],['total request',result.total]].map(([name,value]) => <p key={name}>{name}: <strong>{value.toString()} bytes</strong></p>)}</div>
    <figcaption>Multiply each row's dimensions; add allocations rather than adding dimensions. The history row reserves C slots. The later trained model instead stores only C−1 previous projected inputs.</figcaption>
  </figure>;
}

const budgetViews = {
  request: [['length','Input positions',0,262144,1],['batch','Concurrent requests',1,32,1],['attentionLayers','Attention layers',0,null,1]],
  state: [['width','Model coordinates d',32,8192,32],['expand','Expanded-channel factor e',1,4,1],['stateSize','State coordinates N',1,256,1]],
  heads: [['kvHeads','Stored K/V heads',1,64,1],['headWidth','Coordinates per K/V head',8,256,8],['layers','Total depth layers',1,96,1]],
  history: [['convWidth','Reserved convolution slots C',1,8,1],['stateBytes','H bytes per scalar',1,4,1],['convBytes','History bytes per scalar',1,4,1]],
};

export function HybridBudgetFlow({ view = 'request' }) {
  const { budget, setBudget } = useContext(BudgetCase);
  const result = hybridFlowBudget(budget);
  const change = (key,value) => setBudget(current => ({ ...current,[key]:value,...(key==='layers' && current.attentionLayers>value ? {attentionLayers:value}: {}) }));
  return <FlowLab id={`hybrid-budget-${view}`} label={`Change the ${view} dimensions of the shared request budget`}>
    <HybridCacheStorageDrawing config={budget}/>
    <FlowControls>{budgetViews[view].map(([key,name,min,max,step]) => <FlowSlider key={key} name={name} value={budget[key]} min={min} max={max ?? budget.layers} step={step} onChange={value => change(key,value)}/>)}</FlowControls>
    <FlowReadout>The same shared request configuration now reserves <strong>{result.total.toString()} bytes</strong> ({number(Number(result.total)/2**30,9)} GiB). {view==='heads' ? 'If depth is reduced below the attention count, that count is also reduced and remains visible in the earlier request controls.' : 'Only the dimensions selected here changed; the other request settings remain fixed.'}</FlowReadout>
  </FlowLab>;
}

export function HybridWindowFlow() {
  const { budget, setBudget } = useContext(BudgetCase);
  const result = hybridFlowBudget(budget);
  const expired = budget.length - result.retained;
  const sample = Array.from({length: Math.min(8,budget.length)},(_,position)=>budget.length-Math.min(8,budget.length)+position);
  return <FlowLab id="hybrid-budget-window" label="Count retained rows after applying a separately taught attention window">
    <HybridFlowDrawing id="window-records" label="The last actual integer positions are marked available or expired under the current retention rule" width={620} height={230}>
      <HybridFlowLabel x={15} y={28}>Last {sample.length} positions of {budget.length}; expired prefix has {expired} positions.</HybridFlowLabel>
      {sample.map((position,index)=><g key={position}>
        <rect x={15+index*75} y={70} width={66} height={66} fill={position>=expired?'#152a3a':'#151515'} stroke={position>=expired?hybridFlowRoles.input:'#777'}/>
        <HybridFlowLabel x={48+index*75} y={108} anchor="middle" role={position>=expired?'input':'operation'}>{position}</HybridFlowLabel>
        {position<expired&&<path d={`M${20+index*75} 75 l56 56 M${20+index*75} 131 l56 -56`} stroke="#999"/>}
      </g>)}
      <HybridFlowLabel x={15} y={184}>Blue rows are directly addressable; crossed rows are unavailable.</HybridFlowLabel>
      <HybridFlowLabel x={15} y={215}>Exact full bank: {result.retained} rows per K/V head.</HybridFlowLabel>
    </HybridFlowDrawing>
    <FlowControls>
      <HybridFlowSelect name="Retention rule" value={budget.window===null?'full':'window'} onChange={value=>setBudget(current=>({...current,window:value==='full'?null:4096}))} options={[["full","Full causal bank"],["window","Hypothetical fixed window"]]}/>
      {budget.window!==null&&<FlowSlider name="Window positions W" value={budget.window} min={1} max={262144} step={1} onChange={window=>setBudget(current=>({...current,window}))}/>}
      <FlowSlider name="K/V bytes per scalar" value={budget.kvBytes} min={1} max={4} step={1} onChange={kvBytes=>setBudget(current=>({...current,kvBytes}))}/>
    </FlowControls>
    <FlowReadout>K/V now retains <strong>{result.retained}</strong> positions and occupies {result.kv.toString()} bytes. H still occupies {result.recurrent.toString()} bytes. A smaller hypothetical window changes which earlier representations can be read; it is not an exact compression of full attention.</FlowReadout>
  </FlowLab>;
}

export function HybridBudgetCaseFlow() {
  const { budget, setBudget, budgetPin, setBudgetPin } = useContext(BudgetCase);
  const result = hybridFlowBudget(budget);
  return <FlowLab id="hybrid-budget-case" label="Preserve or restore the complete request configuration">
    <HybridCacheStorageDrawing config={budget}/>
    <FlowControls>
      <button type="button" onClick={()=>setBudgetPin(structuredClone(budget))}>Pin all budget dimensions</button>
      <button type="button" onClick={()=>{setBudget({...jambaOriginalBudget});setBudgetPin(null);}}>Reset original dimensions</button>
    </FlowControls>
    <FlowReadout>{budgetPin ? <>Current total minus the immutable pinned total is {(result.total-hybridFlowBudget(budgetPin).total).toString()} bytes.</> : <>The default original configuration uses 4.015380859375 GiB of counted request storage at 262,144 positions. This excludes model weights, temporary activations and allocator overhead.</>}</FlowReadout>
    {budgetPin&&<p>Pinned configuration: {Object.entries(budgetPin).map(([key,value])=>`${key}=${value===null?'full':value}`).join(', ')}.</p>}
  </FlowLab>;
}

export function HybridRouterDrawing({ router, renormalize = false }) {
  const results=hybridFlowRouter(router.scores,router.values,router.k),result=renormalize?results.renormalized:results.retained;
  return <figure data-figure="hybrid-router" aria-label="All full-softmax probabilities and selected weighted two-coordinate outputs">
    <HybridSoftmaxCircuit scores={router.scores} labels={router.scores.map((_,index)=>`expert E${index}`)} inputRole="input"/>
    <HybridFlowDrawing id="expert-probabilities" label="Each of the four expert scores participates in the full denominator; selected experts are marked by the white outline" width={600} height={380}>
      {result.probabilities.map((probability,index)=><g key={index}>
        <HybridFlowLabel x={10} y={43+index*78} role="input">E{index} score {number(router.scores[index],4)}</HybridFlowLabel>
        <rect x={225} y={19+index*78} width={250*probability} height={30} fill={hybridFlowRoles.computed}/>
        {result.selected.includes(index)&&<rect x={220} y={14+index*78} width={260} height={40} fill="none" stroke="#eee"/>}
        <HybridFlowLabel x={225} y={72+index*78} role="computed">p={number(probability,6)}; {result.selected.includes(index)?'selected':'not selected'}</HybridFlowLabel>
      </g>)}
      <HybridFlowLabel x={10} y={361}>Bar width 250 means probability 1.</HybridFlowLabel>
    </HybridFlowDrawing>
    <HybridFlowMatrix matrix={router.values} rowNames={['E0 output','E1 output','E2 output','E3 output']} columnNames={['coordinate 0','coordinate 1']} label="Constructed current expert outputs; these vectors are inputs to the mixing experiment" role="input"/>
    <HybridFlowMatrix matrix={result.contributions} rowNames={result.selected.map((index,rank)=>`selected E${index}; weight ${number(result.weights[rank],6)}`)} columnNames={['weighted coordinate 0','weighted coordinate 1']} label={renormalize?'Comparison: divide selected probabilities by selected mass before multiplying':'Jamba convention: multiply by retained full-softmax probabilities'}/>
    <HybridFlowArray values={result.output} names={['sum coordinate 0','sum coordinate 1']} label="Mixture output"/>
    <figcaption>White outlines mean selected experts; violet bar length means full probability. Selected probability mass is {number(result.selectedMass)}. {result.boundaryTie?'At this tie, the teaching implementation chooses the lower expert ID first; other top-k implementations need not use that tie rule.':'No tie crosses the current selection boundary.'}</figcaption>
  </figure>;
}

export function HybridRouterScoreFlow() {
  const { router, setRouter }=useContext(RouterCase);const[selected,setSelected]=useState(0);
  const result=hybridFlowRouter(router.scores,router.values,router.k).retained;
  return <FlowLab id="hybrid-router-scores" label="Change one expert's score and the selected expert count">
    <HybridRouterDrawing router={router}/>
    <FlowControls>
      <HybridFlowSelect name="Expert score to change" value={selected} onChange={value=>setSelected(Number(value))} options={[0,1,2,3].map(index=>[index,`E${index}`])}/>
      <FlowSlider name={`E${selected} compatibility score`} value={router.scores[selected]} min={-8} max={8} step={.01} onChange={value=>setRouter(current=>({...current,scores:current.scores.map((score,index)=>index===selected?value:score)}))}/>
      <FlowSlider name="Selected experts k" value={router.k} min={1} max={4} step={1} onChange={k=>setRouter(current=>({...current,k}))}/>
    </FlowControls>
    <FlowReadout>Selected experts {result.selected.map(index=>`E${index}`).join(', ')} contribute output <strong>[{result.output.map(value=>number(value)).join(', ')}]</strong>. Changing an unselected score can change the full denominator before it changes the selected set.</FlowReadout>
  </FlowLab>;
}

export function HybridRouterValueFlow() {
  const { router, setRouter }=useContext(RouterCase);const[selected,setSelected]=useState(0),[coordinate,setCoordinate]=useState(0);
  const result=hybridFlowRouter(router.scores,router.values,router.k).retained;
  return <FlowLab id="hybrid-router-values" label="Change one coordinate of one expert output without changing scores">
    <HybridRouterDrawing router={router}/>
    <FlowControls>
      <HybridFlowSelect name="Expert output to change" value={selected} onChange={value=>setSelected(Number(value))} options={[0,1,2,3].map(index=>[index,`E${index}`])}/>
      <HybridFlowSelect name="Output coordinate" value={coordinate} onChange={value=>setCoordinate(Number(value))} options={[[0,'coordinate 0'],[1,'coordinate 1']]}/>
      <FlowSlider name={`E${selected} coordinate ${coordinate}`} value={router.values[selected][coordinate]} min={-10} max={10} step={.1} onChange={value=>setRouter(current=>({...current,values:current.values.map((row,index)=>row.map((currentValue,column)=>index===selected&&column===coordinate?value:currentValue))}))}/>
    </FlowControls>
    <FlowReadout>The scores and selected set remain fixed. {result.selected.includes(selected)?`E${selected} is selected, so its edited coordinate enters the weighted sum.`:`E${selected} is unselected, so changing its output alone is a genuine null intervention.`} Current output is <strong>[{result.output.map(value=>number(value)).join(', ')}]</strong>.</FlowReadout>
  </FlowLab>;
}

export function HybridRouterConventionFlow() {
  const { router, setRouter, routerPin, setRouterPin }=useContext(RouterCase);
  const[renormalize,setRenormalize]=useState(false);const results=hybridFlowRouter(router.scores,router.values,router.k);
  return <FlowLab id="hybrid-router-convention" label="Compare retained probability mass with a deliberately different renormalized operator">
    <HybridRouterDrawing router={router} renormalize={renormalize}/>
    <FlowControls>
      <HybridFlowSelect name="Selected-weight operator" value={renormalize?'renormalized':'retained'} onChange={value=>setRenormalize(value==='renormalized')} options={[["retained","Retained full probabilities"],["renormalized","Comparison: renormalized selected weights"]]}/>
      <button type="button" onClick={()=>setRouterPin(structuredClone(router))}>Pin complete router input</button>
      <button type="button" onClick={()=>{setRouter({scores:[...originalScores],values:structuredClone(originalOutputs),k:2});setRouterPin(null);setRenormalize(false);}}>Reset router case</button>
    </FlowControls>
    <FlowReadout>Retaining mass gives [{results.retained.output.map(value=>number(value)).join(', ')}]; renormalizing gives [{results.renormalized.output.map(value=>number(value)).join(', ')}]. {router.k===4?'All experts are selected, so the mass is 1 and both conventions coincide.':'The two routes share the same selected experts and raw outputs; only their weights differ.'}</FlowReadout>
    {routerPin&&<p>Pinned scores [{routerPin.scores.map(value=>number(value)).join(', ')}], k={routerPin.k}, output vectors {routerPin.values.map(row=>`[${row.map(value=>number(value)).join(', ')}]`).join('; ')}. The pin is an independent copy of all inputs.</p>}
  </FlowLab>;
}
