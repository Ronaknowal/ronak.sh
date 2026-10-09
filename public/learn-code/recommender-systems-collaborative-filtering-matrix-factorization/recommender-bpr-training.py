"""Complete small BPR sampler/trainer and ordinary sampler correspondence.

Run: python recommender-bpr-training.py
Requires NumPy, SciPy and implicit 0.7.3. The guarded main executes the one
declared 200-update scratch construction and one 40-epoch ordinary construction.
"""
import json
import math

import implicit
import numpy as np
from scipy.sparse import csr_matrix


def binary_matrix(value):
    matrix = np.asarray(value, dtype=np.float64)
    if matrix.ndim != 2 or min(matrix.shape) < 1 or not np.isfinite(matrix).all():
        raise ValueError('finite user-by-item binary matrix required')
    if not np.isin(matrix, [0., 1.]).all():
        raise ValueError('the default construction declares unique positive pairs')
    return matrix


def valid_triples(value):
    matrix = binary_matrix(value)
    return [(user, int(positive), int(negative))
            for user, row in enumerate(matrix)
            for positive in np.flatnonzero(row)
            for negative in np.flatnonzero(row == 0)]


def occurrence_population(value, positive_occurrences=None, eligible_items=None):
    """Retain record identities and declare the eligible comparison population.

    Repeated (user,item) records are permitted, but occurrence IDs are unique.
    Eligibility applies to both compared items. An unobserved negative must
    remain absent from the user's full binary positive history, even when an
    observed item is currently ineligible. This is an explicit population
    choice; it does not change the user's positive history to create negatives.
    """
    matrix = binary_matrix(value)
    if eligible_items is None:
        eligible = np.ones_like(matrix, dtype=bool)
    else:
        raw_eligible = np.asarray(eligible_items)
        if raw_eligible.shape == (matrix.shape[1],):
            raw_eligible = np.broadcast_to(raw_eligible, matrix.shape)
        if raw_eligible.shape != matrix.shape or not np.isin(raw_eligible, [0, 1]).all():
            raise ValueError('binary item eligibility vector or user-by-item mask required')
        eligible = raw_eligible.astype(bool)
    occurrences = ([{'id': f'positive-{user}-{item}', 'user': user, 'item': int(item)}
                    for user, row in enumerate(matrix) for item in np.flatnonzero(row)]
                   if positive_occurrences is None else list(positive_occurrences))
    seen_ids, triples, records, skipped = set(), [], [], []
    for occurrence in occurrences:
        if not isinstance(occurrence, dict) or set(occurrence) != {'id', 'user', 'item'}:
            raise ValueError('each positive occurrence needs exactly id/user/item')
        identity, user, item = occurrence['id'], occurrence['user'], occurrence['item']
        if not isinstance(identity, str) or not identity or identity in seen_ids:
            raise ValueError('positive occurrence IDs must be nonempty and unique')
        if not isinstance(user, int) or not isinstance(item, int) or not (
                0 <= user < matrix.shape[0] and 0 <= item < matrix.shape[1]) or matrix[user, item] != 1:
            raise ValueError('each occurrence must reference an actual positive pair')
        seen_ids.add(identity)
        if not eligible[user, item]:
            skipped.append({'id': identity, 'reason': 'positive item is outside declared eligibility'})
            continue
        negatives = np.flatnonzero(eligible[user] & (matrix[user] == 0))
        if not negatives.size:
            skipped.append({'id': identity, 'reason': 'no eligible unobserved negative'})
        for negative in negatives:
            triples.append((user, item, int(negative)))
            records.append({'positiveOccurrenceID': identity, 'user': user,
                            'positive': item, 'negative': int(negative)})
    return {'triples': triples, 'records': records, 'positiveOccurrences': occurrences,
            'skippedOccurrences': skipped, 'eligibleItems': eligible,
            'unit': 'positive occurrence times an eligible unobserved item'}


def sampler_distribution(triples, convention='uniform-triple'):
    if not triples:
        return {'available': False, 'reason': 'no user has both a positive and an admissible negative'}
    if convention not in ('uniform-triple', 'uniform-user'):
        raise ValueError('declare uniform-triple or uniform-user population')
    users = sorted({row[0] for row in triples})
    incidence = {user: sum(row[0] == user for row in triples) for user in users}
    probabilities = ([1/len(triples)]*len(triples) if convention == 'uniform-triple'
                     else [1/(len(users)*incidence[row[0]]) for row in triples])
    return {'available': True, 'convention': convention, 'eligibleUsers': users,
            'tripleIncidence': incidence, 'tripleProbabilities': probabilities,
            'userProbabilities': {user: sum(p for row, p in zip(triples, probabilities) if row[0] == user) for user in users}}


def stable_signal(gap):
    if not math.isfinite(gap):
        raise ValueError('finite score gap required')
    if gap >= 0:
        small = math.exp(-gap)
        return small/(1+small)
    return 1/(1+math.exp(gap))


def local_objective(p, positive, negative, penalty):
    p, positive, negative = [np.asarray(vector, dtype=np.float64) for vector in [p, positive, negative]]
    if p.ndim != 1 or p.shape != positive.shape or p.shape != negative.shape or not p.size:
        raise ValueError('three equal positive-width vectors required')
    if not all(np.isfinite(vector).all() for vector in [p, positive, negative]) or penalty < 0 or not math.isfinite(penalty):
        raise ValueError('finite vectors and nonnegative finite penalty required')
    gap = float(p@(positive-negative))
    norm = float(p@p+positive@positive+negative@negative)
    return float(np.logaddexp(0., -gap)+.5*penalty*norm)


def old_buffer_step(p, positive, negative, penalty, rate):
    old = [np.asarray(vector, dtype=np.float64).copy() for vector in [p, positive, negative]]
    before = local_objective(*old, penalty)
    if not math.isfinite(rate) or rate < 0:
        raise ValueError('finite nonnegative rate required')
    p, positive, negative = old
    gap = float(p@(positive-negative))
    signal = stable_signal(gap)
    gradients = [-signal*(positive-negative)+penalty*p,
                 -signal*p+penalty*positive, signal*p+penalty*negative]
    after = [vector-rate*gradient for vector, gradient in zip(old, gradients)]
    if not all(np.isfinite(vector).all() for vector in after):
        raise FloatingPointError('step produced an unavailable nonfinite state')
    return after, {'old': old, 'gap': gap, 'signal': signal, 'gradients': gradients,
                   'beforeLoss': before, 'afterLoss': local_objective(*after, penalty)}


def population_objective(p, q, triples, penalty, probabilities=None):
    if not triples:
        return None
    probabilities = [1/len(triples)]*len(triples) if probabilities is None else list(probabilities)
    if len(probabilities) != len(triples) or any(weight < 0 for weight in probabilities) or abs(sum(probabilities)-1) > 1e-12:
        raise ValueError('one nonnegative probability per triple summing to 1 required')
    return sum(weight*local_objective(p[u], q[i], q[j], penalty)
               for (u, i, j), weight in zip(triples, probabilities))


def train(value, dimensions=2, seed=29, rate=.05, penalty=.01, updates=200,
          convention='uniform-triple', positive_occurrences=None, eligible_items=None):
    matrix = binary_matrix(value)
    population = occurrence_population(matrix, positive_occurrences, eligible_items)
    triples = population['triples']
    distribution = sampler_distribution(triples, convention)
    if not distribution['available']:
        return {**distribution, 'population': population}
    if not isinstance(dimensions, int) or dimensions < 1 or not isinstance(updates, int) or updates < 0:
        raise ValueError('positive factor width/nonnegative integer update count required')
    rng = np.random.default_rng(seed)
    p = rng.normal(0., .1, (matrix.shape[0], dimensions))
    q = rng.normal(0., .1, (matrix.shape[1], dimensions))
    initial_p, initial_q = p.copy(), q.copy()
    weights = distribution['tripleProbabilities']
    objectives = [population_objective(p, q, triples, penalty, weights)]
    sample_indices, sample_counts = [], np.zeros(len(triples), dtype=int)
    for _ in range(updates):
        index = int(rng.choice(len(triples), p=weights))
        user, positive, negative = triples[index]
        after, _ = old_buffer_step(p[user], q[positive], q[negative], penalty, rate)
        p[user], q[positive], q[negative] = after
        sample_indices.append(index)
        sample_counts[index] += 1
        objectives.append(population_objective(p, q, triples, penalty, weights))
    return {'available': True, 'P': p, 'Q': q, 'initialP': initial_p, 'initialQ': initial_q,
            'seed': seed, 'normalSD': .1, 'updates': updates, 'rate': rate, 'penalty': penalty,
            'distribution': distribution, 'triples': triples, 'sampleIndices': sample_indices,
            'sampleCounts': sample_counts, 'populationObjectives': objectives,
            'population': population,
            'allScores': p@q.T,
            'finalGaps': [float(p[u]@(q[i]-q[j])) for u, i, j in triples],
            'objectiveUnit': 'mean of the named local regularized loss over this triple population; not once-entity global regularization'}


def ordinary_comparison(value):
    from implicit.cpu.bpr import BayesianPersonalizedRanking
    if implicit.__version__ != '0.7.3':
        raise RuntimeError('this constructed comparison locks implicit 0.7.3')
    matrix = binary_matrix(value)
    sparse = csr_matrix(matrix.astype(np.float32))
    callbacks = []

    def callback(epoch, elapsed, correct, skipped):
        attempts = sparse.nnz
        accepted = attempts-int(skipped)
        callbacks.append({'epoch': int(epoch), 'elapsedSeconds': float(elapsed),
                          'attempts': attempts, 'accepted': accepted, 'skipped': int(skipped),
                          'correctSampledComparisons': int(correct),
                          'sampledTrainingStatistic': int(correct)/accepted if accepted else None})

    model = BayesianPersonalizedRanking(factors=2, iterations=40, learning_rate=.05,
                                       regularization=.01, dtype=np.float64, num_threads=1,
                                       random_state=29, verify_negative_samples=True)
    model.fit(sparse, show_progress=False, callback=callback)
    frequencies = np.bincount(sparse.indices, minlength=matrix.shape[1])
    if model.user_factors.shape != (matrix.shape[0], 3) or model.item_factors.shape != (matrix.shape[1], 3):
        raise AssertionError('ordinary factor arrays must include the extra bias coordinate')
    if not np.all(model.user_factors[:, -1] == 1.):
        raise AssertionError('ordinary user bias coordinate must remain the fixed 1')
    return {'version': implicit.__version__, 'PIncludingFixed1': model.user_factors,
            'QIncludingItemBias': model.item_factors,
            'allScores': model.user_factors@model.item_factors.T,
            'positiveItemFrequencies': frequencies,
            'negativeItemProbabilities': frequencies/sparse.nnz,
            'callbacks': callbacks, 'totalAttempts': sum(row['attempts'] for row in callbacks),
            'totalAccepted': sum(row['accepted'] for row in callbacks),
            'totalSkipped': sum(row['skipped'] for row in callbacks),
            'limits': 'Global positive-index negative sampler, seen-negative skips, ignored input magnitudes and additional item bias differ from scratch full-support triples; no fitted-score equality is asserted.'}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    matrix = [[1, 0, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]]
    triples = valid_triples(matrix)
    if len(triples) != 11 or len(set(triples)) != 11:
        raise AssertionError('declared unique-pair population must contain 11 triples')
    scratch = train(matrix)
    report = {'binaryPairs': matrix, 'scratchConstructedFits': 1, 'scratch': scratch,
              'uniformUserAlternativePopulation': sampler_distribution(triples, 'uniform-user'),
              'noAdmissibleTriple': sampler_distribution(valid_triples([[1, 1], [0, 0]])),
              'ordinaryConstructedFits': 1, 'ordinary': ordinary_comparison(matrix),
              'stableExtremeLosses': [local_objective([1.], [gap], [0.], 0.) for gap in [-1000., 0., 1000.]],
              'cost': 'small enumerator O(U*I^2); local update O(d); full diagnostic objective O(triples*d)',
              'evaluationLimit': 'These gaps/objectives are training diagnostics; no held-out NDCG or purchase probability is inferred.'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
