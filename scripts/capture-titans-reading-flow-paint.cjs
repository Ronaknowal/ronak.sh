const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://127.0.0.1:4861/', { waitUntil: 'networkidle' });
  await page.locator('[data-titans-view="rental-seed"]').scrollIntoViewIfNeeded();
  await page.locator('[data-titans-view="rental-seed"] svg').first().waitFor();
  const folder = 'scratch/reading-flow/titans-prototype/correction-evidence', seen = new Set(), pictures = [];
  fs.mkdirSync(folder, {recursive:true});
  for (const svg of await page.locator('.titans-drawing svg').all()) {
    const title = await svg.getAttribute('aria-label'); if (seen.has(title)) continue; seen.add(title);
    const scroll = svg.locator('..'); await scroll.scrollIntoViewIfNeeded();
    const [extent, paneWidth] = await scroll.evaluate(node => [Math.max(0, node.scrollWidth-node.clientWidth), node.clientWidth]);
    const index = String(pictures.length).padStart(2, '0'), paths = [];
    const panes = [['left', 0], ...(extent > paneWidth ? [['middle', extent/2]] : []), ['right', extent]];
    for (const [position, value] of panes) { if (position === 'right' && extent === 0) continue; await scroll.evaluate((node, value) => { node.scrollLeft = value; }, value); const path = `${folder}/drawing-${index}-${position}.png`; await scroll.screenshot({ path }); paths.push(path); }
    pictures.push({ title, paths });
  }
  fs.writeFileSync('docs/teaching/deep-learning-beginner/titans-multi-memory-architecture/reading-flow-correction-paint-index.json', JSON.stringify({ purpose: 'Actual corrected desktop scroll-pane paints for every distinct default drawing title; no resizing of drawings', pictures }, null, 2)+'\n');
  console.log(JSON.stringify({ distinctDrawings: pictures.length, actualPaneImages: pictures.reduce((n, p) => n+p.paths.length, 0) }));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
