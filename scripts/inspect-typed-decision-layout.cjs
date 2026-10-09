const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 768, height: 1000 } });
  await require('./lib/lesson-browser-fonts.cjs')(context);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4252/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models');
  await page.locator('[data-typed-figure="D36"] select').waitFor();
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  await page.locator('[data-typed-figure="D02"] input').check();
  await page.locator('[data-typed-figure="D35"] select').first().selectOption('2');
  await page.locator('[data-typed-figure="D36"] select').selectOption('description');
  const result = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => {
    const box = el.getBoundingClientRect();
    return box.right > innerWidth + 1 && !el.closest('.typed-scroll');
  }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0, 120), width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right, figure: el.closest('[data-typed-figure]')?.dataset.typedFigure })));
  fs.writeFileSync(`docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems/runtime-overflow-${Date.now()}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.typed-flow,.typed-figure,.lesson-guide,header,aside')].flatMap(el => {
    const before = document.documentElement.scrollWidth;
    const display = el.style.display; el.style.display = 'none';
    const after = document.documentElement.scrollWidth; el.style.display = display;
    return after < before ? [{class:el.className, figure:el.dataset.typedFigure,before,after}] : [];
  }))));
  console.log(JSON.stringify(await page.evaluate(() => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const found = [];
    while (walk.nextNode()) {
      const node = walk.currentNode; if (!node.textContent.trim() || node.parentElement.closest('.typed-scroll,pre,.katex')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if (range.getBoundingClientRect().right > innerWidth + 1) found.push({text:node.textContent.slice(0,200),parent:node.parentElement.className,right:range.getBoundingClientRect().right});
    } return found;
  })));
  console.log(JSON.stringify({result, layout: await page.evaluate(() => ({width: document.documentElement.scrollWidth, x: scrollX, viewport: innerWidth})), wide: await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(-30).map(el => ({tag:el.tagName, class:el.className, text:el.textContent.slice(0,60), right:el.getBoundingClientRect().right, parent:el.parentElement.className}))) }));
  await browser.close();
})();
