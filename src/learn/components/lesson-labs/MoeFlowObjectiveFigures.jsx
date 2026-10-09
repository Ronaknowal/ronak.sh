import { MoeScene, MoeCells, MoeMatrix, MoeText, MoeOperation, MoeWire, MOE_PAINT } from './MoeFlowFigures.jsx';
import { route, costs } from '../../data/moe-models.js';
import { objectiveScopes } from '../../data/moe-reading-traces.js';
import { flowNumber } from './LessonFlow.jsx';

export function MoeBoundaryDrawing() {
  const fixed=[1,3,2,4].map(Math.log),outputs=[[2,-1],[1,2],[-1,4],[3,0]];
  const sample=Array.from({length:161},(_,i)=>{const h=-2+i*.03;return [h,route(fixed.map((s,e)=>e===2?h:s),outputs,2,true,[1,0]).output[0]];});
  const x=h=>75+(h+2)/4.8*510,y=value=>360-(value+1)/4*260,tie=Math.log(3);
  return <MoeScene width={780} height={540} title="The local derivative follows a fixed selected region; a selection boundary can jump"
    description="The horizontal coordinate is only expert-two's logit in the fresh four-expert case; the vertical coordinate is returned output zero under selected normalization. At log three, lower expert ID one wins the tie. Just above it, expert two replaces expert one and the output jumps. No ordinary derivative is assigned at that discontinuity.">
    <path d="M75 70V360H620" fill="none" stroke={MOE_PAINT.forward}/>
    {[-1,0,1,2,3].map(value=><g key={value}><MoeText x={57} y={y(value)+5} anchor="end">{value}</MoeText><path d={`M70 ${y(value)}H75`} stroke={MOE_PAINT.forward}/></g>)}
    {[sample.filter(([h])=>h<=tie),sample.filter(([h])=>h>tie)].map((points,i)=><polyline key={i} points={points.map(([h,v])=>`${x(h)},${y(v)}`).join(' ')} fill="none" stroke={MOE_PAINT.computed} strokeWidth="2"/>)}
    <path d={`M${x(tie)} 70V360`} stroke="#eee" strokeDasharray="5 4"/>
    <MoeText x={75} y={35}>output coordinate 0; expert 3 remains selected</MoeText>
    <MoeText x={75} y={390}>−2</MoeText><MoeText x={570} y={390}>2.8</MoeText><MoeText x={240} y={430}>expert 2 logit h₂</MoeText>
    <MoeText x={75} y={472}>Left IDs [3,1]; right IDs [3,2]; tie h₂=log 3 uses [3,1].</MoeText>
    <MoeText x={75} y={507}>The jump is drawn as a gap, not a fictional continuous line.</MoeText>
  </MoeScene>;
}
export function MoeObjectiveTotalDrawing() {
  const value=[1.2,1.0125,9],coefficient=[1,.01,.001];
  return <MoeScene width={740} height={515} title="Task, balancing and absolute-scale losses meet after separate coefficients"
    description="This is an announced constructed scalar illustration: task1.2, balance1.0125,z9 with coefficients1,.01,.001. Their weighted terms1.2,.010125,.009 add to1.219125. These illustrative coefficients do not change any saved experiment. Each derivative originates at its own loss before addition.">
    {value.map((v,i)=><g key={i}>
      <MoeCells x={18} y={55+i*130} values={[v]} label={['task J','balance surrogate','z absolute-scale penalty'][i]} width={130}/>
      <MoeCells x={240} y={55+i*130} values={[coefficient[i]]} role="input" label={['unit task coefficient','supplied α','supplied β'][i]} width={110}/>
      <MoeWire path={`M145 ${73+i*130}H165V${135+i*130}H380V${73+i*130}`}/><MoeWire path={`M350 ${73+i*130}H370V${111+i*130}H400V${93+i*130}`}/><MoeOperation x={400} y={73+i*130} symbol="×"/>
      <MoeWire path={`M420 ${73+i*130}H480`}/><MoeCells x={480} y={55+i*130} values={[v*coefficient[i]]} width={140} label="weighted term"/>
      <MoeWire path={`M617 ${73+i*130}H670V443H420`}/>
    </g>)}
    <MoeOperation x={400} y={443} symbol="Σ"/><MoeWire path="M380 443H238"/><MoeCells x={98} y={425} values={[value.reduce((s,v,i)=>s+v*coefficient[i],0)]} width={140} label="complete illustration loss"/>
    <MoeText x={18} y={500}>The count, absolute scale and prediction objectives remain different quantities.</MoeText>
  </MoeScene>;
}
export function MoeNodeConstraintDrawing() {
  const affinity=[.9,.4,.8,.2],eligible=[0,1],sum=1.3;
  return <MoeScene width={740} height={440} title="A feasible node mask can exclude a globally high affinity"
    description="This is an announced illustrative restriction to node zero. Node zero owns experts zero and one; node one owns experts two and three. Their affinities are .9,.4,.8,.2. Eligibility selects node zero before choosing both eligible experts; expert two's larger .8 affinity cannot cross that mask. Original eligible affinities divide by1.3. It illustrates a constraint, not DeepSeek's complete node-selection algorithm.">
    {[0,1].map(node=><g key={node}>
      <rect x={18+node*370} y={55} width={330} height={205} fill="none" stroke={node===0?'#fff':'#999'} strokeDasharray={node===0?undefined:'5 4'}/>
      <MoeText x={38+node*370} y={85}>node {node}: {node===0?'eligible':'excluded by supplied mask'}</MoeText>
      {[0,1].map(j=><MoeCells key={j} x={40+node*370+j*150} y={150} values={[affinity[node*2+j]]} width={100} label={`E${node*2+j} affinity`}/>)}
    </g>)}
    <MoeWire path="M90 188V305H280"/><MoeWire path="M240 188V305H320"/><MoeOperation x={300} y={305} symbol="Σ"/>
    <MoeWire path="M320 305H390"/><MoeCells x={390} y={287} values={[sum]} width={110} label="selected original sum"/>
    <MoeCells x={18} y={360} values={eligible.map(e=>affinity[e]/sum)} width={110} label="eligible gates = original affinities ÷ sum"/>
    <MoeText x={370} y={407}>Always-on shared experts use a separate path.</MoeText>
  </MoeScene>;
}

export function MoeScopeDrawing({caseState}) {
  const scopes=objectiveScopes(caseState), results=[scopes.global.value,scopes.pairMean,scopes.rowMean];
  return <MoeScene width={850} height={550} title="Identical score rows are enclosed by different reduction groups"
    description={`The same four token rows are reduced globally, in two pairs, or one row at a time. Brackets show the actual rows enclosed before computing q and P. Group-size weighting returns ${results.join(', ')} respectively. Averaging group products generally differs from multiplying the overall means.`}>
    {[0,1,2].map(mode=><g key={mode}>
      <MoeText x={18+mode*280} y={28}>{['one global group','two groups of two','four groups of one'][mode]}</MoeText>
      {caseState.scores.map((row,t)=><MoeCells key={t} x={18+mode*280} y={70+t*78} values={row} width={72} label={`t${t} logits`}/>)}
      {(mode===0?[[0,4]]:mode===1?[[0,2],[2,2]]:[[0,1],[1,1],[2,1],[3,1]]).map(([start,size])=><path key={start} d={`M${245+mode*280} ${65+start*78}h12v${size*78-24}h-12`} fill="none" stroke="#fff" strokeWidth="2"/>)}
      <MoeText x={18+mode*280} y={410}>Compute q and P inside brackets.</MoeText>
      <MoeCells x={18+mode*280} y={463} values={[results[mode]]} width={130} label="size-weighted balance"/>
    </g>)}
    <MoeText x={18} y={530}>Each group uses its own token/assignment denominator before weighted averaging.</MoeText>
  </MoeScene>;
}

export function MoeWidthDrawing({budget}) {
  const {d,m}=budget, max=Math.max(d,m), scale=510/max;
  return <MoeScene width={740} height={400} title="The hidden slab changes width while each expert returns d features"
    description={`Input and output slabs each contain ${d} features; the two parallel hidden projections contain ${m} features. Lengths use the same scale. Each gate/up map has m by d entries, and down has d by m. Feature widths, not bar height or measured runtime, are encoded.`}>
    {[['input d',d,55],['gate hidden m',m,145],['value hidden m',m,235],['output d',d,325]].map(([label,width,y])=><g key={label}>
      <MoeText x={18} y={y-15}>{label}: {width}</MoeText><rect x={18} y={y} width={width*scale} height={32} fill="#222225" stroke={label.includes('input')?MOE_PAINT.input:MOE_PAINT.computed}/>
      <MoeText x={550} y={y+22}>{label.includes('hidden')?'m × d map':label.includes('output')?'d × m map':'supplied row'}</MoeText>
    </g>)}
  </MoeScene>;
}

export function MoeParallelDrawing() {
  return <MoeScene width={820} height={750} title="Parallel dimensions partition different parts of the same computation"
    description="Four independent pairs of device containers compare data replication of whole maps, tensor partition of map entries, pipeline ownership of sequential layers, and expert ownership of separate branches. A final pair of row grids contrasts many prefill assignments and fewer decode assignments without implying a latency ratio.">
    {['DP: same whole maps, different data','TP: disjoint parts of one map','PP: successive layers','EP: separate expert banks'].map((name,i)=><g key={name}>
      <MoeText x={18} y={30+i*150}>{name}</MoeText>
      {[0,1].map(device=><g key={device}>
        <rect x={18+device*390} y={55+i*150} width={340} height={95} fill="none" stroke="#aaa"/>
        <MoeText x={32+device*390} y={80+i*150}>device {device}</MoeText>
        <MoeMatrix x={170+device*390} y={80+i*150} values={i===0?[[1,2],[3,4]]:i===1?(device===0?[[1],[3]]:[[2],[4]]):[[i===2?`L${device}`:`E${device}`]]} role="parameter" width={65} height={28}/>
        {i===0&&<MoeCells x={35+device*390} y={103+i*150} values={[`x${device}`]} role="input" width={80}/>} 
      </g>)}
      {i===2&&<MoeWire path={`M295 ${110+i*150}H410`}/>}
    </g>)}
    <MoeCells x={18} y={675} values={['t0','t1','t2','t3','t4','t5','t6','t7']} width={70} label="prefill: many source rows at once"/>
    <MoeCells x={635} y={675} values={['t8']} width={85} label="decode: fewer rows"/>
    <MoeText x={18} y={736}>These row counts illustrate occupancy; they are not measured speed or required hardware.</MoeText>
  </MoeScene>;
}
