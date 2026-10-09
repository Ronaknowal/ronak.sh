const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = 'docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const output = `${folder}/browser-evidence/closure`;
const sources = [
  `${folder}/lesson.jsx`, 'src/learn/components/lesson-labs/MoeTrainingFlow.jsx',
  'src/learn/components/lesson-labs/moe-training-flow.css', 'src/learn/data/moe-training-models.js',
  'scripts/verify-moe-training-runtime-closure.cjs',
];
const hashes = () => Object.fromEntries(sources.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync(output, { recursive: true });

(async () => {
  const before = hashes(), checks = [], errors = [];
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { before, checks, errors };
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const base = 'http://127.0.0.1:4250';
    await page.request.get(`${base}/__llm_refresh`);
    await page.goto(`${base}/learn/path/full-curriculum/moe-training-expert-load-balancing?module=large-language-models`);
    const item = id => page.locator(`[data-moe-figure="${id}"]`);
    await item('M15').getByRole('slider').waitFor();
    const screenshot = async (name, element) => {
      await element.scrollIntoViewIfNeeded();
      await element.screenshot({ path: `${output}/${name}.png`, style: '.site-header--learn,.site-skip {visibility:hidden!important;}' });
    };
    await item('M15').getByRole('combobox').selectOption('2');
    assert.match(await item('M15').innerText(), /unused.*null intervention/);
    await item('M15').getByRole('combobox').selectOption('0');
    assert.doesNotMatch(await item('M15').innerText(), /change 0 nats/);
    await screenshot('selected-expert-ablation', item('M15'));
    for (const index of [0, 1948, 487, 100]) await item('M15').getByRole('slider').fill(String(index));
    assert.match(await item('M15').innerText(), /byte position 17; target s · 115/);
    await item('M15').getByRole('button', { name: 'Reset', exact: true }).click();
    checks.push('Saved-model unused null, selected ablation, four rapid context edits and exact final row');
    await item('M19').getByRole('button', { name: /E0 on rank/ }).click();
    assert.match(await item('M19').innerText(), /payload 64 bytes/);
    assert.match(await item('M19').innerText(), /1\.25/);
    await screenshot('moved-expert-addressed-results', item('M19'));
    await item('M19').getByRole('button', { name: /All-local comparison/ }).click();
    assert.match(await item('M19').innerText(), /Rank row work \[8, 0\]/);
    assert.match(await item('M19').innerText(), /payload 0 bytes/);
    await screenshot('all-local-addressed-results', item('M19'));
    await item('M19').getByRole('button', { name: 'Reset', exact: true }).click();
    checks.push('Native placement preserves output, moved traffic 64 bytes, all-local rank0 owns all eight requests');
    await item('M14').getByRole('combobox').selectOption('3');
    await item('M14').getByRole('slider').fill('2');
    await page.setViewportSize({ width: 390, height: 1000 });
    await screenshot('phone-refined-parent-colours', item('M14'));
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await screenshot('zoom-refined-parent-colours', item('M14'));
    const scroll = item('M07').locator('.moet-table-object .moet-scroll');
    await scroll.scrollIntoViewIfNeeded(); await scroll.focus();
    const initial = await scroll.evaluate(element => element.scrollLeft);
    for (let index = 0; index < 12; index++) await scroll.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('[data-moe-figure="M07"] .moet-table-object .moet-scroll').scrollLeft > 0);
    assert((await scroll.evaluate(element => element.scrollLeft)) > initial);
    assert(await item('M07').locator('.moet-table-object .moet-scroll-cue').isVisible());
    await screenshot('zoom-table-panned', item('M07'));
    checks.push('Enlarged table native keyboard pan with fixed caption and overflow-only cue; refined parent-colour drawing');
    const firstCode = page.locator('.lesson-code-source').first();
    await firstCode.scrollIntoViewIfNeeded(); await firstCode.locator('pre').waitFor();
    await screenshot('zoom-program-toolbar', firstCode.locator('.lesson-code__toolbar'));
    const hints = page.locator('[data-lesson-exercise]').first();
    await hints.getByText('Hint', { exact: true }).click();
    await hints.getByText('Worked solution', { exact: true }).click();
    await screenshot('zoom-open-practice', hints);
    checks.push('Enlarged program toolbar and actual open hint/full solution');
    let fail = true;
    await page.route('**/learn-assets/moe-training/model.json', request => fail ? request.abort() : request.continue());
    await page.reload();
    await item('M15').getByRole('button', { name: 'Retry saved model', exact: true }).waitFor();
    fail = false;
    await item('M15').getByRole('button', { name: 'Retry saved model', exact: true }).click();
    await item('M15').getByRole('slider').waitFor();
    checks.push('Actual saved-model fetch failure and retry restores measured inference');
    assert.deepEqual(errors, []);
    report.after = hashes(); assert.deepEqual(report.after, before);
    report.status = 'passed';
    console.log(JSON.stringify({ checks, errors }));
  } catch (error) {
    report.status = 'failed'; report.failure = String(error.stack || error); throw error;
  } finally {
    report.at = new Date().toISOString();
    fs.writeFileSync(`${output}/report-${Date.now()}.json`, JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
