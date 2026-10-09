"""Complete signed neighborhood contracts and ordinary Surprise comparisons.

Run: python recommender-neighborhood-contracts.py
Requires NumPy, pandas and scikit-surprise 1.1.5. NaN denotes missing, never 0.
The guarded main fits only the four declared new small KNN constructions.
"""
import json
import math

import numpy as np


def ratings_matrix(value):
    ratings = np.asarray(value, dtype=np.float64)
    if ratings.ndim != 2 or min(ratings.shape) < 1 or np.isinf(ratings).any():
        raise ValueError('finite-or-NaN rectangular ratings are required')
    return ratings


def means(value):
    ratings = ratings_matrix(value)
    mask = np.isfinite(ratings)
    counts = mask.sum(axis=1)
    sums = np.where(mask, ratings, 0.).sum(axis=1)
    result = np.full(ratings.shape[0], np.nan)
    np.divide(sums, counts, out=result, where=counts > 0)
    return result, counts


def similarity(value, first, second, orientation='user', centering='full-row',
               minimum=2, shrinkage=0.):
    ratings = ratings_matrix(value)
    if orientation not in ('user', 'item') or centering not in ('raw', 'full-row', 'pair'):
        raise ValueError('declare user/item orientation and raw/full-row/pair centering')
    if not isinstance(minimum, int) or minimum < 1 or not math.isfinite(shrinkage) or shrinkage < 0:
        raise ValueError('positive integer support and nonnegative finite shrinkage required')
    vectors = ratings if orientation == 'user' else ratings.T
    if not 0 <= first < len(vectors) or not 0 <= second < len(vectors):
        raise ValueError('selected entity ID is outside its actual table')
    overlap = np.isfinite(vectors[first]) & np.isfinite(vectors[second])
    positions = np.flatnonzero(overlap)
    left, right = vectors[first, overlap].copy(), vectors[second, overlap].copy()
    center_left, center_right = np.zeros(len(left)), np.zeros(len(right))
    if centering == 'pair' and len(left):
        center_left[:] = left.mean()
        center_right[:] = right.mean()
    elif centering == 'full-row':
        # User CF centers each selected user's full row. Adjusted item cosine
        # instead centers both item entries by the shared counterpart user's row.
        row_means, _ = means(ratings)
        if orientation == 'user':
            center_left[:] = row_means[first]
            center_right[:] = row_means[second]
        else:
            center_left = row_means[overlap]
            center_right = row_means[overlap]
    left_residual, right_residual = left-center_left, right-center_right
    product = left_residual*right_residual
    denominator = float(np.linalg.norm(left_residual)*np.linalg.norm(right_residual))
    available = len(positions) >= minimum and denominator > 0
    raw_weight = float(product.sum()/denominator) if available else None
    weight = raw_weight * len(positions)/(len(positions)+shrinkage) if available else None
    return {'first': first, 'second': second, 'orientation': orientation,
            'centering': centering, 'sharedPositions': positions,
            'left': left, 'right': right, 'leftCenter': center_left,
            'rightCenter': center_right, 'leftResidual': left_residual,
            'rightResidual': right_residual, 'coordinateProducts': product,
            'numerator': float(product.sum()), 'denominator': denominator,
            'support': len(positions), 'available': available,
            'rawWeight': raw_weight, 'weight': weight}


def predict(value, user, item, orientation='user', centering='full-row',
            minimum=2, shrinkage=0., neighbors=30, positive_only=False, prior=None):
    ratings = ratings_matrix(value)
    if not 0 <= user < ratings.shape[0] or not 0 <= item < ratings.shape[1]:
        raise ValueError('query user/item ID is outside the actual table')
    if not isinstance(neighbors, int) or neighbors < 1:
        raise ValueError('positive integer k required')
    row_means, _ = means(ratings)
    observed = ratings[np.isfinite(ratings)]
    baseline = row_means[user] if np.isfinite(row_means[user]) else (float(observed.mean()) if observed.size else prior)
    if baseline is not None and not math.isfinite(baseline):
        raise ValueError('fallback prior must be finite or explicitly absent')
    target, size = (user, ratings.shape[0]) if orientation == 'user' else (item, ratings.shape[1])
    candidates, all_pairs = [], []
    for other in range(size):
        if other == target:
            continue
        rating = ratings[other, item] if orientation == 'user' else ratings[user, other]
        if not np.isfinite(rating):
            continue
        pair = similarity(ratings, target, other, orientation, centering, minimum, shrinkage)
        all_pairs.append(pair)
        weight = pair['weight']
        if weight is None or weight == 0 or (positive_only and weight <= 0):
            continue
        signal = float(rating)
        if centering != 'raw':
            signal -= row_means[other] if orientation == 'user' else row_means[user]
        candidates.append({'id': other, 'rating': float(rating), 'weight': weight,
                           'signal': signal, 'product': weight*signal})
    accepted = sorted(candidates, key=lambda row: (-abs(row['weight']), row['id']))[:neighbors]
    denominator = sum(abs(row['weight']) for row in accepted)
    if denominator and (centering == 'raw' or baseline is not None):
        correction = sum(row['product'] for row in accepted)/denominator
        result = correction if centering == 'raw' else baseline+correction
        fallback = False
    else:
        result, correction, fallback = baseline, None, True
    return {'score': result, 'baseline': baseline, 'pairs': all_pairs,
            'accepted': accepted, 'absoluteDenominator': denominator,
            'correction': correction, 'fallback': fallback,
            'rule': f'{orientation}/{centering}/' + ('positive' if positive_only else 'signed')}


def cluster_aggregate(value, members):
    ratings = ratings_matrix(value)
    if len(set(members)) != len(members) or any(not 0 <= member < len(ratings) for member in members):
        raise ValueError('cluster members must be unique valid user IDs')
    block = ratings[members]
    observed = np.isfinite(block)
    counts = observed.sum(axis=0)
    sums = np.where(observed, block, 0.).sum(axis=0)
    average = [float(total/count) if count else None for total, count in zip(sums, counts)]
    return {'memberIDs': members, 'sums': sums, 'counts': counts, 'means': average}


def ordinary_comparisons(value):
    import pandas as pd
    import surprise
    from surprise import Dataset, Reader, KNNBasic, KNNWithMeans

    if surprise.__version__ != '1.1.5':
        raise RuntimeError('this constructed comparison locks scikit-surprise 1.1.5')
    ratings = ratings_matrix(value)
    events = [(f'U{user}', f'I{item}', float(ratings[user, item]))
              for user, item in zip(*np.nonzero(np.isfinite(ratings)))]
    dataset = Dataset.load_from_df(pd.DataFrame(events, columns=['user', 'item', 'rating']),
                                  Reader(rating_scale=(-10, 10)))
    train = dataset.build_full_trainset()
    results = []
    for user_based in [True, False]:
        for algorithm in [KNNBasic, KNNWithMeans]:
            model = algorithm(k=30, min_k=1,
                              sim_options={'name': 'pearson', 'user_based': user_based, 'min_support': 2},
                              verbose=False)
            model.fit(train)
            prediction = model.predict('U0', 'I2', clip=False)
            results.append({'algorithm': algorithm.__name__, 'userBased': user_based,
                            'estimate': prediction.est, 'details': prediction.details,
                            'similarity': model.sim,
                            'fullTrainingMeans': model.means if hasattr(model, 'means') else None})
    return {'version': surprise.__version__, 'globalMean': float(train.global_mean),
            'userMapping': {f'U{u}': train.to_inner_uid(f'U{u}') for u in range(ratings.shape[0])},
            'itemMapping': {f'I{i}': train.to_inner_iid(f'I{i}') for i in range(ratings.shape[1])},
            'constructedKNNFits': 4, 'results': results,
            'difference': 'Native Pearson uses each pair-overlap mean and positive neighbors. WithMeans uses full-training row means of its selected entity orientation.'}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    ratings = [[5., 1., np.nan], [4., 2., 3.], [1., 5., 5.]]
    signed = predict(ratings, 0, 2)
    positive = predict(ratings, 0, 2, positive_only=True)
    expected = 3-4/(math.sqrt(10)+3)
    if abs(signed['score']-expected) > 1e-13 or positive['score'] != 3.:
        raise AssertionError('changed user-CF fixture differs from the declared signed/positive rules')
    report = {'ratings': [[None if np.isnan(v) else v for v in row] for row in ratings],
              'rowMeans': means(ratings)[0], 'signedUserCF': signed, 'positiveUserCF': positive,
              'itemCF': predict(ratings, 0, 2, orientation='item'),
              'rawPair': similarity(ratings, 0, 1, centering='raw'),
              'pairCentered': similarity(ratings, 0, 2, centering='pair'),
              'cluster': cluster_aggregate(ratings, [0, 1]),
              'emptyFallback': predict([[np.nan, np.nan]], 0, 1, minimum=1, prior=3.),
              'zeroNormPair': similarity([[0., 0.], [1., 2.]], 0, 1, centering='raw'),
              'ordinary': ordinary_comparisons(ratings),
              'cost': 'Selected pair O(counterpart entities); all item pairs O(U*I^2); accepted neighbor storage O(k) plus the actual matrix.'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
