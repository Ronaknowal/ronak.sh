from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, adjusted_rand_score

data = np.genfromtxt(Path(__file__).with_name("iris.csv"), delimiter=",", skip_header=1)
x, species = data[:, 1:5], data[:, 5].astype(int)
order = np.random.default_rng(23).permutation(len(x))
fit_ids, select_ids, report_ids = order[:90], order[90:120], order[120:]
candidates = []
for k in [2, 3, 4]:
    model = make_pipeline(StandardScaler(),
                          KMeans(n_clusters=k, n_init=20, random_state=17))
    model.fit(x[fit_ids])
    selected_labels = model.predict(x[select_ids])
    group_count = len(np.unique(selected_labels))
    sizes = np.bincount(model[-1].labels_, minlength=k)
    if sizes.min() < 10 or not 2 <= group_count < len(select_ids):
        continue
    score = silhouette_score(model[0].transform(x[select_ids]), selected_labels)
    candidates.append((score, -k, model))
if not candidates:
    raise ValueError("No eligible candidate under the development rule.")
selection_score, negative_k, model = max(candidates, key=lambda row: row[:2])

# All choices above are now frozen.
report_labels = model.predict(x[report_ids])
baseline = make_pipeline(StandardScaler(),
                         KMeans(n_clusters=1, n_init=1, random_state=17))
baseline.fit(x[fit_ids])
error = np.mean(model.transform(x[report_ids]).min(axis=1)**2)
base_error = np.mean(baseline.transform(x[report_ids]).min(axis=1)**2)
print("split sizes:", len(fit_ids), len(select_ids), len(report_ids))
print("selected k:", -negative_k, "selection silhouette:", round(selection_score, 6))
print("report distortion / baseline:", round(error, 6), round(base_error, 6))
print("report species ARI:", round(adjusted_rand_score(species[report_ids], report_labels), 6))