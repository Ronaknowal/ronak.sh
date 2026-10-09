from fractions import Fraction as F


def independent(p):
    return [(1 - p) ** 2, (1 - p) * p, p * (1 - p), p * p]


low, high = independent(F(1, 10)), independent(F(9, 10))
pooled = [(a + b) / 2 for a, b in zip(low, high)]
marginal = pooled[2] + pooled[3]
print("Pooled 00,01,10,11:", list(map(str, pooled)))
print("Pooled P(B=1):", pooled[1] + pooled[3])
print("Pooled P(B=1|A=1):", pooled[3] / marginal)
print(
    "Within low/high P(B=1|A=1):",
    low[3] / (low[2] + low[3]),
    high[3] / (high[2] + high[3]),
)
print("Weighted score for p=.1, positive weight 9:", F(9, 10) / (F(9, 10) + F(9, 10)))
