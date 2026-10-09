function finiteArray(values, length) {
  if (!Array.isArray(values) || values.length !== length || values.some(value => !Number.isFinite(value))) throw Error('A finite complete input row is required.');
}

// Same complete numeric and fixed-category assembly as the portable saved core.
// For trees, Float32 conversion occurs after encoding and before <= comparisons.
export function encodeEnergyRow(model, point) {
  finiteArray(point, 8);
  const encoded = model.numeric_columns.map(column => point[column]);
  model.categorical_columns.forEach((column, index) => {
    const categories = model.categories[index];
    if (!categories.includes(point[column])) throw Error('Unsupported recorded category.');
    encoded.push(...categories.map(category => Number(point[column] === category)));
  });
  return model.input_mean ? encoded.map((value, i) => (value - model.input_mean[i]) / model.input_scale[i]) : encoded;
}

export function energyLinearForward(model, point) {
  const encoded = encodeEnergyRow(model, point);
  const contributions = encoded.map((value, i) => model.coef_output_by_feature.map(row => value * row[i]));
  const standardized = model.intercept.map((bias, j) => contributions.reduce((sum, row) => sum + row[j], bias));
  const prediction = standardized.map((value, j) => value * model.target_scale[j] + model.target_mean[j]);
  return { encoded, contributions, standardized, prediction };
}

export function energyTreePath(tree, encoded) {
  const point = encoded.map(Math.fround), path = [];
  let node = 0;
  while (tree.children_left[node] !== -1) {
    if (path.length > tree.children_left.length) throw Error('Saved tree has a cycle.');
    const feature = tree.feature[node], value = point[feature], threshold = tree.threshold[node];
    const left = value <= threshold;
    const next = left ? tree.children_left[node] : tree.children_right[node];
    path.push({ node, feature, value, threshold, left, next });
    node = next;
  }
  return { path, node, leaf: tree.values[node] };
}

export function energyForestForward(model, point, memberId = 0) {
  const encoded = encodeEnergyRow(model, point);
  const forest = model.forests[0];
  if (forest.output_index !== null || memberId < 0 || memberId >= forest.trees.length || !Number.isInteger(memberId)) throw Error('This inspector requires a shared two-output forest and a valid member ID.');
  const leaves = forest.trees.map(tree => energyTreePath(tree, encoded).leaf);
  const standardized = [0, 1].map(j => leaves.reduce((sum, row) => sum + row[j], 0) / leaves.length);
  const selected = energyTreePath(forest.trees[memberId], encoded);
  const inverse = values => values.map((value, j) => value * model.target_scale[j] + model.target_mean[j]);
  return { encoded, float32: encoded.map(Math.fround), leaves, standardized, prediction: inverse(standardized), selected, selectedPrediction: inverse(selected.leaf), members: leaves.length };
}

export function energyGroup(observations, rank) {
  if (!Number.isInteger(rank) || rank < 0 || rank > 11) throw Error('Recorded geometry rank must be 0–11.');
  const ids = observations.ranks.flatMap((value, id) => value === rank ? [id] : []);
  const split = Object.keys(observations.splitRanks).find(name => observations.splitRanks[name].includes(rank));
  return { ids, split, tuple: observations.geometryTuples[rank], worksheetIds: ids.map(id => observations.sourceWorksheetRows[id]) };
}

export function lockedEnergyRole(observations, id) {
  const roles = [];
  if (id === observations.lock.overall_fitted) roles.push('overall');
  for (const [family, winner] of Object.entries(observations.lock.families)) if (id === winner) roles.push(family + ' family');
  if (id === observations.lock.best_independent) roles.push('strongest independent');
  if (id === 'dummy') roles.push('training mean baseline');
  return roles.join(' · ') || 'unselected';
}

export function recordedTextCounts(truth, predictions) {
  let tp = 0, fp = 0, fn = 0, tn = 0, exact = 0;
  truth.forEach((row, i) => {
    if (row.every((value, j) => value === predictions[i][j])) exact += 1;
    row.forEach((value, j) => {
      const predicted = predictions[i][j];
      if (value && predicted) tp += 1;
      else if (!value && predicted) fp += 1;
      else if (value && !predicted) fn += 1;
      else tn += 1;
    });
  });
  return { tp, fp, fn, tn, exact, cells: truth.length * 3, rows: truth.length, micro: 2 * tp / (2 * tp + fp + fn), cost: fp + 3 * fn };
}
