// Current production interaction/geometry/code checks; retained science is not rerun here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const id='ring-attention-sequence-parallelism',folder=`docs/teaching/deep-learning-beginner/${id}`,base=process.env.LEARNING_BASE_URL||'http://127.0.0.1:4833';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
// Windows DOM/clipboard serialization may use CRLF; HTTP asset bytes remain exact.
const logicalText=value=>value.replaceAll('\r\n','\n');
const programs=['ring-attention-reference.py','distributed_ring.py','attention-partition-study.py','systems-calculations.py','projected-ring-gradients.py'];
const sources=[`src/learn/data/topics/${id}.jsx`,`docs/teaching/drafts/${id}/lesson.md`,`docs/teaching/drafts/${id}/visual-specifications.md`,...['Figures','Labs','Systems','Study'].map(name=>`src/learn/components/lesson-labs/RingAttentionFlow${name}.jsx`),'src/learn/components/lesson-labs/ring-attention-flow.css','src/learn/data/ring-attention-models.js','src/learn/data/ring-attention-examples.json','scripts/generate-ring-attention-lesson.mjs','scripts/lib/ring-reading-flow-renderer.mjs',...programs.map(file=>`public/learn-assets/${id}/${file}`)];
const report={passed:false,createdAt:new Date().toISOString(),base,sourceHashes:Object.fromEntries(sources.map(file=>[file,hash(file)])),checks:[],layouts:[],screenshots:[],errors:[],scope:'Actual isolated current production; CPU model arithmetic and interactive states, no training/GPU/performance claim'};
const number=text=>Number(text.replaceAll('−','-'));
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} versus${b}`);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:900},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),requests=[];
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 const region=name=>page.locator(`.flow-lab[aria-label=${JSON.stringify(name)}]`);
 const field=name=>page.locator('label.ring-flow-input').filter({has:page.locator('span').filter({hasText:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})}).locator('input,select');
 const sliderName=label=>new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s');
 const slider=async(label,value)=>{const el=page.locator('label.flow-slider').filter({hasText:sliderName(label)}).first().locator('input[type=range]');await el.scrollIntoViewIfNeeded();await el.evaluate((el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,String(v));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);await page.waitForTimeout(60);};
 try{
  await page.goto(`${base}/learn/path/full-curriculum/${id}?module=deep-learning-fundamentals`,{waitUntil:'domcontentloaded'});
  const root=page.locator('.lesson-flow');await root.waitFor();assert.equal(await root.count(),1);
  assert.equal(await root.locator('h2').count(),15);assert.equal(await root.locator('.katex-error').count(),0);
  assert.equal(await root.locator('details .flow-lab,details .lesson-code').count(),0);
  assert.ok((await root.innerText()).includes('All2,751'));
  assert.ok(!requests.some(url=>/movement-attention-model|partition-results|movement_libras|calculated-inputs/.test(url)));
  const c=page.locator('.flow-controls input[type=range]').first();await c.scrollIntoViewIfNeeded();await c.focus();await page.keyboard.press('ArrowRight');assert.equal(Number(await c.inputValue()),1);report.checks.push('Opening is current15section flow; keyboard changes actual source row; no model/scientific payload eagerly fetched.');
  const scalar=region('Shared four-record normalization: records');
  near(number(await scalar.locator('.flow-readout strong').innerText()),2.5);
  await slider('Record',3);await field('Record3 score').fill('1.3');await field('Record3 value').fill('-4.7');
  const expected=(2+16+4+Math.exp(1.3)*-4.7)/(7+Math.exp(1.3));near(number(await scalar.locator('.flow-readout strong').innerText()),expected);
  await page.getByRole('button',{name:'Pin complete scalar case',exact:true}).click();await slider('Common score offset',1000);near(number(await scalar.locator('.flow-readout strong').innerText()),expected);
  await field('Record3 score').fill('');assert.equal(await field('Record3 score').getAttribute('aria-invalid'),'true');near(number(await scalar.locator('.flow-readout strong').innerText()),expected);
  await page.getByRole('button',{name:'Reset scalar case',exact:true}).click();assert.equal(await page.getByLabel('Record0 score',{exact:true}).inputValue(),'0');near(number(await scalar.locator('.flow-readout strong').innerText()),2.5);
  for(let i=0;i<4;i++){await slider('Record permission to edit',i);await page.getByLabel(`Record${i} permission`,{exact:true}).selectOption('false');}
  assert.ok((await scalar.innerText()).includes('undefined probabilities; zero-output convention'));
  await page.getByRole('button',{name:'Reset scalar case',exact:true}).click();report.checks.push('Arbitrary scalar score/value,1000offset null, complete pin, invalid draft/reset, all-forbidden convention and reset pass.');
  const ownerInput=field('Owner ID lists, for example0,1,2;3,4;5,6');
  await ownerInput.fill('6,1;4,0,3;2,5');assert.equal(await ownerInput.getAttribute('aria-invalid'),'false');
  await page.getByRole('button',{name:'Pin complete record and gradient case',exact:true}).click();
  await ownerInput.fill('0,0;1,2,3,4,5,6');assert.equal(await ownerInput.getAttribute('aria-invalid'),'true');
  await page.getByRole('button',{name:'Reset record case',exact:true}).click();assert.equal(await ownerInput.inputValue(),'0,1,2;3,4;5,6');assert.equal(await ownerInput.getAttribute('aria-invalid'),'false');
  await slider('Upstream query ID',5);await page.getByLabel('G=dO head0 ID5 channel0',{exact:true}).fill('-2.3');
  const derivative=region('Check a current projected derivative against a fresh central finite difference');
  assert.ok((await derivative.innerText()).includes('absolute error'));report.checks.push('Arbitrary seven-record partition, duplicate rejection, current output/gradient pin, invalid reset and live nonuniform upstream/finite difference work.');
  await slider('Position owners',1);assert.ok((await region('Inspect permanent query rows and visiting key/value rows').first().innerText()).includes('no actual transfer'));
  await page.getByLabel('Query heads Hq',{exact:true}).fill('7');assert.ok((await region('Shared exact resource inventory: dimensions').innerText()).includes('must be divisible'));
  assert.ok((await root.innerText()).includes('no curve is shown for an invalid grouping'));
  await page.getByRole('button',{name:'Reset work, resource and reshard cases',exact:true}).click();
  await page.getByLabel('Global token rows L',{exact:true}).fill('12');await page.getByLabel('Head columns H',{exact:true}).fill('6');await page.getByLabel('Owners P',{exact:true}).last().fill('3');
  assert.ok((await region('Track the same token/head cell through both exact reshard stages').first().innerText()).includes('Restored mismatches 0'));
  await slider('Second transmitted cell ID',7);await page.getByRole('button',{name:'Swap those transmitted cells',exact:true}).click();
  assert.ok((await region('Track the same token/head cell through both exact reshard stages').last().innerText()).includes('Restored mismatches 2'));
  await page.getByRole('button',{name:'Reset exact reshard',exact:true}).click();report.checks.push('P1 has no transfer; invalid head grouping suppresses all current inventories/scaling; fresh12/6/3 Ulysses and arbitrary wrong transmitted identity detect two mismatches.');
  const source=page.getByLabel('Recorded source trajectory',{exact:true});await source.scrollIntoViewIfNeeded();await region('Same fixed learned model: input').locator('svg').first().waitFor();
  assert.ok((await region('Same fixed learned model: task').innerText()).includes('class 5'));
  assert.ok((await region('Same fixed learned model: task').innerText()).includes('recorded class is 4'));
  assert.equal(await region('Same fixed learned model: probabilities').locator('tbody tr').count(),15);
  await page.getByRole('button',{name:'Pin complete model input and execution',exact:true}).click();
  const original=Number(await page.getByLabel('Point22 x',{exact:true}).inputValue());await page.getByLabel('Point22 x',{exact:true}).fill(String(original+.1));
  assert.ok((await region('Same fixed learned model: edit').innerText()).includes('not certified'));
  await page.getByLabel('Point storage assignment',{exact:true}).selectOption('striped');await page.getByLabel('KV circulation',{exact:true}).selectOption('-1');await slider('Position owners P',8);
  assert.ok((await region('Same fixed learned model: ownership').innerText()).includes('all-current-input dense/ring'));
  await source.selectOption('1');assert.ok((await region('Same fixed learned model: task').innerText()).includes('class 2'));
  assert.ok((await region('Same fixed learned model: task').innerText()).includes('recorded class is 1'));
  await page.getByRole('button',{name:'Reset model case',exact:true}).click();report.checks.push('Actual complete frozen classifier, both recorded misclassifications, arbitrary real-point edits, all15probabilities, model pin, striped/reverse/P8 and reset checked.');
  for(const file of programs){
   const pending=page.locator('.lesson-code-source').filter({has:page.locator(`a[href="/learn-assets/${id}/${file}"]`)}).first();await pending.scrollIntoViewIfNeeded();
   const copy=page.getByRole('button',{name:`Copy ${file}`,exact:true});await copy.waitFor();await copy.scrollIntoViewIfNeeded();
   const block=copy.locator('xpath=ancestor::div[contains(@class,"lesson-code")]').first(),text=await block.locator('pre code').innerText(),expected=fs.readFileSync(`public/learn-assets/${id}/${file}`,'utf8');assert.ok(logicalText(text)===logicalText(expected),`Visible program mismatch: ${file}`);
   await copy.click();await page.waitForFunction(file=>[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')===`Copy ${file}`)?.textContent.includes('Copied'),file);assert.ok(logicalText(await page.evaluate(()=>navigator.clipboard.readText()))===logicalText(expected),`Clipboard program mismatch: ${file}`);
   const download=page.getByRole('link',{name:`Download ${file}`,exact:true}).first(),url=await download.getAttribute('href'),response=await context.request.get(base+url);assert.equal(response.status(),200);assert.ok((await response.body()).equals(fs.readFileSync(`public/learn-assets/${id}/${file}`)),`HTTP asset bytes: ${file}`);
   assert.equal(await block.locator('xpath=ancestor::details').count(),0);
  }
  report.checks.push('All five complete code readers visible near viewport, actual clipboard text with platform CRLF normalized and Copied feedback, exact HTTP download bytes, no instructional code disclosure.');
  for(const [width,scale]of[[1366,1],[768,1],[390,1],[320,1],[768,2]]){
   await page.setViewportSize({width,height:900});await page.evaluate(scale=>document.documentElement.style.fontSize=scale===2?'200%':'',scale);
   const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,svgLeaks:[...document.querySelectorAll('.lesson-flow svg')].flatMap((svg,index)=>[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox(),v=svg.viewBox.baseVal;return b.x<v.x-2||b.x+b.width>v.width+2||b.y<0||b.y+b.height>v.height+2}).map(t=>({index,text:t.textContent})))}));
   report.layouts.push({...layout,scale});assert.ok(layout.scroll<=width+2);assert.deepEqual(layout.svgLeaks,[]);
  }
  await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='');
  const captured=['Change a source row and rebuild its three projections','Inspect permanent query rows and visiting key/value rows','Sum all remote derivative contributions and return them to the original key owner','Same fixed learned model: input','Same fixed learned model: task','Same fixed learned model: join'];
  const captureStamp=new Date().toISOString().replaceAll(':','-');
  for(let i=0;i<captured.length;i++){const file=`${folder}/reading-flow-painted-${captureStamp}-${i}.png`;await region(captured[i]).first().screenshot({path:file});report.screenshots.push({region:captured[i],path:file,sha256:hash(file)});}
  const failureContext=await browser.newContext({viewport:{width:390,height:900}}),failurePage=await failureContext.newPage();let attempts=0;
  failurePage.on('pageerror',e=>report.errors.push(e.message));
  await failurePage.route(`**/learn-assets/${id}/movement-attention-model.json`,async route=>{attempts++;if(attempts===1)await route.fulfill({status:503,body:'deliberate verification outage'});else{await new Promise(resolve=>setTimeout(resolve,250));await route.fulfill({status:200,contentType:'application/json',body:fs.readFileSync(`public/learn-assets/${id}/movement-attention-model.json`)});}});
  await failurePage.goto(`${base}/learn/path/full-curriculum/${id}?module=deep-learning-fundamentals`,{waitUntil:'domcontentloaded'});await failurePage.locator('.lesson-flow').waitFor();
  await failurePage.getByLabel('Recorded source trajectory',{exact:true}).scrollIntoViewIfNeeded();
  const retry=failurePage.getByRole('button',{name:'Retry frozen Ring model',exact:true}).first();await retry.waitFor();
  await failurePage.getByLabel('Point22 x',{exact:true}).fill('.73');await retry.click();await failurePage.getByLabel('Point22 x',{exact:true}).fill('.23');await failurePage.getByLabel('Point22 x',{exact:true}).fill('.27');
  await failurePage.getByRole('region',{name:'Same fixed learned model: input',exact:true}).locator('svg').first().waitFor();assert.equal(Number(await failurePage.getByLabel('Point22 x',{exact:true}).inputValue()),.27);
  await failurePage.getByLabel('Recorded source trajectory',{exact:true}).selectOption('1');await failurePage.getByLabel('Recorded source trajectory',{exact:true}).selectOption('0');assert.equal(attempts,2);
  await failureContext.close();report.checks.push('Actual model failure/retry, quick edits while response is delayed and cached source switching preserve latest input with exactly two attempts.');
  assert.deepEqual(report.errors,[]);for(const [file,sha]of Object.entries(report.sourceHashes))assert.equal(hash(file),sha,`Changed during check: ${file}`);
  report.manifestSha256=hash('scratch/reading-flow/ring-production/.vite/manifest.json');report.passed=true;
 }catch(error){report.failure=String(error.stack||error);throw error;}
 finally{await browser.close();const file=`${folder}/reading-flow-browser-${new Date().toISOString().replaceAll(':','-')}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,receipt:file,checks:report.checks.length,failure:report.failure}));}
})().catch(error=>{console.error(error);process.exitCode=1;});
