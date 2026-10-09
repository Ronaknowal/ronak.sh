const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base='docs/teaching/llm-architecture-training/decoding-strategies-greedy-beam-top-k-top-p-temperature';
const dir=base+'/runtime-review-root';fs.mkdirSync(dir,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={reviewer:'/root',checks:[],fonts:[],images:[],sources:{},passed:false};
 const inputs=JSON.parse(fs.readFileSync(base+'/runtime-inputs.json'));
 for(const p of Object.keys(inputs.files).filter(p=>p.startsWith('src/learn/components/lesson-labs/Decoding')||p.endsWith('decoding-strategies-flow.css')||p.endsWith('decoding-strategies-models.js')||p===base+'/lesson.jsx'))report.sources[p]=sha(p);
 try{
 for(const [name,width,size] of [['phone',390,16],['enlarged',768,32],['desktop',1366,16]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(inputs.url,{waitUntil:'domcontentloaded'});
  await page.locator('[data-decoding-figure="D01"]').waitFor();
  await page.addStyleTag({content:`html{font-size:${size}px!important}`});
  for(let n=1;n<=30;n++){
   const id='D'+String(n).padStart(2,'0'),f=page.locator(`[data-decoding-figure="${id}"]`);
   await f.scrollIntoViewIfNeeded();
   await f.locator('input,select,svg,table,pre').first().waitFor();
   await page.waitForTimeout(160);
   const fonts=await f.locator('svg text').evaluateAll(nodes=>nodes.map(t=>({text:t.textContent.trim(),size:parseFloat(getComputedStyle(t).fontSize)*t.getScreenCTM().a})).filter(t=>t.text));
   report.fonts.push({profile:name,id,min:fonts.length?Math.min(...fonts.map(x=>x.size)):null,small:fonts.filter(x=>x.size<12).slice(0,8)});
   if(['D05','D17','D23'].includes(id)){
    const s=f.locator('.decoding-local').first();await s.scrollIntoViewIfNeeded();
    await s.evaluate(e=>{e.scrollLeft=e.scrollWidth;});
    const file=`${dir}/${name}-${id}-right.png`;await s.screenshot({path:file});report.images.push(file);
   }
  }
  report.checks.push({name:`${name} all30 mounted no errors`,passed:errors.length===0,errors});
  report.checks.push({name:`${name} no page overflow`,passed:await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)});
  if(name==='desktop')fs.writeFileSync(dir+'/rendered-text.txt',await page.locator('.decoding-flow').innerText());
  await page.close();
 }
 report.passed=report.checks.every(c=>c.passed);
 }catch(e){report.failure=String(e);throw e;}finally{await browser.close();fs.writeFileSync(dir+'/browser-inspection.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,images:report.images.length,small:report.fonts.filter(r=>r.small.length).map(r=>({profile:r.profile,id:r.id,min:r.min})),failure:report.failure}));}
})();
