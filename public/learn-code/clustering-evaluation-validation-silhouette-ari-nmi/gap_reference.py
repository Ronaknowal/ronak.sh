"""Paper-rule Gap on constructed data: full PC box, positive SSE, next-k rule."""
from math import sqrt
import numpy as np
from sklearn.cluster import KMeans


def reference_box(features, space):
    x = np.asarray(features, dtype=float)
    if x.ndim != 2 or x.shape[1] == 0 or not np.isfinite(x).all() or len(x) < 2:
        raise ValueError("Use at least two finite feature rows.")
    if space == "original":
        mean, axes, coordinates = np.zeros(x.shape[1]), np.eye(x.shape[1]), x
    elif space == "pc":
        mean = x.mean(axis=0)
        # Keep every right axis; tall inputs need no quadratic full left factor.
        _, _, axes = np.linalg.svd(x - mean, full_matrices=len(x) < x.shape[1])
        coordinates = (x - mean) @ axes.T
    else:
        raise ValueError("space must be original or pc.")
    return mean, axes, coordinates.min(axis=0), coordinates.max(axis=0)


def within_sse(features, labels):
    total = 0.0
    for label in np.unique(labels):
        group = features[labels == label]
        total += float(np.sum((group - group.mean(axis=0)) ** 2))
    if not np.isfinite(total) or total <= 0:
        raise ValueError("W is zero/nonfinite: logarithmic Gap is undefined.")
    return total


def fit_labels(features, k):
    return KMeans(n_clusters=k, n_init=20, random_state=17).fit_predict(features)


def choose_next_k(ks, gaps, errors):
    if len(ks) != len(gaps) or len(ks) != len(errors) or len(ks) < 2:
        raise ValueError("Each candidate needs Gap/error and at least one next-k comparison.")
    if any(ks[i + 1] != ks[i] + 1 for i in range(len(ks) - 1)):
        raise ValueError("This rule uses consecutive integer k values.")
    if not np.isfinite(gaps).all() or not np.isfinite(errors).all() or np.any(np.asarray(errors) < 0):
        raise ValueError("Use finite Gap values and nonnegative uncertainty.")
    for i in range(len(ks) - 1):
        if gaps[i] >= gaps[i + 1] - errors[i + 1]:
            return ks[i], "earliest_next_k_pass"
    return None, "unresolved_upper_boundary: supply the next candidate or declare another boundary rule"


def gap_curve(features, ks, replicates=8, seed=23, space="pc", fitter=fit_labels):
    x = np.asarray(features, dtype=float)
    mean, axes, low, high = reference_box(x, space)
    ks = list(ks)
    if not isinstance(replicates, int) or isinstance(replicates, bool) or replicates < 2:
        raise ValueError("Use at least two reference replicates.")
    if not ks or any(not isinstance(k, int) or isinstance(k, bool) or not 1 <= k < len(x) for k in ks):
        raise ValueError("Candidates must be integers from one to n-1.")
    observed_logs = np.array([np.log(within_sse(x, fitter(x, k))) for k in ks])
    rng = np.random.default_rng(seed)
    reference_logs = np.empty((replicates, len(ks)))
    first_reference = None
    for replicate in range(replicates):
        coordinates = rng.uniform(low, high, size=x.shape)
        reference = coordinates @ axes + mean
        if first_reference is None:
            first_reference = reference.copy()
        for column, k in enumerate(ks):
            reference_logs[replicate, column] = np.log(within_sse(reference, fitter(reference, k)))
    gaps = reference_logs.mean(axis=0) - observed_logs
    errors = reference_logs.std(axis=0, ddof=0) * sqrt(1 + 1 / replicates)
    selected, status = choose_next_k(ks, gaps, errors)
    return {"k": ks, "observed_log_W": observed_logs, "reference_log_W": reference_logs,
            "Gap": gaps, "paper_s": errors, "selected": selected, "status": status,
            "box_low": low, "box_high": high, "first_reference": first_reference}


if __name__ == "__main__":
    # Constructed instructional observations; not Iris or a measured benchmark.
    x = np.array([[0, 0], [.2, .1], [-.2, -.1], [.1, -.2],
                  [4, 4], [4.1, 4.2], [3.8, 3.9], [4.2, 3.8],
                  [8, 0], [8.2, .1], [7.8, -.1], [8.1, -.2]])
    result = gap_curve(x, [1, 2, 3, 4])
    print("Constructed fixture: n12/d2; PC box; B8/null seed23; KMeans n_init20/seed17")
    print("Box bounds", result["box_low"].tolist(), result["box_high"].tolist())
    for k, observed, gap, error in zip(result["k"], result["observed_log_W"], result["Gap"], result["paper_s"]):
        print(f"k={k} logW={observed:.9f} Gap={gap:.9f} s={error:.9f}")
    print("Chosen", result["selected"], result["status"])
    print("Illustrative table", choose_next_k([1, 2, 3, 4], [.10, .42, .46, .44], [.03, .08, .06, .07]))
