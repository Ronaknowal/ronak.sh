const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const capture = require('./lib/kv-cache-browser-capture.cjs');
const topic = 'docs/teaching/llm-architecture-training/kv-cache-memory-management';
const base = 'http://127.0.0.1:4261';
const smoke = process.argv.includes('--smoke');
const output = path.resolve(topic, `browser-${smoke ? 'smoke' : 'campaign'}-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const sources = [`${topic}/lesson.jsx`, `${topic}/lesson.md`, 'src/learn/data/kv-cache-models.js',
  ...['Shared', 'Foundations', 'Memory', 'Storage'].map(name => `src/learn/components/lesson-labs/KvCache${name}.jsx`),
  'src/learn/components/lesson-labs/kv-cache-flow.css', 'public/learn-assets/kv-cache-memory-management/observations.json',
  'scripts/lib/kv-cache-browser-capture.cjs', 'scripts/verify-kv-cache-browser.cjs'];
const hashes = () => Object.fromEntries(sources.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const report = { before: hashes(), captures: [], checks: [], pageErrors: [], consoleErrors: [] };
const idsArg = process.argv.find(value => value.startsWith('--figures='));
const profilesArg = process.argv.find(value => value.startsWith('--profiles='));
const ids = idsArg ? idsArg.slice(10).split(',') : smoke ? ['D04', 'D09', 'D14', 'D25'] : Array.from({ length: 26 }, (_, index) => `D${String(index + 1).padStart(2, '0')}`);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    await page.request.get(base + '/__llm_refresh');
    await page.goto(base + '/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models', { waitUntil: 'domcontentloaded', timeout: 90000 });
    const figure = id => page.locator(`[data-kv-figure="${id}"]`);
    async function ready() {
      await figure('D26').waitFor({ timeout: 60000 });
      await figure('D10').getByRole('combobox', { name: 'Execution route', exact: true }).waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important;overflow-anchor:none!important}' });
    }
    await ready();
    assert.equal(await page.locator('[data-kv-figure]').count(), 26);
    assert.equal(await page.locator('[data-lesson-exercise]').count(), 13);
    assert.equal(await page.locator('.kv-flow .katex-error').count(), 0);
    report.checks.push('26 figure mounts, 13 practices, no KaTeX error');
    const slider = (id, name, value) => figure(id).getByRole('slider', { name: new RegExp(name) }).fill(String(value));
    const select = (id, name, value) => figure(id).getByRole('combobox', { name, exact: true }).selectOption({ value: String(value) });
    const check = (id, name, value) => figure(id).getByRole('checkbox', { name, exact: true }).setChecked(value);
    const changes = {
      D02: () => check('D02', 'Unrestricted attention', true),
      D04: async () => { await slider('D04', 'Query x', 0); await slider('D04', 'Query y', 0); await check('D04', 'All values equal [1, 0.5]', true); },
      D05: async () => { await select('D05', 'Operation', 0); await slider('D05', 'New key x', 2); },
      D06: () => select('D06', 'Permission rule', 'upperLeft'),
      D07: async () => { await check('D07', 'Omit occupied-length validity mask', true); await slider('D07', 'Unused-slot value', -50); },
      D09: async () => { await select('D09', 'Inspect layer', 2); await select('D09', 'Recorded schedule', 1); },
      D10: async () => { await select('D10', 'Prompt tokens', 96); await select('D10', 'Execution route', 'static'); await slider('D10', 'Recorded input position', 95); await slider('D10', 'Recorded output index', 7); },
      D11: () => slider('D11', 'Emitted outputs G', 1),
      D12: async () => { await select('D12', 'Plot measurement', 'decode'); await select('D12', 'Detailed prompt', 96); await slider('D12', 'Detailed repeat index', 4); },
      D14: async () => { await slider('D14', 'Request A length', 12); await slider('D14', 'Static capacity', 4); },
      D15: async () => { await slider('D15', 'Simultaneous requests', 12); await check('D15', 'Replicate all eight KV heads on both devices', true); },
      D16: () => select('D16', 'Stored KV heads', 1),
      D17: () => check('D17', 'Replace with the identical ID', true),
      D18: async () => { await check('D18', 'Wrongly reinterpret key at logical position 0', true); await slider('D18', 'Physical destination slot', 1); },
      D20: async () => { for (let index = 0; index < 8; index += 1) await figure('D20').getByRole('button', { name: 'Append one A record', exact: true }).click(); },
      D22: async () => { await check('D22', 'Constant group [2.5, …]', true); await slider('D22', 'Group coordinates', 3); },
      D23: async () => { await select('D23', 'Quantized parts', 'keys'); await check('D23', 'All V coordinates equal 0.75', true); },
      D25: async () => { await slider('D25', 'Rotation angle in degrees', 0); await slider('D25', 'C row 0, coordinate 1', -1); },
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
            if (node.closest('.kv-scroll') || node instanceof SVGElement) return false;
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
          for (const pane of await figure(id).locator('.kv-scroll').all()) {
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
