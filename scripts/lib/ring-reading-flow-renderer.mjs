// Pure authoring render with an explicit source-bound write guard; no training/results writers.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from '@babel/parser';
import {renderPreparedLesson} from './prepared-lesson-renderer.mjs';
const id='ring-attention-sequence-parallelism',draft=`docs/teaching/drafts/${id}`,target=`src/learn/data/topics/${id}.jsx`,record=`docs/teaching/deep-learning-beginner/${id}/reading-flow-generated-source.json`;
const flags=process.argv.slice(2),check=flags.includes('--check'),write=flags.includes('--write-reading-flow');
if(flags.length!==1||check===write)throw Error('Use --check for pure verification or --write-reading-flow for an explicitly guarded authored revision.');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const scientific=JSON.parse(fs.readFileSync(`docs/teaching/deep-learning-beginner/${id}/reading-flow-scientific-dependencies.json`,'utf8'));
for(const entry of scientific.files)if(hash(fs.readFileSync(entry.path))!==entry.sha256)throw Error('Preserved scientific source changed: '+entry.path);
const programs=['ring-attention-reference.py','distributed_ring.py','attention-partition-study.py','systems-calculations.py','projected-ring-gradients.py'];
for(const name of programs)if(!fs.readFileSync(`${draft}/${name}`).equals(fs.readFileSync(`public/learn-assets/${id}/${name}`)))throw Error('Exact program copy mismatch: '+name);
let manuscript=fs.readFileSync(`${draft}/lesson.md`,'utf8').replaceAll('\r\n','\n'),programIndex=0;
manuscript=manuscript.replace(/```python\n([^]*?)```/g,(_,code)=>{const file=programs[programIndex];if(programIndex>1||code.trim()!==fs.readFileSync(`${draft}/${file}`,'utf8').replaceAll('\r\n','\n').trim())throw Error('Full embedded programme changed: '+file);return `RING_PROGRAM_${programIndex++}`;});
if(programIndex!==2)throw Error('Expected both original complete embedded programmes.');
const views={
 projection:'<RingWarmupLab view="projection"/>',read:'<RingWarmupLab view="read"/>',memory:'<RingMemoryFlowFigure/>',ownership:'<RingOwnershipFlowLab/>','ownership-direction':'<RingOwnershipFlowLab view="direction"/>',
 'scalar-records':'<RingScalarFlowLab/>','scalar-scale':'<RingScalarFlowLab view="scale"/>','scalar-empty':'<RingScalarFlowLab view="empty"/>','scalar-actions':'<RingScalarActions/>',
 identity:'<RingRecordsFlowLab/>',rotary:'<RingRotaryFlowFigure/>',targets:'<RingTargetFigure/>','loss-mass':'<RingLossMassFigure/>','record-edits':'<RingRecordsFlowLab view="metadata"/><RingRecordsOwnershipFlowLab/>','tensor-edits':'<RingRecordsFlowLab view="tensors"/>',
 work:'<RingWorkFlowLab view="pairs"/>','work-assignment':'<RingWorkFlowLab view="ownership"/>','work-swap':'<RingWorkFlowLab view="swap"/>','work-rename':'<RingWorkFlowLab view="rename"/>','work-tiles':'<RingWorkFlowLab view="tiles"/>',
 timeline:'<RingTimelineFlowLab/>','cost-dimensions':'<RingCostFlowLab/>','cost-heads':'<RingCostFlowLab view="heads"/>','cost-batch':'<RingCostFlowLab view="batch"/>','cost-network':'<RingCostFlowLab view="network"/>',
 'scaling-global':'<RingScalingFlowLab/>','scaling-local':'<RingScalingFlowLab view="local"/>','token-budget':'<RingTokenBudgetFigure/>',
 'reshard-route':'<RingReshardFlowLab/>','reshard-dimensions':'<RingReshardFlowLab view="dimensions"/>','reshard-fault':'<RingReshardFlowLab view="fault"/>','kv-constraint':'<RingKVHeadConstraintFigure/>',mesh:'<RingMeshFlowLab/>',hierarchy:'<RingHierarchyFigure/><RingSystemsActions/>',
 'scalar-gradient':'<RingScalarGradientFlowLab/>','gradient-upstream':'<RingGradientFlowLab view="upstream"/>','gradient-return':'<RingGradientFlowLab/>','derivative-check':'<RingDerivativeCheckFlowLab/>','projection-gradients':'<RingProjectionGradientFlowLab/>','source-gradients':'<RingProjectionGradientFlowLab view="source"/>',
 'projected-program':'<RingFlowProgram file="projected-ring-gradients.py" title="Complete projected forward, shared-map gradients and independent library checks"/>','record-actions':'<RingRecordsActions/>',
 ...Object.fromEntries(['source','input','projections','query','donor','join','task','ownership','arrivals','edit','probabilities'].map(view=>['model-'+view,`<RingMovementFlowLab view="${view}"/>`])),
 'model-actions':'<RingStudyActions/>','context-api':'<RingContextAPIFlowFigure/>',buffers:'<RingBufferFlowFigure/>',decode:'<RingScalarFlowLab view="decode"/>'
};
const replacements=[],seen=new Set();
manuscript=manuscript.replace(/<!-- RING_FLOW ([a-z-]+) -->/g,(_,name)=>{if(!views[name]||seen.has(name))throw Error('Unknown or duplicate flow anchor: '+name);seen.add(name);const marker=`RING_VIEW_${name}_END`;replacements.push([marker,views[name]]);return marker;}).replace(/<!--[^]*?-->/g,'');
if(seen.size!==Object.keys(views).length)throw Error('Planned flow drawing is absent: '+Object.keys(views).filter(name=>!seen.has(name)).join(','));
replacements.push(['RING_PROGRAM_0','<RingFlowProgram file="ring-attention-reference.py" title="Complete scratch forward and recomputed backward"/><RingFlowProgram file="attention-partition-study.py" title="Complete retained real-input and derivative study"/><RingFlowProgram file="systems-calculations.py" title="Complete ownership, work and resource calculations"/>'],['RING_PROGRAM_1','<RingFlowProgram file="distributed_ring.py" title="Complete ordinary PyTorch CPU/Gloo multi-process implementation"/>']);
const {jsx,sections}=renderPreparedLesson(manuscript,{preserveOpeningFrom:target,assetBase:`/learn-assets/${id}/`,replacements});
if(sections.length!==15||!jsx.includes('Practice: repair the computation')||!jsx.includes('All2,751'))throw Error('Lost specialist content or practice.');
const body=`// Generated from the complete Ring reading-flow manuscript; source-owned by scripts/generate-ring-attention-lesson.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {RingRotaryFlowFigure,RingTargetFigure,RingLossMassFigure,RingKVHeadConstraintFigure,RingHierarchyFigure,RingTokenBudgetFigure,RingContextAPIFlowFigure,RingBufferFlowFigure} from '../../components/lesson-labs/RingAttentionFlowFigures.jsx';
import {RingFlowProvider,RingWarmupLab,RingOwnershipFlowLab,RingScalarFlowLab,RingScalarActions,RingRecordsFlowLab,RingRecordsOwnershipFlowLab,RingGradientFlowLab,RingScalarGradientFlowLab,RingProjectionGradientFlowLab,RingDerivativeCheckFlowLab,RingRecordsActions} from '../../components/lesson-labs/RingAttentionFlowLabs.jsx';
import {RingSystemsProvider,RingMemoryFlowFigure,RingWorkFlowLab,RingTimelineFlowLab,RingCostFlowLab,RingScalingFlowLab,RingReshardFlowLab,RingMeshFlowLab,RingSystemsActions} from '../../components/lesson-labs/RingAttentionFlowSystems.jsx';
import {RingStudyProvider,RingMovementFlowLab,RingStudyActions,RingFlowProgram} from '../../components/lesson-labs/RingAttentionFlowStudy.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/ring-attention-flow.css';
export default {title:'Ring Attention & Sequence Parallelism',readTime:'~90 min read + investigations, programs and practice',hasIntegratedGuide:true,content:()=> <RingFlowProvider><RingSystemsProvider><RingStudyProvider><div className="neural-lesson neural-lesson-neutral lesson-flow ring-attention-flow">
<LessonIntro prerequisites="Weighted sums, array shapes and gradients; attention is refreshed here before it is distributed." sections={${JSON.stringify(sections)}}>Trace a real attention read, keep its global identities, and follow both its forward information and returning derivatives.</LessonIntro>
${jsx}
</div></RingStudyProvider></RingSystemsProvider></RingFlowProvider>};
`;
for(const name of ['Figures','Labs','Systems','Study'])parse(fs.readFileSync(`src/learn/components/lesson-labs/RingAttentionFlow${name}.jsx`,'utf8'),{sourceType:'module',plugins:['jsx']});
parse(body,{sourceType:'module',plugins:['jsx']});
if(check){if(fs.readFileSync(target,'utf8')!==body)throw Error('Generated topic differs from complete authored manuscript.');}
else{
 const rollback=JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/ring-before-reading-flow/sources.json','utf8')).files.find(f=>f.path===target).sha256;
 const accepted=fs.existsSync(record)?JSON.parse(fs.readFileSync(record,'utf8')).generatedSha256:rollback;
 if(hash(fs.readFileSync(target))!==accepted)throw Error('Refusing to overwrite an unrecognized lesson edit; reconcile its authored source first.');
 fs.writeFileSync(target+'.tmp',body);fs.renameSync(target+'.tmp',target);
 fs.writeFileSync(record,JSON.stringify({purpose:'Mutable pure-render binding, not independent review or completion',manuscriptSha256:hash(fs.readFileSync(`${draft}/lesson.md`)),generatedSha256:hash(Buffer.from(body)),sections:sections.length,flowAnchors:seen.size,programs},null,2)+'\n');
}
console.log(JSON.stringify({operation:check?'pure check':'explicit guarded write',sections:sections.length,flowAnchors:seen.size,completePrograms:programs.length,preservedScientificFiles:scientific.files.length}));
