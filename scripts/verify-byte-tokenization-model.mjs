import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { inspectByteText, streamingByteTrace, bytePatchTrace, initialByteProbabilities, binaryEntropy } from "../src/learn/data/byte-tokenization-model.js";

const composed = inspectByteText("café 🌍");
assert.equal(composed.scalars.length, 6);
assert.equal(composed.graphemes.length, 6);
assert.equal(composed.bytes.length, 10);
assert.equal(inspectByteText("cafe\u0301 🌍").scalars.length, 7);
assert.equal(inspectByteText("cafe\u0301 🌍", "NFC").bytes.length, 10);
assert.equal(inspectByteText("ﬁ", "NFKC").text, "fi");
assert.equal(inspectByteText("👩‍🔬").bytes.length, 11);
assert.equal(inspectByteText("👩‍🔬").graphemes.length, 1);
assert.throws(() => inspectByteText("\ud800"));
assert.throws(() => inspectByteText("x".repeat(49)));
let partitions = 0;
for (const text of ["", "ABC", "café 🌍", "A≢Α.", "👩‍🔬", "\ufeffA", "cafe\u0301"]) {
  const count = Buffer.byteLength(text, "utf8");
  for (let split = 0; split <= count; split += 1) {
    const result = streamingByteTrace(text, split);
    assert.equal(result.output, text);
    assert.equal(result.error, null);
    partitions += 1;
  }
}
assert.equal(streamingByteTrace("café 🌍", 8).trace[0].needed, 2);
assert.equal(streamingByteTrace("café 🌍", 8).agrees, false);
assert.equal(streamingByteTrace("café 🌍", 6).agrees, true);
assert.match(streamingByteTrace("café 🌍", 8, true).error, /incomplete/);
assert.equal(streamingByteTrace("ABC", 1, true).output, "AB");
assert.equal(binaryEntropy(0.5), 1);
assert.equal(binaryEntropy(1), 0);
assert.deepEqual(bytePatchTrace(initialByteProbabilities, 0.5).patches.map(p => p.length), [3,3,2]);
const edited = [...initialByteProbabilities]; edited[4] = 0.5;
assert.deepEqual(bytePatchTrace(edited, 0.5).patches.map(p => p.length), [3,1,2,2]);
assert.equal(bytePatchTrace(edited, 1).patches.length, 1);
assert.equal(bytePatchTrace(edited, 0).patches.length, 8);
let configurations = 0;
for (let selected = 0; selected < 8; selected += 1) {
  for (const probability of [0.5, 0.73, 0.99, 1]) {
    for (const threshold of [0, 0.08079313589591118, 0.5, 1]) {
      const values = [...initialByteProbabilities]; values[selected] = probability;
      const trace = bytePatchTrace(values, threshold);
      assert.deepEqual(trace.patches.flat(), [0,1,2,3,4,5,6,7]);
      for (let index = 1; index < 8; index += 1) assert.equal(trace.ids[index] > trace.ids[index-1], binaryEntropy(values[index]) > threshold);
      assert.equal(trace.patchPairs, trace.patches.length * (trace.patches.length + 1) / 2);
      configurations += 1;
    }
  }
}
const paths = ["src/learn/data/byte-tokenization-model.js", "scripts/verify-byte-tokenization-model.mjs"];
const report = { environment: { node: process.version, unicode: process.versions.unicode, icu: process.versions.icu },
  checks: { unicodeFixtures: "passed", streamPartitions: partitions, patchConfigurations: configurations, informativeAndNullStates: "passed" },
  sourceBindings: paths.map(path => ({ path, sha256: crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex") })) };
fs.writeFileSync("docs/teaching/tokenization/byte-level-tokenization-token-free-models/model-evidence.json", JSON.stringify(report, null, 2)+"\n");
console.log(report.checks);
