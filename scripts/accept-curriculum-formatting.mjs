import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const folder = 'docs/teaching/llm-architecture-training/curriculum-learning-data-mixing-strategies';
const priorIntegration = 'docs/teaching/llm-architecture-training/integration/pretraining-alignment/2026-10-07T08-19-30-117Z';
const equivalent = JSON.parse(fs.readFileSync(`${folder}/runtime-formatting/equivalence.json`));
const changes = new Map(equivalent.changes.map(change => [change.file, change]));
const prior = JSON.parse(fs.readFileSync(`${priorIntegration}/accepted-sources.json`));
for (const [file, expected] of Object.entries(prior.files)) {
  const change = changes.get(file);
  if (change) {
    assert.equal(expected, change.before);
    assert.equal(hash(change.predecessor), expected);
    assert.equal(hash(file), change.after);
  } else assert.equal(hash(file), expected, file);
}
const evidence = ['runtime-formatting/equivalence.json', 'runtime-formatting/independent-equivalence.json', 'runtime-formatting/independent-review.md'];
const acceptance = JSON.parse(fs.readFileSync(`${folder}/runtime-acceptance.json`));
for (const change of changes.values()) acceptance.files[change.file] = change.after;
for (const file of evidence) acceptance.files[`${folder}/${file}`] = hash(`${folder}/${file}`);
acceptance.continuation = {
  at: new Date().toISOString(), reviewer: 'root', accepted: true,
  predecessor: `${folder}/runtime-acceptance.json`,
  predecessorSha256: hash(`${folder}/runtime-acceptance.json`),
  reason: 'Readability-only formatting, independently verified transformed AST equality with 14 adjacent literal React text joins. All computation, rendered text, CSS, manuscript, programs and scientific data conserved. Whole prior native/paint acceptance retained; current production integration follows.',
};
const acceptancePath = `${folder}/runtime-acceptance-formatted.json`;
fs.writeFileSync(acceptancePath, JSON.stringify(acceptance, null, 2) + '\n', { flag: 'wx' });
const integration = `docs/teaching/llm-architecture-training/integration/pretraining-alignment/${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.mkdirSync(integration, { recursive: true });
const publication = JSON.parse(fs.readFileSync(`${priorIntegration}/publication.json`));
publication.rows.find(row => row.id === acceptance.topic).acceptance = acceptancePath;
publication.predecessor = `${priorIntegration}/publication.json`;
publication.note = 'Guarded exact formatting continuation after independent equivalence review; prior publication and build evidence retained.';
const files = { ...prior.files, ...acceptance.files, [acceptancePath]: hash(acceptancePath) };
fs.writeFileSync(`${integration}/accepted-sources.json`, JSON.stringify({ at: new Date().toISOString(), scope: prior.scope, files }, null, 2) + '\n');
fs.writeFileSync(`${integration}/publication.json`, JSON.stringify(publication, null, 2) + '\n');
console.log(integration);
