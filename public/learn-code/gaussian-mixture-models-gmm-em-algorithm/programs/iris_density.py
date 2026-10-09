import csv
from pathlib import Path
import numpy as np
from sklearn.metrics import adjusted_rand_score
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler

with Path("iris.csv").open(newline="", encoding="utf-8") as stream:
    rows = list(csv.DictReader(stream))
X = np.array([[float(row["sepal_length_cm"]),
               float(row["sepal_width_cm"])] for row in rows])
species = np.array([row["species"] for row in rows])
order = np.random.default_rng(16).permutation(len(X))
train, validation, test = order[:90], order[90:120], order[120:]
scaler = StandardScaler().fit(X[train])
Z = scaler.transform(X)

fits = []
print("covariance K validation_log_density training_BIC")
for kind in ["full", "tied", "diag", "spherical"]:
    for k in range(1, 5):
        model = GaussianMixture(
            n_components=k, covariance_type=kind,
            n_init=5, random_state=16, reg_covar=1e-4,
            tol=1e-6, max_iter=500,
        ).fit(Z[train])
        if not model.converged_:
            raise RuntimeError(f"Unfinished fit: {kind}, K={k}")
        score = model.score(Z[validation])
        fits.append((score, kind, k, model))
        print(kind, k, f"{score:.6f}", f"{model.bic(Z[train]):.3f}")

_, kind, k, selected = max(fits, key=lambda fit: fit[0])
baseline = fits[0][3]  # full covariance, K=1
print("selected", kind, k)
print("test log-density", f"{selected.score(Z[test]):.6f}")
print("baseline test log-density", f"{baseline.score(Z[test]):.6f}")
print("test ARI", f"{adjusted_rand_score(species[test], selected.predict(Z[test])):.6f}")
first = test[:1]
print("first test ID", int(first[0] + 1))
print("responsibilities", np.round(selected.predict_proba(Z[first])[0], 6))
print("log-density", np.round(selected.score_samples(Z[first])[0], 6))