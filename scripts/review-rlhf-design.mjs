import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory = 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback';
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const p = 1 / (1 + Math.exp(.2));
const delta = [0, -.1, .7];
const advantages = delta.map((_, i) => delta.slice(i).reduce((sum, value, j) => sum + .8 ** j * value, 0));
assert.ok(Math.abs(advantages[0] - .368) < 1e-12);
assert.ok(Math.abs(advantages[1] - .46) < 1e-12);
const gradient = [(p - 1) * 2, (p - 1) * -2];
const update = [.1 - .1 * gradient[0], .2 - .1 * gradient[1]];
const policies = [.6, .3, .1], reference = [.4, .4, .2];
const terms = policies.map((v, i) => v * Math.log(v / reference[i]));
assert.ok(terms[1] < 0 && terms.reduce((a, b) => a + b) > 0);
const cases = [];
for (const advantage of [-2, 2]) for (const ratio of [.5, .8, 1, 1.2, 1.5]) {
  const value = Math.min(ratio * advantage, Math.min(1.2, Math.max(.8, ratio)) * advantage);
  const branch = advantage >= 0 ? Math.min(ratio, 1.2) * advantage : Math.max(ratio, .8) * advantage;
  assert.equal(value, branch); cases.push({ advantage, ratio, value });
}
fs.writeFileSync(`${directory}/design-review-checks.json`, JSON.stringify({
  reviewer: 'root', source: Object.fromEntries(['design.md', 'research.md', 'assessment.md'].map(name => [name, sha(`${directory}/${name}`)])),
  interpretation: 'Complementary stipulated arithmetic only; no study, code or visual-runtime acceptance.',
  advantages, changedPractice: { p, gradient, update }, signedKlTerms: terms, ppoBranches: cases,
}, null, 2) + '\n', { flag: 'wx' });
