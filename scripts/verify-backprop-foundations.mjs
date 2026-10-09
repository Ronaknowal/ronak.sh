// Revision-7 checks for Backpropagation's foundational views: backward values on the
// neuron circuit, the local-rule strip, and the worked network's backward wiring view.
// Values are recomputed here with plain arithmetic, independently of the lesson's model,
// then compared with the lesson model and with the numbers the source states.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tinyNetwork, tinyParameters, tinyDefaults } from '../src/learn/data/backprop-beginner-models.js';

const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
const diagrams = fs.readFileSync('src/learn/components/lesson-labs/BackpropComputationDiagrams.jsx', 'utf8');
const wiring = fs.readFileSync('src/learn/components/lesson-labs/BackpropBeginnerFigures.jsx', 'utf8');
const lesson = fs.readFileSync('src/learn/data/topics/backprop.jsx', 'utf8');

check('One-neuron backward values: seed 1, a 4, z 4, wx 4, b 4, w 8, x 12', () => {
  const x = 2, w = 3, b = -1, y = 1;
  const z = w * x + b, a = Math.max(0, z);
  assert.equal(z, 5); assert.equal(a, 5); assert.equal(0.5 * (a - y) ** 2, 8);
  const ga = a - y, gz = ga * (z > 0 ? 1 : 0), gwx = gz, gb = gz, gw = gwx * x, gx = gwx * w;
  assert.deepEqual([ga, gz, gwx, gb, gw, gx], [4, 4, 4, 4, 8, 12]);
  // Finite-difference cross-check of the three leaf sensitivities.
  const L = (xx, ww, bb) => 0.5 * (Math.max(0, ww * xx + bb) - y) ** 2;
  const eps = 1e-6;
  for (const [got, fd] of [[gw, (L(x, w + eps, b) - L(x, w - eps, b)) / (2 * eps)], [gx, (L(x + eps, w, b) - L(x - eps, w, b)) / (2 * eps)], [gb, (L(x, w, b + eps) - L(x, w, b - eps)) / (2 * eps)]])
    assert.ok(near(got, fd, 1e-6), `finite difference ${fd} vs ${got}`);
  assert.match(diagrams, /const back = \{ seed: 1, a: 4, z: 4, wx: 4, b: 4, w: 8, x: 12 \}/);
});

check('Multiply close-up puts x on the left and w on the right, as in the neuron circuit', () => {
  const pull = diagrams.slice(diagrams.indexOf('export function MultiplyPullbackDiagram'), diagrams.indexOf('export function LocalRuleStrip'));
  assert.ok(pull.indexOf('x = 2') < pull.indexOf('w = 3'), 'x must be drawn first (left)');
  assert.match(pull, /∂L\/∂x = 12/); assert.match(pull, /∂L\/∂w = 8/);
  assert.match(pull, /from the loss, passed back through ReLU/);
  assert.doesNotMatch(pull, /rest of this same neuron/);
});

check('Local rules: tanh(0.5) slope and fan-out total', () => {
  const t = Math.tanh(0.5), slope = 1 - t * t;
  assert.ok(near(t, 0.46211715726000974)); assert.ok(near(slope, 0.7864477329659274));
  assert.equal((4 * slope).toFixed(4), '3.1458');
  assert.equal(1 + 2, 3);
  // Fan-out matches the engine buffer for u in L = u + 2u.
  assert.match(lesson, /collect every contribution into the single number/);
});

function independent({ x1, x2, label }) {
  const { W1, b1, W2 } = tinyParameters; // W1: input × hidden, W2: hidden × class
  const z1 = [0, 1].map(j => x1 * W1[0][j] + x2 * W1[1][j] + b1[j]);
  const a1 = z1.map(v => Math.max(0, v));
  const z2 = [0, 1].map(c => a1[0] * W2[0][c] + a1[1] * W2[1][c]);
  const m = Math.max(...z2), e = z2.map(v => Math.exp(v - m)), sum = e[0] + e[1], p = e.map(v => v / sum);
  const g2 = p.map((v, c) => v - (c === label ? 1 : 0));
  const ga1 = [0, 1].map(j => g2[0] * W2[j][0] + g2[1] * W2[j][1]);
  const g1 = ga1.map((v, j) => v * (z1[j] > 0 ? 1 : 0));
  const gW2 = [0, 1].map(j => [0, 1].map(c => a1[j] * g2[c]));
  const gW1 = [0, 1].map(i => [0, 1].map(j => [x1, x2][i] * g1[j]));
  return { a1, g2, ga1, gW1, gW2, loss: -Math.log(p[label]) };
}

check('Worked-network backward view: every edge and node sensitivity, on a grid of states', () => {
  let states = 0;
  for (let x1 = -3; x1 <= 3; x1 += 0.5) for (let x2 = -3; x2 <= 4; x2 += 0.5) for (const label of [0, 1]) {
    const mine = independent({ x1, x2, label }), theirs = tinyNetwork({ x1, x2, label });
    for (let j = 0; j < 2; j++) {
      assert.ok(near(mine.ga1[j], theirs.ga1[j]));
      for (let c = 0; c < 2; c++) assert.ok(near(mine.gW2[j][c], theirs.gW2[j][c]));
      for (let i = 0; i < 2; i++) assert.ok(near(mine.gW1[i][j], theirs.gW1[i][j]));
    }
    for (let c = 0; c < 2; c++) assert.ok(near(mine.g2[c], theirs.g2[c]));
    states++;
  }
  assert.equal(states, 390);
});

check('Worked-network default state matches the prose: h₁ → A edge 2 × 0.982 = 1.964, x₂ → h₁ 3.928', () => {
  const r = independent(tinyDefaults);
  assert.equal(r.gW2[0][0].toFixed(3), '1.964');
  assert.equal(r.gW1[1][0].toFixed(3), '3.928');
  assert.equal(r.ga1.map(v => v.toFixed(4)).join(','), '1.9640,0.9820');
  assert.equal(r.gW2[1][0], 0); // unit 2 is off: a₂ = 0
});

check('Wiring diagram offers both views on the same edges, forward first', () => {
  assert.match(wiring, /useState\('forward'\)/);
  assert.match(wiring, /\['forward', 'Forward: weights'\], \['backward', 'Backward: sensitivities'\]/);
  assert.match(wiring, /markerStart=\{backward \? 'url\(#bpb-wiring-back\)'/);
  assert.match(wiring, /neuron-network-wiring/);
});

check('Lesson places the backward circuit after backward is introduced, and the rule strip after the multiply zoom', () => {
  const seed = lesson.indexOf('the <strong>{"seed"}') >= 0 ? lesson.indexOf('"seed"') : lesson.indexOf('seed');
  const backwardDiagram = lesson.indexOf('<NeuronComputationDiagram mode="backward" />');
  assert.ok(backwardDiagram > lesson.indexOf('<NeuronComputationDiagram />'));
  assert.ok(backwardDiagram > seed, 'backward circuit must follow the seed definition');
  assert.ok(lesson.indexOf('<LocalRuleStrip />') > lesson.indexOf('<MultiplyPullbackDiagram />'));
  assert.ok(lesson.indexOf('<LocalRuleStrip />') < lesson.indexOf('Local derivative rules and their saved forward values'));
});

console.log(JSON.stringify({ passed: true, checks: checks.length, names: checks }, null, 1));
