What happens if we repeat that same H-first sweep forty times?

The following complete original `nmf_step.py` keeps D25's three observations and positive starting factors. Save it in the same local Python environment as the other supplied files and run `python nmf_step.py` deliberately. It needs NumPy only; it does not fetch data or call a library NMF estimator.

```python title="nmf_step.py"
import numpy as np

X = np.array([[2., 1., 3.], [1., 2., 3.], [3., 3., 6.]])
W = np.array([[1., .5], [.5, 1.], [1., 1.]])
H = np.array([[1., .2, .8], [.2, 1., .8]])

def objective(X, W, H):
    return np.sum((X - W @ H) ** 2) / 2

print(0, round(objective(X, W, H), 8))
for iteration in range(1, 41):
    H *= (W.T @ X) / ((W.T @ W) @ H)
    W *= (X @ H.T) / (W @ (H @ H.T))
    if iteration in (1, 2, 10, 40):
        print(iteration, round(objective(X, W, H), 8))
```

Read the two assignments in order. The first computes every H multiplier from the old W/H and then changes H in place. The next computes W's multipliers using that **new H**. The loop prints the initial half-loss, then only sweeps1,2,10 and40; the unprinted sweeps still occur. Here is the original recorded output, preserved rather than rerun:

```text
0 17.06
1 0.03944744
2 0.02823377
10 0.00180608
40 5e-08
```

At printed sweep1 the loss is0.03944744, the rounded result of D25's literal one-step calculation. By sweep40 the printed loss is5×10⁻⁸, small but not an exact zero or a convergence certificate. The program runs a fixed number of sweeps and prints no projected-gradient diagnostic; it neither proves the best joint factorization nor establishes that its factors equal the ones from section1. Its observations and initial factors are the separately announced D25 fixture, and scale/nonuniqueness remain possible.

This short historical positive-input demonstration intentionally exposes the two array updates without general shape, domain, overflow or stopping checks. The complete validated `nmf_multiplicative.py` route later in this section supplies those contracts. Do not add a hidden epsilon or reinterpret this retained rounded output as a newly executed benchmark. Its code and output are the original preserved example; the newly authored robust route and its independently labelled streams have their own evidence.

