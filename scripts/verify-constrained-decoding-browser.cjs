const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar';
const out = path.join(folder, process.argv[2] || 'browser-initial');
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files = [`${folder}/lesson.jsx`, 'src/learn/data/constrained-decoding-models.js', ...['Shared','Foundations','State','Evidence'].map(n => `src/learn/components/lesson-labs/ConstrainedDecoding${n}.jsx`), 'src/learn/components/lesson-labs/constrained-decoding.css', 'public/learn/examples/constrained-decoding/study/evaluation-exact.json'];
const bindings = files.map(p => ({ path:p, sha256:sha(p) }));
const checks=[],images=[],errors=[];
function check(name, pass, data) { checks.push({name,pass:Boolean(pass),data}); if(!pass) throw new Error(`${name}: ${JSON.stringify(data)}`); }
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));let failure;
 try {
  await page.request.get('http://127.0.0.1:4264/__llm_refresh');
  await page.goto('http://127.0.0.1:4264/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('[data-cd-figure="D22"] select').first().waitFor({timeout:90000});
  check('27 figures mounted',await page.locator('[data-cd-figure]').count()===27);
  check('14 practices',await page.locator('[data-lesson-exercise]').count()===14);
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
   await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(font=>document.documentElement.style.fontSize=`${font}px`,profile.font);
   for(let n=1;n<=27;n++){
    const id=`D${String(n).padStart(2,'0')}`,figure=page.locator(`[data-cd-figure="${id}"]`);
    if(process.argv[3]&&!process.argv[3].split(',').includes(id))continue;
    await figure.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());
    const file=path.join(out,'screenshots',`${profile.name}-${id}.png`);
    await figure.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});
    images.push({name:`${profile.name}-${id}`,path:file,sha256:sha(file)});
    const geometry=await figure.evaluate(node=>({documentOverflow:document.documentElement.scrollWidth-innerWidth,width:node.getBoundingClientRect().width,empty:!node.innerText.trim()}));
    check(`${profile.name}/${id} containment`,geometry.documentOverflow<=1&&!geometry.empty,geometry);
   }
  }
  check('No page errors',errors.length===0,errors);
  for(const b of bindings)check(`Current ${b.path}`,sha(b.path)===b.sha256);
 }catch(e){failure=e.stack;}
 await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,bindings,checks,images,errors,scope:'Actual initial three-layout geometry and captures. Personal paint reading and interactions are separate.'},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;
})();

