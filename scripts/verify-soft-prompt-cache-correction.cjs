const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const topic = 'docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods';
const sources = ['src/learn/components/lesson-labs/SoftPromptEvidence.jsx', 'src/learn/components/lesson-labs/SoftPromptFoundations.jsx', __filename];
const hashes = () => Object.fromEntries(sources.map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
(async () => {
  const report = { before: hashes(), cases: [] };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/p-tuning-soft-prompt-methods?module=large-language-models');
    const figure = page.locator('[data-soft-figure="P21"]');
    await figure.getByText('Saved observations below', { exact: false }).waitFor();
    for (const wrong of [false, true]) for (const step of [0, 1, 2]) {
      await figure.getByRole('checkbox').setChecked(wrong);
      await figure.getByRole('slider').fill(String(step));
      const cells = await figure.locator('[data-cache-cell]').evaluateAll(nodes => nodes.map(n => ({ group: n.dataset.cacheCell, x: +n.getAttribute('x'), width: +n.getAttribute('width'), color: n.getAttribute('fill') })));
      assert.equal(cells.length, 39 + step * (wrong ? 9 : 1));
      cells.forEach((cell, i) => { assert.equal(cell.width, 10); assert.equal(cell.x, 12 + 12*i); });
      assert.equal(cells.filter(x => x.group === 'newly evaluated').length, step);
      assert.equal(cells.filter(x => x.group.includes('repeated')).length, wrong ? step*8 : 0);
      if (wrong) assert.match(await figure.innerText(), /bug has no measured generated IDs or logit errors/);
      report.cases.push({ wrong, step, cells });
    }
    report.after = hashes();
    assert.deepEqual(report.before, report.after);
    report.status = 'passed';
    fs.writeFileSync(`${topic}/review-correction-evidence/cache-cell-checks.json`, JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
