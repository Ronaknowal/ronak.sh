from fractions import Fraction as F

nodes = [F(0), F(1, 4), F(1, 2), F(3, 4), F(1)]
# Ascending-power coefficients of the product, then its square.
coefficients = [F(1)]
for root in nodes:
    expanded = [F(0)] * (len(coefficients) + 1)
    for power, value in enumerate(coefficients):
        expanded[power] -= root * value
        expanded[power + 1] += value
    coefficients = expanded
squared = [F(0)] * (2 * len(coefficients) - 1)
for i, first in enumerate(coefficients):
    for j, second in enumerate(coefficients):
        squared[i + j] += first * second


def g(x):
    return sum(value * x**power for power, value in enumerate(squared))


area = sum(value / F(power + 1) for power, value in enumerate(squared))
print("samples:", [g(x) for x in nodes])
print("true integral:", area, f"{float(area):.9e}")
print("lost area below 1e-6 for x^(-1/2):", 2 * (1e-6) ** 0.5)
print("after x=u^2: integral of 2 on [0,1] =", 2)