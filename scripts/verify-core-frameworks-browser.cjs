const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4203';
const topics = (process.env.LESSON_TOPICS || 'pytorch,jax,tensorflow-keras,experiment-tracking-tools-weights-biases-mlflow-neptune,training-acceleration,llm-fine-tuning-platforms,data-processing-loading,data-annotation-labeling,nlp-libraries,computer-vision-libraries').split(',');
const output = process.env.LESSON_BROWSER_OUTPUT || 'scratch/core-frameworks/browser';
const viewportWidths = (process.env.LESSON_WIDTHS || '768,390,320').split(',').map(Number);
const captureStyle = '.site-header, .site-skip { visibility: hidden !important; }';
fs.mkdirSync(output, { recursive: true });

async function captureInlineFigures(page, id, suffix) {
  // Labs are captured separately. Nested figure wrappers should not create
  // redundant images; an authored data-figure can also identify an HTML visual.
  const figures = page.locator('.reader-article figure, .reader-article [data-figure]').filter({
    visible: true,
  });
  const captured = [];
  for (let index = 0; index < await figures.count(); index++) {
    const figure = figures.nth(index);
    const isIndependent = await figure.evaluate(element => !element.closest('[data-lab]') &&
      !element.parentElement.closest('figure, [data-figure]'));
    if (!isIndependent) continue;
    const name = await figure.getAttribute('data-figure') || `figure-${index}`;
    await figure.scrollIntoViewIfNeeded();
    await figure.screenshot({ path: path.join(output, `${id}-figure-${index}-${suffix}.png`), style: captureStyle });
    captured.push({ name, index });
  }
  return captured;
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const results = [];
  try {
    for (const id of topics) {
      const page = await context.newPage(), errors = [], failures = [];
      try {
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) failures.push(`${response.status()} ${response.url()}`); });
      await page.goto(`${base}/learn/path/full-curriculum/${id}?module=core-frameworks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.locator('.reader-article h2').first().waitFor();
      const labs = page.locator('[data-lab]');
      const labCount = await labs.count();
      const headings = await page.locator('.reader-article h2').allTextContents();
      assert.equal(await page.locator('.lesson-compass').count(), 1, `${id}: shared opening count`);
      const sectionLinks = await page.locator('.lesson-compass__sections a').evaluateAll(links => links.map(link => ({
        href: link.getAttribute('href'), text: link.innerText,
        targetCount: document.querySelectorAll(`[id="${CSS.escape(link.hash.slice(1))}"]`).length,
      })));
      assert.ok(sectionLinks.length > 0, `${id}: missing section links`);
      assert.ok(sectionLinks.every(link => link.targetCount === 1), `${id}: missing/duplicated section targets`);
      assert.equal(new Set(sectionLinks.map(link => link.href)).size, sectionLinks.length, `${id}: duplicated section links`);
      const labResults = [];
      await page.screenshot({ path: path.join(output, `${id}-opening.png`) });
      const inlineFigures = await captureInlineFigures(page, id, 'desktop');
      for (let index = 0; index < labCount; index++) {
        const lab = labs.nth(index), name = await lab.getAttribute('data-lab');
        await lab.scrollIntoViewIfNeeded();
        const initial = await lab.innerText();
        const range = lab.locator('input[type=range]').first();
        const select = lab.locator('select').first();
        let changed = false;
        if (await range.count()) {
          await range.focus();
          await range.press('End');
          await page.waitForTimeout(50);
          changed = await lab.innerText() !== initial;
          if (!changed) { await range.press('Home'); changed = await lab.innerText() !== initial; }
          assert.ok(changed, `${id}/${name}: keyboard range has no visible consequence`);
        } else if (await select.count()) {
          const values = await select.locator('option').evaluateAll(options => options.map(option => option.value));
          const current = await select.inputValue();
          const alternative = values.find(value => value !== current);
          if (alternative) { await select.selectOption(alternative); changed = await lab.innerText() !== initial; }
          assert.ok(changed, `${id}/${name}: select has no visible consequence`);
        }
        const ranges = lab.locator('input[type=range]');
        const rangeChecks = [];
        for (let control = 0; control < await ranges.count(); control++) {
          const input = ranges.nth(control);
          await input.focus();
          await input.press('End');
          const end = await input.inputValue();
          await input.press('Home');
          const start = await input.inputValue();
          await input.press('ArrowRight');
          const interior = await input.inputValue();
          assert.notEqual(end, start, `${id}/${name}: range has no reachable interval`);
          rangeChecks.push({ start, interior, end });
        }
        let pointerValue = null;
        if (await ranges.count()) {
          const input = ranges.first();
          await input.scrollIntoViewIfNeeded();
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const box = await input.boundingBox();
          const before = await input.inputValue();
          await input.click({ position: { x: box.width * 0.75, y: box.height / 2 } });
          pointerValue = await input.inputValue();
          assert.notEqual(pointerValue, before, `${id}/${name}: pointer range gesture has no effect`);
        }
        const selects = lab.locator('select');
        for (let control = 0; control < await selects.count(); control++) {
          const values = await selects.nth(control).locator('option').evaluateAll(options => options.filter(option => !option.disabled).map(option => option.value));
          for (const value of values) await selects.nth(control).selectOption(value);
        }
        const numeric = lab.locator('input[type=number]').first();
        if (await numeric.count()) { await numeric.fill(''); await numeric.blur(); }
        // Count/index controls must not pass fractional values into an array model.
        // A slider's step alone is not an integer-domain contract: measured
        // bandwidth and launch cost legitimately accept fractional values.
        const unitStepNumbers = lab.locator('input[type=number][step="1"]');
        const discreteNumbers = [];
        for (let control = 0; control < await unitStepNumbers.count(); control++) {
          const input = unitStepNumbers.nth(control);
          const label = await input.evaluate(element => element.labels?.[0]?.textContent || '');
          if (!['Host link (decimal GB/s)', 'Cost per launch (microseconds)'].includes(label)) discreteNumbers.push(input);
        }
        for (const input of discreteNumbers) {
          const previous = await input.inputValue();
          const fractional = Number(await input.getAttribute('min')) + 0.5;
          await input.fill(String(fractional));
          assert.equal(await input.getAttribute('aria-invalid'), 'true', `${id}/${name}: fractional count was accepted`);
          await input.blur();
          assert.equal(await input.inputValue(), previous, `${id}/${name}: invalid count changed model state`);
        }
        const textarea = lab.locator('textarea').first();
        if (await textarea.count()) await textarea.fill('Mira moved to New York. 🧪');
        const toggles = lab.locator('input[type=checkbox]');
        for (let control = 0; control < await toggles.count(); control++) {
          await toggles.nth(control).press('Space');
        }
        await lab.screenshot({ path: path.join(output, `${id}-${index}-changed.png`), style: captureStyle });
        const buttons = lab.getByRole('button', { name: /reset/i });
        if (await buttons.count()) await buttons.first().click();
        await lab.screenshot({ path: path.join(output, `${id}-${index}-desktop.png`), style: captureStyle });
        const background = await lab.evaluate(element => getComputedStyle(element).backgroundColor);
        const channels = background.match(/\d+/g)?.map(Number);
        if (channels?.length >= 3) assert.ok(Math.abs(channels[0] - channels[1]) <= 3 && Math.abs(channels[1] - channels[2]) <= 3, `${id}/${name}: non-neutral lab background ${background}`);
        labResults.push({ name, changedControl: changed, rangeControls: await ranges.count(), rangeChecks, pointerValue, discreteInputChecks: discreteNumbers.length, selectControls: await selects.count(), checkboxControls: await toggles.count(), resetAvailable: !!await buttons.count(), background });
      }
      // Load every program before checking shared code actions and download payloads.
      const programs = page.locator('.lesson-code-source');
      for (let index = 0; index < await programs.count(); index++) {
        await programs.nth(index).scrollIntoViewIfNeeded();
        await programs.nth(index).locator('.lesson-code').waitFor();
      }
      const copy = page.getByRole('button', { name: /^copy/i }).first();
      if (await copy.count()) {
        await copy.click();
        await page.waitForFunction(element => /copied/i.test(element.textContent), await copy.elementHandle());
        assert.match(await copy.innerText(), /copied/i);
        assert.ok((await page.evaluate(() => navigator.clipboard.readText())).length > 5);
      }
      const localLinks = await page.locator('.reader-article a[href^="/learn-code/"], .reader-article a[href^="/learn-assets/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))]);
      for (const href of localLinks) {
        const response = await context.request.get(base + href);
        assert.ok(response.ok(), `${id}: ${href} not served`);
        assert.ok(!/text\/html/.test(response.headers()['content-type'] || ''), `${id}: ${href} silently returned app HTML`);
        const localPath = path.join('public', decodeURIComponent(href.split(/[?#]/)[0]));
        assert.deepEqual(await response.body(), fs.readFileSync(localPath), `${id}: ${href} differs from canonical file`);
      }
      const widths = [];
      for (const width of viewportWidths) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(60);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 1, `${id}: ${width}px page overflow ${overflow}`);
        for (let index = 0; index < labCount; index++) {
          await labs.nth(index).scrollIntoViewIfNeeded();
          await labs.nth(index).screenshot({ path: path.join(output, `${id}-${index}-${width}.png`), style: captureStyle });
        }
        const figures = await captureInlineFigures(page, id, String(width));
        widths.push({ width, overflow, inlineFigures: figures.length });
      }
      assert.deepEqual(errors, [], `${id}: render errors`);
      assert.deepEqual(failures, [], `${id}: failed runtime assets`);
      results.push({ id, headings, sectionLinks, inlineFigures, labs: labResults, codeSources: await programs.count(), localDownloads: localLinks.length, widths, errors });
      console.log(`${id}: ${labCount} labs, native code access and narrow layouts passed`);
      } catch (error) {
        results.push({ id, failure: error.message });
        console.error(`${id}: ${error.message}`);
        process.exitCode = 1;
      } finally {
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, results }, null, 2) + '\n');
        await page.close();
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
