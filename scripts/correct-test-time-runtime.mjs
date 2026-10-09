import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
import { parse } from '@babel/parser';
import prettier from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const base = 'docs/teaching/llm-architecture-training/test-time-compute-scaling';
const out = `${base}/runtime-correction`;
const sha = data => createHash('sha256').update(data).digest('hex');
const jsx = ['Shared', 'Selection', 'Search', 'Evidence', 'Allocation'].map(name => `src/learn/components/lesson-labs/TestTime${name}.jsx`);
const css = 'src/learn/components/lesson-labs/test-time-compute.css';
const files = [...jsx, 'src/learn/data/test-time-compute-models.js', 'scripts/render-test-time-lesson.mjs', css];
fs.mkdirSync(`${out}/predecessors`, { recursive: true });
const predecessors = {};
for (const [i, file] of files.entries()) {
  const bytes = fs.readFileSync(file);
  const preserved = `${out}/predecessors/${i}-${file.split('/').at(-1)}`;
  if (!fs.existsSync(preserved)) fs.writeFileSync(preserved, bytes, { flag: 'wx' });
  predecessors[file] = { path: preserved, sha256: sha(fs.readFileSync(preserved)) };
}
if (!fs.existsSync(`${out}/predecessors.json`)) fs.writeFileSync(`${out}/predecessors.json`, JSON.stringify(predecessors, null, 2) + '\n', { flag: 'wx' });
let search = fs.readFileSync(predecessors[jsx[2]].path, 'utf8');
function replace(before, after) {
  assert.equal(search.split(before).length, 2, before);
  search = search.replace(before, after);
}
replace("const value = beam(width, depth, family);", "const value = beam(width, depth, family);\n  const frontier = depth === 0 ? ['root'] : value.kept.slice(-width);");
replace('Frontier boundary', 'First-depth pruning reference');
replace('<g key={n.id} opacity={active ? 1 : .3}>', '<g key={n.id} data-node={n.id} data-scored={active}>');
replace('fillOpacity=".3" stroke={n.id === value.selected', 'fillOpacity={active ? .3 : .08} strokeDasharray={active ? undefined : "4 3"} stroke={n.id === value.selected');
replace("{value.selected || 'none'}. {depth", "{value.selected || 'none'}. Current {depth === 2 ? 'terminal frontier' : 'frontier'}: {frontier.join(', ')}. {depth");
replace('Dashed, faded descendants are counterfactual, not charged as generated.', 'Dashed nodes and edges are unscored counterfactuals, not charged as generated. Their labels remain visible for comparison.');
replace('<g key={r.id} opacity={i < count ? 1 : .2}>', '<g key={r.id} data-revision={r.id} data-retained={i < count}>');
replace('fillOpacity=".25" stroke={colors[i]}/><text x={100 + i * 205}', 'fillOpacity={i < count ? .25 : .06} strokeDasharray={i < count ? undefined : "4 3"} stroke={colors[i]}/><text x={100 + i * 205}');
replace('<path d={`M${100 + i * 205} 110V150`} stroke={colors[i]}/>', '{i < count ? <path d={`M${100 + i * 205} 110V150`} stroke={colors[i]}/> : <text x={100 + i * 205} y="130" textAnchor="middle">outside pool</text>}');
const checks = [];
function normalized(node) {
  if (Array.isArray(node)) return node.map(normalized);
  if (!node || typeof node !== 'object') return node;
  const result = Object.fromEntries(Object.entries(node).filter(([key]) => !['start','end','loc','extra','leadingComments','trailingComments','innerComments','comments'].includes(key)).map(([key, value]) => [key, normalized(value)]));
  if (result.type === 'CallExpression' && result.callee?.object?.name === 'React' && result.callee?.property?.name === 'createElement') {
    const args = result.arguments.slice(0, 2);
    for (const child of result.arguments.slice(2)) {
      if (child.type === 'StringLiteral' && args.length > 2 && args.at(-1).type === 'StringLiteral') args.at(-1).value += child.value;
      else args.push(child);
    }
    result.arguments = args;
  }
  return result;
}
for (const file of files.filter(file => file !== css)) {
  const before = file === jsx[2] ? search : fs.readFileSync(predecessors[file].path, 'utf8');
  const formatted = await prettier.format(before, { parser: 'babel', plugins: [babel, estree], printWidth: 100, singleQuote: true });
  const options = { loader: file.endsWith('.jsx') ? 'jsx' : 'js', minifyWhitespace: true, minifySyntax: true, legalComments: 'none' };
  const a = await transform(before, options);
  const b = await transform(formatted, options);
  assert.deepEqual(normalized(parse(b.code, {sourceType:'module'})), normalized(parse(a.code, {sourceType:'module'})), `Formatting changes compiled AST/JSX text: ${file}`);
  checks.push({ file, before: sha(before), after: sha(formatted), compiledEqual: true });
  fs.writeFileSync(file, formatted);
}
fs.writeFileSync(css, fs.readFileSync(predecessors[css].path,'utf8') + '\n.reader-content:has(.ttc-flow) .lesson-compass .lesson-compass__sections { grid-template-columns: repeat(auto-fit, minmax(min(100%, 22em), 1fr)); }\n');
fs.writeFileSync(`${out}/source-checks.json`, JSON.stringify({ checks, initialGuardFailure: 'Byte-for-byte compiled comparison failed after Shared was written because Prettier split adjacent React text strings. Successor compares compiled AST with only adjacent createElement text children concatenated; all predecessors retained.', changes: ['R1 full-contrast labels with dashed unscored/excluded marks', 'R2 fixed reference renamed and actual frontier reported', 'R3 seven authored modules conventionally formatted with equivalent compiled AST and rendered JSX text', 'R4 topic-local adaptive compass'], files: Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(file))])) }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ corrected: files.length, formattingGuards: checks.length }));
