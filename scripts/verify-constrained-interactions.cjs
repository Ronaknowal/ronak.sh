const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar',out=path.join(folder,process.argv[2]||'browser-interactions');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const checks=[],images=[],errors=[],sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[`${folder}/lesson.jsx`,'src/learn/data/constrained-decoding-models.js',...['Shared','Foundations','State','Evidence'].map(n=>`src/learn/components/lesson-labs/ConstrainedDecoding${n}.jsx`),'src/learn/components/lesson-labs/constrained-decoding.css'];
const bindings=files.map(p=>({path:p,sha256:sha(p)}));
const check=(name,value,data)=>{checks.push({name,passed:Boolean(value),data});if(!value)throw Error(name+': '+JSON.stringify(data));};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));let failure;
const url='http://127.0.0.1:4264/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models';
try{
 await page.request.get('http://127.0.0.1:4264/__llm_refresh');await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.locator('[data-cd-figure="D22"] select').first().waitFor({timeout:90000});
 const f=id=>page.locator(`[data-cd-figure="${id}"]`);
 const select=async(id,label,value)=>f(id).getByRole('combobox',{name:label,exact:true}).selectOption(value);
 async function range(id,label,keys){const input=f(id).getByRole('slider',{name:new RegExp(label)});await input.focus();for(const key of keys)await input.press(key);}
 async function expect(id,text){await page.waitForFunction(({id,text})=>document.querySelector(`[data-cd-figure="${id}"]`).innerText.includes(text),{id,text});check(`${id} includes ${text}`,(await f(id).innerText()).includes(text));}
 const scenarios=[
 ['D03',async()=>{await f('D03').getByRole('textbox').fill('cat');await expect('D03','accepting — EOS allowed');await f('D03').getByRole('textbox').fill('cab');await expect('D03','dead');}],
 ['D04',async()=>{await f('D04').getByRole('textbox').fill('3.2x');await expect('D04','invalid prefix');await f('D04').getByRole('textbox').fill('3😀');await expect('D04','invalid prefix');}],
 ['D05',async()=>{await select('D05','Grammar prefix','3.');await select('D05','Token ID','4');await expect('D05','× rejected');await select('D05','Grammar prefix','3');await expect('D05','terminated');}],
 ['D06',async()=>{await f('D06').getByRole('textbox').fill('x');await expect('D06','Empty support');}],
 ['D07',async()=>{await range('D07','k',['End']);await expect('D07','Both routes agree.');}],
 ['D08',async()=>{await f('D08').getByRole('textbox').fill('bc');await expect('D08','NFA closure {6}');await f('D08').getByRole('textbox').fill('ba');await expect('D08','Dead.');}],
 ['D09',async()=>{await f('D09').getByRole('textbox').fill('b');await expect('D09','Allowed IDs: 0.');await expect('D09','Trie tests 4 byte edges');}],
 ['D10',async()=>{await f('D10').getByRole('textbox').fill('3.');await expect('D10','Selected state: dot');}],
 ['D11',async()=>{await select('D11','Byte sequence','E2 41');await expect('D11','Rejected at byte 2');}],
 ['D14',async()=>{await range('D14','Bytes consumed',['End']);await expect('D14','Complete value.');await f('D14').getByRole('textbox').fill('[😀');await expect('D14','Expected a digit');await f('D14').getByRole('textbox').fill('[[[[[[[[[');await expect('D14','Depth guard reached');}],
 ['D15',async()=>{await f('D15').getByRole('button',{name:'A accepts [',exact:true}).click();await f('D15').getByRole('button',{name:'B accepts 7',exact:true}).click();await f('D15').getByRole('button',{name:'A rollback',exact:true}).click();await expect('D15','A prefix: [2,; B prefix: [2,7.');}],
 ['D17',async()=>{await select('D17','Fixture','euro');await expect('D17','Unavailable: incomplete UTF-8');await select('D17','Stop policy','cancel');await expect('D17','canceled');await range('D17','Accepted token cap',['End']);await expect('D17','eos');}],
 ['D18',async()=>{await range('D18','P\\(x \\| A\\)',['Home']);await range('D18','P\\(x \\| B\\)',['Home']);await expect('D18','no valid mass');}],
 ['D20',async()=>{await f('D20').getByRole('button',{name:'A accepts 42',exact:true}).click();await f('D20').getByRole('button',{name:'B accepts 7',exact:true}).click();await f('D20').getByRole('button',{name:'A rollback',exact:true}).click();const rows=await f('D20').locator('tbody tr').allTextContents();check('A rollback leaves B intact',rows[0].includes('start')&&rows[1].includes('"7"')&&rows[1].includes('integer'),rows);}],
 ['D21',async()=>{await range('D21','Recorded action',['Home',...Array(5).fill('ArrowRight')]);await expect('D21','No further mask requested after termination.');}],
 ['D22',async()=>{await select('D22','Source row','2');await select('D22','Generation arm','schema_manual');await expect('D22','5.0999999999999996');}],
 ['D23',async()=>{await select('D23','Evaluation metric','exact');check('all four exact totals remain0/12',(await f('D23').locator('tbody tr').last().innerText()).match(/0 \/ 12/g)?.length===4);}],
 ['D24',async()=>{await select('D24','Parent continuation','c');await expect('D24','rejected after return');}],
 ['D25',async()=>{await range('D25','Model work',['Home']);await range('D25','Mask work',['Home']);await expect('D25','Serial = 1 ms. Ideal overlap = 1 ms');}],
 ['D26',async()=>{await range('D26','Retry failure',['Home']);await expect('D26','No crossover');}],
 ];
 for(const profile of(process.argv[3]==='delivery-only'?[]:[{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}])){
  await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',profile.font);
  for(const[id,change]of scenarios.filter(([id])=>!process.argv[4]||process.argv[4].split(',').includes(id))){const initial=await f(id).locator('input,select').evaluateAll(nodes=>nodes.map(n=>n.value));await change();await f(id).scrollIntoViewIfNeeded();const p=path.join(out,'screenshots',`${profile.name}-${id}-changed.png`);await f(id).screenshot({path:p,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});images.push({path:p,sha256:sha(p)});check(`${profile.name}/${id} containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await f(id).getByRole('button',{name:'Reset',exact:true}).click();check(`${profile.name}/${id} reset`,JSON.stringify(await f(id).locator('input,select').evaluateAll(nodes=>nodes.map(n=>n.value)))===JSON.stringify(initial));}
 }
 await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 if(process.argv[3]!=='controls-only'){
 const names=JSON.parse(fs.readFileSync(`${folder}/runtime-compatibility.json`)).programs;
 for(let i=0;i<names.length;i++){
  const file=names[i],source=page.locator('.lesson-code-source').nth(i);if(file==='practice.py')await blocksForCode();await source.scrollIntoViewIfNeeded();await source.locator('pre code').waitFor();const original=fs.readFileSync(`public/learn/examples/constrained-decoding/${file}`,'utf8');check(`visible complete ${file}`,(await source.locator('pre code').textContent())===original);
  await source.getByRole('button',{name:`Copy ${file}`,exact:true}).click();await source.locator('[data-copied]').waitFor();const copied=await page.evaluate(()=>navigator.clipboard.readText());check(`native clipboard ${file} (Windows newline normalization)`,copied.replaceAll('\r\n','\n')===original.replaceAll('\r\n','\n'));
  const pending=page.waitForEvent('download');await source.getByRole('link',{name:`Download ${file}`,exact:true}).click();const download=await pending;check(`native download ${file}`,sha(await download.path())===sha(`public/learn/examples/constrained-decoding/${file}`));
 }
 async function blocksForCode(){const d=page.locator('[data-lesson-exercise]').last().locator('details').last();if(await d.getAttribute('open')===null)await d.locator('summary').click();}
 const blocks=page.locator('[data-lesson-exercise]');for(let i=0;i<14;i++){for(const d of await blocks.nth(i).locator('details').all()){if(await d.getAttribute('open')===null)await d.locator('summary').click();}check(`practice ${i+1} opens`,await blocks.nth(i).locator('details[open]').count()===2);}
 check('no KaTeX errors',await page.locator('.cd-flow .katex-error').count()===0);check('11 legacy aliases',await page.locator('.cd-flow span[aria-hidden="true"][id]').count()===11);
 const retryPage=await context.newPage();let blocked=true;for(const file of['native-masks.json','token_index.py'])await retryPage.route('**/learn/examples/constrained-decoding/'+file,r=>blocked?r.fulfill({status:503,body:'unavailable'}):r.continue());await retryPage.goto(url,{waitUntil:'domcontentloaded'});await retryPage.locator('[data-cd-figure="D21"] [role="alert"]').waitFor();const code=retryPage.locator('.lesson-code-source').first();await code.scrollIntoViewIfNeeded();await code.locator('[role="alert"]').waitFor();blocked=false;await code.getByRole('button',{name:'Retry',exact:true}).click();await code.locator('pre code').waitFor();check('code Retry restores whole source',await code.locator('pre code').textContent()===fs.readFileSync('public/learn/examples/constrained-decoding/token_index.py','utf8'));await retryPage.locator('[data-cd-figure="D21"]').getByRole('button',{name:'Retry',exact:true}).click();await retryPage.locator('[data-cd-figure="D21"] input').waitFor();check('evidence Retry restored',await retryPage.locator('[data-cd-figure="D21"] input').count()===1);await retryPage.close();
 }
 check('no runtime errors',errors.length===0,errors);for(const b of bindings)check(`current ${b.path}`,sha(b.path)===b.sha256);
}catch(e){failure=e.stack;}await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,checks,images,bindings,errors},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;
})();
