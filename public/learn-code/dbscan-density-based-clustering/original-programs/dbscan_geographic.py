import numpy as np
from sklearn.cluster import DBSCAN

latitude_longitude_degrees = np.array([[0, 0], [0, .01], [0, .02], [0, 1]])
X = np.deg2rad(latitude_longitude_degrees)
labels = DBSCAN(eps=2 / 6371, min_samples=2,
                metric="haversine", algorithm="ball_tree").fit_predict(X)
print(labels.tolist())