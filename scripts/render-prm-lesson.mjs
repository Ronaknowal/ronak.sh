import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const directory = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = '45f67a7d6aecae4575fdc90d76efae890db4dcfe4f82e91e4cc2e9e673153a58';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
if (hash(manuscript) !== expected) throw new Error('Frozen PRM manuscript changed');
const names = [
  'AlgebraTrajectories', 'TaskGeometry', 'LabelSemantics', 'BranchAnnotation',
  'BoundaryAnatomy', 'VisibilityAndTargets', 'ReductionDenominator', 'StepLoss',
  'GradientRoutes', 'NeutralSimplex', 'RealCorpusStructure', 'LearnedFeatureMap',
  'StudyResults', 'HeldoutInspector', 'AggregationGeometry', 'CandidateForest',
  'EvaluationDenominators', 'CoverageAndAbstention', 'CompletionTree',
  'EstimatorSampling', 'ConsensusAddresses', 'BeamTree', 'VisitTree',
  'ValueAdvantageGeometry', 'ProverContrast', 'PolicyCredit', 'RewardTelescoping',
  'WorkLedger', 'ProxyFailure',
];
const replacements = names.map((name, index) => [
  `<!-- D${String(index + 1).padStart(2, '0')} ${name}:`, `<PRM${name} />`,
]);
const programs = ['records', 'transformers', 'contracts', 'classifier', 'torch', 'search', 'rollouts_rewards'];
replacements.push(...programs.map(name => [`<!-- PROGRAM prm_${name}.py:`, `<Program file="prm_${name}.py" />`]));
const options = { replacements, assetBase: '/learn-code/process-reward-models/', opening: [
  ['Follow one algebraic solution', 'summary'], ['You can follow sections', 'route'], ['Prerequisites:', 'prerequisites'],
] };
const [main, practiceAndEnd] = manuscript.split('## 13. Practice and resources');
const [practice, endings] = practiceAndEnd.split('### Further learning: inspect another route');
let body = renderPreparedLesson(main, options).jsx;
body += '\n<Old ids={["11-self-check-exercises"]} />\n<H2>{"13. Practice and resources"}</H2>\n';
const chunks = practice.split(/(?=^### \d+\. )/m);
body += renderPreparedLesson(chunks.shift()).jsx;
for (const chunk of chunks) {
  const [question, rest] = chunk.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  body += `<section className="prm-practice" data-lesson-exercise>\n${renderPreparedLesson(question).jsx}\n`;
  body += `<details><summary>Hint</summary>${renderPreparedLesson(hint).jsx}</details>\n`;
  body += `<details><summary>Worked solution</summary>${renderPreparedLesson(solution).jsx}</details>\n</section>\n`;
}
// This manuscript has nine multi-line reference list items. Keep each full
// description inside its list item; the shared renderer otherwise starts a new
// paragraph for the two-space continuation. Restrict normalization to this
// exact reference section, so code, equations and other prose stay untouched.
const referencesStart = endings.indexOf('### Technical references');
const referencesEnd = endings.indexOf('### Readiness and the next question');
if (referencesStart < 0 || referencesEnd < referencesStart) throw new Error('Missing reference section');
const references = endings.slice(referencesStart, referencesEnd);
if ((references.match(/^- /gm) || []).length !== 9) throw new Error('Expected nine references');
const joinedReferences = references.replace(/\r?\n {2}(\S[^\r\n]*)/g, ' $1');
const normalizedEndings = endings.slice(0, referencesStart) + joinedReferences + endings.slice(referencesEnd);
body += renderPreparedLesson(`### Further learning: inspect another route${normalizedEndings}`).jsx;
body = body.replace(/<CodeBlock language=\{"math"\}>([\s\S]*?)<\/CodeBlock>/g, '<MathBlock>$1</MathBlock>');
const aliases = [
  ['1. A correct', ['1-why-it-exists', '1-start-with-the-problem']],
  ['2. Choose', ['2-core-intuition', '2-build-the-intuition']],
  ['3. Put', ['3-mathematical-foundation', '3-make-the-idea-precise']],
  ['4. Learn', ['4-from-scratch-implementation']],
  ['5. Fit', ['5-production-implementation']],
  ['6. Turn', ['6-visual-walkthrough']],
  ['7. Rank', ['7-decision-matrix']],
  ['12. Budget', ['8-what-scales-and-what-doesn-t', '9-failure-modes-and-gotchas']],
];
for (const [prefix, ids] of aliases) {
  const anchor = `<H2>{"${prefix}`;
  if (!body.includes(anchor)) throw new Error(`Missing alias destination ${prefix}`);
  body = body.replace(anchor, `<Old ids={${JSON.stringify(ids)}} />\n${anchor}`);
}
body = body.replace('<H3>{"Technical references"}</H3>', '<Old ids={["10-primary-sources"]} />\n<H3>{"Technical references"}</H3>');
// Make the already-authored download/file references usable; text is unchanged.
body = body.replace('<strong>{"prm-programs-data.zip"}</strong>', '<a href="/learn-code/process-reward-models/prm-programs-data.zip" download><strong>{"prm-programs-data.zip"}</strong></a>');
body = body.replace('<code>{"README.md"}</code>', '<a href="/learn-code/process-reward-models/README.md"><code>{"README.md"}</code></a>');
body = body.replace('<code>{"PRM800K-LICENSE.txt"}</code>', '<a href="/learn-code/process-reward-models/PRM800K-LICENSE.txt"><code>{"PRM800K-LICENSE.txt"}</code></a>');
const fileIndexAnchor = '<Program file="prm_records.py" />';
body = body.replace(fileIndexAnchor, `${fileIndexAnchor}\n<FileIndex />`);
const source = `// Deterministic projection of the accepted PRM manuscript; prose is not rewritten here.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { PRMTable as NeuralTable, PRMScroll,
${names.map(name => `  PRM${name},`).join('\n')}
} from '../../components/lesson-labs/PRMFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <PRMScroll label="Mathematical expression; scroll horizontally if needed">
    <SharedMathBlock>{children}</SharedMathBlock>
  </PRMScroll>
);
const Program = ({ file }) => <RemoteCodeBlock source={'/learn-code/process-reward-models/' + file} language="python" title={file} filename={file} />;
const Old = ({ ids }) => ids.map(id => <span key={id} id={id} aria-hidden="true" />);
function FileIndex() {
  const files = ${JSON.stringify([...programs.map(name => `prm_${name}.py`), 'README.md', 'requirements.txt', 'study-protocol.md', 'PRM800K-LICENSE.txt', 'sources/provenance.json', 'sources/phase2_train.jsonl.prefix', 'sources/phase2_test.jsonl.prefix', 'data/extraction.json', 'data/train.jsonl', 'data/validation.jsonl', 'data/test.jsonl', 'study/model.json', 'study/predictions.json', 'study/results.json', 'study/prospective-inputs.json', 'download-manifest.json'])};
  return <details className="prm-file-index"><summary>Program, data and retained-result file index</summary><ul>{files.map(file => <li key={file}><a href={'/learn-code/process-reward-models/' + file}>{file}</a></li>)}</ul></details>;
}
function PRMLesson() {
  return <div className="lesson-flow prm-flow">
${body}
  </div>;
}
export default {
  title: 'Process Reward Models (PRM) vs Outcome Reward Models (ORM)',
  slug: 'process-reward-models-prm-vs-outcome-reward-models-orm',
  readTime: '~65 min read + 100 min practice',
  content: PRMLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
const formatted = await format(source, { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 });
fs.writeFileSync(`${directory}/lesson.jsx`, formatted);
console.log(JSON.stringify({ manuscript: expected, runtime: hash(formatted), figures: names.length, programs: programs.length, practices: chunks.length }));
