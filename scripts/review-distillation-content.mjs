import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const folder='docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation';
const base='public/learn-code/llm-distillation/results';
const read=f=>JSON.parse(fs.readFileSync(f));
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let conditions=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);conditions++;};
const near=(a,b,t=1e-10)=>{assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);conditions++;};
const sum=a=>a.reduce((s,x)=>s+x,0);
const inputs=read(`${folder}/content-inputs.json`).inputs;
const correction=read(`${folder}/setup-correction/inputs.json`);
eq(sha(`${folder}/content-inputs.json`),'340c0fcfa73be8e1f909132a5c2d6ab9ad7d89a2cfa0d30b87693af58033de6e');
for(const [f,h] of Object.entries(inputs)) eq(sha(f.endsWith('/lesson.md')?correction.predecessor.path:f),h,f);
eq(sha(correction.changed.path),correction.changed.sha256);
const old=fs.readFileSync(correction.predecessor.path,'utf8');
const current=fs.readFileSync(correction.changed.path,'utf8');
const start=current.indexOf('**Run the finite examples.**');
const end=current.indexOf('<!-- PROGRAM distillation_loss.py -->');
eq(current.slice(0,start)+current.slice(end),old,'one setup insertion only');
const teacher=read(`${base}/arithmetic/teacher/completed.json`);
eq(teacher.selected_step,[...teacher.history].sort((a,b)=>a.dev.nll-b.dev.nll||a.step-b.step)[0].step);
eq([teacher.steps,teacher.parameters,teacher.targets],[1200,117120,172800]);
const corpus=read(`${base}/arithmetic/teacher-candidates.json`);
const parse=(row,answerOnly=false)=>{
  const [a,b,c]=row.parent_id.split(':').map(Number);
  const match=row.text.match(answerOnly?/^(\d+) <eos>$/:/^sum (\d+) ; product (\d+) ; answer (\d+) <eos>$/);
  const structural=Boolean(match&&match.slice(1).every(x=>+x<=108));
  const vals=structural?match.slice(1).map(Number):[];
  const answer=structural?vals.at(-1):null;
  eq(structural,row.check.structural);
  eq(answer,row.check.answer);
  eq(structural&&answer===(a+b)*c,row.check.final_correct);
  if(!answerOnly) eq(structural&&vals[0]===a+b&&vals[1]===vals[0]*c&&answer===vals[1],row.check.all_steps_correct);
  eq(row.length,row.ids.length);
};
for(const row of corpus.candidates){
  parse(row);
  for(const probs of row.log_probs){eq(probs.length,121);near(sum(probs.map(Math.exp)),1,2e-6);}
}
eq(corpus.candidates.length,256);
for(const key of ['structural','final_correct','all_steps_correct']) eq(corpus[key],corpus.candidates.filter(x=>x.check[key]).length);
eq([corpus.structural,corpus.final_correct,corpus.all_steps_correct],[255,253,252]);
eq(new Set(corpus.candidates.filter(x=>x.check.all_steps_correct).map(x=>x.parent_id)).size,128);
eq(corpus.generated_tokens,sum(corpus.candidates.map(x=>x.length)));
const evaluation=read(`${base}/arithmetic/evaluation.json`);
const evaluate=(report,answerOnly=false)=>{
  report.outputs.forEach(row=>parse(row,answerOnly));
  eq(report.records,report.outputs.length);
  eq(report.correct,report.outputs.filter(x=>x.check.final_correct).length);
  near(report.accuracy,report.correct/report.records);
  eq(report.structural,report.outputs.filter(x=>x.check.structural).length);
  eq(report.invalid,report.records-report.structural);
  eq(report.eos_stopped,report.outputs.filter(x=>x.eos_stopped).length);
  near(report.reference.nll,report.reference.sum_nats/report.reference.targets);
  near(report.reference.sum_nats,sum(report.reference.rows.map(x=>x.sum_nats)),1e-8);
};
for(const report of Object.values(evaluation.teacher))evaluate(report);
const starts={};
for(const student of evaluation.students){
  const complete=read(`${base}/arithmetic/${student.arm}-${student.seed}/completed.json`);
  eq(complete.steps,600);
  eq(complete.selected_step,[...complete.history].sort((a,b)=>b.dev.accuracy-a.dev.accuracy||a.step-b.step)[0].step);
  if(starts[student.seed])eq(complete.initial_sha256,starts[student.seed]);else starts[student.seed]=complete.initial_sha256;
  eq(complete.targets,student.arm==='answer'?19126:student.arm==='verified'?85068:86067);
  eq(complete.examples,student.arm==='verified'?9452:9563);
  for(const [split,report] of Object.entries(student.results)){
    evaluate(report,student.arm==='answer');
    const answers=new Map(evaluation.teacher[split].outputs.map(x=>[x.parent_id,x.check.answer]));
    const agreement=report.outputs.filter(x=>x.check.answer!==null&&x.check.answer===answers.get(x.parent_id)).length;
    eq(report.teacher_agreement.valid_equal_answers,agreement);
  }
}
eq(evaluation.students.length,15);
const native=read(`${base}/native/evaluation.json`);
for(const [method,splits] of Object.entries(native.results)) for(const [split,r] of Object.entries(splits)){
  const rows=r.generation.rows;
  eq(rows.length,split==='dev'?105:104);
  for(const route of ['generation','constrained']){
    const obj=r[route], pred=obj.rows;
    const confusion=obj.gold_order.map(g=>obj.prediction_order.map(p=>pred.filter(x=>x.gold===g&&x.prediction===p).length));
    eq(obj.confusion,confusion);
    near(obj.accuracy,pred.filter(x=>x.gold===x.prediction).length/pred.length);
    const f1=obj.gold_order.map((g,i)=>{
      const tp=confusion[i][i],fp=sum(confusion.map(row=>row[i]))-tp,fn=sum(confusion[i])-tp;
      return 2*tp+fp+fn?2*tp/(2*tp+fp+fn):0;
    });
    f1.forEach((v,i)=>near(v,obj.class_f1[i]));near(sum(f1)/f1.length,obj.macro_f1);
  }
  near(r.response.nll,r.response.nll_sum/r.response.targets);
  near(r.response.nll_sum,sum(r.response.rows.map(x=>x.nll_sum)),1e-8);
  if(method==='offline'||method==='on-policy')eq(new Set(rows.map(x=>x.prediction)),new Set(['no impact']));
}
const softmax=(z,T)=>{const a=z.map(x=>x/T),m=Math.max(...a),v=a.map(x=>Math.exp(x-m));return v.map(x=>x/sum(v));};
const kl=(q,p)=>sum(q.map((x,i)=>x*Math.log(x/p[i])));
const t=[2,0,-1,-3],s=[.7,.2,-.1,-.8];
const centered=z=>z.map(x=>x-sum(z)/z.length);
near(sum(centered(s).map((x,i)=>(x-centered(t)[i])**2))/8,.7975);
for(const T of [.25,1,2,8,128]){
  const q=softmax(t,T),p=softmax(s,T),g=p.map((x,i)=>T*(x-q[i]));
  for(let i=0;i<4;i++){
    const hi=[...s],lo=[...s];hi[i]+=1e-5;lo[i]-=1e-5;
    near((T*T*kl(q,softmax(hi,T))-T*T*kl(q,softmax(lo,T)))/2e-5,g[i],3e-7);
  }
  near(sum(g),0,1e-12);
}
near((14067712-13472896)/14067712*100,4.23,.005);
const result={status:'passed',reviewer:'root',conditions,scope:'Independent literal-output arithmetic parsing, all saved target distributions, earliest selection and exposure accounting, both native confusion/F1/NLL routes, finite temperature derivative and setup-only conservation. Zero fits, updates or neural generation.',files:Object.fromEntries([...Object.keys(inputs).filter(f=>!f.endsWith('/lesson.md')),correction.changed.path,correction.predecessor.path,`${folder}/setup-correction/inputs.json`].map(f=>[f,sha(f)]))};
fs.writeFileSync(`${folder}/content-root-checks.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,conditions}));
