// Source/array correspondence only; imports data literals, not historical fits.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const owner=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(owner,'../../../..');
const {MANIFOLD_DIGITS:d}=await import(pathToFileURL(path.join(root,'src/learn/data/manifold-data.js')));
const {manifoldExamples:e}=await import(pathToFileURL(path.join(root,'src/learn/data/manifold-examples.js')));
const {default:m}=await import(pathToFileURL(path.join(root,'src/learn/data/manifold-mechanism-program.js')));
const read=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=x=>{throw new Error(x);};
const j=JSON.parse(read('public/learn-assets/manifold-learning/calculated-inputs.json'));
const csv=read('public/learn-assets/manifold-learning/digits-300.csv').toString().trim().split(/\r?\n/).slice(1).map(s=>s.split(',').map(Number));
if(csv.length!==300||d.rows.length!==300||new Set(d.rows.map(r=>r.sourceRow)).size!==300)fail('IDs');
for(let i=0;i<300;i++){
 const r=d.rows[i];
 if(JSON.stringify(csv[i])!==JSON.stringify([r.sourceRow,r.digit,...r.pixels]))fail('CSV row');
 if(r.pixels.length!==64||!r.pixels.every(v=>Number.isInteger(v)&&v>=0&&v<=16))fail('pixel shape');
}
const layouts=d.layouts.map(l=>{
 const saved=j.layouts[l.key];
 if(!saved||JSON.stringify(l.coordinates)!==JSON.stringify(saved.coordinates)||JSON.stringify(l.metrics)!==JSON.stringify(saved.metrics))fail('saved layout '+l.key);
 if(l.coordinates.length!==300||!l.coordinates.every(r=>r.length===2&&r.every(Number.isFinite)))fail('layout shape');
 return {key:l.key,rows:l.coordinates.length,coordinateSha256:hash(JSON.stringify(l.coordinates)),metrics:l.metrics};
});
const programs=[...Object.entries(e).map(([key,v])=>({key,file:v.file,source:v.code,stream:v.expected})),{key:'umapMechanism',file:'umap-mechanism.py',source:m.source,stream:m.output}].map(p=>{
 const publicBytes=read('public/learn-assets/manifold-learning/'+p.file);
 const remote=p.source.startsWith('/learn-assets/');
 const display=remote?read('public'+p.source).toString():p.source;
 const normalized=publicBytes.toString().replace(/\r\n/g,'\n').trimEnd();
 if(normalized!==display.replace(/\r\n/g,'\n').trimEnd())fail('source display mismatch '+p.file);
 return {key:p.key,file:p.file,publicSha256:hash(publicBytes),displaySha256:hash(display),streamSha256:hash(p.stream),stream:p.stream,role:'retained previously executed source/output; not executed by this intake',remoteSource:remote?p.source:null,comparison:'LF-normalized trailing whitespace only; raw hashes retained separately'};
});
const headings={};
for(const id of ['pca-dimensionality-reduction','clustering-evaluation-validation-silhouette-ari-nmi','support-vector-machines-svm']){
 const s=read('src/learn/data/topics/'+id+'.jsx').toString();
 headings[id]=[...s.matchAll(/<H2>\{"([^"]+)"\}<\/H2>/g)].map(x=>x[1]);
}
const result={scope:'literal data, source/display correspondence and prerequisite headings; no fit or old main/checker',rows:300,features:64,pixels:19200,layouts,programs,headings,versions:d.versions,originalLayoutVersions:d.originalLayoutVersions};
fs.writeFileSync(path.join(owner,'intake-inspection.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({rows:300,layouts:layouts.length,programs:programs.length,headings,intakeSha256:hash(fs.readFileSync(path.join(owner,'intake-inspection.json')))}));
