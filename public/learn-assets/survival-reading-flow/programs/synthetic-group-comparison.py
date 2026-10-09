import numpy as np

# Preserve the original lesson's RandomState stream, not merely its seed number.
rng = np.random.RandomState(42)
x = rng.binomial(1, 0.5, 200)
true_beta = -0.7
lifetime = rng.exponential(1 / (0.1 * np.exp(true_beta * x)))
followup = rng.uniform(5, 20, 200)
time = np.minimum(lifetime, followup)
event = lifetime <= followup

from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test

print("subjects / events / censored:", len(time), int(event.sum()), int((~event).sum()))
for group in [0, 1]:
    member = x == group
    fit = KaplanMeierFitter().fit(time[member], event[member])
    print(
        "group",
        group,
        "S(5), S(10):",
        np.round(fit.predict([5, 10]).to_numpy(), 6).tolist(),
    )
test = logrank_test(time[x == 0], time[x == 1], event[x == 0], event[x == 1])
print(
    "log-rank chi-square / asymptotic p:",
    round(test.test_statistic, 6),
    f"{test.p_value:.6g}",
)
print("These are simulated group associations under the stated generator.")