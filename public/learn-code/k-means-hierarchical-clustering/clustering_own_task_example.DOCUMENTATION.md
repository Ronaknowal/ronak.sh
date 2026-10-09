# Portable constructed clustering input

This CSV supplies thirty constructed points, not observations from a population. Its columns are `row_id,split,x,y`. Each ID is unique; the split-role cells are fixed before fitting. Neither the ID nor the split is a feature. There is no supplied class label.

Use the three bases (−4,0), (0,4), (4,0), in that order. For each base, the six training offsets are (−.6,0),(−.4,.2),(−.2,−.2),(.2,.2),(.4,−.2),(.6,0). The two validation offsets are (−.3,.1),(.3,−.1), and the two test offsets are (−.1,−.1),(.1,.1). File order is eighteen training points, six validation points, then six test points. IDs are `row-00` through `row-29` in that order.

Run in a virtual environment with the complete `clustering_core.py`, `clustering_own_task.py` and supplied CSV in one directory:

```sh
python -m pip install -r clustering_requirements.txt
python clustering_own_task.py clustering_own_task_example.csv --features x y --features-known-before-outcome --k 2 3 4 --output my_clustering_result.json
```

The requirements specify the tested dependency snapshot. The three candidates use training-only StandardScaler, random_state 7, n_init 10, Lloyd, max_iter 300 and tol 1e−4. Eligibility requires all k training groups to contain at least two rows, and at least two but fewer than six distinct validation labels. The highest eligible validation silhouette wins; an exact tie chooses smaller k. Distortion and counts are reported alongside silhouette. No eligible candidate stops before test scoring.

The selected original training-fitted pipeline scores the six test points once. It reports mean assigned squared distance in standardized geometry, a training-centroid baseline in the same geometry, group counts and training centers in original units. It does not refit on training plus validation.

When replacing the input, declare row roles and candidate/eligibility rules before reading final test results. Use `--exclude target_column` to forbid a known output column. The availability flag is your declaration that each feature exists at the intended decision time; schema validation cannot determine that from a column name. Reusing test evidence to choose another representation or k creates a new selection process and requires fresh final evidence. The program rejects duplicate IDs, unknown split roles, missing columns and nonfinite/nonnumeric features. Choose a fresh output path; `--overwrite` deliberately replaces an existing result.
