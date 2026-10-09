import {
  buildRateSchedule,
  buildPlateauTrace,
  buildScheduleClockTrace,
  parseValidationMetrics,
} from './learning-rate-schedule-models.js';

export const scheduleIdentity = Object.freeze({
  constant: { label: 'Constant', colour: '#cbd5e1', shape: 'square' },
  linear: { label: 'Linear', colour: '#67d4e7', shape: 'triangle' },
  cosine: { label: 'Cosine', colour: '#e9b44c', shape: 'circle' },
  step: { label: 'Stepped', colour: '#ba9ee8', shape: 'stair' },
  exponential: { label: 'Geometric', colour: '#ed9cab', shape: 'diamond' },
});

export const quantityColour = Object.freeze({
  rate: '#e9b44c',
  meanSquared: '#e9b44c',
  variance: '#67d4e7',
  freshVariance: '#ed9cab',
  momentum: '#67d4e7',
  total: '#cbd5e1',
  selection: '#ffffff',
});

export function scheduleNumber(value, digits = 6) {
  if (value === null || value === undefined) return 'unavailable';
  if (!Number.isFinite(value)) return value === Infinity ? '+∞' : value === -Infinity ? '−∞' : 'undefined';
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const text = magnitude < 10 ** -digits || magnitude >= 100000
    ? value.toExponential(3)
    : String(Number(value.toFixed(digits)));
  return text.replaceAll('-', '−');
}

function finiteRange(value, low, high, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) {
    throw new RangeError(`${name} must be finite, from ${low} to ${high}.`);
  }
  return value;
}

function integerRange(value, low, high, name) {
  finiteRange(value, low, high, name);
  if (!Number.isInteger(value)) throw new RangeError(`${name} must be an integer.`);
  return value;
}

export function scalarRateStep({ curvature = 2, rate = .25, error = 2 } = {}) {
  finiteRange(curvature, .5, 4, 'Curvature');
  finiteRange(rate, 0, 1, 'Rate');
  finiteRange(error, -2, 2, 'Initial error');
  const gradient = curvature * error;
  const multiplier = 1 - rate * curvature;
  const displacement = -rate * gradient;
  return { curvature, rate, error, gradient, multiplier, displacement, next: error + displacement };
}

export function warmupRates({ total = 6, warmup = 2, floorRatio = 1 / 6 } = {}) {
  integerRange(total, 4, 24, 'Update budget');
  integerRange(warmup, 0, total - 1, 'Warmup updates');
  finiteRange(floorRatio, 0, 1, 'Minimum / peak ratio');
  return buildRateSchedule({ total, warmup, peak: .12, minimum: .12 * floorRatio });
}

export function comparedPolicyRates(kind = 'cosine') {
  if (!Object.hasOwn(scheduleIdentity, kind)) throw new RangeError('Choose a defined finite policy.');
  return buildRateSchedule({ kind, total: 12, warmup: 0, peak: .2, minimum: .01, period: 3 });
}

// This deliberately wider domain is separate from the unchanged historical helper.
export function wideNoiseTrace({ rate = .2, noise = .5, total = 20, curvature = 2, initialError = 1 } = {}) {
  finiteRange(rate, 0, 1.25, 'Rate');
  finiteRange(noise, 0, 1, 'Noise standard deviation');
  integerRange(total, 1, 80, 'Update count');
  finiteRange(curvature, .25, 8, 'Curvature');
  finiteRange(initialError, -5, 5, 'Initial error');
  const multiplier = 1 - rate * curvature;
  const fresh = rate * rate * noise * noise;
  let mean = initialError;
  let variance = 0;
  const states = [{ completed: 0, mean, variance, meanSquared: mean * mean, total: mean * mean, retained: 0, fresh: 0 }];
  for (let completed = 1; completed <= total; completed += 1) {
    const retained = multiplier * multiplier * variance;
    mean *= multiplier;
    variance = retained + fresh;
    const meanSquared = mean * mean;
    const secondMoment = meanSquared + variance;
    if (![mean, variance, secondMoment].every(Number.isFinite)) {
      throw new RangeError('This recurrence exceeds the finite numeric range.');
    }
    states.push({ completed, mean, variance, meanSquared, total: secondMoment, retained, fresh });
  }
  return { rate, noise, curvature, initialError, multiplier, states };
}

export function suffixNoiseContributions(rates = [.2, .15, .1, .05], curvature = 1, noise = .5) {
  if (!Array.isArray(rates) || rates.length < 1 || rates.length > 80) throw new RangeError('Use 1–80 rates.');
  finiteRange(curvature, .25, 8, 'Curvature');
  finiteRange(noise, 0, 1, 'Noise');
  rates.forEach(rate => finiteRange(rate, 0, 1.25, 'Rate'));
  let suffix = 1;
  const rows = new Array(rates.length);
  for (let index = rates.length - 1; index >= 0; index -= 1) {
    const rate = rates[index];
    const fresh = rate * rate * noise * noise;
    rows[index] = { index, rate, fresh, suffix, contribution: fresh * suffix };
    suffix *= (1 - curvature * rate) ** 2;
  }
  return rows;
}

export function oneCyclePhases({ total = 12, fraction = .25, threePhase = false } = {}) {
  if (![12, 24, 48].includes(total)) throw new RangeError('Choose 12, 24 or 48 used updates.');
  if (![.25, .30, .50].includes(fraction)) throw new RangeError('Choose one of the three taught phase fractions.');
  if (typeof threePhase !== 'boolean') throw new TypeError('The phase variant must be boolean.');
  const initial = .02;
  const peak = .2;
  const minimum = .0002;
  const firstEnd = fraction * total - 1;
  const phases = threePhase
    ? [[firstEnd, initial, peak, .95, .85], [2 * fraction * total - 2, peak, initial, .85, .95], [total - 1, initial, minimum, .95, .95]]
    : [[firstEnd, initial, peak, .95, .85], [total - 1, peak, minimum, .85, .95]];
  function at(update) {
    let start = 0;
    for (let phase = 0; phase < phases.length; phase += 1) {
      const [end, rateStart, rateEnd, betaStart, betaEnd] = phases[phase];
      if (end <= start) throw new RangeError('Every interpolation phase needs positive width.');
      if (update <= end || phase === phases.length - 1) {
        const progress = (update - start) / (end - start);
        const blend = (1 + Math.cos(Math.PI * progress)) / 2;
        return { update, phase, progress, rate: rateEnd + (rateStart - rateEnd) * blend, beta: betaEnd + (betaStart - betaEnd) * blend };
      }
      start = end;
    }
    throw new Error('Unreachable phase.');
  }
  let buffer = 0;
  let weight = 0;
  const rows = Array.from({ length: total }, (_, update) => {
    const state = at(update);
    const before = weight;
    buffer = state.beta * buffer + 1;
    weight -= state.rate * buffer;
    return { ...state, buffer, before, after: weight, displacement: weight - before };
  });
  return { total, fraction, threePhase, phases, rows, prepared: { ...at(total), consumed: false }, firstEnd };
}

export function decaySplit(first = .1) {
  finiteRange(first, 0, .2, 'First rate');
  const rates = [first, .2 - first];
  const factors = rates.map(rate => 1 - .2 * rate);
  return { rates, factors, initial: 3, intermediate: 3 * factors[0], final: 3 * factors[0] * factors[1], exponential: 3 * Math.exp(-.2 * .2) };
}

export function restartTrace(period = 6, resetWeights = false) {
  integerRange(period, 3, 10, 'Cycle period');
  if (typeof resetWeights !== 'boolean') throw new TypeError('Reset-weight comparison must be boolean.');
  const rates = buildRateSchedule({ kind: 'restart', total: 2 * period, period, peak: .2, minimum: .01 });
  let weight = 0;
  const states = [{ event: 0, weight: 0 }];
  const rows = rates.map(row => {
    const beforeReset = weight;
    if (resetWeights && row.update > 0 && row.update % period === 0) weight = 0;
    const before = weight;
    weight -= row.rate;
    states.push({ event: row.update + 1, weight });
    return { ...row, beforeReset, before, after: weight };
  });
  return { period, resetWeights, rows, states, prepared: { update: 2 * period, rate: .2, consumed: false } };
}

export const plateauDefaultMetrics = Object.freeze([1, .9, .9, .89, .88, .88, .9, .87, .87, .87, .87, .87]);

export function validationTrace(text = plateauDefaultMetrics.join(', '), { patience = 1, threshold = .02, cooldown = 1 } = {}) {
  if (typeof text !== 'string' || text.length > 250) throw new RangeError('Use at most 250 characters.');
  const metrics = parseValidationMetrics(text);
  metrics.forEach(metric => finiteRange(metric, 0, 2, 'Validation metric'));
  integerRange(patience, 0, 3, 'Patience');
  integerRange(cooldown, 0, 3, 'Cooldown');
  finiteRange(threshold, 0, .2, 'Absolute threshold');
  return buildPlateauTrace(metrics, { patience, threshold, cooldown });
}

export function committedClock(accumulation = 3, policy = 'committed') {
  integerRange(accumulation, 1, 3, 'Microbatches per attempt');
  return buildScheduleClockTrace({ accumulation, policy, skipSecond: true });
}
