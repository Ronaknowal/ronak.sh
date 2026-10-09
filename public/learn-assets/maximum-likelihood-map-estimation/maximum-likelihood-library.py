"""A checked normal fit to UCI setosa sepal lengths, in centimeters.

Place iris.data beside this script. Data attribution: Fisher, R. (1936).
Iris [Dataset]. UCI Machine Learning Repository. DOI: 10.24432/C56C76.
Dataset license: CC BY 4.0. Official iris.data bytes are unmodified.
This reproducible teaching split does not establish iid sampling validity.
"""
import csv
import hashlib
import math
from pathlib import Path
from scipy import optimize, stats


data_path = Path(__file__).with_name("iris.data")
raw = data_path.read_bytes()
assert hashlib.sha256(raw).hexdigest() == (
    "6f608b71a7317216319b4d27b4d9bc84e6abd734eda7872b71a458569e2656c0"
)
records = [row for row in csv.reader(raw.decode("ascii").splitlines()) if row]
assert len(records) == 150
setosa = [float(row[0]) for row in records if row[4] == "Iris-setosa"]
assert len(setosa) == 50 and all(math.isfinite(x) and x > 0 for x in setosa)

# Original 1-based within-species row numbers 5,10,...,50 are held out.
train_ids = [i for i in range(1, 51) if i % 5]
test_ids = [i for i in range(1, 51) if not i % 5]
assert set(train_ids).isdisjoint(test_ids)
train = [setosa[i - 1] for i in train_ids]
test = [setosa[i - 1] for i in test_ids]
assert len(train) == 40 and len(test) == 10

# Closed-form normal MLE: the denominator is n, not n-1.
n = len(train)
scratch_mu = math.fsum(train) / n
sse = math.fsum((x - scratch_mu) ** 2 for x in train)
scratch_sigma = math.sqrt(sse / n)
assert scratch_sigma > 0
library_mu, library_sigma = stats.norm.fit(train)
assert math.isclose(scratch_mu, library_mu, rel_tol=0, abs_tol=1e-12)
assert math.isclose(scratch_sigma, library_sigma, rel_tol=0, abs_tol=1e-12)


def scratch_logpdf(x, mu, sigma):
    return -math.log(sigma) - math.log(2 * math.pi) / 2 - ((x - mu) / sigma) ** 2 / 2


def negative_log_score(mu):
    # Every evaluation costs O(n); scale is held at the fitted positive scale.
    return -math.fsum(scratch_logpdf(x, mu, scratch_sigma) for x in train)


# This particular objective is strictly convex in mu; not every fit is.
search = optimize.minimize_scalar(
    negative_log_score, bounds=(3.5, 6.5), method="bounded",
    options={"xatol": 1e-10},
)
assert search.success
assert math.isclose(search.x, scratch_mu, rel_tol=0, abs_tol=1e-7)
train_score = math.fsum(scratch_logpdf(x, scratch_mu, scratch_sigma) for x in train)
library_score = float(stats.norm.logpdf(train, loc=library_mu, scale=library_sigma).sum())
assert math.isclose(train_score, library_score, rel_tol=0, abs_tol=1e-10)

# An alternative location is fitted using only training observations.
ordered = sorted(train)
median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2
test_mle = float(stats.norm.logpdf(test, loc=library_mu, scale=library_sigma).mean())
test_median = float(stats.norm.logpdf(test, loc=median, scale=library_sigma).mean())
interval_probability = float(
    stats.norm.cdf(5.5, loc=library_mu, scale=library_sigma)
    - stats.norm.cdf(4.5, loc=library_mu, scale=library_sigma)
)

print("setosa rows, training, held out:", len(setosa), n, len(test))
print(f"scratch mean, standard deviation (cm): {scratch_mu:.6f} {scratch_sigma:.6f}")
print(f"SciPy mean, standard deviation (cm): {library_mu:.6f} {library_sigma:.6f}")
print(f"bounded fixed-scale location, success: {search.x:.6f} {bool(search.success)}")
print(f"training log score, natural-log units: {train_score:.6f}")
print(f"held-out mean log scores, MLE / median: {test_mle:.6f} {test_median:.6f}")
print(f"fitted P(4.5 <= length <= 5.5 cm): {interval_probability:.6f}")
print("closed-form visits / objective rows:", n, n)

