const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const capture=require('./lib/kv-cache-browser-capture.cjs');
const topic='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const output=path.resolve(topic,`browser-boundaries-${Date.now()}`);fs.mkdirSync(output,{recursive:true});
const files=[`${topic}/lesson.jsx`,`${topic}/lesson.md`,'src/learn/data/prefix-caching-models.js',...['Shared','Foundations','Storage','Native','Policy'].map(n=>`src/learn/components/lesson-labs/PrefixCaching${n}.jsx`),'src/learn/components/lesson-labs/prefix-caching-flow.css'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashes=()=>Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))]));
const report={before:hashes(),checks:[],captures:[],errors:[],downloads:[]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({acceptDownloads:true});await require('./lib/lesson-browser-fonts.cjs')(context);
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const fig=id=>page.locator(`[data-pc-figure="${id}"]`);
 const text=id=>fig(id).innerText();
 const range=(id,name,v)=>fig(id).getByRole('slider',{name:new RegExp(name)}).fill(String(v));
 const select=(id,name,v)=>fig(id).getByRole('combobox',{name,exact:true}).selectOption({value:String(v)});
 const reset=async id=>{for(const r of await fig(id).getByRole('button',{name:'Reset',exact:true}).all())await r.click();};
 const verify=async(id,pattern)=>{assert.match(await text(id),pattern);report.checks.push({id,pattern:String(pattern)});};
 const shot=async(name,locator)=>{const file=path.join(output,name+'.png');const r=await capture(page,locator,file);report.captures.push({name,file,tiles:r.tiles.map(t=>t.path)});};
 async function inspect(profile,id,name){await shot(`${profile}-${id}-${name}`,fig(id));let n=0;for(const pane of await fig(id).locator('.pc-scroll').all()){const s=await pane.evaluate(e=>({width:e.clientWidth,end:e.scrollWidth-e.clientWidth}));for(let x=Math.min(s.end,s.width*.85),i=0;s.end>2;x=Math.min(s.end,x+s.width*.85),i++){await pane.evaluate((e,v)=>e.scrollLeft=v,x);await shot(`${profile}-${id}-${name}-pan${n}-${i}`,pane);if(x===s.end)break;}await pane.evaluate(e=>e.scrollLeft=0);n++;}}
 for(const [profile,width,font] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
  await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models',{waitUntil:'domcontentloaded'});
  await fig('D29').waitFor();await fig('D20').getByRole('combobox').waitFor();await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'*{scroll-behavior:auto!important;overflow-anchor:none!important}'});
  await fig('D04').getByRole('textbox').fill('-1');await verify('D04',/last valid state is retained/);await inspect(profile,'D04','invalid');
  await fig('D04').getByRole('textbox').fill('4294967295');await verify('D04',/4294967295/);await inspect(profile,'D04','uint32');await reset('D04');
  await select('D05','B position policy','offset-8');await verify('D05',/incompatible|refused|not reusable/i);await reset('D05');await select('D05','B trust group','isolated');await verify('D05',/incompatible|refused|not reusable/i);await reset('D05');
  for(const [v,reuse] of [[1,0],[9,8],[20,16]]){await range('D06','Prompt rows L',v);await verify('D06',new RegExp(`${reuse} reusable rows; ${v-reuse} newly computed`));}await inspect(profile,'D06','maximum');
  const boundary=fig('D06').getByRole('slider');await boundary.focus();await page.keyboard.press('Home');assert.equal(await boundary.inputValue(),'1');await page.keyboard.press('ArrowRight');assert.equal(await boundary.inputValue(),'2');await page.keyboard.press('End');assert.equal(await boundary.inputValue(),'20');await reset('D06');report.checks.push(profile+' native range Home/ArrowRight/End/Reset');
  await range('D08','Prompt length L',16);await range('D08','Retained rows P',15);await inspect(profile,'D08','last-query-only');await range('D08','Prompt length L',4);assert.equal(await fig('D08').getByRole('slider',{name:/Retained rows P/}).inputValue(),'3');await reset('D08');report.checks.push(profile+' prefix control clamps when prompt shrinks');
  await range('D11','Event',4);await fig('D11').getByRole('button',{name:'Back',exact:true}).click();assert.equal(await fig('D11').getByRole('slider').inputValue(),'3');await fig('D11').getByRole('button',{name:'Next',exact:true}).click();await reset('D11');
  await range('D12','Physical pool pages',8);await verify('D12',/admitted|accepted/i);await reset('D12');
  await select('D16','Request sequence','A');await verify('D16',/0\/10 rows reused/);await select('D16','Request sequence','ABA');await verify('D16',/16\/30 rows reused/);await reset('D16');
  await select('D18','Metric fixture','longMiss');await verify('D18',/6\/108 = 5\.56%/);await reset('D18');
  for(const v of [1,2]){await select('D20','Saved native comparison',v);await verify('D20',/402432/);}await reset('D20');
  await select('D21','Saved address observation layer',1);await inspect(profile,'D21','layer1');await reset('D21');
  await fig('D22').getByRole('textbox').fill('');await verify('D22',/Empty input ends at root/);assert.equal(await fig('D22').locator('tbody tr').count(),4);await inspect(profile,'D22','empty');await fig('D22').getByRole('textbox').fill('bad');await verify('D22',/last valid/i);await inspect(profile,'D22','invalid');await fig('D22').getByRole('textbox').fill('4294967295,2,3,4,5,6,7,8');await inspect(profile,'D22','wide-ids');await select('D22','Insertion boundary',0);assert.equal(await fig('D22').getByRole('textbox').isDisabled(),true);await select('D22','Insertion boundary',1);assert.equal(await fig('D22').getByRole('textbox').isDisabled(),true);await reset('D22');
  await range('D23','Eviction attempts',5);await inspect(profile,'D23','protected-A');await reset('D23');
  await range('D25','Warm waiting time',0);await verify('D25',/warm 4 ms; cold 12 ms/);await inspect(profile,'D25','no-warm-wait');await reset('D25');
  await range('D27','Total storage charge',300);await range('D27','Later hits',10);await verify('D27',/5\.75/);await inspect(profile,'D27','cost-max');await reset('D27');
  for(const v of [5,6]){await range('D28','Request index',v);await inspect(profile,'D28','request'+v);}await reset('D28');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);report.checks.push(profile+' no page overflow');
 }
 for(const name of ['prefix_study.py','observations.py','tiny_causal_lm.py','cached_decoder.py','native_cache.py','acquire_model.py']){
  const link=page.locator(`a[href="/learn-code/prefix-caching/${name}"]`).first();const pending=page.waitForEvent('download');await link.click();const download=await pending;assert.equal(await download.failure(),null);const file=await download.path();assert.equal(sha(fs.readFileSync(file)),sha(fs.readFileSync('public/learn-code/prefix-caching/'+name)));report.downloads.push({name,status:'native exact bytes'});
 }
 assert.equal(report.errors.length,0);report.after=hashes();assert.deepEqual(report.before,report.after);report.status='PASS';
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,status:report.status,failure:report.failure,captures:report.captures.length,checks:report.checks.length}));}})();
