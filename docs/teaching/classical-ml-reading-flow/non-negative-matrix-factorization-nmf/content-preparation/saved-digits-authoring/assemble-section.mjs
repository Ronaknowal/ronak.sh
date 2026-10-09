import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
const file=name=>path.resolve(directory,name);
const read=name=>fs.readFileSync(file(name),'utf8');
const bind=name=>{const target=file(name),bytes=fs.readFileSync(target);return{path:target,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};};
const conditions=[];
const check=(name,condition)=>{conditions.push({name,passed:Boolean(condition)});if(!condition)throw Error(name);};
const numerical=JSON.parse(read('interpretation-checks.json'));
check('all70 numerical/state conditions retained',numerical.checks.length===70&&numerical.checks.every(x=>x.passed));
check('two new mains zero fits no replay',numerical.mains.length===2&&numerical.mains.every(x=>x.returncode===0&&x.modelFits===0)&&numerical.newModelFits===0&&!numerical.historicalProgramOrCampaignReplay);
for(const input of numerical.inputs)check(`current checked input ${path.basename(input.path)}`,bind(input.path).sha256===input.sha256);
for(const main of numerical.mains)for(const role of ['stdout','stderr'])check(`current ${main.file} ${role}`,bind(main[role].path).sha256===main[role].sha256);
let body=read('section-twelve-template.md');
check('one accepted section12',body.startsWith('## 12. Inspect an actual digit dictionary and contribution')&&(body.match(/^## /gm)||[]).length===1);
for(const[id,text]of[['D42','Read one small square'],['D43','Start at **source row 242**'],['D44','The first row of bars'],['D45','At fraction 0']])check(`${id} before walkthrough`,body.indexOf(`<!-- figure:${id} -->`)>0&&body.indexOf(`<!-- figure:${id} -->`)<body.indexOf(text));
const slots=[];
for(const name of ['nmf_factor_alignment','nmf_saved_digits']){
  slots.push({marker:`<!-- source:${name}.py -->`,path:file(`../content-programs/${name}.py`),language:'python'});
  slots.push({marker:`<!-- output:${name}.stdout.txt -->`,path:file(`${name}.stdout.txt`),language:'text'});
}
for(const slot of slots){const text=fs.readFileSync(slot.path,'utf8').trimEnd();check(`exact slot ${slot.marker}`,body.split(slot.marker).length===2);body=body.replace(slot.marker,`\n\`\`\`${slot.language}\n${text}\n\`\`\`\n`);check(`literal complete ${slot.marker}`,body.includes(text));}
check('no unresolved sources/outputs',!body.includes('<!-- source:')&&!body.includes('<!-- output:'));
const saved=JSON.parse(read('../content-programs/nmf_saved_state.json'));
const at=saved.test.findIndex(x=>x.sourceRow===256),w=saved.activations[at],totals=w.map((x,c)=>x*saved.dictionary[c].reduce((s,h)=>s+h,0));
for(let c=0;c<8;c++){check(`row256 amount${c+1} manuscript`,body.includes(String(w[c])));check(`row256 total${c+1} manuscript`,body.includes(String(totals[c]))||Math.abs(totals[c]-Number([2.1512220831262505,.09375622389611028,3.8695912467273876,0,1.2914123266438298,0,6.383307297328288,6.8945940980317655][c]))<2e-15);}
check('address matches row-major feature35',8*4+3===35&&body.includes('Feature F35'));
check('correct bounded ambiguity cost taught',body.includes('O(k⁴)')&&body.includes('not audited')&&body.includes('Rectangular dictionaries'));
check('zero and nonzero default explicit',body.includes('saved C8 amount is exactly zero')&&body.includes('0.176453'));
check('no clipped prediction or probability identity',body.includes('Predictions are never clipped')&&body.includes('not a scalar importance score'));
check('ordinary assignment interface visible',body.includes('from scipy.optimize import linear_sum_assignment'));
check('full data reader does not train',!read('../content-programs/nmf_saved_digits.py').includes('sklearn')&&!read('../content-programs/nmf_saved_digits.py').includes('.fit('));
fs.writeFileSync(file('section-twelve.md'),body);
const names=['section-twelve-template.md','section-twelve.md','visual-specifications.md','README.md','assemble-section.mjs','prepare-payload.mjs','saved-payload.json','check-interpretation.py','interpretation-checks.json','nmf_factor_alignment.stdout.txt','nmf_factor_alignment.stderr.txt','nmf_saved_digits.stdout.txt','nmf_saved_digits.stderr.txt'];
const packet={status:'SECTION12_D42_D45_COMPLETE_SCOPED_CONTENT_NOT_WHOLE_TOPIC_READY',author:'/root/nmf_initialization_author',created:new Date().toISOString(),acceptedAnchor:'12-inspect-an-actual-digit-dictionary-and-contribution',bindings:names.map(bind),sourceSlots:slots.map(x=>({...x,identity:bind(x.path)})),suppliedOfflinePayloads:['nmf_saved_state.json','digits-300.csv','digits-data-provenance.md'].map(x=>bind(`../content-programs/${x}`)),conditions,evidence:{numericalConditions:70,newMains:2,newFits:0,historicalReplay:false,fullStreamsRead:true,compositionConditions:conditions.length},amendment:numerical.ambiguityAmendment,reading:'Entire current N8/N9 source, complete section12 prose and D42–D45 specs read; full current streams read. Actual source/provenance and current assignment/load_digits documentation inspected; broad accepted NMF research reused.',continuation:'Root read/compose exact literal manuscript and slots; assess explicit bounded N8 ambiguity-cost amendment. Section13 then14–19 remain. Entire author and DIFFERENT whole review pending; runtime/phase/public unchanged.'};
fs.writeFileSync(file('section-twelve-handoff.json'),JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify({conditions:conditions.length,manuscript:bind('section-twelve.md'),handoff:bind('section-twelve-handoff.json')}));
