import fs from 'node:fs';
import crypto from 'node:crypto';
const b='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packets=['design-inputs.json','design-practice-correction-inputs.json','independent-design-alignment/acceptance.json'];
const files=[];
for(const n of packets){const p=`${b}/${n}`;const v=JSON.parse(fs.readFileSync(p));for(const f of v.files){if(hash(f.path)!==f.sha256)throw Error(`Changed ${f.path}`);}files.push({path:p,sha256:hash(p)});}
const release={topicId:'prefix-caching-prompt-caching',accepted:true,author:'root',scope:'Complete proposed design accepted for manuscript and full program preparation only. No scientific execution or runtime authorization.',reviewer:'/root/alignment_author',review:'Whole original design plus SAME additive R1 practice closure personally read by Root; original69 and closure63 finite/source conditions conserved.',files,scientificExecution:false,runtimeImplementation:false,obligations:['Complete current programs and exact prospective call protocol require DIFFERENT whole review and Root release before execution.','Preserve actual failed/terminal observations; no rerun for receipts.','Current optional remote contracts must be source checked; remote execution is absent.']};
fs.writeFileSync(`${b}/design-accepted-root.json`,JSON.stringify(release,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sha256:hash(`${b}/design-accepted-root.json`),packets:files.length}));
