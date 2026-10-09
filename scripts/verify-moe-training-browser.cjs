const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4250';
const folder = 'docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const output = path.resolve(folder, 'browser-evidence');
const route = '/learn/path/full-curriculum/moe-training-expert-load-balancing?module=large-language-models';
const figures = Array.from({ length: 21 }, (_, index) => `M${String(index + 1).padStart(2, '0')}`);
const sources = [
  `${folder}/lesson.jsx`, `${folder}/lesson.md`,
  'src/learn/components/lesson-labs/MoeTrainingFlow.jsx',
  'src/learn/components/lesson-labs/moe-training-flow.css',
  'src/learn/data/moe-training-models.js', 'src/learn/data/moe-training-study.json',
  'public/learn-assets/moe-training/model.json', 'scripts/verify-moe-training-browser.cjs',
  ...['mechanisms', 'torch', 'language_study', 'transformers', 'systems'].map(name => `public/learn-code/moe-training/moe_${name}.py`),
];
const hashes = () => Object.fromEntries(sources.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync(output, { recursive: true });

(async () => {
  const before = hashes(), errors = [], warnings = [], captures = [], layouts = [], interactions = [];
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { before, base, route, errors, warnings, captures, layouts, interactions };
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 },
      permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /validateDOMNesting|cannot be a|cannot contain|title.*children|unique.*key/i.test(message.text())) warnings.push(message.text());
    });
    await page.request.get(base + '/__llm_refresh');
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
    assert.equal(response.status(), 200);
    await page.locator('[data-moe-figure="M21"]').waitFor({ timeout: 60000 });
    await page.locator('[data-moe-figure="M15"] input').waitFor({ timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('[data-moe-figure]').count(), 21);
    assert.equal(await page.locator('[data-lesson-exercise]').count(), 12);
    const item = id => page.locator(`[data-moe-figure="${id}"]`);
    const shot = async (name, element) => {
      await element.scrollIntoViewIfNeeded();
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      const file = name + '.png';
      await element.screenshot({ path: path.join(output, file), style: '.site-header--learn,.site-skip { visibility:hidden!important; }' });
      captures.push(file);
    };
    await page.screenshot({ path: path.join(output, 'reader-opening.png') });
    captures.push('reader-opening.png');
    const requested = process.argv.find(value => value.startsWith('--figures='));
    const selected = requested ? requested.slice(10).split(',') : figures;
    for (const [width, font, label] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
      for (const id of selected) await shot(`${requested ? 'delta-' : ''}${label}-${id}`, item(id));
      const layout = await page.evaluate(() => ({
        viewport: innerWidth, width: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll('.moe-training-flow *')].filter(element => {
          const bounds = element.getBoundingClientRect();
          return bounds.right > innerWidth + 1 && !element.closest('.moet-scroll,.moet-equation,.lesson-code-source,.lesson-code');
        }).slice(0, 12).map(element => ({ tag: element.tagName, className: String(element.className),
          text: element.textContent.slice(0, 100), right: element.getBoundingClientRect().right })),
      }));
      layouts.push({ label, ...layout });
      assert(layout.width <= layout.viewport + 1, `${label} page overflow: ${JSON.stringify(layout)}`);
    }
    if (!requested) {
      await page.setViewportSize({ width: 1366, height: 1000 });
      await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
      async function slider(id, label, value) {
        await item(id).getByRole('slider', { name: new RegExp(label) }).fill(String(value));
      }
      async function select(id, label, value) {
        await item(id).getByRole('combobox', { name: label, exact: true }).selectOption(String(value));
      }
      async function reset(id) {
        await item(id).getByRole('button', { name: 'Reset', exact: true }).click();
      }
      await select('M02', 'Gate convention', 'full');
      assert.match(await item('M02').innerText(), /1\.1429, 0\.8571/);
      await slider('M02', 'E2 logit', 2);
      await slider('M02', 'Requested experts', 1);
      await shot('changed-routing-full-top1', item('M02')); await reset('M02');
      await slider('M03', 'Second input', 0);
      await shot('null-swiglu-coordinate', item('M03')); await reset('M03');
      await select('M04', 'Changed graph', 'partial');
      assert.match(await item('M04').innerText(), /\[-0\.6667, 0\.6667, 0\]/);
      await shot('changed-rejected-denominator-gradient', item('M04'));
      await select('M04', 'Changed graph', 'dropped');
      assert.match(await item('M04').innerText(), /gradient \[0, 0, 0\]/);
      await select('M04', 'Changed graph', 'equal');
      await slider('M04', 'Requested k', 1);
      await select('M04', 'Weight rule', 'full');
      await shot('changed-full-softmax-top1', item('M04')); await reset('M04');
      await slider('M05', 'Slots per expert', 0);
      assert.match(await item('M05').innerText(), /8\/8 assignments rejected; 4\/4/);
      await shot('null-all-dropped-residual', item('M05'));
      await slider('M05', 'Slots per expert', 4);
      assert.match(await item('M05').innerText(), /0\/8 assignments rejected; 0\/4/);
      await select('M05', 'First-priority token', 3);
      await item('M05').getByRole('button', { name: /t3 requests/ }).click(); await reset('M05');
      await select('M06', 'Routed rows T', 32); await slider('M06', 'Selected k', 4); await slider('M06', 'Capacity factor', .5);
      await shot('changed-binomial-load', item('M06')); await reset('M06');
      await select('M07', 'Probability fixture', 'counterexample');
      assert.match(await item('M07').innerText(), /0\.88275/);
      await select('M07', 'Probability fixture', 'ties');
      await shot('changed-tied-hard-collapse', item('M07'));
      await slider('M07', 'First-row E0', -.5); await reset('M07');
      await slider('M08', 'Balance coefficient', 0);
      assert.match(await item('M08').innerText(), /undefined/);
      await slider('M08', 'z coefficient', .2); await shot('changed-objective-gradients', item('M08')); await reset('M08');
      await slider('M09', 'Common score shift', 2);
      assert.match(await item('M09').innerText(), /Squared z-loss = 4/);
      await shot('changed-z-shift', item('M09')); await reset('M09');
      await item('M10').getByRole('button', { name: /Middle row/ }).click();
      await item('M10').getByRole('button', { name: 'Contrasting rows', exact: true }).click();
      await shot('null-identical-groups', item('M10')); await reset('M10');
      await slider('M12', 'Bias update speed', 0); await slider('M12', 'Displayed batch', 11);
      await slider('M12', 'First-row E0 affinity', .3);
      await shot('null-bias-speed', item('M12')); await reset('M12');
      await slider('M13', 'Future competitor', .9);
      assert.match(await item('M13').innerText(), /Current row loses E0/);
      await shot('changed-future-competitor', item('M13')); await reset('M13');
      await select('M14', 'Refinement r', 3); await slider('M14', 'Shared experts', 2);
      await item('M14').getByRole('button', { name: /Perturb second copy/ }).click();
      await shot('changed-refined-shared-bank', item('M14')); await reset('M14');
      await slider('M15', 'Held-out target index', 0); await select('M15', 'Zero one expert contribution', 2);
      await shot('changed-saved-model-ablation', item('M15'));
      await slider('M15', 'Held-out target index', 1948); await reset('M15');
      await item('M16').getByRole('button', { name: /Router accounting/ }).click();
      assert.match(await item('M16').innerText(), /148 if padding/); await reset('M16');
      await select('M17', 'Displayed paired seed', 43);
      await shot('changed-measured-seed43', item('M17')); await reset('M17');
      await select('M18', 'Measured seed', 29); await select('M18', 'Measured policy', 'bias');
      await select('M18', 'Recorded checkpoint', 1);
      await shot('changed-recorded-history', item('M18')); await reset('M18');
      for (const name of [/E0 on rank/, /t2 requests/, /All-local comparison/]) await item('M19').getByRole('button', { name }).click();
      assert.match(await item('M19').innerText(), /payload 0 bytes/);
      await shot('null-local-transfers', item('M19')); await reset('M19');
      await select('M20', 'Rows per aligned block B', 1);
      await shot('null-row-alignment', item('M20')); await reset('M20');
      await item('M21').getByRole('button', { name: /E0 on rank/ }).click();
      await slider('M21', 'Assumed service', 3);
      await shot('changed-placement-work', item('M21')); await reset('M21');
      const keyboard = item('M09').getByRole('slider');
      await keyboard.focus(); await keyboard.press('ArrowRight'); assert.equal(await keyboard.inputValue(), '.25'.replace(/^\./, '0.'));
      await reset('M09');
      interactions.push('Every live control, changed/null fixtures, deterministic resets and native keyboard range');
      const blocks = page.locator('.lesson-code-source');
      assert.equal(await blocks.count(), 5);
      for (let index = 0; index < 5; index++) {
        const block = blocks.nth(index);
        await block.scrollIntoViewIfNeeded(); await block.locator('pre').waitFor({ timeout: 30000 });
        const filename = await block.locator('.lesson-code__filename').innerText();
        const expected = fs.readFileSync(`public/learn-code/moe-training/${filename}`, 'utf8');
        await block.getByRole('button', { name: `Copy ${filename}`, exact: true }).click();
        assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
        assert.match(await block.getByRole('button', { name: `Copy ${filename}`, exact: true }).innerText(), /Copied/);
        const pending = page.waitForEvent('download');
        await block.getByRole('link', { name: `Download ${filename}`, exact: true }).click();
        const download = await pending;
        assert.equal(fs.readFileSync(await download.path(), 'utf8'), expected);
        interactions.push(`Exact Copy/Download ${filename}`);
      }
      let fail = true;
      await page.route('**/learn-code/moe-training/moe_mechanisms.py', request => fail ? request.abort() : request.continue());
      await page.reload({ waitUntil: 'domcontentloaded' });
      const firstBlock = page.locator('.lesson-code-source').first();
      await firstBlock.scrollIntoViewIfNeeded(); await firstBlock.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      fail = false; await firstBlock.getByRole('button', { name: 'Retry', exact: true }).click(); await firstBlock.locator('pre').waitFor();
      interactions.push('Actual automatic program fetch failure and Retry');
    }
    assert.deepEqual(errors, []); assert.deepEqual(warnings, []);
    report.after = hashes(); assert.deepEqual(report.after, before, 'Source changed during browser campaign');
    report.status = 'passed';
    console.log(JSON.stringify({ captures: captures.length, layouts, interactions, errors, warnings }, null, 2));
  } catch (error) {
    report.status = 'failed'; report.failure = String(error.stack || error); throw error;
  } finally {
    report.at = new Date().toISOString();
    fs.writeFileSync(path.join(output, `${process.argv.some(value => value.startsWith('--figures=')) ? 'delta-' : ''}browser-report-${Date.now()}.json`), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
