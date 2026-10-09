import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const id = 'data-curation-pipelines-curator-models-quality-filtering';
const folder = `docs/teaching/llm-architecture-training/${id}`;
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const accepted = JSON.parse(fs.readFileSync(`${folder}/content-acceptance.json`));
for (const [file, expected] of Object.entries(accepted.bindings)) assert.equal(sha(file), expected, file);
let manuscript = fs.readFileSync(`${folder}/lesson.md`, 'utf8').replaceAll('\r\n', '\n');
// The shared renderer supports strong emphasis. Preserve these three authored
// term emphases without exposing Markdown delimiters in the reading surface.
for (const term of ['curator model', 'training-only', 'regressor']) manuscript = manuscript.replaceAll(`*${term}*`, `**${term}**`);
// Presentation-only spacing; the frozen scientific manuscript remains intact.
for (const [before, after] of [
  ['readout below', 'readout above'], ['about−.455121', 'about −.455121'],
  ['71:16 teacher', '71: 16 teacher'], ['convention;512', 'convention; 512'],
  ['explanation,−.250806', 'explanation, −.250806'], ['section9.', 'section 9.'],
  ['gradient is[', 'gradient is ['], ['penalty adds[', 'penalty adds ['], ['giving[', 'giving ['],
  ['score order are[', 'score order are ['], ['with scores[', 'with scores ['],
  ['have probabilities[', 'have probabilities ['], ['and labels[', 'and labels ['],
  ['give(.36', 'give (.36'], ['byte lengths[', 'byte lengths ['],
]) manuscript = manuscript.replaceAll(before, after);
manuscript = manuscript.replace('The shared file index gives complete source and Copy/Download controls.', 'Download the [complete program/data bundle](/learn-code/data-curation-pipelines/curation-pipelines.zip), including the two prerequisite helpers, [instructions](/learn-code/data-curation-pipelines/README.md) and saved results. The shared file index gives individual complete source and Copy/Download controls.');
manuscript = manuscript.replace(/\\\[([^\n]*?)\\\]/g, '\\[\n$1\n\\]');
// Preserve the complete authored practice text while selecting the shared hint/solution layout.
manuscript = manuscript.replace(/^(\d+\. \*\*[^\n]+)\n\n\s+Hint: ([^\n]+)\n\n\s+Solution: ([^\n]+)/gm,
  '$1 Hint: $2 **Solution:** $3');
const placements = [...manuscript.matchAll(/^\[(C\d\d) —[^\n]+\]/gm)];
assert.equal(placements.length, 21);
const programs = [...manuscript.matchAll(/^\[Program: ([^\]]+)\]/gm)];
assert.equal(programs.length, 8);
const replacements = [
  ...placements.map(m => [m[0], `<CurationFigure id="${m[1]}" />`]),
  ...programs.map(m => [m[0], `<Program file="${m[1]}" />`]),
];
const { jsx, sections } = renderPreparedLesson(manuscript, {
  assetBase: '/learn-code/data-curation-pipelines/', replacements,
  opening: [
    ['Choose a training document', 'summary'], ['First pass:', 'route'],
    ['Before starting,', 'prerequisites'], ['Program files:', 'exploration'],
  ],
  endings: [
    { level: 'H2', title: '13. Practice with changed records and decisions', kind: 'practice' },
    { level: 'H2', title: '14. Further learning', kind: 'further-learning', resourceList: true },
    { level: 'H2', title: '15. Technical references and reproducibility', kind: 'references' },
    { level: 'H2', title: '16. Readiness and the next question', kind: 'next' },
  ],
});
const legacy = {
  1: ['1-why-it-exists', '1-start-with-the-problem'],
  2: ['2-core-intuition', '2-build-the-intuition'],
  3: ['3-math-foundation', '3-make-the-idea-precise'],
  7: ['4-from-scratch-implementation', '6-visual-walkthrough'],
  9: ['5-production-implementation'],
  11: ['7-decision-matrix', '8-what-scales-and-what-doesn-t'],
  12: ['9-failure-modes-and-gotchas'],
  13: ['11-self-check-exercises'], 15: ['10-primary-sources'],
};
let body = jsx;
for (const [number, ids] of Object.entries(legacy)) {
  const heading = sections.find(([, label]) => label.startsWith(`${number}.`))[1];
  const marker = `<H2>{${JSON.stringify(heading)}}</H2>`;
  assert.ok(body.includes(marker));
  body = body.replace(marker, `${ids.map(value => `<span id="${value}" aria-hidden="true" />`).join('\n')}\n${marker}`);
}
const source = `// Generated from the complete frozen manuscript by scripts/render-curation-pipelines.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock as SharedMath} from '../../components/content/Math.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import CurationFigure from '../../components/lesson-labs/CurationPipelineFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/curation-pipeline-flow.css';
const MathBlock=({children})=><div className="curation-equation" role="region" tabIndex={0} aria-label="Curation relationship"><SharedMath>{children}</SharedMath></div>;
const Program=({file})=><RemoteCodeBlock source={\`/learn-code/data-curation-pipelines/\${file}\`} filename={file}/>;
export default {slug:'${id}',title:'Data Curation Pipelines (Curator Models, Quality Filtering)',readTime:'~75 min read + programs and practice',hasIntegratedGuide:true,content:()=> <div className="lesson-flow curation-lesson">${body}</div>};
`;
parse(source, { sourceType: 'module', plugins: ['jsx'] });
const options = { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 };
fs.writeFileSync(`${folder}/lesson.jsx`, await format(source, options));
for (const file of ['src/learn/components/lesson-labs/CurationPipelineFlow.jsx', 'src/learn/data/curation-pipeline-models.js']) {
  fs.writeFileSync(file, await format(fs.readFileSync(file, 'utf8'), options));
}
console.log(`${sections.length} sections,${placements.length} mechanisms,${programs.length} complete programs; protected published source unchanged`);
