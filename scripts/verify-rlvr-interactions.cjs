const captureObject = require('./lib/rlvr-browser-capture.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic='docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const destination=path.join(topic,process.argv[2]||'browser-interactions');fs.mkdirSync(path.join(destination,'screenshots'),{recursive:true});
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files=['src/learn/data/rlvr-models.js','src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/rlvr-flow.css',topic+'/lesson.jsx',topic+'/runtime-data-projection.json'];
const bindings=files.map(file=>({path:file,sha256:hash(file)})),checks=[],images=[],errors=[];
function check(name,value,actual){checks.push({name,passed:!!value,actual});if(!value)throw Error(name+': '+JSON.stringify(actual));}
async function loaded(page,figure){await figure.scrollIntoViewIfNeeded();await page.waitForFunction(id=>!document.querySelector(`[data-rlvr-figure="${id}"]`).querySelector('.rlvr-data-view [role="status"]'),await figure.getAttribute('data-rlvr-figure'),{timeout:90000});check('No failed observation '+await figure.getAttribute('data-rlvr-figure'),await figure.locator('[role=alert]').count()===0);}
async function signature(figure){return figure.evaluate(n=>{const clone=n.cloneNode(true);clone.querySelectorAll('.rlvr-controls,.rlvr-scroll-cue').forEach(n=>n.remove());return clone.innerHTML;});}
async function capture(page,figure,name){await figure.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());const file=path.join(destination,'screenshots',name+'.png');await captureObject(page,figure,file);images.push({name,path:'screenshots/'+name+'.png',sha256:hash(file)});}
async function range(control,value){await control.evaluate((node,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,String(value));node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1366,height:1000}});page.on('pageerror',e=>errors.push(e.message));let failure=null;
 try{
  await page.request.get('http://127.0.0.1:4254/__llm_refresh');await page.goto('http://127.0.0.1:4254/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models',{timeout:90000});await page.locator('[data-rlvr-figure="D39"]').waitFor({timeout:90000});
  for(let i=Number(process.argv[3]||1);i<=Number(process.argv[4]||39);i++){
   const id='D'+String(i).padStart(2,'0'),figure=page.locator(`[data-rlvr-figure="${id}"]`);await loaded(page,figure);const initial=await signature(figure);
   const controls=figure.locator('.rlvr-controls input,.rlvr-controls select,.rlvr-controls textarea');
   for(let j=0;j<await controls.count();j++){
    const control=controls.nth(j),spec=await control.evaluate(n=>({tag:n.tagName,type:n.type,value:n.value,disabled:n.disabled,min:n.min,max:n.max,step:n.step,options:n.options?[...n.options].map(o=>o.value):null}));if(spec.disabled)continue;
    const before=await signature(figure);
    if(spec.tag==='SELECT')await control.selectOption({value:spec.options.find(v=>v!==spec.value)});
    else if(spec.tag==='TEXTAREA')await control.fill('🙂 #### 72');
    else if(spec.type==='checkbox')await control.click();
    else if(spec.type==='range'){const next=Number(spec.value)+Number(spec.step||1);await range(control,next<=Number(spec.max)?next:Number(spec.value)-Number(spec.step||1));}
    await page.waitForFunction(({id,before})=>{const node=document.querySelector(`[data-rlvr-figure="${id}"]`);if(node.querySelector('.rlvr-data-view [role="status"]'))return false;const clone=node.cloneNode(true);clone.querySelectorAll('.rlvr-controls,.rlvr-scroll-cue').forEach(n=>n.remove());return clone.innerHTML!==before;},{id,before},{timeout:15000});await loaded(page,figure);const after=await signature(figure);check(id+' control '+j+' changes represented object',before!==after,spec);
   }
   await capture(page,figure,'changed-'+id);await figure.getByRole('button',{name:'Reset',exact:true}).click();await loaded(page,figure);check(id+' Reset restores represented object',await signature(figure)===initial);
  }
  async function state(id,name,action,predicate){const figure=page.locator(`[data-rlvr-figure="${id}"]`);await loaded(page,figure);await action(figure);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await loaded(page,figure);const text=await figure.innerText();check(name,predicate(text),text);await capture(page,figure,name);await figure.getByRole('button',{name:'Reset',exact:true}).click();await loaded(page,figure);}
  if(!process.argv.includes('--no-states')) { await state('D03','unicode-final-span',f=>f.locator('textarea').fill('🙂 #### 72'),t=>t.includes('[7, 9)'));
  await state('D03','empty-final-span',f=>f.locator('textarea').fill('####   '),t=>t.includes('[7, 7)')&&t.includes('unknown'));
  await state('D06','proof-missing-binder',f=>f.locator('select').selectOption('scope'),t=>t.includes('h missing')&&t.includes('No derived implication'));
  await state('D10','group-no-labels',f=>f.locator('select').selectOption('none'),t=>t.includes('Available rows 0')&&t.includes('unknown'));
  await state('D14','empty-target-disabled-length',async f=>{await f.locator('input[type=checkbox]').check();check('Empty-target length override disabled',await f.locator('input[type=range]').isDisabled());},t=>t.includes('No included targets.'));
  await state('D15','infinite-reference-support',f=>range(f.locator('input[type=range]').nth(1),0),t=>t.includes('∞'));
  await state('D18','top1-removes-correct-support',f=>f.locator('select').selectOption('1'),t=>t.includes('zero support')&&t.includes('expected answer reward = 0'));
  await state('D20','selection-no-targets',f=>f.locator('select').selectOption('none'),t=>t.includes('no response targets and no optimizer update'));
  await state('D22','nonpositive-no-affine-result',async f=>{await range(f.locator('input[type=range]').nth(0),.9);await range(f.locator('input[type=range]').nth(1),.2);},t=>t.includes('Nonpositive scale')&&t.includes('unknown'));
  await state('D26','no-answer-conditioning',f=>f.locator('input[type=checkbox]').nth(0).check(),t=>t.includes('0 / 0')&&t.includes('unknown'));
  await state('D30','actual-sft-skip',f=>f.locator('select').nth(1).selectOption('verified-sample-sft'),t=>t.includes('no accepted response')&&t.includes('actual updates 0'));
  await state('D35','separate-mixed-fixture',f=>f.locator('select').nth(1).selectOption('fixture'),t=>t.includes('Constructed mixed fixture')&&t.includes('failed update-equality'));
  await state('D36','out-of-range-subset',f=>range(f.locator('input[type=range]'),9),t=>t.includes('unknown'));
  await state('D39','missing-label-route',f=>f.locator('select').selectOption('missing'),t=>t.includes('Numeric task without gold'));
  }
  check('No runtime errors',errors.length===0,errors);bindings.forEach(b=>check('Unchanged current source '+b.path,hash(b.path)===b.sha256));
 }catch(e){failure=e.stack;}
 await browser.close();fs.writeFileSync(path.join(destination,'report.json'),JSON.stringify({passed:!failure,figureRange:[Number(process.argv[3]||1),Number(process.argv[4]||39)],nullStatesExecuted:!process.argv.includes('--no-states'),bindings,checks,images,errors,failure,scope:'Actual controls change represented structures (control markup removed from comparison), Reset restores objects, plus semantic null/failure states. No scientific replay.'},null,2)+'\n');console.log(JSON.stringify({passed:!failure,checks:checks.length,images:images.length,failure}));if(failure)process.exitCode=1;
})();
