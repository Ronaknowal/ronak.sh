import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { llmScope, llmIntegration, llmBuild } from './lib/llm-pretraining-integration.mjs';

const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const frozen = read('docs/teaching/llm-architecture-training/inference-serving-scope.json');
const accepted = read(`${llmIntegration}/accepted-sources.json`);
for (const [file, expected] of Object.entries(accepted.files)) assert.equal(hash(file), expected, file);
const evidence = ['production-assets.json', 'site-build.json', 'production-browser/report.json', 'lesson-links-review.json'];
if (fs.existsSync(`${llmIntegration}/all-ten-reader.json`)) evidence.push('all-ten-reader.json');
for (const file of evidence) assert.equal(read(`${llmIntegration}/${file}`).passed, true, file);
const loading = read(`${llmIntegration}/load-boundaries.json`);
assert.ok(loading.results.length > 5);
evidence.push('load-boundaries.json');
const assets = read(`${llmIntegration}/production-assets.json`);
assert.equal(hash(`${llmBuild}/.vite/manifest.json`), assets.manifestSha256);
assert.equal(process.env.LLM_ROOT_OPENINGS_READ, 'yes', 'Root must actually inspect each production opening before completion');

const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const registryPath = 'docs/teaching/deep-research-registry.json';
const handoffPath = 'docs/teaching/LESSON-AUTHORING-HANDOFF.md';
const snapshots = Object.fromEntries([ledgerPath, registryPath, handoffPath].map(file => [file, fs.readFileSync(file)]));
const ledger = JSON.parse(snapshots[ledgerPath]);
const registry = JSON.parse(snapshots[registryPath]);
const at = new Date().toISOString();
const before = {};
const pending = [];
for (const topic of llmScope) {
  const scope = frozen.topics.find(t => t.id === topic.id);
  assert.ok(scope && scope.position >= 30 && scope.position <= 39);
  const entry = ledger.topics[topic.id];
  assert.equal(entry.content.status, 'complete');
  assert.equal(entry.implementation.status, 'in-progress');
  assert.equal(hash(topic.published), topic.acceptedSha256);
  const runtime = read(topic.acceptance);
  assert.equal(runtime.accepted, true);
  assert.ok(runtime.review && fs.existsSync(runtime.review));
  const relocations = [];
  function check(file, expected) {
    if (file !== topic.published || hash(file) === expected) {
      assert.equal(hash(file), expected, file);
      return;
    }
    assert.equal(expected, scope.originalSha256, 'Only the protected original can relocate');
    assert.equal(hash(scope.original), expected);
    relocations.push({ file, retained: scope.original, sha256: expected });
  }
  for (const [file, expected] of Object.entries(entry.content.files)) check(file, expected);
  for (const [file, expected] of Object.entries(runtime.files)) check(file, expected);
  before[topic.id] = structuredClone(entry);
  const folder = path.dirname(topic.acceptance).replaceAll('\\', '/');
  const delivery = `${folder}/delivery.md`;
  assert.ok(!fs.existsSync(delivery));
  const relative = file => path.relative(folder, file).replaceAll('\\', '/');
  const authorReview = runtime.authorReview ?? [`${folder}/runtime-author-review.md`, `${folder}/runtime-private/author-review.md`].find(file => runtime.files[file] && fs.existsSync(file));
  assert.ok(authorReview && runtime.files[authorReview] && fs.existsSync(authorReview), 'The author review must be present in the accepted packet');
  const record = `${folder}/publication-binding-relocation.json`;
  if (relocations.length) {
    assert.ok(!fs.existsSync(record));
    const unique = [...new Map(relocations.map(row => [row.file, row])).values()];
    pending.push([record, JSON.stringify({ at, topic: topic.id, relocations: unique, note: 'Guarded publication conserves the original bytes in the previously frozen scope archive. Historical receipts remain unchanged.' }, null, 2) + '\n']);
    for (const row of unique) { delete entry.content.files[row.file]; entry.content.files[row.retained] = row.sha256; }
  }
  const body = `# Completed lesson delivery\n\n${at.slice(0, 10)}. **${topic.title}** has both phases complete in the authorized ten-topic inference and serving continuation (positions30–39). User reading feedback remains separate from technical acceptance.\n\nThe complete design, manuscript, programs and practice received different review before runtime. [Author assessment](${relative(authorReview)}), [different runtime review and correction closure](${relative(runtime.review)}) and [root acceptance](${relative(topic.acceptance)}) retain exact source identities and qualifications. Whole-lesson visual acceptance comes from those actual-paint reviews, not the bounded integration checks below.\n\n[Production assets](${relative(`${llmIntegration}/production-assets.json`)}), [normal reader](${relative(`${llmIntegration}/production-browser/report.json`)}), [build boundaries](${relative(`${llmIntegration}/site-build.json`)}), [lesson links](${relative(`${llmIntegration}/lesson-links-review.json`)}) and [loading and recovery](${relative(`${llmIntegration}/load-boundaries.json`)}) passed against the isolated production build. Root personally read this integration's opening captures. The normal reader checked complete-program Copy, byte-exact HTTP assets and page bounds at390px and768px with200% text. Loading failure retains its explicit reload-required qualification.\n\nEarlier scientific failures, measurement limits and native-download limitations remain as recorded; no scientific work was replayed to refresh presentation evidence. No unavailable GPU performance or observed learner comprehension is implied. No commit, push or deployment was requested.\n`;
  pending.push([delivery, body]);
  const reviewedFiles = { ...entry.content.files, ...runtime.files, ...accepted.files, [topic.published]: hash(topic.published), [topic.acceptance]: hash(topic.acceptance) };
  for (const file of evidence) reviewedFiles[`${llmIntegration}/${file}`] = hash(`${llmIntegration}/${file}`);
  reviewedFiles[`${llmIntegration}/production-browser/${topic.id}-opening.png`] = hash(`${llmIntegration}/production-browser/${topic.id}-opening.png`);
  reviewedFiles[delivery] = createHash('sha256').update(body).digest('hex');
  if (relocations.length) {
    const bytes = pending.find(([file]) => file === record)[1];
    entry.content.files[record] = reviewedFiles[record] = createHash('sha256').update(bytes).digest('hex');
  }
  entry.record = delivery;
  entry.implementation = { status: 'complete', completedAt: at, reviewedFiles, review: runtime.review, integration: `${llmIntegration}/production-assets.json` };
  entry.nextAction = 'Both phases complete for this reviewed revision. Continue the remaining authorized LLM positions30–39; preserve this topic unless feedback or a concrete finding requires correction.';
  registry.topics[topic.id] = { basis: 'deep-dive coverage map', record: `${folder}/design.md`, completedOn: at.slice(0, 10) };
}
const complete = frozen.topics.filter(t => ledger.topics[t.id].implementation.status === 'complete');
const contentOnly = frozen.topics.filter(t => ledger.topics[t.id].content.status === 'complete' && ledger.topics[t.id].implementation.status !== 'complete');
const allComplete = complete.length === frozen.topics.length;
if (allComplete) for (const topic of frozen.topics) ledger.topics[topic.id].nextAction = 'Both phases complete for the authorized ten-topic increment. Preserve this reviewed revision; user feedback or a concrete finding may justify a scoped correction. No next-topic rollout is authorized.';
const remainingText = allComplete
  ? 'The authorized increment is complete; there is no pending authoring or review within positions30–39.'
  : `${contentOnly.length} more have complete reviewed content with runtime/different review in progress: ${contentOnly.map(t => t.title).join('; ')}. Remaining topics continue through research/design and complete content before private implementation.`;
const handoff = snapshots[handoffPath].toString('utf8');
const pattern = /\*\*Active LLM inference and serving continuation, 8 October 2026:\*\*[\s\S]*?(?=\r?\n\r?\n)/;
assert.ok(pattern.test(handoff));
const replacement = `**Active LLM inference and serving continuation, 8 October 2026:** the user authorized ten topics end to end after Typed Decision Models: positions30–39, KV-Cache & Memory Management through Inference Engines & Serving. The [frozen scope](llm-architecture-training/inference-serving-scope.json) retains membership and original identities. ${complete.length}/10 have both phases complete: ${complete.map(t => t.title).join('; ')}. ${remainingText} [Latest production integration](${llmIntegration.replace('docs/teaching/', '')}/production-assets.json) binds actual build, normal Reader, links and loading/recovery checks. All source, scientific and native-observation qualifications remain explicit. Root alone owns central phases/publication; previous LLM1–29 and concurrent Mathematics/ML/DL work remain preserved. Scope ends before Inference System Architecture; no commit, push or deployment is requested.`;
ledger.updatedOn = registry.updatedOn = at.slice(0, 10);
for (const [file, bytes] of Object.entries(snapshots)) assert.ok(fs.readFileSync(file).equals(bytes), `Concurrent central edit: ${file}`);
fs.writeFileSync(`${llmIntegration}/precompletion-ledger-entries.json`, JSON.stringify(before, null, 2) + '\n', { flag: 'wx' });
for (const [file, body] of pending) fs.writeFileSync(file, body, { flag: 'wx' });
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
fs.writeFileSync(handoffPath, handoff.replace(pattern, replacement));
console.log(JSON.stringify({ complete: complete.length, contentAwaitingRuntime: contentOnly.length, total: frozen.topics.length }));
