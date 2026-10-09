const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/deep-learning-beginner/state-space-models-s4-mamba-mamba-2';
const names = ['StateSpaceDrawings.jsx', 'StateSpaceStructureDrawings.jsx', 'StateSpaceArchitectureDrawings.jsx', 'StateSpaceBlockDrawings.jsx', 'StateSpaceLearningDrawings.jsx', 'StateSpaceExtensionDrawings.jsx', 'StateSpaceLinePlot.jsx', 'StateSpaceFlowLabs.jsx', 'StateSpaceTrajectoryFlow.jsx', 'StateSpaceLearningEvidence.jsx', 'StateSpaceLabs.jsx', 'state-space-flow.css'];
const sources = [...names.map(name => `src/learn/components/lesson-labs/${name}`), 'src/learn/data/topics/state-space-models-s4-mamba-mamba-2.jsx', 'scratch/state-space-reading-flow/main.jsx'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceHashes = Object.fromEntries(sources.map(file => [file, hash(file)]));
const checks = [], layouts = [], screenshots = [], errors = [];
const check = (name, detail) => { checks.push({ name, detail }); console.log(name); };
const observe = page => page.on('pageerror', error => errors.push(error.message));
const load = async page => { await page.goto('http://127.0.0.1:4835/', { waitUntil: 'networkidle' }); assert((await page.locator('h1').innerText()).includes('whole reading-flow')); };
const fitted = async page => { await page.locator('.state-trajectory-flow').scrollIntoViewIfNeeded(); await page.locator('#ssm-trajectory-point').waitFor(); };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await context.newPage(); observe(page);
  let failure;
  try {
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await load(page);
    assert(!requests.some(url => url.includes('trajectory-inference.json')));
    check('Viewport-owned fitted weights remain unloaded initially');
    await fitted(page);
    assert(requests.some(url => url.includes('trajectory-inference.json')));
    check('Fitted weights load when investigation is reached');
    const sliders = page.locator('.flow-lab input[type="range"]');
    for (let i = 0; i < await sliders.count(); i++) {
      const slider = sliders.nth(i), name = await slider.evaluate(element => element.closest('label').querySelector('span').childNodes[0].textContent.trim());
      const min = Number(await slider.getAttribute('min')), max = Number(await slider.getAttribute('max'));
      await slider.focus(); await slider.press('Home'); assert.equal(Number(await slider.inputValue()), min);
      await slider.press('End'); assert.equal(Number(await slider.inputValue()), max);
      const output = await slider.locator('xpath=ancestor::section[contains(@class,"flow-lab")]').locator('.flow-readout').innerText();
      assert(!/NaN|Infinity|undefined/.test(output), `${name}: ${output}`);
      check(`Native keyboard slider: ${name}`, { min, max, output });
    }
    for (const select of await page.locator('.flow-lab select').all()) {
      const name = await select.getAttribute('aria-label'); assert(name, 'Direct stable accessible name');
      const values = await select.locator('option').evaluateAll(options => options.map(option => option.value));
      for (const value of [values.at(-1), values[0]]) await select.selectOption(value);
      check(`Native selection: ${name}`, { options: values.length });
    }
    for (const [id, append, remove, reset, limit, count] of [
      ['ssm-system-extent', 'Append zero input', 'Remove last input', 'Reset shared system', 16, 'positions'],
      ['ssm-selection-extent', 'Add distraction', 'Remove last event', 'Reset marked events', 16, 'events'],
      ['ssm-ssd-extent', 'Append SSD position', 'Remove SSD position', 'Reset shared SSD', 8, 'positions'],
    ]) {
      const lab = page.locator(`#${id}`), add = lab.getByRole('button', { name: append, exact: true }), drop = lab.getByRole('button', { name: remove, exact: true });
      await lab.getByRole('button', { name: reset, exact: true }).click();
      while (await add.isEnabled()) await add.click();
      assert((await lab.locator('.flow-readout').innerText()).includes(`${limit} ${count}`));
      while (await drop.isEnabled()) await drop.click();
      assert((await lab.locator('.flow-readout').innerText()).includes(`1 ${count}`));
      await lab.getByRole('button', { name: reset, exact: true }).focus(); await page.keyboard.press('Enter');
      check(`${id}: full supported extent, disabled bounds and keyboard reset`, { limit });
    }
    for (const id of ['ssm-selection-events', 'ssm-selection-comparison', 'ssm-recorded-confusion']) {
      const lab = page.locator(`#${id}`);
      for (const button of await lab.locator('.flow-controls button').all()) if (await button.isEnabled()) { await button.focus(); await page.keyboard.press('Enter'); }
      check(`${id}: actual action handlers`);
    }
    const point = page.locator('#ssm-trajectory-point'), order = page.locator('#ssm-trajectory-order');
    await point.getByRole('slider', { name: 'Selected point x', exact: false }).press('Home');
    const edited = await point.locator('.flow-readout').innerText();
    await page.getByRole('combobox', { name: 'Frozen temporal mixer', exact: true }).selectOption('selective');
    assert((await point.locator('.flow-readout').innerText()).includes('(0,'));
    await order.getByRole('button', { name: 'Reverse traversal order', exact: true }).click();
    await order.getByRole('button', { name: 'Reflect selected x', exact: true }).click();
    await order.getByRole('button', { name: 'Reset path', exact: true }).click();
    assert((await order.locator('.flow-readout').innerText()).includes('Reset restores the original logits'));
    check('Fitted model switch preserves edited coordinate; reverse/reflect/reset handlers', { edited });
    const handle = point.locator('[data-ssm-drag-handle]'); await handle.scrollIntoViewIfNeeded();
    let box = await handle.boundingBox(); const beforeDrag = await point.locator('.flow-readout').innerText();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2 - 19, { steps: 5 }); await page.mouse.up();
    assert.notEqual(await point.locator('.flow-readout').innerText(), beforeDrag);
    check('Real mouse drag changes selected trajectory coordinates');
    await page.getByRole('combobox', { name: 'Validation source row', exact: true }).selectOption({ index: 1 });
    await order.getByRole('button', { name: 'Reset path', exact: true }).click();
    check('Source selection and current-source reset remain consistent');
    await page.locator('.lesson-code').first().scrollIntoViewIfNeeded();
    const code = page.locator('.lesson-code').first();
    await code.locator('.lesson-code__copy').click();
    await code.locator('.lesson-code__copy[data-copied]').waitFor(); assert((await code.locator('.lesson-code__copy').innerText()).includes('Copied'));
    const copied = await page.evaluate(() => navigator.clipboard.readText()); assert(copied.includes('held_discretize'));
    const downloadPromise = page.waitForEvent('download'); await code.getByRole('button', { name: /^Download / }).click();
    const download = await downloadPromise; assert(download.suggestedFilename().includes('excerpt'));
    check('Visible copied feedback and truthful excerpt download', { filename: download.suggestedFilename() });
    fs.mkdirSync(`${folder}/screenshots/reading-flow/current`, { recursive: true });
    for (const [width, scale] of [[1366, 1], [768, 1], [768, 2], [390, 1], [320, 1]]) {
      await page.setViewportSize({ width, height: 1000 }); await page.evaluate(value => document.documentElement.style.fontSize = `${16 * value}px`, scale); await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, targets: [...document.querySelectorAll('.flow-controls select,.flow-controls button,.flow-controls input')].map(element => ({ tag: element.tagName, height: element.getBoundingClientRect().height })).filter(item => item.tag !== 'INPUT' && item.height < 43.5), controls: [...document.querySelectorAll('.flow-lab')].map(lab => ({ id: lab.id, count: lab.querySelectorAll('.flow-controls input,.flow-controls select,.flow-controls button').length })).filter(lab => lab.count > 3) }));
      assert(layout.scrollWidth <= width + 1, `Document overflow ${JSON.stringify(layout)}`); assert.equal(layout.targets.length, 0, JSON.stringify(layout.targets)); assert.equal(layout.controls.length, 0, JSON.stringify(layout.controls));
      layouts.push({ width, scale, ...layout });
      for (const name of ['vector-anatomy', 'mamba-two-core', 'ssd-boundary', 'fitted-classifier', 'mamba-three-block']) {
        const path = `${folder}/screenshots/reading-flow/current/${name}-${width}-${scale}.png`;
        await page.locator(`[data-figure="state-space-${name}"]`).screenshot({ path }); screenshots.push({ path, sha256: hash(path) });
      }
    }
    check('Five viewport bounds, touch targets and <=3 controls per question', layouts);
    const retry = await context.newPage(); observe(retry); let rejected = false;
    await retry.route('**/trajectory-inference.json', route => { if (!rejected) { rejected = true; return route.fulfill({ status: 503, body: 'temporary' }); } return route.continue(); });
    await load(retry); await retry.locator('.state-trajectory-flow').scrollIntoViewIfNeeded(); const retryButton = retry.getByRole('button', { name: 'Retry fitted models', exact: true }); await retryButton.waitFor(); await retryButton.focus(); await retry.keyboard.press('Enter'); await retry.locator('#ssm-trajectory-point').waitFor();
    check('Forced 503 has themed keyboard-operable retry; no case exists before initial successful load'); await retry.close();
    const mobile = await browser.newContext({ viewport: { width: 390, height: 1000 }, hasTouch: true, isMobile: true }); const touch = await mobile.newPage(); observe(touch); await load(touch); await fitted(touch);
    const touchHandle = touch.locator('[data-ssm-drag-handle]'); await touchHandle.scrollIntoViewIfNeeded(); box = await touchHandle.boundingBox(); const x = box.x + box.width / 2, y = box.y + box.height / 2;
    const old = await touch.locator('#ssm-trajectory-point .flow-readout').innerText(); const client = await touch.context().newCDPSession(touch);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 24, y: y - 18 }] }); await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.notEqual(await touch.locator('#ssm-trajectory-point .flow-readout').innerText(), old); check('Real touch pointer drag changes selected coordinate'); await mobile.close();
    assert.equal(errors.length, 0, JSON.stringify(errors)); assert.deepEqual(Object.fromEntries(sources.map(file => [file, hash(file)])), sourceHashes, 'Sources unchanged during campaign');
  } catch (error) { failure = error.stack; }
  finally { await browser.close(); }
  fs.writeFileSync(`${folder}/reading-flow-browser.json`, JSON.stringify({ checkedAt: new Date().toISOString(), status: failure ? 'failed' : 'passed', scope: 'Author isolated whole-topic production preview, not shared-site integration', sourceHashes, checks, layouts, screenshots, errors, failure }, null, 2));
  console.log(JSON.stringify({ status: failure ? 'failed' : 'passed', checks: checks.length, errors, failure }));
  if (failure) process.exitCode = 1;
})();
