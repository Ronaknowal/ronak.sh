import React, { useState } from 'react';
import { Figure, Controls, Numeric, Select, Readout, Panels, Matrix, Plane, Trace, ProbabilityGrid, C, vector, number, samplePoints, instantIds, useIca, Key } from './IcaDrawingElements.jsx';
import { SOURCE, ORDER, IDS, WHITE, MIXING, K, Q, SQRT2, multiply, scale, add, crossWeight, probability, rotated, direction, dot } from './ica-models.mjs';

function SourceTraces() {
  const { instant, amplitude } = useIca();
  const rows = ORDER.map((index,i) => i === instant ? [amplitude,SOURCE[index][1]] : SOURCE[index]);
  const channels = rows.map(row => multiply(MIXING,row));
  return <Figure id="D01" equivalent={`At illustrated instant ${instant} (${instantIds[instant]}), the edited source pair ${vector(rows[instant])} gives channels ${vector(channels[instant])}. Only this illustrative trace changes; the later exact probability law stays fixed.`}>
    <div className="ica-aligned-traces">
      <Trace label="source 1" values={rows.map(row=>row[0])} color={C.source1} selected={instant} ids={instantIds} domain={[-5,5]}/>
      <Trace label="source 2" values={rows.map(row=>row[1])} color={C.source2} selected={instant} ids={instantIds} domain={[-5,5]}/>
      <Trace label="channel 1 = 2 source 1 + source 2" values={channels.map(row=>row[0])} selected={instant} ids={instantIds} domain={[-5,5]}/>
      <Trace label="channel 2 = source 1 + 2 source 2" values={channels.map(row=>row[1])} selected={instant} ids={instantIds} domain={[-5,5]}/>
    </div>
  </Figure>;
}
function WeightedBranches() {
  const { instant, amplitude, setAmplitude, chooseInstant, resetMix } = useIca();
  const s2 = SOURCE[ORDER[instant]][1];
  const pieces = [[2*amplitude,s2],[amplitude,2*s2]];
  const sums = pieces.map(row=>row[0]+row[1]);
  return <Figure id="D02" equivalent={`Source 1 amplitude ${number(amplitude)} and source 2 amplitude ${s2} feed signed weighted branches. Channel 1 adds ${number(pieces[0][0])} and ${pieces[0][1]}; channel 2 adds ${number(pieces[1][0])} and ${pieces[1][1]}.`}>
    <Panels>{pieces.map((pair,i)=><div key={i}><p>channel {i+1}: signed contributions</p><svg viewBox="0 0 328 260" role="img" aria-label={`Channel ${i+1}: ${number(pair[0])} plus ${pair[1]} equals ${number(sums[i])}`}>
      <text x="16" y="25" fill={C.source1}>s₁ = {number(amplitude)}</text><text x="16" y="65" fill={C.source2}>s₂ = {s2}</text>
      <path d="M120,22 L192,102 M120,62 L192,102" fill="none" stroke={C.dim}/><circle cx="192" cy="102" r="12" fill="none" stroke={C.neutral}/><text x="192" y="107" textAnchor="middle">+</text>
      <text x="145" y="27" fill={C.source1}>× {i===0?2:1}</text><text x="145" y="66" fill={C.source2}>× {i===0?1:2}</text>
      <line x1="32" x2="296" y1="163" y2="163" stroke={C.dim}/>
      {[-5,0,5].map(v=><text key={v} x={164+v*24} y="187" textAnchor="middle">{v}</text>)}
      <line x1="164" x2={164+pair[0]*24} y1="139" y2="139" stroke={C.source1} strokeWidth="4"/>
      <circle cx={164+pair[0]*24} cy="139" r="4" fill={C.source1}/>
      <line x1={164+pair[0]*24} x2={164+sums[i]*24} y1="163" y2="163" stroke={C.source2} strokeWidth="4"/>
      <circle cx={164+sums[i]*24} cy="163" r="5" fill={C.focus}/>
      <text x="16" y="220">{number(pair[0])} + ({pair[1]}) = {number(sums[i])}</text>
      <text x="16" y="246">same amplitude scale: −5 to 5</text>
    </svg></div>)}</Panels>
    <Controls id="L1" reset={resetMix}><Select label="Illustrative instant" value={instant} onChange={v=>chooseInstant(Number(v))} options={instantIds.map((id,i)=>[i,`${i}: sample ${id}`])}/><Numeric label="Source 1 amplitude" value={amplitude} onChange={setAmplitude} min={-2} max={2}/></Controls>
    <Readout>At {instantIds[instant]}, sources {vector([amplitude,s2])} give channels <strong>{vector(sums)}</strong>. A zero amplitude has an actual zero contribution.</Readout>
  </Figure>;
}
function RowMixing() {
  return <Figure id="D03" equivalent="Source row C (1, −1) multiplies A transposed to give (1, −1). Each colored source column contributes to both channel cells. The nonsymmetric witness gives (−1, −3), exposing the transpose.">
    <Panels><Matrix name="S: four sample rows × two source columns" rows={SOURCE} headers={['s₁','s₂']} rowLabels={IDS} colors={[C.source1,C.source2]} selectedRow={2}/>
      <Matrix name="A: channel rows × source columns" rows={MIXING} headers={['source 1 column','source 2 column']} rowLabels={['channel 1','channel 2']} colors={[C.source1,C.source2]}/>
      <Matrix name="X = S Aᵀ: four rows × two channels" rows={SOURCE.map(row=>multiply(MIXING,row))} headers={['x₁','x₂']} rowLabels={IDS} selectedRow={2}/></Panels>
    <svg className="ica-product" viewBox="0 0 328 124" role="img" aria-label="Row C: source 1 contributes (2,1); source 2 contributes (−1,−2); add to channel row (1,−1)."><path d="M30,25 L150,50 M30,95 L150,70 M165,60 L290,60" stroke={C.dim} fill="none"/><text x="14" y="20" fill={C.source1}>1 × (2,1)</text><text x="14" y="116" fill={C.source2}>−1 × (1,2)</text><text x="150" y="65">+</text><text x="230" y="50">(1,−1)</text></svg>
    <p className="ica-exact">Row storage: (4×2) · Aᵀ (2×2) → X (4×2). Nonsymmetric A = [[2,3],[1,4]], source (1,−1): correct (−1,−3); S A gives (1,−1).</p>
  </Figure>;
}
function InverseRulers() {
  const u1 = [2/Math.sqrt(5),-1/Math.sqrt(5)], u2 = [-1/Math.sqrt(5),2/Math.sqrt(5)];
  const point=[1,-1];
  return <Figure id="D04" equivalent="At channel point C (1,−1), unit ruler readings are ±3/√5. Multiplying by gain √5/3 gives sources 1 and −1. This inverse is supplied and known; blind A and S remain unknown.">
    <Panels><Plane label="channel plane x₁, x₂; calibrated signed rulers" domain={[-2,2]} points={[{id:'C',value:point}]} vectors={[{end:u1,color:C.source1,label:'unit ruler (2,−1)/√5'},{end:u2,color:C.source2,label:'unit ruler (−1,2)/√5'},{end:scale(u1,dot(u1,point)),color:C.source1,dashed:true,label:'projection: reading 3/√5'},{end:scale(u2,dot(u2,point)),color:C.source2,dashed:true,label:'projection: reading −3/√5'}]}/>
      <Plane label="known inverse → source plane s₁, s₂" domain={[-2,2]} points={[{id:'C',value:point}]} vectors={[{end:[1,0],color:C.source1,label:'source 1 reading'},{end:[0,-1],color:C.source2,label:'source 2 reading'}]}/></Panels>
    <Matrix name="B = A⁻¹: unit direction plus gain, not unit rows" rows={[[2/3,-1/3],[-1/3,2/3]]} headers={['x₁ coefficient','x₂ coefficient']} rowLabels={['source 1 ruler','source 2 ruler']}/>
  </Figure>;
}
function Compensation() {
  const originals = ORDER.map(i=>SOURCE[i]);
  const edited = originals.map(([a,b])=>[-2*a,b]);
  const swapped = edited.map(([a,b])=>[b,a]);
  return <Figure id="D05" equivalent="Scaling source 1 by −2 and dividing its column by −2 preserves every channel row; swapping score/column pairs preserves it again. At C, contributions (2,1)+(−1,−2) still give (1,−1).">
    <Panels>{[[originals,[[2,1],[1,2]],'original'],[edited,[[-1,1],[-.5,2]],'scale source 1 by −2; divide column by −2'],[swapped,[[1,-1],[2,-.5]],'swap both score/column pairs']].map(([rows,a,label])=><div key={label}><p>{label}</p><Trace label="first displayed source coordinate" values={rows.map(row=>row[0])} color={label==='swap both score/column pairs'?C.source2:C.source1} ids={instantIds} domain={[-3,3]}/><Trace label="second displayed source coordinate" values={rows.map(row=>row[1])} color={label==='swap both score/column pairs'?C.source1:C.source2} ids={instantIds} domain={[-3,3]}/><Matrix name="corresponding columns of A" rows={a} headers={['first score','second score']}/><Trace label="channel 1 unchanged" values={rows.map(row=>multiply(a,row)[0])} ids={instantIds} domain={[-3,3]}/><Trace label="channel 2 unchanged" values={rows.map(row=>multiply(a,row)[1])} ids={instantIds} domain={[-3,3]}/></div>)}</Panels>
  </Figure>;
}
function Conditioning() {
  const [a,setA]=useState(1), model=crossWeight(a);
  return <Figure id="D06" equivalent={`A(${number(a)}) has columns (2,${number(a)}) and (${number(a)},2). Determinant ${number(model.determinant)}, contrast gain ${number(model.gain)}. ${a===2?'The columns coincide; contrast is nonunique and an inverse is unavailable.':`Condition number ${number(model.condition)}.`}`}>
    <Panels><Plane label="channel x₁,x₂; merging source columns" domain={[-4.5,4.5]} points={samplePoints(model.rows)} vectors={[{end:[2,a],color:C.source1,label:'source 1 column a₁'},{end:[a,2],color:C.source2,label:'source 2 column a₂'},{end:model.nullContrast,color:C.residual,label:'image of source contrast (1,−1)'}]}/>
      <div><Trace label="orthogonal sum/contrast stretch" yLabel="singular value" xLabel="orthogonal source direction" values={[2+a,2-a]} ids={['sum','contrast']} domain={[0,4]} stems/><Matrix name="singular-value diagnostics" headers={['value']} rows={[[model.determinant],[model.condition],[model.gain]]} rowLabels={['det A','condition (a<2)','contrast gain']}/><p>{a===2?'Nonunique source contrast: no inverse.':'The full channel plane keeps one common scale; the gain ruler exposes the small denominator.'}</p></div></Panels>
    <Controls id="L2" reset={()=>setA(1)}><Numeric label="Symmetric cross-weight a" min={0} max={2} value={a} onChange={setA}/></Controls>
    <Readout>{a===2?'Both columns coincide and the contrast maps to zero.':<>Contrast gain <strong>{number(model.gain)}</strong>; condition <strong>{number(model.condition)}</strong>. At 1.99, a .01 contrast error becomes magnitude 1 after inversion.</>}</Readout>
  </Figure>;
}
function CoinLaw() {
  return <Figure id="D07" equivalent="Each of four independent fair-coin paths has probability .5 × .5 = .25; all four joint cells equal their row/column marginal product."><Panels>
    <svg viewBox="0 0 328 274" role="img" aria-label="Fair coin tree, two .5 branches at each level, four .25 leaves."><circle cx="30" cy="137" r="5" fill={C.neutral}/>{[70,204].map((y,i)=><g key={i}><line x1="35" y1="137" x2="140" y2={y} stroke={C.source1}/><text x="65" y={i===0?95:185}>½</text><text x="125" y={y-12}>{i===0?'U=H':'U=T'}</text>{[-35,35].map((d,j)=><g key={j}><line x1="145" y1={y} x2="260" y2={y+d} stroke={C.source2}/><text x="184" y={y+d/2-5}>½</text><circle cx="260" cy={y+d} r="5" fill={C.neutral}/><text x="269" y={y+d+5}>¼</text><text x="216" y={y+d+(j===0?-14:24)}>{j===0?'V=H':'V=T'}</text></g>)}</g>)}</svg>
    <ProbabilityGrid label="joint law = marginal product" rows={[[.25,.25],[.25,.25]]} rowLabels={['U=H','U=T']} columnLabels={['V=H','V=T']}/></Panels></Figure>;
}
function DependenceLaw() {
  const [q,setQ]=useState(1), model=probability(q);
  return <Figure id="D08" equivalent={`Dependence q=${number(q)} changes the joint law but leaves means (0,2/3) and covariance 0. The central joint cell is ${number(model.joint[1][0])}, versus marginal product 1/9.`}>
    <Panels><ProbabilityGrid label="actual joint law p_q" rows={model.joint} rowLabels={['U=−1','U=0','U=1']} columnLabels={['V=0','V=1']}/><ProbabilityGrid label="product of unchanged marginals" rows={model.product} rowLabels={['U=−1','U=0','U=1']} columnLabels={['V=0','V=1']}/></Panels>
    <Trace label="conditional probability given U=0" yLabel="probability" xLabel="V event" values={model.conditional} ids={['V=0','V=1']} domain={[0,1]} stems/>
    <Controls id="L3" reset={()=>setQ(1)}><Numeric label="Dependent-law weight q" value={q} onChange={setQ} min={0} max={1}/></Controls>
    <Readout>Covariance stays <strong>0</strong>; mutual information is <strong>{number(model.mi,9)} nats</strong>. {q===0?'Every cell now factors.':'The central joint cell differs from its marginal product.'} For the separate zero-row witness [[1,0],[0,0]], the second conditional row is unavailable.</Readout>
  </Figure>;
}
function WhiteEvents() {
  return <Figure id="D09" equivalent="The four white points have covariance I. The two zero events each have probability .5, but their joint probability is 0 rather than .25, so the coordinates are dependent."><Panels>
    <Plane label="white coordinates z₁,z₂; zero-event stripes" domain={[-2,2]} points={samplePoints(WHITE)}>{({x,y})=><><rect x={x(-.05)} y="34" width={x(.05)-x(-.05)} height="240" fill={C.residual} opacity=".4"/><rect x="44" y={y(.05)} width="240" height={y(-.05)-y(.05)} fill={C.residual} opacity=".4"/></>}</Plane>
    <ProbabilityGrid label="zero events: first coordinate × second coordinate" rows={[[0,.5],[.5,0]]} rowLabels={['z₁=0','z₁≠0']} columnLabels={['z₂=0','z₂≠0']}/></Panels>
    <p>Joint zero mass 0; product .5×.5=.25; P(z₂=0 | z₁=0)=0. Covariance I answers a different question.</p>
  </Figure>;
}
function Centering() {
  return <Figure id="D10" equivalent="Training mean (10,−3) shifts the same four sample identities. Query Q (11,−4) subtracts that stored mean, giving (1,−1); it contributes no new fit mean."><Panels>
    <Plane label="raw channels; stored training μ" domain={[-8,16]} points={[...samplePoints(SOURCE.map(row=>add(multiply(MIXING,row),[10,-3]))),{id:'Q',value:[11,-4],color:C.query},{id:'μ',value:[10,-3]}]} vectors={[{start:[10,-3],end:[11,-4],color:C.query,label:'Q − stored μ displacement'}]}/>
    <Plane label="centered channels X_c = X − μ" domain={[-4,4]} points={[...samplePoints(SOURCE.map(row=>multiply(MIXING,row))),{id:'Q',value:[1,-1],color:C.query}]} vectors={[{end:[1,-1],color:C.query,label:'later query (1,−1)'}]}/></Panels><p>Fit once on training rows → store μ → apply the same subtraction to later rows.</p></Figure>;
}
function CovarianceRulers() {
  return <Figure id="D11" equivalent="Covariance [[5,4],[4,5]] has standard-deviation radii 3 and 1 on the diagonal unit rulers. The ellipse summarizes second moments; the actual support is four discrete points."><Panels>
    <Plane label="channel covariance ellipse and support" domain={[-4,4]} points={samplePoints(SOURCE.map(row=>multiply(MIXING,row)))} ellipse={{radii:[3,1],angle:45}} vectors={[{end:[3/SQRT2,3/SQRT2],color:C.source1,label:'v₊ radius 3; eigenvalue 9'},{end:[-3/SQRT2,-3/SQRT2],color:C.source1},{end:[1/SQRT2,-1/SQRT2],color:C.source2,label:'v₋ radius 1; eigenvalue 1'},{end:[-1/SQRT2,1/SQRT2],color:C.source2}]}/>
    <Matrix name="C = X_cᵀX_c / 4; eigen-ruler readings" rows={[[5,4],[4,5]]} headers={['x₁','x₂']} rowLabels={['x₁','x₂']}/></Panels></Figure>;
}
function Whitening() {
  const channel=SOURCE.map(row=>multiply(MIXING,row));
  return <Figure id="D12" equivalent="Project onto v₊,v₋ and divide readings by 3,1. Same sample identities become A(−√2,0), B(0,−√2), C(0,√2), D(√2,0); population covariance is I."><Panels>
    <Plane label="centered channels x₁,x₂" domain={[-4,4]} points={samplePoints(channel)} vectors={[{end:[3/SQRT2,3/SQRT2],color:C.source1,label:'v₊ reading / 3'},{end:[1/SQRT2,-1/SQRT2],color:C.source2,label:'v₋ reading / 1'}]}/>
    <Matrix name="projection → division; constructed amplitudes" rows={channel.map(row=>[dot(row,[1/SQRT2,1/SQRT2]),dot(row,[1/SQRT2,-1/SQRT2]),...multiply(K,row)])} rowLabels={IDS} headers={['v₊ reading','v₋ reading','z₁ = /3','z₂ = /1']}/>
    <Plane label="population-white z₁,z₂" domain={[-2,2]} points={samplePoints(WHITE)} circles={[1]}/></Panels><Matrix name="E[zzᵀ]" rows={[[1,0],[0,1]]} headers={['z₁','z₂']}/></Figure>;
}
function Denominators() {
  return <Figure id="D13" equivalent="The same squared sums 36,4 divided by training n−1=3 give 12,4/3; divided by n=4 give 9,1. Multiplying sample-white readings by √(4/3) changes population variance .75 to 1."><Panels>
    <Trace label="covariance eigenvalues; same squared sums" yLabel="variance" xLabel="denominator and ruler" values={[12,4/3,9,1]} ids={['36/3','4/3','36/4','4/4']} domain={[0,12]} stems/>
    <Trace label="population variance after whitening" yLabel="population variance" xLabel="whitening convention" values={[.75,1]} ids={['sample','population']} domain={[0,1.2]} stems/>
  </Panels><p>Stored training n=4: sample-white × √(4/3) → population-white. Query row count never replaces training n.</p></Figure>;
}
function WhiteFreedom() {
  const [angle,setAngle]=useState(45), rows=rotated(WHITE,angle), w=direction(angle), perpendicular=[-w[1],w[0]];
  return <Figure id="D14" equivalent={`White rulers at ${number(angle)} degrees give the shown four rotated support rows. Their covariance remains I. Exact Q is separately a reflection, determinant −1; arbitrary rotated estimates have no known source identity.`}>
    <Panels><Plane label="fixed white diamond z₁,z₂" domain={[-2,2]} points={samplePoints(WHITE)} vectors={[{end:scale(w,1.7),label:'first white ruler'},{end:scale(perpendicular,1.7),label:'perpendicular white ruler'}]}/><Plane label="rotated readings C1,C2; neutral until calibrated" domain={[-2,2]} points={samplePoints(rows)}/></Panels>
    <Controls id="L4" reset={()=>setAngle(45)}><Numeric label="White-frame ruler angle (degrees)" min={0} max={90} value={angle} onChange={setAngle}/></Controls>
    <Readout>Covariance remains <strong>I</strong> at {number(angle)}°. {angle===45?'These lines separate the four-state sources up to signs/order.':'Changing rulers alone does not establish an identified source frame.'}</Readout>
    <Panels><Matrix name="Q = reflection; determinant −1" rows={Q} headers={['z₁','z₂']} rowLabels={['s₁','s₂']} colors={[C.source1,C.source2]}/><Plane label="exact Q maps white diamond to source square" domain={[-2,2]} points={samplePoints(WHITE.map(row=>multiply(Q,row)))}/></Panels>
  </Figure>;
}
export function RankPlane({ id='D15', query=[1,-1,1], restoration=false }) {
  const project=([a,b,c])=>[a+.4*c,b+.6*c];
  const retained=[query[0],query[1],0];
  return <Figure id={id} equivalent={`Oblique drawing of the three-channel plane x₃=0. Query ${vector(query)} projects to ${vector(retained)}, residual (0,0,${query[2]}). Screen lengths are not three-dimensional distances. ${restoration?'Restoring this residual is a separate reconstruction policy.':'Rank is 2; three-direction whitening is refused.'}`}>
    <Panels><Plane label="oblique 3D view; screen length is not 3D distance" domain={[-3,5]} points={[{id:'Q',value:project(query),color:C.query},{id:'projection',value:project(retained)}]} vectors={[{end:[3,0],label:'channel x₁ axis'},{end:[0,3],label:'channel x₂ axis'},{end:project([0,0,3]),color:C.dim,label:'channel x₃ axis'},{start:project(retained),end:project(query),color:C.residual,label:'omitted residual'}]}>{({x,y})=><polygon points={[[-2,-2],[2,-2],[2,2],[-2,2]].map(([a,b])=>`${x(a)},${y(b)}`).join(' ')} fill="none" stroke={C.dim} strokeDasharray="4 3"/>}</Plane>
    <Plane label="retained plane: true equal-scale x₁,x₂" domain={[-3,3]} points={[...samplePoints(SOURCE),{id:'Q',value:query.slice(0,2),color:C.query}]}/></Panels>
    <Matrix name={restoration?'two declared inverse policies':'positive-rank support'} headers={['channel 1','channel 2','channel 3']} rows={restoration?[retained,[0,0,query[2]],query]:[[1,0,0],[0,1,0],[0,0,0]]} rowLabels={restoration?['retained inverse','omitted residual','restore residual']:['positive direction','positive direction','zero variance: refuse']}/>
  </Figure>;
}
const drawings={D01:SourceTraces,D02:WeightedBranches,D03:RowMixing,D04:InverseRulers,D05:Compensation,D06:Conditioning,D07:CoinLaw,D08:DependenceLaw,D09:WhiteEvents,D10:Centering,D11:CovarianceRulers,D12:Whitening,D13:Denominators,D14:WhiteFreedom,D15:RankPlane};
export default function IcaFoundations({id}) { const Drawing=drawings[id]; return <Drawing/>; }
