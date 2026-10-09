import numpy as np

x = np.array([0., 1., 2., 20., 24., 28.])
k = 2
if len(np.unique(x)) != len(x) or not 1 <= k < len(x):
    raise ValueError("Use distinct coordinates and 1 <= k < n.")

distance = abs(x[:, None] - x[None, :])
np.fill_diagonal(distance, np.inf)  # Exclude this row's own identity.
neighbors = np.argsort(distance, axis=1, kind="stable")[:, :k]
radius = distance[np.arange(len(x)), neighbors[:, -1]]
reach = np.maximum(distance[np.arange(len(x))[:, None], neighbors],
                   radius[neighbors])
lrd = 1 / reach.mean(axis=1)
lof = (lrd[neighbors] / lrd[:, None]).mean(axis=1)

queries = np.array([4., 6., 17.])
query_distance = abs(queries[:, None] - x[None, :])
query_neighbors = np.argsort(query_distance, axis=1, kind="stable")[:, :k]
query_reach = np.maximum(
    query_distance[np.arange(len(queries))[:, None], query_neighbors],
    radius[query_neighbors],
)
query_lrd = 1 / query_reach.mean(axis=1)
query_lof = (lrd[query_neighbors] / query_lrd[:, None]).mean(axis=1)
print("Reference radii:", radius)
print("Reference lrd:", np.round(lrd, 6))
print("Reference LOF:", np.round(lof, 6))
print("Query LOF:", np.round(query_lof, 6))