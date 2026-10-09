import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = 'b1d4e74fc78c97908e3f80e6ecb26e6d17a71eea71d7510448593d6a3c7aa9f8';
const digest = value => createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Accepted manuscript changed');
const groups = {
  Foundations: ['TokenLoop', 'CausalCone', 'LayerStores', 'AttentionRead', 'Append', 'OffsetMask', 'PoisonedCapacity', 'Padding', 'Decoder'],
  Memory: ['NativeCache', 'Work', 'Timings', 'PayloadFactors', 'Allocation', 'DeviceBudget', 'GroupedHeads', 'Invalidation', 'PositionMove', 'Retention'],
  Storage: ['Pages', 'SharedPrefix', 'Packing', 'Precision', 'Offload', 'Latent', 'Diagnosis'],
};
const names = Object.values(groups).flat();
const programs = [...manuscript.matchAll(/<!-- PROGRAM ([a-z_]+\.py) -->/g)].map(match => match[1]);
if (new Set(programs).size !== 11 || names.length !== 26) throw new Error('Incorrect content mapping');
const replacements = [
  ...names.map((name, index) => [`<!-- D${String(index + 1).padStart(2, '0')}:`, `<Kv${name} />`]),
  ...programs.map(name => [`<!-- PROGRAM ${name}`, `<Program file="${name}" />`]),
];
function render(text, options = {}) {
  const joined = text.replaceAll('\r\n', '\n')
    .replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm, block => block.replace(/\n {2}/g, ' '))
    .replace(/^\$\$([\s\S]*?)\$\$$/gm, (_, expression) => `\\[\n${expression.trim()}\n\\]`);
  return renderPreparedLesson(joined, { ...options, replacements: replacements.filter(([prefix]) => joined.includes(prefix)) }).jsx;
}
const [main, tail] = manuscript.split('## Practice');
const [practice, endings] = tail.split('## Further learning');
let body = '<section>\n' + render(main, { opening: [
  ['We will follow', 'route'], ['The [causal language-modeling lesson]', 'prerequisites'],
] });
body = body.replace('<Program file="cache_trace.py" />', `<Prose><a href="/learn-code/kv-cache/kv-cache-programs.zip" download>Download the complete program bundle</a>{' · '}<a href="/learn-code/kv-cache/README.md">Setup and file guide</a></Prose>\n<Program file="cache_trace.py" />`);
body += '</section>\n<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">\n<H2>{"Practice"}</H2>\n';
const exercises = practice.split(/(?=^### [A-M]\. )/m);
body += render(exercises.shift());
for (const item of exercises) {
  const [question, rest] = item.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  if (!solution) throw new Error('Missing solution');
  body += `<section className="kv-practice" data-lesson-exercise>\n${render(question)}\n`;
  body += `<details><summary>Hint</summary>${render(hint)}</details>\n`;
  body += `<details><summary>Worked solution</summary>${render(solution)}</details>\n</section>\n`;
}
body += render(`## Further learning${endings}`);
for (const [title, kind] of [['Further learning', 'further-learning'], ['Technical references', 'references'], ['Readiness', 'readiness']]) {
  body = body.replace(`<H2>{${JSON.stringify(title)}}</H2>`, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n<H2>{${JSON.stringify(title)}}</H2>`);
}
body += '\n</section>';
const aliases = {
  '1-why-it-exists': '1-follow-the-token-that-has-actually-been-processed',
  '2-core-intuition': '2-prove-why-the-old-rows-can-stay',
  '3-mathematical-foundation': '3-read-three-records-then-append-one',
  '4-from-scratch-implementation': '5-cache-every-layer-of-a-complete-decoder',
  '5-production-implementation': '6-drive-an-ordinary-library-cache-on-real-text',
  '6-visual-walkthrough': '4-make-the-mask-agree-with-the-cache-offset',
  '7-decision-matrix': '9-ask-which-device-owns-each-head',
  '8-what-scales-and-what-doesn-t': '7-count-saved-work-then-measure-the-actual-calls',
  '9-failure-modes-and-gotchas': '14-diagnose-the-first-disagreement-before-optimizing',
  '10-primary-sources': 'technical-references', '11-self-check-exercises': 'practice',
};
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let matched = 0;
body = body.replace(/<H2>\{("(?:[^"\\]|\\.)*")}<\/H2>/g, (heading, literal) => {
  const targets = Object.entries(aliases).filter(([, target]) => target === slug(JSON.parse(literal)));
  matched += targets.length;
  return targets.map(([alias]) => `<span id="${alias}" aria-hidden="true" />\n`).join('') + heading;
});
if (matched !== 11) throw new Error(`Only ${matched} legacy anchors mapped`);
body = body.replace(/\{("(?:[^"\\]|\\.)*")\}/g, (match, literal) => {
  const value = JSON.parse(literal);
  if (value.length < 100) return match;
  const parts = value.match(/.{1,92}(?:\s|$)|\S+/g) || [value];
  return parts.join('') === value ? `{\n${parts.map(part => '  ' + JSON.stringify(part)).join(' +\n')}\n}` : match;
}).replaceAll('><', '>\n<');
const source = `// Generated from accepted immutable content by scripts/render-kv-cache-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/KvCacheShared.jsx';
${Object.entries(groups).map(([group, items]) => `import { ${items.map(name => 'Kv' + name).join(', ')} } from '../../components/lesson-labs/KvCache${group}.jsx';`).join('\n')}
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="kv-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/kv-cache/' + file} language="python" title={file} filename={file} />
);
function KvCacheLesson() {
  return <div className="lesson-flow kv-flow">
${body.split('\n').map(line => '    ' + line).join('\n')}
  </div>;
}
export default {
  title: 'KV-Cache & Memory Management',
  slug: 'kv-cache-memory-management',
  readTime: '~80 min read + 90 min practice', content: KvCacheLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
if (source.includes('$$')) throw new Error('Unrendered display mathematics');
fs.writeFileSync(`${directory}/lesson.jsx`, source);
fs.writeFileSync(`${directory}/runtime-compatibility.json`, JSON.stringify({ manuscript: expected, aliases, figures: names, programs,
  presentation: 'Frozen manuscript rendered with explicit figure/program placements, shared practice endings and two setup delivery links; no scientific edit.' }, null, 2) + '\n');
console.log(JSON.stringify({ manuscript: expected, runtime: digest(source), figures: names.length, programs: programs.length, practices: exercises.length, aliases: matched }));
