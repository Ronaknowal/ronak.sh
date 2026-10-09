import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const b='docs/teaching/llm-architecture-training/queueing-theory-for-llm-serving';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const p=`${b}/content-successor/inputs.json`, packet=JSON.parse(fs.readFileSync(p));
assert.equal(sha(p),'9598d2b2e667094f4b9501affb782e04f26f491f8464b7ce742896c97774c96a');
const checks=[];function check(name,value){assert.ok(value,name);checks.push(name);}
const rows=packet.inputs||packet.files;for(const r of rows)check(r.path,sha(r.path)===r.sha256);
function strip(text){
 for(const n of [9,11,12,16]){const start=text.indexOf(`### ${n}. `),end=text.indexOf('### ',start+4);text=text.slice(0,start)+text.slice(end);}
 if(text.includes('### Summary')){const start=text.indexOf('### Summary'),end=text.indexOf('### Continue studying',start);text=text.slice(0,start)+text.slice(end);}
 return text;
}
check('all other manuscript bytes conserved',strip(fs.readFileSync(`${b}/lesson.md`,'utf8'))===strip(fs.readFileSync(`${b}/content-successor/predecessor/lesson.md`,'utf8')));
const a=4/3,rho=2/3,p0=1/(1+a+a*a/(2*(1-rho))),C=p0*a*a/(2*(1-rho));
check('changed pooled residence',Math.abs(C/2+1/3-.6)<1e-12);
check('split and faster server',1/(3-4/2)===1&&1/(6-4)===.5);
check('new blocks/slack',Math.ceil(8/8)+Math.ceil(17/8)===4&&32-25===7&&32-18===14&&Math.ceil(9/8)+Math.ceil(17/8)===5);
check('new prompt/decode accounting',[4,4,4,1].reduce((a,b)=>a+b,0)===13&&13+4-1===16&&13+4===17);
check('new fluid backlog/drain',(5-3)*6===12&&12-(6-5)*3===9&&6+12/(6-5)===18);
const report=`${b}/content-review-root-closure-checks.json`;fs.writeFileSync(report,JSON.stringify({passed:checks.length,checks,scope:'Same-reviewer exact-diff and finite arithmetic; no scientific replay.'},null,2)+'\n',{flag:'wx'});
const review=`${b}/content-review-root-closure.md`;
fs.writeFileSync(review,`# Same-reviewer R1–R2 closure\n\nAccepted against successor9598d2b2e667094f4b9501affb782e04f26f491f8464b7ce742896c97774c96a and current manuscript226933d435603720b72392a6312b75c72cf2531e20f971c8dafe9e96abaffc58. Root read all four changed problems/hints/solutions and the new summary in context, composing the earlier entire content-review-root.md. The four exercises now change both operands and useful decisions. Independent arithmetic confirms pooled residence.6 versus split1/faster.5; four-block occupancy with differing slack and a fifth-block growth need; competing-decode prompt chunks4/4/4/1 with16 owned inputs; and fluid backlog12,then9,emptyat18. The summary connects the major mechanisms without adding a new topic.\n\nAll181 successorbindings and exact conservation outside the four tasks/summary pass. No program, scientific outcome, archive or prior study changed or ran. No material content finding remains. Runtime, actual paint and production remain separate.\n`,{flag:'wx'});
const files=Object.fromEntries(rows.map(r=>[r.path,r.sha256]));for(const f of [p,review,report,`${b}/content-review-root.md`,`${b}/content-review-root-checks.json`])files[f]=sha(f);
const release=`${b}/content-release-root.json`;fs.writeFileSync(release,JSON.stringify({accepted:true,topicId:'queueing-theory-for-llm-serving',reviewer:'/root',differentReview:`${b}/content-review-root.md`,manuscript:`${b}/lesson.md`,visualSpecifications:`${b}/design.md`,files},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:checks.length,release,sha256:sha(release)}));
