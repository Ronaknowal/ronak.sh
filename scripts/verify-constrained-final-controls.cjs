const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar',out=base+'/browser-final-controls';fs.mkdirSync(out+'/screenshots',{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),bindings=[base+'/lesson.jsx','src/learn/data/constrained-decoding-models.js',...['Shared','Foundations','State','Evidence'].map(n=>`src/learn/components/lesson-labs/ConstrainedDecoding${n}.jsx`),'src/learn/components/lesson-labs/constrained-decoding.css'].map(p=>({path:p,sha256:sha(p)})),checks=[],images=[];
(async()=>{let failure;const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(name,pass)=>{checks.push({name,passed:!!pass});if(!pass)throw Error(name);};
 try{await page.request.get('http://127.0.0.1:4264/__llm_refresh');await page.goto('http://127.0.0.1:4264/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models',{waitUntil:'domcontentloaded'});await page.locator('[data-cd-figure="D22"] select').first().waitFor();
 for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
 await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',profile.font);
 for(const id of ['D04','D08','D14','D16']){const f=page.locator(`[data-cd-figure="${id}"]`);
 async function capture(suffix){await f.scrollIntoViewIfNeeded();const file=`${out}/screenshots/${profile.name}-${id}-${suffix}.png`;await f.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});images.push({path:file,sha256:sha(file)});check(`${profile.name}/${id}/${suffix} containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await capture('default');
 if(id!=='D16'){await f.getByRole('textbox').fill(id==='D14'?'[😀':'3😀');await page.waitForFunction(id=>document.querySelector(`[data-cd-figure="${id}"]`).innerText.includes('raw bytes'),id);check(`${id} five actual bytes`,await f.getByRole('slider').inputValue()==='5');check(`${id} raw bytes`,(await f.innerText()).includes('F0 9F 98 80'));await capture('utf8');await f.getByRole('button',{name:'Reset',exact:true}).click();}
 else if(profile.name!=='desktop'){const sc=f.locator('.cd-scroll');await sc.focus();await sc.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('[data-cd-figure="D16"] .cd-scroll').scrollLeft>0);for(const part of[.25,.5,.75,1]){await sc.evaluate((n,p)=>n.scrollLeft=p*(n.scrollWidth-n.clientWidth),part);await capture('pan'+part);}await sc.evaluate(n=>n.scrollLeft=0);}
 }
 }
 check('No runtime error',errors.length===0);for(const b of bindings)check(`Source current ${b.path}`,sha(b.path)===b.sha256);
 }catch(e){failure=e.stack;}await browser.close();fs.writeFileSync(out+'/report.json',JSON.stringify({passed:!failure,failure,checks,images,bindings,errors},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;
})();
