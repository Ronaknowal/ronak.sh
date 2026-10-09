import math


def log_probabilities(logits):
    if not logits or any(not math.isfinite(x) for x in logits):
        raise ValueError("Use a nonempty list of finite logits.")
    maximum = max(logits)
    shifted = [x - maximum for x in logits]
    log_normalizer = math.log(sum(math.exp(x) for x in shifted))
    return [x - log_normalizer for x in shifted]


for scores in ([2, 0, -2], [1002, 1000, 998], [1000, 0, -1000]):
    logp = log_probabilities(scores)
    print("log probabilities:", [round(x, 6) for x in logp])
    print("last-class loss:", round(-logp[-1], 6))