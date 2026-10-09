import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const owner=path.dirname(fileURLToPath(import.meta.url)), prep=path.dirname(owner);
const bind=p=>{const bytes=fs.readFileSync(p);return{path:p,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};};
const rows=[
 [12,'twelve','saved-digits-authoring','precision-corrections','D42–D45'],
 [13,'thirteen','representation-evaluation-authoring','representation-evaluation-authoring','D46–D49'],
 [14,'fourteen','identifiability-authoring','identifiability-authoring','D50–D52'],
 [15,'fifteen','anchors-authoring','anchors-authoring','D53–D56'],
 [16,'sixteen','text-spectra-authoring','precision-corrections','D57–D60'],
 [17,'seventeen','online-surrogate-authoring','online-surrogate-authoring','D61–D63'],
 [18,'eighteen','axis-phase-authoring','axis-phase-authoring','D64–D66'],
 [19,'nineteen','practice-resources-authoring','practice-resources-authoring','none: practice/resources'],
];
const sections=rows.map(([section,name,originalOwner,literalOwner,drawings])=>{
 const old=path.join(prep,originalOwner),handoffPath=path.join(old,`section-${name}-handoff.json`),metadata=JSON.parse(fs.readFileSync(handoffPath));
 for(const expected of metadata.bindings){const actual=bind(expected.path);if(actual.sha256!==expected.sha256||actual.bytes!==expected.bytes)throw Error(`Frozen source changed ${expected.path}`);}
 const literal=bind(path.join(prep,literalOwner,`section-${name}.md`));
 const sourceSlots=metadata.sourceSlots??[];
 for(const slot of sourceSlots)if(slot.identity&&bind(slot.identity.path).sha256!==slot.identity.sha256)throw Error('Source slot changed');
 return{section,drawings,literal,handoff:bind(handoffPath),sourceSlots,acceptedAnchor:metadata.acceptedAnchor??null,proseOnlyPrecisionSuccessor:literalOwner!==originalOwner};
});
const correction=bind(path.join(prep,'precision-corrections/correction-handoff.json'));
const expectedCorrection=JSON.parse(fs.readFileSync(correction.path));
for(const item of expectedCorrection.corrected)if(bind(item.successor.path).sha256!==item.successor.sha256||bind(item.original.path).sha256!==item.original.sha256)throw Error('Correction conservation failed');
const packet={status:'REMAINING_SECTIONS12_THROUGH19_ACTUAL_SCOPED_CONTENT_COMPLETE_PENDING_ROOT_ASSEMBLY_AND_DIFFERENT_WHOLE_REVIEW',author:'/root/nmf_initialization_author',created:new Date().toISOString(),sections,precisionCorrection:correction,readme:bind(path.join(owner,'README.md')),assemblySource:bind(fileURLToPath(import.meta.url)),scope:'Exact accepted NMF19 remaining slots; no master/canonical/public/runtime/phase edits.',evidenceBoundary:'Scoped source/numerical receipts retain each original role. Sections12–16 have a different staged read and local successor pending same-reviewer closure; sections17–19 need whole-content review. Never infer native acceptance from a source specification.',pending:'Root read/compose full19-section manuscript; adjudicate bounded amendments; continuous author pass and DIFFERENT whole-content review; subsequently runtime implementation/verification as separately authorized.'};
const target=path.join(owner,'remaining-content-handoff.json');
fs.writeFileSync(target,JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify({sections:sections.length,first:12,last:19,handoff:bind(target),scientificRuns:0}));
