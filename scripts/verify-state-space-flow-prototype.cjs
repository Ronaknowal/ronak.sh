const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/deep-learning-beginner/state-space-models-s4-mamba-mamba-2';
const sources = ['src/learn/components/lesson-labs/StateSpaceDrawings.jsx', 'src/learn/components/lesson-labs/state-space-flow.css', 'scratch/state-space-reading-flow/main.jsx'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bound = () => Object.fromEntries(sources.map(file => [file, hash(file)]));

(async () => {
  const sourceHashes = bound(), screenshots = [], layouts = [], errors = [];
  fs.mkdirSync(`${folder}/screenshots/reading-flow/prototype`, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let failure;
  try {
    await page.goto('http://127.0.0.1:4835/');
    assert((await page.locator('h1').innerText()).includes('anatomical prototype'));
    const control = page.getByRole('slider', { name: 'Retention', exact: false });
    await control.focus(); await control.press('Home');
    assert((await page.locator('#state-retention .flow-readout').innerText()).includes('is 0;'));
    await control.press('End');
    assert((await page.locator('#state-retention .flow-readout').innerText()).includes('is 1;'));
    for (const [width, scale] of [[390, 1], [768, 2]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = `${16 * value}px`; }, scale);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const figures = [...document.querySelectorAll('.state-flow-drawing')];
        return {
          scrollWidth: document.documentElement.scrollWidth,
          outOfBounds: figures.flatMap(figure => {
            const svg = figure.querySelector('svg'), view = svg.viewBox.baseVal;
            return [...svg.querySelectorAll('text')].filter(text => {
              const box = text.getBBox();
              return box.x < -1 || box.y < -1 || box.x + box.width > view.width + 1 || box.y + box.height > view.height + 1;
            }).map(text => ({ figure: figure.dataset.figure, text: text.textContent }));
          }),
          overlaps: figures.flatMap(figure => {
            const labels = [...figure.querySelectorAll('text')].map(text => ({ text: text.textContent, box: text.getBBox() }));
            return labels.flatMap((a, i) => labels.slice(i + 1).filter(b => Math.min(a.box.x + a.box.width, b.box.x + b.box.width) - Math.max(a.box.x, b.box.x) > 1 && Math.min(a.box.y + a.box.height, b.box.y + b.box.height) - Math.max(a.box.y, b.box.y) > 1).map(b => ({ figure: figure.dataset.figure, labels: [a.text, b.text] })));
          }),
        };
      });
      layouts.push({ width, scale, ...layout });
      for (const name of ['retention', 'four-jobs', 'vector-anatomy', 'matrix-write']) {
        const path = `${folder}/screenshots/reading-flow/prototype/${name}-${width}-${scale}.png`;
        await page.locator(`[data-figure="state-space-${name}"]`).screenshot({ path });
        screenshots.push({ name, width, scale, path, sha256: hash(path) });
      }
      assert(layout.scrollWidth <= width + 1, 'No document overflow');
      assert.equal(layout.outOfBounds.length, 0, JSON.stringify(layout.outOfBounds));
      assert.equal(layout.overlaps.length, 0, JSON.stringify(layout.overlaps));
    }
    assert.equal(errors.length, 0, JSON.stringify(errors));
    assert.deepEqual(bound(), sourceHashes, 'Sources remain unchanged through checks');
  } catch (error) { failure = error.stack; }
  finally {
    await browser.close();
    fs.writeFileSync(`${folder}/reading-flow-prototype.json`, JSON.stringify({ checkedAt: new Date().toISOString(), passed: !failure, scope: 'Isolated foundational prototype only; not full lesson implementation', sourceHashes, layouts, screenshots, errors, failure }, null, 2));
    console.log(JSON.stringify({ passed: !failure, layouts, screenshotCount: screenshots.length, failure }));
    if (failure) process.exitCode = 1;
  }
})();
