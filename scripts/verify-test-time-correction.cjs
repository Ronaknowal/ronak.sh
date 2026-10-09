const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/test-time-compute-scaling';
const frontierOnly = process.argv.includes('--frontier-only');
const out = `${base}/runtime-correction/${frontierOnly ? 'browser-frontier' : 'browser'}`;
fs.mkdirSync(out, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = JSON.parse(fs.readFileSync(`${base}/runtime-correction/${frontierOnly ? 'source-checks-frontier' : 'source-checks'}.json`)).files;
const checks = [], images = [], errors = [];
const check = (name, value, detail) => { checks.push({name, passed:!!value, detail}); assert.ok(value, name); };
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const page = await browser.newPage();
 page.on('pageerror', error => errors.push(error.message));
 let failure;
 try {
  check('refresh current accepted draft', (await page.request.get('http://127.0.0.1:4264/__llm_refresh')).ok());
  await page.goto('http://127.0.0.1:4264/learn/path/full-curriculum/test-time-compute-scaling?module=large-language-models', {waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('[data-ttc-figure="D09"] [data-current-frontier]').first().waitFor();
  const fig = id => page.locator(`[data-ttc-figure="${id}"]`);
  async function setRange(id, label, value, min) { const slider=fig(id).getByRole('slider',{name:new RegExp(label)}); await slider.focus(); await slider.press('Home'); for(let i=min;i<value;i++) await slider.press('ArrowRight'); }
  async function capture(node, name) { await node.scrollIntoViewIfNeeded(); const file=path.join(out, name+'.png'); await node.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'}); images.push({path:file,sha256:sha(file)}); }
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]) {
   await page.setViewportSize({width:profile.width,height:1100}); await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',profile.font);
   for(const width of [1,2]) for(const depth of [0,1,2]) {
    await setRange('D09','Beam width',width,1); await setRange('D09','Expansion depth',depth,0);
    const frontier=depth===0?'root':depth===1?(width===1?'B':'B, A'):(width===1?'B1':'A1, B1');
    check(`${profile.name} width${width} depth${depth} actual frontier`, (await fig('D09').innerText()).includes(`Current ${depth===2?'terminal frontier':'frontier'}: ${frontier}.`));
    const drawn=await fig('D09').locator('[data-current-frontier]').evaluateAll(nodes=>nodes.map(n=>n.dataset.currentFrontier).sort());
    check(`${profile.name} width${width} depth${depth} frontier corners`,JSON.stringify(drawn)===JSON.stringify(frontier.split(', ').sort()));
    const opacity=await fig('D09').locator('svg text').evaluateAll(nodes=>nodes.map(node=>{let opacity=1;for(let n=node;n&&n.tagName!=='FIGURE';n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);return opacity;}));
    check(`${profile.name} width${width} depth${depth} labels full opacity`,opacity.every(value=>value===1));
    if(width===1&&(depth===0||depth===2)) await capture(fig('D09'),`${profile.name}-D09-depth${depth}`);
   }
   await setRange('D09','Beam width',1,1); await setRange('D09','Expansion depth',2,0);
   if(frontierOnly) {
    await capture(fig('D10'),`${profile.name}-D10`);
    if(profile.name!=='desktop') for(const id of ['D09','D10']) { await fig(id).locator('.ttc-scroll').evaluateAll(nodes=>nodes.forEach(n=>n.scrollLeft=n.scrollWidth)); await capture(fig(id),`${profile.name}-${id}-right`); await fig(id).locator('.ttc-scroll').evaluateAll(nodes=>nodes.forEach(n=>n.scrollLeft=0)); }
    check(`${profile.name} viewport containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    continue;
   }
   await setRange('D11','Responses retained',1,1);
   check(`${profile.name} excluded revisions labelled`,await fig('D11').getByText('outside pool',{exact:true}).count()===2);
   check(`${profile.name} excluded labels full opacity`,await fig('D11').locator('[data-retained="false"] text').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n.parentElement).opacity==='1')));
   await capture(fig('D10'),`${profile.name}-D10`); await capture(fig('D11'),`${profile.name}-D11-one`);
   if(profile.name!=='desktop') for(const id of ['D09','D10','D11']) { await fig(id).locator('.ttc-scroll').evaluateAll(nodes=>nodes.forEach(n=>n.scrollLeft=n.scrollWidth)); await capture(fig(id),`${profile.name}-${id}-right`); await fig(id).locator('.ttc-scroll').evaluateAll(nodes=>nodes.forEach(n=>n.scrollLeft=0)); }
   const compass=page.locator('.lesson-compass'); await capture(compass,`${profile.name}-compass`);
   const columns=await page.locator('.lesson-compass__sections').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length);
   check(`${profile.name} compass column count`,profile.name==='desktop'||columns===1,columns);
   check(`${profile.name} viewport containment`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  check('no runtime errors',errors.length===0,errors);
  for(const [file,hash] of Object.entries(sources)) check(`unchanged during browser check ${file}`,sha(file)===hash);
 } catch(error) { failure=error.stack; }
 await browser.close();
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({passed:!failure,failure,sources,checks,images,errors},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({passed:!failure,failure,checks:checks.length,images:images.length})); if(failure)process.exitCode=1;
})();
