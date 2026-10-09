import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { trackDefinitions } from '../src/learn/data/track-definitions.js';
import { slugify } from '../src/learn/data/topic-id.js';
import { getDeliveryState } from './lib/lesson-delivery.mjs';

const directory = 'docs/teaching/llm-architecture-training';
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const handoffPath = 'docs/teaching/LESSON-AUTHORING-HANDOFF.md';
const ledgerBytes = fs.readFileSync(ledgerPath);
const handoffBytes = fs.readFileSync(handoffPath);
const ledger = JSON.parse(ledgerBytes);
const manifest = JSON.parse(fs.readFileSync('src/learn/data/lesson-manifest.json', 'utf8'));
const track = trackDefinitions.find(t => t.id === 'large-language-models');
const ordered = track.sections.flatMap(s => s.topics);
assert.equal(slugify(ordered[8].title), 'scaling-laws-kaplan-chinchilla-beyond');
const owners = ['root','causal_author','causal_author','masked_author','root','root','causal_author','masked_author','masked_author','masked_author','causal_author','masked_author','multimodal_reviewer','multimodal_reviewer','multimodal_reviewer','multimodal_reviewer','multimodal_reviewer','causal_author','root','root'];
const scope = ordered.slice(9,29).map((topic,index) => {
  const id = slugify(topic.title);
  assert.ok(!ledger.topics[id], `Existing topic checkpoint needs assessment: ${id}`);
  const source = manifest[id] ? `src/learn/data/${manifest[id].replace(/^\.\//,'')}` : null;
  return {position:index+10,id,title:topic.title,owner:owners[index],source,originalSha256:source ? createHash('sha256').update(fs.readFileSync(source)).digest('hex') : null,before:getDeliveryState(process.cwd(),ledger.topics[id])};
});
assert.equal(scope.at(-1).id,'typed-decision-models-calibrated-neural-decision-systems');
const scopePath = `${directory}/pretraining-alignment-scope.json`;
assert.ok(!fs.existsSync(scopePath),'Scope already frozen; resume it.');
for (const topic of scope) {
  const record = `${directory}/${topic.id}/design.md`;
  ledger.topics[topic.id] = {revision:1,deliveryMode:'full',record,content:{status:'in-progress'},implementation:{status:'not-started'},nextAction:`${topic.owner}: assess the entire existing topic and notes, complete canonical research and independently reviewed design, then full content before runtime. Root owns publication and phase promotion.`};
}
ledger.updatedOn = '2026-10-07';
const paragraph = '**Active LLM pre-training and alignment continuation, 7 October 2026:** the user authorized the next twenty topics end to end after Scaling Laws: positions 10–29, Curriculum Learning & Data Mixing through Typed Decision Models & Calibrated Neural Decision Systems. The [frozen scope](llm-architecture-training/pretraining-alignment-scope.json) records exact syllabus membership, original sources and four disjoint author assignments. Each topic proceeds through complete research/design, different review, complete content, runtime/native/actual-paint review, corrections and production integration. Root alone updates central phases and publishes; previous LLM1–9 and other educational streams remain preserved. Current content is in progress and implementation has not started; completion is earned per topic. Scope ends before KV-Cache & Memory Management.\n\n';
assert.ok(fs.readFileSync(ledgerPath).equals(ledgerBytes),'Concurrent ledger change');
assert.ok(fs.readFileSync(handoffPath).equals(handoffBytes),'Concurrent handoff change');
fs.writeFileSync(scopePath,JSON.stringify({authorizedOn:'2026-10-07',mode:'full',module:track.id,topics:scope},null,2)+'\n');
fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
fs.writeFileSync(handoffPath,handoffBytes.toString('utf8').replace('## Current state\r\n\r\n',`## Current state\r\n\r\n${paragraph}`).replace(/^(## Current state\n\n)(?!\*\*Active LLM pre-training)/m,`$1${paragraph}`));
console.log(`Frozen ${scope.length} authorized topics, positions 10–29; existing entries preserved.`);
