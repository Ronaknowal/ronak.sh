import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const owner = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(owner, '../../../../../..');
const relative = value => path.relative(root, value).replaceAll('\\', '/');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const binding = filename => {
  const bytes = fs.readFileSync(filename);
  return { path: relative(filename), bytes: bytes.length, sha256: digest(bytes) };
};
const read = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const verify = row => {
  const current = binding(path.resolve(root, row.path));
  assert.equal(current.sha256, row.sha256, row.path);
  if (row.bytes !== undefined) assert.equal(current.bytes, row.bytes, row.path);
  return current;
};
const normalize = text => text.replaceAll('\r\n', '\n');
const replaceOnce = (text, from, to, id) => {
  assert(from.length > 0, `Empty predecessor ${id}`);
  assert.equal(text.split(from).length - 1, 1, `Unique predecessor ${id}`);
  return text.replace(from, to);
};

const receiptPath = path.join(owner, 'root-written-role-composition.json');
assert(!fs.existsSync(receiptPath), 'Preserve a prior frozen composition');
const freezePath = path.join(owner, 'author-ready-source.json');
const freeze = read(freezePath);
assert.equal(binding(freezePath).sha256, '3cd5415658c3e6f2087119ba7d1191fe94cccd19e6e20f22e48fa0f22bd307c0');
const closurePath = path.join(owner, 'independent-source-review/source-closure.md');
assert.equal(binding(closurePath).sha256, 'eaf0690863beba5b66b6596a896136c85aa08c541c873b655c290957ff571e1c');
const amendmentPath = path.join(owner, 'matched-reading-amendments.json');
assert.equal(binding(amendmentPath).sha256, '67357f4f36d8ac5102d7c5686c644eea9d1395905fe87e19979d83f9dd5407a2');
const amendments = read(amendmentPath);
assert.equal(amendments.manuscript.length, 9);
assert.equal(amendments.specifications.length, 6);
assert.equal(amendments.newSpecifications.length, 1);
assert.equal(amendments.newSpecifications[0].id, 'D41b');

const ledgerPath = path.join(root, 'docs/teaching/lesson-delivery-progress.json');
const ledger = read(ledgerPath);
const id = 'feature-scaling-encoding-imputation';
const before = structuredClone(ledger.topics[id]);
assert.equal(before.revision, 5);
assert.equal(before.content.status, 'complete');
assert.equal(before.implementation.status, 'in-progress');
const foreign = Object.fromEntries(Object.entries(ledger.topics).filter(([key]) => key !== id));
const accepted = Object.entries(before.content.files).map(([filename, sha256]) => verify({ path: filename, sha256 }));
const currentSource = freeze.sourceBindings.map(verify);
verify(freeze.acceptedManuscript);
verify(freeze.acceptedContent);

const writtenPath = path.join(root, before.content.manuscript);
const specificationPath = path.join(root, before.content.visualSpecifications);
const originalWritten = normalize(fs.readFileSync(writtenPath, 'utf8'));
const originalSpecifications = normalize(fs.readFileSync(specificationPath, 'utf8'));
let written = originalWritten;
for (const pair of amendments.manuscript) written = replaceOnce(written, pair.old, pair.new, pair.id);
let restored = written;
for (const pair of [...amendments.manuscript].reverse()) {
  // Deleting the duplicate index is reversed at the original ending boundary,
  // already source-bound by the independent exact forward/inverse review.
  if (pair.new === '') continue;
  restored = replaceOnce(restored, pair.new, pair.old, `inverse-${pair.id}`);
}
const removedIndex = amendments.manuscript.find(pair => pair.id === 'F3-table');
assert.equal(restored, originalWritten.replace(removedIndex.old, ''));
let specifications = originalSpecifications;
for (const pair of amendments.specifications) specifications = replaceOnce(specifications, pair.old, pair.new, pair.id);
let inverseSpecifications = specifications;
for (const pair of [...amendments.specifications].reverse()) inverseSpecifications = replaceOnce(inverseSpecifications, pair.new, pair.old, `inverse-${pair.id}`);
assert.equal(inverseSpecifications, originalSpecifications);

const selected = ledger.topics[id];
const acceptedDependencies = [binding(amendmentPath), ...currentSource];
for (const row of acceptedDependencies) {
  const previous = selected.content.files[row.path];
  assert(previous === undefined || previous === row.sha256, `Never silently replace accepted binding ${row.path}`);
  selected.content.files[row.path] = row.sha256;
}
selected.content.amendmentRecord = relative(receiptPath);
selected.nextAction = 'Build the source-closed consolidated private Reader from 3cd54156, inspect affected operations/controls at narrow and enlarged widths, then integrate the accepted written overlays and exact payloads into the normal Reader. D41b is the sole relocated sensitivity panel; source closure does not complete implementation.';
assert.deepEqual(selected.implementation, before.implementation);
assert.equal(selected.content.completedAt, before.content.completedAt);
assert.equal(selected.revision, before.revision);
assert.deepEqual(Object.fromEntries(Object.entries(ledger.topics).filter(([key]) => key !== id)), foreign);

const receipt = {
  schema: 'feature20-root-written-role-composition/v1',
  at: new Date().toISOString(),
  reviewer: '/root',
  topicId: id,
  status: 'Matched written/specification amendments accepted; private changed-source build released; implementation remains in progress',
  reading: 'Root read the complete author readback, SAME independent closure, all nine prose pairs, all six full specification pairs and the new D41b contract. Truncated D41/L13 output was recovered separately.',
  inputs: [binding(freezePath), binding(closurePath), binding(amendmentPath), ...accepted, ...currentSource],
  writtenRoles: {
    manuscript: before.content.manuscript,
    specifications: before.content.visualSpecifications,
    physicalOriginalsPreserved: true,
    overlay: relative(amendmentPath),
    normalizedEffectiveManuscriptSha256: digest(written),
    normalizedSixPairSpecificationsSha256: digest(specifications),
    operativeSplit: 'D41 shows only supplied pooling estimates/SE segments and variance components before the formal pooling rule. The former sensitivity panel occurs once as D41b after the complete normal baseline, fixed draws and assumed delta introduction, directly before L14b. This explicit successor overrides retained predecessor lines mentioning a D41 second panel and D41 sensitivity. D41b is an existing mechanism relocated, not a second new scientific mechanism.',
    filePresentation: 'One shared common index. All42 contextual roles remain; answer assets remain in practice. Complete instructional code stays visible with shared controls.'
  },
  preserved: { selectedBefore: before, foreignRows: Object.keys(foreign).length, phaseStatusesAndDatesUnchanged: true },
  acceptedDependencyCount: acceptedDependencies.length,
  resultingContentBindings: Object.keys(selected.content.files).length,
  nextAction: selected.nextAction,
  limits: ['No build, HTTP or native event is asserted by this composition.', 'Original numerical/scientific evidence is reused only for unchanged bodies and assumptions.', 'Source closure is not normal integration or observed beginner mastery.']
};
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ receipt: binding(receiptPath), foreignRowsConserved: Object.keys(foreign).length, contentBindings: receipt.resultingContentBindings }));
