const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE ||
  "C:/Users/ronak/projects/career-ops/node_modules/playwright");

const base = process.env.LEARNING_BASE_URL;
if (!base) throw new Error("Set LEARNING_BASE_URL to the fresh root preview.");
const root =
  "docs/teaching/tokenization/byte-level-tokenization-token-free-models/";
const output = path.resolve(root, "reading-flow-author-paints");
fs.mkdirSync(output, { recursive: true });
const sourcePaths = [
  "src/learn/data/topics/byte-level-tokenization.jsx",
  "src/learn/components/lesson-labs/ByteTokenizationLabs.jsx",
  "src/learn/components/lesson-labs/ByteTokenizationDrawings.jsx",
  "src/learn/components/lesson-labs/byte-tokenization-labs.css",
  "src/learn/data/byte-tokenization-model.js",
  "scripts/verify-byte-reading-flow-browser.cjs",
  "dist-tokenization-flow/.vite/manifest.json",
];
const hash = (filename) =>
  crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
const bindings = sourcePaths.map((filename) => ({
  path: filename,
  sha256: hash(filename),
}));
const checks = [];
const screenshots = [];
let browser;

(async () => {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const shot = async (locator, name) => {
    await locator.scrollIntoViewIfNeeded();
    const filename = path.join(output, name + ".png");
    await locator.screenshot({
      path: filename,
      animations: "disabled",
      style: ".site-header,.site-skip { visibility: hidden !important; }",
    });
    screenshots.push({
      name,
      path: path.relative(process.cwd(), filename).replaceAll("\\", "/"),
    });
  };
  await page.goto(
    base + "/learn/topic/byte-level-tokenization-token-free-models",
    { waitUntil: "networkidle" }
  );
  await page
    .getByText("Patch 1's completed summary contains target a", {
      exact: false,
    })
    .waitFor();
  await page
    .getByText(
      "Current research: fewer decoder calls for the same output bytes",
      { exact: false }
    )
    .waitFor();
  assert.equal(
    await page
      .locator(".byte-embedding-table .byte-traced-row > span")
      .innerText(),
    "198 C3"
  );
  await page
    .getByText("explains how positions gather information", { exact: false })
    .waitFor();
  checks.push(
    "Fresh revised BLT diagram, separated embedding address and 2026 bridge actually rendered"
  );

  const unicode = page.locator("#unicode-byte-units");
  const stream = page.locator("#streaming-byte-decoder");
  const patch = page.locator("#byte-entropy-patches");
  await unicode.getByRole("textbox").fill("cafe\u0301 🌍");
  assert.match(
    await unicode.locator("[data-byte-summary]").innerText(),
    /7 scalars.*11 bytes/
  );
  await unicode.getByRole("combobox").selectOption("NFC");
  assert.match(
    await unicode.locator("[data-byte-summary]").innerText(),
    /6 scalars.*10 bytes.*changed/
  );
  await shot(unicode, "unicode-nfc-desktop");
  await unicode.getByRole("combobox").selectOption("none");
  await unicode.getByRole("textbox").fill("👩‍🔬");
  assert.match(
    await unicode.locator("[data-byte-summary]").innerText(),
    /1 grapheme.*3 scalars.*11 bytes/
  );
  await shot(unicode, "unicode-scientist-desktop");
  await unicode.getByRole("textbox").fill("");
  assert.match(
    await unicode.locator("[data-byte-summary]").innerText(),
    /0 scalars.*0 bytes/
  );
  await unicode.getByRole("textbox").fill("x".repeat(49));
  assert.match(
    await unicode.getByRole("alert").innerText(),
    /48 Unicode scalars/
  );
  await shot(unicode, "unicode-invalid-length-desktop");
  await unicode.getByRole("textbox").evaluate((element) => {
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    ).set;
    setValue.call(element, String.fromCharCode(0xd800));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.match(
    await unicode.getByRole("alert").innerText(),
    /unpaired UTF-16 surrogate/
  );
  await shot(unicode, "unicode-invalid-surrogate-desktop");
  await unicode.getByRole("button", { name: "Reset", exact: true }).click();
  checks.push(
    "Unicode edited normalization/scientist/empty/invalid/reset states"
  );

  const split = stream.getByRole("slider");
  await split.focus();
  await split.press("Home");
  assert.equal(await split.inputValue(), "0");
  assert.match(await stream.locator(".flow-readout").innerText(), /agree/);
  for (let index = 0; index < 8; index++) await split.press("ArrowRight");
  assert.equal(await split.inputValue(), "8");
  assert.match(
    await stream.locator(".byte-stream-buffer").first().innerText(),
    /F0.*9F[\s\S]*2 continuations/s
  );
  await shot(stream, "stream-split-inside-desktop");
  await split.press("End");
  assert.equal(await split.inputValue(), "10");
  assert.match(await stream.locator(".flow-readout").innerText(), /agree/);
  await stream.getByRole("checkbox").check();
  assert.match(await stream.locator(".flow-readout").innerText(), /truncation/);
  await shot(stream, "stream-truncated-desktop");
  await stream.getByRole("button", { name: "Reset", exact: true }).click();
  await stream.getByRole("textbox").fill("ABC");
  assert.match(await stream.locator(".flow-readout").innerText(), /agree/);
  await stream.getByRole("textbox").fill("");
  assert.equal(await split.inputValue(), "0");
  assert.equal(await split.getAttribute("max"), "0");
  await stream.getByRole("button", { name: "Reset", exact: true }).click();
  checks.push(
    "Streaming native Home/End/intermediate, ASCII/empty, truncation and reset"
  );

  const probability = patch.getByRole("slider", {
    name: /First possible byte probability/,
  });
  const threshold = patch.getByRole("slider", {
    name: /Start-patch entropy threshold/,
  });
  assert.match(
    await patch.locator("[data-patch-lengths]").innerText(),
    /3, 3, 2/
  );
  await probability.focus();
  await probability.press("Home");
  assert.equal(await probability.inputValue(), "0.5");
  assert.match(
    await patch.locator("[data-patch-lengths]").innerText(),
    /3, 1, 2, 2/
  );
  await shot(patch, "patch-space-uncertain-desktop");
  await probability.press("End");
  assert.equal(await probability.inputValue(), "1");
  assert.match(
    await patch.locator(".byte-selected-row").innerText(),
    /0.0000 bits/
  );
  await probability.press("Home");
  for (let index = 0; index < 300; index++)
    await probability.press("ArrowRight");
  assert.equal(await probability.inputValue(), "0.8");
  assert.match(
    await patch.locator(".byte-selected-row").innerText(),
    /0.7219 bits/
  );
  await threshold.focus();
  await threshold.press("End");
  assert.match(
    await patch.locator("[data-patch-lengths]").innerText(),
    /\[8\]/
  );
  await shot(patch, "patch-equality-one-patch-desktop");
  await threshold.press("Home");
  assert.match(
    await patch.locator("[data-patch-lengths]").innerText(),
    /1, 1, 1, 1, 1, 1, 1, 1/
  );
  await shot(patch, "patch-threshold-zero-desktop");
  await patch.getByRole("button", { name: "Reset", exact: true }).click();
  const sliderBox = await threshold.boundingBox();
  await page.mouse.move(
    sliderBox.x + sliderBox.width / 2,
    sliderBox.y + sliderBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    sliderBox.x + sliderBox.width * 0.75,
    sliderBox.y + sliderBox.height / 2,
    { steps: 6 }
  );
  await page.mouse.up();
  const draggedValue = Number(await threshold.inputValue());
  assert.ok(draggedValue > 0.6 && draggedValue < 0.9);
  await patch.getByRole("button", { name: "Reset", exact: true }).click();
  checks.push(
    "Entropy native endpoints/0.8/equality/null/reset and actual threshold drag"
  );

  for (const [width, zoom] of [
    [1366, 1],
    [768, 1],
    [768, 2],
    [390, 1],
    [320, 1],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      (size) =>
        (document.documentElement.style.fontSize = size === 2 ? "200%" : ""),
      zoom
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    assert.ok(overflow <= 1, `page overflow ${width}/${zoom}: ${overflow}`);
    const framed = await page.locator(".byte-drawing,.flow-lab").evaluateAll(
      (elements) =>
        elements.filter((element) => {
          const css = getComputedStyle(element);
          return (
            parseFloat(css.borderTopWidth) ||
            parseFloat(css.borderRightWidth) ||
            parseFloat(css.borderBottomWidth) ||
            parseFloat(css.borderLeftWidth) ||
            css.boxShadow !== "none" ||
            !["rgba(0, 0, 0, 0)", "transparent"].includes(css.backgroundColor)
          );
        }).length
    );
    assert.equal(framed, 0);
    if (width === 1366 || width === 390 || zoom === 2) {
      const figures = page.locator("[data-byte-figure]");
      for (let index = 0; index < (await figures.count()); index++) {
        const figure = figures.nth(index);
        const name = await figure.getAttribute("data-byte-figure");
        await shot(figure, `${name}-${width}-${zoom}x`);
      }
    }
    checks.push(
      `Layout ${width}px/${zoom}x text: no page overflow or framed teaching figures`
    );
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await stream.getByRole("checkbox").check();
  await shot(stream, "stream-truncated-phone");
  await stream.getByRole("button", { name: "Reset", exact: true }).click();
  await unicode.getByRole("textbox").fill("👩‍🔬");
  await shot(unicode, "unicode-scientist-phone");
  await unicode.getByRole("button", { name: "Reset", exact: true }).click();
  await probability.focus();
  await probability.press("Home");
  await shot(patch, "patch-space-uncertain-phone");
  await patch.getByRole("button", { name: "Reset", exact: true }).click();
  assert.deepEqual(errors, []);
  sourcePaths.forEach((filename, index) =>
    assert.equal(
      hash(filename),
      bindings[index].sha256,
      "Sources changed during browser run"
    )
  );
  const result = {
    date: "2026-10-06",
    reviewer: "author-only",
    baseURL: base,
    checks,
    screenshots,
    sourceBindings: bindings,
    paintInspection:
      "Captures are candidates until author visually opens them; record inspection separately.",
    limits:
      "Current native interaction and default rendering checks. Root owns independent full-source/paint review and final build/load integration.",
  };
  fs.writeFileSync(
    root + "reading-flow-author-browser.json",
    JSON.stringify(result, null, 2) + "\n"
  );
  console.log(
    `${checks.length} author byte browser groups passed; ${screenshots.length} capture candidates.`
  );
  await browser.close();
})().catch(async (error) => {
  console.error(error.stack);
  await browser?.close();
  process.exitCode = 1;
});
