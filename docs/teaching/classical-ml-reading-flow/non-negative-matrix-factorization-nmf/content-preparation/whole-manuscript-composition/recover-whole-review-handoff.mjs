import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Source-only recovery. Never invokes the mutating historical composers or Python.
const self = fileURLToPath(import.meta.url), owner = path.dirname(self), prep = path.dirname(owner), topic = path.dirname(prep);
const read = p => fs.readFileSync(p, 'utf8');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const bind = p => { const b = fs.readFileSync(p); return { path: p, bytes: b.length, sha256: hash(b) }; };
const json = p => JSON.parse(read(p));
const checks = [];
const check = (name, ok) => { checks.push({ name, passed: Boolean(ok) }); if (!ok) throw Error(name); };
const count = (text, piece) => text.split(piece).length - 1;
const output = path.join(owner, 'whole-review-handoff.json');
const failedRecord = path.join(owner, 'failed-whole-review-write.json');
check('failed target exists and is exactly empty', fs.existsSync(output) && fs.statSync(output).size === 0);
// Save the observed failed artifact before replacing its original path.
if (!fs.existsSync(failedRecord)) fs.writeFileSync(failedRecord, JSON.stringify({
  status: 'OBSERVED_EMPTY_FAILED_HANDOFF_BEFORE_RECOVERY', observed: new Date().toISOString(), artifact: bind(output),
  context: 'Retained freeze-whole-review-handoff.mjs had applied six spacing-only prose corrections before its final write failed with ENOSPC, as reported by the delegating Root. The empty artifact is not a valid handoff.',
  preservation: 'Its exact zero-byte identity and original path are recorded here before replacement. No redundant copy of an empty file is needed.',
  recovery: self,
}, null, 2) + '\n');
else check('previously frozen empty artifact observation matches', json(failedRecord).artifact.sha256 === bind(output).sha256 && json(failedRecord).artifact.bytes === 0 && json(failedRecord).artifact.path === output);
const receiptPath = path.join(owner, 'whole-composition-receipt.json'), receipt = json(receiptPath);
const correctionPath = path.join(owner, 'preserved-step-correction.json'), correction = json(correctionPath);
check('original whole assembly receipt identity', bind(receiptPath).sha256 === 'eb551b68b3a760baca80e56cdec41c01b3d8badabea865dba5c35afdfb7b6c26');
check('original insertion receipt identity', bind(correctionPath).sha256 === '4c953dd27feb3344c36e4281a59d620ad55715077c011b9bc7ffe85c94226b8b');
check('retained 304 original composition conditions passed', receipt.conditions.length === 304 && receipt.conditions.every(x => x.passed));
const verified = new Set();
function preserve(expected) {
  const actual = bind(expected.path);
  check('binding conserved: ' + path.relative(topic, expected.path), actual.bytes === expected.bytes && actual.sha256 === expected.sha256);
  verified.add(expected.path);
}
for (const expected of [...receipt.frozenInputs, ...receipt.specifications, receipt.remainingHandoff]) preserve(expected);
for (const key of ['composition', 'composer']) preserve(correction.current[key]);
const templatePath = path.join(prep, 'lesson-template.md'), manuscriptPath = path.join(prep, 'lesson.md');
const template = read(templatePath), manuscript = read(manuscriptPath);
check('current final manuscript exact identity', bind(manuscriptPath).bytes === 430287 && hash(manuscript) === '1d828562c404a70a2372eed3a821651ab8817738124dc9e4d0880d01d66b186f');
const phrases = [
  ['sweeps1,2,10 and40', 'sweeps 1, 2, 10 and 40'], ['printed sweep1', 'printed sweep 1'],
  ['loss is0.03944744', 'loss is 0.03944744'], ['By sweep40', 'By sweep 40'],
  ['loss is5×10⁻⁸', 'loss is 5×10⁻⁸'], ['ones from section1', 'ones from section 1'],
];
function undoSpacing(text, label) {
  let inverse = text;
  for (const [before, after] of [...phrases].reverse()) {
    check(label + ' unique corrected phrase ' + after, count(inverse, after) === 1 && !inverse.includes(before));
    inverse = inverse.replace(after, before);
  }
  return inverse;
}
const unspacedTemplate = undoSpacing(template, 'template'), unspacedManuscript = undoSpacing(manuscript, 'manuscript');
check('six edits reverse to frozen template', hash(unspacedTemplate) === correction.current.template.sha256);
check('six edits reverse to frozen manuscript', hash(unspacedManuscript) === correction.current.manuscript.sha256);
preserve(correction.insertion);
const insertion = read(correction.insertion.path);
check('insertion appears once before spacing correction', count(unspacedTemplate, insertion) === 1 && count(unspacedManuscript, insertion) === 1);
const originalTemplate = unspacedTemplate.replace(insertion, ''), originalManuscript = unspacedManuscript.replace(insertion, '');
check('removing insertion recovers frozen full assembly template', hash(originalTemplate) === correction.predecessor.template.sha256);
check('removing insertion recovers frozen full assembly manuscript', hash(originalManuscript) === correction.predecessor.manuscript.sha256);
check('eleven-section template prefix conserved before bounded correction', hash(Buffer.from(originalTemplate).subarray(0, receipt.conservation.templatePrefixBytes)) === receipt.conservation.templatePrefixSha256);
check('eleven-section manuscript prefix conserved before bounded correction', hash(Buffer.from(originalManuscript).subarray(0, receipt.conservation.wholeManuscriptPrefixBytes)) === receipt.conservation.wholeManuscriptPrefixSha256);
// Reconstruct the current assembler in memory, keeping all retained files untouched.
const compositionPath = path.join(prep, 'section-composition.json'), composition = json(compositionPath);
let expanded = template;
for (const section of composition.sections) {
  const marker = `<!-- section:${section.manuscript} -->`, body = read(path.join(prep, section.manuscript)).trimEnd();
  check('one section marker ' + section.position, count(expanded, marker) === 1);
  check('one entire composed section ' + section.position, count(manuscript, body) === 1);
  expanded = expanded.replace(marker, body);
}
for (const match of [...expanded.matchAll(/<!-- source:([a-z][a-z0-9_]*\.py) -->/g)]) {
  const body = read(path.join(prep, 'content-programs', match[1])).trimEnd();
  expanded = expanded.replace(match[0], `\n\`\`\`python title="${match[1]}"\n${body}\n\`\`\`\n`);
}
check('in-memory current composition is byte-exact', expanded === manuscript);
check('no unexpanded composition slots', !/<!-- (?:source|section):/.test(manuscript));
const assemblyPath = path.join(prep, 'partial-content-assembly.json'), assembly = json(assemblyPath);
check('assembly refers to exact current manuscript', assembly.manuscript.sha256 === hash(manuscript) && assembly.manuscript.bytes === Buffer.byteLength(manuscript));
check('assembly refers to exact current template', assembly.template.sha256 === hash(template));
check('pending review status retained', assembly.status === 'COMPLETE_MANUSCRIPT_PENDING_AUTHOR_AND_INDEPENDENT_REVIEW');
const headings = [...manuscript.matchAll(/^## (\d+)\. (.+)$/gm)];
check('nineteen actual manuscript sections in order', headings.length === 19 && headings.every((m, i) => +m[1] === i + 1));
const figures = [...manuscript.matchAll(/<!-- figure:(D\d+) -->/g)].map(m => m[1]);
check('sixty-six actual placements in order', figures.length === 66 && figures.every((id, i) => id === 'D' + String(i + 1).padStart(2, '0')));
const contracts = read(path.join(topic, 'design-completion/visual-and-investigation-contracts.md'));
const jobs = [...contracts.matchAll(/^\*\*(D\d+)\./gm)].map(m => m[1]);
check('sixty-six actual accepted drawing jobs, not just markers', jobs.length === 66 && jobs.join() === figures.join());
const endingPath = path.join(prep, 'practice-resources-authoring/section-nineteen-handoff.json'), ending = json(endingPath);
for (const item of [...ending.bindings, ...ending.sectionInputs, ...ending.streams, ...ending.retainedReceipts]) preserve(item);
check('twenty-two actual files in shared index', ending.fileManifest.length === 22);
check('sixteen unchanged retained stdout streams', ending.streams.length === 16);
const normalizeLines = text => text.replace(/\r\n/g, '\n');
const streamPresentation = ending.streams.map(stream => ({
  file: path.basename(stream.path), retainedBytes: stream.bytes, retainedSha256: stream.sha256,
  literalFullOccurrences: count(manuscript, read(stream.path).trimEnd()),
  fullOccurrencesAfterCRLFNormalization: count(normalizeLines(manuscript), normalizeLines(read(stream.path)).trimEnd()),
}));
check('stream occurrence classification is unambiguous', streamPresentation.every(x => x.literalFullOccurrences <= 1 && x.fullOccurrencesAfterCRLFNormalization <= 1));
check('eight complete stdout streams are literally displayed', streamPresentation.filter(x => x.literalFullOccurrences === 1).length === 8);
check('eight absent complete stdout streams remain absent after CRLF normalization', streamPresentation.filter(x => x.fullOccurrencesAfterCRLFNormalization === 0).length === 8);
check('fifteen actual new complete sources', assembly.current.wholeSources.length === 15 && new Set(assembly.current.wholeSources.map(x => x.name)).size === 15);
for (const source of assembly.current.wholeSources) {
  const item = ending.fileManifest.find(x => x.file === source.name);
  check('source has exact indexed identity ' + source.name, item?.identity?.sha256 === source.sha256);
  preserve(item.identity);
  check('one full source body ' + source.name, count(manuscript, read(item.identity.path).trimEnd()) === 1);
}
preserve(correction.sourceOwner);
const originals = JSON.parse(read(correction.sourceOwner.path).match(/export const nmfExamples = ([\s\S]*);\s*$/)[1]);
const originalPrograms = Object.values(originals).map(x => ({ file: x.file, decodedCodeSha256: hash(x.code), decodedOutputSha256: hash(x.expected), codeOccurrences: count(manuscript, x.code), outputOccurrences: count(manuscript, x.expected) }));
check('all three exact original full code/output pairs', originalPrograms.length === 3 && originalPrograms.every(x => x.codeOccurrences === 1 && x.outputOccurrences === 1));
for (const item of ending.fileManifest) {
  if (item.identity) preserve(item.identity);
  check('indexed filename present ' + item.file, manuscript.includes('`' + item.file + '`'));
}
check('all twenty-four solved task roles retained', ending.tasks.length === 24 && ending.tasks.map(x => x.id).join('') === 'ABCDEFGHIJKLMNOPQRSTUVWX');
const endingText = read(path.join(prep, 'practice-resources-authoring/section-nineteen.md'));
for (let i = 0; i < ending.tasks.length; i++) {
  const task = ending.tasks[i], start = endingText.indexOf(task.heading), next = i < 23 ? endingText.indexOf(ending.tasks[i + 1].heading) : endingText.indexOf('### Files for the worked implementations');
  const body = endingText.slice(start, next);
  check('exact retained solved task ' + task.id, Buffer.byteLength(body) === task.bytes && hash(body) === task.sha256);
}
check('setup and separate ending roles present', ['Python 3.12.14', 'NumPy 2.3.5', 'SciPy 1.18.1', 'scikit-learn 1.9.1', '### Files for the worked implementations', '### Another way to learn these ideas', '### Technical references and provenance', '### Readiness and the next question'].every(x => endingText.includes(x)));
const precisionPath = path.join(prep, 'precision-corrections/correction-handoff.json'), precision = json(precisionPath);
preserve(precision.report);
for (const item of precision.corrected) {
  preserve(item.original); preserve(item.successor);
  let expected = read(item.original.path);
  for (const [before, after] of item.replacements) { check('unique precision phrase in section ' + item.section, count(expected, before) === 1); expected = expected.replace(before, after); }
  check('exact precision-only successor section ' + item.section, expected === read(item.successor.path));
}
for (const item of precision.originals) preserve(item);
check('corrected section12 literal selected', composition.sections.find(x => x.position === 12).manuscript === 'precision-corrections/section-twelve.md');
check('corrected section16 literal selected', composition.sections.find(x => x.position === 16).manuscript === 'precision-corrections/section-sixteen.md');
const alignment = read(path.join(prep, 'content-programs/nmf_factor_alignment.py'));
const contribution = alignment.slice(alignment.indexOf('def row_contribution('), alignment.indexOf('def change_component_gain('));
check('actual row wrapper validates dictionary and amount row directly', contribution.includes('h = nonnegative_table(dictionary, require_rows=True)') && contribution.includes('w = nonnegative_table([amount_row], h.shape[0])') && !contribution.includes('matching_factors('));
const reviewIdentities = path.join(prep, 'independent-content-review/sections-twelve-sixteen-identities.json');
check('retained independent staged identity receipt', bind(reviewIdentities).sha256 === '615c8333ba98020b70f756e1263c51b24d1452e19ab7f97fd4c1528183b66534');
const packet = {
  status: 'COMPLETE_MANUSCRIPT_PENDING_DIFFERENT_WHOLE_CONTENT_REVIEW', author: '/root/nmf_content_recovery', created: new Date().toISOString(), acceptance: false,
  authority: 'Root delegated source-only recovery of the interrupted NMF19 author handoff. No new lesson rewrite or phase/runtime/publication work.',
  manuscript: bind(manuscriptPath), template: bind(templatePath), assembly: bind(assemblyPath), composition: bind(compositionPath), composer: bind(path.join(prep, 'compose-content.mjs')),
  fullBindingManifest: bind(receiptPath), remainingSectionManifest: receipt.remainingHandoff, endingManifest: bind(endingPath), preservedStepCorrection: bind(correctionPath),
  failedWriteRecord: bind(failedRecord), recoverySource: bind(self), interruptedFreezeSource: bind(path.join(owner, 'freeze-whole-review-handoff.mjs')),
  conservation: { priorAssemblyConditions: 304, currentVerifiedDistinctFiles: verified.size, inMemoryCompositionExact: true, spacingPairs: phrases, spacingInverseTemplateSha256: hash(unspacedTemplate), spacingInverseManuscriptSha256: hash(unspacedManuscript), insertionInverseTemplateSha256: hash(originalTemplate), insertionInverseManuscriptSha256: hash(originalManuscript), originalElevenSectionPrefixBeforeLaterCorrectionExact: true },
  scope: { actualSections: 19, actualVisualPlacements: 66, actualSpecifiedVisualJobs: 66, namedRoutes: 12, additionalCompleteAdapterDemonstrationSources: 3, completeNewSources: 15, originalCompleteCodeOutputPairs: 3, retainedStdoutStreams: 16, solvedTasks: 24, sharedFileIndex: 22, acceptedOutcomes: 9 },
  originalPrograms,
  openMaterialFinding: { location: 'section19 / Files for the worked implementations, sentence beginning Each worked new program', claim: 'Each worked new program\'s complete stdout is displayed beside it.', assessment: 'Inaccurate for eight retained streams. They exist with exact frozen identities, and some results are discussed in prose, but their complete outputs are absent from the manuscript. This is not merely a CRLF versus LF comparison issue. No numerical result has been invalidated or rerun. Root explicitly instructed recovery to preserve the current manuscript for this status/review packet.', streamPresentation, requiredClosure: 'Author must reconcile complete output presentation and the learner-facing delivery promise, with source-qualified retained streams and no scientific replay. DIFFERENT reviewer must inspect the full lesson and determine the affected delivery/correctness/learning consequences. This recovery does not close that finding.' },
  precisionCorrection: { handoff: bind(precisionPath), originalIndependentReport: precision.report, originalIndependentIdentities: bind(reviewIdentities), disposition: 'Exact prose-only overlays for12/16 selected and conserved; SAME/whole reviewer closure remains pending. Original R1 report misnamed matching_factors: row_contribution actually calls nonnegative_table directly, which calls real_table. The wrapper-copy cost conclusion and corrected prose remain valid.' },
  authorReading: { retainedFullReadback: bind(path.join(owner, 'reading-flow-intake.md')), originalScope: 'Original author read continuous teaching prose/equations/tables/placements1–18 with separately closed truncated ranges, section19 during its authoring, full owned9–19 bodies during authoring, and corrected complete7. This is not a fresh literal read of every earlier1–8 program.', recoveryScope: 'Recovery read the full retained author readback, the current entire7 including restored original and robust code/output, six exact spacing edits, corrected12/16 continuous prose with unchanged fences explicitly elided, actual contribution validation chain, and section19 setup/file/resource/ending roles. No independent entire-manuscript reading is claimed.', assessment: 'The restored original step pair and six spacing corrections are conserved. Recovery additionally found the complete-stdout presentation discrepancy recorded above; therefore the original bounded no-further-gap assessment is historical, not this recovery\'s disposition.' },
  reviewPacket: { readyForDifferentWholeContentReview: true, required: 'Read complete literal1–19 including every code/output block,19-section/66-job/12-route/24-task/9-outcome coverage, setup/file index, all actionable specifications and exact research/prerequisite links. Assess correctness and learning experience independently; close precision overlays with reference to original staged findings. Do not substitute this conservation receipt for substantive reading.', explicitAmendments: ['D28/D30 scalar and Jensen/tangent additions', 'N8 separately bounded optional global assignment ambiguity audit and wrapper costs', 'D48 original fixed-eight aggregates versus separate new predetermined rank6/seed23 matched images; never fabricate old PCA8 factors', 'Qualified positive shifted KL demonstration and unchanged original failed stream', 'Section11 streamed-loss correction has affected pure checks rather than a replayed original main', 'Finite tensor anatomy/phase counterexample is not tensor fitting or audio study'], presentationConsideration: 'Full long controlled-study output remains retained; runtime must keep the local comparison readable and preserve access without deleting evidence or hiding instructional code.' },
  checks, execution: { kind: 'Node source/identity/assembly inspection only; no historical composer invoked', preliminaryGuardFailures: ['First attempt rejected a mistyped expected SHA256 (missing leading1); actual manuscript identity was checked and the script literal corrected. Only the empty-artifact observation had been written.', 'Second attempt correctly rejected an assumed full-stdout-occurrence requirement, exposing the eight missing full presentations. Manuscript unchanged; this finding is recorded rather than bypassed.'], newPythonMains: 0, newFits: 0, scientificReplay: false, builds: 0 },
  phase: 'Content remains in progress pending DIFFERENT whole-content review and Root acceptance; implementation not started. Root alone owns central phases/integration.',
  limits: ['No current rendered/native figures, labs, code downloads or responsive/browser review', 'No independent whole-content certification or observed learner mastery', 'Original numerical/warning/environment/review qualifications remain; identities are not correctness proof', 'No canonical, public, runtime, publication or central-ledger edit'],
};
const temporary = output + '.recovering';
check('no existing recovery temporary file', !fs.existsSync(temporary));
fs.writeFileSync(temporary, JSON.stringify(packet, null, 2) + '\n');
check('temporary handoff round-trip identity', json(temporary).manuscript.sha256 === hash(manuscript));
check('failed target still empty immediately before replacement', fs.statSync(output).size === 0);
fs.renameSync(temporary, output);
console.log(JSON.stringify({ handoff: bind(output), manuscript: packet.manuscript, currentConditions: checks.length, currentVerifiedDistinctFiles: verified.size, status: packet.status, newFits: 0, newPythonMains: 0 }));
