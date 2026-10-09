const fs = require('node:fs');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 768, height: 1000 } });
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
  await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const results = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, objects: [...document.querySelectorAll('.prm-flow *')].filter(node => node.getBoundingClientRect().right > innerWidth + 1 && !node.closest('.prm-scroll, .prm-equation, .lesson-code pre')).map(node => ({ tag: node.tagName, class: String(node.className), width: node.getBoundingClientRect().width, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, text: node.textContent.slice(0, 110), parent: String(node.parentElement.className), whiteSpace: getComputedStyle(node).whiteSpace, overflow: getComputedStyle(node).overflowX })).sort((a, b) => b.right - a.right).slice(0, 20) }));
  fs.writeFileSync('docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/browser-initial/overflow.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
  await browser.close();
})();
