import numpy as np
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

wine = load_wine()
train, validation = train_test_split(
    np.arange(len(wine.data)), test_size=0.25,
    random_state=42, stratify=wine.target
)
scaler = StandardScaler().fit(wine.data[train])
A = scaler.transform(wine.data[train])
B = scaler.transform(wine.data[validation])
pca = PCA(svd_solver="full").fit(A)

baseline_mse = np.mean((B - pca.mean_)**2)
ratios = []
for k in range(14):
    directions = pca.components_[:k]
    scores = (B - pca.mean_) @ directions.T
    reconstruction = scores @ directions + pca.mean_
    ratios.append(np.mean((B - reconstruction)**2) / baseline_mse)

print(len(train), len(validation))
print(round(baseline_mse, 4))
for k in [0, 2, 7, 8, 10, 13]:
    print(k, round(ratios[k], 4))
print(next(k for k, ratio in enumerate(ratios) if ratio <= 0.10))
