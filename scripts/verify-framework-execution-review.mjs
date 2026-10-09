// Independent complementary invariants: conservation/identity, not a replay of author suites.
import assert from 'node:assert/strict';
import { scheduleRequests, cachePages } from '../src/learn/data/serving-framework-models.js';
import { retrieveEvidence, packEvidence, evidenceDocuments, lexicalWords } from '../src/learn/data/application-framework-models.js';
import { replayEffect, workflowRoute } from '../src/learn/data/agent-workflow-models.js';

let schedules = 0;
for (const prompt of [1, 7, 10]) for (const arrival of [0, 4]) for (const budget of [1, 3, 8]) for (const continuous of [true, false]) {
  const result = scheduleRequests(prompt, arrival, budget, continuous);
  for (const [name, expectedPrompt, expectedOutput, start] of [['A', prompt, 3, 0], ['B', 2, 2, arrival], ['C', 1, 2, 2]]) {
    const actions = result.events.filter(event => event.actions[name]);
    const prefill = actions.filter(event => event.actions[name][0] === 'P');
    const decode = actions.filter(event => event.actions[name][0] === 'D');
    assert.equal(prefill.reduce((sum, event) => sum + Number(event.actions[name].slice(1)), 0), expectedPrompt);
    assert.equal(decode.length, expectedOutput - 1);
    assert(actions.every(event => event.tick >= start));
    assert.equal(result.completed[name].first, prefill.at(-1).tick + 1);
    assert.equal(result.completed[name].finish, actions.at(-1).tick + 1);
  }
  for (const event of result.events) assert.equal(event.used, Object.values(event.actions).reduce((sum, action) => sum + Number(action.slice(1)), 0));
  schedules++;
}
let pageMaps = 0;
for (const first of [1, 5, 12]) for (const second of [2, 6, 12]) for (const block of [2, 4, 8]) for (const prefix of [0, 5, 12]) {
  const plan = cachePages(first, second, block, prefix);
  const occupied = new Set();
  for (const [request, length] of [[0, first], [1, second]]) {
    for (let token = 0; token < length; token++) occupied.add(`${plan.maps[request][Math.floor(token / block)]}:${token % block}`);
  }
  assert.equal(occupied.size, plan.useful);
  assert.equal(new Set(plan.maps.flat()).size, plan.physical);
  assert.equal(plan.slack, plan.capacity - occupied.size);
  pageMaps++;
}
let retrievalLimits = 0;
for (const term of ['file', 'exception', 'key', 'with', 'banana']) {
  const result = retrieveEvidence(term, 0, 0);
  const frequency = evidenceDocuments.filter(doc => lexicalWords(doc.text).includes(term)).length;
  const rarity = frequency ? Math.log(5 / (frequency + .5)) : 0;
  for (const doc of result) assert(Math.abs(doc.score - (doc.words.includes(term) ? rarity : 0)) < 1e-14);
  assert.deepEqual(retrieveEvidence(term), retrieveEvidence(`${term} ${term}`));
  retrievalLimits++;
}
for (const capacity of [20, 30, 60, 140]) {
  const result = packEvidence('file exception', capacity, 10, 20, 3);
  assert.equal(result.used, result.candidates.filter(doc => doc.admitted).reduce((sum, doc) => sum + doc.words.length, 0));
  if (result.feasible) assert.equal(10 + 20 + result.used + result.unused, capacity);
  else assert(result.candidates.every(doc => !doc.admitted));
}
let replayCases = 0;
for (const window of ['before-effect', 'after-effect', 'after-checkpoint']) for (const deliveries of [1, 2, 4]) for (const receipt of [true, false]) {
  const result = replayEffect(window, deliveries, receipt);
  const expected = deliveries === 1 && window === 'before-effect' ? 0 : window === 'after-effect' && deliveries > 1 && !receipt ? 2 : 1;
  assert.equal(result.counter, expected);
  replayCases++;
}
for (const failures of [0, 1, 3]) for (const limit of [1, 3, 4]) {
  assert.equal(workflowRoute(false, failures, limit).effects, 0);
  assert.equal(workflowRoute(true, failures, limit).effects, failures < limit ? 1 : 0);
}
console.log(JSON.stringify({ schedules, pageMaps, retrievalLimits, packingCases: 4, replayCases, approvalCases: 18 }));
