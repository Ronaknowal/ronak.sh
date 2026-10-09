import {diagnosticsStudy as study} from '../../data/training-diagnostics-study.js';
import {diagnosticFirstObservable} from '../../data/training-diagnostics-models.js';
import {groupTrace,meanVariance} from '../../data/diagnostics-reading-models.js';
import {DiagnosticScene as Scene,DiagnosticText as Text,DiagnosticWire as Wire,DiagnosticCells as Cells,DiagnosticOp as Op,DiagnosticBinary as Binary,DiagnosticPlot as Plot,DIAGNOSTIC_PAINT as paint,diagnosticFormat as f} from './DiagnosticsFlowFigures.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';

export function DiagnosticPairDrawing({trace:t,unit}) {
  const extent=Math.max(.01,...t.details.map(r=>Math.abs(r.difference)))*1.2,x=v=>390+180*v/extent;
  return <><Scene width={640} height={200+t.details.length*245} title="Every paired observation keeps its corresponding A and B" description={`Differences are B−A in${unit},${t.direction} is better. Mean${t.mean};${t.wins} improvements,${t.losses} worsenings,${t.ties} exact ties.`}>
    <Text x={25} y={25}>B−A; {unit}; {t.direction} is better</Text>
    {t.details.map((r,i)=>{const y=70+i*245;return <g key={r.id}><Cells values={[r.b]} x={25} y={y} width={125} label={`Pair ${r.id}: B`} role="input"/><Cells values={[r.a]} x={195} y={y} width={125} label={`same pair: A`} role="input"/><Wire path={`M85 ${y+36}V${y+95}H305`}/><Wire path={`M255 ${y+36}V${y+70}H355V${y+95}H345`}/><Op x={325} y={y+95} symbol="−"/><Wire path={`M325 ${y+115}H10V${y+162}H25`}/><Cells values={[r.difference]} x={25} y={y+144} width={150} label="B−A"/>
      <path d={`M390 ${y+162}H${x(r.difference)}`} stroke={r.difference===0?'#eee':paint.computed} strokeWidth="3"/><circle cx={x(r.difference)} cy={y+162} r={5} fill={paint.computed}/><Text x={390} y={y+205}>{r.difference===0?'exact tie':r.difference*(t.direction==='larger'?1:-1)>0?'B improves':'B worsens'}</Text></g>;})}
    <path d={`M390 190V${65+t.details.length*245}`} stroke="#aaa" strokeDasharray="4 4"/>
    <Text x={25} y={130+t.details.length*245}>Signed axis: {f(-extent)} ← 0 → {f(extent)}</Text>
    <Text x={25} y={165+t.details.length*245}>Mean B−A {f(t.mean)}; no correspondence is discarded.</Text>
  </Scene><NeuralTable caption="All included paired observations" headers={['Pair','A','B','B−A']} rows={t.details.map(r=>[r.id,f(r.a),f(r.b),f(r.difference)])}/></>;
}
export function DiagnosticSpreadDrawing({trace:t}) {
  const width=Math.max(460,25+110*t.details.length),denominator=t.details.length-1;
  return <Scene width={width} height={970} title="Sample spread uses the paired differences and their mean" description={`Differences${t.details.map(r=>r.difference)}; mean${t.mean}; deviations${t.deviations}; squares sum${t.squaredSum}; countminusone${denominator}; SD${t.sd}.`}>
    <Cells values={t.details.map(r=>r.difference)} x={25} y={55} width={110} label="all B−A differences"/>
    <Cells values={[t.mean]} x={315} y={170} width={130} label="their mean"/><Wire path="M315 188H310"/><Wire path={`M${21+110*t.details.length} 73H${width-10}V125H290V168`}/><Op x={290} y={188} symbol="−"/><Wire path="M290 208V270H240"/>
    <Cells values={t.deviations} x={25} y={252} width={110} label="difference − mean, each pair"/>
    <Wire path={`M${21+110*t.details.length} 270H${width-10}V350H340`}/><Op x={320} y={350} symbol="²"/><Wire path="M300 350H25V430H50"/>
    <Cells values={t.squares} x={50} y={412} width={Math.min(100,(width-65)/t.details.length)} label="squared deviations"/>
    <Wire path={`M${46+Math.min(100,(width-65)/t.details.length)*t.details.length} 430H${width-10}V505H360`}/><Op x={340} y={505} symbol="Σ"/><Wire path="M320 505H10V573H25"/><Cells values={[t.squaredSum]} x={25} y={555} width={160} label="sum of squared deviations"/>
    <Binary y={640} a={t.squaredSum} b={denominator} result={t.variance} symbol="÷" leftLabel="sum of squares" rightLabel="paired count−1" resultLabel="sample variance"/>
    <Wire path="M181 802H270"/><Op x={290} y={802} symbol="√"/><Wire path="M290 822V890H240"/><Cells values={[t.sd]} x={25} y={872} width={215} label="sample standard deviation"/>
    <Text x={25} y={955}>{denominator===0?'One pair: sample variance and SD are undefined.':'This is descriptive spread, not a significance test.'}</Text>
  </Scene>;
}
export function DiagnosticVarianceDrawing({common,count}) {
  const values=Array.from({length:100},(_,i)=>[i+1,meanVariance(common,i+1)]),value=meanVariance(common,count);
  return <><Scene width={620} height={410} title="A common perturbation reaches every observation before averaging" description="Constructed model e_j=common perturbation+private perturbation_j. Independent zero-mean components with common variance specified and private variance.6. Common component reaches allj; average preserves it while private variance divides byk.">
    <Cells values={['shared C']} x={25} y={50} width={160} label={`common variance ${f(common)}`} role="input"/>
    {[0,1,2].map(i=><g key={i}><Wire path={`M181 68H610V${130+i*90}H290V${133+i*90}`}/><Cells values={[`private U${i+1}`]} x={25} y={135+i*90} width={160} label="variance .6" role="input"/><Wire path={`M181 ${153+i*90}H270`}/><Op x={290} y={153+i*90} symbol="+"/><Wire path={`M310 ${153+i*90}H350`}/><Cells values={[`e${i+1}=C+U${i+1}`]} x={350} y={135+i*90} width={230}/></g>)}
    <Text x={25} y={405}>The same C appears in every term of the average; it is not divided away.</Text>
  </Scene><Plot title="Calculated variance of the average and its shared floor" description={`Common variance${common} plus independent private.6/count. At${count} repeats totalvariance${value}; curve is analytic, not Wine measurement.`} series={[{label:'Var(mean)=common+.6/k',color:paint.computed,values},{label:'shared variance floor',color:paint.input,dashed:true,values:[[1,common],[100,common]]}]} xDomain={[1,100]} yDomain={[0,1.6]} xLabel="repeat count k" yLabel="constructed variance" points={[{x:count,y:value,label:`selected ${count} repeats`}]} /></>;
}
function MomentumOperations({row,r,mu,heading}) {
  return <Scene height={790} title={heading} description={`Step${row.index}: previousw${row.weight},v${row.velocity};g${row.gradient};mu${mu};rate${r};nextv${row.nextVelocity};nextw${row.nextWeight}.`}>
    <Text x={25} y={25}>Step {row.index}: w={f(row.weight)}; g=w−target={f(row.gradient)}</Text>
    <Binary y={75} a={mu} b={row.velocity} result={row.carried} symbol="×" leftLabel="supplied momentum μ" rightLabel="saved velocity v" resultLabel="carried μv" leftRole="input" rightRole="state"/>
    <Binary y={310} a={row.carried} b={row.gradient} result={row.nextVelocity} symbol="+" leftLabel="carried μv" rightLabel="current gradient" resultLabel="next velocity" rightRole="gradient"/>
    <Cells values={[r]} x={25} y={555} width={130} label="supplied η" role="input"/><Cells values={[row.nextVelocity]} x={155} y={555} width={130} label="next velocity" role="computed"/><Wire path="M281 573H310"/><Wire path="M88 591V596H445V535H330V553"/><Op x={330} y={573} symbol="×"/><Wire path="M330 593V645H270"/>
    <Cells values={[row.weight]} x={25} y={627} width={160} label="copied current w" role="parameter"/><Wire path="M181 645H250"/><Op x={270} y={645} symbol="−"/><Wire path="M270 665V737H185"/><Cells values={[row.nextWeight]} x={25} y={719} width={160} label="next weight" role="parameter"/>
    <Text x={25} y={785}>Signed movement ηv′={f(row.movement)}; after−before={f(row.nextWeight-row.weight)}.</Text>
  </Scene>;
}
export function DiagnosticSavedDrawing({state,trace}) {
  return <><MomentumOperations row={trace.prefix[trace.prefix.length-1]} r={state.rate} mu={state.momentum} heading="Last prefix operation writes two separate saved slots"/>
    <Scene height={145} title="Saved scalar checkpoint after the prefix" description={`Saved w${trace.saved.weight},v${trace.saved.velocity},completed${trace.saved.completed}.`}><Cells values={[trace.saved.weight,trace.saved.velocity,trace.saved.completed]} x={25} y={55} width={140} label="saved weight / velocity / completed" role="state"/></Scene></>;
}
export function DiagnosticResumeDrawing({state,trace}) {
  const selected=state.cursor<state.save?state.cursor:state.cursor-state.save,a=state.cursor<state.save?trace.prefix[selected]:trace.full[selected],b=state.cursor<state.save?trace.prefix[selected]:trace.reset[selected];
  return <><MomentumOperations row={a} r={state.rate} mu={state.momentum} heading="Complete-state branch: inspected operation"/>
    <MomentumOperations row={b} r={state.rate} mu={state.momentum} heading="Weights-only branch: inspected operation"/>
    <NeuralTable caption="Every prefix and resumed operation; weights-only resets velocity at the save boundary" headers={['Step','Full gradient','Full v′','Full w′','Weights-only gradient','Weights-only v′','Weights-only w′']} rows={[...trace.prefix.map(row=>[row.index,...[row.gradient,row.nextVelocity,row.nextWeight,row.gradient,row.nextVelocity,row.nextWeight].map(f)]),...trace.full.map((row,i)=>[row.index,...[row.gradient,row.nextVelocity,row.nextWeight,trace.reset[i].gradient,trace.reset[i].nextVelocity,trace.reset[i].nextWeight].map(f)])]}/>
    <p aria-live="polite">First exact difference: {trace.first?`step ${trace.first.step}, ${trace.first.field}`:'none'}. Final full weight {f(trace.finalFull)}; weights-only {f(trace.finalReset)}.</p></>;
}
export function DiagnosticCpuDrawing() {
  const next=study.checkpoint.uninterrupted_continuation[0];
  return <Scene width={760} height={650} title="Actual CPU checkpoint boundary: after5 updates, cleared gradients" description="Known model13→8tanh→dropout.25→3; batch12,SGD momentum.9,StepLR initialrate.03. GlobalTorch generator determines dropout; ordering generator plus active order/cursor determines the next12 positions. RNG values themselves were not retained in the display record.">
    <Text x={25} y={25}>Actual saved boundary: step → scheduler → clear; completed5; cursor60/72</Text>
    {[13,8,3].map((n,j)=><g key={j}><Text x={25+j*240} y={65}>{j===0?'supplied inputs':j===1?'tanh hidden':'computed logits'}: {n}</Text>{Array.from({length:n},(_,i)=><circle key={i} cx={40+j*240+(i%4)*28} cy={95+Math.floor(i/4)*28} r={9} stroke={paint[j===0?'input':'computed']} fill="#18181b"/>)}</g>)}
    <Wire path="M150 137H230"/><Wire path="M375 123H390V175H398"/><Op x={430} y={175} symbol="mask" radius={32}/><Wire path="M462 175H480V95H511"/>
    <Cells values={['global RNG state']} x={250} y={245} width={190} label="dropout draw source" role="state"/><Wire path="M343 281V330H460V220H430V207"/><Text x={25} y={405}>Dropout .25 uses a draw for this forward pass.</Text>
    <Cells values={['active order','cursor60']} x={25} y={455} width={180} label="sampling state" role="state"/><Wire path="M381 473H420"/><Op x={450} y={473} symbol="take12" radius={32}/><Wire path="M450 505V558H400"/>
    <Cells values={next.training_positions} x={25} y={540} width={57} label="actual next training-array positions" role="input"/>
    <Text x={25} y={615}>SGD momentum .9 and scheduler phase influence the next update.</Text>
    <Text x={25} y={645}>Saved generator bytes are opaque here; no invented dropout mask is drawn.</Text>
  </Scene>;
}
export const diagnosticOmissions=[['none','Complete restore'],['optimizer_buffers','Clear momentum only'],['torch_rng','Reconstructed global RNG start'],['active_order_cursor','Regenerate active order; cursor0'],['scheduler','Reconstructed scheduler start']];
export function DiagnosticOmissionDrawing({omission,index}) {
  const record=study.checkpoint,comparison=record.comparisons.find(c=>c.omission===omission),a=record.uninterrupted_continuation[index],b=comparison.trace[index],first=diagnosticFirstObservable(record.uninterrupted_continuation,comparison.trace);
  return <><Scene width={740} height={480} title={`Actual continued update${a.update}: first retained observable differs separately from final distance`} description={`Omission${omission},firstretained${first?`${first.update}/${first.quantity}`:'none'},finalmaxdistance${comparison.maximum_parameter_difference}.`}>
    {[[a,75,'Uninterrupted'],[b,260,'Restored treatment']].map(([r,y,label])=><g key={label}><Text x={25} y={y-45}>{label}: update {r.update}</Text><Cells values={r.training_positions} x={25} y={y} width={56} label="all12 training-array positions" role="input"/><Wire path={`M361 ${y+36}V${y+100}H420`}/><Op x={450} y={y+100} symbol="fwd" radius={28}/><Wire path={`M478 ${y+100}H525`}/><Cells values={[r.pre_update_loss]} x={525} y={y+82} width={190} label="pre-update loss"/><Cells values={[r.learning_rate_used]} x={25} y={y+82} width={160} label="used rate" role="input"/></g>)}
    <Text x={25} y={430}>First retained discrepancy: {first?`update ${first.update}, ${first.quantity}`:'none'}.</Text>
    <Text x={25} y={465}>Final max |parameter Δ|={f(comparison.maximum_parameter_difference)}.</Text>
  </Scene><NeuralTable caption={`All12 actual positions and original CSV identities at update${a.update}`} headers={['Branch','Positions','CSV IDs','Pre-update loss','Used rate']} rows={[["Uninterrupted",a],["Restored treatment",b]].map(([label,r])=>[label,r.training_positions.join(', '),r.training_positions.map(i=>record.training_row_ids[i]).join(', '),f(r.pre_update_loss),f(r.learning_rate_used)])}/>
    <NeuralTable caption="All seven retained continuation observations for this treatment" headers={['Update','Reference loss','Restored loss','Reference rate','Restored rate','Batch equal?']} rows={comparison.trace.map((r,i)=>{const original=record.uninterrupted_continuation[i];return[r.update,f(original.pre_update_loss),f(r.pre_update_loss),f(original.learning_rate_used),f(r.learning_rate_used),r.training_positions.every((x,j)=>x===original.training_positions[j])?'yes':'no'];})}/>
    <NeuralTable caption="Every measured omission and its first retained symptom; per-step parameter arrays were not retained" headers={['Restoration','First retained discrepancy','Final max |parameter Δ|']} rows={record.comparisons.map(r=>{const first=diagnosticFirstObservable(record.uninterrupted_continuation,r.trace);return[r.omission,first?`update${first.update},${first.quantity}`:'none',f(r.maximum_parameter_difference)];})}/></>;
}
export function DiagnosticRngDrawing() {
  const positions=study.checkpoint.uninterrupted_continuation[0].training_positions;
  return <Scene width={760} height={390} title="Starting seed, current generator position and active order are different state" description="Constructed stream.2,.8,.3,.1 shows consumed versusnextdraw;actualCPU activeorder continuesfromcursor60 with next12positions. A seed restarts, saved generator position continues; neither alone supplies a partially consumed active permutation.">
    <Text x={25} y={25}>Constructed stream illustration: a seed chooses the start.</Text><Cells values={[.2,.8,.3,.1]} x={25} y={65} width={120} label="consumed first2 | next draw .3" role="input" selected={2}/>
    <Wire path="M263 101V145H320"/><Op x={350} y={145} symbol="draw" radius={28}/><Text x={25} y={195}>Saved current generator position continues here; a reset starts at .2.</Text>
    <Text x={25} y={240}>Actual active-order suffix, cursor60/72:</Text><Cells values={positions} x={25} y={275} width={58} label="next12 positions from the retained CPU record" role="input"/>
    <Text x={25} y={365}>The current permutation and cursor survive even before another shuffle draw.</Text>
  </Scene>;
}
export function DiagnosticGroupDrawing() {
  const trace=groupTrace([{id:1,x:1,y:2},{id:2,x:2,y:0},{id:3,x:3,y:1}],0,.1,2);
  return <><Scene height={760} title="An unfinished group retains raw prefix, next row and total denominator" description="Atw0 firsttwo rawcontributions−2,0 are retained;cursor2,totalrows3,remaining−3. Restore−5/3,drop−1,double−7/3; nextweights1/6,.1,7/30. Torchgradalreadydividedprefix−2/3.">
    <Cells values={trace.contributions.slice(0,2)} x={25} y={55} width={130} label="already consumed raw rows" role="gradient"/><Wire path="M281 73H310"/><Op x={330} y={73} symbol="Σ"/><Wire path="M330 93V155H185"/><Cells values={[trace.prefix]} x={25} y={137} width={160} label="copied raw accumulator" role="state"/>
    <Binary y={280} a={trace.prefix} b={trace.suffix} result={trace.prefix+trace.suffix} symbol="+" leftLabel="saved raw prefix" rightLabel="remaining raw suffix" resultLabel="complete raw sum" leftRole="state" rightRole="gradient"/>
    <Binary y={525} a={trace.prefix+trace.suffix} b={3} result={-5/3} symbol="÷" leftLabel="complete raw sum" rightLabel="retained total N" resultLabel="optimizer gradient" gradient/>
  </Scene><NeuralTable caption="Changed continuation policies at the same w0/rate.1 boundary" headers={['Policy','Raw total','Gradient after /3','Next weight']} rows={trace.policies.map(r=>[r.policy,f(r.total),f(r.gradient),f(r.after)])}/>
    <p>For the Torch bridge, each micro-objective was already divided by total3: the cloned unfinished .grad is −2/3, then the last backward adds−1. Do not divide that accumulated tensor again.</p></>;
}
export function DiagnosticFloatingDrawing() {
  const huge=1e16,branches=[{a:huge,b:1,first:huge+1,c:-huge,final:(huge+1)-huge,name:'Grouping1: small unit lost first'},{a:1,b:-huge,first:1-huge,c:huge,final:huge+(1-huge),name:'Grouping2: small unit also lost first'},{a:huge,b:-huge,first:huge-huge,c:1,final:(huge-huge)+1,name:'Reordered cancellation preserves the unit'}];
  return <>{branches.map(row=><Scene key={row.name} height={530} title={row.name} description={`ActualJavaScriptbinary64first${row.a}+${row.b}=${row.first};thenplus${row.c}=${row.final}.`}>
    <Text x={25} y={25}>{row.name}</Text><Binary y={65} a={row.a} b={row.b} result={row.first} symbol="+" leftLabel="first operand" rightLabel="second operand" resultLabel="represented first sum" leftRole="input"/>
    <Binary y={310} a={row.first} b={row.c} result={row.final} symbol="+" leftLabel="first represented sum" rightLabel="remaining operand" resultLabel="represented final sum"/>
  </Scene>)}</>;
}
export function DiagnosticStateDrawing() {
  const rows=[['parameters + buffers','forward'],['optimizer buffers','next velocity'],['scheduler + counters','next used rate'],['used generator states','next random draws'],['active order + cursor','next selected batch'],['module modes','forward branch'],['preprocessing constants','input transform'],['unfinished .grad + N','next accumulation']];
  return <Scene width={740} height={850} title="Each saved process field connects to its next consumer" description="Construct parameter objects/modules/optimizer/scheduler beforeloads; loadmodelthenoptimizer/schedulerintoownedobjects;restoreusedRNGafterconstructors;restoreorder/cursor/modes/preprocessingandunfinishedaccumulatorswhenboundaryrequires. Plainstatecontainerdoesnotreconstructobjectsbyitself.">
    {rows.map(([state,consumer],i)=>{const y=55+i*85;return <g key={state}><Cells values={[state]} x={25} y={y} width={310} label={i===0?'owned snapshot values':undefined} role="state"/><Wire path={`M331 ${y+18}H430`}/><Op x={465} y={y+18} symbol={i===0?'f':'→'} radius={24}/><Text x={515} y={y+23}>{consumer}</Text></g>;})}
    <Text x={25} y={765}>Construct objects → load owned states → restore RNG after constructors.</Text>
    <Text x={25} y={803}>At a cleared completed-update boundary, unfinished .grad is absent.</Text>
    <Text x={25} y={841}>At a mid-group boundary, retain .grad, denominator and next cursor.</Text>
  </Scene>;
}
