const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../../../..');
const owner = 'docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = relative => fs.readFileSync(path.join(root, relative));
const describe = relative => { const bytes = read(relative); return { path: relative, bytes: bytes.length, sha256: hash(bytes) }; };
const sourcePath = `${owner}/design-completion/programs-and-practice.md`;
const source = read(sourcePath);
if (hash(source) !== 'd501ca6df0eef4c58da45ce1da9347be58d67f753b265b584bb72331ef519e02') throw Error('Reviewed N1 source changed');
const original = source.toString('utf8');
const before = 'Half-square objective is `0.5*sum((X-WH)**2)`; MSE divides twice this by observed cell count, while a norm is its square root.';
const after = 'For unweighted observed residuals R=X−WH, the half-square objective is L=`0.5*sum(R**2)`. With N the number of observed cells, squared Frobenius norm is 2L, Frobenius norm is √(2L), MSE is 2L/N, and RMSE is √(2L/N). The public Frobenius reconstruction diagnostic maps to √(2L), never L or √L. Refuse an all-missing quality reduction (N=0); fractional masks require a separately stated weight/denominator convention, and non-Frobenius divergence diagnostics retain their independently checked mapping rather than inheriting these conversions.';
if (original.split(before).length !== 2) throw Error('Expected exactly one ambiguous diagnostic definition');
const corrected = original.replace(before, after);
if (corrected.replace(after, before) !== original) throw Error('Correction inverse not exact');
const identityPath = `${owner}/design-completion/source-identity.json`;
const identity = JSON.parse(read(identityPath));
const immutable = identity.bindings.filter(binding => binding.role !== 'current-mutable-global-guidance-not-historical-conservation-claim');
if (immutable.length !== 117 || identity.bindings.length !== 118) throw Error('Unexpected conservation scope');
for (const binding of immutable) {
  const current = describe(binding.path);
  if (current.bytes !== binding.bytes || current.sha256 !== binding.sha256) throw Error(`Immutable source changed: ${binding.path}`);
}
const residual = [3,4], count = residual.length;
const loss = residual.reduce((sum, value) => sum + value ** 2, 0) / 2;
const witness = { residual, observedCells: count, halfSquareLoss: loss, squaredFrobenius: 2 * loss, frobenius: Math.sqrt(2 * loss), mse: 2 * loss / count, rmse: Math.sqrt(2 * loss / count) };
if (witness.halfSquareLoss !== 12.5 || witness.frobenius !== 5 || witness.mse !== 12.5 || witness.rmse !== Math.sqrt(12.5)) throw Error('Direct metric witness failed');
const readyPath = `${owner}/design-completion/author-ready.json`, ready = JSON.parse(read(readyPath));
const correctedPath = `${owner}/design-correction-r1/programs-and-practice.md`, packetPath = `${owner}/design-correction-r1/author-ready.json`;
for (const destination of [correctedPath,packetPath]) if (fs.existsSync(path.join(root,destination))) throw Error('Refusing frozen successor overwrite');
fs.writeFileSync(path.join(root,correctedPath),corrected);
const mutable = identity.bindings.filter(binding => !immutable.includes(binding)).map(binding => ({ original: binding, current: describe(binding.path), qualification: 'Concurrent mutable guidance; excluded from historical equality' }));
const packet = {
  topic: 'non-negative-matrix-factorization-nmf', author: '/root', status: 'BOUNDED_R1_CORRECTION_FOR_SAME_REVIEWER_CLOSURE',
  predecessor: describe(readyPath), independentWholeReview: describe(`${owner}/independent-design-review/review-packet.json`), report: describe(`${owner}/independent-design-review/report.md`),
  correction: { finding: 'R1', source: describe(sourcePath), successor: describe(correctedPath), before, after, inverseExact: true },
  directMetricWitness: witness,
  effectiveContracts: ready.fullContracts.map(binding => binding.path === sourcePath ? { ...describe(correctedPath), role: binding.role } : binding),
  protectedIdentity: describe(identityPath), unchangedImmutableBindings: immutable.length, mutableGuidance: mutable,
  newScientificFits: 0, phaseChanges: 0, publicationChanges: 0,
  limits: 'Direct supplied residual arithmetic only. Whole original design review is retained; SAME R1 closure and Root entire corrected-design intake/release precede manuscript work. No runtime or content completion is claimed.'
};
fs.writeFileSync(path.join(root,packetPath),`${JSON.stringify(packet,null,2)}\n`);
console.log(JSON.stringify({status:packet.status,packet:describe(packetPath),successor:describe(correctedPath),witness,unchangedImmutableBindings:immutable.length,mutableGuidance:mutable}));
