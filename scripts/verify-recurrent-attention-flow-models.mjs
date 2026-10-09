import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { monotonicExpectation, temperatureRead } from '../src/learn/data/recurrent-attention-flow-models.js';

// Replay the meaningful retained numerical assertions into a distinct receipt.
// The historical verifier and receipt remain byte-for-byte untouched.
const record = 'docs/teaching/deep-learning-beginner/attention-mechanism-bahdanau-luong/reading-flow-models.json';
let source = fs.readFileSync('scripts/verify-recurrent-attention-models.mjs', 'utf8');
source = source.replace("const evidencePath = 'docs/teaching/evidence/recurrent-attention-models.json';", `const evidencePath = '${record}';`);
source = source.replace("date: '2026-09-26'", `date: '${new Date().toISOString()}'`);
for (const relative of ['./lib/prepared-lesson-renderer.mjs', '../src/learn/data/recurrent-attention-models.js']) {
  source = source.replace(relative, pathToFileURL(resolve('scripts', relative)).href);
}
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
const first = monotonicExpectation([.5, .5, .5]);
first.chosen.forEach((value, index) => close(value, [.5, .25, .125][index]));
close(first.unselected, .125);
const second = monotonicExpectation([.5, .5, .5], first.chosen);
second.chosen.forEach((value, index) => close(value, [.25, .25, .1875][index]));
close(second.unselected, .3125);
assert.deepEqual(monotonicExpectation([0, 0, 0]).chosen, [0, 0, 0]);
assert.deepEqual(monotonicExpectation([1, 1, 1]).chosen, [1, 0, 0]);
assert.throws(() => monotonicExpectation([2]));
close(temperatureRead(1).context, 8);
close(temperatureRead(2).context, (2 + 10 * Math.sqrt(3)) / (1 + Math.sqrt(3)));
assert.throws(() => temperatureRead(0));
const report = JSON.parse(fs.readFileSync(record));
report.checks.push('Fresh monotonic reaching recurrence, two scans, complete no-selection/first-selection boundaries and positive-temperature weighted reads');
for (const file of ['scripts/verify-recurrent-attention-flow-models.mjs', 'src/learn/data/recurrent-attention-flow-models.js']) {
  report.reviewedFiles[file] = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
report.scope = 'Current pure numerical helpers and conserved saved traces; no browser/native-training assertion.';
fs.writeFileSync(record, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: report.checks.length, receipt: record }));
