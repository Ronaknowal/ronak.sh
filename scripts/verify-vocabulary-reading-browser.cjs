const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4240';
const output = 'scratch/vocabulary-flow/final-paints';
const record = 'docs/teaching/tokenization/vocabulary-design-multilingual-tokenization/reading-flow-author-browser.json';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = ['src/learn/data/topics/vocabulary-multilingual.jsx', 'src/learn/components/lesson-labs/MultilingualVocabularyLabs.jsx', 'src/learn/components/lesson-labs/multilingual-vocabulary.css', 'src/learn/data/multilingual-vocabulary-models.js', 'scripts/verify-vocabulary-reading-browser.cjs', 'dist-tokenization-flow/.vite/manifest.json'];
const initialBindings = Object.fromEntries(sources.map(file => [file, hash(file)]));
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  const errors = [];
  const paints = [];
  const states = [];
  const layouts = [];
  page.on('pageerror', error => errors.push(error.message));
  const capture = async (locator, name) => {
    await locator.scrollIntoViewIfNeeded();
    const file = path.join(output, name + '.png');
    await locator.screenshot({ path: file, style: '.site-header,.site-skip {visibility:hidden!important}' });
    paints.push({ file, sha256: hash(file) });
  };
  try {
    await page.goto(base + '/learn/path/full-curriculum/vocabulary-design-multilingual-tokenization?module=large-language-models', { waitUntil: 'domcontentloaded' });
    await page.locator('.vocabulary-lesson').waitFor();
    assert(await page.getByText('μ₀, μ₁, μ₂ are the old rows', { exact: false }).count(), 'Fresh symbolic mean row absent');
    assert(await page.getByText('Current', { exact: false }).count());
    const figures = page.locator('.vocabulary-lesson [data-figure]');
    const labs = page.locator('.vocabulary-lesson [data-lab]');
    assert.equal(await figures.count(), 17);
    assert.equal(await labs.count(), 5);
    for (const [width, enlarged, suffix] of [[1366, false, 'desktop'], [390, false, 'phone'], [320, false, 'small'], [768, true, 'enlarged']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(enlarged => document.documentElement.style.fontSize = enlarged ? '200%' : '', enlarged);
      await page.waitForTimeout(50);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 1, `${suffix}: page overflow ${overflow}`);
      for (let i = 0; i < await figures.count(); i++) {
        const figure = figures.nth(i);
        const identity = await figure.getAttribute('data-figure');
        const style = await figure.evaluate(element => {
          const computed = getComputedStyle(element);
          return { border: computed.borderWidth, background: computed.backgroundColor, localHeadings: element.querySelectorAll('h2,h3,h4,figcaption').length };
        });
        assert.equal(style.border, '0px');
        assert.equal(style.background, 'rgba(0, 0, 0, 0)');
        assert.equal(style.localHeadings, 0);
        await capture(figure, identity + '-' + suffix);
      }
      for (let i = 0; i < await labs.count(); i++) await capture(labs.nth(i), (await labs.nth(i).getAttribute('data-lab')) + '-' + suffix);
      layouts.push({ width, enlarged, overflow, figures: 17, labs: 5 });
    }
    await page.setViewportSize({ width: 1366, height: 1000 });
    await page.evaluate(() => document.documentElement.style.fontSize = '');
    const alphaLab = page.locator('#vocabulary-mixture');
    const alphaInput = alphaLab.locator('input[type=range]');
    await alphaInput.focus();
    await alphaInput.press('End');
    assert.equal(await alphaInput.inputValue(), '1');
    await capture(alphaLab, 'alpha-null-one');
    await alphaInput.press('Home');
    for (let i = 0; i < 17; i++) await alphaInput.press('ArrowRight');
    assert.equal(await alphaInput.inputValue(), '0.17');
    await capture(alphaLab, 'alpha-interior-point17');
    states.push({ alpha: .17, result: await alphaLab.locator('.flow-readout').innerText() });
    await alphaLab.getByRole('button', { name: 'Reset α' }).click();
    assert.equal(await alphaInput.inputValue(), '0.5');

    const massLab = page.locator('#vocabulary-masses');
    const masses = massLab.locator('input[type=range]');
    for (let i = 0; i < 3; i++) { await masses.nth(i).focus(); await masses.nth(i).press('Home'); }
    assert.match(await massLab.innerText(), /No collection has positive weight/);
    await capture(massLab, 'masses-all-zero');
    await masses.nth(1).press('End');
    assert.match(await massLab.innerText(), /Cannot encode/);
    await capture(massLab, 'masses-hindi-only');
    await massLab.getByRole('button', { name: 'Reset masses' }).click();
    assert.deepEqual(await masses.evaluateAll(inputs => inputs.map(input => Number(input.value))), [80, 15, 5]);
    states.push({ zeroMass: 'undefined', hindiOnly: 'missing other alphabets', resetMasses: [80, 15, 5] });

    const joinsLab = page.locator('#vocabulary-joins');
    const joins = joinsLab.locator('input[type=range]');
    await joins.focus();
    await joins.press('Home');
    assert.match(await joinsLab.locator('.flow-readout').innerText(), /0 joins learned/);
    await capture(joinsLab, 'joins-zero');
    await joins.press('End');
    await capture(joinsLab, 'joins-maximum');
    states.push({ maximumAllowedJoins: 16, result: await joinsLab.locator('.flow-readout').innerText() });
    await joinsLab.getByRole('button', { name: 'Reset joins' }).click();

    const storage = page.locator('#vocabulary-storage');
    const checkbox = storage.locator('input[type=checkbox]');
    await checkbox.press('Space');
    assert.match(await storage.locator('.flow-readout').innerText(), /2000 MiB/);
    await capture(storage, 'storage-untied');
    await storage.getByRole('button', { name: 'Reset storage' }).click();
    assert.match(await storage.locator('.flow-readout').innerText(), /1000 MiB/);

    const work = page.locator('#vocabulary-budget');
    const ranges = work.locator('input[type=range]');
    await ranges.nth(0).focus();
    await ranges.nth(0).press('Home');
    for (let i = 0; i < 32; i++) await ranges.nth(0).press('ArrowRight');
    await ranges.nth(1).focus();
    await ranges.nth(1).press('Home');
    // Native keyboard reaches the exact500 token value without programmatic events.
    for (let i = 0; i < 499; i++) await ranges.nth(1).press('ArrowRight');
    assert.equal(await ranges.nth(0).inputValue(), '64000');
    assert.equal(await ranges.nth(1).inputValue(), '500');
    assert.match(await work.innerText(), /Head work \/ baseline:\s*1×/);
    assert.match(await work.innerText(), /pairs \/ baseline:\s*0.25×/);
    await capture(work, 'equal-head-quarter-pairs');
    states.push({ V: 64000, T: 500, headRatio: 1, pairsRatio: .25 });
    assert.deepEqual(errors, []);
    assert.deepEqual(Object.fromEntries(sources.map(file => [file, hash(file)])), initialBindings, 'Source changed while checking');
    fs.writeFileSync(record, JSON.stringify({ checkedAt: new Date().toISOString(), kind: 'author-only fresh production browser; paints require personal inspection', base, sources: initialBindings, layouts, states, paints, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ status: 'passed', layouts: layouts.length, states: states.length, paints: paints.length, record }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
