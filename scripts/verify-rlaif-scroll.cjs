const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic = 'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const directory = path.join(topic, process.argv[2] || 'browser-scroll');
fs.mkdirSync(path.join(directory, 'screenshots'), { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bindings = ['src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx','src/learn/components/lesson-labs/rlaif-methods-flow.css','src/learn/data/rlaif-methods-models.js',topic+'/lesson.jsx',topic+'/lesson.md'].map(file=>({path:file,sha256:hash(fs.readFileSync(file))}));
const checks=[], images=[], errors=[];
function check(name,passed,actual){checks.push({name,passed:!!passed,actual});if(!passed)throw Error(name+': '+JSON.stringify(actual));}
async function capture(page,locator,name){
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.activeElement?.blur());
  const file=path.join(directory,'screenshots',name+'.png');
  await locator.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});
  images.push({path:'screenshots/'+name+'.png',sha256:hash(fs.readFileSync(file))});
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1366,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  let failure=null;
  try{
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models',{timeout:90000});
    await page.locator('[data-rlaif-figure="D35"]').waitFor({timeout:90000});
    for(let i=1;i<=35;i++){
      const id=`D${String(i).padStart(2,'0')}`,figure=page.locator(`[data-rlaif-figure="${id}"]`);
      await figure.scrollIntoViewIfNeeded();
      await page.waitForFunction(id=>!document.querySelector(`[data-rlaif-figure="${id}"]`).querySelector('.rf-loading'),id,{timeout:90000});
    }
    for(const profile of [{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
      await page.setViewportSize({width:profile.width,height:1000});
      await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',profile.font);
      await page.waitForTimeout(100);
      const regions=page.locator('.rlaif-flow .rf-scroll');
      let mathematicalIndex=0;
      for(let i=0;i<await regions.count();i++){
        const region=regions.nth(i),geometry=await region.evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth,figure:n.closest('[data-rlaif-figure]')?.dataset.rlaifFigure,math:!!n.closest('.rf-math'),label:n.getAttribute('aria-label'),focusable:n.tabIndex}));
        const prefix=`${profile.name}-${geometry.math?'equation-'+(++mathematicalIndex):(geometry.figure||'table')+'-region-'+i}`;
        if(geometry.math)await capture(page,region.locator('..'),prefix+'-start');
        if(geometry.scroll>geometry.width+1){
          check(prefix+' local conditional cue and keyboard region',geometry.focusable===0&&!!geometry.label,geometry);
          await region.scrollIntoViewIfNeeded();
          await region.focus();
          check(prefix+' actually receives native focus',await region.evaluate(n=>n===document.activeElement));
          let position=0,presses=0;
          while(position<geometry.scroll-geometry.width-1&&presses<700){
            for(let k=0;k<10;k++){await page.keyboard.press('ArrowRight');presses++;}
            await page.waitForTimeout(40);
            position=await region.evaluate(n=>n.scrollLeft);
          }
          check(prefix+' native ArrowRight reaches last data',position>=geometry.scroll-geometry.width-1,{position,maximum:geometry.scroll-geometry.width,presses});
          await capture(page,region.locator('..'),prefix+'-end');
          await region.evaluate(n=>n.scrollLeft=0);
        }else check(prefix+' no misleading scroll focus when it fits',geometry.focusable===-1,geometry);
      }
      check(profile.name+' exactly13 current mathematical bodies',mathematicalIndex===13,mathematicalIndex);
      check(profile.name+' no document overflow',await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));
    }
    check('No runtime exceptions',errors.length===0,errors);
    for(const binding of bindings)check('Source unchanged '+binding.path,hash(fs.readFileSync(binding.path))===binding.sha256);
  }catch(error){failure=error.stack;}
  await browser.close();
  const report={passed:!failure,failure,at:new Date().toISOString(),bindings,checks,images,errors,scope:'Every current diagram/table/math local region: conditional cue, actual native keyboard focus/ArrowRight to last data at390 and768root200%.13 current math starts each profile. No fits/inference.'};
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:checks.length,images:images.length,failure}));
  if(failure)process.exitCode=1;
})();
