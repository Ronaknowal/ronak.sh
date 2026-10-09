import numpy as np
from sklearn.datasets import load_wine
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

wine = load_wine()  # included with scikit-learn; no dataset download
X, cultivar = wine.data, wine.target

raw_pca = PCA(svd_solver="full").fit(X)
scaler = StandardScaler().fit(X)
standardized = scaler.transform(X)
scaled_pca = PCA(svd_solver="full").fit(standardized)
scores = scaled_pca.transform(standardized)

print(X.shape, np.bincount(cultivar))
print(np.round(raw_pca.explained_variance_ratio_[:2], 4))
print(np.round(scaled_pca.explained_variance_ratio_[:3], 4))
print(round(scaled_pca.explained_variance_ratio_[:2].sum(), 4))
