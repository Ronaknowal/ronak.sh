const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root = 'docs/teaching/deep-learning-beginner/rwkv-linear-attention-models';
const sources = ['src/learn/data/topics/rwkv-linear-attention-models.jsx', ...['RwkvFlowDrawings','RwkvFlowLabs','RwkvTrajectoryFlow','RwkvFlowPrograms'].map(name => `src/learn/components/lesson-labs/${name}.jsx`), 'src/learn/components/lesson-labs/rwkv-flow.css', 'src/learn/data/rwkv-memory-models.js', 'public/learn-assets/rwkv-linear-attention-models/trajectory-reading-flow-models.json'];
const hashes = () => Object.fromEntries(sources.map(file => [file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const sourceHashes = hashes(), checks = [], pictures = [], layoutFindings = [];
const url = 'http://127.0.0.1:4841/learn/path/full-curriculum/rwkv-linear-attention-models?module=deep-learning-fundamentals';
function pass(name, evidence={}) { checks.push({name,...evidence}); }
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext({viewport:{width:390,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => {if(r.url().includes('rwkv-linear-attention-models/')) requests.push(r.url());});
  await page.goto(url);
  await page.locator('[data-figure="rwkv-input-anatomy"]').waitFor({timeout:120000});
  assert((await page.locator('.rwkv-reading-flow').textContent()).includes('Follow six separately shifted generators'));
  assert(!requests.some(r => r.includes('trajectory-reading-flow-models.json')));
  pass('Current manuscript rendered; fitted asset absent before viewport approach');
  await page.locator('#rwkv-fitted-edit').scrollIntoViewIfNeeded();
  await page.locator('#rwkv-fitted-edit .flow-readout').waitFor({timeout:30000});
  pass('All-four-fit asset loads near retained experiment');
  const labs = page.locator('.rwkv-reading-flow .flow-lab');
  for(let i=0;i<await labs.count();i++) {
    const lab = labs.nth(i), id = await lab.getAttribute('id');
    assert(await lab.locator('.flow-controls input,.flow-controls select,.flow-controls button').count()<=3,`${id} has a control wall`);
    const sliders = lab.locator('input[type="range"]');
    for(let j=0;j<await sliders.count();j++) {
      const slider=sliders.nth(j);
      await slider.scrollIntoViewIfNeeded();
      await slider.focus(); await slider.press('Home');
      assert.equal(Number(await slider.inputValue()),Number(await slider.getAttribute('min')));
      await slider.press('End');
      assert.equal(Number(await slider.inputValue()),Number(await slider.getAttribute('max')));
      assert(!/NaN|Infinity/.test(await lab.locator('.flow-readout').textContent()),`${id} invalid endpoint`);
      pass(`${id} slider ${j+1}: native keyboard full bounds`);
    }
    const selects=lab.locator('select');
    for(let j=0;j<await selects.count();j++) {
      const select=selects.nth(j), options=await select.locator('option').evaluateAll(rows=>rows.map(row=>row.value));
      for(const value of options.slice(0,2)) await select.selectOption(value);
      assert(await select.getAttribute('aria-label'));
      pass(`${id} select ${j+1}: named and state changes`);
    }
    const buttons=lab.locator('.flow-controls button');
    for(let j=0;j<await buttons.count();j++) if(await buttons.nth(j).isEnabled()) {const text=await buttons.nth(j).textContent();await buttons.nth(j).click();pass(`${id}: ${text}`);}
  }
  // Compare fitted models while holding exactly the same learner edit.
  const edit=page.locator('#rwkv-fitted-edit');
  const x=edit.locator('input').nth(1);await x.focus();await x.press('Home');await x.press('ArrowRight');
  const editedX=await x.inputValue();
  await page.locator('#rwkv-fitted-model select').nth(0).selectOption('positive_kernel');
  await page.locator('#rwkv-fitted-model select').nth(1).selectOption('41');
  assert.equal(await x.inputValue(),editedX);
  pass('Kind and seed switches preserve edited coordinates');
  await edit.scrollIntoViewIfNeeded();const pointTarget=edit.locator('.rwkv-drag-point').nth(44);await pointTarget.scrollIntoViewIfNeeded();const pointBox=await pointTarget.boundingBox();const beforeDrag=await edit.locator('.flow-readout').textContent();await page.mouse.move(pointBox.x+pointBox.width/2,pointBox.y+pointBox.height/2);await page.mouse.down();await page.mouse.move(pointBox.x+pointBox.width/2-16,pointBox.y+pointBox.height/2-16);await page.mouse.up();assert.notEqual(await edit.locator('.flow-readout').textContent(),beforeDrag);pass('Movement point native drag updates coordinates and inference');
  // Real pointer interaction rather than DOM value assignment.
  const slider=page.locator('#rwkv-nonunit input').first();await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();const old=await slider.inputValue();await page.mouse.click(box.x+box.width*.37,box.y+box.height/2);assert.notEqual(await slider.inputValue(),old);pass('Native mouse range interaction');
  const copies=page.locator('.lesson-code__copy');await copies.first().scrollIntoViewIfNeeded();await copies.first().click();await page.locator('.lesson-code__status--success').first().waitFor();assert((await page.evaluate(()=>navigator.clipboard.readText())).length>5);pass('Copy feedback and actual clipboard text');
  const downloadPromise=page.waitForEvent('download');await page.locator('.lesson-code__actions [aria-label^="Download"]').first().click();const download=await downloadPromise;pass('One-click code download',{filename:download.suggestedFilename()});
  const touchContext=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true});
  const touchPage=await touchContext.newPage();await touchPage.goto(url);const touchSlider=touchPage.locator('#rwkv-nonunit input').first();await touchSlider.scrollIntoViewIfNeeded();const touchBox=await touchSlider.boundingBox(),beforeTouch=await touchSlider.inputValue();const cdp=await touchContext.newCDPSession(touchPage);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchBox.x+touchBox.width*.3,y:touchBox.y+touchBox.height/2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchBox.x+touchBox.width*.6,y:touchBox.y+touchBox.height/2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notEqual(await touchSlider.inputValue(),beforeTouch);pass('Native touch range gesture');await touchContext.close();
  const folder=`${root}/screenshots/reading-flow/final-wire-repair`;fs.mkdirSync(folder,{recursive:true});
  for(const [width,textScale] of [[1366,1],[768,1],[768,2],[390,1],[320,1]]) {
    await page.setViewportSize({width,height:1050});await page.addStyleTag({content:`html{font-size:${textScale*100}%!important}`});
    const figures=page.locator('.rwkv-reading-flow [data-figure]');
    for(let i=0;i<await figures.count();i++) {
      const figure=figures.nth(i);await figure.scrollIntoViewIfNeeded();
      const name=await figure.getAttribute('data-figure');
      const bounds=await figure.locator('svg').evaluate(svg=>{const v=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};}).filter(b=>b.x<-.5||b.right>v.width+.5||b.y<-.5||b.bottom>v.height+.5);});
      if(bounds.length) layoutFindings.push({width,textScale,name,bounds});
      if([390,768].includes(width)&&(['rwkv-block','rwkv-matrix-version','rwkv-goose','rwkv-goose-block','rwkv-classifier','rwkv-summary','rwkv-chunk','rwkv-weighted-branches','rwkv-address','rwkv-stable-scale','rwkv-cache-shapes'].includes(name))) {
        const path=`${folder}/final-${name}-${width}-text${textScale}.png`;await figure.screenshot({path,style:'.site-header, .learning-header, header, .skip-link, .site-skip {visibility:hidden!important}'});pictures.push(path);
      }
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,`document overflow ${width}/text${textScale}`);
    const smallTargets=await page.locator('.rwkv-reading-flow .flow-controls input,.rwkv-reading-flow .flow-controls select,.rwkv-reading-flow .flow-controls button').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height<43.5).map(n=>n.outerHTML));assert(!smallTargets.length,JSON.stringify(smallTargets));
    pass(`Drawing label measurements and page bounds ${width}/text${textScale}`);
  }
  // Fresh page proves a forced lazy data failure has a themed working retry.
  const retryPage=await context.newPage();let failures=0;
  await retryPage.route('**/trajectory-reading-flow-models.json',route=>failures++===0?route.fulfill({status:503,body:'temporarily unavailable'}):route.continue());
  await retryPage.goto(url);await retryPage.locator('#rwkv-fitted-edit').scrollIntoViewIfNeeded();const retry=retryPage.getByRole('button',{name:'Retry fitted data'}).first();await retry.waitFor();await retry.focus();await retry.press('Enter');await retryPage.locator('#rwkv-fitted-edit .flow-readout').waitFor();pass('Forced 503 fitted data keyboard retry');
  const codePage=await context.newPage();let codeFailures=0;await codePage.route('**/linear-memory-operators.py',route=>codeFailures++===0?route.fulfill({status:503,body:'temporarily unavailable'}):route.continue());await codePage.goto(url);const source=codePage.locator('.lesson-code-source').filter({hasText:'Differentiable positive memory'});await source.scrollIntoViewIfNeeded();const codeRetry=source.getByRole('button',{name:'Retry',exact:true});await codeRetry.waitFor();await codeRetry.focus();await codeRetry.press('Enter');await source.locator('pre').waitFor();pass('Forced 503 instructional source keyboard retry');
  fs.writeFileSync(`${root}/reading-flow-final-layout-triage.json`,JSON.stringify({sourceHashes,layoutFindings},null,2)+'\n');
  await browser.close();
  assert.deepEqual(hashes(),sourceHashes,'Source changed during browser campaign');assert.equal(errors.length,0,errors.join('\n'));assert.equal(layoutFindings.length,0,JSON.stringify(layoutFindings));
  fs.writeFileSync(`${root}/reading-flow-final-browser.json`,JSON.stringify({passed:true,sourceHashes,checks,pictures,errors,limitations:'Author scoped production/browser evidence. Parent whole-site production/publication integration and independent source review remain separate.'},null,2)+'\n');
  console.log(`PASS ${checks.length} browser groups; ${pictures.length} retained painted views`);
})().catch(e=>{console.error(e);process.exit(1);});
