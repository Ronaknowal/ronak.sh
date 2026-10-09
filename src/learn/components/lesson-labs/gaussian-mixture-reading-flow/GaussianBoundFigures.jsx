import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing } from "./GaussianScalarFigures.jsx";
import { MixtureArrow, gaussianMixtureColours } from "./GaussianMixtureFigures.jsx";
import { trialBound, touchingCycle, jensenWitness } from "./gaussian-bound-models.mjs";

const {left:LEFT,right:RIGHT,sum:SUM,ink:INK,reference:REFERENCE}=gaussianMixtureColours;
const colour=[LEFT,RIGHT],number=v=>flowNumber(v,9);

export function GaussianTrialBoundLab() {
  const [share,setShare]=useState(0.5),state=trialBound(share);
  return <FlowLab id="gmm-d52" label="Change auxiliary trial membership while keeping the observed joint contributions fixed">
    <GaussianDrawing id="D52" title="Trial shares multiply fixed log joints and their own negative logarithms" width={820} height={1120} adaptive
      description={`Trial Left share ${share}, Right share ${1-share}; fixed joint densities point3/point1. Expected log joint Q ${state.Q}, entropy H ${state.H}, F Q plus H ${state.F}. Observed log density ell ${state.ell}; KL gap ${state.gap}. Trial q is not a mixture weight. Zero shares contribute zero by a limit. Separate unsupported positive mass on zero joint gives an infinite bound loss.`}>
      {width=>{
        const barWidth=width-70,x=value=>60+(value+3)*(width-90)/3;
        return <>
          <text x="20" y="25">Trial q; fixed joint = (0.3, 0.1)</text>
          <text x="20" y="54" fill={LEFT}>Left q = {number(share)}</text><text x="20" y="82" fill={RIGHT}>Right q = {number(1-share)}</text>
          <rect x="35" y="101" width={barWidth*share} height="16" fill={LEFT}/><rect x={35+barWidth*share} y="101" width={barWidth*(1-share)} height="16" fill={RIGHT}/>
          <text x="20" y="146">One unit of auxiliary membership</text>
          {state.terms.map((term,k)=>{
            const y=184+k*222;
            return <g key={term.id} data-bound-term={term.id} data-bound-share={term.share} data-bound-qterm={term.expectedJoint} data-bound-hterm={term.entropy}>
              <text x="20" y={y} fill={colour[k]}>{term.id}: q = {number(term.share)}</text>
              <text x="20" y={y+30}>× log joint {number(term.logJoint)}</text>
              <MixtureArrow points={[[width/2,y+41],[width/2,y+65]]} color={colour[k]}/>
              <text x="20" y={y+93} fill={colour[k]}>Q contribution: {number(term.expectedJoint)}</text>
              <text x="20" y={y+128}>−q × log q</text>
              <MixtureArrow points={[[width/2,y+139],[width/2,y+160]]} color={colour[k]}/>
              <text x="20" y={y+190} fill={colour[k]}>H contribution: {number(term.entropy)}</text>
            </g>;
          })}
          <text x="20" y="638">Sum Q terms: {number(state.Q)}</text><text x="20" y="669">Sum H terms: {number(state.H)}</text>
          <MixtureArrow points={[[width/2,681],[width/2,705]]}/>
          <text x="20" y="737" fill={SUM}>F = Q + H = {number(state.F)}</text>
          <text x="20" y="775">Common linear log-density ruler</text>
          <line x1={x(-3)} x2={x(0)} y1="835" y2="835" stroke={REFERENCE}/>
          {[-3,-2,-1,0].map(v=><text key={v} x={x(v)} y="867" textAnchor="middle">{v}</text>)}
          <circle data-bound-f={state.F} cx={x(state.F)} cy="835" r="5" fill={SUM}/>
          <circle data-bound-ell={state.ell} cx={x(state.ell)} cy="835" r="7" fill="none" stroke={INK} strokeWidth="2"/>
          <path d={`M${x(state.F)},805 v-10 H${x(state.ell)} v10`} fill="none" stroke={SUM}/>
          <text x="20" y="907" fill={SUM}>Filled point F: {number(state.F)}</text>
          <text x="20" y="937">Open point ℓ: {number(state.ell)}</text>
          <text data-bound-gap={state.gap} x="20" y="967">Bracket gap ℓ − F: {number(state.gap)}</text>
          <text x="20" y="1005">q = 0: its Q and H terms are 0.</text>
          <text x="20" y="1044">Separate unsupported example:</text>
          <text x="20" y="1073">qRight = 0.5, jointRight = 0</text>
          <text x="20" y="1102">Q = −∞, F = −∞; no finite point</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls><FlowSlider name="Trial Left membership q" value={share} onChange={setShare} min={0} max={1} step={0.01}/><button type="button" onClick={()=>setShare(0.5)}>Reset</button></FlowControls>
    <FlowReadout>Trial membership <strong>{number(share)}</strong> gives bound <strong>{number(state.F)}</strong> and gap <strong>{number(state.gap)}</strong>; the observed log density stays <strong>{number(state.ell)}</strong> because its joint contributions have not changed.</FlowReadout>
  </FlowLab>;
}

export function GaussianTouchingBoundLadder() {
  const state=touchingCycle(),stages=[{name:'Old touching state',...state.old},{name:'M: old q stays fixed',...state.afterM},{name:'E: new θ stays fixed',...state.afterE}];
  return <GaussianDrawing id="D53" title="Old touching bound, M improvement and E touching equality on one numerical scale" width={900} height={width=>width<750?2215:985} adaptive
    description={`Actual four-row cycle: old Q ${state.old.Q}, H ${state.old.H}, F equals ell ${state.old.ell}; M with old q Q ${state.afterM.Q}, H ${state.afterM.H}, F ${state.afterM.F}, ell ${state.afterM.ell}; fresh E Q ${state.afterE.Q}, H ${state.afterE.H}, F equals same new ell. All marks use linear vertical nats from minus9 to2. Bound gain ${state.boundGain}, likelihood gain ${state.likelihoodGain}, remaining gap ${state.gap}.`}>
    {width=>{
      const stacked=width<750,panelWidth=stacked?width:width/3;
      return <>
        {stages.map((stage,k)=>{
          const offset=stacked?k*615:0,origin=stacked?0:k*panelWidth,y=v=>offset+75+(2-v)*34;
          const ports=[{label:'Q',value:stage.Q,x:origin+96,colour:LEFT},{label:'H',value:stage.H,x:origin+134,colour:RIGHT},{label:'F',value:stage.F,x:origin+172,colour:SUM},{label:'ℓ',value:stage.ell,x:origin+210,colour:INK}];
          return <g key={stage.name} data-bound-stage={k}>
            <text x={origin+20} y={offset+25}>{stage.name}</text><text x={origin+20} y={offset+54}>Linear log units · nats</text>
            <line x1={origin+63} x2={origin+63} y1={y(2)} y2={y(-9)} stroke={REFERENCE}/>
            {[2,0,-3,-6,-9].map(v=><g key={v}><text x={origin+52} y={y(v)+5} textAnchor="end">{v}</text><line x1={origin+63} x2={origin+panelWidth-20} y1={y(v)} y2={y(v)} stroke={REFERENCE} strokeDasharray="2 6"/></g>)}
            {ports.map(port=><g key={port.label} data-bound-value={port.label} data-bound-number={port.value}>
              <line x1={port.x} x2={port.x} y1={y(0)} y2={y(port.value)} stroke={port.colour}/>
              <circle cx={port.x} cy={y(port.value)} r="5" fill={port.label==='ℓ'?'none':port.colour} stroke={port.colour} strokeWidth="2"/>
              <text x={port.x} y={offset+486} textAnchor="middle" fill={port.colour}>{port.label}</text>
              <text x={origin+20} y={offset+519+ports.indexOf(port)*26} fill={port.colour}>{port.label}: {number(port.value)}</text>
            </g>)}
            {k===1&&<path d={`M${origin+172},${y(stage.F)} H${origin+210} V${y(stage.ell)}`} fill="none" stroke={SUM} strokeWidth="2"/>}
          </g>;
        })}
        {(()=>{const y=stacked?1870:640;return <>
          <text x="20" y={y}>Old q held through M; E refreshes q.</text>
          <text x="20" y={y+30}>Bound gain: {number(state.boundGain)}</text>
          <text x="20" y={y+60}>ℓ gain: {number(state.likelihoodGain)}</text>
          <text x="20" y={y+90}>M gap, closed by E: {number(state.gap)}</text>
          <text x="20" y={y+130}>Expanded bound-only linear ruler</text>
          <line x1="63" x2="63" y1={y+165} y2={y+265} stroke={REFERENCE}/>
          {[-7.2,-6.8,-6.4].map(value=><text key={value} x="52" y={y+165+(-6.4-value)*125+5} textAnchor="end">{value}</text>)}
          {[[100,state.old.ell,'old ℓ'],[160,state.afterM.F,'new F'],[220,state.afterM.ell,'new ℓ']].map(([x,value,label])=><g key={label}>
            <circle data-bound-inequality={label} data-bound-number={value} cx={x} cy={y+165+(-6.4-value)*125} r="5" fill={label==='new F'?SUM:INK}/>
            <text x={x} y={y+300} textAnchor="middle">{label}</text>
          </g>)}
          <MixtureArrow color={SUM} points={[[105,y+165+(-6.4-state.old.ell)*125],[155,y+165+(-6.4-state.afterM.F)*125]]}/>
          <MixtureArrow color={SUM} points={[[165,y+165+(-6.4-state.afterM.F)*125],[215,y+165+(-6.4-state.afterM.ell)*125]]}/>
          <text x="20" y={y+329}>Arrows: new ℓ ≥ new F ≥ old ℓ.</text>
        </>;})()}
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianJensenGeometry() {
  const state=jensenWitness();
  return <GaussianDrawing id="D54" title="The logarithm of an average sits above the chord's weighted log height" width={820} height={655} adaptive
    description={`Fixed joint contributions point3 and point1, trial shares one half each, ratios point6 and point2. The chord midpoint at coordinate point4 has height ${state.weightedLogs}; log point4 is ${state.logAverage}. Their vertical gap is ${state.gap}. The log curve is concave; this does not claim global mixture-parameter concavity. Zero q terms are limits outside the finite-ratio picture.`}>
    {width=>{
      const x=v=>70+(v-0.1)*(width-110)/0.6,y=v=>335-(v+2.5)*225/2.25;
      const curve=Array.from({length:91},(_,i)=>{const value=0.1+i*0.6/90;return `${i?'L':'M'}${x(value)},${y(Math.log(value))}`;}).join(' ');
      return <>
        <text x="20" y="25">Ratios = joint / trial q</text><text x="20" y="54">0.3 / 0.5 = 0.6; 0.1 / 0.5 = 0.2</text>
        <line x1="70" x2="70" y1="85" y2="335" stroke={REFERENCE}/><line x1="70" x2={width-40} y1="335" y2="335" stroke={REFERENCE}/>
        {[-2,-1.5,-1,-0.5].map(v=><text key={v} x="57" y={y(v)+5} textAnchor="end">{v}</text>)}
        {[0.1,0.2,0.4,0.6,0.7].map(v=><text key={v} x={x(v)} y="366" textAnchor="middle">{v}</text>)}
        <path d={curve} fill="none" stroke={INK} strokeWidth="2"/>
        <line x1={x(0.2)} y1={y(Math.log(0.2))} x2={x(0.6)} y2={y(Math.log(0.6))} stroke={RIGHT} strokeWidth="2"/>
        {[0.2,0.6].map(v=><circle key={v} cx={x(v)} cy={y(Math.log(v))} r="5" fill={INK}/>)}
        <circle cx={x(0.4)} cy={y(state.weightedLogs)} r="5" fill={RIGHT}/><circle cx={x(0.4)} cy={y(state.logAverage)} r="5" fill={SUM}/>
        <line data-jensen-gap={state.gap} x1={x(0.4)} x2={x(0.4)} y1={y(state.weightedLogs)} y2={y(state.logAverage)} stroke={SUM} strokeWidth="3"/>
        <text x="20" y="407">Horizontal: joint / q · linear</text><text x="20" y="437">Vertical: natural log · linear</text>
        <text x="20" y="476" fill={INK}>Light curve: log of the coordinate</text>
        <text x="20" y="506" fill={RIGHT}>Blue chord: average log {number(state.weightedLogs)}</text>
        <text x="20" y="536" fill={SUM}>Amber: log average {number(state.logAverage)}</text>
        <text x="20" y="566">Vertical gap: {number(state.gap)}</text>
        <text x="20" y="605">Posterior q: both ratios become 0.4.</text>
        <text x="20" y="634">q = 0 uses a limit, not a finite ratio.</text>
      </>;
    }}
  </GaussianDrawing>;
}
