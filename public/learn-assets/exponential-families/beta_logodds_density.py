import math

alpha, beta = 2, 3
normalizer = math.factorial(alpha + beta - 1) / (
    math.factorial(alpha - 1) * math.factorial(beta - 1))

def softplus(value):
    return max(value, 0) + math.log1p(math.exp(-abs(value)))

for probability in (0.2, 0.5, 0.8):
    eta = math.log(probability / (1 - probability))
    density_p = normalizer * probability ** (alpha - 1) * (1 - probability) ** (beta - 1)
    density_eta = density_p * probability * (1 - probability)
    canonical = normalizer * math.exp(alpha * eta - (alpha + beta) * softplus(eta))
    print(f'p={probability:.1f}: density_p={density_p:.6f}, '
          f'density_eta={density_eta:.6f}, equal={abs(density_eta - canonical) < 1e-12}')