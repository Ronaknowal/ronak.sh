"""Train-only representation routes and explicit reference interpolation.

Source-only fitting functions: NumPy, sklearn 1.9.1, umap-learn 0.5.12.
The optional openTSNE route needs that additional package; no result claimed.
Run scratch interpolation only: python reference_map_routes.py.
"""
from pathlib import Path
import numpy as np


def reference_interpolation(query, references, coordinates, k=2):
    references, coordinates, query = np.asarray(references, float), np.asarray(coordinates, float), np.asarray(query, float)
    if (references.ndim != 2 or coordinates.ndim != 2 or len(references) != len(coordinates)
            or query.shape != (references.shape[1],) or not 1 <= k <= len(references)
            or not all(np.isfinite(z).all() for z in (references, coordinates, query))):
        raise ValueError("Matched finite references/coordinates, one query and valid k required")
    distances = np.linalg.norm(references - query, axis=1)
    chosen = np.lexsort((np.arange(len(distances)), distances))[:k]
    zeros = distances[chosen] == 0
    if zeros.any():
        weights = zeros.astype(float) / zeros.sum()
    else:
        inverse = 1 / distances[chosen]
        weights = inverse / inverse.sum()
    return weights @ coordinates[chosen], chosen, weights


def data_split(csv_path):
    from sklearn.model_selection import train_test_split
    data = np.loadtxt(Path(csv_path), delimiter=",", skiprows=1)
    ids, labels, x = data[:, 0].astype(int), data[:, 1].astype(int), data[:, 2:] / 16.0
    train, valid = train_test_split(np.arange(len(x)), test_size=0.25,
                                  stratify=labels, random_state=7)
    return ids, labels, x, train, valid


def ordinary_pipeline(csv_path):
    from sklearn.decomposition import PCA
    from sklearn.neighbors import KNeighborsClassifier
    from umap import UMAP
    ids, labels, x, train, valid = data_split(csv_path)
    representations = {"pixels": (x[train], x[valid])}
    reducers = {"PCA-10": PCA(n_components=10, svd_solver="full"),
                "UMAP-10": UMAP(n_components=10, n_neighbors=15, min_dist=0.1,
                                random_state=7, transform_seed=7, n_jobs=1)}
    for name, reducer in reducers.items():
        train_coordinates = reducer.fit_transform(x[train])
        valid_coordinates = reducer.transform(x[valid])
        representations[name] = (train_coordinates, valid_coordinates)
    results = {}
    for name, (training, validation) in representations.items():
        classifier = KNeighborsClassifier(n_neighbors=5).fit(training, labels[train])
        predicted = classifier.predict(validation)
        results[name] = dict(correct=int(np.count_nonzero(predicted == labels[valid])),
                             denominator=len(valid), predictions=predicted)
    return ids[train], ids[valid], reducers, results


def optional_opentsne(csv_path):
    from openTSNE import TSNE
    _, _, x, train, valid = data_split(csv_path)
    reference = TSNE(n_components=2, perplexity=30, initialization="pca",
                     random_state=7, n_jobs=1).fit(x[train])
    placed = reference.transform(x[valid], perplexity=5, initialization="median")
    return reference, placed


def supervised_umap(csv_path):
    from umap import UMAP
    _, labels, x, train, valid = data_split(csv_path)
    reducer = UMAP(n_components=2, n_neighbors=15, target_metric="categorical",
                   target_weight=0.5, random_state=7, transform_seed=7, n_jobs=1)
    training = reducer.fit_transform(x[train], y=labels[train])
    future = reducer.transform(x[valid])
    return reducer, training, future


if __name__ == "__main__":
    mapped, selected, weights = reference_interpolation([1.], [[0.], [3.]], [[0.], [6.]])
    print("neighbors,weights,placed", selected.tolist(), weights.tolist(), mapped.tolist())
