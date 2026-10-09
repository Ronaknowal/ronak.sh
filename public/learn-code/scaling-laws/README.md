# Scaling laws programs

Keep all five Python files and `repetition-curve.csv` together. Install NumPy and
SciPy in a local Python environment. These programs fit numerical curves and
optimize stated cost models; they do not train a language model.

```sh
python -m pip install -r requirements.txt
python scaling_allocation.py
python fit_scaling.py --output fit-local.json
python data_constrained.py
python lifetime_compute.py
python metric_sensitivity.py
```

`scaling_allocation.py` compares the analytic dense-compute optimum with a
transparent golden-section search and SciPy. Its coefficients are constructed.
Parameter and token counts are literal counts, not billions. Hardware quantities
in its planning calculation are declared assumptions, not measured specifications.

`fit_scaling.py` implements damped Gauss-Newton in log parameters with an analytic
Jacobian, and compares predictions with SciPy least_squares. It fits raw-loss
squared residuals, with log parameters bounded to [-12,12]. Three declared starts
test optimizer sensitivity. This is not the Chinchilla paper's Huber/log-loss
L-BFGS reproduction. The released seven-point curve holds parameters and unique
data fixed. First five training-token budgets fit E+A(D/U)^(-beta); the final two
are withheld. A separate, noiseless 36-point synthetic grid checks the
five-parameter mechanism and contrasts full versus fixed-N identifiability.

`data_constrained.py` evaluates the authors' released effective-data and
effective-parameter formula with their coefficients. D must be at least U.
Its fixed-compute search enforces N <= C/(6U), with a declared minimum model size.
This published multivariate model differs from our descriptive seven-point fit.

`lifetime_compute.py` fixes a target loss and external inference-token demand,
then compares training-only and lifetime-compute optima. Infeasible target gaps
are explicit. Its 2NI serving formula is an arithmetic approximation.

`metric_sensitivity.py` computes independent-token p^k, a thresholded metric,
and a finite-test binomial distribution. These are constructed examples, not
measurements of abrupt LLM abilities. The bounded recurrence is used for100
trials and compared with SciPy's binomial probabilities. The source-bound native
verification used Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1; requirements.txt
pins those tested numerical dependencies.

`data-provenance.json` binds the seven actual validation losses to the authors'
Apache-2.0 repository commit and notebook SHA256. The notebook was parsed as
literal dictionaries; none of its code was executed. `fit-results.json` is our
actual local numerical fit output, separately identified from those measurements.
