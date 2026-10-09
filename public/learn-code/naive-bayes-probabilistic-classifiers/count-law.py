from fractions import Fraction as F
from math import factorial
from itertools import product


def multinomial_mass(counts, probabilities):
    if any(type(k) is not int or k < 0 for k in counts):
        raise ValueError("Use nonnegative integer counts")
    if len(counts) != len(probabilities) or sum(probabilities) != 1:
        raise ValueError("Use a probability for every category")
    coefficient = factorial(sum(counts))
    for k in counts:
        coefficient //= factorial(k)
    result = F(coefficient)
    for k, probability in zip(counts, probabilities):
        result *= probability**k
    return result


def integrated_mass(counts, shapes):
    if len(counts) != len(shapes) or any(type(a) is not int or a <= 0 for a in shapes):
        raise ValueError("Use matching positive integer Dirichlet shapes")
    if any(type(k) is not int or k < 0 for k in counts):
        raise ValueError("Use nonnegative integer counts")
    numerator = factorial(sum(counts))
    denominator = 1
    for k, a in zip(counts, shapes):
        denominator *= factorial(k)
        for j in range(k):
            numerator *= a + j
    for j in range(sum(counts)):
        denominator *= sum(shapes) + j
    return F(numerator, denominator)


theta = [F(4, 5), F(1, 5)]
print("ordered AB:", theta[0] * theta[1])
print("one A and one B:", multinomial_mass([1, 1], theta))
print(
    "three-token masses:", [str(multinomial_mass([k, 3 - k], theta)) for k in range(4)]
)
print("sum:", sum(multinomial_mass([k, 3 - k], theta) for k in range(4)))
for counts in ([2, 0], [1, 1]):
    print(
        "counts",
        counts,
        "plug-in:",
        multinomial_mass(counts, theta),
        "integrated:",
        integrated_mass(counts, [4, 1]),
    )
plugin = [multinomial_mass([2, 0], p) for p in (theta, theta[::-1])]
integrated = [integrated_mass([2, 0], a) for a in ([4, 1], [1, 4])]
print("equal-prior class0 posterior, plug-in:", plugin[0] / sum(plugin))
print("equal-prior class0 posterior, integrated:", integrated[0] / sum(integrated))
