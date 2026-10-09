"""Two different score populations: sampled focal IDs versus a new subset."""
from math import sqrt
import numpy as np
from sklearn.metrics import silhouette_score, silhouette_samples
from silhouette_chunked import focal_silhouettes, validate_partition


def sample_focal_mean(features, labels, sample_size, seed=23):
    x, _, _ = validate_partition(features, labels)
    n = len(x)
    if not isinstance(sample_size, int) or isinstance(sample_size, bool) or not 1 <= sample_size <= n:
        raise ValueError("Sample between one and n focal rows without replacement.")
    indices = np.random.default_rng(seed).choice(n, size=sample_size, replace=False)
    scores = focal_silhouettes(x, labels, indices)
    # SRS variance estimate: (1-m/n)*s^2/m, with finite-population s^2 denominator m-1.
    se = 0.0 if sample_size == n else (sqrt((1 - sample_size / n) * float(scores.var(ddof=1)) / sample_size)
                                     if sample_size > 1 else None)
    return indices, scores, float(scores.mean()), se


def stratified_focal_mean(features, labels, per_group, seed=23):
    x, encoded, members = validate_partition(features, labels)
    if not isinstance(per_group, int) or isinstance(per_group, bool) or per_group < 1:
        raise ValueError("per_group must be a positive integer.")
    rng = np.random.default_rng(seed)
    estimates = []
    for group in members:
        indices = rng.choice(group, size=min(per_group, len(group)), replace=False)
        scores = focal_silhouettes(x, labels, indices)
        estimates.append((len(group) / len(x), float(scores.mean()), indices.tolist()))
    estimate = sum(weight * mean for weight, mean, _ in estimates)
    return estimate, estimates


if __name__ == "__main__":
    x = np.array([0, 1, 2, 7, 8, 9.0])[:, None]
    labels = np.array([0, 0, 0, 1, 1, 1])
    print("Full-comparator C", float(focal_silhouettes(x, labels, [2])[0]))
    subset = np.array([1, 2, 3, 4])
    subset_scores = silhouette_samples(x[subset], labels[subset])
    print("Subset-comparator C", float(subset_scores[1]))
    indices, scores, estimate, se = sample_focal_mean(x, labels, 3)
    print("Sampled focal IDs", indices.tolist(), "scores", scores.tolist())
    print("Fixed-full-mean estimate", estimate, "estimated SRS standard error", se)
    estimate, groups = stratified_focal_mean(x, labels, per_group=1)
    print("Stratified estimate", estimate, "original weight/group mean/IDs", groups)
    # This API samples BOTH focal and comparison rows: explicitly a subset score.
    rng_subset = np.random.RandomState(23).permutation(len(x))[:4]
    occupied = len(np.unique(labels[rng_subset]))
    if 2 <= occupied < len(rng_subset):
        print("Ordinary random subset IDs", rng_subset.tolist())
        print("Ordinary SUBSET mean", silhouette_score(x, labels, sample_size=4, random_state=23))
    else:
        print("Ordinary random subset has invalid occupied-group count.")
