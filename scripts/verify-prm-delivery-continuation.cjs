const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const directory = path.join(base, process.argv[2] || 'browser-delivery-continuation');
fs.mkdirSync(path.join(directory, 'screenshots'), { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const predecessor = JSON.parse(fs.readFileSync(path.join(base, 'browser-final-interactions/report.json')));
const bindings = predecessor.bindings.map(file => ({ ...file, sha256: hash(fs.readFileSync(file.path)) }));
const checks = [], images = [], errors = [];
const network = [];
function check(name, condition, actual) {
  checks.push({ name, passed: Boolean(condition), actual });
  if (!condition) throw Error(name + ': ' + JSON.stringify(actual));
}
async function capture(locator, name, page) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement?.blur());
  const file = path.join(directory, 'screenshots', name + '.png');
  await locator.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
  images.push({ path: 'screenshots/' + name + '.png', sha256: hash(fs.readFileSync(file)) });
}
(async () => {
  const diagnosticFlags = process.argv.includes('--local-zip-diagnostic') ? ['--safebrowsing-disable-download-protection'] : [];
  const channel = process.argv.includes('--chrome') ? 'chrome' : 'msedge';
  const browser = await chromium.launch({ channel, headless: true, args: diagnosticFlags });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => network.push({ url: request.url(), failed: request.failure() }));
  page.on('response', response => {
    if (response.url().includes('prm-programs-data.zip')) network.push({ url: response.url(), status: response.status(), headers: response.headers() });
  });
  let failure, downloadFailure = null, responseDetails;
  try {
    for (const file of predecessor.bindings.filter(file => !file.path.endsWith('/PRMFlow.jsx'))) check('Predecessor source conserved ' + file.path, hash(fs.readFileSync(file.path)) === file.sha256);
    const conservation = JSON.parse(fs.readFileSync(base + '/runtime-tree-closure/conservation.json'));
    check('Only two search figures differ from predecessor', conservation.passed && conservation.current.sha256 === bindings[0].sha256 && conservation.predecessor.sha256 === predecessor.bindings[0].sha256);
    check('Predecessor contains 206 passed conditions', predecessor.checks.length === 206 && predecessor.checks.every(item => item.passed));
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    const url = '/learn-code/process-reward-models/prm-programs-data.zip';
    const response = await page.request.get('http://127.0.0.1:4250' + url);
    const actualBytes = await response.body();
    const expectedBytes = fs.readFileSync('public' + url);
    responseDetails = { status: response.status(), contentType: response.headers()['content-type'], length: actualBytes.length, sha256: hash(actualBytes) };
    check('Served archive is exact actual ZIP', response.ok() && hash(actualBytes) === hash(expectedBytes), responseDetails);
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
    const archive = page.locator('a[href="' + url + '"]').first();
    if (process.argv.includes('--explicit-filename')) await archive.evaluate(node => node.download = 'prm-programs-data.zip');
    const [download] = await Promise.all([page.waitForEvent('download'), archive.click()]);
    downloadFailure = await download.failure();
    if (downloadFailure === null) check('Browser archive download exact bytes', hash(fs.readFileSync(await download.path())) === hash(expectedBytes));
    check('Index exposes all 23 entries', await page.locator('.prm-file-index li a').count() === 23);
    await page.locator('.prm-file-index summary').click();
    await capture(page.locator('.prm-file-index'), 'desktop-file-index', page);
    await page.setViewportSize({ width: 390, height: 1000 });
    const practices = page.locator('[data-lesson-exercise]');
    check('All fourteen transfer practices mounted', await practices.count() === 14);
    for (let i = 0; i < await practices.count(); i++) {
      const solution = practices.nth(i).locator('details').nth(1);
      await solution.locator('summary').click();
      await capture(practices.nth(i), `phone-practice-${i + 1}`, page);
      check(`Practice ${i + 1} complete solution visible`, (await solution.innerText()).length > 70);
    }
    check('Phone document does not overflow', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    check('No runtime exceptions', errors.length === 0, errors);
    for (const file of bindings) check('Current source conserved ' + file.path, hash(fs.readFileSync(file.path)) === file.sha256);
    check('Browser archive download completes', downloadFailure === null, downloadFailure);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), channel, temporaryFilenameDiagnostic: process.argv.includes('--explicit-filename'), failure: failure || null, diagnosticFlags, downloadFailure, responseDetails, network, checks, images, bindings, predecessor: { path: base + '/browser-final-interactions/report.json', sha256: hash(fs.readFileSync(path.join(base, 'browser-final-interactions/report.json'))), passedConditions: predecessor.checks.length, qualification: 'Whole predecessor campaign stopped at canceled ZIP download; its earlier 206 successful source-bound conditions are conserved, not renamed a passing whole campaign.' }, errors };
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, downloadFailure, failure }));
  if (failure) process.exitCode = 1;
})();
