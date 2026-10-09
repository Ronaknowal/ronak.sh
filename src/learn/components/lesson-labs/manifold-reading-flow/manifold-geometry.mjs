// Declared constructed objects for drawings, separate from retained scientific runs.
export function sheetPoint(u, v) {
  return [(1 + .12 * u) * Math.cos(u), (1 + .12 * u) * Math.sin(u), v];
}

export function sheetTangents(u) {
  return [
    [.12 * Math.cos(u) - (1 + .12 * u) * Math.sin(u),
      .12 * Math.sin(u) + (1 + .12 * u) * Math.cos(u), 0],
    [0, 0, 1],
  ];
}

export function orthographic([x, y, z]) {
  return [x + .42 * y, z + .3 * y];
}

export function residualObjects() {
  const targetGramAB = 7 / 9, mappedGramAB = 0;
  const suppliedLength = 2, mappedLength = 1.5;
  return {
    targetGramAB,
    mappedGramAB,
    gramResidual: targetGramAB - mappedGramAB,
    gramSquared: (targetGramAB - mappedGramAB) ** 2,
    suppliedLength,
    mappedLength,
    lengthResidual: mappedLength - suppliedLength,
    lengthSquared: (mappedLength - suppliedLength) ** 2,
  };
}

export function recipeObjects() {
  const offsets = [[-1, 0], [2, 0]], gram = [[1, -2], [-2, 4]];
  const ridge = .001 * 5;
  const regularized = gram.map((row, i) => row.map((v, j) => v + (i === j ? ridge : 0)));
  const determinant = regularized[0][0] * regularized[1][1] - regularized[0][1] ** 2;
  const u = [(regularized[1][1] - regularized[0][1]) / determinant,
    (regularized[0][0] - regularized[1][0]) / determinant];
  const weights = u.map(v => v / (u[0] + u[1]));
  // Separate exact unregularized affine recipes on the declared line0,1,3,7.
  const w = [[0, 1.5, -.5, 0], [2 / 3, 0, 1 / 3, 0], [-2, 3, 0, 0], [0, -2, 3, 0]];
  const difference = w.map((row, i) => row.map((v, j) => (i === j ? 1 : 0) - v));
  const m = w.map((row, i) => row.map((_, j) => difference.reduce((s, r) => s + r[i] * r[j], 0)));
  return { offsets, gram, ridge, regularized, u, weights, w, difference, m };
}

export function patchObjects() {
  const uv = [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]];
  const points = uv.map(([u, v]) => [u, v, .1 * (u * u + v * v)]);
  const center = [0, 0, .16];
  const projected = points.map(([u, v]) => [u, v, .16]);
  const residuals = points.map((p, i) => Math.abs(p[2] - projected[i][2]));
  const first = [[-1, 0], [0, 1], [1, 0]];
  const second = first.map(([x, y]) => [-y, x]);
  const secondAligned = second.map(([x, y]) => [y, -x]);
  const firstMean = [0, 1 / 3], secondMean = [-1 / 3, 0];
  const firstCentered = first.map(row => row.map((v, i) => v - firstMean[i]));
  const secondCentered = second.map(row => row.map((v, i) => v - secondMean[i]));
  const alignedCentered = secondCentered.map(([x, y]) => [y, -x]);
  const crossProduct = [[0, 2], [-2 / 3, 0]];
  return { uv, points, center, projected, residuals, first, second, secondAligned,
    firstMean, secondMean, firstCentered, secondCentered, alignedCentered, crossProduct };
}

export function ripsSquare(threshold) {
  const vertices = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const edges = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    if (Math.hypot(vertices[i][0] - vertices[j][0], vertices[i][1] - vertices[j][1]) <= threshold) edges.push([i, j]);
  }
  const hasEdge = (a, b) => edges.some(([i, j]) => i === Math.min(a, b) && j === Math.max(a, b));
  const faces = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) for (let k = j + 1; k < 4; k++) {
    if (hasEdge(i, j) && hasEdge(i, k) && hasEdge(j, k)) faces.push([i, j, k]);
  }
  return { vertices, edges, faces, tetrahedron: faces.length === 4 };
}
