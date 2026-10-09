const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment';
const output = path.join(base, 'browser-different-review');
fs.mkdirSync(output, { recursive: true });
const url = 'http://127.0.0.1:4250/learn/path/full-curriculum/multimodal-pre-training-vision-encoders-cross-modal-alignment?module=large-language-models';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const checks = [], errors = [], captures = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.request.get('http://127.0.0.1:4250/__llm_refresh');
  await page.goto(url, { timeout: 90000 });
  await page.locator('[data-mmp-figure]').nth(24).waitFor({ timeout: 90000 });
  await page.addStyleTag({ content: '.site-header--learn {visibility:hidden!important} html,* {scroll-behavior:auto!important}' });
  for (const [mode, width, font] of [['phone',390,16], ['enlarged',768,32]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, font);
    await page.waitForTimeout(150);
    const bounds = await page.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(bounds.scroll <= width+1); checks.push({name:`${mode} page bounds`,...bounds});
    const regions = page.locator('.mmp-scroll,.mmp-math');
    for (let i=0; i<await regions.count(); i++) {
      const region=regions.nth(i);
      const initial=await region.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,label:e.getAttribute('aria-label'),kind:e.className}));
      if (initial.scroll<=initial.width+1) continue;
      await region.scrollIntoViewIfNeeded();
      await region.focus();
      await region.evaluate(e=>e.scrollLeft=0);
      for(let j=0;j<45;j++) await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
      const end=await region.evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));
      assert.ok(end.left>0,`${mode} ${i} keyboard did not scroll`);
      checks.push({name:`${mode} native ArrowRight ${i}`, ...initial, ...end});
    }
    const equations = page.locator('.mmp-math');
    for(let i=0; i<await equations.count(); i++) {
      const eq=equations.nth(i);
      await eq.evaluate(e=>{e.scrollLeft=0;e.scrollIntoView({block:'center',behavior:'instant'});});
      await page.evaluate(()=>document.activeElement?.blur());
      const file=`${mode}-equation-${i+1}.png`;
      await eq.screenshot({path:path.join(output,file)});captures.push(file);
      const dims=await eq.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));
      if(dims.scroll>dims.width+1) {
        await eq.focus();for(let j=0;j<45;j++)await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(150);await page.evaluate(()=>document.activeElement?.blur());
        const fileEnd=`${mode}-equation-${i+1}-end.png`;
        await eq.screenshot({path:path.join(output,fileEnd)});captures.push(fileEnd);
      }
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  const intervention=page.locator('section.flow-lab').filter({has:page.locator('[data-mmp-figure="25 Evidence under image intervention"]')});
  await intervention.getByRole('button',{name:'Use unchanged image',exact:true}).click();
  await page.waitForTimeout(600);
  const styles=await intervention.locator('.mmp-pixels').evaluateAll(nodes=>nodes.slice(0,2).map(e=>Array.from(e.children).map(x=>getComputedStyle(x).backgroundColor)));
  assert.deepEqual(styles[0],styles[1]);checks.push({name:'settled unchanged image has identical 64 painted pixel colours',pass:true});
  await page.evaluate(()=>document.activeElement?.blur());
  await intervention.screenshot({path:path.join(output,'unchanged-image-settled.png')});captures.push('unchanged-image-settled.png');
  assert.equal(errors.length,0);
  const sources=[__filename,'src/learn/components/lesson-labs/MultimodalPretrainingFlow.jsx','src/learn/components/lesson-labs/multimodal-pretraining-flow.css','src/learn/data/multimodal-pretraining-models.js',`${base}/manuscript.jsx`];
  const hashes=Object.fromEntries(sources.map(p=>[p.replaceAll('\\','/'),crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'passed',checks,captures,errors,files:hashes},null,2)+'\n');
  await browser.close();console.log(JSON.stringify({status:'passed',checks:checks.length,captures:captures.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
