const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE ||
  "C:/Users/ronak/projects/career-ops/node_modules/playwright");

const root =
  "docs/teaching/tokenization/byte-level-tokenization-token-free-models/colour-feedback-evidence";
const output = path.join(root, "final-renewal");
const priorPath = path.join(root, "browser-check.json");
const prior = JSON.parse(fs.readFileSync(priorPath, "utf8"));
const hashBytes = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const hash = (filename) => hashBytes(fs.readFileSync(filename));
const helperPath = "src/learn/components/lesson-labs/token-identity-colors.js";
const manifestPath = "dist-tokenization-flow/.vite/manifest.json";
const helper = fs.readFileSync(helperPath, "utf8");
const reconstructed = helper.replace(
  "let index = Object.hasOwn(workedExampleHues, key) ? workedExampleHues[key] : undefined;",
  "let index = workedExampleHues[key];"
);
assert.equal(
  hashBytes(reconstructed),
  prior.sourceBindings.find((item) => item.path === helperPath).sha256
);
const getStyle = (source) =>
  vm.runInNewContext(
    source.replace("export function", "function") + "\ntokenIdentityStyle"
  );
const oldStyle = getStyle(reconstructed);
const newStyle = getStyle(helper);
for (const key of [
  "c",
  "a",
  "f",
  "é",
  "é",
  "👩‍🔬",
  "ﬁ",
  "i",
  " ",
  "🌍",
  "ca",
  "caf",
  "café",
  "BOS",
  "EOS",
  "byte:195",
  "byte:169",
  "patch:0",
  "patch:1",
  "patch:2",
  "patch:3",
]) {
  assert.equal(
    JSON.stringify(newStyle(key)),
    JSON.stringify(oldStyle(key)),
    key
  );
}
for (const key of ["constructor", "toString", "hasOwnProperty", "__proto__"]) {
  assert.match(newStyle(key).color, /^#[0-9a-f]{6}$/);
}
for (const binding of prior.sourceBindings) {
  if (![helperPath, manifestPath].includes(binding.path))
    assert.equal(hash(binding.path), binding.sha256, binding.path);
}
const sourcePaths = [
  ...prior.sourceBindings.map((item) => item.path),
  "scripts/verify-byte-colour-final-renewal.cjs",
  priorPath,
];
const bindings = sourcePaths.map((filename) => ({
  path: filename,
  sha256: hash(filename),
}));
const checks = [
  "Exact prior helper hash recovered by reversing only the own-property guard; all worked byte/glyph/piece/patch styles are identical",
  "Prototype-named valid pieces now receive valid palette hues",
  "All prior owned runtime, geometry, model and browser-checker source hashes remain unchanged; final helper/manifest are separately bound",
];
const paints = [];
let browser;

(async () => {
  fs.mkdirSync(output, { recursive: true });
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    process.env.LEARNING_BASE_URL +
      "/learn/topic/byte-level-tokenization-token-free-models",
    { waitUntil: "networkidle" }
  );
  await page
    .getByText("Patch 1's completed summary contains target a", {
      exact: false,
    })
    .waitFor();
  async function capture(locator, name, previousName) {
    await locator.scrollIntoViewIfNeeded();
    const filename = path.join(output, name + ".png");
    await locator.screenshot({
      path: filename,
      animations: "disabled",
      style: ".site-header,.site-skip { visibility: hidden !important; }",
    });
    const previous =
      previousName && path.join(root, "paints", previousName + ".png");
    const identical = previous ? hash(filename) === hash(previous) : null;
    paints.push({
      path: filename.replaceAll("\\", "/"),
      sha256: hash(filename),
      previous: previous?.replaceAll("\\", "/"),
      imageByteIdentical: identical,
    });
  }
  for (const name of [
    "text-storage",
    "byte-merges",
    "streaming-live",
    "architecture-blt",
  ]) {
    await capture(
      page.locator(`[data-byte-figure="${name}"]`),
      name + "-desktop",
      name + "-1366-1x"
    );
  }
  checks.push(
    "Final-built glyph, piece, streaming and patch drawings rendered and captured; prior-image equality is individually recorded"
  );
  const unicode = page.locator("#unicode-byte-units");
  await unicode.getByRole("textbox").fill("ﬁ".repeat(48));
  await unicode.getByRole("combobox").selectOption("NFKC");
  assert.equal(await unicode.locator(".byte-grapheme").count(), 96);
  assert.equal(await unicode.getByRole("alert").count(), 0);
  await capture(
    unicode,
    "unicode-nfkc-expanded-desktop",
    "unicode-nfkc-expanded-desktop"
  );
  checks.push(
    "Final production native 48-ligature/NFKC operation still renders 96 grapheme groups without an alert"
  );
  await unicode.getByRole("button", { name: "Reset", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 900 });
  await capture(
    page.locator('[data-byte-figure="text-storage"]'),
    "text-storage-phone",
    "text-storage-390-1x"
  );
  await page.setViewportSize({ width: 768, height: 900 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await capture(
    page.locator('[data-byte-figure="byte-merges"]'),
    "byte-merges-enlarged",
    "byte-merges-768-2x"
  );
  assert.deepEqual(errors, []);
  sourcePaths.forEach((filename, index) =>
    assert.equal(hash(filename), bindings[index].sha256)
  );
  checks.push("No browser errors or source mutation during final renewal");
  fs.writeFileSync(
    path.join(output, "check.json"),
    JSON.stringify(
      {
        date: "2026-10-06",
        reviewer: "author-only",
        baseURL: process.env.LEARNING_BASE_URL,
        checks,
        paints,
        sourceBindings: bindings,
        limits:
          "Bounded renewal after shared own-property palette fix. Previous 12-group/84-capture receipt is preserved as prior-build evidence. Image reuse is claimed only for individually proven byte-identical captures; author opens current captures separately. Root owns independent integration closure.",
      },
      null,
      2
    ) + "\n"
  );
  console.log(
    `${checks.length} final renewal groups passed; ${
      paints.length
    } fresh paints; ${
      paints.filter((item) => item.imageByteIdentical).length
    } byte-identical to prior build.`
  );
  await browser.close();
})().catch(async (error) => {
  console.error(error.stack);
  await browser?.close();
  process.exitCode = 1;
});
