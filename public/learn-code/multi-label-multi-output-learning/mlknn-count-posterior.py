"""ML-kNN: learn class-conditional neighbour-count histograms, then use Bayes.

Scratch Euclidean retrieval and ordinary NearestNeighbors retrieve the same
row objects. Training excludes self by ID, not by zero distance. This complete
known-label fixture requires both classes per label; unknown labels are not
filled with zeros. No licence-restricted original package is imported.
"""

import numpy as np
from sklearn.neighbors import NearestNeighbors


def checked_training(x, y, row_ids, k, smoothing):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    row_ids = tuple(row_ids)
    if (
        x.ndim != 2
        or not x.size
        or len(x) < 2
        or not np.isfinite(x).all()
        or y.ndim != 2
        or y.shape[0] != len(x)
        or not y.shape[1]
        or not np.isin(y, (0, 1)).all()
    ):
        raise ValueError("Use finite input rows and complete known binary outputs")
    if (
        len(row_ids) != len(x)
        or any(not isinstance(value, str) or not value for value in row_ids)
        or len(set(row_ids)) != len(row_ids)
    ):
        raise ValueError(
            "Use distinct nonempty string row IDs, even for duplicate coordinates"
        )
    if isinstance(k, bool) or not isinstance(k, int) or not 1 <= k <= len(x) - 1:
        raise ValueError("Training counts need integer 1 <= k <= n-1")
    if not np.isfinite(smoothing) or smoothing <= 0:
        raise ValueError("Use positive finite Laplace smoothing")
    support = y.sum(axis=0)
    if np.any(support == 0) or np.any(support == len(x)):
        raise ValueError("This fit policy requires both observed classes per label")
    return x, y.astype(int), row_ids


def nearest_rows(model, query, exclude_id=None, route="scratch"):
    query = np.asarray(query, dtype=float)
    if query.shape != (model["x"].shape[1],) or not np.isfinite(query).all():
        raise ValueError("Use one finite query with the fitted feature width")
    if exclude_id is not None and exclude_id not in model["row_ids"]:
        raise ValueError("A self-exclusion ID must name exactly one training row")
    transformed = (query - model["mean"]) / model["scale"]
    distances = np.linalg.norm(model["scaled_x"] - transformed, axis=1)
    if not np.isfinite(distances).all():
        raise ValueError("Distance calculation exceeds finite arithmetic")
    if route == "scratch":
        candidates = np.arange(len(distances))
    elif route == "library":
        # Ask for every candidate before stable tie reconciliation. Asking for
        # only k neighbours can discard the canonical member of a boundary tie.
        ordinary_distances, indices = model["retriever"].kneighbors(
            transformed[None, :], n_neighbors=len(distances)
        )
        candidates = indices[0]
        np.testing.assert_allclose(
            ordinary_distances[0], distances[candidates], rtol=1e-8, atol=1e-8
        )
    else:
        raise ValueError("Choose scratch or library neighbour retrieval")
    eligible = [int(i) for i in candidates if model["row_ids"][int(i)] != exclude_id]
    ordered = sorted(eligible, key=lambda i: (float(distances[i]), model["row_ids"][i]))
    selected = ordered[: model["k"]]
    if len(selected) != model["k"]:
        raise ValueError("Too few eligible neighbours under the fitted k")
    return dict(
        indices=np.array(selected, dtype=int),
        row_ids=[model["row_ids"][i] for i in selected],
        distances=distances[selected],
        excluded_id=exclude_id,
    )


def fit_mlknn(x, y, row_ids, k=2, smoothing=1.0, scale_inputs=False, route="scratch"):
    x, y, row_ids = checked_training(x, y, row_ids, k, smoothing)
    if not isinstance(scale_inputs, bool):
        raise ValueError("Declare whether input scaling is used")
    mean = x.mean(axis=0) if scale_inputs else np.zeros(x.shape[1])
    scale = x.std(axis=0) if scale_inputs else np.ones(x.shape[1])
    if not np.isfinite(mean).all() or not np.isfinite(scale).all():
        raise ValueError("Training scale calculation exceeds finite arithmetic")
    scale = np.where(scale == 0, 1.0, scale)
    scaled = (x - mean) / scale
    if not np.isfinite(scaled).all():
        raise ValueError("Scaled inputs exceed finite arithmetic")
    retriever = NearestNeighbors(metric="euclidean", algorithm="brute", n_jobs=1).fit(
        scaled
    )
    model = dict(
        x=x.copy(),
        y=y.copy(),
        row_ids=row_ids,
        k=k,
        smoothing=smoothing,
        mean=mean,
        scale=scale,
        scaled_x=scaled,
        retriever=retriever,
    )
    histograms = np.zeros((y.shape[1], 2, k + 1), dtype=int)
    training_counts = np.zeros_like(y, dtype=int)
    neighbourhoods = []
    for row in range(len(x)):
        neighbours = nearest_rows(model, x[row], exclude_id=row_ids[row], route=route)
        counts = y[neighbours["indices"]].sum(axis=0)
        training_counts[row] = counts
        for label in range(y.shape[1]):
            histograms[label, y[row, label], counts[label]] += 1
        neighbourhoods.append(
            dict(
                row_id=row_ids[row],
                neighbours=neighbours["row_ids"],
                distances=neighbours["distances"].tolist(),
                counts=counts.tolist(),
            )
        )
    positives = y.sum(axis=0)
    support = np.column_stack((len(y) - positives, positives))
    np.testing.assert_array_equal(histograms.sum(axis=2), support)
    prior = (support + smoothing) / (len(y) + 2 * smoothing)
    likelihood = (histograms + smoothing) / (support[:, :, None] + (k + 1) * smoothing)
    np.testing.assert_allclose(prior.sum(axis=1), 1.0)
    np.testing.assert_allclose(likelihood.sum(axis=2), 1.0)
    model.update(
        histograms=histograms,
        support=support,
        prior=prior,
        likelihood=likelihood,
        training_counts=training_counts,
        neighbourhoods=neighbourhoods,
        training_retrieval=route,
    )
    return model


def posterior_for_counts(model, counts):
    counts = np.asarray(counts)
    labels = model["y"].shape[1]
    if (
        counts.shape != (labels,)
        or not np.issubdtype(counts.dtype, np.integer)
        or np.any(counts < 0)
        or np.any(counts > model["k"])
    ):
        raise ValueError("Use one supported integer neighbour count per output")
    likelihood = model["likelihood"][np.arange(labels), :, counts]
    numerators = model["prior"] * likelihood
    denominator = numerators.sum(axis=1)
    if not np.isfinite(denominator).all() or np.any(denominator <= 0):
        raise ValueError("Both Bayes branches must have a positive finite normalizer")
    posterior = numerators[:, 1] / denominator
    return dict(
        counts=counts.copy(),
        likelihood=likelihood,
        prior=model["prior"].copy(),
        numerators=numerators,
        denominator=denominator,
        posterior=posterior,
        prediction=(posterior >= 0.5).astype(int),
    )


def predict_mlknn(model, query, route="scratch"):
    neighbours = nearest_rows(model, query, route=route)
    counts = model["y"][neighbours["indices"]].sum(axis=0)
    result = posterior_for_counts(model, counts)
    result["neighbours"] = neighbours
    return result


def main():
    np.set_printoptions(precision=6, suppress=True)
    x = np.array([0, 1, 2, 5, 6, 7], dtype=float)[:, None]
    y = np.column_stack(([1, 1, 1, 0, 0, 0], [0, 1, 0, 1, 0, 1]))
    row_ids = tuple(f"row-{i}" for i in range(6))
    model = fit_mlknn(x, y, row_ids)
    ordinary = fit_mlknn(x, y, row_ids, route="library")
    np.testing.assert_array_equal(model["histograms"], ordinary["histograms"])
    np.testing.assert_array_equal(model["histograms"][0], [[3, 0, 0], [0, 0, 3]])
    np.testing.assert_array_equal(model["histograms"][1], [[0, 2, 1], [1, 2, 0]])
    print(
        "Six known training points / output bits / IDs:",
        x.ravel().tolist(),
        y.tolist(),
        list(row_ids),
    )
    print("Every leave-self-out neighbourhood / count:", model["neighbourhoods"])
    print(
        "Each output negative/positive count histogram:", model["histograms"].tolist()
    )
    print(
        "Class supports / smoothed priors / count likelihoods:",
        model["support"].tolist(),
        model["prior"].tolist(),
        model["likelihood"].tolist(),
    )
    result = predict_mlknn(model, [1.2])
    other = predict_mlknn(ordinary, [1.2], route="library")
    np.testing.assert_allclose(result["posterior"], other["posterior"])
    np.testing.assert_allclose(result["posterior"], [0.8, 0.5])
    print(
        "Query 1.2 selected IDs / distances / counts:",
        result["neighbours"]["row_ids"],
        result["neighbours"]["distances"].tolist(),
        result["counts"].tolist(),
    )
    print(
        "Both Bayes likelihood/numerator branches / denominator / posterior / >= decision:",
        result["likelihood"].tolist(),
        result["numerators"].tolist(),
        result["denominator"].tolist(),
        result["posterior"].tolist(),
        result["prediction"].tolist(),
    )
    for count in range(3):
        print(
            "Changed selected neighbour counts:",
            count,
            posterior_for_counts(model, np.array([count, count]))["posterior"].tolist(),
        )
    for k, smoothing, query in [(1, 1.0, [1.2]), (3, 0.2, [4.0]), (5, 5.0, [-1.0])]:
        changed = fit_mlknn(x, y, row_ids, k=k, smoothing=smoothing)
        prediction = predict_mlknn(changed, query)
        print(
            "Changed k / smoothing / query / neighbours / posterior:",
            k,
            smoothing,
            query,
            prediction["neighbours"]["row_ids"],
            prediction["posterior"].tolist(),
        )
    duplicate_x = np.array([[0.0], [0.0], [1.0], [2.0]])
    duplicate_y = np.array([[0, 1], [1, 0], [1, 1], [0, 0]])
    duplicate_ids = ("a", "b", "c", "d")
    duplicates = fit_mlknn(duplicate_x, duplicate_y, duplicate_ids, k=1)
    self_query = nearest_rows(duplicates, [0.0], exclude_id="a")
    new_query = nearest_rows(duplicates, [0.0])
    assert self_query["row_ids"] == ["b"] and new_query["row_ids"] == ["a"]
    print("Self a removed, distinct duplicate b retained:", self_query["row_ids"])
    print(
        "A NEW equal-coordinate query excludes no training row:", new_query["row_ids"]
    )


if __name__ == "__main__":
    main()
