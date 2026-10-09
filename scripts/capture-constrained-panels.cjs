const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar',folder=base+'/'+(process.argv[2]||'browser-panels-current');fs.mkdirSync(path.join(folder,'screenshots'),{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),images=[],checks=[],bindings=JSON.parse(fs.readFileSync(base+'/browser-current/report.json')).bindings.map(b=>({...b,sha256:sha(b.path)}));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();let failure;
try{await page.request.get('http://127.0.0.1:4264/__llm_refresh');await page.goto('http://127.0.0.1:4264/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models',{waitUntil:'domcontentloaded'});await page.locator('[data-cd-figure="D22"] select').first().waitFor();
for(const profile of[{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=`${v}px`,profile.font);
 const nodes=page.locator('[data-cd-figure] .cd-scroll');
 for(let i=0;i<await nodes.count();i++){const node=nodes.nth(i),g=await node.evaluate(n=>({width:n.clientWidth,extent:n.scrollWidth,id:n.closest('figure').dataset.cdFigure,height:n.getBoundingClientRect().height}));if(g.extent<=g.width+1)continue;
  await node.scrollIntoViewIfNeeded();await node.focus();await node.press('ArrowRight');await page.waitForFunction(i=>document.querySelectorAll('[data-cd-figure] .cd-scroll')[i].scrollLeft>0,i);checks.push({name:`${profile.name}/${g.id}/${i} keyboard pan`,passed:await node.evaluate(n=>document.activeElement===n&&n.scrollLeft>0)});
  const count=Math.ceil((g.extent-g.width)/(g.width*.85));
  for(let part=1;part<=count;part++){await node.evaluate((n,v)=>n.scrollLeft=v*(n.scrollWidth-n.clientWidth),part/count);await node.scrollIntoViewIfNeeded();const file=path.join(folder,'screenshots',`${profile.name}-${g.id}-${i}-pan${part}.png`);await node.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});images.push({path:file,sha256:sha(file),height:g.height});}
  await node.evaluate(n=>n.scrollLeft=0);
 }
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(folder,`${profile.name}-opening.png`)});
}
for(const b of bindings)if(sha(b.path)!==b.sha256)throw Error(`Changed ${b.path}`);
}catch(e){failure=e.stack;}await browser.close();fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({passed:!failure,failure,bindings,images,checks,scope:'Actual horizontal panels cover the scroll extent with overlapping native views. Defaults supply left edges; image acquisition is not personal reading.'},null,2)+'\n');console.log(JSON.stringify({passed:!failure,images:images.length,failure}));if(failure)process.exitCode=1;})();
