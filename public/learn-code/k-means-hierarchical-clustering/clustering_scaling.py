import numpy as np
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import adjusted_rand_score


def groups(labels):
    return sorted(
        [np.flatnonzero(labels == label).tolist() for label in np.unique(labels)]
    )


rectangle = np.array([[0.0, 0.0], [0.0, 10.0], [2.0, 0.0], [2.0, 10.0]])


def fit_labels(points):
    return KMeans(n_clusters=2, n_init=20, random_state=7).fit_predict(points)


original = fit_labels(rectangle)
converted = rectangle * [100.0, 1.0]
uncorrected = fit_labels(converted)
corrected = fit_labels(converted * np.sqrt([1 / 100**2, 1.0]))
print("original coordinate groups:", groups(original))
print("first coordinate converted without metric correction:", groups(uncorrected))
print("compensated squared-distance weights:", groups(corrected))
print("compensated ARI:", adjusted_rand_score(original, corrected))

# Rows are constructed devices: temperature (°C), vibration (mm/s).
training = np.array(
    [[1.0, 10.0], [2.0, 12.0], [1.5, 9.0], [8.0, 30.0], [9.0, 29.0], [8.5, 32.0]]
)
held_out = np.array([[2.5, 11.0], [8.0, 31.0], [20.0, 100.0]])
pipeline = make_pipeline(
    StandardScaler(), KMeans(n_clusters=2, n_init=10, random_state=7)
)
pipeline.fit(training)
mean_before = pipeline[0].mean_.copy()
centers_before = pipeline[1].cluster_centers_.copy()
labels = pipeline.predict(held_out)
distances = pipeline.transform(held_out).min(axis=1)
print("training-only coordinate means:", np.round(mean_before, 6).tolist())
print("held-out nearest standardized distances:", np.round(distances, 6).tolist())
print(
    "predict changed scaler or centers:",
    not (
        np.array_equal(mean_before, pipeline[0].mean_)
        and np.array_equal(centers_before, pipeline[1].cluster_centers_)
    ),
)