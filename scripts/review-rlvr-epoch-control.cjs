const fs = require('node:fs');
const {createHash} = require('node:crypto');
const {chromium} = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const dir = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/runtime-browser-capture';
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const report={at:new Date().toISOString(),states:[],pageErrors:[],files:Object.fromEntries(['src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','scripts/review-rlvr-epoch-control.cjs'].map(p=>[p,sha(p)]))};
 let readAfterFailure;
 try {
  const page=await browser.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.goto('http://127.0.0.1:4254/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models',{timeout:90000});
  const figure=page.locator('[data-rlvr-figure="D30"]');
  await figure.scrollIntoViewIfNeeded();
  const epoch=figure.locator('label').filter({hasText:'Saved rescore epoch'}).locator('select');
  await epoch.waitFor({timeout:90000});
  const read=()=>figure.evaluate(n=>({controls:[...n.querySelectorAll('input,select')].map(x=>({label:x.closest('label')?.innerText,value:x.value})),selected:[...n.querySelectorAll('p')].find(p=>p.textContent.startsWith('Selected epoch'))?.textContent,tables:[...n.querySelectorAll('table')].map(t=>t.innerText)}));
  readAfterFailure=read;
  report.states.push({name:'default',...await read()});
  const ambiguousResult=await epoch.selectOption('1');
  report.states.push({name:'ambiguous string selection',returned:ambiguousResult,...await read()});
  const explicitResult=await epoch.selectOption({value:'1'});
  report.states.push({name:'explicit option value selection',returned:explicitResult,...await read()});
  await page.waitForFunction(()=>document.querySelector('[data-rlvr-figure="D30"]').textContent.includes('Selected epoch 2:'),{},{timeout:20000});
  report.states.push({name:'default second epoch',...await read()});
  await figure.getByRole('button',{name:'Reset',exact:true}).click();
  await figure.locator('label').filter({hasText:'Recorded seed'}).locator('select').selectOption({value:'29'});
  await figure.locator('label').filter({hasText:'Recorded arm'}).locator('select').waitFor({timeout:90000});
  await figure.locator('label').filter({hasText:'Recorded arm'}).locator('select').selectOption({value:'unscaled-centred-grpo'});
  await epoch.waitFor({timeout:90000});
  await figure.locator('input[type=range]').focus();
  await figure.locator('input[type=range]').press('Home');
  await figure.locator('input[type=range]').press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('[data-rlvr-figure="D30"] input[type=range]')?.value==='2');
  report.states.push({name:'seed29 unscaled rollout2 first epoch',...await read()});
  await epoch.selectOption({value:'1'});
  await page.waitForFunction(()=>document.querySelector('[data-rlvr-figure="D30"]').textContent.includes('Selected epoch 2:'),{},{timeout:20000});
  report.states.push({name:'seed29 unscaled rollout2 second epoch',...await read()});
  report.passed=report.pageErrors.length===0;
 } catch(e) {report.passed=false;report.failure=e.stack;if(readAfterFailure)report.states.push({name:'after wait failure',...await readAfterFailure()});}
 finally {await browser.close();fs.writeFileSync(`${dir}/epoch-control-explicit-value.json`,JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
 console.log(JSON.stringify({passed:report.passed,states:report.states.map(s=>({name:s.name,selected:s.selected})),failure:report.failure,pageErrors:report.pageErrors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
