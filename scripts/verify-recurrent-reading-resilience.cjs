const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const folder = 'docs/teaching/deep-learning-beginner/rnns-lstms-grus/';
const url = 'http://127.0.0.1:4819/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals';
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const results = [], errors = [];
  try {
    // Failed fetches must release their promise cache and remain keyboard retryable.
    for (const [asset, owner, retry, ready] of [
      ['pen-models.json', '[data-recurrent-load="recurrent-pen"]', 'Retry lab data', '#recurrent-pen'],
      ['recurrent-evidence.json', '[data-recurrent-load="recurrent-measured"]', 'Retry lab data', '#recurrent-measured'],
      ['recurrent-cells.py', '[aria-label="Explicit differentiable batched recurrent cells"]', 'Retry source', '.lesson-code']
    ]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
      let requests = 0;
      await page.route('**/learn-assets/rnns-lstms-grus/' + asset, route => {
        requests++;
        return requests === 1 ? route.fulfill({ status: 503, body: 'Temporary unavailable test' }) : route.continue();
      });
      await page.goto(url); const host = page.locator(owner); await host.scrollIntoViewIfNeeded();
      const button = host.getByRole('button', { name: retry, exact: true }); await button.waitFor();
      await button.focus();
      const style = await button.evaluate(e => ({ color: getComputedStyle(e).color, background: getComputedStyle(e).backgroundColor, focus: e === document.activeElement }));
      assert.equal(style.focus, true); assert.notEqual(style.color, 'rgb(0, 0, 0)');
      await page.screenshot({ path: folder + 'screenshots/reading-flow/retry-' + asset + '.png' });
      await button.press('Enter'); await page.locator(ready).first().waitFor();
      assert.equal(requests, 2);
      if (asset === 'pen-models.json') {
        const first = page.locator('#recurrent-pen input[type=range]').first(); await first.focus(); await first.press('Home');
        const edited = await first.inputValue();
        await page.locator('#recurrent-pen-state').scrollIntoViewIfNeeded();
        await page.locator('#recurrent-pen-state select').selectOption('lstm');
        assert.equal(await first.inputValue(), edited);
        await page.locator('#recurrent-pen').getByRole('button', { name: 'Reset fitted trace' }).click();
        await page.locator('[data-recurrent-load="recurrent-boundary"]').scrollIntoViewIfNeeded();
        await page.locator('#recurrent-boundary').waitFor();
        await page.locator('[data-recurrent-load="recurrent-padding"]').scrollIntoViewIfNeeded();
        await page.locator('#recurrent-padding').waitFor();
        assert.equal(requests, 2, 'All three investigations reuse one successful parsed pen model');
      }
      results.push({ asset, requests, retry: 'Native keyboard Enter', theme: style, passed: true });
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, hasTouch: true });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await page.locator('.recurrent-flow-lesson').waitFor();
    const forward = page.locator('#recurrent-forward'); await forward.scrollIntoViewIfNeeded();
    const slider = forward.locator('input[type=range]').first();
    const before = await slider.inputValue(), box = await slider.boundingBox();
    await page.touchscreen.tap(box.x + box.width * .85, box.y + box.height / 2);
    assert.notEqual(await slider.inputValue(), before);
    const touched = await slider.inputValue();
    await page.mouse.click(box.x + box.width * .25, box.y + box.height / 2);
    assert.notEqual(await slider.inputValue(), touched);
    await forward.getByRole('button', { name: /Reset/ }).click();
    assert.equal(await slider.inputValue(), before);
    results.push({ operation: 'Native touch and mouse range change plus reset', passed: true });
    await page.locator('[data-recurrent-load="recurrent-pen"]').scrollIntoViewIfNeeded();
    await page.locator('#recurrent-pen').waitFor();
    const circle = page.locator('#recurrent-pen circle[role=button]').nth(2); await circle.scrollIntoViewIfNeeded();
    const old = await page.locator('#recurrent-pen input[type=range]').first().inputValue();
    const dot = await circle.boundingBox();
    await page.mouse.move(dot.x + dot.width/2, dot.y + dot.height/2); await page.mouse.down();
    await page.mouse.move(dot.x + dot.width/2 + 24, dot.y + dot.height/2 + 18, { steps: 5 }); await page.mouse.up();
    assert.notEqual(await page.locator('#recurrent-pen input[type=range]').first().inputValue(), old);
    await page.locator('#recurrent-pen').getByRole('button', { name: 'Reset fitted trace' }).click();
    assert.equal(await page.locator('#recurrent-pen input[type=range]').first().inputValue(), old);
    results.push({ operation: 'Native pointer-drag point editing and exact reset', passed: true });
    const headings = await page.locator('.recurrent-flow-lesson h2').evaluateAll(nodes => nodes.map(n => ({ id: n.id, text: n.textContent })));
    assert.equal(headings.length, 11); assert.ok(headings.every(h => h.id));
    const localLinks = await page.locator('a[href*="#"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')).filter(h => h.startsWith('#')));
    assert.ok(localLinks.length >= 11);
    assert.deepEqual(await page.evaluate(links => links.filter(h => !document.getElementById(decodeURIComponent(h.slice(1)))), localLinks), []);
    results.push({ operation: 'All eleven main section anchors and local index targets exist', passed: true });
    for (const id of ['recurrent-pen', 'recurrent-measured', 'recurrent-boundary', 'recurrent-padding']) {
      await page.locator(`[data-recurrent-load="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator('#' + id).waitFor();
    }
    const screenshots = [];
    for (const [width, percent] of [[390,100], [768,200]]) {
      await page.setViewportSize({ width, height: 1000 }); await page.evaluate(p => document.documentElement.style.fontSize = p + '%', percent);
      let occurrence = 0;
      for (const figure of await page.locator('.recurrent-flow-lesson [data-figure]').all()) {
        const name = await figure.getAttribute('data-figure');
        const file = folder + 'screenshots/reading-flow/all-' + String(++occurrence).padStart(2, '0') + '-' + name + '-' + width + '-' + percent + '.png';
        await figure.screenshot({ path: file, style: '.site-header, .site-skip { visibility: hidden !important; }' }); screenshots.push(file);
      }
      for (const id of ['gru-mixing', 'recurrent-pen-state', 'recurrent-measured', 'recurrent-padding']) {
        const file = folder + 'screenshots/reading-flow/lab-' + id + '-' + width + '-' + percent + '.png';
        await page.locator('#' + id).screenshot({ path: file, style: '.site-header, .site-skip { visibility: hidden !important; }' }); screenshots.push(file);
      }
    }
    await context.close();
    const receipt = { passed: !errors.length, results, errors, screenshots, url,
      sourceHashes: JSON.parse(fs.readFileSync(folder + 'reading-flow-source.json')).sourceHashes, verifierHash: hash(__filename),
      limits: 'Actual production retry, controls and source binding. Unrelated fixed site header and skip link are hidden only in scoped figure/lab captures; retry captures retain the page UI. Screenshot teaching/geometry inspection is recorded by the author separately.' };
    fs.writeFileSync(folder + 'reading-flow-resilience.json', JSON.stringify(receipt, null, 2) + '\n');
    console.log(JSON.stringify({ passed: receipt.passed, groups: results.length, screenshots: screenshots.length, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
