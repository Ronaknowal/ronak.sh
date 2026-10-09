const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const topic = 'docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods';
const output = path.resolve(topic, 'reading-evidence');
fs.mkdirSync(output, { recursive: true });
const files = [`${topic}/lesson.jsx`, 'src/learn/components/lesson-labs/soft-prompt-flow.css',
  ...['Shared', 'Foundations', 'Memory', 'Encoders', 'Evidence'].map(name => `src/learn/components/lesson-labs/SoftPrompt${name}.jsx`)];
const hashes = () => Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { before: hashes(), captures: [], checks: [], errors: [] };
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await require('./lib/lesson-browser-fonts.cjs')(context);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/p-tuning-soft-prompt-methods?module=large-language-models',
      { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('[data-soft-figure="P26"]').waitFor();
    await page.waitForFunction(() => document.querySelectorAll('.soft-flow .soft-observation-state').length === 0);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important}' });
    const flow = page.locator('.soft-flow');
    const shot = async (name, element, whole = false) => {
      await element.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement?.blur());
      const filename = name + '.png';
      if (whole) await element.screenshot({ path: path.join(output, filename), style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
      else {
        await element.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.screenshot({ path: path.join(output, filename) });
      }
      report.captures.push(filename);
    };
    for (const [width, font, size] of [[1366, 16, 'desktop'], [390, 16, 'phone'], [768, 32, 'zoom']]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => document.documentElement.style.fontSize = value + 'px', font);
      await shot(size + '-opening', page.locator('h1').first());
      for (const [i, heading] of (await flow.locator('h2').all()).entries()) await shot(`${size}-section-${String(i + 1).padStart(2, '0')}`, heading);
      for (const ending of await flow.locator('[data-lesson-ending]').all()) {
        await shot(size + '-ending-' + await ending.getAttribute('data-lesson-ending'), ending, true);
      }
      for (const [i, equation] of (await flow.locator('.soft-equation').all()).entries()) {
        await shot(`${size}-equation-${i}`, equation, true);
        const extent = await equation.evaluate(node => node.scrollWidth - node.clientWidth);
        if (extent > 1) {
          await equation.evaluate(node => node.scrollLeft = node.scrollWidth);
          await shot(`${size}-equation-${i}-right`, equation, true);
          await equation.evaluate(node => node.scrollLeft = 0);
        }
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }
    await page.setViewportSize({ width: 1366, height: 1000 });
    await page.evaluate(() => document.documentElement.style.fontSize = '16px');
    for (const [i, exercise] of (await flow.locator('[data-lesson-exercise]').all()).entries()) {
      for (const summary of await exercise.locator('summary').all()) await summary.click();
      await shot('practice-' + String(i + 1).padStart(2, '0'), exercise, true);
    }
    for (const block of await flow.locator('.lesson-code-source').all()) {
      await block.scrollIntoViewIfNeeded(); await block.locator('pre').waitFor();
      const file = await block.locator('.lesson-code__filename').innerText();
      const expected = fs.readFileSync('public/learn-code/p-tuning/' + file, 'utf8').replaceAll('\r\n', '\n').trimEnd();
      assert.equal((await block.locator('pre').innerText()).replaceAll('\r\n', '\n').trimEnd(), expected);
      report.checks.push('Complete multiline visible source: ' + file);
    }
    fs.writeFileSync(path.join(output, 'complete-rendered-text.txt'), await flow.innerText());
    const aliases = JSON.parse(fs.readFileSync(`${topic}/content-compatibility.json`, 'utf8')).aliases;
    for (const [alias, target] of Object.entries(aliases)) {
      assert.equal(await flow.locator(`[id="${alias}"]`).count(), 1);
      assert.equal(await flow.locator(`[id="${target}"]`).count(), 1);
    }
    assert.equal(await flow.locator('[data-lesson-exercise]').count(), 12);
    assert.equal(await flow.locator('[data-lesson-ending]').count(), 4);
    assert.equal(await flow.locator('.katex-error').count(), 0);
    assert.equal(await flow.locator('.soft-equation').count(), 8);
    report.checks.push('All 12 hints/solutions, 4 endings, 8 actual math blocks and 11 legacy aliases');
    report.links = await flow.locator('a').evaluateAll(nodes => nodes.map(node => ({ text: node.innerText, href: node.getAttribute('href') })));
    assert.deepEqual(report.errors, []);
    report.after = hashes(); assert.deepEqual(report.after, report.before);
    report.status = 'passed';
    console.log(JSON.stringify({ status: report.status, captures: report.captures.length, checks: report.checks }));
  } catch (error) { report.status = 'failed'; report.failure = error.stack; throw error; }
  finally {
    fs.writeFileSync(path.join(output, 'report-' + Date.now() + '.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
