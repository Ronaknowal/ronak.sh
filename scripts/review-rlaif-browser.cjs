const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods',out=folder+'/root-browser-review-continuation';
fs.mkdirSync(out,{recursive:true});
const checks=[],images=[],errors=[];const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sources=Object.fromEntries(['src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx','src/learn/components/lesson-labs/rlaif-methods-flow.css','src/learn/data/rlaif-methods-models.js',folder+'/lesson.jsx'].map(p=>[p,sha(p)]));
function check(name,value){checks.push({name,passed:!!value});assert.ok(value,name);}
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const page=await b.newPage();page.on('pageerror',e=>errors.push(e.message));let failure=null;
try{
 await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('[data-rlaif-figure="D35"]').waitFor({timeout:90000});
 check('Whole35 mechanisms',await page.locator('[data-rlaif-figure]').count()===35);
 for(const profile of [{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
  await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',profile.font);
  for(const id of ['D02','D04','D11','D20','D22','D25','D28','D32']){
   if(profile.name==='phone'&&id!=='D32')continue;
   const f=page.locator(`[data-rlaif-figure="${id}"]`);await f.scrollIntoViewIfNeeded();
   for(let pass=0;pass<8;pass++){const loading=f.locator('.rf-loading');if(await loading.count())try{await loading.first().scrollIntoViewIfNeeded({timeout:2000});}catch(e){if(!/attached/.test(e.message))throw e;}await page.waitForTimeout(350);}
   await page.waitForFunction(id=>!document.querySelector(`[data-rlaif-figure="${id}"]`).querySelector('.rf-loading'),id,{timeout:60000});
   if(id==='D02')await f.getByLabel('Swap presentation order').check();
   if(id==='D04'){await f.getByLabel('Raw A mass').fill('0.12');await f.getByLabel('Raw B mass').fill('0.28');check(profile.name+' conditional .3',Math.abs(Number(await f.locator('[data-conditional-a]').getAttribute('data-conditional-a'))-.3)<1e-9);}
   if(id==='D11'){await f.getByRole('button',{name:'Empty distribution',exact:true}).click();check(profile.name+' unknown mass',await f.locator('[data-expected-rating]').getAttribute('data-expected-rating')==='unknown');}
   if(id==='D20')await f.getByRole('button',{name:'All ties',exact:true}).click();
   if(id==='D22'){await f.getByLabel('Add A>C with the same target 1').check();check(profile.name+' added support',await f.locator('[data-support-h]').getAttribute('data-support-h')==='1');}
   if(id==='D25'){const s=f.getByLabel('Contrast coefficient λ');await s.focus();await s.press('Home');for(let i=0;i<10;i++)await s.press('ArrowRight');check(profile.name+' gradient cancellation',Math.abs(Number(await f.locator('[data-total-gradient]').getAttribute('data-total-gradient')))<1e-10);}
   if(id==='D28'){await f.getByLabel('Library full-prompt chosen NLL').uncheck();check(profile.name+' reduction explanation',(await f.innerText()).includes('equal-response weighting'));}
   if(id==='D32'){await f.getByLabel('Method').selectOption('ORPO');await f.getByLabel('Diagnostic plotted').selectOption('sum_margin');}
   for(const region of await f.locator('.rf-scroll[tabindex="0"]').all()){await region.focus();await region.press('End');await region.evaluate(e=>e.scrollLeft=e.scrollWidth);check(profile.name+'/'+id+' end accessible',await region.evaluate(e=>e.scrollLeft+e.clientWidth>=e.scrollWidth-2));}
   check(profile.name+'/'+id+' page width',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const name=profile.name+'-'+id+'.png';await f.screenshot({path:out+'/'+name,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}'});images.push({path:out+'/'+name,sha256:sha(out+'/'+name)});
   await f.getByRole('button',{name:'Reset',exact:true}).click();
  }
 }
 check('No runtime errors',errors.length===0);
 for(const[p,h]of Object.entries(sources))check('Unchanged '+p,sha(p)===h);
}catch(e){failure=e.stack;}await b.close();fs.writeFileSync(out+'/report.json',JSON.stringify({passed:!failure,failure,sources,checks,images,errors,scope:'Complementary changed states and local end visibility at390/200%; programmatic final local scrolling is not claimed as native keyboard proof. Original author native keyboard campaign remains separately bound.'},null,2));console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;})();
