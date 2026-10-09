// Pure, constructed section-eight operators. No fitting or native program execution.
export const expressivenessNumber = (value, digits = 6) => value === null ? 'undefined' : value === 0 ? '0' : (Number(value.toFixed(digits)) === 0 ? value.toExponential(3) : String(Number(value.toFixed(digits)))).replaceAll('-', '−');
const sum = values => values.reduce((s, v) => s + v, 0),
  dot = (a, b) => sum(a.map((v, i) => v * b[i]));
export const multisetTrace = values => ({
  values: [...values],
  count: values.length,
  sum: sum(values),
  mean: values.length ? sum(values) / values.length : null,
  max: values.length ? Math.max(...values) : null,
  lifted: [sum(values), sum(values.map(v => v * v))],
  transformed: values.map(v => [v, v * v])
});
export function ginScalarTrace(epsilon = 0, first = 1) {
  const own = 2,
    neighbors = [first, 3],
    neighborSum = sum(neighbors),
    selfFactor = 1 + epsilon,
    selfProduct = selfFactor * own,
    input = selfProduct + neighborSum,
    affine = [input, -input],
    hidden = affine.map(v => Math.max(v, 0)),
    output = hidden[0] - hidden[1];
  return {
    own,
    neighbors,
    neighborSum,
    selfFactor,
    selfProduct,
    input,
    affine,
    hidden,
    output,
    epsilon
  };
}
const ginFeatures = [[1, .2], [-.4, 1.1], [.7, -.3], [1.8, .5]],
  ginEdges = [[0, 1], [1, 0], [2, 1], [1, 2]];
const initialGin = () => ({
  w1: [[.4, -.2], [-.1, .3], [.2, .5]],
  b1: [.2, -.1, .3],
  w2: [[.3, -.4, .2], [-.2, .1, .5]],
  b2: [.05, -.1],
  epsilon: .17
});
function ginForward(features, params) {
  const neighbors = features.map(row => row.map(() => 0));
  for (const [s, t] of ginEdges) features[s].forEach((v, c) => neighbors[t][c] += v);
  const own = features.map(row => row.map(v => (1 + params.epsilon) * v)),
    inputs = own.map((row, i) => row.map((v, c) => v + neighbors[i][c])),
    affine = inputs.map(row => params.w1.map((w, c) => dot(w, row) + params.b1[c])),
    hidden = affine.map(row => row.map(v => Math.max(v, 0))),
    output = hidden.map(row => params.w2.map((w, c) => dot(w, row) + params.b2[c]));
  return {
    neighbors,
    own,
    inputs,
    affine,
    hidden,
    output
  };
}
export function ginMappedTrace(trainEpsilon = true) {
  const parameters = initialGin(),
    features = ginFeatures.map(row => [...row]),
    before = ginForward(features, parameters),
    probe = features.map((_, n) => [1 + 2 * n, 2 + 2 * n].map(v => v / 7));
  const gradient = {
    w1: parameters.w1.map(row => row.map(() => 0)),
    b1: [0, 0, 0],
    w2: parameters.w2.map(row => row.map(() => 0)),
    b2: [0, 0],
    epsilon: 0
  };
  const inputPortGrad = features.map(() => [0, 0]);
  for (let n = 0; n < features.length; n++) {
    const hiddenGrad = parameters.w1.map((_, h) => sum(probe[n].map((v, o) => v * parameters.w2[o][h]))),
      affineGrad = hiddenGrad.map((v, h) => before.affine[n][h] > 0 ? v : 0);
    probe[n].forEach((v, o) => {
      gradient.b2[o] += v;
      before.hidden[n].forEach((h, c) => gradient.w2[o][c] += v * h);
    });
    affineGrad.forEach((v, h) => {
      gradient.b1[h] += v;
      before.inputs[n].forEach((x, c) => gradient.w1[h][c] += v * x);
    });
    inputPortGrad[n] = [0, 1].map(c => sum(affineGrad.map((v, h) => v * parameters.w1[h][c])));
    gradient.epsilon += dot(inputPortGrad[n], features[n]);
  }
  const inputDerivatives = inputPortGrad.map(row => row.map(v => (1 + parameters.epsilon) * v));
  for (const [s, t] of ginEdges) inputPortGrad[t].forEach((v, c) => inputDerivatives[s][c] += v);
  const updated = {};
  for (const key of ['w1', 'w2']) updated[key] = parameters[key].map((row, r) => row.map((v, c) => v - .03 * gradient[key][r][c]));
  for (const key of ['b1', 'b2']) updated[key] = parameters[key].map((v, c) => v - .03 * gradient[key][c]);
  updated.epsilon = trainEpsilon ? parameters.epsilon - .03 * gradient.epsilon : parameters.epsilon;
  return {
    features,
    edges: ginEdges.map(edge => [...edge]),
    parameters,
    before,
    probe,
    objective: sum(before.output.flatMap((row, n) => row.map((v, c) => v * probe[n][c]))),
    gradient,
    inputDerivatives,
    updated,
    after: ginForward(features, updated),
    trainEpsilon,
    mappedTrainableTensors: trainEpsilon ? 5 : 4,
    rate: .03
  };
}
export const pathFour = () => [[1], [0, 2], [1, 3], [2]],
  starFour = () => [[1, 2, 3], [0], [0], [0]];
export function refineJoint(labels, incoming) {
  const keys = labels.map((own, n) => JSON.stringify([own, incoming[n].map(s => labels[s]).sort((a, b) => String(a).localeCompare(String(b)))])),
    dictionary = new Map(),
    next = keys.map(key => {
      if (!dictionary.has(key)) dictionary.set(key, dictionary.size);
      return dictionary.get(key);
    });
  return {
    old: [...labels],
    keys,
    next,
    dictionary: Array.from(dictionary, ([key, label]) => ({
      key: JSON.parse(key),
      label
    }))
  };
}
export function refinementTrace(rounds = 1) {
  const left = pathFour(),
    right = starFour(),
    incoming = [...left, ...right.map(row => row.map(i => i + 4))],
    history = [Array(8).fill('A')],
    steps = [];
  for (let r = 0; r < rounds; r++) {
    const step = refineJoint(history.at(-1), incoming);
    steps.push(step);
    history.push(step.next);
  }
  return {
    left,
    right,
    incoming,
    history,
    steps,
    current: history.at(-1),
    last: steps.at(-1) ?? null,
    rounds
  };
}
export const cycleSix = () => Array.from({
  length: 6
}, (_, n) => [(n + 5) % 6, (n + 1) % 6]);
export const twoTriangles = () => Array.from({
  length: 6
}, (_, n) => Array.from({
  length: 3
}, (_, j) => 3 * Math.floor(n / 3) + j).filter(j => j !== n));
export function localGraphTrace(incoming, features, rounds) {
  const history = [[...features]];
  for (let r = 0; r < rounds; r++) {
    const old = history.at(-1);
    history.push(old.map((value, n) => value + sum(incoming[n].map(d => old[d]))));
  }
  return {
    incoming,
    history,
    output: history.at(-1),
    graphSum: sum(history.at(-1))
  };
}
export function structuralTrace(rounds = 1) {
  return {
    cycle: localGraphTrace(cycleSix(), Array(6).fill(1), rounds),
    triangles: localGraphTrace(twoTriangles(), Array(6).fill(1), rounds),
    changedCycle: localGraphTrace(cycleSix(), [2, 1, 1, 1, 1, 1], 2),
    changedTriangles: localGraphTrace(twoTriangles(), [2, 1, 1, 1, 1, 1], 2)
  };
}
