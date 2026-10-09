import { useState } from 'react';
import saved from '../../data/recommender-flow-library-state.json';
import { savedExplicitForward, savedImplicitForward, alsWitness } from '../../data/recommender-flow-serving-models.js';
import { validateItemIDs } from '../../data/recommender-flow-ranking-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecExactObject, RecSelect, formatRec as n , itemHue } from './RecommenderFlowControls.jsx';
import { RecWire as Wire, RecPort as Port } from './RecommenderFlowDrawing.jsx';
import './recommender-flow-serving.css';

const coordinates=count=>Array.from({length:count},(_,k)=>`k${k}`);
export function ExplicitLibraryIdentityFigure() {
  const [ids,setIDs]=useState({user:'U0',item:'I2'}),[clip,setClip]=useState(false),[revision,setRevision]=useState(0);
  const state=saved.history,result=savedExplicitForward(state,ids.user,ids.item,clip);
  const reset=()=>{setIDs({user:'U0',item:'I2'});setClip(false);setRevision(value=>value+1);};
  return <RecFigure id="D41" label="Actual saved Surprise raw identities select bias/factor/history rows before the score" reset={reset}
    controls={<><RecExactObject label="Raw user and item string identities" value={ids} revision={revision}
      description="Use the exact raw strings, e.g. U0/I2. A string 0 is not inner row 0. Unknown strings take the named fallback."
      parse={text=>{const value=JSON.parse(text);if(typeof value.user!=='string'||typeof value.item!=='string')throw new Error('Both raw identities must be strings.');return{user:value.user,item:value.item};}} onChange={setIDs}/>
      <label className="rec-flow-quantity"><span><input type="checkbox" aria-label="Clip library rating output" checked={clip} onChange={event=>setClip(event.target.checked)}/>Clip the rating output to [1,5]</span></label></>}
    result={`Saved Surprise ${state.version} SVD++ eight-pair fixture: raw ${JSON.stringify(ids.user)}/${JSON.stringify(ids.item)} maps to ${result.user===null?'unknown user':`user row ${result.user}`}/${result.item===null?'unknown item':`item row ${result.item}`}. Raw score ${n(result.raw)}; ${clip?'clipped':'unclipped'} output ${n(result.score)}. Mean 3 belongs to this history fixture; the older SVD fixture's mean is separately 3.1.`}>
    <div className="rec-flow-values"><Port>Raw user {JSON.stringify(ids.user)}</Port><Wire/><strong>{result.user===null?'No learned user row':`Trainset inner user ${result.user}`}</strong>
      <Port hue={result.item??0}>Raw item {JSON.stringify(ids.item)}</Port><Wire/><strong>{result.item===null?'No learned item row':`Trainset inner item ${result.item}`}</strong></div>
    <div className="rec-flow-parallel"><RecOperands label="Saved actual raw-to-inner user map" headers={['Raw string','Inner row']} rows={Object.entries(state.userMap)}/>
      <RecOperands label="Saved actual raw-to-inner item map" headers={['Raw string','Inner row']} rows={Object.entries(state.itemMap)}/></div>
    <RecMatrix
      columnHues={Array.from({ length: 2 }, (_, k) => itemHue(k))} label="Actual saved Surprise user/item/history factor arrays" columns={coordinates(2)} rows={[...state.P,...state.Q,...state.Y]}
      rowNames={[...state.P.map((_,user)=>`p U${user}`),...state.Q.map((_,item)=>`q I${item}`),...state.Y.map((_,item)=>`y I${item}`)]}/>
    <div className="rec-flow-values"><span>Actual selected trainset history occurrences:</span>{result.history.map((item,k)=><Port key={k} hue={item}>Occurrence {k+1}: I{item}</Port>)}{!result.history.length&&<span>No user history; contribution 0</span>}</div>
    <RecOperands label="Selected saved history sums, sqrt normalization and h=p+history" headers={['Coordinate','Σ y','History length','Divisor','History contribution','Saved p','Actual h','Saved q','h×q']}
      rows={result.h.map((value,k)=>[`k${k}`,result.totals[k],result.history.length,result.history.length?Math.sqrt(result.history.length):'no division',result.contribution[k],result.p[k],value,result.q[k],result.products[k]])}/>
    <div className="rec-flow-values"><Port>Saved mean {n(state.mu)}</Port><span>+</span><Port>User bias {n(result.bu)}{result.user===null?' (unknown → omitted)':''}</Port><span>+</span>
      <Port hue={result.item??0}>Item bias {n(result.bi)}{result.item===null?' (unknown → omitted)':''}</Port><span>+</span><Port>Σ matching products {n(result.products.reduce((a,b)=>a+b,0))}</Port><Wire/><strong>Raw {n(result.raw)}</strong><Wire/><span>{clip?'min(5,max(1,raw))':'No clipping'}</span><Wire/><strong>{n(result.score)}</strong></div>
    <RecOperands label="Separately retained older pure-SVD observations: different fixture and mean" headers={['Original raw query','Recorded raw output']}
      rows={[["user '0', item '2'",4.381337],["unknown user, item '0'",3.240102],['Both unknown → training mean',3.1]]}/>
    <p>The selected saved model is SVD++, so its q row reads h including its occurrence-list history. The earlier pure-SVD outputs below retain their own original five-by-seven fixture and mean; their full factor arrays were not recorded here. Equal package versions do not turn those into this model's parameters.</p>
  </RecFigure>;
}

export function ImplicitLibraryStateFigure() {
  const [context,setContext]=useState('witness'),[user,setUser]=useState(0),[recalculate,setRecalculate]=useState(true),[candidates,setCandidates]=useState([0,1,2]),[revision,setRevision]=useState(0);
  const state=context==='witness'?alsWitness():saved.ordinaryALS,result=savedImplicitForward(state,user,recalculate,candidates);
  const reset=()=>{setContext('witness');setUser(0);setRecalculate(true);setCandidates([0,1,2]);setRevision(value=>value+1);};
  const changeContext=next=>{setContext(next);setUser(0);setCandidates(Array.from({length:next==='witness'?3:100},(_,item)=>item));setRevision(value=>value+1);};
  const start=result.csr.indptr[user],end=result.csr.indptr[user+1],assembly=result.assembly;
  return <RecFigure id="D42" label="Actual CSR row selects confidence before stored-versus-final-Q inference and filtering" reset={reset}
    controls={<><fieldset className="rec-flow-quantity"><legend>Named saved/constructed row context</legend>
      <RecSelect label="ALS row context" value={context} options={[["witness",'Exact two-coordinate reversal witness'],['ordinary','Saved ordinary Retail prefix state']]} onChange={changeContext}/>
      <RecQuantity label="ALS selected user row" integer min={0} max={state.P.length-1} value={user} revision={revision} onChange={setUser}/></fieldset>
      <label className="rec-flow-quantity"><span><input type="checkbox" aria-label="Recalculate user against final Q" checked={recalculate} onChange={event=>setRecalculate(event.target.checked)}/>Recalculate against final Q</span><span>Uncheck to inspect stored training P; filtering does not change either factor vector.</span></label>
      <RecExactObject label="ALS candidate item row IDs" value={candidates} revision={revision} description={`Unique IDs 0…${state.Q.length-1}; empty is allowed. Already liked items are separately excluded by this discovery request.`}
        parse={text=>validateItemIDs(JSON.parse(text),state.Q.length,'Candidates')} onChange={setCandidates}/></>}
    result={result.available?`${state.version}: users×items ${result.csr.shape.join('×')}; selected user ${user} CSR slice [${start},${end}). Confidence is already 1+${state.alpha}×count, package alpha ${state.packageAlpha}. ${recalculate?'Final-Q request solve':'Stored training P'} issues item rows ${result.selected.map(row=>row.item).join(', ')||'none'}; at most 10 requested slots, ${10-result.selected.length} unfilled.`:result.reason}>
    <div className="rec-flow-values"><Port>CSR users×items {result.csr.shape.join('×')}</Port><Wire/><span>indptr[{user}]={start}, indptr[{user+1}]={end}</span><Wire/><Port>indices/data slice</Port><Wire/><strong>Package alpha 1: no second scaling</strong></div>
    <div className="rec-serving-array-scroll"><RecMatrix label="Complete actual CSR indptr" rows={[result.csr.indptr]} rowNames={['indptr']} columns={result.csr.indptr.map((_,k)=>String(k))}/></div>
    <RecOperands label="Selected actual CSR stored positions map to item rows and confidence" headers={['Stored position','Item row','Count','Already-converted confidence']}
      rows={Array.from({length:end-start},(_,k)=>{const position=start+k,item=result.csr.indices[position];return[position,`I${item}`,state.counts[user][item],result.csr.data[position]];})}/>
    <div className="rec-serving-array-scroll"><RecMatrix
      columnHues={Array.from({ length: state.Q[0].length }, (_, k) => itemHue(k))} rowHues={state.Q.map((_, item) => itemHue(item))} label="Complete current final Q, actual item rows" rows={state.Q} rowNames={state.Q.map((_,item)=>`I${item}`)} columns={coordinates(state.Q[0].length)}/></div>
    {state.oldQ&&<RecMatrix
      columnHues={Array.from({ length: 2 }, (_, k) => itemHue(k))} rowHues={state.oldQ.map((_, item) => itemHue(item))} label="Constructed previous Q which solved stored P; distinct from current final Q" rows={state.oldQ} rowNames={state.oldQ.map((_,item)=>`I${item}`)} columns={coordinates(2)}/>}
    <div className="rec-flow-parallel"><RecMatrix
      columnHues={Array.from({ length: state.Q[0].length }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.Q[0].length }, (_, k) => itemHue(k))} label="Final-Q Gram QᵀQ" rows={assembly.gram} rowNames={coordinates(state.Q[0].length)} columns={coordinates(state.Q[0].length)}/>
      <RecMatrix
      columnHues={Array.from({ length: state.Q[0].length }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.Q[0].length }, (_, k) => itemHue(k))} label="All-pair confidence A=QᵀCQ+λI" rows={assembly.A} rowNames={coordinates(state.Q[0].length)} columns={coordinates(state.Q[0].length)}/></div>
    <RecOperands label="Positive history corrections and target-weighted right hand vectors" headers={['Item','c−1','q coordinates','c×target×q']}
      rows={assembly.terms.filter(term=>term.target).map(term=>[`I${term.item}`,term.confidence-1,term.q.map(n).join(', '),term.right.map(n).join(', ')])}/>
    <RecMatrix
      columnHues={Array.from({ length: state.Q[0].length }, (_, k) => itemHue(k))} label="Stored training P versus recalculated request p and actual b" rows={[result.stored,assembly.b,assembly.p]} rowNames={['Stored P','Final-Q b','Request p']} columns={coordinates(state.Q[0].length)}/>
    <div className="rec-serving-array-scroll"><RecOperands label="Every current item score and post-score request membership" headers={['Item row','Count','Stored-P dot','Recalculated-p dot','Selected rule score','Candidate and unseen']}
      rows={result.rows.map(row=>[`I${row.item}`,row.count,row.stored,row.recalculated,row.score,row.eligible?'yes':'no'])}/></div>
    <div className="rec-flow-values"><span>Actual filtered descending score/ID order:</span>{result.ranked.map(row=><Port key={row.item} hue={row.item}>I{row.item}: {n(row.score)}</Port>)}{!result.ranked.length&&<span>No eligible candidates</span>}</div>
    <p>The witness's stored (.6,0) scores final I1/I2 as (0,.6), while its final-Q request (0,.6) scores them (.6,0). User row 1 has empty history and solves to zero. The selectable Retail state is the actual saved ordinary 200×100, width-4 prefix model; it differs from the retained original five-by-seven, width-3 output below. Selecting it only reads its saved arrays.</p>
  </RecFigure>;
}
