const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
const correction = `${folder}/range-default-correction`;
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const packet = JSON.parse(fs.readFileSync(`${correction}/inputs.json`));
for (const row of packet.files) assert.equal(hash(row.path), row.sha256, row.path);
const old = JSON.parse(fs.readFileSync(`${folder}/runtime-inputs.json`));
const changes = [
  ['KvCacheFoundations.jsx', 'step={.05}', 'step="any"'],
  ['KvCacheStorage.jsx', 'step={.01}', 'step="any"'],
];
for (const [name, from, to] of changes) {
  const before = fs.readFileSync(`${correction}/${name}.before`, 'utf8').replaceAll('\r\n', '\n');
  const after = fs.readFileSync(`src/learn/components/lesson-labs/${name}`, 'utf8').replaceAll('\r\n', '\n');
  assert.equal(after, before.replace(from, to), name);
}
for (const row of old.files) {
  const changed = changes.find(([name]) => row.path === `src/learn/components/lesson-labs/${name}`);
  assert.equal(hash(changed ? `${correction}/${changed[0]}.before` : row.path), row.sha256, row.path);
}
const report = { packet: hash(`${correction}/inputs.json`), guardedCurrent: packet.files.length, recoveredOriginal: old.files.length, exactNormalizedChanges: changes, checks: [], errors: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({viewport:{width:390,height:900}});
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models');
    await page.locator('[data-kv-figure="D26"]').waitFor({ timeout:60000 });
    for (const [id, initial] of [['D04',Math.SQRT2*Math.log(2)], ['D22',7/15]]) {
      const figure = page.locator(`[data-kv-figure="${id}"]`);
      const control = figure.getByRole('slider').first();
      for (const action of ['Reset','ArrowLeft','Home','End','Reset']) {
        if (action === 'Reset') await figure.getByRole('button', {name:'Reset',exact:true}).click();
        else { await control.focus(); await page.keyboard.press(action); }
        const state = await control.evaluate(element => ({ value:element.valueAsNumber, authored:Number(element.getAttribute('value')), min:Number(element.min), max:Number(element.max), step:element.step, valid:element.checkValidity(), label:element.closest('label').innerText }));
        assert.equal(state.step,'any');
        assert.ok(Math.abs(state.value-state.authored)<1e-15);
        assert.ok(state.valid);
        if (action==='Reset') assert.equal(state.authored,initial);
        if (action==='Home') assert.equal(state.value,state.min);
        if (action==='End') assert.equal(state.value,state.max);
        if (action==='ArrowLeft') assert.ok(state.value<initial);
        report.checks.push({id,action,...state});
      }
    }
    assert.deepEqual(report.errors,[]);
    for(const row of packet.files) assert.equal(hash(row.path),row.sha256,row.path);
    report.passed=true;
  } catch(error) { report.failure=error.stack; process.exitCode=1; }
  finally { await browser.close(); fs.writeFileSync(`${folder}/runtime-review-alignment/range-closure-checks.json`,JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,guards:report.guardedCurrent,failure:report.failure})); }
})();
