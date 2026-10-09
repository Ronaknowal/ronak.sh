const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const output = path.resolve(topic, `browser-controls-${Date.now()}`);
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
    for (let n = process.argv.includes('--continue') ? 22 : 1; n <= 30; n++) {
      const id = `D${String(n).padStart(2, '0')}`;
      const controls = fig(id).locator('.cb-controls input,.cb-controls select,.cb-controls button');
      for (let i = 0; i < await controls.count(); i++) {
        await reset(id);
        const control = controls.nth(i);
        const info = await control.evaluate(e => ({ tag: e.tagName, type: e.type, disabled: e.disabled, name: e.closest('label')?.innerText || e.textContent, value: e.value }));
        if (info.name === 'Reset' || info.disabled) continue;
        // These policy choices become observable only at the appropriate future boundary.
        if (id === 'D02' && info.name === 'Cancel B at the observed boundary') await slider(id, 'Boundary operation', 5);
        if (id === 'D13' && info.name === 'Release child B first') await slider(id, 'Release / reuse stage', 1);
        const before = await body(id);
        if (info.tag === 'SELECT') {
          const value = await control.locator('option').last().getAttribute('value');
          await control.selectOption({ value });
        } else if (info.type === 'range') {
          const [min, max] = await Promise.all([control.getAttribute('min'), control.getAttribute('max')]);
          await control.fill(info.value === max ? min : max);
        } else if (info.type === 'checkbox') await control.setChecked(!(await control.isChecked()));
        else await control.click();
        const after = await body(id);
        const expectedNull = id === 'D22' && info.name.startsWith('Maximum prefill chunk');
        if (expectedNull) {
          assert.equal(after, before, 'D22 default two decode rows cap both requested chunk4 and64 at four prefill rows');
          report.checks.push({id, control: info.name, expectedNull: 'Six total query rows minus two decode rows caps both chunk4 and64 at four; figure caption explicitly explains the nonbinding request.'});
        } else {
          assert.notEqual(after, before, `${id} ${info.name} must alter an explained object or result`);
          report.checks.push({ id, control: info.name, nativeOutputChanged: true });
        }
        await reset(id);
      }
    }
    const cases = [
      ['D01','stopped',async()=>fig('D01').getByRole('button',{name:'Stop at output cap',exact:true}).click()],
      ['D02','cancel-before',async()=>{await check('D02','B arrives during the forward',false);await check('D02','Cancel B at the observed boundary',true);await select('D02','Observe B cancellation',0);}],
      ['D03','equal',async()=>select('D03','Workload','equal')],
      ['D08','invalid',async()=>check('D08','All keys invalid',true)],
      ['D10','relocated',async()=>check('D10','Relocate final page 6 → 2, including its values',true)],
      ['D12','commit',async()=>{for(let n=0;n<2;n++)await fig('D12').getByRole('button',{name:'Next transaction stage',exact:true}).click();}],
      ['D15','aligned-append',async()=>{await check('D15','Aligned parent and child length 6',true);await fig('D15').getByRole('button',{name:'Append key 99 to B',exact:true}).click();}],
      ['D15','refused',async()=>{await check('D15','Only two physical pages',true);await fig('D15').getByRole('button',{name:'Append key 99 to B',exact:true}).click();}],
      ['D17','offset',async()=>select('D17','Common score offset',1000)],
      ['D19','late-preemption',async()=>slider('D19','Iteration index',7)],
      ['D23','selected-64',async()=>select('D23','Inspect request ID','alice-64')],
      ['D26','selected-64',async()=>select('D26','Recorded request','alice-64')],
      ...['swap','atomic','mask','softmax'].map(mode=>['D29',mode,async()=>select('D29','Mechanism state',mode)]),
      ['D30','extra-page',async()=>slider('D30','Additional pages',1)],
      ['D30','nonbinding',async()=>slider('D30','Additional nonbinding request slots',2)],
      ['D30','arrived',async()=>{await select('D30','Scenario','arrival');await check('D30',"Advance to A's arrival",true);}],
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
        await reset(id); await action(); await shot(`${profile}-${id}-${name}`,fig(id)); await reset(id);
      }
      for (let n=1;n<=30;n++) {
        const id=`D${String(n).padStart(2,'0')}`;
        const controls=fig(id).locator('.cb-controls');
        await shot(`${profile}-${id}-controls`,controls);
        assert.equal(await controls.evaluate(e=>[...e.querySelectorAll('*')].some(n=>{const r=n.getBoundingClientRect();return r.width && (r.left < -2 || r.right > innerWidth+2)})),false,`${id} ${profile} control containment`);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      report.checks.push(`${profile}: all native control strips contained, page overflow zero`);
    }
    assert.deepEqual(report.errors,[]);
    report.after=hashes();assert.deepEqual(report.after,report.before);
    report.status='passed; actual paint reading separate';
  } catch(e) { report.failure=e.stack;process.exitCode=1; }
  finally { await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,checks:report.checks.length,captures:report.captures.length,failure:report.failure})); }
})();
