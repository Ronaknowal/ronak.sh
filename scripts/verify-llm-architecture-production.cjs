const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const base = process.env.LLM_PRODUCTION_BASE || 'http://127.0.0.1:4244';
const sha = value => createHash('sha256').update(value).digest('hex');
(async () => {
  const { llmScope, llmIntegration } = await import('./lib/llm-architecture-scope.mjs');
  const assets = JSON.parse(fs.readFileSync(`${llmIntegration}/production-assets.json`, 'utf8'));
  const output = `${llmIntegration}/production-browser`;
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const errors = [], checks = [];
  try {
    for (const topic of llmScope) {
      const page = await context.newPage();
      page.on('pageerror', e => errors.push({ id: topic.id, error: e.message }));
      await page.goto(`${base}/learn/path/full-curriculum/${topic.id}?module=large-language-models`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.locator(topic.figures).first().waitFor({ timeout: 90000 });
      await page.waitForFunction(({ selector, count }) => document.querySelectorAll(selector).length === count, { selector: topic.figures, count: topic.count }, { timeout: 90000 });
      assert.equal(await page.locator('.katex-error').count(), 0, `${topic.id}: invalid rendered math`);
      await page.screenshot({ path: `${output}/${topic.id}-opening.png` });
      const h2 = await page.locator('h2[id]').evaluateAll(nodes => nodes.map(n => ({ id: n.id, title: n.textContent })));
      assert.ok(h2.length >= 8, `${topic.id}: incomplete section body`);
      const duplicateIds = await page.evaluate(() => {
        const seen = new Set(); return [...document.querySelectorAll('[id]')].flatMap(n => seen.has(n.id) ? [n.id] : (seen.add(n.id), []));
      });
      assert.deepEqual(duplicateIds, [], `${topic.id}: duplicate reader IDs`);
      const firstProgram = page.locator('.lesson-code-source').first();
      await firstProgram.scrollIntoViewIfNeeded();
      const copy = firstProgram.getByRole('button', { name: /^Copy / });
      await copy.waitFor({ timeout: 90000 });
      await copy.click();
      await firstProgram.getByText('Copied', { exact: true }).first().waitFor();
      const visible = await firstProgram.locator('pre code').textContent();
      assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), visible.replaceAll('\r\n', '\n'));
      const widths = [];
      for (const [width, font] of [[390, 16], [768, 32]]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(size => document.documentElement.style.fontSize = `${size}px`, font);
        await page.locator(topic.figures).first().scrollIntoViewIfNeeded();
        const actual = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(actual <= width + 1, `${topic.id}: ${font}px text overflows ${width} to ${actual}`);
        widths.push({ width, font, actual });
      }
      const emitted = assets.topics.find(t => t.id === topic.id);
      for (const [url, expected] of Object.entries(emitted.assets)) {
        const response = await context.request.get(`${base}/${url}`);
        assert.equal(response.status(), 200, url);
        assert.equal(sha(await response.body()), expected, `Production HTTP bytes: ${url}`);
      }
      checks.push({ id: topic.id, figures: topic.count, h2, widths, firstCompleteProgramCopy: true, httpAssets: Object.keys(emitted.assets).length });
      await page.close();
    }
    assert.deepEqual(errors, []);
    const report = { at: new Date().toISOString(), passed: true, base, assetReceiptSha256: sha(fs.readFileSync(`${llmIntegration}/production-assets.json`)), checks, errors };
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: true, topics: checks.length, errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
