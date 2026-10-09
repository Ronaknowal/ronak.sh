import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const owner = path.dirname(fileURLToPath(import.meta.url));
const sourceOwner = path.resolve(owner, '../..');
const root = path.resolve(sourceOwner, '../../../../../..');
const hash = raw => crypto.createHash('sha256').update(raw).digest('hex');
const bind = filename => {
  const raw = fs.readFileSync(filename);
  return { path: path.relative(root, filename).replaceAll('\\', '/'), bytes: raw.length, sha256: hash(raw) };
};
const replaceOnce = (source, from, to) => {
  assert.equal(source.split(from).length - 1, 1, `Unique source clause: ${from}`);
  return source.replace(from, to);
};
const target = path.join(owner, 'SavedDataFigures.jsx');
assert(!fs.existsSync(target), 'Never overwrite a prepared successor');
const previous = fs.readFileSync(path.join(sourceOwner, 'SavedDataFigures.jsx'), 'utf8');
const importPairs = ['saved-data.js', 'Drawing.jsx', 'nmf-model.js'].map(name => [`'./${name}'`, `'../../${name}'`]);
const arrowPairs = [
  ['M460 65V120H230V155H310', 'M460 65V120H350V126'],
  ['M460 65V245H310', 'M460 65V205H350V216'],
];
let current = previous;
for (const [from, to] of [...importPairs, ...arrowPairs]) current = replaceOnce(current, from, to);
let inverse = current;
for (const [from, to] of [...importPairs, ...arrowPairs].reverse()) inverse = replaceOnce(inverse, to, from);
assert.equal(inverse, previous);
fs.writeFileSync(target, current);

const receipt = {
  schema: 'nmf-d46-root-readability-source/v1',
  at: new Date().toISOString(),
  author: '/root',
  predecessor: bind(path.join(sourceOwner, 'SavedDataFigures.jsx')),
  successor: bind(target),
  exactInverseVerified: true,
  sourcePairs: [...importPairs, ...arrowPairs],
  finding: 'Actual desktop/phone native reading showed opposed input arrowheads on the reserved transform. Fixed760px sizing also prevented root-text enlargement of its13-unit labels.',
  changedMeaning: 'Both held-data arrays still enter their transforms from the left. The single stored H now enters each operation separately from above, so no opposite arrowheads share an endpoint. No data-to-fit or refit path is added.',
  presentation: 'The later local stylesheet expresses the760-unit minimum as47.5rem: unchanged760px at16px root,1520px at32px root, with local horizontal scrolling. The preview-only text-size selector allows an actual enlarged-text test without mutating a frozen entry or a browser DOM.',
  scientificScope: 'All models, saved arrays, payloads and operation bodies remain byte-conserved except the declared import paths and two SVG path strings. No old numerical main/SSR/campaign is run.',
  nextAction: 'SAME independent bounded source review, one scoped changed-source build/HTTP binding, then Root actual desktop/390px/768px-root32 paint and keyboard verification. No phase promotion.'
};
fs.writeFileSync(path.join(owner, 'source-preparation.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({successor:receipt.successor, exactInverseVerified:true}));
