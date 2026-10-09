import React, { useState } from 'react';
import { Figure, Controls, Numeric, Select, Readout, Panels, Matrix, Plane, Curve, Atoms, Trace, C, vector, number, samplePoints, useIca } from './IcaDrawingElements.jsx';
import { SOURCE, WHITE, SQRT2, Q, K, direction, scale, dot, subtract, add, projection, cubicStep, deflate, ambiguity, multiply } from './ica-models.mjs';

const degrees = Array.from({length:91},(_,i)=>i);
function BinaryProjection() {
  const [angle,setAngle]=useState(0), model=projection(angle);
  const projected = SOURCE.map(row=>scale(model.w,dot(row,model.w)));
  return <Figure id="D16" equivalent={`Source-frame unit direction at ${number(angle)}° gives projected atoms ${model.atoms.map(atom=>`${number(atom.value)} mass ${number(atom.mass)}`).join('; ')}. Variance stays 1; binary excess kurtosis ${number(model.kurtosis)}.`}>
    <Panels><Plane label="source square s₁,s₂; perpendicular projection to w" domain={[-2,2]} points={samplePoints(SOURCE)} vectors={[{end:model.w,label:'unit source-frame direction w'}]}>{({x,y})=>SOURCE.map((row,i)=><line key={i} x1={x(row[0])} y1={y(row[1])} x2={x(projected[i][0])} y2={y(projected[i][1])} stroke={C.dim} strokeDasharray="3 3"/>)}</Plane>
      <Atoms label="actual projected finite probability law" atoms={model.atoms}/>
      <Curve label="source-frame angle (degrees) → binary excess kurtosis" values={degrees.map(a=>[a,projection(a).kurtosis])} xDomain={[0,90]} yDomain={[-2.1,-.9]} color={C.residual} selected={[angle,model.kurtosis]}/></Panels>
    <Controls id="L5" reset={()=>setAngle(0)}><Numeric label="Source-frame angle (degrees)" value={angle} onChange={setAngle} min={0} max={90}/></Controls>
    <Readout>Variance <strong>1</strong>, kurtosis <strong>{number(model.kurtosis)}</strong>. {angle===45?'The two central readings coincide: their masses add to .5.':'Source-axis endpoints have kurtosis −2; mixtures move toward −1.'} Largest signed kurtosis would prefer the wrong binary mixture.</Readout>
  </Figure>;
}
function LaplaceShape() {
  const density=Array.from({length:121},(_,i)=>{const x=-4+i/15;return [x,Math.exp(-SQRT2*Math.abs(x))/SQRT2];});
  return <Figure id="D17" equivalent="Analytic unit-variance Laplace density has sharp center and exponential tails. Projection kurtosis is 3 on source axes, 1.5 at 45°, and 1.875 at 30°. This is density, distinct from binary atom mass."><Panels>
    <Curve label="source amplitude s → Laplace density p(s)" values={density} xDomain={[-4,4]} yDomain={[0,.8]} color={C.source1}/>
    <Curve label="source-frame degrees → analytic Laplace excess kurtosis" values={degrees.map(a=>[a,-1.5*projection(a).kurtosis])} xDomain={[0,90]} yDomain={[1.4,3.1]} color={C.source2} selected={[30,1.875]}/></Panels><p>p(s)=exp(−√2 |s|)/√2; variance 1. The angle curve describes fourth moments, not an invented projected density or sampled histogram.</p></Figure>;
}
function ZeroKurtosis() {
  const a=Math.sqrt(3);
  return <Figure id="D18" equivalent="A three-point law at −√3,0,√3 with masses 1/6,2/3,1/6 has second moment 1, fourth moment 3, excess kurtosis 0 and sixth moment 9. A unit Gaussian's sixth moment is 15."><Panels>
    <Atoms label="three discrete source atoms" atoms={[{value:-a,mass:1/6},{value:0,mass:2/3},{value:a,mass:1/6}]}/>
    <Matrix name="weighted even powers; not a Gaussian law" headers={['E[y²] piece','E[y⁴] piece','E[y⁶] piece']} rows={[[.5,1.5,4.5],[0,0,0],[.5,1.5,4.5],[1,3,9],[1,3,15]]} rowLabels={['−√3 at 1/6','0 at 2/3','√3 at 1/6','three-point total','Gaussian total']}/></Panels></Figure>;
}
function GaussianRotation() {
  const [angle,setAngle]=useState(30), w=direction(angle);
  return <Figure id="D19" equivalent={`Analytic circular Gaussian density is unchanged at ${number(angle)}°. Rulers rotate, but the instantaneous distribution gives no preferred source frame. Each scalar variance is 1 and excess kurtosis 0.`}>
    <Panels><Plane label="standard Gaussian joint-density contours" domain={[-3,3]} circles={[.5,1,1.5,2,2.5]} vectors={[{end:scale(w,2.6),label:'first white ruler'},{end:scale([-w[1],w[0]],2.6),label:'perpendicular white ruler'}]}/>
      <Curve label="either projected value → Gaussian density" values={Array.from({length:121},(_,i)=>{const x=-3+i/20;return [x,Math.exp(-x*x/2)/Math.sqrt(2*Math.PI)];})} xDomain={[-3,3]} yDomain={[0,.45]}/></Panels>
    <Controls id="L6" reset={()=>setAngle(30)}><Numeric label="Gaussian ruler angle (degrees)" min={0} max={90} value={angle} onChange={setAngle}/></Controls>
    <Readout>The rulers move to <strong>{number(angle)}°</strong>; joint density, variance 1 and kurtosis 0 stay unchanged. Source axes remain <strong>unresolved from this instantaneous distribution</strong>.</Readout>
  </Figure>;
}
function currentCalculation(state) { return state.steps.at(-1)?.calculation || cubicStep(direction(state.initial)); }
function CubicRows() {
  const state=useIca(), model=currentCalculation(state);
  const w=state.steps.at(-1)?.before || direction(state.initial);
  return <Figure id="D20" equivalent={`Each white row projects onto ${vector(w)}, is cubed and multiplied by its own white vector. Averaging those four contributions gives ${vector(model.average)}.`}>
    <Panels><Plane label="white coordinates and current cubic projection ruler" domain={[-2,2]} points={samplePoints(WHITE)} vectors={[{end:w,label:'unit w used for displayed step'},{end:model.average,color:C.residual,label:'average E[z y³]'}]}/>
      <Matrix name="four equally weighted rows; displayed to 6 decimals" headers={['z','y=z·w','y³','z y³']} rowLabels={['A','B','C','D']} rows={model.rows.map(row=>[vector(row.z),number(row.y,6),number(row.cube,6),vector(row.contribution)])}/></Panels>
  </Figure>;
}
function CubicUpdate() {
  const state=useIca(), model=currentCalculation(state);
  const [reason,setReason]=useState('');
  const before=state.steps.at(-1)?.before || direction(state.initial);
  const current=state.steps.at(-1)?.calculation.aligned || before;
  const finished=state.steps.length>=20 || (state.steps.length>0 && state.steps.at(-1).calculation.movement<1e-8);
  const step=()=>{
    if(finished) return;
    const calculation=cubicStep(current);
    if(!calculation.aligned) {setReason('Zero or unresolved update: the previous line and history remain.');return;}
    state.setSteps(previous=>[...previous,{before:current,calculation}]);
    setReason(calculation.movement<1e-8?'Small line movement: stationary, with no identification guarantee.':'');
  };
  const reset=()=>{state.changeInitial(Math.atan2(.6,.8)*180/Math.PI);setReason('');};
  return <Figure id="D21" equivalent={`The displayed update subtracts ${vector(model.correction)} from ${vector(model.average)}, yielding raw ${vector(model.raw)}. Normalized raw ${vector(model.normalized || [0,0])}; sign-equivalent line ${vector(model.aligned || [0,0])}.`}>
    <Panels><Plane label="actual subtraction in white-coordinate units" domain={[-3,3]} vectors={[{end:model.average,color:C.source1,label:'E[z y³]'},{end:model.correction,color:C.source2,label:'E[g′] w'},{start:model.correction,end:model.average,color:C.residual,label:'translated subtraction r'},{end:model.raw,color:C.residual,label:'raw r from origin'}]}/>
      <Plane label="unit-circle view; separate declared normalization" domain={[-1.3,1.3]} circles={[1]} vectors={[{end:before,label:'old unit direction'},{end:model.normalized || [0,0],color:C.residual,label:'raw normalized direction'},{end:model.aligned || [0,0],color:C.source1,label:'sign-aligned same line'}]}/></Panels>
    <Controls id="L7" reset={reset}><Numeric label="Initial white angle (degrees); edit clears history" value={state.initial} onChange={v=>{state.changeInitial(v);setReason('');}} min={0} max={90}/><button type="button" onClick={step} disabled={finished}>Step</button></Controls>
    <Readout>{state.steps.length===0?'Ready: the first update is already visible.':`${state.steps.length} actual step(s) retained.`} Raw <strong>{vector(model.raw)}</strong>; line movement <strong>{number(model.movement,9)}</strong>. {reason || (finished?'The finite trace has stopped; its budget or stationarity does not identify a source.':'Step follows the current line without unlocking an answer.')}</Readout>
    {state.steps.length>0 && <Matrix name="actual bounded trace history" headers={['raw r','aligned unit line','movement']} rows={state.steps.map(item=>[vector(item.calculation.raw),vector(item.calculation.aligned),number(item.calculation.movement,9)])}/>}
  </Figure>;
}
function ZeroAndLine() {
  return <Figure id="D22" equivalent="For linear g(y)=y, both vector terms equal w; their difference is zero and cannot be normalized. A sign flip from w to −w moves a vector by 2 but moves its projection line by 0."><Panels>
    <Plane label="linear contrast: coincident terms, zero remainder" domain={[-1.3,1.3]} vectors={[{end:[.8,.6],color:C.source1,label:'E[z y] = w',width:5},{end:[.8,.6],color:C.source2,label:'E[g′]w = w',dashed:true},{end:[0,0],color:C.residual,label:'r=0; normalization unavailable'}]}/>
    <Plane label="opposite vectors represent one projection line" domain={[-1.3,1.3]} circles={[1]} vectors={[{end:[.8,.6],label:'w'},{end:[-.8,-.6],color:C.residual,label:'−w'}]}/></Panels><p>|(−w)ᵀw|=1 → line movement 0; vector distance 2. A white axis is also cubic-stationary: mixture kurtosis −1, versus −2 on separating white diagonals.</p></Figure>;
}
function DeflationTriangle() {
  const [angle,setAngle]=useState(0), [parallel,setParallel]=useState(false), [last,setLast]=useState([.8,-.6]);
  const model=deflate(angle,parallel);
  const change=(value,exact=false)=>{setAngle(value);setParallel(exact);const next=deflate(value,exact);if(next.normalized)setLast(next.normalized);};
  return <Figure id="D23" equivalent={`Retained p=(.6,.8), candidate ${vector(model.candidate)}, overlap ${vector(model.overlap)}, residual ${vector(model.residual)}, norm ${number(model.length)}. ${model.normalized?`Normalized residual ${vector(model.normalized)}.`:'Normalization refused; previous valid row stays separate.'}`}>
    <Panels><Plane label="deflation: p retained, candidate minus overlap" domain={[-1.3,1.3]} vectors={[{end:model.p,color:C.source1,label:'retained row p'},{end:model.candidate,label:'candidate r'},{end:model.overlap,color:C.source2,label:'projection onto p'},{start:model.overlap,end:model.candidate,color:C.residual,label:'orthogonal residual'}]}>{({x,y})=>{const start=model.overlap, v=model.residual, n=Math.hypot(...v);if(n<1e-12)return null;const d=scale(v,.12/n),e=scale(model.p,.12);return <path d={`M${x(start[0]+d[0])},${y(start[1]+d[1])} L${x(start[0]+d[0]+e[0])},${y(start[1]+d[1]+e[1])} L${x(start[0]+e[0])},${y(start[1]+e[1])}`} stroke={C.neutral} fill="none"/>;}}</Plane>
      <Plane label={model.normalized?'normalized candidate row':'previous usable row; failed candidate has no unit arrow'} domain={[-1.3,1.3]} circles={[1]} vectors={[{end:model.p,color:C.source1,label:'fixed retained p'},{end:model.normalized || last,color:C.neutral,label:model.normalized?'new normalized row':'previous valid normalized row'}]}/></Panels>
    <Controls id="L8" reset={()=>{setAngle(0);setParallel(false);setLast([.8,-.6]);}}><Numeric label="Candidate angle (degrees)" value={angle} onChange={v=>change(v)} min={0} max={180}/><Select label="Angle control detent" value={parallel?'parallel':'edited'} onChange={v=>{if(v==='parallel')change(Math.atan2(.8,.6)*180/Math.PI,true);else change(0);}} options={ [['edited','numeric angle'],['parallel','Parallel to (.6,.8): exact detent']]}/></Controls>
    <Readout>Residual norm <strong>{number(model.length,9)}</strong>. {model.normalized?`New orthogonal unit row ${vector(model.normalized)}.`:`Exact or unresolved parallel candidate: normalization refused. Retained previous row ${vector(last)}.`}</Readout>
  </Figure>;
}
function PolarRows() {
  const output=[[2/Math.sqrt(5),-1/Math.sqrt(5)],[1/Math.sqrt(5),2/Math.sqrt(5)]];
  return <Figure id="D24" equivalent="Polar normalization changes both rows (1,0),(1,1) together to (2,−1)/√5,(1,2)/√5. The Gram spectrum is positive; duplicate rows instead have a zero eigenvalue and refuse an inverse square root."><Panels>
    <Plane label="original overlapping white-space rows" domain={[-1.5,1.5]} vectors={[{end:[1,0],color:C.source1,label:'row 1'},{end:[1,1],color:C.source2,label:'row 2'}]}/>
    <Plane label="symmetric polar factor: both rows change" domain={[-1.5,1.5]} circles={[1]} vectors={output.map((row,i)=>({end:row,color:i===0?C.source1:C.source2,label:`row ${i+1}`}))}/></Panels>
    <Panels><Matrix name="W Wᵀ; eigenvalues (3±√5)/2" rows={[[1,1],[1,2]]} headers={['row 1','row 2']}/><Matrix name="(W Wᵀ)⁻¹/² = [[3,−1],[−1,2]]/√5" rows={[[3/Math.sqrt(5),-1/Math.sqrt(5)],[-1/Math.sqrt(5),2/Math.sqrt(5)]]} headers={['first','second']}/><Matrix name="normalized row Gram = I" rows={[[1,0],[0,1]]} headers={['row 1','row 2']}/></Panels>
    <Plane label="duplicate rows: true coincidence; spectrum 2,0 → refuse" domain={[-1.5,1.5]} vectors={[{end:[1,0],color:C.source1,label:'duplicate row 1',width:5},{end:[1,0],color:C.source2,label:'duplicate row 2',dashed:true}]}/>
  </Figure>;
}
function OperatorBundle() {
  return <Figure id="D25" equivalent="Query (11,−4) subtracts stored μ=(10,−3); K gives (0,√2), Q gives (1,−1). A decodes, and one mean addition restores the query. Failed candidates leave this complete previous bundle intact."><Panels>
    <Plane label="centered query → population whitening" domain={[-2,2]} points={[{id:'Q',value:[1,-1],color:C.query}]} vectors={K.map((row,i)=>({end:row,color:i===0?C.source1:C.source2,label:`K row ${i+1}`}))}/>
    <Plane label="white query → W=Q → source query" domain={[-2,2]} points={[{id:'Q',value:[0,SQRT2],color:C.query}]} vectors={[{end:Q[0],color:C.source1,label:'W row 1'},{end:Q[1],color:C.source2,label:'W row 2'}]}/>
    <Plane label="source scores × decoder columns → centered query" domain={[-3,3]} points={[{id:'Q',value:[1,-1],color:C.query}]} vectors={[{end:[2,1],color:C.source1,label:'1 × column 1'},{start:[2,1],end:[1,-1],color:C.source2,label:'−1 × column 2'}]}/></Panels>
    <Matrix name="intact fitted operator bundle; mean enters once each way" headers={['shape','action']} rows={[["d=2","stored training mean (10,−3)"],["k×d=2×2","K maps centered channel → white"],["k×k=2×2","W maps white → source"],["k×d=2×2","B=WK maps centered channel → source"],["d×k=2×2","decoder maps source → retained channels"]]} rowLabels={['μ','K','W','B','decoder']}/>
    <p>Separate failed candidate: one-step budget exhausted → no usable new bundle. Previous μ/K/W/B/decoder and history remain intact.</p>
  </Figure>;
}
function ApiAnatomy() {
  return <Figure id="D26" equivalent="Direct FastICA components_ acts on centered raw channels, mixing_ decodes them and mean_ is stored. With external whitening, components_ is W on white coordinates; compose W K and the external decoder, and store the external mean."><Panels>
    <Plane label="direct route; raw-channel components_ rulers" domain={[-1.5,1.5]} vectors={[{end:[.11057152,.47755436],label:'components_ row C1'},{end:[.92323385,-.232592],label:'components_ row C2'}]}/>
    <Plane label="direct mixing_ columns spread component scores" domain={[-2.2,2.2]} vectors={[{end:[.49846939,1.97858833],label:'mixing_ column C1'},{end:[1.02344978,-.23696653],label:'mixing_ column C2'}]}/>
    <Plane label="external route; components_ acts on white coordinates" domain={[-1.3,1.3]} vectors={[{end:[.99990895,-.01349418],label:'external white row C1'},{end:[.01349418,.99990895],label:'external white row C2'}]}/></Panels>
    <Matrix name="API field/action correspondence; retained original successful N6 capture" headers={['direct unit-variance route','externally whitened route']} rows={[["raw channel B","white-space W; raw B=WK"],["raw decoder","white decoder; compose external decoder"],["stored channel mean","absent; external mean required"],["stored internal whitening","absent; external K required"],["True; 2 iterations; []","True; 2 iterations; []"]]} rowLabels={['components_','mixing_','mean_','whitening_','converged / iterations / warnings']}/>
  </Figure>;
}
function Calibration() {
  const [value,setValue]=useState(-1),[swap,setSwap]=useState(false),[last,setLast]=useState({value:-1,swap:false});
  const model=ambiguity(value,swap), retained=ambiguity(last.value,last.swap);
  const change=(v,s)=>{setValue(v);setSwap(s);if(v!==0)setLast({value:v,swap:s});};
  return <Figure id="D27" equivalent={`The fixed assignment witness prefers swapped total 1.65 to diagonal 1.0. A separate exact four-state experiment has scale ${number(value)} and ${swap?'swapped':'original'} pairing. ${model.usable?'Reciprocal decoder columns preserve channels.':'Zero variance makes correlation and reciprocal decoder unavailable; previous usable operator retained.'}`}>
    <Panels><div><Matrix name="fixed signed correlation witness; known source rows × neutral estimate columns" rows={[[.9,.8],[.85,.1]]} headers={['C1','C2']} rowLabels={['source 1','source 2']}/><svg viewBox="0 0 328 160" role="img" aria-label="Two complete matchings; diagonal .9+.1=1; swap .8+.85=1.65."><text x="15" y="30">source 1</text><text x="15" y="130">source 2</text><text x="275" y="30">C1</text><text x="275" y="130">C2</text><path d="M90,26 L260,26 M90,126 L260,126" stroke={C.dim} strokeDasharray="5 4"/><path d="M90,26 L260,126 M90,126 L260,26" stroke={C.residual} strokeWidth="2"/><text x="116" y="153">swap: .8 + .85 = 1.65</text></svg></div>
      <Matrix name="separate synthetic signed calibration correlations" rows={model.correlations} headers={['estimate C1','estimate C2']} rowLabels={['source 1','source 2']}/>
      <Matrix name="separate synthetic score rows; no identity color until alignment" rows={model.scores} headers={['C1','C2']} rowLabels={['A','B','C','D']}/></Panels>
    <Plane label={model.usable?'paired reciprocal decoder columns preserve channels':'retained usable decoder; zero-scale candidate is separate'} domain={[-Math.max(3,...(model.decoder||retained.decoder).flat().map(Math.abs)),Math.max(3,...(model.decoder||retained.decoder).flat().map(Math.abs))]} vectors={(model.decoder||retained.decoder)[0].map((_,j)=>({end:(model.decoder||retained.decoder).map(row=>row[j]),label:`neutral decoder column C${j+1}`}))}/>
    <Controls id="L9" reset={()=>{setValue(-1);setSwap(false);setLast({value:-1,swap:false});}}><Numeric label="Signed first-source scale" min={-2} max={2} value={value} onChange={v=>change(v,swap)}/><button type="button" aria-pressed={swap} onClick={()=>change(value,!swap)}>Swap score/column pairs</button></Controls>
    <Readout>{model.usable?<>The edited scores and paired columns reconstruct <strong>the original channels</strong>. Calibration corrects the declared signs/order.</>:<>Zero-scale candidate loses a coordinate: correlation and reciprocal decoder are <strong>unavailable</strong>. Previous usable scale {number(last.value)}, {last.swap?'swapped':'unswapped'}, is retained.</>} The fixed .9/.8/.85/.1 witness stays unchanged.</Readout>
    <Matrix name="N7 mapping fitted on calibration; apply unchanged on held-out rows" headers={['estimated coordinates','aligned source coordinates']} rows={[["C1=−2s₂+3; C2=.5s₁−4","columns (1,0); scales (2,−.5)"],["held-out known source (2,3)","(2,3)"],["held-out known source (−4,1)","(−4,1)"]]} rowLabels={['calibration contract','later row 1','later row 2']}/>
  </Figure>;
}
function Diagnostics() {
  const state=useIca();
  return <Figure id="D28" equivalent="Actual step-derived line movement, the stationary dependent white-axis projection, and known-truth calibration correlations answer distinct questions. Repeat-run stability is a proposed study with no invented repeated measurements."><Panels>
    <div>{state.steps.length?<Curve label="actual L7 step number → line movement" values={state.steps.map((item,i)=>[i+1,item.calculation.movement])} xDomain={[0,Math.max(2,state.steps.length)]} yDomain={[0,Math.max(.02,...state.steps.map(item=>item.calculation.movement))]}/>:<Plane label="L7 initial line; no steps recorded yet" domain={[-1.3,1.3]} circles={[1]} vectors={[{end:direction(state.initial),label:'current initial white line'}]}/>}<p>Numerical stopping: actual line movement, at most twenty displayed steps.</p></div>
    <Plane label="stationary white-axis mixture; movement 0, kurtosis −1" domain={[-2,2]} points={samplePoints(WHITE)} vectors={[{end:[1,0],label:'white axis'},{end:[-1,0],color:C.residual,label:'raw stationary sign flip'}]}/>
    <Matrix name="separate calibration-known association; fixed witness" rows={[[.9,.8],[.85,.1]]} headers={['estimate C1','estimate C2']} rowLabels={['known source 1','known source 2']}/></Panels><p>Aligned repeat-run stability: proposed seed/window study; no repeat-run distribution was executed. Held-out task association uses a frozen calibration mapping and separately attributed test data.</p></Figure>;
}
const drawings={D16:BinaryProjection,D17:LaplaceShape,D18:ZeroKurtosis,D19:GaussianRotation,D20:CubicRows,D21:CubicUpdate,D22:ZeroAndLine,D23:DeflationTriangle,D24:PolarRows,D25:OperatorBundle,D26:ApiAnatomy,D27:Calibration,D28:Diagnostics};
export default function IcaContrastAndFit({id}) { const Drawing=drawings[id]; return <Drawing/>; }
