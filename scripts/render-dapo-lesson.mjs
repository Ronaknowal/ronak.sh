import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const directory =
  'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const manuscript = fs.readFileSync(`${directory}/lesson.md`, 'utf8');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const expected = '3dc6e04172979aa56cd1fb25395c39a7807c08306c7c71331c50854aee570e6c';
if (hash(manuscript) !== expected) throw new Error('Frozen DAPO manuscript changed');
if (!fs.existsSync(`${directory}/content-acceptance.json`))
  throw new Error('Root content acceptance required');
const names = [
  'AnswerPaths',
  'RewardToUpdate',
  'FrozenRollout',
  'CausalAddresses',
  'RewardRuler',
  'HomogeneousGroups',
  'SignedClip',
  'ProbabilitySimplex',
  'EntropyChange',
  'NegativeDualClip',
  'RaggedWeights',
  'LossMass',
  'WholeGroupCollector',
  'IdentityJoin',
  'MixedGroupCost',
  'AcceptedMixture',
  'TerminationMasks',
  'LengthBuffer',
  'SoftmaxGradient',
  'MicrobatchCount',
  'RecordMemory',
  'FiniteBatchDebugger',
  'ModelStructure',
  'SavedRolloutLedger',
  'NativeMechanism',
  'NativeParity',
  'ObservedOutcomes',
  'WorkAccounting',
  'IntegerParser',
  'CircleCollision',
  'PaperProgression',
  'RecipeComparison',
  'FailureTrace',
  'MetricDenominators',
  'FullTrace',
  'ComputeBudget',
];
const markers = [...manuscript.matchAll(/<!-- D(\d\d):[\s\S]*?-->/g)];
const programs = [...manuscript.matchAll(/<!-- PROGRAM ([^ ]+) -->/g)].map((match) => match[1]);
if (markers.length !== 36 || programs.length !== 12)
  throw new Error('Incomplete diagram/program projection');
const replacements = markers.map((match) => [match[0], `<${names[Number(match[1]) - 1]} />`]);
replacements.push(
  ...programs.map((file) => [`<!-- PROGRAM ${file} -->`, `<Program file="${file}" />`]),
);
// The frozen manuscript uses dollar math. Adapt delimiters only for the shared
// authoring renderer, leaving code fences and original manuscript bytes intact.
let fence = false;
let display = false;
const compatible = manuscript
  .replaceAll('\r\n', '\n')
  .split('\n')
  .map((line) => {
    if (line.startsWith('```')) {
      fence = !fence;
      return line;
    }
    if (fence) return line;
    const compactDisplay = line.match(/^\$\$(.+)\$\$$/);
    if (compactDisplay) return `\\[\n${compactDisplay[1]}\n\\]`;
    if (line.trim() === '$$') {
      display = !display;
      return display ? '\\[' : '\\]';
    }
    return display ? line : line.replace(/\$([^$]+)\$/g, (_, math) => `\\(${math}\\)`);
  })
  .join('\n')
  .replace(/-->\n(?=<!-- PROGRAM)/g, '-->\n\n');
if (display || fence) throw new Error('Unclosed manuscript delimiter');
const [main, rest] = compatible.split('## Independent practice');
const [practice, ending] = rest.split('## What to carry forward');
const [tasksBody, practiceProgram] = practice.split('<!-- PROGRAM practice_answers.py -->');
if (!practiceProgram?.trim() && practiceProgram === undefined)
  throw new Error('Missing practice program');
let body = renderPreparedLesson(main, {
  replacements: replacements.filter(([marker]) => main.includes(marker)),
  assetBase: '/learn-code/dapo/',
  opening: [['[RLVR](', 'prerequisites']],
}).jsx;
body +=
  '<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"Independent practice"}</H2>';
const tasks = tasksBody.split(/(?=^### P\d+\.)/m);
body += renderPreparedLesson(tasks.shift()).jsx;
for (const task of tasks) {
  const [question, rest] = task.split('**Hint.**');
  const [hint, solution] = rest.split('**Solution.**');
  if (!hint || !solution) throw new Error('Every practice needs hint and solution');
  body += `<section className="dapo-practice lesson-exercise" data-lesson-exercise>${renderPreparedLesson(question).jsx}<details><summary>Hint</summary>${renderPreparedLesson(hint).jsx}</details><details><summary>Worked solution</summary>${renderPreparedLesson(solution).jsx}</details></section>`;
}
body += '<Program file="practice_answers.py" /></section>';
body += renderPreparedLesson(`## What to carry forward${ending}`, {
  replacements: replacements.filter(([marker]) => ending.includes(marker)),
  assetBase: '/learn-code/dapo/',
  endings: [
    { title: 'What to carry forward', level: 'H2', kind: 'next' },
    { title: 'Sources and further study', level: 'H2', kind: 'references' },
    { title: 'Complete program index', level: 'H2', kind: 'resources' },
    { title: 'Ready to explain and extend', level: 'H2', kind: 'next' },
  ],
}).jsx;
const aliases = JSON.parse(
  fs.readFileSync(`${directory}/heading-compatibility.json`, 'utf8'),
).aliases;
for (const [id, title] of Object.entries(aliases)) {
  const heading = `<H2>{${JSON.stringify(title)}}</H2>`;
  if (!body.includes(heading)) throw new Error(`Missing heading for alias ${id}`);
  body = body.replace(heading, `<span id=${JSON.stringify(id)} aria-hidden="true" />${heading}`);
}
const source = `// Deterministic projection of the accepted DAPO manuscript.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Local, Table as DapoTable } from '../../components/lesson-labs/DapoElements.jsx';
import { DapoEvidenceProvider, ${names.join(', ')} } from '../../components/lesson-labs/DapoFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock=({children})=><Local label="Mathematical relationship"><SharedMathBlock>{children}</SharedMathBlock></Local>;
const NeuralTable=({headers,rows,...props})=><DapoTable headers={headers} rows={rows} label={props.caption??'Comparison'} />;
const Program=({file})=><RemoteCodeBlock source={'/learn-code/dapo/'+file} filename={file} title={file} language="python" />;
function DapoLesson(){return <DapoEvidenceProvider><div className="lesson-flow dapo-flow">${body}</div></DapoEvidenceProvider>;}
export default {title:'DAPO: Decoupled Clip and Dynamic sAmpling Policy Optimization',readTime:'~90 min read + programs and practice',content:DapoLesson};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
const formatted = await format(source, {
  parser: 'babel',
  plugins: [babel, estree],
  singleQuote: true,
  printWidth: 100,
});
fs.writeFileSync(`${directory}/lesson.jsx`, formatted);
fs.writeFileSync(
  `${directory}/renderer-receipt.json`,
  JSON.stringify(
    {
      manuscript: expected,
      generated: hash(formatted),
      renderer: hash(fs.readFileSync('scripts/render-dapo-lesson.mjs')),
      figures: names.length,
      programs,
      practice: tasks.length,
      aliases: Object.keys(aliases).length,
      boundary:
        'Projection only; manuscript unchanged; complete source readers and solved practice preserved.',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    figures: names.length,
    programs: programs.length,
    practice: tasks.length,
    generated: hash(formatted),
  }),
);
