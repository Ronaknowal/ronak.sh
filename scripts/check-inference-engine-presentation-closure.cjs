const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/inference-engines-serving';
const out=path.join(folder,'runtime-native-presentation-correction/paint-r2');fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const inputs=['InferenceEngineElements.jsx','InferenceEngineNativeEvidence.jsx','inference-engine-flow.css'].map(n=>({path:'src/learn/components/lesson-labs/'+n,sha256:sha('src/learn/components/lesson-labs/'+n)}));
const checks=[],images=[];const check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name)};
const ids=['D01','D17','D22','D32'];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();let failure;const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
await page.request.get('http://127.0.0.1:4266/__llm_refresh');await page.goto('http://127.0.0.1:4266/learn/path/full-curriculum/inference-engines-serving?module=large-language-models');await page.locator('[data-engine-figure="D01"]').waitFor();
for(const id of ['D02','D18']){const f=page.locator(`[data-engine-figure="${id}"]`);await f.scrollIntoViewIfNeeded();await f.locator('table').first().waitFor();}
check('all32 mechanisms mounted',await page.locator('[data-engine-figure]').count()===32);
async function capture(id,state,profile){const f=page.locator(`[data-engine-figure="${id}"]`);await f.scrollIntoViewIfNeeded();
check('no Vite overlay '+id,await page.locator('vite-error-overlay').count()===0);check(`${profile.name}/${id}/${state} document and ranges`,await f.evaluate(e=>document.documentElement.scrollWidth<=innerWidth+1&&[...e.querySelectorAll('input')].every(x=>x.validity.valid)));
let file=path.join(out,`${profile.name}-${id}-${state}.png`);await f.screenshot({path:file,style:'.site-header--learn{visibility:hidden!important}'});images.push({id,state,profile:profile.name,path:file,sha256:sha(file)});
const locals=f.locator('.engine-local');for(let i=0;i<await locals.count();i++){const l=locals.nth(i);const size=await l.evaluate(e=>({width:e.clientWidth,total:e.scrollWidth}));let offsets=[0];while(offsets.at(-1)+size.width<size.total)offsets.push(Math.min(size.total-size.width,offsets.at(-1)+size.width));for(const x of [...new Set(offsets)]){await l.evaluate((e,x)=>e.scrollLeft=x,x);const actual=await l.evaluate(e=>e.scrollLeft);file=path.join(out,`${profile.name}-${id}-${state}-local${i}-x${actual}.png`);await l.screenshot({path:file,style:'.site-header--learn{visibility:hidden!important}'});images.push({id,state,profile:profile.name,local:i,offset:actual,...size,path:file,sha256:sha(file)});}await l.evaluate(e=>e.scrollLeft=0);}}
for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',profile.font);
for(const id of ids)await capture(id,'default',profile);
}
check('no browser errors',errors.length===0);for(const x of inputs)check('unchanged '+x.path,sha(x.path)===x.sha256);
}catch(e){failure=e.stack}await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,inputs,checks,images,errors},null,2)+'\n');console.log(JSON.stringify({passed:!failure,failure,checks:checks.length,images:images.length}));if(failure)process.exitCode=1;})();
