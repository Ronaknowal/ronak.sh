import numpy as np
from sklearn.neighbors import NearestNeighbors

X = np.array([-1.75, -1.5, -1.25, -1, 1, 1.25, 1.5, 1.75, 0, 4])[:, None]
m = 4
search = NearestNeighbors(n_neighbors=m).fit(X)
distances, _ = search.kneighbors(X)
core_radius = distances[:, m - 1]
print(core_radius.tolist())
print(np.sort(core_radius).tolist())
print(int(np.sum(core_radius <= 1)))