import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import katex from 'katex';

const base = 'docs/teaching/llm-architecture-training/constitutional-ai-cai';
const manuscript = path.join(base, 'manuscript.jsx');
const source = fs.readFileSync(manuscript, 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const counts = { math: 0, programs: 0, drawings: 0, exercises: 0 };
const findings = [];
const anchors = [];
const programs = [];
const drawings = [];
const componentImport = ast.program.body.find(node => node.type === 'ImportDeclaration' && node.source.value.endsWith('/ConstitutionalAIFlow.jsx'));
const names = new Set(componentImport.specifiers.map(node => node.local.name));
const check = (name, condition) => {
  findings.push({ name, passed: Boolean(condition) });
  if (!condition) throw new Error(name);
};
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXElement') {
    const name = node.openingElement.name.name;
    const attribute = key => node.openingElement.attributes.find(item => item.type === 'JSXAttribute' && item.name.name === key)?.value?.value;
    if (name === 'Anchor') anchors.push(attribute('id'));
    if (names.has(name)) { counts.drawings++; drawings.push(name); }
    if (name === 'Exercise') counts.exercises++;
    if (name === 'Program') {
      counts.programs++;
      const file = attribute('file');
      programs.push(file);
      check(`complete canonical program ${file}`, fs.existsSync(`public/learn/examples/constitutional-ai/${file}`));
    }
    if (name === 'MathBlock') {
      counts.math++;
      const expression = node.children.find(child => child.type === 'JSXExpressionContainer')?.expression;
      check(`math literal ${counts.math}`, expression?.type === 'TaggedTemplateExpression');
      const latex = expression.quasi.quasis.map(part => part.value.raw).join('');
      katex.renderToString(latex, { throwOnError: true, displayMode: true });
      check(`KaTeX parse ${counts.math}`, true);
    }
    if (name === 'CodeBlock' && attribute('filename') === 'completion_mask_excerpt.py') {
      const expression = node.children.find(child => child.type === 'JSXExpressionContainer').expression;
      const excerpt = expression.quasis.map(part => part.value.cooked).join('');
      const canonical = fs.readFileSync('public/learn/examples/constitutional-ai/torch_training.py', 'utf8');
      check('named mask excerpt matches canonical lines', excerpt.split('\n').every(line => canonical.split('\n').some(actual => actual.trim() === line.trim())));
    }
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(ast);
check('all 23 promised drawing placements', counts.drawings === 23 && new Set(drawings).size === 23);
check('all seven complete programs visible', counts.programs === 7 && new Set(programs).size === 7);
check('eleven solved practice tasks', counts.exercises === 11);
check('unique compatibility anchors', new Set(anchors).size === anchors.length);
check('no raw Markdown citations in JSX', !/\]\(https?:/.test(source));
const original = fs.readFileSync(`${base}/original/constitutional-ai.jsx`);
const published = fs.readFileSync('src/learn/data/topics/constitutional-ai.jsx');
check('published original preserved byte for byte', published.equals(original));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { status: 'passed', counts, findings, manuscriptSha256: hash(Buffer.from(source)),
  originalSha256: hash(original), scope: 'AST, math syntax, canonical excerpt, placements and publication conservation; no runtime or painted acceptance' };
fs.writeFileSync(`${base}/content-structure-checks.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({status: 'passed', counts, conditions: findings.length}, null, 2));
