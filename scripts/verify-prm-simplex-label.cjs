const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const directory = path.join(base, 'runtime-simplex-closure');
fs.mkdirSync(path.join(directory, 'screenshots'), { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', base + '/lesson.jsx', 'public/learn-data/process-reward-models/observations.json'].map(file => ({ path: file, sha256: hash(file) }));
const checks = [], images = [], errors = [];
function check(name, condition, actual) { checks.push({ name, passed: Boolean(condition), actual }); if (!condition) throw Error(name + ': ' + JSON.stringify(actual)); }
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let failure;
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    const figure = page.locator('[data-prm-figure="D10"]');
    await figure.locator('svg').waitFor({ timeout: 90000 });
    async function slider(index, value) {
      await figure.locator('input').nth(index).evaluate((node, value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, String(value));
        node.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
    }
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await page.setViewportSize({ width: profile.width, height: 1000 });
      await page.evaluate(font => document.documentElement.style.fontSize = font + 'px', profile.font);
      for (const [name, invalid, neutral] of [['default', .1, .6], ['invalid', 1, 0], ['neutral', 0, 1], ['progress', 0, 0], ['near-invalid', .9, .1]]) {
        await slider(0, invalid); await slider(1, neutral);
        const progress = Math.max(0, 1 - invalid - neutral);
        const expected = `(${invalid}, ${neutral}, ${Number(progress.toFixed(4))})`;
        await page.waitForFunction(expected => document.querySelector('[data-prm-figure="D10"] svg')?.textContent.includes(expected), expected);
        const overlap = await figure.locator('svg').evaluate(svg => {
          const labels = [...svg.querySelectorAll('text')];
          const point = labels.at(-1).getBBox();
          return labels.slice(0, 3).map(node => {
            const corner = node.getBBox();
            return { label: node.textContent, overlap: Math.min(point.x + point.width, corner.x + corner.width) > Math.max(point.x, corner.x)
              && Math.min(point.y + point.height, corner.y + corner.height) > Math.max(point.y, corner.y) };
          });
        });
        check(`${profile.name} ${name} tuple separated from vertex labels`, overlap.every(item => !item.overlap), overlap);
        await figure.locator('.prm-scroll').first().evaluate(node => node.scrollLeft = 0);
        await figure.scrollIntoViewIfNeeded(); await page.evaluate(() => document.activeElement?.blur());
        const file = path.join(directory, 'screenshots', `${profile.name}-${name}.png`);
        await figure.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
        images.push({ path: 'screenshots/' + `${profile.name}-${name}.png`, sha256: hash(file) });
      }
      check(profile.name + ' document fits', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    }
    check('No runtime exceptions', errors.length === 0, errors);
    for (const file of bindings) check('Source conserved ' + file.path, hash(file.path) === file.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure: failure || null, checks, images, bindings, errors,
    scope: 'D10 tuple-label position only. Default, all three vertices and near-invalid point at desktop/390/root200%; actual SVG bounds verify separation. No numerical/scientific changes.' };
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
