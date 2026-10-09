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


values = [-1, 0, 1]
joint = [[0, 1 / 3], [1 / 3, 0], [0, 1 / 3]]
mi, remaining = information(joint)
mean_x = sum(values) / 3
mean_y = sum(x * x for x in values) / 3
covariance = sum((x - mean_x) * (x * x - mean_y) for x in values) / 3
print('covariance:', f'{covariance:.6f}')
print('MI bits:', f'{mi:.6f}')
print('remaining label entropy:', f'{remaining:.6f}')
print('sign-only MI:', f'{information([[1 / 3, 1 / 3], [0, 1 / 3]])[0]:.6f}')
# This sign code is 0 for X<=0 and 1 for X>0. It confuses -1 with 0.
