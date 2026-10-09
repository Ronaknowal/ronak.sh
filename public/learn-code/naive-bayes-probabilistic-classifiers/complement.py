import numpy as np
from scipy.special import logsumexp
from sklearn.naive_bayes import ComplementNB

# Three routing classes, one aggregate training document per class.
X = np.array([[8, 2, 0], [1, 7, 2], [0, 2, 8]])
y = np.array([0, 1, 2])
query = np.array([[2, 0, 1]])
complement_counts = X.sum(axis=0) - X
theta = (complement_counts + 1) / (complement_counts.sum(axis=1, keepdims=True) + 3)
print("complement counts:", complement_counts.tolist())
print("complement probabilities:", theta.round(6).tolist())
for normalize in [False, True]:
    weights = -np.log(theta)
    if normalize:
        weights /= weights.sum(axis=1, keepdims=True)
    scores = query @ weights.T
    model = ComplementNB(alpha=1, norm=normalize).fit(X, y)
    print(
        "norm",
        normalize,
        "scores:",
        scores.round(6).tolist(),
        "class:",
        model.predict(query).tolist(),
    )
    print("weights match:", bool(np.allclose(weights, model.feature_log_prob_)))
    print(
        "softmax matches:",
        bool(
            np.allclose(
                np.exp(scores - logsumexp(scores, axis=1, keepdims=True)),
                model.predict_proba(query),
            )
        ),
    )
print("These normalized scores are not a fitted generative P(class | document).")
