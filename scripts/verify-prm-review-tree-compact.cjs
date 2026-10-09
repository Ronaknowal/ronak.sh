const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const output = `${owner}/runtime-review-successor/compact-tree`;
fs.mkdirSync(`${output}/screenshots`, { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = Object.fromEntries(['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css'].map(file => [file, hash(file)]));
const report = { status: 'in-progress', sources, fits: 0, checks: [], images: [], errors: [] };
function check(name, condition, actual) {
  report.checks.push({ name, passed: Boolean(condition), actual });
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
  page.on('pageerror', error => report.errors.push(error.message));
  const figure = id => page.locator(`[data-prm-figure="${id}"]`);
  async function capture(id, name) {
    const node = figure(id);
    await node.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.activeElement?.blur());
    const file = `${output}/screenshots/${name}.png`;
    await node.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
    report.images.push({ path: file, sha256: hash(file) });
  }
  async function clearance(id, name) {
    const intersections = await figure(id).locator('svg').first().evaluate(svg => {
      const text = [...svg.querySelectorAll('text')].map(node => ({ label: node.textContent, box: node.getBBox() }));
      const hits = [];
      for (const path of svg.querySelectorAll('path')) {
        if (path.closest('defs')) continue;
        for (let at = 0; at <= path.getTotalLength(); at += 2) {
          const point = path.getPointAtLength(at);
          for (const { label, box } of text) {
            if (point.x > box.x - 2 && point.x < box.x + box.width + 2 && point.y > box.y - 2 && point.y < box.y + box.height + 2) {
              if (!hits.includes(label)) hits.push(label);
            }
          }
        }
      }
      return hits;
    });
    check(`${name} text/edge clearance`, intersections.length === 0, intersections);
  }
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await figure('D23').locator('input').first().waitFor({ timeout: 90000 });
    for (const p of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await page.setViewportSize({ width: p.width, height: 1800 });
      await page.evaluate(font => document.documentElement.style.fontSize = `${font}px`, p.font);
      for (const [width, depth] of [[1, 2], [2, 2], [1, 0]]) {
        await slider(figure('D22'), 0, width); await slider(figure('D22'), 1, depth);
        const name = `${p.name}-D22-${width}-${depth}`;
        await clearance('D22', name); await capture('D22', name);
      }
      await slider(figure('D22'), 0, 1); await slider(figure('D22'), 1, 2);
      for (const step of [8, 1, 2, 7, 0]) {
        await slider(figure('D23'), 1, step);
        const name = `${p.name}-D23-step${step}`;
        await clearance('D23', name); await capture('D23', name);
      }
      await slider(figure('D23'), 1, 8);
      await clearance('D26', `${p.name}-D26-default`);
      for (const id of ['D22', 'D23', 'D26']) {
        const scroll = figure(id).locator('.prm-scroll').first();
        const sizes = await scroll.evaluate(node => [node.clientWidth, node.scrollWidth]);
        if (p.name === 'desktop') check(`${id} complete desktop tree fits`, sizes[1] <= sizes[0] + 1, sizes);
        if (sizes[1] > sizes[0] + 1) {
          check(`${p.name}/${id} visible scroll guide`, await figure(id).locator('.prm-scroll-hint').first().isVisible());
          await scroll.focus();
          for (let i = 0; i < 100 && await scroll.evaluate(node => node.scrollLeft < node.scrollWidth - node.clientWidth - 1); i++) await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(250);
          check(`${p.name}/${id} actual right edge`, await scroll.evaluate(node => node.scrollLeft >= node.scrollWidth - node.clientWidth - 1));
          await capture(id, `${p.name}-${id}-end`);
          await scroll.evaluate(node => node.scrollLeft = 0);
        }
      }
      check(`${p.name} page fits`, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    }
    check('No browser errors', report.errors.length === 0, report.errors);
    for (const [file, expected] of Object.entries(sources)) check(`Source ${file}`, hash(file) === expected);
    report.status = 'passed';
  } catch (error) { report.status = 'failed'; report.failure = error.stack; }
  await browser.close();
  fs.writeFileSync(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, checks: report.checks.length, images: report.images.length, failure: report.failure }));
  if (report.status !== 'passed') process.exitCode = 1;
})();
