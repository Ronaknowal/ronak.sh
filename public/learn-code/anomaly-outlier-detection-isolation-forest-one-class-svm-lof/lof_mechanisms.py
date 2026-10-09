import numpy as np
from sklearn.neighbors import LocalOutlierFactor, NearestNeighbors
from lof_core import ReferenceLOF, reference_neighbors


def main():
    reference = np.array([0., 1., 2., 20., 24., 28.])[:, None]
    hand = ReferenceLOF(k=2, batch_size=2).fit(reference)
    query = hand.inspect_queries([[4.], [17.], [6.], [1.]])
    print('radii:', hand.radius.tolist())
    print('reference lrd:', np.round(hand.lrd, 9).tolist())
    print('queries4/17/6/1 neighbors:', query['ids'].tolist())
    print('query reach:', query['reach'].tolist())
    print('query factors:', np.round(query['factor'], 9).tolist())
    print('training row1 factor:', round(float(hand.training_factor[1]), 9))
    k3 = ReferenceLOF(k=3).fit(reference).inspect_queries([[4.], [17.]])
    np.testing.assert_allclose(k3['factor'], [1., 1.])
    print('k3 factors:', k3['factor'].tolist())
    # Untied distances avoid promising a common backend's cutoff-ID convention.
    untied = np.array([0., .7, 2.3, 8.1, 12.8, 20.2])[:, None]
    compat = ReferenceLOF(k=2, epsilon=1e-10).fit(untied)
    ordinary = LocalOutlierFactor(n_neighbors=2, novelty=True, algorithm='brute', metric='euclidean').fit(untied)
    np.testing.assert_allclose(compat.training_factor, -ordinary.negative_outlier_factor_, rtol=1e-10)
    later = np.array([[3.2], [15.4]])
    np.testing.assert_allclose(compat.inspect_queries(later)['factor'], -ordinary.score_samples(later), rtol=1e-10)
    nearest = NearestNeighbors(n_neighbors=2, algorithm='brute').fit(untied)
    lengths, ids = nearest.kneighbors(later)
    np.testing.assert_array_equal(ids, compat.inspect_queries(later)['ids'])
    print('ordinary later factors:', np.round(-ordinary.score_samples(later), 9).tolist())
    duplicates = np.array([0., 0., 0., 0., 2., 3.])[:, None]
    ids, lengths = reference_neighbors(duplicates, 2, 2)
    assert ids[3].tolist() == [0, 1]
    print('duplicate row3 other IDs:', ids[3].tolist(), 'distances:', lengths[3].tolist())
    stabilized = ReferenceLOF(k=2, epsilon=1e-10).fit(np.zeros((4, 1)))
    print('identical stabilized factors:', stabilized.training_factor.tolist())
    assert stabilized.inspect_queries(np.empty((0, 1)))['factor'].shape == (0,)


if __name__ == '__main__':
    main()
