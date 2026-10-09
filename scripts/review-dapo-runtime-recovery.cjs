// Focused continuation after the whole root browser run's ambiguous wait selector.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out),'Fresh receipt required');
const root='docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const priorPath=`${root}/runtime-independent-browser/report.json`;
const prior=JSON.parse(fs.readFileSync(priorPath));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={at:new Date().toISOString(),prior:{path:priorPath,sha256:sha(priorPath),checks:prior.checks.length,captures:prior.captures.length},files:{},checks:[],errors:[]};
assert.ok(prior.failure.includes('strict mode violation')&&prior.checks.length===53,'Known preserved verifier failure');
// D01 may receive a separately reviewed contrast-only successor. Recovery does
// not rely on D01; every source on the actual evidence loading path stays fixed.
for(const p of Object.keys(prior.sources).filter(p=>!p.endsWith('DapoFoundations.jsx'))){assert.equal(sha(p),prior.sources[p],p);report.files[p]=sha(p);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext();await require('./lib/lesson-browser-fonts.cjs')(context);
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  let deny=true;
  await page.route('**/learn-code/dapo/runtime-observations.json',route=>deny?route.fulfill({status:503,body:'temporarily unavailable'}):route.continue());
  await page.goto('http://127.0.0.1:4253/learn/path/full-curriculum/dapo-dynamic-adaptive-policy-optimization?module=large-language-models',{waitUntil:'domcontentloaded'});
  const figure=page.locator('[data-dapo-figure="D26"]');
  await figure.getByRole('button',{name:'Retry recorded observations',exact:true}).waitFor();
  assert.ok((await figure.innerText()).includes('could not load'));report.checks.push('Failed evidence request is explicit without fabricated values');
  deny=false;await figure.getByRole('button',{name:'Retry recorded observations',exact:true}).click();
  const cases=figure.getByRole('combobox',{name:'Saved parity case',exact:true});await cases.waitFor();
  assert.equal(await cases.locator('option').count(),8);report.checks.push('Retry restores all eight exact saved cases');
  await cases.selectOption('7');assert.ok((await figure.innerText()).includes('zero loss/gradient signal'));report.checks.push('Recovered data preserves actual zero-gradient case');
  assert.deepEqual(report.errors,[]);report.checks.push('No page errors on failure/recovery');
  for(const[p,h]of Object.entries(report.files))assert.equal(sha(p),h,p);
  report.status='passed';
 }catch(error){report.status='failed';report.failure=error.stack;process.exitCode=1;}
 finally{await browser.close();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,checks:report.checks.length,failure:report.failure}));}
})();
