import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { mixtureExperiment, vocabularyBudget, multilingualResults, samplingShares } from "../src/learn/data/multilingual-vocabulary-models.js";

const cases = [];
for (const masses of [[80, 15, 5], [1, 1, 1], [0, 1, 1], [1, 0, 0], [5, 15, 80]]) {
  for (const alpha of [0, .17, .5, 1]) {
    for (const merges of [0, 1, 4, 8, 16]) {
      const result = mixtureExperiment(masses, alpha, merges);
      assert(Math.abs(result.shares.reduce((a, b) => a + b, 0) - 1) < 1e-12);
      for (const row of result.rows) {
        for (const piece of row.pieces) {
          if (piece.tokens) assert.equal(piece.tokens.join("").replaceAll("</w>", ""), piece.word);
        }
      }
      cases.push({ masses, alpha, merges, weighted: result.weighted, selected: result.model.merges,
        pieces: result.rows.flatMap(row => row.pieces) });
    }
  }
}
const python = process.env.LESSON_PYTHON || "scratch/framework-lesson-runtime/Scripts/python.exe";
const comparison = spawnSync(python, ["-c", `import json,sys
sys.path.insert(0,'public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram')
from subword_tokenizers import train_bpe
rows=json.load(sys.stdin)
result=[]
for row in rows:
 model=train_bpe(row['weighted'],row['merges'])
 result.append({'merges':model.merges,'pieces':[model.encode_word(p['word']) if p['tokens'] is not None else None for p in row['pieces']]})
print(json.dumps(result,ensure_ascii=False))`], { input: JSON.stringify(cases), encoding: "utf8", env: { ...process.env, PYTHONUTF8: "1" } });
assert.equal(comparison.status, 0, comparison.stderr);
const oracle = JSON.parse(comparison.stdout);
cases.forEach((row, i) => {
  assert.deepEqual(row.selected, oracle[i].merges, JSON.stringify({ masses: row.masses, alpha: row.alpha, merges: row.merges }));
  assert.deepEqual(row.pieces.map(piece => piece.tokens), oracle[i].pieces);
});
assert.equal(samplingShares([0, 0, 0], .5), null);
assert.equal(mixtureExperiment([0, 0, 0], .5, 4), null);
assert.deepEqual(mixtureExperiment([1, 1, 1], 0, 4).rows, mixtureExperiment([1, 1, 1], 1, 4).rows);
assert.deepEqual(mixtureExperiment([80, 15, 5], 0, 0).rows.map(row => row.pieces), mixtureExperiment([80, 15, 5], 1, 0).rows.map(row => row.pieces));
const balancedPieces = mixtureExperiment([80, 15, 5], .5, 4).rows;
const rawPieces = mixtureExperiment([80, 15, 5], 1, 4).rows;
assert.equal(balancedPieces[0].pieces[1].tokens.length, 3);
assert.equal(rawPieces[0].pieces[1].tokens.length, 2);
assert.equal(balancedPieces[1].pieces[0].tokens.length, 2);
assert.equal(rawPieces[1].pieces[0].tokens.length, 3);
const defaultBudget = vocabularyBudget({ vocabulary: 128000, width: 4096, tied: true, baselineTokens: 1000, candidateTokens: 750 });
assert.equal(defaultBudget.parameters, 524288000);
assert.equal(defaultBudget.mebibytes, 1000);
const example = vocabularyBudget({ vocabulary: 64000, width: 2048, tied: false, baselineTokens: 1000, candidateTokens: 500 });
assert.equal(example.mebibytes, 500);
assert.equal(example.headRatio, 1);
assert.equal(example.attentionPairRatio, .25);
const native = JSON.parse(readFileSync("docs/teaching/tokenization/vocabulary-design-multilingual-tokenization/native-evidence.json", "utf8"));
for (const result of multilingualResults) {
  const recorded = native.sentencepiece.experiments.find(row => row.alpha === result.alpha && row.actual_vocabulary === result.vocabulary);
  assert.deepEqual(result.counts, ["eng_Latn", "hin_Deva", "zho_Hans"].map(language => recorded.audit[language].tokens));
}
const sources = ["src/learn/data/multilingual-vocabulary-models.js", "src/learn/data/subword-tokenization-models.js", "public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/subword_tokenizers.py", "scripts/verify-multilingual-vocabulary.mjs"];
const receipt = { checkedAt: new Date().toISOString(), cases: cases.length, checks: ["Python indexed BPE versus JavaScript full recount: weighted merge order and complete token sequences", "Zero-supported mass and normalization", "UTF-8/core spelling round trips for supported alphabet", "Matrix parameters/MiB/MAC/pair-count examples", "All twelve displayed multilingual counts match actual recorded SentencePiece runs"], sources: Object.fromEntries(sources.map(path => [path, createHash("sha256").update(readFileSync(path)).digest("hex")])) };
writeFileSync("docs/teaching/tokenization/vocabulary-design-multilingual-tokenization/model-evidence.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify({ cases: cases.length, status: "passed" }));
