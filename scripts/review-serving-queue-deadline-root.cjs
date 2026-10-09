const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs');
const base='docs/teaching/llm-architecture-training/queueing-theory-for-llm-serving/runtime-review-root';
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
const page=await b.newPage({viewport:{width:1366,height:1000}});
await page.goto('http://127.0.0.1:4263/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models');
const f=page.locator('[data-queue-figure="D20"]');await f.waitFor();
await f.getByLabel(/Estimated queue delay/).fill('0');
const svg=f.locator('svg').first();await svg.evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
await page.mouse.move(700,400);await page.mouse.wheel(0,-200);await page.waitForTimeout(300);
const box=await svg.boundingBox();await page.screenshot({path:base+'/deadline-zero-estimate-current.png',clip:box});
fs.writeFileSync(base+'/deadline-zero-estimate-current.json',JSON.stringify({box,labels:await svg.locator('text').evaluateAll(ns=>ns.map(n=>{const r=n.getBBox();return {text:n.textContent,box:{x:r.x,y:r.y,width:r.width,height:r.height}}})),note:'Actual SVG aligned within viewport; earlier top-clipped capture and two failed acquisition attempts are not label evidence.'},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
