// Author-only static composition. No Markdown parser or scientific Python ships to the browser.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderPreparedLesson } from '../../../../../../scripts/lib/prepared-lesson-renderer.mjs';

const owner = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(owner, '../../../../../..');
const topic = path.dirname(path.dirname(owner)), content = path.join(topic, 'content-preparation');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const bind = file => {
  const raw = fs.readFileSync(file);
  return { path: path.relative(app, file).replaceAll('\\', '/'), bytes: raw.length, sha256: digest(raw) };
};
const acceptance = JSON.parse(fs.readFileSync(path.join(topic, 'content-accepted-root.json')));
for (const row of [acceptance.manuscript, acceptance.visualSpecifications]) {
  if (bind(path.resolve(app, row.path)).sha256 !== row.sha256) throw Error(`Accepted content drift ${row.path}`);
}
const composition = JSON.parse(fs.readFileSync(path.join(content, 'composition.json')));
const roles = JSON.parse(fs.readFileSync(path.join(content, 'programs/source-roles.json')));
const prefix = '/learn-assets/feature-preparation-private/';
const payloads = composition.fileIndex.map(row => {
  if (bind(path.resolve(app, row.path)).sha256 !== row.sha256) throw Error(`Complete file drift ${row.path}`);
  return { filename: path.basename(row.path), url: prefix + path.basename(row.path), role: row.role, source: row };
});
const exactSources = roles.programmes.flatMap(row => ['source', 'stdout', 'stderr'].filter(key => row[key]).map(key => ({
  ...row[key], id: row.id, kind: key, text: fs.readFileSync(path.resolve(app, row[key].path), 'utf8'), filename: path.basename(row[key].path)
})));
let manuscript = fs.readFileSync(path.join(content, 'lesson.md'), 'utf8');
const runtimeWording = [{
  old: 'Full runtime drawings, keyboard/pointer/narrow viewing, independent runtime review and publication belong to a later phase; the current content packet specifies their actual objects and behavior without claiming those surfaces were rendered.',
  new: 'The diagrams use these retained values; current live edits apply the stated arithmetic and never rerun the historical experiment.',
  reason: 'Root-authorized runtime-only successor removes obsolete content-phase staging language; accepted manuscript and numerical/execution roles stay exact.'
}];
for (const delta of runtimeWording) {
  if (manuscript.split(delta.old).length !== 2) throw Error('Bounded runtime wording predecessor drift');
  manuscript = manuscript.replace(delta.old, delta.new);
}
const amendments = JSON.parse(fs.readFileSync(path.join(owner, 'matched-reading-amendments.json'), 'utf8'));
for (const delta of amendments.manuscript) {
  if (manuscript.split(delta.old).length !== 2) throw Error(`Matched amendment predecessor drift: ${delta.id}`);
  manuscript = manuscript.replace(delta.old, delta.new);
}
const replacements = [], usedSources = new Set(), counts = { sources: 0, stdout: 0, stderr: 0, snippets: 0 };
manuscript = manuscript.replace(/```([^\n]*)\n([\s\S]*?)\n```/g, (whole, language, body) => {
  const row = exactSources.find(item => item.text === body || item.text === `${body}\n`);
  if (!row) { counts.snippets++; return whole; }
  if (usedSources.has(row.path)) throw Error(`Repeated whole body ${row.path}`);
  usedSources.add(row.path);
  counts[row.kind === 'source' ? 'sources' : row.kind]++;
  const marker = `COMPLETE_FILE_${usedSources.size}_END`;
  const isOutput = row.kind !== 'source';
  const role = payloads.find(file => file.filename === row.filename)?.role;
  if (!role) throw Error(`Missing contextual file role: ${row.filename}`);
  replacements.push([marker, `<p className="prep-file-context"><a href={${JSON.stringify(prefix + row.filename)}}>${row.filename} — ${role}</a></p>\n<RemoteCodeBlock source={${JSON.stringify(prefix + row.filename)}} filename={${JSON.stringify(row.filename)}} language="${isOutput ? 'output' : row.filename.endsWith('.R') ? 'r' : 'python'}" title={${JSON.stringify(isOutput ? `Recorded ${row.kind} · ${row.filename}` : row.filename)}} />`]);
  return marker;
});
if (counts.sources !== 18 || counts.stdout !== 17 || counts.stderr !== 1) throw Error(`Whole code/stream placement ${JSON.stringify(counts)}`);
for (const id of [...composition.placement.drawings, amendments.extraDrawing]) {
  const pattern = new RegExp(`<!-- Drawing ${id}: [^\\n]+ -->`), marker = `ACTUAL_DRAWING_${id}_END`;
  if (!pattern.test(manuscript)) throw Error(`Absent drawing ${id}`);
  manuscript = manuscript.replace(pattern, marker);
  replacements.push([marker, `<PreparationFigure id="${id}" />`]);
}
for (const id of composition.placement.labs) {
  const pattern = new RegExp(`<!-- Investigation ${id}: [^\\n]+ -->`), marker = `LIVE_INVESTIGATION_${id}_END`;
  if (!pattern.test(manuscript)) throw Error(`Absent investigation ${id}`);
  manuscript = manuscript.replace(pattern, marker);
  replacements.push([marker, `<PreparationInvestigation id="${id}" />`]);
}
const sectionIds = new Set([...manuscript.matchAll(/^## (.+)$/gm)].map(match => match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
manuscript = manuscript.replace(/<a id="([^"]+)"><\/a>/g, (_whole, id) => {
  if (sectionIds.has(id)) return '';
  const marker = `PRESERVED_ANCHOR_${replacements.length}_END`;
  replacements.push([marker, `<span id="${id}" className="prep-preserved-anchor" />`]);
  return marker;
});
manuscript = manuscript.replaceAll('](programs/', `](${prefix}`);
manuscript = manuscript.replaceAll('time&lt;min held time', 'time<min held time');
// Preserved original tasks use dollar math and single-line native disclosures.
// Convert their contents at authoring time so neither Markdown nor raw braces leak into JSX.
manuscript = manuscript.replace(/\$([^$\n]+)\$/g, (_whole, math) => `\\(${math}\\)`);
let disclosureCount = 0;
manuscript = manuscript.replace(/<details><summary>([^<]+)<\/summary>([\s\S]*?)<\/details>/g, (_whole, title, body) => {
  const local = replacements.filter(([anchor]) => body.includes(anchor));
  const renderedBody = renderPreparedLesson(body.trim(), { assetBase: prefix, replacements: local }).jsx;
  for (const replacement of local) replacements.splice(replacements.indexOf(replacement), 1);
  const marker = `PRACTICE_DISCLOSURE_${++disclosureCount}_END`;
  replacements.push([marker, `<details><summary>${title}</summary>${renderedBody}</details>`]);
  return `\n\n${marker}\n\n`;
});
const rendered = renderPreparedLesson(manuscript, {
  assetBase: prefix,
  replacements,
  opening: [['We will follow one practical question:', 'summary'], ['Start with sections 1–6,', 'route']],
  endings: [
    { level: 'H2', title: '10. Practice: explain the representation before choosing the function', kind: 'practice' },
    { level: 'H2', title: '11. Readiness and the next connection', kind: 'next' },
    { level: 'H3', title: 'Further learning', kind: 'further-learning' },
    { level: 'H3', title: 'Technical references and attribution', kind: 'references' }
  ]
});
if (rendered.sections.length !== 11) throw Error(`Wrong section count ${rendered.sections.length}`);
const source = `import React from 'react';
import { H2, H3 } from '../../../../../../src/learn/components/content/Headings.jsx';
import { Prose } from '../../../../../../src/learn/components/content/Prose.jsx';
import { CodeBlock } from '../../../../../../src/learn/components/content/Code.jsx';
import RemoteCodeBlock from '../../../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { Math as InlineMath, MathBlock } from '../../../../../../src/learn/components/content/Math.jsx';
import { Table as ValuesTable } from './Drawing.jsx';
import { PreparationFigure } from './PreparationFigures.jsx';
import { PreparationInvestigation } from './PreparationInvestigations.jsx';
import './lesson.css';
// The prepared renderer supplies the current heading as table context. Keep it
// as an accessible label rather than repeating every section title as a caption.
function NeuralTable({ caption, ...props }) {
  return <ValuesTable {...props} label={caption} />;
}
function PreparationLesson() {
  return <div className="lesson-flow prep-reader">
${rendered.jsx}
  </div>;
}
export default { title: 'Feature Scaling, Encoding & Imputation', readTime: '~110 min core reading · deeper code and practice in separate sittings', hasIntegratedGuide: true, content: PreparationLesson };
`;
fs.writeFileSync(path.join(owner, 'preparation-lesson.jsx'), source);
fs.writeFileSync(path.join(owner, 'file-payloads.json'), JSON.stringify({ prefix, files: payloads }, null, 2) + '\n');
const saved = JSON.parse(fs.readFileSync(path.join(content, 'programs/calculated-inputs.json')));
const lines = fs.readFileSync(path.join(content, 'programs/penguins.csv'), 'utf8').trim().split(/\r?\n/);
const names = lines.shift().split(',');
const observations = lines.map(line => Object.fromEntries(line.split(',').map((value, i) => [names[i], value === 'NA' || value === '' ? null : Number.isNaN(Number(value)) ? value : Number(value)])));
fs.writeFileSync(path.join(owner, 'saved-data.js'), `// Exact retained data/fit/split/results; no scientific replay.\nexport const saved = ${JSON.stringify(saved)};\nexport const observations = ${JSON.stringify(observations)};\n`);
const receipt = { schema: 'feature20-private-reader-composition/v2', acceptedManuscript: acceptance.manuscript, runtimeWording, matchedAmendments: bind(path.join(owner, 'matched-reading-amendments.json')), rootCorrectionRelease: bind(path.join(owner, 'root-correction-release.json')), predecessorComposition: bind(path.join(path.dirname(owner), 'composition.json')), formatOnly: ['Original single-line disclosures and dollar math rendered using shared components', 'Preserved HTML less-than entity in T21 decoded for visible mathematical comparison', 'Prepared-renderer current-heading table context kept as accessible region label instead of repeated visible heading'], output: bind(path.join(owner, 'preparation-lesson.jsx')), sections: rendered.sections, drawings: 42, originalMechanisms: 41, splitPlacement: 'D41b sensitivity', investigations: 16, files: payloads.length, contextualFileLinks: 42, commonIndexOnly: true, counts, parserShipsToBrowser: false, scientificExecutions: 0 };
fs.writeFileSync(path.join(owner, 'composition.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
