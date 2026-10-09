const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const manuscript = 'src/learn/data/topics/linear-logistic-regression.jsx';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const readyPath = folder + '/reading-flow-ready.json';
const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
const original = ready.sourceHashes[manuscript];
const body = fs.readFileSync(manuscript, 'utf8');
const oldBody = body.replace(/^    <Prose opening="route">.*<\/Prose>\r?\n\r?\n/m, '')
  .replace(/\r?\n/g, '\r\n');
assert.notEqual(oldBody, body, 'one new route note must exist');
assert.equal(crypto.createHash('sha256').update(oldBody).digest('hex'), original,
  'removing the sole added note must recover the exact previously frozen manuscript');
const preserved = folder + '/before-first-pass-route/linear-logistic-regression.jsx';
fs.mkdirSync(folder + '/before-first-pass-route', { recursive: true });
if (fs.existsSync(preserved)) assert.equal(hash(preserved), original);
else fs.writeFileSync(preserved, oldBody);
const unchanged = Object.entries(ready.sourceHashes).filter(([file]) => file !== manuscript);
for (const [file, expected] of unchanged) assert.equal(hash(file), expected, file);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  const note = page.locator('.lesson-compass__note--route');
  await note.waitFor({ timeout: 120000 });
  assert.equal(await note.count(), 1);
  const text = await note.textContent();
  assert(text.includes('The explanations and code remain visible'));
  for (const title of ['Frame the prediction', 'Run an experiment that can survive a new row',
    'Diagnose assumptions and uncertainty', 'Practise with changed questions']) {
    assert(text.includes(title));
    assert((await page.locator('.linear-logistic-lesson').textContent()).includes(title));
  }
  const headings = await page.locator('.linear-logistic-lesson h2').allTextContents();
  assert.equal(headings.filter(title => /^\d+\./.test(title)).length, 14);
  assert.equal(await page.locator('.linear-logistic-lesson [data-lesson-exercise]').count(), 12);
  assert.equal(await page.locator('.linear-logistic-lesson .regression-flow-drawing').count(), 50);
  assert.equal(await page.locator('.linear-logistic-lesson .flow-lab').count(), 10);
  const output = folder + '/screenshots/first-pass-route-final';
  fs.mkdirSync(output, { recursive: true });
  const views = [];
  for (const [width, scale] of [[390, 1], [320, 1], [768, 2], [1366, 1]]) {
    const viewportHeight = scale === 2 ? 2000 : 1000;
    await page.setViewportSize({ width, height: viewportHeight });
    await page.evaluate(value => { document.documentElement.style.fontSize = 16 * value + 'px'; }, scale);
    await page.evaluate(() => document.fonts.ready);
    await note.scrollIntoViewIfNeeded();
    await note.evaluate(element => {
      window.scrollBy(0, element.getBoundingClientRect().top - 160);
    });
    const geometry = await note.evaluate(element => {
      const box = element.getBoundingClientRect();
      const firstSection = document.querySelector('.linear-logistic-lesson h2').getBoundingClientRect();
      return { x: box.x, right: box.right, width: box.width, height: box.height,
        fontSize: parseFloat(getComputedStyle(element.querySelector('p')).fontSize),
        beforeFirstSection: box.bottom <= firstSection.top };
    });
    assert(geometry.x >= -1 && geometry.right <= width + 1, 'route must fit the reader width');
    assert(geometry.beforeFirstSection, 'route must precede the first learner section');
    assert(geometry.fontSize >= 15.2 * scale - .01,
      'preserve the shared compass prose size and its native text scaling');
    const picture = output + '/route-' + width + '-text' + scale + '.png';
    await note.screenshot({ path: picture });
    views.push({ width, scale, viewportHeight, ...geometry, picture, pictureHash: hash(picture) });
  }
  assert.deepEqual(errors, []);
  const receipt = { at: new Date().toISOString(),
    scope: 'Author bounded opening-note production placement and wrapping. The 50 unchanged figures and ten labs retain their prior actual browser evidence; this does not repeat or replace independent review or parent integration.',
    sourceHashes: { [manuscript]: hash(manuscript), [__filename.replace(process.cwd() + '\\', '').replaceAll('\\', '/')]: hash(__filename) },
    priorReadyHash: hash(readyPath), preservedPriorManuscript: preserved,
    preservedPriorManuscriptHash: hash(preserved), unchangedSourceCount: unchanged.length,
    route: text.trim(), sectionCount: 14, practiceCount: 12, figureCount: 50, labCount: 10,
    views, errors };
  const receiptPath = folder + '/reading-flow-first-pass-route-browser-final.json';
  assert(!fs.existsSync(receiptPath), 'preserve prior semantic receipt');
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ views: views.length, unchangedSourceCount: unchanged.length, errors: errors.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
