"""Covariance and one masked attention row; Python 3 standard library.
Keep explicit_einsum_scratch.py beside this file. Inputs are finite,
rectangular, moderate real values; covariance N>=2, nonempty features.
Attention has nonempty same-length comparison vectors and one value per
key; the boolean mask admits at least one key. No learned model is fitted.
Covariance costs O(N D^2), attention O(S(D+F)), excluding stored inputs.
"""
from math import exp, isfinite, sqrt
from explicit_einsum_scratch import einsum, shape


def sample_covariance(rows):
    dimensions = shape(rows)
    if len(dimensions) != 2 or dimensions[0] < 2:
        raise ValueError('supply at least two observation rows')
    n, d = dimensions
    means = [sum(row[j] for row in rows) / n for j in range(d)]
    centered = [[value - means[j] for j, value in enumerate(row)] for row in rows]
    cross_products = einsum('ni,nj->ij', centered, centered)
    return means, centered, [[value / (n - 1) for value in row] for row in cross_products]


def masked_attention(query, keys, values, allowed):
    d = len(query)
    if (d == 0 or not keys or len(values) != len(keys) or len(allowed) != len(keys)
            or any(len(key) != d for key in keys) or not values[0]
            or any(len(value) != len(values[0]) for value in values)
            or any(type(flag) is not bool for flag in allowed) or not any(allowed)):
        raise ValueError('compatible query/key/value shapes and a nonempty boolean mask required')
    scores = [score / sqrt(d) for score in einsum('d,sd->s', query, keys)]
    if any(not isfinite(score) for score in scores):
        raise ValueError('scores must remain finite')
    maximum = max(score for score, flag in zip(scores, allowed) if flag)
    mass = [exp(score - maximum) if flag else 0.0 for score, flag in zip(scores, allowed)]
    total = sum(mass)
    weights = [value / total for value in mass]
    context = einsum('s,sf->f', weights, values)
    return scores, weights, context


if __name__ == '__main__':
    means, centered, covariance = sample_covariance([[1, 2], [3, 0], [5, 4]])
    print('mean', means)
    print('centered', centered)
    print('sample covariance', covariance)
    keys = [[1, 0], [0, 1], [1, 1]]
    values = [[2, 0], [0, 4], [2, 2]]
    scores, weights, context = masked_attention([1, 0], keys, values, [True, False, True])
    print('scaled scores', [round(value, 6) for value in scores])
    print('allowed weights', weights)
    print('retrieved context', context)
    try:
        masked_attention([1, 0], keys, values, [False, False, False])
    except ValueError:
        print('all-blocked accepted', False)
