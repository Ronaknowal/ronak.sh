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


encoder = [[.8, .2], [.8, .2], [.2, .8], [.2, .8]]
rate, relevance, objective, pz, truth, pzy = state(encoder, 3)


def kl(p, q):
    return sum(a * (math.log2(a) - math.log2(b)) for a, b in zip(p, q) if a > 0)


for name, reference, decoder in [
    ('matched', [.5, .5], [[.74, .26], [.26, .74]]),
    ('mismatched', [.8, .2], [[.6, .4], [.4, .6]]),
]:
    upper = sum(PX[x] * kl(row, reference) for x, row in enumerate(encoder))
    ce = -sum(pzy[z][y] * math.log2(decoder[z][y]) for z in range(2) for y in range(2))
    lower = 1 - ce
    rate_gap = kl(pz, reference)
    prediction_gap = sum(pz[z] * kl(truth[z], decoder[z]) for z in range(2))
    assert abs(upper - rate - rate_gap) < 1e-12
    assert abs(relevance - lower - prediction_gap) < 1e-12
    upper_j = upper + 3 * ce - 3
    assert abs(upper_j - objective - rate_gap - 3 * prediction_gap) < 1e-12
    print(name, 'rate upper / relevance lower:', f'{upper:.6f}', f'{lower:.6f}')
    print('rate / predictive gaps:', f'{rate_gap:.6f}', f'{prediction_gap:.6f}')
    print('true J / upper J:', f'{objective:.6f}', f'{upper_j:.6f}')
