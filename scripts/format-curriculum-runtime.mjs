import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { transformSync } from 'esbuild';
import { parse } from '@babel/parser';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const directory = 'docs/teaching/llm-architecture-training/curriculum-learning-data-mixing-strategies/runtime-formatting';
const inputs = {
  'src/learn/components/lesson-labs/CurriculumMixingFlow.jsx': '9b7f3815d3e51a7f8e0e686d845f3e9b1d22e3fca7691322acb9496100758d93',
  'src/learn/data/curriculum-mixing-models.js': '2cef963851c018d85d0c369c9c9bcfd013f6f82bc3955d7c0cb721548359c82a',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ignored = new Set(['loc', 'start', 'end', 'extra', 'comments', 'leadingComments', 'innerComments', 'trailingComments']);

function normalize(node) {
  if (Array.isArray(node)) return node.map(normalize);
  if (!node || typeof node !== 'object') return node;
  const result = Object.fromEntries(Object.entries(node)
    .filter(([key]) => !ignored.has(key))
    .map(([key, value]) => [key, normalize(value)]));
  // Prettier splits literal JSX text into adjacent React text children.
  // Merge only those children; computation and ordinary arrays remain exact.
  if (result.type === 'ObjectProperty' && result.key?.name === 'children' &&
      result.value?.type === 'ArrayExpression') {
    const children = [];
    for (const child of result.value.elements) {
      if (child?.type === 'StringLiteral' && children.at(-1)?.type === 'StringLiteral') {
        children.at(-1).value += child.value;
      } else children.push(child);
    }
    result.value.elements = children;
  }
  return result;
}

function normalizedAst(source) {
  const transformed = transformSync(source, { loader: 'jsx', jsx: 'automatic', target: 'esnext' }).code;
  return JSON.stringify(normalize(parse(transformed, { sourceType: 'module' })));
}

fs.mkdirSync(directory, { recursive: true });
const changes = [];
for (const [file, expected] of Object.entries(inputs)) {
  const previous = fs.readFileSync(file, 'utf8');
  assert.equal(hash(previous), expected, `Unexpected predecessor: ${file}`);
  const next = await format(previous, { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 });
  assert.equal(normalizedAst(previous), normalizedAst(next), `Computational or rendered-text change: ${file}`);
  const predecessor = `${directory}/${file.split('/').at(-1)}.before`;
  fs.writeFileSync(predecessor, previous, { flag: 'wx' });
  fs.writeFileSync(file, next);
  changes.push({ file, predecessor, before: expected, after: hash(next), previousLines: previous.split('\n').length, currentLines: next.split('\n').length, equivalentNormalizedAst: true });
}
fs.writeFileSync(`${directory}/equivalence.json`, JSON.stringify({
  at: new Date().toISOString(), formatter: 'Prettier 3.6.2',
  normalization: 'Ignore source-location/comment metadata; concatenate adjacent literal React children after JSX compilation. No changes to other AST nodes.',
  scienceRerun: false, changes,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(changes));
