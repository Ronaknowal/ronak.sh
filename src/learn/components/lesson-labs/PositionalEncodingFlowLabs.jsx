import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { alibiCompetition, alibiSlopes, cachePositionRead, extensionFrequencies, frequencies, positionCacheDefault, positionMovementForward, positionMovementForwardWithMasks, rotate, sinusoidal } from '../../data/positional-encoding-models.js';
import { dot, maxDifference, softmax } from '../../data/sequence-tensor-operations.js';
import { PositionAdditiveDrawing, PositionAlibiDrawing, PositionArray, PositionBasisDrawing, PositionBucketDrawing, PositionCacheDrawing, PositionClocksDrawing, PositionDrawing, PositionExtensionDrawing, PositionInterpolationDrawing, PositionPairDrawing, PositionPartialDrawing, PositionShawDrawing, PositionSlopeDrawing, PositionXposDrawing, PositionCells, PositionText, PositionArrow, positionColors, positionVector } from './PositionalEncodingFlowFigures.jsx';
import './positional-encoding-labs.css';

const originalContent=[[1,2],[-1,1],[.5,-.5]],originalTable=[[.2,0],[0,.3],[-.1,.1]],q0=[.8,-.5,.3,1.2],k0=[1,.25,-.5,.75];
const PositionCases = Object.fromEntries(['additive','rotary','alibi','cache','extension'].map(name=>[name,createContext(null)]));
export function PositionCaseProvider({ children }) {
  const [additive,setAdditive]=useState({content:originalContent,table:originalTable,association:false,storage:false});
  const [rotary,setRotary]=useState({m:3,n:7,exponent:4,shift:0,q:q0,k:k0});
  const [alibi,setAlibi]=useState({scores:[2,0,0,0],keys:[0,1,2,3],query:3,slope:.5,constant:0});
  const [cache,setCache]=useState(()=>({settings:positionCacheDefault(),reversed:false,shift:0}));
  const [extension,setExtension]=useState({factor:8,pair:0,offset:8,q:[1,0],k:[0,1]});
  const extensionValue=useMemo(()=>[extension,setExtension],[extension]);
  const additiveValue=useMemo(()=>[additive,setAdditive],[additive]),rotaryValue=useMemo(()=>[rotary,setRotary],[rotary]),alibiValue=useMemo(()=>[alibi,setAlibi],[alibi]),cacheValue=useMemo(()=>[cache,setCache],[cache]);
  return <PositionCases.additive.Provider value={additiveValue}><PositionCases.rotary.Provider value={rotaryValue}><PositionCases.alibi.Provider value={alibiValue}><PositionCases.cache.Provider value={cacheValue}><PositionCases.extension.Provider value={extensionValue}>{children}</PositionCases.extension.Provider></PositionCases.cache.Provider></PositionCases.alibi.Provider></PositionCases.rotary.Provider></PositionCases.additive.Provider>;
}
function useCase(name) {
  const context=useContext(PositionCases[name]);
  if(!context) throw new Error('Position investigations require their shared case provider.');
  const [state,setState]=context;
  const property=key=>[state[key],value=>setState(old=>({...old,[key]:typeof value==='function'?value(old[key]):value}))];
  return {state,property,setState};
}
export function PositionCaseReset({name}) {
  const {setState}=useCase(name);
  const defaults={extension:()=>({factor:8,pair:0,offset:8,q:[1,0],k:[0,1]}),additive:()=>({content:originalContent,table:originalTable,association:false,storage:false}),rotary:()=>({m:3,n:7,exponent:4,shift:0,q:q0,k:k0}),alibi:()=>({scores:[2,0,0,0],keys:[0,1,2,3],query:3,slope:.5,constant:0}),cache:()=>({settings:positionCacheDefault(),reversed:false,shift:0})};
  return <FlowControls><button type="button" onClick={()=>setState(defaults[name]())}>Restore initial {name==='rotary'?'Q/K':name} case</button></FlowControls>;
}
function Selection({ name,value,onChange,options }) {
  const id=useId();
  return <label className="position-flow-select" htmlFor={id}><span>{name}</span><select id={id} value={value} onChange={e=>onChange(Number(e.target.value))}>{options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>;
}
const indices=(length,label='record')=>Array.from({length},(_,i)=>[i,`${label} ${i}`]);

export function PositionAdditiveLab({ investigation='association' }) {
  const {state,property}=useCase('additive'),[content,setContent]=property('content'),[table,setTable]=property('table'),[selected,setSelected]=useState(0),[changed,setChanged]=property(investigation==='storage'?'storage':'association');
  const order=state.storage ? [1,2,0]:[0,1,2],attached=state.association?[1,0,2]:[0,1,2],ids=order.map(i=>attached[i]);
  const result=order.map((i,j)=>content[i].map((v,k)=>v+table[ids[j]][k]));
  const difference=Math.max(...result.map((row,j)=>maxDifference(row,content[order[j]].map((v,k)=>v+table[order[j]][k]))));
  const editing=investigation==='content' ? content:table,change=(coordinate,value)=>(investigation==='content' ? setContent:setTable)(previous=>previous.map((row,i)=>i===selected ? row.map((v,j)=>j===coordinate ? value:v):row));
  return <FlowLab id={`position-additive-${investigation}`} label={`Position addition: ${investigation}`}>
    <PositionAdditiveDrawing content={content} table={table} order={order} ids={ids}/>
    <FlowControls>{['association','storage'].includes(investigation) ? <FlowChoice label={investigation==='storage' ? 'Move complete records':'Swap A/B attached IDs'} value={changed} options={[[false,'Original'],[true,investigation==='storage'?'A moves to end':'IDs swapped']]} onChange={setChanged}/> : <><Selection name={investigation==='content'?'Content row':'Position-table row'} value={selected} onChange={setSelected} options={indices(3,'row')}/><FlowSlider name="First coordinate" value={editing[selected][0]} min={-3} max={3} step={.05} onChange={v=>change(0,v)}/><FlowSlider name="Second coordinate" value={editing[selected][1]} min={-3} max={3} step={.05} onChange={v=>change(1,v)}/></>}</FlowControls>
    <FlowReadout>After matching each record by identity, changing its attached ID changes its combined input by at most {number(difference,6)}; moving complete records preserves that input. Current first stored combined row is {positionVector(result[0])}.</FlowReadout>
  </FlowLab>;
}
export function PositionClockLab({ investigation='phase' }) {
  const [position,setPosition]=useState(3),[pair,setPair]=useState(0),[exponent,setExponent]=useState(4),[width,setWidth]=useState(8);
  const activeWidth=investigation==='width'?width:8,base=investigation==='width'?10000:10**exponent,w=frequencies(activeWidth,base)[pair];
  return <FlowLab id={`position-clock-${investigation}`} label={`Computed clock: ${investigation}`}>
    <PositionClocksDrawing position={position} width={activeWidth} base={base} selected={pair}/>
    {investigation==='width' && <PositionArray label="Complete selected-width code at position 3" values={sinusoidal(3,width)}/>} 
    <FlowControls>{investigation==='width' ? <Selection name="Recompute encoding width" value={width} onChange={setWidth} options={[[8,'8 coordinates'],[32,'32 coordinates']]}/> : <><FlowSlider name="Position" value={position} min={0} max={255} step={1} onChange={setPosition}/><FlowSlider name="Inspected pair" value={pair} min={0} max={3} step={1} onChange={setPair}/><FlowSlider name="Base = 10 to this power" value={exponent} min={1} max={6} step={.1} onChange={setExponent}/></>}</FlowControls>
    <FlowReadout>Pair {pair} turns {number(w,8)} radians per position; at position {position} its stored [sin, cos] is {positionVector([Math.sin(position*w),Math.cos(position*w)],8)}. One turn takes {number(2*Math.PI/w,5)} positions. The default pair at position 3, width 8 and base 10000 is {positionVector([Math.sin(3),Math.cos(3)],8)}.</FlowReadout>
  </FlowLab>;
}
export function PositionRotaryLab({ investigation='positions' }) {
  const {property}=useCase('rotary'),[m,setM]=property('m'),[n,setN]=property('n'),[exponent,setExponent]=property('exponent'),[shift,setShift]=property('shift'),[entity,setEntity]=useState(0),[coordinate,setCoordinate]=useState(0),[q,setQ]=property('q'),[k,setK]=property('k');
  const base=10**exponent,query=q,key=k;
  const queryId=m+shift,keyId=n+shift,score=dot(rotate(query,queryId,base),rotate(key,keyId,base));
  return <FlowLab id={`position-rotary-${investigation}`} label={`Rotary matching: ${investigation}`}>
    {[0,1].map(pair=><PositionPairDrawing key={pair} pair={pair} query={query} keyVector={key} queryId={queryId} keyId={keyId} base={base} relative={investigation==='relative'}/>)}
    <FlowControls>{investigation==='shift' ? <FlowSlider name="Add this to both IDs" value={shift} min={-128} max={256} step={1} onChange={setShift}/> : investigation==='content' ? <><Selection name="Local projected vector" value={entity} onChange={setEntity} options={[[0,'Query Q'],[1,'Key K']]}/><Selection name="Coordinate" value={coordinate} onChange={setCoordinate} options={indices(4,'coordinate')}/><FlowSlider name="Coordinate value" value={(entity===0?q:k)[coordinate]} min={-3} max={3} step={.05} onChange={value=>(entity===0?setQ:setK)(old=>old.map((v,j)=>j===coordinate?value:v))}/></> : investigation==='relative' ? null : <><FlowSlider name="Query ID m" value={m} min={-128} max={256} step={1} onChange={setM}/><FlowSlider name="Key ID n" value={n} min={-128} max={256} step={1} onChange={setN}/><FlowSlider name="Base = 10 to this power" value={exponent} min={1} max={6} step={.1} onChange={setExponent}/></>}</FlowControls>
    <FlowReadout>The two pair sums give {number(score,6)}; dividing by √4 gives logit {number(score/2,6)}. The independently arranged q·R(n−m)k gives {number(dot(query,rotate(key,keyId-queryId,base)),6)}. {investigation==='content' ? 'This edits already-projected Q/K locally; it does not recompute one shared learned input map.':'A common ID shift changes the drawn angles and preserves this fixed-content score.'}</FlowReadout>
  </FlowLab>;
}
export function PositionToeplitzLab({ investigation='coordinate' }) {
  const [rows,setRows]=useState(Array.from({length:4},()=>[...q0])),[row,setRow]=useState(1),[coordinate,setCoordinate]=useState(0),[scale,setScale]=useState(1);
  const actual=investigation==='scale' ? Array.from({length:4},(_,i)=>q0.map(v=>i===1?v*scale:v)):rows,rotated=actual.map((v,i)=>rotate(v,i));
  return <FlowLab id={`position-toeplitz-${investigation}`} label="Actual content controls the rotary score matrix">
    <PositionArray label="Projected content: this same array supplies Q and K" values={actual} role="input"/>
    <PositionArray label="Unscaled Q′·K′ matrix: equal-content offset diagonals" values={rotated.map(q=>rotated.map(k=>dot(q,k)))} columns={indices(4,'key').map(([,s])=>s)} rows={indices(4,'query').map(([,s])=>s)} digits={6}/>
    <FlowControls>{investigation==='scale' ? <FlowSlider name="Scale only content row 1" value={scale} min={0} max={3} step={.1} onChange={setScale}/> : <><Selection name="Content row" value={row} onChange={setRow} options={indices(4,'position')}/><Selection name="Coordinate" value={coordinate} onChange={setCoordinate} options={indices(4,'coordinate')}/><FlowSlider name="Coordinate value" value={rows[row][coordinate]} min={-3} max={3} step={.05} onChange={value=>setRows(old=>old.map((v,i)=>i===row?v.map((x,j)=>j===coordinate?value:x):v))}/></>}</FlowControls>
    <FlowReadout>Diagonal score at position 1 is {number(dot(rotated[1],rotated[1]),6)}. The equal-content default is 2.42; multiplying that row by 2 makes it 9.68 and doubles its off-diagonal products. General content changes can destroy constant offset diagonals without violating the local rotary identity.</FlowReadout>
  </FlowLab>;
}
export function PositionDistanceLab() {
  const [offset,setOffset]=useState(3),score=Math.cos(offset);
  return <FlowLab id="position-nonmonotone" label="A one-pair score need not decrease with distance"><PositionPairDrawing query={[1,0]} keyVector={[1,0]} queryId={0} keyId={offset}/><FlowControls><FlowSlider name="Relative key distance" value={offset} min={0} max={12} step={1} onChange={setOffset}/></FlowControls><FlowReadout>The unscaled score is cos({offset}) = {number(score,9)}. Distance 3 gives −0.989992497; distance 6 gives +0.960170287. A longer gap can give a larger score.</FlowReadout></FlowLab>;
}
export function PositionPartialLab() {
  const [pairs,setPairs]=useState(1);
  return <FlowLab id="position-partial" label="Separate rotated and untouched subsets"><PositionPartialDrawing pairs={pairs}/><FlowControls><FlowSlider name="Number of rotating coordinate pairs" value={pairs} min={0} max={2} step={1} onChange={setPairs}/></FlowControls><FlowReadout>{2*pairs} of the four coordinates rotate; the complete head still divides its summed dot product by √4. Zero rotating pairs is a plain content comparison.</FlowReadout></FlowLab>;
}
export function PositionAlibiLab({ investigation='competition' }) {
  const {property}=useCase('alibi'),[scores,setScores]=property('scores'),[keys,setKeys]=property('keys'),[query,setQuery]=property('query'),[slope,setSlope]=property('slope'),[constant,setConstant]=property('constant'),[selected,setSelected]=useState(0),[first,setFirst]=useState(0),[second,setSecond]=useState(1);
  const result=alibiCompetition(scores.map(v=>v+constant),keys,query,slope);
  const legalPair=result.weights && result.legal[first] && result.legal[second];
  return <FlowLab id={`position-alibi-${investigation}`} label={`Distance-biased matching: ${investigation}`}>
    <PositionAlibiDrawing scores={scores.map(v=>v+constant)} keys={keys} query={query} slope={slope} result={result}/>
    <FlowControls>{investigation==='keys' ? <><Selection name="Key record" value={selected} onChange={setSelected} options={indices(keys.length,'key')}/><FlowSlider name="Selected content score" value={scores[selected]} min={-8} max={8} step={.1} onChange={value=>setScores(old=>old.map((v,i)=>i===selected?value:v))}/><FlowSlider name="Selected key ID" value={keys[selected]} min={-16} max={32} step={1} onChange={value=>setKeys(old=>old.map((v,i)=>i===selected?value:v))}/></> : investigation==='permission' ? <><FlowSlider name="Receiver query ID" value={query} min={-16} max={32} step={1} onChange={setQuery}/><FlowSlider name="Key 3 ID" value={keys[3]} min={-16} max={32} step={1} onChange={value=>setKeys(old=>old.map((v,i)=>i===3?value:v))}/></> : investigation==='odds' ? <><Selection name="Odds numerator key" value={first} onChange={setFirst} options={indices(3,'key')}/><Selection name="Odds denominator key" value={second} onChange={setSecond} options={indices(3,'key')}/><FlowSlider name="Unrelated key 3 score" value={scores[3]} min={-8} max={8} step={.1} onChange={value=>setScores(old=>old.map((v,i)=>i===3?value:v))}/></> : <><FlowSlider name="Distance penalty slope" value={slope} min={0} max={1} step={.025} onChange={setSlope}/><FlowSlider name="Distant key 0 content score" value={scores[0]} min={-8} max={8} step={.1} onChange={value=>setScores(old=>old.map((v,i)=>i===0?value:v))}/><FlowSlider name="Common offset added to every content score" value={constant} min={-8} max={8} step={.1} onChange={setConstant}/></>}</FlowControls>
    <FlowReadout>{result.weights ? `Key 0 has share ${number(result.weights[0],6)}. ` : 'No legal key: a normalized attention distribution is undefined. '}{legalPair ? `Key ${first}/key ${second} odds are ${number(result.weights[first]/result.weights[second],6)}, exactly exp(${number(scores[first]-scores[second])}) × exp(${number(slope*(keys[first]-keys[second]))}).` : 'An odds ratio involving a forbidden key is not a finite legal-pair comparison.'} A common row offset cancels; a changed unrelated competitor affects shares and leaves a fixed legal pair’s odds unchanged.</FlowReadout>
  </FlowLab>;
}
export function PositionSlopeLab() {
  const [heads,setHeads]=useState(3);
  return <FlowLab id="position-head-slopes" label="Original head slope ordering"><PositionSlopeDrawing heads={heads}/><FlowControls><Selection name="Number of heads" value={heads} onChange={setHeads} options={[2,3,4,8].map(h=>[h,`${h} heads`])}/></FlowControls><FlowReadout>The original ordered slopes are {positionVector(alibiSlopes(heads),8)}. Head IDs are retained; the non-power-of-two schedule is not sorted.</FlowReadout></FlowLab>;
}
export function PositionShawLab() {
  const [offset,setOffset]=useState(-1),[coordinate,setCoordinate]=useState(2);
  return <FlowLab id="position-shaw" label="Query-dependent learned relation"><PositionShawDrawing query={[coordinate,0]} offset={offset}/><FlowControls><FlowSlider name="First query coordinate" value={coordinate} min={-3} max={3} step={.1} onChange={setCoordinate}/><FlowSlider name="Key-minus-query offset" value={offset} min={-8} max={8} step={1} onChange={setOffset}/></FlowControls><FlowReadout>The offset clips to {Math.min(2,Math.max(-2,offset))}; its learned key relation contributes {number(coordinate*[[-.2,.1],[.5,1],[0,0],[.25,-.5],[.1,.2]][Math.min(2,Math.max(-2,offset))+2][0])} before score scaling. Its separate value relation is added to the selected message, not to the score.</FlowReadout></FlowLab>;
}
export function PositionBucketLab() {
  const [offset,setOffset]=useState(16);
  return <FlowLab id="position-bucket" label="T5 signed relative categories"><PositionBucketDrawing offset={offset}/><FlowControls><FlowSlider name="Signed key-minus-query offset" value={offset} min={-256} max={256} step={1} onChange={setOffset}/></FlowControls><FlowReadout>Nearby integer offsets select exact categories; distant offsets share bins and eventually saturate. The category’s learned scalar may have either sign, and permission is decided separately.</FlowReadout></FlowLab>;
}
export function PositionCacheLab({ investigation='angle' }) {
  const {property}=useCase('cache'),[settings,setSettings]=property('settings'),[entity,setEntity]=useState(0),[coordinate,setCoordinate]=useState(0),[selected,setSelected]=useState(0),[reversed,setReversed]=property('reversed'),[shift,setShift]=property('shift');
  const shifted={...settings,ids:settings.ids.map(id=>id+shift),queryId:settings.queryId+shift,rotaryId:settings.rotaryId+shift,maskId:settings.maskId+shift};
  const actualSettings=reversed ? {...shifted,ids:[...shifted.ids].reverse(),keys:[...shifted.keys].reverse(),values:[...shifted.values].reverse()}:shifted;
  const actual=cachePositionRead(actualSettings),full=cachePositionRead(actualSettings,true),alibiRead=investigation==='shift'?cachePositionRead({...actualSettings,mode:'alibi'}):null,change=(name,value)=>setSettings(old=>({...old,[name]:value}));
  const editRow=entity===0 ? settings.query:settings.keys[entity-1];
  const edit=(value)=>entity===0 ? change('query',settings.query.map((v,j)=>j===coordinate?value:v)) : change('keys',settings.keys.map((row,i)=>i===entity-1?row.map((v,j)=>j===coordinate?value:v):row));
  return <FlowLab id={`position-cache-${investigation}`} label={`Cache record investigation: ${investigation}`}>
    <PositionCacheDrawing settings={actualSettings} actual={actual} reference={full}/>
    <FlowControls>{investigation==='angle' ? <FlowSlider name="Actual query rotation ID" value={settings.rotaryId} min={0} max={32} step={1} onChange={v=>change('rotaryId',v)}/> : investigation==='mask' ? <FlowSlider name="Permitted key-ID cutoff" value={settings.maskId} min={0} max={32} step={1} onChange={v=>change('maskId',v)}/> : investigation==='content' ? <><Selection name="Projected entity" value={entity} onChange={setEntity} options={[[0,'Query Q'],...indices(settings.keys.length,'key').map(([i,s])=>[i+1,s])]}/><Selection name="Coordinate" value={coordinate} onChange={setCoordinate} options={indices(4,'coordinate')}/><FlowSlider name="Coordinate value" value={editRow[coordinate]} min={-3} max={3} step={.05} onChange={edit}/></> : investigation==='identity' ? <><Selection name="Original key slot" value={selected} onChange={setSelected} options={indices(settings.ids.length,'slot')}/><FlowSlider name="That key’s attached logical ID" value={settings.ids[selected]} min={0} max={32} step={1} onChange={v=>change('ids',settings.ids.map((id,i)=>i===selected?v:id))}/></> : investigation==='values' ? <><Selection name="Original value slot" value={selected} onChange={setSelected} options={indices(settings.values.length,'slot')}/><Selection name="Value coordinate" value={coordinate} onChange={setCoordinate} options={indices(2,'coordinate')}/><FlowSlider name="Stored value coordinate" value={settings.values[selected][coordinate]} min={-3} max={3} step={.05} onChange={v=>change('values',settings.values.map((row,i)=>i===selected?row.map((x,j)=>j===coordinate?v:x):row))}/></> : investigation==='storage' ? <FlowChoice label="Physical storage order" value={reversed} onChange={setReversed} options={[[false,'Original'],[true,'Reverse complete records']]}/> : investigation==='shift' ? <FlowSlider name="Common logical-ID shift" value={shift} min={0} max={128} step={1} onChange={setShift}/> : investigation==='base' ? <FlowSlider name="New base = 10 to this power" value={Math.log10(settings.base)} min={2} max={6} step={.1} onChange={v=>change('base',10**v)}/> : null}</FlowControls>
    <FlowReadout>{actual.output && full.output ? `Actual output ${positionVector(actual.output,6)}; consistent full reference ${positionVector(full.output,6)}; largest difference ${number(maxDifference(actual.output,full.output),6)}.` : 'No legal key: this row is rejected rather than turned into a probability distribution.'} {investigation==='base' ? 'Stored keys retain base 10000; the reference rephases the same fixed raw keys. This cannot rebuild earlier hidden states or values.': 'Each stored value follows its key and ID; physical storage is not its logical coordinate.'}</FlowReadout>
    {investigation==='shift' && <FlowReadout>{alibiRead.output ? `The ALiBi read of the same shifted records gives ${positionVector(alibiRead.output,6)}.`:'The ALiBi read also has no legal key and its normalized output is undefined.'} Both relative local rules preserve a common shift with permissions translated too.</FlowReadout>}
  </FlowLab>;
}
export function PositionExtensionLab({ investigation='geometry' }) {
  const {property}=useCase('extension'),[factor,setFactor]=property('factor'),[pair,setPair]=property('pair'),[offset,setOffset]=property('offset'),[entity,setEntity]=useState(0),[q,setQ]=property('q'),[k,setK]=property('k');
  const result=extensionFrequencies(64,10000,4096,factor),c=result.qkScale;
  const rotatePair=(row,angle)=>[row[0]*Math.cos(angle)-row[1]*Math.sin(angle),row[0]*Math.sin(angle)+row[1]*Math.cos(angle)];
  const logits=[2,0,-1],scaled=softmax(logits.map(v=>v*c*c));
  return <FlowLab id={`position-extension-${investigation}`} label={`Context-extension formula: ${investigation}`}>
    {investigation==='temperature' ? <><PositionArray label="Original logits | logits after both Q/K scales c" values={[logits,logits.map(v=>v*c*c)]}/><PositionArray label="Original shares | scaled shares" values={[softmax(logits),scaled]}/></> : <><PositionExtensionDrawing pairs={result} selected={pair} offset={offset} names={investigation==='base'?['original','pi','baseScaled']:undefined}/>{investigation==='content' && <PositionArray label="Local geometry query and key; actual q·RΔk for the four rules" values={[['q',...q],['k',...k],...['original','pi','baseScaled','yarn'].map(name=>[name,dot(q,rotatePair(k,offset*result[name][pair])),''])]} columns={['entity','coordinate 0 / dot','coordinate 1']}/>}</>}
    <FlowControls>{investigation==='temperature' ? <FlowSlider name="Extension factor" value={factor} min={1} max={32} step={.25} onChange={setFactor}/> : investigation==='content' ? <><Selection name="Local vector" value={entity} onChange={setEntity} options={[[0,'Query'],[1,'Key']]}/><FlowSlider name="First coordinate" value={(entity===0?q:k)[0]} min={-3} max={3} step={.05} onChange={v=>(entity===0?setQ:setK)(old=>[v,old[1]])}/><FlowSlider name="Second coordinate" value={(entity===0?q:k)[1]} min={-3} max={3} step={.05} onChange={v=>(entity===0?setQ:setK)(old=>[old[0],v])}/></> : <><FlowSlider name="Extension factor" value={factor} min={1} max={32} step={.25} onChange={setFactor}/><FlowSlider name="Pair index" value={pair} min={0} max={31} step={1} onChange={setPair}/><FlowSlider name="Relative offset" value={offset} min={0} max={262144} step={1} onChange={setOffset}/></>}</FlowControls>
    <FlowReadout>{investigation==='temperature' ? `c = ${number(c,6)}, so a fully rotated Q/K score is multiplied by c² = ${number(c*c,6)}. ` : `Selected relative offset ${offset}, pair ${pair}: the displayed rules give different computed phases. `}Factor 1 restores the original frequencies and multiplier. These calculated phases and shares measure the local formula; they are not long-context model quality.</FlowReadout>
  </FlowLab>;
}
export function PositionInterpolationLab() {
  const [factor,setFactor]=useState(4);
  return <FlowLab id="position-interpolation" label="Compressed position interval"><PositionInterpolationDrawing factor={factor} position={64*factor-1}/><FlowControls><FlowSlider name="Nominal extension factor" value={factor} min={1} max={16} step={1} onChange={setFactor}/></FlowControls><FlowReadout>The last target slot {64*factor-1} maps to {number((64*factor-1)/factor,6)}, while neighbouring positions are spaced {number(1/factor,6)} apart in the original phase coordinate.</FlowReadout></FlowLab>;
}
export function PositionXposLab() {
  const [gap,setGap]=useState(512),[shift,setShift]=useState(0);
  return <FlowLab id="position-xpos" label="Relative amplitude versus vector norm"><PositionXposDrawing queryId={shift+gap} keyId={shift}/><FlowControls><FlowSlider name="Query-minus-key gap" value={gap} min={0} max={1024} step={8} onChange={setGap}/><FlowSlider name="Common position shift" value={shift} min={0} max={1024} step={8} onChange={setShift}/></FlowControls><FlowReadout>For pair 0, ζ=2/7; the dot amplitude product is ζ^(gap/512) = {number((2/7)**(gap/512),6)}. Changing the common shift changes the separate vector lengths while preserving this fixed-content product.</FlowReadout></FlowLab>;
}

export function PositionClockComparisonLab() {
  const [current,setCurrent]=useState({position:3,pair:0,exponent:4,width:8}),[reference,setReference]=useState(current),[property,setProperty]=useState(0);
  const names=['position','pair','exponent','width'],widths=[4,8,16,32],name=names[property],value=name==='width'?widths.indexOf(current.width):current[name],limits=[[0,255,1],[0,current.width/2-1,1],[1,6,.1],[0,3,1]][property];
  const code=s=>{const w=frequencies(s.width,10**s.exponent)[s.pair];return [Math.sin(s.position*w),Math.cos(s.position*w)];};
  return <FlowLab id="position-clock-comparison" label="Retain a complete clock reference while changing another input">
    <PositionArray label="Reference and current stored [sin,cos]" values={[code(reference),code(current)]} rows={[`Pinned t=${reference.position}, d=${reference.width}, base=${number(10**reference.exponent)}, pair=${reference.pair}`,`Current t=${current.position}, d=${current.width}, base=${number(10**current.exponent)}, pair=${current.pair}`]}/>
    <FlowControls><Selection name="Clock input to change" value={property} onChange={setProperty} options={[[0,'Position'],[1,'Pair index'],[2,'Base exponent'],[3,'Encoding width']]}/><FlowSlider name={name==='width'?'Width choice':name} value={value} min={limits[0]} max={limits[1]} step={limits[2]} format={name==='width'?v=>String(widths[v]):number} onChange={v=>setCurrent(old=>({...old,[name]:name==='width'?widths[v]:v,pair:name==='width'?Math.min(old.pair,widths[v]/2-1):name==='pair'?v:old.pair}))}/><button type="button" onClick={()=>setReference({...current})}>Pin this complete clock</button></FlowControls>
    <FlowReadout>The retained clock keeps its own width, base, position and pair. Its largest two-coordinate difference from the current clock is {number(maxDifference(code(reference),code(current)),8)}; changing the current width never silently changes the reference frequencies.</FlowReadout>
  </FlowLab>;
}
export function PositionAlibiCompetitorLab() {
  const [count,setCount]=useState(4),[selected,setSelected]=useState(0),[scores,setScores]=useState([2,0,0,0,0,0,0,0]);
  const keys=Array.from({length:count},(_,i)=>i),query=count-1,active=scores.slice(0,count),result=alibiCompetition(active,keys,query,.5);
  return <FlowLab id="position-alibi-competitors" label="Add legal competitors while retaining the same pair of contents and relative distance">
    <PositionAlibiDrawing scores={active} keys={keys} query={query} slope={.5} result={result}/>
    <FlowControls><FlowSlider name="Number of legal keys" value={count} min={2} max={8} step={1} onChange={v=>{setCount(v);setSelected(old=>Math.min(old,v-1));}}/><Selection name="Key whose content changes" value={selected} onChange={setSelected} options={indices(count,'key')}/><FlowSlider name="Selected content score" value={scores[selected]} min={-8} max={8} step={.1} onChange={v=>setScores(old=>old.map((x,i)=>i===selected?v:x))}/></FlowControls>
    <FlowReadout>Key 0 share is {number(result.weights[0],6)}; key 0/key 1 odds are {number(result.weights[0]/result.weights[1],6)}. The receiver follows the last key ID; this adds the same row constant to old biases, so adding other legal competitors alone preserves this pair’s odds.</FlowReadout>
  </FlowLab>;
}
export function PositionCacheLengthLab() {
  const [count,setCount]=useState(3),original=positionCacheDefault(),extra=count-3;
  const settings={...original,ids:Array.from({length:count},(_,i)=>i+7),keys:[...original.keys,...Array.from({length:extra},(_,i)=>[.25*(i+1),-.5,.5,.25])],values:[...original.values,...Array.from({length:extra},(_,i)=>[i/2,-.25])],queryId:count+6,rotaryId:count+6,maskId:count+6};
  const result=cachePositionRead(settings);
  return <FlowLab id="position-cache-length" label="Append logically identified cache records"><PositionCacheDrawing settings={settings} actual={result} reference={cachePositionRead(settings,true)}/><FlowControls><FlowSlider name="Stored record count" value={count} min={3} max={8} step={1} onChange={setCount}/></FlowControls><FlowReadout>The new receiver has logical ID {settings.queryId}, with all {count} existing IDs permitted. Added raw keys/values are declared teaching fixtures; the fixed query content is rotated at the new last ID. Cached and corresponding full-reference reads agree.</FlowReadout></FlowLab>;
}

const modes=['none','sinusoidal','learned','rope','alibi'];
const modeName=mode=>mode==='alibi'?'Symmetric ALiBi':mode==='none'?'No explicit position':mode==='rope'?'RoPE':mode==='learned'?'Learned input table':'Sinusoidal input';
const assetBase='/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/';
const MovementCase=createContext(null);
function movementInputCase(source,{edits,ids,recordReverse,pointReverse,padding,excludeKeys,excludePool}) {
  let originalIndices=Array.from({length:45},(_,i)=>i),positions=source.positions.map((id,i)=>ids[i]??id);
  if(recordReverse){originalIndices.reverse();positions.reverse();}
  if(pointReverse)originalIndices.reverse();
  const realPoints=originalIndices.map(i=>edits[i]??source.points[i]),points=[...realPoints,...Array.from({length:padding},()=>[.75,.75])];
  positions=[...positions,...Array(padding).fill(0)];
  const validity=points.map((_,i)=>i<45);
  return {points,positions,realPoints,originalIndices,validity,keyExcluded:validity.map(v=>!v&&excludeKeys),poolExcluded:validity.map(v=>!v&&excludePool)};
}
function useVisible() {
  const ref=useRef(null),[visible,setVisible]=useState(false);
  useEffect(()=>{if(!ref.current)return undefined;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'160px'});observer.observe(ref.current);return ()=>observer.disconnect();},[]);
  return {ref,visible};
}
function usePositionModels() {
  const {ref,visible}=useVisible(),[attempt,setAttempt]=useState(0),[resource,setResource]=useState({data:null,error:null,loading:false});
  useEffect(()=>{if(!visible)return undefined;const controller=new AbortController();setResource(old=>({...old,error:null,loading:true}));Promise.all(modes.map(async mode=>{const response=await fetch(`${assetBase}movement-${mode}.json`,{signal:controller.signal});if(!response.ok)throw new Error('Saved movement model could not be loaded.');const model=await response.json();if(model.mode!==mode || model.points?.length!==45 || !model.state_dict)throw new Error('Saved movement model has an unexpected format.');return [mode,model];})).then(entries=>{if(!controller.signal.aborted)setResource({data:Object.fromEntries(entries),error:null,loading:false});}).catch(()=>{if(!controller.signal.aborted)setResource(old=>({...old,error:'The five saved movement models could not be loaded.',loading:false}));});return ()=>controller.abort();},[visible,attempt]);
  return {...resource,ref,retry:()=>setAttempt(v=>v+1)};
}
function ResourceState({ resource }) {
  return resource.error ? <><p role="alert">{resource.error} Your edits are retained.</p><FlowControls><button type="button" onClick={resource.retry}>Retry saved movement models</button></FlowControls></> : resource.loading || !resource.data ? <p role="status">{resource.loading ? 'Loading the five saved movement models…':'The saved models load when this investigation comes into view.'}</p>:null;
}
function MovementPath({ points,original,positions,selected=22,weights,keyRecord=0 }) {
  const scene=stacked=>{const x=v=>(stacked?35:55)+v*(stacked?270:300),y=v=>(stacked?310:355)-v*(stacked?270:300),path=rows=>rows.map(([a,b])=>`${x(a)},${y(b)}`).join(' ');
  return <PositionDrawing width={stacked?340:800} height={stacked?670:455} label="A real 45-point hand trajectory, with explicit selected point, traversal endpoints and attached IDs">
    <rect x={stacked?35:55} y={stacked?40:55} width={stacked?270:300} height={stacked?270:300} fill="none" stroke={positionColors.edge}/>{[0,.5,1].map(v=><g key={v}><PositionText x={x(v)} y={stacked?340:385}>{v}</PositionText><PositionText x={stacked?17:36} y={y(v)+5}>{v}</PositionText></g>)}
    <polyline points={path(original)} fill="none" stroke={positionColors.edge} strokeDasharray="4 3"/><polyline points={path(points)} fill="none" stroke={positionColors.input} strokeWidth={2}/>
    {weights && points.map(([a,b],i)=><circle key={i} cx={x(a)} cy={y(b)} r={38*Math.sqrt(weights[i])} fill={positionColors.computed} fillOpacity={.45}/>)}
    <circle cx={x(points[0][0])} cy={y(points[0][1])} r={5} fill={positionColors.operation}/><rect x={x(points.at(-1)[0])-4} y={y(points.at(-1)[1])-4} width={8} height={8} fill={positionColors.input}/><circle cx={x(points[selected][0])} cy={y(points[selected][1])} r={10} fill="none" stroke={positionColors.operation} strokeWidth={2}/>
    {weights && <path d={`M${x(points[keyRecord][0])-7} ${y(points[keyRecord][1])} h14 M${x(points[keyRecord][0])} ${y(points[keyRecord][1])-7} v14`} stroke={positionColors.input} strokeWidth={2}/>} 
    <PositionText x={stacked?170:558} y={stacked?378:72} color={positionColors.input}>{stacked?'x →, y ↑; both axes 0…1':'Coordinates x →, y ↑; both axes 0…1'}</PositionText><PositionText x={stacked?170:558} y={stacked?415:116}>Dashed: original. Cyan path: current.</PositionText><PositionText x={stacked?170:558} y={stacked?452:161}>{stacked ? 'Circle: first; square: last row.' : 'Circle: first row; square: last row.'}</PositionText><PositionText x={stacked?170:558} y={stacked?489:206}>White ring: record {selected+1}, ID {positions[selected]}.</PositionText><PositionText x={stacked?170:558} y={stacked?526:251}>{weights ? stacked?'Violet area ∝ attention share.':'Violet disk area ∝ actual attention share.' : stacked?'Only real measurements are drawn.':'Only real trajectory records are drawn.'}</PositionText><PositionText x={stacked?170:558} y={stacked?563:296}>{weights ? `Cyan cross: key record ${keyRecord+1}.` : stacked?'Padding locations are omitted.':'Padding locations are deliberately omitted.'}</PositionText>{stacked&&<PositionText x={170} y={591}>Original arc goes anticlockwise.</PositionText>}<PositionText x={stacked?170:400} y={stacked?619:414}>{stacked ? 'Original: row 77; class 4.' : 'Source row 77: original class 4, anticlockwise arc.'}</PositionText><PositionText x={stacked?170:400} y={stacked?652:443}>{stacked?'Edits do not inherit its class label.':'The original label does not label arbitrary edits.'}</PositionText>
  </PositionDrawing>;};
  return <><div className="position-desktop-scene">{scene(false)}</div><div className="position-mobile-scene">{scene(true)}</div></>;
}
function MovementInvestigation({ resource, investigation }) {
  const {selected,setSelected,edits,setEdits,ids,setIds,recordReverse,setRecordReverse,pointReverse,setPointReverse,padding,setPadding,excludeKeys,setExcludeKeys,excludePool,setExcludePool,current,results}=useContext(MovementCase);
  const data=resource.data,source=data?.rope,reversed=investigation==='records'?recordReverse:pointReverse,setReversed=investigation==='records'?setRecordReverse:setPointReverse;
  const paired=useMemo(()=>{if(!results||!['records','points'].includes(investigation))return null;const alternative=movementInputCase(source,{edits,ids,recordReverse:investigation==='records'?!recordReverse:recordReverse,pointReverse:investigation==='points'?!pointReverse:pointReverse,padding,excludeKeys,excludePool});return modes.map(mode=>({mode,...positionMovementForwardWithMasks(data[mode],alternative.points,alternative.positions,alternative)}));},[results,investigation,reversed,source,edits,ids,recordReverse,pointReverse,padding,excludeKeys,excludePool,data]);
  return <div><FlowLab id={`position-movement-${investigation}`} label={`Five saved movement models: ${investigation}`}>
    {source && current && <MovementPath points={current.realPoints} original={source.points} positions={current.positions} selected={current.originalIndices.indexOf(selected)}/>}
    <ResourceState resource={resource}/>
    {source && current && <FlowControls>{investigation==='coordinates' ? <><FlowSlider name="Real record (one-based)" value={selected+1} min={1} max={45} step={1} onChange={v=>setSelected(v-1)}/><FlowSlider name="x coordinate" value={(edits[selected]??source.points[selected])[0]} min={0} max={1} step={.001} onChange={v=>setEdits(old=>({...old,[selected]:[v,(old[selected]??source.points[selected])[1]]}))}/><FlowSlider name="y coordinate" value={(edits[selected]??source.points[selected])[1]} min={0} max={1} step={.001} onChange={v=>setEdits(old=>({...old,[selected]:[(old[selected]??source.points[selected])[0],v]}))}/></> : investigation==='identity' ? <><FlowSlider name="Real record (one-based)" value={selected+1} min={1} max={45} step={1} onChange={v=>setSelected(v-1)}/><FlowSlider name="Attached position ID" value={ids[selected]??source.positions[selected]} min={0} max={44} step={1} onChange={v=>setIds(old=>({...old,[selected]:v}))}/></> : investigation==='padding' ? <><FlowSlider name="Added padding records" value={padding} min={0} max={5} step={1} onChange={setPadding}/><FlowChoice label="Exclude padding keys" value={excludeKeys} options={[[true,'Excluded'],[false,'Permitted']]} onChange={setExcludeKeys}/><FlowChoice label="Exclude padding from mean" value={excludePool} options={[[true,'Excluded'],[false,'Included']]} onChange={setExcludePool}/></> : <FlowChoice label={investigation==='records'?'Reverse complete (point, ID) records':'Reverse points while retaining ID slots'} value={reversed} options={[[false,'Original'],[true,'Reversed']]} onChange={setReversed}/>}</FlowControls>}
    {results && <><PositionArray label="All five saved models: current top class, change from the frozen original case, and class-5 share" values={results.map(r=>[r.probabilities.indexOf(Math.max(...r.probabilities))+1,maxDifference(r.logits,data[r.mode].baseline.logits),r.probabilities[4]])} rows={modes.map(modeName)} columns={['top class','max |logit − frozen original|','class 5 probability']} digits={6}/>{paired&&<PositionArray label="Isolated on/off reversal comparison: every other current edit stays fixed" values={results.map((r,i)=>[maxDifference(r.logits,paired[i].logits)])} rows={modes.map(modeName)} columns={['max |toggle on/off logit difference|']} digits={9}/>}<FlowReadout>Each output uses its original saved weights. The first change column compares all retained edits with the frozen original, not just this control. {investigation==='padding' ? `There are ${padding} invalid padding records; key permission and pooling inclusion are separate choices. Excluding keys alone still lets padding query rows enter the mean if pooling includes them.`:investigation==='records'?'The separate on/off comparison keeps every other edit fixed. Complete records move coordinates and IDs together, preserving matching and pooling.':investigation==='points'?'With ordinary affine ordinal IDs and excluded invalid rows, symmetric distance bias cannot distinguish reversal. Custom ID assignments or permitted padding can break that distance-matrix symmetry; inspect the isolated on/off difference rather than assuming it stays zero.':investigation==='identity'?'The no-position model ignores ID edits; the other mechanisms use IDs at their taught injection site.':'Actual coordinate changes can affect all five models, including those whose default symmetry cannot distinguish opposite traversal.'}</FlowReadout></>}
  </FlowLab></div>;
}
function MovementHeadInspection({ resource }) {
  const [query,setQuery]=useState(22),[key,setKey]=useState(0),[head,setHead]=useState(0),data=resource.data?.rope;
  const {current,results}=useContext(MovementCase),result=results?.find(r=>r.mode==='rope');
  if(!data || !result)return <div><ResourceState resource={resource}/></div>;
  const trace=result.heads[head];
  return <div><FlowLab id="position-movement-head" label="Inspect the edited case in the saved rotary model’s actual projected head">
    <MovementPath points={current.realPoints} original={data.points} positions={current.positions} selected={query} weights={trace.attention[query]} keyRecord={key}/>
    <PositionArray label="Actual full twelve-coordinate raw and rotated query/key" values={[trace.rawQuery[query],trace.query[query],trace.rawKey[key],trace.key[key]]} rows={['raw query','rotated query','raw key','rotated key']}/>
    <FlowControls><FlowSlider name="Query record (one-based)" value={query+1} min={1} max={45} step={1} onChange={v=>setQuery(v-1)}/><FlowSlider name="Key record (one-based)" value={key+1} min={1} max={45} step={1} onChange={v=>setKey(v-1)}/><Selection name="Head" value={head} onChange={setHead} options={[[0,'Head 0'],[1,'Head 1']]}/></FlowControls>
    <PositionArray label={`Complete ${current.points.length}-key attention row (padding keys are included with their actual shares)`} values={trace.attention[query]} columns={current.positions.map((id,i)=>`record ${i+1}: ID ${id}`)} digits={7}/>
    <PositionArray label="Every rotated coordinate product and full mixed value" values={[trace.query[query].map((v,i)=>v*trace.key[key][i]),trace.output[query]]} rows={['selected Q′×K′ coordinate products','weighted value mixture']}/>
    <FlowReadout>The twelve products sum to {number(trace.content[query][key]*Math.sqrt(12),6)}; division by √12 gives {number(trace.content[query][key],6)}. The selected normalized share is {number(trace.attention[query][key],7)}; the full mixture uses all permitted values, not only this key.</FlowReadout>
  </FlowLab></div>;
}
export function PositionMovementLabs() {
  const resource=usePositionModels();
  // One edited case stays mounted above every asynchronous loading/error boundary.
  const [selected,setSelected]=useState(22),[edits,setEdits]=useState({}),[ids,setIds]=useState({}),[recordReverse,setRecordReverse]=useState(false),[pointReverse,setPointReverse]=useState(false),[padding,setPadding]=useState(0),[excludeKeys,setExcludeKeys]=useState(true),[excludePool,setExcludePool]=useState(true);
  const source=resource.data?.rope;
  const current=useMemo(()=>source?movementInputCase(source,{edits,ids,recordReverse,pointReverse,padding,excludeKeys,excludePool}):null,[source,edits,ids,recordReverse,pointReverse,padding,excludeKeys,excludePool]);
  const results=useMemo(()=>resource.data&&current?modes.map(mode=>({mode,...positionMovementForwardWithMasks(resource.data[mode],current.points,current.positions,current)})):null,[resource.data,current]);
  return <MovementCase.Provider value={{selected,setSelected,edits,setEdits,ids,setIds,recordReverse,setRecordReverse,pointReverse,setPointReverse,padding,setPadding,excludeKeys,setExcludeKeys,excludePool,setExcludePool,current,results}}><div ref={resource.ref}>
    <p>Which coordinates matter to each trained model? Change one real record’s x and y below; record numbering is one-based here and its attached IDs remain zero-based.</p><MovementInvestigation resource={resource} investigation="coordinates"/>
    <p>Now keep the coordinates fixed. Does changing their numerical position label matter? Every label is a supported table ID from 0 to 44.</p><MovementInvestigation resource={resource} investigation="identity"/>
    <p>Moving complete records tests storage order alone: each point travels with its ID. The final mean still includes the same real rows.</p><MovementInvestigation resource={resource} investigation="records"/>
    <p>Next reverse only the points, retaining the old ID slots. This changes the represented journey and isolates the direction information each method can use.</p><MovementInvestigation resource={resource} investigation="points"/>
    <p>Finally add records that are not real measurements. Their validity is false; independently decide whether attention may read their keys and whether their output rows enter the final mean.</p><MovementInvestigation resource={resource} investigation="padding"/>
    <p>All five investigations above update this one edited case. The full distribution below retains every class share for each saved model; the local summaries show the same results at each control.</p>{results&&<PositionArray label="Every current class share for the shared edited movement case" values={results.map(r=>r.probabilities)} rows={modes.map(modeName)} columns={Array.from({length:15},(_,i)=>`class ${i+1}`)} digits={6}/>}
    <p>All these questions retain one edited case. The coordinate editor selects the original source record; the head inspector selects its current physical row. To follow the edited rotary head, choose a receiver, a real key and one of the two heads. The violet disks represent that receiver’s shares; each disk’s area is 1444π times its share. Padding shares appear in the full numerical attention row.</p><MovementHeadInspection resource={resource}/>
  </div></MovementCase.Provider>;
}

