import math
import numpy as np

data_rng = np.random.default_rng(31)
train_x = np.linspace(-1, 1, 40)
train_y = .7 + 1.5 * train_x + data_rng.normal(0, .3, len(train_x))
validation_x = np.linspace(-.95, .95, 30)
validation_y = .7 + 1.5 * validation_x + data_rng.normal(0, .3, len(validation_x))
X = np.column_stack((np.ones(len(train_x)), train_x))
V = np.column_stack((np.ones(len(validation_x)), validation_x))
updates, peak, minimum = 120, .2, .01

def rate_for(policy, update):
    if policy == "constant":
        return peak
    if policy == "linear":
        return peak + (minimum - peak) * update / (updates - 1)
    warmup = 12
    if update < warmup:
        return peak * (update + 1) / warmup
    progress = (update - warmup + 1) / (updates - warmup)
    return minimum + (peak - minimum) * (1 + math.cos(math.pi * progress)) / 2

for policy in ("constant", "linear", "warmup-cosine"):
    validation_errors = []
    for seed in (2, 7, 19):
        # Reset initialization and the complete sample stream for each policy.
        sample_stream = np.random.default_rng(seed).integers(len(X), size=updates)
        weight = np.zeros(2)
        for update, sample in enumerate(sample_stream):
            prediction_error = X[sample] @ weight - train_y[sample]
            gradient = prediction_error * X[sample]  # half-squared training loss
            weight -= rate_for(policy, update) * gradient
        validation_errors.append(float(np.mean((V @ weight - validation_y)**2)))
    print(policy, "validation MSE", [round(value, 6) for value in validation_errors],
          "mean", round(float(np.mean(validation_errors)), 6))
