import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const b='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar';
const out=`${b}/runtime-training-correction`, sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const original=`${b}/runtime-inputs.json`, review=`${b}/runtime-review-training/inputs.json`;
assert.equal(sha(original),'d0a591510dea47847aa003bc0c28d3db5c68f00491a02efd404d00e9f4552ce8');
assert.equal(sha(review),'d1d7eb53b0587dd17b6026172880cbc01ab5ccbf2ba13f6848cc6d45aeb94fd5');
const previous=read(`${out}/predecessor.json`), files={};
let guards=0;
for(const packet of [original,review]) {
  for(const [p,h] of Object.entries(read(packet).files)) {
    const retained=previous.find(x=>x.path===p);
    assert.equal(sha(retained?.preserved??p),h,p);
    if(retained) files[retained.preserved]=h;
    files[p]=sha(p); guards++;
  }
  files[packet]=sha(packet);
}
assert.equal(sha('src/learn/components/lesson-labs/ConstrainedDecodingFoundations.jsx'),'1e209a81cfd4fe8b85faeabd06c21dad7874df4cbaf591b98ede53af7be421c7');
const report=read(`${out}/browser/report.json`);
assert.ok(report.passed&&report.outsideFunctionsAstEqual&&!report.errors.length);
assert.equal(read(`${out}/browser/paint-atlases/index.json`).atlases.length,36);
fs.writeFileSync(`${out}/author-review.md`, `# Bounded author correction — R1–R3\n\nRoot, 9 October 2026. Ready for the SAME different reviewer; no publication or acceptance is implied.\n\nThe original whole runtime review and its source-bound evidence remain preserved. Exactly four functions in ConstrainedDecodingFoundations.jsx changed: Bars, MaskedMass, VocabularyTrie and Utf8Bytes. The complementary AST check confirms every other top-level declaration is unchanged. Manuscript, numerical module, programs, saved model outcomes and public bundle remain unchanged; no scientific run was repeated.\n\nR1 now gives the white outline a real, explicitly selected legal-token state in both probability distributions. Its selector is separate from the grammar prefix; dead support removes every selection and Reset restores ID1. The caption explicitly distinguishes this selection from random sampling. The accepted manuscript sentence now has the promised actual marker. D07 inherits no selection by default.\n\nR2 draws successful tested edges solid white with a check, failed tested edges solid pink with a cross, and untested descendants dashed grey with skip. The count is derived from those same edges. Empty prefix, prefix b and dead prefix retain distinct token/node identities and independent white allowed-node rings. Prefix b tests four edges and prunes the b-to-a descendant.\n\nR3 labels the two valid tokenizations as reference and removes live white consumption marks from that reference. A separate actual selected-byte trace shows E2/82/AC, 82, or E2/41 as selected; consumed bytes have white marks and the first invalid byte has a pink cross. Only a complete valid sequence produces the euro character. Byte positions, incomplete and rejected results remain explicit.\n\nRoot read the complete changed component, shared drawing controls and UTF-8 model, then personally read all36 native-size atlases/all72 tiles in browser/paint-atlases. These contain all43 captured default, changed and pan observations across desktop1366/root16, phone390/root16 and enlarged768/root32. The recorded88 control/state/containment checks passed with zero page errors and stable source. Zero consumption was checked on all profiles and painted on desktop. D09/D11 default mid/end horizontal pans were read on phone and enlarged layouts; changed-state right pans were not separately captured. Fixed-viewBox trailing whitespace is retained. This is affected author reading composed with the earlier whole author review, not a new whole different review or learner study.\n\nAll original and different-review inputs were checked with the exact predecessor component retained; the successor binds both unchanged current inputs and the changed component plus this bounded evidence. The SAME reviewer should close the three specific findings against this successor.\n`,{flag:'wx'});
function addTree(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())addTree(p);else files[p]=sha(p);}}
addTree(out);
for(const p of ['scripts/freeze-constrained-training-correction.mjs','scripts/correct-constrained-runtime-root.py','scripts/verify-constrained-training-correction.cjs','scripts/prepare-kv-cache-paint.py']) files[p]=sha(p);
const packet={status:'author-correction-ready-for-same-review',original,originalSha256:sha(original),differentReview:review,differentReviewSha256:sha(review),predecessorGuards:guards,findings:['R1','R2','R3'],files};
fs.writeFileSync(`${out}/inputs.json`,JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:`${out}/inputs.json`,sha256:sha(`${out}/inputs.json`),bindings:Object.keys(files).length,guards}));
