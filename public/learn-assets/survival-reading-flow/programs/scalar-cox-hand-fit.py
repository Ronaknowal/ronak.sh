import numpy as np

# Preserve the original lesson's RandomState stream, not merely its seed number.
rng = np.random.RandomState(42)
x = rng.binomial(1, 0.5, 200)
true_beta = -0.7
lifetime = rng.exponential(1 / (0.1 * np.exp(true_beta * x)))
followup = rng.uniform(5, 20, 200)
time = np.minimum(lifetime, followup)
event = lifetime <= followup

from scipy.special import logsumexp


def cox_terms(beta, time, event, x, ties="efron"):
    log_likelihood = score = information = 0.0
    for at in np.unique(time[event]):
        risk = time >= at
        failed = (time == at) & event
        count = int(failed.sum())
        shift = np.max(beta * x[risk])
        weight = np.exp(beta * x - shift)
        risk_moments = [np.sum(weight[risk] * x[risk] ** power) for power in range(3)]
        event_moments = [
            np.sum(weight[failed] * x[failed] ** power) for power in range(3)
        ]
        log_likelihood += beta * x[failed].sum()
        score += x[failed].sum()
        for step in range(count):
            fraction = step / count if ties == "efron" else 0
            total, first, second = [
                r - fraction * e for r, e in zip(risk_moments, event_moments)
            ]
            mean = first / total
            log_likelihood -= shift + np.log(total)
            score -= mean
            information += second / total - mean**2
    return np.array([log_likelihood, score, information])


def fit_cox(time, event, x, max_steps=50, tolerance=1e-8):
    beta = 0.0
    for iteration in range(max_steps):
        objective, score, information = cox_terms(beta, time, event, x)
        if abs(score) <= tolerance:
            return beta, iteration, "score tolerance reached"
        if information <= 1e-12:
            return beta, iteration, "insufficient curvature; finite fit not certified"
        direction = np.clip(score / information, -2, 2)
        step = 1.0
        while step > 2**-30:
            trial = beta + step * direction
            if (
                cox_terms(trial, time, event, x)[0]
                >= objective + 1e-4 * step * score * direction
            ):
                beta = trial
                break
            step /= 2
        else:
            return beta, iteration, "line search exhausted"
    return beta, max_steps, "iteration budget exhausted"


from sksurv.linear_model import CoxPHSurvivalAnalysis
from sksurv.util import Surv

beta, steps, status = fit_cox(time, event, x)
library = CoxPHSurvivalAnalysis(ties="efron").fit(
    x[:, None], Surv.from_arrays(event, time)
)
print("beta / HR:", round(beta, 6), round(np.exp(beta), 6))
print("iterations / status:", steps, status)
print(
    "log likelihood / score / information:",
    np.round(cox_terms(beta, time, event, x), 8).tolist(),
)
print("library beta:", round(library.coef_[0], 6))
flat = cox_terms(0, time, event, np.zeros(len(x)))
print("constant-feature information:", flat[2])
print(
    "A finite score tolerance alone does not rule out separation; inspect information and coefficient growth."
)