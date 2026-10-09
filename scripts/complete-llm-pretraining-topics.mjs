import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { llmScope, llmIntegration } from './lib/llm-pretraining-integration.mjs';

const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const accepted = read(`${llmIntegration}/accepted-sources.json`);
for (const [file, expected] of Object.entries(accepted.files)) assert.equal(hash(file), expected, file);
const integrationEvidence = ['production-assets.json', 'site-build.json', 'production-browser/report.json', 'lesson-links-review.json'];
for (const file of integrationEvidence) assert.equal(read(`${llmIntegration}/${file}`).passed, true, file);
assert.ok(read(`${llmIntegration}/load-boundaries.json`).results.length > 5);
integrationEvidence.push('load-boundaries.json');

const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const registryPath = 'docs/teaching/deep-research-registry.json';
const handoffPath = 'docs/teaching/LESSON-AUTHORING-HANDOFF.md';
const snapshots = Object.fromEntries([ledgerPath, registryPath, handoffPath].map(file => [file, fs.readFileSync(file)]));
const ledger = JSON.parse(snapshots[ledgerPath]);
const registry = JSON.parse(snapshots[registryPath]);
const before = {};
const at = new Date().toISOString();
const frozenScope = read('docs/teaching/llm-architecture-training/pretraining-alignment-scope.json');
// A content packet can bind the protected pre-rewrite source. After guarded
// publication, conserve those bytes at the already-bound original archive.
// All other bindings must still match their literal current paths.
function validatePublishedBinding(topic, files, file, expected) {
  if (file !== topic.published || hash(file) === expected) {
    assert.equal(hash(file), expected, file);
    return null;
  }
  const original = frozenScope.topics.find(row => row.id === topic.id);
  assert.equal(expected, original.originalSha256, 'Only the frozen original may relocate');
  assert.equal(hash(file), topic.acceptedSha256, 'Published replacement must be accepted');
  const prefix = `${path.dirname(topic.acceptance).replaceAll('\\', '/')}/original/`;
  const retained = Object.entries(files).find(([p, h]) => p.startsWith(prefix) && h === expected);
  assert.ok(retained, 'Missing separately bound original archive');
  assert.equal(hash(retained[0]), expected);
  return retained[0];
}

for (const topic of llmScope) {
  const entry = ledger.topics[topic.id];
  assert.equal(entry.content.status, 'complete');
  assert.equal(entry.implementation.status, 'in-progress');
  assert.equal(hash(topic.published), topic.acceptedSha256);
  const relocations = [];
  for (const [file, expected] of Object.entries(entry.content.files)) {
    const retained = validatePublishedBinding(topic, entry.content.files, file, expected);
    if (retained) relocations.push({file, retained, sha256: expected});
  }
  const runtime = read(topic.acceptance);
  assert.equal(runtime.accepted, true);
  for (const [file, expected] of Object.entries(runtime.files)) validatePublishedBinding(topic, runtime.files, file, expected);
  before[topic.id] = structuredClone(entry);
  if (relocations.length) {
    const record = `${path.dirname(topic.acceptance).replaceAll('\\', '/')}/publication-binding-relocation.json`;
    fs.writeFileSync(record, JSON.stringify({at, topic:topic.id, relocations, note:'Original bytes conserved at an already-bound archive. Historical acceptance packets are unchanged; published replacement was independently accepted and guarded before copying.'}, null, 2)+'\n', {flag:'wx'});
    for (const row of relocations) delete entry.content.files[row.file];
    entry.content.files[record] = hash(record);
  }
  const folder = path.dirname(topic.acceptance).replaceAll('\\', '/');
  const delivery = `${folder}/delivery.md`;
  const relativeIntegration = path.relative(folder, llmIntegration).replaceAll('\\', '/');
  const authorReview = ['runtime-author-review.md', 'author-runtime-review.md', 'author-runtime-evidence.md'].find(name => fs.existsSync(`${folder}/${name}`));
  assert.ok(fs.existsSync(`${folder}/${authorReview}`), 'Missing author runtime review');
  fs.writeFileSync(delivery, `# Completed lesson delivery\n\n${at.slice(0, 10)}. **${topic.title}** has complete content and implementation within the authorized twenty-topic LLM continuation (positions10–29). The scope record tracks completion of the full increment. User reading feedback remains separate from technical acceptance.\n\nFull research and a complete design/manuscript/program packet received different design and content review. [Author runtime assessment](${authorReview}) and [different whole-runtime and actual-paint acceptance](runtime-review.md) retain exact findings, corrections, changed/null states, native execution and evidence limits. The local published source equals the accepted manuscript.\n\n[Root runtime acceptance](${path.basename(topic.acceptance)}) binds the active runtime and review. [Production assets](${relativeIntegration}/production-assets.json), [normal reader](${relativeIntegration}/production-browser/report.json), [site boundaries](${relativeIntegration}/site-build.json), [lesson links](${relativeIntegration}/lesson-links-review.json) and [loading/recovery](${relativeIntegration}/load-boundaries.json) pass against the isolated production build. Root personally inspected the production opening captures for this integration. Desktop,390px and768px with200% text retain normal reader function; earlier entire figure/changed-state reviews remain the source of whole-lesson visual acceptance.\n\nPrograms, measured outcomes, originals and meaningful predecessor receipts are retained. No scientific run was repeated for presentation fixes. Evidence qualifications in the author and different reviews remain applicable; no unavailable GPU measurement or observed beginner comprehension is implied. No commit, push or deployment was requested.\n`, { flag: 'wx' });
  const reviewedFiles = { ...entry.content.files, ...runtime.files, [topic.published]: hash(topic.published), [topic.acceptance]: hash(topic.acceptance), [delivery]: hash(delivery) };
  // Retain the complete topic-local evidence packet. Historical files keep their
  // explicit qualifications; binding their bytes does not promote their claims.
  for (const item of fs.readdirSync(folder, { recursive: true, withFileTypes: true })) {
    if (!item.isFile()) continue;
    const file = path.join(item.parentPath, item.name).replaceAll('\\', '/');
    if (/\.(json|md|png)$/.test(file)) reviewedFiles[file] = hash(file);
  }
  for (const file of integrationEvidence) reviewedFiles[`${llmIntegration}/${file}`] = hash(`${llmIntegration}/${file}`);
  entry.record = delivery;
  entry.implementation = { status: 'complete', completedAt: at, reviewedFiles, review: `${folder}/runtime-review.md`, integration: `${llmIntegration}/production-assets.json` };
  entry.nextAction = 'Both phases complete for this reviewed revision. Continue the remaining authorized LLM positions10–29; preserve this topic unless feedback or a concrete finding requires a correction.';
  registry.topics[topic.id] = { basis: 'deep-dive coverage map', record: `${folder}/design.md`, completedOn: at.slice(0, 10) };
}

const scope = read('docs/teaching/llm-architecture-training/pretraining-alignment-scope.json');
const complete = scope.topics.filter(t => ledger.topics[t.id].implementation.status === 'complete');
const contentOnly = scope.topics.filter(t => ledger.topics[t.id].content.status === 'complete' && ledger.topics[t.id].implementation.status !== 'complete');
const handoff = snapshots[handoffPath].toString('utf8');
const pattern = /\*\*Active LLM pre-training and alignment continuation, 7 October 2026:\*\*[\s\S]*?(?=\r?\n\r?\n)/;
assert.ok(pattern.test(handoff));
const replacement = `**Active LLM pre-training and alignment continuation, 7 October 2026:** the user authorized twenty topics end to end after Scaling Laws: positions10–29, Curriculum Learning & Data Mixing through Typed Decision Models & Calibrated Neural Decision Systems. The [frozen scope](llm-architecture-training/pretraining-alignment-scope.json) owns membership and four disjoint author assignments. ${complete.length}/20 now have both phases complete: ${complete.map(t => t.title).join('; ')}. ${contentOnly.length} more have complete reviewed content with runtime/different review in progress: ${contentOnly.map(t => t.title).join('; ')}. Remaining lessons continue through research/design and complete content before runtime. [Latest production integration](${llmIntegration.replace('docs/teaching/', '')}/production-assets.json) retains build,normal-reader,links and loading/recovery evidence. Root alone updates central phases and publishes. Previous LLM1–9 and other streams remain preserved. Scope ends before KV-Cache; no commit,push or deployment was requested.`;
ledger.updatedOn = registry.updatedOn = at.slice(0, 10);
for (const [file, bytes] of Object.entries(snapshots)) assert.ok(fs.readFileSync(file).equals(bytes), `Concurrent central edit: ${file}`);
fs.writeFileSync(`${llmIntegration}/precompletion-ledger-entries.json`, JSON.stringify(before, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
fs.writeFileSync(handoffPath, handoff.replace(pattern, replacement));
console.log(JSON.stringify({ complete: complete.length, contentAwaitingRuntime: contentOnly.length, total: scope.topics.length }));
