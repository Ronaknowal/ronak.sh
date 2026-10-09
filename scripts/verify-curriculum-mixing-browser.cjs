const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='http://127.0.0.1:4250';
const root='docs/teaching/llm-architecture-training/curriculum-learning-data-mixing-strategies';
const output=`${root}/browser-evidence/${new Date().toISOString().replace(/[:.]/g,'-')}`;
const names=['shares','exposure','gradient-mixture','sampler','checkpoint','pacing','order','schedule','excess','reference','doremi-anatomy','weights','alignment','split','response','gauge','byte-model','study','strategies'];
const files=[`${root}/curriculum-data-mixing.jsx`,'src/learn/components/lesson-labs/CurriculumMixingFlow.jsx','src/learn/components/lesson-labs/curriculum-mixing-flow.css','src/learn/data/curriculum-mixing-models.js','src/learn/data/curriculum-mixing-recorded-study.json'];
const hash=()=>Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const sources=hash(),browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
 const page=await context.newPage(),errors=[],captures=[],layouts=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.request.get(base+'/__llm_refresh');
 await page.goto(base+'/learn/path/full-curriculum/curriculum-learning-data-mixing-strategies?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('[data-mixing-figure="study"]').waitFor({timeout:90000});
 assert.equal(await page.locator('[data-mixing-figure]').count(),19);
 assert.equal(await page.locator('.katex-error').count(),0);
 const shot=async(name,selector)=>{const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await el.screenshot({path:`${output}/${name}.png`,style:'.site-skip,.site-header--learn{visibility:hidden!important}'});captures.push(name+'.png');};
 for(const [width,font,label] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]){
  await page.setViewportSize({width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);
  for(const name of names)await shot(`${label}-${name}`,`[data-mixing-figure="${name}"]`);
  const labs=page.locator('.flow-lab');for(let j=0;j<await labs.count();j++){const lab=labs.nth(j);await lab.scrollIntoViewIfNeeded();await lab.screenshot({path:`${output}/${label}-lab-${j}.png`,style:'.site-skip,.site-header--learn{visibility:hidden!important}'});captures.push(`${label}-lab-${j}.png`);}
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
  layouts.push({label,...dimensions});assert.ok(dimensions.width<=width+1,`${label} page overflow ${dimensions.width}`);
 }
 await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 const changes=[['A eligible targets','8','shares'],['Target budget B','0','exposure'],['A target share','0.75','gradient-mixture'],['Requested draws','12','sampler'],['Progress','1','pacing'],['Learning rate η','0','order'],['Cooldown fraction','0','schedule'],['Proxy NLL at t1','1','excess'],['A excess signal','0','weights'],['Model step size γ','2','alignment'],['Alice share','1','response'],['Common coefficient shift δ','-2','gauge']];
 for(const [label,value,figure] of changes){await page.getByRole('slider',{name:label,exact:true}).fill(value);await shot(`changed-${figure}`,`[data-mixing-figure="${figure}"]`);}
 await page.getByRole('button',{name:'Once each',exact:true}).click();assert.match(await page.locator('[aria-label="Compare finite-stream stopping policies"]').innerText(),/Emitted 6 of 12/);
 await page.getByRole('button',{name:'Equal to reference',exact:true}).click();assert.match(await page.locator('[aria-label="Clip token gaps before reducing the domain signal"]').innerText(),/mean is 0 nats/);
 await page.getByRole('button',{name:'c → a',exact:true}).click();assert.match(await page.locator('[data-mixing-figure="byte-model"]').innerText(),/Target 97/);
 await page.getByRole('button',{name:'43',exact:true}).click();assert.match(await page.locator('[data-mixing-figure="study"]').innerText(),/Recorded seed 43/);
 const blocks=page.locator('.lesson-code-source');assert.equal(await blocks.count(),7);
 const programs=[];
 for(let i=0;i<7;i++){
  const block=blocks.nth(i);await block.scrollIntoViewIfNeeded();await block.locator('pre').waitFor({timeout:60000});
  const file=await block.locator('.lesson-code__filename').innerText(),expected=fs.readFileSync(`public/learn-code/curriculum-data-mixing/${file}`,'utf8');
  await block.getByRole('button',{name:`Copy ${file}`,exact:true}).click();
  assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
  const event=page.waitForEvent('download');await block.getByRole('link',{name:`Download ${file}`,exact:true}).click();const download=await event;assert.equal(fs.readFileSync(await download.path(),'utf8'),expected);programs.push(file);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(hash(),sources,'Source changed during campaign');
 const report={at:new Date().toISOString(),sources,captures,layouts,errors,programs,copiedAndDownloaded:7,changedControls:changes.length+4,limits:'Author browser checks and captured pixels; screenshots require actual reading and different review.'};
 fs.writeFileSync(`${output}/browser-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();console.log(JSON.stringify({output,captures:captures.length,layouts,programs:programs.length,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
