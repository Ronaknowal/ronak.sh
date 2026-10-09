const fs = require('fs');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const output = process.env.SYNTHETIC_BROWSER_OUTPUT || `${folder}/browser-author`;
fs.mkdirSync(output, {recursive:true});
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files = [`${folder}/lesson.jsx`, 'src/learn/components/lesson-labs/SyntheticDataFlow.jsx', 'src/learn/components/lesson-labs/synthetic-data-flow.css', 'src/learn/data/synthetic-data-models.js'];
async function main() {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write']});
    const errors = []; page.on('pageerror', error => errors.push(String(error)));
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');
    const fig = id => page.locator(`[data-synthetic-figure="${id}"]`);
    await fig('S01').waitFor({timeout:120000});
    assert.equal(await page.locator('[data-synthetic-figure]').count(),22);
    await fig('S18').getByRole('button',{name:/Byte 255,/}).waitFor({timeout:60000});
    const checks=[],captures=[];
    const capture = async(id,name) => {
      await fig(id).scrollIntoViewIfNeeded();
      const file = `${output}/${name}.png`;
      await fig(id).screenshot({path:file,timeout:30000,style:'.site-header,.site-skip,.reader-sidebar {visibility:hidden!important}'});
      captures.push(file);
    };
    const has = async(id,re,name) => { assert.match(await fig(id).innerText(),re,name); checks.push(name); };
    for(const [name,width,rootSize] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(size => document.documentElement.style.fontSize=`${size}px`,rootSize);
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({path:`${output}/${name}-opening.png`});
      for(let i=1;i<=22;i++) {
        const id=`S${String(i).padStart(2,'0')}`;
        await capture(id,`${name}-${id}`);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${name}/${id} page overflow`);
        if(name!=='desktop'){
          const regions=fig(id).locator('.synthetic-scroll');
          for(let j=0;j<await regions.count();j++){
            const region=regions.nth(j),overflow=await region.evaluate(n=>n.scrollWidth>n.clientWidth+1);
            if(overflow){await region.focus();await region.press('End');await region.evaluate(n=>n.scrollLeft=n.scrollWidth);await capture(id,`${name}-${id}-right-${j}`);await region.evaluate(n=>n.scrollLeft=0);}
          }
        }
      }
      checks.push(`${name}: all22 figures captured without page overflow`);
    }
    await page.setViewportSize({width:1366,height:1000}); await page.evaluate(()=>document.documentElement.style.fontSize='16px');
    const click=async(id,name)=>fig(id).getByRole('button',{name,exact:true}).click();
    await click('S01','invention'); await has('S01',/Unsupported change/,'Generated text and target change');
    await click('S02','Answer only'); await has('S02',/3\.5 nats/,'Mask denominator changes');
    await click('S03','Question and answer'); await has('S03',/Write one question/,'Prompt form changes');
    await click('S04','Procedure'); await has('S04',/exact operations/,'Generation route changes');
    await fig('S05').getByRole('slider').last().fill('1'); await has('S05',/Keep 4 tokens/,'Full nucleus null');
    await fig('S06').getByRole('slider').first().fill('0.9'); await fig('S06').getByRole('slider').last().fill('0.999'); await has('S06',/Termination: EOS/,'Conditional EOS');
    await fig('S07').getByRole('slider').first().fill('5'); await has('S07',/Valid/,'Correct equality');
    await fig('S08').getByRole('slider').nth(1).fill('0'); await fig('S08').getByRole('slider').nth(2).fill('0'); await has('S08',/undefined: no candidate/,'Empty selection');
    await fig('S09').getByRole('slider').fill('1'); await has('S09',/Category C retains mass/,'Support restored');
    await click('S10','A2 equals B1'); await click('S10','Group the whole component'); await has('S10',/All five records belong to train/,'Whole component split repair');
    await fig('S11').getByRole('slider').fill('1'); await has('S11',/= 2\./,'Equal family null');
    await click('S12','1 · generated only'); await has('S12',/16 \/ 16/,'All generated batch');
    await click('S13','Edit byte 32'); await has('S13',/later target, outside/,'Future byte outside causal context');
    await fig('S14').getByRole('combobox').selectOption('1'); await has('S14',/fewer than 33 UTF-8 bytes/,'Rejected actual QA retained');
    await fig('S15').getByRole('combobox').selectOption('30'); await has('S15',/poker player/,'Actual semantic failure visible');
    await click('S16','0'); await has('S16',/0 selected training targets/,'Initialization checkpoint');
    await click('S17','43'); await has('S17',/seed 43/,'Actual third seed paragraphs');
    await click('S18','generated'); await fig('S18').getByRole('combobox').selectOption('15'); await fig('S18').getByRole('button',{name:/Byte 255,/}).click(); await has('S18',/Selected byte 255/,'Saved final complete vector');
    await click('S19','Previous generation'); await has('S19',/Generation 0/,'Reverse deterministic simulation');
    await click('S20','anchor'); await fig('S20').getByRole('slider').last().fill('0'); await has('S20',/Original weight 1, latest generated weight 0/,'Fixed-source anchor null');
    await click('S21','50'); await fig('S21').getByRole('slider').fill('0'); await has('S21',/0\.54/,'Initial diversity exact null');
    await fig('S22').getByRole('slider').last().fill('0'); await has('S22',/No finite cost per keep/,'Zero acceptance cost boundary');
    for(let i=1;i<=22;i++){const id=`S${String(i).padStart(2,'0')}`;await capture(id,`changed-${id}`);}
    const programs=page.locator('.lesson-code-source'); assert.equal(await programs.count(),7);
    for(let i=0;i<7;i++){await programs.nth(i).scrollIntoViewIfNeeded();await programs.nth(i).locator('pre').waitFor({timeout:20000});}
    await programs.first().getByRole('button',{name:/Copy/}).first().click();
    assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('def inverse_cdf'));
    assert.equal(await page.locator('[data-lesson-ending="practice"] details').count(),24);
    await page.locator('[data-lesson-ending="practice"] details').first().locator('summary').click();
    assert.ok(await page.locator('[data-lesson-ending="practice"] details').first().getAttribute('open')!==null);
    const zip=await page.request.get('http://127.0.0.1:4250/learn-code/synthetic-data/synthetic-programs-data.zip');
    assert.equal(zip.status(),200);assert.ok((await zip.body()).subarray(0,2).toString()==='PK');
    checks.push('Seven complete code sources, actual Copy, twelve Hint/Solution pairs and actual ZIP bytes');
    assert.equal(await page.locator('.katex-error').count(),0);
    assert.deepEqual(errors,[]);
    const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(duplicates,[]);
    const recovery=await browser.newPage({viewport:{width:390,height:1000}});
    await recovery.route('**/learn-code/synthetic-data/study.json',route=>route.abort());
    await recovery.goto(page.url());
    const retry=recovery.locator('[data-synthetic-figure="S18"]').getByRole('button',{name:'Retry recorded data'});
    await retry.waitFor({timeout:60000});await retry.scrollIntoViewIfNeeded();
    await recovery.locator('[data-synthetic-figure="S18"]').screenshot({path:`${output}/loading-failure.png`});
    await recovery.unroute('**/learn-code/synthetic-data/study.json');await retry.click();
    await recovery.locator('[data-synthetic-figure="S18"]').getByRole('button',{name:/Byte 255,/}).waitFor();
    checks.push('Actual failed data request has keyboard-accessible Retry; recovered full saved head');
    await recovery.close();
    fs.writeFileSync(`${output}/report.json`,JSON.stringify({checks,captures,files:Object.fromEntries(files.map(p=>[p,hash(p)])),errors,scope:'Actual browser behavior and capture; author must separately inspect painted images'},null,2)+'\n');
    console.log(`${checks.length} browser groups, ${captures.length} captured figures`);
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);fs.writeFileSync(`${output}/failure-${Date.now()}.json`,JSON.stringify({error:String(error),stack:error.stack},null,2));process.exit(1);});
