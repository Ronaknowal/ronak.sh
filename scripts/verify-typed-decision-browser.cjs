const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const topic = 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems';
const base = 'http://127.0.0.1:4252';
const output = path.resolve(topic, 'browser-evidence');
fs.mkdirSync(output, { recursive: true });
const sourcePaths = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/typed-decision-models.js',
  ...['Shared', 'Foundations', 'Probability', 'Study', 'Native'].map(name => `src/learn/components/lesson-labs/TypedDecision${name}.jsx`),
  'src/learn/components/lesson-labs/typed-decision-flow.css', 'public/learn-assets/typed-decision-systems/observations.json',
  'scripts/verify-typed-decision-browser.cjs'];
const hashes = () => Object.fromEntries(sourcePaths.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const argument = process.argv.find(value => value.startsWith('--figures='));
const ids = argument ? argument.slice(10).split(',') : Array.from({ length: 36 }, (_, j) => `D${String(j + 1).padStart(2, '0')}`);
const stamp = Date.now();

(async () => {
  const report = { before: hashes(), captures: [], layouts: [], interactions: [], errors: [], warnings: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /validateDOMNesting|cannot be a|cannot contain|unique.*key/i.test(message.text())) report.warnings.push(message.text());
    });
    await page.request.get(base + '/__llm_refresh');
    const url = base + '/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const figure = id => page.locator(`[data-typed-figure="${id}"]`);
    async function ready() {
      await figure('D36').getByRole('combobox', { name: 'Inspect dependency change' }).waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important}' });
    }
    await ready();
    assert.equal(await page.locator('[data-typed-figure]').count(), 36);
    assert.equal(await page.locator('[data-lesson-exercise]').count(), 18);
    assert.equal(await page.locator('.typed-flow .katex-error').count(), 0);
    assert.ok(await page.locator('.typed-flow .katex-display').count() >= 7);
    assert.doesNotMatch(await page.locator('.typed-flow').innerText(), /\$\$/);
    async function shot(name, element) {
      await element.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement?.blur());
      const file = `${stamp}-${name}.png`;
      await element.screenshot({ path: path.join(output, file), style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
      report.captures.push(file);
    }
    async function fullFigure(name, element) {
      await shot(name, element);
      let paneIndex = 0;
      for (const pane of await element.locator('.typed-scroll').all()) {
        const geometry = await pane.evaluate(el => ({ extent: el.scrollWidth - el.clientWidth, width: el.clientWidth }));
        if (geometry.extent > 2) {
          const positions = [];
          for (let x = geometry.width * .8; x < geometry.extent; x += geometry.width * .8) positions.push(x);
          positions.push(geometry.extent);
          for (const [i, x] of positions.entries()) {
            await pane.evaluate((el, value) => el.scrollLeft = value, x);
            await shot(`${name}-pane${paneIndex}-${i}`, pane);
          }
          await pane.evaluate(el => el.scrollLeft = 0);
        }
        paneIndex++;
      }
    }
    const slider = (id, label, value) => figure(id).getByRole('slider', { name: new RegExp(label) }).fill(String(value));
    const select = (id, label, value) => figure(id).getByRole('combobox', { name: label, exact: true }).selectOption(String(value));
    const check = (id, label, value) => figure(id).getByRole('checkbox', { name: label, exact: true }).setChecked(value);
    const changes = {
      D02: () => check('D02', 'Add fourth candidate D', true),
      D03: () => select('D03', 'Inspect candidate marker', 2),
      D04: () => check('D04', 'Omit candidate padding mask', true),
      D06: () => slider('D06', 'Inspect key position', 36),
      D07: async () => { await slider('D07', 'A logit before shift', -8); await slider('D07', 'Common shift', 1000); await check('D07', 'C is invalid', true); },
      D08: async () => { await slider('D08', 'Mass on A', 0); await slider('D08', 'B share', 0); },
      D09: async () => { await slider('D09', 'Move middle mass', 0); await check('D09', 'Use rubric 0, 1, 10', true); },
      D10: () => check('D10', 'Negate predicate', true),
      D11: async () => { await check('D11', 'Use supplied soft target', true); await slider('D11', 'Step size', 1); },
      D12: async () => { await select('D12', 'Recorded target case', 1); await slider('D12', 'Weight coordinate', 31); },
      D13: () => figure('D13').getByRole('button', { name: 'Report the true p' }).click(),
      D14: async () => { await slider('D14', 'True probability', .1); await slider('D14', 'Inspect reported', .9); },
      D15: async () => { await select('D15', 'Observed original level', 3); await check('D15', 'Swap middle category meanings', true); },
      D16: async () => { await slider('D16', 'Noise scale', 1); await select('D16', 'Noise witness', 4); },
      D17: async () => { await select('D17', 'Recorded group size', 16); await select('D17', 'Estimator', 'self_mean_std'); await select('D17', 'Gradient coordinate', 2); },
      D19: async () => { await slider('D19', 'Reported rare mass', 2); await select('D19', 'Spherical coefficient', .5); },
      D22: () => select('D22', 'Recorded seed', '43'),
      D23: async () => { await select('D23', 'Saved predictor', 'laya'); await figure('D23').getByRole('button', { name: 'Inspect first error' }).click(); },
      D24: () => slider('D24', 'Positive external temperature', .05),
      D25: async () => { await select('D25', 'Recorded predictor', 'laya'); await select('D25', 'Display bins', 10); },
      D26: () => slider('D26', 'Cost of action A', 0),
      D27: () => slider('D27', 'Perfect review cost', 0),
      D28: async () => { await check('D28', 'Explore diagnostic threshold', true); await slider('D28', 'Diagnostic pmax threshold', 1); await slider('D28', 'Inspect paired test row', 117); },
      D29: () => select('D29', 'Recorded cheap predictor', 'lexical'),
      D30: () => select('D30', 'Recorded question type', 'refund'),
      D31: () => select('D31', 'Inspect restored answer', 5),
      D32: () => select('D32', 'Warm call workload', '4'),
      D33: async () => { await select('D33', 'Recorded schema intervention', 23); await check('D33', 'Inspect native checkpoint instead', true); },
      D34: async () => { await check('D34', 'Put actual clue at the end', true); await slider('D34', 'Constructed total budget', 128); },
      D35: () => select('D35', 'Prespecified intervention', 2),
      D36: () => select('D36', 'Inspect dependency change', 'description'),
    };
    for (const [width, font, profile] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
      if (profile !== 'desktop') { await page.reload({ waitUntil: 'domcontentloaded' }); await ready(); }
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => document.documentElement.style.fontSize = value + 'px', font);
      for (const id of ids) {
        await fullFigure(`${profile}-${id}`, figure(id));
        if (changes[id]) { await changes[id](); await fullFigure(`${profile}-${id}-changed`, figure(id)); }
      }
      const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      report.layouts.push({ profile, ...layout });
      assert.ok(layout.document <= width + 1, JSON.stringify(layout));
      assert.deepEqual(report.errors, []);
      console.log(JSON.stringify({ profile, captures: report.captures.length }));
    }
    if (!argument) {
      await page.setViewportSize({ width: 1366, height: 1000 });
      await page.evaluate(() => document.documentElement.style.fontSize = '16px');
      assert.match(await figure('D28').innerText(), /selective risk undefined/);
      await check('D04', 'All candidates invalid', true);
      await check('D07', 'All invalid', true);
      await check('D17', 'Constructed constant-reward LOO null', true);
      await check('D24', 'Constructed equal-logit null', true);
      for (const id of ['D04', 'D07', 'D17', 'D24']) await fullFigure(`null-${id}`, figure(id));
      await figure('D11').getByRole('button', { name: 'Reset', exact: true }).click();
      const range = figure('D11').getByRole('slider', { name: /Step size/ });
      await range.focus(); await range.press('ArrowRight'); assert.equal(await range.inputValue(), '0.25');
      report.interactions.push('All interactive changed states at three sizes; keyboard range/reset; explicit no-event, no-route, constant-reward and equal-logit nulls');
      const blocks = page.locator('.typed-flow .lesson-code-source');
      assert.equal(await blocks.count(), 10);
      for (const block of await blocks.all()) {
        await block.scrollIntoViewIfNeeded(); await block.locator('pre').waitFor({ timeout: 30000 });
        const name = await block.locator('.lesson-code__filename').innerText();
        const expected = fs.readFileSync('public/learn/examples/typed-decision-systems/' + name, 'utf8');
        assert.equal((await block.locator('pre').innerText()).replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
        await block.getByRole('button', { name: 'Copy ' + name, exact: true }).click();
        assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
        assert.match(await block.getByRole('button', { name: 'Copy ' + name, exact: true }).innerText(), /Copied/);
        const event = page.waitForEvent('download');
        await block.getByRole('link', { name: 'Download ' + name, exact: true }).click();
        assert.equal(fs.readFileSync(await (await event).path(), 'utf8'), expected);
        report.interactions.push('Exact displayed source / Copy / native Download: ' + name);
      }
      for (const [i, exercise] of (await page.locator('[data-lesson-exercise]').all()).entries()) {
        await exercise.locator('summary').first().click(); await exercise.locator('summary').last().click();
        await shot(`practice-${i + 1}`, exercise);
      }
      for (const [width, font, profile] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(value => document.documentElement.style.fontSize = value + 'px', font);
        for (const kind of ['further-learning', 'references', 'readiness']) await shot(`${profile}-${kind}`, page.locator(`[data-lesson-ending="${kind}"]`));
      }
      const archive = await page.request.get(base + '/learn/examples/typed-decision-systems/typed-decision-systems.zip');
      assert.equal(archive.status(), 200); assert.match(archive.headers()['content-type'], /zip/);
      assert.deepEqual(await archive.body(), fs.readFileSync('public/learn/examples/typed-decision-systems/typed-decision-systems.zip'));
      report.interactions.push('ZIP exact HTTP body/MIME; native ZIP saving not claimed');
      let fail = true;
      await page.route('**/learn-assets/typed-decision-systems/observations.json', route => fail ? route.abort() : route.continue());
      await page.route('**/learn/examples/typed-decision-systems/decision_math.py', route => fail ? route.abort() : route.continue());
      await page.reload({ waitUntil: 'domcontentloaded' });
      await figure('D36').getByRole('button', { name: 'Retry', exact: true }).waitFor();
      const first = page.locator('.typed-flow .lesson-code-source').first();
      await first.scrollIntoViewIfNeeded(); await first.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      await shot('source-failure', first); await shot('observations-failure', figure('D36'));
      fail = false;
      await page.locator('.typed-figure').getByRole('button', { name: 'Retry', exact: true }).first().click();
      await first.getByRole('button', { name: 'Retry', exact: true }).click();
      await first.locator('pre').waitFor(); await ready();
      report.interactions.push('Actual failed source/data requests followed by successful Retry');
    }
    assert.deepEqual(report.errors, []); assert.deepEqual(report.warnings, []);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack;
  } finally {
    report.after = hashes();
    if (JSON.stringify(report.before) !== JSON.stringify(report.after)) report.sourceChanged = true;
    fs.writeFileSync(path.join(output, `report-${stamp}.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, stamp, captures: report.captures.length, interactions: report.interactions.length, failure: report.failure, sourceChanged: report.sourceChanged }));
    await browser.close();
    if (report.status !== 'passed' || report.sourceChanged) process.exitCode = 1;
  }
})();
