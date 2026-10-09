const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const url = 'http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml';
const paths = [
  'src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/data/linear-logistic-flow-models.js',
  'src/learn/components/lesson-labs/LinearLogisticDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/RegressionInferenceDrawings.jsx',
  'src/learn/components/lesson-labs/linear-logistic-flow.css',
  'public/learn-code/linear-logistic-regression/weighted-least-squares.py',
];
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const identity = Object.fromEntries(paths.map(path => [path, digest(path)]));
const checks = [], pictures = [];
function pass(name, evidence = {}) { checks.push({ name, ...evidence }); }

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 1000 }, hasTouch: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(url);
  await page.locator('[data-figure="regression-quasi-separation"]').waitFor({ timeout: 120000 });
  assert((await page.locator('.linear-logistic-lesson').textContent()).includes('quasi-complete separation'));
  const labs = page.locator('.linear-logistic-lesson .flow-lab');
  assert.equal(await labs.count(), 10);
  for (let index = 0; index < await labs.count(); index++) {
    const lab = labs.nth(index);
    const id = await lab.getAttribute('id');
    const inputs = lab.locator('.flow-controls input');
    const selects = lab.locator('.flow-controls select');
    const count = await inputs.count() + await selects.count();
    assert(count >= 1 && count <= 3, id + ': meaningful control count');
    const baseline = await lab.locator('.flow-readout').textContent();
    for (let n = 0; n < await inputs.count(); n++) {
      const slider = inputs.nth(n);
      await slider.scrollIntoViewIfNeeded();
      await slider.focus();
      await slider.press('Home');
      assert.equal(await slider.inputValue(), await slider.getAttribute('min'));
      await slider.press('End');
      assert.equal(await slider.inputValue(), await slider.getAttribute('max'));
      assert(!/NaN|Infinity/.test(await lab.locator('.flow-readout').textContent()), id);
    }
    for (let n = 0; n < await selects.count(); n++) {
      const select = selects.nth(n);
      const options = await select.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
      assert(await select.getAttribute('aria-label'));
      for (const value of options) {
        await select.selectOption(value);
        assert(!/NaN|Infinity/.test(await lab.locator('.flow-readout').textContent()), id);
      }
    }
    await lab.getByRole('button', { name: "Reset to this example's starting values" }).click();
    assert.equal(await lab.locator('.flow-readout').textContent(), baseline, id + ': exact reset');
    pass(id + ': keyboard extrema, all select cases, exact reset', { meaningfulControls: count });
  }
  const residual = page.locator('#regression-residuals');
  await residual.locator('input').nth(0).focus();
  await residual.locator('input').nth(0).press('End');
  await residual.locator('input').nth(1).focus();
  await residual.locator('input').nth(1).press('End');
  assert((await residual.locator('.flow-readout').textContent()).includes('44.75'));
  await residual.getByRole('button', { name: /Reset/ }).click();
  pass('Two simultaneous residual parameter edits reproduce exact MSE 44.75');

  const gradient = page.locator('#regression-gradient');
  await gradient.locator('select').selectOption('0.3');
  await gradient.locator('input').focus();
  await gradient.locator('input').press('End');
  await gradient.locator('[data-figure="regression-full-gradient-path"]').waitFor();
  const fullPath = await gradient.locator('.flow-readout').textContent();
  assert(fullPath.includes('−417.966') && fullPath.includes('−893.353'), fullPath);
  await gradient.getByRole('button', { name: /Reset/ }).click();
  assert.equal(await gradient.locator('[data-figure="regression-full-gradient-path"]').count(), 0);
  pass('Divergent path is exposed in an honest full overview; reset removes the conditional view');

  const threshold = page.locator('#regression-threshold');
  await threshold.locator('input').focus();
  await threshold.locator('input').press('End');
  assert((await threshold.locator('.flow-readout').textContent()).includes('Precision is undefined'));
  await threshold.getByRole('button', { name: /Reset/ }).click();
  pass('No-warning precision remains undefined instead of a numerical zero');

  const interactive = page.locator('#regression-logistic-score input').nth(2);
  await interactive.scrollIntoViewIfNeeded();
  const before = await interactive.inputValue();
  const box = await interactive.boundingBox();
  await page.mouse.click(box.x + box.width * .22, box.y + box.height / 2);
  assert.notEqual(await interactive.inputValue(), before);
  const afterMouse = await interactive.inputValue();
  await page.touchscreen.tap(box.x + box.width * .77, box.y + box.height / 2);
  assert.notEqual(await interactive.inputValue(), afterMouse);
  pass('Native mouse and touch change the taught feature and live result');
  await page.locator('#regression-logistic-score').getByRole('button', { name: /Reset/ }).click();

  const code = page.locator('.lesson-code').filter({ has: page.getByRole('button', { name: 'Copy weighted-least-squares.py', exact: true }) });
  await page.locator('.lesson-code-source').filter({ has: page.getByText('weighted-least-squares.py', { exact: true }) }).first().scrollIntoViewIfNeeded();
  await code.getByRole('button', { name: 'Copy weighted-least-squares.py', exact: true }).waitFor();
  await code.getByRole('button', { name: 'Copy weighted-least-squares.py', exact: true }).click();
  assert.equal(await code.locator('[role="status"]').textContent(), 'Copied');
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('def weighted_least_squares'));
  const downloading = page.waitForEvent('download');
  await code.getByRole('link', { name: 'Download weighted-least-squares.py', exact: true }).click();
  const download = await downloading;
  assert.equal(download.suggestedFilename(), 'weighted-least-squares.py');
  pass('Complete source Copy feedback, actual clipboard and named programme download');

  const failed = await context.newPage();
  let requests = 0;
  await failed.route('**/learn-code/linear-logistic-regression/weighted-least-squares.py', route => {
    requests++;
    if (requests === 1) return route.fulfill({ status: 503, body: 'temporary unavailable' });
    return route.continue();
  });
  await failed.goto(url);
  await failed.locator('#regression-residuals input').first().focus();
  await failed.locator('#regression-residuals input').first().press('End');
  const retained = await failed.locator('#regression-residuals .flow-readout').textContent();
  const source = failed.locator('.lesson-code-source').filter({ has: failed.getByText('weighted-least-squares.py', { exact: true }) }).first();
  await source.scrollIntoViewIfNeeded();
  await source.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  await source.getByRole('button', { name: 'Retry', exact: true }).focus();
  await source.getByRole('button', { name: 'Retry', exact: true }).press('Enter');
  await failed.getByRole('button', { name: 'Copy weighted-least-squares.py', exact: true }).waitFor();
  assert.equal(await failed.locator('#regression-residuals .flow-readout').textContent(), retained);
  assert.equal(requests, 2);
  pass('503 source error and keyboard retry recover without resetting the learner case');
  await failed.close();

  const stamp = process.argv[2] || new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(folder + '/screenshots/' + stamp, { recursive: true });
  const names = await page.locator('.linear-logistic-lesson .regression-flow-drawing').evaluateAll(nodes => nodes.map(node => node.dataset.figure));
  for (const [width, scale] of [[390, 1], [768, 2]]) {
    await page.setViewportSize({ width, height: 2600 });
    await page.evaluate(value => document.documentElement.style.fontSize = 16 * value + 'px', scale);
    await page.evaluate(() => document.fonts.ready);
    for (const name of names) {
      const figure = page.locator('[data-figure="' + name + '"]').first();
      await figure.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 90));
      await page.waitForTimeout(40);
      const path = folder + '/screenshots/' + stamp + '/' + name + '-' + width + '-text' + scale + '.png';
      await figure.screenshot({ path });
      pictures.push({ path, sha256: digest(path), name, width, scale });
    }
  }
  await page.setViewportSize({ width: 390, height: 2600 });
  await page.evaluate(() => document.documentElement.style.fontSize = '16px');
  async function captureChanged(labId, state, edit, names) {
    const lab = page.locator('#' + labId);
    await edit(lab);
    for (const name of names) {
      const figure = lab.locator('[data-figure="' + name + '"]');
      await figure.evaluate(element => window.scrollTo(0,
        element.getBoundingClientRect().top + window.scrollY - 90));
      await page.waitForTimeout(50);
      const outside = await figure.locator('svg').evaluate(svg => {
        const domain = svg.viewBox.baseVal;
        return Array.from(svg.querySelectorAll('text')).filter(text => {
          const box = text.getBBox();
          return box.x < -.5 || box.y < -.5 || box.x + box.width > domain.width + .5 ||
            box.y + box.height > domain.height + .5;
        }).map(text => text.textContent);
      });
      assert.deepEqual(outside, [], name + ': changed-case tick or label clipping');
      const path = folder + '/screenshots/' + stamp + '/' + name + '-390-' + state + '.png';
      await figure.screenshot({ path });
      pictures.push({ path, sha256: digest(path), name, width: 390, scale: 1, state });
    }
    pass(labId + ': changed-case paint exported', {
      state, readout: await lab.locator('.flow-readout').textContent(),
    });
    await lab.getByRole('button', { name: /Reset/ }).click();
  }
  await captureChanged('regression-residuals', 'b4-w3', async lab => {
    for (const input of await lab.locator('input').all()) {
      await input.focus(); await input.press('End');
    }
  }, ['regression-residual-geometry']);
  await captureChanged('regression-changed-evidence', 'D8', async lab => {
    await lab.locator('input').focus(); await lab.locator('input').press('End');
  }, ['regression-changed-data']);
  await captureChanged('regression-gradient', 'divergent-step16', async lab => {
    await lab.locator('select').selectOption('0.3');
    await lab.locator('input').focus(); await lab.locator('input').press('End');
  }, ['regression-parameter-contours', 'regression-full-gradient-path']);
  await captureChanged('regression-weighted-evidence', 'equal-weights', async lab => {
    await lab.locator('input').focus(); await lab.locator('input').press('End');
  }, ['regression-weighted-line', 'regression-weighted-row']);
  await captureChanged('regression-threshold', 'no-warnings', async lab => {
    await lab.locator('input').focus(); await lab.locator('input').press('End');
  }, ['regression-warning-gate']);
  await captureChanged('regression-separation', 'w12-penalty02', async lab => {
    await lab.locator('input').focus(); await lab.locator('input').press('End');
    await lab.locator('select').selectOption('0.2');
  }, ['regression-separation-score', 'regression-separation-close', 'regression-separation-full']);
  await captureChanged('regression-leverage', 'A-minus2', async lab => {
    await lab.locator('select').selectOption('0');
    await lab.locator('input').focus(); await lab.locator('input').press('Home');
  }, ['regression-leverage-response']);
  await captureChanged('regression-uncertainty', 'query9', async lab => {
    await lab.locator('input').focus(); await lab.locator('input').press('End');
  }, ['regression-pointwise-intervals']);
  assert.deepEqual(errors, []);
  for (const path of paths) assert.equal(digest(path), identity[path], path + ': source changed');
  const receipt = { at: new Date().toISOString(),
    scope: 'Author current isolated-production native controls, retries and painted exports; personal/independent pixel review tracked separately; parent integration remains required',
    sourceHashes: identity, checks, pictures, errors };
  fs.writeFileSync(folder + '/reading-flow-browser-' + stamp + '.json', JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ checks: checks.length, pictures: pictures.length, errors: errors.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
