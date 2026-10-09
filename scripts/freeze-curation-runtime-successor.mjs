import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {repetition,surprise,reference} from '../src/learn/data/curation-pipeline-models.js';
const folder='docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const predecessor=`${folder}/runtime-inputs.json`;assert.equal(sha(predecessor),'2076214113d66c9fa3efff1b1cb0004a95be908f92ba9344477b36275af029c1');
const before=JSON.parse(fs.readFileSync(predecessor));
const changed=['src/learn/components/lesson-labs/CurationPipelineFlow.jsx','src/learn/components/lesson-labs/curation-pipeline-flow.css','src/learn/data/curation-pipeline-models.js'];
for(const[p,h]of Object.entries(before.files)){assert.equal(sha(changed.includes(p)?`${folder}/runtime-predecessor/${path.basename(p)}`:p),h,p);}
for(const[p,h]of Object.entries(before.contentBindings))assert.equal(sha(p),h,p);
const separators=['\n','\r','\r\n','\v','\f','\u001c','\u001d','\u001e','\u0085','\u2028','\u2029'];
const texts=[...separators.map(s=>`aaaa${s}b${s}aaaa`),' a\u001fb \na b','\ufeffx\nx','😀\n😀',' \n\t'];
const py=spawnSync(path.resolve('scratch/lesson-tools/Scripts/python.exe'),['-B','-X','utf8','-c',"import json,sys;sys.path.insert(0,'public/learn-code/data-curation-pipelines');from curation_signals import signals;print(json.dumps([dict(signals(s),words=s.split()) for s in json.load(sys.stdin)]))"],{input:JSON.stringify(texts),encoding:'utf8'});assert.equal(py.status,0,py.stderr);
const expected=JSON.parse(py.stdout);texts.forEach((text,i)=>{const js=repetition(text),e=expected[i];assert.equal(js.rows.length,e.nonempty_lines);assert.equal(js.characters,e.line_characters);assert.equal(js.duplicateLines,e.duplicate_lines);assert.equal(js.duplicateCharacters,e.duplicate_characters);assert.equal(js.characterShare,e.duplicate_character_share);assert.deepEqual(surprise(text,reference('general')).rows.map(r=>r.word),e.words);});
const files={...before.files};for(const p of changed)files[p]=sha(p);
for(const p of [predecessor,`${folder}/runtime-review.md`,`${folder}/runtime-independent-probes-initial.json`,`${folder}/runtime-author-successor.md`,'scripts/verify-curation-runtime-successor.cjs','scripts/freeze-curation-runtime-successor.mjs'])files[p]=sha(p);
for(const p of changed)files[`${folder}/runtime-predecessor/${path.basename(p)}`]=sha(`${folder}/runtime-predecessor/${path.basename(p)}`);
for(const name of fs.readdirSync(`${folder}/browser-author-successor`)){const p=`${folder}/browser-author-successor/${name}`;files[p]=sha(p);}
const output={author:'root',status:'ready for bounded different closure',predecessor:sha(predecessor),contentBindings:before.contentBindings,files,changed,verification:{nativeCases:15,fields:['line count','characters','duplicate lines','duplicate characters','character share','Python word segmentation'],browser:'33 successor paints; three layout/control/keyboard groups; no page overflow or errors',fitsReplayed:0},scope:'Three changed runtime files; every other original293 binding and all41 content bindings preserved'};
fs.writeFileSync(`${folder}/runtime-successor.json`,JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({files:Object.keys(files).length,sha256:sha(`${folder}/runtime-successor.json`)}));
