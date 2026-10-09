import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const owner = path.dirname(fileURLToPath(import.meta.url));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const templateFile = path.join(owner, 'lesson-template.md');
const template = fs.readFileSync(templateFile, 'utf8');
const compositionFile = path.join(owner, 'section-composition.json');
const composed = fs.existsSync(compositionFile) ? JSON.parse(fs.readFileSync(compositionFile, 'utf8')).sections : [];
let expanded = template;
for (const section of composed) {
  const marker = `<!-- section:${section.manuscript} -->`;
  if (expanded.split(marker).length !== 2) throw new Error(`Expected one scoped section: ${section.manuscript}`);
  const body = fs.readFileSync(path.join(owner, section.manuscript), 'utf8');
  if (/<!-- (?:section|source):/.test(body)) throw new Error('Scoped sections must contain their complete literal programs');
  expanded = expanded.replace(marker, body.trimEnd());
}
if (/<!-- section:/.test(expanded)) throw new Error('Unresolved scoped section');
const sourceNames = [...expanded.matchAll(/<!-- source:([a-z][a-z0-9_]*\.py) -->/g)].map(match => match[1]);
if (new Set(sourceNames).size !== sourceNames.length) throw new Error('Each whole source must appear once');
const sources = sourceNames.map(name => ({ name, file: path.join(owner, 'content-programs', name) }));
let manuscript = expanded;
for (const { name, file } of sources) {
  const body = fs.readFileSync(file, 'utf8');
  if (body.includes('```')) throw new Error('Choose a longer code fence for this source');
  manuscript = manuscript.replace(`<!-- source:${name} -->`, `\n\`\`\`python title="${name}"\n${body.trimEnd()}\n\`\`\`\n`);
}
if (/<!-- source:/.test(manuscript)) throw new Error('Unresolved source inclusion');
for (const section of composed) {
  for (const relative of section.wholeSources) {
    const file = path.join(owner, relative);
    const body = fs.readFileSync(file, 'utf8').trimEnd();
    if (manuscript.split(body).length !== 2) throw new Error(`Whole scoped source must appear once: ${relative}`);
    sources.push({ name: path.basename(relative), file });
  }
}
if (new Set(sources.map(item => item.name)).size !== sources.length) throw new Error('Duplicate whole source owner');
const manuscriptFile = path.join(owner, 'lesson.md');
fs.writeFileSync(manuscriptFile, manuscript);
const sections = [...expanded.matchAll(/^## (\d+)\. (.+)$/gm)].map(match => ({ position: Number(match[1]), title: match[2] }));
const figures = [...expanded.matchAll(/<!-- figure:(D\d+) -->/g)].map(match => match[1]);
const practice = [...expanded.matchAll(/^### Practice ([A-X]): (.+)$/gm)].map(match => ({ id: match[1], title: match[2] }));
const complete = sections.length === 19 && sections.every((section, i) => section.position === i + 1)
  && figures.length === 66 && figures.every((id, i) => id === `D${String(i + 1).padStart(2, '0')}`)
  && practice.map(item => item.id).join('') === 'ABCDEFGHIJKLMNOPQRSTUVWX' && sources.length === 15;
const receipt = {
  status: complete ? 'COMPLETE_MANUSCRIPT_PENDING_AUTHOR_AND_INDEPENDENT_REVIEW' : 'PARTIAL_CONTENT_IN_PROGRESS_NOT_AUTHOR_READY',
  scope: complete
    ? 'All19 accepted manuscript sections,66 drawing placements,12 named computational routes,three additional demonstration/adaptor sources and24 solved tasks are assembled; author and DIFFERENT whole-content review still required'
    : 'Complete accepted design requires19 sections,66 drawing specifications,12 new computational routes and24 solved tasks',
  current: { sections, figures, practice, wholeSources: sources.map(({ name, file }) => ({ name, sha256: hash(file) })) },
  template: { file: 'lesson-template.md', sha256: hash(templateFile) },
  manuscript: { file: 'lesson.md', sha256: hash(manuscriptFile), bytes: fs.statSync(manuscriptFile).size },
  composer: { file: 'compose-content.mjs', sha256: hash(fileURLToPath(import.meta.url)) },
  composedSections: composed.map(section => ({ ...section, sha256: hash(path.join(owner, section.manuscript)) })),
  limitations: ['No runtime figures or labs implemented', 'Author continuous reading and DIFFERENT whole-content review/content acceptance remain distinct from assembly', ...(complete ? ['All19 sections are assembled; no remaining-section range is implied'] : sections.length < 19 ? [`Sections${sections.length + 1}–19 remain to be composed and reviewed; source-qualified later author packets are not automatically part of this manuscript`] : ['Assembled scope does not yet satisfy all accepted structural contracts']), 'Figure markers refer to the accepted drawing contracts plus explicit content-phase additions, not painted native evidence'],
};
fs.writeFileSync(path.join(owner, 'partial-content-assembly.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ sections: sections.length, figures: figures.length, wholeSources: sources.length, bytes: receipt.manuscript.bytes, status: receipt.status }));
