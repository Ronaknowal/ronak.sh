const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const assert = require('node:assert/strict');
const directory = 'docs/teaching/llm-architecture-training/kv-cache-memory-management/runtime-review-alignment';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = { sources: {}, checks: [], profiles: [], errors: [] };
for (const file of [
  'docs/teaching/llm-architecture-training/kv-cache-memory-management/runtime-inputs.json',
  ...['Shared', 'Foundations', 'Memory', 'Storage'].map(name => `src/learn/components/lesson-labs/KvCache${name}.jsx`),
  'src/learn/components/lesson-labs/kv-cache-flow.css',
  'src/learn/data/kv-cache-models.js',
]) report.sources[file] = hash(file);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    let fail = true;
    let observationRequests = 0;
    await page.route('**/learn-assets/kv-cache-memory-management/observations.json', route => {
      observationRequests++;
      return fail ? route.fulfill({ status: 503, body: 'Independent temporary failure' }) : route.continue();
    });
    await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models', { waitUntil: 'domcontentloaded' });
    const figure = id => page.locator(`[data-kv-figure="${id}"]`);
    await figure('D26').waitFor();
    await figure('D09').getByRole('alert').waitFor();
    fail = false;
    await figure('D09').getByRole('button', { name: 'Retry', exact: true }).click();
    await figure('D09').getByRole('combobox').first().waitFor();
    // Other hook instances retain their failure state until their own Retry is used.
    for (const id of ['D10', 'D12']) {
      await figure(id).getByRole('button', { name: 'Retry', exact: true }).click();
      await figure(id).getByRole('combobox').first().waitFor();
    }
    assert.equal(observationRequests, 2);
    report.checks.push('503 then per-object Retry recovers all three consumers using one successful shared request');
    for (const [width, font, name] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'enlarged']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(font => { document.documentElement.style.fontSize = `${font}px`; }, font);
      await page.evaluate(() => document.fonts.ready);
      report.profiles.push(await page.evaluate(name => ({
        name, pageWidth: document.documentElement.scrollWidth, viewport: innerWidth,
        figures: [...document.querySelectorAll('[data-kv-figure]')].map(f => ({
          id: f.dataset.kvFigure,
          svgFonts: [...f.querySelectorAll('svg text')].map(text => ({
            text: text.textContent,
            actualPx: Number.parseFloat(getComputedStyle(text).fontSize) * text.ownerSVGElement.getBoundingClientRect().width / text.ownerSVGElement.viewBox.baseVal.width,
          })),
          ranges: [...f.querySelectorAll('input[type=range]')].map(input => ({
            label: input.closest('label').innerText,
            actualValue: input.value,
            authoredValue: input.getAttribute('value'),
            min: input.min, max: input.max, step: input.step, valid: input.checkValidity(),
          })),
        })),
      }), name));
    }
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
    for (const id of ['D04', 'D22']) {
      const slider = figure(id).getByRole('slider').first();
      const before = await slider.evaluate(input => ({ value: input.value, label: input.closest('label').innerText }));
      await slider.focus();
      await page.keyboard.press('ArrowRight');
      const after = await slider.evaluate(input => ({ value: input.value, label: input.closest('label').innerText }));
      report.checks.push({ id, before, after });
      await figure(id).getByRole('button', { name: 'Reset', exact: true }).click();
    }
    const d20 = figure('D20');
    for (let i = 0; i < 20; i++) await d20.getByRole('button', { name: 'Append one A record', exact: true }).click();
    assert.match(await d20.innerText(), /State unchanged/);
    await d20.getByRole('button', { name: 'Release request B', exact: true }).click();
    await d20.getByRole('button', { name: 'Append one A record', exact: true }).click();
    assert.doesNotMatch(await d20.innerText(), /State unchanged/);
    report.checks.push('Allocator exhaustion preserves state and release permits a later append');
    await d20.getByRole('button', { name: 'Reset', exact: true }).click();
    await figure('D15').getByRole('slider', { name: /Device capacity/ }).fill('12');
    assert.match(await figure('D15').innerText(), /deficit/);
    report.checks.push('Negative memory remainder stays signed');
    assert.equal(report.errors.length, 0);
    for (const [file, expected] of Object.entries(report.sources)) assert.equal(hash(file), expected);
    report.completed = true;
  } catch (error) {
    report.failure = { message: error.message, stack: error.stack };
    process.exitCode = 1;
  } finally {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'browser-independent.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
    console.log(JSON.stringify({ completed: report.completed, checks: report.checks.length, failure: report.failure?.message }));
  }
})();
