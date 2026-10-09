const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic = 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const destination = path.join(topic, process.argv[2] || 'browser-interactions');
fs.mkdirSync(path.join(destination, 'screenshots'), { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceFiles = ['src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx', 'src/learn/components/lesson-labs/rlaif-methods-flow.css', 'src/learn/data/rlaif-methods-models.js', topic + '/lesson.jsx', topic + '/lesson.md'];
const bindings = sourceFiles.map(file => ({ path: file, sha256: hash(fs.readFileSync(file)) }));
const checks = [], images = [], errors = [];
function check(name, condition, actual) {
  checks.push({ name, passed: !!condition, actual });
  if (!condition) throw Error(name + ': ' + JSON.stringify(actual));
}
async function capture(page, locator, name) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement?.blur());
  const file = path.join(destination, 'screenshots', name + '.png');
  await locator.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
  images.push({ path: 'screenshots/' + name + '.png', sha256: hash(fs.readFileSync(file)) });
}
async function range(locator, value) {
  await locator.evaluate((node, next) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(node, String(next));
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
async function loaded(page, figure) {
  await figure.scrollIntoViewIfNeeded();
  await page.waitForFunction(id => !document.querySelector(`[data-rlaif-figure="${id}"]`).querySelector('.rf-loading'), await figure.getAttribute('data-rlaif-figure'), { timeout: 90000 });
}
async function signature(figure) {
  return figure.evaluate(node => JSON.stringify({ text: node.innerText, svg: [...node.querySelectorAll('svg')].map(svg => svg.innerHTML), values: [...node.querySelectorAll('input,select,textarea')].map(n => n.type === 'checkbox' ? n.checked : n.value) }));
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1366, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  let failure = null;
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models', { timeout: 90000 });
    await page.locator('[data-rlaif-figure="D35"]').waitFor({ timeout: 90000 });
    for (let i = 1; i <= 35; i++) {
      const id = `D${String(i).padStart(2, '0')}`, figure = page.locator(`[data-rlaif-figure="${id}"]`);
      await loaded(page, figure);
      const initial = await signature(figure), controls = figure.locator('input,select,textarea');
      const descriptions = [];
      for (let j = 0; j < await controls.count(); j++) {
        const control = controls.nth(j), spec = await control.evaluate(n => ({ tag: n.tagName, type: n.type, value: n.value, min: n.min, max: n.max, step: n.step, options: n.options ? [...n.options].map(o => o.value) : null }));
        if (spec.tag === 'SELECT') await control.selectOption(spec.options.find(value => value !== spec.value));
        else if (spec.type === 'checkbox') await control.click();
        else if (spec.type === 'range') {
          const minimum = Number(spec.min || 0), maximum = Number(spec.max || 100), step = Number(spec.step || 1);
          await range(control, Number(spec.value) + step <= maximum ? Number(spec.value) + step : Math.max(minimum, Number(spec.value) - step));
        } else if (spec.type === 'number') {
          const step = spec.step === 'any' ? .1 : Number(spec.step || 1);
          const next = Number(spec.value) + step;
          await control.fill(String(spec.max && next > Number(spec.max) ? Number(spec.value) - step : next));
        }
        descriptions.push(spec);
      }
      check(`${id} controls change the represented state`, initial !== await signature(figure), descriptions);
      await capture(page, figure, id + '-changed');
      await figure.getByRole('button', { name: 'Reset', exact: true }).click();
      check(`${id} reset restores complete initial object`, initial === await signature(figure));
    }
    const nullCases = [
      ['D02', async f => f.getByLabel('Empty response B').check(), /empty|missing/i],
      ['D03', async f => f.getByLabel('Zero option targets').check(), /zero|no target/i],
      ['D04', async f => { await f.getByLabel('Raw A mass').fill('0'); await f.getByLabel('Raw B mass').fill('0'); }, /undefined/],
      ['D04', async f => f.getByLabel('Raw A mass').fill(''), /empty edit is unknown/],
      ['D05', async f => f.getByLabel('Second pass missing').check(), /unknown|missing/i],
      ['D08', async f => f.getByLabel('Equal feature values').check(), /0.5/],
      ['D11', async f => f.getByRole('button', { name: 'Empty distribution', exact: true }).click(), /expectation and reward are unknown/i],
      ['D12', async f => f.getByLabel("Subtract each action's own reward (biased)").check(), /biased|zero/i],
      ['D14', async f => f.getByLabel('Empty target vector').check(), /empty|unknown/i],
      ['D16', async f => range(f.getByLabel('Response token count'), 0), /zero|no response|EOS/i],
      ['D19', async f => { await range(f.getByLabel('A preferred count'), 0); await range(f.getByLabel('B preferred count'), 0); }, /Zero comparisons: target, optimum and loss are unknown/],
      ['D22', async f => f.getByLabel('Empty observed support').check(), /No fitted comparison or optimum is defined/],
      ['D23', async f => range(f.getByLabel('Each B token probability'), 0), /0/],
      ['D24', async f => f.getByLabel('Geometric score qA').fill(''), /unknown|enter/i],
      ['D24', async f => { await f.getByLabel('Geometric score qA').fill('0'); await f.getByLabel('Geometric score qB').fill('0'); }, /undefined|boundary|unknown/i],
      ['D25', async f => { await range(f.getByLabel('Contrast coefficient λ'), .5); await range(f.getByLabel('Rejected feature xB'), 3); }, /0/],
      ['D29', async f => { await f.getByLabel('Native contract').selectOption('ORPO'); await f.getByLabel('Inspect deliberately changed reduction').check(); }, /deliberate NLL delta/],
      ['D34', async f => { await range(f.getByLabel('Update count'), 0); }, /0/],
    ];
    for (let i = 0; i < nullCases.length; i++) {
      const [id, edit, expected] = nullCases[i], figure = page.locator(`[data-rlaif-figure="${id}"]`);
      await edit(figure);
      check(`${id} boundary ${i} is explicit`, expected.test(await figure.innerText()), await figure.innerText());
      await capture(page, figure, `${id}-boundary-${i}`);
      await figure.getByRole('button', { name: 'Reset', exact: true }).click();
    }
    check('No current-state React exceptions', errors.length === 0, errors);
    for (const binding of bindings) check('Source unchanged ' + binding.path, hash(fs.readFileSync(binding.path)) === binding.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, failure, at: new Date().toISOString(), bindings, checks, images, errors, scope: 'All35 actual changed/reset objects plus meaningful boundary states; no fits/inference. Separate responsive, native scroll, program delivery and recovery checks required.' };
  fs.writeFileSync(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
