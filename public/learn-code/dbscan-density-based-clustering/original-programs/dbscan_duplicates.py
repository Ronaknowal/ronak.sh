import numpy as np
from sklearn.cluster import DBSCAN

X = np.array([[0.], [0.], [0.], [2.]])
unique, inverse, counts = np.unique(X, axis=0, return_inverse=True, return_counts=True)
model = DBSCAN(eps=.25, min_samples=3).fit(unique, sample_weight=counts)
print(model.labels_[inverse].tolist())
print(DBSCAN(eps=.25, min_samples=3).fit_predict(unique).tolist())