import math

p = [0.7, 0.2, 0.1]
q = [0.4, 0.5, 0.1]
m = [(a + b) / 2 for a, b in zip(p, q)]

forward_kl = sum(a * math.log(a / b) for a, b in zip(p, q))
js = 0.5 * sum(a * math.log(a / b) for a, b in zip(p, m))
js += 0.5 * sum(a * math.log(a / b) for a, b in zip(q, m))
tv = 0.5 * sum(abs(a - b) for a, b in zip(p, q))

print(round(forward_kl, 3), round(js, 3), round(tv, 3))
