const captureObject = require('./lib/rlvr-browser-capture.cjs');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const destination = path.join(topic, process.argv[2] || 'browser-initial');
fs.mkdirSync(path.join(destination, 'screenshots'), { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = ['src/learn/data/rlvr-models.js','src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/rlvr-flow.css',topic+'/lesson.jsx',topic+'/lesson.md',topic+'/runtime-data-projection.json'];
const bindings = files.map(file=>({path:file,sha256:hash(file)}));
const checks=[],images=[],errors=[];
function check(name,passed,value){checks.push({name,passed:!!passed,value});if(!passed)throw Error(name+': '+JSON.stringify(value));}
async function loaded(page,figure){
  await figure.scrollIntoViewIfNeeded();
  await page.waitForFunction(id=>{const n=document.querySelector(`[data-rlvr-figure="${id}"]`);return n&&!n.querySelector('.rlvr-data-view [role="status"]');},await figure.getAttribute('data-rlvr-figure'),{timeout:90000});
  check('Observation request succeeded '+await figure.getAttribute('data-rlvr-figure'),await figure.locator('[role=alert]').count()===0);
}
async function capture(page,locator,name){
  await locator.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());
  const file=path.join(destination,'screenshots',name+'.png');
  await captureObject(page,locator,file);
  images.push({name,path:'screenshots/'+name+'.png',sha256:hash(file)});
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 let failure=null;
 try{
  const base='http://127.0.0.1:4254';await page.request.get(base+'/__llm_refresh',{timeout:90000});
  await page.goto(base+'/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models',{timeout:90000,waitUntil:'domcontentloaded'});
  await page.locator('[data-rlvr-figure="D39"]').waitFor({timeout:90000});
  check('All39 drawings mount',await page.locator('[data-rlvr-figure]').count()===39);
  check('All14 solved practices',await page.locator('[data-lesson-exercise]').count()===14);
  check('Accepted first-pass route visible',(await page.locator('body').innerText()).includes('For a first pass, follow sections 1–9'));
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
   await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',profile.font);
   await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});
   const opening=path.join(destination,'screenshots',profile.name+'-opening.png');await page.screenshot({path:opening,animations:'disabled'});images.push({name:profile.name+'-opening',path:'screenshots/'+profile.name+'-opening.png',sha256:hash(opening)});
   check(profile.name+' actual root font',await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize))===profile.font);
   for(const i of (process.argv.includes('--remaining') && profile.name!=='enlarged' ? [11,12,14,22,23,30,31,35,37,38] : Array.from({length:39},(_,j)=>j+1))){
    const id='D'+String(i).padStart(2,'0'),figure=page.locator(`[data-rlvr-figure="${id}"]`);await loaded(page,figure);
    await capture(page,figure,profile.name+'-'+id);
    const geo=await figure.evaluate(n=>({documentOverflow:document.documentElement.scrollWidth-innerWidth,empty:n.innerText.trim().length===0,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}));
    check(profile.name+'/'+id+' contained',geo.documentOverflow<=1&&!geo.empty,geo);
   }
  }
  check('No runtime/console errors',errors.length===0,errors);
  bindings.forEach(row=>check('Current source '+row.path,hash(row.path)===row.sha256));
 }catch(e){failure=e.stack;}
 await browser.close();
 const report={passed:!failure,at:new Date().toISOString(),scope:'Actual normal-reader opening and all39 structures at1366/390/768 with actual32px root text. This is author evidence, not independent acceptance or observed learner comprehension.',bindings,checks,images,errors,failure};
 fs.writeFileSync(path.join(destination,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;
})();
