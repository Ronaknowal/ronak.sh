"""A descriptive measured-data regression with equivalent factor coordinates.

Run: python iris_factored_regression.py iris-corrected.csv
Requires NumPy. Use the attributed corrected UCI Iris CSV from the
Eigenvalues lesson. No train/test or population-performance claim.
All 150 rows contribute equally. Species is checked but not used to fit.
Explicit exact moments cost O(n); array fitting/predictions cost O(n).
Dense two-parameter Hessian and eigenpair diagnostics are O(1) here.
"""
import csv
import math
import sys
from fractions import Fraction as F
import numpy as np


def read_data(path):
    with open(path, encoding="utf-8", newline="") as stream:
        reader = csv.DictReader(stream)
        expected = ["sepal length", "sepal width", "petal length", "petal width", "species"]
        if reader.fieldnames != expected:
            raise ValueError("Use the corrected Iris CSV with the published five-column header")
        rows = list(reader)
    if len(rows) != 150:
        raise ValueError("This worked example requires all 150 published rows")
    species = {"Iris-setosa", "Iris-versicolor", "Iris-virginica"}
    x, y = [], []
    for row in rows:
        if None in row or row["species"] not in species:
            raise ValueError("Malformed row or unknown species")
        values = [F(row[key]) for key in expected[:4]]
        if any(v <= 0 or v > 20 for v in values):
            raise ValueError("Measurements must be positive and at most 20 centimetres")
        x.append(values[0]); y.append(values[2])
    return x, y


def main(path):
    x, y = read_data(path)
    n = len(x)
    mean_x, mean_y = sum(x) / n, sum(y) / n
    xc, yc = [v-mean_x for v in x], [v-mean_y for v in y]
    moment = sum(v*v for v in xc) / n
    if not moment:
        raise ValueError("The sepal measurement must vary")
    beta = sum(u*v for u, v in zip(xc, yc)) / (n*moment)
    exact_loss = sum((beta*u-v)**2 for u, v in zip(xc, yc)) / (2*n)
    X, Y = np.array(xc, float), np.array(yc, float)
    fitted, residuals, rank, singular = np.linalg.lstsq(X[:, None], Y, rcond=None)
    np.testing.assert_allclose(fitted[0], float(beta), rtol=1e-14, atol=1e-14)
    assert rank == 1 and residuals.shape == (1,) and singular[0] > 0
    np.testing.assert_allclose(residuals[0]/(2*n), float(exact_loss), rtol=1e-13)
    print(f"n={n} mean sepal={float(mean_x):.9f} cm mean petal={float(mean_y):.9f} cm")
    print(f"slope exact={beta} numpy={fitted[0]:.9f} petal-cm/sepal-cm")
    print(f"centred sepal second moment={float(moment):.9f} cm^2")
    print(f"minimum half-mean-square loss={float(exact_loss):.9f} cm^2")
    baseline = float(mean_y) + float(beta)*X
    for scale in [1., 4.]:
        a, b = scale*math.sqrt(float(beta)), math.sqrt(float(beta))/scale
        predictions = float(mean_y) + (a*b)*X
        H = float(moment) * np.array([[b*b, a*b], [a*b, a*a]])
        values, vectors = np.linalg.eigh(H)
        assert np.linalg.norm(H@vectors - vectors*values) < 1e-12
        discrepancy = np.max(np.abs(predictions-baseline))
        assert discrepancy < 1e-12
        print(f"scale={scale:g} a={a:.9f} b={b:.9f} product={a*b:.9f} "
              f"H eigenvalues={values.round(9).tolist()} prediction error={discrepancy:.3e}")
    print(f"origin Hessian eigenvalues={[-float(moment*beta), float(moment*beta)]}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Run: python iris_factored_regression.py iris-corrected.csv")
    main(sys.argv[1])
