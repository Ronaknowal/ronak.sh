import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.metrics import adjusted_rand_score

inner_angle = 2 * np.pi * np.arange(12) / 12
outer_angle = 2 * np.pi * np.arange(36) / 36
inner = np.column_stack([np.cos(inner_angle), np.sin(inner_angle)])
outer = 3 * np.column_stack([np.cos(outer_angle), np.sin(outer_angle)])
X = np.vstack([inner, outer])
ring = np.r_[np.zeros(12, dtype=int), np.ones(36, dtype=int)]
density = DBSCAN(eps=.6, min_samples=3).fit(X)
centers = KMeans(n_clusters=2, n_init=10, random_state=0).fit(X)
print("core rows", len(density.core_sample_indices_))
print("DBSCAN ring ARI", round(adjusted_rand_score(ring, density.labels_), 3))
print("KMeans ring ARI", round(adjusted_rand_score(ring, centers.labels_), 3))