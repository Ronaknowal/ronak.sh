import math

p = q = [0.5, 0.5]
C = [[0, 1], [2, 1]]
epsilon = 0.5
K = [[math.exp(-C[i][j] / epsilon) for j in range(2)] for i in range(2)]
u = v = [1.0, 1.0]

for _ in range(100):
    u = [p[i] / sum(K[i][j] * v[j] for j in range(2)) for i in range(2)]
    v = [q[j] / sum(K[i][j] * u[i] for i in range(2)) for j in range(2)]

plan = [[u[i] * K[i][j] * v[j] for j in range(2)] for i in range(2)]
cost = sum(plan[i][j] * C[i][j] for i in range(2) for j in range(2))
print([[round(x, 3) for x in row] for row in plan])
print(round(cost, 3))