import numpy as np
from sklearn.cluster import HDBSCAN

X = np.array([-1.75, -1.5, -1.25, -1, 1, 1.25, 1.5, 1.75, 0, 4])[:, None]
model = HDBSCAN(min_cluster_size=4, min_samples=4,
                cluster_selection_method="eom", copy=True).fit(X)
print(model.labels_.tolist())
print(model.probabilities_.round(3).tolist())