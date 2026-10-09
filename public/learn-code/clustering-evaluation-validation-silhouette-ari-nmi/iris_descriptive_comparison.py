from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (silhouette_score, silhouette_samples,
                             adjusted_rand_score, adjusted_mutual_info_score)

data = np.genfromtxt(Path(__file__).with_name("iris.csv"),
                     delimiter=",", skip_header=1)
x, species = data[:, 1:5], data[:, 5].astype(int)
scaled = StandardScaler().fit_transform(x)
representations = {
    "raw4": x,
    "scaled4": scaled,
    "pca2": PCA(2, svd_solver="full").fit_transform(scaled),
    "white2": PCA(2, whiten=True, svd_solver="full").fit_transform(scaled),
}
for name, z in representations.items():
    for k in [2, 3]:
        labels = KMeans(n_clusters=k, n_init=20, random_state=17).fit_predict(z)
        values = silhouette_samples(z, labels)
        print(name, k, f"sil={values.mean():.6f}",
              f"ARI={adjusted_rand_score(species, labels):.6f}",
              f"AMI={adjusted_mutual_info_score(species, labels):.6f}",
              f"negative={np.sum(values < 0)}")