import savedAudit from './ensemble-nested-selection-saved-audit.json';

const all = count => Array.from({ length: count }, (_, index) => index);
const requireInteger = (value, low, high, name) => {
  if (!Number.isInteger(value) || value < low || value > high) throw new RangeError(`${name}: ${low}–${high}`);
};

export function alignTypedOutput({ method, values, classes, order, member, outputShape = 'per-class' }) {
  if (!Array.isArray(values) || values.some(value => !Number.isFinite(value))) throw new TypeError('Finite output required.');
  if (new Set(classes).size !== classes.length || new Set(order).size !== order.length) throw new TypeError('Unique classes required.');
  if (method === 'probability') {
    if (values.length !== classes.length || values.some(value => value < 0 || value > 1) || Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 1e-10) throw new TypeError('Named probability vector required.');
    if (classes.some(identity => !order.includes(identity))) throw new TypeError('Unknown probability class.');
    const aligned = order.map(identity => classes.includes(identity) ? values[classes.indexOf(identity)] : 0);
    const keep = order.length === 2 ? [1] : all(order.length);
    return keep.map(index => ({ name: `${member}:P(class=${order[index]})`, value: aligned[index], type: 'probability' }));
  }
  if (method === 'margin') {
    if (classes.length !== order.length || order.some(identity => !classes.includes(identity))) throw new TypeError('Missing-class margin has no fallback.');
    if (order.length > 2 && outputShape === 'pairwise') throw new TypeError('OVO pair scores cannot be named per-class; pipeline final-estimator contract is also checked.');
    if (order.length === 2 && values.length === 1) return [{ name: `${member}:margin(toward class=${order[1]})`, value: values[0] * (classes[1] === order[1] ? 1 : -1), type: 'signed margin' }];
    if (values.length !== order.length) throw new TypeError('Declared genuine per-class scores required.');
    return order.map(identity => ({ name: `${member}:margin(class=${identity})`, value: values[classes.indexOf(identity)], type: 'per-class margin' }));
  }
  if (method === 'label' && values.length === 1 && order.includes(values[0])) return [{ name: `${member}:hard-class-index`, value: order.indexOf(values[0]), type: 'hard class index' }];
  throw new TypeError('Unsupported output meaning.');
}

export function typedColumnsIllustration(variant = 'binary', passthrough = false) {
  if (!['binary', 'multiclass', 'perclass', 'mixed', 'ovo', 'missing-margin', 'missing-probability', 'label'].includes(variant)) throw new RangeError('Unknown typed route.');
  const order = ['multiclass', 'perclass', 'ovo'].includes(variant) ? [0, 1, 2] : [0, 1];
  let members;
  if (variant === 'binary') members = [
    { member: 'A', method: 'probability', classes: [0, 1], values: [.2, .8] },
    { member: 'B', method: 'probability', classes: [1, 0], values: [.6, .4] },
    { member: 'C', method: 'probability', classes: [0, 1], values: [.7, .3] }
  ];
  else if (variant === 'multiclass') members = [
    { member: 'A', method: 'probability', classes: [2, 0, 1], values: [.3, .1, .6] },
    { member: 'B', method: 'probability', classes: [1, 2, 0], values: [.2, .5, .3] }
  ];
  else if (variant === 'perclass') members = [{ member: 'genuine OVR', method: 'margin', classes: [2, 0, 1], values: [.3, .1, .6] }];
  else if (variant === 'mixed') members = [
    { member: 'line', method: 'probability', classes: [0, 1], values: [.2, .8] },
    { member: 'margin', method: 'margin', classes: [1, 0], values: [-1.4] }
  ];
  else if (variant === 'ovo') members = [{ member: 'SVC / Pipeline final SVC', method: 'margin', classes: [0, 1, 2], values: [1.2, -.3, .7], outputShape: 'pairwise' }];
  else if (variant === 'missing-margin') members = [{ member: 'missing', method: 'margin', classes: [0], values: [.7] }];
  else if (variant === 'missing-probability') members = [{ member: 'single-class', method: 'probability', classes: [0], values: [1] }];
  else members = [{ member: 'hard', method: 'label', classes: [0, 1], values: [1] }];
  let columns = [], error = null;
  try { columns = members.flatMap(member => alignTypedOutput({ ...member, order })); }
  catch (caught) { error = caught.message; }
  if (!error && passthrough) columns.push(...[.4, -.2].map((value, index) => ({ name: `raw-feature:${index}`, value, type: 'raw feature' })));
  return { variant, order, members, columns, error, passthrough };
}

export function preprocessingOwnership() {
  const fit = [1, 2, 4, 5], held = [0, 3];
  const mean = fit.reduce((sum, value) => sum + value / fit.length, 0);
  const variance = fit.reduce((sum, value) => sum + (value - mean) ** 2 / fit.length, 0);
  const globalMean = 2.5, globalScale = Math.sqrt(35 / 12);
  return { fit, held, mean, variance, scale: Math.sqrt(variance), globalMean, globalScale,
    reads: held.map(value => ({ row: value, feature: value, legal: (value - mean) / Math.sqrt(variance), illegal: (value - globalMean) / globalScale, minutes: value * 60 })) };
}

export function nestedSelectionOwnership(row = 0, placement = 'fold') {
  requireInteger(row, 0, 5, 'Illustration row');
  if (!['fold', 'global'].includes(placement)) throw new RangeError('Choice placement');
  const pairs = [[0, 3], [1, 4], [2, 5]];
  const held = pairs.find(pair => pair.includes(row));
  const fit = all(6).filter(index => !held.includes(index));
  return { row, held, fit, choice: placement === 'fold' ? fit : all(6), placement, targetEnteredChoice: placement === 'global', savedAudit };
}

export function forwardAvailability(block = 0, delay = 0) {
  requireInteger(block, 0, 2, 'Prediction block'); requireInteger(delay, 0, 3, 'Label delay');
  const origin = 3 * (block + 1);
  const rows = all(12).map(id => ({ id, featureTime: id, availableAt: id + delay, historical: id < origin,
    eligible: id < origin && id + delay <= origin, held: id >= origin && id < origin + 3,
    coverage: id >= 3 ? 1 : 0 }));
  return { block, delay, origin, rows, fit: rows.filter(row => row.eligible).map(row => row.id), held: rows.filter(row => row.held).map(row => row.id) };
}

export function groupOwnership(group = 0) {
  requireInteger(group, 0, 5, 'Group');
  // The three whole-group folds retain the original GroupKFold3 grouping.
  const heldGroups = [[2, 5], [1, 4], [0, 3]].find(pair => pair.includes(group));
  const rows = all(12).map(id => ({ id, group: Math.floor(id / 2), held: heldGroups.includes(Math.floor(id / 2)), inspected: Math.floor(id / 2) === group }));
  return { group, heldGroups, rows, fit: rows.filter(row => !row.held).map(row => row.id), held: rows.filter(row => row.held).map(row => row.id), leakyHeld: 2 * group, leakySibling: 2 * group + 1 };
}

export function partitionOwnership(held = [[3, 4, 5], [6, 7, 8], [9, 10, 11]], count = 12) {
  const concatenated = held.flat();
  const coverage = all(count).map(index => concatenated.filter(value => value === index).length);
  return { held, concatenated, coverage, missing: all(count).filter(index => coverage[index] === 0),
    partition: concatenated.length === count && concatenated.every(index => Number.isInteger(index) && index >= 0 && index < count) && coverage.every(value => value === 1) };
}

export function blendRoles() {
  return { base: all(96).filter(id => [0, 1, 2].includes(id % 8)), meta: all(96).filter(id => [3, 4].includes(id % 8)), calibration: all(96).filter(id => id % 8 === 5), evaluation: all(96).filter(id => [6, 7].includes(id % 8)) };
}

export function blendRefitIllustration(query = 2.5, protocol = 'kept') {
  if (!Number.isFinite(query) || query < 0 || query > 5 || !['kept', 'refit'].includes(protocol)) throw new RangeError('Blend illustration domain');
  // A separately labelled six-row arithmetic illustration: bases see A–C,
  // a fixed .5/.5 combining rule is retained. No N4/N6 measured rule is refitted.
  const fit = protocol === 'kept' ? [0, 1, 2] : all(6);
  const targets = [1, 2, 2, 6, 7, 8];
  const meanX = fit.reduce((sum, value) => sum + value / fit.length, 0);
  const meanY = fit.reduce((sum, value) => sum + targets[value] / fit.length, 0);
  const denominator = fit.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  const slope = fit.reduce((sum, value) => sum + (value - meanX) * (targets[value] - meanY), 0) / denominator;
  const intercept = meanY - slope * meanX;
  const nearest = fit.reduce((best, value) => Math.abs(value - query) < Math.abs(best - query) ? value : best, fit[0]);
  const predictions = [targets[nearest], intercept + slope * query];
  return { query, protocol, fit, nearest, slope, intercept, predictions, products: predictions.map(value => value / 2), forecast: predictions.reduce((sum, value) => sum + value / 2, 0) };
}
