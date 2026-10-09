// Author-only recovery of the exact effective predecessor. No build or science.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const owner=path.dirname(fileURLToPath(import.meta.url)),preview=path.dirname(owner),app=path.resolve(preview,'../../../../..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bind=file=>{const b=fs.readFileSync(file);return{path:path.relative(app,file).replaceAll('\\','/'),bytes:b.length,sha256:hash(b)};};
const previous=path.join(preview,'source-contract-correction/independent-review-correction/probability-arrows');
const sources={
 'ManifoldDrawing.jsx':path.join(preview,'ManifoldDrawing.jsx'),
 'ManifoldObjects.jsx':path.join(preview,'ManifoldObjects.jsx'),
 'ManifoldInvestigations.jsx':path.join(preview,'ManifoldInvestigations.jsx'),
 'GeometryFigures.jsx':path.join(preview,'GeometryFigures.jsx'),
 'AffinityFigures.jsx':path.join(previous,'reading-and-crowding/AffinityFigures.jsx'),
 'ManifoldOperationObjects.jsx':path.join(previous,'ManifoldOperationObjects.jsx'),
 'manifold-lesson.jsx':path.join(preview,'manifold-lesson.jsx'),
 'manifold-reader.css':path.join(previous,'relative-inline-math/manifold-reader.css'),
 'reading-flow-manuscript.md':path.join(preview,'../content-authoring/review-correction/reading-flow-manuscript.md'),
 'visual-and-investigation-specifications.md':path.join(preview,'../content-authoring/review-correction/visual-and-investigation-specifications.md'),
};
const prepared=path.join(owner,'predecessor-intake.json');if(fs.existsSync(prepared))throw Error('Predecessor intake already exists; do not overwrite it.');
fs.mkdirSync(path.join(owner,'predecessors'),{recursive:true});
const rows=[];
for(const [name,source]of Object.entries(sources)){
 const raw=fs.readFileSync(source),backup=path.join(owner,'predecessors',name),out=path.join(owner,name);if(fs.existsSync(out)||fs.existsSync(backup))throw Error(`Refuse existing source ${name}`);
 fs.writeFileSync(backup,raw);
 let text=raw.toString('utf8');
 if(name.endsWith('.jsx'))text=text.replace(/^(import[^\n]*?from\s*|import\s*)(['"])(\.[^'"]+)\2/gm,(all,prefix,quote,spec)=>{const absolute=path.resolve(path.dirname(source),spec);let next=path.relative(owner,absolute).replaceAll('\\','/');if(!next.startsWith('.'))next='./'+next;return prefix+quote+next+quote;});
 fs.writeFileSync(out,text);
 rows.push({name,effectivePredecessor:bind(source),immutableBackup:bind(backup),normalizedStartingCopy:bind(out),importNormalizationOnly:name.endsWith('.jsx')});
}
const release=path.join(preview,'independent-whole-runtime-review/root-native-correction-release.json'),plan=path.join(preview,'independent-whole-runtime-review/consolidated-native-correction-plan.md');
const frozen={schema:'tsne-consolidated-native-correction-intake/v1',at:new Date().toISOString(),rootRelease:bind(release),independentPlan:bind(plan),rows,previousBuiltHandoff:bind(path.join(previous,'relative-inline-math/author-ready-built-source.json')),scope:'One private successor only. Original effective files, manuscripts, specifications, models, payloads, scientific programs/streams and prior native findings remain immutable.',builds:0};
fs.writeFileSync(prepared,JSON.stringify(frozen,null,2)+'\n');console.log(JSON.stringify({intake:bind(prepared),predecessors:rows.length,builds:0}));
