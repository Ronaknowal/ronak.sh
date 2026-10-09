import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './lib/prepared-lesson-renderer.mjs';
import { headingId } from '../src/learn/components/lesson-navigation.js';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';

const folder = 'docs/teaching/llm-architecture-training/inference-engines-serving';
const sourcePath = `${folder}/lesson.md`;
const raw = fs.readFileSync(sourcePath, 'utf8');
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const expected = 'a664f7422de34f3c38ac6a46e969363803961eabc32469de021ad0d6bc60e248';
if (sha(raw) !== expected) throw Error('Accepted manuscript differs');
if (!fs.existsSync(`${folder}/content-release-root.json`)) throw Error('Content release required');
let compatible = raw.replaceAll('\r\n', '\n');
const figures = [...compatible.matchAll(/<!-- (D\d\d): [^\n]+ -->/g)];
const programs = [...compatible.matchAll(/<!-- Program: ([^\n]+) -->/g)];
const practices = [...compatible.matchAll(/### (\d+)\. ([^\n]+)\n\n([\s\S]*?)\n\n<details><summary>Hint<\/summary>([\s\S]*?)<\/details>\n<details><summary>Worked solution<\/summary>([\s\S]*?)<\/details>/g)];
if (figures.length !== 32 || programs.length !== 13 || practices.length !== 16) throw Error('Incomplete projection');
const replacements = [];
for (const match of figures) replacements.push([match[0], `<EngineFigure id="${match[1]}"/>`]);
for (const match of programs) replacements.push([match[0], `<Program file=${JSON.stringify(match[1])}/>`]);
for (const match of practices) {
  const marker = `<!-- PRACTICE ${match[1]} -->`;
  const jsx = `<section className="lesson-exercise" data-lesson-exercise="${match[1]}">${renderPreparedLesson(`### ${match[1]}. ${match[2]}\n\n${match[3]}`).jsx}<details><summary>Hint</summary>${renderPreparedLesson(match[4]).jsx}</details><details><summary>Worked solution</summary>${renderPreparedLesson(match[5]).jsx}</details></section>`;
  compatible = compatible.replace(match[0], marker);
  replacements.push([marker, jsx]);
}
let body = renderPreparedLesson(compatible, {
  replacements, opening: [['You should be able', 'prerequisites']],
  endings: [{ title: 'Practice with changed situations', level: 'H2', kind: 'practice' },
    { title: 'Programs and further reading', level: 'H2', kind: 'further-learning' }],
}).jsx;
const headings = [...raw.matchAll(/^## (.+)\r?$/gm)].map((match) => match[1].trim());
const metadata = JSON.parse(fs.readFileSync(`${folder}/content-metadata.json`, 'utf8'));
const historicalTarget = { 1: 1, 2: 1, 3: 8, 4: 3, 5: 10, 6: 4, 7: 15, 8: 11, 9: 12 };
const aliases = {};
for (const alias of metadata.legacyAliases) {
  const number = Number(alias.match(/^\d+/)?.[0]);
  const title = number === 10 ? 'Programs and further reading' : number === 11 ? 'Practice with changed situations' :
    alias.startsWith('closing') ? headings[15] : headings[(historicalTarget[number] ?? 1) - 1];
  const heading = `<H2>{${JSON.stringify(title)}}</H2>`;
  if (!body.includes(heading)) throw Error(`Alias destination absent: ${title}`);
  if (alias !== headingId(title)) body = body.replace(heading, `<span id=${JSON.stringify(alias)} aria-hidden="true"/>${heading}`);
  aliases[alias] = headingId(title);
}
const generated = `// Static projection of the accepted whole manuscript; no scientific rerun.
import {Prose,H2,H3,CodeBlock} from '../../../../src/learn/components/content';
import {Math as InlineMath,MathBlock as SharedMathBlock} from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {Local,Table} from '../../../../src/learn/components/lesson-labs/InferenceEngineElements.jsx';
import {EngineFigure} from '../../../../src/learn/components/lesson-labs/InferenceEngineFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock=({children})=><Local label="Mathematical relationship"><SharedMathBlock>{children}</SharedMathBlock></Local>;
const NeuralTable=({headers,rows,caption})=><Table headers={headers} rows={rows} label={caption}/>;
const Program=({file})=><RemoteCodeBlock source={'/learn/examples/inference-engines/'+file} filename={file} title={file} language="python"/>;
function EngineLesson(){return <div className="lesson-flow engine-flow">${body}</div>}
export default {title:'Inference Engines & Serving',readTime:'75 min',hasIntegratedGuide:true,content:EngineLesson};
`;
const options = { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 };
parse(generated, { sourceType: 'module', plugins: ['jsx'] });
const formatted = await format(generated, options);
fs.writeFileSync(`${folder}/lesson.jsx`, formatted);
for (const file of ['src/learn/components/lesson-labs/InferenceEngineElements.jsx',
  'src/learn/components/lesson-labs/InferenceEngineNativeEvidence.jsx',
  'src/learn/data/inference-engine-models.js']) {
  const text = fs.readFileSync(file, 'utf8');
  parse(text, { sourceType: 'module', plugins: ['jsx'] });
  fs.writeFileSync(file, await format(text, options));
}
fs.writeFileSync(`${folder}/renderer-receipt.json`, JSON.stringify({ sourcePath, manuscript: expected,
  renderer: sha(fs.readFileSync(import.meta.filename)), generated: sha(formatted),
  figures: figures.map((m) => m[1]), programs: programs.map((m) => m[1]), practice: practices.length,
  aliases, boundary: 'Only figure/program markers, practice disclosure markup, historical anchors and shared reader annotations are projected. Exact accepted prose is conserved.' }, null, 2) + '\n');
console.log(JSON.stringify({ figures: 32, programs: 13, practice: 16, sha256: sha(formatted) }));
