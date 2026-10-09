"""A constructed metric transformation, not measurements of LLM emergence.
Run: python metric_sensitivity.py
Requires SciPy for the independent binomial comparison.
"""
import json
import math
from scipy.stats import binom


def binomial_probabilities(trials, probability):
    if not isinstance(trials, int) or trials < 0 or not 0 <= probability <= 1:
        raise ValueError("Nonnegative integer trials and probability in [0,1] required")
    if trials > 100:
        raise ValueError("This transparent recurrence supports at most 100 trials")
    if probability in (0, 1):
        return [float(successes == trials * probability) for successes in range(trials + 1)]
    # Start from the more probable endpoint, then reverse when p > 1/2.
    # For these bounded teaching cases (<=100 trials), the start is >=2^-100.
    reflected = probability > .5
    p = 1 - probability if reflected else probability
    values = [(1 - p) ** trials]
    for successes in range(trials):
        values.append(values[-1] * (trials - successes) / (successes + 1) * p / (1 - p))
    return values[::-1] if reflected else values


def metrics(probability, sequence_length, test_size=100, threshold=.5):
    if not isinstance(sequence_length, int) or sequence_length < 1 or not isinstance(test_size, int) or not 1 <= test_size <= 100 or not 0 <= threshold <= 1 or not 0 <= probability <= 1:
        raise ValueError("Positive sequence length, integer test size 1..100 and probability/threshold in [0,1] required")
    exact_match = probability ** sequence_length
    masses = binomial_probabilities(test_size, exact_match)
    ordinary = binom.pmf(list(range(test_size + 1)), test_size, exact_match)
    assert all(math.isclose(x, y, abs_tol=1e-12) for x, y in zip(masses, ordinary))
    assert math.isclose(sum(masses), 1, abs_tol=1e-12)
    return {"per_token_probability": probability, "length": sequence_length,
            "exact_match_probability": exact_match, "thresholded_population_score": int(exact_match >= threshold),
            "test_size": test_size, "chance_of_zero_exact_matches": masses[0],
            "measurement_increment": 1 / test_size}


if __name__ == "__main__":
    print(json.dumps({"assumption": "Constructed independent tokens of equal correctness probability",
                     "rows": [metrics(p, length) for p in [.4, .6, .8, .9] for length in [1, 5]],
                     "changed_length_example": metrics(.8, 3)}, indent=2))
