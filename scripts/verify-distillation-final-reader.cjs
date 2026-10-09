const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const topic = 'docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation';
const base = 'http://127.0.0.1:4250';
const output = path.resolve(topic, 'browser-evidence');
fs.mkdirSync(output, { recursive: true });
const paths = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/distillation-models.js',
  ...['Shared', 'Foundations', 'Sequences', 'Evidence'].map(name => `src/learn/components/lesson-labs/Distillation${name}.jsx`),
  'src/learn/components/lesson-labs/distillation-flow.css', 'public/learn-assets/llm-distillation/observations.json',
  'scripts/verify-distillation-final-reader.cjs'];
const hashes = () => Object.fromEntries(paths.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const argument = process.argv.find(value => value.startsWith('--figures='));
const ids = argument ? argument.slice(10).split(',') : Array.from({ length: 28 }, (_, j) => `D${String(j + 1).padStart(2, '0')}`);
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
    await page.goto(base + '/learn/path/full-curriculum/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation?module=large-language-models', { waitUntil: 'domcontentloaded', timeout: 90000 });
    const figure = id => page.locator(`[data-distill-figure="${id}"]`);
    async function ready() {
      await figure('D28').waitFor({ timeout: 60000 });
      await figure('D26').getByRole('combobox', { name: 'Held-out split' }).waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important}' });
    }
    await ready();
    assert.equal(await page.locator('[data-distill-figure]').count(), 28);
    assert.equal(await page.locator('[data-lesson-exercise]').count(), 15);
    assert.equal(await page.locator('.distill-flow .katex-error').count(), 0);
    assert.ok(!(await page.locator('.distill-flow').innerText()).includes('$$'));
    async function shot(name, element) {
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await page.evaluate(() => document.activeElement?.blur());
      const file = `${stamp}-${name}.png`;
      await element.screenshot({ path: path.join(output, file), style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
      report.captures.push(file);
    }
    const slider = (id, label, value) => figure(id).getByRole('slider', { name: new RegExp(label) }).fill(String(value));
    const select = (id, label, value) => figure(id).getByRole('combobox', { name: label, exact: true }).selectOption(String(value));
    const check = (id, label, value) => figure(id).getByRole('checkbox', { name: label, exact: true }).setChecked(value);
    const change = {
      D02: () => check('D02', 'Training graph (off = deployment)', false),
      D03: async () => { await slider('D03', 'Teacher logit A', -2); await select('D03', 'Projection rule', 'sample'); await slider('D03', 'Sampling uniform', .95); },
      D04: () => slider('D04', 'Uniform selecting one leaf', .99),
      D05: () => check('D05', 'Match p exactly to q (zero KL)', true),
      D06: async () => { await check('D06', 'Reindex by the token identity', true); await check('D06', 'Student instead splits A into two tokens', true); },
      D07: async () => { await slider('D07', 'Temperature T', .25); await check('D07', 'Tie teacher maxima A and B', true); await slider('D07', 'Shared teacher logit shift', 4); },
      D08: async () => { await slider('D08', 'Learning rate', 0); await check('D08', 'Multiply loss by T²', false); },
      D09: () => slider('D09', 'log₂ T', 7),
      D10: () => slider('D10', 'Student parameter u', .024),
      D11: async () => { await slider('D11', 'Native divergence selector', 1); await check('D11', 'Lift restriction and set p=q for readout', true); },
      D12: () => slider('D12', 'Student first-logit shift', -2),
      D13: async () => { await slider('D13', 'Stream sample count', 1000); await check('D13', 'Repeat the maximum-probability leaf instead', true); },
      D14: async () => { await slider('D14', 'Prompt positions', 6); await check('D14', 'EOS and PAD share storage ID 0', false); },
      D15: async () => { await slider('D15', 'Second response targets', 2); await check('D15', 'Repeat the second response once', true); },
      D16: async () => { await select('D16', 'Prefix source', 'teacher'); await select('D16', 'Local divergence', 'reverse'); },
      D17: async () => { await check('D17', 'Detach prefix probability in backward', false); await check('D17', 'Match both continuation rows (zero costs)', true); },
      D18: () => select('D18', "Student's sampled first token", 'A'),
      D19: () => check('D19', 'Omit the sum integer (malformed)', true),
      D20: () => select('D20', 'Retention predicate', 'empty'),
      D22: () => select('D22', 'Inspect family a:b', '2:5'),
      D23: async () => { await select('D23', 'Recorded candidate', '3:4:3/sample'); await slider('D23', 'Target position', 8); await select('D23', 'Inspect any vocabulary event', 2); },
      D25: async () => { await slider('D25', 'Batch B', 4); await slider('D25', 'Positions L', 8); await slider('D25', 'Chunk capacity C', 7); },
      D26: async () => { await select('D26', 'Held-out split', 'shift'); await select('D26', 'Recorded metric', 'reference_nll'); },
      D27: async () => { await slider('D27', 'Student cost / query', .04); await slider('D27', 'Deployment queries N', 10000); },
      D28: async () => { await check('D28', 'Teacher exposes full vocabulary vectors', false); await check('D28', 'Use prefixes sampled from the student', true); },
    };
    for (const [width, font, profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]) {
      await page.reload({waitUntil:'domcontentloaded'}); await ready();
      await page.setViewportSize({width,height:1000});
      await page.evaluate(value => document.documentElement.style.fontSize=value+'px',font);
      await page.waitForTimeout(300);
      const f=figure('D07');
      await shot(`${profile}-D07-default`,f); await change.D07();
      assert.match(await f.innerText(),/3\.07e-6/); assert.match(await f.innerText(),/1\.03e-9/);
      await shot(`${profile}-D07-changed`,f);
      const pane=f.locator('.distill-scroll').first();
      await pane.evaluate(e=>e.scrollLeft=e.scrollWidth);
      await shot(`${profile}-D07-changed-table`,pane);
      // Openings, endings and corrected practice are supplementary reader surfaces.
      const n=page.locator('[data-lesson-exercise]').nth(13);
      await n.locator('summary').first().click();await n.locator('summary').last().click();
      assert.match(await n.innerText(),/matches the teacher on 15\. Report/);
      await shot(`${profile}-practice-N-corrected`,n);
      for (const [j,p] of (await page.locator('.distill-flow > section').first().locator(':scope > p, :scope > aside').all()).slice(0,3).entries()) await shot(`${profile}-opening-${j}`,p);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.warnings, []);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack;
  } finally {
    report.after = hashes();
    assert.deepEqual(report.after, report.before, 'Source changed during capture');
    fs.writeFileSync(path.join(output, `report-${stamp}.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, captures: report.captures.length, interactions: report.interactions, failure: report.failure }));
    await browser.close();
    if (report.status !== 'passed') process.exitCode = 1;
  }
})();
