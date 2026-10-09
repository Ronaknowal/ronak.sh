from itertools import combinations
from statistics import mean

data = [1.0, 2.0, 4.0, 5.0]
q_mean, q_sd = 1.0, 0.5
size, batch_size = len(data), 2
# Prior N(0,1), observations independent N(theta,1).
full_mean_gradient = sum(x - q_mean for x in data) - q_mean
full_log_sd_gradient = 1 - q_sd**2 * (1 + size)
estimates, wrong_estimates = [], []
for indices in combinations(range(size), batch_size):
    likelihood_gradient = sum(data[i] - q_mean for i in indices)
    estimates.append(size/batch_size * likelihood_gradient - q_mean)
    # Wrong: the prior is counted too many times as well.
    wrong_estimates.append(size/batch_size * (likelihood_gradient - q_mean))
print("all batch mean-gradients", estimates)
print("full and mean batch", full_mean_gradient, mean(estimates))
print("wrong mean batch", mean(wrong_estimates))
print("full log-sd gradient", full_log_sd_gradient)
print("exact posterior mean and variance", sum(data)/(1+size), 1/(1+size))
