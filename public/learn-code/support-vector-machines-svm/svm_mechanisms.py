"""New dual/state calculations; keep svm_core.py beside this complete driver."""
import json
import numpy as np
import sklearn
from sklearn.svm import SVC
from svm_core import PairSVM


def main():
    # Newly declared fixture, separate from every historical dataset and main.
    x = np.array([[-1.3, .2], [-.6, -.4], [.4, .7], [1.1, -.3], [-.2, 1.3], [.8, 1.2]])
    y = np.array([-1., -1., 1., 1., -1., 1.])
    queries = np.array([[.15, -.8], [-.7, .6], [1.4, .25]])
    names = ['coordinate_a', 'coordinate_b']
    rows = [f'new-{i}' for i in range(len(x))]
    fits = []
    for kernel in ('linear', 'rbf'):
        ours = PairSVM(c=.8, kernel=kernel, gamma=.7, tolerance=1e-9).fit(
            x, y, feature_order=names, row_ids=rows)
        ordinary = SVC(C=.8, kernel=kernel, gamma=.7, tol=1e-10,
                       shrinking=False, max_iter=100000).fit(x.copy(), y)
        scores = ours.decision_function(queries, feature_order=names)
        reference = ordinary.decision_function(queries)
        # Optimizers may use different pair schedules; compare scores and cost.
        np.testing.assert_allclose(scores, reference, atol=2e-5, rtol=2e-5)
        state = json.loads(json.dumps(ours.export_state()))
        restored = PairSVM.from_state(state)
        np.testing.assert_allclose(restored.decision_function(queries), scores,
                                   atol=1e-12, rtol=1e-12)
        x_snapshot = ours.x.copy()
        alpha_snapshot = ours.alpha.copy()
        state['x'][0][0] += .9
        state['alpha'][0] = .123
        np.testing.assert_array_equal(ours.x, x_snapshot)
        np.testing.assert_array_equal(ours.alpha, alpha_snapshot)
        fits.append({'kernel': kernel, 'status': ours.status, 'steps': ours.steps,
                     'primal': ours.primal, 'dual': ours.dual, 'gap': ours.gap,
                     'alpha': ours.alpha.tolist(), 'bias': ours.bias,
                     'queries': queries.tolist(), 'scores': scores.tolist(),
                     'ordinary_scores': reference.tolist(),
                     'ordinary_fit_status': int(ordinary.fit_status_),
                     'ordinary_iterations': ordinary.n_iter_.tolist(),
                     'max_score_difference': float(np.max(np.abs(scores - reference))),
                     'trace': ours.trace})

    # A three-row feasible state exposes both changed Q columns in every G cell.
    small_x = np.array([[-.8, .3], [.4, -.7], [.9, .2]])
    small_y = np.array([-1., 1., 1.])
    solver = PairSVM(c=.9, kernel='linear')
    gram = solver.matrix(small_x, small_x)
    q = small_y[:, None] * gram * small_y[None, :]
    alpha = np.array([.3, .1, .2])
    gradient = 1 - q @ alpha
    i, j = np.array([0]), np.array([2])
    sign = small_y[i] * small_y[j]
    curvature = np.sum((small_x[i] - small_x[j]) ** 2, axis=1)
    delta, gain, slope, lower, upper = solver.pair_candidates(
        alpha, gradient, i, j, sign, curvature)
    changed = alpha.copy()
    changed[0], changed[2] = alpha[0] - sign[0] * delta[0], alpha[2] + delta[0]
    new_gradient = gradient - q[:, 0] * (changed[0] - alpha[0]) - q[:, 2] * (changed[2] - alpha[2])
    np.testing.assert_allclose(new_gradient, 1 - q @ changed, atol=1e-12, rtol=1e-12)
    assert abs(changed @ small_y) <= 1e-12
    pair = {'Q': q.tolist(), 'alpha_before': alpha.tolist(), 'G_before': gradient.tolist(),
            'pair': [0, 2], 'slope': float(slope[0]), 'curvature': float(curvature[0]),
            'interval': [float(lower[0]), float(upper[0])], 'delta': float(delta[0]),
            'gain': float(gain[0]), 'alpha_after': changed.tolist(), 'G_after': new_gradient.tolist()}
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'fit_inputs': {'x': x_snapshot.tolist(), 'y': y.tolist(), 'C': .8, 'gamma': .7},
              'fits': fits, 'changed_pair': pair}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
