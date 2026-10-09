const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const capture=require('./lib/kv-cache-browser-capture.cjs');
const topic='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const output=path.resolve(topic,`browser-code-layout-${Date.now()}`);fs.mkdirSync(output,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const report={source:sha(`${topic}/lesson.jsx`),captures:[],checks:[],errors:[]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const context=await browser.newContext();await require('./lib/lesson-browser-fonts.cjs')(context);const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models',{waitUntil:'domcontentloaded'});await page.locator('[data-pc-figure="D29"]').waitFor();
for(const [profile,width,font] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
await page.setViewportSize({width,height:1000});await page.evaluate(v=>document.documentElement.style.fontSize=v+'px',font);await page.evaluate(()=>document.fonts.ready);
for(const index of [0,4,8]){const source=page.locator('.lesson-code-source').nth(index);await source.scrollIntoViewIfNeeded();await source.locator('pre code').waitFor();
const pre=source.locator('pre');for(const end of [false,true]){await pre.evaluate((e,end)=>{e.scrollTop=end?e.scrollHeight:0;e.scrollLeft=end?e.scrollWidth:0;},end);const name=`${profile}-program${index}-${end?'end-right':'start'}`,file=path.join(output,name+'.png'),r=await capture(page,source,file);report.captures.push({name,file,tiles:r.tiles.map(t=>t.path)});report.checks.push({name,scroll:await pre.evaluate(e=>({top:e.scrollTop,left:e.scrollLeft,width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight}))});}
}
}
assert.equal(report.source,sha(`${topic}/lesson.jsx`));assert.equal(report.errors.length,0);report.status='PASS';
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,status:report.status,failure:report.failure}));}})();
