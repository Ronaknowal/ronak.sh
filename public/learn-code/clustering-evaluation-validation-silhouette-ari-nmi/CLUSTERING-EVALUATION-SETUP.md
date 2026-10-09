# Run the clustering-evaluation programs

Download the files you want from the lesson's file index into one ordinary directory. Every example is a complete `.py` file rather than an isolated notebook cell. Open a terminal in that directory. The commands below use `python`; on Windows use `py -3.12` instead if that is how your Python installation is selected.

The recorded instructional environment is Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1. The lesson's output-provenance paragraph distinguishes recorded streams, the two text projections, the Gap predecessor-output attribution and the source-only R route. An output from a different installed version or platform may differ in printed precision, fitting labels, initialization details or safeguards. Nominal label renaming alone does not change a partition. Read the declared mechanism and fitting contract before comparing output.

Create a local environment and install the ordinary packages:

```bash
python -m venv .venv
```

Activate it with `.venv\Scripts\activate` on Windows Command Prompt, `.venv\Scripts\Activate.ps1` in PowerShell, or `source .venv/bin/activate` on macOS/Linux. Then install the versions used by these examples:

```bash
python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1
```

A compatible newer environment is a reasonable exploration, but it is a separate run. These instructions do not claim an environment was installed on your computer. No Torch, GPU, Jupyter, web service or author verification harness is needed. The memory-intensive dense example uses tiny data intentionally; prefer the chunked route for a larger dense comparison.

## Begin with a neighborhood and a pair board

```bash
python silhouette_dense_reference.py
python pair_agreement_reference.py
python information_scores.py --core
```

The first two commands run the complete original small examples. `--core` on the new information program restricts its printed demonstration to the already explained entropy/MI/NMI route; the complete source remains visible. Without that option, the program also computes expected MI/AMI and checks the named ordinary APIs.

The six conserved original files are `silhouette_dense_reference.py`, `pair_agreement_reference.py`, `fixed_margin_enumeration.py`, `iris_descriptive_comparison.py`, `weighted_probe_stability.py` and `iris_heldout_report.py`. Download the corresponding complete files from the lesson's file index.

## Keep sibling helpers beside their callers

Run the deeper programs after reading the mechanisms they implement:

```bash
python internal_indices.py
python information_scores.py
python partition_diagnostics.py
python coassignment_support.py
python gap_reference.py
python cophenetic_fidelity.py
python silhouette_chunked.py
python silhouette_focal_sample.py
```

`partition_diagnostics.py` imports `information_scores.py`. `silhouette_focal_sample.py` imports `silhouette_chunked.py`. Put each caller and helper in the same directory; importing the helpers does not run their demonstrations because their main blocks are guarded. All helper source is included in the lesson. These are the eight additional new diagnostic/computation files; the ninth new file is the portable report below. The small examples are declared constructed fixtures, not extra sampled Iris studies. The downloadable Gap source now chooses SVD factor size from table shape while retaining every right axis. Its displayed output is the unchanged recorded run of the preceding full-SVD source; only small function-extracted geometry probes assess the successor. Running the command above creates a separate execution.

The original seventy-assignment enumeration and exact weighted-probe fit are also executable:

```bash
python fixed_margin_enumeration.py
python weighted_probe_stability.py
```

Neither seed nor a larger iteration count makes repeated training IDs into new distinct evaluation observations. The weighted-probe program enumerates tiny sorted one-dimensional cuts. It is not a general-purpose exact multi-dimensional KMeans solver.

## Use the exact real-data file

Save [iris.csv](../programs/iris.csv) beside the two original Iris programs and run from that directory:

```bash
python iris_descriptive_comparison.py
python iris_heldout_report.py
```

This CSV contains the corrected offline scikit-learn Iris measurements, four named centimetre features, `row_id` and species annotation. Its SHA-256 is `13c9255444bce09fd9df60cccfec34d5b0a0eeebc06008fb4e2b836aa2caf78a`. Preserve feature order and IDs; ID/species never enter the fitting feature array. Iris is Fisher's real historical dataset, UCI DOI [10.24432/C56C76](https://doi.org/10.24432/C56C76), licensed CC BY 4.0. The [provenance note](../../../drafts/clustering-evaluation-validation-silhouette-ari-nmi/data-provenance.md) explains why the corrected offline copy differs from older copies at two records. There is no online data fetch in these examples.

The descriptive program fits transformations on all 150 rows to describe that fixed dataset. The held-out program uses its separate 90/30/30 fit/selection/report protocol. Do not substitute whole-set descriptive fitted state into the report protocol. If you change rows or preprocessing, label the new analysis honestly.

## Make a report on your own CSV

First run the complete deterministic forty-row tutorial fixture:

```bash
python clustering_report_template.py
```

This new two-feature fixture is explicitly constructed. Its displayed current output includes actual training-only scaler means/scales, the chosen center array, role IDs, eligibility and report results. The displayed report dictionary retains that recorded numerical state and scratch residual check; its compact input label is a text projection.

For an ordinary CSV, choose stable unique IDs and declare numeric feature columns explicitly:

```bash
python clustering_report_template.py --csv objects.csv --features length width depth --id-column object_id --reference-column material
```

The optional `--reference-column` supplies an afterward annotation. Omit it if your data has no complete reference assignment. It must not also be a fitting feature. Feature cells must be finite numeric values; empty or duplicate IDs and incomplete annotations cause a specific error. Decide a missing-data policy before entering this small template. Its default candidate k values, minimum fitting-group size, 60/20/20 split and score/tie rule are declared teaching choices; use `--candidates` and `--minimum-fit-size` or inspect the complete source to change task choices when your use requires it. Keep a record of changes and reserve final report rows before using them to choose anything.

No rejecting method is fitted here, so assignment coverage is 1. A method with abstention requires the lesson's explicit inclusion and coverage policy. The template's scratch nearest-center distortion and ordinary `transform` counterpart use frozen fitted centers in the same standardized geometry.

## The ordinary R alternative is source-only here

`gap_reference_R.R` uses the `cluster` package's `clusGap`, `spaceH0="scaledPCA"`, `d.power=2` and `maxSE`'s `Tibs2001SEmax` route. It is a complete calling example, but no R run or output is claimed in this lesson. In an R installation with that package available:

```bash
Rscript gap_reference_R.R
```

Read the finite-convention comparison first. Current R uses sample standard deviation across null replicates and a last-k fallback, while the Python reference uses the original B divisor and an explicit unresolved terminal boundary. Their sampling/fitting implementations and random streams also differ. Equal source intent does not promise byte-identical fits or selected k. Retain the output from your actual R environment if you make that comparison.

The lesson file index includes all fifteen Python files, this R file, the CSV and this guide. Its visible full sources and attributed outputs are sufficient for reading; running the programs is a concrete way to inspect and modify the taught operations.
