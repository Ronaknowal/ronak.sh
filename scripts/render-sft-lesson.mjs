import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/supervised-fine-tuning-sft';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = '4e818cb13d6530c5421d8d735eaa919828cebbcad143e0c83e184172081bbf29';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Frozen SFT manuscript changed');
const names = ['Update', 'Choices', 'Serialization', 'Families', 'Shift', 'Loss',
  'PromptCredit', 'Histories', 'Roles', 'Boundary', 'Padding', 'Denominator',
  'PackedMask', 'Positions', 'Pipeline', 'NativeTrainer', 'Experiment',
  'Results', 'Confusion', 'Diagnosis', 'Capstone'];
const figures = names.map((name, i) => [`<!-- S${String(i + 1).padStart(2, '0')}:`, `<Sft${name} />`]);
const programs = ['objective', 'data', 'batching', 'evaluate', 'trl', 'study'];
const replacements = [...figures, ...programs.map(name => [`<!-- PROGRAM sft_${name}.py`, `<Program file="sft_${name}.py" />`])];
function render(text, options = {}) {
  // Wrapped list items retain their exact words in one visible list entry.
  const joined = text.replaceAll('\r\n', '\n').replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm,
    block => block.replace(/\n {2}/g, ' '));
  return renderPreparedLesson(joined, {
    ...options, replacements: replacements.filter(([prefix]) => joined.includes(prefix)),
  }).jsx;
}
const [main, later] = manuscript.split('## 13. Independent practice');
const [practice, ending] = later.split('## Key takeaways');
let body = render(main, { opening: [
  ['A language model can continue', 'summary'],
  ['You will implement', 'route'],
  ['The [causal language-modeling lesson]', 'prerequisites'],
] });
body += '\n<H2>{"13. Independent practice"}</H2>\n';
const chunks = practice.split(/(?=^### [A-M]\. )/m);
body += render(chunks.shift());
for (const chunk of chunks) {
  const [question, rest] = chunk.split('**Hint.**');
  const [hint, solution] = rest.split('**Worked solution.**');
  if (!solution) throw new Error('Missing complete worked practice');
  body += `\n<section className="sft-practice" data-lesson-exercise>\n${render(question)}\n`;
  body += `<details><summary>Hint</summary>${render(hint)}</details>\n`;
  body += `<details><summary>Worked solution</summary>${render(solution)}</details>\n</section>\n`;
}
body += render(`## Key takeaways${ending}`);
for (const [title, kind] of [
  ['Key takeaways', 'takeaways'], ['Further learning', 'further-learning'],
  ['Technical references and reproducible files', 'references'], ['Related topics and readiness', 'readiness'],
]) {
  const heading = `<H2>{${JSON.stringify(title)}}</H2>`;
  body = body.replace(heading, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n${heading}`);
}
body = `<section>\n${body}\n</section>`;
body = body.replace(/\{("(?:[^"\\]|\\.)*")\}/g, (match, literal) => {
  const value = JSON.parse(literal);
  if (value.length <= 100) return match;
  const pieces = value.match(/.{1,92}(?:\s|$)|\S+/g) || [value];
  if (pieces.join('') !== value) return match;
  return `{\n${pieces.map(piece => `  ${JSON.stringify(piece)}`).join(' +\n')}\n}`;
}).replaceAll('><', '>\n<');
const source = `// Generated from frozen content by scripts/render-sft-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { SftTable as NeuralTable } from '../../components/lesson-labs/SftFlowShared.jsx';
import { ${names.slice(0,10).map(name => `Sft${name}`).join(', ')} } from '../../components/lesson-labs/SftFoundations.jsx';
import { ${[...names.slice(10,17), names[20]].map(name => `Sft${name}`).join(', ')} } from '../../components/lesson-labs/SftBatching.jsx';
import { SftResults, SftConfusion, SftDiagnosis } from '../../components/lesson-labs/SftStudy.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="sft-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/supervised-fine-tuning/' + file}
    language="python" title={file} filename={file} />
);
function SftLesson() {
  return <div className="lesson-flow sft-flow">
${body.split('\n').map(line => `    ${line}`).join('\n')}
  </div>;
}
export default {
  title: 'Supervised Fine-Tuning (SFT)', slug: 'supervised-fine-tuning-sft',
  readTime: '~65 min read + 90 min practice', content: SftLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
fs.writeFileSync(`${directory}/lesson.jsx`, source);
console.log(JSON.stringify({ manuscript: expected, runtime: digest(source), figures: 21, programs: 6, practices: chunks.length }));
