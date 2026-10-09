const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const output = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/runtime-browser-capture/network-attribution.json';
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { at: new Date().toISOString(), failedRequests: [], errorResponses: [], consoleErrors: [], pageErrors: [], resources: [], figures: [], files: Object.fromEntries(['src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/rlvr-flow.css'].map(p => [p,sha(p)])) };
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
    page.on('requestfailed', r => report.failedRequests.push({ url: r.url(), error: r.failure() }));
    page.on('response', r => { report.resources.push({ url: r.url(), status: r.status() }); if (r.status() >= 400) report.errorResponses.push({ url:r.url(), status:r.status() }); });
    page.on('console', m => { if(m.type()==='error') report.consoleErrors.push({text:m.text(),location:m.location()}); });
    page.on('pageerror', e => report.pageErrors.push(e.message));
    await page.goto('http://127.0.0.1:4254/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models', { timeout: 90000 });
    await page.locator('[data-rlvr-figure="D39"]').waitFor({ timeout: 90000 });
    for (const figure of await page.locator('[data-rlvr-figure]').all()) {
      await figure.evaluate(n => n.scrollIntoView({ block:'start', behavior:'instant' }));
      await page.waitForLoadState('networkidle', { timeout: 60000 });
      report.figures.push(await figure.evaluate(n => ({ id:n.dataset.rlvrFigure, loading:n.querySelectorAll('[role=status]').length, alerts:[...n.querySelectorAll('[role=alert]')].map(x=>x.textContent) })));
    }
    report.completed = true;
  } catch(e) { report.failure = e.stack; }
  finally { await browser.close(); fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n',{flag:'wx'}); }
  console.log(JSON.stringify({completed:report.completed,figures:report.figures.length,failedRequests:report.failedRequests,errorResponses:report.errorResponses,consoleErrors:report.consoleErrors,pageErrors:report.pageErrors,failure:report.failure}));
})().catch(e=>{console.error(e);process.exitCode=1;});
