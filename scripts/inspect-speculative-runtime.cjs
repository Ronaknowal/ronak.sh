const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/speculative-decoding';
const out=path.join(folder,process.argv[2]||'browser-initial');
fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[`${folder}/lesson.jsx`,'src/learn/data/speculative-decoding-models.js',...['SpeculativeElements','SpeculativeFoundations','SpeculativeCacheCost','SpeculativeProposers','SpeculativeEvidence','SpeculativeDecodingFlow'].map(n=>`src/learn/components/lesson-labs/${n}.jsx`),'src/learn/components/lesson-labs/speculative-decoding-flow.css'];
const bindings=files.map(path=>({path,sha256:sha(path)})),errors=[],checks=[],images=[];
const check=(name,pass,data)=>{checks.push({name,pass:Boolean(pass),data});if(!pass)throw Error(name+': '+JSON.stringify(data));};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:1000}});page.on('pageerror',e=>errors.push(e.message));let failure;
 try{
  await page.request.get('http://127.0.0.1:4262/__llm_refresh');
  await page.goto('http://127.0.0.1:4262/learn/path/full-curriculum/speculative-decoding?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('[data-speculative-figure="D01"]').waitFor({timeout:90000});
  check('All 36 figures mounted',await page.locator('[data-speculative-figure]').count()===36);
  check('18 practice tasks',await page.locator('[data-lesson-exercise]').count()===18);
  for(const n of [18,23,26,29,30,31]){const figure=page.locator(`[data-speculative-figure="D${n}"]`);await figure.scrollIntoViewIfNeeded();await figure.locator('table').first().waitFor({timeout:30000});}
  check('Evidence mounted without React errors',errors.length===0,errors);
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
   await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(font=>document.documentElement.style.fontSize=`${font}px`,profile.font);
   for(let n=1;n<=36;n++){
    if(process.argv[4]&&!process.argv[4].split(',').map(Number).includes(n))continue;
    const id=`D${String(n).padStart(2,'0')}`,figure=page.locator(`[data-speculative-figure="${id}"]`);
    await figure.scrollIntoViewIfNeeded();
    const geometry=await figure.evaluate(el=>({overflow:document.documentElement.scrollWidth-innerWidth,width:el.getBoundingClientRect().width,svg:[...el.querySelectorAll('svg')].map(svg=>({width:svg.getBoundingClientRect().width,view:svg.viewBox.baseVal.width,textMinimum:Math.min(...[...svg.querySelectorAll('text')].map(t=>parseFloat(getComputedStyle(t).fontSize)*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width))})),invalid:[...el.querySelectorAll('input')].filter(e=>!e.validity.valid).map(e=>({value:e.value,step:e.step}))}));
    check(`${profile.name}/${id} layout`,geometry.overflow<=1&&geometry.invalid.length===0,geometry);
    if(process.argv[3]==='all'||[1,12,16,17,23,28,29,30,35].includes(n)){
     const file=path.join(out,`${profile.name}-${id}.png`);await figure.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});images.push({id,profile:profile.name,path:file,sha256:sha(file)});
     if(process.argv[3]==='all'){
      const locals=figure.locator('.speculative-local');
      for(let j=0;j<await locals.count();j++){
       const local=locals.nth(j),size=await local.evaluate(e=>({width:e.clientWidth,total:e.scrollWidth,svg:!!e.querySelector('svg')}));
       if(!size.svg&&size.total<=size.width+1)continue;
       const offsets=[0];while(offsets.at(-1)+size.width<size.total)offsets.push(Math.min(size.total-size.width,offsets.at(-1)+size.width));
       for(const offset of [...new Set(offsets)]){
        await local.evaluate((e,x)=>e.scrollLeft=x,offset);const settled=await local.evaluate(e=>e.scrollLeft);
        const pan=path.join(out,`${profile.name}-${id}-local${j}-x${settled}.png`);await local.screenshot({path:pan,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}'});images.push({id,profile:profile.name,local:j,offset:settled,total:size.total,width:size.width,svg:size.svg,path:pan,sha256:sha(pan)});
       }
       await local.evaluate(e=>e.scrollLeft=0);
      }
     }
    }
   }
  }
  check('No final page errors',errors.length===0,errors);
  for(const b of bindings)check(`Source remains ${b.path}`,sha(b.path)===b.sha256);
 }catch(e){failure=e.stack;}
 await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,bindings,checks,images,errors,scope:'Actual current mount, payload, input validity and three-profile containment; screenshots require separate personal inspection. No scientific execution.'},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure,errors}));if(failure)process.exitCode=1;
})();
