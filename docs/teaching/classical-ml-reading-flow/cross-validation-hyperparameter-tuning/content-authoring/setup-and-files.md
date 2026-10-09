# Setup and complete file index

Keep the supplied files together. [README](programmes/README.md) gives Windows and macOS/Linux environment commands and complete local imports. New examples were actually executed with Python3.12.14, NumPy2.3.5, SciPy1.18.1, pandas3.0.1 and scikit-learn1.9.1. Install from requirements.txt in a local environment; packages may require network access, but programmes use offline data or constructed arrays. The original Optuna route additionally uses requirements-optuna.txt; its historical execution used Optuna5.0.0, without a new installation or run in this authoring phase.

Fifteen whole teaching sources and one optional answer source are displayed with their full outputs in the manuscript. New sources guard their mains. Exact original cv_tiny.py and cv_optuna.py execute at top level; importing the latter runs the historical study. Its cv_penguins.py dependency is guarded. Local helper dependencies are explicit in the index. There is one file entry per payload, regardless of how many programs import it.

Original stdout files are exact decoded displayed strings, with no terminal process newline. They are historical observations; full raw stderr and the Optuna trial history were not retained, so no empty old stderr file is invented. New stdout/stderr are complete raw process bytes. Empty new stderr is a captured zero-byte stream. P09 intentionally has full candidate-fit warning diagnostics while the whole program exits0; its repair is also printed. Author evidence preserves earlier attempts, including the answer source's first list/array AttributeError, separately from current successful learner files.

The supplied current CSV has15586B/CRLF, SHA25679995be0ba7a6df1e9309e399a23438c0854f959d29950885dafb94ab881be68. Normalizing CRLF to LF gives15241B and SHA256f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93, exactly the historical identity stated in the unchanged data-provenance.md. All344 source records remain in order. This is an explicit raw-versus-normalized role, not a claim of byte identity across line endings. The nested/calculated JSON records remain exact old evidence, without repeating their fits.

## Files

The52 payloads below plus [source-role-manifest.json](programmes/source-role-manifest.json), the53rd metadata file, form the complete learner catalogue. Source/stream names are canonical download names. The manifest records exact byte identities, local dependencies and successful current execution receipts; it is not an additional teaching program. Runtime Copy/Download must use these exact bodies/names and visibly report copied/error states after implementation.

| File | Role / placement | Bytes |
| --- | --- | ---: |
| [cv_tiny.py](programmes/cv_tiny.py) | whole teaching source; P01 §2 | 988 |
| [cv_tiny.py.stdout.txt](programmes/cv_tiny.py.stdout.txt) | exact retained displayed stdout string; terminal process newline omitted; historical execution; P01 §2 | 106 |
| [cv_penguins.py](programmes/cv_penguins.py) | whole teaching source; P02 §6 | 3279 |
| [cv_penguins.py.stdout.txt](programmes/cv_penguins.py.stdout.txt) | exact retained displayed stdout string; terminal process newline omitted; historical execution; P02 §6 | 291 |
| [cv_optuna.py](programmes/cv_optuna.py) | whole teaching source; P03 §8; imports cv_penguins.py | 984 |
| [cv_optuna.py.stdout.txt](programmes/cv_optuna.py.stdout.txt) | exact retained displayed stdout string; terminal process newline omitted; historical execution; P03 §8 | 112 |
| [fold_fitted_pipeline.py](programmes/fold_fitted_pipeline.py) | whole teaching source; P04 §2 | 11262 |
| [fold_fitted_pipeline.py.stdout.txt](programmes/fold_fitted_pipeline.py.stdout.txt) | complete actual raw stdout; successful current source; P04 §2 | 571 |
| [fold_fitted_pipeline.py.stderr.txt](programmes/fold_fitted_pipeline.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P04 §2 | 0 |
| [split_information_contracts.py](programmes/split_information_contracts.py) | whole teaching source; P05 §3; imports fold_fitted_pipeline.py | 5606 |
| [split_information_contracts.py.stdout.txt](programmes/split_information_contracts.py.stdout.txt) | complete actual raw stdout; successful current source; P05 §3 | 1720 |
| [split_information_contracts.py.stderr.txt](programmes/split_information_contracts.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P05 §3 | 0 |
| [finite_selection_optimism.py](programmes/finite_selection_optimism.py) | whole teaching source; P06 §4 | 1823 |
| [finite_selection_optimism.py.stdout.txt](programmes/finite_selection_optimism.py.stdout.txt) | complete actual raw stdout; successful current source; P06 §4 | 1300 |
| [finite_selection_optimism.py.stderr.txt](programmes/finite_selection_optimism.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P06 §4 | 0 |
| [nested_procedure_from_indices.py](programmes/nested_procedure_from_indices.py) | whole teaching source; P07 §4; imports fold_fitted_pipeline.py | 4433 |
| [nested_procedure_from_indices.py.stdout.txt](programmes/nested_procedure_from_indices.py.stdout.txt) | complete actual raw stdout; successful current source; P07 §4 | 12386 |
| [nested_procedure_from_indices.py.stderr.txt](programmes/nested_procedure_from_indices.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P07 §4 | 0 |
| [parameter_spaces_and_sampling.py](programmes/parameter_spaces_and_sampling.py) | whole teaching source; P08 §5 | 3807 |
| [parameter_spaces_and_sampling.py.stdout.txt](programmes/parameter_spaces_and_sampling.py.stdout.txt) | complete actual raw stdout; successful current source; P08 §5 | 1563 |
| [parameter_spaces_and_sampling.py.stderr.txt](programmes/parameter_spaces_and_sampling.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P08 §5 | 0 |
| [search_results_and_refit.py](programmes/search_results_and_refit.py) | whole teaching source; P09 §6; imports fold_fitted_pipeline.py | 4464 |
| [search_results_and_refit.py.stdout.txt](programmes/search_results_and_refit.py.stdout.txt) | complete actual raw stdout; successful current source; P09 §6 | 1729 |
| [search_results_and_refit.py.stderr.txt](programmes/search_results_and_refit.py.stderr.txt) | complete actual raw stderr; intentional invalid-candidate diagnostics; main exit0; P09 §6 | 2283 |
| [risk_and_covariance_exact.py](programmes/risk_and_covariance_exact.py) | whole teaching source; P10 §7 | 2353 |
| [risk_and_covariance_exact.py.stdout.txt](programmes/risk_and_covariance_exact.py.stdout.txt) | complete actual raw stdout; successful current source; P10 §7 | 551 |
| [risk_and_covariance_exact.py.stderr.txt](programmes/risk_and_covariance_exact.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P10 §7 | 0 |
| [bootstrap_the_whole_statistic.py](programmes/bootstrap_the_whole_statistic.py) | whole teaching source; P11 §7; imports fold_fitted_pipeline.py | 6610 |
| [bootstrap_the_whole_statistic.py.stdout.txt](programmes/bootstrap_the_whole_statistic.py.stdout.txt) | complete actual raw stdout; successful current source; P11 §7 | 12211 |
| [bootstrap_the_whole_statistic.py.stderr.txt](programmes/bootstrap_the_whole_statistic.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P11 §7 | 0 |
| [holdout_mse_identity.py](programmes/holdout_mse_identity.py) | whole teaching source; P12 §7 | 2576 |
| [holdout_mse_identity.py.stdout.txt](programmes/holdout_mse_identity.py.stdout.txt) | complete actual raw stdout; successful current source; P12 §7 | 309 |
| [holdout_mse_identity.py.stderr.txt](programmes/holdout_mse_identity.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P12 §7 | 0 |
| [discrete_adaptive_search.py](programmes/discrete_adaptive_search.py) | whole teaching source; P13 §8 | 5169 |
| [discrete_adaptive_search.py.stdout.txt](programmes/discrete_adaptive_search.py.stdout.txt) | complete actual raw stdout; successful current source; P13 §8 | 3410 |
| [discrete_adaptive_search.py.stderr.txt](programmes/discrete_adaptive_search.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P13 §8 | 0 |
| [resource_tournaments.py](programmes/resource_tournaments.py) | whole teaching source; P14 §8 | 4897 |
| [resource_tournaments.py.stdout.txt](programmes/resource_tournaments.py.stdout.txt) | complete actual raw stdout; successful current source; P14 §8 | 2546 |
| [resource_tournaments.py.stderr.txt](programmes/resource_tournaments.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P14 §8 | 0 |
| [ordinary_halving_audit.py](programmes/ordinary_halving_audit.py) | whole teaching source; P15 §8 | 2545 |
| [ordinary_halving_audit.py.stdout.txt](programmes/ordinary_halving_audit.py.stdout.txt) | complete actual raw stdout; successful current source; P15 §8 | 2977 |
| [ordinary_halving_audit.py.stderr.txt](programmes/ordinary_halving_audit.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; P15 §8 | 0 |
| [practice_answers.py](programmes/practice_answers.py) | optional changed-task answer source; A01 §10; imports fold_fitted_pipeline.py, split_information_contracts.py, search_results_and_refit.py, bootstrap_the_whole_statistic.py, resource_tournaments.py | 4932 |
| [practice_answers.py.stdout.txt](programmes/practice_answers.py.stdout.txt) | complete actual raw stdout; successful current source; A01 §10 | 2524 |
| [practice_answers.py.stderr.txt](programmes/practice_answers.py.stderr.txt) | complete actual raw stderr; zero captured bytes, not an absent stream; A01 §10 | 0 |
| [penguins.csv](programmes/penguins.csv) | exact current offline CSV, CRLF; historical LF-normalized content matches | 15586 |
| [nested-experiment.json](programmes/nested-experiment.json) | exact retained full nested experiment arrays and selection record | 16989 |
| [calculated-inputs.json](programmes/calculated-inputs.json) | exact retained full calculated inputs, historical numerical evidence; no replay | 82281 |
| [data-provenance.md](programmes/data-provenance.md) | exact historical provenance; LF byte/hash statement retained and qualified in setup | 3770 |
| [README.md](programmes/README.md) | run/setup and dependency instructions | 3673 |
| [requirements.txt](programmes/requirements.txt) | pins of actual tested new-code environment | 61 |
| [requirements-optuna.txt](programmes/requirements-optuna.txt) | optional original adaptive-programme dependency; historical Optuna5.0.0, not installed/run anew | 34 |
