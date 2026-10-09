"""Independent native checks and source-bound fixtures; no language-model training."""
import csv
import hashlib
import importlib
import json
import math
import os
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import scipy
from scipy.stats import binom

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/learn-code/scaling-laws"
DOCS = ROOT / "docs/teaching/llm-architecture-training/scaling-laws-kaplan-chinchilla-beyond"
sys.dont_write_bytecode = True
sys.path.insert(0, str(PUBLIC))
allocation = importlib.import_module("scaling_allocation")
fitting = importlib.import_module("fit_scaling")
repetition = importlib.import_module("data_constrained")
lifetime = importlib.import_module("lifetime_compute")
metric = importlib.import_module("metric_sensitivity")
checks = 0


def close(actual, expected, rtol=1e-7, atol=1e-10):
    global checks
    np.testing.assert_allclose(actual, expected, rtol=rtol, atol=atol)
    checks += 1


def invalid(function, *args):
    global checks
    try:
        function(*args)
    except ValueError:
        checks += 1
    else:
        raise AssertionError(f"Expected ValueError from {function.__name__}{args}")


def main():
    global checks
    programs = ["scaling_allocation.py", "fit_scaling.py", "data_constrained.py", "lifetime_compute.py", "metric_sensitivity.py"]
    results = {}
    for program in programs:
        args = [sys.executable, "-B", str(PUBLIC / program)]
        if program == "fit_scaling.py":
            args += ["--output", str(PUBLIC / "fit-results.json")]
        executed = subprocess.run(args, cwd=PUBLIC, capture_output=True, text=True, env=dict(os.environ, OPENBLAS_NUM_THREADS="1", OMP_NUM_THREADS="1"))
        if executed.returncode:
            raise RuntimeError(f"{program} failed:\n{executed.stderr}\n{executed.stdout}")
        assert not executed.stderr, executed.stderr
        results[program] = json.loads(executed.stdout)
        checks += 1

    # Independent finite differences verify logarithmic Jacobian columns for both models.
    for parameters, data in [([2, 1, .5], np.array([[1], [2], [7.5]], dtype=float)),
                             ([1, 2, 3, .5, .25], np.array([[1, 1], [2, 4], [8, 16]], dtype=float))]:
        theta = np.log(parameters)
        jacobian = fitting.predict_and_jacobian(theta, data)[1]
        for column in range(len(theta)):
            direction = np.eye(len(theta))[column] * 1e-6
            difference = (fitting.predict_and_jacobian(theta + direction, data)[0] - fitting.predict_and_jacobian(theta - direction, data)[0]) / 2e-6
            close(jacobian[:, column], difference, atol=1e-8)

    for compute in [6e16, 6e18, 1.2e19]:
        for alpha, beta in [(.5, .5), (.5, .25), (.3, .6)]:
            law = dict(allocation.TOY, alpha=alpha, beta=beta)
            n, d = allocation.analytic_allocation(compute, law)
            close(6 * n * d, compute)
            p, q = law["A"] * n ** -alpha, law["B"] * d ** -beta
            close(alpha * p, beta * q)
            middle = allocation.loss(n, d, law)
            assert middle < allocation.loss(n / 1.1, d * 1.1, law)
            assert middle < allocation.loss(n * 1.1, d / 1.1, law)
            checks += 2
    close(allocation.budget_hours(6e18, 8, 1e14, .4), 18750 / 3600)
    close(allocation.budget_hours(0, 8, 1e14, .4), 0)
    invalid(allocation.budget_hours, 1, 8, 1e14, 0)
    invalid(allocation.analytic_allocation, 0)
    fixed = np.array([(1, d) for d in [1, 2, 4, 8, 16, 32]], dtype=float)
    first = fitting.predict_and_jacobian(np.log([1, 2, 3, .5, .25]), fixed)[0]
    other = fitting.predict_and_jacobian(np.log([2, 1, 3, 7, .25]), fixed)[0]
    close(first, other)

    with (PUBLIC / "repetition-curve.csv").open(newline="", encoding="utf-8") as stream:
        data = list(csv.DictReader(stream))
    assert len(data) == 7 and [row["role"] for row in data] == ["fit"] * 5 + ["heldout"] * 2
    close([float(row["validation_nats"]) for row in data], [3.265024, 2.995093, 2.884387, 2.823208, 2.752407, 2.722962, 2.706547])
    assert all(float(row["parameters"]) == 2.81e9 and float(row["unique_tokens"]) == 4e9 for row in data)
    checks += 2
    provenance = json.loads((PUBLIC / "data-provenance.json").read_text())
    assert hashlib.sha256((PUBLIC / "repetition-curve.csv").read_bytes()).hexdigest() == provenance["csv_sha256"]
    notebook = ROOT / "scratch/scaling-laws/contours-pinned.ipynb"
    if notebook.exists():
        assert hashlib.sha256(notebook.read_bytes()).hexdigest() == provenance["source_sha256"]
        checks += 1
    real = results["fit_scaling.py"]["real_curve"]
    residuals = [row["residual"] for row in real["observations"]]
    close(real["fit_sse"], sum(value * value for value in residuals[:5]))
    close(real["heldout_mae"], sum(abs(value) for value in residuals[5:]) / 2)

    for passes in [1, 2, 4, 10, 100, 10000]:
        effective = repetition.effective_amount(4, 4 * passes, repetition.DATA_REUSE)
        assert 4 <= effective <= min(4 * passes, 4 * (1 + repetition.DATA_REUSE))
        checks += 1
    close(repetition.effective_amount(4, 4, repetition.DATA_REUSE), 4)
    close(repetition.effective_amount(4, 4e9, repetition.DATA_REUSE), 4 * (1 + repetition.DATA_REUSE))
    invalid(repetition.effective_amount, 4, 3, 15)
    invalid(repetition.constrained_loss, 1e9, 3e9, 4e9)
    invalid(repetition.allocate, 1e6, 4e9)
    unique, compute = 25e9, 6 * 6.34e9 * 242e9
    optimum = results["data_constrained.py"]["fixed_unique_allocation"]
    # A broad independent grid catches a different basin in the declared example.
    candidate_losses = [repetition.constrained_loss(n, compute / (6 * n), unique)["loss"] for n in np.geomspace(1e6, compute / (6 * unique) * (1 - 1e-12), 1001)]
    assert optimum["loss"] <= min(candidate_losses) + 1e-9
    checks += 1
    close(results["data_constrained.py"]["published_examples"][1]["loss"], 2.226963408)

    invalid(lifetime.tokens_for_loss, 1e8, 2)
    invalid(lifetime.choose_model, 1, 0)
    invalid(lifetime.choose_model, 2, -1)
    for solution in results["lifetime_compute.py"]["results"]:
        close(allocation.loss(solution["parameters"], solution["training_tokens"]), 2)
        close(solution["lifetime_flops"], solution["training_flops"] + solution["inference_flops"])
    close(results["lifetime_compute.py"]["results"][0]["parameters"], 4e8)

    for size in [0, 1, 10, 100]:
        for probability in [0, .00001, .01024, .32768, .5, .99, 1]:
            masses = metric.binomial_probabilities(size, probability)
            close(masses, binom.pmf(np.arange(size + 1), size, probability), atol=1e-12)
            close(sum(masses), 1, atol=1e-12)
    invalid(metric.binomial_probabilities, 101, .5)
    invalid(metric.metrics, 1.1, 2)
    invalid(metric.metrics, .8, 0)
    close(metric.metrics(.8, 3)["exact_match_probability"], .512)
    close(metric.metrics(.4, 5)["chance_of_zero_exact_matches"], .3572644737871268)
    files = [PUBLIC / program for program in programs] + [PUBLIC / name for name in ["repetition-curve.csv", "data-provenance.json", "fit-results.json"]]
    report = {"at": datetime.now(timezone.utc).isoformat(), "python": platform.python_version(), "numpy": np.__version__, "scipy": scipy.__version__, "checks": checks,
              "sources": {str(file.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(file.read_bytes()).hexdigest() for file in files}, "results": results}
    (DOCS / "native-results.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks": checks, "versions": [platform.python_version(), np.__version__, scipy.__version__], "report": str(DOCS / "native-results.json")}, indent=2))


if __name__ == "__main__":
    main()
