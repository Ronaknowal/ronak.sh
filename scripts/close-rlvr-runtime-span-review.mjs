import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const dir=path.join(root,'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/runtime-independent-preparation');
const source='src/learn/data/rlvr-models.js';
const before=fs.readFileSync(path.join(dir,'reviewed-model-source.js'));
const after=fs.readFileSync(path.join(root,source));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const old=await import(`data:text/javascript;base64,${before.toString('base64')}`);
const current=await import(`data:text/javascript;base64,${after.toString('base64')}`);
const checks=[];
function check(name,actual,expected){
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(`${name}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
  checks.push(name);
}
check('predecessor source identity',sha(before),'9a6525627dec7f5c4bbc157612e3f93f42be9fc46ad9ab37c71a9641d2e8fb24');
const strip=text=>text.replace(/export function extractNumber[\s\S]*?(?=export function verdict)/,'').replace(/^export const armLabel =.*$/m,'');
check('all unrelated exported source exact',strip(before.toString()),strip(after.toString()));
const rows=[
 ['🙂 #### 72',false,[7,9],'72'],
 ['####   ',false,[7,7],null],
 ['🙂 ####   ',false,[9,9],null],
 ['🙂 \\boxed{72}',true,[9,11],'72'],
 ['🙂 \\boxed{}',true,[9,9],null],
 ['🙂 \\boxed{1',true,[9,10],null],
 ['🙂 \\boxed{\\frac{1}{2}}',true,[9,20],'1/2'],
 ['48+24=72.\n#### 72',false,[15,17],'72'],
 ['#### 24\n#### 72',false,[13,15],'72'],
];
for(const [text,boxed,span,parsed] of rows){
  const a=current.extractNumber(text,boxed),b=old.extractNumber(text,boxed);
  check('exact character span '+JSON.stringify(text),a.span,span);
  check('same parsed object '+JSON.stringify(text),a.parsed,parsed);
  check('unchanged extraction semantics '+JSON.stringify(text),{parsed:a.parsed,reason:a.reason},{parsed:b.parsed,reason:b.reason});
  check('valid displayed interval '+JSON.stringify(text),a.span[0]>=0&&a.span[0]<=a.span[1]&&a.span[1]<=Array.from(text).length,true);
  if(parsed==='72')check('actual selected characters '+JSON.stringify(text),Array.from(text).slice(...span).join(''),'72');
}
const fixtures=JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json')));
for(const row of fixtures.parser_contract){
  const a=current.verdict(row.prediction,row.gold),b=old.verdict(row.prediction,row.gold);
  delete a.span;delete b.span;
  check('unchanged verdict and reward '+JSON.stringify(row),a,b);
}
check('actual frozen unscaled arm label',current.armLabel('unscaled-centred-grpo'),'Unscaled GRPO');
check('current source remains fixed',sha(fs.readFileSync(path.join(root,source))),sha(after));
const snapshot=path.join(dir,'span-successor-model-source.js');
if(fs.existsSync(snapshot))throw new Error('Preserve earlier span successor');
fs.writeFileSync(snapshot,after);
const report={status:'R1 span finding closed; preliminary numerical review only',conditions:checks.length,checks,source,predecessor_sha256:sha(before),successor_sha256:sha(after),scope:'Focused Unicode/empty/boxed span and verdict conservation checks; unrelated exports byte identical except actual unscaled-arm label correction. Prior numerical pass reused. No browser/scientific work or whole runtime acceptance.'};
const output=path.join(dir,'span-closure-checks.json');if(fs.existsSync(output))throw new Error('Existing receipt must remain');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({conditions:checks.length,successor_sha256:sha(after),receipt_sha256:sha(fs.readFileSync(output))}));
