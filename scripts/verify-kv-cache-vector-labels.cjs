const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
const output = path.resolve(topic, `browser-vector-labels-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const paths = ['src/learn/components/lesson-labs/KvCacheShared.jsx','src/learn/components/lesson-labs/kv-cache-flow.css','src/learn/data/kv-cache-models.js'];
const hashes = () => Object.fromEntries(paths.map(p => [p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report = { before: hashes(), checks: [], captures: [], errors: [] };
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const context = await browser.newContext({viewport:{width:1366,height:1000}});
  await require('./lib/lesson-browser-fonts.cjs')(context);
  const page = await context.newPage(); page.on('pageerror',e=>report.errors.push(e.message));
  await page.request.get('http://127.0.0.1:4261/__llm_refresh');
  await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models');
  await page.locator('[data-kv-figure="D26"]').waitFor({timeout:60000});
  await page.addStyleTag({content:'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}'});
  for(const [width,font,profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]) {
   await page.setViewportSize({width,height:1000}); await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',font);
   for(const id of ['D04','D18','D23','D25','D26']) {
    const figure=page.locator(`[data-kv-figure="${id}"]`);
    for(const changed of [false,true]) {
     if(changed) {
      if(id==='D04') await figure.getByRole('checkbox').check();
      else if(id==='D18') await figure.getByRole('checkbox').check();
      else if(id==='D23') await figure.getByRole('checkbox').check();
      else if(id==='D25') await figure.getByRole('slider',{name:/Rotation angle/}).fill('0');
      else continue;
     }
     for(const [i,legend] of (await figure.locator('.kv-legend').all()).entries()) {
      assert.ok(await legend.locator('.kv-number').count());
      assert.ok(await legend.locator('.kv-number').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).whiteSpace==='nowrap')));
      const name=`${profile}-${id}-${changed?'changed':'default'}-legend${i}`;
      const file=path.join(output,name+'.png'), item=await capture(page,legend,file);
      report.captures.push({name,file,tiles:item.tiles.map(t=>t.path)});
     }
    }
    const reset=figure.getByRole('button',{name:'Reset',exact:true}); if(await reset.count()) await reset.click();
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   report.checks.push(profile+': every vector legend default/meaningful changed state has unbroken numeric cells and no page overflow');
  }
  assert.deepEqual(report.errors,[]);report.after=hashes();assert.deepEqual(report.after,report.before);report.status='passed';
 } catch(e) {report.failure=e.stack;process.exitCode=1;}
 finally {await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,captures:report.captures.length,failure:report.failure}));}
})();
