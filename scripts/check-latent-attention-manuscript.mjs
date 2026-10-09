import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parse} from '@babel/parser';
import katex from 'katex';

const topic='src/learn/data/topics/multi-head-latent-attention-mla.jsx',source=fs.readFileSync(topic,'utf8'),checks=[],mathematics=[];
const tree=parse(source,{sourceType:'module',plugins:['jsx']}),statement=(name,actual,expected,tolerance=1e-10)=>{
  const error=Math.abs(actual-expected);assert.ok(error<=tolerance,`${name}: ${actual} != ${expected}`);checks.push({name,actual,expected,error,tolerance});
};
const printed=(name,literal,actual,decimals=6)=>{const rounded=actual.toFixed(decimals);assert.equal(rounded,literal,`${name} rounding`);assert.ok(source.includes(literal),`${name} literal not present`);checks.push({name,literal,actual,rounding:decimals});};
function value(node){if(node?.type==='StringLiteral')return node.value;if(node?.type==='TaggedTemplateExpression'&&node.tag.type==='MemberExpression'&&node.tag.object.name==='String'&&node.tag.property.name==='raw')return node.quasi.quasis.map(part=>part.value.raw).join('');return null;}
function walk(node){if(!node||typeof node!=='object')return;
if(node.type==='JSXExpressionContainer')assert.notEqual(node.expression.type,'SequenceExpression',`Accidental unquoted TeX comma/subscript inside JSX at line ${node.loc.start.line}`);
if(node.type==='JSXElement'&&['MathBlock','InlineMath'].includes(node.openingElement.name.name)){
  for(const child of node.children){if(child.type!=='JSXExpressionContainer')continue;const tex=value(child.expression);assert.notEqual(tex,null,'Every displayed formula is statically inspectable');assert.ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(tex),'Math contains an escaped control character');assert.ok(!/(?<!\\)\b(?:mathbb|operatorname|lVert|rVert|qquad|tfrac)\b/.test(tex),`Missing TeX command slash: ${tex}`);katex.renderToString(tex,{throwOnError:true,displayMode:node.openingElement.name.name==='MathBlock',strict:'error'});mathematics.push({line:node.loc.start.line,tex});}
}for(const [key,item]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(item))item.forEach(walk);else if(item&&typeof item==='object')walk(item);}}
walk(tree);
// Independently written scalar arithmetic for every published hand-case result.
const softmax=scores=>{const m=Math.max(...scores),e=scores.map(v=>Math.exp(v-m)),z=e.reduce((a,b)=>a+b,0);return e.map(v=>v/z);},mix=(a,c)=>c[0].map((_,j)=>a.reduce((total,w,i)=>total+w*c[i][j],0));
const c=[[1,0],[0,1],[1,1]],content0=softmax([1/Math.sqrt(2),0,1/Math.sqrt(2)]),content1=softmax([Math.SQRT2,0,Math.SQRT2]),m0=mix(content0,c),m1=mix(content1,c),o1=[2*m1[0],m1[0]-m1[1]],position0=softmax([0,0,1]),position1=softmax([1,-.5,1]),p0=mix(position0,c),p1=mix(position1,c),pwrite=[2*p1[0],p1[0]-p1[1]];
for(const [name,literal,actual]of [['content head0 coordinate0','0.802224',m0[0]],['content head0 coordinate1','0.598888',m0[1]],['content head1 write0','1.783233',o1[0]],['content head1 write1','0.337425',o1[1]],['content final0','1.693841',m0[0]+.5*o1[0]],['content final1','0.767600',m0[1]+.5*o1[1]],['position weight0','0.211942',position0[0]],['position weight2','0.576117',position0[2]],['position head0','0.788058',p0[0]],['position head1 weight0','0.449816',position1[0]],['position head1 weight1','0.100368',position1[1]],['position head1 mix0','0.899632',p1[0]],['position head1 mix1','0.550184',p1[1]],['position head1 write0','1.799265',pwrite[0]],['position head1 write1','0.349449',pwrite[1]],['position final0','1.687691',p0[0]+.5*pwrite[0]],['position final1','0.962783',p0[1]+.5*pwrite[1]],['GVA head1 direct0','0.891617',m1[0]],['GVA head1 direct1','0.554192',m1[1]],['RMS3/4 divisor','3.535534',Math.sqrt(12.5+1e-6)],['RMS3/4 output0','0.848528',3/Math.sqrt(12.5+1e-6)],['RMS3/4 output1','2.262742',8/Math.sqrt(12.5+1e-6)],['query divisor','1.581139',Math.sqrt(2.5+1e-6)],['query unit0','0.632455',1/Math.sqrt(2.5+1e-6)],['query unit1','1.264911',2/Math.sqrt(2.5+1e-6)]])printed(name,literal,actual);
const rows=[[1/3,1/3,1/3],softmax([0,1,2]),softmax([0,2,4])],det=rows[0][0]*(rows[1][1]*rows[2][2]-rows[1][2]*rows[2][1])-rows[0][1]*(rows[1][0]*rows[2][2]-rows[1][2]*rows[2][0])+rows[0][2]*(rows[1][0]*rows[2][1]-rows[1][1]*rows[2][0]);printed('rank-three softmax determinant','0.024431',det);
for(const [name,actual,expected]of [['plain record',128*(128+128),32768],['GQA8 record',8*(128+128),2048],['MQA record',128+128,256],['literal expanded record',128*(128+64+128),40960],['shared rotary expanded record',128*(128+128)+64,32832],['compact record',512+64,576],['compact bytes',60*32768*576*2,2264924160],['compact GiB',60*32768*576*2/2**30,2.109375],['MHA GiB',60*32768*32768*2/2**30,120],['GQA GiB',60*32768*2048*2/2**30,7.5],['MQA ratio',576/256,2.25],['core ratio',(2*512+64)/(128+64+128),3.4],['expanded core',2*128*32768*(128+64+128),2684354560],['absorbed core',2*128*32768*(2*512+64),9126805504],['reconstruction',2*32768*128*512*(128+128),1099511627776],['query factor',2*128*128*512,16777216],['mixed value factor',2*128*512*128,16777216],['656 pinned record',512+16+64*2,656],['practice payload',2*12*2048*(24+8)*2,3145728],['practice MiB',3145728/2**20,3],['practice expanded',2*8*1024*(8+4+8),327680],['practice absorbed',2*8*1024*(2*32+4),1114112],['practice ReLU before',1/3*0+2/3*1,2/3],['practice ReLU after',Math.max(0,1/3*(-2)+2/3),0],['scalar ReLU before',.5*0+.5*1,.5],['scalar ReLU after',Math.max(0,.5*(-1)+.5),0],['SVD squared discard',2**2,4],['new cache reserved',2*8*(5+2)*8,896],['new cache occupied',2*4*(5+2)*8,448]])statement(name,actual,expected);
const report=JSON.parse(fs.readFileSync('public/learn-assets/multi-head-latent-attention-mla/author-results.json','utf8')),model=JSON.parse(fs.readFileSync('public/learn-assets/multi-head-latent-attention-mla/forecast-model.json','utf8'));
// Recompute reported RMSE from preserved MSE, without retraining or replacing the original study.
for(const [kind,metrics]of [['full',report.full_metrics],['rank4',report.rank4_intervention_metrics]])for(const split of ['validation','test'])printed(`${kind}/${split} RMSE`,metrics[split].rmse_original_coordinate.toFixed(6),Math.sqrt(metrics[split].mse_transformed)/2);
statement('actual saved parameter count',Object.values(model.weights).flat(Infinity).length,4118,0);
statement('duplicate-aware unique trajectories',360-report.duplicate_source_rows.length,330,0);
for(const [split,count]of [['train',220],['validation',50],['test',60]])statement(`${split} complete trajectory count`,report.split_source_rows[split].length,count,0);
statement('selected budget-end step',report.training.selected_step,200,0);
statement('discarded singular squared sum',report.singular_values_joint_up_projection.slice(4).reduce((sum,v)=>sum+v*v,0),report.discarded_singular_squared_sum,1e-5);
// Separate finite-difference execution of the newly printed local derivative formulas.
const local={q:[1,1],key:[[1,1],[1,-1]],value:[[2,0],[1,-1]],c:[[1,0],[0,1],[1,1]]},g=[.7,-.3],r=[0,-1,0],scale=.5;
const mv=(map,row)=>map.map(line=>line.reduce((total,v,i)=>total+v*row[i],0)),dot=(a,b)=>a.reduce((total,v,i)=>total+v*b[i],0);
function localRead(state){const effective=state.c[0].map((_,j)=>state.q.reduce((sum,v,i)=>sum+v*state.key[i][j],0)),a=softmax(state.c.map((row,i)=>(dot(effective,row)+r[i])*scale)),m=mix(a,state.c);return{effective,a,m,loss:dot(g,mv(state.value,m))};}
const live=localRead(local),beta=local.c[0].map((_,j)=>g.reduce((sum,v,i)=>sum+v*local.value[i][j],0)),delta=live.a.map((a,s)=>a*dot(beta,local.c[s].map((v,j)=>v-live.m[j]))),scoreDirection=local.c[0].map((_,j)=>delta.reduce((sum,d,s)=>sum+d*local.c[s][j],0));
statement('local score derivatives sum zero',delta.reduce((a,b)=>a+b,0),0,1e-15);
const gradients={q:mv(local.key,scoreDirection).map(v=>v*scale),key:local.q.map(q=>scoreDirection.map(v=>q*v*scale)),value:g.map(v=>live.m.map(m=>v*m)),c:local.c.map((row,s)=>row.map((_,j)=>live.a[s]*beta[j]+delta[s]*live.effective[j]*scale))};
for(const name of ['q','key','value','c'])for(let i=0;i<local[name].length;i++)for(let j=0;j<(Array.isArray(local[name][i])?local[name][i].length:1);j++){
  const plus=structuredClone(local),minus=structuredClone(local),epsilon=1e-6;
  if(Array.isArray(local[name][i])){plus[name][i][j]+=epsilon;minus[name][i][j]-=epsilon;}else{plus[name][i]+=epsilon;minus[name][i]-=epsilon;}
  statement(`new printed ${name} derivative ${i}:${j}`,Array.isArray(gradients[name][i])?gradients[name][i][j]:gradients[name][i],(localRead(plus).loss-localRead(minus).loss)/(2*epsilon),2e-9);
}
printed('discarded Frobenius error','2.862722',report.rank4_frobenius_squared_error);
for(const [key,literals]of [['full_investigation',['0.599737','0.263627']],['rank4_investigation',['0.613758','0.260927']]])model[key].next_prediction.forEach((value,i)=>printed(`${key} forecast coordinate${i}`,literals[i],value));
model.full_investigation.true_next_point.forEach((value,i)=>printed(`withheld point coordinate${i}`,['0.593810','0.250000'][i],value));
model.full_investigation.edited_next_prediction.forEach((value,i)=>printed(`reflected point intervention coordinate${i}`,['0.600519','0.263407'][i],value));
model.full_investigation.wrong_scale_next_prediction.forEach((value,i)=>printed(`wrong scale coordinate${i}`,['0.599745','0.263674'][i],value));
assert.equal((source.match(/data-lesson-exercise=/g)||[]).length,9,'All original practices preserved');
const paths=[topic,'src/learn/components/lesson-labs/LatentAttentionFactorFigures.jsx','public/learn-assets/multi-head-latent-attention-mla/author-results.json','public/learn-assets/multi-head-latent-attention-mla/forecast-model.json'];
fs.writeFileSync('docs/teaching/deep-learning-beginner/multi-head-latent-attention-mla/reading-flow-author-manuscript-checks.json',JSON.stringify({date:new Date().toISOString(),scope:'Author printed arithmetic, complete static TeX audit, preserved metric/parameter/source binding; no browser acceptance or new scientific fit.',sources:paths.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),mathematics,checks},null,2)+'\n');
console.log(`${checks.length} manuscript arithmetic/binding checks and ${mathematics.length} static math expressions passed.`);
