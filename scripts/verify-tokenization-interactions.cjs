const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4205';
const output = process.env.LESSON_BROWSER_OUTPUT || 'scratch/tokenization/interactions';
fs.mkdirSync(output, { recursive: true });
const ids = [
  'byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram',
  'byte-level-tokenization-token-free-models',
  'vocabulary-design-multilingual-tokenization',
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  const errors = [], results = [];
  page.on('pageerror', error => errors.push(error.message));
  const lab = name => page.locator(`[data-lab="${name}"]`);
  const number = async (owner, name, value) => {
    await owner.getByRole('spinbutton', { name, exact: true }).fill(String(value));
  };
  const contains = async (owner, expected) => assert.match(await owner.innerText(), expected);
  const capture = async (owner, name) => {
    await owner.scrollIntoViewIfNeeded();
    await owner.screenshot({ path: path.join(output, name + '.png'), style: '.site-header,.site-skip{visibility:hidden!important}' });
  };
  const open = async id => {
    await page.goto(`${base}/learn/path/full-curriculum/${id}?module=large-language-models`);
    await page.locator('[data-lab]').first().waitFor();
  };
  try {
    await open(ids[0]);
    const bpe = lab('bpe-merge-trainer');
    await bpe.getByRole('button', { name: 'Explore overlapping pairs' }).click();
    await number(bpe, 'Completed merges', 1);
    await contains(bpe, /selected pair count 6, actual replacements 4/);
    await capture(bpe, 'bpe-overlap');
    await bpe.getByLabel('Training corpus', { exact: true }).fill('');
    await contains(bpe, /corpus is empty/);
    await bpe.getByRole('button', { name: 'Reset corpus and query' }).click();
    await number(bpe, 'Completed merges', 10);
    await bpe.getByLabel('Encode a new word', { exact: true }).fill('LOWEST');
    await contains(bpe, /Unseen characters/);
    const wp = lab('wordpiece-greedy-path');
    await wp.getByRole('button', { name: 'Remove ##c' }).click();
    await contains(wp, /entire word becomes \[UNK\]/);
    await contains(wp, /a \| ##bc/);
    await capture(wp, 'wordpiece-greedy-failure');
    await wp.getByRole('button', { name: 'Reset word and vocabulary' }).click();
    await contains(wp, /Every chosen piece reaches a valid next position/);
    const uni = lab('unigram-segmentation-lattice');
    await number(uni, 'Whole-piece probability (%)', 17);
    await contains(uni, /Best segmentation: a \| b/);
    await number(uni, 'Whole-piece probability (%)', 18);
    await contains(uni, /Best segmentation: ab/);
    await uni.getByRole('checkbox').uncheck();
    await contains(uni, /Only the split path remains/);
    await capture(uni, 'unigram-whole-piece-removed');
    results.push({ id: ids[0], checks: ['Overlapping count6 vs replacements4', 'Empty corpus and unseen query', 'Greedy failure despite alternative complete path', 'Best-path switch17→18 percent', 'Vocabulary removal'] });

    await open(ids[1]);
    const unicode = lab('unicode-byte-units');
    await unicode.getByRole('button', { name: 'Scientist emoji' }).click();
    await contains(unicode, /1 grapheme clusters · 3 scalars · 11 bytes · 5 UTF-16 code units/);
    await capture(unicode, 'unicode-scientist');
    await unicode.getByRole('button', { name: 'Ligature ﬁ' }).click();
    await unicode.getByRole('combobox').selectOption('NFKC');
    await contains(unicode, /2 scalars · 2 bytes/);
    await unicode.getByRole('textbox', { name: /^Text to inspect/ }).fill('');
    await contains(unicode, /0 scalars · 0 bytes/);
    const stream = lab('streaming-byte-decoder');
    await number(stream, 'Split after this many bytes', 8);
    await contains(stream, /instead of replacing its parts/);
    await capture(stream, 'streaming-inside-emoji');
    await number(stream, 'Split after this many bytes', 6);
    await contains(stream, /Same visible result at this boundary/);
    await stream.getByRole('checkbox').check();
    await contains(stream, /Final flush rejected an incomplete scalar/);
    await capture(stream, 'streaming-truncated');
    const patch = lab('byte-entropy-patches');
    await contains(patch, /Patch lengths: \[3, 3, 2\]/);
    await number(patch, 'First possible byte probability', 0.5);
    await contains(patch, /Patch lengths: \[3, 1, 2, 2\]/);
    await capture(patch, 'entropy-splits-patch');
    await patch.getByRole('button', { name: 'One global patch' }).click();
    await contains(patch, /Patch lengths: \[8\]/);
    await contains(patch, /1 allowed global pairs/);
    await capture(patch, 'entropy-one-patch');
    results.push({ id: ids[1], checks: ['Emoji scalar/grapheme/byte units', 'Compatibility normalization and empty input', 'Internal scalar vs valid chunk boundary', 'Strict truncated final flush', 'Probability change splits exact patch', 'Strict entropy equality leaves one patch'] });

    await open(ids[2]);
    const mixture = lab('vocabulary-mixture');
    for (const name of ['English starting weight', 'Hindi starting weight', 'Chinese starting weight']) await number(mixture, name, 0);
    await contains(mixture, /no training text with positive weight/);
    await capture(mixture, 'mixture-zero-mass');
    await number(mixture, 'Hindi starting weight', 15);
    await contains(mixture, /Hindi strings: 100/);
    await contains(mixture, /Cannot encode: this training set did not include all these characters/);
    await capture(mixture, 'mixture-excluded-alphabets');
    await mixture.getByRole('button', { name: 'Reset mixture' }).click();
    await number(mixture, 'How many BPE joins may be learned?', 0);
    await contains(mixture, /Zero joins: keep the characters and end marker separate/);
    const budget = lab('vocabulary-budget');
    await number(budget, 'Candidate dictionary size V', 64000);
    await number(budget, 'Same text: candidate token count N', 500);
    const rows = await budget.locator('tr').allTextContents();
    assert.ok(rows.some(row => /Candidate \/ baseline output-head work/.test(row) && /1×/.test(row)));
    assert.ok(rows.some(row => /Candidate \/ baseline full-attention pairs/.test(row) && /0.25×/.test(row)));
    await budget.getByRole('checkbox').uncheck();
    await contains(budget, /Store one input table and a separate output table/);
    await capture(budget, 'budget-equal-head-quarter-pairs');
    const dimensions = budget.getByRole('spinbutton', { name: 'Numbers in each row d', exact: true });
    await dimensions.fill('256.5');
    assert.equal(await dimensions.getAttribute('aria-invalid'), 'true');
    await dimensions.blur();
    assert.equal(await dimensions.inputValue(), '4096');
    results.push({ id: ids[2], checks: ['Zero total mass', 'Excluded language alphabet', 'Zero merges', 'Equal head work and quarter attention pairs', 'Tied/untied tables', 'Integer dimensional input recovery'] });

    for (const id of ids) {
      await open(id);
      await page.setViewportSize({ width: 768, height: 900 });
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, `${id}: text zoom overflow`);
      await capture(page.locator('[data-lab]').first(), `${id}-text-zoom`);
      await page.setViewportSize({ width: 1366, height: 1000 });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, results, textZoom: '200% root font at 768 CSS pixels', errors }, null, 2) + '\n');
    console.log('PASS: all eight labs, changed mechanisms/null cases, integer recovery and 200% root-font layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
