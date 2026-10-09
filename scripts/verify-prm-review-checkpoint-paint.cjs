const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const output = `${owner}/runtime-review-successor/checkpoint-paint`;
fs.mkdirSync(output, { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  const report = { images: [], fits: 0, sources: Object.fromEntries(['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css'].map(p => [p, hash(p)])) };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
    for (const p of [{ name: 'desktop', width: 1366, font: 16 }, { name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
      await page.setViewportSize({ width: p.width, height: 1000 });
      await page.evaluate(font => { document.documentElement.style.fontSize = `${font}px`; document.documentElement.style.scrollBehavior = 'auto'; }, p.font);
      const bounds = await page.locator('[data-prm-figure="D13"]').evaluate(node => ({ top: node.getBoundingClientRect().top + scrollY, height: node.getBoundingClientRect().height, text: node.innerText }));
      for (let offset = 0; offset < bounds.height; offset += 850) {
        await page.evaluate(y => { document.activeElement?.blur(); window.scrollTo(0, y); }, bounds.top + offset - 80);
        await page.waitForTimeout(80);
        const file = `${output}/${p.name}-D13-${offset}.png`;
        await page.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
        report.images.push({ path: file, sha256: hash(file), profile: p.name, offset, bounds, actualScrollY: await page.evaluate(() => scrollY) });
      }
    }
    report.status = 'passed';
  } catch (error) { report.status = 'failed'; report.failure = error.stack; }
  await browser.close();
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, images: report.images.length, failure: report.failure }));
})();
