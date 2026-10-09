import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const bytesHash=v=>crypto.createHash('sha256').update(v).digest('hex');
const specs=[
 {id:'speculative-decoding',packet:'da63aa54b1428c05bb0fad8f4e51a3e0e0a865aa8893227694c4e5657c970f9a',review:'independent-content-multimodal/review.md',reviewHash:'d2d098771f92f4ca562f13d5a8af771557e9972a57826f8ce50dc0ab3f7d074c',closure:'independent-content-multimodal/route-closure.md',closureHash:'1c98a7c899cbf9daa967962a5fee97c260a84d88242d9e1877409405eca2c3bf',specs:'visual-contracts.md',before:'a209f48785d1808724d0be865ab80b40df89895fbffb3b0525898a1e9c110132',reading:'Root read the entire different whole-content report and SAME route closure; complete manuscript,36 contracts,12 programs and18 practices are personally read by the different multimodal reviewer. Root composes that explicit specialist review, not a second invented reading. Original707 and225 closure source/finite conditions remain conserved.'},
 {id:'inference-cost-economics-compute-scaling',packet:'b0296c26d1f1caa00086108f10844bc74466ff48cf10094565561b9612bdabef',review:'independent-content-root/review.md',reviewHash:'95162abaf1811d2c6293414737b9f57a96148129e324ae59145601c3a4ab4eb2',closure:'independent-content-root/route-closure.md',specs:'specs.md',before:'bd978a64a3eaff731490af446a489dac817e6d6c6fa8c83e696a8e7699eea14f',reading:'Root personally read entire18-section manuscript,31contracts,8full programs,16practice tasks,README/index and author review, plus corrected practice13 in context. Independent257 no-science checks and bounded same-reviewer route closure compose; no numerical evidence rerun.'}
];
for(const s of specs){
 const b=`docs/teaching/llm-architecture-training/${s.id}`, packetPath=`${b}/content-route-correction/inputs.json`;
 assert.equal(hash(packetPath),s.packet);assert.equal(hash(`${b}/${s.review}`),s.reviewHash);
 const packet=JSON.parse(fs.readFileSync(packetPath));
 const files=Object.fromEntries(packet.files.map(f=>{assert.equal(hash(f.path),f.sha256,f.path);return[f.path,f.sha256];}));
 let before=fs.readFileSync(`${b}/lesson.md`,'utf8');
 for(const [oldText,newText]of [...packet.edits].reverse()){assert.equal(before.split(newText).length-1,1);before=before.replace(newText,oldText);}
 assert.equal(bytesHash(before),s.before,'Exact inverse restores entire original reviewed manuscript');
 if(s.id.startsWith('inference-cost')){
  const text='# SAME content-route closure\n\n9 October 2026. R1 is closed. Root read the complete corrected practice13 prompt, new local route, hint and solution beside the original first-pass route. Enumeration correctly returns to section12; SciPy arrays/status explicitly return to deeper section13. Both exact fragment targets match actual headings. No task or solution is hidden.\n\nAll107 successor bindings passed; reversing exactly the single declared paragraph insertion restores the entire original manuscript bd978a64a3eaff731490af446a489dac817e6d6c6fa8c83e696a8e7699eea14f. The full prior Root content review and257 independent checks compose unchanged. Programs,31contracts,archive and all seven original scientific stages remain exact. No inference, solver main, fit or scientific replay occurred. No material content finding remains; private implementation may begin. Actual runtime/paint and normal integration remain pending.\n';
  fs.writeFileSync(`${b}/${s.closure}`,text,{flag:'wx'});
 }else assert.equal(hash(`${b}/${s.closure}`),s.closureHash);
 for(const name of ['content-inputs.json','content-route-correction/inputs.json',s.review,s.closure])files[`${b}/${name}`]=hash(`${b}/${name}`);
 const r=s.id.startsWith('speculative')?'independent-content-multimodal':'independent-content-root';
 for(const name of fs.readdirSync(`${b}/${r}`)){const p=`${b}/${r}/${name}`;if(fs.statSync(p).isFile())files[p]=hash(p);}
 const release=`${b}/content-release-root.json`;
 fs.writeFileSync(release,JSON.stringify({accepted:true,topicId:s.id,reviewer:'/root',differentReview:`${b}/${s.review}`,manuscript:`${b}/lesson.md`,visualSpecifications:`${b}/${s.specs}`,files,reading:s.reading,scope:'Complete content accepted; private runtime implementation released. No browser/publication acceptance. Preserve every original outcome and scientific limit.'},null,2)+'\n',{flag:'wx'});
 execFileSync(process.execPath,['scripts/checkpoint-llm-inference-content.mjs',s.id,release,hash(release)],{stdio:'inherit'});
 console.log(JSON.stringify({id:s.id,releaseSha256:hash(release)}));
}
