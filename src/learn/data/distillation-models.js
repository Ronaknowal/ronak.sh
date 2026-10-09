// Finite teaching calculations; empirical observations live in separate assets.
export const colors = {
  teacher: '#75baff', student: '#ffcb72', fixed: '#b5bdcc', target: '#dd9bff',
  blocked: '#ff8c9e', event: ['#75baff', '#ffcb72', '#dc9aff', '#71d8d0'],
};
export const sum = values => values.reduce((total, value) => total + value, 0);
export function softmax(logits, temperature = 1) {
  const scaled = logits.map(value => value / temperature);
  const maximum = Math.max(...scaled);
  const weights = scaled.map(value => Math.exp(value - maximum));
  const total = sum(weights);
  return weights.map(value => value / total);
}
export const teacherLogits = [2, 0, -1, -3];
export const studentLogits = [.7, .2, -.1, -.8];
export function kl(q, p) {
  return sum(q.map((value, index) => value === 0 ? 0 : value * Math.log(value / p[index])));
}
export function entropy(q) {
  return -sum(q.map(value => value === 0 ? 0 : value * Math.log(value)));
}
export function loss(q, p, kind = 'forward', beta = .5) {
  if (kind === 'forward' || kind === 'native' && beta === 0) return kl(q, p);
  if (kind === 'reverse' || kind === 'native' && beta === 1) return kl(p, q);
  const mixture = p.map((value, index) => beta * q[index] + (1 - beta) * value);
  return beta * kl(q, mixture) + (1 - beta) * kl(p, mixture);
}
export function gradient(q, p, kind = 'forward', temperature = 1, scaled = true, beta = .5) {
  let values;
  if (kind === 'forward') values = p.map((value, index) => value - q[index]);
  else if (kind === 'reverse') {
    const value = kl(p, q);
    values = p.map((mass, index) => mass * (Math.log(mass / q[index]) - value));
  } else {
    const mixture = p.map((mass, index) => beta * q[index] + (1 - beta) * mass);
    const local = p.map((mass, index) => (1 - beta) * Math.log(mass / mixture[index]));
    const mean = sum(p.map((mass, index) => mass * local[index]));
    values = p.map((mass, index) => mass * (local[index] - mean));
  }
  return values.map(value => value / temperature * (scaled ? temperature ** 2 : 1));
}
export function update(temperature, rate, scaled = true, equal = false) {
  const z = equal ? [...teacherLogits] : [...studentLogits];
  const q = softmax(teacherLogits, temperature);
  const p = softmax(z, temperature);
  const g = gradient(q, p, 'forward', temperature, scaled);
  const next = z.map((value, index) => value - rate * g[index]);
  const multiplier = scaled ? temperature ** 2 : 1;
  return { z, q, p, g, next, before: multiplier * kl(q, p), after: multiplier * kl(q, softmax(next, temperature)) };
}
export function categorical(probabilities, uniform) {
  const total = sum(probabilities);
  let cumulative = 0;
  let last = -1;
  for (let index = 0; index < probabilities.length; index++) {
    if (probabilities[index] <= 0) continue;
    last = index;
    cumulative += probabilities[index] / total;
    if (uniform < cumulative) return index;
  }
  return last;
}
export const family = u => [u * u, 2 * u * (1 - u), (1 - u) ** 2];
export const restrictedTeacher = [.49, .02, .49];
export const teacherRows = [[.8, -.2], [.7, -.1], [-.2, .3]].map(row => softmax(row));
export function sequence(shift = 0, equalContinuation = false) {
  const q = teacherRows;
  const p = [[.2 + shift, -.3], [.1, -.5], [-.4, .7]].map(row => softmax(row));
  if (equalContinuation) [p[1], p[2]] = [q[1], q[2]];
  const joint = rows => rows[0].flatMap((mass, index) => rows[index + 1].map(value => mass * value));
  const qLeaf = joint(q);
  const pLeaf = joint(p);
  const local = p.map((row, index) => kl(row, q[index]));
  const future = p[0][0] * local[1] + p[0][1] * local[2];
  const detached = p.map((row, index) => gradient(q[index], row, 'reverse', 1, false)
    .map(value => value * (index === 0 ? 1 : p[0][index - 1])));
  const visitation = p[0].map((mass, index) => mass * (local[index + 1] - future));
  return { q, p, qLeaf, pLeaf, local, future, detached, visitation,
    full: [detached[0].map((value, index) => value + visitation[index]), detached[1], detached[2]],
    ce: entropy(qLeaf) + kl(qLeaf, pLeaf), reverse: kl(pLeaf, qLeaf) };
}
export function sampleSequence(count, seed, q, p) {
  let state = seed >>> 0;
  const counts = q.map(() => 0);
  for (let i = 0; i < count; i++) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    counts[categorical(q, state / 4294967296)]++;
  }
  return { counts, mean: -sum(counts.map((value, index) => value * Math.log(p[index]))) / count };
}
export function traceCheck(a, b, c, intermediate, product, answer) {
  return { final: answer === (a + b) * c, steps: intermediate === a + b && product === intermediate * c && answer === product };
}
export function cost(queries, upfront, teacher, student) {
  return { teacher: queries * teacher, student: upfront + queries * student,
    breakEven: teacher > student ? upfront / (teacher - student) : null };
}
