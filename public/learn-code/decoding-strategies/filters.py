"""Explicit score filters; every returned row remains in original token-ID order.

python filters.py
Requires NumPy and sibling sampling.py. Constructed examples only.
"""

import json
import numpy as np
from sampling import probabilities, entropy


def mask_scores(scores, keep):
    result = np.asarray(scores, dtype=np.float64).copy()
    result[~np.asarray(keep, dtype=bool)] = -np.inf
    probabilities(result)  # Reject a genuinely empty support.
    return result


def top_k(scores, k, exact=False):
    scores = np.asarray(scores, dtype=np.float64)
    probabilities(scores)
    if not isinstance(k, int) or k < 1:
        raise ValueError("k must be a positive integer")
    order = np.argsort(-scores, kind="stable")
    k = min(k, int(np.isfinite(scores).sum()))
    if exact:
        keep = np.zeros(len(scores), dtype=bool)
        keep[order[:k]] = True
    else:
        keep = scores >= scores[order[k - 1]]
    return mask_scores(scores, keep)


def nucleus(scores, mass):
    p = probabilities(scores)
    if not 0 < mass <= 1:
        raise ValueError("Nucleus mass must lie in (0, 1]")
    if mass == 1:
        return np.asarray(scores, dtype=np.float64).copy()
    order = np.argsort(-p, kind="stable")
    cumulative = np.cumsum(p[order])
    count = min(len(p), int(np.searchsorted(cumulative, mass, side="left")) + 1)
    keep = np.zeros(len(p), dtype=bool)
    keep[order[:count]] = True
    return mask_scores(scores, keep)


def min_p(scores, relative):
    p = probabilities(scores)
    if not 0 <= relative <= 1:
        raise ValueError("Relative threshold must lie in [0, 1]")
    return mask_scores(scores, p >= relative * p.max())


def typical(scores, mass):
    p = probabilities(scores)
    if not 0 < mass <= 1:
        raise ValueError("Typical mass must lie in (0, 1]")
    if mass == 1:
        return np.asarray(scores, dtype=np.float64).copy()
    surprise = np.full(len(p), np.inf)
    surprise[p > 0] = -np.log(p[p > 0])
    distance = np.abs(surprise - entropy(p))
    order = np.argsort(distance, kind="stable")
    last = min(len(p) - 1, int(np.searchsorted(np.cumsum(p[order]), mass)))
    # Native-style distance threshold: equal distances at the boundary survive.
    return mask_scores(scores, distance <= distance[order[last]])


def epsilon(scores, threshold):
    p = probabilities(scores)
    if not 0 <= threshold <= 1:
        raise ValueError("Absolute threshold must lie in [0, 1]")
    keep = p >= threshold
    keep[p == p.max()] = True
    return mask_scores(scores, keep)


def eta(scores, threshold):
    p = probabilities(scores)
    if not 0 <= threshold <= 1:
        raise ValueError("Eta parameter must lie in [0, 1]")
    cutoff = min(threshold, np.sqrt(threshold) * np.exp(-entropy(p)))
    return epsilon(scores, float(cutoff))


def pipeline(scores, temperature=1.0, k=0, mass=1.0, relative=None):
    probabilities(scores, temperature)  # Validate before score division.
    result = np.asarray(scores, dtype=np.float64).copy() / temperature
    if k:
        result = top_k(result, k)
    if mass < 1:
        result = nucleus(result, mass)
    if relative is not None:
        result = min_p(result, relative)
    return result


def main():
    scores = np.log([.5, .25, .125, .0625, .0625])
    rows = {}
    for name, transformed in [
        ("top_k3", top_k(scores, 3)),
        ("top_k4_ties", top_k(scores, 4)),
        ("nucleus_08", nucleus(scores, .8)),
        ("min_p_025", min_p(scores, .25)),
        ("temperature_then_min_p", pipeline(scores, temperature=2, relative=.3)),
        ("min_p_then_temperature", min_p(scores, .3) / 2),
    ]:
        rows[name] = {"keep": np.isfinite(transformed).tolist(),
                      "q": probabilities(transformed).tolist()}
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
