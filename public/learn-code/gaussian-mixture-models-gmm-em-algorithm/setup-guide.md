# Run the Gaussian-mixture examples

Download the complete source files and their siblings from the common file index into one directory. These examples use Python 3.12 or later. A virtual environment keeps the numerical-library versions separate from other projects:

```shell
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1
```

The displayed outputs are saved reference runs from Python 3.12.14 and those three versions. They provide concrete results to interpret; a fresh execution has its own outputs rather than replacing the saved experiment. Floating-point last digits and randomized draws can differ across platforms; array roles, units and the declared tolerances govern comparisons. The new demonstration mains are guarded by `if __name__ == '__main__'`, so importing a helper does not fit a model.

The file index lists every dependency. `gaussian_log_density.py` supplies the Cholesky object; `gaussian_mixture.py` imports it and supplies stable mixture inference. `fractional_gaussian_update.py` supplies fractional statistics. The general EM, conditioning and finite variational files reuse those complete siblings rather than unexplained fragments. For example:

```shell
python gaussian_scalar.py
python gaussian_em.py
python ordinary_gaussian_em.py
python conditional_gaussian_mixture.py
python finite_variational_gmm.py
python ordinary_variational_gmm.py
```

The Gaussian/variational ordinary demonstrations fit only their small constructed six-row data. Their source declares seeds, priors, initialization and budgets. The matched one-cycle ordinary Gaussian demonstration deliberately reaches its budget before convergence and prints the warning count; compare final-state likelihood with final-state likelihood.

For the portable saved-data reader, also download `gmm_saved_iris.json` beside its Python file:

```shell
python saved_iris_mixture.py --report
python saved_iris_mixture.py --query 5.5 4.2
```

`--report` reads the original saved sixteen-candidate results. `--query` evaluates a separate unlabelled coordinate pair in centimetres through the saved training transform and selected full-precision state. Reporting is not fitting. The JSON's historical CSV hash describes the scientific recorder's decoded CSV bytes. The downloadable physical `iris.csv` retains its original CRLF serialization; its separate physical hash is in the file index. They describe the same measurements, not interchangeable byte identities. The downloadable `data-provenance.md` carries both identities and the current recipe/report commands. Historical `author-calculations.py` and `checked-results.json` belong to workspace evidence and protected historical snapshots; they are not supplied commands/files in this standalone index. Use the complete `iris_density.py` plus CSV for a fresh ordinary reproduction, or `saved_iris_mixture.py --report` plus its catalogued siblings and `gmm_saved_iris.json` to inspect the saved results without fitting.

The original `em_1d.py` is a complete standalone scalar demonstration. `iris_density.py` is the complete original real-data training, validation and reserved-test recipe; download `iris.csv` and `data-provenance.md` with it. Executing that recipe creates a fresh reproduction, not the saved report already shown. Keep its default training-owned transform and declared split/selection rule when interpreting its output.

The original `bayesian_weights.py` is a continuation: it expects `np`, `Z` and `train` created by `iris_density.py`. Run both exact sources in one namespace from their directory:

```python
from pathlib import Path

namespace = {"__name__": "__main__"}
for filename in ("iris_density.py", "bayesian_weights.py"):
    source = Path(filename).read_text(encoding="utf-8")
    exec(compile(source, filename, "exec"), namespace)
```

This intentionally executes the original training recipe and then its Bayesian continuation. The old displayed streams are retained historical executions, so a fresh reproduction has its own outputs. For parameter uncertainty with fully retained factor states and a small example, use `finite_variational_gmm.py` and `ordinary_variational_gmm.py` instead.

The mini-project's complete worked route is `gmm_mini_project.py`. It declares its own constructed train/validation/reserved-shift sets and two candidates, distinct from Iris. The reserved shift is an intentional stress test rather than an exchangeable generalization estimate. Changing that recipe creates a different project and calls for a new selection rule before inspecting its reserved outcome.
