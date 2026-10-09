// Independent reconstruction of saved observations; never launches a model.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root = 'scratch/inference-engines-research/study';
const out = 'docs/teaching/llm-architecture-training/inference-engines-serving/content-review-root';
const files = {};
function bytes(p) { const b=fs.readFileSync(p); files[p]=createHash('sha256').update(b).digest('hex'); return b; }
const read = p => JSON.parse(bytes(p));
const report = read(`${root}/native/result.json`);
assert.equal(report.status, 'passed');
assert.equal(report.generation_attempts, 4);
assert.equal(report.owned_process_terminated, true);
assert.notEqual(report.server_final_exit_code, null);
const requests = [];
for (const [index,row] of report.requests.entries()) {
  const base = `${root}/native/${row.id}`;
  const raw = bytes(`${base}/raw.bin`);
  const journal = bytes(`${base}/receive.jsonl`).toString('utf8').trim().split('\n').map(JSON.parse);
  const result = read(`${base}/result.json`);
  assert.deepEqual(result, row.result);
  assert.equal(files[`${base}/result.json`], row.result_sha256);
  assert.equal(row.client_exit_code, 0);
  assert.deepEqual(Buffer.concat(journal.map(e=>Buffer.from(e.bytes_b64,'base64'))),raw);
  assert.equal(raw.length,result.raw_bytes);
  assert.ok(journal.every((e,i)=>Buffer.from(e.bytes_b64,'base64').length===1 && (!i || e.receive_seconds>=journal[i-1].receive_seconds)));
  // These actual streams use LF and one data field per event. This independent
  // reader deliberately does not claim to implement the full SSE specification.
  const text = new TextDecoder('utf8',{fatal:true}).decode(raw);
  assert.ok(text.endsWith('\n\n'));
  let offset=0;
  const reconstructed = text.slice(0,-2).split('\n\n').map(block=>{
    assert.ok(block.startsWith('data: '));
    assert.equal(block.split('\n').length,1);
    offset+=Buffer.byteLength(block+'\n\n');
    return {receive_seconds:journal[offset-1].receive_seconds,data:JSON.parse(block.slice(6))};
  });
  assert.deepEqual(reconstructed,result.events);
  assert.equal(reconstructed.length,17);
  const outputs = reconstructed.filter(e=>!e.data.stop);
  assert.equal(outputs.length,16);
  assert.ok(outputs.every(e=>e.data.tokens.length===1));
  assert.deepEqual(outputs.flatMap(e=>e.data.tokens),result.nonterminal_token_ids);
  assert.equal(reconstructed.map(e=>e.data.content).join(''),result.assembled_content);
  assert.equal(result.terminal.stop_type,'limit');
  assert.deepEqual(result.terminal.tokens,[]);
  assert.equal(result.terminal.timings.cache_n,0);
  assert.deepEqual(row.payload.prompt,row.tokenization.tokens.map(t=>t.id));
  assert.equal(row.payload.prompt.length,[5,10,10,4][index]);
  assert.equal(result.terminal.tokens_cached,row.payload.prompt.length+16-1);
  assert.equal(result.first_content_seconds,reconstructed.find(e=>e.data.content).receive_seconds);
  assert.equal(result.terminal_seconds,reconstructed.at(-1).receive_seconds);
  assert.ok(result.connection_end_seconds>=result.terminal_seconds);
  requests.push({id:row.id,promptIds:row.payload.prompt.length,outputs:16,events:17,
    rawBytes:raw.length,firstContentSeconds:result.first_content_seconds,
    lastContentSeconds:outputs.at(-1).receive_seconds,terminalSeconds:result.terminal_seconds,
    connectionEndSeconds:result.connection_end_seconds,content:result.assembled_content});
}
const original=read(`${root}/conversion/conversion.json`);
const corrected=read(`${root}/conversion-hf457/conversion.json`);
assert.equal(original.status,'failed');
assert.equal(corrected.status,'passed');
assert.equal(corrected.exit_code,0);
assert.equal(corrected.gguf.bytes,29929408);
assert.equal(corrected.gguf.sha256,'8977255964083cdf425026d13e1af3595c97e94e93ae123baa4412853bf682bf');
assert.equal(files[`${root}/conversion-hf457/conversion.json`],report.conversion_sha256);
const finite=read(`${root}/finite/result.json`);
assert.equal(finite.status,'passed');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(`${out}/observation-reconstruction.json`,JSON.stringify({passed:true,reviewer:'/root',
  scope:'Read-only reconstruction of the four retained streams and byte journals; no model or science replay',
  requests,serverFinalExitCode:report.server_final_exit_code,
  processQualification:'Owned process exit verified; Windows termination code1 is not a clean application shutdown claim',
  precisionQualification:'Endpoint guesses all F32; actual tensor storage requires the separately retained GGUF inventory',files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,requests:requests.length,events:requests.length*17}));
