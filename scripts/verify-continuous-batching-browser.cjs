const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const base = 'http://127.0.0.1:4261';
const smoke = process.argv.includes('--smoke');
const output = path.resolve(topic, `browser-${smoke ? 'smoke' : 'campaign'}-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const sources = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/continuous-batching-models.js',
  ...['Shared', 'Structures', 'Foundations', 'Storage', 'Serving'].map(name => `src/learn/components/lesson-labs/ContinuousBatching${name}.jsx`),
  'src/learn/components/lesson-labs/continuous-batching-flow.css', 'public/learn-assets/continuous-batching-pagedattention/observations.json',
  'scripts/lib/kv-cache-browser-capture.cjs', 'scripts/verify-continuous-batching-browser.cjs'];
const hashes = () => Object.fromEntries(sources.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const report = { before: hashes(), captures: [], checks: [], pageErrors: [], consoleErrors: [] };
const idsArg = process.argv.find(value => value.startsWith('--figures='));
const profilesArg = process.argv.find(value => value.startsWith('--profiles='));
const ids = idsArg ? idsArg.slice(10).split(',') : smoke ? ['D01', 'D08', 'D15', 'D23', 'D29'] : Array.from({ length: 30 }, (_, index) => `D${String(index + 1).padStart(2, '0')}`);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    await page.request.get(base + '/__llm_refresh');
    await page.goto(base + '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models', { waitUntil: 'domcontentloaded', timeout: 90000 });
    const figure = id => page.locator(`[data-cb-figure="${id}"]`);
    async function ready() {
      await figure('D30').waitFor({ timeout: 60000 });
      await figure('D25').getByRole('combobox', { name: 'Recorded query budget', exact: true }).waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}' });
    }
    await ready();
    assert.equal(await page.locator('[data-cb-figure]').count(), 30);
    assert.equal(await page.locator('[data-lesson-exercise]').count(), 14);
    assert.equal(await page.locator('.cb-flow .katex-error').count(), 0);
    report.checks.push('30 figure mounts, 14 practices, no KaTeX error');
    const slider = (id, name, value) => figure(id).getByRole('slider', { name: new RegExp(name) }).fill(String(value));
    const select = (id, name, value) => figure(id).getByRole('combobox', { name, exact: true }).selectOption({ value: String(value) });
    const check = (id, name, value) => figure(id).getByRole('checkbox', { name, exact: true }).setChecked(value);
    const changes = {
      D01: () => figure('D01').getByRole('button', {name:'Process pending ID 9', exact:true}).click(),
      D02: () => slider('D02', 'Boundary operation', 5),
      D03: () => select('D03', 'Workload', 'single'),
      D04: () => slider('D04', 'Work boundary', 24),
      D05: () => slider('D05', 'Physical page capacity', 3),
      D06: () => check('D06', 'One output only', true),
      D07: () => check('D07', 'Pack B before A', true),
      D08: () => check('D08', 'Bug: global lower-triangular mask', true),
      D09: () => check('D09', 'A contributes zero rows', true),
      D10: () => slider('D10', 'Logical position', 7),
      D11: () => check('D11', 'Use page-divisible lengths', true),
      D12: () => slider('D12', 'Pool page capacity', 2),
      D13: () => slider('D13', 'Release / reuse stage', 3),
      D14: () => slider('D14', 'B shared prefix length', 0),
      D15: () => figure('D15').getByRole('button', {name:'Append key 99 to B', exact:true}).click(),
      D16: () => check('D16', 'Use equal page masses', true),
      D17: () => select('D17', 'Mask', 'all'),
      D18: () => slider('D18', 'Pool pages', 2),
      D19: () => select('D19', 'Pool pages', 8),
      D20: () => select('D20', 'Chunk rows', 3),
      D21: () => check('D21', 'Last decode finished at preceding boundary', true),
      D22: () => check('D22', 'Only the long request', true),
      D23: () => check('D23', 'Reverse request display order', true),
      D24: () => slider('D24', 'Lifecycle operation', 3),
      D25: () => select('D25', 'Recorded query budget', 64),
      D26: () => select('D26', 'Recorded request', 'alice-64'),
      D27: () => select('D27', 'Illustrated partition', 'layers'),
      D28: () => slider('D28', 'Microbatches', 3),
      D29: () => select('D29', 'Mechanism state', 'tail'),
      D30: () => select('D30', 'Scenario', 'arrival'),
    };
    async function shot(name, locator) {
      const file = path.join(output, `${name}.png`);
      const evidence = await capture(page, locator, file);
      report.captures.push({ name, file, tiles: evidence.tiles.map(tile => tile.path) });
    }
    for (const [width, font, profile] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'enlarged']]) {
      if (profilesArg && !profilesArg.slice(11).split(',').includes(profile)) continue;
      if (profile !== 'desktop') { await page.reload({ waitUntil: 'domcontentloaded' }); await ready(); }
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.fontSize = value + 'px'; }, font);
      for (const id of ids) {
        await shot(`${profile}-${id}-default`, figure(id));
        const layout = await figure(id).evaluate(element => ({ width: element.getBoundingClientRect().width,
          bodyOverflow: document.documentElement.scrollWidth - innerWidth,
          overflow: [...element.querySelectorAll('*')].filter(node => {
            if (node.closest('.cb-scroll') || node instanceof SVGElement) return false;
            const r = node.getBoundingClientRect();
            return r.width > 0 && (r.right > innerWidth + 2 || r.left < -2);
          }).map(node => ({ tag: node.tagName, text: node.textContent.slice(0, 80) })) }));
        report.checks.push({ profile, id, layout });
        if (!smoke && changes[id]) {
          await changes[id]();
          await shot(`${profile}-${id}-changed`, figure(id));
          await figure(id).getByRole('button', { name: 'Reset', exact: true }).click();
          report.checks.push(`${profile} ${id} changed and reset`);
        }
        if (!smoke) {
          let paneIndex = 0;
          for (const pane of await figure(id).locator('.cb-scroll').all()) {
            const extent = await pane.evaluate(element => element.scrollWidth - element.clientWidth);
            if (extent > 2 && profile !== 'desktop') {
              await pane.focus();
              await page.keyboard.press('End');
              await pane.evaluate(element => { element.scrollLeft = element.scrollWidth; });
              const name = `${profile}-${id}-pan${paneIndex}`;
              const box = await pane.boundingBox();
              if (box && box.height <= 1000) {
                const file = path.join(output, `${name}.png`);
                await pane.screenshot({ path: file, animations: 'disabled', timeout: 30000 });
                report.captures.push({ name, file, tiles: [file], kind: 'native element screenshot of bounded local scroller', box });
              } else {
                await shot(name, pane);
              }
              await pane.evaluate(element => { element.scrollLeft = 0; });
              report.checks.push({ profile, id, paneIndex, extent, pan: 'actual right edge; keyboard focus plus explicit scroll' });
            }
            paneIndex += 1;
          }
        }
      }
    }
    assert.equal(report.pageErrors.length, 0, report.pageErrors.join('\n'));
    report.after = hashes();
    assert.deepEqual(report.before, report.after, 'Source changed during capture');
    report.status = 'captured; actual image reading remains separate';
  } catch (error) {
    report.failure = error.stack;
    process.exitCode = 1;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ output, captures: report.captures.length, failure: report.failure, errors: report.pageErrors }));
  }
})();
