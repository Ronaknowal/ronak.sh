const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/moe-training-expert-load-balancing';
const packet=`${folder}/runtime-author-ready-successor.json`,sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const frozen=JSON.parse(fs.readFileSync(packet));assert.equal(sha(packet),'5507f79e99594f16c0a6a141576386b7458be543aab17ec64bc2aa13f5a99066');
for(const [p,h]of Object.entries({...frozen.contentBindings,...frozen.files}))assert.equal(sha(p),h,p);
const out=`${folder}/browser-root-closure`;fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[],captures=[],errors=[];try{
const context=await browser.newContext();await require('./lib/lesson-browser-fonts.cjs')(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
await page.request.get('http://127.0.0.1:4250/__llm_refresh');await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/moe-training-expert-load-balancing?module=large-language-models');
const device=page.locator('[data-moe-figure="M19"]');await device.waitFor({timeout:90000});
for(const[name,width,size]of[['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
 await page.setViewportSize({width,height:1000});await page.evaluate(s=>document.documentElement.style.fontSize=`${s}px`,size);
 const placement=device.getByRole('button',{name:/E0 on rank/}),local=device.getByRole('button',{name:/All-local comparison/});
 await local.click();assert.ok(await placement.isDisabled());assert.equal(await placement.innerText(),'E0 on rank 0 (all local)');
 await device.getByRole('button',{name:'t2 requests E1/E3',exact:true}).click();
 assert.match(await device.innerText(),/payload 0 bytes/);assert.match(await device.innerText(),/Rank row work \[8, 0\]/);
 const controls=device.locator('.moet-controls');await controls.scrollIntoViewIfNeeded();const p=`${out}/${name}-local-changed-request.png`;
 await controls.screenshot({path:p,style:'.site-header--learn,.site-skip{visibility:hidden!important}'});captures.push(p);
 await local.click();assert.ok(await placement.isEnabled());assert.equal(await placement.getAttribute('aria-pressed'),'false');
 await placement.click();assert.equal(await placement.innerText(),'E0 on rank 1');assert.match(await device.innerText(),/payload 48 bytes/);
 await local.click();await local.click();assert.equal(await placement.innerText(),'E0 on rank 1');
 await device.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await placement.innerText(),'E0 on rank 0');
 assert.equal(await device.getByRole('button',{name:'t2 requests E1/E3',exact:true}).getAttribute('aria-pressed'),'false');
 assert.equal(await local.getAttribute('aria-pressed'),'false');
 const anatomy=page.locator('[data-moe-figure="M01"]');
 const position=anatomy.getByRole('region',{name:/Permitted prefix/});await position.focus();await position.evaluate(el=>el.scrollLeft=el.scrollWidth);
 const p2=`${out}/${name}-prefix-right.png`;await position.locator('..').screenshot({path:p2,style:'.site-header--learn,.site-skip{visibility:hidden!important}'});captures.push(p2);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 checks.push(`${name}: override-first, changed request, move, restore, reset and complete rightmost prefix position`);
}
assert.deepEqual(errors,[]);for(const[p,h]of Object.entries({...frozen.contentBindings,...frozen.files}))assert.equal(sha(p),h,p);
fs.writeFileSync(`${out}/report.json`,JSON.stringify({passed:true,reviewer:'root',packet:sha(packet),checks,errors,captures:Object.fromEntries(captures.map(p=>[p,sha(p)])),scope:'Complementary interaction order and affected views; retained full independent review and unchanged native science compose this closure'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(checks));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
