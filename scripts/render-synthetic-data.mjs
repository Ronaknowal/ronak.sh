import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const id = 'synthetic-data-generation-for-pre-training';
const folder = `docs/teaching/llm-architecture-training/${id}`;
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const accepted = JSON.parse(fs.readFileSync(`${folder}/content-acceptance.json`));
for (const [file, expected] of Object.entries(accepted.bindings)) assert.equal(sha(file), expected, file);
let manuscript = fs.readFileSync(`${folder}/lesson.md`, 'utf8').replaceAll('\r\n', '\n');
// These are display transformations only; the accepted manuscript is immutable.
manuscript = manuscript.replace(/(<!--[^\n]+-->)(\n)(?!\n)/g, '$1\n\n');
manuscript = manuscript.replace(/(\d), (\d{3})(?!\d)/g, '$1,$2');
let practices = 0;
manuscript = manuscript.replace(/(### [A-L]\. [^\n]+\n)([\s\S]*?)(?=\n### |\n## )/g, (_, heading, block) => {
  const parts = block.split(/\*\*Hint:\*\*|\*\*Solution:\*\*/);
  assert.equal(parts.length, 3, heading);
  practices++;
  return `${heading}${parts[0]}\n<details>\n<summary>Hint</summary>\n\n${parts[1].trim()}\n\n</details>\n\n<details>\n<summary>Worked solution</summary>\n\n${parts[2].trim()}\n\n</details>\n`;
});
assert.equal(practices, 12);
const placements = [...manuscript.matchAll(/^<!-- (S\d\d):[^\n]+-->/gm)];
const programs = [...manuscript.matchAll(/^<!-- PROGRAM ([^:]+):[^\n]+-->/gm)];
assert.equal(placements.length, 22);
assert.equal(programs.length, 7);
const { jsx, sections } = renderPreparedLesson(manuscript, {
  assetBase: '/learn-code/synthetic-data/',
  replacements: [
    ...placements.map(m => [m[0], `<SyntheticFigure id="${m[1]}" />`]),
    ...programs.map(m => [m[0], `<Program file="${m[1]}" />`]),
  ],
  opening: [['Follow a paragraph', 'summary'], ['First pass:', 'route'], ['Prerequisites:', 'prerequisites']],
  endings: [
    { level: 'H2', title: '12. Practice with changed inputs', kind: 'practice' },
    { level: 'H2', title: 'Further learning', kind: 'further-learning', resourceList: true },
    { level: 'H2', title: 'Technical references', kind: 'references' },
    { level: 'H2', title: 'Readiness and the next question', kind: 'next' },
  ],
});
const legacy = {
  1: ['1-why-it-exists'], 2: ['2-core-intuition'], 3: ['3-mathematical-foundation', '4-from-scratch-implementation'],
  5: ['7-decision-matrix'], 6: ['9-failure-modes-gotchas'],
  8: ['5-production-implementation'], 9: ['6-visual-walkthrough'],
  10: ['8-what-scales-and-what-doesn-t'], 12: ['11-self-check-exercises'],
};
let body = jsx;
for (const [number, ids] of Object.entries(legacy)) {
  const heading = sections.find(([, label]) => label.startsWith(`${number}.`))[1];
  const marker = `<H2>{${JSON.stringify(heading)}}</H2>`;
  assert.ok(body.includes(marker));
  body = body.replace(marker, `${ids.map(value => `<span id="${value}" aria-hidden="true" />`).join('\n')}\n${marker}`);
}
body = body.replace('<H2>{"Technical references"}</H2>', '<span id="10-primary-sources" aria-hidden="true" /><H2>{"Technical references"}</H2>');
const source = `// Generated from the accepted complete manuscript by scripts/render-synthetic-data.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock as SharedMath} from '../../components/content/Math.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import SyntheticFigure from '../../components/lesson-labs/SyntheticDataFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock=({children})=><div className="synthetic-equation" role="region" tabIndex={0} aria-label="Synthetic data relationship"><SharedMath>{children}</SharedMath></div>;
const Program=({file})=><RemoteCodeBlock source={\`/learn-code/synthetic-data/\${file}\`} filename={file}/>;
export default {slug:'${id}',title:'Synthetic Data Generation for Pre-Training',readTime:'~75 min read + programs and practice',hasIntegratedGuide:true,content:()=> <div className="lesson-flow synthetic-lesson">${body}</div>};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
const options = { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 };
fs.writeFileSync(`${folder}/lesson.jsx`, await format(source, options));
for (const file of ['src/learn/components/lesson-labs/SyntheticDataFlow.jsx', 'src/learn/data/synthetic-data-models.js']) {
  fs.writeFileSync(file, await format(fs.readFileSync(file, 'utf8'), options));
}
console.log(`${sections.length} sections, ${placements.length} mechanisms, ${programs.length} complete programs, ${practices} solved tasks; frozen content retained`);
