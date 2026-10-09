import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const beforePath = base + '/runtime-reference-closure/predecessor/lesson.jsx';
const afterPath = base + '/lesson.jsx';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const clean = value => Array.isArray(value) ? value.map(clean) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).filter(([key]) => !['start', 'end', 'loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)).map(([key, item]) => [key, clean(item)])) : value;
const parseFile = file => parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }).program;
const before = parseFile(beforePath), after = parseFile(afterPath);
const content = ast => ast.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'PRMLesson').body.body[0].argument;
const elements = ast => content(ast).children.filter(node => node.type !== 'JSXText');
const isHeading = (node, label) => node.type === 'JSXElement' && node.openingElement.name.name === 'H3' && node.children.some(child => child.expression?.value === label);
const slice = ast => {
  const nodes = elements(ast);
  const start = nodes.findIndex(node => isHeading(node, 'Technical references'));
  const end = nodes.findIndex(node => isHeading(node, 'Readiness and the next question'));
  assert.ok(start >= 0 && end > start);
  return { prefix: nodes.slice(0, start + 1), middle: nodes.slice(start + 1, end), suffix: nodes.slice(end) };
};
const a = slice(before), b = slice(after);
assert.deepEqual(clean(a.prefix), clean(b.prefix));
assert.deepEqual(clean(a.suffix), clean(b.suffix));
const literals = nodes => {
  const strings = [];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXExpressionContainer' && node.expression.type === 'StringLiteral') strings.push(node.expression.value);
    if (node.children) node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return strings.join('').replace(/\s+/g, ' ').trim();
};
assert.equal(literals(a.middle), literals(b.middle));
assert.equal(b.middle.length, 1);
assert.equal(b.middle[0].openingElement.name.name, 'ul');
assert.equal(b.middle[0].children.filter(node => node.type === 'JSXElement' && node.openingElement.name.name === 'li').length, 9);
// The one function's source structure changes; every other declaration stays exact.
const declarations = ast => ast.body.filter(node => !(node.type === 'FunctionDeclaration' && node.id.name === 'PRMLesson'));
assert.deepEqual(clean(declarations(before)), clean(declarations(after)));
const report = { passed: true, at: new Date().toISOString(), before: { path: beforePath, sha256: hash(beforePath) }, after: { path: afterPath, sha256: hash(afterPath) }, manuscript: { path: base + '/lesson.md', sha256: hash(base + '/lesson.md') }, unchangedPrefixElements: a.prefix.length, unchangedSuffixElements: a.suffix.length, beforeReferenceElements: a.middle.length, afterReferenceElements: b.middle.length, listItems: 9, exactVisibleTextIgnoringWhitespace: true, allOtherDeclarationsIdentical: true, scope: 'Nine known reference description continuations stay inside their list items. No words, URLs, practice, equations, controls, program calls, figures or module contract changed.' };
fs.writeFileSync(base + '/runtime-reference-closure/conservation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
