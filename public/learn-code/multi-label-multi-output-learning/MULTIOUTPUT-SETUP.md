# Run the Multi-Output programs

Use Python 3.12 with NumPy, SciPy and scikit-learn. The recorded environment used
NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; other versions can produce different
new fits. The archival workbook recorder additionally imports openpyxl.

For the ordinary offline Energy route, place these eight files in one directory:

- `energy-multioutput-learning.py`
- `energy_multioutput_core.py`
- `energy-recorded-assets.json`
- `energy-efficiency.csv`
- `energy-efficiency-provenance.json`
- `energy-multioutput-results.json`
- `energy-multioutput-models.json`
- `energy-multioutput-selection-lock.json`

Run these commands from that directory:

```sh
python energy-multioutput-learning.py --report
python energy-multioutput-learning.py --query --model overall --row 4
python energy-multioutput-learning.py --query --model S2 --features .9,563.5,318.5,122.5,7,2,0,0
```

The report reads all twelve saved fitted candidates and the mean baseline; it
does not select a different winner. The overall query predicts approximately
`[24.960854,26.882095]` in the supplied heating/cooling units. S2 predicts
approximately `[18.453863,23.917379]`. Both operations read saved arrays and make
zero fits. Feature order is X1…X8. Orientation/X6 accepts 2/3/4/5; distribution/X8
accepts 0/1/2/3/4/5. An arbitrary finite query is a calculation, not necessarily a
plausible configuration. `--assets DIRECTORY` selects another directory that
contains the same five byte-bound recorded data files and their manifest.

For a complete learner-owned new fitting example, also place
`own-multioutput-example.csv` and `own-multioutput-task.json` together. The JSON
declares their exact bytes, twelve invented rows, six two-row geometry groups,
train 8/validation 2/test 2 row IDs and three Ridge strengths before any fit. Its
two outputs are deliberately invented affine values, not a second Energy
simulation. The source is supplied for a new independent run; no fitted result
for this fixture is claimed here.

```sh
python energy-multioutput-learning.py --fit-own own-multioutput-task.json --output own-results
```

`own-results` must be absent. Each declared candidate gets a fresh ordinary
pipeline, training-only input/target transforms and a saved validation outcome.
Minimum-first validation selection writes an exclusive lock before any test
score. The same fitted winner is saved without training+validation refit. A
failed candidate remains recorded; no valid candidate blocks selection. Make a
separate declaration and new directory before changing the data, partition or
candidate order. This entry rejects the recorded Energy CSV for `--fit-own`;
it cannot overwrite or replay the published measured campaign.

`energy-multioutput-study.py` is the exact complete archival recorder behind that
campaign, including its original preparation/once guards. It is available to
inspect the recorded protocol, but is not invoked by the ordinary learner CLI.
The eight listed files are the complete report/query input set.

For the other local import groups, put `multioutput_newton.py` beside
`masked-binary-heads.py` and `chain_core.py`. Put both `multioutput_newton.py` and
`chain_core.py` beside `chain-fit-and-decode.py`. They are full dependencies;
imports do not run their standalone examples. Other original/new mains retain
their documented NumPy/scikit-learn environment and source-specific fixtures.
