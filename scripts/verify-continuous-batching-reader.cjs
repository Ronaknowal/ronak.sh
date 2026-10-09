const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const output = path.resolve(topic, `browser-reader-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const files = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/continuous-batching-models.js',
  ...['Shared', 'Structures', 'Foundations', 'Storage', 'Serving'].map(n => `src/learn/components/lesson-labs/ContinuousBatching${n}.jsx`),
  'src/learn/components/lesson-labs/continuous-batching-flow.css', 'scripts/verify-continuous-batching-reader.cjs'];
const hashes = () => Object.fromEntries(files.map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report = { before: hashes(), checks: [], captures: [], pageErrors: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', e => report.pageErrors.push(e.message));
    await page.request.get('http://127.0.0.1:4261/__llm_refresh');
    await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-cb-figure="D26"]').waitFor({ timeout: 60000 });
    await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}' });
    for (const detail of await page.locator('.lesson-compass details').all()) await detail.evaluate(e => { e.open = true; });
    assert.equal(await page.locator('[data-code-downloads]').count(), 1);
    for (const detail of await page.locator('[data-code-downloads] details').all()) if (!(await detail.evaluate(e=>e.open))) await detail.locator('summary').click();
    for (const [width, font, profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = value + 'px'; }, font);
      for (const [name, selector] of [['opening','.lesson-compass'],['intro','.cb-flow > section:first-child > p:first-child'],
        ['file-index','[data-code-downloads]'],['further-learning','[data-lesson-ending="further-learning"]'],
        ['references','[data-lesson-ending="references"]'],['readiness','[data-lesson-ending="readiness"]']]) {
        const locator = page.locator(selector);
        assert.equal(await locator.count(), 1, selector);
        const file = path.join(output, `${profile}-${name}.png`);
        const item = await capture(page, locator, file);
        report.captures.push({ name: `${profile}-${name}`, file, tiles: item.tiles.map(t => t.path) });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      report.checks.push(`${profile}: opening, intro, shared file index and all three endings captured; no page overflow`);
    }
    assert.deepEqual(report.pageErrors, []);
    report.after = hashes();
    assert.deepEqual(report.after, report.before);
    report.status = 'passed; actual paint reading recorded separately';
  } catch (error) { report.failure = error.stack; process.exitCode = 1; }
  finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ output, checks: report.checks.length, captures: report.captures.length, failure: report.failure }));
  }
})();
