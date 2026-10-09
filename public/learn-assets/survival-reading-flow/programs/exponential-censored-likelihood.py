import numpy as np

times = np.array([2, 3, 4, 4, 6, 7, 8, 9], dtype=float)
events = np.array([1, 0, 1, 0, 1, 0, 1, 0], dtype=bool)

from scipy.optimize import minimize_scalar

failures = int(events.sum())
exposure = float(times.sum())
rate = failures / exposure


def negative_log_likelihood(log_rate):
    return np.exp(log_rate) * exposure - failures * log_rate


fit = minimize_scalar(negative_log_likelihood, bracket=(-4, -1))
print("events / exposure:", failures, exposure)
print("rate per day:", round(rate, 8))
print("numerical likelihood fit:", round(np.exp(fit.x), 8))
print(
    "rate with four extra censored running days:", round(failures / (exposure + 4), 8)
)
print("S(10):", round(np.exp(-rate * 10), 6))
print("rate per hour:", round(rate / 24, 8))
print("No events: likelihood increases as the positive rate tends to zero.")