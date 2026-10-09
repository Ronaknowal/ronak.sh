const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const folder = 'docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const out = `${folder}/browser-independent-closure-${Date.now()}`;
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files = [`${folder}/lesson.jsx`, `${folder}/lesson.md`, `${folder}/runtime-successor.json`,
  'src/learn/components/lesson-labs/CurationPipelineFlow.jsx', 'src/learn/components/lesson-labs/curation-pipeline-flow.css',
  'src/learn/data/curation-pipeline-models.js', 'scripts/verify-curation-independent-browser.cjs'];
const hashes = () => Object.fromEntries(files.map(p => [p, sha(p)]));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const report = { before: hashes(), checks: [], captures: [], errors: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true, viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(String(e)));
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models');
    const fig = id => page.locator(`[data-curation-figure="${id}"]`);
    await fig('C21').waitFor();
    const capture = async (loc, name) => {
      await loc.scrollIntoViewIfNeeded();
      const path = `${out}/${name}.png`;
      await loc.screenshot({ path, style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
      report.captures.push({ path, sha256: sha(path) });
    };
    const snippet = page.locator('.lesson-code').filter({ hasText: 'from curation_records import ArticleText' });
    assert.equal(await snippet.count(), 1);
    const expected = fs.readFileSync(`${folder}/lesson.md`, 'utf8').match(/```python\r?\n([\s\S]*?)\r?\n```/)[1].replaceAll('\r\n', '\n');
    assert.equal(await snippet.locator('pre code').textContent(), expected);
    const filename = await snippet.locator('.lesson-code__filename').innerText();
    await snippet.getByRole('button', { name: `Copy ${filename}`, exact: true }).click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), expected);
    assert.match(await snippet.getByRole('button', { name: `Copy ${filename}`, exact: true }).innerText(), /Copied/);
    const pending = page.waitForEvent('download');
    await snippet.getByRole('button', { name: `Download ${filename}`, exact: true }).click();
    assert.equal(fs.readFileSync(await (await pending).path(), 'utf8'), expected);
    report.checks.push('Ninth inline parser code: exact frozen visible bytes, clipboard/Copied state and actual Download');
    await fig('C03').getByRole('textbox').fill('aaaa\u2028b\u2028aaaa');
    assert.equal(await fig('C03').locator('.curation-lines > div').count(), 3);
    assert.match(await fig('C03').innerText(), /1 \/ 3/);
    assert.match(await fig('C03').innerText(), /4 \/ 9/);
    await capture(fig('C03'), 'unicode-line-separators');
    report.checks.push('Actual textarea U+2028 edit creates three lines and exact 1/3,4/9 ratios');
    const audit = fig('C17');
    await audit.getByRole('button', { name: 'Curator → repetition', exact: true }).click();
    assert.match(await audit.innerText(), /first-removal reason is repetition/);
    await audit.getByRole('button', { name: 'Change C score to .40: fail both', exact: true }).click();
    assert.match(await audit.innerText(), /first-removal reason is curator/);
    await audit.getByRole('button', { name: 'Repetition → curator', exact: true }).click();
    assert.match(await audit.innerText(), /first-removal reason is repetition/);
    await audit.getByRole('button', { name: 'Restore C score .90', exact: true }).click();
    assert.match(await audit.innerText(), /inclusive failures stay repetition only/);
    report.checks.push('Base/reverse, changed overlap/reverse, forward and restored-score attribution independently checked');
    for (const [name, width, size] of [['desktop', 1366, 16], ['phone', 390, 16], ['enlarged', 768, 32]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, size);
      const table = fig('C04').locator('.curation-table-object');
      const region = table.getByRole('region');
      await table.scrollIntoViewIfNeeded();
      const overflow = await region.evaluate(el => el.scrollWidth > el.clientWidth + 1);
      if (overflow) {
        await table.locator('.curation-scroll-cue').waitFor();
        const before = await table.locator('.curation-table-caption').boundingBox();
        await region.focus();
        for (let i = 0; i < 8; i++) await region.press('ArrowRight');
        await page.waitForFunction(el => el.scrollLeft > 0, await region.elementHandle());
        const after = await table.locator('.curation-table-caption').boundingBox();
        assert.equal(after.x, before.x); assert.equal(after.width, before.width);
        assert.equal(await region.getAttribute('aria-describedby'), await table.locator('.curation-scroll-cue').getAttribute('id'));
      } else assert.equal(await table.locator('.curation-scroll-cue').count(), 0);
      await capture(table, `${name}-keyboard-table`);
      report.checks.push(`${name}: actual native keyboard pan, fixed caption and accessible overflow-only cue`);
    }
    await audit.getByRole('button', { name: 'Change C score to .40: fail both', exact: true }).click();
    await audit.getByRole('button', { name: 'Curator → repetition', exact: true }).click();
    await capture(audit.locator(':scope > p').first(), 'enlarged-overlap-score-label');
    await capture(audit.locator('.curation-table-object'), 'enlarged-overlap-table');
    await capture(audit.locator('.flow-readout').first(), 'enlarged-overlap-readout');
    report.checks.push('Individually scrolled enlarged changed-score label, table and readout supplement the tall author capture');
    assert.deepEqual(report.errors, []);
    report.after = hashes(); assert.deepEqual(report.before, report.after);
    report.status = 'passed';
  } catch (e) {
    report.status = 'failed'; report.failure = String(e.stack || e); process.exitCode = 1;
  } finally {
    fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ out, status: report.status, checks: report.checks, failure: report.failure }));
    await browser.close();
  }
})();
