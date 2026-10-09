import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';

const directory = 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = 'ae436e7bd0eab710c6b7a901454f121c9de1d8b5d06a1c802cb46ab441c1df76';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
if (digest(manuscript) !== expected) throw new Error('Accepted manuscript changed');
const groups = {
  Foundations: ['Meaning', 'Architectures', 'Markers', 'Masks', 'Encoder', 'Attention', 'Softmax', 'Simplex', 'Ordinal', 'Truth', 'CrossEntropy', 'ParameterStep'],
  Probability: ['ProperScore', 'RewardCurves', 'RankedScore', 'ReportPolicy', 'EstimatorEvidence', 'RecipeGraph', 'RareEvent'],
  Study: ['DataRoles', 'Cohort', 'TrainingHistory', 'Confusion', 'Temperature', 'CalibrationEvidence', 'CostMatrix', 'CostRegions', 'Routing', 'RoutingEvidence'],
  Native: ['NativeArchitecture', 'NativeBatch', 'NativeCost', 'SchemaShift', 'TokenBudget', 'ShiftEvidence', 'Artifact'],
};
const names = Object.values(groups).flat();
const programs = [...manuscript.matchAll(/<!-- PROGRAM ([a-z_]+\.py) -->/g)].map(match => match[1]);
if (names.length !== 36 || new Set(programs).size !== 10) throw new Error('Incomplete figure/program coverage');
const replacements = [
  ...names.map((name, i) => [`<!-- D${String(i + 1).padStart(2, '0')}:`, `<Decision${name} />`]),
  ...programs.map(name => [`<!-- PROGRAM ${name}`, `<Program file="${name}" />`]),
];
function render(source, options = {}) {
  const joined = source.replaceAll('\r\n', '\n')
    .replace(/^\$\$(.+)\$\$$/gm, (_, equation) => `\\[\n${equation}\n\\]`)
    .replace(/(<!--[^\n]+-->)/g, '\n$1\n')
    .replace(/^(\s*(?:- |\d+\. ).*)(?:\n {2}(\S[^\n]*))+/gm, block => block.replace(/\n {2}/g, ' '));
  return renderPreparedLesson(joined, {
    assetBase: '/learn/examples/typed-decision-systems/',
    ...options,
    replacements: replacements.filter(([prefix]) => joined.includes(prefix)),
  }).jsx;
}
const [main, tail] = manuscript.split('## 19. Independent practice');
const [practice, endings] = tail.split('## 20. Further learning');
let body = '<section>\n' + render(main, { opening: [
  ['Review [Masked Language Modeling]', 'prerequisites'], ['For a first reading,', 'route'],
] });
body += '</section>\n<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">\n<H2>{"19. Independent practice"}</H2>\n';
const exercises = practice.split(/(?=^### P\d+\. )/m);
body += render(exercises.shift());
for (const exercise of exercises) {
  const [question, rest] = exercise.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  if (!solution) throw new Error('Missing solution');
  body += `<section className="typed-practice" data-lesson-exercise>\n${render(question)}\n`;
  body += `<details><summary>Hint</summary>${render(hint)}</details>\n`;
  body += `<details><summary>Worked solution</summary>${render(solution)}</details>\n</section>\n`;
}
if (exercises.length !== 18) throw new Error('Expected eighteen complete practices');
body += render(`## 20. Further learning${endings}`);
for (const [title, kind] of [['20. Further learning', 'further-learning'], ['21. Technical references and reproducibility', 'references'], ['22. Ready to explain, implement and extend', 'readiness']]) {
  body = body.replace(`<H2>{${JSON.stringify(title)}}</H2>`, `</section>\n<section className="lesson-ending lesson-ending--resources" data-lesson-ending="${kind}">\n<H2>{${JSON.stringify(title)}}</H2>`);
}
body += '\n</section>';
body = body.replaceAll('><', '>\n<');
const source = `// Generated from immutable accepted content by scripts/render-typed-decision-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/TypedDecisionShared.jsx';
${Object.entries(groups).map(([name, items]) => `import { ${items.map(x => 'Decision' + x).join(', ')} } from '../../components/lesson-labs/TypedDecision${name}.jsx';`).join('\n')}
import '../../components/lesson-labs/lesson-flow.css';

function Program({ file }) {
  return <RemoteCodeBlock source={'/learn/examples/typed-decision-systems/' + file} language="python" title={file} filename={file} />;
}
function TypedDecisionLesson() {
  return <div className="lesson-flow typed-flow">
${body.split('\n').map(line => '    ' + line).join('\n')}
  </div>;
}
export default {
  title: 'Typed Decision Models & Calibrated Neural Decision Systems',
  slug: 'typed-decision-models-calibrated-neural-decision-systems',
  readTime: '~80 min read + 100 min practice',
  content: TypedDecisionLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
fs.writeFileSync(`${directory}/lesson.jsx`, source);
fs.writeFileSync(`${directory}/runtime-compatibility.json`, JSON.stringify({ manuscript: expected, runtime: digest(source), figures: names, programs, practices: exercises.length }, null, 2) + '\n');
console.log(JSON.stringify({ runtime: digest(source), figures: names.length, programs: programs.length, practices: exercises.length }));
