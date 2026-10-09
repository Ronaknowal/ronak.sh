const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const profile = process.argv[2] === 'phone' ? { name: 'phone', width: 390, font: 16 } : { name: 'enlarged', width: 768, font: 32 };
const dest = base + '/runtime-reference-closure/viewport' + (profile.name === 'phone' ? '-phone' : '');
fs.mkdirSync(dest, { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', base + '/lesson.jsx'].map(file => ({ path: file, sha256: hash(file) }));
const checks = [], images = [], errors = [];
const check = (name, passed, actual) => { checks.push({ name, passed: Boolean(passed), actual }); if (!passed) throw new Error(name); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let failure = null;
  try {
    const page = await browser.newPage({ viewport: { width: profile.width, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
    await page.evaluate(font => { document.documentElement.style.fontSize = `${font}px`; document.documentElement.style.scrollBehavior = 'auto'; }, profile.font);
    const heading = page.locator('h3').filter({ hasText: /^Technical references$/ });
    await heading.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await heading.evaluate(node => ({ y: node.getBoundingClientRect().top + scrollY, height: node.nextElementSibling.getBoundingClientRect().bottom - node.getBoundingClientRect().top }));
    check('Actual9 reference list entries', await heading.evaluate(node => node.nextElementSibling.querySelectorAll('li').length) === 9);
    for (let i = 0; i * 850 < dimensions.height; i++) {
      await page.evaluate(y => { window.scrollTo({ top: y, behavior: 'instant' }); document.activeElement?.blur(); }, dimensions.y + i * 850);
      await page.waitForFunction(y => Math.abs(scrollY - y) <= 1, dimensions.y + i * 850);
      const geometry = await heading.evaluate(node => ({ headingY: node.getBoundingClientRect().top, overflow: document.documentElement.scrollWidth - innerWidth, bottom: node.nextElementSibling.getBoundingClientRect().bottom }));
      check('Native viewport reference tile ' + i, Math.abs(geometry.headingY + i * 850) <= 1 && geometry.overflow <= 1, geometry);
      const file = dest + '/' + profile.name + '-references-tile-' + i + '.png';
      await page.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
      images.push({ path: file, sha256: hash(file) });
      const after = await heading.evaluate(node => node.getBoundingClientRect().top);
      check('Stable native viewport after capture ' + i, Math.abs(after - geometry.headingY) <= 1, after);
    }
    check('No runtime errors', errors.length === 0, errors);
    for (const row of bindings) check('Unchanged ' + row.path, hash(row.path) === row.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), profile, failure, checks, images, errors, bindings, scope: 'Actual native viewport tiles cover the full reference section with150px overlaps. Earlier tall phone/enlarged crops are diagnostic only. No DOM wrapper, application change or wide browser campaign.' };
  fs.writeFileSync(dest + '/report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
