"""Coarse posting lists, exact candidate reranking and optional ordinary Faiss."""
import argparse
import numpy as np
from clustering_core import points_array, assign_chunked, squared_to_center


def build_lists(database, centers, ids=None):
    database = points_array(database)
    centers = points_array(centers)
    ids = np.arange(len(database)) if ids is None else np.asarray(ids)
    if ids.shape != (len(database),) or len(np.unique(ids)) != len(ids):
        raise ValueError("Supply one unique database ID per row.")
    labels, _ = assign_chunked(database, centers)
    return {"database": database, "centers": centers, "ids": ids,
            "lists": [np.flatnonzero(labels == group) for group in range(len(centers))]}


def search(index, query, nprobe=1, count=1):
    centers = index["centers"]
    query = points_array(np.asarray(query, dtype=float).reshape(1, -1))
    if query.shape[1] != centers.shape[1]:
        raise ValueError("Query dimension differs from the index.")
    if not isinstance(nprobe, int) or not 1 <= nprobe <= len(centers):
        raise ValueError("nprobe must be an integer between one and the list count.")
    if not isinstance(count, int) or count < 1:
        raise ValueError("count must be positive.")
    coarse = np.array([squared_to_center(query, center)[0] for center in centers])
    selected = np.argsort(coarse, kind="stable")[:nprobe]
    candidates = np.concatenate([index["lists"][group] for group in selected])
    if not len(candidates):
        return {"list_ids": selected.tolist(), "ids": [], "squared_distances": [], "candidate_count": 0}
    candidates.sort()
    distances = squared_to_center(index["database"][candidates], query[0])
    # Row order resolves exact ties; database IDs remain payloads, not labels.
    order = np.argsort(distances, kind="stable")[:count]
    return {"list_ids": selected.tolist(), "ids": index["ids"][candidates[order]].tolist(),
            "squared_distances": distances[order].tolist(), "candidate_count": len(candidates)}


def full_scan(database, queries, count=1):
    database = points_array(database)
    return [search(build_lists(database, [database.mean(axis=0)]), row, count=count)
            for row in points_array(queries)]


def ordinary_faiss():
    # The optional package is required for this explicitly requested route.
    # An ImportError is not replaced by invented library output.
    import faiss
    rng = np.random.default_rng(7)
    training = rng.normal(size=(256, 2)).astype("float32")
    database = np.ascontiguousarray(training[:64])
    queries = np.ascontiguousarray(training[64:68])
    flat = faiss.IndexFlatL2(2)
    flat.add(database)
    exact_distance, exact_id = flat.search(queries, 1)
    coarse = faiss.IndexFlatL2(2)
    index = faiss.IndexIVFFlat(coarse, 2, 4, faiss.METRIC_L2)
    index.train(training)
    index.add(database)
    print("Faiss version:", getattr(faiss, "__version__", "unreported"))
    print("flat IDs / squared distances:", exact_id.tolist(), exact_distance.tolist())
    for probes in [1, 4]:
        index.nprobe = probes
        distance, ids = index.search(queries, 1)
        print("nprobe / IDs / squared distances / ID recall:", probes, ids.tolist(),
              distance.tolist(), float(np.mean(ids == exact_id)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--faiss", action="store_true")
    args = parser.parse_args()
    database = np.array([[4.9], [6.0]])
    index = build_lists(database, [[0.0], [10.0]], ids=[0, 1])
    print("posting database IDs:", [index["ids"][rows].tolist() for rows in index["lists"]])
    for probes in [1, 2]:
        print("query / nprobe / result:", [5.1], probes, search(index, [5.1], probes))
    empty = build_lists([[0.0]], [[0.0], [10.0]])
    print("empty nearest list:", search(empty, [10.0]))
    print("full scan:", full_scan(database, [[5.1]]))
    if args.faiss:
        ordinary_faiss()


if __name__ == "__main__":
    main()
