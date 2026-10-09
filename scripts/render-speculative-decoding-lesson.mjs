import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from '@babel/parser';
import {renderPreparedLesson} from './lib/prepared-lesson-renderer.mjs';
import {headingId} from '../src/learn/components/lesson-navigation.js';
import {format} from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const folder='docs/teaching/llm-architecture-training/speculative-decoding';
const sourcePath=`${folder}/lesson.md`;
const raw=fs.readFileSync(sourcePath,'utf8');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const expected='28a3951724098d951983500f0b49c22a7fab4e416f94f49c598e23d36dfee276';
if(sha(raw)!==expected) throw Error('Accepted manuscript differs');
if(!fs.existsSync(`${folder}/content-release-root.json`)) throw Error('Root content release required');
const names=['DecoderPaths','PolicyProposal','VerificationMatrix','ShiftedScores','RejectionTrace','BonusAndStop','SharedMass','AcceptanceInterval','ResidualRouting','MassRecovery','PrefixFork','SequenceLaw','SupportCases','ProcessedPolicy','RollbackGrid','PendingToken','ScratchAnatomy','CacheParity','TailSum','CostTimeline','WorkMemory','LookaheadPolicies','TreeAttention','GreedyTraversal','TwoProposals','MedusaHeads','EagleOne','EagleThree','NativeCall','PairedObservations','WorkLedger','TokenizerBoundary','ResourceCompetition','PromptLookup','EarlyExit','CheckpointMtp'];
let compatible=raw.replaceAll('\r\n','\n');
const figures=[...compatible.matchAll(/<!-- (D\d\d): [^\n]+ -->/g)];
const programs=[...compatible.matchAll(/<!-- PROGRAM: ([^\n]+) -->/g)];
const practices=[...compatible.matchAll(/### (\d+)\. ([^\n]+)\n\n([\s\S]*?)\n\n<details><summary>Hint<\/summary>([\s\S]*?)<\/details>\n<details><summary>Solution<\/summary>([\s\S]*?)<\/details>/g)];
if(figures.length!==36||programs.length!==12||practices.length!==18) throw Error('Incomplete mechanism/program/practice mapping');
const replacements=[];
for(const m of figures) replacements.push([m[0],`<${names[Number(m[1].slice(1))-1]}/>`]);
for(const m of programs) replacements.push([m[0],`<Program file=${JSON.stringify(m[1])}/>`]);
for(const m of practices){
  const marker=`<!-- PRACTICE ${m[1]} -->`;
  const jsx=`<section className="lesson-exercise" data-lesson-exercise="${m[1]}">${renderPreparedLesson(`### ${m[1]}. ${m[2]}\n\n${m[3]}`).jsx}<details><summary>Hint</summary>${renderPreparedLesson(m[4]).jsx}</details><details><summary>Worked solution</summary>${renderPreparedLesson(m[5]).jsx}</details></section>`;
  compatible=compatible.replace(m[0],marker); replacements.push([marker,jsx]);
}
let body=renderPreparedLesson(compatible,{replacements,opening:[['The [decoding lesson]','prerequisites']],endings:[{title:'17. Independent practice',level:'H2',kind:'practice'},{title:'18. Further learning and readiness',level:'H2',kind:'further-learning'}]}).jsx;
const headings=[...raw.matchAll(/^## (.+)\r?$/gm)].map(m=>m[1].trim());
const aliases=JSON.parse(fs.readFileSync(`${folder}/historical-anchors.json`,'utf8')).aliases;
for(const [alias,target] of Object.entries(aliases)){
  const title=headings.find(h=>headingId(h)===target);
  if(!title) throw Error(`Missing alias destination ${target}`);
  const heading=`<H2>{${JSON.stringify(title)}}</H2>`;
  if(!body.includes(heading)) throw Error(`Missing heading ${title}`);
  body=body.replace(heading,`<span id=${JSON.stringify(alias)} aria-hidden="true"/>${heading}`);
}
const generated=`// Static projection of the accepted manuscript. Scientific programs and observations are unchanged.
import {Prose,H2,H3,CodeBlock} from '../../../../src/learn/components/content';
import {Math as InlineMath,MathBlock as SharedMathBlock} from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {Local,Table} from '../../../../src/learn/components/lesson-labs/SpeculativeElements.jsx';
import {${names.join(',')}} from '../../../../src/learn/components/lesson-labs/SpeculativeDecodingFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock=({children})=><Local label="Mathematical relationship"><SharedMathBlock>{children}</SharedMathBlock></Local>;
const NeuralTable=({headers,rows,caption})=><Table headers={headers} rows={rows} label={caption}/>;
const Program=({file})=><RemoteCodeBlock source={'/learn-code/speculative-decoding/'+file} filename={file} title={file} language="python"/>;
function SpeculativeLesson(){return <div className="lesson-flow speculative-flow">${body}</div>}
export default {title:'Speculative Decoding',readTime:'~100 min read + programs and practice',hasIntegratedGuide:true,content:SpeculativeLesson};
`;
const options={parser:'babel',plugins:[babel,estree],singleQuote:true,printWidth:100};
parse(generated,{sourceType:'module',plugins:['jsx']});
const formatted=await format(generated,options);
fs.writeFileSync(`${folder}/lesson.jsx`,formatted);
const runtimeFiles=['src/learn/data/speculative-decoding-models.js',...['SpeculativeElements','SpeculativeFoundations','SpeculativeCacheCost','SpeculativeProposers','SpeculativeEvidence','SpeculativeDecodingFlow'].map(n=>`src/learn/components/lesson-labs/${n}.jsx`)];
for(const file of runtimeFiles){const text=fs.readFileSync(file,'utf8');parse(text,{sourceType:'module',plugins:['jsx']});fs.writeFileSync(file,await format(text,options));}
fs.writeFileSync(`${folder}/renderer-receipt.json`,JSON.stringify({sourcePath,manuscript:expected,renderer:sha(fs.readFileSync(import.meta.filename)),generated:sha(formatted),figures:figures.map(m=>({id:m[1],component:names[Number(m[1].slice(1))-1]})),programs:programs.map(m=>m[1]),practice:practices.length,aliases,boundary:'Exact accepted prose through the shared static renderer; only mechanism/program markers, practice disclosure markup, historical aliases and reader annotations are projected. No scientific source or output changed.'},null,2)+'\n');
console.log(JSON.stringify({figures:figures.length,programs:programs.length,practice:practices.length,source:sha(formatted)}));
