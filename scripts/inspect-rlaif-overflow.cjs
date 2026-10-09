const fs = require('node:fs');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models');
  await page.locator('[data-rlaif-figure="D35"]').waitFor();
  for (let i = 1; i <= 35; i++) {
    const id = `D${String(i).padStart(2,'0')}`;
    await page.locator(`[data-rlaif-figure="${id}"]`).scrollIntoViewIfNeeded();
    await page.waitForFunction(id => {
      const node = document.querySelector(`[data-rlaif-figure="${id}"]`);
      return node && !node.querySelector('.rf-loading');
    }, id);
  }
  const viewportWidth = process.argv.includes('--enlarged') ? 768 : 390;
  await page.setViewportSize({ width:viewportWidth, height:1000 });
  await page.evaluate(font=>document.documentElement.style.fontSize=font+'px', process.argv.includes('--enlarged') ? 32 : 16);
  await page.waitForTimeout(300);
  const math = await page.locator('.katex-mathml').evaluateAll(nodes=>nodes.map(n=>({rect:{x:n.getBoundingClientRect().x,width:n.getBoundingClientRect().width,right:n.getBoundingClientRect().right},position:getComputedStyle(n).position,overflow:getComputedStyle(n).overflow,clip:getComputedStyle(n).clip,offset:n.offsetParent?.className,scroll:n.closest('.rf-scroll')?.scrollWidth,ancestors:[n.parentElement.className,n.parentElement.parentElement.className,n.parentElement.parentElement.parentElement.className]})));
  console.log(JSON.stringify({math}));
  const category = await page.evaluate(()=>{
    const results=[];
    for(const selector of ['.rf-figure','.rf-math','.lesson-code-source','.lesson-code','.katex-mathml','svg','pre']){
      const nodes=[...document.querySelectorAll(selector)], previous=nodes.map(n=>n.style.display);
      nodes.forEach(n=>n.style.display='none');
      results.push({selector,width:document.documentElement.scrollWidth,count:nodes.length});
      nodes.forEach((n,i)=>n.style.display=previous[i]);
    }
    return results;
  });
  console.log(JSON.stringify({category}));
  console.log(JSON.stringify({textOverflow:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(n=>n.scrollWidth>n.clientWidth+2&&getComputedStyle(n).overflowX==='visible'&&!n.closest('svg,.rf-scroll,pre,.lesson-code__body')).map(n=>({tag:n.tagName,class:n.className,text:n.textContent.slice(0,150),width:n.clientWidth,scroll:n.scrollWidth,rect:n.getBoundingClientRect().toJSON()})).slice(-70))}));
  const figureIsolation = await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('.rf-figure')],results=[];
    nodes.forEach(n=>n.style.display='none');
    for(const n of nodes){n.style.display=''; results.push({id:n.dataset.rlaifFigure,width:document.documentElement.scrollWidth,wide:[...n.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(0,7).map(x=>({tag:x.tagName,class:x.className?.baseVal??x.className,overflow:getComputedStyle(x).overflow,position:getComputedStyle(x).position,rect:x.getBoundingClientRect().toJSON()}))}); n.style.display='none';}
    nodes.forEach(n=>n.style.display='');return results.filter(x=>x.width>innerWidth);
  });
  console.log(JSON.stringify({figureIsolation}));
  console.log(JSON.stringify({D27:await page.locator('[data-rlaif-figure="D27"]').evaluate(n=>[n,...n.querySelectorAll('*')].filter(x=>!x.closest('svg')).map(x=>({tag:x.tagName,class:x.className,text:x.textContent.slice(0,70),rect:x.getBoundingClientRect().toJSON(),overflow:getComputedStyle(x).overflow,min:getComputedStyle(x).minWidth,width:getComputedStyle(x).width,scroll:x.scrollWidth})).filter(x=>x.rect.right>391||x.scroll>390))}));
  const result = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, windowWidth: innerWidth, offenders: [...document.querySelectorAll('body *')].filter(node => {
    const rect = node.getBoundingClientRect();
    return rect.right > innerWidth + 1 && !node.closest('svg,.rf-scroll,pre,.lesson-code__body');
  }).slice(0, 220).map(node => ({ tag: node.tagName, class: node.className?.baseVal ?? node.className, text: node.textContent.slice(0,120), rect: { x: node.getBoundingClientRect().x, right: node.getBoundingClientRect().right, width: node.getBoundingClientRect().width }, localScroll: node.closest('.rf-scroll')?.getBoundingClientRect().width, position: getComputedStyle(node).position, overflow: getComputedStyle(node).overflow, figure: node.closest('[data-rlaif-figure]')?.dataset.rlaifFigure })) }));
  const file = 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/browser-current/overflow-diagnostic.json';
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  await browser.close();
})();
