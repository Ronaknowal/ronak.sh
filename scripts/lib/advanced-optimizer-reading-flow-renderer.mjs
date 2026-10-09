// Pure authored reading-flow rendering: never writes measurements or fitted state.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from '@babel/parser';
import {renderPreparedLesson} from './prepared-lesson-renderer.mjs';
const id='advanced-optimizers-lion-sophia-prodigy-schedule-free',draft=`docs/teaching/drafts/${id}`,target=`src/learn/data/topics/${id}.jsx`,record=`docs/teaching/deep-learning-beginner/${id}/reading-flow-generated-source.json`;
const flags=process.argv.slice(2),operation=flags[0];
if(flags.length!==1||!['--check','--preview','--write-reading-flow'].includes(operation))throw Error('Use exactly --check, --preview or --write-reading-flow.');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const scientific=JSON.parse(fs.readFileSync(`docs/teaching/deep-learning-beginner/${id}/reading-flow-scientific-dependencies.json`,'utf8'));
for(const entry of scientific.files)if(hash(fs.readFileSync(entry.path))!==entry.sha256)throw Error('Preserved scientific source changed: '+entry.path);
const programs=['optimizer_rules.py','optimizer_study.py','optimizer_calculations.py','optimizer_library_bridge.py','lion_pytorch.py','sophia.py'];
for(const name of programs)if(!fs.readFileSync(`${draft}/${name}`).equals(fs.readFileSync(`public/learn-assets/${id}/${name}`)))throw Error('Exact old program copy mismatch: '+name);
const views={
  "scores": "<OptimizerScoresDrawing/>",
  "probabilities": "<OptimizerProbabilityDrawing/>",
  "objective": "<OptimizerObjectiveDrawing/>",
  "adam-histories": "<AdamHistoriesDrawing/>",
  "adam-correction": "<AdamCorrectionDrawing/>",
  "adam-update": "<AdamUpdateDrawing/>",
  "adam-impulse": "<AdamImpulseDrawing/>",
  "curvature-bowls": "<CurvatureBowlsDrawing/>",
  "hessian-probe-worked": "<HessianProbeDrawing/>",
  "hessian-autograd": "<HessianAutogradDrawing/>",
  "sampled-label-worked": "<SampledLabelDrawing/>",
  "sampled-batch-worked": "<SampledBatchDrawing/>",
  "ggn-chain": "<GGNChainDrawing/>",
  "ggn-counterexample": "<GGNScalarDrawing/>",
  "sophia-refresh": "<SophiaRefreshDrawing/>",
  "prodigy-displacement": "<ProdigyDisplacementDrawing/>",
  "prodigy-state": "<ProdigyStateDrawing/>",
  "averaging-points": "<ScheduleFreePointsDrawing/>",
  "averaging-history": "<ScheduleFreeHistoryDrawing/>",
  "averaging-adam-route": "<ScheduleFreeAdamDrawing/>",
  "averaging-storage": "<ScheduleFreeStorageDrawing/>",
  "averaging-theorem": "<ScheduleFreeConvexDrawing/>",
  "study-roles": "<OptimizerDataRolesDrawing/>",
  "memory-factor-values": "<OptimizerFactorDrawing/>",
  "resource-work": "<OptimizerWorkDrawing/>",
  "muon-polar": "<MuonPolarDrawing/>",
  "memory-global": "<OptimizerMemoryDrawing global ranks={1} allocations={[{name:'weights',total:140e9},{name:'gradients',total:280e9},{name:'optimizer buffers',total:560e9}]}/>",
  "update": "<OptimizerOpeningFlowLab/>",
  "lion-worked": "<LionWorkedFlowFigure/>",
  "lion-actions": "<LionFlowActions/>",
  "sophia-actions": "<SophiaClipFlowActions/>",
  "hessian-probe-actions": "<HessianProbeFlowActions/>",
  "sampled-actions": "<SampledCurvatureFlowActions/>",
  "prodigy-worked": "<ProdigyWorkedFlowFigure/>",
  "prodigy-actions": "<ProdigyFlowActions/>",
  "averaging-worked": "<ScheduleFreeWorkedFlowFigure/>",
  "averaging-actions": "<ScheduleFreeFlowActions/>",
  "study-actions": "<OptimizerStudyFlowActions/>",
  "memory-actions": "<OptimizerMemoryFlowActions/>",
  "file-index": "<OptimizerFlowSupportingFiles/>",
  "lion-evidence": "<LionFlowLab view=\"evidence\"/>",
  "lion-update": "<LionFlowLab view=\"update\"/>",
  "lion-memory": "<LionFlowLab view=\"memory\"/>",
  "lion-sequence": "<LionFlowLab view=\"sequence\"/>",
  "sophia-coordinates": "<SophiaClipFlowLab view=\"coordinates\"/>",
  "sophia-step-scale": "<SophiaClipFlowLab view=\"scale\"/>",
  "hessian-probe-matrix": "<HessianProbeFlowLab view=\"matrix\"/>",
  "hessian-probe-choice": "<HessianProbeFlowLab view=\"probe\"/>",
  "sampled-example": "<SampledCurvatureFlowLab view=\"example\"/>",
  "sampled-target": "<SampledCurvatureFlowLab view=\"target\"/>",
  "sampled-enumeration": "<SampledCurvatureFlowLab view=\"enumeration\"/>",
  "prodigy-global": "<ProdigyFlowLab view=\"global\"/>",
  "prodigy-objective": "<ProdigyFlowLab view=\"objective\"/>",
  "prodigy-scale": "<ProdigyFlowLab view=\"scale\"/>",
  "prodigy-chronology": "<ProdigyFlowLab view=\"chronology\"/>",
  "averaging-objective": "<ScheduleFreeFlowLab view=\"objective\"/>",
  "averaging-mixing": "<ScheduleFreeFlowLab view=\"mixing\"/>",
  "averaging-perturbation": "<ScheduleFreeFlowLab view=\"perturbation\"/>",
  "averaging-length": "<ScheduleFreeFlowLab view=\"length\"/>",
  "averaging-weights": "<ScheduleFreeFlowLab view=\"weights\"/>",
  "study-image": "<OptimizerWorkedStudyFlow view=\"image\"/>",
  "study-model": "<OptimizerWorkedStudyFlow view=\"model\"/>",
  "study-gradient": "<OptimizerWorkedStudyFlow view=\"gradient\"/>",
  "memory-payload": "<OptimizerMemoryFlowLab view=\"payload\"/>",
  "memory-ownership": "<OptimizerMemoryFlowLab view=\"ownership\"/>",
  "memory-factor-shape": "<OptimizerMemoryFlowLab view=\"shape\"/>",
  "study-edit": "<OptimizerDigitFlowLab view=\"image\"/>",
  "study-target": "<OptimizerDigitFlowLab view=\"target\"/>",
  "study-coordinate": "<OptimizerDigitFlowLab view=\"coordinate\"/>",
  "study-representation": "<OptimizerDigitFlowLab view=\"representation\"/>",
  "study-probabilities": "<OptimizerDigitFlowLab view=\"probabilities\"/>",
  "study-curves": "<OptimizerHistoryFlow/>",
  "study-state-curves": "<OptimizerHistoryFlow view=\"state\"/>",
  "rules-program": "<OptimizerFlowProgram file=\"optimizer_rules.py\" title=\"Complete runnable optimizer_rules.py\"/>",
  "study-program": "<OptimizerFlowProgram file=\"optimizer_study.py\" title=\"Complete runnable optimizer_study.py\"/>",
  "calculations-program": "<OptimizerFlowProgram file=\"optimizer_calculations.py\" title=\"Complete runnable optimizer_calculations.py\"/>",
  "curvature-program": "<OptimizerFlowProgram file=\"optimizer-curvature-instruments.py\" title=\"Complete runnable optimizer-curvature-instruments.py\"/>",
  "library-program": "<OptimizerFlowProgram file=\"optimizer_library_bridge.py\" title=\"Complete runnable optimizer_library_bridge.py\"/><OptimizerFlowProgram file=\"lion_pytorch.py\" title=\"Complete pinned Lion library implementation\"/><OptimizerFlowProgram file=\"sophia.py\" title=\"Complete pinned Sophia library implementation\"/>"
};
let manuscript=fs.readFileSync(`${draft}/lesson.md`,'utf8').replaceAll('\r\n','\n');
const replacements=[],seen=new Set();
manuscript=manuscript.replace(/<!-- OPT_FLOW ([a-z-]+) -->/g,(_,name)=>{if(!views[name]||seen.has(name))throw Error('Unknown or duplicate flow anchor: '+name);seen.add(name);const marker=`OPT_VIEW_${name}_END`;replacements.push([marker,views[name]]);return marker;}).replace(/<!--[^]*?-->/g,'');
if(seen.size!==Object.keys(views).length)throw Error('Missing authored view: '+Object.keys(views).filter(name=>!seen.has(name)).join(','));
const {jsx,sections}=renderPreparedLesson(manuscript,{assetBase:`/learn-assets/${id}/`,replacements,endings:[{level:'H2',title:'10. Practice and transfer',kind:'practice'},{level:'H2',title:'11. Reproduce the calculations',kind:'resources'},{level:'H2',title:'12. References and other ways to learn',kind:'references'},{level:'H2',title:'13. What to learn next',kind:'next'}]});
if(sections.length!==13||!manuscript.includes('### 9.')||seen.size!==78)throw Error('Specialist sections, practice or planned views changed; reconcile the explicit contract.');
const body=`// Generated from the complete optimizer manuscript; authoring renderer owns this source.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import {AdamCorrectionDrawing,AdamHistoriesDrawing,AdamImpulseDrawing,AdamUpdateDrawing,CurvatureBowlsDrawing,GGNChainDrawing,GGNScalarDrawing,HessianAutogradDrawing,HessianProbeDrawing,MuonPolarDrawing,OptimizerFactorDrawing,OptimizerMemoryDrawing,OptimizerObjectiveDrawing,OptimizerProbabilityDrawing,OptimizerScoresDrawing,OptimizerWorkDrawing,ProdigyDisplacementDrawing,ProdigyStateDrawing,SampledBatchDrawing,SampledLabelDrawing,ScheduleFreeAdamDrawing,ScheduleFreeConvexDrawing,ScheduleFreeHistoryDrawing,ScheduleFreePointsDrawing,ScheduleFreeStorageDrawing,SophiaRefreshDrawing} from '../../components/lesson-labs/AdvancedOptimizerFlowFigures.jsx';
import {AdvancedOptimizerFlowProvider,HessianProbeFlowActions,HessianProbeFlowLab,LionFlowActions,LionFlowLab,LionWorkedFlowFigure,OptimizerAdaptationFlowProvider,OptimizerAveragingFlowProvider,OptimizerMemoryFlowActions,OptimizerMemoryFlowLab,OptimizerMemoryFlowProvider,OptimizerOpeningFlowLab,ProdigyFlowActions,ProdigyFlowLab,ProdigyWorkedFlowFigure,SampledCurvatureFlowActions,SampledCurvatureFlowLab,ScheduleFreeFlowActions,ScheduleFreeFlowLab,ScheduleFreeWorkedFlowFigure,SophiaClipFlowActions,SophiaClipFlowLab,SophiaFlowProvider} from '../../components/lesson-labs/AdvancedOptimizerFlowLabs.jsx';
import {AdvancedOptimizerStudyFlowProvider,OptimizerHistoryFlowProvider,OptimizerWorkedStudyFlow,OptimizerDataRolesDrawing,OptimizerDigitFlowLab,OptimizerHistoryFlow,OptimizerStudyFlowActions,OptimizerFlowProgram,OptimizerFlowSupportingFiles} from '../../components/lesson-labs/AdvancedOptimizerFlowStudy.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/advanced-optimizer-flow.css';
export default {title:'Advanced Optimizers: Lion, Sophia, Prodigy and Schedule-Free',readTime:'~90 min read + investigations and practice',hasIntegratedGuide:true,content:()=> <AdvancedOptimizerFlowProvider><SophiaFlowProvider><OptimizerAdaptationFlowProvider><OptimizerAveragingFlowProvider><OptimizerMemoryFlowProvider><AdvancedOptimizerStudyFlowProvider><OptimizerHistoryFlowProvider><div className="neural-lesson neural-lesson-neutral lesson-flow advanced-optimizer-flow">
<LessonIntro prerequisites="Weighted sums and gradients; the small classifier and update are refreshed here before optimizer state is introduced." sections={${JSON.stringify(sections)}}>Understand how an optimizer turns a gradient and its retained state into a parameter change, then test each mechanism on an actual classifier.</LessonIntro>
${jsx}
</div></OptimizerHistoryFlowProvider></AdvancedOptimizerStudyFlowProvider></OptimizerMemoryFlowProvider></OptimizerAveragingFlowProvider></OptimizerAdaptationFlowProvider></SophiaFlowProvider></AdvancedOptimizerFlowProvider>};
`;
for(const name of ['Figures','Labs','Study'])parse(fs.readFileSync(`src/learn/components/lesson-labs/AdvancedOptimizerFlow${name}.jsx`,'utf8'),{sourceType:'module',plugins:['jsx']});
parse(body,{sourceType:'module',plugins:['jsx']});
if(operation==='--check'){
 if(fs.readFileSync(target,'utf8')!==body)throw Error('Runtime topic differs from complete authored manuscript.');
 if(!fs.readFileSync(`${draft}/optimizer-curvature-instruments.py`).equals(fs.readFileSync(`public/learn-assets/${id}/optimizer-curvature-instruments.py`)))throw Error('New program exact copy mismatch.');
}else if(operation==='--preview'){
 const output='scratch/reading-flow/advanced-optimizer-authored-preview.jsx';fs.writeFileSync(output,body);
}else{
 const rollback=JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/optimizers-before-reading-flow/sources.json','utf8')).files.find(entry=>entry.path===target).sha256;
 const accepted=fs.existsSync(record)?JSON.parse(fs.readFileSync(record,'utf8')).generatedSha256:rollback;
 if(hash(fs.readFileSync(target))!==accepted)throw Error('Refusing unrecognized lesson edit.');
 const newFile=`public/learn-assets/${id}/optimizer-curvature-instruments.py`,newBytes=fs.readFileSync(`${draft}/optimizer-curvature-instruments.py`);
 if(fs.existsSync(newFile)&&!fs.readFileSync(newFile).equals(newBytes))throw Error('Refusing unrecognized new program edit.');
 fs.writeFileSync(newFile,newBytes);fs.writeFileSync(target+'.tmp',body);fs.renameSync(target+'.tmp',target);
 fs.writeFileSync(record,JSON.stringify({purpose:'Mutable pure-render binding; not independent review or phase completion',manuscriptSha256:hash(fs.readFileSync(`${draft}/lesson.md`)),generatedSha256:hash(Buffer.from(body)),sections:sections.length,flowAnchors:seen.size,programs:[...programs,'optimizer-curvature-instruments.py']},null,2)+'\n');
}
console.log(JSON.stringify({operation,sections:sections.length,flowAnchors:seen.size,preservedScientificFiles:scientific.files.length,completePrograms:7}));
