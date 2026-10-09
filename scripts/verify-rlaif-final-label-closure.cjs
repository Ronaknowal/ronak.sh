const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parse } = require('@babel/parser');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const topic = 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const directory = topic + '/runtime-final-label-closure';
const component = 'src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx';
const bindings = [component, 'src/learn/components/lesson-labs/rlaif-methods-flow.css',
  'src/learn/data/rlaif-methods-models.js', topic + '/lesson.jsx', topic + '/lesson.md'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = file => hash(fs.readFileSync(file));
const before = fs.readFileSync(directory + '/predecessor-RLAIFMethodsFlow.jsx', 'utf8');
const after = fs.readFileSync(component, 'utf8');
const checks = [], images = [], errors = [];
const bound = bindings.map(file => ({ path: file, sha256: digest(file) }));
function check(name, passed, actual) {
  checks.push({ name, passed: Boolean(passed), actual });
  if (!passed) throw Error(name + ': ' + JSON.stringify(actual));
}
function withoutRating(source) {
  const nodes = parse(source, { sourceType: 'module', plugins: ['jsx'] }).program.body;
  const node = nodes.find(item => item.declaration?.id?.name === 'RatingDistributionMap');
  if (!node) throw Error('RatingDistributionMap declaration absent');
  return source.slice(0, node.start) + '<rating-display-only>' + source.slice(node.end);
}
async function capture(page, locator, name) {
  await page.evaluate(() => document.activeElement?.blur());
  const file = path.join(directory, 'screenshots', name + '.png');
  await locator.screenshot({ path: file, animations: 'disabled',
    style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
  images.push({ name, path: 'screenshots/' + name + '.png', sha256: digest(file) });
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  let failure = null;
  try {
    check('All component bytes outside D11 declaration conserved', withoutRating(before) === withoutRating(after));
    const source = JSON.parse(fs.readFileSync(topic + '/content-successor/inputs.json'));
    for (const [file, expected] of Object.entries(source.inputs)) {
      check('Accepted content conserved ' + file, digest(file) === expected.sha256);
    }
    await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models',
      { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('[data-rlaif-figure="D35"]').waitFor({ timeout: 90000 });
    const figure = page.locator('[data-rlaif-figure="D11"]');
    for (const profile of [{ name: 'desktop', width: 1366, font: 16 },
      { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await page.setViewportSize({ width: profile.width, height: 1000 });
      await page.evaluate(async font => {
        document.documentElement.style.fontSize = font + 'px';
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        document.activeElement?.blur();
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, profile.font);
      await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => scrollY === 0);
      check(profile.name + ' real reader opening at top', await page.evaluate(() => scrollY === 0));
      const heading = page.locator('h1').first();
      check(profile.name + ' topic heading in opening viewport', await heading.evaluate(node => {
        const rect = node.getBoundingClientRect(); return rect.top >= 0 && rect.top < innerHeight;
      }));
      const opening = path.join(directory, 'screenshots', profile.name + '-reader-opening.png');
      await page.screenshot({ path: opening, animations: 'disabled' });
      images.push({ name: profile.name + '-reader-opening', path: 'screenshots/' + profile.name + '-reader-opening.png', sha256: digest(opening) });
      await figure.scrollIntoViewIfNeeded();
      await figure.getByRole('button', { name: 'Reset', exact: true }).click();
      check(profile.name + ' reset expectation', await figure.locator('[data-expected-rating]').getAttribute('data-expected-rating') === '8.1');
      await capture(page, figure, profile.name + '-D11-default');
      await figure.getByRole('button', { name: 'Empty distribution', exact: true }).click();
      const unknown = figure.locator('svg text').filter({ hasText: 'Unknown distribution' });
      check(profile.name + ' one unknown label, no fabricated bar values', await unknown.count() === 1 && await figure.locator('svg text').count() === 12);
      check(profile.name + ' empty expectation stays unknown', await figure.locator('[data-expected-rating]').getAttribute('data-expected-rating') === 'unknown');
      await capture(page, figure, profile.name + '-D11-empty-start');
      const region = figure.locator('.rf-scroll').first();
      if (await region.evaluate(node => node.scrollWidth > node.clientWidth + 1)) {
        await region.focus();
        for (let i = 0; i < 300; i++) {
          if (await region.evaluate(node => node.scrollLeft >= node.scrollWidth - node.clientWidth - 1)) break;
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(30);
        }
        check(profile.name + ' empty drawing keyboard reaches right edge', await region.evaluate(node => node.scrollLeft >= node.scrollWidth - node.clientWidth - 1));
        await capture(page, figure, profile.name + '-D11-empty-end');
      }
      await figure.getByRole('button', { name: 'All at 1', exact: true }).click();
      check(profile.name + ' all-at1 expectation', await figure.locator('[data-expected-rating]').getAttribute('data-expected-rating') === '1');
      await capture(page, figure, profile.name + '-D11-all-at1');
      await figure.getByRole('button', { name: 'All at 10', exact: true }).click();
      check(profile.name + ' all-at10 expectation', await figure.locator('[data-expected-rating]').getAttribute('data-expected-rating') === '10');
      await capture(page, figure, profile.name + '-D11-all-at10');
      check(profile.name + ' no page overflow', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    }
    check('No browser runtime errors', errors.length === 0, errors);
    for (const binding of bound) check('Source stable ' + binding.path, digest(binding.path) === binding.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure, before: hash(before), after: hash(after),
    bindings: bound, checks, images, errors, scope: 'D11 unknown display only; every other component byte and144 accepted content inputs conserved. Three truly top-positioned openings replace scroll-restored enlarged diagnostic. No scientific inference or fits repeated.' };
  fs.writeFileSync(directory + '/report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, images: images.length, failure }));
  if (failure) process.exitCode = 1;
})();
