const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const directory = path.join(process.cwd(), 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm', process.argv[2] || 'browser-interactions');
fs.mkdirSync(path.join(directory, 'screenshots'), { recursive: true });
const checks = [], images = [], errors = [];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/lesson.jsx', 'public/learn-data/process-reward-models/observations.json'].map(file => ({ path: file, sha256: hash(fs.readFileSync(file)) }));
function check(name, condition, actual) { checks.push({ name, passed: !!condition, actual }); if (!condition) throw new Error(name + ': ' + JSON.stringify(actual)); }
async function capture(figure, name, page) {
  await figure.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement?.blur());
  const file = path.join(directory, 'screenshots', name + '.png');
  await figure.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
  images.push({ name, path: 'screenshots/' + name + '.png', sha256: hash(fs.readFileSync(file)) });
}
async function range(figure, index, value) {
  const input = figure.locator('input[type=range]').nth(index);
  await input.evaluate((node, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, String(value)); node.dispatchEvent(new Event('input', { bubbles: true })); }, value);
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true, viewport: { width: 1366, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let failure;
  try {
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
    const figure = id => page.locator(`[data-prm-figure="${id}"]`);
    async function changed(id, name, action, expected) {
      await action(figure(id));
      if (expected) await figure(id).getByText(expected, { exact: false }).first().waitFor();
      await capture(figure(id), name, page);
      check(name, expected ? (await figure(id).innerText()).includes(expected) : true);
    }
    await changed('D01', 'D01-answer35', node => node.locator('select').selectOption('3.5'), 'Asserted answer 3.5');
    await changed('D02', 'D02-boundary2', node => node.locator('select').selectOption('2'), 'Selected boundary 2 reads positions 0–2');
    await changed('D03', 'D03-stop-unknown', node => node.locator('select').selectOption('stop'), 'unknown');
    await changed('D04', 'D04-actual-four-negative', node => node.locator('select').selectOption('1'), 'record 156');
    await changed('D05', 'D05-longer-position5', async node => { await node.getByRole('checkbox').check(); await node.locator('select').selectOption('4'); }, 'Boundary 5 reads positions 0–5');
    await changed('D06', 'D06-future-edit', node => node.getByRole('checkbox').nth(1).check(), 'edited b');
    await changed('D06', 'D06-all-masked', node => node.getByRole('checkbox').first().check(), 'mean loss unknown');
    await changed('D07', 'D07-empty-mean', node => node.getByRole('button', { name: 'Mask every target' }).click(), 'unknown');
    await changed('D08', 'D08-reversed-gradient', node => node.locator('select').selectOption('1'), 'Descent raises');
    await changed('D08', 'D08-exact-zero-wrong-target', node => range(node, 0, 0), 'loss=∞');
    await changed('D08', 'D08-masked-infinite-endpoint', node => node.getByRole('checkbox').check(), 'loss=unknown');
    await changed('D09', 'D09-frozen', node => node.getByRole('checkbox').check(), 'no update');
    await changed('D10', 'D10-simplex-edge', node => range(node, 0, 1), 'Strict progress = 0');
    await changed('D11', 'D11-validation-group', node => node.locator('select').selectOption('validation'), '32 disjoint');
    await changed('D12', 'D12-initial-weights', node => node.getByRole('checkbox').first().check(), 'stored initial');
    await changed('D12', 'D12-empty-current-prefix-remains', node => node.getByRole('checkbox').nth(1).check(), 'Empty current step');
    await changed('D13', 'D13-train-checkpoints', node => node.locator('select').selectOption('train'), 'train: final');
    await changed('D14', 'D14-real-neutral-failure', node => node.locator('select').selectOption('failure'), 'neutral');
    await changed('D14', 'D14-edited-empty', node => node.getByRole('button', { name: 'Empty current step' }).click(), 'Original-source annotation');
    await changed('D14', 'D14-reset-failure', node => node.getByRole('button', { name: 'Reset original text' }).click(), 'Source annotation');
    await changed('D15', 'D15-zero-log', async node => { await node.locator('select').selectOption('log_product'); await node.getByRole('checkbox').nth(1).check(); }, '−∞');
    await changed('D15', 'D15-empty', node => node.getByRole('checkbox').nth(2).check(), 'order unknown');
    await changed('D16', 'D16-log-vote', node => node.locator('select').selectOption('log_product'), 'weighted-vote answer 3');
    await changed('D16', 'D16-no-candidates', node => range(node, 0, 0), 'oracle any correct unknown');
    await changed('D17', 'D17-missing-reference-group', node => node.locator('select').selectOption('correct'), 'unknown');
    await changed('D18', 'D18-total-abstention', node => range(node, 0, 1), 'conditional accuracy unknown');
    await changed('D19', 'D19-no-draws', node => range(node, 0, 0), 'HE=unknown');
    await changed('D19', 'D19-wrong-prefix-repair', async node => { await range(node, 0, 8); await node.locator('select').selectOption('repair'); }, 'wrong prefix');
    await changed('D20', 'D20-degenerate-zero-value', node => range(node, 0, 0), 'Var(SE)=0');
    await changed('D20', 'D20-no-draw-estimates', node => range(node, 1, 0), 'E[SE]=unknown');
    await changed('D21', 'D21-agreement-edited', node => node.locator('select').selectOption('1'), 'retains 3/5');
    await changed('D22', 'D22-width2', node => range(node, 0, 2), 'selected A1');
    await changed('D22', 'D22-no-depth-answer', node => range(node, 1, 0), 'selected unknown');
    await changed('D23', 'D23-no-search', node => range(node, 0, 0), 'root child unknown');
    await changed('D24', 'D24-advantage-crossover', node => range(node, 0, 1.4), 'tie');
    await changed('D25', 'D25-one-oracle-draw', node => range(node, 0, 1), 'K=1 preserves');
    await changed('D25', 'D25-no-attempt', node => range(node, 0, 0), 'no attempted outcome');
    await changed('D26', 'D26-baseline-failure-sample', async node => { await node.getByRole('checkbox').check(); await node.locator('select').selectOption('1'); }, 'sample credit');
    await changed('D27', 'D27-omitted-terminal', node => node.getByRole('checkbox').check(), '0.529');
    await changed('D27', 'D27-nonzero-terminal', node => range(node, 1, .5), 'Correct telescope');
    await changed('D28', 'D28-prefix-cache', node => node.getByRole('checkbox').check(), 'retained');
    await changed('D28', 'D28-zero-completions', node => range(node, 0, 0), 'no continuation estimate');
    await changed('D29', 'D29-lost-root-process', async node => { await node.locator('select').first().selectOption('root'); await node.locator('select').nth(1).selectOption('process'); }, 'incomplete solution');
    await changed('D29', 'D29-missing-annotation', node => node.locator('select').first().selectOption('missing'), 'unknown suffix');
    // Native keyboard changes on a controlled range, and actual local scrolling.
    const k = figure('D28').locator('input[type=range]');
    await k.focus(); await k.press('ArrowRight');
    check('Native ArrowRight changes controlled K', await k.inputValue() === '1');
    for (const profile of [{ name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }, { name: 'narrow', width: 320, font: 16 }]) {
      await page.setViewportSize({ width: profile.width, height: 1000 });
      await page.evaluate(font => document.documentElement.style.fontSize = font + 'px', profile.font);
      const scrolls = page.locator('.prm-scroll, .prm-equation');
      for (let i = 0; i < await scrolls.count(); i++) {
        const scroll = scrolls.nth(i);
        const sizes = await scroll.evaluate(node => ({ width: node.clientWidth, total: node.scrollWidth }));
        if (sizes.total > sizes.width + 1) {
          await scroll.focus();
          for (let j = 0; j < 100 && await scroll.evaluate(node => node.scrollLeft < node.scrollWidth - node.clientWidth - 1); j++) await scroll.press('ArrowRight');
          const reached = await scroll.evaluate(node => ({ left: node.scrollLeft, end: node.scrollWidth - node.clientWidth }));
          check(`${profile.name} local object ${i} native ArrowRight end`, reached.left >= reached.end - 1, reached);
          await capture(scroll, `${profile.name}-scroll-${i}-end`, page);
        }
      }
      check(`${profile.name} document does not overflow`, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
      for (const id of ['D04', 'D08', 'D14', 'D22', 'D25', 'D26', 'D27']) await capture(figure(id), `${profile.name}-${id}-changed`, page);
    }
    await page.setViewportSize({ width: 1366, height: 1000 });
    await page.evaluate(() => document.documentElement.style.fontSize = '16px');
    const blocks = page.locator('.lesson-code-source');
    check('All seven complete programs are direct reader blocks', await blocks.count() === 7);
    for (let i = 0; i < 7; i++) {
      const block = blocks.nth(i);
      await block.scrollIntoViewIfNeeded();
      await block.locator('pre code').waitFor({ timeout: 90000 });
      const file = (await block.locator('.lesson-code__filename').innerText()).trim();
      const bytes = fs.readFileSync(path.join('public/learn-code/process-reward-models', file));
      check(`${file} visible complete source exact`, hash(Buffer.from(await block.locator('pre code').textContent())) === hash(bytes));
      await block.getByRole('button', { name: `Copy ${file}`, exact: true }).click();
      check(`${file} actual clipboard exact (Windows CRLF normalized)`, hash(Buffer.from((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'))) === hash(bytes));
      const [download] = await Promise.all([page.waitForEvent('download'), block.getByRole('link', { name: `Download ${file}`, exact: true }).click()]);
      const output = await download.path();
      check(`${file} actual download byte exact`, hash(fs.readFileSync(output)) === hash(bytes));
    }
    const archive = page.locator('a[href="/learn-code/process-reward-models/prm-programs-data.zip"]').first();
    check('Archive reference is an actual download link', await archive.count() === 1 && await archive.getAttribute('download') !== null);
    check('File index exposes all 23 named archive entries', await page.locator('.prm-file-index li a').count() === 23);
    await page.locator('.prm-file-index summary').click();
    await capture(page.locator('.prm-file-index'), 'desktop-file-index', page);
    const [zip] = await Promise.all([page.waitForEvent('download'), archive.click()]);
    check('Actual archive download exact', hash(fs.readFileSync(await zip.path())) === hash(fs.readFileSync('public/learn-code/process-reward-models/prm-programs-data.zip')));
    // Exercise every worked solution at phone width; teaching remains visible.
    await page.setViewportSize({ width: 390, height: 1000 });
    const practices = page.locator('[data-lesson-exercise]');
    for (let i = 0; i < await practices.count(); i++) {
      await practices.nth(i).locator('details').nth(1).locator('summary').click();
      await capture(practices.nth(i), `phone-practice-${i + 1}`, page);
      check(`Practice ${i + 1} has a nonempty complete solution`, (await practices.nth(i).locator('details').nth(1).innerText()).length > 70);
    }
    check('No runtime exceptions', errors.length === 0, errors);
    for (const file of bindings) check('Source conserved ' + file.path, hash(fs.readFileSync(file.path)) === file.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure: failure || null, checks, images, bindings, errors, scope: 'Actual changed/null native keyboard/local scroll, visible programs, clipboard/download/ZIP and practice panes. Fetch recovery is a separate context.' };
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
