const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:4250';
const topic = 'docs/teaching/llm-architecture-training/supervised-fine-tuning-sft';
const output = path.resolve(topic,'browser-evidence');
fs.mkdirSync(output,{recursive:true});
const ids = Array.from({length:21},(_,i)=>`S${String(i+1).padStart(2,'0')}`);
const paths = [`${topic}/lesson.jsx`,`${topic}/lesson.md`,'src/learn/data/sft-models.js','src/learn/data/sft-runtime-data.json',
  ...['SftFlowShared','SftFoundations','SftBatching','SftStudy'].map(name=>`src/learn/components/lesson-labs/${name}.jsx`),
  'src/learn/components/lesson-labs/sft-flow.css','scripts/verify-sft-browser.cjs'];
const hashes = ()=>Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
(async()=>{
  const report={before:hashes(),captures:[],layouts:[],interactions:[],errors:[],warnings:[]};
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error' && /validateDOMNesting|cannot be a|cannot contain|unique.*key/i.test(m.text())) report.warnings.push(m.text());});
    await page.request.get(base+'/__llm_refresh');
    await page.goto(base+'/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models',{waitUntil:'domcontentloaded',timeout:90000});
    await page.locator('[data-sft-figure="S21"]').waitFor({timeout:60000});
    await page.locator('[data-sft-figure="S19"]').scrollIntoViewIfNeeded();
    report.preflightStudyText = await page.locator('[data-sft-figure="S19"]').innerText();
    await page.locator('[data-sft-figure="S19"] select').first().waitFor({timeout:30000});
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('[data-sft-figure]').count(),21);
    assert.equal(await page.locator('[data-lesson-exercise]').count(),13);
    const figure=id=>page.locator(`[data-sft-figure="${id}"]`);
    async function shot(name,element){
      await element.scrollIntoViewIfNeeded();
      await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement) document.activeElement.blur();});
      const file=name+'.png';
      await element.screenshot({path:path.join(output,file),style:'.site-header--learn,.site-skip {visibility:hidden!important;}'});
      report.captures.push(file);
    }
    const selectedArg=process.argv.find(a=>a.startsWith('--figures='));
    const selected=selectedArg ? selectedArg.slice(10).split(',') : ids;
    for(const [width,font,label] of [[1366,16,'desktop'],[390,16,'phone'],[768,32,'zoom']]){
      await page.setViewportSize({width,height:1000});
      await page.evaluate(value=>document.documentElement.style.fontSize=value+'px',font);
      for(const id of selected){
        await shot(`${selectedArg?'delta-':''}${label}-${id}`,figure(id));
        // Capture the actual rightmost portion of each overflowing representation.
        let n=0;
        for(const pane of await figure(id).locator('.sft-scroll').all()){
          const dimensions=await pane.evaluate(el=>({width:el.clientWidth,extent:el.scrollWidth-el.clientWidth}));
          if(dimensions.extent>1){
            for(const [position,value] of [['middle',dimensions.extent/2],['right',dimensions.extent]]){
              if(position==='middle' && dimensions.extent<=dimensions.width) continue;
              await pane.evaluate((el,x)=>el.scrollLeft=x,value);
              await shot(`${selectedArg?'delta-':''}${label}-${id}-pane${n}-${position}`,pane);
            }
            await pane.evaluate(el=>el.scrollLeft=0);
          }
          n++;
        }
      }
      const layout=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,
        outside:[...document.querySelectorAll('.sft-flow *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && !el.closest('.sft-scroll,.sft-equation,.lesson-code-source,.lesson-code')).slice(0,12).map(el=>({tag:el.tagName,class:String(el.className),text:el.textContent.slice(0,70)}))}));
      report.layouts.push({label,...layout}); assert.ok(layout.width<=width+1,JSON.stringify(layout));
    }
    if(!selectedArg){
      await page.setViewportSize({width:1366,height:1000});
      await page.evaluate(()=>document.documentElement.style.fontSize='16px');
      const select=async(id,label,value)=>figure(id).getByRole('combobox',{name:label,exact:true}).selectOption(String(value));
      const check=async(id,label,value)=>figure(id).getByRole('checkbox',{name:label,exact:true}).setChecked(value);
      const slider=async(id,label,value)=>figure(id).getByRole('slider',{name:new RegExp(label)}).fill(String(value));
      await select('S01','Demonstrated answer',6); await slider('S01','Illustrative SGD rate',0); await shot('changed-S01-zero-update',figure('S01'));
      await check('S02','Use a separate adapter branch',true); await shot('changed-S02-adapter',figure('S02'));
      await figure('S03').getByRole('textbox',{name:'Constructed verse'}).fill('A different quiet evening.'); await select('S03','Annotation','negative'); await shot('changed-S03-record',figure('S03'));
      await figure('S04').getByRole('button',{name:'Repair by assigning all A to development'}).click(); await shot('changed-S04-family-repair',figure('S04'));
      await check('S05','Use the longer answer: yes indeed',true); await shot('changed-S05-longer-answer',figure('S05'));
      await select('S06','Target ownership','none'); assert.match(await figure('S06').innerText(),/Invalid: no selected targets/); await shot('changed-S06-no-targets',figure('S06'));
      await check('S07','User marker remains visible in later context',false); await shot('changed-S07-context-cut',figure('S07')); await check('S07','Select full-sequence targets too',true);
      await select('S08','First emitted token in fixture','yes'); await shot('changed-S08-gold-history',figure('S08'));
      await select('S09','Assistant target policy','last'); await shot('changed-S09-last-assistant',figure('S09'));
      await check('S10','Tokenize both fragments jointly',false); await shot('changed-S10-fragment-tokenization',figure('S10'));
      await check('S11','Faulty rule: ignore every ID equal to padding',true); await check('S11','Add a 65-token overlength record',true); assert.match(await figure('S11').innerText(),/3 targets/); await shot('changed-S11-eos-erased',figure('S11'));
      await check('S12','Use naive equal microbatch weights',true); await slider('S12','B target count',8); await shot('changed-S12-naive-weights',figure('S12'));
      await check('S13','Isolate record boundaries',false); await select('S13','Inspect query row',11); await shot('changed-S13-cross-record',figure('S13'));
      await check('S14','Reset positions at each record boundary',false); await shot('changed-S14-wrong-positions',figure('S14'));
      for(const stage of ['source','tokens','labels','loss','update','inference']){await select('S15','Inspect pipeline stage',stage); await shot('changed-S15-'+stage,figure('S15'));}
      await select('S16','Trainer data schema','text'); assert.match(await figure('S16').innerText(),/9 selected targets/); await shot('changed-S16-text-schema',figure('S16'));
      await select('S17','Objective','full'); await select('S17','Order seed',29); await shot('changed-S17-full29',figure('S17'));
      await select('S18','Highlight recorded run','full-29'); await shot('changed-S18-late-degradation',figure('S18'));
      await select('S19','Recorded model','base'); await select('S19','Predeclared test example',5); await shot('changed-S19-base-invalid',figure('S19'));
      await select('S19','Evaluation method','constrained'); await shot('changed-S19-constrained-base',figure('S19'));
      for(const failure of ['boundary','stopping','dominant','late','retained']) await select('S20','Observed failure',failure);
      await shot('changed-S20-retention',figure('S20'));
      await check('S21','B answer contains no then yes',false); await check('S21','Select genuine EOS targets',false); await shot('changed-S21-capstone',figure('S21'));
      report.interactions.push('All21 figure controls and every pipeline/diagnosis branch exercised; actual null/error cases retained');
      await figure('S01').getByRole('button',{name:'Reset',exact:true}).click();
      const keyboard=figure('S01').getByRole('slider'); await keyboard.focus(); await keyboard.press('ArrowRight'); assert.equal(await keyboard.inputValue(),'0.55');
      report.interactions.push('Native keyboard range and deterministic reset');
      const blocks=page.locator('.lesson-code-source'); assert.equal(await blocks.count(),6);
      for(let i=0;i<6;i++){
        const block=blocks.nth(i); await block.scrollIntoViewIfNeeded(); await block.locator('pre').waitFor({timeout:30000});
        const name=await block.locator('.lesson-code__filename').innerText();
        const expected=fs.readFileSync('public/learn-code/supervised-fine-tuning/'+name,'utf8');
        await block.getByRole('button',{name:'Copy '+name,exact:true}).click();
        assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'));
        assert.match(await block.getByRole('button',{name:'Copy '+name,exact:true}).innerText(),/Copied/);
        const pending=page.waitForEvent('download'); await block.getByRole('link',{name:'Download '+name,exact:true}).click();
        assert.equal(fs.readFileSync(await (await pending).path(),'utf8'),expected);
        report.interactions.push('Exact Copy/Download '+name);
      }
      let fail=true;
      await page.route('**/learn-code/supervised-fine-tuning/study-evaluation.json',r=>fail?r.abort():r.continue());
      await page.route('**/learn-code/supervised-fine-tuning/sft_objective.py',r=>fail?r.abort():r.continue());
      await page.reload({waitUntil:'domcontentloaded'});
      await figure('S18').getByRole('button',{name:'Retry recorded results'}).waitFor();
      const first=page.locator('.lesson-code-source').first();await first.scrollIntoViewIfNeeded();await first.getByRole('button',{name:'Retry',exact:true}).waitFor();
      await shot('failure-data-and-code',first);
      fail=false;
      await figure('S18').getByRole('button',{name:'Retry recorded results'}).click(); await figure('S18').getByRole('combobox').waitFor();
      await figure('S19').getByRole('button',{name:'Retry recorded results'}).click(); await figure('S19').getByRole('combobox').first().waitFor();
      await first.getByRole('button',{name:'Retry',exact:true}).click(); await first.locator('pre').waitFor();
      report.interactions.push('Actual study/code network failure and successful Retry');
      const zip=await page.request.get(base+'/learn-code/supervised-fine-tuning/supervised-fine-tuning.zip');
      assert.equal(zip.status(),200); assert.deepEqual(await zip.body(),fs.readFileSync('public/learn-code/supervised-fine-tuning/supervised-fine-tuning.zip'));
      report.interactions.push('Exact full program/data bundle response');
    }
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);
    report.after=hashes();assert.deepEqual(report.after,report.before);
    report.status='passed';
    console.log(JSON.stringify({status:report.status,captures:report.captures.length,layouts:report.layouts,interactions:report.interactions},null,2));
  }catch(error){report.status='failed';report.failure=String(error.stack||error);throw error;}
  finally{report.at=new Date().toISOString();fs.writeFileSync(path.join(output,`browser-report-${Date.now()}.json`),JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
