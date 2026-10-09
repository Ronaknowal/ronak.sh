const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/deep-learning-beginner/state-space-models-s4-mamba-mamba-2';
const names = ['StateSpaceDrawings.jsx', 'StateSpaceStructureDrawings.jsx', 'StateSpaceArchitectureDrawings.jsx', 'StateSpaceBlockDrawings.jsx', 'StateSpaceLearningDrawings.jsx', 'StateSpaceExtensionDrawings.jsx', 'StateSpaceLinePlot.jsx', 'StateSpaceMemoryFigures.jsx', 'StateSpaceFlowLabs.jsx', 'StateSpaceTrajectoryFlow.jsx', 'StateSpaceLearningEvidence.jsx', 'StateSpaceLabs.jsx', 'state-space-flow.css'];
const sources = [...names.map(name => `src/learn/components/lesson-labs/${name}`), 'src/learn/data/topics/state-space-models-s4-mamba-mamba-2.jsx', 'scratch/state-space-reading-flow/main.jsx'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  const errors = [], layouts = [], screenshots = [], sourceHashes = Object.fromEntries(sources.map(file => [file, hash(file)]));
  page.on('pageerror', error => errors.push(error.message));
  fs.mkdirSync('scratch/state-space-reading-flow/geometry', { recursive: true });
  let failure;
  try {
    await page.goto('http://127.0.0.1:4835/', { waitUntil: 'networkidle' });
    if (!(await page.locator('h1').innerText()).includes('whole reading-flow')) throw Error('Expected current whole lesson');
    for (const [width, scale] of [[390, 1], [768, 2]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = `${16 * value}px`; }, scale);
      await page.evaluate(() => document.fonts.ready);
      // Fetch viewport-owned sources/case only after reaching their actual lab.
      await page.locator('.state-trajectory-flow').scrollIntoViewIfNeeded();
      await page.locator('#ssm-trajectory-point').waitFor();
      const layout = await page.evaluate(() => {
        function touches(a, b, box) {
          const dx = b.x - a.x, dy = b.y - a.y;
          let low = 0, high = 1;
          for (const [p, q] of [[-dx, a.x - box.x], [dx, box.x + box.width - a.x], [-dy, a.y - box.y], [dy, box.y + box.height - a.y]]) {
            if (p === 0) { if (q < 0) return false; }
            else { const t = q / p; if (p < 0) low = Math.max(low, t); else high = Math.min(high, t); }
            if (low > high) return false;
          }
          return true;
        }
        const figures = [...document.querySelectorAll('.state-flow-drawing')];
        return { scrollWidth: document.documentElement.scrollWidth, figures: figures.map((figure, ordinal) => {
          const svg = figure.querySelector('svg'), view = svg.viewBox.baseVal;
          const labels = [...svg.querySelectorAll('text')].map(text => ({ text: text.textContent, box: text.getBBox() }));
          const segments = [...svg.querySelectorAll('polyline')].flatMap(line => [...Array(line.points.numberOfItems - 1)].map((_, i) => [line.points.getItem(i), line.points.getItem(i + 1)]));
          return { name: figure.dataset.figure, ordinal,
            outOfBounds: labels.filter(({ box }) => box.x < -1 || box.y < -1 || box.x + box.width > view.width + 1 || box.y + box.height > view.height + 1).map(label => label.text),
            overlaps: labels.flatMap((a, i) => labels.slice(i + 1).filter(b => Math.min(a.box.x + a.box.width, b.box.x + b.box.width) - Math.max(a.box.x, b.box.x) > 1 && Math.min(a.box.y + a.box.height, b.box.y + b.box.height) - Math.max(a.box.y, b.box.y) > 1).map(b => [a.text, b.text])),
            wireLabels: labels.filter(({ box }) => segments.some(([a, b]) => touches(a, b, { x: box.x + 1, y: box.y + 1, width: Math.max(0, box.width - 2), height: Math.max(0, box.height - 2) }))).map(label => label.text),
          };
        }) };
      });
      layouts.push({ width, scale, ...layout });
      for (const figure of layout.figures.filter(value => value.outOfBounds.length || value.overlaps.length || value.wireLabels.length)) {
        const path = `scratch/state-space-reading-flow/geometry/${figure.ordinal}-${width}-${scale}.png`;
        await page.locator('.state-flow-drawing').nth(figure.ordinal).screenshot({ path });
        screenshots.push({ name: figure.name, width, scale, path, sha256: hash(path) });
      }
    }
  } catch (error) { failure = error.stack; }
  await browser.close();
  fs.writeFileSync(`${folder}/reading-flow-layout-draft.json`, JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'Mutable current whole-page diagram triage; findings require interpretation and repair, not final browser certification', sourceHashes, layouts, screenshots, errors, failure }, null, 2));
  console.log(JSON.stringify({ failure, errors, layouts: layouts.map(({ width, scale, scrollWidth, figures }) => ({ width, scale, scrollWidth, findings: figures.filter(figure => figure.outOfBounds.length || figure.overlaps.length || figure.wireLabels.length) })) }));
})();
