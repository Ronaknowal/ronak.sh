// Independent integration checks for the first three LLM reading-flow lessons.
// Authors own their model/fixture checks; this verifies the actual production
// reader, uncluttered figure surfaces, native controls and canonical downloads.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4240';
const build = process.env.TOKENIZATION_BUILD_DIR || 'dist-tokenization-flow';
const output = process.env.TOKENIZATION_REVIEW_OUTPUT || 'docs/teaching/tokenization/reading-flow-evidence';
const ids = [
  'byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram',
  'byte-level-tokenization-token-free-models',
  'vocabulary-design-multilingual-tokenization',
];
const manifest = JSON.parse(fs.readFileSync('src/learn/data/lesson-manifest.json', 'utf8'));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = new Set();
function addSource(file) {
  file = file.replaceAll('\\', '/');
  if (sources.has(file) || !fs.existsSync(file)) return;
  sources.add(file);
  if (!/\.[cm]?[jt]sx?$/.test(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  const imports = /(?:from\s*|import\s*)["'](\.[^"']+)["']/g;
  for (const match of source.matchAll(imports)) {
    const stem = path.join(path.dirname(file), match[1]);
    const resolved = [stem, `${stem}.jsx`, `${stem}.js`, path.join(stem, 'index.js')]
      .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (resolved) addSource(resolved);
  }
}
for (const id of ids) addSource(path.join('src/learn/data', manifest[id]));
const sourceHashes = Object.fromEntries([...sources].sort().map(file => [file, hash(file)]));
const buildManifestHash = hash(`${build}/.vite/manifest.json`);
fs.mkdirSync(`${output}/screenshots`, { recursive: true });
const hiddenHeader = '.site-header,.site-skip{visibility:hidden!important}';

async function figures(page, id, state, capture) {
  const items = page.locator('.reader-article :is(figure,[data-figure],.flow-lab)');
  const records = [];
  for (let index = 0; index < await items.count(); index++) {
    const item = items.nth(index);
    if (!await item.isVisible()) continue;
    const nested = await item.evaluate(element =>
      Boolean(element.parentElement.closest('figure,[data-figure],.flow-lab')));
    if (nested) continue;
    await item.scrollIntoViewIfNeeded();
    const record = await item.evaluate(element => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        name: element.getAttribute('data-figure') || element.id || element.getAttribute('aria-label') || 'unnamed',
        width: box.width, height: box.height,
        border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
        background: style.backgroundColor, shadow: style.boxShadow,
        headings: [...element.querySelectorAll('h2,h3')].map(node => node.innerText),
        svgCount: element.querySelectorAll('svg:not(.katex svg)').length,
        live: element.querySelectorAll('[aria-live]').length,
      };
    });
    assert.ok(record.height > 1 && record.width > 1, `${id}/${record.name}: collapsed drawing`);
    assert.deepEqual(record.border, ['0px', '0px', '0px', '0px'], `${id}/${record.name}: figure frame remains`);
    assert.ok(['rgba(0, 0, 0, 0)', 'transparent'].includes(record.background), `${id}/${record.name}: filled figure panel`);
    assert.equal(record.shadow, 'none', `${id}/${record.name}: figure shadow remains`);
    assert.deepEqual(record.headings, [], `${id}/${record.name}: separate visual heading remains`);
    if (capture) {
      const screenshot = `${output}/screenshots/${id}-${String(index).padStart(2, '0')}-${state}.png`;
      await item.screenshot({ path: screenshot, style: hiddenHeader });
      record.screenshot = screenshot;
      record.screenshotSha256 = hash(screenshot);
    }
    records.push(record);
  }
  assert.ok(records.length > 0, `${id}: no drawings inspected`);
  return records;
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write'] });
  const records = [];
  try {
    for (const id of ids) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const row = { id, source: manifest[id], states: [] };
      records.push(row);
      try {
        await page.goto(`${base}/learn/path/full-curriculum/${id}?module=large-language-models`,
          { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.locator('.reader-article .lesson-flow').waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('.lesson-compass').count(), 1, `${id}: shared opening`);
        row.headings = await page.locator('.reader-article h2').allTextContents();
        row.anchors = await page.locator('.lesson-compass__sections a').evaluateAll(links =>
          links.map(link => ({ text: link.textContent, href: link.getAttribute('href'),
            targets: document.querySelectorAll(`[id="${CSS.escape(link.hash.slice(1))}"]`).length })));
        assert.ok(row.anchors.length && row.anchors.every(anchor => anchor.targets === 1), `${id}: invalid jump targets`);
        assert.equal(new Set(row.anchors.map(anchor => anchor.href)).size, row.anchors.length, `${id}: duplicate anchors`);
        const labs = page.locator('.reader-article .flow-lab');
        assert.ok(await labs.count() > 0, `${id}: no live investigations`);
        row.controls = [];
        for (let index = 0; index < await labs.count(); index++) {
          const lab = labs.nth(index);
          const ranges = lab.locator('input[type=range]');
          for (let control = 0; control < await ranges.count(); control++) {
            const range = ranges.nth(control);
            await range.scrollIntoViewIfNeeded();
            await range.focus();
            await range.press('End');
            const maximum = await range.inputValue();
            await range.press('Home');
            const minimum = await range.inputValue();
            await range.press('ArrowRight');
            const interior = await range.inputValue();
            assert.notEqual(minimum, maximum, `${id}: range endpoints`);
            assert.notEqual(minimum, interior, `${id}: range interior`);
            assert.ok((await lab.innerText()).length > 10, `${id}: range result absent`);
            row.controls.push({ lab: await lab.getAttribute('aria-label'), minimum, interior, maximum });
          }
          const reset = lab.getByRole('button', { name: /reset/i });
          if (await reset.count()) await reset.first().click();
        }
        for (const [width, zoom, state, capture] of [
          [1366, 1, 'desktop', true], [390, 1, 'phone', true],
          [768, 2, 'enlarged', true], [320, 1, 'small', false],
        ]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.evaluate(zoom => { document.documentElement.style.fontSize = zoom === 2 ? '32px' : ''; }, zoom);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert.ok(overflow <= 1, `${id}/${state}: page overflow ${overflow}`);
          row.states.push({ width, zoom, state, overflow, figures: await figures(page, id, state, capture) });
        }
        await page.setViewportSize({ width: 1366, height: 1000 });
        await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
        const programs = page.locator('.lesson-code-source');
        for (let index = 0; index < await programs.count(); index++) {
          await programs.nth(index).scrollIntoViewIfNeeded();
          await programs.nth(index).locator('.lesson-code').waitFor();
        }
        const copy = page.getByRole('button', { name: /^copy/i }).first();
        await copy.click();
        await page.waitForFunction(button => /copied/i.test(button.textContent), await copy.elementHandle());
        assert.ok((await page.evaluate(() => navigator.clipboard.readText())).length > 5);
        const assets = await page.locator('.reader-article a[href^="/learn-code/"],.reader-article a[href^="/learn-assets/"]')
          .evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))]);
        for (const asset of assets) {
          const response = await context.request.get(base + asset);
          assert.ok(response.ok(), `${id}: asset ${asset}`);
          assert.deepEqual(await response.body(), fs.readFileSync(path.join('public', decodeURIComponent(asset.split(/[?#]/)[0]))));
        }
        row.assets = assets;
        row.programs = await programs.count();
        assert.deepEqual(errors, [], `${id}: rendered exceptions`);
        row.passed = true;
        console.log(`${id}: reader, drawing surfaces, native controls, responsive geometry and canonical assets passed`);
      } catch (error) {
        row.failure = error.stack;
        process.exitCode = 1;
        console.error(error.message);
      } finally {
        row.errors = errors;
        await page.close();
      }
    }
  } finally {
    await browser.close();
    for (const [file, digest] of Object.entries(sourceHashes)) assert.equal(hash(file), digest, `Source changed during check: ${file}`);
    assert.equal(hash(`${build}/.vite/manifest.json`), buildManifestHash, 'Build changed during check');
    fs.writeFileSync(`${output}/browser.json`, JSON.stringify({ checkedAt: new Date().toISOString(), base,
      build, buildManifestHash, sourceHashes, verifierHash: hash(__filename), records,
      limits: 'Rendered source/expert heuristic checks; model-specific edited/null investigations belong to author receipts. Screenshot capture alone is not visual approval.' }, null, 2) + '\n');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
