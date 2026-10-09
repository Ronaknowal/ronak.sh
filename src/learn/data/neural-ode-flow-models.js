import { matrixVector, matrixExponential2 } from './neural-ode-models.js';

export function adaptiveFlow({ rates, initial, endpoint, relative, absolute, firstStep = .1 }) {
  if (rates.length !== initial.length || !rates.length ||
      [...rates, ...initial, endpoint, relative, absolute, firstStep].some(value => !Number.isFinite(value)) ||
      endpoint < 0 || relative <= 0 || absolute <= 0 || firstStep <= 0) {
    throw new Error('Use matching finite coordinates, nonnegative depth and positive tolerances.');
  }
  let time = 0;
  let state = [...initial];
  let step = firstStep;
  const attempts = [];
  const trace = [{ time, state: [...state] }];
  while (time < endpoint) {
    step = Math.min(step, endpoint - time);
    if (attempts.length >= 10000 || step < 1e-14 || time + step === time) {
      throw new Error('This case exceeds the bounded live solve. Increase the tolerances or shorten depth.');
    }
    const first = state.map((value, index) => rates[index] * value);
    const euler = state.map((value, index) => value + step * first[index]);
    const second = euler.map((value, index) => rates[index] * value);
    const heun = state.map((value, index) => value + step * (first[index] + second[index]) / 2);
    const scales = state.map((value, index) => absolute + relative * Math.max(Math.abs(value), Math.abs(heun[index])));
    const standardized = heun.map((value, index) => (value - euler[index]) / scales[index]);
    const ratio = Math.sqrt(standardized.reduce((sum, value) => sum + value * value, 0) / state.length);
    if (![...heun, ratio].every(Number.isFinite)) throw new Error('This case overflows the live solver.');
    const accepted = ratio <= 1;
    attempts.push({ time, step, before: [...state], first, euler, second, heun, scales, standardized, ratio, accepted });
    if (accepted) {
      time += step;
      state = heun;
      trace.push({ time, state: [...state] });
    }
    step *= ratio === 0 ? 5 : Math.min(5, Math.max(.1, .9 / Math.sqrt(ratio)));
  }
  const accepted = attempts.filter(attempt => attempt.accepted).length;
  const exact = initial.map((value, index) => value * Math.exp(rates[index] * endpoint));
  return { trace, attempts, accepted, rejected: attempts.length - accepted,
    endpoint: state, exact, nfe: attempts.length * 2 };
}

export function observedFlow({ events, query, decay = .5, mixing = .3, omit = -1 }) {
  if (!Number.isFinite(query) || query < 0 || !Number.isFinite(decay) || decay < 0 ||
      !Number.isFinite(mixing) || mixing < 0 || mixing > 1 || !Array.isArray(events) || events.length > 8 ||
      !Number.isInteger(omit) || omit < -1 || omit >= events.length && omit !== -1 ||
      events.some((event, index) => !Number.isFinite(event.time) || event.time < 0 ||
        !Number.isFinite(event.value) || (index > 0 && event.time <= events[index - 1].time))) {
    throw new Error('Keep at most eight finite events in strictly increasing nonnegative time order.');
  }
  let state = 0;
  let time = 0;
  const segments = [];
  const updates = [];
  const segment = (start, stop, initial) => Array.from({ length: 25 }, (_, index) => {
    const clock = start + (stop - start) * index / 24;
    return [clock, initial * Math.exp(-decay * (clock - start))];
  });
  events.forEach((event, index) => {
    if (index === omit || event.time > query) return;
    segments.push(segment(time, event.time, state));
    const before = state * Math.exp(-decay * (event.time - time));
    state = (1 - mixing) * before + mixing * event.value;
    updates.push({ ...event, index, before, after: state });
    time = event.time;
  });
  segments.push(segment(time, query, state));
  state *= Math.exp(-decay * (query - time));
  return { state, segments, updates, available: events.map((event, index) => index !== omit && event.time <= query) };
}

// Saved matrices use output-by-input rows, exactly as in the downloadable study.
export function validateOdeModels(models) {
  const kinds = ['linear', 'residual', 'neural_ode', 'augmented_ode'];
  const seeds = [13, 37, 61];
  const finiteVector = (value, length) => Array.isArray(value) && value.length === length && value.every(Number.isFinite);
  const finiteMatrix = (value, rows, columns) => Array.isArray(value) && value.length === rows &&
    value.every(row => finiteVector(row, columns));
  const identities = new Set();
  if (!Array.isArray(models) || models.length !== 12) return false;
  for (const model of models) {
    if (!model || !kinds.includes(model.kind) || !seeds.includes(model.seed) ||
        !Number.isInteger(model.selected_step) || model.selected_step < 1 || model.selected_step > 300 || !model.state) return false;
    const identity = `${model.kind}:${model.seed}`;
    if (identities.has(identity)) return false;
    identities.add(identity);
    const dimension = model.kind === 'augmented_ode' ? 6 : 4;
    const weights = model.state;
    if (!finiteMatrix(weights['readout.weight'], 3, dimension) || !finiteVector(weights['readout.bias'], 3)) return false;
    const prefixes = model.kind === 'linear' ? [] : model.kind === 'residual'
      ? Array.from({ length: 4 }, (_, index) => `blocks.${index}`) : ['field'];
    for (const prefix of prefixes) {
      if (!finiteMatrix(weights[`${prefix}.input.weight`], 16, dimension + 1) ||
          !finiteVector(weights[`${prefix}.input.bias`], 16) ||
          !finiteMatrix(weights[`${prefix}.output.weight`], dimension, 16) ||
          !finiteVector(weights[`${prefix}.output.bias`], dimension)) return false;
    }
  }
  return true;
}

export function fieldEvaluation(snapshot, time, state, prefix = 'field') {
  const weights = snapshot.state;
  const inputs = [...state, time];
  const inputWeights = weights[`${prefix}.input.weight`];
  const inputBias = weights[`${prefix}.input.bias`];
  const sums = inputWeights.map((row, index) => row.reduce((sum, value, column) => sum + value * inputs[column], inputBias[index]));
  const hidden = sums.map(Math.tanh);
  const outputWeights = weights[`${prefix}.output.weight`];
  const outputBias = weights[`${prefix}.output.bias`];
  const velocity = outputWeights.map((row, index) => row.reduce((sum, value, column) => sum + value * hidden[column], outputBias[index]));
  return { inputs, inputWeights, inputBias, sums, hidden, outputWeights, outputBias, velocity };
}

export function linearPatch(matrix, stop) {
  const exponential = matrixExponential2(matrix, stop);
  const original = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const moved = original.map(point => matrixVector(exponential, point));
  const area = Math.abs(moved.reduce((sum, point, index) => {
    const next = moved[(index + 1) % moved.length];
    return sum + point[0] * next[1] - point[1] * next[0];
  }, 0) / 2);
  return { original, moved, area, exponential };
}
