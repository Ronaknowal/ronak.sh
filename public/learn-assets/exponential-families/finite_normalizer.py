import math

outcomes, base = [-1, 0, 1], [1, 2, 1]

def family(eta):
    logs = [math.log(weight) + eta * value
            for value, weight in zip(outcomes, base)]
    shift = max(logs)
    weights = [math.exp(value - shift) for value in logs]
    total = sum(weights)
    probabilities = [weight / total for weight in weights]
    mean = sum(p * value for p, value in zip(probabilities, outcomes))
    variance = sum(p * (value - mean) ** 2
                   for p, value in zip(probabilities, outcomes))
    return shift + math.log(total), probabilities, mean, variance

eta, tilt = 0.7, 0.2
partition, probabilities, mean, variance = family(eta)
print('probabilities:', [round(value, 6) for value in probabilities])
print('A, mean, variance:', [round(value, 6) for value in (partition, mean, variance)])
step = 1e-4
derivative = (family(eta + step)[0] - family(eta - step)[0]) / (2 * step)
curvature = (family(eta + step)[0] - 2 * partition + family(eta - step)[0]) / step ** 2
print('finite differences:', round(derivative, 6), round(curvature, 6))
direct = math.log(sum(p * math.exp(tilt * value)
                      for p, value in zip(probabilities, outcomes)))
shifted = family(eta + tilt)[0] - partition
print('log MGF:', round(direct, 6), round(shifted, 6))
print('A at eta=1000:', round(family(1000)[0], 3))