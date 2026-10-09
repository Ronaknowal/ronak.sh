import numpy as np
from sklearn.datasets import make_multilabel_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import hamming_loss, accuracy_score, f1_score

X, Y = make_multilabel_classification(
    n_samples=1000,
    n_features=20,
    n_classes=5,
    n_labels=2,
    allow_unlabeled=False,
    random_state=42,
)
X_train, X_test, Y_train, Y_test = train_test_split(
    X, Y, test_size=0.2, random_state=42
)
mean, scale = X_train.mean(axis=0), X_train.std(axis=0) + 1e-8
train = np.c_[np.ones(len(X_train)), (X_train - mean) / scale]
test = np.c_[np.ones(len(X_test)), (X_test - mean) / scale]


def sigmoid(scores):
    return 1 / (1 + np.exp(-np.clip(scores, -500, 500)))


def fit(features, target):
    weights = np.zeros(features.shape[1])
    for _ in range(300):
        probability = sigmoid(features @ weights)
        weights -= 0.05 * features.T @ (probability - target) / len(target)
    return weights


independent = np.column_stack(
    [sigmoid(test @ fit(train, Y_train[:, label])) >= 0.5 for label in range(5)]
).astype(int)
chain = np.zeros_like(Y_test)
for label in range(5):
    # Training uses actual earlier labels; prediction has only earlier predictions.
    weights = fit(np.c_[train, Y_train[:, :label]], Y_train[:, label])
    chain[:, label] = sigmoid(np.c_[test, chain[:, :label]] @ weights) >= 0.5
constant = np.broadcast_to(Y_train.mean(axis=0) >= 0.5, Y_test.shape)
for name, prediction in [
    ("constant", constant),
    ("independent", independent),
    ("chain", chain),
]:
    print(
        f"{name}: Hamming={hamming_loss(Y_test,prediction):.4f}; subset={accuracy_score(Y_test,prediction):.4f}; micro-F1={f1_score(Y_test,prediction,average='micro',zero_division=0):.4f}"
    )
print(
    "Stable mean summed cell loss at zero scores:",
    round(
        float(
            np.mean(
                np.sum(np.logaddexp(0, np.zeros_like(Y_train)) - Y_train * 0, axis=1)
            )
        ),
        6,
    ),
)
