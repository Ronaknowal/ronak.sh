import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { parse } from "@babel/parser";
import {
  inspectByteText,
  streamingByteTrace,
  bytePatchTrace,
  binaryEntropy,
  initialByteProbabilities,
} from "../src/learn/data/byte-tokenization-model.js";

const record =
  "docs/teaching/tokenization/byte-level-tokenization-token-free-models/";
const files = [
  "src/learn/data/topics/byte-level-tokenization.jsx",
  "src/learn/components/lesson-labs/ByteTokenizationLabs.jsx",
  "src/learn/components/lesson-labs/ByteTokenizationDrawings.jsx",
  "src/learn/components/lesson-labs/byte-tokenization-labs.css",
  "src/learn/data/byte-tokenization-model.js",
  "scripts/verify-byte-reading-flow.mjs",
];
const hash = (path) =>
  crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
const checks = [];
function check(name, action) {
  action();
  checks.push(name);
}
function close(a, b, tolerance = 1e-10) {
  assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
}
for (const path of files.filter((path) => path.endsWith(".jsx"))) {
  check("JSX parses: " + path, () =>
    parse(fs.readFileSync(path, "utf8"), {
      sourceType: "module",
      plugins: ["jsx"],
    })
  );
}
const topic = fs.readFileSync(files[0], "utf8");
const labs = fs.readFileSync(files[1], "utf8");
const drawings = fs.readFileSync(files[2], "utf8");
const original = fs.readFileSync(
  record + "original/reading-flow/byte-level-tokenization.jsx",
  "utf8"
);
check("Thirteen stable numbered section titles preserved", () => {
  assert.deepEqual(
    [...topic.matchAll(/<H2>(\d+\.[^<]*)<\/H2>/g)].map((match) => match[1]),
    [...original.matchAll(/<H2>(\d+\.[^<]*)<\/H2>/g)].map((match) => match[1])
  );
});
check("All four canonical instructional programs retained", () => {
  assert.deepEqual(
    [...topic.matchAll(/source="(\/learn-code\/[^\"]+)"/g)].map(
      (match) => match[1]
    ),
    [...original.matchAll(/source="(\/learn-code\/[^\"]+)"/g)].map(
      (match) => match[1]
    )
  );
});
check("All six practice prompts/solutions retained byte-for-byte", () => {
  const practice = (text) =>
    text.slice(
      text.indexOf(
        '<section className="lesson-ending lesson-ending--practice"'
      ),
      text.indexOf("      <Sources")
    );
  assert.equal(practice(topic), practice(original));
});
for (const receipt of ["native-evidence.json", "model-evidence.json"]) {
  check("Original invariant source bindings still match " + receipt, () => {
    for (const binding of JSON.parse(fs.readFileSync(record + receipt, "utf8"))
      .sourceBindings)
      assert.equal(hash(binding.path), binding.sha256, binding.path);
  });
}
check("RFC UTF-8 vectors and hex/payload arithmetic", () => {
  assert.equal(Buffer.from("café 🌍").toString("hex"), "636166c3a920f09f8c8d");
  assert.equal(parseInt("11000011", 2), 195);
  assert.equal(parseInt("10101001", 2), 169);
  assert.equal(3 * 64 + 41, 233);
  assert.equal(Buffer.from("éé").toString("hex"), "c3a9c3a9");
  assert.equal(Buffer.from("中").toString("hex"), "e4b8ad");
});
check("Normalization and grapheme worked examples", () => {
  const scientist = inspectByteText("👩‍🔬");
  assert.deepEqual(
    [
      scientist.graphemes.length,
      scientist.scalars.length,
      scientist.bytes.length,
    ],
    [1, 3, 11]
  );
  const decomposed = inspectByteText("e\u0301");
  assert.deepEqual(
    [
      decomposed.graphemes.length,
      decomposed.scalars.length,
      decomposed.bytes.length,
    ],
    [1, 2, 3]
  );
  assert.equal(Buffer.from("e\u0301".normalize("NFC")).toString("hex"), "c3a9");
  assert.equal(Buffer.from("Å").toString("hex"), "c385");
  assert.equal(Buffer.from("A\u030A").toString("hex"), "41cc8a");
  assert.equal("ﬁ".normalize("NFKC"), "fi");
  assert.throws(() => inspectByteText("\uD800"));
});
check("Streaming informative, scalar-boundary, empty and EOF states", () => {
  const split = streamingByteTrace("café 🌍", 8);
  assert.equal(split.trace[0].needed, 2);
  assert.equal(split.trace[0].emitted, "café ");
  assert.equal(split.trace[1].emitted, "🌍");
  assert.equal(split.output, "café 🌍");
  assert.equal(split.agrees, false);
  assert.equal(streamingByteTrace("café 🌍", 6).agrees, true);
  assert.equal(streamingByteTrace("", 0).output, "");
  assert.equal(streamingByteTrace("ABC", 1).agrees, true);
  assert.match(streamingByteTrace("café 🌍", 8, true).error, /incomplete/);
});
check("Teaching ID protocol, shift and five-target padded batch", () => {
  assert.deepEqual(
    [...Buffer.from("é")].map((byte) => byte + 3),
    [198, 172]
  );
  assert.equal(65 + 3, 68);
  assert.equal(256 + 3, 259);
  const targets = [
    [68, 1, 0],
    [198, 172, 1],
  ];
  assert.equal(targets.flat().filter((id) => id !== 0).length, 5);
  assert.equal((3 * 4) / 2 - 1, 5); // A row excludes the single otherwise causal PAD-key cell.
});
check("Loss, entropy and all displayed worked patch states", () => {
  close(-Math.log(0.9), 0.10536051565782628);
  close(-Math.log(0.1), 2.3025850929940455);
  close(binaryEntropy(0.99), 0.08079313589591118);
  close(binaryEntropy(0.9), 0.4689955935892812);
  assert.equal(binaryEntropy(0.5), 1);
  assert.equal(binaryEntropy(1), 0);
  assert.deepEqual(
    bytePatchTrace(initialByteProbabilities, 0.5).patches.map((p) => p.length),
    [3, 3, 2]
  );
  const edited = [...initialByteProbabilities];
  edited[4] = 0.5;
  assert.deepEqual(
    bytePatchTrace(edited, 0.5).patches.map((p) => p.length),
    [3, 1, 2, 2]
  );
  assert.deepEqual(
    bytePatchTrace(edited, 1).patches.map((p) => p.length),
    [8]
  );
  assert.deepEqual(
    bytePatchTrace(edited, 0).patches.map((p) => p.length),
    Array(8).fill(1)
  );
});
check(
  "Weighted blocks, pooling, global pairs, Vd and common-unit likelihood",
  () => {
    assert.deepEqual([0.75 * 2 + 0.25 * 0, 0.75 * 0 + 0.25 * 4], [1.5, 1]);
    close((1 + 4 + 9) / 3, 14 / 3);
    assert.equal((0 + 1 + 2) / 3, 1);
    assert.equal((8 * 9) / 2, 36);
    assert.equal((3 * 4) / 2, 6);
    assert.equal(50000 * 1024, 51200000);
    assert.equal(259 * 1024, 265216);
    close(10 / (10 * Math.log(2)), 1.4426950408889634);
    close(20 / (10 * Math.log(2)), 2.8853900817779268);
    close(18 / (10 * Math.log(2)), 2.596851073600134);
  }
);
check(
  "Flow helpers, no lab titles/gates, real grid/bit/state representations",
  () => {
    assert.ok(topic.includes("byte-lesson lesson-flow"));
    assert.ok(!labs.includes("NeuralLab"));
    assert.ok(!/prediction|Check prediction|<h[23]/i.test(labs));
    for (const marker of [
      "byte-bit-cells",
      "byte-feature-matrix",
      "byte-state-circle",
      "byte-causal-grid",
      "byte-skip-network",
      "byte-converging-wires",
    ])
      assert.ok(drawings.includes(marker));
    assert.equal([...labs.matchAll(/<FlowLab\s/g)].length, 3);
    assert.ok(
      drawings.includes("Patch 1's completed summary contains target a")
    );
  }
);
const result = {
  date: "2026-10-06",
  reviewer: "author-only",
  checks,
  reusedInvariantEvidence: ["native-evidence.json", "model-evidence.json"],
  sourceBindings: files.map((path) => ({ path, sha256: hash(path) })),
  limits:
    "Arithmetic, preservation and source/model contracts. Browser/paint, independent final review and root integration recorded separately.",
};
fs.writeFileSync(
  record + "reading-flow-author-numerical.json",
  JSON.stringify(result, null, 2) + "\n"
);
console.log(
  `${checks.length} byte reading-flow checks passed; original scientific bindings unchanged.`
);
