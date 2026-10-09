import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const owner = path.dirname(fileURLToPath(import.meta.url));
const prep = path.dirname(owner);
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const identity = p => { const b = fs.readFileSync(p); return { path: p, bytes: b.length, sha256: hash(b) }; };
const report = path.join(prep, 'independent-content-review/sections-twelve-sixteen-review.md');
if (identity(report).sha256 !== 'e3d1e2c850a036448b705275001d74f755547ebc5d4dd562d16cb397e053f035') throw Error('Review source changed');
const costOld = 'Row contribution/reconstruction work is O(kd), selected contribution alone O(d); requested all-row reconstruction is O(nkd), and its n×d output is itself a storage cost.';
const costNew = 'For already validated factors, reconstructing one row takes O(kd), while multiplying one selected amount by its length-d pattern takes O(d) arithmetic and O(d) output. The delivered row_contribution wrapper first validates the whole k×d dictionary and the k-entry amount row through nonnegative_table and real_table: that copies/scans O(kd+k) input cells. Its end-to-end time is therefore O(kd+k), with O(kd+k+d) temporary/output storage, rather than O(d). This safety cost avoids trusting caller state; an internal validated kernel can reuse validated factors without those copies. Requested all-row reconstruction takes O(nkd) arithmetic, and its n×d output is itself a storage cost.';
const jobs = [
  { number: 12, name: 'twelve', oldOwner: 'saved-digits-authoring', replacements: [[costOld, costNew]] },
  { number: 16, name: 'sixteen', oldOwner: 'text-spectra-authoring', replacements: [['The open cone contains every nonnegative combination of both patterns.', 'The nonnegative cone contains every nonnegative combination of both patterns, including its zero and boundary cases.'], ['The open-cone answer', 'The cone-constrained NNLS answer']] },
];
const originals = [];
const corrected = [];
const conditions = [];
for (const job of jobs) {
  const oldDir = path.join(prep, job.oldOwner);
  const handoffPath = path.join(oldDir, `section-${job.name}-handoff.json`);
  const handoff = JSON.parse(fs.readFileSync(handoffPath));
  const guarded = [...handoff.bindings, ...(handoff.sourceSlots ?? []).filter(x => x.identity).map(x => x.identity), ...(handoff.suppliedOfflinePayloads ?? [])];
  for (const ref of guarded) {
    const actual = identity(ref.path);
    if (actual.sha256 !== ref.sha256 || actual.bytes !== ref.bytes) throw Error(`Changed frozen input ${ref.path}`);
    originals.push(actual);
  }
  originals.push(identity(handoffPath));
  for (const suffix of ['-template.md', '.md']) {
    const filename = `section-${job.name}${suffix}`;
    const oldPath = path.join(oldDir, filename);
    const old = fs.readFileSync(oldPath, 'utf8');
    let value = old;
    for (const [before, after] of job.replacements) {
      if (value.split(before).length !== 2 || value.includes(after)) throw Error(`Nonunique old/new phrase ${filename}`);
      value = value.replace(before, after);
    }
    let inverse = value;
    for (const [before, after] of [...job.replacements].reverse()) inverse = inverse.replace(after, before);
    if (inverse !== old) throw Error(`Inverse failed ${filename}`);
    const newPath = path.join(owner, filename);
    if (fs.existsSync(newPath)) throw Error(`Refuse overwrite ${filename}`);
    fs.writeFileSync(newPath, value);
    if (fs.readFileSync(newPath, 'utf8') !== value) throw Error('Readback failed');
    corrected.push({ section: job.number, original: identity(oldPath), successor: identity(newPath), replacements: job.replacements });
    conditions.push({ name: `${filename}: unique replacements, exact inverse and complete readback`, passed: true });
  }
  const spec = fs.readFileSync(path.join(oldDir, 'visual-specifications.md'), 'utf8');
  if (job.number === 16 && /open[- ]cone/i.test(spec)) throw Error('Incorrect cone in unchanged visual specification');
}
for (const item of originals) if (identity(item.path).sha256 !== item.sha256) throw Error('Original mutated');
for (const file of ['nmf_factor_alignment.py','nmf_arrays.py','centered_pca.py']) originals.push(identity(path.join(prep,'content-programs',file)));
const receipt = { status: 'LOCAL_PRECISION_SUCCESSOR_PENDING_SAME_REVIEWER_CLOSURE', author: '/root/nmf_initialization_author', created: new Date().toISOString(), report: identity(report), corrected, sourceSlots: {12: JSON.parse(fs.readFileSync(path.join(prep,'saved-digits-authoring/section-twelve-handoff.json'))).sourceSlots,16: JSON.parse(fs.readFileSync(path.join(prep,'text-spectra-authoring/section-sixteen-handoff.json'))).sourceSlots}, originals, conditions, evidence: { newScientificRuns: 0, sourceOnly: true, originalFrozenPacketsPreserved: true, codeAndNumericalOutputsUnchanged: true, exactInverse: true }, reviewQualification: 'R1 row_contribution directly validates through nonnegative_table/real_table rather than calling matching_factors; reviewed complexity finding is unchanged.', continuation: 'Root selects successor literal/template slots for sections12/16; reuse unchanged original source/output/spec slots. Same reviewer closes R1/R2, then whole1–19 review. No canonical/runtime/phase mutation.' };
fs.writeFileSync(path.join(owner,'correction-handoff.json'), JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({ corrected: corrected.map(x => x.successor), conditions: conditions.length, scientificRuns: 0 }));
