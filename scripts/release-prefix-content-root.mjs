import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const b='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const successor=`${b}/content-route-correction/inputs.json`;
assert.equal(sha(successor),'481a2427e5282404a7b34c7766235f60f344d1adcc4d7d90ff0ea68d11f2b3dc');
const files={};
for(const[f,h]of Object.entries(read(successor).files)){assert.equal(sha(f),h,f);files[f]=h;}
const preserved=read(`${b}/content-route-correction/predecessor.json`);
let guards=0;
for(const packet of [`${b}/content-inputs.json`,`${b}/content-review-root-inputs.json`])
 for(const[f,h]of Object.entries(read(packet).files)){const old=preserved.find(row=>row.path===f);assert.equal(sha(old?.preserved??f),h,f);guards++;}
assert.equal(sha(`${b}/lesson.md`),'82ea16117019e1d4068ed127bae25b56d866580c4b5d739cd1980354f03f9790');
const closure=`${b}/content-review-root-closure.md`;
fs.writeFileSync(closure,`# SAME complete-content closure\n\nRoot,9 October2026. R1 is closed; complete content is accepted for private runtime.\n\nRoot read the entire bounded manuscript diff and author's correction explanation after the full different content review. The opening now specifies first-pass practices1–12 and16. The practice entry sends task13 to section10,task14 to11,and task15's economic half to13 while retaining expiry in12. The earlier foundations and every deeper explanation remain visible; the route no longer assumes skipped concepts. The source-bound diff changes only these two reading-guidance locations.\n\nAll138 successor bindings and260 original content/review comparisons were freshly guarded, with the exact old manuscript retained. This composes the preserved whole17-section/29-contract/18-program/16-task assessment and200 complementary conditions. The ordinary program sources,12 explained program placements,35-member archive and four once-run scientific stages remain unchanged. No model, finite study, native allocator or provider call was repeated. Original private-data/native-source/read-scope and tensor-delivery qualifications remain explicit.\n\nTraining author may now implement the entire accepted lesson privately. Actual source/control/paint review, a DIFFERENT whole runtime assessment and Root normal Reader integration remain necessary; this content release does not certify painted quality or observed beginner comprehension.\n`,{flag:'wx'});
for(const f of [successor,closure,'scripts/release-prefix-content-root.mjs'])files[f]=sha(f);
const dest=`${b}/content-release-root.json`;
fs.writeFileSync(dest,JSON.stringify({accepted:true,topicId:'prefix-caching-prompt-caching',reviewer:'/root',differentReview:`${b}/content-review-root.md`,closure,manuscript:`${b}/lesson.md`,visualSpecifications:`${b}/visual-specs.md`,files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:dest,sha256:sha(dest),bindings:Object.keys(files).length,predecessorGuards:guards}));
