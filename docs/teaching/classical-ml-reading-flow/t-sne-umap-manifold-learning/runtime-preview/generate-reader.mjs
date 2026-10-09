// Authoring-only exact manuscript composition; no parser or author receipt ships to the Reader.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPreparedLesson } from '../../../../../scripts/lib/prepared-lesson-renderer.mjs';
const owner = path.dirname(fileURLToPath(import.meta.url));
const content = path.resolve(owner, '../content-authoring/review-correction');
const read = filename => fs.readFileSync(path.join(content, filename), 'utf8');
const index = JSON.parse(read('code-presentation-index.json'));
const bundle = JSON.parse(read('program-bundle.json'));
const entries = Object.values(index).find(value => Array.isArray(value) && value.some(row => row.kind === 'whole-code'));
if (!entries || entries.length !== 30) throw new Error('Complete30 code/stream entries required');
let manuscript = read('reading-flow-manuscript.md').replaceAll('\r\n', '\n');
const replacements = [];
const outputNames = { digitsAudit: 'inspect_digits', umapFit: 'inspect_umap', heldoutTransform: 'compare_transforms', tinyTsne: 'tiny_tsne', umapMechanism: 'umap-mechanism' };
manuscript = manuscript.replace(/<!-- whole-(code|output) ([^ ]+) -->\s*```[^\n]*\n([\s\S]*?)```/g, (_, kind, key) => {
  const marker = `SOURCE_${kind}_${key}`;
  const entry = entries.find(row => kind === 'code' ? row.kind === 'whole-code' && row.source.path.endsWith('/' + key) : row.kind === 'whole-output' && row.key === key);
  if (!entry) throw new Error(`Missing source role ${key}`);
  const destination = kind === 'code' ? 'programs/' + key : 'outputs/' + (outputNames[key] ? 'retained-' + outputNames[key] : key) + '.txt';
  if (!bundle.files.some(row => row.destination === destination)) throw new Error(`Missing complete file ${destination}`);
  const role = entry.role.replace('new teaching source;', 'Recorded deterministic source;').replace('new deterministic scratch/saved-array stream', 'Recorded deterministic scratch/saved-array stream');
  replacements.push([marker, `<p className="manifold-source-role">${JSON.stringify(role).slice(1, -1)}</p><RemoteCodeBlock source={${JSON.stringify('/learn-assets/t-sne-umap-private/' + destination)}} filename={${JSON.stringify(destination.split('/').at(-1))}} language="${kind === 'output' ? 'output' : 'python'}" />`]);
  return marker;
});
for (let i = 1; i <= 45; i++) {
  const id = `D${String(i).padStart(2, '0')}`, marker = `FIGURE_${id}`;
  if (!manuscript.includes(`<!-- figure ${id} -->`)) throw new Error(`Missing marker ${id}`);
  manuscript = manuscript.replace(`<!-- figure ${id} -->`, marker);
  replacements.push([marker, `<ManifoldFigure id="${id}" />`]);
}
// Place each control after its full local walkthrough and before the next mechanism/code.
for (const [anchor, labs] of [['SOURCE_code_isomap_routes.py', [1, 2, 3]], ['FIGURE_D12', [4, 5]], ['FIGURE_D17', [6]], ['FIGURE_D18', [7]], ['SOURCE_code_umap-mechanism.py', [8]], ['FIGURE_D25', [9]], ['FIGURE_D29', [10]], ['FIGURE_D38', [11]], ['SOURCE_code_graph_spectrum.py', [12]]]) {
  const marker = `LABS_${labs.join('_')}`;
  manuscript = manuscript.replace(anchor, `${marker}\n\n${anchor}`);
  replacements.push([marker, labs.map(n => `<ManifoldInvestigation id="L${n}" />`).join('\n')]);
}
// Convert authored inline dollars without touching code; all code already has exact file owners.
manuscript = manuscript.replace(/\$([^$\n]+)\$/g, (_, math) => `\\(${math}\\)`);
manuscript = manuscript.replace('(setup-and-files.md)', '(#setup-and-complete-files)');
// Only independent practice hints/solutions disclose; deeper teaching remains visible.
manuscript = manuscript.replace(/^Hint: (.*)$/gm, '<details><summary>Hint</summary>\n\n$1\n\n</details>');
manuscript = manuscript.replace(/^Solution:\s*(.*)$/gm, '<details><summary>Worked solution</summary>\n\n$1\n\n</details>');
const rendered = renderPreparedLesson(manuscript, { replacements, opening: [
  ['By the end,', 'summary'], ['Read [principal', 'prerequisites'], ['On a first pass,', 'route'],
] });
let jsx = rendered.jsx;
const headings = [...jsx.matchAll(/<H2>\{("(?:[^"\\]|\\.)*")\}<\/H2>/g)];
// Authored sections retain their headings/numbers; endings carry explicit shared purposes.
for (const [n, kind, style] of [[11, 'practice', 'practice'], [13, 'next', 'next']]) {
  const h = headings[n - 1], next = headings[n];
  const end = next ? jsx.indexOf(next[0]) : jsx.length, begin = jsx.indexOf(h[0]);
  jsx = jsx.slice(0, begin) + `<section className="lesson-ending lesson-ending--${style}" data-lesson-ending="${kind}">\n` + jsx.slice(begin, end) + '\n</section>\n' + jsx.slice(end);
}
// Split resource roles at paragraph boundaries while preserving every annotation and original order.
jsx = jsx.replace(/(<Prose>\{"For intuition,[\s\S]*?<\/Prose>)/, '<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">$1</section>');
for (const prefix of ['For the t-SNE derivation,', 'For UMAP,', 'For sampling,', 'For local alternatives,', 'For extensions,']) {
  const start = jsx.indexOf(`<Prose>{${JSON.stringify(prefix).slice(0, -1)}`);
  if (start < 0) throw new Error(`Missing resource paragraph ${prefix}`);
  const end = jsx.indexOf('</Prose>', start) + 8;
  jsx = jsx.slice(0, start) + '<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">' + jsx.slice(start, end) + '</section>' + jsx.slice(end);
}
const books = jsx.indexOf('<Prose>{"For books,');
if (books < 0) throw new Error('Missing book/resource qualification');
const booksEnd = jsx.indexOf('</Prose>', books) + 8;
jsx = jsx.slice(0, books) + '<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">' + jsx.slice(books, booksEnd) + '</section>' + jsx.slice(booksEnd);
let setup = read('setup-and-files.md').replaceAll('\r\n', '\n').replace('# Setup and complete lesson files', '### Setup and complete files');
const setupJsx = renderPreparedLesson(setup).jsx.replace('<H3>', '<h3 id="setup-and-complete-files">').replace('</H3>', '</h3>');
const output = `import React from 'react';
import { H2, H3 } from '../../../../../src/learn/components/content/Headings.jsx';
import { Prose } from '../../../../../src/learn/components/content/Prose.jsx';
import { CodeBlock } from '../../../../../src/learn/components/content/Code.jsx';
import RemoteCodeBlock from '../../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { Math as InlineMath, MathBlock } from '../../../../../src/learn/components/content/Math.jsx';
import { Table as NeuralTable } from './ManifoldDrawing.jsx';
import { ManifoldFigure } from './ManifoldFigures.jsx';
import { ManifoldInvestigation } from './ManifoldInvestigations.jsx';
import PrivateFiles from './PrivateFiles.jsx';
import './manifold-reader.css';
function ManifoldLesson() { return <div className="lesson-flow manifold-reader">\n<PrivateFiles />\n${jsx}\n<section className="manifold-setup">${setupJsx}</section>\n</div>; }
export default { title: 't-SNE, UMAP & Manifold Learning', readTime: '~100 min read + 120 min practice', content: ManifoldLesson };
`;
fs.writeFileSync(path.join(owner, 'manifold-lesson.jsx'), output);
console.log(JSON.stringify({ file: 'manifold-lesson.jsx', bytes: Buffer.byteLength(output), sections: rendered.sections.length, drawings: 45, investigations: 12, sourceStreams: entries.length, solvedTasks: 19 }));
