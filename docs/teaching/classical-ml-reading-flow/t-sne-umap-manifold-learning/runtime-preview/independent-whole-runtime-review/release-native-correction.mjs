import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { getDeliveryState } from '../../../../../../scripts/lib/lesson-delivery.mjs';

const owner = 'docs/teaching/classical-ml-reading-flow/t-sne-umap-manifold-learning/runtime-preview/independent-whole-runtime-review';
const bind = path => { const bytes = fs.readFileSync(path); return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; };
const plan = bind(owner + '/consolidated-native-correction-plan.md');
const checks = bind(owner + '/consolidated-native-correction-plan-check.json');
assert.equal(plan.sha256, '622214895b86ec650f24945e19a353fb9c9d4fc115d00ba5643f45abf8099345');
assert.equal(checks.sha256, 'c235f5522d016976198a9836a5a16f8e6213dfdecc4374cba277dbb4db5aa6d4');
const reviewed = JSON.parse(fs.readFileSync(checks.path));
assert.equal(reviewed.inputs.length, 70);
let currentConditions = 3;
for (const input of reviewed.inputs) {
  const actual = bind(input.path);
  assert.equal(actual.sha256, input.sha256);
  assert.equal(actual.bytes, input.bytes);
  currentConditions += 2;
}
const ledgerBytes = fs.readFileSync('docs/teaching/lesson-delivery-progress.json');
const row = JSON.parse(ledgerBytes).topics['t-sne-umap-manifold-learning'];
assert.equal(row.revision, 5);
assert.equal(getDeliveryState(process.cwd(), row).content, 'complete');
assert.equal(row.implementation.status, 'in-progress');
currentConditions += 3;
const receipt = {
  schemaVersion: 1, at: new Date().toISOString(),
  status: 'CONSOLIDATED_NATIVE_CORRECTION_DESIGN_ACCEPTED_FOR_PRIVATE_AUTHOR_IMPLEMENTATION',
  root: '/root', author: '/root/tsne_probability_arrow_recovery',
  independentReviewer: '/root/ml_successor_independent_review',
  plan, sourceChecks: checks, currentConditions,
  reading: 'Root read the entire20703-byte consolidated report in actual0ac0c8; composed personal native observations19dff2c7/f191f2f4 with independent affected-source analysis. No new whole lesson or native coverage is inferred.',
  release: 'Implement all V1–V4 and extensions in one topic-owned private successor, retaining current effective overlay resolution. Amend manuscript/spec/runtime together for reading-order and deeper-mechanism changes with exact reversible deltas. Preserve original content receipt and scientific evidence.',
  scope: ['neighbour membership visibility', 'candidate/recipe/curve semantic colours', 'support/event/force annotation geometry', 'picture-first D09/D16/D20', 'fitted-state dependency flow', 'positive-mode actual changed lengths', 'component-constant null signals', 'x/height curvature', 'local transition/endpoint ownership'],
  limits: [
    'Release closes no implementation finding and does not promote either phase.',
    'Matched content amendments require independent closure and Root effective-content composition; no blind rehash.',
    'No canonical/public/shared/central author writes, unchanged scientific replay or new fitted experiment.',
    'One scoped successor build plus SAME source closure and Root affected native/normal integration remain required.',
  ],
};
const destination = owner + '/root-native-correction-release.json';
assert.ok(!fs.existsSync(destination));
assert.ok(fs.readFileSync('docs/teaching/lesson-delivery-progress.json').equals(ledgerBytes));
fs.writeFileSync(destination, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ receipt: bind(destination), currentConditions, phaseChanges: 0 }));
