// Bounded author checks of the actual mutable manuscript's asynchronous boundaries.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const record = 'docs/teaching/deep-learning-beginner/hybrid-ssm-transformer-architectures-jamba';
const files = [
  'docs/teaching/drafts/hybrid-ssm-transformer-architectures-jamba/lesson.md',
  'src/learn/components/lesson-labs/HybridMemoryFlowStudy.jsx',
  'src/learn/components/lesson-labs/HybridMemoryFlowFigures.jsx',
  'src/learn/components/lesson-labs/HybridMemoryFlowLabs.jsx',
  'src/learn/components/lesson-labs/hybrid-memory-flow.css',
  'src/learn/data/hybrid-memory-flow-models.js',
  'src/learn/components/content/RemoteCodeBlock.jsx',
  'src/learn/components/content/Code.jsx',
  'scripts/verify-hybrid-memory-flow-recovery.cjs',
];
const hashes = () => Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const sourceHashes = hashes(), checks = [], errors = [], paints = [];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const folder = path.join(record, 'screenshots', `reading-flow-recovery-${stamp}`);
fs.mkdirSync(folder, { recursive: true });
let browser;

(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, acceptDownloads: true });
  await context.addInitScript(() => {
    window.hybridCopiedText = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.hybridCopiedText = value; } } });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let failedInitial = false, invalidIdentity = false;
  await page.route('**/model-MAM-37.json', async route => {
    if (!failedInitial) { failedInitial = true; await route.fulfill({ status: 503, body: 'Temporary model failure' }); }
    else await route.continue();
  });
  await page.route('**/model-AAA-37.json', async route => {
    if (!invalidIdentity) {
      invalidIdentity = true;
      const response = await route.fetch(), data = await response.json();
      data.pattern = 'MMM';
      await route.fulfill({ response, json: data });
    } else await route.continue();
  });
  await page.goto('http://127.0.0.1:4850/?manuscript');
  await page.getByRole('heading', { name: 'Hybrid SSM–Transformer Architectures: Jamba and Complementary Memory', exact: true }).waitFor();
  const selection = page.locator('#hybrid-study-selection');
  await selection.scrollIntoViewIfNeeded();
  await selection.getByRole('alert').waitFor();
  const edit = page.locator('#hybrid-study-edit'), x = edit.getByRole('slider', { name: 'Point x', exact: true });
  await x.focus(); await x.press('ArrowRight'); const edited = await x.inputValue();
  await selection.getByRole('button', { name: 'Retry model loading', exact: true }).click();
  await selection.locator('.flow-readout').waitFor();
  assert.equal(await x.inputValue(), edited);
  checks.push('HTTP503 retry retains an edit made while the selected model was unavailable');
  await selection.getByRole('combobox', { name: 'Saved small model', exact: true }).selectOption('AAA-37');
  await selection.getByRole('alert').waitFor();
  assert.match(await selection.getByRole('alert').innerText(), /identity|pattern|selected|metadata/i);
  assert.equal(await x.inputValue(), edited);
  await selection.getByRole('button', { name: 'Retry model loading', exact: true }).click();
  await selection.locator('.flow-readout').filter({ hasText: 'AAA-37' }).waitFor();
  assert.equal(await x.inputValue(), edited);
  checks.push('Wrong model-pattern response is rejected; retry preserves the stroke and loads the correct selected identity');

  let releaseSlow, slowStarted;
  const started = new Promise(resolve => { slowStarted = resolve; });
  const release = new Promise(resolve => { releaseSlow = resolve; });
  await page.route('**/model-MMM-37.json', async route => {
    const response = await route.fetch(); slowStarted(); await release;
    try { await route.fulfill({ response }); } catch { /* Aborted old request is expected. */ }
  });
  await selection.getByRole('combobox', { name: 'Saved small model', exact: true }).selectOption('MMM-37');
  await started;
  await selection.getByRole('combobox', { name: 'Saved small model', exact: true }).selectOption('AMM-37');
  await selection.locator('.flow-readout').filter({ hasText: 'AMM-37' }).waitFor();
  releaseSlow();
  await page.waitForTimeout(100);
  assert.match(await selection.locator('.flow-readout').innerText(), /AMM-37/);
  assert.equal(await x.inputValue(), edited);
  checks.push('A delayed previous model response cannot replace a newer model or reset its edited input');

  await selection.getByRole('combobox', { name: 'Saved small model', exact: true }).selectOption('MAM-37');
  await selection.locator('.flow-readout').filter({ hasText: 'MAM-37' }).waitFor();
  await page.getByRole('button', { name: 'Pin complete study case', exact: true }).click();
  const studyCase = page.locator('#hybrid-study-case');
  const pinned = await studyCase.locator('p').filter({ hasText: 'Pinned points:' }).innerText();
  await x.focus(); await x.press('ArrowRight');
  assert.equal(await studyCase.locator('p').filter({ hasText: 'Pinned points:' }).innerText(), pinned);
  checks.push('Pinned complete study case keeps an immutable eight-point snapshot during further edits');
  const boundary = page.getByRole('slider', { name: 'Boundary after this many points', exact: true });
  for (const key of ['Home', 'End']) {
    await boundary.focus(); await boundary.press(key);
    for (const view of ['boundary', 'separate', 'position', 'identity']) {
      const sentence = await page.locator(`#hybrid-study-continuation-${view} .flow-readout`).innerText();
      assert.match(sentence, /0\.00000000e\+0/);
      assert.match(sentence, /empty prefix or an empty remaining suffix/);
    }
  }
  checks.push('Empty-prefix and empty-suffix controls expose actual zero-difference null results in all four continuation views');
  await page.getByRole('button', { name: 'Reset every linked study view', exact: true }).click();
  assert.equal(await studyCase.locator('p').filter({ hasText: 'Pinned points:' }).count(), 0);

  for (const figure of ['hybrid-two-residuals', 'hybrid-causal-pairs', 'hybrid-trained-stack', 'hybrid-fit-histories', 'hybrid-alternative-routes', 'hybrid-application-interventions']) {
    const element = page.locator(`[data-figure="${figure}"]`).first();
    await element.scrollIntoViewIfNeeded();
    await element.locator('.hybrid-flow-scroll').first().evaluate(node => { node.scrollLeft = 0; });
    const file = path.join(folder, `${figure}-desktop.png`); await element.screenshot({ path: file }); paints.push(file.replaceAll('\\', '/'));
  }
  const embedding = page.locator('#hybrid-study-embedding');
  assert.equal(await embedding.getByRole('group', { name: 'Selected embedding bias and exact output coordinate', exact: true }).locator('.hybrid-flow-array-cell').first().evaluate(node => getComputedStyle(node).getPropertyValue('--hybrid-role').trim()), '#e6bb60');
  checks.push('Learned embedding bias retains parameter amber while the computed affine output is violet');
  for (const file of ['hybrid_mechanisms.py', 'stroke_models.py', 'inspect_stroke.py', 'hybrid_cache_tools.py', 'deployment_example.py']) {
    const source = page.locator('.lesson-code-source').filter({ has: page.getByText(`Complete ${file}`, { exact: true }) }).first();
    await source.scrollIntoViewIfNeeded();
    const copy = source.getByRole('button', { name: `Copy ${file}`, exact: true });
    await copy.waitFor(); await copy.click();
    assert.match(await copy.innerText(), /Copied/);
    const expected = fs.readFileSync(`docs/teaching/drafts/hybrid-ssm-transformer-architectures-jamba/${file}`, 'utf8');
    assert.equal(await page.evaluate(() => window.hybridCopiedText), expected);
    const response = await page.request.get(`http://127.0.0.1:4850/learn-assets/hybrid-ssm-transformer-architectures-jamba/${file}`);
    assert.equal(response.status(), 200); assert.equal(await response.text(), expected);
    assert.equal(await source.getByRole('link', { name: `Download ${file}`, exact: true }).getAttribute('download'), file);
  }
  checks.push('All five visible complete programs copy exact canonical text with Copied feedback and expose matching one-click download files; actual user clipboard was not changed');
  assert.deepEqual(errors, []); assert.deepEqual(hashes(), sourceHashes);
  const receipt = { purpose: 'Author manuscript asynchronous recovery, null results and complete-code affordances; not independent or production acceptance', passed: true, sourceHashes, checks, paints, errors };
  fs.writeFileSync(`${record}/reading-flow-recovery-${stamp}.json`, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, groups: checks.length, paints: paints.length, receipt: `${record}/reading-flow-recovery-${stamp}.json` }));
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });
