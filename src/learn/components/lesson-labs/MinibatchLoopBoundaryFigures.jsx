import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { MinibatchDrawing, MbOperand, MbOperation, MbArray, MbWire, MinibatchTable, mbColors } from './MinibatchLoopFlowFigures.jsx';
import { minibatchNumber as f, constructedDropout } from '../../data/minibatch-loop-flow-models.js';

export function MinibatchInfluenceDrawing() {
  return <><MinibatchDrawing label="Row coefficients share the same zero to one-half scale" width={620} height={320}>{() => <>
    {[['a',1/3,1/4],['b',1/3,1/4],['c',1/3,1/2]].map(([id,correct,wrong],i)=><g key={id}>
      <text x="8" y={58+i*85}>Row {id}</text><path d={`M95 ${28+i*85} v55 M95 ${55+i*85} h360`} stroke="#888" />
      <rect x="95" y={30+i*85} width={correct*720} height="17" fill={mbColors.credit}/><text x="470" y={46+i*85}>row mean: 1/3</text>
      <rect x="95" y={60+i*85} width={wrong*720} height="17" fill={mbColors.value}/><text x="470" y={76+i*85}>chunk mean: {i===2?'1/2':'1/4'}</text>
    </g>)}<text x="95" y="301">0</text><text x="410" y="301">1/2 mass</text>
  </>}</MinibatchDrawing><MinibatchTable caption="Exact influence before differentiating" headers={['Row','Example mean','Equal chunk means']} rows={[['a','1/3','1/4'],['b','1/3','1/4'],['c','1/3','1/2']]} /></>;
}

export function MinibatchLifetimeDrawing() {
  return <MinibatchDrawing label="Fresh row values are released while parameter-sized stores survive" width={700} height={480}>{marker=><>
    <MbOperand x={8} y={35} label="Persistent old w" value={0} role="parameter" width={180}/><MbOperand x={248} y={35} label="Persistent G after A" value={-2/3} role="credit" width={180}/><MbOperand x={488} y={35} label="Persistent optimizer v" value="not initialized" role="neutral" width={200}/>
    <MbArray x={8} y={150} label="A: predictions for a,b" values={[0,0]} cellWidth={130}/><MbArray x={360} y={150} label="A: residuals for a,b" values={[-2,0]} cellWidth={130}/>
    <MbWire marker={marker} d="M268 170 H360"/><MbWire marker={marker} reverse d="M488 190 V230 H338 V77"/>
    <path d="M8 130 H640 V208 H8 Z" fill="none" stroke="#aaa" strokeDasharray="5 5"/><text x="8" y="260" className="mb-small">After backward, A's saved forward cells can be released.</text>
    <MbArray x={8} y={330} label="Fresh B: prediction c" values={[0]} cellWidth={180}/><MbArray x={360} y={330} label="Fresh B: residual c" values={[-1]} cellWidth={180}/>
    <MbWire marker={marker} d="M188 350 H360"/><MbWire marker={marker} reverse d="M540 350 H670 V95 H338 V77"/>
    <text x="8" y="438" className="mb-small">B contributes −1 to surviving G: −2/3 + (−1) = −5/3.</text>
    <text x="8" y="470" className="mb-small">Release concerns graph values; allocator reservation is a separate question.</text>
  </>}</MinibatchDrawing>;
}

export function MinibatchLateMassDrawing() {
  return <MinibatchDrawing label="Raw numerator and actual mass are added separately before division" width={650} height={420}>{marker=><>
    <MbArray x={8} y={35} label="Chunk raw credit sums" values={[-2,-3]} role="credit" cellWidth={140}/><MbArray x={350} y={35} label="Chunk actual row counts" values={[2,1]} role="neutral" cellWidth={140}/>
    <MbWire marker={marker} reverse d="M146 75 V140"/><MbOperation x={146} y={140} label="Σ"/><MbWire marker={marker} d="M488 75 V140"/><MbOperation x={488} y={140} label="Σ"/>
    <MbWire marker={marker} reverse d="M146 180 V190 H36 V240 H56"/><MbOperand x={56} y={220} label="Persistent raw G" value={-5} role="credit" width={180}/><MbWire marker={marker} d="M488 180 V190 H590 V240 H578"/><MbOperand x={398} y={220} label="Persistent mass D" value={3} role="neutral" width={180}/>
    <MbWire marker={marker} reverse d="M146 260 V320 H274"/><MbWire marker={marker} d="M488 260 V320 H346"/><MbOperation x={310} y={300} label="÷ D"/>
    <text x="8" y="390" className="mb-small">Boundary g=−5/3; zero local mass adds zero to both rails.</text>
  </>}</MinibatchDrawing>;
}

export function MinibatchLoopDrawing() {
  const chunks=[[1,2,3,4],[5,6,7,8],[9,10]];
  return <MinibatchDrawing label="Actual ten-row traversal has an eight-row group and two-row tail" width={680} height={460}>{marker=><>
    {chunks.map((rows,i)=><g key={i}><MbArray x={8} y={42+i*98} label={`Fresh forward/backward ${i+1}`} values={rows} role="input" cellWidth={53}/><MbWire marker={marker} reverse d={`M${8+rows.length*53-4} ${62+i*98} H315`}/><MbOperand x={315} y={42+i*98} label={`Divide loss sum by ${i<2?8:2}`} value={`G += chunk/${i<2?8:2}`} role="credit" width={220}/>{i!==0&&<MbWire marker={marker} d={`M535 ${62+i*98} H596`}/>}</g>)}
    <path d="M548 20 h15 v162 h-15 M548 216 h15 v66 h-15" fill="none" stroke="#aaa"/><text x="587" y="165">step 1</text><text x="587" y="263">step 2</text>
    <MbOperand x={8} y={370} label="Epoch boundary" value="10 rows delivered" role="neutral" width={240}/><MbOperand x={345} y={370} label="Completed update clock" value="2 steps; 3 backwards" role="neutral" width={285}/>
  </>}</MinibatchDrawing>;
}

export function MinibatchTargetDrawing() {
  return <MinibatchDrawing label="Two sequences expose eligible versus padded tensor slots" width={720} height={310}>{marker=><>
    {[2,6].map((count,i)=><g key={i}><text x="8" y={52+i*82}>{i?'B':'A'}</text>{Array.from({length:6},(_,j)=><g key={j}><rect x={50+j*66} y={25+i*82} width="56" height="40" fill="none" stroke={j<count?mbColors.input:'#777'}/><text x={78+j*66} y={51+i*82} textAnchor="middle">{j<count?'✓':'pad'}</text>{j>=count&&<path d={`M${50+j*66} ${25+i*82} l56 40`} stroke="#aaa"/>}</g>)}<MbWire marker={marker} d={`M440 ${45+i*82} H510`}/><text x="525" y={51+i*82}>{count} targets; sum {i?18:2}</text></g>)}
    <text x="8" y="224">Token mean: (2+18)/(2+6) = 2.5, D=8.</text><text x="8" y="260">Sequence mean: (2/2+18/6)/2 = 2.</text><text x="8" y="297" className="mb-small">All-slot division by 12 counts four padding slots as supervision.</text>
  </>}</MinibatchDrawing>;
}
export function MinibatchLossAlignmentDrawing() {
  return <div className="mb-scenes"><MinibatchDrawing label="Class-index weights supply actual eligible target mass" height={330}>{()=><>
    <MbArray x={8} y={35} label="Class-index targets" values={['0','1','1','ignore']} columns={2} role="input" cellWidth={142}/><MbArray x={8} y={175} label="Selected target weights" values={[1,3,3,0]} columns={2} role="input" cellWidth={142}/><text x="8" y="315">Actual D = 1+3+3 = 7.</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="Causal prediction positions align with the next labels" width={420} height={330}>{marker=><>
    <MbArray x={8} y={35} label="Supplied tokens" values={['BOS','cat','sat','pad']} role="input" cellWidth={98}/><MbArray x={8} y={180} label="" values={['→cat','→sat','ignore','none']} cellWidth={98}/>
    {[0,1].map(i=><MbWire key={i} marker={marker} d={`M${57+i*98} 180 V110 H${155+i*98} V77`}/>)}<text x="8" y="254" className="mb-small">Prediction at each position</text><text x="8" y="298" className="mb-small">Two shifted labels supply group mass.</text>
  </>}</MinibatchDrawing></div>;
}

export function MinibatchDropoutInvestigation() {
  const [mode,setMode]=useState('kept'),r=constructedDropout(mode);
  return <FlowLab label="Inspect a stipulated realized dropout mask"><MinibatchDrawing label="Binary keep decisions multiply actual supplied activations" width={650} height={395}>{marker=><>
    <MbArray x={8} y={35} label="Supplied x" values={r.x} role="input" cellWidth={145}/><MbArray x={8} y={145} label={mode==='disabled'?'Bypass: no mask applied':'Realized keep mask; kept values multiply by 2'} values={mode==='disabled'?['—','—','—','—']:r.mask} role="input" cellWidth={145}/><MbArray x={8} y={255} label="Actual downstream activations" values={r.activations} cellWidth={145}/>
    {r.x.map((_,i)=><MbWire marker={marker} key={i} d={`M${78+i*145} 75 V143 M${78+i*145} 185 V253`}/>)}<text x="8" y="369">Mean θ credit at θ=1: {f(r.gradient)}; targets [1,0,1,0].</text>
  </>}</MinibatchDrawing><FlowControls>{[['kept','Keep rows 1 and 3'],['complement','Keep rows 2 and 4'],['disabled','Disable dropout']].map(([key,label])=><button type="button" key={key} aria-pressed={mode===key} onClick={()=>setMode(key)}>{label}</button>)}</FlowControls><FlowReadout>Row derivatives are [{r.derivatives.map(v=>f(v)).join(', ')}]. An aligned realized mask leaves this sum unchanged when physical boundaries move.</FlowReadout></FlowLab>;
}

export function MinibatchRunningDrawing() {
  return <div className="mb-scenes">{[['Full',6,.6],['First pair',1,.1],['Second pair',11,1.19]].map(([label,mean,result],i)=><MinibatchDrawing key={label} label={`${label}: running mean transition`} width={650} height={575}>{marker=><>
    <MbOperand x={8} y={35} label="Old running mean" value={i===2?.1:0} role="neutral" width={132}/><MbOperand x={160} y={35} label="Old-state factor" value={.9} role="neutral" width={132}/>
    <MbOperand x={330} y={35} label="Current mean" value={mean} width={132}/><MbOperand x={482} y={35} label="New-data factor" value={.1} role="neutral" width={132}/>
    <MbWire marker={marker} d="M74 75 V140 H114"/><MbWire marker={marker} d="M226 75 V140 H186"/><MbOperation x={150} y={120} label="×"/>
    <MbWire marker={marker} d="M396 75 V140 H444"/><MbWire marker={marker} d="M548 75 V140 H516"/><MbOperation x={480} y={120} label="×"/>
    <MbWire marker={marker} d="M150 160 V185 H0 V255 H8"/><MbOperand x={8} y={235} label="Old-state contribution" value={.9*(i===2?.1:0)} role="neutral" width={280}/>
    <MbWire marker={marker} d="M480 160 V185 H638 V255 H610"/><MbOperand x={330} y={235} label="Current-mean contribution" value={.1*mean} width={280}/>
    <MbWire marker={marker} d="M148 275 V370 H274"/><MbWire marker={marker} d="M470 275 V370 H346"/><MbOperation x={310} y={350} label="+"/>
    <MbWire marker={marker} d="M310 390 V410 H0 V475 H200"/><MbOperand x={200} y={455} label="New running mean" value={result} width={220}/><text x="8" y="555" className="mb-small">{i===2?'Two physical forwards: .9×.1 + .1×11 = 1.19':'One physical forward: .9×0 + .1×'+mean+' = '+result}</text>
  </>}</MinibatchDrawing>)}</div>;
}

export function MinibatchCurvatureDrawing() {
  const points=Array.from({length:61},(_,i)=>{const w=-.5+i/60;return [w,(.5*(w-2)**2+.5*(2*w)**2+.5*(3*w-1)**2)/3];});
  const X=w=>65+(w+.5)*460,Y=l=>330-l*90;
  return <MinibatchDrawing label="Analytic scalar half-square objective has curvature fourteen thirds" width={620} height={440}>{()=><>
    <path d="M65 35 V330 H545" fill="none" stroke="#aaa"/><path d={points.map(([w,l],i)=>`${i?'L':'M'}${X(w)} ${Y(l)}`).join(' ')} fill="none" stroke={mbColors.value} strokeWidth="3"/>
    {[[-.5,'−.5'],[0,'0'],[.5,'.5']].map(([w,label])=><g key={label}><path d={`M${X(w)} 330 v8`} stroke="#aaa"/><text x={X(w)} y="364" textAnchor="middle">{label}</text></g>)}<text x="8" y="25">Mean loss L(w)</text><text x="490" y="392">Weight w</text><circle cx={X(0)} cy={Y(5/6)} r="6" fill={mbColors.parameter}/><text x="320" y="195">w=0, L=5/6</text><text x="8" y="429">Derived quadratic: L(w)=(7/3)w²−(5/3)w+5/6; H=14/3.</text>
  </>}</MinibatchDrawing>;
}

export function MinibatchClippingDrawing() {
  return <div className="mb-scenes"><MinibatchDrawing label="Sum first: clipping is nonlinear" height={540}>{marker=><>
    <MbArray x={8} y={35} label="Same raw chunk credits" values={[3,-2.5]} role="credit" cellWidth={142}/>
    <MbWire marker={marker} reverse d="M77 75 V140 H114"/><MbWire marker={marker} reverse d="M219 75 V140 H186"/><MbOperation x={150} y={120} label="+"/>
    <MbWire marker={marker} reverse d="M150 160 V180 H0 V240 H60"/><MbOperand x={60} y={220} label="Completed sum" value={.5} role="credit" width={180}/>
    <MbWire marker={marker} reverse d="M150 260 V320"/><MbOperation x={150} y={320} label="clip |g| ≤ 1" width={230}/>
    <MbWire marker={marker} reverse d="M150 360 V380 H0 V445 H60"/><MbOperand x={60} y={425} label="Clip the complete gradient" value={.5} role="credit" width={180}/><text x="8" y="520" className="mb-small">clip(3−2.5)=.5</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="Clip each first: clipping is nonlinear" height={565}>{marker=><>
    <MbArray x={8} y={35} label="Same raw chunk credits" values={[3,-2.5]} role="credit" cellWidth={142}/>
    <MbWire marker={marker} reverse d="M77 75 V140"/><MbWire marker={marker} reverse d="M219 75 V140"/><MbOperation x={77} y={140} label="clip ±1" width={132}/><MbOperation x={219} y={140} label="clip ±1" width={132}/>
    <MbWire marker={marker} reverse d="M77 180 V205 H0 V265 H8"/><MbWire marker={marker} reverse d="M219 180 V205 H296 V265 H292"/><MbOperand x={8} y={245} label="Clipped row 1" value={1} role="credit" width={132}/><MbOperand x={160} y={245} label="Clipped row 2" value={-1} role="credit" width={132}/>
    <MbWire marker={marker} reverse d="M74 285 V365 H114"/><MbWire marker={marker} reverse d="M226 285 V365 H186"/><MbOperation x={150} y={345} label="+"/>
    <MbWire marker={marker} reverse d="M150 385 V410 H0 V475 H60"/><MbOperand x={60} y={455} label="Sum after separate clipping" value={0} role="credit" width={180}/><text x="8" y="545" className="mb-small">clip(3)+clip(−2.5)=1−1=0</text>
  </>}</MinibatchDrawing></div>;
}

export function MinibatchAmpDrawing() {
  return <MinibatchDrawing label="One scale and one boundary protect gradient units" width={650} height={1290}>{marker=><>
    <MbOperand x={8} y={35} label="Accumulated raw numerator G" value={-5} role="credit" width={260}/><MbOperand x={350} y={35} label="Supplied positive scale s" value={128} role="neutral" width={260}/>
    <MbWire marker={marker} reverse d="M138 75 V160 H274"/><MbWire marker={marker} d="M480 75 V160 H346"/><MbOperation x={310} y={140} label="×"/>
    <MbWire marker={marker} reverse d="M310 180 V195 H0 V265 H8"/><MbOperand x={8} y={245} label="Scaled accumulated numerator" value={-640} role="credit" width={260}/><MbOperand x={350} y={245} label="The same scale s" value={128} role="neutral" width={260}/>
    <MbWire marker={marker} reverse d="M138 285 V370 H274"/><MbWire marker={marker} d="M480 285 V370 H346"/><MbOperation x={310} y={350} label="÷ s"/>
    <MbWire marker={marker} reverse d="M310 390 V405 H0 V475 H8"/><MbOperand x={8} y={455} label="Unscaled raw numerator G" value={-5} role="credit" width={260}/><MbOperand x={350} y={455} label="Actual late mass D" value={3} role="neutral" width={260}/>
    <MbWire marker={marker} reverse d="M138 495 V580 H274"/><MbWire marker={marker} d="M480 495 V580 H346"/><MbOperation x={310} y={560} label="÷ D"/>
    <MbWire marker={marker} reverse d="M310 600 V615 H0 V685 H190"/><MbOperand x={190} y={665} label="Normalized objective credit g" value={-5/3} role="credit" width={240}/>
    <MbWire marker={marker} reverse d="M310 705 V765"/><MbOperation x={310} y={765} label="clip |g| ≤ 1" width={280}/>
    <MbWire marker={marker} reverse d="M310 805 V825 H0 V890 H190"/><MbOperand x={190} y={870} label="Completed clipped credit" value={-1} role="credit" width={240}/>
    <MbWire marker={marker} reverse d="M310 910 V990"/><MbOperation x={310} y={990} label="Attempt step" width={220}/>
    <MbWire marker={marker} d="M310 1030 V1130 H278"/><MbOperand x={8} y={1110} label="Accepted" value="w,v,tick advance" role="neutral" width={270}/><MbWire marker={marker} d="M310 1030 V1130 H360"/><MbOperand x={360} y={1110} label="Skipped" value="w,v,tick held" role="neutral" width={270}/>
    <text x="8" y="1208" className="mb-small">Illustrated raw-numerator route: −640/128/3 = −5/3.</text><text x="8" y="1240" className="mb-small">Scale update follows attempt; data advances on either branch.</text><text x="8" y="1272" className="mb-small">Known-D credits are already normalized: omit the ÷D operation.</text>
  </>}</MinibatchDrawing>;
}
export function MinibatchRegularizerDrawing(){return <MinibatchDrawing label="One declared regularizer branch joins the complete data credit once" width={650} height={360}>{marker=><>
  <MbOperand x={8} y={35} label="Completed data credit" value={.5} role="credit" width={260}/><MbOperand x={350} y={35} label="Learned w; R=½w²" value={2} role="parameter" width={280}/>
  <MbWire marker={marker} d="M490 75 V125"/><MbOperation x={490} y={125} label="λ × dR/dw" width={200}/><text x="350" y="205" className="mb-small">λ=.1: .1×2 = .2</text>
  <MbWire marker={marker} reverse d="M138 75 V260 H274"/><MbWire marker={marker} reverse d="M490 165 V260 H346"/><MbOperation x={310} y={240} label="+"/><text x="8" y="339">Gradient .5+.2=.7. Chunk count does not repeat this branch.</text>
  </>}</MinibatchDrawing>;}
export function MinibatchDdpDrawing() {
  return <><MinibatchDrawing label="Rank target masses sum before the separate default gradient average" height={390}>{marker=><>
    <MbOperand x={8} y={35} label="Rank 0 mass" value={2} role="neutral" width={132}/><MbOperand x={160} y={35} label="Rank 1 mass" value={1} role="neutral" width={132}/><MbWire marker={marker} d="M74 75 V126 H114"/><MbWire marker={marker} d="M226 75 V126 H186"/><MbOperation x={150} y={106} label="Σ"/><MbWire marker={marker} d="M150 146 V165 H0 V220 H60"/><MbOperand x={60} y={200} label="Shared global D" value={3} role="neutral" width={180}/><text x="8" y="332" className="mb-small">D uses a sum over rank masses.</text><text x="8" y="370" className="mb-small">Gradient reduction is an average.</text>
  </>}</MinibatchDrawing><MinibatchDrawing label="Default rank averaging needs a world-size factor for unequal masses" width={680} height={430}>{marker=><>
    <MbArray x={8} y={35} label="Rank 0: a,b raw credits" values={[-2,0]} role="credit" cellWidth={145}/><MbArray x={360} y={35} label="Rank 1: c raw credit" values={[-3]} role="credit" cellWidth={145}/>
    <MbOperand x={8} y={170} label="Differentiate 2S₀ / global D=3" value={-4/3} role="credit" width={310}/><MbOperand x={360} y={170} label="Differentiate 2S₁ / global D=3" value={-2} role="credit" width={310}/><MbWire marker={marker} reverse d="M150 75 V110 H0 V190 H8"/><MbWire marker={marker} reverse d="M432 75 V110 H678 V190 H670"/>
    <MbWire marker={marker} reverse d="M163 210 V284 H274"/><MbWire marker={marker} reverse d="M515 210 V284 H346"/><MbOperation x={310} y={264} label="Σ/2" width={100}/><text x="8" y="368">Default rank average: (−4/3−2)/2 = −5/3.</text><text x="8" y="409" className="mb-small">A zero-local-mass rank supplies zero and still joins the protocol.</text>
  </>}</MinibatchDrawing></>;
}
