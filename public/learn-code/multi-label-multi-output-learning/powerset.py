import numpy as np
from sklearn.linear_model import LogisticRegression

X = np.array([[-2], [-1.8], [-1], [-0.8], [1], [1.2]])
Y = np.array([[0, 0], [0, 0], [0, 1], [0, 1], [1, 0], [1, 0]])
vocabulary, classes = np.unique(Y, axis=0, return_inverse=True)
model = LogisticRegression(C=1).fit(X, classes)
pred = vocabulary[model.predict([[0.5], [2]])]
print("Observed vector classes:", vocabulary.tolist())
print("Decoded predictions:", pred.tolist())
print(
    "11 is an available class:", any(np.array_equal(row, [1, 1]) for row in vocabulary)
)

# A transparent vote example, not an implementation of the full RAkEL trainer.
subsets = [(0, 1), (1, 2), (0, 2)]
local_predictions = [(1, 0), (1, 1), (0, 1)]
positive, coverage = np.zeros(3), np.zeros(3)
for subset, prediction in zip(subsets, local_predictions):
    for label, value in zip(subset, prediction):
        positive[label] += value
        coverage[label] += 1
votes = positive / coverage
print("Overlap vote fractions:", votes.tolist())
print("Tie-positive decoded labels:", (votes >= 0.5).astype(int).tolist())
