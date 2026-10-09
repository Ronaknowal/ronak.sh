const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ids = ['byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram', 'byte-level-tokenization-token-free-models', 'vocabulary-design-multilingual-tokenization'];
const manifest = 'dist-tokenization-flow/.vite/manifest.json';
const manifestHash = hash(manifest);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const rows = [];
  try {
    for (const id of ids) {
      const page = await browser.newPage({ viewport: { width: 768, height: 1000 } });
      await page.goto(`http://127.0.0.1:4240/learn/path/full-curriculum/${id}?module=large-language-models`, { waitUntil: 'domcontentloaded' });
      await page.locator('.reader-article .lesson-flow').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const row = await page.evaluate(() => ({ rootFont: getComputedStyle(document.documentElement).fontSize,
        overflow: document.documentElement.scrollWidth - innerWidth,
        figures: [...document.querySelectorAll('.reader-article figure')].map(element => {
          const bounds = element.getBoundingClientRect();
          return { label: element.getAttribute('data-figure') || element.getAttribute('data-byte-figure') || element.getAttribute('aria-label'),
            left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height };
        }),
      }));
      assert.ok(row.overflow <= 1, `${id}: intermediate overflow`);
      assert.ok(row.figures.length > 0 && row.figures.every(figure => figure.width > 0 && figure.height > 0 && figure.right <= 769), `${id}: intermediate figure bounds`);
      rows.push({ id, ...row, passed: true });
      await page.close();
    }
  } finally { await browser.close(); }
  assert.equal(hash(manifest), manifestHash);
  fs.writeFileSync(process.env.TOKENIZATION_INTERMEDIATE_OUTPUT || 'docs/teaching/tokenization/reading-flow-evidence/intermediate-layout.json', JSON.stringify({
    passed: true, checkedAt: new Date().toISOString(), width: 768, manifestHash, verifierHash: hash(__filename), rows,
  }, null, 2) + '\n');
  console.log('All three intermediate layouts passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
