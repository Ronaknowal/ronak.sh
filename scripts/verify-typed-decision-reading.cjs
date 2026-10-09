const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const topic = 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems';
const output = path.resolve(topic, 'browser-evidence');
const stamp = Date.now();
const paths = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/typed-decision-models.js',
  ...['Shared', 'Foundations', 'Probability', 'Study', 'Native'].map(x => `src/learn/components/lesson-labs/TypedDecision${x}.jsx`),
  'src/learn/components/lesson-labs/typed-decision-flow.css', 'scripts/verify-typed-decision-reading.cjs'];
const hashes = () => Object.fromEntries(paths.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));

(async () => {
  const report = {before: hashes(), captures: [], interactions: [], errors: []};
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:1000}});
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:4252/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models');
    await page.locator('[data-typed-figure="D36"] select').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important}'});
    async function shot(name, element) {
      await element.scrollIntoViewIfNeeded();
      const file = `${stamp}-${name}.png`;
      await element.screenshot({path:path.join(output,file),style:'.site-header--learn,.site-skip{visibility:hidden!important}'});
      report.captures.push(file);
    }
    for (const details of await page.locator('.lesson-compass details,[data-lesson-exercise] details').all()) {
      await details.locator('summary').click();
    }
    assert.equal(await page.locator('.lesson-compass__sections a').count(),22);
    assert.equal(await page.locator('.typed-flow .neural-equation').count(),7);
    for (const [width,font,profile] of (process.argv.includes('--interactions-only') ? [] : [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']])) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(value => document.documentElement.style.fontSize=value+'px',font);
      await shot(`${profile}-opening`,page.locator('.lesson-compass'));
      for (const [i,math] of (await page.locator('.typed-flow .neural-equation').all()).entries()) {
        await shot(`${profile}-equation-${i}`,math);
        const extent = await math.evaluate(el => el.scrollWidth-el.clientWidth);
        if(extent>2) {
          await math.evaluate(el => el.scrollLeft=el.scrollWidth);
          await shot(`${profile}-equation-${i}-end`,math);
          await math.evaluate(el => el.scrollLeft=0);
        }
      }
      if(profile!=='desktop') for(const [i,exercise] of (await page.locator('[data-lesson-exercise]').all()).entries()) await shot(`${profile}-practice-${i+1}`,exercise);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1));
    }
    const figure = id => page.locator(`[data-typed-figure="${id}"]`);
    await page.setViewportSize({width:1366,height:1000});
    await page.evaluate(() => document.documentElement.style.fontSize='16px');
    for(const [id,label,value] of [['D07','B logit before shift','-8'],['D10','Original predicate probability','0'],['D16','Noise scale','0.05']]) {
      await figure(id).getByRole('slider',{name:new RegExp(label)}).fill(value);
      await shot(`secondary-${id}`,figure(id));
    }
    for(let i=0;i<6;i++) {
      await figure('D31').getByRole('combobox').selectOption(String(i));
      assert.match(await figure('D31').innerText(),new RegExp(`row ${i} → state ${Math.floor(i/3)}`));
    }
    for(let i=0;i<24;i++) {
      await figure('D35').getByRole('combobox',{name:'Prespecified intervention'}).selectOption(String(i));
      assert.ok((await figure('D35').innerText()).includes('Selected '));
    }
    for(const method of ['seed-17','seed-29','seed-43','lexical','laya']) await figure('D23').getByRole('combobox').selectOption(method);
    await figure('D28').getByRole('button',{name:'Reset',exact:true}).click();
    assert.match(await figure('D28').innerText(),/0\.6083333/);
    const pane = figure('D04').locator('.typed-scroll').first();
    await pane.focus(); await pane.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('[data-typed-figure="D04"] .typed-scroll').scrollLeft > 0);
    report.interactions.push('All six native restored rows, all 24 saved shifts, all five predictor selections, secondary sliders, primary routing reset, keyboard horizontal pan');
    await page.locator('.lesson-compass__sections a').filter({hasText:'13.'}).first().click();
    assert.ok(page.url().includes('#13-'));
    assert.deepEqual(report.errors,[]);
    report.status='passed';
  } catch(error) {report.status='failed';report.failure=error.stack;}
  finally {
    report.after=hashes(); report.sourceChanged=JSON.stringify(report.before)!==JSON.stringify(report.after);
    fs.writeFileSync(path.join(output,`reading-${stamp}.json`),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({status:report.status,stamp,captures:report.captures.length,failure:report.failure,sourceChanged:report.sourceChanged}));
    await browser.close();
    if(report.status!=='passed'||report.sourceChanged)process.exitCode=1;
  }
})();
