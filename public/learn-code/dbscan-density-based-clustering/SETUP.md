# Run the complete density-clustering programs

Keep the files linked in the lesson's file index together. `programs/` contains the new instructional programs, `iris.csv`, `recorded_iris_fits.json`, the Iris attribution, and the reused `disjoint_set.py` and `silhouette_chunked.py` helpers. `original-programs/` contains nine independent earlier demonstrations and their recorded expected text. A program imports siblings from its own directory; run it from that directory so its relative input paths resolve. For the standalone original `dbscan_iris.py`, copy the supplied [iris.csv](programs/iris.csv) beside that original file before running it: its `Path(__file__).with_name("iris.csv")` resolves beside the source. The new offline reader already receives the CSV beside its own source. The original demonstrations are separate files, not modules imported by the new programs.

## Prepare Python

The recorded new executions used Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1. Create a virtual environment with Python 3.12 and install these versions when you want the same instructional library interfaces. The selected examples compare specific finite cases; matching package versions does not promise identical floating-point text on every platform.

On Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1
.\.venv\Scripts\python.exe -X utf8 -B -c "import sys,numpy,scipy,sklearn; print(sys.version); print(numpy.__version__, scipy.__version__, sklearn.__version__)"
```

On macOS or Linux:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1
.venv/bin/python -B -c 'import sys,numpy,scipy,sklearn; print(sys.version); print(numpy.__version__, scipy.__version__, sklearn.__version__)'
```

Activation is optional: call the environment's Python executable directly. In the commands below, `python` means that executable. No R installation is needed for this lesson. The optional `hdbscan` package is discussed separately below.

## Choose the operation you have just studied

From `programs/`, run one complete file with `python -X utf8 -B filename.py`. The following sequence follows the lesson; each row names the purpose and the inputs it uses.

| File | Operation and input | Required sibling files |
| --- | --- | --- |
| `density_neighbourhoods.py` | Closed neighborhoods, rank including self, and great-circle distance on new tiny rows | none |
| `dbscan_on_demand.py` | Queue expansion and noise-to-border reassignment on five rows | `density_neighbourhoods.py` |
| `density_geometry.py` | Training means/scales, frozen transformation and changed distance geometry | `density_neighbourhoods.py`, `dbscan_on_demand.py` |
| `iris_density_analysis.py` | Validate 150 supplied Iris rows and read seven saved fit reports; it does not fit | `iris.csv`, `recorded_iris_fits.json` |
| `optics_ordering.py` | Indexed heap operations and a new four-row OPTICS comparison | `density_neighbourhoods.py` |
| `optics_radius_extraction.py` | Radius extraction from a supplied ordering and a new four-row direct comparison | `optics_ordering.py`, `dbscan_on_demand.py`, `density_neighbourhoods.py` |
| `optics_xi_extraction.py` | Xi extraction from fixed reachability arrays and three supplied strips | `optics_radius_extraction.py` and its dependencies |
| `mutual_reachability_tree.py` | On-demand Prim edges and threshold components on four rows | `disjoint_set.py`, `density_neighbourhoods.py` |
| `density_hierarchy.py` | Equal-weight merge batches, condensation, EOM, strengths and GLOSH on supplied weighted trees | `disjoint_set.py`, `mutual_reachability_tree.py` and its dependencies |
| `density_validity.py` | Strict finite Euclidean DBCV and explicitly different reference conventions | `mutual_reachability_tree.py` and its dependencies |
| `density_query_extensions.py` | Weighted neighborhoods, supplied sparse distances, halo reconciliation and frozen-core queries | `disjoint_set.py`, `density_neighbourhoods.py`, `dbscan_on_demand.py` |
| `density_metrics.py` | General ID/noise alignment, pair agreement and focal silhouette | `silhouette_chunked.py` |
| `density_analysis_template.py` | Training-only scaling, candidate selection, frozen reporting, ordinary pipeline and held-out queries on eight constructed rows | all imported density helpers and their dependencies; no Iris file required for the default route |

The file index supplies every dependency, not only the file whose main function you are running. Importing a new helper does not run its guarded `main()`. The reused whole silhouette source also has a guarded demonstration; the new adapter calls its function, not that demonstration.

The template's default eight rows are a constructed computational example, not a new real-data benchmark. Its optional CSV reader accepts an ID column and finite feature columns; that input branch is explained in the source but was not exercised in the recorded default execution. Supply data only after deciding which columns represent observations, which metric is appropriate, and which annotations must remain outside the fitting features.

## Read outputs with their source versions

The nine earlier demonstrations have `*.recorded.txt` files containing the preserved recorded text. They were not rerun for this manuscript. Their standalone sources remain complete, including their original fitting operations. The seven Iris fit reports retain their original descriptive sample, settings, labels and scores; the offline reader validates and displays those records rather than refreshing their dates or recomputing their science. Missing numerical scaler arrays are drawn symbolically with their dimensions in the lesson.

The new programs each have their once-recorded `*.stdout.txt`, empty `*.stderr.txt`, and execution receipt. Three displays require a version distinction:

| Current source | Displayed stream | What was checked after that execution |
| --- | --- | --- |
| `density_validity.py` | Preceding source version's once-executed stream | Current finite-overflow status handling and the optional Euclidean-only metric guard were checked with bounded function probes; its full main was not rerun |
| `density_query_extensions.py` | Preceding source version's once-executed stream | Current sparse adjacency construction visits stored entries instead of scanning absent columns; supplied sparse-state function probes checked copied input and explicit zeros; its full main was not rerun |
| `density_analysis_template.py` | The unchanged template's once-executed stream with preceding versions of those two helpers | The template source is unchanged; its displayed output is not claimed to be a new execution against the current helper bundle |

The executed predecessors of the two changed helpers are preserved in `source-review/predecessors/`. `source-review/source-deltas.json` records the exact forward and inverse changes; `source-review/function-checks.json` records the separate current bounded probes. All other new source/stream displays refer to their actual once-executed sources. Copying current files gives the current implementation; copying an attributed stream gives recorded text, not a promise that an unexecuted route produced it.

The original radius-extraction execution receipt's import inventory omitted an indented main import of `dbscan_on_demand`. That receipt remains unchanged. A subsequent Xi dependency inventory includes that unchanged source and its transitive dependencies; it is a later dependency check, not a retroactive execution guard for the earlier run.

## Ordinary tools and convention boundaries

The ordinary routes use the actual NumPy/SciPy/scikit-learn APIs shown in the complete sources: neighbor queries, `StandardScaler`, `DBSCAN`, `OPTICS`, radius/Xi extraction, minimum spanning tree comparison, sparse input and `Pipeline`. Scratch comparisons are restricted to the specified finite rows, declared metric, tie rule and parameter convention. In particular, sorted rank counts self, sparse absence is not distance zero, and HDBSCAN package `min_samples` conventions differ.

`density_validity.py` also exposes an optional call to `hdbscan.validity.validity_index` for Euclidean inputs. That actual optional API route was not executed. The research source inspected contrib `hdbscan` 0.8.44 and an exact pinned implementation; the local convention adapters are named teaching calculations, not claims of executed upstream parity. Install the optional package only when you want to investigate its separate convention and compatibility. The strict scratch score can diagnose unsupported small/degenerate clusters instead of returning a fabricated scalar.

`density_hierarchy.py` teaches finite positive merge-tree operations. Its supplied trees are not claimed to be fitted Euclidean mutual-reachability trees. The ordinary HDBSCAN source in the original demonstrations and the manuscript's documented API route have their own clearly attributed roles. A membership strength and GLOSH number are hierarchy-relative quantities, not calibrated posterior probabilities.

For scientific interpretation, read the lesson's annotated sources and convention explanations before comparing numbers from different packages. The author did not read the full 2013/2015 original HDBSCAN paper bodies or view the main DBCV Figures 1/2 pixels; the documented access limits and qualified finite claims remain explicit. Scientific interpretation therefore follows the stated geometry, population and source convention.
