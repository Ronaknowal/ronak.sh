const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base='docs/teaching/llm-architecture-training/constitutional-ai-cai';
const output=path.join(base,'review-successor/browser-final-corrections');fs.mkdirSync(output,{recursive:true});
const moved=['critique-context','revision-ancestry','target-masks','parameter-states','choice-mass','order-mapping','label-transform','label-credit','reward-head','preference-gradient','preference-cycle','policy-anchor','dpo-update','real-record-audit','seq2seq-anatomy','coverage-counts','calibration-bins','error-dependence','collective-votes','work-ledger'];
let browser;
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[],captures=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.request.get('http://127.0.0.1:4250/__llm_refresh',{timeout:90000});
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/constitutional-ai-cai?module=large-language-models',{timeout:90000});
  await page.locator('[data-cai-figure]').nth(23).waitFor({timeout:90000});
  await page.locator('[data-cai-figure="seq2seq-anatomy"] .cai-controls').waitFor({timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('[data-cai-figure]').count(),24);
  await page.screenshot({path:path.join(output,'normal-opening.png')});captures.push('normal-opening.png');
  await page.addStyleTag({content:'.site-header--learn {visibility:hidden!important} html,* {scroll-behavior:auto!important}'});
  const figure=id=>page.locator(`[data-cai-figure="${id}"]`);
  async function capture(node,file){await node.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(150);await node.screenshot({path:path.join(output,file)});captures.push(file);}
  for(const [mode,width,font] of [['desktop',1440,16],['phone',390,16],['enlarged',768,32]]) {
    await page.setViewportSize({width,height:1000});await page.evaluate(s=>document.documentElement.style.fontSize=s+'px',font);await page.waitForTimeout(650);
    const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(bounds.scroll<=width+1,`${mode} page bounds ${JSON.stringify(bounds)}`);checks.push({name:`${mode} page bounds`,...bounds});
    for(const id of moved) {
      const f=figure(id);const order=await f.evaluate(e=>{
        const controls=e.querySelector('.cai-controls'),box=controls.getBoundingClientRect();
        const objects=Array.from(e.querySelectorAll('.cai-local,.cai-probability,.cai-signed,.cai-context,.cai-ancestry,.cai-tensor-route,.cai-mass-strip,.cai-record,.cai-encoder-decoder,.cai-bin-ledger,.cai-vote-groups,.cai-work-strip,.cai-result'));
        return {controlsTop:box.top,objects:objects.map(n=>({class:n.className,bottom:n.getBoundingClientRect().bottom})),fields:controls.querySelectorAll('input,select').length};
      });
      assert.ok(order.objects.length>0,`${id} no visible object/output`);
      assert.ok(order.objects.every(o=>o.bottom<=order.controlsTop+1),`${id} controls still precede a structure/current output`);
      checks.push({name:`${mode} ${id} controls follow structures/results`,fields:order.fields});
      await capture(f,`${mode}-${id}.png`);
    }
    if(mode==='desktop')continue;
    const exercises=page.locator('[data-lesson-exercise]');
    for(const number of [2,3,4,5,7,9,10]) {
      const exercise=exercises.nth(number-1);
      await exercise.locator('details').last().evaluate(e=>e.open=true);
      await capture(exercise,`${mode}-practice-${number}.png`);
    }
    const openBounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(openBounds.scroll<=width+1,`${mode} open solutions bounds ${JSON.stringify(openBounds)}`);checks.push({name:`${mode} open solutions bounds`,...openBounds});
  }
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  const label=figure('label-transform'),credit=figure('label-credit');
  assert.doesNotMatch(await label.innerText(),/binary cross-entropy|p−q|BCE/);checks.push({name:'section4 chart uses only judge targets'});
  assert.match(await credit.innerText(),/fixed preference is p=.5/);checks.push({name:'section5 credit has local model-probability bridge'});
  await capture(label,'desktop-target-transform.png');await capture(credit,'desktop-label-credit.png');
  await capture(credit.locator('xpath=preceding-sibling::*[1]'),'desktop-credit-bridge.png');
  await credit.getByLabel('Raw target q',{exact:true}).fill('0.5');
  assert.match(await credit.innerText(),/difference gradient 0\./);checks.push({name:'new credit tie gives zero gradient'});await capture(credit,'changed-credit-tie.png');
  await credit.getByLabel('Clamp lower',{exact:true}).fill('0.9');await credit.getByLabel('Clamp upper',{exact:true}).fill('0.1');
  assert.ok(await credit.locator('.cai-invalid').count());checks.push({name:'new credit invalid clamp remains invalid'});await capture(credit,'changed-credit-invalid-clamp.png');
  await credit.getByRole('button',{name:'Reset',exact:true}).click();
  const gradient=figure('preference-gradient');await gradient.getByRole('button',{name:'Set q to current p (null gradient)',exact:true}).click();
  assert.match(await gradient.innerText(),/Exact zero-update case/);checks.push({name:'relocated null-gradient action still updates'});await capture(gradient,'changed-relocated-null-gradient.png');
  const target=figure('target-masks');await target.getByLabel('Ignore every target',{exact:true}).check();assert.match(await target.innerText(),/Mean loss undefined/);checks.push({name:'relocated mask control preserves no-target state'});await capture(target,'changed-relocated-no-target.png');
  assert.equal(errors.length,0);
  const inputs=[__filename,'src/learn/components/lesson-labs/ConstitutionalAIFlow.jsx','src/learn/data/constitutional-ai-models.js','src/learn/components/lesson-labs/constitutional-ai-flow.css',`${base}/manuscript.jsx`];
  const hashes=Object.fromEntries(inputs.map(p=>[p.replaceAll('\\','/'),crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'passed',checks,captures,errors,files:hashes},null,2)+'\n');
  await browser.close();console.log(JSON.stringify({status:'passed',checks:checks.length,captures:captures.length,errors}));
})().catch(e=>{fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({status:'failed',message:e.message,stack:e.stack},null,2));console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
