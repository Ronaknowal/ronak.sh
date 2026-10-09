const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root = process.cwd();
const owner = 'docs/teaching/classical-ml-reading-flow/decision-trees-random-forests';
const output = path.join(owner,'reading-flow-browser-author.json');
const paint = path.join(root,'scratch/decision-tree-reading-flow/paint');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = ['src/learn/data/topics/decision-trees-random-forests.jsx',
  'src/learn/components/lesson-labs/DecisionTreeFlowDrawings.jsx',
  'src/learn/components/lesson-labs/DecisionTreeFlowExtensions.jsx',
  'src/learn/components/lesson-labs/DecisionTreeFlowLabs.jsx',
  'src/learn/components/lesson-labs/DecisionTreeFlowStudy.jsx',
  'src/learn/components/lesson-labs/decision-tree-flow.css',
  ...fs.readdirSync('public/learn-assets/decision-trees').filter(file=>/\.(py|json)$/.test(file)).map(file=>`public/learn-assets/decision-trees/${file}`)];
const receipt={sources:Object.fromEntries(sources.map(file=>[file,hash(file)])),groups:[],errors:[]};
if(process.argv.includes('--resume')&&fs.existsSync(output)) {const earlier=JSON.parse(fs.readFileSync(output,'utf8'));if(JSON.stringify(earlier.sources)!==JSON.stringify(receipt.sources))throw Error('Cannot reuse browser groups from changed source');receipt.groups=earlier.groups;receipt.retry=earlier.retry;receipt.reusedGroups=earlier.groups.map(({width,zoom})=>({width,zoom}));}
const buildBinding=JSON.parse(fs.readFileSync('scratch/decision-tree-reading-flow/build-binding.json','utf8'));
for(const file of sources)if(buildBinding[file]!==receipt.sources[file])throw Error(`Build differs from source: ${file}`);
receipt.buildBinding=buildBinding;
function check(condition,message) {if(!condition)throw Error(message);}
async function setRange(locator,value) {await locator.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);}
(async()=>{
  fs.mkdirSync(paint,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    for (const [width,zoom] of [[1366,1],[768,1],[768,2],[390,1],[320,1]]) {
      if(process.argv.includes('--capture-changed'))continue;
      if(receipt.groups.some(group=>group.width===width&&group.zoom===zoom))continue;
      const context=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:1,hasTouch:width===390,permissions:['clipboard-read','clipboard-write']});
      const page=await context.newPage();
      page.on('pageerror',error=>receipt.errors.push(error.message));
      await page.goto('http://127.0.0.1:4872/learn/path/full-curriculum/decision-trees-random-forests?module=classical-ml');
      await page.locator('[data-figure="tree-basic-anatomy"]').waitFor();
      if(zoom===2)await page.addStyleTag({content:'html { font-size: 32px !important; }'});
      check(await page.getByText('positive tally is six of eight',{exact:false}).count()===1,'fresh section-seven source not served');
      const figures=page.locator('[data-figure]');
      // Reach every figure; this also loads the saved study and visible programs.
      for(let i=0;i<await figures.count();i++){await figures.nth(i).scrollIntoViewIfNeeded();}
      await page.locator('#tree-wdbc-study').waitFor();
      const group={width,zoom,figures:[],overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)};
      check(!group.overflow,`document overflow ${width}/${zoom}`);
      for(let i=0;i<await figures.count();i++){
        const figure=figures.nth(i); const name=await figure.getAttribute('data-figure');
        const figureHeight=await figure.evaluate(element=>element.getBoundingClientRect().height);await page.setViewportSize({width,height:Math.max(950,Math.ceil(figureHeight)+220)});
        await figure.scrollIntoViewIfNeeded();
        await page.evaluate(()=>scrollBy(0,-100));
        const geometry=await figure.evaluate(element=>{
          const svg=element.querySelector('svg'),surface=element.querySelector('.decision-tree-surface');
          const texts=[...svg.querySelectorAll('text')].map(text=>{const box=text.getBoundingClientRect();return {text:text.textContent,x:box.x,y:box.y,w:box.width,h:box.height,font:parseFloat(getComputedStyle(text).fontSize)*svg.getScreenCTM().a};});
          const overlaps=[];
          for(let a=0;a<texts.length;a++)for(let b=a+1;b<texts.length;b++){
            const A=texts[a],B=texts[b];
            if(Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x)>2 && Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y)>2)overlaps.push([A.text,B.text]);
          }
          return {minimumFont:Math.min(...texts.map(t=>t.font)),overlaps,scrollWidth:surface.scrollWidth,clientWidth:surface.clientWidth};
        });
        check(geometry.minimumFont>=15.99,`small text ${name}`);
        const filename=`${width}-${zoom}-${i}-${name}.png`;
        await figure.screenshot({path:path.join(paint,filename)});
        if(geometry.scrollWidth>geometry.clientWidth+1){
          if(geometry.scrollWidth>geometry.clientWidth*2){await figure.locator('.decision-tree-surface').evaluate(e=>{e.scrollLeft=(e.scrollWidth-e.clientWidth)/2;});await figure.screenshot({path:path.join(paint,filename.replace('.png','-middle.png'))});}
          await figure.locator('.decision-tree-surface').evaluate(e=>{e.scrollLeft=e.scrollWidth;});await figure.screenshot({path:path.join(paint,filename.replace('.png','-right.png'))});await figure.locator('.decision-tree-surface').evaluate(e=>{e.scrollLeft=0;});
        }
        group.figures.push({name,...geometry,paint:path.relative(root,path.join(paint,filename)).replaceAll('\\','/')});
      }
      await page.setViewportSize({width,height:950});
      if(width===390){
        group.controlSweep=[];
        const labs=page.locator('.tree-lesson .flow-lab');
        for(let i=0;i<await labs.count();i++){
          const lab=labs.nth(i),id=await lab.getAttribute('id');
          const sliders=lab.locator('.flow-controls input'),selects=lab.locator('.flow-controls select');
          check(await sliders.count()+await selects.count()<=3,`${id} control count`);
          const readout=lab.locator('.flow-readout'),baseline=await readout.innerText();
          for(let j=0;j<await sliders.count();j++){
            const slider=sliders.nth(j);await slider.focus();await slider.press('Home');check(await slider.inputValue()===await slider.getAttribute('min'),`${id} minimum`);await slider.press('End');check(await slider.inputValue()===await slider.getAttribute('max'),`${id} maximum`);check(!/NaN|Infinity/.test(await readout.innerText()),`${id} finite endpoint`);
          }
          for(let j=0;j<await selects.count();j++){
            const select=selects.nth(j);const options=await select.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
            for(const value of options){await select.selectOption(value);check(!/NaN|Infinity/.test(await readout.innerText()),`${id} finite option`);}
          }
          await lab.getByRole('button',{name:'Reset this example',exact:true}).click();
          check(await readout.innerText()===baseline,`${id} exact reset`);
          const targetSizes=await lab.locator('.flow-controls input,.flow-controls select,.decision-tree-actions button').evaluateAll(elements=>elements.map(element=>element.getBoundingClientRect().height));
          check(targetSizes.every(h=>h>=43.99),`${id} forty-four pixel targets`);
          group.controlSweep.push({id,sliders:await sliders.count(),selects:await selects.count(),targetSizes});
        }
        // Shared-state sweep restores only each taught group; return forest OOB to A/member1.
        await page.locator('#tree-bootstrap').getByRole('button',{name:'Reset this example'}).click();
        const range=page.getByRole('slider',{name:/^Query x₁/});await range.focus();await range.press('End');check(await range.inputValue()==='6','keyboard query endpoint');
        await setRange(page.getByRole('slider',{name:/^Query x₂/}),2);
        check((await page.locator('#tree-partitions').innerText()).includes('6, 2'),'query sync');
        await page.locator('#tree-growth').getByLabel('Maximum depth in edges',{exact:true}).selectOption('3');
        check((await page.locator('#tree-partitions').innerText()).includes('(6, 2)'),'growth reset query');
        await page.locator('#tree-partitions').getByRole('button',{name:'Reset this example'}).click();
        await page.locator('#tree-growth').getByRole('button',{name:'Reset this example'}).click();
        await page.locator('#tree-split-ledger').getByLabel('Minimum rows in each child',{exact:true}).selectOption('3');
        check((await page.locator('#tree-split-ledger').innerText()).includes('too small'),'illegal child');
        await page.locator('#tree-xor').getByLabel('Zero-gain stopping rule').selectOption('true');check((await page.locator('#tree-xor').innerText()).includes('4/4'),'xor changed');
        const alpha=page.getByRole('slider',{name:/^Complexity cost alpha/});await alpha.focus();await alpha.press('End');check(await alpha.inputValue()==='0.3','alpha endpoint');check((await page.locator('#tree-pruning').innerText()).includes('Selected 1 leaves'),'root pruning');
        await alpha.press('Home');check((await page.locator('#tree-pruning').innerText()).includes('Selected 5 leaves'),'full pruning');
        const members=page.getByRole('slider',{name:/^Number of members/});await setRange(members,1);
        await page.locator('#tree-bootstrap').getByLabel('Observation to evaluate').selectOption('1');check((await page.locator('#tree-bootstrap').innerText()).includes('unavailable'),'OOB null');
        await setRange(page.locator('#tree-averaging').getByRole('slider').nth(0),.4);await setRange(page.locator('#tree-averaging').getByRole('slider').nth(1),.4);await setRange(page.locator('#tree-averaging').getByRole('slider').nth(2),.95);check((await page.locator('#tree-averaging').innerText()).includes('0.583333'),'changed aggregation');
        await page.locator('#tree-permutation').getByLabel('Columns sharing the donor order').selectOption('used');check((await page.locator('#tree-permutation').innerText()).includes('changed accuracy 0'),'reliance changed');
        await page.locator('#tree-wdbc-study').getByLabel('Saved test row ID').selectOption('10');const selected=await page.locator('#tree-wdbc-study').getByLabel('Saved test row ID').inputValue();await page.locator('#tree-wdbc-study').getByLabel('Saved model').selectOption('0');check(await page.locator('#tree-wdbc-study').getByLabel('Saved test row ID').inputValue()===selected,'study preserves case');
        for(const id of ['tree-partitions','tree-pruning','tree-bootstrap','tree-averaging','tree-permutation','tree-wdbc-study'])await page.locator(`#${id}`).screenshot({path:path.join(paint,`390-changed-${id}.png`)});
        await range.scrollIntoViewIfNeeded();const bounds=await range.boundingBox();const before=await range.inputValue();
        await page.mouse.move(bounds.x+bounds.width*.75,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.2,bounds.y+bounds.height/2,{steps:5});await page.mouse.up();check(await range.inputValue()!==before,'native mouse slider drag');
        const beforeTouch=await range.inputValue();await page.touchscreen.tap(bounds.x+bounds.width*.8,bounds.y+bounds.height/2);check(await range.inputValue()!==beforeTouch,'native touch slider tap');
        group.pointer='native mouse drag and touch tap updated query';
        group.interactions='native keyboard endpoints, shared-query growth, illegal child, XOR, pruning ends, OOB null, aggregation, reliance, study case preservation passed';
        const block=page.locator('.lesson-code').first(),copy=block.getByRole('button',{name:/Copy/});await copy.click();await page.waitForFunction(()=>document.querySelector('.lesson-code .lesson-code__copy')?.hasAttribute('data-copied'));const clipboard=await page.evaluate(()=>navigator.clipboard.readText()),displayed=await block.locator('pre code').textContent();check(clipboard.replaceAll('\r\n','\n')===displayed.replaceAll('\r\n','\n'),'clipboard exact code with native newline normalization');group.copyText=await copy.innerText();
        group.downloads=[];
        for(const file of sources.filter(file=>file.endsWith('.py'))){const response=await page.request.get(`http://127.0.0.1:4872/${file.replace(/^public\//,'')}`);check(response.ok(),'program download available');const body=await response.body();check(crypto.createHash('sha256').update(body).digest('hex')===hash(file),'program download exact bytes');group.downloads.push(file);}
      }
      receipt.groups.push(group);await context.close();
    }
    if(process.argv.includes('--capture-changed')){
      const changedPage=await browser.newPage({viewport:{width:390,height:950}});await changedPage.goto('http://127.0.0.1:4872/learn/path/full-curriculum/decision-trees-random-forests?module=classical-ml');await changedPage.locator('#tree-partitions').waitFor();
      await setRange(changedPage.getByRole('slider',{name:/^Query x₁/}),6);await setRange(changedPage.getByRole('slider',{name:/^Query x₂/}),2);await setRange(changedPage.getByRole('slider',{name:/^Complexity cost alpha/}),.3);await setRange(changedPage.getByRole('slider',{name:/^Number of members/}),1);await changedPage.locator('#tree-bootstrap').getByLabel('Observation to evaluate').selectOption('1');
      for(const [i,p] of [.4,.4,.95].entries())await setRange(changedPage.locator('#tree-averaging').getByRole('slider').nth(i),p);
      await changedPage.locator('#tree-permutation').getByLabel('Columns sharing the donor order').selectOption('used');await changedPage.locator('.decision-tree-study').scrollIntoViewIfNeeded();await changedPage.locator('#tree-wdbc-study').waitFor();await changedPage.locator('#tree-wdbc-study').getByLabel('Saved test row ID').selectOption('10');await changedPage.locator('#tree-wdbc-study').getByLabel('Saved model').selectOption('0');
      await changedPage.evaluate(()=>document.fonts.ready);receipt.changedPaint=[];
      for(const id of ['tree-partitions','tree-pruning','tree-bootstrap','tree-averaging','tree-permutation','tree-wdbc-study']){
        const lab=changedPage.locator(`#${id}`);await lab.locator('.decision-tree-surface').evaluateAll(elements=>elements.forEach(element=>element.scrollLeft=element.scrollWidth));const height=await lab.evaluate(element=>element.getBoundingClientRect().height);await changedPage.setViewportSize({width:390,height:Math.max(950,Math.ceil(height)+220)});await lab.scrollIntoViewIfNeeded();await changedPage.evaluate(()=>scrollBy(0,-100));await lab.screenshot({path:path.join(paint,`390-changed-${id}.png`)});receipt.changedPaint.push({id,readout:await lab.locator('.flow-readout').innerText(),paint:`scratch/decision-tree-reading-flow/paint/390-changed-${id}.png`});
      }
      await changedPage.close();
    }
    if(!receipt.retry){const retryPage=await browser.newPage({viewport:{width:390,height:950}});let failed=false;
    await retryPage.route('**/decision-tree-wdbc-models.json',async route=>{if(!failed){failed=true;await route.abort();}else await route.continue();});
    await retryPage.goto('http://127.0.0.1:4872/learn/path/full-curriculum/decision-trees-random-forests?module=classical-ml');
    await retryPage.getByText('A complete thirty-feature held-out experiment',{exact:false}).scrollIntoViewIfNeeded().catch(()=>{});
    await retryPage.locator('.decision-tree-study').scrollIntoViewIfNeeded();await retryPage.getByRole('button',{name:'Retry saved experiment'}).waitFor();
    await retryPage.locator('.decision-tree-study').screenshot({path:path.join(paint,'390-study-unavailable.png')});
    await retryPage.getByRole('button',{name:'Retry saved experiment'}).click();await retryPage.locator('#tree-wdbc-study').waitFor();receipt.retry='first data fetch aborted; error displayed; explicit retry restored saved study';await retryPage.close();}
    const page=await browser.newPage();
    await page.goto('http://127.0.0.1:4872/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml#2-make-every-residual-visible');
    await page.locator('[id="2-make-every-residual-visible"]').waitFor();
    receipt.prerequisite={fragment:await page.evaluate(()=>location.hash),heading:await page.locator('[id="2-make-every-residual-visible"]').innerText(),meanSubsection:await page.getByRole('heading',{name:'Why the mean appears even without Gaussian noise',exact:true}).count()};
    check(receipt.prerequisite.meanSubsection===1,'missing prerequisite mean subsection');
    check(receipt.errors.length===0,'render errors');
  } finally {await browser.close();fs.writeFileSync(output,JSON.stringify(receipt,null,2));}
  console.log(JSON.stringify({output,groups:receipt.groups.length,errors:receipt.errors,overlapGroups:receipt.groups.map(g=>({width:g.width,zoom:g.zoom,overlaps:g.figures.filter(f=>f.overlaps.length).map(f=>({name:f.name,overlaps:f.overlaps}))}))}));
})().catch(error=>{console.error(error);process.exitCode=1;});
