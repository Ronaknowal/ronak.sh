# Running the lesson files

Use Python 3.12 and keep the supplied files together in one directory. The new constructed examples were executed with Python3.12.14, NumPy2.3.5, SciPy1.18.1, pandas3.0.1 and scikit-learn1.9.1. The requirements pin that tested environment; this is a compatibility record, not a claim that other versions fail. Create a local environment if needed, then install from requirements.txt. Package installation can require network access; the programmes themselves use supplied offline data or constructed arrays.

```text
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python fold_fitted_pipeline.py
.venv\Scripts\python split_information_contracts.py
.venv\Scripts\python nested_procedure_from_indices.py
```

These commands use the Windows environment path. On macOS/Linux use `.venv/bin/python` instead. Alternatively activate the environment and use `python` for install/run commands. No programme needs a model download. `cv_penguins.py` loads `penguins.csv` beside itself. All exact original files remain runnable as supplied, but this content phase reused their historical results rather than running them again. `cv_optuna.py` additionally needs requirements-optuna.txt and imports the guarded helpers in `cv_penguins.py`; its historical Optuna version was5.0.0. The original cv_tiny.py and cv_optuna.py execute at top level, so do not import them to inspect definitions. All new teaching and answer programs guard their mains.

Local helper imports:

- `split_information_contracts.py`, `nested_procedure_from_indices.py`, `bootstrap_the_whole_statistic.py` and `search_results_and_refit.py` import the fully displayed `fold_fitted_pipeline.py`.
- `practice_answers.py` imports the displayed fitted pipeline, information-contract, result/refit, bootstrap and resource helper files. Those imports do not run their guarded mains.
- `cv_optuna.py` imports `cv_penguins.py` exactly as the original source specifies.

The fifteen teaching files explain the model/procedure. `practice_answers.py` is an optional answer asset after attempting the changed tasks; it is not required by any teaching program. `.stdout.txt` and `.stderr.txt` are read-only evidence files, not imports. Three original stdout files are exact decoded displayed strings, omitting process-terminal newline; their complete raw stderr was not retained. Do not infer empty original stderr from that absence. New stdout/stderr files are complete actual process captures; empty new stderr explicitly means no stderr bytes in that run. P09 deliberately captures invalid-candidate fit warnings while its main succeeds; its repair and counts are printed. The first failed answer-program attempt is kept in the author evidence, rather than presented as the successful learner source.

`data-provenance.md` is the exact historical note. Its15241B/LF hash identifies the earlier normalized input, while the supplied current CSV is15586B/CRLF with the same normalized content. The successor setup/file-role manifest distinguishes these identities. Historical source output, the full nested result and calculated-input record have their original roles; none is a new performance experiment or a timing benchmark.

To rerun a teaching file locally, invoke it by filename with Python. For example, `python ordinary_halving_audit.py` runs the new constructed ordinary API example, while `python cv_penguins.py` intentionally reruns the larger original nested study. Reproduction is available to the learner; the latter was not needed or executed during this new authoring phase. Inspect complete source and expected stream before choosing a run.
