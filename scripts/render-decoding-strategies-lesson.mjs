import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from '@babel/parser';
import {renderPreparedLesson} from './lib/prepared-lesson-renderer.mjs';
import {format} from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const folder='docs/teaching/llm-architecture-training/decoding-strategies-greedy-beam-top-k-top-p-temperature';
const manuscriptSource = `${folder}/runtime-review-successor/lesson.md`;
const raw=fs.readFileSync(manuscriptSource,'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const expected='9d487b60ce5ce0e6b16af259d5689525c289e392f33b5649bfa76fe2e2360a89';
if(hash(raw)!==expected)throw Error('Frozen manuscript changed');
if(!fs.existsSync(`${folder}/content-acceptance.json`))throw Error('Content acceptance required');
const normalized=raw.replaceAll('\r\n','\n');
const figures=[...normalized.matchAll(/:::visual (D\d\d) (\w+)\n([\s\S]*?)\n:::/g)];
const programs=[...normalized.matchAll(/:::program ([^\n]+)\n:::/g)];
const practices=[...normalized.matchAll(/:::practice (\d+) ([^\n]+)\n([\s\S]*?)\nHint: ([\s\S]*?)\nSolution: ([\s\S]*?)\n:::/g)];
// Finite practice-only typography projection. All non-whitespace characters stay exact.
const practiceSpacing = [
 ['are0','are 0'], ['draw.74','draw .74'], ['exactly.75','exactly .75'],
 ['logits(log4,log2,log1)','logits (log 4, log 2, log 1)'], ['by.5','by .5'],
 ['become16','become 16'], ['are4','are 4'], ['than2','than 2'], ['to(','to ('],
 ['log2≈.693147nats','log 2 ≈ .693147 nats'], ['k2','k 2'], ['and.71','and .71'],
 ['to.70','to .70'], ['reaching.90','reaching .90'], ['are(','are ('], ['and(','and ('],
 ['min-p.25','min-p .25'], ['m0','m 0'], ['m1','m 1'], ['Multiply.25','Multiply .25'],
 ['peak.6','peak .6'], ['is.15','is .15'], ['T2','T 2'], ['min-p.3','min-p .3'],
 ['with.3','with .3'], ['weights(','weights ('], ['sqrt.8','sqrt .8'], ['sqrt.15','sqrt .15'],
 ['sqrt.05','sqrt .05'], ['is.25','is .25'], ['approximately(','approximately ('],
 ['2,token','2, token'], ['3,token','3, token'], ['1,token','1, token'],
 ['meeting.25','meeting .25'], ['Top-p.25','Top-p .25'], ['are[','are ['],
 ['bias−.5','bias −.5'], ['gives[','gives ['], ['is“','is “'], ['indices3','indices 3'],
 ['through5','through 5'], ['end6','end 6'], ['leaves“','leaves “'],
 ['beam2','beam 2'], ['are.1925','are .1925'], ['and.05','and .05'], ['Beam2','Beam 2'],
 ['approximately−','approximately −'], ['and−','and −'], ['are−','are −'], ['is−','is −'],
 ['score−','score −'], ['masses(','masses ('], ['total.675','total .675'], ['gives(','gives ('],
 ['at32','at 32'], ['retain53','retain 53'], ['IDs(','IDs ('],
 ['(.91629,1.20397,1.60944,2.30259)','(.91629, 1.20397, 1.60944, 2.30259)'],
 ['(.36356,.07588,.32958,1.02273)','(.36356, .07588, .32958, 1.02273)'],
];
const spacingChanges=[];
for(const match of practices) for(const i of [3,4,5]) {
 const before=match[i]; let after=before;
 for(const [from,to] of practiceSpacing) after=after.replaceAll(from,to);
 if(before.replace(/\s/g,'')!==after.replace(/\s/g,'')) throw Error('Practice semantic change');
 if(before!==after) spacingChanges.push({practice:match[1],field:i,before,after});
 match[i]=after;
}
fs.writeFileSync(`${folder}/runtime-paint-correction/practice-spacing.json`,JSON.stringify({manuscript:expected,changes:spacingChanges,rule:'Whitespace only in explicitly listed practice literals; no manuscript mutation.'},null,2)+'\n');
if(figures.length!==30||programs.length!==9||practices.length!==18)throw Error('Incomplete contracts');
const replacements=[];
let compatible=normalized;
for(const match of figures){const marker=`<!-- ${match[1]} -->`;compatible=compatible.replace(match[0],marker);replacements.push([marker,`<${match[2]} />`]);}
for(const match of programs){const marker=`<!-- PROGRAM ${match[1]} -->`;compatible=compatible.replace(match[0],marker);replacements.push([marker,`<Program file=${JSON.stringify(match[1])} />`]);}
for(const match of practices){const marker=`<!-- PRACTICE ${match[1]} -->`;compatible=compatible.replace(match[0],marker);const content=`<section className="lesson-exercise" data-lesson-exercise="${match[1]}">${renderPreparedLesson(`### ${match[1]}. ${match[2]}\n\n${match[3]}`).jsx}<details><summary>Hint</summary>${renderPreparedLesson(match[4]).jsx}</details><details><summary>Worked solution</summary>${renderPreparedLesson(match[5]).jsx}</details></section>`;replacements.push([marker,content]);}
// Resolve stable lesson IDs into the actual reader route, retaining fragments.
compatible=compatible.replace(/\]\(\/learn\/([^/)#?]+)(#[^)]*)?\)/g,(_,id,fragment='')=>`](/learn/path/full-curriculum/${id}?module=large-language-models${fragment})`);
let body=renderPreparedLesson(compatible,{replacements,opening:[['The prerequisite is','prerequisites']],endings:[{title:'18. Practice',level:'H2',kind:'practice'},{title:'19. Programs and evidence',level:'H2',kind:'resources'},{title:'20. Sources and next steps',level:'H2',kind:'references'},{title:'What to carry forward',level:'H3',kind:'next'},{title:'Ready to continue',level:'H3',kind:'next'}]}).jsx;
const headings=[...normalized.matchAll(/^## (.+)$/gm)].map(m=>m[1]);
const aliases=JSON.parse(fs.readFileSync(`${folder}/legacy-aliases.json`,'utf8'));
for(const [id,n] of Object.entries(aliases)){const heading=`<H2>{${JSON.stringify(headings[n-1])}}</H2>`;if(!body.includes(heading))throw Error(`Missing alias ${id}`);body=body.replace(heading,`<span id=${JSON.stringify(id)} aria-hidden="true"/>${heading}`);}
const source=`// Static projection of the accepted manuscript; no text parser ships in this lesson.
import {Prose,H2,H3,CodeBlock} from '../../../../src/learn/components/content';
import {Math as InlineMath,MathBlock as SharedMathBlock} from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {Local,Table} from '../../../../src/learn/components/lesson-labs/DecodingElements.jsx';
import {${figures.map(m=>m[2]).join(',')}} from '../../../../src/learn/components/lesson-labs/DecodingStrategiesFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock=({children})=><Local label="Mathematical relationship"><SharedMathBlock>{children}</SharedMathBlock></Local>;
const NeuralTable=({headers,rows,caption})=><Table headers={headers} rows={rows} label={caption}/>;
const Program=({file})=><RemoteCodeBlock source={'/learn-code/decoding-strategies/'+file} filename={file} title={file} language="python"/>;
function DecodingLesson(){return <div className="lesson-flow decoding-flow">${body}</div>}
export default {title:'Decoding Strategies (Greedy, Beam, Top-k, Top-p, Temperature)',readTime:'~85 min read + programs and practice',hasIntegratedGuide:true,content:DecodingLesson};
`;
parse(source,{sourceType:'module',plugins:['jsx']});
const formatted=await format(source,{parser:'babel',plugins:[babel,estree],singleQuote:true,printWidth:100});
fs.writeFileSync(`${folder}/lesson.jsx`,formatted);
fs.writeFileSync(`${folder}/renderer-receipt.json`,JSON.stringify({manuscriptSource,manuscript:expected,generated:hash(formatted),renderer:hash(fs.readFileSync(import.meta.filename)),figures:figures.map(m=>({id:m[1],name:m[2]})),programs:programs.map(m=>m[1]),practices:practices.length,aliases,boundary:'Frozen prose preserved through the shared static renderer; only visual/program/practice directives and stable-ID hrefs adapted. No scientific source changed.'},null,2)+'\n');
for(const file of ['src/learn/data/decoding-strategies-models.js',...['DecodingElements','DecodingFoundations','DecodingFilters','DecodingSearch','DecodingEvidence','DecodingStrategiesFlow'].map(n=>`src/learn/components/lesson-labs/${n}.jsx`)]){
  const text=fs.readFileSync(file,'utf8');parse(text,{sourceType:'module',plugins:['jsx']});fs.writeFileSync(file,await format(text,{parser:'babel',plugins:[babel,estree],singleQuote:true,printWidth:100}));
}
console.log(JSON.stringify({figures:30,programs:9,practice:18,hash:hash(formatted)}));
