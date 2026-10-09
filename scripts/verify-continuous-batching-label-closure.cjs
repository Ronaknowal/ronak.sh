const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const output = path.resolve(topic, `browser-label-closure-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const files = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/continuous-batching-models.js',
  ...['Shared', 'Structures', 'Foundations', 'Storage', 'Serving'].map(s => `src/learn/components/lesson-labs/ContinuousBatching${s}.jsx`),
  'src/learn/components/lesson-labs/continuous-batching-flow.css'];
const hashes = () => Object.fromEntries(files.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report = { before: hashes(), checks: [], captures: [], errors: [], deferred: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    await page.request.get('http://127.0.0.1:4261/__llm_refresh');
    await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models');
    const fig = id => page.locator(`[data-cb-figure="${id}"]`);
    await fig('D30').waitFor();
    await fig('D25').getByRole('combobox').first().waitFor();
    await page.addStyleTag({ content: '*{scroll-behavior:auto!important;overflow-anchor:none!important}' });
    const reset = async id => fig(id).getByRole('button', { name: 'Reset', exact: true }).click();
    const slider = (id, name, value) => fig(id).getByRole('slider', { name: new RegExp(name) }).fill(String(value));
    const select = (id, name, value) => fig(id).getByRole('combobox', { name, exact: true }).selectOption({ value: String(value) });
    const check = (id, name, value) => fig(id).getByRole('checkbox', { name, exact: true }).setChecked(value);
    const body = id => fig(id).evaluate(e => {
      const clone = e.cloneNode(true);
      clone.querySelectorAll('.cb-controls,.cb-scroll-hint').forEach(n => n.remove());
      return clone.innerHTML;
    });
    const cases = [
      ['D30','default',async()=>{}],
      ['D26','selected-64',async()=>select('D26','Recorded request','alice-64')],
      ['D30','extra-page',async()=>slider('D30','Additional pages',1)],
      ['D30','nonbinding',async()=>slider('D30','Additional nonbinding request slots',2)],
    ];
    async function shot(name, locator) {
      const file = path.join(output, `${name}.png`);
      const r = await capture(page, locator, file);
      report.captures.push({ name, file, tiles: r.tiles.map(t => t.path) });
    }
    for (const [width, font, profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]) {
      await page.setViewportSize({ width, height:1000 });
      await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);
      for (const [id,name,action] of cases) {
        await reset(id); await action();
        if(id==='D26') assert.ok((await fig(id).locator('svg').textContent()).includes('alice-64'));
        if(id==='D30') assert.ok((await fig(id).innerText()).includes('C next input:'));
        report.checks.push({profile,id,name,currentIdentity:true});
        await shot(`${profile}-${id}-${name}`,fig(id)); await reset(id);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      report.checks.push(`${profile}: four corrected-state captures; page overflow zero`);
    }
    for(const [width,font,profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]) {
      await page.setViewportSize({width,height:1000}); await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);
      for(const index of [8,9]) {
        const block=page.locator('.lesson-code-source').nth(index);
        for(const d of await block.locator('xpath=ancestor::details').all()) if(!(await d.evaluate(e=>e.open))) await d.locator(':scope > summary').click();
        await block.scrollIntoViewIfNeeded(); await block.locator('pre code').waitFor();
        const pre=block.locator('pre');
        await pre.evaluate(e=>{e.scrollTop=0;e.scrollLeft=0});await shot(`${profile}-program${index}-start`,block);
        await pre.evaluate(e=>{e.scrollTop=e.scrollHeight;e.scrollLeft=e.scrollWidth});await shot(`${profile}-program${index}-end-right`,block);
        report.checks.push({profile,program:index,scroll:await pre.evaluate(e=>({top:e.scrollTop,left:e.scrollLeft,width:e.clientWidth,height:e.clientHeight}))});
      }
    }
    assert.deepEqual(report.errors,[]);
    report.after=hashes();assert.deepEqual(report.after,report.before);
    report.status='passed; actual paint reading separate';
  } catch(e) { report.failure=e.stack;process.exitCode=1; }
  finally { await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,checks:report.checks.length,captures:report.captures.length,failure:report.failure})); }
})();
