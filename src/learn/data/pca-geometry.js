// Bounded browser geometry for the declared instructional fixtures.
// Scientific Wine/Gaussian state is loaded separately; it is never refitted here.
export const recordNames = ['A', 'B', 'C', 'D'];
export const recordColors = ['#4EA3D8', '#AB83D8', '#DD8C78', '#55B7BD'];
export const originalRows = [[1, 1], [2, 0], [4, 4], [5, 3]];
export const diagonal = [Math.SQRT1_2, Math.SQRT1_2];
export const perpendicular = [Math.SQRT1_2, -Math.SQRT1_2];
export const thinSvdFixture = {
  u: [[-.5, -.5], [-.5, .5], [.5, -.5], [.5, .5]],
  singular: [[Math.sqrt(18), 0], [0, Math.sqrt(2)]],
  vh: [diagonal, perpendicular]
};

export function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

export function squaredLength(row) {
  return dot(row, row);
}

export function transpose(matrix) {
  return matrix[0].map((_, column) => matrix.map(row => row[column]));
}

export function multiply(left, right) {
  const columns = transpose(right);
  return left.map(row => columns.map(column => dot(row, column)));
}

export function centered(rows) {
  const mean = rows[0].map((_, column) =>
    rows.reduce((sum, row) => sum + row[column], 0) / rows.length
  );
  return {
    mean,
    rows: rows.map(row => row.map((value, column) => value - mean[column]))
  };
}

export function projection(rows, direction, k = 1) {
  const state = centered(rows);
  const second = [direction[1], -direction[0]];
  const records = state.rows.map((row, index) => {
    const scores = [dot(row, direction), dot(row, second)];
    const foot = row.map((_, column) =>
      (k >= 1 ? scores[0] * direction[column] : 0) +
      (k >= 2 ? scores[1] * second[column] : 0)
    );
    const residual = row.map((value, column) => value - foot[column]);
    return {
      id: recordNames[index],
      original: rows[index],
      centered: row,
      scores,
      foot,
      decoded: foot.map((value, column) => value + state.mean[column]),
      residual,
      retained: squaredLength(foot),
      loss: squaredLength(residual)
    };
  });
  return {
    ...state,
    direction,
    second,
    records,
    total: state.rows.reduce((sum, row) => sum + squaredLength(row), 0),
    retained: records.reduce((sum, record) => sum + record.retained, 0),
    loss: records.reduce((sum, record) => sum + record.loss, 0)
  };
}

export function leadingDirection(rows) {
  const state = centered(rows);
  const xx = state.rows.reduce((sum, row) => sum + row[0] ** 2, 0);
  const xy = state.rows.reduce((sum, row) => sum + row[0] * row[1], 0);
  const yy = state.rows.reduce((sum, row) => sum + row[1] ** 2, 0);
  const gap = Math.hypot(xx - yy, 2 * xy);
  const total = xx + yy;
  if (total === 0) return { direction: null, total, gap, status: 'zero spread' };
  if (gap <= 1e-12 * total) {
    return { direction: null, total, gap, status: 'tied leading directions' };
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  return {
    direction: [Math.cos(angle), Math.sin(angle)],
    total,
    gap,
    eigenvalues: [(total + gap) / 2, (total - gap) / 2],
    status: 'unique leading line'
  };
}

export function queryProjection(query, mean = [3, 2], direction = diagonal) {
  const displacement = query.map((value, column) => value - mean[column]);
  const products = displacement.map((value, column) => value * direction[column]);
  const score = products.reduce((sum, value) => sum + value, 0);
  const foot = direction.map(value => score * value);
  const decoded = foot.map((value, column) => value + mean[column]);
  const residual = query.map((value, column) => value - decoded[column]);
  return { query, mean, displacement, products, score, foot, decoded, residual,
    loss: squaredLength(residual) };
}

export function angleDirection(degrees) {
  const angle = degrees * Math.PI / 180;
  return [Math.cos(angle), Math.sin(angle)];
}

export function formatNumber(value, precision = 7) {
  if (value === null || value === undefined) return 'undefined';
  if (!Number.isFinite(value)) throw new Error('Nonfinite instructional readout');
  if (value === 0) return '0';
  return Number(value.toPrecision(precision)).toString();
}

export function paddedExtent(points, minimumSpan = 2) {
  const dimensions = [0, 1].map(column => {
    const values = points.map(row => row[column]);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    return { middle: (lo + hi) / 2, span: Math.max(minimumSpan, hi - lo) };
  });
  // Equal ranges preserve Euclidean angles and squared-distance geometry.
  const span = Math.max(...dimensions.map(dimension => dimension.span)) * 1.2;
  return dimensions.map(({ middle }) => [middle - span / 2, middle + span / 2]);
}
