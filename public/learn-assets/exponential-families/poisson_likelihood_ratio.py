import math

first, second = [0, 3, 1], [2, 1, 1]

def log_likelihood(data, rate):
    return sum(value * math.log(rate) - rate - math.lgamma(value + 1)
               for value in data)

print('n and totals:', len(first), sum(first), sum(second))
for rate in (0.5, 2.0, 7.0):
    log_ratio = log_likelihood(first, rate) - log_likelihood(second, rate)
    print(f'rate {rate:.1f}: likelihood ratio {math.exp(log_ratio):.6f}')