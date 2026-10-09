// Targeted successor checks for the eight independent-review groups. No old receipt is rewritten.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root='docs/teaching/deep-learning-beginner/mixture-of-experts-transformers-moe',url='http://127.0.0.1:4852/scratch/moe-reading-flow/whole.html';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sources=JSON.parse(fs.readFileSync(`${root}/reading-flow-closure-source-checks.json`)).sourceHashes;
for(const[p,h]of Object.entries(sources))assert.equal(hash(p),h,p);
const captures=[],checks=[],errors=[],dir=`${root}/screenshots/reading-flow/closure`;fs.mkdirSync(dir,{recursive:true});
const affected=/two saved bypasses|absent task gradient|Task, balancing|Selection bias|Completed counts|Allocate slots|SwiGLU expert has|actual biased patch projection|Actual expert (gate|value|down) projection|actual learned router|actual classifier|Both head contexts|query reads a donor|Actual selected expert outputs|LayerNorm reduces|within-row|Soft MoE routes|stored|Stored/;
const wires=/two saved bypasses|absent task gradient|Task, balancing|Selection bias|Completed counts|Allocate slots|SwiGLU expert has|actual biased patch projection|Actual expert (gate|value|down) projection|actual learned router|actual classifier|Both head contexts|query reads a donor|Actual selected expert outputs/;
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1366,height:1000});await page.goto(url);await page.locator('#moe-flow-image-image').scrollIntoViewIfNeeded();await page.locator('#moe-flow-image-image').getByText('Current predicted digit 0;', {exact:false}).waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.ok(await page.locator('svg').getByText('SGD: μ=.9, dampening=0, decay=0, Nesterov off.',{exact:true}).count()===1);
 const lab=id=>page.locator(`#moe-flow-${id}`),sel=(id,name)=>lab(id).getByRole('combobox',{name,exact:true}),num=(id,name)=>lab(id).getByRole('spinbutton',{name,exact:true});
 const image=lab('image-image'),manip=lab('image-manipulation');
 assert.equal(await image.getByRole('button',{name:/Zero lower|Zero upper/}).count(),0);
 assert.equal(await manip.getByRole('button').count(),3);
 for(const kind of ['attention-norm','norm','final-norm']){assert.equal(await lab(`image-${kind}`).locator('svg').count(),2);assert.equal(await lab(`image-${kind}`).locator('tbody tr').count(),16);}
 assert.equal(await lab('image-temperature').locator('svg').count(),2);assert.equal(await lab('image-disabled').locator('svg').count(),1);
 checks.push({name:'First real-model path has three actual normalization stages; source/pixel and mask questions separated; temperature and disable expose local arithmetic'});
 const layouts=[];
 for(const[width,scale]of [[1366,1],[390,1],[320,1],[768,1],[768,2]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(s=>document.documentElement.style.fontSize=`${s*16}px`,scale);
  const state=await page.evaluate(()=>{
   const bounds=[],pairs=[],glyphs=[];
   for(const svg of document.querySelectorAll('.moe-flow-svg')){const vb=svg.viewBox.baseVal,title=svg.querySelector('title').textContent,rows=[...svg.querySelectorAll('text')].map(n=>({text:n.textContent,b:n.getBBox()}));
    glyphs.push(...[...svg.querySelectorAll('text')].map(n=>parseFloat(getComputedStyle(n).fontSize)*n.getScreenCTM().a));
    for(const{text,b}of rows)if(b.x<-.5||b.y<-.5||b.x+b.width>vb.width+.5||b.y+b.height>vb.height+.5)bounds.push({title,text});
    for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i].b,b=rows[j].b;if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)pairs.push({title,a:rows[i].text,b:rows[j].text});}
   }
   const pixels=[...document.querySelectorAll('.moe-flow-pixels button')].map(n=>{const r=n.getBoundingClientRect();return{width:r.width,height:r.height};});
   return{bounds,pairs,minGlyph:Math.min(...glyphs),pixels,pageWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,mathErrors:document.querySelectorAll('.katex-error').length};
  });assert.deepEqual(state.bounds,[]);assert.deepEqual(state.pairs,[]);assert.ok(state.minGlyph>=16*scale-.01);assert.equal(state.pageWidth,state.clientWidth);assert.equal(state.mathErrors,0);assert.equal(state.pixels.length,64);for(const p of state.pixels){assert.ok(p.width>=43.9&&p.height>=43.9);assert.ok(Math.abs(p.width-p.height)<.1);}layouts.push({width,scale,...state});
 }
 checks.push({name:'Current complete figure bounds, text collisions, readable glyphs and 64 square targets at five viewport/text settings',layouts});
 await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 async function wireCheck(label){const collisions=await page.locator('.moe-flow-svg').evaluateAll((svgs,pattern)=>{const found=[];for(const svg of svgs){const title=svg.querySelector('title').textContent;if(!new RegExp(pattern).test(title))continue;const texts=[...svg.querySelectorAll('text')].filter(n=>!n.classList.contains('moe-flow-op')).map(n=>({text:n.textContent,b:n.getBBox()}));for(const path of svg.querySelectorAll('path[marker-end]')){const length=path.getTotalLength();for(let d=4;d<length-4;d+=2){const p=path.getPointAtLength(d);for(const{text,b}of texts)if(p.x>b.x+2&&p.x<b.x+b.width-2&&p.y>b.y+2&&p.y<b.y+b.height-2){found.push({title,text,path:path.getAttribute('d')});d=length;break;}}}}return found;},wires.source);assert.deepEqual(collisions,[],label);checks.push({name:label,collisions});}
 await wireCheck('All affected and reused circuits: arrow paths avoid numeric and label glyph interiors at default state');
 const inventory=await page.locator('.moe-flow-svg').evaluateAll(nodes=>nodes.map((n,index)=>({index,title:n.querySelector('title').textContent,owner:n.closest('[id]')?.id})));
 const unique=inventory.filter((x,i)=>affected.test(x.title)&&(inventory.findIndex(y=>y.title===x.title)===i||['moe-flow-image-norm','moe-flow-image-final-norm'].includes(x.owner)));
 const currentSvg=row=>(row.owner?page.locator(`#${row.owner}`).locator('.moe-flow-svg'):page.locator('.moe-flow-svg')).filter({has:page.locator('title').filter({hasText:row.title})}).first();
 async function capture(row,name,full=false){const svg=currentSvg(row),target=full?svg:svg.locator('..'),path=`${dir}/${name}.png`;await target.screenshot({path});captures.push({...row,path,state:name});}
 async function setDisplay(width,scale){await page.setViewportSize({width,height:1000});await page.evaluate(s=>document.documentElement.style.fontSize=`${s*16}px`,scale);}
 async function captureDisplays(rows,prefix){await setDisplay(1366,1);for(const row of rows)await capture(row,`${prefix}desktop-${row.index}`,true);for(const[width,scale,label]of [[390,1,'phone'],[768,2,'text2']]){await setDisplay(width,scale);for(const row of rows){const region=currentSvg(row).locator('..');await region.evaluate(n=>n.scrollLeft=0);await capture(row,`${prefix}${label}-${row.index}-left`);await region.evaluate(n=>n.scrollLeft=n.scrollWidth);await capture(row,`${prefix}${label}-${row.index}-right`);}}await setDisplay(1366,1);}
 await captureDisplays(unique,'');
 // Select actual live instances, not the newly preceding four-token static fixture.
 const capRows=inventory.filter(r=>/Allocate slots/.test(r.title)&&r.owner==='moe-flow-capacity-policy');
 await sel('capacity-routes','Token to inspect').selectOption('4');await sel('capacity-policy','Surviving-gate policy').selectOption('renormalize');assert.match(await lab('capacity-policy').innerText(),/Zero surviving mass/);await captureDisplays(capRows,'dropped-');
 await sel('capacity-routes','Token to inspect').selectOption('2');await wireCheck('Affected reused capacity and affine circuits with positive-mass renormalization');await captureDisplays(capRows,'survivor-');
 await num('capacity-capacity','Capacity per expert').fill('6');await wireCheck('Largest supported capacity retains every requested queue entry without label crossings');await captureDisplays(capRows,'capacity6-');await lab('capacity-routes').getByRole('button',{name:'Reset capacity case and invalid drafts',exact:true}).click();
 const modelRows=inventory.filter(r=>/query reads a donor|actual biased patch projection|Actual expert (gate|value|down) projection|actual learned router|actual classifier|Both head contexts/.test(r.title));
 await num('image-attention-norm','Actual patch whose representation to inspect').fill('15');await num('image-attention-norm','Actual vector coordinate to inspect').fill('15');await sel('image-attention','Attention head').selectOption('1');await wireCheck('Affected actual model and all reused affine circuits at patch15/coordinate15/head1');await captureDisplays(modelRows.filter((r,i,rows)=>rows.findIndex(x=>x.title===r.title)===i),'coordinate15-');
 await image.getByRole('button',{name:'Restore this source and all inspection controls',exact:true}).click();
 const readout=await lab('image-temperature').locator('.flow-readout').innerText();
 await sel('image-disabled','Expert contribution to disable').selectOption('0');assert.equal(await lab('image-disabled').locator('.flow-readout').innerText(),readout);await sel('image-disabled','Expert contribution to disable').selectOption('none');
 const slider=lab('image-temperature').getByRole('slider',{name:'Router temperature',exact:true});await slider.focus();await slider.press('Home');for(let i=0;i<15;i++)await slider.press('ArrowRight');const temperatureReadout=await lab('image-temperature').locator('.flow-readout').innerText();assert.ok(Math.abs(Number(temperatureReadout.match(/Probability of observed label ([\d.]+)/)[1])-.946955)<.0000005);assert.match(temperatureReadout,/Selected assignments \[0, 1, 15, 16\]/);
 await captureDisplays(inventory.filter(r=>r.owner==='moe-flow-image-temperature'),'temperature2-');
 await image.getByRole('button',{name:'Restore this source and all inspection controls',exact:true}).click();await sel('image-disabled','Expert contribution to disable').selectOption('3');assert.equal(await lab('image-disabled').locator('svg').getByText('E3 disabled',{exact:true}).count(),1);assert.ok(await lab('image-disabled').locator('svg').getByText('0',{exact:true}).count()>=2);await wireCheck('Current selected disabled branch keeps original gate and contributes zero');await captureDisplays(inventory.filter(r=>r.owner==='moe-flow-image-disabled'),'disabled3-');
 await image.getByRole('button',{name:'Restore this source and all inspection controls',exact:true}).click();await manip.getByRole('button',{name:'Zero lower four rows',exact:true}).click();await manip.getByText('Current predicted digit 9;', {exact:false}).waitFor();const contrastPath=`${dir}/lower-half-contrast.png`;await manip.screenshot({path:contrastPath});captures.push({path:contrastPath,state:'original0-mask-predicts9'});
 await manip.getByRole('button',{name:'Restore this source and all inspection controls',exact:true}).click();await sel('image-image','Observed UCI validation record').selectOption('7');await manip.getByRole('button',{name:'Zero upper-left patch',exact:true}).click();assert.match(await manip.locator('.flow-readout').innerText(),/delta 0/);const nullPath=`${dir}/zero-patch-null.png`;await manip.screenshot({path:nullPath});captures.push({path:nullPath,state:'source7-zero-upper-left-null'});
 await manip.getByRole('button',{name:'Restore this source and all inspection controls',exact:true}).click();await sel('image-image','Observed UCI validation record').selectOption('0');
 checks.push({name:'Actual shared model state: unused-expert null, temperature2 probability/unchanged IDs, selected-expert zero, lower-mask contrast and patch-mask null; restored defaults',captures:captures.length});
 const download=await page.evaluate(async()=>{const res=await fetch('/learn-code/mixture-of-experts-transformers-moe/moe-routing-dispatch.py');return{status:res.status,text:await res.text()};});assert.equal(download.status,200);assert.equal(download.text,fs.readFileSync('public/learn-code/mixture-of-experts-transformers-moe/moe-routing-dispatch.py','utf8'));checks.push({name:'Served complete changed grouped-dispatcher download exactly matches current native-checked source'});
 assert.deepEqual(errors,[]);fs.writeFileSync(`${root}/reading-flow-closure-browser.json`,JSON.stringify({topic:'mixture-of-experts-transformers-moe',scope:'Targeted correction successor for independent findings1–8; old full/delta receipts preserved',url,sourceHashes:sources,checks,errors,captures,result:'PASS'},null,2)+'\n');await browser.close();console.log(JSON.stringify({result:'PASS',checks:checks.length,captures:captures.length,uniqueTitles:unique.length}));
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
