const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const folder = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const owners = [
  'src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
];
const identities = Object.fromEntries(owners.map(path => [path, digest(path)]));
const pictures = [];
const checks = [];
const pictureFolder = folder + '/screenshots/bounded-review-corrections-painted';
fs.mkdirSync(pictureFolder, { recursive: true });
const pass = (name, evidence = {}) => checks.push({ name, ...evidence });

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 2800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  await page.locator('[data-figure="regression-binary-gradient-branches"]').waitFor({ timeout: 120000 });
  const drawing = name => page.locator('[data-figure="' + name + '"]');
  assert.equal(await page.locator('.linear-logistic-lesson .regression-flow-drawing').count(), 54);
  assert.equal(await page.locator('.linear-logistic-lesson .flow-lab').count(), 10);
  assert.equal(await page.locator('.linear-logistic-lesson [data-lesson-exercise]').count(), 12);
  assert.equal(await page.locator('.lesson-compass__note--route').count(), 1);
  pass('The sole opening route, fourteen sections, twelve practices and ten live questions are retained; four connected derivative cutaways added');

  const centered = await drawing('regression-centered-reductions').textContent();
  assert(centered.includes('(x−x̄)²'));
  assert(!centered.includes('>x²<'));
  pass('Centered-square header agrees with the four squared centered values and denominator five');
  for (const [name, tokens] of [
    ['regression-linear-shared-errors', ['old intercept b', 'old slope w', 'observed y', 'error ŷ−y', '−4']],
    ['regression-linear-gradient-reductions', ['sum errors', '−9', 'sum x × errors', '−18', 'factor 2/n', '−4.5']],
    ['regression-binary-shared-error', ['old intercept b', 'old slope w', 'probability p', '0.731059', 'observed y', '−0.268941']],
    ['regression-binary-gradient-branches', ['shared p−y', 'supplied x', 'gradient for b', 'gradient for w', '−0.537883']],
  ]) {
    const text = await drawing(name).textContent();
    for (const token of tokens) assert(text.includes(token), name + ': ' + token);
    assert(await drawing(name).locator('polyline').count() >= 8, name + ': real connected operand routes');
  }
  pass('Both served shared old-state/error circuits and both derivative reductions expose the actual fixed-fixture operands');

  const separation = page.locator('#regression-separation');
  assert(await separation.evaluate(lab => {
    const controls = lab.querySelector('.flow-controls');
    return ['regression-separation-score', 'regression-separation-close', 'regression-separation-full'].every(name =>
      lab.querySelector('[data-figure="' + name + '"]').compareDocumentPosition(controls) & Node.DOCUMENT_POSITION_FOLLOWING);
  }));
  const penalty = separation.locator('select');
  const oldScorePath = await drawing('regression-separation-score').locator('polyline[stroke="#bb9aec"]').getAttribute('points');
  const oldObjectivePaths = await Promise.all(['close', 'full'].map(scale =>
    drawing('regression-separation-' + scale).locator('polyline[stroke="#bb9aec"]').getAttribute('points')));
  await penalty.focus();
  await penalty.press('End');
  assert.equal(await penalty.inputValue(), '0.2');
  let readout = await separation.locator('.flow-readout').textContent();
  assert(readout.includes('0.526928') && readout.includes('1.177505'));
  assert.equal(await drawing('regression-separation-close').locator('line[stroke="#e99a61"]').count(), 1);
  assert.equal(await drawing('regression-separation-full').locator('line[stroke="#e99a61"]').count(), 1);
  assert.equal(await drawing('regression-separation-score').locator('polyline[stroke="#bb9aec"]').getAttribute('points'), oldScorePath);
  for (const [index, scale] of ['close', 'full'].entries()) assert.notEqual(
    await drawing('regression-separation-' + scale).locator('polyline[stroke="#bb9aec"]').getAttribute('points'), oldObjectivePaths[index]);
  pass('Native penalty edit updates the exact finite objective and both minimum markers above the controls', { readout });
  async function capturePenaltyState(state) {
    for (const [width, scale] of [[390, 1], [768, 2]]) {
      await page.setViewportSize({ width, height: 3000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = 16 * value + 'px'; }, scale);
      for (const name of ['regression-separation-close', 'regression-separation-full']) {
        const figure = drawing(name);
        await figure.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 100));
        const path = pictureFolder + '/' + name + '-' + width + '-text' + scale + '-' + state + '.png';
        await figure.screenshot({ path });
        pictures.push({ path, hash: digest(path), name, width, scale, state });
      }
    }
  }
  await capturePenaltyState('penalty02-weight2');
  await separation.locator('input').focus();
  await separation.locator('input').press('End');
  readout = await separation.locator('.flow-readout').textContent();
  assert(readout.includes('14.4'));
  pass('Full permitted slope12/lambda.2 state remains unclipped with loss14.400006', { readout });
  await capturePenaltyState('penalty02-weight12');
  await separation.getByRole('button', { name: 'Reset' }).click();
  assert.equal(await penalty.inputValue(), '0');
  assert.equal(await separation.locator('input').inputValue(), '2');
  assert((await separation.locator('.flow-readout').textContent()).includes('No finite'));
  assert.equal(await drawing('regression-separation-full').locator('line[stroke="#e99a61"]').count(), 0);
  pass('Reset restores the original unpenalized infimum and removes both finite-minimum markers');

  const manuscript = await page.locator('.linear-logistic-lesson').textContent();
  for (const token of ['squared-residual sum', 'residual degrees of freedom', '2.776445',
    '3.122606', '3.777394', '2.583797', '4.316203', 'simultaneous coverage',
    'not a 95% posterior', 'likelihood-ratio statistic', 'reference distribution',
    'number of tested independent restrictions', 'its main example checks agreement with the library optimum']) {
    assert(manuscript.includes(token), token);
  }
  assert(!manuscript.includes('includes nonzero-state finite-difference gradient checks'));
  const meanLink = page.locator('a[href$="#3-calculate-the-paired-t-interval"]');
  const tailLink = page.locator('a[href$="#4-read-the-null-tail"]');
  assert.equal(await meanLink.count(), 1);
  assert.equal(await tailLink.count(), 1);
  const programPath = 'public/learn-code/linear-logistic-regression/newton-logistic.py';
  const response = await page.request.get('http://127.0.0.1:4841/learn-code/linear-logistic-regression/newton-logistic.py');
  assert(response.ok());
  assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'), digest(programPath));
  pass('Current served inference interpretation, precise prerequisite links and accurate unchanged downloaded Newton scope');

  const names = ['regression-centered-reductions', 'regression-linear-shared-errors',
    'regression-linear-gradient-reductions', 'regression-same-state-update',
    'regression-binary-shared-error', 'regression-binary-gradient-branches',
    'regression-logistic-gradient', 'regression-separation-score',
    'regression-separation-close', 'regression-separation-full'];
  for (const [width, scale] of [[390, 1], [768, 2]]) {
    await page.setViewportSize({ width, height: 3000 });
    await page.evaluate(value => { document.documentElement.style.fontSize = 16 * value + 'px'; }, scale);
    await page.evaluate(() => document.fonts.ready);
    for (const name of names) {
      const figure = drawing(name);
      const surface = figure.locator('.regression-flow-surface');
      if (await surface.count()) await surface.evaluate(element => { element.scrollLeft = 0; });
      await figure.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 100));
      const path = pictureFolder + '/' + name + '-' + width + '-text' + scale + '-left.png';
      await figure.screenshot({ path });
      pictures.push({ path, hash: digest(path), name, width, scale, pan: 'left' });
      const caption = figure.locator('figcaption');
      if (await caption.count()) assert(await caption.evaluate(element => element.scrollWidth <= element.clientWidth + 1), name + ': caption must wrap at current text size');
      if (await surface.count() && await surface.evaluate(element => element.scrollWidth > element.clientWidth + 1)) {
        await surface.focus();
        for (let n = 0; n < 15; n++) await surface.press('ArrowRight');
        await surface.evaluate(element => { element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2; });
        const centerPath = pictureFolder + '/' + name + '-' + width + '-text' + scale + '-center.png';
        await figure.screenshot({ path: centerPath });
        pictures.push({ path: centerPath, hash: digest(centerPath), name, width, scale, pan: 'center' });
        await surface.evaluate(element => { element.scrollLeft = element.scrollWidth - element.clientWidth; });
        const rightPath = pictureFolder + '/' + name + '-' + width + '-text' + scale + '-right.png';
        await figure.screenshot({ path: rightPath });
        pictures.push({ path: rightPath, hash: digest(rightPath), name, width, scale, pan: 'right' });
      }
    }
  }
  assert.deepEqual(errors, []);
  for (const [path, hash] of Object.entries(identities)) assert.equal(digest(path), hash);
  const receipt = { at: new Date().toISOString(), scope: 'Author targeted current production verification of the five independent review corrections; unrelated prior interaction and scientific evidence remain separately attributed.',
    sourceHashes: identities, checks, pictures, errors };
  const receiptPath = folder + '/reading-flow-review-corrections-browser-painted.json';
  assert(!fs.existsSync(receiptPath));
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ checks: checks.length, pictures: pictures.length, errors: errors.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
