"""N2: inspect every cell; covariance alone cannot certify independence."""
import numpy as np


def law(values):
    p = np.array(values, dtype=float, copy=True)
    if p.ndim != 2 or min(p.shape) == 0 or not np.isfinite(p).all() or np.any(p < 0):
        raise ValueError("Expected a finite nonnegative joint probability table")
    mass = p.sum()
    if not np.isfinite(mass) or mass <= 0 or not np.isclose(mass, 1., rtol=0., atol=1e-12):
        raise ValueError("Probabilities must already sum to one; no silent renormalization")
    return p


def summarize(values, row_values, column_values):
    p = law(values)
    u, v = np.asarray(row_values, float), np.asarray(column_values, float)
    if u.shape != (p.shape[0],) or v.shape != (p.shape[1],) or not np.isfinite(u).all() or not np.isfinite(v).all():
        raise ValueError("Finite labels must match probability axes")
    pu, pv = p.sum(1), p.sum(0)
    product = np.outer(pu, pv)
    with np.errstate(over="ignore", invalid="ignore"):
        eu, ev = pu @ u, pv @ v
        covariance = np.sum(p * (u[:, None] - eu) * (v[None, :] - ev))
    mask = p > 0
    # Positive joint mass necessarily has positive marginal product.
    # Subtract logs before multiplication: pu*pv may underflow even though both
    # positive marginals and the resulting mutual information are representable.
    row_mass = np.broadcast_to(pu[:, None], p.shape)[mask]
    column_mass = np.broadcast_to(pv[None, :], p.shape)[mask]
    mutual_information = np.sum(p[mask] * (np.log(p[mask]) - np.log(row_mass) - np.log(column_mass)))
    if not np.isfinite([eu, ev, covariance, mutual_information]).all():
        raise ValueError("Probability moments overflowed; rescale the value labels")
    return {"joint": p, "product": product, "means": np.array([eu, ev]),
            "covariance": float(covariance), "mi_nats": float(mutual_information),
            "independent": bool(np.allclose(p, product, rtol=0., atol=1e-12))}


def conditional_row(values, row):
    p = law(values)
    if isinstance(row, bool) or not isinstance(row, (int, np.integer)) or not 0 <= row < len(p):
        raise ValueError("Expected a valid row index")
    mass = p[row].sum()
    return None if mass == 0 else p[row] / mass


def uv_law(q):
    if not np.isfinite(q) or not 0 <= q <= 1:
        raise ValueError("Expected 0<=q<=1")
    dependent = np.array([[0., 1/3], [1/3, 0.], [0., 1/3]])
    return (1 - q) * np.outer([1/3]*3, [1/3, 2/3]) + q * dependent


def main():
    for q in [0., .5, 1.]:
        result = summarize(uv_law(q), [-1, 0, 1], [0, 1])
        print("q", q, "joint", result["joint"].tolist(), "product", result["product"].tolist(),
              "mean", result["means"].tolist(), "cov", result["covariance"],
              "MI_nats", round(result["mi_nats"], 9), "independent", result["independent"])
    diamond = np.array([[0., .25, 0.], [.25, 0., .25], [0., .25, 0.]])
    print("diamond", summarize(diamond, [-2**.5, 0, 2**.5], [-2**.5, 0, 2**.5]))
    print("zero_mass_condition", conditional_row([[1., 0.], [0., 0.]], 1))
    try:
        law([[.4, .4]])
    except ValueError as error:
        print("refused", str(error))


if __name__ == "__main__":
    main()
