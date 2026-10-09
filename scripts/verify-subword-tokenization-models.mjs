import assert from "node:assert/strict";
import fs from "node:fs";
import { trainBpe, encodeBpe, corpusCounts, unigramPaths, wordPieceTrace, validWordPiecePath } from "../src/learn/data/subword-tokenization-models.js";

const receipt = JSON.parse(fs.readFileSync("docs/teaching/tokenization/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/author-numerical.json", "utf8"));
let comparisons = 0;
for (const test of receipt.browser_parity_cases) {
  const actual = trainBpe(test.counts, test.budget);
  assert.deepEqual(actual.merges, test.merges);
  for (const [word, expected] of Object.entries(test.queries)) {
    assert.deepEqual(encodeBpe(word, actual.merges), expected);
    comparisons += 1;
  }
}
assert.equal(trainBpe({ aaaa: 2 }, 1).states[0].pairs[0].count, 6);
assert.equal(trainBpe({ aaaa: 2 }, 1).states[0].totalSymbols - trainBpe({ aaaa: 2 }, 1).states[1].totalSymbols, 4);
assert.equal(trainBpe(corpusCounts(""), 20).states[0].totalSymbols, 0);
assert.deepEqual(trainBpe({ low: 0 }, 0).alphabet, []);
assert.throws(() => corpusCounts("</w>"));
assert.deepEqual(wordPieceTrace("abc", ["a", "ab", "##bc"]).tokens, ["[UNK]"]);
assert.deepEqual(validWordPiecePath("abc", ["a", "ab", "##bc"]), ["a", "##bc"]);
assert.deepEqual(wordPieceTrace("", []).tokens, []);
for (let percent = 1; percent < 100; percent += 1) {
  const model = unigramPaths(percent / 100);
  assert.ok(Math.abs(model.wholePosterior + model.splitPosterior - 1) < 1e-12);
  assert.ok(Math.abs(model.updatedWhole + 2 * model.updatedSingle - 1) < 1e-12);
  assert.deepEqual(model.best, percent <= 17 ? ["a", "b"] : ["ab"]);
}
assert.deepEqual(unigramPaths(.6, false).best, ["a", "b"]);
assert.equal(unigramPaths(.6, false).updatedSingle, .5);
console.log(JSON.stringify({ pythonParityCases: receipt.browser_parity_cases.length, queryComparisons: comparisons, probabilityTicks: 99, edgeCases: "overlap, Unicode ties, empty corpus/query, missing continuation, no whole piece" }));
