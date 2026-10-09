// Pure calculations for the training lesson. Scientific fits remain frozen assets.
export const expertColours = ['#82b4ff', '#e8b860', '#bb9aff', '#f093b7'];
export const sum = values => values.reduce((total, value) => total + value, 0);
export const dot = (left, right) => sum(left.map((value, index) => value * right[index]));
export const sigmoid = value => value >= 0
  ? 1 / (1 + Math.exp(-value))
  : Math.exp(value) / (1 + Math.exp(value));

export function softmax(logits) {
  const maximum = Math.max(...logits);
  const mass = logits.map(value => Math.exp(value - maximum));
  return mass.map(value => value / sum(mass));
}

export function logsumexp(logits) {
  const maximum = Math.max(...logits);
  return maximum + Math.log(sum(logits.map(value => Math.exp(value - maximum))));
}

export function topIds(scores, k) {
  return scores.map((score, id) => ({ score, id }))
    .sort((left, right) => right.score - left.score || left.id - right.id)
    .slice(0, k).map(item => item.id);
}

export function route(logits, k = 2, convention = 'selected', bias = null) {
  const affinity = convention === 'sigmoid' ? logits.map(sigmoid) : softmax(logits);
  const scores = affinity.map((value, id) => value + (bias?.[id] || 0));
  const ids = topIds(scores, k);
  const denominator = convention === 'full' ? 1 : sum(ids.map(id => affinity[id]));
  const gates = affinity.map((value, id) => ids.includes(id) ? value / denominator : 0);
  return { logits, affinity, scores, ids, gates, denominator };
}

export function mixtureTrace({
  logits = [Math.log(4), Math.log(2), 0], k = 2,
  convention = 'selected', returns = [[2, 0], [0, 3], [1, 1]],
  accepted = [true, true, true], upstream = [1, 1],
} = {}) {
  const routing = route(logits, k, convention);
  const contributions = returns.map((row, id) => row.map(value =>
    value * routing.gates[id] * Number(accepted[id])));
  const output = returns[0].map((_, coordinate) => sum(contributions.map(row => row[coordinate])));
  const objective = dot(output, upstream);
  const logitGradient = logits.map((_, id) => {
    const credit = accepted[id] && routing.ids.includes(id) ? dot(returns[id], upstream) : 0;
    if (convention === 'full') return routing.affinity[id] * (credit - objective);
    if (!routing.ids.includes(id)) return 0;
    const derivative = routing.gates[id] * (credit - objective);
    return convention === 'sigmoid' ? derivative * (1 - routing.affinity[id]) : derivative;
  });
  const returnGradient = returns.map((row, id) => row.map((_, coordinate) =>
    Number(accepted[id]) * routing.gates[id] * upstream[coordinate]));
  return { ...routing, returns, accepted, contributions, output, objective, logitGradient, returnGradient };
}

export function swiglu(x, gate, up, down) {
  const a = gate.map(row => dot(row, x));
  const b = up.map(row => dot(row, x));
  const activation = a.map(value => value * sigmoid(value));
  const product = activation.map((value, index) => value * b[index]);
  return { a, b, activation, product, output: down.map(row => dot(row, product)) };
}

export function capacityTrace(routes = [[0, 1], [0, 1], [0, 2], [0, 2]], capacity = 2, first = 0) {
  const experts = 3;
  const queues = Array.from({ length: experts }, () => []);
  const tokenOrder = routes.map((_, index) => index).sort((a, b) =>
    (a === first ? -1 : b === first ? 1 : a - b));
  for (const token of tokenOrder) {
    routes[token].forEach((expert, slot) => queues[expert].push({ token, slot, expert }));
  }
  const accepted = routes.map(row => row.map(() => false));
  queues.forEach(queue => queue.forEach((item, index) => {
    item.accepted = index < capacity;
    accepted[item.token][item.slot] = item.accepted;
  }));
  const expertReturns = [1, 2, 3];
  const updates = routes.map((row, token) =>
    sum(row.map((expert, slot) => accepted[token][slot] ? expertReturns[expert] / row.length : 0)));
  return { routes, queues, accepted, updates, rejected: accepted.flat().filter(value => !value).length,
    dropped: accepted.filter(row => !row.some(Boolean)).length };
}

export function binomialLoad(tokens = 512, experts = 8, k = 2, factor = 1) {
  const probability = k / experts;
  const capacity = Math.ceil(factor * tokens * probability);
  // Log-factorial keeps the complete finite PMF stable at the supported T <= 512.
  const factorials = [0];
  for (let n = 1; n <= tokens; n++) factorials.push(factorials[n - 1] + Math.log(n));
  const pmf = Array.from({ length: tokens + 1 }, (_, n) => {
    if (probability === 1) return Number(n === tokens);
    return Math.exp(factorials[tokens] - factorials[n] - factorials[tokens - n]
      + n * Math.log(probability) + (tokens - n) * Math.log1p(-probability));
  });
  return { tokens, experts, k, capacity, pmf, mean: tokens * probability,
    variance: tokens * probability * (1 - probability),
    tail: sum(pmf.map((mass, n) => n > capacity ? mass : 0)),
    rejectedShare: sum(pmf.map((mass, n) => Math.max(0, n - capacity) * mass)) / (tokens * probability) };
}

export function balance(probabilities, k = 1) {
  const tokens = probabilities.length;
  const experts = probabilities[0].length;
  const counts = Array(experts).fill(0);
  const ids = probabilities.map(row => topIds(row, k));
  ids.flat().forEach(id => counts[id]++);
  const hard = counts.map(value => value / (tokens * k));
  const soft = hard.map((_, id) => sum(probabilities.map(row => row[id])) / tokens);
  const gradient = probabilities.map(row => row.map((p, id) =>
    experts / tokens * p * (hard[id] - dot(hard, row))));
  return { probabilities, ids, counts, hard, soft, gradient,
    loss: experts * dot(hard, soft), cvSquared: experts * dot(hard, hard) - 1,
    peak: experts * Math.max(...hard) };
}

export function gradientTerms(alpha = 0.5, beta = 0, offset = 0) {
  const logits = [Math.log(.8) + offset, Math.log(.2) + offset];
  const task = mixtureTrace({ logits, k: 1, convention: 'full', returns: [[-1, 0], [0, 0]] });
  const balancing = balance([task.affinity]);
  const normalizer = logsumexp(logits);
  const taskGradient = task.logitGradient;
  const auxiliary = balancing.gradient[0].map(value => alpha * value);
  const z = task.affinity.map(value => beta * 2 * normalizer * value);
  const total = taskGradient.map((value, index) => value + auxiliary[index] + z[index]);
  const norm = values => Math.sqrt(dot(values, values));
  const divisor = norm(taskGradient) * norm(auxiliary);
  return { logits, task: taskGradient, auxiliary, z, total,
    updated: logits.map((value, index) => value - .1 * total[index]),
    cosine: divisor === 0 ? null : dot(taskGradient, auxiliary) / divisor };
}

export function scopeTrace(equal = false, moved = false) {
  const rows = equal ? [[.8, .2], [.8, .2], [.8, .2]] : [[.9, .1], [.8, .2], [.1, .9]];
  const groups = moved ? [[rows[0]], [rows[1], rows[2]]] : [rows.slice(0, 2), rows.slice(2)];
  const local = groups.map(group => balance(group));
  const global = balance(rows);
  return { rows, groups, local, global,
    weightedLocal: sum(local.map((item, index) => item.loss * groups[index].length / rows.length)),
    replicaScales: groups.map(group => 2 * group.length / rows.length) };
}

export function biasReplay(speed = .02, firstAffinity = .8) {
  const affinities = [[firstAffinity, .4, .3], [.75, .45, .2], [.7, .42, .28], [.72, .38, .31]];
  let bias = [0, 0, 0];
  const history = [];
  for (let step = 0; step < 12; step++) {
    const routes = affinities.map(row => {
      const ids = topIds(row.map((value, id) => value + bias[id]), 2);
      const mass = sum(ids.map(id => row[id]));
      return { ids, gates: ids.map(id => row[id] / mass) };
    });
    const counts = [0, 0, 0];
    routes.flatMap(item => item.ids).forEach(id => counts[id]++);
    const nextBias = bias.map((value, id) => value + speed * Math.sign(8 / 3 - counts[id]));
    history.push({ step, bias: [...bias], counts, routes, nextBias });
    bias = nextBias;
  }
  return { affinities, history };
}

export function expertBudget(refinement = 1, shared = 0) {
  const width = 24, originalExperts = 6, originalK = 2, originalHidden = 12;
  const experts = originalExperts * refinement;
  const active = originalK * refinement;
  const hidden = originalHidden / refinement;
  return { width, experts, active, hidden, shared, routed: experts - shared,
    selected: active - shared, expertParameters: experts * 3 * width * hidden,
    expertWork: active * 3 * width * hidden, routerParameters: (experts - shared) * width };
}

export function systemsTrace(placement = [0, 0, 1, 1], changed = false, block = 4, local = false) {
  const routes = changed ? [[0, 1], [0, 2], [0, 3], [0, 3]] : [[0, 1], [0, 2], [1, 3], [0, 3]];
  const sources = local ? [0, 0, 0, 0] : [0, 0, 1, 1];
  const owners = local ? [0, 0, 0, 0] : placement;
  const inputs = [[1, 2], [3, 4], [5, 6], [7, 8]];
  const gates = [[.75, .25], [.6, .4], [.2, .8], [.5, .5]];
  const requests = routes.flatMap((row, token) => row.map((expert, slot) => ({
    token, slot, expert, source: sources[token], destination: owners[expert],
    gate: gates[token][slot],
    returned: inputs[token].map(value => (expert + 1) * value),
  })));
  const output = inputs.map(() => [0, 0]);
  const inputGradient = inputs.map(() => [0, 0]);
  requests.forEach(item => {
    item.returned.forEach((value, coordinate) => { output[item.token][coordinate] += item.gate * value; });
    inputGradient[item.token] = inputGradient[item.token].map(value => value + item.gate * (item.expert + 1));
  });
  const counts = [0, 0, 0, 0];
  requests.forEach(item => counts[item.expert]++);
  const rankRows = [0, 0];
  counts.forEach((count, expert) => { rankRows[owners[expert]] += count; });
  const remote = requests.filter(item => item.source !== item.destination).length;
  return { requests, counts, rankRows, remote, inputs, output, inputGradient, owners,
    bytes: remote * 2 * 2 * 4,
    allocated: counts.map(count => count ? Math.ceil(count / block) * block : 0),
    equalPadding: Math.max(...counts) * counts.length };
}

export function savedPrediction(model, contextIndex, disabled = -1) {
  const parameters = model.parameters;
  const context = model.heldout_contexts[contextIndex];
  const x = context.flatMap(id => parameters.embedding[id]);
  const logits = parameters.moe_router.map(row => dot(row, x));
  const routing = route(logits, 2, 'sigmoid', model.bias);
  const expertOutputs = routing.ids.map(id => ({ id, ...swiglu(x,
    parameters.moe_gate[id], parameters.moe_up[id], parameters.moe_down[id]) }));
  const hidden = [...x];
  for (const expert of expertOutputs) {
    if (expert.id === disabled) continue;
    expert.output.forEach((value, coordinate) => { hidden[coordinate] += routing.gates[expert.id] * value; });
  }
  const headLogits = parameters.head.map((row, id) => dot(row, hidden) + parameters.head_bias[id]);
  const probabilities = softmax(headLogits);
  const target = model.heldout_targets[contextIndex];
  return { context, x, routing, expertOutputs, hidden, probabilities, target,
    nll: logsumexp(headLogits) - headLogits[target], top: topIds(probabilities, 8) };
}
