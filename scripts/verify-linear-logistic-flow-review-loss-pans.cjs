const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 768, height: 3000 } });
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  const lab = page.locator('#regression-separation');
  await lab.waitFor({ timeout: 120000 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.evaluate(() => document.fonts.ready);
  const penalty = lab.locator('select');
  const weight = lab.locator('input[type="range"]');
  await penalty.focus();
  await page.keyboard.press('End');
  await weight.focus();
  await page.keyboard.press('End');
  assert.equal(await weight.inputValue(), '12');
  assert.equal(await penalty.inputValue(), '0.2');
  const output = folder + '/screenshots/bounded-review-corrections-loss-right';
  fs.mkdirSync(output, { recursive: true });
  const views = [];
  for (const name of ['regression-separation-close', 'regression-separation-full']) {
    const figure = page.locator('[data-figure="' + name + '"]');
    const surface = figure.locator('.regression-flow-plot-surface');
    await figure.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' }));
    await surface.evaluate(element => element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const geometry = await surface.evaluate(element => ({ current: element.scrollLeft, desired: element.scrollWidth - element.clientWidth }));
    assert(Math.abs(geometry.current - geometry.desired) <= 1);
    const picture = output + '/' + name + '-768-text2-penalty02-weight12-right.png';
    await figure.screenshot({ path: picture });
    views.push({ name, width: 768, scale: 2, weight: 12, penalty: 0.2, ...geometry, picture, pictureHash: hash(picture) });
  }
  const receiptPath = folder + '/reading-flow-review-corrections-loss-right.json';
  assert(!fs.existsSync(receiptPath));
  fs.writeFileSync(receiptPath, JSON.stringify({ at: new Date().toISOString(), scope: 'Targeted actual rightmost enlarged-text loss views at the maximum exposed weight, complementing the default and changed-state campaign.',
    sourceHashes: Object.fromEntries(['src/learn/data/topics/linear-logistic-regression.jsx', 'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx', 'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx'].map(path => [path, hash(path)])), views }, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ rightViews: views.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
