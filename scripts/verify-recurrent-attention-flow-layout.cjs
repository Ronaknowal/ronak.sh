const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const crypto = require('node:crypto');
const folder = 'docs/teaching/deep-learning-beginner/attention-mechanism-bahdanau-luong/';
const url = process.env.ATTENTION_REVIEW_URL || 'http://127.0.0.1:4826/scratch/attention-reading-flow/index.html';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  fs.mkdirSync(folder + 'screenshots/reading-flow', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  const errors = [], layouts = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('.attention-lesson').waitFor();
  await page.locator('#attention-fitted-source').scrollIntoViewIfNeeded();
  await page.locator('#attention-fitted-source .flow-readout').filter({ hasText: 'cashed' }).waitFor();
  for (const [width, zoom] of [[1366, 1], [768, 1], [768, 2], [390, 1], [320, 1]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(async zoom => { document.documentElement.style.fontSize = zoom * 100 + '%'; await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }, zoom);
    const result = await page.locator('.attention-lesson').evaluate(root => ({
      rootWidth: root.getBoundingClientRect().width, overflow: root.scrollWidth - root.clientWidth,
      svg: [...root.querySelectorAll('svg.attention-flow-drawing')].map(svg => ({
        name: svg.closest('[data-figure]').dataset.figure,
        width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height,
        spill: [...svg.querySelectorAll('text')].flatMap(text => {
          const b = text.getBBox(), v = svg.viewBox.baseVal;
          return b.x < -.5 || b.y < -.5 || b.x + b.width > v.width + .5 || b.y + b.height > v.height + .5
            ? [{ text: text.textContent, x: b.x, y: b.y, width: b.width, height: b.height }] : [];
        }),
      })),
    }));
    layouts.push({ width, zoom, ...result });
    if (width === 390 || zoom === 2) {
      for (const [index, figure] of (await page.locator('figure[data-figure]').all()).entries()) {
        const name = await figure.getAttribute('data-figure');
        await figure.screenshot({ path: folder + `screenshots/reading-flow/current-${name}-${index}-${width}-${zoom}.png` });
      }
    }
  }
  await browser.close();
  const files = ['src/learn/data/topics/attention.jsx', 'src/learn/components/lesson-labs/RecurrentAttentionDrawings.jsx',
    'src/learn/components/lesson-labs/RecurrentAttentionFlowLabs.jsx', 'src/learn/components/lesson-labs/recurrent-attention-flow.css'];
  const report = { passed: !errors.length && layouts.every(row => row.overflow === 0 && row.svg.every(svg => svg.height > 0 && !svg.spill.length)),
    checkedAt: new Date().toISOString(), url, errors, layouts, sourceHashes: Object.fromEntries(files.map(file => [file, hash(file)])),
    limits: 'Actual current isolated rendering and five viewport bounds. Manual interior inspection and full production interactions are distinct.' };
  fs.writeFileSync(folder + 'reading-flow-layout.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, errors, layouts: layouts.map(row => ({ width: row.width, zoom: row.zoom,
    overflow: row.overflow, figures: row.svg.filter(svg => svg.spill.length) })) }));
})().catch(error => { console.error(error); process.exitCode = 1; });
