import numpy as np
from sklearn.naive_bayes import MultinomialNB

vocabulary = ["free", "money", "win", "prize", "meeting", "agenda", "report", "quarter"]
X = np.array(
    [
        [3, 2, 1, 1, 0, 0, 0, 0],
        [2, 3, 2, 0, 0, 0, 0, 0],
        [1, 1, 3, 2, 0, 0, 0, 0],
        [4, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 3, 1, 1],
        [0, 0, 0, 0, 1, 1, 3, 2],
        [0, 1, 0, 0, 3, 2, 1, 0],
        [0, 0, 0, 0, 2, 1, 2, 3],
    ]
)
y = np.array([1, 1, 1, 1, 0, 0, 0, 0])

# Fourteen labeled rows; every batch uses the same fixed eight-column vocabulary.
X = np.concatenate([X, X[:6]], axis=0)
y = np.concatenate([y, y[:6]])
online = MultinomialNB(alpha=1)
batch_sizes = []
for start in range(0, len(y), 4):
    stop = min(start + 4, len(y))
    batch_sizes.append(stop - start)
    online.partial_fit(X[start:stop], y[start:stop], classes=np.array([0, 1]))
batch = MultinomialNB(alpha=1).fit(X, y)
print("batch sizes:", batch_sizes)
print("class counts:", online.class_count_.astype(int).tolist())
print(
    "same sufficient counts:",
    bool(np.array_equal(online.feature_count_, batch.feature_count_)),
)
print(
    "same probabilities:",
    bool(np.allclose(online.predict_proba(X), batch.predict_proba(X))),
)
print("floor-based loop would consume:", (len(y) // 4) * 4, "of", len(y), "rows")
print("This model accumulates all fourteen rows; it does not apply a moving window.")
