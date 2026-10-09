// Author check of shared code affordances as actually mounted in this candidate.
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const record='docs/teaching/deep-learning-beginner/mini-batches-training-loops-gradient-accumulation';
const identity=path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),bytes:fs.statSync(path).size});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4863/',{waitUntil:'networkidle'});
 const checks=[];const check=(name,value)=>{assert.ok(value,name);checks.push({name,passed:true})};
 await page.locator('.lesson-code-source').filter({has:page.locator('a[href$="manual-gradient-accumulation.py"]')}).scrollIntoViewIfNeeded();
 const copy=page.getByRole('button',{name:'Copy manual-gradient-accumulation.py',exact:true});await copy.waitFor();await copy.click();
 await page.getByRole('status').filter({hasText:/^Copied$/}).first().waitFor();
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 check('Complete current program copied with visible feedback (Windows newline normalization)',copied.replaceAll('\r\n','\n')===fs.readFileSync('public/learn-assets/mini-batches-training-loops-gradient-accumulation/manual-gradient-accumulation.py','utf8').replaceAll('\r\n','\n'));
 const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download manual-gradient-accumulation.py',exact:true}).click();const downloaded=await downloadPromise;
 check('Current program downloads under its filename',downloaded.suggestedFilename()==='manual-gradient-accumulation.py' && await downloaded.failure()===null);
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('deliberate author test')}},configurable:true})});await copy.click();
 await page.getByRole('status').filter({hasText:'Copy unavailable. Select the code and copy it manually.'}).first().waitFor();check('Clipboard failure gives visible recovery',true);
 await browser.close();const output=`${record}/author-affordances-${new Date().toISOString().replaceAll(':','-')}.json`;
 fs.writeFileSync(output,JSON.stringify({status:'PASS',scope:'author mounted Copy/Download behavior; independent review pending',sources:[identity(`${record}/reading-flow-candidate.jsx`),identity('public/learn-assets/mini-batches-training-loops-gradient-accumulation/manual-gradient-accumulation.py'),identity(__filename)],checks},null,2));console.log(JSON.stringify({file:output,checks:checks.length}));
})().catch(error=>{console.error(error);process.exitCode=1});
