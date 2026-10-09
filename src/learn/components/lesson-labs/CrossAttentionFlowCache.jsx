import { createContext, useContext, useState } from 'react';
import examples from '../../data/cross-attention-examples.json';
import { cacheBudget, projectMemory, readMemory } from '../../data/cross-attention-models.js';
import { counts } from '../../data/cross-attention-flow-models.js';
import { CrossFigure, CrossMatrix, CrossVector, CrossShape, CrossArrow, CrossBranches, CrossNumber, crossNumber as f } from './CrossAttentionFlowFigures.jsx';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
const Cache=createContext(null), clone=x=>JSON.parse(JSON.stringify(x)), initialBudget={batch:1,layers:32,readLayers:8,tokens:576,latents:64,width:1024,crossWidth:1024,bytes:2,projected:true,raw:false,featureWidth:1024,text:576};
const initialNative=()=>({memory:clone(examples.cache.memory),query:clone(examples.cache.query),allowed:clone(examples.cache.allowed),state:clone(examples.cache.state),memoryRevision:0,modelRevision:0,ids:['donor0','donor1','donor2','donor3','donor4']});
const identity=s=>`memory${s.memoryRevision}/model${s.modelRevision}`;
export function CrossCacheProvider({children}){const [budget,setBudget]=useState({...initialBudget}),[native,setNative]=useState(initialNative),[stored,setStored]=useState(()=>projectMemory(examples.cache.memory,examples.cache.state,'memory0/model0',2)),[kept,setKept]=useState(null);
  return <Cache.Provider value={{budget,setBudget,native,setNative,stored,setStored,kept,setKept}}>{children}</Cache.Provider>;}
function useCache(){const s=useContext(Cache);if(!s)throw new Error('Cache views need their topic provider.');return s;}
const miB=bytes=>f(bytes/2**20,6);
export function CrossPairCosts(){const s=useCache(),b=s.budget,[causal,setCausal]=useState(true),[width,setWidth]=useState(2),r=counts({readers:b.text,donors:b.tokens,keyWidth:width,valueWidth:width});
  const shared=causal?(b.text+b.tokens)*(b.text+b.tokens+1)/2:(b.text+b.tokens)**2,separate=causal?b.text*(b.text+1)/2+b.text*b.tokens:b.text**2+b.text*b.tokens;
  return <FlowLab id="cross-pair-costs" label="Count candidates, permitted pairs and multiply-adds separately">
    <CrossFigure job="D31" label="A small exact pair grid contrasts shared and separate fusion" caption="Two visual positions and three text positions make the comparison visible. Shared causal15 versus separate6+6=12 permitted pairs; dense25 versus9+6=15 candidate pairs. A pair is not a measured millisecond or a multiply-add.">
      <CrossBranches><CrossMatrix values={Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>j<=i))} label="Shared-stream causal5×5:15 allowed" rows={['image0','image1','text0','text1','text2']} columns={['image0','image1','text0','text1','text2']} binary/>
        <div><CrossMatrix values={[[true,false,false],[true,true,false],[true,true,true]]} label="Separate text3×3 triangle:6 allowed" rows={['text0','text1','text2']} columns={['text0','text1','text2']} binary/>
          <CrossMatrix values={[[true,true],[true,true],[true,true]]} label="Separate text→image3×2:6 allowed" rows={['text0','text1','text2']} columns={['image0','image1']} binary/></div></CrossBranches>
      <CrossArrow>General dimensions count the full grids without allocating them.</CrossArrow>
      <CrossMatrix values={[[shared,separate],[r.scoreMACs,r.readMACs]]} label="General live count (one head)" rows={['permitted/candidate pairs','cross-read MACs']} columns={['shared or score','separate or carried sum']}/>
    </CrossFigure><FlowControls><CrossNumber syncKey={b} label="Text readers T" value={b.text} min={1} max={8192} integer onChange={v=>s.setBudget({...b,text:v})}/><CrossNumber syncKey={b} label="Source donors S" value={b.tokens} min={1} max={8192} integer onChange={v=>s.setBudget({...b,tokens:v})}/>
      <FlowChoice label="Pair availability" value={causal} options={[[true,'Causal shared/text'],[false,'Dense candidates']]} onChange={setCausal}/></FlowControls>
    <p>Give the score and carried sum equal width for this focused MAC comparison.</p><FlowControls><CrossNumber label="Both matching/value widths" value={width} min={1} max={4096} integer onChange={setWidth}/></FlowControls>
    <FlowReadout>Shared {shared} pairs;separate {separate}. One cross head uses {r.scoreMACs} score MACs plus {r.readMACs} carried-sum MACs = {r.totalMACs}. Counting a multiply and an add separately gives roughly twice as many FLOPs; this is no timing claim.</FlowReadout>
  </FlowLab>;
}
function BudgetControls({fields}){const s=useCache(),b=s.budget;return <FlowControls>{fields.map(([key,label,max])=><CrossNumber syncKey={b} key={key} label={label} value={b[key]} min={1} max={max} integer onChange={v=>s.setBudget({...b,[key]:v})}/>)}</FlowControls>;}
export function CrossCachePayload(){const s=useCache(),b=s.budget,r=cacheBudget(b);
  return <FlowLab id="cross-cache-payload" label="Count each projected K/V replica and optional raw features">
    <CrossFigure job="D32" label="Cache payload is a stack of projected key and value tensors" caption="MiB means2²⁰ bytes. The initial projected visual prefix costs72MiB; eight cross-read layers over64 latents cost2MiB, or18MiB over576 uncompressed rows. Raw features are separate. Text cache, parameters, transient buffers and runtime overhead are excluded.">
      <CrossBranches><div><div className="cross-flow-cache-stack">{Array.from({length:Math.min(b.layers,4)},(_,i)=><div key={i}><CrossShape rows={b.tokens} width={b.width} label={`Prefix layer${i+1} K: batch${b.batch}`} /><CrossShape rows={b.tokens} width={b.width} label={`Prefix layer${i+1} V: batch${b.batch}`}/></div>)}</div><p>All{b.layers} layer replicas ×2 K/V tensors ×{b.batch} batches ×{b.tokens} entries ×{b.width} coordinates ×{b.bytes} bytes = {miB(r.prefix)}MiB.</p></div>
        <div>{b.projected?<><div className="cross-flow-cache-stack">{Array.from({length:Math.min(b.readLayers,4)},(_,i)=><div key={i}><CrossShape rows={b.latents} width={b.crossWidth} label={`Cross layer${i+1} K: batch${b.batch}`} /><CrossShape rows={b.latents} width={b.crossWidth} label={`Cross layer${i+1} V: batch${b.batch}`}/></div>)}</div><p>All{b.readLayers} cross-read replicas ×2 ×{b.batch} ×{b.latents} ×{b.crossWidth} ×{b.bytes} = {miB(r.cross)}MiB.</p></>:<p>Projected cross K/V retention disabled:0 bytes in this category.</p>}
          {b.raw&&<><CrossShape rows={b.tokens} width={b.featureWidth} label={`Distinct retained raw features: batch${b.batch}`} role="input"/><p>Raw payload {miB(r.raw)}MiB, separate from projected K/V.</p></>}</div></CrossBranches>
    </CrossFigure><p>Source and compressed entry counts determine which rows are retained.</p><BudgetControls fields={[[ 'tokens','Source entries S',8192],['latents','Resampled entries S′',8192]]}/>
    <p>Batch and layer replicas multiply each tensor's payload.</p><BudgetControls fields={[[ 'batch','Batch examples N',32],['layers','Prefix cache layers P',128],['readLayers','Cross cache layers J',128]]}/>
    <p>Widths count projected channels; dtype determines bytes per coordinate.</p><BudgetControls fields={[[ 'width','Prefix projected width',4096],['crossWidth','Cross projected width',4096]]}/><FlowControls><FlowChoice label="Bytes per scalar" value={b.bytes} options={[[1,'1 byte'],[2,'2 bytes'],[4,'4 bytes'],[8,'8 bytes']]} onChange={v=>s.setBudget({...b,bytes:v})}/></FlowControls>
    <p>Raw feature retention and projected cache retention are different choices.</p><FlowControls><FlowChoice label="Projected cross cache" value={b.projected} options={[[true,'Retain K/V'],[false,'Do not retain K/V']]} onChange={v=>s.setBudget({...b,projected:v})}/>
      <FlowChoice label="Raw source features" value={b.raw} options={[[false,'Discard after projection'],[true,'Retain raw features']]} onChange={v=>s.setBudget({...b,raw:v})}/><CrossNumber syncKey={b} label="Raw feature width" value={b.featureWidth} min={1} max={4096} integer onChange={v=>s.setBudget({...b,featureWidth:v})}/></FlowControls>
    <div className="cross-flow-actions"><button type="button" onClick={()=>s.setBudget({...b,readLayers:b.layers,latents:b.tokens,crossWidth:b.width,projected:true,raw:false})}>Match all prefix and cross cache counts</button><button type="button" onClick={()=>s.setBudget({...initialBudget})}>Reset payload example</button></div>
    <FlowReadout>Prefix payload {miB(r.prefix)}MiB; projected cross {miB(r.cross)}MiB; raw {miB(r.raw)}MiB. Cross plus raw {miB(r.crossTotal)}MiB. Matching all counts removes the declared replica/token advantage without saying which model is more accurate.</FlowReadout>
  </FlowLab>;
}
function NativeProjectionRoute({n,current,stored,fresh,reader,head,coordinate,donor}){
  const width=8,index=head*4+coordinate,mapRows=[index,width+index,2*width+index],inputs=[n.query[reader],n.memory[donor],n.memory[donor]],names=[`Q reader${reader}`,`K donor${donor}`,`V donor${donor}`];
  const weights=mapRows.map(i=>n.state.in_proj_weight[i]),biases=mapRows.map(i=>n.state.in_proj_bias[i]),products=weights.map((row,i)=>row.map((w,j)=>w*inputs[i][j])),sums=products.map(row=>row.reduce((a,b)=>a+b,0)),projected=sums.map((v,i)=>v+biases[i]);
  const q=n.state.in_proj_weight.slice(0,width).map((row,i)=>row.reduce((a,w,j)=>a+w*n.query[reader][j],0)+n.state.in_proj_bias[i]);
  const join=fresh.error?null:fresh.heads.flatMap(h=>h.output[reader]),outWeights=n.state['out_proj.weight'][index],outBias=n.state['out_proj.bias'][index],outProducts=join?.map((v,j)=>v*outWeights[j]),outSum=outProducts?.reduce((a,b)=>a+b,0);
  return <div data-native-projection-route>
    <p>Follow reader{reader} and donor{donor}, head{head} coordinate{coordinate} (global projected coordinate{index}). As in <a href="#2-shapes-reveal-the-architecture">§2's source projection</a>, every map row is an output coordinate and its eight columns multiply input coordinates. Q uses a current query; K/V use the current memory source.</p>
    <CrossMatrix values={inputs} label="Actual selected source operands" rows={names} role="input"/>
    <CrossArrow>Multiply each source coordinate by the matching retained parameter.</CrossArrow>
    <CrossMatrix values={weights} label={`Retained WQ/WK/WV rows for global coordinate${index}`} rows={['WQ row'+index,'WK row'+index,'WV row'+index]} role="parameter"/>
    <CrossMatrix values={products} label="Every selected source × retained map product" rows={names}/>
    <CrossArrow>Sum the eight products, then add that map row's retained bias.</CrossArrow>
    <CrossMatrix values={sums.map((v,i)=>[v,biases[i],projected[i]])} label="Selected projection arithmetic" rows={names} columns={['product sum','retained bias','sum + bias']}/>
    <CrossVector values={q} label={`Fresh projected Q for reader${reader}: both four-coordinate head groups`}/>
    <CrossMatrix values={[[projected[1],current.keys[head][donor][coordinate],stored.keys[head][donor][coordinate]],[projected[2],current.values[head][donor][coordinate],stored.values[head][donor][coordinate]]]} label="Current projected coordinate versus stored coordinate" rows={['K','V']} columns={['worked current map','fresh current cache','stored at '+stored.identity]}/>
    {!fresh.error&&<><CrossArrow>Compare the current four-coordinate Q head with every fresh K head; divide the product sum by√4. Normalize only allowed scores.</CrossArrow>
      <CrossVector values={fresh.heads[head].scores[reader]} label={`Fresh reader${reader}/head${head} score for every donor`}/>
      <CrossMatrix values={n.memory.map((_,i)=>[n.allowed[reader][i]?'allowed':'blocked',fresh.heads[head].weights[reader][i],current.values[head][i][coordinate],fresh.heads[head].products[reader][i][coordinate]])} label="Selected carried coordinate: permission, share, value and product" rows={n.ids} columns={['permission','share','V coordinate','share × V']}/>
      <CrossArrow>Add the five contributions for this head coordinate; join both four-coordinate head reads in head order, as in <a href="#2-shapes-reveal-the-architecture">§2's two-head join</a>.</CrossArrow>
      <CrossVector values={fresh.heads[head].output[reader]} label={`Fresh head${head} four-coordinate read`}/>
      <CrossVector values={join} label="Actual eight-coordinate joined head read"/>
      <CrossArrow>The retained WO row maps this joined read to returned coordinate{index}.</CrossArrow>
      <CrossVector values={outWeights} label={`Retained WO row${index}`} role="parameter"/>
      <CrossVector values={outProducts} label="Every joined-read × WO product"/>
      <CrossMatrix values={[[outSum,outBias,outSum+outBias,fresh.output[reader][index]]]} label="Output-map arithmetic agrees with the actual fresh returned coordinate" columns={['product sum','retained bias','sum + bias','fresh output coordinate']}/></>}
    <p>This route computes fresh current maps. A stored coordinate belongs to its displayed source/model identity; matching a coordinate by accident does not authorize stale cache reuse.</p>
  </div>;
}
export function CrossProjectedCache(){const s=useCache(),n=s.native,[selected,setSelected]=useState(['query',0,0]),[reader,setReader]=useState(0),[head,setHead]=useState(0),[coordinate,setCoordinate]=useState(0);
  const current=projectMemory(n.memory,n.state,identity(n),2),fresh=readMemory(n.query,n.state,current,n.allowed,identity(n)),cached=readMemory(n.query,n.state,s.stored,n.allowed,identity(n));
  const [kind,row,col]=selected;
  function edit(value){if(n[kind][row][col]===value)return;const next={...n,[kind]:n[kind].map((values,i)=>i===row?values.map((v,j)=>j===col?value:v):values)};if(kind==='memory')next.memoryRevision++;s.setNative(next);}
  return <FlowLab id="cross-projected-cache" label="Edit every coordinate and inspect projected-memory reuse">
    <CrossFigure job="D33" label="Five source rows project once into two-head K/V caches" caption="The actual retained native state has width8 and two heads of width4. Current query rows do not live inside the projected-memory cache. Query edits can reuse K/V; source/model revisions require rebuilding.">
      <CrossBranches><CrossMatrix values={n.memory} label="Memory source: select any of5×8 coordinates" rows={n.ids} role="input" selected={kind==='memory'?[row,col]:null} onSelect={(i,j)=>setSelected(['memory',i,j])}/>
        <CrossMatrix values={n.query} label="Reader source: select any of3×8 coordinates" role="input" selected={kind==='query'?[row,col]:null} onSelect={(i,j)=>setSelected(['query',i,j])}/></CrossBranches>
      <CrossArrow>Separate Q projection; stored K/V were projected at the shown identity.</CrossArrow>
      <CrossBranches><CrossMatrix values={s.stored.keys[head]} label={`Stored head${head} K at ${s.stored.identity}`} rows={n.ids}/><CrossMatrix values={s.stored.values[head]} label={`Stored head${head} V at ${s.stored.identity}`} rows={n.ids}/></CrossBranches>
      <CrossMatrix values={n.allowed} label="3×5 available donor bits: click any bit" columns={n.ids} binary onSelect={(i,j)=>s.setNative({...n,allowed:n.allowed.map((values,ri)=>ri===i?values.map((v,ci)=>ci===j?!v:v):values)})}/>
      <NativeProjectionRoute {...{n,current,stored:s.stored,fresh,reader,head,coordinate,donor:kind==='memory'?row:0}}/>
      <CrossArrow>Current Q and allowed grid read the stored K/V if identity matches.</CrossArrow>
      {!fresh.error&&<><CrossVector values={fresh.heads[head].weights[reader]} label={`Fresh reader${reader},head${head} shares`}/><CrossVector values={fresh.output[reader]} label={`Fresh current-state reader${reader} output`}/></>}
      {!cached.error?<CrossVector values={cached.output[reader]} label={`Valid cached reader${reader} output`}/>:<p role="status">Cached read rejected: {cached.error}</p>}
      {fresh.error&&<p role="status">Fresh read undefined: {fresh.error}</p>}
    </CrossFigure><FlowControls><CrossNumber syncKey={n} label={`${kind} row${row},coordinate${col}`} value={n[kind][row][col]} min={-8} max={8} onChange={edit}/></FlowControls>
    <p>Inspect one returned reader/head without changing the cache contents.</p><FlowControls><FlowChoice label="Cached reader" value={reader} options={[[0,'reader0'],[1,'reader1'],[2,'reader2']]} onChange={setReader}/>
      <FlowChoice label="Cached head" value={head} options={[[0,'head0'],[1,'head1']]} onChange={setHead}/><FlowChoice label="Projection coordinate within this head" value={coordinate} options={[[0,'coordinate0'],[1,'coordinate1'],[2,'coordinate2'],[3,'coordinate3']]} onChange={setCoordinate}/></FlowControls>
    <FlowReadout>Current identity {identity(n)}; stored identity {s.stored.identity}. {cached.error?'The cache is rejected.':fresh.error?'An empty permission row has no defined attention read.':'Fresh and cached outputs agree for this fixed current state.'}</FlowReadout>
  </FlowLab>;
}
export function CrossCacheInvalidation(){const s=useCache(),n=s.native,current=projectMemory(n.memory,n.state,identity(n),2),fresh=readMemory(n.query,n.state,current,n.allowed,identity(n)),cached=readMemory(n.query,n.state,s.stored,n.allowed,identity(n));
  function reverse(paired){const next={...n,memory:[...n.memory].reverse(),ids:[...n.ids].reverse(),memoryRevision:n.memoryRevision+1,allowed:paired?n.allowed.map(row=>[...row].reverse()):n.allowed};s.setKept(fresh.error?null:clone(fresh.output));s.setNative(next);if(paired)s.setStored(projectMemory(next.memory,next.state,identity(next),2));}
  function forbiddenEdit(){const memory=clone(n.memory),before=fresh.error?null:clone(fresh.output);memory[4][0]=memory[4][0]===7?6:7;s.setKept(before);s.setNative({...n,memory,memoryRevision:n.memoryRevision+1});}
  return <FlowLab id="cross-cache-invalidation" label="Distinguish a fresh null effect from an invalid cache">
    <CrossFigure job="D34" label="Current/stored identities guard projected memory" caption="Identity rejection is separate from whether one reader's fresh answer happens to change. Under this declared whole-model revision contract, changing even WO invalidates the identity. Paired reversal moves encoded feature rows, donor IDs and mask columns together.">
      <CrossMatrix values={[[identity(n),s.stored.identity]]} label="Cache identity comparison" columns={['current source/model','stored source/model']}/>
      <CrossBranches><div><p>Fresh read projects the current memory.</p>{!fresh.error?<CrossMatrix values={fresh.output} label="Fresh current-state outputs"/>:<p>{fresh.error}</p>}</div>
        <div><p>Cached read must match identity first.</p>{!cached.error?<CrossMatrix values={cached.output} label="Accepted cached outputs"/>:<p role="status">Rejected: {cached.error}</p>}</div></CrossBranches>
      {s.kept&&<CrossMatrix values={s.kept} label="Kept outputs before last contrast"/>}
    </CrossFigure><div className="cross-flow-actions"><button type="button" onClick={()=>s.setStored(current)}>Rebuild current projected K/V</button>
      <button type="button" onClick={forbiddenEdit}>Edit donor4,forbidden to reader0/1 in default</button>
      <button type="button" onClick={()=>{const state=clone(n.state);state['out_proj.weight'][0][0]+=.05;s.setKept(fresh.error?null:clone(fresh.output));s.setNative({...n,state,modelRevision:n.modelRevision+1});}}>Change output map WO and model revision</button></div>
    <p>Permutation comparisons move actual encoded rows. Their positional information travels inside each row.</p><div className="cross-flow-actions"><button type="button" onClick={()=>reverse(true)}>Reverse paired donors/mask and rebuild</button>
      <button type="button" onClick={()=>reverse(false)}>Reverse donor rows without mask columns</button><button type="button" onClick={()=>{const next=initialNative();s.setNative(next);s.setStored(projectMemory(next.memory,next.state,identity(next),2));s.setKept(null);}}>Reset native cache</button></div>
    <FlowReadout>{cached.error?'Old projected memory is rejected; rebuild before using it.':'Stored identity matches.'} A donor4 edit can leave the first two default readers unchanged while invalidating stored projections for every reader.</FlowReadout>
  </FlowLab>;
}
export function CrossCausalMemory(){const [bidirectional,setBidirectional]=useState(false),grid=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>bidirectional||j<=i));
  return <FlowLab id="cross-causal-memory" label="Separate source-state dependence from final read masks">
    <CrossFigure job="D35" label="Source-state dependencies travel through layer-owned K/V maps" caption="A causal source encoder keeps each source state dependent only on its prefix. Completed translation sources may legitimately be bidirectional. Streaming availability must account for the encoder's actual dependencies before projection and caching.">
      <CrossMatrix values={grid} label="Source encoder: state rows depend on input columns" rows={['state0','state1','state2','state3']} columns={['input0','input1','input2','input3']} binary/>
      <CrossArrow>Layer-specific maps project each encoded state to its K/V.</CrossArrow><CrossBranches><CrossShape rows={4} width={8} label="LayerA projected K/V ownership"/><CrossShape rows={4} width={8} label="LayerB projected K/V ownership"/></CrossBranches>
      <CrossMatrix values={[[true,true,false,false]]} label="Streaming reader directly selects only state0/1" columns={['state0','state1','state2','state3']} binary/>
      <CrossMatrix values={[[true,true,bidirectional,bidirectional]]} label="Source inputs still reachable inside selected donors" columns={['input0','input1','input2','input3']} binary/>
    </CrossFigure><FlowControls><FlowChoice label="Source dependence" value={bidirectional} options={[[false,'Causal source encoder'],[true,'Bidirectional source encoder']]} onChange={setBidirectional}/></FlowControls>
    <FlowReadout>{bidirectional?'Future input2/3 can travel through allowed state0/1; the final mask does not erase them.':'The declared reader depends only on source input0/1.'} Projection ownership,source retention and available columns are separate contracts.</FlowReadout>
  </FlowLab>;
}
export function CrossYocoSharing(){const [shared,setShared]=useState(true),[position,setPosition]=useState(3),[laterCoordinate,setLaterCoordinate]=useState(0),tokens=4,width=8,layers=2,bytes=2,count=2*tokens*width*bytes*(shared?1:layers);
  const rawMemory=[[1,0],[0,1],[1,1],[-1,laterCoordinate]],queries=[[[1,0]],[[0,1]]],allowed=rawMemory.map((_,j)=>j<=position);
  const squares=rawMemory.map(row=>row.map(v=>v*v)),meanSquares=squares.map(row=>(row[0]+row[1])/2),denominators=meanSquares.map(v=>Math.sqrt(v+1e-5));
  const memory=rawMemory.map((row,i)=>row.map(v=>v/denominators[i]));
  const keys=[memory,shared?memory:memory.map(([a,b])=>[b,a])],values=[memory,shared?memory:memory.map(([a,b])=>[2*a,b])];
  // This constructed one-head read illustrates ownership; it is not a YOCO checkpoint.
  const scores=queries.map((q,h)=>keys[h].map(k=>(q[0][0]*k[0]+q[0][1]*k[1])/Math.SQRT2));
  const shares=scores.map(row=>{const maximum=Math.max(...row.filter((_,j)=>allowed[j])),exp=row.map((v,j)=>allowed[j]?Math.exp(v-maximum):0),total=exp.reduce((a,b)=>a+b,0);return exp.map(v=>v/total);});
  const outputs=shares.map((row,h)=>[0,1].map(j=>row.reduce((a,v,i)=>a+v*values[h][i][j],0)));
  return <FlowLab id="cross-yoco-sharing" label="Identical memory projection ownership enables deliberate cross-layer cache sharing">
    <CrossFigure job="D36" label="YOCO language memory feeds independent causal cross-decoder queries" caption={`YOCO uses RMSNorm and causal self- and cross-decoder boundaries. Both constructed layer queries are at token position${position}; only memory tokens0…${position} are available. This unit-gain two-coordinate RMSNorm illustration is not a YOCO checkpoint; payload counting uses a separate width8 case.`}>
      <CrossMatrix values={rawMemory} label="Constructed final self-decoder states before normalization" rows={rawMemory.map((_,j)=>`token${j}`)} role="input"/><CrossArrow>RMSNorm: square coordinates, average, add epsilon1e−5, square root; divide the original coordinates. Unit gain, no mean subtraction.</CrossArrow>
      <CrossMatrix values={squares} label="Each source coordinate squared"/><CrossMatrix values={meanSquares.map((v,j)=>[v,denominators[j]])} label="Per-token mean square and RMS denominator" columns={['mean square','sqrt(mean square + epsilon)']}/>
      <CrossMatrix values={memory} label="Actual normalized language-memory example"/><CrossArrow>{shared?'Common WK/WV own one global projected cache.':'Generic distinct layer WK/WV require separate cache ownership.'}</CrossArrow>
      <CrossMatrix values={[allowed]} label={`Causal cross-read permission at token${position}: donor j must satisfy j≤${position}`} columns={rawMemory.map((_,j)=>`token${j}`)} binary/>
      <CrossBranches>{queries.map((q,i)=><div key={i}><CrossMatrix values={q} label={`Cross-decoder${i} independent Q`}/><CrossMatrix values={keys[i]} label={`Decoder${i} actual projected K`}/><CrossMatrix values={values[i]} label={`Decoder${i} actual projected V`}/><CrossVector values={shares[i]} label={`Decoder${i} shares over selected projected memory`}/><CrossVector values={outputs[i]} label={`Decoder${i} carried read`}/><CrossArrow>Layer-local residual + dense branch</CrossArrow></div>)}</CrossBranches>
      <p>Separate bounded-window/recurrent local cache from the self-decoder remains. At batch1,sequence4,width8,2 bytes,2 cross layers: projected global K/V payload {count} bytes.</p>
    </CrossFigure><FlowControls><FlowChoice label="Projection ownership" value={shared} options={[[true,'Same common WK/WV'],[false,'Distinct layer maps:separate payloads']]} onChange={setShared}/><CrossNumber label="Both cross readers' token position" value={position} min={0} max={3} integer onChange={setPosition}/><CrossNumber label="Token3 source coordinate1" value={laterCoordinate} min={-8} max={8} onChange={setLaterCoordinate}/></FlowControls>
    <FlowReadout>{shared?'One common projected payload:128 bytes.':'Two layer-owned projected payloads:256 bytes.'} At reader position{position}, token3 {position<3?'is unavailable and an edit cannot affect either read.':'is available and an edit can affect the reads.'} A causal upstream state alone does not authorize reading a later token. Reuse requires matching projection ownership and memory state. With fixed local memory, scaling is O((sequence+layers)×width); no GPU latency follows.</FlowReadout>
  </FlowLab>;
}
export function CrossBrokenRoute(){const [wrong,setWrong]=useState(true),source=[[1,0],[1,1]],selected=[true,false],result=wrong?source[0][0]+source[1][1]:source[0][0];
  return <FlowLab id="cross-broken-route" label="Diagnose a future-bearing allowed donor">
    <CrossFigure job="D37" label="Final permissions cannot repair an upstream future-bearing donor" caption="Constructed scalar: source0=1 is available; source1=1 has not arrived. The selected donor0 carries either source0 alone or their sum. The final donor mask is the same in both cases.">
      <CrossVector values={[1,1]} label="Source0 available,source1 future" role="input"/><CrossArrow>{wrong?'Wrong source encoder: state0 sums both source inputs.':'Causal source encoder: state0 uses source0 only.'}</CrossArrow>
      <CrossVector values={[result,1]} label="Encoded donor states"/><CrossMatrix values={[selected]} label="Reader mask:permit donor0,block donor1" binary/><CrossArrow>One permitted donor receives share1.</CrossArrow><CrossVector values={[result]} label="Returned scalar"/>
    </CrossFigure><FlowControls><FlowChoice label="Donor0 encoding" value={wrong} options={[[true,'Contains future source1'],[false,'Available source0 only']]} onChange={setWrong}/></FlowControls>
    <FlowReadout>{wrong?'The returned2 depends on a future input despite blocking donor1.':'The returned1 depends only on available input0.'} Repair the upstream information route; changing the final mask's name cannot fix it.</FlowReadout>
  </FlowLab>;
}
