"""Chunked point silhouettes, gap references and shared-probe stability."""
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_samples, adjusted_rand_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from clustering_core import points_array, squared_to_center
from clustering_chunked_lloyd import lloyd


def point_silhouettes(points, labels, block_size=64):
    points = points_array(points)
    labels = np.asarray(labels)
    if labels.shape != (len(points),):
        raise ValueError("Supply one label for every observation in row order.")
    names, group = np.unique(labels, return_inverse=True)
    if not 2 <= len(names) < len(points):
        raise ValueError("Silhouette requires at least two and fewer than n groups.")
    if not isinstance(block_size, (int, np.integer)) or block_size <= 0:
        raise ValueError("block_size must be positive.")
    counts = np.bincount(group)
    result = np.zeros(len(points))
    for start in range(0, len(points), block_size):
        stop = min(start + block_size, len(points))
        sums = np.zeros((stop - start, len(names)))
        for j, other in enumerate(points):
            sums[:, group[j]] += np.sqrt(squared_to_center(points[start:stop], other))
        own = group[start:stop]
        own_count = counts[own]
        a = np.divide(sums[np.arange(stop - start), own], own_count - 1,
                      out=np.zeros(stop - start), where=own_count > 1)
        means = sums / counts
        means[np.arange(stop - start), own] = np.inf
        b = means.min(axis=1)
        denominator = np.maximum(a, b)
        score = np.divide(b - a, denominator, out=np.zeros(stop - start), where=denominator > 0)
        score[own_count == 1] = 0
        result[start:stop] = score
    return result


def ordinary_fit(points, k, seed):
    model = KMeans(n_clusters=k, n_init=5, random_state=seed, algorithm="lloyd").fit(points)
    return float(model.inertia_)


def scratch_fit(points, k, seed):
    # The fitter contract returns ordinary within-group squared error.
    return lloyd(points, k=k, seed=seed)["inertia"]


def gap_reference(points, ks, reference_count=4, seed=7, rotated=False, fitter=scratch_fit):
    points = points_array(points)
    ks = list(ks)
    if (not isinstance(reference_count, (int, np.integer)) or reference_count < 2
            or any(not isinstance(k, (int, np.integer)) or not 1 <= k <= len(points) for k in ks)):
        raise ValueError("Use B>=2 and integer k values in the supported range.")
    if len(ks) < 2 or ks != list(range(ks[0], ks[-1] + 1)):
        raise ValueError("Supply consecutive k values, including the next k for selection.")
    mean = points.mean(axis=0)
    centered = points - mean
    if rotated:
        # Keep every right-basis axis; avoid an n-by-n left factor when n>=d.
        _, _, right = np.linalg.svd(centered, full_matrices=len(points) < points.shape[1])
        rotation = right.T
    else:
        rotation = np.eye(points.shape[1])
    box_points = centered @ rotation
    low, high = box_points.min(axis=0), box_points.max(axis=0)
    rng = np.random.default_rng(seed)
    # Shared generated reference arrays make different k see the same reference
    # populations; a fitted result still has its own declared seed.
    references = [rng.uniform(low, high, size=points.shape) @ rotation.T + mean
                  for _ in range(reference_count)]
    rows = []
    for k in ks:
        observed = fitter(points, k, seed + k)
        reference_costs = np.array([fitter(r, k, seed + 100 + b) for b, r in enumerate(references)])
        if not np.isfinite(observed) or not np.isfinite(reference_costs).all():
            raise ValueError("The fitter must return finite dispersion values.")
        if observed <= 0 or (reference_costs <= 0).any():
            raise ValueError("Log dispersion is undefined at zero; choose another supported range.")
        logs = np.log(reference_costs)
        rows.append({"k": k, "dispersion": observed,
                     "gap": float(logs.mean() - np.log(observed)),
                     "spread": float(np.sqrt(1 + 1 / reference_count) * logs.std(ddof=0)),
                     "reference_costs": reference_costs.tolist()})
    selected = None
    for here, following in zip(rows, rows[1:]):
        if here["gap"] >= following["gap"] - following["spread"]:
            selected = here["k"]
            break
    return {"rows": rows, "selected": selected, "rotated": rotated,
            "reference_count": reference_count, "seed": seed}


def probe_stability():
    training = np.array([[0.0], [1.0], [2.0], [8.0], [9.0], [10.0]])
    resamples = [[0, 0, 2, 3, 4, 5], [0, 1, 2, 3, 5, 5]]
    probes = np.array([[-0.5], [1.5], [8.5], [10.5]])
    predictions, states = [], []
    for indices in resamples:
        rows = training[indices]
        scaler = StandardScaler().fit(rows)
        initial = scaler.transform([[0.0], [10.0]])
        model = KMeans(n_clusters=2, init=initial, n_init=1, tol=0,
                       algorithm="lloyd", random_state=7)
        pipeline = make_pipeline(scaler, model)
        # Pipeline.fit would refit the scaler to the same rows. Fit the second
        # stage directly to make transform ownership and initial units explicit.
        model.fit(scaler.transform(rows))
        predictions.append(pipeline.predict(probes))
        states.append({"resample_rows": indices, "mean": scaler.mean_.tolist(),
                       "scale": scaler.scale_.tolist(), "centers": model.cluster_centers_.tolist()})
    return {"probe_ids": ["Q0", "Q1", "Q2", "Q3"], "states": states,
            "labels": [p.tolist() for p in predictions],
            "ARI": float(adjusted_rand_score(*predictions))}


def main():
    points = np.array([[0.0], [1.0], [2.0], [8.0], [9.0], [10.0]])
    labels = np.array([0, 0, 0, 1, 1, 1])
    print("scratch silhouettes:", point_silhouettes(points, labels, block_size=2).tolist())
    print("ordinary silhouettes:", silhouette_samples(points, labels).tolist())
    print("renamed partition ARI:", adjusted_rand_score(labels, np.where(labels == 0, 7, 3)))
    for rotated in [False, True]:
        print("scratch gap:", gap_reference(points, [1, 2, 3], rotated=rotated))
    print("ordinary-tool gap:", gap_reference(points, [1, 2, 3], fitter=ordinary_fit))
    print("shared-probe stability:", probe_stability())


if __name__ == "__main__":
    main()
