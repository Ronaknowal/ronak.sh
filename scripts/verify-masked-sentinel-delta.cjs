const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const output='docs/teaching/llm-architecture-training/masked-language-modeling-bert-style/sentinel-delta-final';
fs.mkdirSync(output,{recursive:true});if(fs.existsSync(output+'/report.json'))throw Error('Do not overwrite evidence');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();await page.request.get('http://127.0.0.1:4243/__llm_refresh',{timeout:90000});await page.goto('http://127.0.0.1:4243/learn/path/full-curriculum/masked-language-modeling-bert-style?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});await page.locator('.mlm-flow').first().waitFor({timeout:90000});
 const views=[];for(const [name,width,font] of [['phone',390,16],['enlarged',768,32]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);const figure=page.locator('[data-mlm-figure="Different corruption rules need different targets"]');await figure.scrollIntoViewIfNeeded();
  const geometry=await figure.locator('.mlm-sentinel>span').evaluateAll(elements=>elements.map(e=>({text:e.textContent,scroll:e.scrollWidth,width:e.clientWidth,whiteSpace:getComputedStyle(e).whiteSpace})));
  assert.equal(geometry.length,3);assert.ok(geometry.every(e=>e.whiteSpace==='nowrap'&&e.scroll<=e.width+1));const tokens=await figure.locator('.mlm-token>span').evaluateAll(elements=>elements.map(e=>({text:e.textContent,scroll:e.scrollWidth,width:e.clientWidth,whiteSpace:getComputedStyle(e).whiteSpace})));assert.ok(tokens.every(e=>e.whiteSpace==='nowrap'&&e.scroll<=e.width+1));const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);assert.ok(pageWidth<=width+1);
  await figure.screenshot({path:path.join(output,name+'-objective.png'),style:'.site-header,.site-skip{visibility:hidden!important}'});views.push({name,width,font,pageWidth,geometry,unbrokenTokens:tokens.length});
 }
 const files=['src/learn/components/lesson-labs/MaskedLanguageFlow.jsx','src/learn/components/lesson-labs/masked-language-flow.css'];const report={at:new Date().toISOString(),scope:'Independent-review sentinel identifier wrapping only; reuse unchanged full browser/model/native evidence.',views,sources:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
