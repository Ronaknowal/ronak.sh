const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out=__dirname,results={purpose:'Independent complementary runtime review, no numerical mains',source:'6a8dd38fe0afd9fff13b88071ac21b15c4324e56a5841bbee832137b5aaab7f5',checks:[],screens:[]};
const check=(name,data)=>results.checks.push({name,...data});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5772/');await page.waitForSelector('[data-entropy-drawing="E46"]');
 const fig=id=>page.locator(`[data-entropy-drawing="${id}"]`);
 async function shot(id,suffix){const f=fig(id);await f.scrollIntoViewIfNeeded();const file=`${id}-${suffix}.jpg`;await f.screenshot({path:path.join(out,file),type:'jpeg',quality:77});results.screens.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex')});}
 check('all figures', {count:await page.locator('[data-entropy-drawing]').count(),ids:await page.locator('[data-entropy-drawing]').evaluateAll(es=>es.map(e=>e.dataset.entropyDrawing))});
 fs.writeFileSync(path.join(out,'rendered-reading.txt'),await page.locator('body').innerText());
 for(const id of ['E09','E14','E27','E30','E38','E43','E44','E45'])check(id+' controls',{controls:await fig(id).locator('input,select,button').evaluateAll(es=>es.map(e=>({tag:e.tagName,type:e.type,label:e.getAttribute('aria-label')||e.labels?.[0]?.innerText||e.textContent,value:e.value})))});
 // A draft at the committed default must reset, including validation state.
 const message=fig('E09').getByLabel('Message',{exact:true});await message.fill('Z');await fig('E09').getByRole('button',{name:'Apply Message',exact:true}).click();
 check('E09 invalid',{draft:await message.inputValue(),alerts:await fig('E09').locator('[role=alert]').allTextContents()});
 await fig('E09').getByRole('button',{name:'Reset investigation',exact:true}).click();
 check('E09 reset invalid default',{draft:await message.inputValue(),alerts:await fig('E09').locator('[role=alert]').allTextContents()});await shot('E09','invalid-reset');
 await page.reload();await page.waitForSelector('[data-entropy-drawing="E46"]');
 const mean=fig('E45').getByLabel('Required mean',{exact:true});await mean.fill('2.1');await fig('E45').getByRole('button',{name:'Apply Required mean',exact:true}).click();
 await fig('E43').getByRole('button',{name:'Reset investigation',exact:true}).click();
 check('E43 shared reset invalid E45',{draft:await mean.inputValue(),alerts:await fig('E45').locator('[role=alert]').allTextContents()});
 await page.reload();await page.waitForSelector('[data-entropy-drawing="E46"]');
 await shot('E14','ordinary');await shot('E22','ordinary');
 for(const width of [390,768]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='32px');await page.waitForTimeout(150);
  for(const id of ['E08','E29','E30','E42']){
   await fig(id).scrollIntoViewIfNeeded();check(id+` geometry ${width}/32`,{geometry:await fig(id).evaluate(e=>({figure:e.getBoundingClientRect().width,document:document.documentElement.scrollWidth,viewport:innerWidth,scroll:Array.from(e.querySelectorAll('.en-canvas-scroll')).map(d=>({client:d.clientWidth,scroll:d.scrollWidth,textFont:getComputedStyle(d.querySelector('svg text')||d).fontSize}))}))});
  }
  await shot('E29',`${width}-root32`);await shot('E30',`${width}-root32`);await shot('E42',`${width}-root32`);
 }
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='16px');await page.waitForTimeout(150);await shot('E29','390-root16');
 check('runtime page errors',{errors});
 fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify({checks:results.checks.length,screens:results.screens.length,path:out}));
})().catch(e=>{results.error=String(e.stack);fs.writeFileSync(path.join(out,'browser-review-partial.json'),JSON.stringify(results,null,2));console.error(e);process.exit(1)});
