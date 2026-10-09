import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'../../../../../..');
const programs=path.resolve(directory,'../content-programs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bind=file=>{const bytes=fs.readFileSync(file);return {path:file,bytes:bytes.length,sha256:hash(bytes)};};
const source=path.join(root,'src/learn/data/nmf-data.js');
const sourceBytes=fs.readFileSync(source);
if(hash(sourceBytes)!=='40cd6b9079da9601743be3599b4c9d3087f62b074823a4cd83f46267eff1cbbe')throw new Error('Saved source changed; assess before extracting');
const match=sourceBytes.toString('utf8').match(/export const NMF_DIGITS = (\{[^\n]*\});/);
if(!match)throw new Error('Expected literal JSON export, never evaluate JavaScript');
const saved=JSON.parse(match[1]);
const csv=path.join(root,'public/learn-assets/nmf/digits-300.csv');
if(bind(csv).sha256!==saved.datasetSha256)throw new Error('Saved CSV identity mismatch');
const provenance=path.join(root,'public/learn-assets/nmf/data-provenance.md');
const writeExact=(target,bytes)=>{
  if(fs.existsSync(target)){if(!fs.readFileSync(target).equals(bytes))throw new Error(`Refuse overwrite ${target}`);}
  else fs.writeFileSync(target,bytes,{flag:'wx'});
};
writeExact(path.join(programs,'nmf_saved_state.json'),Buffer.from(JSON.stringify(saved,null,2)+'\n'));
writeExact(path.join(programs,'digits-300.csv'),fs.readFileSync(csv));
writeExact(path.join(programs,'digits-data-provenance.md'),fs.readFileSync(provenance));
const packet={status:'EXACT_OFFLINE_SAVED_PAYLOAD_EXTRACTED_NOT_REFITTED',source:bind(source),
  sourceCSV:bind(csv),sourceProvenance:bind(provenance),
  payloads:['nmf_saved_state.json','digits-300.csv','digits-data-provenance.md'].map(name=>bind(path.join(programs,name))),
  completeParsedExportConserved:JSON.stringify(JSON.parse(fs.readFileSync(path.join(programs,'nmf_saved_state.json'),'utf8')))===JSON.stringify(saved),
  scientificFits:0,historicalMainExecutions:0,
  limits:'JSON is the complete parsed NMF_DIGITS export, not the historical physical JavaScript file. CSV/provenance siblings are exact offline teaching supplies; no public files changed.'};
writeExact(path.join(directory,'saved-payload.json'),Buffer.from(JSON.stringify(packet,null,2)+'\n'));
console.log(JSON.stringify(packet));
