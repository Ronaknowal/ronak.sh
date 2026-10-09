# Run the PCA teaching programs

Use Python 3.12 with NumPy, SciPy and scikit-learn. The new recorded instructional
examples used NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1. These are ordinary
installed numerical primitives: the scratch code assembles and explains the
PCA, range, batch, kernel, posterior or proximal operations around them. Dense
examples use finite real values at moderate representable scales. Their dtype,
rank, tie and zero policies are explained locally; they are not arbitrary-scale
or complex-valued numerical libraries.

Download a complete named source from the common index. These import/data groups
need their siblings in the same directory:

- `pca_two_columns.py` with the complete `matrix_decomposition_scratch.py`.
- `pca_metrics.py` with `centered_pca.py`.
- `pca_representation_choices.py` with `centered_pca.py`.
- `saved_pca_queries.py` with `pca_saved_state.json` and `wine.csv`.
- `saved_pca_correlations.py` and `saved_pca_outcomes.py` each also need `saved_pca_queries.py`, that JSON and CSV.
- `pca_whitening.py` with `centered_pca.py`.
- `pca_applications.py` with `pca_saved_state.json`.

The other new main files have no local Python-file dependency. Running a new
constructed example is as simple as `python centered_pca.py` or
`python kernel_pca.py` from its download directory. Imported local dependencies
have guarded demonstration mains; importing their reusable operations does not
run another example.

For the recorded Wine/Gaussian evidence, use this complete offline entry:

```sh
python saved_pca_queries.py
```

It reads the supplied state/CSV, checks their measurement/category correspondence,
prints the full-collection default and changed query, separately traces the
133-row training branch, scans the saved validation budget. `python saved_pca_correlations.py` reports the
section7 feature/score normalization; `python saved_pca_outcomes.py` reports the
section10.4 sample fraction and earlier predictive outcomes after their teaching. It fits no estimator and draws no new
sample. Its thirteen input coordinates use the CSV's fixed feature order; the
CSV category column is not a PCA feature. `pca_saved_state.json` uses the exact
retained numerical arrays, with the separately declared mathematical-zero
post-standardization PCA-mean convention. The original Gaussian raw sample was
not retained and is not required by this route.

The eight original files and stdout remain historical complete recipes. Three
are continuations rather than independent mains: `library.py` and `eigen.py`
require the four-row `svd.py` namespace; `originalUnits.py` requires the Wine
`budget.py` namespace. For the four-row continuations only, a full recipe is:

```python
from pathlib import Path

namespace = {}
for filename in ("svd.py", "library.py", "eigen.py"):
    exec(Path(filename).read_text(encoding="utf-8"), namespace)
```

This namespace recipe runs the four constructed records. The saved-state route
above inspects the published Wine/Gaussian reference results without fitting.
Independent practice also asks for genuinely new calculations and fits. Run them
in a separate experiment directory and label their outputs as your results; keep
the downloaded reference sources and published outputs intact. The original
ordinary programs below are complete runnable recipes, not required inputs to
the saved-state readers.

## Carry out the independent experiments

For Original4 and the compression mini-project, copy `budget.py` into your
experiment directory and change only its final comparison from `ratio <= 0.10`
to `ratio <= 0.06` for the first run. Run `python budget.py`. Its installed
`load_wine()` supplies the same178×13 measurements without a network download.
It creates the stratified seed42 133/45 train/validation split, fits mean/scale
and full PCA on training rows only, and decodes validation rows with that state.
The mean-return baseline and candidate counts0..13 use that same standardized
metric. Declare .06 before inspecting the curve; print all14 ratios and the last
failing/first passing count. For observation-level original-unit inspection, run
your copied `budget.py` then a copy of `originalUnits.py` in the same namespace.
Set the latter's `k` to your newly selected count (10 for the reference .06 budget),
rather than leaving its reference count8 unchanged. For example, after those edits:

```python
from pathlib import Path

namespace = {}
for filename in ("budget.py", "originalUnits.py"):
    exec(Path(filename).read_text(encoding="utf-8"), namespace)
position = 0
row = namespace["validation"][position]
print("row", row)
print("original", namespace["wine"].data[row])
print("decoded", namespace["original_units"][position])
```

This derives your new validation reconstruction, including raw feature residuals;
row35 belongs to the seed42 reference split and can change with a new seed. To study split sensitivity, declare seed43 before a separate fit;
keep budget, metric, baseline and allcounts fixed. Neither selection curve is an
untouched final test. Record versions and the split's row indices with each run.

For Original8, copy `gaussian.py`; run it with seed23, then change the generator
seed to24 and run again. Keep40 observations,20 independent standard-normal
features, full-SVD PCA and the first-two fraction fixed. To inspect the full
spectrum, print `pca.explained_variance_ratio_`. Each new sample fits its own
basis, while the population fixed-two-coordinate comparison stays2/20=.10.
Record both seeds and spectra. Use multiple declared draws or appropriate null
evidence before assigning a scientific factor meaning; two draws alone are not
a calibrated stability test. Your outputs need not reproduce published decimals
across numerical versions and do not replace the recorded seed23 reference.

For the prediction mini-project, copy section8's `pipeline.py`; first run its
matched no-PCA/k2/k8 routes on all five seed42 stratified folds. Then declare one
additional comparison before observing results, for example logistic `C=.5`.
Change `LogisticRegression(max_iter=2000)` to
`LogisticRegression(C=.5, max_iter=2000)` in your new experiment copy and rerun
allthree settings on the same folds and accuracy metric. Report every fold and
mean for both configurations, not only a winner. Every scaler/PCA/classifier is
fitted inside its training fold. These are development comparisons; a final
predictive claim needs a separately reserved test evaluated only after choices
are locked. Log versions, candidate settings, failures and your conclusion.

For a new descriptive visualization, run a copy of `wineScaling.py` with the
declared raw or standardized full-collection metric. Use `scores[:, :2]` for
coordinates and `cultivar` only for external plotting marks. It describes the
provided collection, not unseen classifier performance. A changed component
pair or metric is useful only if you explain what squared variation it retains.

These recipes allow new learner work while the offline saved-state path remains
a convenient reproducible inspection of the reference evidence.

`pca_structured_variants.py` includes a complete NumPy PCP loop and an optional
CVXPY comparison. Without CVXPY, the scratch route still runs and the optional
branch reports `optional_package_unavailable`. The retained tiny comparison used
an available convex solver and records its actual status/objective. Different
solver versions can give slightly different new finite-tolerance outputs; the
recorded output remains the output of its actual execution.

The common index also supplies the complete recorded stdout files, including explicitly selected reference excerpts for the three new stage-specific readers. These identify
the exact historical or new execution, rather than promising identical decimal
roundoff on every environment. Complete source text is visible in the lesson;
Copy/Download supplies the same named full file, with its local import/data group
listed here. Browser feedback and actual shipping bytes are later implementation
checks.
