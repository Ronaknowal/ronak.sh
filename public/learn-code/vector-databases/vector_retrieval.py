"""Exact filtered retrieval, Qdrant records and a measured Faiss candidate tradeoff.

Install numpy scikit-learn qdrant-client faiss-cpu. Keep iris.csv from the
Data Processing & Loading lesson beside this file. No server or model download.
"""
import argparse
import csv
import heapq
import json
from pathlib import Path

import numpy as np
from qdrant_client import QdrantClient, models
from sklearn.preprocessing import StandardScaler


def exact_topk(vectors, query, k, eligible=None, metric="cosine", block_size=64):
    """Return (row index, score), best first; equal scores prefer smaller index.

    Scores are cosine/dot similarity or NEGATIVE SQUARED Euclidean distance.
    Eligibility is evaluated before selecting k; additional workspace is bounded
    by block_size * dimension plus k, not the size of the whole collection.
    """
    x, q = np.asarray(vectors), np.asarray(query, dtype=float)
    if x.ndim != 2 or q.shape != (x.shape[1],) or not np.issubdtype(x.dtype, np.number) or not np.isfinite(q).all():
        raise ValueError("finite 2D vectors and a matching 1D query required")
    if isinstance(k, bool) or not isinstance(k, int) or k < 1 or not isinstance(block_size, int) or block_size < 1:
        raise ValueError("positive integer k and block_size required")
    if metric not in {"cosine", "dot", "l2"}:
        raise ValueError("unknown metric")
    mask = None if eligible is None else np.asarray(eligible)
    if mask is not None and (mask.shape != (len(x),) or mask.dtype != bool):
        raise ValueError("one Boolean eligibility value per row required")
    qnorm = np.linalg.norm(q)
    if metric == "cosine" and qnorm == 0:
        raise ValueError("cosine is undefined for a zero query")
    heap = []
    for start in range(0, len(x), block_size):
        ids = np.arange(start, min(start + block_size, len(x))) if mask is None else np.flatnonzero(mask[start:start + block_size]) + start
        block = np.asarray(x[ids], dtype=float)
        if not np.isfinite(block).all():
            raise ValueError("eligible vectors must be finite")
        if metric == "l2":
            scores = -np.einsum("ij,ij->i", block - q, block - q)
        elif metric == "dot":
            scores = block @ q
        else:
            norms = np.linalg.norm(block, axis=1)
            if np.any(norms == 0):
                raise ValueError("cosine is undefined for an eligible zero vector")
            scores = (block / norms[:, None]) @ (q / qnorm)
        for row, score in zip(ids.tolist(), scores.tolist()):
            candidate = (score, -row)
            if len(heap) < k:
                heapq.heappush(heap, candidate)
            elif candidate > heap[0]:
                heapq.heapreplace(heap, candidate)
    return [(-row, score) for score, row in sorted(heap, reverse=True)]


def reciprocal_rank_fusion(rankings, constant=60):
    """Explicit local convention: one-based ranks and constant 60 by default."""
    if constant < 0:
        raise ValueError("constant must be nonnegative")
    scores = {}
    for ranking in rankings:
        if len(ranking) != len(set(ranking)):
            raise ValueError("a document may appear only once in each ranking")
        for rank, doc_id in enumerate(ranking, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1 / (constant + rank)
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))


def build_coarse_lists(vectors, centroids):
    """Given fitted/fixed centroids, assign each record to its nearest one.

    Centroid learning belongs to the K-Means lesson. Assignment processes one
    point at a time: no N-by-centroid-by-dimension temporary tensor is required.
    """
    lists = [[] for _ in centroids]
    for row, vector in enumerate(vectors):
        owner = exact_topk(centroids, vector, 1, metric="l2")[0][0]
        lists[owner].append(row)
    return lists


def search_coarse_lists(vectors, centroids, lists, query, k, probes):
    if not 1 <= probes <= len(centroids):
        raise ValueError("probes must select at least one and at most all lists")
    selected = [i for i, _ in exact_topk(centroids, query, probes, metric="l2")]
    # Sort global row IDs so local tie-breaking preserves the global ID rule.
    candidates = sorted(row for index in selected for row in lists[index])
    ranked = exact_topk(vectors[candidates], query, k, metric="l2")
    return [(candidates[i], score) for i, score in ranked], candidates


def run(path):
    import faiss
    faiss.omp_set_num_threads(1)
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    fields = ["sepal_length_cm", "sepal_width_cm", "petal_length_cm", "petal_width_cm"]
    x = np.array([[float(r[c]) for c in fields] for r in rows])
    labels = np.array([int(r["class_id"]) for r in rows])
    # Every fifth observation is held out; scaler sees only the indexed rows.
    index_mask = np.arange(len(x)) % 5 != 0
    scaler = StandardScaler().fit(x[index_mask])
    database = scaler.transform(x[index_mask]).astype("float32")
    queries = scaler.transform(x[~index_mask]).astype("float32")
    index_labels = labels[index_mask]
    client = QdrantClient(":memory:")
    client.create_collection("iris", vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE))
    client.upsert("iris", points=[models.PointStruct(id=i, vector=v.tolist(), payload={"class_id": int(index_labels[i]), "representation": "iris-train-standardized-v1"}) for i, v in enumerate(database)], wait=True)
    condition = models.Filter(must=[models.FieldCondition(key="class_id", match=models.MatchValue(value=1))])
    # Class metadata is an illustrative eligibility constraint, not a classifier.
    max_score_error = 0.0
    for query in queries:
        expected = exact_topk(database, query, 5, index_labels == 1)
        actual = client.query_points("iris", query=query.tolist(), query_filter=condition, limit=5, search_params=models.SearchParams(exact=True)).points
        # Equal-score neighbors may be returned in a different database tie order.
        np.testing.assert_allclose([p.score for p in actual], [s for _, s in expected], atol=2e-6)
        assert all(p.payload["class_id"] == 1 for p in actual)
        max_score_error = max(max_score_error, float(np.max(np.abs(np.array([p.score for p in actual]) - [s for _, s in expected]))))
    first = client.query_points("iris", query=queries[0].tolist(), limit=3).points
    deleted_id = first[0].id
    client.delete("iris", points_selector=models.PointIdsList(points=[deleted_id]), wait=True)
    assert not client.retrieve("iris", ids=[deleted_id])
    assert client.count("iris", exact=True).count == 119
    client.close()
    # A real ANN index, tested locally. L2 is a separate stated geometry here.
    quantizer = faiss.IndexFlatL2(4)
    ivf = faiss.IndexIVFFlat(quantizer, 4, 3)
    ivf.train(database)
    ivf.add(database)
    exact = faiss.IndexFlatL2(4)
    exact.add(database)
    exact_distances, exact_ids = exact.search(queries, 5)
    recalls = {}
    for probes in (1, 2, 3):
        ivf.nprobe = probes
        distances, ids = ivf.search(queries, 5)
        recalls[str(probes)] = float(np.mean([len(set(a) & set(b)) / 5 for a, b in zip(exact_ids, ids)]))
        if probes == 3:
            np.testing.assert_allclose(distances, exact_distances, atol=1e-5)
    # Independent exact calculation, including deterministic tie policy.
    for query, distances in zip(queries, exact_distances):
        np.testing.assert_allclose([-s for _, s in exact_topk(database, query, 5, metric="l2")], distances, atol=1e-5)
    fixture = np.array([[1, 0], [4, 1], [0, 2], [2, 2], [3, 0], [1, 3]], dtype=float)
    eligible = np.array([True, False, True, False, True, True])
    assert [i for i, _ in exact_topk(fixture, [1, 1], 2, eligible)] == [5, 0]
    assert len([i for i, _ in exact_topk(fixture, [1, 1], 2) if eligible[i]]) == 1
    assert exact_topk(fixture, [1, 1], 2, np.zeros(6, dtype=bool)) == []
    assert reciprocal_rank_fusion([["A", "B", "C"], ["C", "B", "D"]])[0][0] == "C"
    coarse_points = np.array([[1.9, 0], [2.1, 0], [4.2, 0], [0, 1], [2, 3], [3, 4]])
    centers = np.array([[0., 0.], [4., 0.], [2., 4.]])
    lists = build_coarse_lists(coarse_points, centers)
    assert lists == [[0, 3], [1, 2], [4, 5]]
    for probes, expected_ids in [(1, [1, 2]), (2, [1, 0]), (3, [1, 0])]:
        ranked, _ = search_coarse_lists(coarse_points, centers, lists, [2.1, 0], 2, probes)
        assert [i for i, _ in ranked] == expected_ids
    # Independent native index using precisely the same supplied centroids.
    fixed_quantizer = faiss.IndexFlatL2(2)
    fixed_quantizer.add(centers.astype("float32"))
    fixed_ivf = faiss.IndexIVFFlat(fixed_quantizer, 2, 3)
    fixed_ivf.is_trained = True  # quantizer was supplied; no training is claimed.
    fixed_ivf.add(coarse_points.astype("float32"))
    for probes in (1, 2, 3):
        fixed_ivf.nprobe = probes
        distances, ids = fixed_ivf.search(np.array([[2.1, 0]], dtype="float32"), 2)
        ranked, _ = search_coarse_lists(coarse_points, centers, lists, [2.1, 0], 2, probes)
        assert ids[0].tolist() == [i for i, _ in ranked]
        np.testing.assert_allclose(distances[0], [-s for _, s in ranked], atol=2e-6)
    return {"indexed_rows": len(database), "held_out_queries": len(queries), "qdrant_max_cosine_score_error": max_score_error, "faiss_ivf_l2_recall_at_5": recalls, "delete_count": 119, "boundary_fixture_prefilter": ["F", "A"], "environment_boundary": "CPU; Qdrant in-memory exact search, Faiss IVF locally; no Qdrant server/HNSW benchmark"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("iris.csv"))
    args = parser.parse_args()
    print(json.dumps(run(args.data), indent=2))
