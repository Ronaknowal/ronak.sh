import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = 'c43e504c0015f1bd33c3290262b4faaa75ebb2b9ceea28c73354e28b11fc4224';
const digest = value => createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Accepted manuscript changed');
const groups = {
  Foundations: ['Request', 'Boundary', 'Schedules', 'Refill', 'Budgets', 'Clocks', 'Projection', 'Segmented', 'Scatter'],
  Storage: ['Addresses', 'Slack', 'Transaction', 'Release', 'Fork', 'CopyOnWrite', 'PageNormalization', 'OnlineSoftmax', 'Admission', 'Rebuild'],
  Serving: ['Chunks', 'QueryAllocation', 'ModeledTime', 'Manager', 'Lifecycle', 'NativeParity', 'NativeClocks', 'Workers', 'Pipeline', 'Diagnosis', 'BindingLimit'],
};
const names = Object.values(groups).flat();
const programs = [...manuscript.matchAll(/<!-- PROGRAM: ([a-z_]+\.py) -->/g)].map(match => match[1]);
if (new Set(programs).size !== 10 || names.length !== 30) throw new Error('Incorrect content mapping');
const replacements = [
  ...names.map((name, index) => [`<!-- D${String(index + 1).padStart(2, '0')}:`, `<Cb${name} />`]),
  ...programs.map(name => [`<!-- PROGRAM: ${name}`, `<Program file="${name}" />`]),
];
function render(text, options = {}) {
  const joined = text.replaceAll('\r\n', '\n')
    .replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm, block => block.replace(/\n {2}/g, ' '))
    .replace(/^\$\$([\s\S]*?)\$\$$/gm, (_, expression) => `\\[\n${expression.trim()}\n\\]`);
  return renderPreparedLesson(joined, { ...options, replacements: replacements.filter(([prefix]) => joined.includes(prefix)) }).jsx;
}
const [main, tail] = manuscript.split('## Practice: change the inputs and explain the state');
const [practice, endings] = tail.split('## Further learning');
let body = '<section>\n' + render(main, { opening: [
  ['The first pass follows', 'route'], ['The [KV-cache lesson]', 'prerequisites'],
] });
body = body.replace('<Program file="iteration_scheduler.py" />', `<Prose><a href="/learn-code/continuous-batching/continuous-batching-programs.zip" download>Download the complete program bundle</a>{' · '}<a href="/learn-code/continuous-batching/README.md">Setup and file guide</a></Prose>\n<Program file="iteration_scheduler.py" />`);
body += '</section>\n<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">\n<H2>{"Practice"}</H2>\n';
const exercises = practice.split(/(?=^### \d+\. )/m);
body += render(exercises.shift());
for (const item of exercises) {
  const [question, rest] = item.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  if (!solution) throw new Error('Missing solution');
  body += `<section className="cb-practice" data-lesson-exercise>\n${render(question)}\n`;
  body += `<details><summary>Hint</summary>${render(hint)}</details>\n`;
  body += `<details><summary>Worked solution</summary>${render(solution)}</details>\n</section>\n`;
}
body += render(`## Further learning${endings}`);
for (const [title, kind] of [['Further learning', 'further-learning'], ['Technical references', 'references'], ['Readiness check', 'readiness']]) {
  body = body.replace(`<H2>{${JSON.stringify(title)}}</H2>`, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n<H2>{${JSON.stringify(title)}}</H2>`);
}
body += '\n</section>';
const aliases = {
  '1-why-it-exists': '1-keep-a-request-separate-from-its-last-selected-token',
  '2-core-intuition': '3-refill-the-empty-slot',
  '3-mathematical-foundation': '6-give-logical-positions-physical-addresses',
  '4-from-scratch-implementation': '7-make-an-append-all-or-nothing',
  '5-production-implementation': '12-use-a-maintained-request-manager-deliberately',
  '6-visual-walkthrough': '8-share-a-prefix-then-copy-only-when-writing',
  '7-decision-matrix': '10-decide-which-histories-may-remain-resident',
  '8-what-scales-and-what-doesn-t': '11-bound-prefill-without-forgetting-earlier-chunks',
  '9-failure-modes-and-gotchas': '15-reconstruct-the-state-before-changing-the-knob',
  '10-primary-sources': 'technical-references',
  '11-self-check-exercises': 'practice',
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
const source = `// Generated from accepted immutable content by scripts/render-continuous-batching-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/ContinuousBatchingShared.jsx';
${Object.entries(groups).map(([group, items]) => `import { ${items.map(name => 'Cb' + name).join(', ')} } from '../../components/lesson-labs/ContinuousBatching${group}.jsx';`).join('\n')}
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="cb-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/continuous-batching/' + file} language="python" title={file} filename={file} />
);
function ContinuousBatchingLesson() {
  return <div className="lesson-flow cb-flow">
${body.split('\n').map(line => '    ' + line).join('\n')}
  </div>;
}
export default {
  title: 'Continuous Batching & PagedAttention',
  slug: 'continuous-batching-pagedattention',
  readTime: '~80 min read + 90 min practice', content: ContinuousBatchingLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
if (source.includes('$$')) throw new Error('Unrendered display mathematics');
fs.writeFileSync(`${directory}/lesson.jsx`, source);
fs.writeFileSync(`${directory}/runtime-compatibility.json`, JSON.stringify({ manuscript: expected, aliases, figures: names, programs,
  presentation: 'Frozen manuscript rendered with explicit figure/program placements, shared practice endings and two setup delivery links; no scientific edit.' }, null, 2) + '\n');
console.log(JSON.stringify({ manuscript: expected, runtime: digest(source), figures: names.length, programs: programs.length, practices: exercises.length, aliases: matched }));
