const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const base = 'http://127.0.0.1:4250';
const topic = 'docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods';
const output = path.resolve(topic, 'browser-evidence');
fs.mkdirSync(output, { recursive: true });
const allIds = Array.from({ length: 26 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`);
const argument = process.argv.find(value => value.startsWith('--figures='));
const ids = argument ? argument.slice(10).split(',') : allIds;
const paths = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/soft-prompt-models.js',
  ...['Shared', 'Foundations', 'Memory', 'Encoders', 'Evidence'].map(name => `src/learn/components/lesson-labs/SoftPrompt${name}.jsx`),
  'src/learn/components/lesson-labs/soft-prompt-flow.css', 'scripts/verify-soft-prompt-browser.cjs',
  'public/learn-assets/p-tuning-soft-prompt-methods/observations.json',
  'public/learn-assets/p-tuning-soft-prompt-methods/native-batch.json'];
const hashes = () => Object.fromEntries(paths.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));

(async () => {
  const report = { before: hashes(), captures: [], layouts: [], interactions: [], errors: [], warnings: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 },
      permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /validateDOMNesting|cannot be a|cannot contain|unique.*key/i.test(message.text())) report.warnings.push(message.text());
    });
    await page.request.get(base + '/__llm_refresh');
    await page.goto(base + '/learn/path/full-curriculum/p-tuning-soft-prompt-methods?module=large-language-models',
      { waitUntil: 'domcontentloaded', timeout: 90000 });
    const figure = id => page.locator(`[data-soft-figure="${id}"]`);
    const ready = async () => {
      await figure('P26').waitFor({ timeout: 60000 });
      try {
        await page.waitForFunction(() => document.querySelectorAll('.soft-flow .soft-observation-state').length === 0, null, { timeout: 60000 });
      } catch (error) {
        report.pendingObservations = await page.locator('.soft-flow .soft-observation-state').allTextContents();
        throw error;
      }
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important}' });
    };
    await ready();
    assert.equal(await page.locator('[data-soft-figure]').count(), 26);
    assert.equal(await page.locator('[data-lesson-exercise]').count(), 12);
    assert.equal(await page.locator('.soft-flow .katex-error').count(), 0);
    assert.ok(await page.locator('.soft-flow .katex').count() >= 8);
    assert.ok(!(await page.locator('.soft-flow').innerText()).includes('$$'));
    async function shot(name, element) {
      await element.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement?.blur());
      const file = name + '.png';
      await element.screenshot({ path: path.join(output, file), style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
      report.captures.push(file);
    }
    const select = (id, label, value) => figure(id).getByRole('combobox', { name: label, exact: true }).selectOption(String(value));
    const check = (id, label, value) => figure(id).getByRole('checkbox', { name: label, exact: true }).setChecked(value);
    const slider = (id, label, value) => figure(id).getByRole('slider', { name: new RegExp(label) }).fill(String(value));
    const change = {
      P01: () => select('P01', 'Task state to route', 'extraction'),
      P02: async () => { await check('P02', 'Wrap the forward in no_grad (broken training path)', true); await check('P02', 'Also make base parameters trainable', true); },
      P03: () => slider('P03', 'P0 coordinate 0', -.7),
      P04: () => slider('P04', 'Virtual input rows m', 0),
      P05: () => slider('P05', 'P0 coordinate 0', .9),
      P06: () => select('P06', 'Target class', 1),
      P07: async () => { await slider('P07', 'Learning rate', 0); await select('P07', 'Derivative coordinate', '1,1'); },
      P08: async () => { await select('P08', 'Inspect block', 1); await slider('P08', 'Real row', 3); },
      P09: async () => { await select('P09', 'Inspect selected training targets', 'none'); await slider('P09', 'Recorded generation step', 2); },
      P10: () => select('P10', 'Inspect memory at layer', 1),
      P11: async () => { await check('P11', 'Real row 2 is padding', true); await slider('P11', 'Inspect real query', 2); },
      P12: () => select('P12', 'Memory operation', 'absent'),
      P13: async () => { await slider('P13', 'Virtual positions m', 16); await check('P13', 'Count-only GQA variant: 2 KV heads, 4 query heads', true); },
      P14: () => check('P14', 'Recorded edit: latent row 1, coordinate 0 += 0.25', true),
      P15: async () => { await select('P15', 'Recurrent layer', 1); await select('P15', 'Traversal', 'backward'); await slider('P15', 'Original position', 0); await check('P15', 'Recorded middle-row edit: E[1,0] += 0.25', true); },
      P16: async () => { await select('P16', 'Encoder', 'lstm'); await select('P16', 'State view', 'inference'); },
      P17: () => slider('P17', 'Insert two prompt rows', 3),
      P18: async () => { await select('P18', 'Batch record', 1); await slider('P18', 'Inspect token position', 4); },
      P19: () => check('P19', 'Include the classifier in the optimizer', false),
      P20: async () => { await select('P20', 'Native method', 'prefix-projected'); await select('P20', 'Diagnostic record', 1); },
      P21: async () => { await slider('P21', 'Decoding call', 2); await check('P21', 'Constructed bug: prepend 8 rows again each call', true); },
      P22: async () => { await select('P22', 'Recipe', 'prefix-direct'); await select('P22', 'Paired seed', 43); },
      P23: async () => { await select('P23', 'Recorded run', 'prefix-direct-29'); await slider('P23', 'Inspect checkpoint index', 4); },
      P24: () => select('P24', 'Emphasize a curve family', 'encoder-mlp'),
      P25: async () => { await select('P25', 'Selected adapter', 'encoder-mlp-29'); await select('P25', 'Predeclared test example', 5); },
      P26: async () => { await select('P26', 'Base identity', 'other'); await check('P26', 'Concatenate a second identical prompt', true); },
    };
    for (const [width, font, size] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
      if (size !== 'desktop') { await page.reload({ waitUntil: 'domcontentloaded' }); await ready(); }
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => document.documentElement.style.fontSize = value + 'px', font);
      for (const id of ids) {
        await shot(`${argument ? 'delta-' : ''}${size}-${id}`, figure(id));
        let paneIndex = 0;
        for (const pane of await figure(id).locator('.soft-scroll').all()) {
          const box = await pane.evaluate(element => ({ width: element.clientWidth, extent: element.scrollWidth - element.clientWidth }));
          if (box.extent > 1) {
            for (const [name, distance] of [['middle', box.extent / 2], ['right', box.extent]]) {
              if (name === 'middle' && box.extent <= box.width) continue;
              await pane.evaluate((element, value) => element.scrollLeft = value, distance);
              await shot(`${argument ? 'delta-' : ''}${size}-${id}-pane${paneIndex}-${name}`, pane);
            }
            await pane.evaluate(element => element.scrollLeft = 0);
          }
          paneIndex++;
        }
        await change[id]();
        await page.waitForFunction(() => document.querySelectorAll('.soft-flow .soft-observation-state').length === 0);
        await shot(`${argument ? 'delta-' : ''}${size}-${id}-changed`, figure(id));
      }
      const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
        outside: [...document.querySelectorAll('.soft-flow *')].filter(element =>
          element.getBoundingClientRect().right > innerWidth + 1 && !element.closest('.soft-scroll,.soft-equation,.lesson-code-source,.lesson-code')).slice(0, 12)
          .map(element => ({ tag: element.tagName, class: String(element.className), text: element.textContent.slice(0, 70) })) }));
      report.layouts.push({ size, ...layout });
      assert.ok(layout.width <= width + 1, JSON.stringify(layout));
      assert.deepEqual(report.errors, []);
    }
    if (!argument) {
      await page.setViewportSize({ width: 1366, height: 1000 });
      await page.evaluate(() => document.documentElement.style.fontSize = '16px');
      assert.match(await figure('P02').innerText(), /graph that was never recorded/);
      assert.match(await figure('P04').innerText(), /A: target 2 ← predictor 1/);
      assert.match(await figure('P07').innerText(), /Zero rate preserves/);
      assert.match(await figure('P17').innerText(), /exactly zero prompt gradient/);
      await check('P17', 'Use bidirectional visibility instead', true);
      assert.match(await figure('P17').innerText(), /path is allowed/);
      assert.match(await figure('P21').innerText(), /\[1, 4, 57, 32\]/);
      assert.match(await figure('P23').innerText(), /selected step stays 50/);
      for (const method of ['input', 'encoder-mlp', 'encoder-lstm', 'prefix-direct', 'prefix-projected']) {
        await select('P20', 'Native method', method);
        await select('P21', 'Executed method', method);
        await page.waitForFunction(() => document.querySelectorAll('.soft-flow .soft-observation-state').length === 0);
        assert.match(await figure('P20').innerText(), /Base tensors exact after the diagnostic update: true/);
      }
      report.interactions.push('All 26 changed/null states at three sizes; five native routes and causal/bidirectional branch');
      await figure('P07').getByRole('button', { name: 'Reset', exact: true }).click();
      const range = figure('P07').getByRole('slider');
      await range.focus(); await range.press('ArrowRight'); assert.equal(await range.inputValue(), '0.25');
      report.interactions.push('Keyboard range step and deterministic Reset');
      const blocks = page.locator('.soft-flow .lesson-code-source');
      assert.equal(await blocks.count(), 11);
      for (const block of await blocks.all()) {
        await block.scrollIntoViewIfNeeded(); await block.locator('pre').waitFor({ timeout: 30000 });
        const name = await block.locator('.lesson-code__filename').innerText();
        const expected = fs.readFileSync('public/learn-code/p-tuning/' + name, 'utf8');
        await block.getByRole('button', { name: 'Copy ' + name, exact: true }).click();
        assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
        assert.match(await block.getByRole('button', { name: 'Copy ' + name, exact: true }).innerText(), /Copied/);
        const event = page.waitForEvent('download');
        await block.getByRole('link', { name: 'Download ' + name, exact: true }).click();
        assert.equal(fs.readFileSync(await (await event).path(), 'utf8'), expected);
        report.interactions.push('Exact Copy/Download ' + name);
      }
      let fail = true;
      await page.route('**/learn-assets/p-tuning-soft-prompt-methods/observations.json', route => fail ? route.abort() : route.continue());
      await page.route('**/learn-code/p-tuning/soft_attention.py', route => fail ? route.abort() : route.continue());
      await page.reload({ waitUntil: 'domcontentloaded' });
      await figure('P24').getByRole('button', { name: 'Retry observation' }).waitFor();
      const first = page.locator('.soft-flow .lesson-code-source').first();
      await first.scrollIntoViewIfNeeded(); await first.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      await shot('failure-code-source', first);
      await shot('failure-observation', figure('P24'));
      fail = false;
      for (const id of ['P22', 'P23', 'P24', 'P25']) await figure(id).getByRole('button', { name: 'Retry observation' }).click();
      await first.getByRole('button', { name: 'Retry', exact: true }).click();
      await first.locator('pre').waitFor(); await ready();
      report.interactions.push('Actual source/observation network failure and successful Retry');
      const archive = await page.request.get(base + '/learn-code/p-tuning/p-tuning.zip');
      assert.equal(archive.status(), 200);
      assert.deepEqual(await archive.body(), fs.readFileSync('public/learn-code/p-tuning/p-tuning.zip'));
      report.interactions.push('Exact complete archive GET bytes');
      const event = page.waitForEvent('download');
      await page.locator('.soft-flow a[href="/learn-code/p-tuning/p-tuning.zip"]').first().click();
      const download = await event;
      const failure = await download.failure();
      report.archiveNative = failure ? { status: 'canceled', failure } : { status: 'passed' };
      if (!failure) assert.deepEqual(fs.readFileSync(await download.path()), fs.readFileSync('public/learn-code/p-tuning/p-tuning.zip'));
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.warnings, []);
    report.after = hashes(); assert.deepEqual(report.after, report.before);
    report.status = 'passed';
    console.log(JSON.stringify({ status: report.status, captures: report.captures.length, layouts: report.layouts,
      interactions: report.interactions, archiveNative: report.archiveNative }));
  } catch (error) { report.status = 'failed'; report.failure = error.stack; throw error; }
  finally {
    report.at = new Date().toISOString();
    fs.writeFileSync(path.join(output, `browser-report-${Date.now()}.json`), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
