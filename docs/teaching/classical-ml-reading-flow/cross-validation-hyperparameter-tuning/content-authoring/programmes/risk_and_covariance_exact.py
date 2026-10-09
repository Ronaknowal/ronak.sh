"""Exact risk formulas and finite shared-shock/LOO distributions."""
from fractions import Fraction
from itertools import product
import numpy as np


def mean_predictor_risk(variance, size):
    if variance < 0 or type(size) is not int or size < 1:
        raise ValueError("Need nonnegative variance and positive integer training size.")
    return variance * (1 - Fraction(1, size)), variance * (1 + Fraction(1, size))


def sign_covariance(folds):
    if type(folds) is not int or not 1 <= folds <= 10:
        raise ValueError("This exhaustive demonstration supports 1 through 10 folds.")
    signs = list(product([-1, 1], repeat=folds + 1))
    # Z=(S+E)/sqrt(2). Store numerator to retain exact rational products.
    numerator = [[row[0] + row[j + 1] for j in range(folds)] for row in signs]
    covariance = [[sum(Fraction(row[j] * row[k], 2) for row in numerator) / len(signs)
                   for k in range(folds)] for j in range(folds)]
    average_variance = sum(sum(row) for row in covariance) / folds**2
    ordinary = np.cov(np.asarray(numerator).T / np.sqrt(2), bias=True)
    return covariance, average_variance, ordinary


def fixed_zero_loo(n):
    if type(n) is not int or not 1 <= n <= 12:
        raise ValueError("This exact fair-label enumeration supports 1 through 12 rows.")
    accuracies = [Fraction(sum(value == 0 for value in labels), n) for labels in product([0, 1], repeat=n)]
    mean = sum(accuracies) / len(accuracies)
    variance = sum((value - mean)**2 for value in accuracies) / len(accuracies)
    return mean, variance


def main():
    for size in [8, 12]:
        train, fresh = mean_predictor_risk(Fraction(4), size)
        print("mean predictor", size, "training", str(train), "new", str(fresh), "optimism", str(fresh - train))
    covariance, variance, ordinary = sign_covariance(4)
    print("covariance", [[str(value) for value in row] for row in covariance])
    print("mean variance", str(variance), "independent comparator", str(Fraction(1, 4)))
    print("ordinary population covariance", ordinary.round(10).tolist())
    print("changed common/individual", str(Fraction(1, 5) + Fraction(4, 5) / 5))
    for size in [2, 4, 8]:
        mean, variance = fixed_zero_loo(size)
        print("fixed zero LOO", size, "mean", str(mean), "variance", str(variance))


if __name__ == "__main__":
    main()
