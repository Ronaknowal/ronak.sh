const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback';
const output = process.env.RLHF_BROWSER_OUTPUT || `${owner}/browser-preliminary`;
const base = 'http://127.0.0.1:4250';
const url = `${base}/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models`;
const files = [`${owner}/manuscript.jsx`, 'src/learn/components/lesson-labs/RLHFFlow.jsx',
  'src/learn/components/lesson-labs/rlhf-flow.css', 'src/learn/data/rlhf-models.js',
  'src/learn/data/rlhf-observations.js', 'scripts/verify-rlhf-browser.cjs'];
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if (fs.existsSync(`${output}/report.json`)) throw new Error('Preserve previous evidence; choose a new output.');
fs.mkdirSync(`${output}/screenshots`, { recursive: true });
const report = { status: 'running', sources: Object.fromEntries(files.map((file) => [file, hash(file)])),
  views: [], bounds: [], errors: [], scope: 'Actual staged normal reader and source-bound captures; personal paint review is separate.' };
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks++; };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  page.on('pageerror', (error) => report.errors.push(String(error)));
  const figure = (id) => page.locator(`[data-rlhf-figure="${id}"]`);
  async function capture(element, name) {
    await element.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const viewport = page.viewportSize();
    const height = await element.evaluate((element) => element.getBoundingClientRect().height);
    if (height + 150 > viewport.height) await page.setViewportSize({ width: viewport.width, height: Math.ceil(height + 150) });
    await element.scrollIntoViewIfNeeded();
    await element.screenshot({ path: `${output}/screenshots/${name}.png`,
      style: '.site-header--learn{visibility:hidden!important}' });
    if (height + 150 > viewport.height) await page.setViewportSize(viewport);
  }
  try {
    await page.request.get(`${base}/__llm_refresh`, { timeout: 90000 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('.rlhf-flow').waitFor({ timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    ok((await figure('D23').innerText()).includes('15.63541'), 'Current retained minibatch value rendered');
    for (const [view, width, font] of [['desktop', 1366, 16], ['phone', 390, 16], ['enlarged', 768, 32]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, font);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      report.bounds.push({ view, overflow });
      ok(overflow <= 1, `${view} document overflow ${overflow}`);
      for (let i = 1; i <= 28; i++) {
        const id = `D${String(i).padStart(2, '0')}`;
        if (process.env.RLHF_FIGURES && !process.env.RLHF_FIGURES.split(',').includes(id)) continue;
        const element = figure(id);
        ok(await element.count() === 1, `${view} ${id} exactly once`);
        const bounds = await element.evaluate((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.left, right: r.right, height: r.height, width: r.width };
        });
        ok(bounds.x >= -1 && bounds.right <= width + 1, `${view} ${id} figure bounds`);
        await capture(element, `${view}-${id}`);
        report.views.push({ view, id, ...bounds, file: `${view}-${id}.png` });
      }
      console.log(view, 'all 28 figures captured');
    }
    ok(report.errors.length === 0, `Page errors: ${report.errors.join('; ')}`);
    for (const file of files) ok(hash(file) === report.sources[file], `Source unchanged throughout campaign: ${file}`);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.failure = String(error.stack || error);
    console.error(report.failure);
    process.exitCode = 1;
  } finally {
    report.checks = checks;
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
})();
