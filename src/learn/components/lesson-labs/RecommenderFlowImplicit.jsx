import { createContext, useContext, useState } from 'react';
import { implicitDefaults, implicitAssembly, implicitObjective, implicitContourPaths, implicitDecomposition,
  signedPackageAssembly } from '../../data/recommender-flow-implicit-models.js';
import { resizeFactorRows } from '../../data/recommender-flow-factor-models.js';
import { sum } from '../../data/recommender-flow-evidence-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecSelect, RecExactObject, parseRecVector, formatRec as n , itemHue } from './RecommenderFlowControls.jsx';
import { RecWire as Wire, RecPort as Port, RecBars, RecPlane } from './RecommenderFlowDrawing.jsx';
import './recommender-flow-implicit.css';

const ImplicitContext=createContext(null);
const ids=count=>Array.from({length:count},(_,item)=>[item,`I${item}`]);
const coordinates=count=>Array.from({length:count},(_,coordinate)=>`k${coordinate}`);

export function RecommenderImplicitProvider({children}){
  const defaults = () => ({ ...implicitDefaults(), gramCell: [0, 0] });
  const [state,setState]=useState(defaults),[revision,setRevision]=useState(0);
  const patch=values=>setState(previous=>({...previous,...values}));
  const resize=(items,dimension)=>setState(previous=>({...previous,dimension,Q:resizeFactorRows(previous.Q,items,dimension),
    counts:Array.from({length:items},(_,item)=>previous.counts[item]??0),signed:Array.from({length:items},(_,item)=>previous.signed[item]??0),
    point:Array.from({length:dimension},(_,coordinate)=>previous.point[coordinate]??0),gramCell:previous.gramCell.map(value=>Math.min(value,dimension-1)),target:Math.min(previous.target,items-1),term:Math.min(previous.term,items-1)}));
  const reset=()=>{setState(defaults());setRevision(value=>value+1);};
  return <ImplicitContext.Provider value={{...state,patch,resize,reset,revision}}>{children}</ImplicitContext.Provider>;
}

export function useRecImplicit(){const state=useContext(ImplicitContext);if(!state)throw new Error('Implicit views require RecommenderImplicitProvider.');return state;}
const assemblyOf=state=>implicitAssembly(state.Q,state.counts,state.alpha,state.lambda,state.includeMissing);

function CountEditor({state}){
  return <RecExactObject label="Counts by item ID" value={state.counts} revision={state.revision}
    description={`${state.Q.length} finite nonnegative counts in I0… order, each 0–20. Repeated occurrences accumulate into a cell’s count.`}
    parse={text=>parseRecVector(text,state.Q.length,0,20)} onChange={counts=>state.patch({counts})} />;
}

function OuterMatrices({label,terms,dimension,kind='correction'}){
  return <div className="rec-flow-array-operation">{terms.map(term=><RecMatrix
      columnHues={Array.from({ length: dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: dimension }, (_, k) => itemHue(k))} key={term.item} label={`${label} I${term.item}`}
    rows={term[kind]} columns={coordinates(dimension)} rowNames={coordinates(dimension)} />)}</div>;
}

function SolveCircuit({assembly,label}){
  return <><div className="rec-flow-parallel"><RecMatrix
      columnHues={Array.from({ length: assembly.b.length }, (_, k) => itemHue(k))} rowHues={Array.from({ length: assembly.b.length }, (_, k) => itemHue(k))} label={`${label}: A`} rows={assembly.A} columns={coordinates(assembly.b.length)} rowNames={coordinates(assembly.b.length)} />
    <RecMatrix
      rowHues={Array.from({ length: assembly.b.length }, (_, k) => itemHue(k))} label={`${label}: b`} rows={assembly.b.map(value=>[value])} columns={['b']} rowNames={coordinates(assembly.b.length)} /></div>
    <div className="rec-flow-values"><span>A p = b</span><Wire />{assembly.available?<><strong>p=({assembly.p.map(n).join(', ')})</strong><span>Residual Ap−b=({assembly.residual.map(n).join(', ')})</span></>:<strong>{assembly.reason}</strong>}</div></>;
}

export function ImplicitConfidenceFigure(){
  const state=useRecImplicit(),assembly=assemblyOf(state),objective=implicitObjective(assembly,state.point);
  return <RecFigure id="D25" label="Counts become separate target and confidence operands" reset={state.reset}
    controls={<><CountEditor state={state} /><RecQuantity label="Count multiplier α" value={state.alpha} min={0} max={40} revision={state.revision} onChange={alpha=>state.patch({alpha})} /></>}
    result={`Counts → targets (${assembly.targets.join(', ')}), confidences (${assembly.confidence.map(n).join(', ')}). Current ${state.includeMissing?'all-pair':'omitted-missing-pair changed-objective'} weighted residual plus once-entity user penalty ${n(objective.loss)}; a zero count retains confidence 1 in the all-pair rule.`}>
    <RecBars label="Recorded cell counts" rows={state.counts.map((value,item)=>({id:`I${item}`,value,hue:item}))} identifyValues />
    <div className="rec-flow-array-operation">{assembly.terms.map(term=><div key={term.item} className="rec-flow-values"><Port hue={term.item}>I{term.item}: n {n(term.count)}</Port>
      <Wire /><span>n&gt;0: target {term.target}</span><Port hue={term.item}>n {n(term.count)}</Port><Wire /><span>× α {n(state.alpha)} + baseline 1</span><Wire /><strong>c {n(term.confidence)}</strong></div>)}</div>
    <RecOperands
      rowHues={objective.terms.map(term => itemHue(term.item))} label="Current p: every included pair supplies weighted residual curvature" headers={['Item','Target','Confidence','Dot score','Residual²','Weighted term']}
      rows={objective.terms.map(term=>[`I${term.item}`,term.target,term.confidence,term.score,(term.target-term.score)**2,term.weighted])} />
  </RecFigure>;
}

export function ImplicitGramFigure(){
  const state=useRecImplicit(),assembly=assemblyOf(state);
  const cell = state.gramCell;
  const setCell = gramCell => state.patch({ gramCell });
  const row = Math.min(cell[0], state.dimension - 1), column = Math.min(cell[1], state.dimension - 1);
  const selected=assembly.terms.filter(term=>term.target);
  return <RecFigure id="D26" label="Once Gram, sparse positive corrections and ridge assemble actual normal equations" reset={() => { state.reset(); setCell([0, 0]); }}
    controls={<><RecQuantity label="Implicit penalty λ" value={state.lambda} min={.1} max={10} revision={state.revision} onChange={lambda=>state.patch({lambda})} />
      <RecSelect label="Missing-pair objective" value={state.includeMissing?'all':'omit'} options={[["all",'All pairs, including unobserved baseline'],['omit','Omit missing terms: changed objective']]}
        onChange={value=>state.patch({includeMissing:value==='all'})} />
      <fieldset className="rec-flow-quantity"><legend>Traced Gram coordinate pair</legend>
        <RecSelect label="Gram row coordinate" value={row} options={coordinates(state.dimension).map((label, k) => [k, label])}
          onChange={value => setCell([Number(value), column])} />
        <RecSelect label="Gram column coordinate" value={column} options={coordinates(state.dimension).map((label, k) => [k, label])}
          onChange={value => setCell([row, Number(value)])} />
      </fieldset></>}
    result={`Current ${state.includeMissing?'all-pair':'omitted-missing-pair changed'} objective: ${assembly.available?`p=(${assembly.p.map(n).join(', ')})`:'solve unavailable'}. Stored positive cells ${selected.length}/${state.Q.length}; count-zero curvature ${state.includeMissing?'retained':'removed explicitly'}.`}>
    <RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={ids(state.Q.length).map(([item]) => itemHue(item))} label="Q: fixed item-coordinate rows" rows={state.Q} columns={coordinates(state.dimension)} rowNames={ids(state.Q.length).map(([,label])=>label)} />
    <Wire down /><RecOperands
      columnHues={[itemHue(row), itemHue(column), undefined]} rowHues={state.Q.map((_, item) => itemHue(item))} label="Selected Gram cell: every item supplies matching coordinate operands" headers={['Item', `q k${row}`, `q k${column}`, 'Product']}
      rows={state.Q.map((q, item) => [`I${item}`, q[row], q[column], q[row] * q[column]])} />
    <div className="rec-flow-values"><span>Sum selected coordinate products</span><Wire /><strong>Gram[k{row}, k{column}] = {n(assembly.gram[row][column])}</strong></div>
    <RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label="QᵀQ: baseline confidence 1 for every item" rows={assembly.gram} columns={coordinates(state.dimension)} rowNames={coordinates(state.dimension)}
      selected={[row, column]} onSelect={(row, column) => setCell([row, column])} />
    <div className="rec-flow-values"><span>Baseline Gram</span><span className="rec-flow-operator">+</span><span>Positive corrections (cᵢ−1) qᵢqᵢᵀ</span></div>
    <OuterMatrices label="Positive correction" terms={selected} dimension={state.dimension} />
    {!state.includeMissing&&<><div className="rec-flow-values"><span className="rec-flow-operator">−</span><strong>Changed objective removes every count-zero baseline outer product below</strong></div>
      <OuterMatrices label="Removed missing baseline outer product" terms={assembly.terms.filter(term=>!term.target)} dimension={state.dimension} kind="outer" /></>}
    <div className="rec-flow-values"><span className="rec-flow-operator">+</span><Port hue={2}>λ {n(state.lambda)} × identity</Port><Wire /><strong>A</strong></div>
    <RecOperands
      rowHues={assembly.terms.map(term => itemHue(term.item))} label="Positive right-side terms, no contribution from target 0" headers={['Item','Target','Confidence','c×target×q vector']}
      rows={assembly.terms.map(term=>[`I${term.item}`,term.target,term.confidence,term.right.map(n).join(', ')])} />
    <Wire down /><SolveCircuit assembly={assembly} label="Actual weighted block" />
  </RecFigure>;
}

export function ImplicitGeometryFigure(){
  const state=useRecImplicit(),assembly=assemblyOf(state),objective=implicitObjective(assembly,state.point),paths=implicitContourPaths(assembly);
  const minimum=assembly.available?implicitObjective(assembly,assembly.p).loss:null;
  const slicePoint=assembly.available?assembly.p.map((value,k)=>k<2?state.point[k]:value):null;
  const sliceLoss=slicePoint?implicitObjective(assembly,slicePoint).loss:null;
  return <RecFigure id="D27" label="Exact current quadratic contour levels and gradient in factor coordinates" reset={state.reset}
    controls={<RecExactObject label="Selected implicit user point" value={state.point} revision={state.revision}
      description={`${state.dimension} coordinates in −4…4. In dimension > 2 the plane is a slice through the minimizer with other coordinates fixed there.`}
      parse={text=>parseRecVector(text,state.dimension,-4,4)} onChange={point=>state.patch({point})} />}
    result={`Selected full point loss ${n(objective.loss)}, gradient (${objective.gradient.map(n).join(', ')}); block minimum ${n(minimum)}. ${state.dimension<2?'A one-coordinate quadratic has no two-coordinate contour plane.':`The plotted first-two-coordinate projection fixes other coordinates at p*: slice loss ${n(sliceLoss)}. Each contour labels its increase zᵀAz.`}`}>
    {state.dimension>=2&&assembly.available?<RecPlane label="Current two-coordinate slice through actual minimizer" vectors={[]}
      points={[{id:'p*',xy:assembly.p.slice(0,2),hue:1,legend:true},
        {id:'selected projection',xy:state.point.slice(0,2),hue:2,legend:true}]}
      paths={paths}/>:<strong>Two-coordinate contours unavailable in this dimension/state</strong>}
    <RecOperands label="Actual contour levels; higher coordinates fixed at p*" headers={['Contour','Increase zᵀAz','Full objective at level']}
      rows={paths.map(path=>[`Level +${n(path.level)}`,path.level,minimum+path.level])} />
    <RecOperands
      rowHues={objective.terms.map(term => itemHue(term.item))} label="Selected full point: included weighted terms" headers={['Item','Target','Confidence','Score','Weighted squared residual']}
      rows={objective.terms.map(term=>[`I${term.item}`,term.target,term.confidence,term.score,term.weighted])} />
    <div className="rec-flow-values"><span>Σ weighted terms {n(sum(objective.terms.map(term=>term.weighted)))}</span><span className="rec-flow-operator">+</span>
      <span>λ ‖p‖² {n(objective.penalty)}</span><Wire /><strong>{n(objective.loss)}</strong></div>
  </RecFigure>;
}

export function ImplicitCostFigure(){
  const state=useRecImplicit(),assembly=assemblyOf(state),positive=assembly.terms.filter(term=>term.target),items=state.Q.length,d=state.dimension;
  return <RecFigure id="D28" label="Actual cached Gram versus sparse user work and storage counts" reset={state.reset}
    controls={<><fieldset className="rec-flow-quantity"><legend>Fixed item-array shape</legend>
      <RecQuantity label="Implicit item rows" integer value={items} min={1} max={30} revision={state.revision} onChange={items=>state.resize(items,d)} />
      <RecQuantity label="Implicit factor width" integer value={d} min={1} max={5} revision={state.revision} onChange={dimension=>state.resize(items,dimension)} /></fieldset>
      <CountEditor state={state} /><RecExactObject label="Fixed Q item array" value={state.Q} revision={state.revision}
        description={`${items} JSON rows of ${d} coordinates, each ±10000. New item rows/coordinates grow as zeros.`}
        parse={text=>{const rows=JSON.parse(text);if(!Array.isArray(rows)||rows.length!==items)throw new Error(`Use ${items} rows.`);return rows.map(row=>parseRecVector(JSON.stringify(row),d,-1e4,1e4));}}
        onChange={Q=>state.patch({Q})} /></>}
    result={`I ${items}, d ${d}, nᵤ ${positive.length}: once Gram ${items*d*d} scalar products; user corrections ${positive.length*d*d}; direct solve order d³=${d**3}. These are algebraic work terms, not elapsed-time measurements. No positive cells still leaves the baseline Gram and yields p=0.`}>
    <div className="rec-flow-array-operation"><RecMatrix
      columnHues={Array.from({ length: d }, (_, k) => itemHue(k))} rowHues={ids(items).map(([item]) => itemHue(item))} label="Every item row feeds the once-computed Gram" rows={state.Q} columns={coordinates(d)} rowNames={ids(items).map(([,label])=>label)} />
      <Wire down /><RecMatrix
      columnHues={Array.from({ length: d }, (_, k) => itemHue(k))} rowHues={Array.from({ length: d }, (_, k) => itemHue(k))} label="Once Gram: d×d cache" rows={assembly.gram} columns={coordinates(d)} rowNames={coordinates(d)} />
      <div className="rec-flow-values">{positive.map(term=><Port key={term.item} hue={term.item}>I{term.item}: count {n(term.count)}, c {n(term.confidence)}</Port>)}{!positive.length&&<span>Empty positive-cell list</span>}<Wire /><span>Only these cells add corrections/right-side terms</span><Wire /><strong>d×d solve</strong></div>
      <RecOperands label="Exact array sizes and leading arithmetic terms" headers={['Stage','Stored scalars/entries','Leading work term']}
        rows={[["Fixed Q",items*d,items*d*d],['Gram/work',d*d,positive.length*d*d],['Positive cell list',positive.length,positive.length*d],['Direct block solve',d*d,d**3]]} />
    </div>
  </RecFigure>;
}

export function ImplicitContributionFigure(){
  const state=useRecImplicit(),assembly=assemblyOf(state),result=implicitDecomposition(assembly,state.target);
  return <RecFigure id="D29" label="Target inverse action exposes signed positive-history score contributions" reset={state.reset}
    controls={<><RecSelect label="Contribution target item" value={state.target} options={ids(state.Q.length)} onChange={target=>state.patch({target:Number(target)})} />
      <RecSelect label="Highlighted history item" value={state.term} options={ids(state.Q.length)} onChange={term=>state.patch({term:Number(term)})} /></>}
    result={result.available?`I${state.target}: Σ positive-history contributions ${n(result.total)} equals direct pᵀq ${n(result.direct)}. ${state.counts[state.term]>0?`Highlighted I${state.term} contribution ${n(result.contributions.find(term=>term.item===state.term)?.value)}.`:`I${state.term} has no positive history contribution.`} This is computational attribution, not a causal effect.`:result.reason}>
    <div className="rec-flow-values"><Port hue={state.target}>Target q_I{state.target} ({state.Q[state.target].map(n).join(', ')})</Port><Wire /><span>A v = q_target</span><Wire />
      <strong>v {result.available?`(${result.v.map(n).join(', ')})`:'unavailable'}</strong></div>
    {result.available&&<><RecOperands
      rowHues={result.contributions.map(term => itemHue(term.item))} label="Each positive-history row supplies cᵢ(qᵢᵀv)" headers={['History item','Confidence','qᵢᵀv','Signed contribution']}
      rows={result.contributions.map(term=>[`I${term.item}${term.item===state.term?' selected':''}`,term.confidence,term.dot,term.value])} />
      <RecBars label={`I${state.target} score contributions`} rows={result.contributions.map(term=>({id:`I${term.item}`,value:term.value,hue:term.item}))} identifyValues />
      <div className="rec-flow-values"><span>Σ signed terms {n(result.total)}</span><Wire /><strong>Direct dot {n(result.direct)}</strong></div></>}
  </RecFigure>;
}

export function SignedConfidenceFigure(){
  const state=useRecImplicit(),result=signedPackageAssembly(state.Q,state.signed,state.lambda);
  const fault=signedPackageAssembly([[1]],[0],1,true),absent=signedPackageAssembly([[1]],[0],1);
  return <RecFigure id="D30" label="Package signed CSR confidence and omitted-zero baseline versus stored-zero fault" reset={state.reset}
    controls={<><RecExactObject label="Package confidence coordinates" value={state.signed} revision={state.revision}
      description={`${state.Q.length} confidence values in I order, each −801…801. Positive→target 1, negative→target 0 with |value| confidence; exact 0 omits the CSR coordinate. Package alpha 1.`}
      parse={text=>parseRecVector(text,state.Q.length,-801,801)} onChange={signed=>state.patch({signed})} />
      <RecQuantity label="Package block penalty λ" value={state.lambda} min={.1} max={10} revision={state.revision} onChange={lambda=>state.patch({lambda})} /></>}
    result={`Stored coordinates ${result.stored.length}/${state.signed.length}; numeric zeros eliminated before the package route. ${result.available?`User vector (${result.p.map(n).join(', ')})`:result.reason}. Negative confidence is not a negative purchase count.`}>
    <RecOperands
      rowHues={state.signed.map((_, item) => itemHue(item))} label="Actual CSR coordinate encoding before baseline corrections" headers={['Item','Input value','Physically stored','Target','Effective confidence','Correction multiplier']}
      rows={state.signed.map((value,item)=>[`I${item}`,value,value===0?'absent':'stored',value===0?'baseline 0':Number(value>0),value===0?1:Math.abs(value),value===0?0:Math.abs(value)-1])} />
    <RecMatrix
      columnHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} rowHues={Array.from({ length: state.dimension }, (_, k) => itemHue(k))} label="All-item baseline Gram before signed stored corrections" rows={result.gram} columns={coordinates(state.dimension)} rowNames={coordinates(state.dimension)} />
    <OuterMatrices label="Stored signed (|c|−1) outer correction" terms={result.corrections} dimension={state.dimension} kind="outer" />
    <RecOperands
      rowHues={result.corrections.map(term => itemHue(term.item))} label="Only positive stored coordinates feed b" headers={['Item','Target','|confidence|','Right-side vector']}
      rows={result.corrections.map(term=>[`I${term.item}`,term.target,term.confidence,term.right.map(n).join(', ')])} />
    <Wire down /><SolveCircuit assembly={result} label="Declared package alpha 1 block" />
    <RecOperands label="Separate q=1/λ=1 zero-storage fault: scores both 0, curvature differs" headers={['Encoding','A','b','p']}
      rows={[["Absent numeric zero",absent.A[0][0],absent.b[0],absent.p[0]],['Incorrect physically stored zero',fault.A[0][0],fault.b[0],fault.p[0]]]} />
  </RecFigure>;
}
