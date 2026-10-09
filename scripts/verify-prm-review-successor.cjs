const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const output = `${owner}/runtime-review-successor/browser`;
fs.mkdirSync(`${output}/screenshots`, { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourcePaths = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', `${owner}/lesson.jsx`];
const sources = Object.fromEntries(sourcePaths.map(file => [file, hash(file)]));
const report = { status: 'in-progress', sources, checks: [], images: [], errors: [], fits: 0 };
function check(name, condition, actual) {
  report.checks.push({ name, passed: Boolean(condition), actual });
  if (!condition) throw Error(name + ': ' + JSON.stringify(actual));
}
async function slider(figure, index, value) {
  await figure.locator('input[type=range]').nth(index).evaluate((node, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  const figure = id => page.locator(`[data-prm-figure="${id}"]`);
  async function capture(id, name, width) {
    const node = figure(id);
    // Increase the viewport before element capture to avoid incorrect large-y crops.
    const height = Math.ceil(await node.evaluate(n => n.getBoundingClientRect().height));
    await page.setViewportSize({ width, height: Math.max(1000, height + 150) });
    await node.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.activeElement?.blur());
    const file = `${output}/screenshots/${name}.png`;
    await node.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
    report.images.push({ path: file, sha256: hash(file) });
  }
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await figure('D14').locator('textarea').waitFor({ timeout: 90000 });
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await page.setViewportSize({ width: profile.width, height: 1000 });
      await page.evaluate(font => { document.documentElement.style.fontSize = `${font}px`; }, profile.font);
      for (const id of ['D04', 'D14']) {
        check(`${profile.name}/${id} essential prefix has no disclosure`, await figure(id).locator('details').count() === 0);
      }
      const metrics = await figure('D17').locator('tbody tr').evaluateAll(rows => rows.map(row => [...row.cells].map(cell => cell.innerText)));
      check(`${profile.name}/earliest targets are within actual sequence`, metrics.every(row => Number(row[2]) < row[1].split(',').length), metrics);
      check(`${profile.name}/default localization 12/17`, (await figure('D17').innerText()).includes('0.7059'));
      const sizes = await figure('D15').locator('.prm-product-track').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().width));
      check(`${profile.name}/shared prefix-product scale`, Math.max(...sizes) - Math.min(...sizes) < 1, sizes);
      for (let n = 1; n <= 29; n++) {
        const id = `D${String(n).padStart(2, '0')}`;
        const chrome = await figure(id).evaluate(node => ({
          accessibleName: node.getAttribute('aria-label'),
          caption: node.querySelector('figcaption')?.innerText,
          border: [getComputedStyle(node).borderTopWidth, getComputedStyle(node).borderBottomWidth],
          banners: [...node.querySelectorAll('.prm-output')].map(n => [getComputedStyle(n).backgroundColor, getComputedStyle(n).borderLeftWidth]),
        }));
        check(`${profile.name}/${id} inline figure/readouts`, Boolean(chrome.accessibleName) && !chrome.caption && chrome.border.every(x => x === '0px') && chrome.banners.every(([bg, b]) => bg === 'rgba(0, 0, 0, 0)' && b === '0px'), chrome);
        await capture(id, `${profile.name}-${id}`, profile.width);
      }
      for (const fixture of ['failure', 'repair', 'default']) {
        await figure('D19').locator('select').selectOption(fixture);
        const leaves = await figure('D19').locator('[data-continuation-text]').evaluateAll(nodes => nodes.map(n => ({ text: n.dataset.continuationText, reward: Number(n.dataset.checkerReward) })));
        check(`${profile.name}/${fixture} actual displayed checker agrees`, leaves.every(({ text, reward }) => {
          const answer = text.replace('−', '-').match(/^x=(-?\d+(?:\.\d+)?)$/);
          return reward === Number(Boolean(answer && 2 * (Number(answer[1]) + 1) === 8));
        }), leaves);
        check(`${profile.name}/${fixture} successful count`, leaves.reduce((n, x) => n + x.reward, 0) === (fixture === 'failure' ? 0 : 1));
        await capture('D19', `${profile.name}-D19-${fixture}`, profile.width);
      }
      await slider(figure('D19'), 0, 0);
      check(`${profile.name}/K0 unknown without losing prefix`, (await figure('D19').innerText()).includes('unknown') && (await figure('D19').innerText()).includes('valid prefix: 2x=6'));
      await capture('D19', `${profile.name}-D19-K0`, profile.width);
      await slider(figure('D19'), 0, 8);
      await figure('D15').getByLabel('Repeat one B step').check();
      const repeated = await figure('D15').locator('.prm-product-track').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().width));
      check(`${profile.name}/repeated partial row shared scale`, Math.max(...repeated) - Math.min(...repeated) < 1, repeated);
      await capture('D15', `${profile.name}-D15-repeat`, profile.width);
      await figure('D15').getByLabel('Repeat one B step').uncheck();
      await figure('D04').locator('select').selectOption('1');
      await capture('D04', `${profile.name}-D04-second`, profile.width);
      await figure('D04').locator('select').selectOption('0');
      await figure('D14').locator('select').selectOption('failure');
      await capture('D14', `${profile.name}-D14-failure`, profile.width);
      await figure('D14').getByRole('button', { name: 'Empty current step', exact: true }).click();
      await capture('D14', `${profile.name}-D14-empty`, profile.width);
      await figure('D14').getByRole('button', { name: 'Reset original text', exact: true }).click();
      await figure('D14').locator('select').selectOption('correct');
      await slider(figure('D22'), 0, 2);
      await capture('D22', `${profile.name}-D22-width2`, profile.width);
      await slider(figure('D22'), 1, 0);
      await capture('D22', `${profile.name}-D22-depth0`, profile.width);
      await slider(figure('D22'), 0, 1); await slider(figure('D22'), 1, 2);
      for (const step of [1, 2, 7]) {
        await slider(figure('D23'), 1, step);
        await capture('D23', `${profile.name}-D23-step${step}`, profile.width);
      }
      await slider(figure('D23'), 0, 0);
      await capture('D23', `${profile.name}-D23-K0`, profile.width);
      await slider(figure('D23'), 0, 8); await slider(figure('D23'), 1, 8);
      await figure('D26').locator('select').selectOption('3');
      await figure('D26').getByLabel('Use state baselines').check();
      await slider(figure('D26'), 0, .2);
      await capture('D26', `${profile.name}-D26-branchB`, profile.width);
      await figure('D26').getByLabel('Use state baselines').uncheck();
      await figure('D26').locator('select').selectOption('0'); await slider(figure('D26'), 0, .6);
      check(`${profile.name}/page fits`, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    }
    check('No browser exceptions', report.errors.length === 0, report.errors);
    for (const file of sourcePaths) check('Source conserved ' + file, hash(file) === sources[file]);
    report.status = 'passed';
  } catch (error) { report.status = 'failed'; report.failure = error.stack; }
  await browser.close();
  fs.writeFileSync(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, checks: report.checks.length, images: report.images.length, failure: report.failure }));
  if (report.status !== 'passed') process.exitCode = 1;
})();
