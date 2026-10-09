import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = '9c11af08303aa8d8c4b485967195ad78f7585f4419326f6f9fd88b53a40b6db9';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Accepted manuscript changed');
const names = ['Networks', 'Deployment', 'Signals', 'Completion', 'Divergence', 'Vocabulary', 'Temperature',
  'Update', 'HighTemperature', 'Constraint', 'Directions', 'SequenceTree', 'SequenceSample', 'ResponseMask',
  'Reduction', 'PrefixWeights', 'VisitationGradient', 'StudentPrefix', 'Trace', 'Filtering', 'R1Recipe',
  'Experiment', 'SavedTargets', 'LayerCopy', 'Chunks', 'Outcomes', 'Costs', 'Route'];
const programs = [...manuscript.matchAll(/<!-- PROGRAM ([a-z_]+\.py) -->/g)].map(match => match[1]);
if (new Set(programs).size !== 12) throw new Error('Expected twelve complete program views');
const replacements = [...names.map((name, index) => [`<!-- D${String(index + 1).padStart(2, '0')}:`, `<Distill${name} />`]),
  ...programs.map(name => [`<!-- PROGRAM ${name}`, `<Program file="${name}" />`])];
function render(text, options = {}) {
  const joined = text.replaceAll('\r\n', '\n')
    // Preserve a wrapped quantity: its 15. is prose, not a list marker.
    .replace('matches the teacher on\n15. Report', 'matches the teacher on 15. Report')
    .replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm, block => block.replace(/\n {2}/g, ' '))
    .replace(/^\$\$([\s\S]*?)\$\$$/gm, (_, expression) => `\\[\n${expression.trim()}\n\\]`);
  return renderPreparedLesson(joined, { ...options,
    replacements: replacements.filter(([prefix]) => joined.includes(prefix)),
  }).jsx;
}
const [main, tail] = manuscript.split('## Practice');
const [practice, endings] = tail.split('## Key takeaways');
let body = '<section>\n' + render(main, { opening: [
  ['We will construct', 'route'], ['The [causal language-modeling lesson]', 'prerequisites'],
] });
body += '</section>\n<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">\n<H2>{"Practice"}</H2>\n';
const exercises = practice.split(/(?=^### [A-O]\. )/m);
body += render(exercises.shift());
for (const item of exercises) {
  const [question, rest] = item.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  if (!solution) throw new Error('Missing practice solution');
  body += `<section className="distill-practice" data-lesson-exercise>\n${render(question)}\n`;
  body += `<details><summary>Hint</summary>${render(hint)}</details>\n`;
  body += `<details><summary>Worked solution</summary>${render(solution)}</details>\n</section>\n`;
}
body += render(`## Key takeaways${endings}`);
for (const [title, kind] of [['Key takeaways', 'takeaways'], ['Further reading', 'further-learning'], ['References', 'references'], ["What's next", 'readiness']]) {
  body = body.replace(`<H2>{${JSON.stringify(title)}}</H2>`, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n<H2>{${JSON.stringify(title)}}</H2>`);
}
body += '\n</section>';
const aliases = {
  '1-why-it-exists': '1-two-networks-one-deployment', '2-core-intuition': '2-what-survives-a-teacher-call',
  '3-mathematical-foundation': '3-compare-probabilities-on-the-same-events',
  '4-from-scratch-implementation': '4-soften-a-target-and-follow-its-gradient',
  '5-production-implementation': '12-use-a-pretrained-teacher-with-ordinary-tooling',
  '6-visual-walkthrough': '6-a-sequence-chooses-the-next-context',
  '7-decision-matrix': '14-choose-a-route-from-the-information-available',
  '8-what-scales-and-what-doesn-t': '13-measure-transfer-and-account-for-its-cost',
  '9-failure-modes-and-gotchas': '9-transfer-a-trace-and-check-what-it-asserts',
  '10-primary-sources': 'references', '11-self-check-exercises': 'practice',
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
const source = `// Generated from accepted immutable content by scripts/render-distillation-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/DistillationShared.jsx';
${[['Foundations', names.slice(0, 11)], ['Sequences', names.slice(11, 18)], ['Evidence', names.slice(18)]].map(([group, items]) =>
    `import { ${items.map(name => 'Distill' + name).join(', ')} } from '../../components/lesson-labs/Distillation${group}.jsx';`).join('\n')}
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="distill-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/llm-distillation/' + file} language="python" title={file} filename={file} />
);
function DistillationLesson() {
  return <div className="lesson-flow distill-flow">
${body.split('\n').map(line => '    ' + line).join('\n')}
  </div>;
}
export default {
  title: 'Knowledge Distillation for LLMs (DeepSeek-R1-Distill, CoT Distillation)',
  slug: 'knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation',
  readTime: '~75 min read + 90 min practice', content: DistillationLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
if (source.includes('$$')) throw new Error('Unrendered display mathematics');
fs.writeFileSync(`${directory}/lesson.jsx`, source);
fs.writeFileSync(`${directory}/runtime-compatibility.json`, JSON.stringify({ manuscript: expected, aliases, figures: names, programs }, null, 2) + '\n');
console.log(JSON.stringify({ manuscript: expected, runtime: digest(source), figures: names.length, programs: programs.length, practices: exercises.length, aliases: matched }));
