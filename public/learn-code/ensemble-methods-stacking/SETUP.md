# Complete program setup

The new programs were checked with Python3.12.14, NumPy2.3.5, SciPy1.18.1 and
scikit-learn1.9.1. Create an environment and install the pinned requirements:

```sh
python -m venv .venv
python -m pip install -r requirements.txt
```

Activate that environment using the command appropriate to your shell, or invoke
its Python directly. The programs print their actual intermediate quantities
and return state through named functions. Importing a program does not execute
its guarded main. The exact reused `newton-logistic.py` file is distributed as
a local dependency; its SHA256 is
`7bf43c6932d8aeb13aec429499b7c8a741d4e87ba2af92d1791fbe8a6ad4e660`.
The ensemble programs import its functions without running its historical main.

| Program | Files required beside it | Execute |
| --- | --- | --- |
| Combination core | itself | `python ensemble-combination-core.py` |
| OOF state | combination core, exact Newton file | `python ensemble-oof-state.py` |
| Nested selection | itself | `python ensemble-nested-selection.py` |
| Blend/calibration | OOF state, combination core, exact Newton file | `python ensemble-blend-calibrate.py` |
| Context gradients | itself | `python ensemble-context-gradients.py` |
| Stump sweep | itself | `python ensemble-stump-sweep.py` |
| Real comparison | OOF state, combination core, exact Newton file, offline CSV/protocol, `DATA.md` | command below |

For downloaded real-study files, pass their locations explicitly:

```sh
python ensemble-real-comparison.py --csv wdbc-sklearn-1.9.1.csv --protocol reading-flow-proposed-data.json
python ensemble-real-comparison.py --csv wdbc-sklearn-1.9.1.csv --protocol reading-flow-proposed-data.json --run-study --output my-wdbc-results
```

The first command performs schema/hash/split preflight only, with no fit. The
second explicitly runs the declared experiment and creates its exclusive start
marker, selection frozen before test, serving bundle, complete receipt and
prediction arrays. An existing start marker refuses another run into the same
directory, including after a failure. The lesson's recorded campaign executed
once; its stored outputs are supplied for inspection without rerunning it.
Changing a protocol or choosing another model requires stating that changed
experiment and evaluation boundary rather than replacing the recorded result.

Original eleven complete programs retain their original source and output
identities and individual setup explanations. Their code routes include
standard-library exact fractions, NumPy and ordinary sklearn primitives. The
index marks them as retained observations rather than executions of every old
main in this revision. The exact Newton main is a previously published example,
not an additional ensemble measurement.
