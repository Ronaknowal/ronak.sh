"""One field: train-only counts, explicit rare/missing/unknown policy.

Real strings starting with '@' are rejected to avoid reserved-marker collisions.
Missing stays a separate category even when rare; this is a declared policy.
"""
from collections import Counter
from dataclasses import dataclass
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder


def labels(values):
    result = []
    for value in values:
        if value is None:
            result.append('@missing')
        elif not isinstance(value, str) or value.startswith('@'):
            raise ValueError('use strings without reserved @ prefix, or None')
        else:
            result.append(value)
    return result


@dataclass(frozen=True)
class Categories:
    counts: tuple
    rare: frozenset
    vocabulary: tuple
    drop: object


def fit_categories(values, min_count=1, drop=None):
    values = labels(values)
    if not values or not isinstance(min_count, int) or isinstance(min_count, bool) or min_count < 1:
        raise ValueError('nonempty training labels; positive integer min_count')
    counts = Counter(values)
    rare = frozenset(x for x, n in counts.items() if n < min_count and x != '@missing')
    vocabulary = tuple(sorted((set(counts)-rare) | ({'@rare'} if rare else set())))
    if drop is not None and drop not in vocabulary:
        raise ValueError('drop must name a fitted output category')
    return Categories(tuple(sorted(counts.items())), rare, vocabulary, drop)


def encode(state, values, unknown='error', sparse=False):
    if unknown not in ['error', 'ignore', 'infrequent_if_exist']:
        raise ValueError('unknown policy')
    names = tuple(x for x in state.vocabulary if x != state.drop)
    positions = {name: j for j, name in enumerate(names)}
    row_ids, col_ids = [], []
    values = labels(values)
    for i, value in enumerate(values):
        value = '@rare' if value in state.rare else value
        if value not in state.vocabulary:
            if unknown == 'error':
                raise ValueError('unseen category: '+value)
            value = '@rare' if unknown == 'infrequent_if_exist' and '@rare' in state.vocabulary else None
        if value in positions:
            row_ids.append(i)
            col_ids.append(positions[value])
    result = csr_matrix((np.ones(len(row_ids)), (row_ids, col_ids)),
                        shape=(len(values), len(names)))
    return (result if sparse else result.toarray()), names


def ordinal(values, order, unknown=-1, missing=-2):
    order = labels(order)
    if '@missing' in order or len(set(order)) != len(order):
        raise ValueError('distinct observed ordered categories')
    if unknown in range(len(order)) or missing in range(len(order)) or unknown == missing:
        raise ValueError('unknown/missing codes must be distinct from ordered codes')
    lookup = {value: j for j, value in enumerate(order)}
    return np.array([missing if x == '@missing' else lookup.get(x, unknown)
                     for x in labels(values)])


if __name__ == '__main__':
    train = ['a', 'a', 'a', 'a', 'b', None]
    state = fit_categories(train, 2)
    actual, names = encode(state, ['b', 'new', None, 'a'], 'infrequent_if_exist')
    print('counts:', state.counts, 'columns:', names)
    print('b/new/missing/a:', actual.tolist())
    assert fit_categories(list(reversed(train)), 2) == state
    # Compare the same already-grouped policy, with an explicit column order.
    grouped_train = ['@rare' if x in state.rare else x for x in labels(train)]
    grouped_query = ['@rare', '@rare', '@missing', 'a']
    library = OneHotEncoder(categories=[list(state.vocabulary)], sparse_output=False,
                            handle_unknown='ignore').fit(np.array(grouped_train)[:, None])
    np.testing.assert_array_equal(actual, library.transform(np.array(grouped_query)[:, None]))
    # Native sklearn rare handling is a separate policy (it can group missing).
    native = OneHotEncoder(min_frequency=2, handle_unknown='infrequent_if_exist',
                           sparse_output=True).fit(np.array(labels(train))[:, None])
    print('native rare names:', native.get_feature_names_out().tolist())
    print('native missing/new:', native.transform([['@missing'], ['new']]).toarray().tolist())
    bare = fit_categories(['a', 'a'])
    print('no rare bucket, unseen:', encode(bare, ['new'], 'infrequent_if_exist')[0].tolist())
    print('ordinal:', ordinal(['small', 'large', 'new', None], ['small', 'medium', 'large']).tolist())
    ordinary = OrdinalEncoder(categories=[['small', 'medium', 'large', np.nan]],
                              handle_unknown='use_encoded_value', unknown_value=-1,
                              encoded_missing_value=-2).fit(np.array([['small'], ['medium'], ['large'], [np.nan]], object))
    print('ordinary ordinal:', ordinary.transform(np.array([['small'], ['large'], ['new'], [np.nan]], object)).ravel().tolist())
    full, _ = encode(fit_categories(['red', 'green', 'blue']), ['red', 'green', 'blue'])
    dropped, _ = encode(fit_categories(['red', 'green', 'blue'], drop='red'), ['red', 'green', 'blue'])
    print('full red distances:', np.linalg.norm(full[1:]-full[0], axis=1).tolist())
    print('drop red distances:', np.linalg.norm(dropped[1:]-dropped[0], axis=1).tolist())
    try:
        fit_categories(['@missing'])
    except ValueError as exc:
        print('refused:', exc)
