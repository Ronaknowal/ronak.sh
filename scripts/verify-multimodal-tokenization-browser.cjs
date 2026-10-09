// Run against a current isolated production build. Never overwrites a passed receipt.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4242';
const build = process.env.MULTIMODAL_BUILD_DIR || 'dist-multimodal-tokenization';
const output = process.env.MULTIMODAL_REVIEW_OUTPUT || 'docs/teaching/tokenization/multimodal-tokenization-visual-audio-video/browser-evidence';
const id = 'multimodal-tokenization-visual-audio-video';
const receipt = `${output}/report.json`;
if (fs.existsSync(receipt)) throw new Error('Use a fresh MULTIMODAL_REVIEW_OUTPUT; do not overwrite passed evidence.');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(`${output}/screenshots`, { recursive: true });
const sources = ['src/learn/data/topics/multimodal-tokenization.jsx', 'src/learn/data/multimodal-tokenization-models.js', 'src/learn/components/lesson-labs/MultimodalTokenizationFlow.jsx', 'src/learn/components/lesson-labs/multimodal-tokenization-flow.css', 'scripts/verify-multimodal-tokenization-browser.cjs'];
const hashes = Object.fromEntries(sources.map(p => [p, hash(p)]));
const manifestHash = hash(`${build}/.vite/manifest.json`);
let checks = 0;
const records = { checkedAt: new Date().toISOString(), base, build, sourceFiles: hashes, buildManifestHash: manifestHash, interactions: [], views: [], programChecks: [] };
const ok = (value, message) => { assert.ok(value, message); checks++; };
const eq = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const screenshotStyle = '.site-header,.site-skip{visibility:hidden!important}';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  async function read(id) { return page.locator(`#${id} .flow-readout`).last().innerText(); }
  async function range(id, label, value) {
    const input = page.locator(`#${id}`).getByRole('slider', { name: new RegExp(label) });
    const bounds = await input.evaluate(element => ({ min: Number(element.min), max: Number(element.max), step: Number(element.step) }));
    const fromEnd = value > (bounds.min + bounds.max) / 2;
    await input.focus();
    await input.press(fromEnd ? 'End' : 'Home');
    const steps = Math.round(Math.abs(value - (fromEnd ? bounds.max : bounds.min)) / bounds.step);
    for (let step = 0; step < steps; step++) await input.press(fromEnd ? 'ArrowLeft' : 'ArrowRight');
    eq(Number(await input.inputValue()), value, `Native range value ${label}`);
  }
  async function reset(id) { await page.locator(`#${id}`).getByRole('button', { name: /^Reset$/ }).click(); }
  async function capture(id, name) { const target = page.locator(`#${id}`); await target.scrollIntoViewIfNeeded(); const file = `${output}/screenshots/${name}.png`; await target.screenshot({ path: file, style: screenshotStyle }); return file; }
  try {
    await page.goto(`${base}/learn/path/full-curriculum/${id}?module=large-language-models`, { waitUntil: 'domcontentloaded' });
    await page.locator('.multimodal-flow').waitFor();
    await page.evaluate(() => document.fonts.ready);
    ok((await page.locator('.multimodal-flow').innerText()).includes('mean squared pixel error'), 'Confirm current successor content actually renders');
    ok((await page.locator('.multimodal-flow').innerText()).includes('our illustrated sums use zero bias'), 'Current bias clarification is in the built page');
    ok((await page.locator('.multimodal-flow').innerText()).includes('sum and mean coincide'), 'Current loss-reduction clarification is in the built page');
    ok((await page.locator('.multimodal-flow').textContent()).includes('ze + (zq - ze).detach()'), 'Executable practice repair is in the built page');
    eq(await page.locator('.lesson-compass').count(), 1, 'One shared opening');
    const anchors = await page.locator('.lesson-compass__sections a').evaluateAll(links => links.map(link => ({ text: link.textContent, href: link.getAttribute('href'), count: document.querySelectorAll(`[id="${CSS.escape(link.hash.slice(1))}"]`).length })));
    ok(anchors.length >= 15 && anchors.every(a => a.count === 1), 'Complete unique section index');
    records.anchors = anchors;
    const old = ['1-why-it-exists', '2-core-intuition', '3-mathematical-foundation', '4-from-scratch-implementation', '5-production-implementation', '6-visual-walkthrough', '7-decision-matrix', '8-what-scales-and-what-doesn-t', '9-failure-modes-gotchas', '10-primary-sources', '11-self-check-exercises'];
    for (const fragment of old) eq(await page.locator(`[id="${fragment}"]`).count(), 1, `Retained fragment ${fragment}`);
    const firstLink = page.locator('.lesson-compass__sections a').first();
    await firstLink.click(); ok(page.url().includes('#1-what-reaches-the-transformer'), 'Native section hash');
    await page.goBack(); ok(!page.url().includes('#1-what-reaches-the-transformer'), 'Native Back');

    const patches = page.locator('#mm-patch-projection');
    ok((await read('mm-patch-projection')).includes('4 patches'), 'Default patch count');
    await patches.getByRole('button', { name: /Row 1, column 1:.*toggle pixel/ }).click();
    ok((await patches.innerText()).includes('1 + 0 = 1'), 'Changed pixel propagates into projection');
    records.interactions.push({ question: 'pixel correspondence', screenshot: await capture('mm-patch-projection', 'patch-edited') });
    await reset('mm-patch-projection');
    const sideChoices = patches.getByRole('group', { name: 'Patch side P', exact: true });
    await sideChoices.getByRole('button', { name: '1', exact: true }).click(); ok((await read('mm-patch-projection')).includes('16 patches'), 'P1 count');
    await sideChoices.getByRole('button', { name: '4', exact: true }).click(); ok((await read('mm-patch-projection')).includes('1 patches'), 'P4 count');
    await reset('mm-patch-projection');
    await patches.getByRole('group', { name: 'Trace patch', exact: true }).getByRole('button', { name: 'B', exact: true }).click();
    const blueTrace = await patches.locator('[data-patch-id="B"]').evaluateAll(marks => marks.map(mark => {
      const child = mark.querySelector('.mm-value');
      const style = getComputedStyle(child || mark);
      return { colour: style.color, border: style.borderTopColor };
    }));
    ok(blueTrace.length >= 4 && blueTrace.every(mark => mark.colour === 'rgb(96, 165, 250)' || mark.border === 'rgb(96, 165, 250)'), 'Actual blue paint follows patch B through borders, vectors and rows');
    ok((await read('mm-patch-projection')).includes('patch B'), 'Patch selection'); await reset('mm-patch-projection');

    ok((await read('mm-quantization')).includes('Squared error 0.2'), 'Default VQ squared distance');
    await range('mm-quantization', 'Encoder x', 0); await range('mm-quantization', 'Encoder y', 0);
    eq(await page.locator('#mm-quantization svg [data-code-id]').evaluateAll(marks => marks.map(mark => getComputedStyle(mark).fill)), ['rgb(226, 181, 90)', 'rgb(96, 165, 250)', 'rgb(192, 132, 252)', 'rgb(244, 114, 182)'], 'Dictionary identities keep their actual painted hues after a tie changes selection');
    ok((await read('mm-quantization')).includes('selects k 0'), 'Tie selects first code');
    records.interactions.push({ question: 'nearest-code tie', screenshot: await capture('mm-quantization', 'vq-tie') });
    await range('mm-quantization', 'Encoder x', -.8); await range('mm-quantization', 'Encoder y', .7);
    ok((await read('mm-quantization')).includes('0.13'), 'Changed VQ error');
    await reset('mm-quantization');
    await page.locator('#mm-quantization').getByRole('slider', { name: /Encoder x/ }).focus();
    await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
    eq(await page.locator('#mm-quantization').getByRole('slider', { name: /Encoder x/ }).inputValue(), '-1.4', 'Keyboard interior value');
    await reset('mm-quantization');

    ok((await read('mm-residual')).includes('0.025'), 'Default residual error');
    await range('mm-residual', 'Residual levels', 1); ok((await read('mm-residual')).includes('0.2'), 'One-level residual'); await reset('mm-residual');
    const audioBefore = await page.locator('#mm-audio-order').innerText();
    await page.locator('#mm-audio-order').getByRole('button', { name: 'Level-major', exact: true }).click();
    ok((await page.locator('#mm-audio-order').innerText()) !== audioBefore, 'Ordering changes immediate output');
    records.interactions.push({ question: 'reversible audio ordering', screenshot: await capture('mm-audio-order', 'audio-level-major') }); await reset('mm-audio-order');

    await range('mm-video-sampling', 'Sampling rate', 1); ok(/miss|not observed|not retained/i.test(await read('mm-video-sampling')), 'Sparse sampling misses the event');
    records.interactions.push({ question: 'missing temporal evidence', screenshot: await capture('mm-video-sampling', 'video-missed') });
    await range('mm-video-sampling', 'Sampling rate', 4); ok(/observ|retain|capture/i.test(await read('mm-video-sampling')), 'Dense sampling retains the event'); await reset('mm-video-sampling');
    ok((await read('mm-budget')).includes('1240') || (await read('mm-budget')).includes('1,240'), 'Default budget');
    await range('mm-budget', 'Audio duration', 0); ok((await read('mm-budget')).includes('40'), 'Zero audio uses40');
    records.interactions.push({ question: 'zero-duration budget', screenshot: await capture('mm-budget', 'budget-zero') });
    await range('mm-budget', 'Audio duration', 10);
    await page.locator('#mm-budget').getByRole('group', { name: 'RVQ levels', exact: true }).getByRole('button', { name: '16', exact: true }).click();
    ok(/exceed|over|does not fit|too many/i.test(await read('mm-budget')), 'Over-budget consequence'); await reset('mm-budget');

    await page.locator('#mm-digit-reconstruction .flow-readout').waitFor();
    ok((await read('mm-digit-reconstruction')).includes('305'), 'Actual heldout source');
    await page.locator('#mm-digit-reconstruction').getByRole('button', { name: /source 302/ }).click();
    ok((await read('mm-digit-reconstruction')).includes('302'), 'Second actual heldout source');
    records.interactions.push({ question: 'real reconstruction comparison', screenshot: await capture('mm-digit-reconstruction', 'digit-second') });
    await page.locator('#mm-digit-reconstruction').getByRole('button', { name: /source 305/ }).click();

    for (const [width, zoom, name, capturePaint] of [[1366, 1, 'desktop', true], [390, 1, 'phone', true], [768, 2, 'enlarged', true], [320, 1, 'small', false]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(zoom => { document.documentElement.style.fontSize = zoom === 2 ? '32px' : ''; }, zoom);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(overflow <= 1, `${name}: page overflow ${overflow}`);
      const math = page.locator('.multimodal-flow .mm-math');
      eq(await math.count(), 10, `${name}: all equations have local keyboard scrolling`);
      await math.first().focus();
      eq(await math.first().evaluate(element => element === document.activeElement), true, `${name}: focusable math region`);
      eq(await page.locator('.multimodal-flow .katex-error').count(), 0, `${name}: all mathematical expressions render`);
      const equations = [];
      for (let equation = 0; equation < await math.count(); equation++) {
        const target = math.nth(equation);
        const geometry = await target.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth, overflow: getComputedStyle(element).overflowX }));
        eq(geometry.overflow, 'auto', `${name}: equation ${equation + 1} scrolls locally`);
        if (name === 'phone' || name === 'enlarged') {
          await target.scrollIntoViewIfNeeded();
          geometry.screenshot = `${output}/screenshots/${name}-equation-${equation + 1}.png`;
          await target.screenshot({ path: geometry.screenshot, style: screenshotStyle });
          geometry.screenshotSha256 = hash(geometry.screenshot);
        }
        equations.push(geometry);
      }
      if (name === 'desktop') {
        const comparison = await page.locator('.mm-digit-triplet > *').evaluateAll(parts => parts.map(part => part.getBoundingClientRect().top));
        ok(Math.max(...comparison) - Math.min(...comparison) < 2, 'Desktop real originals, code grid and reconstruction compare on one row');
        const alternatives = await page.locator('.mm-alternatives > *').evaluateAll(parts => parts.map(part => ({ top: part.getBoundingClientRect().top, x: part.getBoundingClientRect().left })));
        ok(alternatives.length === 2 && Math.abs(alternatives[0].top - alternatives[1].top) < 2 && alternatives[1].x > alternatives[0].x, 'Desktop media alternatives visibly fork into separate lanes');
      }
      const items = page.locator('.multimodal-flow :is(figure,.flow-lab)');
      const figures = [];
      for (let i = 0; i < await items.count(); i++) {
        const target = items.nth(i);
        if (await target.evaluate(element => Boolean(element.parentElement.closest('figure,.flow-lab')))) continue;
        await target.scrollIntoViewIfNeeded();
        const details = await target.evaluate(element => {
          const style = getComputedStyle(element), box = element.getBoundingClientRect();
          const svgText = [...element.querySelectorAll('svg text')].map(text => {
            const b = text.getBBox(), matrix = text.getScreenCTM();
            const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
            const view = text.ownerSVGElement.viewBox.baseVal;
            return { text: text.textContent, fontPixels: parseFloat(getComputedStyle(text).fontSize) * scale, x: b.x, y: b.y, width: b.width, height: b.height,
              inside: b.x >= view.x - 2 && b.y >= view.y - 2 && b.x + b.width <= view.x + view.width + 2 && b.y + b.height <= view.y + view.height + 2 };
          });
          return { name: element.id || element.getAttribute('data-mm-figure'), width: box.width, height: box.height,
            border: style.borderTopWidth, background: style.backgroundColor, shadow: style.boxShadow,
            headingCount: element.querySelectorAll('h2,h3').length, svgText,
            colourMarks: [...element.querySelectorAll('[data-code-id],[data-patch-id]')].slice(0, 20).map(mark => ({ code: mark.getAttribute('data-code-id'), patch: mark.getAttribute('data-patch-id'), fill: getComputedStyle(mark).fill, colour: getComputedStyle(mark).color, identity: getComputedStyle(mark).getPropertyValue('--mm-colour'), border: getComputedStyle(mark).borderTopColor, stroke: getComputedStyle(mark).stroke })) };
        });
        ok(details.width > 1 && details.height > 1, `${name}/${details.name}: collapsed drawing`);
        eq(details.border, '0px', `${name}/${details.name}: frame`); eq(details.background, 'rgba(0, 0, 0, 0)', `${name}/${details.name}: surface`);
        eq(details.shadow, 'none', `${name}/${details.name}: shadow`); eq(details.headingCount, 0, `${name}/${details.name}: visual heading`);
        for (const label of details.svgText) { ok(label.fontPixels >= 11.8, `${name}/${details.name}: small label ${label.text} ${label.fontPixels}`); ok(label.inside, `${name}/${details.name}: clipped label ${label.text}`); }
        if (capturePaint) { details.screenshot = `${output}/screenshots/${name}-${details.name}.png`; await target.screenshot({ path: details.screenshot, style: screenshotStyle }); details.screenshotSha256 = hash(details.screenshot); }
        figures.push(details);
      }
      eq(figures.length, 13, `${name}: all authored visual jobs`);
      records.views.push({ width, zoom, name, overflow, figures, equations });
    }

    await page.setViewportSize({ width: 1366, height: 1000 }); await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    const programs = page.locator('.lesson-code-source'); eq(await programs.count(), 5, 'Five complete automatically visible programs');
    for (let i = 0; i < await programs.count(); i++) {
      const program = programs.nth(i); await program.scrollIntoViewIfNeeded(); await program.locator('.lesson-code').waitFor();
      const link = program.getByRole('link', { name: /^Download / });
      const href = await link.getAttribute('href'); const canonical = fs.readFileSync(path.join('public', href), 'utf8');
      eq(await program.locator('pre code').textContent(), canonical, `Visible canonical source ${href}`);
      const pre = program.locator('pre'); await pre.focus(); eq(await pre.evaluate(e => e === document.activeElement), true, 'Keyboard code scrolling');
      await program.getByRole('button', { name: /^Copy / }).click(); await program.locator('[data-copied]').waitFor();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      eq(copied.replace(/\r\n/g, '\n'), canonical.replace(/\r\n/g, '\n'), 'Actual copied program preserves all text with platform line endings');
      records.programChecks.push({ href, sha256: hash(path.join('public', href)), copiedCharacters: copied.length, clipboardLineEndings: copied.includes('\r\n') ? 'Windows CRLF' : 'LF', comparison: 'Exact text after LF/CRLF normalization only' });
    }
    const assetLinks = await page.locator('.reader-article a[href^="/learn-code/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))]);
    for (const asset of assetLinks) { const response = await context.request.get(base + asset); ok(response.ok(), `Asset ${asset}`); eq(await response.body(), fs.readFileSync(path.join('public', asset)), `Exact asset ${asset}`); }
    eq(await page.locator('[data-lesson-ending="practice"] [data-lesson-exercise]').count(), 6, 'Independent practice');
    eq(await page.locator('[data-lesson-ending="practice"] details').count(), 12, 'Separate hints and solutions');
    const recovery = await context.newPage();
    const digitAsset = '**/learn-code/multimodal-tokenization/digits_reconstructions.json';
    await recovery.route(digitAsset, route => route.fulfill({ status: 503, contentType: 'text/plain', body: 'Controlled one-request failure' }));
    await recovery.goto(`${base}/learn/path/full-curriculum/${id}?module=large-language-models`, { waitUntil: 'domcontentloaded' });
    await recovery.locator('#mm-digit-reconstruction [role="alert"]').waitFor();
    ok(await recovery.getByRole('button', { name: 'Retry digit record', exact: true }).isVisible(), 'Failed data load exposes a recovery action');
    await recovery.locator('#mm-digit-reconstruction').screenshot({ path: `${output}/screenshots/digit-load-failure.png`, style: screenshotStyle });
    await recovery.unroute(digitAsset);
    await recovery.getByRole('button', { name: 'Retry digit record', exact: true }).click();
    await recovery.locator('#mm-digit-reconstruction .flow-readout').waitFor();
    ok((await recovery.locator('#mm-digit-reconstruction .flow-readout').innerText()).includes('305'), 'Retry restores the actual held-out data');
    records.dataRecovery = { controlledStatus: 503, recoveredSource: 305, screenshot: `${output}/screenshots/digit-load-failure.png` };
    await recovery.close();
    eq(errors, [], 'No rendered exceptions');
    for (const [source, digest] of Object.entries(hashes)) eq(hash(source), digest, `Source unchanged during browser check ${source}`);
    records.passed = true; records.checks = checks; records.browser = browser.version();
  } catch (error) {
    records.passed = false; records.checks = checks; records.failure = error.stack;
    await page.screenshot({ path: `${output}/failure.png`, fullPage: false }).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(receipt, JSON.stringify(records, null, 2) + '\n');
    await context.close(); await browser.close();
    console.log(JSON.stringify({ passed: records.passed, checks, receipt, failure: records.failure?.split('\n')[0] }));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
