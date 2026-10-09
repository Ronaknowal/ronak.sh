const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const dest = path.join(base, 'browser-opening-closure');
fs.mkdirSync(path.join(dest, 'screenshots'), { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', base + '/lesson.jsx'].map(file => ({ path: file, sha256: hash(file) }));
const checks = [], images = [], errors = [];
function check(name, passed, actual) {
  checks.push({ name, passed: Boolean(passed), actual });
  if (!passed) throw new Error(name);
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let failure = null;
  try {
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      const page = await browser.newPage({ viewport: { width: profile.width, height: 1000 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
      await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
      await page.evaluate(font => {
        document.documentElement.style.fontSize = `${font}px`;
        document.documentElement.style.scrollBehavior = 'auto';
        document.activeElement?.blur();
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, profile.font);
      await page.waitForFunction(() => window.scrollY === 0);
      const geometry = await page.evaluate(() => ({ scrollY, overflow: document.documentElement.scrollWidth - innerWidth, titleY: document.querySelector('h1').getBoundingClientRect().top }));
      check(profile.name + ' actual normal reader opening', geometry.scrollY === 0 && geometry.titleY >= 0 && geometry.titleY < 600 && geometry.overflow <= 1, geometry);
      const file = path.join(dest, 'screenshots', profile.name + '-reader-opening.png');
      await page.screenshot({ path: file, animations: 'disabled' });
      images.push({ path: file.replaceAll('\\', '/'), sha256: hash(file) });
      await page.close();
    }
    check('No runtime errors', errors.length === 0, errors);
    for (const row of bindings) check('Unchanged ' + row.path, hash(row.path) === row.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure, checks, images, errors, bindings, scope: 'Only three actual fresh-page normal-reader openings. Prior phone/enlarged opening filenames retained as diagnostic non-opening views; no application edits.' };
  fs.writeFileSync(path.join(dest, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
