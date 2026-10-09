const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder = 'docs/teaching/deep-learning-beginner/capsule-networks';
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4815';
const report = { passed: false, checkedAt: new Date().toISOString(), base, errors: [], checks: [], viewports: [], sourceHashes: {} };
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
(async () => {
  fs.mkdirSync(folder + '/screenshots/reading-flow', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce', hasTouch: true, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(base + '/learn/path/full-curriculum/capsule-networks?module=deep-learning-fundamentals', { waitUntil: 'domcontentloaded' });
    await page.locator('.capsule-lesson.lesson-flow').waitFor();
    assert.match(await page.locator('.capsule-lesson').innerText(), /Begin with two numbers/);
    assert.equal(await page.locator('.katex-error').count(), 0);
    assert.match(await page.locator('[data-figure="capsule-routing"]').first().innerText(), /If another step/);
    assert.equal(await page.locator('[data-figure="capsule-frame-commuting"] text').filter({hasText:'coordinate 2'}).first().getAttribute('y'),'89', 'Fresh built frame layout must render');
    assert.equal(requests.some(url => url.endsWith('frozen-model.f32')), false, 'Fixed model must wait until its lab approaches the viewport');
    const compass = page.locator('.lesson-compass'); assert.equal(await compass.count(),1);
    const links=compass.locator('.lesson-compass__sections a'); assert.equal(await links.count(),11);
    for(const link of await links.all()){const href=await link.getAttribute('href');assert.equal(await page.locator(`[id="${href.slice(1)}"]`).count(),1);}
    const model = await import(pathToFileURL(path.resolve('src/learn/data/capsule-models.js')).href);
    const lab = id => page.locator('#capsule-' + id);
    const read = id => lab(id).locator('.flow-readout');
    const numeric = async id => (await read(id).locator('strong').allTextContents()).map(text => Number(text.replaceAll('−', '-')));
    const close = (actual, expected, tolerance = .000001) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
    async function set(id, index, value) { const range = lab(id).locator('input[type=range]').nth(index); await range.scrollIntoViewIfNeeded(); await range.fill(String(value)); await range.dispatchEvent('input'); await range.dispatchEvent('change'); }
    const reset = async (id, label) => { await lab(id).getByRole('button', { name: label, exact: true }).click(); };
    for (const values of [[0,0,0],[3,3,3],[2,1,0]]) {
      for (const [index, value] of values.entries()) await set('grouping', index, value);
      assert.match(await read('grouping').innerText(), new RegExp(`child ${(values[0]*4+values[1])*4+values[2]}`));
    }
    await reset('grouping', 'Reset grouping');
    assert.match(await read('grouping').innerText(), /child 27/);
    for (const [x,y] of [[0,0],[-4,4],[.3,.4]]) { await set('squash',0,x); await set('squash',1,y); const values = await numeric('squash'); close(values[0], Math.hypot(x,y)); close(values[1],model.norm(model.squash([x,y]))); }
    await reset('squash','Reset vector');
    for (const [x,y,step] of [[-2,0,3],[3,3,8],[-3,-3,1]]) { for (const [index,value] of [x,y,step].entries()) await set('votes',index,value); const votes=structuredClone(model.capsuleVotes); votes[1][0]=[x,y]; const expected=model.routeCapsules(votes,step).at(-1).lengths; const actual=await numeric('votes'); actual.forEach((value,i)=>close(value,expected[i])); }
    await reset('votes','Reset routing');
    const nativeRange=lab('votes').locator('input[type=range]').first(); await nativeRange.focus(); await nativeRange.press('ArrowRight'); close(Number(await nativeRange.inputValue()),2.1); await nativeRange.press('ArrowLeft');
    await nativeRange.scrollIntoViewIfNeeded(); const track=await nativeRange.boundingBox(); await page.mouse.click(track.x+track.width*.25,track.y+track.height/2); assert.notEqual(Number(await nativeRange.inputValue()),2); await reset('votes','Reset routing');
    await nativeRange.scrollIntoViewIfNeeded(); const touchTrack=await nativeRange.boundingBox(); await page.touchscreen.tap(touchTrack.x+touchTrack.width*.7,touchTrack.y+touchTrack.height/2); assert.notEqual(Number(await nativeRange.inputValue()),2); await reset('votes','Reset routing');
    for(const [truth,wrong] of [[1,0],[0,1],[.8,.4]]) {await set('margin',0,truth);await set('margin',1,wrong);close((await numeric('margin'))[0],Math.max(0,.9-truth)**2+.5*Math.max(0,wrong-.1)**2);}
    await reset('margin','Reset lengths');
    const compact=JSON.parse(fs.readFileSync('src/learn/data/capsule-measurements.json'));
    for(const run of compact.runs) for(const count of ['1','2','3','5']) {await lab('inference-count').getByLabel('Fixed trained model').selectOption(`${run.seed}-${run.training_iterations}`);await lab('inference-count').getByLabel('Recorded inference steps').selectOption(count);const measured=run.inference_iterations[count];const changed=measured.predictions.filter((p,i)=>p!==run.inference_iterations[String(run.training_iterations)].predictions[i]).length;assert.match(await read('inference-count').innerText(),new RegExp(`${measured.correct}/120`));close((await numeric('inference-count'))[1],changed);}
    await reset('inference-count','Reset recorded comparison');
    const metadata=JSON.parse(fs.readFileSync('public/learn-assets/capsule-networks/frozen-model.json'));const bytes=fs.readFileSync('public/learn-assets/capsule-networks/frozen-model.f32');const state=model.loadCapsuleWeights(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),metadata);
    for (const id of ['frozen','shift','latent']) {await page.locator(`section[aria-label="Fixed capsule model: ${id==='frozen'?'pixels':id}"]`).scrollIntoViewIfNeeded();await lab(id).waitFor();}
    for(const specimen of ['0','1']) {const sample=metadata.examples[Number(specimen)];const original=model.encodeCapsuleImage(sample.image,state);await lab('frozen').getByLabel('Source image',{exact:true}).selectOption(specimen);await set('frozen',0,27);await set('frozen',1,0);const image=[...sample.image];image[27]=0;const edited=model.encodeCapsuleImage(image,state);const values=await numeric('frozen');close(values[0],edited.predicted);close(values[1],Math.max(...edited.lengths.map((v,i)=>Math.abs(v-original.lengths[i]))),1e-8);await lab('shift').getByLabel('Source image',{exact:true}).selectOption(specimen);await set('shift',0,1);await set('shift',1,-2);const shifted=model.encodeCapsuleImage(model.shiftCapsuleImage(sample.image,-2,1),state);close((await numeric('shift'))[0],shifted.predicted);await lab('latent').getByLabel('Source image',{exact:true}).selectOption(specimen);await set('latent',0,7);await set('latent',1,.2);const latent=await numeric('latent');assert.ok(latent[0]>0);close(latent[1],0,0);await lab('latent').getByLabel('Source image',{exact:true}).selectOption(specimen==='0'?'1':'0');close((await numeric('latent'))[0],0,0);}
    await reset('frozen','Reset image investigation');await reset('shift','Reset image investigation');await reset('latent','Reset decoder investigation');close((await numeric('frozen'))[1],0,0);close((await numeric('shift'))[1],0,0);close((await numeric('latent'))[0],0,0);
    for(const radius of [0,.5,5]) {await set('sensitivity',0,radius); const numbers=await numeric('sensitivity');const point=model.squashProbe([.6*radius,.8*radius],.02,'radial');close(numbers[0],point.change,1e-8);close(numbers[1],model.squashProbe([.6*radius,.8*radius],.02,'tangent').change,1e-8);}
    await reset('sensitivity','Reset sensitivity');
    await set('geometry',0,0);await set('geometry',1,1);await reset('geometry','Reset transformations');
    await set('em',0,0);await set('em',1,4);const first=await read('em').innerText();await set('em',1,-1);assert.equal(await read('em').innerText(),first);await set('em',0,1);await set('em',2,3);await reset('em','Reset EM evidence');
    await set('em-evidence',0,0);assert.match(await read('em-evidence').innerText(),/No active evidence/);await reset('em-evidence','Reset EM evidence');assert.match(await read('em-evidence').innerText(),/Round 1/);
    for(const temperature of [.25,2]){await set('temperature',0,temperature);await set('temperature',1,8);const expected=model.routeCapsules(model.capsuleVotes,8,temperature).at(-1).lengths;(await numeric('temperature')).forEach((v,i)=>close(v,expected[i]));}await reset('temperature','Reset temperature');
    report.checks.push('Thirteen local investigations: endpoint/interior/null arithmetic, all24 recorded model/count combinations, two real input sources, masked-out decoder null, reset/source handlers and native keyboard/mouse/touch sliders');
    const program=page.locator('.capsule-lesson .lesson-code-source').first();await program.scrollIntoViewIfNeeded();const code=program.locator('.lesson-code');await code.waitFor();await page.bringToFront();await code.locator('.lesson-code__copy').click();await code.locator('[data-copied]').waitFor();assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/TinyCapsules/);
    const downloaded=page.waitForEvent('download');await code.locator('a[download]').click();const download=await downloaded;assert.equal(download.suggestedFilename(),'capsule-learning.py');
    assert.equal(requests.filter(url=>url.endsWith('frozen-model.f32')).length,1, 'Three investigations share one saved-weight request');
    report.checks.push('Opening compass links, deferred single weight request, visible complete code, Copy feedback/clipboard, one-click download');
    for (const viewport of [{ width: 390, zoom: 1 }, { width: 768, zoom: 2 }, { width: 320, zoom: 1 }, { width: 1366, zoom: 1 }]) {
      await page.setViewportSize({ width: viewport.width, height: 1000 });
      await page.evaluate(zoom => { document.documentElement.style.fontSize = `${zoom * 100}%`; }, viewport.zoom);
      const bounds = await page.locator('.capsule-lesson .capsule-flow-figure svg').evaluateAll(svgs => svgs.map(svg => {
        const vb = svg.viewBox.baseVal;
        return { figure: svg.closest('[data-figure]')?.dataset.figure, width: svg.getBoundingClientRect().width, labelsOutside: [...svg.querySelectorAll('text')].flatMap(text => { const box = text.getBBox(); return box.x < -1 || box.x + box.width > vb.width + 1 || box.y < -1 || box.y + box.height > vb.height + 1 ? [{ text: text.textContent, x: box.x, y: box.y, width: box.width, height: box.height }] : []; }) };
      }));
      const overflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      report.viewports.push({ ...viewport, overflow, bounds });
      assert.ok(overflow.scroll <= overflow.client+1, 'Document must not overflow');
      assert.deepEqual(bounds.flatMap(figure=>figure.labelsOutside.map(label=>({figure:figure.figure,...label}))),[], 'Labels must stay within their drawing');
      for (const name of ['capsule-anatomy', 'capsule-grouping', 'capsule-parts', 'capsule-vote-transform', 'capsule-contributions-0', 'capsule-classifier', 'capsule-decoder-boundary', 'capsule-objective-routes', 'capsule-frame-commuting', 'capsule-frame-counterexample', 'capsule-em-process', 'capsule-coordinate-addition', 'capsule-transformed-density', 'capsule-prior-posterior', 'capsule-straight-through']) {
        const target = page.locator(`[data-figure="${name}"]`).first();
        await target.scrollIntoViewIfNeeded();
        await target.screenshot({ path: `${folder}/screenshots/reading-flow/${name}-${viewport.width}-${viewport.zoom}.png`, style: 'header,nav {visibility:hidden !important}' });
      }
    }
    report.checks.push('Current revised source renders with no KaTeX errors; four viewport label bounds and document widths asserted, topic-specific geometry snapshots captured');
    const recovery=await browser.newPage({viewport:{width:390,height:1000}});
    await recovery.route('**/frozen-model.f32',route=>route.fulfill({status:503,body:'controlled unavailable'}));
    await recovery.goto(base+'/learn/path/full-curriculum/capsule-networks?module=deep-learning-fundamentals',{waitUntil:'domcontentloaded'});
    const frozenSection=recovery.locator('section[aria-label="Fixed capsule model: pixels"]');await frozenSection.scrollIntoViewIfNeeded();await frozenSection.getByRole('button',{name:'Retry frozen model'}).waitFor();await recovery.unroute('**/frozen-model.f32');await frozenSection.getByRole('button',{name:'Retry frozen model'}).click();await recovery.locator('#capsule-frozen .flow-readout').waitFor();await recovery.close();
    report.checks.push('Controlled503 fixed-weight loading failure and explicit recovery');
    assert.equal(report.errors.length, 0, report.errors.join('\n'));
    report.passed = true;
  } catch (error) { report.errors.push(error.stack); throw error; }
  finally {
    for (const file of ['src/learn/data/topics/capsule-networks.jsx', 'src/learn/components/lesson-labs/CapsuleDrawings.jsx', 'src/learn/components/lesson-labs/CapsuleFlowLabs.jsx', 'src/learn/components/lesson-labs/CapsuleLabs.jsx', 'src/learn/components/lesson-labs/capsule-flow.css', 'scripts/verify-capsule-reading-browser.cjs', 'src/learn/data/capsule-models.js', 'src/learn/data/capsule-measurements.json', 'public/learn-assets/capsule-networks/frozen-model.json', 'public/learn-assets/capsule-networks/frozen-model.f32']) report.sourceHashes[file] = hash(file);
    fs.writeFileSync(folder + '/reading-flow-browser.json', JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
})().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
