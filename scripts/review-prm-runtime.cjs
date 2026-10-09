const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const base = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const output = path.join(base, 'runtime-independent');
fs.mkdirSync(output, { recursive: true });
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputs = JSON.parse(fs.readFileSync(path.join(base, 'runtime-inputs.json')));
const bindings = Object.entries(inputs.files).map(([file, expected]) => ({ path: file, expected, actual: hash(file) }));
if (bindings.some(x => x.actual !== x.expected)) throw Error('Runtime source changed before review');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  const errors = [], observations = [], images = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.request.get('http://127.0.0.1:4250/__llm_refresh', { timeout: 90000 });
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
  await page.locator('[data-prm-figure="D14"] textarea').waitFor({ timeout: 90000 });
  const figure = id => page.locator(`[data-prm-figure="${id}"]`);
  async function capture(id, name) {
    const node = figure(id); await node.scrollIntoViewIfNeeded();
    const file = path.join(output, `${name}.png`);
    await node.screenshot({ path: file, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}' });
    images.push({ path: file, sha256: hash(file) });
    observations.push({ name, text: await node.innerText() });
  }
  await figure('D19').locator('select').selectOption('failure');
  await capture('D19', 'D19-failure');
  await capture('D17', 'D17-default');
  await capture('D15', 'D15-desktop');
  observations.push({ name: 'D15-track-widths', tracks: await figure('D15').locator('.prm-probability-path').evaluateAll(nodes => nodes.map(n => [...n.querySelectorAll(':scope > div')].map(c => c.getBoundingClientRect().width))) });
  observations.push({ name: 'hidden-essential-context', counts: await page.locator('[data-prm-figure] details:not([open])').evaluateAll(nodes => nodes.map(n => ({ figure: n.closest('[data-prm-figure]').dataset.prmFigure, summary: n.querySelector('summary').innerText }))) });
  for(const id of ['D22','D23','D26']) await capture(id, `${id}-desktop`);
  for(const p of [{ name: 'phone', width: 390, font: 16 }, { name: 'enlarged', width: 768, font: 32 }]) {
    await page.setViewportSize({ width: p.width, height: 1000 });
    await page.evaluate(font => document.documentElement.style.fontSize = `${font}px`, p.font);
    await capture('D15', `D15-${p.name}`);
    observations.push({ name: `${p.name}-page-overflow`, pixels: await page.evaluate(() => document.documentElement.scrollWidth-innerWidth) });
  }
  await browser.close();
  for(const b of bindings) if(hash(b.path)!==b.expected) throw Error('Source changed during review: '+b.path);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ at: new Date().toISOString(), reviewer: 'root', runtimeInputs: hash(path.join(base, 'runtime-inputs.json')), bindings, observations, images, errors, disposition: 'Findings confirmed; not runtime acceptance. Numerical study not replayed.' }, null, 2)+'\n');
  console.log(JSON.stringify({ bindings: bindings.length, observations, images: images.length, errors }));
})().catch(e => { console.error(e); process.exitCode = 1; });
