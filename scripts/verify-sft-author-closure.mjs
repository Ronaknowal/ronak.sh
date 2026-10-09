import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from '@babel/parser';
const topic='docs/teaching/llm-architecture-training/supervised-fine-tuning-sft';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const acceptance=JSON.parse(fs.readFileSync(topic+'/content-acceptance.json'));
for(const[p,h]of Object.entries(acceptance.bindings))assert.equal(sha(p),h,p);
const old=JSON.parse(fs.readFileSync(topic+'/runtime-model-checks.json'));
assert.equal(sha('src/learn/data/sft-models.js'),old.bindings['src/learn/data/sft-models.js']);
const paths=[topic+'/lesson.jsx','scripts/render-sft-lesson.mjs','src/learn/data/sft-runtime-data.json','src/learn/data/sft-models.js',...['SftFlowShared','SftFoundations','SftBatching','SftStudy'].map(n=>'src/learn/components/lesson-labs/'+n+'.jsx'),'src/learn/components/lesson-labs/sft-flow.css'];
for(const p of paths.filter(p=>p.endsWith('.jsx')))parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']});
function literals(file){const ast=parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});const vals=[];function walk(x){if(!x||typeof x!=='object')return;if(x.type==='StringLiteral')vals.push(x.value);for(const[k,v]of Object.entries(x))if(!['loc','extra','start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(ast);return vals.join('').replace(/\s/g,'');}
assert.equal(literals(topic+'/lesson.jsx'),literals(topic+'/runtime-author-predecessor/lesson.jsx'));
const current=fs.readFileSync(topic+'/lesson.jsx','utf8');
const from=current.indexOf('<H2>{"Key takeaways"}');const until=current.indexOf('<H2>{"Further learning"}');
const tail=current.slice(from,until);assert.equal((tail.match(/<ul>/g)||[]).length,1);assert.equal((tail.match(/<li>/g)||[]).length,6);assert.equal((tail.match(/<Prose/g)||[]).length,0);
const report={status:'passed',contentGuards:Object.keys(acceptance.bindings).length,numericalModelUnchanged:true,allJsxParses:true,rendererAllStringLiteralCharactersConserved:true,completeTakeawayItems:6,fits:0,scientificGenerations:0,bindings:Object.fromEntries(paths.map(p=>[p,sha(p)]))};
fs.writeFileSync(topic+'/runtime-author-closure-checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
