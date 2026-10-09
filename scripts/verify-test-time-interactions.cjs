const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/test-time-compute-scaling',out=path.join(folder,process.argv[2]||'browser-interactions');fs.mkdirSync(out,{recursive:true});
const checks=[],images=[],errors=[],sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[`${folder}/lesson.jsx`,'src/learn/data/test-time-compute-models.js',...['Shared','Selection','Search','Evidence','Allocation'].map(n=>`src/learn/components/lesson-labs/TestTime${n}.jsx`),'src/learn/components/lesson-labs/test-time-compute.css','public/learn-assets/test-time-compute/observations.json'];
const bindings=files.map(p=>({path:p,sha256:sha(p)}));
const check=(name,value,data)=>{checks.push({name,passed:Boolean(value),data});if(!value)throw new Error(name+': '+JSON.stringify(data));};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));let failure;
const url='http://127.0.0.1:4264/learn/path/full-curriculum/test-time-compute-scaling?module=large-language-models';
try{
 await page.request.get('http://127.0.0.1:4264/__llm_refresh');await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.locator('[data-ttc-figure="D14"] select').first().waitFor({timeout:90000});
 const f=id=>page.locator(`[data-ttc-figure="${id}"]`);
 async function range(id,label,keys){const input=f(id).getByRole('slider',{name:new RegExp(label)});await input.focus();for(const key of keys)await input.press(key);}
 async function expect(id,text){await page.waitForFunction(({id,text})=>document.querySelector(`[data-ttc-figure="${id}"]`).innerText.includes(text),{id,text});const actual=await f(id).innerText();check(`${id} includes ${text}`,actual.includes(text),actual.slice(-400));}
 const scenarios=[
 ['D02',async()=>{await range('D02','Workers',['Home']);await expect('D02','makespan: 6s');}],
 ['D04',async()=>{await range('D04','Single-attempt',['Home']);await expect('D04','iid 0; identical copies 0');await range('D04','Single-attempt',['End']);await expect('D04','iid 1; identical copies 1');}],
 ['D05',async()=>{await range('D05','Candidate C',['Home',...Array(12).fill('ArrowRight')]);await expect('D05','Selected A: 11/2');await range('D05','Candidate C',['ArrowRight','ArrowRight']);await expect('D05','Selected A: 11/2');}],
 ['D07',async()=>{await f('D07').getByRole('combobox').selectOption('1');await expect('D07','N=1');}],
 ['D08',async()=>{await f('D08').getByRole('combobox').selectOption('exact');await expect('D08','Action 0:');}],
 ['D09',async()=>{await range('D09','Beam width',['End']);await expect('D09','6 nodes scored. Completed selection: A1');await range('D09','Expansion depth',['Home']);await expect('D09','0 nodes scored. Completed selection: none');}],
 ['D11',async()=>{await range('D11','Responses retained',['Home']);check('one revision all correct',(await f('D11').innerText()).match(/✓ correct/g)?.length===3);}],
 ['D12',async()=>{await range('D12','Breadth',['End']);await range('D12','Depth',['Home']);await expect('D12','4 calls · 40 generated tokens · 80 prompt positions');}],
 ['D13',async()=>{await range('D13','Thinking cap',['End']);await range('D13','Available context',['Home']);await expect('D13','Thinking + injected: 0; final: 2');}],
 ['D14',async()=>{await f('D14').getByRole('combobox',{name:'Question',exact:true}).selectOption({value:'11'});await f('D14').getByRole('combobox',{name:'Seed',exact:true}).selectOption('17');await f('D14').getByRole('combobox',{name:'Candidates N',exact:true}).selectOption('1');await expect('D14','Selected: abstain');}],
 ['D16',async()=>{await f('D16').getByRole('combobox').selectOption('cpu_seconds');await expect('D16','Mean serial CPU seconds');}],
 ['D17',async()=>{await range('D17','Routing overhead',['Home','ArrowRight']);await expect('D17','Chosen [0, 2]');await range('D17','Routing overhead',['End']);await expect('D17','Infeasible');}],
 ['D19',async()=>{await range('D19','Baseline inference',['End']);await expect('D19','multiplier a = 3');await range('D19','Larger-model',['Home']);await expect('D19','multiplier a = 1');}],
 ];
 for(const profile of (process.argv[3]==='delivery-only'?[]:[{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}])){
  await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',profile.font);
  for(const[id,change]of scenarios){const initial=await f(id).locator('input,select').evaluateAll(nodes=>nodes.map(n=>n.value));await change();await f(id).scrollIntoViewIfNeeded();const p=path.join(out,`${profile.name}-${id}-changed.png`);await f(id).screenshot({path:p,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});images.push({path:p,sha256:sha(p)});check(`${profile.name}/${id} containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await f(id).getByRole('button',{name:'Reset',exact:true}).click();check(`${profile.name}/${id} reset`,JSON.stringify(await f(id).locator('input,select').evaluateAll(nodes=>nodes.map(n=>n.value)))===JSON.stringify(initial));}
 }
 await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 const names=JSON.parse(fs.readFileSync(`${folder}/runtime-compatibility.json`)).programs;
 for(let i=0;i<names.length;i++){
  const file=names[i],source=page.locator('.lesson-code-source').nth(i);await source.scrollIntoViewIfNeeded();await source.locator('pre code').waitFor();
  const original=fs.readFileSync(`public/learn/examples/test-time-compute/${file}`,'utf8');check(`visible complete ${file}`,(await source.locator('pre code').textContent())===original);
  await source.getByRole('button',{name:`Copy ${file}`,exact:true}).click();await source.locator('[data-copied]').waitFor();const copied=await page.evaluate(()=>navigator.clipboard.readText());check(`native clipboard ${file} (Windows newline normalization)`,copied.replaceAll('\r\n','\n')===original.replaceAll('\r\n','\n'));
  const pending=page.waitForEvent('download');await source.getByRole('link',{name:`Download ${file}`,exact:true}).click();const download=await pending;const downloaded=await download.path();check(`native download ${file}`,sha(downloaded)===sha(`public/learn/examples/test-time-compute/${file}`));
 }
 const blocks=page.locator('[data-lesson-exercise]');for(let i=0;i<16;i++){await blocks.nth(i).getByText('Worked solution',{exact:true}).click();check(`practice ${i+1} opens`,await blocks.nth(i).locator('details').last().getAttribute('open')!==null);}
 check('no literal figure placeholders',!(await page.locator('.ttc-flow').innerText()).includes('<!--'));
 check('no KaTeX errors',await page.locator('.ttc-flow .katex-error').count()===0);
 check('all14 legacy aliases',await page.locator('.ttc-flow span[aria-hidden="true"][id]').count()===14);
 const retryPage=await context.newPage();let blocked=true;await retryPage.route('**/learn-assets/test-time-compute/observations.json',r=>blocked?r.fulfill({status:503,body:'unavailable'}):r.continue());await retryPage.route('**/learn/examples/test-time-compute/budgeting.py',r=>blocked?r.fulfill({status:503,body:'unavailable'}):r.continue());await retryPage.goto(url,{waitUntil:'domcontentloaded'});await retryPage.locator('[data-ttc-figure="D14"] [role="alert"]').waitFor();const code=retryPage.locator('.lesson-code-source').first();await code.scrollIntoViewIfNeeded();await code.locator('[role="alert"]').waitFor();blocked=false;await code.getByRole('button',{name:'Retry',exact:true}).click();await code.locator('pre code').waitFor();check('code retry restores complete source',await code.locator('pre code').textContent()===fs.readFileSync('public/learn/examples/test-time-compute/budgeting.py','utf8'));await retryPage.locator('[data-ttc-figure="D14"]').getByRole('button',{name:'Retry',exact:true}).click();await retryPage.locator('[data-ttc-figure="D14"] select').first().waitFor();check('evidence Retry restored',await retryPage.locator('[data-ttc-figure="D14"] select').count()===3);await retryPage.close();
 check('no runtime errors',errors.length===0,errors);for(const b of bindings)check(`current ${b.path}`,sha(b.path)===b.sha256);
}catch(e){failure=e.stack;}await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,checks,images,bindings,errors},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;
})();
