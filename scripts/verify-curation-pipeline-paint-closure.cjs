const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const out=`${folder}/browser-author-closure`;
fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[`${folder}/lesson.jsx`,'src/learn/components/lesson-labs/CurationPipelineFlow.jsx','src/learn/components/lesson-labs/curation-pipeline-flow.css','src/learn/data/curation-pipeline-models.js','src/learn/data/curation-pipeline-recorded-study.json'];
async function main(){
 const previous=JSON.parse(fs.readFileSync(`${folder}/browser-author-corrected/report.json`));
 for(const p of files.filter(p=>!p.endsWith('CurationPipelineFlow.jsx')))assert.equal(sha(p),previous.files[p],p);
 const numeric=JSON.parse(fs.readFileSync(`${folder}/runtime-model-checks.json`));
 for(const p of files.filter(p=>p.includes('/data/')))assert.equal(sha(p),numeric.files[p],p);
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage();const errors=[],checks=[],captures=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.request.get('http://127.0.0.1:4250/__llm_refresh');
 await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models');
 await page.locator('[data-curation-figure="C01"]').waitFor({timeout:120000});
 const capture=async(locator,name)=>{await locator.scrollIntoViewIfNeeded();const p=`${out}/${name}.png`;await locator.screenshot({path:p,style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});captures.push(p);};
 for(const [name,width,size] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,size);
  const figure=page.locator('[data-curation-figure="C13"]');
  await figure.getByRole('button',{name:'Constant baseline',exact:true}).click();
  const bars=figure.locator('.curation-bars');
  assert.equal(await bars.locator('output').first().innerText(),'undefined');
  assert.equal(await bars.locator('.curation-bar-track').first().locator('span').count(),0);
  await capture(bars,`${name}-C13-undefined-bars`);
  await capture(figure.locator('.curation-pair'),`${name}-C13-plots`);
  await figure.getByRole('button',{name:'Scratch',exact:true}).click();
  assert.equal(await bars.locator('output').first().innerText(),'0.2254');
  await capture(bars,`${name}-C13-finite-bars`);
  for(const id of ['C04','C11','C13','C17','C18','C21']){
   const tables=page.locator(`[data-curation-figure="${id}"] .curation-scroll`);
   for(let i=0;i<await tables.count();i++){
    const table=tables.nth(i);await table.focus();
    await table.evaluate(el=>el.scrollLeft=el.scrollWidth);
    const geometry=await table.evaluate(el=>({left:el.scrollLeft,width:el.clientWidth,total:el.scrollWidth}));
    assert.ok(geometry.total<=geometry.width+1||geometry.left>0);
    await capture(table,`${name}-${id}-table${i}-right`);
    await table.evaluate(el=>el.scrollLeft=0);
   }
  }
  const matrix=page.locator('.curation-matrix-product');await matrix.focus();await matrix.evaluate(el=>el.scrollLeft=el.scrollWidth);
  await capture(matrix,`${name}-C12-product-right`);
  const layers=page.locator('.curation-bert-stack');
  const positions=await layers.locator('div').evaluateAll(els=>els.map(el=>({text:el.innerText,top:el.getBoundingClientRect().top})));
  assert.equal(positions[0].text,'encoder layer 1');assert.ok(positions.every((r,i)=>i===0||r.top>positions[i-1].top));
  await capture(layers,`${name}-C14-layer-order`);
  await capture(page.locator('.curation-calibration'),`${name}-C11-bins`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  checks.push({name:`${name}:undefined/finite precision,actual plots,all table right edges,product scroll,encoder order,calibration paint`,passed:true});
 }
 assert.deepEqual(errors,[]);
 const body=await page.locator('.curation-lesson').innerText();assert.ok(!body.includes('*curator model*'));assert.ok(body.includes('Curator 1'));
 checks.push({name:'No page errors; formatted emphasis and curator labels',passed:true});
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,files:Object.fromEntries(files.map(p=>[p,sha(p)])),captures:Object.fromEntries(captures.map(p=>[p,sha(p)])),previous:sha(`${folder}/browser-author-corrected/report.json`),scope:'Presentation closure only. Reuses unchanged runtime models and all native scientific evidence; no fit replay. Figure screenshots hide fixed surrounding header/sidebar only.'},null,2)+'\n',{flag:'wx'});
 await browser.close();console.log(`${checks.length} closure groups, ${captures.length} detail paints`);
}
main().catch(e=>{console.error(e);process.exit(1);});
