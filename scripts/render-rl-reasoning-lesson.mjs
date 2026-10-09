import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const directory = 'docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = '7c0fd96469440fc5e5659c928216b133c637e80beefaf1d5dcdb4a2af49deb7b';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
if (hash(manuscript) !== expected) throw new Error('Frozen reasoning manuscript changed');
if (!fs.existsSync(`${directory}/content-acceptance.json`))
  throw new Error('Root content acceptance required');

const names = [
  'ExpressionTree',
  'ExposedEvidence',
  'ConditionalTree',
  'SharedDecoder',
  'TraceChecker',
  'ProbabilityContributions',
  'ScoreCoordinates',
  'GradientUpdate',
  'GroupComparison',
  'SignedClipping',
  'SamplerSupport',
  'GroupComposition',
  'GenerationTimeline',
  'ReductionWeights',
  'StudySplit',
  'SavedRollout',
  'TransferResults',
  'NativeTrace',
  'SampleMatrix',
  'SubsetCounting',
  'TokenBudget',
  'TrainingStages',
  'TrainingInterventions',
  'CrossingCurves',
  'ObservedSets',
  'TeacherInformation',
  'EvidenceDiagnosis',
];
const programs = [...manuscript.matchAll(/<!-- program:([^ ]+) -->/g)].map((m) => m[1]);
if (programs.length !== 9) throw new Error('Expected all nine complete programs');
const [main, practiceTail] = manuscript.split('## 14. Independent practice');
const [practice, endingTail] = practiceTail.split('## 15. Key takeaways');
const replacements = names.map((name, i) => [
  `<!-- visual:D${String(i + 1).padStart(2, '0')} -->`,
  `<${name} />`,
]);
replacements.push(
  ...programs.map((file) => [`<!-- program:${file} -->`, `<Program file="${file}" />`]),
);
let body = renderPreparedLesson(main, {
  replacements,
  assetBase: '/learn-code/rl-reasoning/',
  opening: [
    ['We will first enumerate', 'prerequisites'],
    ['Read sections 1–7', 'route'],
  ],
}).jsx;
body += '<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">';
body += '<H2>{"14. Independent practice"}</H2>';
const tasks = practice.split(/(?=^### \d+\. )/m);
body += renderPreparedLesson(tasks.shift()).jsx;
for (const task of tasks) {
  const [question, rest] = task.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  if (!hint || !solution) throw new Error('Each task requires its complete hint and solution');
  body += `<section className="reasoning-practice lesson-exercise" data-lesson-exercise>
${renderPreparedLesson(question).jsx}
<details><summary>Hint</summary>${renderPreparedLesson(hint).jsx}</details>
<details><summary>Worked solution</summary>${renderPreparedLesson(solution).jsx}</details>
</section>`;
}
body += '</section>';
const ending = renderPreparedLesson(`## 15. Key takeaways${endingTail}`, {
  replacements: [['<!-- file-index:rl-reasoning -->', '<FileIndex />']],
}).jsx;
const closing = ending.split(/(?=<H2>)/);
body += closing
  .map((section) => {
    if (!section.trim()) return section;
    const kind = section.includes('18. Readiness') ? 'next' : 'resources';
    return `<section className="lesson-ending lesson-ending--${kind}" data-lesson-ending="${kind}">${section}</section>`;
  })
  .join('\n');
const aliases = JSON.parse(
  fs.readFileSync(`${directory}/content-compatibility.json`, 'utf8'),
).aliases;
const headings = [...body.matchAll(/<H2>\{("(?:[^"\\]|\\.)*")\}<\/H2>/g)];
for (const heading of headings) {
  const title = JSON.parse(heading[1]);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const ids = Object.entries(aliases)
    .filter(([, target]) => target === slug)
    .map(([id]) => id);
  if (ids.length)
    body = body.replace(heading[0], `<Old ids={${JSON.stringify(ids)}} />\n${heading[0]}`);
}
// Add destinations to already-written setup labels without altering learner words.
const setupStart =
  '<Prose>{"To run the examples, download the bundle and keep its directory structure.';
if (!body.includes(setupStart)) throw new Error('Setup link anchor changed');
body = body.replace(
  setupStart,
  '<Prose>{"To run the examples, "}<a href="/learn-code/rl-reasoning/rl-reasoning.zip" download>{"download the bundle"}</a>{" and keep its directory structure.',
);
body = body.replaceAll(
  '<code>{"README.md"}</code>',
  '<a href="/learn-code/rl-reasoning/README.md"><code>{"README.md"}</code></a>',
);

const source = `// Deterministic projection of the frozen complete reasoning manuscript.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { ReasoningScroll, ReasoningTable as NeuralTable, ${names.join(', ')} } from '../../components/lesson-labs/ReasoningFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => <ReasoningScroll label="Mathematical expression"><SharedMathBlock>{children}</SharedMathBlock></ReasoningScroll>;
const Program = ({ file }) => <RemoteCodeBlock source={'/learn-code/rl-reasoning/' + file} language="python" title={file} filename={file} />;
const Old = ({ ids }) => ids.map(id => <span key={id} id={id} aria-hidden="true" />);
function FileIndex() {
  const files = ${JSON.stringify([...programs, 'README.md', 'requirements.txt', 'model-source-report.json', 'data/source.json', 'data/gsm8k-slice.json', 'data/GSM8K-LICENSE.txt', 'observations.json', 'download-manifest.json'])};
  return <details className="reasoning-file-index"><summary>Complete program, data and recorded-result files</summary>
    <p><a href="/learn-code/rl-reasoning/rl-reasoning.zip" download>Download the complete bundle</a></p>
    <ul>{files.map(file => <li key={file}><a href={'/learn-code/rl-reasoning/' + file}>{file}</a></li>)}</ul>
  </details>;
}
function ReasoningLesson() { return <div className="lesson-flow reasoning-flow">${body}</div>; }
export default {
  title: 'RL for Reasoning (DeepSeek-R1-style)',
  slug: 'rl-for-reasoning-deepseek-r1-style',
  readTime: '~70 min read + 100 min practice',
  content: ReasoningLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
const rendered = await format(source, {
  parser: 'babel',
  plugins: [babel, estree],
  singleQuote: true,
  printWidth: 100,
});
fs.writeFileSync(`${directory}/lesson.jsx`, rendered);
fs.writeFileSync(
  `${directory}/renderer-receipt.json`,
  JSON.stringify(
    {
      manuscript: expected,
      renderer: hash(fs.readFileSync('scripts/render-rl-reasoning-lesson.mjs')),
      generated: hash(rendered),
      figures: names.length,
      programs: programs.length,
      practice: tasks.length,
      aliases: Object.keys(aliases).length,
      normalization:
        'No manuscript edits; marker projection, authored practice disclosures and links on existing setup labels.',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    manuscript: expected,
    generated: hash(rendered),
    figures: names.length,
    programs: programs.length,
    practice: tasks.length,
  }),
);
