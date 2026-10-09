import math

def log_normal(x, mean=0.0, sd=1.0):
    return -math.log(sd) - 0.5*math.log(2*math.pi) - 0.5*((x-mean)/sd)**2

def log_target(x):
    first, second = log_normal(x, -3), log_normal(x, 3)
    top = max(first, second)
    return top + math.log(math.exp(first-top) + math.exp(second-top)) - math.log(2)

def reverse_kl(mean, sd, intervals=1440):
    # E under q becomes integration against standard-normal noise.
    step = 18 / intervals
    total = 0.0
    for index in range(intervals + 1):
        noise = -9 + index * step
        value = mean + sd * noise
        weight = 1 if index in (0, intervals) else (4 if index % 2 else 2)
        total += weight * math.exp(log_normal(noise)) * (
            log_normal(value, mean, sd) - log_target(value))
    return total * step / 3

for mean, sd in [(0, 3), (3, 1), (-3, 1)]:
    kl = reverse_kl(mean, sd)
    assert abs(kl - reverse_kl(mean, sd, 2880)) < 1e-8
    right = 0.5 * (1 + math.erf(mean / (sd * math.sqrt(2))))
    print(mean, sd, round(kl, 3), round(right, 6))
print("target probability of positive value", 0.5)
