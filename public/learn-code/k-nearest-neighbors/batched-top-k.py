"""Exact Euclidean retrieval, bounded by a query batch; Python3.12/NumPy2.3.5."""
import numpy as np
from sklearn.neighbors import NearestNeighbors


def batched_top_k(reference, queries, k, batch_size=32):
    reference = np.asarray(reference, dtype=np.float64)
    queries = np.asarray(queries, dtype=np.float64)
    if (reference.ndim != 2 or not len(reference) or not reference.shape[1]
            or queries.ndim != 2 or queries.shape[1] != reference.shape[1]
            or not np.isfinite(reference).all() or not np.isfinite(queries).all()):
        raise ValueError('finite reference/query matrices with the same feature columns required')
    if type(k) is not int or not 1 <= k <= len(reference):
        raise ValueError('k must be an integer in 1..reference rows')
    if type(batch_size) is not int or batch_size < 1:
        raise ValueError('batch size must be a positive integer')
    selected_rows = np.empty((len(queries), k), dtype=np.intp)
    selected_distances = np.empty((len(queries), k))
    for start in range(0, len(queries), batch_size):
        block = queries[start:start+batch_size]
        distance = np.zeros((len(block), len(reference)))
        # Each temporary is b-by-n, not b-by-n-by-d. Hypot avoids squaring
        # tiny/large representable differences; an overflowing difference fails.
        with np.errstate(over='raise', invalid='raise'):
            for feature in range(reference.shape[1]):
                difference = reference[None, :, feature] - block[:, None, feature]
                np.hypot(distance, difference, out=distance)
        if not np.isfinite(distance).all():
            raise ValueError('distance is not representable; rescale coordinates')
        partition = np.argpartition(distance, k-1, axis=1)
        for local, row in enumerate(distance):
            cutoff = row[partition[local, k-1]]
            closer = np.flatnonzero(row < cutoff)
            equal = np.flatnonzero(row == cutoff)
            # Original row position is the stable ID. Scan it linearly; do not
            # sort every tied row or accept argpartition's arbitrary tie subset.
            chosen = np.concatenate((closer, equal[:k-len(closer)]))
            chosen = chosen[np.lexsort((chosen, row[chosen]))]
            selected_rows[start+local] = chosen
            selected_distances[start+local] = row[chosen]
    return selected_rows, selected_distances


def main():
    reference = np.array([[-1., 0.], [1., 0.], [0., 2.], [0., -2.]])
    queries = np.array([[0., 0.], [.3, .1]])
    ids, distances = batched_top_k(reference, queries, 2, batch_size=1)
    print('Cutoff ties prefer original positions:', ids.tolist())
    print('Distances:', np.round(distances, 9).tolist())
    rng = np.random.default_rng(61)
    reference = rng.normal(size=(37, 4)); queries = rng.normal(size=(11, 4))
    for k in (1, 7, 37):
        ids, distances = batched_top_k(reference, queries, k, 3)
        brute = np.hypot.reduce(reference[None, :, :] - queries[:, None, :], axis=2)
        expected = np.argsort(brute, axis=1, kind='stable')[:, :k]
        np.testing.assert_array_equal(ids, expected)
        np.testing.assert_allclose(distances, np.take_along_axis(brute, expected, axis=1))
        other_ids, other_distances = batched_top_k(reference, queries, k, 11)
        np.testing.assert_array_equal(ids, other_ids)
        np.testing.assert_array_equal(distances, other_distances)
    native = NearestNeighbors(n_neighbors=7, algorithm='brute').fit(reference)
    native_distance, native_ids = native.kneighbors(queries)
    ids, distances = batched_top_k(reference, queries, 7, 3)
    np.testing.assert_array_equal(ids, native_ids)  # This random fixture has no cutoff ties.
    np.testing.assert_allclose(distances, native_distance, rtol=1e-12, atol=1e-12)
    for scale in (1e-200, 1e150):
        ids, distances = batched_top_k(np.array([[0.], [scale], [2*scale]]), [[.8*scale]], 2)
        np.testing.assert_array_equal(ids, [[1, 0]])
        np.testing.assert_allclose(distances/scale, [[.2, .8]], rtol=1e-12)
    print('Full stable-sort, batch-size, untied sklearn and tiny/large-scale checks passed.')
    print('Distance workspace: b×n; output: query_count×k; no speed measurement claimed.')


if __name__ == '__main__':
    main()
