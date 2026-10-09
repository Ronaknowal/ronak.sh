import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
const topic='docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const accepted=JSON.parse(fs.readFileSync(`${topic}/content-root-inputs.json`)).files;
for(const [p,h] of Object.entries(accepted)) assert.equal(hash(p),h,p);
const old=JSON.parse(fs.readFileSync(`${topic}/runtime-model-checks.json`));
const preserved=fs.readdirSync(`${topic}/runtime-presentation-predecessor`).map(p=>`${topic}/runtime-presentation-predecessor/${p}`);
const recovery={};
for(const [p,h] of Object.entries(old.inputs)) {
  const actual=hash(p)===h?p:preserved.find(q=>hash(q)===h);
  assert.ok(actual,`Missing original ${p}`); recovery[p]={sha256:h,recoveredAt:actual};
}
const base='src/learn/components/lesson-labs/';
const sources=['Shared','Foundations','Sequences','Evidence'].map(x=>`${base}Distillation${x}.jsx`);
for(const p of [...sources,`${topic}/lesson.jsx`,'src/learn/data/distillation-models.js']) parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']});
function normalized(x){return JSON.parse(JSON.stringify(x,(k,v)=>['start','end','loc','extra','leadingComments','trailingComments','innerComments'].includes(k)?undefined:v));}
function outside(p,name){const ast=normalized(parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']}));ast.program.body=ast.program.body.filter(n=>(n.declaration?.id?.name??n.id?.name)!==name);return ast;}
assert.deepEqual(outside(`${base}DistillationFoundations.jsx`,'DistillTemperature'),outside(`${topic}/runtime-presentation-predecessor/Foundations.before-positive-display.jsx`,'DistillTemperature'));
assert.deepEqual(outside(`${base}DistillationShared.jsx`,'Bars'),outside(`${topic}/runtime-presentation-predecessor/Shared.before-positive-display.jsx`,'Bars'));
const css=fs.readFileSync(`${base}distillation-flow.css`,'utf8');
const oldCss=fs.readFileSync(`${topic}/runtime-presentation-predecessor/flow.before-positive-nowrap.css`,'utf8');
assert.equal(css.replace('.distill-figure[data-distill-figure="D07"] .distill-table td:last-child { white-space: nowrap; }\n','').replaceAll('\r\n','\n'),oldCss.replaceAll('\r\n','\n'));
const report={status:'passed',scope:'Presentation conservation only. No scientific fits, model inference, generation, or mechanism-campaign replay.',contentGuards:Object.keys(accepted).length,originalModelInputs:recovery,parsedSources:[...sources,`${topic}/lesson.jsx`,'src/learn/data/distillation-models.js'],lastCorrectionAST:'Only DistillTemperature and Bars differ from immediate beforecopies; final CSS adds only D07 probability nowrap.',files:Object.fromEntries([...sources,`${topic}/lesson.jsx`,`${base}distillation-flow.css`,'src/learn/data/distillation-models.js','scripts/verify-distillation-presentation-closure.mjs'].map(p=>[p,hash(p)]))};
fs.writeFileSync(`${topic}/runtime-presentation-closure.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,contentGuards:report.contentGuards,originalInputs:Object.keys(recovery).length}));
