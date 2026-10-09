const captureObject = require('./lib/rlvr-browser-capture.cjs');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const directory = path.join(topic, process.argv[2] || 'browser-delivery');
fs.mkdirSync(path.join(directory, 'screenshots'), { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bindings = ['src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx', 'src/learn/components/lesson-labs/rlvr-flow.css', 'src/learn/data/rlvr-models.js', topic + '/lesson.jsx', topic + '/lesson.md'].map(file => ({ path: file, sha256: hash(fs.readFileSync(file)) }));
const checks = [], images = [], runtimeErrors = [], expectedHttpErrors = [];
function check(name, passed, actual) {
  checks.push({ name, passed: !!passed, actual });
  if (!passed) throw Error(name + ': ' + JSON.stringify(actual));
}
async function image(page, locator, name) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement?.blur());
  const file = path.join(directory, 'screenshots', name + '.png');
  await captureObject(page, locator, file);
  images.push({ path: 'screenshots/' + name + '.png', sha256: hash(fs.readFileSync(file)) });
}
const url = 'http://127.0.0.1:4254/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1366, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => runtimeErrors.push(error.message));
  let failure = null;
  try {
    await page.request.get('http://127.0.0.1:4254/__llm_refresh');
    await page.goto(url, { timeout: 90000 });
    await page.locator('[data-rlvr-figure="D39"]').waitFor({ timeout: 90000 });
    const programs = ['math_verify_bridge.py','verifier_contracts.py','group_gradients.py','reward_noise.py','causal_backbone.py','rlvr_data.py','tiny_causal_rlvr.py','evaluate_rollouts.py','hf_eval_math.py','trl_bridge.py','adamw_step_audit.py','scientific_journal.py','run_all.py'];
    if (!process.argv.includes('--remaining')) for (const filename of programs) {
      const code = page.locator('.lesson-code-source').filter({ has: page.locator(`a[href="/learn/examples/rlvr/${filename}"]`) });
      await code.scrollIntoViewIfNeeded();
      await code.locator('pre code').waitFor({ timeout: 90000 });
      const expected = fs.readFileSync('public/learn/examples/rlvr/' + filename);
      check('Complete visible canonical program ' + filename, await code.locator('pre code').textContent() === expected.toString('utf8'));
      await code.getByRole('button', { name: 'Copy ' + filename, exact: true }).click();
      await code.locator('[data-copied]').waitFor();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      check('Actual Windows clipboard exact except CRLF transport ' + filename, copied.replace(/\r\n/g, '\n') === expected.toString('utf8').replace(/\r\n/g, '\n'));
      await image(page, code.locator('.lesson-code__toolbar'), 'copied-' + filename);
      const [download] = await Promise.all([page.waitForEvent('download'), code.getByRole('link', { name: 'Download ' + filename, exact: true }).click()]);
      check('Native download completes ' + filename, await download.failure() === null);
      check('Native downloaded bytes exact ' + filename, hash(fs.readFileSync(await download.path())) === hash(expected));
    }
    const index = page.locator('[data-code-downloads]');
    const manifest = JSON.parse(fs.readFileSync('public/learn/examples/rlvr/download-manifest.json'));
    for (const entry of [...Object.keys(manifest.programs.entries).map(path=>({path})),...['rlvr-programs.zip','rlvr-observations.zip','download-manifest.json'].map(path=>({path}))]) {
      const filename = entry.path || entry.filename || entry.name;
      check('Shared supporting file index ' + filename, await index.locator(`a[href="/learn/examples/rlvr/${filename}"]`).count() === 1);
    }
    const archive = await page.request.get('http://127.0.0.1:4254/learn/examples/rlvr/rlvr-programs.zip');
    check('Archive HTTP exact bytes (distinct from native ZIP cancellation)', archive.ok() && hash(await archive.body()) === hash(fs.readFileSync('public/learn/examples/rlvr/rlvr-programs.zip')));
    const rawArchive = await page.request.get('http://127.0.0.1:4254/learn/examples/rlvr/rlvr-observations.zip');
    check('Complete raw observations archive HTTP exact bytes',rawArchive.ok() && hash(await rawArchive.body())===hash(fs.readFileSync('public/learn/examples/rlvr/rlvr-observations.zip')));
    await page.setViewportSize({ width: 390, height: 1000 });
    await image(page, index, 'phone-shared-file-index');
    const exercises = page.locator('[data-lesson-exercise]');
    check('Fourteen independent transfer practices', await exercises.count() === 14);
    for (let i = 0; i < 14; i++) {
      const exercise = exercises.nth(i), solution = exercise.locator('details').nth(1);
      await solution.locator('summary').click();
      check(`Practice ${i + 1} complete visible solution`, (await solution.innerText()).length > 80);
      await image(page, exercise, 'phone-practice-' + (i + 1));
    }
    const projection = JSON.parse(fs.readFileSync(topic + '/runtime-projection.json'));
    for (const alias of [...projection.historicalAliases, '11-self-check-exercises']) check('Historical rendered fragment ' + alias, await page.locator(`[id="${alias}"]`).count() === 1);
    check('Phone delivery/practice stays inside reader', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    await page.close();
    for (const kind of ['code','observation']) {
      const recovery = await context.newPage();
      recovery.on('pageerror', error => runtimeErrors.push(error.message));
      recovery.on('console', message => { if (message.type() === 'error') expectedHttpErrors.push(message.text()); });
      let failedOnce = false;
      const resource = kind === 'code' ? '**/rlvr/rlvr_data.py' : '**/learn-assets/rlvr/records.json';
      await recovery.route(resource, async route => {
        if (!failedOnce) { failedOnce = true; await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Deliberate recovery probe' }); }
        else await route.continue();
      });
      await recovery.goto(url, { timeout: 90000 });
      const target = kind === 'code' ? recovery.locator('.lesson-code-source').filter({ has: recovery.locator('a[href="/learn/examples/rlvr/rlvr_data.py"]') }) : recovery.locator('[data-rlvr-figure="D27"]');
      await target.scrollIntoViewIfNeeded();
      const retry = target.getByRole('button', { name: kind === 'code' ? 'Retry' : 'Retry observations', exact: true });
      await retry.waitFor({ timeout: 90000 });
      check(kind + ' actual 503 unknown/retry state', failedOnce && /could not load|unavailable/i.test(await target.innerText()));
      await image(recovery, kind === 'code' ? target : target.locator('.rlvr-data-view').first(), kind + '-failed');
      await retry.click();
      if (kind === 'code') await target.locator('pre code').waitFor({ timeout: 90000 });
      else await target.locator('select').first().waitFor({ timeout: 90000 });
      check(kind + ' retry restores actual content', await retry.count() === 0);
      await image(recovery, kind === 'code' ? target.locator('.lesson-code__toolbar') : target, kind + '-recovered');
      await recovery.close();
    }
    check('No runtime exceptions', runtimeErrors.length === 0, runtimeErrors);
    for (const binding of bindings) check('Source unchanged ' + binding.path, hash(fs.readFileSync(binding.path)) === binding.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, failure, at: new Date().toISOString(), bindings, checks, images, runtimeErrors, expectedHttpErrors, archiveQualification: 'Exact served ZIP checked. Existing shared automated native ZIP cancellation remains unresolved; no security-flag diagnostic and no archive-download success claim.', mode: process.argv.includes('--remaining')?'remaining supporting/practice/recovery; canonical delivery conserved from browser-delivery-current':'complete', canonicalDeliveryPredecessor: process.argv.includes('--remaining')?'browser-delivery-current/report.json':null, scope: 'Thirteen full canonical programs: real Copy feedback/clipboard/native exact downloads; shared file index;14 solutions;historical aliases; actual code/observation503/retry. No science repeated.' };
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
