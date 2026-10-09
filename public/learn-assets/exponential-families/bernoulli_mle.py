import math

observations = [1, 0, 1, 1, 0, 1, 1, 1]
successes, n = sum(observations), len(observations)
p_mle = successes / n
eta = math.log(p_mle / (1 - p_mle))
log_partition = math.log1p(math.exp(eta))

print(successes, n, p_mle)
print(round(eta, 3), round(log_partition, 3))
print(round(n / (1 + math.exp(-eta)), 3))