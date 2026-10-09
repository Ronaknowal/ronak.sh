const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const folder = 'docs/teaching/deep-learning-beginner/rnns-lstms-grus/';
const url = 'http://127.0.0.1:4819/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals';
const frames = folder + 'screenshots/reading-flow/';
fs.mkdirSync(frames, { recursive: true });
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await context.newPage(), errors = [], requests = [], groups = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().includes('/learn-assets/rnns-lstms-grus/')) requests.push(r.url()); });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.recurrent-flow-lesson').waitFor();
    assert.ok((await page.locator('.recurrent-flow-lesson').innerText()).includes('Question marks below stand'));
    assert.equal(requests.filter(p => /pen-models|recurrent-evidence/.test(p)).length, 0);
    groups.push('Current source text visible; no eager fitted-data request');
    for (const id of ['recurrent-forward', 'recurrent-parameters', 'recurrent-credit', 'lstm-retain', 'lstm-memory', 'lstm-readout', 'lstm-retention', 'lstm-write-retention', 'gru-blend', 'gru-reset', 'gru-mixing', 'recurrent-clipping']) {
      const lab = page.locator('#' + id); await lab.scrollIntoViewIfNeeded();
      const sliders = lab.locator('input[type=range]'); assert.ok(await sliders.count() <= 3);
      if (id === 'lstm-write-retention') { await sliders.nth(1).focus(); await sliders.nth(1).press('End'); }
      const before = await lab.locator('.flow-readout').innerText();
      await sliders.first().focus(); await sliders.first().press('Home');
      await page.waitForTimeout(70);
      const changed = await lab.locator('.flow-readout').innerText();
      assert.notEqual(changed, before, id);
      await sliders.first().press('End'); await sliders.first().press('ArrowLeft');
      for (const slider of await sliders.all()) { await slider.focus(); await slider.press('Home'); await slider.press('End'); }
      for (const select of await lab.locator('select').all()) { await select.selectOption({ index: 0 }); await select.selectOption({ index: 1 }); }
      const reset = lab.getByRole('button', { name: /Reset/ }); if (await reset.count()) await reset.first().click();
      groups.push(id + ': native keyboard controls and available reset');
    }
    // Restore the shared hand fixture and check target-only / zero-rate invariants.
    await page.locator('#recurrent-forward').getByRole('button', { name: 'Reset scalar example' }).click();
    const originalForward = await page.locator('#recurrent-forward .flow-readout').innerText();
    const credit = page.locator('#recurrent-credit input[type=range]'); await credit.first().focus(); await credit.first().press('End');
    assert.equal(await page.locator('#recurrent-forward .flow-readout').innerText(), originalForward);
    await credit.nth(1).focus(); await credit.nth(1).press('Home');
    assert.ok((await page.locator('#recurrent-credit .flow-readout').innerText()).includes('(0.8, 0.6, 0.1)'));
    groups.push('Target-only forward null and zero-rate unchanged parameters');
    await page.locator('[data-recurrent-load="recurrent-measured"]').scrollIntoViewIfNeeded();
    await page.locator('#recurrent-measured select').first().waitFor();
    for (const model of ['rnn', 'lstm', 'gru']) for (const seed of ['1', '2', '3']) {
      await page.locator('#recurrent-measured select').nth(0).selectOption(model); await page.locator('#recurrent-measured select').nth(1).selectOption(seed);
      assert.ok((await page.locator('#recurrent-measured .flow-readout').innerText()).includes(model.toUpperCase() + ' seed-' + seed));
    }
    groups.push('All nine recorded model/seed selections');
    await page.locator('[data-recurrent-load="recurrent-pen"]').scrollIntoViewIfNeeded(); await page.locator('#recurrent-pen input[type=range]').first().waitFor();
    await page.locator('#recurrent-pen [aria-label="Select point 3"]').focus(); await page.locator('#recurrent-pen [aria-label="Select point 3"]').press('Enter');
    const edit = page.locator('#recurrent-pen input[type=range]'); await edit.first().focus(); await edit.first().press('ArrowRight');
    const editedX = await edit.first().inputValue();
    await page.locator('#recurrent-pen-state select').selectOption('lstm'); assert.equal(await edit.first().inputValue(), editedX);
    await page.locator('#recurrent-pen-state input[type=range]').first().focus(); await page.locator('#recurrent-pen-state input[type=range]').first().press('End');
    await page.locator('#recurrent-pen-state input[type=range]').nth(1).focus(); await page.locator('#recurrent-pen-state input[type=range]').nth(1).press('Home');
    for (const index of ['1', '2', '0']) { await page.locator('#recurrent-pen select').selectOption(index); await page.locator('#recurrent-pen-state select').selectOption('rnn'); }
    await page.locator('#recurrent-pen').getByRole('button', { name: 'Reverse current trace' }).click();
    await page.locator('#recurrent-pen').getByRole('button', { name: 'Swap points 3 and 4' }).click();
    await page.locator('#recurrent-pen').getByRole('button', { name: 'Reset fitted trace' }).click();
    assert.equal(await page.locator('#recurrent-pen-state select').inputValue(), 'gru');
    groups.push('All three sources/models, accessible point choice, edited coordinates retained on model switch, reverse/swap/reset');
    for (const id of ['recurrent-boundary', 'recurrent-ownership', 'recurrent-padding']) {
      if (id !== 'recurrent-ownership') await page.locator(`[data-recurrent-load="${id}"]`).scrollIntoViewIfNeeded();
      const lab = page.locator('#' + id); await lab.scrollIntoViewIfNeeded(); await lab.locator('input[type=range]').first().waitFor();
      for (const slider of await lab.locator('input[type=range]').all()) { await slider.focus(); await slider.press('Home'); await slider.press('End'); }
      const checkbox = lab.locator('input[type=checkbox]'); if (await checkbox.count()) { await checkbox.check(); await checkbox.uncheck(); }
      const reset = lab.getByRole('button', { name: /Reset|Restore/ }); await reset.click();
      groups.push(id + ': bounds, checkbox if present, reset');
    }
    // Visible source and toolbar feedback; Windows clipboard normalizes newlines.
    const code = page.locator('.lesson-teaching-section').filter({ hasText: 'class RecurrentSequence' });
    await page.locator('[aria-label="Explicit differentiable batched recurrent cells"]').scrollIntoViewIfNeeded();
    await code.locator('.lesson-code').waitFor(); const text = await code.locator('pre code').innerText();
    await code.getByRole('button', { name: 'Copy recurrent-cells.py' }).click();
    await code.locator('[role=status]').filter({ hasText: 'Copied' }).waitFor();
    const normalizeLines = value => value.replace(/\r\n/g, '\n');
    assert.equal(normalizeLines(await page.evaluate(() => navigator.clipboard.readText())), normalizeLines(text));
    const downloadEvent = page.waitForEvent('download'); await code.getByRole('button', { name: 'Download recurrent-cells.py' }).click();
    const download = await downloadEvent; assert.equal(download.suggestedFilename(), 'recurrent-cells.py');
    assert.equal(normalizeLines(fs.readFileSync(await download.path(), 'utf8')), normalizeLines(text));
    assert.equal(await page.locator('[data-lesson-teaching="code"] details').count(), 0);
    groups.push('Instructional source visible; Copy feedback and clipboard/download content match with platform newline normalization');
    const layouts = [];
    for (const [width, percent] of [[1366,100], [768,100], [768,200], [390,100], [320,100]]) {
      await page.setViewportSize({ width, height: 1000 }); await page.evaluate(p => document.documentElement.style.fontSize = p + '%', percent);
      const outside = await page.locator('.recurrent-flow-lesson [data-figure]').evaluateAll(figures => figures.flatMap(figure => [...figure.querySelectorAll('svg text, svg rect, svg circle')].flatMap(t => { const box = t.getBBox(), v = t.closest('svg').viewBox.baseVal; return box.x < -.5 || box.y < -.5 || box.x + box.width > v.width + .5 || box.y + box.height > v.height + .5 ? [{figure:figure.dataset.figure,element:t.tagName,text:t.textContent}] : []; })));
      const overflow = await page.locator('.recurrent-flow-lesson').evaluate(el => el.getBoundingClientRect().right > innerWidth + 1);
      for (const name of ['recurrent-state-anatomy', 'recurrent-affine', 'recurrent-scalar-trace', 'lstm-cell-read', 'lstm-gate-generator', 'gru-candidate-reset-after', 'gru-reset-before', 'recurrent-pen-classifier', 'recurrent-chunk-paths', 'recurrent-direction-endpoints', 'lstm-full-state-paths', 'lstm-projection']) {
        await page.locator(`[data-figure="${name}"]`).first().screenshot({path: frames + name + '-' + width + '-' + percent + '.png'});
      }
      layouts.push({ width, percent, outside, overflow });
    }
    const sources = JSON.parse(fs.readFileSync(folder + 'reading-flow-source.json')).sourceHashes;
    const receipt = { passed: !errors.length && layouts.every(r => !r.outside.length && !r.overflow), errors, groups, layouts,
      requests, sourceHashes: sources, verifierHash: hash(__filename), url,
      limit: 'Automated current production interactions and bounds. Actual screenshot inspection and separate forced503/touch checks recorded separately.' };
    fs.writeFileSync(folder + 'reading-flow-browser.json', JSON.stringify(receipt, null, 2) + '\n');
    console.log(JSON.stringify({ passed: receipt.passed, groups:groups.length, errors, layouts:layouts.filter(r => r.outside.length || r.overflow) }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
