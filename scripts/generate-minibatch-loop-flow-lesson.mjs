import fs from 'node:fs';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
const id='mini-batches-training-loops-gradient-accumulation',draft=`docs/teaching/drafts/${id}`,record=`docs/teaching/deep-learning-beginner/${id}`;
let fenced=false,display=false;
const original=fs.readFileSync(`${draft}/reading-flow-lesson.md`,'utf8');
const replacements=[...original.matchAll(/^@@ (\w+)(.*)$/gm)].map(([line,name,props],index)=>[line,`<${name}${props}/>`]);
let manuscript=original.replaceAll('\r\n','\n').split('\n').map(line=>{
  if(line.startsWith('```')){fenced=!fenced;return line;}
  if(fenced)return line;
  if(line==='$$'){display=!display;return display?'\\[':'\\]';}
  return line.replace(/\$([^$]+)\$/g,(_,math)=>`\\(${math}\\)`);
}).join('\n');
// Repeated visual components have distinct exact anchors; annotate each occurrence.
let serial=0;const calls=[];
manuscript=manuscript.replace(/^@@ (\w+)(.*)$/gm,(_,name,props)=>{const key=`@@ call-${serial++}:`;calls.push([key,`<${name}${props}/>`]);return key;});
const {jsx,sections}=renderPreparedLesson(manuscript,{assetBase:`/learn-assets/${id}/`,replacements:calls,
  opening:[['**Explore as you read.**','exploration'],['**First pass:**','route'],['You need to read','prerequisites']],
  endings:[{level:'H2',title:'10. Can you change the group and still justify the result?',kind:'practice'},
    {level:'H3',title:'Implementation files',kind:'references'},{level:'H3',title:'References & another way to learn it',kind:'resources'},
    {level:'H3',title:'Check readiness and continue',kind:'next'}]});
const imports=`import {Prose,H2,H3,CodeBlock} from '/src/learn/components/content/index.js';
import {Math as InlineMath,MathBlock} from '/src/learn/components/content/Math.jsx';
import {MinibatchTable as NeuralTable,MinibatchDeliveryDrawing,MinibatchScalarDrawing,MinibatchMeanDrawing,MinibatchAccumulationDrawing,MinibatchUpdateDrawing} from '/src/learn/components/lesson-labs/MinibatchLoopFlowFigures.jsx';
import {MinibatchFlowProvider,MinibatchScalarInvestigation,MinibatchMassInvestigation,MinibatchNormalizationInvestigation,MinibatchNormalizationWorkedDrawing,MinibatchSampleInvestigation,MinibatchMemoryInvestigation} from '/src/learn/components/lesson-labs/MinibatchLoopFlowLabs.jsx';
import {MinibatchInfluenceDrawing,MinibatchLifetimeDrawing,MinibatchLoopDrawing,MinibatchLateMassDrawing,MinibatchTargetDrawing,MinibatchLossAlignmentDrawing,MinibatchRunningDrawing,MinibatchDropoutInvestigation,MinibatchCurvatureDrawing,MinibatchClippingDrawing,MinibatchRegularizerDrawing,MinibatchAmpDrawing,MinibatchDdpDrawing} from '/src/learn/components/lesson-labs/MinibatchLoopBoundaryFigures.jsx';
import {MinibatchIrisProvider,MinibatchIrisStatus,MinibatchFlowerAnatomy,MinibatchIrisInvestigation,MinibatchMeasuredHistory,MinibatchFlowProgram,MinibatchFlowFiles} from '/src/learn/components/lesson-labs/MinibatchLoopFlowStudy.jsx';`;
const body=`// Topic reading-flow candidate; produced from the complete current manuscript.
${imports}
export default {title:'Mini-batches, Training Loops and Gradient Accumulation',readTime:'Reading, live investigations and independent practice',content:()=> <div className="neural-lesson neural-lesson-neutral minibatch-flow lesson-flow"><MinibatchFlowProvider><MinibatchIrisProvider>
${jsx}
</MinibatchIrisProvider></MinibatchFlowProvider></div>};
`;
parse(body,{sourceType:'module',plugins:['jsx']});
if(sections.length!==10)throw Error(`Expected complete ten-section route, got ${sections.length}`);
fs.writeFileSync(`${record}/reading-flow-candidate.jsx`,body);
const published=body.replaceAll("'/src/learn/components/","'../../components/").replace("'../../components/content/index.js'","'../../components/content'");
parse(published,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(`${record}/reading-flow-publication.jsx`,published);
if(process.argv.includes('--publish'))fs.writeFileSync(`src/learn/data/topics/${id}.jsx`,published);
console.log(JSON.stringify({candidate:`${record}/reading-flow-candidate.jsx`,publication:`${record}/reading-flow-publication.jsx`,sections:sections.length,visualCalls:calls.length,published:process.argv.includes('--publish')}));
