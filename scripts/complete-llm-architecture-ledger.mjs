import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { llmScope, llmIntegration } from './lib/llm-architecture-scope.mjs';
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const accepted = json(`${llmIntegration}/accepted-sources.json`);
for (const [file, expected] of Object.entries(accepted.files)) assert.equal(hash(file), expected, `Changed reviewed source: ${file}`);
for (const file of ['production-assets.json', 'site-build.json', 'production-browser/report.json']) assert.equal(json(`${llmIntegration}/${file}`).passed, true, `Incomplete integration: ${file}`);
assert.ok(json(`${llmIntegration}/load-boundaries.json`).results.length > 5);
const now = new Date().toISOString();
const mainEvidence = [
  ['browser-tree-closure/report.json', 'tree-geometry.json', 'state-closure/report.json', 'model-evidence-tree-closure.json', 'native-evidence/report.json', 'native-evidence/contract-tied-receipt.json'],
  ['browser-evidence/browser-report.json', 'browser-evidence/review-fix-closure.json', 'native-verification.md'],
  ['browser-evidence-final/report.json', 'token-delta/report.json', 'browser-model-verification.json', 'native-verification.json'],
  ['browser-accepted/report.json', 'review-closure/report.json', 'model-verification.json', 'native/report.json'],
  ['browser-evidence/browser-report.json', 'native-results.json', 'native-verification.md'],
];
const explanations = [
  'Dictionary/model-row contracts, ranked supermerges, ADAT feedback, LiteToken residue ancestry and cleanup, compaction, cache dependencies and fair metric denominators.',
  'Shifted targets, causal access, loss and gradients, masking and packing, full decoder anatomy, measured learning, generation and exact-once evaluation.',
  'Selected reconstruction targets, corruption versus access masks, full encoder anatomy, actual scratch/library training, conditional scores and objective alternatives.',
  'Equality policy, literal shingles, MinHash, LSH retrieval versus verification, cluster policy, Bloom membership, actual record-level audit and distributed/semantic alternatives.',
  'Resource geometry, power laws and fitted surfaces, compute allocation, released measurements and fit diagnostics, repeated data, serving demand and metric sensitivity.',
];
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const registryPath = 'docs/teaching/deep-research-registry.json';
const handoffPath = 'docs/teaching/LESSON-AUTHORING-HANDOFF.md';
const snapshots = Object.fromEntries([ledgerPath, registryPath, handoffPath].map(file => [file, fs.readFileSync(file)]));
const ledger = JSON.parse(snapshots[ledgerPath]);
const registry = JSON.parse(snapshots[registryPath]);
const before = {}, reconciliations = [];
for (const [index, topic] of llmScope.entries()) {
  const entry = ledger.topics[topic.id];
  assert.equal(entry.content.status, 'complete');
  assert.equal(entry.implementation.status, 'in-progress');
  before[topic.id] = structuredClone(entry);
  const permitted = new Set([topic.manuscript, `${topic.folder}/author-review.md`, `${topic.folder}/content-review.md`]);
  const deltas = [];
  for (const [file, expected] of Object.entries(entry.content.files)) {
    const current = hash(file);
    if (current !== expected) {
      assert.ok(permitted.has(file), `Unassessed content delta: ${file}`);
      deltas.push({ file, before: expected, after: current });
      entry.content.files[file] = current;
    }
  }
  const reconciliation = { id: topic.id, deltas, basis: 'Entire content review retained. Root assessed normalized fragment/runtime-import changes, appended actual author evidence, and Scaling proof/requirements/link corrections. No blind refresh of program, dataset or mathematical inputs.' };
  reconciliations.push(reconciliation);
  const evidence = mainEvidence[index].map(file => `${topic.folder}/${file}`);
  for (const file of evidence) assert.ok(fs.existsSync(file), `Missing evidence ${file}`);
  const delivery = `${topic.folder}/delivery.md`;
  const author = fs.existsSync(`${topic.folder}/runtime-author-review.md`) ? `${topic.folder}/runtime-author-review.md` : `${topic.folder}/author-review.md`;
  fs.writeFileSync(delivery, `# Completed lesson delivery\n\n7 October 2026. User-authorized full implementation of **${topic.id}**, one of LLM positions 5–9. Content and implementation are complete after full research, a complete manuscript/program packet, different design/content review, different whole-source/actual-paint runtime acceptance and production integration. User reading acceptance remains separate.\n\n${explanations[index]}\n\n## Review and evidence\n\n- [Accepted design](design.md), [different design review](design-review.md), [different complete-content review](content-review.md).\n- [Author runtime assessment](${author.split('/').at(-1)}), [different whole-runtime review and finding closure](runtime-review.md).\n${mainEvidence[index].map(file => `- [${file}](${file})`).join('\n')}\n- [Guarded publication](../integration/publication.json), [accepted-source snapshot](../integration/accepted-sources.json), [emitted assets and metadata](../integration/production-assets.json), [actual production reader](../integration/production-browser/report.json), [site build](../integration/site-build.json), [lazy loading and recovery](../integration/load-boundaries.json).\n\nThe published source equals the retained complete manuscript. Canonical programs, corpus provenance and actual measured outputs are retained as public teaching assets. Original lessons, predecessor findings and meaningful verification evidence are preserved. Constructed mechanisms and fitted or measured values are identified in the lesson; no unavailable measurements or observed learner outcomes are claimed. Current exact source bindings are in the central delivery ledger. Local publication is complete; no commit, push or deployment was requested. Scope ends after Scaling Laws, before Curriculum Learning & Data Mixing Strategies.\n`);
  const own = Object.fromEntries(Object.entries(accepted.files).filter(([file]) => file.startsWith(`${topic.folder}/`) || file.startsWith(`public/${topic.assets}/`) || [topic.published, topic.component, topic.css, topic.model].includes(file) || (!file.startsWith('public/') && !file.startsWith('docs/') && !llmScope.some(t => [t.published, t.component, t.css, t.model].includes(file)))));
  const reviewedFiles = { ...entry.content.files, ...own };
  for (const file of [...evidence, delivery, author, `${topic.folder}/runtime-review.md`, `${llmIntegration}/production-assets.json`, `${llmIntegration}/production-browser/report.json`, `${llmIntegration}/site-build.json`, `${llmIntegration}/load-boundaries.json`, `${llmIntegration}/lesson-links-review.json`]) reviewedFiles[file] = hash(file);
  entry.record = delivery;
  entry.implementation = { status: 'complete', completedAt: now, reviewedFiles, review: `${topic.folder}/runtime-review.md`, integration: `${llmIntegration}/production-assets.json` };
  entry.nextAction = 'Both phases are complete for this source-bound revision. Await user reading feedback; no further topic rollout is authorized by this completion.';
  registry.topics[topic.id] = { basis: 'deep-dive coverage map', record: `${topic.folder}/design.md`, completedOn: '2026-10-07' };
}
ledger.updatedOn = registry.updatedOn = '2026-10-07';
const handoff = snapshots[handoffPath].toString('utf8');
const old = /\*\*Active LLM continuation, 7 October 2026:\*\*[\s\S]*?(?=\r?\n\r?\n)/;
assert.ok(old.test(handoff), 'Current LLM handoff paragraph moved; review before editing');
const replacement = '**Completed LLM continuation, 7 October 2026:** the five topics immediately after Multimodal Tokenization—Dynamic Tokenization, Causal Language Modeling, Masked Language Modeling, Data Curation & Deduplication, and Scaling Laws (positions 5–9)—now have both phases complete after full research, complete programs, different whole-source/paint acceptance and current production/build/loading verification. The [scope record](llm-architecture-training/README.md) and per-topic delivery records retain corrections, exact sources and measured-evidence limits. Semantic colour, actual mechanism drawings, live changed/null states, 390px layouts and 200% text were reviewed. Earlier four LLM checkpoints and all other active streams are preserved. User reading acceptance remains separate. Scope ends before Curriculum Learning & Data Mixing; no further rollout, commit or deployment is implied.';
for (const [file, bytes] of Object.entries(snapshots)) assert.ok(fs.readFileSync(file).equals(bytes), `Concurrent central edit detected: ${file}`);
fs.writeFileSync(`${llmIntegration}/precompletion-ledger-entries.json`, JSON.stringify(before, null, 2) + '\n');
fs.writeFileSync(`${llmIntegration}/content-reconciliation.json`, JSON.stringify({ at: now, topics: reconciliations }, null, 2) + '\n');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
fs.writeFileSync(handoffPath, handoff.replace(old, replacement));
console.log('Completed only the five authorized LLM ledger/registry entries; concurrent central state was checked before writing.');
