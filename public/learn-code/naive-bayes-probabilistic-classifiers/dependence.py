from fractions import Fraction as F
from itertools import product

prior = F(1, 5)
positive_rates = [F(2, 5), F(4, 5)]  # normal, fault
for copies in [1, 2, 3, 5]:
    correct = F(0)
    brier = F(0)
    probabilities = []
    for positive in [True, False]:
        likelihoods = positive_rates if positive else [1 - p for p in positive_rates]
        joint = [(1 - prior) * likelihoods[0], prior * likelihoods[1]]
        fake_joint = [
            (1 - prior) * likelihoods[0] ** copies,
            prior * likelihoods[1] ** copies,
        ]
        p = fake_joint[1] / sum(fake_joint)
        predicted = int(p > F(1, 2))  # Ties choose normal.
        correct += joint[predicted]
        brier += joint[0] * p**2 + joint[1] * (1 - p) ** 2
        probabilities.append(str(p))
    print(
        "copies",
        copies,
        "P(fault | +/-)",
        probabilities,
        "actual accuracy",
        str(correct),
        "Brier",
        format(float(brier), ".6f"),
    )
print(
    "true P(fault | +):",
    prior
    * positive_rates[1]
    / ((1 - prior) * positive_rates[0] + prior * positive_rates[1]),
)

rows = [(a, b, int(a != b)) for a, b in product([0, 1], repeat=2)]
for label in [0, 1]:
    selected = [(a, b) for a, b, y in rows if y == label]
    print(
        "XOR class",
        label,
        "feature-positive rates:",
        [str(F(sum(row[j] for row in selected), len(selected))) for j in [0, 1]],
    )
print("XOR NB has identical marginal models; the pair still determines the class.")
