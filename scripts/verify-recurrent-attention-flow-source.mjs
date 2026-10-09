import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import katex from 'katex';

const folder = 'docs/teaching/deep-learning-beginner/attention-mechanism-bahdanau-luong/';
const topic = 'src/learn/data/topics/attention.jsx';
const files = [topic, 'src/learn/components/lesson-labs/RecurrentAttentionDrawings.jsx',
  'src/learn/components/lesson-labs/RecurrentAttentionFlowLabs.jsx', 'src/learn/components/lesson-labs/RecurrentAttentionLabs.jsx',
  'src/learn/components/lesson-labs/recurrent-attention-flow.css', 'src/learn/components/lesson-labs/recurrent-attention-labs.css',
  'src/learn/data/recurrent-attention-flow-models.js', 'src/learn/data/recurrent-attention-models.js',
  'src/learn/data/recurrent-attention-measurements.json', 'public/learn-code/attention-mechanism-bahdanau-luong/explicit-attentive-inflection.py'];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const body = fs.readFileSync(topic, 'utf8'), original = fs.readFileSync('docs/teaching/deep-learning-beginner/original/attention-before-reading-flow/attention.jsx', 'utf8');
const groups = [], trees = {};
for (const file of files.filter(file => file.endsWith('.jsx'))) trees[file] = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
groups.push('Every current topic/evidence/lab/drawing JSX parses');
assert.equal((body.match(/<H2>/g) || []).length, (original.match(/<H2>/g) || []).length);
assert.equal((body.match(/data-lesson-exercise=/g) || []).length, 8);
assert.equal((body.match(/<summary>Hint<\/summary>/g) || []).length, 8);
assert.equal((body.match(/<summary>Solution<\/summary>/g) || []).length, 8);
assert.equal((body.match(/<details>/g) || []).length, 16);
assert.ok(body.includes('attention-lesson lesson-flow'));
groups.push('All original section owners, eight complete practices/hints/solutions and visible instructional content retained');
let equations = 0;
const snippets = [];
function expression(node) {
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral') { assert.equal(node.expressions.length, 0); return node.quasis.map(part => part.value.cooked).join(''); }
  if (node.type === 'TaggedTemplateExpression' && node.tag.object.name === 'String' && node.tag.property.name === 'raw') {
    assert.equal(node.quasi.expressions.length, 0); return node.quasi.quasis.map(part => part.value.raw).join('');
  }
  assert.fail('Unexpected teaching expression ' + node.type);
}
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXElement' && ['InlineMath', 'MathBlock', 'CodeBlock'].includes(node.openingElement.name.name)) {
    const value = node.children.map(child => child.type === 'JSXText' ? child.value : expression(child.expression)).join('');
    if (node.openingElement.name.name === 'CodeBlock') snippets.push(value);
    else { katex.renderToString(value, { throwOnError: true }); equations++; }
  }
  for (const child of Object.values(node)) if (Array.isArray(child)) child.forEach(walk); else if (child && typeof child === 'object') walk(child);
}
walk(trees[topic]);
groups.push(`${equations} literal equations render without TeX errors; ${snippets.length} inline code excerpts extracted`);
for (const name of ['walked', 'lactated', '62,080', '49,760', '37,408', '1,353', '447', '3,490', '0.745440', '1.003220', '0.390755', '1.254375', '3.210133', '407', '145/168', '250/279']) assert.ok(body.includes(name), name);
for (const name of ['attention-inference.py', 'attention-calculations.py', 'attentive-inflection.py', 'explicit-attentive-inflection.py', 'recurrent-cells.py']) assert.ok(body.includes(name));
assert.ok(!/commitGuess|submitGuess|predictionEntry|after making your own prediction/.test(body));
groups.push('Conserved measured/numerical/deeper claims and exact scratch/library program routes remain learner-visible');
const drawing = fs.readFileSync(files[1], 'utf8'), labs = fs.readFileSync(files[2], 'utf8');
for (const name of ['attention-information-path', 'attention-memory-anatomy', 'attention-query-key-plane', 'attention-shared-denominator',
  'attention-additive-maps', 'attention-general-map', 'attention-training-fork', 'attention-coverage-tally', 'attention-monotonic-scan']) assert.ok(drawing.includes(name), name);
assert.ok(labs.includes('modelRequests.delete(kind)'));
assert.ok(labs.includes('if (current)'));
assert.ok(!/import .*seed-one|import .*calculated-inputs/.test(labs));
groups.push('Actual tensor/vector/map/read/training/advanced geometry and lazy latest-model/retry ownership');
for (const name of ['reading-flow-native.json', 'reading-flow-models.json', 'reading-flow-scientific-dependencies.json']) assert.equal(JSON.parse(fs.readFileSync(folder + name)).passed, true);
const report = { passed: true, checkedAt: new Date().toISOString(), groups, equations,
  sourceHashes: Object.fromEntries(files.map(file => [file, hash(file)])), verifierHash: hash('scripts/verify-recurrent-attention-flow-source.mjs'),
  limits: 'Author source conservation, explicit syntax and TeX; native, browser, independent review and parent integration remain separate.' };
fs.writeFileSync(folder + 'reading-flow-source.json', JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync('scratch/attention-reading-flow/inline-code.json', JSON.stringify(snippets, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, groups: groups.length, equations, files: files.length, snippets: snippets.length }));
