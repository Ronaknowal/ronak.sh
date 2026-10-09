const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base='docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const packet=base+'/runtime-review-successor/inputs.json',output=base+'/runtime-independent-closure-checked';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(packet),'47362fea1805f11f5eda53909a1dfd0eb1e3266dfd47bc6d41e0146b87b1a8e2');
const bindings=JSON.parse(fs.readFileSync(packet)).files;
for(const[p,h]of Object.entries(bindings))assert.equal(sha(p),h,p);
fs.mkdirSync(output,{recursive:true});assert.ok(!fs.existsSync(output+'/report.json'));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000}}),checks=[],images=[],errors=[];
 const check=(name,ok,details)=>{checks.push({name,passed:!!ok,details});assert.ok(ok,name)};
 page.on('pageerror',e=>errors.push(e.message));
 await page.request.get('http://127.0.0.1:4250/__llm_refresh');
 await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models',{timeout:90000});
 await page.locator('[data-prm-figure="D14"] textarea').waitFor({timeout:90000});
 const figure=id=>page.locator(`[data-prm-figure="${id}"]`);
 async function capture(id,label){const node=figure(id);await node.scrollIntoViewIfNeeded();const file=output+'/'+label+'.png';await node.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}'});images.push({path:file,sha256:sha(file)});}
 for(const mode of ['default','failure','repair']){
  await figure('D19').locator('select').selectOption(mode);
  const rows=await figure('D19').locator('[data-continuation-text]').evaluateAll(ns=>ns.map(n=>({text:n.dataset.continuationText,reward:Number(n.dataset.checkerReward)})));
  check('R1 literal terminal assertions '+mode,rows.every(r=>{const m=/^x=(-?\d+(?:\.\d+)?)$/.exec(r.text.replace('−','-'));return r.reward===Number(!!m&&2*(Number(m[1])+1)===8)}),rows);
  check('R1 correct number of successes '+mode,rows.reduce((s,r)=>s+r.reward,0)===(mode==='failure'?0:1));
  await capture('D19','desktop-D19-'+mode);
 }
 await figure('D19').locator('input[type=range]').fill('0');
 check('R1 zero budget is unknown with visible prefix',/HE=unknown; SE=unknown/.test(await figure('D19').innerText())&&await figure('D19').locator('.prm-completion-prefix').isVisible());
 const cells=await figure('D17').locator('tbody tr').evaluateAll(ns=>ns.map(n=>[...n.querySelectorAll('td')].map(c=>c.innerText)));
 check('R2 each nonnegative target is a real step',cells.every(r=>Number(r[2])<r[1].split(',').length),cells);
 check('R2 deliberately missed fourth case preserved',cells[3][1]==='0.9, 0.9, 0.9, 0.9'&&cells[3][2]==='3'&&cells[3][3]==='-1');
 for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
  await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',profile.font);
  const widths=await figure('D15').locator('.prm-product-track').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width));
  check('R3 equal probability scales '+profile.name,widths.length>2&&Math.max(...widths)-Math.min(...widths)<.1,widths);
  await capture('D15',profile.name+'-D15');
  const frames=await page.locator('[data-prm-figure]').evaluateAll(ns=>ns.map(n=>({label:n.getAttribute('aria-label'),headings:n.querySelectorAll(':scope>figcaption').length,border:getComputedStyle(n).borderTopWidth,padding:getComputedStyle(n).paddingTop})));
  check('R5 all29 accessible unframed figures '+profile.name,frames.length===29&&frames.every(r=>r.label&&r.headings===0&&r.border==='0px'&&r.padding==='0px'));
   for(const id of ['D04','D14'])check('R6 visible full context '+profile.name+id,await figure(id).locator('details').count()===0&&/prefix|chosen earlier steps/.test(await figure(id).innerText()));
  for(const id of ['D22','D23','D26']){
   await capture(id,profile.name+'-'+id);
   const scroll=figure(id).locator('.prm-scroll').first();
   const geometry=await scroll.evaluate(n=>({client:n.clientWidth,full:n.scrollWidth}));
   if(geometry.full>geometry.client+2){await scroll.focus();for(let i=0;i<40;i++)await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);const edge=await scroll.evaluate(n=>({x:n.scrollLeft,max:n.scrollWidth-n.clientWidth}));check('R4 keyboard reaches right edge '+profile.name+id,edge.x>=edge.max-2,edge);await capture(id,profile.name+'-'+id+'-right');}
  }
  check('No page overflow '+profile.name,await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);
 }
 check('No runtime errors',errors.length===0,errors);await browser.close();
 for(const[p,h]of Object.entries(bindings))assert.equal(sha(p),h,p);
 fs.writeFileSync(output+'/report.json',JSON.stringify({at:new Date().toISOString(),reviewer:'root',source:packet,sourceSha256:sha(packet),bindings:bindings,checks,images,errors,fits:0},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({checks:checks.length,images:images.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1});
