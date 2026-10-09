const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner='docs/teaching/llm-architecture-training/constitutional-ai-cai';
const base=process.env.LEARNING_BASE_URL||'http://127.0.0.1:4250';
const output=process.env.CAI_BROWSER_OUTPUT||`${owner}/browser-preliminary`;
if(fs.existsSync(`${output}/report.json`))throw Error('Use fresh evidence output.');
fs.mkdirSync(`${output}/screenshots`,{recursive:true});
const sources=[`${owner}/manuscript.jsx`,'src/learn/components/lesson-labs/ConstitutionalAIFlow.jsx','src/learn/components/lesson-labs/constitutional-ai-flow.css','src/learn/data/constitutional-ai-models.js','public/learn/examples/constitutional-ai/cai_records.json','public/learn/examples/constitutional-ai/critic_outputs.json','scripts/verify-constitutional-ai-browser.cjs'];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const names=['response-edits','training-artifacts','principle-anatomy','critique-context','revision-ancestry','target-masks','parameter-states','choice-mass','order-mapping','label-transform','reward-head','preference-gradient','preference-cycle','policy-anchor','dpo-update','real-record-audit','seq2seq-anatomy','coverage-counts','calibration-bins','error-dependence','collective-votes','constitution-timeline','work-ledger'];
let checks=0; const ok=(condition,message)=>{assert.ok(condition,message);checks++;};
const report={status:'running',base,checkedAt:new Date().toISOString(),sourceHashes:Object.fromEntries(sources.map(x=>[x,hash(x)])),views:[],states:[],programs:[],scope:'Actual staged normal reader; native studies reused, no full production-build acceptance.'};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[]; page.on('pageerror',error=>errors.push(String(error)));
 const url=`${base}/learn/path/full-curriculum/constitutional-ai-cai?module=large-language-models`;
 const figure=name=>page.locator(`[data-cai-figure="${name}"]`);
 async function ready(){await page.locator('.constitutional-ai-flow').waitFor({timeout:90000});await page.evaluate(()=>document.fonts.ready);await figure('real-record-audit').locator('.cai-record').waitFor({timeout:90000});await figure('seq2seq-anatomy').locator('.cai-encoder-decoder').waitFor({timeout:90000});}
 async function capture(element,file){
   const viewport=page.viewportSize(),height=await element.evaluate(e=>e.getBoundingClientRect().height),tall=height+180>viewport.height;
   if(tall)await page.setViewportSize({width:viewport.width,height:Math.ceil(height)+180});
   try{await element.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());await element.screenshot({path:`${output}/screenshots/${file}.png`,style:'.site-header--learn{visibility:hidden!important}'});}
   finally{if(tall)await page.setViewportSize(viewport);}
 }
 async function numeric(name,label,value){await figure(name).getByRole('spinbutton',{name:label,exact:true}).fill(String(value));}
 async function reset(name){await figure(name).getByRole('button',{name:'Reset',exact:true}).click();}
 async function changed(name,file,regex){const text=await figure(name).innerText();ok(regex.test(text),`${file}: ${text}`);await capture(figure(name),file);report.states.push({name,file,text});}
 try{
   await page.request.get(`${base}/__llm_refresh`,{timeout:90000});await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await ready();
   await page.screenshot({path:`${output}/screenshots/normal-opening.png`});
   ok(await figure('real-record-audit').innerText().then(x=>x.includes('d3bcfff6')),'data SHA loaded');
   ok(await figure('seq2seq-anatomy').innerText().then(x=>x.includes('b6ad5866')),'actual critic SHA loaded');
   for(const [view,width,font] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
     await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,font);
     const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(pageOverflow<=1,`${view} document overflow ${pageOverflow}`);
     for(const name of names){const element=figure(name);ok(await element.count()===1,`${view} ${name} present exactly once`);const info=await element.evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,text:getComputedStyle(e).fontSize}));ok(info.width<=width,`${view} ${name} bounded`);ok(info.height>60,`${view} ${name} painted`);await capture(element,`${view}-${name}`);report.views.push({view,name,...info});}
     if(view!=='desktop'){
       for(const name of names){
         const regions=figure(name).locator('.cai-local');
         for(let i=0;i<await regions.count();i++){
           const region=regions.nth(i),max=await region.evaluate(e=>e.scrollWidth-e.clientWidth);
           if(max>1){
             await region.focus();let left=0,key=0;
             while(left<max-2&&key<500){await region.press('ArrowRight');left=await region.evaluate(e=>e.scrollLeft);key++;}
             ok(left>=max-2,`${view} ${name} local${i} native arrow reaches end`);
             await capture(figure(name),`${view}-${name}-local${i}-end`);report.states.push({name:`${view}-${name}-local${i}`,left,max,keys:key});
             await region.evaluate(e=>e.scrollLeft=0);
           }
         }
       }
     }
     if(view!=='desktop'){
       const equations=page.locator('.cai-math');ok(await equations.count()===14,`${view} all equations present`);
       for(let i=0;i<14;i++){
         const equation=equations.nth(i);await capture(equation,`${view}-equation-${i+1}`);
         const dimensions=await equation.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));
         if(dimensions.scroll>dimensions.width+1){await equation.focus();for(let key=0;key<160;key++)await equation.press('ArrowRight');const end=await equation.evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));ok(end.left>=end.max-2,`${view} equation${i+1} native keyboard reaches end`);await capture(equation,`${view}-equation-${i+1}-end`);report.states.push({name:`${view}-equation-${i+1}-scroll`,...end});}
       }
     }
   }
   await page.setViewportSize({width:320,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,'320 document overflow');
   await page.setViewportSize({width:1366,height:1000});
   await figure('principle-anatomy').getByRole('textbox',{name:'Criterion',exact:true}).fill('');await changed('principle-anatomy','principle-empty',/Incomplete instruction/);await reset('principle-anatomy');
   await figure('critique-context').getByRole('checkbox',{name:'Keep original request x',exact:true}).uncheck();await changed('critique-context','context-missing',/No matching recorded critique/);await reset('critique-context');
   await numeric('revision-ancestry','Completed rounds',0);await changed('revision-ancestry','round-zero',/Revised SFT sequences: 0/);await reset('revision-ancestry');
   await figure('target-masks').getByRole('checkbox',{name:'Ignore every target',exact:true}).check();await changed('target-masks','targets-none',/Mean loss undefined/);await reset('target-masks');
   await figure('parameter-states').getByRole('checkbox',{name:'Freeze student parameters',exact:true}).check();await changed('parameter-states','student-frozen',/Maximum parameter change: 0/);await reset('parameter-states');
   await numeric('choice-mass','Toy logit A',-10000);await numeric('choice-mass','Toy logit B',-10000);await changed('choice-mass','choice-extreme',/q\(A \| A or B\).*0.5/s);await reset('choice-mass');
   await figure('order-mapping').getByRole('checkbox',{name:'Second pass unavailable',exact:true}).check();await changed('order-mapping','order-missing',/Mean unknown/);await reset('order-mapping');
   await numeric('label-transform','Clamp lower',.9);await changed('label-transform','clamp-invalid',/lower bound exceeds/);await reset('label-transform');
   await numeric('reward-head','Common score offset',100);await changed('reward-head','common-offset',/sigmoid = 0.731059/);await reset('reward-head');
   await figure('preference-gradient').getByRole('button',{name:'Set q to current p (null gradient)',exact:true}).click();await changed('preference-gradient','gradient-null',/Exact zero-update/);await reset('preference-gradient');
   await figure('preference-cycle').getByRole('checkbox',{name:'Cycle: R3 preferred to R1',exact:true}).uncheck();await changed('preference-cycle','cycle-transitive',/Transitive targets/);await reset('preference-cycle');
   await numeric('policy-anchor','Reference weight R3',0);await changed('policy-anchor','policy-zero-support',/excluded: reference zero/);await reset('policy-anchor');
   await numeric('policy-anchor','KL weight β',0);await changed('policy-anchor','policy-beta-zero',/β=0 limit/);await reset('policy-anchor');
   await figure('dpo-update').getByRole('combobox',{name:'Chosen',exact:true}).selectOption('0');await changed('dpo-update','dpo-identical',/No directional information/);await reset('dpo-update');
   await figure('real-record-audit').getByRole('combobox',{name:'Original served row index',exact:true}).selectOption('40');await changed('real-record-audit','record-duplicate',/yes · zero response difference/);await reset('real-record-audit');
   await figure('seq2seq-anatomy').getByRole('combobox',{name:'Recorded request',exact:true}).selectOption('polite-message');await changed('seq2seq-anatomy','critic-identical',/exact duplicate=yes/);await reset('seq2seq-anatomy');
   await figure('coverage-counts').getByRole('checkbox',{name:'Exclude benign stratum',exact:true}).check();await changed('coverage-counts','coverage-empty',/no denominator, unknown/);await reset('coverage-counts');
   await figure('calibration-bins').getByRole('checkbox',{name:'No held-out rows',exact:true}).check();await changed('calibration-bins','calibration-empty',/error=unknown/);await reset('calibration-bins');
   await figure('error-dependence').getByRole('checkbox',{name:'All labelers share one error bit',exact:true}).check();await changed('error-dependence','errors-shared',/masses=0.2/);await reset('error-dependence');
   await figure('collective-votes').getByRole('button',{name:'Use 13/20 in both groups',exact:true}).click();await changed('collective-votes','votes-broad',/GAC product=0.4225/);await reset('collective-votes');
   await figure('work-ledger').getByRole('button',{name:'No collection and no pairs (zero-work case)',exact:true}).click();await changed('work-ledger','work-zero',/total call tokens: 0/);await reset('work-ledger');
   fs.mkdirSync(`${output}/downloads`,{recursive:true});
   const files=['constitutional_records.py','preference_labels.py','preference_model.py','policy_learning.py','audit_cai_data.py','torch_training.py','transformers_critic.py'];
   for(let i=0;i<files.length;i++){
     const file=files[i],element=page.locator('.lesson-code-source').nth(i);
     await element.scrollIntoViewIfNeeded();await element.locator('.lesson-code pre code').waitFor();
     const expected=fs.readFileSync(`public/learn/examples/constitutional-ai/${file}`,'utf8');
     const visible=await element.locator('pre code').textContent();ok(visible===expected,`${file} complete displayed bytes`);
     await element.getByRole('button',{name:`Copy ${file}`,exact:true}).click();await element.locator('[data-copied]').waitFor();
     const copied=await page.evaluate(()=>navigator.clipboard.readText());ok(copied.replace(/\r\n/g,'\n')===expected.replace(/\r\n/g,'\n'),`${file} native Windows clipboard LF/CRLF normalization only`);
     const [download]=await Promise.all([page.waitForEvent('download'),element.getByRole('link',{name:`Download ${file}`,exact:true}).click()]);
     const destination=`${output}/downloads/${file}`;await download.saveAs(destination);ok(hash(destination)===hash(`public/learn/examples/constitutional-ai/${file}`),`${file} byte-exact download`);report.programs.push({file,displayed:true,copied:true,downloadedSha256:hash(destination)});
   }
   await page.route('**/learn/examples/constitutional-ai/cai_records.json',route=>route.fulfill({status:503,body:'temporarily unavailable'}));
   await page.reload({waitUntil:'domcontentloaded'});await figure('real-record-audit').getByRole('alert').waitFor();await changed('real-record-audit','artifact-failure',/503.*No values/s);await page.unroute('**/learn/examples/constitutional-ai/cai_records.json');await figure('real-record-audit').getByRole('button',{name:'Retry artifact',exact:true}).click();await figure('real-record-audit').locator('.cai-record').waitFor();ok(await figure('real-record-audit').innerText().then(x=>x.includes('d3bcfff6')),'retry exact artifact');
   ok(errors.length===0,`page errors: ${errors.join('; ')}`);
   report.status='passed';
 }catch(error){report.status='failed';report.error=String(error.stack||error);}
 finally{report.checks=checks;report.pageErrors=errors;fs.writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({status:report.status,checks,error:report.error,output}));if(report.status!=='passed')process.exitCode=1;
})();
