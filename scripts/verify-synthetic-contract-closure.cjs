const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training',out=process.env.SYNTHETIC_CONTRACT_OUT||`${root}/browser-contract-closure`;fs.mkdirSync(out,{recursive:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{const p=await b.newPage(),errors=[],captures=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.request.get('http://127.0.0.1:4250/__llm_refresh');await p.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');const f=id=>p.locator(`[data-synthetic-figure="${id}"]`);await f('S03').getByRole('slider').waitFor({timeout:60000});
 for(const [name,width,size]of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){await p.setViewportSize({width,height:1000});await p.evaluate(s=>document.documentElement.style.fontSize=s+'px',size);
  for(const changed of [false,true]){await f('S03').getByRole('slider').fill(changed?'3':'2');await f('S04').getByRole('button',{name:changed?'B · water':'A · pendulum',exact:true}).click();await f('S04').getByRole('button',{name:changed?'Question and answer':'Plain explanation',exact:true}).click();
   assert.match(await f('S03').innerText(),changed?/saved output still says 2/:/saved derivative agree/);assert.match(await f('S04').innerText(),changed?/Write one question and its answer using this account.*Source B/:/Rewrite this account in plain English.*Source A/);
   for(const id of ['S03','S04']){await f(id).scrollIntoViewIfNeeded();const file=`${out}/${name}-${id}-${changed?'changed':'default'}.png`;await f(id).screenshot({path:file,style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});captures.push(file)}assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  }
 }
 await f('S04').getByRole('button',{name:'Seed',exact:true}).click();assert.match(await f('S04').innerText(),/No source passage is supplied/);await f('S04').getByRole('button',{name:'Procedure',exact:true}).click();assert.match(await f('S04').innerText(),/Construct \(2 \+ 3\) × 4/);await f('S04').getByRole('button',{name:'Reset example'}).click();assert.match(await f('S04').innerText(),/parent A, version 1/);assert.deepEqual(errors,[]);
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks:'S03 source/stale/null and S04 source/style3routes/reset at3sizes; no overflow',captures,errors,files:Object.fromEntries(['src/learn/components/lesson-labs/SyntheticDataFlow.jsx','src/learn/components/lesson-labs/synthetic-data-flow.css',`${root}/lesson.jsx`,`${root}/lesson.md`].map(f=>[f,hash(f)]))},null,2)+'\n');console.log('12 affected contract paints passed');
}finally{await b.close()}})().catch(e=>{console.error(e);fs.writeFileSync(`${out}/failure-${Date.now()}.json`,JSON.stringify({error:String(e)}));process.exit(1)});

