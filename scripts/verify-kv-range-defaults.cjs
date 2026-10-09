const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
const output = path.resolve(topic, `range-default-correction/browser-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const files = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/kv-cache-models.js',
  ...['Shared', 'Foundations', 'Memory', 'Storage'].map(n => `src/learn/components/lesson-labs/KvCache${n}.jsx`),
  'src/learn/components/lesson-labs/kv-cache-flow.css', 'scripts/verify-kv-range-defaults.cjs'];
const hashes = () => Object.fromEntries(files.map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report = { before: hashes(), checks: [], captures: [], states: [], pageErrors: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', e => report.pageErrors.push(e.message));
    await page.request.get('http://127.0.0.1:4261/__llm_refresh');
    await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-kv-figure="D26"]').waitFor({ timeout: 60000 });
    await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}' });
    for (const [width, font, profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = value + 'px'; }, font);
      for (const [id, expected] of [['D04',Math.SQRT2*Math.log(2)],['D22',7/15]]) {
        const figure = page.locator(`[data-kv-figure="${id}"]`);
        const slider = figure.getByRole('slider').first();
        await figure.getByRole('button', { name: 'Reset', exact: true }).click();
        for (const stage of ['default','keyboard','reset']) {
          if (stage === 'keyboard') { await slider.focus(); await page.keyboard.press('ArrowRight'); }
          if (stage === 'reset') await figure.getByRole('button', { name: 'Reset', exact: true }).click();
          const state = await slider.evaluate(input => ({ native: input.valueAsNumber, authored: Number(input.getAttribute('value')),
            step: input.step, valid: input.checkValidity(), label: input.closest('label').innerText,
            shown: Number(input.closest('label').querySelector('output').textContent) }));
          assert.equal(state.step, 'any');
          assert.ok(Math.abs(state.native-state.authored) <= 1e-15);
          assert.ok(Math.abs(state.shown-state.native) <= .00005001);
          assert.ok(state.valid);
          if (stage === 'keyboard') assert.notEqual(state.native, expected);
          else { assert.equal(state.authored, expected); assert.ok(Math.abs(state.native-expected) <= 1e-15); }
          report.states.push({ profile, id, stage, ...state, figureText: await figure.innerText() });
          const file = path.join(output, `${profile}-${id}-${stage}.png`);
          const item = await capture(page, figure, file);
          report.captures.push({ name: `${profile}-${id}-${stage}`, file, tiles: item.tiles.map(t => t.path) });
          report.checks.push(`${profile}/${id}/${stage}: native/state agreement within1e-15, exact authored reset, labelled rounded readout and current figure captured`);
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    assert.deepEqual(report.pageErrors, []);
    report.after = hashes();
    assert.deepEqual(report.after, report.before);
    report.status = 'passed; actual paint reading recorded separately';
  } catch (error) { report.failure = error.stack; process.exitCode = 1; }
  finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ output, checks: report.checks.length, captures: report.captures.length, failure: report.failure }));
  }
})();
