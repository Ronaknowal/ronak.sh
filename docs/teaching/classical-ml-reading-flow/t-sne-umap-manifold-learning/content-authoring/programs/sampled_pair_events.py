"""Finite event enumeration; not a stochastic UMAP fit or complete scheduler.

Run: python sampled_pair_events.py (NumPy). Supplied noise is explicit.
"""
import numpy as np


def positive_event(y, head, tail, rate):
    result = np.asarray(y, float).copy()
    delta = result[head] - result[tail]
    attraction = np.clip(-2 * delta / (1 + delta @ delta), -4, 4)
    result[head] += rate * attraction
    result[tail] -= rate * attraction
    return result


def negative_event(y, head, other, rate):
    result = np.asarray(y, float).copy()
    if head == other:
        return result
    delta = result[head] - result[other]
    squared = delta @ delta
    if squared > 0:
        result[head] += rate * np.clip(2 * delta / ((0.001 + squared) * (1 + squared)), -4, 4)
    return result


def expected_vector(y, head, tail, edge_frequency, noise_probability, rate):
    y, noise_probability = np.asarray(y, float), np.asarray(noise_probability, float)
    if (y.ndim != 2 or not np.isfinite(y).all() or noise_probability.shape != (len(y),)
            or np.any(noise_probability < 0) or not np.isclose(noise_probability.sum(), 1)
            or not 0 <= edge_frequency <= 1 or not np.isfinite(rate) or rate < 0):
        raise ValueError("Finite coordinates, valid event frequency/noise distribution/rate required")
    if not 0 <= head < len(y) or not 0 <= tail < len(y) or head == tail:
        raise ValueError("Choose distinct valid positive endpoints")
    positive = positive_event(y, head, tail, rate) - y
    negative = sum(probability * (negative_event(y, head, other, rate) - y)
                   for other, probability in enumerate(noise_probability))
    # One independent noise event per elementary slot in this experiment.
    # UMAP's actual negative schedule is conditional on positive events instead.
    return edge_frequency * positive + negative, positive, negative


def pair_score(y, first, second):
    delta = y[first] - y[second]
    return 1 / (1 + delta @ delta)


if __name__ == "__main__":
    y = np.array([[0.], [1.], [3.]])
    noise = np.array([0.25, 0.25, 0.5])
    expected, positive, negative = expected_vector(y, 0, 1, 0.25, noise, 0.1)
    print("positive", positive.tolist())
    print("expected negative", negative.tolist())
    print("expected vector", expected.tolist())
    print("positive frequency once versus twice", (0.25 * positive).tolist(), (0.25 ** 2 * positive).tolist())
    print("pair score", pair_score(y, 0, 1))
