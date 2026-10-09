const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/llm-architecture-training/speculative-decoding';
const out = path.join(folder, 'browser-paint-closure-r2');
fs.mkdirSync(out, { recursive: true });
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const inputs = ['SpeculativeFoundations', 'SpeculativeProposers'].map(n => ({path: `src/learn/components/lesson-labs/${n}.jsx`, sha256: sha(`src/learn/components/lesson-labs/${n}.jsx`)}));
const images = [], checks = [];
const check = (name, pass) => { checks.push({name, pass: Boolean(pass)}); if (!pass) throw Error(name); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  let failure;
  try {
    await page.request.get('http://127.0.0.1:4262/__llm_refresh');
    await page.goto('http://127.0.0.1:4262/learn/path/full-curriculum/speculative-decoding?module=large-language-models');
    await page.locator('[data-speculative-figure="D01"]').waitFor();
    for (const n of [23,26]) { const f = page.locator(`[data-speculative-figure="D${n}"]`); await f.scrollIntoViewIfNeeded(); await f.locator('table').first().waitFor(); }
    const cases = [
      { id:'D08', name:'default', selections:[] },
      { id:'D08', name:'uniform-zero', selections:[], zero:true },
      { id:'D08', name:'zero-target', selections:[['Probability pair','disjoint']], zero:true },
      { id:'D08', name:'zero-proposal', selections:[['Probability pair','disjoint'],['Proposed token','1']] },
      { id:'D23', name:'node0', selections:[['Select node/path','0']] },
      { id:'D25', name:'accept-first', selections:[['First q proposal','0']] },
      { id:'D26', name:'joint', selections:[['Training gradient route','joint']] },
      { id:'D28', name:'teacher', selections:[['Second training-step state','teacher']] },
    ];
    for (const state of cases) {
      const figure = page.locator(`[data-speculative-figure="${state.id}"]`);
      await figure.scrollIntoViewIfNeeded(); await figure.getByRole('button',{name:'Reset',exact:true}).click();
      for (const [label,value] of state.selections) await figure.getByLabel(new RegExp('^'+label)).selectOption({value});
      if (state.zero) await figure.getByLabel(/^Acceptance uniform/).press('Home');
      for (const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]) {
        await page.setViewportSize({width:profile.width,height:1000}); await page.evaluate(font=>document.documentElement.style.fontSize=`${font}px`,profile.font);
        await figure.scrollIntoViewIfNeeded();
        check(`${state.id}/${state.name}/${profile.name} containment and controls`,await figure.evaluate(e=>document.documentElement.scrollWidth<=innerWidth+1&&[...e.querySelectorAll('input')].every(i=>i.validity.valid)));
        const stem=`${profile.name}-${state.id}-${state.name}`;
        const file=path.join(out,`${stem}.png`); await figure.screenshot({path:file,style:'.site-header--learn{visibility:hidden!important}'}); images.push({id:state.id,state:state.name,profile:profile.name,path:file,sha256:sha(file)});
        const local=figure.locator('.speculative-local').first();
        const size=await local.evaluate(e=>({width:e.clientWidth,total:e.scrollWidth}));
        const offsets=[0]; while(offsets.at(-1)+size.width<size.total) offsets.push(Math.min(size.total-size.width,offsets.at(-1)+size.width));
        for(const x of [...new Set(offsets)]) { await local.evaluate((e,x)=>e.scrollLeft=x,x); const actual=await local.evaluate(e=>e.scrollLeft); const pan=path.join(out,`${stem}-x${actual}.png`); await local.screenshot({path:pan,style:'.site-header--learn{visibility:hidden!important}'}); images.push({id:state.id,state:state.name,profile:profile.name,local:0,offset:actual,total:size.total,width:size.width,path:pan,sha256:sha(pan)}); }
        await local.evaluate(e=>e.scrollLeft=0);
      }
    }
    for(const i of inputs) check(`Unchanged ${i.path}`,sha(i.path)===i.sha256);
  } catch(e) { failure=e.stack; }
  await browser.close();
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:!failure,failure,inputs,checks,images,scope:'Only five label/marker presentation corrections; no scientific execution.'},null,2)+'\n');
  console.log(JSON.stringify({passed:!failure,failure,checks:checks.length,images:images.length})); if(failure)process.exitCode=1;
})();

