const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback';
const out = `${owner}/independent-runtime/browser`;
fs.mkdirSync(out,{recursive:true});
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = {status:'running',checks:[],errors:[],sources:{}};
const ok = (condition,label) => {assert.ok(condition,label);report.checks.push(label);};
for (const file of [`${owner}/lesson.jsx`,'src/learn/components/lesson-labs/RLHFFlow.jsx','src/learn/components/lesson-labs/rlhf-flow.css','src/learn/data/rlhf-models.js','src/learn/data/rlhf-observations.js']) report.sources[file]=hash(file);
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:1000}});
    const page=await context.newPage();
    page.on('pageerror',error=>report.errors.push(String(error)));
    const base='http://127.0.0.1:4250';
    await page.request.get(`${base}/__llm_refresh`);
    await page.goto(`${base}/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models`,{waitUntil:'domcontentloaded',timeout:90000});
    await page.locator('.rlhf-flow').waitFor({timeout:90000});
    const figures=page.locator('[data-rlhf-figure]');
    ok(await figures.count()===28,'Actual normal reader mounts all 28 figures');
    ok(await page.locator('[data-lesson-exercise]').count()===15,'Actual reader includes all fifteen practices');
    const invalid=await figures.evaluateAll(nodes=>nodes.flatMap(node=>{
      const controls=node.querySelector('.rlhf-controls');
      if(!controls)return [];
      const previous=controls.previousElementSibling;
      return previous && (controls.compareDocumentPosition(previous)&Node.DOCUMENT_POSITION_PRECEDING)?[]:[node.dataset.rlhfFigure];
    }));
    ok(invalid.length===0,'Controls follow their visual and explanation in DOM');
    const fig=id=>page.locator(`[data-rlhf-figure="${id}"]`);
    await fig('D09').getByRole('checkbox',{name:'Give reference C zero support'}).check();
    ok((await fig('D09').innerText()).includes('infinite KL'),'Combined support case begins invalid');
    await fig('D09').getByRole('button',{name:'Set current equal to reference'}).click();
    ok((await fig('D09').innerText()).includes('Exact KL = 0 nats'),'Setting policy equal to zero-support reference restores finite zero KL');
    await fig('D14').getByRole('spinbutton',{name:'Prompt positions',exact:true}).fill('1');
    await fig('D14').getByRole('spinbutton',{name:'Response actions including EOS',exact:true}).fill('4');
    await fig('D14').getByRole('checkbox',{name:'Padding shares EOS token ID'}).check();
    ok((await fig('D14').innerText()).includes('first response target uses logit 0'),'Changed joint mask case starts at BOS predictor');
    await fig('D19').getByRole('checkbox',{name:'No valid actions'}).check();
    await fig('D19').getByRole('checkbox',{name:'Constant valid advantages'}).check();
    await fig('D19').getByRole('spinbutton',{name:'Excluded PAD filler'}).fill('-1000');
    ok((await fig('D19').innerText()).includes('mean = undefined'),'Combined empty/constant/filler state remains undefined');
    await fig('D19').getByRole('button',{name:'Reset',exact:true}).click();
    ok((await fig('D19').innerText()).includes('mean = 0.332'),'Combined null-state reset restores default');
    for (const [width,font] of [[1366,16],[390,16],[768,32]]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,font);
      await fig('D13').getByRole('spinbutton',{name:'Temperature',exact:true}).fill('3');
      ok((await fig('D13').innerText()).includes('0.32745'),'Changed temperature exact current probability');
      ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Current whole page bounds ${width}/${font}`);
      const local=fig('D14').locator('.rlhf-local');
      if(await local.evaluate(node=>node.scrollWidth>node.clientWidth+1)) {
        await local.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        ok(await local.evaluate(node=>node.scrollLeft>0),`Native keyboard action changes joint mask scroll ${width}/${font}`);
      }
    }
    await page.evaluate(()=>document.documentElement.style.fontSize='16px');
    await page.setViewportSize({width:1366,height:1000});
    const programs=['preference_records.py','pairwise_reward.py','policy_gradient.py','token_credit.py','token_ppo.py','causal_backbone.py','rlhf_study.py','transformers_bridge.py','reward_trainer.py'];
    const blocks=page.locator('.lesson-code-source');
    ok(await blocks.count()===9,'All nine complete program owners present');
    for(let i=0;i<programs.length;i++) {
      const block=blocks.nth(i),name=programs[i];
      await block.scrollIntoViewIfNeeded();
      await block.locator('pre code').waitFor();
      const expected=fs.readFileSync(`public/learn/examples/rlhf/${name}`,'utf8');
      ok(await block.locator('pre code').textContent()===expected,`${name} entire actual visible source`);
      ok(await block.getByRole('button',{name:`Copy ${name}`,exact:true}).count()===1,`${name} Copy surface`);
      const href=await block.getByRole('link',{name:`Download ${name}`,exact:true}).getAttribute('href');
      const response=await page.request.get(new URL(href,base).href);
      ok(response.ok() && crypto.createHash('sha256').update(await response.body()).digest('hex')===hash(`public/learn/examples/rlhf/${name}`),`${name} current downloadable asset exact bytes`);
    }
    const archive=page.getByRole('link',{name:/Download the complete runnable folder/});
    report.archiveLinks=await page.locator('a[href*="rlhf-programs.zip"]').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent,href:node.getAttribute('href')})));
    ok(report.archiveLinks.length>0,'Runnable archive is visibly linked');
    const zip=await page.request.get(`${base}/learn/examples/rlhf/rlhf-programs.zip`);
    ok(zip.ok() && crypto.createHash('sha256').update(await zip.body()).digest('hex')===hash('public/learn/examples/rlhf/rlhf-programs.zip'),'Current archive HTTP bytes equal accepted archive');
    ok(report.errors.length===0,'No actual reader page errors');
    for(const [file,sha] of Object.entries(report.sources)) ok(hash(file)===sha,'Stable current source '+file);
    report.status='passed';
  } catch(error) {report.status='failed';report.failure=String(error.stack||error);process.exitCode=1;}
  finally {await browser.close();fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,failure:report.failure}));}
})();
