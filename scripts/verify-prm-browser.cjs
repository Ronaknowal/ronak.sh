const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root = process.cwd();
const directory = path.join(root, 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm');
const destination = path.join(directory, process.argv[2] || 'browser-initial');
const screenshots = path.join(destination, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/lesson.jsx', 'public/learn-data/process-reward-models/observations.json'];
const bindings = files.map(file => ({ path: file, sha256: digest(path.join(root, file)) }));
const checks = [], images = [], errors = [];
function check(name, passed, value) {
  checks.push({ name, passed: Boolean(passed), value });
  if (!passed) throw new Error(`${name}: ${JSON.stringify(value)}`);
}
async function capture(page, locator, name) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement?.blur());
  await locator.screenshot({ path: path.join(screenshots, `${name}.png`), animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
  images.push({ name, path: `screenshots/${name}.png`, sha256: digest(path.join(screenshots, `${name}.png`)) });
}
async function viewport(page, profile) {
  await page.setViewportSize({ width: profile.width, height: 1000 });
  await page.evaluate(font => { document.documentElement.style.fontSize = `${font}px`; }, profile.font);
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let failure = null;
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
    check('All 29 mechanism structures mounted', await page.locator('[data-prm-figure]').count() === 29);
    check('All 14 practice sections mounted', await page.locator('[data-lesson-exercise]').count() === 14);
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await viewport(page, profile);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      const openingPath = path.join(screenshots, `${profile.name}-reader-opening.png`);
      await page.screenshot({ path: openingPath, animations: 'disabled' });
      images.push({ name: `${profile.name}-reader-opening`, path: `screenshots/${profile.name}-reader-opening.png`, sha256: digest(openingPath) });
      for (let i = 1; i <= 29; i++) {
        const id = `D${String(i).padStart(2, '0')}`;
        const figure = page.locator(`[data-prm-figure="${id}"]`);
        await capture(page, figure, `${profile.name}-${id}`);
        const geometry = await figure.evaluate(node => ({ width: node.getBoundingClientRect().width, documentOverflow: document.documentElement.scrollWidth - innerWidth, empty: node.innerText.trim().length === 0 }));
        check(`${profile.name}/${id} stays inside reader`, geometry.documentOverflow <= 1 && !geometry.empty, geometry);
      }
    }
    check('No browser runtime errors', errors.length === 0, errors);
    for (const binding of bindings) check(`Unchanged source ${binding.path}`, digest(path.join(root, binding.path)) === binding.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure, bindings, checks, images, errors, scope: 'Initial actual normal-reader paint at desktop/phone/root-font200%; interactions and program delivery are a separate campaign.' };
  fs.writeFileSync(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
