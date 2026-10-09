const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const out='docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment/browser-unchanged-closure';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage(),results=[];
  await page.request.get('http://127.0.0.1:4250/__llm_refresh');
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/multimodal-pre-training-vision-encoders-cross-modal-alignment?module=large-language-models');
  const figure=page.locator('[data-mmp-figure]').nth(24);await figure.waitFor({timeout:90000});
  const scope=figure.locator('xpath=..');
  await page.addStyleTag({content:'header{visibility:hidden!important}html,*{scroll-behavior:auto!important}'});
  await scope.getByRole('button',{name:'Use unchanged image',exact:true}).click();
  for(const [mode,width,font] of [['desktop',1440,100],['phone',390,100],['enlarged',768,200]]) {
   await page.setViewportSize({width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=v+'%',font);
   await scope.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(600);
   const grids=await scope.locator('.mmp-pixels').evaluateAll(elements=>elements.map(grid=>Array.from(grid.children,cell=>({style:cell.getAttribute('style'),color:getComputedStyle(cell).backgroundColor,opacity:getComputedStyle(cell).opacity,transition:getComputedStyle(cell).transitionDuration}))));
   assert.equal(grids[0].length,64);assert.deepEqual(grids[0],grids[1]);
   assert.notDeepEqual(grids[0],grids[2]);
   const sliders=await scope.getByRole('slider').evaluateAll(es=>es.map(e=>e.value));assert.deepEqual(sliders,['0','0']);
   await scope.screenshot({path:path.join(out,mode+'-unchanged.png')});
   results.push({mode,width,font,sliders,identicalAll64Styles:true,originalStyles:grids[0],blankDistinct:true});
  }
  const files=['src/learn/components/lesson-labs/MultimodalPretrainingFlow.jsx','src/learn/components/lesson-labs/multimodal-pretraining-flow.css','src/learn/data/multimodal-pretraining-models.js'];
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({status:'passed',scope:'Settled identical input paint and all64 DOM pixel-style equality; prior image diagnostic retained; no learner source or native model changed.',results,files:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))},null,2)+'\n');
  console.log(JSON.stringify({status:'passed',views:results.map(x=>x.mode),samePixels:64}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
