import {
  augmentedEffectExpectation,
  causalAncestors,
  latentCausalAmbiguity,
  offerPopulation,
  validateCausalGraph,
} from './causal-inference-models.js';

export {
  CAUSAL_PATH_PRESETS,
  CAUSAL_RULE_PRESETS,
  counterfactualResponseTypes,
  frontdoorPopulation,
  inspectDoRule,
  traceCausalPaths,
} from './causal-inference-models.js';

function bounded(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(label + ' must be finite and between ' + min + ' and ' + max + '.');
  }
}

export function assignmentComparison(lowAssignment = .2, highAssignment = .8) {
  const population = offerPopulation({ highShare: .5, lowAssignment, highAssignment });
  const selected = [0, 1].map(x => {
    const masses = population.strata.map(s => .5 * (x ? s.assignment : 1 - s.assignment));
    const total = masses[0] + masses[1];
    const contributions = masses.map((mass, z) => mass * population.outcomes[z][x]);
    return {
      x, masses, total, contributions,
      composition: total === 0 ? null : masses.map(mass => mass / total),
      risk: total === 0 ? null : (contributions[0] + contributions[1]) / total,
    };
  });
  const forced = [0, 1].map(x => ({
    x,
    shares: [.5, .5],
    contributions: population.outcomes.map(row => .5 * row[x]),
    risk: population.interventionRisks[x],
    rows: [0, 1].flatMap(z => [0, 1].map(y => ({
      z, x, y, mass: .5 * (y ? population.outcomes[z][x] : 1 - population.outcomes[z][x]),
    }))),
  }));
  return { ...population, selected, forced };
}

export function targetSupport(highTargetShare = .5, lowAssignment = .2, highAssignment = .8) {
  bounded(highTargetShare, 0, 1, 'Target high-activity share');
  // Assignment edits affect the same natural population. Target edits never alter its law.
  const natural = assignmentComparison(lowAssignment, highAssignment);
  const targetShares = [1 - highTargetShare, highTargetShare];
  const arms = [0, 1].map(x => {
    const cells = [0, 1].map(z => {
      const mass = natural.selected[x].masses[z], required = targetShares[z] > 0;
      return {
        z, x, targetWeight: targetShares[z], observedMass: mass, required,
        observedRisk: mass > 0 ? natural.outcomes[z][x] : null,
        modelRisk: natural.outcomes[z][x],
        available: !required || mass > 0,
        contribution: !required ? 0 : mass > 0 ? targetShares[z] * natural.outcomes[z][x] : null,
      };
    });
    const available = cells.every(cell => cell.available);
    return {
      x, cells, available,
      observedTargetMean: available ? cells.reduce((sum, cell) => sum + cell.contribution, 0) : null,
      modelKnownMean: targetShares.reduce((sum, weight, z) => sum + weight * natural.outcomes[z][x], 0),
    };
  });
  return {
    natural, targetShares, arms,
    missingRequiredCells: arms.flatMap(arm => arm.cells.filter(cell => !cell.available)),
    observedDifference: arms.every(arm => arm.available) ? arms[1].observedTargetMean - arms[0].observedTargetMean : null,
    modelKnownDifference: arms[1].modelKnownMean - arms[0].modelKnownMean,
  };
}

export function ancestralMoralTrace(graph, start = 'X', end = 'Y', observed = []) {
  validateCausalGraph(graph);
  const query = [start, end, ...observed];
  if (new Set(query).size !== query.length || query.some(node => !graph.nodes.includes(node))) {
    throw new RangeError('Query endpoints and observed nodes must be distinct graph nodes.');
  }
  const ancestors = causalAncestors(graph, query);
  const directed = graph.edges.filter(([a, b]) => ancestors.includes(a) && ancestors.includes(b));
  const edgeMap = new Map();
  const add = (a, b, kind) => {
    const pair = [a, b].sort(), key = JSON.stringify(pair);
    if (!edgeMap.has(key)) edgeMap.set(key, { nodes: pair, kind });
  };
  directed.forEach(([a, b]) => add(a, b, 'original adjacency'));
  for (const child of ancestors) {
    const parents = directed.filter(([, to]) => to === child).map(([from]) => from);
    for (let i = 0; i < parents.length; i++) {
      for (let j = i + 1; j < parents.length; j++) add(parents[i], parents[j], 'join parents of ' + child);
    }
  }
  const moralEdges = [...edgeMap.values()];
  const remaining = ancestors.filter(node => !observed.includes(node));
  const remainingEdges = moralEdges.filter(edge => edge.nodes.every(node => remaining.includes(node)));
  const reachable = new Set([start]), pending = [start];
  while (pending.length) {
    const node = pending.pop();
    for (const edge of remainingEdges.filter(e => e.nodes.includes(node))) {
      for (const neighbor of edge.nodes) {
        if (!reachable.has(neighbor)) { reachable.add(neighbor); pending.push(neighbor); }
      }
    }
  }
  return {
    ancestors, directed, moralEdges, remaining, remainingEdges,
    reachable: remaining.filter(node => reachable.has(node)),
    separated: !reachable.has(end), observed: [...observed],
  };
}

export function binaryIdentificationBounds(masses = [.4, .1, .1, .4]) {
  if (!Array.isArray(masses) || masses.length !== 4) throw new RangeError('Supply four observed (X,Y) masses.');
  masses.forEach(value => bounded(value, 0, 1, 'Observed cell mass'));
  if (Math.abs(masses.reduce((a, b) => a + b, 0) - 1) > 1e-12) throw new RangeError('Observed masses must sum to one.');
  const population = masses.map((mass, index) => ({ x: Math.floor(index / 2), y: index % 2, mass }));
  const completion = upper => {
    const rows = population.map(row => ({
      ...row,
      y0: row.x === 0 ? row.y : upper ? 0 : 1,
      y1: row.x === 1 ? row.y : upper ? 1 : 0,
    }));
    const risks = [0, 1].map(x => rows.reduce((sum, row) => sum + row.mass * row['y' + x], 0));
    return { rows, risks, effect: risks[1] - risks[0] };
  };
  const lower = completion(false), upper = completion(true);
  return { population, lower, upper, width: upper.effect - lower.effect };
}

export function compatibleModel(choice = 'A', action = 1) {
  if (!['A', 'B', 'lower', 'upper'].includes(choice) || ![0, 1].includes(action)) {
    throw new RangeError('Choose A, B, lower or upper and a binary action.');
  }
  const observed = binaryIdentificationBounds();
  if (choice === 'A' || choice === 'B') {
    const model = latentCausalAmbiguity()[choice === 'A' ? 0 : 1];
    return {
      choice, action, observed: observed.population, kind: 'latent outcome risk matrix',
      risks: model.interventionRisks, selectedRisk: model.interventionRisks[action],
      effect: model.effect, matrix: model.risks,
    };
  }
  const model = observed[choice];
  return {
    choice, action, observed: observed.population, kind: 'completed potential outcomes',
    risks: model.risks, selectedRisk: model.risks[action], effect: model.effect, rows: model.rows,
  };
}

export function augmentedDecomposition(propensityCorrect = true, outcomesCorrect = true) {
  if (typeof propensityCorrect !== 'boolean' || typeof outcomesCorrect !== 'boolean') {
    throw new TypeError('Candidate model choices must be booleans.');
  }
  const candidatePropensity = propensityCorrect ? [.2, .8] : [.5, .5];
  const candidateMeans = outcomesCorrect ? [[.1, .2], [.3, .4]] : [[.15, .15], [.2, .2]];
  const population = assignmentComparison();
  const rows = population.rows.map(row => {
    const [m0, m1] = candidateMeans[row.z], g = candidatePropensity[row.z];
    const baseline = m1 - m0;
    const treated = row.x * (row.y - m1) / g;
    const untreated = (1 - row.x) * (row.y - m0) / (1 - g);
    const score = baseline + treated - untreated;
    return { ...row, m0, m1, g, baseline, treated, untreated, score, weighted: row.mass * score };
  });
  const expectation = field => rows.reduce((sum, row) => sum + row.mass * row[field], 0);
  const components = { baseline: expectation('baseline'), treated: expectation('treated'), untreated: expectation('untreated') };
  return {
    candidatePropensity, candidateMeans, rows, components,
    ...augmentedEffectExpectation({ estimatedAssignment: candidatePropensity, estimatedOutcomes: candidateMeans }),
  };
}

export function instrumentPopulation(complierShare = .6) {
  bounded(complierShare, 0, .8, 'Complier population share');
  const types = [
    { name: 'Always', share: .2, receipt: [1, 1], risks: [.1, .1] },
    { name: 'Complier', share: complierShare, receipt: [0, 1], risks: [.1, .4] },
    { name: 'Never', share: .8 - complierShare, receipt: [0, 0], risks: [.1, .9] },
  ];
  const encouragement = [0, 1].map(z => ({
    z,
    receipt: types.reduce((sum, type) => sum + type.share * type.receipt[z], 0),
    outcome: types.reduce((sum, type) => sum + type.share * type.risks[type.receipt[z]], 0),
  }));
  const firstStage = complierShare, assignmentContrast = .3 * complierShare;
  return {
    types, encouragement, firstStage, assignmentContrast,
    ratio: complierShare === 0 ? null : assignmentContrast / firstStage,
    populationATE: types.reduce((sum, type) => sum + type.share * (type.risks[1] - type.risks[0]), 0),
  };
}
