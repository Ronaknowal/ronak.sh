// Topic-owned author preview check; no science writer, training, shared build or publication.
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const record = 'docs/teaching/deep-learning-beginner/mini-batches-training-loops-gradient-accumulation';
const hash = file => ({ path: file.replaceAll('\\','/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), bytes: fs.statSync(file).size });
async function main() {
  const stamp = new Date().toISOString().replaceAll(':','-'), output = `${record}/paint-foundation/${stamp}`;
  fs.mkdirSync(output,{recursive:true});
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const checks=[], paintings=[], errors=[];
  for (const [name,width,root] of [['desktop',1366,16],['phone',390,16],['narrow',320,16],['enlarged',768,32]]) {
    const page=await browser.newPage({viewport:{width,height:1000}});
    page.on('pageerror',error=>errors.push({name,message:error.message}));
    await page.goto('http://127.0.0.1:4863/',{waitUntil:'networkidle'});
    await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,root);
    const figures=await page.locator('.mb-drawing').count();
    for(let i=0;i<figures;i++) {
      const figure=page.locator('.mb-drawing').nth(i);
      const actual=await figure.evaluate(element=>{
        const svg=element.querySelector('svg'),bounds=svg.getBoundingClientRect(),scale=bounds.width/svg.viewBox.baseVal.width;
        return {label:element.dataset.mbDrawing,client:element.querySelector('.mb-drawing-scroll').clientWidth,scroll:element.querySelector('.mb-drawing-scroll').scrollWidth,
          minGlyph:Math.min(...[...svg.querySelectorAll('text')].map(text=>parseFloat(getComputedStyle(text).fontSize)*scale)),
          hint:!!element.querySelector('.mb-pan-hint'),texts:[...svg.querySelectorAll('text')].map(text=>text.textContent)};
      });
      if(actual.minGlyph<root-.01)throw new Error(`${name}: undersized actual glyph ${actual.label}`);
      if(actual.scroll>actual.client+1&&!actual.hint)throw new Error(`${name}: missing actual pan hint`);
      checks.push({name,...actual});
      if((name==='phone'&&[0,2,3,4].includes(i))||(name==='enlarged'&&[2,3].includes(i))) {
        await figure.scrollIntoViewIfNeeded();
        const target=path.join(output,`${name}-${i}-initial.png`);await figure.screenshot({path:target});paintings.push(hash(target));
        if(actual.scroll>actual.client+1){await figure.locator('.mb-drawing-scroll').evaluate(el=>el.scrollLeft=el.scrollWidth-el.clientWidth);const right=path.join(output,`${name}-${i}-right.png`);await figure.screenshot({path:right});paintings.push(hash(right));}
      }
    }
    const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(pageWidth>width+1)throw new Error(`${name}: full page overflow ${pageWidth}`);
    checks.push({name,pageWidth,viewport:width});await page.close();
  }
  await browser.close();if(errors.length)throw new Error(JSON.stringify(errors));
  const sources=['src/learn/components/lesson-labs/MinibatchLoopFlowFigures.jsx','src/learn/components/lesson-labs/minibatch-loop-flow.css','src/learn/data/minibatch-loop-flow-models.js',`${record}/preview/main.jsx`,`${record}/preview/index.html`,'scripts/lib/minibatch-loop-flow-preview.mjs','scripts/verify-minibatch-loop-flow-preview.cjs'];
  const result={status:'PASS',scope:'author foundational preview only; no full lesson certification',url:'http://127.0.0.1:4863/',created_utc:new Date().toISOString(),sources:sources.map(hash),checks,paintings,errors};
  const file=`${output}/checks.json`;fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(JSON.stringify({file,checks:checks.length,paintings:paintings.length,errors}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
