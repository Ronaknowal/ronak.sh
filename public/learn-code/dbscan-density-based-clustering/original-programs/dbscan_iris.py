from pathlib import Path
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler

data = np.genfromtxt(Path(__file__).with_name("iris.csv"), delimiter=",", skip_header=1)
row_ids = data[:, 0].astype(int)
features = data[:, 1:5]
species = data[:, 5].astype(int)
X = StandardScaler().fit_transform(features)

print("eps clusters core border noise coverage silhouette ARI_all")
for eps in [.3, .5, .8, 1.0]:
    model = DBSCAN(eps=eps, min_samples=5).fit(X)
    labels = model.labels_
    assigned = labels >= 0
    groups = np.unique(labels[assigned])
    core = len(model.core_sample_indices_)
    border = int(assigned.sum()) - core
    noise = int((~assigned).sum())
    silhouette = (silhouette_score(X[assigned], labels[assigned])
                  if 2 <= len(groups) < assigned.sum() else float("nan"))
    ari_all = adjusted_rand_score(species, labels)
    print(f"{eps:.1f} {len(groups)} {core} {border} {noise} "
          f"{assigned.mean():.3f} {silhouette:.3f} {ari_all:.3f}")
    print("noise_ids", row_ids[~assigned].tolist())