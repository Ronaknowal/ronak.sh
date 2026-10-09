const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');

const root = 'docs/teaching/classical-ml-reading-flow/linear-logistic-regression';
const stage = process.argv[2] || new Date().toISOString().replace(/[:.]/g, '-');
const sources = [
  'src/learn/data/topics/linear-logistic-regression.jsx',
  'src/learn/components/lesson-labs/LinearLogisticDrawings.jsx',
  'src/learn/components/lesson-labs/LinearLogisticFlowLabs.jsx',
  'src/learn/components/lesson-labs/linear-logistic-flow.css',
  'src/learn/components/lesson-labs/RegressionGeometryDrawings.jsx',
  'src/learn/components/lesson-labs/RegressionInferenceDrawings.jsx',
  'src/learn/data/linear-logistic-flow-models.js',
];
const hashes = () => Object.fromEntries(sources.map(file => [file,
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const sourceHashes = hashes();
const figures = ['regression-information-boundary', 'regression-line-anatomy',
  'regression-residual-geometry', 'regression-design-product',
  'regression-binary-anatomy', 'regression-bernoulli-likelihood',
  'regression-parameter-contours', 'regression-split-roles', 'regression-held-out-circuit',
  'regression-logistic-curvature', 'regression-library-penalty', 'regression-one-design-row',
  'regression-action-costs', 'regression-real-data-split', 'regression-streaming-coefficients',
  'regression-growing-design', 'regression-curvature-work'];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:4841/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml');
  await page.locator('[data-figure="regression-line-anatomy"]').waitFor({ timeout: 120000 });
  assert((await page.locator('.linear-logistic-lesson').textContent()).includes('Centered distance'));
  const pictures = [];
  const annotations = [];
  for (const [width, fontScale] of [[390, 1], [768, 2]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(scale => document.documentElement.style.fontSize = `${16 * scale}px`, fontScale);
    for (const name of figures) {
      const figure = page.locator(`[data-figure="${name}"]`).first();
      await figure.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const actual = await figure.locator('svg text').evaluateAll(nodes => nodes.map(node => {
        const matrix = node.getScreenCTM();
        return { text: node.textContent, physicalFont: parseFloat(getComputedStyle(node).fontSize) * Math.hypot(matrix.a, matrix.b) };
      }));
      assert(actual.every(row => row.physicalFont >= 15.99), `${name}: compressed text`);
      annotations.push({ name, width, fontScale, minimum: Math.min(...actual.map(row => row.physicalFont)) });
      const path = `${root}/screenshots/${stage}/${name}-${width}-text${fontScale}.png`;
      fs.mkdirSync(`${root}/screenshots/${stage}`, { recursive: true });
      await figure.screenshot({ path });
      pictures.push(path);
    }
  }
  const labs = ['regression-residuals', 'regression-changed-evidence', 'regression-logistic-score', 'regression-logistic-loss'];
  const checks = [];
  for (const id of labs) {
    const lab = page.locator(`#${id}`);
    assert(await lab.locator('.flow-controls input,.flow-controls select').count() <= 3);
    const inputs = lab.locator('input');
    for (let i = 0; i < await inputs.count(); i++) {
      const slider = inputs.nth(i);
      await slider.scrollIntoViewIfNeeded();
      await slider.focus();
      await slider.press('Home');
      await slider.press('End');
      assert.equal(await slider.inputValue(), await slider.getAttribute('max'));
      assert(!/NaN|Infinity/.test(await lab.locator('.flow-readout').textContent()));
    }
    checks.push(`${id}: native keyboard bounds and finite readout`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(hashes(), sourceHashes);
  const receipt = { at: new Date().toISOString(), scope: 'Early foundations only; whole lesson and independent final review pending',
    sourceHashes, checks, annotations, pictures, errors };
  fs.writeFileSync(`${root}/reading-flow-prototype-${stage}.json`, `${JSON.stringify(receipt, null, 2)}\n`);
  await browser.close();
  console.log(JSON.stringify({ passed: checks.length, pictures: pictures.length, minimumFont: Math.min(...annotations.map(row => row.minimum)) }));
})().catch(error => { console.error(error); process.exitCode = 1; });
