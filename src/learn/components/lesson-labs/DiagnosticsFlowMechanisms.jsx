import { diagnosticsStudy as study } from '../../data/training-diagnostics-study.js';
import { DiagnosticScene as Scene, DiagnosticText as Text, DiagnosticWire as Wire, DiagnosticCells as Cells, DiagnosticOp as Op, DiagnosticBinary as Binary, DiagnosticPlot as Plot, DIAGNOSTIC_PAINT as paint, diagnosticFormat as f } from './DiagnosticsFlowFigures.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import {modeTrace} from '../../data/diagnostics-reading-models.js';

export const diagnosticFeatureNames = ['alcohol','malic acid','ash','alcalinity of ash','magnesium','total phenols','flavanoids','nonflavanoid phenols','proanthocyanins','color intensity','hue','OD280/OD315','proline'];
const trainingRows = study.split.train.map(id => study.rawRows.find(row => row.id === id));
export const diagnosticScaler = diagnosticFeatureNames.map((name, j) => {
  const mean = trainingRows.reduce((sum, row) => sum + row.features[j], 0) / trainingRows.length;
  return { name, mean, sd: Math.sqrt(trainingRows.reduce((sum, row) => sum + (row.features[j] - mean) ** 2, 0) / trainingRows.length) };
});

export function DiagnosticSplitDrawing() {
  const roles = [['train','training: fit transform + model',paint.parameter],['validation','validation: inspect held-out scores',paint.computed],['test','test: sealed in this experiment','#a5a5ab']];
  return <Scene width={740} height={715} title="Every original row has one split role; only training fits the scaler" description="178 stable CSV identities: 72 training,36 validation,70 sealed test. Raster positions are row IDs; the colors name roles, not classes. The same complete13-means/13-SDs transform fans out to both training and validation; test stays sealed.">
    <Text x={25} y={25}>178 CSV row identities: ID and target remain outside the 13 features</Text>
    {Array.from({length:178},(_,id)=>{const index=roles.findIndex(([role])=>study.split[role].includes(id)),x=25+(id%18)*37,y=60+Math.floor(id/18)*26;return <rect key={id} x={x} y={y} width={30} height={19} fill={roles[index][2]}><title>CSV row {id}, {roles[index][0]}</title></rect>;})}
    <Text x={25} y={340}>Raster reads left to right: row 0 → 17, then 18 → 35, through 177.</Text>
    {roles.map(([role,label,color],i)=><g key={role}><rect x={25} y={366+i*32} width={20} height={18} fill={color}/><Text x={57} y={381+i*32}>{label}: {study.split[role].length} rows</Text></g>)}
    <Cells values={[72]} x={25} y={505} width={140} label="training rows" role="input"/><Wire path="M161 523H210"/><Op x={230} y={523} symbol="fit" radius={24}/>
    <Wire path="M254 523H310"/><Cells values={['13 μ','13 s']} x={310} y={505} width={130} label="training-fit constants"/>
    <Wire path="M373 541V565H503V541" arrow={false}/><Wire path="M438 565V590H10V633H25"/><Cells values={['training transform']} x={25} y={615} width={165}/>
    <Wire path="M438 590H575V633H585"/><Cells values={['validation transform']} x={585} y={615} width={150}/>
    <Text x={25} y={695}>Per-class role counts: training 24/24/24; validation 12/12/12; test 23/35/12.</Text>
  </Scene>;
}
export function DiagnosticScalerDrawing() {
  const row = study.rawRows.find(row => row.id === 5), scaler = diagnosticScaler[0];
  return <><Scene height={525} title="Row5 alcohol uses the training-fit mean and population SD" description={`Raw14.2 minus ${scaler.mean}, divided by ${scaler.sd}, gives ${(row.features[0]-scaler.mean)/scaler.sd}. Each feature has its own constants.`}>
    <Binary y={50} a={row.features[0]} b={scaler.mean} result={row.features[0]-scaler.mean} symbol="−" leftLabel="supplied alcohol" rightLabel="training-fit μ" resultLabel="centered alcohol" leftRole="input" rightRole="computed"/>
    <Binary y={290} a={row.features[0]-scaler.mean} b={scaler.sd} result={(row.features[0]-scaler.mean)/scaler.sd} symbol="÷" leftLabel="centered alcohol" rightLabel="training-fit s" resultLabel="transformed feature" rightRole="computed"/>
  </Scene><NeuralTable caption="All thirteen coordinates of original row5; constants fitted on the same72 training IDs" headers={['Feature','Raw input','Training μ','Population s','Transformed']} rows={diagnosticScaler.map((v,j)=>[v.name,f(row.features[j]),f(v.mean),f(v.sd),f((row.features[j]-v.mean)/v.sd)])}/></>;
}
export function DiagnosticNetworkDrawing() {
  const layers = [{x:35,count:13,columns:4,spacing:26,label:'13 supplied features',role:'input'},{x:295,count:32,columns:4,spacing:26,label:'32 tanh units',role:'computed'},{x:565,count:3,columns:1,spacing:95,label:'3 computed logits',role:'computed'}];
  return <Scene width={740} height={1110} title="Known13→32→3 architecture and one complete constructed neuron" description="Layer glyph counts encode actual widths. Two representative connection fans are shown; every hidden unit receives all13 features and every logit receives all32 activations. Below, constructed inputs1,2 times weights.5,-1, plus bias.25, then tanh.">
    {[0,1,2,3].map(i=><Wire key={`in${i}`} path={`M165 60C230 60 270 ${60+i*26} 337 ${60+i*26}`}/>)}
    {[0,1,2].map(i=><Wire key={`out${i}`} path={`M425 60C490 60 550 ${60+i*95} 607 ${60+i*95}`}/>)}
    {layers.map(layer=><g key={layer.x}><Text x={layer.x} y={25} role={layer.role}>{layer.label}</Text>{Array.from({length:layer.count},(_,i)=><circle key={i} cx={layer.x+50+(i%layer.columns)*24} cy={60+Math.floor(i/layer.columns)*layer.spacing} r={8} fill="#202024" stroke={paint[layer.role]}/>)}</g>)}
    {[60,155,250].map(y=><Wire key={`logit${y}`} path={`M623 ${y}H700`} arrow={false}/>)}<Wire path="M700 60V280H640V300"/><Op x={640} y={340} symbol="softmax" radius={40}/><Wire path="M640 380V388H550V438H565"/><Cells values={['P0','P1','P2']} x={565} y={420} width={50} label="3 probabilities"/>
    <Text x={25} y={305}>Representative wires only:13×32 then32×3 learned connections.</Text>
    <Text x={25} y={337}>Constructed neuron below; these values are not retained Wine activations.</Text>
    <Binary y={390} a={1} b={.5} result={.5} symbol="×" leftLabel="input x₁" rightLabel="weight w₁" resultLabel="first product" leftRole="input" rightRole="parameter"/>
    <Binary y={625} a={2} b={-1} result={-2} symbol="×" leftLabel="input x₂" rightLabel="weight w₂" resultLabel="second product" leftRole="input" rightRole="parameter"/>
    <Cells values={[.5,-2]} x={25} y={855} width={125} label="two products"/><Wire path="M271 873H310"/><Op x={330} y={873} symbol="Σ"/>
    <Wire path="M350 873H395"/><Cells values={[-1.5]} x={395} y={855} width={130} label="weighted sum"/>
    <Cells values={[.25]} x={570} y={855} width={130} label="learned bias" role="parameter"/><Wire path="M633 891V955H490"/><Wire path="M458 891V925H470V935"/><Op x={470} y={955} symbol="+"/>
    <Wire path="M450 955H255"/><Cells values={[-1.25]} x={125} y={937} width={130} label="preactivation"/>
    <Wire path="M188 973V1038H247"/><Op x={275} y={1038} symbol="tanh" radius={28}/><Wire path="M303 1038H360"/><Cells values={[Math.tanh(-1.25)]} x={360} y={1020} width={190} label="activation"/>
  </Scene>;
}
export function DiagnosticInterpolationDrawing() {
  const values=Array.from({length:81},(_,i)=>{const x=-2+i/16;return[x,2*Math.max(0,x+1)-7*Math.max(0,x-1)];});
  return <><Plot title="Two ReLU ramps form a function through the observed targets" description="Constructed thresholds-1/+1 with coefficients2/-7. Distinct observed inputs0/2 have targets2/-1." series={[{label:'r₁=max(0,t+1)',color:paint.input,values:values.map(([x])=>[x,Math.max(0,x+1)])},{label:'r₂=max(0,t−1)',color:paint.computed,values:values.map(([x])=>[x,Math.max(0,x-1)])},{label:'f=2r₁−7r₂',color:paint.parameter,values}]}
    xDomain={[-2,3]} yDomain={[-6,6]} xLabel="constructed input t" yLabel="response" height={410} points={[{x:0,y:2,label:'observed target2'},{x:2,y:-1,label:'observed target−1'}]}/>
    <Scene height={1030} title="Triangular response matrix and coefficient products" description="At input0 responses1,0; at2 responses3,1. Two row contractions yield2 and-1. Duplicate0 repeats first row, so contradictory targets cannot both be met.">
      <Text x={25} y={25}>Columns: threshold −1, threshold +1</Text><Cells values={[1,0,3,1]} x={140} y={70} width={100} height={55} columns={2} label="response rows: t=0, t=2"/>
      <Cells values={[2,-7]} x={140} y={230} width={100} label="learned coefficients c₁,c₂" role="parameter"/>
      {[[1,0],[3,1]].map((response,i)=>{const y=355+i*335,products=response.map((v,j)=>v*[2,-7][j]);return <g key={i}>
        <Cells values={response} x={25} y={y} width={125} label={`response at t=${i*2}`}/><Cells values={[2,-7]} x={25} y={y+105} width={125} label="same coefficients" role="parameter"/>
        <Wire path={`M271 ${y+18}H285V${y+73}H300`}/><Wire path={`M271 ${y+123}H320V${y+93}`}/><Op x={320} y={y+73} symbol="×"/>
        <Wire path={`M340 ${y+73}H445V${y+167}H10V${y+213}H25`}/><Cells values={products} x={25} y={y+195} width={125} label="coordinate products"/><Wire path={`M271 ${y+213}H300`}/><Op x={320} y={y+213} symbol="Σ"/><Wire path={`M340 ${y+213}H355`}/><Cells values={[products[0]+products[1]]} x={355} y={y+195} width={95} label={`f(${i*2})`}/>
      </g>;})}
      <Text x={25} y={1000}>Duplicate t=0 repeats [1,0]; it cannot output both2 and−1.</Text>
    </Scene></>;
}
export function DiagnosticDependencyDrawing() {
  const slots=[['Absent slot',null,'None: optimizer skips this parameter'],['Computed zero',0,'Momentum can still move it'],['Computed nonzero',-.75,'Step uses this tensor and state']];
  return <Scene width={740} height={1190} title="Executed dependency, gradient accumulation slot and optimizer identity" description="A forward parameter dependency reaches loss; backward accumulates into that same object's gradient slot; SGD must own that same identity. Separate drawings show a detached cut, unused parameter and optimizer owning a different object. Absent and zero slots are separate.">
    <Cells values={['parameter θ #A']} x={25} y={60} width={200} label="learned leaf identity" role="parameter"/><Wire path="M221 78H275"/><Op x={300} y={78} symbol="×"/>
    <Cells values={['input x']} x={270} y={145} width={130} label="supplied operand" role="input"/><Wire path="M270 163H245V110H300V98"/>
    <Wire path="M320 78H440"/>{['activation','logits','objective L'].map((value,i)=><g key={value}><Cells values={[value]} x={440} y={60+i*70} width={260} label={i===0?'executed forward dependencies':undefined}/>{i<2&&<Wire path={`M570 ${96+i*70}V${130+i*70}`}/>}</g>)}
    <Wire path="M570 236V275H300" gradient/><Op x={275} y={275} symbol="Σ"/><Wire path="M255 275H225" gradient/><Cells values={['θ #A .grad']} x={25} y={257} width={200} label="accumulation slot" role="gradient"/>
    <Wire path="M123 293V345H275" gradient/><Op x={300} y={345} symbol="SGD" radius={30}/><Wire path="M330 345H440"/><Cells values={['θ #A after step']} x={440} y={327} width={260} label="same owned leaf" role="parameter"/>
    {slots.map(([name,value,meaning],i)=><g key={name}><Cells values={[value===null?'None':value]} x={25} y={425+i*90} width={180} label={name} role="gradient"/><Text x={230} y={450+i*90}>{meaning}</Text></g>)}
    <Text x={25} y={730}>Detached intermediate: the reverse dependency ends at this cut.</Text>
    <Cells values={['computed tensor']} x={25} y={765} width={200}/><Wire path="M221 783H350" arrow={false}/><path d="M355 765L380 800M380 765L355 800" stroke={paint.gradient} strokeWidth={3}/><Wire path="M385 783H440"/><Cells values={['objective L']} x={440} y={765} width={260}/>
    <Text x={25} y={870}>Unused leaf: #B has no executed connection to this objective.</Text>
    <Cells values={['parameter #B']} x={25} y={900} width={200} role="parameter"/><Cells values={['objective uses #A']} x={440} y={900} width={260}/>
    <Text x={25} y={1000}>Wrong owner: a gradient on #A cannot make SGD own #A.</Text>
    <Cells values={['#A .grad exists']} x={25} y={1035} width={200} role="gradient"/><Cells values={['group owns #B']} x={25} y={1125} width={200} role="state"/><Wire path="M221 1143H320"/><Op x={350} y={1143} symbol="SGD" radius={28}/><Wire path="M378 1143H440"/><Cells values={['#B after step']} x={440} y={1125} width={260} role="parameter"/>
  </Scene>;
}
export function DiagnosticActivationDrawing() {
  const values=Array.from({length:121},(_,i)=>{const z=-6+i/10,a=Math.tanh(z);return[z,a,1-a*a];});
  return <><Plot title="Tanh and its local derivative share the same input axis" description="Analytic tanh(z), slope1−tanh²(z), z−6..6. Atzero slope1; endpoints approachzero." series={[{label:'activation tanh(z)',color:paint.computed,values:values.map(([z,a])=>[z,a])},{label:'local slope1−tanh²(z)',color:paint.gradient,values:values.map(([z,,s])=>[z,s])}]} xDomain={[-6,6]} yDomain={[-1,1]} xLabel="preactivation z" yLabel="activation / local slope"/>
    <Scene height={290} title="One incoming reverse contribution multiplies the local slope" description="Constructed z2 gives tanh≈.96402758 and local slope≈.070650825. Incoming derivative3 times this slope≈.211952475."><Binary y={50} a={3} b={1-Math.tanh(2)**2} result={3*(1-Math.tanh(2)**2)} symbol="×" leftLabel="incoming derivative" rightLabel="slope at z=2" resultLabel="outgoing derivative" leftRole="gradient" rightRole="gradient" gradient/></Scene></>;
}
export function DiagnosticQuantileDrawing() {
  return <Scene width={620} height={565} title="Retained absolute-tanh quantiles on shared0..1 strips" description="At seed7 the multiplied standardized input produces recorded10th,50th,90th quantiles. Separate lanes preserve coincident values at1. These are quantiles, not a histogram.">
    {study.activation.map((row,i)=><g key={i}>
      <Text x={25} y={25+i*280}>Input multiplier {row.input_multiplier}; mean local slope {f(row.mean_tanh_derivative)}</Text>
      <path d={`M95 ${65+i*280}H555`} stroke="#aaa"/>
      {[0,.5,1].map(v=><Text key={v} x={95+460*v} y={53+i*280} anchor="middle">{v}</Text>)}
      {row.absolute_activation_quantiles_10_50_90.map((v,j)=><g key={j}><circle cx={95+460*v} cy={65+i*280} r={5} fill={paint.computed}/><path d={`M${95+460*v} ${70+i*280}V${108+i*280+j*45}H280`} fill="none" stroke={paint.computed}/><Text x={25} y={136+i*280+j*45}>{[10,50,90][j]}th percentile: {Number(v.toFixed(9))}</Text></g>)}
    </g>)}
  </Scene>;
}
export function DiagnosticBatchDrawing({trace:t}) {
  return <Scene height={1805} title="Two-input BatchNorm: population variance feeds the training forward path" description={`Inputs${t.values}; mean${t.batchMean}; deviations${t.deviations}; squares${t.squares}; population variance${t.populationVariance}; mode-selected denominator${t.denominator}. Gamma1,beta0.`}>
    <Cells values={t.values} x={25} y={60} width={160} label="supplied inputs" role="input"/><Wire path="M341 78H390"/><Op x={410} y={78} symbol="Σ"/><Wire path="M410 98V155H10V183H25"/>
    <Cells values={[(t.values[0]+t.values[1])]} x={25} y={165} width={160} label="sum"/><Cells values={[2]} x={275} y={165} width={160} label="count" role="input"/>
    <Wire path="M103 201V245H200"/><Wire path="M353 201V245H240"/><Op x={220} y={245} symbol="÷"/><Wire path="M220 265V310H185"/><Cells values={[t.batchMean]} x={25} y={292} width={160} label="batch mean"/>
    <Wire path="M341 78H365V115H445V350H340"/><Wire path="M103 328V350H300"/><Op x={320} y={350} symbol="−"/><Wire path="M320 370V384H10V433H25"/>
    <Cells values={t.deviations} x={25} y={415} width={160} label="each input − batch mean"/><Wire path="M341 433H390"/><Op x={410} y={433} symbol="²"/><Wire path="M410 453V510H341"/>
    <Cells values={t.squares} x={25} y={492} width={160} label="squared deviations"/><Wire path="M341 510H390V607H340"/><Op x={320} y={607} symbol="Σ"/><Wire path="M300 607H185"/><Cells values={[t.squares[0]+t.squares[1]]} x={25} y={589} width={160} label="sum of squares"/>
    <Binary y={725} a={t.squares[0]+t.squares[1]} b={2} result={t.populationVariance} symbol="÷" leftLabel="sum of squares" rightLabel="population count" resultLabel="population variance"/>
    <Cells values={[t.usedVariance,1e-5]} x={25} y={975} width={130} label="mode-selected variance + ε"/><Wire path="M281 993H310"/><Op x={330} y={993} symbol="+"/><Wire path="M330 1013V1060H310"/><Op x={290} y={1060} symbol="√"/><Wire path="M270 1060H185"/><Cells values={[t.denominator]} x={25} y={1042} width={160} label="forward denominator"/>
    <Cells values={t.values.map(x=>x-t.usedMean)} x={25} y={1150} width={160} label="each input − mode-selected mean"/><Wire path="M341 1168H390"/><Op x={410} y={1168} symbol="÷"/><Wire path="M103 1078V1118H445V1168H430"/>
    <Wire path="M410 1188V1268H341"/><Cells values={t.output} x={25} y={1250} width={160} label="normalized output, before affine"/>
    <Cells values={[1]} x={275} y={1350} width={160} label="learned scale γ" role="parameter"/><Wire path="M353 1386V1395H220V1410"/><Wire path="M341 1268H445V1430H240"/><Op x={220} y={1430} symbol="×"/>
    <Wire path="M220 1450V1466H10V1518H25"/><Cells values={t.output} x={25} y={1500} width={160} label="each normalized output × γ"/>
    <Cells values={[0]} x={275} y={1590} width={160} label="learned shift β" role="parameter"/><Wire path="M353 1626V1635H220V1650"/><Wire path="M341 1518H445V1670H240"/><Op x={220} y={1670} symbol="+"/>
    <Wire path="M220 1690V1706H10V1758H25"/><Cells values={t.output} x={25} y={1740} width={160} label="affine output"/>
  </Scene>;
}
export function DiagnosticBufferDrawing({trace:t}) {
  return <><Scene height={1060} title="Sample variance updates saved state; evaluation reads saved state" description={`Sample variance${t.sampleVariance}; saved mean${t.savedMean}/variance${t.savedVariance}; training buffer recurrence. Currentnext${t.nextMean}/${t.nextVariance}; evaluation uses saved mean/variance.`}>
    <Binary y={50} a={t.squares[0]+t.squares[1]} b={1} result={t.sampleVariance} symbol="÷" leftLabel="sum of squares" rightLabel="sample N−1" resultLabel="sample variance"/>
    <Cells values={[.9*t.savedMean,.1*t.batchMean]} x={25} y={310} width={130} label=".9 saved mean / .1 batch mean"/><Wire path="M281 328H310"/><Op x={330} y={328} symbol="+"/><Wire path="M350 328H365"/><Cells values={[.9*t.savedMean+.1*t.batchMean]} x={365} y={310} width={95} label="train μ′"/>
    <Cells values={[.9*t.savedVariance,.1*t.sampleVariance]} x={25} y={425} width={130} label=".9 saved variance / .1 sample variance"/><Wire path="M281 443H310"/><Op x={330} y={443} symbol="+"/><Wire path="M350 443H365"/><Cells values={[.9*t.savedVariance+.1*t.sampleVariance]} x={365} y={425} width={95} label="train v′"/>
    <Cells values={[t.savedMean,t.savedVariance]} x={25} y={565} width={160} label="evaluation reads saved μ,v" role="state"/><Wire path="M103 601V700H160"/><Wire path="M263 601V650H190V670"/><Op x={190} y={700} symbol="eval" radius={30}/>
    <Text x={25} y={1030}>Current next saved μ {f(t.nextMean)}, v {f(t.nextVariance)}.</Text>
    <Cells values={t.values} x={25} y={825} width={160} label="same supplied inputs" role="input"/><Wire path="M341 843H430V700H220"/>
    <Wire path="M190 730V790H445V900H10V953H25"/><Cells values={t.values.map(x=>(x-t.savedMean)/Math.sqrt(t.savedVariance+1e-5))} x={25} y={935} width={160} label="evaluation output: saved buffers unchanged"/>
  </Scene></>;
}
export function DiagnosticGraphDrawing({trace:t}) {
  return <Scene width={920} height={995} title="All four independent module-mode and recording paths" description={`Sameinputs${t.values},savedmean${t.savedMean},variance${t.savedVariance}; all4mode/graphcombinationscomputedfor${t.module}. Current${t.training?'train':'eval'} andgraph${t.graph?'on':'off'}. No optimizerstep.`}>
    {[[true,true],[true,false],[false,true],[false,false]].map(([training,graph],i)=>{const r=modeTrace({values:t.values,mean:t.savedMean,variance:t.savedVariance,training,graph,module:t.module}),y=65+i*225,selected=training===t.training&&graph===t.graph;return <g key={i}>
      <Text x={25} y={y-30}>{training?'Training / batch':'Evaluation / saved'} + {graph?'graph enabled':'no_grad'}{selected?' ← current':''}</Text>
      <Cells values={t.values} x={25} y={y} width={80} label="same inputs" role="input"/><Wire path={`M181 ${y+18}H205`}/><Op x={230} y={y+18} symbol={t.module==='linear'?'linear':'BN'} radius={25}/><Wire path={`M255 ${y+18}H320`}/>
      <Cells values={r.output} x={320} y={y} width={160} label="numeric forward outputs" selected={selected?0:null}/>
      <Wire path={`M286 ${y+18}V${y+100}H650V${y+18}H670`}/><Cells values={[r.nextMean,r.nextVariance]} x={670} y={y} width={110} label={t.module==='linear'?'held case μ / v':'next saved μ / v'} role="state"/>
      {graph&&<Wire path={`M230 ${y+43}V${y+128}H210`} gradient/>}<Cells values={[graph?'recorded':'not recorded']} x={25} y={y+110} width={185} label="autograd dependency" role="gradient"/>
    </g>;})}
    <Text x={25} y={980}>Forward behavior, buffer mutation and graph recording differ; none of these calls SGD.</Text>
  </Scene>;
}
export function DiagnosticLinearDrawing({trace:t}) {
  return <Scene height={1060} title="Mode-insensitive linear map is a genuine numerical null" description={`Same suppliedinputs${t.values}; 2x+1 gives${t.values.map(x=>2*x+1)} in either module mode and either graph mode; saved buffers unchanged.`}>
    {t.values.map((x,i)=><g key={i}><Binary y={50+i*500} a={x} b={2} result={2*x} symbol="×" leftLabel={`input ${i+1}`} rightLabel="fixed weight" resultLabel="product" leftRole="input" rightRole="parameter"/><Binary y={295+i*500} a={2*x} b={1} result={2*x+1} symbol="+" leftLabel="product" rightLabel="fixed learned bias" resultLabel={`output ${i+1}`} rightRole="parameter"/></g>)}
    <Text x={25} y={1050}>train/eval changes no numerical operation in this linear map.</Text>
  </Scene>;
}
export function DiagnosticAggregationDrawing() {
  return <><Scene height={645} title="Unequal groups require the total row count in the denominator" description="Constructed per-row cross-entropies1,3,8 sum12 divided by3 gives4. Averaging the two group means2 and8 gives5 and different weighting.">
    <Cells values={[1,3]} x={25} y={55} width={130} label="first group:2 row losses"/><Cells values={[8]} x={330} y={55} width={100} label="second:1 row"/>
    <Wire path="M281 73H310V145H240"/><Wire path="M378 91V145H240"/><Op x={220} y={145} symbol="Σ"/><Wire path="M220 165V205H185"/><Cells values={[12]} x={25} y={187} width={160} label="all-row sum"/>
    <Binary y={295} a={12} b={3} result={4} symbol="÷" leftLabel="all-row sum" rightLabel="all-row count" resultLabel="correct row mean"/>
    <Cells values={[2,8]} x={25} y={540} width={130} label="group means, equal group weights"/><Wire path="M281 558H310"/><Op x={330} y={558} symbol="mean" radius={28}/><Wire path="M358 558H370"/><Cells values={[5]} x={370} y={540} width={80} label="wrong mean"/>
    <Text x={25} y={630}>The denominator determines each row's influence.</Text>
  </Scene><Scene width={740} height={590} title="Incoming optimization loss and fixed-set evaluation occupy different times" description="A batch forward at theta-before supplies the incoming optimization loss. Backward then SGD produce theta-after. A new fixed-set evaluation at theta-after gives another loss. Copied parameter values surround the step, so observation does not alias its output.">
    <Cells values={['θ before']} x={25} y={60} width={140} label="copied parameter" role="parameter"/><Wire path="M161 78H200"/><Op x={240} y={78} symbol="forward" radius={40}/><Wire path="M280 78H345"/><Cells values={['incoming L']} x={345} y={60} width={170} label="current batch objective"/>
    <Wire path="M429 96V155H200V238H240"/><Op x={280} y={238} symbol="backward" radius={40}/><Wire path="M320 238H385"/><Cells values={['g']} x={385} y={220} width={140} label="derivative buffer" role="gradient"/>
    <Wire path="M453 256V315H280V355"/><Op x={280} y={395} symbol="SGD" radius={40}/><Wire path="M93 96V395H240"/><Wire path="M320 395H385"/><Cells values={['θ after']} x={385} y={377} width={140} label="copied next parameter" role="parameter"/>
    <Wire path="M453 413V435H525V448"/><Op x={525} y={488} symbol="eval" radius={40}/><Cells values={['fixed set']} x={25} y={470} width={160} label="same transform + objective" role="input"/><Wire path="M181 488H485"/><Wire path="M565 488H590"/><Cells values={['fixed L']} x={590} y={470} width={140} label="after-update score"/>
    <Text x={25} y={570}>Different rows, stochastic layers or parameter times change the comparison.</Text>
  </Scene></>;
}
