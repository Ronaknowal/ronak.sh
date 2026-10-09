const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const topic = 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems';
const stamp = Date.now();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const source = 'src/learn/components/lesson-labs/typed-decision-flow.css';
(async () => {
  const report = {before:hash(source),captures:[],checks:[],errors:[]};
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext();
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.request.get('http://127.0.0.1:4252/__llm_refresh');
    await page.goto('http://127.0.0.1:4252/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models');
    await page.locator('[data-typed-figure="D36"] select').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important}'});
    for(const el of await page.locator('.lesson-compass details,[data-lesson-exercise] details').all()) await el.evaluate(e=>e.open=true);
    async function shot(name,element) {
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const before=await element.boundingBox();
      await page.waitForTimeout(200);
      const after=await element.boundingBox();
      assert.ok(Math.abs(before.y-after.y)<.1);
      const file=`${stamp}-${name}.png`;
      await element.screenshot({path:path.join(topic,'browser-evidence',file),style:'.site-header--learn,.site-skip{visibility:hidden!important}'});
      report.captures.push(file);
    }
    for(const [width,font,name] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);
      await shot(name+'-opening',page.locator('.lesson-compass'));
      const columns=await page.locator('.lesson-compass__sections').evaluate(e=>getComputedStyle(e).gridTemplateColumns);
      if(name!=='desktop') assert.equal(columns.trim().split(/\s+/).length,1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      report.checks.push({name,columns});
      if(name==='zoom') await shot('zoom-practice-14-stable',page.locator('[data-lesson-exercise]').nth(13));
    }
    assert.deepEqual(report.errors,[]); report.status='passed';
  } catch(e) {report.status='failed';report.failure=e.stack;}
  finally {
    report.after=hash(source);report.sourceChanged=report.before!==report.after;
    fs.writeFileSync(path.join(topic,'browser-evidence',`final-reading-${stamp}.json`),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));await browser.close();
    if(report.status!=='passed'||report.sourceChanged)process.exitCode=1;
  }
})();
