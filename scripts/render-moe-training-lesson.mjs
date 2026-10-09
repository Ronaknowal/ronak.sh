import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = '37cd94545e80ef5c5e56e2b00190a79e6f0146d2ac07194125747a2c3a243b62';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Frozen manuscript identity changed');
const names = [
  'Anatomy', 'Routing', 'SwiGLU', 'Backward', 'Capacity', 'RandomLoad',
  'Balance', 'Gradient', 'ZLoss', 'Scope', 'Replicas', 'Bias', 'Causality',
  'Granularity', 'SavedModel', 'NativeMap', 'Results', 'History', 'Devices',
  'Blocks', 'Costs',
];
const replacements = names.map((name, index) => [
  `<!-- M${String(index + 1).padStart(2, '0')}:`, `<MoeTraining${name} />`,
]);
const programs = ['mechanisms', 'torch', 'language_study', 'transformers', 'systems'];
const additions = programs.map(name => [
  name === 'transformers' ? 'The ordinary architecture route uses a complete decoder' : `Download [moe_${name}.py]`,
  `<Program file="moe_${name}.py" />`,
]);

// The renderer intentionally handles a small Markdown subset. Join the
// manuscript's wrapped list items, preserving their exact word boundaries.
function joinListLines(text) {
  const lines = text.split('\n');
  const result = [];
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index];
    if (line.startsWith('- ')) {
      while (index + 1 < lines.length && /^  \S/.test(lines[index + 1])) {
        line += ` ${lines[++index].trim()}`;
      }
    }
    result.push(line);
  }
  return result.join('\n');
}

const [main, practiceAndEndings] = manuscript.split('## 14. Practice with changed inputs');
const [practice, endings] = practiceAndEndings.split('## Further learning');
let body = renderPreparedLesson(main, {
  replacements,
  additions,
  opening: [
    ['Follow one causal prediction', 'summary'],
    ['First pass:', 'route'],
    ['Prerequisites:', 'prerequisites'],
  ],
}).jsx;
body += '\n<H2>{"14. Practice with changed inputs"}</H2>\n';
const chunks = practice.split(/(?=^### [A-L]\. )/m);
body += renderPreparedLesson(chunks.shift()).jsx;
for (const chunk of chunks) {
  const [question, help] = chunk.split('**Hint:**');
  const [hint, solution] = help.split('**Solution:**');
  body += `\n<section className="moet-practice" data-lesson-exercise>\n${renderPreparedLesson(question).jsx}\n`;
  body += `<details><summary>Hint</summary>${renderPreparedLesson(hint).jsx}</details>\n`;
  body += `<details><summary>Worked solution</summary>${renderPreparedLesson(solution).jsx}</details>\n</section>\n`;
}
body += renderPreparedLesson(joinListLines(`## Further learning${endings}`)).jsx;

// The reviewed precision section retained its teaching but has this canonical
// fragment. Preserve the frozen manuscript and correct only its runtime href.
const formerPrecisionFragment = '#8-let-the-update-survive-small-gradients';
if (body.split(formerPrecisionFragment).length !== 2) throw new Error('Expected one precision link');
body = body.replace(formerPrecisionFragment, '#8-preserve-an-update-smaller-than-a-gap');

const aliases = [
  ['1. Spend work', ['1-start-with-the-problem', '1-why-it-exists']],
  ['2. Select IDs', ['2-build-the-intuition', '2-core-intuition']],
  ['3. Follow task', ['3-make-the-idea-precise', '3-mathematical-foundation']],
  ['4. Give every', ['4-from-scratch-implementation']],
  ['10. Build a', ['5-production-implementation']],
  ['11. Read the', ['6-visual-walkthrough']],
  ['12. Deeper:', ['8-what-scales-and-what-doesn-t']],
  ['13. Choose', ['7-decision-matrix', '9-failure-modes-and-gotchas']],
  ['14. Practice', ['11-self-check-exercises']],
  ['Technical references', ['10-primary-sources']],
];
for (const [prefix, ids] of aliases) {
  const anchor = `<H2>{"${prefix}`;
  if (!body.includes(anchor)) throw new Error(`Missing section ${prefix}`);
  body = body.replace(anchor, `<Old ids={${JSON.stringify(ids)}} />\n${anchor}`);
}
for (const [title, kind] of [['Further learning', 'further-learning'], ['Technical references', 'references'], ['Readiness and the next question', 'readiness']]) {
  const heading = `<H2>{${JSON.stringify(title)}}</H2>`;
  body = body.replace(heading, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n${heading}`);
}
// A surrounding section makes each ending boundary explicit without changing
// any teaching visibility. All teaching and full programs remain expanded.
body = `<section>\n${body}\n</section>`;

// Keep generated source conventionally readable; string concatenation keeps
// every authored space exact instead of depending on JSX whitespace rules.
body = body.replace(/\{("(?:[^"\\]|\\.)*")\}/g, (match, literal) => {
  const value = JSON.parse(literal);
  if (value.length <= 100) return match;
  const pieces = value.match(/.{1,92}(?:\s|$)|\S+/g) || [value];
  if (pieces.join('') !== value) return match;
  return `{\n${pieces.map(piece => `  ${JSON.stringify(piece)}`).join(' +\n')}\n}`;
}).replaceAll('><', '>\n<');

const source = `// Generated from the frozen manuscript by render-moe-training-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {
  MoeTrainingTable as NeuralTable,
${names.map(name => `  MoeTraining${name},`).join('\n')}
} from '../../components/lesson-labs/MoeTrainingFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="moet-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);

const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/moe-training/' + file}
    language="python" title={file} filename={file} />
);

const Old = ({ ids }) => ids.map(id => <span key={id} id={id} aria-hidden="true" />);

function MoeTrainingLesson() {
  return <div className="lesson-flow moe-training-flow">
${body.split('\n').map(line => `    ${line}`).join('\n')}
  </div>;
}

export default {
  title: 'MoE Training & Expert Load Balancing',
  slug: 'moe-training-expert-load-balancing',
  readTime: '~70 min read + 100 min practice',
  content: MoeTrainingLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
fs.writeFileSync(`${directory}/lesson.jsx`, source);
console.log(JSON.stringify({ manuscript: expected, runtime: digest(source), figures: names.length, programs: programs.length, practices: chunks.length }));
