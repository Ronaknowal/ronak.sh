import assert from 'node:assert/strict';
import { accumulationComparison, trainingMemoryBudget } from '../src/learn/data/training-acceleration-models.js';
let checks = 0;
const close = (a, b) => { assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`); checks++; };
for (const weight of [-1, 0, .5, .7, 2]) {
  for (const size of [1, 2, 3, 4]) {
    const result = accumulationComparison(weight, size);
    close(result.correct, (30 * weight - 17) / 4);
    close(result.correctWeight, weight - .1 * result.correct);
    if (size !== 3) close(result.correct, result.meanOfMeans);
  }
}
close(accumulationComparison(.5, 3).wrongWeight, 2 / 3);
for (const stage of [0, 1, 2, 3]) {
  const oneWorker = trainingMemoryBudget(1, 8, 1, stage, false);
  close(oneWorker.baselineTotal, 24);
  close(oneWorker.proposedTotal, 24);
}
close(trainingMemoryBudget(1, 8, 4, 1, false).proposedTotal, 18);
close(trainingMemoryBudget(1, 8, 4, 2, false).proposedTotal, 15);
close(trainingMemoryBudget(1, 8, 4, 3, true).proposedTotal, 8);
close(trainingMemoryBudget(.1, 0, 8, 3, true).proposedTotal, .2);
console.log(JSON.stringify({ checks, passed: true }));
