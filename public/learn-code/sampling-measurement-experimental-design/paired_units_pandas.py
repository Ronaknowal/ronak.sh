import sys
from pathlib import Path
import numpy as np
import pandas as pd

if len(sys.argv) != 2:
    raise SystemExit("Usage: python paired_units_pandas.py sleep-pairs.csv")
wide = pd.read_csv(Path(sys.argv[1]))
required = ["id", "drug1_extra_hours", "drug2_extra_hours"]
if list(wide.columns) != required or wide["id"].duplicated().any() or wide.isna().any().any():
    raise ValueError("Expected unique unit IDs and two complete recorded measurements")
if len(wide) < 2:
    raise ValueError("At least two paired people required for the sample variance estimate")
if not np.isfinite(wide[required[1:]].to_numpy(dtype=float)).all():
    raise ValueError("Recorded quantities must be finite numeric values")
long = wide.melt(id_vars="id", var_name="condition", value_name="extra_hours")
paired = long.pivot(index="id", columns="condition", values="extra_hours")
difference = paired["drug2_extra_hours"] - paired["drug1_extra_hours"]
print("recorded rows:", len(long), "paired people:", len(paired))
print("per-person differences:", ", ".join(f"{x:.1f}" for x in difference))
print("observed mean difference:", f"{difference.mean():.6f}", "hours")
# A model-based standard error uses independent people, not independent rows.
se = difference.std(ddof=1) / np.sqrt(len(difference))
print("iid-pair model SE:", f"{se:.6f}", "hours")
copied = pd.concat([long] * 5, ignore_index=True)
print("copied rows:", len(copied), "distinct people:", copied["id"].nunique())
rejected = False
try:
    copied.pivot(index="id", columns="condition", values="extra_hours")
except ValueError:
    rejected = True
print("duplicate unit-condition records rejected:", rejected)
