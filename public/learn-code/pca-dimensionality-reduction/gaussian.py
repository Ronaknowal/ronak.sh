import numpy as np
from sklearn.decomposition import PCA

rng = np.random.default_rng(23)
noise = rng.normal(size=(40, 20))
pca = PCA(svd_solver="full").fit(noise)
print(round(pca.explained_variance_ratio_[:2].sum(), 4))
