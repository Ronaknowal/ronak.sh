const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const topic='docs/teaching/llm-architecture-training/supervised-fine-tuning-sft';
const out=path.resolve(topic,'reading-evidence-stable');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const report={captures:[],checks:[],errors:[]};
try{const context=await browser.newContext({viewport:{width:1366,height:1000}});await require('./lib/lesson-browser-fonts.cjs')(context);const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});await page.locator('[data-sft-figure="S21"]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important}'});
const flow=page.locator('.sft-flow');
const shot=async(name,element,whole=false)=>{await element.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());const filename=name+'.png';if(whole){await page.waitForTimeout(150);await element.screenshot({path:path.join(out,filename),style:'.site-header--learn,.site-skip{visibility:hidden!important}'});}else{await element.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(250);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(out,filename)});}report.captures.push(filename);};
for(const [width,font,size]of[[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]){await page.setViewportSize({width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',font);await shot(size+'-opening',page.locator('h1').first());
const headings=await flow.locator('h2').all();for(let i=0;i<headings.length;i++)await shot(size+'-section-'+String(i+1).padStart(2,'0'),headings[i]);
for(const end of await flow.locator('[data-lesson-ending]').all()){const kind=await end.getAttribute('data-lesson-ending');await shot(size+'-ending-'+kind,end,true);}
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);}
await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
for(const [i,exercise]of(await flow.locator('[data-lesson-exercise]').all()).entries()){for(const summary of await exercise.locator('summary').all())await summary.click();await shot('practice-'+String(i+1).padStart(2,'0'),exercise,true);}
for(const block of await flow.locator('.lesson-code-source').all()){await block.scrollIntoViewIfNeeded();await block.locator('pre').waitFor();const filename=await block.locator('.lesson-code__filename').innerText();assert.ok((await block.locator('pre').innerText()).split('\n').length>60);report.checks.push('Multiline full program '+filename);}
const text=await flow.innerText();fs.writeFileSync(path.join(out,'complete-rendered-text.txt'),text);
assert.equal(await flow.locator('[data-lesson-exercise]').count(),13);assert.equal(await flow.locator('[data-lesson-ending]').count(),4);
report.checks.push('All13 practice hints and worked solutions opened; all4 endings present; complete rendered text retained');
const bad=await flow.locator('.katex-error').count();assert.equal(bad,0);assert.deepEqual(report.errors,[]);
report.links=await flow.locator('a').evaluateAll(els=>els.map(el=>({text:el.innerText,href:el.getAttribute('href')})));
report.bindings=Object.fromEntries([topic+'/lesson.jsx','src/learn/components/lesson-labs/sft-flow.css','src/learn/components/lesson-labs/SftFlowShared.jsx',...['SftFoundations','SftBatching','SftStudy'].map(n=>'src/learn/components/lesson-labs/'+n+'.jsx')].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));report.status='passed';console.log(JSON.stringify({status:report.status,captures:report.captures.length,checks:report.checks}));
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(out,'report-'+Date.now()+'.json'),JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
