const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const folder='docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder/';
const url='http://127.0.0.1:4825/learn/path/full-curriculum/sequence-to-sequence-encoder-decoder?module=deep-learning-fundamentals';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
const browser=await chromium.launch({channel:'msedge'}),context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true}),page=await context.newPage(),errors=[],requests=[],groups=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/learn-code/sequence-to-sequence-encoder-decoder/'))requests.push(r.url());});
await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.seq2seq-lesson').waitFor();
assert.equal(requests.filter(u=>/seed-one-inference|calculated-inputs/.test(u)).length,0);groups.push('No eager fitted weights or three-run record');
for(const id of ['seq2seq-alignment','seq2seq-mask','seq2seq-forward','seq2seq-bridge','seq2seq-tree','seq2seq-frontier','seq2seq-length']){
 const lab=page.locator('#'+id);await lab.scrollIntoViewIfNeeded();const sliders=lab.locator('input[type=range]');assert.ok(await sliders.count()<=3);
 const before=await lab.locator('.flow-readout').innerText();await sliders.first().focus();await sliders.first().press('End');await page.waitForTimeout(60);if((await lab.locator('.flow-readout').innerText())===before)await sliders.first().press('Home');assert.notEqual(await lab.locator('.flow-readout').innerText(),before,id);
 for(const slider of await sliders.all()){await slider.focus();await slider.press('Home');await slider.press('End');}
 for(const button of await lab.getByRole('button',{name:/Reset/}).all())await button.click();
 groups.push(id+': keyboard bounds and reset');
}
const sourceLab=page.locator('#seq2seq-forward'),credit=page.locator('#seq2seq-bridge');
await sourceLab.getByRole('button',{name:'Reset scalar forward calculation'}).click();
assert.ok((await credit.locator('.flow-readout').innerText()).includes('−0.00556958'));
const forward=await sourceLab.locator('.flow-readout').innerText();
await credit.locator('input[type=checkbox]').check();assert.ok((await credit.locator('.flow-readout').innerText()).includes('encoder derivative is 0'));assert.equal(await sourceLab.locator('.flow-readout').innerText(),forward);
await credit.locator('input[type=checkbox]').uncheck();await credit.locator('input[type=range]').focus();await credit.locator('input[type=range]').press('Home');assert.ok((await credit.locator('.flow-readout').innerText()).includes('weight 0.7'));await credit.getByRole('button',{name:/Reset/}).click();groups.push('Detached-forward null, shared hand fixture, zero update rate');
const target=page.getByRole('textbox',{name:'Reference target'});await target.fill('carts');await page.locator('#seq2seq-alignment input[type=range]').focus();await page.locator('#seq2seq-alignment input[type=range]').press('Home');await target.fill('UPPER');assert.equal(await target.getAttribute('aria-invalid'),'true');await target.blur();assert.equal(await target.inputValue(),'carts');await page.locator('#seq2seq-alignment').getByRole('button',{name:/Reset/}).click();groups.push('Invalid target draft retains latest valid reference');
await page.locator('[data-seq-load="seq2seq-fitted"]').scrollIntoViewIfNeeded();await page.getByRole('textbox',{name:'Source lemma'}).waitFor();
assert.ok((await page.locator('#seq2seq-fitted .flow-readout').innerText()).includes('emoves'));
assert.equal(requests.filter(u=>/seed-one-inference/.test(u)).length,1);
assert.equal(requests.filter(u=>/calculated-inputs/.test(u)).length,0);
await page.getByRole('textbox',{name:'Source lemma'}).fill('emmode');assert.ok((await page.locator('#seq2seq-fitted .flow-readout').innerText()).includes('ememmis'));
await page.getByRole('textbox',{name:'Source lemma'}).fill('emmove');await page.getByRole('combobox',{name:'Grammatical request'}).selectOption('participle');assert.ok((await page.locator('#seq2seq-fitted .flow-readout').innerText()).includes('emomming'));
await page.locator('#seq2seq-fitted').getByRole('button',{name:/Reset/}).click();
await page.locator('#seq2seq-fitted input[type=range]').focus();await page.locator('#seq2seq-fitted input[type=range]').press('Home');await page.locator('#seq2seq-fitted input[type=range]').press('ArrowRight');await page.locator('#seq2seq-fitted input[type=range]').press('ArrowRight');assert.ok((await page.locator('#seq2seq-fitted .flow-readout').innerText()).includes('emo'));assert.ok((await page.locator('#seq2seq-fitted .flow-readout').innerText()).includes('CAPPED'));
await page.locator('#seq2seq-fitted').getByRole('button',{name:/Reset/}).click();groups.push('Fresh source/request/cap handlers and reset');
for(const id of ['seq2seq-state','seq2seq-context','seq2seq-fitted-beam']){const lab=page.locator('#'+id);await lab.scrollIntoViewIfNeeded();for(const slider of await lab.locator('input[type=range]').all()){await slider.focus();await slider.press('Home');await slider.press('End');}for(const button of await lab.getByRole('button',{name:/Reset|Restore/}).all())await button.click();groups.push(id+': keyboard extremes and available reset');}
assert.equal(await page.locator('#seq2seq-state tbody tr').count(),32);assert.equal(await page.locator('#seq2seq-context tbody tr').count(),64);
await page.locator('#seq2seq-fitted').getByRole('button',{name:/Reset/}).click();const beamBefore=await page.locator('#seq2seq-fitted-beam .flow-readout').innerText(),baseline=await page.locator('#seq2seq-fitted .flow-readout').innerText();
const prefix=page.getByRole('textbox',{name:'Forced prefix; empty means greedy'});await prefix.fill('a');assert.ok((await page.locator('#seq2seq-prefix .flow-readout').innerText()).includes('amves'));
assert.equal(await page.locator('#seq2seq-fitted .flow-readout').innerText(),baseline);
await page.locator('#seq2seq-context input[type=range]').first().focus();await page.locator('#seq2seq-context input[type=range]').first().press('Home');assert.equal(await page.locator('#seq2seq-fitted-beam .flow-readout').innerText(),beamBefore);
await page.locator('#seq2seq-context').getByRole('button',{name:/Restore/}).click();assert.ok((await page.locator('#seq2seq-context .flow-readout').innerText()).includes('exact null'));
await prefix.fill('em');assert.ok((await page.locator('#seq2seq-prefix .flow-readout').innerText()).includes('emoves'));
await page.locator('#seq2seq-prefix').getByRole('button',{name:/Clear/}).click();await page.locator('#seq2seq-context input[type=range]').first().focus();await page.locator('#seq2seq-context input[type=range]').first().press('Home');assert.ok((await page.locator('#seq2seq-context .flow-readout').innerText()).includes('pled'));
await page.locator('#seq2seq-context').getByRole('button',{name:/Restore/}).click();await page.locator('#seq2seq-context input[type=range]').nth(1).focus();await page.locator('#seq2seq-context input[type=range]').nth(1).press('End');assert.ok((await page.locator('#seq2seq-context .flow-readout').innerText()).includes('lactated'));
await page.locator('#seq2seq-fitted').getByRole('button',{name:/Reset/}).click();groups.push('Prefix causal null/replay, current-source baseline, zero/other-context interventions, independent fresh beam');
assert.equal(requests.filter(u=>/seed-one-inference/.test(u)).length,1);groups.push('One parsed shared fixed-model request across five investigations');
const code=page.locator('.lesson-code-source').filter({hasText:'Compose the differentiable scratch cells'});await code.scrollIntoViewIfNeeded();await code.locator('pre').waitFor();
const copy=code.getByRole('button',{name:'Copy explicit-inflector.py'});await copy.click();await code.locator('.lesson-code__copy[data-copied]').waitFor();assert.equal(await copy.getAttribute('data-copied'),'');assert.equal(await code.locator('.lesson-code__status').innerText(),'Copied');
const clipboard=await page.evaluate(()=>navigator.clipboard.readText()),expected=fs.readFileSync('public/learn-code/sequence-to-sequence-encoder-decoder/explicit-inflector.py','utf8');assert.equal(clipboard.replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
const [download]=await Promise.all([page.waitForEvent('download'),code.getByRole('link',{name:/Download/}).click()]);assert.equal(download.suggestedFilename(),'explicit-inflector.py');const bytes=fs.readFileSync(await download.path());assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hash('public/learn-code/sequence-to-sequence-encoder-decoder/explicit-inflector.py'));groups.push('Exact Copy, visible Copied feedback and exact complete-program download');
const anchorLinks=page.locator('.lesson-compass a[href^="#"]');assert.ok(await anchorLinks.count()>=12);
for(const link of await anchorLinks.all()){const href=await link.getAttribute('href');assert.equal(await page.evaluate(id=>document.querySelectorAll('[id]').length&&[...document.querySelectorAll('[id]')].filter(el=>el.id===decodeURIComponent(id.slice(1))).length,href),1);}groups.push('All opening section links resolve once');
await context.close();await browser.close();
const receipt={passed:!errors.length,errors,groups,requests,sourceHashes:JSON.parse(fs.readFileSync(folder+'reading-flow-source.json','utf8')).sourceHashes,buildManifestHash:hash('scratch/seq2seq-reading-flow/production/.vite/manifest.json'),sourceManifest:'reading-flow-source.json',checkedAt:new Date().toISOString(),verifierHash:hash(__filename),limits:'Actual current isolated production interactions/copy/download. Five-view geometry and forced failures/touch are separate.'};
fs.writeFileSync(folder+'reading-flow-browser.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({passed:receipt.passed,groups:groups.length,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
