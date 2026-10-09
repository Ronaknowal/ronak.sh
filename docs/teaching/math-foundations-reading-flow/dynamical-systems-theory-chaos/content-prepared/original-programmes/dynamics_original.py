def logistic(x, r):
    return r * x * (1 - x)

r = 3.9
x, y = 0.5, 0.500001  # initial states differ by one millionth
for _ in range(50):
    x = logistic(x, r)
    y = logistic(y, r)

print(round(x, 6), round(y, 6), round(abs(x - y), 6))