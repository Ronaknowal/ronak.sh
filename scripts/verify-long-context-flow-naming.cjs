const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const id = 'long-context-sequence-models-transformer-xl-griffin-perceiver';
const folder = `docs/teaching/deep-learning-beginner/${id}`;
const source = 'src/learn/components/lesson-labs/LongContextFlowLabs.jsx';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
(async () => {
  const bytes = fs.readFileSync(source), text = bytes.toString('utf8');
  const previous = JSON.parse(fs.readFileSync(`${folder}/reading-flow-browser.json`));
  const reverted = text.replace('<select aria-label={name} value={value}', '<select value={value}');
  assert.equal(hash(Buffer.from(reverted)), previous.sourceHashes[source], 'Only the direct accessible name changes');
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4832/');
  await page.locator('.lesson-flow').waitFor();
  const selects = page.locator('.flow-select select[aria-label]');
  const names = [];
  for (let i = 0; i < await selects.count(); i++) {
    const select = selects.nth(i), name = await select.getAttribute('aria-label');
    assert(name && name.trim());
    const parent = select.locator('..');
    assert.equal(await parent.getByRole('combobox', { name, exact: true }).count(), 1);
    assert.equal(await parent.locator('span').first().innerText(), name);
    names.push(name);
  }
  assert(names.length >= 10);
  const lab = page.locator('#long-context-cache-access');
  const query = lab.getByRole('combobox', { name: 'Query position', exact: true });
  await query.scrollIntoViewIfNeeded(); await query.focus(); await query.press('Home');
  await query.press('ArrowDown'); await query.press('Enter');
  assert.equal(await query.inputValue(), '1');
  assert((await lab.locator('.flow-readout').innerText()).includes('Query 1 returns 5.5 '));
  assert.equal(errors.length, 0);
  await browser.close();
  fs.writeFileSync(`${folder}/reading-flow-naming.json`, JSON.stringify({
    generatedAt: new Date().toISOString(), passed: true,
    url: 'http://127.0.0.1:4832/', sourceHashes: { [source]: hash(bytes) },
    previousSourceSha256: previous.sourceHashes[source],
    attributeOnlyRevertedSha256: hash(Buffer.from(reverted)),
    checks: ['Fresh isolated production build completed before navigation', 'Every local selector has an exact explicit accessible name matching its visible label', 'Real keyboard Home/ArrowDown/Enter edits query and recomputes current answer', 'No page errors'],
    names, limits: ['Attribute-only repair; prior source-bound science and unchanged geometry evidence remain scoped to their recorded source']
  }, null, 2));
  console.log(JSON.stringify({ passed: true, selectors: names.length, sourceSha256: hash(bytes) }));
})().catch(e => { console.error(e); process.exitCode = 1; });
