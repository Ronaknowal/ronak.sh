// Pure arithmetic for the connected forecast/vote/error pictures. No saved fit is rerun.
function finite(value, minimum, maximum, label) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be finite from ${minimum} to ${maximum}.`);
  }
  return value;
}

function vector(values, length, minimum, maximum, label) {
  if (!Array.isArray(values) || values.length !== length) {
    throw new TypeError(`${label} needs ${length} coordinates.`);
  }
  for (let index = 0; index < length; index += 1) {
    finite(values[index], minimum, maximum, `${label} ${index}`);
  }
  return values;
}

export function normalizeMemberWeights(values) {
  vector(values, 3, 0, 10, 'Member weight');
  const maximum = Math.max(...values);
  if (maximum === 0) return null;
  const scaled = values.map(value => value / maximum);
  const sum = scaled.reduce((total, value) => total + value, 0);
  return scaled.map(value => value / sum);
}

export function combinedForecast(forecasts, weightA) {
  vector(forecasts, 2, -1e6, 1e6, 'Forecast');
  finite(weightA, 0, 1, 'Weight on A');
  const weights = [weightA, 1 - weightA];
  const contributions = forecasts.map((forecast, index) => forecast * weights[index]);
  return {
    forecasts: [...forecasts],
    weights,
    contributions,
    forecast: contributions.reduce((total, value) => total + value, 0)
  };
}

export function combinedClassVotes(probabilities, quantities) {
  vector(probabilities, 3, 0, 1, 'Class 1 probability');
  const weights = normalizeMemberWeights(quantities);
  const members = probabilities.map((probability, index) => ({
    id: ['A', 'B', 'C'][index],
    probabilities: [1 - probability, probability],
    ballot: probability > .5 ? 1 : 0,
    quantity: quantities[index],
    weight: weights?.[index] ?? null
  }));
  if (weights === null) {
    return { members, weights, soft: null, ballotMass: null, hardClass: null, softClass: null };
  }
  const soft = [0, 1].map(classId => members.reduce(
    (total, member) => total + member.weight * member.probabilities[classId], 0
  ));
  const ballotMass = [0, 1].map(classId => members.reduce(
    (total, member) => total + (member.ballot === classId ? member.weight : 0), 0
  ));
  return {
    members,
    weights,
    soft,
    ballotMass,
    hardClass: ballotMass[1] > ballotMass[0] ? 1 : 0,
    softClass: soft[1] > soft[0] ? 1 : 0
  };
}

function scaledProductRatio(ratio, numeratorScale, denominatorScale) {
  if (ratio === 0 || numeratorScale === 0) return 0;
  const parts = [ratio, numeratorScale, denominatorScale].map(value => value.toExponential(17).split('e'));
  const mantissa = Number(parts[0][0]) * Number(parts[1][0]) / Number(parts[2][0]);
  const exponent = Number(parts[0][1]) + Number(parts[1][1]) - Number(parts[2][1]);
  return Number(`${mantissa}e${exponent}`);
}

export function residualCombination(first, second, weight) {
  vector(first, 4, -1e6, 1e6, 'A residual');
  vector(second, 4, -1e6, 1e6, 'B residual');
  finite(weight, 0, 1, 'Weight on A');
  const lossScale = Math.max(...first.map(Math.abs), ...second.map(Math.abs));
  const scaledFirst = lossScale === 0 ? first.map(() => 0) : first.map(value => value / lossScale);
  const scaledSecond = lossScale === 0 ? second.map(() => 0) : second.map(value => value / lossScale);
  const rows = first.map((a, index) => {
    const b = second[index];
    const mixture = weight * a + (1 - weight) * b;
    const memberLoss = weight * a * a + (1 - weight) * b * b;
    const disagreement = weight * (a - mixture) ** 2 + (1 - weight) * (b - mixture) ** 2;
    const scaledA = scaledFirst[index];
    const scaledB = scaledSecond[index];
    const scaledMixture = weight * scaledA + (1 - weight) * scaledB;
    const scaledMemberLoss = weight * scaledA ** 2 + (1 - weight) * scaledB ** 2;
    const scaledDisagreement = weight * (scaledA - scaledMixture) ** 2 + (1 - weight) * (scaledB - scaledMixture) ** 2;
    return {
      id: ['A', 'B', 'C', 'D'][index], a, b, mixture,
      memberLoss, disagreement, mixtureLoss: mixture * mixture,
      scaledA, scaledB, scaledMixture, scaledMemberLoss, scaledDisagreement,
      scaledMixtureLoss: scaledMixture * scaledMixture
    };
  });
  const mean = key => rows.reduce((total, row) => total + row[key] / rows.length, 0);
  const denominator = first.reduce((total, a, index) => total + (a - second[index]) ** 2, 0);
  const numerator = second.reduce((total, b, index) => total - b * (first[index] - b), 0);
  const differences = first.map((value, index) => value - second[index]);
  const differenceScale = Math.max(...differences.map(Math.abs));
  const scaledDifferences = differenceScale === 0 ? differences.map(() => 0) : differences.map(value => value / differenceScale);
  const scaledCurvature = scaledDifferences.reduce((total, value) => total + value * value, 0);
  const secondScale = Math.max(...second.map((value, index) => differences[index] === 0 ? 0 : Math.abs(value)));
  const scaledNumerator = secondScale === 0 ? 0 : second.reduce(
    (total, value, index) => scaledDifferences[index] === 0 ? total : total - value / secondScale * scaledDifferences[index], 0
  );
  const scaledRatio = differenceScale === 0 ? null : scaledNumerator / scaledCurvature;
  // Scale before squaring. Tiny nonidentical rows must not become a false flat problem.
  const unrestrictedOptimum = scaledRatio === null ? null : scaledProductRatio(scaledRatio, secondScale, differenceScale);
  return {
    rows,
    weight,
    memberLoss: mean('memberLoss'),
    disagreement: mean('disagreement'),
    mixtureLoss: mean('mixtureLoss'),
    lossScale,
    scaledMemberLoss: mean('scaledMemberLoss'),
    scaledDisagreement: mean('scaledDisagreement'),
    scaledMixtureLoss: mean('scaledMixtureLoss'),
    numerator,
    denominator,
    differenceScale,
    scaledCurvature,
    secondScale,
    scaledNumerator,
    unrestrictedOptimum,
    constrainedOptimum: unrestrictedOptimum === null ? null : Math.min(1, Math.max(0, unrestrictedOptimum))
  };
}

// A displayed magnitude may be smaller than the smallest floating-point product.
// Keep its scientific exponent instead of relabeling a positive squared area as zero.
export function ensembleProductNumber(factors, places = 6) {
  if (factors.some(value => value === 0)) return '0';
  if (factors.some(value => !Number.isFinite(value))) return 'unavailable';
  const product = factors.reduce((value, factor) => value * factor, 1);
  if (Number.isFinite(product) && product !== 0 && Math.abs(product) >= 1e-7 && Math.abs(product) < 1e7) {
    return product.toFixed(places).replace(/\.?0+$/, '');
  }
  let mantissa = 1;
  let exponent = 0;
  for (const factor of factors) {
    const [part, power] = factor.toExponential(12).split('e');
    mantissa *= Number(part);
    exponent += Number(power);
  }
  const adjustment = Math.floor(Math.log10(Math.abs(mantissa)));
  mantissa /= 10 ** adjustment;
  exponent += adjustment;
  return `${mantissa.toFixed(places).replace(/\.?0+$/, '')}e${exponent >= 0 ? '+' : ''}${exponent}`;
}

export function projectSimplex(candidate) {
  vector(candidate, 3, -1e6, 1e6, 'Candidate coordinate');
  const sorted = [...candidate].sort((a, b) => b - a);
  let prefix = 0;
  let threshold = 0;
  let active = 0;
  const prefixes = sorted.map((value, index) => {
    prefix += value;
    const tau = (prefix - 1) / (index + 1);
    const eligible = value > tau;
    if (eligible) {
      threshold = tau;
      active = index + 1;
    }
    return { length: index + 1, sum: prefix, tau, eligible };
  });
  const weights = candidate.map(value => Math.max(value - threshold, 0));
  return { candidate: [...candidate], sorted, prefixes, active, threshold, weights };
}
