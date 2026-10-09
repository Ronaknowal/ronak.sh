const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fonts = require('./lib/lesson-browser-fonts.cjs');
const topic = 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const folder = `${topic}/runtime-different-browser`;
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sources = [`${topic}/lesson.jsx`, 'src/learn/components/lesson-labs/SyntheticDataFlow.jsx',
  'src/learn/components/lesson-labs/synthetic-data-flow.css', 'src/learn/data/synthetic-data-models.js'];
fs.mkdirSync(folder, {recursive:true});
const report = {reviewer:'training_author', bindings:Object.fromEntries(sources.map(p => [p, sha(p)])), checks:[], captures:[], errors:[]};
async function run() {
  const browser = await chromium.launch({channel:'msedge', headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1366, height:1000}, permissions:['clipboard-read','clipboard-write']});
    await fonts(page);
    page.on('pageerror', e => report.errors.push(String(e)));
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');
    const figure = id => page.locator(`[data-synthetic-figure="${id}"]`);
    await figure('S18').getByRole('button', {name:/Byte 255,/}).waitFor({timeout:60000});
    const capture = async (id, name) => {
      const file = `${folder}/${name}.png`;
      await figure(id).screenshot({path:file, style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});
      report.captures.push(file);
    };
    for (const [name, width, size] of [['desktop',1366,16], ['phone',390,16], ['enlarged',768,32]]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(s => {document.documentElement.style.fontSize=s+'px';document.documentElement.style.scrollBehavior='auto';}, size);
      for (let i=1; i<=22; i++) {
        const id='S'+String(i).padStart(2,'0');
        await capture(id, `${name}-${id}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), true);
        if (name === 'enlarged') {
          const regions=figure(id).locator('.synthetic-scroll');
          for(let j=0;j<await regions.count();j++) {
            const region=regions.nth(j);
            if(await region.evaluate(n=>n.scrollWidth>n.clientWidth+1)) {
              for(const [position,fraction] of [['middle',.5],['right',1]]) {
                await region.evaluate((n,f)=>n.scrollLeft=(n.scrollWidth-n.clientWidth)*f,fraction);
                const path=`${folder}/${name}-${id}-pane${j}-${position}.png`;
                await region.screenshot({path});report.captures.push(path);
              }
              await region.evaluate(n=>n.scrollLeft=0);
            }
          }
        }
      }
      report.checks.push(`${name}:22 complete figures, bounded document width`);
    }
    await page.setViewportSize({width:1366,height:1000});
    await page.evaluate(()=>document.documentElement.style.fontSize='16px');
    const text=async(id,re)=>assert.match(await figure(id).innerText(),re);
    const click=async(id,name)=>figure(id).getByRole('button',{name,exact:true}).click();
    await figure('S03').getByRole('slider',{name:/Period/}).fill('2.5');
    await text('S03',/Source now says 2.5 seconds; saved output still says 2/);
    await capture('S03','changed-source-version');
    await click('S04','B · water');await click('S04','Question and answer');
    await text('S04',/Source B: At standard atmospheric pressure/);await capture('S04','changed-source-style');
    await click('S04','Seed');await text('S04',/No source passage is supplied/);await capture('S04','changed-no-source');
    await figure('S08').getByRole('slider',{name:/Correct prevalence/}).fill('0');
    await figure('S08').getByRole('slider',{name:/False-positive/}).fill('0');
    await text('S08',/Recall = undefined/);await capture('S08','changed-absent-positive-empty-selection');
    await click('S10','With its parent');await click('S10','A2 equals B1');
    await text('S10',/joins A and B/);await click('S10','Group the whole component');
    await text('S10',/All five records belong to train/);await capture('S10','changed-duplicate-group');
    await click('S12','0 · original only');await text('S12',/0 \/ 16 generated windows/);
    await capture('S12','changed-original-only');
    await figure('S13').getByRole('slider',{name:/Output row/}).fill('31');
    const inputs=await figure('S13').locator('.synthetic-byte-row').nth(1).innerText();
    await click('S13','Edit byte 32');
    assert.equal(await figure('S13').locator('.synthetic-byte-row').nth(1).innerText(),inputs);
    await text('S13',/this last target, but none of its input context/);
    await capture('S13','changed-last-target');
    for (const arm of ['raw','copy','generated']) {
      await click('S18',arm);
      for(let i=0;i<16;i++) {
        await figure('S18').getByRole('combobox').selectOption(String(i));
        const labels=await figure('S18').locator('.synthetic-probability-grid button').evaluateAll(ns=>ns.map(n=>n.getAttribute('aria-label')));
        assert.equal(labels.length,256);
        const probabilities=labels.map(t=>Number(t.match(/probability ([^,]+)/)[1]));
        assert.ok(Math.abs(probabilities.reduce((a,b)=>a+b,0)-1)<2e-6);
        assert.equal(labels.filter(t=>t.includes('true target')).length,1);
      }
    }
    await figure('S18').getByRole('button',{name:/Byte 0,/}).click();
    await capture('S18','changed-saved-final-position');
    await click('S20','accumulate');await figure('S20').getByRole('slider',{name:/Generation/}).fill('6');
    await text('S20',/70 stored record slots/);await capture('S20','changed-accumulation-storage');
    await click('S20','anchor');await figure('S20').getByRole('slider',{name:/Generation/}).fill('0');
    await text('S20',/10 stored record slots/);await capture('S20','changed-anchor-initial-storage');
    await click('S21','20');await figure('S21').getByRole('slider').fill('1');
    await text('S21',/0.513/);await capture('S21','changed-expectation');
    report.checks.push('Complementary source/version controls, absent classes, connected split, input-invariant final-target edit, 48 complete saved vectors, accumulation/anchor budgets and exact expectation');
    const programs=page.locator('.lesson-code-source');assert.equal(await programs.count(),7);
    for(let i=0;i<7;i++) {
      const block=programs.nth(i);await block.locator('pre').waitFor({timeout:30000});
      const link=block.getByRole('link',{name:/Download/});
      const href=await link.getAttribute('href');
      const pending=page.waitForEvent('download');await link.click();const download=await pending;
      assert.equal(await download.failure(),null);
      assert.deepEqual(fs.readFileSync(await download.path()),fs.readFileSync('public'+href));
    }
    report.checks.push('Seven native program download events and exact local bytes');
    assert.deepEqual(report.errors,[]);
    for(const p of sources)assert.equal(sha(p),report.bindings[p],`source changed during review: ${p}`);
    report.status='passed';
  } finally {await browser.close();}
}
run().catch(e=>{report.status='failed';report.failure=String(e);process.exitCode=1;}).finally(()=>{
  fs.writeFileSync(`${folder}/report-${Date.now()}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,checks:report.checks,captures:report.captures.length,failure:report.failure}));
});
