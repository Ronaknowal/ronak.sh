import math
import numpy as np
from sklearn.ensemble import IsolationForest
from isolation_core import IndexedIsolation, correction_table, sample_ids, corrected_paths


def main():
    c = correction_table(5)
    # Explicit node arrays for the two reachable trees over F0..F3=[0,1,2,10].
    # Tree A: cut5 -> singleton10. Tree B: cut.5 -> cut1.5 -> terminal[2,10].
    tree_a = {'feature': np.array([0, -1, -1]), 'cut': np.array([5., np.nan, np.nan]),
              'left': np.array([1, -1, -1]), 'right': np.array([2, -1, -1]),
              'population': np.array([4, 3, 1])}
    tree_b = {'feature': np.array([0, -1, 0, -1, -1]),
              'cut': np.array([.5, np.nan, 1.5, np.nan, np.nan]),
              'left': np.array([1, -1, 3, -1, -1]), 'right': np.array([2, -1, 4, -1, -1]),
              'population': np.array([4, 1, 3, 1, 2])}
    paths = np.array([corrected_paths(tree, np.array([[10.]]), c)[0] for tree in (tree_a, tree_b)])
    np.testing.assert_array_equal(paths, [1., 3.])
    print('reachable psi4 paths/normalizer:', paths.tolist(), round(c[4], 12))
    print('score mean path / mean scores:', round(float(np.exp2(-paths.mean()/c[4])), 12),
          round(float(np.exp2(-paths/c[4]).mean()), 12))
    x = np.array([[0., 0.], [1., .2], [2., .4], [10., 2.]])
    scratch = IndexedIsolation(trees=8, max_samples=4, seed=17).fit(x, ['level', 'change'])
    print('indexed nodes:', [len(tree['feature']) for tree in scratch.nodes])
    print('scratch isolation scores:', np.round(scratch.score(x), 9).tolist())
    native = IsolationForest(n_estimators=8, max_samples=4, random_state=17, n_jobs=1).fit(x)
    native_x = x.astype(np.float32)
    total = np.zeros(len(x))
    approximate = correction_table(4, 'library')
    for estimator, features in zip(native.estimators_, native.estimators_features_):
        rows = native_x[:, features]
        leaves = estimator.apply(rows)
        edges = np.asarray(estimator.decision_path(rows).sum(axis=1)).ravel()-1
        populations = estimator.tree_.n_node_samples[leaves]
        total += edges+approximate[populations]
    reconstructed = np.exp2(-total/(8*approximate[native.max_samples_]))
    np.testing.assert_allclose(reconstructed, -native.score_samples(x), rtol=1e-12, atol=1e-12)
    print('ordinary tree reconstructed scores:', np.round(reconstructed, 9).tolist())
    print('native actual sample/offset:', native.max_samples_, native.offset_)
    constant = IndexedIsolation(trees=2, max_samples=5).fit(np.ones((5, 2)))
    np.testing.assert_allclose(constant.score([[0., 0.], [100., -20.]]), [.5, .5])
    assert constant.score(np.empty((0, 2))).shape == (0,)
    rng = np.random.default_rng(7)
    selected = sample_ids(10, 3, rng)
    assert len(set(selected.tolist())) == 3
    print('constant-reference scores:', constant.score([[0., 0.], [100., -20.]]).tolist())
    print('sparse sample IDs:', selected.tolist(), 'rare-pair omission:', math.comb(8, 3)/math.comb(10, 3))


if __name__ == '__main__':
    main()
