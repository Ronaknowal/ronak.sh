const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training',out=`${root}/browser-review-closure`;
fs.mkdirSync(out,{recursive:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const previous=JSON.parse(fs.readFileSync(`${root}/runtime-review-predecessor/runtime-inputs.json`));
 const replaced={'src/learn/components/lesson-labs/SyntheticDataFlow.jsx':`${root}/runtime-review-predecessor/SyntheticDataFlow.jsx`,'src/learn/components/lesson-labs/synthetic-data-flow.css':`${root}/runtime-review-predecessor/synthetic-data-flow.css`};
 for(const [p,h]of Object.entries(previous.bindings))assert.equal(hash(replaced[p]||p),h,p);
 const b=await chromium.launch({channel:'msedge',headless:true});try{
  const p=await b.newPage(),errors=[],captures=[],checks=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.request.get('http://127.0.0.1:4250/__llm_refresh');await p.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');
  const f=id=>p.locator(`[data-synthetic-figure="${id}"]`);await f('S14').locator('.synthetic-hash').first().waitFor({timeout:60000});
  await p.addStyleTag({content:'html,body,*{scroll-behavior:auto!important}'});
  for(const [name,width,size]of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
   await p.setViewportSize({width,height:1000});await p.evaluate(s=>document.documentElement.style.fontSize=s+'px',size);
   for(const id of ['S02','S03','S05','S07','S08','S09','S11','S14','S15','S17','S20','S21','S22']){
    await f(id).scrollIntoViewIfNeeded();const file=`${out}/${name}-${id}.png`;await f(id).screenshot({path:file,style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});captures.push(file);
    if(name==='enlarged'&&['S02','S07','S14','S15'].includes(id)){
     const regions=f(id).locator('.synthetic-scroll');for(let j=0;j<await regions.count();j++){
      const region=regions.nth(j);if(await region.evaluate(n=>n.scrollWidth>n.clientWidth+1))for(const [side,ratio]of [['middle',.5],['right',1]]){
       await region.evaluate((n,r)=>n.scrollLeft=r*(n.scrollWidth-n.clientWidth),ratio);const file=`${out}/${name}-${id}-${j}-${side}.png`;await region.screenshot({path:file});captures.push(file);
      }await region.evaluate(n=>n.scrollLeft=0);
     }
    }
    const bars=f(id).locator('.synthetic-bars');for(let j=0;j<await bars.count();j++){
     const rows=await bars.nth(j).locator('.synthetic-bar-row').evaluateAll(nodes=>nodes.map(n=>{const label=n.firstElementChild.getBoundingClientRect(),track=n.querySelector('.synthetic-bar-track').getBoundingClientRect();return {labelBottom:label.bottom,trackTop:track.top,width:track.width}}));
     for(const row of rows){assert.ok(row.labelBottom<=row.trackTop+.1,`${id}:label containment`);assert.ok(Math.abs(row.width-rows[0].width)<.1,`${id}:common quantitative scale`)}
    }
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${name}/${id}:document overflow`);
   }
   const label=await f('S14').locator('svg text').filter({hasText:'cross-'}).evaluate(n=>{const a=n.getBBox();return{x:a.x,right:a.x+a.width,y:a.y,bottom:a.y+a.height}});
   assert.ok(label.x>295&&label.right<400&&label.bottom<105,'Unobstructed cross-attend connector');
   for(const id of ['S02','S07','S15'])assert.ok(await f(id).locator('.synthetic-token,.synthetic-table td').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).overflowWrap==='normal')),'ordinary word wrapping');
   checks.push(`${name}: thirteen affected figure families, intact ordinary words, unobstructed connector, separated labels/common bar scale`);
  }
  assert.deepEqual(errors,[]);const files=Object.fromEntries(['src/learn/components/lesson-labs/SyntheticDataFlow.jsx','src/learn/components/lesson-labs/synthetic-data-flow.css',`${root}/lesson.jsx`,`${root}/runtime-review.md`,`${root}/runtime-review-inputs.json`,'scripts/verify-synthetic-review-closure.cjs'].map(p=>[p,hash(p)]));
  fs.writeFileSync(`${out}/report.json`,JSON.stringify({passed:true,checks,captures,errors,files,conservedPredecessorBindings:Object.keys(previous.bindings).length,scientificFitsRerun:0},null,2)+'\n');console.log(JSON.stringify({passed:true,captures:captures.length,checks}));
 }finally{await b.close()}
})().catch(e=>{fs.writeFileSync(`${out}/failure-${Date.now()}.json`,JSON.stringify({error:String(e)}));console.error(e);process.exit(1)});
