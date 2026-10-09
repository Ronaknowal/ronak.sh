const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = 'docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const output = `${folder}/browser-evidence/review-closure-${Date.now()}`;
const sources = ['src/learn/components/lesson-labs/MoeTrainingFlow.jsx',
  'src/learn/components/lesson-labs/moe-training-flow.css', 'src/learn/data/moe-training-models.js',
  `${folder}/lesson.jsx`, `${folder}/lesson.md`, 'scripts/verify-moe-training-review-closure.cjs'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const hashes = () => Object.fromEntries(sources.map(file => [file, hash(file)]));
fs.mkdirSync(output, { recursive: true });
(async () => {
  const report = { before: hashes(), checks: [], captures: [], errors: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/moe-training-expert-load-balancing?module=large-language-models');
    const figure = id => page.locator(`[data-moe-figure="${id}"]`);
    await figure('M19').getByRole('button', { name: /All-local comparison/ }).waitFor();
    assert.match(await figure('M01').innerText(), /separate token positions/);
    assert.match(await figure('M01').innerText(), /coordinates within that position/);
    const networks = figure('M02').locator('svg.moet-network');
    for (const network of await networks.all()) {
      assert.match(await network.getAttribute('aria-label'), /2 shown input coordinates map to 6, then return to 2/);
      assert.equal(await network.locator('circle').count(), 10);
    }
    for (const network of await figure('M19').locator('svg.moet-network').all()) {
      assert.equal(await network.locator('path').count(), 2);
      for (const path of await network.locator('path').all()) {
        const coordinates = (await path.getAttribute('d')).match(/M12 ([\d.]+) L158 ([\d.]+)/);
        assert.equal(coordinates[1], coordinates[2]);
      }
    }
    report.checks.push('M01 token-position/coordinate separation; M02 exact two-coordinate drawing; M19 four scaled-identity maps draw only their two nonzero diagonals');
    const capture = async (name, element) => {
      await element.scrollIntoViewIfNeeded();
      const path = `${output}/${name}.png`;
      await element.screenshot({ path, style: '.site-header--learn,.site-skip {visibility:hidden!important;}' });
      report.captures.push({ path, sha256: hash(path) });
    };
    for (const [name, width, size] of [['desktop', 1366, 16], ['phone', 390, 16], ['enlarged', 768, 32]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, size);
      for (const id of ['M01', 'M02', 'M19']) await capture(`${name}-${id}`, figure(id));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const device = figure('M19');
      const placement = device.getByRole('button', { name: /E0 on rank/ });
      await placement.click();
      assert.equal(await placement.getAttribute('aria-pressed'), 'true');
      assert.match(await device.innerText(), /payload 64 bytes/);
      await device.getByRole('button', { name: /All-local comparison/ }).click();
      assert(await placement.isDisabled());
      assert.equal(await placement.getAttribute('aria-pressed'), 'false');
      assert.equal(await placement.innerText(), 'E0 on rank 0 (all local)');
      assert.match(await device.innerText(), /payload 0 bytes/);
      assert.match(await device.innerText(), /Rank row work \[8, 0\]/);
      await capture(`${name}-M19-all-local`, device);
      if (name !== 'desktop') {
        await capture(`${name}-M19-all-local-input`, device.locator('.moet-matrix-object').first());
        for (const index of [0, 1]) await capture(`${name}-M19-all-local-E${index}`, device.locator('.moet-expert').nth(index));
      }
      await device.getByRole('button', { name: /All-local comparison/ }).click();
      assert(await placement.isEnabled());
      assert.equal(await placement.getAttribute('aria-pressed'), 'true');
      assert.equal(await placement.innerText(), 'E0 on rank 1');
      assert.match(await device.innerText(), /payload 64 bytes/);
      await capture(`${name}-M19-restored`, device);
      if (name !== 'desktop') {
        await capture(`${name}-M19-restored-input`, device.locator('.moet-matrix-object').first());
        await capture(`${name}-M19-restored-E1`, device.locator('.moet-expert').first());
      }
      await device.getByRole('button', { name: 'Reset', exact: true }).click();
      report.checks.push(`${name}: move → effective all-local placement/disabled control → exact restored placement; no document overflow`);
    }
    assert.deepEqual(report.errors, []);
    report.after = hashes(); assert.deepEqual(report.before, report.after);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.failure = String(error.stack || error); process.exitCode = 1;
  } finally {
    report.at = new Date().toISOString();
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ output, status: report.status, checks: report.checks, failure: report.failure }));
    await browser.close();
  }
})();
