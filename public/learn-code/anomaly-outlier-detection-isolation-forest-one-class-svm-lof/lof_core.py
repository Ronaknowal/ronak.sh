"""Fixed-reference LOF using the byte-exact earlier batched Euclidean primitive."""
import numpy as np
from prerequisites.batched_top_k import batched_top_k


def nonnegative_mean(values):
    """Preserve ordinary reduction; scale only rows whose sum overflows."""
    values = np.asarray(values, dtype=np.float64)
    if values.ndim != 2 or not values.shape[1] or not np.isfinite(values).all() or np.any(values < 0):
        raise ValueError('Means require finite nonnegative operands and nonempty columns.')
    with np.errstate(over='ignore', under='ignore'):
        means = values.mean(axis=1)
    overflowed = ~np.isfinite(means)
    if overflowed.any():
        selected = values[overflowed]
        scale = selected.max(axis=1)
        # Each normalized entry lies in [0,1]. Divide before restoring scale.
        means[overflowed] = (selected/scale[:, None]).mean(axis=1)*scale
    if not np.isfinite(means).all():
        raise ValueError('Mean is not representable; rescale coordinates.')
    return means


def positive_density(reach, epsilon):
    if not np.isfinite(epsilon) or epsilon < 0:
        raise ValueError('Epsilon must be finite and nonnegative.')
    means = nonnegative_mean(reach)
    with np.errstate(over='ignore', under='ignore', divide='ignore'):
        denominator = means+epsilon
        density = 1/denominator
    if np.any(denominator <= 0):
        raise ValueError('Zero mean reach is undefined without a declared stabilizer.')
    if not np.isfinite(denominator).all() or not np.isfinite(density).all() or np.any(density <= 0):
        raise ValueError('Positive density is not representable; rescale coordinates or the stabilizer.')
    return density


def density_factor(neighbor_density, density):
    if (not np.isfinite(neighbor_density).all() or np.any(neighbor_density <= 0)
            or not np.isfinite(density).all() or np.any(density <= 0)):
        raise ValueError('Factors require finite positive fitted and query densities.')
    with np.errstate(over='ignore', under='ignore'):
        ratios = neighbor_density/density[:, None]
    ordinary = np.isfinite(ratios).all(axis=1)
    result = np.empty(len(density))
    result[ordinary] = nonnegative_mean(ratios[ordinary])
    # A single ratio can overflow even if averaging first makes the factor finite.
    with np.errstate(over='ignore', under='ignore'):
        result[~ordinary] = nonnegative_mean(neighbor_density[~ordinary])/density[~ordinary]
    if not np.isfinite(result).all() or np.any(result <= 0):
        raise ValueError('Positive LOF factor is not representable; rescale or revise the declared support.')
    return result


def reference_neighbors(reference, k, batch_size):
    n = len(reference)
    if type(k) is not int or not 1 <= k < n:
        raise ValueError('Training requires 1 <= k < reference rows.')
    ids = np.empty((n, k), dtype=np.intp)
    distance = np.empty((n, k))
    for start in range(0, n, batch_size):
        candidates, lengths = batched_top_k(reference, reference[start:start+batch_size], k+1, batch_size)
        for local in range(len(candidates)):
            # start+local is the GLOBAL original row ID; local alone is wrong after block 0.
            keep = candidates[local] != start+local
            ids[start+local] = candidates[local][keep][:k]
            distance[start+local] = lengths[local][keep][:k]
    return ids, distance


class ReferenceLOF:
    def __init__(self, k=2, batch_size=16, epsilon=0.):
        if type(batch_size) is not int or batch_size < 1:
            raise ValueError('Use a positive integer batch size.')
        if not np.isfinite(epsilon) or epsilon < 0:
            raise ValueError('Epsilon must be finite and nonnegative.')
        self.k, self.batch_size, self.epsilon = k, batch_size, float(epsilon)

    def fit(self, reference, feature_order=None):
        x = np.asarray(reference, dtype=np.float64)
        if x.ndim != 2 or not x.shape[1] or not np.isfinite(x).all():
            raise ValueError('Use finite reference rows with feature columns.')
        order = list(feature_order) if feature_order is not None else [f'x{i}' for i in range(x.shape[1])]
        if len(order) != x.shape[1] or len(set(order)) != len(order):
            raise ValueError('Feature names must match the columns and be unique.')
        # Requested choices may have changed since construction; validate them again.
        if type(self.batch_size) is not int or self.batch_size < 1:
            raise ValueError('Use a positive integer batch size.')
        if not np.isfinite(self.epsilon) or self.epsilon < 0:
            raise ValueError('Epsilon must be finite and nonnegative.')
        k, batch_size, epsilon = self.k, self.batch_size, float(self.epsilon)
        # Build the whole candidate locally. Rejection must not mix fit versions.
        reference = x.copy()
        neighbors, distances = reference_neighbors(x, k, batch_size)
        radius = distances[:, -1]
        reach = np.maximum(distances, radius[neighbors])
        try:
            lrd = positive_density(reach, epsilon)
            training_factor = density_factor(lrd[neighbors], lrd)
        except ValueError as error:
            retained = (' Previous fitted reference retained.' if getattr(self, '_fit_valid', False)
                        else ' No fitted reference is available.')
            raise ValueError(str(error)+retained) from error
        # Publish only after every statistic is valid, including fitted parameters.
        self.__dict__.update(reference=reference, feature_order=order,
                             neighbors=neighbors, distances=distances,
                             radius=radius, reach=reach, lrd=lrd,
                             training_factor=training_factor,
                             fitted_k=k, fitted_epsilon=epsilon,
                             fitted_batch_size=batch_size, _fit_valid=True)
        return self

    def inspect_queries(self, queries, feature_order=None):
        required = ('reference', 'feature_order', 'neighbors', 'distances', 'radius',
                    'reach', 'lrd', 'training_factor', 'fitted_k', 'fitted_epsilon',
                    'fitted_batch_size')
        if not getattr(self, '_fit_valid', False) or not all(hasattr(self, key) for key in required):
            raise ValueError('Fit a complete valid reference first.')
        if feature_order is not None and list(feature_order) != self.feature_order:
            raise ValueError('Query feature order differs from the reference.')
        ids, distance = batched_top_k(self.reference, queries, self.fitted_k, self.fitted_batch_size)
        reach = np.maximum(distance, self.radius[ids])
        lrd = positive_density(reach, self.fitted_epsilon)
        factor = density_factor(self.lrd[ids], lrd)
        return {'ids': ids, 'distances': distance, 'reach': reach, 'lrd': lrd, 'factor': factor}
