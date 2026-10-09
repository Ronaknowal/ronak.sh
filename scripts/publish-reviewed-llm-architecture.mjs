import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { llmScope, llmIntegration } from './lib/llm-architecture-scope.mjs';

// Root's completed different whole-source/paint reviews, not author self-certification.
const identities = [
  ['fb9e5a7043d01022e0de99dffa14fb4318356de2357450965e3a402377199b89', 'cdbfc46db3f6f3c583ec082a885ce0dd0ebb5bbed3034dbf506a78790530ebd9', '8730f5cc6aa1580c66e94ca9578d4b75e9eb8039465c0262c64a6dbdd855fabd', '9deec4038d934bcf493446f63781ea36488fcf101f7f217d89dd44c05e9fefb2'],
  ['a33bbce7d75bddda60c387ac5971a1b9b3fe4ab5813d92390fc46fb301cfdd85', 'de343d2e4c494b51931ec51e8cbe45d146339b14dbb6c24ca01a0a39b6d8c1bf', '2f57dab0b4d4b37b45ba755f1fadb5a952e8ff18c098d25dc79f6c8da15d9644', 'b00c4baa473bd3a68d4aac5cc05904a0693bf9cdaa4e03d8a637a7557e97ef39'],
  ['e32bcd033bce761abe0b78654cea90d61c3e882fb5edae74885af22890279b3a', '070757274cfdf97452fc0d64cf3f3cf60e85c860dc7a9896ac390fe1f3145ee3', '8088fb3e65f8da3fd5a6fb456f9f8e66ee9ca3e53abd238617a42d1ba1a9a705', 'ed5f5befc9c343aa2b09db6fca3f714d8e35823914c665ec37b4141700f99e70'],
  ['1d36a1a22ffe5d54cc3863774e752b977883bd9c85d3d0939e772fe64ae02580', '9b3ef1c1b5fb2b7c2be79f71ef3b26cddadfba25d7a348c31392101bcafff839', '9f0ede870f86840fa761d8d16b4ac3f6e2ecd882999b324dcff2267d3d1885da', '99fa652886d139a5db979f75b3b4301164174fe8a20c85bf1944f15254ab9e35'],
  ['5e88972345734abfa581759a698c24e8fb5e6e03fb2602cec662251469ce4475', '93d69f081f59043e3924aa77c5a48596d290aea22a1e248a43ba04cef8b699d9', '8db723e26a94595c0a6fb40cbb125f023a34321749105e6a6a6763fc2da44fba', '13f884af584d21beef4e3bf2d770ee1af966b7861730ac302b116b5029036c21'],
];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = {}, rows = [];
for (const [index, topic] of llmScope.entries()) {
  for (const [i, file] of [topic.manuscript, topic.component, topic.css, topic.model].entries()) {
    assert.equal(hash(file), identities[index][i], `Unreviewed source delta: ${file}`);
    files[file] = identities[index][i];
  }
  assert.equal(hash(topic.published), hash(topic.original), `Protected publication changed: ${topic.published}`);
  const review = `${topic.folder}/runtime-review.md`;
  assert.ok(fs.readFileSync(review, 'utf8').toLowerCase().includes('accepted'));
  rows.push({ id: topic.id, published: topic.published, previousSha256: hash(topic.published), acceptedSha256: hash(topic.manuscript), review, reviewSha256: hash(review) });
  for (const entry of fs.readdirSync(`public/${topic.assets}`, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name).replaceAll('\\', '/');
    assert.ok(!/(__pycache__|\.pyc$|\.pyo$)/.test(file), `Deployed cache: ${file}`);
    files[file] = hash(file);
  }
}
for (const file of ['src/learn/components/lesson-labs/LessonFlow.jsx', 'src/learn/components/lesson-labs/lesson-flow.css', 'src/learn/components/content/RemoteCodeBlock.jsx', 'src/learn/components/content/Code.jsx', 'src/learn/components/content/Headings.jsx', 'src/learn/components/content/Prose.jsx', 'src/learn/components/content/Math.jsx']) files[file] = hash(file);
fs.mkdirSync(llmIntegration, { recursive: true });
assert.ok(!fs.existsSync(`${llmIntegration}/publication.json`), 'Publication receipt already exists; do not overwrite it');
// Every protected source and reviewed successor is checked before the first mutation.
for (const topic of llmScope) {
  fs.copyFileSync(topic.manuscript, topic.published);
  files[topic.published] = hash(topic.published);
}
fs.writeFileSync(`${llmIntegration}/accepted-sources.json`, JSON.stringify({ at: new Date().toISOString(), scope: llmScope.map(t => t.id), files }, null, 2) + '\n');
fs.writeFileSync(`${llmIntegration}/publication.json`, JSON.stringify({ at: new Date().toISOString(), rows, sharedFilesChanged: false, note: 'Guarded local publication only. Production verification and central implementation completion follow separately.' }, null, 2) + '\n');
console.log('Published five independently reviewed manuscripts; protected originals retained.');
