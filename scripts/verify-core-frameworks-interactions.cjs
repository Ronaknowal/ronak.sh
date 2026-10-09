const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEARNING_BASE_URL || 'http://127.0.0.1:4203';
const output = process.env.LESSON_BROWSER_OUTPUT || 'scratch/core-frameworks/interactions';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  const checks = [];
  const setNumber = async (lab, name, value) => lab.getByRole('spinbutton', { name, exact: true }).fill(String(value));
  const open = async id => {
    await page.goto(`${base}/learn/path/full-curriculum/${id}?module=core-frameworks`);
    await page.locator('[data-lab]').first().waitFor();
  };
  const capture = async (lab, name) => {
    await lab.screenshot({ path: path.join(output, `${name}.png`), style: '.site-header, .site-skip {visibility:hidden!important}' });
  };
  try {
    await open('visualization');
    let lab = page.locator('[data-lab="visual-scales"]');
    await setNumber(lab, 'Movable observation', 1);
    assert.match(await lab.innerText(), /At an endpoint/);
    await capture(lab, 'visualization-scale-endpoint');
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.addStyleTag({ content: 'html {font-size:200%!important}' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await capture(lab, 'visualization-scale-text-zoom');
    checks.push('Visualization endpoint and doubled root text size: live output, readable geometry and no page overflow');
    await page.setViewportSize({ width: 1366, height: 1000 });

    await open('vector-databases');
    lab = page.locator('[data-lab="vector-metric-filter"]');
    assert.match(await lab.innerText(), /F → A/);
    await setNumber(lab, 'Query x', 0);
    await setNumber(lab, 'Query y', 0);
    assert.match(await lab.innerText(), /Undefined cosine: zero query/);
    await capture(lab, 'vector-zero-query');
    lab = page.locator('[data-lab="vector-coarse-candidates"]');
    assert.match(await lab.innerText(), /A true neighbor is outside/);
    await setNumber(lab, 'Lists probed', 2);
    assert.match(await lab.innerText(), /All exact top-2 IDs are present/);
    await capture(lab, 'vector-recovered-neighbor');
    checks.push('Vector cosine zero direction is undefined; a second candidate list recovers the missing true neighbor');

    await open('llm-serving-frameworks-vllm-tgi-sglang-tensorrt-llm');
    lab = page.locator('[data-lab="serving-cache-pages"]');
    await setNumber(lab, 'B cached positions', 5);
    await setNumber(lab, 'Assumed identical prefix', 4);
    assert.match(await lab.innerText(), /Shared complete pages: 1/);
    assert.equal(await lab.getByText('Logical 0 → P0', { exact: true }).count(), 2);
    assert.match(await lab.innerText(), /3 physical pages · 12 slots · 6 unique populated positions · 6 unused slots/);
    await capture(lab, 'serving-shared-prefix');
    lab = page.locator('[data-lab="serving-scheduler"]');
    const resultRows = lab.getByRole('table', { name: 'Results relative to declared arrivals' }).locator('tbody tr');
    assert.deepEqual(await resultRows.nth(1).locator('th,td').allTextContents(), ['B', '2', '3', '1']);
    await lab.getByRole('combobox', { name: /^Admission policy/ }).selectOption('fixed');
    assert.deepEqual(await resultRows.nth(1).locator('th,td').allTextContents(), ['B', '5', '6', '4']);
    checks.push('Serving prefix maps share the same physical page; fixed admission changes B first-token wait from 1 to 4 under the same inputs');

    await open('llm-application-frameworks-langchain-llamaindex-haystack');
    lab = page.locator('[data-lab="evidence-retrieval"]');
    await lab.getByRole('button', { name: 'Dictionary + key', exact: true }).click();
    assert.match(await lab.innerText(), /Top matching passage: dictionary/);
    await lab.getByRole('textbox', { name: 'Question words', exact: true }).fill('');
    assert.match(await lab.innerText(), /No matching passage/);
    assert.match(await lab.innerText(), /Query terms: none/);
    await capture(lab, 'application-empty-query');
    lab = page.locator('[data-lab="context-packing"]');
    await setNumber(lab, 'Total word-unit capacity', 20);
    assert.match(await lab.innerText(), /Infeasible: reservations exceed/);
    assert.equal(await lab.getByRole('figure', { name: 'Shared scale context allocation' }).count(), 0);
    await capture(lab, 'application-infeasible-budget');
    checks.push('Application query preset and empty typed query update evidence; over-reserved context is explicitly infeasible');

    await open('gpu-accelerated-computing');
    lab = page.locator('[data-lab="gpu-thread-ownership"]');
    await setNumber(lab, 'Number of elements', 1);
    assert.match(await lab.innerText(), /Exactly 1 output positions have one writer/);
    lab = page.locator('[data-lab="gpu-traffic-accounting"]');
    await setNumber(lab, 'Cost per launch (microseconds)', 0);
    assert.match(await lab.innerText(), /Current configuration: 600/);
    await capture(lab, 'gpu-zero-launch-cost');
    checks.push('GPU one-element tail has a single writer; zero launch cost removes the overhead term without an artificial minimum');

    await open('data-annotation-labeling-extended');
    lab = page.locator('[data-lab="annotation-worker-evidence"]');
    assert.match(await lab.innerText(), /0\.857143/);
    await lab.getByRole('combobox', { name: /^Count a copied B/ }).selectOption('yes');
    assert.match(await lab.innerText(), /0\.8/);
    assert.match(await lab.innerText(), /violated independence/);
    await capture(lab, 'annotation-dependent-copy');
    for (const worker of ['A', 'B']) {
      await lab.getByRole('combobox', { name: new RegExp(`^Worker ${worker} judgment`) }).selectOption('');
    }
    assert.match(await lab.innerText(), /Normalized P\(true=1 \| judgments\): 0\.5/);
    lab = page.locator('[data-lab="annotation-stratified-audit"]');
    await setNumber(lab, 'Difficult audited count', 0);
    assert.match(await lab.innerText(), /Its error rate is unmeasured/);
    assert.equal(await lab.getByRole('spinbutton', { name: 'Difficult error count', exact: true }).inputValue(), '0');
    await capture(lab, 'annotation-unmeasured-stratum');
    await setNumber(lab, 'Difficult cases in population (%)', 0);
    assert.doesNotMatch(await lab.innerText(), /Its error rate is unmeasured/);
    checks.push('Annotation copied evidence changes posterior without new information; all abstentions restore prior; unaudited positive-mass stratum is unmeasured, zero-mass stratum allowed');

    await open('dataset-loaders-checkpoints-exact-resume-contracts');
    lab = page.locator('[data-lab="exact-resume-state"]');
    assert.match(await lab.innerText(), /All displayed next-step quantities match/);
    await lab.getByRole('combobox', { name: /^State omitted on restart/ }).selectOption('momentum');
    assert.match(await lab.innerText(), /First difference: update 4/);
    await capture(lab, 'resume-missing-momentum');
    await setNumber(lab, 'Momentum coefficient', 0);
    assert.match(await lab.innerText(), /All displayed next-step quantities match/);
    lab = page.locator('[data-lab="exact-resume-prefetch"]');
    assert.match(await lab.innerText(), /Skipped IDs: 6, 7, 8, 9/);
    await lab.getByRole('combobox', { name: /^Restart strategy/ }).selectOption('queue');
    assert.match(await lab.innerText(), /No IDs skipped/);
    await capture(lab, 'resume-restored-prefetch-queue');
    checks.push('Exact resume exposes omitted momentum, its zero-coefficient null case, skipped issued-only IDs and restored pending queue');

    await open('agent-workflow-frameworks-crewai-autogen-langgraph');
    lab = page.locator('[data-lab="workflow-route"]');
    await lab.getByRole('combobox', { name: /^Proposal disposition/ }).selectOption('reject');
    assert.match(await lab.innerText(), /attempts 0 · committed effects 0/);
    lab = page.locator('[data-lab="effect-replay"]');
    await lab.getByRole('combobox', { name: /^Effect protection/ }).selectOption('none');
    assert.match(await lab.innerText(), /side effect happened twice/);
    await capture(lab, 'workflow-duplicate-effect');
    await lab.getByRole('combobox', { name: /^Effect protection/ }).selectOption('receipt');
    assert.doesNotMatch(await lab.innerText(), /side effect happened twice/);
    await setNumber(lab, 'Total delivery attempts', 1);
    assert.match(await lab.innerText(), /Work remains pending/);
    await capture(lab, 'workflow-effect-before-checkpoint');
    checks.push('Workflow rejection has no attempt/effect; after-effect replay duplicates without receipts and recovers once with receipts; one failed delivery remains pending');
    await open('tensor-shapes-autograd-graphs-device-boundaries');
    lab = page.locator('[data-lab="tensor-broadcast-pairing"]');
    let derivativeRows = lab.getByRole('table', { name: 'The update direction follows the actual comparisons' }).locator('tbody tr');
    assert.deepEqual(await derivativeRows.nth(0).locator('th,td').allTextContents(), ['p0', '-0.5', '-1']);
    await setNumber(lab, 'Target y1', 6);
    assert.deepEqual(await derivativeRows.nth(0).locator('th,td').allTextContents(), ['p0', '-0.5', '-1.5']);
    await capture(lab, 'tensor-cross-target-dependency');
    lab = page.locator('[data-lab="tensor-storage-gradient-boundary"]');
    assert.match(await lab.innerText(), /∂L\/∂w = 21/);
    await lab.getByRole('combobox', { name: /^Product routing/ }).selectOption('detach');
    assert.match(await lab.innerText(), /Loss 24.5/);
    assert.match(await lab.innerText(), /∂L\/∂w = None \(unused route\)/);
    assert.match(await lab.innerText(), /∂L\/∂b = 7/);
    await capture(lab, 'tensor-detached-route');
    await lab.getByRole('combobox', { name: /^Product routing/ }).selectOption('clone');
    assert.match(await lab.innerText(), /∂L\/∂w = 21/);
    await setNumber(lab, 'Target', 7);
    assert.match(await lab.innerText(), /∂L\/∂w = 0/);
    assert.match(await lab.innerText(), /route exists, but its derivative is zero/);
    checks.push('Tensor cross-pairing introduces another target dependency; detach preserves loss but removes the weight route, while clone preserves it and a fitted target gives zero rather than None');
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, checks }, null, 2) + '\n');
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
