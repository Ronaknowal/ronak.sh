// Complementary actual-browser checks after the author's complete runtime freeze.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic='docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const out=process.argv[2];
assert.ok(out&&!fs.existsSync(out),'Pass a fresh output directory');
fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sourcePaths=[`${topic}/lesson.jsx`,'src/learn/data/dapo-models.js','public/learn-code/dapo/runtime-observations.json',...['Foundations','Objectives','Collection','Evidence','Elements','Flow'].map(s=>`src/learn/components/lesson-labs/Dapo${s}.jsx`),'src/learn/components/lesson-labs/dapo-flow.css'];
const report={at:new Date().toISOString(),sources:Object.fromEntries(sourcePaths.map(p=>[p,sha(p)])),checks:[],captures:[],errors:[]};
const ok=(v,label)=>{assert.ok(v,label);report.checks.push(label);};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:1000}});
  await require('./lib/lesson-browser-fonts.cjs')(context);
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const base='http://127.0.0.1:4253';
  await page.request.get(`${base}/__llm_refresh`);
  await page.goto(`${base}/learn/path/full-curriculum/dapo-dynamic-adaptive-policy-optimization?module=large-language-models`,{waitUntil:'domcontentloaded',timeout:90000});
  const fig=id=>page.locator(`[data-dapo-figure="${id}"]`);
  await fig('D36').waitFor({timeout:90000});
  await fig('D26').getByRole('combobox',{name:'Saved parity case',exact:true}).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important}'});
  ok(await page.locator('[data-dapo-figure]').count()===36,'All36 mechanisms mount in actual reader');
  ok(await page.locator('[data-lesson-exercise]').count()===18,'All18 practice tasks remain');
  const text=async id=>(await fig(id).innerText()).replace(/\s+/g,' ');
  const select=async(id,label,value)=>fig(id).getByRole('combobox',{name:label,exact:true}).selectOption(value);
  const number=async(id,label,value)=>fig(id).getByRole('spinbutton',{name:label,exact:true}).fill(String(value));
  const reset=async id=>fig(id).getByRole('button',{name:'Reset',exact:true}).click();
  async function capture(name,id){
   const element=id?fig(id):page.locator('.lesson-compass');
   await element.scrollIntoViewIfNeeded();await page.waitForTimeout(250);
   const before=await element.boundingBox();await page.waitForTimeout(100);const after=await element.boundingBox();
   ok(Math.abs(before.y-after.y)<.2,`${name}: stable capture position`);
   const file=path.join(out,`${name}.png`);
   await element.screenshot({path:file,style:'.site-header--learn,.site-skip{visibility:hidden!important}'});
   report.captures.push({name,id,file,sha256:sha(file)});
  }
  await select('D01','Trace response','0');ok(/Wrong integer 13/i.test(await text('D01')),'A remains the wrong-number response');
  await select('D01','Trace response','1');ok(/malformed/i.test(await text('D01')),'B remains malformed');
  await select('D01','Trace response','2');ok(/12/.test(await text('D01')),'C retains correct12 identity');
  await reset('D01');
  await select('D02','B terminal reward','1');ok(/counterfactual/i.test(await text('D02')),'B reward edit is explicitly counterfactual');await reset('D02');
  await select('D07','Advantage sign','-1');await number('D07','Likelihood ratio',.8);ok(/no unique mathematical derivative/i.test(await text('D07')),'Exact active negative knee remains nondifferentiable');
  await select('D07','Advantage sign','0');ok(/derivative = 0/.test(await text('D07')),'Zero advantage at numeric boundary stays differentiable zero');await reset('D07');
  await number('D08','Constructed logit step size',8);ok(/crosses the nominal threshold/.test(await text('D08')),'Large constructed step crosses objective threshold');await reset('D08');
  await number('D10','Ratio',10);ok(/nondifferentiable active knee/.test(await text('D10')),'Dual10 knee stays explicit');await reset('D10');
  await select('D12','Selected mask','empty');ok(/Undefined: zero selected-token denominator/.test(await text('D12')),'Empty loss mask is undefined');await reset('D12');
  await select('D13','Candidate sequence','exhausted');await fig('D13').getByRole('button',{name:'Next candidate batch',exact:true}).click();await fig('D13').getByRole('button',{name:'Next candidate batch',exact:true}).click();
  ok(/exhausted/.test(await text('D13'))&&/zero optimizer updates/.test(await text('D13')),'Finite exhausted partial batch does not update');await reset('D13');
  await number('D16','Type B correctness p',1);ok(/No accepted population/.test(await text('D16')),'Both homogeneous populations yield unavailable conditional distribution');await reset('D16');
  await select('D26','Saved parity case','7');ok(/Actual FP32 sampled update/.test(await text('D26'))&&/zero loss\/gradient signal/.test(await text('D26')),'Actual zero native case remains separate and selectable');
  await capture('actual-native-zero','D26');await reset('D26');
  await select('D27','Recorded outcome','accuracy');ok(/not observed/.test(await text('D27')),'Failed run terminal metric remains absent on accuracy plot');await reset('D27');
  await select('D28','Recorded method and seed','3');ok(/No complete-run timing/.test(await text('D28')),'Failed run timing remains unavailable');await reset('D28');
  await select('D29','Parser fixture','5');ok(/No following closing brace/.test(await text('D29')),'Final unfinished box rejects instead of falling back');await reset('D29');
  await select('D35','A outcome reward','1');ok(/zero policy terms/.test(await text('D35')),'Homogeneous complete trace explicitly has zero signal');await reset('D35');
  await number('D36','Target groups',10);ok(/filling it is impossible/.test(await text('D36')),'Target exceeding candidate budget is impossible');await reset('D36');
  for(const[width,font,name]of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]){
   await page.setViewportSize({width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=`${v}px`,font);
   ok(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize)===`${font}px`,`${name}: actual root text size`);
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: no document overflow`);
   for(const id of ['D01','D02','D07','D16','D23','D26','D30','D35'])await capture(`${name}-${id}`,id);
   const local=fig('D23').locator('.dapo-local').first();
   if(await local.evaluate(e=>e.scrollWidth>e.clientWidth+1)){
    await local.evaluate(e=>e.scrollLeft=0);await local.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);
    ok(await local.evaluate(e=>e.scrollLeft>0),`${name}: keyboard reaches aligned decoder overflow`);
   }
  }
  // A denied evidence request must recover without inventing observations.
  const failure=await context.newPage();failure.on('pageerror',e=>report.errors.push(e.message));
  let deny=true;
  await failure.route('**/learn-code/dapo/runtime-observations.json',route=>deny?route.fulfill({status:503,body:'temporarily unavailable'}):route.continue());
  await failure.goto(`${base}/learn/path/full-curriculum/dapo-dynamic-adaptive-policy-optimization?module=large-language-models`,{waitUntil:'domcontentloaded'});
  const retry=failure.getByRole('button',{name:'Retry recorded observations',exact:true}).first();await retry.waitFor();
  ok(await failure.locator('[data-dapo-figure="D26"]').innerText().then(t=>t.includes('could not load')),'Evidence failure appears explicitly');
  deny=false;await retry.click();await failure.locator('[data-dapo-figure="D26"] select').waitFor();ok(true,'Retry loads the same preserved evidence');await failure.close();
  ok(report.errors.length===0,'No runtime page errors');
  for(const[p,h]of Object.entries(report.sources))ok(sha(p)===h,`source stable: ${p}`);
  report.status='passed';
 }catch(error){report.status='failed';report.failure=error.stack;process.exitCode=1;}
 finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,checks:report.checks.length,captures:report.captures.length,failure:report.failure}));}
})();
