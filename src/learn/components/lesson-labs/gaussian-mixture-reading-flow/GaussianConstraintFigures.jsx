import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing, GaussianQuantity } from "./GaussianScalarFigures.jsx";
import { gaussianMixtureColours } from "./GaussianMixtureFigures.jsx";
import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import { collapseState, recordedCollapseStates, scalarVarianceObjective, varianceConstraint } from "./gaussian-constraint-models.mjs";

const {left:LEFT,right:RIGHT,sum:SUM,ink:INK,reference:REFERENCE}=gaussianMixtureColours;
const number=value=>flowNumber(value,9);

// Add knots on the actual shrinking Gaussian, including its centre. A fixed
// context grid alone can miss a subpixel spike; neither knots nor stroke widths
// change its coordinates, standard deviation or density values.
function collapseCurve(state,scaleX,scaleY,lower,upper) {
  const knots=new Set(Array.from({length:201},(_,index)=>lower+(upper-lower)*index/200));
  for(let index=-100;index<=100;index++) {
    const x=state.mean+state.standardDeviation*index/20;
    if(x>=lower && x<=upper) knots.add(x);
  }
  return [...knots].sort((a,b)=>a-b).map((x,index)=>`${index?'L':'M'}${scaleX(x)},${scaleY(0.5*gaussianDetails(x,state.mean,state.standardDeviation).density)}`).join(' ');
}

function CoordinateRuler({scaleX,y,ticks}) {
  return <g>
    <line x1={scaleX(ticks[0])} x2={scaleX(ticks.at(-1))} y1={y} y2={y} stroke={REFERENCE}/>
    {ticks.map(value=><g key={value}><line x1={scaleX(value)} x2={scaleX(value)} y1={y} y2={y+5} stroke={REFERENCE}/><text x={scaleX(value)} y={y+28} textAnchor="middle">{number(value)}</text></g>)}
  </g>;
}

export function GaussianCollapseContextLab() {
  const [logDeviation,setLogDeviation]=useState(-1), state=collapseState(10**logDeviation);
  return <FlowLab id="gmm-d34" label="Narrow one source on a fixed coordinate ruler and inspect its labelled magnification">
    <GaussianDrawing id="D34" title="A shrinking component keeps half the full area while its peak grows" width={850} height={1230} adaptive
      description={`Supplied Left mean minus two, weight one half, standard deviation ${state.standardDeviation}; peak ${state.peak}, full area one half. Separate Left and unchanged Right context plots share x from minus five to five but use different labelled vertical density scales. Left's standard-deviation bracket uses its actual physical width, without a minimum displayed width. Right mean zero and standard deviation two. The supplementary zoom spans ${state.zoomLower} to ${state.zoomUpper}, four Left standard deviations each side, and does not replace the full context.`}>
      {width=>{
        const xScale=x=>85+(x+5)*(width-115)/10;
        const leftY=density=>335-density/state.peak*190;
        const rightY=density=>690-density/0.11*130;
        const zoomX=x=>85+(x-state.zoomLower)/(state.zoomUpper-state.zoomLower)*(width-115);
        const zoomY=density=>1050-density/state.peak*190;
        const rightCurve=Array.from({length:241},(_,index)=>{
          const x=-5+index/24;return `${index?'L':'M'}${xScale(x)},${rightY(0.5*gaussianDetails(x,0,2).density)}`;
        }).join(' ');
        return <>
          <text x="20" y="25" fill={LEFT}>Left: mean −2, weight 0.5</text>
          <text data-collapse-sd={state.standardDeviation} x="20" y="54" fill={LEFT}>SD: {number(state.standardDeviation)}</text>
          <text data-collapse-peak={state.peak} x="20" y="83" fill={LEFT}>Peak / unit: {number(state.peak)}</text>
          <text x="20" y="112">Full coordinate context</text>
          <line x1="85" x2="85" y1="140" y2="335" stroke={REFERENCE}/>
          {[0,0.5,1].map(fraction=><text key={fraction} x="73" y={leftY(state.peak*fraction)+5} textAnchor="end">{flowNumber(state.peak*fraction,3)}</text>)}
          <path data-left-collapse-curve="true" d={collapseCurve(state,xScale,leftY,-5,5)} fill="none" stroke={LEFT} strokeWidth="2"/>
          <line x1={xScale(-2)} x2={xScale(-2)} y1="145" y2="335" stroke={LEFT} strokeDasharray="2 4"/>
          <CoordinateRuler scaleX={xScale} y={335} ticks={[-5,-2,0,2,5]}/>
          <g data-physical-sd={state.standardDeviation}>
            <line data-sd-bracket="true" x1={xScale(-2)} x2={xScale(-2+state.standardDeviation)} y1="389" y2="389" stroke={LEFT}/>
            {[-2,-2+state.standardDeviation].map((x,index)=><line key={index} x1={xScale(x)} x2={xScale(x)} y1="384" y2="394" stroke={LEFT}/>)}
          </g>
          <text x="20" y="426">Bracket = one actual Left SD</text>
          <text x="20" y="455">Both contexts: x in [−5,5]</text>
          <text x="20" y="484">Density scales differ.</text>
          <text x="20" y="523" fill={RIGHT}>Right: mean 0, SD 2, weight 0.5</text>
          <line x1="85" x2="85" y1="545" y2="690" stroke={REFERENCE}/>
          {[0,0.05,0.1].map(density=><text key={density} x="73" y={rightY(density)+5} textAnchor="end">{density}</text>)}
          <path data-fixed-broad-curve="true" d={rightCurve} fill="none" stroke={RIGHT} strokeDasharray="7 4" strokeWidth="2"/>
          <CoordinateRuler scaleX={xScale} y={690} ticks={[-5,-2,0,2,5]}/>
          <text x="20" y="752">Right stays broad and unchanged.</text>
          <text x="20" y="792">Supplementary Left magnification</text>
          <text data-zoom-lower={state.zoomLower} data-zoom-upper={state.zoomUpper} x="20" y="821">x: {number(state.zoomLower)} to {number(state.zoomUpper)}</text>
          <line x1="85" x2="85" y1="855" y2="1050" stroke={REFERENCE}/>
          {[0,0.5,1].map(fraction=><text key={fraction} x="73" y={zoomY(state.peak*fraction)+5} textAnchor="end">{flowNumber(state.peak*fraction,3)}</text>)}
          <path data-magnified-left-curve="true" d={collapseCurve(state,zoomX,zoomY,state.zoomLower,state.zoomUpper)} fill="none" stroke={LEFT} strokeWidth="2"/>
          <line x1="85" x2={width-30} y1="1050" y2="1050" stroke={REFERENCE}/>
          {[-4,-2,0,2,4].map(multiple=><g key={multiple}>
            <line x1={zoomX(-2+multiple*state.standardDeviation)} x2={zoomX(-2+multiple*state.standardDeviation)} y1="1050" y2="1055" stroke={REFERENCE}/>
            <text x={zoomX(-2+multiple*state.standardDeviation)} y="1080" textAnchor="middle">{multiple===0?'centre':`${multiple>0?'+':''}${multiple} SD`}</text>
          </g>)}
          <text x="20" y="1127">Zoom spans ±4 Left SD.</text>
          <text data-full-left-area={state.area} x="20" y="1156">Whole Left area stays 0.5.</text>
          <text x="20" y="1185">Zoom width changes with SD;</text>
          <text x="20" y="1214">the context width stays fixed.</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls>
      <FlowSlider name="Left standard deviation" value={logDeviation} onChange={setLogDeviation} min={-3} max={0} step={0.1} format={value=>flowNumber(10**value,4)}/>
      <button type="button" onClick={()=>setLogDeviation(-1)}>Reset</button>
    </FlowControls>
    <FlowReadout>Left's standard deviation is <strong>{number(state.standardDeviation)}</strong> and its peak is <strong>{number(state.peak)}</strong> per unit. Its full area remains <strong>0.5</strong>. Equal movements on this logarithmic slider multiply the width by equal factors: moving from SD 0.01 to 0.1 makes it ten times wider. The fixed-coordinate context shows that physical change, while the supplementary zoom changes its ruler to show the curve's shape.</FlowReadout>
  </FlowLab>;
}

export function GaussianCollapseLikelihood() {
  return <GaussianDrawing id="D35" title="Four recorded log likelihoods rise as one source shrinks on observation A" width={760} height={800} adaptive
    description="Preserved supplied-state N8 results: standard deviations one, point one, point zero one, point zero zero one give total log likelihoods minus8.122121376997402, minus6.945323529427528, minus4.669586146668674, minus2.3697258984019505. Horizontal SD ticks are logarithmic; negative total log likelihood is on an ordinary linear vertical scale. The observed row at minus two receives the growing Left peak; Right remains positive at the other observed rows. Four computations illustrate rather than prove the unbounded limit.">
    {width=>{
      const xScale=sd=>65-Math.log10(sd)*(width-100)/3, yScale=log=>350-(log+9)/8*240;
      const rowX=x=>65+(x+3)*(width-100)/6;
      return <>
        <text x="20" y="25">Four recorded supplied-state values</text>
        <text x="20" y="54">Total log likelihood ℓ (nats)</text>
        <text x="20" y="83">Ordinary linear vertical scale</text>
        <line x1="65" x2="65" y1="110" y2="350" stroke={REFERENCE}/>
        {[-9,-7,-5,-3,-1].map(value=><g key={value}><line x1="60" x2={width-35} y1={yScale(value)} y2={yScale(value)} stroke={REFERENCE} strokeDasharray="2 6"/><text x="52" y={yScale(value)+5} textAnchor="end">{value}</text></g>)}
        {recordedCollapseStates.map(state=><g key={state.standardDeviation} data-recorded-collapse-sd={state.standardDeviation} data-recorded-total-log-likelihood={state.totalLogLikelihood}>
          <circle cx={xScale(state.standardDeviation)} cy={yScale(state.totalLogLikelihood)} r="5" fill={SUM}/>
          <line x1={xScale(state.standardDeviation)} x2={xScale(state.standardDeviation)} y1="350" y2="355" stroke={REFERENCE}/>
          <text x={xScale(state.standardDeviation)} y="378" textAnchor="middle">{state.standardDeviation}</text>
        </g>)}
        <line x1="65" x2={width-35} y1="350" y2="350" stroke={REFERENCE}/>
        <text x="20" y="413">Left SD decreases → (log ticks)</text>
        {recordedCollapseStates.map((state,index)=><text key={state.standardDeviation} x="20" y={450+index*28}>SD {state.standardDeviation}: ℓ {number(state.totalLogLikelihood)}</text>)}
        <text x="20" y="592">Observed rows stay fixed:</text>
        <line x1={rowX(-3)} x2={rowX(3)} y1="654" y2="654" stroke={REFERENCE}/>
        {[-2,-1,1,2].map((query,index)=><g key={query}>
          <text x={rowX(query)} y="624" textAnchor="middle">{'ABCD'[index]}</text>
          <circle cx={rowX(query)} cy="654" r="5" fill={INK}/>
          <text x={rowX(query)} y="684" textAnchor="middle">{query}</text>
        </g>)}
        <text x="20" y="727" fill={LEFT}>At A: Left height ∝ 1 / SD</text>
        <text x="20" y="756" fill={RIGHT}>Right density stays positive.</text>
        <text x="20" y="785">Illustration; the limit needs proof.</text>
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianVarianceConstraintLab() {
  const [inputs,setInputs]=useState({scatter:0.02,floor:0.05}),[reset,setReset]=useState(0);
  const state=varianceConstraint(inputs.scatter,inputs.floor);
  return <FlowLab id="gmm-d36" label="Compare an exact minimum-variance constraint with adding the same amount">
    <GaussianDrawing id="D36" title="Clipping at a positive minimum maximizes the fixed-allocation scalar objective" width={850} height={840} adaptive
      description={`Raw scatter ${state.scatter}, minimum variance ${state.floor}, effective count two. The variance ruler uses zero to1.6. The objective curve shows only feasible positive variances from the floor to1.6; the vertical scale is labelled and recomputed for visibility. Exact constrained variance ${state.exact.variance} gives Q ${state.exact.objective}; adding the floor gives variance ${state.additive.variance} and Q ${state.additive.objective}. Raw zero scatter has no positive unconstrained stationary variance, but the positive boundary remains the constrained maximizer.`}>
      {width=>{
        const xScale=v=>65+v*(width-100)/1.6;
        const candidates=Array.from({length:241},(_,index)=>state.floor+(1.6-state.floor)*index/240);
        candidates.push(state.exact.variance,state.additive.variance);
        const samples=[...new Set(candidates)].sort((a,b)=>a-b).map(v=>scalarVarianceObjective(v,state.scatter));
        const minimum=Math.min(...samples.map(point=>point.objective)),maximum=state.exact.objective;
        const margin=Math.max(0.05,(maximum-minimum)*0.1),lower=minimum-margin,upper=maximum+margin;
        const yScale=q=>550-(q-lower)/(upper-lower)*190;
        const curve=samples.map((point,index)=>`${index?'L':'M'}${xScale(point.variance)},${yScale(point.objective)}`).join(' ');
        return <>
          <text x="20" y="25" fill={REFERENCE}>○ raw scatter s = {number(state.scatter)}</text>
          <text x="20" y="54" fill={SUM}>◆ minimum ε = {number(state.floor)}</text>
          <text x="20" y="83">Variance v; effective count = 2</text>
          <circle cx={xScale(state.scatter)} cy="127" r="5" fill="none" stroke={REFERENCE}/>
          <line x1={xScale(state.scatter)} x2={xScale(state.scatter)} y1="132" y2="155" stroke={REFERENCE}/>
          <line x1="65" x2={width-35} y1="155" y2="155" stroke={REFERENCE}/>
          <line data-feasible-variance="true" data-minimum-variance={state.floor} x1={xScale(state.floor)} x2={width-35} y1="155" y2="155" stroke={SUM} strokeWidth="4"/>
          {[0,0.4,0.8,1.2,1.6].map(v=><g key={v}><line x1={xScale(v)} x2={xScale(v)} y1="155" y2="160" stroke={REFERENCE}/><text x={xScale(v)} y="184" textAnchor="middle">{v}</text></g>)}
          <path d={`M${xScale(state.floor)},199 l6,6 l-6,6 l-6,-6 Z`} fill={SUM}/>
          <line x1={xScale(state.floor)} x2={xScale(state.floor)} y1="160" y2="199" stroke={SUM}/>
          <text x="20" y="240">Gold ray: feasible v ≥ ε</text>
          <text x="20" y="269">{state.stationaryVariance===null?'s = 0: no positive stationary v.':'Unconstrained stationary v = s.'}</text>
          <text x="20" y="298">Q shown only for feasible v.</text>
          <text x="20" y="327">Q(v); ordinary linear vertical scale</text>
          <line x1="65" x2="65" y1="360" y2="550" stroke={REFERENCE}/>
          {[lower,(lower+upper)/2,upper].map(q=><g key={q}><text x="53" y={yScale(q)+5} textAnchor="end">{flowNumber(q,2)}</text><line x1="65" x2={width-35} y1={yScale(q)} y2={yScale(q)} stroke={REFERENCE} strokeDasharray="2 6"/></g>)}
          <path data-feasible-objective-curve="true" d={curve} fill="none" stroke={INK} strokeWidth="2"/>
          <line x1={xScale(state.floor)} x2={xScale(state.floor)} y1="360" y2="550" stroke={SUM} strokeDasharray="2 4"/>
          <circle data-exact-variance={state.exact.variance} data-exact-q={state.exact.objective} cx={xScale(state.exact.variance)} cy={yScale(state.exact.objective)} r="5" fill={SUM}/>
          <circle data-additive-variance={state.additive.variance} data-additive-q={state.additive.objective} cx={xScale(state.additive.variance)} cy={yScale(state.additive.objective)} r="5" fill="none" stroke={INK}/>
          <CoordinateRuler scaleX={xScale} y={550} ticks={[0,0.4,0.8,1.2,1.6]}/>
          <text x="20" y="612" fill={SUM}>● exact: v = {number(state.exact.variance)}</text>
          <text x="20" y="641" fill={SUM}>Q = {number(state.exact.objective)}</text>
          <text x="20" y="680" fill={INK}>○ add: v = {number(state.additive.variance)}</text>
          <text x="20" y="709" fill={INK}>Q = {number(state.additive.objective)}</text>
          <text x="20" y="753">Exact: v = max(s, ε)</text>
          <text x="20" y="782">Additive: v = s + ε</text>
          <text x="20" y="821">The two operations are different.</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls key={reset}>
      <GaussianQuantity name="Raw scatter" value={state.scatter} onChange={scatter=>setInputs(previous=>({...previous,scatter}))} min={0} max={1} step={0.01}/>
      <GaussianQuantity name="Minimum variance" value={state.floor} onChange={floor=>setInputs(previous=>({...previous,floor}))} min={0.05} max={0.5} step={0.01}/>
      <button type="button" onClick={()=>{setInputs({scatter:0.02,floor:0.05});setReset(previous=>previous+1);}}>Reset</button>
    </FlowControls>
    <FlowReadout>The raw scatter is <strong>{number(state.scatter)}</strong>. The exact constrained variance is <strong>{number(state.exact.variance)}</strong>, with Q = <strong>{number(state.exact.objective)}</strong>; adding the minimum instead gives <strong>{number(state.additive.variance)}</strong>, with Q = <strong>{number(state.additive.objective)}</strong>. {state.active?'The minimum is active because the raw scatter is below it.':'The raw scatter already satisfies the constraint, so clipping leaves it unchanged.'} These are fixed-allocation objective values, not a new fitted model.</FlowReadout>
  </FlowLab>;
}

function DiagonalMatrix({x,y,diagonal,label,role,changed}) {
  return <g data-floor-matrix={role} data-diagonal={diagonal.join(',')}>
    <text x={x} y={y} textAnchor="middle">{label}</text>
    <path d={`M${x-70},${y+24} h-8 v75 h8 M${x+70},${y+24} h8 v75 h-8`} fill="none" stroke={INK}/>
    {[diagonal[0],0,0,diagonal[1]].map((value,index)=><text key={index} x={x+(index%2?35:-35)} y={y+49+Math.floor(index/2)*36} textAnchor="middle" fill={changed.includes(index)?SUM:INK}>{value}</text>)}
  </g>;
}

export function GaussianSpectralFloorComparison() {
  return <GaussianDrawing id="D36-matrix" title="A fixed diagonal covariance comparison distinguishes clipping eigenvalues from addition" width={850} height={width=>width<700?570:260} adaptive
    description="Separate fixed example, independent of the preceding sliders: raw scatter matrix diag(.02,.2), minimum eigenvalue .05. Clipping gives diag(.05,.2), while adding .05I gives diag(.07,.25). All four cells and the two off-diagonal zeros stay visible. Amber marks changed diagonal values. This comparison is not a fitted full spectral-floor implementation.">
    {width=>{
      const stacked=width<700,center=width/2;
      return <>
        <text x="20" y="25">Fixed matrix example: ε = 0.05</text>
        <text x="20" y="54">Amber: changed diagonal values</text>
        <DiagonalMatrix x={stacked?center:width/6} y={95} diagonal={[0.02,0.2]} label="Raw scatter S" role="raw" changed={[]}/>
        <DiagonalMatrix x={stacked?center:width/2} y={stacked?260:95} diagonal={[0.05,0.2]} label="Clip eigenvalues" role="clipped" changed={[0]}/>
        <DiagonalMatrix x={stacked?center:width*5/6} y={stacked?425:95} diagonal={[0.07,0.25]} label="Add 0.05 I" role="added" changed={[0,3]}/>
        <text x="20" y={stacked?555:240}>Only clipping leaves 0.2 unchanged.</text>
      </>;
    }}
  </GaussianDrawing>;
}
