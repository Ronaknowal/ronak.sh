const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const output = `${owner}/runtime-context-math-successor/browser`;
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'public/learn-data/process-reward-models/observations.json', `${owner}/lesson.jsx`];
const report = { passed: false, fits: 0, sources: Object.fromEntries(files.map((file) => [file, hash(file)])), checks: [], images: [], records: [], errors: [] };
const check = (condition, name) => { assert.ok(condition, name); report.checks.push(name); };
const branches = JSON.parse(fs.readFileSync(files[2])).branches;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  page.on('pageerror', (error) => report.errors.push(error.message));
  const figure = page.locator('[data-prm-figure="D04"]');
  async function capture(node, name) {
    const viewport = page.viewportSize();
    const bounds = await node.boundingBox();
    await page.setViewportSize({ width: viewport.width, height: Math.max(1000, Math.ceil(bounds.height + 300)) });
    await node.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.activeElement?.blur());
    const path = `${output}/${name}.png`;
    await node.screenshot({ path, style: '.site-header--learn,.site-skip{visibility:hidden!important}' });
    report.images.push({ path, sha256: hash(path) });
    await page.setViewportSize(viewport);
  }
  try {
    await page.request.get('http://127.0.0.1:4250/__llm_refresh');
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models', { timeout: 90000 });
    await figure.locator('.prm-parent').waitFor({ timeout: 90000 });
    for (const [profile, width, font] of [['desktop', 1366, 16], ['phone', 390, 16], ['enlarged', 768, 32]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((value) => { document.documentElement.style.fontSize = `${value}px`; }, font);
      for (let record = 0; record < 2; record++) {
        await figure.getByRole('combobox', { name: 'Actual source address', exact: true }).selectOption(String(record));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(200);
        const branch = branches[record];
        const texts = [branch.question, ...branch.prefix, ...branch.annotation.completions.map((item) => item.text)];
        const expected = texts.flatMap((text) => [...text.matchAll(/\$([^$]+)\$/g)].map((item) => item[1]));
        const expressions = await figure.locator('[data-source-latex]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-source-latex')));
        check(JSON.stringify(expressions) === JSON.stringify(expected), `${profile}/${record}: every raw source expression preserved in exact order`);
        check(await figure.locator('.katex-error').count() === 0, `${profile}/${record}: no failed LaTeX rendering`);
        check(await figure.locator('[data-source-latex] math').count() === expected.length, `${profile}/${record}: every equation retains accessible MathML`);
        check(!(await figure.locator('.prm-parent').innerText()).includes('$'), `${profile}/${record}: parent displays mathematics without source delimiters`);
        check(!(await figure.locator('.prm-siblings').innerText()).includes('$'), `${profile}/${record}: siblings display mathematics without source delimiters`);
        const geometry = await figure.locator('[data-source-latex]').evaluateAll((nodes) => nodes.map((node, index) => ({ index, width: node.clientWidth, scrollWidth: node.scrollWidth, hint: node.parentElement.querySelector('.prm-source-math-hint')?.innerText || '', font: parseFloat(getComputedStyle(node.firstElementChild).fontSize), focus: node.tabIndex })));
        check(geometry.every((item) => (item.scrollWidth > item.width + 1) === item.hint.includes('Scroll this equation') && item.focus === 0 && item.font >= font * .9), `${profile}/${record}: inherited readable text size, focus and conditional overflow cue`);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${profile}/${record}: no page overflow`);
        report.records.push({ profile, record, sourceExpressions: expected, geometry });
        await capture(figure.locator('.prm-parent'), `${profile}-record${record}-parent`);
        await capture(figure.locator('.prm-siblings'), `${profile}-record${record}-siblings`);
        const wide = geometry.filter((item) => item.scrollWidth > item.width + 1).sort((a, b) => b.scrollWidth - a.scrollWidth)[0];
        if (wide) {
          const region = figure.locator('[data-source-latex]').nth(wide.index);
          await region.focus();
          for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(150);
          check(await region.evaluate((node) => node.scrollLeft >= node.scrollWidth - node.clientWidth - 2), `${profile}/${record}: widest original equation reaches native right edge`);
          await capture(region.locator('..'), `${profile}-record${record}-wide-equation-end`);
        }
      }
    }
    check(report.errors.length === 0, 'no React or runtime errors');
    for (const file of files) check(hash(file) === report.sources[file], `stable source ${file}`);
    report.passed = true;
  } catch (error) {
    report.failure = String(error.stack || error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
    await browser.close();
    console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, images: report.images.length, failure: report.failure }));
  }
})();
