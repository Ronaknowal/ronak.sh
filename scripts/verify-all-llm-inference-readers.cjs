// Final cross-topic smoke check of the single production preview offered to user.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const folder=process.env.LLM_INTEGRATION_DIRECTORY;
const base=process.env.LLM_PRODUCTION_BASE;
assert.ok(folder&&base);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const scope=JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/inference-serving-scope.json'));
 assert.equal(scope.topics.length,10);
 const publication=JSON.parse(fs.readFileSync(`${folder}/publication.json`));
 const manifest=JSON.parse(fs.readFileSync(`${publication.build}/.vite/manifest.json`));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000}});
 const errors=[],rows=[];
 page.on('pageerror',error=>errors.push(error.message));
 const output=`${folder}/all-ten-reader`;fs.mkdirSync(output,{recursive:true});
 try{
  for(const topic of scope.topics){
   const acceptance=`docs/teaching/llm-architecture-training/${topic.id}/runtime-acceptance.json`;
   const accepted=JSON.parse(fs.readFileSync(acceptance));
   assert.equal(accepted.accepted,true);
   assert.equal(sha(topic.source),accepted.publishedSha256,topic.id);
   assert.ok(manifest[topic.source]?.isDynamicEntry,topic.id);
   const response=await page.goto(`${base}/learn/path/full-curriculum/${topic.id}?module=large-language-models`,{waitUntil:'domcontentloaded',timeout:90000});
   assert.equal(response.status(),200);
   await page.waitForFunction(({selector,count})=>document.querySelectorAll(selector).length===count,{selector:accepted.figures,count:accepted.count},{timeout:90000});
   assert.equal(await page.locator('.katex-error').count(),0);
   const heading=await page.locator('h1').innerText();assert.ok(heading.trim());
   const sections=await page.locator('h2[id]').count();assert.ok(sections>=8);
   await page.screenshot({path:`${output}/${topic.id}.png`});
   const asset=manifest[topic.source].file;
   const emitted=await page.request.get(`${base}/${asset}`);assert.equal(emitted.status(),200);
   const servedSha=createHash('sha256').update(await emitted.body()).digest('hex');
   assert.equal(servedSha,sha(`${publication.build}/${asset}`));
   rows.push({id:topic.id,heading,sections,figures:accepted.count,sourceSha256:sha(topic.source),acceptanceSha256:sha(acceptance),entry:asset,servedEntrySha256:servedSha});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${folder}/all-ten-reader.json`,JSON.stringify({passed:true,scope:'All ten exact reviewed lesson bodies in the final shared production preview; prior whole reviews and detailed per-topic checks remain separate',base,build:publication.build,manifestSha256:sha(`${publication.build}/.vite/manifest.json`),rows,errors},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({passed:true,topics:rows.length,figures:rows.reduce((n,r)=>n+r.figures,0)}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
