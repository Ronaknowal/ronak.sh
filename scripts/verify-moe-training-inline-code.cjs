const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const folder = 'docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const files = [`${folder}/lesson.jsx`, `${folder}/lesson.md`, 'scripts/verify-moe-training-inline-code.cjs'];
const hashes = () => Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
(async () => {
  const before = hashes();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/moe-training-expert-load-balancing?module=large-language-models');
    await page.locator('[data-moe-figure="M21"]').waitFor();
    const snippet = page.locator('.lesson-code').filter({ hasText: 'rng = np.random.default_rng(23)' });
    assert.equal(await snippet.count(), 1);
    await snippet.scrollIntoViewIfNeeded();
    const filename = await snippet.locator('.lesson-code__filename').innerText();
    const expected = fs.readFileSync(`${folder}/lesson.md`, 'utf8').match(/```python\n([\s\S]*?)\n```/)[1];
    assert.equal(await snippet.locator('pre code').textContent(), expected);
    await snippet.getByRole('button', { name: `Copy ${filename}`, exact: true }).click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected);
    assert.match(await snippet.getByRole('button', { name: `Copy ${filename}`, exact: true }).innerText(), /Copied/);
    const pending = page.waitForEvent('download');
    await snippet.getByRole('button', { name: `Download ${filename}`, exact: true }).click();
    const download = await pending;
    assert.equal(fs.readFileSync(await download.path(), 'utf8'), expected);
    const body = await page.locator('.moe-training-flow').innerText();
    assert.doesNotMatch(body, /<!-- M\d\d/);
    assert.equal(await page.locator('.moet-practice').count(), 12);
    assert.equal(await page.locator('.moet-practice details').count(), 24);
    for (const id of ['1-start-with-the-problem', '3-make-the-idea-precise', '4-from-scratch-implementation', '5-production-implementation', '11-self-check-exercises']) {
      assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
    }
    const after = hashes(); assert.deepEqual(after, before);
    fs.writeFileSync(`${folder}/inline-code-browser-checks.json`, JSON.stringify({
      at: new Date().toISOString(), before, after, filename,
      checks: ['Exact visible noise snippet', 'Actual clipboard and Copied state', 'Exact snippet Download',
        'All twelve practices and twenty-four disclosures', 'No implementation markers leaked', 'Five legacy route anchors'],
    }, null, 2));
    console.log('Inline source, clipboard, download, practice and legacy-anchor checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
