const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/test-time-compute-scaling/browser-panels';fs.mkdirSync(folder,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),images=[],checks=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();let failure;
try{await page.request.get('http://127.0.0.1:4264/__llm_refresh');await page.goto('http://127.0.0.1:4264/learn/path/full-curriculum/test-time-compute-scaling?module=large-language-models',{waitUntil:'domcontentloaded'});await page.locator('[data-ttc-figure="D14"] select').first().waitFor();
for(const profile of[{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=`${v}px`,profile.font);
 const nodes=page.locator('[data-ttc-figure] .ttc-scroll');
 for(let i=0;i<await nodes.count();i++){const node=nodes.nth(i),g=await node.evaluate(n=>({width:n.clientWidth,extent:n.scrollWidth,id:n.closest('figure').dataset.ttcFigure,height:n.getBoundingClientRect().height}));if(g.extent<=g.width+1)continue;
  await node.scrollIntoViewIfNeeded();await node.focus();await node.press('ArrowRight');const keyboard=await node.evaluate(n=>n.scrollLeft);checks.push({name:`${profile.name}/${g.id}/${i} native scroll focus`,passed:await node.evaluate(n=>document.activeElement===n),initialKeyboardOffset:keyboard});
  for(const part of[.5,1]){await node.evaluate((n,v)=>n.scrollLeft=v*(n.scrollWidth-n.clientWidth),part);await node.scrollIntoViewIfNeeded();const file=path.join(folder,`${profile.name}-${g.id}-${i}-${part===1?'right':'middle'}.png`);await node.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});images.push({path:file,sha256:sha(file),height:g.height});}
  await node.evaluate(n=>n.scrollLeft=0);
 }
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(folder,`${profile.name}-opening.png`)});
}
}catch(e){failure=e.stack;}await browser.close();fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({passed:!failure,failure,images,checks,scope:'Current actual scroll-middle/right pixels. Initial default captures supply left edges; personal native reading remains separately recorded.'},null,2)+'\n');console.log(JSON.stringify({passed:!failure,images:images.length,failure}));if(failure)process.exitCode=1;})();
