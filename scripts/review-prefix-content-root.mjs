import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const b='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching',p='public/learn-code/prefix-caching';
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f));
const packet=`${b}/content-inputs.json`;
assert.equal(sha(packet),'5e1c19dcf54b03941856ce7fa276dba7df9b599d12c1e035e6b518889428ed95');
const files={[packet]:sha(packet)},checks=[];
for(const[f,h]of Object.entries(read(packet).files)){assert.equal(sha(f),h,f);files[f]=h;checks.push(`guard ${f}`);}
for(const row of read(`${p}/source-manifest.json`).files){assert.equal(sha(`${p}/${row.path}`),row.sha256,row.path);checks.push(`conserved study source ${row.path}`);}
for(const stage of ['finite','tiny','native','allocator']){
 for(const name of ['result.json','events.jsonl']){
  assert.equal(sha(`${p}/saved-results/${stage}/${name}`),sha(`scratch/prefix-caching-research/study/${stage}/${name}`));checks.push(`exact saved ${stage}/${name}`);
 }
 assert.equal(read(`${p}/saved-results/${stage}/result.json`).status,'passed');
}
const text=fs.readFileSync(`${b}/lesson.md`,'utf8');
assert.equal([...text.matchAll(/^## /gm)].length,17);
assert.equal([...text.matchAll(/<!-- D\d\d:/g)].length,29);
assert.equal([...text.matchAll(/<!-- PROGRAM:/g)].length,12);
assert.equal([...text.matchAll(/^### \d+\./gm)].length,16);
checks.push('complete 17-section/29-figure/12-program/16-task placement');
const eq=(name,a,e)=>{assert.ok(Math.abs(a-e)<1e-10,name);checks.push(name);};
const triangular=n=>n*(n+1)/2;
eq('prompt full pairs',triangular(10),55);eq('avoided prefix pairs',triangular(8),36);
eq('suffix pairs',2*8+triangular(2),19);eq('pairs avoided rounded',Math.round(10000*36/55)/100,65.45);
for(const[l,e]of [[1,0],[4,0],[7,4],[8,4],[9,8],[10,8]])eq(`final-query boundary ${l}`,4*Math.floor(Math.max(0,l-1)/4),e);
eq('native all-layer block bytes',2*2*2*4*4*4,512);
eq('native ordinary payload',4*512,2048);eq('native backing including trash',6*512,3072);
eq('Tiny copied prefix bytes',2*2*4*8*4*8,4096);eq('Tiny reserved bytes',2*2*4*20*4*8,10240);
for(const[rows,prefix,branch]of [[8,98304,196608],[32,393216,491520]]){
 eq(`native prefix ${rows}`,2*6*4*rows*32*8,prefix);eq(`native branch ${rows}`,2*6*4*(rows+8)*32*8,branch);
}
eq('native comparison elements',8*50304,402432);
eq('DFS edge work',4+4+2+2+6,18);eq('interleaved work',10+6+6,22);
eq('warm tie threshold',2+10-4,8);eq('warm delayed finish',20+4,24);
eq('practice layer-head row reads',3*2*7,42);
eq('practice surviving pairs',triangular(12)-triangular(6),57);
eq('practice logical bytes',8*2048,16384);eq('practice physical bytes',5*2048,10240);
eq('practice fork physical pages',3+2,5);eq('practice fork logical references',2*(3+1),8);
eq('practice weighted reuse',(0+8+4)/(6+10+14),.4);eq('practice new queries',30-12,18);
eq('practice routing threshold',3+12-5,10);
eq('practice break even tenths',(30+6)/6,6);eq('capstone no reuse pairs',triangular(5),15);
const native=read(`${p}/saved-results/native/result.json`).observations,tiny=read(`${p}/saved-results/tiny/result.json`).observations;
assert.equal(native.calls,10);assert.equal(tiny.calls,8);
assert.equal(native.cases.length,4);
for(const c of native.cases){assert.ok(c.base_unchanged&&c.independent_branch_storage&&c.comparison.tolerance_passed&&c.comparison.top1_matches);assert.equal(c.comparison.mismatched_elements,0);assert.equal(c.comparison.compared_elements,402432);checks.push(`saved native prefix ${c.prefix_length} tail ${c.tail_index}`);}
const report=`${b}/content-review-root.md`;
fs.writeFileSync(report,`# DIFFERENT whole content review\n\nRoot,9 October2026. One bounded reading-route correction requested; no other material finding from this review.\n\nRoot read the entire65,050-byte manuscript in contiguous ranges, including all17 sections and16 complete worked practices. A truncated first tool response omitted part of the opening; that first65-line range was reopened and read in full. Root read all29 effective visual contracts, the complete author assessment, README and saved-result delivery explanation. The accepted entire design/practice reviews and Root's earlier complete eighteen-program/protocol/source reading compose this handoff: exact source guards confirm those scientific programs are unchanged, so no unused training/timing main or repeated model run was performed. Root's own four bounded once-only scientific executions remain the executed evidence, with their retained raw operands and assertions; this review did not replay them. Source-checked optional provider routes remain unexecuted.\n\nThe complete progression correctly separates causal equivalence, effective-input identity, whole-block/final-query eligibility, resident first-miss lookup, query rows versus attention pairs, atomic ownership, physical aliasing, hash lookup versus exact proof, finite pressure, copied native caches and actual native allocator backing. Radix splits preserve active endpoint ancestry, DFS optimality retains its offline/token-granularity assumptions, and waiting, monetary ties and cross-trust observations have separate models. Every advanced concept has a worked mechanism before notation/code; explained sources and all worked tasks are complete. Native errors/top-1/base integrity and allocator5/4/3/2 identifiers agree with the saved observations. Diagrams are actionable specifications; no rendered or learner-comprehension acceptance is implied.\n\nRoot freshly guarded all128 content bindings and the original source manifest, compared the eight delivered result/journal copies with their retained originals, and checked the complete placement map. Independent arithmetic covers attention triangles, final-query boundaries, per-device payload/backing, all Tiny/native byte figures and comparison counts, DFS/waiting examples and changed practice quantities. The paired native result summaries were checked without loading or replaying tensor comparisons. Existing author archive/member checks are composed, not mislabelled as a second archive execution.\n\n## Consolidated finding\n\n**R1 — connect the first-pass route to practice prerequisites.** The opening tells readers to take sections1–9 and12 and then practice. Tasks13,14 and the economic half of15 rely on skipped sections10,11 and13, respectively. The practice introduction offers all sixteen without returning those readers to the missing foundations. Clarify the route in the opening/practice entry: first-pass readers can do1–12 and16 after their route; return to10 before13,11 before14, and13 before the cost part of15 (the expiry part uses12). Equivalent clear wording is fine. Keep all deep teaching visible and ungated. This is the same kind of local continuity obligation as the earlier adjacent-topic corrections, not a request to flatten the lesson.\n\nPreserve the frozen manuscript, correct only this necessary reading guidance, and return a bounded successor to SAME Root closure. No scientific/source/model changes or verification replay is needed. Runtime remains unreleased until that closure; phase bookkeeping and normal integration remain Root-owned.\n`,{flag:'wx'});
const result=`${b}/content-review-root-checks.json`;
fs.writeFileSync(result,JSON.stringify({passed:true,checks},null,2)+'\n',{flag:'wx'});
for(const f of [report,result,'scripts/review-prefix-content-root.mjs'])files[f]=sha(f);
const dest=`${b}/content-review-root-inputs.json`;
fs.writeFileSync(dest,JSON.stringify({decision:'bounded-correction-requested',topic:'prefix-caching-prompt-caching',reviewer:'/root',author:'training_author',findings:['R1'],report,files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({packet:dest,sha256:sha(dest),checks:checks.length,bindings:Object.keys(files).length}));
