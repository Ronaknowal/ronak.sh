const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const sourceReceipt = JSON.parse(fs.readFileSync(folder + '/reading-flow-browser-final-dynamic-axis-labels.json'));
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
for (const [path, hash] of Object.entries(sourceReceipt.sourceHashes)) assert.equal(digest(path), hash);
const names = ['regression-design-product', 'regression-one-design-row',
  'regression-normal-balance', 'regression-held-out-circuit',
  'regression-curvature-work', 'regression-parameter-contours'];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 768, height: 2600 } });
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  await page.locator('[data-figure="regression-quasi-separation"]').waitFor({ timeout: 120000 });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  const pictures = [];
  const checks = [];
  for (const name of names) {
    const figure = page.locator('[data-figure="' + name + '"]');
    const surface = figure.locator('[role="region"]').first();
    await figure.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 90));
    await surface.focus();
    const before = await surface.evaluate(element => ({ left: element.scrollLeft,
      width: element.clientWidth, fullWidth: element.scrollWidth }));
    assert(before.fullWidth > before.width + 1, name + ': enlarged drawing must pan');
    for (let step = 0; step < 16; step++) await surface.press('ArrowRight');
    const after = await surface.evaluate(element => element.scrollLeft);
    assert(after > before.left, name + ': native horizontal keyboard movement');
    assert(await figure.getByText(/Scroll sideways/).isVisible());
    const path = folder + '/screenshots/final-dynamic-axis-labels/' + name + '-768-text2-right.png';
    await figure.screenshot({ path });
    pictures.push({ path, sha256: digest(path), name, width: 768, scale: 2, side: 'right' });
    checks.push({ name, before, after, nativeKeyboardPan: true });
  }
  for (const [path, hash] of Object.entries(sourceReceipt.sourceHashes)) assert.equal(digest(path), hash);
  const receipt = { at: new Date().toISOString(),
    scope: 'Author current enlarged-text native horizontal panning and right-side paint exports; personal and independent picture review remain separately attributed',
    sourceHashes: sourceReceipt.sourceHashes, checks, pictures };
  fs.writeFileSync(folder + '/reading-flow-pan-final-dynamic-axis-labels.json', JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ checks: checks.length, pictures: pictures.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
