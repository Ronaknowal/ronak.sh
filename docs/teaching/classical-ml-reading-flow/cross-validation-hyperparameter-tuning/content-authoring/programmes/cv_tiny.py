import numpy as np

def kfold_indices(n, k, shuffle=False, seed=0):
    if not 2 <= k <= n:
        raise ValueError("Require 2 <= k <= n.")
    indices = np.arange(n)
    if shuffle:
        np.random.default_rng(seed).shuffle(indices)
    folds = np.array_split(indices, k)
    for held in range(k):
        train = np.sort(np.concatenate([folds[j] for j in range(k) if j != held]))
        yield train, folds[held]

x = np.arange(7)
y = np.array([0, 0, 0, 1, 1, 1, 1])
fold_scores = []
total_correct = 0
for train, validation in kfold_indices(len(x), 3):
    distances = np.abs(x[validation, None] - x[train])
    nearest = train[np.argmin(distances, axis=1)]
    prediction = y[nearest]
    correct = int(np.sum(prediction == y[validation]))
    fold_scores.append(correct / len(validation))
    total_correct += correct
    print(validation.tolist(), prediction.tolist(), correct, "/", len(validation))
print("fold mean", np.mean(fold_scores))
print("pooled", total_correct / len(x))