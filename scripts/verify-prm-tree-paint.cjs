const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const directory = path.join(base, 'runtime-tree-closure');
fs.mkdirSync(path.join(directory, 'screenshots'), { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', base + '/lesson.jsx', 'public/learn-data/process-reward-models/observations.json'].map(file => ({ path: file, sha256: hash(file) }));
const checks = [], images = [], errors = [];
function check(name, condition, actual) {
  checks.push({ name, passed: Boolean(condition), actual });
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
  page.on('pageerror', error => errors.push(error.message));
  let failure;
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await page.locator('[data-prm-figure="D23"] input').first().waitFor({ timeout: 90000 });
    const beam = page.locator('[data-prm-figure="D22"]');
    const visit = page.locator('[data-prm-figure="D23"]');
    async function capture(figure, name) {
      await figure.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement?.blur());
      const file = path.join(directory, 'screenshots', name + '.png');
      await figure.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
      images.push({ path: 'screenshots/' + name + '.png', sha256: hash(file) });
    }
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await page.setViewportSize({ width: profile.width, height: 1000 });
      await page.evaluate(font => document.documentElement.style.fontSize = font + 'px', profile.font);
      await slider(beam, 0, 1); await slider(beam, 1, 2);
      await slider(visit, 0, 8); await slider(visit, 1, 8);
      check(profile.name + ' beam default literal unreached leaves', await beam.locator('svg text').filter({ hasText: /^not reached$/ }).count() === 2);
      check(profile.name + ' default UCT expanded prefixes', await visit.locator('svg text').filter({ hasText: /^expanded$/ }).count() === 3);
      check(profile.name + ' default UCT backup arrows', await visit.locator('svg line[marker-end]').count() === 2);
      await capture(beam, profile.name + '-D22'); await capture(visit, profile.name + '-D23');
      await slider(beam, 0, 2);
      check(profile.name + ' beam width2 all leaves reached', await beam.locator('svg text').filter({ hasText: /^not reached$/ }).count() === 0);
      check(profile.name + ' beam width2 correct selection', (await beam.innerText()).includes('selected A1'));
      await capture(beam, profile.name + '-D22-width2');
      await slider(beam, 1, 0);
      check(profile.name + ' depth0 all six non-root nodes unreached', await beam.locator('svg text').filter({ hasText: /^not reached$/ }).count() === 6);
      await capture(beam, profile.name + '-D22-depth0');
      for (const step of [0, 1, 2]) {
        await slider(visit, 1, step);
        const expanded = step === 0 ? 0 : step === 1 ? 1 : 2;
        check(`${profile.name} step${step} exact prefix expansion without future leakage`, await visit.locator('svg text').filter({ hasText: /^expanded$/ }).count() === expanded);
        check(`${profile.name} step${step} selected-only backup arrows`, await visit.locator('svg line[marker-end]').count() === Math.max(0, step - 1));
        await capture(visit, `${profile.name}-D23-step${step}`);
      }
      await slider(visit, 0, 0);
      check(profile.name + ' zero budget unknown', (await visit.innerText()).includes('Final root child unknown'));
      await capture(visit, profile.name + '-D23-budget0');
      for (const [id, figure] of [['D22', beam], ['D23', visit]]) {
        const scroll = figure.locator('.prm-scroll').first();
        const size = await scroll.evaluate(node => ({ width: node.clientWidth, total: node.scrollWidth }));
        if (size.total > size.width + 1) {
          check(profile.name + ' ' + id + ' overflow has visible guide', await figure.locator('.prm-scroll-hint').first().isVisible());
          await scroll.focus();
          for (let n = 0; n < 100 && await scroll.evaluate(node => node.scrollLeft < node.scrollWidth - node.clientWidth - 1); n++) await scroll.press('ArrowRight');
          check(profile.name + ' ' + id + ' native horizontal end', await scroll.evaluate(node => node.scrollLeft >= node.scrollWidth - node.clientWidth - 1));
          await capture(figure, profile.name + '-' + id + '-end');
        }
      }
      check(profile.name + ' document fits', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    }
    check('No runtime exceptions', errors.length === 0, errors);
    for (const file of bindings) check('Source conserved ' + file.path, hash(file.path) === file.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure: failure || null, checks, images, bindings, errors,
    scope: 'Bounded successor only D22/D23. Reached/scored state, prefix-time expansion, distinct ancestor-only backup edges, changed/null budgets, actual desktop/390/root200% paint and native local-scroll. All canonical data/programs/fits unchanged.' };
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
