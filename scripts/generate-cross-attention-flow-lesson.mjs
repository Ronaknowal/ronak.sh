import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
const id='interleaved-cross-attention-architectures', draft=`docs/teaching/drafts/${id}`, owner=`docs/teaching/deep-learning-beginner/${id}`;
const input=fs.readFileSync(`${draft}/reading-flow-lesson.md`,'utf8');
let serial=0;const calls=[];
const manuscript=input.replaceAll('\r\n','\n').replace(/^@@ (\w+)(.*)$/gm,(_,name,props)=>{const key=`@@ drawing-call-${serial++}:`;calls.push([key,`<${name}${props}/>`]);return key;});
const {jsx,sections}=renderPreparedLesson(manuscript,{assetBase:`/learn-code/${id}/`,replacements:calls,
  opening:[['**Explore as you read.**','exploration'],['**First pass:**','route'],['You need vector dot products','prerequisites']],
  endings:[{level:'H2',title:'9. Practice, hints and solutions',kind:'practice'},{level:'H2',title:'10. What to read or watch next',kind:'resources'},
    {level:'H3',title:'Implementation files',kind:'references'},{level:'H3',title:'Check readiness and continue',kind:'next'}]});
if(sections.length!==10)throw new Error(`Expected ten stable H2 sections, got${sections.length}`);
const imports=`import {Prose,H2,H3,CodeBlock} from '/src/learn/components/content/index.js';
import {Math as InlineMath,MathBlock} from '/src/learn/components/content/Math.jsx';
import {LessonIntro} from '/src/learn/components/lesson-labs/LessonElements.jsx';
import {NeuralTable} from '/src/learn/components/lesson-labs/NeuralLessonElements.jsx';
import {CrossFlowProvider} from '/src/learn/components/lesson-labs/CrossAttentionFlowState.jsx';
import {CrossReadAnatomy,CrossReadTrace,CrossPermissionRead,CrossDonorPairing,CrossSourceProjection,CrossRectangularShapes,CrossHeadAssembly,CrossResidualDrawing,CrossCreditDrawing,CrossMaskConvention} from '/src/learn/components/lesson-labs/CrossAttentionFlowRead.jsx';
import {CrossArrivalRoutes,CrossFusionDepth,CrossIndirectRoute,CrossSourceDependencies,CrossAnswerShift,CrossSlotResampler,CrossCompressionCollision,CrossGateForward,CrossGateCredit,CrossFrozenCredit} from '/src/learn/components/lesson-labs/CrossAttentionFlowConnectors.jsx';
import {CrossFlamingoDrawing,CrossBlipObjectives,CrossBlipHandoff,CrossPrefixChoices} from '/src/learn/components/lesson-labs/CrossAttentionFlowArchitectures.jsx';
import {CrossStudyProvider,CrossTwoQuestions,CrossGroupSplit,CrossClassifierDrawing,CrossAllFits,CrossPairingControls,CrossRecordedReads,CrossOriginalMaps,CrossSavedInitial,CrossSavedImage,CrossFlowProgram,CrossFlowFiles} from '/src/learn/components/lesson-labs/CrossAttentionFlowStudy.jsx';
import {CrossCacheProvider,CrossPairCosts,CrossCachePayload,CrossProjectedCache,CrossCacheInvalidation,CrossCausalMemory,CrossYocoSharing,CrossBrokenRoute} from '/src/learn/components/lesson-labs/CrossAttentionFlowCache.jsx';
import '/src/learn/components/lesson-labs/neural-lesson-neutral.css';`;
const body=`// Unpublished reading-flow candidate from the complete current topic manuscript.
${imports}
export default {title:'Interleaved / Cross-Attention Architectures',readTime:'Reading,live calculations and independent practice',hasIntegratedGuide:true,content:()=> <div className="neural-lesson neural-lesson-neutral cross-flow lesson-flow"><CrossFlowProvider><CrossStudyProvider><CrossCacheProvider>
<LessonIntro prerequisites="Dot products,softmax and residual learning; the linked prerequisite operations are refreshed locally.">Follow which separate memory a question may read,what it returns,and which information remains available for the next question.</LessonIntro>
${jsx}
</CrossCacheProvider></CrossStudyProvider></CrossFlowProvider></div>};
`;
parse(body,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(`${owner}/reading-flow-candidate.jsx`,body);
const publication=body.replaceAll("'/src/learn/components/","'../../components/").replace("'../../components/content/index.js'","'../../components/content'");
parse(publication,{sourceType:'module',plugins:['jsx']});fs.writeFileSync(`${owner}/reading-flow-publication.jsx`,publication);
// Only new programs/assets are copied. Historical source and active publication
// have no write path in this generator. Root alone publishes the accepted body.
for(const file of ['cross_attention_mechanisms.py','saved_cross_image.py'])fs.copyFileSync(`${draft}/${file}`,`public/learn-code/${id}/${file}`);
fs.copyFileSync(`${draft}/cross-11-state.json`,`public/learn-assets/${id}/cross-11-state.json`);
console.log(JSON.stringify({candidate:`${owner}/reading-flow-candidate.jsx`,publication:`${owner}/reading-flow-publication.jsx`,sections:sections.length,calls:calls.length,activePublished:false}));
