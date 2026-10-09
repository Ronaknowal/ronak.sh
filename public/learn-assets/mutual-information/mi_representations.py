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


PX = [.25, .25, .25, .25]
LABEL = [[.9, .1], [.9, .1], [.1, .9], [.1, .9]]


def state(encoder, beta):
    pxz = [[PX[x] * value for value in row] for x, row in enumerate(encoder)]
    pzy = [[sum(PX[x] * encoder[x][z] * LABEL[x][y] for x in range(4))
            for y in range(2)] for z in range(len(encoder[0]))]
    pz = [sum(row) for row in pzy]
    decoder = [[p / pz[z] for p in row] for z, row in enumerate(pzy)]
    rate, relevance = information(pxz)[0], information(pzy)[0]
    return rate, relevance, rate - beta * relevance, pz, decoder, pzy


encoders = {
    'constant': [[1.] for _ in range(4)],
    'signal': [[1., 0.], [1., 0.], [0., 1.], [0., 1.]],
    'nuisance': [[1., 0.], [0., 1.], [1., 0.], [0., 1.]],
    'both': [[float(x == z) for z in range(4)] for x in range(4)],
    'noisy signal': [[.8, .2], [.8, .2], [.2, .8], [.2, .8]],
}
for name, encoder in encoders.items():
    rate, relevance, objective, *_ = state(encoder, 3)
    print(name + ':', ' '.join(f'{value:.6f}' for value in [rate, relevance, objective]))
# Columns are input information, label information, J=rate-3*relevance.
# This finite list is a comparison of choices, not all possible encoders.
