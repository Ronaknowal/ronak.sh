const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext({viewport:{width:768,height:1000}});
  await require('./lib/lesson-browser-fonts.cjs')(context);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation?module=large-language-models');
  await page.locator('[data-distill-figure="D28"]').waitFor({timeout:60000});
  await page.evaluate(() => document.documentElement.style.fontSize='32px');
  const report = await page.evaluate(() => ({width:document.documentElement.scrollWidth, outside:[...document.querySelectorAll('.distill-flow *')].filter(element => {
    const box=element.getBoundingClientRect();
    return box.right>innerWidth+1 && !element.closest('.distill-scroll,.distill-equation,.lesson-code-source,.lesson-code,.distill-token-grid');
  }).map(element=>({tag:element.tagName,class:String(element.className),text:element.textContent.slice(0,110),right:element.getBoundingClientRect().right})).slice(0,50)}));
  fs.writeFileSync('docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation/browser-evidence/layout-diagnosis.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  await browser.close();
})();
