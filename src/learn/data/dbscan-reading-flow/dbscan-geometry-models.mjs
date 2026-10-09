// New browser arithmetic for the accepted constructed geometry; no estimator runs.
import { EuclideanNeighbourhoods, trailObservations, densityPartition } from './dbscan-neighbourhood-models.mjs';
export const trailProvider = new EuclideanNeighbourhoods(trailObservations);
export const rosterText = rows => rows.map(row => row.id).join(', ') || 'empty';
export function roleRows(provider, eps, minimum, seedOrder) {
  const partition = densityPartition(provider, eps, minimum, {
    seedOrder
  });
  return provider.observations.map((row, i) => ({
    ...row,
    count: provider.neighbours(i, eps).length,
    core: partition.core[i],
    label: partition.labels[i],
    role: partition.core[i] ? 'core' : partition.labels[i] < 0 ? 'noise' : 'border'
  }));
}
export function rankedSupport(provider, minimum) {
  if (!Number.isSafeInteger(minimum) || minimum < 1) throw Error('Positive integer rank required');
  return provider.observations.map((row, i) => ({
    id: row.id,
    position: i,
    value: provider.rankedDistances(i)[minimum - 1]?.distance ?? Infinity
  }));
}
export function suppliedRings(inner = 12, outer = 12) {
  return [1, 3].flatMap((radius, ring) => Array.from({
    length: ring ? outer : inner
  }, (_, i) => ({
    id: `${ring ? 'O' : 'I'}${i}`,
    coordinates: [radius * Math.cos(2 * Math.PI * i / (ring ? outer : inner)), radius * Math.sin(2 * Math.PI * i / (ring ? outer : inner))],
    ring,
    representative: Math.cos(2 * Math.PI * i / (ring ? outer : inner)) <= 1e-14 ? 0 : 1
  })));
}
export function anisotropic(scale) {
  if (!Number.isFinite(scale) || scale < 1 || scale > 10) throw Error('Scale is in [1,10]');
  const distance = Math.hypot(1, scale);
  return {
    scale,
    distance,
    included: distance <= 2,
    original: Math.SQRT2,
    p: [0, 0],
    q: [1, scale],
    ellipseRadii: [2, 2 / scale]
  };
}
export function uniformGeometry(scale) {
  if (!Number.isFinite(scale) || scale < 1 || scale > 1000) throw Error('Unit factor is in [1,1000]');
  const provider = new EuclideanNeighbourhoods(trailObservations.map(row => ({
    id: row.id,
    coordinates: row.coordinates.map(x => x * scale)
  })));
  const rosters = trailObservations.map((_, i) => provider.neighbours(i, scale).map(r => r.id));
  const agrees = rosters.every((r, i) => JSON.stringify(r) === JSON.stringify(trailProvider.neighbours(i, 1).map(x => x.id)));
  return {
    provider,
    rosters,
    agrees,
    eps: scale,
    interval: [-2 * scale, 0],
    partition: densityPartition(provider, scale, 4)
  };
}
export function equatorialArc(west) {
  if (!Number.isFinite(west) || west < -180 || west > 180) throw Error('Longitude is in [-180,180] degrees');
  const radians = west * Math.PI / 180,
    east = 179 * Math.PI / 180;
  // Same haversine short arc as the accepted new neighbourhood source.
  const theta = 2 * Math.asin(Math.min(1, Math.abs(Math.sin((radians - east) / 2))));
  return {
    west,
    eastDegrees: 179,
    radians,
    eastRadians: east,
    theta,
    km: 6371.0088 * theta
  };
}
export function numericScaler() {
  const rows = [[1, 10], [2, 20], [4, 40], [5, 50]],
    sum = [12, 120],
    mean = [3, 30];
  const deviations = rows.map(row => row.map((x, j) => x - mean[j]));
  const squaredSums = [0, 1].map(j => deviations.reduce((a, row) => a + row[j] ** 2, 0));
  const variance = squaredSums.map(x => x / rows.length),
    scale = variance.map(Math.sqrt);
  const transformed = rows.map(row => row.map((x, j) => (x - mean[j]) / scale[j]));
  const query = [3, 90],
    queryTransformed = query.map((x, j) => (x - mean[j]) / scale[j]);
  return {
    rows,
    sum,
    mean,
    deviations,
    squaredSums,
    variance,
    scale,
    transformed,
    query,
    queryTransformed
  };
}
