const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const capture=require('./lib/kv-cache-browser-capture.cjs');
const topic='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const base='http://127.0.0.1:4261',smoke=process.argv.includes('--smoke'),changedPans=process.argv.includes('--changed-pans');
const output=path.resolve(topic,`browser-${smoke?'smoke':changedPans?'changed-pans':'campaign'}-${Date.now()}`);fs.mkdirSync(output,{recursive:true});
const sources=[`${topic}/lesson.jsx`,`${topic}/lesson.md`,'src/learn/data/prefix-caching-models.js',...['Shared','Foundations','Storage','Native','Policy'].map(n=>`src/learn/components/lesson-labs/PrefixCaching${n}.jsx`),'src/learn/components/lesson-labs/prefix-caching-flow.css','public/learn-assets/prefix-caching-prompt-caching/observations.json'];
const hashes=()=>Object.fromEntries(sources.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={before:hashes(),captures:[],checks:[],pageErrors:[],consoleErrors:[]};
const arg=name=>process.argv.find(x=>x.startsWith(`--${name}=`))?.split('=')[1];
const ids=arg('figures')?.split(',')??(smoke?['D01','D15','D20','D21','D22','D28']:Array.from({length:29},(_,i)=>`D${String(i+1).padStart(2,'0')}`));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});await require('./lib/lesson-browser-fonts.cjs')(context);
  const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  await page.request.get(base+'/__llm_refresh');await page.goto(base+'/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
  const figure=id=>page.locator(`[data-pc-figure="${id}"]`);
  async function ready(){await figure('D29').waitFor({timeout:60000});await figure('D20').getByRole('combobox').waitFor({timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}'});}
  await ready();assert.equal(await page.locator('[data-pc-figure]').count(),29);assert.equal(await page.locator('[data-lesson-exercise]').count(),16);assert.equal(await page.locator('.pc-flow .katex-error').count(),0);report.checks.push('29 figures, 16 practices, no KaTeX errors');
  const slider=(id,name,value)=>figure(id).getByRole('slider',{name:new RegExp(name)}).fill(String(value));
  const select=(id,name,value)=>figure(id).getByRole('combobox',{name,exact:true}).selectOption({value:String(value)});
  const check=(id,name,value)=>figure(id).getByRole('checkbox',{name,exact:true}).setChecked(value);
  const changes={
    D01:()=>select('D01','Inspect KV head',1),D02:()=>check('D02',"Change B's ID at position 5 from 6 to 20",true),D03:()=>select('D03','Edited token position',1),
    D04:()=>figure('D04').getByRole('textbox').fill('20'),D05:()=>select('D05','B adapter','adapter-v2'),D06:()=>slider('D06','Prompt rows L',8),D07:()=>check('D07','Second prefix block is absent',false),D08:()=>slider('D08','Retained rows P',0),
    D11:()=>slider('D11','Event',7),D12:()=>check('D12','A remains active',false),D13:()=>slider('D13','Private tail pages per request',3),
    D15:async()=>{await check('D15','Force digest to zero (teaching collision)',true);await check('D15',"Change B's earlier block to [8, 6]",true);await figure('D15').getByText('different: reuse refused, even if the digest collides.',{exact:false}).waitFor();},
    D16:async()=>{await slider('D16','Trace pool pages',3);await slider('D16','Event',8);},D18:()=>select('D18','Metric fixture','empty'),D20:()=>select('D20','Saved native comparison',3),
    D21:()=>slider('D21','Event',11),D22:()=>figure('D22').getByRole('textbox').fill('1,2,3,4,5'),D23:async()=>{await check('D23','Also pin B and the third path (all leaves protected)',true);await slider('D23','Eviction attempts',1);},
    D24:()=>select('D24','Traversal order','ACB'),D25:()=>slider('D25','Warm waiting time',8),D27:async()=>{await slider('D27','Total storage charge',65);await slider('D27','Later hits',1);},D28:()=>select('D28','Saved eviction policy','frequency'),D29:()=>check('D29','Isolate the two trust namespaces',false),
  };
  const shot=async(name,loc)=>{const file=path.join(output,name+'.png'),receipt=await capture(page,loc,file);report.captures.push({name,file,tiles:receipt.tiles.map(t=>t.path)});};
  async function pans(profile,id,state){let i=0;for(const pane of await figure(id).locator('.pc-scroll').all()){const size=await pane.evaluate(e=>({extent:e.scrollWidth-e.clientWidth,width:e.clientWidth}));if(size.extent>2){const targets=[];for(let x=size.width*.85;x<size.extent;x+=size.width*.85)targets.push(x);targets.push(size.extent);await pane.focus();await page.keyboard.press('ArrowRight');for(const [j,x] of targets.entries()){await pane.evaluate((e,v)=>e.scrollLeft=v,x);await shot(`${profile}-${id}-${state}pan${i}-${j}`,pane);}await pane.evaluate(e=>e.scrollLeft=0);report.checks.push({profile,id,state,pane:i,...size,targets});}i++;}}
  for(const [profile,width,font] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]].filter(([p])=>!arg('profiles')||arg('profiles').split(',').includes(p))){
    if(profile!=='desktop'){await page.reload({waitUntil:'domcontentloaded'});await ready();}await page.setViewportSize({width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);
    for(const id of ids){
      if(changedPans){if(changes[id]){await changes[id]();await pans(profile,id,'changed-');for(const reset of await figure(id).getByRole('button',{name:'Reset',exact:true}).all())await reset.click();}continue;}
      await shot(`${profile}-${id}-default`,figure(id));const layout=await figure(id).evaluate(el=>({bodyOverflow:document.documentElement.scrollWidth-innerWidth,overflow:[...el.querySelectorAll('*')].filter(n=>{if(n.closest('.pc-scroll')||n instanceof SVGElement)return false;const r=n.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left<-2);}).map(n=>({tag:n.tagName,text:n.textContent.slice(0,70)}))}));report.checks.push({profile,id,layout});
      if(!smoke&&changes[id]){const before=await figure(id).innerText();await changes[id]();assert.notEqual(await figure(id).innerText(),before,id+' changed output');await shot(`${profile}-${id}-changed`,figure(id));const resets=figure(id).getByRole('button',{name:'Reset',exact:true});for(const reset of await resets.all())await reset.click();report.checks.push(`${profile} ${id} changes/reset`);}
      if(!smoke){let i=0;for(const pane of await figure(id).locator('.pc-scroll').all()){const size=await pane.evaluate(e=>({extent:e.scrollWidth-e.clientWidth,width:e.clientWidth}));if(size.extent>2){const targets=[];for(let x=size.width*.85;x<size.extent;x+=size.width*.85)targets.push(x);targets.push(size.extent);await pane.focus();await page.keyboard.press('ArrowRight');for(const [j,x] of targets.entries()){await pane.evaluate((e,v)=>e.scrollLeft=v,x);await shot(`${profile}-${id}-pan${i}-${j}`,pane);}await pane.evaluate(e=>e.scrollLeft=0);report.checks.push({profile,id,pane:i,...size,targets});}i++;}}
    }
  }
  assert.equal(report.pageErrors.length,0,report.pageErrors.join('\n'));report.after=hashes();assert.deepEqual(report.before,report.after);report.status='Captured; actual image reading separate';
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,captures:report.captures.length,failure:report.failure,errors:report.pageErrors}));}})();
