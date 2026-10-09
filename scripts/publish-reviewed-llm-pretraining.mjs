import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='docs/teaching/llm-architecture-training',scope=JSON.parse(fs.readFileSync(`${root}/pretraining-alignment-scope.json`)),sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ids=process.argv.slice(2);assert.ok(ids.length&&new Set(ids).size===ids.length);const rows=[],files={};
const manifestPath='src/learn/data/lesson-manifest.json';
const originalManifest=fs.readFileSync(manifestPath);
const manifest=JSON.parse(originalManifest);
for(const id of ids){
  const topic=scope.topics.find(t=>t.id===id);assert.ok(topic);
  const acceptance=`${root}/${id}/runtime-acceptance.json`,packet=JSON.parse(fs.readFileSync(acceptance));
  assert.equal(packet.accepted,true);
  for(const [p,h]of Object.entries(packet.files)){assert.equal(sha(p),h,p);files[p]=h}
  let source=topic.source;
  if(source){assert.equal(sha(source),topic.originalSha256,`Protected source changed: ${id}`);}
  else{
    assert.equal(topic.originalSha256,null,'Only a scope-frozen new topic may register');
    assert.ok(/^[a-z0-9-]+$/.test(id));
    assert.ok(!Object.hasOwn(manifest,id),'New topic is already registered');
    source=`src/learn/data/topics/${id}.jsx`;
    assert.ok(!fs.existsSync(source),'Do not overwrite an unregistered source');
    manifest[id]=`./topics/${id}.jsx`;
  }
  files[acceptance]=sha(acceptance);
  rows.push({...topic,source,newRegistration:!topic.source,manuscript:packet.manuscript,acceptedSha256:sha(packet.manuscript),acceptance,figures:packet.figures,count:packet.count,assets:packet.assets,...(packet.assetRoots?{assetRoots:packet.assetRoots}:{}),...(packet.assetFiles?{assetFiles:packet.assetFiles}:{})});
}
const folder=`${root}/integration/pretraining-alignment/${new Date().toISOString().replace(/[:.]/g,'-')}`;fs.mkdirSync(folder,{recursive:true});
assert.ok(fs.readFileSync(manifestPath).equals(originalManifest),'Concurrent publication manifest edit');
for(const row of rows){fs.copyFileSync(row.manuscript,row.source);files[row.source]=sha(row.source)}
if(rows.some(row=>row.newRegistration)){
  assert.ok(fs.readFileSync(manifestPath).equals(originalManifest),'Concurrent publication manifest edit');
  fs.writeFileSync(`${folder}/lesson-manifest-before.json`,originalManifest,{flag:'wx'});
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  // The integration binds this registration. Topic runtime/content packets and
  // the frozen scope remain unchanged; later registrations may evolve the manifest.
  files[manifestPath]=sha(manifestPath);
  files[`${folder}/lesson-manifest-before.json`]=sha(`${folder}/lesson-manifest-before.json`);
}
fs.writeFileSync(`${folder}/accepted-sources.json`,JSON.stringify({at:new Date().toISOString(),scope:ids,files},null,2)+'\n');fs.writeFileSync(`${folder}/publication.json`,JSON.stringify({at:new Date().toISOString(),rows,build:'dist-llm-pretraining-alignment',note:'Guarded local publication; build/browser/loading and implementation completion follow separately.'},null,2)+'\n');
console.log(folder);
