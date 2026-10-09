"""Offline descriptive comparison of the corrected UCI Iris measurements."""
import csv
import hashlib
import math
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.metrics.pairwise import rbf_kernel

from fdiv_blockwise import mmd2

CSV_SHA256 = "5a8853b2e82f9d021e5843af7d647339e359b25e037ec6e87e23ca9e91507821"
FEATURES = ("sepal length", "sepal width", "petal length", "petal width")


def load_rows():
    path = Path(__file__).with_name("iris-corrected.csv")
    if hashlib.sha256(path.read_bytes()).hexdigest() != CSV_SHA256:
        raise ValueError("Use the supplied corrected Iris CSV.")
    with path.open(encoding="utf-8", newline="") as stream:
        records = list(csv.DictReader(stream))
    rows = [(index, record["species"], [float(record[name]) for name in FEATURES])
            for index, record in enumerate(records, start=1)]
    counts = Counter(species for _, species, _ in rows)
    if len(rows) != 150 or counts != {"Iris-setosa":50,"Iris-versicolor":50,"Iris-virginica":50}:
        raise ValueError("Expected 150 measurements, 50 from each named species.")
    if any(not math.isfinite(v) for _, _, values in rows for v in values):
        raise ValueError("All four measurements must be finite.")
    return rows


def select(rows, species, columns):
    chosen = [(row_id, [values[j] for j in columns]) for row_id, label, values in rows if label == species]
    if not chosen:
        raise ValueError("Species selection is empty.")
    return [row_id for row_id, _ in chosen], np.asarray([values for _, values in chosen], dtype=float)


def scalar_mmd2(x, y, sigma):
    # x and y are small finite row arrays with the same physical coordinate units.
    def pair(a, b):
        squared = math.fsum(((float(u)-float(v))/sigma)**2 for u,v in zip(a,b))
        return math.exp(-squared/2)
    def mean(left, right):
        return math.fsum(pair(a,b) for a in left for b in right)/(len(left)*len(right))
    return mean(x,x)+mean(y,y)-2*mean(x,y)


def ordinary_mmd2(x, y, sigma):
    gamma = 1/(2*sigma**2)
    return float(rbf_kernel(x,gamma=gamma).mean()+rbf_kernel(y,gamma=gamma).mean()
                 -2*rbf_kernel(x,y,gamma=gamma).mean())


def main():
    rows = load_rows()
    print("rows / species counts", len(rows), dict(Counter(label for _,label,_ in rows)))
    sigma_cm = 1.
    for name, columns in (("sepal",(0,1)),("petal",(2,3))):
        x_ids, x = select(rows,"Iris-setosa",columns)
        y_ids, y = select(rows,"Iris-versicolor",columns)
        scalar = scalar_mmd2(x,y,sigma_cm)
        blocked = mmd2(x,y,sigma_cm,block_size=16)
        ordinary = ordinary_mmd2(x,y,sigma_cm)
        scaled = ordinary_mmd2(10*x,10*y,10*sigma_cm)
        same = ordinary_mmd2(x,x,sigma_cm)
        assert max(abs(v-scalar) for v in (blocked,ordinary,scaled)) < 1e-12
        assert abs(same) < 1e-12
        distance = float(np.linalg.norm(x[0]-y[0]))
        similarity = math.exp(-distance**2/(2*sigma_cm**2))
        print(name,"shapes / first row IDs",x.shape,y.shape,x_ids[0],y_ids[0])
        print("scalar / blocked / ordinary / coordinated mm",[round(v,10) for v in (scalar,blocked,ordinary,scaled)])
        print("same-setosa / first-pair distance cm / similarity",[round(v,10) for v in (same,distance,similarity)])


if __name__ == "__main__":
    main()
