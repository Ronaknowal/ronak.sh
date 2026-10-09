const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const folder = 'docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions';
const topic = 'src/learn/data/topics/depthwise-separable-dilated-convolutions.jsx';
const report = { passed: false, checkedAt: new Date().toISOString(), base: process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4811', checks: [], viewports: [], errors: [], sourceHashes: {} };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(report.base + '/learn/path/full-curriculum/depthwise-separable-dilated-convolutions?module=deep-learning-fundamentals');
    await page.locator('.lesson-flow').waitFor();
    const shuffle = page.getByText(/Reshape into four rows of two, transpose, and flatten/);
    await shuffle.scrollIntoViewIfNeeded();
    assert.match(await shuffle.innerText(), /0,2,4,6,1,3,5,7/);
    assert.match(await shuffle.innerText(), /with unchanged group assignments/);
    report.checks.push('Fresh revised ShuffleNet clarification rendered; stale-build rejection');
    assert.equal(await page.getByText(/the matrix 2-norm is its largest amplification of a unit-length vector/).count(), 1);
    report.checks.push('Only one norm definition rendered');
    const slider = page.locator('#depthwise-channels input[type=range]').first();
    await slider.scrollIntoViewIfNeeded();
    await slider.fill('4'); await slider.dispatchEvent('input');
    assert.match(await page.locator('#depthwise-channels .flow-readout').innerText(), /−4/);
    report.checks.push('Existing live channel calculation still responds');
    fs.mkdirSync(folder + '/screenshots/connectivity-review', { recursive: true });
    for (const [width, scale] of [[1366, 1], [768, 2], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(s => document.documentElement.style.fontSize = s === 2 ? '200%' : '', scale);
      await shuffle.scrollIntoViewIfNeeded();
      const geometry = await shuffle.evaluate(n => { const r = n.getBoundingClientRect(); return { width: r.width, scroll: n.scrollWidth, pageWidth: innerWidth, pageScroll: document.documentElement.scrollWidth }; });
      assert.ok(geometry.scroll <= geometry.width + 2);
      assert.ok(geometry.pageScroll <= geometry.pageWidth + 2);
      report.viewports.push({ width, scale, ...geometry });
      await shuffle.screenshot({ path: `${folder}/screenshots/connectivity-review/shuffle-${width}-${scale}.png`, style: 'header {visibility:hidden !important}' });
    }
    assert.deepEqual(report.errors, []);
    report.browser = browser.version(); report.passed = true;
    for (const file of [topic, 'scripts/verify-depthwise-connectivity-review.mjs', 'scripts/verify-depthwise-connectivity-browser.cjs']) report.sourceHashes[file] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  } finally { await browser.close(); }
})().catch(error => { report.failure = error.stack; process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(folder + '/connectivity-review-browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, viewports: report.viewports.length, failure: report.failure }));
});
