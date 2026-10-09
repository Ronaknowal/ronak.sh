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


rows = [(a, b, a ^ b, .5 * (.25 if b else .75)) for a in range(2) for b in range(2)]
tables = {'A': [[0., 0.] for _ in range(2)], 'B': [[0., 0.] for _ in range(2)], 'pair': [[0., 0.] for _ in range(4)]}
for a, b, y, p in rows:
    tables['A'][a][y] += p
    tables['B'][b][y] += p
    tables['pair'][2 * a + b][y] += p
for name, table in tables.items():
    print(name, 'MI:', f'{information(table)[0]:.6f}')
conditional = 0.
for b in range(2):
    table = [[0., 0.], [0., 0.]]
    for a in range(2):
        table[a][a ^ b] = .5
    conditional += (.25 if b else .75) * information(table)[0]
print('I(A;Y|B):', f'{conditional:.6f}')
print('chain rule:', f'{information(tables["B"])[0] + conditional:.6f}')
# Contrast: when X=Y=C for a fair common bit C, unconditional MI is 1,
# but within each C slice X and Y are constants, so conditional MI is 0.
common_joint = [[0.5, 0.0], [0.0, 0.5]]
constant_slices = [[[1.0, 0.0], [0.0, 0.0]], [[0.0, 0.0], [0.0, 1.0]]]
common_conditional = sum(0.5 * information(table)[0] for table in constant_slices)
print('common-bit unconditional / conditional:',
      f'{information(common_joint)[0]:.6f} {common_conditional:.6f}')
