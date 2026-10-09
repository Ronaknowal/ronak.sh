import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import {renderPreparedLesson} from './lib/prepared-lesson-renderer.mjs';

const directory='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const manuscript=fs.readFileSync(`${directory}/lesson.md`,'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const expected='82ea16117019e1d4068ed127bae25b56d866580c4b5d739cd1980354f03f9790';
if(hash(manuscript)!==expected)throw Error('Accepted manuscript changed');
const groups={
  Foundations:['Tensors','Aliasing','Causal','Edit','Namespace','Boundary','Resident','Pairs','Units'],
  Storage:['States','Owners','Admission','Union','Fork','Hash','Trace','History','Denominators'],
  Native:['Snapshot','Native','Allocator'],
  Policy:['Radix','Pins','DepthFirst','Waiting','Providers','Cost','Session','Trust'],
};
const names=Object.values(groups).flat();
const programs=[...manuscript.matchAll(/<!-- PROGRAM: ([a-z_]+\.py) -->/g)].map(m=>m[1]);
if(names.length!==29||programs.length!==12)throw Error('Wrong mapping');
const replacements=[...names.map((name,i)=>[`<!-- D${String(i+1).padStart(2,'0')}:`,`<Pc${name} />`]),...programs.map(file=>[`<!-- PROGRAM: ${file}`,`<Program file="${file}" />`])];
function render(text,options={}) {
  const joined=text.replaceAll('\r\n','\n').replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm,block=>block.replace(/\n {2}/g,' '));
  return renderPreparedLesson(joined,{...options,replacements:replacements.filter(([prefix])=>joined.includes(prefix))}).jsx;
}
const [main,tail]=manuscript.split('## 14. Practice');
const [practice,endings]=tail.split('## 15. Further learning');
let body='<section>\n'+render(main,{opening:[['**You will learn to**','summary'],['**Prerequisites:**','prerequisites'],['**First pass:**','route']]});
body=body.replace('<Program file="prefix_identity.py" />','<Prose><a href="/learn-code/prefix-caching/prefix-caching.zip" download>Download all programs and saved JSON results</a>{" · "}<a href="/learn-code/prefix-caching/README.md">Setup and file guide</a>{" · "}<a href="/learn-code/prefix-caching/SAVED-RESULTS.md">Saved-result scope</a></Prose>\n<Program file="prefix_identity.py" />');
body+='</section>\n<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"14. Practice"}</H2>\n';
const exercises=practice.split(/(?=^### \d+\. )/m);body+=render(exercises.shift());
for(const item of exercises){const [q,rest]=item.split('**Hint:**');const [hint,solution]=rest.split('**Solution:**');if(!solution)throw Error('Missing solution');body+=`<section className="pc-practice" data-lesson-exercise>${render(q)}<details><summary>Hint</summary>${render(hint)}</details><details><summary>Worked solution</summary>${render(solution)}</details></section>\n`;}
body+=render('## 15. Further learning'+endings);
for(const [title,kind] of [['15. Further learning','further-learning'],['16. Technical references and runnable files','references'],['17. Ready to continue','readiness']])body=body.replace(`<H2>{${JSON.stringify(title)}}</H2>`,`</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}"><H2>{${JSON.stringify(title)}}</H2>`);
body+='</section>';
const helpers=['prefix_study.py','observations.py','tiny_causal_lm.py','cached_decoder.py','native_cache.py','acquire_model.py'];
body=body.replace('<H2>{"16. Technical references and runnable files"}</H2>', '<H2>{"16. Technical references and runnable files"}</H2><Prose>Complete orchestration and prerequisite files:</Prose><ul>'+helpers.map(file=>`<li><a href="/learn-code/prefix-caching/${file}" download>${file}</a></li>`).join('')+'</ul>');
const aliases=JSON.parse(fs.readFileSync(`${directory}/legacy-aliases.json`,'utf8'));
aliases['8-what-scales-and-what-doesn-t']=aliases['8-what-scales-and-what-doesnt'];
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');let matched=0;
body=body.replace(/<H2>\{("(?:[^"\\]|\\.)*")}<\/H2>/g,(heading,literal)=>{const entries=Object.entries(aliases).filter(([,target])=>target===slug(JSON.parse(literal)));matched+=entries.length;return entries.map(([id])=>`<span id="${id}" aria-hidden="true" />`).join('\n')+heading;});
if(matched!==12)throw Error('Missing aliases');
body=body.replaceAll('className="neural-equation"','className="pc-equation"').replaceAll('><','>\n<');
const source=`// Generated from the accepted manuscript by scripts/render-prefix-caching-lesson.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {Table as NeuralTable} from '../../components/lesson-labs/PrefixCachingShared.jsx';
${Object.entries(groups).map(([group,items])=>`import {${items.map(x=>'Pc'+x).join(',')}} from '../../components/lesson-labs/PrefixCaching${group}.jsx';`).join('\n')}
import '../../components/lesson-labs/lesson-flow.css';
const Program=({file})=><RemoteCodeBlock source={'/learn-code/prefix-caching/'+file} language="python" title={file} filename={file}/>;
function PrefixCachingLesson(){return <div className="lesson-flow pc-flow">${body}</div>;}
export default {title:'Prefix Caching & Prompt Caching',slug:'prefix-caching-prompt-caching',readTime:'~75 min read + 75 min practice',content:PrefixCachingLesson};
`;
parse(source,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(`${directory}/lesson.jsx`,source);
fs.writeFileSync(`${directory}/runtime-compatibility.json`,JSON.stringify({manuscript:expected,aliases,figures:names,programs,presentation:'Faithful immutable manuscript; 29 figure replacements, 12 complete source views, separate hint/solution controls, setup links and compatible aliases.'},null,2)+'\n');
console.log(JSON.stringify({manuscript:expected,runtime:hash(source),figures:names.length,programs:programs.length,practices:exercises.length,aliases:matched}));
