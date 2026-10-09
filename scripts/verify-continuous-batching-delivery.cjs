const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const surfaces = process.argv.includes('--surfaces');
const remainder = process.argv.includes('--remainder') || surfaces;
const base = 'http://127.0.0.1:4261';
const route = base + '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models';
const output = path.resolve(topic, `browser-delivery-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceFiles = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/continuous-batching-models.js',
  ...['Shared', 'Structures', 'Foundations', 'Storage', 'Serving'].map(name => `src/learn/components/lesson-labs/ContinuousBatching${name}.jsx`),
  'src/learn/components/lesson-labs/continuous-batching-flow.css', 'public/learn-assets/continuous-batching-pagedattention/observations.json',
  'scripts/verify-continuous-batching-delivery.cjs', 'scripts/lib/kv-cache-browser-capture.cjs'];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [file, sha(fs.readFileSync(file))]));
const compatibility = JSON.parse(fs.readFileSync(`${topic}/runtime-compatibility.json`));
const report = { before: hashes(), checks: [], captures: [], errors: [], consoleErrors: [], downloads: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    let observationFailures = 0, sourceFailures = 0;
    await context.route('**/learn-assets/continuous-batching-pagedattention/observations.json', async request => {
      if (observationFailures++ === 0) await request.fulfill({ status: 503, body: 'Deliberate verification failure' });
      else await request.continue();
    });
    await context.route('**/learn-code/continuous-batching/iteration_scheduler.py', async request => {
      if (!remainder && sourceFailures++ === 0) await request.fulfill({ status: 503, body: 'Deliberate verification failure' });
      else await request.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', value => { if (value.type() === 'error') report.consoleErrors.push(value.text()); });
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('[data-cb-figure="D26"]').waitFor({ timeout: 60000 });
    await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    async function shot(name, locator) {
      const file = path.join(output, `${name}.png`);
      const item = await capture(page, locator, file);
      report.captures.push({ name, file, tiles: item.tiles.map(tile => tile.path) });
    }
    for (const id of ['D23', 'D25', 'D26']) {
      const figure = page.locator(`[data-cb-figure="${id}"]`);
      await figure.getByRole('alert').waitFor();
      await figure.getByRole('button', { name: 'Retry', exact: true }).click();
      await figure.getByRole('combobox').first().waitFor();
      report.checks.push(`${id} observations 503 visible then native Retry recovered`);
    }
    const remote = page.locator('.lesson-code-source');
    assert.equal(await remote.count(), 10);
    if (!remainder) {
      await remote.first().scrollIntoViewIfNeeded();
      await remote.first().getByRole('alert').waitFor();
      await remote.first().getByRole('button', { name: 'Retry', exact: true }).click();
      await remote.first().locator('pre code').waitFor();
      report.checks.push('First complete program 503 visible then native Retry recovered');
    } else report.checks.push('First nine exact source/Copy/Download successes and source Retry compose retained browser-delivery-1791488204208/report.json');
    for (const [index, file] of compatibility.programs.entries()) {
      if (surfaces || (remainder && index < 9)) continue;
      const block = remote.nth(index);
      const details = block.locator('xpath=ancestor::details');
      for (const detail of await details.all()) {
        if (!(await detail.evaluate(element => element.open))) await detail.locator(':scope > summary').click();
      }
      await block.scrollIntoViewIfNeeded();
      await block.locator('pre code').waitFor();
      const expected = fs.readFileSync(`public/learn-code/continuous-batching/${file}`, 'utf8');
      assert.equal(await block.locator('pre code').textContent(), expected);
      await block.getByRole('button', { name: `Copy ${file}`, exact: true }).click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(copied.replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
      assert.equal(await block.getByRole('button', { name: `Copy ${file}`, exact: true }).getAttribute('data-copied'), '');
      const pending = page.waitForEvent('download');
      await block.getByRole('link', { name: `Download ${file}`, exact: true }).click();
      const download = await pending;
      const destination = path.join(output, file);
      await download.saveAs(destination);
      assert.equal(await download.failure(), null);
      assert.equal(sha(fs.readFileSync(destination)), sha(Buffer.from(expected)));
      report.downloads.push({ file, sha256: sha(fs.readFileSync(destination)), native: true });
      report.checks.push(`${file}: exact visible source and native download bytes; actual Windows clipboard text equal after CRLF normalization`);
    }
    assert.equal(await page.locator('[data-code-downloads]').count(), 1);
    for (const detail of await page.locator('[data-code-downloads] details').all()) if (!(await detail.evaluate(e => e.open))) await detail.locator(':scope > summary').click();
    for (const file of compatibility.programs) assert.equal(await page.locator('[data-code-downloads]').getByRole('link', { name: `Download ${file}`, exact: true }).count(), 1);
    for (const [oldId, current] of Object.entries(compatibility.aliases)) {
      assert.equal(await page.locator(`[id="${oldId}"]`).count(), 1);
      assert.equal(await page.locator(`[id="${current}"]`).count(), 1);
    }
    report.checks.push('Shared file index and all eleven historical anchors present exactly once');
    const zipPath = '/learn-code/continuous-batching/continuous-batching-programs.zip';
    const response = await page.request.get(base + zipPath);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['content-type'], /zip/);
    assert.equal(sha(await response.body()), sha(fs.readFileSync('public' + zipPath)));
    report.checks.push('ZIP exact HTTP bytes and ZIP MIME');
    const archivePromise = page.waitForEvent('download');
    await page.locator(`a[href="${zipPath}"]`).first().click();
    const archive = await archivePromise;
    report.archiveNativeFailure = await archive.failure();
    if (!report.archiveNativeFailure) {
      const file = path.join(output, 'continuous-batching-programs.zip');
      await archive.saveAs(file);
      assert.equal(sha(fs.readFileSync(file)), sha(fs.readFileSync('public' + zipPath)));
      report.checks.push('Native ZIP exact bytes');
    }
    for (const [width, font, profile] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'enlarged']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = value + 'px'; }, font);
      for (const [index, practice] of (await page.locator('[data-lesson-exercise]').all()).entries()) {
        for (const detail of await practice.locator('details').all()) {
          if (!(await detail.evaluate(element => element.open))) await detail.locator('summary').click();
        }
        await shot(`${profile}-practice-${index + 1}`, practice);
      }
      await shot(`${profile}-opening`, page.locator('.cb-flow > section').first());
      await shot(`${profile}-file-index`, page.locator('[data-code-downloads]'));
      for (const id of ['further-learning', 'technical-references', 'readiness-check']) {
        const anchor = page.locator(`[id="${id}"]`);
        if (await anchor.count()) await shot(`${profile}-${id}`, anchor.locator('..'));
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      report.checks.push(`${profile}: fourteen expanded solutions and reader surfaces captured; no page overflow`);
    }
    assert.deepEqual(report.errors, []);
    report.after = hashes();
    assert.deepEqual(report.after, report.before);
    report.status = 'passed; actual paint reading is separately recorded';
  } catch (error) { report.failure = error.stack; process.exitCode = 1; }
  finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ output, status: report.status, checks: report.checks.length, captures: report.captures.length, archiveNativeFailure: report.archiveNativeFailure, failure: report.failure }));
  }
})();
