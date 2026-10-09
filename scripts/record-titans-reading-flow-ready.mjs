import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = 'docs/teaching/deep-learning-beginner/titans-multi-memory-architecture';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = path => ({ sha256: hash(fs.readFileSync(path)), bytes: fs.statSync(path).size });
const authored = [
  'docs/teaching/drafts/titans-multi-memory-architecture/reading-flow-lesson.md',
  'docs/teaching/drafts/titans-multi-memory-architecture/reading-flow-visual-specifications.md',
  'docs/teaching/drafts/titans-multi-memory-architecture/memory_write_walkthrough.py',
  'docs/teaching/drafts/titans-multi-memory-architecture/titans_learning_routes.py',
  'src/learn/data/titans-reading-flow-models.js',
  'src/learn/components/lesson-labs/TitansDrawings.jsx',
  'src/learn/components/lesson-labs/TitansFlowLabs.jsx',
  'src/learn/components/lesson-labs/TitansFlowStudy.jsx',
  'src/learn/components/lesson-labs/titans-reading-flow.css',
  'scripts/lib/titans-reading-flow-renderer.mjs',
  `${root}/author-reading-flow-manuscript.mjs`,
  'scripts/check-titans-reading-flow-programs.py',
  'scripts/check-titans-reading-flow-models.mjs',
  'scripts/verify-titans-reading-flow-preview.cjs',
  'scripts/capture-titans-reading-flow-paint.cjs',
  'scripts/record-titans-reading-flow-ready.mjs',
  'scratch/reading-flow/titans-prototype/main.jsx',
  'scratch/reading-flow/titans-prototype/index.html',
  'scratch/reading-flow/titans-prototype/vite.config.mjs',
];
const shared = ['scripts/lib/prepared-lesson-renderer.mjs', 'scripts/lib/lesson-opening-annotations.mjs', 'scripts/lib/lesson-ending-layout.mjs', 'scripts/lib/lesson-teaching-disclosures.mjs',
  'src/learn/components/LessonGuide.jsx', 'src/learn/components/LessonOpening.jsx', 'src/learn/components/lesson-navigation.js', 'src/learn/components/content/RemoteCodeBlock.jsx',
  'src/learn/components/content/Code.jsx', 'src/learn/components/content/LessonCodeDownloads.jsx', 'src/learn/components/lesson-labs/NeuralNumberControl.jsx'];
const render = JSON.parse(execFileSync(process.execPath, ['scripts/lib/titans-reading-flow-renderer.mjs', '--verify-preview'], { encoding: 'utf8' }).trim());
const inventory = JSON.parse(fs.readFileSync(`${root}/retained-source-inventory.json`));
for (const file of inventory.baselineFiles) if (source(file.path).sha256 !== file.sha256 || source(file.rollback).sha256 !== file.sha256) throw new Error(`Original/rollback source differs: ${file.path}`);
const checks = Object.fromEntries(['program', 'model', 'browser'].map(kind => [kind, JSON.parse(fs.readFileSync(`${root}/reading-flow-${kind==='browser'?'correction-browser':kind}-checks.json`))]));
if (checks.program.assertions !== 83 || checks.model.assertions !== 813 || checks.browser.errors.length || checks.browser.layouts.some(r => r.outside.length || r.overlaps.length || r.pageOverflow || r.minimumGlyphPixels < 16*r.scale || r.excessiveControls || r.smallControls.length)) throw new Error('Current complete-source checks do not pass.');
const receipts = ['reading-flow-program-checks.json', 'reading-flow-model-checks.json', 'reading-flow-correction-browser-checks.json', 'reading-flow-correction-paint-index.json', 'reading-flow-corrections.md'];
const paints = JSON.parse(fs.readFileSync(`${root}/reading-flow-correction-paint-index.json`));
const images = [...paints.pictures.flatMap(p => p.paths), ...checks.browser.focusedPaints];
const previousPath=`${root}/reading-flow-ready-source-identity.json`, previous=JSON.parse(fs.readFileSync(previousPath));
const unchangedNumericalOwners=['docs/teaching/drafts/titans-multi-memory-architecture/memory_write_walkthrough.py','docs/teaching/drafts/titans-multi-memory-architecture/titans_learning_routes.py','src/learn/data/titans-reading-flow-models.js','scripts/check-titans-reading-flow-programs.py','scripts/check-titans-reading-flow-models.mjs'];
for(const path of unchangedNumericalOwners) if(source(path).sha256!==previous.reviewedAuthoredSourceHashes[path].sha256) throw new Error(`Cannot reuse numerical evidence: ${path}`);
const build = 'scratch/reading-flow/titans-prototype/build';
const assets = fs.readdirSync(`${build}/assets`).filter(file => /^index-.*\.(js|css)$/.test(file));
const currentHtml = fs.readFileSync(`${build}/index.html`, 'utf8');
const usedAssets = assets.filter(file => currentHtml.includes(file));
const packet = {
  topic: 'titans-multi-memory-architecture', revision: 4, status: 'READY: corrected candidate for independent seven-finding closure', recordedAt: new Date().toISOString(),
  retainedPreviousCandidate:{path:previousPath,...source(previousPath),snapshot:`${root}/retained-before-review-corrections/source-bindings.json`,snapshotIdentity:source(`${root}/retained-before-review-corrections/source-bindings.json`)},
  correctionReview:{path:`${root}/reading-flow-review.md`,...source(`${root}/reading-flow-review.md`)},
  boundary: 'Author candidate only. No shared/central phase/integration/publication edits. No original fitter/scientific writer/generator execution. No commit or deploy.',
  acceptedDesign: Object.fromEntries(['reading-flow-design.md', 'design-source-identity.json', 'design-amendment-review.md'].map(file => [`${root}/${file}`, source(`${root}/${file}`)])),
  manuscript: render.manuscriptSha256, generatedSource: render.generatedSha256, preview: { url: 'http://127.0.0.1:4861/', path: 'scratch/reading-flow/titans-authored-preview.jsx', ...source('scratch/reading-flow/titans-authored-preview.jsx') },
  reviewedAuthoredSourceHashes: Object.fromEntries(authored.map(path => [path, source(path)])), sharedReadOnlyDependencyHashes: Object.fromEntries(shared.map(path => [path, source(path)])),
  protectedOriginalAndRollbackCount: inventory.baselineFiles.length, protectedBindings: Object.fromEntries(inventory.baselineFiles.map(file => [file.path, { sha256: file.sha256, rollback: file.rollback }])),
  retainedInventory: { path: `${root}/retained-source-inventory.json`, ...source(`${root}/retained-source-inventory.json`) },
  verification: { instructionalNativeAssertions: checks.program.assertions, pureModelReplayAssertions: checks.model.assertions, numericalEvidence:'Reused exact earlier receipts for byte-identical numerical owners; neither script rerun for drawing/copy corrections.', reusedNumericalOwners:Object.fromEntries(unchangedNumericalOwners.map(path=>[path,source(path)])),browserAssertions: checks.browser.assertions, layouts: checks.browser.layouts.map(({ outside, overlaps, ...rest }) => rest), semanticPlacements: render.drawings, actualDefaultSVGs: checks.browser.layouts[0].figureCount, completeVisiblePrograms: render.programs, originalPracticesRetained: 8, addedSolvedPractices: 2, distinctPaintTitles: paints.pictures.length },
  receipts: Object.fromEntries(receipts.map(file => [`${root}/${file}`, source(`${root}/${file}`)])), imageEvidence: Object.fromEntries(images.map(path => [path, source(path)])),
  isolatedBuild: { command: 'node node_modules/vite/bin/vite.js build --config scratch/reading-flow/titans-prototype/vite.config.mjs', result: 'passed; no root/shared generators', moduleCount: 63, ordinaryViteLargeChunkAdvisory: true, sources: Object.fromEntries([`${build}/index.html`, ...usedAssets.map(file => `${build}/assets/${file}`)].map(path => [path, source(path)])) },
  next: 'Independent review must read the whole manuscript/specification/runtime/program packet and operate the isolated complete preview. Root owns subsequent correction routing and shared integration/publication after exact acceptance.',
};
const path = `${root}/reading-flow-corrected-source-identity.json`;
fs.writeFileSync(path, JSON.stringify(packet, null, 2)+'\n');
console.log(JSON.stringify({ path, sha256: source(path).sha256, manuscript: packet.manuscript, generatedSource: packet.generatedSource, authoredFiles: authored.length, protectedSources: inventory.baselineFiles.length, images: images.length }));
