"""Complete changed-input solutions; imports only the new supported modules.

These are answer assets, listed separately from the teaching-program index.
The original three retained programmes are never imported or replayed here.
"""
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder, FunctionTransformer
from fitted_rulers import fit_ruler, transform
from category_policies import fit_categories, encode, ordinal
from masked_simple_imputation import fit_mixed, mixed_transform, fit_fill, fill
from nan_aware_donors import fit_donors, complete
from fitted_power_maps import forward, inverse
from fitted_quantile_maps import fit_quantiles, apply
from bins_polynomials_cycles import fit_bins, membership, monomials, cycle
from local_spline_basis import fit_splines, design
from fitted_target_encoding import fit_target, transform_target, cross_encode
from signed_feature_hashing import signed_hash
from conditional_iterative_completion import fit_completion, transform_completion
from pool_scalar_analyses import pool_scalar
from normal_completion_and_sensitivity import complete_normal


def indicator_solution():
    train = np.array([[10., 100., 7.], [20., np.nan, 7.], [30., 300., 7.], [np.nan, 500., 7.]])
    categories = ['b', 'a', None, 'a']
    state = fit_mixed(train, categories)
    before = (state[0].values.copy(), state[1].center.copy(), state[1].scale.copy(), state[2].copy())
    standard = mixed_transform(state, [[15., 500., np.nan]], ['b'])
    np.testing.assert_allclose(standard, [[-1/np.sqrt(2), np.sqrt(2), 0, 0, 1, 0, 0, 0, 1]])
    after = (state[0].values, state[1].center, state[1].scale, state[2])
    assert all(np.array_equal(a, b) for a, b in zip(before, after))
    robust = mixed_transform(fit_mixed(train, categories, robust=True), [[15., 500., np.nan]], ['b'])
    return standard, robust


def sensor_solution():
    # Amount is a magnitude in declared units; direction is cyclic degrees.
    # Grade order is domain-supplied. Device ID is nominal. All are available
    # before the prediction; y is deliberately absent from preparation.
    amount = np.array([[10.], [20.], [np.nan], [40.]])
    angle = np.array([350., 10., 30., 150.])
    grade = ['low', 'high', 'medium', 'low']
    device = ['a', 'a', 'b', None]
    q_amount, q_angle = np.array([[30.], [np.nan]]), np.array([359., 1.])
    q_grade, q_device = ['medium', 'new'], ['c', None]
    imputer = fit_fill(amount, ['amount'])
    completed, _ = fill(imputer, amount, ['amount'])
    ruler = fit_ruler(completed, ['amount'])
    category = fit_categories(device, min_count=2)
    filled, mask = fill(imputer, q_amount, ['amount'])
    onehot, names = encode(category, q_device, unknown='infrequent_if_exist')
    scratch = np.column_stack([transform(ruler, filled, ['amount']), cycle(q_angle),
                               ordinal(q_grade, ['low', 'medium', 'high']), onehot, mask])
    # Group using the same explicit fitted custom policy before ordinary
    # one-hot encoding; sklearn native rare grouping differs for missing.
    prepared_device = ['a', 'a', '@rare', '@missing']
    query_device = ['@rare', '@missing']
    X = np.column_stack([amount, angle, grade, prepared_device]).astype(object)
    Q = np.column_stack([q_amount, q_angle, q_grade, query_device]).astype(object)
    library = ColumnTransformer([
        ('amount', Pipeline([('fill', SimpleImputer(strategy='median')),
                             ('scale', StandardScaler())]), [0]),
        ('direction', FunctionTransformer(lambda X: cycle(np.asarray(X[:, 0], float)), validate=False), [1]),
        ('grade', OrdinalEncoder(categories=[['low', 'medium', 'high']],
                                 handle_unknown='use_encoded_value', unknown_value=-1), [2]),
        ('device', OneHotEncoder(categories=[list(category.vocabulary)],
                                 handle_unknown='ignore', sparse_output=False), [3]),
    ]).fit(X)
    ordinary = np.column_stack([library.transform(Q), np.isnan(q_amount)])
    np.testing.assert_allclose(scratch, ordinary, atol=1e-12)
    assert scratch.shape == (2, 8)
    return scratch, ('amount', 'cos_direction', 'sin_direction', 'grade', *names, 'amount_missing')


if __name__ == '__main__':
    print('T7 standard/robust:', [np.round(x, 6).tolist() for x in indicator_solution()])
    print('T12 equal predictions:', np.dot([1., 100.], [1., .01]), np.dot([1., 1.], [1., 1.]))
    trap = fit_donors([[0., 0., np.nan], [2., 100., 100.], [3., 0., 200.]])
    original, trace = complete(trap, [[1., np.nan, np.nan]], k=1)
    forbidden, _ = complete(trap, [[1., original[0, 1], np.nan]], k=1)
    print('T14 original/feedback:', original.tolist(), forbidden.tolist(), trace)
    print('T17 near-zero/inverse:', forward([4.], 1e-9, 'box-cox').tolist(), inverse([np.log(4.)], 0., 'box-cox').tolist())
    state = fit_quantiles([[1.], [2.], [2.], [4.], [100.]], ['x'])
    print('T18 quantile/bin:', apply(state, [[3.], [1000.]], ['x']).ravel().tolist(), membership([2.], fit_bins([1., 2., 2., 4., 100.], 4, 'quantile')).tolist())
    print('T19 products/basis/cycle:', monomials([[2., 3.]])[0].tolist(), design(fit_splines([0., 1., 2.]), [.5]).tolist(), np.round(cycle([30., 150.]), 6).tolist())
    c, y = ['A', 'A', 'B', 'B', 'C', 'C'], np.array([1., 1., 0., 0., 1., 0.])
    splits = [(np.array([1, 3, 5]), np.array([0, 2, 4])), (np.array([0, 2, 4]), np.array([1, 3, 5]))]
    print('T20 alpha0 full/OOF:', transform_target(fit_target(c, y, 0.), c).tolist(), cross_encode(c, y, splits, alpha=0.)['encoded'].tolist())
    mapping = {'apple': (0, 1), 'pear': (0, -1), 'banana': (1, 1)}
    print('T22 collision changed count:', signed_hash([{'apple': 3, 'pear': 1, 'banana': 2}, {'apple': 3, 'banana': 2}], 2, mapping)[0].toarray().tolist())
    fitted, completed, trace = fit_completion([[1., 2.], [2., 4.], [3., np.nan], [np.nan, 8.], [5., 10.]], max_iter=1)
    print('T23 one sweep/new:', np.round(completed, 6).tolist(), np.round(transform_completion(fitted, [[3., np.nan]]), 6).tolist())
    print('T24 pooled:', pool_scalar([8., 10., 10., 12.], [1.]*4))
    for delta in [-2., 0., 2.]:
        print('T25 delta:', delta, complete_normal([8., 10., np.nan, 12., np.nan], delta=delta)['pooled']['estimate'])
    matrix, names = sensor_solution()
    print('T26 columns:', names, 'rows:', np.round(matrix, 6).tolist())
