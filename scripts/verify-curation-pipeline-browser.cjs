const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const output = process.env.CURATION_BROWSER_OUTPUT || `${folder}/browser-author-responsive`;
fs.mkdirSync(output, {recursive:true});
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files = [`${folder}/lesson.jsx`, 'src/learn/components/lesson-labs/CurationPipelineFlow.jsx', 'src/learn/components/lesson-labs/curation-pipeline-flow.css', 'src/learn/data/curation-pipeline-models.js', 'src/learn/data/curation-pipeline-recorded-study.json'];
async function main() {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write']});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.request.get('http://127.0.0.1:4250/__llm_refresh');
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models');
  await page.locator('[data-curation-figure="C01"]').waitFor({timeout:120000});
  assert.equal(await page.locator('[data-curation-figure]').count(),21);
  const checks=[], captures=[];
  const fig=id=>page.locator(`[data-curation-figure="${id}"]`);
  const capture=async(id,name)=>{await fig(id).scrollIntoViewIfNeeded();const p=`${output}/${name}.png`;await fig(id).screenshot({path:p,timeout:30000,style:'.site-header,.site-skip,.reader-sidebar { visibility:hidden !important; }'});captures.push(p);};
  const has=async(id,pattern,name)=>{const text=await fig(id).innerText();assert.match(text,pattern);checks.push({name,passed:true});};
  if(process.env.CURATION_REUSE_CAPTURES==='1'){
    const previous=JSON.parse(fs.readFileSync(`${output}/initial-capture-receipt.json`));
    for(const [p,h] of Object.entries({...previous.files,...previous.captures}))assert.equal(hash(p),h,p);
    captures.push(...Object.keys(previous.captures));
    checks.push({name:'Reused exactly bound completed63-capture phase; subsequent failed malformed slider input was a runner issue',passed:true});
  }else for(const [name,width,rootSize] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
    await page.setViewportSize({width,height:1000});
    await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,rootSize);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`${output}/${name}-reader-opening.png`});
    for(let i=1;i<=21;i++){
      const id=`C${String(i).padStart(2,'0')}`;
      await capture(id,`${name}-${id}`);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
      assert.equal(overflow,false,`${name}/${id} page overflow`);
    }
    const tiny=await page.locator('[data-curation-figure] button').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width<25||n.getBoundingClientRect().height<25).length);
    assert.equal(tiny,0,`${name} usable buttons`);
    checks.push({name:`${name}:all21 figures captured,no page overflow,usable button bounds`,passed:true});
  }
  await page.setViewportSize({width:1366,height:1000});
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  await fig('C01').getByRole('button',{name:'Empty selection',exact:true}).click();await has('C01',/No extracted text/,'Empty extraction quarantine');await capture('C01','changed-C01-empty');
  await fig('C02').getByRole('button',{name:'Keep A',exact:true}).click();await fig('C02').getByRole('button',{name:'Keep B',exact:true}).click();await has('C02',/0\/4 records/,'Empty retention');await capture('C02','changed-C02-empty');
  await fig('C03').getByRole('textbox').fill('aaaaaaaa\nb\naaaaaaaa');await has('C03',/47\.06%/,'Changed character denominator');await capture('C03','changed-C03-length');
  await fig('C03').getByRole('textbox').fill('');await has('C03',/Empty extraction: quarantine/,'Zero denominator');await capture('C03','changed-C03-empty');
  await fig('C04').getByRole('button',{name:'No observations',exact:true}).click();await has('C04',/0\.2/,'Uniform smoothed empty reference');
  await fig('C05').getByRole('textbox').fill('new spellings');await has('C05',/UNK/,'Unknown bucket');await capture('C05','changed-C05-unknown');
  await fig('C05').getByRole('textbox').fill('');await has('C05',/No words/,'Empty candidate');
  await fig('C07').getByRole('slider').first().fill('0');await has('C07',/0\.485/,'Edited feature weight');await capture('C07','changed-C07-weight');
  await fig('C08').getByRole('slider').fill('0');await has('C08',/Zero learning rate/,'Zero update');await capture('C08','changed-C08-zero');
  await fig('C09').getByRole('button',{name:'Present',exact:true}).click();await has('C09',/A1 ↔ A2 ↔ B1/,'Connected-component merge');
  await fig('C09').getByRole('button',{name:'Wrong: row',exact:true}).click();await has('C09',/cross partitions/,'Leaked group diagnosis');await capture('C09','changed-C09-leak');
  await fig('C10').getByRole('slider').fill('0.75');await has('C10',/Precision 0\.6667/,'Higher threshold lowers precision');await capture('C10','changed-C10-threshold');
  await fig('C10').getByRole('button',{name:'Exact count',exact:true}).click();await fig('C10').getByRole('slider').fill('0');await has('C10',/Precision undefined/,'Exact-count zero');
  await fig('C11').getByRole('button',{name:'Square scores',exact:true}).click();await has('C11',/0\.0776/,'Brier changed with rank conserved');await capture('C11','changed-C11-square');
  await fig('C13').getByRole('button',{name:'Constant baseline',exact:true}).click();await has('C13',/Precision is undefined/,'Measured all-reject baseline');await capture('C13','changed-C13-baseline');
  await fig('C13').getByRole('slider').last().fill('423');await has('C13',/Recorded final row/,'Last observed row inspection');
  await fig('C14').getByRole('button',{name:'technical',exact:true}).click();await has('C14',/1\.176444/,'Actual specialist false-rejection example');await capture('C14','changed-C14-technical');
  await fig('C15').getByRole('button',{name:'2.52',exact:true}).click();await has('C15',/integer 3; kept/,'Nearest-even adjacent boundary');await capture('C15','changed-C15-boundary');
  await fig('C17').getByRole('button',{name:'Curator → repetition',exact:true}).click();await has('C17',/first-removal reason is curator/,'First attribution changes');
  await fig('C17').getByRole('button',{name:'Representative → score',exact:true}).click();await has('C17',/nothing survives/,'Stateful order changes final set');await capture('C17','changed-C17-stateful');
  await fig('C18').getByRole('button',{name:'Identical',exact:true}).click();await has('C18',/every contribution zero/,'Equal-reference ratio null');await capture('C18','changed-C18-null');
  await fig('C19').getByRole('button',{name:'Intersection',exact:true}).click();await has('C19',/0\/4 kept/,'Different-rank intersection');
  await fig('C19').getByRole('button',{name:'Identical',exact:true}).click();await has('C19',/2\/4 kept/,'Same-rank combination null');await capture('C19','changed-C19-identical');
  await fig('C20').getByRole('slider').first().fill('1');await has('C20',/11000/,'Changed stage work');await capture('C20','changed-C20-work');
  await fig('C21').getByRole('slider').fill('1');await has('C21',/Mean cyclic exposure 1 /,'Full-pool exposure');await capture('C21','changed-C21-pool');
  const programs=page.locator('.lesson-code-source');
  assert.equal(await programs.count(),8);
  for(let i=0;i<8;i++){await programs.nth(i).scrollIntoViewIfNeeded();await programs.nth(i).locator('pre').waitFor({timeout:20000});}
  const copy=programs.first().getByRole('button',{name:/Copy/}).first();await copy.click();
  assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('def signals('));
  checks.push({name:'Eight complete programs load;first Copy is actual source',passed:true});
  assert.equal(await page.locator('.katex-error').count(),0);
  const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});
  assert.deepEqual(duplicateIds,[]);assert.deepEqual(errors,[]);
  fs.writeFileSync(`${output}/report.json`,JSON.stringify({checks,captures,files:Object.fromEntries(files.map(p=>[p,hash(p)])),errors,scope:'Actual browser mechanics and captures; author must separately read painted images'},null,2)+'\n');
  await browser.close();console.log(`${checks.length} browser groups;${captures.length} images saved`);
}
main().catch(e=>{console.error(e);fs.writeFileSync(`${output}/failure.json`,JSON.stringify({error:String(e),stack:e.stack},null,2));process.exit(1);});
