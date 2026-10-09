const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const dest = base + '/runtime-reference-closure';
fs.mkdirSync(dest + '/screenshots', { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', base + '/lesson.jsx'].map(file => ({ path: file, sha256: hash(file) }));
const checks = [], images = [], errors = [];
function check(name, passed, actual) { checks.push({ name, passed: Boolean(passed), actual }); if (!passed) throw new Error(name); }
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
      }, profile.font);
      const heading = page.locator('h3').filter({ hasText: /^Technical references$/ });
      await heading.scrollIntoViewIfNeeded();
      const wrapperProof = await heading.evaluate(node => {
        const list = node.nextElementSibling;
        const previous = [node, list].map(item => ({ width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height }));
        const wrapper = document.createElement('div');
        wrapper.dataset.prmReferenceCapture = '';
        node.before(wrapper); wrapper.append(node, list);
        return { previous, current: [node, list].map(item => ({ width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height })), items: list.querySelectorAll('li').length, links: list.querySelectorAll('a').length, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      check(profile.name + ' nine complete reference entries', wrapperProof.items === 9 && wrapperProof.links === 11 && wrapperProof.overflow <= 1, wrapperProof);
      check(profile.name + ' screenshot-only wrapper preserves geometry', JSON.stringify(wrapperProof.previous) === JSON.stringify(wrapperProof.current), wrapperProof);
      const locator = page.locator('[data-prm-reference-capture]');
      await page.evaluate(() => document.fonts.ready);
      await locator.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.evaluate(() => document.activeElement?.blur());
      const file = dest + '/screenshots/' + profile.name + '-references.png';
      const clip = await locator.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height };
      });
      check(profile.name + ' document-coordinate section crop', clip.width > 0 && clip.height > 0, clip);
      await page.screenshot({ path: file, clip, fullPage: true, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
      images.push({ path: file, sha256: hash(file) });
      await page.close();
    }
    check('No runtime errors', errors.length === 0, errors);
    for (const row of bindings) check('Unchanged ' + row.path, hash(row.path) === row.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure, bindings, checks, images, errors, scope: 'Only nine joined reference entries at3 profiles. Screenshot-only unstyled wrapper has independently identical child geometry. No source or manuscript change during capture.' };
  fs.writeFileSync(dest + '/report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
