import numpy as np

def checked(v, budget):
    v = np.asarray(v, dtype=float)
    if v.shape != (2,) or not np.isfinite(v).all():
        raise ValueError("Expected two finite coordinates")
    if not np.isfinite(budget) or budget <= 0:
        raise ValueError("Budget must be finite and positive")
    return v

def line_projection(v, budget):
    v = checked(v, budget)
    return v - (v.sum() - budget) / 2

def simplex_projection(v, budget):
    v = checked(v, budget)
    first = np.clip((v[0] - v[1] + budget) / 2, 0, budget)
    return np.array([first, budget - first])

c = np.array([2.0, -0.6])
first_order = line_projection(np.maximum(c, 0), 1)
reverse_order = np.maximum(line_projection(c, 1), 0)
exact = simplex_projection(c, 1)
for name, point in [("C then D", first_order),
                    ("D then C", reverse_order), ("Intersection", exact)]:
    print(name, np.round(point, 5).tolist(),
          "sum", round(float(point.sum()), 5),
          "minimum", round(float(point.min()), 5))