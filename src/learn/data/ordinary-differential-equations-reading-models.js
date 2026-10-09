import { odeNumber } from './ordinary-differential-equations-models.js';

// Exact, bounded examples for the reading-flow investigations.
export function scalarPulse(time, height = 2, start = 0, width = .5) {
  odeNumber(time, 'time', 0, 2);
  odeNumber(height, 'pulse height', 0, 4);
  odeNumber(start, 'pulse start', 0, 1.5);
  odeNumber(width, 'pulse width', .5, .5);
  const stop = Math.min(time, start + width);
  const duration = Math.max(0, stop - start);
  const contribution = duration === 0 ? 0 : height * -Math.expm1(-duration) * Math.exp(-(time - stop));
  const slabs = Array.from({ length: 5 }, (_, index) => {
    const left = start + index * width / 5;
    const right = Math.min(left + width / 5, time);
    const value = right <= left ? 0 : height * -Math.expm1(-(right - left)) * Math.exp(-(time - right));
    return { left, right: Math.max(left, right), contribution: value };
  });
  return { time, contribution, slabs };
}

export function orderedShears(horizontal = 1, vertical = 1) {
  odeNumber(horizontal, 'horizontal shear', 0, 2);
  odeNumber(vertical, 'vertical shear', 0, 2);
  const upper = [[1, horizontal], [0, 1]], lower = [[1, 0], [vertical, 1]];
  const apply = (matrix, vector) => matrix.map(row => row[0] * vector[0] + row[1] * vector[1]);
  const multiply = (left, right) => left.map(row => [0, 1].map(column => row[0] * right[0][column] + row[1] * right[1][column]));
  const initial = [1, 1];
  const upperFirst = { intermediate: apply(upper, initial), matrix: multiply(lower, upper) };
  const lowerFirst = { intermediate: apply(lower, initial), matrix: multiply(upper, lower) };
  upperFirst.final = apply(upperFirst.matrix, initial);
  lowerFirst.final = apply(lowerFirst.matrix, initial);
  return { initial, upper, lower, upperFirst, lowerFirst, difference: upperFirst.final.map((value, index) => value - lowerFirst.final[index]) };
}

export function adaptivePair(width = .4, rtol = .01) {
  odeNumber(width, 'trial width', .025, .5);
  odeNumber(rtol, 'relative tolerance', .001, .1);
  const first = -2, predictor = 1 + width * first, second = -2 * predictor;
  const corrector = 1 + width * (first + second) / 2;
  const error = Math.abs(corrector - predictor), scale = .001 + rtol * Math.max(1, Math.abs(corrector));
  const ratio = error / scale, accepted = ratio <= 1;
  const factor = ratio === 0 ? 5 : Math.min(5, Math.max(.2, .9 / Math.sqrt(ratio)));
  return { first, second, predictor, corrector, error, scale, ratio, accepted,
    retainedTime: accepted ? width : 0, retainedState: accepted ? corrector : 1,
    nextWidth: width * (accepted ? factor : Math.min(1, factor)) };
}

export function stiffDifference(rate = 80, width = .05, initial = 1) {
  odeNumber(rate, 'fast rate', 0, 100);
  odeNumber(width, 'step width', .01, .2);
  if (initial !== 0 && initial !== 1) throw new RangeError('Choose initial difference 0 or 1.');
  const rows = [{ time: 0, explicit: initial, implicit: initial, exact: initial }];
  while (rows.at(-1).time < 1) {
    const old = rows.at(-1), step = Math.min(width, 1 - old.time), time = old.time + step;
    if (time === old.time || rows.length > 101) throw new RangeError('The bounded difference history cannot advance.');
    rows.push({ time, step, explicit: old.explicit * (1 - rate * step),
      implicit: old.implicit / (1 + rate * step), exact: initial * Math.exp(-rate * time) });
  }
  return { rows, explicitFactor: 1 - rate * width, implicitFactor: 1 / (1 + rate * width), exactFactor: Math.exp(-rate * width) };
}
