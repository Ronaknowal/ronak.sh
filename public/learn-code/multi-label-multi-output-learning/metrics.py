import numpy as np
from sklearn.metrics import accuracy_score, f1_score, hamming_loss, jaccard_score

truth = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 0], [0, 0, 1]])
pred = np.array([[1, 0, 1], [0, 1, 0], [1, 0, 0], [0, 1, 1]])
tp = int(((truth == 1) & (pred == 1)).sum())
fp = int(((truth == 0) & (pred == 1)).sum())
fn = int(((truth == 1) & (pred == 0)).sum())
print("TP, FP, FN:", tp, fp, fn)
print(
    "Hamming loss / exact-set accuracy:",
    hamming_loss(truth, pred),
    accuracy_score(truth, pred),
)
for average in ["micro", "macro", "samples"]:
    print(
        average,
        "F1/Jaccard:",
        round(f1_score(truth, pred, average=average, zero_division=0), 6),
        round(jaccard_score(truth, pred, average=average, zero_division=0), 6),
    )
empty = np.zeros((1, 3), dtype=int)
print(
    "Both-empty sample F1:", f1_score(empty, empty, average="samples", zero_division=0)
)
all_positive = np.ones((2, 5), dtype=int)
for name, candidate in [("A", [[1] * 5, [0] * 5]), ("B", [[1, 1, 0, 0, 0]] * 2)]:
    print(
        name,
        "mean J/F1:",
        round(
            jaccard_score(all_positive, candidate, average="samples", zero_division=0),
            6,
        ),
        round(f1_score(all_positive, candidate, average="samples", zero_division=0), 6),
    )
