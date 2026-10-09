# Feature preparation: complete offline learner files

Keep this directory together: new programs import named helpers from their
neighbors. Save penguins.csv beside penguins_prepare.py. No program downloads
data or needs a repository checkout. The attached CSV retains all 344 rows and
NA cells in source order, under the Palmer Penguins project's CC0 terms.

Create a local Python 3.12 environment, activate it, install the direct dependencies
once, then run a named file:

```shell
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux alternative:
# source .venv/bin/activate
python -m pip install -r requirements.txt
python fitted_rulers.py
python fitted_target_encoding.py
python conditional_iterative_completion.py
```

The new constructed programs were actually checked with Python 3.12.14,
NumPy 2.3.5, SciPy 1.18.1, pandas 3.0.1 and scikit-learn 1.9.1. Python 3.12 is the tested
route; no claim of testing every supported Python version is made. The dependency
file pins that observed route. IEEE floating-point final digits, sparse formatting
and random generators can differ on another environment.

The retained fitted_preparation.py, penguins_prepare.py and cross_fit.py and their
stdout are exact historical literals from the 2026-09-21 native receipt, with
NumPy 2.3.5, pandas 3.0.1, scikit-learn 1.9.1 and the Python 3.12 route. They were NOT
replayed for this revision. You may run them locally; a new local result should be
recorded as your run, rather than relabeling the preserved output. cross_fit.py is
the bounded alpha2 example; fitted_target_encoding.py is the validated successor
for empty/no-match/alpha0/group/time policies.

Every displayed complete Python source has its adjacent `.stdout.txt`. The three
retained streams contain their exact historical bytes without an added newline.
New streams are exact captured process bytes; Windows CRLF output is retained.
The lesson presents them literally, with code/output pairing and role labels.
Nonempty `.stderr.txt` is a separate diagnostic stream. The bin program's warning
documents removed near-zero-width quantile bins. The iterative program captures
and prints the actual cap warning in stdout. Final source identities and the
successful-run bindings are in the author packet, alongside preserved failed
attempts; failure logs are evidence assets, not learner example downloads.

The optional multiple_imputation_mice.R requires R and mice, with its own
`install.packages('mice')` and `Rscript multiple_imputation_mice.R` instructions
inside the source. Its source was authored, but R execution/output is NOT claimed.
It is an additional ordinary-tool route, not a seventeenth Python teaching
programme or a Python dependency. Scientific model/diagnostic assumptions remain
necessary; pool() does not certify them.

practice_solutions.py is an **answer asset**, listed separately. It imports only
the new modules, contains complete changed-input answer functions including the
eight-coordinate sensor example, and has its own actual output. Do not bundle it
silently with an exercise-only download. Teaching code remains visible in the
reader; solutions alone may be disclosed after an attempt.

The real input has two exact byte roles:

- Current attached CSV: 15586 bytes, CRLF, SHA-256
  `79995be0ba7a6df1e9309e399a23438c0854f959d29950885dafb94ab881be68`.
- Historical executed input: 15241 bytes, LF. Its full SHA-256 is recorded in
  source-roles.json. Exact CRLF→LF replacement produces those bytes. Parsed
  observations are identical, but this byte relation is not a new fit.

calculated-inputs.json retains the original full train/test indices, fitted
statistics, predictions and 86 transformed held-out rows. scaling-native.json is
the historical verbatim source/stdout receipt. Their filenames and record roles
are preserved; neither is an automatically refreshed result of these new programs.

For every teaching code block, implementation must use the shared Copy/Download
controls, exact canonical filename and actual corresponding source. Copy reports
success/error accessibly, with temporary amber feedback and stable width. Large
files may load automatically near the viewport but must not require opening a
code disclosure. A download index links only actual learner files and labels
teaching, data, recorded-output, setup, optional-R and answer roles separately.
