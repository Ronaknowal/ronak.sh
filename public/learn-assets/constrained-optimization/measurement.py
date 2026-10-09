import math
from statistics import mean

def nearest_rank(values, probability):
    values = sorted(values)
    if not values or not 0 < probability <= 1:
        raise ValueError("Need data and a probability in (0, 1]")
    return values[math.ceil(probability * len(values)) - 1]

latencies = [10] * 90 + [100] * 10
print("Mean ms:", mean(latencies))
print("Nearest-rank p95 ms:", nearest_rank(latencies, 0.95))
for name, groups in [("A", [0.95, 0.55]), ("B", [0.80, 0.68])]:
    print(name, "equal-size mean accuracy", round(mean(groups), 2),
          "worst-group accuracy", min(groups))