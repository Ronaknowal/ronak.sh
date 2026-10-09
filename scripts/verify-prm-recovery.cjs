const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const directory = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/browser-recovery';
fs.mkdirSync(directory + '/screenshots', { recursive: true });
const checks = [], images = [];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bindings = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js', 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/lesson.jsx', 'public/learn-data/process-reward-models/observations.json'].map(file => ({ path: file, sha256: hash(fs.readFileSync(file)) }));
function check(name, condition) { checks.push({ name, passed: !!condition }); if (!condition) throw Error(name); }
async function capture(page, node, name) {
  await node.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement?.blur());
  const file = `${directory}/screenshots/${name}.png`;
  await node.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}' });
  images.push({ path: `screenshots/${name}.png`, sha256: hash(fs.readFileSync(file)) });
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });
  let evidenceRequests = 0, codeRequests = 0, failure;
  try {
    await page.route('**/learn-data/process-reward-models/observations.json', async route => {
      evidenceRequests++;
      if (evidenceRequests === 1) await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Deliberate author recovery probe' });
      else await route.continue();
    });
    await page.route('**/learn-code/process-reward-models/prm_records.py', async route => {
      codeRequests++;
      if (codeRequests === 1) await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Deliberate author code recovery probe' });
      else await route.continue();
    });
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    const inspector = page.locator('[data-prm-figure="D14"]');
    await inspector.getByRole('button', { name: 'Retry evidence' }).waitFor({ timeout: 90000 });
    check('HTTP503 evidence fails honestly without substituted masses', (await inspector.innerText()).includes('HTTP 503') && await inspector.locator('.prm-masses').count() === 0);
    await capture(page, inspector, 'phone-evidence503');
    await inspector.getByRole('button', { name: 'Retry evidence' }).click();
    await inspector.locator('textarea').waitFor({ timeout: 90000 });
    check('Explicit retry fetches actual retained data', evidenceRequests === 2 && (await inspector.innerText()).includes('Source annotation: progress'));
    await capture(page, inspector, 'phone-evidence-recovered');
    const program = page.locator('.lesson-code-source').first();
    await program.scrollIntoViewIfNeeded();
    await program.getByRole('alert').waitFor({ timeout: 90000 });
    check('Program HTTP503 exposes alert and retry', (await program.innerText()).includes('The program could not load'));
    await capture(page, program, 'phone-code503');
    await program.getByRole('button', { name: 'Retry', exact: true }).click();
    await program.locator('pre code').waitFor({ timeout: 90000 });
    check('Program retry restores exact complete bytes', codeRequests === 2 && hash(Buffer.from(await program.locator('pre code').textContent())) === hash(fs.readFileSync('public/learn-code/process-reward-models/prm_records.py')));
    for (const binding of bindings) check('Source conserved ' + binding.path, hash(fs.readFileSync(binding.path)) === binding.sha256);
  } catch (error) { failure = error.stack; }
  await browser.close();
  const report = { passed: !failure, at: new Date().toISOString(), failure: failure || null, bindings, checks, images, evidenceRequests, codeRequests, scope: 'Actual intercepted HTTP503 then native Retry clicks; canonical resources and study are not changed.' };
  fs.writeFileSync(directory + '/report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: checks.length, evidenceRequests, codeRequests, failure }));
  if (failure) process.exitCode = 1;
})();
