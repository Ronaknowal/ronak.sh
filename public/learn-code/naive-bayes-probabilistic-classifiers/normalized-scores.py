import math
from fractions import Fraction as F


def log_probabilities(scores):
    if not scores or any(math.isnan(s) or s == math.inf for s in scores):
        raise ValueError("Use finite scores or negative infinity")
    maximum = max(scores)
    if maximum == -math.inf:
        raise ValueError("Every class assigns zero likelihood: posterior undefined")
    shifted = [s - maximum for s in scores]
    if any(s != -math.inf and not math.isfinite(s - maximum) for s in scores):
        raise ValueError("Score difference exceeds arithmetic range")
    correction = math.log(math.fsum(math.exp(s) for s in shifted))
    return [s - correction for s in shifted]


joint = [F(1, 3) * F(1, 7), F(2, 3) * F(4, 11)]
print("free-token posterior [ham, spam]:", [str(p / sum(joint)) for p in joint])
scores = [-1001.0, -1000.0]
print("direct exponentials:", [math.exp(s) for s in scores])
print("normalized:", [round(math.exp(p), 6) for p in log_probabilities(scores)])
print(
    "one possible class:", [math.exp(p) for p in log_probabilities([-math.inf, -3.0])]
)
try:
    log_probabilities([-math.inf, -math.inf])
except ValueError as error:
    print("zero-evidence response:", error)
