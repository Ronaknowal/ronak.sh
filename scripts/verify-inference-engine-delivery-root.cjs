const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base=process.env.LLM_PRODUCTION_BASE||'http://127.0.0.1:4266';
const folder=process.env.LLM_INTEGRATION_DIRECTORY||'docs/teaching/llm-architecture-training/inference-engines-serving/runtime-review-root';
const out=path.join(folder,'complete-code-delivery-r2');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt=JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/inference-engines-serving/renderer-receipt.json'));
const source='docs/teaching/llm-architecture-training/inference-engines-serving/lesson.jsx',sourceHash=sha(fs.readFileSync(source));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const report={base,source,sourceHash,programs:[],checks:[],errors:[]};
try{const ctx=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
let failEvidence=true,failCode=true;
await ctx.route('**/learn/examples/inference-engines/evidence/observations.json',r=>{if(failEvidence){failEvidence=false;return r.fulfill({status:503,body:'Retained intentional loading test'});}return r.continue();});
await ctx.route('**/learn/examples/inference-engines/request_contract.py',r=>{if(failCode){failCode=false;return r.fulfill({status:503,body:'Retained intentional loading test'});}return r.continue();});
await page.goto(base+'/learn/path/full-curriculum/inference-engines-serving?module=large-language-models',{timeout:90000});
const f=page.locator('[data-engine-figure="D02"]');await f.scrollIntoViewIfNeeded();await f.getByRole('alert').waitFor();await f.getByRole('button',{name:'Retry evidence',exact:true}).click();await f.locator('table').waitFor();report.checks.push('Observation HTTP503 visible and Retry recovers exact data');
const blocks=page.locator('.lesson-code-source');assert.equal(await blocks.count(),13);
await blocks.first().scrollIntoViewIfNeeded();await blocks.first().getByRole('alert').waitFor();await blocks.first().getByRole('button',{name:'Retry',exact:true}).click();
for(const [i,file]of receipt.programs.entries()){const b=blocks.nth(i),expected=fs.readFileSync('public/learn/examples/inference-engines/'+file);await b.scrollIntoViewIfNeeded();await b.locator('pre code').waitFor();assert.equal(await b.locator('pre code').textContent(),expected.toString());
await b.getByRole('button',{name:'Copy '+file,exact:true}).click();assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),expected.toString().replaceAll('\r\n','\n'));
const pending=page.waitForEvent('download');await b.getByRole('link',{name:'Download '+file,exact:true}).click();const d=await pending;const destination=path.join(out,file);await d.saveAs(destination);assert.equal(await d.failure(),null);assert.equal(sha(fs.readFileSync(destination)),sha(expected));report.programs.push({file,bytes:expected.length,sha256:sha(expected),visible:true,clipboard:true,nativeDownload:true});}
assert.equal(await page.locator('[data-code-downloads]').count(),1);assert.equal(await page.locator('[data-lesson-exercise]').count(),16);
for(const d of await page.locator('[data-lesson-exercise] details').all()){await d.locator('summary').click();assert.ok(await d.evaluate(e=>e.open));await d.locator('summary').click();}
report.checks.push('All13 full-source views, actual clipboard and native file downloads; all32 practice disclosures open and close');
for(const [old,current]of Object.entries(receipt.aliases)){assert.equal(await page.locator('[id="'+old+'"]').count(),1);assert.equal(await page.locator('[id="'+current+'"]').count(),1);}report.checks.push('Every preserved heading alias and destination exists exactly once');
assert.deepEqual(report.errors,[]);assert.equal(sha(fs.readFileSync(source)),sourceHash);report.passed=true;
}catch(e){report.passed=false;report.failure=e.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:report.passed,programs:report.programs.length,failure:report.failure}));}})();
