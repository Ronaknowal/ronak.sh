const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/speculative-decoding',out=path.join(folder,process.argv[2]||'browser-interactions');fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[`${folder}/lesson.jsx`,'src/learn/data/speculative-decoding-models.js',...['SpeculativeElements','SpeculativeFoundations','SpeculativeCacheCost','SpeculativeProposers','SpeculativeEvidence','SpeculativeDecodingFlow'].map(n=>`src/learn/components/lesson-labs/${n}.jsx`),'src/learn/components/lesson-labs/speculative-decoding-flow.css'];
const inputs=files.map(path=>({path,sha256:sha(path)})),checks=[],images=[],errors=[];
const check=(name,pass,data)=>{checks.push({name,pass:Boolean(pass),data});if(!pass)throw Error(name+': '+JSON.stringify(data));};
const content=figure=>figure.evaluate(async el=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const clone=el.cloneNode(true);clone.querySelectorAll('fieldset,.speculative-pan').forEach(e=>e.remove());clone.querySelectorAll('[style]').forEach(e=>{if(e.tagName!=='svg')return;e.removeAttribute('style');});clone.querySelectorAll('marker').forEach(e=>e.removeAttribute('id'));clone.querySelectorAll('[marker-end]').forEach(e=>e.setAttribute('marker-end','url(#marker)'));clone.querySelectorAll('*').forEach(e=>{const attrs=[...e.attributes].map(a=>[a.name,a.value]).sort((a,b)=>a[0].localeCompare(b[0]));attrs.forEach(([name])=>e.removeAttribute(name));attrs.forEach(([name,value])=>e.setAttribute(name,value));});return clone.innerHTML;});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));let failure;
try{
 await page.goto('http://127.0.0.1:4262/learn/path/full-curriculum/speculative-decoding?module=large-language-models');await page.locator('[data-speculative-figure="D01"]').waitFor();
 for(const n of [18,23,26,29,30,31]){const f=page.locator(`[data-speculative-figure="D${n}"]`);await f.scrollIntoViewIfNeeded();await f.locator('table').first().waitFor();}
 for(let n=Number(process.argv[3]||1);n<=36;n++){
  const id=`D${String(n).padStart(2,'0')}`,figure=page.locator(`[data-speculative-figure="${id}"]`),reset=figure.getByRole('button',{name:'Reset',exact:true});await figure.scrollIntoViewIfNeeded();await reset.click();const initial=await content(figure);
  const controls=figure.locator('fieldset select,fieldset input');
  for(let i=0;i<await controls.count();i++){
   await reset.click();const control=controls.nth(i);if(await control.isDisabled())continue;
   const tag=await control.evaluate(e=>e.tagName),before=await control.inputValue(),label=await control.evaluate(e=>e.closest('label').innerText);
   if(tag==='SELECT'){
    const options=await control.locator('option').evaluateAll(es=>es.map(e=>e.value));
    for(const value of options.filter(v=>v!==before)){
     await control.selectOption({value});check(`${id}/${label}/${value} changes visible mechanism`,await content(figure)!==initial);
     check(`${id}/${label}/${value} valid`,await figure.locator('input').evaluateAll(es=>es.every(e=>e.validity.valid)));
    }
   }else{
    for(const key of ['Home','End','ArrowLeft']){
     const prior=await control.inputValue();await control.focus();await control.press(key);const after=await control.inputValue();
     check(`${id}/${label}/${key} valid`,await control.evaluate(e=>e.validity.valid),{prior,after});
    }
   }
   await reset.click();check(`${id}/${label} reset restores drawing`,await content(figure)===initial);
  }
  // One composite non-default state for each drawing; exhaustive options above are checked separately.
  for(let i=0;i<await controls.count();i++){
   const control=controls.nth(i);if(await control.isDisabled())continue;
   if(await control.evaluate(e=>e.tagName)==='SELECT'){
    const current=await control.inputValue(),values=await control.locator('option').evaluateAll(es=>es.map(e=>e.value));const alternative=values.find(v=>v!==current);if(alternative!==undefined)await control.selectOption({value:alternative});
   }else{await control.focus();await control.press('Home');}
  }
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
   await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(font=>document.documentElement.style.fontSize=`${font}px`,profile.font);await figure.scrollIntoViewIfNeeded();
   const file=path.join(out,`${profile.name}-${id}-changed.png`);await figure.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}'});images.push({id,profile:profile.name,path:file,sha256:sha(file)});
   check(`${id}/${profile.name} changed containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');await reset.click();
 }
 for(const source of await page.locator('.lesson-code-source').all()){
  await source.scrollIntoViewIfNeeded();await source.locator('pre code').waitFor();const download=source.locator('a[download]');const href=await download.getAttribute('href'),filename=await download.getAttribute('download');const actual=await source.locator('pre code').textContent();const expected=fs.readFileSync(path.join('public',href),'utf8');check(`Full visible program ${filename}`,actual===expected);
  const response=await page.request.get('http://127.0.0.1:4262'+href);check(`Program HTTP bytes ${filename}`,Buffer.compare(await response.body(),fs.readFileSync(path.join('public',href)))===0);
  await source.getByRole('button',{name:`Copy ${filename}`,exact:true}).click();await source.locator('[data-copied]').waitFor();check(`Copy ${filename}`, (await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n')===expected.replaceAll('\r\n','\n'));
  const event=page.waitForEvent('download');await download.click();const item=await event;const saved=path.join(out,filename);await item.saveAs(saved);check(`Native download ${filename}`,sha(saved)===sha(path.join('public',href)));
 }
 for(const task of await page.locator('[data-lesson-exercise]').all()){
  for(const summary of await task.locator('summary').all()){await summary.click();check('Practice disclosure opens',await summary.evaluate(e=>e.parentElement.open));}
 }
 check('18 independently open solutions',await page.locator('[data-lesson-exercise] details[open]').count()===36);
 check('No page errors',errors.length===0,errors);
 for(const input of inputs)check(`Unchanged ${input.path}`,sha(input.path)===input.sha256);
}catch(e){failure=e.stack;}
await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,inputs,checks,images,errors,scope:'Native controls, edited-state containment, reset, visible program bytes, clipboard and actual program download events, practice disclosures. Paint reading separate; no science replay.'},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;})();
