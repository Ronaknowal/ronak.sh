import math
import random

# The target is known here so we can validate inference independently.
target_mean, target_sd = 1.5, 0.7
mean, log_sd = 0.0, math.log(1.2)
rng = random.Random(7)
first_moment, second_moment = [0.0, 0.0], [0.0, 0.0]

def exact_kl(mean, log_sd):
    sd = math.exp(log_sd)
    return (math.log(target_sd/sd)
            + (sd*sd + (mean-target_mean)**2)/(2*target_sd**2) - 0.5)

for iteration in range(1, 2001):
    sd = math.exp(log_sd)
    gradients = [0.0, 0.0]
    for _ in range(64):
        noise = rng.gauss(0, 1)
        value = mean + sd * noise
        slope = (target_mean - value) / target_sd**2
        gradients[0] += slope / 64
        gradients[1] += (1 + sd * noise * slope) / 64
    # Adam ascent: maximize ELBO, hence the plus sign.
    parameters = [mean, log_sd]
    rate = 0.03 / math.sqrt(1 + iteration / 200)
    for i, gradient in enumerate(gradients):
        first_moment[i] = 0.9*first_moment[i] + 0.1*gradient
        second_moment[i] = 0.999*second_moment[i] + 0.001*gradient**2
        corrected_first = first_moment[i] / (1 - 0.9**iteration)
        corrected_second = second_moment[i] / (1 - 0.999**iteration)
        parameters[i] += rate * corrected_first / (math.sqrt(corrected_second) + 1e-8)
    mean, log_sd = parameters
    assert math.isfinite(mean) and math.isfinite(log_sd)
    if iteration in [100, 500, 2000]:
        print(iteration, round(mean, 4), round(math.exp(log_sd), 4),
              round(exact_kl(mean, log_sd), 6))
print("exact mean and sd", target_mean, target_sd)
