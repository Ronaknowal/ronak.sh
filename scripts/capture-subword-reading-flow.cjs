const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { inspectLessonVisualLayout } = require('./lib/lesson-visual-layout.cjs');

const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4211';
const output = 'docs/teaching/tokenization/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/reading-flow-evidence';
const sourceFiles = ['src/learn/data/topics/tokenization.jsx', 'src/learn/components/lesson-labs/SubwordStructureFigures.jsx', 'src/learn/components/lesson-labs/SubwordTokenizationLabs.jsx', 'src/learn/components/lesson-labs/subword-structure-figures.css', 'src/learn/components/lesson-labs/subword-tokenization-lessons.css'];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifestPath = 'dist-tokenization-flow/.vite/manifest.json';
const manifestSha256 = hash(manifestPath);

(async () => {
  fs.mkdirSync(`${output}/screenshots`, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  const errors = [], states = [], captures = [], layouts = [], typeSizes = [];
  page.on('pageerror', error => errors.push(error.message));
  async function capture(selector, name) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    const file = `${output}/screenshots/${name}.png`;
    await element.screenshot({ path: file, style: '.site-header, .site-skip { visibility: hidden !important; }' });
    captures.push({ name, selector, path: file });
  }
  try {
    await page.goto(`${base}/learn/path/full-curriculum/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram?module=large-language-models`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: '1. Turn a new spelling into model input', exact: true }).waitFor();
    assert.equal(await page.locator('.lesson-flow.subword-lesson').count(), 1, 'Current source sentinel missing');
    const bpe = page.locator('[data-lab="bpe-merge-trainer"]');
    const wp = page.locator('[data-lab="wordpiece-greedy-path"]');
    const unigram = page.locator('[data-lab="unigram-segmentation-lattice"]');
    assert.equal(await bpe.locator('input[type=range]').count(), 1);
    assert.equal(await bpe.locator('input[type=number]').count(), 0);
    await bpe.getByRole('slider', { name: 'Completed merges' }).fill('5');
    assert.match(await bpe.innerText(), /low.*est<\/w>/s);
    await capture('[data-lab="bpe-merge-trainer"]', 'bpe-five-merges-desktop');
    await bpe.getByRole('button', { name: 'Explore overlapping pairs' }).click();
    await bpe.getByRole('slider', { name: 'Completed merges' }).fill('1');
    assert.match(await bpe.innerText(), /selected pair count 6, actual replacements 4/);
    await capture('[data-lab="bpe-merge-trainer"]', 'bpe-overlap-desktop');
    states.push('Weighted overlap aaaa×2: count6, replacements4');
    await bpe.getByRole('textbox', { name: 'Training corpus', exact: true }).fill('');
    assert.match(await bpe.innerText(), /corpus is empty/);
    await capture('[data-lab="bpe-merge-trainer"]', 'bpe-empty-desktop');
    await bpe.getByRole('button', { name: 'Reset corpus and query' }).click();
    await bpe.getByRole('textbox', { name: 'Encode a new word', exact: true }).fill('LOWEST');
    assert.match(await bpe.innerText(), /Unseen characters/);
    await capture('[data-lab="bpe-merge-trainer"]', 'bpe-unseen-desktop');
    await bpe.getByRole('button', { name: 'Reset corpus and query' }).click();
    states.push('Empty corpus, unseen query, reset restores zero merges/corpus/query');
    await wp.getByRole('button', { name: 'Remove ##c' }).click();
    assert.match(await wp.innerText(), /whole word|entire word/);
    assert.match(await wp.innerText(), /a \| ##bc/);
    await capture('[data-lab="wordpiece-greedy-path"]', 'wordpiece-greedy-failure-desktop');
    await wp.getByRole('textbox', { name: 'Vocabulary pieces (comma separated)', exact: true }).fill('##');
    assert.equal(await wp.locator('[role=alert]').count(), 1);
    await wp.getByRole('button', { name: 'Reset word and vocabulary' }).click();
    assert.equal(await wp.getByRole('textbox', { name: 'Word to encode', exact: true }).inputValue(), 'abc');
    states.push('WordPiece greedy failure despite valid alternative, invalid draft, reset');
    const probability = unigram.getByRole('slider', { name: 'Whole-piece probability (%)' });
    await probability.fill('10');
    assert.match(await unigram.innerText(), /Best segmentation: a \| b/);
    await capture('[data-lab="unigram-segmentation-lattice"]', 'unigram-split-wins-desktop');
    await unigram.getByLabel('Include ab in the vocabulary').uncheck();
    assert.match(await unigram.innerText(), /Total path weight 0.25/);
    await capture('[data-lab="unigram-segmentation-lattice"]', 'unigram-no-whole-desktop');
    await unigram.getByRole('button', { name: 'Reset probabilities and vocabulary' }).click();
    await probability.focus(); await probability.press('Home'); assert.equal(await probability.inputValue(), '1');
    await probability.press('End'); assert.equal(await probability.inputValue(), '99');
    await unigram.getByRole('button', { name: 'Reset probabilities and vocabulary' }).click();
    states.push('Unigram10% split wins, no-whole normalized mass.25, keyboard endpoints and reset60%');
    for (const [width, zoom] of [[1366, false], [768, false], [390, false], [320, false], [768, true]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(enlarged => { document.documentElement.style.fontSize = enlarged ? '200%' : ''; }, zoom);
      const suffix = `${width}${zoom ? '-text200' : ''}`;
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${suffix}: page overflow ${overflow}`);
      const literalSizes = await page.evaluate(() => {
        const selectors = ['.subword-spans > span', '.subword-credit-calculation', '.subword-matrix td', '.subword-matrix caption', '.subword-pair-grid > span', '.subword-compatibility-rows code', '.subword-rank-frame > span', '.subword-dictionary caption'];
        return { root: parseFloat(getComputedStyle(document.documentElement).fontSize), elements: selectors.flatMap(selector => Array.from(document.querySelectorAll(selector), element => ({ selector, fontSize: parseFloat(getComputedStyle(element).fontSize), text: element.textContent.slice(0, 70) }))) };
      });
      for (const element of literalSizes.elements) assert.ok(element.fontSize >= literalSizes.root * .875 - .01, `${suffix}: ${element.selector} is ${element.fontSize}px`);
      typeSizes.push({ width, zoom, ...literalSizes });
      const figures = page.locator('.reader-article figure[data-figure]');
      const names = await figures.evaluateAll(elements => elements.map(element => element.dataset.figure));
      for (const name of names) await capture(`figure[data-figure="${name}"]`, `${name}-${suffix}`);
      const triage = await page.evaluate(inspectLessonVisualLayout);
      layouts.push({ width, zoom, overflow, triage });
    }
    assert.deepEqual(errors, []);
    assert.equal(hash(manifestPath), manifestSha256, 'Preview manifest changed during capture');
    fs.writeFileSync(`${output}/browser.json`, JSON.stringify({ status: 'passed', type: 'author-only browser checks', previewKind: process.env.SUBWORD_PREVIEW_KIND || 'current Vite development source', base, build: { manifestPath, manifestSha256 }, sourceSha256: Object.fromEntries(sourceFiles.map(file => [file, hash(file)])), states, layouts, typeSizes, captures, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ status: 'passed', states: states.length, captures: captures.length, output: `${output}/browser.json` }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
