import fs from 'node:fs';
import crypto from 'node:crypto';
const b='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const k='docs/teaching/llm-architecture-training/kv-cache-memory-management/programs';
const a='scratch/inference-serving-tools/transformers/generation/continuous_batching/cache_allocators';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const checks=[];
for(let L=1;L<=20;L++)for(let P=0;P<L;P++){
  const direct=Array.from({length:L-P},(_,i)=>P+i+1).reduce((x,y)=>x+y,0);
  const formula=(L-P)*P+(L-P)*(L-P+1)/2;
  if(direct!==formula)throw Error('Attention count');
  checks.push({L,P,pairs:direct,queryRows:L-P});
}
if(checks.find(x=>x.L===10&&x.P===8).pairs!==19)throw Error('Anchor');
const boundary=[7,8,9].map(L=>({L,reused:4*Math.floor((L-1)/4)}));
const result={scope:'Finite design arithmetic only; no model, native allocator, timing or scientific program execution.',attentionCases:checks.length,anchor:{L:10,P:8,totalPairs:55,remainingPairs:19,avoidedPairs:36},boundary,unionPages:4,logicalPages:6,affinityTieMs:8,checks};
fs.writeFileSync(`${b}/design-checks.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const paths=[`${b}/design.md`,`${b}/research.md`,`${b}/original-assessment.md`,`${b}/design-checks.json`,'src/learn/data/topics/prefix-caching.jsx',`${k}/cached_decoder.py`,`${k}/native_cache.py`,`${k}/tiny_causal_lm.py`,`${k}/README.md`,`${k}/alice-provenance.json`,`${k}/alice-train.txt`,`${k}/model-source-report.json`,'public/learn-code/continuous-batching/native_batching.py',`${a}/cache_allocator.py`,`${a}/cache_pool.py`,`${a}/full_attention.py`,'scripts/freeze-prefix-design.mjs'];
const files=paths.map(path=>({path,sha256:hash(path),bytes:fs.statSync(path).size}));
fs.writeFileSync(`${b}/design-inputs.json`,JSON.stringify({topicId:'prefix-caching-prompt-caching',status:'Complete proposed design for DIFFERENT whole review, not manuscript or scientific execution release',author:'root',files,proposedNativeForwardCalls:10,modelTraining:false,remoteRequests:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({bindings:files.length,packetSha256:hash(`${b}/design-inputs.json`),finiteCases:checks.length}));
