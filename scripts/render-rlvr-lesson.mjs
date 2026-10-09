// Build-time projection only: the reader receives static JSX, not Markdown.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { applyEndingLayout } from './lib/lesson-ending-layout.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const directory =
  'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const expected = '9fd18164440f0b422df6e86c6336714d162eff83d9f437c56a0bcc3fb3a5fd9c';
if (hash(manuscript) !== expected) throw new Error('Accepted manuscript changed');
const core = [
  'FullTaskAndVerdict',
  'FeedbackAndUpdateAxes',
  'ExtractionSpanAnatomy',
  'VerifierOutcomeMatrix',
  'FiniteTestsAndCounterexample',
  'ProofDerivationTree',
  'ResponseProbabilitySimplex',
  'CausalSampleAndGather',
  'GroupSamplingTree',
  'CenteredAndScaledContributions',
  'BaselineEnumeration',
  'PolicySnapshotAddresses',
  'SignedClipGeometry',
  'TokenReductionGeometry',
  'ExactFiniteKL',
  'SampledK3AndGradientRoutes',
  'AnySuccessVersusMixedGroup',
  'SupportAndEntropy',
  'PromptSelectionAndContrast',
  'VerifiedSelectionLineage',
  'AcceptanceConfusionMatrix',
  'AffineRewardCorrection',
  'CorrelatedTestOutcomeGrid',
  'SpecificationCounterexampleTrace',
  'ReasoningAnswerJointMass',
  'AnswerAndReasoningEvaluation',
];
const study = [
  'SelectedCorpusContext',
  'TinyCausalModelAnatomy',
  'GeneratedGroupAndMasks',
  'RolloutReuseAndUpdate',
  'SharedWarmStartAndArms',
  'ActualRewardAndContrastHistory',
  'HeldoutResponseInspector',
  'PretrainedToolOutputs',
  'NativeTrainerContract',
  'PassAtKSamplingGeometry',
  'PaperProtocolComparison',
  'WorkAndMetricLedger',
  'ControlledUseDecision',
];
const programs = [
  'math_verify_bridge.py',
  'verifier_contracts.py',
  'group_gradients.py',
  'reward_noise.py',
  'causal_backbone.py',
  'rlvr_data.py',
  'tiny_causal_rlvr.py',
  'evaluate_rollouts.py',
  'hf_eval_math.py',
  'trl_bridge.py',
  'adamw_step_audit.py',
  'scientific_journal.py',
  'run_all.py',
];
const replacements = [...core, ...study].map((name, i) => [
  `<!-- D${String(i + 1).padStart(2, '0')} ${name}:`,
  `<${name} />`,
]);
replacements.push(
  ...programs.map((file) => [`<!-- CODE ${file} -->`, `<Program file="${file}" />`]),
);
// Convert mathematical delimiters outside fenced programs only. The mathematical
// bodies and code strings are conserved; shared renderer takes \(...\)/\[...\].
let fence = false,
  display = false;
const prepared = manuscript
  .replaceAll('\r\n', '\n')
  .split('\n')
  .map((line) => {
    if (line.startsWith('```')) {
      fence = !fence;
      return line;
    }
    if (fence) return line;
    if (line === '$$') {
      display = !display;
      return display ? '\\[' : '\\]';
    }
    if (display) return line;
    return line.replace(/\$([^$\n]+)\$/g, (_, body) => `\\(${body}\\)`);
  })
  .join('\n')
  .replace(/^(<!-- CODE [^\n]+-->)$/gm, '$1\n');
if (fence || display) throw new Error('Unclosed code or equation');
const [main, tail] = prepared.split('## 16. Transfer the contract to new cases');
const [practice, endings] = tail.split('## Summary');
let body = renderPreparedLesson(main, {
  assetBase: '/learn/examples/rlvr/',
  replacements,
  opening: [
    ['A model writes an answer.', 'summary'],
    ['Useful prerequisites are', 'prerequisites'],
    ['For a first pass,', 'route'],
  ],
}).jsx;
body +=
  '<Old ids={["11-self-check-exercises"]}/><H2>{"16. Transfer the contract to new cases"}</H2>\n';
const exercises = practice.split(/(?=^### \d+\. )/m);
body += renderPreparedLesson(exercises.shift()).jsx;
for (const exercise of exercises) {
  const [question, rest] = exercise.split('**Hint.**');
  const [hint, solution] = rest.split('**Worked solution.**');
  if (!question || !hint || !solution) throw new Error('Incomplete exercise');
  body += `<section className="rlvr-practice" data-lesson-exercise>${renderPreparedLesson(question).jsx}<details><summary>Hint</summary>${renderPreparedLesson(hint).jsx}</details><details><summary>Worked solution</summary>${renderPreparedLesson(solution).jsx}</details></section>\n`;
}
body += renderPreparedLesson('## Summary' + endings.replace(/\n {2}(\S[^\n]*)/g, ' $1'), {
  assetBase: '/learn/examples/rlvr/',
}).jsx;
const aliases = [
  ['1. Decide', ['1-why-it-exists', '1-start-with-the-problem']],
  ['2. Parse', ['2-core-intuition', '2-build-the-intuition']],
  ['3. Check', ['3-mathematical-foundation', '3-make-the-idea-precise']],
  ['12. Build', ['4-from-scratch-implementation']],
  ['14. Use', ['5-production-implementation']],
  ['4. Turn', ['6-visual-walkthrough']],
  ['15. Count', ['7-decision-matrix', '8-what-scales-and-what-doesn-t']],
  ['10. Inspect', ['9-failure-modes-and-gotchas']],
  ['Technical references', ['10-primary-sources']],
];
for (const [prefix, ids] of aliases) {
  const anchor = `<H2>{"${prefix}`;
  if (!body.includes(anchor)) throw new Error(`Missing alias ${prefix}`);
  body = body.replace(anchor, `<Old ids={${JSON.stringify(ids)}}/>\n${anchor}`);
}
for (const file of [
  'README.md',
  'FILES.md',
  'requirements.txt',
  'protocol.json',
  'study-protocol.md',
]) {
  const token = `<code>{"${file}"}</code>`;
  body = body.replaceAll(token, `<a href="/learn/examples/rlvr/${file}">${token}</a>`);
}
const supporting = [
  ...Object.keys(
    JSON.parse(fs.readFileSync('public/learn/examples/rlvr/download-manifest.json', 'utf8'))
      .programs.entries,
  ).filter((file) => !programs.includes(file)),
  'rlvr-programs.zip',
  'rlvr-observations.zip',
  'download-manifest.json',
];
let source = `import { Prose, H2, H3, CodeBlock } from '../../../../src/learn/components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { useCodeDownload } from '../../../../src/learn/components/content/LessonCodeDownloads.jsx';
import { RLVRScroll, RLVRTable as NeuralTable } from '../../../../src/learn/components/lesson-labs/RLVRFlow.jsx';
import { ${core.join(', ')} } from '../../../../src/learn/components/lesson-labs/RLVRCoreFigures.jsx';
import { ${study.join(', ')} } from '../../../../src/learn/components/lesson-labs/RLVRStudyFigures.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock = ({children}) => <RLVRScroll className="rlvr-equation" label="Mathematical expression; scroll horizontally if needed"><SharedMathBlock>{children}</SharedMathBlock></RLVRScroll>;
const Program = ({file}) => <RemoteCodeBlock source={'/learn/examples/rlvr/'+file} filename={file} title={file} language="python"/>;
const Old = ({ids}) => ids.map(id=><span key={id} id={id} aria-hidden="true"/>);
function SupportingFile({file}) { useCodeDownload({filename:file.split('/').at(-1),kind:'asset',downloadUrl:'/learn/examples/rlvr/'+file,title:file}); return null; }
function RLVRLesson() { return <div className="lesson-flow rlvr-flow">{${JSON.stringify(supporting)}.map(file=><SupportingFile key={file} file={file}/>)}${body}</div>; }
export default {title:'RLVR (Reinforcement Learning with Verifiable Rewards)',slug:'rlvr-reinforcement-learning-with-verifiable-rewards',readTime:'~95 min read + 120 min practice',content:RLVRLesson};
`;
source = applyEndingLayout(source, [
  { level: 'H2', title: '16. Transfer the contract to new cases', kind: 'practice' },
  { level: 'H2', title: 'Further reading', kind: 'further-learning', resourceList: true },
  { level: 'H2', title: 'Technical references', kind: 'references', resourceList: true },
  { level: 'H2', title: 'Keep going', kind: 'next' },
]);
parse(source, { sourceType: 'module', plugins: ['jsx'] });
source = await format(source, {
  parser: 'babel',
  plugins: [babel, estree],
  singleQuote: true,
  printWidth: 100,
});
fs.writeFileSync(`${directory}/lesson.jsx`, source);
fs.writeFileSync(
  `${directory}/runtime-projection.json`,
  JSON.stringify(
    {
      manuscript: expected,
      renderer: hash(source),
      figures: 39,
      programs: 13,
      practices: exercises.length,
      historicalAliases: aliases.flatMap(([, ids]) => ids),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    renderer: hash(source),
    figures: 39,
    programs: 13,
    practices: exercises.length,
  }),
);
