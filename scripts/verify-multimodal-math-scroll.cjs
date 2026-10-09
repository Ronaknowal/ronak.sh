// Focused closure for the equations that genuinely exceed the enlarged viewport.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4242';
const folder = 'docs/teaching/tokenization/multimodal-tokenization-visual-audio-video';
const receipt = process.env.MULTIMODAL_MATH_RECEIPT || `${folder}/math-scroll.json`;
if (fs.existsSync(receipt)) throw new Error('Do not overwrite retained evidence.');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files = ['src/learn/data/topics/multimodal-tokenization.jsx', 'src/learn/components/lesson-labs/MultimodalTokenizationFlow.jsx', 'src/learn/components/lesson-labs/multimodal-tokenization-flow.css', 'scripts/verify-multimodal-math-scroll.cjs'];
const sourceFiles = Object.fromEntries(files.map(p => [p, hash(p)]));
const report = { checkedAt: new Date().toISOString(), base, sourceFiles, buildManifestHash: hash('dist-multimodal-tokenization/.vite/manifest.json'), views: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/learn/path/full-curriculum/multimodal-tokenization-visual-audio-video?module=large-language-models`, { waitUntil: 'domcontentloaded' });
    await page.locator('.multimodal-flow').waitFor();
    for (const [width, zoom, name] of [[390, 1, 'phone'], [768, 2, 'enlarged']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(zoom => { document.documentElement.style.fontSize = zoom === 2 ? '32px' : ''; }, zoom);
      const equations = page.locator('.mm-math');
      const records = [];
      for (let i = 0; i < await equations.count(); i++) {
        const equation = equations.nth(i);
        const initial = await equation.evaluate(e => ({ width: e.clientWidth, scrollWidth: e.scrollWidth, position: e.scrollLeft }));
        if (initial.scrollWidth - initial.width <= 1) continue;
        await equation.scrollIntoViewIfNeeded();
        await equation.focus();
        assert.equal(await equation.evaluate(e => document.activeElement === e), true);
        for (let key = 0; key < 36; key++) await equation.press('ArrowRight');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        let position = await equation.evaluate(e => e.scrollLeft);
        assert.ok(position > 0, `Equation${i + 1}: focused ArrowRight did not scroll`);
        // Allow the browser's native smooth scrolling to settle through its frame loop.
        for (let frame = 0; frame < 30 && position < initial.scrollWidth - initial.width - 1; frame++) {
          await equation.press('ArrowRight');
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
          position = await equation.evaluate(e => e.scrollLeft);
        }
        assert.ok(position >= initial.scrollWidth - initial.width - 1, `Equation${i + 1}: final expression is still offscreen`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 1, 'Local scrolling widened the page');
        const screenshot = `${folder}/browser-accepted/screenshots/${name}-equation-${i + 1}-end.png`;
        await equation.screenshot({ path: screenshot, style: '.site-header,.site-skip{visibility:hidden!important}' });
        records.push({ equation: i + 1, ...initial, finalPosition: position, overflow, screenshot, screenshotSha256: hash(screenshot), control: 'Focused native ArrowRight key; no script-set scroll position' });
      }
      report.views.push({ width, zoom, name, equations: records });
    }
    assert.ok(report.views.some(view => view.equations.length), 'No actual overflowing equation was tested');
    for (const [file, digest] of Object.entries(sourceFiles)) assert.equal(hash(file), digest, `Source changed: ${file}`);
    report.passed = true;
    report.browser = browser.version();
  } catch (error) { report.passed = false; report.failure = String(error); throw error; }
  finally { fs.writeFileSync(receipt, JSON.stringify(report, null, 2) + '\n'); await browser.close(); console.log(JSON.stringify({ passed: report.passed, receipt, tested: report.views.reduce((n, v) => n + v.equations.length, 0) })); }
})().catch(error => { console.error(error); process.exitCode = 1; });
