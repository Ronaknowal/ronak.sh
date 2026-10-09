const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const output='docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment/browser-interactions';fs.mkdirSync(output,{recursive:true});
const url='http://127.0.0.1:4250/learn/path/full-curriculum/multimodal-pre-training-vision-encoders-cross-modal-alignment?module=large-language-models';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),checks=[];
 await page.goto(url);await page.locator('[data-mmp-figure]').nth(24).waitFor({timeout:90000});
 await page.addStyleTag({content:'header {visibility:hidden!important} html,* {scroll-behavior:auto!important}'});
 const lab=name=>page.getByRole('region',{name,exact:true});
 const section=name=>page.locator('section.flow-lab').filter({has:page.locator(`figure[aria-label="${name}"]`)});
 async function record(name,scope){await scope.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(200);await scope.screenshot({path:path.join(output,name+'.png')});checks.push(name);}
 let s=section('06 Two directional reductions');await s.getByRole('button',{name:'Reverse both paired axes'}).click();assert.match(await s.innerText(),/0.2691 nats/);await record('paired-reversal-invariant',s);
 s=section('08 Backward route into both towers');await s.getByRole('slider',{name:/SGD step size/}).focus();await page.keyboard.press('Home');assert.match(await s.innerText(),/Zero step leaves every parameter and loss unchanged/);await record('zero-step',s);
 s=section('09 Candidate-conditioned classification');await s.getByRole('button',{name:'Add duplicate “digit seven”'}).click();assert.match(await s.innerText(),/11 candidate entries/);await record('duplicate-caption',s);
 s=section('11 Measured fit and held-out curves');await s.getByRole('button',{name:'Tiny library CLIP'}).click();await s.getByText('Final 180 / 200',{exact:false}).waitFor();await record('actual-library-study',s);
 s=section('12 Saved-model pixel intervention');await s.getByRole('slider',{name:/Pixel \(4, 4\) value/}).focus();await page.keyboard.press('End');assert.equal(await s.getByRole('slider',{name:/Pixel/}).inputValue(),'16');await record('changed-pixel-36',s);
 s=section('13 More than one valid caption');await s.getByRole('button',{name:'All pairs valid'}).click();assert.match(await s.innerText(),/set-mass loss: 0/);await record('all-positive-zero',s);
 s=section('14 Pairwise sigmoid learning');await s.getByRole('slider',{name:/Selected raw score/}).focus();await page.keyboard.press('Home');assert.doesNotMatch(await s.innerText(),/NaN|Infinity/);await record('extreme-logistic',s);
 s=section('15 Visual projector shapes');await s.getByLabel('Zero linear weights').check();assert.match(await s.innerText(),/All outputs equal the bias/);await record('zero-projector',s);
 s=section('16 Prefix inputs and shifted answer targets');await s.getByRole('slider',{name:/Image placeholders supplied/}).focus();await page.keyboard.press('Home');assert.match(await s.innerText(),/2 placeholder positions cannot accept 4 visual rows/);await record('placeholder-mismatch',s);
 s=section('21 Interleaved image memory and gate');await s.getByRole('slider',{name:/Visual gate g/}).focus();await page.keyboard.press('End');await s.getByRole('slider',{name:/Image B memory value/}).focus();await page.keyboard.press('End');assert.match(await s.innerText(),/Only positions after B can change/);await record('memory-gate-and-future-image',s);
 s=section('23 Global match and local supervision');await s.getByRole('slider',{name:/Retained image columns/}).focus();await page.keyboard.press('Home');assert.match(await s.innerText(),/nonzero measured pixels are removed/);await record('crop-removes-evidence',s);
 s=section('24 Mixed causal targets');await s.getByRole('button',{name:'Text then image',exact:true}).click();await record('mixed-order',s);
 s=section('25 Evidence under image intervention');await s.getByRole('button',{name:'Use unchanged image'}).click();assert.match(await s.innerText(),/class relevance is preserved/);await record('unchanged-image-null',s);
 const failure=await browser.newPage({viewport:{width:1440,height:1000}});
 await failure.route('**/multimodal-pretraining/scratch-study.json',r=>r.fulfill({status:503,body:'offline'}));
 await failure.route('**/multimodal-pretraining/alignment_mechanisms.py',r=>r.fulfill({status:503,body:'offline'}));
 await failure.goto(url);await failure.getByRole('button',{name:'Retry saved study',exact:true}).first().waitFor({timeout:90000});
 checks.push('saved-data-fetch-failure-visible');
 await failure.unroute('**/multimodal-pretraining/scratch-study.json');
 while(await failure.getByRole('button',{name:'Retry saved study',exact:true}).count()){await failure.getByRole('button',{name:'Retry saved study',exact:true}).first().click();await failure.waitForTimeout(150);}
 await failure.locator('[data-mmp-figure]').nth(24).waitFor();checks.push('saved-data-retry-restores-all-figures');
 const code=failure.locator('.lesson-code-source').first();await code.scrollIntoViewIfNeeded();await code.getByRole('button',{name:'Retry',exact:true}).waitFor();checks.push('code-fetch-failure-visible');
 await failure.unroute('**/multimodal-pretraining/alignment_mechanisms.py');await code.getByRole('button',{name:'Retry',exact:true}).click();await code.getByRole('button',{name:'Copy alignment_mechanisms.py',exact:true}).waitFor();checks.push('code-retry-restores-full-program');
 const files=['src/learn/components/lesson-labs/MultimodalPretrainingFlow.jsx','src/learn/components/lesson-labs/multimodal-pretraining-flow.css','src/learn/data/multimodal-pretraining-models.js'];
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({checks,files:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))},null,2)+'\n');
 await browser.close();console.log(JSON.stringify({checks}));
})().catch(e=>{console.error(e);process.exitCode=1;});
