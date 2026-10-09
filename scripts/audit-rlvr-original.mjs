import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const topic = path.join(root, 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards');
const original = path.join(topic, 'original');
fs.mkdirSync(original, { recursive: true });
const published = path.join(root, 'src/learn/data/topics/rlvr.jsx');
const protectedPath = path.join(original, 'rlvr.jsx');
if (fs.existsSync(protectedPath)) {
  if (!fs.readFileSync(protectedPath).equals(fs.readFileSync(published))) {
    throw new Error('Preserved original differs; do not overwrite');
  }
} else {
  fs.copyFileSync(published, protectedPath);
}
const source = fs.readFileSync(protectedPath, 'utf8');
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex');
const blocks = [...source.matchAll(/<CodeBlock language="python">\s*\{`([\s\S]*?)`\}\s*<\/CodeBlock>/g)].map((match, i) => {
  if (match[1].includes('${')) throw new Error('Unexpected interpolation');
  return {
    index: i + 1,
    originalLine: source.slice(0, match.index).split('\n').length,
    displayed: Function('return `' + match[1] + '`')(),
    rawSha256: hash(match[1]),
  };
});
if (blocks.length !== 6) throw new Error(`Expected six programs, got ${blocks.length}`);
const work = path.join(root, 'scratch/rlvr/original-audit');
fs.mkdirSync(work, { recursive: true });
for (const block of blocks) {
  fs.writeFileSync(path.join(work, `displayed-${block.index}.py`), block.displayed + '\n');
}
const target = path.join(work, 'first-five-displayed-joined.py');
fs.writeFileSync(target, blocks.slice(0, 5).map((block) => block.displayed).join('\n\n') + '\n');
const reportPath = path.join(original, 'program-audit.json');
if (fs.existsSync(reportPath)) throw new Error('Retain original audit; use a named continuation');
const result = spawnSync(path.join(root, 'scratch/lesson-tools/Scripts/python.exe'), ['-B', '-X', 'utf8', target], {
  cwd: work,
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  encoding: 'utf8',
  timeout: 60000,
});
const record = {
  source: path.relative(root, protectedPath).replaceAll('\\', '/'),
  sourceSha256: hash(fs.readFileSync(protectedPath)),
  sourceLines: source.split('\n').length,
  scriptSha256: hash(fs.readFileSync(import.meta.filename)),
  scope: 'Protected original first five finite, local standard-library programs executed exactly as displayed; production placeholder not executed. This diagnoses historical claims and is not a new scientific fit.',
  blocks: blocks.map(({ displayed, ...metadata }) => ({ ...metadata, displayedSha256: hash(displayed) })),
  execution: {
    path: path.relative(root, target).replaceAll('\\', '/'),
    sha256: hash(fs.readFileSync(target)),
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message,
  },
  productionScope: 'Sixth program has undefined math_dataset, gated large model, unpinned API and vLLM; source inspected only, no model download or training.',
};
fs.writeFileSync(reportPath, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ path: path.relative(root, reportPath), sha256: hash(fs.readFileSync(reportPath)), ...record.execution }, null, 2));
