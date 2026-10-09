import {useState} from 'react';
import {FlowLab,FlowControls,FlowSlider,FlowReadout,flowNumber} from "../LessonFlow.jsx";
import {GaussianDrawing} from "./GaussianScalarFigures.jsx";
import {MixtureArrow,gaussianMixtureColours} from "./GaussianMixtureFigures.jsx";
import {distanceMembership,hardSoftCentreUpdate} from "./gaussian-distance-models.mjs";
const {left:LEFT,right:RIGHT,sum:SUM,ink:INK,reference:REFERENCE}=gaussianMixtureColours,colour=[LEFT,RIGHT];
const number=v=>v!==0&&Math.abs(v)<1e-7?v.toExponential(6).replace(/-/g,'−'):flowNumber(v,9);

export function GaussianDistanceMembershipLab() {
  const [query,setQuery]=useState(1),[variance,setVariance]=useState(1),state=distanceMembership(query,variance),tie=distanceMembership(1.5,variance,[0.2,0.8]);
  return <FlowLab id="gmm-d55" label="Move a query and change a fixed shared variance to see its distance-based membership">
    <GaussianDrawing id="D55" title="Squared distance penalties and positive fixed priors feed a stable membership softmax" width={850} height={width=>width<700?1765:1320} adaptive
      description={`New fixed centres zero/three, query ${query}, shared variance ${variance}, equal prior weights. Squared distances ${state.terms.map(t=>t.square)}, negative penalties ${state.terms.map(t=>t.penalty)}, membership ${state.terms.map(t=>t.share)}. A separate exact midpoint with positive unequal priors point2/point8 keeps their ratio. No zero variance or fitted update is represented.`}>
      {width=>{
        const x=v=>45+(v+1)*(width-85)/5,barWidth=width-70,narrow=width<700;
        const normalizationY=narrow?1180:740;
        return <>
          <text x="20" y="25">New fixed centres: 0 and 3</text><text x="20" y="54">Query diamond; equal prior weights</text>
          <line x1={x(-1)} x2={x(4)} y1="117" y2="117" stroke={REFERENCE}/>
          {state.terms.map((term,k)=><g key={term.id}><circle cx={x(term.mean)} cy="117" r="5" fill={colour[k]}/><text x={x(term.mean)} y="90" textAnchor="middle" fill={colour[k]}>{term.id}</text></g>)}
          <path data-distance-query={query} d={`M${x(query)},107 l7,10 l-7,10 l-7,-10 Z`} fill="none" stroke={SUM} strokeWidth="2"/>
          {[-1,0,1,2,3,4].map(v=><text key={v} x={x(v)} y="153" textAnchor="middle">{v}</text>)}
          {state.terms.map((term,k)=>{const y=176+k*30;return <g key={term.id} stroke={colour[k]}>
            <line x1={x(term.mean)} x2={x(query)} y1={y} y2={y}/>
            <line x1={x(term.mean)} x2={x(term.mean)} y1={y-5} y2={y+5}/>
            <line x1={x(query)} x2={x(query)} y1={y-5} y2={y+5}/>
          </g>;})}
          <text x="20" y="243">Coloured spans: centre to query.</text>
          <text x="20" y="273">Query {number(query)}; shared v {number(variance)}</text>
          {state.terms.map((term,k)=>{const y=318+(narrow?k*440:0),left=narrow?20:20+k*width/2,laneWidth=narrow?width-40:width/2-40,side=Math.abs(query-term.mean)*20;return <g key={term.id} data-distance-term={term.id} data-distance-square={term.square} data-distance-penalty={term.penalty} data-distance-share={term.share}>
            <text x={left} y={y} fill={colour[k]}>{term.id}: x − {term.mean} = {number(query-term.mean)}</text>
            <text x={left} y={y+30}>Square side = absolute distance</text>
            <rect x={left} y={y+60} width={side} height={side} fill={colour[k]} fillOpacity="0.18" stroke={colour[k]} data-distance-area={term.square}/>
            {Array.from({length:Math.floor(Math.abs(query-term.mean))},(_,i)=>(i+1)*20).filter(offset=>offset<side).map(offset=><g key={offset} stroke={colour[k]} opacity="0.4"><line x1={left+offset} x2={left+offset} y1={y+60} y2={y+60+side}/><line x1={left} x2={left+side} y1={y+60+offset} y2={y+60+offset}/></g>)}
            {side===0&&<text x={left} y={y+100}>Zero side: zero area</text>}
            <text x={left+102} y={y+84}>1 grid step = 1</text>
            <text x={left+102} y={y+139}>coordinate unit</text>
            <text x={left+102} y={y+113}>Side {number(Math.abs(query-term.mean))}</text>
            <text x={left} y={y+170} fill={colour[k]}>Area = distance² = {number(term.square)}</text>
            <MixtureArrow color={colour[k]} points={[[left+laneWidth/2,y+182],[left+laneWidth/2,y+202]]}/>
            <text x={left} y={y+230}>−area / (2v) = {number(term.penalty)}</text>
            <text x={left} y={y+260}>Add log prior {number(term.logPrior)}</text>
            <text x={left} y={y+290} fill={colour[k]}>Logit = {number(term.logit)}</text>
            <text x={left} y={y+320}>Subtract max: {number(term.shift)}</text>
            <MixtureArrow color={colour[k]} points={[[left+laneWidth/2,y+333],[left+laneWidth/2,y+353]]}/>
            <text x={left} y={y+383} fill={colour[k]}>Exponentiate: {number(term.shiftedExponential)}</text>
          </g>;})}
          <text x="20" y={normalizationY}>Common sum: {number(state.denominator)}</text>
          <MixtureArrow points={[[width/2,normalizationY+12],[width/2,normalizationY+35]]}/>
          <text x="20" y={normalizationY+65}>Divide each exponential by this sum</text>
          <rect x="35" y={normalizationY+90} width={barWidth*state.terms[0].share} height="16" fill={LEFT}/><rect x={35+barWidth*state.terms[0].share} y={normalizationY+90} width={barWidth*state.terms[1].share} height="16" fill={RIGHT}/>
          <text x="20" y={normalizationY+145} fill={LEFT}>First share: {number(state.terms[0].share)}</text><text x="20" y={normalizationY+175} fill={RIGHT}>Second share: {number(state.terms[1].share)}</text>
          <text x="20" y={normalizationY+215}>A midpoint query 1.5 ties distances.</text>
          <text x="20" y={normalizationY+245}>Equal priors keep its shares 0.5/0.5.</text>
          <text x="20" y={normalizationY+285}>Separate midpoint; priors 0.2/0.8:</text>
          <rect x="35" y={normalizationY+310} width={barWidth*tie.terms[0].share} height="16" fill={LEFT}/><rect x={35+barWidth*tie.terms[0].share} y={normalizationY+310} width={barWidth*tie.terms[1].share} height="16" fill={RIGHT}/>
          <text x="20" y={normalizationY+360} fill={LEFT}>First {number(tie.terms[0].share)}</text><text x="20" y={normalizationY+390} fill={RIGHT}>Second {number(tie.terms[1].share)}</text>
          <text x="20" y={normalizationY+430}>Positive variance; fixed centres/priors.</text><text x="20" y={normalizationY+460}>Small v sharpens a unique distance gap.</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls><FlowSlider name="Query coordinate x" value={query} onChange={setQuery} min={-1} max={4} step={0.1}/><FlowSlider name="Fixed shared variance v" value={variance} onChange={setVariance} min={0.05} max={4} step={0.05}/><button type="button" onClick={()=>{setQuery(1);setVariance(1);}}>Reset</button></FlowControls>
    <FlowReadout>At query <strong>{number(query)}</strong> and shared variance <strong>{number(variance)}</strong>, First receives <strong>{number(state.terms[0].share)}</strong> and Second <strong>{number(state.terms[1].share)}</strong>; fixed centres and priors make the distance gap responsible for this change.</FlowReadout>
  </FlowLab>;
}

export function GaussianHardSoftCentreComparison() {
  const state=hardSoftCentreUpdate();
  return <GaussianDrawing id="D56" title="The same observations contribute whole hard membership or fractional soft membership to one centre update" width={850} height={1220} adaptive
    description="Observations A toD remain at minus2,minus1,plus1,plus2, initial centres minus1/plus1. Hard membership allocates first two Left and last two Right, giving means minus1.5/plus1.5. Finite-soft membership at fixed variance one gives means minus1.344824658/plus1.344824658. Each lane has count2; signed weighted contributions are divided by count. A hard exact tie chooses first ID, soft equal-prior tie shares equally. No whole trainer or learned-covariance equivalence is claimed.">
    {width=>{
      const x=v=>45+(v+3)*(width-85)/6,barWidth=width-135;
      return <>
        <text x="20" y="25">Same rows and initial centres −1/+1</text>
        <line x1={x(-3)} x2={x(3)} y1="102" y2="102" stroke={REFERENCE}/>
        {state.observations.map(row=><g key={row.id}><text x={x(row.x)} y="81" textAnchor="middle">{row.id}</text><circle cx={x(row.x)} cy="102" r="5" fill={INK}/><text x={x(row.x)} y="133" textAnchor="middle">{row.x}</text></g>)}
        <text x="20" y="173">Teal Left; blue Right; each bar totals 1.</text>
        {state.observations.map((row,n)=>{const y=218+n*137,hard=state.hardRows[n].shares,soft=state.softRows[n].components.map(c=>c.share);return <g key={row.id}>
          <text x="20" y={y}>{row.id} at {row.x}</text>
          <text x="20" y={y+32}>Hard</text><rect x="95" y={y+20} width={barWidth*hard[0]} height="14" fill={LEFT}/><rect x={95+barWidth*hard[0]} y={y+20} width={barWidth*hard[1]} height="14" fill={RIGHT}/>
          <text x="20" y={y+65}>Soft</text><rect x="95" y={y+53} width={barWidth*soft[0]} height="14" fill={LEFT}/><rect x={95+barWidth*soft[0]} y={y+53} width={barWidth*soft[1]} height="14" fill={RIGHT}/>
          <text x="20" y={y+99}>Soft shares {number(soft[0])} / {number(soft[1])}</text>
        </g>;})}
        <text x="20" y="777">Signed products sum; divide by count 2.</text>
        {state.hard.map((hard,k)=>{const soft=state.soft[k],y=817+k*86;return <g key={hard.id}>
          <text x="20" y={y} fill={colour[k]}>{hard.id} hard: {number(hard.numerator)} / 2 = {number(hard.mean)}</text>
          <text x="20" y={y+30} fill={colour[k]}>{hard.id} soft: {number(soft.numerator)} / 2 = {number(soft.mean)}</text>
          <text x="20" y={y+58}>Both start at {state.parameters.means[k]}.</text>
        </g>;})}
        <line x1={x(-3)} x2={x(3)} y1="1047" y2="1047" stroke={REFERENCE}/>
        {state.hard.map((hard,k)=><g key={hard.id} data-centre-update={hard.id} data-hard-mean={hard.mean} data-soft-mean={state.soft[k].mean}>
          <circle cx={x(hard.mean)} cy="1047" r="6" fill="none" stroke={colour[k]} strokeWidth="2"/><circle cx={x(state.soft[k].mean)} cy="1047" r="4" fill={colour[k]}/>
          <MixtureArrow color={colour[k]} points={[[x(state.parameters.means[k]),1015],[x(hard.mean),1015]]}/>
        </g>)}
        {[-3,-2,-1,0,1,2,3].map(v=><text key={v} x={x(v)} y="1080" textAnchor="middle">{v}</text>)}
        <text x="20" y="1117">Open: hard mean; filled: soft mean.</text>
        <text x="20" y="1147">Arrow: initial centre → hard update.</text>
        <text x="20" y="1181">Tie at 0: hard Left; soft 0.5/0.5.</text>
        <text x="20" y="1209">One update; no learned-variance claim.</text>
      </>;
    }}
  </GaussianDrawing>;
}
