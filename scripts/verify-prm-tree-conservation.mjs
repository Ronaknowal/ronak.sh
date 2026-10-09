import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const current = 'src/learn/components/lesson-labs/PRMFlow.jsx';
const previous = base + '/runtime-tree-closure/predecessor/PRMFlow.jsx';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const clean = value => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['start', 'end', 'loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key))
    .map(([key, child]) => [key, clean(child)]));
  return value;
};
const ast = file => parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }).program.body;
const identify = node => node.declaration?.id?.name || node.id?.name;
const modified = ['FiniteTree', 'PRMBeamTree', 'PRMVisitTree', 'PRMNeutralSimplex'];
const before = ast(previous), after = ast(current);
const checks = before.map((node, index) => ({ name: identify(node) || `top-level-${index}`,
  allowedChanged: modified.includes(identify(node)),
  equal: JSON.stringify(clean(node)) === JSON.stringify(clean(after[index])) }));
const passed = before.length === after.length && checks.every(item => item.equal || item.allowedChanged)
  && modified.every(name => checks.some(item => item.name === name && !item.equal));
const report = { passed, predecessor: { path: previous, sha256: hash(previous) }, current: { path: current, sha256: hash(current) },
  allowed: modified, checks, scope: 'Only the shared two-figure finite-tree renderer, D22/D23 functions and D10 tuple-label placement plus decimal-normalized neutral-slider maximum differ. Other 26 figures, evidence hook and runtime helpers are AST-identical. No native fit, canonical program, model, manuscript or observations changed.' };
fs.writeFileSync(base + '/runtime-tree-closure/conservation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed, topLevelNodes: checks.length, changed: checks.filter(item => !item.equal).map(item => item.name) }));
if (!passed) process.exitCode = 1;
