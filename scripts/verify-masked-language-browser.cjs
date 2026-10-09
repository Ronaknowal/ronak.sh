const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const base=process.env.LEARNING_BASE_URL||'http://127.0.0.1:4243';
const output=process.env.MLM_BROWSER_OUTPUT||'docs/teaching/llm-architecture-training/masked-language-modeling-bert-style/browser-evidence';
const url=base+'/learn/path/full-curriculum/masked-language-modeling-bert-style?module=large-language-models';
if(fs.existsSync(path.join(output,'report.json')))throw Error('Use a fresh evidence directory');
fs.mkdirSync(output,{recursive:true});
const sources=['docs/teaching/llm-architecture-training/masked-language-modeling-bert-style/manuscript.jsx','src/learn/components/lesson-labs/MaskedLanguageFlow.jsx','src/learn/components/lesson-labs/masked-language-flow.css','src/learn/data/masked-language-models.js','public/learn-code/masked-language-modeling/scratch-training.json'];
const report={at:new Date().toISOString(),base,url,sources:Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),checks:[],captures:[],layouts:[],errors:[]};
const check=(v,s)=>{assert.ok(v,s);report.checks.push(s);};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.locator('.mlm-flow').waitFor({timeout:60000});
  await page.locator('#mlm-recorded .mlm-values').waitFor();await page.evaluate(()=>document.fonts.ready);
  const figures=page.locator('[data-mlm-figure]');const count=await figures.count();check(count===15,'All fifteen planned figures present');
  async function shot(target,name){await target.scrollIntoViewIfNeeded();await target.screenshot({path:path.join(output,name+'.png'),style:'.site-header,.site-skip{visibility:hidden!important}'});report.captures.push(name+'.png');}
  await page.screenshot({path:path.join(output,'desktop-opening.png')});report.captures.push('desktop-opening.png');
  for(const [label,width,font] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
   await page.setViewportSize({width,height:1000});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);
   for(let i=0;i<count;i++)await shot(figures.nth(i),`${label}-${String(i+1).padStart(2,'0')}`);
   const layout=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));report.layouts.push({label,font,...layout});check(layout.width<=layout.viewport+1,label+' no page overflow');
  }
  await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  const read=id=>page.locator('#'+id+' .flow-readout').innerText();
  await page.locator('#mlm-corruption').getByRole('button',{name:'random',exact:true}).click();
  await page.getByLabel('Random draw').selectOption('bank');check((await read('mlm-corruption')).includes('unchanged'),'Random self-collision remains a selected target');await shot(page.locator('#mlm-corruption'),'changed-random-self');
  await page.getByLabel('Random draw').selectOption('[PAD]');await shot(page.locator('#mlm-corruption'),'changed-random-pad');
  await page.getByLabel('Target position').selectOption('-1');check((await read('mlm-corruption')).includes('No selected targets'),'No corruption target shown explicitly');await shot(page.locator('#mlm-corruption'),'empty-selection');
  await page.getByRole('button',{name:'Reset trace'}).click();
  await page.getByRole('slider',{name:'Eligible positions'}).fill('200');check((await read('mlm-rates')).includes('30'),'Changed denominator yields 30 expected targets');
  await page.locator('#mlm-rates').getByRole('slider',{name:'Selection rate (%)'}).fill('0');check((await read('mlm-rates')).includes('probability of no selected targets: 1'),'Zero rate no-target probability');await shot(page.locator('#mlm-rates'),'zero-rate');await page.getByRole('button',{name:'Reset rates'}).click();
  await page.locator('#mlm-attention').getByRole('button',{name:'Causal',exact:true}).click();check((await read('mlm-attention')).includes('0, 1, 2'),'Causal diagonal permitted');
  await page.getByRole('slider',{name:'Trace query position'}).fill('5');check((await read('mlm-attention')).includes('coincide'),'Final-query null comparison');await shot(page.locator('#mlm-attention'),'last-query-null');await page.getByRole('button',{name:'Reset attention'}).click();
  check((await read('mlm-loss')).includes('2.079442'),'Initial selected sum exact');
  await page.getByRole('slider',{name:'P(original bank)'}).fill('0.99');check((await read('mlm-loss')).includes('1.396345'),'Changed target loss exact');await shot(page.locator('#mlm-loss'),'changed-loss');
  await page.getByLabel('Score target 1').uncheck();await page.getByLabel('Score target 2').uncheck();check((await page.locator('#mlm-loss').innerText()).includes('mean undefined'),'Empty mean is undefined');await shot(page.locator('#mlm-loss'),'empty-loss');await page.getByRole('button',{name:'Reset loss'}).click();
  const fixed=await page.locator('.mlm-fixed-boundary').innerText();await page.getByRole('button',{name:'Next three visits'}).click();check(await page.locator('.mlm-fixed-boundary').innerText()===fixed,'Evaluation fixed after new training visits');
  await page.getByRole('slider',{name:'Training selection rate (%)'}).fill('100');check((await read('mlm-dynamic')).includes('4, 4, 4'),'All eligible targets at full rate');await shot(page.locator('#mlm-dynamic'),'all-targets');
  await page.getByRole('slider',{name:'Training selection rate (%)'}).fill('0');check((await read('mlm-dynamic')).includes('0, 0, 0'),'Zero rate gives no targets');await shot(page.locator('#mlm-dynamic'),'empty-visits');await page.getByRole('button',{name:'Reset visits'}).click();
  const range=page.getByRole('slider',{name:'Trace query position'});await range.focus();await range.press('ArrowRight');check(await range.inputValue()==='3','Keyboard slider changes state');
  const blocks=page.locator('.mlm-flow .lesson-code-source');check(await blocks.count()===3,'Three full canonical programs');
  for(let i=0;i<3;i++){
   const block=blocks.nth(i);await block.scrollIntoViewIfNeeded();await block.locator('pre').waitFor();const name=await block.locator('.lesson-code__filename').innerText();const canonical=fs.readFileSync('public/learn-code/masked-language-modeling/'+name,'utf8');
   check(await block.locator('pre code').textContent()===canonical,`${name} full visible source`);
   await block.getByRole('button',{name:'Copy '+name,exact:true}).click();check((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n')===canonical.replace(/\r\n/g,'\n'),`${name} full Copy`);
   const pending=page.waitForEvent('download');await block.getByRole('link',{name:'Download '+name,exact:true}).click();const download=await pending;const temp=await download.path();check(fs.readFileSync(temp,'utf8')===canonical,`${name} full Download`);
  }
  for(const id of ['1-why-it-exists','1-start-with-the-problem','2-core-intuition','2-build-the-intuition','3-math-foundation','3-make-the-idea-precise','4-from-scratch-implementation','5-production-implementation','6-visual-walkthrough','7-decision-matrix','8-what-scales-and-what-doesn-t','9-failure-modes-and-gotchas','10-primary-sources','11-self-check-exercises'])check(await page.locator(`[id="${id}"]`).count()===1,'Preserved fragment '+id);
  check(await page.locator('[data-lesson-exercise]').count()===7,'Seven visible practice prompts');
  await page.route('**/learn-code/masked-language-modeling/scratch-training.json',r=>r.abort());await page.reload();await page.getByRole('button',{name:'Retry measurements'}).waitFor();await shot(page.locator('#mlm-recorded'),'failed-measurements');await page.unroute('**/learn-code/masked-language-modeling/scratch-training.json');await page.getByRole('button',{name:'Retry measurements'}).click();await page.locator('#mlm-recorded .mlm-values').waitFor();check(true,'Saved measurement failure and retry');
  check(report.errors.length===0,'No runtime exceptions');
  report.paint='Captured all default views and changed/empty states; author must inspect pixels separately.';
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,layouts:report.layouts,errors:report.errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
