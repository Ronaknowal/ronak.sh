const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const base='docs/teaching/llm-architecture-training/queueing-theory-for-llm-serving';
const out=base+'/runtime-review-root';
fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const packet=JSON.parse(fs.readFileSync(base+'/runtime-inputs.json'));
 for(const [p,h] of Object.entries(packet.files))assert.equal(sha(p),h,p);
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const checks=[];
 try{
  await page.goto('http://127.0.0.1:4263/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models',{waitUntil:'domcontentloaded'});
  const fig=id=>page.locator(`[data-queue-figure="${id}"]`);
  await fig('D28').waitFor();
  assert.equal(await page.locator('[data-queue-figure]').count(),28);
  for(const [id,label,value,name] of [
   ['D01','Output timestamps (seconds, comma separated)','1, 1, 1','coincident-output'],
   ['D04','Editable offered times (seconds)',Array(20).fill('0').join(', '),'twenty-coincident-arrivals'],
  ]){
   const f=fig(id);await f.getByLabel(label).fill(value);await f.scrollIntoViewIfNeeded();
   await f.screenshot({path:`${out}/${name}.png`});
   checks.push({name,text:await f.innerText(),svg:await f.locator('svg').evaluate(n=>({viewBox:n.getAttribute('viewBox'),marks:[...n.querySelectorAll('text,rect')].map(x=>({type:x.tagName,text:x.textContent,x:x.getAttribute('x'),y:x.getAttribute('y'),width:x.getAttribute('width'),height:x.getAttribute('height')}))}))});
   await f.getByRole('button',{name:'Reset',exact:true}).click();
  }
  const deadline=fig('D20');await deadline.getByLabel(/Estimated queue delay/).fill('0');await deadline.scrollIntoViewIfNeeded();
  await deadline.locator('svg').first().screenshot({path:`out/deadline-zero-estimate.png`.replace('out/',out+'/')});
  checks.push({name:'zero-estimated-wait',text:await deadline.innerText()});
  const routing=fig('D19');await routing.scrollIntoViewIfNeeded();await routing.locator('svg').screenshot({path:`${out}/routing-label-contrast.png`});
  checks.push({name:'routing-text-fill',nodes:await routing.locator('svg text').evaluateAll(ns=>ns.map(n=>({text:n.textContent,fill:getComputedStyle(n).fill})))});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/bounded-observations.json',JSON.stringify({reviewer:'/root',inputSha256:sha(base+'/runtime-inputs.json'),verifiedBindings:Object.keys(packet.files).length,checks,errors,note:'Diagnostic current rendered observations; findings await complete whole review. No scientific execution.'},null,2)+'\n');
  console.log(JSON.stringify({observations:checks.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
