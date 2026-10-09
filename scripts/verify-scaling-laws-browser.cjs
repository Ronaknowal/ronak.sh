const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4243';
const output = path.resolve('docs/teaching/llm-architecture-training/scaling-laws-kaplan-chinchilla-beyond/browser-evidence');
const route = '/learn/path/full-curriculum/scaling-laws-kaplan-chinchilla-beyond?module=large-language-models';
const figures = ['budget', 'power-law', 'decomposition', 'surface', 'allocation', 'balance', 'methods', 'empirical', 'identifiability', 'repeated-tokens', 'effective-resources', 'lifetime', 'hardware', 'metric'];
const sourceFiles = ['docs/teaching/llm-architecture-training/scaling-laws-kaplan-chinchilla-beyond/scaling-laws.jsx', 'src/learn/components/lesson-labs/ScalingLawsFlow.jsx', 'src/learn/components/lesson-labs/scaling-laws-flow.css', 'src/learn/data/scaling-laws-models.js', ...['scaling_allocation.py', 'fit_scaling.py', 'data_constrained.py', 'lifetime_compute.py', 'metric_sensitivity.py', 'fit-results.json', 'repetition-curve.csv', 'data-provenance.json', 'requirements.txt'].map(name => `public/learn-code/scaling-laws/${name}`)];
const sourceHashes = () => Object.fromEntries(sourceFiles.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync(output, { recursive: true });
(async () => {
  const sources = sourceHashes();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await context.newPage();
  const errors = [], captures = [], layouts = [];
  const svgTitleWarnings = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (/title.*children|children.*title/i.test(message.text())) svgTitleWarnings.push(message.text()); });
  await page.request.get(base + '/__llm_refresh');
  const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
  assert.equal(response.status(), 200);
  await page.locator('[data-scaling-figure="empirical"]').waitFor({ timeout: 60000 });
  if (process.argv.includes('--diagnose')) {
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.locator('[data-scaling-figure="decomposition"]').screenshot({ path: path.join(output, 'diagnose-bars.png') });
    console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && (!el.closest('.scaling-scroll,.scaling-math,.lesson-table-wrap,.lesson-code-source') || el.matches('.scaling-scroll,.scaling-math,.lesson-table-wrap,.lesson-code-source'))).slice(0, 35).map(el => ({ tag: el.tagName, cls: el.className, text: el.textContent.slice(0, 90), width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right, overflow: getComputedStyle(el).overflowX }))), null, 2));
    console.log(JSON.stringify(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('.scaling-laws-flow *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('.scaling-scroll,.scaling-math,.lesson-table-wrap,.lesson-code-source')).slice(0, 35).map(el => ({ tag: el.tagName, cls: el.className, text: el.textContent.slice(0, 90), width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })), bars: [...document.querySelectorAll('.scaling-cost-track i')].map(el => ({ html: el.outerHTML, rect: el.getBoundingClientRect().toJSON(), position: getComputedStyle(el).position, display: getComputedStyle(el).display, background: getComputedStyle(el).backgroundColor })) })), null, 2));
    await browser.close(); return;
  }
  const shot = async (name, selector) => {
    const item = page.locator(selector).first();
    await item.scrollIntoViewIfNeeded();
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    const file = `${name}.png`;
    await item.screenshot({ path: path.join(output, file), style: '.site-header--learn { visibility:hidden!important; }' });
    captures.push(file);
  };
  await page.screenshot({ path: path.join(output, 'reader-opening.png') });
  const bounded = process.argv.find(value => value.startsWith('--figures='));
  const selectedFigures = bounded ? bounded.slice(10).split(',') : figures;
  for (const [width, font, label] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
    for (const figure of selectedFigures) await shot(`${label}-${figure}`, `[data-scaling-figure="${figure}"]`);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    layouts.push({ label, ...dimensions });
    assert.ok(dimensions.width <= dimensions.viewport + 1, `${label} width ${dimensions.width}`);
  }
  if (bounded) {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
    if (selectedFigures.includes('metric')) {
      await page.getByRole('slider', { name: 'Per-token correctness p', exact: true }).fill('0.4');
      await shot('changed-finite-test', '[aria-label="Compare a continuous probability with exact-match and threshold scores"]');
      assert.match(await page.locator('[aria-label="Compare a continuous probability with exact-match and threshold scores"]').innerText(), /0.357264/);
      await page.getByRole('slider', { name: 'Answer length k', exact: true }).fill('1');
      await shot('changed-single-token', '[aria-label="Compare a continuous probability with exact-match and threshold scores"]');
      await page.getByRole('slider', { name: 'Per-token correctness p', exact: true }).fill('0');
      await shot('changed-zero-probability', '[aria-label="Compare a continuous probability with exact-match and threshold scores"]');
      assert.match(await page.locator('[aria-label="Compare a continuous probability with exact-match and threshold scores"]').innerText(), /100 items: 1/);
    }
    if (selectedFigures.includes('lifetime')) {
      await page.getByRole('slider', { name: 'Target fitted loss', exact: true }).fill('1.6');
      await page.getByRole('slider', { name: 'Candidate model (million)', exact: true }).fill('300');
      await shot('changed-feasible-lifetime-range', '[aria-label="Minimize lifetime compute at the same target loss"]');
      assert.match(await page.locator('[aria-label="Minimize lifetime compute at the same target loss"]').innerText(), /requires D=/);
    }
    const crypto = require('node:crypto');
    const sources = Object.fromEntries(['src/learn/components/lesson-labs/ScalingLawsFlow.jsx', 'src/learn/components/lesson-labs/scaling-laws-flow.css', 'src/learn/data/scaling-laws-models.js'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, `bounded-${selectedFigures.join('-')}-report.json`), JSON.stringify({ at: new Date().toISOString(), captures, layouts, errors, sources, scope: selectedFigures.includes('hardware') ? 'Explicit denominator grouping in the hardware arithmetic' : 'Adaptive metric histogram and complete feasible lifetime candidate domain' }, null, 2));
    await browser.close(); return;
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
  await page.getByRole('slider', { name: 'Model size N (million)', exact: true }).fill('1000');
  await shot('changed-budget-identical', '[aria-label="Keep training arithmetic fixed while choosing model size"]');
  assert.match(await page.locator('[aria-label="Keep training arithmetic fixed while choosing model size"]').innerText(), /coincides/);
  await page.getByRole('slider', { name: 'Power exponent α', exact: true }).fill('0');
  await page.getByRole('slider', { name: 'Fitted floor E', exact: true }).fill('0');
  await shot('changed-flat-power', '[aria-label="Inspect a power law on linear and logarithmic axes"]');
  assert.match(await page.locator('[aria-label="Inspect a power law on linear and logarithmic axes"]').innerText(), /no-improvement null/);
  await page.getByRole('button', { name: 'Hold N = 1', exact: true }).click();
  await page.getByRole('slider', { name: 'Alternative floor E', exact: true }).fill('2');
  await shot('changed-nonidentifiable', '[aria-label="Inspect what a resource experiment can identify"]');
  assert.match(await page.locator('[aria-label="Inspect what a resource experiment can identify"]').innerText(), /Rank is 3/);
  await page.getByRole('slider', { name: 'Corpus passes', exact: true }).fill('1');
  await shot('changed-one-pass', '[aria-label="Inspect smooth saturation of effective data and excess parameters"]');
  assert.match(await page.locator('[aria-label="Inspect smooth saturation of effective data and excess parameters"]').innerText(), /D_eff=U exactly/);
  await page.getByRole('button', { name: 'No serving', exact: true }).click();
  await shot('changed-no-serving', '[aria-label="Minimize lifetime compute at the same target loss"]');
  assert.match(await page.locator('[aria-label="Minimize lifetime compute at the same target loss"]').innerText(), /infeasible.*optima coincide/s);
  await page.getByRole('slider', { name: 'Answer length k', exact: true }).fill('1');
  await shot('changed-single-token', '[aria-label="Compare a continuous probability with exact-match and threshold scores"]');
  assert.match(await page.locator('[aria-label="Compare a continuous probability with exact-match and threshold scores"]').innerText(), /curves coincide/);
  await page.getByRole('slider', { name: 'Per-token correctness p', exact: true }).fill('0.4');
  await page.getByRole('slider', { name: 'Answer length k', exact: true }).fill('5');
  await shot('changed-finite-test', '[aria-label="Compare a continuous probability with exact-match and threshold scores"]');
  assert.match(await page.locator('[aria-label="Compare a continuous probability with exact-match and threshold scores"]').innerText(), /0.357264/);
  await page.getByRole('slider', { name: 'Compute multiple', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('slider', { name: 'Compute multiple', exact: true }).inputValue(), '1.5');
  const code = page.locator('.lesson-code-source');
  assert.equal(await code.count(), 5);
  for (let index = 0; index < 5; index++) {
    const block = code.nth(index);
    await block.scrollIntoViewIfNeeded();
    await block.locator('pre').waitFor();
    const filename = await block.locator('.lesson-code__filename').innerText();
    const expected = fs.readFileSync(path.join('public/learn-code/scaling-laws', filename), 'utf8');
    assert.ok((await block.locator('pre').innerText()).length > 1500);
    await block.getByRole('button', { name: `Copy ${filename}`, exact: true }).click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
    const event = page.waitForEvent('download');
    await block.getByRole('link', { name: `Download ${filename}`, exact: true }).click();
    const download = await event;
    assert.equal(fs.readFileSync(await download.path(), 'utf8'), expected);
  }
  for (const id of ['1-start-with-the-problem', '2-build-the-intuition', '3-make-the-idea-precise', '8-what-scales-and-what-doesn-t']) assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
  let fail = true;
  await page.route('**/learn-code/scaling-laws/fit-results.json', request => fail ? request.abort() : request.continue());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Retry fit data', exact: true }).waitFor();
  fail = false;
  await page.getByRole('button', { name: 'Retry fit data', exact: true }).click();
  await page.locator('[data-scaling-figure="empirical"]').waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(svgTitleWarnings, []);
  assert.deepEqual(sourceHashes(), sources, 'Sources changed during the campaign');
  const report = { at: new Date().toISOString(), base, route, sources, sourceIdentity: 'SHA256 captured before browser launch and verified unchanged at completion', captures, layouts, errors, svgTitleWarnings, programViews: 5, copiedSourceMatches: 5, exactDownloadedSources: 5, fetchFailureRecovery: true, keyboardSlider: true, capturePolicy: 'Ordinary opening preserved; isolated figures hide sticky header and blur active focus; native numerical evidence reused' };
  fs.writeFileSync(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exit(1); });
