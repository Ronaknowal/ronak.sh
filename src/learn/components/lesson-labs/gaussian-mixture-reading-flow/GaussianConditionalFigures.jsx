import { useId, useLayoutEffect, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from "../LessonFlow.jsx";
import { parseNumeric } from "../../../data/perceptron-models.js";
import { singleGaussianSlice, conditionalMixture, CONDITIONAL_PLAN } from "./gaussian-conditional-models.mjs";
import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import "./gaussian-conditional.css";

const INK='#deded8',MUTED='#aaa8ad',GOLD='#e9b94c',U='#edb489',V='#c4a0e8';
const IDENTITIES=[{id:'Left',color:'#6bc6ba',dash:''},{id:'Right',color:'#87baf1',dash:'7 4'}];
export const conditionalNumber=(value,digits=9)=>String(Number(value.toFixed(digits))).replaceAll('-','−');
const f=conditionalNumber;
function Drawing({id,name,description,max=780,min=320,height,children}){
  const unique=useId(),region=useRef(null),probe=useRef(null),[width,setWidth]=useState(max),[pans,setPans]=useState(false);
  useLayoutEffect(()=>{const measure=()=>{const rem=probe.current.getBoundingClientRect().width,next=Math.max(min,Math.min(max,Math.floor(region.current.clientWidth*16/rem)));setWidth(next);setPans(next*rem/16>region.current.clientWidth+1);};measure();const observer=new ResizeObserver(measure);observer.observe(region.current);observer.observe(probe.current);return()=>observer.disconnect();},[max,min]);
  const h=typeof height==='function'?height(width):height;
  return <><div className="gmm-conditional-drawing" ref={region} role="region" tabIndex="0" aria-label={`${id}: ${name}; keyboard-scroll if needed`}><span ref={probe} className="gmm-conditional-probe" aria-hidden="true"/><svg data-conditional-drawing={id} viewBox={`0 0 ${width} ${h}`} style={{width:`${width/16}rem`,height:`${h/16}rem`}} role="img" aria-labelledby={`${unique}-t ${unique}-d`}><title id={`${unique}-t`}>{name}</title><desc id={`${unique}-d`}>{description}</desc><g fontSize="16" fill={INK}>{children(width)}</g></svg></div>{pans&&<p className="gmm-conditional-pan">Scroll horizontally for the full drawing; focus it and use the arrow keys.</p>}</>;
}
function Table({caption,heads,rows}){return <div className="gmm-conditional-table" role="region" tabIndex="0" aria-label={`${caption}; scroll for full columns`}><table><caption>{caption}</caption><thead><tr>{heads.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j?<td key={j}>{cell}</td>:<th key={j} scope="row">{cell}</th>)}</tr>)}</tbody></table></div>;}
function Cross({x,y,color=GOLD}){return <path d={`M${x-5},${y} H${x+5} M${x},${y-5} V${y+5}`} stroke={color} strokeWidth="2"/>;}
function arrow(x1,y1,x2,y2,color=INK){const length=Math.hypot(x2-x1,y2-y1),dx=(x2-x1)/length,dy=(y2-y1)/length;return <path d={`M${x1},${y1} L${x2},${y2} M${x2-6*dx+5*dy},${y2-6*dy-5*dx} L${x2},${y2} L${x2-6*dx-5*dy},${y2-6*dy+5*dx}`} stroke={color} fill="none"/>;}
function pathFor(fun,X,Y,lo,hi){return Array.from({length:193},(_,i)=>{const x=lo+(hi-lo)*i/192;return `${i?'L':'M'}${X(x)},${Y(fun(x))}`;}).join(' ');}
function DensityPlot({width,domain=[-4,4],ticks=[-4,-2,0,2,4],curves,name,axis='v (constructed units)',query,mean,height=285}){
  const X=x=>62+(x-domain[0])*(width-93)/(domain[1]-domain[0]),Y=d=>height-80-d*(height-130)/.5,bottom=Y(0),unique=useId();
  return <>
    <defs><clipPath id={`${unique}-clip`}><rect x="62" y="50" width={width-93} height={bottom-50}/></clipPath></defs>
    <text x="20" y="24">{name}</text>
    {[0,.25,.5].map(t=><g key={t}><line x1="62" x2={width-31} y1={Y(t)} y2={Y(t)} stroke="#303033"/><text x="53" y={Y(t)+5} textAnchor="end">{f(t,2)}</text></g>)}
    <line x1="62" x2="62" y1="50" y2={bottom} stroke={MUTED}/><line x1="62" x2={width-31} y1={bottom} y2={bottom} stroke={MUTED}/>
    <g clipPath={`url(#${unique}-clip)`}>
      {curves.filter(curve=>curve.areaFill).map(curve=><path key={`${curve.id}-area`} data-conditional-area={curve.id} d={`${pathFor(curve.fun,X,Y,...domain)} L${X(domain[1])},${bottom} L${X(domain[0])},${bottom} Z`} fill={curve.color} opacity=".14"/>)}
      {curves.map(curve=><path key={curve.id} data-conditional-curve={curve.id} d={pathFor(curve.fun,X,Y,...domain)} stroke={curve.color} strokeDasharray={curve.dash} strokeWidth="1.8" fill="none"/>)}
      {query!==undefined&&<line data-observed-guide={query} x1={X(query)} x2={X(query)} y1="50" y2={bottom} stroke={U} strokeDasharray="3 3"/>}
    </g>
    {ticks.map(t=><text key={t} x={X(t)} y={bottom+27} textAnchor="middle" fill={axis.startsWith('u')?U:V}>{t}</text>)}
    <text x={width/2} y={bottom+63} textAnchor="middle" fill={axis.startsWith('u')?U:V}>{axis}</text>
    {mean!==undefined&&<Cross x={X(mean)} y={bottom}/>}</>;
}
function CovarianceCells({x=60,y=60}){return <g data-coordinate-blocks="true"><text x={x+45} y={y-14} fill={U} textAnchor="middle">u</text><text x={x+135} y={y-14} fill={V} textAnchor="middle">v</text><text x={x-15} y={y+29} fill={U} textAnchor="middle">u</text><text x={x-15} y={y+77} fill={V} textAnchor="middle">v</text>{[['uu',1,U],['uv',.5,INK],['vu',.5,INK],['vv',1,V]].map(([id,value,color],i)=><g key={id} data-covariance-block={id}><rect x={x+(i%2)*90} y={y+Math.floor(i/2)*48} width="90" height="48" fill="none" stroke={color}/><text x={x+45+(i%2)*90} y={y+29+Math.floor(i/2)*48} textAnchor="middle" fill={color}>{id} · {value}</text></g>)}</g>;}

export function GaussianCoordinateSlice(){
  const state=singleGaussianSlice(1),peak=1/(2*Math.PI*Math.sqrt(.75));
  return <FlowLab id="gmm-d57" label="One correlated Gaussian becomes a normalized conditional slice">
    <Drawing id="D57-joint" name="An actual correlated Gaussian and its fixed u=1 slice" max={620} height={w=>w+110} description="One constructed joint Gaussian has mean0,0 and covariance1,.5;.5,1. Both coordinate scales are equal. Actual density shades and D²1,4,9 contours appear. The observed u=1 vertical line meets conditional centre v=.5; neither that centre nor the line is a generated sample.">{w=>{const extent=w-110,scale=extent/6,X=u=>70+(u+3)*scale,Y=v=>45+(3-v)*scale;return <>
      <text x="20" y="22" fill={V}>v (constructed units)</text>
      {Array.from({length:24*24},(_,i)=>{const u=-3+(i%24+.5)/4,v=3-(Math.floor(i/24)+.5)/4;return <rect key={i} x={70+(i%24)*extent/24} y={45+Math.floor(i/24)*extent/24} width={extent/24+.1} height={extent/24+.1} fill={IDENTITIES[0].color} opacity={state.joint(u,v).density/peak*.4}/>;})}
      {state.jointContours.map((points,i)=><path key={i} data-joint-radius={i+1} d={points.map(([u,v],j)=>`${j?'L':'M'}${X(u)},${Y(v)}`).join(' ')} stroke={IDENTITIES[0].color} strokeDasharray={i?'4 4':''} fill="none"/>)}
      <line x1={X(-3)} x2={X(3)} y1={Y(-3)} y2={Y(-3)} stroke={U}/><line x1={X(-3)} x2={X(-3)} y1={Y(-3)} y2={Y(3)} stroke={V}/>
      <line data-fixed-slice="1" x1={X(1)} x2={X(1)} y1={Y(3)} y2={Y(-3)} stroke={U} strokeWidth="2"/>
      <line x1={X(-3)} x2={X(1)} y1={Y(.5)} y2={Y(.5)} stroke={V} strokeDasharray="3 3"/><Cross x={X(0)} y={Y(0)} color={IDENTITIES[0].color}/><Cross x={X(1)} y={Y(.5)} color={GOLD}/>
      {[-3,0,3].map(t=><g key={t}><text x={X(t)} y={Y(-3)+27} textAnchor="middle" fill={U}>{t}</text><text x="58" y={Y(t)+5} textAnchor="end" fill={V}>{t}</text></g>)}
      <text x={X(1)+7} y="39" fill={U}>u = 1</text><text x={w/2} y={Y(-3)+62} fill={U} textAnchor="middle">u (constructed units)</text><text x="20" y={w+38}>D² = 1, 4, 9 · joint density / (u·v)</text><text x="20" y={w+73} fill={MUTED}>Shading: 0 to {f(peak,6)} / (u·v)</text>
    </>;}}</Drawing>
    <Drawing id="D57-blocks" name="Observed and remaining coordinate blocks supply normalization" max={620} height={460} description="The actual two-by-two covariance cells are uu1,uv.5,vu.5,vv1. Coordinate u is observed and v remains. The uu cell supplies marginal-u variance1 and its value at u1 is.2419707245 per u-unit. The vu cross cell places the slice centre atv.5, and the remaining variance is.75.">{w=><>
      <text x="20" y="24">Observed {'{u}'}; remaining {'{v}'}</text><CovarianceCells y={70}/>
      <path d="M60,110 H25 V223 H35" stroke={U} fill="none"/><path d="M105,166 V176 H290 V302 H35" stroke={INK} fill="none"/><path d="M195,166 V185 H282 M298,185 H310 V366 H35" stroke={V} fill="none"/>
      <text x="35" y="247" fill={U}>uu = 1 → marginal SD = 1</text><text x="35" y="278" fill={U}>p(u = 1) = {f(state.marginal.density)}</text>
      <text x="35" y="324" fill={V}>vu = .5 → slice centre v = .5</text>
      <text x="35" y="394" fill={V}>vv − vu·uv/uu = 1 − .25</text><text x="35" y="426" fill={V}>= .75 remaining variance</text>
    </>}</Drawing>
    <Drawing id="D57-normalization" name="Joint slice height divides by the marginal-u density" height={w=>w<640?660:355} description="Both bells use the same v ruler and numerical height scale0–.5, with different density units. The joint slice has units per(u-unit times v-unit). Dividing by marginal-u density.2419707245 per u-unit yields conditional density per v-unit with mean.5 and variance.75. Windows are finite; the conditional distribution, not the displayed polygon, has unit area.">{w=>{const narrow=w<640,plotWidth=narrow?w:w/2;return <>
      <g><DensityPlot width={plotWidth} name="Joint slice / (u·v)" curves={[{id:'joint-slice',fun:state.sliceDensity,color:IDENTITIES[0].color}]} mean={.5}/></g>
      <g transform={`translate(${narrow?0:w/2},${narrow?335:0})`}><DensityPlot width={plotWidth} name="Conditional density / v" curves={[{id:'conditional-v',fun:state.conditionalDensity,color:IDENTITIES[0].color}]} mean={.5}/></g>
      <text x="20" y={narrow?315:325}>÷ p(u=1) = {f(state.marginal.density)}</text>
    </>;}}</Drawing>
    <FlowReadout>The fixed u=1 slice has conditional mean <strong>.5</strong> and variance <strong>.75</strong> (SD {f(state.standardDeviation)}). Divide the joint slice by <strong>{f(state.marginal.density)} per u-unit</strong> to obtain density per v-unit. The centre is a conditional mean; no observation or generated sample is invented.</FlowReadout>
  </FlowLab>;
}

function useObservedU(){const[u,setU]=useState(1),[draft,setDraft]=useState('1'),parsed=parseNumeric(draft,-2,4);return {u,draft,error:parsed.error,update:text=>{setDraft(text);const value=parseNumeric(text,-2,4);if(!value.error)setU(value.value);},reset:()=>{setU(1);setDraft('1');}};}
function ObservedControl({state,id}){return <><FlowControls><label htmlFor={`${id}-u`}>Observed u (−2 to 4) <input id={`${id}-u`} type="text" inputMode="decimal" value={state.draft} aria-invalid={!!state.error} aria-describedby={state.error?`${id}-error`:undefined} onChange={e=>state.update(e.target.value)}/></label><button onClick={state.reset}>Reset</button></FlowControls>{state.error&&<p id={`${id}-error`} className="gmm-conditional-error" role="status">{state.error} Last-valid observed u={f(state.u)} remains visible.</p>}</>;}

export function GaussianConditionalSolves(){
  const control=useObservedU(),state=conditionalMixture(control.u);
  return <FlowLab id="gmm-d58" label="Solve within components then normalize the observed-coordinate source weights">
    <Drawing id="D58-solves" name="Prepared lower factors supply conditional gains and Schur complements" max={780} height={780} description={`Both components have the fixed covariance1,.5;.5,1. The observed lower factor is1, forward solve t=.5 and backward solve gain=.5; the Schur complement is1−.5×.5=.75. At currentu${state.u}, conditional means are${state.components.map(c=>c.mean).join(',')}. These fixed factors are reused; only means and source weights change.`}>{w=><>
      {state.components.map((c,k)=>{const y=25+k*385,identity=IDENTITIES[k];return <g key={c.id} data-component-solve={c.id} fill={identity.color}>
        <text x="20" y={y}>{c.id} · source mean ({c.sourceMean.join(', ')})</text>
        <text x="20" y={y+35}>uu = 1</text>{arrow(95,y+30,145,y+30,identity.color)}<text x="155" y={y+35}>√ → Lᵤᵤ</text><rect x="255" y={y+9} width="40" height="40" fill="none" stroke={identity.color}/><text x="275" y={y+35} textAnchor="middle">1</text>
        <path d={`M275,${y+49} V${y+65} H45 V${y+79}`} stroke={identity.color} fill="none"/>
        <text x="20" y={y+105}>L·t = Σᵤᵥ: 1·t = .5 → t = .5</text>
        <path d={`M45,${y+115} V${y+135}`} stroke={identity.color}/><text x="20" y={y+165}>Lᵀ·gᵀ = t: 1·g = .5 → g = .5</text>
        <path d={`M45,${y+175} V${y+196}`} stroke={identity.color}/>
        <text x="20" y={y+225}>Schur: vv − g·uv</text><text x="20" y={y+257} data-schur-variance={c.id}>1 − .5×.5 = {f(c.variance)} v²</text>
        <path d={`M45,${y+270} V${y+290}`} stroke={identity.color}/><text x="20" y={y+319}>μᵥ + g·(u − μᵤ)</text><text x="20" y={y+351} data-conditional-mean={c.id}>{c.sourceMean[1]} + .5·({f(state.u)} − {c.sourceMean[0]}) = {f(c.mean)}</text>
      </g>;})}
    </>}</Drawing>
    <Drawing id="D58-marginal" name="The observed coordinate reweights the sources through their marginal densities" height={520} description={`On the same u ruler, Left marginal is normal0,1 and Right marginal is normal2,1. The observed guide isu${state.u}. Original weight.5 times the two marginal heights gives${state.components.map(c=>c.weightedMarginal).join(',')}; their sum is${state.marginalDensity}. Each divides by that common sum. Conditional source weights are${state.components.map(c=>c.weight).join(',')}.`}>{w=>{const X=s=>62+s*(w-93);return <>
      <DensityPlot width={w} domain={[-3,5]} ticks={[-2,0,2,4]} axis="u (constructed units)" name="Marginal density / u-unit" query={state.u} curves={state.components.map((c,k)=>({...IDENTITIES[k],fun:x=>gaussianDetails(x,c.sourceMean[0],1).density}))}/>
      {state.components.map((c,k)=><g key={c.id} fill={IDENTITIES[k].color}><text x="20" y={315+k*85}>{c.id}: .5 × {f(c.marginal.density)}</text><text x="20" y={345+k*85}>= {f(c.weightedMarginal)} / common sum</text></g>)}
      <text x="20" y="496">Common sum = {f(state.marginalDensity)}</text>
    </>;}}</Drawing>
    <Drawing id="D58-normalizer" name="The same marginal-density sum feeds both source divisions" height={590} description={`A common denominator${state.marginalDensity} feeds both divisions. Left${state.components[0].weightedMarginal} divided by the sum gives${state.components[0].weight}; Right${state.components[1].weightedMarginal} gives${state.components[1].weight}. Source bars use the fixed0 to1 scale. Original areas were.5/.5; equal marginals at u1 leave those areas unchanged.`}>{w=>{const X=s=>62+s*(w-93),cx=w/2;return <>
      <text x="20" y="25">Original source areas: .5 / .5</text><text x="20" y="60">Σ weighted marginals:</text><text x="20" y="91">{f(state.marginalDensity)} / u-unit</text>
      <path d={`M10,105 V378 M10,193 H${cx-14} M10,378 H${cx-14}`} stroke={INK} fill="none"/>
      {state.components.map((c,k)=>{const y=150+k*185;return <g key={c.id} fill={IDENTITIES[k].color}><text x="20" y={y}>{c.id} numerator {f(c.weightedMarginal)}</text>{arrow(cx,y+10,cx,y+26,IDENTITIES[k].color)}<circle cx={cx} cy={y+43} r="14" stroke={INK} fill="#070707"/><text x={cx} y={y+49} textAnchor="middle" fill={INK}>÷</text>{arrow(cx,y+57,cx,y+72,IDENTITIES[k].color)}<text x="20" y={y+92}>{c.id} share = {f(c.weight)}</text><rect data-conditional-share={c.id} x={X(0)} y={y+103} width={X(c.weight)-X(0)} height="18" fill={IDENTITIES[k].color}/><rect x={X(0)} y={y+103} width={X(1)-X(0)} height="18" fill="none" stroke={MUTED}/></g>;})}
      {[0,.25,.5,.75,1].map(t=><text key={t} x={X(t)} y="500" textAnchor="middle">{t}</text>)}<text x="20" y="537">Updated conditional areas sum to 1</text><text x="20" y="570" fill={MUTED}>Equal marginals at u=1: unchanged</text>
    </>;}}</Drawing>
    <ObservedControl state={control} id="gmm-d58"/>
    <FlowReadout>At u=<strong>{f(state.u)}</strong>, Left/Right conditional means are <strong>{state.components.map(c=>f(c.mean)).join(' / ')}</strong>; their remaining variance stays <strong>.75</strong>. Updated source areas are <strong>{state.components.map(c=>f(c.weight)).join(' / ')}</strong>. Observed {'{u}'} and remaining {'{v}'} form a valid partition; the supplied covariance is positive definite. These are inference results, with no regression training.</FlowReadout>
    <Table caption="Current supplied-state conditional solves; factors and Schur covariance are prepared once" heads={['Source','Original mean (u,v)','Lower factor Luu','Gain','Conditional mean v','Conditional variance v²','Marginal density /u','Updated weight']} rows={state.components.map(c=>[c.id,c.sourceMean.join(', '),String(c.block.observedLower[0][0]),String(c.block.gain),String(c.mean),String(c.variance),String(c.marginal.density),String(c.weight)])}/>
  </FlowLab>;
}

export function GaussianConditionalSpread(){
  const control=useObservedU(),state=conditionalMixture(control.u);
  return <FlowLab id="gmm-d59" label="Conditional total spread includes within-source variance and different source means">
    <Drawing id="D59-bells" name="Updated conditional bells and a mean±SD moment interval" height={575} description={`At u${state.u}, Left/Right conditional means are${state.components.map(c=>c.mean).join(',')}, both variances.75; actual weighted bell areas are${state.components.map(c=>c.weight).join(',')}. Amber is their density sum. The conditional mean is${state.mean}, total variance${state.variance} and SD${state.standardDeviation}. The mean±SD bracket is a moment interval, not an observed draw, credible interval or promised probability region.`}>{w=>{const domain=[-5,9],X=v=>62+(v+5)*(w-93)/14;return <>
      <DensityPlot width={w} domain={domain} ticks={[-4,0,4,8]} name="Conditional density / v-unit" curves={[...state.components.map((c,k)=>({...IDENTITIES[k],areaFill:true,fun:v=>state.componentDensity(k,v)})),{id:'Mixture',color:GOLD,fun:state.density}]} mean={state.mean}/>
      {state.components.map((c,k)=><g key={c.id} fill={IDENTITIES[k].color}><text x="20" y={315+k*31}>{c.id} weighted area {f(c.weight)}</text><Cross x={X(c.mean)} y={205} color={IDENTITIES[k].color}/></g>)}
      <text x="20" y="380" fill={GOLD}>Amber sum · mean {f(state.mean)}</text>
      <path data-moment-interval="true" d={`M${X(state.interval[0])},407 V425 H${X(state.interval[1])} V407`} stroke={GOLD} fill="none"/><Cross x={X(state.mean)} y={425}/>
      <text x="20" y="466" fill={GOLD}>Mean ± SD: {f(state.mean)} ± {f(state.standardDeviation)}</text><text x="20" y="503">Moment interval; no promised mass</text><text x="20" y="540" fill={MUTED}>Finite window · centres are means</text>
    </>;}}</Drawing>
    <Drawing id="D59-spread" name="Within and between-source contributions add as variances" height={535} description={`Within variance is${state.within}. The two weighted squared mean offsets contribute${state.betweenContributions.join(',')}; their sum is between variance${state.between}. Within plus between gives${state.variance} v-units squared. A square root gives SD${state.standardDeviation} in v-units. All bar lengths share the0–3 variance scale; no standard deviations are added.`}>{w=>{const X=x=>62+x*(w-93)/3;return <>
      <text x="20" y="25">Variance contributions (v²)</text>
      {state.components.map((c,k)=><g key={c.id} fill={IDENTITIES[k].color}><text x="20" y={69+k*93}>{c.id}: w·(μᵥ − mean)²</text><text x="20" y={98+k*93}>{f(c.weight)}·({f(c.mean)} − {f(state.mean)})²</text><rect x={X(0)} y={110+k*93} width={X(state.betweenContributions[k])-X(0)} height="15" fill={IDENTITIES[k].color}/></g>)}
      <text x="20" y="280">Within {f(state.within)} + between {f(state.between)}</text>
      <rect x={X(0)} y="302" width={X(state.within)-X(0)} height="24" fill={MUTED}/><rect x={X(state.within)} y="302" width={X(state.variance)-X(state.within)} height="24" fill={GOLD}/>
      {[0,.75,1.5,2.25,3].map(t=><text key={t} x={X(t)} y="355" textAnchor="middle">{t}</text>)}
      <text x="20" y="403">Total variance = {f(state.variance)} v²</text>{arrow(45,420,45,449,GOLD)}<text x="20" y="480">√variance → SD = {f(state.standardDeviation)} v</text><text x="20" y="515" fill={MUTED}>Spread of v; not mean uncertainty</text>
    </>;}}</Drawing>
    <ObservedControl state={control} id="gmm-d59"/>
    <FlowReadout>At u=<strong>{f(state.u)}</strong>, the conditional average is <strong>{f(state.mean)}</strong>. Within <strong>{f(state.within)}</strong> plus between <strong>{f(state.between)}</strong> gives total variance <strong>{f(state.variance)}</strong>; SD is <strong>{f(state.standardDeviation)}</strong>. The mean±SD bracket describes moments, without claiming a credible interval or a fixed coverage probability.</FlowReadout>
    <Table caption="Current conditional moments computed from both updated source weights" heads={['Quantity','Value','Units']} rows={[
      ['Left / Right areas',state.components.map(c=>String(c.weight)).join(' / '),'unit shares'],['Left / Right means',state.components.map(c=>String(c.mean)).join(' / '),'v'],['Conditional mean',String(state.mean),'v'],['Within variance',String(state.within),'v²'],['Between variance',String(state.between),'v²'],['Total variance',String(state.variance),'v²'],['Standard deviation',String(state.standardDeviation),'v'],['Mean ± SD interval',state.interval.map(String).join(' to '),'v; moment interval'],
    ]}/>
  </FlowLab>;
}
