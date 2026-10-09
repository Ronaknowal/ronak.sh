const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const owners = [
  'src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/components/lesson-labs/LinearLogisticDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/RegressionInferenceDrawings.jsx',
  'src/learn/components/lesson-labs/linear-logistic-flow.css',
];
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const identity = Object.fromEntries(owners.map(path => [path, hash(path)]));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  await page.locator('[data-figure="regression-streaming-coefficients"]').waitFor({ timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  const views = [];
  for (const [width, textScale] of [[390, 1], [768, 2], [320, 1]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(scale => document.documentElement.style.fontSize = 16 * scale + 'px', textScale);
    await page.waitForTimeout(300);
    views.push(await page.evaluate(({ width, textScale }) => {
      const result = { width, textScale, figures: [], targetIssues: [] };
      for (const figure of document.querySelectorAll('.linear-logistic-lesson .regression-flow-drawing')) {
        const svg = figure.querySelector('svg');
        if (!svg) continue;
        const domain = svg.viewBox.baseVal;
        const labels = Array.from(svg.querySelectorAll('text')).map(text => {
          const box = text.getBBox();
          const matrix = text.getScreenCTM();
          return { text: text.textContent, x: box.x, y: box.y, width: box.width, height: box.height,
            physicalFont: parseFloat(getComputedStyle(text).fontSize) * Math.hypot(matrix.a, matrix.b) };
        });
        const outside = labels.filter(box => box.x < -.5 || box.y < -.5 ||
          box.x + box.width > domain.width + .5 || box.y + box.height > domain.height + .5);
        const collisions = [];
        for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) {
          const one = labels[a], two = labels[b];
          const overlapX = Math.min(one.x + one.width, two.x + two.width) - Math.max(one.x, two.x);
          const overlapY = Math.min(one.y + one.height, two.y + two.height) - Math.max(one.y, two.y);
          if (overlapX > 2 && overlapY > 2) collisions.push([one.text, two.text]);
        }
        result.figures.push({ name: figure.dataset.figure, labels: labels.length,
          minimumFont: Math.min(...labels.map(row => row.physicalFont)), outside, collisions });
      }
      for (const control of document.querySelectorAll('.linear-logistic-lesson .flow-controls input,.linear-logistic-lesson select,.linear-logistic-lesson .regression-flow-actions button')) {
        const box = control.getBoundingClientRect();
        if (box.height < 43.99) result.targetIssues.push({ name: control.getAttribute('aria-label') || control.textContent, height: box.height });
      }
      return result;
    }, { width, textScale }));
  }
  const at = new Date().toISOString();
  const suffix = process.argv[2] || at.replace(/[:.]/g, '-');
  const receipt = { at, scope: 'Author actual current glyph/target triage; collisions require semantic/pixel interpretation and are not independent acceptance',
    sourceHashes: identity, views };
  fs.writeFileSync(folder + '/reading-flow-layout-' + suffix + '.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(views.map(view => ({
    width: view.width, scale: view.textScale, targets: view.targetIssues.length,
    figures: view.figures.length,
    outside: view.figures.filter(row => row.outside.length).map(row => ({ name: row.name, text: row.outside.map(item => item.text) })),
    collisions: view.figures.filter(row => row.collisions.length).map(row => ({ name: row.name, labels: row.collisions })),
  }))));
  for (const path of owners) if (hash(path) !== identity[path]) throw Error('Source changed during triage: ' + path);
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
