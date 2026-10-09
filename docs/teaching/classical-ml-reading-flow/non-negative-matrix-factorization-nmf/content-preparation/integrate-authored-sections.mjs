import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const owner = path.dirname(fileURLToPath(import.meta.url));
const identify = file => { const bytes = fs.readFileSync(file); return { path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; };
const conditions = [];
function check(name, passed) { conditions.push({ name, passed: Boolean(passed) }); if (!passed) throw new Error(name); }
const previous = JSON.parse(fs.readFileSync(path.join(owner, 'partial-content-assembly.json'), 'utf8'));
const templateFile = path.join(owner, 'lesson-template.md');
const oldTemplate = fs.readFileSync(templateFile, 'utf8');
const manuscriptFile = path.join(owner, 'lesson.md');
const oldManuscript = fs.readFileSync(manuscriptFile, 'utf8');
check('Exactly nine previously assembled sections', previous.current.sections.length === 9);
check('Current predecessor template unchanged', identify(templateFile).sha256 === previous.template.sha256);
check('Current predecessor whole manuscript unchanged', identify(manuscriptFile).sha256 === previous.manuscript.sha256);
check('No existing scoped composition to overwrite', !fs.existsSync(path.join(owner, 'section-composition.json')));
const sections = [
  { position: 10, manuscript: 'ordinary-state-authoring/section-ten.md', packet: 'ordinary-state-authoring/section-ten-handoff.json', wholeSources: ['ordinary-state-authoring/ordinary_nmf_lifecycle.py'] },
  { position: 11, manuscript: 'penalties-masks-authoring/section-eleven.md', packet: 'penalties-masks-authoring/section-eleven-handoff.json', wholeSources: ['content-programs/nmf_penalties_masks.py'] },
];
for (const section of sections) {
  const packet = JSON.parse(fs.readFileSync(path.join(owner, section.packet), 'utf8'));
  for (const expected of [...packet.bindings, ...(packet.reusedExecutionInputs || [])]) {
    const current = identify(expected.path);
    check(`Frozen section${section.position} input: ${path.basename(expected.path)}`, current.bytes === expected.bytes && current.sha256 === expected.sha256);
  }
  const body = fs.readFileSync(path.join(owner, section.manuscript), 'utf8');
  check(`One complete section${section.position}`, body.startsWith(`## ${section.position}.`) && [...body.matchAll(/^## /gm)].length === 1);
}
const separator = oldTemplate.endsWith('\n\n') ? '' : oldTemplate.endsWith('\n') ? '\n' : '\n\n';
fs.writeFileSync(templateFile, oldTemplate + separator + sections.map(section => `<!-- section:${section.manuscript} -->`).join('\n\n') + '\n');
fs.writeFileSync(path.join(owner, 'section-composition.json'), JSON.stringify({ sections }, null, 2) + '\n');
const composition = spawnSync(process.execPath, [path.join(owner, 'compose-content.mjs')], { encoding: 'utf8' });
check('Source-only composition exits0; no Python or fits', composition.status === 0);
const current = JSON.parse(fs.readFileSync(path.join(owner, 'partial-content-assembly.json'), 'utf8'));
const manuscript = fs.readFileSync(manuscriptFile, 'utf8');
check('Entire nine-section manuscript prefix conserved', manuscript.startsWith(oldManuscript));
check('Eleven consecutive sections composed', current.current.sections.length === 11 && current.current.sections.every((item, i) => item.position === i + 1));
check('Forty-one actual figure placements conserved in order', current.current.figures.length === 41 && current.current.figures.every((id, i) => id === `D${String(i + 1).padStart(2, '0')}`));
check('Eight whole source bodies recorded', current.current.wholeSources.length === 8);
for (const section of sections) {
  const body = fs.readFileSync(path.join(owner, section.manuscript), 'utf8').trimEnd();
  check(`Entire section${section.position} literal appears once`, manuscript.split(body).length === 2);
  const packet = JSON.parse(fs.readFileSync(path.join(owner, section.packet), 'utf8'));
  for (const expected of packet.bindings) check(`Scoped section${section.position} handoff conserved: ${path.basename(expected.path)}`, identify(expected.path).sha256 === expected.sha256);
}
const receipt = {
  status: 'ROOT_SECTIONS10_11_COMPOSED_CONTENT_STILL_IN_PROGRESS', at: new Date().toISOString(), observer: '/root',
  predecessor: previous, current, conditions,
  sections: sections.map(section => ({ ...section, packetBinding: identify(path.join(owner, section.packet)) })),
  composition: { exitCode: composition.status, stdout: composition.stdout, stderr: composition.stderr },
  reading: 'Root read complete section10 and11 literal teaching/code, all seven D35–D41 actionable specs, source-qualified scoped handoffs, full actual stdout/empty stderr and source reuse. Earlier nine-section prefix is conserved; this is author intake/composition, not DIFFERENT whole-topic review.',
  retainedEvidence: 'Section10 new38 outer conditions/two tiny fits/26 main conditions retained. Section11 original119/main applies to the exact preserved predecessor; current32 pure-loss/inverse conditions qualify its subsequent memory correction. Neither main nor earlier scientific campaign rerun.',
  limits: ['Sections12–19 remain to be composed; separate completed author packets do not imply whole-topic completeness', 'Whole author and DIFFERENT content review pending', 'Content remains in progress; implementation not started; no canonical/public/central phase edits'],
};
fs.writeFileSync(path.join(owner, 'root-section-composition.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ status: receipt.status, sections: current.current.sections.length, figures: current.current.figures.length, programs: current.current.wholeSources.length, conditions: conditions.length, manuscript: current.manuscript }));
