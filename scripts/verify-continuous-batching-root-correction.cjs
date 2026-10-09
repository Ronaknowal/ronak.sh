const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const output = path.resolve(topic, `browser-root-correction-${Date.now()}`);
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
      ['D05','default',async()=>{}],
      ['D05','two-queries-four-pages',async()=>{await slider('D05','Query-row budget',2);await slider('D05','Physical page capacity',4);}],
      ['D05','two-queries-five-pages',async()=>{await slider('D05','Query-row budget',2);await slider('D05','Physical page capacity',5);}],
      ['D20','default-four',async()=>{}],
      ['D20','six-chunks',async()=>select('D20','Chunk rows',2)],
      ['D20','one-chunk',async()=>select('D20','Chunk rows',12)],
      ['D20','reset',async()=>{await select('D20','Chunk rows',2);await reset('D20');}],
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
        if(id==='D05') {
          const text=await fig(id).innerText();assert.ok(text.includes('D has no resident cache yet'));
          if(name.startsWith('two-queries')){assert.ok(!text.includes('p4: D proposed'));assert.ok(text.includes(name.endsWith('four-pages')?'4 / 4':'4 / 5'));}
        } else {
          const k=Number(await fig(id).getByRole('combobox').inputValue());
          assert.equal(await fig(id).locator('svg text').filter({hasText:/^chunk /}).count(),12/k);
          const colors=await fig(id).locator('svg text').filter({hasText:/^chunk /}).evaluateAll(es=>es.map(e=>getComputedStyle(e).fill));
          assert.equal(new Set(colors).size,12/k);assert.ok((await fig(id).innerText()).includes('Total permitted pairs: 78'));
          report.checks.push({profile,id,name,chunk:k,colors});
        }
        await shot(`${profile}-${id}-${name}`,fig(id));
        if(profile!=='desktop')for(const [i,pane] of (await fig(id).locator('.cb-scroll').all()).entries()) {
          const extent=await pane.evaluate(e=>({max:e.scrollWidth-e.clientWidth,width:e.clientWidth}));
          for(let x=extent.width;x<extent.max+extent.width;x+=extent.width) {
            const pos=Math.min(x,extent.max);if(pos<=2)break;await pane.evaluate((e,v)=>e.scrollLeft=v,pos);
            await shot(`${profile}-${id}-${name}-pane${i}-x${pos}`,pane);
            report.checks.push({profile,id,name,pane:i,scroll:await pane.evaluate(e=>e.scrollLeft)});
          }
          await pane.evaluate(e=>e.scrollLeft=0);
        }
        await reset(id);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      report.checks.push(`${profile}: seven affected default/changed/reset objects; page overflow zero`);
    }
    assert.deepEqual(report.errors,[]);
    report.after=hashes();assert.deepEqual(report.after,report.before);
    report.status='passed; actual paint reading separate';
  } catch(e) { report.failure=e.stack;process.exitCode=1; }
  finally { await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,checks:report.checks.length,captures:report.captures.length,failure:report.failure})); }
})();
