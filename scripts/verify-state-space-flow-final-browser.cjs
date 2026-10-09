const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/deep-learning-beginner/state-space-models-s4-mamba-mamba-2';
const sourceNames = ['StateSpaceDrawings.jsx', 'StateSpaceStructureDrawings.jsx', 'StateSpaceArchitectureDrawings.jsx', 'StateSpaceBlockDrawings.jsx', 'StateSpaceLearningDrawings.jsx', 'StateSpaceExtensionDrawings.jsx', 'StateSpaceLinePlot.jsx', 'StateSpaceMemoryFigures.jsx', 'StateSpaceFlowLabs.jsx', 'StateSpaceTrajectoryFlow.jsx', 'StateSpaceLearningEvidence.jsx', 'StateSpaceLabs.jsx', 'state-space-flow.css'];
const files = [...sourceNames.map(name => `src/learn/components/lesson-labs/${name}`), 'src/learn/data/topics/state-space-models-s4-mamba-mamba-2.jsx', 'scratch/state-space-reading-flow/main.jsx', 'scratch/state-space-reading-flow/vite.config.mjs', __filename];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceHashes = Object.fromEntries(files.map(file => [file, hash(file)]));
const prior = `${folder}/reading-flow-browser.json`;
const priorReceipt = JSON.parse(fs.readFileSync(prior));
assert.equal(priorReceipt.status, 'passed');
const changed = Object.entries(priorReceipt.sourceHashes).filter(([file, digest]) => hash(file) !== digest).map(([file]) => file);
const allowed = new Set(['src/learn/components/lesson-labs/StateSpaceLinePlot.jsx', 'src/learn/components/lesson-labs/StateSpaceStructureDrawings.jsx', 'src/learn/components/lesson-labs/state-space-flow.css', 'src/learn/data/topics/state-space-models-s4-mamba-mamba-2.jsx']);
assert(changed.every(file => allowed.has(file)), `Unexpected changed interaction owner: ${changed}`);
const checks = [], screenshots = [], errors = [];
const checked = (name, detail) => checks.push({ name, detail });
const load = page => page.goto('http://127.0.0.1:4835/', { waitUntil: 'networkidle' });
const observe = page => page.on('pageerror', error => errors.push(error.message));
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage(); observe(page);
  let failure;
  try {
    await load(page);
    await page.getByText('The same three modes over 100 updates', { exact: true }).waitFor();
    checked('Current new direct-label curves are in the actual production preview');
    const slider = page.getByRole('slider', { name: /^Old fraction retained/ });
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox(), old = await slider.inputValue();
    await page.mouse.click(box.x + .22 * box.width, box.y + box.height / 2);
    assert.notEqual(await slider.inputValue(), old);
    checked('Native mouse changes the retained fraction', { old, current: await slider.inputValue() });
    for (const [width, scale] of [[1366, 1], [768, 1], [768, 2], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => document.documentElement.style.fontSize = `${16 * value}px`, scale);
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.documentElement.scrollWidth) <= width + 1);
      const figures = page.locator('.state-flow-drawing');
      const summaries = await figures.evaluateAll(elements => elements.map(figure => {
        const svg = figure.querySelector('svg'), view = svg.viewBox.baseVal;
        return [...svg.querySelectorAll('text')].filter(text => {
          const b = text.getBBox();
          return b.x < -1 || b.y < -1 || b.x + b.width > view.width + 1 || b.y + b.height > view.height + 1;
        }).map(text => text.textContent);
      }));
      assert.equal(summaries.flat().length, 0, JSON.stringify(summaries.flat()));
      const paths = page.locator('.ssm-three svg');
      const bounds = await paths.evaluateAll(elements => elements.map(svg => svg.getBoundingClientRect().toJSON()));
      assert.equal(bounds.length, 3);
      if (width <= 390 || scale === 2) assert(bounds.every((box, i) => i === 0 || box.y >= bounds[i - 1].bottom), 'Actual fitting paths stack');
      checked('Current curves, array glyph bounds and path stacking', { width, scale, figures: summaries.length });
      if ((width === 390 && scale === 1) || (width === 768 && scale === 2)) {
        const drawings = {
          'rates': page.locator('.state-line-plot').filter({ hasText: 'The same three modes over 100 updates' }),
          'polynomial': page.locator('.state-line-plot').filter({ hasText: 'Reconstruct the supplied history' }),
          'cache-area': page.locator('[data-figure="state-space-cache-size"]'),
          'endpoint-area': page.locator('[data-figure="state-space-endpoint-area"]'),
          'mamba-one-projections': page.locator('[data-figure="state-space-mamba-one-projections"]'),
          'mamba-two-projections': page.locator('[data-figure="state-space-mamba-two-projections"]'),
          'diagonal-powers': page.locator('[data-figure="state-space-diagonal-powers"]'),
        };
        for (const [name, figure] of Object.entries(drawings)) {
          const path = `${folder}/screenshots/reading-flow/final/${name}-${width}-${scale}.png`;
          fs.mkdirSync(`${folder}/screenshots/reading-flow/final`, { recursive: true });
          await figure.screenshot({ path });
          screenshots.push({ path, sha256: hash(path) });
        }
      }
    }
    await page.setViewportSize({ width: 1366, height: 1000 });
    await page.evaluate(() => document.documentElement.style.fontSize = '16px');
    const retry = await context.newPage(); observe(retry); let failed = false;
    await retry.route('**/state-space-operators.py', route => {
      if (!failed) { failed = true; return route.fulfill({ status: 503, body: 'temporary' }); }
      return route.continue();
    });
    await load(retry);
    const excerpt = retry.locator('[data-program-excerpt="held-discretization-excerpt.py"]');
    await excerpt.scrollIntoViewIfNeeded();
    const button = excerpt.getByRole('button', { name: 'Retry code excerpt', exact: true });
    await button.waitFor(); assert((await button.boundingBox()).height >= 44);
    await button.focus(); await retry.keyboard.press('Enter');
    await excerpt.locator('.lesson-code__copy').waitFor();
    checked('Forced excerpt503 error has themed44px keyboard retry and restored instructional code');
    await retry.close();
    // Reaching the final index materializes every viewport-owned source above it.
    for (const block of await page.locator('[data-program-excerpt],.lesson-code-source').all()) await block.scrollIntoViewIfNeeded();
    const downloads = page.locator('[data-code-downloads]');
    if (await downloads.count()) {
      await downloads.scrollIntoViewIfNeeded();
      assert(await downloads.locator('a').count() > 0);
      checked('Canonical file index contains visible downloads', { count: await downloads.locator('a').count() });
    }
    const mobile = await browser.newContext({ viewport: { width: 390, height: 1000 }, isMobile: true, hasTouch: true });
    const touch = await mobile.newPage(); observe(touch); await load(touch);
    const touchSlider = touch.getByRole('slider', { name: /^Old fraction retained/ });
    await touchSlider.scrollIntoViewIfNeeded(); const b = await touchSlider.boundingBox();
    const before = await touchSlider.inputValue();
    await touch.touchscreen.tap(b.x + .35 * b.width, b.y + b.height / 2);
    assert.notEqual(await touchSlider.inputValue(), before);
    checked('Native touchscreen changes retention slider', { before, current: await touchSlider.inputValue() });
    await mobile.close();
    assert.equal(errors.length, 0, JSON.stringify(errors));
    assert.deepEqual(Object.fromEntries(files.map(file => [file, hash(file)])), sourceHashes);
  } catch (error) { failure = error.stack; }
  finally { await browser.close(); }
  const receipt = { checkedAt: new Date().toISOString(), status: failure ? 'failed' : 'passed', scope: 'Final current-source static-curve/mobile/numeric-glyph and additional native-slider/excerpt-retry checks, isolated production preview. Prior74 interaction campaign reused only for unchanged interaction owners; no shared-site or GPU certification.', sourceHashes, reused: { path: prior, sha256: hash(prior), checks: priorReceipt.checks.length, changedPresentationSources: changed }, checks, screenshots, errors, failure };
  fs.writeFileSync(`${folder}/${process.argv.includes('--reviewed') ? 'reading-flow-reviewed-browser.json' : 'reading-flow-final-browser.json'}`, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ status: receipt.status, checks: checks.length, failure, errors }));
  if (failure) process.exitCode = 1;
})();
