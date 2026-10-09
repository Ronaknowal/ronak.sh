import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const folder = 'docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  passed: false,
  checkedAt: new Date().toISOString(),
  purpose: 'Identify conserved scientific dependencies; no training or native execution is claimed.',
  bindings: [],
};
for (const receiptPath of [
  'docs/teaching/evidence/seq2seq-native.json',
  'docs/teaching/evidence/seq2seq-independent-native.json',
  'docs/teaching/evidence/seq2seq-author.json',
]) {
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  assert.equal(receipt.passed, true);
  for (const [file, expected] of Object.entries(receipt.sourceHashes ?? receipt.sources)) {
    // Historical manuscript/presentation/generator hashes are preserved in their
    // own receipts; only these scientific dependencies support reused calculations.
    if (!file.startsWith('public/learn-code/sequence-to-sequence-encoder-decoder/')
      && !['src/learn/data/seq2seq-models.js', 'src/learn/data/seq2seq-measurements.json'].includes(file)) continue;
    const bytes = fs.readFileSync(file);
    const raw = hash(bytes);
    const normalized = hash(bytes.toString('utf8').replaceAll('\r\n', '\n'));
    assert.ok(raw === expected || normalized === expected, `Scientific delta requires new assessment: ${file}`);
    report.bindings.push({ receiptPath, file, historicalHash: expected, currentRawHash: raw,
      lfNormalizedHash: normalized, applicability: raw === expected ? 'Exact raw identity' : 'Only CRLF-to-LF conversion' });
  }
}
report.passed = true;
report.limits = 'Identity permits reuse of the recorded scientific cases only. New prose, drawings, controls and the new composed scratch implementation require their own checks. No prior pedagogical or browser acceptance is inherited.';
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(`${folder}/reading-flow-scientific-dependencies.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, bindings: report.bindings.length,
  lineEndingOnly: report.bindings.filter(row => row.applicability.startsWith('Only')).length }));
