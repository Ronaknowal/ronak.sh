import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/data-curation-models.js';
const checks=[];
const check=(condition,label)=>{assert.ok(condition,label);checks.push(label);};
check(m.ORDERS.length===24 && new Set(m.ORDERS.map(String)).size===24,'24 unique permutations');
check(m.ORDERS.filter(p=>m.minHashTrace(p).match).length===12,'Exact first-member proof tally');
check(m.overlap(m.shingles('the cat sat down').set,m.shingles('the dog sat down').set).jaccard===.2,'Changed text Jaccard');
check(m.overlap(new Set(),new Set()).jaccard===null,'Empty Jaccard undefined');
for(const width of [1,2,3,4]) {
 const a=m.shingles('the cat sat down',width); check(a.windows.length===5-width,`Window count width${width}`);
}
for(const rows of [2,4,6]) {
 check(Math.abs(m.candidateProbability(m.halfCrossing(12/rows,rows),12/rows,rows)-.5)<1e-12,`Half crossing rows${rows}`);
 check(m.bandMatches(rows).some(b=>b.match)===(rows!==6),`Literal candidate rows${rows}`);
}
check(Math.abs(m.signatureSE(.5,128)-.04419417382415922)<1e-14,'Signature SE prose value');
check(m.retention(.6,'component').kept.join()==='0','Chain component');
check(m.retention(.6,'direct').kept.join()==='0,2','Direct representative counterexample');
check(m.retention(.9,'component').kept.length===3,'No passing edges');
check(m.retention(.2,'component').edges.every(e=>e.pass),'Complete clique at low threshold');
const native=JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/native/bloom_filter.json','utf8'));
for(const key of ['oak','elm','ash']) assert.deepEqual(m.BLOOM_ADDRESSES[key],native.tiny_inserted[key]);
assert.deepEqual(m.BLOOM_ADDRESSES['query-49'],native.tiny_false_positive.indices);
checks.push('Bloom drawn address fixtures match executed Python');
let trace=m.bloomTrace(['oak','elm','ash'],'query-49');check(trace.positive&&!trace.actuallyPresent,'Actual false positive');
check(!m.bloomTrace(['oak','elm','ash'],'query-0').positive,'Absent query has a zero bit');
check(m.bloomTrace(['oak','elm','ash'],'elm',true).falseNegatives.includes('elm'),'Unsafe deletion loses another key');
check(!m.bloomTrace([],'oak').positive,'Empty filter');
const budget=m.bloomBudget(1000,.01);check(budget.bits===native.bits&&budget.hashes===native.hashes&&budget.bytes===native.bytes,'Budget matches independent executed Python');
check(Math.abs(budget.rate-native.formula_rate)<1e-14,'False-positive formula agrees');
check(m.bloomBudget(1000,.01,0).rate===0,'Empty population estimate');
check(m.bloomBudget(1000,.01,2000).rate>budget.rate,'Saturation increases false-positive rate');
const semantic=JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/native/semantic_candidates.json','utf8'));
const vectors=m.semanticTrace();check(vectors.kept.map(i=>'ABCD'[i]).join()===semantic.kept.join(),'Semantic retained policy matches executed Python');
for(let i=0;i<4;i++)for(let j=0;j<4;j++)assert.ok(Math.abs(vectors.cosine[i][j]-semantic.numpy_cosines[Math.floor(i/2)][i%2][j])<1e-14);
checks.push('All16 cosine cells agree with native matrix multiplication');
check(m.semanticTrace(40,1).kept.length===4,'High-threshold null removal');
const files=['src/learn/data/data-curation-models.js','src/learn/components/lesson-labs/DataCurationFlow.jsx','src/learn/components/lesson-labs/data-curation-flow.css'];
const report={checkedAt:new Date().toISOString(),checks,files:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
fs.writeFileSync('docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/model-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(`Passed ${checks.length} independent curation model groups`);
