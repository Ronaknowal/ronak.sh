import math

joint = [[0.4, 0.1], [0.1, 0.4]]  # rows: X, columns: Y
p_x = [sum(row) for row in joint]
p_y = [sum(joint[i][j] for i in range(2)) for j in range(2)]

mi = sum(
    joint[i][j] * math.log2(joint[i][j] / (p_x[i] * p_y[j]))
    for i in range(2) for j in range(2) if joint[i][j] > 0
)
entropy_y = -sum(p * math.log2(p) for p in p_y if p > 0)

print(round(mi, 3), round(entropy_y, 3), round(entropy_y - mi, 3))
