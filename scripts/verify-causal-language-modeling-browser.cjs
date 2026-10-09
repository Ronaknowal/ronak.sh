const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4243';
const output = path.resolve('docs/teaching/llm-architecture-training/causal-language-modeling-next-token-prediction/browser-evidence');
const route = '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  const captures = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.locator('[data-clm-figure="distribution"]').waitFor();
  await page.locator('[data-clm-figure="study"]').waitFor();
  const shot = async (name, selector) => {
    const item = page.locator(selector).first();
    await item.scrollIntoViewIfNeeded();
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    const file = `${name}.png`;
    await item.screenshot({ path: path.join(output, file), style: '.site-header--learn { visibility: hidden !important; }' });
    captures.push(file);
  };
  if (process.argv.includes('--review-fixes-only')) {
    for (const [width, font, label] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
      for (const name of ['decoder', 'greedy-tree']) await shot(`${label}-${name}`, `[data-clm-figure="${name}"]`);
      const dimensions = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
      assert.equal(dimensions[0], dimensions[1]);
    }
    assert.deepEqual(errors, []);
    const crypto = require('node:crypto');
    const sources = Object.fromEntries(['src/learn/components/lesson-labs/CausalLanguageModelingFlow.jsx', 'src/learn/components/lesson-labs/causal-language-modeling-flow.css'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
    fs.writeFileSync(path.join(output, 'review-fix-closure.json'), JSON.stringify({ at: new Date().toISOString(), captures, errors, sources, scope: 'Residual caption gutter/wrapping; literal four-path probability tree; blur isolated captures' }, null, 2));
    await browser.close();
    return;
  }
  if (process.argv.includes('--captions-only')) {
    for (const [width, font, label] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
      for (const name of ['shift', 'training-generation']) {
        await shot(`${label}-${name}`, `[data-clm-figure="${name}"]`);
        assert.ok(!(await page.locator(`[data-clm-figure="${name}"] figcaption`).innerText()).includes('column'));
      }
    }
    fs.writeFileSync(path.join(output, 'caption-closure.json'), JSON.stringify({ at: new Date().toISOString(), captures, corrected: 'Captions describe predictions and input-target pairs for both row and column layouts' }, null, 2));
    await browser.close();
    return;
  }
  await page.screenshot({ path: path.join(output, 'reader-opening.png') });
  for (const name of ['distribution', 'shift', 'causal-mask', 'loss', 'loss-mask', 'packing', 'decoder', 'study', 'generation', 'greedy-tree', 'training-generation', 'window', 'objectives', 'encoder-decoder']) {
    await shot(`desktop-${name}`, `[data-clm-figure="${name}"]`);
  }
  await page.getByRole('button', { name: 'Unmasked', exact: true }).click();
  await page.getByRole('slider', { name: 'Value at key 3' }).fill('8');
  await shot('desktop-unmasked-change', '[aria-label="Change a future value and inspect causal invariance"]');
  assert.match(await page.locator('[data-clm-figure="causal-mask"]').innerText(), /3.5/);
  await page.getByRole('button', { name: 'Causal', exact: true }).first().click();
  assert.match(await page.locator('[data-clm-figure="causal-mask"]').innerText(), /1.5/);
  await page.getByRole('slider', { name: 'Query row' }).fill('3');
  await shot('desktop-last-row-null', '[aria-label="Change a future value and inspect causal invariance"]');
  await page.getByRole('button', { name: 'Uniform logits' }).click();
  await shot('desktop-uniform', '[aria-label="Trace logits through probability loss and gradient"]');
  assert.match(await page.locator('[data-clm-figure="loss"]').innerText(), /1.386294/);
  await page.getByLabel('sat logit', { exact: true }).fill('2');
  await shot('desktop-edited-logit', '[aria-label="Trace logits through probability loss and gradient"]');
  await page.getByRole('button', { name: 'Exclude all', exact: true }).click();
  await shot('desktop-no-targets', '[aria-label="Choose which targets contribute to the loss"]');
  assert.match(await page.locator('[data-clm-figure="loss-mask"]').innerText(), /undefined/);
  await page.getByRole('button', { name: 'Independent documents', exact: true }).click();
  await shot('desktop-independent-documents', '[aria-label="Compare continuous and independent document packing"]');
  await page.getByRole('slider', { name: 'Temperature' }).fill('0.25');
  await shot('desktop-temperature', '[data-clm-figure="generation"]');
  await page.getByRole('slider', { name: 'Scored target position' }).fill('6');
  await shot('desktop-final-window', '[aria-label="Inspect each target\'s finite context"]');
  await page.getByRole('button', { name: 'Prefix', exact: true }).click();
  await shot('desktop-prefix', '[data-clm-figure="objectives"]');
  await page.getByRole('button', { name: 'Masked', exact: true }).click();
  await shot('desktop-masked', '[data-clm-figure="objectives"]');
  const layouts = [];
  for (const [width, font, label] of [[390, 16, 'phone'], [768, 32, 'zoom']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
    for (const name of ['shift', 'causal-mask', 'loss', 'loss-mask', 'packing', 'decoder', 'study', 'generation', 'training-generation', 'window', 'objectives', 'encoder-decoder']) {
      await shot(`${label}-${name}`, `[data-clm-figure="${name}"]`);
    }
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    layouts.push({ label, ...metrics });
    assert.ok(metrics.width <= metrics.viewport + 1, `${label} page overflow: ${metrics.width}`);
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
  const code = page.locator('.lesson-code-source');
  for (let index = 0; index < await code.count(); index++) {
    await code.nth(index).scrollIntoViewIfNeeded();
    await code.nth(index).locator('pre').waitFor();
    assert.ok((await code.nth(index).locator('pre').innerText()).length > 1500);
    const filename = await code.nth(index).locator('.lesson-code__filename').innerText();
    const expected = fs.readFileSync(path.join('public/learn-code/causal-language-modeling', filename), 'utf8');
    await code.nth(index).getByRole('button', { name: `Copy ${filename}`, exact: true }).click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
    const downloadEvent = page.waitForEvent('download');
    await code.nth(index).getByRole('link', { name: `Download ${filename}`, exact: true }).click();
    const download = await downloadEvent;
    assert.equal(fs.readFileSync(await download.path(), 'utf8'), expected);
  }
  const aliases = ['1-start-with-the-problem', '2-build-the-intuition', '3-make-the-idea-precise', '8-what-scales-and-what-doesn-t'];
  for (const id of aliases) assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
  assert.equal(await page.locator('.lesson-code-source').count(), 4);
  assert.deepEqual(errors, []);
  await page.getByRole('slider', { name: 'Temperature' }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('slider', { name: 'Temperature' }).inputValue(), '0.5');
  let failStudy = true;
  await page.route('**/learn-code/causal-language-modeling/study.json', request => failStudy ? request.abort() : request.continue());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Retry study', exact: true }).waitFor();
  failStudy = false;
  await page.getByRole('button', { name: 'Retry study', exact: true }).click();
  await page.locator('[data-clm-figure="study"]').waitFor();
  const report = { at: new Date().toISOString(), base, route, captures, layouts, errors, programViews: 4, copiedSourceMatchesAfterWindowsNewlineNormalization: 4, downloadByteMatches: 4, studyRecovery: true, capturePolicy: 'Only sticky site header hidden while capturing isolated figures; normal reader opening retained', numericalChecks: 'See model and native verifiers', paint: 'Screenshots require human/author inspection' };
  fs.writeFileSync(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exit(1); });
