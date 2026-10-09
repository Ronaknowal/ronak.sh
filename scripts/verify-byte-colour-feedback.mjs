import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import vm from "node:vm";
import { parse } from "@babel/parser";
import { inspectByteText } from "../src/learn/data/byte-tokenization-model.js";
import { tokenIdentityStyle } from "../src/learn/components/lesson-labs/token-identity-colors.js";

const root =
  "docs/teaching/tokenization/byte-level-tokenization-token-free-models/";
const directory = "src/learn/components/lesson-labs/";
const hash = (filename) =>
  crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
const checks = [];
const current = {};
const previous = {};
for (const filename of [
  "ByteTokenizationDrawings.jsx",
  "ByteTokenizationLabs.jsx",
]) {
  current[filename] = fs.readFileSync(directory + filename, "utf8");
  previous[filename] = fs.readFileSync(
    root + "original/colour-feedback/" + filename,
    "utf8"
  );
  parse(current[filename], { sourceType: "module", plugins: ["jsx"] });
  checks.push(
    `${filename} parses; exact frozen v3 baseline is retained separately`
  );
}
for (const receipt of ["native-evidence.json", "model-evidence.json"]) {
  for (const binding of JSON.parse(fs.readFileSync(root + receipt))
    .sourceBindings)
    assert.equal(hash(binding.path), binding.sha256);
  checks.push(`Unchanged invariant source bindings match ${receipt}`);
}
assert.equal(
  hash(directory + "byte-tokenization-labs.css"),
  "f9621bb29043a4c1aca88b1fc5c979631bffefd760bbcf2febeccf2a41f62ff8"
);
checks.push("Owned geometry CSS is byte-for-byte unchanged");
function functionSource(source, name) {
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  const declarations = ast.program.body.map((node) => node.declaration ?? node);
  const node = declarations.find(
    (node) => node.type === "FunctionDeclaration" && node.id.name === name
  );
  assert.ok(node, name);
  return source.slice(node.start, node.end);
}
for (const name of [
  "Utf8PackingFigure",
  "ByteEmbeddingFigure",
  "ByteCausalGrid",
  "ByteMasksFigure",
  "ByteLossFigure",
  "ByteUncertaintyFigure",
  "BytePoolingFigure",
  "ByteCostFigure",
]) {
  assert.equal(
    functionSource(current["ByteTokenizationDrawings.jsx"], name),
    functionSource(previous["ByteTokenizationDrawings.jsx"], name)
  );
}
checks.push(
  "Bit prefix/payload, embedding table, masks, probabilities, pooling and cost drawings have identical function source"
);
const glyphKeys = vm.runInNewContext(
  `(${functionSource(
    current["ByteTokenizationLabs.jsx"],
    "glyphByteIdentityKeys"
  )})`,
  { identityByteEncoder: new TextEncoder() }
);
const expanded = inspectByteText("ﬁ".repeat(48), "NFKC");
const expandedKeys = Array.from(glyphKeys(expanded));
assert.equal(expanded.scalars.length, 96);
assert.equal(expanded.bytes.length, 96);
assert.equal(expandedKeys.length, 96);
assert.equal(expandedKeys.filter((key) => key === "f").length, 48);
assert.equal(expandedKeys.filter((key) => key === "i").length, 48);
assert.throws(() => inspectByteText(expanded.text), /48 Unicode scalars/);
checks.push(
  "Actual presentation helper accepts precomputed 48 ligatures → 96 normalized scalars without reapplying input limit"
);
const scientist = inspectByteText("👩‍🔬");
assert.equal(Array.from(glyphKeys(scientist)).length, 11);
assert.equal(new Set(Array.from(glyphKeys(scientist))).size, 1);
assert.equal(
  Array.from(glyphKeys(inspectByteText("e\u0301"))).every((key) => key === "é"),
  true
);
checks.push("All bytes of a displayed grapheme retain its NFC hue identity");
assert.equal(
  new Set(["c", "a", "f", "é"].map((key) => tokenIdentityStyle(key).color))
    .size,
  4
);
assert.equal(
  new Set(
    ["ca", "f", "byte:195", "byte:169"].map(
      (key) => tokenIdentityStyle(key).color
    )
  ).size,
  4
);
assert.equal(
  new Set([0, 1, 2].map((index) => tokenIdentityStyle(`patch:${index}`).color))
    .size,
  3
);
checks.push(
  "Worked glyphs, four-piece merge row and three patch groups have distinct stable identity hues"
);
const files = [
  directory + "ByteTokenizationDrawings.jsx",
  directory + "ByteTokenizationLabs.jsx",
  directory + "byte-tokenization-labs.css",
  directory + "token-identity-colors.js",
  directory + "token-identity-colors.css",
  "src/learn/data/byte-tokenization-model.js",
  "scripts/verify-byte-colour-feedback.mjs",
];
fs.mkdirSync(root + "colour-feedback-evidence", { recursive: true });
fs.writeFileSync(
  root + "colour-feedback-evidence/source-check.json",
  JSON.stringify(
    {
      date: "2026-10-06",
      reviewer: "author-only",
      checks,
      sourceBindings: files.map((path) => ({ path, sha256: hash(path) })),
      limits:
        "Source/invariant/identity checks only; fresh colour browser and personally inspected paint are recorded separately. Old receipts remain frozen.",
    },
    null,
    2
  ) + "\n"
);
console.log(`${checks.length} scoped byte colour source groups passed.`);
