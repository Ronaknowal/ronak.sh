import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import generatorModule from '@babel/generator';

const generate = generatorModule.default || generatorModule;
const owners = ['StateSpaceDrawings.jsx', 'StateSpaceStructureDrawings.jsx', 'StateSpaceArchitectureDrawings.jsx', 'StateSpaceBlockDrawings.jsx', 'StateSpaceLearningDrawings.jsx', 'StateSpaceExtensionDrawings.jsx', 'StateSpaceLinePlot.jsx', 'StateSpaceFlowLabs.jsx', 'StateSpaceTrajectoryFlow.jsx', 'StateSpaceLearningEvidence.jsx', 'StateSpaceLabs.jsx'];
const files = [...owners.map(name => `src/learn/components/lesson-labs/${name}`), 'src/learn/data/topics/state-space-models-s4-mamba-mamba-2.jsx'];
const normalize = value => {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['start', 'end', 'loc', 'extra', 'tokens', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key))
    .map(([key, item]) => [key, normalize(item)]));
  return value;
};
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const folder = 'docs/teaching/deep-learning-beginner/state-space-models-s4-mamba-mamba-2';
const receipt = `${folder}/reading-flow-formatting.json`;
assert(!fs.existsSync(receipt), 'Do not overwrite an existing formatting receipt');
const rows = files.map(file => {
  const before = fs.readFileSync(file, 'utf8');
  const ast = parse(before, { sourceType: 'module', plugins: ['jsx'] });
  const after = generate(ast, { compact: false, concise: false, retainLines: false, comments: true, jsescOption: { minimal: true } }, before).code + '\n';
  assert.deepEqual(normalize(parse(after, { sourceType: 'module', plugins: ['jsx'] })), normalize(ast), `${file}: semantic AST must remain exact, including every JSXText value`);
  return { file, before, after, beforeSha256: hash(before), afterSha256: hash(after), exactSemanticAstEqual: true };
});
for (const { file, after } of rows) fs.writeFileSync(file, after);
fs.writeFileSync(receipt, JSON.stringify({ purpose: 'Conventional formatting only. All semantic AST fields, including complete JSX text values, remain exactly equal. The scientific programmes/data and preserved pre-revision snapshot are unchanged.', formatter: '@babel/generator', version: JSON.parse(fs.readFileSync('node_modules/@babel/generator/package.json')).version, sources: rows.map(({ before, after, ...identity }) => identity) }, null, 2) + '\n');
console.log(JSON.stringify({ files: rows.length, exactSemanticAstEqual: true }));
