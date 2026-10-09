import numpy as np
from sklearn.cluster import OPTICS, cluster_optics_dbscan

X = np.array([-1.75, -1.5, -1.25, -1, 1, 1.25, 1.5, 1.75, 0, 4])[:, None]
model = OPTICS(min_samples=4, max_eps=2).fit(X)
labels = cluster_optics_dbscan(
    reachability=model.reachability_,
    core_distances=model.core_distances_,
    ordering=model.ordering_, eps=1,
)
print(model.ordering_.tolist())
print(model.reachability_[model.ordering_].tolist())
print(labels.tolist())