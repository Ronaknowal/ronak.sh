const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const output='docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/review-closure';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:1000}});const errors=[],captures=[];page.on('pageerror',e=>errors.push(e.message));
 await page.request.get('http://127.0.0.1:4243/__llm_refresh');
 await page.goto('http://127.0.0.1:4243/learn/path/full-curriculum/data-curation-deduplication-minhash-bloom-filters?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('[data-curation-figure="audit"] select').waitFor({timeout:90000});
 const shot=async(label,name)=>{const figure=page.locator(`[data-curation-figure="${name}"]`);await figure.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());const file=label+'-'+name+'.png';await figure.screenshot({path:path.join(output,file),style:'.site-header--learn {visibility:hidden!important}'});captures.push(file);};
 const data=JSON.parse(fs.readFileSync('public/learn-code/data-curation-deduplication/audit-inspector.json','utf8'));
 assert.equal(data.pairs.length,90);
 for(const [width,font,label]of[[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]){
  await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',font);
  for(const name of ['weights','extraction','exact','clusters','audit','semantic'])await shot(label,name);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 for(const [a,b,label]of[['train-00-original','train-00-local-edit','edit'],['train-00-original','train-00-excerpt','excerpt'],['meaning-positive','meaning-negative','negation'],['train-17-original','heldout-01-original','crosssplit'],['heldout-00-original','heldout-00-exact','short']]){
  const id=a+' / '+b;await page.locator('[data-curation-figure="audit"] select').selectOption(id);const expected=data.pairs.find(p=>p.id===id);
  const texts=await page.locator('.curation-source-text').allTextContents();assert.deepEqual(texts,[expected.a.text,expected.b.text]);
  const content=await page.locator('[data-curation-figure="audit"]').innerText();assert.ok(content.includes(expected.a.disposition));assert.ok(content.includes(expected.b.disposition));
  if(expected.jaccard===null)assert.match(content,/Jaccard is undefined/);
  await shot(label,'audit');
 }
 assert.deepEqual(errors,[]);assert.ok(!/[âÂÃ]/.test((await page.locator('.data-curation-flow').allTextContents()).join(' ')));
 const files=['src/learn/components/lesson-labs/DataCurationFlow.jsx','src/learn/components/lesson-labs/data-curation-flow.css','public/learn-code/data-curation-deduplication/audit-inspector.json','scripts/prepare-curation-inspector.py'];
 const report={at:new Date().toISOString(),errors,captures,pairs:90,sourceFiles:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1);});
