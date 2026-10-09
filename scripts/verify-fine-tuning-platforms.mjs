import assert from 'node:assert/strict';
import { lowRankUpdate, supervisedTokenTrace } from '../src/learn/data/fine-tuning-platform-models.js';
let checks = 0;
for (let answer = 0; answer <= 5; answer++) {
  for (let length = 4; length <= 11; length++) {
    for (const answerOnly of [true, false]) {
      const trace = supervisedTokenTrace(answer, length, answerOnly);
      const actualLength = Math.min(answer + 5, length);
      assert.equal(trace.activeCount, Math.max(0, actualLength - (answerOnly ? 4 : 1)));
      assert.equal(trace.rows.length, length);
      assert.ok(trace.rows.filter(row => row.active).every(row => row.source === row.position - 1 && row.attention));
      checks += 3;
    }
  }
}
for (const alpha of [0, .25, 2, 4]) {
  for (const first of [-1, 0, .2, 1]) {
    const result = lowRankUpdate(first, -.1, alpha);
    const x = [1, 2, -1], a = [1, -1, .5], base = [.5, -.5], b = [first, -.1];
    for (let output = 0; output < 2; output++) {
      const dense = base[output] + x.reduce((sum, value, input) => sum + value * (alpha * b[output] * a[input]), 0);
      assert.ok(Math.abs(dense - result.output[output]) < 1e-12);
      checks++;
    }
  }
}
console.log(JSON.stringify({ checks, passed: true }));
