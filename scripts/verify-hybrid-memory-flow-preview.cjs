// Current whole-manuscript preview checks; production integration remains separate.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const record = 'docs/teaching/deep-learning-beginner/hybrid-ssm-transformer-architectures-jamba';
const identityFiles = ['docs/teaching/drafts/hybrid-ssm-transformer-architectures-jamba/lesson.md',
  'src/learn/components/lesson-labs/HybridMemoryFlowFigures.jsx', 'src/learn/components/lesson-labs/HybridMemoryFlowLabs.jsx',
  'src/learn/components/lesson-labs/HybridMemoryFlowStudy.jsx', 'src/learn/components/lesson-labs/hybrid-memory-flow.css',
  'src/learn/data/hybrid-memory-flow-models.js', 'scripts/lib/hybrid-memory-reading-flow-renderer.mjs',
  'scratch/reading-flow/hybrid-authored-preview.jsx', 'scripts/verify-hybrid-memory-flow-preview.cjs'];
const hashes = () => Object.fromEntries(identityFiles.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const sourceHashes = hashes();
const checks = [], errors = [], layouts = [], paints = [];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const folder = path.join(record, 'screenshots', `reading-flow-preview-${stamp}`);
fs.mkdirSync(folder, { recursive: true });
let browser;

(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });
  const requested = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/learn-assets/')) requested.push(request.url()); });
  await page.goto('http://127.0.0.1:4850/?manuscript');
  await page.getByRole('heading', { name: 'Hybrid SSM–Transformer Architectures: Jamba and Complementary Memory', exact: true }).waitFor();
  await page.locator('#hybrid-record-edit').waitFor();
  assert.equal(requested.filter(url => /model-.*\.json/.test(url)).length, 0);
  checks.push('Current new prose served; selected model arrays deferred before the study');

  const readBefore = await page.locator('#hybrid-summary-read .flow-readout').innerText();
  const value = page.locator('#hybrid-record-edit').getByRole('slider', { name: 'Stored value', exact: true });
  await value.focus(); await value.press('ArrowRight');
  assert.notEqual(await page.locator('#hybrid-summary-read .flow-readout').innerText(), readBefore);
  await page.getByRole('button', { name: 'Reset memory case', exact: true }).click();
  assert.equal(await value.inputValue(), '2');
  checks.push('Keyboard record edit updates linked summary/addressed output; complete reset restores original values');

  const tinyInput = page.locator('#hybrid-tiny-objects').getByRole('slider', { name: 'Mixer input coordinate 0', exact: true });
  const tinyBefore = await page.locator('#hybrid-tiny-output .flow-readout').innerText();
  await tinyInput.focus(); await tinyInput.press('ArrowRight');
  assert.notEqual(await page.locator('#hybrid-tiny-output .flow-readout').innerText(), tinyBefore);
  for (const view of ['objects', 'coefficients', 'state', 'output']) {
    assert.equal(await page.locator(`#hybrid-tiny-${view}`).getByRole('slider', { name: 'Mixer input coordinate 0', exact: true }).inputValue(), '2.05');
  }
  checks.push('Four selective views share one edited input; every intermediate and current result stays linked');

  const selection = page.locator('#hybrid-study-selection');
  await selection.scrollIntoViewIfNeeded();
  await selection.locator('.flow-readout').waitFor();
  assert.equal(requested.filter(url => /model-.*\.json/.test(url)).length, 1);
  assert.ok(requested.some(url => url.includes('model-MAM-37.json')));
  assert.ok(!requested.some(url => url.includes('stroke-results.json')));
  checks.push('Exactly selected MAM-37 array loads on study reach; large scientific results remain optional');
  const edit = page.locator('#hybrid-study-edit');
  const x = edit.getByRole('slider', { name: 'Point x', exact: true });
  const xOriginal = await x.inputValue(); await x.focus(); await x.press('ArrowRight');
  const edited = await x.inputValue(); assert.notEqual(edited, xOriginal);
  await selection.getByRole('combobox', { name: 'Saved small model', exact: true }).selectOption('AAA-37');
  await selection.locator('.flow-readout').filter({ hasText: 'AAA-37' }).waitFor();
  assert.equal(await x.inputValue(), edited);
  assert.equal(await page.locator('#hybrid-study-state input[type="range"]').count(), 0);
  checks.push('Switching saved model preserves edited coordinates; A layer removes irrelevant recurrent-state controls');
  await selection.getByRole('combobox', { name: 'Saved small model', exact: true }).selectOption('MAM-37');
  await selection.locator('.flow-readout').filter({ hasText: 'MAM-37' }).waitFor();
  await page.getByRole('button', { name: 'Reset every linked study view', exact: true }).click();
  assert.equal(await x.inputValue(), xOriginal);
  assert.equal(await page.getByRole('checkbox', { name: 'Clear only attention K/V', exact: true }).isChecked(), true);
  assert.equal(await page.getByRole('checkbox', { name: 'Clear H and its short history', exact: true }).isChecked(), false);
  checks.push('Entire study reset restores source, selections, input and every independent fault flag');

  for (const [width, scale] of [[390, 1], [320, 1], [1366, 1], [768, 2]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(scale => document.documentElement.style.fontSize = `${16 * scale}px`, scale);
    const geometry = await page.evaluate(() => {
      const problems = [], fonts = [];
      for (const svg of document.querySelectorAll('.hybrid-flow-drawing svg')) {
        const box = svg.viewBox.baseVal;
        for (const text of svg.querySelectorAll('text')) {
          const b = text.getBBox(), m = text.getScreenCTM();
          const pixels = parseFloat(getComputedStyle(text).fontSize) * Math.hypot(m.a, m.b);
          fonts.push(pixels);
          if (b.x < -.5 || b.x + b.width > box.width + .5 || b.y < -.5 || b.y + b.height > box.height + .5)
            problems.push({ figure: svg.closest('figure').dataset.figure, text: text.textContent, bounds: [b.x, b.y, b.width, b.height], viewBox: [box.width, box.height] });
        }
      }
      return { problems, minimumDiagramPixels: Math.min(...fonts),
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 2,
        maxLocalControls: Math.max(...Array.from(document.querySelectorAll('.flow-controls')).map(row => row.querySelectorAll('button,select,input').length)),
        smallControls: Array.from(document.querySelectorAll('.flow-controls button,.flow-controls select,.flow-controls input[type="range"]')).filter(control => control.getBoundingClientRect().height < 43.5).map(control => control.outerHTML.slice(0, 200)) };
    });
    layouts.push({ width, scale, ...geometry });
    assert.equal(geometry.pageOverflow, false);
    assert.equal(geometry.problems.length, 0, JSON.stringify(geometry.problems));
    assert.ok(geometry.minimumDiagramPixels >= 15.9 * scale);
    assert.ok(geometry.maxLocalControls <= 3);
    assert.equal(geometry.smallControls.length, 0, JSON.stringify(geometry.smallControls));
    if (width === 390 || scale === 2) {
      for (const figure of ['hybrid-two-residuals', 'hybrid-causal-pairs', 'hybrid-trained-stack', 'hybrid-fit-histories', 'hybrid-alternative-routes', 'hybrid-application-interventions']) {
        const element = page.locator(`[data-figure="${figure}"]`).first();
        await element.scrollIntoViewIfNeeded();
        for (const side of ['initial', 'right']) {
          await element.locator('.hybrid-flow-scroll').first().evaluate((node, side) => node.scrollLeft = side === 'initial' ? 0 : node.scrollWidth, side);
          const file = path.join(folder, `${figure}-${width}-${scale}-${side}.png`);
          await element.screenshot({ path: file }); paints.push(file.replaceAll('\\', '/'));
        }
      }
    }
  }
  const currentHashes = hashes(); assert.deepEqual(currentHashes, sourceHashes);
  assert.deepEqual(errors, []);
  const receipt = { purpose: 'Author full manuscript preview; neither final production nor independent paint acceptance', passed: true, sourceHashes, checks, layouts, errors, paints,
    requestedStudyAssets: requested.filter(url => /model-.*\.json/.test(url)), largeResultsFetched: requested.some(url => url.includes('stroke-results.json')) };
  fs.writeFileSync(`${record}/reading-flow-preview-${stamp}.json`, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, groups: checks.length, layouts: layouts.length, paints: paints.length, receipt: `${record}/reading-flow-preview-${stamp}.json` }));
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });
