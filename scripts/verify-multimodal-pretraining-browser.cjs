const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const packet='docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment';
const output=path.join(packet,process.env.MMP_EVIDENCE||'browser-author');fs.mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:4250';
const url=base+'/learn/path/full-curriculum/multimodal-pre-training-vision-encoders-cross-modal-alignment?module=large-language-models';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
 const page=await context.newPage(),errors=[],screens=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.request.get(base+'/__llm_refresh',{timeout:90000});await page.goto(url,{timeout:90000});
 await page.locator('[data-mmp-figure]').nth(24).waitFor({timeout:90000});
 await page.getByText('Loading saved study…',{exact:true}).first().waitFor({state:'hidden',timeout:90000});
 await page.screenshot({path:path.join(output,'opening.png')});screens.push('opening.png');
 // Only isolated figure captures hide the sticky site header; normal opening above retains it.
 await page.addStyleTag({content:'header { visibility:hidden!important; } html,* { scroll-behavior:auto!important; }'});
 for(const block of await page.locator('.lesson-code-source').all()){await block.scrollIntoViewIfNeeded();await block.locator('.lesson-code__copy').waitFor({timeout:60000});}
 const capture=async(figure,filename)=>{const parent=figure.locator('xpath=..');const node=await parent.evaluate(e=>e.classList.contains('flow-lab'))?parent:figure;await node.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(200);await page.evaluate(()=>document.activeElement?.blur());await node.screenshot({path:path.join(output,filename),timeout:30000});};
 for(const [mode,width,zoom] of [['desktop',1440,100],['phone',390,100],['zoom',768,200]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(z=>document.documentElement.style.fontSize=z+'%',zoom);
  await page.waitForTimeout(650);
  const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  checks.push({name:mode+' page bounds',...bounds,pass:bounds.scroll<=width+1});
  if(bounds.scroll>width+1) console.log('OVERFLOW',mode,await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&!e.parentElement?.closest('.mmp-scroll,.mmp-math,pre')}).slice(0,12).map(e=>({class:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,60)}))));
  for(let i=0;i<25;i++){
   const figure=page.locator('[data-mmp-figure]').nth(i),name=`${mode}-${String(i+1).padStart(2,'0')}.png`;
   await capture(figure,name);screens.push(name);
   if(mode!=='desktop'&&[4,11,16,20,21,24].includes(i+1)){await figure.locator('.mmp-scroll').evaluateAll(es=>es.forEach(e=>e.scrollLeft=e.scrollWidth));const right=name.replace('.png','-right.png');await capture(figure,right);screens.push(right);await figure.locator('.mmp-scroll').evaluateAll(es=>es.forEach(e=>e.scrollLeft=0));}
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='100%');
 const change=async(name,action,figure)=>{await action();const filename='changed-'+name+'.png';await capture(page.locator('[data-mmp-figure]').nth(figure-1),filename);screens.push(filename);checks.push({name,pass:true});};
 await change('zero-vector',()=>page.getByRole('button',{name:'Zero vector',exact:true}).click(),4);
 await page.getByRole('button',{name:'Reset direction',exact:true}).click();
 await change('empty-candidates',()=>page.getByRole('button',{name:'Empty candidates',exact:true}).click(),9);
 await page.getByRole('button',{name:'Reset candidates',exact:true}).click();
 await change('pixel-blank',()=>page.getByRole('button',{name:'Blank image',exact:true}).click(),12);
 await page.getByRole('button',{name:'Restore source pixels',exact:true}).click();
 await change('no-positive',()=>page.getByRole('button',{name:'No positives',exact:true}).click(),13);
 await page.getByRole('button',{name:'Reset positive sets',exact:true}).click();
 await change('prefix-no-targets',()=>page.getByLabel('Score answer and EOS',{exact:true}).uncheck(),16);
 await page.getByRole('button',{name:'Reset prefix',exact:true}).click();
 await change('detach',()=>page.getByLabel('Detach projected h',{exact:true}).check(),17);
 await page.getByRole('button',{name:'Reset derivatives',exact:true}).click();
 await change('empty-query',()=>page.getByRole('button',{name:'Block every donor',exact:true}).click(),19);
 await page.getByRole('button',{name:'Reset query read',exact:true}).click();
 await change('nondivisible',()=>page.getByRole('button',{name:'Nondivisible height 281',exact:true}).click(),22);
 await page.getByRole('button',{name:'Reset budget',exact:true}).click();
 await change('mixed-text-only',()=>page.getByRole('button',{name:'Text and boundaries only',exact:true}).click(),24);
 const codeChecks=[];
 for(const file of ['alignment_mechanisms.py','alignment_study.py','clip_library.py','visual_prefix.py','multimodal_interfaces.py']){const expected=fs.readFileSync('public/learn-code/multimodal-pretraining/'+file,'utf8');const copy=page.getByRole('button',{name:'Copy '+file,exact:true});await copy.click();const actual=await page.evaluate(()=>navigator.clipboard.readText());if(actual.replace(/\r\n/g,'\n')!==expected.replace(/\r\n/g,'\n'))throw Error('Clipboard mismatch '+file);const link=page.locator('.lesson-code-source').getByRole('link',{name:'Download '+file,exact:true});const downloadPromise=page.waitForEvent('download');await link.click();const download=await downloadPromise;const filename=await download.path();if(!fs.readFileSync(filename).equals(fs.readFileSync('public/learn-code/multimodal-pretraining/'+file)))throw Error('Download mismatch '+file);codeChecks.push({file,copy:true,download:true});}
 const figures=await page.locator('[data-mmp-figure]').evaluateAll(nodes=>nodes.map(n=>({name:n.getAttribute('data-mmp-figure'),text:n.textContent})));
 const files=['src/learn/components/lesson-labs/MultimodalPretrainingFlow.jsx','src/learn/components/lesson-labs/multimodal-pretraining-flow.css','src/learn/data/multimodal-pretraining-models.js',packet+'/manuscript.jsx'];
 const report={url,errors,checks,codeChecks,screens,figures,files:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();
 console.log(JSON.stringify({output,errors,checks,screens:screens.length}));
 if(errors.length||checks.some(c=>!c.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
