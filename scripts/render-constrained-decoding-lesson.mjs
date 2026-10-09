import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import {renderPreparedLesson} from './lib/prepared-lesson-renderer.mjs';
const b='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const accepted=JSON.parse(fs.readFileSync(`${b}/content-release-root.json`));
const manuscript=fs.readFileSync(`${b}/lesson.md`,'utf8');
assert.equal(sha(`${b}/lesson.md`),accepted.files[`${b}/lesson.md`]);
const groups={Foundations:['RecordAnatomy','ThreeChecks','PrefixLanguage','DecimalMachine','WholeToken','MaskedMass','FilterOrder','RegularCompiler','VocabularyTrie','StateTokenIndex','Utf8Bytes','CrossFieldToken'],State:['NestedTree','ParserStack','ForkRollback','GenerationLoop','StopStates','FutureMass','LibraryOwnership','RequestState'],Evidence:['NativeMaskTrace','ExtractionRecord','PairedOutcomes','AdaptiveMask','OverlapTimeline','CompileAmortization','ContractDecision']};
const programs=[...manuscript.matchAll(/<!-- CODE ([a-z_]+\.py) -->/g)].map(m=>m[1]);
const replacements=[...manuscript.matchAll(/<!-- (D\d+) (\w+) -->/g)].map(m=>[m[0],`<${m[2]}/>`]).concat(programs.map(p=>[`<!-- CODE ${p} -->`,`<Program file="${p}"/>`]));
const render=(s,options={})=>renderPreparedLesson(s.replaceAll('\r\n','\n'),{assetBase:'/learn/examples/constrained-decoding/',...options,replacements:replacements.filter(([key])=>s.includes(key))}).jsx;
const [main,tail]=manuscript.split('## Practice'),[practice,end]=tail.split('## Summary');
const exercises=practice.split(/(?=^### \d+\. )/m);
let body='<section>'+render(main,{opening:[['**Useful prerequisites:**','prerequisites'],['**First pass:**','route']]})+'</section><section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"Practice"}</H2>'+render(exercises.shift());
for(const task of exercises){const[q,rest]=task.split('**Hint:**'),[hint,answer]=rest.split('**Solution:**');assert.ok(answer);body+=`<section className="cd-practice" data-lesson-exercise>${render(q)}<details><summary>Hint</summary>${render(hint)}</details><details><summary>Worked solution</summary>${render(answer)}</details></section>`;}
assert.equal(exercises.length,14);body+='</section><section>'+render('## Summary'+end);
for(const[heading,kind] of [['Programs and saved results','resources'],['Further learning','further-learning'],['Technical references','references']])body=body.replace(`<H2>{${JSON.stringify(heading)}}</H2>`,`</section><section className="lesson-ending lesson-ending--${kind}" data-lesson-ending="${kind}"><H2>{${JSON.stringify(heading)}}</H2>`);
body+='</section>';
const aliases=[['1. Turn a source statement into a record','1-why-it-exists'],['2. Keep a prefix that can still become valid','2-core-intuition'],['4. Remove illegal probability mass, then choose','3-math-foundation'],['6. Compile a finite contract from small parts','4-from-scratch-implementation'],['10. Use ordinary Outlines and XGrammar APIs','5-production-implementation'],['3. Match the entire token, including its bytes','6-visual-walkthrough'],['13. Choose the contract and debug the first broken boundary','7-decision-matrix'],['12. Explain overhead with the actual work','8-what-scales-and-what-doesn-t'],['8. Connect grammar state to model state','9-failure-modes-gotchas'],['Technical references','10-primary-sources'],['Practice','11-self-check-exercises']];
for(const[h,id]of aliases){const target=`<H2>{${JSON.stringify(h)}}</H2>`;assert.ok(body.includes(target));body=body.replace(target,`<span id="${id}" aria-hidden="true"/>${target}`);}
const files=[...programs,'sampling.py','README.md','requirements.txt','files.json','constrained-decoding.zip'];
body=body.replace('<H2>{"Programs and saved results"}</H2>','<H2>{"Programs and saved results"}</H2><ul>'+files.map(file=>`<li><a href="/learn/examples/constrained-decoding/${file}" download>${file}</a></li>`).join('')+'</ul>');
const src=`// Rendered from the accepted complete manuscript by scripts/render-constrained-decoding-lesson.mjs.
import {Prose,H2,H3,CodeBlock} from '../../../../src/learn/components/content';
import {Math as InlineMath,MathBlock} from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {Table as NeuralTable} from '../../../../src/learn/components/lesson-labs/ConstrainedDecodingShared.jsx';
${Object.entries(groups).map(([group,names])=>`import {${names.join(',')}} from '../../../../src/learn/components/lesson-labs/ConstrainedDecoding${group}.jsx';`).join('\n')}
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
function Program({file}){return <RemoteCodeBlock source={'/learn/examples/constrained-decoding/'+file} language="python" title={file} filename={file}/>;}
function ConstrainedDecodingLesson(){return <div className="lesson-flow cd-flow">${body}</div>;}
export default {title:'Structured Output & Constrained Decoding (Outlines, XGrammar)',slug:'constrained-decoding',readTime:'~75 min read + 75 min practice',content:ConstrainedDecodingLesson};
`;
parse(src,{sourceType:'module',plugins:['jsx']});assert.ok(!src.includes('<!--'));
fs.writeFileSync(`${b}/lesson.jsx`,src);
fs.mkdirSync('public/learn/examples/constrained-decoding',{recursive:true});
fs.cpSync(`${b}/examples`,'public/learn/examples/constrained-decoding',{recursive:true});
fs.writeFileSync(`${b}/runtime-compatibility.json`,JSON.stringify({manuscript:sha(`${b}/lesson.md`),runtime:sha(`${b}/lesson.jsx`),figures:27,programs,practices:14,aliases},null,2)+'\n');
console.log(JSON.stringify({figures:27,programs:programs.length,practices:14}));
