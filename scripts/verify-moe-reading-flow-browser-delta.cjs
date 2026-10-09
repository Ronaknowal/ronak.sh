// Focused closure of actual paint findings; preserves the complete earlier campaign.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root='docs/teaching/deep-learning-beginner/mixture-of-experts-transformers-moe',url='http://127.0.0.1:4852/scratch/moe-reading-flow/whole.html';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sources=JSON.parse(fs.readFileSync(`${root}/reading-flow-source-checks.json`)).sourceHashes;
for(const [p,h]of Object.entries(sources))assert.equal(hash(p),h,p);
const captures=[],checks=[],errors=[],dir=`${root}/screenshots/reading-flow/delta`;fs.mkdirSync(dir,{recursive:true});
const affected=/Scores fork|Output credit|selection boundary|Allocate slots|same probability rows|Task, balancing|sampled gate|Selection bias|actual biased patch projection|LayerNorm reduces|selected expert outputs/;
const wireScenes=/Scores fork|Task, balancing|Selection bias|actual biased patch projection|selected expert outputs/;
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1366,height:1000});await page.goto(url);await page.locator('#moe-flow-image-image').scrollIntoViewIfNeeded();await page.locator('#moe-flow-image-image').getByText('Current predicted digit 0;', {exact:false}).waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.ok(await page.locator('svg').getByText('actual products',{exact:true}).count()>0,'current rebuilt affine circuit');
 const layouts=[];
 for(const [width,scale]of [[1366,1],[390,1],[320,1],[768,1],[768,2]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(s=>document.documentElement.style.fontSize=`${s*16}px`,scale);
  const state=await page.evaluate(()=>{
   const bounds=[],pairs=[],glyphs=[],pixels=[];
   for(const svg of document.querySelectorAll('.moe-flow-svg')){
    const vb=svg.viewBox.baseVal,title=svg.querySelector('title').textContent,rows=[...svg.querySelectorAll('text')].map(n=>({text:n.textContent,b:n.getBBox()}));
    glyphs.push(...[...svg.querySelectorAll('text')].map(n=>parseFloat(getComputedStyle(n).fontSize)*n.getScreenCTM().a));
    for(const {text,b}of rows)if(b.x<-.5||b.y<-.5||b.x+b.width>vb.width+.5||b.y+b.height>vb.height+.5)bounds.push({title,text});
    for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i].b,b=rows[j].b;if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)pairs.push({title,a:rows[i].text,b:rows[j].text});}
   }
   for(const p of document.querySelectorAll('.moe-flow-pixels button')){const r=p.getBoundingClientRect();pixels.push({width:r.width,height:r.height});}
   return{bounds,pairs,minGlyph:Math.min(...glyphs),pixels,pageWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,mathErrors:document.querySelectorAll('.katex-error').length};
  });assert.deepEqual(state.bounds,[]);assert.deepEqual(state.pairs,[]);assert.ok(state.minGlyph>=16*scale-.01);assert.equal(state.pageWidth,state.clientWidth);assert.equal(state.mathErrors,0);
  assert.equal(state.pixels.length,64);for(const p of state.pixels){assert.ok(p.width>=43.9&&p.height>=43.9);assert.ok(Math.abs(p.width-p.height)<.1);}
  layouts.push({width,scale,...state});
 }
 checks.push({name:'Final all-figure geometry and 64 square pixel targets at five viewport/text settings',layouts});
 await page.setViewportSize({width:390,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 const pan=page.locator('.moe-flow-pixel-scroll');await pan.focus();assert.equal(await pan.evaluate(n=>n===document.activeElement),true);assert.equal(await pan.getAttribute('role'),'region');
 for(let i=0;i<12;i++)await pan.press('ArrowRight');await page.waitForTimeout(200);assert.ok(await pan.evaluate(n=>n.scrollLeft)>0);checks.push({name:'Actual keyboard focus and native horizontal pixel-grid pan',scrollLeft:await pan.evaluate(n=>n.scrollLeft)});
 await page.setViewportSize({width:1366,height:1000});
 const intersections=await page.locator('.moe-flow-svg').evaluateAll((svgs,pattern)=>{
  const collisions=[];for(const svg of svgs){const title=svg.querySelector('title').textContent;if(!new RegExp(pattern).test(title))continue;
   const numeric=[...svg.querySelectorAll('text')].filter(n=>/^[−-]?\d+(\.\d+)?$/.test(n.textContent)).map(n=>({text:n.textContent,b:n.getBBox()}));
   for(const path of svg.querySelectorAll('path[marker-end]')){const length=path.getTotalLength();for(let d=3;d<length-3;d+=2){const p=path.getPointAtLength(d);for(const {text,b}of numeric)if(p.x>b.x+2&&p.x<b.x+b.width-2&&p.y>b.y+2&&p.y<b.y+b.height-2){collisions.push({title,text,path:path.getAttribute('d')});d=length;break;}}}
  }return collisions;
 },wireScenes.source);assert.deepEqual(intersections,[]);checks.push({name:'Affected arithmetic wires do not cross numeric glyph interiors',intersections});
 const inventory=await page.locator('.moe-flow-svg').evaluateAll(nodes=>nodes.map((n,index)=>({index,title:n.querySelector('title').textContent})));
 const unique=inventory.filter((x,i)=>affected.test(x.title)&&inventory.findIndex(y=>y.title===x.title)===i);
 async function capture(row,name,full=false){const svg=page.locator('.moe-flow-svg').filter({has:page.locator('title').filter({hasText:row.title})}).first(),target=full?svg:svg.locator('..'),path=`${dir}/${name}.png`;await target.screenshot({path});captures.push({...row,path,state:name});}
 for(const row of unique)await capture(row,`desktop-${row.index}`,true);
 for(const [width,scale,label]of [[390,1,'phone'],[768,2,'text2']]){
  await page.setViewportSize({width,height:1000});await page.evaluate(s=>document.documentElement.style.fontSize=`${s*16}px`,scale);
  for(const row of unique){const region=page.locator('.moe-flow-svg').nth(row.index).locator('..');await region.evaluate(n=>n.scrollLeft=0);await capture(row,`${label}-${row.index}-left`);await region.evaluate(n=>n.scrollLeft=n.scrollWidth);await capture(row,`${label}-${row.index}-right`);}
 }
 await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 const lab=id=>page.locator(`#moe-flow-${id}`),sel=(id,name)=>lab(id).getByRole('combobox',{name,exact:true}),num=(id,name)=>lab(id).getByRole('spinbutton',{name,exact:true});
 const capRow=unique.find(r=>/Allocate slots/.test(r.title)),noiseRow=unique.find(r=>/sampled gate/.test(r.title)),traceRow=unique.find(r=>/selected expert outputs/.test(r.title));
 await sel('capacity-routes','Token to inspect').selectOption('4');await sel('capacity-policy','Surviving-gate policy').selectOption('renormalize');assert.match(await lab('capacity-policy').innerText(),/Zero surviving mass/);await capture(capRow,'capacity-fully-dropped-zero',true);
 await sel('capacity-routes','Token to inspect').selectOption('2');await capture(capRow,'capacity-one-survivor-renormalized',true);
 const noise=lab('noise');for(const name of ['Clean score h','Positive noise scale']){const slider=noise.getByRole('slider',{name:new RegExp(name)});await slider.focus();await slider.press('Home');}assert.match(await noise.innerText(),/beyond the right edge/);await capture(noiseRow,'noise-threshold-offplot',true);
 await sel('image-disabled','Expert contribution to disable').selectOption('3');await capture(traceRow,'expert-disabled-zero-with-fixed-gates',true);await sel('image-disabled','Expert contribution to disable').selectOption('none');
 const image=lab('image-image');await image.getByRole('button',{name:'Zero lower four rows',exact:true}).click();await image.getByText('Current predicted digit 9;', {exact:false}).waitFor();const imagePath=`${dir}/image-lower-half-contrast.png`;await image.screenshot({path:imagePath});captures.push({path:imagePath,state:'original0-lower-half-predicts9'});
 await image.getByRole('button',{name:'Restore this source and all inspection controls',exact:true}).click();await sel('image-image','Observed UCI validation record').selectOption('7');await image.getByText('Current predicted digit 7;', {exact:false}).waitFor();await image.getByRole('button',{name:'Zero upper-left patch',exact:true}).click();assert.match(await image.locator('.flow-readout').innerText(),/delta 0/);const nullPath=`${dir}/image-zero-patch-null.png`;await image.screenshot({path:nullPath});captures.push({path:nullPath,state:'source7-zero-upper-left-null'});
 checks.push({name:'Informative edited/disabled/dropped/renormalized/offplot/contrast/null states captured',captureCount:captures.length});
 assert.deepEqual(errors,[]);fs.writeFileSync(`${root}/reading-flow-browser-delta.json`,JSON.stringify({topic:'mixture-of-experts-transformers-moe',scope:'Final paint/target closure; unchanged complete interaction campaign remains reading-flow-browser.json',url,sourceHashes:sources,checks,errors,captures,result:'PASS'},null,2)+'\n');await browser.close();console.log(JSON.stringify({result:'PASS',checks:checks.length,captures:captures.length}));
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
