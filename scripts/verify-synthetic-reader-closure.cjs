const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const output=`${root}/browser-reader-closure`;fs.mkdirSync(output,{recursive:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write']}),errors=[],captures=[],checks=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');
 await p.locator('[data-synthetic-figure="S18"] button').first().waitFor({timeout:60000});
 const fig=id=>p.locator(`[data-synthetic-figure="${id}"]`);
 const shot=async(n,name)=>{await n.scrollIntoViewIfNeeded();const file=`${output}/${name}.png`;await n.screenshot({path:file,style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});captures.push(file)};
 for(const [name,width,size]of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
  await p.setViewportSize({width,height:1000});await p.evaluate(s=>document.documentElement.style.fontSize=s+'px',size);
  for(const id of ['S05','S09','S11','S17']){await shot(fig(id),`${name}-${id}`);const groups=await fig(id).locator('.synthetic-bars').evaluateAll(ns=>ns.map(n=>[...n.querySelectorAll('.synthetic-bar-track')].map(t=>({x:t.getBoundingClientRect().x,width:t.getBoundingClientRect().width}))));for(const geometry of groups)if(geometry.length)for(const v of geometry){assert.ok(Math.abs(v.x-geometry[0].x)<1);assert.ok(Math.abs(v.width-geometry[0].width)<1)} }
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:0,behavior:'instant'})});await p.screenshot({path:`${output}/${name}-opening.png`});captures.push(`${output}/${name}-opening.png`);
 }
 await p.setViewportSize({width:1366,height:1000});await p.evaluate(()=>document.documentElement.style.fontSize='16px');
 const programs=p.locator('.lesson-code-source');assert.equal(await programs.count(),7);
 for(let i=0;i<7;i++){const n=programs.nth(i);await n.scrollIntoViewIfNeeded();await n.locator('pre').waitFor({timeout:30000});await n.getByRole('button',{name:/Copy/}).first().click();assert.equal((await p.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),(await n.locator('pre').innerText()).replace(/\r\n/g,'\n'));await shot(n,`program-${i+1}`)}
 const practice=p.locator('[data-lesson-ending="practice"]');const details=practice.locator('details');assert.equal(await details.count(),24);
 for(let i=0;i<24;i++)await details.nth(i).evaluate(n=>n.open=true);
 for(let i=0;i<24;i+=2){await shot(details.nth(i+1),`solution-${i/2+1}`)}
 for(const name of ['takeaways','further-learning','references','readiness']){const n=p.locator(`[data-lesson-ending="${name}"]`);if(await n.count())await shot(n,`ending-${name}`)}
 checks.push('Equal bar track geometry at3sizes; no page overflow; all7 actual clipboard sources; all12 opened solutions');
 assert.deepEqual(errors,[]);const previous=JSON.parse(fs.readFileSync(`${root}/browser-paint-closure/report.json`));
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({checks,errors,captures,previousReportSha256:hash(`${root}/browser-paint-closure/report.json`),files:Object.fromEntries(Object.keys(previous.files).map(f=>[f,hash(f)]))},null,2)+'\n');console.log(`${captures.length} reader/bar captures and exact copy passed`);
}finally{await b.close()}})().catch(e=>{console.error(e);fs.writeFileSync(`${output}/failure-${Date.now()}.json`,JSON.stringify({error:String(e)}));process.exit(1)});


