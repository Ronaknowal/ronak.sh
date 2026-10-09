import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const b='docs/teaching/llm-architecture-training/inference-engines-serving',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const successor=`${b}/design-proposal-r2.json`,review=`${b}/design-review-root-inputs.json`;
assert.equal(sha(successor),'ac2e00ee01388716c3bcc9b35da8aefa61cd55d58b26720ad5fd835e3dd70964');
assert.equal(sha(review),'c6ae8610705f4f9ad8b81bb1cbaa43373a1db6a5fc71e6e2356c9c4c0c5b1b26');
const changed=new Set([`${b}/design.md`,`${b}/native-protocol.md`]),files={};
for(const [f,h]of Object.entries(read(review).files)){
 const effective=changed.has(f)?`${b}/design-correction-r2/original/${path.basename(f)}`:f;
 assert.equal(sha(effective),h,effective);files[effective]=h;
}
for(const [f,h]of Object.entries(read(successor).files)){assert.equal(sha(f),h,f);files[f]=h;}
const closure=`${b}/design-review-root-closure.md`;
fs.writeFileSync(closure,`# SAME design closure and release\n\nRoot, 9 October2026. Accepted for complete content/program preparation.\n\nRoot read every change in design.md and native-protocol.md against the preserved revision1 after the entire different design review. R1 now binds exact positions32/35/36/37 and stable IDs. R2 packs all seven anchor rows with offsets0/3/7, position IDs0/1/2/0/1/2/3, last prompt rows2/6, and independent causal blocks; incomplete prompt chunks cannot emit first output. R3 requires strictly positive scratch caps in the concept map, validation, accounting and changed Q02; zero is rejected before P+G−1 is used.\n\nA source-backed extension discovered after the consolidated review was sent is also closed in this same successor: Root read the pinned native server n_predict definition, which permits zero-output prompt evaluation and slight excess beyond a requested cap to finish a multibyte character. The revised protocol distinguishes these native semantics from scratch, preserves any actual excess and all IDs under the same four-request, context512 and60s wall limits. It does not authorize extra requests or truncation of evidence. No acquisition, conversion or generation occurred.\n\nAll49 prior review bindings are preserved, with the two changed texts retained at their exact original hashes, and all successor bindings pass. The22 earlier independent arithmetic checks remain applicable; no repeated numerical or browser campaign is necessary for these text contracts. This composes the original whole research/design reading and its explicit upstream-reading qualifications.\n\nRoot now owns complete39 manuscript and program preparation while serving_author implements37 privately. Before any engine/source acquisition, conversion or native inference, a DIFFERENT reviewer must assess the complete programs and exact execution protocol. Complete content then requires whole DIFFERENT review before runtime. Design acceptance alone is neither content completion nor execution release.\n`,{flag:'wx'});
for(const f of [successor,review,closure,'scripts/release-inference-engine-design-root.mjs'])files[f]=sha(f);
const dest=`${b}/design-release-root.json`;
fs.writeFileSync(dest,JSON.stringify({accepted:true,phase:'design',topic:'inference-engines-serving',author:'serving_author',reviewer:'/root',successor,review:closure,nextOwner:'/root',nextAction:'Prepare complete manuscript/programs; different complete program/protocol review precedes acquisition/conversion/inference.',files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:dest,sha256:sha(dest),bindings:Object.keys(files).length}));
