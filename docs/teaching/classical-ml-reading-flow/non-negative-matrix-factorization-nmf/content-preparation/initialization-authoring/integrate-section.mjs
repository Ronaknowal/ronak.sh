import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = path.dirname(fileURLToPath(import.meta.url));
const owner = path.dirname(directory);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const identify = file => {
  const bytes = fs.readFileSync(file);
  return { path: file, bytes: bytes.length, sha256: digest(bytes) };
};
const conditions = [];
function check(name, passed) {
  conditions.push({ name, passed: Boolean(passed) });
  if (!passed) throw new Error(name);
}
const packetFile = path.join(directory, 'section-nine-handoff.json');
const packet = JSON.parse(fs.readFileSync(packetFile, 'utf8'));
for (const expected of [...packet.bindings, ...packet.executedDependencies]) {
  const current = identify(expected.path);
  check(`Scoped input unchanged: ${path.basename(expected.path)}`, current.sha256 === expected.sha256 && current.bytes === expected.bytes);
}
const numerical = JSON.parse(fs.readFileSync(path.join(directory, 'initialization-checks.json'), 'utf8'));
check('Original129 conditions passed; retained, not replayed', numerical.checks.length === 129 && numerical.checks.every(item => item.passed) && numerical.main.returncode === 0);
const templateFile = path.join(owner, 'lesson-template.md');
const composerFile = path.join(owner, 'compose-content.mjs');
const manuscriptFile = path.join(owner, 'lesson.md');
const previous = JSON.parse(fs.readFileSync(path.join(owner, 'partial-content-assembly.json'), 'utf8'));
check('Current template matches previous partial assembly', identify(templateFile).sha256 === previous.template.sha256);
check('Current manuscript matches previous partial assembly', identify(manuscriptFile).sha256 === previous.manuscript.sha256);
check('Eight actual sections precede this addition', previous.current.sections.length === 8);
const oldTemplate = fs.readFileSync(templateFile, 'utf8');
const oldManuscript = fs.readFileSync(manuscriptFile, 'utf8');
const oldComposer = fs.readFileSync(composerFile, 'utf8');
const section = fs.readFileSync(path.join(directory, 'section-nine-template.md'), 'utf8');
check('Section9 is not already present', !oldTemplate.includes('## 9.') && !oldTemplate.includes('source:nmf_initialization.py'));
check('Scoped section has exactly one ninth section', [...section.matchAll(/^## /gm)].length === 1 && section.startsWith('## 9.'));
const separator = oldTemplate.endsWith('\n\n') ? '' : oldTemplate.endsWith('\n') ? '\n' : '\n\n';
fs.writeFileSync(templateFile, oldTemplate + separator + section);
const oldLimit = 'Sections9–19 and computational routesN6–N12 still to be authored';
check('Composer has the exact predecessor limitation', oldComposer.includes(oldLimit));
fs.writeFileSync(composerFile, oldComposer.replace(oldLimit, 'Sections10–19 and computational routesN7–N12 still to be authored'));
const composition = spawnSync(process.execPath, [composerFile], { encoding: 'utf8' });
check('Source-only composition exits0', composition.status === 0);
const current = JSON.parse(fs.readFileSync(path.join(owner, 'partial-content-assembly.json'), 'utf8'));
const manuscript = fs.readFileSync(manuscriptFile, 'utf8');
check('Entire prior eight-section manuscript prefix conserved', manuscript.startsWith(oldManuscript));
check('Nine sections are consecutive', current.current.sections.length === 9 && current.current.sections.every((item, i) => item.position === i + 1));
check('All34 figure markers are ordered and unique', current.current.figures.length === 34 && current.current.figures.every((id, i) => id === `D${String(i + 1).padStart(2, '0')}`));
check('Six complete actual local sources included', current.current.wholeSources.length === 6);
const initializer = fs.readFileSync(path.join(owner, 'content-programs/nmf_initialization.py'), 'utf8');
check('Full initializer literal body appears exactly once', manuscript.split(initializer.trimEnd()).length === 2);
const scopedManuscript = fs.readFileSync(path.join(directory, 'section-nine.md'), 'utf8');
const expectedAddition = scopedManuscript.replace('```python\n', '```python title="nmf_initialization.py"\n');
check('Whole scoped prose/code conserved except shared code-title affordance', manuscript.slice(oldManuscript.length) === separator + expectedAddition);
for (const expected of packet.bindings) {
  check(`Scoped handoff conserved after assembly: ${path.basename(expected.path)}`, identify(expected.path).sha256 === expected.sha256);
}
const receipt = {
  status: 'ROOT_SECTION9_COMPOSED_PARTIAL_CONTENT_NOT_ACCEPTED',
  date: new Date().toISOString(),
  packet: identify(packetFile),
  predecessor: previous,
  current,
  conditions,
  composition: { exitCode: composition.status, stdout: composition.stdout, stderr: composition.stderr },
  rootReading: 'Whole section9 literal manuscript/program read before composition, then all D31–D34 actionable specifications, retained actual stdout/empty stderr and the accepted N6/D31–D34 scope. This is scoped author intake, not independent whole-topic review.',
  scientificExecutions: 0,
  runtimeImplemented: false,
  phasePromotion: false,
  remaining: 'Sections10–19/routesN7–N12, complete practice/resources/file mapping, whole author and DIFFERENT content review; all runtime/native/normal integration remain pending.',
};
fs.writeFileSync(path.join(directory, 'root-composition.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ status: receipt.status, conditions: conditions.length, sections: 9, figures: 34, wholeSources: 6, manuscript: current.manuscript }));
