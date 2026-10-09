import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = '655418641e9dc1e04072ecdba6db4f6a71c0c9c709327150b23b2f4d794b38a5';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Frozen P-Tuning manuscript changed');
const names = ['SharedBase', 'ThreeChoices', 'Vectors', 'Positions', 'Projection', 'Readout', 'Backward',
  'FullDecoder', 'TrainingGeneration', 'LayerMemory', 'MemoryMask', 'ZeroMemory', 'WorkCounts',
  'MlpEncoder', 'LstmEncoder', 'Materialization', 'Infix', 'TokenHead', 'HeadGradient',
  'NativeRoutes', 'Cache', 'Experiment', 'Selection', 'Outcomes', 'Predictions', 'ArtifactRouting'];
const programs = [...manuscript.matchAll(/<!-- PROGRAM ([a-z_]+\.py) -->/g)].map(match => match[1]);
if (new Set(programs).size !== 11) throw new Error('Expected eleven complete source files');
const replacements = [...names.map((name, i) => [`<!-- P${String(i + 1).padStart(2, '0')}:`, `<Soft${name} />`]),
  ...programs.map(name => [`<!-- PROGRAM ${name}`, `<Program file="${name}" />`])];
function render(text, options = {}) {
  const joined = text.replaceAll('\r\n', '\n').replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm,
    block => block.replace(/\n {2}/g, ' '))
    // The immutable manuscript uses same-line display delimiters. The shared
    // renderer accepts standalone \[ and \]; this changes presentation only.
    .replace(/^\$\$([\s\S]*?)\$\$$/gm, (_, expression) => `\\[\n${expression.trim()}\n\\]`);
  return renderPreparedLesson(joined, { ...options,
    replacements: replacements.filter(([prefix]) => joined.includes(prefix)),
  }).jsx;
}
const [main, later] = manuscript.split('## 14. Practice the distinctions on changed cases');
const [practice, ending] = later.split('## 15. Keep the mechanism and the evidence separate');
let body = render(main, { opening: [
  ['Suppose one language model', 'summary'], ['We will trace', 'route'],
  ['The [causal language-modeling lesson]', 'prerequisites'],
] });
body += '\n<H2>{"14. Practice the distinctions on changed cases"}</H2>\n';
const practices = practice.split(/(?=^### [A-L]\. )/m);
body += render(practices.shift());
for (const item of practices) {
  const [question, rest] = item.split('**Hint:**');
  const [hint, solution] = rest.split('**Solution:**');
  if (!solution) throw new Error('Incomplete practice');
  body += `<section className="soft-practice" data-lesson-exercise>\n${render(question)}\n`;
  body += `<details><summary>Hint</summary>${render(hint)}</details>\n`;
  body += `<details><summary>Worked solution</summary>${render(solution)}</details>\n</section>\n`;
}
body += render(`## 15. Keep the mechanism and the evidence separate${ending}`);
for (const [title, kind] of [
  ['15. Keep the mechanism and the evidence separate', 'takeaways'],
  ['16. Learn the idea from another angle', 'further-learning'],
  ['17. Technical references and reproducible files', 'references'],
  ['18. What you can now do', 'readiness'],
]) {
  const heading = `<H2>{${JSON.stringify(title)}}</H2>`;
  body = body.replace(heading, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n${heading}`);
}
const aliases = JSON.parse(fs.readFileSync(`${directory}/content-compatibility.json`, 'utf8')).aliases;
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let aliasCount = 0;
body = body.replace(/<H2>\{("(?:[^"\\]|\\.)*")}<\/H2>/g, (heading, literal) => {
  const key = slug(JSON.parse(literal));
  const matches = Object.entries(aliases).filter(([, target]) => target === key);
  aliasCount += matches.length;
  return matches.map(([alias]) => `<span id="${alias}" aria-hidden="true" />\n`).join('') + heading;
});
if (aliasCount !== 11) throw new Error(`Only ${aliasCount} aliases found`);
body = `<section>\n${body}\n</section>`;
// Preserve the visible characters while allowing long inline calculations and
// slash-separated source descriptions to wrap at their semantic boundaries.
body = body.replace(/\{("(?:[^"\\]|\\.)*")\}/g, (match, literal) => {
  const value = JSON.parse(literal);
  const pattern = /(F1=2×69\/\(2×69\+35\)=138\/173≈0\.797688|\[−\d+\.\d+,(?:−\d+\.\d+,?)+\]|prerequisite\/data\/evaluation)/g;
  if (!pattern.test(value)) return match;
  return value.split(pattern).map(piece => {
    pattern.lastIndex = 0;
    if (!pattern.test(piece)) return `{${JSON.stringify(piece)}}`;
    return piece.split(/(?<=[=≈,/])/).map(part => `{${JSON.stringify(part)}}`).join('<wbr />');
  }).join('');
});
body = body.replace(/\{("(?:[^"\\]|\\.)*")\}/g, (match, literal) => {
  const value = JSON.parse(literal);
  if (value.length <= 100) return match;
  const pieces = value.match(/.{1,92}(?:\s|$)|\S+/g) || [value];
  if (pieces.join('') !== value) return match;
  return `{\n${pieces.map(piece => `  ${JSON.stringify(piece)}`).join(' +\n')}\n}`;
}).replaceAll('><', '>\n<');
const groups = [
  ['SoftPromptFoundations', names.slice(0, 9)], ['SoftPromptMemory', names.slice(9, 13)],
  ['SoftPromptEncoders', names.slice(13, 19)], ['SoftPromptEvidence', names.slice(19)],
];
const source = `// Generated from immutable content by scripts/render-soft-prompt-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { SoftTable as NeuralTable } from '../../components/lesson-labs/SoftPromptShared.jsx';
${groups.map(([file, items]) => `import { ${items.map(name => `Soft${name}`).join(', ')} } from '../../components/lesson-labs/${file}.jsx';`).join('\n')}
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="soft-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/p-tuning/' + file}
    language="python" title={file} filename={file} />
);
function SoftPromptLesson() {
  return <div className="lesson-flow soft-flow">
${body.split('\n').map(line => `    ${line}`).join('\n')}
  </div>;
}
export default {
  title: 'P-Tuning and Soft Prompt Methods', slug: 'p-tuning-soft-prompt-methods',
  readTime: '~65 min read + 90 min practice', content: SoftPromptLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
if ((source.match(/<MathBlock>/g) || []).length !== 8 || source.includes('$$')) {
  throw new Error('Every frozen display equation must reach the shared math renderer');
}
fs.writeFileSync(`${directory}/lesson.jsx`, source);
console.log(JSON.stringify({ manuscript: expected, runtime: digest(source), figures: names.length, programs: programs.length, practices: practices.length, aliases: aliasCount }));
