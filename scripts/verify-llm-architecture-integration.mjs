import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { llmScope, llmIntegration, llmBuild } from './lib/llm-architecture-scope.mjs';
import { allTopicsOrdered } from '../src/learn/data/generated/navigation.js';

const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const accepted = JSON.parse(fs.readFileSync(`${llmIntegration}/accepted-sources.json`, 'utf8'));
for (const [file, expected] of Object.entries(accepted.files)) assert.equal(hash(file), expected, `Reviewed source changed: ${file}`);
const manifest = JSON.parse(fs.readFileSync(`${llmBuild}/.vite/manifest.json`, 'utf8'));
const lessons = JSON.parse(fs.readFileSync('src/learn/data/lesson-manifest.json', 'utf8'));
const results = [];
for (const topic of llmScope) {
  assert.equal(hash(topic.published), hash(topic.manuscript), `${topic.id}: publication differs from reviewed manuscript`);
  assert.equal(lessons[topic.id], `./topics/${path.basename(topic.published)}`);
  assert.ok(manifest[topic.published]?.isDynamicEntry, `${topic.id}: missing lazy entry`);
  const metadata = allTopicsOrdered.find(row => row.id === topic.id);
  const source = fs.readFileSync(topic.published, 'utf8');
  assert.equal(metadata.readTime, source.match(/readTime:\s*['"]([^'"]+)['"]/)[1]);
  const assets = {};
  for (const entry of fs.readdirSync(`public/${topic.assets}`, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = path.join(entry.parentPath, entry.name);
    assert.ok(!/(__pycache__|\.pyc$|\.pyo$)/.test(full), `Deployed cache: ${full}`);
    const relative = path.relative('public', full).replaceAll('\\', '/');
    assert.equal(hash(`${llmBuild}/${relative}`), hash(full), `Emitted public bytes changed: ${relative}`);
    assets[relative] = hash(full);
  }
  results.push({ id: topic.id, title: metadata.title, readTime: metadata.readTime, entry: manifest[topic.published].file, manuscriptSha256: hash(topic.manuscript), assets });
}
const report = { at: new Date().toISOString(), passed: true, build: llmBuild, acceptedSourceSha256: hash(`${llmIntegration}/accepted-sources.json`), manifestSha256: hash(`${llmBuild}/.vite/manifest.json`), topics: results };
fs.writeFileSync(`${llmIntegration}/production-assets.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, topics: results.length, assets: results.reduce((n, t) => n + Object.keys(t.assets).length, 0) }));
