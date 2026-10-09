const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const output = path.resolve(topic, `browser-middle-${Date.now()}`);
fs.mkdirSync(output, {recursive:true});
const sources = JSON.parse(fs.readFileSync(`${topic}/browser-controls-1791489059575/report.json`)).after;
const hashes = () => Object.fromEntries(Object.keys(sources).map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report = {before:hashes(), captures:[], checks:[], errors:[]};
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1366,height:1000}});
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto('http://127.0.0.1:4261/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models');
    await page.locator('[data-cb-figure="D30"]').waitFor();
    await page.addStyleTag({content:'*{scroll-behavior:auto!important;overflow-anchor:none!important}'});
    for(const [width,font,profile] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'enlarged']]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',font);
      for(let n=1;n<=30;n++) {
        const id=`D${String(n).padStart(2,'0')}`;
        const figure=page.locator(`[data-cb-figure="${id}"]`);
        if([26,30].includes(n)) {
          const file=path.join(output,`${profile}-${id}-final-default.png`);
          const result=await capture(page,figure,file);
          report.captures.push({name:`${profile}-${id}-final-default`,file,tiles:result.tiles.map(x=>x.path)});
        }
        if(profile==='desktop')continue;
        let index=0;
        for(const pane of await figure.locator('.cb-scroll').all()) {
          const geometry=await pane.evaluate(e=>({width:e.clientWidth,total:e.scrollWidth}));
          if(geometry.total>2*geometry.width+2) {
            for(let pos=geometry.width;pos<geometry.total-geometry.width;pos+=geometry.width) {
              await pane.focus();
              await pane.evaluate((e,x)=>{e.scrollLeft=x},pos);
              const actual=await pane.evaluate(e=>e.scrollLeft);
              const name=`${profile}-${id}-pane${index}-x${actual}`;
              const file=path.join(output,`${name}.png`);
              const result=await capture(page,pane,file);
              report.captures.push({name,file,tiles:result.tiles.map(x=>x.path)});
              report.checks.push({profile,id,index,requested:pos,actual,...geometry});
            }
            await pane.evaluate(e=>e.scrollLeft=0);
          }
          index++;
        }
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    assert.deepEqual(report.errors,[]);
    report.after=hashes();
    assert.deepEqual(report.after,report.before);
    assert.deepEqual(report.before,sources);
    report.status='passed; actual pixel reading recorded separately';
  }catch(e){report.failure=e.stack;process.exitCode=1}
  finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,captures:report.captures.length,failure:report.failure}));}
})();
