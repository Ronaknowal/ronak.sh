const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const folder = 'docs/teaching/deep-learning-beginner/convnext-modern-cnn-designs';
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4812';
const report = { passed: false, checkedAt: new Date().toISOString(), base, checks: [], viewports: [], screenshots: [], errors: [], sourceHashes: {} };
const parseNumber = text => Number(text.replaceAll(',', '').replaceAll('−', '-'));
(async () => {
  const model = await import(pathToFileURL(path.resolve('src/learn/data/convnext-models.js')).href);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true, hasTouch: true });
    const page = await context.newPage();
    const requests = [];
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await page.goto(base + '/learn/path/full-curriculum/convnext-modern-cnn-designs?module=deep-learning-fundamentals', { waitUntil: 'domcontentloaded' });
    await page.locator('.convnext-lesson.lesson-flow').waitFor();
    await page.locator('[data-figure="convnext-spatial-channel"] svg').waitFor();
    assert.equal(requests.some(url => url.endsWith('saved-models.json')), false, 'Weights must not load at the opening');
    report.checks.push('Current drawing revision rendered; saved weights deferred at opening');
    const compass = page.locator('.lesson-compass');
    assert.equal(await compass.count(), 1);
    const links = compass.locator('.lesson-compass__sections a');
    assert.equal(await links.count(), await page.locator('.convnext-lesson h2').count());
    for (const link of await links.all()) {
      const href = await link.getAttribute('href');
      assert.ok(href.startsWith('#'));
      assert.equal(await page.locator(`[id="${href.slice(1)}"]`).count(), 1);
    }
    const firstHref = await links.first().getAttribute('href');
    await links.first().click(); assert.equal(new URL(page.url()).hash, firstHref);
    assert.equal(await compass.locator('.lesson-compass__route').count(), 1);
    report.checks.push('One opening compass with actual section anchors and working jump navigation');
    const lab = id => page.locator('#convnext-' + id);
    const read = id => lab(id).locator('.flow-readout');
    const values = async id => (await read(id).locator('strong').allTextContents()).map(parseNumber);
    async function set(id, index, value) {
      const slider = lab(id).locator('input[type=range]').nth(index);
      await slider.scrollIntoViewIfNeeded(); await slider.fill(String(value));
      await slider.dispatchEvent('input'); await slider.dispatchEvent('change');
    }
    const close = (a, b, eps = 1e-5) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
    fs.mkdirSync(folder + '/screenshots/reading-flow', { recursive: true });
    async function capture(id, state) {
      const target = lab(id); await target.scrollIntoViewIfNeeded();
      const output = `${folder}/screenshots/reading-flow/${id}-${state}-1366.png`;
      await target.screenshot({ path: output, style: 'header,.skip-link {visibility:hidden !important}' });
      report.screenshots.push(output);
    }
    for (const value of [-20, 37.25, 120]) {
      await set('normalization', 0, value);
      const expected = model.normalizeLocations([[1, 3], [value, 103]], 'whole').output[0];
      const text = await read('normalization').innerText();
      expected.forEach(number => assert.ok(text.includes(String(Number(number.toFixed(6))).replaceAll('-', '−')), text));
    }
    await set('normalization', 0, 101);
    report.checks.push('Channel/GN groups: interior values, both endpoints and preserved local group');
    for (const [channels, kernel, side] of [[4, 3, 1], [64, 5, 21], [256, 11, 56]]) {
      for (const [index, value] of [channels, kernel, side].entries()) await set('budget', index, value);
      const actual = await values('budget'); const expected = model.blockBudget(channels, 4, kernel, side, side, 1);
      assert.deepEqual(actual, [expected.parameters, expected.macs]);
    }
    for (const [index, value] of [96, 7, 14].entries()) await set('budget', index, value);
    report.checks.push('Width/kernel/grid controls agree with independently checked parameter and MAC model');
    for (const [value, scale] of [[0, .5], [24, -.65], [13.25, 0], [12, 1]]) {
      await set('grn', 0, value); await set('grn', 1, scale);
      close((await values('grn'))[0], model.responseNormalize([[3, 4], [0, value]], [scale, -.5], [0, 0]).output[0][0]);
      if (scale === 0) await capture('grn', 'null');
      if (value === 24) await capture('grn', 'changed');
    }
    await set('grn', 0, 12); await set('grn', 1, .5);
    report.checks.push('GRN coupling: zero/sign/interior/endpoints with live numeric agreement');
    const slider = lab('grn').getByRole('slider', { name: /Channel B/ });
    await slider.scrollIntoViewIfNeeded(); await slider.focus(); const before = await slider.inputValue();
    await page.keyboard.press('ArrowRight'); assert.notEqual(await slider.inputValue(), before);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const bounds = await slider.boundingBox(); const old = await slider.inputValue();
    await page.mouse.move(bounds.x + bounds.width * .6, bounds.y + bounds.height / 2); await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height / 2, { steps: 5 }); await page.mouse.up();
    assert.notEqual(await slider.inputValue(), old);
    await page.touchscreen.tap(bounds.x + bounds.width * .3, bounds.y + bounds.height / 2);
    assert.ok(Number(await slider.inputValue()) < 15);
    report.checks.push('Actual keyboard, mouse drag and touch edits move a labelled native control');
    await set('grn', 0, 12);
    await lab('mask').scrollIntoViewIfNeeded(); await read('mask').waitFor();
    const pixelStyles = await lab('mask').locator('.cnx-pixel-grid button').evaluateAll(nodes => nodes.map(n => ({
      intensity: Number(n.style.getPropertyValue('--intensity')), colour: getComputedStyle(n).backgroundColor,
      width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height,
    })));
    assert.equal(pixelStyles.length, 64);
    for (const pixel of pixelStyles) {
      const expected = [195, 145, 50].map(channel => Math.round(15 + pixel.intensity * channel));
      assert.equal(pixel.colour, `rgb(${expected.join(', ')})`, 'Editable target must display supplied intensity, including selected pixels');
      assert.ok(Math.abs(pixel.width - pixel.height) < 2, 'Editable and static pixel grids preserve square geometry');
    }
    const initial = await values('mask');
    await lab('mask').getByRole('button', { name: /row 0, column 0,.*hidden target/ }).click();
    await set('mask', 0, 1); const hidden = await values('mask');
    assert.notEqual(hidden[0], initial[0]); close(hidden[1], 0, 1e-12);
    const selectedStyle = await lab('mask').locator('.cnx-pixel-grid button[aria-pressed=true]').evaluate(n => ({ background: getComputedStyle(n).backgroundColor, outline: getComputedStyle(n).outlineColor, width: getComputedStyle(n).outlineWidth }));
    assert.deepEqual(selectedStyle, { background: 'rgb(210, 160, 65)', outline: 'rgb(255, 255, 255)', width: '3px' });
    await lab('mask').locator('.cnx-pixel-grid button[aria-pressed=true]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await lab('mask').locator('.cnx-pixel-grid button[aria-pressed=true]').evaluate(n => getComputedStyle(n).outlineColor), 'rgb(228, 183, 82)');
    await lab('mask').locator('input[type=range]').focus();
    await capture('mask', 'hidden-edit');
    await lab('mask').getByRole('button', { name: 'Restore original image', exact: true }).click();
    await lab('mask').getByRole('button', { name: /row 0, column 2,.*visible input/ }).click();
    await set('mask', 0, 1); assert.ok((await values('mask'))[1] > .01);
    await capture('mask', 'visible-edit');
    await lab('mask').getByRole('button', { name: 'Restore original image', exact: true }).click();
    report.checks.push('Saved-weight pixel intervention: hidden edit changes loss only; visible edit changes reconstruction');
    report.checks.push('All 64 editable pixel colours match their numeric intensities; selection preserves brightness, white outline and square geometry');
    await lab('patch-visibility').scrollIntoViewIfNeeded(); await read('patch-visibility').waitFor();
    await lab('patch-visibility').getByRole('button', { name: /Patch row.*visible$/ }).first().click();
    await lab('patch-visibility').getByRole('button', { name: /Patch row.*hidden$/ }).first().click();
    assert.equal(await lab('patch-visibility').locator('button[data-visible=true]').count(), 6);
    assert.ok((await values('patch-visibility')).at(-1) > 0);
    await lab('patch-visibility').getByRole('button', { name: 'Restore original visibility' }).click();
    report.checks.push('Patch swap preserves six visible patches and changes model output; reset restores state');
    const measurements = JSON.parse(fs.readFileSync('src/learn/data/convnext-measurements.json', 'utf8'));
    for (const seed of [1, 2, 3]) {
      await lab('recorded-experiment').getByRole('button', { name: String(seed), exact: true }).click();
      assert.deepEqual(await values('recorded-experiment'), [seed]);
      const tables = lab('recorded-experiment').locator('table');
      const runs = measurements.runs.filter(run => run.seed === seed);
      const trajectory = await tables.nth(0).innerText();
      for (const run of runs) for (const entry of run.trace) assert.ok(trajectory.includes(String(Number(entry.development_masked_mse.toFixed(7)))), 'Recorded trajectory must match preserved native data');
      assert.equal(await tables.nth(0).locator('tbody tr').first().locator('th').first().innerText(), '0');
    }
    report.checks.push('All six recorded trajectories switch faithfully between paired seeds and retain untrained step zero');
    for (const [centre, gamma, input] of [[-3, -3, -20], [.7, 0, 17.5], [3, 3, 30]]) {
      for (const [index, value] of [centre, gamma, input].entries()) await set('fusion', index, value);
      const actual = await values('fusion'); close(actual[0], actual[1]); assert.ok(actual[2] < 1e-10);
    }
    for (const [index, value] of [.4, 3, 13].entries()) await set('fusion', index, value);
    await set('nonlinear-fusion', 0, 0); close((await values('nonlinear-fusion'))[0], 0);
    await set('nonlinear-fusion', 0, -2); close((await values('nonlinear-fusion'))[0], 2);
    report.checks.push('Affine folding holds across signed/extreme controls; nonlinear counterexample and null agree');
    const file = page.locator('.lesson-code-source').filter({ hasText: 'convnext-blocks.py' }).first();
    await file.scrollIntoViewIfNeeded(); await file.locator('.lesson-code').waitFor();
    await file.getByRole('button', { name: 'Copy convnext-blocks.py', exact: true }).click();
    await file.locator('[data-copied]').waitFor();
    const canonical = fs.readFileSync('public/learn-assets/convnext-modern-cnn-designs/convnext-blocks.py', 'utf8').replaceAll('\r\n', '\n');
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), canonical);
    const [download] = await Promise.all([page.waitForEvent('download'), file.getByRole('link', { name: 'Download convnext-blocks.py', exact: true }).click()]);
    assert.equal(download.suggestedFilename(), 'convnext-blocks.py');
    const chunks = []; for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), fs.readFileSync('public/learn-assets/convnext-modern-cnn-designs/convnext-blocks.py'));
    report.checks.push('Visible code, canonical Copy with feedback and Download');
    const answer = page.locator('[data-lesson-ending="practice"] details').first(); await answer.locator('summary').click(); assert.equal(await answer.getAttribute('open'), '');
    assert.equal(await page.locator('.lesson-flow details').filter({ has: page.locator('svg') }).count(), 0);
    report.checks.push('Practice disclosure works; diagrams are visible outside disclosures');
    fs.mkdirSync(folder + '/screenshots/reading-flow', { recursive: true });
    for (const [width, scale] of [[1366, 1], [768, 1], [768, 2], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(value => document.documentElement.style.fontSize = value === 2 ? '200%' : '', scale);
      const objects = page.locator('.lesson-flow figure, .lesson-flow .flow-lab'); const geometry = [];
      for (let index = 0; index < await objects.count(); index++) {
        const object = objects.nth(index); await object.scrollIntoViewIfNeeded();
        geometry.push(await object.evaluate(n => { const rect = n.getBoundingClientRect(), css = getComputedStyle(n); return { id: n.id || n.dataset.figure, width: rect.width, scroll: n.scrollWidth, border: css.borderTopWidth, background: css.backgroundColor }; }));
      }
      assert.ok(geometry.every(item => item.width > 0 && item.scroll <= item.width + 2), JSON.stringify({ width, scale, failed: geometry.filter(item => item.scroll > item.width + 2) }));
      assert.ok(geometry.every(item => item.border === '0px' && item.background === 'rgba(0, 0, 0, 0)'), 'Figures/labs must not have card frames');
      const pageWidth = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(pageWidth.scroll <= pageWidth.width + 2);
      const outputGeometry = await page.locator('.convnext-lesson .flow-slider output').evaluateAll(nodes => nodes.map(n => {
        // A flex item stretches beside a wrapped label even when its glyphs
        // occupy one line. Measure the text range rather than the outer box.
        const range = document.createRange(); range.selectNodeContents(n);
        return { value: n.textContent, textLines: range.getClientRects().length, height: range.getBoundingClientRect().height,
          fontSize: parseFloat(getComputedStyle(n).fontSize), whiteSpace: getComputedStyle(n).whiteSpace,
          width: n.getBoundingClientRect().width, scroll: n.scrollWidth };
      }));
      const intact = item => item.whiteSpace === 'nowrap' && item.textLines === 1 && item.height < 1.8 * item.fontSize && item.scroll <= item.width + 2;
      assert.ok(outputGeometry.every(intact), JSON.stringify({ width, scale, failed: outputGeometry.filter(item => !intact(item)) }));
      report.viewports.push({ width, scale, objects: geometry, page: pageWidth, sliderOutputs: outputGeometry });
      if ([1366, 390].includes(width)) for (const key of ['convnext-purpose', 'convnext-spatial-channel', 'convnext-worked-block', 'convnext-block-v1', 'convnext-normalization', 'convnext-grn', 'convnext-information-boundary', 'convnext-hierarchy', 'convnext-linear-probe', 'convnext-fusion']) {
        const target = page.locator(`[data-figure="${key}"],#${key}`).first();
        if (await target.count()) { await target.scrollIntoViewIfNeeded(); const output = `${folder}/screenshots/reading-flow/${key}-${width}.png`; await target.screenshot({ path: output, style: 'header,.site-skip {visibility:hidden !important}' }); report.screenshots.push(output); }
      }
    }
    const recovery = await context.newPage();
    await recovery.route('**/saved-models.json', route => route.fulfill({ status: 503, body: 'controlled unavailable' }));
    await recovery.goto(base + '/learn/path/full-curriculum/convnext-modern-cnn-designs?module=deep-learning-fundamentals', { waitUntil: 'domcontentloaded' });
    await recovery.locator('#convnext-mask').scrollIntoViewIfNeeded();
    await recovery.locator('#convnext-mask').getByRole('button', { name: 'Retry saved weights' }).waitFor();
    await recovery.unroute('**/saved-models.json');
    await recovery.locator('#convnext-mask').getByRole('button', { name: 'Retry saved weights' }).click();
    await recovery.locator('#convnext-mask .flow-readout').waitFor(); await recovery.close();
    report.checks.push('Controlled saved-weight failure and recovery');
    assert.deepEqual(report.errors, []); report.browser = browser.version();
    for (const source of ['src/learn/data/topics/convnext-modern-cnn-designs.jsx', 'src/learn/components/lesson-labs/ConvNeXtDrawings.jsx', 'src/learn/components/lesson-labs/ConvNeXtLabs.jsx', 'src/learn/components/lesson-labs/convnext-flow.css', 'src/learn/data/convnext-models.js', 'src/learn/data/convnext-measurements.json', 'scripts/verify-convnext-flow-browser.cjs']) report.sourceHashes[source] = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
    report.passed = true;
  } finally { await browser.close(); }
})().catch(error => { report.failure = error.stack; process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(folder + '/reading-flow-browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, viewports: report.viewports.length, failure: report.failure }));
});
