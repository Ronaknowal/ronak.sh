const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const capture=require('./lib/kv-cache-browser-capture.cjs');
const b='docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const out=path.resolve(b,'runtime-review-root','paint');
fs.mkdirSync(out,{recursive:true});
const sources=[`${b}/lesson.jsx`,`${b}/lesson.md`,'src/learn/data/continuous-batching-models.js',...['Shared','Structures','Foundations','Storage','Serving'].map(n=>`src/learn/components/lesson-labs/ContinuousBatching${n}.jsx`),'src/learn/components/lesson-labs/continuous-batching-flow.css','public/learn-assets/continuous-batching-pagedattention/observations.json'];
const hashes=()=>Object.fromEntries(sources.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report={purpose:'DIFFERENT current entire figure paint review and targeted independent concern inspection; no scientific replay',before:hashes(),captures:[],pageErrors:[]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:1000}});
  await require('./lib/lesson-browser-fonts.cjs')(context);
  const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.request.get('http://127.0.0.1:4261/__llm_refresh');
  await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models');
  await page.locator('[data-cb-figure="D25"] select').first().waitFor();
  await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}'});
  const shot=async(name,loc)=>{const file=path.join(out,name+'.png');const r=await capture(page,loc,file);report.captures.push({name,file,tiles:r.tiles.map(t=>t.path)});};
  for(let i=1;i<=30;i++)await shot(`desktop-D${String(i).padStart(2,'0')}`,page.locator(`[data-cb-figure="D${String(i).padStart(2,'0')}"]`));
  const d5=page.locator('[data-cb-figure="D05"]'),d20=page.locator('[data-cb-figure="D20"]');
  await d5.getByRole('slider',{name:/Query-row budget/}).fill('2');await shot('desktop-D05-two-query-rows',d5);
  await d20.getByRole('combobox',{name:'Chunk rows',exact:true}).selectOption('2');await shot('desktop-D20-six-chunks',d20);
  for(const [width,font,name] of [[390,16,'phone'],[768,32,'enlarged']]){
   await page.setViewportSize({width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);
   for(const id of ['D05','D08','D10','D15','D17','D20','D23','D26','D27','D30'])await shot(`${name}-${id}`,page.locator(`[data-cb-figure="${id}"]`));
  }
  report.after=hashes();report.sourceStable=JSON.stringify(report.before)===JSON.stringify(report.after);
 }catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,captures:report.captures.length,stable:report.sourceStable,errors:report.pageErrors,failure:report.failure}));}
})();
