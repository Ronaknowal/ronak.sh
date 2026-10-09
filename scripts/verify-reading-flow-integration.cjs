// Integrate individually source-reviewed lessons without replacing historical receipts.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const flag=process.argv.indexOf('--topics');
const ids=flag>=0?process.argv[flag+1]?.split(',').filter(Boolean):[];
assert.ok(ids.length,'Supply --topics with individually reviewed stable IDs.');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const base=process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4812';
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
const files=Object.fromEntries(ids.flatMap(id=>Object.keys(ledger.topics[id].content.files).map(file=>[file,hash(file)])));
for(const id of ids) {
  assert.equal(ledger.topics[id].content.status,'complete');
  assert.equal(ledger.topics[id].implementation.status,'in-progress');
  for(const [file,identity] of Object.entries(ledger.topics[id].content.files)) assert.equal(hash(file),identity,`Stale content checkpoint ${file}`);
}
const report={passed:false,checkedAt:new Date().toISOString(),base,topics:ids,sourceHashes:files,commands:[],pages:[],scope:'Shared current production integration for these individual reviewed revisions. Does not certify unselected lessons or assert user acceptance.'};
report.verifierSha256=hash(__filename);
const reuseFlag=process.argv.indexOf('--reuse-build');
const reusePath=reuseFlag>=0?process.argv[reuseFlag+1]:null;
let reusable;
if(reusePath) {
 reusable=JSON.parse(fs.readFileSync(reusePath));
 assert.deepEqual(reusable.topics,ids,'Reuse only the same topic increment');
 assert.deepEqual(reusable.sourceHashes,files,'Build reuse requires exact current content bindings');
 assert.equal(reusable.base,base,'Reuse only the same serving environment');
 assert.equal(reusable.manifestSha256,hash('dist/.vite/manifest.json'),'Production build changed');
 assert.equal(reusable.commands.length,4,'All required build/static checks must have passed');
 assert.ok(reusable.commands.every(command=>command.exitCode===0));
 assert.equal(reusable.loading.passed,true,'Loading evidence must have passed');
 const loading=JSON.parse(fs.readFileSync(reusable.loading.receipt));
 assert.equal(loading.manifestSha256,reusable.manifestSha256);
 assert.deepEqual(loading.sourceHashes,files);
 report.reusedBuild={receipt:reusePath,sha256:hash(reusePath),commands:reusable.commands,reason:'Only the browser verifier changed; exact runtime/content/build and passing loading evidence are reused without another build.'};
}
const run=(command,args)=>{
 const start=Date.now();
 const output=execFileSync(process.execPath,[command,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
 report.commands.push({command:`node ${[command,...args].join(' ')}`,exitCode:0,seconds:(Date.now()-start)/1000,summary:output.length<2500?output:output.slice(-1800)});
 return output;
};
fs.mkdirSync('scratch/reading-flow',{recursive:true});
if(!reusable) {
 run('node_modules/vite/bin/vite.js',['build']);
 run('scripts/verify-site-build.mjs',[]);
 run('scripts/verify-repository-files.mjs',[]);
 run('scripts/verify-learning-artifacts.mjs',[]);
}
report.manifestSha256=hash('dist/.vite/manifest.json');
const scratchReceipt='scratch/learning-performance/load-boundaries.json';
const prior=fs.existsSync(scratchReceipt)?fs.readFileSync(scratchReceipt):null;
const integrationFolder='docs/teaching/deep-learning-beginner/integration';
fs.mkdirSync(integrationFolder,{recursive:true});
const stamp=new Date().toISOString().replaceAll(':','-');
const loadingFile=`${integrationFolder}/${stamp}-loading.json`;
if(reusable) report.loading={...reusable.loading,reused:true};
else try {
 const start=Date.now();
 execFileSync(process.execPath,['scripts/verify-learning-load-boundaries.cjs','--topics',ids.join(',')],{encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,PERFORMANCE_BASE_URL:base}});
 const loading=JSON.parse(fs.readFileSync(scratchReceipt));
 loading.sourceHashes=files;
 loading.manifestSha256=report.manifestSha256;
 loading.verifierSha256=hash('scripts/verify-learning-load-boundaries.cjs');
 fs.writeFileSync(loadingFile,JSON.stringify(loading,null,2)+'\n');
 report.loading={passed:true,seconds:(Date.now()-start)/1000,receipt:loadingFile,cases:loading.results.length};
} finally {
 if(prior) fs.writeFileSync(scratchReceipt,prior); else if(fs.existsSync(scratchReceipt)) fs.unlinkSync(scratchReceipt);
}
(async()=>{
 const {topicMap}=await import('../src/learn/data/catalogue.js');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const id of ids) {
   const context=await browser.newContext({viewport:{width:1366,height:900}});
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',request=>requests.push(request.url()));
   const moduleId=topicMap[id]?.trackId;
   assert.ok(moduleId,`No catalogue module for ${id}`);
   await page.goto(`${base}/learn/path/full-curriculum/${id}?module=${encodeURIComponent(moduleId)}`,{waitUntil:'domcontentloaded'});
   const root=page.locator('.lesson-flow'); await root.waitFor();
   assert.equal(await root.count(),1);
   assert.equal(await root.locator('.katex-error').count(),0);
   const headings=await root.locator('h2').allTextContents();
   assert.ok(headings.length>=8);
   const controls=root.locator('input[type=range]:not(:disabled),input[type=number]:not(:disabled)').first();
   await controls.scrollIntoViewIfNeeded(); await controls.focus();
   const before=Number(await controls.inputValue());
   const controlType=await controls.getAttribute('type');
   const atMaximum=before>=Number(await controls.getAttribute('max'));
   await page.keyboard.press(controlType==='range'?(atMaximum?'ArrowLeft':'ArrowRight'):(atMaximum?'ArrowDown':'ArrowUp'));
   assert.notEqual(Number(await controls.inputValue()),before);
   const layouts=[];
   for(const [width,scale] of [[1366,1],[390,1],[320,1],[768,2]]) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(scale=>document.documentElement.style.fontSize=scale===2?'200%':'',scale);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
    assert.equal(overflow,false,`${id} page overflow ${width}/${scale}`);
    layouts.push({width,scale,pageOverflow:overflow});
   }
   assert.ok(!requests.some(url=>/calculated-inputs\.json/.test(url)),'Full scientific packet eagerly loaded');
   assert.deepEqual(errors,[]);
   report.pages.push({id,moduleId,headings,keyboardControlChanged:true,controlType,layouts,errors,fullScientificPacketLoaded:false});
   await context.close();
  }
  for(const [file,identity] of Object.entries(files)) assert.equal(hash(file),identity,`Source changed during integration: ${file}`);
  report.passed=true;
 } finally {
  await browser.close();
  const output=`${integrationFolder}/${stamp}.json`;
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,topics:ids,integration:output,loading:report.loading?.receipt || loadingFile}));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
