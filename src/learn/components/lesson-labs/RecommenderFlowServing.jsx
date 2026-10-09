import { useState } from 'react';
import { metadataDefaults, metadataProjection, servingSlate, servingCatalogue, retrievalGeometry,
  encoderFeatures, encoderHistory, encoderWeights, encoderForward, graphPropagation } from '../../data/recommender-flow-serving-models.js';
import { validateItemIDs } from '../../data/recommender-flow-ranking-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecExactObject, RecSelect, parseRecVector,
  useRecEvidence, itemHue, formatRec as n } from './RecommenderFlowControls.jsx';
import { RecWire as Wire, RecPort as Port, RecPlane } from './RecommenderFlowDrawing.jsx';
import './recommender-flow-serving.css';
const coordinateNames=['k0','k1'];

function parseMetadata(text) {
  const value=JSON.parse(text);
  if(!Array.isArray(value.X)||value.X.length<1||value.X.length>30||!Array.isArray(value.Q)||value.Q.length!==value.X.length)
    throw new Error('Use 1–30 paired feature/item rows in X and Q.');
  const X=value.X.map(row=>parseRecVector(JSON.stringify(row),2,-8,8)),Q=value.Q.map(row=>parseRecVector(JSON.stringify(row),2,-1e4,1e4));
  const feature=parseRecVector(JSON.stringify(value.feature),2,-8,8);return{X,Q,feature};
}
export function ColdItemProjectionFigure() {
  const [state,setState]=useState(metadataDefaults),[user,setUser]=useState(0),[revision,setRevision]=useState(0),result=metadataProjection(state,user);
  const reset=()=>{setState(metadataDefaults());setUser(0);setRevision(value=>value+1);};
  return <RecFigure id="D43" label="Actual paired metadata rows build a ridge map into the item-factor coordinates" reset={reset}
    controls={<><RecExactObject label="Paired metadata rows and new feature vector" value={{X:state.X,Q:state.Q,feature:state.feature}} revision={revision}
      description="Each X feature row has two coordinates ±8 and a corresponding two-coordinate Q row ±10000. New feature coordinates are ±8. Unknown feature categories require an explicit feature encoding; a zero row is supported."
      parse={parseMetadata} onChange={value=>setState(previous=>({...previous,...value}))}/>
      <RecQuantity label="Metadata ridge penalty λ" min={0} max={10} value={state.lambda} revision={revision} onChange={lambda=>setState(previous=>({...previous,lambda}))}/>
      <RecSelect label="Metadata query user" value={user===null?'unknown':user} options={[[0,'Known p=(1,0)'],[1,'Known p=(0,1)'],[2,'Known zero p=(0,0)'],['unknown','Unknown user: no learned p']]} onChange={value=>setUser(value==='unknown'?null:Number(value))}/></>}
    result={result.available?`New item q=(${result.q.map(n).join(', ')}). ${user===null?'No user factor: personalized score unavailable; choose a declared baseline separately.':`Selected p=(${result.p.map(n).join(', ')}) gives score ${n(result.score)}.`} This named metadata fixture is independent of the rating matrix.`:result.reason}>
    <div className="rec-flow-parallel"><RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} rowHues={state.X.map((_, item) => itemHue(item))} label="Actual training item metadata X, rows M0 onward" rows={state.X} rowNames={state.X.map((_,item)=>`M${item}`)} columns={['Feature 0','Feature 1']}/>
      <RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} rowHues={state.Q.map((_, item) => itemHue(item))} label="Paired learned item factors Q, same M row identities" rows={state.Q} rowNames={state.Q.map((_,item)=>`M${item}`)} columns={coordinateNames}/></div>
    <RecOperands label="Matching item-row products which build XᵀX and XᵀQ" headers={['Row','x0²','x0×x1','x1²','x0×q0','x0×q1','x1×q0','x1×q1']}
      rows={state.X.map((row,item)=>[`M${item}`,row[0]**2,row[0]*row[1],row[1]**2,row[0]*state.Q[item][0],row[0]*state.Q[item][1],row[1]*state.Q[item][0],row[1]*state.Q[item][1]])}/>
    <div className="rec-flow-parallel"><RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} label="Sum feature products plus λI: actual A" rows={result.A} rowNames={['Feature 0','Feature 1']} columns={['Feature 0','Feature 1']}/>
      <RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} label="Sum paired feature/factor products: b=XᵀQ" rows={result.b} rowNames={['Feature 0','Feature 1']} columns={coordinateNames}/></div>
    {result.available?<><div className="rec-flow-values"><Port>A W[:,k]=b[:,k], same A for both columns</Port><Wire/><span>Unique solve</span><Wire/><strong>Feature→factor W</strong></div>
      <RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} label="Actual solved W, feature rows and factor columns" rows={result.W} rowNames={['Feature 0','Feature 1']} columns={coordinateNames}/>
      <RecOperands label="New feature row multiplies matching W coordinates before summing" headers={['Feature','New x','W k0','Product k0','W k1','Product k1']}
        rows={state.feature.map((value,r)=>[`Feature ${r}`,value,result.W[r][0],result.products[r][0],result.W[r][1],result.products[r][1]])}/>
      <div className="rec-flow-values"><Port>Σ feature products → q ({result.q.map(n).join(', ')})</Port><Wire/><Port>Selected user {result.p?`(${result.p.map(n).join(', ')})`:'missing p'}</Port><Wire/><strong>{user===null?'No personalized dot':`pᵀq ${n(result.score)}`}</strong></div>
      {result.p&&<RecOperands
      rowHues={result.p.map((_, k) => itemHue(k))} label="Actual known-user coordinate products" headers={['Coordinate','p','New q','Product']} rows={result.p.map((value,k)=>[`k${k}`,value,result.q[k],value*result.q[k]])}/>}</>:<strong>{result.reason} No invented W or item score.</strong>}
  </RecFigure>;
}

export function ServingSlateFigure() {
  const evidence=useRecEvidence(),[candidates,setCandidates]=useState([0,1,2,3,4]),[quota,setQuota]=useState(1),[revision,setRevision]=useState(0);
  const result=servingSlate(evidence.request,candidates,quota),reset=()=>{evidence.reset();setCandidates([0,1,2,3,4]);setQuota(1);setRevision(value=>value+1);};
  return <RecFigure id="D44" label="Actual item identities pass release/history gates, fixed factor products and category quota" reset={reset}
    controls={<><RecQuantity label="Serving request tick" min={0} max={100} value={evidence.request} revision={evidence.revision} onChange={request=>evidence.patch({request})}/>
      <RecExactObject label="Serving candidate item IDs" value={candidates} revision={revision} description="Unique IDs 0–6, empty is allowed; the opening five-item worked list is the default. The request tick is shared with the earlier E clock; this score fixture has independent fixed p/Q."
        parse={text=>validateItemIDs(JSON.parse(text),7,'Candidates')} onChange={setCandidates}/>
      <RecQuantity label="Category cap per slate" integer min={0} max={3} value={quota} revision={revision} onChange={setQuota}/></>}
    result={`Request ${n(evidence.request)} uses ${result.past.length} permitted purchase occurrences, excludes ${result.future.length} future occurrences. Eligible score order ${result.ranked.map(row=>`I${row.id}`).join(', ')||'none'}. Cap ${quota}: issued ${result.issued.map(row=>`I${row.id}`).join(', ')||'none'}; ${result.unfilled} of two slots unfilled. Quota does not change any score.`}>
    <div className="rec-flow-values">{result.history.map(event=><Port key={event.id} hue={event.item}>{event.id}, t={event.tick}: {event.tick<=evidence.request?'known purchase':'future → not yet known'}</Port>)}</div>
    <RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} label="Named fixed serving p/Q context, independent of edited rating/factor parameters" rows={[result.p,...servingCatalogue().map(row=>row.q)]}
      rowNames={['p fixed',...servingCatalogue().map(row=>`q I${row.id}`)]} columns={coordinateNames}/>
    <RecOperands
      rowHues={result.rows.map(row => itemHue(row.id))} label="Every actual item passes the time, purchase and candidate tests before scoring" headers={['Item','Release','Category','Candidate','Past purchase','Exclusion','p0×q0','p1×q1','Dot if eligible']}
      rows={result.rows.map(row=>[`I${row.id}`,row.release,row.category,candidates.includes(row.id)?'yes':'no',result.past.some(event=>event.item===row.id)?'yes':'no',row.reasons.join('; ')||'passes',...row.products,row.reasons.length?null:row.score])}/>
    <div className="rec-flow-values"><span>Descending score, ascending ID ties:</span>{result.ranked.map(row=><Port key={row.id} hue={row.id}>I{row.id}: {n(row.score)}, {row.category}</Port>)}{!result.ranked.length&&<span>Empty eligible order</span>}</div>
    <RecOperands
      rowHues={result.trace.map(row => itemHue(row.id))} label="Actual quota scan retains scores while changing issued identity slots" headers={['Score-order item','Score','Category','Decision']} rows={result.trace.map(row=>[`I${row.id}`,row.score,row.category,row.reason])}/>
    <div className="rec-flow-values">{[0,1].map(slot=><Port key={slot} hue={result.issued[slot]?.id??slot}>Slot {slot+1}: {result.issued[slot]?`I${result.issued[slot].id}`:'unfilled'}</Port>)}</div>
  </RecFigure>;
}

export function RetrievalGeometryFigure() {
  const [vector,setVector]=useState([1.5,0]),[bias,setBias]=useState(0),[rule,setRule]=useState('dot'),[revision,setRevision]=useState(0),result=retrievalGeometry(vector,bias,rule);
  return <RecFigure id="D45" label="Real retrieval vectors distinguish dot, cosine and the augmented bias score" reset={()=>{setVector([1.5,0]);setBias(0);setRule('dot');setRevision(value=>value+1);}}
    controls={<><RecExactObject label="Selected item B vector" value={vector} revision={revision} description="Two exact factor coordinates ±10000. Zero has no normalized direction." parse={text=>parseRecVector(text,2,-1e4,1e4)} onChange={setVector}/>
      <RecQuantity label="Selected B item bias" min={-10} max={10} value={bias} revision={revision} onChange={setBias}/>
      <RecSelect label="Retrieval scoring rule" value={rule} options={[["dot",'Original dot'],['cosine','Normalized cosine'],['augmented-dot','Augmented dot with bias'],['augmented-cosine','Normalized augmented vectors']]} onChange={setRule}/></>}
    result={`${rule} ranks ${result.ranked.map(row=>['A','B','zero'][row.item]).join(', ')||'none'}. Dot uses magnitude; cosine changes the score objective. Zero cosine stays unavailable. Bias augmentation preserves the biased dot before any normalization.`}>
    <RecPlane label="Actual p/A/B vectors on numeric coordinate axes" vectors={[{id:'p=(1,0)',xy:result.p,hue:2},{id:'A=(2,2)',xy:[2,2],hue:0},{id:`B=(${vector.map(n).join(',')})`,xy:vector,hue:1}]}/>
    <RecOperands
      rowHues={[itemHue(0), itemHue(1), undefined]} label="Real coordinate products, norms and distinct score rules" headers={['Item','q0','q1','p0×q0','p1×q1','Dot','Norm q','Cosine','Item bias','Augmented dot','Augmented cosine','Chosen score']}
      rows={result.rows.map(row=>[['A','B','zero'][row.item],...row.q,...row.products,row.dot,row.norm,row.cosine,row.bias,row.augmented,row.augmentedCosine,row.score])}/>
    <RecMatrix
      columnHues={[itemHue(0), itemHue(1), undefined]} rowHues={[itemHue(2), itemHue(0), itemHue(1), undefined]} label="Actual bias augmentation appends one coordinate, with its own norm" rows={[[1,0,1],...result.rows.map(row=>row.augmentedQ)]} rowNames={['Augmented p','Augmented A','Augmented B','Augmented zero']} columns={['k0','k1','Bias coordinate']}/>
    <div className="rec-flow-values"><Port>[p,1]ᵀ[q,b] = p0q0 + p1q1 + 1×b</Port><Wire/><strong>B biased dot {n(result.rows[1].augmented)}</strong><span>≠ generally normalized augmented cosine {n(result.rows[1].augmentedCosine)}</span></div>
  </RecFigure>;
}

export function EncoderTimeBoundaryFigure() {
  const evidence=useRecEvidence(),[stale,setStale]=useState(false),result=encoderForward(evidence.request,stale);
  return <RecFigure id="D46" label="Permitted occurrence features feed the user tower; versioned item vectors feed a separate dot" reset={()=>{evidence.reset();setStale(false);}}
    controls={<><RecQuantity label="Encoder history cutoff tick" min={0} max={100} value={evidence.request} revision={evidence.revision} onChange={request=>evidence.patch({request})}/>
      <label className="rec-flow-quantity"><span><input type="checkbox" aria-label="Use stale item encoder cache" checked={stale} onChange={event=>setStale(event.target.checked)}/>Use cached encoder-v0 with current encoder-v1</span></label></>}
    result={result.available?`At t=${n(evidence.request)}, ${result.prefix.length} permitted occurrences pool to (${result.pooled.map(n).join(', ')}); user vector (${result.p.map(n).join(', ')}). Current cache ${result.cacheVersion} dots ${result.scores.map(n).join(', ')}. Repeated I0 occurrences stay separate; ${result.future.length} future tokens are excluded.`:result.reason}>
    <div className="rec-flow-values">{encoderHistory.map(event=><Port key={event.id} hue={event.item}>{event.id}: I{event.item}, t={event.tick} → {event.tick<=evidence.request?'permitted mean input':'future, excluded'}</Port>)}</div>
    <RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} rowHues={[itemHue(0), itemHue(1), itemHue(2)]} label="Item feature X, actual three item rows × two feature columns" rows={encoderFeatures} rowNames={['I0','I1','I2']} columns={['Feature 0','Feature 1']}/>
    <RecOperands
      rowHues={result.prefix.map(event => itemHue(event.item))} label="Only permitted occurrence feature rows enter the actual pooled mean" headers={['Occurrence','Item','Feature 0','Feature 1']} rows={result.prefix.map(event=>[event.id,`I${event.item}`,...encoderFeatures[event.item]])}/>
    <div className="rec-flow-values"><Port>Σ permitted feature rows / {result.prefix.length||'empty → zero'} = ({result.pooled.map(n).join(', ')})</Port><Wire/><span>History encoder + current context encoder</span></div>
    <div className="rec-flow-parallel"><RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} label="History encoder Wᵤ, 2 features × 2 coordinates" rows={encoderWeights.history} rowNames={['Feature 0','Feature 1']} columns={coordinateNames}/>
      <RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} label="Separate item encoder Wᵢ, 2 features × 2 coordinates" rows={encoderWeights.item} rowNames={['Feature 0','Feature 1']} columns={coordinateNames}/></div>
    <RecOperands
      rowHues={result.p.map((_, k) => itemHue(k))} label="Actual pooled feature products plus current context [1]×Wcontext" headers={['Coordinate','Pooled f0×W0k','Pooled f1×W1k','Context addend','User p']}
      rows={result.p.map((value,k)=>[`k${k}`,result.historyProducts[0][k],result.historyProducts[1][k],encoderWeights.context[0][k],value])}/>
    <RecMatrix
      columnHues={coordinateNames.map((_, k) => itemHue(k))} rowHues={[itemHue(0), itemHue(1), itemHue(2)]} label={`Item-only XWᵢ cache, 3 item rows × 2 coordinates; ${result.cacheVersion}`} rows={result.Q} rowNames={['I0','I1','I2']} columns={coordinateNames}/>
    <div className="rec-flow-values"><Port>Current encoder {result.encoderVersion}</Port><Wire/><Port>Cache {result.cacheVersion}</Port><Wire/><strong>{result.available?'Version matches: compute current dot':'Mismatch: no current score or slate'}</strong></div>
    {result.available&&<><RecOperands
      rowHues={result.Q.map((_, item) => itemHue(item))} label="Actual cached coordinates meet user coordinates at the dot" headers={['Item','p0×q0','p1×q1','Dot']} rows={result.Q.map((row,item)=>[`I${item}`,result.p[0]*row[0],result.p[1]*row[1],result.scores[item]])}/>
      <RecOperands
      rowHues={result.joint.map(row => itemHue(row.item))} label="Separate fixed joint nonlinear ranker reads current pooled user AND item features" headers={['Item','z=pooled·itemFeatures−.5','ReLU(z)','Cached dot','Joint sum']} rows={result.joint.map(row=>[`I${row.item}`,row.z,row.relu,row.dot,row.score])}/>
      <p>The additional ReLU operand depends on the current user pool and the selected item together. Its full score cannot be replaced by the cached item-only dot. These are declared fixed weights and arithmetic, not a fitted neural recommender.</p></>}
  </RecFigure>;
}

function InteractionGraph({result}) {
  const names=['U0','U1','I0','I1'],positions=[[150,100],[150,330],[600,100],[600,330]];
  return <div className="rec-flow-pan" tabIndex={0} role="region" aria-label="Actual four-node interaction graph: local scroll"><svg className="rec-serving-graph" viewBox="0 0 800 430" role="img" aria-label="Actual four-node bipartite graph, printed edges and degrees">
    {result.edges.map(edge=>{const start=positions[edge.user],end=positions[edge.node];return <g key={`${edge.user}-${edge.item}`}><line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke={itemHue(edge.item)}/>
      <text x={start[0]+65} y={start[1]+(edge.item===edge.user?(edge.user===0?-18:45):edge.user===0?80:-80)}>{`e${edge.user}${edge.item}`}</text></g>;})}
    {names.map((name,node)=><g key={name}><circle cx={positions[node][0]} cy={positions[node][1]} r="35" fill="#080808" stroke={itemHue(node<2?node:node-2)} strokeWidth="3"/>
      <text x={positions[node][0]} y={positions[node][1]+6} textAnchor="middle">{name}</text><text x={positions[node][0]} y={positions[node][1]+65} textAnchor="middle">degree {result.degrees[node]}</text></g>)}
  </svg></div>;
}
export function GraphPropagationBridgeFigure() {
  const [R,setR]=useState([[1,1],[0,1]]),[initial,setInitial]=useState([2,0,1,3]),[depth,setDepth]=useState(2),[revision,setRevision]=useState(0);
  const result=graphPropagation(R,initial,depth),names=['U0','U1','I0','I1'];
  return <RecFigure id="D47" label="Actual binary interaction graph sends normalized old-buffer messages then mixes layers" reset={()=>{setR([[1,1],[0,1]]);setInitial([2,0,1,3]);setDepth(2);setRevision(value=>value+1);}}
    controls={<><RecExactObject label="Binary U0/U1 by I0/I1 interactions" value={R} revision={revision} description="Exactly two user rows and two item columns; each edge entry is 0 or 1. Removing all incident edges creates an isolated node."
      parse={text=>{const value=JSON.parse(text);if(!Array.isArray(value)||value.length!==2||value.some(row=>!Array.isArray(row)||row.length!==2||row.some(entry=>entry!==0&&entry!==1)))throw new Error('Use a binary 2×2 interaction matrix.');return value;}} onChange={setR}/>
      <RecExactObject label="Initial scalar node embeddings" value={initial} revision={revision} description="Order [U0,U1,I0,I1], four exact values from −8 to 8; no hidden learned fit." parse={text=>parseRecVector(text,4,-8,8)} onChange={setInitial}/>
      <RecQuantity label="Graph propagation depth K" integer min={0} max={3} value={depth} revision={revision} onChange={setDepth}/></>}
    result={`K=${depth}, degrees [${result.degrees.join(', ')}]. Equal mixture of ${depth+1} buffers: (${result.mixed.map(n).join(', ')}). U0/I0 score ${n(result.scores[0][0])}; isolated nodes receive zero at later layers but retain layer 0/${depth+1}. This fixed graph forward is not a trained graph study.`}>
    <InteractionGraph result={result}/><p>Undirected interactions; each layer's messages read one complete old buffer.</p>
    <RecMatrix
      columnHues={[itemHue(0), itemHue(1)]} label="Binary R uses separate user rows and item columns" rows={R} rowNames={['U0','U1']} columns={['I0','I1']}/>
    <RecOperands label="Each actual edge gets its own degree-adjusted weight" headers={['Edge','User degree','Item degree','1/√(degree product)']} rows={result.edges.map(edge=>[`e${edge.user}${edge.item}: U${edge.user}—I${edge.item}`,result.degrees[edge.user],result.degrees[edge.node],edge.weight])}/>
    <RecMatrix
      columnHues={names.map((_, node) => itemHue(node < 2 ? node : node - 2))} rowHues={names.map((_, node) => itemHue(node < 2 ? node : node - 2))} label="Actual block normalized adjacency, [users,items] on both axes" rows={result.operator} rowNames={names} columns={names}/>
    {result.products.map((products,stage)=><RecOperands key={stage} label={`Layer ${stage}→${stage+1}: literal edge products read the same old buffer`} headers={['Edge','Old user','Old item','Weight','To user: weight×old item','To item: weight×old user']}
      rows={products.map(row=>[`e${row.user}${row.item}`,row.oldUser,row.oldItem,row.weight,row.toUser,row.toItem])}/>)}
    <RecMatrix
      columnHues={names.map((_, node) => itemHue(node < 2 ? node : node - 2))} label="Actual complete layer buffers and layer-zero-inclusive mixture" rows={[...result.layers,result.mixed]} rowNames={[...result.layers.map((_,stage)=>`Layer ${stage}`),'Equal mean']} columns={names}/>
    <RecOperands label="Selected user/item scalar coordinates multiply only after mixing" headers={['Pair','Mixed user','Mixed item','Product']} rows={result.scores.flatMap((row,user)=>row.map((value,item)=>[`U${user}/I${item}`,result.mixed[user],result.mixed[2+item],value]))}/>
    <p>The edge kernel costs O(K·E·d), with O(K·N·d) dense buffer work. This browser diagnostic also scans dense R for edges in O(U·I), builds the displayed N² block operator and retains all layers/products; its all-pair score table costs O(U·I·d). These costs describe different objects and do not make this picture a sparse production implementation.</p>
  </RecFigure>;
}
