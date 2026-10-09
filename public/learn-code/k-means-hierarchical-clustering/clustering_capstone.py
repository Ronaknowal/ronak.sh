import itertools
import numpy as np
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import silhouette_score, adjusted_rand_score


def fit_model(training, k, seed):
    return make_pipeline(
        StandardScaler(), KMeans(n_clusters=k, n_init=10, random_state=seed)
    ).fit(training)


def report(data_seed=17, split_seed=23):
    latent, _ = make_blobs(
        n_samples=360,
        centers=[[-3, 1], [0, -3], [4, 2]],
        cluster_std=[1.0, 1.5, 0.8],
        random_state=data_seed,
    )
    # Constructed devices, not measurements from an actual installation.
    points = latent * [3.0, 0.5] + [40.0, 5.0]
    order = np.random.default_rng(split_seed).permutation(len(points))
    training, validation, test = (
        points[order[:240]],
        points[order[240:300]],
        points[order[300:]],
    )
    # Declared rule: eligible if each training cluster has >=20 rows and the
    # median bootstrap ARI on the SAME validation rows is >=0.8. Among eligible
    # k in {2,3,4}, choose largest validation silhouette; smaller k breaks a tie.
    bootstrap_rows = [
        np.random.default_rng(seed).integers(len(training), size=len(training))
        for seed in range(30, 38)
    ]
    candidates = []
    for k in [2, 3, 4]:
        fitted = fit_model(training, k, 7)
        validation_labels = fitted.predict(validation)
        transformed_validation = fitted[0].transform(validation)
        count = len(np.unique(validation_labels))
        silhouette = (
            silhouette_score(transformed_validation, validation_labels)
            if 1 < count < len(validation)
            else -1
        )
        stability = [
            adjusted_rand_score(
                validation_labels, fit_model(training[rows], k, 7).predict(validation)
            )
            for rows in bootstrap_rows
        ]
        minimum_size = int(np.bincount(fitted[1].labels_, minlength=k).min())
        median_stability = float(np.median(stability))
        validation_error = float(np.mean(fitted.transform(validation).min(axis=1) ** 2))
        eligible = minimum_size >= 20 and median_stability >= 0.8 and count > 1
        print(
            "candidate k / validation silhouette / mean squared distance / median ARI / min train size / eligible:",
            k,
            round(silhouette, 6),
            round(validation_error, 6),
            round(median_stability, 6),
            minimum_size,
            eligible,
        )
        if eligible:
            candidates.append((silhouette, -k, fitted, k))
    if not candidates:
        raise RuntimeError(
            "No candidate meets the predeclared requirements; revise the plan without using test results."
        )
    _, _, fitted, k = max(candidates, key=lambda row: row[:2])
    # Test data first enter here. No refit or changed k after reading this report.
    labels = fitted.predict(test)
    baseline = fit_model(training, 1, 7)
    error = float(np.mean(fitted.transform(test).min(axis=1) ** 2))
    baseline_error = float(np.mean(baseline.transform(test).min(axis=1) ** 2))
    centers = fitted[0].inverse_transform(fitted[1].cluster_centers_)
    print("selected k:", k)
    print(
        "test / training-centroid baseline mean squared standardized distance:",
        round(error, 6),
        round(baseline_error, 6),
    )
    print(
        "profiles ordered by fitted center temperature: count / mean temperature / mean vibration"
    )
    for cluster in np.argsort(centers[:, 0]):
        members = test[labels == cluster]
        if len(members):
            print(len(members), *np.round(members.mean(axis=0), 6).tolist())
        else:
            print(0, "no held-out members")
    # A transparent resource calculation, not a measured runtime prediction.
    future_n = 100000
    condensed_gib = (future_n * (future_n - 1) // 2) * 8 / 2**30
    print(
        "100000 rows: float64 condensed distance buffer alone (GiB):",
        round(condensed_gib, 3),
    )
    print(
        "A 16 GiB machine cannot hold that dense hierarchy plan; the reasoning belongs before fitting."
    )
    return {
        "selected_k": k,
        "fitted": fitted,
        "training": training,
        "validation": validation,
        "test": test,
        "labels": labels,
        "error": error,
        "baseline_error": baseline_error,
    }


result = report()