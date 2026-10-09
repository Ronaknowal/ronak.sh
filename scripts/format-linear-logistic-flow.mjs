import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import generatorModule from '@babel/generator';

const generate = generatorModule.default || generatorModule;
const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const files = [
  'src/learn/components/lesson-labs/LinearLogisticDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/RegressionInferenceDrawings.jsx',
  'src/learn/data/linear-logistic-flow-models.js',
];
const normalize = value => {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['start', 'end', 'loc', 'extra', 'tokens', 'comments',
        'leadingComments', 'trailingComments', 'innerComments'].includes(key))
      .map(([key, item]) => [key, normalize(item)]));
  }
  return value;
};
const hash = source => crypto.createHash('sha256').update(source).digest('hex');
const staged = [];
const rows = [];
const record = folder + '/reading-flow-formatting.json';
assert.ok(!fs.existsSync(record), 'Retain the existing source-bound formatting receipt.');
for (const path of files) {
  const before = fs.readFileSync(path, 'utf8');
  const tree = parse(before, { sourceType: 'module', plugins: ['jsx'] });
  const after = generate(tree, { compact: false, concise: false, retainLines: false,
    comments: true, jsescOption: { minimal: true } }, before).code + '\n';
  assert.deepEqual(normalize(parse(after, { sourceType: 'module', plugins: ['jsx'] })),
    normalize(tree), path + ': semantic AST changed');
  staged.push([path, before, after]);
  rows.push({ path, beforeSha256: hash(before), afterSha256: hash(after),
    exactSemanticAstEqual: true, beforeLines: before.split('\n').length,
    afterLines: after.split('\n').length });
}
for (const [path, before, after] of staged) {
  const copy = folder + '/original-format/' + path.split('/').at(-1);
  fs.mkdirSync(copy.slice(0, copy.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(copy, before);
  fs.writeFileSync(path, after);
}
fs.writeFileSync(record, JSON.stringify({ at: new Date().toISOString(),
  purpose: 'Conventional formatting only. Every semantic AST field, including all JSXText values, is equal; original current-candidate bytes retained.',
  formatter: '@babel/generator',
  formatterVersion: JSON.parse(fs.readFileSync('node_modules/@babel/generator/package.json')).version,
  files: rows }, null, 2) + '\n');
console.log(JSON.stringify({ formatted: rows.length, semanticAstEqual: true }));
