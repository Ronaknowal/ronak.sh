const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4244';
const folder = 'docs/teaching/llm-architecture-training/fp8-training-low-precision-pre-training';
const output = path.resolve(folder, 'browser-evidence');
const route = '/learn/path/full-curriculum/fp8-training-low-precision-pre-training?module=large-language-models';
const figures = ['payload','bits','rounding','scale','groups','history','gemm','training','updates','real-study','block-product','transpose','precision-map','cost'];
const sourceFiles = [folder+'/fp8-training.jsx','src/learn/components/lesson-labs/Fp8TrainingFlow.jsx','src/learn/components/lesson-labs/fp8-training-flow.css','src/learn/data/fp8-training-models.js','src/learn/data/fp8-training-study.json', 'scripts/verify-fp8-training-browser.cjs',
  ...['fp8_formats.py','fp8_linear.py','fp8_language_study.py','fp8_library.py'].map(p=>'public/learn-code/fp8-training/'+p)];
const hashes = () => Object.fromEntries(sourceFiles.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const before=hashes(), errors=[], warnings=[], captures=[], layouts=[], interactions=[];
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',msg=>{if(msg.type()==='error'&&/validateDOMNesting|cannot be a|cannot contain|title.*children/i.test(msg.text()))warnings.push(msg.text());});
    await page.request.get(base+'/__llm_refresh');
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:90000});
    assert.equal(response.status(),200);
    await page.locator('[data-fp8-figure="cost"]').waitFor({timeout:60000});
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('[data-fp8-figure]').count(),14);
    const item=name=>page.locator('[data-fp8-figure="'+name+'"]');
    const shot=async(name,selector)=>{
      const el=typeof selector==='string'?page.locator(selector).first():selector;
      await el.scrollIntoViewIfNeeded();
      await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});
      await el.screenshot({path:path.join(output,name+'.png'),style:'.site-header--learn,.site-skip { visibility:hidden!important; }'});
      captures.push(name+'.png');
    };
    const bounded=process.argv.find(x=>x.startsWith('--figures='));
    const selected=bounded?bounded.slice(10).split(','):figures;
    const prefix=bounded?(selected.length===figures.length?'final-':'delta-'+selected.join('-')+'-'):'';
    await page.screenshot({path:path.join(output,prefix+'reader-opening.png')});captures.push(prefix+'reader-opening.png');
    for(const [width,font,label] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]){
      await page.setViewportSize({width,height:1000});
      await page.evaluate(size=>{document.documentElement.style.fontSize=size+'px';},font);
      for(const name of selected)await shot(prefix+label+'-'+name,item(name));
      const layout=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,
        offenders:[...document.querySelectorAll('.fp8-training-flow *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1&&!el.closest('.fp8-scroll,.fp8-math,.lesson-table-wrap,.lesson-code-source')).slice(0,8).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,90),right:el.getBoundingClientRect().right}))}));
      layouts.push({label,...layout});
      assert(layout.width<=layout.viewport+1,label+' page overflow: '+JSON.stringify(layout));
    }
    await page.setViewportSize({width:1366,height:1000});await page.evaluate(()=>{document.documentElement.style.fontSize='16px';});
    if(!bounded){
      const changed=async(name,fragment)=>{await shot('changed-'+name,item(fragment));interactions.push(name);};
      await item('bits').getByRole('button',{name:'NaN',exact:true}).click();
      assert.match(await item('bits').innerText(),/encode NaN/);await changed('nan','bits');
      await item('bits').getByRole('button',{name:'negative zero',exact:true}).click();
      assert.match(await item('bits').innerText(),/−0/);await changed('signed-zero','bits');
      await item('rounding').getByRole('button',{name:'E5M2',exact:true}).click();
      await item('rounding').getByRole('button',{name:'1.0625',exact:true}).click();
      assert.match(await item('rounding').innerText(),/byte 60/);await changed('coarser-rounding','rounding');
      await item('scale').getByRole('slider',{name:/Magnitude multiplier/}).fill('0');
      assert.match(await item('scale').innerText(),/All zero: s = 1/);await changed('zero-scale','scale');
      await item('scale').getByRole('slider',{name:/Magnitude multiplier/}).fill('1');
      await item('scale').getByRole('button',{name:'×100,000',exact:true}).click();await changed('scale-outlier','scale');
      await item('groups').getByRole('button',{name:'all equal',exact:true}).click();
      assert.match(await item('groups').innerText(),/metadata counts differ/);await changed('equal-groups','groups');
      await item('history').getByRole('button',{name:/t5/}).click();
      assert.match(await item('history').innerText(),/history \[1, 1, 8\]/);await changed('post-spike','history');
      await item('history').getByRole('button',{name:'zero',exact:true}).click();await changed('zero-history','history');
      await item('gemm').getByRole('button',{name:'cancellation',exact:true}).click();await changed('cancellation','gemm');
      await item('gemm').getByRole('button',{name:'zero X',exact:true}).click();
      assert.match(await item('gemm').innerText(),/undefined \(zero reference norm\)/);await changed('zero-reference','gemm');
      await item('updates').getByRole('slider',{name:/Same incoming update/}).fill('0');
      assert.match(await item('updates').innerText(),/every trajectory is stationary/);await changed('zero-update','updates');
      await item('real-study').getByRole('button',{name:'29',exact:true}).click();
      await item('real-study').getByRole('button',{name:'fixed FP32',exact:true}).click();
      assert.match(await item('real-study').innerText(),/2.377815/);await changed('recorded-fixed-evaluation','real-study');
      await item('block-product').getByRole('button',{name:'equal: 0.5 and 0.5',exact:true}).click();
      assert.match(await item('block-product').innerText(),/one factor may move outside/);await changed('equal-block-scales','block-product');
      await item('transpose').getByRole('button',{name:'all equal',exact:true}).click();await changed('equal-transpose','transpose');
      await item('cost').getByRole('slider',{name:/Original matmul fraction/}).fill('0.4');
      await item('cost').getByRole('slider',{name:/Added cost/}).fill('0.25');
      assert.match(await item('cost').innerText(),/0.9524/);await changed('whole-step-slowdown','cost');
      const slider=item('cost').getByRole('slider',{name:/Kernel speedup/});await slider.focus();await page.keyboard.press('ArrowRight');assert.equal(await slider.inputValue(),'2.25');interactions.push('keyboard-slider');
      const blocks=page.locator('.lesson-code-source');assert.equal(await blocks.count(),4);
      for(let i=0;i<4;i++){
        const block=blocks.nth(i);await block.scrollIntoViewIfNeeded();await block.locator('pre').waitFor({timeout:20000});
        const filename=await block.locator('.lesson-code__filename').innerText(), expected=fs.readFileSync('public/learn-code/fp8-training/'+filename,'utf8');
        await block.getByRole('button',{name:'Copy '+filename,exact:true}).click();
        assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
        const pending=page.waitForEvent('download');await block.getByRole('link',{name:'Download '+filename,exact:true}).click();
        const download=await pending;assert.equal(fs.readFileSync(await download.path(),'utf8'),expected);interactions.push('Copy/Download '+filename);
      }
      for(const id of ['1-start-with-the-problem','2-build-the-intuition','3-make-the-idea-precise','8-what-scales-and-what-doesn-t'])assert.equal(await page.locator('[id="'+id+'"]').count(),1);
      let fail=true;await page.route('**/learn-code/fp8-training/fp8_formats.py',req=>fail?req.abort():req.continue());
      await page.reload({waitUntil:'domcontentloaded'});const block=page.locator('.lesson-code-source').first();await block.scrollIntoViewIfNeeded();
      await block.getByRole('button',{name:'Retry',exact:true}).waitFor();fail=false;await block.getByRole('button',{name:'Retry',exact:true}).click();await block.locator('pre').waitFor();interactions.push('actual failed-code fetch and Retry');
    }
    assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);const after=hashes();assert.deepEqual(after,before,'Inputs changed during the browser campaign');
    fs.writeFileSync(path.join(output,bounded?(selected.length===figures.length?'final-layouts-report.json':'bounded-'+selected.join('-')+'-report.json'):'browser-report.json'),JSON.stringify({at:new Date().toISOString(),base,route,captures,layouts,interactions,errors,warnings,sourcesBefore:before,sourcesAfter:after,scope:bounded?selected:'Full14 figures, three viewports, changed/null states, keyboard, real Copy/Download and Retry'},null,2));
    console.log(JSON.stringify({captures:captures.length,layouts,interactions:interactions.length,errors,warnings},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
