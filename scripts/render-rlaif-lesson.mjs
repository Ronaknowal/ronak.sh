import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const directory = 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const expected = 'f5f32e015a72a9b5ea212f707a1613b3eee406cad1c5c342f40e095654a24abf';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
if (hash(manuscript) !== expected) throw new Error('Accepted manuscript changed');
const names = [
  'FeedbackObjectiveAxes', 'FullComparisonRecord', 'CompiledJudgePrompt',
  'ConditionalOptionMass', 'MappedOrderWires', 'LabelValidityRows',
  'SoftTargetTransforms', 'RewardHeadWiring', 'SoftBCELossGradient',
  'DistilledDirectRoutes', 'RatingDistributionMap', 'FinitePolicyScoreVectors',
  'SnapshotTimeline', 'AlignedGatherMatrix', 'SumMeanTokenScores', 'CausalTargetMask',
  'RelativeGainCoordinates', 'IPOAndDPOCoordinates', 'ContradictoryPreferenceCounts',
  'FourActionPreferenceMatrix', 'PreferenceTransformTilt', 'MissingSupportSimplex',
  'GeometricTokenPool', 'OddsContrast', 'SharedWeightGradients',
  'TinyCausalArchitecture', 'SharedWarmStartFork', 'TrainerTargetMasks',
  'NativeExplicitBridge', 'RealFeedbackPair', 'ActualTrainingTrajectories',
  'PairedHeldoutOutcomes', 'MetricLineage', 'CountedModelWork',
  'ControlledComparisonMatrix',
];
const programs = [
  'judge_labels.py', 'feedback_learning.py', 'rlaif_loop.py', 'records_and_masks.py',
  'finite_preferences.py', 'preference_losses.py', 'compare_training.py',
  'trl_methods.py', 'run_all.py',
];
const replacements = names.map((name, i) => [
  `<!-- D${String(i + 1).padStart(2, '0')} ${name}:`, `<${name} />`,
]);
replacements.push(...programs.map(file => [`<!-- PROGRAM ${file}:`, `<Program file="${file}" />`]));
const options = { assetBase: '/learn/examples/rlaif-methods/', replacements, opening: [
  ['A comparison can change', 'summary'], ['The small experiments', 'route'], ['Prerequisites:', 'prerequisites'],
] };
const normalized = manuscript.replaceAll('\r\n', '\n').replace(/^\$\$$/gm, '\\[');
// Display-equation delimiters alternate opening and closing. The shared authoring
// renderer accepts \[ ... \], not $$; mathematical bodies remain exact.
let open = false;
const prepared = normalized.split('\n').map(line => {
  if (line !== '\\[') return line;
  open = !open;
  return open ? '\\[' : '\\]';
}).join('\n');
if (open) throw new Error('Unclosed equation');
const [main, tail] = prepared.split('## 13. Try the mechanism on new inputs');
const [practice, endings] = tail.split('## 14. Continue learning and inspect the technical sources');
let body = renderPreparedLesson(main, options).jsx;
body += '<Old ids={["11-self-check-exercises"]} /><H2>{"13. Try the mechanism on new inputs"}</H2>\n';
const exercises = practice.split(/(?=^### \d+\. )/m);
body += renderPreparedLesson(exercises.shift()).jsx;
for (const exercise of exercises) {
  const [question, remainder] = exercise.split('**Hint:**');
  const [hint, solution] = remainder.split('**Solution:**');
  if (!question || !hint || !solution) throw new Error('Incomplete practice');
  body += `<section className="rf-practice" data-lesson-exercise>${renderPreparedLesson(question).jsx}<details><summary>Hint</summary>${renderPreparedLesson(hint).jsx}</details><details><summary>Worked solution</summary>${renderPreparedLesson(solution).jsx}</details></section>\n`;
}
// Join only wrapped reference bullet paragraphs before the shared renderer.
// Link titles and annotations span source lines; no scientific prose is removed.
const joinedEndings = endings.replace(/\n {2}(\S[^\n]*)/g, ' $1');
body += renderPreparedLesson(`## 14. Continue learning and inspect the technical sources${joinedEndings}`, { assetBase: '/learn/examples/rlaif-methods/' }).jsx;
const aliases = [
  ['1. Separate', ['1-why-it-exists', '1-start-with-the-problem']],
  ['2. Trace', ['2-core-intuition', '2-build-the-intuition']],
  ['3. Learn', ['3-mathematical-foundation', '3-make-the-idea-precise']],
  ['5. Score', ['4-from-scratch-implementation']],
  ['10. Make', ['5-production-implementation']],
  ['4. Compare', ['6-visual-walkthrough']],
  ['12. Choose', ['7-decision-matrix', '8-what-scales-and-what-doesn-t', '9-failure-modes-and-gotchas']],
  ['14. Continue', ['10-primary-sources']],
];
for (const [prefix, ids] of aliases) {
  const anchor = `<H2>{"${prefix}`;
  if (!body.includes(anchor)) throw new Error(`Missing alias destination ${prefix}`);
  body = body.replace(anchor, `<Old ids={${JSON.stringify(ids)}} />\n${anchor}`);
}
// Make the archive and already-authored supporting filenames usable. Registry
// index remains shared: no custom topic download toolbar or inventory component.
for (const file of ['README.md', 'requirements.txt', 'study-protocol.md']) {
  const original = `<code>{"${file}"}</code>`;
  body = body.replaceAll(original, `<a href="/learn/examples/rlaif-methods/${file}">${original}</a>`);
}
const source = `// Static projection of the complete independently accepted manuscript.
import { Prose, H2, H3, CodeBlock } from '../../../../src/learn/components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { useCodeDownload } from '../../../../src/learn/components/content/LessonCodeDownloads.jsx';
import { RLAIFScroll, RLAIFTable as NeuralTable,
${names.map(name => `  ${name},`).join('\n')}
} from '../../../../src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => <RLAIFScroll className="rf-math" label="Mathematical expression; scroll horizontally if needed"><SharedMathBlock>{children}</SharedMathBlock></RLAIFScroll>;
const Program = ({ file }) => <RemoteCodeBlock source={'/learn/examples/rlaif-methods/' + file} language="python" title={file} filename={file} />;
const Old = ({ ids }) => ids.map(id => <span key={id} id={id} aria-hidden="true" />);
const supporting = ${JSON.stringify(JSON.parse(fs.readFileSync('public/learn/examples/rlaif-methods/download-manifest.json', 'utf8')).files.map(file => file.path).filter(file => !programs.includes(file)))};
function SupportingFile({ file }) {
  useCodeDownload({ filename: file.split('/').at(-1), kind: 'asset', downloadUrl: '/learn/examples/rlaif-methods/' + file, title: file });
  return null;
}
function RLAIFLesson() {
  return <div className="lesson-flow rlaif-flow">{supporting.map(file => <SupportingFile key={file} file={file} />)}${body}</div>;
}
export default {
  title: 'RLAIF, IPO, ORPO & Emerging Alignment Methods',
  slug: 'rlaif-ipo-orpo-emerging-alignment-methods',
  readTime: '~70 min read + 100 min practice',
  content: RLAIFLesson,
};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
const formatted = await format(source, { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 });
fs.writeFileSync(`${directory}/lesson.jsx`, formatted);
fs.writeFileSync(`${directory}/runtime-projection.json`, JSON.stringify({ manuscript: expected, renderer: hash(formatted), figures: names.length, programs: programs.length, practices: exercises.length, mathematicalBodies: (manuscript.match(/^\$\$$/gm) || []).length / 2, historicalAliases: aliases.flatMap(([, ids]) => ids) }, null, 2) + '\n');
console.log(JSON.stringify({ manuscript: expected, renderer: hash(formatted), figures: names.length, programs: programs.length, practices: exercises.length }));
