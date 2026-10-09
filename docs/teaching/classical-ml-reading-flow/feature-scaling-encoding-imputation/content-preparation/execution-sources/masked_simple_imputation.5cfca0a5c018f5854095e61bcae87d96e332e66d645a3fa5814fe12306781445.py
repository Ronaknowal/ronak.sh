"""Fill only original missing cells; keep all-feature recording indicators.

Includes the complete P1 indicator and robust-ruler successor. P1 itself is
retained unchanged and is not imported/executed by this new programme.
"""
from dataclasses import dataclass
import numpy as np
from sklearn.impute import SimpleImputer, MissingIndicator
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from fitted_rulers import matrix, frozen, fit_ruler, transform


@dataclass(frozen=True)
class FillState:
    names: tuple
    counts: np.ndarray
    values: np.ndarray
    strategy: str


def fit_fill(X, names, strategy='median', constant=0., empty='reject'):
    X = matrix(X)
    names = tuple(names)
    if len(names) != X.shape[1] or len(set(names)) != len(names):
        raise ValueError('one distinct name per feature')
    if strategy not in ['mean', 'median', 'constant'] or empty not in ['reject', 'constant']:
        raise ValueError('unknown strategy or empty policy')
    if not np.isfinite(constant):
        raise ValueError('finite constant required')
    counts = (~np.isnan(X)).sum(axis=0)
    if np.any(counts == 0) and empty == 'reject':
        raise ValueError('entire training column missing')
    values = np.full(X.shape[1], float(constant))
    for j in np.flatnonzero(counts):
        observed = X[~np.isnan(X[:, j]), j]
        values[j] = np.mean(observed) if strategy == 'mean' else (
            np.median(observed) if strategy == 'median' else constant)
    if not np.isfinite(values).all():
        raise ValueError('fitted fill overflow')
    return FillState(names, frozen(counts), frozen(values), strategy)


def fill(state, X, names, indicators=False):
    X = matrix(X, len(state.names))
    if tuple(names) != state.names:
        raise ValueError('changed name/order')
    missing = np.isnan(X)
    result = np.where(missing, state.values, X)
    return (np.column_stack([result, missing.astype(float)]) if indicators else result), missing


def fit_mixed(numeric, categories, robust=False):
    # Reserved marker is checked, not silently merged with a real label.
    from category_policies import labels
    numeric = matrix(numeric)
    category = np.array(labels(categories))
    if len(category) != len(numeric):
        raise ValueError('one category per numeric row')
    names = tuple('x'+str(j) for j in range(numeric.shape[1]))
    imputer = fit_fill(numeric, names)
    completed, _ = fill(imputer, numeric, names)
    ruler = fit_ruler(completed, names, 'robust' if robust else 'standard')
    return imputer, ruler, frozen(np.unique(category))


def mixed_transform(state, numeric, categories):
    from category_policies import labels
    imputer, ruler, vocabulary = state
    category = np.array(labels(categories))
    completed, mask = fill(imputer, numeric, imputer.names)
    if len(category) != len(completed):
        raise ValueError('one category per row')
    scaled = transform(ruler, completed, ruler.names)
    onehot = (category[:, None] == vocabulary).astype(float)
    return np.column_stack([scaled, onehot, mask.astype(float)])


if __name__ == '__main__':
    X = np.array([[10., 0.], [20., 2.], [np.nan, 4.], [np.nan, 6.]])
    state = fit_fill(X, ['length', 'other'])
    result, mask = fill(state, [[np.nan, 0.], [15., np.nan]], state.names, True)
    ordinary = SimpleImputer(strategy='median', keep_empty_features=True).fit(X)
    q = np.array([[np.nan, 0.], [15., np.nan]])
    expected = np.column_stack([ordinary.transform(q), MissingIndicator(features='all', error_on_new=False).fit(X).transform(q)])
    np.testing.assert_array_equal(result, expected)
    print('fill plus all indicators:', result.tolist())
    print('original mask:', mask.astype(int).tolist())
    missing_only = SimpleImputer(strategy='median', add_indicator=True).fit(X)
    print('fit-missing-only width:', missing_only.transform(q).shape[1], 'all width:', result.shape[1])
    train = np.array([[10., 100., 7.], [20., np.nan, 7.], [30., 300., 7.], [np.nan, 500., 7.]])
    cats = ['b', 'a', None, 'a']
    q = np.array([[15., 500., np.nan]])
    standard_state = fit_mixed(train, cats)
    print('standard indicator extension:', np.round(mixed_transform(standard_state, q, ['b']), 6).tolist())
    robust_state = fit_mixed(train, cats, robust=True)
    got = mixed_transform(robust_state, q, ['b'])
    imp = SimpleImputer(strategy='median').fit(train)
    rob = RobustScaler(quantile_range=(25, 75)).fit(imp.transform(train))
    enc = OneHotEncoder(categories=[robust_state[2].tolist()], sparse_output=False).fit(np.array(['b', 'a', '@missing', 'a'])[:, None])
    expected = np.column_stack([rob.transform(imp.transform(q)), enc.transform([['b']]), np.isnan(q)])
    np.testing.assert_allclose(got, expected)
    print('robust indicator extension:', got.tolist())
    empty = fit_fill([[np.nan, 0.], [np.nan, 1.]], ['empty', 'measured'], empty='constant', constant=-1)
    print('empty kept constant:', fill(empty, [[np.nan, 0]], empty.names)[0].tolist())
    try:
        fit_fill([[np.nan]], ['empty'])
    except ValueError as exc:
        print('refused:', exc)
