import numpy as np
from scipy.optimize import minimize_scalar

# Bounds (L,R] for failures; R=infinity for right censoring.
bounds = [(0.0, 2.0), (2.0, 5.0), (3.0, 7.0), (4.0, np.inf), (6.0, np.inf)]


def negative_log_likelihood(log_rate):
    rate = np.exp(log_rate)
    total = 0.0
    for left, right in bounds:
        if np.isinf(right):
            total -= rate * left
        else:
            total += -rate * left + np.log(-np.expm1(-rate * (right - left)))
    return -total


fit = minimize_scalar(negative_log_likelihood, bracket=(-4, -1))
rate = np.exp(fit.x)
print("fitted constant rate:", round(rate, 8))
print("P(2<T<=5):", round(np.exp(-2 * rate) - np.exp(-5 * rate), 6))
print("right-censored contribution at6:", round(np.exp(-6 * rate), 6))
print("Interval inspection is not an exact failure timestamp or delayed study entry.")