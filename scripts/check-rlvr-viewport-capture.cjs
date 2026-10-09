const fs = require('node:fs');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const capture = require('./lib/rlvr-browser-capture.cjs');
const dir = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/runtime-browser-capture/root-viewport-proof';
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
    await page.goto('http://127.0.0.1:4254/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models', { timeout: 90000 });
    const figure = page.locator('[data-rlvr-figure="D37"]');
    await figure.waitFor({ timeout: 90000 });
    await figure.locator('select').selectOption('tulu');
    const result = await capture(page, figure, `${dir}/desktop-D37-tulu.png`);
    console.log(JSON.stringify({ passed: true, tiles: result.tiles.length, height: result.finalHeight, covered: result.covered }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
