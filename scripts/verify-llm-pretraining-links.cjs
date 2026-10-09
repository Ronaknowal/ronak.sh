const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const { createHash } = require('node:crypto');

(async () => {
  const { llmScope, llmIntegration } = await import('./lib/llm-pretraining-integration.mjs');
  const base = process.env.LLM_PRODUCTION_BASE || 'http://127.0.0.1:4251';
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const checks = [], links = new Set();
  try {
    const page = await browser.newPage();
    for (const topic of llmScope) {
      await page.goto(`${base}/learn/path/full-curriculum/${topic.id}?module=large-language-models`);
      await page.locator(topic.figures).first().waitFor();
      const ownLinks = await page.locator('.reader-content a[href^="/learn/path/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
      for (const link of ownLinks) links.add(link);
    }
    for (const link of links) {
      await page.goto(base + link);
      const fragment = decodeURIComponent(new URL(base + link).hash.slice(1));
      await page.locator('.reader-article h2').first().waitFor();
      await page.locator('.reader-article[aria-busy="false"]').waitFor();
      const publicationStatus = (await page.locator('.reader-header .topic-status').textContent()).trim().toLowerCase();
      assert.ok(['published', 'planned'].includes(publicationStatus.trim()), link);
      if (fragment) assert.equal(await page.locator(`[id="${fragment}"]`).count(), 1, link);
      checks.push({ link, publicationStatus, fragmentExists: fragment ? true : null });
    }
  } finally { await browser.close(); }
  fs.writeFileSync(`${llmIntegration}/lesson-links-review.json`, JSON.stringify({
    at: new Date().toISOString(), passed: true, base, checks,
    sources: Object.fromEntries(llmScope.map(t => [t.published, createHash('sha256').update(fs.readFileSync(t.published)).digest('hex')])),
  }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, checks: checks.length }));
})().catch(error => { console.error(error); process.exit(1); });
