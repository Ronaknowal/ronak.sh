import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const topicId = 'rwkv-linear-attention-models';
const current = `docs/teaching/deep-learning-beginner/${topicId}`;
const rollback = 'docs/teaching/deep-learning-beginner/original/rwkv-before-reading-flow';
const historical = `docs/teaching/deep-learning-completion/${topicId}`;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const presentation = [
  `src/learn/data/topics/${topicId}.jsx`,
  'src/learn/components/lesson-labs/RwkvMemoryLabs.jsx',
  'src/learn/components/lesson-labs/RwkvMechanismFigures.jsx',
  'src/learn/components/lesson-labs/rwkv-memory.css',
];
const scientific = [
  'src/learn/data/rwkv-memory-models.js',
  'src/learn/data/rwkv-trajectory-example.json',
  `public/learn-assets/${topicId}/trajectory-models.json`,
  ...fs.readdirSync(`public/learn-code/${topicId}`).sort().map(file => `public/learn-code/${topicId}/${file}`),
];
const packets = ['design.md', 'lesson.md', 'visual-specifications.md'].map(file => `docs/teaching/drafts/${topicId}/${file}`);
const files = [...presentation, ...scientific, ...packets];
fs.mkdirSync(current, { recursive: true });
fs.mkdirSync(rollback, { recursive: true });
assert.ok(!fs.existsSync(`${rollback}/sources.json`), 'Never overwrite an existing pre-edit snapshot');
const sourceHashes = {};
const normalizedHashes = {};
for (const file of files) {
  const bytes = fs.readFileSync(file);
  sourceHashes[file] = hash(bytes);
  if (!file.endsWith('.npz')) normalizedHashes[file] = hash(Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')));
  const destination = path.join(rollback, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes, { flag: 'wx' });
}
const old = JSON.parse(fs.readFileSync(`${historical}/independent-checks.json`, 'utf8'));
const comparisons = scientific.map(file => ({
  file,
  currentRaw: sourceHashes[file],
  currentLf: normalizedHashes[file] ?? null,
  historicalRaw: old.sourceHashes[file] ?? null,
  exactRaw: old.sourceHashes[file] === sourceHashes[file],
  matchesAfterLfConversion: old.sourceHashes[file] === normalizedHashes[file],
}));
const snapshot = { topicId, createdAt: new Date().toISOString(), presentation, scientific, packets, sourceHashes, normalizedHashes };
fs.writeFileSync(`${rollback}/sources.json`, JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
const report = {
  topicId,
  assessedAt: snapshot.createdAt,
  snapshot: `${rollback}/sources.json`,
  snapshotHash: hash(fs.readFileSync(`${rollback}/sources.json`)),
  sourceHashes,
  scientificComparisons: comparisons,
  explicitCurrentSourceFindings: [
    'RwkvProgram evaluates undeclared url in a duplicate download link.',
    'Existing lab control walls exceed three controls per learning question.',
    'Many explanations and computed walkthroughs precede their corresponding drawing.',
    'Mechanism figures mix real geometry with sentence boxes and omit locally taught operands or complete state paths.',
    'Latest Goose v2 Appendix D.3 removes the c=2 assumption under its theoretical construction; retained packet only describes v1 limitation.',
  ],
  limits: [
    'This is source assessment and immutable preservation, not new scientific execution or browser acceptance.',
    'Historical receipt files remain unchanged; raw and LF identities are reported separately.',
    'No topic runtime, ledger, publication, generated registry or shared component was edited.',
  ],
};
fs.writeFileSync(`${current}/reading-flow-baseline.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ passed: true, snapshotFiles: files.length, scientificFiles: scientific.length, historicalExact: comparisons.filter(row => row.exactRaw).length, historicalLf: comparisons.filter(row => !row.exactRaw && row.matchesAfterLfConversion).length, unexplainedScientificChanges: comparisons.filter(row => !row.exactRaw && !row.matchesAfterLfConversion).map(row => row.file) }));
