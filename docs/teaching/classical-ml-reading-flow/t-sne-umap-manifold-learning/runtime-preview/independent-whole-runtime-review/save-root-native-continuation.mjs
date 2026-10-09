import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const owner = 'docs/teaching/classical-ml-reading-flow/t-sne-umap-manifold-learning/runtime-preview/independent-whole-runtime-review';
const bind = path => { const bytes = fs.readFileSync(path); return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; };
const previous = bind(owner + '/root-native-reading-review.json');
assert.equal(previous.sha256, '19dff2c76bdfba8f93eb7aa34e7a8479ab7b41fcf89a75c73b7d3b4817ab7402');
const prior = JSON.parse(fs.readFileSync(previous.path));
for (const source of prior.sourceBindings) {
  const actual = bind(source.path);
  assert.equal(actual.sha256, source.sha256);
  assert.equal(actual.bytes, source.bytes);
}
const receipt = {
  schemaVersion: 1,
  at: new Date().toISOString(),
  status: 'ADDITIONAL_NATIVE_READING_COMPLETE_FOR_STATED_VIEWS_CONSOLIDATED_CORRECTIONS_REQUIRED',
  reviewer: '/root', previous, sourceFreeze: prior.sourceFreeze,
  sourceBindings: prior.sourceBindings,
  currentSourceConditions: prior.sourceBindings.length,
  preview: 'http://127.0.0.1:5199/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml',
  surface: { browser: '2', tab: '3', viewport: [1280, 720], override: false, rootText: 16 },
  method: 'Actual CUA screenshots personally read in the conversation, with region innerText and exact observed aria-label targets. No local screenshot files, new build or scientific execution.',
  observations: [
    { mechanism: 'D26', actual: 'Entire distance ruler and weighted-product bars painted. Query/B/C identity colours agree; local radius arithmetic and API branch text read. Earlier failed multi-action attempt is not counted as paint.' },
    { mechanism: 'D27', actual: 'Earlier continued window exposed full PCA/t-SNE plots; this turn exposes full third UMAP plot. Shared neutral encoding intentionally avoids a class-supervision implication. All historical score/rank text read previously; not every table cell painted.' },
    { mechanism: 'D29', actual: 'Earlier window exposed P5/P30 equality plots; current full P80 and both random-initialized maps painted. Exact coincident coordinates are not jittered. Scores/equality/seed roles are explicit.' },
    { mechanism: 'D30', actual: 'Earlier continued windows showed full train/validation matrices and symbolic five-neighbor graph; whole region text read. Eight separate matrices do not visibly connect training-only fitting to the shared state and both transforms. Repeated schematic-extents qualification interrupts the sequence. Not all matrices/results bars painted.' },
    { mechanism: 'D31', actual: 'Earlier continued windows showed full encoder64→16→2 wiring, fixed-reference openTSNE route and symbolic supervised target/input graph dependency. PCA/interpolation subviews were only partially painted in that continuation.' },
    { mechanism: 'D32', actual: 'Earlier continued window showed full n×n×D allocation object. Row buffer/full pair matrix subviews only partial in that pass. No memory measurement or fit claim.' },
    { mechanism: 'D33', actual: 'Full ANN/quadtree pair and field/interpolation diagrams painted; distribution/kernel parts partially painted. Entire region text read. Return arrows are almost collinear and lack local T0–T3 ownership; field-node identity is locally labelled in preceding view. Table supplies values, but the return drawing needs traceable contributions.' },
    { mechanism: 'D34', actual: 'Squared distance table, Gram AB entry and centered coordinate ruler painted; input ruler partly clipped at top. Complete text read; stated transformation is traceable through its numerical AB example.' },
    { mechanism: 'D35', actual: 'Unit eigenvector/stretch pair, Gram-entry comparison, impossible triangle ruler, negative spectrum and clipped-spectrum views painted in overlapping windows, with some top/bottom edges clipped. Complete region text read. Clipped eigenvalue markers alone do not show the claimed altered pair distances; constructed positive-mode coordinates/lengths should make that consequence inspectable. Coincident-ID final subview not fully painted.' },
    { mechanism: 'D36', actual: 'Entire seven-node route matrix and centered1D line painted. Complete refusal/graph-change region text read.' },
    { mechanism: 'D37', actual: 'Both offset-arrow recipes, full negative-weight mapped extrapolation and partial map ruler/contribution bars painted. Confirmed input i blue/R pink become mapped extrapolation i pink/R blue; contribution R is default blue. Source reviewer confirms ordinary map ruler already has correct L/i/R colours; do not describe that ruler as faulty.' },
    { mechanism: 'D38', actual: 'Full sparse W and row-A support drawing painted, adjacent I−W/M tops visible. Whole region text read. Later collapsed/normalized map subviews not fully painted here.' },
    { mechanism: 'D39', actual: 'Both adjacency/L tables and full two-component drawing painted. The graph drawing supplies disconnected edges but no actual component-constant signals promised in the visual contract. Whole region text read; energy lab retains earlier live evidence.' },
    { mechanism: 'D40', actual: 'Full orthographic five-point patch and residual table, alignment cross-product/table and recovered triangle painted. Earlier/next alignment and height-stencil subviews partial. Whole region text read. Tangent axes/residual arrows need direct local labels; height-only Line conceals actual x/h curvature operation, corroborated by independent source reading.' },
    { mechanism: 'D41', actual: 'Full directed-chain drawing and transition matrix painted; start/time bars partly painted. Arrows have direction but no local1/.5 ownership labels. Complete region text read.' },
    { mechanism: 'D42', actual: 'Full filled-square and abstract filled-tetrahedron pair painted; prior threshold loop views, threshold ruler and projected-ID ruler partly visible. Complete region text read. Abstract display coordinates are explicitly separate from original square; no topology experiment claimed.' },
    { mechanism: 'D43', actual: 'Both full AB/BA ordered derivative chains painted with signed values and operations. Common-Z twelve-bar wiring and full ordered derivative table painted except top AB and final bottom caption cut by viewport. Mechanism/source text and zero/nonzero ownership were read; no new derivative campaign.' },
    { mechanism: 'D44', actual: 'Full endpoint ruler and preserved-result table painted. Hollow initial versus filled retained-final markers need a direct legend; exact values/no-intermediate-trajectory qualification remain.' },
    { mechanism: 'D45', actual: 'Full query/candidate ruler and two-row candidate bars, upper positive/noise distributions painted. Whole region text read. Confirmed B blue/C pink shift to B amber/C blue only in two-candidate normalization bars; A/B/C positive/noise distributions already aligned.' },
  ],
  additionalFindings: [
    { id: 'V1-extension', locations: ['D37 mapped extrapolation/contributions', 'D45 two-candidate bars'], required: 'Preserve explicit semantic entity colours across connected views; do not change already-correct map ruler or full distributions.' },
    { id: 'V2-extension', locations: ['D33 return arrows', 'D40 tangent/residual arrows', 'D41 transitions', 'D44 endpoints'], required: 'Expose local ownership/value/marker meanings with clear direct labels, leaders or contribution lanes; preserve quantitative geometry.' },
    { id: 'V4', locations: ['D30', 'D35', 'D39', 'D40'], required: 'Open the dependency or consequence promised by the text: fitted-state flow; positive-mode changed distances; actual null-mode signals; x/height finite differences. Reconcile actual content/spec/runtime where needed, preserving derivation and numerical roles.' },
  ],
  failedActions: [
    'Earlier D26 screenshot in a multi-action call was lost when the subsequent D27 blank SVG click failed; this turn D26 is freshly painted successfully.',
    'Earlier D27 blank center click failed with no hit node; a fresh screenshot recovered the scrolled PCA/t-SNE surface. This turn exact third UMAP drawing click succeeds.',
    'Prior tab was absent in current browser2 list. Reopened the exact already-serving5199 preview as tab3; no rebuild, browser reselection or preview restart.',
  ],
  limits: [
    'This is a bounded actual-paint complement with explicit subview limits, not full pixel coverage of all45 mechanisms or an observed beginner study.',
    'Current pass used desktop default only. Corrected source will require affected desktop/narrow/enlarged paint and behavioral review.',
    'No clipboard, OS file payload, normal other-topic navigation, canonical/public integration or phase completion claim.',
    'Prior whole independent source review and original science remain attributed; current source identity alone does not prove pedagogical quality.',
  ],
  nextAction: 'Different reviewer completes one consolidated source-counterpart/correction plan from both Root receipts; original author implements matched content/spec/runtime successor, followed by SAME closure and Root affected native/normal integration.',
};
const destination = owner + '/root-native-reading-continuation.json';
assert.ok(!fs.existsSync(destination));
fs.writeFileSync(destination, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ receipt: bind(destination), currentSourceConditions: prior.sourceBindings.length }));
