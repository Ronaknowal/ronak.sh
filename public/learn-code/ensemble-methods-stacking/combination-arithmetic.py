from fractions import Fraction as F

a = [F(-3), F(-1), F(2), F(2)]
b = [F(1), F(1), F(-1), F(-3)]
mean = lambda values: sum(values) / len(values)
denominator = sum((x - z) ** 2 for x, z in zip(a, b))
weight = sum(z * (z - x) for x, z in zip(a, b)) / denominator
combined = [weight * x + (1 - weight) * z for x, z in zip(a, b)]
average_loss = weight * mean([x * x for x in a]) + (1 - weight) * mean(
    [z * z for z in b]
)
disagreement = mean(
    [
        weight * (x - r) ** 2 + (1 - weight) * (z - r) ** 2
        for x, z, r in zip(a, b, combined)
    ]
)
print("weight A:", weight)
print("combined errors:", [str(value) for value in combined])
print("average member loss:", average_loss)
print("disagreement:", disagreement)
print("combined loss:", mean([value * value for value in combined]))
assert average_loss - disagreement == mean([value * value for value in combined])
# A new case: A is exact, B is wrong by 2. The mean is worse than A.
print("exact A, error-2 B, equal mean error:", F(0, 2) + F(2, 2))
error = F(3, 10)
independent_majority = 3 * error**2 * (1 - error) + error**3
print("three independent 0.3-error ballots:", independent_majority)
print("three copies of one 0.3-error ballot:", error)
