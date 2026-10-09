const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 3000 } });
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  await page.locator('[data-figure="regression-binary-shared-error"]').waitFor({ timeout: 120000 });
  const targets = ['regression-centered-reductions', 'regression-linear-shared-errors',
    'regression-linear-gradient-reductions', 'regression-same-state-update',
    'regression-binary-shared-error', 'regression-binary-gradient-branches',
    'regression-logistic-gradient'];
  const output = folder + '/screenshots/bounded-review-corrections-settled';
  fs.mkdirSync(output, { recursive: true });
  const views = [];
  for (const [width, scale] of [[390, 1], [768, 2]]) {
    await page.setViewportSize({ width, height: 3000 });
    await page.evaluate(value => { document.documentElement.style.fontSize = 16 * value + 'px'; }, scale);
    await page.evaluate(() => document.fonts.ready);
    for (const name of targets) {
      const figure = page.locator('[data-figure="' + name + '"]');
      const surface = figure.locator('.regression-flow-surface');
      if (!await surface.evaluate(element => element.scrollWidth > element.clientWidth + 1)) continue;
      await figure.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' }));
      await surface.evaluate(element => element.scrollTo({ left: (element.scrollWidth - element.clientWidth) / 2, behavior: 'instant' }));
      await page.waitForTimeout(150);
      const geometry = await surface.evaluate(element => ({ current: element.scrollLeft,
        desired: (element.scrollWidth - element.clientWidth) / 2, viewport: element.clientWidth,
        content: element.scrollWidth }));
      assert(Math.abs(geometry.current - geometry.desired) <= 1);
      const picture = output + '/' + name + '-' + width + '-text' + scale + '-center.png';
      await figure.screenshot({ path: picture });
      const current = await surface.evaluate(element => element.scrollLeft);
      assert(Math.abs(current - geometry.desired) <= 1, 'screenshot must retain the actual middle pan');
      views.push({ name, width, scale, ...geometry, picture, pictureHash: hash(picture) });
    }
  }
  const receipt = { at: new Date().toISOString(), scope: 'Author current settled central-pan crops. These supplement the left/right/changed-state campaign; named center crops in that campaign can still show pending native keyboard movement and are not its center-position authority.',
    sourceHashes: Object.fromEntries(['src/learn/data/topics/linear-logistic-regression.jsx',
      'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
      'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx'].map(path => [path, hash(path)])), views };
  const receiptPath = folder + '/reading-flow-review-corrections-settled-pans.json';
  assert(!fs.existsSync(receiptPath));
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ centralPanViews: views.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
