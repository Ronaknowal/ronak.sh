import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const topic='docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation';
const owner=topic+'/content-preparation';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[];
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
const bind=(p,role)=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b),role};};
const release=JSON.parse(fs.readFileSync(topic+'/design-research/root-content-release.json'));
const design=JSON.parse(fs.readFileSync(topic+'/design-research/review-correction/author-ready-corrected-design.json'));
for(const item of design.effectiveWholeDesign)check('Accepted design '+item.path,sha(fs.readFileSync(item.path))===item.sha256);
const intake=JSON.parse(fs.readFileSync(owner+'/intake.json'));
const originalIntake=JSON.parse(fs.readFileSync(intake.designIntake.path));
for(const p of originalIntake.protectedPairs){check('Protected current '+p.path,sha(fs.readFileSync(p.path))===p.sha256);check('Protected original '+p.copy,sha(fs.readFileSync(p.copy))===p.copySha256);}
for(const item of intake.retained)check('Retained literal '+item.path,sha(fs.readFileSync(item.path))===item.sha256);
const execution=JSON.parse(fs.readFileSync(owner+'/new-program-execution.json'));
for(const [i,run] of execution.runs.entries())for(const key of ['source','stdout','stderr']){
 check('Actual attempt '+(i+1)+' '+key,sha(fs.readFileSync(owner+'/'+run[key].file))===run[key].sha256);
}
const programs=[['P1','fitted_preparation.py'],['P2','fitted_rulers.py'],['P3','category_policies.py'],['P4','masked_simple_imputation.py'],['P5','nan_aware_donors.py'],['P6','penguins_prepare.py'],['P7','fitted_power_maps.py'],['P8','fitted_quantile_maps.py'],['P9','fitted_target_encoding.py'],['P10','bins_polynomials_cycles.py'],['P11','local_spline_basis.py'],['P12','cross_fit.py'],['P13','signed_feature_hashing.py'],['P14','conditional_iterative_completion.py'],['P15','pool_scalar_analyses.py'],['P16','normal_completion_and_sensitivity.py']];
const retained=new Set(['fitted_preparation.py','penguins_prepare.py','cross_fit.py']);
const all=[...programs,['optional-R','multiple_imputation_mice.R'],['answer','practice_solutions.py']];
const programmeBindings=[];
for(const [id,file] of all){
 const source=bind(owner+'/programs/'+file,id==='answer'?'complete changed-task answer asset':id==='optional-R'?'complete optional ordinary R source; unexecuted':retained.has(file)?'exact retained whole historical programme; no replay':'complete new constructed teaching programme');
 const stream=file.replace(/\.py$/,'.stdout.txt');
 const record={id,source,executionRole:retained.has(file)?'historical retained native receipt':id==='optional-R'?'not executed':'actual new checked process'};
 if(id!=='optional-R'){
  record.stdout=bind(owner+'/programs/'+stream,retained.has(file)?'exact historical stdout literal':'exact captured new stdout bytes');
  if(!retained.has(file)){
   const latest=execution.runs.filter(r=>r.name===file.replace('.py','')&&r.exit===0).at(-1);
   check('Successful current source '+file,latest && latest.source.sha256===source.sha256);
   check('Selected stdout '+file,latest.stdout.sha256===record.stdout.sha256);
   const stderr=owner+'/programs/'+file.replace('.py','.stderr.txt');
   if(fs.statSync(stderr).size)record.stderr=bind(stderr,'exact actual diagnostic, separate from stdout');
   record.actualRun=execution.runs.indexOf(latest)+1;
  }
 }
 programmeBindings.push(record);
}
const csv=fs.readFileSync(owner+'/programs/penguins.csv');
const normalized=csv.toString('utf8').replaceAll('\r\n','\n');
const calc=JSON.parse(fs.readFileSync(owner+'/programs/calculated-inputs.json'));
check('Exact CRLF/LF relation',sha(Buffer.from(normalized))===calc.data_sha256);
const roles={topicId:'feature-scaling-encoding-imputation',rootRelease:bind(topic+'/design-research/root-content-release.json','accepted revision5'),retainedNative:bind('docs/teaching/evidence/scaling-native.json','historical native source/stdout receipt, not rerun'),data:{current:bind(owner+'/programs/penguins.csv','actual current CRLF download bytes; not freshly fitted'),historicalLF:{bytes:Buffer.byteLength(normalized),sha256:sha(Buffer.from(normalized)),role:'exact CRLF-to-LF relation to historical execution-input identity'},sourceOnlyRelation:true,parsedRows:344,savedHeldOutRows:86},programmes:programmeBindings,executionHistory:bind(owner+'/new-program-execution.json','actual source-snapshotted attempts including failures'),resources:bind(topic+'/design-research/review-correction/research-and-coverage.md','inherited exact reading/access scopes, not blanket fresh reading'),limits:['No old mains/fits/science replay','No R execution claim','No rendered/native/runtime/phase acceptance','Counts and source identity do not establish teaching quality']};
fs.writeFileSync(owner+'/programs/source-roles.json',JSON.stringify(roles,null,2)+'\n');
let visualSource=fs.readFileSync(topic+'/design-research/visual-and-investigation-contracts.md','utf8');
const drawings=[...visualSource.matchAll(/^\|(D\d\d) ([^|]+)\|([^|]+)\|([^|]+)\|$/gm)];
const labs=[...visualSource.matchAll(/^\|(L\d+[ab]?) ([^|]+)\|([^|]+)\|([^|]+)\|$/gm)];
check('All full drawing rows',drawings.length===41);check('All full investigation rows',labs.length===16);
const common=visualSource.slice(visualSource.indexOf('## Common drawing protocol'),visualSource.indexOf('## Individual drawing jobs'));
let visual='# Content drawing and investigation specifications\n\nComplete adopted contracts for this full manuscript, with content-time computed refinements. These are actionable content assets; no rendered/native review is claimed. Read visual-refinements.md for exact successor matrices, fit/output roles, policy domains and bounded comparator qualifications. The original accepted design remains unchanged.\n\n'+common;
for(const [,id,question,objects,contrast] of drawings)visual+='\n<a id="'+id.toLowerCase()+'"></a>\n## '+id+' '+question.trim()+'\n\n'+objects.trim()+'\n\n'+contrast.trim()+'\n';
visual+='\n## Investigation behavior shared by all sixteen\n\n'+visualSource.slice(visualSource.indexOf('Controls appear directly below'),visualSource.indexOf('|Lab / location'));
for(const [,id,question,start,contrast] of labs)visual+='\n<a id="'+id.toLowerCase()+'"></a>\n## '+id+' '+question.trim()+'\n\n'+start.trim()+'\n\n'+contrast.trim()+'\n';
visual+='\n## Current refinement and evidence boundary\n\n'+fs.readFileSync(owner+'/visual-refinements.md','utf8').replace(/^# Content-time drawing and investigation refinements\n/,'');
visual=visual.replace('P14 fixture will publish exact coefficients/linear solve','P14 source and actual stream publish exact coefficients/linear solve');
visual=visual.replace('E = exact constructed example with a retained future calculation','E = exact constructed example with an explicit calculation/source role');
visual=visual.replace('Independent calculation pending.','Author arithmetic readback verifies squared norms 1.0001/2; P2 checks matrix support 3/9 and the answer source checks equal dot products.');
visual=visual.replace('no claim these three arbitrary tables form proper MI','the first three actual P16 model-based draws have their own Q/U; validity is conditional on that explicit model');
visual=visual.replace('Complete analyses/matrices and Ubar/B/Bm/T/SE visible.','Complete supplied analyses and Ubar/B/Bm/T/SE visible; the D40 simulated matrices retain their separate P16 Q/U.');
visual=visual.replace('Completions are given constructed examples, not a properimputation sampler.','The editable Q/U are given scalar analyses, separate from P16\'s model-based completion matrices.');
fs.writeFileSync(owner+'/visual-specifications.md',visual);
let manuscript=['core','deeper','practice','ending'].map(x=>fs.readFileSync(owner+'/sections/'+x+'.md','utf8')).join('\n\n');
const placement={drawings:[],labs:[],programmes:[],practice:[]};
manuscript=manuscript.replace(/\[\[(D\d\d)\]\]/g,(_,id)=>{placement.drawings.push(id);return '<!-- Drawing '+id+': visual-specifications.md#'+id.toLowerCase()+'; actual objects and quantitative companion specified in full. -->';});
manuscript=manuscript.replace(/\[\[(L\d+[ab]?)\]\]/g,(_,id)=>{placement.labs.push(id);return '<!-- Investigation '+id+': visual-specifications.md#'+id.toLowerCase()+'; immediate current result and direct-entity controls specified in full. -->';});
const oldLesson=fs.readFileSync('docs/teaching/drafts/feature-scaling-encoding-imputation/lesson.md','utf8').replaceAll('\r\n','\n');
const oldPractice=oldLesson.slice(oldLesson.indexOf('### 1. A changed ruler'),oldLesson.indexOf('## 11. Readiness'));
const originalTasks=[...oldPractice.matchAll(/(^### (\d)\. [\s\S]*?)(?=^### \d\. |$(?![\s\S]))/gm)];
check('Nine exact original task blocks',originalTasks.length===9);
manuscript=manuscript.replace(/\[\[RETAINED_PRACTICE:(\d):(T\d+)\]\]/g,(_,number,id)=>{
 const block=originalTasks.find(m=>m[2]===number)[1].trimEnd();
 placement.practice.push({id,originalNumber:Number(number),exactOriginalBlock:true});
 return '<a id="'+id.toLowerCase()+'"></a>\n<!-- '+id+': exact original practice '+number+' retained below. -->\n'+block;
});
manuscript=manuscript.replace(/\[\[PROGRAM:([^\]]+)\]\]/g,(_,file)=>{
 const record=programmeBindings.find(p=>path.basename(p.source.path)===file);
 if(!record)throw Error('Unknown source '+file);
 placement.programmes.push(record.id);
 const code=fs.readFileSync(record.source.path,'utf8');
 let body='**'+file+' — '+record.executionRole+'.**\n\n```'+(file.endsWith('.R')?'r':'python')+'\n'+code+(code.endsWith('\n')?'':'\n')+'```\n';
 if(record.stdout){const out=fs.readFileSync(record.stdout.path,'utf8');body+='\nWhole recorded stdout ('+record.stdout.role+'):\n\n```text\n'+out+(out.endsWith('\n')?'':'\n')+'```\n';}
 else body+='\nR output is not supplied because execution is not claimed.\n';
 if(record.stderr){const err=fs.readFileSync(record.stderr.path,'utf8');body+='\nSeparate actual stderr diagnostic:\n\n```text\n'+err+(err.endsWith('\n')?'':'\n')+'```\n';}
 return body;
});
const fileIndex=programmeBindings.flatMap(r=>[r.source,...(r.stdout?[r.stdout]:[]),...(r.stderr?[r.stderr]:[])]);
for(const [file,role] of [['penguins.csv','retained actual CRLF data; CC0'],['calculated-inputs.json','retained full split/fit/prediction/transformed-row inputs'],['scaling-native.json','retained historical native receipt'],['source-roles.json','exact source/stream/data roles'],['README.md','complete setup, run and Copy/Download contract'],['requirements.txt','actual tested direct dependency pins']])fileIndex.push(bind(owner+'/programs/'+file,role));
manuscript=manuscript.replace('[[FILE_INDEX]]','```shell\npython -m venv .venv\n# Activate .venv for your platform, then:\npython -m pip install -r requirements.txt\npython fitted_rulers.py\n```\n\n| Actual file | Purpose | Bytes |\n| --- | --- | ---: |\n'+fileIndex.map(x=>'| ['+path.basename(x.path)+'](programs/'+path.basename(x.path)+') | '+x.role+' | '+x.bytes+' |').join('\n')+'\n\nCurrent CSV SHA-256: `'+roles.data.current.sha256+'`; historical LF execution-input SHA-256: `'+roles.data.historicalLF.sha256+'`. Exact newline normalization relates the two; it is not a new numerical run.');
manuscript=manuscript.replace(/^## (\d+\. .+)$/gm,(_,heading)=>'<a id="'+heading.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'"></a>\n## '+heading);
check('No unexpanded assembly directives',!(/\[\[(?:D\d\d|L\d+[ab]?|PROGRAM:|RETAINED_PRACTICE:|FILE_INDEX)/.test(manuscript)));
check('Eleven whole sections',([...manuscript.matchAll(/^## \d+\./gm)]).length===11);
check('Original eleven section identities',JSON.stringify([...oldLesson.matchAll(/^## \d+\. .+$/gm)].map(x=>x[0]))===JSON.stringify([...manuscript.matchAll(/^## \d+\. .+$/gm)].map(x=>x[0])));
const taskIds=[...placement.practice.map(x=>x.id),...[...manuscript.matchAll(/^### (T\d+)\./gm)].map(x=>x[1])];
check('All twenty-six explicit task identities',taskIds.length===26&&new Set(taskIds).size===26&&Array.from({length:26},(_,i)=>'T'+(i+1)).every(x=>taskIds.includes(x)));
check('Every drawing once',placement.drawings.length===41&&new Set(placement.drawings).size===41);
check('Every lab once',placement.labs.length===16&&new Set(placement.labs).size===16);
check('Every source once',placement.programmes.length===18&&new Set(placement.programmes).size===18);
for(const r of programmeBindings){check('Entire programme literal '+r.id,manuscript.includes(fs.readFileSync(r.source.path,'utf8')));if(r.stdout)check('Entire actual stdout '+r.id,manuscript.includes(fs.readFileSync(r.stdout.path,'utf8')));}
fs.writeFileSync(owner+'/lesson.md',manuscript);
fs.writeFileSync(owner+'/composition.json',JSON.stringify({status:'full-draft-assembled-author-whole-read-pending',manuscript:bind(owner+'/lesson.md','complete literal manuscript; author read and different review pending'),visuals:bind(owner+'/visual-specifications.md','full actual-object contracts; no rendered review'),sourceRoles:bind(owner+'/programs/source-roles.json','full source/stream/data manifest'),scope:{sections:11,drawings:41,investigations:16,teachingProgrammes:16,newTeachingProgrammes:13,retained:3,optionalR:1,answerFile:1,solvedTasks:26},placement,checks,fileIndex,rootRelease:bind(topic+'/design-research/root-content-release.json','phase authority'),limits:['This is assembly/source conservation, not a whole author reading','No independent whole-content/runtime/native acceptance','No unchanged historical programme replay']},null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,manuscript:bind(owner+'/lesson.md','full draft'),visuals:bind(owner+'/visual-specifications.md','full contracts'),files:fileIndex.length}));
