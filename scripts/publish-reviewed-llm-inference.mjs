// Root-owned publication of exact reviewed runtimes within frozen positions30–39.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
const base='docs/teaching/llm-architecture-training';
const scope=JSON.parse(fs.readFileSync(`${base}/inference-serving-scope.json`));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const bytesSha=b=>createHash('sha256').update(b).digest('hex');
const ids=process.argv.slice(2);assert.ok(ids.length&&new Set(ids).size===ids.length);
const rows=[],files={};
for(const id of ids){
 const topic=scope.topics.find(t=>t.id===id);assert.ok(topic,'Outside authorized ten-topic scope');
 const acceptance=`${base}/${id}/runtime-acceptance.json`,packet=JSON.parse(fs.readFileSync(acceptance));
 assert.equal(packet.accepted,true);assert.ok(packet.review&&packet.files[packet.review],'Different complete runtime review must be bound');
 for(const[p,h]of Object.entries(packet.files)){assert.equal(sha(p),h,p);files[p]=h;}
 assert.equal(sha(topic.source),topic.originalSha256,'Preserve protected original until guarded publication');
 const prepared=fs.readFileSync(packet.manuscript,'utf8');
 const mapped=prepared.replaceAll('../../../../src/learn/','../../');
 parse(mapped,{sourceType:'module',plugins:['jsx']});
 assert.equal(bytesSha(mapped),packet.publishedSha256,'Root must accept exact deterministic import mapping before publication');
 files[acceptance]=sha(acceptance);
 rows.push({...topic,acceptance,prepared:packet.manuscript,mapped,acceptedSha256:packet.publishedSha256,figures:packet.figures,count:packet.count,assets:packet.assets,...(packet.assetRoots?{assetRoots:packet.assetRoots}:{}),...(packet.assetFiles?{assetFiles:packet.assetFiles}:{})});
}
const folder=`${base}/integration/inference-serving/${new Date().toISOString().replace(/[:.]/g,'-')}`;
fs.mkdirSync(folder,{recursive:true});
for(const row of rows){
 assert.equal(sha(row.source),row.originalSha256,'Concurrent protected-source change');
 row.manuscript=`${folder}/${row.id}.jsx`;fs.writeFileSync(row.manuscript,row.mapped,{flag:'wx'});delete row.mapped;
 fs.copyFileSync(row.manuscript,row.source);files[row.source]=sha(row.source);files[row.manuscript]=sha(row.manuscript);
}
fs.writeFileSync(`${folder}/accepted-sources.json`,JSON.stringify({at:new Date().toISOString(),scope:ids,files},null,2)+'\n',{flag:'wx'});
const build=process.env.LLM_BUILD_DIRECTORY||'dist-llm-inference-serving';
assert.match(build,/^dist-llm-inference-serving(?:-[a-z0-9-]+)?$/,'Use a distinct scoped build directory');
fs.writeFileSync(`${folder}/publication.json`,JSON.stringify({at:new Date().toISOString(),rows,build,note:'Local canonical installation of reviewed source, with exact accepted relative-import mapping. Production build/browser/loading checks and phase completion remain separate.'},null,2)+'\n',{flag:'wx'});
console.log(folder);
