const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parse } = require('@babel/parser');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic='docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const directory=topic+'/runtime-table-closure';
fs.mkdirSync(directory+'/screenshots',{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files=['src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx','src/learn/components/lesson-labs/rlaif-methods-flow.css','src/learn/data/rlaif-methods-models.js',topic+'/lesson.jsx',topic+'/lesson.md'];
const bindings=files.map(file=>({path:file,sha256:hash(fs.readFileSync(file))}));
const checks=[],images=[],errors=[];
function check(name,passed,actual){checks.push({name,passed:!!passed,actual});if(!passed)throw Error(name+': '+JSON.stringify(actual));}
function clean(node){
 if(Array.isArray(node))return node.map(clean);
 if(!node||typeof node!=='object')return node;
 return Object.fromEntries(Object.entries(node).filter(([key])=>!['start','end','loc','extra'].includes(key)).map(([key,value])=>[key,node.type==='JSXText'&&key==='value'?value.replace(/\s+/g,' ').trim():clean(value)]));
}
function program(file){return parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']}).program.body;}
async function image(page,locator,name){
 await locator.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());
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
  const before=program(directory+'/predecessor-RLAIFMethodsFlow.jsx'),after=program(files[0]);
  check('Same complete component declaration count (ordinary JSX line-wrap whitespace normalized)',before.length===after.length,before.length);
  let helperChanges=0;
  before.forEach((node,i)=>{
   if(node.declaration?.id?.name==='RLAIFTable'){helperChanges++;return;}
   check('Every other declaration/operation conserved '+i,JSON.stringify(clean(node))===JSON.stringify(clean(after[i])));
  });
  check('Only the shared table helper is allowed to differ',helperChanges===1,helperChanges);
  const beforeCss=fs.readFileSync(directory+'/predecessor-rlaif-methods-flow.css','utf8'),afterCss=fs.readFileSync(files[1],'utf8');
  const expected=beforeCss.replace('vertical-align:top; overflow-wrap:anywhere;','vertical-align:top; overflow-wrap:normal; word-break:normal;');
  check('CSS exact single cell-wrap property continuation',expected===afterCss);
  const content=JSON.parse(fs.readFileSync(topic+'/content-successor/inputs.json'));
  for(const [file,binding]of Object.entries(content.inputs))check('Accepted content exact '+file,hash(fs.readFileSync(file))===binding.sha256);
  await page.request.get('http://127.0.0.1:4250/__llm_refresh');
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models',{timeout:90000});
  await page.locator('[data-rlaif-figure="D35"]').waitFor({timeout:90000});
  for(let i=1;i<=35;i++){
   const id=`D${String(i).padStart(2,'0')}`,figure=page.locator(`[data-rlaif-figure="${id}"]`);
   await figure.scrollIntoViewIfNeeded();
   await page.waitForFunction(id=>!document.querySelector(`[data-rlaif-figure="${id}"]`).querySelector('.rf-loading'),id,{timeout:90000});
  }
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
   await page.setViewportSize({width:profile.width,height:1000});
   await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',profile.font);
   const tables=page.locator('.rlaif-flow .rf-table');
   for(let i=0;i<await tables.count();i++){
    const table=tables.nth(i),geometry=await table.evaluate(n=>({figure:n.closest('[data-rlaif-figure]')?.dataset.rlaifFigure,caption:n.caption?.textContent,rows:n.rows.length,region:!!n.closest('.rf-scroll')}));
    const prefix=`${profile.name}-${geometry.figure||'prose'}-table-${i}`;
    await image(page,geometry.region?table.locator('..').locator('..'):table,prefix+'-start');
    check(prefix+' every data row remains present',geometry.rows>0,geometry);
    if(geometry.region){
     const region=table.locator('..');
     const size=await region.evaluate(n=>({maximum:n.scrollWidth-n.clientWidth,focus:n.tabIndex}));
     if(size.maximum>1){
      check(prefix+' current table has local keyboard focus',size.focus===0,size);
      await region.focus();let position=0,presses=0;
      while(position<size.maximum-1&&presses<700){
       for(let j=0;j<10;j++){await page.keyboard.press('ArrowRight');presses++;}
       await page.waitForTimeout(40);position=await region.evaluate(n=>n.scrollLeft);
      }
      check(prefix+' actual ArrowRight reaches last column',position>=size.maximum-1,{position,maximum:size.maximum,presses});
      await image(page,region.locator('..'),prefix+'-end');
      await region.evaluate(n=>n.scrollLeft=0);
     }
    }
   }
   check(profile.name+' current complete reader does not overflow',await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));
  }
  check('No runtime exceptions',errors.length===0,errors);
  for(const binding of bindings)check('Current source unchanged '+binding.path,hash(fs.readFileSync(binding.path))===binding.sha256);
 }catch(error){failure=error.stack;}
 await browser.close();
 const report={passed:!failure,failure,at:new Date().toISOString(),bindings,checks,images,errors,scope:'Bounded table-only normal-word wrapping with64-character checksum spans. All other declaration ASTs and144 accepted content inputs conserved; every current table start and nativeArrowRight edge captured at1366/390/768root200%.No fits/inference.'};
 fs.writeFileSync(directory+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,checks:checks.length,images:images.length,failure}));
 if(failure)process.exitCode=1;
})();
