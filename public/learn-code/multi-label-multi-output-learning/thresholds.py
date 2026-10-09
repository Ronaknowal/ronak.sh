from itertools import product
import numpy as np
from sklearn.metrics import f1_score

scores = np.array(
    [[0.9, 0.9], [0.8, 0.8], [0.8, 0.7], [0.55, 0.6], [0.4, 0.4], [0.2, 0.1]]
)
truth = np.array([[0, 0], [0, 1], [0, 1], [0, 0], [0, 0], [1, 1]])
cuts = [sorted(set([0.0, 1.01, *scores[:, j]])) for j in range(2)]


def score(threshold, average):
    return f1_score(truth, scores >= threshold, average=average, zero_division=0)


per_label = np.array(
    [
        max(
            cuts[j],
            key=lambda t: f1_score(truth[:, j], scores[:, j] >= t, zero_division=0),
        )
        for j in range(2)
    ]
)
micro = max(product(*cuts), key=lambda t: score(np.array(t), "micro"))
shared_candidates = sorted(set([0.0, 1.01, *scores.ravel()]))
shared = max(shared_candidates, key=lambda t: score(t, "micro"))
for name, threshold in [
    ("per-label F1", per_label),
    ("joint micro", np.array(micro)),
    ("shared micro", shared),
]:
    print(
        name,
        "threshold",
        np.asarray(threshold).tolist(),
        "macro",
        round(score(threshold, "macro"), 6),
        "micro",
        round(score(threshold, "micro"), 6),
    )
print(
    "At t=.8 both equal .8 scores stay selected:",
    (scores[:, 0] >= 0.8).astype(int).tolist(),
)
print("No-positive choice:", (scores[:, 0] >= 1.01).astype(int).tolist())
