const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root = process.cwd();
const directory = path.join(root, 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods');
const destination = path.join(directory, process.argv[2] || 'browser-initial');
const screenshots = path.join(destination, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bindings = ['src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx', 'src/learn/components/lesson-labs/rlaif-methods-flow.css', 'src/learn/data/rlaif-methods-models.js', 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/lesson.jsx', 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/lesson.md'].map(file => ({ path: file, sha256: digest(path.join(root, file)) }));
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
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  let failure = null;
  try {
    const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4250';
    await page.request.get(`${base}/__llm_refresh`, { timeout: 90000 });
    await page.goto(`${base}/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('[data-rlaif-figure="D35"]').waitFor({ timeout: 90000 });
    check('All35 mechanisms mounted', await page.locator('[data-rlaif-figure]').count() === 35);
    check('All14 independent practice sections', await page.locator('[data-lesson-exercise]').count() === 14);
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await viewport(page, profile);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: path.join(screenshots, `${profile.name}-reader-opening.png`), animations: 'disabled' });
      images.push({ name: `${profile.name}-reader-opening`, path: `screenshots/${profile.name}-reader-opening.png`, sha256: digest(path.join(screenshots, `${profile.name}-reader-opening.png`)) });
      for (let i = 1; i <= 35; i++) {
        const id = `D${String(i).padStart(2, '0')}`, figure = page.locator(`[data-rlaif-figure="${id}"]`);
        await figure.scrollIntoViewIfNeeded();
        await page.waitForFunction(id => {
          const node = document.querySelector(`[data-rlaif-figure="${id}"]`);
          return node && !node.querySelector('.rf-loading');
        }, id, { timeout: 90000 });
        await capture(page, figure, `${profile.name}-${id}`);
        const geometry = await figure.evaluate(node => ({ width: node.getBoundingClientRect().width, documentOverflow: document.documentElement.scrollWidth - innerWidth, empty: node.innerText.trim().length === 0 }));
        check(`${profile.name}/${id} stays inside reader`, geometry.documentOverflow <= 1 && !geometry.empty, geometry);
      }
    }
    check('No browser runtime errors', errors.length === 0, errors);
    for (const binding of bindings) check(`Unchanged source ${binding.path}`, digest(path.join(root, binding.path)) === binding.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure, bindings, checks, images, errors, scope: 'Actual whole-reader opening and all35 mechanisms at desktop/390phone/root-font200%. Separate current-state, scroll and program-delivery checks remain required. No native fits or inference.' };
  fs.writeFileSync(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
