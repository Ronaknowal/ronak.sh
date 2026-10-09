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
  'src/learn/components/lesson-labs/typed-decision-flow.css', 'public/learn-assets/typed-decision-systems/observations.json', __filename];
const hashes = () => Object.fromEntries(paths.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));

(async () => {
  const report = {before: hashes(), captures: [], checks: [], errors: []};
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:1000}});
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.request.get('http://127.0.0.1:4252/__llm_refresh');
    await page.goto('http://127.0.0.1:4252/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models');
    const figure = id => page.locator(`[data-typed-figure="${id}"]`);
    await figure('D36').getByRole('combobox').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important}'});
    // Load every lazy code panel before locator screenshots can be displaced by it.
    for(const panel of await page.locator('.lesson-program').all()) await panel.scrollIntoViewIfNeeded();
    async function shot(name, element) {
      await element.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement?.blur());
      let last = await element.boundingBox();
      for(let i=0;i<12;i++) {
        await page.waitForTimeout(100);
        const next = await element.boundingBox();
        if(Math.abs(next.y-last.y)<.1 && Math.abs(next.height-last.height)<.1) break;
        last=next;
      }
      const file = `${stamp}-${name}.png`;
      await element.screenshot({path:path.join(output,file),style:'.site-header--learn,.site-skip{visibility:hidden!important}'});
      report.captures.push(file);
    }
    async function full(name, element) {
      await shot(name, element);
      for(const [i,pane] of (await element.locator('.typed-scroll,.neural-table__scroll').all()).entries()) {
        const {extent,width}=await pane.evaluate(el=>({extent:el.scrollWidth-el.clientWidth,width:el.clientWidth}));
        if(extent>2) {
          const positions=[];
          for(let x=width*.8;x<extent;x+=width*.8) positions.push(x);
          positions.push(extent);
          for(const [j,x] of positions.entries()) { await pane.evaluate((el,v)=>el.scrollLeft=v,x); await shot(`${name}-pan${i}-${j}`,pane); }
          await pane.evaluate(el=>el.scrollLeft=0);
        }
      }
    }
    const reset=id=>figure(id).getByRole('button',{name:'Reset',exact:true}).click();
    for(const [width,font,profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);
      for(const [id,control,disabled] of [
        ['D04','All candidates invalid','Omit candidate padding mask'],
        ['D07','All invalid','C is invalid'],
        ['D17','Constructed constant-reward LOO null',null]]) {
        await reset(id);
        await figure(id).getByRole('checkbox',{name:control,exact:true}).check();
        if(disabled) assert.ok(await figure(id).getByRole('checkbox',{name:disabled,exact:true}).isDisabled());
        else for(const select of await figure(id).getByRole('combobox').all()) assert.ok(await select.isDisabled());
        await full(`${profile}-${id}-null`,figure(id));
        await reset(id);
        assert.equal(await figure(id).locator(':disabled').count(),0);
        await full(`${profile}-${id}-reset`,figure(id));
      }
      await reset('D13'); await full(`${profile}-D13-default`,figure('D13'));
      await figure('D13').getByRole('button',{name:'Report the true p'}).click();
      assert.match(await figure('D13').innerText(),/numerically zero/);
      await full(`${profile}-D13-truth`,figure('D13'));
      await full(`${profile}-D18`,figure('D18'));
      assert.match(await figure('D18').innerText(),/live θ/);
      await full(`${profile}-D25`,figure('D25'));
      for(const [i,name] of [[16,'hindi'],[2,'omit'],[0,'reverse'],[22,'rename']]) {
        await figure('D35').getByRole('combobox',{name:'Prespecified intervention'}).selectOption(String(i));
        await full(`${profile}-D35-${name}`,figure('D35'));
      }
      const refs=page.locator('[data-lesson-ending="references"]');
      await full(`${profile}-references`,refs);
      const title=refs.getByRole('link',{name:'Laya source revision',exact:true});
      assert.equal(await title.evaluate(el=>getComputedStyle(el).overflowWrap),'normal');
      if(profile==='phone') { await reset('D08'); await full('phone-D08-stable-default',figure('D08')); }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      report.checks.push(`${profile}: disabled null/reset, roundoff, gradient paths, calibration caption, stable identity colours, references and page width`);
    }
    // Compare actual painted bar colours by identity in every saved intervention.
    const data=JSON.parse(fs.readFileSync('public/learn-assets/typed-decision-systems/observations.json','utf8'));
    const ids=['card_arrival','card_delivery_estimate','card_linking','card_not_working','lost_or_stolen_card','card_payment_not_recognised'];
    const colors=['rgb(125, 184, 255)','rgb(255, 153, 126)','rgb(181, 160, 255)','rgb(232, 189, 104)','rgb(109, 212, 221)','rgb(239, 149, 196)'];
    for(let i=0;i<24;i++) {
      await figure('D35').getByRole('combobox',{name:'Prespecified intervention'}).selectOption(String(i));
      const row=data.shifts.rows[i];
      for(const label of await figure('D35').locator('.typed-bars > div > span').all()) {
        const text=await label.innerText(); const id=text.slice(0,text.lastIndexOf(':'));
        assert.equal(await label.evaluate(el=>getComputedStyle(el).color),colors[ids.indexOf(row.identity_map?.[id]||id)]||'rgb(168, 170, 178)');
      }
    }
    report.checks.push('All 24 saved interventions preserve candidate identity colours in both displayed predictors');
    assert.deepEqual(report.errors,[]); report.status='passed';
  } catch(error) {report.status='failed';report.failure=error.stack;}
  finally {
    report.after=hashes(); report.sourceChanged=JSON.stringify(report.before)!==JSON.stringify(report.after);
    fs.writeFileSync(path.join(output,`closure-${stamp}.json`),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({status:report.status,stamp,captures:report.captures.length,failure:report.failure,sourceChanged:report.sourceChanged}));
    await browser.close(); if(report.status!=='passed'||report.sourceChanged)process.exitCode=1;
  }
})();
