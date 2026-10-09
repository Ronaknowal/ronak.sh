// Bounded viewport pixels; never expand the entire tall lazy document.
// Base PNG is tile one; its .tiles.json names every observed continuation.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
module.exports = async function captureObject(page, locator, file) {
  const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  await page.evaluate(() => document.activeElement?.blur());
  await page.evaluate(() => document.fonts.ready);
  await locator.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const measure = () => locator.evaluate(node => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, scrollX, scrollY, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  const initial = await measure(), tiles = [];
  if (!(initial.width > 0 && initial.height > 0)) throw new Error('Empty actual capture rectangle');
  let covered = 0;
  for (let index = 0; index < 150; index++) {
    await locator.evaluate((node, offset) => {
      const r = node.getBoundingClientRect();
      window.scrollTo({ top: r.top + scrollY + offset, behavior: 'instant' });
    }, covered);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const r = await measure();
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    const right = Math.min(r.viewportWidth, r.x + r.width);
    const bottom = Math.min(r.viewportHeight, r.y + r.height);
    const clip = { x, y, width: right - x, height: bottom - y };
    if (!(clip.width > 0 && clip.height > 0)) throw new Error('Object has no visible viewport intersection');
    const offsetStart = y - r.y, offsetEnd = bottom - r.y;
    if (offsetStart > covered + 2) throw new Error(`Uncaptured vertical gap: ${covered} to ${offsetStart}`);
    if (offsetEnd <= covered + 0.1) throw new Error('Capture made no vertical progress');
    const tile = index ? file.replace(/\.png$/, `.tile-${String(index + 1).padStart(2, '0')}.png`) : file;
    await page.screenshot({ path: tile, fullPage: false, clip, animations: 'disabled', style: '.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}.skip-link{visibility:hidden!important}', timeout: 90000 });
    tiles.push({ path: tile, sha256: hash(tile), measured: r, clip, objectOffsetStart: offsetStart, objectOffsetEnd: offsetEnd });
    covered = offsetEnd;
    if (covered >= r.height - 1) {
      const result = { kind: 'Observed viewport tiles; no full-page bitmap or synthetic reconstruction', initial, finalHeight: r.height, covered, tiles };
      fs.writeFileSync(`${file}.tiles.json`, JSON.stringify(result, null, 2) + '\n');
      return result;
    }
  }
  throw new Error('Object exceeds bounded 150-tile capture limit');
};
