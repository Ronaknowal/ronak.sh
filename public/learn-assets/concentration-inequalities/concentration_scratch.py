"""Inclusive binomial tails for moderate n; streaming log-space recurrence.

n must be a built-in integer >= 0; the inclusive threshold must be an integer.
p is a probability in [0,1]. Thresholds outside support are valid events.
Run with Python 3.12+. Teaching accuracy is checked for n <= 2000 against
SciPy; a maintained distribution routine is preferable for extreme inputs.
"""
from math import exp, lgamma, log, log1p


def logadd(a, b):
    if a == float('-inf'):
        return b
    if b == float('-inf'):
        return a
    high, low = max(a, b), min(a, b)
    return high + log1p(exp(low - high))


def validate_tail_inputs(n, p, threshold):
    if type(n) is not int or n < 0:
        raise ValueError('n must be a nonnegative integer')
    if type(threshold) is not int:
        raise ValueError('inclusive threshold must be an integer')
    if not 0 <= p <= 1:
        raise ValueError('probability must lie in [0,1]')


def binomial_log_tail(n, p, threshold):
    validate_tail_inputs(n, p, threshold)
    if threshold <= 0:
        return 0.0
    if threshold > n or p == 0:
        return float('-inf')
    if p == 1:
        return 0.0
    k = threshold
    term = (lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1)
            + k * log(p) + (n - k) * log1p(-p))
    total = term
    for j in range(k, n):
        term += log(n - j) - log(j + 1) + log(p) - log1p(-p)
        total = logadd(total, term)
    return min(0.0, total)


def kl_bernoulli(q, p):
    if q == p:
        return 0.0
    if p == 0 or p == 1:
        return float('inf')
    left = q * log(q / p) if q else 0.0
    right = (1 - q) * log((1 - q) / (1 - p)) if q < 1 else 0.0
    return left + right


def upper_bound_logs(n, p, threshold):
    validate_tail_inputs(n, p, threshold)
    if threshold <= 0:
        return dict.fromkeys(['Hoeffding', 'Bernstein', 'Bennett', 'KL'], 0.0)
    if threshold > n or p == 0:
        return dict.fromkeys(['Hoeffding', 'Bernstein', 'Bennett', 'KL'], float('-inf'))
    if threshold <= n * p:
        return dict.fromkeys(['Hoeffding', 'Bernstein', 'Bennett', 'KL'], 0.0)
    t, variance = threshold - n * p, n * p * (1 - p)
    ratio = t / variance
    return {'Hoeffding': -2 * t * t / n,
            'Bernstein': -t * t / (2 * (variance + t / 3)),
            'Bennett': -variance * ((1 + ratio) * log1p(ratio) - ratio),
            'KL': -n * kl_bernoulli(threshold / n, p)}


if __name__ == '__main__':
    n, p, threshold = 1000, .02, 30
    actual = binomial_log_tail(n, p, threshold)
    print('inclusive tail:', f'{exp(actual):.8f}', 'log tail:', f'{actual:.8f}')
    for name, bound in upper_bound_logs(n, p, threshold).items():
        print(name + ':', f'{exp(bound):.8f}')
    for n, p, k in [(4, .5, 3), (4, .5, 5), (4, 0, 1), (4, 1, 4)]:
        print('boundary:', n, p, k, f'{exp(binomial_log_tail(n, p, k)):.8f}')
