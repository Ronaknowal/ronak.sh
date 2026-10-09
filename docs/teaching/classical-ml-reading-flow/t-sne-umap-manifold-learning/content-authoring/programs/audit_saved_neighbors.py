"""Audit immutable saved maps; never fit an embedding.

Run with --assets pointing to the supplied manifold-learning data directory.
NumPy/SciPy; optional ordinary comparison uses scikit-learn.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.spatial.distance import cdist


def load_saved(directory):
    directory = Path(directory)
    raw = (directory / "digits-300.csv").read_bytes()
    saved = json.loads((directory / "calculated-inputs.json").read_text())
    if hashlib.sha256(raw).hexdigest() != saved["datasetSha256"]:
        raise ValueError("CSV does not match the saved-map dataset")
    data = np.loadtxt(directory / "digits-300.csv", delimiter=",", skiprows=1)
    ids = data[:, 0].astype(int)
    if not np.array_equal(ids, data[:, 0]) or len(set(ids)) != len(ids):
        raise ValueError("Source IDs must be unique integers")
    saved_ids = np.asarray(saved["rows"], dtype=int)
    if set(ids) != set(saved_ids):
        raise ValueError("Saved maps and CSV need the same source IDs")
    position = {int(identity): i for i, identity in enumerate(saved_ids)}
    join = [position[int(identity)] for identity in ids]
    maps = {name: np.asarray(record["coordinates"], float)[join]
            for name, record in saved["layouts"].items()}
    if any(y.shape != (len(ids), 2) or not np.isfinite(y).all() for y in maps.values()):
        raise ValueError("Each saved map needs two finite coordinates per source ID")
    return ids, data[:, 1].astype(int), data[:, 2:] / 16.0, maps


def ordered_neighbors(points, ids, row):
    distances = cdist(points[row:row + 1], points, metric="sqeuclidean")[0]
    if not np.isfinite(distances).all():
        raise ValueError("Rescale coordinates before squared-distance overflow")
    order = np.lexsort((ids, distances))
    return order[order != row]


def audit(x, y, ids, k):
    x, y, ids = np.asarray(x, float), np.asarray(y, float), np.asarray(ids)
    n = len(ids)
    if (x.ndim != 2 or y.ndim != 2 or len(x) != n or len(y) != n
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or len(set(ids.tolist())) != n or not 1 <= k < n / 2):
        raise ValueError("Use matched finite rows, unique IDs and 1 <= k < n/2")
    retained, intrusion, omission = [], 0, 0
    for i in range(n):
        input_order = ordered_neighbors(x, ids, i)
        map_order = ordered_neighbors(y, ids, i)
        input_rank, map_rank = np.empty(n, int), np.empty(n, int)
        input_rank[input_order] = np.arange(1, n)
        map_rank[map_order] = np.arange(1, n)
        original, mapped = set(input_order[:k]), set(map_order[:k])
        retained.append(len(original & mapped) / k)
        intrusion += sum(input_rank[j] - k for j in mapped - original)
        omission += sum(map_rank[j] - k for j in original - mapped)
    normalizer = 2 / (n * k * (2 * n - 3 * k - 1))
    return dict(retention=float(np.mean(retained)),
                trustworthiness=float(1 - normalizer * intrusion),
                continuity=float(1 - normalizer * omission), rows=retained)


def query_lists(x, y, ids, source_id, k):
    row = np.flatnonzero(ids == source_id)
    if len(row) != 1:
        raise ValueError("Choose an existing source ID")
    i = int(row[0])
    first = ids[ordered_neighbors(x, ids, i)[:k]].tolist()
    second = ids[ordered_neighbors(y, ids, i)[:k]].tolist()
    return dict(input=first, mapped=second, common=sorted(set(first) & set(second)),
                missing=sorted(set(first) - set(second)), new=sorted(set(second) - set(first)))


def ordinary_audit(x, y, k):
    from sklearn.manifold import trustworthiness
    from sklearn.neighbors import NearestNeighbors
    model = NearestNeighbors(n_neighbors=k + 1, metric="euclidean", algorithm="brute").fit(x)
    neighbors = model.kneighbors(x, return_distance=False)
    # Exclude self explicitly; duplicate ties may place self outside the first k.
    input_lists = [row[row != i][:k].tolist() for i, row in enumerate(neighbors)]
    return input_lists, trustworthiness(x, y, n_neighbors=k, metric="euclidean")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", type=Path, required=True)
    args = parser.parse_args()
    ids, labels, x, maps = load_saved(args.assets)
    for name in ("pca", "tsne-p30-s7", "umap-n15-d01-s7"):
        result = audit(x, maps[name], ids, 10)
        print(name, {key: value for key, value in result.items() if key != "rows"})
        print("source30", query_lists(x, maps[name], ids, 30, 10))
