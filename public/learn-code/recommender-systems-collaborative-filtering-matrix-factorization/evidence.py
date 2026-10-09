import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)

print("users, items:", ratings.shape)
print("observed, missing:", int(observed.sum()), int((~observed).sum()))
print("observed mean:", round(ratings[observed].mean(), 3))
print("user means:", np.round(np.nanmean(ratings, axis=1), 3).tolist())
print("user 0 unseen:", np.flatnonzero(~observed[0]).tolist())
changed = np.array([0.0, np.nan, 4.0])
print("zero is observed:", np.isfinite(changed).tolist())
print("zero-inclusive mean:", changed[np.isfinite(changed)].mean())
# Missing values never enter an explicit squared-error objective.
predictions = np.full(ratings.shape, 3.0)
print(
    "constant-3 observed SSE:",
    float(((ratings[observed] - predictions[observed]) ** 2).sum()),
)