import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const folder = 'docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const check = JSON.parse(fs.readFileSync(`${folder}/content-author-checks.json`, 'utf8'));
assert.equal(check.passed, true);
assert.equal(hash(`${folder}/lesson.md`), check.manuscript_sha256);
const native = JSON.parse(fs.readFileSync(`${folder}/native-program-checks.json`, 'utf8'));
assert.equal(native.passed, true);
const files = [];
for (const name of ['lesson.md', 'design.md', 'design-review.md', 'research.md', 'original-assessment.md', 'content-author-review.md', 'content-author-checks.json', 'native-program-checks.json']) files.push(`${folder}/${name}`);
for (const directory of ['public/learn-code/data-curation-pipelines', `${folder}/study-provenance`]) {
  for (const entry of fs.readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) {
      const file = path.join(entry.parentPath, entry.name).replaceAll('\\', '/');
      assert.ok(!file.includes('__pycache__') && !/\.py[co]$/.test(file));
      files.push(file);
    }
  }
}
for (const name of ['curation_records.py', 'extraction_library.py', 'lexical_dedup.py', 'datatrove_pipeline.py']) files.push(`public/learn-code/data-curation-deduplication/${name}`);
files.push('scripts/verify-curation-programs.py', 'scripts/verify-curation-content.py');
for (const [name, expected] of Object.entries(native.programs)) assert.equal(hash(`public/learn-code/data-curation-pipelines/${name}`), expected);
fs.writeFileSync(`${folder}/content-author-ready.json`, JSON.stringify({
  status: 'complete-author-content-awaiting-different-whole-review', manuscript: `${folder}/lesson.md`,
  figures: 21, programs: 8, solvedTasks: 12, author: 'root',
  scope: 'Current complete manuscript/design/programs/real study; no runtime or phase completion.',
  files: [...new Set(files)].map(file => ({ path: file, sha256: hash(file) })),
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ready: true, files: files.length, manuscript: hash(`${folder}/lesson.md`) }));
