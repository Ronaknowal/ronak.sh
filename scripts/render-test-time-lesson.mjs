import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
const folder = 'docs/teaching/llm-architecture-training/test-time-compute-scaling';
const sha = (value) => createHash('sha256').update(value).digest('hex');
const manuscript = fs.readFileSync(`${folder}/lesson.md`, 'utf8');
assert.equal(sha(manuscript), '11bc7f818e60efd9859425381a9650eaf5566f71701d4a9f72ca46cd029cebaa');
const groups = {
  Selection: [
    'CandidateBoundary',
    'WorkTimeline',
    'ComputeLedger',
    'Opportunity',
    'ScoreSelection',
    'AnswerGroups',
    'VoteDistribution',
    'RiskMatrix',
  ],
  Search: ['SearchTree', 'SearchWork', 'Revisions', 'HybridSchedule', 'BudgetController'],
  Evidence: ['CandidateInspector', 'OutcomeGrid', 'ObservedCost'],
  Allocation: ['BudgetFrontier', 'AllocationInformation', 'AmortizedWork', 'ProviderFields'],
};
const programs = [...manuscript.matchAll(/<!-- CODE ([a-z_]+\.py) -->/g)].map((m) => m[1]);
const replacements = [
  ...Object.values(groups)
    .flat()
    .map((name, i) => [`<!-- D${String(i + 1).padStart(2, '0')} `, `<${name}/>`]),
  ...programs.map((file) => [`<!-- CODE ${file}`, `<Program file="${file}"/>`]),
];
function render(text, options = {}) {
  const joined = text
    .replaceAll('\r\n', '\n')
    .replace(/^\$\$(.+)\$\$$/gm, (_, eq) => `\\[\n${eq}\n\\]`)
    .replace(/(<!--[^\n]+-->)/g, '\n$1\n');
  return renderPreparedLesson(joined, {
    assetBase: '/learn/examples/test-time-compute/',
    ...options,
    replacements: replacements.filter(([p]) => joined.includes(p)),
  }).jsx;
}
const [main, tail] = manuscript.split('## 15. Practice');
const [practice, ending] = tail.split('## Summary');
const exercises = practice.split(/(?=^### \d+\. )/m);
let body =
  '<section>\n' +
  render(main, {
    opening: [
      ['**Useful prerequisites:**', 'prerequisites'],
      ['**First pass:**', 'route'],
    ],
  }) +
  '</section>\n';
body +=
  '<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"15. Practice"}</H2>\n' +
  render(exercises.shift());
for (const exercise of exercises) {
  const [question, rest] = exercise.split('**Hint:**'),
    [hint, solution] = rest.split('**Solution:**');
  assert.ok(solution);
  body += `<section className="ttc-practice" data-lesson-exercise>${render(question)}<details><summary>Hint</summary>${render(hint)}</details><details><summary>Worked solution</summary>${render(solution)}</details></section>\n`;
}
assert.equal(exercises.length, 16);
body += '</section>\n<section>' + render('## Summary' + ending);
for (const [heading, kind] of [
  ['Further learning', 'further-learning'],
  ['Technical references', 'references'],
  ['Readiness check', 'next'],
  ['Program files', 'resources'],
])
  body = body.replace(
    `<H2>{${JSON.stringify(heading)}}</H2>`,
    `</section><section className="lesson-ending lesson-ending--${kind}" data-lesson-ending="${kind}"><H2>{${JSON.stringify(heading)}}</H2>`,
  );
body += '</section>';
const aliases = [
  ['1. Spend work before choosing an answer', ['1-why-it-exists', '1-start-with-the-problem']],
  ['3. A correct candidate is an opportunity', ['2-core-intuition', '2-build-the-intuition']],
  [
    '6. Decide what agreement should mean',
    ['3-mathematical-foundation', '3-make-the-idea-precise'],
  ],
  ['4. Select with an imperfect score', ['4-from-scratch-implementation']],
  ['14. Use provider budget controls deliberately', ['5-production-implementation']],
  ['10. Run a fixed-model experiment', ['6-visual-walkthrough']],
  ['12. Allocate the next unit of work', ['7-decision-matrix']],
  ['13. Larger weights or more inference calls', ['8-what-scales-and-what-doesn-t']],
  ['11. Read the metric before the curve', ['9-failure-modes-and-gotchas']],
  ['Technical references', ['10-primary-sources']],
  ['15. Practice', ['11-self-check-exercises']],
];
for (const [heading, ids] of aliases) {
  const anchor = `<H2>{${JSON.stringify(heading)}}</H2>`;
  assert.ok(body.includes(anchor));
  body = body.replace(
    anchor,
    ids.map((id) => `<span id="${id}" aria-hidden="true"/>`).join('') + anchor,
  );
}
const source = `// Prepared accepted content rendered by scripts/render-test-time-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../../../src/learn/components/content';
import { Math as InlineMath, MathBlock } from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../../../src/learn/components/lesson-labs/TestTimeShared.jsx';
${Object.entries(groups)
  .map(
    ([group, names]) =>
      `import { ${names.join(', ')} } from '../../../../src/learn/components/lesson-labs/TestTime${group}.jsx';`,
  )
  .join('\n')}
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
function Program({ file }) { return <RemoteCodeBlock source={'/learn/examples/test-time-compute/' + file} language="python" title={file} filename={file}/>; }
function TestTimeLesson() { return <div className="lesson-flow ttc-flow">${body}</div>; }
export default { title: 'Test-Time Compute Scaling', slug: 'test-time-compute-scaling', readTime: '~70 min read + 80 min practice', content: TestTimeLesson };
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
assert.ok(!source.includes('<!--'));
fs.writeFileSync(`${folder}/lesson.jsx`, source);
fs.writeFileSync(
  `${folder}/runtime-compatibility.json`,
  JSON.stringify(
    {
      manuscript: sha(manuscript),
      runtime: sha(source),
      figures: Object.values(groups).flat(),
      programs,
      practices: exercises.length,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({ figures: 20, programs: programs.length, practices: 16, runtime: sha(source) }),
);
