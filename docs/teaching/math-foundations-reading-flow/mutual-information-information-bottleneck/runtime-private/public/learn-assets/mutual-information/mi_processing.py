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


rows = [(x, y, z, .5 * (.9 if y == x else .1) * (.8 if z == x else .2))
        for x in range(2) for y in range(2) for z in range(2)]


def pair_table(first, second):
    table = [[0., 0.], [0., 0.]]
    for row in rows:
        table[row[first]][row[second]] += row[3]
    return table


ixy = information(pair_table(0, 1))[0]
izy = information(pair_table(2, 1))[0]
conditional = 0.
for z in range(2):
    mass = sum(p for x, y, zz, p in rows if zz == z)
    table = [[0., 0.], [0., 0.]]
    for x, y, zz, p in rows:
        if zz == z:
            table[x][y] += p / mass
    conditional += mass * information(table)[0]
print('I(X;Y):', f'{ixy:.6f}')
print('I(Z;Y):', f'{izy:.6f}')
print('I(X;Y|Z):', f'{conditional:.6f}')
print('DPI gap identity:', abs(ixy - izy - conditional) < 1e-12)
