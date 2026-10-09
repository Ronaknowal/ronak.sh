"""Binary signed-coefficient reconstruction and named rectangular Gram state."""
import json
import warnings
import numpy as np
import sklearn
from sklearn.svm import SVC


def linear_kernel(left, right):
    return np.asarray(left, dtype=float) @ np.asarray(right, dtype=float).T


def binary_state(estimator, training, row_ids, feature_order):
    training = np.asarray(training, dtype=float)
    if len(estimator.classes_) != 2 or training.ndim != 2:
        raise ValueError('This explicit state supports binary classification only.')
    if len(row_ids) != len(training) or len(set(row_ids)) != len(row_ids):
        raise ValueError('Unique training IDs must match all rows.')
    if len(feature_order) != training.shape[1] or len(set(feature_order)) != len(feature_order):
        raise ValueError('Unique feature names must match the training columns.')
    signed = np.zeros(len(training))
    signed[estimator.support_] = estimator.dual_coef_[0]
    return {'schema': 1, 'kernel': 'linear', 'classes': estimator.classes_.tolist(),
            'training': training.copy().tolist(), 'train_ids': list(row_ids),
            'feature_order': list(feature_order), 'signed_coefficients': signed.tolist(),
            'bias': float(estimator.intercept_[0]), 'tie_column': 1}


def scores_from_named_gram(gram, column_ids, state):
    gram = np.asarray(gram, dtype=float)
    if state.get('schema') != 1 or state.get('kernel') != 'linear':
        raise ValueError('Unknown state schema or kernel.')
    if list(column_ids) != state['train_ids']:
        raise ValueError('Gram columns must match the saved training row identities/order.')
    signed = np.asarray(state['signed_coefficients'], dtype=float)
    if gram.ndim != 2 or gram.shape[1] != len(signed) or not np.isfinite(gram).all():
        raise ValueError('Use finite query x training similarities.')
    if signed.shape != (len(state['train_ids']),) or not np.isfinite(signed).all() or not np.isfinite(state['bias']):
        raise ValueError('Saved coefficients/bias do not satisfy the state contract.')
    return gram @ signed + state['bias']


def decision_function(queries, feature_order, state):
    if list(feature_order) != state['feature_order']:
        raise ValueError('Query feature identity/order differs from the saved model.')
    queries, training = np.asarray(queries, float), np.asarray(state['training'], float)
    if queries.ndim != 2 or training.ndim != 2 or queries.shape[1] != training.shape[1]:
        raise ValueError('Queries must retain the fitted feature count.')
    if not np.isfinite(queries).all() or not np.isfinite(training).all():
        raise ValueError('Query/training coordinates must be finite.')
    return scores_from_named_gram(linear_kernel(queries, training), state['train_ids'], state)


def main():
    x = np.array([[-1.4, -.2], [-.7, .9], [-.3, -.8], [.45, .4], [1.2, -.6], [.8, 1.1]])
    y = np.array(['left', 'left', 'left', 'right', 'right', 'right'])
    q = np.array([[-.25, .7], [.35, -.9], [1.7, .2]])
    features, ids = ['first', 'second'], [f'train-{k}' for k in range(len(x))]
    ordinary = SVC(C=.65, kernel='linear', tol=1e-9, max_iter=100000).fit(x.copy(), y)
    state = binary_state(ordinary, x, ids, features)
    restored = json.loads(json.dumps(state))
    scores = decision_function(q, features, restored)
    np.testing.assert_allclose(scores, ordinary.decision_function(q), atol=1e-12, rtol=1e-12)
    gram = linear_kernel(q, x)
    permutation = np.array([3, 0, 5, 1, 4, 2])
    together = json.loads(json.dumps(state))
    together['train_ids'] = [ids[k] for k in permutation]
    together['signed_coefficients'] = np.asarray(state['signed_coefficients'])[permutation].tolist()
    together['training'] = x[permutation].tolist()
    np.testing.assert_allclose(scores_from_named_gram(gram[:, permutation], together['train_ids'], together),
                               scores, atol=1e-12, rtol=1e-12)
    wrong_scores = gram[:, permutation] @ np.asarray(state['signed_coefficients']) + state['bias']
    assert np.max(np.abs(wrong_scores - scores)) > .01
    rejected = False
    try:
        scores_from_named_gram(gram[:, permutation], together['train_ids'], state)
    except ValueError:
        rejected = True
    assert rejected

    # A callable may retain a training reference. Our owned copy is isolated.
    supplied = x.copy()
    owned_training = supplied.copy()
    callable_fit = SVC(C=.65, kernel=linear_kernel, tol=1e-9).fit(owned_training, y)
    callable_before = callable_fit.decision_function(q).copy()
    supplied[0] += 20
    np.testing.assert_allclose(callable_fit.decision_function(q), callable_before, atol=1e-12, rtol=1e-12)
    np.testing.assert_array_equal(owned_training, x)
    precomputed = SVC(C=.65, kernel='precomputed', tol=1e-9).fit(linear_kernel(x, x), y)
    np.testing.assert_allclose(precomputed.decision_function(gram), scores, atol=1e-7, rtol=1e-7)
    with warnings.catch_warnings(record=True) as recorded:
        warnings.simplefilter('always')
        capped = SVC(C=.65, kernel='linear', max_iter=1).fit(x, y)
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'inputs': {'training': x.tolist(), 'labels': y.tolist(), 'queries': q.tolist(), 'C': .65},
              'state': state, 'query_gram_shape': list(gram.shape), 'scores': scores.tolist(),
              'ordinary_fit_status': int(ordinary.fit_status_), 'ordinary_iterations': ordinary.n_iter_.tolist(),
              'support_count': ordinary.n_support_.tolist(), 'wrong_column_scores': wrong_scores.tolist(),
              'wrong_named_columns_rejected': rejected,
              'callable_copy_scores': callable_before.tolist(),
              'precomputed_scores': precomputed.decision_function(gram).tolist(),
              'capped': {'fit_status': int(capped.fit_status_), 'iterations': capped.n_iter_.tolist(),
                         'warnings': [str(item.message) for item in recorded]}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
