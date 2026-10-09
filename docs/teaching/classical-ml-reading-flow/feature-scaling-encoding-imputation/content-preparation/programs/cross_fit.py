import numpy as np

def cross_fit(categories, target, folds, smoothing=2.0):
    encoded = np.empty(len(target), dtype=float)
    for held_fold in np.unique(folds):
        donors = folds != held_fold
        prior = target[donors].mean()
        for row in np.flatnonzero(~donors):
            matching = donors & (categories == categories[row])
            encoded[row] = (
                target[matching].sum() + smoothing * prior
            ) / (matching.sum() + smoothing)
    return encoded

categories = np.array(["A", "A", "B", "B", "C", "C"])
target = np.array([1., 1., 0., 0., 1., 0.])
folds = np.array([0, 1, 0, 1, 0, 1])
print(np.round(cross_fit(categories, target, folds), 6))
changed = target.copy()
changed[0] = 0.
print(np.round(cross_fit(categories, changed, folds), 6))