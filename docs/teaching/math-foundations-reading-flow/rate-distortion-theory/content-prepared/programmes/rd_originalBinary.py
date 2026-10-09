import math

def binary_entropy(d):
    if d in (0, 1):
        return 0.0
    return -(d * math.log2(d) + (1 - d) * math.log2(1 - d))

for distortion in (0.0, 0.10, 0.25, 0.50):
    rate = max(0.0, 1 - binary_entropy(distortion))
    print(distortion, round(rate, 3))