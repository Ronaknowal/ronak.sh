import numpy as np
from sklearn.neighbors import LocalOutlierFactor

x = np.array([0., 1., 2., 20., 24., 28.])[:, None]
model = LocalOutlierFactor(n_neighbors=2, novelty=True).fit(x)
print("Training LOF:", np.round(-model.negative_outlier_factor_, 6))
print("New-query LOF:", np.round(-model.score_samples([[6.], [17.]]), 6))
print("Wrong training comparison:", np.round(-model.score_samples(x), 6))