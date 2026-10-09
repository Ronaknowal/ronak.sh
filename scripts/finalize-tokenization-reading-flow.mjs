import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Root-owned record finalization AFTER actual independent source/paint review.
// Checks prevent stale evidence; they do not manufacture visual acceptance.
const directory = 'docs/teaching/tokenization';
const evidence = `${directory}/reading-flow-evidence`;
const ids = [
  'byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram',
  'byte-level-tokenization-token-free-models',
  'vocabulary-design-multilingual-tokenization',
];
const manuscripts = [
  'src/learn/data/topics/tokenization.jsx',
  'src/learn/data/topics/byte-level-tokenization.jsx',
  'src/learn/data/topics/vocabulary-multilingual.jsx',
];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const manifestPath = 'dist-tokenization-flow/.vite/manifest.json';
const manifestHash = hash(manifestPath);
const browser = read(`${evidence}/browser.json`);
const numerics = read(`${evidence}/independent-numerics.json`);
const site = read(`${evidence}/site-build.json`);
const intermediate = read(`${evidence}/intermediate-layout.json`);
const loading = read(`${evidence}/load-boundaries.json`);
const baseline = read(`${directory}/reading-flow-baseline.json`);
const sourceMapMatches = bindings => {
  for (const [file, expected] of Object.entries(bindings)) assert.equal(hash(file), expected, file);
};
assert.equal(browser.buildManifestHash, manifestHash);
assert.equal(browser.records.length, 3);
assert(browser.records.every(row => row.passed && !row.errors.length));
sourceMapMatches(browser.sourceHashes);
sourceMapMatches(numerics.sourceHashes);
assert.equal(numerics.checks.length, 6);
assert(site.passed && site.buildManifestSha256 === manifestHash);
assert(intermediate.passed && intermediate.manifestHash === manifestHash);
assert.equal(loading.results.length, 11);
const manifest = read(manifestPath);
for (let i = 0; i < ids.length; i++) {
  const result = loading.results.find(row => row.topicId === ids[i]);
  assert.deepEqual(result.lessonBodies, [manifest[manuscripts[i]].file]);
}
assert.equal(hash('src/learn/data/lesson-manifest.json'), baseline.manifestHash);
sourceMapMatches(baseline.protectedOriginals);

const subword = `${directory}/${ids[0]}/reading-flow-evidence`;
const authorReceipts = [
  `${subword}/numerical.json`, `${subword}/native-teaching.json`, `${subword}/browser.json`,
  `${directory}/${ids[1]}/reading-flow-author-numerical.json`,
  `${directory}/${ids[1]}/reading-flow-author-browser.json`,
  `${directory}/${ids[1]}/reading-flow-author-paint-review.json`,
  `${directory}/${ids[1]}/reading-flow-final-paint-comparison.json`,
  `${directory}/${ids[2]}/reading-flow-author-values.json`,
  `${directory}/${ids[2]}/reading-flow-author-browser.json`,
];
for (const file of authorReceipts) {
  const receipt = read(file);
  if (receipt.sourceSha256) sourceMapMatches(receipt.sourceSha256);
  if (receipt.sources) sourceMapMatches(receipt.sources);
  if (receipt.sourceBindings) sourceMapMatches(Object.fromEntries(receipt.sourceBindings.map(row => [row.path, row.sha256])));
  if (receipt.status) assert.equal(receipt.status, 'passed', file);
}
assert.equal(read(`${subword}/browser.json`).build.manifestSha256, manifestHash);
assert.equal(read(`${directory}/${ids[1]}/reading-flow-author-browser.json`).sourceBindings
  .find(row => row.path === manifestPath).sha256, manifestHash);
assert.equal(read(`${directory}/${ids[2]}/reading-flow-author-browser.json`).sources[manifestPath], manifestHash);
for (const row of browser.records) for (const state of row.states) for (const figure of state.figures) {
  if (figure.screenshot) assert.equal(hash(figure.screenshot), figure.screenshotSha256);
}

const conclusions = [
  `The full eleven-section manuscript preserves the specialist derivations, three canonical programs, Alice data and five solved practices. Dictionary addressing comes before the algorithm names. Count/join/rank traces precede optimized indexing; ordinary WordPiece success precedes its greedy failure; complete lattice paths precede marginalization, shared-prefix computation, fractional credit and pruning. The actual trie, links, lattice, edge-credit graph and equal-cell matrices support composition rather than placing explanations in boxes.

Root's source finding R1 (duplicated controls and premature EM) is closed: one slider per changing process, retained useful editable inputs/reset, and EM in its fully introduced section. Root's phone finding R2 (compounded small quantity labels) is closed by root-relative owned styles. Author computed-size checks give 14/28 px for targeted HTML quantities; SVG labels are not claimed to double with root text. Root personally opened the corrected phone ID strip, trie, sampling tree and matrix. The author found a pruning curve crossing labels; root independently confirmed it and inspected the final correction at desktop,390px and200%: both labels now have visible gaps above curves. Only label baselines moved, not weights or graph geometry.

Root opened greedy-failure and no-whole-piece edited states. Independent arithmetic checks verify weighted overlap, complete-path alternatives, .64 partition,15/16 posterior,15/17 EM and3−2√2 winner boundary. The author separately executed actual displayed Counter and native train/encode/decode/save/reload teaching snippets.`,
  `The full thirteen-section manuscript preserves four canonical programs and six solved practices. Local leads teach bits, hexadecimal, scalars and grapheme clusters before those labels become necessary. Actual aligned byte/bit strips lead into decoder state, embedding lookup, shifted targets, causal/PAD grids, likelihood and architecture composition. ByT5,CANINE,Charformer,MambaByte andBLT now have connected sequence/feature structures. The BLT drawing separately exposes completed earlier-patch context and causal current-prefix information.

Root independently checked those whole sources, scoped styles and model arithmetic. Root's bounded learner-copy and embedding-address/metric-label findings are closed: learner prose explains the mechanism, byte C3 and ID198 are visually separated, and metric labels stay on their own line under enlarged text. The redundant CANINE explanation is consolidated while architecture depth remains. Root personally inspected all default desktop/phone mechanisms, corrected enlarged embedding/target/architecture views, and actual invalid-surrogate, truncated-EOF and equality-one-patch states. Strict UTF-8 recovery, causal patch boundaries,36-versus6 pair counts, pooling and common-unit likelihood pass independent arithmetic checks.

The Fast BLT follow-through is sourced and qualitative; no GPU training, full BLT reproduction, new timing or benchmark is claimed. Minor singular count copy in extreme states (for example,1 pairs) is accepted as nonblocking and retained explicitly in the author review.`,
  `The full eleven-section manuscript preserves three canonical programs, FLORES sample/provenance and five solved practices. Actual dictionary reuse, coverage/fertility denominators, sampled masses, finite joins, integer allocation, embedding/output rows, resource scales, normalization loss, held-out measurements and row migration form a continuous sequence. Five focused investigations replace the earlier combined control surface. Repeated opening definitions are consolidated and the introduction now accurately describes the available investigations.

Root independently checked complete source, styles and numerical models. Design amendments distinguish current documentation from the actual recorded SentencePiece0.2.2 execution and show floors10/1 before allocating the final slot to A. Root found actual103px overflow at768px with200% text; flexible dictionary reuse and stacked embedding/coverage sequences close it. Atomic hex bytes retain their identity while their groups wrap. Root personally inspected every default desktop/phone mechanism, corrected enlarged reuse/coverage/embedding/output views, and all-zero, Hindi-only and equal-head/quarter-pairs states.

Independent arithmetic verifies9:1 smoothing to75/25, zero-support handling, shared-word mass7/12,1000MiB tied/2000MiB untied table storage, dot product.16 and independent head/pair work ratios1/.25. The twelve native held-out token counts agree exactly with the preserved source-bound receipt. Real language rankings are not inferred from the constructed strings.`,
];
const finalSection = '## Final independent source and paint closure — 6 October 2026';
for (let i = 0; i < ids.length; i++) {
  const file = `${directory}/${ids[i]}/reading-flow-independent-review.md`;
  assert(!fs.readFileSync(file, 'utf8').includes(finalSection), 'Do not overwrite a completed review');
  fs.appendFileSync(file, `\n${finalSection}\n\nReviewer: root, independently of the author. Entire revised manuscript, component owners, scoped styles and model reviewed. Final manuscript SHA256: \`${hash(manuscripts[i])}\`. The complete source/import/evidence hashes are retained in the integration checkpoint.\n\n${conclusions[i]}\n\nRoot personally inspected every distinct default mechanism at desktop and phone through readable cropped review sheets, then targeted final corrections and edited states. Final production checks pass transparent teaching surfaces, valid jump anchors, keyboard slider endpoints/interior/reset, copy feedback, canonical download bytes and zero render errors/overflow at1366,390,320 and768 with200% root text; separate normal768px geometry also passes. The final manifest is \`${manifestHash}\`. Root production capture includes195 painted figures across three capture settings and additional320px geometry. Capture alone does not constitute visual approval.\n\nIndependent implementation acceptance: **accepted**. [The integration record](../reading-flow-integration.md) owns current production/loading evidence and central phase completion. This is source/arithmetic/expert-heuristic review, not a learner study or universal best-diagram claim. User reading feedback is separate.\n`);
}

const checkedAt = new Date().toISOString();
fs.writeFileSync(`${directory}/reading-flow-integration.md`, `# First three LLM lessons: completed reading-flow revision\n\n6 October2026. User-authorized scope: the first three Large Language Models — Architecture, Training & Inference topics, full content/implementation improvements using the updated local lesson-authoring skill and three parallel authors. Root separately reviewed designs before implementation and complete source/paint before acceptance. No later LLM topic is included.\n\nEach manuscript now builds from concrete objects and worked operations into the retained specialist depth, code and practice. Actual structures replace generic prose figures: subword tries/links/lattices, UTF-8 bits/decoder states/causal grids/connected architectures, and multilingual dictionary/embedding/output/count/resource structures. Controls sit below their observable consequence with one purpose each. All ten canonical programs, data, solved practices, stable IDs, module order and publication mappings are preserved.\n\n## Review and corrections\n\nTopic-owned records retain full research, seven-question concept maps, visual specifications, research provenance and author evidence. Root independent reviews record each accepted whole-source result and bounded correction: simplified subword controls and readable quantities, uncrossed pruning labels, byte embedding/copy labels, and responsive multilingual reuse/coverage/embedding stages. Root personally inspected all distinct default mechanisms at desktop/phone and targeted final enlarged/edited correction states. Authors independently inspected their own meaningful edited/null/reset states and bound renewed receipts to the final build.\n\n## Final verification\n\nProduction build passes at manifest \`${manifestHash}\`. Root reader checks pass all three lessons at1366,390,320 and768 with200% root text, plus normal768px geometry. They check reading compass/jump anchors, unframed drawing surfaces, every live slider by keyboard, reset readouts, program expansion/copy feedback and exact canonical assets.195 figure captures are retained; capture itself is not approval. Root independently checks six complementary numerical/preservation groups and15 unchanged native inputs. Subword executes its actual teaching snippets; preserved CPU scientific receipts are reused only after exact program/model/data equivalence, rather than claiming another unchanged scientific run.\n\nThe original site verifier passes via an isolated-build adapter; the original loading verifier passes11cases covering selected-body/dependency isolation, metadata-only hub, prefetch/navigation, math renderer, planned outlines, stale completion, deliberate chunk failure and render-error recovery. Original shared verifier sources are not modified. This build retains the existing large-chunk warning; the scoped checks do not claim a general performance audit.\n\nFinal build rename propagation changed byte/vocabulary JS names despite unchanged topic sources. Their author browser verifiers were rerun rather than claiming literal compiled-byte equivalence. Earlier complete receipts/paints remain separately retained; final author comparison records justify only identical-image reuse, with changed images personally reopened. Earlier root failed-layout JSON remains diagnostic measurements: its reused screenshot paths are not independent frozen paint evidence. Final source/hash acceptance is carried by the successful final receipts.\n\n## Evidence and ownership\n\n- [Exact integration checkpoint](reading-flow-integration.json) binds complete content/implementation file maps, production and author receipts.\n- [Shared visual vocabulary](visual-vocabulary.md) records literal roles, shapes, wrapping and composition.\n- [Subword independent review](${ids[0]}/reading-flow-independent-review.md) and [full authored record](${ids[0]}/reading-flow-revision.md).\n- [Byte independent review](${ids[1]}/reading-flow-independent-review.md) and [full authored record](${ids[1]}/reading-flow-revision.md).\n- [Vocabulary independent review](${ids[2]}/reading-flow-independent-review.md) and [full authored record](${ids[2]}/reading-flow-revision.md).\n\nThe central delivery ledger owns revision3 phase state and preserves revision2 history. The shared deep-research registry is updated only for these three completed maps. Original rollback copies and old scientific receipts remain; unrelated concurrent teaching work is preserved. No commit, push or deployment is part of this request. User reading feedback remains pending. These are source-bound scientific and expert paint checks, with no learner trial, full GPU architecture reproduction or best-possible-design guarantee.\n`);

const commonFiles = [
  `${directory}/visual-vocabulary.md`, `${evidence}/browser.json`, `${evidence}/independent-numerics.json`,
  `${evidence}/site-build.json`, `${evidence}/intermediate-layout.json`, `${evidence}/load-boundaries.json`,
  'scripts/verify-tokenization-reading-flow.cjs', 'scripts/review-tokenization-reading-flow.mjs',
  'scripts/verify-tokenization-site-build.mjs', 'scripts/verify-tokenization-flow-loading.cjs',
  'scripts/verify-tokenization-intermediate-layout.cjs', 'scripts/verify-site-build.mjs',
  'scripts/verify-learning-load-boundaries.cjs', `${directory}/reading-flow-integration.md`,
];
const closure = file => {
  const files = new Set();
  function add(item) {
    item = item.replaceAll('\\', '/');
    if (files.has(item) || !fs.existsSync(item)) return;
    files.add(item);
    if (!/\.[cm]?[jt]sx?$/.test(item)) return;
    const source = fs.readFileSync(item, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
      const stem = path.join(path.dirname(item), match[1]);
      const next = [stem, ...['.js', '.jsx', '.mjs', '.css', '/index.js', '/index.jsx'].map(ext => stem + ext)]
        .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (next) add(next);
    }
  }
  add(file);
  return [...files];
};
const ledger = read('docs/teaching/lesson-delivery-progress.json');
const topicCheckpoints = {};
for (let i = 0; i < ids.length; i++) {
  const id = ids[i];
  assert.equal(ledger.topics[id].revision, 3);
  const specification = `${directory}/${id}/reading-flow-revision.md`;
  const contentFiles = [...new Set([...Object.keys(ledger.topics[id].content.files), manuscripts[i], specification])];
  const ownedRecords = fs.readdirSync(`${directory}/${id}`)
    .filter(file => /^reading-flow-.*\.(?:md|json)$/.test(file))
    .map(file => `${directory}/${id}/${file}`);
  const ownedReceipts = authorReceipts.filter(file => file.startsWith(`${directory}/${id}/`));
  const reviewed = [...new Set([...contentFiles, ...closure(manuscripts[i]), ...commonFiles, ...ownedRecords, ...ownedReceipts])];
  topicCheckpoints[id] = {
    content: { manuscript: manuscripts[i], visualSpecifications: specification,
      files: Object.fromEntries(contentFiles.map(file => [file, hash(file)])) },
    implementation: { reviewedFiles: Object.fromEntries(reviewed.map(file => [file, hash(file)])) },
  };
}
write(`${directory}/reading-flow-integration.json`, {
  checkedAt, passed: true, independentAcceptance: true, reviewer: 'root',
  acceptanceBasis: 'Actual complete-source, arithmetic and personally opened paint review recorded individually; gate checks are not automatic visual acceptance.',
  scope: ids, revision: 3, buildManifestHash: manifestHash,
  rootBrowserCaptures: browser.records.flatMap(row => row.states.flatMap(state => state.figures)).filter(figure => figure.screenshot).length,
  numericalGroups: numerics.checks.length, loadingCases: loading.results.length,
  evidenceHashes: Object.fromEntries([...commonFiles, ...authorReceipts].map(file => [file, hash(file)])),
  topicCheckpoints,
  limits: 'User acceptance pending; expert heuristic, no learner trial or GPU reproduction. Preserved scientific runs reused only with exact input equivalence. No later topics, deployment or unrelated-work recertification.',
});
console.log(JSON.stringify({ passed: true, checkedAt, manifestHash, topics: ids }));
