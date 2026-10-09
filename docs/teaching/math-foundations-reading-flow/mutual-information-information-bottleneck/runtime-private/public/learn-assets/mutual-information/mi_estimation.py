import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


import random

for categories, count in [(2, 40), (8, 40), (8, 4000)]:
    randomizer = random.Random(204)
    counts = [[0 for _ in range(categories)] for _ in range(categories)]
    for _ in range(count):
        counts[randomizer.randrange(categories)][randomizer.randrange(categories)] += 1
    joint = [[value / count for value in row] for row in counts]
    print(categories, count, 'plug-in MI:', f'{information(joint)[0]:.6f}', 'true MI:', 0)

# Each observed ID is unique; empirical labels are then deterministic given ID.
labels = [0, 1, 1, 0, 1, 0, 0, 1]
id_joint = [[1 / len(labels) if y == label else 0 for y in range(2)] for label in labels]
print('empirical ID-label MI:', f'{information(id_joint)[0]:.6f}')
print('empirical label entropy:', f'{entropy([.5, .5]):.6f}')
# This describes the empirical table, not predictive information for a new ID.
# These seeded runs illustrate sampling effects; they are not a confidence bound.
