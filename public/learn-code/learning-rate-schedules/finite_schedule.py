import math

def warmup_cosine(update, total, warmup, peak, minimum):
    if not (isinstance(total, int) and total >= 2
            and isinstance(warmup, int) and 0 <= warmup < total
            and isinstance(update, int) and 0 <= update < total
            and math.isfinite(peak) and math.isfinite(minimum)
            and 0 <= minimum <= peak):
        raise ValueError("invalid finite schedule")
    if warmup and update < warmup:
        return peak * (update + 1) / warmup
    progress = ((update - warmup + 1) / (total - warmup)
                if warmup else update / (total - 1))
    return minimum + (peak - minimum) * (1 + math.cos(math.pi * progress)) / 2

def previous_convention(update, total, warmup, peak, minimum):
    if update < warmup:
        return peak * (update + 1) / warmup
    progress = (update - warmup) / (total - warmup)
    return minimum + (peak - minimum) * (1 + math.cos(math.pi * progress)) / 2

for label, function in (("previous", previous_convention), ("declared endpoints", warmup_cosine)):
    values = [function(u, 10, 2, .001, .00001) for u in range(10)]
    print(label, [f"{value:.6f}" for value in values])
assert warmup_cosine(1, 10, 2, .001, .00001) == .001
assert warmup_cosine(9, 10, 2, .001, .00001) == .00001
print("zero warmup", [round(warmup_cosine(u, 3, 0, .2, .01), 6) for u in range(3)])
try:
    warmup_cosine(10, 10, 2, .001, .00001)
except ValueError:
    print("completed budget: rejected")