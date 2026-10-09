const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback';
const output = process.env.RLHF_INTERACTION_OUTPUT || `${owner}/browser-interactions`;
const base = 'http://127.0.0.1:4250';
const url = `${base}/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models`;
const files = [`${owner}/manuscript.jsx`, 'src/learn/components/lesson-labs/RLHFFlow.jsx',
  'src/learn/components/lesson-labs/rlhf-flow.css', 'src/learn/data/rlhf-models.js',
  'src/learn/data/rlhf-observations.js', 'scripts/verify-rlhf-interactions.cjs'];
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if (fs.existsSync(`${output}/report.json`)) throw new Error('Use a fresh evidence directory.');
fs.mkdirSync(`${output}/screenshots`, { recursive: true });
fs.mkdirSync(`${output}/downloads`, { recursive: true });
const report = { status: 'running', sources: Object.fromEntries(files.map((file) => [file, hash(file)])),
  states: [], scrolls: [], practices: [], programs: [], errors: [] };
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks++; };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', (error) => report.errors.push(String(error)));
  const figure = (id) => page.locator(`[data-rlhf-figure="${id}"]`);
  const numeric = (id, label, value) => figure(id).getByRole('spinbutton', { name: label, exact: true }).fill(String(value));
  const select = (id, label, value) => figure(id).getByRole('combobox', { name: label, exact: true }).selectOption(value);
  const check = (id, label, value = true) => figure(id).getByRole('checkbox', { name: label, exact: true }).setChecked(value);
  async function capture(element, name) {
    await element.scrollIntoViewIfNeeded();
    const viewport = page.viewportSize();
    const height = await element.evaluate((node) => node.getBoundingClientRect().height);
    if (height + 150 > viewport.height) await page.setViewportSize({ width: viewport.width, height: Math.ceil(height + 150) });
    await element.scrollIntoViewIfNeeded();
    await element.screenshot({ path: `${output}/screenshots/${name}.png`, style: '.site-header--learn{visibility:hidden!important}' });
    if (height + 150 > viewport.height) await page.setViewportSize(viewport);
  }
  async function state(id, name, operation, expected) {
    const element = figure(id);
    const before = await element.innerText();
    await operation();
    const text = await element.innerText();
    ok(expected.test(text), `${name}: ${text}`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} page bounds`);
    await capture(element, name);
    report.states.push({ id, name, text });
    await element.getByRole('button', { name: 'Reset', exact: true }).click();
    ok(await element.innerText() === before, `${name} complete reset`);
  }
  try {
    await page.request.get(`${base}/__llm_refresh`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('.rlhf-flow').waitFor({ timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    await state('D01', 'request-sentence', () => select('D01', 'Request criterion', 'sentence'), /complete sentence/);
    await state('D01', 'request-tie', () => select('D01', 'Request criterion', 'tie'), /Equal under this supplied criterion/);
    await state('D04', 'split-seed', () => numeric('D04', 'Constructed split seed', 32), /Family overlap: 0/);
    await state('D04', 'split-leaking', () => check('D04', 'Compare a leaking row split'), /Family overlap: 8/);
    await state('D05', 'head-changed', () => numeric('D05', 'First shared weight', -.5), /Score gap = -0.3/);
    await state('D05', 'head-identical', () => check('D05', 'Identical feature vectors'), /Score gap = 0\./);
    await state('D06', 'gap-tie', () => numeric('D06', 'Score gap A minus B', 0), /0.5[\s\S]*0.5/);
    await state('D07', 'gradient-null', () => figure('D07').getByRole('button', { name: 'Set q equal to p', exact: true }).click(), /p − q = 0/);
    await state('D08', 'gauge-offset', () => numeric('D08', 'Common offset', 2), /2.4[\s\S]*1.8[\s\S]*0.64566/);
    await state('D08', 'gauge-zero-scale', () => numeric('D08', 'Common scale', 0), /A probability[\s\S]*0.5/);
    await state('D09', 'reference-invalid-simplex', () => numeric('D09', 'Current mass A', .9), /must be nonnegative and sum to one/);
    await state('D09', 'reference-zero-support', () => check('D09', 'Give reference C zero support'), /infinite KL/);
    await state('D09', 'reference-equality', () => figure('D09').getByRole('button', { name: 'Set current equal to reference', exact: true }).click(), /Exact KL = 0 nats/);
    await state('D10', 'tilt-equal-rewards', () => select('D10', 'Reward/support case', 'equal'), /0.4[\s\S]*0.4[\s\S]*0.2/);
    await state('D10', 'tilt-no-C-support', () => select('D10', 'Reward/support case', 'unsupported'), /C[\s\S]*0/);
    await state('D11', 'score-draw-B', () => select('D11', 'Sampled action', '1'), /Selected vector \[0, 0\]/);
    await state('D12', 'baseline-zero-variance', () => figure('D12').getByRole('button', { name: 'Use zero-variance baseline', exact: true }).click(), /variance 0\./);
    await state('D12', 'baseline-action-dependent', () => check('D12', 'Compare b(action) = reward(action)'), /mean 0; exact reward gradient 0.375/);
    await state('D13', 'path-temperature', () => numeric('D13', 'Temperature', 2), /0.55051/);
    await state('D14', 'mask-long-prompt', () => numeric('D14', 'Prompt positions', 4), /first response target uses logit 3/);
    await state('D14', 'mask-pad-eos', () => check('D14', 'Padding shares EOS token ID'), /EOS[\s\S]*padding/);
    await state('D14', 'mask-no-actions', () => numeric('D14', 'Response actions including EOS', 0), /No generated actions/);
    await state('D16', 'reward-beta-zero', () => numeric('D16', 'Reference coefficient β', 0), /Total shaped reward 1.3/);
    await state('D16', 'reward-reference-equality', () => check('D16', 'Equal old and reference probabilities'), /sampled sequence log ratio 0/);
    await state('D17', 'gae-lambda-zero', () => numeric('D17', 'Trace parameter λ', 0), /Value targets A \+ V = \[0.4, 0.4, 1.3\]/);
    await state('D17', 'gae-lambda-one', () => numeric('D17', 'Trace parameter λ', 1), /Value targets A \+ V = \[1, 1.1, 1.3\]/);
    await state('D18', 'continuing-bootstrap', () => check('D18', 'True terminal', false), /Bootstrap 0.8/);
    await state('D19', 'normalization-filler', () => numeric('D19', 'Excluded PAD filler', -1000), /mean = 0.332/);
    await state('D19', 'normalization-constant', () => check('D19', 'Constant valid advantages'), /variance = 0/);
    await state('D19', 'normalization-empty', () => check('D19', 'No valid actions'), /No actions: skip/);
    await state('D20', 'clip-negative-plateau', () => numeric('D20', 'Current / old ratio', .5), /Surrogate -1.6; slope 0/);
    await state('D20', 'clip-kink', () => numeric('D20', 'Current / old ratio', 1.2), /one-sided slopes differ/);
    await state('D20', 'clip-zero-advantages', () => check('D20', 'Zero advantages'), /Surrogate 0; slope 0/);
    await state('D21', 'shared-zero-step', () => numeric('D21', 'Ascent learning rate', 0), /θ = 0.7 → 0.7/);
    await state('D22', 'timeline-inner-update', () => numeric('D22', 'Timeline step', 3), /Current θ[\s\S]*0.3/);
    await state('D22', 'timeline-next-collection', () => numeric('D22', 'Timeline step', 5), /Batch 2:[\s\S]*Current \/ old ratio[\s\S]*1/);
    await state('D23', 'trace-last-sequence', () => select('D23', 'Retained trajectory', '15'), /sequence 16/);
    await state('D25', 'heldout-pair-change', () => select('D25', 'Literal pair, first twelve held-out source rows', '11'), /Chosen-label BCE/);
    await state('D26', 'retained-round-five', async () => { await select('D26', 'Saved checkpoint', '1'); await select('D26', 'Saved generated sample', '2'); }, /Round 5/);
    await state('D27', 'proxy-aligned', () => numeric('D27', 'Wrong verbosity bias b', 0), /Expected exact criterion = 0.78699/);
    await state('D27', 'proxy-no-signal', () => check('D27', 'Equal proxy scores, no signal'), /Expected exact criterion = 0.33333/);
    await state('D28', 'work-zero-epochs', () => numeric('D28', 'Inner epochs', 0), /Actor\/value update positions: 0[\s\S]*96 sampled actions/);
    console.log('All changed/null states and resets passed');
    for (const [view, width, font] of [['phone', 390, 16], ['enlarged', 768, 32]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, font);
      const locals = page.locator('.rlhf-local, .rlhf-math, .rlhf-flow .lesson-table-wrap');
      for (let i = 0; i < await locals.count(); i++) {
        const element = locals.nth(i);
        if (!await element.evaluate((node) => node.scrollWidth > node.clientWidth + 1)) continue;
        await element.scrollIntoViewIfNeeded();
        await element.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        ok(await element.evaluate((node) => node.scrollLeft > 0), `${view} local ${i} actual keyboard scroll`);
        await element.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
        await capture(element, `${view}-local-${i}-end`);
        report.scrolls.push({ view, index: i, label: await element.getAttribute('aria-label') });
      }
      const practices = page.locator('[data-lesson-exercise]');
      ok(await practices.count() === 15, 'All fifteen practice prompts');
      for (let i = 0; i < 15; i++) {
        const exercise = practices.nth(i);
        await exercise.locator('details').evaluateAll((nodes) => nodes.forEach((node) => { node.open = true; }));
        await capture(exercise, `${view}-practice-${i + 1}`);
        ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${view} practice ${i + 1} page bounds`);
        report.practices.push({ view, number: i + 1 });
        await exercise.locator('details').evaluateAll((nodes) => nodes.forEach((node) => { node.open = false; }));
      }
    }
    await page.setViewportSize({ width: 1366, height: 1000 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
    const programs = ['preference_records.py', 'pairwise_reward.py', 'policy_gradient.py', 'token_credit.py',
      'token_ppo.py', 'causal_backbone.py', 'rlhf_study.py', 'transformers_bridge.py', 'reward_trainer.py'];
    for (let i = 0; i < programs.length; i++) {
      const file = programs[i];
      const element = page.locator('.lesson-code-source').nth(i);
      await element.scrollIntoViewIfNeeded();
      await element.locator('pre code').waitFor();
      const expected = fs.readFileSync(`public/learn/examples/rlhf/${file}`, 'utf8');
      ok(await element.locator('pre code').textContent() === expected, `${file} complete displayed source`);
      await element.getByRole('button', { name: `Copy ${file}`, exact: true }).click();
      await element.locator('[data-copied]').waitFor();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      ok(copied.replace(/\r\n/g, '\n') === expected.replace(/\r\n/g, '\n'), `${file} actual native clipboard`);
      const [download] = await Promise.all([page.waitForEvent('download'), element.getByRole('link', { name: `Download ${file}`, exact: true }).click()]);
      const destination = `${output}/downloads/${file}`;
      await download.saveAs(destination);
      ok(hash(destination) === hash(`public/learn/examples/rlhf/${file}`), `${file} exact native download`);
      report.programs.push({ file, displayed: true, copied: true, sha256: hash(destination) });
    }
    await page.route('**/learn/examples/rlhf/preference_records.py', (route) => route.fulfill({ status: 503, body: 'Temporary test failure' }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    const firstCode = page.locator('.lesson-code-source').first();
    await firstCode.scrollIntoViewIfNeeded();
    await firstCode.getByRole('alert').waitFor();
    await capture(firstCode, 'code-loading-failure');
    await page.unroute('**/learn/examples/rlhf/preference_records.py');
    await firstCode.getByRole('button', { name: 'Retry', exact: true }).click();
    await firstCode.locator('pre code').waitFor();
    ok(await firstCode.locator('pre code').textContent() === fs.readFileSync('public/learn/examples/rlhf/preference_records.py', 'utf8'), 'Exact source recovered after 503');
    ok(report.errors.length === 0, `Page errors: ${report.errors.join('; ')}`);
    for (const file of files) ok(hash(file) === report.sources[file], `Stable campaign source ${file}`);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.failure = String(error.stack || error); process.exitCode = 1;
    console.error(report.failure);
  } finally {
    report.checks = checks;
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
    await browser.close();
    console.log(JSON.stringify({ status: report.status, checks, output }));
  }
})();
