const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const output='docs/teaching/llm-architecture-training/masked-language-modeling-bert-style/token-delta';
fs.mkdirSync(output,{recursive:true});if(fs.existsSync(output+'/report.json'))throw Error('Do not overwrite evidence');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.request.get('http://127.0.0.1:4243/__llm_refresh',{timeout:90000});await page.goto('http://127.0.0.1:4243/learn/path/full-curriculum/masked-language-modeling-bert-style?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});await page.locator('.mlm-flow').first().waitFor({timeout:90000});
 const views=[],captures=[];for(const [name,width,font] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);
  const tokens=await page.locator('.mlm-token-row .mlm-token>span').evaluateAll(elements=>elements.map(e=>({text:e.textContent,scroll:e.scrollWidth,width:e.clientWidth,whiteSpace:getComputedStyle(e).whiteSpace})));assert.ok(tokens.every(e=>e.whiteSpace==='nowrap'&&e.scroll<=e.width+1));
  const aligned=await page.locator('.mlm-context-sequence').evaluateAll(elements=>elements.map(e=>({row:e.querySelector('.mlm-token-row').getBoundingClientRect().width,arcs:e.querySelector('svg').getBoundingClientRect().width})));assert.ok(aligned.every(e=>Math.abs(e.row-e.arcs)<1));
  const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);assert.ok(pageWidth<=width+1);
  for(const [index,label] of [[0,'context'],[1,'corruption'],[9,'dynamic'],[13,'pll'],[14,'objective']]){const figure=page.locator('[data-mlm-figure]').nth(index);await figure.scrollIntoViewIfNeeded();const file=name+'-'+label+'.png';await figure.screenshot({path:path.join(output,file),style:'.site-header,.site-skip{visibility:hidden!important}'});captures.push(file);}
  if(name==='enlarged'){const scroll=page.getByRole('region',{name:'flooded input and aligned context routes'});await scroll.focus();await scroll.evaluate(e=>e.scrollLeft=e.scrollWidth);assert.ok(await scroll.evaluate(e=>e.scrollLeft>0));await scroll.screenshot({path:path.join(output,'enlarged-context-right.png'),style:'.site-header,.site-skip{visibility:hidden!important}'});captures.push('enlarged-context-right.png');}
  views.push({name,width,font,pageWidth,unbrokenTokens:tokens.length,aligned});
 }
 assert.deepEqual(errors,[]);const files=['src/learn/components/lesson-labs/MaskedLanguageFlow.jsx','src/learn/components/lesson-labs/masked-language-flow.css'];const report={at:new Date().toISOString(),scope:'Bounded token legibility and aligned context scrolling; model and native programs unchanged.',views,captures,errors,sources:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
