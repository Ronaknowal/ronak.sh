const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const out=`${folder}/browser-author-successor`;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=['src/learn/components/lesson-labs/CurationPipelineFlow.jsx','src/learn/components/lesson-labs/curation-pipeline-flow.css','src/learn/data/curation-pipeline-models.js',`${folder}/lesson.jsx`];
(async()=>{
fs.mkdirSync(out,{recursive:true});
const before=Object.fromEntries(files.map(p=>[p,sha(p)])),checks=[],captures=[],errors=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
const context=await browser.newContext();await require('./lib/lesson-browser-fonts.cjs')(context);
const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
await page.request.get('http://127.0.0.1:4250/__llm_refresh');
await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models');
const fig=id=>page.locator(`[data-curation-figure="${id}"]`);
await fig('C01').waitFor({timeout:90000});
const capture=async(loc,name)=>{await loc.scrollIntoViewIfNeeded();const p=`${out}/${name}.png`;await loc.screenshot({path:p,style:'.site-header--learn,.site-skip{visibility:hidden!important}'});captures.push(p);};
for(const [name,width,size] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
 await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,size);
 const flow=fig('C16'),audit=fig('C17');
 assert.match(await flow.innerText(),/C .90/);assert.match(await flow.innerText(),/repetition only/);
 await capture(flow,`${name}-C16-base`);
 await capture(audit,`${name}-C17-base`);
 await audit.getByRole('button',{name:'Change C score to .40: fail both',exact:true}).click();
 await audit.getByRole('button',{name:'Curator → repetition',exact:true}).click();
 assert.match(await audit.innerText(),/first-removal reason is curator/);
 assert.match(await audit.innerText(),/inclusive failures stay repetition and curator/);
 await capture(audit,`${name}-C17-overlap-reversed`);
 await audit.getByRole('button',{name:'Restore C score .90',exact:true}).click();
 assert.match(await audit.innerText(),/first-removal reason is repetition/);
 await audit.getByRole('button',{name:'Repetition → curator',exact:true}).click();
 for(const id of ['C04','C11','C13','C17','C18','C21']){
  const tables=fig(id).locator('.curation-table-object');
  for(let i=0;i<await tables.count();i++){
   const table=tables.nth(i),region=table.getByRole('region');
   const geometry=await region.evaluate(el=>({width:el.clientWidth,total:el.scrollWidth}));
   if(geometry.total>geometry.width+1){
    await table.locator('.curation-scroll-cue').waitFor();await region.focus();await region.press('ArrowRight');
    await page.waitForFunction(el=>el.scrollLeft>0,await region.elementHandle());
    await region.evaluate(el=>el.scrollLeft=el.scrollWidth);
   }else assert.equal(await table.locator('.curation-scroll-cue').count(),0);
   await capture(table,`${name}-${id}-table${i}-right`);await region.evaluate(el=>el.scrollLeft=0);
  }
 }
 const product=fig('C12').locator('.curation-scroll-shell');
 const region=product.getByRole('region');await region.evaluate(el=>el.scrollLeft=el.scrollWidth);
 await capture(product,`${name}-C12-product`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 checks.push(`${name}: coherent base/overlap policy, visible outside captions, overflow-only cues, keyboard pan and rightmost columns`);
}
assert.deepEqual(errors,[]);assert.deepEqual(Object.fromEntries(files.map(p=>[p,sha(p)])),before);
fs.writeFileSync(`${out}/report.json`,JSON.stringify({status:'passed',files:before,checks,captures:Object.fromEntries(captures.map(p=>[p,sha(p)])),errors,scope:'Only R1/R3 successor presentation; native fits and full content unchanged'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checks,captures:captures.length}));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
