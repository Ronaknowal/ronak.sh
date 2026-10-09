import { finiteMoments, outcomeState, meanLossState, jointState, sharedNoiseState, conditionalState, squaredUniformState, sampleMeanState } from './random-variables-models.js';
export { outcomeState, meanLossState, jointState, sharedNoiseState, conditionalState, squaredUniformState, sampleMeanState };
export const asymmetricLaw = [{
  value: -2,
  mass: .25
}, {
  value: 0,
  mass: .5
}, {
  value: 3,
  mass: .25
}];
export const conditionalRows = conditionalState().rows;
export const noiseRows = sharedNoiseState().rows;
export const observedPairs = [[1, 2], [2, 1], [4, 3]];
export const withoutReplacement = ['M1', 'M2', 'U1', 'U2'].flatMap(first => ['M1', 'M2', 'U1', 'U2'].filter(second => second !== first).map(second => ({
  first,
  second,
  firstMarked: Number(first.startsWith('M')),
  secondMarked: Number(second.startsWith('M')),
  mass: 1 / 12
})));
export const fourBitStrings = Array.from({
  length: 16
}, (_, i) => {
  const word = i.toString(2).padStart(4, '0');
  return {
    word,
    count: [...word].reduce((sum, digit) => sum + Number(digit), 0),
    mass: 1 / 16
  };
});
export function cdfAt(distribution, threshold, strict = false) {
  return distribution.reduce((sum, row) => sum + ((strict ? row.value < threshold : row.value <= threshold) ? row.mass : 0), 0);
}
export function lossCurve(candidate, preset = 'asymmetric') {
  return meanLossState(candidate, preset).loss;
}
export function conditionalRow(state, selectedX) {
  const row = state.cells.filter(cell => cell.x === selectedX);
  const mass = row.reduce((sum, cell) => sum + cell.mass, 0);
  return {
    mass,
    cells: row.map(cell => ({
      ...cell,
      conditional: mass > 0 ? cell.mass / mass : null
    }))
  };
}
export function pairedContributions(state) {
  return state.rows.map(row => ({
    ...row,
    dx: row.x - state.x.mean,
    dy: row.y - state.y.mean,
    contribution: row.mass * (row.x - state.x.mean) * (row.y - state.y.mean)
  }));
}
export function conditionalGeometry(state) {
  return state.rows.map(row => {
    const group = state.groups.find(group => group.g === row.g);
    if (!group.moments) return {
      ...row,
      within: null,
      between: null
    };
    const withinX = row.x - group.moments.x.mean,
      withinY = row.y - group.moments.y.mean;
    const betweenX = group.moments.x.mean - state.x.mean,
      betweenY = group.moments.y.mean - state.y.mean;
    return {
      ...row,
      within: [withinX, withinY],
      between: [betweenX, betweenY]
    };
  });
}
export function sampleResiduals(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const rows = values.map(value => ({
    value,
    residual: value - mean,
    square: (value - mean) ** 2
  }));
  return {
    mean,
    rows,
    sumSquares: rows.reduce((sum, row) => sum + row.square, 0)
  };
}
export function covarianceMatrix(rows) {
  const mx = rows.reduce((sum, row) => sum + row.mass * row.x, 0);
  const my = rows.reduce((sum, row) => sum + row.mass * row.y, 0);
  const centered = rows.map(row => ({
    ...row,
    dx: row.x - mx,
    dy: row.y - my
  }));
  const xx = centered.reduce((sum, row) => sum + row.mass * row.dx ** 2, 0);
  const xy = centered.reduce((sum, row) => sum + row.mass * row.dx * row.dy, 0);
  const yy = centered.reduce((sum, row) => sum + row.mass * row.dy ** 2, 0);
  return {
    means: [mx, my],
    matrix: [[xx, xy], [xy, yy]],
    centered
  };
}
export function squareDensity(y) {
  if (!(y > 0 && y <= 1)) throw new RangeError('Density branches require 0 < y <= 1.');
  return 1 / (2 * Math.sqrt(y));
}
export function cauchyMomentCutoff(cutoff) {
  return Math.log1p(cutoff * cutoff) / (2 * Math.PI);
}
export function paretoMomentCutoff(alpha, order, cutoff) {
  const exponent = order - alpha;
  return exponent === 0 ? alpha * Math.log(cutoff) : alpha * Math.expm1(exponent * Math.log(cutoff)) / exponent;
}
export function mixedCdf(y) {
  return y < 0 ? 0 : y < 1 ? .5 + .5 * y : 1;
}
export function curveSamples(fn, low, high, count = 160, logarithmic = false) {
  return Array.from({
    length: count + 1
  }, (_, i) => {
    const x = logarithmic ? Math.exp(Math.log(low) + (Math.log(high) - Math.log(low)) * i / count) : low + (high - low) * i / count;
    return [x, fn(x)];
  });
}
export function finiteLawMoments(law) {
  return finiteMoments(law.map(row => row.value), law.map(row => row.mass));
}
