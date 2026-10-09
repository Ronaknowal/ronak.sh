const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=process.env.LEARNING_BASE_URL||'http://127.0.0.1:4243';
const output=path.resolve(process.env.CURATION_BROWSER_OUTPUT||'docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/browser-evidence');
const route='/learn/path/full-curriculum/data-curation-deduplication-minhash-bloom-filters?module=large-language-models';
const names=['weights','extraction','exact','shingles','minhash','signature-error','bands','clusters','bloom-bits','bloom-budget','audit','shards','containment','semantic'];
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:900},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
 const page=await context.newPage(),errors=[],captures=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 const fig=name=>page.locator(`[data-curation-figure="${name}"]`);
 const shot=async(name,node)=>{await node.scrollIntoViewIfNeeded();await node.screenshot({path:path.join(output,name+'.png'),style:'.site-header--learn {visibility:hidden!important}'});captures.push(name+'.png');};
 await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:90000});
 await fig('semantic').waitFor();await fig('audit').getByText('Actual survivors (first eight IDs)').waitFor();await page.screenshot({path:path.join(output,'reader-opening.png')});
 for(const [width,font,label] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]){
  await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',font);
  for(const name of names)await shot(label+'-'+name,fig(name));
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));checks.push({label,...dimensions});assert.ok(dimensions.width<=dimensions.viewport+1,JSON.stringify(checks));
 }
 await page.setViewportSize({width:1366,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 await page.getByRole('slider',{name:'Copies of article A'}).fill('1');assert.match(await fig('weights').innerText(),/No duplicate/);
 await fig('exact').getByRole('button',{name:'Fold case',exact:true}).click();assert.match(await fig('exact').innerText(),/distinction has been removed/);
 await page.getByLabel('Document B',{exact:true}).fill('');assert.match(await fig('shingles').innerText(),/empty shingle set/);await shot('changed-empty-shingles',fig('shingles'));
 await page.getByRole('slider',{name:'Shared ordering'}).fill('6');assert.match(await fig('minhash').innerText(),/matches/);
 await fig('bands').getByRole('button',{name:'2 × 6',exact:true}).click();assert.match(await fig('bands').innerText(),/not retrieved/);
 await fig('clusters').getByRole('button',{name:'Directly match a kept record',exact:true}).click();assert.match(await fig('clusters').innerText(),/A, C/);await shot('changed-direct-policy',fig('clusters'));
 await page.getByLabel("Clear oak's bits (unsafe deletion)").check();assert.match(await fig('bloom-bits').innerText(),/falsely absent/);await shot('changed-unsafe-deletion',fig('bloom-bits'));
 await page.getByRole('slider',{name:'Population / designed capacity'}).fill('0');assert.match(await fig('bloom-budget').innerText(),/0 distinct keys/);
 await page.getByRole('slider',{name:'Training article shingles'}).fill('2');assert.match(await fig('containment').innerText(),/sets are identical/);
 await page.getByRole('slider',{name:'Cosine threshold',exact:true}).fill('1');assert.match(await fig('semantic').innerText(),/A, B, C, D/);
 const downloads=[];
 for(const block of await page.locator('.lesson-code-source').all()){
  await block.scrollIntoViewIfNeeded();await block.locator('pre').waitFor();
  const link=block.getByRole('link',{name:/^Download /});const href=await link.getAttribute('href'),expected=fs.readFileSync(path.join('public',href),'utf8');
  assert.equal(await block.locator('pre').textContent(),expected);
  await block.getByRole('button',{name:/^Copy /}).click();assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
  const pending=page.waitForEvent('download');await link.click();const download=await pending;assert.equal(fs.readFileSync(await download.path(),'utf8'),expected);downloads.push(download.suggestedFilename());
 }
 assert.equal(downloads.length,8);
 const failure=await context.newPage();let fail=true;
 await failure.route('**/audit-results.json',r=>fail?r.fulfill({status:503,body:'Unavailable'}):r.continue());
 await failure.goto(base+route,{waitUntil:'domcontentloaded',timeout:90000});await failure.getByRole('button',{name:'Retry audit'}).waitFor();fail=false;await failure.getByRole('button',{name:'Retry audit'}).click();await failure.getByText('Actual survivors (first eight IDs)').waitFor();
 assert.deepEqual(errors,[]);
 const sources=['src/learn/components/lesson-labs/DataCurationFlow.jsx','src/learn/components/lesson-labs/data-curation-flow.css','src/learn/data/data-curation-models.js','docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/data-curation-deduplication.jsx'];
 const report={at:new Date().toISOString(),base,route,captures,checks,downloads,errors,auditRetry:true,sources:Object.fromEntries(sources.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]))};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1);});
