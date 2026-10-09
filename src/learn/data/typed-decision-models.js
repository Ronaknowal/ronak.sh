// Bounded, independent arithmetic for the Typed Decision lesson.
// These functions never train or run the recorded neural models.
export const candidateColors = ['#7db8ff', '#ff997e', '#b5a0ff', '#e8bd68', '#6dd4dd', '#ef95c4'];
export const roleColors = ['#b5a0ff', '#7db8ff', '#e8bd68', '#6dd4dd'];
export const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
export const intentNames = ['arrival', 'delivery estimate', 'linking', 'not working', 'lost / stolen', 'unrecognized payment'];
export const sum = values => values.reduce((total, value) => total + value, 0);
export const dot = (left, right) => sum(left.map((value, index) => value * right[index]));
export const argmax = values => values.indexOf(Math.max(...values));
export const entropy = probabilities => -sum(probabilities.map(p => p > 0 ? p * Math.log(p) : 0));

export function probability(values) {
  if (!values.length || values.some(x => !Number.isFinite(x) || x < 0) || Math.abs(sum(values) - 1) > 1e-10) {
    throw new Error('A probability vector needs finite nonnegative entries summing to one.');
  }
  return values;
}

export function softmaxTrace(logits, valid = logits.map(() => true), temperature = 1) {
  if (logits.length !== valid.length || !valid.some(Boolean)) throw new Error('No valid candidate: normalization is undefined.');
  if (!(temperature > 0) || !Number.isFinite(temperature) || logits.some(x => !Number.isFinite(x))) {
    throw new Error('Logits must be finite and temperature must be positive.');
  }
  const maximum = Math.max(...logits.filter((_, i) => valid[i]));
  const shifted = logits.map((x, i) => valid[i] ? (x - maximum) / temperature : null);
  const exponents = shifted.map(x => x == null ? 0 : Math.exp(x));
  const denominator = sum(exponents);
  return { maximum, shifted, exponents, denominator, probabilities: exponents.map(x => x / denominator) };
}

export function ceStep(logits, target, rate) {
  probability(target);
  const p = softmaxTrace(logits).probabilities;
  const terms = p.map((x, i) => target[i] === 0 ? 0 : -target[i] * Math.log(x));
  const gradient = p.map((x, i) => x - target[i]);
  const after = logits.map((x, i) => x - rate * gradient[i]);
  return { p, terms, gradient, loss: sum(terms), after, afterP: softmaxTrace(after).probabilities };
}

export function simplexPoint(p, size = 300) {
  // Half-plane intersections can have a -1e-16 barycentric residue on an edge.
  // Keep the exact derived position rather than projecting it into a different region.
  if (p.length !== 3 || p.some(x => !Number.isFinite(x) || x < -1e-12) || Math.abs(sum(p) - 1) > 1e-10) {
    throw new Error('Point lies outside the probability simplex.');
  }
  // Equal physical axes: triangle side = size, height = sqrt(3)/2 size.
  return [35 + size * (p[1] + p[2] / 2), 35 + size * Math.sqrt(3) / 2 * (1 - p[2])];
}

export function stickProbability(first, shareOfRest) {
  return probability([first, (1 - first) * shareOfRest, (1 - first) * (1 - shareOfRest)]);
}

export function scores(truth, report) {
  probability(truth);
  probability(report);
  const norm = Math.sqrt(dot(report, report));
  const log = sum(truth.map((p, i) => p === 0 ? 0 : report[i] === 0 ? -Infinity : p * Math.log(report[i])));
  const brier = 2 * dot(truth, report) - dot(report, report) - 1;
  const spherical = dot(truth, report) / norm;
  const kl = sum(truth.map((p, i) => p === 0 ? 0 : report[i] === 0 ? Infinity : p * Math.log(p / report[i])));
  const brierRegret = sum(truth.map((p, i) => (p - report[i]) ** 2));
  return { log, brier, spherical, kl, brierRegret };
}

export function ordinalTrace(probabilities, actual, rubric = probabilities.map((_, i) => i)) {
  probability(probabilities);
  const cumulative = probabilities.slice(0, -1).map((_, i) => sum(probabilities.slice(0, i + 1)));
  const observed = cumulative.map((_, i) => actual <= i ? 1 : 0);
  const terms = cumulative.map((x, i) => (x - observed[i]) ** 2);
  return { cumulative, observed, terms, rps: sum(terms) / terms.length, expectation: dot(probabilities, rubric) };
}

export const fixedNoise = [[.8, -.3, -.5], [-.4, 1.1, -.7], [-1, .2, .8], [.6, .4, -1], [.1, -.7, .6]];
export function reportSamples(sigma, center = [.4, -.1, -.3]) {
  const mean = sum(center) / center.length;
  return fixedNoise.map(noise => {
    const logits = center.map((value, i) => value - mean + sigma * noise[i]);
    const p = softmaxTrace(logits).probabilities;
    return { noise, logits, p, reward: scores([.6, .3, .1], p).log + .5 * scores([.6, .3, .1], p).spherical,
      score: noise.map(value => value / sigma) };
  });
}

export function clippedReward(truth, report, sphericalWeight) {
  return sum(truth.map((p, i) => p * Math.max(Math.log(Math.max(report[i], 1e-12)), -9.21)))
    + sphericalWeight * dot(truth, report) / Math.sqrt(dot(report, report));
}

export function expectedCosts(p, costs, reviewCost = null) {
  probability(p);
  // Rows are true outcomes. Columns are actions.
  const contributions = costs.map((row, y) => row.map(cost => p[y] * cost));
  const risk = costs[0].map((_, action) => sum(contributions.map(row => row[action])));
  if (reviewCost != null) risk.push(reviewCost);
  const minimum = Math.min(...risk);
  const ties = risk.map((x, i) => Math.abs(x - minimum) < 1e-12 ? i : null).filter(x => x != null);
  return { contributions, risk, ties, selected: ties[0] };
}

export function costRegions(costs, reviewCost) {
  const coefficients = costs[0].map((_, action) => [costs[0][action], costs[1][action] - costs[0][action], costs[2][action] - costs[0][action]]);
  coefficients.push([reviewCost, 0, 0]);
  return coefficients.map((current, index) => {
    let polygon = [[0, 0], [1, 0], [0, 1]];
    coefficients.forEach((other, j) => {
      if (j === index || !polygon.length) return;
      const difference = point => current[0] - other[0] + (current[1] - other[1]) * point[0] + (current[2] - other[2]) * point[1];
      const next = [];
      polygon.forEach((point, k) => {
        const following = polygon[(k + 1) % polygon.length];
        const left = difference(point);
        const right = difference(following);
        if (left <= 0) next.push(point);
        if ((left < 0 && right > 0) || (left > 0 && right < 0)) {
          const t = left / (left - right);
          next.push(point.map((value, axis) => value + t * (following[axis] - value)));
        }
      });
      polygon = next;
    });
    return polygon.map(([b, c]) => [1 - b - c, b, c]);
  });
}

export function reliability(probabilities, targets, binCount) {
  return Array.from({ length: binCount }, (_, index) => {
    const ids = probabilities.map((row, i) => [row, i]).filter(([row]) => Math.min(binCount - 1, Math.floor(Math.max(...row) * binCount)) === index);
    return { lower: index / binCount, upper: (index + 1) / binCount, count: ids.length,
      confidence: ids.length ? sum(ids.map(([row]) => Math.max(...row))) / ids.length : null,
      accuracy: ids.length ? sum(ids.map(([row, i]) => Number(argmax(row) === targets[i]))) / ids.length : null };
  });
}

export function confusion(probabilities, targets) {
  const matrix = Array.from({ length: probabilities[0].length }, () => probabilities[0].map(() => 0));
  probabilities.forEach((row, i) => { matrix[targets[i]][argmax(row)] += 1; });
  return matrix;
}

export function routeRows(probabilities, fallbackProbabilities, targets, threshold) {
  const rows = probabilities.map((p, i) => {
    const cheap = argmax(p);
    const fallback = argmax(fallbackProbabilities[i]);
    const act = Math.max(...p) > threshold;
    const predicted = act ? cheap : fallback;
    const correct = predicted === targets[i];
    return { act, cheap, fallback, predicted, correct, cost: (act ? 0 : .5) + (correct ? 0 : 10) };
  });
  const cheap = rows.filter(row => row.act);
  return { rows, cheapCount: cheap.length, coverage: cheap.length / rows.length,
    cheapWrong: cheap.filter(row => !row.correct).length,
    fallbackWrong: rows.filter(row => !row.act && !row.correct).length,
    wrong: rows.filter(row => !row.correct).length,
    selectiveRisk: cheap.length ? cheap.filter(row => !row.correct).length / cheap.length : null,
    meanCost: sum(rows.map(row => row.cost)) / rows.length };
}

export function encodeMini(request) {
  const tokens = ['<cls>'];
  const roles = ['question'];
  const add = (text, role) => (text.toLowerCase().match(/[a-z]+/g) || []).forEach(word => {
    tokens.push(word); roles.push(role);
  });
  const special = (word, role) => { tokens.push(word); roles.push(role); };
  add(request.question, 'question'); special('<sep>', 'question');
  const markers = [];
  request.options.forEach((option, i) => {
    markers.push(tokens.length); special('<option>', i); add(option.description, i); special('<sep>', i);
  });
  add(request.state, 'state'); special('<sep>', 'state');
  return { tokens, roles, markers };
}

export const miniRequest = {
  question: 'Which event?', state: 'My card has not arrived.',
  options: [{ id: 'arrival', description: 'not arrived' }, { id: 'estimate', description: 'delivery time' }, { id: 'lost', description: 'received then lost' }],
};
