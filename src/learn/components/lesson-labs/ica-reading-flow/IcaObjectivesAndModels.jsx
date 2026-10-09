import React, { useState } from 'react';
import { Figure, Controls, Numeric, Readout, Panels, Matrix, Plane, Curve, Trace, ProbabilityGrid, C, number, vector, samplePoints } from './IcaDrawingElements.jsx';
import { SOURCE, WHITE, MIXING, SQRT2, Q, multiply, scale, add, direction, probability, lagModel, delayedImpulse } from './ica-models.mjs';

const range=(start,end,count,fn)=>Array.from({length:count},(_,i)=>{const x=start+(end-start)*i/(count-1);return [x,fn(x)];});
function EntropyObjects() {
  const model=probability(1);
  return <Figure id="D37" equivalent={`The dependent finite law has joint entropy ${number(model.jointEntropy,9)} nats, sum of marginal entropies ${number(model.marginalEntropy,9)}, and mutual information ${number(model.mi,9)}. Continuous differential entropy instead integrates density; these finite cells are not density.`}>
    <Panels><ProbabilityGrid label="whole finite joint object p(U,V)" rows={model.joint} rowLabels={['U=−1','U=0','U=1']} columnLabels={['V=0','V=1']}/>
      <Matrix name="probability-weighted surprise −p log p" headers={['mass','surprise −log p','weighted contribution']} rows={[[1/3,Math.log(3),Math.log(3)/3],[1/3,Math.log(3),Math.log(3)/3],[1/3,Math.log(3),Math.log(3)/3],[0,'limit convention',0]]} rowLabels={['(−1,1)','(0,0)','(1,1)','each zero cell']}/>
      <Curve label="separate continuous Gaussian density p(v); integral for h" values={range(-3,3,121,x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI))} xDomain={[-3,3]} yDomain={[0,.45]}/></Panels>
    <p>Finite H(U,V)={number(model.jointEntropy)}; H(U)+H(V)={number(model.marginalEntropy)}; difference {number(model.mi)} nats. In a continuous white orthogonal frame, finite h and variance are required: joint h stays fixed, Gaussian comparison terms stay fixed, so maximizing summed negentropy minimizes total correlation. Whole-vector dependence requires the whole joint law.</p>
  </Figure>;
}
function AreaMap({label,leftWidth,rightWidth,leftDensity,rightDensity,mapName}) {
  return <div><p>{label}</p><svg viewBox="0 0 328 234" role="img" aria-label={`${label}; left area ${leftWidth}, density ${leftDensity}; right area ${rightWidth}, density ${rightDensity}; each mass one.`}>
    <rect x="20" y="60" width={leftWidth*58} height="58" fill="none" stroke={C.source1}/><rect x="170" y="60" width={rightWidth*58} height="58" fill="none" stroke={C.source2}/>
    {[0,.5,1].map(t=><g key={t}><line x1="20" x2={20+leftWidth*58} y1={60+t*58} y2={60+t*58} stroke={C.dim}/><line x1="170" x2={170+rightWidth*58} y1={60+t*58} y2={60+t*58} stroke={C.dim}/><line x1={20+t*leftWidth*58} x2={20+t*leftWidth*58} y1="60" y2="118" stroke={C.dim}/><line x1={170+t*rightWidth*58} x2={170+t*rightWidth*58} y1="60" y2="118" stroke={C.dim}/></g>)}
    <path d="M130,88 L158,88 L151,83 M158,88 L151,93" fill="none" stroke={C.neutral}/><text x="142" y="48" textAnchor="middle">{mapName}</text>
    <text x="20" y="145">area {leftWidth}</text><text x="170" y="145">area {rightWidth}</text><text x="20" y="173">density {leftDensity}</text><text x="170" y="173">density {rightDensity}</text><text x="20" y="202">mass 1</text><text x="170" y="202">mass 1</text>
  </svg></div>;
}
function Jacobian() {
  const logisticScale=Math.sqrt(3)/Math.PI;
  return <Figure id="D38" equivalent="A_demo from source to observation doubles area 1 to 2, halving density to .5. Separate B_demo from observation to source maps area .5 to 1, so observation density is 2. Every likelihood row includes one log|det B| plus all its source log densities.">
    <Panels><AreaMap label="source → observation" leftWidth={1} rightWidth={2} leftDensity={1} rightDensity={.5} mapName="A_demo"/>
      <AreaMap label="observation → source" leftWidth={.5} rightWidth={1} leftDensity={2} rightDensity={1} mapName="B_demo"/></Panels>
    <Matrix name="chosen logistic likelihood; two supplied observation rows, B=diag(2,1)" headers={['centered x','source y=B x','row log density']} rows={[["(.2,−.3)","(.4,−.3)",-1.09052644],["(1,2)","(2,2)",-5.47613409],["2 rows × log 2","plus all four log f terms",-6.5666605341408495],["negative total / 2","fully averaged objective",3.2833302670704247]]} rowLabels={['row 1','row 2','dataset sum','negative row mean']}/>
    <Panels><Curve label="chosen logistic source value y → cumulative F(y)" values={range(-3,3,121,y=>1/(1+Math.exp(-y/logisticScale)))} xDomain={[-3,3]} yDomain={[0,1]} color={C.source1}/>
      <Curve label="derivative F′(y)=chosen logistic density f(y)" values={range(-3,3,121,y=>{const f=1/(1+Math.exp(-y/logisticScale));return f*(1-f)/logisticScale;})} xDomain={[-3,3]} yDomain={[0,.5]} color={C.source2}/></Panels>
    <p>Infomax transformation: x → Bx=y → coordinatewise F(y)=u. Its Jacobian multiplies |det B| by every f_j(y_j); its log adds the same determinant and density terms. This chosen smooth continuous model differs from the discrete binary law. A rectangular retained B has no square determinant.</p>
  </Figure>;
}
function Curvature() {
  const angle=.5*Math.atan2(2,-1),maximum=(5+Math.sqrt(5))/2,minimum=(5-Math.sqrt(5))/2;
  const contours=[.375,1.5,3].map(level=>({values:Array.from({length:121},(_,i)=>{const t=i/120*2*Math.PI,a=Math.sqrt(2*level/maximum)*Math.cos(t),b=Math.sqrt(2*level/minimum)*Math.sin(t);return [Math.cos(angle)*a-Math.sin(angle)*b,Math.sin(angle)*a+Math.cos(angle)*b];}),color:C.dim}));
  const transformed=SOURCE.map(([a,b])=>[a+.1*b,b-.1*a]);
  return <Figure id="D39" equivalent="For quadratic H=[[2,1],[1,3]] at v=(1,−1), gradient (1,−2), negative gradient (−1,2) and solved direction (−1,1) differ. Half/full solved trials give objectives .375/0. Separate indefinite curvature needs shift .6, spectrum .1/2.1 and direction (−10,10).">
    <Panels><Plane label="true quadratic contours; directions start at v" domain={[-3,3]} curves={contours} points={[{id:'v',value:[1,-1]},{id:'half',value:[.5,-.5],color:C.query},{id:'full',value:[0,0],color:C.query}]} vectors={[{start:[1,-1],end:[2,-3],color:C.source1,label:'gradient (1,−2)'},{start:[1,-1],end:[0,1],color:C.source2,label:'negative gradient (−1,2)'},{start:[1,-1],end:[0,0],color:C.residual,label:'solved d=(−1,1)'}]}/>
      <Plane label="separate regularized curvature direction; scale −12..12" domain={[-12,12]} vectors={[{end:[-10,10],color:C.residual,label:'shifted solve d=(−10,10)'},{end:[1,-1],label:'gradient g=(1,−1)'}]}/></Panels>
    <Panels><Matrix name="supplied indefinite block and regularization" headers={['first coordinate','second coordinate']} rows={[[.5,1],[1,.5],[1.1,1],[1,1.1]]} rowLabels={['H row 1','H row 2','H+.6I row 1','H+.6I row 2']}/>
      <Plane label="relative operator perturbation; supplied E₁₂=.1, E₂₁=−.1" domain={[-1.5,1.5]} points={[...samplePoints(SOURCE),...transformed.map((value,i)=>({id:`${['A','B','C','D'][i]}′`,value,color:C.query}))]} vectors={SOURCE.map((row,i)=>({start:row,end:transformed[i],color:C.query,label:`relative displacement ${['A','B','C','D'][i]}`}))}/></Panels>
    <p>Relative update B_new=(I+E)B acts on current y. The coupled entries E_ij,E_ji use a local block [[h_ij,1],[1,h_ji]], with h_ij=mean[ψ′_i(y_i)y_j²]. Near independence, an additional factorization uses mean[ψ′_i]mean[y_j²]. The .5/.5 block above is supplied, not fitted. Positive blocks precondition a direction; retained displacement/gradient changes supply L-BFGS memory corrections; a line search tests the actual likelihood. No full Picard optimizer or measured speed trace is drawn.</p>
  </Figure>;
}
function Outlier() {
  const original=SOURCE.map(row=>multiply(MIXING,row));
  return <Figure id="D40" equivalent="Adding raw channel row (100,0) changes mean to (20,0) and covariance to [[1604,3.2],[3.2,4]] before the bounded tanh stage. A magnified original cluster uses its explicitly different scale."><Panels>
    <Plane label="full raw-channel scale, including outlier 100" domain={[-105,105]} points={[...samplePoints(original),{id:'outlier',value:[100,0],color:C.residual},{id:'new mean',value:[20,0],color:C.query}]} vectors={[{end:[20,0],color:C.query,label:'new mean (20,0)'}]}/>
    <Plane label="magnified original cluster; separate scale −4..4" domain={[-4,4]} points={samplePoints(original)}/>
    <Matrix name="exact centered moments after adding (100,0)" headers={['first channel','second channel']} rows={[[8020,16],[16,20],[1604,3.2],[3.2,4]]} rowLabels={['sum outer row 1','sum outer row 2','population C row 1','population C row 2']}/></Panels>
    <Panels><Curve label="projection y → bounded tanh(y)" values={range(-5,5,121,Math.tanh)} xDomain={[-5,5]} yDomain={[-1.1,1.1]} color={C.source1}/>
      <Curve label="scalar multiplier witness z → z tanh(z); still unbounded" values={range(-100,100,121,z=>z*Math.tanh(z))} xDomain={[-100,100]} yDomain={[0,100]} color={C.residual}/></Panels>
    <p>The right curve is a supplied scalar product witness, not a new whitened recording estimate. Bounding g does not bound the remaining z multiplier or repair covariance distortion upstream.</p>
  </Figure>;
}
function TemporalAxes() {
  const [second,setSecond]=useState(.2),model=lagModel(second);
  return <Figure id="D41" equivalent={`First source lag-one covariance .8, second ${number(second)}; mixed lag matrix ${model.matrix.map(vector).join(', ')} and spectrum gap ${number(model.gap)}. ${model.resolved?'Unequal lag values define axes.':'Equal .8 values give .8I and unresolved axes.'}`}>
    <Panels><Matrix name="live analytic mixed lag-one covariance" headers={['white channel 1','white channel 2']} rows={model.matrix} rowLabels={['white channel 1','white channel 2']}/>
      <Plane label={model.resolved?'analytic lag eigendirections; declared source axes':'tie: unresolved neutral eigenspace'} domain={[-1.2,1.2]} circles={model.resolved?[]:[.8]} vectors={model.resolved?[{end:scale(direction(45),.8),color:C.source1,label:'lag eigenvalue .8'},{end:scale(direction(135),second),color:C.source2,label:`lag eigenvalue ${number(second)}`}]:[]}/></Panels>
    <Controls id="L12" reset={()=>setSecond(.2)}><Numeric label="Second source lag-one covariance" min={0} max={.8} value={second} onChange={setSecond}/></Controls>
    <Readout>Gap <strong>{number(model.gap)}</strong>. {model.resolved?'The unequal lag spectrum supplies information missing from instantaneous Gaussian amplitudes.':'The matrix is .8I: no preferred source axes, so arbitrary source-colored eigenvectors are withheld.'}</Readout>
    <Panels><Matrix name="separate fixed AR(.8,.2) lag-two covariance" rows={[[.34,.30],[.30,.34]]} headers={['white 1','white 2']}/>
      <Curve label="fixed two-lag equal-weight off-diagonal objective; degrees" values={range(0,90,91,a=>.36*Math.cos(2*a*Math.PI/180)**2)} xDomain={[0,90]} yDomain={[0,.4]} color={C.residual} selected={[45,0]}/>
      <Matrix name="separate fixed tie and actual empirical N11 estimates" headers={['value']} rows={[[".4I: static unresolved tie"],[".19024906, .80817686"],[".6179278045385984"]]} rowLabels={['different tie witness','empirical lag eigenvalues','empirical gap']}/></Panels>
    <p>Static analytic two-lag objective: .36 at 0°, .09 at 30°, 0 at 45°. Its fixed AR(.8,.2) operands stay distinct from the live single-lag edit and the finite empirical AMUSE example.</p>
  </Figure>;
}
function FiltersAndDelays() {
  const [delay,setDelay]=useState(1),model=delayedImpulse(delay);
  const filtered1=[.5,0,0,0,0], filtered2=[.5,.5,0,0,0];
  const filteredRows=filtered1.map((value,i)=>[value,filtered2[i]]);
  const mixed=filteredRows.map(row=>multiply([[1,.5],[-.25,2]],row));
  return <Figure id="D42" equivalent={`A common two-tap average with identical first-row trim commutes with fixed mixing. Separately, delay δ=${delay} moves the first cross-branch .5 impulse to ${1+delay}; the second channel's −.25 impulse stays at time 2.`}>
    <Panels><Trace label="source 1 impulse at time 0" values={model.s1} color={C.source1} domain={[-.5,1.1]} stems xLabel="integer time"/><Trace label="source 2 impulse at time 1" values={model.s2} color={C.source2} domain={[-.5,1.1]} stems xLabel="integer time"/></Panels>
    <Panels><Trace label={`x₁ = s₁ + .5 delayed s₂; delay ${delay}`} values={model.x1} domain={[-.5,1.1]} stems xLabel="integer time"/><Trace label="x₂ = s₂ − .25 s₁[t−2]; persistent delay 2" values={model.x2} domain={[-.5,1.1]} stems xLabel="integer time"/></Panels>
    <Controls id="L13" reset={()=>setDelay(1)}><Numeric label="First-channel cross-delay δ" value={delay} onChange={setDelay} min={0} max={2} step={1} integer/></Controls>
    <Readout>The .5 first-channel cross impulse is at <strong>{1+delay}</strong>; the −.25 second-channel cross impulse stays at <strong>2</strong>. {delay===0?'One branch is instantaneous; the complete system still has a delay.':'The channels are not one same-time mixture of the original source pair.'}</Readout>
    <Matrix name="separate common two-tap filter witness; time 1..5, identical trim" headers={['F(s₁)','F(s₂)','F(As) channel 1','F(As) channel 2']} rows={filteredRows.map((row,i)=>[...row,...mixed[i]])} rowLabels={['t=1','t=2','t=3','t=4','t=5']}/>
    <p>Using fixed A=[[1,.5],[−.25,2]], every row above is A F(s)=F(As). Both sides omit the same initial sample. This separate common-filter witness stays fixed when δ changes.</p>
  </Figure>;
}
function ChangedAssumptions() {
  return <Figure id="D43" equivalent="Three distinct changes: noise propagates through known inverse, a three-source/two-channel null fiber gives the same observation, and an old inverse applied after mixing drift returns wrong scores.">
    <Panels><Plane label="known inverse propagates channel noise" domain={[-1.5,1.5]} points={[{id:'C',value:[1,-1]},{id:'noisy',value:[1.2,-1.1],color:C.query}]} vectors={[{start:[1,-1],end:[1.2,-1.1],color:C.residual,label:'channel noise (.2,−.1)'},{end:[1/6,-2/15],color:C.source1,label:'source error after B'}]}/>
      <div><Matrix name="underdetermined A: two channels × three sources" rows={[[1,0,1],[0,1,1]]} headers={['s₁','s₂','s₃']}/><Matrix name="distinct source preimages → same observed row" rows={[[1,1,0],[0,0,1],[-1,-1,1]]} headers={['s₁','s₂','s₃']} rowLabels={['first preimage','second preimage','null difference']}/><Plane label="both preimages map to same channel point (1,1)" domain={[-2,2]} points={[{id:'first',value:[1,1]},{id:'second',value:[1,1]}]} vectors={[{end:[0,0],color:C.residual,label:'null difference maps to zero'}]}/></div>
      <Plane label="changing cross-weight 1 → 1.5; old inverse stays fixed" domain={[-2.5,2.5]} vectors={[{end:[2,1],color:C.source1,label:'old column 1'},{end:[2,1.5],color:C.source1,dashed:true,label:'new column 1'},{end:[1,2],color:C.source2,label:'old column 2'},{end:[1.5,2],color:C.source2,dashed:true,label:'new column 2'}]} points={[{id:'new x',value:[.5,-.5],color:C.query}]}/></Panels>
    <p>Noise source error (1/6,−2/15) is nonzero. Both underdetermined preimages give (1,1). With true source (1,−1), drifting A gives (.5,−.5); the old inverse returns (.5,−.5) as scores. These failures require different added assumptions or remedies.</p>
  </Figure>;
}
function AuxiliaryInformation() {
  const conditions=[[0,1,0,1],[1,1,0,1],[0,1,1,1],[0,.5,0,1],[0,1,0,.5]];
  // Split every wrapped line at the identified edge; never bridge across it.
  const shear=Array.from({length:5},(_,i)=>{
    const offset=i/5,edge=1-offset;
    return [
      {values:[[0,offset],[edge,1]],color:C.dim},
      ...(offset===0?[]:[{values:[[edge,0],[1,offset]],color:C.dim}]),
    ];
  }).flat();
  return <Figure id="D44" equivalent="Torus shear maps (.2,.3) to (.2,.5) while preserving a uniform joint law, with wrap on square edges. Separately, conditional Gaussian mean/variance changes produce four independent natural-parameter differences, rank 4; theorem conditions still apply.">
    <Panels><Plane label="unit-square torus: u₁,u₂; edges identified" domain={[0,1]} points={[{id:'u',value:[.2,.3],color:C.source1},{id:'v',value:[.2,.5],color:C.source2}]} curves={shear} vectors={[{start:[.2,.3],end:[.2,.5],color:C.query,label:'v₂ = (u₂+u₁) mod 1'}]}/>
    <Matrix name="conditional Gaussian states; source-specific means and variances" headers={['μ₁','v₁','μ₂','v₂']} rows={conditions} rowLabels={['baseline a₀','a₁: mean 1','a₂: mean 2','a₃: variance 1','a₄: variance 2']}/></Panels>
    <Panels>{conditions.map(([m1,v1,m2,v2],i)=><div key={i}><Curve label={`a${i}: source 1 density (amber), source 2 density (blue)`} values={range(-3,3,91,x=>Math.exp(-((x-m1)**2)/(2*v1))/Math.sqrt(2*Math.PI*v1))} xDomain={[-3,3]} yDomain={[0,.6]} color={C.source1}/><Curve label={`a${i}: source 2 conditional density`} values={range(-3,3,91,x=>Math.exp(-((x-m2)**2)/(2*v2))/Math.sqrt(2*Math.PI*v2))} xDomain={[-3,3]} yDomain={[0,.6]} color={C.source2}/></div>)}</Panels>
    <Matrix name="differences from a₀ in (μ₁/v₁,−1/(2v₁),μ₂/v₂,−1/(2v₂)); rank 4" headers={['s₁ coefficient','s₁² coefficient','s₂ coefficient','s₂² coefficient']} rows={[[1,0,0,0],[0,0,1,0],[0,-.5,0,0],[0,0,0,-.5]]} rowLabels={['a₁−a₀','a₂−a₀','a₃−a₀','a₄−a₀']}/>
    <p>The wrap is discontinuous in a Euclidean square representation; this is an almost-everywhere torus example. Auxiliary variation adds information under the specified conditional model, regularity and theorem-specific equivalence class; an arbitrary label or encoder supplies no automatic identification.</p>
  </Figure>;
}
function RecapAndNmf() {
  const x=[[2,1,3],[1,2,3],[3,3,6]],w1=[[2,1],[1,2],[3,3]],h1=[[1,0,1],[0,1,1]],w2=[[1.5,.5],[.5,1.5],[2,2]],h2=[[1.25,.25,1.5],[.25,1.25,1.5]];
  return <Figure id="D45" equivalent="The same sample C and stored-mean query trace the complete ICA operation. Separately two distinct nonnegative matrix products give the same X; the second component rows mix the first beyond scale/permutation. This is an NMF ambiguity bridge, not an optimizer.">
    <Panels><Plane label="sample C: source amplitudes → mixing → channels" domain={[-3,3]} vectors={[{end:[2,1],color:C.source1,label:'1 × source 1 column'},{start:[2,1],end:[1,-1],color:C.source2,label:'−1 × source 2 column'}]} points={[{id:'C',value:[1,-1]}]}/>
      <Plane label="stored centering → K → white frame → Q" domain={[-2,2]} points={[{id:'white C',value:[0,SQRT2]},{id:'source C',value:[1,-1]}]} vectors={[{end:Q[0],color:C.source1,label:'W row 1'},{end:Q[1],color:C.source2,label:'W row 2'}]}/>
      <Plane label="decode / remove whole contribution" domain={[-5,11]} vectors={[{end:[9,3],color:C.source1,label:'first whole contribution'},{end:[-4,-4],color:C.source2,label:'second contribution; remains after removing first (9, 3)'},{end:[5,-1],label:'sum of both contributions'}]}/></Panels>
    <p><a href="#1-follow-two-signals-into-two-channels">mix</a> → <a href="#4-whiten-the-covariance-then-inspect-the-remaining-freedom">stored centering / positive-rank whitening</a> → <a href="#6-work-through-one-fastica-direction">contrast / fixed-point line</a> → <a href="#8-treat-a-fit-as-an-operator-bundle-and-compare-ordinary-tools">raw operator / calibration naming</a> → <a href="#9-read-the-recording-s-retained-evidence-without-inventing-a-new-run">held-out task evidence</a> → <a href="#10-remove-a-contribution-not-a-label">whole contribution removal</a>. Zero directions, rank loss, ties and missing scores interrupt the affected claim.</p>
    <Panels><Matrix name="nonnegative observation X" rows={x} headers={['measurement 1','measurement 2','measurement 3']} rowLabels={['A','B','C']}/><div><Matrix name="W₁: nonnegative activations" rows={w1} headers={['component 1','component 2']} rowLabels={['A','B','C']}/><Matrix name="H₁: nonnegative component rows" rows={h1} headers={['measurement 1','measurement 2','measurement 3']}/></div><div><Matrix name="W₂: alternative activations" rows={w2} headers={['component 1','component 2']} rowLabels={['A','B','C']}/><Matrix name="H₂: alternative mixed component rows" rows={h2} headers={['measurement 1','measurement 2','measurement 3']}/></div></Panels>
    <Panels><Plane label="NMF first two measurement coordinates; first factorization rays" domain={[0,3.5]} vectors={[{end:[2,0],color:C.source1,label:'row A: 2 × H₁ first ray'},{start:[2,0],end:[2,1],color:C.source2,label:'row A: 1 × H₁ second ray'}]} points={[{id:'A',value:[2,1]}]}/>
      <Plane label="same row A; second factorization rays" domain={[0,3.5]} vectors={[{end:[1.875,.375],color:C.source1,label:'1.5 × H₂ first ray'},{start:[1.875,.375],end:[2,1],color:C.source2,label:'.5 × H₂ second ray'}]} points={[{id:'A',value:[2,1]}]}/></Panels>
    <p>Both full products equal X, including measurement 3. Nonnegative Matrix Factorization (NMF) constrains addition; recognizable parts, independence and physical uniqueness require additional evidence.</p>
  </Figure>;
}
const drawings={D37:EntropyObjects,D38:Jacobian,D39:Curvature,D40:Outlier,D41:TemporalAxes,D42:FiltersAndDelays,D43:ChangedAssumptions,D44:AuxiliaryInformation,D45:RecapAndNmf};
export default function IcaObjectivesAndModels({id}) { const Drawing=drawings[id]; return <Drawing/>; }
